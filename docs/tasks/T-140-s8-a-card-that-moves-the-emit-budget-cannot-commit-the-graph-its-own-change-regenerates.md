---
id: T-140-s8
title: A card that moves the emit budget cannot commit the graph its own change regenerates — the dogfood pins are inside the fence and docs/architecture/graph.json is outside it, so the branch is green only against an uncommitted file
feature: F-06
milestone: 4
priority: 12
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-140-s4
blocked_by: []
touches: [docs/CONVENTIONS.md, method/lane-protocol.md]
builder:
verifier:
built_by:
verified_by:
review:
---

**THE INSTANCE, MEASURED IN THIS LANE.** `T-140-s4`'s fence is
`touches: [app-shell, app-map, crate-index]`, which expands to 64 paths.
Two of them are `app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` — the pins that count files,
symbols, nodes and edges in the committed graph. The graph itself,
`docs/architecture/graph.json`, is NOT among the 64, and the fence hook
refuses it by name (verified by running
`.claude/hooks/lane-fence-hook.mjs` against that path: exit 2).

That is not an arbitrary refusal — it is CONVENTIONS' GRAPH REGEN bullet
working as written: the regen is committed *"with the CHECKPOINT"*,
because the checkpoint edits the indexed fixture files and a graph
regenerated into the merge is stale again the moment they are
reconciled (measured at T-050). **The rule is right for the ORDINARY
lane, whose diff moves the graph incidentally and whose pins the
INTEGRATOR reconciles.** This card is about the lane where it is not.

**WHY THIS LANE IS DIFFERENT: THE PINS MOVE BECAUSE OF THE LANE'S OWN
VALUE CALL, NOT AS A SIDE EFFECT.** `T-140-s4` raised
`IndexOptions::max_graph_bytes` from 1 040 000 to 2 145 959. That is the
whole point of the card, and it is what untruncates four files and moves
`C-12 -> C-10 confirmed` from 7 to 6. The executor was instructed to
move the pins *with the story* — correctly, because only the executor
knows the story. So the lane necessarily commits a pin whose evidence it
is forbidden to commit.

**WHAT THE BRANCH LOOKS LIKE AS A RESULT, stated so nobody rediscovers
it as a bug.** At `656511f` the branch carries the new pin and the OLD
graph. A fresh checkout of it reds `architecture-dogfood` by exactly one
row and reds `index --check` as STALE. The lane's own worktree is green
because it holds the regenerated file UNCOMMITTED. Both facts are true
at once and neither is a defect in the work; the handoff is the defect.

**THREE DISPOSITIONS, AND THIS CARD PREFERS THE THIRD.**

1. *Widen the fence for budget-moving cards.* Cheap, and wrong in the
   general case — it hands every such lane a file the checkpoint will
   regenerate anyway, and reintroduces the T-050 staleness.
2. *Forbid the lane from moving the pins.* Also wrong: the integrator
   would then be reconciling a pin whose story it did not live through,
   which is what "re-derived and explained, never loosened" exists to
   prevent.
3. *Name the state.* CONVENTIONS' GRAPH REGEN bullet gains a clause for
   the case where a lane's own diff moves the pins DELIBERATELY: the
   lane commits the pins, regenerates the graph in its worktree, leaves
   it uncommitted, and SAYS SO in its notes and its report — and the
   verifier is told to expect a red `index --check` on a fresh checkout
   and to reproduce in the lane's own worktree, which lane-protocol rule
   6 already preserves for exactly this reason.

**ACCEPTANCE.** (a) A reader of CONVENTIONS can tell, before dispatch,
which of the two cases their card is; (b) the verifier's own file says
what to do with a branch whose graph is deliberately stale; (c) no
change to the fence machinery — this is a documented protocol, not a
new mechanism, and a mechanism should wait until the clause leaks.

**RELATED.** `T-140-s7` (unclaimed territory from a fence that names
paths one by one) is the same family one level down: a fence derived
from `touches:` cannot see a file nobody assigned. This one is a file
everybody assigned to the checkpoint.
