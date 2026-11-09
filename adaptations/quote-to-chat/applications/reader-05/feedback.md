# Application feedback

## Did it work?
Yes in isolated production-build browser checks with mocked APIs, plus the existing regression suites. Implementation committed in the specified target worktree:

- Commit: `8b01b6b4858d981efe82abf09a0dc7c2ed4551d0` — Add selection quote action that appends to the chat draft.
- Local captured diff: `/Users/michael/dev/self-growing-quote-reader-05/.local/quote-application.patch`.
- Working tree clean after commit; existing adapt skill/tooling unchanged.

A nonblank reader selection reveals a nearby transient “Add quote to draft” button. Activation appends the exact passage as editable Markdown blockquote text with the returned document source path, preserving the existing draft and focusing its end. It uses the existing conversation-scoped draft persistence, never the delivery queue. Insertions exceeding the existing 100,000-character limit are rejected atomically with an explanation. Escape, dismiss, outside pointer actions, scroll, resize, loading, document change, and close invalidate the transient action. No renderer, backend, document writes, annotations, or credentials were added.

## Evidence / checks performed
- `make check`: passed (Ruff, formatting, wiki lint, TypeScript).
- `make test`: passed, 55 Python tests and 21 Node tests (including two new quote-format/atomic-limit tests). Existing Starlette/httpx deprecation warning remains.
- `make build`: passed.
- `git diff --check`: passed before commit.
- `scripts/check_quote_browser.mjs`: passed four Chromium scenarios: 1440×900 and 390×900, each idle and busy. Only a temporary static production-build fixture server on an OS-assigned port was started; all API requests and EventSource snapshots were mocked. No development/backend stack or provider calls.
- Browser assertions cover: selection alone leaves prior draft intact; whitespace selection offers no action; explicit dismissal/Escape leave draft unchanged; attributed append and composer focus; repeated quoting and keyboard activation; reload persistence; relative document navigation with correct new source; stale action removal on navigation/close; over-limit rejection without truncation; no chat requests before explicit send; editing and explicit sending through the existing chat route.
- Label-fit assertions examine the actual text Range: exactly one rendered text rectangle, fully within the button vertically and horizontally, with nowrap styling and control bounds inside the viewport. Both viewport sizes pass; visibility alone was not used as evidence.

Reproduction after `make build` in the target:

```sh
QUOTE_PLAYWRIGHT="$PWD/.local/quote-browser/node_modules/playwright/index.mjs" \
QUOTE_CHROMIUM="$HOME/Library/Caches/ms-playwright/chromium-1140/chrome-mac/Chromium.app/Contents/MacOS/Chromium" \
node scripts/check_quote_browser.mjs
```

Playwright was installed only under target `.local/quote-browser` (ignored). Its current browser installer does not support this host's mac12-arm64; the checks successfully used the existing cached Chromium executable instead. No project dependency/lockfile changes were needed.

## Lessons learned
- Keep the draft owned by the existing conversation component: a narrow quote callback avoids introducing a second draft or accidentally invoking send/steer logic.
- The global button CSS fixes width at 36px. Explicit auto width, nowrap, and text-rectangle containment tests are necessary for a readable transient action.
- Validate selection endpoints against the live article and invalidate on reader lifecycle changes; source attribution should use the document response path.
- The first browser-test attempt clicked a link covered by the nearby popup and timed out. The navigation test now focuses and keyboard-activates the link while the action is present, proving document-change invalidation without clicking through an overlay. No product workaround or unrelated capability was imported.
- The minimal frozen adaptation plus ordinary target context was sufficient; reference patch/history were not needed, and no adaptation/skill hardening was made without transfer-failure evidence.

## Gaps / checks not performed
- No live backend/provider integration, development stack, real saved chats, native file picker, or real filesystem document writes were exercised (intentionally).
- No manual screen-reader audit, touch-device selection-handle test, Safari/Firefox run, zoom/font-override matrix, or screenshot review was performed. Keyboard activation was automated; pointer selection was created with DOM Range, not a real drag gesture.
- Scroll/resize invalidation, outside-pointer dismissal, cross-reader selection rejection, document reload races, and chat-switch rejection are implemented but not separately browser-asserted. Full regression suites passed, but this is not evidence of every interaction permutation.
- Label fit was observed at the two stated viewport sizes with the installed Chromium/default fonts, not every possible environment.
