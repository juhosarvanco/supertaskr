---
id: T-147
title: The ceremony rule asks each project to state which slugs ship, this one never did, and its rule-of-thumb fallback points the wrong way because here the METHOD is the product
feature: F-01
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: architect claude-opus-5
blocked_by: []
touches: [docs/CONVENTIONS.md]
---

**This is a debt the method names for itself.** `TASK-FORMAT.md:340-348`:

> **THE BOUNDARY IS READ OFF `touches:`, AND IT IS NOT A GATE.** … if any
> entry names a component whose build output SHIPS, the card takes a
> verifier. **This file cannot draw that partition** — `method/` is
> product-agnostic … so the partition is the PROJECT's to state in its
> own conventions beside its slug map, and until it does the dispatcher
> applies the rule of thumb.

**This project has never stated it.** So every dispatcher falls back to:

> docs, method and tooling self-integrate; anything a user could run
> does not.

## Why the fallback misfires HERE specifically

The rule of thumb was written product-agnostically, and it says so in
the same paragraph: *"`method/` is product-agnostic (there are no slugs
here to enumerate)"*.

**In this repository that premise is false. `method/` IS the product.**
nputer is a project-genesis system; `method/adapters/` is not internal
convention, it is the artifact every new project receives verbatim.

So the fallback classifies the highest-blast-radius directory in the
repository as self-integrating, on the grounds that it is "method" —
while the same paragraph's *reason* (blast radius, what ships) points
the other way.

## Observed, not hypothetical

`T-145` fixed the adapter template's read-first sentence — the defect
that costs every new project the omission that cost this one a working
day. Under the rule of thumb it took **no verifier**, and its executor
correctly said so. Its drill then measured that **`cargo test` is exit 0
with 18 green result lines while the defect is present**, so nothing in
the repository would have caught a bad edit to that file either.

**Both halves of the safety net were absent at once**, and the rule of
thumb is what put the first one there.

## What this card decides

**Not** "add a verifier to method cards" — that is ceremony inflation
and `T-131` measures what that costs. The card is narrower: **state the
partition**, in `docs/CONVENTIONS.md` beside the slug map, as
`TASK-FORMAT.md` asks. Once stated, the row is mechanical and no
dispatcher has to judge again.

The judgement to make, and it is genuinely open:

1. **`method/adapters/` ships and takes a verifier; the rest of
   `method/` does not.** Narrowest, matches the observed instance.
2. **All of `method/` ships**, because this project's product is the
   method. Most consistent with the reason; most expensive, and `T-131`
   is the counter-argument.
3. **Nothing in `method/` ships; rely on pins instead.** Cheapest, and
   defensible ONLY once `T-145-s1` lands — the point of that card is
   that a pin is a better guard than a verifier for a file whose defects
   are textual. **Do not take arm 3 while the pin is unbuilt.**

## One caution for whoever takes it

**The partition must be stated in terms of SLUGS, beside the slug map,
not in prose about directories.** `TASK-FORMAT.md` is explicit that the
row is decided by reading `touches:`, and a partition a dispatcher has
to interpret is the rule of thumb again with more words.
