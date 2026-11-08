"""Read-only discovery of this workspace's Pi-owned session files."""

import json
import re
from datetime import UTC, datetime
from pathlib import Path

from backend.pi import ROOT, SESSION_DIR


def title(messages):
    for message in messages:
        if message.get("role") == "user":
            content = message.get("content", "")
            text = (
                content
                if isinstance(content, str)
                else " ".join(block.get("text", "") for block in content if isinstance(block, dict))
            )
            return " ".join(text.split())[:100] or "New chat"
    return "New chat"


def saved_sessions():
    sessions = {}
    for path in SESSION_DIR.glob("*.jsonl"):
        if path.is_symlink() or not path.is_file():
            continue
        try:
            with path.open() as stream:
                header = json.loads(stream.readline(16_384))
                session_id = header.get("id")
                if (
                    header.get("type") != "session"
                    or not isinstance(session_id, str)
                    or not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9._-]*", session_id)
                    or Path(header.get("cwd", "")).resolve() != ROOT.resolve()
                ):
                    continue
                name = "New chat"
                for line in stream:
                    try:
                        entry = json.loads(line)
                    except ValueError:
                        continue  # A currently appended final line may be incomplete.
                    message = entry.get("message", {})
                    if message.get("role") == "user":
                        name = title([message])
                        break
            updated = datetime.fromtimestamp(path.stat().st_mtime, UTC).isoformat()
            record = {"id": session_id, "title": name, "updatedAt": updated, "path": path}
            if session_id not in sessions or updated > sessions[session_id]["updatedAt"]:
                sessions[session_id] = record
        except (OSError, ValueError, TypeError, AttributeError):
            continue
    return sorted(sessions.values(), key=lambda record: record["updatedAt"], reverse=True)


def session_file(session_id):
    return next((record["path"] for record in saved_sessions() if record["id"] == session_id), None)
