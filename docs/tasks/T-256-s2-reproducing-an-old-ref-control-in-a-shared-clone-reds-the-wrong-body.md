---
id: T-256-s2
title: Reproducing a control at an old ref in a `git clone --shared` reds the eight-hand-steps body for the WRONG reason, because the clone's own main stays at the source tip
feature: F-01
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-256
blocked_by: []
touches: [docs/CONVENTIONS.md, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**FOUND WHILE VERIFYING T-256, NOT FIXED THERE** — that lane's fence is
`docs/CONVENTIONS.md` and `tools/e2e/tests/workflow-parity.spec.ts`, and
this needs a body in `brief.spec.ts`.

T-256's criterion 2 asks a seat to run the borrowed-git recipe against
the T-239 ritual fixture at `0f6b37f` and see exit 128. STATE forbids
cutting a worktree for it while lanes are live, so the way to materialise
that ref is `git clone --shared`. **A fresh clone's own `main` points at
the SOURCE's tip, not at the checked-out ref.** `checkout-currency` then
answers STALE, and `brief.spec.ts:3230` — *THE ARM LEAVES EXACTLY WHAT
THE EIGHT HAND STEPS LEAVE, file for file* — reds at step 3 (preflight)
on an unsettled claim, which is NOT the identity failure the control is
looking for at step 1.

The two seats that touched this card both walked into it independently
(the T-256 executor, disclosed in its report; this verifier, before
reading that report). Measured here, all at `0f6b37f`, whole-file
`tests/brief.spec.ts`:

    clone main at the source tip, recipe UN-ARMED   exit 1   1 failed / 56 passed
    clone main at the source tip, recipe ARMED      exit 1   1 failed / 56 passed
    after `git branch -f main 0f6b37f`, UN-ARMED    exit 0   57 passed
    after `git branch -f main 0f6b37f`, ARMED       exit 1   1 failed / 56 passed

**The first two rows carry the same count and different causes**, so a
seat reading the COUNT — which is the figure T-256's criterion cites —
concludes the control does not discriminate, when in fact the clone was
misconfigured. Only the step reached and the stderr separate them.

STATE already names the neighbouring hazard for a BENCH worktree ("a
bench older than a sibling lane reds brief.spec's eight-hand-steps body
by ref skew"). The clone case has a different cause and a different
remedy, and neither is written down.

## Acceptance criteria

- WHERE `docs/CONVENTIONS.md` publishes materialising an old ref in a
  `--shared` clone, IT SHALL name that the clone's own `main` must be
  moved to that ref before any currency-reading suite is run, with the
  command.
- WHEN the eight-hand-steps body reds because the session's checkout is
  STALE THE failure message SHALL distinguish a stale CLONE from the
  identity refusal it is often mistaken for, so a seat reading only the
  count is not misled.
- Verification: headless.
