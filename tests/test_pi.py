import pytest

from backend import pi


def test_active_session_pointer_survives_reconnects_without_editing_sessions(tmp_path, monkeypatch):
    pointer = tmp_path / "active-session"
    monkeypatch.setattr(pi, "ACTIVE_SESSION", pointer)
    assert pi.active_session_id() == "app"
    pi.select_session("new-session-123")
    assert pi.active_session_id() == "new-session-123"
    assert list(tmp_path.iterdir()) == [pointer]
    with pytest.raises(ValueError):
        pi.select_session("../unsafe")
    assert pi.active_session_id() == "new-session-123"
