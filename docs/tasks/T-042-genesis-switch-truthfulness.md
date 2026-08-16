---
id: T-042
title: Genesis switch truthfulness — the snapshot, the transitions, the echo, the change log
feature: F-03
milestone: 3
priority: 5
size: M
status: planned
blocked_by: []
touches: [app-shell, app-interview]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-024-s3, T-026-s4, T-026-s5, T-026-s6. Triage 2026-08-16:
four findings on one seam — `apply_genesis_folder`/`arm_genesis`/
`rearm`/`ensure_docs_watch` in docs_watch.rs and
`reducePickOutcome`/`runPicker` in watcher-store.ts — every one of them
the T-018 family's shape, a claim outliving the truth. Three were
reproduced first-hand by T-026's verifier with exact counts. Landing
them separately would rebuild the same batch-seam fixtures three
times. Serialize app-shell with T-041/T-022 at dispatch.

Land before or with T-027: criterion 4 decides where the docs change
log lives, and T-027's banked-chip criterion makes it the SECOND
consumer — the exact trigger T-024-s3 said to decide before.

## Acceptance criteria
- WHEN a genesis switch lands on a folder whose docs/ already holds
  files but no plan THE outcome SHALL carry the collected tree as a
  snapshot, so the pane renders what is actually there instead of
  `docs/ · nothing written yet` over a non-empty docs/. The path
  already collected the tree; this costs one `build_snapshot`. The
  verifier's repro is the failing→passing pin: a folder with
  docs/ARCHITECTURE.md + docs/decisions/001-x.md yields
  `Genesis (probe { architecture: true, .. })` and then NO emit at all
  in a 1.2 s window after `settle()`, while a subsequent real edit
  emits 2 files — proving the watch was armed the whole time
  (T-026-s4).
- WHEN an armed docs/ becomes unarmed (an EMPTY docs/ deleted) THE
  watcher SHALL emit on the transition, exactly as T-026's criterion 4
  made the (unarmed → armed) transition emit — ONE rule ("a
  watch-state transition is news the tree cannot carry"), not two
  special cases, and the suppression invariant stays exactly as narrow
  as today. Pinned by the verifier's five-step sequence: appears →
  emits once; next batch silent; DELETED → emits; recreated → emits
  once; next batch silent (T-026-s5).
- THE `model-updated` echo SHALL fire only for a payload a real
  snapshot produced — the guard reads provenance, not the seq — and
  `runPicker`'s two comments SHALL say what the code does. Today the
  genesis case deliberately advances the watermark
  (`docs: { ...resetDocsForProjectSwitch(prev.docs), seq: outcome.seq }`)
  so late emits are provably stale, Rust's seq is global and
  monotonic, and the guard is therefore ALWAYS true: a real probe
  emitted `model-updated {"seq":7,"generatedAtMs":0,...}` — the zero
  timestamp is the tell. A test SHALL assert a snapshot-less switch
  emits no echo AND that a real snapshot still does (T-026-s6).
- THE docs change log SHALL be folded where a second consumer can
  share it — beside the snapshot in the watcher store — so GenesisPane
  becomes a pure function of its props and T-027's chat reads the same
  log instead of keeping its own; `observeDocsChange`'s identity
  guarantees for the empty/already-observed/stale-seq cases SHALL stay
  pinned. IF the architect instead rules the render-phase ref stamp
  (`GenesisPane.tsx:140`) a ratified pattern THEN the ruling SHALL be
  recorded in the pane's header AND in CONVENTIONS' Gotchas rather
  than left implicit. The pick is recorded in this file before
  dispatch (T-024-s3).
- THE existing suppression, stale-drop and project-switch invariants
  SHALL keep their current tests green — changed, never loosened.

Verification: headless — cargo tests driving T-018's batch seam with
exact emit counts; vitest on the store; jsdom on the pane. IF T-041 has
landed THEN its genesis spec renders the non-empty-docs shape too.
@human: none NEW — criterion 1 ANSWERS the T-026-s4 question currently
on the visual list ("does 'nothing written yet' read right over a
non-empty docs/"): after this task the screen never makes that claim,
so the item retires rather than being judged.

## Implementation notes

## Verdicts
