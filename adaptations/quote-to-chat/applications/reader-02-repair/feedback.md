# Prompted repair outcome

- Base: `959a911`; repair commit: `a109476e5a718ff5a19c37aa82a43d7ad68842f8`.
- This is a coordinator-prompted repair, not a new uncoached adaptation application.
- Fixed the selection action inheriting the global 36x36 button dimensions: content-sized width/height, no label wrapping, viewport maximum width.
- Moved quote focus/caret placement into a draft-dependent layout effect, after React commits the controlled textarea and the reader clears the document selection. Draft and cursor persistence remain current-chat scoped; quote insertion does not use the send/outbox path.
- Added `tests/quote-composer.browser.mjs` and a concise wiki review entry. No adaptation description, skill, protocol, tooling, backend, navigation, native picker, limits, or send implementation changed.

## Checks performed

- `make check`: PASS (ruff, formatting, wiki lint, TypeScript); repeated after the wiki entry.
- `make test`: PASS (55 Python tests, 22 TypeScript tests). One existing Starlette/httpx deprecation warning.
- `make build`: PASS.
- `git diff --check`: PASS; committed working tree clean.
- Isolated built-static-app browser test: PASS, Chromium via externally installed Playwright 1.48.2. Six combinations: 1280px/390px viewport widths and pointer/Enter/Space activation. Verified text fits within button and viewport, Escape leaves draft untouched, correct draft/path/passage append, actual composer focus with both selection endpoints at draft length (also after later animation frames), continued typing at the end, saved edited draft, and zero POSTs during quote/typing.
- Browser invocation: `PLAYWRIGHT_MODULE=/tmp/quote-repair-browser/node_modules/playwright/index.mjs node --test tests/quote-composer.browser.mjs` after build. The test creates and closes its own ephemeral static server and mocks APIs/EventSource; it does not launch a backend/dev stack or contact a provider.
- Initial latest-Playwright browser installation was unsupported on this macOS version; used external Playwright 1.48.2 instead. No repository dependency changes.

## Lessons and gaps

Global control dimensions need real browser geometry checks; formatter/unit tests cannot detect an overflowing label. Focusing a controlled input before React commits, while its caller still clears another selection, is not reliable evidence that the final caret is usable. Check the settled active element, both endpoints, and subsequent typing.

Not performed: live-provider chat, real native picker dialog, manual visual review/screenshots, Firefox/WebKit, or independent acceptance replay. The focused browser test does not repeat the entire navigation/chat-switch/busy/limit/send matrix; existing normal suites passed and those implementation paths were left unchanged. No claim of independent acceptance or blind-transfer success. Nothing pushed.
