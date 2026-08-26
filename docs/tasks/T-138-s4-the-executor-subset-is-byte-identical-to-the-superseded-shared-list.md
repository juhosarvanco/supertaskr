---
id: T-138-s4
title: The executor's read-first subset is byte-for-byte the superseded shared list, so it may be a stale copy rather than a deliberate narrowing — recorded, deliberately not acted on
status: suggested
suggested_by: executor claude-opus-5 @T-138
touches: [method/roles/executor.md]
---

**RECORDED AND NOT TAKEN, ON PURPOSE — AND THE HEADLINE IS ALREADY ON
MAIN.** `db4c903` says it: *"executor.md:5 omits ROADMAP exactly as the
adapter did before today… Flagged rather than fixed, because an executor
reading its own card and fence may genuinely not need the product roadmap,
and that is a judgement rather than an oversight."* @human's ruling there
is *"keep the reading list the same for now."*

**SO THIS CARD CLAIMS NO NOVELTY.** It adds two things that commit does
not carry — the byte-identity evidence below, and where the file collides
— and exists so they are not re-derived. T-138 was narrowed on the same
ruling and re-cut no seat's list.

## The measurement, at `00e133a`

```
method/roles/executor.md:5      docs/STATE.md, docs/ARCHITECTURE.md, docs/CONVENTIONS.md
method/adapters/AGENTS.md:8     docs/STATE.md, docs/ARCHITECTURE.md, docs/CONVENTIONS.md
method/adapters/CLAUDE.md:8     docs/STATE.md, docs/ARCHITECTURE.md, docs/CONVENTIONS.md
CLAUDE.md / AGENTS.md (root)    docs/STATE.md, docs/ROADMAP.md, docs/ARCHITECTURE.md, docs/CONVENTIONS.md
```

**The executor's three are byte-for-byte the shared list as it stood
before `6a6bc87`, and byte-for-byte what the un-updated template still
says today.** Three identical copies of the old set survive; the root
pair moved on 2026-08-26 and nothing else did.

## Why that is a question and not a defect

**`executor.md` step 1 is the ONLY reading list in any role file at
`00e133a`**, and at `db4c903` it is one of two — the other being
`orchestrator.md`, which @human had just re-given the full set. The
verifier, the integrator and the planner have no reading step at all;
their step 1 is an action. So the executor's list is not one narrowing
among four. **It is the single place in the method where a second copy of
the read-first set exists, which is a T-057 instance by construction.**

**And its omission of ROADMAP has no stated reason anywhere**, while its
members are exactly the previous version of the superset. That is
consistent with a deliberate narrowing and equally consistent with a copy
nobody updated. **A subset whose members are the previous version of the
superset is not evidence that it was chosen.** `db4c903` reaches the same
place from the other direction and leaves it open on purpose.

## What this card is asking for, and it is small

**One sentence, either way, in `method/roles/executor.md` step 1.** If the
narrowing is deliberate, say what an executor does not need ROADMAP for —
and the answer may well be good: an executor builds to acceptance criteria
in a card, and *what the product does for a user* is the dispatching
seat's question, not the building seat's. If it is a stale copy, it moves
with the adapter.

**Either outcome is cheap. Only the silence is expensive**, because the
next session to notice the byte-identity will re-derive all of this from
scratch, exactly as this one did.

**WHOEVER TAKES IT SHOULD KNOW WHERE IT COLLIDES.** `method/roles/executor.md`
is `overlapping` with `[method/, docs/CONVENTIONS.md]`, held by `T-105`,
`T-128` and `T-131` — measured through `lib/parser`'s `fence.ts` at
`00e133a`, witnesses `method/roles/executor.md` and
`method/roles/orchestrator.md`. It composes with any of the three.
