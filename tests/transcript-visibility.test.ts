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

test('failed tools follow the details toggle while assistant errors stay visible', () => {
  const errors: Message[] = [
    { role: 'toolResult', isError: true, toolName: 'bash', content: 'Command failed' },
    { role: 'assistant', content: [], errorMessage: 'Provider failed' },
  ];
  assert.deepEqual(visibleMessages(errors, false), [errors[1]]);
  assert.deepEqual(visibleMessages(errors, true), errors);
});

test('retry failures stay hidden while running and disappear after recovery', () => {
  const attempt: Message = { role: 'assistant', content: [], errorMessage: 'fetch failed' };
  const retry: Message = { role: 'assistant', content: [], errorMessage: 'fetch failed again' };
  const prompt: Message = { role: 'user', content: 'Build it' };
  const reply: Message = { role: 'assistant', content: 'Done' };
  for (const showDetails of [false, true]) {
    assert.deepEqual(visibleMessages([prompt, attempt], showDetails, true), [prompt]);
    assert.deepEqual(visibleMessages([prompt, attempt, retry], showDetails, true), [prompt]);
    assert.deepEqual(visibleMessages([prompt, attempt, retry], showDetails, false), [prompt, retry]);
    assert.deepEqual(visibleMessages([prompt, attempt, retry, reply], showDetails, false), [
      prompt, { ...reply, content: [{ type: 'text', text: 'Done' }] },
    ]);
  }
});

test('an exhausted failure stays visible during a later user turn and after restoration', () => {
  const failure: Message = { role: 'assistant', content: [], errorMessage: 'Provider unavailable' };
  const next: Message = { role: 'user', content: 'Another request' };
  assert.deepEqual(visibleMessages([failure, next], false, true), [failure, next]);
  assert.deepEqual(visibleMessages([failure], false, false), [failure]);
});

test('plain-text assistant messages remain visible', () => {
  assert.deepEqual(visibleMessages([{ role: 'assistant', content: 'Reply' }], false), [
    { role: 'assistant', content: [{ type: 'text', text: 'Reply' }] },
  ]);
});
