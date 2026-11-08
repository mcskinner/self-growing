# Markdown-reader verification recipe

Added **after** the first blind applications; not part of their frozen inputs. This is an initial portable acceptance recipe, not a claim of exhaustive coverage or a fixed Playwright implementation.

## Arrange

Use a fresh browser context against the target build. Prepare two UTF-8 Markdown fixtures in one directory: an index with a relative link to `next.md`, and a distinctly titled next document. Include representative headings, lists, quotes, a table, a long code line, and enough text to scroll. Include inert attack fixtures such as a remote image and script; assert their effects/resources are absent. Never use private content for published evidence.

For deterministic UI tests, intercept document API and chat/SSE requests or use a fake backend. State explicitly what is simulated. Separately check real file reads, path validation, and non-modification against the backend. A mock API does not verify filesystem behavior. Do not claim a live provider run from mocked responses.

## Act and assert

1. Enter a chat draft. Open the index document through the target's user-facing path/picker controls. Assert the expected title, readable representative markup, visible chat, and the unchanged draft.
2. Exercise the existing menu/settings controls with the reader open. Assert the menu can be opened/closed and its controls reached.
3. On desktop, resize with pointer and keyboard. Assert the split changes, the document scrolls independently, wide content is contained, and the composer remains reachable.
4. Follow `next.md`. Assert a read of the resolved next file, its distinct title in the reader, and preserved chat/draft without top-level app navigation. This was the observed gap in the initial transfers; choosing another file manually is not an equivalent check.
5. Cancel a file choice, replace/close/reopen the document, and reload. Assert cancellation leaves the current document intact, close restores chat, and intended path/width persistence works. Induce a read error, retry, and assert recovery.
6. Send a message; assert the outgoing request and a displayed response. Exercise steering/stop while busy. Label simulated responses. Emit an agent-work completion after changing the document fixture; assert refreshed content. Check conversation switching independently where the target supports it.
7. Repeat key reading/composer/menu actions at a narrow viewport. Assert no page-level horizontal overflow and actual reachability, not merely DOM presence. Check page JavaScript errors and unexpected resource requests.

## Report

Keep the executed script, target commit, environment/fixture assumptions, command, and per-scenario results. Mark skipped checks and failures. Screenshots are optional diagnostic evidence, not the main proof. Translate selectors and setup to the target rather than prescribing source component names or routes. Actual native-dialog behavior and live chat require separate observations; do not silently substitute mocks.
