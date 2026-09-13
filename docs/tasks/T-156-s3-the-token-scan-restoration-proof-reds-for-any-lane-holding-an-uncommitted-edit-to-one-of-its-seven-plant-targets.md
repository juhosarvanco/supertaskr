---
id: T-156-s3
title: The token-scan restoration proof reds for any lane holding an uncommitted edit to one of its seven plant targets, and the message names the restore rather than the working tree
feature: F-06
milestone: 4
priority: 9
size: S
status: planned
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5 @T-156
builder:
verifier:
built_by:
verified_by:
review: independent
---

Consolidates T-278-s3 (2026-09-13, pile 2 batch 2, the owner's approval of 2026-09-13): not a verbatim duplicate — this card describes the older restoration proof, T-278-s3 today's `expectUntouched` after fixture isolation, which still combines per-file hashes with `git diff --quiet` over the targets; the remaining defect is one and this file is the survivor. T-278-s3's file is removed in the same commit as this line and its full text kept under the absorbed heading. This card carried no canonical criteria section until this commit; the section below is against the CURRENT helper. Priority 15 becomes 9 (the sibling's). The fence stays `[tools/e2e]` (provisionally guarded, since the token reaches gate runners and the merge script); a narrower token, tools/e2e/tests/token-scan.spec.ts, is an explicit choice to settle before dispatch.

**PROMOTED at the first standing triage, 2026-08-30. It is on `docs/STATE.md`'s standing-hazard list, which is where a defect goes to be survived rather than fixed.**

The mechanism, re-derived from the card's own measurement and the file:
`token-scan.spec.ts` finishes its restoration with
`spawnSync("git", ["diff", "--quiet", "--", ...targets])`. `git diff`
with no range compares the WORKING TREE to the INDEX, and one of the
seven plant targets is `tools/e2e/package.json` — **so every executor
adding an npm script to that package reds this body the moment it runs
the lane before committing, under a message saying the restore failed.**

**THE RESTORE HAD NOT FAILED.** Every sha256 assertion above it passed in
the same run over the same seven files; only the index comparison reds,
on a change the body never made. Measured twice at two refs: 1 failed /
277 passed with an uncommitted edit; committed and re-run with nothing
else changed, 278 passed, exit 0.

**THIS IS A GUARD THAT CANNOT TELL AN ABSENCE FROM A REFUSAL**, which is
the defect class TASK-FORMAT prices at `review: independent` — the
message names the restore rather than the working tree, so the seat that
meets it debugs the wrong thing. It owes a POSITIVE CONTROL: prove the
body still reds on a genuinely failed restore, not only that it stops
blaming a dirty tree.

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

## Acceptance criteria

- WHEN the no-write proof runs THE helper SHALL compare the live targets with their pre-body snapshots so that pre-existing working-tree changes are not attributed to the body. A retained Git comparison SHALL distinguish the pre-existing state from changes during the body. The chosen approach SHALL be stated in the notes. (T-156-s3 and T-278-s3, in the review's words)
- WHEN a body leaves a live target changed from its pre-body snapshot THE proof SHALL fail and name that target and the body-written change, regardless of whether the tree was already dirty. Positive controls SHALL cover both unchanged pre-existing dirt and an actual body-written change. The no-write proof SHALL neither be dropped nor weakened to a different spelling of the same index comparison. (T-156-s3, T-092's history; in the review's words)
- IF a separate cleanliness check is retained and refuses pre-existing dirt while the no-write proof passes THEN its diagnostic SHALL identify the working-tree condition and affected file, with the commit-and-rerun remedy, rather than blame a body write or failed restoration. If no separate cleanliness check is retained, no Git-based diagnostic is required. (T-278-s3's discriminator, in the review's words)

## Absorbed from T-278-s3 — token-scan's seven-roots body reds with `every target stays diff-clean in the live tree` when the SEAT has uncommitted work in one of its targets, which reads exactly like the body having written the repository (kept whole)

Title as filed: "token-scan's seven-roots body reds with `every target stays diff-clean in the live tree` when the SEAT has uncommitted work in one of its targets, which reads exactly like the body having written the repository"

Filed as: status suggested, priority 9, size S, touches [tools/e2e/tests/token-scan.spec.ts], wake None, suggested_by "executor claude-opus-5@subagent @T-278, 2026-09-09, at 6fe5a23".

Measured in this lane: a `gate-run e2e` over an UNCOMMITTED edit to
`.github/workflows/ci.yml` reds `one runtime-built control byte reds all
seven first-party roots at exact byte offsets` at
`token-scan.spec.ts:171` with *"and every target stays diff-clean in the
live tree"*, expected 0, received 1. The body wrote nothing: the
`git diff --quiet` half of `expectUntouched` (T-216-s4) cannot tell a
seat's own working-tree change from a body that wrote the repository,
and its message asserts the second. The per-file sha256 half already
passed, which is the discriminator: hashes equal to `before` plus a
dirty diff is a DIRTY TREE, and hashes unequal is a body that wrote.
Saying so costs one branch and one sentence, and turns a five-minute
misattribution — the executor's, here — into a line that names the file
and says "commit it, then run the lane".

Class parent: T-216-s4, which built `expectUntouched` and drilled it.
Disposition hint: promote at any lane that already holds
tools/e2e/tests/token-scan.spec.ts; it is one branch, and its own drill
is a dirty tree.

## Implementation notes

## Verdicts
