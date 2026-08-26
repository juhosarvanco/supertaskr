---
id: T-138-s5
title: Two claims in T-138's pre-dispatch half no longer survive the invitation that opens it — a command that returns 3 where the card says 0, and a named reader that reads nothing
status: suggested
suggested_by: integrator claude-opus-5 @T-138
touches: [docs/tasks/T-138-the-read-first-set-has-three-spellings.md]
---

**FOUND BY T-138's VERIFIER AT `9818f03` AND CONFIRMED FIRST-HAND BY THE
INTEGRATOR AT THE MERGE `6036260`. NEITHER IS REPAIRED IN THAT
CHECKPOINT, AND THE REASON IS THE RULE THE CHECKPOINT APPLIED
THROUGHOUT: REPAIR WHAT THE MERGE INTRODUCES, FILE WHAT THE MERGE MERELY
REVEALS** (`method/roles/integrator.md` rule 3).

**THE TEST IS THE PARENT, NOT THE SIZE OF THE FIX.** Both sentences were
already false at this merge's parent `2a922ce`, both were written by the
ARCHITECT before dispatch, and the lane appended 783 lines without
amending either. So the merge reveals them; it does not write them. Both
fixes are one line. That is not the question the rule asks.

**AND THERE IS A SECOND REASON, WHICH IS THE STRONGER ONE FOR THE
SECOND ITEM.** The verification clause is part of the card's CONTRACT —
the text an adversarial verifier was pointed at and attacked. An
integrator that rewrites a criterion after the verdict changes what was
approved, retroactively, with no verifier watching (`T-104-s4`, same
seat, same reasoning).

---

## 1. `grep -c ROADMAP CLAUDE.md` RETURNS **3**, AND THE CARD SAYS **0**

The card opens *"every claim below is a command anyone can re-run."* Line
46 states the command and its answer. Re-run at four refs:

```
                      grep -c ROADMAP CLAUDE.md
6a6bc87^                  0     <- the last ref at which the card is true
00e133a  (lane base)      3
2a922ce  (merge parent)   3
6036260  (the merge)      3
```

The table two lines above it is stale by the same commit: it shows the
root adapter's read-first set as *STATE, ARCHITECTURE, CONVENTIONS*, and
the root adapter has named `docs/ROADMAP.md` since `6a6bc87`.

**THE TIMING IS THE FINDING, AND IT IS SHARPER THAN EITHER THE BRIEF OR
THE VERDICT STATED.** Derived here with `git log -S` over the card's own
file and `git log -1 --format=%ci`:

| commit | clock | what it is |
|---|---|---|
| `b3eaefe` | **12:56:24** | the card is WRITTEN — and `grep -c ROADMAP CLAUDE.md` returns **0**, so the claim is TRUE |
| `6a6bc87` | **13:12:47** | the root adapters and `orchestrator.md` move; the claim goes FALSE |
| `00e133a` | **18:53:11** | the card is DISPATCHED, still carrying it |

**SIXTEEN MINUTES TRUE. FIVE HOURS AND FORTY-ONE MINUTES FALSE BEFORE A
LANE WAS CUT ON IT.** (The verdict says "5h40m before dispatch" and is
right about the gap between `6a6bc87` and `00e133a`; what it does not
say is that the card was true when it was written. The parent brief's
"1, not 0, twelve hours earlier" is wrong in both figures.)

**AND THE CARD IS ITS OWN SUBJECT.** T-138 exists to record that
`docs/ROADMAP.md` carried the sentence that would have saved a working
day and went unread *because prose is something somebody has to keep
true*. Its own central table went stale inside sixteen minutes, in the
direction that makes its case look stronger than the tree does. **That
is not an argument for repairing it. It is the reason to leave it
standing with a ref beside it.**

## 2. THE VERIFICATION CLAUSE NAMES A READER THAT READS NOTHING

Line 154: *"**`CLAUDE.md` is read by `app/test/interview-chat-dom.test.tsx`**
— derived, not assumed — so `npm test` from `app/` is owed."*

**IT IS NOT DERIVED AND IT IS NOT TRUE.** `interview-chat-dom.test.tsx:720`
is the only line in any test file in this repository that contains the
string `CLAUDE.md`, and it is `"$KIT"/adapters/CLAUDE.md` inside a
`REFUSED_COMPOUND` fixture quoting a kit copy command. It opens no file.

**AND THE CORRECTION IS STRONGER THAN THE VERDICT'S.** The verdict
corrects the reader to `select-board.test.ts:1119`. Measured at the
merge, that body reads **`method/roles/orchestrator.md`** — a different
file that happened to be inside the same fence — and matches it for
`Ceiling: 3–5 concurrent`. Swept over `app/test`, `lib/parser/test` and
`tools/e2e/tests` with `command grep -rn`:

**NOTHING IN THIS REPOSITORY READS THE REPOSITORY-ROOT `CLAUDE.md`.**
Not one test, in any of the three suites.

**`npm test` from `app/` WAS GENUINELY OWED, FOR A DIFFERENT REASON THAN
THE ONE STATED**, and the card's own SUITES AND GATES section already
gives it: the DOCS GATE fires on the card's own file under `docs/tasks/`,
whose readers are `select-board.test.ts`,
`architecture-dogfood.test.ts` and `map-dogfood-render.test.tsx`. The
conclusion was right; the derivation behind it was invented. **A wrong
reason that reaches a right answer is the harder defect to catch,
because nothing reds.**

## What to do, and it is two lines

1. **Mark the pre-`6a6bc87` half historical with its ref** rather than
   deleting it — `T-101`'s precedent, which this project uses wherever a
   figure was true of a ref it no longer names. The card's argument is
   *about* that state and does not survive its deletion.
2. **Correct the verification clause's reader**, and say what actually
   owed the suite. The honest sentence is that no test reads root
   `CLAUDE.md` — which is a small piece of evidence FOR this card's
   thesis, not against it.

**Both edits are inside `docs/tasks/T-138-…md`, which is outside every
fence by construction** (`method/lane-protocol.md` rule 5, "A CARD'S OWN
FILE IS NEVER PART OF ITS OWN FENCE"). So this needs no fence
negotiation and no lane — it needs a seat with standing to amend a
landed card, which is a `TASK-FORMAT` question and not an integrator's.

## Why this is worth a card and not a line in STATE

**A RECORD CARD'S TOP HALF IS WHAT LATER CARDS QUOTE.** `T-138-s1`,
`s2`, `s3` and `s4` all cite this card's measurements; none of them
depends on either of these two sentences, and that was checked at the
merge rather than assumed. The next card that quotes the top half will
not check.
