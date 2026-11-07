import asyncio
from contextlib import asynccontextmanager

import pytest
from fastapi.testclient import TestClient

import backend.app as module
from backend.app import Chat


def test_streaming_blocks_and_authoritative_message():
    chat = Chat()
    chat.apply({"type": "message_start", "message": {"role": "assistant", "content": []}})
    for delta in ("Hello ", "world\u2028!"):
        chat.apply(
            {
                "type": "message_update",
                "assistantMessageEvent": {"type": "text_delta", "contentIndex": 1, "delta": delta},
            }
        )
    assert chat.messages[-1]["content"][1]["text"] == "Hello world\u2028!"
    final = {"role": "assistant", "content": [{"type": "text", "text": "Final"}]}
    chat.apply({"type": "message_end", "message": final})
    assert chat.messages == [final]


def test_run_waits_for_settled_and_closes(monkeypatch):
    seen = []

    class FakePi:
        async def send(self, command):
            seen.append(command)

        async def records(self):
            for event in [
                {"type": "agent_end", "willRetry": True},
                {"type": "auto_retry_start", "errorMessage": "Try again"},
                {"type": "message_start", "message": {"role": "assistant", "content": []}},
                {"type": "agent_settled"},
            ]:
                yield event

    @asynccontextmanager
    async def connect():
        try:
            yield FakePi()
        finally:
            seen.append("closed")

    monkeypatch.setattr(module, "connect", connect)
    chat = Chat()
    chat.busy = True
    asyncio.run(chat.run("hello"))
    assert len(chat.messages) == 1
    assert seen[0]["message"] == "hello"
    assert seen[-1] == "closed"
    assert not chat.busy
    assert chat.error is None


def test_startup_error_is_visible_and_turn_unlocks(monkeypatch):
    @asynccontextmanager
    async def broken():
        raise FileNotFoundError("Install pi first")
        yield

    monkeypatch.setattr(module, "connect", broken)
    chat = Chat()
    asyncio.run(chat.restore())
    assert "Install pi" in chat.error
    chat.busy = True
    asyncio.run(chat.run("hello"))
    assert not chat.busy
    assert "Install pi" in chat.error


@pytest.fixture
def client(monkeypatch):
    chat = Chat()

    async def restore():
        chat.messages = [{"role": "user", "content": "Saved conversation"}]

    async def run(message):
        try:
            await asyncio.sleep(60)
        finally:
            chat.busy = False

    monkeypatch.setattr(chat, "restore", restore)
    monkeypatch.setattr(chat, "run", run)
    monkeypatch.setattr(module, "chat", chat)
    with TestClient(module.app) as client:
        yield client


def test_history_validation_concurrency_and_reload(client):
    assert client.get("/api/state").json()["messages"][0]["content"] == "Saved conversation"
    assert client.post("/api/chat", json={"message": "  "}).status_code == 422
    assert client.post("/api/chat", json={"message": "Hi"}).status_code == 202
    assert client.post("/api/chat", json={"message": "Again"}).status_code == 409
    assert client.post("/api/prepare-reload").status_code == 409
    assert client.post("/api/stop").status_code == 200


def test_reload_blocks_new_turns(client):
    assert client.post("/api/prepare-reload").status_code == 200
    assert client.post("/api/chat", json={"message": "Hi"}).status_code == 503


def test_local_security(client):
    assert (
        client.post(
            "/api/chat",
            json={"message": "Hi"},
            headers={
                "Origin": "https://evil.example",
            },
        ).status_code
        == 403
    )
    assert client.get("/api/state", headers={"Host": "evil.example"}).status_code == 400
    assert client.get("/api/state", headers={"Origin": "http://127.0.0.1:5173"}).status_code == 200
