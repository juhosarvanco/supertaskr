---
id: T-042
title: Genesis switch truthfulness — the snapshot, the transitions, the echo, the change log
feature: F-03
milestone: 3
priority: 5
size: M
status: building
blocked_by: []
touches: [app-shell, app-interview]
builder: claude-opus-5
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

CORRECTED 2026-08-17 by T-027's planning pass, which read both sides:
**T-027 is NOT the second consumer** and this card's original premise
was wrong. T-024's log answers "what changed in the last 5 seconds"
(the writing pulse); T-027's banked chips need "what changed since
this turn began" — a per-turn baseline diff. Same evidence, different
window, no shared log; T-027 reads T-024's log not at all and
introduces no second rolling log of its own. So criterion 4's forcing
function has evaporated.

STILL LAND BEFORE T-027, for a different and better reason: criterion
1. A genesis switch onto a folder whose `docs/` already holds files
sends no snapshot, so T-027's turn-1 baseline would be empty and every
pre-existing file would chip as if the planner had just written it.
T-027's plan chose to accept that lie and tripwire it rather than lose
every interview's turn-1 scaffold chips. Landing this first removes
the case by construction and DELETES a tripwire instead of adding one.

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
- THE render-phase ref stamp SHALL be RATIFIED rather than relocated
  — the architect's pick, recorded here before dispatch as the
  criterion requires (T-024-s3). Rationale: the arm that moved the log
  into the watcher store existed to serve a second consumer, and
  T-027's planning pass proved there is no second consumer. Moving
  state across a component boundary to serve nobody is cost without
  benefit, and `observeDocsChange` is already a pure fold whose
  identity guarantees are pinned. So: the pattern is recorded in
  `GenesisPane.tsx`'s header AND as a CONVENTIONS gotcha (a
  render-phase ref stamp is legitimate HERE because it is guarded,
  bounded to a few-ms pulse window, and derives from props the render
  already has — the T-012 precedent), `observeDocsChange`'s identity
  guarantees for the empty / already-observed / stale-seq cases keep
  their pins, and NOTHING moves into the store. IF a future second
  consumer appears THEN the relocation is a change of source, not of
  mechanism — recorded so the option stays open rather than lost.
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
