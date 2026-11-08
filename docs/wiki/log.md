# Wiki log

Chronological record of meaningful synthesis and maintenance events. Append new entries; Git preserves exact page edits. Dates here describe wiki work, not necessarily when an idea was first conceived.

## [2026-11-08] synthesis | Initial map from the full journal and project discussion

Preserved the [full journal](sources/self-growing-journal.md) and recorded [subsequent discussion context](sources/discussion-context.md), distinguishing user preferences, assistant interpretations, and implemented evidence. Created the [concept map](index.md): embedded self-modification, minimal core/workshop, capability exchange, minimal-instruction hardening, federated hardening, collective learning, and control of agency.

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
