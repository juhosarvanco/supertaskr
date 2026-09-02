---
id: T-229-s9
title: The fixture root's head and restore() members have zero call sites, so a contract nothing exercises sits inside the eval suite's own guard surface
feature: F-06
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: executor claude-opus-5@subagent @T-229-s6
blocked_by: []
touches: [tools/method-evals]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-229`** (a positive control that cannot fail is the
most common defect this project produces). This card is about a
contract that is never exercised rather than one that cannot fail.

**MEASURED in the T-229-s6 lane at `82ffc26`:**

    grep -rn '\.restore()\|fixture\.head' tools/method-evals/  ->  0 rows
    outside lib/fixture-root.mjs's own definitions

`materialize()` returns a `FixtureRoot` whose typedef promises six
members. Four are used. **`head` — the fixture commit's full sha — and
`restore()` — *"put every tracked file back, proved by git"* — have no
caller anywhere in the suite.** `restore()` is not trivial: it runs
`git checkout -q -- .`, re-reads `git status --porcelain` and THROWS a
named error when the tree did not come back. That is a real guard, it
is documented as one, and nothing has ever run it.

**WHY THIS IS WORTH A CARD RATHER THAN A DELETION.** The two readings
are opposite and the card should not pre-empt either:

- **It is dead API**, in which case it is the class the POISON DRILL
  bullet's *"a body that cannot red is the finding"* covers from the
  other side — an unexercised restore guard whose own failure path has
  never executed, sitting in the module every eval's fixture passes
  through.
- **It is the seam the suite is about to need.** An eval that degrades a
  fixture and then wants the SAME root back — rather than a second
  `materialize()` — is exactly what `restore()` was written for, and
  MF-01 today pays for a whole second fixture (`mf01-control`) instead.

**AND THE COST IS ALREADY MEASURABLE.** MF-07 (added by T-229-s6) builds
three replica source trees per `--selftest`, and MF-01 materializes two
roots; a working `restore()` is the cheaper shape for both. So the
question is not only tidiness — it is whether the suite's own runtime is
paying for a member it declines to use.

## Acceptance criteria
- WHEN the suite is read at the card's own ref THE decision SHALL be
  recorded either way: `head` and `restore()` are removed from the
  typedef and the return value, OR at least one eval CALLS `restore()`
  and its failure path is drilled.
- IF `restore()` is kept THEN its throw SHALL be demonstrated firing —
  a fixture deliberately left dirty in a way `git checkout -- .` cannot
  undo — because a guard whose failure path has never run is the
  finding this card names.
- WHEN the change lands THE model-free set and `--selftest` SHALL both
  still exit 0, and `tools/method-evals` SHALL stay dependency-free.

## Filed by the T-229-s6 lane, 2026-09-02

Noticed while widening `fixture-root.mjs` for the writability repair and
NOT built: the fence covered the file, but removing or wiring an
exported contract is a different decision from making the copy writable,
and an executor does not expand its own card. The observation is the
dispatching seat's blind-bench fact (5) of that lane, re-derived here at
`82ffc26` rather than transcribed.
