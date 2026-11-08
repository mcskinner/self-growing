# Experiment: minimal adaptation, evidenced transfer

Status: first author-run smoke trial complete. Plan below was written before that application.

## Question and hypothesis
Can a small behavioral description plus optional reference evidence transfer left chat from the Markdown offshoot to the minimal starter without importing the document reader?

Hypothesis: intent, a scope boundary, and observable success are enough. The reference diff can remain mixed and source-specific if clearly labeled.

## Scope and exclusions
Build a file-based capture → agent extraction → application → evidence → evaluation loop. Start with left chat on starter. No registry, automatic patch installation, background model orchestration, or general plugin API. Automated checks alone do not establish transfer quality.

## Starting conditions
Source: 947eed4, first Markdown review implementation, with frontend-only reference diff. Target: the `starter` commit pinned in each application record. Workshop tooling lives on `trunk`. No private historical transcript in the published example.

## Procedure
1. Capture the source diff, then author the smallest adaptation description.
2. Prepare a fresh starter worktree, snapshot the description and reference evidence.
3. Have an agent implement the intent locally; record what evidence it consulted.
4. Commit the target implementation; record patch, commits, and links.
5. Run check/test/build. Manually inspect wide and narrow layouts and chat controls when a browser is available. Label omitted checks.
6. Record outcome, lessons, and gaps, including failure.
7. If the description fails, explain the cause before changing it. Add the smallest necessary guidance, preserve the earlier record, and retry from a fresh target. Do not harden from speculation.

First application is a tooling smoke trial by the framework author, not an independent-agent evaluation. A later trial should use a fresh agent with only the application brief, and then a more-diverged target.

## Success and failure criteria
Success: clean starter application, preserved chat functionality, no Markdown dependencies, captured patch and commit provenance, explicit feedback, reproducible automated checks. Wide/narrow usability and live chat behavior require observation; report them separately.

Failure: unrelated source features imported, unusable composer, missing provenance, or automated success presented as behavioral proof. A failed transfer with a useful record is still a successful test of the recording loop.

## Evidence and privacy
`adaptations/left-chat/` holds reusable intent and reference evidence. Local applications go in `.local/adaptation-runs/`; publish reviewed copies deliberately. Never modify Pi's saved sessions. Transcript inclusion is explicit opt-in; remove or redact raw copies before sharing. Local commit links will not resolve remotely until commits are pushed.

## Results
Author-run trial `left-chat-smoke-01` applied to starter 6116d82, resulting in f41b6d9. Automated check/test/build passed after removing inherited launcher ports. Original evaluation exposed an environment-coupled existing security test; this prompted narrow environment normalization and retained evaluation attempts. No browser or live-chat acceptance checks were performed. Results are partial, not a successful behavioral evaluation. See `adaptations/left-chat/applications/starter-smoke-01/feedback.md` for the reviewed record.

Deviation: the same agent authored the framework and performed the transfer, with prior source knowledge. This validates the mechanics, not instruction sufficiency. The application commit is local and unpushed; the exported patch is the durable implementation evidence for now.

## Lessons and next experiment
Do not expand the core instructions based on this trial. Next: visual/live checks, independent-agent transfer, then repeat on an app whose layout has already diverged. Compare minimal intent against intent plus failure-derived guidance, noting which evidence the agent actually used. Small trials are qualitative evidence, not a score for generalization.
