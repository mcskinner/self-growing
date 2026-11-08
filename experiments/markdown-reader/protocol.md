# Experiment: distill and transfer a Markdown reader

Status: prospective plan; commit before distillation. Initial tooling and skill: 233ef73.

## Question and hypothesis
Can the existing skill and file-based machinery distill a useful Markdown-reader adaptation from the mixed Markdown/comments implementation, then transfer it to starter and the diverged workshop without importing comments?

Hypothesis: minimal intent and boundaries plus the existing reference evidence are sufficient for an uncoached recipient to implement the reader. Do not improve the tooling or skill in anticipation of problems.

## Scope and exclusions
Distill the Markdown reader, not the anchored comment layer. Let distillation/application establish which layout choices are necessary; do not preinstall left chat or prescribe pane sizes. The intended outcome is comfortable local Markdown reading and navigation inside the app with working chat. No wiki-specific feature implementation, provider changes, private transcript copying, or automatic publication.

## Starting conditions
- Source: markdown-comments at 898db55839fad721fd9d5d6158e8c93440ac6323.
- Reference base: shared ancestor a18a41f76aa45d8a17cbcccea680f3e16a49fd3f; capture reader-related backend/frontend/tests, including mixed comment evidence.
- First target: starter at 6116d82c7bcb1ed49af5b9a1b0edd41c045ad4e8.
- Second target: workshop baseline 233ef7356949902b318c561f809503e5198da9a6 (before this experiment's documentation).
- Existing skill: .pi/skills/adapt/SKILL.md. Existing capture/prepare/record/evaluate CLI used unchanged.
- Fresh Pi CLI sessions use existing login and the configured model, with their own session directories. Never resume/copy the running chat.

## Procedure
1. Commit this protocol alone. Capture source evidence with the existing script.
2. In a fresh Pi session at a source checkout, ask the existing skill to distill the Markdown reader into the generated files. Supply the desired capability and exclusion of comments, not implementation advice. Save prompt, invocation, output, and resulting description.
3. Freeze the distillation before applications. Prepare separate target worktrees and input snapshots using the existing script.
4. Run a fresh Pi applier in each target with only its generated apply brief and the existing skill (plus normal project context). No surrounding chat, prior application results, coaching, preemptive target changes, or tooling fixes. Normal autonomous debugging within this first invocation is allowed; record it when observable.
5. Record each first application's commit/diff and feedback, then evaluate using the existing CLI. Provision ordinary dependencies as documented, without changing target code. Preserve the first state even if the run or recorder fails; an external Git diff is fallback evidence, not a silent tool fix.
6. Review actual behavior where feasible, including opening a repository Markdown file, relative-link navigation, readable rendering, narrow-screen behavior, chat availability, and safe handling of missing/unsupported paths and document HTML. Automated checks alone do not establish acceptance. Label every omitted check.
7. After preserving initial results, repair if necessary. Keep intervention prompts, before/after diffs, effort, and gaps separate. Classify fixes as tooling, description, or application changes. A repaired application is not proof of improved instructions; test any revised description in a new attempt.
8. Only integrate an evaluated application into the running workshop deliberately; preserve workshop wiki/lab features. No unrelated branch merge.

## Success and failure criteria
Assess distillation and application separately. Did extraction capture reader intent and exclude comments without overprescribing implementation? Did each application work without coordinator coaching? What autonomous debugging or manual repair was required?

Baseline automated checks: make check, make test, make build. Behavioral acceptance needs observed evidence; report partial results honestly. Failure includes imported comments, broken chat, unsafe document handling, tooling blockers, or acceptance requiring unrecorded intervention. Preserve negative results rather than retroactively improving the first attempt.

## Evidence and privacy
Adaptation under adaptations/markdown-reader/. Raw run prompts, outputs, isolated Pi sessions, and application records under .local/adaptation-runs/markdown-reader-*/. Publish only reviewed artifacts; never credentials or private saved chats. Patches and hashes are durable evidence; commit links are not guaranteed to resolve until pushed. This is qualitative exploration, not a statistical comparison.

## Results
Pending. Append findings and deviations; do not rewrite the prospective procedure to fit outcomes.

## Lessons and next experiment
Pending. Likely follow-up questions include reader/comment granularity, common combinations, independent acceptance coverage, and whether any evidenced failure warrants hardening.
