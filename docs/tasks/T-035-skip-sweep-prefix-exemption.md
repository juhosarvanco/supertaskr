---
id: T-035
title: Skip-sweep prefix exemption — a dir-level skip stops sweeping the records under it
feature: F-02
milestone: 4
priority: 19
size: S
status: planned
blocked_by: []
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-018-s2. Triage 2026-08-16: T-018's one residual
truthfulness gap — chmod-000 on docs/tasks/ makes every task record
leave the model as apparent deletions while the chip truthfully says
"1 skipped". Rust cannot enumerate an unreadable dir; the frontend's
lastGood map already knows what lived there. Frontend-only; serialize
app-shell at dispatch.

## Acceptance criteria
- WHEN a snapshot carries a dir-level skip (`unreadable`, `tooDeep`)
  THE reducer's skip pass SHALL treat the skipped path as a PREFIX:
  lastGood entries under `<path>/` are exempt from the deletion sweep
  and render `showingLastGood: true` — the same machinery per-file
  skips already use (applySnapshot in app/src/lib/docs-model.ts).
- THE suite SHALL pin the repro at reducer level: a previously
  collected record under a subtree, then an emit carrying only the
  dir-level skip — the record stays, marked stale, never a phantom
  deletion.
- IF the directory becomes readable again THEN normal collection
  SHALL resume and the lastGood marking clear (existing machinery,
  pinned).

## Implementation notes

## Verdicts
