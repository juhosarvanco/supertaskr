---
id: T-092-s4
title: A path checked out FROM A COMMIT is staged, so the POISON DRILL's empty-git-diff restoration proof passes on the wrong file — and committing first does not close it
status: suggested
suggested_by: verifier claude-opus-5 @T-092
---

T-092's own drill hit this and repaired the INSTANCE in its driver; the
notes record it. **The CLASS was not routed**, and the card's own new
bullet — *A FIX NAMES ITS CLASS AND ITS SWEEP* — is what asks for this
card. Filed by the verifier so the sweep result is not lost.

## The mechanism, measured

At `73d7870` in a detached scratch worktree, HEAD a real commit (so the
work IS committed — T-092's own new *DRILL AT A COMMIT* clause obeyed):

    git checkout 5887cd4 -- app/src-tauri/src/agent/kit.rs
    # git status --porcelain  ->  "M " (STAGED, not " M")
    # git diff --cached -- <path>  ->  4084 bytes
    git checkout -- app/src-tauri/src/agent/kit.rs      # the "restore"
    # git diff -- <path>  ->  0 bytes          <-- THE PRESCRIBED PROOF PASSES
    # shasum of the file  ->  42d65592…  (the BASE file)
    # git show HEAD:<path> | shasum  ->  6c42a704…  (the file that should be there)

`git checkout <commit> -- <path>` writes the INDEX as well as the
worktree. A following bare `git checkout -- <path>` therefore restores
**from the index**, which is the mutation's own source, and hands the
wrong file back. POISON DRILL offers two restoration proofs as
ALTERNATIVES — *"`git show HEAD:<path> | shasum -a 256` against the
working file, **or** an empty `git diff -- <path>`"* — and **the second
one reports success here.** Only the sha256-against-HEAD arm catches it.

## Why "DRILL AT A COMMIT" does not close it

The clause T-092 lands says: *"Committing first makes both proofs correct
by construction, which beats adding a third."* That is true of the REVERT
hazard it is introduced for. It is **false of this one**: the measurement
above ran with the work committed and the empty-diff proof still passed
on the wrong file. Two different mechanisms defeat the same proof, and
committing first closes only one of them.

**This is not hypothetical for this convention specifically.** Building a
before/after CONTROL — which T-092's own criteria required — means
checking a pre-fix file out of another commit, which is exactly the
command that stages.

## What would close it

- **Cheapest:** demote the empty-`git diff` arm from an alternative to a
  companion — `git show <the drill's commit>:<path> | shasum -a 256`
  against the working file is the proof, and the diff is a convenience —
  and say `git diff` alone cannot see a staged index. One clause in the
  POISON DRILL bullet.
- Or name the safe spelling beside the trap:
  `git restore --source=<commit> --staged --worktree -- <path>` for BOTH
  directions, which is what T-092's driver was repaired to, and add
  `git diff --cached` to the proof so a staged index cannot hide.

Fence it needs: `docs/CONVENTIONS.md`.
