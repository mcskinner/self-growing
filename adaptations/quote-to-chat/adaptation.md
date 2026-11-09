# quote-to-chat

## Intent
Let a reader select a document passage and explicitly add it, attributed with its source path, to the existing chat draft so they can discuss it.

## Boundaries
- Selection alone does not change the draft. Adding a quote preserves existing draft text and leaves the attributed passage editable; it never sends, queues, or steers the agent, even while the agent is working.
- Use the existing reader and chat. Do not add persistent highlights, annotations, a comment/review workflow, document writes, new navigation, or a renderer migration. A source path is sufficient; richer locators are not required.
- Only quote a nonblank selection from the current document. Dismissal or changing/closing the document must not insert stale text. Respect existing draft limits without truncating the quote or existing work; explain a rejected insertion.

## Success
Show the quote action beside the current highlight when text is selected, rather than adding a permanent quote toolbar. At wide and narrow browser viewports, assert that its label is a single readable line fully inside the rendered control; button visibility and on-screen bounds alone do not establish label fit.

Select a passage, activate an accessible quote action, and see the selected text and correct source path appended to the current draft without losing its prior contents. Focus returns to the composer for continued editing. Nothing reaches chat until the user explicitly sends. Dismissing the action leaves the draft unchanged; repeated quoting and the existing reader, draft persistence, and send behavior still work.
