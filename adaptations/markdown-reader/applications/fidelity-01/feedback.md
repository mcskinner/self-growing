# Application feedback

## Outcome

Committed candidate: `3177e64e173ee9a8e6a9da4f84492574986817a9` in `/Users/michael/dev/self-growing-reader-fidelity-01` (clean worktree).

Applied left-chat and Markdown-reader to the historical baseline. Shared header spans both panes; chat remains left even with no document. Reader is a sibling of the session-keyed chat, preserving its open document on conversation switches. Original Markdown files open read-only via the reference's macOS native picker, including absolute files outside the workspace. Relative Markdown links resolve from the original file. Sanitized allowlisted HTML excludes automatic resource-loading elements. No annotation or document-writing routes, copies, metadata, or review migration were imported.

Used only the specified frozen inputs and direct reference at `898db55839fad721fd9d5d6158e8c93440ac6323`. No previous applications, repairs, surrounding discussion, or other application records inspected. No app server, real provider, or running workshop contacted. No reference, source checkout, skill, or existing tooling modified. No push. Coordinator deployment and owner acceptance remain pending.

## Checks executed

- `env -u WEB_PORT make check test build`: PASS. Ruff, formatting, wiki lint, TypeScript, 55 Python tests, 19 Node tests, production build.
- `node scripts/verify-reader.mjs`: PASS against the compiled target. Script retained in candidate. Uses Playwright installed at `/tmp/reader-fidelity-ui/node_modules`, Chromium cache revision 1140, fresh context, synthetic public Markdown fixture, and fully intercepted `https://reader.test/` requests. No server is required or started. Chat events and responses are simulated, not live Pi.
- Browser assertions: open preserves draft; representative Markdown/table rendered; long code scrolls within its container; no document image/script elements, attack effect, external requests, or JavaScript errors; settings checkbox reachable and dismissible; pointer and keyboard resize change split; independent document scrolling; relative `next.md` opens distinct document without navigation or lost draft; cancellation preserves document; reload preserves path and width; close and reopen; read error and Retry recovery; conversation switch and new chat retain reader; simulated send, steering, stop, displayed reply, and completion-triggered document refresh; narrow composer/settings/reader reachability and no horizontal page overflow.
- Real filesystem tests (FastAPI TestClient without lifespan, no Pi): original bytes remain unchanged and no files are created by reads; outside absolute Markdown read; relative resolution; cancellation/selection via mocked native picker; traversal and symlink escape rejection; wrong suffix, missing file, invalid UTF-8, >2 MB, NUL path, and remote document link rejection; annotation route absent.
- `git diff --check`: PASS.

Initial setup/check failures: dependencies were not installed (`tsc` unavailable), resolved with `npm ci`. Initial tests exposed inherited `WEB_PORT` conflicting with the baseline's fixed-5173 origin assertion; rerun with `WEB_PORT` unset passes. New async test initially used an unavailable pytest plugin, changed to standard `asyncio.run`. Initial isolated UI used an insecure synthetic origin (crypto.randomUUID unavailable); changed to fully intercepted HTTPS. These were test setup issues, not evidence of provider runs.

## Direct visual comparison

Built a temporary copy of the direct reference frontend under `/tmp/reader-fidelity-ui/reference` using the target's existing build dependencies; the source reference was not modified. No server was started. Both compiled UIs were rendered with the same Markdown fixture, draft, pane width (560px after keyboard/pointer operations), and viewports (1440x1000, 390x844). Reference-only injected CSS hid `.annotation-toolbar` and `.annotation-rail` and removed the comment canvas grid/min-width, approximating removal of comments without changing reader styling.

Commands:

- `REFERENCE=1 CAPTURE_ONLY=1 node scripts/verify-reader.mjs /tmp/reader-fidelity-ui/reference-dist /tmp/reader-fidelity-ui/reference-captures`
- `CAPTURE_ONLY=1 node scripts/verify-reader.mjs dist /tmp/reader-fidelity-ui/target-captures`

Inspected both desktop and narrow image pairs. Shared header, left-chat heading/welcome/composer, reader padding, heading/body typography, quotation/table/code surfaces, and icon-led controls visually match. Intentional difference: reader eyebrow says DOCUMENT rather than DOCUMENT REVIEW. Target omits all comments; the reference comparison hides them only for comparison. Image artifacts remain at the above temporary paths. Checks log: `/tmp/reader-fidelity-ui/checks.log`.

This is a preliminary agent comparison, not owner acceptance or an exhaustive visual audit.

## Lessons and remaining gaps

Direct reference reuse preserves visual quality without importing annotation behavior. The main integration boundary is app-owned reader state versus session-owned draft/outbox state. Relative document links need an explicit backend resolution path, not ordinary browser navigation. Mock UI tests and real filesystem tests establish different things and are both needed.

Untested: actual macOS native dialog interaction (including native cancellation), live-provider send/steer/stop, exhaustive browser/OS accessibility behavior, and owner visual acceptance. Picker deliberately retains reference macOS-only support; other platforms report an error. Fragment-only navigation works for explicit sanitized HTML IDs; automatic Markdown heading slug generation is not added. File refreshing occurs on busy-state changes (including completion), not via a filesystem watcher. No claim of owner acceptance is made; coordinator review/deployment is next.
