---
id: T-084-s6
title: An empty path list makes the DOCS GATE report "not owed" at exit 0 — the documented xargs invocation turns a failed range into a green gate
status: rejected
suggested_by: verifier claude-opus-5 @T-084-verify
---

`tools/e2e/scripts/docs-gate.mjs` with NO arguments exits **0** and
prints *"no path under docs/ in this diff — this gate is not owed"*.
That is a claim about a diff it was never shown.

The invocation the script's own header documents is

    TREE=$(git merge-tree --write-tree <main tip> HEAD)
    git diff --name-only <main tip> "$TREE" | xargs node tools/e2e/scripts/docs-gate.mjs

and `xargs` on macOS runs the command once with no arguments when its
input is empty. So a `git diff` that fails — a bad `$TREE`, a
substitution that ate a conflict, a typo'd tip — feeds nothing down the
pipe and the gate answers "not owed" in the same words it uses for a
genuinely code-only diff. **Silence is the outcome this card exists to
remove**, and this is the one path where the gate produces it about
itself.

The frontmatter half still runs and still reds on a bad card, so the
failure is confined to the SUITES half — but that is the half the
integrator reads.

**The cheap fix is one branch**: zero paths is `usage` (exit 2, the
meaning `index --check` gives it), or at minimum a distinct line —
*"0 paths supplied; this is not a claim about any diff"* — so "you gave
me nothing" and "your diff touched no docs" stop looking identical.
`xargs -r` is not portable to BSD xargs, so the guard belongs in the
script.

A second, smaller arm of the same shape: `xargs` may split a long path
list across several invocations, each seeing a subset. Nothing on this
tree is near the limit, and the per-path answers stay correct, but the
summary line ("N derived docs readers…") would print once per batch.
