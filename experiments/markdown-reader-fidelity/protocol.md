# Experiment: combine left chat and reader without losing the reference experience

Status: fresh application and preliminary checks complete; running preview at 7fb3524 awaits owner acceptance. Plan was committed before application as d7640c4. Owner review of prior integration: [failed](../../adaptations/markdown-reader/integration/owner-review.md).

## Question
Can revised minimal descriptions of left chat and the Markdown reader produce the intended combined experience on the historical workshop base, rather than merely two functionally plausible panes?

## Inputs and scope
- Target: 233ef7356949902b318c561f809503e5198da9a6, before any reader implementation.
- Reference: markdown-comments at 898db55839fad721fd9d5d6158e8c93440ac6323, with comments excluded from the recipient.
- Revised descriptions: adaptations/left-chat/adaptation.md and adaptations/markdown-reader/adaptation.md, frozen before application. Snapshot both, with hashes; use existing preparation/record/evaluation tooling unchanged.
- No control-plane work, global design-policy mechanism, composition-brief abstraction, or in-place fixes to the prior application. The application request may name both adaptations and the reference; combining them is ordinary integration work.

## Procedure
1. Commit owner review, revised descriptions, and this plan before running the applier. Keep original description snapshots and first application records unchanged.
2. Prepare a fresh target with the existing CLI. Add a frozen copy of the left-chat description alongside the reader inputs. Record this manual multi-input setup as a current tooling limitation, not a new protocol format.
3. Give a fresh Pi session only the generated brief, both descriptions, ordinary target context, and the specified reference implementation. Do not supply previous generated applications or repaired code. Let it apply both capabilities with normal autonomous debugging, then commit and record feedback.
4. Run existing automated evaluation. Independently inspect shell hierarchy, left/right arrangement, styling and controls against the reference. Render the same representative Markdown/chat content at the same desktop/narrow viewports using isolated browser fixtures; retain comparison artifacts. Behavioral tests and visual evidence answer different questions. Mocked chat is not live-provider evidence.
5. If the candidate meets these preliminary checks, put it into the running workshop as a committed preview, retaining the previous implementation and current wiki/lab work. Do not mislabel the preview as accepted. Owner review in the running app is the final gate. Record rejection rather than quietly repairing it in place.

## Acceptance
Shared logo-bearing app header above both panes; chat left and reader right on desktop; source-like reader typography/surfaces/icon-led controls minus annotation UI; usable narrow layout; readable code/links; relative Markdown-file navigation; existing chat and workshop features preserved. Ordinary app-shell integration judgment is expected, not an excuse to enumerate every possible layout mistake. Owner approval is required in addition to checks/test/build.

## Evidence and privacy
Application prompts, snapshots, provenance, diffs, evaluation results, and reference/candidate browser artifacts. Use synthetic/public fixtures, never private chat screenshots. Existing Pi login; isolated sessions; no second app server or provider calls for browser fixtures. Describe missed checks explicitly.

## Results
A fresh Pi session produced 3177e64 from 233ef73, with no coordinator code edits. Existing record/evaluate commands passed. Additional frozen left-chat/verification inputs were copied manually and hashed, without framework changes. The applier directly inspected the allowed reference, not earlier generated applications.

Coordinator replayed the candidate's isolated Playwright script successfully. A separate renderer captured source and candidate with identical public Markdown/chat fixtures at 1280x900 and 390x844. Shared header bounds, left-chat/right-reader arrangement, paragraph/link/inline-code/block-code/pre/body styles, icon-control inventory, no narrow page overflow, and no page errors passed recorded comparisons. Agent inspection found reference-like visual treatment, excluding annotations. This is not owner approval. Reference screenshots suppress comment UI/grid in browser CSS only, with raw reference desktop also retained. A capture timing issue was resolved by waiting for the draft's Send button to enable; no candidate code changed.

Candidate runtime/test files were deployed as preview 7fb3524, replacing rather than incrementally repairing the rejected implementation. Current workshop wiki/lab and saved chat remain. Check/test/build passed on the preview (55 Python, 19 frontend tests); the isolated UI replay passed again. No app server or live-provider call was started for checks. Native dialog, live chat, broad accessibility/browser coverage, and OWNER ACCEPTANCE remain unverified/pending.

Evidence: [application record](../../adaptations/markdown-reader/applications/fidelity-01/coordinator-review.md) and [running preview](../../adaptations/markdown-reader/integration/fidelity-preview.md). Previewing changes in the running app is necessary for review, not a substitute for the gate.
