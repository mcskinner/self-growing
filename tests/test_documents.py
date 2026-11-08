import asyncio
from pathlib import Path

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from backend import documents
from backend.app import app


@pytest.fixture
def files(tmp_path, monkeypatch):
    root = tmp_path / "workspace"
    root.mkdir()
    monkeypatch.setattr(documents, "ROOT", root)
    (root / "index.md").write_text("# Index\n[next](next.markdown)")
    (root / "next.markdown").write_text("# Next")
    outside = tmp_path / "outside.md"
    outside.write_text("# Outside")
    return root, outside


def test_read_and_links_are_read_only(files):
    root, outside = files
    client = TestClient(app)  # No lifespan: never connects to Pi.
    before = {p: p.read_bytes() for p in root.parent.rglob("*") if p.is_file()}
    assert (
        client.get("/api/documents/content", params={"path": "index.md"})
        .json()["content"]
        .startswith("# Index")
    )
    result = client.get(
        "/api/documents/resolve", params={"path": "index.md", "link": "next.markdown#part"}
    )
    assert result.json()["path"] == str(root / "next.markdown")
    assert client.get("/api/documents/content", params={"path": str(outside)}).status_code == 200
    assert before == {p: p.read_bytes() for p in root.parent.rglob("*") if p.is_file()}
    assert client.post("/api/documents/comments").status_code == 404


def test_invalid_documents(files):
    root, outside = files
    (root / "escape.md").symlink_to(outside)
    (root / "binary.md").write_bytes(b"\xff")
    (root / "large.md").write_bytes(b"x" * (documents.MAX_BYTES + 1))
    (root / "wrong.txt").write_text("hello")
    client = TestClient(app)
    for path, status in [
        ("../outside.md", 404),
        ("escape.md", 404),
        ("binary.md", 422),
        ("large.md", 413),
        ("wrong.txt", 404),
        ("missing.md", 404),
    ]:
        assert client.get("/api/documents/content", params={"path": path}).status_code == status
    for link in ["https://example.com/x.md", "../outside.md", "//example.com/x.md"]:
        assert (
            client.get(
                "/api/documents/resolve", params={"path": "index.md", "link": link}
            ).status_code
            == 422
        )


def test_picker_cancel_and_outside(files, monkeypatch):
    _, outside = files

    async def cancel():
        return ""

    monkeypatch.setattr(documents, "choose_markdown_file", cancel)
    assert asyncio.run(documents.pick_document()) == {"path": None}

    async def select():
        return str(outside)

    monkeypatch.setattr(documents, "choose_markdown_file", select)
    assert asyncio.run(documents.pick_document()) == {"path": str(outside)}


def test_bad_path(files):
    with pytest.raises(HTTPException):
        documents.document_path("bad\0.md")
    assert isinstance(documents.ROOT, Path)
