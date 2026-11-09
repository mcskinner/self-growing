# Application feedback

## Did it work?
Yes in the executed unit/static browser acceptance checks. Implemented and committed in the specified target worktree only.

Commit: `959a911dd414ee68b63cbcf9f84b3a5f6fe21313` — `Add explicit document selection quotes to chat draft`.

The reader shows a transient native “Add to chat” button beside a nonblank in-article selection. Explicit activation appends the loaded source path and editable blockquote text to the current composer, preserves existing text, persists the draft/cursor, and focuses the composer. It never invokes send/outbox APIs. Escape, navigation, close, reload, scrolling, and resizing invalidate the action. The existing 100,000-character limit is shared with the formatter; overflow rejects the entire insertion with an explanation. Renderer, reader navigation, backend access policy, chat queue, skill, and existing tooling are unchanged.

## Lessons learned
- The intent description plus linked evidence was sufficient; no reference patch copying was needed. The recipient's native picker and split-pane reader already supply source attribution and document lifetime.
- A synchronous, current-chat composer ref avoids retaining a pending quote across chat remounts. A separate pure formatter makes draft preservation and limit behavior independently testable.
- Selection UI needs both DOM containment checks and lifecycle invalidation. A native button with pointer-down selection preservation supports mouse activation and keyboard focus/Enter without changing the send path.
- The bundled Playwright Chromium install was unavailable on mac12-arm64. Isolated browser checks succeeded using installed Google Chrome instead; no app/backend stack was started.

## Gaps identified / checks not performed
- No live provider calls, running-workspace interaction, or real backend integration checks performed (per constraints).
- No manual visual review, screenshots, screen-reader audit, touch-selection checks, Safari/Firefox checks, or exhaustive rich-Markdown selection coverage performed. The narrow viewport check is desktop Chrome at 390px, not mobile-device evidence.
- Browser fixture exercises native pointer selection and programmatic ranges, focus/Enter activation, and button clicks. Full keyboard-only text-selection/navigation was not tested.
- Chat-opening rejection and session-switch races are guarded in code but not exercised by this browser fixture. Reload persistence is exercised with mocked SSE and browser sessionStorage.
- Existing pytest warning: Starlette deprecates its httpx TestClient integration. No unrelated dependency changes made.
- No evidence here that the adaptation description needs hardening; these are coverage limits, not observed transfer failures.

## Evidence
- `make check`: passed (ruff, formatting, wiki lint, TypeScript).
- `make test`: passed, 55 Python tests and 22 Node tests, including 3 new quote formatter tests.
- `make build`: passed.
- `git diff --check`: passed; worktree clean after commit.
- Browser command (after production build):
  `PLAYWRIGHT_MODULE=../.local/quote-browser/node_modules/playwright/index.mjs CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node scripts/test-quote-browser.mjs`
- Browser results: passed at 1440px and 390px. Fixture serves only production `dist` on an ephemeral loopback port, mocks every API request and EventSource, and checks native pointer selection; selection-only no-op; action placement; Escape; keyboard activation; source attribution; prior-draft preservation; composer focus; reload persistence; repeated quoting while busy without sending; overflow preservation/error; composer/blank/cross-boundary exclusion; document navigation/close invalidation; reopening with correct attribution; and subsequent explicit send of the exact draft.
- Formatter checks cover multiline/CRLF/indentation, blank selections, empty/repeated quotes, exact-limit success, and overflow rejection including attribution overhead.
- Committed implementation diff is available via `git show 959a911dd414ee68b63cbcf9f84b3a5f6fe21313` in the target. No additional application/evaluation record files were generated because writes outside the target were restricted to this feedback record.
- Read only the supplied brief, frozen adaptation/evidence, local adapt skill, and ordinary target implementation/context. No other application histories, experiments, coordinator verification, other checkouts, or saved chats inspected. No push or publication performed.
