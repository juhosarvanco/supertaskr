---
id: T-230-s9
title: Six author-text interpolations in the quotes arm's report lines are still unescaped, and the discriminator is not obvious — the raise() SUBJECTS beside them must stay raw or dischargedBy stops matching every published-form ruling
feature: F-06
milestone: 4
priority: 4
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-230-s3
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**`T-230-s4` NAMED ONE SITE AND THERE ARE SEVEN.** The triage that
promoted `T-230-s3` absorbed the NOT CHECKABLE record's bare
`${m.claim.source}`, and that one is fixed. The remaining six sit in the
same arm of tools/e2e/scripts/card-preflight.mjs and interpolate strings
the CARD wrote into a rendered report line with no escape:

- the CHECKED and HELD record — the source and the needle;
- the QUOTED CLAIM NOT IN FILE record — the source and the needle;
- the same pair inside that finding's own message;
- the marker sighting's collapsed line text;
- both NOT CHECKED listings' clipped run text.

A value carrying a space, a stray quote, or a trailing character that
runs into the sentence hands the reader a line where they cannot tell
where the author's string ends and the tool's prose begins — and the
line is what a dispatcher decides on.

## THE SWEEP IS THE POINT AND SO IS ITS DISCRIMINATOR

docs/CONVENTIONS.md's A FIX NAMES ITS CLASS AND ITS SWEEP asks for the
class; this card is the class. But the class has a member that must NOT
be escaped, and escaping it silently breaks a different guarantee: the
FIRST argument of `raise()` is the finding's SUBJECT, and `dischargedBy`
matches a card's dated `PREFLIGHT RULING` line against exactly that
string. Wrap the subject in `JSON.stringify` and every ruling written in
the published form — the author quotes the needle as they wrote it —
stops discharging, silently, in the direction that RE-OPENS findings a
seat already ruled on.

So the repair is per-site and its acceptance criterion is the pair: every
DISPLAY interpolation escaped, every SUBJECT left raw, and a body that
reds if either moves. The subject half needs a positive control that a
published-form ruling still discharges after the change — the body
`a quoted-claim finding is dischargeable by a dated ruling naming its
quote` is the one to extend rather than duplicate.

## Not urgent, and the reason is stated

No live card has produced an ambiguous line yet; the founding shape is a
source with a space, which this card's sibling planted deliberately as a
fixture. It is filed because an unrecorded sweep and an unrun one are
indistinguishable to the next reader.
