# Rendered-label verification guidance: first fresh pass

Plan/revised-description commit: `f138085`, preceding invocation. Fresh target/base: `0d6ebc22c84fed9bc3848b6beb8ed3f957d71c61`. Application: `788274c3c42c842e2f142310cc5bbb09e1df9222`, local/unpushed with full application.patch retained here.

## Intervention and isolation

Added one outcome/verification sentence to the frozen description: at wide/narrow browser viewports assert that the label is a single readable line fully inside the rendered control; button visibility/bounds alone do not establish label fit. No CSS values, source-specific fix, repaired code, past outcome, or coordinator script supplied. Original reference/evidence remained available, with unchanged skill/tooling and configured `openai-codex/gpt-6.1-sol` in a fresh isolated session.

Description SHA-256: `06f125519f09d08535a8070353d6e2ab8be3bbed7a059679a729caf99dd441d2`. Original reference.patch: `ad64a2f52d16e3a4e61b404f58ff11a67b34954b161e49846e9559123521df1b`. Held-out verifier remained byte-identical at `cc4db324be316d88455af1456ced40613ac90c9f5c26f908ce23c2d28e4be9dc`. See input-manifest.json. The applier reports consulting the brief/evidence and ordinary target context, without needing the reference patch. No coordinator implementation edits or post-run repair.

## Observed outcome

- Existing record/evaluate passed: check, test (55 Python/22 Node), build. Clean committed target.
- Applier-authored Chrome fixture now explicitly creates a DOM Range over the label and checks a single nonzero-width text line inside the button's padded bounds at wide/narrow widths. Its feedback identifies the global 36px rule and content-sized control as an integration consideration. This is inspected code and reported executed testing, not proof of causal effect from one sentence.
- Independent unchanged verifier passed all functional scenarios, actual label fit, and nearby placement at 1440×900 and 390×900. Control distance was 15px at both widths. No harness changes, selector changes, or target repairs were needed.
- Screenshot inspection confirms a readable single-line action, no prior label overflow, and preserved app shell/reader layout. The transient action can cover adjacent text, as in the reviewed source; its placement/readability checks are not exhaustive occlusion or owner acceptance.
- Backend/native picker/access policy, renderer, and navigation are unchanged; no docs drawer imported. The running workshop feature was not modified or replaced.

This is the first fully passing fresh application of the verification-guidance revision. It does not reclassify the prior repaired pass or failures. The next planned step is a separate fresh replication on identical inputs, not a repair or new instruction amendment.

## Limits and records

The applier's own fixture changed a navigation interaction to keyboard after observing popover overlap and waited for busy-triggered reload before selecting; these were autonomous test adjustments, not coordinator coaching. The unchanged independent suite subsequently passed its pointer/link and reload checks without those adjustments.

APIs/chat/SSE and picker results were mocked. No live-provider/native OS chooser, physical touch, cross-browser/screen-reader survey, exhaustive documents/occlusion checks, or target owner acceptance. One stochastic same-base pass cannot establish causality, necessity of the added sentence, broad portability, or superiority of a development workflow. Raw prompt/events/session and public screenshots remain local under `.local/adaptation-runs/quote-to-chat-reader-04/` and `quote-to-chat-verification-04/`. No active saved chat was edited.
