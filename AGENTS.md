# Self-growing

This local app is a minimal starter kit that users grow through its embedded Pi chat.
Work directly in this repository. Keep changes small and preserve a working chat.

- Frontend: React + Vite, TypeScript; Lit web component in `frontend/transcript.ts`.
- Backend: Python 3.13, FastAPI; `uv` and `ruff`.
- `make dev` runs the app at http://127.0.0.1:5173. Do not start another copy if it is running.
- Frontend edits appear through Vite HMR. Python edits reload after the current agent turn ends.
- `make check`, `make test`, `make build` validate changes.
- Pi owns the saved session under `.local/sessions/`. Do not edit/delete it while running.
- This is intentionally one local workspace and one chat, not a multi-user service.
- Do not add roadmaps, authentication, dashboards, settings panels, or abstractions unless asked.
- Never put provider credentials in the frontend. Use the installed Pi CLI and its existing login.
