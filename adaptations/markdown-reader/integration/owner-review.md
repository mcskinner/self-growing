# Owner review: first integrated Markdown reader

Status: owner acceptance failed. Reviewed running workshop at 09b8186 after the initial application and prompted navigation repair. Automated functional checks remain evidence of their tested behaviors, not visual approval.

## Reported failures

- Chat is on the right rather than the preferred left.
- The logo-bearing app title/navigation bar is nested inside chat, while document controls occupy the top-level position. The source design has the correct opposite hierarchy: a shared app shell above feature panes.
- Markdown looks substantially worse than the markdown-comments reference and even the chat rendering. The owner questioned the lighter surface, inconsistent-looking link sizes, and undersized monospace type. These are reported observations, not yet a measured diagnosis of CSS causes.
- Icon-led controls have drifted into awkward text-button controls compared with the reference.

## Interpretation and scope

The first workshop applier received the reader description, not the left-chat adaptation; calling this a verified combined application would be inaccurate. The reader description allowed substantial redesign, and functional verification did not check shell hierarchy or reference fidelity. A conventional app header belonging to the app shell should be ordinary integration judgment, not a new architectural protocol layer.

The owner approved recording this review, revising the left-chat/reader descriptions, and a fresh application from historical workshop baseline 233ef73, compared with markdown-comments at 898db55 minus comments. Do not repair this first implementation in place and use it as the reference for that retry. Do not introduce a composition-brief abstraction, control-plane work, or global icon-policy machinery in this experiment. Reference fidelity can still cover the source's controls.

## Acceptance gate and preview

Generate a separate fresh candidate, perform automated and reference-oriented review, then put that candidate into the running workshop for the owner to inspect. A preview is necessary for owner review, not proof of acceptance. Retain the prior commits and record owner acceptance as pending until the owner actually approves. If it fails, preserve that result and distinguish further description changes from local code repair.

## Source

Owner feedback in this chat following the initial reader integration, including the clarification that the running implementation must change to permit review. No owner screenshots or independent visual measurements were supplied with this feedback.
