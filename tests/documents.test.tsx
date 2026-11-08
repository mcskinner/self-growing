import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
Object.assign(globalThis, {
  window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, sessionStorage: dom.window.sessionStorage,
  IS_REACT_ACT_ENVIRONMENT: true,
  React, // tsx's test transform uses the classic JSX runtime.
});
const { ReaderLayout } = await import('../frontend/documents');

async function click(text: string) {
  const button = [...document.querySelectorAll('button')].find(button => button.textContent === text);
  assert.ok(button, text);
  await act(async () => button.click());
}

test('document lifecycle stays independent of chat, refreshes after work, and cancels safely', async () => {
  sessionStorage.setItem('open-document', '/original.md');
  localStorage.setItem('reader-width', '55');
  let reads = 0;
  let choice: string | null = null;
  let fail = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => {
    if (url.endsWith('/choose')) return Response.json({ path: choice });
    reads++;
    if (fail) return Response.json({ detail: 'Missing file' }, { status: 404 });
    const path = new URL(url, 'http://localhost').searchParams.get('path');
    return Response.json({ path, name: 'original.md', content: `# Version ${reads}` });
  }) as typeof fetch;
  const root = createRoot(document.getElementById('root')!);
  const render = async (busy = false, session = 'a') => {
    await act(async () => root.render(<ReaderLayout busy={busy}><textarea key={session} aria-label="Chat" defaultValue={session} /></ReaderLayout>));
  };
  try {
    await render();
    assert.match(document.querySelector('article')!.textContent!, /Version 1/);
    const chat = document.querySelector('textarea');
    const separator = document.querySelector('[role="separator"]')!;
    assert.equal(separator.getAttribute('aria-valuenow'), '55');
    await act(async () => separator.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    assert.equal(localStorage.getItem('reader-width'), '57');
    const handle = separator as HTMLElement;
    let captured = false;
    handle.setPointerCapture = () => { captured = true; };
    handle.hasPointerCapture = () => captured;
    handle.releasePointerCapture = () => { captured = false; };
    document.querySelector('.reader-panes')!.getBoundingClientRect = () => ({ left: 0, width: 1000 } as DOMRect);
    await act(async () => {
      handle.dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true }));
      handle.dispatchEvent(new dom.window.MouseEvent('pointermove', { clientX: 650, bubbles: true }));
      handle.dispatchEvent(new dom.window.MouseEvent('pointerup', { bubbles: true }));
    });
    assert.equal(localStorage.getItem('reader-width'), '65');
    assert.equal(captured, false);
    await click('Open Markdown');
    await click('Choose local file…');
    assert.equal(sessionStorage.getItem('open-document'), '/original.md');
    assert.equal(document.querySelector('textarea'), chat);
    assert.equal(reads, 1);
    await click('Cancel');
    await render(true);
    await render(false);
    assert.equal(reads, 2);
    await render(false, 'b');
    assert.ok(document.querySelector('article'));
    assert.equal(reads, 2);
    fail = true;
    await click('Refresh');
    assert.match(document.querySelector('[role="alert"]')!.textContent!, /Missing file/);
    fail = false;
    await click('Retry');
    assert.ok(document.querySelector('article'));
    await click('Open Markdown');
    choice = '/another.markdown';
    await click('Choose local file…');
    assert.equal(sessionStorage.getItem('open-document'), '/another.markdown');
    const currentChat = document.querySelector('textarea');
    await click('Close document');
    assert.equal(document.querySelector('article'), null);
    assert.equal(document.querySelector('[role="separator"]'), null);
    assert.equal(document.querySelector('textarea'), currentChat);
    assert.equal(sessionStorage.getItem('open-document'), '');
  } finally {
    await act(async () => root.unmount());
    globalThis.fetch = originalFetch;
  }
});
