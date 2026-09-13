---
id: T-052-s2
title: Three lane worktrees sit inside the repository, and the mechanism that put them there is a relative path nobody verified
status: parked
suggested_by: executor claude-opus-5 @T-052
---

**Derived from `git worktree list` at T-052's tip, not reported to it.**
Three live lanes are checked out UNDER the repository root:

    /Users/ujju/Projects/nputer/tools/nputer-T-052   task/T-052-two-checkouts
    /Users/ujju/Projects/nputer/tools/nputer-T-120   task/T-120-regression-pin
    /Users/ujju/Projects/nputer/tools/nputer-T-124   task/T-124-adapter-spelling

`method/lane-protocol.md` rule 3 says a worktree is *"a sibling
directory, never a path inside the repository"*, and CONVENTIONS spells
this project's form as `../nputer-T-NNN`, *"a sibling of the repo root
and never a path inside it"*. Two other live lanes (T-033, T-110) and
the new `../nputer-app` are correctly placed, so this is a slip in
three dispatches rather than a changed convention.

**THE MECHANISM IS NAMED AND IT IS NOT CARELESSNESS.**
`git worktree add ../nputer-T-NNN …` typed while the dispatching shell
sits in `tools/e2e` resolves to `tools/nputer-T-NNN`. `git` has no
opinion about where a worktree goes and prints no warning, so the rule
is broken by the same command that obeys it, and the only difference is
a working directory nobody checked. T-052 wrote the remedy into rule 3
as a clarification — state the path ABSOLUTELY, or verify the cwd — but
prose is what rule 3 already was.

## What it actually costs, measured rather than feared

**Nothing is polluted; the exposure is the STAGING surface.** Verified
at T-052's own ref:

- the GRAPH never walks them — `tools/` is `.nputerignore`d, and
  `index --check` answers CURRENT;
- the token lint's CONTROL corpus is `git ls-files`, so untracked copies
  are invisible to it, and TOKEN's roots are `app/src`, `app/test` and
  `tools/e2e` rather than `tools/`;
- the parser's live-docs walk is `docs/tasks` and
  `docs/architecture/components` under the repo root, which these are
  not.

What DOES change is `git status --short` in the main checkout: it
returns `?? tools/nputer-T-052/`, `?? tools/nputer-T-120/`,
`?? tools/nputer-T-124/` beside the long-standing `?? z`. That is the
exclusivity check `T-123-s10` asks every integrator to read BEFORE
writing anything — one commit old at this filing and already returning
four rows where its own worked example returned one. **And a `git add -A`
or `git commit -a` in the main checkout would stage a second complete
copy of the project, three times over.**

## Two arms, and they are independent

1. **RELOCATE THEM** — an environment action, not a code change, and it
   must not happen under a live lane: moving a worktree out from under a
   running session is the same class of act this card exists to forbid.
   Whoever cuts lanes owns this.
2. **GATE IT** — `git worktree list` is already the fence authority this
   project reads at every dispatch and every checkpoint, and "no entry
   resolves inside the repository root" is a one-line assertion over it.
   T-110's lane reader is the natural home if it lands; otherwise a spec
   under `tools/e2e`. Fence `[tools/e2e]` or `[app-dispatch]`.

**THIS IS T-052's LADDER RUNG 9 WITH AN AUTHOR.** That rung is a
`zz-scope-probe.ts` in the main checkout whose writer is unknown — and
the card says the anonymity *"is itself the argument for writing the
rule down"*. This instance has a known author, a known mechanism and a
measured blast radius, which makes it the better worked example of the
two and the reason the rule is now written with a remedy attached.

Amnesty triage 2026-08-29 (triage seat): PARKED — arm 1 is discharged by the environment: git worktree list at this base shows every live entry outside the repository root (two lanes, the app checkout, two scratch trees), so the three misplaced worktrees this card names are gone. Arm 2 — the one-line assertion that no entry resolves inside the root — is unbuilt, and it is the durable half. RESURFACES: the next tools/e2e or app-dispatch dispatch; the lane reader already walks git worktree list, so the assertion is one predicate on a list it holds.
