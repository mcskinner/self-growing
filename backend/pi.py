"""A short-lived RPC connection to the real Pi CLI; Pi owns session persistence."""

import asyncio
import json
import os
from contextlib import asynccontextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SESSION_DIR = ROOT / ".local" / "sessions"


class Pi:
    async def send(self, command):
        self.process.stdin.write((json.dumps(command) + "\n").encode())
        await self.process.stdin.drain()

    async def records(self):
        while line := await self.process.stdout.readline():
            record = json.loads(line)
            if record.get("type") == "extension_ui_request":
                # This minimal client has no extension dialogs. Never implicitly approve one.
                await self.send(
                    {"type": "extension_ui_response", "id": record["id"], "cancelled": True}
                )
            yield record
        await self.process.wait()
        raise RuntimeError(
            f"Pi exited ({self.process.returncode}). {self.stderr.decode(errors='replace')[-2000:]}"
        )

    async def drain_stderr(self):
        self.stderr = b""
        while chunk := await self.process.stderr.read(4096):
            self.stderr = (self.stderr + chunk)[-8192:]

    async def request(self, command):
        await self.send({"type": command, "id": command})
        async with asyncio.timeout(45):
            async for record in self.records():
                if record.get("id") == command and record["type"] == "response":
                    if not record["success"]:
                        raise RuntimeError(record.get("error", "Pi command failed"))
                    return record.get("data", {})


@asynccontextmanager
async def connect():
    SESSION_DIR.mkdir(parents=True, exist_ok=True)
    pi = Pi()
    args = [
        os.environ.get("PI_BIN", "pi"),
        "--mode",
        "rpc",
        "--session-dir",
        str(SESSION_DIR),
        "--session-id",
        "app",
        "--approve",
    ]
    if model := os.environ.get("PI_MODEL"):
        args += ["--model", model]
    pi.process = await asyncio.create_subprocess_exec(
        *args,
        cwd=ROOT,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        limit=16 * 1024 * 1024,
    )
    stderr_task = asyncio.create_task(pi.drain_stderr())
    try:
        yield pi
    finally:
        if pi.process.returncode is None:
            pi.process.stdin.close()
            try:
                await asyncio.wait_for(pi.process.wait(), 5)
            except TimeoutError:
                pi.process.terminate()
                try:
                    await asyncio.wait_for(pi.process.wait(), 3)
                except TimeoutError:
                    pi.process.kill()
                    await pi.process.wait()
        await stderr_task
