import type { Message } from './transcript';

export function providerErrorText(error: string): string {
  return /^(?:TypeError:\s*)?(?:fetch failed|failed to fetch)$/i.test(error.trim())
    ? 'Could not reach the model provider. Please try again.'
    : error;
}

/** Only the last assistant outcome in a settled user turn can need attention. */
export function terminalProviderErrors(messages: Message[], busy: boolean): Set<Message> {
  const errors = new Set<Message>();
  let activeTurn = busy;
  let laterAssistant = false;
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    if (message.role === 'user') {
      activeTurn = false;
      laterAssistant = false;
    } else if (message.role === 'assistant') {
      if (!activeTurn && !laterAssistant && message.errorMessage) errors.add(message);
      laterAssistant = true;
    }
  }
  return errors;
}

/** Provider failures belong in the transcript, not in a second sticky alert. */
export function composerError(error: string | null, messages: Message[], busy = false): string {
  if (!error || busy || messages.some(message => message.errorMessage === error)) return '';
  return providerErrorText(error);
}
