import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Transcript, Message } from './transcript';
import { ChatDisplay } from './chat-display';
import { ChatHistory } from './chat-history';
import { chatKey, migrateChatStorage } from './chat-storage';
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
  const [state, setState] = useState<State | null>(null);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const events = new EventSource('/api/events');
    events.onmessage = event => {
      const snapshot: State = JSON.parse(event.data);
      migrateChatStorage(sessionStorage, snapshot.sessionId);
      setState(snapshot); setConnected(true);
    };
    events.onerror = () => setConnected(false);
    return () => events.close();
  }, []);
  if (!state) return <div className="app"><p className="connecting" role="status">Connecting to your workspace…</p></div>;
  // Each conversation owns its draft/outbox closures, even if an old request finishes late.
  return <Chat key={state.sessionId || 'initial'} state={state} connected={connected} />;
}

function Chat({ state, connected }: { state: State; connected: boolean }) {
  const draftKey = chatKey(state.sessionId, 'draft');
  const cursorKey = chatKey(state.sessionId, 'draft-cursor');
  const [showDetails, setShowDetails] = useState(() => localStorage.getItem('show-chat-details') === 'true');
  const [draft, setDraft] = useState(() => sessionStorage.getItem(draftKey) || '');
  const messages = useMessageQueue(connected, state.sessionId);
  const [historyOpen, setHistoryOpen] = useState(false);
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
    sessionStorage.setItem(draftKey, element.value);
    sessionStorage.setItem(cursorKey, JSON.stringify([element.selectionStart, element.selectionEnd, element.selectionDirection]));
  }

  useLayoutEffect(() => {
    const element = input.current!;
    let start = element.value.length;
    let end = start;
    let direction: 'forward' | 'backward' | 'none' = 'none';
    try {
      const saved = JSON.parse(sessionStorage.getItem(cursorKey) || 'null');
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

  useLayoutEffect(() => {
    const element = document.createElement('sg-transcript') as Transcript;
    host.current!.append(element);
    transcript.current = element;
    return () => element.remove();
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
    sessionStorage.setItem(draftKey, draft);
    if (input.current) {
      input.current.style.height = 'auto';
      input.current.style.height = `${Math.min(input.current.scrollHeight, 200)}px`;
    }
  }, [draft]);
  useEffect(() => { localStorage.setItem('show-chat-details', String(showDetails)); }, [showDetails]);

  function send() {
    if (!draft.trim() || stopping || startingSession || !connected) return;
    messages.enqueue(draft);
    setDraft(''); setError(''); follow.current = true;
    input.current?.focus();
  }

  const switchingBlocked = !connected || state.busy || !!messages.queue.length || startingSession || stopping;

  async function changeChat(sessionId?: string) {
    if (switchingBlocked || sessionId === state.sessionId) return;
    if (!sessionId && !window.confirm('Start a fresh chat? This conversation stays saved. Your draft will stay with this chat.')) return;
    setStartingSession(true); setError(''); setHistoryOpen(false);
    try {
      await messages.pauseAndWait();
      const response = await fetch(sessionId ? '/api/session/switch' : '/api/session/new', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(state.sessionId ? { 'X-Session-Id': state.sessionId } : {}) },
        body: sessionId ? JSON.stringify({ sessionId, expectedSessionId: state.sessionId }) : undefined,
      });
      if (!response.ok) throw new Error((await response.json()).detail || 'Could not open chat');
      // SSE is the sole state source: an older in-flight snapshot cannot undo an HTTP response.
      // Keep controls locked until SSE selects the new session and remounts this component.
    } catch (err) {
      setError(String(err)); setStartingSession(false); setHistoryOpen(false); input.current?.focus();
    }
  }

  async function stop() {
    if (stopping) return;
    setStopping(true); setError('');
    try {
      await messages.pauseAndWait();
      const response = await fetch('/api/stop', {
        method: 'POST', headers: state.sessionId ? { 'X-Session-Id': state.sessionId } : {},
      });
      if (!response.ok) throw new Error('Could not stop Pi');
      const cleared = await response.json();
      messages.restore([...(cleared.steering || []), ...(cleared.followUp || [])]);
    } catch (err) { setError(String(err)); }
    finally { setStopping(false); input.current?.focus(); }
  }

  const visibleError = error || messages.error || composerError(state.error, state.messages, state.busy);

  return <div className="app">
    <header>
      <div className="header-start">
        <button className="icon-button" onClick={() => setHistoryOpen(true)} aria-label="Chats" title="Chats"
          aria-haspopup="dialog" aria-controls="chat-history" aria-expanded={historyOpen}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
          </svg>
        </button>
      </div>
      <a className="brand" href="/" aria-label="Self-growing home"><span className="seed" aria-hidden="true">✳</span><span className="brand-name">self-growing</span></a>
      <div className="header-actions">
        <span className="connection"><i className={connected ? 'online' : ''} />{connected ? 'Local workspace' : 'Connecting…'}</span>
        <ChatDisplay showDetails={showDetails} onChange={setShowDetails} />
      </div>
    </header>
    <ChatHistory open={historyOpen} currentId={state.sessionId} blocked={switchingBlocked} switching={startingSession}
      onClose={() => setHistoryOpen(false)} onSelect={id => void changeChat(id)} onNew={() => void changeChat()} />
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
        starting={startingSession} onNew={() => void changeChat()} />
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
        <textarea ref={input} value={draft} disabled={startingSession} rows={1} maxLength={100000} aria-label="Message Pi"
          placeholder={state.busy ? 'Steer Pi while it works…' : 'Ask Pi to change this app…'}
          onSelect={saveComposer} onChange={event => { setDraft(event.target.value); saveComposer(); }}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault(); send();
            }
          }} />
        {state.busy && <button type="button" className="stop-button" disabled={stopping || startingSession}
          onClick={() => void stop()} aria-label="Stop Pi and pause unsent messages" title="Stop Pi">■</button>}
        <button type="submit" disabled={!draft.trim() || stopping || startingSession || !connected}
          aria-label={state.busy ? 'Steer Pi' : 'Send message'} title={state.busy ? 'Send at the next tool/turn boundary' : 'Send'}>↑</button>
      </form>
      <div className="footnote"><span>Pi can edit files and run commands in this workspace.</span><span>Enter to {state.busy ? 'steer' : 'send'} · Shift + Enter for a new line</span></div>
    </footer>
  </div>;
}

createRoot(document.getElementById('root')!).render(<App />);
