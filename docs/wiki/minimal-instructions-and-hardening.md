# Minimal instructions and hardening

Status: working principle; initial independent applications recorded, but comparative instruction-hardening trials not yet performed.

## Smallest sufficient description

The user's guiding advice is to seek the smallest instruction set that can deliver the outcome. Extra details often encode the known implementation and may not generalize. Keep intent, necessary boundaries, and observable success in the core; keep implementation-specific rationale and diffs available as evidence.

This is not a claim that shorter is always better. The question is whether an instruction earns its place by improving transfers. The [adapt skill](../../.pi/skills/adapt/SKILL.md) embodies this working principle; the [discussion summary](sources/discussion-context.md) records its origin.

## A loop above testing

Attempt → record difficulty and repairs → diagnose → propose the smallest description change → retry on fresh targets.

A technically successful execution may still be a poor transfer if the applier needed extensive manual repair to be happy. Useful feedback includes that burden, not only command exit codes. Tests evaluate an application; hardening revises the guidance that produced it. Preserve failures and earlier descriptions so the revision can be evaluated rather than assumed better.

A candidate improvement should be checked against earlier application cases as well as the motivating failure. Independent agents and diverged targets can expose assumptions hidden by an author's familiarity. These are proposed evaluation practices, not an existing automated regression service.

## Current evidence and limits

The [first protocol](../../experiments/adaptation-loop/protocol.md) separates deterministic checks from behavioral evidence. Its smoke trial exposed inherited launcher ports affecting a test; this justified a runner change, not more layout instructions. No transfer failure yet justifies expanding the left-chat description.

The [Markdown-reader trial](../../adaptations/markdown-reader/README.md) subsequently exposed a different gap: the source and distilled description lacked relative-link navigation required by the coordinator's acceptance. A prompted application repair passed, and a one-sentence candidate addition was recorded separately. This is evidence for clarifying the desired outcome, not proof that the candidate improves fresh transfers. The initial description remains frozen.

## Questions

How should repair effort be recorded without cumbersome bookkeeping? Can instructions be removed as confidently as added? How do we distinguish a weak description from an implementation mistake or an unsuitable target?

[Federated hardening](federated-hardening.md) asks how some of this diagnosis and distillation could happen privately at the recipient. [Acceptance and verification](acceptance-and-verification.md) explores carrying scenarios and evidence requirements with an adaptation, without turning every description into a source-specific UI script.
