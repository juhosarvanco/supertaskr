---
id: T-120-s3
title: The mtime-restore assertion T-079 added compares a sub-millisecond float against a Date-rounded readback — red exactly once in every fresh checkout, then green forever, and it erases its own evidence
status: suggested
suggested_by: executor claude-opus-5 @T-120
---

**Found by T-120's first full `npm test` from `tools/e2e/` in a fresh
lane worktree: 145 passed, 1 failed, exit 1.** The failing body is
`tools/e2e/tests/token-scan.spec.ts:201`, *"P6 reds a planted bare
motion utility and leaves its motion-safe twin alone"* — T-079's own,
and nothing in T-120's diff touches it or the file it plants into.

    Error: tools/e2e/fixtures/shell.ts restored its MTIME too — a
    content-exact restore that moves the clock reds an mtime guard

    Expected: 1787642946965.186
    Received: 1787642946965

**THE SECOND RUN OF THE SAME SUITE, SAME COMMIT, SAME WORKTREE, NO EDIT:
146 passed, exit 0.** That is the whole defect.

## The mechanism, measured rather than reasoned

`token-scan.spec.ts:206-241` does three things:

    const clock = statSync(target);              // mtimeMs is a FLOAT
    …
    utimesSync(target, clock.atime, clock.mtime);  // .mtime is a DATE
    …
    expect(statSync(target).mtimeMs).toBe(clock.mtimeMs);

**`Stats.mtime` is a `Date`, and a `Date` holds whole milliseconds.**
The sub-millisecond part of `mtimeMs` is gone the moment the `Date` is
read, so the restore writes back a ROUNDED timestamp — and the
assertion then compares that against the unrounded float it captured.
It can only pass when the original mtime had no sub-millisecond
component.

**Probed on this filesystem (APFS, Darwin 25.6.0, node 22): 50 of 50
fresh writes produced a sub-millisecond mtime.** So the assertion is not
occasionally unlucky; it is nearly always false on a file whose mtime
came from an ordinary write or checkout.

    captured   mtimeMs        = 1787644893267.5955
    as a Date  .getTime()     = 1787644893268   <- what the body restores
    after utimesSync(Date)    = 1787644893268   equal to capture? false
    after utimesSync(ms/1000) = 1787644893267.885  equal to capture? TRUE

## WHY NOBODY HAS SEEN IT, AND WHY THAT IS THE WORST PART

**The failure repairs the condition that caused it.** The `utimesSync`
in the `finally` block leaves the file's mtime on a whole millisecond —
so the next run captures a whole-millisecond `clock`, the rounding is a
no-op, and the assertion passes. **Red once, green forever after**, in
that checkout.

Measured across three checkouts at the same content:

| checkout | `shell.ts` mtimeMs | would the body red? |
|---|---|---|
| `/Users/ujju/Projects/nputer` (main) | `1786940753485` | no — already whole-ms |
| `.../tools/nputer-T-120` (this lane, AFTER its one red) | `1787642946965` | no — healed by the red |
| `/Users/ujju/Projects/drill-T-120` (never ran this body) | `1787643644520.721` | **YES** |

**Main is green because something already ran the body there.** The
drill worktree — a checkout this body has never touched — still carries
the sub-millisecond mtime that reds it.

**So the failure fires in exactly the places this project creates most
often: a fresh lane worktree, and a fresh POISON DRILL worktree.** Every
executor meets it once, cannot reproduce it, and has no way to tell it
from a flake — while `docs/STATE.md` at `3f9bef2` records *"four
consecutive green runs after the move"*, which is precisely what one red
followed by three greens looks like from the inside.

## The fix, measured

    - utimesSync(target, clock.atime, clock.mtime);
    + utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);

`utimesSync` accepts seconds as a number and carries the fraction into
the `timespec`; the probe above confirms an exact round trip. **Keep the
strict `toBe`** — weakening it to a whole-millisecond comparison would
delete the very property T-079-s3 exists to defend.

**THIS IS `T-079-s3` ONE LEVEL DOWN**, and it sharpens that card rather
than duplicating it. `T-079-s3` says a content-exact restore does not
restore the clock. This says the clock restore T-079 shipped is itself
LOSSY — correct to the millisecond, wrong below it — and that the
assertion guarding it demands a fidelity the call cannot deliver. Any
sibling using `utimesSync(…, stats.atime, stats.mtime)` has the same
lossy restore; only this body currently asserts tightly enough to notice.

**FENCE: `[tools/e2e]`** — the same fence T-120 held. Not built there
because T-120's card is a regression pin in `docs-input-gate.spec.ts`
and says in as many words that no other arm moves; a one-token change to
another spec's restore semantics, in a lane that cannot re-red the
failure once its own worktree has healed, belongs to a card that can cut
a fresh checkout to prove the fix.

**HOW TO REPRODUCE, since the obvious way does not work:** `git
worktree add --detach <fresh path> <ref>`, install, then run
`npx playwright test tests/token-scan.spec.ts` ONCE. Re-running in a
worktree that has already gone red proves nothing.
