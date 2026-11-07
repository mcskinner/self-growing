import { useEffect, useRef, useState } from 'react';
import { deliverMessage, restoreOutbox, type OutboundMessage } from './delivery';

export function useMessageQueue(connected: boolean) {
  const [queue, setQueue] = useState(() => restoreOutbox(sessionStorage.getItem('message-queue')));
  const [paused, setPausedState] = useState(() =>
    sessionStorage.getItem('message-queue-paused') === 'true' || queue.some(item => item.status === 'uncertain'));
  const [error, setError] = useState('');
  const current = useRef({ queue, paused, connected });
  current.current = { queue, paused, connected };
  const wake = useRef<(() => void) | null>(null);
  const inFlight = useRef<Promise<boolean> | null>(null);

  function save(items: OutboundMessage[]) {
    // Persist synchronously, including the in-flight state, before starting network I/O.
    sessionStorage.setItem('message-queue', JSON.stringify(items));
    current.current.queue = items;
    setQueue(items);
  }
  function pause(value: boolean) {
    sessionStorage.setItem('message-queue-paused', String(value));
    current.current.paused = value;
    setPausedState(value);
  }

  useEffect(() => {
    let disposed = false;
    async function dispatch(): Promise<boolean> {
      const { queue, paused, connected } = current.current;
      if (disposed || paused || !connected || !queue.length || queue[0].status !== 'pending') return false;
      const message = queue[0];
      try {
        const result = await deliverMessage(message.text, () => {
          if (disposed || current.current.paused || current.current.queue[0]?.id !== message.id) return false;
          save(current.current.queue.map(item => item.id === message.id ? { ...item, status: 'sending' } : item));
          return true;
        });
        if (result === 'waiting') {
          save(current.current.queue.map(item => item.id === message.id ? { ...item, status: 'pending' } : item));
          return false;
        }
        save(current.current.queue.filter(item => item.id !== message.id));
        setError('');
        return true;
      } catch (err) {
        save(current.current.queue.map(item => item.id === message.id ? { ...item, status: 'uncertain' } : item));
        pause(true);
        setError(`${String(err)}. Delivery is unconfirmed; check chat before retrying.`);
        return false;
      }
    }
    function kick() {
      if (disposed || inFlight.current) return;
      const task = dispatch();
      inFlight.current = task;
      void task.then(delivered => {
        if (inFlight.current === task) inFlight.current = null;
        if (delivered && !disposed) queueMicrotask(kick);
      });
    }
    wake.current = kick;
    const timer = window.setInterval(kick, 500);
    kick();
    return () => { disposed = true; wake.current = null; window.clearInterval(timer); };
  }, []);

  return {
    queue, paused, error,
    dispatching: queue.find(item => item.status === 'sending')?.id || '',
    enqueue(text: string) {
      if (!current.current.queue.length) pause(false);
      save([...current.current.queue, { id: crypto.randomUUID(), text, status: 'pending' }]);
      wake.current?.();
    },
    restore(texts: string[]) {
      save([...texts.map(text => ({ id: crypto.randomUUID(), text, status: 'pending' as const })), ...current.current.queue]);
    },
    async pauseAndWait() {
      pause(true);
      // Stop must follow any request already being submitted, never precede it.
      await inFlight.current;
    },
    resume() {
      const uncertain = current.current.queue.some(item => item.status === 'uncertain');
      if (uncertain && !window.confirm('An unconfirmed message may already have reached Pi. Check the conversation first. Retry anyway?')) return;
      save(current.current.queue.map(item => ({ ...item, status: 'pending' })));
      pause(false); setError(''); wake.current?.();
    },
    remove(id: string) {
      save(current.current.queue.filter(item => item.id !== id || item.status === 'sending'));
      if (!current.current.queue.length) setError('');
    },
  };
}
