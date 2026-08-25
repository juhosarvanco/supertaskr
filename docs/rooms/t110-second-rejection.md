---
type: escalation
task: T-110
status: open
max_rounds: 3
---

## Why this room exists

`method/tasks/TASK-FORMAT.md` — *"Two rejections → stop; open a room,
escalate to the human."* **T-110 has been rejected twice by two
independent verifier sessions, on two different defects.** The circuit
breaker has fired, so no third executor was dispatched. This room is the
escalation, and it is addressed to **@human**.

Nothing is broken on `main`: T-110 has never merged, its lane worktree
`/Users/ujju/Projects/nputer-T-110` is intact at the verdict commit
`0bdaa24`, and the fence `[app-dispatch]` is still held by it. The card
is safe to leave sitting.

## @architect (claude-fable-5 @dispatch-session) — 2026-08-25

### What happened, in order

1. **Built** by `claude-opus-5 @T-110` — the lane reader that turns
   git's own `.git/worktrees/*` files into a typed lane list, F-04's
   first real code, into the C-15 component T-088 declared the same day.
   17 mutants, 17 red.
2. **REJECTED (pass 1)** on **criterion 4**: the four lane-disagreement
   states were built and **no test drove any of them** — zero test files
   imported the store, and four one-sided producer mutants all survived a
   green suite, including one that made the card's own named fixture (a
   `building` stamp with no worktree) unreachable. The verifier's insight
   was that the fence had not blocked the pin — the PLACEMENT had, and a
   Rust join through the shim that already existed would have been
   entirely in fence.
3. **Rebuilt** by a fresh executor, which re-ran all four mutants first
   and confirmed every one survived before changing a line, then
   relocated the join into `app/src-tauri/src/dispatch/join.rs` with 13
   bodies driving the real reader over real temp-directory fixtures. 28
   mutants, 25 red, the three survivors honestly accounted for.
4. **REJECTED (pass 2)** on a **security finding**, which is
   rejected-level by `method/roles/verifier.md` step 3.

### The second defect, which is real and worth understanding

`read_small` opens its file with `fs::metadata` — **which follows
symlinks** — while the three checks above it use `symlink_metadata`.
So a `gitdir` entry that is a SYMLINK is followed, and the first line of
whatever it points at becomes a `Lane`'s `worktree_path`. Reproduced by
the verifier in a temp directory:

    ln -s "$T/secrets/creds" "$T/repo/.git/worktrees/leak/gitdir"
    -> Lane { task_id: "T-110", worktree_path: "machine github.com/… AKIA-EXAMPLE-SECRET", … }

**It also falsifies the FIRST verifier's own all-clear.** Pass 1 reported
*"no forged LANE is reachable"* and specifically that a `gitdir`
symlinked to a 2.4 MB file was refused, concluding *"the bound holds
through the symlink."* Pass 2 showed that probe was **one-sided**: the
SIZE bound stopped that fixture, so the symlink policy never ran at all.
A smaller target sails through. **This is the "A NEGATIVE ASSERTION
NEEDS A POSITIVE CONTROL" rule biting a verifier rather than an
executor**, and it is the sharpest instance this project has recorded —
the control was missing from the security sweep itself.

**Blast radius, stated as the verifier stated it rather than dramatised:**
the read is bounded, nothing is written, there is no `git clone` vector,
and the reader is not wired into anything yet. The fix is **two tokens,
entirely inside the fence** (`metadata` → `symlink_metadata`).

### What the architect recommends, and why it needs @human

**The rule says stop, and the rule is right to say so** even though this
particular fix looks trivial — the whole point of a circuit breaker is
that it does not consult the size of the next repair. But the two
rejections are of visibly different kinds, and that is the ruling worth
making:

- Pass 1 rejected a **specification gap the lane could not see** (no pin
  drove a built behaviour).
- Pass 2 rejected a **one-line defect the lane introduced** and that two
  earlier passes missed, one of which had explicitly cleared it.

Neither is a sign of a card that cannot be built or an executor that
cannot build it. Both are the pipeline working. So the three options,
with the architect's recommendation:

1. **(RECOMMENDED) Waive the stop condition ONCE, in writing, for a
   third and final pass** — a fresh executor makes the two-token fix,
   adds the symlink fixture as a pinned body WITH its positive control
   (a real file at the same size that DOES resolve, so the refusal is a
   refusal and not an absence), and a third verifier looks only at
   whether that is closed. If it rejects again, the card is parked and
   re-planned rather than rebuilt.
2. **Park T-110 and re-plan the slice.** The card has grown a
   fence argument, a placement argument and a security surface since it
   was written; a re-decomposition might produce two smaller cards (the
   reader, then the join) that each fit their fence cleanly.
3. **Accept and merge with the defect disclosed**, the way T-101 shipped
   a known defect with the mechanism, fix and routing in the code. **The
   architect advises AGAINST this one**: T-101's disclosed defect was a
   double-reported message, and this is a path-following read of an
   attacker-chosen file. "Disclosed" is not a category that should
   stretch to cover a symlink follow.

**@human** — option 1 needs one word from you. Everything else is
recorded and nothing is waiting on a machine.

### Where this leaves F-04

T-110 is the first of the dispatch chain: `T-088` (done) → **T-110** →
`T-111` → `T-112`. The chain is stalled at its first real card, and
`[app-dispatch]` stays held while this room is open. `T-111` and `T-112`
are `blocked_by` it and cannot be dispatched around it.

The lane's own findings survive regardless and are worth keeping whatever
is decided: `T-110-s1` (the missing `pub mod dispatch;` — a planted type
error still leaves `cargo build` at 0), `T-110-s4` (the drill worktree's
`.drilltarget` is indexed by the graph walk, reproduced three times),
`T-110-s7` (a relative `gitdir` is real, not hypothetical — git's own
`--relative-paths` makes a live lane read `exists_on_disk: false`),
`T-110-s9` (`tests/dispatch_lanes.rs` is now the tree's only unmapped
file) and `T-110-s11` (two cards on one id produce two rows while both
spellings of the contract say one).
