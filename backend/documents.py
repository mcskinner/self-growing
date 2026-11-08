"""Open original Markdown files and keep review annotations inside them."""

import asyncio
import json
import os
import re
import sys
import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ValidationError

router = APIRouter(prefix="/api/documents")
ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {"node_modules", "dist", "__pycache__"}
MARKER = "<!-- markdown-review:v1\n"
REVIEW_BLOCK = re.compile(r"<!-- markdown-review:v1\r?\n(.*?)\r?\n-->\s*\Z", re.DOTALL)


class TextAnchor(BaseModel):
    start: int = Field(ge=0)
    end: int = Field(ge=0)
    prefix: str = Field(default="", max_length=48)
    suffix: str = Field(default="", max_length=48)


class Comment(BaseModel):
    text: str = Field(min_length=1, max_length=20_000)
    quote: str = Field(default="", max_length=10_000)
    anchor: TextAnchor | None = None


class SavedComment(Comment):
    id: str = Field(min_length=1, max_length=128)
    resolved: bool = False


def document_path(path: str) -> Path:
    supplied = Path(path)
    target = (ROOT / supplied).resolve()
    if not supplied.is_absolute() and (
        any(part.startswith(".") or part in EXCLUDED for part in supplied.parts)
        or not target.is_relative_to(ROOT.resolve())
        or any(
            part.startswith(".") or part in EXCLUDED
            for part in target.relative_to(ROOT.resolve()).parts
        )
    ):
        raise HTTPException(404, "Markdown document not found")
    if target.suffix.lower() not in {".md", ".markdown"} or not target.is_file():
        raise HTTPException(404, "Markdown document not found")
    if target.stat().st_size > 2_000_000:
        raise HTTPException(413, "Document is too large (maximum 2 MB)")
    return target


def legacy_comments(target: Path):
    """Read old reviews as a fallback; never migrate or write merely by opening a file."""
    file = ROOT / ".local" / "reviews.json"
    if not target.is_relative_to(ROOT.resolve()) or not file.exists():
        return []
    reviews = json.loads(file.read_text())
    return reviews.get(target.relative_to(ROOT.resolve()).as_posix(), [])


def read_document(target: Path):
    original = target.read_bytes()
    try:
        source = original.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(422, "Document is not UTF-8 text") from None
    match = REVIEW_BLOCK.search(source)
    if match:
        try:
            data = json.loads(match[1])
            comments = [SavedComment.model_validate(item).model_dump() for item in data["comments"]]
        except (ValueError, KeyError, TypeError, ValidationError):
            raise HTTPException(
                422, "Review metadata is invalid; the file was not changed"
            ) from None
        return original, source[: match.start()], comments, match.start(), "embedded"
    if "<!-- markdown-review:" in source:
        raise HTTPException(
            422, "Review metadata is unsupported or misplaced; the file was not changed"
        )
    comments = legacy_comments(target)
    return original, source, comments, None, "legacy" if comments else "embedded"


def write_comments(target: Path, original: bytes, source: str, comments: list, start: int | None):
    # Escape HTML-comment delimiters while keeping the payload valid, readable JSON.
    payload = json.dumps({"comments": comments}, ensure_ascii=False, indent=2)
    payload = payload.replace("-", "\\u002d").replace("<", "\\u003c").replace(">", "\\u003e")
    newline = "\r\n" if "\r\n" in source else "\n"
    separator = "" if start is not None else (newline if source.endswith("\n") else newline * 2)
    block = (MARKER + payload + "\n-->\n").replace("\n", newline)
    updated = (source + separator + block).encode("utf-8")
    if len(updated) > 2_000_000:
        raise HTTPException(413, "Document with annotations exceeds 2 MB")
    temporary = None
    try:
        # Respect read-only documents, even when their parent directory is writable.
        if not os.access(target, os.W_OK):
            raise HTTPException(403, "Document is read-only")
        with tempfile.NamedTemporaryFile(
            dir=target.parent, prefix=f".{target.name}.", delete=False
        ) as file:
            temporary = Path(file.name)
            file.write(updated)
        temporary.chmod(target.stat().st_mode & 0o777)
        if target.read_bytes() != original:
            raise HTTPException(409, "Document changed while saving; retry your comment")
        temporary.replace(target)
    except PermissionError:
        raise HTTPException(403, "Cannot write annotations to this document") from None
    finally:
        if temporary and temporary.exists():
            temporary.unlink()


def snapshot(path: str, target: Path):
    _, source, comments, _, storage = read_document(target)
    return {"path": path, "content": source, "comments": comments, "storage": storage}


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
    target = document_path(selected)
    # Selection and opening are read-only. The original is changed only by saving annotations.
    read_document(target)
    relative = target.relative_to(ROOT.resolve()) if target.is_relative_to(ROOT.resolve()) else None
    path = (
        relative.as_posix()
        if relative and not any(part.startswith(".") or part in EXCLUDED for part in relative.parts)
        else str(target)
    )
    return {"path": path}


@router.get("")
async def list_documents():
    paths = []
    for directory, folders, files in os.walk(ROOT, followlinks=False):
        folders[:] = sorted(
            name for name in folders if not name.startswith(".") and name not in EXCLUDED
        )
        for name in files:
            path = Path(directory, name).relative_to(ROOT).as_posix()
            if name.lower().endswith((".md", ".markdown")) and not name.startswith("."):
                try:
                    document_path(path)
                    paths.append(path)
                except HTTPException:
                    pass
    return sorted(paths)


@router.get("/content")
async def get_document(path: str):
    return snapshot(path, document_path(path))


@router.post("/comments", status_code=201)
async def add_comment(path: str, body: Comment):
    target = document_path(path)
    if not body.text.strip():
        raise HTTPException(422, "Comment must not be blank")
    if (
        body.anchor
        and body.anchor.end - body.anchor.start != len(body.quote.encode("utf-16-le")) // 2
    ):
        raise HTTPException(422, "Anchor length must match the selected text")
    original, source, comments, start, _ = read_document(target)
    comment = {
        "id": uuid4().hex,
        "text": body.text.strip(),
        "quote": body.quote,
        "anchor": body.anchor.model_dump() if body.anchor else None,
        "resolved": False,
    }
    comments.append(comment)
    write_comments(target, original, source, comments, start)
    return comment


@router.patch("/comments/{comment_id}")
async def toggle_comment(comment_id: str, path: str):
    target = document_path(path)
    original, source, comments, start, _ = read_document(target)
    for comment in comments:
        if comment["id"] == comment_id:
            comment["resolved"] = not comment["resolved"]
            write_comments(target, original, source, comments, start)
            return comment
    raise HTTPException(404, "Comment not found")


@router.post("/migrate")
async def migrate_comments(path: str):
    target = document_path(path)
    original, source, comments, start, storage = read_document(target)
    if storage == "legacy":
        write_comments(target, original, source, comments, start)
    return snapshot(path, target)
