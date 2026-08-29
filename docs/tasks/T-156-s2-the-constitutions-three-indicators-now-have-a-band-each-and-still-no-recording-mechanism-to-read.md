---
id: T-156-s2
title: The constitution's three indicators now have a band each and still nothing to read, because the recording mechanisms they need all live outside the fence that declared them
status: suggested
suggested_by: executor claude-opus-5 @T-156
---

T-156 declared `north-star/cold-start-pass-rate`,
`north-star/drift-incidents` and `north-star/rejection-rate-by-size` as
bands with `authority.kind: "none"`. That is as far as a fence of
`[tools/e2e]` reaches, and the card knew it — the bands are named on
every run, are never reported as holding, and cost the run exit 3. What
they still do not have is anything to read, and each needs a write
somewhere else.

**THIS IS THE HALF THAT MATTERS, AND IT IS NOT A SCRIPT.** The scanner
is the easy part in all three cases. The missing thing is a MARKER — a
place where the fact is recorded at the moment it happens, by whoever it
happens to.

## 1. Cold-start pass rate (NORTH_STAR success criterion 4, target 100%)

Nothing records that a switch HAPPENED, so the denominator does not
exist. A verdict, a checkpoint or a room could carry it; the cheapest
shape is probably a line in the checkpoint record naming the seat, the
model, and whether the cold start held on the first try. **Note the
sampling trap:** a switch that went badly is exactly the one nobody
writes up, so the marker has to be owed by the SESSION rather than by
the person who noticed a problem.

## 2. Drift incidents (NORTH_STAR, riskiest assumption)

*Work contradicting NORTH_STAR/ARCHITECTURE caught by verifier or
human.* The incidents are not missing — verdicts and rooms are full of
them — but nothing distinguishes one from ordinary prose. A dated
marker a verdict or a room can carry would do it, and it wants to be
narrow enough that a rejection ON OTHER GROUNDS is not counted as drift.

## 3. Rejection rate per task size — THE ONE THAT WAS ATTEMPTED

This one is worth the space, because it was measured and REFUSED rather
than assumed, and the refusal is the finding. At `78aabe5`, 113 live
cards carry a `## Verdicts` section, and the verdict lines inside them
are free prose. The heading forms found include:

- `## VERDICT: APPROVED` and `### … — **APPROVED`
- `VERDICT: PASS` — a fourth word for the same thing
- `VERDICT IS UNCHANGED: APPROVED` — a re-verification
- `### 2026-08-23 — REJECTED` — no `VERDICT:` token at all
- and the ones that decide it: `### WHY A .cargo/config.toml [env]
  ENTRY WAS REJECTED` and `### Fix pass after REJECTED`, **which are
  not verdicts.**

A regex over that corpus produces a number with no defensible
denominator — and `docs/NORTH_STAR.md`'s own bar calls a known-vacuous
keeper a stop-the-line defect. So the keeper this needs is a RATIFIED
MARKER in `method/tasks/TASK-FORMAT.md`, which already specifies
*"appended by the verifier, one dated entry per pass: APPROVED, or
REJECTED + concrete failures"* without giving that entry a machine-
readable form. Making it one is a method change: a format bump, whose
third file is Rust (`METHOD_SNAPSHOT_VERSION` in
`app/src-tauri/src/agent/kit.rs`), and a backfill decision for the 113
cards that predate it.

**A backfill is not obviously right.** The trend this indicator wants is
*rising over time*, so a backfill performed by one session's reading of
113 prose sections would be a single judgement wearing a time series'
clothes. Starting the count at the ratification, and saying so, may be
the honest option.

## Suggested fence

`[method/, docs/CONVENTIONS.md, app-agent]` for the marker and its
version bump — noting that this fence reaches the three PINNED version
places and not `docs/ARCHITECTURE.md`, the C-01 component file, or the
`methodVersion:` fixtures in the TypeScript suites (the first Gotcha in
`docs/CONVENTIONS.md` derives that list). The scanner that reads the
marker afterwards is a separate, smaller card inside `[tools/e2e]`.
