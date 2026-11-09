// Independent acceptance; never supplied to the applier. Public fixtures, mocked APIs/chat.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
const dist = resolve(process.env.TARGET_WORKTREE, 'dist');
const out = fileURLToPath(new URL('.', import.meta.url));
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = resolve(dist, pathname === '/' ? 'index.html' : pathname.slice(1));
    if (!file.startsWith(dist + '/')) throw new Error('Invalid path');
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[extname(file)] || 'application/octet-stream' });
    response.end(content);
  } catch { response.writeHead(404); response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const source = '/fixtures/public-guide.md';
const passage = 'A passage worth discussing.';
const content = '# Public guide\n\nA passage worth **discussing**.\n\nFirst line.  \nSecond line.\n\n   \n\n```txt\nexample();\n```\n\n[Next](next.md)';
const state = sessionId => ({ sessionId, messages: [], busy: false, error: null, activity: '', steering: [], context: null });
const reports = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [], requests = [];
    let sends = 0, picks = 0;
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(snapshot => {
      window.EventSource = class {
        constructor() {
          window.testEvents = this;
          setTimeout(() => this.onmessage?.({ data: JSON.stringify(snapshot) }), 0);
        }
        close() {}
      };
      window.pushSnapshot = snapshot => window.testEvents.onmessage({ data: JSON.stringify(snapshot) });
    }, state('quote-one'));
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url()); requests.push(url.pathname);
      const respond = body => route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
      if (url.pathname === '/api/documents/pick') { picks++; return respond({ path: source }); }
      if (url.pathname === '/api/documents/content') return respond({ path: url.searchParams.get('path'), content });
      if (url.pathname === '/api/documents/resolve') return respond({ path: '/fixtures/next.md' });
      if (url.pathname === '/api/sessions') return respond({ sessions: [{ id: 'quote-one', title: 'First', updatedAt: null }, { id: 'quote-two', title: 'Second', updatedAt: null }] });
      if (url.pathname === '/api/chat') { sends++; return respond({ ok: true }); }
      throw new Error(`Unexpected API request: ${url.pathname}`);
    });
    const input = page.getByRole('textbox', { name: 'Message Pi' });
    const action = page.getByRole('button', { name: /^(add to chat|quote to chat)$/i });
    const article = page.locator('.markdown-document');
    async function inactive() {
      await page.waitForFunction(() => {
        const button = [...document.querySelectorAll('button')].find(b => /^(add to chat|quote to chat)$/i.test(b.textContent.trim()));
        return !button || button.disabled || !button.getClientRects().length;
      });
    }
    async function active() {
      await action.waitFor({ state: 'visible' });
      await page.waitForFunction(() => {
        const button = [...document.querySelectorAll('button')].find(b => /^(add to chat|quote to chat)$/i.test(b.textContent.trim()));
        return button && !button.disabled;
      });
    }
    async function openDocument() {
      await page.getByRole('button', { name: 'Open document', exact: true }).click();
      await article.waitFor();
    }
    async function selectPassage() {
      await article.locator('p').first().scrollIntoViewIfNeeded();
      await article.locator('p').first().evaluate(element => {
        const range = document.createRange(); range.selectNodeContents(element);
        const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
      });
      await active();
    }
    async function waitDraftContains(needle) {
      await page.waitForFunction(needle => document.querySelector('textarea').value.includes(needle), needle);
    }
    await page.goto(origin);
    await input.fill('Keep my question.');
    await inactive();
    await openDocument();
    assert.equal(picks, 1, 'existing native-picker flow retained');
    assert.equal(await article.locator('strong').first().textContent(), 'discussing');
    assert.equal(await article.locator('pre code').textContent(), 'example();\n');
    await inactive();
    // Center the passage to avoid viewport-edge drag autoscroll on stacked layouts.
    // A real pointer gesture, not only artificial Range setup.
    await article.locator('p').first().evaluate(element => element.scrollIntoView({ block: 'center' }));
    const rect = await article.locator('p').first().evaluate(element => {
      const range = document.createRange(); range.selectNodeContents(element);
      const r = range.getBoundingClientRect(); return { left: r.left, right: r.right, y: r.top + r.height / 2 };
    });
    await page.mouse.move(rect.left, rect.y); await page.mouse.down();
    await page.mouse.move(rect.right + 1, rect.y, { steps: 12 }); await page.mouse.up();
    await active();
    assert.equal(await page.evaluate(() => getSelection().toString().trim()), passage);
    const bounds = await action.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.y >= 0 && bounds.y + bounds.height <= 900);
    const labelFits = await action.evaluate(button => {
      const range = document.createRange(); range.selectNodeContents(button);
      return range.getClientRects().length === 1 && button.scrollWidth <= button.clientWidth + 1 && button.scrollHeight <= button.clientHeight + 1;
    });
    const distanceFromSelection = Math.min(Math.abs(bounds.y - rect.y), Math.abs(bounds.y + bounds.height - rect.y));
    const nearSelection = distanceFromSelection <= 64;
    await page.screenshot({ path: resolve(out, `${width}-selection.png`) });
    await action.click(); await waitDraftContains(passage);
    let draft = await input.inputValue();
    assert.ok(draft.startsWith('Keep my question.')); assert.ok(draft.includes(source));
    assert.equal(draft.split(passage).length - 1, 1, 'exactly one insertion');
    assert.equal(sends, 0);
    await page.waitForFunction(() => {
      const element = document.querySelector('textarea');
      return document.activeElement === element && element.selectionStart === element.value.length && element.selectionEnd === element.value.length;
    });
    await page.reload(); await input.waitFor(); await article.waitFor();
    assert.equal(await input.inputValue(), draft, 'draft persists');
    await selectPassage(); await page.keyboard.press('Escape'); await inactive();
    assert.equal(await input.inputValue(), draft);
    await selectPassage(); await action.focus(); await page.keyboard.press('Enter');
    await page.waitForFunction(passage => document.querySelector('textarea').value.split(passage).length - 1 === 2, passage);
    assert.equal(sends, 0); draft = await input.inputValue();
    await page.evaluate(snapshot => window.pushSnapshot(snapshot), state('quote-two'));
    await page.waitForFunction(() => document.querySelector('textarea').value === '');
    await input.fill('Other conversation');
    await selectPassage(); await action.click(); await waitDraftContains(passage);
    const otherDraft = await input.inputValue(); assert.ok(otherDraft.startsWith('Other conversation'));
    await page.evaluate(snapshot => window.pushSnapshot(snapshot), state('quote-one'));
    await page.waitForFunction(value => document.querySelector('textarea').value === value, draft);
    await page.evaluate(snapshot => window.pushSnapshot(snapshot), state('quote-two'));
    await page.waitForFunction(value => document.querySelector('textarea').value === value, otherDraft);
    // Selection with line breaks must preserve those breaks in the quoted text.
    await article.locator('p').nth(1).scrollIntoViewIfNeeded();
    const multiline = await article.locator('p').nth(1).evaluate(element => {
      const range = document.createRange(); range.selectNodeContents(element);
      const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); return selection.toString();
    });
    assert.ok(multiline.includes('\n'));
    await action.waitFor(); await action.click(); await waitDraftContains('First line.');
    const withLines = await input.inputValue();
    assert.match(withLines, /First line\.\n(?:> ?)?Second line\./);
    await page.evaluate(snapshot => window.pushSnapshot({ ...snapshot, busy: true }), state('quote-two'));
    await page.getByRole('button', { name: 'Stop Pi and pause unsent messages' }).waitFor();
    await selectPassage(); await action.click();
    await page.waitForFunction(previous => document.querySelector('textarea').value.length > previous.length, withLines);
    assert.equal(sends, 0, 'quote while busy is not steering');
    await page.evaluate(snapshot => window.pushSnapshot(snapshot), state('quote-two'));
    await page.getByRole('button', { name: 'Send message', exact: true }).waitFor();
    await input.selectText();
    await inactive();
    // Test actual whitespace inside the article without modifying application code.
    await article.locator('p').nth(1).evaluate(element => {
      const text = element.firstChild; const offset = text.textContent.indexOf(' ');
      const range = document.createRange(); range.setStart(text, offset); range.setEnd(text, offset + 1);
      const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
    });
    await inactive();
    await input.fill('x'.repeat(99990)); await selectPassage(); await action.click();
    await page.waitForTimeout(150);
    assert.equal((await input.inputValue()).length, 99990, 'length rejection preserves prior work');
    assert.ok(await page.getByRole('alert').count(), 'limit failure is visible');
    await input.fill('Editable draft'); await selectPassage();
    await article.getByRole('link', { name: 'Next', exact: true }).click();
    await inactive();
    await page.locator('.document-toolbar strong').filter({ hasText: '/fixtures/next.md' }).waitFor();
    await page.getByRole('button', { name: 'Close document', exact: true }).click();
    assert.equal(await article.count(), 0); assert.equal(await input.inputValue(), 'Editable draft');
    await openDocument(); assert.equal(picks, 2); assert.equal(await input.inputValue(), 'Editable draft');
    await page.getByRole('button', { name: 'Chats', exact: true }).click();
    await page.getByRole('dialog', { name: 'Chats', exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog', { name: 'Chats', exact: true }).waitFor({ state: 'hidden' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(sends, 0);
    await input.fill('Explicit send'); await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('textarea').value === '');
    await page.waitForTimeout(100); assert.equal(sends, 1);
    assert.deepEqual(errors, []); assert.ok(!requests.includes('/api/documents/tree'));
    reports.push({ width, functional_checks_passed: true, label_fits: labelFits, near_selection: nearSelection, distance_from_selection_px: distanceFromSelection, scenarios: 'picker, pointer selection, label geometry, attribution, draft preservation, keyboard, reload, per-chat isolation, multiline, busy, outside/whitespace, limits, navigation, close/reopen, history, explicit send', mocked: true });
    await context.close(); console.log(`FUNCTIONAL PASS ${width}px; label fits: ${labelFits}; near selection: ${nearSelection}, distance: ${distanceFromSelection}px`);
  }
  await writeFile(resolve(out, 'result.json'), JSON.stringify({ accepted: reports.every(report => report.near_selection && report.label_fits), reports, live_provider_tested: false, physical_touch_tested: false }, null, 2) + '\n');
  assert.ok(reports.every(report => report.near_selection && report.label_fits), 'Quote action must be beside the passage with a readable, unclipped label');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
