import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createAgentSession, createCodemodeExtension, createMcpExtension,
  createToolSearchExtension, DefaultResourceLoader, getAgentDir,
  ModelRuntime, SessionManager, SettingsManager, type AgentSession,
} from '@earendil-works/pi-coding-agent';
import { BrowserLogin } from './auth.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// Never share the running CLI host's session files or active-session pointer.
const local = resolve(process.env.SDK_STATE_DIR || resolve(root, '.local/sdk-prototype'));
const sessions = resolve(local, 'sessions');
await mkdir(sessions, { recursive: true });
const runtime = await ModelRuntime.create(); // Existing Pi auth.json/models.json; no browser credentials.
const login = new BrowserLogin(runtime);
let session: AgentSession;
let unsubscribe: (() => void) | undefined;
let messages: AgentSession['messages'] = [];
let busy = false;
let accepting = false;
let reloading = false;
let activity = '';
let error: string | null = null;
let revision = 0;

async function open(manager: SessionManager) {
  const settingsManager = SettingsManager.create(root, getAgentDir());
  const loader = new DefaultResourceLoader({
    cwd: root, agentDir: getAgentDir(), settingsManager,
    extensionFactories: [createCodemodeExtension(), createToolSearchExtension(), createMcpExtension()],
  });
  // Match the existing CLI host's explicit --approve for this one local workspace.
  await loader.reload({ resolveProjectTrust: async () => true });
  const created = await createAgentSession({
    cwd: root, modelRuntime: runtime, settingsManager, resourceLoader: loader, sessionManager: manager,
  });
  const next = created.session;
  try { await next.bindExtensions({ mode: 'rpc' }); }
  catch (err) { next.dispose(); throw err; }
  unsubscribe?.();
  session?.dispose();
  session = next;
  messages = [...session.messages];
  unsubscribe = session.subscribe(event => {
    if (event.type === 'message_start') messages.push(event.message);
    if (event.type === 'message_update' || event.type === 'message_end') {
      messages[messages.length - 1] = event.message;
    }
    if (event.type === 'agent_start') activity = 'Thinking';
    if (event.type === 'tool_execution_start') activity = `Running ${event.toolName}`;
    if (event.type === 'tool_execution_end') activity = 'Thinking';
    if (event.type === 'auto_retry_start') activity = 'Retrying';
    if (event.type === 'compaction_start') activity = 'Compacting context';
    // agent_end alone is not idle: compaction/retries may still follow.
    if (event.type === 'agent_settled') { messages = [...session.messages]; }
    revision++;
  });
  const pointer = resolve(local, 'active-session');
  await writeFile(`${pointer}.tmp`, session.sessionId);
  await rename(`${pointer}.tmp`, pointer);
  revision++;
}

let manager: SessionManager;
try {
  const id = (await readFile(resolve(local, 'active-session'), 'utf8')).trim();
  const file = SessionManager.findById(root, id, sessions);
  // Pi does not write an empty session until it has an assistant response.
  manager = file ? SessionManager.open(file, sessions) : SessionManager.create(root, sessions);
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  manager = SessionManager.create(root, sessions);
}
await open(manager);

function snapshot() {
  return {
    messages: messages.filter(message => ['user', 'assistant', 'toolResult'].includes(message.role)),
    busy, error, activity, steering: session.getSteeringMessages(),
    context: session.getContextUsage() ?? null, sessionId: session.sessionId,
  };
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

async function body(request: IncomingMessage): Promise<Record<string, unknown>> {
  let data = '';
  for await (const chunk of request) {
    data += chunk;
    if (Buffer.byteLength(data) > 512_000) throw new HttpError(413, 'Request too large');
  }
  try {
    const parsed: unknown = JSON.parse(data);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed as Record<string, unknown>;
  } catch { throw new HttpError(422, 'Expected a JSON object'); }
}

function text(value: unknown, max = 100_000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new HttpError(422, 'Expected nonblank text within length limit');
  }
  return value;
}

function json(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}

const port = Number(process.env.SDK_PORT || 8787);
const webPort = process.env.WEB_PORT || '5175';
// Vite's proxy preserves the browser's Host header (changeOrigin is false).
const allowedHosts = new Set([
  `127.0.0.1:${port}`, `localhost:${port}`,
  `127.0.0.1:${webPort}`, `localhost:${webPort}`,
]);
const allowedOrigins = new Set([...allowedHosts].map(host => `http://${host}`));
const server = createServer((request, response) => {
  void handle(request, response).catch(err => {
    if (response.headersSent) { response.destroy(); return; }
    // In particular, never send raw provider/login exceptions to the browser.
    json(response, err instanceof HttpError ? err.status : 500, {
      detail: err instanceof HttpError ? err.message : 'SDK operation failed; see prototype limitations.',
    });
  });
});

async function handle(request: IncomingMessage, response: ServerResponse) {
  if (!allowedHosts.has(request.headers.host || '')) throw new HttpError(403, 'Untrusted host');
  if (request.headers.origin && !allowedOrigins.has(request.headers.origin)) {
    throw new HttpError(403, 'Untrusted origin');
  }
  if (request.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, 'Cross-site request');
  const path = new URL(request.url!, `http://127.0.0.1:${port}`).pathname;
  const route = `${request.method} ${path}`;
  if (route === 'GET /auth') {
    response.writeHead(200, {
      'Content-Type': 'text/html', 'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
      'Referrer-Policy': 'no-referrer',
    });
    response.end(await readFile(new URL('./auth.html', import.meta.url)));
  } else if (route === 'GET /auth.js') {
    response.writeHead(200, { 'Content-Type': 'text/javascript' });
    response.end(await readFile(new URL('./auth.js', import.meta.url)));
  } else if (route === 'GET /api/auth') {
    json(response, 200, { ...login.state, providers: runtime.getProviders()
      .filter(provider => provider.auth?.oauth)
      .map(provider => ({ id: provider.id, name: provider.name })) });
  } else if (route === 'POST /api/auth/login') {
    if (busy || reloading || login.state.status === 'running') throw new HttpError(409, 'Pi or login is busy');
    const provider = text((await body(request)).provider, 200);
    if (!runtime.getProvider(provider)?.auth?.oauth) throw new HttpError(422, 'Unknown OAuth provider');
    login.start(provider);
    json(response, 202, { ok: true });
  } else if (route === 'POST /api/auth/answer') {
    const data = await body(request);
    try { login.answer(text(data.id, 100), text(data.value, 10_000)); }
    catch { throw new HttpError(409, 'Login prompt expired or invalid'); }
    json(response, 200, { ok: true });
  } else if (route === 'POST /api/auth/cancel') {
    login.cancel(); json(response, 200, { ok: true });
  } else if (route === 'GET /api/state') {
    json(response, 200, snapshot());
  } else if (route === 'GET /api/events') {
    response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
    let seen = -1;
    const interval = setInterval(() => {
      if (reloading) { response.end(); return; }
      if (seen !== revision) {
        seen = revision;
        response.write(`data: ${JSON.stringify(snapshot())}\n\n`);
      } else response.write(': heartbeat\n\n');
    }, 100);
    response.on('close', () => clearInterval(interval));
  } else if (route === 'POST /api/chat') {
    const message = text((await body(request)).message);
    if (reloading || login.state.status === 'running') throw new HttpError(503, 'Host is reloading or logging in');
    if (busy && !accepting) throw new HttpError(409, 'Pi is starting or settling; retry');
    const steering = busy;
    if (!steering) { busy = true; error = null; activity = 'Starting Pi'; revision++; }
    let received = false;
    const timer = setTimeout(() => {
      if (!received) { received = true; json(response, 504, { detail: 'Receipt unconfirmed; check chat before retrying' }); }
    }, 15_000);
    const run = session.prompt(message, {
      streamingBehavior: steering ? 'steer' : undefined,
      // SDK 1.5.0 exposes this INTERNAL RPC hook. Migration must pin/test it or replace it.
      preflightResult: disposition => {
        accepting = true;
        if (!received) { received = true; clearTimeout(timer); json(response, 202, { disposition }); }
      },
    });
    void run.catch(() => {
      error = 'Pi could not complete this prompt. Check provider login/configuration.';
      if (!received) { received = true; clearTimeout(timer); json(response, 422, { detail: error }); }
    }).finally(() => {
      clearTimeout(timer);
      if (!steering) { busy = false; accepting = false; activity = ''; }
      revision++;
    });
  } else if (route === 'POST /api/stop') {
    accepting = false;
    const cleared = session.clearQueue();
    await session.abort();
    json(response, 200, { ok: true, ...cleared });
  } else if (route === 'POST /api/session/new') {
    if (busy || reloading || login.state.status === 'running') throw new HttpError(409, 'Pi is busy');
    busy = true; revision++;
    try { await open(SessionManager.create(root, sessions)); error = null; }
    finally { busy = false; revision++; }
    json(response, 200, snapshot());
  } else if (route === 'POST /api/prepare-reload') {
    if (busy || login.state.status === 'running') throw new HttpError(409, 'Pi is busy');
    reloading = true; json(response, 200, { ok: true });
  } else throw new HttpError(404, 'Not found');
}

server.listen(port, '127.0.0.1', () => console.log(`SDK prototype: http://127.0.0.1:${port}/auth`));
async function shutdown() {
  login.cancel();
  await session.abort();
  unsubscribe?.(); session.dispose();
  server.closeAllConnections(); server.close();
}
process.once('SIGTERM', () => void shutdown());
process.once('SIGINT', () => void shutdown());
