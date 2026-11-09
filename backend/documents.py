"""Read-only project documentation, confined to docs/."""

from pathlib import Path
from urllib.parse import unquote, urlsplit

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/documents")
ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 2_000_000


def document_path(path: str) -> Path:
    try:
        target = (ROOT / path).resolve()
        if not target.is_relative_to((ROOT / "docs").resolve()):
            raise ValueError
        if target.suffix.lower() not in {".md", ".markdown"} or not target.is_file():
            raise ValueError
        return target
    except (OSError, ValueError, RuntimeError):
        raise HTTPException(404, "Project document not found") from None


def read_document(target: Path):
    try:
        with target.open("rb") as file:
            data = file.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise HTTPException(413, "Document is too large (maximum 2 MB)")
        return {"path": target.relative_to(ROOT).as_posix(), "content": data.decode("utf-8")}
    except UnicodeDecodeError:
        raise HTTPException(422, "Document is not UTF-8 text") from None
    except OSError:
        raise HTTPException(404, "Cannot read project document") from None


@router.get("/tree")
async def get_tree():
    def children(directory: Path):
        entries = []
        for item in sorted(directory.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
            # Do not traverse symlinks or hidden folders, even within docs/.
            if item.is_symlink() or item.name.startswith("."):
                continue
            path = item.relative_to(ROOT).as_posix()
            if item.is_dir():
                nested = children(item)
                if nested:
                    entries.append({"path": path, "name": item.name, "children": nested})
            elif item.suffix.lower() in {".md", ".markdown"}:
                entries.append({"path": path, "name": item.name})
        return entries

    try:
        return {"entries": children(ROOT / "docs") if (ROOT / "docs").is_dir() else []}
    except OSError:
        raise HTTPException(500, "Cannot list project docs") from None


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
        target = (current.parent / unquote(url.path)).resolve()
        if not target.is_relative_to((ROOT / "docs").resolve()):
            raise ValueError
    except (ValueError, OSError, RuntimeError):
        raise HTTPException(422, "Link is outside project docs") from None
    return {"path": read_document(document_path(str(target)))["path"]}
