# Left chat

## Intent
Keep the working chat in a left-hand pane, leaving a right-hand workspace for the app to grow into.

## Boundaries
This is a layout adaptation, not a Markdown reader. Preserve existing chat behavior and the shared app shell; app-wide branding and navigation do not belong inside a feature pane. Avoid adding backend capabilities.

## Success
On a wide screen, chat is on the left and the workspace on the right beneath the shared app header; the chat transcript scrolls without displacing its composer. On a narrow screen, chat remains usable without horizontal overflow. Sending, steering, stopping, and starting a new chat still work.
