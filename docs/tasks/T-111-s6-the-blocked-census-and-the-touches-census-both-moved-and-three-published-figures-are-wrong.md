---
id: T-111-s6
title: Three published figures about blocked_by and touches: are wrong at 15a963d — the stale-blocker census is 48 not 46, 41 entries survive the clearing, and T-111-s3's vocabulary arithmetic has grown a whole collision family
status: suggested
suggested_by: executor claude-opus-5 @T-111
---

**Every figure below was re-derived on disk at the ref it names.** Nothing
here is a defect in anybody's reasoning; the arguments all hold. What has
moved is arithmetic, and arithmetic is a function of a tree.

## ONE — the stale-blocker census is 48 at `f9350b1`, not 46

`T-111-s4` and the dispatch commit `15a963d` both state **46 stale blocker
entries repo-wide**, measured at `f9350b1`. **Walked at that same ref, over
`docs/tasks/` and `docs/tasks/rejected/` together, it is 48.**

**THE TWO MISSING ARE T-111's OWN AND T-134's OWN** — `T-111 <- T-110` and
`T-134 <- T-132`, the two the same commit's message narrates clearing as
*dispatch* rather than counting as *census*. Every other figure
reconciles exactly once those two are added back, which is what makes the
explanation an explanation rather than a guess:

| at `f9350b1` | on disk |
|---|---|
| `blocked_by` entries repo-wide | **51** |
| stale (blocker is `done`) | **48** |
| dangling (blocker names no card) | **0** |
| still binding | **3** |
| cards blocked on paper, dispatchable in fact | **6** |

**The card's table names FOUR of those six** (`T-131`, `T-015`, `T-059`,
`T-065`). The other two are `T-111` and `T-134`. `48 − 5 cleared entries =
43`… and the four cards carried **7** stale entries between them, not 5:
`T-065` carries two. **`51 − 7 = 44`, which is exactly the entry count on
disk at `15a963d`.**

## TWO — at `15a963d` the answer is ZERO, and only for one of three questions

The dispatch brief for this lane says *"the number you re-derive should now
be zero — and if it is not, that is news."* **Three different numbers
answer to that sentence and they are 0, 3 and 41.** Derived at `15a963d`,
this lane's base:

| quantity | `f9350b1` | `15a963d` |
|---|---|---|
| `blocked_by` entries repo-wide | 51 | **44** |
| stale entries (blocker `done`) | 48 | **41** |
| stale entries on cards that are not `done` | 10 | **3** |
| **cards blocked on paper, dispatchable in fact** | 6 | **0** |
| dangling blockers | 0 | **0** |

**ZERO is right for the question that matters** — no planned card is
suppressed by a blocker that has landed. **41 stale entries survive**, 38
of them on `done` cards where `T-111-s4` correctly calls them harmless
history, and **THREE on PLANNED cards**: `T-067 <- T-062`, `T-067 <-
T-058`, `T-068 <- T-057`, all three blockers `done`.

**Those three suppress nothing**, and that is why the clearing pass did not
find them: both cards are still genuinely blocked by `T-065`, which is
`planned`. So `T-111-s4`'s *"four sit on PLANNED cards, where they suppress
dispatch"* is right about suppression and short about population — **six
planned cards carried stale entries, four of them suppressed.**

**AND THIS IS THE ARGUMENT FOR DERIVING RATHER THAN CLEARING, MADE BY THE
CLEARING PASS ITSELF.** A hand pass finds the entries that change an
answer today and leaves the ones that do not — correctly, because clearing
them is churn. So the field does not decay to a stable wrong value; it
decays to a value that is right about the cards somebody checked last and
wrong about the rest, with no way to tell which is which by reading it.
`selectDispositions` never asks.

## THREE — `T-111-s3`'s vocabulary census has grown a whole collision family

`T-111-s3` censused **124 cards carrying `touches:`, 19 distinct raw
tokens** at `e04f5b3`. At `15a963d` it is **142 cards and 26 tokens**, and
the difference is not scale — it is a NEW KIND of token:

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
`method/` (9 cards) contains all five `method/<file>` tokens; `docs`
(1 card, `T-054`) contains `docs/CONVENTIONS.md` (21),
`docs/architecture/components/` (8) and the three `docs/tasks/T-*.md`.
**That is CONTAINMENT, and s3's prescribed trailing-slash minimum reaches
none of it** — its own census had a single containment case and called it
one of four; on this board it is the dominant one.

**T-111's implementation answers it**: `touchTokensOverlap` is
normalisation PLUS separator-anchored containment, so `method/` and
`method/lane-protocol.md` overlap and `app/src` and `app/src-tauri` do not.
The remaining hole is s3's fourth, unchanged and unclosable by any string
rule: **`ci` (1 card) against `.github/` (4)**. It is pinned AS
known-wrong rather than left silent.

**AND THE UPSTREAM REPAIR IS DOUBLY OUT OF REACH RIGHT NOW.** s3 routes it
to the parser — *"a `touches:` token that resolves to neither a slug nor
an existing path is a parser-level issue kind (C-06, `lib-parser`)"* —
and `lib-parser` is held live by `T-134`, whose own subject is that a
fence names paths and a slug is shorthand. **Read this beside that card
rather than before it.**

## FOUR — one figure this lane could not check

`T-111-s3` states *"`ci` … is not a path (nothing at the repository root is
named `ci`)"*. **A board derivation has no filesystem**, so
`expandTouch` classifies any token resolving to no component slug as a
literal path and cannot tell `ci` from a real one. The claim is still true
on disk; it is simply not a claim the frontier is able to make, and the
doc comment says so rather than implying otherwise.
