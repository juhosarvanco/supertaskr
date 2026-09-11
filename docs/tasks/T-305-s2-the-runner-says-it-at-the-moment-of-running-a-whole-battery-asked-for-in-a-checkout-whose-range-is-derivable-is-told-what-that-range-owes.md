---
id: T-305-s2
title: "The runner says it at the moment of RUNNING — a whole battery asked for in a checkout whose range is derivable is told what that range owes before it spends the minutes, which reaches the verifier and the bench that never touch the push guard"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-305, 2026-09-11, noticed while placing the over-run notice in the push guard at 3e791c58f6db8bb798057ebc126c2a222eb74022"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-305 puts the over-run notice in the push guard, which is where the
evidence is: the token says what was graded and the range says what was
owed, and only that arm holds both. The cost of that placement is WHEN it
speaks. The minutes are already spent by the time a seat reads it, and
two seats never reach it at all — a verifier grading a bench tip pushes
nothing, and neither does an executor iterating in a lane.

So the sentence lands one step too late for the seat it is aimed at, and
never lands for the seats that run suites most often.

## The shape that would work

The runner is asked to run something, and in a checkout with an upstream
it can derive what the range owes before it spawns anything — that
derivation is its own function, already written for the push guard to
spawn. When it is asked for the whole battery, or for a leg the range
does not owe, it can say what the range owes and what the narrow command
is, and then run exactly what it was asked to run.

It must NOT narrow anything by itself. The seat asked for a battery and
the seat gets a battery; this is a sentence printed before the spawn, not
a decision. Turning an announcement into a narrowing would make the
runner disagree with the seat that typed the command, which is the class
of guard people learn to work around.

At a bench tip there is no upstream to range against, and the honest
answer there is silence rather than a derived range nobody asked for. A
range given on the command line is a different matter and is already the
form the bench and the push both use.

## Acceptance criteria

- WHEN the runner is asked to grade legs a derivable range does not owe
  THE run SHALL proceed unchanged and the runner SHALL print, before the
  first spawn, what that range owes and the command that grades exactly
  it.
- WHEN no range can be derived and none was given THE runner SHALL say
  nothing about owed sets, so a bench and a lane are not told about a
  range they do not have.
