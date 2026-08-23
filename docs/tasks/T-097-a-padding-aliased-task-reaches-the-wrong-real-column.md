---
id: T-097
title: A padding-aliased task does not reach `unmapped` — it reaches the WRONG REAL COLUMN, and no test on the board side has ever driven the case
feature: F-02
milestone: 4
priority: 53
size: S
status: planned
blocked_by: []
touches: [app-board]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-076-s2 (sixth triage, 2026-08-20). That file is removed in
this commit.

**The board repairs one roadmap defect and not its sibling, and nothing
says so.** `selectBoard` keys its columns on the EXACT feature id string
and skips a repeat — *"duplicate backbone id: first wins, issue already
flagged"* in `app/src/lib/board-model.ts`, verified live at `4d2f03c` —
so the two defects the parser reports land in opposite places:

- **An exact duplicate (`F-01` twice) collapses to ONE column.** The
  first declaration wins, the second bullet's name and description are
  discarded. The parser reports it; **the board repairs it.**
- **A padding alias (`F-1` beside `F-01`) renders TWO columns.** Task
  routing is an exact-string `byFeature.get(task.feature)` falling back
  to `unmapped`, so a mis-padded task **does not even reach `unmapped`
  — it reaches the WRONG REAL COLUMN**, the one whose id string happens
  to match its own spelling. The parser reports it; **the board does
  not repair it.**

**The asymmetry is silent in the direction that matters.** An unmapped
task is visibly homeless; a task in the wrong column looks exactly like
a task in the right one. A human reading the board sees a plausible
placement and has no reason to doubt it, and the only signal that
anything is wrong is an advisory `aliased-id` issue in a different part
of the screen.

**Nothing normalises on the app side and nothing pins the case.**
Verified at `4d2f03c`: `git grep idSlotKey -- app/src` returns nothing —
there is no slot normalisation anywhere in the app — and
`app/test/select-board.test.ts` carries **no `F-1`-beside-`F-01` case at
all**. That is defensible as a design — a parser flags and a renderer
renders — but it is currently undocumented, and the `aliased-id`
message asserts the split-column harm as a FACT while nothing pins it on
the side where the harm happens.

**Related to but distinct from the rendering question.** T-077's family
is about what the app SHOWS about these issues; this is about what it
DOES with them.

## Acceptance criteria

- **THE BEHAVIOUR SHALL BE PINNED BEFORE IT IS DECIDED**: one body in
  `app/test/select-board.test.ts` driving `F-1` beside `F-01` with a
  task on each spelling, asserting the column set AND which column each
  task lands in. Whatever the ruling below, that body is the thing that
  makes the next change visible.
- **THE RULING SHALL BE WRITTEN, not implied**: either `selectBoard`
  routes by SLOT once the parser has reported an alias — repairing both
  defects rather than one — or it does not, and the reason sits at
  `selectBoard` beside the duplicate-id skip that already carries one.
- IF slot routing is taken THEN the two columns SHALL still render as
  two (the roadmap declares two bullets and the board tells the whole
  truth, T-017), and the card SHALL state which column a mis-padded task
  routes to and why — collapsing the task into the canonical slot while
  leaving both columns visible is a choice a reader must be able to
  find.
- IF slot routing is refused THEN the `aliased-id` message SHALL stop
  asserting a board consequence it does not produce, OR the board SHALL
  make the misrouting visible where it happens — an advisory issue three
  panes away is not the same claim.
- **THE PIN SHALL DISCRIMINATE THE WRONG-COLUMN CASE FROM THE UNMAPPED
  CASE.** A body that only asserts "the task is not in `unmapped`" is
  satisfied by the defect; assert the column identity.
- THE parser side SHALL NOT be touched by this card — `aliased-id` is
  reported correctly today, and a rule with two implementations is two
  chances to disagree (T-057).

Verification: headless — `npm test` and `npm run build` from app/ with
counts and exits stated, plus the POISON DRILL on the new body: mutate
the ROUTING (one side only — the producer, never the assertion), read
the mutated text back with `git diff` before running, require the RED,
restore and prove the restoration by sha256 against the drill's own
commit. Then T-092's shape-six check: name a mutation the new body
kills, run the whole app suite under it, require a failing-body count of
ONE. @human: none — the case is diagnostic, and the question "is a
mis-padded task better shown misplaced or shown homeless" is answered by
the ruling above rather than by looking.
