# Adaptation-led development and migration ledgers

Status: exploratory user proposal during the Markdown-reader experiment; not an adopted development requirement or implemented migration system.

## More than exchanging finished features

The current [adaptation lab](adaptations-and-capability-exchange.md) distills transformations from an initial implementation. An alternative is to write an adaptation first, then apply it as the normal—or only—path for adding features. This makes adaptations a development practice, not merely a way to publish reusable work afterward.

Even if a project chooses to require this workflow internally, adopting it is a separate choice. [Pluggable principles](pluggable-principles.md) should let other users skip the recommended process entirely rather than imposing it through the starter.

An adaptation need not be public. A private record can still explain the intended change, its requirements, how it was applied, and what actually happened. An agent could use that history to reason about the software's capabilities and why they exist, rather than inferring everything from the current code.

## Migration analogy

Database migrations suggest named, ordered transformations and a ledger of applications. Adaptations might similarly offer apply/unapply behavior and record what is currently present, superseded, or removed.

But contextual agent transformations are not necessarily deterministic or safely reversible. A Git revert undoes a patch, not necessarily the capability's accumulated data, effects, or later integrations. Unapply might require a new compensating adaptation, explicit data-retention decisions, and checks for dependent capabilities. This is an open design problem, not a reason to promise automatic rollback.

## Requirements and dependencies

Markdown commenting requires some ability to read and identify document passages. A capability ledger could make that relationship explicit, helping an agent notice missing prerequisites or dangerous removals.

That does not yet imply one global adaptation ID, one implementation, or a package-manager dependency solver. Another reader might satisfy the same requirement. An adaptation's attempted application also does not prove the capability is present: results, repairs, removals, and out-of-band code changes can cause the ledger to diverge from reality.

## Questions

- Would requiring every feature change to go through an adaptation improve reasoning enough to justify the friction? What about fixes and experiments?
- Can a description written before implementation stay minimal while expressing useful acceptance criteria?
- Should the ledger track adaptation applications, capabilities, or both? How is it reconciled with actual code and observed behavior?
- How should dependencies differ from common combinations or preferences?
- What can safely be unapplied, and what needs a deliberate replacement or compensation?

Related: [minimal core and workshop](minimal-core-and-workshop.md), [hardening](minimal-instructions-and-hardening.md), and [control of agency](control-plane-and-agency.md). Origin: the user's proposal during the Markdown-reader experiment.
