# Markdown reader — extraction evidence

## Inputs and scope
- Followed `/Users/michael/dev/self-growing/.pi/skills/adapt/SKILL.md` and this directory's `extract.md`.
- Read `adaptation.json` and all of `reference.patch`. Metadata identifies base `a18a41f76aa45d8a17cbcccea680f3e16a49fd3f` and head `898db55839fad721fd9d5d6158e8c93440ac6323`; the supplied checkout is at that head and was clean when inspected.
- Inspected current `backend/documents.py`, document-router registration in `backend/app.py`, `frontend/documents.tsx`, reader integration in `frontend/main.tsx`, reader styles in `frontend/style.css`, reader tests in `tests/test_documents.py`, and validation/dependency definitions in `Makefile` and `package.json`. Annotation implementation/tests were reviewed in the supplied patch to determine exclusions.
- A base-to-head diff stat also lists `README.md`, absent from the supplied patch/path list. Read that current file as source documentation; it describes the review workflow and contains embedded review metadata. Neither its review contents nor unrelated launch/install prose is reproduced here.
- `transcript_included` is false; no `source-transcript.txt` is present. No other application histories, sessions, or experiments were consulted. There is no transcript to redact in this directory; review/remove one if added before publication.

## Observed implementation and distillation rationale
These are static code observations, not browser-tested outcomes.

| Capability | Source evidence | Portable intent |
| --- | --- | --- |
| Open an original local file | `backend/documents.py`: `choose_markdown_file`, `pick_document`; `frontend/documents.tsx`: `DocumentPicker` | Explicit file choice, external files supported, no upload/import copy; cancellation leaves the current file alone. |
| Read bounded Markdown | `document_path` resolves paths, accepts `.md`/`.markdown`, limits files to 2,000,000 bytes; `read_document` decodes UTF-8 | Validate reads and resolved relative-path boundaries; surface failures. Exact limit and route names need not transfer. |
| Render safely | `DocumentView` uses existing `marked` and `DOMPurify`; forbids images, styles, inputs, and annotation-spoofing attributes | Sanitize document HTML and avoid automatic remote loads. Do not transfer comment-specific sanitizer configuration as a new feature. |
| Comfortable reading | `frontend/style.css`: `.document-scroll`, `.markdown-document`, heading/code/table/quote styles | Independent scrolling, readable typography, contained wide content. Exact colors, pixels, and review branding are not essential. |
| Keep chat available | `App` places the path-keyed document beside the session-keyed `Chat`; shared header, close control, resizer, responsive CSS | Document lifecycle must not be tied to conversation remounts; preserve existing chat behavior. |
| Persist layout and selection | `open-document` in session storage; `chat-width` in local storage; pointer capture and keyboard separator controls | Restore the open path in the tab and resize preference; support pointer and keyboard. Source defaults: 480px, nominal range 320–900px. |
| Recover and refresh | Fetch effect depends on URL, chat `busy`, and retry counter; aborts obsolete requests; shows loading/error/retry | Re-read after agent work and recover visibly from failures without stale responses winning. Not a filesystem watcher. |

`tests/test_documents.py` contains assertions for workspace listing/content boundaries, traversal and hidden-target symlinks, mocked native selection of an external original without writes/copies, and cancellation. These are useful acceptance-test seeds. The remaining backend tests and all `tests/annotations.test.ts` tests predominantly concern excluded annotation behavior. Test presence is not evidence of a passing run.

## Exclusions after diff review
- Omit `frontend/annotations.ts` and its tests: quote matching, context anchors, DOM marks, and ambiguous/detached passage handling.
- Omit selection listeners/popover, comment draft state, annotation rail positioning, active-thread navigation, resolve/reopen controls, and all annotation CSS. In particular, the rail's fixed/minimum widths are not reader constraints.
- Omit backend comment models, embedded HTML metadata parsing/writing, legacy `.local/reviews.json` fallback, migration, comment routes, concurrency-safe annotation writes, and associated tests. A reader does not require a comment store or metadata schema.
- Omit `ReviewRequest`, `onReview`, review prompt generation, and insertion into the chat draft. Their session-scoped protection is relevant to that excluded handoff, not a requirement to add one.
- Omit README example-branch/installation changes and embedded review data. No other unrelated runtime capability was found in the supplied patch. Keep only reader-related router, shell, and styling ideas, not a wholesale patch application.

## Uncertainty, limitations, and validation status
- Intent is distilled from the requested outcome plus code/documentation, not a source conversation. This is the initial minimal extraction; no transfer attempt or evidenced hardening iteration exists here. No successful transfer is claimed.
- Source navigation consists of choosing/replacing/closing a file and scrolling. The workspace listing endpoint exists but the picker UI does not use it. There is no dedicated table of contents, search, heading-ID generation, or interception/resolution of relative Markdown links. Those features are not asserted or mandated by this extraction; richer navigation would need additional requirements/evidence.
- Native choosing is macOS-only (`osascript`); other platforms receive 501. The chooser tests mock selection, so they do not prove native-dialog behavior. The core describes the outcome rather than requiring AppleScript on another platform.
- Absolute paths are accepted directly by content reads, not restricted to files previously chosen. Relative paths reject hidden/excluded directories and resolved escapes. This is a trusted local app, not a sandbox; do not mistake these checks for an absolute-path allowlist or expose this capability as a hosted service.
- Source refresh happens on busy transitions/retry, not arbitrary external edits. Restoring the open path is implemented, but scroll-position restoration is not.
- Responsive and accessibility behavior, sanitizer effectiveness against all resource-loading cases, and chat coexistence were inspected only. The source still reserves substantial width for excluded annotations, so its narrow-screen comfort is not established by the CSS alone.
- No checks, tests, build, native chooser, live chat, or browser interaction were run during this artifact-only extraction. Neither `node_modules` nor `.venv` was present; no dependencies were installed or servers started. Target validation remains required.
- No extraction blocker. Only `adaptation.md` and `evidence.md` were authored; application code, skill, tooling, metadata, and reference patch were left unchanged. No commit was made.
