# Self-growing software

Status: central idea with a working local prototype; broader implications exploratory.

## Motivation

Even with increasingly capable coding agents and orchestration, small personal tools still need their owner to break glass and fix the system. Embedding the coding chat in the tool puts use, feedback, and repair behind one pane of glass. The user doesn't need to leave the app to ask for its next change.

The author's original notes trace this motivation from Copilot and IDE assistants through chat-first coding and headless orchestration. The aim here is not another production development platform: examples include a meal planner or a pull-request manager, grown around a particular person's needs.

## What exists

A local web app mirrors Pi chat while Pi changes that same repository. The harness owns tool execution and provider access; credentials are not placed in the browser. See the [project README](../../README.md) for actual behavior and limitations. Using an existing harness login avoids requiring a separate browser-side provider integration; subscription coverage remains subject to provider terms.

The author's first Markdown reader/commenting offshoot felt unusually pleasant to use. That is a meaningful personal observation, not a comparative usability study. Its left-chat layout became the first [adaptation experiment](adaptations-and-capability-exchange.md).

## Questions

- What is the smallest [starter](minimal-core-and-workshop.md) that makes this approachable?
- How much agency should be embedded in ordinary use, and how should the owner inspect or undo changes?
- Can other people acquire the goodness of a grown workflow without inheriting the whole app?
- When does self-modification improve a tool, and when does it make maintenance harder?

The [control plane](control-plane-and-agency.md) and [capability exchange](adaptations-and-capability-exchange.md) explore different parts of those questions.
