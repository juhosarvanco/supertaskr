---
id: T-189-s2
title: The 3–5 concurrent ceiling is stated in two method files and neither defers to the other
status: suggested
suggested_by: "executor claude-opus-5 @T-189, 2026-08-31 — inside T-189's fence, outside its acceptance criteria"
---

Two copies, derived at `7f7716f`:

- `method/roles/orchestrator.md:41` — *"Ceiling: 3–5 concurrent."*, inside
  the dispatch-order step.
- `method/tasks/TASK-FORMAT.md`, `## Parallelism guardrails` — *"Ceiling:
  3–5 concurrent agents. Past that, verification — not generation —
  becomes the bottleneck and quality quietly drops."*

**Neither names the other and neither is marked authoritative**, which is
the exact shape `roles/executor.md` rules against under *"Nothing in the
brief may be the only copy of itself"*: **redundancy with no precedence
rule is two facts, not one fact checked twice.** The numbers agree today.
That is what a drift hazard looks like before it drifts, and the same
file already carries the worked precedent — `tasks/TASK-FORMAT.md` owns
the FIELD, `roles/orchestrator.md` owns the ACT.

`T-189` deliberately did not touch either. Its resolution makes the lane
COUNT non-operative for self-integration, so the ceiling needed no
amendment from that card — but the duplication is real, it is one
sentence from the rule `T-189` amended, and a card that fixes it must
RULE which file owns the figure rather than editing both.

## Acceptance criteria

- THE ceiling SHALL be stated in exactly one method file, and the other
  SHALL cite it.
- THE choice of owner SHALL be argued from the split this method already
  uses — the value's home file versus the acting role's file — and not
  from which sentence reads better.
- WHERE the two spellings differ today (one carries the *why*, one does
  not), the surviving statement SHALL keep the reasoning.

## Fence

`method/roles/orchestrator.md`, `method/tasks/TASK-FORMAT.md`. Note
`tasks/TASK-FORMAT.md` is a `KIT_FILES` entry, so this card is *touching
shipped code* and owes `cargo test` that no gate trigger names
(`docs/CONVENTIONS.md`, METHOD EVAL GATE bullet).
