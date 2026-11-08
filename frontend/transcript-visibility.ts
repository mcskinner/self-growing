import type { Message } from './transcript';
import { terminalProviderErrors } from './chat-errors.ts';

/** Filter presentation only; the saved conversation is never changed. */
export function visibleMessages(messages: Message[], showDetails: boolean, busy = false): Message[] {
  const terminalErrors = terminalProviderErrors(messages, busy);
  return messages.flatMap(message => {
    if (message.role === 'assistant' && message.errorMessage && !terminalErrors.has(message)) return [];
    if (message.role === 'user') return [message];
    if (message.role === 'toolResult') return showDetails ? [message] : [];
    const content = typeof message.content === 'string'
      ? [{ type: 'text', text: message.content }] : message.content;
    const blocks = content.filter(block =>
      (block.type === 'text' && !!block.text?.trim()) ||
      (showDetails && (block.type === 'thinking' || block.type === 'toolCall')));
    return blocks.length || message.errorMessage ? [{ ...message, content: blocks }] : [];
  });
}
