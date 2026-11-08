# Issue #1: Pi coding-agent SDK host investigation

**Recommendation:** Node is a viable replacement when browser-guided OAuth is a
priority, but keep FastAPI + CLI RPC as the default until this prototype has had
an interactive provider-login/run trial. Do not add Node alongside Python in the
normal launcher. SDK adoption does **not** justify replacing our transcript with
`pi-web-ui`.

This opt-in spike uses `@earendil-works/pi-coding-agent@1.5.0`, not bare
`pi-agent-core`. It leaves `backend/`, `scripts/dev.py`, `install.sh`, and the normal
frontend dependencies untouched. `trunk` and `starter-kit` were identical at the
starting commit, `e40eeac`.

## Try it

Requires Node >=22.19 (tested with 22.23.2). Bun is not installed here and has **not**
been validated. Prefer Node: it is already provisioned by the app installer.

```sh
cd experiments/pi-sdk
npm ci --ignore-scripts
npm run check
npm test
WEB_PORT=5175 SDK_PORT=8787 npm start
```

Open **http://127.0.0.1:8787/auth** for the minimal OAuth page. It uses the existing
Pi agent directory and credentials (`~/.pi/agent`, or `PI_CODING_AGENT_DIR`). A
successful login deliberately updates Pi's normal credential store server-side.
Do not log in concurrently through the CLI. API-key entry remains terminal-only
(`pi`, then `/login`); browser secret prompts are rejected.

For the existing chat UI, stop the regular app first; do **not** start another
copy of its dev launcher. In another terminal, from this worktree's repository
root:

```sh
npm ci
API_PORT=8787 npm run dev -- --port 5175
```

Open http://127.0.0.1:5175. Only Vite and the SDK host run in this experiment, not
Python. Stop both with Ctrl+C. The host deliberately has no file watcher: restart
it only after a turn finishes. Do not run two prototype hosts against the same
state directory.

Prototype JSONL sessions and its active-session pointer live under
`.local/sdk-prototype/`, separate from the running application's `.local/sessions/`.
`SDK_STATE_DIR` can override the prototype directory. There is no automatic import
or mutation of existing application sessions. Pi's `SessionManager` writes JSONL;
only the active-session pointer is application-owned. An empty chat has no JSONL
file until Pi persists a response, so an empty restart may get a fresh ID.

## Findings and coverage

| Requirement | SDK boundary / prototype behavior | Evidence / caveat |
|---|---|---|
| Existing login/config | One shared `ModelRuntime.create()`; normal file-backed settings | HTTP test uses an isolated agent directory; real credentials never inspected or printed |
| Browser-guided login | Server-side `ModelRuntime.login(provider, 'oauth', interaction)`; links, device codes, text/select/manual-code prompts | Adapter tests cover cancellation, callback races, secret rejection, stale answers, URL schemes, and non-disclosure. A real `ModelRuntime.login` test with a fake OAuth provider verifies server-side credential persistence; **no real account authorization performed** |
| Coding tools | Default SDK tools, workspace `cwd` | Real SDK test finds read/bash/edit/write; an offline-provider run executes the real read tool and receives its file contents |
| AGENTS.md/resources | `DefaultResourceLoader`, normal settings, explicit trust matching existing `--approve` | Real SDK test discovers AGENTS.md, a project skill/template, and trusted default-tool settings |
| MCP/codemode/tool search | Explicit `createMcpExtension`, `createCodemodeExtension`, `createToolSearchExtension`, then `bindExtensions({mode: 'rpc'})` | Real SDK test verifies tool registration and configured activation; **no live MCP server exercised** |
| JSONL/restore | `SessionManager.create/open/findById` | Real SDK round-trip test; HTTP test boots twice with isolated state |
| Steering/stop | `prompt(..., {streamingBehavior: 'steer'})`, `clearQueue()`, `abort()` | Offline provider tests verify started/queued receipts before completion, steering delivery, queue clearing, and aborting an active request; **not tested with a live provider** |
| Compaction/retries | Owned by `AgentSession`; prompt promise covers automatic recovery; do not treat `agent_end` as idle | Offline provider tests induce retry recovery and exhaustion, verify settled ordering, and run manual compaction through the same runtime into persisted JSONL; **automatic overflow/threshold compaction not induced** |
| Context meter | `session.getContextUsage()` in snapshots | Offline response test verifies SDK usage accounting (110 tokens) through the meter interface; **not measured on a live reply** |
| New chat | Fresh SDK session and atomic pointer replacement, old JSONL untouched | HTTP test covers it; see lifecycle limitation below |
| HTTP contract | Existing state/SSE/chat/new/stop/prepare-reload routes | HTTP smoke tests state/SSE/new/stop/reload, validation, Host/Origin/cross-site rejection; no browser automation |

### Important adaptation costs

- SDK `prompt()` resolves when the run finishes, not when input is accepted. The
  existing browser queue needs an immediate `started`/`queued`/`handled` receipt to
  avoid accidental duplicate delivery. The spike uses `PromptOptions.preflightResult`,
  which 1.5.0 explicitly labels **internal**, as RPC itself does. Pin/test this hook
  or establish a supported acceptance boundary before migrating. A timeout remains
  explicitly uncertain; it is not permission to replay a prompt.
- `DefaultResourceLoader.reload()` reloads file-backed settings. Apply transient
  `SettingsManager.applyOverrides()` **after** reload; tests initially lost their
  retry/compaction overrides when applied before it. Ordinary persisted settings
  are unaffected.
- New chat recreates the session/resources and rebinds subscriptions, but this
  minimal implementation does not reproduce cancellable session-switch extension
  hooks. `AgentSessionRuntime` is the supported boundary for full new/switch/fork
  lifecycle semantics; adopting it requires rebinding session-local listeners.
- Built-ins are registered using the SDK example's extension factories, not the
  CLI's entire built-in extension assembly. Settings-driven activation works;
  CLI built-in disable/replacement policy still needs parity testing with installed
  extensions. Noninteractive extension dialogs are not implicitly approved.
- Our normal launcher defers Python reloads until idle. Replacing it needs equivalent
  Node lifecycle coordination, not `node --watch` that kills a working agent. The
  installer would retain Node/Pi configuration compatibility but remove the Python/uv
  requirement only once the backend actually changes. No launcher changes are made
  by this spike.
- `markdown-comments` adds a FastAPI router (`backend/documents.py`, 237 lines) and
  document tests. Its frontend can keep the existing `/api/documents` contract, but
  its backend must be ported and its path/symlink/file-size/annotation invariants
  retested before that branch can move to Node. It is not preserved by merely
  swapping the starter backend. Neither downstream branch is modified here.

## Why not drop in pi-web-ui?

Inspected the published `@earendil-works/pi-web-ui@0.75.3` tarball (README,
`ChatPanel.d.ts`, `components/AgentInterface.d.ts` and implementation). The current
coding-agent SDK is **1.5.0**, while web-ui depends on `pi-ai ^0.75.3`; sharing a
package prefix or Lit version does not establish compatibility.

`ChatPanel.setAgent()` and `AgentInterface.session` expect a browser-side
`pi-agent-core.Agent`. The component subscribes to it, accesses/mutates its state,
calls prompt/abort, configures streaming, and consults browser provider-key storage.
A server-side `AgentSession` over our SSE snapshots is not that object. Passing
`session.agent` into a browser is neither a transport implementation nor a safe
credential boundary, and bypasses coding-agent lifecycle behavior.

Individual presentation components might be reusable with version alignment and
a deliberate remote adapter, but the chat panel is **not drop-in**. Its dependency
surface also includes document/archive/model-client libraries unrelated to this
starter. Keep the current small Lit transcript and React composer for this change.

## Validation

- `npm run check && npm test` here: 14 passing prototype tests; no paid model calls,
  real-account OAuth authorization, or container/isolation work.
- Repository `make check`, `make test`, `make build` pass. For tests invoked from the
  embedded agent, unset inherited `WEB_PORT` (`env -u WEB_PORT make test`): an existing
  Python security test assumes the default port 5173.

The result supports a **conditional Node migration**, not an automatic switch.
Core SDK lifecycle behavior now has deterministic offline coverage; interactive
OAuth, a live-model coding run, live MCP, and automatic compaction still need
an integration trial, and the receipt/session-switch gaps remain. Until then CLI
RPC remains the working default.

The investigation branch also carries the separately verified live chat fixes:
scrolling up cancels bottom-follow, failed tool output follows the details toggle,
and recovered provider retries do not surface as actionable or duplicate errors.
Those are presentation fixes shared by both hosts; they do not alter Pi's retry
engine or saved history.
