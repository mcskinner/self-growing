# Markdown reader: first distillation and transfer

A mixed implementation was distilled with the existing adapt skill, then independently applied by fresh Pi sessions to starter and workshop targets. No preemptive skill, tooling, or target-code fixes were made. See the [prospective protocol](../../experiments/markdown-reader/protocol.md).

**Owner acceptance failed** for the first integration: [review](integration/owner-review.md). Functional browser checks did not establish layout or visual fidelity. A [fresh fidelity retry](../../experiments/markdown-reader-fidelity/protocol.md) used revised descriptions and passed preliminary functional/reference comparisons. Its [preview at 7fb3524](integration/fidelity-preview.md) was subsequently **accepted by the owner with refinements**. The current local refinement restores full-screen chat when documents are closed; header alignment remains an open design question. The rejected implementation was not used as the reference target.

## What to read

- [Current revised description](adaptation.md); [frozen initial description](applications/trunk-01/input/adaptation.md), [reference evidence](evidence.md), and [extraction record](extraction-run.md).
- [Starter first attempt](applications/starter-01/coordinator-review.md): existing evaluator passed; applier-authored isolated Playwright smoke passed its scenarios. No independent coordinator browser replay on this target.
- [Workshop first attempt](applications/trunk-01/coordinator-review.md): existing evaluator passed; independent browser verification passed 7/8 scenario groups. Relative Markdown links were not navigable.
- [Prompted workshop repair](applications/trunk-repair-01/coordinator-review.md): existing evaluator and all 8 independent browser groups passed. This is repair evidence, not a successful new blind transfer.
- [Fresh combined fidelity attempt](applications/fidelity-01/coordinator-review.md): revised left-chat/reader descriptions, original reference, historical workshop base, comparison captures and pending owner gate.
- [Verification recipe](verification-recipe.md): behavioral actions and assertions, added after the initial attempts rather than silently injected into their inputs.
- [Candidate instruction addition](candidates/relative-markdown-navigation.md): one proposed sentence arising from the gap. The navigation requirement is now included in the revised description for a fresh fidelity retry; it was absent from the frozen first description.

Each application contains its input snapshot, prompt/brief, applier feedback, coordinator review, patch, commit provenance/links, and evaluation results/logs. Commit links are not guaranteed to resolve until branches are pushed. Browser scripts are exact execution artifacts with local dependency assumptions, not a newly packaged test framework.

## What we learned

The file-based machinery worked unchanged for both targets. Fresh appliers produced different implementations without importing comments. Both treated navigation as choosing/replacing files; neither implemented relative-link navigation, which the source also lacked. That matches the frozen description but not the coordinator's richer protocol acceptance. Desired outcomes beyond the source implementation need to be made explicit.

The independent browser recipe caught what check/test/build and applier-authored checks did not. Its HTTP/document/chat/SSE are mocked: it verifies the UI against fixtures, not real provider interaction or native dialogs. Backend tests exercise actual temporary-file reads separately.

## Workshop integration

The evaluated workshop implementation was ported to trunk as 4e7951d, followed by the navigation repair as 6cc23d9. Only a wiki-log append conflict required manual resolution; both histories were retained. No coordinator runtime-code edits were needed. The integrated production build also passed all eight isolated browser scenario groups; see [results](integration/coordinator-browser.json) and [log](integration/coordinator-browser.log). This harness uses mocked APIs/chat and does not contact the running app. The running app gains a read-only reader with relative Markdown-file links, but no comment layer. Native dialog and live-provider acceptance remain unverified; heading-fragment scrolling and document back/forward controls are not implemented.

That text-button implementation was subsequently rejected by the owner and replaced with the fresh icon-led preview above. Use the shared-header **folder icon** to choose a Markdown file after the backend reloads. No source Markdown is modified or imported by the reader.
