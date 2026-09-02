---
id: T-230-s3
title: The quote arm reads the card BODY, so a false assertion in a TITLE is neither checked nor listed nor disclosed — and one of the three founding instances states its claim there
status: building
feature: F-06
milestone: 4
priority: 3
size: S
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
review: independent
suggested_by: "verifier claude-opus-5@subagent @V-230, 2026-09-02 — found attacking T-230's first acceptance criterion at 90dfe53"
---

`T-230`'s new `quotes` arm is careful about silence everywhere it looks:
an unreadable marker is counted apart, a marker the prose reader cannot
see is REPORTED as a sighting rather than dropped, and every unmarked
quoted run is listed with its line. **All three readers take
`cardBody(cardText)`, which strips the YAML frontmatter — so the one
place none of them looks is the card's own TITLE.**

Reproduced at `90dfe53` by driving the exported readers directly over a
card whose title carries a quoted assertion:

    title: the design "EACCES-fails the checkpoint sync" and docs/CONVENTIONS.md "already says it"

`cardClaims` returns nothing, `unseenMarkers` returns nothing, and
`unmarkedQuotes` returns nothing. A marker written inside a frontmatter
field is ignored **without even a sighting**, which is the exact failure
`unseenMarkers` exists to remove one line over: a marker meant as a claim
that is invisible, with no way for the author to tell.

**IT IS NOT HYPOTHETICAL, AND THE CARD'S OWN TABLE IS THE INSTANCE.**
`T-210`'s false prediction — the one `T-230` lists third — is stated in
that card's TITLE (its acceptance criteria begin at line 77; the
prediction is in the frontmatter and again in its body at lines 22-41).
The fixture reproduces the sentence faithfully and relocates it to body
prose, which is the only scope the arm can see.

Nothing the arm reports is WRONG. What is incomplete is its census, in a
place its own `cannot` text does not admit — and the first acceptance
criterion asks it to *"report every claim it could not evaluate rather
than passing silently over it"*.

**The cheap repair is one of two, and they are not the same size.** Read
the frontmatter's SCALAR VALUES as a further scope — they are already
parsed for `touches` by the path arm — or, cheaper and honest, add the
frontmatter to the class's `cannot` line so the omission is stated rather
than silent. Prefer whichever the fence can carry; the second is a
one-line edit and closes the disclosure half immediately.

## TRIAGE, 2026-09-02 — PROMOTED, absorbing its two siblings

Absorbs: T-230-s4, T-230-s5 — three distinct gaps in one arm of one
file, merged for economy (one lane, one review): the frontmatter blind
spot this card names, the marker's source reaching the report line
unescaped (`JSON.stringify` on the NOT CHECKABLE record, as the finding
message already does), and `unmarkedQuotes` dropping runs below
`MIN_QUOTE_CHARS` without counting them (a `below the quote floor: N`
line beside the two counts). Take the `cannot`-line arm as the floor for
the frontmatter gap and the scalar-value scope as the option. Fence
narrowed to the module and its spec.

## DISPATCH, 2026-09-02 — the stamp

**Audit (orchestrator 5b)**: both quote-arm call sites in
`tools/e2e/scripts/card-preflight.mjs` pass `cardBody(cardText)`, which
strips the frontmatter block (card-figures.mjs), so the title blind spot
holds at 37ac590. Fence: the module and its spec; T-225 holds neither.
Ceremony: S, guard-class, review independent — executor, then verifier;
this lane does NOT hold the integration checkout and does not merge.
