---
id: T-167-s11
title: roles/executor.md offers the two restoration proofs as an either/or, and the cheap half certified a destruction on T-167-s9's lane
feature: F-01
milestone: 4
priority: 4
size: S
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-167-s9
blocked_by: []
touches: [method/roles/executor.md]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND WHILE VERIFYING T-167-s9, NOT FIXED THERE.** That card's fence is
`[method/runtime, app-agent]` and reaches no role file; the verifier's own
writes are the card and its findings. The change this card proposes is one
sentence of method text, and whether it is owed a method version bump is
triage's call before dispatch (CONVENTIONS, "what a bump is owed for") —
this card names the question and deliberately does not answer it.

## The two sides say different things about the same proof

`method/roles/executor.md`, in the report contract's drill row:

> **Every drill** — what was mutated, one side only, and the restoration
> proof (a sha256 or an empty per-path diff).

`docs/CONVENTIONS.md`'s POISON DRILL bullet, ruling the same question at
`T-092-s4`:

> **THE SHA256 IS THE PROOF AND AN EMPTY `git diff -- <path>` IS A
> COMPANION, NEVER AN ALTERNATIVE** — it was written as an alternative and
> it PASSES ON A FAILED RESTORE.

The method file still carries the wording the project's own conventions
retracted. A session reading the role file alone is told the two are
interchangeable, in the one row that tells it what to write down.

## Three measured instances, and the third is this lane's

The rule is not theoretical and has now been bought three times, each by
a DIFFERENT mechanism, which is the argument for fixing the sentence
rather than adding a fourth warning beside it:

1. **The staged index** (`T-092-s4`). `git checkout <commit> -- <path>`
   writes the INDEX as well as the worktree, so a following bare
   `git checkout -- <path>` restores from the mutation's own source and
   `git diff` with no range compares the worktree to that index — 0 bytes,
   on the wrong file.
2. **Uncommitted work** (`T-072-s1`). A restore cannot tell itself from a
   revert: both proofs are satisfied perfectly by a restore that threw
   away work HEAD never saw. Measured with sha256 matching and
   `git diff --stat` empty at the moment the work was lost.
3. **T-167-s9's own lane, 2026-08-31.** A drill was run BEFORE the
   implementation was committed and restored with `git checkout --
   app/src-tauri/src/agent/sessions.rs`. Four edits were destroyed. **Both
   proofs the role file accepts were run and they DISAGREED**: the empty
   per-path diff PASSED and certified the destruction; the sha256 against
   the pre-drill baseline FAILED (`aac6fd7c` → `a3033810`) and is the only
   reason it was caught. That card's implementation notes carry the
   incident; this card is the routing of the method-text half, which no
   lane fence in that card could reach.

## What a fix would decide

1. **The wording.** The minimal repair is one conjunction — *a sha256*,
   with the per-path diff named as a companion rather than an
   alternative, citing the reason rather than restating CONVENTIONS'
   measurement (a rule with two implementations is two chances to
   disagree; the role file is generic method text and the project's
   measurements are the project's).
2. **Whether the same either/or appears in the other role files.**
   `roles/verifier.md` and `roles/integrator.md` each carry drill
   obligations; run the sweep and record it even when it is empty
   (CONVENTIONS, "a fix names its class and its sweep").
3. **Whether a bump is owed, which a lane may not decide.** Against
   test 1 (SHIPPED BYTES): derive `KIT_FILES` at your own ref —
   `git grep -h 'rel: "' app/src-tauri/src/agent/kit.rs` — where the only
   `roles/` entry is `roles/planner.md`, so a fence naming
   `method/roles/executor.md` reaches no shipped byte, while a fence
   naming `method/roles/` would. Against test 2 (GRAMMAR): this IS a
   contract row governing what a ROLE must say, which is the trigger's own
   wording, so the honest reading is that test 2 may FIRE where the
   editorial-repair reading would not. **That is exactly the shape
   CONVENTIONS says triage must settle before dispatch**, and a bump is a
   three-file commit whose third file is Rust plus the method-eval
   `--bump` block — so the fence has to reach all of them.

## Acceptance criteria

- THE drill row in `method/roles/executor.md` SHALL NOT present the
  sha256 and the empty per-path diff as alternatives.
- THE sweep for the same either/or across the other role files SHALL be
  run and its result recorded, including when it is empty.
- THE bump question SHALL be ruled at triage BEFORE dispatch and written
  on this card, and the lane SHALL re-derive it at its own ref.
- Verification: headless. `node tools/method-evals/run.mjs` from the repo
  root plus `--selftest`, and `cargo test` from app/src-tauri if any
  `KIT_FILES` entry moves.
