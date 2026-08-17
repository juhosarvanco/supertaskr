---
id: T-064
title: The switch tells one story — one reading of the folder, and the tree it carries survives
feature: F-03
milestone: 3
priority: 11
size: M
status: planned
blocked_by: []
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-042-s2, T-042-s3 (triage 2026-08-17). The suggestion files
are removed in the same commit as this card. Both are
`PickOutcome::Genesis` truthfulness at the same seam, both were filed
by T-042's executor and verifier respectively, and both want a RULING
between named arms rather than a hot-patch. Serialize app-shell.

TWO MEASUREMENTS OF ONE FOLDER, TAKEN AT DIFFERENT MOMENTS.
`probe = probe_plan(&canon)` runs BEFORE the rendezvous because its
answer decides whether genesis is offered at all; `snapshot =
build_snapshot(&canon, seq)` runs AFTER the ack and after the commit
because collecting earlier could produce a snapshot older than the
emit baseline. Between them sits a channel round trip with a 10 s
timeout. Write `docs/ROADMAP.md` in that window and the probe says "no
plan, offer genesis" while the snapshot ships a tree WITH a roadmap —
the interview screen over a folder that now has a plan, the exact
state criterion 5 exists to make unreachable, reached by timing rather
than by routing. What is NEW is that both readings ride the same
payload, so they CAN be compared, and nothing compares them.

AND THE TREE THE SWITCH CARRIES CAN BE DROPPED BY ITS OWN WATERMARK.
`resetDocsForProjectSwitch` KEEPS the seq watermark (the T-007
stale-drop invariant) and `applySnapshot` opens with
`if (payload.seq <= prev.seq) return prev`, so an overtaking
`docs-changed` emit for the NEW root leaves `switched` — the EMPTY
model. Measured through the real reducers by T-042's verifier:

    in-order    switch@7 -> fileCount=2 seq=7 phase=genesis
    overtaken   emit@8   -> fileCount=3 seq=8
                then switch@7 -> fileCount=0 seq=8 phase=genesis

"0 files written" over a docs/ that is not empty — the exact T-026-s4
symptom criterion 1 exists to remove, surviving one layer down.
NOT a regression either way: the branch point produced the same empty
model in the same interleaving and additionally regressed the
watermark. Criterion 1 is what makes a fix cheap for the first time —
before it there was nothing to salvage.

## Acceptance criteria
- THE SWITCH SHALL WIN, or the LATER READING SHALL WIN, and the
  choice SHALL be recorded with its reasoning before implementation.
  Preferred arm (b): if `snapshot.seq <= switched.seq` AND
  `switched.projectDir` already equals the switch's `projectDir`, the
  overtaking emit is the FRESHER measurement of the SAME folder —
  keep it instead of resetting to empty. Arm (a) — apply
  unconditionally for the genesis case with
  `max(switched.seq, snapshot.seq)` as the watermark — also keeps the
  stale-drop invariant and is acceptable if argued (T-042-s3).
- THE INTERLEAVING SHALL BE PINNED BY NAME whichever arm is taken —
  `arm_genesis` arms the watch BEFORE `apply_genesis_folder` commits,
  which is why an emit can overtake the invoke reply — so it cannot
  regress silently.
- THE PROBE AND THE SNAPSHOT SHALL NOT BE ABLE TO CONTRADICT EACH
  OTHER ON SCREEN. Preferred arm (a): re-derive `has_plan` from the
  snapshot (which already contains every docs file path) and route to
  `Picked` instead when the two disagree — one predicate, two inputs,
  the LATER reading wins, which is the truthfulness posture the rest
  of this seam takes (T-042-s2).
- IF instead the probe is kept as a decision record THEN it SHALL say
  so in its own type or doc comment ("what the folder looked like
  when genesis was decided"), and the frozen-lie window SHALL be
  named in notes rather than left implicit (T-042-s2 arm b).
- THE LIVE-CONSUMER QUESTION SHALL BE ANSWERED BEFORE THE FIELD IS
  KEPT: nothing on the genesis SCREEN renders `probe` —
  `reducePickOutcome` stores `genesisDir` and the docs model and lets
  `resolvedProbe` go null. If it has no consumer, dropping it is arm
  (c) and is cheaper than defending it (T-042-s2).
- THE RACE SHALL BE DRIVEN, not argued: a test that writes
  `docs/ROADMAP.md` between probe and snapshot and asserts the app
  does not land on the interview screen over a planned folder.
- RELATED AND NOT ABSORBED: T-026-s1 (the probe's exact-case match)
  is the other place the probe and the filesystem disagree; it stays
  parked pending the Linux lane and SHALL be re-read by whoever
  builds this. If arm (a) re-derives `has_plan` from the snapshot,
  the casing question moves with it — one predicate, one place to
  decide the rule.

Verification: headless — cargo tests through the watcher plus vitest
against the real reducers for both interleavings. @human: none.

## Implementation notes

## Verdicts
