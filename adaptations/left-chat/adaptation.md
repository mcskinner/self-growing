# Left chat

## Intent
When a document or another workspace view is open, keep working chat on the left and that view on the right. With no workspace view open, restore the normal full-screen chat experience.

## Boundaries
This is a layout adaptation, not a Markdown reader. Preserve existing chat behavior and the shared app shell; app-wide branding and navigation do not belong inside a feature pane. Avoid adding backend capabilities.

## Success
Opening a workspace view puts chat on the left and the view on the right beneath the shared app header; closing the last view restores full-screen chat without an empty pane or divider. Preserve the draft, conversation, and chosen split width across these transitions. The chat transcript scrolls without displacing its composer. On a narrow screen, chat remains usable without horizontal overflow. Sending, steering, stopping, and starting a new chat still work.
