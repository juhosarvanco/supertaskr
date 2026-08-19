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

2026-08-19, executor claude-opus-5 @fresh, worktree
/Users/ujju/Projects/nputer-T-076, branch task/T-076-id-layer from
`e4a5ae7`. Fence: `lib/parser/**` plus this card and its suggestion
files.

### Understanding, before anything was touched

This card closes three holes the T-053 lift left in the id layer, all
inside `lib/parser/src/**`. First, `compareComponentIds` is not a
comparator: past roughly 309 digits `Number(na) - Number(nb)` is
`Infinity - Infinity` = `NaN`, `NaN !== 0` is true, so it RETURNS `NaN`
before the string fallback runs — and it is the comparator "first match
by component id order wins" rests on, and the one T-053 passes into
`aliasedIdSlots`, so both the `ambiguous-mapping` winner and the `ids`
array of a component-space `aliased-id` are decided by something other
than id order in that range. It becomes a textual digit-run comparison
sharing `idSlotKey`'s leading-zero strip, so the comparator and the slot
key agree by construction; `aliasedIdSlots`'s doc must stop claiming a
guarantee it does not have, and must not then claim this card's new one
as pre-existing. Second, `duplicate-id` spans three id spaces with no
structural discriminator while its sibling `aliased-id` gained one at
T-053, so it gets a required `space` at all four emit sites, with the
backbone message reshaped to the alias message's shape; several suites
pin it with whole-object `toEqual`, so those move deliberately and are
listed. Third, a `dangling-reference` whose id differs from a DECLARED
id only in zero padding says only "nothing declares it", which is true
and sends a human hunting something that does not exist — so it gains a
near-miss HINT, never a new kind. The controls are the live-tree smoke
test staying at zero issues, the app suite passing UNMODIFIED, and a
one-sided poison drill over every new or changed test body.

### The two rulings, made and recorded BEFORE building

Criterion 6 requires both to be ruled before, not during. This section
was committed on its own, ahead of the first source byte, so the order
is checkable in `git log` rather than asserted here.

**RULING 1 — the hint is a STRUCTURED FIELD *and* message text:
`nearMiss?: string[]` on the `dangling-reference` member, present only
when non-empty, holding every DECLARED id sharing the reference's slot
key, in model order.**

1. Criterion 5 already mandates the prose ("the message SHALL say so"),
   so the open question is only whether a field is added ALONGSIDE. It
   is.
2. **A prose-only hint contradicts this card's own criterion 3.** T-053
   criterion 5 ruled that a consumer must tell id spaces apart "without
   parsing prose", and criterion 3 here removes the last prose-only
   discriminator in this union. Shipping a new prose-only signal in the
   same commit would put back exactly what is being taken out.
3. **The consumer criterion 6 names needs the ID, not a sentence.**
   "A consumer may want to offer the fix" is a quick-fix affordance; it
   cannot be built on a regex over an English clause that this card is
   also free to reword.
4. **Free to shape now, not later** — re-derived rather than
   transcribed from T-053: `git grep dangling-reference` over the whole
   repo returns hits only inside `lib/parser/**` and TWO app TEST files
   (`app/test/select-board.test.ts:507`,
   `app/test/select-task-detail.test.ts:309-310`), both
   `objectContaining`. No app SOURCE file reads the kind at all.
5. **An ARRAY, not a string, because the declared space can itself be
   aliased.** `T-01` and `T-001` both declared, `T-0001` referenced:
   naming one of two candidates would be a guess dressed as a fix. Model
   order is the determinism every other multi-id member of this union
   already uses.
6. **Optional rather than always-present-and-usually-empty.** Absence
   can only mean "no declared id shares this slot" — it is not the
   learned-default shape T-053 rejected for `space`, where absence would
   have had to be read as "component". An always-present `[]` would also
   move every existing whole-object pin for zero information.

**RULING 2 — component `depends_on` GETS the same hint. All THREE
`dangling-reference` emit sites, one shared helper.**

1. The card is titled "the id layer is TOTAL", and its whole complaint
   about `duplicate-id` is that a rule was applied in one space and not
   its siblings. Closing that asymmetry while opening a new one in the
   same commit is self-defeating.
2. The component space is where aliasing was FIRST found (T-030) and is
   the only space with a live registry today; `C-05`/`C-005` is the
   worked example in every doc comment in the module.
3. The site needs no new state: `parseComponentSet` already holds `byId`
   at the dangling loop, exactly as the card observes of `validate.ts`.
4. The cost is one shared helper against two of three sites behaving
   differently for no stated reason.

**Consequence of ruling 1 that is deliberate, not incidental**: the
near-miss index is keyed by a slot key derived from untrusted file
content, so it is a `Map` and never an object literal (ADR-009), and a
`blocked_by: [__proto__]` must not acquire a near miss through inherited
state. Pinned rather than argued.

## Verdicts
