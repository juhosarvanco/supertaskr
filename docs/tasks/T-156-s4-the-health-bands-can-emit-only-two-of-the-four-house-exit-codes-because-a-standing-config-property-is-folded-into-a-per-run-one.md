---
id: T-156-s4
title: The health bands can emit only two of the four house exit codes, because a standing property of the config is folded into a per-run one
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-156
---

**MEASURED AT `2aef3d8`, THREE WAYS, AND IT IS SHARPER THAN "EXIT 3 IS
PERMANENT".** `npm run health` adopts the house four-code contract in
`health-bands.mjs`'s own `EXIT` legend — 0 clean, 1 found, 2 called
wrong, 3 could not run — and in the shipped configuration **two of those
four cannot occur**:

| what was true of the run | exit |
|---|---|
| default run, three bands unread, nothing breached | **3** |
| every readable band fed through `--readings`, `unread` down to **0** | **3** |
| a real band breached (`docs/STATE.md`'s budget poisoned below its landed size) | **3** |

`EXIT.CLEAN` and `EXIT.FOUND` are unreachable while any band carries
`authority.kind: "none"`, and four do. The information is not lost —
the breach is printed, the unkept bands are named on every run — but the
exit code carries none of it, and an exit code that never moves is one a
reader stops reading. T-156's own executor named this as the design
decision most worth attacking, and its verifier agreed the criteria do
not forbid it: criterion 2 says only *"IF a metric's authority cannot be
read THEN the script SHALL say so at exit 3, never report the band as
holding"*, and that property holds exactly, mutant included.

## The distinction neither seat has yet drawn

**`unread` is a property of a RUN. `unkept` is a property of the
CONFIG.** They are different facts and today they cost the same code.

- An **unread** band has an authority that exists and was not read *this
  time*. It clears by feeding `--readings` — measured above, 3 → 0. It
  is genuinely "this run is not a claim about the tree", which is the
  house meaning of code 3, and criterion 2 is about exactly this case.
- An **unkept** band has no authority at all. Nothing about a RUN
  changes it; `--list` reports it without running anything; it is the
  same on every ref until a card lands. Folding it into a per-run
  "could not run" is what pins the code to 3 forever.

So the question this card asks is narrow: **should a standing config
debt cost a per-run exit code?** Three answers are open and the point is
that somebody decides in writing rather than inheriting the current one
by default.

1. **Keep it.** The argument is `docs/NORTH_STAR.md`'s bar — *"a
   known-vacuous keeper is a stop-the-line defect"* — and it is a real
   argument: making the run green while three of the constitution's own
   indicators have never been derived is how they stayed invisible since
   2026-08-14. If this is the answer, say so in the script header where
   the exit contract is legended, so the next reader inherits a decision
   instead of a shrug.
2. **Split the code from the debt.** Unread costs 3 (criterion 2's own
   case); unkept is reported just as loudly, named on every run, and
   costs nothing. The command then answers 0/1/3 and its code means
   something again — and the unkept bands stay exactly as visible,
   because the report is what makes them visible, not the exit status.
   Costs a spec change: *"a band with no keeper at all is UNKEPT, is
   named on every run, and costs the run exit 3"* pins the present
   behaviour by name.
3. **A distinct code.** The house reserves **2** for `usage` and the
   token lint's own legend explains why a gate prefers 3 over 2 for
   "could not run"; a fifth meaning would need minting where the other
   three gates can see it, which is a bigger change than either above.

## Why this is routed and not assigned

The verifier judged T-156 APPROVED on this point: the acceptance
criteria are met, the choice is argued in the script header, and
`T-156-s1` (checkpoint readings for the three readings bands) and
`T-156-s2` (keepers for the constitution's three indicators) are the
cards that move the state on their own. **This card is the third thing
neither of those covers** — the shape of the exit contract itself, which
stays a live question even after both land, because `machinery/gate-`
`gate-seconds` and any future declared-but-unkept band re-create it.
Do not fold it into either: s1 and s2 supply keepers, this one asks what
a missing keeper should cost.

## Not to be confused with

The repository's standing precedent against a permanently non-zero
signal — the AUDIT GATE POLICY's refusal of `--deny warnings` *"for no
actionable signal"*, and the DOCS GATE's *"a gate that says run
everything on any `docs/**` is ignored within a week"* — is about GATES
that stop a lane. `npm run health` gates nothing, is in no workflow, and
has the reporter disposition `arch` and `index --watch` already have.
The precedent is suggestive here, not binding, and reading it as binding
would decide this card by quotation instead of by argument.

## How to re-derive

    cd tools/e2e
    npm run health                                  # 3
    npm run health -- --readings <captured runs>    # 3, unread now 0
    # poison one DOC_BUDGETS warn line below the file's size, then:
    npm run health                                  # 3, with a BREACH printed
