# Self-growing

An experimental approach to growing software with AI agents.

Start with a small local app and grow it through its embedded Pi chat. The agent changes
the same app you're using. One active chat at a time, one local workspace, no database.

- **`trunk` / `starter-kit`**: the minimal starting point, including the chat and local launcher.
- **[`markdown-comments`](https://github.com/mcskinner/self-growing/tree/markdown-comments)**:
  an example grown from the starter—a Markdown viewer with text annotations and side-by-side chat.

The installer below launches the starter kit, not the Markdown-review example.

## Start

The installer can clone the repository and launch the stack for you:

```sh
curl -fsSL https://raw.githubusercontent.com/mcskinner/self-growing/starter-kit/install.sh | sh
```

The installer clones [`mcskinner/self-growing`](https://github.com/mcskinner/self-growing).
It needs Git and uses `~/.local/share/self-growing` by default; pass `--dir PATH`
to choose another directory. Repeated runs reuse that checkout without pulling updates,
switching branches, or overwriting local edits. Only pipe installer code you trust into a shell;
you can download and inspect the script first instead.

Already have a checkout? Run `./install.sh` there—no repository URL is needed.

On **macOS or Linux (including WSL)**, the launcher reuses installed tools or provisions
missing Node.js, [uv](https://docs.astral.sh/uv/), and [Pi](https://pi.dev) under the gitignored
`.local/tools/` directory. No `sudo`, Python installation, `make`, or shell-profile changes
are required. Downloads require internet access, `curl`, and `tar`; Node downloads are
SHA-256 checked. The launcher runs uv's official installer and npm package install scripts,
so only run it from a repository you trust.

If Pi was just installed, it opens for interactive setup: use `/login`, then **Ctrl+D** to
continue. The app opens in your browser once both servers are ready. Keep the terminal
open; **Ctrl+C** stops the stack. Running the launcher again reuses an instance already
started by this launcher in the same checkout instead of reinstalling its dependencies.

Already installed Pi? Its existing login is reused. Use `./install.sh --login` to open Pi's
login flow first, or `./install.sh --no-login` when credentials are already configured.
`./install.sh --no-open` starts without opening a browser. The piped installer accepts the
same flags, plus `--branch REF` (default: `starter-kit`), `--dir PATH`, and `--repo URL` for forks. The local installs are reused on
later launches; run `./install.sh` again after closing the terminal.

Prefer starting with Pi? Install Pi, log in, open this checkout in Pi, and ask it to help
run `./install.sh --no-login`. No browser-side provider credentials are needed.
With uv, Node.js 22.19+, and Pi already on your PATH, `make dev` remains available.
The RPC integration is tested with Pi 1.5.0; that is the launcher's pinned Pi version.

For example: “Turn this into a simple meal planner, keeping the chat available.”

Pi uses its existing credentials and default model. Nothing secret goes into the browser.
To choose a model explicitly:

```sh
PI_MODEL='your-provider/your-model' ./install.sh
```

Occupied default ports are skipped automatically. To require specific ports instead:

```sh
WEB_PORT=5177 API_PORT=8107 ./install.sh
```

`PI_BIN` can point to a different Pi executable. Python is pinned to the 3.13 series;
uv can install it if needed. Ctrl+C stops the dev servers.

## How it works

- **React + Vite** provide the app shell and live frontend updates.
- A small **Lit web component** renders Markdown replies. Thinking and tool activity are
  hidden by default; enable them under **Chat display**. Only unrecovered provider failures
  are shown as errors; internal retry attempts stay out of the way.
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
  **Chats** opens a recent-conversations drawer, titled from each conversation's first message.
  Switching is available when idle, with no unsent messages. Each chat keeps its own browser-tab
  draft and outbox; refreshing reopens the selected conversation. Saved session files are read
  for discovery, but only Pi changes their contents.
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
./install.sh  # Provision missing tools, install dependencies, and open the local app
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

One selected conversation and one turn at a time; no background agents. No accounts, uploads, model picker,
artifacts panel, or project management. Unsupported extension dialogs are cancelled rather
than silently approved. TUI-only slash commands aren't supported; configure/login using Pi
in your terminal. After compaction, a backend restart shows Pi's current conversation context,
not an archival transcript. Stopping the whole dev server interrupts active work; completed
messages remain saved. Use **New chat** for a fresh conversation or **Chats** to reopen an older
one. Search, rename, deletion, and branching are intentionally not part of the history drawer.

`make build` produces static assets only; production hosting is deliberately not included.
