---
id: T-290-s5
title: "A card whose criteria name a rule of this project's conventions can fence the index alone, and the preflight has no way to tell it the chapter that rule lives in is outside its fence"
feature: F-01
milestone: 4
size: M
priority: 1
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-290, derived from the fence census at the lane's tip: 72 non-done cards fence the index whole and 1 of them also fences a chapter (figures corrected by the verifier, 2026-09-14)"
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

Before T-290, a card that meant to change a rule fenced
`docs/CONVENTIONS.md` and that was the whole of it. After T-290 that path
reserves an INDEX: the rules live in eleven chapters under
`docs/conventions/`, and a lane fenced to the index alone can change a
pointer line and not the rule it points at.

Measured at T-290's tip over `liveTaskCards`, the FLAT non-recursive walk
every reader of this board takes: 134 cards fence the index whole, 72 of
them not done and 45 of those planned; ONE of the 72 also fences a
chapter. Every one of the other 71 will be dispatched with a fence that
cannot reach the rule its criteria are about, and the first thing each
lane meets is a write hook refusing the only file that matters.
(These read 136 / 74 / 73 until the verifier's correction of 2026-09-14,
which walked docs/tasks/ recursively and so counted two `rejected` cards
that no reader of this board sees.)

The preflight already refuses a criterion that names a path the fence
does not carry, and refuses a fence entry that reserves nothing. This is
the same class one level in: the criterion names a RULE rather than a
path, and nothing connects the rule to the chapter it lives in. The
index is what makes the connection derivable — it publishes every
opener beside its chapter — so the check can be a derivation rather than
a list.

The 73 cards themselves are the seat's records action and are not this
card's to edit.

## Acceptance criteria

- WHEN a card's criteria or body name a rule of this project's conventions by its published opener THE preflight SHALL derive the chapter that rule lives in from the index and SHALL report a fence that carries the index without that chapter, naming both.
- WHEN a card fences the index because it really is about the index — a pointer, the preamble, the method stamp — THE check SHALL NOT refuse it, and the difference SHALL be derived rather than declared by the author.
- WHEN the check runs over the live board THE finding count SHALL be reported and a card planted without the chapter SHALL be reported, with the same card carrying it answering clean — the control, run where the arrangement is absent.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
