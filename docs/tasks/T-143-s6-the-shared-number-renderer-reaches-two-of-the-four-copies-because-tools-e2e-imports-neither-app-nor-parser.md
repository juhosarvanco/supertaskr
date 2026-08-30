---
id: T-143-s6
title: The shared number-agreement renderer T-143-s3 was told not to build reaches TWO of the four copies, not four — tools/e2e imports neither app nor parser by its own manifest, and the four copies do not share a sentence
status: suggested
suggested_by: executor claude-opus-5@subagent @T-143-s3
---

**THIS IS THE ROUTING T-143-s3's LAST CRITERION ORDERS**, not a request to
reverse the sitting-#2 ruling. That ruling declined the helper on a fence
fact — the copies live in three packages, so one helper cannot be written
from inside `app-board` — and told the lane to *"ROUTE the argument with
what it learned rather than taking it"* if it still believed a helper was
right after building the instance. It does still believe it, and what it
learned narrows the claim enough that triage should hear the narrower
version rather than the one on T-143-s3's body.

## What the instance cost, measured

`app/src/lib/board-model.ts`'s caveat, at `4054a7d`: a three-line ternary
inside a string concatenation, plus the comment saying why. Nothing about
the MECHANICS is hard, and no author who was thinking about number
agreement would get it wrong. All four instances of this class were
written by authors who were not thinking about it — including one written
by the very lane that was fixing the other three (T-143's verdict,
correction 1). **So the saving a helper offers is not lines. It is that
the number stops being a thing each author has to remember**, which is the
argument T-143-s3's body already made and which the build did not weaken.

## What the build DID weaken: the reach is two, not four

- `app/package.json` declares `"@nputer/parser": "file:../lib/parser"`, so
  a renderer living in `lib-parser` is visible to BOTH
  `lib/parser/src/lanes.ts` (two clauses — the `fenced` residual and the
  `unfenceable` no-card clause) and `app/src/lib/board-model.ts` (this
  caveat). Two of the four, reachable today, no new dependency.
- `tools/e2e/package.json`'s own description says the package **"imports
  neither app nor parser"** — the third standalone package, ADR-011
  family, deliberately. `tools/e2e/scripts/dispatch-brief.mjs` holds the
  other copies. Giving that package a dependency on `lib-parser` to share
  a nine-word renderer is an ADR-scale call about a package boundary, and
  it is not this suggestion's to make; a helper that reaches two sites is
  the honest proposal.

## And the four copies do not share a SENTENCE, only a decision

Derived by reading the three files at `4054a7d`:

- `lanes.ts`: `many ? 'those fences' : 'that fence'`, `many ? 'them' : 'it'`,
  `blindMany ? 'no cards for them' : 'no card for it'`
- `dispatch-brief.mjs`: `blind.length === 1 ? "is" : "are"`,
  `… ? "it" : "them"`, `many ? "those lanes" : "that lane"`,
  `many ? "those fences" : "that fence"`
- `board-model.ts`: `") is claimed by no card, so its fence could not be
  READ"` / `") are claimed by no card, so their fences could not be READ"`

**A renderer that returns a whole sentence would flatten three deliberate
wordings into one and lose the thing each says.** What is actually shared
is one decision — *singular or plural, from the length of the list this
clause names* — so the shape worth proposing is a NUMBER helper the call
site spends on its own words (`plural(n, "fence", "fences")`, or a
`spell(n, singular, plural)` pair-picker), never a sentence factory. That
is a smaller and duller function than T-143-s3's body imagined, and it is
the one that survives contact with the copies.

## What this card would do

1. Add the pair-picker to `lib-parser` (its home, not `app-board`'s — a
   lane taking this needs a `lib-parser` fence, which is why T-143-s3
   could not have taken it whatever the ruling said).
2. Move `lanes.ts`'s three ternaries and `board-model.ts`'s one onto it,
   changing no rendered byte — pinned by the bodies that already assert
   the rendered strings in both directions (`app/test/select-board.test.ts`
   after T-143-s3; the parser's own two poison arms from T-143).
3. Leave `dispatch-brief.mjs` alone and SAY SO in the code, so the next
   reader of the fourth copy learns why it is still a copy rather than
   assuming the sweep missed it.

## What triage should weigh against it

The lint arm stays declined for the reason T-143-s3's body gives. And the
honest case AGAINST even the small helper: two call sites is the threshold
where a shared abstraction is a coin-flip, the rendered bytes do not
change, and a keeper that cannot reach the copy in the third package does
not close the class — it closes half of it and leaves a reader believing
it closed. **If triage rules NO, the ruling is worth writing on this card
rather than leaving the class open**, because this is now the second
sitting the same question has reached.


CORROBORATION (2026-08-30, T-143-s3's blind verifier, routed at the merge): the frozen-number class survives twice inside the very string T-143-s3 fixed — board-model.ts's `" of " + CONCURRENCY_CEILING.max + " lanes are in flight."` ("1 of 5 lanes ARE in flight", same sentence as the corrected caveat) and the NOTHING-IS-DISPATCHABLE headline's "1 of 5 lanes are live". Both belong to whichever card takes this class next; the pair-picker proposal here is their natural vehicle.
