---
id: T-191
title: T-171's strand fixture manufactures its claim by the exact route T-184 closed, so the body now fails on its own positive control — and the screen half of T-184's end-to-end criterion has nowhere else to live
feature: F-03
milestone: 4
priority: 2
size: S
status: done
blocked_by: []
suggested_by: "executor claude-opus-5@subagent @T-184, routed from inside the lane; the red is measured at both refs rather than predicted"
touches: [app-interview]
builder: claude-opus-5 @integrator
review: self-verified
---

**ROUTED OUT OF `T-184`, WHICH COULD NOT REACH IT AND HANDS OFF A KNOWN
RED.** That card's fence is `app-agent`; this body lives in
`app/test/interview-chat-dom.test.tsx`, which the component registry
gives to `C-13` and therefore to `app-interview`. The lane routed rather
than widened.

## What broke, and why it is the fix working

`T-171`'s body *"A STRANDED CLAIM IS REFUSED: the footer, the box and
the ending all follow the turn"* strands the store through a helper that
pulls a `{ phase: "running", turn: 1 }` status **after turn 1 has already
completed**. `T-184` closed exactly that route: the store now refuses a
claim of flight about a turn whose own status has settled.

So the body fails on the line that exists to prove the fixture is real:

> `the fixture must actually reproduce the stranded claim`

**Nothing about the SUBJECT of that body is wrong.** The screen should
still refuse a stranded claim, and that assertion is still worth having.
What is gone is the fixture's way of manufacturing the precondition.

**MEASURED AT BOTH REFS RATHER THAN INFERRED.** With `T-184`'s lane
checked out and only `app/src/lib/agent-store.ts` reverted to the base,
the body passes; with the store restored, it fails. The store file is
byte-identical before and after that measurement.

## Why `stranded` is still reachable, which is what makes this cheap

`flightOf` reaches `stranded` when the store claims flight and the turn
list is non-empty. `T-184` refuses a claim about a turn the store has
watched SETTLE — it does not refuse a claim about a turn the webview
holds no events for. A status pull naming such a turn still arms, so the
state is still constructible and the body still has a fixture. **The
edit is to the turn the pull names, not to the idea.**

## And the second half, which is why this is one card rather than two

`T-184`'s criterion 4 asks for the pair END TO END — a stale answer and
a screen that does not enter the state `T-171` taught it to leave. Its
store half is built and driven through the real singleton inside
`app-agent`. **The SCREEN half is a DOM assertion and belongs here**, in
the same file and, most likely, in the same body: the walk that used to
strand the screen, asserted now to leave `data-flight` somewhere other
than `stranded`.

## Acceptance criteria

- THE existing body SHALL be restored to green by changing how its
  fixture manufactures the claim, NOT by relaxing what it asserts — its
  positive control SHALL still fail if the fixture stops reproducing the
  state under test.
- WHERE the stale pull names a turn the store has already watched settle,
  a body SHALL prove the screen never enters `stranded` at all — the
  screen half of `T-184`'s criterion 4.
- THE two cases SHALL be distinguishable in the body's own text: a claim
  the turn evidence contradicts (refused at the store now) and a claim
  the turn evidence cannot speak to (still refused at the screen).
- Verification: headless, the app suite.

## `review: self-verified`, AND THE STAMP IS DELIBERATELY NOT `independent`

The field was **missing entirely** until this checkpoint — an oversight,
since this card was stamped `done` when the repair landed and the
frontmatter was never completed.

The repair was carried by the INTEGRATOR at `T-184`'s merge, because that
lane's fence mechanically excluded the file. **`T-184`'s blind verifier
SPECIFIED and MEASURED it** — it confirmed the fence refused the path,
that routing was the only in-protocol option, and that the fix was one
value restoring 51/51. **But nobody independently reviewed the
integrator's implementation**, and the control that makes it trustworthy
(`turn: 1` fails, `turn: 2` passes) was run by the seat that wrote it.

So `self-verified` is the accurate stamp, and it is recorded with its
reasoning rather than left to read as a default.
