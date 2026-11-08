import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';
import type { AssistantMessage, ToolCall, TranscriptContext } from '@earendil-works/pi-ai';
import { AssistantMessageEventStream } from '@earendil-works/pi-ai/utils/event-stream';
import {
  createAgentSession, DefaultResourceLoader, ModelRuntime, SessionManager, SettingsManager,
  type AgentSessionEvent,
} from '@earendil-works/pi-coding-agent';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

type Reply = (request: { index: number; context: TranscriptContext; signal?: AbortSignal }) => Promise<string | ToolCall>;
async function fixture(t: TestContext, reply: Reply, retries = 1) {
  const directory = await mkdtemp(join(tmpdir(), 'self-growing-sdk-lifecycle-'));
  const agentDir = join(directory, 'agent');
  await mkdir(agentDir);
  let dispose = async () => {};
  t.after(async () => { await dispose(); await rm(directory, { recursive: true, force: true }); });
  const runtime = await ModelRuntime.create({
    authPath: join(agentDir, 'auth.json'), modelsPath: null,
    modelsStorePath: join(agentDir, 'catalog.json'), refreshOnCreate: false,
  });
  const requests: TranscriptContext[] = [];
  runtime.registerProvider('offline-fixture', {
    api: 'anthropic-messages', apiKey: 'not-a-real-key', baseUrl: 'https://offline.invalid',
    models: [{ id: 'fixture', name: 'Offline fixture', reasoning: false, input: ['text'],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128_000, maxTokens: 1024 }],
    streamSimple: (model, context, options) => {
      const stream = new AssistantMessageEventStream();
      const index = requests.push(structuredClone(context));
      const message: AssistantMessage = {
        role: 'assistant', content: [], api: model.api, provider: model.provider, model: model.id,
        stopReason: 'stop', timestamp: Date.now(),
        usage: { input: 100, output: 10, cacheRead: 0, cacheWrite: 0, totalTokens: 110,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
      };
      queueMicrotask(() => { void (async () => {
        stream.push({ type: 'start', partial: message });
        try {
          const response = await reply({ index, context, signal: options?.signal });
          if (typeof response === 'string') {
            message.content = [{ type: 'text', text: '' }];
            stream.push({ type: 'text_start', contentIndex: 0, partial: message });
            message.content = [{ type: 'text', text: response }];
            stream.push({ type: 'text_delta', contentIndex: 0, delta: response, partial: message });
            stream.push({ type: 'text_end', contentIndex: 0, content: response, partial: message });
            stream.push({ type: 'done', reason: 'stop', message });
          } else {
            message.content = [response];
            message.stopReason = 'toolUse';
            stream.push({ type: 'toolcall_start', contentIndex: 0, partial: message });
            stream.push({ type: 'toolcall_end', contentIndex: 0, toolCall: response, partial: message });
            stream.push({ type: 'done', reason: 'toolUse', message });
          }
        } catch (error) {
          const reason = options?.signal?.aborted ? 'aborted' : 'error';
          message.stopReason = reason;
          message.errorMessage = String(error instanceof Error ? error.message : error);
          stream.push({ type: 'error', reason, error: message });
        }
        stream.end();
      })(); });
      return stream;
    },
  });
  const settingsManager = SettingsManager.create(directory, agentDir);
  const resourceLoader = new DefaultResourceLoader({ cwd: directory, agentDir, settingsManager });
  await resourceLoader.reload();
  // reload() reloads file-backed settings, so transient overrides must follow it.
  settingsManager.applyOverrides({
    retry: { enabled: true, maxRetries: retries, baseDelayMs: 1, maxAgentDelayMs: 1 },
    compaction: { enabled: false, reserveTokens: 1024, keepRecentTokens: 1 },
  });
  const model = runtime.getModel('offline-fixture', 'fixture');
  assert.ok(model);
  const { session } = await createAgentSession({
    cwd: directory, agentDir, modelRuntime: runtime, model, settingsManager, resourceLoader,
    sessionManager: SessionManager.create(directory, join(directory, 'sessions')),
  });
  const events: AgentSessionEvent[] = [];
  session.subscribe(event => events.push(event));
  await session.bindExtensions({ mode: 'rpc' });
  dispose = async () => { await session.abort(); session.dispose(); };
  return { session, requests, events, directory };
}

test('SDK executes the real coding read tool and returns its result to the provider', { timeout: 5000 }, async t => {
  let path = '';
  const { session, requests, events, directory } = await fixture(t, async ({ index }) => index === 1
    ? { type: 'toolCall', id: 'read-fixture', name: 'read', arguments: { path } }
    : 'Read completed');
  path = join(directory, 'marker.txt');
  await writeFile(path, 'REAL_CODING_TOOL_MARKER');
  await session.prompt('Read the test file');
  assert.equal(requests.length, 2);
  assert.ok(JSON.stringify(requests[1].messages).includes('REAL_CODING_TOOL_MARKER'));
  assert.ok(events.some(event => event.type === 'tool_execution_start' && event.toolName === 'read'));
  assert.equal(session.getLastAssistantText(), 'Read completed');
});

test('accepted receipt precedes completion; steering is queued and delivered in the same run', { timeout: 5000 }, async t => {
  const started = deferred();
  const release = deferred();
  const { session, requests, events } = await fixture(t, async ({ index }) => {
    if (index === 1) { started.resolve(); await release.promise; }
    return `Reply ${index}`;
  });
  const receipts: string[] = [];
  let completed = false;
  const run = session.prompt('Initial request', { preflightResult: value => receipts.push(value) })
    .then(() => { completed = true; });
  await started.promise;
  assert.deepEqual(receipts, ['started']);
  assert.equal(completed, false);
  await session.prompt('Change direction', { streamingBehavior: 'steer', preflightResult: value => receipts.push(value) });
  assert.deepEqual(receipts, ['started', 'queued']);
  assert.deepEqual(session.getSteeringMessages(), ['Change direction']);
  release.resolve();
  await run;
  assert.equal(requests.length, 2);
  assert.ok(JSON.stringify(requests[1].messages).includes('Change direction'));
  assert.equal(session.isIdle, true);
  assert.equal(events.filter(event => event.type === 'agent_settled').length, 1);
  assert.equal(session.getContextUsage()?.tokens, 110);
});

test('stop clears queued steering/follow-up and aborts an active provider request', { timeout: 5000 }, async t => {
  const started = deferred();
  const { session, requests, events } = await fixture(t, async ({ signal }) => {
    started.resolve();
    await new Promise<never>((_resolve, reject) => {
      const abort = () => reject(new Error('Request aborted'));
      if (signal?.aborted) abort();
      else signal?.addEventListener('abort', abort, { once: true });
    });
    return 'unreachable';
  });
  const run = session.prompt('Long request');
  await started.promise;
  await session.steer('Queued steering');
  await session.followUp('Queued follow-up');
  assert.deepEqual(session.clearQueue(), { steering: ['Queued steering'], followUp: ['Queued follow-up'] });
  await session.abort();
  await run;
  assert.equal(requests.length, 1);
  assert.equal(session.isIdle, true);
  assert.ok(events.some(event => event.type === 'agent_settled' && event.aborted));
});

test('prompt covers retry recovery and emits settled only after the recovered response', { timeout: 5000 }, async t => {
  const { session, requests, events } = await fixture(t, async ({ index }) => {
    if (index === 1) throw new Error('fetch failed');
    return 'Recovered successfully';
  });
  await session.prompt('Retry this request');
  assert.equal(requests.length, 2);
  assert.equal(session.getLastAssistantText(), 'Recovered successfully');
  assert.ok(events.some(event => event.type === 'agent_end' && event.willRetry));
  assert.ok(events.some(event => event.type === 'auto_retry_end' && event.success));
  assert.equal(events.at(-1)?.type, 'agent_settled');
});

test('exhausted retries settle without a successful assistant response', { timeout: 5000 }, async t => {
  const { session, requests, events } = await fixture(t, async () => { throw new Error('fetch failed'); });
  await session.prompt('Exhaust retries');
  assert.equal(requests.length, 2);
  assert.equal(session.isIdle, true);
  assert.ok(events.some(event => event.type === 'auto_retry_end' && !event.success));
  assert.equal(events.at(-1)?.type, 'agent_settled');
  const last = session.messages.at(-1);
  assert.ok(last?.role === 'assistant' && last.stopReason === 'error');
});

test('manual compaction uses the same runtime and persists a Pi compaction entry', { timeout: 5000 }, async t => {
  const { session, requests } = await fixture(t, async ({ index }) => `Offline response ${index}: ${'summary '.repeat(100)}`);
  await session.prompt('First turn');
  await session.prompt('Second turn');
  await session.prompt('Third turn');
  const result = await session.compact('Preserve the test marker');
  assert.ok(result.summary.includes('Offline response'));
  // Compaction may summarize both older context and a split turn.
  assert.ok(requests.length > 3);
  assert.ok(requests.slice(3).some(request => JSON.stringify(request.messages).includes('Preserve the test marker')));
  assert.ok(session.sessionManager.getEntries().some(entry => entry.type === 'compaction'));
});
