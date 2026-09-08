---
id: T-264-s6
title: The records guard is a CONTENT floor, not a path pin — an append to a checkpoint or to another card passes it, and T-264's fourth criterion asked for a body pinning that the record paths did not change
feature: F-06
milestone: 4
size: S
priority: 28
status: planned
suggested_by: verifier claude-opus-5@subagent (phase 2), at T-264's bench, 2026-09-08 — measured with two data mutants that survived
blocked_by: [T-224]
touches: [tools/e2e/tests/identifier-rename.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**Class parent: `T-264`.** Its fourth acceptance criterion ends *"a body
pins that these paths did not change in the lane's diff"*. The body that
landed — `the records were not rewritten — every record tree still
carries the old name` in `tools/e2e/tests/identifier-rename.spec.ts` —
pins something adjacent but not that: a FLOOR on how many files under
each record tree still carry the pre-rename identifier. It catches the
exact damage a rename lane does (stripping the old name) and it catches
nothing else.

## What was measured

Three data mutants at `69b86b1`, each planted in a detached scratch
worktree and restored by sha256, each run against
`tests/identifier-rename.spec.ts`:

| mutant | landing | result |
|---|---|---|
| the old name stripped from `docs/checkpoints/2026-08-27-T-092.md` | 1 line changed | **KILLED** — the floor reds by name |
| one line appended to that same checkpoint | 2 lines added | **SURVIVED** — 6 passed, exit 0 |
| one line appended to `docs/tasks/T-022-front-door-persistence.md` | 2 lines added | **SURVIVED** — 6 passed, exit 0 |

A record could therefore be reworded, have a section removed, or gain
paragraphs it never had, and the guard would agree — as long as the
per-tree count of files carrying `nputer` did not fall. The landing
itself is CORRECT: the same verifier compared `git ls-tree -r` blob
manifests for `docs/checkpoints` (81 files), `docs/decisions` (22) and
`docs/rooms` (12) against the base and found them byte-identical, and
`docs/tasks` differing only in T-264's own card plus four new
suggestions. Nothing was rewritten. The gap is in the GUARD, not in the
tree.

**And the body's own reason for choosing a floor is good** and is
recorded at the site: *"records are append-only, so a count here can
only rise. An equality would red on the next checkpoint for no defect at
all."* That argument settles floor-versus-equality. It does not settle
content-versus-path, which is the substitution nobody argued for.

## Acceptance criteria

- WHEN a commit under review changes the bytes of any file under
  `docs/checkpoints/`, `docs/rooms/`, `docs/research/captures/`, or
  `docs/decisions/` older than 022 THE guard SHALL red naming the file,
  whether the change added, removed or reworded a line, and whether or
  not the pre-rename identifier survived it.
- WHERE a body compares against a base ref THE ref SHALL be derived at
  run time rather than pinned to `fe2a2aa`, so the guard outlives the
  lane that motivated it and does not red on every later commit.
- THE existing content floors SHALL be kept beside the new pin rather
  than replaced: neither one's kill set contains the other's, and the
  floor is what catches a stripped record that a path pin run after the
  merge can no longer see.
- WHEN the new pin is drilled THE demonstration SHALL include the two
  mutants that survive today — an append to a checkpoint and an append
  to a card not named by the card under review — and the card SHALL
  record that they now red.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->

## Triage (2026-09-08, at T-265's ASK 4)

Promoted as an S behind T-224 (which holds tools/e2e): the instance
arrived within the hour — T-265's legitimate renames of
docs/checkpoints/TEMPLATE.md and docs/research/competitors.md drop two
of the guard's four floors (65→64, 11→10), because the floors count the
DIRECTORIES that contain the record trees, not the trees. The
integrator re-scopes those two floors at T-265's merge as an assigned
correction (the merge's own debris: a fixture the merge makes false);
this card carries the durable fix.

## Acceptance criteria

- WHEN the records guard counts a record tree THE set SHALL be the
  record subtree and nothing else: docs/checkpoints EXCLUDING
  TEMPLATE.md, docs/research/captures (not docs/research), docs/rooms,
  docs/decisions before 022, docs/tasks bodies — each floor re-measured
  at the card's own base and stamped with the ref.
- WHEN a record's blob changes in a lane's range THE guard SHALL red BY
  NAME (a path pin: the blob manifest of the record trees at the base
  compared to the tip, every difference listed), not only by a count
  that a legitimate rename can move.
- IF a non-record file inside those directories is renamed (the
  template, the competitor map) THEN the guard SHALL stay green — the
  positive control, shown failing against the old floors first.
