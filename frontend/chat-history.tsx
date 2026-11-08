import { useEffect, useRef, useState } from 'react';

interface SavedChat { id: string; title: string; updatedAt: string | null }

export function ChatHistory({ open, currentId, blocked, switching, onClose, onSelect, onNew }: {
  open: boolean; currentId: string | null; blocked: boolean; switching: boolean;
  onClose: () => void; onSelect: (id: string) => void; onNew: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const motion = useRef<Animation | null>(null);
  const [chats, setChats] = useState<SavedChat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const wasOpen = element.open;
    const from = wasOpen ? getComputedStyle(element).transform : 'translateX(-100%)';
    motion.current?.cancel();
    if (open && !wasOpen) element.showModal();
    if (!open && !wasOpen) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (!open) element.close();
      return;
    }
    const animation = element.animate([
      { transform: from }, { transform: open ? 'translateX(0)' : 'translateX(-100%)' },
    ], { duration: open ? 200 : 160, easing: 'cubic-bezier(.2, .8, .2, 1)', fill: 'forwards' });
    motion.current = animation;
    void animation.finished.then(() => {
      if (motion.current !== animation) return;
      if (!open) element.close();
      animation.cancel(); motion.current = null;
    }).catch(() => {}); // Reversing direction intentionally cancels the previous animation.
  }, [open]);
  useEffect(() => () => motion.current?.cancel(), []);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true); setError('');
    void fetch('/api/sessions', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Could not load saved chats');
      setChats((await response.json()).sessions);
    }).catch(error => { if (!controller.signal.aborted) setError(String(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, currentId]);

  return <dialog ref={dialog} id="chat-history" className="chat-history" data-open={open} aria-labelledby="history-title"
    onCancel={event => { event.preventDefault(); onClose(); }} onClose={onClose} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
    <div className="history-heading">
      <h2 id="history-title">Chats</h2>
      <button className="icon-button" onClick={onClose} aria-label="Close chat history" title="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" aria-hidden="true" focusable="false">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
    <button className="quiet-button history-new" disabled={blocked} onClick={onNew}>New chat</button>
    {blocked && <p className="history-note" role="status">{switching ? 'Opening chat…' : 'Finish or stop the run and clear unsent messages before switching chats.'}</p>}
    {loading && <p className="history-note" role="status">Loading chats…</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {!loading && !error && !chats.length && <p className="history-note">Your conversations will appear here.</p>}
    <ul className="history-list" aria-label="Saved conversations">{chats.map(chat => <li key={chat.id}>
      <button disabled={blocked || chat.id === currentId} aria-current={chat.id === currentId ? 'page' : undefined}
        onClick={() => onSelect(chat.id)}>
        <span className="history-title">{chat.title}</span>
        <span className="history-date">{chat.id === currentId ? 'Current chat' : chat.updatedAt
          ? new Date(chat.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'New chat'}</span>
      </button>
    </li>)}</ul>
  </dialog>;
}
