# Minimal instructions and hardening

Status: working principle; fresh-context applications of revised guidance recorded, but controlled comparisons isolating instruction changes not yet performed.

## Smallest sufficient description

The user's guiding advice is to seek the smallest instruction set that can deliver the outcome. Extra details often encode the known implementation and may not generalize. Keep intent, necessary boundaries, and observable success in the core; keep implementation-specific rationale and diffs available as evidence.

This is not a claim that shorter is always better. The question is whether an instruction earns its place by improving transfers. The [adapt skill](../../.pi/skills/adapt/SKILL.md) embodies this working principle; the [discussion summary](sources/discussion-context.md) records its origin.

## A loop above testing

Attempt → record difficulty and repairs → diagnose → propose the smallest description change → retry on fresh targets.

A technically successful execution may still be a poor transfer if the applier needed extensive manual repair to be happy. Useful feedback includes that burden, not only command exit codes. Tests evaluate an application; hardening revises the guidance that produced it. Preserve failures and earlier descriptions so the revision can be evaluated rather than assumed better.

A candidate improvement should be checked against earlier application cases as well as the motivating failure. Independent agents and diverged targets can expose assumptions hidden by an author's familiarity. These are proposed evaluation practices, not an existing automated regression service.

## Current evidence and limits

The [first protocol](../../experiments/adaptation-loop/protocol.md) separates deterministic checks from behavioral evidence. Its smoke trial exposed inherited launcher ports affecting a test; this justified a runner change, not more layout instructions. That initial smoke trial did not justify expanding the left-chat description; later owner feedback did reveal missing layout expectations.

The [Markdown-reader trial](../../adaptations/markdown-reader/README.md) subsequently exposed a different gap: the source and distilled description lacked relative-link navigation required by the coordinator's acceptance. A prompted application repair passed, and a one-sentence candidate addition was recorded separately. That repair alone was evidence for clarifying the desired outcome, not proof of fresh transfer improvement. A later [fidelity retry](../../experiments/markdown-reader-fidelity/protocol.md) applied revised reader and left-chat guidance together from the historical workshop base, including relative-link navigation, and reached owner acceptance with refinements. This does not isolate which instruction mattered. Original descriptions remain in Git and frozen application snapshots; current descriptions include the evidenced revisions.

## Questions

How should repair effort be recorded without cumbersome bookkeeping? Can instructions be removed as confidently as added? How do we distinguish a weak description from an implementation mistake or an unsuitable target?

[Federated hardening](federated-hardening.md) asks how some of this diagnosis and distillation could happen privately at the recipient. [Acceptance and verification](acceptance-and-verification.md) explores carrying scenarios and evidence requirements with an adaptation, without turning every description into a source-specific UI script.
