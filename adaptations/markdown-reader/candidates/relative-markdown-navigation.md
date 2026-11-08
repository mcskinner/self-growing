# Candidate: relative Markdown navigation

Status: proposed after first applications and now included in the revised description for the fidelity retry. It remains absent from the frozen first description. A fresh application of the combined revised descriptions (3177e64) now passes relative-link browser checks; the isolated effect of this sentence was not tested, and the owner subsequently accepted the combined preview with refinements.

## Suggested instruction addition

Follow relative `.md`/`.markdown` links inside the reader, resolving them from the current original document's location while preserving chat and read-only/sanitization boundaries.

## Why

The prospective protocol included relative-link navigation as an acceptance check, but the extractor found no such capability in the reference implementation and left it out of the description. Both first appliers explicitly disabled relative links. The independent workshop browser check reproduced the gap.

This exposes a mismatch between the coordinator's desired acceptance and the distilled source capability—not proof that the appliers failed their supplied description. A source-only distillation cannot establish every new target requirement. Decide which intended outcomes need to be supplied explicitly before blaming implementation or adding a long recipe.

## Evidence and validation

See ../applications/trunk-01/coordinator-review.md and ../verification-recipe.md. A separate prompted repair passed automated checks and all eight isolated-browser scenario groups; see ../applications/trunk-repair-01/coordinator-review.md. That repair demonstrated feasibility, not instruction sufficiency. The later fresh combined revision supplies additional functional transfer evidence as noted above, not a causal comparison of this sentence alone or owner approval.
