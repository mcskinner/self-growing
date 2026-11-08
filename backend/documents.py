"""Read original Markdown files without imports, metadata, or document writes."""

import asyncio
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/documents")
ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 2_000_000


def document_path(path: str) -> Path:
    try:
        supplied = Path(path)
        target = (ROOT / supplied).resolve()
        if not supplied.is_absolute() and not target.is_relative_to(ROOT.resolve()):
            raise HTTPException(404, "Markdown document not found")
        if target.suffix.lower() not in {".md", ".markdown"} or not target.is_file():
            raise HTTPException(404, "Markdown document not found")
        return target
    except (OSError, ValueError, RuntimeError):
        raise HTTPException(404, "Markdown document not found") from None


def read_document(target: Path):
    try:
        with target.open("rb") as file:
            data = file.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise HTTPException(413, "Document is too large (maximum 2 MB)")
        return {"path": str(target), "content": data.decode("utf-8")}
    except UnicodeDecodeError:
        raise HTTPException(422, "Document is not UTF-8 text") from None
    except OSError:
        raise HTTPException(404, "Cannot read Markdown document") from None


async def choose_markdown_file():
    if sys.platform != "darwin":
        raise HTTPException(501, "The native file chooser currently supports macOS only")
    script = """try
        set picked to choose file with prompt "Open Markdown" of type {"md", "markdown"}
        return POSIX path of picked
    on error number -128
        return ""
    end try"""
    process = await asyncio.create_subprocess_exec(
        "/usr/bin/osascript",
        "-e",
        script,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        async with asyncio.timeout(300):
            stdout, stderr = await process.communicate()
    except TimeoutError:
        raise HTTPException(504, "File chooser timed out; please retry") from None
    finally:
        if process.returncode is None:
            process.kill()
            await process.wait()
    if process.returncode:
        raise HTTPException(500, f"Could not open file chooser: {stderr.decode().strip()}")
    return stdout.decode().rstrip("\r\n")


@router.post("/pick")
async def pick_document():
    selected = await choose_markdown_file()
    if not selected:
        return {"path": None}
    return {"path": read_document(document_path(selected))["path"]}


@router.get("/content")
async def get_document(path: str):
    return read_document(document_path(path))


@router.get("/resolve")
async def resolve_document(path: str, link: str):
    try:
        url = urlsplit(link)
        if url.scheme or url.netloc or not url.path:
            raise ValueError
        current = document_path(path)
        relative = Path(unquote(url.path))
        target = (current.parent / relative).resolve()
        if not Path(path).is_absolute() and not target.is_relative_to(ROOT.resolve()):
            raise ValueError
    except (ValueError, OSError, RuntimeError):
        raise HTTPException(422, "Invalid document link") from None
    return {"path": read_document(document_path(str(target)))["path"]}
