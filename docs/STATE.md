# State

Updated: 2026-08-14 by janitor pass, claude-fable-5 @chat-session

## Just completed
Milestone 0 planning is done. Interview COMPLETE (all 7): first user =
technical builder (rooms/first-user.md) · success criteria, non-goals,
constraints in NORTH_STAR · stack ADR-007 · riskiest assumption =
plan-keeps-agents-coherent (leading indicators in NORTH_STAR) · first
slice = milestone 1 "the mirror". Decomposition DONE: docs/tasks/
T-001…T-007 with EARS criteria, sizes, touches, dependencies. Name
DECIDED: nputer (rooms/naming.md; npm/PyPI free). Convention frozen at
v0.1.3 (method/). Market map banked (docs/research/competitors.md).

Then: a cold-start review (fresh session, folder only) found record
drift; this janitor pass fixed it — STATE rewritten as a snapshot,
ROADMAP milestone-0 boxes ticked, alku→nputer rename completed
(runtime yaml, ADR-001 filename), method/README stale pointers
dropped, ARCHITECTURE reconciled with ADR-007/008 (C-06 lib-parser,
touches vocabulary, code layout), T-001 dispatchability gaps closed
(tokens file, app/ location). Folder put under git; the pre-cleanup
baseline is the first commit.

## In progress / broken right now
Nothing building; no code exists yet (first code = T-001/T-002).
Known gap, not a blocker: domain + trademark sweep for "nputer".

## Next up (1–3)
1. Dispatch T-001 (app shell) to an executor session
   (method/roles/executor.md, own worktree). T-002 (parser) may run
   in parallel — touches are disjoint (app-shell vs lib-parser).
2. Verify T-001/T-002 per verifier role; integrate; first checkpoint.
3. Domain (.dev/.fi/.com) + trademark sweep for "nputer".

## Open questions
None — milestone 1 is dispatchable.
