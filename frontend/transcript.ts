import { LitElement, css, html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { visibleMessages } from './transcript-visibility';

export interface Block {
  type: string;
  text?: string;
  thinking?: string;
  name?: string;
  arguments?: unknown;
}
export interface Message {
  role: string;
  content: string | Block[];
  toolName?: string;
  isError?: boolean;
  errorMessage?: string;
}

const markdown = (text: string) => unsafeHTML(DOMPurify.sanitize(
  marked.parse(text, { async: false }),
  { FORBID_TAGS: ['img', 'style', 'input'], FORBID_ATTR: ['style'] },
));

/** Presentation only: no model calls, credentials, or browser-side agent tools. */
export class Transcript extends LitElement {
  static properties = { messages: { attribute: false }, showDetails: { attribute: false } };
  declare messages: Message[];
  declare showDetails: boolean;

  constructor() {
    super();
    this.messages = [];
    this.showDetails = false;
  }

  static styles = css`
    :host { display: block; color: #292e29; font: 15px/1.7 system-ui, sans-serif; }
    article { margin: 0 0 30px; min-width: 0; overflow-wrap: anywhere; }
    .label { margin-bottom: 8px; font-size: 11px; font-weight: 650; letter-spacing: .09em;
      text-transform: uppercase; color: #7b8177; }
    .user { margin-left: 12%; }
    .user .body { background: #eeeee7; border-radius: 18px 18px 4px 18px; padding: 14px 20px;
      }
    .user .label { text-align: right; }
    p { margin: 0 0 12px; } p:last-child { margin-bottom: 0; }
    h1, h2, h3 { line-height: 1.3; letter-spacing: -.025em; margin: 24px 0 12px; }
    h1 { font-size: 25px; } h2 { font-size: 21px; } h3 { font-size: 18px; }
    a { color: #416d4e; text-underline-offset: 3px; }
    pre { overflow-x: auto; padding: 16px; background: #eeeee8; border-radius: 10px;
      white-space: pre; font-size: 12px; line-height: 1.65; }
    code { font-family: ui-monospace, monospace; font-size: .87em; background: #eeeee8;
      border-radius: 4px; padding: 2px 4px; }
    pre code { padding: 0; background: none; font-size: inherit; }
    blockquote { border-left: 2px solid #b2bca9; padding-left: 16px; margin-left: 0; color: #71786a; }
    table { display: block; overflow-x: auto; border-collapse: collapse; }
    th, td { border: 1px solid #dedfd6; padding: 6px 12px; }
    details { border: 1px solid #e1e3d9; border-radius: 10px; margin: 10px 0; padding: 8px 12px;
      font-size: 13px; color: #6a7463; }
    summary { cursor: pointer; font-family: ui-monospace, monospace; font-size: 12px; }
    details pre { max-height: 350px; overflow: auto; margin-bottom: 4px; white-space: pre-wrap; }
    .error { color: #a83f37; }
    .tool { margin-top: -16px; margin-bottom: 20px; }
  `;

  render() {
    return html`${visibleMessages(this.messages, this.showDetails).map(message => {
      const blocks = typeof message.content === 'string'
        ? [{ type: 'text', text: message.content }] : message.content;
      if (message.role === 'toolResult') {
        return html`<details class="tool ${message.isError ? 'error' : ''}">
          <summary>${message.isError ? 'Failed' : 'Finished'} · ${message.toolName || 'tool'}</summary>
          <pre>${blocks.map(block => block.text || '').join('\n')}</pre>
        </details>`;
      }
      const user = message.role === 'user';
      return html`<article class=${user ? 'user' : 'assistant'}>
        <div class="label">${user ? 'You' : 'Pi'}</div>
        <div class="body">${blocks.map(block => {
          if (block.type === 'text') return markdown(block.text || '');
          if (block.type === 'thinking') return html`<details><summary>Thinking</summary>
            ${markdown(block.thinking || '')}</details>`;
          if (block.type === 'toolCall') return html`<details><summary>${block.name}</summary>
            <pre>${JSON.stringify(block.arguments, null, 2)}</pre></details>`;
          return nothing;
        })}</div>
        ${message.errorMessage ? html`<p class="error">${message.errorMessage}</p>` : nothing}
      </article>`;
    })}`;
  }
}

if (!customElements.get('sg-transcript')) customElements.define('sg-transcript', Transcript);

// Custom element definitions cannot be replaced in-place like React components.
if (import.meta.hot) import.meta.hot.accept(() => window.location.reload());
