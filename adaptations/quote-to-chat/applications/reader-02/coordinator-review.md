# Revised-description transfer: placement improved, application bugs found

Base: `0d6ebc22c84fed9bc3848b6beb8ed3f957d71c61`. Fresh application: `959a911` (full hash in application.json). Description revision: `8c14571`, SHA-256 `07a7e9fa977cd9beb08280ff319e80a73908f2fb543224d6943293cf2135025c`. Same source/reference, skill, model configuration, and target base as reader-01. No first-trial feedback, coordinator recipe, or coaching supplied.

## Results before any repair

Existing record/evaluate passed unchanged; the applier also reported passing its own mocked Chromium checks. The application has a selection-relative action and no permanent quote toolbar, matching the added sentence. It does not import the docs drawer or change backend access.

Independent browser acceptance did not pass:

- The action inherits the target's global 36×36px button dimensions. Its label wraps outside the button. Screenshot/code inspection confirms a genuine integration bug, not merely a preferred numeric width.
- Quoting appends the correct passage and path without sending, but the independent assertion that the composer is focused with the caret at its end times out even after waiting for asynchronous updates. Full scenario execution stops there; do not claim the remaining checks independently passed on this commit.

The first replay used exactly reader-01's corrected recipe and failed its label-size assertion. For a more general diagnostic, the second replay checks actual text wrapping/overflow instead of imposing a minimum pixel width and defers the geometry verdict to collect other behavior; it then exposes the caret/focus failure. These are verifier refinements, not application fixes. The raw commit remained unchanged. The committed recipe is this refined diagnostic version; the exact earlier version is retained in reader-01's record and local logs.

## Next step

Preserve this first state and use a separately recorded, explicitly prompted repair for the observed button-fit and composer-end-caret failures. Do not add more adaptation instructions for ordinary implementation bugs or label a repaired result a successful uncoached transfer. The one-sentence placement guidance reached its intended UI form in this trial, but that does not establish whole-feature first-try success or causality across stochastic agents.

All browser APIs/chat were mocked. No live provider, real native chooser, physical touch, exhaustive accessibility/browser coverage, or owner acceptance. Screenshots and raw sessions stay local; selected logs and the application patch are retained here. The running app remains the original reviewed implementation.
