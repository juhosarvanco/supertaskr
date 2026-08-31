---
id: T-189
title: Self-integration and the 3–5 concurrent ceiling are incompatible and neither rule mentions the other — every S lane is told to merge AND checkpoint itself, and four of them would collide on `docs/STATE.md`
feature: F-01
milestone: 4
priority: 3
size: S
status: building
blocked_by: []
touches: [method/, docs/CONVENTIONS.md]
suggested_by: "architect/integrator seat, 2026-08-31 — reported by T-182's executor, which obeyed a dispatch prompt that contradicted its own derived brief and flagged the conflict rather than silently picking one"
builder: claude-opus-5@subagent
review:
---

**FOUND BY A LANE THAT WAS TOLD TWO DIFFERENT THINGS AND SAID SO.**
`T-182`'s executor reported: *"the brief's ROW 11 says an
S/diff-outside-shipped-code executor self-integrates (merges,
checkpoints, removes its own worktree). Your prompt says do not merge or
push. I obeyed your prompt and flag the conflict."* That is the correct
handling and it surfaced a gap in the method rather than in the lane.

## The two rules, both live, neither aware of the other

- **`method/roles/orchestrator.md:41`** — *"Ceiling: 3–5 concurrent."*
  Concurrency is not an accident here; it is the planned operating mode.
- **`method/lane-protocol.md`** — *"a size-S card has no separate
  integrator, so its executor plays integrator for its OWN work once its
  tests pass — **it merges, checkpoints and removes its own worktree**."*

**At the ceiling, the second rule tells up to five agents to merge into
one branch and write a checkpoint each, concurrently.**

## What actually collides, and it is worse than the merge

The merge race is the obvious half and the least of it. **The checkpoint
half cannot work at all under concurrency:**

- `method/docs-protocol.md` rule 4 requires `docs/STATE.md` to be
  regenerated **in the same commit as the record**. Five lanes writing
  five records means five regenerations of one file — a file that also
  carries a **byte band** and a **staleness gate**.
- The DOCS GATE's own check — *"`docs/STATE.md` is STALE against N newer
  checkpoint record(s)"* — would fire for whichever lanes lost the race,
  reporting a defect that is really a scheduling artefact.
- `docs/STATE.md`'s band has roughly one ordinary merge of headroom
  (`T-162-s1` derived `F` = 2 053 bytes for exactly this reason). Five
  concurrent editors of a document with one merge of slack is not a
  contention problem, it is a guaranteed breach.

So the rules are not merely awkward together; **the smallest ceremony
tier's own procedure is undefined at the operating mode the orchestrator
prescribes.**

## THE FILE ALREADY LEARNED THIS EXACT LESSON ABOUT ITSELF

`method/lane-protocol.md` carries, a few lines above the self-integration
rule:

> **THIS RULE SAID "THE EXECUTOR" UNTIL THE SEAT IT NEVER NAMED BROKE IT
> TWICE IN ONE SESSION.** `architect` appeared nowhere in this file …
> **A prohibition that enumerates seats grows a hole for every seat added
> after it.**

**This is that finding, one axis over.** The rule enumerates the
single-lane case and grows a hole for the concurrent one. The remedy that
worked there — state the COMPLEMENT rather than the enumeration — is the
first thing to try here.

## What the dispatching seat did, and why it is not the fix

This seat's dispatch prompts said *"Do NOT merge, do NOT push, do NOT
touch main"* to all five lanes. **That is almost certainly the right
behaviour and it was still a defect**, because it overrode a derived
contract from memory and did so silently — four times — until a lane
caught it. It is the same failure family `docs/STATE.md` item 7 already
names: *what a dispatcher writes from memory is the half that is wrong.*
**The remedy is to make the contract say it, not to keep saying it in
prompts.**

## What a fix decides

1. **Whether self-integration is conditioned on solitude.** The likely
   shape: an S card self-integrates **when it is the only live lane**,
   and otherwise hands the merge to whoever holds the integrator seat.
   State it as a condition on the world, not as a list of seats.
2. **Whether the CHECKPOINT half separates from the MERGE half.** They
   are bundled in one sentence and they have different collision
   profiles: merges to one branch serialise badly but survive; five
   regenerations of one banded document do not. **A lane may well be able
   to merge and still owe its record to a batched checkpoint** — decide
   it, do not assume it.
3. **Where the rule lives.** `lane-protocol.md` states it and
   `TASK-FORMAT.md` states the ceremony table; the derived ROW 11 in
   `executor.md` reads both. Whatever changes must keep those three
   agreeing, and the fix SHALL NOT introduce a fourth statement of it
   (`T-057`).

## Acceptance criteria

- THE self-integration rule SHALL state what an S lane does when other
  lanes are live, and SHALL do so as a condition rather than as an
  enumeration of cases.
- THE merge half and the checkpoint half SHALL be addressed separately,
  or the card SHALL say why one answer covers both.
- WHERE a dispatcher must override the ceremony row, the override SHALL
  have a written home, so that stating it in a prompt is repeating the
  contract rather than contradicting it.
- THE derived ROW 11 in `method/roles/executor.md` SHALL still produce a
  correct answer after the change, and a body SHALL prove it for the
  concurrent case specifically — **the case that has no answer today**.
- Verification: headless, the `tools/e2e` suite.

## Read beside

`method/lane-protocol.md` (the rule, and its own prior lesson about
enumeration), `method/roles/orchestrator.md:41` (the ceiling), and
`T-187` (the other place where a rule correct for one lane at a time is
silently wrong once the board moves underneath it).
