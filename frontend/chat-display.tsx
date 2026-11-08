import { useEffect, useRef, useState } from 'react';

export function ChatDisplay({ showDetails, onChange }: {
  showDetails: boolean; onChange: (enabled: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const checkbox = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    checkbox.current?.focus();
    function dismiss(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  return <div className="chat-display" ref={root} onKeyDown={event => {
    if (event.key === 'Escape' && open) {
      event.preventDefault(); setOpen(false); button.current?.focus();
    }
  }}>
    <button ref={button} className="icon-button" aria-label="Settings" title="Settings"
      aria-expanded={open} aria-controls="chat-display-panel" onClick={() => setOpen(value => !value)}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M9 2h6l.5 3 2 .9 2.5-1.4L22.5 9l-2.6 1.5v3l2.6 1.5-2.5 4.5-2.5-1.4-2 .9-.5 3H9l-.5-3-2-.9L4 19.5 1.5 15l2.6-1.5v-3L1.5 9 4 4.5l2.5 1.4 2-.9L9 2Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
    {open && <section id="chat-display-panel" className="chat-display-panel" aria-label="Settings">
      <h2>Settings</h2>
      <label><input ref={checkbox} type="checkbox" checked={showDetails} onChange={event => onChange(event.target.checked)} />
        <span>Show thinking and tool activity</span></label>
      <p>Show thinking, edits, commands, and tool results. Replies and provider errors are always visible.</p>
    </section>}
  </div>;
}
