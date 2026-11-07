"""Run both dev servers; defer Python reloads until Pi finishes its turn."""

import fcntl
import json
import os
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API_PORT = os.environ.get("API_PORT", "8000")
WEB_PORT = os.environ.get("WEB_PORT", "5173")


def fingerprint():
    return [(str(p), p.stat().st_mtime_ns) for p in sorted((ROOT / "backend").rglob("*.py"))]


def backend():
    return subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "backend.app:app",
            "--host",
            "127.0.0.1",
            "--port",
            API_PORT,
            "--timeout-graceful-shutdown",
            "2",
        ],
        cwd=ROOT,
    )


def terminate(process):
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=12)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()


def choose_port(variable, default, reserved=()):
    explicit = os.environ.get(variable)
    start = int(explicit or default)
    candidates = [start] if explicit else range(start, min(start + 100, 65536))
    for port in candidates:
        if port in reserved:
            continue
        with socket.socket() as probe:
            try:
                probe.bind(("127.0.0.1", port))
            except OSError:
                continue
        return str(port)
    sys.exit(f"No free port for {variable}. Set {variable} to an unused port.")


def show_running():
    try:
        info = json.loads((ROOT / ".local" / "dev.json").read_text())
        url = info["url"]
    except (OSError, ValueError, KeyError):
        print("This workspace is already starting in another terminal.", flush=True)
        return
    print(f"Already running: {url}", flush=True)
    if os.environ.get("OPEN_BROWSER") == "1":
        webbrowser.open(url)


def main():
    local = ROOT / ".local"
    local.mkdir(exist_ok=True)
    with (local / "dev.lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            show_running()
            return 0
        if "--check" in sys.argv[1:]:
            return 1
        run()
    return 0


def run():
    global API_PORT, WEB_PORT
    API_PORT = choose_port("API_PORT", 8000)
    WEB_PORT = choose_port("WEB_PORT", 5173, reserved=(int(API_PORT),))
    # Both children need the selected ports for proxying and Origin validation.
    os.environ.update(API_PORT=API_PORT, WEB_PORT=WEB_PORT)
    processes = []
    url = f"http://127.0.0.1:{WEB_PORT}"
    state_file = ROOT / ".local" / "dev.json"
    state_file.write_text(json.dumps({"pid": os.getpid(), "url": url}))
    browser_opened = os.environ.get("OPEN_BROWSER") != "1"

    def shutdown(*_):
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, shutdown)
    try:
        api = backend()
        processes.append(api)
        web = subprocess.Popen(["npm", "run", "dev"], cwd=ROOT, start_new_session=True)
        processes.append(web)
        previous = fingerprint()
        reload_retry_at = 0.0
        waiting_for_turn = False
        print(f"\n  Open http://127.0.0.1:{WEB_PORT}\n", flush=True)
        while True:
            time.sleep(0.5)
            if web.poll() is not None:
                raise RuntimeError("Vite exited")
            if not browser_opened:
                try:
                    with urllib.request.urlopen(url, timeout=0.2):
                        pass
                    with urllib.request.urlopen(f"{url}/api/state", timeout=0.2):
                        pass
                except (urllib.error.URLError, TimeoutError):
                    pass
                else:
                    webbrowser.open(url)
                    browser_opened = True
            current = fingerprint()
            if current != previous:
                if time.monotonic() < reload_retry_at:
                    continue
                try:
                    request = urllib.request.Request(
                        f"http://127.0.0.1:{API_PORT}/api/prepare-reload",
                        method="POST",
                    )
                    with urllib.request.urlopen(request, timeout=1) as response:
                        json.load(response)
                except urllib.error.HTTPError as exc:
                    if exc.code == 409 and not waiting_for_turn:
                        print("Python changes pending; waiting for Pi to finish…", flush=True)
                        waiting_for_turn = True
                    reload_retry_at = time.monotonic() + 2
                    continue  # Keep the no-reload-during-a-turn safeguard.
                except (urllib.error.URLError, TimeoutError):
                    if api.poll() is None:
                        continue
                print("\n  Reloading Python backend…\n", flush=True)
                terminate(api)
                api = backend()
                processes.append(api)
                previous = current
                waiting_for_turn = False
                reload_retry_at = 0.0
            elif api.poll() is not None:
                print("Backend exited. Edit backend/*.py to retry.", flush=True)
                # Keep the watcher alive so a syntax error can be fixed live.
                while fingerprint() == previous:
                    time.sleep(0.5)
    except KeyboardInterrupt:
        pass
    finally:
        for process in reversed(processes):
            if process is locals().get("web") and process.poll() is None:
                os.killpg(process.pid, signal.SIGTERM)
            terminate(process)
        state_file.unlink(missing_ok=True)


if __name__ == "__main__":
    sys.exit(main())
