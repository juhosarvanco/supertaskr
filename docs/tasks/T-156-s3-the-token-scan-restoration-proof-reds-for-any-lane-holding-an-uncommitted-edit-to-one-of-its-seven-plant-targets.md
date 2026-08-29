---
id: T-156-s3
title: The token-scan restoration proof reds for any lane holding an uncommitted edit to one of its seven plant targets, and the message names the restore rather than the working tree
status: suggested
suggested_by: executor claude-opus-5 @T-156
---

**MEASURED ON THIS LANE, TWICE, AT TWO REFS.**
`tools/e2e/tests/token-scan.spec.ts`'s *"one runtime-built control byte
reds all seven first-party roots at exact byte offsets"* finishes its
restoration with

```
const diff = spawnSync("git", ["diff", "--quiet", "--", ...targets], { cwd: repoRoot });
expect(diff.status, "all seven plant targets restore to an empty diff").toBe(0);
```

`git diff` with no range compares the WORKING TREE to the INDEX. One of
the seven targets is `tools/e2e/package.json`. So an executor whose
fence includes that file — which is every executor adding an npm script
to this package — reds this body the moment it runs the lane before
committing, with a message saying the restore failed.

**THE RESTORE HAD NOT FAILED.** Every sha256 assertion above it passed,
in the same run, over the same seven files; only the index comparison
reds, and it reds on a change the body never made. Run at `78aabe5`
with an uncommitted one-line edit to `tools/e2e/package.json`:
**1 failed / 277 passed**. Committed and re-run at `353bcd8`, nothing
else changed: **278 passed, exit 0.**

**WHY THIS IS WORTH A CARD AND NOT A HABIT.** *"Commit first"* is
already this repository's rule — but it is the POISON DRILL's rule, and
it is about DRILLS. Nothing tells an executor that running the SUITE
with a dirty tree will produce a red naming a mechanism that is working
correctly, and a mid-build dirty tree is the normal state of a lane. The
cost is a session investigating a restoration path that is fine; this
one spent that time and is filing so the next one does not.

The failure also lands in the file `docs/STATE.md` already warns about
under **read the assertion, not the test body's name** (`T-111-s9`) —
so a reader who follows that hazard correctly arrives at the assertion
and finds one that is genuinely about restoration, which is what makes
the misdirection expensive rather than merely annoying.

## What a fix would look like

The body already snapshots every target's bytes AND its mtime, so it has
everything it needs to prove restoration without consulting git at all.
Two candidates, and the choice is the card's:

- **Compare against the snapshot** the body already holds — `cmp`
  against the captured buffer, which is the scratch-SNAPSHOT proof
  `docs/CONVENTIONS.md`'s POISON DRILL bullet names as the alternative
  to `git show HEAD:`. It answers the same question and is immune to the
  working tree.
- **Keep the git proof but make it honest** — capture
  `git diff --name-only -- <targets>` BEFORE the plant and require the
  after-set to equal the before-set, so a pre-existing dirty file is
  carried rather than blamed.

The first is stronger: it needs no git at all, and this body already
argues in its own comments that `git diff --quiet` answers from the
index's cached stat info, which is a second reason not to rest a
restoration proof on it.

**DO NOT WEAKEN IT TO `--exit-code` OR DROP THE PROOF.** T-092's
checkpoint records that this body's restoration proof used to pass on a
FAILED restore; the proof is load-bearing and the fix must keep it at
full strength.

## Suggested fence

`[tools/e2e]`.
