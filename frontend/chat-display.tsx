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
    <button ref={button} className="quiet-button" aria-expanded={open} aria-controls="chat-display-panel"
      onClick={() => setOpen(value => !value)}>Chat display</button>
    {open && <section id="chat-display-panel" className="chat-display-panel" aria-label="Chat display preferences">
      <h2>Chat display</h2>
      <label><input ref={checkbox} type="checkbox" checked={showDetails} onChange={event => onChange(event.target.checked)} />
        <span>Show thinking and tool activity</span></label>
      <p>Show thinking, edits, commands, and tool results. Replies and provider errors are always visible.</p>
    </section>}
  </div>;
}
