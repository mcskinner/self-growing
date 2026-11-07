import fcntl
import json
import socket
import sys

import pytest

from scripts import dev
from scripts.dev import choose_port


def test_occupied_default_is_skipped(monkeypatch):
    monkeypatch.delenv("API_PORT", raising=False)
    with socket.socket() as occupied:
        occupied.bind(("127.0.0.1", 0))
        port = occupied.getsockname()[1]
        chosen = int(choose_port("API_PORT", port))
        assert chosen > port
        with socket.socket() as probe:
            probe.bind(("127.0.0.1", chosen))


def test_explicit_occupied_port_fails(monkeypatch):
    with socket.socket() as occupied:
        occupied.bind(("127.0.0.1", 0))
        monkeypatch.setenv("API_PORT", str(occupied.getsockname()[1]))
        with pytest.raises(SystemExit, match="API_PORT"):
            choose_port("API_PORT", 8000)


def test_reserved_port_is_skipped(monkeypatch):
    monkeypatch.delenv("WEB_PORT", raising=False)
    assert int(choose_port("WEB_PORT", 5173, reserved=(5173,))) > 5173


def test_check_reports_no_instance_without_starting_servers(tmp_path, monkeypatch):
    monkeypatch.setattr(dev, "ROOT", tmp_path)
    monkeypatch.setattr(sys, "argv", ["dev.py", "--check"])
    monkeypatch.setattr(dev, "run", lambda: pytest.fail("Must not start servers"))
    assert dev.main() == 1


def test_existing_workspace_instance_is_reused(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(dev, "ROOT", tmp_path)
    monkeypatch.setenv("OPEN_BROWSER", "1")
    monkeypatch.setattr(dev, "run", lambda: pytest.fail("Must not start a second stack"))
    opened = []
    monkeypatch.setattr(dev.webbrowser, "open", opened.append)
    local = tmp_path / ".local"
    local.mkdir()
    (local / "dev.json").write_text(json.dumps({"url": "http://127.0.0.1:5190"}))
    with (local / "dev.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        assert dev.main() == 0
    assert "Already running" in capsys.readouterr().out
    assert opened == ["http://127.0.0.1:5190"]
