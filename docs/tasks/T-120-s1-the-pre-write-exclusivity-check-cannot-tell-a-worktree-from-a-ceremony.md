---
id: T-120-s1
title: The pre-write exclusivity check reads `git status --short`, which cannot tell a parked worktree from an integrator mid-ceremony — and the hazard it warns about is not the one it has
status: suggested
suggested_by: executor claude-opus-5 @T-120
---

**T-123-s10's rule, as every brief transcribes it:** *"Before writing
anything to main, run `git status --short` there: a dirty tree or
populated index means another integrator is mid-ceremony and you wait."*

**Measured in `/Users/ujju/Projects/nputer` at main `c4cfe52`,
2026-08-25, read-only:**

    $ git status --short
    ?? tools/nputer-T-052/
    ?? tools/nputer-T-120/
    ?? tools/nputer-T-124/
    ?? z

**Four dirty lines, and NOT ONE of them is an integrator.** Three are
lane worktrees cut inside the repository instead of beside it (the
dispatcher owns that error and is recording it separately); the fourth
is the zero-byte `z` that nine consecutive checkpoints have stepped
around. Under the rule as written, every integrator tonight waits
forever, and the first one to decide the rule does not really mean it
has taught the next one to skip it.

**THE RULE WAS ALREADY BEING READ RATHER THAN RUN.** `docs/STATE.md` at
`3f9bef2` records the check passing because the tree *"showed only the
untracked `z` with an empty index"* — a human judgement that `z` does
not count, applied to a rule whose text contains no such exception. The
three worktrees did not break the check; they revealed that it had
never been mechanical.

## The check is asking a question `git status --short` cannot answer

`--short` collapses three different states into one column pair. What
the rule actually wants to know is whether a TRACKED path is staged or
modified. Two commands answer exactly that, and nothing else:

    git diff --cached --name-only    # populated index
    git diff --name-only             # dirty tracked tree

**Both empty at `c4cfe52`, measured beside the four `??` lines above.**
An untracked path is by construction not something an integrator writing
a checkpoint has produced — a checkpoint edits `docs/STATE.md` and a
card, both tracked. Untracked entries stay INFORMATIONAL: worth printing
in the checkpoint, never a reason to wait.

## AND THE STAGING HAZARD IS NOT THE ONE IT WAS NAMED AS

The dispatcher's warning was that *"a broad `git add -A` would stage
thousands of files."* **Measured, and it does not:**

    $ git add -A --dry-run          # non-mutating; index empty before and after
    warning: adding embedded git repository: tools/nputer-T-052
    warning: adding embedded git repository: tools/nputer-T-120
    warning: adding embedded git repository: tools/nputer-T-124
    add 'tools/nputer-T-052/'
    add 'tools/nputer-T-120/'
    add 'tools/nputer-T-124/'

**Git does not recurse into a nested repository.** Each worktree carries
a `.git` FILE (64 bytes, a gitdir pointer), so `git status --porcelain
--untracked-files=all` reports **4** entries, not thousands, and
`git add -A` would stage **three GITLINKS** — three submodule-shaped
entries pointing at commits no clone can fetch.

**That is a smaller blast radius and a worse failure, and it is LOUD
where the rule is quiet.** `git add` prints a warning per gitlink, so
the mistake is catchable at the moment it is made. Afterwards it is
nearly invisible: a staged gitlink shows in `git status --short` as one
`A ` line that looks like an ordinary added path.

## What to decide

1. **Replace the check's command** with the two `git diff` forms above,
   and say what `??` lines mean (print, do not wait).
2. **Say whether an untracked path can ever block a write.** If the
   answer is no, the rule gets shorter and mechanical. If the answer is
   sometimes, it needs the discriminator written down rather than left
   to each integrator's judgement.
3. **Decide whether the embedded-repository hazard is worth its own
   line** — `git add -A` is not in any spelling this project prescribes,
   and the standing discipline is already "name your paths".

**FENCE:** the rule's home file — `docs/CONVENTIONS.md` (held by T-052
at the time of writing) or `method/`, whichever owns the pre-write
check. NOT `[tools/e2e]`, which is why T-120 routed it instead of
fixing it.

**Every figure above is a LIVE-ENVIRONMENT reading**, taken in the main
checkout at main tip `c4cfe52` on 2026-08-25, and re-derivable by
running the same four commands. Nothing was written to main to obtain
them: `git status`, `git diff` and `git add --dry-run` are all
non-mutating, and the index was confirmed empty after the dry run.
