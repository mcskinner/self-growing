# Application feedback

## Outcome
Implemented and committed in the specified target worktree as `788274c` (`Add selected document passages to the chat draft explicitly`). Working tree clean after commit. Skill/tooling preserved; no backend, navigation, renderer, or document-write changes.

The reader exposes a transient accessible “Add to chat” button beside a nonblank in-article selection. Activation appends an attributed editable blockquote to the current conversation draft and focuses its end. It uses the existing draft persistence and 100,000-character limit; overflow rejects the whole insertion with an explanation. Selection alone never inserts; quoting never invokes the queue/send/steering path. Escape, outside pointer interaction, scrolling/resizing, reload, document changes, and close dismiss the action.

## Observed checks
- `make check`: passed (Ruff, formatting, wiki lint, TypeScript).
- `make test`: passed, 55 Python tests and 22 TypeScript tests, including three new formatter/limit tests. One existing Starlette/httpx deprecation warning.
- `make build`: passed; repeated after final frontend change.
- `node tests/quote-browser.mjs`: passed against the isolated production build with all API traffic mocked, using installed headless Google Chrome at 1440×1000 and 390×1000. The fixture explicitly measures the label's DOM Range: one rendered line, nonzero width, fully inside the button's padded bounds; also checks viewport containment.
- Browser fixture additionally observed real pointer selection, unchanged draft before activation and after Escape, keyboard activation, correct source path/text, composer focus, reload persistence, repeated quotes while busy with zero chat requests, whole-insertion overflow rejection, navigation attribution and action invalidation, close invalidation, and exactly one request only after explicit Enter send.
- `git diff --check`: passed before commit.

## Lessons
The small handoff fits this target without the reference patch's unrelated drawer or backend access changes. The existing composer owns draft state and persistence, so its imperative quote handler can remain entirely separate from sending. Global button styling fixes width to 36px: an explicit content-sized, nonwrapping quote-button rule is necessary, and rendered text geometry—not button bounds alone—verifies the label fits.

The first browser run found the popover overlapping the next link; the navigation test now activates that link by keyboard while a selection is active, explicitly exercising navigation invalidation. Pointer users can dismiss with Escape or click outside before following an overlapped link. A later narrow run exposed a fixture race with the existing busy-triggered document reload; the test now waits for reload completion rather than selecting a detached article.

## Gaps / checks not performed
- No development app/backend stack started and no live provider calls made. Real-agent delivery/steering is not tested; no-send assertions inspect mocked chat requests.
- No Safari, Firefox, touch-native selection handles, screen reader, zoom/font-scaling, or complex table/code/multiparagraph visual checks. Chromium/Chrome fixture results do not establish those behaviors.
- Chat-switch-in-progress rejection is implemented but not exercised in the browser fixture. External composer selection exclusion and blank selection are guarded in code; blank formatting is unit-tested, but neither has a dedicated browser scenario.
- Playwright was installed locally without manifest/lockfile changes. Its bundled Chromium installation failed because this machine is mac12-arm64; the successful fixture runs used installed Google Chrome. Reproduction requires optional Playwright plus Chrome (override path with `CHROME_PATH`).
- No screenshot/manual visual review performed; layout evidence is automated rendered geometry. No separate adaptation record/evaluation artifacts generated; this feedback reports executed checks directly.

## Inputs consulted
Frozen adaptation brief and evidence, local adapt skill, wiki index, and ordinary target code/tests. Reference patch was not needed. No other application histories, saved chats, coordinator verification files, or other workshop checkouts inspected.
