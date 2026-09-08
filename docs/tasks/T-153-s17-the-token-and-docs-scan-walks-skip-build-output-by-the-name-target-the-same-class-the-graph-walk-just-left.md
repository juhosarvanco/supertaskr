---
id: T-153-s17
title: The TOKEN and DOCS-SCAN walks still skip build output by the NAME `target`, which is the class the graph walk just left — a drill's target dir under its lane-derived stem is scanned by both
feature: F-06
milestone: 4
size: S
priority: 8
status: suggested
suggested_by: executor claude-opus-5@subagent @T-153-s3, class sweep at c2f4d55, 2026-09-09
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`T-153-s3` taught the GRAPH walk to skip any directory carrying cargo's
own `CACHEDIR.TAG`, because the name `target` is exactly the name a drill
cannot use: CONVENTIONS' POISON DRILL puts the `CARGO_TARGET_DIR` inside
the drill worktree and `T-092` requires it to carry the lane-derived
stem. **The sweep that fix owes found two more members of the class, both
outside `crate-index`'s fence** (`A FIX NAMES ITS CLASS AND ITS SWEEP`,
docs/CONVENTIONS.md):

- `SKIP_DIRS` in `tools/e2e/scripts/token-scan.mjs`
- `SKIP_DIRS` in `tools/e2e/scripts/docs-scan.mjs`, whose own comment
  says it is *"Same set token-scan.mjs uses, restated here so this module
  stays importable on its own"*

Both are `Set`s of literal directory NAMES including `"target"`. THE FOUR
WALKS names the first of them as the authority for the TOKEN walk, so
this is that walk's copy of the same defect rather than a restatement of
the graph one.

**The sweep is derived, never transcribed** — `git grep -n '"target"' --
'*.rs' '*.ts' '*.tsx' '*.mjs' '*.js'` from the repo root prints the class
at your own ref, and it was shown capable of finding before its answer
was written down (the same query over `"node_modules"` returns hits).
**And run it UNFILTERED**: this sweep was first run through a
`grep -v node_modules` and silently lost the one member that turned out
to be inside the fixing lane's own fence, because that line names both
directories.

## Why it is not the graph walk's severity, and not nothing either

The TOKEN walk's harm is the opposite direction from the graph's. The
graph walk's failure was SILENT and CERTIFYING — `index --check`
answering CURRENT over files that exist in one scratch directory. The
token lint's failure is LOUD and WRONG: a scan that descends a build
directory reads generated `.ts`/`.mjs` nobody wrote, and a hit there is a
finding attributed to whoever is nearest. The DOCS-SCAN copy rides along
by construction, since it restates the same set.

**The third member of the class needs no change and saying so is part of
the sweep**: `.gitignore`'s `target/` stays exactly as it is. Keying an
ignore LIST on a name is the thing `T-111-s11`'s second criterion refuses
as a fix, not a defect in the list.

## Acceptance criteria

- THE token scan SHALL not descend a directory carrying a conforming
  `CACHEDIR.TAG`, derived from the tag FILE rather than from a widened
  name list — the same rule `walk_root` takes in
  app/src-tauri/crates/supertaskr-index/src/walk.rs, and the SAME
  argument for why a name cannot carry it.
- THE docs scan SHALL take the same rule, or SHALL import it, so the two
  copies cannot disagree — that file's own comment says the duplication
  is deliberate for importability, so whichever way it lands the lane
  SHALL say which.
- THE change SHALL carry a positive control: a fixture directory that
  DOES carry the tag is skipped and an otherwise identical one that does
  NOT is still scanned (`A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL`).
- THE lane SHALL decide, and record, whether the presence of the file or
  its 43-byte SIGNATURE is the right key HERE. `walk_root` keys on the
  signature because dropping a directory it should have kept loses
  repository content from the graph; `T-153-s3` took the weaker
  presence test in the indexer's own perf harness for the opposite
  reason, and recorded why at that site. A scan is a third case.

## Notes

`tools/e2e` was `T-224`'s live fence at the time this was filed, which is
a second reason it could not be taken in `T-153-s3`'s lane and not the
first — the fence there is `crate-index`.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
