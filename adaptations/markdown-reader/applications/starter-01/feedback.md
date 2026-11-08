# Application feedback

## Outcome
Implemented and committed in `/Users/michael/dev/self-growing-reader-starter-01`:
`ca789b436654e3b9054d9e78befaf25b6bc82ef7` — Add read-only local Markdown reader beside chat.
Working tree clean after commit. No push, running-server commands, real Pi requests, session edits, skill/tooling changes, or inspection of other application histories/worktrees.

The implementation reads original Markdown paths (including external absolute paths), never imports or writes documents, and adds a sanitized reader alongside the unchanged chat logic. It includes native macOS selection plus a portable path-entry fallback, cancellation, replacement/close, bounded UTF-8 reads, resolved relative-path containment, visible loading/errors/retry, desktop pointer/keyboard resizing, stacked narrow layouts, tab path restoration, persistent width, manual refresh, and refresh after busy-to-idle transitions. No annotations or review metadata were added.

## Observed validation
- `make check`: passed (Ruff lint/format and TypeScript).
- `env -u WEB_PORT make test`: passed, 37 Python tests and 14 TypeScript tests.
- `make build`: passed.
- `git diff --check`: passed before commit.
- Final `npm ci`: clean install, audit reported zero vulnerabilities.
- New backend tests read workspace and external originals without byte changes or extra files; reject traversal and resolved symlink escapes; check extension, invalid UTF-8, missing/directory/null paths, 2 MB limit and exact limit; mock native selection/cancellation; reject hostile origins.
- New JSDOM tests render headings/paragraphs/lists/quotes/code/tables and check removal of scripts, styles, SVG, images, embedded resources, event handlers, resource attributes, and unsafe links. HTTP(S)/email links remain deliberate user navigation; relative/file links are disabled.
- An isolated headless Chromium smoke test loaded the production build entirely through Playwright request interception, with mocked document/chat endpoints and EventSource. No app server was started or contacted. It passed desktop pointer and arrow-key resize, width/path restoration on reload, draft retention, loading status, cancellation retaining the document, long-document overflow and wide-code containment, sanitizer/no remote document-resource requests, error/retry, busy-to-idle content refresh, mocked chat send/steer/stop, document retention on session-ID change, 390px layout without horizontal page overflow, and close restoring full-width chat. No page JavaScript errors. Temporary test script: `/tmp/reader-acceptance.mjs` (not a repository dependency or permanent test).

## Repairs and lessons
- The existing `test_local_security` assumes port 5173, but the inherited `WEB_PORT` uses a different port. Initial `make test` had 36 passes/one failure for that reason. Unsetting `WEB_PORT` for the test process made all tests pass; no runtime security code or pre-existing test was changed.
- Current Playwright cannot provision Chromium on this host's macOS 12. Used transient Playwright 1.48.2 and its compatible Chromium to run isolated checks; final `npm ci` removed the transient dependency. It was not added to package.json/lockfile. The test origin was changed to HTTPS so `crypto.randomUUID` works like the app's secure localhost context; this repaired the smoke harness, not application code.
- Existing marked/DOMPurify dependencies were sufficient; JSDOM was added only for repeatable sanitizer tests. Strict tag/attribute allowlisting avoids automatic resource loading rather than relying on generic XSS sanitization alone.
- Native browse has a path-entry fallback instead of requiring a new GUI dependency on every platform. Document state lives in a wrapper independent of chat/session state; chat delivery/composer logic was not rewritten.
- Source evidence was sufficient without importing the reference patch. Pane sizing uses percentages and stacks below 800px, avoiding source-specific annotation widths.

## Untested acceptance criteria and limits
- Actual macOS chooser interaction, permissions, timeout, and user cancellation were not exercised; selection/cancel are mocked. Linux/WSL path fallback was not run on those OSes.
- No live-provider streaming, steering, stopping, or end-to-end file edits through Pi were exercised. Existing chat regression tests pass, UI requests were mocked, and simulated busy transitions refreshed edited mock content; these are not live-provider evidence.
- The target offers a new-chat action, not a history browser or per-conversation draft/outbox architecture. No unrelated history system was added. Reader independence was tested with a simulated session-ID change; full history switching/per-conversation lifecycle acceptance is not applicable/tested here.
- Pointer and keyboard resizing were tested in Chromium; touch, screen-reader usability, Safari/Firefox, extreme zoom, every screen dimension, and wide tables with pathological content were not exhaustively tested. Table markup and containment CSS exist; browser wide-content assertion used code.
- Absolute paths are intentionally permitted in this trusted local app, not allowlisted to previously chosen files. Resolved relative paths cannot escape the workspace; this is not a multi-user filesystem sandbox.
- Refresh occurs after agent work or on explicit Refresh, not arbitrary external edits. Scroll position is not persisted. Relative Markdown link navigation and embedded images are deliberately omitted for safety; neither is asserted as implemented.
- Sanitizer tests and a browser no-resource-request observation cover representative attacks, not a proof against every future parser/browser vulnerability.
- No application.patch/application.json/evaluation.json was generated; this feedback reports direct implementation/check observations, not a tooling evaluation result.
