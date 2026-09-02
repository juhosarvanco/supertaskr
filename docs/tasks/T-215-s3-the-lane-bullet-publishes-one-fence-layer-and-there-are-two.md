---
id: T-215-s3
title: The lane bullet publishes ONE fence layer and there are TWO — limit 1's "stays protocol-covered" understates T-210's physical read-only layer, which the document names only in passing under a different bullet
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: []
touches: [docs/CONVENTIONS.md]
suggested_by: "executor claude-opus-5@subagent @T-215"
builder:
verifier:
review: independent
---

**`docs/CONVENTIONS.md`'s lane bullet describes the write-time fence as
if the PreToolUse hook were the whole of it.** Limit 1 says a
Bash-mediated write *"reaches disk without an Edit or a Write and stays
protocol-covered"*, which is exactly true of that hook and no longer true
of the project: `T-210` added `tools/e2e/scripts/lane-lock.mjs`, a
physical layer that `chmod`s out-of-fence TRACKED files read-only in a
lane worktree so a stray write fails `EACCES` whoever the writer is.

## What the document says today, measured at `e47bf86`

`T-210` appears in `docs/CONVENTIONS.md` exactly ONCE, and not in the
lane bullet: the CAPABILITIES keeper bullet says *"since T-210 a lane's
fence leaves docs/CAPABILITIES.md read-only"* — a consequence, stated
where a different rule needed it. `lane-lock`, `EACCES` and *"read-only"*
as a fence property appear nowhere in the LANE PROTOCOL bullet. A reader
of the limits paragraph therefore learns that shell writes are uncovered,
and meets the mode bit later as a surprise.

**IT IS OBSERVABLE FROM INSIDE ANY LANE.** In the `T-215` worktree,
`ls -l` reads `-r--r--r--` on `.claude/hooks/lane-fence.mjs` and
`docs/ROADMAP.md` and `-rw-r--r--` on the one path the card fences.
Nothing in the bullet the executor reads first predicts that.

## What a fix decides, and the cost that shapes it

**THE BULLET IS THE BINDING BYTE BUDGET AND IT IS NOT
`docs/CONVENTIONS.md`'s OWN.** `brief.mjs --task <id> --full` prints the
LANE PROTOCOL bullet as ONE line against a 65,536-byte spawn buffer;
measured in the `T-215` lane, that arm sits at **65,195 bytes at
`e47bf86`** — 341 bytes of margin — while the document itself has ~27 KB
under its ADR-019 warn line. So this cannot be a paragraph. It is one or
two sentences, or it is a pointer, and `lane-lock.mjs`'s own header
already carries the full argument (including the measured self-violation:
a merge silently restores mode 644 on exactly the files the layer most
needed to hold).

**AND WHAT IT MUST NOT DO IS OVERSELL THE SECOND LAYER.** `lane-lock.mjs`
answers the redirect and the script and explicitly does NOT answer the
`sed -i` the same sentence names, because `sed -i` renames rather than
opening for writing. A one-line addition that reads *"and Bash writes are
covered by the lock"* would be a wider belief than the guard holds, which
is the failure the limits paragraph is titled after.

## Acceptance criteria

- `docs/CONVENTIONS.md`'s lane bullet SHALL name the physical layer as a
  SECOND fence with a different blind spot, pointing at
  `tools/e2e/scripts/lane-lock.mjs` rather than restating it.
- The addition SHALL say which shell writes it does and does NOT reach,
  `sed -i` named, so limit 1 stops reading as "no coverage" and does not
  start reading as "full coverage".
- `node tools/e2e/scripts/brief.mjs --task <any live card> --full` SHALL
  stay under 65,536 bytes, measured before and after at its own refs.
- Verification: headless.
