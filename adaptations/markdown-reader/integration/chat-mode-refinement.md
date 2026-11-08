# Local refinement: full-screen chat when documents are closed

Owner accepted the reference-fidelity preview, with this refinement remaining. This is a deliberate local specification/runtime correction, not a fresh blind transfer or another rejection of the accepted preview.

## Change

The left-chat description had required an unconditional reserved workspace. It now describes two states: normal full-screen chat with no workspace view, and chat-left/reader-right when a document is open. The reader description and verification recipe agree.

The concrete app applies split-layout styles and mounts the divider/reader only while a document is open. It no longer shows an empty workspace. Solo chat regains the regular centered conversation/composer presentation and hides the pane-only chat heading. Narrow-screen split rules no longer constrain solo chat. No shared-header styling or control-plane machinery changed.

## Verification

`make check`, `make test`, `make build`: pass (55 Python tests, 19 frontend tests). `node scripts/verify-reader.mjs dist .local/adaptation-runs/chat-mode-refinement`: pass. The added assertions check initial full-screen chat, absence of a divider/empty document pane after close, full-width chat and reachable composer on desktop/narrow, preservation of the actual composer node and draft across desktop close, retained split width on reopening, and repeated narrow close/reopen transitions. Existing reader and simulated chat checks still pass.

The first extended browser run timed out when querying a narrow-screen separator, which intentionally exists but is hidden while a document is open. Corrected the test locator to include hidden elements when reading its saved width; no extra runtime fix was made. Both logs and synthetic screenshots remain under `.local/adaptation-runs/chat-mode-refinement/`; the final result is [archived](chat-mode-refinement-ui.log).

Browser APIs/chat are mocked and real temporary-file tests are separate; no native-dialog or live-provider claim. The optional-principles discussion lives in [the wiki](../../../docs/wiki/pluggable-principles.md), not a newly enforced project policy. Header alignment remains an open refinement.
