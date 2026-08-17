---
id: T-042-s3
title: The tree the switch carries is dropped by its own watermark when a docs-changed emit overtakes it
status: suggested
suggested_by: verifier claude-opus-5 @T-042
---

Criterion 1 makes `PickOutcome::Genesis` carry the folder's docs tree,
and `reducePickOutcome` applies it through `applySnapshot`:

&nbsp;&nbsp;&nbsp;&nbsp;`const switched = resetDocsForProjectSwitch(prev.docs);`
&nbsp;&nbsp;&nbsp;&nbsp;`... : applySnapshot(switched, snapshot)`

`resetDocsForProjectSwitch` KEEPS the seq watermark (the T-007
stale-drop invariant), and `applySnapshot` opens with
`if (payload.seq <= prev.seq) return prev`. So when the watermark has
already moved PAST the switch's own seq, the switch's snapshot is
dropped as stale and what survives is `switched` — the EMPTY model.

That is reachable. `arm_genesis` arms the watch before
`apply_genesis_folder` commits, so a `docs-changed` emit for the NEW
root can carry a seq greater than the switch's and be delivered before
the invoke reply. Measured through the real reducers (verifier,
2026-08-17, probe removed, tree clean):

&nbsp;&nbsp;&nbsp;&nbsp;in-order&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;switch@7 &nbsp;-> fileCount=2 seq=7 phase=genesis
&nbsp;&nbsp;&nbsp;&nbsp;overtaken&nbsp;&nbsp;&nbsp;&nbsp;emit@8 &nbsp;&nbsp;&nbsp;-> fileCount=3 seq=8
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;then switch@7 -> **fileCount=0** seq=8 phase=genesis

The end state is `0 files written` over a docs/ that is not empty —
the exact T-026-s4 symptom criterion 1 exists to remove, surviving in a
narrow window one layer down.

**This is NOT a regression and NOT a criterion-1 failure.** Criterion
1's SHALL is about what the OUTCOME carries, and it demonstrably
carries the tree — pinned in Rust and in the reducer. The drop is a
pre-existing frontend ordering hole: the branch point's genesis case
(`{ ...resetDocsForProjectSwitch(prev.docs), seq: outcome.seq }`)
produced the same empty model in the same interleaving, and additionally
REGRESSED the watermark from 8 to 7. T-042 leaves the lie identical and
the watermark strictly better.

Why it is worth filing anyway: the window is narrow (an fs event under
the new docs/ must clear the 250 ms debounce AND the invoke reply must
be delayed past it, while `apply_genesis_folder` returns microseconds
after the ack), but criterion 1 is what makes a fix cheap for the first
time — the tree is now ON the outcome, so there is something to keep.
Before it there was nothing to salvage.

Three candidate answers:
(a) **Let the switch win.** A project switch is the one event entitled
    to re-baseline; apply the snapshot unconditionally for the genesis
    case and take `max(switched.seq, snapshot.seq)` as the watermark.
    Keeps the stale-drop invariant (nothing below the max applies) and
    keeps the tree.
(b) **Detect and prefer the later reading.** If
    `snapshot.seq <= switched.seq` AND `switched.projectDir` already
    equals the switch's `projectDir`, the overtaking emit is the
    fresher measurement of the SAME folder — keep it instead of
    resetting to empty.
(c) **Do nothing, and pin it.** Record that a switch may land on an
    already-newer model and that the next content change heals it, with
    a test naming the interleaving so it cannot regress silently.

Not blocking T-027: its turn-1 baseline is taken when the interview has
not yet written anything, so there is no emit to overtake the switch at
the moment that matters.
