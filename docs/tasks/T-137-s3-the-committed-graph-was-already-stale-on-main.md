---
id: T-137-s3
title: The committed graph was already stale on main before T-137's lane was cut, and docs/STATE.md says it is current
status: suggested
suggested_by: executor claude-opus-5 @T-137
touches: [docs/architecture/graph.json]
---

**DERIVED, NOT NOTICED IN PASSING.** `T-137`'s lane ran its own built
indexer against a DETACHED worktree at its base commit `00e133a`, holding
none of the lane's files:

    index --check --root <base>   exit 1
      committed:   989181 bytes · 183 files · 2101 symbols · 2033 edges
      fresh index: 989181 bytes · 183 files · 2101 symbols · 2033 edges
      files  +0  -0  ~1
      | ~ app/test/architecture-dogfood.test.ts  (content, loc 1974 -> 1979)

**One file, content only, no truncation.** The cause is `6dc5757` ("Four
@human rulings recorded…"), which edited that file after the `T-111`
checkpoint committed the graph at `7fd6ffb`, with no regen behind it.

**WHY IT MATTERS MORE THAN ONE FILE'S LOC.** `docs/STATE.md` opens with
*"NOTHING IS BROKEN"* and its Documents-ticked section says `graph.json`
is REGENERATED and COMMITTED. A lane that asks the gate — as every lane is
told to — gets exit 1 and has to decide, on its own, whether the staleness
is its own. **This lane spent a measurement finding out that it was not.**

**THE INSTANCE IS PROBABLY ALREADY CLOSED AND THE MECHANISM IS NOT.**
`ae92f67` — `T-139`'s checkpoint, landed while `T-137`'s lane ran —
regenerated the graph, so this particular staleness is very likely gone.
**That was NOT verified here, and the reason is worth stating rather than
skipping:** checking main's graph needs main's OWN indexer, because
`T-139` also moved `max_graph_bytes` from `1_000_000` to `1_040_000`, and
a check run with the older binary can report a FALSE stale on a tree whose
fresh index sits between the two ceilings. This lane may not build in the
integration checkout, so it did not guess.

**THE GENERAL FIX IS THE ONE WORTH THE CARD**: the GRAPH REGEN gate does
not fire on a commit that is not a merge. `6dc5757` was the architect's
own commit, it edited a `.ts` file, and no gate ran behind it — so the
staleness was invisible until a lane cut from it asked, and that lane had
to spend a measurement to learn the red was not its own.
