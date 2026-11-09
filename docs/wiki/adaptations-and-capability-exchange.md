# Adaptations and capability exchange

Status: file-based exploration implemented; first reader transfers, a prompted repair, and a fresh reference-fidelity application recorded. The owner accepted the latter with local refinements; broad generalization is not established.

## The exchangeable unit

An adaptation is an explained transformation plus a history of applications, including code diffs. The description expresses what should become possible; each application shows how it was achieved in a particular recipient and what was learned.

A package reuses an implementation behind an interface. A starter or seed supplies initial material. An adaptation can reshape boundaries—layout, state, interaction conventions—without requiring every recipient to expose the same plugin API. These forms can coexist: successful recurring adaptations might eventually reveal good package boundaries.

This is one possible interpretation of the author's “component library for the agentic age”: examples and intent that an agent can integrate contextually, rather than only components installed unchanged. The package/seed/adaptation distinction is an assistant interpretation of that exploration, not a settled architecture.

## Branches as structure

Branches and forks can represent different forms of software, not merely work waiting to merge. The goal is to exchange useful capabilities without preserving universal mergeability. A Git merge or cherry-pick may still be the best implementation in a particular case; contextual reimplementation is another.

The biological analogy is horizontal gene transfer, not a literal architectural requirement. Git tracks code ancestry; learning from another implementation can create an additional lineage of ideas that Git ancestry alone does not capture.

## Current evidence

The [lab](../../adaptations/README.md) captures source diffs, snapshots application inputs, prepares target worktrees, records application patches and commit links, and runs automated checks. The first example is [left chat](../../adaptations/left-chat/adaptation.md).

Its [starter smoke trial](../../adaptations/left-chat/applications/starter-smoke-01/feedback.md) passed check/test/build but did not test visual or live-chat acceptance. The same agent authored the framework and performed the transfer with source knowledge. It demonstrates mechanics, not generalization or instruction sufficiency.

A later [Markdown-reader experiment](../../adaptations/markdown-reader/README.md) used fresh distiller/applier sessions on starter and workshop targets with the skill/tooling unchanged. Both passed baseline evaluation; independent workshop browser checks found missing relative-link navigation, which a separate prompted repair fixed. The browser fixture mocks APIs/chat, so this is not live-provider or native-dialog evidence. The first integration then failed owner visual acceptance despite passing functional checks. Revised reader and left-chat descriptions were applied together from the historical workshop base in a [fresh fidelity trial](../../experiments/markdown-reader-fidelity/protocol.md). That preview passed preliminary reference/behavior checks and was accepted by the owner with local refinements. This supplies fresh-context transfer evidence, not a controlled comparison isolating one instruction change.

## Questions

What reference evidence is enough? How do we identify related adaptations or incompatible requirements? When does a recurring transformation deserve a stable package? How can useful knowledge survive increasing divergence?

Granularity remains open: a useful outcome may transfer independently, while a familiar combination needs its own integration acceptance. Co-occurrence across apps might suggest combinations but does not establish a dependency. A whole-workshop adaptation could describe an outcome without requiring reproduction of every incidental detail of one branch snapshot.

A further proposal is [adaptation-led development](adaptation-led-development.md): use private or shared adaptations as the normal feature-development path, with a ledger and possible apply/unapply operations. This extends beyond distilling already-built features and is not yet an adopted requirement.

Related: [hardening](minimal-instructions-and-hardening.md), [federated hardening](federated-hardening.md), [collective learning](collective-learning.md).
