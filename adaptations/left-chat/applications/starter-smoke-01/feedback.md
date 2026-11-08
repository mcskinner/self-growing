# Application feedback: starter smoke trial 01

## Did it work?
Partially assessed. The adaptation was implemented and committed on a fresh starter worktree. `make check`, `make test`, and `make build` pass with launcher-port environment variables removed. No browser, screenshots, or live model interaction was used: wide/narrow layout, scroll containment, sending, steering, stopping, and new-chat behavior remain **unverified in actual use**.

This was the framework author's smoke trial, not an independent agent trial. The author had already inspected the historical reference diff and source CSS; it does not establish that the minimal description alone is sufficient.

## Lessons learned
- A wrapper around existing chat and a separate empty workspace allowed a frontend-only implementation: no document reader, backend changes, or new dependencies.
- The first evaluation inherited WEB_PORT=5174 from the running app. An existing security test expects 5173, producing a failure unrelated to this adaptation. The evaluator now removes inherited launcher-port variables and VIRTUAL_ENV; the repeat passed.
- Repeated evaluations need separate logs and result records. The runner now retains them under evaluations/. Original first-run logs remain at the root of this record.
- Source-specific resizing and Markdown state were not needed for this application. This is not evidence they would never be useful.

## Gaps identified
- Automated baseline checks do not test the adaptation's layout or interaction acceptance criteria. Browser/manual checks are the next step.
- A fresh agent trial is needed to test instruction sufficiency. There is no reason yet to add more instructions to the adaptation.
- Commit links are generated but this trial branch has not been pushed; use the patch locally until then.
- Environment isolation is intentionally narrow; tool versions and other environment variables can still affect results.

## Evidence
Base and implementation hashes, commit links: application.json. Full target change: application.patch. Automated results: evaluation.json and evaluations/. Input description and source reference: input/. No screenshots captured. Implementation branch: adapt/left-chat-smoke-01.

## Implementation choices (not new adaptation requirements)
A CSS grid reserves up to 480px for chat on wide screens. Below 760px, the empty workspace is hidden. Existing transcript/composer code is left intact inside a flex-column wrapper. These are trial choices, not prescribed defaults for other applications.
