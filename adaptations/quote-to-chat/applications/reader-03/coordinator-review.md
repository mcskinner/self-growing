# Uncoached replication: functional pass, recurring label overflow

## Frozen setup

Plan amendment committed as `6168060` before invocation. Fresh target: `0d6ebc22c84fed9bc3848b6beb8ed3f957d71c61`, not a previous application or repair. Fresh Pi CLI session used configured `openai-codex/gpt-6.1-sol`, the existing adapt skill/tooling, generated brief, and ordinary target context. It received no prior outcomes, debugging feedback, repaired code, or coordinator verifier.

Description SHA-256 remained `07a7e9fa977cd9beb08280ff319e80a73908f2fb543224d6943293cf2135025c`; original reference.patch remained `ad64a2f52d16e3a4e61b404f58ff11a67b34954b161e49846e9559123521df1b`. Original reference/evidence were allowed, not required to be consulted. The applier read the description and evidence summary and reported not needing the reference patch. The reviewed tool log corroborates those input reads; no repair/history/coordinator input was supplied. See input-manifest.json for hashes.

Invocation used the same noninteractive CLI pattern as preceding runs, with an isolated session directory and launcher port/virtualenv variables removed. Raw prompt/events/session remain local under `.local/adaptation-runs/quote-to-chat-reader-03/`; no private transcript was copied.

## First result, unmodified

Application: `47c4860104fd9a979651213e1764d51a31d0ddaa`, recorded with a clean target tree. The commit is local/unpushed; application.patch preserves its full delta. Only frontend quoting and tests changed. Native picking, backend access, renderer, skill/tooling, and the running workshop feature were unchanged; no docs drawer imported.

- Existing record/evaluate passed unchanged: check, test (55 Python/22 Node), build.
- Applier-authored mocked Chromium checks passed at 1440px/390px. Feedback records autonomous fixture correction (`message` versus `text`) and a placement adjustment to avoid covering a link; neither was coordinator coaching.
- Independent [verification.mjs](../../verification.mjs) was replayed byte-for-byte unchanged, SHA-256 `cc4db324be316d88455af1456ced40613ac90c9f5c26f908ce23c2d28e4be9dc`. No harness fixes, selector changes, or application repairs were needed to complete it.
- All functional scenarios passed at 1440×900 and 390×900: picker flow, pointer/keyboard selection action, source attribution, prior draft preservation, settled end-caret/focus, repeat/multiline quoting, refresh, per-chat isolation, busy-turn no-send behavior, whitespace/outside rejection, limits, Escape, navigation, close/reopen, history controls, and explicit send. No page errors or implicit chat calls.
- Placement passed (10px from the selected text), but label fit failed at both widths. Screenshot review confirms Add to chat wraps outside the small button, over the selected passage. `.document-quote-action button` sets padding/font/colors but leaves the target's global 36×36px button dimensions in force. This is a real integration defect, not an assertion based on a preferred pixel width.

Overall: **not accepted**. The unchanged verifier exited 1 for unreadable/overflowing action text; browser-result.json retains the separate functional/placement/label verdicts. Public-fixture screenshots stay locally under `.local/adaptation-runs/quote-to-chat-verification-03/`. No repair or description amendment was performed after seeing this result.

## Interpretation and limits

The sizing defect recurred on two uncoached applications of the current description, whereas this run did not reproduce the caret failure. A repaired pass alone was insufficient evidence of uncoached reliability. This recurrence motivates examining applier verification of actual rendered controls; it does not by itself establish that a source-specific CSS instruction belongs in the adaptation. Do not count this as a successful transfer, silently fold in the previous fix, or automatically schedule another run.

Evidence is limited to this closely related same-base target and configured model. Browser APIs/chat/SSE and picker results were mocked: no live-provider interaction, actual OS chooser, physical touch, screen-reader/cross-browser survey, exhaustive document selections, or target owner acceptance. The result does not compare implementation-first versus adaptation-first workflows. The running owner-reviewed feature was not modified.
