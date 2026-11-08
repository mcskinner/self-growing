import DOMPurify from 'dompurify';
import { marked } from 'marked';

// A small HTML vocabulary also excludes every automatically fetched resource,
// embedded browsing context, form, style, and document-supplied identifier.
export function renderMarkdown(source: string): string {
  const clean = DOMPurify.sanitize(marked.parse(source, { async: false }), {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'ul', 'ol', 'li',
      'blockquote', 'pre', 'code', 'em', 'strong', 'del', 'a', 'table', 'thead', 'tbody',
      'tr', 'th', 'td'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
  const template = document.createElement('template');
  template.innerHTML = clean;
  for (const link of template.content.querySelectorAll('a')) {
    const href = link.getAttribute('href') || '';
    // Relative file navigation isn't a file-opening capability. Use the chooser.
    if (!/^(https?:|mailto:)/i.test(href)) link.removeAttribute('href');
    else { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  }
  return template.innerHTML;
}
