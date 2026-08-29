---
id: T-137-s3
title: The committed graph was already stale on main before T-137's lane was cut, and docs/STATE.md says it is current
status: parked
suggested_by: executor claude-opus-5 @T-137
touches: [docs/architecture/graph.json]
---

Absorbs: T-150-s3 (Amnesty triage 2026-08-29 (triage seat)) — the third lane, and the one that names the mechanism most precisely: the checkpoint that made index --check exit 1 is the one that regenerated the graph, because the two dogfood fixtures moved AFTER the regen inside the same commit. That is the shape the template's graph re-ask slot now exists to prevent, and it is why the checkpoint half of this class is discharged while the general half is not.

Absorbs: T-149-s3 (Amnesty triage 2026-08-29 (triage seat)) — the second lane to spend a measurement discovering the red was not its own: index --check exits 1 on an UNTOUCHED checkout of the dispatch commit both T-149 and T-150 were cut from. Same class, same cost, different week.

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

Amnesty triage 2026-08-29 (triage seat): PARKED — THE CHECKPOINT HALF IS DISCHARGED: the graph re-ask is now a slot the gated record must fill (docs/STATE-template.md carries GRAPH: index --check, asked never predicted), so a checkpoint can no longer regenerate, write, and never re-ask. THE GENERAL HALF IS NOT — the GRAPH REGEN gate does not fire on a commit that is not a merge, and the staleness this card measured was written by a non-merge commit that edited a .ts file with no gate behind it. Owner of its class: T-149-s3 and T-150-s3 are the same finding from two later lanes, each of which spent its own measurement discovering the red was not its own. RESURFACES: the merge of T-154 — a hook mechanism is the natural vehicle for a check that fires on a commit rather than on a merge — or the next tools/e2e dispatch. Whoever takes it SHALL re-derive the staleness at their own ref with THEIR OWN indexer: max_graph_bytes has moved once inside a single lane's lifetime, and a check run with an older binary reports a FALSE stale on a tree sitting between the two ceilings.
