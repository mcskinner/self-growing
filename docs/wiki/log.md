# Wiki log

Chronological record of meaningful synthesis and maintenance events. Append new entries; Git preserves exact page edits. Dates here describe wiki work, not necessarily when an idea was first conceived.

## [2026-11-08] synthesis | Initial map from the full journal and project discussion

Preserved the full journal and recorded subsequent discussion context as separate source documents, distinguishing user preferences, assistant interpretations, and implemented evidence. (Those documents were later removed; see the source-archive correction below.) Created the [concept map](index.md): embedded self-modification, minimal core/workshop, capability exchange, minimal-instruction hardening, federated hardening, collective learning, and control of agency.

The full journal restores the original motivation—repairing small tools through one pane of glass—and broader possibilities that adaptation-focused discussion alone could obscure. These are related explorations, not a feature backlog. Adopted Karpathy's index/log/maintenance pattern without a mandatory raw-source pipeline.

## [2026-11-08] review | Evidence boundaries and unresolved tensions

Reviewed the initial pages for conceptual consistency and linked evidence. Kept explicit distinctions between package installation and contextual transformation; code ancestry and idea lineage; automated checks and behavioral acceptance; optional local distillation and stronger implementation evidence; and persona guidance and actual execution permissions.

No claim of successful independent transfer or implemented federated service is supported by the current smoke trial. Preserved open tensions: minimal core versus usability, short instructions versus sufficient guidance, private evidence versus verifiability, and collective learning versus automatic reporting. These are questions to investigate, not contradictions to resolve automatically.

Added a small mechanical lint for local link targets and index coverage, included in `make check`. It does not check external URLs, anchors, or semantic truth. Semantic lint remains a review activity governed by the [wiki conventions](README.md).

## [2026-11-08] discussion | Adaptations as migrations and a development ledger

Captured the user's proposal for [adaptation-led development](adaptation-led-development.md): potentially require features to start with private or public adaptations, track capability requirements, and explore apply/unapply behavior. Distinguished a ledger of attempts from verified current capabilities, dependencies from common combinations, and rollback from compensation. No enforcement, dependency solver, or unapply mechanism was added. The concurrent blind Markdown-reader applications were left untouched.

## [2026-11-08] discussion | Acceptance evidence travels with adaptations

Captured the user's proposal for [acceptance and verification](acceptance-and-verification.md): prescribed behavioral steps, screenshots, and potentially Playwright scripts. Distinguished layout evidence from interaction evidence, simulated UI tests from live chat, and applier-authored tests from independent acceptance. Recorded privacy, cost, and overfitting concerns without introducing a new verification system or altering the first blind applications. The user then preferred a recipe for writing a target-specific Playwright test over screenshots as primary evidence; refined the page accordingly.

## [2026-11-08] review | Coordinator-prompted Markdown-reader repair

The coordinator reported that the preserved first application passed automated and isolated browser checks but failed relative Markdown-link navigation: sanitization removed the links' hrefs. This repair adds document-relative navigation and targeted renderer, reader-lifecycle, and read-only API tests without changing the adaptation description. It is a prompted repair, not evidence of a blind first transfer. Automated regression coverage now exercises the missing behavior; live browser/provider acceptance was not rerun. This reinforces the distinction between passing checks and satisfying the original exploration's acceptance criteria.

## [2026-11-08] experiment | Blind reader transfers, independent verification, and workshop integration

Recorded the [Markdown-reader experiment](../../adaptations/markdown-reader/README.md): fresh distillation, independent starter/workshop applications, and unchanged baseline tooling evaluation. A subsequent coordinator browser recipe caught relative-link navigation missing from the source and frozen description; all eight grouped browser scenarios passed after a separate prompted repair. These browser checks use mocked APIs/chat, not live-provider or native-dialog interaction. Kept the candidate instruction addition separate and unvalidated on fresh targets.

Integrated only the evaluated workshop reader and repair into trunk, preserving both wiki-log appends in a documentation-only cherry-pick conflict. Updated current-evidence pages without rewriting earlier log entries. No comment layer or automatic hardening system was added. Final checks/test/build passed; original attempts, repairs, prompts, patches, and result logs remain inspectable.

## [2026-11-08] owner review | Functional reader integration failed experience acceptance

The owner rejected the integrated reader's pane orientation, app-header nesting, Markdown visual treatment, and drift from reference icon controls. Recorded the [review](../../adaptations/markdown-reader/integration/owner-review.md), revised left-chat/reader descriptions, and planned a [fresh application from the original workshop base](../../experiments/markdown-reader-fidelity/protocol.md). No control-plane scope or composition-brief architecture was introduced. A running preview is required for owner review; successful automated checks are not owner acceptance.

## [2026-11-08] preview | Fresh combined application ready for owner review

A new session applied revised left-chat and reader descriptions directly to 233ef73 using the original reference, not the rejected reader. Candidate 3177e64 passed functional checks and reference-style comparisons. Put it into the running workshop as [preview 7fb3524](../../adaptations/markdown-reader/integration/fidelity-preview.md), preserving wiki/lab and saved sessions. Reference/candidate captures use public fixtures; browser APIs/chat are mocked. Owner acceptance remains pending. No composition-brief abstraction, control-plane scope, or coordinator runtime-code repair was added.

## [2026-11-08] acceptance and discussion | Optional principles and closed-document refinement

The owner deemed the fidelity preview acceptable, with refinements remaining. The left-chat description had incorrectly required a permanent empty workspace; clarified two modes: full-screen chat when no document is open, chat left/reader right when one is open. This is a local specification correction, not a new failed transfer. The capped, centered header against a full-width layout remains an open design refinement.

Captured [pluggable project principles](pluggable-principles.md): recommended guidance can be selected, customized, removed, or skipped entirely. No control-plane implementation or mandatory process was added. Completed the concrete [chat-mode refinement](../../adaptations/markdown-reader/integration/chat-mode-refinement.md), not a header redesign. Check/test/build and the extended isolated browser regression pass, including desktop/narrow close/reopen, retained composer/draft, and saved split width. The first extended browser test needed a hidden-separator locator correction; both attempt logs were retained locally.

## [2026-11-08] refinement | Header target and experiment cleanup

Fixed the header locally in `ed4cb9d` (baseline `1d10cf8`): split-mode navigation follows the full workspace width with balanced gutters; solo chat retains the constrained header and centered brand. Full check/test/build and isolated browser regressions pass, including header geometry at 390, 900, 1440, and 1920px, plus chat/document transitions. Browser APIs/chat remain mocked; fresh screenshots/logs are local rather than another large checked-in artifact set. This can be the target for a later [principle-guided experiment](pluggable-principles.md); that trial has not run and no control-plane implementation was added.

Filed [portability issue #4](https://github.com/mcskinner/self-growing/issues/4). Corrected stale acceptance wording by amending the previous commit and pushing with an explicit lease. Removed five disposable trial branches/worktrees without publishing them; their useful patches/results remain in trunk. Removed inactive worktrees for remotely preserved variants/references, retaining the one older detached Markdown prototype whose commit is not on GitHub. No active session files were changed.

## [2026-11-08] discussion | Sharing software without local installation

Captured the owner's [sharing and deployment](sharing-and-deployment.md) work track: immutable/read-only hosted demos, publishing with builder chat removed, fork-to-grow, contributor versus viewer access, and persistence/workflows. Kept these deployment forms distinct and optional, noted that containers or hidden UI alone do not enforce execution boundaries, and linked to the existing agency/capability-exchange questions. Wiki synthesis only; no infrastructure, roadmap issues, or application changes.

## [2026-11-08] lint | Current-state synthesis and evidence retention

Read all 16 wiki Markdown pages, including the index, conventions, log, and sources; checked local links/index coverage and reviewed status claims against the experiment/application records and subsequent owner feedback. Mechanical lint passed. Corrected stale statements that guidance remained untested and that no evidence justified revising left-chat; distinguished fresh combined application from controlled instruction-effect comparisons. Updated acceptance evidence with the later visual rejection, fresh fidelity retry, and explicit owner acceptance. Removed an obsolete publication caveat from the discussion summary, connected later proposals, and captured selective evidence retention without adding another concept page.

Preserved the original journal and historical log entries, including statuses that were true at the time. Kept open questions about granularity, dependencies, privacy, governance, and deployment unresolved. The principle-guided header experiment has not run; its final reviewed target must still be pinned after the current border/header refinement. External URL reachability, browser anchor targets, and provider/native-dialog behavior were not validated by this wiki pass.

## [2026-11-08] correction | Remove the separate source archive

Reviewed the original wiki discussion after the owner questioned the two source documents. The agreed approach was linked synthesis of the project and its discussions, with an index, chronological log, and linting—not a copied source archive. The initial filing incorrectly expanded a request to re-read the journal into preserving it and creating a separate discussion summary.

Removed both source documents after reviewing their content against the concept pages. Retained the useful synthesis and user/assistant attribution in those pages, linked to existing project evidence where appropriate, and clarified the conventions against duplicating journals or transcripts. Historical log entries still describe what happened at the time; their obsolete source links are now plain text. The original material remains in Git history and the existing chat transcripts; no Pi session files were changed.

## [2026-11-08] discussion | Quote-to-chat scope and source-location tradeoffs

Captured [document-to-chat interaction](document-to-chat.md): the owner's preference for quoting into a draft rather than collecting comments for review, the distinction between useful workflow adaptations and shared selection mechanics, and the choice to develop/review this feature before extracting an adaptation. The implementation started before a frozen protocol; it is not retroactively a prospective experiment.

Recorded renderer investigation: existing `marked` has raw tokens but no source positions; `markdown-it` supplies block line ranges; `remark` supplies positioned block/inline nodes. An isolated probe explored representative Markdown, but no library automatically solves arbitrary rendered-selection-to-source mapping. The owner chose to retain the current implementation and path-plus-quote attribution. No renderer migration or richer locator was implemented; this filing changes wiki documentation only.

## [2026-11-08] transfer | Extract quote-to-chat after feature review

Committed the reviewed docs drawer/quoting feature as `e97bfc6` and wiki cleanup as `b67d7b9`, then planned [quote-to-chat extraction and transfer](../../experiments/quote-to-chat-transfer/protocol.md) before those new steps. A fresh distiller separated quoting from the mixed navigation/access-policy reference; its initial description was frozen unedited. A fresh applier on the pre-feature reader passed functional checks but chose a permanent toolbar, missing the nearby-highlight experience.

Preserved that attempt, added one placement sentence, and tested a fresh same-base application. It reached the intended selection-relative UI but independent checks caught label overflow and composer-end-caret/focus bugs despite passing automated evaluation. A separately prompted repair passed the full independent mocked Chromium suite at 1440px/390px; the final verifier still fails both original applications. [Application records](../../adaptations/quote-to-chat/README.md) preserve patches, frozen descriptions, feedback, verifier refinements, and evaluation outcomes. Raw sessions/screenshots remain local.

No trial runtime code was integrated into the workshop; the owner-reviewed feature remains unchanged. This is limited repaired-transfer evidence with reference code allowed, not first-try sufficiency, broad portability, live-provider/native-dialog acceptance, or a comparison proving implementation-first versus adaptation-first development. No further experiment is automatically scheduled.

## [2026-11-08] replication | Uncoached quote transfer repeats a visual integration failure

At the owner's request, committed a prospective amendment before another fresh application from the original reader baseline. Kept the revised description, original reference, skill/tooling, configured model, and independent verifier unchanged. Supplied no repair code, prior outcomes, or debugging feedback. [Replication `47c4860`](../../adaptations/quote-to-chat/applications/reader-03/coordinator-review.md) passed automated evaluation and every functional browser scenario at 1440px/390px, including draft isolation, no implicit send, and settled composer-end-caret placement.

Overall acceptance failed: the nearby action again inherited small global button dimensions and its label overflowed at both widths. The unchanged verifier caught this, and screenshot/code review confirmed it. Preserved the first result without repair or further description edits; the running feature remains unchanged. The earlier repaired pass is not evidence of reliable uncoached transfer. A recurring target integration bug warrants scrutiny of rendered-control verification, but does not automatically justify source-specific CSS instructions or another run.

## [2026-11-08] bounded hardening | Verify rendered labels and settled editing state

The owner authorized up to three additional fresh applications. Planned and froze each intervention before invocation, keeping original reader baseline/reference, configured model, skill/tooling, and held-out acceptance assertions. Added a portable actual-label-fit assertion rather than a CSS fix: [reader-04](../../adaptations/quote-to-chat/applications/reader-04/coordinator-review.md) passed full independent desktop/narrow acceptance. Its identical-input [reader-05 replication](../../adaptations/quote-to-chat/applications/reader-05/coordinator-review.md) had readable text but failed the settled end-caret check; its own test had checked focus, not caret/continued typing. A different valid action caption required a separately preserved three-regex verifier locator translation, with no assertion or application changes.

For the third/final run, added a portable post-render collapsed-end-caret and continued-typing requirement, not a React fix. [Reader-06](../../adaptations/quote-to-chat/applications/reader-06/coordinator-review.md) passed full unchanged independent acceptance and its own typing checks. The batch therefore produced pass, caret failure, pass on successive guidance revisions—not two replicated passes of the latest description. This supports a verification-gap hypothesis without proving necessity or broad sufficiency. All three new application sessions are used; stop without another automatic trial or repair. No runtime trial code was integrated into the running app; saved chats and deferred locator scope are unchanged.
