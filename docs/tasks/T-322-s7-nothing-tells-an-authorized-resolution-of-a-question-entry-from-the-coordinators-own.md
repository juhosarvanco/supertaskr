---
id: T-322-s7
title: "Nothing tells an authorized resolution of a question entry from the coordinator's own: the loop that may not settle a decision writes the file that records it being settled, and the only defence is that the resolution line is not empty"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-322 phase 2 — the entry writer refuses a resolved state carrying no evidence and checks nothing else, and the reader, the hold and the lane cut all release the card on that one word, whoever wrote it"
blocked_by: [T-322]
touches: [method/rooms/ROOM-FORMAT.md, method/roles/orchestrator.md, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, tools/method-evals/evals]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-322's question entry exists because a coordinator working while the
owner is away meets decisions it does not hold. It writes the question
into a room, every card the entry names becomes NOT STARTABLE, and the
lane cut refuses those cards by the same state. That half is enforced.

The other half is not. A card is released the moment the entry's `State:`
line reads `resolved`, and the only thing standing between the loop and
that word is a check that the resolution carries some non-empty text.
The room is a file; the coordinator writes files. So the loop that may
not settle the decision can write the record of it being settled, name
its own reasoning as the evidence, and unblock itself — and no reader
downstream can tell that entry from one the owner ruled.

The card routes this to the method rather than to code: the ruling entry
is proposed verbatim and appended on the owner's yes (T-307,
`method/roles/orchestrator.md` 8b), and MF-11 already polices how an
entry may speak about a ruling. That is the right home for the RULE. What
is missing is any signal a program can read, which is the same gap
MF-11's own disclosed trigger gap has: the discipline is real and nothing
measures it.

What "authorized" means mechanically is the owner's to rule — a countersigned
line, a decision file the entry cites, a commit the owner made — and that
is why this is filed rather than corrected.

## Acceptance criteria

- WHEN a question entry moves to resolved THE resolution SHALL carry a signal a program can check that the owner settled it, in whatever form the owner rules, and the shape SHALL be stated once in `method/rooms/ROOM-FORMAT.md`.
- WHEN a resolution carries no such signal THE lane cut SHALL keep refusing the cards the entry names, because a release nothing authorized is the loop settling its own question.
- WHEN the method eval audits a question entry THE resolved ones SHALL be checked for that signal, with its own discrimination pair, so a green over an empty live scope still means something.
- WHEN this lands THE role file SHALL say at 5g that the coordinator writes the question and never its resolution, in the same breath as the ruling entry it already defers.

## Implementation notes

## Verdicts
