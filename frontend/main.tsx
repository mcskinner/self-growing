import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Transcript, Message } from './transcript';
import './transcript';
import './style.css';

interface State { messages: Message[]; busy: boolean; error: string | null; activity: string }

function App() {
  const [state, setState] = useState<State>({ messages: [], busy: false, error: null, activity: '' });
  const [connected, setConnected] = useState(false);
  const [draft, setDraft] = useState(() => sessionStorage.getItem('draft') || '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const host = useRef<HTMLDivElement>(null);
  const transcript = useRef<Transcript | null>(null);
  const scroller = useRef<HTMLElement>(null);
  const follow = useRef(true);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = document.createElement('sg-transcript') as Transcript;
    host.current!.append(element);
    transcript.current = element;
    const events = new EventSource('/api/events');
    events.onmessage = event => { setState(JSON.parse(event.data)); setConnected(true); };
    events.onerror = () => setConnected(false);
    return () => { events.close(); element.remove(); };
  }, []);

  useLayoutEffect(() => {
    if (!transcript.current) return;
    transcript.current.messages = state.messages;
    void transcript.current.updateComplete.then(() => {
      if (follow.current && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
    });
  }, [state]);

  useEffect(() => {
    sessionStorage.setItem('draft', draft);
    if (input.current) {
      input.current.style.height = 'auto';
      input.current.style.height = `${Math.min(input.current.scrollHeight, 200)}px`;
    }
  }, [draft]);

  async function send() {
    if (!draft.trim() || sending || state.busy || !connected) return;
    setSending(true);
    setError('');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: draft }),
      });
      if (!response.ok) throw new Error((await response.json()).detail || 'Could not send message');
      setDraft('');
      follow.current = true;
    } catch (err) { setError(String(err)); }
    finally { setSending(false); input.current?.focus(); }
  }

  async function stop() {
    try {
      const response = await fetch('/api/stop', { method: 'POST' });
      if (!response.ok) throw new Error('Could not stop Pi');
    } catch (err) { setError(String(err)); }
  }

  return <div className="app">
    <header><a className="brand" href="/" aria-label="Self-growing home"><span className="seed">✳</span> self-growing</a>
      <span className="connection"><i className={connected ? 'online' : ''} />{connected ? 'Local workspace' : 'Connecting…'}</span>
    </header>
    <main ref={scroller} onScroll={() => {
      const el = scroller.current!;
      follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    }}>
      <div className="conversation">
        {!state.messages.length && <section className="welcome">
          <div className="eyebrow">A little software, room to grow.</div>
          <h1>What should we build?</h1>
          <p>This is your starting point. Ask for a change,<br className="desktop" /> and watch this app become your own.</p>
        </section>}
        <div ref={host} />
        {state.busy && <div className="activity" role="status"><span className="pulse" />{state.activity || 'Working'}</div>}
      </div>
    </main>
    <footer>
      {(error || state.error) && <div className="error" role="alert">{error || state.error}</div>}
      <form onSubmit={event => { event.preventDefault(); void send(); }}>
        <textarea ref={input} value={draft} rows={1} aria-label="Message Pi"
          placeholder="Ask Pi to change this app…" onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault(); void send();
            }
          }} />
        {state.busy ? <button type="button" onClick={() => void stop()} aria-label="Stop Pi" title="Stop">■</button>
          : <button type="submit" disabled={!draft.trim() || !connected || sending} aria-label="Send message" title="Send">↑</button>}
      </form>
      <div className="footnote"><span>Pi can edit files and run commands in this workspace.</span><span>Enter to send · Shift + Enter for a new line</span></div>
    </footer>
  </div>;
}

createRoot(document.getElementById('root')!).render(<App />);
