---
id: T-203-s5
title: "`ref` and `tree` are two separate `git` invocations and nothing ever compares them, so a token entry can name a commit and a tree from different commits — the incoherent pair `T-203-s1`'s own specimen shows, narrowed onto the non-key field"
feature: F-06
milestone: 4
size: S
priority: 9
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-203-s1 phase 2, from a DATA mutant run against push-guard.mjs at d8d1d19, 2026-09-09"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, .claude/hooks/gate-token.mjs, tools/e2e/tests/gate-run.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding — measured, not reasoned

`T-203-s1` moved the tree read to sit BESIDE the ref, before the spawn.
`runSuite` now does this:

    const ref = currentRef(root);     // git rev-parse HEAD
    const tree = currentTree(root);   // git rev-parse HEAD^{tree}
    const dirty = trackedDirt(root);  // git status --porcelain

Three separate `git` processes. The window between them is microseconds
rather than the minutes an e2e leg takes, so this is a very large
improvement — but it is not zero, and **nothing anywhere compares the
two hashes afterwards**. `judgeToken` reads `entry.tree` and
`entry.treeAtWrite`; it never asks whether `entry.tree` is the tree
`entry.ref` actually names.

**DEMONSTRATED with a DATA mutant** (`T-221`'s rule — the property lives
in the token, so the mutant is a token). A hand-authored entry with
`ref` = commit A, `tree` = `treeAtWrite` = commit B's tree, `verdict:
"GREEN"`, handed to the real `push-guard.mjs` `decide` at commit B:
**allowed**. That is an internally coherent lie, and the guard has no
term that could catch it. Two sibling plantings in the same drill were
both refused — the base writer's shape for a spanning run (`token-unkeyed`)
and the fixed writer's (`token-stale`) — so the allow is specific to this
shape rather than the guard being blind generally.

## Why it is a RESIDUAL and not a defect in `T-203-s1`

The direction matters and it is worth stating precisely, because it is
the opposite of what the parent card was about.

The suite spawns AFTER both reads. So if a commit lands between them,
the suite genuinely runs against the LATER content, and `tree` — the
key — is **correct**. It is `ref` that is stale, and `ref` is a record
field: `push-guard.mjs` keys on the tree and never reads the entry's
ref at all. So the residual costs a reader's account of which commit was
graded; it does not cost a refusal. `T-203-s1`'s purpose clause holds.

The forged case is likewise out of the parent's threat model: the token
is written by the runner in the checkout it grades, `.supertaskr/` is
uncommittable by construction (`T-203`'s own argument), and nothing
hostile is expected to author one.

## The shapes available, so triage is not starting cold

- **DERIVE THE TREE FROM THE REF** — one `git rev-parse ${ref}^{tree}`
  in place of a second independent `HEAD` read. Atomic by construction:
  there is no window left because there is only one question asked. The
  cost is that `currentTree` stops being a call into the hook's own
  `headTree`, which `T-203-s1` chose deliberately so that the runner and
  the guard cannot disagree about what HEAD's tree is — so this shape
  trades one named hazard for another and the trade needs arguing, not
  assuming.
- **A COHERENCE CLAUSE IN `judgeToken`** — refuse an entry where
  `rev-parse(entry.ref)^{tree}` is not `entry.tree`. It catches the
  forged case too, and it is the only shape that does. The cost is a
  `git` call per suite inside a hook that loads on every Bash tool call,
  which that file's own header rules against; it would have to be
  confined to the push path.
- **RECORD AND CLOSE** — the honest option. The window is microseconds,
  the field is not the key, and a residual written down is not a defect.

## Class parent

`T-203` — the verdict token. Sibling to `T-203-s4`, which is the same
question about the WORKING TREE where this one is about the COMMIT.

## Disposition hint

Lowest tier, beside `T-203-s4`, and "accepted, closed" is a legitimate
outcome. If it IS taken, the second shape is the one worth the money,
because it is the only one that answers the forged case — and it owes a
DATA-mutant body, since a code mutant cannot grade a property that lives
in a token somebody else wrote.
