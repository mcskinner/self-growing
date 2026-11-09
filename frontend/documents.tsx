import { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import type { DocumentQuote } from './document-quotes';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error((await response.json()).detail || 'Request failed');
  return response.json();
}

export function DocumentPicker({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return <div className="document-picker">
    <button className="icon-button" aria-label="Project docs" title="Project docs"
      aria-haspopup="dialog" aria-expanded={open} aria-controls="project-docs" onClick={onToggle}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M20 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2Z" />
      </svg>
    </button>
  </div>;
}

interface Entry { path: string; name: string; children?: Entry[] }
interface Document { path: string; content: string }

export function ProjectDocs({ open, path, busy, onOpen, onClose }: {
  open: boolean; path: string; busy: boolean; onOpen: (path: string) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const motion = useRef<Animation | null>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const wasOpen = element.open;
    const from = wasOpen ? getComputedStyle(element).transform : 'translateX(100%)';
    motion.current?.cancel();
    if (open && !wasOpen) element.showModal();
    if (!open && !wasOpen) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (!open) element.close();
      return;
    }
    const animation = element.animate([
      { transform: from }, { transform: open ? 'translateX(0)' : 'translateX(100%)' },
    ], { duration: open ? 200 : 160, easing: 'cubic-bezier(.2, .8, .2, 1)', fill: 'forwards' });
    motion.current = animation;
    void animation.finished.then(() => {
      if (motion.current !== animation) return;
      if (!open) element.close();
      animation.cancel(); motion.current = null;
    }).catch(() => {}); // A reversed transition cancels the previous animation.
  }, [open]);
  useEffect(() => () => motion.current?.cancel(), []);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true); setError('');
    request<{ entries: Entry[] }>('/api/documents/tree', { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setEntries(data.entries); })
      .catch(err => { if (!controller.signal.aborted) setError(String(err)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, busy, attempt]);
  function tree(items: Entry[]) {
    return <ul>{items.map(item => <li key={item.path}>{item.children
      ? <details open><summary>{item.name}</summary>{tree(item.children)}</details>
      : <button title={item.path} aria-current={path === item.path ? 'page' : undefined}
          onClick={() => { onOpen(item.path); onClose(); }}>{item.name}</button>}</li>)}</ul>;
  }
  return <dialog ref={dialog} id="project-docs" className="chat-history docs-drawer" data-open={open}
    aria-labelledby="docs-title" onCancel={event => { event.preventDefault(); onClose(); }} onClose={onClose}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
    <div className="history-heading"><h2 id="docs-title">Project docs <span className="docs-root">docs/</span></h2>
      <button className="icon-button" onClick={onClose} aria-label="Close project docs" title="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button></div>
      <nav className="docs-tree" aria-label="Documentation files">
        {loading && <p role="status">Loading files…</p>}
        {error && <p className="error" role="alert">{error} <button onClick={() => setAttempt(a => a + 1)}>Retry</button></p>}
        {!loading && !error && !entries.length && <p>No Markdown documents in docs/ yet.</p>}
        {tree(entries)}
      </nav>
  </dialog>;
}

export function DocumentView({ path, busy, onOpen, onClose, onQuote }: {
  path: string; busy: boolean; onOpen: (path: string) => void; onClose: () => void;
  onQuote: (quote: DocumentQuote) => void;
}) {
  const article = useRef<HTMLElement>(null);
  const quoteButton = useRef<HTMLButtonElement>(null);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  useEffect(() => {
    function changed() {
      const selected = window.getSelection();
      const root = article.current;
      if (!selected || selected.isCollapsed || !selected.rangeCount || !root?.contains(selected.anchorNode) || !root.contains(selected.focusNode)) {
        // Keep keyboard activation possible after tabbing from the selected text.
        if (document.activeElement !== quoteButton.current) setSelection(null);
        return;
      }
      const text = selected.toString();
      if (!text.trim()) { setSelection(null); return; }
      const rect = selected.getRangeAt(0).getBoundingClientRect();
      const panel = root.parentElement!.getBoundingClientRect();
      const top = Math.max(0, panel.top);
      const bottom = Math.min(window.innerHeight, panel.bottom);
      if (rect.bottom < top || rect.top > bottom) { setSelection(null); return; }
      setSelection({ text,
        x: Math.max(8, Math.min(rect.left, window.innerWidth - 140)),
        y: Math.max(top + 8, Math.min(rect.bottom + 8, bottom - 44)),
      });
    }
    function dismiss(event: KeyboardEvent) {
      if (event.key === 'Escape') { setSelection(null); window.getSelection()?.removeAllRanges(); }
    }
    document.addEventListener('selectionchange', changed);
    document.addEventListener('scroll', changed, true);
    window.addEventListener('resize', changed);
    document.addEventListener('keydown', dismiss);
    return () => {
      document.removeEventListener('selectionchange', changed);
      document.removeEventListener('scroll', changed, true);
      window.removeEventListener('resize', changed);
      document.removeEventListener('keydown', dismiss);
    };
  }, []);
  const [doc, setDoc] = useState<Document | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setDoc(null); setSelection(null);
    request<Document>(`/api/documents/content?path=${encodeURIComponent(path)}`, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setDoc(data);
    }).catch(err => {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : String(err));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, busy, loadAttempt]);
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(doc?.content || '', { async: false }), {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'ul', 'ol', 'li', 'blockquote',
      'pre', 'code', 'em', 'strong', 'del', 's', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sup', 'sub'],
    ALLOWED_ATTR: ['href', 'title', 'start', 'colspan', 'rowspan', 'align', 'id'],
  }), [doc?.content]);

  async function followLink(href: string) {
    try {
      setError('');
      const result = await request<{ path: string }>(`/api/documents/resolve?path=${encodeURIComponent(doc?.path || path)}&link=${encodeURIComponent(href)}`);
      onOpen(result.path);
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  }

  return <section className="document-panel" aria-label="Markdown reader">
    <div className="document-toolbar"><strong title={doc?.path || path}>{doc?.path || path}</strong>
      <button className="icon-button" onClick={onClose} aria-label="Close document" title="Close document">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button></div>
    <div className="document-scroll" aria-busy={loading}>
      {loading && <p role="status">Loading document…</p>}
      {error && <div className="error" role="alert">{error} <button className="quiet-button" disabled={loading}
        onClick={() => setLoadAttempt(attempt => attempt + 1)}>Retry</button></div>}
      {doc && <article ref={article} className="markdown-document" dangerouslySetInnerHTML={{ __html: html }} onClick={event => {
        const link = (event.target as HTMLElement).closest('a');
        if (!link) return;
        const href = link.getAttribute('href') || '';
        event.preventDefault();
        if (href.startsWith('#')) {
          try { event.currentTarget.querySelector(`#${CSS.escape(decodeURIComponent(href.slice(1)))}`)?.scrollIntoView({ block: 'nearest' }); } catch { /* Invalid fragment. */ }
        } else if (!/^[a-z][a-z\d+.-]*:|^\/\//i.test(href) && /\.(md|markdown)(?:[?#]|$)/i.test(href)) {
          void followLink(href);
        } else if (/^https?:\/\//i.test(href)) window.open(href, '_blank', 'noopener,noreferrer');
      }} />}
    </div>
    {selection && !loading && doc && <button ref={quoteButton} className="selection-quote" type="button"
      style={{ left: selection.x, top: selection.y }} onPointerDown={event => event.preventDefault()}
      onClick={() => {
        onQuote({ path: doc.path, text: selection.text });
        setSelection(null); window.getSelection()?.removeAllRanges();
      }}>Add to chat</button>}
  </section>;
}
