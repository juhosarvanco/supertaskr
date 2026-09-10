---
id: T-298-s1
title: "The bounded wait's command SPELLING is not in this project's conventions, and the method text now points there — the rule landed without the pointer's target, so a seat reading orchestrator 5f is sent to a bullet that does not exist"
feature: F-04
milestone: 4
size: S
priority: 3
status: done
suggested_by: "executor claude-opus-5@subagent @T-298, measured at d8e4a9dd07a1f9b8beaad0e808a0e6742f5a0177 and at this lane's tip, 2026-09-10"
blocked_by: []
touches: [docs/CONVENTIONS.md, docs/STATE.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-298 put the bounded wait into the arm and stated the RULE in
`method/roles/orchestrator.md` step 5f. That step closes the way every
other product-agnostic step in that file closes — the rule lives in the
method, the SPELLING lives in the project's own conventions — and it
says so in as many words:

    The SPELLING of the command is the project's own, in its
    conventions, for the reason 5b gives about the assembler.

`docs/CONVENTIONS.md` carries no such bullet, because that file was
inside another live lane's fence when T-298 was built and could not be
written from this one. So the pointer is live and its target is not, and
a seat that follows it finds nothing.

The command it should publish, driven and measured in the T-298 lane:

    node tools/e2e/scripts/brief.mjs --await <marker path> --ceiling <seconds>
    node tools/e2e/scripts/brief.mjs --await-pid <pid> --ceiling <seconds>

Its exits, read unpiped in that lane: 0 when the fact happened, 1 when
the ceiling was reached and reported, 2 for every usage refusal — no
ceiling, no fact, two facts, a ceiling of zero or one that is not a
number, the process group or the broadcast pid, and any attempt to share
the invocation with another arm.

`docs/STATE.md`'s "Live right now" section names the dispatch, merge and
bench arms and does not yet name this one; it is the same omission at
the other end of the standing read.

## Acceptance criteria

- WHEN a seat reads orchestrator step 5f THE conventions SHALL carry a
  named bullet publishing both spellings above, their four exits and the
  rule that a wait is never a hand-typed sleep.
- WHEN a seat reads the standing state THE live-right-now section SHALL
  name the wait arm beside the dispatch, merge and bench arms.
- WHEN the docs gate runs over the changed paths THE run SHALL be clean.

## Implementation notes
<!-- executor appends before finishing -->

Performed by the integrator at the T-298 merge (2026-09-11) as a text-only write: the BOUNDED WAITS bullet in docs/CONVENTIONS.md beside the guard-class map, carrying both spellings and the four exits the lane measured, and the wait arm named in docs/STATE.md's live section beside the dispatch, merge and bench arms; the docs gate run over both paths at the merge.

## Verdicts
