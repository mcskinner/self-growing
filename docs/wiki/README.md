# Working wiki

An evolving map of self-growing software. Start at [the index](index.md); see [the log](log.md) for how the thinking developed.

These pages are synthesis, not requirements, commitments, agent instructions, or a roadmap. They may contain competing ideas. A proposed capability is not permission to implement it.

## Maintain it lightly

- Write concise, linked concept pages. Update an existing page before creating a near-duplicate. Human edits are welcome; the agent helps with synthesis and bookkeeping.
- Distinguish implemented behavior, observations, hypotheses, and open questions. Do not turn an appealing analogy into a proven mechanism.
- Link evidence where practical: source notes, code at a commit, experiment protocols, and application feedback. Mark conversation summaries as summaries, not quotations or independently verified facts.
- Preserve disagreements and uncertainty. New evidence can supersede a claim; explain why rather than silently rewriting the history of an experiment.
- Keep the index navigable and append significant synthesis, discussion, or lint events to the log. No entry is needed for every typo or file edit. Git preserves the exact edits; the log explains the intellectual event.
- Review private information before filing it. Do not copy saved chats wholesale or modify Pi's sessions. The journal here was explicitly supplied for this exploration.

## Operations

**Capture / synthesize:** discuss an idea or inspect evidence, then update the relevant pages and links. Not every conversation needs a new page. Sources can stay where they already live; there is no required raw-source ingestion system.

**Query:** use the index to find relevant pages, consult their evidence, and answer with links. File useful new connections back into the wiki when asked, rather than treating every answer as a permanent fact.

**Lint:** run `python scripts/wiki_lint.py` for local links and index coverage. Then read the pages and consider contradictions, stale implementation claims, unsupported assertions, missing connections, and unanswered questions. Report ambiguities; do not automatically resolve them or manufacture pages for every noun. Log a meaningful review and its findings.

**Promote:** when we choose to test an idea, create an [experiment protocol](../../adaptations/templates/protocol.md). When we choose a design, record it explicitly in an appropriate design document. Neither happens automatically because an idea appears here.

## Origins

Inspired by Karpathy's [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f): maintain persistent, interconnected synthesis rather than rediscovering everything from sources on each question. Here the evidence is often the project itself, its conversations, and its experiments—not an external document collection. We borrow the index, chronological log, and maintenance loop without requiring the rest of a knowledge-management platform.
