import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { request as httpRequest } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

test('HTTP smoke: local-only boundary, browser OAuth page, chat API, clean empty restart', { timeout: 20_000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'self-growing-sdk-http-'));
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = (probe.address() as { port: number }).port;
  await new Promise<void>(resolve => probe.close(() => resolve()));
  const url = `http://127.0.0.1:${port}`;
  try {
    // A second boot also checks Pi's delayed persistence of brand-new empty sessions.
    for (let boot = 0; boot < 2; boot++) {
      const child = spawn(process.execPath, ['--experimental-strip-types', 'server.ts'], {
        cwd: new URL('.', import.meta.url),
        env: { ...process.env, PI_CODING_AGENT_DIR: join(directory, 'agent'),
          SDK_STATE_DIR: join(directory, 'state'), SDK_PORT: String(port), WEB_PORT: '5174' },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let diagnostics = '';
      child.stderr.on('data', data => { diagnostics += data; });
      const exited = once(child, 'exit');
      try {
        await Promise.race([
          once(child.stdout, 'data'),
          exited.then(() => { throw new Error(`Host exited: ${diagnostics}`); }),
        ]);
        const state = await (await fetch(`${url}/api/state`)).json() as { sessionId: string; busy: boolean; messages: unknown[] };
        assert.equal(state.busy, false);
        assert.deepEqual(state.messages, []);
        assert.ok(state.sessionId);
        assert.equal((await fetch(`${url}/api/state`, { headers: { Origin: 'https://hostile.example' } })).status, 403);
        const rawStatus = (host: string) => new Promise<number | undefined>((resolve, reject) => {
          const request = httpRequest(`${url}/api/state`, { headers: { Host: host } }, response => {
            response.resume(); resolve(response.statusCode);
          });
          request.on('error', reject); request.end();
        });
        assert.equal(await rawStatus('hostile.example'), 403);
        assert.equal(await rawStatus('127.0.0.1:5174'), 200, 'Vite preserves the frontend Host header');
        assert.equal((await fetch(`${url}/api/state`, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
        const page = await fetch(`${url}/auth`);
        assert.equal(page.status, 200);
        assert.ok(page.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"));
        assert.ok((await page.text()).includes('Pi provider login'));
        const auth = await (await fetch(`${url}/api/auth`)).json() as { status: string; providers: unknown[] };
        assert.equal(auth.status, 'idle');
        assert.ok(Array.isArray(auth.providers));
        assert.equal((await fetch(`${url}/api/auth/login`, { method: 'POST', body: '{"provider":"not-a-provider"}' })).status, 422);
        assert.equal((await fetch(`${url}/api/chat`, { method: 'POST', body: '{"message":" "}' })).status, 422);
        assert.equal((await fetch(`${url}/api/chat`, { method: 'POST', body: 'null' })).status, 422);
        const stream = await fetch(`${url}/api/events`);
        const reader = stream.body!.getReader();
        assert.ok(new TextDecoder().decode((await reader.read()).value).startsWith('data: '));
        await reader.cancel();
        const fresh = await (await fetch(`${url}/api/session/new`, { method: 'POST' })).json() as { sessionId: string };
        assert.notEqual(fresh.sessionId, state.sessionId);
        assert.equal((await fetch(`${url}/api/stop`, { method: 'POST' })).status, 200);
        assert.equal((await fetch(`${url}/api/prepare-reload`, { method: 'POST' })).status, 200);
        assert.equal((await fetch(`${url}/api/chat`, { method: 'POST', body: '{"message":"Do not run"}' })).status, 503);
      } finally {
        child.kill('SIGTERM');
        const killTimer = setTimeout(() => child.kill('SIGKILL'), 3000);
        await exited;
        clearTimeout(killTimer);
      }
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
