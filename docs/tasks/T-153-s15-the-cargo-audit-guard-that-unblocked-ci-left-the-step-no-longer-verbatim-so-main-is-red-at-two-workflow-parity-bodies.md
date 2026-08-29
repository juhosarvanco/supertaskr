---
id: T-153-s15
title: The guard that unblocked step 19 left the cargo-audit step no longer VERBATIM, so main's own e2e lane is red at two workflow-parity bodies — and every lane's CI now carries two reds it did not cause
feature: F-01
milestone: 4
priority: 1
size: S
status: suggested
blocked_by: []
touches: [.github/workflows/, docs/CONVENTIONS.md, tools/e2e]
suggested_by: verifier claude-opus-5@subagent @T-153-s9
builder:
verifier:
built_by:
verified_by:
review:
---

## The measurement — read at 2026-08-30 from the run's own log

`T-153-s13`'s fix landed on main as `129e3c9` and it WORKS: in run
`33277730761` (event `push`, head `129e3c9`) step 19 `install cargo-audit`
is **success** and step 20 `cargo audit` is **success**, which is exactly
what that card asked for. The repository-wide CI blocker is gone.

The same run then fails at step 25, `e2e lane`, **2 failed / 279 passed**:

    ✘ 258 tests/workflow-parity.spec.ts:581 › every CONVENTIONS command
          is a step, verbatim and in CI order
        Error: missing verbatim step: [app/src-tauri] cargo install cargo-audit --locked
    ✘ 259 tests/workflow-parity.spec.ts:597 › the workflow runs nothing
          beyond the derived commands and its infrastructure
        Error: ci.yml is a THIN INVOKER of the CONVENTIONS commands — a step
          that is neither derived from the doc nor listed as infrastructure
          is a command nobody documented

## The mechanism

`.github/workflows/ci.yml` step 19's `run:` was

    cargo install cargo-audit --locked

and is now

    command -v cargo-audit >/dev/null 2>&1 || cargo install cargo-audit --locked

`docs/CONVENTIONS.md`'s one-time dev-tool bullet still publishes the bare
command, and that section's CI bullet enumerates the deliberate
divergences and closes the list in as many words: *"BOTH ARE ENVIRONMENT
DIFFERENCES, and that is now the whole list"*. A third divergence has
landed with no doc-side and no spec-side counterpart, so
`deriveExpectedSteps` in `tools/e2e/tests/workflow-parity.spec.ts` reds
from both directions at once — the doc claims a command the workflow no
longer spells, and the workflow spells a command nothing derives.

This is the failure that bullet warns about by name: *"Change a command
here, change it there, or the lane fails."* Nothing was missed by the fix
that could have been caught locally — the fix's own lane fence was
`.github/workflows/`, which reaches neither of the two files that had to
move with it. **That is the finding: the fence that made the fix safe is
the fence that made this red inevitable.**

## Why it is priority 1 rather than a tidy-up

**It is not a red about the workflow; it is a red on every future CI
read.** `ci.yml` runs on push-to-main and on `pull_request`, so every
lane's draft PR — the one instrument a lane is given (`T-153-s9`) —
now returns two failures nobody in that lane caused, on a step whose
verdict a lane is supposed to read per body. `T-153-s9` exists because a
lane that reads CI's COLOUR rather than its per-body results draws the
wrong conclusion; this reintroduces exactly that hazard one week later,
from the other side.

It also lands ON MAIN, which is the tree every lane is cut from and every
merge is verified against: `main` at `129e3c9` does not have a green e2e
lane, and the next integrator will meet the red at a checkpoint with no
card to attribute it to.

## Three discharges, and the choice is a real one

1. **Restore the verbatim command and move the idempotence elsewhere** —
   e.g. `cargo install cargo-audit --locked --force`, which is still not
   the doc's string, or a cache-key change that stops saving
   `~/.cargo/bin`. Cheapest to reason about, and it keeps the "thin
   invoker" property whole.
2. **Publish the divergence.** Add it to `docs/CONVENTIONS.md`'s CI
   bullet as a THIRD deliberate divergence with its reason, and add the
   mapping to `CI_SEQUENCE` in `workflow-parity.spec.ts` the way the two
   existing environment divergences are mapped. This is the honest route
   if the guard is the right shape, and it is the route the bullet's own
   text prescribes ("verbatim or mapped, with the workflow step").
3. **Make the doc carry the guarded command** and leave ci.yml alone.

Whichever is taken, the fence has to reach `.github/workflows/`,
`docs/CONVENTIONS.md` AND `tools/e2e` — a fix confined to any one of the
three cannot come back green, which is how this arrived.

## What is NOT wrong here

`T-153-s13`'s diagnosis and its fix are both correct and are validated by
the same run. This card is the sweep that fix owed and did not run: the
class is *a CI step edited without the two readers that derive from it*,
and it has exactly one member today.

Discharged: closed_by the T-153-s9 checkpoint (2026-08-30, integrator) — the three-copy alignment landed with the merge that freed the fence: CONVENTIONS twins, the CI_SEQUENCE declaration, and the fixture expectation all carry the guarded spelling; workflow-parity 17/17 green at the checkpoint.
