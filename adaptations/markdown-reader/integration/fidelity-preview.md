# Fresh fidelity preview — accepted with refinements

Running-workshop preview commit: 7fb3524. Candidate source: 3177e64, applied from historical workshop 233ef73 with descriptions frozen at d7640c4. Previous rejected implementation remains recoverable in Git; its owner review is [preserved](owner-review.md).

## What changed

Replaced the prior reader implementation with the fresh candidate's backend/frontend/tests/package snapshot and its isolated verification script. Kept the running checkout, saved sessions, current wiki/lab, and adaptation tooling. No coordinator runtime-code fixes or composition protocol were introduced. This replacement also removes the previous implementation's jsdom/tsx-specific tests/dependencies in favor of the candidate's tests and browser script; the old tests remain in prior commits.

The [preview patch](fidelity-preview.patch) records the runtime transition. The candidate's own full baseline-to-application patch and input snapshots are in [fidelity-01](../applications/fidelity-01/coordinator-review.md).

## Preliminary verification

The fresh candidate and integrated preview pass check/test/build (55 Python tests, 19 frontend tests). Coordinator replay of the isolated Playwright recipe passes on both; [preview log](fidelity-preview-ui.log). These use synthetic files and mocked document/chat/SSE APIs, not a native chooser or live provider. Real temporary-file tests cover backend boundaries separately.

Independent reference comparison: [source desktop](../applications/fidelity-01/reference-desktop.png), [candidate desktop](../applications/fidelity-01/candidate-desktop.png), and desktop/narrow metrics and captures under that application directory. Shared header bounds, left/right arrangement, paragraph/link/code styles, and icon-control inventory match on the fixture. Reference-only browser CSS hides annotation UI and removes its grid constraint; unmodified source code and raw desktop capture are retained.

## Review in the running app

The folder icon in the shared header opens a document. Existing open-document state is retained where valid. The backend reloads after the agent turn; an interim document-service error may need Retry afterward. No second app server was started.

The owner judged this preview acceptable, with refinements remaining: closing a document should restore full-screen chat, and header alignment deserves further consideration. Full-screen chat on close has since been corrected locally. Acceptance is an explicit owner decision, not an inference from automated checks. Native chooser and live-provider behavior are not independently claimed. Further feedback should be recorded against this preview before another revision or repair.
