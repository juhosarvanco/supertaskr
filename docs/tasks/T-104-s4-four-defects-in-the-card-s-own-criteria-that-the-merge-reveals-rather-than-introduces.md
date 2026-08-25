---
id: T-104-s4
title: Four defects in T-104's own criteria and prose — a false uniqueness premise, a stale numeral, a citation that means two different criteria, and a phrase-match sold as an absence test
status: suggested
suggested_by: integrator claude-opus-5 @T-104
---

**All four were found by T-104's verifier at `51fb002` and confirmed
first-hand by the integrator at the merge `f309405`. None is repaired in
that checkpoint, and the reason is the rule the checkpoint applied
throughout: REPAIR WHAT THE MERGE INTRODUCES, FILE WHAT THE MERGE MERELY
REVEALS.** Every defect below was written by the ARCHITECT at the card's
base ref `fbae94a`, which is main's own merge-base with this lane — so
all four were already on main before the merge and are equally true
after it. **The merge reveals them; it does not write them.**

There is a second reason, and it is the stronger one for items 2 and 3:
**these are ACCEPTANCE CRITERIA, and criteria are the contract an
adversarial verifier attacked.** An integrator that rewrites a criterion
after the verdict changes what was approved, retroactively, with no
verifier watching. The lane's own text is left byte-untouched here for
the same reason.

## 1. "THE FIRST CRITERION" IS CITED THREE TIMES AND MEANS TWO DIFFERENT CRITERIA

Enumerated at the merge over the card's own body:

| line | cited for | actually criterion |
|---|---|---|
| 44 (the drafter's note) | the bump question | **3** |
| 361 (the architect's 2026-08-25 section) | the bump question | **3** |
| **237** | **transcribing a stale count** | **2** |

Criterion 1 is the size-S ceremony row and is none of the three.
Criterion 2 is *"the figures above SHALL be re-derived at the lane's own
ref rather than transcribed"*; criterion 3 is THE BUMP QUESTION. A fourth
occurrence at line 105 cites `T-080`'s first criterion — a different
card, correctly not one of these.

**The lane said "twice", the dispatch brief said "twice", the verifier
found three, and this integrator's own brief repeated "twice" as well.**
Four readers, one miscount, in the card whose second criterion forbids
transcribing figures. The narrow repair is to renumber the three
citations; the general one is that **a criterion is cited by its TEXT,
never by its ordinal** — an ordinal is a line number by another name, and
this card's own criteria list was reordered during drafting.

## 2. CRITERION 5's UNIQUENESS CLAIM IS FALSE ABOUT THE FILE IT GOVERNS

> **`method/tasks/TASK-FORMAT.md` SHALL CARRY THE DISPOSITION RULING**
> beside the three triage moves it already enumerates, and it SHALL NOT
> restate the status vocabulary — **this tree has exactly one, in
> `lib/parser/src/types.ts`**, which the gate READS rather than restates.

**`method/tasks/TASK-FORMAT.md:15` restates it**, byte-identically at
base and at the merge:

    status: planned          # suggested | planned | building | verifying |
                             # rejected | merging | done | parked

So the criterion is premised on a false claim about **the very file it
governs**. The OPERATIVE half is satisfied — the lane added no vocabulary
listing, which the verifier checked as a named attack — and the merge is
not affected. What wants deciding is the premise: either the tree has two
vocabularies and the criterion should say so, or the TASK-FORMAT line is
itself the defect and should become a pointer. **It cannot stay a
criterion that is false in its own justification.**

## 3. CRITERION 11 SAYS "EACH OF THE FIVE" WHERE THERE ARE NINE

> **NO CRITERION HERE SHALL BE SATISFIED BY A SENTENCE THAT NAMES NO
> MECHANISM.** Each of the five is either enforced somewhere (say where),
> or explicitly discipline-only (say so).

The card's TITLE was corrected `five → NINE` at dispatch (`fbae94a`) and
this numeral was not. The lane read it for MEANING and discharged all
nine plus the two unlisted obligations, so nothing was missed — **which
is precisely why it is worth filing: a criterion whose count is wrong
does not fail, it silently under-specifies, and only a lane that ignores
the numeral gets it right.**

## 4. THE CARD'S "CLEAN ZERO AT `8f8ec31`" IS A PHRASE-MATCH, NOT AN ABSENCE TEST

The card establishes that its nine rulings are unwritten by showing that
five operative PHRASES return zero occurrences across `method/` and
`docs/CONVENTIONS.md`. **The zero reproduces** — the lane confirmed it at
`fbae94a` and the verifier at `51fb002` — **and a phrase-match is not an
absence test.** A rule can be written in other words and this search
cannot see it; that is `T-093`'s anchor finding (*a search that finds
nothing is not a refutation*) committed by a card in this same batch. The
conclusion happens to hold; the method does not support it.

**The lane's counter-move is the honest one and should be recorded as the
model**: it added the literal phrase *"informational independence"* to
`TASK-FORMAT.md`, so the next such search finds MEANING where this one
found only words.

## FENCE

`[docs/tasks/T-104-the-method-snapshot-card-five-rulings-that-live-outside-method.md]`
— one file, held by no live lane once T-104's worktree is removed. Items
1 and 3 are one-word edits. Items 2 and 4 want a ruling and are the
reason this is filed rather than fixed: **both are cases where the card
is right in what it required and wrong in why**, and that is a
distinction a triage should draw, not an integrator.
