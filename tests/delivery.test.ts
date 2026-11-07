import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deliverMessage, restoreOutbox } from '../frontend/delivery.ts';

test('reloads preserve unsent messages but never automatically replay an in-flight message', () => {
  const restored = restoreOutbox(JSON.stringify([
    { id: 'one', text: 'Unsent', status: 'pending' },
    { id: 'two', text: 'May already be accepted', status: 'sending' },
    { id: 'three', text: 'Needs review', status: 'uncertain' },
  ]));
  assert.deepEqual(restored.map(item => item.status), ['pending', 'uncertain', 'uncertain']);
  assert.equal(restored[1].text, 'May already be accepted');
});

test('legacy unsent messages remain sendable and invalid browser storage is harmless', () => {
  assert.deepEqual(restoreOutbox('[{"id":"old","text":"Hello"}]'), [
    { id: 'old', text: 'Hello', status: 'pending' },
  ]);
  assert.deepEqual(restoreOutbox('not json'), []);
  assert.deepEqual(restoreOutbox('{"unrelated":true}'), []);
  assert.deepEqual(restoreOutbox('[null,{},42]'), []);
});

function server(postStatus = 202) {
  const sent: string[] = [];
  const fetcher: typeof fetch = async (url, init) => {
    assert.equal(url, '/api/chat'); // No idle-state gate: active runs accept steering.
    sent.push(JSON.parse(String(init?.body)).message);
    return Response.json({ detail: 'Rejected' }, { status: postStatus });
  };
  return { fetcher, sent };
}

test('messages are submitted directly, including during active runs', async () => {
  const fake = server();
  assert.equal(await deliverMessage('change direction', () => true, fake.fetcher), 'sent');
  assert.deepEqual(fake.sent, ['change direction']);
});

test('paused or removed messages are not submitted', async () => {
  const fake = server();
  assert.equal(await deliverMessage('follow-up', () => false, fake.fetcher), 'waiting');
  assert.deepEqual(fake.sent, []);
});

test('accepted messages are sent in order without changing their text', async () => {
  const fake = server();
  for (const message of ['First\nmessage', 'Second message']) {
    assert.equal(await deliverMessage(message, () => true, fake.fetcher), 'sent');
  }
  assert.deepEqual(fake.sent, ['First\nmessage', 'Second message']);
});

test('startup and settling races keep the message queued for another attempt', async () => {
  const fake = server(409);
  assert.equal(await deliverMessage('follow-up', () => true, fake.fetcher), 'waiting');
});

test('known pre-acceptance reload responses retry without pausing', async () => {
  const fetcher: typeof fetch = async () => Response.json(
    { detail: 'Backend is reloading' }, { status: 503, headers: { 'Retry-After': '1' } },
  );
  assert.equal(await deliverMessage('instruction', () => true, fetcher), 'waiting');
});

test('server and network failures are surfaced, not silently retried', async () => {
  const fake = server(503);
  await assert.rejects(deliverMessage('follow-up', () => true, fake.fetcher), /Rejected/);
  await assert.rejects(deliverMessage('follow-up', () => true, async () => {
    throw new Error('Offline');
  }), /Offline/);
});
