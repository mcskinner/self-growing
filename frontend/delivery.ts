export interface OutboundMessage { id: string; text: string; status: 'pending' | 'sending' | 'uncertain' }

/** A refresh during submission is ambiguous, not permission to send the message again. */
export function restoreOutbox(raw: string | null): OutboundMessage[] {
  try {
    const saved: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter(item => item && typeof item.id === 'string' && typeof item.text === 'string')
      .map(item => ({ id: item.id, text: item.text,
        status: item.status === 'sending' || item.status === 'uncertain' ? 'uncertain' : 'pending' }));
  } catch { return []; }
}

/** Pi handles active-run messages as steering; only startup/settling races need retrying. */
export async function deliverMessage(
  text: string,
  canSend: () => boolean,
  fetcher: typeof fetch = fetch,
  sessionId?: string | null,
): Promise<'sent' | 'waiting'> {
  if (!canSend()) return 'waiting';
  const response = await fetcher('/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(20000),
    body: JSON.stringify({ message: text, ...(sessionId ? { sessionId } : {}) }),
  });
  if (response.status === 409 || (response.status === 503 && response.headers.has('Retry-After'))) return 'waiting';
  if (!response.ok) throw new Error((await response.json()).detail || 'Could not send message');
  return 'sent';
}
