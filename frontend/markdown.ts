import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Resolve only relative Markdown links against the original file, never the app URL.
export function relativeMarkdownPath(href: string, currentPath: string): string | null {
  href = href.trim();
  if (!currentPath.startsWith('/') || !href || /[\u0000-\u001f\u007f]/.test(href)
    || /^[\/\\#?]/.test(href)
    || /^[a-z][a-z\d+.-]*:/i.test(href) || href.includes('\\')) return null;
  try {
    const base = `file://${currentPath.split('/').map(encodeURIComponent).join('/')}`;
    const target = new URL(href, base);
    const path = decodeURIComponent(target.pathname);
    return target.protocol === 'file:' && !target.host && /\.(md|markdown)$/i.test(path)
      && !path.includes('\0') && !path.includes('\\') ? path : null;
  } catch { return null; }
}

// A small HTML vocabulary also excludes every automatically fetched resource,
// embedded browsing context, form, style, and document-supplied identifier.
export function renderMarkdown(source: string, currentPath = ''): string {
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
    const path = relativeMarkdownPath(href, currentPath);
    if (path) {
      // Only renderer-created attributes survive; document HTML cannot forge these.
      link.dataset.readerPath = path;
    } else if (/^(https?:|mailto:)/i.test(href)) {
      link.target = '_blank'; link.rel = 'noopener noreferrer';
    } else link.removeAttribute('href');
  }
  return template.innerHTML;
}
