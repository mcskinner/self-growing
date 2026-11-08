# Reference evidence

The first Markdown review implementation (947eed4) wrapped the existing transcript and composer in a chat pane, alongside a document pane. `reference.patch` captures only its `frontend/main.tsx` and `frontend/style.css` changes; source hashes and a commit link are in `adaptation.json`.

**This is a deliberately mixed reference, not an installable patch.** It also includes document selection, annotation styling, resizing, and document-specific state. These are not requirements of left chat. The source kept full-width chat until a document was open; this adaptation instead reserves a workspace without requiring a document feature.

The source offers an implementation example, not evidence that this description transfers. No historical transcript was copied. Intent here is inferred from the implementation and the current request; original design rationale is not established.

## Hardening history

Revision 1: minimal intent, scope boundary, and observable outcomes. No fixed pane width, breakpoint, component API, or resize interaction prescribed. First trial should test whether the recipient can choose these locally.

Add instructions only after a recorded transfer exposes a gap. Keep failed application records; document which revision they used. Retest changes on a fresh target rather than judging a description by tests on its original implementation.
