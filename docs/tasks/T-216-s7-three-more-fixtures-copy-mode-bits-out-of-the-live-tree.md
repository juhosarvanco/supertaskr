---
id: T-216-s7
title: Three more fixtures copy mode bits out of the live tree, and they are green only because none of them asserts on a copy's writability
feature: F-06
milestone: 4
priority: 4
size: S
status: planned
blocked_by: []
touches: [tools/e2e/tests/card-preflight.spec.ts, tools/e2e/tests/lane-fence.spec.ts, tools/e2e/tests/helpers.ts, app/src-tauri/crates/nputer-index/tests/perf.rs, app/src-tauri/crates/nputer-index/tests/common/mod.rs, tools/method-evals/lib/fixture-root.mjs]
suggested_by: executor claude-opus-5@subagent @T-216-s4
builder:
verifier:
built_by:
verified_by:
review: independent
---

**FOUND WHILE BUILDING T-216-s4, NOT FIXED THERE** — the class sweep that
card owes, with its result. All three paths are outside its fence
(`T-230` holds `tools/e2e/tests/card-preflight.spec.ts` on main).

**Class parent: `T-216-s4`.** THE CLASS: *a fixture built by COPYING out
of the live checkout inherits that checkout's permission bits, so under
T-210's physical layer a lane's fixture is read-only wherever the lane's
fence is not.* `T-216-s4` fixed the two sites where an assertion could
see it. These are the three where none can — yet.

## The sweep, at `2289f0d`, from the repository root

    command grep -rn 'cpSync(path.join(repoRoot|copyFileSync(path.join(repoRoot' \
      tools/e2e app/test lib/parser/test

    tools/e2e/tests/card-preflight.spec.ts:201  copyFileSync(...)
    tools/e2e/tests/card-preflight.spec.ts:220  cpSync(<repoRoot>/method, ...)
    tools/e2e/tests/card-preflight.spec.ts:222  copyFileSync(...)
    tools/e2e/tests/lane-fence.spec.ts:165      copyFileSync(...)
    tools/e2e/tests/lane-lock.spec.ts:183/185   FIXED at T-216-s4

and on the Rust side, `copy_repo_to` in
`app/src-tauri/crates/nputer-index/tests/perf.rs`, which `std::fs::copy`s
the whole repository root into a `TempTree` and then edits one file per
trial. **`perf_cold_and_incremental_within_ceilings` is `#[ignore]`d**,
so it never runs in `cargo test` and never reds — a latent instance with
no keeper, which is exactly the shape that surfaces the day somebody
un-ignores it on a release build.

**THE SWEEP IS RECORDED EVEN WHERE IT IS EMPTY** (docs/CONVENTIONS.md):
`app/test` and `lib/parser/test` returned NOTHING for either pattern, and
the search was shown capable of finding something by the five hits above.

## Why they are green today, and why that is not reassuring

None of the three asserts anything about a COPY's mode, so an inherited
`-r--r--r--` is invisible until a body writes one. All three were green
in an armed lane at `e648590` (measured in the `T-216-s4` lane's own
baseline: 5 failed of 535, and none of these is among them).

**A fixture that inherits the layer's own mode bits is measuring the
checkout it was cut in.** `lane-lock.spec.ts` is the worked example of
what that costs: its POSITIVE CONTROL — the assertion separating *the
layer reached the lane* from *the layer reached everything* — received
`false` in every lane for two days.

## Acceptance criteria

- WHERE a fixture is built by copying out of the live checkout, the copy
  SHALL NOT carry the source's write bits, in all three files above.
- The repair SHALL be one implementation per package, not three — a rule
  written three times is three chances to disagree (T-057).
- A positive control SHALL manufacture a read-only SOURCE rather than
  find one: the precondition is a property of the CHECKOUT, so a body
  that leans on the ambient tree is green in every checkout a drill runs
  in. `T-216-s4` ships two of these to copy.
- Verification: headless.

## TRIAGE, 2026-09-02 — PROMOTED as the carrier of the sweep

Absorbs: T-216-s8 — the fourth tree of the same sweep,
`tools/method-evals/lib/fixture-root.mjs`'s `materialize` copying
`method/` and the live docs out of the checkout with their mode bits,
latent because no eval writes there yet; its argument that the METHOD
EVAL GATE is owed precisely from a lane where `method/**` is read-only
travels with it. The fence gains that file, `tools/e2e/tests/helpers.ts`
(the one implementation on the e2e side) and
`app/src-tauri/crates/nputer-index/tests/common/mod.rs` (T-216-s4's
`copy_dir`, the one implementation on the Rust side), so "one
implementation per package" is buildable rather than routed.
