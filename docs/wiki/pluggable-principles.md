# Pluggable project principles

Status: exploratory; no principle-package loader, enforced review gate, or control-plane feature implemented.

## Optional guidance, not an admission requirement

A project-starting kit could offer reusable design/development principles alongside the minimal scaffold. Users could choose a recommended set, mix their own, revise or remove it later, or simply skip all of it and build. The unguided path is a first-class choice, not a broken or disapproved configuration. Recommendations must not quietly become mandatory process.

Principles persist across changes; [adaptations](adaptations-and-capability-exchange.md) describe particular transformations; [acceptance evidence](acceptance-and-verification.md) evaluates a particular result. A principle might favor coherent app-level hierarchy, intentional layout modes, or preserving an established visual language, without prescribing one universal header width or forcing every project to share an aesthetic.

A starting kit could bundle selected guidance, but selection need not happen only at project creation. “Pluggable” describes the ability to adopt, exchange, customize, or omit guidance, not a decision to build a plugin API, settings panel, package registry, or enforcement engine. Small Markdown instructions might be enough for an experiment.

## Limits and tensions

- Guidance should support ordinary judgment rather than grow into a constitution listing every past agent mistake.
- Distinguish generally useful defaults from an owner's taste. A header can be coherent in several arrangements.
- If reviews or acceptance gates are offered, their adoption is also a project choice; the starter should not require an adaptation-led workflow just because one exists.
- Skipping optional design/process guidance does not grant additional tool permissions or turn trusted local software into a sandbox. Behavioral guidance and execution boundaries remain different things.

## Origin and current example

After the first reader integration failed visual acceptance, the fresh reference-fidelity preview was deemed acceptable by the owner, with refinements remaining. Closing a document should restore full-screen chat, not leave an empty reserved workspace. The centered, capped-width header against a full-width split layout raised a broader consistency question, likely also present in the source reference. The closed-document behavior was corrected locally. The header question motivated this possible reusable guidance layer; the owner then requested a direct local header fix before any principle-guided trial.

Header implementation target: `ed4cb9d`, from pre-fix baseline `1d10cf8`. Split mode now uses the workspace width with balanced gutters, while solo chat keeps its constrained header and the brand stays centered. This is a concrete project choice, not a universal full-width-header principle. A later fresh run can test whether optional guidance produces the intended layout judgment without providing the fix. That experiment has not run; no principle/control-plane mechanism was added to deliver the local fix.

Source: the user's follow-up discussion and explicit request that users may “yolo skip all of it.” Related: [control plane and agency](control-plane-and-agency.md), [minimal core](minimal-core-and-workshop.md), and [adaptation-led development](adaptation-led-development.md).
