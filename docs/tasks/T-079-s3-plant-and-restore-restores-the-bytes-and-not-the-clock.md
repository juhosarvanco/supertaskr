---
id: T-079-s3
title: The plant-and-restore technique restores the BYTES and not the CLOCK, and seven bodies read the clock
status: suggested
suggested_by: integrator claude-opus-5 @T-079
---

**Found at T-079's own integration, by it costing a red.** The lane's new
end-to-end body planted a bare motion utility into
`app/src/architecture/MapNode.tsx`, ran the wrapper, and wrote the
original bytes back — sha256 identical, `git diff --quiet` clean. **The
app suite then went 957/958.**

`app/test/map-t1-t2-dom.test.tsx`, body *"the build is newer than the
sources it is evidence about"*, compares `dist/`'s newest mtime against
four files, and `MapNode.tsx` is one of them. The plant left the file
byte-identical and its MTIME four minutes in the future of a `dist/`
built moments earlier, so a freshness guard that exists to catch a stale
build fired on a build that was not stale.

**A CONTENT-EXACT RESTORE IS NOT A COMPLETE RESTORE.** That is the
finding, and it generalises past the one instance: `grep -l mtime` over
`app/test/` and `tools/e2e/tests/` returns **seven** files under
`app/test/` that read mtimes.

## What T-079 did about its own instance

Two things, and the second is the one that held:

1. **`utimesSync` after the restore.** Correct as far as it goes, and it
   is kept — but it is NOT sufficient on its own, because it **cannot
   restore `ctime`**. Git compares `ctime` under the default
   `core.trustctime`, and `git diff --quiet` answers from the index's
   cached STAT INFO rather than from content — so the first call after a
   `utimesSync` reports a difference on stat alone, and the call itself
   refreshes the index so the next one passes. **Measured red-green-green
   over three consecutive runs.** T-079 therefore dropped that assertion
   in favour of the sha256, which is what `docs/CONVENTIONS.md` already
   asks for (*"restoration proved by hash rather than by a clean `git
   status`"*) — and the reason is now written where the next author of a
   plant-and-restore body will meet it.
2. **The plant target moved inside the fence**, to
   `tools/e2e/fixtures/shell.ts`. `tools/e2e` is one of the three
   `TOKEN_ROOTS`, so the corpus, the walk and the wrapper path exercised
   are identical, and no lint test touches anything under `app/` at all.
   Four consecutive green runs after the move.

## The sibling that is still live

`tools/e2e/tests/token-scan.spec.ts`, body *"one runtime-built control
byte reds all seven first-party roots at exact byte offsets"* (T-058),
uses the SAME technique over **seven** paths — `app/package.json`,
`docs/NORTH_STAR.md`, `lib/parser/package.json`,
`tools/e2e/package.json`, `method/README.md`, `AGENTS.md`,
`.github/workflows/ci.yml` — and restores content without restoring the
clock.

**It is green today and this is not an urgent bug.** None of its seven
targets is currently read by an mtime guard; that is a property of which
files the guards happen to watch, not of the technique. The exposure is
that the next mtime-shaped assertion over any of those seven paths — or
the next path added to that list — reds a suite for a reason nobody will
connect to a lint test.

## What is worth doing

1. Give the T-058 body the same `utimesSync` restore, for the same
   reason, so the technique is uniform rather than uniform-by-accident.
2. Consider whether "restore stat as well as bytes" belongs in
   `docs/CONVENTIONS.md`'s POISON DRILL bullet beside the sha256 rule.
   The drill discipline already says restoration must be proved by hash;
   it does not say what restoration MEANS, and this is the second
   property (after content) that a reader has to know about.
3. If it goes in the doc, name the `ctime` half too — `utimesSync`
   restores two of the three timestamps and the third is what makes
   `git diff --quiet` an unreliable oracle immediately afterwards.

**Fence:** `[tools/e2e]` for item 1, `docs/CONVENTIONS.md` for items 2
and 3. Both FREE as of T-079's checkpoint.
