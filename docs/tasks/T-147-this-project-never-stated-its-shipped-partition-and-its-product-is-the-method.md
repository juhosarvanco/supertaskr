---
id: T-147
title: The ceremony rule asks each project to state which slugs ship, this one never did, and its rule-of-thumb fallback points the wrong way because here the METHOD is the product
feature: F-01
milestone: 4
priority: 3
size: S
status: building
suggested_by: architect claude-opus-5
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-104-s2 (Amnesty triage 2026-08-29 (triage seat)) — the first statement of this debt and the one carrying its derivation: its integrator note found the partition already derivable from the registry — thirteen components all carry touch_slugs:, only C-01 is empty, and tools/e2e, docs/** and .github/ have no component at all — so one sentence does it and no new field is needed. Its two cautions travel into this card's criteria: tools/e2e answers YES to "is it code?" and NO to "does it ship?", and non_code: is a different axis that must not be reused.

**PROMOTED at the amnesty triage, 2026-08-29.** This is a debt the
METHOD names for itself and this project has never paid, and the
argument for paying it is not tidiness — the fallback the method
supplies misfires HERE SPECIFICALLY, in the direction that removes a
verifier from the highest-blast-radius directory in the repository.

Absorbs: T-104-s2.

`blocked_by: [T-092-s2]` because the sentence lands in
`docs/CONVENTIONS.md`, which has **280 bytes** of warn headroom at this
base. The seat is the constraint, not the writing.

Integrator at the amnesty merge (2026-08-29, cc5389b): the block above
is LIFTED — the 280-byte figure was true at the triage's base and false
at the merge ref. ADR-019 Addendum 3 (0d82a60) re-landed the file at
110,342 bytes with warn 137,928; headroom re-derived here is 27,586
bytes. T-092-s2 is discharged in rejected/ with the full citation.

**THE ABSORBED CARD SUPPLIES THE DERIVATION AND IT COSTS NOTHING.**
`T-104-s2`'s integrator note found the partition already derivable from
the registry: all thirteen components carry `touch_slugs:`, the only
empty one is C-01 (`method/`), and `tools/e2e`, `docs/**` and `.github/`
have no component at all. So one sentence does it — *a `touches:` entry
that is a registry slug is shipped code; a bare path is not* — and no
new field and no prose list is needed. Two cautions travel with it:
`tools/e2e` is the interesting case, because "is it code?" answers YES
while "does it ship?" answers NO and a sentence saying "code" will be
misread within a week; and `non_code:` is a DIFFERENT axis and must not
be reused — C-11 carries `non_code: true` and two slugs.

## Acceptance criteria

- `docs/CONVENTIONS.md` SHALL state this project's shipped partition
  beside its slug map, in terms a dispatcher can apply without
  judgement, so `TASK-FORMAT.md`'s ceremony boundary stops being a rule
  of thumb here.
- THE statement SHALL answer the case that makes the fallback wrong in
  this repository: `method/` is NOT internal convention here — it is the
  artifact every new project receives verbatim, and `method/adapters/`
  in particular ships. A partition that classifies it as
  self-integrating on the grounds that it is "method" contradicts the
  same paragraph's own reason.
- THE partition SHALL be DERIVED from the registry rather than listed,
  or the list SHALL carry the derivation command beside it — a
  transcribed set of slugs goes stale the day a component is added,
  which is this file's own standing lesson.
- THE lane SHALL report `wc -c docs/CONVENTIONS.md` against
  `DOC_BUDGETS` before and after, and SHALL NOT land if the file crosses
  its WARN line. T-092-s2 is the blocker for exactly this reason.

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
