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


@pytest.mark.parametrize("settled_before_ack", [False, True])
def test_steering_uses_active_connection_and_correlates_ack(monkeypatch, settled_before_ack):
    class FakePi:
        def __init__(self):
            self.events = asyncio.Queue()
            self.ready = asyncio.Event()
            self.commands = []

        async def send(self, command):
            self.commands.append(command)
            if command["id"] != "turn" and settled_before_ack:
                await self.events.put({"type": "agent_settled"})
            await self.events.put(
                {
                    "type": "response",
                    "id": command["id"],
                    "success": True,
                    "data": {"disposition": "started" if command["id"] == "turn" else "queued"},
                }
            )

        async def records(self):
            self.ready.set()
            while True:
                yield await self.events.get()

    async def exercise():
        pi = FakePi()

        @asynccontextmanager
        async def connect():
            yield pi

        monkeypatch.setattr(module, "connect", connect)
        chat = Chat()
        chat.busy = True
        task = asyncio.create_task(chat.run("Original"))
        try:
            await pi.ready.wait()
            response = await chat.command(
                "prompt", message="Change direction", streamingBehavior="steer"
            )
            assert response["disposition"] == "queued"
            assert len(pi.commands) == 2
            assert pi.commands[1]["streamingBehavior"] == "steer"
            assert pi.commands[1]["id"] != "turn"
            assert not task.done()
            await pi.events.put({"type": "queue_update", "steering": ["Change direction"]})
            await pi.events.put(
                {
                    "type": "message_start",
                    "message": {"role": "user", "content": "Change direction"},
                }
            )
            await pi.events.put({"type": "queue_update", "steering": []})
            await pi.events.put({"type": "agent_settled"})
            await asyncio.wait_for(task, 1)
            assert chat.messages[-1]["content"] == "Change direction"
            assert not chat.busy
            assert chat.steering == []
        finally:
            if not task.done():
                task.cancel()
                with pytest.raises(asyncio.CancelledError):
                    await task

    asyncio.run(exercise())


def test_context_stats_are_read_even_when_settled_precedes_stats_response(monkeypatch):
    usage = {"tokens": 45000, "contextWindow": 200000, "percent": 22.5}

    async def exercise():
        events = asyncio.Queue()

        class FakePi:
            async def send(self, command):
                if command["type"] == "prompt":
                    await events.put(
                        {
                            "type": "message_end",
                            "message": {
                                "role": "assistant",
                                "content": [{"type": "text", "text": "Done"}],
                            },
                        }
                    )
                    await events.put({"type": "agent_settled"})
                else:
                    assert command["type"] == "get_session_stats"
                    await events.put(
                        {
                            "type": "response",
                            "id": command["id"],
                            "success": True,
                            "data": {"contextUsage": usage},
                        }
                    )

            async def records(self):
                while True:
                    yield await events.get()

        @asynccontextmanager
        async def connect():
            yield FakePi()

        monkeypatch.setattr(module, "connect", connect)
        chat = Chat()
        await asyncio.wait_for(chat.run("Hello"), 1)
        assert chat.snapshot()["context"] == usage
        assert not chat.busy

    asyncio.run(exercise())


@pytest.mark.parametrize("accepted", [True, False])
def test_first_prompt_waits_for_pi_acknowledgement(monkeypatch, accepted):
    async def exercise():
        chat = Chat()
        events = asyncio.Queue()
        ready = asyncio.Event()

        class FakePi:
            async def send(self, command):
                assert command["type"] == "prompt"

            async def records(self):
                ready.set()
                while True:
                    yield await events.get()

        @asynccontextmanager
        async def connect():
            yield FakePi()

        monkeypatch.setattr(module, "chat", chat)
        monkeypatch.setattr(module, "connect", connect)
        request = asyncio.create_task(module.prompt(module.Prompt(message="Hello")))
        await ready.wait()
        assert not request.done()
        await events.put(
            {
                "type": "response",
                "id": "turn",
                "success": accepted,
                "data": {"disposition": "started"},
                "error": "Rejected",
            }
        )
        if accepted:
            assert (await request)["disposition"] == "started"
            await events.put({"type": "agent_settled"})
        else:
            with pytest.raises(module.HTTPException) as error:
                await request
            assert error.value.status_code == 422
        await asyncio.wait_for(chat.task, 1)
        assert not chat.busy

    asyncio.run(exercise())


def test_cancelled_http_waiter_keeps_reading_pi_ack(monkeypatch):
    async def exercise():
        chat = Chat()
        ready = asyncio.Event()
        sent = asyncio.Event()
        events = asyncio.Queue()
        steering_id = None

        class FakePi:
            async def send(self, command):
                nonlocal steering_id
                if command["id"] == "turn":
                    await events.put({"type": "response", "id": "turn", "success": True})
                else:
                    steering_id = command["id"]
                    sent.set()

            async def records(self):
                ready.set()
                while True:
                    yield await events.get()

        @asynccontextmanager
        async def connect():
            yield FakePi()

        monkeypatch.setattr(module, "connect", connect)
        run = asyncio.create_task(chat.run("Original"))
        await ready.wait()
        request = asyncio.create_task(
            chat.command("prompt", message="Steer", streamingBehavior="steer")
        )
        await sent.wait()
        request.cancel()
        with pytest.raises(asyncio.CancelledError):
            await request
        assert steering_id in chat.pending
        await events.put({"type": "agent_settled"})
        await events.put(
            {
                "type": "response",
                "id": steering_id,
                "success": True,
                "data": {"disposition": "queued"},
            }
        )
        await events.put({"type": "agent_settled"})
        await asyncio.wait_for(run, 1)
        assert not chat.pending

    asyncio.run(exercise())


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
            chat.receipt.set_result({"disposition": "started"})
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


def test_busy_prompt_is_forwarded_as_steering(client, monkeypatch):
    seen = []

    async def command(kind, **fields):
        seen.append((kind, fields))
        return {"disposition": "queued"}

    module.chat.busy = True
    monkeypatch.setattr(module.chat, "command", command)
    assert client.post("/api/chat", json={"message": "Change direction"}).status_code == 202
    assert seen == [("prompt", {"message": "Change direction", "streamingBehavior": "steer"})]


def test_stop_clears_pi_queue_before_abort_and_returns_unsent_text(client, monkeypatch):
    seen = []

    class FakePi:
        async def send(self, command):
            seen.append(command["type"])

    async def command(kind, **fields):
        seen.append(kind)
        return {"steering": ["Pending instruction"], "followUp": []}

    module.chat.pi = FakePi()
    module.chat.accepting = True
    monkeypatch.setattr(module.chat, "command", command)
    response = client.post("/api/stop")
    assert response.status_code == 200
    assert response.json()["steering"] == ["Pending instruction"]
    assert seen == ["clear_queue", "abort"]


def test_new_session_persists_pointer_and_clears_only_chat(client, monkeypatch):
    seen = []

    class FakePi:
        async def request(self, command):
            seen.append(command)
            return {
                "new_session": {"cancelled": False},
                "get_state": {"sessionId": "new-session-id"},
                "get_session_stats": {"contextUsage": None},
            }[command]

    @asynccontextmanager
    async def connect():
        yield FakePi()

    monkeypatch.setattr(module, "connect", connect)
    monkeypatch.setattr(module, "select_session", lambda session: seen.append(session))
    response = client.post("/api/session/new")
    assert response.status_code == 200
    assert response.json()["messages"] == []
    assert response.json()["sessionId"] == "new-session-id"
    assert response.json()["context"] is None
    assert seen == ["new_session", "get_state", "new-session-id", "get_session_stats"]
    assert not module.chat.busy


def test_new_session_refuses_busy_chat(client):
    assert client.post("/api/chat", json={"message": "Work"}).status_code == 202
    assert client.post("/api/session/new").status_code == 409


def test_cancelled_new_session_keeps_existing_conversation(client, monkeypatch):
    class FakePi:
        async def request(self, command):
            assert command == "new_session"
            return {"cancelled": True}

    @asynccontextmanager
    async def connect():
        yield FakePi()

    monkeypatch.setattr(module, "connect", connect)
    assert client.post("/api/session/new").status_code == 409
    assert module.chat.messages[0]["content"] == "Saved conversation"
    assert not module.chat.busy


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
