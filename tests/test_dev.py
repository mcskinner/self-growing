import socket

import pytest

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
