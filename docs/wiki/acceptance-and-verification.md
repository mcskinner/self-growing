# Acceptance and verification

Status: exploratory direction; current tooling runs commands but does not provide a portable behavioral verification contract.

## Evidence should travel with intent

An adaptation could specify not only the desired outcome but the steps and evidence needed to demonstrate it. The user's example is a chat-pane adaptation: show the menu bar, show chat open, and demonstrate that chat still works. A prescribed Playwright scenario could be stronger evidence than an applier's general assurance.

Different claims need different evidence. A screenshot can show layout at a particular viewport; it cannot alone establish sending, streaming, steering, or stopping. A browser test against a fake chat backend can prove UI behavior under that simulation, not a live provider interaction. Code inspection, unit tests, component tests, real-browser tests, live end-to-end checks, and owner judgment answer different questions.

## Directional approach

Keep a few observable acceptance scenarios with an adaptation. For each, record what was checked, how, against which implementation, and the result or reason it was not checked. Reference scripts and screenshots can be optional evidence rather than mandatory infrastructure for every transformation.

For a reader/chat combination, examples include opening a document, reading it beside usable chat, exercising menu controls, sending and receiving a message, and checking a narrow viewport. Some steps can use deterministic fixtures; costly or live checks should be labeled and explicitly authorized. An applier may need to translate selectors or setup for the target rather than copy a source-specific script unchanged.

The user refined this toward a **recipe for writing a Playwright test**, rather than screenshots as primary proof. A recipe can prescribe actions, observable assertions, fixtures, and assumptions while letting the recipient choose target-specific selectors and setup. Screenshots are supporting/debugging artifacts, not a substitute for behavioral assertions. The recipe still needs to distinguish mocked chat from a live interaction.

## Tensions

- Prescriptive UI scripts can overfit the source layout and undermine [minimal instructions](minimal-instructions-and-hardening.md).
- Appliers writing their own tests can reproduce their own mistaken interpretation. Independent acceptance checks should retain the original intent.
- Screenshots may expose private documents or conversation text; review before sharing.
- A passing script covers its assertions, not every interaction or subjective aspect of the experience.
- Test tooling and live-provider setup can cost more than the adaptation itself. Start with high-value scenarios rather than an exhaustive verification platform.

## Retaining useful evidence

Routine test runs need not become permanent remote branches or complete artifact bundles. Prefer a brief outcome, input/version identifiers, and lessons; retain relevant patches or reproduction evidence for interesting failures, implementation commits for accepted changes, and full Git snapshots only when deliberately valuable. Hashes alone do not preserve unavailable commits. The disposable trial branches/worktrees were removed without publishing them; selected patches and results remain in trunk.

## Current evidence

The [lab](../../adaptations/README.md) distinguishes automated checks from behavioral acceptance. In the [Markdown-reader experiment](../../adaptations/markdown-reader/README.md), both first applications passed automated evaluation. The workshop applier added backend/jsdom checks; the starter applier reported passing an ad hoc Playwright smoke test. A separate coordinator browser recipe then reproduced a missing relative-link capability on the workshop, passing 7/8 grouped scenarios, and passed 8/8 after a separate prompted repair. The HTTP/document/chat/SSE are mocked, so real native dialogs and live-provider chat remain unverified. The [verification recipe](../../adaptations/markdown-reader/verification-recipe.md) was added after the first blind attempts; it did not influence their frozen inputs. See the [protocol](../../experiments/markdown-reader/protocol.md) for results and limits.

The owner subsequently rejected that functionally checked integration's pane orientation, shell hierarchy, typography, and control treatment. A [fresh fidelity application](../../experiments/markdown-reader-fidelity/protocol.md) used revised descriptions and the original visual reference, then received owner acceptance with local refinements. This demonstrates why visual/reference review complements behavioral recipes: neither screenshots alone nor passing interaction assertions establish the whole experience. Mocked browser checks still do not establish native-dialog or live-provider behavior. Browser-test portability remains [issue #4](https://github.com/mcskinner/self-growing/issues/4).

The [quote-to-chat trials](../../adaptations/quote-to-chat/README.md) exposed two narrower verification gaps: an on-screen clickable button can still have overflowing text, and composer focus can coexist with the caret in the wrong place. Small acceptance requirements for actual label geometry and post-render end-caret/continued typing produced fresh passing applications in a bounded three-run batch (pass, caret failure, pass after the second requirement). These are portable outcome checks, not CSS values or framework lifecycle prescriptions. The latest revision has one fresh same-base pass, not replicated reliability or a controlled causal comparison. One verifier also needed a caption-only locator translation for a valid different button label; preserve assertions without turning source wording into a product requirement.

Related: [adaptation-led development](adaptation-led-development.md), [capability exchange](adaptations-and-capability-exchange.md), and [control of agency](control-plane-and-agency.md). Origin: the user's testing/verification proposal during the Markdown-reader experiment.
