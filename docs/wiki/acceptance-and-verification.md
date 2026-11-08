# Acceptance and verification

Status: exploratory direction; current tooling runs commands but does not provide a portable behavioral verification contract.

## Evidence should travel with intent

An adaptation could specify not only the desired outcome but the steps and evidence needed to demonstrate it. The user's example is a chat-pane adaptation: show the menu bar, show chat open, and demonstrate that chat still works. A prescribed Playwright scenario could be stronger evidence than an applier's general assurance.

Different claims need different evidence. A screenshot can show layout at a particular viewport; it cannot alone establish sending, streaming, steering, or stopping. A browser test against a fake chat backend can prove UI behavior under that simulation, not a live provider interaction. Code inspection, unit tests, component tests, real-browser tests, live end-to-end checks, and owner judgment answer different questions.

## Directional approach

Keep a few observable acceptance scenarios with an adaptation. For each, record what was checked, how, against which implementation, and the result or reason it was not checked. Reference scripts and screenshots can be optional evidence rather than mandatory infrastructure for every transformation.

For a reader/chat combination, examples include opening a document, reading it beside usable chat, exercising menu controls, sending and receiving a message, and checking a narrow viewport. Some steps can use deterministic fixtures; costly or live checks should be labeled and explicitly authorized. An applier may need to translate selectors or setup for the target rather than copy a source-specific script unchanged.

## Tensions

- Prescriptive UI scripts can overfit the source layout and undermine [minimal instructions](minimal-instructions-and-hardening.md).
- Appliers writing their own tests can reproduce their own mistaken interpretation. Independent acceptance checks should retain the original intent.
- Screenshots may expose private documents or conversation text; review before sharing.
- A passing script covers its assertions, not every interaction or subjective aspect of the experience.
- Test tooling and live-provider setup can cost more than the adaptation itself. Start with high-value scenarios rather than an exhaustive verification platform.

## Current evidence

The [lab](../../adaptations/README.md) distinguishes automated checks from behavioral acceptance. During the Markdown-reader blind runs, the workshop applier added backend and jsdom checks; its feedback explicitly leaves real layout, native dialogs, and live chat unverified. The starter applier attempted Playwright verification. These are observations of the attempts, not a conclusion that their behavior has been independently proven. See the [prospective protocol](../../experiments/markdown-reader/protocol.md) for planned evaluation and later results.

Related: [adaptation-led development](adaptation-led-development.md), [capability exchange](adaptations-and-capability-exchange.md), and [control of agency](control-plane-and-agency.md). Source: the user's testing/verification proposal during this experiment; [discussion context](sources/discussion-context.md).
