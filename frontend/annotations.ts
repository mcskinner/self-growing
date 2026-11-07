export interface Anchor { start: number; end: number; prefix: string; suffix: string }
export interface Annotation { id: string; quote: string; anchor?: Anchor | null }

/** Never silently attach an ambiguous repeated excerpt to the wrong passage. */
export function locate(text: string, annotation: Annotation): number | null {
  const { quote, anchor } = annotation;
  if (!quote) return null;
  const matches: number[] = [];
  let from = 0;
  while (from <= text.length - quote.length) {
    const at = text.indexOf(quote, from);
    if (at < 0) break;
    matches.push(at); from = at + 1;
  }
  if (matches.length === 1) return matches[0];
  if (!anchor) return null;
  const contextual = matches.filter(at =>
    text.slice(Math.max(0, at - anchor.prefix.length), at) === anchor.prefix &&
    text.slice(at + quote.length, at + quote.length + anchor.suffix.length) === anchor.suffix);
  return contextual.length === 1 ? contextual[0] : null;
}

export function annotate(html: string, annotations: Annotation[]) {
  const container = document.createElement('div');
  container.innerHTML = html;
  const text = container.textContent || '';
  const ranges = annotations.flatMap(annotation => {
    const start = locate(text, annotation);
    return start === null ? [] : [{ id: annotation.id, start, end: start + annotation.quote.length }];
  });
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  let offset = 0;
  for (const node of nodes) {
    const value = node.data;
    const end = offset + value.length;
    const intersecting = ranges.filter(range => range.start < end && range.end > offset);
    if (intersecting.length) {
      const boundaries = [...new Set([0, value.length, ...intersecting.flatMap(range =>
        [Math.max(0, range.start - offset), Math.min(value.length, range.end - offset)])])].sort((a, b) => a - b);
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < boundaries.length - 1; i++) {
        const start = boundaries[i];
        const segment = value.slice(start, boundaries[i + 1]);
        const ids = intersecting.filter(range => range.start <= offset + start && range.end > offset + start).map(range => range.id);
        if (ids.length) {
          const mark = document.createElement('mark');
          mark.dataset.comments = ids.join(' ');
          mark.tabIndex = 0;
          mark.setAttribute('role', 'button');
          mark.setAttribute('aria-label', `Show ${ids.length > 1 ? 'comments' : 'comment'} on: ${segment}`);
          mark.textContent = segment;
          fragment.append(mark);
        } else fragment.append(document.createTextNode(segment));
      }
      node.replaceWith(fragment);
    }
    offset = end;
  }
  return { html: container.innerHTML, attached: new Set(ranges.map(range => range.id)) };
}
