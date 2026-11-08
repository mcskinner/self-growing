import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composerError, providerErrorText } from '../frontend/chat-errors.ts';
import type { Message } from '../frontend/transcript.ts';

test('provider failures already in the transcript are not repeated above the composer', () => {
  const messages: Message[] = [
    { role: 'assistant', content: [], errorMessage: 'fetch failed' },
    { role: 'user', content: 'Try again' },
    { role: 'assistant', content: 'Working on it' },
  ];
  assert.equal(composerError('fetch failed', messages), '');
  assert.equal(composerError(null, messages), '');
  assert.equal(composerError('Pi disconnected', messages), 'Pi disconnected');
});

test('unrepresented provider failures remain visible with readable network-error text', () => {
  const text = 'Could not reach the model provider. Please try again.';
  assert.equal(providerErrorText('fetch failed'), text);
  assert.equal(providerErrorText('TypeError: Failed to fetch'), text);
  assert.equal(composerError('fetch failed', []), text);
  assert.equal(composerError('fetch failed', [], true), '');
  assert.equal(providerErrorText('Rate limit exceeded'), 'Rate limit exceeded');
});
