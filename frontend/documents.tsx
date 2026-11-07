import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { annotate, type Anchor } from './annotations';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface Comment { id: string; text: string; quote: string; resolved: boolean; anchor?: Anchor | null }
interface Document { path: string; content: string; comments: Comment[]; storage: 'embedded' | 'legacy' }
interface SelectionAnchor { quote: string; anchor: Anchor }
interface Candidate extends SelectionAnchor { x: number; y: number }

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
    <button className="quiet-button" disabled={opening} onClick={() => void open()}>
      {opening ? 'Choosing…' : 'Open document…'}
    </button>
    {error && <span className="error" role="alert">{error}</span>}
  </div>;
}

export function DocumentView({ path, busy, onClose, onReview }: {
  path: string; busy: boolean; onClose: () => void; onReview: (text: string) => void;
}) {
  const [doc, setDoc] = useState<Document | null>(null);
  const [error, setError] = useState('');
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [draft, setDraft] = useState<SelectionAnchor | null>(null);
  const [text, setText] = useState('');
  const [active, setActive] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState('');
  const [layout, setLayout] = useState<{ tops: Record<string, number>; height: number }>({ tops: {}, height: 0 });
  const article = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLElement>(null);
  const commentInput = useRef<HTMLTextAreaElement>(null);
  const url = `/api/documents/content?path=${encodeURIComponent(path)}`;
  useEffect(() => {
    const controller = new AbortController();
    request<Document>(url, { signal: controller.signal }).then(data => {
      setDoc(data); setError('');
    }).catch(err => { if (!controller.signal.aborted) setError(String(err)); });
    return () => controller.abort();
  }, [url, busy]);
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(doc?.content || '', { async: false }), {
    FORBID_TAGS: ['img', 'style', 'input', 'mark'], FORBID_ATTR: ['style', 'data-comments', 'data-thread'],
  }), [doc?.content]);
  const openComments = useMemo(() => doc?.comments.filter(comment => !comment.resolved) || [], [doc]);
  const visible = useMemo(() => doc?.comments.filter(comment => showResolved || !comment.resolved) || [], [doc, showResolved]);
  const annotated = useMemo(() => annotate(html, [
    ...visible, ...(draft ? [{ ...draft, id: 'draft' }] : []),
  ]), [html, visible, draft]);

  // Capture offsets in the rendered text, plus surrounding context to reattach after edits.
  useEffect(() => {
    function capture() {
      const selection = window.getSelection();
      const root = article.current;
      if (!selection || !root || selection.isCollapsed || !selection.rangeCount ||
        !root.contains(selection.anchorNode) || !root.contains(selection.focusNode)) {
        setCandidate(null); return;
      }
      const range = selection.getRangeAt(0);
      const quote = range.toString();
      if (!quote.trim() || quote.length > 10000) { setCandidate(null); return; }
      const before = range.cloneRange();
      before.selectNodeContents(root);
      before.setEnd(range.startContainer, range.startOffset);
      const start = before.toString().length;
      const end = start + quote.length;
      const full = root.textContent || '';
      const rect = range.getBoundingClientRect();
      setCandidate({ quote, anchor: { start, end, prefix: full.slice(Math.max(0, start - 48), start), suffix: full.slice(end, end + 48) },
        x: Math.max(8, Math.min(rect.left, window.innerWidth - 170)), y: Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 48)) });
    }
    document.addEventListener('selectionchange', capture);
    return () => document.removeEventListener('selectionchange', capture);
  }, []);

  // Cards follow their passages vertically, stacking rather than overlapping.
  useLayoutEffect(() => {
    if (!canvas.current || !article.current || !rail.current) return;
    function measure() {
      const root = canvas.current!;
      const base = root.getBoundingClientRect().top;
      const marks = Array.from(article.current!.querySelectorAll<HTMLElement>('mark[data-comments]'));
      const cards = Array.from(rail.current!.querySelectorAll<HTMLElement>('[data-thread]'));
      const entries = cards.map(card => {
        const id = card.dataset.thread!;
        const mark = marks.find(item => item.dataset.comments?.split(' ').includes(id));
        return { id, card, target: mark ? mark.getBoundingClientRect().top - base : article.current!.offsetHeight + 24 };
      }).sort((a, b) => a.target - b.target);
      const tops: Record<string, number> = {};
      let bottom = 0;
      for (const entry of entries) {
        const top = Math.max(bottom, entry.target);
        tops[entry.id] = top;
        bottom = top + entry.card.offsetHeight + 12;
      }
      const next = { tops, height: bottom };
      setLayout(current => JSON.stringify(current) === JSON.stringify(next) ? current : next);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(article.current);
    rail.current.querySelectorAll('[data-thread]').forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, [annotated, visible, draft]);

  useEffect(() => {
    article.current?.querySelectorAll<HTMLElement>('mark[data-comments]').forEach(mark => {
      const selected = mark.dataset.comments?.split(' ').includes(active) || false;
      mark.classList.toggle('active-annotation', selected);
      mark.setAttribute('aria-pressed', String(selected));
    });
  }, [active, annotated]);

  useEffect(() => { if (draft) commentInput.current?.focus(); }, [draft]);

  async function addComment() {
    if (!text.trim() || !draft || saving) return;
    setSaving(true); setError('');
    try {
      const comment = await request<Comment>(`/api/documents/comments?path=${encodeURIComponent(path)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, ...draft }),
      });
      setDoc(current => current && { ...current, storage: 'embedded', comments: [...current.comments, comment] });
      setText(''); setDraft(null); setActive(comment.id);
    } catch (err) { setError(String(err)); }
    finally { setSaving(false); }
  }

  async function toggle(comment: Comment) {
    setUpdating(comment.id);
    try {
      const updated = await request<Comment>(`/api/documents/comments/${comment.id}?path=${encodeURIComponent(path)}`, { method: 'PATCH' });
      setDoc(current => current && { ...current, storage: 'embedded', comments: current.comments.map(item => item.id === updated.id ? updated : item) });
      setError('');
    } catch (err) { setError(String(err)); }
    finally { setUpdating(''); }
  }

  function activate(id: string, fromCard = false) {
    setActive(id);
    const target = fromCard
      ? Array.from(article.current?.querySelectorAll<HTMLElement>('mark[data-comments]') || []).find(mark => mark.dataset.comments?.split(' ').includes(id))
      : Array.from(rail.current?.querySelectorAll<HTMLElement>('[data-thread]') || []).find(card => card.dataset.thread === id);
    target?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function activateMark(target: EventTarget) {
    const mark = (target as HTMLElement).closest<HTMLElement>('mark[data-comments]');
    if (!mark) return;
    const ids = mark.dataset.comments!.split(' ').filter(id => id !== 'draft');
    if (ids.length) activate(ids[(ids.indexOf(active) + 1) % ids.length]);
  }

  return <section className="document-panel" aria-label="Document review">
    <div className="document-toolbar"><div><span className="eyebrow">DOCUMENT REVIEW</span><strong title={path}>{path}</strong></div>
      <button className="quiet-button" onClick={onClose}>Close ×</button></div>
    <div className="annotation-toolbar">
      <span title="Saving or resolving a comment updates an HTML metadata block in the original Markdown file.">Select a passage to comment · {openComments.length} open · {doc?.storage === 'legacy' ? 'Earlier comments not yet embedded' : 'Saved in Markdown'}</span>
      {doc?.storage === 'legacy' && <button className="quiet-button" disabled={saving} onClick={async () => {
        setSaving(true);
        try { setDoc(await request<Document>(`/api/documents/migrate?path=${encodeURIComponent(path)}`, { method: 'POST' })); setError(''); }
        catch (err) { setError(String(err)); }
        finally { setSaving(false); }
      }}>Move existing comments into file</button>}
      <label><input type="checkbox" checked={showResolved} onChange={event => setShowResolved(event.target.checked)} /> Show resolved</label>
      <button className="quiet-button" disabled={!openComments.length} onClick={() => onReview(
        `Please revise ${path} based on these annotations. Read the current document first; some passages may have changed. Preserve the markdown-review HTML metadata block and comment IDs.\n\n` +
        openComments.map((comment, index) => `${index + 1}. ${comment.quote ? `On this passage:\n> ${comment.quote.replace(/\n/g, '\n> ')}\n` : ''}${comment.text}`).join('\n\n')
      )}>Send review to chat ↗</button>
    </div>
    <div className="document-scroll" onScroll={() => setCandidate(null)}>
      {error && <div className="error" role="alert">{error}</div>}
      {!doc ? <p>Loading document…</p> : <div className="annotation-canvas" ref={canvas}>
        <article className="markdown-document" ref={article} dangerouslySetInnerHTML={{ __html: annotated.html }}
          onClick={event => {
            if (window.getSelection()?.isCollapsed && (event.target as HTMLElement).closest('mark[data-comments]')) {
              event.preventDefault(); activateMark(event.target);
            }
          }}
          onKeyDown={event => {
            if ((event.key === 'Enter' || event.key === ' ') && (event.target as HTMLElement).matches('mark[data-comments]')) {
              event.preventDefault(); activateMark(event.target);
            }
          }} />
        <aside className="annotation-rail" ref={rail} aria-label="Annotations" style={{ minHeight: layout.height }}>
          {!visible.length && !draft && <p className="annotation-empty">Highlight text in the document to start a conversation about it.</p>}
          {visible.map(comment => <div tabIndex={0} role="group" aria-label="Comment on passage"
            data-thread={comment.id} style={{ top: layout.tops[comment.id] || 0 }}
            className={`annotation-card ${active === comment.id ? 'active' : ''} ${comment.resolved ? 'resolved' : ''}`}
            key={comment.id} onClick={() => activate(comment.id, true)}
            onKeyDown={event => { if (event.key === 'Enter' && event.target === event.currentTarget) activate(comment.id, true); }}>
            <div className="annotation-label">You {comment.resolved && <span>· Resolved</span>}</div>
            {!annotated.attached.has(comment.id) && <div className="detached-note">{comment.quote ? 'Passage changed or could not be uniquely located.' : 'Earlier document-level comment.'}</div>}
            {comment.quote && <blockquote>{comment.quote}</blockquote>}
            <p>{comment.text}</p>
            <button className="quiet-button" disabled={!!updating} onClick={event => { event.stopPropagation(); void toggle(comment); }}>{comment.resolved ? 'Reopen' : 'Resolve'}</button>
          </div>)}
          {draft && <form data-thread="draft" className="annotation-card annotation-composer" style={{ top: layout.tops.draft || 0 }}
            onSubmit={event => { event.preventDefault(); void addComment(); }}>
            <div className="annotation-label">New comment</div>
            {!annotated.attached.has('draft') && <div className="detached-note">This passage changed while you were commenting.</div>}
            <blockquote>{draft.quote}</blockquote>
            <textarea ref={commentInput} value={text} maxLength={20000} rows={3} aria-label="Comment on selected text" placeholder="Leave a comment…" onChange={event => setText(event.target.value)} />
            <div className="annotation-actions"><button type="button" className="quiet-button" disabled={saving} onClick={() => { setDraft(null); setText(''); }}>Cancel</button>
              <button className="text-button" disabled={!text.trim() || saving} type="submit">{saving ? 'Saving…' : 'Comment'}</button></div>
          </form>}
        </aside>
      </div>}
    </div>
    {candidate && !draft && <button className="selection-popover text-button" style={{ left: candidate.x, top: candidate.y }}
      onMouseDown={event => event.preventDefault()} onClick={() => {
        setDraft({ quote: candidate.quote, anchor: candidate.anchor }); setActive('draft'); setCandidate(null);
        window.getSelection()?.removeAllRanges();
      }}>+ Comment</button>}
  </section>;
}
