import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Transcript, Message } from './transcript';
import { ChatDisplay } from './chat-display';
import { ContextMeter, type ContextUsage } from './context-meter';
import { useMessageQueue } from './message-queue';
import { composerError } from './chat-errors';
import './transcript';
import './style.css';

interface State {
  messages: Message[]; busy: boolean; error: string | null; activity: string;
  steering: string[]; context: ContextUsage | null; sessionId: string | null;
}

function App() {
  const [state, setState] = useState<State>({
    messages: [], busy: false, error: null, activity: '', steering: [], context: null, sessionId: null,
  });
  const [connected, setConnected] = useState(false);
  const [showDetails, setShowDetails] = useState(() => localStorage.getItem('show-chat-details') === 'true');
  const [draft, setDraft] = useState(() => sessionStorage.getItem('draft') || '');
  const messages = useMessageQueue(connected);
  const [startingSession, setStartingSession] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState('');
  const host = useRef<HTMLDivElement>(null);
  const transcript = useRef<Transcript | null>(null);
  const scroller = useRef<HTMLElement>(null);
  const follow = useRef(true);
  const input = useRef<HTMLTextAreaElement>(null);

  function saveComposer() {
    const element = input.current;
    if (!element) return;
    sessionStorage.setItem('draft', element.value);
    sessionStorage.setItem('draft-cursor', JSON.stringify([element.selectionStart, element.selectionEnd, element.selectionDirection]));
  }

  useLayoutEffect(() => {
    const element = input.current!;
    let start = element.value.length;
    let end = start;
    let direction: 'forward' | 'backward' | 'none' = 'none';
    try {
      const saved = JSON.parse(sessionStorage.getItem('draft-cursor') || 'null');
      if (Array.isArray(saved) && Number.isInteger(saved[0]) && Number.isInteger(saved[1])) {
        [start, end] = saved;
        if (saved[2] === 'forward' || saved[2] === 'backward') direction = saved[2];
      }
    } catch { /* A stale preference must not prevent typing. */ }
    element.focus({ preventScroll: true });
    element.setSelectionRange(start, end, direction);
    window.addEventListener('beforeunload', saveComposer);
    return () => { saveComposer(); window.removeEventListener('beforeunload', saveComposer); };
  }, []);

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
    transcript.current.showDetails = showDetails;
    transcript.current.busy = state.busy;
    void transcript.current.updateComplete.then(() => {
      if (follow.current && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
    });
  }, [state, showDetails]);

  useEffect(() => {
    sessionStorage.setItem('draft', draft);
    if (input.current) {
      input.current.style.height = 'auto';
      input.current.style.height = `${Math.min(input.current.scrollHeight, 200)}px`;
    }
  }, [draft]);
  useEffect(() => { localStorage.setItem('show-chat-details', String(showDetails)); }, [showDetails]);

  function send() {
    if (!draft.trim() || stopping || startingSession) return;
    messages.enqueue(draft);
    setDraft(''); setError(''); follow.current = true;
    input.current?.focus();
  }

  async function newChat() {
    if (state.busy || messages.queue.length || startingSession || stopping) return;
    if (!window.confirm('Start a fresh chat? This conversation stays saved on disk. Your unsent draft will be kept.')) return;
    setStartingSession(true); setError('');
    try {
      await messages.pauseAndWait();
      const response = await fetch('/api/session/new', { method: 'POST' });
      if (!response.ok) throw new Error((await response.json()).detail || 'Could not start a new chat');
      setState(await response.json());
      follow.current = true;
    } catch (err) { setError(String(err)); }
    finally { setStartingSession(false); input.current?.focus(); }
  }

  async function stop() {
    if (stopping) return;
    setStopping(true); setError('');
    try {
      await messages.pauseAndWait();
      const response = await fetch('/api/stop', { method: 'POST' });
      if (!response.ok) throw new Error('Could not stop Pi');
      const cleared = await response.json();
      messages.restore([...(cleared.steering || []), ...(cleared.followUp || [])]);
    } catch (err) { setError(String(err)); }
    finally { setStopping(false); input.current?.focus(); }
  }

  const visibleError = error || messages.error || composerError(state.error, state.messages, state.busy);

  return <div className="app">
    <header><a className="brand" href="/" aria-label="Self-growing home"><span className="seed">✳</span> self-growing</a>
      <div className="header-actions"><ChatDisplay showDetails={showDetails} onChange={setShowDetails} />
        <span className="connection"><i className={connected ? 'online' : ''} />{connected ? 'Local workspace' : 'Connecting…'}</span></div>
    </header>
    <main ref={scroller}
      onWheelCapture={event => { if (event.deltaY < 0) follow.current = false; }}
      onTouchMoveCapture={() => { follow.current = false; }}
      onKeyDownCapture={event => {
        if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) follow.current = false;
      }}
      onScroll={() => {
        const el = scroller.current!;
        follow.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 2;
      }}>
      <div className="conversation">
        {!state.messages.length && <section className="welcome">
          <div className="eyebrow">A little software, room to grow.</div>
          <h1>What should we build?</h1>
          <p>This is your starting point. Ask for a change,<br className="desktop" /> and watch this app become your own.</p>
        </section>}
        <div ref={host} />
        {state.busy && <div className="activity" role="status"><span className="pulse" />{showDetails ? state.activity || 'Working' : 'Working'}</div>}
      </div>
    </main>
    <footer>
      <ContextMeter usage={state.context} disabled={!connected || state.busy || !!messages.queue.length || stopping}
        starting={startingSession} onNew={() => void newChat()} />
      {visibleError && <div className="error" role="alert">{visibleError}</div>}
      {!!state.steering?.length && <details className="pending-steering">
        <summary>{state.steering.length} steering message{state.steering.length === 1 ? '' : 's'} waiting for Pi</summary>
        <ul>{state.steering.map((text, index) => <li key={index}>{text}</li>)}</ul>
      </details>}
      {!!messages.queue.length && <section className="message-queue" aria-label="Unsent messages">
        <div className="queue-heading"><span role="status">{messages.queue.some(item => item.status === 'uncertain')
          ? 'Delivery unconfirmed · Check chat before retrying' : `${messages.queue.length} unsent${messages.paused ? ' · Paused' : connected ? ' · Sending to Pi' : ' · Waiting for connection'}`}</span>
          {messages.paused && <button className="quiet-button" type="button" disabled={stopping} onClick={messages.resume}>
            {messages.queue.some(item => item.status === 'uncertain') ? 'Retry' : 'Resume'}</button>}</div>
        <ol>{messages.queue.map(message => <li key={message.id}>
          <span title={message.text}>{message.text}</span>
          <button type="button" className="quiet-button" disabled={message.status === 'sending'}
            aria-label="Remove unsent message" onClick={() => messages.remove(message.id)}>×</button>
        </li>)}</ol>
      </section>}
      <form onSubmit={event => { event.preventDefault(); send(); }}>
        <textarea ref={input} value={draft} rows={1} maxLength={100000} aria-label="Message Pi"
          placeholder={state.busy ? 'Steer Pi while it works…' : 'Ask Pi to change this app…'}
          onSelect={saveComposer} onChange={event => { setDraft(event.target.value); saveComposer(); }}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault(); send();
            }
          }} />
        {state.busy && <button type="button" className="stop-button" disabled={stopping || startingSession}
          onClick={() => void stop()} aria-label="Stop Pi and pause unsent messages" title="Stop Pi">■</button>}
        <button type="submit" disabled={!draft.trim() || stopping || startingSession}
          aria-label={state.busy ? 'Steer Pi' : 'Send message'} title={state.busy ? 'Send at the next tool/turn boundary' : 'Send'}>↑</button>
      </form>
      <div className="footnote"><span>Pi can edit files and run commands in this workspace.</span><span>Enter to {state.busy ? 'steer' : 'send'} · Shift + Enter for a new line</span></div>
    </footer>
  </div>;
}

createRoot(document.getElementById('root')!).render(<App />);
