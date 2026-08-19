---
id: T-076
title: The id layer is total, and every issue names its space
feature: F-02
milestone: 4
priority: 35
size: M
status: planned
blocked_by: []
touches: [lib-parser]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-053-s2, T-053-s3, T-053-s4 (fourth triage, 2026-08-19). The
suggestion files are removed in the same commit as this card. All three
live in `lib/parser/src/**`, all three are the id layer T-053 just made
reachable by a plausible input, and all three were deliberately left out
of T-053 because its criteria fenced them. T-053's fourth sibling,
T-053-s1, is NOT here: its subject is what the app RENDERS about these
issues, and it went to **T-077**.

A COMPARATOR THAT RETURNS NaN IS NOT A COMPARATOR. `compareComponentIds`
compares the digit halves with a numeric subtraction and returns that
difference whenever it is non-zero. For ids whose digit run exceeds what
a double can hold — roughly 309 digits — both sides are `Infinity`, the
difference is `NaN`, and `NaN !== 0` is TRUE, so the comparator returns
`NaN` before the string fallback is ever reached. `Array.prototype.sort`
is then free to do anything; V8 leaves the pair as-is. So "first match by
component id order wins" — the rule the whole `ambiguous-mapping`
message rests on — silently becomes "first by whatever order the files
arrived in". This is the SAME class of defect T-030's textual slot key
was written to avoid, one function away from it.

**AND IT GOVERNS T-053'S OWN OUTPUT.** The comparator is passed into
`aliasedIdSlots`, which sorts each slot's spellings with it, so past 309
digits the order of the `ids` array on a component-space `aliased-id`
issue — and the order the spellings are named in its message — is
implementation-defined too. NOT a regression: byte-identical to what
T-030 already shipped at that site. But `aliasedIdSlots`'s doc comment
argues the `compare` argument is safe because any numeric-first
comparator "has already degenerated to exactly this" string order, every
numeric part inside a slot being equal by construction. That reasoning
is sound for every id the comparator can weigh and FALSE in exactly this
range — so the comment currently states as a guarantee the one thing
that is not guaranteed.

NOT LIVE TODAY: the longest component id in the tree is `C-14`, and the
identity gate demands two-or-more digits but sets no upper bound, so any
file anyone writes can reach it. This is a totality fix, not an incident
response.

## Acceptance criteria
- `compareComponentIds` SHALL be TOTAL for every input: compare digit
  runs TEXTUALLY (strip leading zeros, then longer-is-greater, then
  lexicographic) — the same primitive `idSlotKey` already uses, so the
  two agree by construction rather than by coincidence. Ordering for
  every id the tree can currently hold SHALL be UNCHANGED, and that
  SHALL be proved rather than asserted: the existing comparator pin
  covers only small ids and SHALL gain cases past the double range in
  both directions plus a sort-stability case.
- `aliasedIdSlots`'s doc comment SHALL stop stating as an existing
  guarantee the property this criterion creates.
- `duplicate-id` SHALL carry the same required `space` field its sibling
  `aliased-id` gained, at ALL FOUR emit sites — component, the task disk
  layer, the task pure layer, and the backbone feature. Today the only
  way to know which space a `duplicate-id` came from is to read its
  prose or guess from the shape of `id`, which is exactly what T-053's
  criterion 5 ruled out for the very same concept: a UI that can filter
  aliases by space still cannot filter duplicates. `duplicate-id` is
  asserted with whole-object `toEqual` in several suites, so those pins
  SHALL move DELIBERATELY and the moves SHALL be listed in the notes.
- THE backbone feature's `duplicate-id` SHALL carry both declaration
  sites in `files` for the same reason the feature alias does — both
  declarations live in the roadmap — and the two messages SHALL end up
  saying the same kind of thing in the same shape.
- `dangling-reference` SHALL gain a NEAR-MISS HINT, not a new kind: when
  a reference's slot key matches a DECLARED id's slot key, the message
  SHALL say so. Reproduced today — a task declaring `T-001` and naming
  `T-01` in its own `blocked_by`, beside a roadmap declaring `F-01` and
  a `feature: F-1`, produces two messages that are TRUE and unhelpful in
  the one case that matters: the author wrote a padding variant of an id
  that exists one line away, and the parser tells them it does not
  exist. Both check sites already hold the declared-id set and the
  helper already exists.
- TWO THINGS SHALL BE RULED BEFORE BUILDING, not during: whether the
  hint is message text or a structured field (a consumer may want to
  offer the fix), and whether the component space's `depends_on` gets
  the same treatment — it has the same shape and the same helper
  available. Changing a `dangling-reference` message moves pins in three
  suites.

Verification: headless parser Vitest. Poison discipline applies, and per
T-078's clause the mutation SHALL be one-sided — several of these
messages are shared literals between producer and assertion, which is
exactly the shape that stays green under a global substitution.

## Implementation notes

## Verdicts
