import type { Message } from './transcript';

/** Filter presentation only; the saved conversation is never changed. */
export function visibleMessages(messages: Message[], showDetails: boolean): Message[] {
  return messages.flatMap(message => {
    if (message.role === 'user') return [message];
    if (message.role === 'toolResult') return showDetails || message.isError ? [message] : [];
    const content = typeof message.content === 'string'
      ? [{ type: 'text', text: message.content }] : message.content;
    const blocks = content.filter(block =>
      (block.type === 'text' && !!block.text?.trim()) ||
      (showDetails && (block.type === 'thinking' || block.type === 'toolCall')));
    return blocks.length || message.errorMessage ? [{ ...message, content: blocks }] : [];
  });
}
