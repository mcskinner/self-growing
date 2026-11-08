# Coordinator review: fresh reference-fidelity candidate

Candidate 3177e64e173ee9a8e6a9da4f84492574986817a9, independently applied from 233ef73 using the revised reader/left-chat descriptions frozen at d7640c4 and the original reference 898db55. The failed implementation was not repaired or supplied as input. Prompt, input snapshots, and extra-input hashes are retained. Existing prepare/evaluate tooling is unchanged; additional left-chat and verification files were manually snapshotted because prepare currently accepts one adaptation.

## Preliminary result

Existing recorder/evaluator passes: 55 Python tests, 19 frontend tests, lint/format/wiki/TypeScript, and build. Coordinator independently replayed the applier's isolated Playwright script successfully (coordinator-ui.log). It uses synthetic documents and mocked chat/API/SSE, not a native dialog, running app, or live provider.

An additional coordinator comparison rendered source and candidate from built assets with identical Markdown, chat/draft, and desktop/narrow viewports. Reference-only browser CSS suppresses annotation controls/rail and removes the comment canvas grid constraint; it does not modify source code or reader typography. The raw reference desktop is retained too. After an initial capture, the harness was made to wait for the draft's Send control to become enabled before both screenshots, avoiding a transient render-state mismatch; no candidate code changed.

All recorded presentation assertions pass: shared app header matches source bounds and contains both panes; chat is left; paragraph/link/inline-code/block-code/pre/body computed styles match the reference; icon-control inventory matches; no narrow page overflow or page errors. Reviewed source/candidate desktop and narrow captures. These are preliminary agent checks, not owner aesthetic approval. The visible document eyebrow intentionally says DOCUMENT rather than DOCUMENT REVIEW; annotations are absent.

## Owner gate

Acceptance remains PENDING. Put this candidate into the running workshop as a preview so the owner can judge the actual experience. Preserve the failed prior integration and do not silently fix further owner feedback in place. No control-plane or global icon-policy work was performed; no composition-brief abstraction was added.

## Limits

Applier feedback records autonomous dependency/test-environment repairs. No coordinator runtime-code edits were needed. Browser verification mocks document reads and chat; real temporary-file tests check filesystem boundaries separately. Native dialog, real provider interaction, broad browser/accessibility coverage, and owner acceptance remain unverified. The verification script has host-local Playwright/Chromium setup requirements documented in its header; it is not a portable test runner.
