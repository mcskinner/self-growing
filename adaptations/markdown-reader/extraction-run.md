# Initial distillation run

This is the first, unedited output of a fresh Pi distiller, frozen before target application. Protocol: `experiments/markdown-reader/protocol.md` (committed as d3e3480).

- Source checkout: detached 898db55839fad721fd9d5d6158e8c93440ac6323.
- Model: configured `gpt-6.1-sol`, resolved by Pi to provider `openai-codex`.
- Invocation: `pi --mode json --print --approve --model "$PI_MODEL" --skill <workshop>/.pi/skills/adapt/SKILL.md --session-dir <local-run>/session @<local-run>/prompt.md`.
- Existing tooling blob: `93ab3ee8a26af4fddcbbfd0c8967dcb27cae6d30`; skill blob: `3e396be1c7462ff024198c468e39577cfd97026a`.
- Outcome: exit 0; authored adaptation.md and evidence.md only. No code, skill, tooling, or reference changes. No private historical transcript supplied.
- Raw prompt, event output, stderr, and isolated session retained locally under `.local/adaptation-runs/markdown-reader-distillation/`; not published wholesale.

## Supplied task

Use the adapt skill to distill a Markdown-reader adaptation from this implementation. The desired capability is comfortable local Markdown reading and navigation inside the app while preserving working chat. Exclude the anchored comment layer.

Read and follow the generated extract.md in adaptations/markdown-reader/. Its reference.patch and adaptation.json are in that directory; the implementation is the source checkout. Complete adaptation.md and evidence.md there. Do not change application code, the skill, or the tooling. Do not commit: the coordinator will freeze the resulting artifacts. Report what you used, uncertainty, and any blockers. Do not read other application histories or experiments.

## Coordinator observations before application

The description is more detailed than the initial left-chat description; no coordinator edits were made to shorten or improve it. Whether that detail helps or overprescribes remains an evaluation question. Evidence explicitly says the source has no relative Markdown-link navigation. The protocol's navigation check will test this gap, not silently redefine acceptance.
