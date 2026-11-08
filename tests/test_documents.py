import hashlib
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend import documents


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    app = FastAPI()
    app.include_router(documents.router)
    return TestClient(app)


def test_original_external_and_workspace_reads_are_read_only(client, tmp_path):
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    original = tmp_path / "original.markdown"
    original.write_text("# Original\n\nCafé", encoding="utf-8")
    before = hashlib.sha256(original.read_bytes()).hexdigest()
    contents_before = sorted(tmp_path.rglob("*"))
    for path in [str(original), "original.markdown"]:
        response = client.get("/api/documents", params={"path": path})
        assert response.status_code == 200
        assert response.json() == {
            "path": str(original),
            "name": original.name,
            "content": "# Original\n\nCafé",
        }
    assert hashlib.sha256(original.read_bytes()).hexdigest() == before
    assert sorted(tmp_path.rglob("*")) == contents_before


def test_resolved_link_targets_read_originals_without_imports(client, tmp_path, monkeypatch):
    # The reader resolves links against the canonical path returned by this API,
    # not the workspace. Explicit absolute reads already allow outside originals.
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    monkeypatch.chdir(workspace)
    originals = tmp_path / "originals"
    (originals / "docs").mkdir(parents=True)
    (originals / "guides").mkdir()
    start = originals / "docs" / "start.md"
    target = originals / "guides" / "next file.markdown"
    start.write_text("[Next](../guides/next%20file.markdown#section)")
    target.write_text("# Linked original")
    before = {path: path.read_bytes() for path in [start, target]}
    entries = sorted(tmp_path.rglob("*"))
    source = client.get("/api/documents", params={"path": str(start)}).json()
    resolved = (Path(source["path"]).parent / "../guides/next file.markdown").resolve()
    response = client.get("/api/documents", params={"path": str(resolved)})
    assert response.status_code == 200
    assert response.json()["content"] == "# Linked original"
    target.write_text("# Changed in place")
    assert (
        client.get("/api/documents", params={"path": str(resolved)}).json()["content"]
        == "# Changed in place"
    )
    target.write_bytes(before[target])
    assert {path: path.read_bytes() for path in before} == before
    assert sorted(tmp_path.rglob("*")) == entries


def test_boundaries(client, tmp_path):
    (tmp_path / "bad.md").write_bytes(b"\xff")
    (tmp_path / "large.md").write_bytes(b"a" * (documents.MAX_BYTES + 1))
    (tmp_path / "plain.txt").write_text("not markdown")
    (tmp_path / "folder.md").mkdir()
    for name, status in [
        ("bad.md", 422),
        ("large.md", 413),
        ("plain.txt", 422),
        ("folder.md", 422),
        ("absent.md", 404),
        ("../escape.md", 403),
    ]:
        assert client.get("/api/documents", params={"path": name}).status_code == status
    outside = tmp_path.parent / f"{tmp_path.name}-outside.md"
    try:
        outside.write_text("# Outside")
        (tmp_path / "escape.md").symlink_to(outside)
        assert client.get("/api/documents", params={"path": "escape.md"}).status_code == 403
        # Explicit absolute paths support originals outside the workspace.
        assert client.get("/api/documents", params={"path": str(outside)}).status_code == 200
    finally:
        outside.unlink(missing_ok=True)
    (tmp_path / "wrong.md").symlink_to(tmp_path / "plain.txt")
    assert client.get("/api/documents", params={"path": "wrong.md"}).status_code == 422


@pytest.mark.parametrize("selected", [None, "/elsewhere/original.md"])
def test_choose_does_not_copy_or_read(client, monkeypatch, selected):
    async def choose():
        return selected

    monkeypatch.setattr(documents, "choose_markdown_file", choose)
    before = list(Path.cwd().iterdir())
    assert client.post("/api/documents/choose").json() == {"path": selected}
    assert list(Path.cwd().iterdir()) == before


def test_chooser_failure_visible(client, monkeypatch):
    async def choose():
        raise OSError("unavailable")

    monkeypatch.setattr(documents, "choose_markdown_file", choose)
    assert client.post("/api/documents/choose").status_code == 503
