# Experiment: transfer quote-to-chat from a reviewed implementation

Status: verification-guidance revision achieved a clean fresh pass; two exact-input replications authorized and planned, 2026-11-08. Plan committed as `58bae20` before extraction/application, not before the source feature's development.

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

Second fresh application `959a911` used the one-sentence revision frozen at `8c14571`. Record/evaluate passed, and it produced a selection-relative action. Independent acceptance found real label-overflow and composer-end-caret/focus failures before completing the full suite. See the [second review](../../adaptations/quote-to-chat/applications/reader-02/coordinator-review.md). Its first state is preserved, not accepted.

### [2026-11-08] prospective amendment: separate prompted application repair

Create another worktree from `959a911`, retaining the same description. Supply a fresh repair session only the observed failures (button label overflowing inherited dimensions and composer end-caret/focus assertion failing), the existing feature intent, and ordinary target/reference context. No coordinator runtime-code edits. Commit and record the repair delta separately; evaluate and replay the refined independent recipe. A repaired pass is prompted repair evidence, not a successful first application or a reason to inflate the adaptation description. Do not integrate the trial implementation into the running app.

Repair `a109476` passed existing automated evaluation and full independent mocked Chromium acceptance at 1440px/390px. Its source was not integrated into the workshop. The final verifier still fails both original applications, distinguishing the two earlier misses from the repaired result. See the [repair review](../../adaptations/quote-to-chat/applications/reader-02-repair/coordinator-review.md) and [adaptation overview](../../adaptations/quote-to-chat/README.md).

Verifier refinements are recorded explicitly: inactive does not require absent markup; selected newlines use hard-break fixtures; asynchronous focus and viewport/layout settling must be awaited; actual label overflow is stronger than a minimum pixel-width heuristic. No application code changed during coordinator verification. The final recipe was replayed against all three committed states. Raw iterations and screenshots remain local.

### [2026-11-08] prospective amendment: uncoached revised-description replication

The owner requested another clean run because a repaired pass does not establish uncoached sufficiency. Prepare `quote-to-chat-reader-03` from the original target `0d6ebc22c84fed9bc3848b6beb8ed3f957d71c61`, not either prior application or the repair. Use a fresh Pi session with the same configured model, existing skill/tooling, ordinary target context, and only the generated brief/frozen description plus original reference/evidence. Do not supply previous results, repair code, debugging feedback, or the independent verifier. No new instruction changes or coordinator runtime edits.

Freeze these inputs before invocation:

- Description SHA-256: `07a7e9fa977cd9beb08280ff319e80a73908f2fb543224d6943293cf2135025c` (unchanged from reader-02 and its repair).
- Original reference.patch SHA-256: `ad64a2f52d16e3a4e61b404f58ff11a67b34954b161e49846e9559123521df1b`.
- Independent verification.mjs SHA-256: `cc4db324be316d88455af1456ced40613ac90c9f5c26f908ce23c2d28e4be9dc` (held out; replay unchanged).

Record the first resulting commit/diff/feedback, run the existing evaluator, and independently replay desktop/narrow acceptance and inspect the selection-action screenshots. Keep any harness/setup issue distinct from implementation failures. Preserve a failure without silently repairing it; no automatic repair or additional instruction revision is part of this run. Do not integrate target runtime code into the running workshop. This is another closely related same-base application, not broad portability, a guarantee, or a comparison of development methods.

Replication `47c4860104fd9a979651213e1764d51a31d0ddaa` passed unchanged record/evaluate and all functional scenarios of the byte-identical independent verifier at 1440px/390px. Nearby placement and settled composer-end-caret checks passed; the action's label overflowed inherited global button dimensions at both widths. Screenshot/code review confirms the failure. Overall acceptance failed, with no repair, verifier adjustment, or further description change. See the [uncoached replication review](../../adaptations/quote-to-chat/applications/reader-03/coordinator-review.md), frozen hashes, patch, feedback, and separate browser verdicts. No trial runtime code was integrated into the running app.

### [2026-11-08] prospective amendment: at most three further verification-guidance trials

The owner authorized up to three additional fresh applications (`reader-04`, `reader-05`, `reader-06`), not three repairs of an existing application. Hypothesis: the recurring label defect reflects a missing verification obligation. Previous applier scripts tested button placement/clicking but not actual label fit; a portable acceptance sentence may close that gap without prescribing target-specific CSS.

For reader-04, append one sentence to the current description requiring browser assertions that the quote-action label is readable on one line and fits inside its control at wide/narrow viewports, explicitly distinguishing label geometry from button visibility/bounds. No CSS recipe, debugging history, repaired code, or coordinator test is supplied. Preserve original reference/evidence, configured model, existing skill/tooling, and the original target `0d6ebc22c84fed9bc3848b6beb8ed3f957d71c61`. Freeze the revised description in Git before preparing/running a fresh applier. Hold out and replay unchanged verification.mjs SHA-256 `cc4db324be316d88455af1456ced40613ac90c9f5c26f908ce23c2d28e4be9dc`.

Each application is autonomous within its first invocation, committed and recorded before independent evaluation. Use the same normal safety/context brief and isolated worktree/session pattern; never show prior outcomes or repair hints beyond the frozen description's explicitly tested guidance. Publish selected patches, hashes, feedback, evaluation outcomes, and coordinator review; raw sessions/screenshots stay local. Keep the running feature unchanged.

If reader-04 passes, use another fresh same-base run with identical guidance to test replication. Two independently passing fresh applications on the same inputs are a stopping point, not evidence of broad portability. If a run fails, preserve it and diagnose the observed gap before deciding whether the next run merits a minimal guidance amendment or unchanged replication; commit any amendment before invocation. Do not automatically turn implementation-specific fixes into instructions. At most three new application invocations are authorized; no prompted repair chain in this batch. Stop earlier if useful evidence is sufficient, and report uncertainty rather than manufacturing a clean outcome. No skill/tooling hardening or target-baseline changes are part of this batch.

Reader-04 (`788274c3c42c842e2f142310cc5bbb09e1df9222`) used the verification-guidance description frozen at `f138085`, SHA-256 `06f125519f09d08535a8070353d6e2ab8be3bbed7a059679a729caf99dd441d2`. Record/evaluate and unchanged independent desktop/narrow acceptance passed on the first committed application, without coordinator repair or verifier adjustments. The applier's own browser test now asserts actual label text geometry and identifies inherited global button sizing. See the [first verification-guidance review](../../adaptations/quote-to-chat/applications/reader-04/coordinator-review.md). This is one positive same-base result, not a controlled causal comparison.

Reader-05 (`8b01b6b4858d981efe82abf09a0dc7c2ed4551d0`) used identical inputs in a fresh worktree/session. Automated evaluation passed; its own browser checks explicitly cover actual label geometry, and wide independent screenshot review confirms a readable label. The verbatim held-out verifier hit a caption-selector mismatch (valid “Add quote to draft”); a separately preserved three-regex caption translation changed no assertions or target code. That replay then timed out on settled composer-end-caret placement. Full independent acceptance failed; later/narrow scenarios were not completed. See the [replication review](../../adaptations/quote-to-chat/applications/reader-05/coordinator-review.md). No repair was made. New application budget used: 2 of at most 3.

### [2026-11-08] prospective amendment: final bounded settled-caret verification trial

Reader-05's own tests inspect focus but not settled caret endpoints or continued typing, mirroring the earlier reader-02 failure. For reader-06, keep the label-verification sentence and add only: after the updated draft renders, assert composer focus with a collapsed caret at the end and verify typing appends there. This is a portable observable outcome, not a React/selection-cleanup fix. Freeze the revised description before invocation; use the same original baseline/reference/evidence, configured model, skill/tooling, safety brief, and isolated context. No previous outcomes, repaired code, or coordinator verifier supplied.

Replay the original held-out verifier first. If a valid different action caption blocks selection, preserve the original output and translate only that locator, retaining identical scenarios/assertions and publishing the exact delta. This exception addresses a demonstrated brittle test selector, not an adaptation requirement for exact wording. Do not change assertions or target code during independent verification. Preserve the first application whether it passes or fails, with no prompted repair. This consumes the third/final authorized additional application; stop afterward and report mixed evidence rather than automatically iterating again.

Reader-06 (`4a5e3951d397096d0d43d7c7b2f2cd8e2d28a92f`) used the final description frozen at `9b21636`, SHA-256 `20979b7109a7a6c3b6f66cc897011fcc54b202c35cb796f136fbf4e51592aee7`. Existing record/evaluate and byte-identical independent verification passed at 1440px/390px, including label fit and settled end caret; its own committed browser tests additionally assert subsequent typing. No caption translation, verifier adjustment, or application repair was needed. See the [final bounded review](../../adaptations/quote-to-chat/applications/reader-06/coordinator-review.md).

All 3 of 3 additional application sessions have been used: reader-04 pass with label guidance; reader-05 failed the settled-caret check after a caption-only locator translation; reader-06 pass with both acceptance sentences. Stop here. The latest revision has one clean pass, not repeated independent success on identical guidance. No trial runtime code was integrated into the running workshop.

### [2026-11-08] prospective amendment: reproduce the clean latest-revision pass twice

Reader-06 was a clean, unrepaired success. The owner requested two more fresh replications of that exact revision, not further hardening or repaired applications. Run reader-07 and reader-08 from the original baseline `0d6ebc22c84fed9bc3848b6beb8ed3f957d71c61` in separate worktrees and fresh isolated Pi sessions. They may run concurrently because their target trees, session directories, output records, and static fixtures are independent. Neither receives the other's work or any previous result, debugging feedback, repair code, or coordinator verifier.

Freeze description SHA-256 `20979b7109a7a6c3b6f66cc897011fcc54b202c35cb796f136fbf4e51592aee7`, original reference.patch `ad64a2f52d16e3a4e61b404f58ff11a67b34954b161e49846e9559123521df1b`, and independent verification.mjs `cc4db324be316d88455af1456ced40613ac90c9f5c26f908ce23c2d28e4be9dc`. Original evidence, skill/tooling, configured model, normal safety/context prompt, baseline, and acceptance assertions are unchanged. No added instructions or implementation hints.

Record each first committed result and feedback, run the existing evaluator, and independently replay the held-out wide/narrow checks and inspect screenshots. Preserve the original verifier output if a valid different caption requires a locator-only translation; publish the exact selector delta with unchanged assertions. No coordinator code edits, prompted repairs, or description amendments in this replication pair. Keep the running feature/saved chats untouched; preserve both outcomes rather than chasing a success. These two runs test repeatability on this related baseline, not broad app portability or necessity of either guidance sentence.

Reader-07/08 final outcomes: pending.

#### [2026-11-08] verifier subject-translation clarification

Reader-07's first committed result passed automated evaluation and the caption-translated independent functional scenarios, but exposed another verifier markup assumption: its single-line label is wrapped in a span, so a Range over all button contents counts both the span rectangle and its text rectangle as if they were two lines. Screenshots show readable contained text; source inspection confirms the wrapper. Preserve original/caption-only outputs and use a separate supplemental verifier that selects the actual label span's contents, checking that it covers the entire button text. Keep single-line, control containment/overflow, viewport, placement, and all functional assertions intact; log wrapper/text rectangles for diagnosis. This is target-specific label-subject locator translation, not a product repair or relaxed readability criterion. Record the exact verifier delta and hashes. The canonical verifier remains unchanged, and neither fresh applier receives this diagnostic information.

## Lessons and next experiment

The first result separates functional transfer from interaction fidelity: leaving placement unspecified allowed a reasonable but different UI. One sentence clarified that experience; do not add the entire source implementation to fix one missing requirement. The revised application reached the intended UI form but exposed ordinary CSS/controlled-input integration bugs, which were repaired without inflating the description. Passing automated evaluation and applier-authored browser checks did not establish independent acceptance. The additional uncoached replication passed functional/end-caret checks but repeated the button-label overflow on the unchanged description/reference/verifier. This is repeatable evidence of that target integration risk across two uncoached applications, not proof that a source-specific CSS instruction is the right hardening response. That placement-only description had a repaired pass but no fully passing uncoached application in those trials. The later bounded batch tested actual label-fit verification guidance (fresh pass, then settled-caret failure) and an additional post-render caret/typing assertion (fresh pass). This supports an acceptance-verification-gap hypothesis without proving causality, universal necessity, or reliable repeated success of the latest revision. Rendered text inside a control and settled editing state need evidence distinct from container bounds and mere focus.

This is limited evidence from closely related targets, with reference code allowed. The repaired pass does not demonstrate first-try sufficiency or broad generalization. This trial cannot compare implementation-first and adaptation-first workflows; a later prospective trial would be needed for that question. No additional experiment is automatically scheduled.
