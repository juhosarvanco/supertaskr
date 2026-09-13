---
id: T-307-s6
title: "MF-11 is quotation-mark-shaped, so a blockquoted owner message and a reported one both pass — the two shapes that carry a message without punctuating it are the eval's blind spot"
feature: F-01
milestone: 4
size: S
priority: 3
status: parked
wake: T-284
suggested_by: "verifier claude-opus-5@subagent (phase 2) @T-307, measured at b78f9f507aba638617462ea284d5c02913360977, 2026-09-10"
blocked_by: []
touches: [tools/method-evals/evals/mf-11-room-entries-paraphrase.mjs]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding, measured at `b78f9f507aba638617462ea284d5c02913360977`

MF-11's quotation half matches a run between quotation marks. Two shapes
carry the owner's message without ever using one, and both were run
through the eval's own audit at this ref, dated at its floor:

- a **blockquote** — an attribution line, then the message under a
  leading angle bracket, which is how a chat paste is usually formatted
  in markdown. PASSES.
- a **reported message** — *the owner said on <date> that ...* followed
  by the message in the owner's own words with no marks at all. PASSES.

The card asked for an eval that fails on *a quoted message*, so both are
inside its letter and neither is a defect against T-307. They are the
next two shapes, and the second is the one a seat writes without meaning
to evade anything.

## The shape that would work, and the trap in it

The blockquote is cheap and safe: a `>` line inside an entry, within the
same glue distance of an attribution, is the same signal a quotation mark
is, and it cannot collide with ordinary prose the way a quotation mark
does.

The reported message is the hard half and it is where the cheap answer
gets it wrong. *The owner said on this date that the second option is
built* is a PARAPHRASE — the rule's own preferred form — and reddening on
the word `said` would refuse exactly the entries the rule asks for. There
is no punctuation to separate a paraphrase from a paste, so any rule here
is about LENGTH and VOICE rather than shape, and a check that guesses at
voice is a check nobody can keep green.

WEIGH: closing only the blockquote, and saying in the eval's header that
the reported form is out of reach, is a smaller and more honest card than
one that promises both.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-284; the eval is quotation-mark-shaped, so the two shapes that carry a message without punctuation are its blind spot.
