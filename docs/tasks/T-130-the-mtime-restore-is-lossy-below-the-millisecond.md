---
id: T-130
title: The mtime restore is lossy below the millisecond, so its own guard reds exactly once in every fresh checkout and then erases the evidence — one token, and a sibling that restores no clock at all
feature: F-02
milestone: 4
priority: 3
size: S
status: planned
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs (tenth triage, 2026-08-25): `T-120-s3` (canonical), `T-052-s4`,
and item 1 of `T-079-s3` — all removed in this commit. The triage found
them to be one finding filed three times, in the same file, on the same
fence.

**THIS IS THE MOST-ENCOUNTERED DEFECT IN THE PROJECT AND IT HAS NEVER
BEEN FIXED.** It has led `docs/STATE.md`'s "Next up" for **six
consecutive checkpoints**. On the night of 2026-08-25 alone it fired in
the passes for T-086, T-102, T-108 and T-116 — four separate agents, each
of whom had to recognise it by its digits and declare two runs to prove
it was not theirs.

## The mechanism, measured rather than reasoned

`tools/e2e/tests/token-scan.spec.ts` captures a clock, restores it, and
asserts the round trip:

    const clock = statSync(target);                 // mtimeMs is a FLOAT
    utimesSync(target, clock.atime, clock.mtime);   // .mtime is a DATE
    expect(statSync(target).mtimeMs).toBe(clock.mtimeMs);

**`Stats.mtime` is a `Date`, and a `Date` holds whole milliseconds.** The
sub-millisecond part is gone the moment the `Date` is read, so the
restore writes back a ROUNDED timestamp and the assertion compares it
against the unrounded float it captured. **It can only pass when the
original mtime had no sub-millisecond component.**

Probed on this filesystem (APFS, Darwin 25.6.0, node 22): **50 of 50
fresh writes produced a sub-millisecond mtime.** The assertion is not
occasionally unlucky; it is nearly always false on a file whose mtime
came from an ordinary write or checkout.

    captured   mtimeMs        = 1787644893267.5955
    as a Date  .getTime()     = 1787644893268   <- what the body restores
    after utimesSync(Date)    = 1787644893268   equal to capture? false
    after utimesSync(ms/1000) = 1787644893267.885  equal to capture? TRUE

## WHY NOBODY HAS FIXED IT, WHICH IS THE WORST PART

**The failure repairs the condition that caused it.** The `utimesSync`
in the `finally` block leaves the mtime on a whole millisecond — so the
next run captures a whole-millisecond clock, the rounding is a no-op, and
the assertion passes. **Red once, green forever after, in that checkout.**

**So it fires in exactly the places this project creates most often: a
fresh lane worktree and a fresh POISON DRILL worktree.** Every executor
meets it once, cannot reproduce it, and has no way to tell it from a
flake — while a past STATE recorded *"four consecutive green runs after
the move"*, which is precisely what one red followed by three greens
looks like from the inside.

**AND THE OBVIOUS REMEDY IS THE TRAP**: re-running until green is not a
fix and not evidence. It is the defect's own healing mechanism, mistaken
for a result.

## The prerequisite is already gone — you can reproduce it anywhere

`T-052`'s lane (absorbed here as `T-052-s4`) removed this finding's own
*"needs a fresh checkout to prove"* precondition by **reproducing the red
ON DEMAND in a healed worktree**: set the target's mtime to a value with
a fractional millisecond and the body reds immediately. **That is how you
will drive it**, and it is why this card does not need a fresh checkout to
verify a fix.

## The fix, measured

    - utimesSync(target, clock.atime, clock.mtime);
    + utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);

`utimesSync` accepts seconds as a number and carries the fraction into
the `timespec`; the probe above confirms an exact round trip.

## The sibling, from `T-079-s3`

`token-scan.spec.ts`'s P6 body restores the clock at `:226`. **The T-058
body's `finally` at `:136-139` restores CONTENT ONLY — no `utimesSync`
at all.** So one body in the same file guards a property the other
silently violates. The finding's own words: any sibling using
`utimesSync(…, stats.atime, stats.mtime)` has the same lossy restore, and
**only this body currently asserts tightly enough to notice.**

## Acceptance criteria

- **THE RESTORE SHALL BE EXACT TO THE PRECISION THE ASSERTION DEMANDS**,
  and **THE STRICT `toBe` SHALL BE KEPT**. Weakening the comparison to
  whole milliseconds would delete the property `T-079-s3` exists to
  defend, and would "fix" the test by removing the check. **IF the
  executor concludes the assertion should be loosened THEN that is a
  rejection of this card's premise and SHALL be argued, not done.**
- **THE PIN SHALL BE DRIVEN RED BEFORE THE FIX, ON DEMAND, IN THE
  EXECUTOR'S OWN WORKTREE** — set a fractional-millisecond mtime on the
  target and run the body once. **Record the exact failure message and
  its digits.** An assertion that cannot fail against today's tree is a
  defect (`T-080-s1`), and this one can, so there is no excuse for a
  forecast. **Re-running until green is explicitly NOT evidence here** —
  say so in the notes, because the next reader's instinct will be wrong.
- **THE FIX SHALL THEN BE PROVEN AGAINST THE SAME PLANTED FRACTIONAL
  MTIME**, not against a healed worktree. A green run on a file whose
  mtime is already whole proves nothing at all — it is the vacuous pass
  this whole finding is about.
- **EVERY SIBLING RESTORE IN `tools/e2e` SHALL BE SWEPT AND RULED ON.**
  Derive them — search for `utimesSync` across the fence and list every
  call site with its file and line. For each: does it lose precision, and
  does anything assert tightly enough to notice? **Fix the lossy ones or
  say why not.** A fix applied only where a test happens to complain
  leaves the same bug everywhere nothing is watching.
- **THE T-058 BODY'S MISSING CLOCK RESTORE SHALL BE ADDRESSED**
  (`:136-139` restores content only). Either restore the clock there too,
  or record why that body does not owe it. **One file must not hold two
  answers to "what does restoring a fixture mean".**
- **THE RULE SHALL BE WRITTEN WHERE THE PLANT-AND-RESTORE RITUAL IS
  WRITTEN**: a content-exact restore is not a restore, and a clock
  restore through a `Date` is lossy below the millisecond. **`docs/CONVENTIONS.md`
  is held by `T-104` as this card is filed** — so **route the CONVENTIONS
  sentence rather than taking it**, and say where you routed it. Item 2–3
  of `T-079-s3` already sit with T-104 for the same reason.
- **`STATE.md`'s "Next up" SHALL LOSE THIS ITEM** when the card lands —
  it has led that list for six checkpoints and the integrator should be
  told to check.

Verification: headless — `npm test` from `tools/e2e/`, exit read
**unpiped from `$?`**, count derived. Main reads **171/171** at
`a649766`; expect that or higher and derive rather than match. **The
token-scan body is the one under repair, so state its result
specifically rather than only the suite total.** **POISON DRILL on the
changed assertion, one side only, producer mutated and never the
assertion** — reintroduce the `Date`-valued restore and require the RED —
mutated text read back with `git diff` before its run, restores proved
per-path by sha256 at the drill's own commit, in a detached scratch
worktree named for this lane and placed OUTSIDE the repository
(`T-052-s2`). **A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL**: prove
the body still passes on a genuinely-restored file as well as failing on
a lossy one. **GRAPH REGEN's trigger fires on `*.ts` outside `docs/`** —
ask `cargo run -p nputer-index -- index --check --root ../..` rather than
predicting, and **ask again after any write**: a run that regenerates once
and confirms by byte count can ship a stale graph with no headline figure
capable of showing it. The DOCS GATE fires on this card. @human: none.
