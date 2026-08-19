---
id: T-062-s1
title: T-051's minHeight floor was never verified for the one screen it was raised for — and the genesis screen wants 1082px against a 700px floor
status: parked
suggested_by: executor claude-opus-5 @T-062
---

**Found while reconciling `tools/e2e/tests/window-contract.spec.ts` for
T-062, and it is a fact about T-051 rather than about T-062.** The
instance is fixed on this branch — the probe now measures content — but
the QUESTION the fixed probe raises is not this task's to settle.

## What was wrong, measured

`window-contract.spec.ts`'s `naturalHeight` read
`document.documentElement.scrollHeight` after shrinking the viewport to
200px: the height the DOCUMENT insists on. That only reports content for
a screen that can push the page open.

**The genesis screen has been bounded since T-048** (`h-screen` on its
column), so it never could. Measured on the pre-T-062 tree, at 1024
wide:

| screen | old probe | true content height |
|---|---|---|
| front door | 475 | 475 |
| no-plan card | 663 | 663 |
| board | 4989 | 4989 |
| map | 620 | 620 |
| **genesis** | **302** | **1082** |

The four screens the probe could measure agree exactly. **The genesis
screen — the one screen T-051 raised the window FOR — was off by 780px,
and the test passed because the four measurable screens were all shorter
than the 700px floor.** The assertion `minHeight >= the tallest screen's
natural content` was therefore never evaluated against the screen it
mattered for.

T-062 would have made this total rather than partial: under one scroll
model no screen can push the page open, so all five would have reported
the viewport and the test would have passed while measuring nothing.
That is why it was caught — the bug got loud enough to see.

## What is now open, and why it is not T-062's

The probe is fixed (it sums the column's height plus what each engaged
scroll region is holding back, and reproduces the old numbers exactly on
the four screens that worked). The ASSERTION had to change with it,
because under T-062 "every screen fits in the window" is no longer the
property the floor protects — a screen taller than the window is normal
now, since it owns a scroll region and its chrome stays put. The
reconciled test asserts what T-048-s5 actually measured: that the region
left over is big enough to use.

**But the original question is still unanswered:** the genesis screen
wants **1082px** to show everything without scrolling, and the declared
`minHeight` is **700**. That is legal under one scroll model and it may
well be right. It is also exactly the kind of number T-051 would have
wanted to know when it chose 700, and it did not have it.

Someone should decide, with the number in hand, whether 700 is still the
floor they want — and whether the interview at the declared minimum is a
screen a user can work in or one that is permanently scrolling. **That
is partly an @human judgment** and it needs the app open at 1024x700,
not a measurement.

## Why this is filed as a class, not just a fix

A probe that reads the DOCUMENT to learn about a SCREEN is only correct
while the screen can move the document. Three of this repo's lane
helpers read `document.documentElement.scrollHeight`
(`genesis-screen.spec.ts`, `interview.spec.ts`, `window-contract.spec.ts`
— the `frame()` helpers). Under one scroll model that value is now the
viewport on every screen, which makes it a fine assertion for "the page
never grows" and a useless one for "how big is this screen". Both uses
are present in the lane today and they read identically.

The general form: **when a shell changes what CAN move, every probe that
inferred size from what DID move silently changes meaning.** Nothing in
the repo flags that; it was found by measuring a suite that stayed green.

---

**PARKED 2026-08-19 (fourth triage) — @human, HELD, NOT RANKED FOR
DISPATCH.**

**The PROBE half is closed and the class lesson with it.** Verified at
`7282308`: `naturalHeight` now sums the column's own height plus what
each engaged scroll region is holding back, its docstring records that
it reproduces the old numbers exactly on all four screens the old probe
could measure and answers **1082** for the genesis screen it could not
see, and the reason is stated where the next reader meets it. The
general form this file names — when a shell changes what CAN move, every
probe that inferred size from what DID move silently changes meaning —
is recorded in that docstring.

**What is NOT closed is the QUESTION.** The genesis screen wants 1082px
to show everything without scrolling and the declared floor is 700. That
is legal under one scroll model and may well be right. It is also
exactly the number T-051 would have wanted when it chose 700, and it did
not have it.

**UNPARK WHEN** @human has the app open at 1024x700 and rules whether
the interview at the declared minimum is a screen a user can work in or
one that is permanently scrolling. That needs the app on a real display,
not a measurement. Answer it together with **T-051-s3**, which is the
same question from the other side.
