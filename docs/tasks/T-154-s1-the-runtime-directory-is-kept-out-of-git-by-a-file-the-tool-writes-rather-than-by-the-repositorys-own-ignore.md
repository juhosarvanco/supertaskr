---
id: T-154-s1
title: The runtime directory is kept out of git by a file the tool writes, rather than by the repository's own ignore
feature: F-04
milestone: 4
priority: 6
size: S
status: planned
blocked_by: []
touches: [.gitignore, tools/e2e]
suggested_by: executor claude-opus-5 @T-154
builder:
verifier:
built_by:
verified_by:
review:
---

**PROMOTED at the first standing triage, 2026-08-30.**

Re-derived at this ref and HOLDS, unchanged from the card's own
derivation: `grep -n nputer .gitignore` returns nothing, and
`git check-ignore -v .nputer/lane-fence.json` exits 1. The runtime
directory is kept out of git only by a `.gitignore` the tool WRITES into
`.nputer/` itself — so the repository's own ignore rules do not know
about it, and the protection exists only after the tool has run once.

**THE CARD'S OWN GUARD RAIL IS CARRIED AS A CRITERION, BECAUSE THE
OBVIOUS EDIT IS THE WRONG ONE.** Adding the line to the root
`.gitignore` must NOT remove the writer (`writeLaneFence` in
`tools/e2e/scripts/lane-fence.mjs`) or `lane-fence.spec.ts`'s
`check-ignore` body. The tool-written file protects a checkout that has
not yet been configured, which is a different guarantee from the
repository's own ignore and not a duplicate of it — this is one fact
protected twice on purpose, and deleting either arm silently narrows the
guarantee.

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

## CORROBORATION, 2026-09-02 — a THIRD writer joins `.nputer/`, and the self-ignoring shape was measured sufficient for it

T-238 added `.nputer/holder.json` — the record of which session holds the
integration checkout — beside this directory's fence manifest and verdict
token. It takes the same protection the same way, and by the SAME CODE:
`writeHolder` in `tools/e2e/scripts/checkout-currency.mjs` calls
`armRuntimeDir` (`.claude/hooks/gate-token.mjs`) rather than spelling an
ignore string of its own, so this directory now has three writers and
still ONE ignore string, imported from one home.

**MEASURED, in a repository NOBODY armed** — the state this card is about
— at `e881a5c` on Mac.lan, by
`the holder record is un-committable by construction, in a repository
nobody armed` in `tools/e2e/tests/checkout-currency.spec.ts`: a fresh
`git init` fixture reads `git status --porcelain` EMPTY before the write
and EMPTY after it, while an ordinary file written beside it in the same
breath IS reported. So the self-ignoring shape SUFFICES for the third
writer, and this card's one-line root-`.gitignore` fix remains a
tidiness improvement rather than a hole.

**WHAT THIS DOES TO THE CARD'S GUARD RAIL: it widens it by one.** The
"WHAT NOT TO DO" paragraph names the manifest writer; whoever takes this
card must now check THREE writers before removing any of them, and the
count is derivable rather than transcribed —
`git grep -n armRuntimeDir` names every caller at your own ref.
