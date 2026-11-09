# Application feedback: quote-to-chat

## Outcome
Implemented and committed in `/Users/michael/dev/self-growing-quote-reader-06`.
Commit: `4a5e3951d397096d0d43d7c7b2f2cd8e2d28a92f`.

The existing Markdown reader now offers a transient accessible “Add to chat” control beside a nonblank in-document selection. It appends attributed editable text to the current conversation's draft, preserves prior work, rejects whole insertions beyond the existing 100,000-character limit with an explanation, and focuses the rendered composer with a collapsed caret at its end. It never invokes delivery. Escape, outside pointer interaction, scrolling, reload, navigation and closing dismiss the action. Existing renderer, native picker, chat persistence, queue and send behavior remain in place. Skill/tooling preserved; no backend changes.

## Observed checks
- `make check`: passed (Ruff lint/format, wiki lint, TypeScript).
- `make test`: passed: 55 Python tests and 22 Node tests, including three new quote formatter tests. Existing Starlette/httpx deprecation warning remains.
- `make build`: passed.
- `git diff --check`: passed.
- `CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node tests/quote-browser.mjs`: passed at 1440×900 and 390×900 against intercepted production assets and fully mocked APIs/EventSource. No app/backend server or provider requests.
- Browser assertions cover pointer selection, composer-selection exclusion, selection-only no-op, Escape, label text as exactly one range rectangle fully within the rendered button (plus horizontal viewport bounds), keyboard activation, attributed append preserving prior draft, focus/collapsed end caret after draft rendering, subsequent typing, reload persistence, repeated quoting while busy without delivery, whole-insertion overflow rejection, keyboard document-link navigation invalidation, correct new-document attribution, closing invalidation, and subsequent explicit send of the complete draft.

## Lessons and gaps
- Used adaptation description first and target reader/composer context; consulted frozen evidence.md, not the mixed reference patch or other histories. No navigation drawer or backend access-policy changes were imported.
- A post-render layout effect is necessary to place the caret after the controlled textarea receives the new value; focusing only during the click handler would not establish this guarantee.
- Explicit button width, no wrapping and measured text rectangles guard against the target's global square-button styling. On narrow layouts, fixture selection waits for composer autosizing/scrolling to settle.
- The browser fixture initially used an insecure synthetic origin, preventing existing send behavior's crypto.randomUUID; switching to an intercepted HTTPS origin fixed the fixture, not application code. A link immediately below the selection can be overlapped by the transient control; the navigation invalidation test uses keyboard link activation. Escape/outside interaction dismisses the action.
- Playwright was installed locally without changing the package manifest/lock. Its default browser was absent and `playwright install chromium` failed because current Playwright does not support mac12-arm64; installed Google Chrome successfully ran the checks. The committed opt-in script supports CHROME_PATH and requires local Playwright/browser setup.
- Not performed: live provider delivery, app/backend development stack, real native picker interaction, manual visual review/screenshots, touch selection, screen-reader testing, other browser engines, complex rendered-passage cases, or chat-switch race browser tests. Mocked explicit delivery and existing unit tests are not evidence of live-provider behavior.
