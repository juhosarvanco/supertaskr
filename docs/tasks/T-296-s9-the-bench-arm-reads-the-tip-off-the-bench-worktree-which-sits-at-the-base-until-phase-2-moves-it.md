---
id: T-296-s9
title: "The bench arm reads the tip off the bench worktree, which sits at the base until phase 2 moves it — run at the stamp it seals base-as-tip and renders a phase 2 brief whose range is empty, unless the seat checks the lane's tip out on the bench first"
feature: F-04
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "the seat (2026-09-11): at T-298's stamp `brief.mjs --bench T-298` printed tip d8e4a9dd, the base, because the bench worktree the dispatch cut still stood at the base; the seat checked out the lane's tip 91695451 on the bench and ran the arm again"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

The dispatch cuts the bench worktree detached at the base; phase 2's first action has always been to move it to the lane's tip. `brief.mjs --bench <id>` derives its tip by `git rev-parse` in the bench worktree, so run at the stamp — before any phase 2 exists — it reads the base twice, seals a card-at-base against a tip that is the base, and renders a phase 2 brief whose range `base..tip` is empty. The lane branch `task/<id>-*` carries the tip the arm should seal against, exactly as the merge verb derives its lane branch off `git for-each-ref`.

## Acceptance criteria

- WHEN the bench arm runs THE tip SHALL be the lane branch's HEAD (derived off `git for-each-ref refs/heads/task/<id>-*`, refusing on none or two) and THE arm SHALL move the bench worktree to that tip itself before taking the ground and sealing; WHEN the bench already stands at that tip THE move SHALL be a no-op said out loud.
- WHEN the lane branch's HEAD equals the base THE arm SHALL refuse, naming that no stamp has landed, rather than seal an empty range; a body SHALL show both the move and the refusal on a fixture.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 2 — the bench arm reads the tip off a worktree still at the base, sealing base-as-tip and rendering a phase-2 brief with an empty range. Not dispatched by this sitting.
