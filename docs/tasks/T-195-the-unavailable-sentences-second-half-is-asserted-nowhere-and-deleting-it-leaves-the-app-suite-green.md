---
id: T-195
title: The `unavailable` sentence's post-em-dash half is asserted nowhere — deleting it leaves the whole app suite green, and it is the user-facing half that says WHY
feature: F-04
milestone: 4
priority: 5
size: S
status: planned
blocked_by: []
touches: [app-dispatch]
suggested_by: "architect/integrator seat, allocating an id for a finding MEASURED by T-112-s4's lane, which declined to mint one itself"
builder:
review:
---

**MEASURED, NOT SUSPECTED, AND THE LANE THAT FOUND IT REFUSED TO MINT ITS
OWN ID.** `T-112-s4`'s executor verified this before putting it in a
permanent card: deleting the second half of the `unavailable` sentence —
a one-side-only mutation, read back as `1 1` — leaves the app suite at
**49 files / 1,077 tests, exit 0**.

It then declined to allocate a card id, on the reasoning that a lane
writing from an older base is the worst seat to mint from. **That
reasoning is now the project's rule** (see `T-187`'s correction: only the
dispatching seat can be an allocator), so this id was allocated at the
merge and the measurement is carried across verbatim.

## Whose pin this is, and why the card is separate

**It is `T-112-s1`'s pin, not `T-112-s4`'s diff.** That lane registered
the command and shipped the wire mirror; this half of the sentence
arrived with it and nothing was written that could notice it going. The
finding surfaced from inside a different lane's fence, which is why it is
carded rather than fixed in place.

## Why the unasserted half is the half that matters

The `unavailable` arm is what the user sees when the lane scan **cannot
answer**. Its first half names the state; **the post-em-dash half is
where the sentence says WHY** — and a refusal that cannot say why is the
failure family this project has repeatedly refused to ship (`T-171`'s
footer that would not stop claiming a turn; `T-183`'s chord that silently
did nothing).

So the exposure is not cosmetic: **the sentence could lose its reason and
every gate in the repository would stay green.**

## What a fix decides

1. **Whether the pin belongs to the wire or to the presentation.**
   `dispatch-store.ts` is explicitly a mirror that *"classifies
   nothing"*, and `task-detail.ts` is where presentation lives and where
   `app/test/select-task-detail.test.ts` already drives. Putting the
   assertion on the wire side would make this file do something it
   declares it does not do. **Decide it against that declaration rather
   than by convenience.**
2. **Whether the sentence should be asserted whole or by parts.** A body
   asserting the full string pins the reason and also freezes the
   wording; one asserting only that a reason is PRESENT is weaker and
   survives an edit. Say which and why.
3. **Whether the other `LaneScanRefusal` arms have the same hole.** This
   was found as one instance from inside another lane's fence. **Sweep
   the arms** — say what is a member and what is not, with a reason for
   each non-member.

## Acceptance criteria

- THE `unavailable` sentence's reason-bearing half SHALL be pinned by a
  body that reds when it is deleted, and the mutant SHALL be constructed
  and restored with its restoration proven.
- THE pin SHALL sit on the side of the boundary that owns presentation,
  or the card SHALL argue why the mirror is the right home despite its
  own declaration.
- EVERY `LaneScanRefusal` arm SHALL be swept, with membership argued
  either way.
- **A positive control SHALL prove each new body can fail** — this card
  exists because a green suite meant nothing here.
- Verification: headless, the app suite.

## Read beside

`T-112-s1` (whose pin this is), `T-185` (the same boundary dropping two
other facts nothing reads), and `T-190` (why nothing on that side of the
boundary can be reached by a test at all today — which is very likely why
this hole exists).
