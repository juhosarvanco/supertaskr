---
id: T-173
title: The interview opens with a free write-up and the planner drafts the answers — @human's ruled UX direction for the whole Q1–Q7 flow
feature: F-03
milestone: 4
priority: 3
size: L
status: planned
blocked_by: []
suggested_by: "@human's genesis walk debrief (2026-08-30) — a direction statement, near-verbatim below"
touches: [app-interview, method/interview/plan-interview.md, docs/CONVENTIONS.md, app-agent]
builder:
verifier:
built_by:
verified_by:
review:
---

**@HUMAN'S DIRECTION, near-verbatim:** *"I would like nputer to work
so that the user can just freely write about their idea in the first
question and then the planner starts the Q1–Q7 process and gives
readymade suggested answers or asks more questions about every stage
to help the user crystalize the vision. So the AI should help form
the answers, and there should be the option to answer with own words
like it works right now."*

Unpacked into the three behaviours the sentence orders:

1. **Free-form intake first.** The interview opens by inviting the
   person to write about their idea in their own shape — a paragraph
   or a page — before any numbered question. Today Q1 arrives already
   framed (person/scene/workaround) and the human must translate
   their idea into the method's grammar themselves; at the walk, the
   integration seat drafted all seven answers for @human by hand,
   which is this feature performed manually.
2. **The planner drafts, stage by stage.** From the write-up, the
   planner runs Q1–Q7 as today — one at a time, banked on confirm —
   but at each stage it EITHER offers a ready-made suggested answer
   derived from the write-up (accept / edit / replace) OR asks the
   follow-up that would let it draft one. The challenge treatment
   (push back on vague answers) stays; it applies to its own drafts
   too.
3. **Own words always.** The current mode — type the answer yourself
   — remains fully available at every stage. The suggestion is an
   offer, never a gate. The `[?]`-assumption marking ("skip") also
   stays and composes: a skip banks the planner's draft marked `[?]`.

## What the card must settle before building

- WHERE the drafts come from mechanically: the write-up is banked to
  disk (it is the richest single input the project will ever get —
  losing it to context would be the T-089 class) and every stage's
  draft cites it.
- HOW a suggested answer renders (prefilled editable input vs a chip
  row vs a quoted block with accept/edit) — a design question that
  reaches the customization-form room's FORM-FIRST condition if it
  grows UI machinery.
- `method/interview/plan-interview.md` changes (the sequence gains
  the intake stage) — a method file, so the bump question is
  TRIAGE'S, decided on this card at promotion, not the lane's.

## TRIAGE (2026-08-30, standing triage sitting #4) — PROMOTED F-03 p3 at size L, with the fence the card's own method half forces

**THE CARD SAYS THE BUMP QUESTION IS TRIAGE'S. IT IS RULED HERE: A BUMP
IS OWED, AND IT COSTS MORE THAN THE CARD EXPECTED.** Derived at
`b60b06d`:

1. `git grep -h 'rel: "' app/src-tauri/src/agent/kit.rs` lists
   `interview/plan-interview.md`. **Test 1, SHIPPED BYTES: YES.** Adding
   an intake stage edits shipped bytes, so the three-file bump applies
   and the eval block is owed in the commit message (METHOD EVAL GATE).
2. **AND THE STAGE TABLE IS TRANSCRIBED INTO TYPESCRIPT AND ASSERTED
   CELL BY CELL.** `BANKING_MAP` at
   `app/src/genesis/genesis-derive.ts:40` is a verbatim copy of that
   table, and `every_cell_of_the_9_row_table_matches_plan_interview_md_verbatim`
   in `app/test/genesis-derive.test.ts` reds on ANY change to ANY cell.
   `genesis-derive.ts` is `C-13`'s, so `app-interview` carries it —
   which is why the fence above reads as it does and why the size is L
   rather than M.

**THE PRACTICAL READING FOR THE LANE**: a stage added to the interview
is not an interview change, it is a method release. The fence carries
the CONVENTIONS stamp, `method/interview`, and `app-agent` for
`METHOD_SNAPSHOT_VERSION` in `kit.rs` — the canonical three — plus
`app-interview` for the table's second implementation.

**FORM-FIRST APPLIES AND IS NOT DISCHARGED HERE.** The card's own second
settle-item (how a suggested answer renders) reaches
`docs/rooms/customization-form.md`'s standing condition if it grows UI
machinery. The sitting does not rule it: a prefilled editable input is
the shape that adds no machinery, and anything beyond that goes to the
room before it is designed.

**DISPATCH IS BLOCKED ON @human's `T-140-s4` RULING, NOT ON THIS CARD.**
The graph sits at **410 bytes** of headroom at `b60b06d`
(`wc -c docs/architecture/graph.json` = 1,039,590 against the crate's
1,040,000 budget), and this card's fence reaches indexed source. The
sitting records the block rather than lowering the priority.
