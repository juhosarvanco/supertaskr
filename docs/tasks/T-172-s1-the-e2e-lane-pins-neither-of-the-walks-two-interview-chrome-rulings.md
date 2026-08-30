---
id: T-172-s1
title: The e2e lane pins neither of the walk's two interview-chrome rulings — T-172's acceptance asks for an e2e pin, and satisfying it is a NEW assertion in a package that card's fence cannot reach
feature: F-03
milestone: 4
priority: 8
size: S
status: planned
blocked_by: []
suggested_by: claude-opus-5@subagent, T-172's executor (2026-08-31) — routed from inside the lane rather than widening its fence
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

**CLASS PARENT: none found.** `command grep -rli "interview.spec.ts"
docs/tasks/` at `207b915` returns T-027, T-028, T-062, T-062-s1, T-074,
T-093 and T-172's own card; none of them owns the class *"the e2e lane
does not pin the interview screen's chrome strings"*. T-027 is the card
that BUILT the screen and SPECIFIED the retired footer (its §3 gives the
`one question at a time · N of 7` line to the pushing-back block by
name), so it is where the removed sentence came from rather than a card
that could absorb this. Filed rather than corroborated for that reason.

## What T-172 could not do, and why

T-172's acceptance reads, verbatim: *"the e2e interview spec's affected
bodies updated WITH the rename asserted, so a revert reds."* The card's
own triage sitting had already corrected the premise, and this lane
re-derived that correction at its own ref `fbeac77` rather than
inheriting it:

    command grep -rn "one question at a time" tools/e2e/tests/   -> no matches
    command grep -rn "Bank answer"            tools/e2e/tests/   -> no matches
    command grep -rn "interview-question-footer" tools/e2e/      -> no matches

`tools/e2e/tests/interview.spec.ts` reaches the bank step through
`getByTestId("interview-banked")`, never through the button's text, and
the only `getByRole("button", …)` calls in that file name *"Toggle
theme"*. So there were **no affected bodies to update**: satisfying that
criterion means ADDING an assertion, and `tools/e2e` sits outside
T-172's `app-interview` fence, which expands to `app/src/genesis` plus
seven `app/test` files and nothing else.

Both rulings ARE pinned, inside the fence T-172 owns — the DOM suite
asserts no planner message renders the status line and that the button
reads exactly `Answer`, and the harness suite asserts neither the
footer's own `· ` spelling nor `Bank answer` survives into the shipped
bundle. What is missing is the layer a browser can see.

## The fence this needs

`touches: [tools/e2e]` — one entry, and it is disjoint from
`app-interview`, so this can run beside another interview lane.

## What the pin should say

Two assertions in `tools/e2e/tests/interview.spec.ts`, in the body that
already walks start → question → answer → bank:

1. The send control is reached BY ITS NAME rather than by a testid —
   `getByRole("button", { name: "Answer" })` — so the rename is
   load-bearing to the walk instead of being invisible to it. Today the
   spec would pass unchanged if the label went back to `Bank answer`.
2. No planner message carries the status line: the phrase
   `one question at a time ·` (the COUNT's prefix, never the bare
   phrase) appears nowhere in the transcript region. **The narrowing is
   load-bearing** — the chat's not-started paragraph legitimately reads
   *"The planner asks one question at a time…"*, so an assertion on the
   bare phrase is unsatisfiable rather than merely weak. This is the
   same needle T-172 used in `app/test/interview-harness.test.ts`, and
   that file's comment carries the reason.

Both are new assertions, so both owe a POISON DRILL. The two mutants
that kill them are already written and measured on T-172's card: put the
footer span back in `CurrentQuestion`, and put `Bank answer` back on the
button.

## Disposition hint

**Promote, small, and schedule it into the next `tools/e2e` lane rather
than as one of its own.** STATE's queue already names `T-178` then
`T-163-s5`, `T-179`, `T-167-s8` as the `tools/e2e` run, and this is a
two-assertion addition to one existing body — it is cheaper as a rider
on whichever of those opens the spec than as a lane. It is NOT blocked
by the 410-byte graph hold: `tools/e2e` is outside the indexer's walk
(`.nputerignore`), which is exactly why STATE lists that package as one
of the two safely mergeable fences meanwhile.

**It should land AFTER T-172 merges**, because it asserts T-172's
behaviour; run against main today it would red honestly.

## TRIAGE (2026-08-31, standing triage sitting #5 — called by a BAND) — PROMOTED F-03 p8, as filed

`T-172` landed both of @human's chrome rulings and **no browser pins
either of them** — its verifier narrowed that gap by walking
`interview.spec.ts` in real Chromium (6/6, which rules out adjacent
breakage) but the spec asserts nothing about the retired line or the new
label. This card is the remaining half, and it is the half that would
catch a revert.

**IT IS ALSO THE CARD THAT REMOVES A KNOWN FRAGILITY.** The verifier
recorded that `has("Bank answer") === false` currently passes partly
because the production build strips comments — that string survives
twice in `InterviewChat.tsx`'s comments, and that file is bundled. The
failure mode is a FALSE RED, which is loud rather than silent, so it was
correctly not treated as a defect; a real browser assertion on the
rendered label does not depend on comment stripping at all.
