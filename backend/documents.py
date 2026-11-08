"""Read original local Markdown files; never import or write document state."""

import asyncio
import stat
import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/documents")
MAX_BYTES = 2_000_000


def read_document(value: str):
    try:
        requested = Path(value).expanduser()
        path = requested.resolve()
        if not requested.is_absolute() and not path.is_relative_to(Path.cwd().resolve()):
            raise HTTPException(403, "Relative path leaves the workspace")
        if path.suffix.lower() not in {".md", ".markdown"}:
            raise HTTPException(422, "Choose a .md or .markdown file")
        if not stat.S_ISREG(path.stat().st_mode):
            raise HTTPException(422, "Choose a regular Markdown file")
        with path.open("rb") as source:
            data = source.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise HTTPException(413, "Markdown files must be at most 2 MB")
        return {"path": str(path), "name": path.name, "content": data.decode("utf-8")}
    except UnicodeDecodeError as exc:
        raise HTTPException(422, "Markdown must be UTF-8") from exc
    except (OSError, ValueError) as exc:
        raise HTTPException(404, "Cannot read this Markdown file") from exc


@router.get("")
def content(path: str = Query(min_length=1, max_length=4096)):
    return read_document(path)


async def choose_markdown_file():
    if sys.platform != "darwin":
        raise HTTPException(501, "Native chooser unavailable; enter a local path instead")
    process = await asyncio.create_subprocess_exec(
        "osascript",
        "-e",
        'try\nPOSIX path of (choose file with prompt "Open Markdown" '
        'of type {"md", "markdown"})\non error number -128\nreturn ""\nend try',
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, _ = await asyncio.wait_for(process.communicate(), timeout=120)
    except (TimeoutError, asyncio.CancelledError):
        process.kill()
        await process.wait()
        raise
    if process.returncode:
        raise HTTPException(503, "File chooser failed; enter a local path instead")
    return stdout.decode("utf-8").strip() or None


@router.post("/choose")
async def choose():
    try:
        path = await choose_markdown_file()
    except TimeoutError as exc:
        raise HTTPException(408, "File chooser timed out; try again") from exc
    except OSError as exc:
        raise HTTPException(503, "File chooser unavailable; enter a local path instead") from exc
    return {"path": path}
