import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('');
Object.assign(globalThis, { window: dom.window, document: dom.window.document });
const { renderMarkdown, relativeMarkdownPath } = await import('../frontend/markdown.ts');

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

test('relative Markdown links resolve against original files, with no resource capability', () => {
  const base = '/outside/a folder/current #1.md';
  for (const [href, expected] of [
    ['next.md', '/outside/a folder/next.md'],
    ['../other/guide.markdown#heading', '/outside/other/guide.markdown'],
    ['./encoded%20%23%25.MD?view=1#part', '/outside/a folder/encoded #%.MD'],
    ['current%20%231.md', base],
  ]) assert.equal(relativeMarkdownPath(href, base), expected);
  for (const href of ['#heading', '?q=x', '/absolute.md', '//host/a.md',
    'file:///secret.md', ' file:///secret.md ', 'fi\nle:///secret.md',
    'https://host/a.md', 'javascript:alert(1)',
    'data:text/plain,a.md', 'bad%ZZ.md', 'bad%00.md', 'image.png',
    'bad\\path.md', 'bad%5cpath.md']) {
    assert.equal(relativeMarkdownPath(href, base), null, href);
  }
  assert.equal(relativeMarkdownPath('next.md', 'workspace.md'), null);
  const result = new JSDOM(renderMarkdown(`
[Next](../next.md) [Web](https://example.com/a.md) [Mail](mailto:a@example.com)
[Other](plain.txt) [Absolute](/etc/a.md)
<a href="image.png" data-reader-path="/forged.md" onclick="alert(1)">Forged</a>
<img src="../image.png"><iframe src="../a.md"></iframe>
`, base)).window.document;
  const internal = result.querySelector('a[data-reader-path]')!;
  assert.equal(internal.getAttribute('href'), '../next.md');
  assert.equal(internal.getAttribute('data-reader-path'), '/outside/next.md');
  assert.equal(internal.hasAttribute('target'), false);
  assert.equal(result.querySelectorAll('[data-reader-path]').length, 1);
  assert.equal(result.querySelectorAll('a[href]').length, 3);
  for (const link of result.querySelectorAll('a[target]')) {
    assert.equal(link.getAttribute('target'), '_blank');
    assert.equal(link.getAttribute('rel'), 'noopener noreferrer');
  }
  assert.equal(result.querySelectorAll('img,iframe,[onclick]').length, 0);
});
