---
id: T-112-s4
title: C-18 declares no test path, so Board.tsx's prop threading has no suite — deleting it leaves the whole app run green, measured
feature: F-02
milestone: 4
priority: 2
size: S
status: planned
suggested_by: executor claude-opus-5@subagent @T-112
blocked_by: []
touches: [app-board, docs/architecture/components]
builder:
verifier:
built_by:
verified_by:
review:
---

**MEASURED, NOT ANTICIPATED, IN T-112's POISON DRILL** (detached
worktree at `8ee848e`, its own `CARGO_TARGET_DIR` at
`<scratch>/target`). Deleting the two lines that thread `dispatch` and
`brief` from `app/src/components/board/Board.tsx` into the drawer —
a one-sided mutation of production source, read back as `0 2` on
`git diff --numstat` before the suite ran — left `npm test` from `app/`
at **49 test files / 1060 tests, exit 0**. The mutant SURVIVES the whole
app run. Restoration proved by sha256 against the base commit; the
drill worktree came back clean.

**THE CAUSE IS A REGISTRY GAP, NOT A MISSING TEST.**
`docs/architecture/components/C-18-board-root.md` declares exactly one
path — `app/src/components/board/Board.tsx` — and no `app/test/**`
entry at all. Every other board component was given its own test path
when T-149 routed them out of C-05's umbrella: C-08 took
`review-badge.test.tsx` and `select-board.test.ts`, C-09 took four,
C-17's are driven through C-09's. C-18 took none, so **there is no test
file a C-18-fenced lane may write into**, and a lane holding
`[app-board]` cannot add one without editing the registry.

Nor may an existing in-fence test file import `Board`: `Board.tsx` is
C-18's and every board test file belongs to C-08 or C-09, so the import
would be an undeclared component edge — **the exact defect `arch drift`
caught at T-169**, whose account is in
`app/test/detail-assignment.test.tsx`'s own header.

**THIS IS T-110's LESSON IN A SMALLER SHAPE**, and it is why it is
routed rather than shrugged at: T-110 measured four one-side-only
producer mutants surviving the app suite at exit 0 because the rule sat
in a module no test imports. T-112 kept every JUDGEMENT out of the
component for exactly that reason — `selectBriefPanel` in
`task-detail.ts` holds it, `select-task-detail.test.ts` drives it, and
seventeen of seventeen mutants died. What survives is the two lines of
PLUMBING that cannot be moved anywhere a suite can see.

## Acceptance criteria

- `C-18-board-root.md` SHALL declare a test path of its own, or the
  registry SHALL state in that file why the composition root is
  deliberately untested from inside a `[app-board]` fence.
- A pin SHALL drive `Board` with a lane reading and require the drawer's
  dispatch block to appear, so deleting the threading reds by name.
- THE mutant above SHALL be re-run after the fix and SHALL die, with the
  failing-body count reported: a count of ONE is the non-duplication,
  mechanically (POISON DRILL, shape SIX).

## TRIAGE (2026-08-30, standing triage sitting #4) — PROMOTED F-02 p25, as filed

The registry gap is unchanged at `b60b06d`:
`docs/architecture/components/C-18-board-root.md` declares
`Board.tsx` and no `app/test/**` path, so a `[app-board]` lane still has
no test file it may write into. The card's measured mutant (the two
threading lines deleted, app suite green at exit 0) stands as filed.

**DISPATCH IS BLOCKED ON @human's `T-140-s4` RULING, NOT ON THIS CARD.**
The graph sits at **410 bytes** of headroom at `b60b06d`
(`wc -c docs/architecture/graph.json` = 1,039,590 against the crate's
1,040,000 budget), and this card's fence reaches indexed source. The
sitting records the block rather than lowering the priority.

## PROMOTED TO PRIORITY 2 AT THE ARCHITECTURE SITTING, 2026-08-31 — this card is now a BLOCKER for two others

**Nothing about this card's own argument changed; its position did.**

The sitting ruled `T-126-s2`'s seam (read the ruling there). The join
goes to TypeScript, and shapes 1 and 2 were refused on architectural
properties while shape 3 was refused **only** on test reachability. That
makes the registry gap this card describes the load-bearing obstacle for
the whole seam rather than a local annoyance:

- **`T-126-s2` now declares `blocked_by: [T-112-s4]`.** Until C-18 has a
  test path, anything the join puts in TypeScript is unpinnable by
  construction, and `T-110` already measured what that costs — four
  one-side-only producer mutants surviving at exit 0.
- **`T-112-s5` needs the same file opened**, to declare the C-09 → C-15
  edge its shape 3 requires. Two cards want one registry edit; doing them
  apart means opening it twice.

**And the seam is emptier than this card measured.** The sitting confirmed
that nothing in `app/src` or `app/test` imports `dispatch-store.ts` at
all, and filed `T-185` for two fields the board's reading type silently
drops. This card's *"deleting it leaves the whole app run green"* is one
instance of a condition that holds across the entire dispatch view model.
