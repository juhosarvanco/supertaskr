---
id: T-224
title: A `touches:` AMENDMENT RIDES IN UNDER THE UNFENCEABLE DIRECTORY — the landing gate admits every write to docs/tasks, so a lane can widen its own or a sibling's fence for the next push
feature: F-06
milestone: 4
priority: 2
size: M
status: building
blocked_by: [T-212]
touches: [.claude, tools/e2e]
suggested_by: "T-212's independent verifier, driving the gate's own `judgePaths` against a card file that is not the lane's own — the gate admits it, correctly per rule 5, and the consequence is not disclosed anywhere"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**BOTH ARMS ADMIT IT, AND EACH IS INDIVIDUALLY RIGHT.** `judgePaths`
admits every changed path under `UNFENCEABLE_PATHS` — `docs/tasks` —
because rule 5 rules that directory unfenceable: the dispatch stamp and
the closing stamp are written there for every card, so a lane holding it
would collide with every other lane. `T-212` therefore admits a lane's
writes to its own card, which is what makes implementation notes
performable at all.

Driven against the gate's own function at `f093b7a`, with fence
`[tools/e2e]`:

    INSIDE  (admitted): tools/e2e/x.ts
                        docs/tasks/T-901-<the lane's own card>.md
                        docs/tasks/T-900-another-card.md
                        docs/tasks/T-212-<a third card>.md
    OUTSIDE (refused):  tools/e2e-old/x.ts, docs/ARCHITECTURE.md,
                        .claude/hooks/x.mjs

## THE CONSEQUENCE, WHICH IS THE CARD

`T-212` proves — in two separate bodies — that a card edited INSIDE the
lane does not widen THAT push, because the fence is read from the
integration branch. True, and not the whole account. The amendment
itself is an admitted path, so it PUSHES, it MERGES, and it lands on
main. From the next push onward the gate reads the widened `touches:`
as the card of record.

`T-211`'s fast path A is exactly this act — "a card amendment COMMITTED
ON MAIN plus `--write-fence`" — and `T-212`'s own `ROUTE` text says it
"is triage's to take, never this hook's." Nothing stops a lane taking
it unilaterally, one merge later. The same route reaches a SIBLING's
card, so lane A can widen lane B's fence.

## What this card is NOT

Not a demand that the gate refuse writes to `docs/tasks`. That would
refuse every lane's status stamp and every set of implementation notes,
and it is the collision rule 5 says a fence-versus-fence comparison
cannot discover, ever. The directory stays unfenceable.

## What to build

**WAIVER (2026-09-08, the architect seat — the seat that dispatched this card, which this line names as the rule requires): the second rejection at 40b22e4 is a DISTINCT, newly-found defect (a regression the first rework introduced: the `seen` dedupe with path-first resolution), not the first defect surviving a rebuild, with a remedy inside the fence named by the verifier. Waived once; a third pass follows; a third rejection is terminal. The escalation is docs/rooms/t224-second-rejection.md.**

**AMENDED 2026-09-08 AT DISPATCH, BEFORE THE DIFF EXISTS (orchestrator 5c;
measured by the blind phase 1's attack A1.1 and the dispatcher's ground
truth GT-9 at dfe35a5): the comparison in the first bullet is NOT
"base against tip". T-264's real fast-path-A grant (ebc51bc on main)
left the lane's copy of the card carrying the widened line, committed
BY THE LANE at 873d6d0, with no merge of main into the lane — so at the
lane's merge-base the line is OLD and at its tip NEW, and a base-vs-tip
rule would refuse a grant triage made. THE RULE IS: for every card file
in the range, compare the `touches:` line AT THE RANGE'S TIP against the
line ON THE INTEGRATION REF the fence itself is read from (the same ref,
resolved once, as it stood before the push; the merge's first parent for
a merge on an integration push). A tip line that EQUALS main's is a
delivered grant or no change: ALLOWED. A tip line that DIFFERS from
main's is an amendment riding in: REFUSED, naming the card, main's line
and the tip's line, whether the card is the lane's own or a sibling's.
A card ABSENT on the integration ref (filed in the range) is ALLOWED and
DISCLOSED: its fence governs a future push this gate does not judge; a
card id present on main under another path is resolved by id, not path,
so delete-and-re-add and rename do not evade the comparison. The
positive control and the disclosure bullets stand as written; the spec
SHALL carry a body that replays T-264's exact shape and is ALLOWED, and a
body where the tip line differs from main's and is REFUSED.**

- **Judge the `touches:` LINE, not the file.** For every card file in
  the range, read `frontmatterLineOf(text, "touches")` at the range's
  base and at its tip and compare the two strings. The file may change
  freely; a card whose `touches:` line MOVED is a fence amendment and
  is refused with the before/after named, whether it is the lane's own
  card or another's. `frontmatterLineOf` is already the one scanner and
  is already imported by this gate.
- **The refusal names the route it is not**: fast path A, on main, by
  triage.
- **A positive control in the same body**: a lane that edits its own
  card's STATUS and appends notes — the ordinary, universal case — is
  ALLOWED in the same fixture that refuses the `touches:` move. A guard
  that refuses every card write is indistinguishable from one that
  works, and this is the arm where that mistake would be invisible
  because the refusal looks principled.
- **Disclose it either way** in `landing-gate.mjs`'s "what this gate
  cannot see" list and in `T-212`'s section of the same name, which
  today names only `T-210`'s vector.

## Read beside

`T-212` (the gate and its two in-lane-widening bodies), `T-211` (fast
path A, the sanctioned route), `method/lane-protocol.md` rule 5 (why
`docs/tasks` is unfenceable, and the disclosure obligation), `T-219`
(the other open hole in what a fence may contain), `T-209` (why
`alwaysWritable` has a different polarity one call site over).
