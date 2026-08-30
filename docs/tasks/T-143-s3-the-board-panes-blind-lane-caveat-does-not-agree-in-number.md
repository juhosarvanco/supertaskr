---
id: T-143-s3
title: The board pane's blind-lane CAVEAT says "is claimed" and "its fence" about a list of two, which is the third live instance of T-143's own number-agreement class
feature: F-06
milestone: 4
priority: 6
size: S
status: building
suggested_by: verifier claude-opus-5@subagent @T-143
blocked_by: []
touches: [app-board]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**FOUND BY T-143's VERIFIER WHILE ENUMERATING THAT CARD'S SWEEP, and
routed because it is OUTSIDE that lane's fence** (`[lib-parser,
tools/e2e]`; this is `app/src/lib/board-model.ts`, which is `app-board`).

## The sentence

`dispatchFrontier`'s dispatchable reason in
`app/src/lib/board-model.ts` appends, when a live lane's card cannot be
read:

    " CAVEAT: " + blindLanes.length + " of those lanes (" +
      joinIds(blindLanes.map((l) => l.branch)) +
      ") is claimed by no card, so its fence could not be READ —
       unknown is not empty."

With two blind lanes that renders as *"2 of those lanes (X, Y) **is**
claimed by no card, so **its** fence could not be READ"*.

## Why it is the same finding and not a typo

T-143's criterion 4 exists because `lanes.ts`'s `fenced` residual said
*"no card for it"* about a list of two, while its sibling
`unfenceable` branch — written in the SAME commit — carried a `many`
flag with two dedicated poison arms. The card's argument is that this
sentence is read by a human deciding whether to OVERRIDE a coarse-fence
warning, and *"the LAST sentence that can afford to read as though one
lane were unreadable when three are"*. **The board pane's caveat is read
by exactly that person, in the GUI rather than the terminal.**

T-143 fixed the parser's copy (both directions pinned, one body each)
and the two `tools/e2e` copies. This is the third live one, and T-143's
verifier assigned a fourth — a clause the T-143 diff itself wrote — as a
correction at that merge. Four copies of one sentence-shaped rule.

## What it owes

1. The number agreement, derived from `blindLanes.length` the way the
   surrounding sentence already derives *"live lane"* / *"live lanes"*
   two clauses earlier in the same string.
2. **A pin in both directions**, because the existing coverage does not
   have one. DERIVED BY READING the tree at `14075ac2ddd6` rather than
   by mutating it — `app/src` is outside T-143's fence, so its verifier
   would not plant there: exactly ONE body drives this sentence,
   *"a lane no card claims has an UNKNOWN fence, and the caveat says
   so"* in `app/test/select-board.test.ts`. It drives ONE blind lane and
   asserts `toContain("CAVEAT")` and the branch name, never the verb and
   never the pronoun, so the mutation from *"is"* to *"are"* has nothing
   to fail against. That is the exact state T-143 measured on the parser
   before it fixed it. A two-blind-lane body is what the fix owes, and
   the existing body already carries the positive control to copy.
3. Nothing else. The caveat is genuinely CONSUMED at the dispatchable
   sentence rather than merely computed, which T-143's verifier checked
   and recorded; `blindLanes` is not a second `lanesWithNoCard`.

## Whether the class deserves a mechanical keeper

Worth asking at triage rather than deciding here. Four instances of
"a residual clause whose number must agree with the list it names" have
now been found by hand, in three packages, one of them introduced by the
very lane that was fixing the other three. A lint for this is not
obviously honest (a grep for singular verbs near a `.length` would fire
on prose that is fine, which is the reason `docs/CONVENTIONS.md` refuses
the comparable figure-in-a-comment lint in writing). **The cheaper
keeper is a shared helper** — one function that renders *"N lanes (a, b)
are"* / *"1 lane (a) is"* — so the four copies become one, and the
number stops being a thing each author has to remember.

## PROMOTED at standing triage sitting #2 (2026-08-30), F-06 priority 6 — and the keeper question is ANSWERED: NOT HERE

**RULED: this card takes the instance and the pin, and does NOT build the
shared helper.** The card asked the question at triage and the answer is
a fence fact rather than a preference: the copies of this sentence live
in three different packages, so one helper cannot be written from inside
`app-board` — a criterion ordering it would be a criterion the fence
forbids, which `method/tasks/TASK-FORMAT.md` names a DEFECTIVE CARD. The
lint arm stays declined for the reason the card already gives. **If the
lane still believes a helper is right after building the instance, it
ROUTES the argument with what it learned rather than taking it.**

## Acceptance criteria

- THE caveat's number SHALL be derived from the blind-lane count the
  same way the surrounding sentence already derives *"live lane"* /
  *"live lanes"* two clauses earlier in the same string — the verb and
  the pronoun both, since the current text gets both wrong together.
- THE change SHALL be pinned IN BOTH DIRECTIONS: one body driving a
  single blind lane and one driving two, each asserting the rendered
  verb and pronoun rather than only that the caveat appears. The
  existing one-lane body asserts neither, so a mutation between the two
  spellings has nothing to fail against today.
- THE lane SHALL NOT touch the caveat's other half: the clause is
  genuinely consumed at the dispatchable sentence rather than merely
  computed, which this card's parent checked and recorded.
- THE lane SHALL NOT build a shared renderer, and SHALL route the
  argument for one if it still holds after the work — see the ruling
  above.
- Verification: headless. The app's own unit suite green at the lane's
  ref, with the new two-lane body shown failing against the singular
  spelling before it passes against the derived one.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
