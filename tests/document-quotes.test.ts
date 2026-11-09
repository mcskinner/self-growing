import assert from 'node:assert/strict';
import test from 'node:test';
import { appendDocumentQuote, MAX_DRAFT_LENGTH } from '../frontend/document-quotes.ts';

test('a document quote preserves the draft and attributes every line of the passage', () => {
  assert.equal(appendDocumentQuote('Please consider:', { path: 'docs/wiki/index.md', text: 'First\n\nLast' }),
    'Please consider:\n\nFrom docs/wiki/index.md:\n> First\n> \n> Last\n\n');
});

test('empty drafts and repeated quotes remain editable plain text', () => {
  const quote = { path: 'docs/notes.md', text: '  indented\r\nnext' };
  const first = appendDocumentQuote('', quote);
  assert.equal(first, 'From docs/notes.md:\n>   indented\n> next\n\n');
  assert.equal(appendDocumentQuote(first, quote), `${first}\n\n${first}`);
  assert.equal(appendDocumentQuote('Keep this', { ...quote, text: ' \n ' }), 'Keep this');
});

test('quotes exceeding the composer limit are rejected instead of truncating existing work', () => {
  assert.throws(() => appendDocumentQuote('x'.repeat(MAX_DRAFT_LENGTH), { path: 'docs/a.md', text: 'Quote' }),
    /exceed the draft limit/);
});
