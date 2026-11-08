import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from starlette.middleware.trustedhost import TrustedHostMiddleware

from backend.history import saved_sessions, session_file, title
from backend.pi import connect, select_session


class QuietReloadPoll(logging.Filter):
    """Busy reload probes are normal watcher traffic, not user-facing failures."""

    def filter(self, record):
        args = record.args
        return not (
            isinstance(args, tuple)
            and len(args) == 5
            and args[1] == "POST"
            and str(args[2]).split("?", 1)[0] == "/api/prepare-reload"
            and args[4] == 409
        )


logging.getLogger("uvicorn.access").addFilter(QuietReloadPoll())


class Chat:
    def __init__(self):
        self.messages = []
        self.busy = False
        self.error = None
        self.activity = ""
        self.revision = 0
        self.task = None
        self.pi = None
        self.reloading = False
        self.pending = {}
        self.accepting = False
        self.steering = []
        self.context = None
        self.session_id = None
        self.receipt = None

    def snapshot(self):
        return {
            "messages": [
                message
                for message in self.messages
                if message["role"] in {"user", "assistant", "toolResult"}
            ],
            "busy": self.busy,
            "error": self.error,
            "activity": self.activity,
            "steering": self.steering,
            "context": self.context,
            "sessionId": self.session_id,
        }

    def apply(self, event):
        kind = event["type"]
        if kind == "queue_update":
            self.steering = list(event.get("steering", []))
        elif kind == "agent_start":
            self.activity = "Thinking"
        elif kind == "message_start":
            self.messages.append(event["message"])
        elif kind == "message_end":
            message = event["message"]
            if self.messages and self.messages[-1]["role"] == message["role"]:
                self.messages[-1] = message
            else:
                self.messages.append(message)
            if message.get("errorMessage"):
                self.error = message["errorMessage"]
        elif kind == "message_update" and self.messages:
            update = event["assistantMessageEvent"]
            content = self.messages[-1]["content"]
            index = update.get("contentIndex", 0)
            while len(content) <= index:
                content.append({})
            block = content[index]
            subtype = update["type"]
            for field in ("text", "thinking"):
                if subtype == f"{field}_delta":
                    block.update(type=field, **{field: block.get(field, "") + update["delta"]})
                elif subtype == f"{field}_end":
                    block.update(type=field, **{field: update["content"]})
            if subtype == "toolcall_end":
                content[index] = update["toolCall"]
        elif kind == "tool_execution_start":
            self.activity = f"Running {event['toolName']}"
        elif kind == "tool_execution_end":
            self.activity = "Thinking"
        elif kind == "auto_retry_start":
            self.activity = f"Retrying: {event.get('errorMessage', '')}"
        elif kind == "compaction_start":
            self.activity = "Compacting context"
        self.revision += 1

    async def restore(self):
        try:
            async with connect() as pi:
                self.messages = (await pi.request("get_messages"))["messages"]
                self.context = (await pi.request("get_session_stats")).get("contextUsage")
                self.session_id = (await pi.request("get_state")).get("sessionId")
        except Exception as exc:
            self.error = str(exc)
        self.revision += 1

    async def command(self, kind, **fields):
        if not self.pi or not self.accepting:
            raise HTTPException(409, "Pi is starting or settling; please retry")
        command_id = uuid4().hex
        future = asyncio.get_running_loop().create_future()
        self.pending[command_id] = future
        try:
            await self.pi.send({"type": kind, "id": command_id, **fields})
        except Exception:
            self.pending.pop(command_id, None)
            raise
        # A disconnected HTTP client must not stop reading the command's acknowledgement.
        future.add_done_callback(lambda result: None if result.cancelled() else result.exception())
        try:
            async with asyncio.timeout(15):
                response = await asyncio.shield(future)
            if not response["success"]:
                raise HTTPException(422, response.get("error", "Pi rejected the message"))
            return response.get("data", {})
        except TimeoutError:
            raise HTTPException(
                504, "Pi did not confirm receipt; check chat before retrying"
            ) from None

    async def run(self, message):
        receipt = self.receipt
        try:
            async with connect() as pi:
                self.pi = pi
                await pi.send({"type": "prompt", "id": "turn", "message": message})
                self.accepting = True
                settled = False
                stats_requests = set()
                # A turn may include automatic retries and compaction, not just agent_end.
                async with asyncio.timeout(3600):
                    async for event in pi.records():
                        self.apply(event)
                        if event["type"] == "response" and event.get("id") in stats_requests:
                            stats_requests.remove(event["id"])
                            self.context = event.get("data", {}).get("contextUsage")
                        if (
                            event["type"] == "message_end"
                            and event["message"]["role"] == "assistant"
                        ) or event["type"] == "compaction_end":
                            stats_id = f"context-{uuid4().hex}"
                            stats_requests.add(stats_id)
                            await pi.send({"type": "get_session_stats", "id": stats_id})
                        if event["type"] == "response" and event.get("id") in self.pending:
                            future = self.pending.pop(event["id"])
                            if not future.done():
                                future.set_result(event)
                            if event.get("success") and event.get("data", {}).get(
                                "disposition"
                            ) in {"started", "queued"}:
                                settled = False
                        if event["type"] == "agent_start":
                            settled = False
                        if event["type"] == "response" and event.get("id") == "turn":
                            if not event["success"]:
                                detail = event.get("error", "Prompt rejected")
                                if receipt and not receipt.done():
                                    receipt.set_exception(HTTPException(422, detail))
                                raise RuntimeError(detail)
                            if receipt and not receipt.done():
                                receipt.set_result(event.get("data", {}))
                            if event.get("data", {}).get("disposition") == "handled":
                                settled = True
                        if event["type"] == "agent_settled":
                            settled = True
                        if settled and not self.pending and not stats_requests:
                            self.accepting = False
                            break
        except Exception as exc:
            self.error = str(exc) or "Turn timed out."
        finally:
            if receipt and not receipt.done():
                receipt.set_exception(
                    HTTPException(503, "Pi disconnected before confirming receipt")
                )
            self.accepting = False
            for future in self.pending.values():
                if not future.done():
                    future.set_exception(
                        HTTPException(503, "Pi disconnected before confirming receipt")
                    )
            self.pending.clear()
            self.steering = []
            self.pi = None
            self.busy = False
            self.activity = ""
            self.revision += 1


chat = Chat()


@asynccontextmanager
async def lifespan(app):
    await chat.restore()
    yield
    if chat.task and not chat.task.done():
        chat.task.cancel()
        try:
            await chat.task
        except asyncio.CancelledError:
            pass


app = FastAPI(lifespan=lifespan)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "testserver"])


@app.middleware("http")
async def local_only(request: Request, call_next):
    # A hostile website must not be able to drive a local filesystem-capable agent.
    origin = request.headers.get("origin")
    port = os.environ.get("WEB_PORT", "5173")
    if origin and origin not in {f"http://localhost:{port}", f"http://127.0.0.1:{port}"}:
        from fastapi.responses import JSONResponse

        return JSONResponse({"detail": "Untrusted origin"}, status_code=403)
    return await call_next(request)


class Prompt(BaseModel):
    message: str = Field(min_length=1, max_length=100_000)
    sessionId: str | None = None


@app.get("/api/state")
async def state():
    return chat.snapshot()


@app.post("/api/chat", status_code=202)
async def prompt(body: Prompt):
    if body.sessionId is not None and body.sessionId != chat.session_id:
        raise HTTPException(412, "The selected chat changed. Reload before sending again.")
    if not body.message.strip():
        raise HTTPException(422, "Message must not be blank")
    if chat.reloading:
        raise HTTPException(
            503, "Backend is reloading; please send again in a moment", headers={"Retry-After": "1"}
        )
    if chat.busy:
        return await chat.command("prompt", message=body.message, streamingBehavior="steer")
    chat.busy = True
    chat.error = None
    chat.activity = "Starting Pi"
    chat.revision += 1
    receipt = asyncio.get_running_loop().create_future()
    receipt.add_done_callback(lambda result: None if result.cancelled() else result.exception())
    chat.receipt = receipt
    chat.task = asyncio.create_task(chat.run(body.message))
    try:
        async with asyncio.timeout(15):
            return await asyncio.shield(receipt)
    except TimeoutError:
        raise HTTPException(504, "Pi did not confirm receipt; check chat before retrying") from None


@app.post("/api/session/new")
async def new_session(request: Request):
    expected = request.headers.get("x-session-id")
    if expected and expected != chat.session_id:
        raise HTTPException(412, "The selected chat changed. Reload before starting a new chat.")
    if chat.busy:
        raise HTTPException(409, "Finish or stop the current run before starting a new chat")
    if chat.reloading:
        raise HTTPException(503, "Backend is reloading", headers={"Retry-After": "1"})
    chat.busy = True
    chat.activity = "Starting new chat"
    chat.revision += 1
    try:
        async with connect() as pi:
            result = await pi.request("new_session")
            if result.get("cancelled"):
                raise HTTPException(409, "Pi cancelled the new session")
            session = await pi.request("get_state")
            # Persist only our active-session pointer, never modify Pi's saved sessions.
            select_session(session["sessionId"])
            chat.session_id = session["sessionId"]
            chat.messages = []
            chat.steering = []
            chat.error = None
            chat.context = None
            try:
                chat.context = (await pi.request("get_session_stats")).get("contextUsage")
            except Exception:
                pass  # A missing meter must not undo a successful session switch.
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(502, str(exc)) from exc
    finally:
        chat.busy = False
        chat.activity = ""
        chat.revision += 1
    return chat.snapshot()


@app.get("/api/sessions")
async def sessions():
    records = [
        {key: value for key, value in record.items() if key != "path"}
        for record in saved_sessions()
    ]
    if chat.session_id and not any(record["id"] == chat.session_id for record in records):
        records.insert(0, {"id": chat.session_id, "title": title(chat.messages), "updatedAt": None})
    return {"sessions": records, "currentSessionId": chat.session_id}


class SwitchSession(BaseModel):
    sessionId: str = Field(min_length=1, max_length=128, pattern=r"^[a-zA-Z0-9][a-zA-Z0-9._-]*$")
    expectedSessionId: str | None = None


@app.post("/api/session/switch")
async def switch_session(body: SwitchSession):
    if body.expectedSessionId is not None and body.expectedSessionId != chat.session_id:
        raise HTTPException(412, "The selected chat changed. Reload before switching again.")
    if chat.busy:
        raise HTTPException(409, "Finish or stop the current run before switching chats")
    if chat.reloading:
        raise HTTPException(503, "Backend is reloading", headers={"Retry-After": "1"})
    if body.sessionId == chat.session_id:
        return chat.snapshot()
    path = session_file(body.sessionId)
    if path is None:
        raise HTTPException(404, "Chat not found in this workspace")
    chat.busy = True
    chat.activity = "Opening chat"
    chat.revision += 1
    try:
        async with connect() as pi:
            result = await pi.request("switch_session", sessionPath=str(path))
            if result.get("cancelled"):
                raise HTTPException(409, "Pi cancelled the session switch")
            messages = (await pi.request("get_messages"))["messages"]
            state = await pi.request("get_state")
            if state.get("sessionId") != body.sessionId:
                raise RuntimeError("Pi opened a different session")
            context = None
            try:
                context = (await pi.request("get_session_stats")).get("contextUsage")
            except Exception:
                pass
            select_session(body.sessionId)
            chat.messages = messages
            chat.session_id = body.sessionId
            chat.context = context
            chat.steering = []
            chat.error = None
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(502, str(exc)) from exc
    finally:
        chat.busy = False
        chat.activity = ""
        chat.revision += 1
    return chat.snapshot()


@app.post("/api/prepare-reload")
async def prepare_reload():
    if chat.busy:
        raise HTTPException(409, "A turn is running")
    chat.reloading = True
    return {"ok": True}


@app.post("/api/stop")
async def stop(request: Request):
    expected = request.headers.get("x-session-id")
    if expected and expected != chat.session_id:
        raise HTTPException(412, "The selected chat changed. Reload before stopping a run.")
    cleared = {"steering": [], "followUp": []}
    if chat.pi and chat.accepting:
        cleared = await chat.command("clear_queue")
        if chat.pi and chat.accepting:
            await chat.pi.send({"type": "abort"})
    elif chat.task and not chat.task.done():
        chat.task.cancel()
        try:
            await chat.task
        except asyncio.CancelledError:
            pass
        chat.busy = False
        chat.activity = ""
        chat.revision += 1
    return {"ok": True, **cleared}


@app.get("/api/events")
async def events(request: Request):
    async def stream():
        revision = -1
        ticks = 0
        while not chat.reloading and not await request.is_disconnected():
            if revision != chat.revision:
                revision = chat.revision
                yield f"data: {json.dumps(chat.snapshot())}\n\n"
            elif ticks % 100 == 0:
                yield ": heartbeat\n\n"
            ticks += 1
            await asyncio.sleep(0.1)

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
