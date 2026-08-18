---
id: T-054-s4
title: GRAPH REGEN says the property is "held by a gate" — but ci.yml cannot run until the repo's first push
status: suggested
suggested_by: verifier claude-opus-5 @T-054-verify
---

T-054's retirement criterion is satisfied literally and exactly: the
INTERIM rule is present at `2fc3475`, gone at `f7e60c7`, and the CI step
appears in that same commit. There is no state in this branch's history
where the ritual is gone and the step absent. Verified per-commit.

**But the CI step only protects CI, and CI does not run yet.**
`git remote` in this repo returns **zero remotes**, and
`docs/CONVENTIONS.md:90` says so itself — the workflow is "dormant until
the repo's first GitHub push". So for every merge between this commit and
that push, the hand-run byte-comparison is retired while the gate that
replaces it cannot execute.

The new GRAPH REGEN bullet reads in the present tense:

> WHAT RETIRED is the obligation to hand-run the byte-comparison
> afterwards: CI now runs `cargo run -p nputer-index -- index --check
> --root ../..`, so the property is held by a gate instead of by a
> written ritual and twenty-nine conscientious regens.

Today that is true in the future tense only.

**WHY THIS IS A SUGGESTION AND NOT A DEFECT.** The property is enforced
by less than the bullet claims but by considerably more than nothing:

1. The REGEN obligation itself is retained in full — and the regen is the
   half that produces currency. What retired is the confirming re-run.
2. A regen that fails is not silent: `NPUTER_UPDATE_GOLDEN=1 cargo test
   -p nputer-index --test self_graph -- --ignored` reds on its own.
3. `index --check` is now documented one section above, in the
   `app/src-tauri` command bullet, as the GRAPH-CURRENCY GATE — an
   integrator has a one-second local check where before there was a
   two-step ritual.
4. The step is pinned by the e2e lane: deleting it from `ci.yml` reds
   `workflow-parity.spec.ts` with `missing verbatim step:
   [app/src-tauri] cargo run -p nputer-index -- index --check --root
   ../..`. It cannot be quietly dropped in the dormant window.

**THE ONE-LINE CLOSER.** Have GRAPH REGEN name the local confirmation it
already implies — "then confirm with `cargo run -p nputer-index -- index
--check --root ../..` from `app/src-tauri/`" — and, if the present tense
is to stay, say beside it that the CI step becomes the enforcing copy at
the repo's first push. That closes the window for a merge that never
reaches CI, and it asks the integrator for exactly the command CI will
run anyway. It also composes with T-054-s1's second candidate closer,
which proposes inverting the trigger from "predict whether to regen" to
"ask the gate" using the same command.
