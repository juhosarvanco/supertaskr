---
id: T-149-s3
title: The committed graph was already STALE at the dispatch commit both T-149 and T-150 were cut from — `index --check` exits 1 on an untouched checkout of 23ee41b
status: suggested
suggested_by: executor claude-opus-5 @T-149
---

**MEASURED ON A DETACHED WORKTREE OF `23ee41b` THAT NO LANE HAD
TOUCHED**, with this lane's own binary and an explicit `--root`:

    nputer-index index --check --root <clean checkout of 23ee41b>   exit 1

    graph.json is STALE - the committed graph does not match a fresh index
      committed:   1020023 bytes · 189 files · 2152 symbols · 2111 edges
      fresh index: 1020023 bytes · 189 files · 2152 symbols · 2111 edges
      files  +0  -0  ~2
      | ~ app/test/architecture-dogfood.test.ts   (content, loc 2249 -> 2266)
      | ~ app/test/map-dogfood-render.test.tsx    (content, loc  766 ->  770)

**IT IS A REAL RED, NOT THE `--root` FALSE RED.** CONVENTIONS' own
discriminator is the second line: a false red prints
`committed: MISSING at docs/architecture/graph.json`, a real one prints
both counts and a `+`/`-`/`~` file diff. This prints both counts and
names two files.

**AND `map-dogfood-render.test.tsx` IS THE ONE THAT MAKES IT FILEABLE.**
T-149's lane never opened that file — `git status` in the lane lists
seven registry files and `architecture-dogfood.test.ts`, nothing else —
so its 766 -> 770 drift is inherited, not this lane's. Ruling by
`integrator.md` rule 3 (*was the thing true one commit ago?*): it was
already false at the dispatch commit, so it is **FILED**, not repaired
here.

## The mechanism is the dispatch-source rule, read for its reason

CONVENTIONS says *DISPATCH FROM THE LAST CHECKPOINT, never from a merge
commit*, and T-089 already recorded that the rule's LETTER and its
REASON disagree — a non-merge commit after the checkpoint carries the
checkpoint's graph and is safe on that count. `23ee41b`
(*"T-149 and T-150 dispatch: status building"*) is exactly that shape:
docs-only, not a merge, after the newest checkpoint. **The reason held
for the dispatch commit and the graph was stale anyway**, because the
staleness predates it — the two fixture bodies were edited by an earlier
merge whose checkpoint did not regenerate afterwards, which is precisely
the ordering GRAPH REGEN's *WHY THE CHECKPOINT AND NOT THE MERGE*
paragraph exists to prevent.

## Why this is worth a card rather than a line in a checkpoint

The staleness is **invisible to every gate that runs today**.
`cargo test` is 518/0/4 exit 0 over it, `npm test` from `app/` is
1013/1013 over it, `arch drift` exits 0, and `arch` reads the committed
graph rather than the tree — so a stale graph makes every `arch`-derived
figure in this lane, this card and the next checkpoint a statement about
a tree that no longer exists. Nothing reds; the numbers just quietly
answer about yesterday.

## What to check when taking it

1. Whether the two `loc` drifts are the whole of it — regenerate and
   diff the graph, do not assume the summary line. Bytes, files, symbols
   and edges all MATCH across this staleness, which is the trap
   STATE.md's GRAPH REGEN note already names: *a byte count is not a
   content check; neither is the whole summary line*.
2. Whether the checkpoint that last touched those two bodies skipped its
   regen, or ran it before the reconciliation rather than after. That is
   a one-command answer per checkpoint and it decides whether the remedy
   is a habit or a ratchet.

Fence: `[docs/architecture/graph.json]` for the regen itself; the
diagnosis needs nothing.
