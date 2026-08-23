---
id: T-089-s1
title: The v0.1.6 bump T-089 owes is a three-file commit whose third file is Rust — and T-089's fence could not reach it
status: suggested
suggested_by: executor claude-opus-5 @T-089
---

T-089 changed `method/` (a new `method/lane-protocol.md`, a normative
dispatch-brief table in `method/roles/executor.md`, a rewritten merge
step in `method/roles/integrator.md`, a dispatch step in
`method/roles/orchestrator.md`, two lifecycle rules in
`method/tasks/TASK-FORMAT.md`, and the lifecycle list in
`method/README.md`). CONVENTIONS' first gotcha requires a version bump
for that. **The bump did not happen**, and this file is the debt.

**Why it could not.** A bump is THREE files:

1. `docs/CONVENTIONS.md` — the `currently v0.1.5` stamp
2. `method/interview/plan-interview.md` — the `(v0.1.5` Output heading
3. `app/src-tauri/src/agent/kit.rs` — `METHOD_SNAPSHOT_VERSION`

`snapshot_version_matches_the_live_method_stamps` in `kit.rs` reads both
DOCS off disk on every `cargo test` and asserts each carries the const's
value. T-089's fence is `[method/, docs/CONVENTIONS.md]`; `kit.rs` sits
under `app/src-tauri/src/agent/**`, which is C-14's `app-agent` slug —
held by the live `T-070` lane at T-089's dispatch. Editing it would have
been a fence breach into a running lane, so the executor built the other
five criteria and routed this one, per its own new rule ("a criterion
that cannot be built inside the fence is NOT built").

**Measured at T-089, one side at a time, in a fresh worktree, each
mutation read back with `git diff` before the suite ran and each restored
by byte copy with a sha256 proof:**

| mutation | `cargo test <the test by name>` | the assertion that fired |
|---|---|---|
| CONVENTIONS stamp to v0.1.6, const untouched | exit **101** | `kit.rs:450` — *docs/CONVENTIONS.md no longer says 'currently v0.1.5'* |
| plan-interview stamp to v0.1.6, const untouched | exit **101** | `kit.rs:443` — *plan-interview.md's Output heading no longer stamps v0.1.5* |
| const to `0.1.6`, both docs untouched | exit **101** | `kit.rs:443` again, now naming v0.1.6 |
| nothing mutated | exit **0**, `1 passed … 119 filtered out` | — |

**One asymmetry worth carrying into the fix**: the two asserts are
ORDERED, so a const-only bump reds on the plan-interview arm and never
reaches the CONVENTIONS arm. A reader who fixes only the file the panic
names gets a second red rather than a green.

## What to do

Ride the bump on any lane that already holds `app-agent` fence room, or
dispatch it alone with `touches: [method/, docs/CONVENTIONS.md,
app-agent]`. The edit is **FOUR literals across three files**, `0.1.5` →
`0.1.6`: the three PINNED ones above (CONVENTIONS' `currently v0.1.5`
stamp, plan-interview's `(v0.1.5` heading, kit.rs's const) PLUS a fourth
that NO test pins — CONVENTIONS' own genesis-kit gotcha carries a
`(v0.1.5, T-023)` version on its `plan-interview.md` reference, and a
bump that stops at three literals leaves that fourth one stale and green
(T-089's verifier, finding 4). Then delete the two sentences in
CONVENTIONS' first gotcha that record this debt. **Order matters — the
two `kit.rs` asserts are sequential, so a partial bump reds a SECOND
time rather than going green; move all four literals together.** Nothing
else moves: no other test pins the version, and the three
`methodVersion: "0.1.5"` occurrences in `app/test/` and
`tools/e2e/tests/shell-harness.ts` are fixture-local (the fixture sets
the value the assertion reads), so they do not red on a bump — verify
that rather than trusting this sentence.

This is `T-078-s3` arm 2, now with an instance. Arm 1 (write the coupling
down where the editor of `method/` is looking) was taken by T-089 in the
gotcha itself.
