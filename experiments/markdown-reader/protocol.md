# Experiment: distill and transfer a Markdown reader

Status: initial blind runs and a separate prompted repair complete; plan committed before distillation as d3e3480. Initial tooling and skill: 233ef73.

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
The distiller completed in a fresh Pi session (openai-codex/gpt-6.1-sol) with no source, skill, or tooling changes. Its output was frozen as 540b2c2 before either application. See `adaptations/markdown-reader/extraction-run.md`.

Both blind applications completed without coordinator coaching. Starter: ca789b4; workshop: 2db3e08. The existing recorder/evaluator passed on both, unchanged. Their frozen description hashes match. Original prompts, inputs, diffs, feedback, and evaluation logs are preserved under `adaptations/markdown-reader/applications/`.

The starter applier also ran an isolated production-build Playwright smoke test with intercepted/mocked API/SSE; the workshop applier used backend and jsdom tests. Independently, the coordinator's isolated Chromium checks passed 7/8 workshop scenario groups and failed relative Markdown-link navigation. That capability was in the protocol's intended acceptance, but absent from the source and explicitly excluded by the distillation's interpretation of navigation. The first implementations were not silently repaired.

A separate fresh repair session was given that observed failure and produced 1151066. Existing evaluation and all 8 coordinator browser scenario groups then passed. The same refined browser check failed on the original application and passed on the repair. No actual provider call or native chooser interaction was tested. User proposals about verification recipes and adaptation-led development were captured in the wiki without changing the first attempts.

The evaluated workshop application and repair were integrated as 4e7951d and 6cc23d9. A wiki-log append conflict was resolved by retaining both entries; no manual runtime-code correction. Test-only dependencies were installed in the running checkout. No extra app server was started. Final workshop check/test/build passed (57 Python tests, 23 frontend tests); the integrated production build also passed all 8 isolated browser scenario groups. These remain mocked UI checks, not a live-app or provider run.

Deviations/limits: no historical transcript was supplied, so extraction used requested intent and implementation evidence. Additional independent browser tests and a verification recipe were written after first attempts, not smuggled into their frozen inputs. A minimal instruction addition is only a candidate, not a validated new description: no fresh application of it has run. Live-provider/native-dialog acceptance and exhaustive visual/accessibility coverage remain pending.

## Lessons and next experiment
The machinery worked as-is; no script or skill hardening was justified by these runs. Its default automated evaluator is not behavioral acceptance. Relative-link navigation illustrates a mismatch between desired target outcomes and source-only distillation, not necessarily a failure to implement supplied instructions. A prompted repair succeeding does not establish improved prompt transfer.

Next useful trial: apply the minimal navigation candidate and portable verification recipe on a fresh target without sharing the repaired code or this discussion. Keep testing granularity (reader versus comments/layout), source-specific requirements that do not apply to starter, local repair burden, and the cost/reproducibility of browser evidence. Archived ad hoc Playwright scripts still require dependency/path setup; no automatic verification platform was added.
