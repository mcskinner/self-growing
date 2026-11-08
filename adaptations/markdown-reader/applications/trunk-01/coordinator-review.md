# Coordinator review: first blind workshop application

Frozen first implementation: 2db3e08f9cc4910bf27e37aeed863f046ecd9af5, based on 233ef73. Model: openai-codex/gpt-6.1-sol. Fresh Pi session; no surrounding discussion or previous application results supplied. Prompt and frozen inputs are preserved. Existing skill/tooling were unchanged.

## Outcome

The existing record/evaluate commands completed without repair; check/test/build passed. This establishes the mechanics on a diverged target, not full acceptance.

Independent coordinator verification against the production build in headless Chromium passed 7 of 8 grouped scenarios: opening/readable/inert Markdown with preserved draft; settings menu; desktop resizing/overflow; reload/cancel/error/retry; mocked chat send/response/steer/stop and post-work refresh; narrow viewport; and no page JavaScript errors.

**Failed:** relative Markdown-link navigation. Links are stripped of href, so users cannot traverse the linked project wiki without manually opening each file. This was in the prospective protocol's intended evaluation but not in the distilled description, whose evidence explicitly documented the source limitation. No preemptive correction was made.

## Evidence and limitations

coordinator-acceptance.mjs and coordinator-browser.json/log preserve the executed check. The original first version and its result are also retained; a subsequent test-only refinement checks distinct next-document content and resolved API requests rather than only storage state. Both versions fail on the same missing-link behavior. No target code changed between them.

The browser harness intercepts all requests and mocks document API/chat/SSE. It starts no app server, contacts no running app, opens no native dialog, and makes no provider call. Backend tests independently exercise actual temporary file reads, but no live-provider or real native chooser acceptance is claimed. No screenshots were needed for these assertions.

## Repairs / effort

No coordinator coaching or code repair within this first application. The applier autonomously fixed inherited WEB_PORT test failure by unsetting it, test JSX runtime setup, and CSS whitespace. It added jsdom/tsx dev dependencies for tests. Its own feedback lists these interventions and remaining gaps.

A separate repair attempt starts from this commit and receives the observed relative-link failure. It is explicitly not another blind first transfer. The original branch, description, input snapshot, applier feedback, and evaluation remain intact.
