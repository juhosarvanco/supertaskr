---
id: T-264-s7
title: The indexer's --root default is not pinned by any body — every CLI test passes an explicit root, so a broken default survives the whole rust suite and only a bare invocation finds it
feature: F-06
milestone: 4
size: S
priority: 8
status: suggested
suggested_by: verifier claude-opus-5@subagent (phase 2), at T-264's bench, 2026-09-08 — a mutant on the default survived cargo test and was caught only by running the binary
blocked_by: []
touches: [app/src-tauri/crates/supertaskr-index/src/cli.rs, app/src-tauri/crates/supertaskr-index/tests/cli.rs]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**Class parent: `T-264`**, found while drilling that lane's graph
regeneration. `supertaskr-index`'s `--root` documents a default — *"Repo
root (default: the current directory)"* — and no test body exercises it.
Every case in `tests/cli.rs` and in `src/cli.rs`'s own module tests
passes `--root` explicitly, which is the right thing for a hermetic
fixture and leaves the default itself unmeasured.

## What was measured

At `69b86b1`, in a detached scratch worktree, `root_label`'s initialiser
in `src/cli.rs` was changed from `"."` to `"/nonexistent/supertaskr-drill"`
and the landing read back from `git diff -U0`:

- `cargo test -p supertaskr-index --test cli` — **exit 0, 16 passed.**
  The mutant is invisible to the suite.
- `cargo run -p supertaskr-index -- index` (no `--root`) — **exit 3**,
  `FAILED: index root /nonexistent/supertaskr-drill is missing, not a
  plain directory, or cannot be canonicalized`.

**The behaviour is right and only the coverage is missing**, which is
why this is a suggestion and not a defect: a broken default fails LOUDLY
rather than indexing nothing and writing a small, valid, CURRENT-reading
graph — the failure mode that would let a regeneration look like it
happened. The tool already refuses. Nothing holds it to that.

## Acceptance criteria

- WHEN `index` is invoked with no `--root` from a directory that is a
  repository root THE body SHALL assert it indexes THAT directory, by
  comparing against the same run with `--root .` given explicitly.
- WHEN `index` is invoked with no `--root` from a directory that is not
  a usable root THE body SHALL assert the non-zero exit and the message
  naming the path, rather than a written graph.
- THE same two bodies SHALL cover `index --check` and `arch`, which
  share the flag and the default.
- WHEN the guard is drilled THE mutant SHALL be the initialiser itself,
  and the card SHALL record that it now reds where today's suite passes
  at exit 0 over 16 bodies.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
