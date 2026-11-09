# Prompted repair: independent mocked acceptance passed

Base: `959a911` (the preserved second application). Repair: `a109476e5a718ff5a19c37aa82a43d7ad68842f8`. This is a new fresh Pi session given two observed application failures, not another uncoached transfer. Frozen description remains SHA-256 `07a7e9fa977cd9beb08280ff319e80a73908f2fb543224d6943293cf2135025c`; the skill, tooling, reference, backend access, and running feature were unchanged.

## Intervention and result

The prompt identified a label overflowing the inherited 36×36px button and the settled composer-end-caret assertion failing after quote insertion. It requested focused regression coverage and preservation of existing behavior, without prescribing the code fix or exposing coordinator verification files.

The applier made the button content-sized/nonwrapping and moved composer focus/end-caret restoration to a layout effect after the controlled input updates and document selection cleanup. Its repair commit also adds a focused browser test and a short target wiki review note. The exact delta is preserved in application.patch. Target commit links are local/unpushed; the patch is the durable shared evidence.

Existing record/evaluate passed unchanged. The applier's focused mocked browser check covered pointer/Enter/Space at wide/narrow widths, label fit, settled focus/caret, subsequent typing, persistence, and no send. The coordinator independently ran the full recipe at 1440px and 390px: all functional scenarios, label fit, and nearby action passed, with no page errors or implicit chat requests. The control was 15px from the selected passage in both fixtures. These are preliminary browser/reference checks, not owner approval of this target application.

## Verification refinements and regression replay

The first repair replay passed desktop but hit a narrow multiline-selection fixture race: queued scroll/layout events from bringing text into view dismissed the programmatic selection action. The verifier now waits two animation frames after centering a passage before creating its Range. No application code changed for this correction. It also uses actual text wrapping/overflow rather than the first recipe's arbitrary minimum button width.

Final [portable recipe](../../verification.mjs) SHA-256: `cc4db324be316d88455af1456ced40613ac90c9f5c26f908ce23c2d28e4be9dc`. This exact recipe passed the repaired commit and was replayed against both originals: reader-01 still passed functional checks but failed placement; reader-02 still failed the settled composer-end-caret assertion. Their final replay logs remain in their records. The harness corrections did not erase the observed failures.

## Boundaries and lessons

This is a repaired pass, not successful first-try transfer. One extra placement sentence reached the intended UI form on the same related target; ordinary CSS/controlled-input bugs needed implementation repair, not more adaptation instructions. Automated evaluation and applier-authored browser checks alone missed these integration issues.

No trial runtime code was integrated into the workshop. APIs/chat/SSE and picker results were mocked. No live-provider interaction, real OS chooser, physical touch, screen-reader, cross-browser survey, exhaustive selection behavior, broad portability, or workflow-method superiority is established. Raw sessions, prompts, all attempted verifier versions, and public-fixture screenshots stay local. No existing active chat session was edited.
