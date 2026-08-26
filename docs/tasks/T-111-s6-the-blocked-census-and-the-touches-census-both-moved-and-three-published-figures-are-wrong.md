---
id: T-111-s6
title: Four published figures re-derived on disk — the blocked_by census is 48 at f9350b1 and not 46, its four "suppressed" cards were six, T-111-s3's vocabulary census has grown a containment family, and the whole framing was overturned on main while this lane measured it
status: suggested
suggested_by: executor claude-opus-5 @T-111
---

**Every figure below was re-derived on disk at the ref it names**, by
matching `^id:` and never a filename glob, over `docs/tasks/` and
`docs/tasks/rejected/` together.

## ZERO — THE FRAMING WAS OVERTURNED ON MAIN AT `b0b5b43`, AND THIS CARD KEEPS THE MEASUREMENTS AND DROPS THE WORD

**`T-136` was REJECTED and four cleared declarations were restored
byte-identical**, on @human's question and a reading of the source: `blocked_by`
is a DECLARATION, `app/src/lib/task-detail.ts` has always resolved every id
against the model, and `TaskDetailPanel.tsx` has always rendered a `done`
blocker in its status colour with a tick. **`blocked_by: [T-104]` on a card
whose T-104 has landed is not stale — it is historically accurate.**

**So the word "stale" is retracted from this card and the counts are
kept.** They were never counts of a defect; they are counts of
*declarations naming a blocker that has since landed*, which is what a
project's lineage looks like after a hundred cards. **What was wrong was a
QUERY** — a shell loop reading a non-empty `blocked_by` as "blocked"
without resolving the ids — and that is precisely what `T-111`'s
derivation cannot do, because it asks every named blocker for its status
and never asks the field for a verdict.

Read every table below as an inventory, not an indictment.

## ONE — the repo-wide count is 48 at `f9350b1`, not 46

`T-111-s4` and `T-136` both state **46 entries naming a `done` blocker**,
measured at `f9350b1`. **Walked at that same ref it is 48.**

**THE TWO MISSING ARE `T-111`'s OWN AND `T-134`'s OWN** — `T-111 <- T-110`
and `T-134 <- T-132`, the two that `15a963d`'s message narrates clearing
as *dispatch* rather than counting as *census*. Every other figure
reconciles once those two are added back:

| at `f9350b1` | on disk |
|---|---|
| `blocked_by` entries repo-wide | **51** |
| entries whose blocker is `done` | **48** |
| entries whose blocker names no card | **0** |
| entries whose blocker is still open or parked | **3** |
| planned cards ALL of whose blockers had landed | **6** |

**`T-111-s4`'s table names FOUR of those six.** The other two are `T-111`
and `T-134` themselves. And the four carried **seven** entries between
them, not five — `T-065` carries two — so `51 − 7 = 44`, which is exactly
the entry count on disk at `15a963d`.

## TWO — at `15a963d` the answer is 0, 3 or 41 depending on the question

This lane's dispatch brief said *"the number you re-derive should now be
zero — and if it is not, that is news."* **Three different numbers answer
that sentence.** Derived at `15a963d`, this lane's base:

| quantity | `f9350b1` | `15a963d` |
|---|---|---|
| `blocked_by` entries repo-wide | 51 | **44** |
| entries whose blocker is `done` | 48 | **41** |
| such entries on cards that are not `done` | 10 | **3** |
| **planned cards ALL of whose blockers had landed** | 6 | **0** |
| entries naming no card at all | 0 | **0** |

**ZERO is right for the question that decides a dispatch.** Forty-one
entries record blockers that have landed — 38 on `done` cards, and THREE
on planned ones: `T-067 <- T-062`, `T-067 <- T-058`, `T-068 <- T-057`.
**None of the three changes an answer**, because both cards are still
genuinely blocked by `T-065`, which is `planned`. That is why the hand
pass did not touch them, and — after `b0b5b43` — why it should not have.

**AND AT `b0b5b43` THE FIRST TWO ROWS GO BACK UP**, because the four
declarations were restored. **A COUNT OF THIS FIELD IS A FUNCTION OF THE
TREE AND OF THE QUESTION, and this card is four different numbers for one
sentence.** Derive it; do not quote this table.

## THREE — `T-111-s3`'s vocabulary census has grown a containment family

`T-111-s3` censused **124 cards carrying `touches:`, 19 distinct raw
tokens** at `e04f5b3`. At `15a963d` it is **142 cards and 26 tokens**, and
the difference is a new KIND of token rather than more of the same:

    e04f5b3 -> 15a963d, added:  method/lane-protocol.md (3)
                                method/roles/executor.md (2)
                                method/roles/integrator.md (1)
                                method/roles/orchestrator.md (1)
                                method/tasks/TASK-FORMAT.md (4)
                                docs/tasks/T-025-agent-runner.md (1)
                                docs/tasks/T-027-interview-split-view.md (1)
                                docs/tasks/T-081-denial-reaches-the-screen.md (1)
                       removed: docs/tasks/ (was 1)

**ELEVEN cards now fence a FILE UNDER a directory another card fences.**
`method/` (9 cards) contains all five `method/<file>` tokens; the bare
`docs` (1 card, `T-054`) contains `docs/CONVENTIONS.md` (21),
`docs/architecture/components/` (8) and the three `docs/tasks/T-*.md`.
**That is CONTAINMENT, and `T-111-s3`'s prescribed trailing-slash minimum
reaches none of it** — its own census had one containment case among four
collisions; on this board containment is the dominant family.

**T-111's implementation answers it**: `touchTokensOverlap` is
normalisation PLUS separator-anchored containment, so `method/` and
`method/lane-protocol.md` overlap while `app/src` and `app/src-tauri` do
not. The remaining hole is s3's fourth, unchanged and unclosable by any
string rule: **`ci` (1 card) against `.github/` (4)**, pinned AS
known-wrong rather than left silent.

**The upstream repair s3 routes — a parser-level issue kind for a token
resolving to neither a slug nor a path — is `lib-parser`, held live by
`T-134`**, whose own subject is that a fence names paths and a slug is
shorthand. Read it beside that card rather than before it.

## FOUR — one claim the frontier is structurally unable to check

`T-111-s3` states *"`ci` … is not a path (nothing at the repository root
is named `ci`)"*. **A board derivation has no filesystem**, so
`expandTouch` classifies any token resolving to no component slug as a
literal path and cannot tell `ci` from a real one. The claim is still true
on disk; it is simply not one this layer can make, and the doc comment
says so rather than implying otherwise.
