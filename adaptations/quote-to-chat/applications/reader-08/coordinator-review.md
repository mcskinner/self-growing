# Clean latest-revision success reproduced: reader-08

**The second fresh replication passed all independent desktop/narrow acceptance scenarios without implementation repair.** Application `97f1a18357f89cfb48909f5f93133fad5e91b6ed` is local/unpushed, with full application.patch retained. Together with reader-06/07, this gives three clean application successes on the same latest description and original reader baseline.

## Same-input isolation

Plan `643398b` preceded invocation. Fresh baseline `0d6ebc22c84fed9bc3848b6beb8ed3f957d71c61`, separate worktree/session running independently of reader-07. Same configured model, existing skill/tooling, normal safety/context prompt, and original reference/evidence. No preceding success/failure, repair code, debugging hints, or coordinator verifier supplied.

Description SHA-256: `20979b7109a7a6c3b6f66cc897011fcc54b202c35cb796f136fbf4e51592aee7`; reference.patch `ad64a2f52d16e3a4e61b404f58ff11a67b34954b161e49846e9559123521df1b`; original verifier `cc4db324be316d88455af1456ced40613ac90c9f5c26f908ce23c2d28e4be9dc`. See input-manifest.json. The adaptation instructions were not amended for these replications.

## Observed checks

Existing record/evaluate passed (check, test: 55 Python/22 Node, build). Its own browser test measures a single text-label rectangle inside padded control bounds, checks rendered focus/collapsed end caret, and verifies subsequent typing. It also exercised pointer/keyboard activation, exact draft attribution/preservation, persistence, busy no-send behavior, limits, navigation, close, and explicit mocked send. The existing reader regression was also reported passing by the applier. An insecure synthetic-origin setup issue in its own fixture was fixed autonomously, not through application changes or coordinator coaching.

Independent acceptance passed all functional scenarios at 1440×900 and 390×900, nearby action placement (17px), and single readable contained label. Screenshot inspection confirms readable control text and preserved shell/reader layout. Backend, native picker/access policy, renderer, and navigation were unchanged; the owner-reviewed running feature was not replaced.

## False-positive wrapper measurement

The byte-identical original verifier passed every functional scenario, but reported label fit false because this valid button wraps its text in a span. As observed independently in reader-07, a Range over the complete button returns duplicate wrapper/text rectangles, not two text lines. The original output is preserved.

A separate diagnostic copy selects the full text label inside that span and verifies it covers the button's entire text; no caption translation was needed. Single-line, control scroll/containment, viewport, placement, and all functional assertions remain intact. Exact delta: verifier-target-locators.patch; hashes in input-manifest.json. Original verifier and application code are unchanged.

The diagnostic records duplicate wrapper rectangles at `(546.703125, 262, 74.59375, 17)` versus one actual text rectangle at the same coordinates in the desktop fixture; client/scroll dimensions both 134×38. Narrow results likewise show one contained text line. Full acceptance then passes. This is a verifier label-subject translation supported by geometry and screenshots, not weakened readability or repaired target code.

## Result

The clean latest-revision success reproduced twice in fresh contexts. Three same-description clean applications (reader-06/07/08) provide positive repeatability evidence on this related target. The two replications required only verifier locator/label-subject adaptation; neither required implementation repairs or further adaptation instructions. Raw sessions, prompts, and public screenshots stay local.

Browser APIs/chat/SSE and picker results were mocked. This does not claim live-provider/native OS chooser behavior, physical touch, cross-browser/screen-reader audits, exhaustive selections, or owner acceptance of the target previews. No trial code was integrated and no saved chat edited.
