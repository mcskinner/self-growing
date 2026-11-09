export interface DocumentQuote { path: string; text: string }

export const MAX_DRAFT_LENGTH = 100000;

export function appendDocumentQuote(draft: string, quote: DocumentQuote): string {
  if (!quote.text.trim()) return draft;
  const citation = `From ${quote.path}:\n${quote.text.split(/\r?\n/).map(line => `> ${line}`).join('\n')}`;
  const result = `${draft}${draft ? '\n\n' : ''}${citation}\n\n`;
  if (result.length > MAX_DRAFT_LENGTH) throw new Error('This quote would exceed the draft limit. Select a shorter passage or shorten your draft.');
  return result;
}
