---
id: T-283-s5
title: "MF-04 reds when a cross-file pointer's PATH rots and MF-02 stays silent when its ORDINAL does — `roles/verifier.md` step 6 renamed to step 9 leaves the method eval gate at exit 0, so the half of a pointer that carries the meaning is unguarded"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-283 phase 2, 2026-09-09, drilled on a shared clone of the bench at the tip afd454b"
blocked_by: []
touches: [tools/method-evals/evals]
builder:
verifier:
built_by:
verified_by:
review:
---

## What was measured

T-283 states its rule ONCE, in `roles/executor.md` step 5, and the other
two files reach it by pointer — lane-protocol.md cites "the further
limits `roles/executor.md` step 5 sets" and "graded as part of the diff
by `roles/verifier.md` step 6", and verifier.md cites "`roles/executor.md`
step 5's". That shape is the method's own preference over a second copy,
and it makes the pointer load-bearing: if the ordinal rots, the reader is
sent to the wrong rule and the "stated once" discipline silently becomes
"stated nowhere findable".

Two one-side data mutants at the tip `afd454b`, each anchored to match
exactly once, each landing read from `git diff --numstat`, each restore
proved by sha256:

| mutant | site | `node tools/method-evals/run.mjs` |
|---|---|---|
| `` `roles/executor.md` `` → `` `roles/executorz.md` `` | verifier.md | **exit 1** — MF-04: 1 dangling reference of 15 distinct targets |
| `` `roles/verifier.md` step 6 `` → `` step 9 `` | lane-protocol.md | exit 0, 10 model-free evals |
| `` `roles/executor.md` step 5 `` → `` step 4 `` | lane-protocol.md | exit 0, 10 model-free evals |

MF-04 resolves the PATH and reds. MF-02 — "every ordinal citation
resolves to a rule or sub-step that exists", 41 citations, 14 lettered —
does not read the `<file> step N` form at all: verifier.md has no step 9
and lane-protocol.md pointing at one is green. MF-02's own source already
records this class in as many words: *"the `rule N` predicate simply did
not match"*.

## Acceptance criteria

- WHEN a method file cites another by `<path> step N` THE MF-02 predicate
  SHALL resolve that ordinal against the cited file's own steps, and a
  citation naming a step that does not exist SHALL red.
- WHEN the predicate is widened THE eval SHALL carry the count it matches
  before and after, because a widened predicate that matches nothing is a
  quieter version of the hole — MF-02's own comment names that risk.
- WHEN the eval runs THE positive control SHALL be a citation deliberately
  pointed at a non-existent step, shown red, per `roles/verifier.md` 2b.

## Implementation notes

## Verdicts
