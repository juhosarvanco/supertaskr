---
id: T-264-s8
title: The design bundle's two HTML filenames carry a SPACE, and both the source that cites them and the tooling that walks them pay for it — a caller that word-splits a path list turns one file into two and the docs gate says it could not scan either
feature: F-01
milestone: 4
size: S
priority: 8
status: suggested
suggested_by: executor claude-opus-5@subagent, at T-264-s3's lane, 2026-09-10 — measured while renaming the two files, when the docs gate was handed the change's own path list
blocked_by: []
touches: [docs/design/claudedesign_handoff/, app/src/architecture/TasksLens.tsx, app/src/architecture/task-waves.ts, app/src/components/shell/GenesisScreen.tsx, app/src/genesis/GenesisPane.tsx, app/src/styles/tokens.css]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

The design bundle's two prototypes are named with a SPACE in the
basename — `supertaskr app.dc.html` and `supertaskr tokens.dc.html`
(they carried the pre-rename name with the same space until T-264-s3
moved the spelling; the space is older than the rename and survived it).
Five files under `app/src/` cite them by name in comments, the bundle's
own README cites them in six places, and one of them is linked from the
other by `href`.

**MEASURED, and the measurement is why this is a card rather than a
taste note.** At T-264-s3's tip the docs gate was handed the change's
own path list the way a shell hands one — `docs-gate.mjs $(...)` — and
the two names arrived as four arguments. The gate then reported, twice:

    INJECTION SCAN COULD NOT RUN for docs/design/claudedesign_handoff/supertaskr

The gate is not the defect. The gate quoted nothing wrong; a basename
with a space is simply not safe to pass through any caller that splits
on whitespace, and this repository's own tooling is full of path lists
that travel through shells. The advisory injection scan is the arm that
happened to say so out loud — an arm whose exit is deliberately
unchanged, so a gate that CANNOT SCAN a docs input reports it and passes.

**And one link in the bundle points at a file that has never existed.**
`supertaskr tokens.dc.html` carries an `href` to
`supertaskr directions.dc.html`; the bundle holds five files and that is
not one of them. It was dangling before the rename under the old
spelling and is dangling after it — the rename moved the spelling and
inherited the dangle, which is the correct behaviour for a spelling pass
and the reason this is filed rather than fixed there.

## Acceptance criteria

- WHEN the two prototypes are renamed to basenames with no whitespace
  THE five citing files under `app/src/`, the bundle's README and the
  `href` between the two files SHALL name the new basenames, in one
  commit, and no citation SHALL name a file the bundle does not hold.
- WHEN the docs gate is handed the renamed paths through a caller that
  splits on whitespace THE gate SHALL scan both files rather than report
  that it could not run.
- IF the dangling `directions` link cannot be resolved to a file the
  bundle holds THEN it SHALL be removed rather than re-spelled, and the
  removal SHALL say in the README that the file was never in the bundle.
- The RECORDS that spell the old filenames — the task cards of T-006,
  T-012, T-024, T-026, T-027 and T-034 — SHALL NOT be rewritten.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
