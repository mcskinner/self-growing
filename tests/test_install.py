import os
import shutil
import subprocess
from pathlib import Path

import pytest


@pytest.fixture
def checkout(tmp_path):
    root = tmp_path / "checkout with spaces"
    root.mkdir()
    source = Path(__file__).resolve().parents[1] / "install.sh"
    shutil.copy(source, root / "install.sh")
    (root / "pyproject.toml").write_text("# Test checkout marker\n")
    (root / "scripts").mkdir()
    (root / "scripts" / "dev.py").write_text("# Not executed by the mocked toolchain\n")
    tools = tmp_path / "bin"
    tools.mkdir()
    log = tmp_path / "commands.log"
    for command in ["node", "npm", "uv", "pi"]:
        executable = tools / command
        executable.write_text(
            f'#!/bin/sh\nprintf "%s\\n" "{command} $*" >> "$BOOTSTRAP_TEST_LOG"\n'
        )
        executable.chmod(0o755)
    env = {
        **os.environ,
        "PATH": f"{tools}:/usr/bin:/bin",
        "BOOTSTRAP_TEST_LOG": str(log),
    }
    for name in ["PI_BIN", "SELF_GROWING_REPO", "SELF_GROWING_BRANCH", "SELF_GROWING_DIR"]:
        env.pop(name, None)
    return root, tools, log, env


def launch(checkout, *arguments):
    root, _, _, env = checkout
    return subprocess.run(
        ["sh", str(root / "install.sh"), *arguments],
        cwd="/",
        env=env,
        text=True,
        capture_output=True,
        timeout=10,
    )


def test_launcher_reuses_tools_and_starts_stack_from_checkout(checkout):
    root, _, log, _ = checkout
    result = launch(checkout, "--no-open")
    assert result.returncode == 0, result.stderr
    commands = log.read_text()
    assert "uv sync\n" in commands
    assert "npm ci\n" in commands
    assert "uv run python scripts/dev.py\n" in commands
    assert "npm install" not in commands
    assert not (root / ".local" / "tools" / "pi").exists()


def test_launcher_help_does_not_install_or_run_anything(checkout):
    root, _, log, _ = checkout
    result = launch(checkout, "--help")
    assert result.returncode == 0
    assert "Usage:" in result.stdout
    assert not log.exists()
    assert not (root / ".local").exists()


def test_launcher_rejects_invalid_pi_override(checkout):
    _, _, log, env = checkout
    env["PI_BIN"] = "/not/a/pi/executable"
    result = launch(checkout, "--no-open")
    assert result.returncode != 0
    assert "PI_BIN" in result.stderr
    assert "uv sync" not in log.read_text()


def test_launcher_existing_instance_skips_dependency_installation(checkout):
    root, _, log, _ = checkout
    local = root / ".local"
    local.mkdir()
    (local / "dev.lock").touch()
    python = root / ".venv" / "bin" / "python"
    python.parent.mkdir(parents=True)
    python.write_text('#!/bin/sh\necho "Already running: http://127.0.0.1:5173"\nexit 0\n')
    python.chmod(0o755)
    result = launch(checkout)
    assert result.returncode == 0
    assert "Already running" in result.stdout
    assert not log.exists()


def test_launcher_stops_when_a_tool_download_fails(checkout):
    _, tools, log, _ = checkout
    (tools / "node").write_text("#!/bin/sh\nexit 1\n")
    curl = tools / "curl"
    curl.write_text("#!/bin/sh\nexit 22\n")
    curl.chmod(0o755)
    result = launch(checkout, "--no-open")
    assert result.returncode != 0
    assert not log.exists()


def test_piped_installer_clones_and_reuses_a_checkout(checkout, tmp_path):
    root, _, _, env = checkout
    git = shutil.which("git")
    assert git
    subprocess.run([git, "init", "-b", "starter", str(root)], check=True, capture_output=True)
    subprocess.run(
        [git, "-C", str(root), "add", "install.sh", "pyproject.toml", "scripts"], check=True
    )
    subprocess.run(
        [
            git,
            "-C",
            str(root),
            "-c",
            "user.name=Test",
            "-c",
            "user.email=test@example.invalid",
            "commit",
            "-m",
            "Fixture",
        ],
        check=True,
        capture_output=True,
    )
    destination = tmp_path / "installed app"
    arguments = ["sh", "-s", "--", "--repo", str(root), "--dir", str(destination), "--no-open"]
    script = (root / "install.sh").read_text()
    result = subprocess.run(
        arguments, input=script, cwd=tmp_path, env=env, text=True, capture_output=True, timeout=15
    )
    assert result.returncode == 0, result.stderr
    assert (destination / ".git").is_dir()
    assert (destination / "install.sh").exists()
    note = destination / "my-local-edit.md"
    note.write_text("Do not overwrite")
    result = subprocess.run(
        arguments, input=script, cwd=tmp_path, env=env, text=True, capture_output=True, timeout=15
    )
    assert result.returncode == 0, result.stderr
    assert "Reusing" in result.stdout
    assert note.read_text() == "Do not overwrite"


def test_piped_installer_defaults_to_published_repository(checkout, tmp_path):
    root, tools, log, env = checkout
    git = tools / "git"
    git.write_text('#!/bin/sh\nprintf "%s\\n" "$*" >> "$BOOTSTRAP_TEST_LOG"\nexit 77\n')
    git.chmod(0o755)
    env["SELF_GROWING_DIR"] = str(tmp_path / "fresh-install")
    result = subprocess.run(
        ["sh", "-s"],
        input=(root / "install.sh").read_text(),
        cwd=tmp_path,
        env=env,
        text=True,
        capture_output=True,
        timeout=10,
    )
    assert result.returncode == 77  # The fake Git never performs a network request.
    command = log.read_text()
    assert "https://github.com/mcskinner/self-growing.git" in command
    assert "--branch starter" in command


def test_piped_installer_rejects_an_explicit_empty_repository(checkout, tmp_path):
    root, _, _, env = checkout
    result = subprocess.run(
        ["sh", "-s", "--", "--repo", ""],
        input=(root / "install.sh").read_text(),
        cwd=tmp_path,
        env=env,
        text=True,
        capture_output=True,
        timeout=10,
    )
    assert result.returncode != 0
    assert "must not be empty" in result.stderr
