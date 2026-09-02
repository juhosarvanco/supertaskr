---
id: T-189-s1
title: The clause ROW 11 depends on can be deleted and the brief comes back GREEN — nothing in the tree reds when the self-integration condition is removed
status: planned
feature: F-06
milestone: 4
priority: 3
size: S
blocked_by: []
touches: [tools/e2e]
review: independent
suggested_by: "executor claude-opus-5 @T-189, 2026-08-31 — AC 4 asked for a body and tools/e2e/tests/ is outside T-189's fence"
---

`T-189` put the size-S self-integration condition where the derived ROW
11 actually reads it: `method/lane-protocol.md` **rule 6** and the two S
cells of `method/tasks/TASK-FORMAT.md`'s ceremony table.
`deriveDeliverable` in `tools/e2e/scripts/dispatch-brief.mjs:2040` quotes
those three verbatim, so the brief carries the answer by construction.

**AND NOTHING ASKS WHETHER IT IS STILL THERE.** Measured in T-189's lane
at `7f7716f`, one side only, restored and sha256-proved on that card:
stripping the eight-line clause out of rule 6 and re-running
`node tools/e2e/scripts/brief.mjs --task T-189` returned **exit 0**, with
the clause's occurrence count in ROW 11's output going **1 → 0**. The
brief did not red. **It came back green, shorter, and wrong.**

That is the failure class this project already knows by name — a green
that certifies nothing — and it sits on the one row that tells a lane
whether to merge.

## Acceptance criteria

- WHEN the self-integration condition is absent from the source ROW 11
  quotes THE suite SHALL red, naming the row and the missing condition.
- THE body SHALL assert against an expectation INDEPENDENT of the
  document it grades — a literal typed from `T-189`'s criteria, not a
  list re-read out of `lane-protocol.md`. `T-202`'s verdict measured four
  mutants surviving for exactly that reason: *removing a requirement
  removes its own test*.
- THE body SHALL cover the CONCURRENT case specifically, which is the
  case that had no answer before `T-189`: a size-S card whose brief is
  assembled while another seat holds the integration checkout must come
  back telling the lane not to merge.
- IF the condition moves to a different rule ordinal or a different cell
  THEN the body SHALL red rather than silently reading nothing (the
  `mf-02` rule-citation eval's shape, applied to a quoted clause).

## Fence

`tools/e2e/tests/` — one spec body, most naturally beside the existing
`brief.spec.ts:880` (*"the ceremony ROW is read from TASK-FORMAT"*),
which already imports `ceremonyRows` and today asserts only that size S
resolves to more than one row.

## Read beside

`T-189`'s implementation notes (the drill and the ROW 11 derivation),
`tools/e2e/scripts/dispatch-brief.mjs:2040`, and `T-202`'s verdict on
specs that grade their own corpus.

## TRIAGE, 2026-09-02 — DISPOSITION IS PROMOTE, AND IT IS NOT APPLIED

Triaged at the architect seat at 1cd2c8d. The stamp stays `suggested` for
T-225's reason and no other: `brief.mjs --dispatch` printed 60,040 bytes
at 85dda6d against the 65,536-byte loss point, a promotion costs about
645 bytes, and the in-flight sections of the wave dispatched tonight
spend the rest. T-225 is dispatched as soon as T-216-s4 lands; when
T-225 lands, promote this card without re-triaging it. Read this as a
tool limit, never as a verdict on the finding.

**Placement fields written at the seat** (F-06, m4, p3, S,
`[tools/e2e]`, review independent — a keeper over a deletable clause is
guard-class). The body pins ROW 11's clause against a literal typed from
T-189's criteria, never against the document it grades.

**APPLIED, 2026-09-02, at the stamp of T-225's merge (7435eae):** the
byte ceiling that held this promotion no longer binds — `brief.mjs
--dispatch` answers what can START and `--full` is the triage view — so
the disposition above is now the stamp: `status: planned`.
