# Federated hardening

Status: proposed in discussion; not implemented or experimentally validated.

## Idea

When an application fails—or needs substantial local repair before its owner is satisfied—the recipient can iterate on the adaptation prompt locally and distill a suggested improvement. Sharing that candidate may be preferable to sending the implementation, transcript, or every debugging detail.

Where privacy permits, the user prefers access to the actual diff so the receiving reviewer can perform its own diagnosis. Local distillation is an additional path, not a replacement for stronger evidence. See the [discussion context](sources/discussion-context.md).

## Possible exchange

1. Attempt and repair locally.
2. Distill a minimal proposed instruction change and the problem it addresses.
3. Submit it as a candidate, not an authoritative update.
4. Evaluate against existing cases, including cases that previously worked.
5. If it fails, return that feedback for another local iteration.

This closes a loop around [minimal-instruction hardening](minimal-instructions-and-hardening.md): the recipient contributes a proposed improvement, not just a failure report. “Federated” here means locally derived contributions; it does not imply federated model training or a chosen distributed-system architecture.

## Tensions and unknowns

- Distillation itself can leak private information; it still needs review.
- Without the implementation, reviewers have less evidence to verify the diagnosis or reproduce the failure.
- A locally helpful rule can overfit or regress other applications.
- A candidate or returned feedback could contain unsafe instructions; neither should be trusted merely because it participates in the protocol.
- What minimal non-private evidence would make a candidate useful? Who maintains the existing test cases, and how representative are they?

The proposed submit/test/return service does not exist. Related: [collective learning](collective-learning.md), [capability exchange](adaptations-and-capability-exchange.md), and [control of agency](control-plane-and-agency.md).
