# Quote-to-chat adaptation

Explicitly bring selected document text and its source path into an editable chat draft, without sending. Requires an existing document reader and chat; does not add a docs browser or comment system.

- [Minimal description](adaptation.md)
- [Source evidence and exclusions](evidence.md)
- [Initial extraction](extraction-run.md)
- [Transfer protocol](../../experiments/quote-to-chat-transfer/protocol.md)

Source: reviewed feature `e97bfc6`. The reference patch is mixed with navigation work; do not apply it wholesale. The protocol was written before extraction/application, not before the original feature's development.

## Transfer results

| Attempt | Outcome |
| --- | --- |
| [Initial description](applications/reader-01/coordinator-review.md), `af11bde` | Functional checks passed; permanent quote toolbar missed the nearby-highlight interaction. |
| [One-sentence placement revision](applications/reader-02/coordinator-review.md), `959a911` | Placement improved; independent checks found label overflow and a composer-end-caret/focus bug despite passing automated evaluation. |
| [Separate prompted repair](applications/reader-02-repair/coordinator-review.md), `a109476` | Automated evaluation and full independent mocked Chromium checks passed at 1440px/390px. Not an uncoached first-try success. |
| [Fresh uncoached replication](applications/reader-03/coordinator-review.md), `47c4860` | Same revised description/original reference; automated and functional browser checks passed, but label overflow recurred at both widths. No repair or verifier change; overall acceptance failed. |
| [Label-verification guidance](applications/reader-04/coordinator-review.md), `788274c` | Fresh application passed full independent wide/narrow acceptance without repair or verifier adjustment. |
| [Identical-guidance replication](applications/reader-05/coordinator-review.md), `8b01b6b` | Readable label, but settled-caret acceptance failed after translating only a valid different action caption in the verifier. No application repair. |
| [Label plus settled-caret guidance](applications/reader-06/coordinator-review.md), `4a5e395` | Fresh application passed full unchanged independent acceptance at both widths; own browser tests additionally verify continued typing. |

Original descriptions, patches, feedback, and evaluation outcomes are preserved. See [revision notes](revision-notes.md). Recorded worktree paths are local conveniences, not portable dependencies; application commits remain local/unpushed, with durable patches retained here. The placement-only description failed both original applications and reader-03 replication. Subsequent guidance adds two portable acceptance assertions—actual label fit, then settled end caret/continued typing—not target CSS values or React fixes. The bounded three-run batch produced pass, caret failure, then pass. The latest revision has one clean fresh application, not a replicated guarantee; all three additional runs are exhausted. The original verifier remains unchanged; reader-05's caption-only translation is preserved as an exact patch, with acceptance assertions untouched. No trial runtime code was integrated into the running workshop. No claim of broad portability, live-provider validation, target owner acceptance, or superiority of implementation-first development.

## Reproduce the independent browser checks

Use a built target worktree and an externally available Playwright module/browser. The [recipe](verification.mjs) starts only an ephemeral static-file fixture and mocks all API/chat traffic; it does not run a development stack or contact a provider. Copy it to a local output directory so generated screenshots/results are not placed in the adaptation directory:

```sh
mkdir -p .local/quote-replay
cp adaptations/quote-to-chat/verification.mjs .local/quote-replay/
TARGET_WORKTREE=/absolute/path/to/built-target \
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
CHROME_PATH=/absolute/path/to/chrome \
node .local/quote-replay/verification.mjs
```

The historical target has a native picker; the fixture intercepts its result, not the OS dialog. Portability of the recipe to unrelated markup is not established. Raw coding sessions, prompts, screenshots, and unsuccessful harness iterations remain local rather than another published artifact bundle.
