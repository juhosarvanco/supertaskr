---
id: T-239-s3
title: The dispatch arm cuts the verifier's bench detached at the stamp and leaves it with nothing installed and nothing built, so the blind phase-one seat's first act is an npm ci it was not told about
feature: F-06
milestone: 4
size: S
priority: 3
status: planned
suggested_by: executor claude-opus-5@subagent @T-239
blocked_by: []
touches: [tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND BY CUTTING ONE.** T-239's sixth step is *"cut the verifier's
bench, detached, at the same base"*, and that is all it does — which is
exactly what the card asks for. `docs/CONVENTIONS.md`'s lane bullet then
says what the bench actually is: *"A FRESH WORKTREE HAS NOTHING INSTALLED
AND NOTHING BUILT"*, no `node_modules` in any of the three packages, no
`lib/parser/dist`, no `app/dist`.

**So the verifier's bench is cut early — orchestrator 5c's whole point —
and the install is still serial dead time at the moment the bench is
first used.** Phase one needs no build (it reads the card at the base
ref, 5d), so this is about phase TWO, and the build could be paid for
while the executor is still running rather than after it reports.

**Read the cost before taking it**: an install and a parser build in
every bench doubles the disk a four-lane sitting spends, and a bench that
is never used pays it for nothing. Measure before deciding, and consider
making it a flag rather than the default.

## Acceptance criteria

- THE arm SHALL either build the bench in the same motion it cuts it, or
  SAY in its printed lane facts that the bench is unbuilt and name the
  ordered commands that build it.
- ANY build the arm performs SHALL be measured against a dispatch that
  does not, and the figure SHALL be on this card.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at the T-239 merge (0f3e7ae)

The architect seat. Every verifier bench this sitting paid npm ci in tools/e2e and app plus an app build before its first gate, ten to fifteen minutes each under load; the arm cutting the bench built is the cheapest minute the loop has left. No dispatch follows today by the user's instruction.
