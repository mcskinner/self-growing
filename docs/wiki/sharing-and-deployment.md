# Sharing and deployment beyond local installation

Status: exploratory work track proposed by the owner; not an implementation plan or a change to the current trusted-local app.

## Let people use what someone else grew

Self-growing software need not require every viewer to install a coding environment or become a builder. The owner proposed several related ways to share an app:

- **Immutable demo:** host a version of this app in containers so visitors can explore the experience read-only without changing or breaking the shared app. What remains interactive, especially chat, needs clarification. An immutable image alone does not prevent writes to mounted data, external side effects, or unsafe tool execution; read-only behavior needs actual execution boundaries.
- **Ship without chat:** distribute the useful grown application with its builder chat removed. Removing the visible pane is not the same as removing backend editing/tool-execution capabilities. This separates the app people use from the environment that grows it.
- **Fork to grow:** let someone take another person's app as their own starting point, then enable a builder in their own environment. Forking the whole app complements [capability exchange](adaptations-and-capability-exchange.md), which transfers selected transformations. What travels with a fork—code, data, history, configuration, workflows—should be explicit; secrets and private conversations should not travel by default.
- **Contributor and viewer access:** reusable RBAC/access-control foundations for projects with multiple contributors, distinguishing who may view the app from who may invoke chat to modify it. Proposing, approving, and executing changes may also be different authorities. Checks must govern backend actions, not merely hide UI controls.
- **Persistence and workflows:** support durable application data and operational workflows beyond one local workspace. Storage lifecycle, deployment updates, migrations, backups, and background work become relevant; no particular database or orchestration system is selected here.

## Separate forms, optional capabilities

A read-only demo, a chat-free published app, and a collaborative builder are different deployment forms, not necessarily stages everyone must adopt. They could share code without sharing credentials, mutation privileges, or persistence assumptions. Keep these possibilities separate from the [minimal starter](minimal-core-and-workshop.md); do not turn the kit into a hosted multi-user platform by default.

## Questions

How does a visitor move from trying an app to forking it? Which resources are per visitor, per fork, or shared? Can an immutable demo offer an isolated disposable mutation experience instead of changing the shared instance? How is a fork updated without exposing its private data? Which deployment/access/persistence capabilities can themselves be optional adaptations?

Related: [self-growing software](self-growing-software.md), [control plane and agency](control-plane-and-agency.md), and [pluggable principles](pluggable-principles.md). Source: the owner's sharing/deployment proposal in this chat. No hosting, authentication, RBAC, persistence, or workflow infrastructure was added by this note; the running app remains trusted and local-only.
