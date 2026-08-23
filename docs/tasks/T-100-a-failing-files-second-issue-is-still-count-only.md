---
id: T-100
title: A failing file's SECOND issue is counted and never shown — and the honest target is "no counted problem is unexpandable", not "rows == count"
feature: F-02
milestone: 4
priority: 56
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

Absorbs: T-077-s1 (sixth triage, 2026-08-20). That file is removed in
this commit.

**T-077 closed the cross-file family and left one residue, deliberately
and with the reason recorded.** Its criterion 1 asked that
`model.issues` not represented in `failures` get their own rows *"so the
count and the list can never disagree about how many problems the docs
have"*. The rule it shipped is a statement about FILES, because that is
what a failure row is: an issue is dropped when every file it names
already has a failure row. That closes every cross-file issue and every
soft issue on a record that parsed. **It does not close a file that
failed with more than one issue.**

**The residue, measured.** The failure row renders
`f.issues[0]?.message` — the FIRST issue and only the first — while
`f.issues` carries all of them and, when the file has no last good
parse, `model.issues` carries them all too. Verified live at `4d2f03c`:
the same `f.issues[0]?.message ?? …` expression appears twice in
`app/src/App.tsx`, once in the derivation and once in the rendered row.
So a task file whose frontmatter is present but whose `status` is
invalid AND whose `title` is missing **counts 2 and shows 1**. The strip
is no longer empty — that was T-077's defect — but the arithmetic still
does not close.

**Why it was not fixed there.** T-077's criterion 5 pins the strip's
existing behaviour for withheld records as UNCHANGED, and every way to
close this changes a failure row: append `(+N more in this file)`,
render one row per issue instead of one per file, or fold the failure
rows into the same derivation. All three are defensible and all three
are a different card's call.

**AND EXACT EQUALITY IS UNREACHABLE ANYWAY**, which is the half most
likely to be lost if this card is written carelessly. A file that fails
WITH a last good parse produces a failure row for an issue that is **not
in `model.issues` at all** — `effective` renders the good content, so
the model never sees the bad one. **Rows will always be able to exceed
the count.** The honest target is *"no counted problem is
unexpandable"*, and whoever takes this writes that sentence down where
the next reader of the criterion finds it.

## Acceptance criteria

- **EVERY ISSUE ON A FAILING FILE SHALL BE REACHABLE ON THE SCREEN**,
  not only the first. THE CHOSEN SHAPE SHALL BE STATED — one row per
  issue keyed by path plus index, or a `(+N more in this file)`
  affordance — with the reason.
- IF one row per issue is taken THEN the `(showing last valid state)`
  suffix SHALL appear on the FIRST row only, so a reader is not told the
  same thing three times about one file.
- **`data-failure-count` SHALL KEEP COUNTING FILES.** It always has, and
  the row count diverging from it is the intended consequence rather
  than a regression — say so at the attribute, because the next reader
  will otherwise "fix" the divergence.
- **THE TARGET SENTENCE SHALL BE WRITTEN WHERE T-077's CRITERION 1 IS
  READ**: *no counted problem is unexpandable*, with the reason exact
  equality is unreachable (a file failing WITH a last good parse renders
  a row for an issue `model.issues` never carries).
- **A BODY SHALL DRIVE A FILE WITH TWO ISSUES AND NO LAST GOOD PARSE**
  — invalid `status` plus missing `title` is the measured case — and
  assert both messages are reachable and the counted total agrees with
  what is reachable.
- **A SECOND BODY SHALL DRIVE THE UNREACHABLE-EQUALITY CASE** — a file
  that fails WITH a last good parse — and assert the row exists while
  `model.issues` does not carry it, so the asymmetry is pinned rather
  than rediscovered.
- IF T-077's criterion 5 is amended THEN the amendment SHALL be recorded
  on this card, because that criterion is what deferred this work.

Verification: headless — `npm test` and `npm run build` from app/ with
counts and exits stated. POISON DRILL on both new bodies, one side only:
mutate the RENDERER (drop the per-issue map, restore `issues[0]`), read
the mutated text back with `git diff` before running, require the RED,
restore and prove by sha256 at the drill's own commit. Then T-092's
shape-six check on each new body — name a mutation it kills, run the
whole app suite, require a failing-body count of ONE — because the two
bodies here are close siblings and a duplicate is exactly what that
check is for. @human: the strip is a rendered surface and the row count
per file changes what a human sees; one look at a two-issue file after
the change, but nothing in the pipeline waits on it.
