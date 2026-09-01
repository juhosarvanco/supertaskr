---
id: T-223-s4
title: "The narrowed sentence is still an absolute — `git symbolic-ref HEAD refs/heads/main` from a lane worktree exits 0 and an ORDINARY commit then moves main — and T-211's card still carries the struck clause"
status: suggested
suggested_by: verifier claude-opus-5@subagent @V-223
---

Two prose residues of the same class, filed as one card because they are
one class: **a sentence about what a lane cannot reach, stated as an
absolute.**

## ONE — the replacement sentence over-reaches its own premise

`T-223` replaced *"main is a ref the lane cannot move"* with **"main is
the ref the lane's own COMMITS cannot move"**, and the header's reasoning
is *"committing on a lane branch advances the LANE branch"*. The premise
is conditional on HEAD naming the lane branch; the conclusion is stated
over every commit a lane makes.

Measured in a throwaway repository, git **2.50.1 (Apple Git-155)**,
Darwin 25.6.0 arm64 — `main` checked out in worktree A, the lane branch
in worktree B, both commands run from B:

    git symbolic-ref HEAD refs/heads/main   -> exit 0   (no
                                               checked-out-elsewhere guard)
    git add -A && git commit -m "…"         -> exit 0
    main moved:  9e460457… -> fe2f675b…

So an ORDINARY commit made by the lane moves `main`, once one plumbing
ref write has prepared HEAD. That is the same CLASS limit 6 discloses (a
lane rewriting a ref it should not), reached through `HEAD` rather than
through `refs/heads/main`, and the floor is unchanged for the same
reason the card gives: a seat that will do this can `--no-verify`.

**THIS IS NOT CHARGED AGAINST `T-223`'s LANE.** The card PRESCRIBED that
exact sentence in its own build step 1, and `method/tasks/TASK-FORMAT.md`
warns that *a finding is read as a unit* — an executor working from the
ask adopts the proposed remedy. The repair belongs wherever the sentence
is next edited: bind the conclusion to its premise (*"while HEAD names
the lane branch"*), or widen limit 6 from `refs/heads/<integration>` to
any ref write that decides what a commit advances.

## TWO — `T-211`'s card still carries the retracted absolute

At `58c8001`, `docs/tasks/T-211-…-guards-exist.md:29` still reads *"where
`T-212`'s gate reads it, on a ref the lane cannot move"* in its
fast-path-A prose, while that same card's own review notes (item 2)
retract it and point at `T-223`. The LAW itself —
`method/lane-protocol.md`'s fast path A — does NOT carry the absolute; it
says only *"where a legitimate widening lands"*, which is the half that
survives. **So no `method/` edit is owed**, and this is a one-sentence
append in an already-unfenceable file.

Out of `T-223`'s named scope (its card names the hook header and
`T-212`'s card), which is why it was not charged there either.
