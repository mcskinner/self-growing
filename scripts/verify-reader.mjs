// Isolated compiled UI: every request is fulfilled locally, no server or provider.
// npm install --prefix /tmp/reader-fidelity-ui playwright
// node scripts/verify-reader.mjs [dist directory] [artifact directory]
import { chromium } from '/tmp/reader-fidelity-ui/node_modules/playwright/index.mjs';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const build = path.resolve(process.argv[2] || 'dist');
const artifacts = process.argv[3] || '/tmp/reader-fidelity-ui/artifacts';
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1140/chrome-mac/Chromium.app/Contents/MacOS/Chromium`, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [], unexpected = [], sent = [];
page.on('pageerror', e => errors.push(String(e)));
const fixture = '# Reader fidelity\n\nA comfortable paragraph with **strong text**, *emphasis*, and a [next document](next.md).\n\n## Details\n\n- First item\n- Second item\n\n> A quiet quotation.\n\n| Name | Value |\n| --- | --- |\n| Alpha | Beta |\n\n```ts\n' + 'const wide = "' + 'x'.repeat(300) + '";\n```\n\n<script>window.ATTACK=true</script>\n<img src="https://evil.invalid/attack.png">\n\n' + 'More readable content.\n\n'.repeat(90);
let selected = '/fixtures/index.md', fail = false, changed = false;
let state = { messages: [], busy: false, error: null, activity: '', steering: [], context: null, sessionId: 'one' };
await page.addInitScript(() => {
  window.EventSource = class {
    constructor() { window.testEvents = this; setTimeout(() => this.onmessage?.({ data: JSON.stringify(window.testState) }), 0); }
    close() {}
  };
});
await page.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.hostname !== 'reader.test') { unexpected.push(url.href); return route.abort(); }
  const json = body => route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
  if (url.pathname === '/api/documents/pick') return json({ path: selected });
  if (url.pathname === '/api/documents/resolve') {
    assert.equal(url.searchParams.get('link'), 'next.md');
    return json({ path: '/fixtures/next.md' });
  }
  if (url.pathname === '/api/documents/content') {
    if (fail) return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'Fixture missing' }) });
    const p = url.searchParams.get('path');
    return json({ path: p, content: p.endsWith('next.md') ? '# Distinct next document' : changed ? '# Refreshed after work' : fixture, comments: [], storage: 'embedded' });
  }
  if (url.pathname === '/api/chat') { sent.push(route.request().postDataJSON()); return json({ disposition: 'started' }); }
  if (url.pathname === '/api/stop') return json({ steering: [], followUp: [] });
  if (url.pathname === '/api/sessions') return json({ sessions: [{ id: 'one', title: 'First chat' }, { id: 'two', title: 'Second chat' }], currentSessionId: state.sessionId });
  if (url.pathname === '/api/session/switch' || url.pathname === '/api/session/new') {
    state = { ...state, sessionId: url.pathname.endsWith('new') ? 'three' : 'two', messages: [] };
    await emit(); return json(state);
  }
  if (url.pathname.startsWith('/api/')) throw new Error(`Unexpected API: ${url.pathname}`);
  const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const body = await readFile(path.join(build, name));
  return route.fulfill({ body, contentType: name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html' });
});
async function emit(patch = {}) {
  state = { ...state, ...patch };
  await page.evaluate(s => { window.testState = s; window.testEvents?.onmessage?.({ data: JSON.stringify(s) }); }, state);
}
await page.addInitScript(s => { window.testState = s; }, state);
try {
  await page.goto('https://reader.test/');
  const input = page.getByRole('textbox', { name: 'Message Pi' });
  const open = page.getByRole('button', { name: 'Open document', exact: true }).first();
  await input.fill('Keep my draft'); await open.click();
  await page.getByRole('heading', { name: 'Reader fidelity', exact: true }).waitFor();
  assert.equal(await input.inputValue(), 'Keep my draft');
  assert.equal(await page.locator('.markdown-document table').count(), 1);
  assert(await page.locator('.markdown-document pre').evaluate(e => e.scrollWidth > e.clientWidth));
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.equal(await page.locator('.markdown-document img, .markdown-document script').count(), 0);
  assert.equal(await page.evaluate(() => window.ATTACK), undefined);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Show thinking and tool activity' }).check(); await page.keyboard.press('Escape');
  const sep = page.getByRole('separator');
  const before = await page.locator('.chat-panel').boundingBox();
  await sep.focus(); await page.keyboard.press('ArrowRight');
  assert((await page.locator('.chat-panel').boundingBox()).width > before.width);
  const box = await sep.boundingBox();
  await page.mouse.move(box.x + 4, box.y + 100); await page.mouse.down(); await page.mouse.move(box.x + 64, box.y + 100); await page.mouse.up();
  assert((await page.locator('.chat-panel').boundingBox()).width > before.width + 20);
  const chatScroll = await page.locator('.chat-panel main').evaluate(e => e.scrollTop);
  await page.locator('.document-scroll').evaluate(e => { e.scrollTop = 500; });
  assert.equal(await page.locator('.chat-panel main').evaluate(e => e.scrollTop), chatScroll);
  await page.locator('.document-scroll').evaluate(e => { e.scrollTop = 0; });
  if (process.env.REFERENCE) await page.addStyleTag({ content: '.annotation-toolbar,.annotation-rail { display:none } .annotation-canvas { display:block; min-width:0 }' });
  await page.screenshot({ path: `${artifacts}/desktop.png` });
  if (process.env.CAPTURE_ONLY) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('heading', { name: 'Reader fidelity', exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${artifacts}/narrow.png` });
    console.log('Captured same fixture and pane width at desktop/narrow viewports.');
    process.exitCode = 0;
  } else {
  await page.getByRole('link', { name: 'next document' }).click();
  await page.getByRole('heading', { name: 'Distinct next document' }).waitFor();
  assert.equal(await input.inputValue(), 'Keep my draft');
  selected = null; await open.click();
  await page.getByRole('heading', { name: 'Distinct next document' }).waitFor();
  await page.reload(); await page.getByRole('heading', { name: 'Distinct next document' }).waitFor();
  assert(Number(await page.evaluate(() => localStorage.getItem('chat-width'))) > before.width);
  await page.getByRole('button', { name: 'Close document' }).click();
  assert.equal(await page.locator('.document-panel').count(), 0);
  selected = '/fixtures/index.md'; fail = true; await open.click();
  await page.getByText('Fixture missing', { exact: false }).waitFor();
  fail = false; await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await page.getByRole('heading', { name: 'Reader fidelity', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Chats', exact: true }).click();
  await page.getByRole('button', { name: 'Second chat', exact: false }).click();
  await page.getByRole('heading', { name: 'Reader fidelity', exact: true }).waitFor();
  await input.fill('Hello simulated Pi'); await page.getByRole('button', { name: 'Send message' }).click();
  await page.waitForTimeout(150); assert.equal(sent.at(-1).message, 'Hello simulated Pi');
  await emit({ busy: true });
  await input.fill('Steer simulated Pi'); await page.getByRole('button', { name: 'Steer Pi', exact: true }).click();
  await page.waitForTimeout(150); assert.equal(sent.at(-1).message, 'Steer simulated Pi');
  await page.getByRole('button', { name: 'Stop Pi and pause unsent messages' }).click();
  changed = true; await emit({ busy: false, messages: [{ role: 'assistant', content: [{ type: 'text', text: 'Simulated reply' }] }] });
  await page.getByRole('heading', { name: 'Refreshed after work' }).waitFor();
  await page.getByText('Simulated reply', { exact: true }).waitFor();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'New chat', exact: true }).click();
  await page.waitForTimeout(100);
  assert.equal(state.sessionId, 'three');
  await page.getByRole('heading', { name: 'Refreshed after work' }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await input.scrollIntoViewIfNeeded(); await input.fill('Narrow draft');
  await page.getByRole('button', { name: 'Settings', exact: true }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Settings', exact: true }).click(); await page.getByRole('checkbox').uncheck(); await page.keyboard.press('Escape');
  await page.getByRole('heading', { name: 'Refreshed after work' }).scrollIntoViewIfNeeded();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${artifacts}/narrow.png` });
  assert.deepEqual(errors, []); assert.deepEqual(unexpected, []);
  console.log('PASS: open/draft, rendering safety, settings, pointer/keyboard resize, independent scroll, relative link, cancel, reload/width, close, error/retry, switch chat, mocked send/steer/stop/reply/refresh, narrow reachability; no JS errors or external requests.');
  }
} finally { await browser.close(); }
