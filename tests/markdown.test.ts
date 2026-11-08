import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('');
Object.assign(globalThis, { window: dom.window, document: dom.window.document });
const { renderMarkdown } = await import('../frontend/markdown.ts');

test('readable Markdown with no resource loading or active HTML', () => {
  const html = renderMarkdown(`# Title

Paragraph **strong** and *emphasis*.

- one
- two

> quote

\`\`\`js
const x = 1;
\`\`\`

| A | B |
| - | - |
| c | d |

[Safe](https://example.com) [Unsafe](javascript:alert(1))
![remote](https://example.com/tracker.png)
<script>alert(1)</script><iframe src="https://example.com"></iframe>
<style>@import 'https://example.com/style';</style>
<img src=x onerror=alert(1)><video poster="https://example.com/a"></video>
<svg><use href="https://example.com/a"/></svg>
<form><input autofocus></form><link rel=stylesheet href="https://example.com/a">
<p style="background:url(https://example.com/a)" onclick="alert(1)">Text</p>
<a href="file:///etc/passwd">local</a><a href="relative.md">relative</a>
<a href="https://example.com" ping="https://example.com/ping">link</a>`);
  const result = new JSDOM(html).window.document;
  for (const tag of ['h1', 'p', 'strong', 'em', 'ul', 'blockquote', 'pre', 'code', 'table']) {
    assert.ok(result.querySelector(tag), tag);
  }
  assert.equal(result.querySelectorAll('script,iframe,style,img,video,svg,form,input,link').length, 0);
  for (const element of result.querySelectorAll('*')) {
    for (const attr of element.attributes) assert.ok(['href', 'title', 'target', 'rel'].includes(attr.name));
  }
  const links = [...result.querySelectorAll('a[href]')];
  assert.equal(links.length, 2);
  for (const link of links) {
    assert.equal(link.getAttribute('href'), 'https://example.com');
    assert.equal(link.getAttribute('rel'), 'noopener noreferrer');
    assert.equal(link.getAttribute('target'), '_blank');
  }
});
