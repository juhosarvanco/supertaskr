---
id: T-293-s5
title: "The root adapter now tells EVERY seat that everything else reaches it through its brief's context pack, and three of the five role files have no brief type at all — the orchestrator, the integrator and the planner get STATE plus the index and nothing else"
feature: F-01
milestone: 4
size: M
priority: 2
status: parked
wake: T-292
suggested_by: "verifier claude-opus-5@subagent @T-293 (phase 2), measured at 6d904bf72ca0dc57cd674c419c898b7f3f8f293c"
blocked_by: []
touches: [app/src-tauri/src/dispatch/brief.rs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-293's new adapter paragraph reads *"Everything else reaches a seat
through its brief's CONTEXT PACK, which carries the rules that seat's own
fence implicates."* That sentence is addressed to every seat. Derive who
can actually receive one:

    grep -n "pub enum Role" -A 6 app/src-tauri/src/dispatch/brief.rs
    ls method/roles/

The enum holds `Executor` and `Verifier`. `method/roles/` holds five role
files: executor, verifier, orchestrator, integrator and planner. So three
of the five seats have no brief type, therefore no row 3, therefore no
pack — and after this card their whole standing read is STATE plus the
index. Before it, the adapter's own five-document order was what stood in
for a pack they never had.

`packRecs` in `tools/e2e/scripts/dispatch-brief.mjs` is NOT role-gated —
it reads `method/roles/<role>.md` for whatever role it is given — so the
machinery is not what blocks this; the absent brief type is.

**AND A PACKLESS BRIEF IS ALREADY A NAMED FAULT.** `method/roles/
verifier.md` step 0 rules that *a brief carrying no pack at all is a
dispatch fault* and tells that seat to read the document whole and say so
in its verdict. Measured on this very verification: the phase-2 brief was
hand-written and carried no pack, so the fault is reachable for a seat the
enum DOES cover, not only for the three it does not.

**THIS IS THE HALF THAT MAKES THE SIBLING FINDING SAFE TO FIX.** The three
role files that still re-list `docs/ARCHITECTURE.md` and
`docs/CONVENTIONS.md` inline are exactly the three seats with no pack.
Striking those names out without giving those seats a route would leave
them strictly thinner than they are today.

## Acceptance criteria

- WHEN a seat whose role file exists is dispatched THE brief SHALL be
  assemblable for it, or the adapter's sentence SHALL name which seats the
  pack reaches rather than saying "a seat".
- WHEN a brief is assembled with no pack THE brief SHALL say so on its own
  face, so the dispatch fault is visible to the seat reading it rather than
  only to a seat that knows the rule.
- A body SHALL red when a role file exists that the brief cannot be built
  for — the set is DERIVED from `method/roles/` rather than transcribed.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-292; three of the five role files have no brief type, which the pack module's carve is the place to add.
