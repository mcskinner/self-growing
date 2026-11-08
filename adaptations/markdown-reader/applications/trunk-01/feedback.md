# Application feedback

## Did it work?
Implemented and committed as `2db3e08f9cc4910bf27e37aeed863f046ecd9af5` in the target checkout. Automated validation passed; full interactive acceptance remains unverified.

- Read-only original-file API with resolved workspace-relative boundaries, absolute external paths, regular-file/type/UTF-8 checks, and bounded 2,000,000-byte reads. No imports, document writes, metadata, or annotation layer.
- macOS native chooser plus explicit path entry (also usable where native choosing is unsupported). Cancel preserves the existing document.
- Sanitized Markdown using existing marked/DOMPurify dependencies and a semantic HTML allowlist. Automatically loaded resources are excluded; only explicit HTTP(S)/email links remain navigable, in a separate tab. Relative file links intentionally require another explicit file choice.
- Document lifecycle lives outside the session-keyed Chat. Independent reader/chat panes, pointer and keyboard resizing, stacked narrow layout, close/replace/refresh, loading/error/retry UI, tab-scoped remembered path, and persistent width preference. Refresh after observed busy-to-idle transitions.

## Observed validation
Final command: `env -u WEB_PORT make check test build` — passed.
- Ruff lint and formatting, wiki lint, TypeScript: passed.
- Python: 56 tests passed, including 5 new reader tests (parameterized chooser cases included in count). Existing chat, history, origin/host security, and session tests passed.
- Frontend: 21 tests passed. New jsdom tests exercise semantic rendering and resource/active-HTML exclusion; restored path/width, pointer and keyboard resize handlers, cancellation, reader independence across chat-key changes, post-work refresh, error/retry, replacement, and close without remounting the existing chat child.
- Production build: passed.
- `git diff --check`: passed before commit; working tree clean after commit.
- Captured implementation diff in `application.patch` beside this feedback.

## Repairs and lessons learned
- Provisioned this checkout with `uv sync`, `npm ci`; added jsdom/type declarations and tsx as test-only dependencies to exercise DOM safety and React lifecycle without launching an app server.
- The first full test run hit an existing origin-security test assuming port 5173 while the inherited `WEB_PORT` was 5174. Reran with only that variable unset; no security logic or running-app configuration changed. uv also warned that inherited VIRTUAL_ENV belonged to a different checkout; it correctly used the target's new .venv instead. No files from that other environment were inspected.
- The new JSX test initially failed because the tsx test transform used the classic React runtime. Supplied React in the test's global environment; tests then passed. Production JSX configuration was unchanged.
- Removed an extra trailing CSS blank line found by diff checking.
- The target already had suitable rendering libraries. A small allowlist avoided importing source annotation machinery or relying only on default sanitization. Keeping ReaderLayout outside the existing keyed Chat preserved its session-owned behavior without restructuring chat internals.

## Gaps / untested acceptance criteria
- No server was started, no running app was contacted/reconfigured, and no push was performed. No native chooser was actually displayed. macOS selection/cancellation, permissions failures, timeout cleanup, and unsupported-platform behavior remain unverified interactively; chooser API tests mock selection.
- jsdom is not a layout engine. Actual desktop drag capture, independent scroll comfort, wide-code/table containment, narrow-screen reachability (especially virtual keyboards/large outboxes), focus/screen-reader behavior, and visual polish need real-browser checking. Handler tests are not evidence of physical pointer ergonomics.
- No live provider/chat run: streaming, steering, stopping, history switching, per-conversation draft/outbox retention, and document refresh after actual agent edits are supported by unchanged chat code and passing regression/component tests, not end-to-end observation.
- Tab reload restoration was exercised through preloaded browser storage, not a real page reload. Obsolete-request abort handling and delayed native-dialog race guards are implemented but not specifically stress-tested.
- No arbitrary filesystem watcher or scroll-position persistence. Native choosing is macOS-only; path entry is the cross-platform fallback. Absolute paths are intentionally not sandboxed to previously chosen files; this is a trusted local app. Concurrent hostile filesystem mutation and all possible sanitizer payloads were not exhaustively tested.
- FastAPI/Starlette emitted an existing TestClient/httpx deprecation warning; validation still passed.

## Input scope
Used the installed adapt skill, the apply brief, frozen adaptation.md and evidence.md, and this checkout's code/instructions. No other branches/worktrees, discussions, protocols, or application histories were inspected. Reference.patch was unnecessary. Skill and adaptation tooling were not modified.
