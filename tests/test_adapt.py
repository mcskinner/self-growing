import json
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/adapt.py"


def git(repo, *args):
    return subprocess.check_output(["git", "-C", str(repo), *args], text=True).strip()


def run(*args, ok=True):
    result = subprocess.run(
        [sys.executable, str(SCRIPT), *map(str, args)], text=True, capture_output=True
    )
    if ok:
        assert result.returncode == 0, result.stderr
    else:
        assert result.returncode != 0
    return result


@pytest.fixture
def source(tmp_path):
    repo = tmp_path / "source"
    repo.mkdir()
    git(repo, "init", "-b", "starter")
    git(repo, "config", "user.name", "Test")
    git(repo, "config", "user.email", "test@example.invalid")
    git(repo, "remote", "add", "origin", "git@github.com:example/app.git")
    (repo / "app.txt").write_text("before\n")
    git(repo, "add", ".")
    git(repo, "commit", "-m", "Before")
    base = git(repo, "rev-parse", "HEAD")
    (repo / "app.txt").write_text("after\n")
    git(repo, "commit", "-am", "After")
    return repo, base


def captured(tmp_path, source):
    repo, base = source
    adaptation = tmp_path / "adaptation"
    run("capture", "--repo", repo, "--base", base, "--out", adaptation)
    return adaptation


def prepared(tmp_path, source):
    adaptation = captured(tmp_path, source)
    repo, _ = source
    worktree, record = tmp_path / "target with spaces", tmp_path / "record"
    run(
        "prepare",
        "--repo",
        repo,
        "--adaptation",
        adaptation,
        "--name",
        "trial-1",
        "--worktree",
        worktree,
        "--out",
        record,
    )
    return adaptation, worktree, record


def test_capture_diff_links_and_no_implicit_transcript(tmp_path, source):
    adaptation = captured(tmp_path, source)
    assert "+after" in (adaptation / "reference.patch").read_text()
    data = json.loads((adaptation / "adaptation.json").read_text())
    assert data["commit_links"][0].startswith("https://github.com/example/app/commit/")
    assert not data["transcript_included"]
    assert not (adaptation / "source-transcript.txt").exists()
    run("capture", "--repo", source[0], "--base", source[1], "--out", adaptation, ok=False)


def test_explicit_transcript_copy_does_not_change_source(tmp_path, source):
    transcript = tmp_path / "private.jsonl"
    transcript.write_text('{"text":"historical evidence"}\n')
    out = tmp_path / "draft"
    run(
        "capture",
        "--repo",
        source[0],
        "--base",
        source[1],
        "--out",
        out,
        "--transcript",
        transcript,
    )
    assert (out / "source-transcript.txt").read_bytes() == transcript.read_bytes()
    assert "not instructions" in (out / "extract.md").read_text()


def test_prepare_pins_base_and_snapshots_description(tmp_path, source):
    adaptation, worktree, record = prepared(tmp_path, source)
    data = json.loads((record / "application.json").read_text())
    assert data["base"] == git(source[0], "rev-parse", "starter")
    assert git(worktree, "rev-parse", "HEAD") == data["base"]
    original = (record / "input/adaptation.md").read_text()
    (adaptation / "adaptation.md").write_text("New instructions")
    assert (record / "input/adaptation.md").read_text() == original
    assert len(data["description_sha256"]) == 64
    assert not (record / "input/source-transcript.txt").exists()


def test_record_requires_clean_commit_and_captures_patch(tmp_path, source):
    _, worktree, record = prepared(tmp_path, source)
    (worktree / "app.txt").write_text("transferred\n")
    run("record", record, ok=False)
    git(worktree, "commit", "-am", "Apply")
    run("record", record)
    assert "+transferred" in (record / "application.patch").read_text()
    data = json.loads((record / "application.json").read_text())
    assert len(data["commits"]) == 1
    assert data["commit_links"][0].endswith(data["head"])


def test_evaluation_reports_failure_and_never_claims_behavioral_success(tmp_path, source):
    _, worktree, record = prepared(tmp_path, source)
    run("evaluate", record, ok=False)  # Must record first.
    run("record", record)
    command = f'"{sys.executable}" -c "print(123)"'
    run("evaluate", record, "--command", command)
    data = json.loads((record / "evaluation.json").read_text())
    assert data["automated_checks_passed"]
    assert "not-assessed" in data["behavioral_acceptance"]
    run("evaluate", record, "--command", "exit 7", ok=False)
    assert not json.loads((record / "evaluation.json").read_text())["automated_checks_passed"]
    assert len(list((record / "evaluations").glob("*/evaluation.json"))) == 2
    (worktree / "app.txt").write_text("unrecorded")
    run("evaluate", record, "--command", command, ok=False)


def test_evaluation_drops_launcher_ports_and_records_timeout(tmp_path, source, monkeypatch):
    _, _, record = prepared(tmp_path, source)
    run("record", record)
    monkeypatch.setenv("WEB_PORT", "5999")
    command = f'''"{sys.executable}" -c "import os; assert 'WEB_PORT' not in os.environ"'''
    run("evaluate", record, "--command", command)
    sleepy = f'''"{sys.executable}" -c "import time; time.sleep(20)"'''
    run("evaluate", record, "--command", sleepy, "--timeout", 1, ok=False)
    data = json.loads((record / "evaluation.json").read_text())
    assert data["checks"][0]["exit_code"] == 124


def test_experiment_template_is_prospective(tmp_path):
    out = tmp_path / "experiment"
    run("experiment", "--out", out)
    assert "before implementation" in (out / "protocol.md").read_text()
