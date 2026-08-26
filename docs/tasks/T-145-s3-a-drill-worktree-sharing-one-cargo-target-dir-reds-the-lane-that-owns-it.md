---
id: T-145-s3
title: A drill worktree that shares the lane's CARGO_TARGET_DIR bakes its own path into the test binaries and reds the lane after it is deleted — one runner, one owner, and the collision rule 4 predicts anyway
status: suggested
suggested_by: executor claude-opus-5 @T-145
touches: [docs/CONVENTIONS.md]
---

## What happened, in this lane, tonight

`T-145` ran its `T-142` positive control in a detached scratch worktree
outside the repository, and pointed `CARGO_TARGET_DIR` at the LANE's
already-warm target directory to avoid a cold Tauri build.

`crate::testutil::repo_root()` in `nputer-index` is
`env!("CARGO_MANIFEST_DIR")` — **resolved at COMPILE time**. The drill
build baked the DRILL worktree's absolute path into the compiled test
binaries. The two source trees were byte-identical apart from the
deliberate one-line mutation, so cargo's fingerprint matched and the
lane's next `cargo test` **reused the drill-compiled artifacts**.

After the drill worktree was removed, `cargo test` in the lane went:

    exit 101  the live registry must read:
              DirMissing(".../T-145-drill/docs/architecture/components")

**A red naming a directory that no longer exists, in a lane whose diff is
five markdown files.** The same command was `exit 0`, **518 passed**, in
the same lane before the drill.

## Why it is worth a gotcha rather than a shrug

**It is not distinguishable from a real red by its headline.** It names a
crate, a test and a path, and the path is plausible. The first repair —
touching the one source file the panic pointed at — produced a SECOND
red with **nine** failures, because each integration-test binary bakes
its own copy. That is the same trap gotcha 1 already documents for the
method version bump ("fixing only the file a panic names yields a SECOND
red, not a green"), arriving from a different direction.

**`cargo clean` is prohibited here**, so the recovery is worth writing
down: `touch` every workspace `.rs` (mtime only — `git status
--porcelain` stayed empty across the whole episode) and rebuild.

## The standing lesson, and where it is NOT already written

`method/lane-protocol.md` rule 4 forbids a second RUNNER in a checkout
somebody else owns, and argues it precisely: *"a test run only READS, so
it looks harmless — and it is the one that actually collided"*, and
*"nothing in the tree records that a second runner was present"*. Both
sentences are exactly true of this episode.

**But this was ONE runner and ONE owner.** The shared surface was not a
checkout, it was a TARGET DIRECTORY, and rule 4 has no term for it. The
rule's own test — *does it name a COLLISION or an AUTHORITY* — says this
is a collision and therefore binds; nothing states it where the person
about to type `CARGO_TARGET_DIR=` is looking.

**A drill worktree gets its own target directory, or it is not isolated.**

## Which file

Fenced to `docs/CONVENTIONS.md` because the mechanic is cargo-specific
and gotcha 1's neighbourhood is where a session about to edit this
project looks. **If triage judges the rule generic** — it is true of any
project whose tests resolve paths at compile time — the home is
`method/lane-protocol.md` rule 4 instead, which is a different fence and
carries the method-version question `T-145-s2` raises. Do not take both
from one lane without re-deriving disjointness.

`docs/CONVENTIONS.md` was free of every lane live on 2026-08-26. Re-derive
with `brief.mjs --task` after this card is committed, never from these
tokens.
