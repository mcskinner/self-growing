# Minimal core and workshop

Status: branch organization adopted; the broader ecosystem remains exploratory.

## Two forms, not two release stages

`starter` is the deliberately minimal starting point. `trunk` is the workshop: the grown app used to build and explore the project itself. The installer explicitly selects starter for a fresh remote installation; existing checkouts retain their branch. See the [README](../../README.md).

Both live in one repository, with worktrees when simultaneous checkouts are useful. Their intimate relationship currently matters more than a procedural separation into different repositories. The starter is maintained source, not generated from the workshop as a build artifact.

There is no promise that workshop changes will eventually merge into starter. Keeping the kit small should not prevent the workshop from becoming useful. Conversely, useful bug fixes or small foundational improvements may belong in both.

## What stays optional

The [journal](sources/self-growing-journal.md) names left-pane chat, project management, a control plane, an opinionated component library, and curated skills as possible growth directions. These are possibilities, not an agreed starter feature set. The later [discussion](sources/discussion-context.md) adds a protocol lab and tighter GitHub issue integration as workshop interests, not implemented capabilities.

The kit is the garden bed; “seeds” was proposed as a metaphor for curated growth material. The branch name `starter` deliberately leaves “seed” available without committing it to a protocol meaning.

## Tensions

- A richer starting point is easier for some tasks but quietly imposes preferences on every descendant.
- Extracting shared infrastructure can reduce duplicated fixes but also create premature extension boundaries.
- The workshop can test its own exchange tools, but author-run success is weaker evidence than an independent transfer.

Related: [capability exchange](adaptations-and-capability-exchange.md), [minimal instructions](minimal-instructions-and-hardening.md), and [self-growing software](self-growing-software.md).
