---
id: T-097-s2
title: Three of T-097's own new test bodies kill no mutant another body does not already kill
status: suggested
suggested_by: executor claude-opus-5 @T-097
---

Filed by the executor against their own work, per the T-092 shape-six
discipline: **a body that runs and asserts, while killing no mutant
another body already kills, proves nothing it is credited for.**

T-097 added nine bodies. Six have a mutant they alone kill, each proved
by a whole-app-suite run with a failing-body count of exactly ONE (the
drill table is on the T-097 card). **Three do not, and I could not
derive one for any of them:**

1. **"the split is invisible in the model without the alias marker"**
   (`select-board.test.ts`). Asserts only PARSER output — that the
   fixture really does raise one `aliased-id` with `space: 'feature'`
   and `ids: ['F-01','F-1']`. It is a PREMISE CONTROL for the ruling,
   not a board pin, and it kills no board mutant by construction. Its
   value is documentary: it fails if the parser ever stops reporting
   the thing the whole ruling rests on. That is worth something and it
   is not what a pin is.
2. **"an UNALIASED backbone discloses nothing anywhere"**
   (`select-board.test.ts`). A strictly weaker, model-level restatement
   of the DOM body "an unaliased backbone grows no marker anywhere on
   the board". Every mutant that reds it reds two or three other bodies
   too; the DOM body alone-kills the unconditional-render mutant (M7)
   and this one does not.
3. **"a COMPONENT-space alias marks no board column"**
   (`select-board.test.ts`). The sharpest case. It **cannot**
   discriminate removal of its own `space === 'feature'` filter:
   component ids match `C-\d{2,}` and feature ids `F-\d+`, so a
   component slot key can never equal a feature column key, and an
   unfiltered `featureAliasIndex` would leave every column untouched
   anyway. The filter is correct, deliberate and provably
   unreachable-as-a-bug for the board. The body's comment originally
   called the filter "load-bearing" — that was FALSE and is corrected
   in place; the body now says it pins the OUTCOME, not the mechanism.

**Not fixed, and deliberately not deleted.** Deleting a body because no
mutant distinguishes it is its own error: (1) and (3) both encode
premises a future reader would otherwise have to re-derive, and (2) is
a cheap guard that survives a rewrite of the component layer. What is
wrong is CREDITING them as pins, so this file is the credit correction.

Whoever takes it owns the general question, which is bigger than these
three: **the house has no convention for a body that documents a
premise rather than discriminating a mutant.** A naming or comment
convention (`control:` / `premise:`, or a describe-block split) would
let a verifier tell a weak pin from a deliberate control at a glance,
instead of deriving mutants for all of them to find out. Nine bodies
took seven whole-suite runs to classify here.
