import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  createAgentSession, createCodemodeExtension, createMcpExtension, createToolSearchExtension,
  DefaultResourceLoader, ModelRuntime, SessionManager, SettingsManager,
} from '@earendil-works/pi-coding-agent';

test('real SDK: coding tools, context discovery, built-ins, JSONL restoration, new session', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'self-growing-sdk-'));
  const cwd = join(directory, 'project');
  const agentDir = join(directory, 'agent');
  const sessionDir = join(directory, 'sessions');
  await Promise.all([cwd, agentDir, sessionDir].map(path => mkdir(path)));
  await writeFile(join(cwd, 'AGENTS.md'), 'SDK_DISCOVERY_MARKER: Keep the chat working.');
  await mkdir(join(cwd, '.pi/prompts'), { recursive: true });
  await mkdir(join(cwd, '.pi/skills/spike'), { recursive: true });
  await writeFile(join(cwd, '.pi/prompts/spike.md'), 'A discovered prompt template.');
  await writeFile(join(cwd, '.pi/skills/spike/SKILL.md'), '---\nname: spike\ndescription: SDK discovery fixture\n---\nA discovered skill.');
  await writeFile(join(cwd, '.pi/settings.json'), JSON.stringify({ defaultTools: ['+codemode', '+tool_search'] }));
  const runtime = await ModelRuntime.create({
    authPath: join(agentDir, 'auth.json'), modelsPath: null,
    modelsStorePath: join(agentDir, 'models-store.json'), refreshOnCreate: false,
  });
  const settingsManager = SettingsManager.create(cwd, agentDir);
  const resourceLoader = new DefaultResourceLoader({
    cwd, agentDir, settingsManager,
    extensionFactories: [createCodemodeExtension(), createToolSearchExtension(), createMcpExtension()],
  });
  let session: Awaited<ReturnType<typeof createAgentSession>>['session'] | undefined;
  try {
    await resourceLoader.reload({ resolveProjectTrust: async () => true });
    assert.equal(settingsManager.isProjectTrusted(), true);
    assert.ok(resourceLoader.getPrompts().prompts.some(prompt => prompt.name === 'spike'));
    assert.ok(resourceLoader.getSkills().skills.some(skill => skill.name === 'spike'));
    const manager = SessionManager.create(cwd, sessionDir);
    ({ session } = await createAgentSession({ cwd, agentDir, modelRuntime: runtime, settingsManager, resourceLoader, sessionManager: manager }));
    await session.bindExtensions({ mode: 'rpc' });
    for (const tool of ['codemode', 'tool_search']) assert.ok(session.getActiveToolNames().includes(tool), tool);
    for (const tool of ['read', 'bash', 'edit', 'write']) assert.ok(session.getActiveToolNames().includes(tool), tool);
    for (const tool of ['codemode', 'tool_search']) assert.ok(session.getAllTools().some(item => item.name === tool), tool);
    assert.ok(session.systemPrompt.includes('SDK_DISCOVERY_MARKER'));
    manager.appendMessage({ role: 'user', content: 'Saved prompt', timestamp: Date.now() });
    manager.appendMessage({
      role: 'assistant', content: [{ type: 'text', text: 'Saved reply' }],
      api: 'anthropic-messages', provider: 'anthropic', model: 'offline-fixture',
      usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0, totalTokens: 2,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
      stopReason: 'stop', timestamp: Date.now(),
    });
    const file = SessionManager.findById(cwd, session.sessionId, sessionDir);
    assert.ok(file, 'Pi persists its own JSONL file');
    session.dispose();
    const restoredManager = SessionManager.open(file, sessionDir);
    ({ session } = await createAgentSession({ cwd, agentDir, modelRuntime: runtime, settingsManager, resourceLoader, sessionManager: restoredManager }));
    assert.equal(session.messages.length, 2);
    assert.equal(session.messages[0].role, 'user');
    const fresh = SessionManager.create(cwd, sessionDir);
    assert.notEqual(fresh.getSessionId(), session.sessionId);
    assert.equal(fresh.buildSessionProjection().messages.length, 0);
    assert.deepEqual(session.clearQueue(), { steering: [], followUp: [] });
    await session.abort();
  } finally {
    session?.dispose();
    await rm(directory, { recursive: true, force: true });
  }
});
