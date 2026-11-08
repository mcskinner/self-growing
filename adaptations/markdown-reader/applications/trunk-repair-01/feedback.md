# Coordinator-prompted Markdown-reader repair

## Result
Committed repair: `1151066` (`Repair document-relative Markdown navigation inside reader`). This is a separate, coordinator-prompted repair of the reported navigation gap, not a blind first transfer. Used the adapt skill and read the supplied adaptation description; did not change the description, skill, or machinery. Did not inspect other branches/worktrees or conversations, push, or start an app server. Recorded the committed application patch and provenance with `scripts/adapt.py record`.

## Changes
- Relative `.md`/`.markdown` links retain hrefs and receive renderer-generated navigation metadata after sanitization. Their targets resolve against the backend-returned canonical original file path, not the app URL or workspace. Parent-directory links, percent-encoded filenames, uppercase extensions, and files outside the workspace work through the existing explicit-absolute-path read API.
- Delegated reader click/auxclick handling prevents browser navigation and opens the target in the existing reader. Chat remains mounted; open-path persistence, refresh, loading, errors, and retry reuse the existing lifecycle. Modifier-clicks also stay in the reader.
- HTTP(S)/mailto links retain explicit `_blank` and `noopener noreferrer` behavior. Other unsupported links remain inert. Sanitization still removes document-supplied navigation metadata, scripts, event handlers, embedded resources, images, styles, and other automatic resource-loading capabilities.
- No backend production changes: file type, canonical/symlink resolution, workspace-relative containment, UTF-8, size, and read-only checks remain in place. No imported copies or document metadata are created. Added a short wiki review entry distinguishing prompted repair from first-transfer evidence.

## Validation observed
- `make check`: passed (ruff, formatting, wiki lint, TypeScript).
- `env -u WEB_PORT make test`: passed, 57 Python tests and 23 frontend tests.
- `make build`: passed.
- `git diff --check`: passed; working tree clean after commit.
- New JSDOM/React tests cover nested-link clicks, canonical document-relative targets, repeated navigation, encoded filenames, parent directories, chat DOM/draft preservation while busy, missing-target errors/retry, and external-link attributes. Renderer tests cover rejected schemes/paths, malformed encoding, forged metadata, and resource stripping. A TestClient test reads linked originals outside the workspace, observes changes in place, and checks no imports/writes from reads. Existing boundary/chat tests also pass.
- Initial validation stopped on formatting of the added Python test; corrected it. Initial plain `make test` had one unrelated failure because the inherited environment sets `WEB_PORT=5174` while `test_local_security` expects 5173. Unsetting that variable made the full suite pass; no production security changes were made. A FastAPI/Starlette TestClient deprecation warning remains.

## Limitations and evidence boundary
No live browser or real-provider chat acceptance was rerun; frontend evidence is JSDOM with mocked file fetches, and actual file reads are separately exercised through TestClient. Existing chat preservation beyond these tests is inferred from keeping chat mounted and leaving its implementation untouched, not newly established through a live run.

Fragments and query strings on relative Markdown links are ignored when selecting the file; heading scrolling is not implemented. Fragment-only links, absolute local links, file: links, and non-Markdown local links remain inert. There is no document navigation history/back UI. Browser context-menu commands such as “Open link in new tab” are not routed through the reader (hrefs remain document-relative); normal, keyboard-generated click, modifier-click, and middle-click event handling uses the reader, though only normal and modifier-click paths were specifically exercised in the new lifecycle test. Resolution follows this POSIX checkout's original-path convention; Windows drive-path support was not added.

## Lesson
Passing rendering/sanitization checks did not establish usable navigation: the prior sanitizer intentionally removed the capability. The repair tests the missing capability directly while keeping sanitization and read-only boundaries explicit. No adaptation-description hardening or independent-transfer claim is justified by this prompted repair alone.
