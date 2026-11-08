# Markdown reader

## Intent
Add comfortable local Markdown reading inside the app without losing the working Pi chat. Let the user choose an original `.md` or `.markdown` file, including outside the workspace, read it beside chat, choose another, and close it to restore the normal chat layout. Open files in place, not as uploaded copies.

## Boundaries
- Reading is read-only: do not modify documents or create imported copies or metadata.
- Render Markdown as sanitized HTML. Treat document content as untrusted; do not execute scripts or load remote resources automatically. Validate file type, UTF-8 decoding, and a reasonable size limit; constrain workspace-relative paths after resolving symlinks.
- Keep document state independent of conversation state. Preserve chat streaming, sending, steering, stopping, history switching, and per-conversation drafts/outboxes.
- Exclude the entire annotation layer: selection anchors, highlights, comment rail/composer, resolving, review metadata/migration, and sending reviews to chat. No document editing or unrelated app features.

## Success
- Opening identifies the file and shows readable headings, paragraphs, lists, links, quotes, code, and tables. Long documents scroll independently of chat; wide code/tables do not break the layout.
- Desktop panes resize with pointer and keyboard; narrow screens keep both reading and chat reachable.
- Cancel leaves the current document unchanged. Loading and errors are visible, with retry available. Closing restores chat; switching conversations keeps the document open. Remember the open path across tab reloads and the chosen pane width.
- Refresh the displayed file after agent work so edits made through chat become visible.
- Verify file-opening/read-only boundaries, rendering safety, pane behavior, and chat regressions; run the target's checks, tests, and build. Report untested behavior rather than assuming success.
