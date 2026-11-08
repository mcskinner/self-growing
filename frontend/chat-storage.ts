type StorageAccess = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function chatKey(sessionId: string | null, field: string): string {
  return `chat:${sessionId || 'initial'}:${field}`;
}

/** Assign the old single-chat composer/outbox to the first restored conversation. */
export function migrateChatStorage(storage: StorageAccess, sessionId: string | null) {
  if (!sessionId || storage.getItem('chat-storage-migrated')) return;
  for (const field of ['draft', 'draft-cursor', 'message-queue', 'message-queue-paused']) {
    const value = storage.getItem(field);
    const key = chatKey(sessionId, field);
    if (value !== null && storage.getItem(key) === null) storage.setItem(key, value);
    storage.removeItem(field);
  }
  storage.setItem('chat-storage-migrated', 'true');
}
