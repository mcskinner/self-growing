# Adaptation lab

A small, file-based experiment—not a plugin API. An adaptation says what should change;
its reference and application history show how it has changed elsewhere.

The core description stays minimal. Implementation details live in evidence, not mandatory
instructions. Harden from observed transfer failures: attempt → record → diagnose → smallest
revision → fresh attempt. Keep failures. More instructions are not inherently better.

## Try left chat end to end

Run these commands from the `trunk` workshop. They create a separate starter worktree;
they don't change your running app or start another server.

```sh
python scripts/adapt.py prepare --adaptation adaptations/left-chat \
  --name left-chat-01 --worktree ../self-growing-left-chat-01 \
  --out .local/adaptation-runs/left-chat-01
```

Open Pi in that new worktree and ask it to read the **absolute path** to the generated
`apply.md` shown by the command. The brief points to a frozen copy of the input. Have it
implement and commit the adaptation, and fill out `feedback.md` in the record directory.
You can also use your existing chat to work in that worktree explicitly.

Then, back in the workshop:

```sh
python scripts/adapt.py record .local/adaptation-runs/left-chat-01
python scripts/adapt.py evaluate .local/adaptation-runs/left-chat-01
```

Evaluation defaults to `make check`, `make test`, and `make build`. The target needs its
normal development dependencies (`uv sync` and `npm ci` there). It doesn't start servers
or call a model. Use repeated `--command '...'` flags for other trusted local checks.
Commands execute with your permissions; only run commands you trust. The runner removes
inherited launcher ports (`WEB_PORT`, `API_PORT`) and `VIRTUAL_ENV` so another running app
doesn't affect test defaults. Set overrides explicitly inside a command if needed. Each
evaluation keeps its own logs and result under `evaluations/`; `evaluation.json` is the latest.

Review wide/narrow layout and live chat separately, optionally attaching screenshots.
Mark checks not performed, then complete feedback: **did it work, lessons learned, gaps**.
The recorder supplies a binary-capable `application.patch`, commit hashes, and GitHub links.
Links are candidates until the application branch is pushed; pushing is deliberately manual.

To retry, use a new name, worktree, and output directory. `--base REF` targets a more
complicated application instead of starter. Every attempt pins its actual starting commit.
Keep the worktree/branch until you have preserved the results you want; no automatic cleanup.

A reviewed [author-run smoke trial](left-chat/applications/starter-smoke-01/feedback.md)
is included with its resulting patch and evaluation evidence. It exercises the mechanics,
but is not an independent transfer or a completed visual/live-chat evaluation. Archived
worktree paths refer to the author's machine; prepare a new run to reproduce the trial.

A second [Markdown-reader exploration](markdown-reader/README.md) records a fresh distillation,
blind starter/workshop applications, independent behavioral verification, and a prompted repair.
It includes a [portable verification recipe](markdown-reader/verification-recipe.md) and preserves
the initial failed navigation acceptance rather than folding its fix into the first attempt.

The [quote-to-chat transfer](quote-to-chat/README.md) starts from an ordinarily developed,
owner-reviewed feature. A fresh extraction excluded mixed-in navigation work; a first transfer
missed action placement, a one-sentence retry exposed implementation bugs, and a separately
prompted repair passed independent mocked browser checks. A fresh uncoached replication with
unchanged inputs then repeated the label-overflow failure. A bounded verification-guidance batch
produced a fresh pass, a settled-caret failure, and another fresh pass after a second acceptance
clarification. The latest revision has one clean same-base pass, not replicated reliability.
Original failures remain recorded; no superiority of implementation-first development is established.

## Produce the next adaptation

In workshop Pi, use `/skill:adapt` (after `/reload`, or start a fresh Pi). It provides the
same minimal extraction/application/hardening workflow. Embedded-chat slash dispatch is not
required: simply ask the agent to read `.pi/skills/adapt/SKILL.md`.

Capture committed implementation evidence first:

```sh
python scripts/adapt.py capture --base BEFORE --head AFTER \
  --paths frontend/main.tsx frontend/style.css --out adaptations/my-adaptation
```

For a historical conversation, add `--transcript /path/to/session.jsonl` (or an exported
text transcript). The script copies it without altering the original. **This is explicit
opt-in and may contain secrets.** Keep such drafts under `.local/` until reviewed.

Ask Pi to read the generated `extract.md`, then complete `adaptation.md` and `evidence.md`.
The script captures evidence; the agent performs semantic extraction. There is no claim
that a diff alone can recover the original intent. Review unrelated changes and privacy,
remove/redact `source-transcript.txt`, and only then share. Mixed reference diffs are allowed
but must be labeled; they are examples, not automatically applied installation patches.

## Records, not a schema commitment

- `adaptation.md`: minimal intent, necessary boundaries, observable success.
- `adaptation.json`: format version, source hashes, selected paths, commit links.
- `reference.patch`, optional `evidence.md`: implementation evidence and uncertainty.
- Application directory: frozen `input/`, brief, provenance, feedback, resulting patch.
- `evaluation.json` and logs: commands, exit codes, tested commit; **not** a behavioral verdict.

Application paths are local workspace conveniences; hashes and patches are the portable
evidence. Copy reviewed run directories into an adaptation's `applications/` directory to
publish history. Never copy raw private transcripts by default. Keep description revisions
in Git; application snapshots and description hashes preserve which instructions were tried.

## Start another experimental idea

```sh
python scripts/adapt.py experiment --out experiments/my-next-idea
```

Fill out `protocol.md` **before** implementing: question, scope, procedure, success/failure,
and evidence. Append results and deviations afterward. See
[`../experiments/adaptation-loop/protocol.md`](../experiments/adaptation-loop/protocol.md)
for this exploration's prospective plan.

Limitations: local Git worktrees only; no automatic model runner, browser automation,
registry, aggregate scoring, or automatic protocol hardening. This loop intentionally
leaves interpretation and revision to you and the agent while retaining inspectable evidence.
