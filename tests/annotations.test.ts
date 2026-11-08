import { test } from 'node:test';
import assert from 'node:assert/strict';
import { locate } from '../frontend/annotations.ts';

const annotation = (quote: string, prefix = '', suffix = '') => ({
  id: 'comment', quote, anchor: { start: 0, end: quote.length, prefix, suffix },
});

test('locates a passage after text is inserted before it', () => {
  assert.equal(locate('New introduction. Original passage here.', annotation('passage', 'Original ', ' here.')), 27);
});

test('uses context to distinguish repeated text', () => {
  assert.equal(locate('First: plan. Second: plan.', annotation('plan', 'Second: ', '.')), 21);
});

test('does not attach ambiguous repeated text or removed passages', () => {
  assert.equal(locate('plan plan', { id: 'legacy', quote: 'plan' }), null);
  assert.equal(locate('plan plan', annotation('plan', 'Missing prefix ', '')), null);
  assert.equal(locate('A rewritten paragraph', annotation('removed words')), null);
  assert.equal(locate('anything', annotation('')), null);
});

test('legacy comments reattach only when their excerpt is unique', () => {
  assert.equal(locate('A unique passage', { id: 'legacy', quote: 'unique' }), 2);
});

test('keeps whitespace and Unicode offsets in rendered text', () => {
  assert.equal(locate('😀\nBold and italic text', annotation('Bold and italic')), 3);
});
