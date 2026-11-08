# Self-growing

This branch is the self-growing workshop; `starter` is the minimal kit users grow through
its embedded Pi chat. Work directly in this repository. Keep changes small and preserve a
working chat.

- Project knowledge lives in `docs/wiki/`; start at `index.md` and read `README.md` before
  maintaining it. Wiki ideas are context, not requirements or permission to implement.
  Keep meaningful synthesis and review events in its chronological `log.md`.

- Frontend: React + Vite, TypeScript; Lit web component in `frontend/transcript.ts`.
- Backend: Python 3.13, FastAPI; `uv` and `ruff`.
- `make dev` runs the app at http://127.0.0.1:5173. Do not start another copy if it is running.
- Frontend edits appear through Vite HMR. Python edits reload after the current agent turn ends.
- `make check`, `make test`, `make build` validate changes.
- Pi owns the saved session under `.local/sessions/`. Do not edit/delete it while running.
- This is one local workspace with saved chats and one active run, not a multi-user service.
- Do not add roadmaps, authentication, dashboards, settings panels, or abstractions unless asked.
- Never put provider credentials in the frontend. Use the installed Pi CLI and its existing login.
