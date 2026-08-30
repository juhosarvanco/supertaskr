---
id: T-157
title: Session economics enters the seats — the method governs what sessions read but nothing about how they run
feature: F-01
milestone: 4
priority: 36
size: S
status: building
blocked_by: []
touches: [docs/checkpoints/, tools/e2e]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

ADR-020's companion adoption, from the token-economics comparison
(2026-08-29). The structure already institutionalizes the big plays —
one-lane-one-session IS /clear-by-construction, the budgeted
read-first set IS the startup cleanup — but the seats have no
run-hygiene text at all, and the seat most exposed is the one that
persists: the architect session that produced eight derivation errors
had run eleven verdicts in one accumulating context.

## What lands where

1. **Per-seat run hygiene** (method text, rides `T-159`'s bump):
   model and effort set at session start, never switched mid-lane
   (the cache is the economics); STANDING seats — orchestrator,
   integrator — compact between dispatches; noisy jobs (log grinds,
   suite output triage) run in subagents that return only their
   answer; commands carry quiet flags where the count survives
   (reading the COUNT as well as the exit remains the law).
2. **The brief's recommended-model row** (tools/e2e): derived from
   the card's own `size:` and kind — the know-vs-try heuristic made
   mechanical. Advisory, never enforced; the card's `builder:` intent
   field stays authoritative (the D5 ruling).
3. **The metrics slot's stamped lines** (docs/checkpoints/TEMPLATE):
   tokens spent this card (a live-environment fact — STAMPED in the
   record, never derived from the tree) and total gate runtime, so
   the machinery's own cost trends instead of being anecdotal.

## Acceptance criteria

- WHEN a brief is assembled THE recommended-model row SHALL derive
  from the card and say so, never from the assembling session's own
  dials.
- WHEN a checkpoint record is written THE metrics slot SHALL carry
  stamped token and gate-runtime lines or an explicit
  "not derivable here" — never silence.
- IF the hygiene text and the brief row disagree THEN the method text
  is the authority and the row cites it.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
