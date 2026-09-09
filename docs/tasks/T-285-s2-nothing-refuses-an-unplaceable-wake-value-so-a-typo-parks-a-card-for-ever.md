---
id: T-285-s2
title: "Nothing REFUSES an unplaceable `wake:` value — T-285's view reports one and no gate reads the field at all, so `wake: soonish` or `wake: 2026-02-30` parks a card for ever and the only reader is a page somebody has to open"
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-285, 2026-09-09, measured at 488e495"
blocked_by: [T-285]
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## What was measured

T-285 lands `readWake` in `tools/e2e/scripts/dispatch-brief.mjs`, which
places a `wake:` value into one of three forms and REPORTS anything
else rather than defaulting it — a deliberate choice, because the
default is what the ABSENCE of the field means and answering `fence` to
a half-written field hides the card behind a correct-looking answer.

What the tree does NOT have is anything that REFUSES one. The parser
preserves unknown frontmatter keys, so `wake:` never reaches a
validator; `card-preflight.mjs` reads status, blockers and fence and
does not read this field; the docs gate checks that frontmatter parses
with a legal status and stops there. So the whole enforcement of a
mistyped condition is that a triage seat runs the dispatch view with
`--full` and reads the COULD NOT BE RULED section — which is exactly
the "the rule was written and nothing read it" shape T-285 was filed
against, one field along.

Three values this repository will accept today and nothing will
question: `wake: soonish`, `wake: 2026-02-30` (date-shaped, no such
day), and `wake:` written and left blank.

## Acceptance criteria

- WHEN a card carries a `wake:` value that is neither a card id, nor a
  day on the calendar, nor the word `fence` THE card-input check SHALL
  refuse, naming the value and the three forms — the same refusal shape
  the CARD CLAIM marker already takes, because a field the author wrote
  themselves is an ask to be checked.
- WHEN a card carries `wake:` naming a card id THE check SHALL require
  that a live card declares that id, so a condition naming a card
  nobody can find is caught at the dispatch rather than reported for
  ever as unrulable.
- WHEN the check refuses THE reason SHALL cite the ONE reader —
  `readWake`'s three forms — rather than restating them, because a
  second copy of that vocabulary is the T-057 defect.
- A body SHALL show each of the three unplaceable values refused and a
  legal value of each of the three forms accepted, and SHALL be seen
  red against the tree before the check exists.

## Corroborations

**2026-09-09, verifier claude-opus-5@subagent (T-285 phase 2), measured
at `ce46115` on the bench `/Users/ujju/Projects/nputer-V-T-285`.** A
SECOND INSTANCE of this class, appended here rather than filed beside it
because this card already owns it. The unplaceable value that matters is
not only a typo: **`wake: 2026-09-09T00:00:00Z` — a full ISO 8601
instant, the most natural thing to type when a card says "an ISO
date" — is reported unplaceable**, because `readWake`'s date form is
`^\d{4}-\d{2}-\d{2}$` and a park is deliberately not scheduled to the
second. So is `wake: 2026-9-9`. Both fail LOUD, into COULD NOT BE RULED,
so no card is lost today — which is exactly the point this card makes:
the only reader is a page somebody has to open, and the author who typed
a legal-looking timestamp gets no signal at the moment they write it. A
gate that refuses at the write would catch the timestamp spelling and
the typo with one check.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
