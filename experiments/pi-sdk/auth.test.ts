import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ModelRuntime } from '@earendil-works/pi-coding-agent';
import { BrowserLogin, safeUrl } from './auth.ts';

type Interaction = Parameters<ModelRuntime['login']>[2];
const tick = () => new Promise(resolve => setImmediate(resolve));
function fakeLogin(run: (interaction: Interaction) => Promise<void>) {
  return { login: async (_provider, _type, interaction) => {
    await run(interaction);
    return { type: 'oauth', access: 'PRIVATE_ACCESS_TOKEN', refresh: 'PRIVATE_REFRESH_TOKEN', expires: 123 };
  } } as Pick<ModelRuntime, 'login'>;
}

test('only OAuth interaction data is exposed, not credentials or progress', async () => {
  let value = '';
  const login = new BrowserLogin(fakeLogin(async interaction => {
    interaction.notify({ type: 'progress', message: 'PRIVATE_ACCESS_TOKEN' });
    interaction.notify({ type: 'device_code', userCode: 'USER-CODE', verificationUri: 'https://example.com/device' });
    value = await interaction.prompt({ type: 'manual_code', message: 'Paste authorization code' });
  }));
  login.start('example');
  assert.equal(login.state.code, 'USER-CODE');
  assert.equal(login.state.url, 'https://example.com/device');
  assert.throws(() => login.start('example'), /already running/);
  assert.throws(() => login.answer('old-id', 'ignored'), /Stale/);
  login.answer(login.state.prompt!.id, 'authorization-code');
  await tick();
  assert.equal(value, 'authorization-code');
  assert.deepEqual(login.state, { status: 'done' });
  assert.ok(!JSON.stringify(login.state).includes('PRIVATE'));
});

test('secret input and raw provider errors never reach the browser', async () => {
  const login = new BrowserLogin(fakeLogin(async interaction => {
    await interaction.prompt({ type: 'secret', message: 'PRIVATE_PROVIDER_DATA' });
    throw new Error('PRIVATE_REFRESH_TOKEN');
  }));
  login.start('example');
  await tick();
  assert.equal(login.state.status, 'error');
  assert.ok(!JSON.stringify(login.state).includes('PRIVATE'));
  assert.equal(login.state.prompt, undefined);
});

test('cancellation releases a pending prompt and permits another login', async () => {
  const login = new BrowserLogin(fakeLogin(async interaction => {
    await interaction.prompt({ type: 'text', message: 'Account' });
  }));
  login.start('example');
  login.cancel();
  await tick();
  assert.deepEqual(login.state, { status: 'cancelled' });
  login.start('example');
  login.answer(login.state.prompt!.id, 'account');
  await tick();
  assert.equal(login.state.status, 'done');
});

test('callback winning over manual input removes the stale prompt', async () => {
  const promptController = new AbortController();
  const login = new BrowserLogin(fakeLogin(async interaction => {
    const prompt = interaction.prompt({ type: 'manual_code', message: 'Code', signal: promptController.signal });
    promptController.abort();
    await prompt.catch(() => {}); // Provider completed the loopback callback instead.
  }));
  login.start('example');
  await tick();
  assert.deepEqual(login.state, { status: 'done' });
});

test('real ModelRuntime.login persists credentials server-side without exposing them', { timeout: 5000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'self-growing-oauth-'));
  const authPath = join(directory, 'auth.json');
  try {
    const runtime = await ModelRuntime.create({ authPath, modelsPath: null,
      modelsStorePath: join(directory, 'catalog.json'), refreshOnCreate: false });
    runtime.registerProvider('offline-oauth', {
      models: [],
      oauth: {
        name: 'Offline OAuth fixture',
        login: async callbacks => {
          callbacks.onAuth({ url: 'https://example.com/authorize' });
          const code = await callbacks.onPrompt({ message: 'Authorization code' });
          assert.equal(code, 'authorization-code');
          return { access: 'PRIVATE_ACCESS_TOKEN', refresh: 'PRIVATE_REFRESH_TOKEN', expires: Date.now() + 3_600_000 };
        },
        refreshToken: async credentials => credentials,
        getApiKey: credentials => credentials.access,
      },
    });
    const login = new BrowserLogin(runtime);
    login.start('offline-oauth');
    for (let attempt = 0; !login.state.prompt && attempt < 100; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    assert.equal(login.state.url, 'https://example.com/authorize');
    assert.ok(login.state.prompt);
    login.answer(login.state.prompt.id, 'authorization-code');
    for (let attempt = 0; login.state.status === 'running' && attempt < 100; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    assert.deepEqual(login.state, { status: 'done' });
    assert.ok((await readFile(authPath, 'utf8')).includes('PRIVATE_REFRESH_TOKEN'));
    assert.ok(!JSON.stringify(login.state).includes('PRIVATE'));
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('select answers are validated, login URLs cannot execute script', async () => {
  const login = new BrowserLogin(fakeLogin(async interaction => {
    await interaction.prompt({ type: 'select', message: 'Account', options: [{ id: 'one', label: 'One' }] });
  }));
  login.start('example');
  assert.throws(() => login.answer(login.state.prompt!.id, 'wrong'), /Invalid selection/);
  login.answer(login.state.prompt!.id, 'one');
  await tick();
  assert.throws(() => safeUrl('javascript:alert(1)'));
  assert.throws(() => safeUrl('https://user:password@example.com'));
  assert.equal(safeUrl('https://example.com/login'), 'https://example.com/login');
});
