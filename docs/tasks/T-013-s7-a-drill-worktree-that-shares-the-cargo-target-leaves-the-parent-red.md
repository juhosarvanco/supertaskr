---
id: T-013-s7
title: A drill worktree that shares the cargo target directory bakes its own manifest dir into the cached test binaries and leaves the parent worktree RED after it is deleted
status: suggested
suggested_by: executor claude-opus-5 @T-013
---

The POISON DRILL bullet says to drill in a detached scratch worktree at
a commit. A scratch worktree has no `target/`, and building one from
scratch costs minutes, so the obvious move — the one this card made — is
to symlink the parent's:

    ln -s <lane>/app/src-tauri/target <drill>/app/src-tauri/target

**That is a trap, and it is silent until after the drill is over.**
Several Rust bodies in this tree resolve the repository from
`env!("CARGO_MANIFEST_DIR")`, which is baked in **at compile time**:
`crates/nputer-index/tests/arch.rs` reads the committed
`docs/architecture/graph.json` that way, `arch::registry`'s live-registry
test reads `docs/architecture/components`, and
`agent_runner.rs` reads a capture under `docs/research/`. Cargo does not
track that variable as an input, so the binaries the DRILL compiled —
carrying the drill's path — stay in the shared target directory and are
reused by the parent worktree afterwards.

**MEASURED, on this card.** With the drill worktree deleted and the lane
otherwise green, bare `cargo test --no-fail-fast` from
`app/src-tauri` went **336 passed / 33 failed / 3 ignored, exit 101**,
and the failures named a directory that no longer exists:

    the live registry must read:
      DirMissing(".../scratchpad/T013-drill/docs/architecture/components")
    this repo commits its graph (ADR-014):
      Os { code: 2, kind: NotFound }

`cargo clean -p nputer -p nputer-index` (12 704 files, 3.0 GiB) followed
by a rebuild returned it to **369 / 0 / 3, exit 0**. Nothing was wrong
with the tree at any point.

**WHY IT MATTERS BEYOND THE INCONVENIENCE.** A verifier or integrator who
meets this red without having run the drill has 33 failures across four
bodies pointing at a path they have never heard of, in a lane whose diff
touches no Rust test — the "found three layers from the cause by
somebody who was not looking" shape the DOCS GATE bullet was written
about, on a different surface. And the direction is the dangerous one:
the pollution can also make a drill's cargo run **green against the
parent's stale binary**, which would be a mutant surviving for a reason
that has nothing to do with the mutation.

Three arms. (a) Never share `target/` with a drill worktree — correct,
and costs a full cold build per drill. (b) Share it and `cargo clean -p`
the workspace crates afterwards, which is what this card did once it
knew. (c) Give the drill its own `CARGO_TARGET_DIR` under the scratch
directory, which keeps the parent's cache untouched and pays only for
the drill's own build — **probably the right default**, and one
environment variable.

The POISON DRILL bullet in `docs/CONVENTIONS.md` should carry whichever
arm is chosen, because "drill in a detached scratch worktree" is
standing advice and this is its first recorded cost.
