# Quote-to-chat adaptation

Explicitly bring selected document text and its source path into an editable chat draft, without sending. Requires an existing document reader and chat; does not add a docs browser or comment system.

- [Minimal description](adaptation.md)
- [Source evidence and exclusions](evidence.md)
- [Initial extraction](extraction-run.md)
- [Transfer protocol](../../experiments/quote-to-chat-transfer/protocol.md)

Source: reviewed feature `e97bfc6`. The reference patch is mixed with navigation work; do not apply it wholesale. The protocol was written before extraction/application, not before the original feature's development.

The [first transfer](applications/reader-01/coordinator-review.md) passed functional checks but missed nearby-highlight placement. A [one-sentence revision](revision-notes.md) is frozen for a fresh same-base retry. No claim of broad portability or superiority of implementation-first development.
