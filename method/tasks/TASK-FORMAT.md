# Task file format

One file per task: `docs/tasks/T-NNN-slug.md`. The story map, the dispatch
order, and the model assignment are all pure functions of this frontmatter —
no layout or state is stored anywhere else.

```yaml
---
id: T-016
title: Audit log
feature: F-03            # story map column
milestone: 2             # above/below the slice line
priority: 2              # position in column; 1 = top = next
size: M                  # S | M | L — sets the ceremony tier
status: planned          # suggested | planned | building | verifying |
                         # rejected | merging | done | parked
blocked_by: [T-015]
touches: [C-03, src/egress/]   # expected blast radius; orchestrator never
                               # parallelizes tasks with overlapping touches
suggested_by:            # role, model@session, or human — set on suggestions;
                         # kept after promotion for attribution
builder:                 # model[@session]; empty = nputer.yaml default
verifier:                # model[@session]; empty = default (independent)
built_by:                # stamped on completion, e.g. codex/gpt-5.2 @S3
verified_by:             # stamped, e.g. claude-fable-5 @fresh
review: independent      # independent | same-model | self-verified (stamped)
---
```

## Body sections

```
## Acceptance criteria     EARS notation (see interview/decomposition.md);
                           each line enforceable by a test
## Implementation notes    appended by the executor before it dies
## Verdicts                appended by the verifier, one dated entry per pass:
                           APPROVED, or REJECTED + concrete failures
```

## Session syntax

`codex` = default session policy (fresh) · `codex@fresh` = explicit fresh ·
`codex@S3` = resume registered session S3. Verifier may be any model or
session, including the builder's — the `review:` field records which
guarantee actually held, so the board can render self-verified checks
differently from independent ones.

## Task creation — single writer

Only the ARCHITECT (planner/orchestrator role) creates tasks with
status: planned. This is where plan coherence lives: one gatekeeper
applies the decomposition rules, so a card on the board always means
the same thing.

Everyone else suggests. A suggestion is a minimal file:
status: suggested, title, one paragraph of context, suggested_by.
Suggested cards are NOT in the queue — the dashboard renders them as
ghosts (dashed) at the bottom of their feature column.

- Executor mid-build: discovery BLOCKS your current task -> open a
  consultation room. It doesn't block -> file a suggestion and return
  to your task. A suggestion is never an excuse to expand scope.
- Verifier: non-blocking improvement ideas -> suggestions (replaces the
  earlier route-to-Parked rule; Parked remains for backbone-level ideas).
- Human: new FEATURES go to the architect (project room or directly),
  which runs a mini-interview (who is it for, what is observable when it
  works, what does it displace), adds it to the backbone, and runs a
  decomposition pass. New features land BELOW the current slice line
  unless the human explicitly bumps them — bumping means something else
  visibly moves down.

Architect triage (a duty of every architect session): promote (rewrite
through the FULL decomposition rules — the suggestion is raw material,
the rewrite makes it exact), park, or reject with one line of reasoning
left in the file. Nothing is silently deleted.

## Lifecycle rules

- Fields lock at dispatch (status: building); unlock on rejected/planned.
- A rejected task goes to a FRESH executor (never the author session, which
  would defend its work) — unless a human explicitly overrides.
- Two rejections → stop; open a room, escalate to the human.
- On done: stamp built_by / verified_by / review.

## Ceremony by size

| Size | Pipeline |
|------|----------|
| S | executor + tests. No verifier, no separate integrator. |
| M | executor → verifier → integrator. |
| L | planning pass (or debate room) → executor → verifier → integrator. |

The default path must feel lighter than not using the system.

## Parallelism guardrails

- Tasks with overlapping `touches:` never run concurrently.
- Ceiling: 3–5 concurrent agents. Past that, verification — not
  generation — becomes the bottleneck and quality quietly drops.
- When in doubt, run turn-based; parallel is an optimization, not
  the point.
