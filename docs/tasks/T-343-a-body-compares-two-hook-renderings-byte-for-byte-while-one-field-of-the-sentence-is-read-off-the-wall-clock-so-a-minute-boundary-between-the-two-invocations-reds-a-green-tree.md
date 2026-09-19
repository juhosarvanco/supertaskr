---
id: T-343
title: "A body compares two hook renderings byte for byte while one field of the sentence is read off the wall clock, so a minute boundary falling between the two invocations reds a green tree: compare what the input determines and mask what the clock does, and sweep for the other bodies that do this"
feature: F-04
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "the architect seat on 2026-09-16, from a CI red on run 35035313344 whose failing body passed on the two pushes either side of it and on the same tree locally"
blocked_by: []
touches: [tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

`push-guard.spec.ts`'s body "the acknowledgement is RETIRED, and no
environment variable moves this guard's CI arm" invokes the wired hook
TWICE — once plain, once with the retired variable named — and asserts the
two standard-error renderings are equal. The equality is the property: the
variable must move no sentence.

ONE FIELD OF THAT SENTENCE IS NOT A FUNCTION OF THE INPUT. The fixture run
carries a FIXED `startedAt` of 2026-09-01T12:00:05Z, and the guard renders
`running for <h>h <m>m` as the span from that instant to the clock it reads
at the moment it runs. The two invocations are two separate processes a
fraction of a second apart. When a minute boundary falls between them the
minute component differs, the byte comparison fails, and the body reds a
tree nothing is wrong with.

OBSERVED. On 2026-09-16, run 35035313344 for commit 4fb07a8c: expected
`running for 347h 23m`, received `running for 347h 24m`, and nothing else
in the two renderings differed. The same body passed on the pushes either
side of it and passed on that same tree in the integration checkout
minutes earlier. The commit under it moved one card's prose and no code.

THE CONTROL IS THE RERUN. That job was re-run once against the SAME tree
and the same commit, changing nothing, and passed. Same body, same fixture,
same runner image; the only thing that differed is where the two
invocations fell against the clock.

The chance of crossing a minute boundary depends on the interval between
the invocations and their timing relative to that boundary. This card has
not established a measured incidence rate. The fixed `startedAt` receding
with age does not remove the changing elapsed-minute field; no frequency
estimate is needed for the deterministic control in the criteria below.

## What would settle it

The comparison is made over what the input determines and not over what the
clock does. The body keeps its property — the retired variable moves no
verdict and no sentence — by comparing the two renderings with the live
elapsed span masked or normalised, or by asserting over the fields the
input determines rather than over the whole string. Which spelling is the
builder's, but the elapsed figure must remain ASSERTED SOMEWHERE rather
than dropped: the sentence carries it for a reason and a body that stops
looking at it entirely has traded a flake for a hole.

AN ENVIRONMENT CLOCK OVERRIDE IS NOT AN ACCEPTABLE REMEDY HERE, and the
card says so because the seam exists and would be reached for. `elapsedSince`
already takes its `now` as an argument and the hook's top-level call passes
`Date.now()`. Threading a variable in from the environment so a test can
freeze it would put an environment hatch into the hook — inside the very
body whose whole purpose is to prohibit exactly that. The repair belongs in
the spec.

THE CLASS IS SWEPT, NOT ONLY THE SITE. Any body that asserts byte equality
between two separate invocations whose output carries a reading taken at run
time has this defect, whether the reading is a clock, a pid, a port or a
duration. The repair names the class and reports the sweep, or reports that
no other site was found.

## Acceptance criteria

- WHEN the wired hook is invoked twice and the two renderings are compared THE comparison SHALL be over the part of the output the input determines, and a difference arising only from the clock read at run time SHALL NOT fail it.
- WHEN the comparison masks or normalises the elapsed span THE body SHALL still assert that the elapsed figure is rendered and well formed, so the sentence's own content stays covered.
- WHEN this card is built THE repair SHALL NOT add an environment-read clock override to the hook, and a body SHALL demonstrate that the retired variable's name is still bound nowhere the hook reads.
- WHEN this card is built A body SHALL demonstrate the failure as it stands: two renderings differing only in the elapsed minute SHALL be shown to fail the present assertion and to pass the repaired one.
- WHEN the repair lands THE card SHALL name the class — a byte comparison across two invocations over output carrying a run-time reading — and SHALL record the sweep for other sites in this suite, or record that none was found.

## Pre-dispatch review and promotion — 2026-09-19

Promoted to planned under the owner's delegation to review, update and dispatch at most ten cards. The Codex coordinator's source read at `90ec2300133d697e3db9e574d72197b74794deb7` confirmed the wired-hook invocations, byte-for-byte stderr comparison, separate status comparison and retired-variable source check. The canonical acceptance criteria, fence, size and priority are unchanged; the arm derives the tier. The review did not repeat the historical CI run or establish a measured failure rate.

The real wired-hook comparison must use the repaired comparison, and a difference in stable content must still fail it. The elapsed field's presence and shape remain asserted as the criteria require; no production clock override is introduced.

### Historical wording superseded by this review

The incidence paragraph previously read:

> THE RATE IS THE GAP DIVIDED BY A MINUTE, which is why it has gone unnoticed:
> the two hook runs are a few hundred milliseconds apart, so it fires on the
> order of one push in a hundred and looks like an unexplained one-off each
> time. It also grows no less likely with age — the fixed `startedAt` recedes,
> but the boundary arrives just as often.

## Implementation notes

## Verdicts
