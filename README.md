# Self-growing

A small web app you can change by talking to it. One chat, one local workspace, no database.

## Start

You need [uv](https://docs.astral.sh/uv/), Node.js 22.19+, and **Pi 1.5.0+** on your PATH.
The RPC integration is tested with Pi 1.5.0.

1. Install [Pi](https://pi.dev), run `pi`, and use `/login` to connect your provider/subscription.
2. Run `make dev` in this directory. It installs locked dependencies and starts both servers.
3. Open the URL printed in the terminal (normally **http://127.0.0.1:5173**) and ask for a change.

For example: “Turn this into a simple meal planner, keeping the chat available.”

Pi uses its existing credentials and default model. Nothing secret goes into the browser.
To choose a model explicitly:

```sh
PI_MODEL='your-provider/your-model' make dev
```

Occupied default ports are skipped automatically. To require specific ports instead:

```sh
WEB_PORT=5177 API_PORT=8107 make dev
```

`PI_BIN` can point to a different Pi executable. Python is pinned to the 3.13 series;
uv can install it if needed. Ctrl+C stops the dev servers.

## How it works

- **React + Vite** provide the app shell and live frontend updates.
- A small **Lit web component** renders Markdown replies. Thinking and tool activity are
  hidden by default; enable them under **Chat display**. Errors stay visible.
  This is a purpose-built RPC mirror, not the full `pi-web-ui` package or a terminal emulator.
- **FastAPI** starts `pi --mode rpc` in this repository for each turn. Pi resumes the
  same session, runs its normal coding tools, and exits after `agent_settled`.
  An additional short-lived process restores history when the backend starts.
- **Server-sent events** mirror the current conversation to the browser. Refreshing or
  disconnecting the browser does not stop the turn. Send while Pi is working to steer it
  at the next tool/turn boundary. Stop explicitly with the square button; undelivered
  steering is returned to a paused outbox.
- **Pi's session files** in `.local/sessions/` hold conversation state. There is no second
  conversation database and no agent process kept alive between sends. **New chat** starts
  a fresh session without deleting the old one; `.local/active-session` remembers the selection.
  The context meter shows Pi's reported usage, updated after replies and compaction.
- **`scripts/dev.py`** watches Python files and restarts the backend only after a turn
  finishes. React/CSS edits hot-update; web component edits reload the page. Drafts survive
  page reloads, along with the cursor position and input focus. An in-flight message whose
  delivery cannot be confirmed is held for explicit retry, never silently resent after a reload.
  Changes to dependencies or dev-server configuration require restarting `make dev`.

The browser is deliberately just a view: Pi—not a browser-side agent—owns tool execution,
provider access, retries, compaction, and context. `AGENTS.md` tells it how this app works.

## Commands

```sh
make dev      # Install dependencies and start both dev servers
make check    # Ruff lint/format checks + TypeScript
make test     # Backend and frontend logic tests (no model calls)
make build    # Type-check and build the frontend
make format   # Format/lint-fix Python
```

## Intentionally limited

This is **trusted, local-only software**, not a hosted service. The agent can run arbitrary
commands with your user permissions, including outside this repository. Loopback binding,
Host checks, and Origin checks reduce browser attacks; they are not a sandbox. Do not expose
these servers through a tunnel or public interface. Use Git to review and recover changes.
Project-local Pi resources are explicitly trusted (`--approve`).

One shared session, one turn at a time. No accounts, session picker, uploads, model picker,
artifacts panel, or project management. Unsupported extension dialogs are cancelled rather
than silently approved. TUI-only slash commands aren't supported; configure/login using Pi
in your terminal. After compaction, a backend restart shows Pi's current conversation context,
not an archival transcript. Stopping the whole dev server interrupts active work; completed
messages remain saved. Use **New chat** for a fresh conversation; old sessions remain in
`.local/sessions/` and can be resumed through Pi's terminal session picker while the app is stopped.

`make build` produces static assets only; production hosting is deliberately not included.
