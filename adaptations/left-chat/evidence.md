# Reference evidence

The first Markdown review implementation (947eed4) wrapped the existing transcript and composer in a chat pane, alongside a document pane. `reference.patch` captures only its `frontend/main.tsx` and `frontend/style.css` changes; source hashes and a commit link are in `adaptation.json`.

**This is a deliberately mixed reference, not an installable patch.** It also includes document selection, annotation styling, resizing, and document-specific state. These are not requirements of left chat. The source kept full-width chat until a document was open. The first description instead reserved an empty workspace; the owner later clarified that the desired behavior is conditional: full-screen chat until another view is open, split panes only while it is open.

The source offers an implementation example, not evidence that this description transfers. No historical transcript was copied. Intent here is inferred from the implementation and the current request; original design rationale is not established.

## Hardening history

Revision 1: minimal intent, scope boundary, and observable outcomes. No fixed pane width, breakpoint, component API, or resize interaction prescribed. First trial should test whether the recipient can choose these locally.

Add instructions only after a recorded transfer exposes a gap. Keep failed application records; document which revision they used. Retest changes on a fresh target rather than judging a description by tests on its original implementation.

Revision 2: after the owner's rejection of the first reader integration, made the shared app shell explicit and repeated left/right placement in acceptance. The prior reader trial had not actually applied this left-chat description. This revision is guidance for a fresh combined trial, not evidence of successful composition. See `experiments/markdown-reader-fidelity/protocol.md` and the reader's `integration/owner-review.md`. A fresh combined application at 3177e64 subsequently passed preliminary functional/reference checks and was previewed as 7fb3524; owner acceptance was initially pending, not inferred from those checks. The owner subsequently deemed that preview acceptable with refinements remaining.

Revision 3: correct the unconditional reserved workspace. With no workspace view, restore full-screen chat; opening/closing a view must preserve the conversation/draft and saved split width. This local refinement follows owner feedback rather than declaring the accepted reference-fidelity transfer a failure. The runtime and browser regression recipe were updated together.
