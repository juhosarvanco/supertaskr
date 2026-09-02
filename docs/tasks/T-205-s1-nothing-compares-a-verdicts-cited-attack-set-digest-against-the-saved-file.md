---
id: T-205-s1
title: MF-09 proves the digest comparison refuses, and nothing RUNS it against a real verdict — the saved attack set lives in a scratchpad no gate may walk, so the last step of T-205's chain is a hand step
feature: F-06
milestone: 4
size: M
priority: 4
status: planned
suggested_by: executor claude-opus-5@subagent @T-205
blocked_by: []
touches: [tools/method-evals]
builder:
verifier:
built_by:
verified_by:
review:
---

**WHAT T-205 BUILT, SO THIS CARD IS SCOPED TO WHAT IT DID NOT.**
`method/roles/orchestrator.md` 5d requires phase 1's return to be saved
and hashed before phase 2 is spawned and phase 2's verdict to cite the
digest, and it REFUSES a verdict whose citation does not match.
`tools/method-evals/evals/mf-09-attack-set-digest-refusal.mjs` holds
that refusal and demonstrates it: a five-row matrix (match, mismatch,
missing file, absent citation, truncated prefix) run against the
comparison, and a positive control that runs the SAME matrix against
three implementations lacking the property — a presence check, a prefix
compare, and a fail-open missing-file branch — requiring each to be
caught. **So the comparison is proved. Nothing invokes it.**

## The gap, stated precisely

**THE SAVED FILE IS NOT IN THE TREE.** `docs/CONVENTIONS.md`'s bench
bullet puts phase 1's return in the session scratchpad under the SCRATCH
RULE, so an eval that walked to it would be reading a MACHINE-scoped
surface — the class `method/lane-protocol.md` rule 4 rules on, and the
one it says to DERIVE from the lane rather than default. A repository
gate therefore cannot find the artifact a verdict cites, and the last
link in T-205's chain — *this verdict, against this file* — is run by
hand or not at all.

## The design question this card must answer first

Three shapes, and the card should pick with reasons rather than inherit
one:

1. **A checker the verifier and the integrator RUN**, taking the card
   and re-deriving the digest from the file the verdict names. Cheapest;
   catches an edited attack set; catches nothing if nobody runs it, and
   *nobody runs it* is exactly what T-205 was written about.
2. **The attack set committed beside the verdict**, which makes the
   digest checkable from the tree alone. Costs bytes in a byte-banded
   corpus, and puts an attack set where a later executor can read it —
   `roles/orchestrator.md` 5c says THE ATTACK SET NEVER REACHES THE
   EXECUTOR, and after the verdict is a different question than before
   it, which this card has to answer rather than assume.
3. **A gate at the landing**, where the card and the run's own capture
   are both in hand — the shape `gate-run`'s verdict token already uses.

## Acceptance criteria

- THE check SHALL be INVOKED by something other than a seat remembering
  to invoke it, and the card SHALL name what invokes it.
- A VERDICT citing a digest that does not match the file it names SHALL
  cause a non-zero exit at that invocation point, before the verdict is
  treated as a verdict.
- A MISSING or unreadable saved file SHALL be a refusal, never a skip.
- WHERE the artifact stays outside the tree, the card SHALL say how the
  invocation reaches it WITHOUT defaulting a machine-scoped path
  (`method/lane-protocol.md` rule 4).
- MF-09's matrix SHALL be REUSED rather than restated (`T-057`).

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 4, at the T-225-s2 merge (6691fc5)

The architect seat. The digest checker MF-09 proves needs an invoker over a real verdict; one method-evals lane after T-205-s4.
