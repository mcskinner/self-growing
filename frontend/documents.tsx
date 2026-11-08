import { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error((await response.json()).detail || 'Request failed');
  return response.json();
}

export function DocumentPicker({ onOpen }: { onOpen: (path: string) => void }) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  async function open() {
    setOpening(true); setError('');
    try {
      const result = await request<{ path: string | null }>('/api/documents/pick', { method: 'POST' });
      if (result.path) onOpen(result.path);
    } catch (err) { setError(String(err)); }
    finally { setOpening(false); }
  }
  return <div className="document-picker">
    <button className="icon-button" disabled={opening} aria-label="Open document" title={opening ? 'Choosing document…' : 'Open document'}
      aria-busy={opening} onClick={() => void open()}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M20 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2Z" />
      </svg>
    </button>
    {error && <span className="error" role="alert">{error} <button className="quiet-button" onClick={() => void open()}>Retry</button></span>}
  </div>;
}

interface Document { path: string; content: string }

export function DocumentView({ path, busy, onClose, onOpen }: {
  path: string; busy: boolean; onClose: () => void; onOpen: (path: string) => void;
}) {
  const [doc, setDoc] = useState<Document | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
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
    <div className="document-toolbar"><div><span className="eyebrow">DOCUMENT</span><strong title={doc?.path || path}>{doc?.path || path}</strong></div>
      <button className="icon-button" onClick={onClose} aria-label="Close document" title="Close document">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button></div>
    <div className="document-scroll" aria-busy={loading}>
      {loading && <p role="status">Loading document…</p>}
      {error && <div className="error" role="alert">{error} <button className="quiet-button" disabled={loading}
        onClick={() => setLoadAttempt(attempt => attempt + 1)}>Retry</button></div>}
      {doc && <article className="markdown-document" dangerouslySetInnerHTML={{ __html: html }} onClick={event => {
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
  </section>;
}
