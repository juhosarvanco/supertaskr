---
id: T-124-s1
title: The two planner instructions T-124 measured and could not write — run git bare in the cwd, write files with the Write tool — for T-104's owed v0.1.6 bump
status: suggested
suggested_by: executor claude-opus-5 @T-124
---

**T-124 CLASSIFIED THREE REAL REFUSALS AND EVERY ONE OF THEM ROUTES
HERE.** The card's third acceptance criterion says so in advance: *"FOR
REFUSALS CAUSED BY THE CLI'S OWN GUARDS THE FIX IS A PLANNER INSTRUCTION
AND NOT AN ARGV CHANGE, and it is OUTSIDE this fence."* What T-124
measured is stronger than the criterion assumed — **all three** end here,
not two, because the one refusal that IS our allowlist's meets a second,
independent CLI guard that no `--allowedTools` pattern can reach. The
adapter did not move, and the classification that says why now lives in
`adapter::OBSERVED_PLANNER_REFUSALS`.

## Why this cannot be a `[app-agent]` edit

The kit is `method/roles/planner.md` + `method/interview/plan-interview.md`.
Editing a `method/` format is a version bump whose third file is Rust
(`docs/CONVENTIONS.md`'s first gotcha; `METHOD_SNAPSHOT_VERSION` in
`app/src-tauri/src/agent/kit.rs`, cross-checked on every `cargo test` by
`snapshot_version_matches_the_live_method_stamps`). **T-104 already owns
that bump to v0.1.6** and already carries
`touches: [method/, docs/CONVENTIONS.md, app-agent]` — the exact three-way
fence this needs, chosen for exactly this reason. `method/` was also T-052's
live fence while T-124 ran, which is a second reason no lane could have
taken it in passing.

## The exact proposed wording

**(A) `method/roles/planner.md`, step 1 (stage 0).** Append to the step,
after the `git init` sentence:

> Run git BARE, in your own working directory — it IS the project
> directory, so `git -C <dir> …` is redundant and is refused: the CLI
> treats directory-changing git as able to run hooks from the target tree
> and asks for approval every time. Write files with the Write tool, not
> with a shell redirect (`> file`); `--permission-mode acceptEdits`
> already accepts writes inside your cwd, while a redirect target that
> carries `$` or a backtick is refused unanalyzed.

**(B) `method/interview/plan-interview.md`, the stage-0 banking-map row.**
The row is one table cell and should not grow a paragraph; append to its
end:

> ; git run bare in the cwd, files written with the Write tool

Both are instructions to the PLANNER about spelling, not new
capabilities: every operation named is already granted.

## The evidence, and what each sentence is derived from

Three refusals, real `claude` 2.1.226, live genesis interview 2026-08-24,
transcribed in `docs/tasks/T-124-…` and carried as data in
`adapter::OBSERVED_PLANNER_REFUSALS`:

| refusal | mechanism | what the wording answers |
|---|---|---|
| *"…changes directory before running git, which can execute untrusted hooks from the target directory."* | the CLI's own safety heuristic | (A) sentence 1 — bare git |
| *"Redirect target concatenation contains … unanalyzable gap or substitution"* | the CLI's own command analyser | (A) sentence 2 — the Write tool |
| *"…The following part requires approval: `git -C <projectdir> status --short`"* | **ours** — the six grants are prefixes over fixed verbs | (A) sentence 1 — the bare twin is ALREADY granted |

**THE THIRD ROW IS THE ONE THAT MATTERS FOR SCOPE.** It is our
narrowness, and widening is still the wrong fix: the same command meets
row 1's guard independently, so a pattern admitting it would be both
wider and ineffective. The only patterns that could admit it are
`Bash(git -C:*)` — every git subcommand in every directory on disk — or a
runtime-substituted project path, which puts a `/`-bearing
user-controlled string into a permission grant. Neither is narrow;
ADR-012's narrowness lives in the signature and there is no narrow
spelling of "this directory".

## What it costs today

Nothing is LOST — the observed turn banked stage 0 in full and the
planner routed around all three (T-081's *a denial is not a death*,
holding against a real model). The cost is that the genesis loop runs
DEGRADED: every refusal spends a turn's reasoning working around a
surface the planner was already granted. A second, sharper number T-124
measured and the card did not claim: **all four git grants are lost to
the `-C` spelling**, not merely `git status` — `git init`, `git add` and
`git commit` are equally unreachable in that form, which is the banking
boundary as well as the scaffold.

## Notes for whoever takes it

- The wording above is a PROPOSAL, not a patch. T-104's own first
  criterion asks whether a bump is owed at all before dispatch.
- Do not restate the mechanism in `method/`: it is generic and
  product-agnostic, and "the CLI refuses directory-changing git" is a
  fact about one CLI. The wording above states the RULE (bare git, Write
  tool) and leaves the reason to `adapter.rs`, where the evidence is.
- `adapter::OBSERVED_PLANNER_REFUSALS` is the durable form of the
  evidence. `real_cli_arms_forbidden` structurally forbids a test from
  resolving the user's CLI (T-047-s6, T-060), so nothing in the suite can
  regenerate these strings and a fresh capture costs a real model call.
