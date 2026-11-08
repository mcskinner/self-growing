import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chatKey, migrateChatStorage } from '../frontend/chat-storage.ts';
import { deliverMessage, restoreOutbox } from '../frontend/delivery.ts';

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); } };
}

test('legacy drafts and uncertain messages migrate to one conversation only', () => {
  const saved = storage();
  saved.setItem('draft', 'Unsent draft');
  saved.setItem('message-queue', JSON.stringify([{ id: 'one', text: 'Check delivery', status: 'sending' }]));
  migrateChatStorage(saved, null);
  assert.equal(saved.getItem('draft'), 'Unsent draft');
  migrateChatStorage(saved, 'first');
  assert.equal(saved.getItem(chatKey('first', 'draft')), 'Unsent draft');
  assert.equal(saved.getItem('draft'), null);
  const queue = restoreOutbox(saved.getItem(chatKey('first', 'message-queue')));
  assert.equal(queue[0].status, 'uncertain');
  migrateChatStorage(saved, 'second');
  assert.equal(saved.getItem(chatKey('second', 'draft')), null);
  assert.equal(saved.getItem(chatKey('second', 'message-queue')), null);
});

test('session drafts remain separate and migration never overwrites a saved draft', () => {
  const saved = storage();
  saved.setItem('draft', 'Legacy');
  saved.setItem(chatKey('first', 'draft'), 'First draft');
  saved.setItem(chatKey('second', 'draft'), 'Second draft');
  migrateChatStorage(saved, 'first');
  assert.equal(saved.getItem(chatKey('first', 'draft')), 'First draft');
  assert.equal(saved.getItem(chatKey('second', 'draft')), 'Second draft');
});

test('delivery is pinned to its conversation and a stale-session rejection is not retried', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async (_url, init) => {
    calls++;
    assert.deepEqual(JSON.parse(String(init?.body)), { message: 'Instruction', sessionId: 'original' });
    return Response.json({ detail: 'The selected chat changed' }, { status: 412 });
  };
  await assert.rejects(deliverMessage('Instruction', () => true, fetcher, 'original'), /selected chat changed/);
  assert.equal(calls, 1);
});
