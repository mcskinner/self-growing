// Run against an existing Vite server; all API/chat traffic is mocked.
// BASE_URL=http://127.0.0.1:5174 PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
// CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node tests/quote-to-chat.browser.mjs
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const base = process.env.BASE_URL || 'http://127.0.0.1:5173';
const source = 'docs/example.md';
const text = 'A passage worth discussing.';
const state = { sessionId: 'quote-test', messages: [], busy: false, error: null, activity: '', steering: [], context: null };
const wait = () => new Promise(resolve => setTimeout(resolve, 80));
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    let sends = 0;
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(snapshot => {
      window.EventSource = class {
        constructor() {
          window.chatEvents = this;
          setTimeout(() => this.onmessage?.({ data: JSON.stringify(snapshot) }), 0);
        }
        close() {}
      };
    }, state);
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url());
      const respond = body => route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
      if (url.pathname === '/api/documents/tree') return respond({ entries: [{ path: source, name: 'example.md' }] });
      if (url.pathname === '/api/documents/content') return respond({ path: url.searchParams.get('path'), content: '# Example\n\nA passage worth **discussing**.\n\nSecond paragraph.\n\n[Next](next.md)' });
      if (url.pathname === '/api/documents/resolve') return respond({ path: 'docs/next.md' });
      if (url.pathname === '/api/chat') { sends++; return respond({ ok: true }); }
      throw new Error(`Unexpected API call: ${url.pathname}`);
    });
    const input = page.getByRole('textbox', { name: 'Message Pi' });
    const action = page.getByRole('button', { name: 'Add to chat', exact: true });
    async function selectPassage() {
      await page.locator('.markdown-document p').first().scrollIntoViewIfNeeded();
      await page.locator('.markdown-document p').first().evaluate(element => {
        const range = document.createRange(); range.selectNodeContents(element);
        const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      });
      await action.waitFor({ state: 'visible' });
    }
    await page.goto(base);
    await input.fill('Keep my question.');
    const original = await page.locator('.chat-panel').boundingBox();
    await page.getByRole('button', { name: 'Project docs', exact: true }).click();
    const drawer = page.getByRole('dialog', { name: /Project docs/ });
    await drawer.waitFor({ state: 'visible' });
    assert.equal((await page.locator('.chat-panel').boundingBox()).width, original.width, 'drawer does not resize chat');
    assert.equal(await page.locator('.markdown-document').count(), 0, 'drawer is navigation only');
    await drawer.getByRole('button', { name: 'example.md' }).click();
    await drawer.waitFor({ state: 'hidden' });
    await page.locator('.markdown-document').waitFor();
    assert.equal(await action.count(), 0, 'no action without selection');
    // Exercise a real pointer selection too, not just Selection API fixtures.
    await page.locator('.markdown-document p').first().scrollIntoViewIfNeeded();
    const passageBounds = await page.locator('.markdown-document p').first().evaluate(element => {
      const range = document.createRange(); range.selectNodeContents(element);
      const rect = range.getBoundingClientRect();
      return { left: rect.left, right: rect.right, y: rect.top + rect.height / 2 };
    });
    await page.mouse.move(passageBounds.left, passageBounds.y);
    await page.mouse.down();
    await page.mouse.move(passageBounds.right + 1, passageBounds.y, { steps: 12 });
    await page.mouse.up();
    await action.waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => window.getSelection().toString().trim()), text);
    await page.keyboard.press('Escape');
    await action.waitFor({ state: 'hidden' });
    await selectPassage();
    const bounds = await action.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width, 'action fits viewport');
    assert.ok(bounds.width > 90 && bounds.height < 44, 'label fits on one line');
    await page.screenshot({ path: `/tmp/quote-to-chat-${width}.png` });
    await action.click();
    const expected = `Keep my question.\n\nFrom ${source}:\n> ${text}\n\n`;
    await page.waitForFunction(value => document.querySelector('textarea').value === value, expected);
    assert.equal(await input.inputValue(), expected);
    assert.equal(await input.evaluate(el => document.activeElement === el && el.selectionStart === el.value.length), true, 'composer focused at end');
    assert.equal(sends, 0, 'quoting does not send');
    assert.equal(await action.count(), 0);
    await page.reload(); await input.waitFor();
    assert.equal(await input.inputValue(), expected, 'quoted draft survives reload');
    await page.locator('.markdown-document').waitFor();
    await selectPassage();
    await page.keyboard.press('Escape');
    await action.waitFor({ state: 'hidden' });
    assert.equal(await input.inputValue(), expected, 'escape leaves draft unchanged');
    // Keyboard activation must keep the captured passage even when focus moves.
    await selectPassage();
    await action.focus(); await page.keyboard.press('Enter');
    await page.waitForFunction(value => document.querySelector('textarea').value === value, `${expected}\n\nFrom ${source}:\n> ${text}\n\n`);
    assert.equal(await input.inputValue(), `${expected}\n\nFrom ${source}:\n> ${text}\n\n`);
    assert.equal(sends, 0);
    // Quoting while the agent works still only edits the draft; it is not steering.
    await page.evaluate(snapshot => window.chatEvents.onmessage({ data: JSON.stringify({ ...snapshot, busy: true }) }), state);
    await page.getByRole('button', { name: 'Stop Pi and pause unsent messages' }).waitFor();
    await selectPassage(); await action.click();
    await page.waitForFunction(value => document.querySelector('textarea').value === value, `${expected}\n\nFrom ${source}:\n> ${text}\n\n\n\nFrom ${source}:\n> ${text}\n\n`);
    assert.equal(sends, 0);
    await page.evaluate(snapshot => window.chatEvents.onmessage({ data: JSON.stringify(snapshot) }), state);
    await page.getByRole('button', { name: 'Send message', exact: true }).waitFor();
    // Selection outside the article must not expose the action.
    await input.selectText(); await wait();
    assert.equal(await action.count(), 0);
    await input.fill('x'.repeat(99990));
    await selectPassage(); await action.click();
    await page.getByRole('alert').filter({ hasText: 'exceed the draft limit' }).waitFor();
    assert.equal((await input.inputValue()).length, 99990, 'oversized insertion preserves draft');
    // Navigation/close invalidates the captured selection; split/draft remain usable.
    await input.fill('Editable draft'); await selectPassage();
    await page.locator('.markdown-document a').click();
    await action.waitFor({ state: 'hidden' });
    await page.locator('.document-toolbar strong').filter({ hasText: 'docs/next.md' }).waitFor();
    await page.getByRole('button', { name: 'Close document', exact: true }).click();
    assert.equal(await page.locator('.markdown-document').count(), 0);
    assert.equal(await input.inputValue(), 'Editable draft');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await input.fill('An explicitly sent message');
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('textarea').value === '');
    await wait(); assert.equal(sends, 1, 'only explicit send reaches chat API');
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${width}px: drawer, selection action, attributed draft, focus, reload, keyboard, dismissal, limits, navigation, explicit send.`);
  }
} finally { await browser.close(); }
