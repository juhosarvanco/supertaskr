---
id: T-112-s4
title: C-18 declares no test path, so Board.tsx's prop threading has no suite — deleting it leaves the whole app run green, measured
feature: F-02
milestone: 4
priority: 2
size: S
status: verifying
suggested_by: executor claude-opus-5@subagent @T-112
blocked_by: []
touches: [app-board, docs/architecture/components]
builder:
verifier:
built_by: claude-opus-5 @subagent-executor
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

## Implementation notes (executor, 2026-08-31)

**THE TITLE'S SECOND CLAUSE IS NO LONGER TRUE, AND THAT IS THE FIRST
THING A VERIFIER SHOULD CHECK.** *"a mutant survives the whole app run"*
was true when this card was filed and is false at the base this lane was
cut from. `T-112-s1` pinned the threading in `app/test/board-truth.test.tsx`
in the interval. Re-run here as a poison drill in a detached scratch
worktree at the lane's base — each threading line deleted separately and
both together, one side only, `0 <n>` on `git -C <dir> diff --numstat`
before each suite run, restored with `git restore --source=<base>
--staged --worktree` and proved by sha256 against `git show <base>:` —
**every one of those mutants dies.** The per-mutant failing-body counts
are in the lane's report; they are deliberately not transcribed here, so
that a blind verifier derives its own. The drill worktree came back clean
and was removed.

**SO CRITERION 2 WAS ALREADY MET BEFORE THIS LANE OPENED**, by another
card, in a file this card's fence cannot reach. Criterion 3 is met by
measurement rather than by a fix: the mutant it names dies, and the
non-duplication question it asks (POISON DRILL shape SIX) is answered
per-line rather than for the two-line deletion, because deleting two
lines is two mutations and shape six's count is defined per mutant.

### Criterion 1 is where the work went, and it split in two

The criterion is a disjunction. **Its second arm is discharged in the
tree**: `C-18-board-root.md` now carries a section deriving why this
component declares no `app/test/**` path — what covers the composition
root today, why that pin may not be re-homed here, and what a test path of
its own would actually cost. The load-bearing derivations there are:

- the owner of `board-truth.test.tsx` is C-05, read out of the registry
  rather than remembered;
- that file imports `App` beside `Board`, and `C-05 -> C-18` is already
  declared, so C-18 owning it is a declared cycle — the shape this
  component was split out of C-08 to remove;
- therefore `T-169-s1`'s parked one-file move is refused on an
  architectural property, and this lane is the customer that card said
  would decide it.

**Its first arm could not be built inside this card's fence, and that is
a property of the card rather than a judgement call.** A `[app-board]`
fence expands to C-18's `paths:` as they stood at dispatch. The lane may
add a test path to the registry and still may not write the file the line
names, because the manifest was expanded before the line existed and a
lane may not re-expand its own fence. Verified against the hook's own
`decide()` rather than assumed. TASK-FORMAT names this exact shape — *"a
criterion that cannot be built inside the fence is not built, it is
recorded and routed"*, and *"a card whose criterion and whose fence
disagree is a DEFECTIVE CARD, not a hard call for the lane."* So it is
routed, as **`T-112-s6`**, carrying the `touches:` line that makes it
dispatchable first time.

### The shipped-code half

Two comments in this fence asserted that `T-126-s2` is **PARKED with a
ruling owed** — `Board.tsx`'s header and `TaskDetailPanel.tsx`'s
`dispatch` prop doc. The ruling landed at this lane's own base commit, so
both were contradicted by the tree a reader would check them against, and
both sit exactly where someone deciding the dispatch seam would look.
Corrected to the ruled state. **Neither is a behaviour change and neither
is poisonable** — no assertion moved, and this lane added no test body at
all. That is stated rather than left for the verifier to discover as a
gap: the drills above are of EXISTING bodies, run to settle the card's
premise, not of anything this diff introduced.

### Routed rather than done, and deliberately not absorbed

- **`T-187`** — the finding that matters most here. `T-126-s2`'s ruling
  names this card as the blocker for putting the join in TypeScript. At
  this base the dispatch VIEW MODEL is already reachable from inside
  `[app-board]` — three separate in-fence test files drive the frontier,
  the presentation and the drawer's rendered block. What no test file may
  reach is `dispatch-store.ts`: **C-15 declares no test path either**, and
  that is the seam's genuinely unreachable half. Whoever re-triages
  `T-126-s2` should move the test-reachability `blocked_by` there.
- **The `C-09 -> C-15` edge** that `T-112-s5` wants was priced and NOT
  declared, per the dispatch's instruction to make the case rather than
  act silently. It creates no cycle and would cost no drift — a
  declared-but-unobserved edge is an ordinary `planned` state in this
  registry — but declaring it presupposes `T-112-s5`'s shape 3, which is
  unruled, and an executor may not settle an unruled architecture
  question from inside a lane. The case is written up on `T-187` so the
  card that writes the import can declare the edge in the same commit,
  which is when it becomes observed.
- **`T-185`** was NOT absorbed; its other half is `dispatch-store.ts`,
  outside this fence. Its two named files, `board-model.ts` and
  `select-board.test.ts`, were both in this fence and neither was
  touched. A note was appended there recording that its fourth criterion
  currently has no file it may be written in, for the same C-15 reason.

### For the verifier

The contract to attack is the registry section in `C-18-board-root.md`.
Its claims are each independently checkable at your own ref: who owns
`board-truth.test.tsx`; what that file imports; what `C-05-app.md`
declares in `depends_on`; what `arch cycles` answers; whether the three
named in-fence test files really drive what they are said to drive;
whether anything imports `dispatch-store.ts` by `import`/`require`/
`import()` rather than by name. **The premise correction is the highest-
value thing to re-measure independently** — if the mutant this card was
filed on still survived, the section would be wrong about the one fact
everything else rests on.
