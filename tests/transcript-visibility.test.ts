import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visibleMessages } from '../frontend/transcript-visibility.ts';
import type { Message } from '../frontend/transcript.ts';

const messages: Message[] = [
  { role: 'user', content: 'Please edit this' },
  { role: 'assistant', content: [{ type: 'thinking', thinking: 'Considering the edit' }] },
  { role: 'assistant', content: [{ type: 'toolCall', name: 'edit', arguments: { path: 'file.md' } }] },
  { role: 'toolResult', toolName: 'edit', content: 'File edited' },
  { role: 'assistant', content: [
    { type: 'thinking', thinking: 'Check the result' },
    { type: 'text', text: 'Done.' },
  ] },
];

test('default view keeps replies and omits thinking, tools, and empty shells', () => {
  const visible = visibleMessages(messages, false);
  assert.equal(visible.length, 2);
  assert.equal(visible[0], messages[0]);
  assert.deepEqual(visible[1].content, [{ type: 'text', text: 'Done.' }]);
  assert.deepEqual(visibleMessages([{ role: 'assistant', content: [] }], false), []);
});

test('details can be restored without changing the saved messages', () => {
  const original = JSON.stringify(messages);
  visibleMessages(messages, false);
  assert.deepEqual(visibleMessages(messages, true), messages);
  assert.equal(JSON.stringify(messages), original);
});

test('errors stay visible even when details are off', () => {
  const errors: Message[] = [
    { role: 'toolResult', isError: true, toolName: 'bash', content: 'Command failed' },
    { role: 'assistant', content: [], errorMessage: 'Provider failed' },
  ];
  assert.deepEqual(visibleMessages(errors, false), errors);
});

test('plain-text assistant messages remain visible', () => {
  assert.deepEqual(visibleMessages([{ role: 'assistant', content: 'Reply' }], false), [
    { role: 'assistant', content: [{ type: 'text', text: 'Reply' }] },
  ]);
});
