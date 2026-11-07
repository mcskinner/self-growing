import json

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from backend import documents
from backend.app import app


@pytest.fixture
def workspace(tmp_path, monkeypatch):
    root = tmp_path / "workspace"
    root.mkdir()
    monkeypatch.setattr(documents, "ROOT", root)
    (root / "design.md").write_text("# Design\n\nA proposal.")
    (root / ".local").mkdir()
    (root / ".local" / "private.md").write_text("private")
    (root / "node_modules").mkdir()
    (root / "node_modules" / "package.md").write_text("dependency")
    (root / "hidden.md").symlink_to(root / ".local" / "private.md")
    return TestClient(app)


def test_documents_and_boundaries(workspace):
    assert workspace.get("/api/documents").json() == ["design.md"]
    data = workspace.get("/api/documents/content", params={"path": "design.md"}).json()
    assert data["content"].startswith("# Design")
    assert data["comments"] == []
    for path in ["../README.md", ".local/private.md", "hidden.md", "node_modules/package.md"]:
        assert workspace.get("/api/documents/content", params={"path": path}).status_code == 404


def test_native_picker_opens_original_without_writing(workspace, tmp_path, monkeypatch):
    original = tmp_path / "outside.md"
    original.write_text("# Outside")
    before = sorted(tmp_path.rglob("*"))

    async def choose():
        return str(original)

    monkeypatch.setattr(documents, "choose_markdown_file", choose)
    response = workspace.post("/api/documents/pick")
    assert response.json() == {"path": str(original)}
    assert original.read_text() == "# Outside"
    assert sorted(tmp_path.rglob("*")) == before
    assert (
        workspace.get("/api/documents/content", params={"path": str(original)}).json()["content"]
        == "# Outside"
    )
    assert (
        workspace.post("/api/documents/open", json={"name": "copy.md", "content": "no"}).status_code
        == 404
    )


def test_picker_cancel_does_not_change_anything(workspace, monkeypatch):
    async def choose():
        return ""

    monkeypatch.setattr(documents, "choose_markdown_file", choose)
    assert workspace.post("/api/documents/pick").json() == {"path": None}


def test_text_anchor_is_saved_and_validated(workspace):
    anchor = {"start": 7, "end": 11, "prefix": "Before ", "suffix": " after"}
    response = workspace.post(
        "/api/documents/comments?path=design.md",
        json={"text": "Clarify", "quote": "text", "anchor": anchor},
    )
    assert response.status_code == 201
    assert response.json()["anchor"] == anchor
    stored = workspace.get("/api/documents/content?path=design.md").json()["comments"][0]
    assert stored["anchor"] == anchor
    assert (
        workspace.post(
            "/api/documents/comments?path=design.md",
            json={"text": "Invalid", "quote": "too long", "anchor": anchor},
        ).status_code
        == 422
    )
    assert (
        workspace.post(
            "/api/documents/comments?path=design.md",
            json={"text": "Emoji", "quote": "😀", "anchor": {"start": 0, "end": 2}},
        ).status_code
        == 201
    )


def test_comments_persist_inside_markdown_and_resolve(workspace):
    target = documents.ROOT / "design.md"
    original = target.read_bytes()
    url = "/api/documents/comments?path=design.md"
    assert workspace.post(url, json={"text": "  "}).status_code == 422
    response = workspace.post(url, json={"text": "Clarify this", "quote": "A proposal."})
    assert response.status_code == 201
    comment = response.json()
    data = workspace.get("/api/documents/content?path=design.md").json()
    assert data["comments"] == [comment]
    assert target.read_bytes().startswith(original)
    assert "markdown-review:v1" in target.read_text()
    assert "markdown-review:v1" not in data["content"]
    assert not (documents.ROOT / ".local" / "reviews.json").exists()
    toggle = f"/api/documents/comments/{comment['id']}?path=design.md"
    assert workspace.patch(toggle).json()["resolved"] is True
    assert workspace.patch(toggle).json()["resolved"] is False
    assert workspace.patch("/api/documents/comments/missing?path=design.md").status_code == 404
    assert target.read_text().count("<!-- markdown-review:") == 1


def test_comments_follow_rename_and_move(workspace, tmp_path):
    comment = workspace.post(
        "/api/documents/comments?path=design.md", json={"text": "Keep me"}
    ).json()
    moved = tmp_path / "renamed.md"
    (documents.ROOT / "design.md").rename(moved)
    data = workspace.get("/api/documents/content", params={"path": str(moved)}).json()
    assert data["comments"] == [comment]
    assert (
        workspace.patch(
            f"/api/documents/comments/{comment['id']}", params={"path": str(moved)}
        ).json()["resolved"]
        is True
    )


def test_html_comment_delimiters_round_trip_without_escape(workspace):
    text = "Review --> <script>alert(1)</script> <!-- and -- and 😀"
    response = workspace.post("/api/documents/comments?path=design.md", json={"text": text})
    assert response.status_code == 201
    source = (documents.ROOT / "design.md").read_text()
    assert source.count("-->") == 1
    assert "<script>" not in source
    data = workspace.get("/api/documents/content?path=design.md").json()
    assert data["comments"][0]["text"] == text


def test_existing_central_comments_migrate_only_on_explicit_save(workspace):
    target = documents.ROOT / "design.md"
    original = target.read_bytes()
    legacy = {"id": "existing", "text": "Earlier comment", "quote": "proposal", "resolved": False}
    backup = documents.ROOT / ".local" / "reviews.json"
    backup.write_text(json.dumps({"design.md": [legacy]}))
    data = workspace.get("/api/documents/content?path=design.md").json()
    assert data["storage"] == "legacy"
    assert target.read_bytes() == original
    data = workspace.post("/api/documents/migrate?path=design.md").json()
    assert data["storage"] == "embedded"
    assert data["comments"][0]["id"] == "existing"
    backup.unlink()  # Embedded annotations are independent of the old store.
    assert (
        workspace.get("/api/documents/content?path=design.md").json()["comments"][0]["text"]
        == "Earlier comment"
    )


def test_corrupt_metadata_is_not_overwritten(workspace):
    target = documents.ROOT / "design.md"
    source = "# Design\n\n<!-- markdown-review:v1\ninvalid JSON\n-->\n"
    target.write_text(source)
    assert (
        workspace.post("/api/documents/comments?path=design.md", json={"text": "New"}).status_code
        == 422
    )
    assert target.read_text() == source


def test_concurrent_edit_is_not_overwritten(workspace):
    target = documents.ROOT / "design.md"
    original, source, comments, start, _ = documents.read_document(target)
    target.write_text("# Changed externally")
    with pytest.raises(HTTPException) as error:
        documents.write_comments(target, original, source, comments, start)
    assert error.value.status_code == 409
    assert target.read_text() == "# Changed externally"
    assert not list(target.parent.glob(".design.md.*"))


def test_crlf_and_file_permissions_are_preserved(workspace):
    target = documents.ROOT / "design.md"
    target.write_bytes(b"# Design\r\n\r\nA proposal.\r\n")
    target.chmod(0o640)
    assert (
        workspace.post(
            "/api/documents/comments?path=design.md", json={"text": "Review"}
        ).status_code
        == 201
    )
    content = target.read_bytes()
    assert content.startswith(b"# Design\r\n\r\nA proposal.\r\n")
    assert b"\n" not in content.replace(b"\r\n", b"")
    assert target.stat().st_mode & 0o777 == 0o640
