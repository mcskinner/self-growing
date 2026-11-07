import asyncio
import json
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from starlette.middleware.trustedhost import TrustedHostMiddleware

from backend.pi import connect


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
        }

    def apply(self, event):
        kind = event["type"]
        if kind == "agent_start":
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
        except Exception as exc:
            self.error = str(exc)
        self.revision += 1

    async def run(self, message):
        try:
            async with connect() as pi:
                self.pi = pi
                await pi.send({"type": "prompt", "id": "turn", "message": message})
                # A turn may include automatic retries and compaction, not just agent_end.
                async with asyncio.timeout(3600):
                    async for event in pi.records():
                        self.apply(event)
                        if event["type"] == "response" and event.get("id") == "turn":
                            if not event["success"]:
                                raise RuntimeError(event.get("error", "Prompt rejected"))
                            if event.get("data", {}).get("disposition") == "handled":
                                break
                        if event["type"] == "agent_settled":
                            break
        except Exception as exc:
            self.error = str(exc) or "Turn timed out."
        finally:
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


@app.get("/api/state")
async def state():
    return chat.snapshot()


@app.post("/api/chat", status_code=202)
async def prompt(body: Prompt):
    if not body.message.strip():
        raise HTTPException(422, "Message must not be blank")
    if chat.reloading:
        raise HTTPException(503, "Backend is reloading; please send again in a moment")
    if chat.busy:
        raise HTTPException(409, "A turn is already running")
    chat.busy = True
    chat.error = None
    chat.activity = "Starting Pi"
    chat.revision += 1
    chat.task = asyncio.create_task(chat.run(body.message))
    return {"ok": True}


@app.post("/api/prepare-reload")
async def prepare_reload():
    if chat.busy:
        raise HTTPException(409, "A turn is running")
    chat.reloading = True
    return {"ok": True}


@app.post("/api/stop")
async def stop():
    if chat.pi:
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
    return {"ok": True}


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
