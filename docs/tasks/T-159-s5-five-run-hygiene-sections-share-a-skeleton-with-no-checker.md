---
id: T-159-s5
title: The five per-seat run-hygiene sections share a four-sentence skeleton written five times, and the release that argued redundancy is safe only with a checker shipped this copy without one
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-159
touches: [tools/method-evals/]
---

**CLASS PARENT: `T-157-s1`** (the per-seat run-hygiene text and the
advisory line that cites it). That card owns the TEXT and its locator
word; this owns the only thing the text is now missing.

**DISPOSITION HINT: promote as size S onto the eval suite — it is one
arm on an eval that already reads all five role files (`MF-03`'s corpus
loop), not a new eval.** It is NOT a defect in T-159 and did not block
its approval; it is that release's own argument applied to that
release's own diff.

## The finding

`method/roles/{executor,verifier,integrator,orchestrator,planner}.md`
each gained a `## Run hygiene` section at `6b37f57`. Measured there:
573, 711, 980, 765 and 829 bytes. Four sentences are common to all five
in near-identical wording — the dial set at session start, noisy jobs in
a subagent, quiet flags with the COUNT read as well as the exit, and the
closing sentence making the section the authority over any advisory line
a project's tooling prints.

The per-seat differences are real and are the reason the sections are
five rather than one: the two STANDING seats are told to compact between
dispatches and the planner is told the opposite, with its own reason,
and the verifier's subagent clause is a blindness constraint that exists
in no other seat. **The differences are not the problem. The shared
skeleton is**, and nothing reads it.

## Why this is the release's own argument

`method/tasks/TASK-FORMAT.md` gained, in the same commit:

> Redundancy with a checker is one fact checked twice; redundancy
> without one is what this paragraph would otherwise be an example of.

That paragraph is about the status vocabulary, which HAS a checker —
`MF-05` — and this verification exercised it twice, at exit 1 both times.
The four shared sentences have no equivalent. They are one rule with five
implementations, which is this repository's own `T-057` class, and the
first divergence will be a reflow nobody notices in the seat nobody
dispatched that week.

## Why it is cheap

`MF-03` already walks `method/roles/*.md` as a corpus and already has a
per-file coverage arm, so the shape is an added assertion rather than a
new module: require every role file to carry a heading containing the
locator word (which `hygieneSection()` in
`tools/e2e/scripts/session-economics.mjs` already depends on and which
`T-157-s1` names as a silent seam), and require the shared sentences to
be BYTE-IDENTICAL across the five while requiring at least one clause
per file that is not.

## One caution for whoever takes it

**Do not assert the whole section equal** — that is the mutation that
would delete the per-seat differences the sections exist for, and it
would pass. The floor is on the SHARED half and the discrimination is on
the per-seat half; an eval that cannot tell those apart is worse than
none, and it owes the positive control the suite's `--selftest` arm
already requires of every member.
