import asyncio
import json
import os
from contextlib import asynccontextmanager

import pytest
from fastapi.testclient import TestClient

import backend.app as app_module
from backend import history
from backend.app import Chat, SwitchSession


@pytest.fixture
def workspace(tmp_path, monkeypatch):
    directory = tmp_path / "sessions"
    directory.mkdir()
    monkeypatch.setattr(history, "ROOT", tmp_path)
    monkeypatch.setattr(history, "SESSION_DIR", directory)

    def save(session_id, text, cwd=None):
        path = directory / f"saved_{session_id}.jsonl"
        path.write_text(
            json.dumps({"type": "session", "id": session_id, "cwd": str(cwd or tmp_path)})
            + "\n"
            + json.dumps({"type": "message", "message": {"role": "user", "content": text}})
            + "\n"
        )
        return path

    return directory, save


@pytest.fixture
def client(monkeypatch):
    chat = Chat()
    chat.session_id = "current"
    chat.messages = [{"role": "user", "content": "Current conversation"}]

    async def restore():
        pass

    monkeypatch.setattr(chat, "restore", restore)
    monkeypatch.setattr(app_module, "chat", chat)
    with TestClient(app_module.app) as client:
        yield client


def test_listing_is_read_only_sorted_and_confined_to_workspace(workspace, tmp_path):
    directory, save = workspace
    older = save("older", "First\n  conversation")
    newer = save("newer", [{"type": "text", "text": "Second conversation"}])
    os.utime(older, (1, 1))
    os.utime(newer, (2, 2))
    save("foreign", "Other project", tmp_path / "elsewhere")
    (directory / "broken.jsonl").write_text("not json\n")
    (directory / "linked.jsonl").symlink_to(newer)
    before = {path: path.read_bytes() for path in directory.iterdir()}
    records = history.saved_sessions()
    assert [record["id"] for record in records] == ["newer", "older"]
    assert records[1]["title"] == "First conversation"
    assert history.session_file("../outside") is None
    assert {path: path.read_bytes() for path in directory.iterdir()} == before


def test_list_includes_unsaved_current_chat_without_exposing_paths(client, workspace):
    _, save = workspace
    save("older", "Old conversation")
    result = client.get("/api/sessions").json()
    assert result["currentSessionId"] == "current"
    assert [record["id"] for record in result["sessions"]] == ["current", "older"]
    assert result["sessions"][0]["title"] == "Current conversation"
    assert "path" not in result["sessions"][1]


@pytest.mark.parametrize("cancelled,failed", [(False, False), (True, False), (False, True)])
def test_switch_is_transactional_and_leaves_pi_files_untouched(
    client, workspace, monkeypatch, cancelled, failed
):
    _, save = workspace
    path = save("older", "Old conversation")
    before = path.read_bytes()
    seen = []

    class FakePi:
        async def request(self, command, **fields):
            seen.append((command, fields))
            if command == "switch_session":
                return {"cancelled": cancelled}
            if command == "get_messages":
                if failed:
                    raise RuntimeError("Could not restore messages")
                return {"messages": [{"role": "user", "content": "Old conversation"}]}
            if command == "get_state":
                return {"sessionId": "older"}
            return {"contextUsage": {"tokens": 12, "contextWindow": 100, "percent": 12}}

    @asynccontextmanager
    async def connect():
        yield FakePi()

    monkeypatch.setattr(app_module, "connect", connect)
    monkeypatch.setattr(app_module, "select_session", lambda value: seen.append(("pointer", value)))
    result = client.post(
        "/api/session/switch", json={"sessionId": "older", "expectedSessionId": "current"}
    )
    assert result.status_code == (409 if cancelled else 502 if failed else 200)
    assert seen[0] == ("switch_session", {"sessionPath": str(path)})
    assert not app_module.chat.busy
    assert path.read_bytes() == before
    if cancelled or failed:
        assert app_module.chat.session_id == "current"
        assert app_module.chat.messages[0]["content"] == "Current conversation"
        assert not any(command == "pointer" for command, _ in seen)
    else:
        assert result.json()["sessionId"] == "older"
        assert result.json()["messages"][0]["content"] == "Old conversation"
        assert result.json()["context"]["tokens"] == 12
        assert seen[-1] == ("pointer", "older")


def test_busy_reload_missing_and_stale_session_guards(client, workspace):
    assert client.post("/api/session/switch", json={"sessionId": "../outside"}).status_code == 422
    assert client.post("/api/session/switch", json={"sessionId": "missing"}).status_code == 404
    app_module.chat.busy = True
    assert client.post("/api/session/switch", json={"sessionId": "older"}).status_code == 409
    app_module.chat.busy = False
    app_module.chat.reloading = True
    assert client.post("/api/session/switch", json={"sessionId": "older"}).status_code == 503
    app_module.chat.reloading = False
    assert (
        client.post("/api/chat", json={"message": "Wrong chat", "sessionId": "stale"}).status_code
        == 412
    )
    assert client.post("/api/session/new", headers={"X-Session-Id": "stale"}).status_code == 412
    assert client.post("/api/stop", headers={"X-Session-Id": "stale"}).status_code == 412
    assert (
        client.post(
            "/api/session/switch", json={"sessionId": "older", "expectedSessionId": "stale"}
        ).status_code
        == 412
    )


def test_switch_blocks_other_switches_and_prompts_until_restoration_finishes(
    workspace, monkeypatch
):
    _, save = workspace
    save("older", "Old conversation")

    async def exercise():
        chat = Chat()
        chat.session_id = "current"
        monkeypatch.setattr(app_module, "chat", chat)
        entered = asyncio.Event()
        release = asyncio.Event()

        class FakePi:
            async def request(self, command, **fields):
                if command == "switch_session":
                    entered.set()
                    await release.wait()
                    return {"cancelled": True}

        @asynccontextmanager
        async def connect():
            yield FakePi()

        monkeypatch.setattr(app_module, "connect", connect)
        task = asyncio.create_task(app_module.switch_session(SwitchSession(sessionId="older")))
        await entered.wait()
        with pytest.raises(app_module.HTTPException) as conflict:
            await app_module.switch_session(SwitchSession(sessionId="older"))
        assert conflict.value.status_code == 409
        with pytest.raises(app_module.HTTPException) as conflict:
            await app_module.prompt(app_module.Prompt(message="Do not send"))
        assert conflict.value.status_code == 409
        release.set()
        with pytest.raises(app_module.HTTPException):
            await task
        assert chat.session_id == "current"
        assert not chat.busy

    asyncio.run(exercise())
