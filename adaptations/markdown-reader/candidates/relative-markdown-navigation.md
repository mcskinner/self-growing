# Candidate: relative Markdown navigation

Status: proposed after first applications and now included in the revised description for the fidelity retry. It remains absent from the frozen first description and not yet validated by a fresh application.

## Suggested instruction addition

Follow relative `.md`/`.markdown` links inside the reader, resolving them from the current original document's location while preserving chat and read-only/sanitization boundaries.

## Why

The prospective protocol included relative-link navigation as an acceptance check, but the extractor found no such capability in the reference implementation and left it out of the description. Both first appliers explicitly disabled relative links. The independent workshop browser check reproduced the gap.

This exposes a mismatch between the coordinator's desired acceptance and the distilled source capability—not proof that the appliers failed their supplied description. A source-only distillation cannot establish every new target requirement. Decide which intended outcomes need to be supplied explicitly before blaming implementation or adding a long recipe.

## Evidence and validation

See ../applications/trunk-01/coordinator-review.md and ../verification-recipe.md. A separate prompted repair passed automated checks and all eight isolated-browser scenario groups; see ../applications/trunk-repair-01/coordinator-review.md. This demonstrates feasibility, not instruction sufficiency; test this candidate on a fresh target before treating it as hardened guidance.
