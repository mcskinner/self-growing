# Application feedback

## Did it work?
Implemented and committed in the specified target worktree as `47c4860` (`Add selected document passages to the existing chat draft`). Automated acceptance checks passed; no live-agent claim is made.

A nonblank selection confined to the rendered current document reveals a nearby accessible “Add to chat” action. Activation appends editable, path-attributed blockquote text to the existing per-conversation draft and focuses the composer at its end. Selection alone, Escape/dismissal, navigation, and close do not insert text. Quoting is independent of sending/steering/queueing, including while busy. Combined drafts over the existing 100,000-character limit are rejected with an explanation and without truncation. Document loading/reload clears the transient action; scroll/resize dismiss it rather than leaving a detached action.

Preserved the existing reader renderer, file picker, link behavior, chat persistence, queue/send paths, skill, and tooling. No backend changes, persistent annotations, document writes, navigation additions, or browser credentials.

## Lessons learned
- The portable handoff fits the recipient's existing reader and composer without importing the source's document drawer or access policy. The brief and frozen evidence were sufficient; the reference patch was not needed.
- Use the loaded document's canonical path for attribution, and append to the current composer value rather than replacing selected draft text.
- Separate quote formatting/limit enforcement from the explicit send path. A synchronous composer handle reports rejection without creating queued work or a deferred quote that could leak into a later conversation.
- Browser testing exposed a placement issue: positioning below a selected paragraph covered the next link in the fixture. The action now prefers above the highlight and falls below near the viewport top. The rerun passed ordinary link navigation with an active selection. An initial test assertion also incorrectly expected the API field `text`; corrected it to the recipient's existing `message` field (no send implementation change).

## Evidence
- `make check`: passed (Ruff checks/format, wiki lint, TypeScript).
- `make test`: passed, 55 Python tests and 22 TypeScript tests. One existing Starlette/httpx deprecation warning.
- `make build`: passed.
- `git diff --check`: passed before commit.
- Added `tests/document-quotes.test.ts`: multiline attribution, whitespace preservation, blank no-op, empty/repeated quoting, exact limit and overflow rejection.
- Added and ran `tests/quote-browser.mjs` against production build assets served on an ephemeral loopback port. All APIs and event snapshots mocked; no app/backend stack or provider was used. Chromium passed at 1440×1000 and 390×1000: real mouse drag selection, nearby/on-screen action, no draft mutation on selection, Escape dismissal, Tab/Enter activation, focus return, preservation and correct canonical attribution, reload persistence, repeated quoting while busy with zero sends, overflow alert and unchanged draft, composer-selection exclusion, link navigation and close invalidation, and exactly one request only after explicit send with the full draft.
- Optional browser dependency installed only under ignored target `.local/quote-browser`; committed test header includes setup/run commands. No dependency manifest or lockfile changes.
- Intended implementation and acceptance tests are captured by commit `47c4860`; no additional run artifacts were written because this task permits edits only to the target worktree and this feedback record.

## Gaps / checks not performed
- Not performed: live provider calls, running app/backend stack, native OS picker interaction, or end-to-end Pi steering delivery. Explicit send was tested only against mocked HTTP.
- Not performed: Safari/Firefox, real touch selection/native mobile selection menus, screen-reader testing, manual visual review, or exhaustive complex-table/code/multiparagraph browser selections. Mobile evidence is a Chromium viewport, not a physical device.
- Not performed: browser-driven chat-switch race tests, failed document-load retries, or busy-triggered reload invalidation specifically. Those boundaries are implemented through the existing keyed conversation/reader lifecycle, load-state selection reset, and synchronous composer readiness rejection, but are not independently browser-verified here.
- The action is deliberately transient: scrolling/resizing dismisses it; reselect the passage to quote. No durable locator beyond the source path is provided.
