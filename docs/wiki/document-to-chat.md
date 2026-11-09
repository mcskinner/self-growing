# Document-to-chat interaction and source locations

Status: quote-to-chat implemented and reviewed with the owner; retain the current implementation. Richer locators and alternative renderers are investigated options, not approved work.

## Quoting versus reviewing

Quote-to-chat supports thinking with the agent while reading: select a passage, explicitly add its text and document path to the existing draft, then edit or send when ready. It does not send automatically. See the [reader](../../frontend/documents.tsx), [quote formatting](../../frontend/document-quotes.ts), and [browser regression](../../tests/quote-to-chat.browser.mjs).

Comment-then-review supports collecting passage-specific observations before involving the agent. Persistent anchors, comment lifecycle, changed-text handling, and a submission boundary make it a different workflow, not merely another label on the quote action. Reviewing comments also need not mean implementing every comment.

The owner chose quote-to-chat for now. Additional selection actions or user-selected modes could be added later if useful; no multi-action framework is needed today.

## What a locator identifies

The current attribution is a document path plus the selected quote. Repeated passages can make this ambiguous. A containing source-line range could narrow the search; exact selection boundaries would identify the substring more precisely. These are different promises and should be labeled accordingly.

Rendered text offsets are not source offsets: Markdown markers, link destinations, entities, escapes, and code whitespace can change the relationship. Exact coordinates are possible, but require mapping the browser selection back to the source, not simply counting rendered characters. A content hash could identify the source version; it does not itself solve the mapping or preserve that version.

## Renderer findings

`marked` was already used for chat in the initial scaffold (`83320ec`); the reader reused it with DOMPurify. No explicit comparison with alternative renderers was found in the inspected history or available chat transcripts. Reuse is an explanation of the history, not evidence of a deliberate source-location tradeoff.

An isolated exploratory probe inspected these alternatives:

| Renderer | Source-location support | Tradeoffs |
| --- | --- | --- |
| `marked` (current) | Raw token text, no built-in line/column positions | Simple Markdown-to-HTML API and GFM support; source mapping would be custom integration. Raw text can be normalized, so cumulative lengths are not automatically original-source offsets. |
| `markdown-it` | Block source-line ranges, including nested lists, quotes, tables, and fences | Relatively direct token/renderer integration for containing-line ranges; no built-in inline character positions, and some GFM features require plugins. |
| `remark` / unified | Block and inline syntax nodes with line, column, and character offsets | Stronger foundation for source-aware interactions; more pipeline pieces, with GFM and HTML conversion configured separately. |

The probe covered repeated passages, CRLF input, nested structures, tables, code, entities, escapes, and reference links. This was API investigation, not an app migration or a prospective adaptation experiment. Syntax-node positions do not automatically map arbitrary selections inside decoded/normalized text, even with `remark`.

Either alternative would need a bridge from source positions into DOM metadata retained through sanitization. Neither replaces sanitization. A reader-only renderer change could leave chat unchanged, but would introduce two rendering stacks and require checks for interpretation, styling, navigation, and selection regressions.

## Decision and adaptation boundary

Keep the current reader and path-plus-quote attribution. There is no renderer migration, line-range addition, or character-level mapping planned by this discussion.

The independently useful adaptation candidate is **quote document passages into chat**, not the selection mechanics alone. Shared highlighting mechanics may inform both quoting and commenting without becoming a standalone adaptation or dependency system. This feature began before a frozen protocol; finish/review it as ordinary development, then extract an adaptation. Any future transfer experiment should be planned separately before it starts, rather than retroactively labeling this implementation an experiment.

Related: [capability exchange](adaptations-and-capability-exchange.md), [adaptation-led development](adaptation-led-development.md), and [acceptance evidence](acceptance-and-verification.md).
