---
id: T-155-s4
title: The executor is told to read a document its own role file subtracts by name
status: suggested
suggested_by: executor claude-opus-5 @T-155
---

Two files in the read-first path give an executor opposite instructions
about docs/ROADMAP.md, and the assembled brief carries the losing one.

- `method/roles/executor.md` step 1: *"**You do NOT read
  docs/ROADMAP.md, and that is a deliberate subtraction rather than an
  oversight**"*, with the argument — which card deserved building is the
  orchestrator's question, already settled before dispatch.
- The root adapters name it anyway. `brief.mjs --task` row 3 prints
  `AGENTS.md names:` and `CLAUDE.md names:`, each listing
  docs/ROADMAP.md, because row 3's own source column says the read-first
  set comes from *"the project's OWN root adapter file"*.

So every EXECUTOR brief this repository assembles instructs the session
to read a document its role file forbids in the same brief, four rows
apart. Derive it: `node tools/e2e/scripts/brief.mjs --task <any card>`
and read rows 2 and 3 together.

**NEITHER SIDE IS OBVIOUSLY WRONG, WHICH IS WHY THIS IS A ROOM AND NOT A
FIX.** The adapter's list is addressed to every session in the project
and is correct for four of the five seats; the role file's subtraction is
addressed to one seat and is argued. The missing thing is a PRECEDENCE
RULE, which the brief contract already demands in general terms — *"where
two copies of one fact diverge, the brief names WHICH is authoritative —
the field's home file for what a thing IS, the acting role's file for who
DOES it"*. Reading a document is something a seat DOES, so the role file
should win; but row 3 has no clause saying so, and a reader who applies
the general rule is reasoning past a row that states the opposite.

**THREE SHAPES THE FIX COULD TAKE**, all outside T-155's fence
(`[tools/method-evals, docs/CONVENTIONS.md]`), which is why nothing was
changed: row 3's own column three gains a per-role subtraction clause;
the adapter template marks ROADMAP as read by every seat EXCEPT the
executor; or `brief.mjs` subtracts, per role, when it assembles row 3 —
the last being the only one with a mechanical reader, and therefore the
only one that cannot go stale.

**IT IS ALSO EVAL FODDER, AND OF THE MOST VALUABLE KIND.** The class is a
brief that is internally inconsistent while every row is individually
faithful to its source. `MF-01` in `tools/method-evals/` assembles a
brief and requires every row to be DERIVED; it cannot yet ask whether two
derived rows CONTRADICT each other. That is a corpus growth step with a
worked instance already in hand.
