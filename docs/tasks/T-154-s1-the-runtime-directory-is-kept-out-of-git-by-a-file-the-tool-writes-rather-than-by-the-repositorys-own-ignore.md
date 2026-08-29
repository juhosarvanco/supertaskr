---
id: T-154-s1
title: The runtime directory is kept out of git by a file the tool writes, rather than by the repository's own ignore
status: suggested
suggested_by: executor claude-opus-5 @T-154
---

`.nputer/` is this project's runtime directory — ADR-017 confines
app-side writes to it, `kit.rs` materialises the genesis kit under it,
and since T-154 the dispatch step writes `.nputer/lane-fence.json` into
every lane worktree. **The repository's own `.gitignore` does not
mention it** (derive: `git check-ignore -v .nputer/lane-fence.json`
exits 1 at `3607a94`), so without help the manifest is an untracked file
in every lane and one `git add -A` commits it.

T-154 closed that with a `.gitignore` containing `*` written INTO
`.nputer/` by the writer itself — see `writeLaneFence` in
`tools/e2e/scripts/lane-fence.mjs`. That works and it is proved by
`lane-fence.spec.ts`'s *"the manifest cannot be committed into the tree
everyone else reads"*, which asks `git check-ignore` rather than
asserting about the file. But it is the wrong HOME for the rule: the
repository's own ignore list is where a reader looks, the tool's
`.gitignore` only exists after the tool has run once, and any future
`.nputer/` writer has to remember to re-create it.

**THE FIX IS ONE LINE** — `.nputer/` in the root `.gitignore` — and it
was outside T-154's fence (`[.claude/, tools/e2e,
method/lane-protocol.md, docs/CONVENTIONS.md]`), which is why this is a
suggestion rather than a commit.

**WHAT NOT TO DO WHEN TAKING IT:** do not delete the writer's own
`.gitignore` in the same move without checking the consequence. The
manifest reaching the integration branch is the guard's worst failure —
every checkout would then carry ONE lane's fence, permanently stale —
and belt-and-braces is cheap here. If it is removed, the spec body above
must be moved to the root ignore or it goes vacuous.
