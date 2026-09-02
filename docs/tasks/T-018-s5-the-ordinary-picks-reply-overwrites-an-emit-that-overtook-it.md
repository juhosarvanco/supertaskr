---
id: T-018-s5
title: The ordinary pick's reply OVERWRITES an emit that overtook it — `genesisSwitchIsOvertaken` guards the genesis branch and the `picked` branch has no guard at all
feature: F-02
milestone: 4
priority: 2
size: S
status: building
blocked_by: []
touches: [app/src/lib/watcher-store.ts, app/test/watcher-store.test.ts]
suggested_by: executor claude-opus-5@subagent @T-018-s2
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
review: independent
---

`reducePickOutcome`'s `"genesis"` branch asks
`genesisSwitchIsOvertaken(prev.docs, outcome)` before it applies the
switch, because an emit for the new root can reach the webview ahead of
the invoke reply and that emit is the LATER reading. Its `"picked"`
branch — the ordinary pick, the one the front door's folder picker
actually runs — asks nothing: it calls
`reduceDocs(prev.docs, outcome.snapshot)` unconditionally, and
`reduceDocs` applies any payload whose `seq` exceeds the watermark. So
an overtaking emit at a LOWER seq carrying NEWER bytes is applied first,
and the reply's own snapshot at a HIGHER seq carrying OLDER bytes then
overwrites it and advances the watermark past it. The newer tree is not
merely re-ordered; it is discarded until the next fs event under that
folder.

**WHY THIS WAS INVISIBLE, AND WHAT MADE IT VISIBLE.** The overtake is
DESIGNED on both paths and this repository already says so twice: on the
Rust side by
`the_watch_is_armed_before_the_switch_commits_so_an_emit_can_overtake_the_reply`,
and on the frontend by the existence of `genesisSwitchIsOvertaken`. What
hid the ordinary path was
`docs_watch::tests::picker_rearms_the_watcher_onto_the_new_root`, whose
`from_b.seq > picked.seq` asserted flat that a post-re-arm emit never
outranks-downward — i.e. that the overtake cannot happen here. It CAN,
and ubuntu-24.04 demonstrated it three times on docs-only diffs (CI runs
`33304351040` and `33566291111`, plus a sighting on `2e4b76f`; read them
with `--attempt 1`, each run having been re-run green). The Rust body's
own transcript is the reproduction: `docs-changed: seq=5` printed AFTER
`project folder picked: <B>`, carrying bytes written after the pick
returned. T-018-s2 narrowed that assertion to what the watcher actually
promises and left the overtake legal — which is what exposes this branch
rather than papering over it.

**THE MECHANISM, IN THE TWO PLACES IT LIVES.** `WatchState::next_seq`
draws before the collect on every path, so a stamp dates the START of a
collection and never its content; and `open_as_project` arms the new
root (the `Rearm` rendezvous) BEFORE it commits and stamps, exactly as
`apply_genesis_folder` does. Those two facts together are what make an
overtake possible, and they are identical on the two branches — so a
guard on only one of them is an asymmetry with no argument behind it.

## Acceptance criteria

1. WHEN a `picked` outcome's snapshot is not newer than the model the
   store already holds for that same `projectDir`, THE STORE SHALL keep
   the model it has and SHALL NOT move the watermark backwards — the
   shape `genesisSwitchIsOvertaken` already implements, applied to the
   `"picked"` branch.
2. THE FIX SHALL be one predicate serving both branches, or SHALL state
   in the file why the two cases differ; two spellings of one rule is
   the T-057 failure this project names by number.
3. THE BODY THAT PINS IT SHALL be shown RED against a store lacking the
   guard, with that demonstration recorded (`method/roles/verifier.md`
   step 2b), and SHALL drive the reducer with a real overtaking pair —
   a lower-seq snapshot applied first, then the reply's higher-seq
   older one — rather than asserting on a hand-built state.

**OUT OF T-018-s2's FENCE, WHICH IS WHY THIS IS A CARD AND NOT A
COMMIT.** That lane's fence is exactly
`app/src-tauri/src/docs_watch.rs`; the defect and its test both live
under `app/src/`.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 2

The architect seat, at the stamp of T-018-s2's merge (ba764b2). A
product defect on the front door's own path, verified in the file by
the T-018-s2 verifier independently of the lane that filed it
(watcher-store.ts :550/:606 guard the genesis branch; :586 guards
nothing). Criteria: WHEN a `picked` reply carries a snapshot whose `seq`
is lower than an emit already applied for the same root THE reducer
SHALL keep the emit and SHALL NOT move the watermark backwards or
overwrite newer bytes with older; a positive control SHALL replay the
runner's own interleaving (emit seq 5 before reply seq ≥6 carrying the
older read) and red under the unguarded branch; the genesis guard SHALL
be reused, not copied. Guard-class by consequence (data loss on the
front door): `review: independent`.
