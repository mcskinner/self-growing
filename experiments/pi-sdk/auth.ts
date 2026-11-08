import { randomUUID } from 'node:crypto';
import type { ModelRuntime } from '@earendil-works/pi-coding-agent';

type Interaction = Parameters<ModelRuntime['login']>[2];
type Prompt = Parameters<Interaction['prompt']>[0];
type PublicPrompt = Prompt extends infer P ? P extends Prompt ? Omit<P, 'signal'> & { id: string } : never : never;

// This is deliberately not a serialization of ModelRuntime or its login result.
export class BrowserLogin {
  state: {
    status: 'idle' | 'running' | 'done' | 'cancelled' | 'error';
    url?: string; code?: string; prompt?: PublicPrompt; error?: string;
  } = { status: 'idle' };
  private controller?: AbortController;
  private pending?: { id: string; resolve: (value: string) => void };

  private runtime: Pick<ModelRuntime, 'login'>;
  constructor(runtime: Pick<ModelRuntime, 'login'>) { this.runtime = runtime; }

  start(provider: string) {
    if (this.state.status === 'running') throw new Error('Login already running');
    this.state = { status: 'running' };
    const controller = this.controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10 * 60_000);
    timeout.unref();
    const interaction: Interaction = {
      signal: controller.signal,
      notify: event => {
        // Do not forward arbitrary provider messages, tokens, or exception details.
        if (event.type === 'auth_url') this.state.url = safeUrl(event.url);
        if (event.type === 'device_code') {
          this.state.url = safeUrl(event.verificationUri);
          this.state.code = event.userCode;
        }
      },
      prompt: prompt => new Promise<string>((resolve, reject) => {
        if (prompt.type === 'secret') {
          reject(new Error('Secret input is not supported in the browser prototype'));
          return;
        }
        const signal = AbortSignal.any([controller.signal, ...(prompt.signal ? [prompt.signal] : [])]);
        const id = randomUUID();
        const cleanup = () => {
          signal.removeEventListener('abort', abort);
          if (this.pending?.id === id) {
            this.pending = undefined;
            delete this.state.prompt;
          }
        };
        const abort = () => { cleanup(); reject(new Error('Prompt cancelled')); };
        if (signal.aborted) { abort(); return; }
        signal.addEventListener('abort', abort, { once: true });
        // Explicit projection: signal and future SDK fields cannot leak into the browser.
        this.state.prompt = prompt.type === 'select'
          ? { id, type: 'select', message: prompt.message, options: prompt.options.map(({ id, label }) => ({ id, label })) }
          : { id, type: prompt.type, message: prompt.message, placeholder: prompt.placeholder };
        this.pending = { id, resolve: value => { cleanup(); resolve(value); } };
      }),
    };
    // The returned Credential is intentionally discarded, never serialized or logged.
    void this.runtime.login(provider, 'oauth', interaction).then(() => {
      this.state = { status: controller.signal.aborted ? 'cancelled' : 'done' };
    }, () => {
      this.state = controller.signal.aborted
        ? { status: 'cancelled' }
        : { status: 'error', error: 'Login failed. Retry or use pi /login in a terminal.' };
    }).finally(() => { clearTimeout(timeout); controller.abort(); });
  }

  answer(id: string, value: string) {
    if (!this.pending || this.pending.id !== id) throw new Error('Stale login prompt');
    const prompt = this.state.prompt;
    if (prompt?.type === 'select' && !prompt.options.some(option => option.id === value)) {
      throw new Error('Invalid selection');
    }
    this.pending.resolve(value);
  }

  cancel() { this.controller?.abort(); }
}

export function safeUrl(value: string) {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Unsupported login URL');
  }
  return url.href;
}
