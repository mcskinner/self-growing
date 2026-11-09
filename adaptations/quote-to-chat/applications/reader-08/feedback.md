# Application feedback

## Did it work?
Yes, in isolated production-build Chromium acceptance tests at 1440×1000 and 390×1000.

Implemented and committed in `/Users/michael/dev/self-growing-quote-reader-08`:
`97f1a18357f89cfb48909f5f93133fad5e91b6ed` — Add selected document passages to the editable chat draft.
The committed diff (`git show 97f1a18`) contains only the reader/composer integration, quote formatting, CSS, and tests. Working tree clean after commit. Existing skill/tooling unchanged.

The reader exposes a transient “Add to chat” action beside a nonblank article selection. It appends the rendered passage with the loaded source path to the existing editable draft, focuses the composer after rendering with a collapsed end caret, and does not send/enqueue/steer. Escape/outside dismissal, scrolling/resizing, loading, document navigation, and closing invalidate the action. Insertion validates the current selection again. Oversized combined drafts are rejected intact with an explanation.

## Checks performed
- `make check`: passed (Ruff, wiki lint, TypeScript).
- `make test`: passed, 55 Python tests and 22 TypeScript tests (including three new formatter tests). Existing FastAPI/Starlette deprecation warning remains.
- `make build`: passed.
- `node scripts/verify-quotes.mjs`: passed at both widths using mocked APIs and production assets, with no app/backend server or provider calls. Includes real pointer selection, keyboard activation, exact attribution/draft preservation, Escape, repeated quoting, reload persistence, busy quoting without traffic, overflow rejection without truncation, navigation/close invalidation, exclusion of composer selection, and subsequent explicit send. Asserts a single text-label rectangle inside the button's padded bounds, not merely button visibility. After draft rendering, asserts active composer and collapsed end caret, then types and checks appended text. Also checks proximity to the highlight and absence of JavaScript errors.
- `node scripts/verify-reader.mjs`: passed existing layout, resizing, rendering safety, link navigation, retry, draft persistence, chat switching, and mocked send/steer/stop regression checks.
- `git diff --check`: passed before commit.

## Lessons learned
- The target already owns draft persistence and limits in its chat component. A small synchronous composer handle keeps those responsibilities local and allows insertion rejection to be explained in the reader without adding navigation or message-queue behavior.
- End-caret placement belongs in a post-update layout effect; focusing before rendering would not establish the required editable continuation behavior.
- Runtime label-range measurements and actual appended typing provide stronger evidence than visibility/focus assertions alone.
- An early browser fixture used an insecure synthetic HTTP origin, so explicit send failed because `crypto.randomUUID` was unavailable. Switching that isolated fixture to HTTPS fixed the fixture; no application workaround was needed. The final checks above passed on the committed implementation.
- The description and evidence were sufficient; no reference patch transplant, unrelated source capabilities, or skill changes were needed.

## Gaps / checks not performed
- No live app/backend stack, native picker interaction, real provider calls, or live agent interaction performed (intentionally prohibited).
- No Firefox/WebKit, touch-device selection handles, screen-reader/manual accessibility, browser zoom, or exhaustive complex rendered-document selection checks performed. Keyboard activation and accessible button naming were tested in Chromium only.
- Chat-opening rejection is implemented but not specifically exercised by the quote browser test; the existing reader regression covers normal session switching, not a quote/session-switch race.
- No claim of universal viewport/selection geometry coverage beyond the tested widths. Scroll/resize dismiss the action rather than tracking its position.
- No coordinator verification files, other application histories/worktrees, or saved chats inspected. No publishing or pushing performed. Only this feedback record was modified outside the target worktree; no additional run artifacts were written.
