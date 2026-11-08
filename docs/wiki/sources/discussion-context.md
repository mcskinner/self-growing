# Source context: subsequent project discussions

This is an agent-written summary of the conversation following the [journal](self-growing-journal.md), not a verbatim transcript. It records provenance and distinctions, not new decisions. Initial wiki filing: 2026-11-08; the journal's original composition dates are unknown.

## User proposals and preferences

- The exchangeable artifact should combine an explained transformation with application history, including code diffs.
- The first heavily grown offshoot may be the tool that builds the kit. GitHub issue integration and a protocol lab are examples of desired workshop capabilities, not a commitment to implement all of them now.
- One repository is preferable while the variants are intimately related. Long-lived branches can be structural, not merely future merges. Exchanging capabilities may become the important operation.
- After considering `seed`, `start`, and `starter`, the branch split adopted `trunk` for the workshop and `starter` for the minimal kit. `starter-kit` was renamed.
- The first adaptation exploration should include extraction from an implementation/conversation with a diff; application feedback covering outcome, lessons, gaps, and diffs; starter-based evaluation; and a prospective `protocol.md` for this and future experiments.
- Adaptation instructions should stay minimal. Extra source-specific detail may weaken generalization; iteration and hardening can sit above testing.
- When an application needs extensive manual fixing, local prompt iteration could distill a suggested improvement. The user prefers actual diffs and reviewer-side diagnosis when privacy allows; locally distilled candidates offer an alternative. A submit/test/return-feedback loop was proposed.
- The knowledge map should not automatically become formal design or GitHub roadmap items. The user prefers a top-level `docs/` with types inside it and argued for an explicit chronological log alongside Git history.

## Later proposal: adaptation-led development

During the Markdown-reader experiment, the user proposed treating adaptations like database migrations, potentially with apply/unapply behavior. Feature development could be required to start with an adaptation rather than direct coding. Records need not be public: a private history could help agents reason about current capabilities and requirements/dependencies, such as commenting needing reading. This is a loose idea to explore, not an adopted workflow mandate. See [adaptation-led development](../adaptation-led-development.md).

## Later proposal: portable acceptance evidence

The user also proposed making verification part of adaptation: for example, screenshots showing the menu bar and open/working chat, or a Playwright script exercising prescribed steps. They noted that exhaustive verification can become hairy but saw value in directional improvements. See [acceptance and verification](../acceptance-and-verification.md). This was captured while the first blind runs were in flight, without changing their frozen inputs.

## Assistant interpretations, not settled architecture

Packages, seeds, and adaptations were distinguished by stable interface, starting material, and contextual transformation respectively. The assistant suggested keeping voluntary reviewed contributions separate from automatic reporting, and separating candidate improvements from evidence and acceptance decisions. These are useful proposals, not an implemented sharing policy.

The assistant initially recommended two repositories and later a simple notes collection without a log. The discussion revised both suggestions: one repository with structural branches, then a linked working wiki under `docs/wiki/` with both index and log. Earlier assistant suggestions are not authoritative just because they occurred first.

## Implemented experiment and evidence

The adaptation scaffold was committed as [3414970](https://github.com/mcskinner/self-growing/commit/3414970); the link resolves remotely only once that commit is pushed. It includes a minimal skill, a file-based CLI, left-chat reference evidence, an application record, evaluation logs, and a protocol. See the [lab guide](../../../adaptations/README.md) and [smoke-trial feedback](../../../adaptations/left-chat/applications/starter-smoke-01/feedback.md).

The smoke trial was performed by the same agent that built the framework, with prior source knowledge. Automated checks passed after environment normalization; browser and live-chat acceptance were not tested. At the initial wiki filing, no independent transfer, federated submission system, shared registry, or automated prompt-hardening loop had been demonstrated.

Subsequently, the [Markdown-reader experiment](../../../adaptations/markdown-reader/README.md) recorded fresh distillation and independent starter/workshop applications using the existing skill and machinery unchanged. Both passed automated evaluation; coordinator browser checks found a relative-link gap and verified a separate prompted repair with mocked APIs/chat. The reader and repair were then integrated into trunk. This does not establish live-provider acceptance, automatic hardening, or a federated service.

## External influence

Karpathy's [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) supplied the pattern of persistent synthesis, cross-linked pages, an index, a chronological log, and periodic linting. The wiki adapts that pattern to evidence already present in the project and its discussions rather than requiring a separate raw-source ingestion architecture.
