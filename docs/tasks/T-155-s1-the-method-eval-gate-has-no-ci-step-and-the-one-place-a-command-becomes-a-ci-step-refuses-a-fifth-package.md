---
id: T-155-s1
title: The method eval gate has no CI step, and the one place a command becomes a CI step refuses a fifth package
status: suggested
suggested_by: executor claude-opus-5 @T-155
---

T-155's first acceptance criterion is *"WHEN any method file changes THE
model-free eval set SHALL run"*. The suite exists, reds correctly and is
documented as the METHOD EVAL GATE in docs/CONVENTIONS.md — but **it runs
only when a hand runs it**, exactly like the DOCS GATE's diff half. CI
never executes it, and `method/**` is the one tree in this repository
whose change fires no automated step at all (derive: match a
`method/**`-only diff against the four gate triggers in CONVENTIONS).

**THE FENCE COULD NOT REACH IT, AND THE REASON IS MECHANICAL RATHER THAN
POLITICAL.** `deriveExpectedSteps` in
`tools/e2e/tests/workflow-parity.spec.ts` reads the `run from <dir>/:`
bullets of CONVENTIONS' "Build & test" section and compares them, in BOTH
directions, against `CI_SEQUENCE` and `LOCAL_ONLY` in that same file. Its
`DOC_DIRS` constant pins exactly four bullets in order, so a fifth
`run from tools/method-evals/:` bullet reds the lane by name — correctly.
Taking this suggestion is therefore a THREE-file edit that no single
fence in T-155's shape can hold: the CONVENTIONS bullet, that spec, and
`.github/workflows/ci.yml`. T-155's fence was
`[tools/method-evals, docs/CONVENTIONS.md]`.

**WHAT TO DO, and the order matters.** Add the `run from
tools/method-evals/:` bullet to "Build & test" with
`node run.mjs` and `node run.mjs --selftest` as its commands; add
`tools/method-evals` to `DOC_DIRS`; add both to `CI_SEQUENCE`; add the
step to ci.yml. **THE SELFTEST IS NOT OPTIONAL IN CI** — it is the
positive control, and a suite whose checks have quietly become vacuous
reports the same green as an intact one; the token lint's own
`-- --selftest` step is the precedent and it runs FIRST for the same
reason.

**THE POSITION IS ARGUABLE AND WORTH ARGUING ONCE.** Like the token lint,
this suite is zero-dependency and reads no `node_modules`, so it can run
against a bare checkout ahead of every `npm ci` — measured at this lane's
tip by running it in a worktree where only `lib/parser` and `tools/e2e`
were installed and `tools/method-evals` never was. That makes it eligible
for the job's first steps, which is where a gate that answers in seconds
belongs.

**DO NOT wire `--set model-in-loop` into CI.** It spends tokens, samples
a nondeterministic process, and its cadence is a method version bump —
CONVENTIONS' first gotcha carries that obligation. A per-commit
model-in-loop set is the ritual-with-extra-steps T-155's own card warns
about.
