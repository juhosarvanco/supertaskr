---
id: T-073-s1
title: The ADR-009 raw-markup sweep is still scoped to src/genesis, one test below the sink sweep T-073 widened
status: suggested
suggested_by: executor claude-opus-5 @T-073
---

T-073 widened `crescendo-dom.test.tsx`'s sink sweep from
`src/genesis/` to all of `app/src` — 8 files to 47 — because a sweep
that covers one directory cannot speak for a component. **The test
immediately below it, "and the interview screen's own files carry no
raw-markup sink (ADR-009)", still does exactly the narrow thing**: its
own `readdirSync(resolve("src/genesis"))`, its own eight files, checking
`innerHTML` and `dangerouslySetInnerHTML`.

It was left alone deliberately. T-073's criterion names THE SINK SWEEP,
the card's whole diff is a guard restoration with zero behaviour change,
and widening a second test on the executor's own initiative is scope the
card did not buy. This is the suggestion instead.

**It would be free.** Measured on this branch over all 47 `.ts`/`.tsx`
files under `app/src`: **zero** occurrences of `innerHTML` and **zero**
of `dangerouslySetInnerHTML`. The widening finds nothing to fix today,
which is the same shape T-073's own widening had.

**It is now cheaper than it was**, because the walk already exists.
`frontendFiles()` is shared by the IPC census and the sink sweep, and
its corpus is pinned by the nine-directory set test beside them, so this
sweep would become two lines over an already-pinned corpus rather than a
third `readdirSync`.

**The argument against, stated honestly so triage can weigh it.** The
raw-markup rule is ADR-009's, and ADR-009 is about what the interview
screen renders from untrusted planner output — the narrow scope may be
the INTENDED scope rather than an oversight, in which case the fix is a
comment saying so, not a widening. A React app that never touches
`innerHTML` anywhere is a stronger property than one whose interview
screen doesn't; but a test title that says "the interview screen's own
files" is at least honest about what it checks, which the sink sweep's
old title ("nothing in the crescendo") was not.
