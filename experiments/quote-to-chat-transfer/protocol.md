# Experiment: transfer quote-to-chat from a reviewed implementation

Status: planned, 2026-11-08. This protocol precedes extraction and target application, not the source feature's development.

## Question and hypothesis

Can the existing adapt skill extract the independently useful quote-to-chat workflow from a mixed navigation/quoting implementation, then apply it to an existing reader without importing the docs drawer or changing document access?

Hypothesis: a minimal outcome description with reference evidence is enough for a fresh recipient to deliver attributed draft insertion while preserving its reader and chat. One related target tests basic extraction/application, not broad generalization or whether implementation-first beats adaptation-first development.

## Scope and exclusions

Select rendered document text, explicitly add an attributed quote to the current draft, and leave it editable and unsent. Keep the selection action coherent with the recipient's UI. Exclude the project-docs tree/drawer, docs-only API restrictions, persistent comments/anchors, review queues, multiple-action frameworks, renderer migrations, and richer source locators. Normal document reading and chat must remain usable.

## Starting conditions

- Reviewed source implementation: `e97bfc6edca92b8786ef3108f8c019d0f4b5048e`.
- Reference base and target: `0d6ebc22c84fed9bc3848b6beb8ed3f957d71c61`, the committed workshop reader before this session's feature work. It already has full-screen/split chat, session-specific drafts, a native file picker, and relative document navigation; it has no quoting. This is a closely related target, not a divergent app.
- Reference paths: frontend reader, app shell, reader styles, quote helper, and quote tests. The reader/shell/style diff also contains navigation work; explicitly label it mixed evidence. No backend patch is needed for quote-to-chat.
- Current workshop feature and wiki cleanup are already committed as `e97bfc6` and `b67d7b9`. Do not replace the running app with the application.
- Use existing `.pi/skills/adapt/SKILL.md` and `scripts/adapt.py` unchanged. Separate Pi CLI sessions/worktrees use the installed login and configured model. Never resume, copy, or modify the active chat session.

## Procedure

1. Commit this protocol before extraction. Capture the source patch with the existing CLI. Supply a short, reviewed intent summary instead of copying private transcripts: quote-to-chat chosen over commenting, path-plus-quote retained, no prospective-protocol claim for source development.
2. Run a fresh distiller at a detached source checkout. It may read the implementation, captured patch, and intent summary; it writes only adaptation.md/evidence.md. Record model, invocation, outputs, and deviations. Do not improve its description before the first application; freeze the unedited result in Git.
3. Prepare one target worktree using the unchanged CLI and frozen description. Give a fresh applier its generated brief, adapt skill, and ordinary target context. Reference evidence is allowed; this is not a description-only test. No prior trial feedback, coordinator acceptance script, or coaching. The applier may debug autonomously, run tests, and commit its application.
4. Preserve its first commit/diff/feedback and run existing record/evaluate. Provision normal target dependencies without target code changes. Classify tooling/setup failures separately; do not quietly fix implementation failures.
5. Independently exercise the acceptance scenarios below using public Markdown and mocked document/chat/SSE APIs in a browser. A temporary static-file fixture server on an ephemeral port is allowed; do not start another development stack or call a provider. Adapt test selectors/setup to the target, not its implementation. Record test-harness corrections separately from application repairs.
6. Record results and any observed effort/blockers. If the application fails, preserve it before deciding whether a separate repair/retry is warranted. Do not treat a successful repair as a successful first application or harden instructions without an evidenced gap.

## Acceptance scenarios

At desktop (1440px) and narrow (390px) viewports:

- Existing file-picker/reader flow opens a public Markdown fixture, preserving split/full-screen chat modes and the target's path/access behavior. No docs-tree API or drawer is introduced.
- Selecting non-empty text within the rendered document exposes a discoverable nearby quote action. Test an actual pointer selection as well as deterministic Selection API fixtures. The label fits and remains inside the viewport; normal Markdown formatting, code, and links remain readable.
- Acting on a selection inserts exactly one quote with the source path into the current draft, preserving existing text and line breaks. It leaves the result editable, focuses the composer at the end, and never calls the chat endpoint. Quoting during an active agent turn is also draft-only.
- Repeated quoting works; refresh retains the draft. A different chat keeps its own draft, with no cross-chat quote leakage.
- Empty/whitespace selections and selections outside the reader do not offer quoting. Escape dismisses the action without altering the draft. Keyboard activation works without losing the captured passage. Navigation/close clears obsolete selection state.
- Existing draft-length limits are respected without truncating prior work. Quote action does not overflow at either viewport. An explicit Send still reaches the mocked chat endpoint.
- Relative document links and close/reopen work; no page errors or horizontal page overflow. Existing chat controls and saved-draft behavior remain intact.

Run `make check`, `make test`, and `make build` with the evaluator's normalized environment. Automated checks, mocked browser assertions, source-style visual inspection, and owner acceptance are separate evidence. Do not claim live-provider testing, physical-touch coverage, exhaustive accessibility, or owner approval of the target application.

## Evidence and privacy

Reviewed adaptation artifacts under `adaptations/quote-to-chat/`; protocol and outcome here. Keep raw Pi sessions/prompts/events, full command logs, screenshots, and working application records locally under `.local/adaptation-runs/quote-to-chat-*`. Publish only reviewed descriptions, source/application patches, provenance, brief feedback, and selected evaluation results. No private transcript or screenshot copying. Retain failed attempts and disclose unavailable/unpushed commits; a patch is durable evidence where a commit link is not public.

## Results

First application `af11bde` used the unedited extraction frozen at `3834b42`. Existing evaluation passed, and independent mocked Chromium checks passed the functional scenarios at 1440px and 390px, including cross-chat draft isolation. It did not meet the nearby-highlight interaction criterion: the recipient chose a permanent quote action row. See the [first coordinator review](../../adaptations/quote-to-chat/applications/reader-01/coordinator-review.md) for observations, test-harness corrections, limitations, and preserved evidence. No target application was integrated into the running app.

### [2026-11-08] prospective amendment: one minimal-guidance retry

Before starting a second application, add one sentence requiring the action beside the current highlight rather than a permanent quote toolbar. Freeze that revision, prepare a new worktree at the same original target commit, and run a fresh applier with its generated brief/normal context and unchanged reference evidence/tooling. Do not supply the first result, coordinator script, or repair coaching. Replay the corrected independent recipe unchanged. This tests one observed fidelity gap; no claim of broad generalization or a controlled causal comparison.

Second application: pending.

## Lessons and next experiment

The first result separates functional transfer from interaction fidelity: leaving placement unspecified allowed a reasonable but different UI. Avoid adding the entire source implementation to fix one missing experience requirement. This trial cannot compare implementation-first and adaptation-first workflows; a later prospective trial would be needed for that question.
