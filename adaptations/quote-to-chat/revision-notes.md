# Quote-to-chat description revisions

## Initial extraction — 3834b42

Unedited fresh-distiller output. Description SHA-256: `58a3223c9a6e193139464ab849d24620c47f92040c9c42955edd9290766fa2d5`. Frozen in [reader-01 inputs](applications/reader-01/input/adaptation.md).

The first application passed functional checks but used a permanent action row, missing the reviewed nearby-highlight interaction. The initial description allowed that choice; this is an evidenced description/fidelity gap, not a functional failure.

## Placement clarification

Added one sentence: “Show the quote action beside the current highlight when text is selected, rather than adding a permanent quote toolbar.” No other description, skill, tooling, source evidence, or backend requirement changed. A fresh same-base application produced the intended selection-relative action but had label-sizing and caret/focus bugs. A separately prompted implementation repair passed independent mocked browser checks. See [reader-02](applications/reader-02/coordinator-review.md) and [repair](applications/reader-02-repair/coordinator-review.md). No further description changes were made for those implementation bugs; the repaired result is not first-try transfer success. A [fresh uncoached replication](applications/reader-03/coordinator-review.md) then used the same description and original reference with the unchanged verifier. Functional/end-caret checks passed, but label overflow recurred at both widths. That failure is preserved without an in-place repair. The later verification-guidance trial below is a separate intervention, not a reclassification of that failure.

## Rendered-label verification clarification

After label overflow recurred in reader-02 and reader-03 while both appliers' browser tests passed, added one portable acceptance sentence: “At wide and narrow browser viewports, assert that its label is a single readable line fully inside the rendered control; button visibility and on-screen bounds alone do not establish label fit.” This asks for evidence of the intended outcome, not a CSS width/height prescription or disclosure of repaired code. Skill, tooling, source reference, and independent verifier remain unchanged. Up to three new fresh applications are authorized under the [protocol amendment](../../experiments/quote-to-chat-transfer/protocol.md); results are pending. See the [protocol amendment](../../experiments/quote-to-chat-transfer/protocol.md) and [first review](applications/reader-01/coordinator-review.md).
