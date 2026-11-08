import { useEffect, useRef, useState, type ReactNode } from 'react';
import { renderMarkdown } from './markdown';

interface DocumentData { path: string; name: string; content: string }
const clamp = (value: number) => Math.min(70, Math.max(30, value));

export function ReaderLayout({ busy, children }: { busy: boolean; children: ReactNode }) {
  const [path, setPath] = useState(() => sessionStorage.getItem('open-document') || '');
  const [entry, setEntry] = useState('');
  const [picker, setPicker] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [chooserError, setChooserError] = useState('');
  const [data, setData] = useState<DocumentData | null>(null);
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [width, setWidth] = useState(() => {
    const saved = Number(localStorage.getItem('reader-width') || 50);
    return Number.isFinite(saved) ? clamp(saved) : 50;
  });
  const panes = useRef<HTMLDivElement>(null);
  const previousBusy = useRef(busy);
  const choiceVersion = useRef(0);

  useEffect(() => {
    if (previousBusy.current && !busy) setRetry(value => value + 1);
    previousBusy.current = busy;
  }, [busy]);
  useEffect(() => { localStorage.setItem('reader-width', String(width)); }, [width]);
  useEffect(() => {
    sessionStorage.setItem('open-document', path);
    setData(null); setHtml(''); setError('');
    if (!path) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    void (async () => {
      try {
        const response = await fetch(`/api/documents?path=${encodeURIComponent(path)}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || 'Could not read Markdown');
        if (controller.signal.aborted) return;
        setHtml(renderMarkdown(result.content)); setData(result);
      } catch (err) {
        if (!controller.signal.aborted) setError(String(err));
      } finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [path, retry]);

  function open(value: string) {
    choiceVersion.current++;
    setPath(value); setRetry(count => count + 1); setPicker(false); setChooserError('');
  }
  async function choose() {
    const version = ++choiceVersion.current;
    setChoosing(true); setChooserError('');
    try {
      const response = await fetch('/api/documents/choose', { method: 'POST' });
      const result = await response.json();
      if (version !== choiceVersion.current) return;
      if (!response.ok) throw new Error(result.detail || 'Could not choose a file');
      if (result.path) open(result.path);
    } catch (err) { if (version === choiceVersion.current) setChooserError(String(err)); }
    finally { setChoosing(false); }
  }

  return <div className="reader-shell">
    <div className="reader-toolbar">
      <button className="quiet-button" onClick={() => { setPicker(value => !value); setChooserError(''); }}
        aria-expanded={picker}>Open Markdown</button>
      {path && <><span className="document-path" title={data?.path || path}>{data?.path || path}</span>
        <button className="quiet-button" onClick={() => setRetry(value => value + 1)}>Refresh</button>
        <button className="quiet-button" onClick={() => { choiceVersion.current++; setPath(''); }}>Close document</button></>}
    </div>
    {picker && <div className="document-picker">
      <button className="quiet-button" disabled={choosing} onClick={() => void choose()}>{choosing ? 'Choosing…' : 'Choose local file…'}</button>
      <form onSubmit={event => { event.preventDefault(); if (entry.trim()) open(entry.trim()); }}>
        <label htmlFor="document-path">Or local path</label>
        <input id="document-path" value={entry} onChange={event => setEntry(event.target.value)} placeholder="/path/to/file.md" />
        <button className="quiet-button" disabled={!entry.trim()}>Open</button>
      </form>
      <button className="quiet-button" onClick={() => { choiceVersion.current++; setPicker(false); }}>Cancel</button>
      {chooserError && <p className="error" role="alert">{chooserError} <button className="quiet-button" disabled={choosing} onClick={() => void choose()}>Retry</button></p>}
    </div>}
    <div className={`reader-panes${path ? ' has-document' : ''}`} ref={panes}>
      {path && <><section className="document-pane" aria-label="Markdown reader" style={{ flexBasis: `${width}%` }}>
        {loading && <p className="reader-notice" role="status">Loading Markdown…</p>}
        {error && <div className="reader-notice error" role="alert">{error} <button className="quiet-button" onClick={() => setRetry(value => value + 1)}>Retry</button></div>}
        {data && <article className="markdown-document" dangerouslySetInnerHTML={{ __html: html }} />}
      </section>
      <div className="reader-separator" role="separator" tabIndex={0} aria-label="Reader width" aria-orientation="vertical"
        aria-valuemin={30} aria-valuemax={70} aria-valuenow={Math.round(width)} aria-controls="reader-chat"
        onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={event => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          const rect = panes.current!.getBoundingClientRect();
          setWidth(clamp((event.clientX - rect.left) / rect.width * 100));
        }}
        onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
        onKeyDown={event => {
          const values: Record<string, number> = { ArrowLeft: width - 2, ArrowRight: width + 2, Home: 30, End: 70 };
          if (event.key in values) { event.preventDefault(); setWidth(clamp(values[event.key])); }
        }} />
      </>}
      <div className="reader-chat" id="reader-chat">{children}</div>
    </div>
  </div>;
}
