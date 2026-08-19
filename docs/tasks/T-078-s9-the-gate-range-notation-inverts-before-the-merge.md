---
id: T-078-s9
title: The gate bullets' range rule is right for the integrator and backwards for the executor they also instruct — applied literally pre-merge it fires both gates on a docs-only branch
status: suggested
suggested_by: executor claude-opus-5 @T-078-fix
---

`docs/CONVENTIONS.md`'s BOOT GATE bullet states, in bold, a rule GRAPH
REGEN then cross-references so it is stated once for both:

> **and "the merge's diff" means `<main-before-the-merge>..HEAD`, NEVER
> `<merge-base>..HEAD`; SIX consecutive integrators have derived this the
> hard way**

**That is correct AT the merge and inverted BEFORE it** — and the same
bullet, twenty lines down, explicitly puts an executor in the "before"
case:

> THE EXECUTOR RUNS IT TOO, on the same trigger, before handing off
> (T-046 criterion 6)

At the merge, `HEAD` is the MERGE COMMIT, which contains both parents.
`<merge-base>..<merge commit>` therefore does carry everything main did
in the meantime — the bullet's reasoning and its T-027 example (9 files
vs 36) are exactly right. Before the merge there is no merge commit:
`HEAD` is the branch tip, `git diff main HEAD` is a SYMMETRIC comparison
of two divergent tips, and main's own newer work appears **in reverse**,
as though this branch had modified it.

**Measured on T-078's own branch, which is nine `.md` files under
`docs/` and nothing else:**

| range, as an executor would run it | paths | BOOT GATE | GRAPH REGEN |
|---|---|---|---|
| `git diff main HEAD` (the bullet's notation, two-dot) | **44** | **FIRES** (5) | **FIRES** (13) |
| `git diff main...HEAD` (three-dot = merge-base..HEAD) | 9 | 0 | 0 |
| `git diff main <merge-tree>` (what the merge really adds) | 9 | 0 | 0 |

The 18 non-docs paths in the first row are all `M`, and all of them
belong to T-043 (five `.rs`) and T-076 (thirteen `.ts`), merged into main
while this lane was open. **A docs-only branch is reported as having
rewritten a Rust crate and the parser library** — the same lie the bullet
was written to prevent, produced by following the bullet.

The third row is the one that settles it, and it needs no merge commit:

    T=$(git merge-tree --write-tree main HEAD)
    git diff --name-status main $T      # exactly the nine docs/ files

`git merge-tree --write-tree` (git 2.38+; 2.50.1 here) builds the merged
tree read-only, so the true "what this merge adds to main" is available
BEFORE the merge, to executor and integrator alike, and it is
conflict-aware where the three-dot form is not.

**Why this has stayed invisible.** The bullet notes the distinction "has
never yet changed WHETHER the gate fires — both derivations fired all six
times". Every case so far has been a code lane, where the gate fires under
any reading. A DOCS-ONLY lane is the first case where the readings
disagree about the verdict itself rather than about the file count, which
is why it surfaces now.

**The ask.** One clause in the BOOT GATE bullet, inherited by GRAPH REGEN
through the existing cross-reference: name the range by what it is rather
than by a notation whose meaning depends on whether `HEAD` is a merge
commit. *The gate's diff is what the merge ADDS to main. At the merge
that is `<main-before-the-merge>..<the merge commit>`; before the merge
it is `git diff main...HEAD` (three-dot), or `git merge-tree
--write-tree` for the conflict-aware form. `git diff main HEAD` (two-dot)
is NEVER right on an unmerged branch — it shows main's own newer work in
reverse.* The existing prohibition on `<merge-base>..HEAD` stays exactly
as it is for the integrator; it simply is not a rule about the pre-merge
case, and today it reads as though it were.
