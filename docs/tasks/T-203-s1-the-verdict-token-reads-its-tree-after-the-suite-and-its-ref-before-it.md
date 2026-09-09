---
id: T-203-s1
title: The verdict token reads its TREE after the suite and its REF before it, so a run that spans a commit mints a GREEN for a tree it never graded — `token-stale` cannot see it and the token itself shows the disagreement
feature: F-06
milestone: 4
size: S
priority: 2
status: verifying
suggested_by: "T-126-s2's executor, from its OWN token file — a killed e2e leg wrote ref=300d04b beside tree=48d50df, two commits apart, at 2026-09-02"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, .claude/hooks/gate-token.mjs, tools/e2e/tests/gate-run.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by:
review: independent
---

**THE TOKEN'S TWO IDENTIFIERS ARE READ AT DIFFERENT TIMES, AND A LONG
SUITE IS LONG ENOUGH FOR THEM TO DISAGREE.**

- `gate-run.mjs` captures `ref` with `currentRef(root)` — `git rev-parse
  HEAD` — **before** it spawns the suite (its own comment: *"The ref the
  run happened at. A count without one is not a figure."*).
- `writeToken` (`.claude/hooks/gate-token.mjs`) reads `git rev-parse
  HEAD^{tree}` **when the token is written**, which is after the suite
  finishes.

So a commit landing between those two reads produces a token whose `ref`
names the commit the suite actually graded and whose `tree` names a
LATER one. `dirty` is measured at the same late moment.

## Observed, not reasoned — this lane's own token

    "e2e": { "exit": -1, "bodies": 0, "verdict": "REFUSED",
             "ref": "300d04b…", "tree": "48d50df…" }

`300d04b`'s tree is `c5c9935`; `48d50df` is `56535cc`'s. Two commits
apart, in one token, written by one run. The e2e leg takes tens of
minutes on a loaded machine and this repository's own conventions say so
— *"On a loaded machine the e2e leg can exceed ten minutes"* — so the
window is not a corner case, it is the ordinary shape of an e2e run
beside a working seat.

## Why this defeats the refusal it was built for

`push-guard.mjs` keys on the tree being pushed, and `token-stale` means
*"wrong tree"*. A token minted this way carries the RIGHT tree by
construction — the current one — while grading an older one, so the
refusal that exists to catch exactly this cannot fire. The
`CONVENTIONS.md` remedy in the gate-runner bullet is a DISCIPLINE
(*"the battery is run LAST, after every commit"*), which is the class of
rule this repository keeps writing down and breaking; the instrument can
enforce it instead.

**THIS LANE WAS NOT BITTEN, AND THAT IS LUCK RATHER THAN SAFETY.** Its
verdict was `REFUSED reason=zero-bodies` because the run was killed, so
no false GREEN was minted. A run that had simply finished would have
written GREEN against `48d50df`.

## The repair, and it is small

Capture the tree BESIDE the ref, before the suite spawns, and hand it to
`writeToken` — the `opts.tree` parameter already exists in that module's
signature. Then either refuse (`token-unkeyed`, whose name already fits)
or record both when the tree has moved by write time, so the token can
never claim a tree the suite did not see. A body in
`tools/e2e/tests/gate-run.spec.ts` commits between the spawn and the
write and requires the token not to claim the new tree.

## Fence

`tools/e2e/scripts/gate-run.mjs` (where `ref` is captured and
`writeToken` is called), `.claude/hooks/gate-token.mjs` (where the tree
is read), and `tools/e2e/tests/gate-run.spec.ts` for the body.

## The id was checked free rather than assumed

`T-203` carries the token's own card and had **no** `T-203-s*` anywhere —
in this lane's tree or on `main` — when this was filed
(`grep -rno 'T-203-s[0-9]\+'` over `docs/ method/ tools/ .claude/`, and
`git grep -ho` on `main`, both empty). Filed under `T-203` rather than
under the filing lane's own card because `TASK-FORMAT`'s *search before
filing* puts a finding with the card that owns its class, and the class
here is the verdict token's, not the dispatch join's.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 2, at the T-126-s2 merge

The architect seat. The runner captures ref before the suite and the token tree after it, so a run spanning a commit mints a token for a tree it never graded; the push guard cannot see it. A guard-class defect. No dispatch follows today by the user's instruction.

## Implementation notes — the executor, 2026-09-09, lane `task/T-203-s1-the-token-reads-one-tree`

Base `c2a0952d34de9c986ef37f678791bded83022b36`. Fence honoured exactly:
`tools/e2e/scripts/gate-run.mjs`, `.claude/hooks/gate-token.mjs`,
`tools/e2e/tests/gate-run.spec.ts`, and `docs/tasks/`. Nothing else was
edited; `push-guard.mjs` was READ and left alone.

### The shape chosen, and why it is RECORD BOTH rather than REFUSE ONLY

The card offered either. **Recording only the graded tree is not sound**,
and that is the whole argument. Capture the tree before the spawn and
store it as the key, and `token-stale` does fire in the ordinary case —
the run ends at a later tree, the push carries that later tree, the two
disagree. But a tree that moves during a run and moves **BACK** — a
reset, a revert, an amend onto the same content — leaves the graded tree
EQUAL to HEAD's at push time, and a guard comparing one number against
one number has nothing left to look at. That is the same silent green
this card was filed about, one case narrower.

Refusing at write time without recording is the other half-measure: it
loses which tree was actually graded, which is the sentence a refused
seat needs in order to act.

So the entry carries both. `tree` is what HEAD's tree was when the suite
STARTED; the new `treeAtWrite` is what it was when the verdict was
written. `judgeToken` refuses their disagreement under the reason the
card named — **`token-unkeyed`**, whose own words are already *"the key
does not describe what its suites ran against"* — and no later movement
of HEAD can turn that back into a green. `token-stale` keeps its
meaning and its spelling; nothing was renamed.

### What moved

- **`gate-run.mjs`** — `runSuite` now reads the TREE and the DIRT beside
  the ref, before anything is spawned, and carries both on the
  `Verdict`. The new `currentTree` is deliberately a call into the
  hook's own `headTree` rather than a second spelling of
  `git rev-parse HEAD^{tree}`: the guard compares against `headTree`'s
  answer, and two readers of one fact is a shape this repository has
  paid for before. `judge` passes `tree`/`dirty` through untouched and
  judges neither — a caller with no reading of its own must not have one
  invented for it, so both are OPTIONAL and every existing `judge` call
  site still compiles and still means what it meant.
- **`gate-token.mjs`** — `writeToken` takes the tree PER VERDICT.
  `opts.tree` survives as the batch default (a fixture uses it) but the
  runner does not pass it, deliberately: `--all` runs four suites in
  sequence over tens of minutes, so ONE tree for the batch is the same
  mistake as one tree for the write, one loop further out. The dirt is
  OR-ed rather than overwritten — a tree seen dirty at either end of a
  run is dirt the key does not name. An explicit `tree: ""` from the
  runner ("git would not say") is KEPT, never silently replaced by this
  call's own reading; only an ABSENT field falls back.
- **`judgeToken`** — the `unkeyed` arm gained two clauses: an entry with
  no `treeAtWrite` is refused (the migration case — a token minted by
  the previous runner), and an entry whose two trees disagree is refused
  by name. The comparison is DERIVED from the two recorded hashes rather
  than trusted to a boolean somebody could compute wrong.

### The schema GREW and nothing was renamed

`push-guard.mjs` reads this module and was not touched. `SuiteEntry`
gained `treeAtWrite` and lost nothing; `token-stale`, `token-unkeyed`,
`token-red`, `token-unmeasured`, `token-incomplete`, `token-green` and
`GREEN` keep their exact spellings (grepped across `docs/`, `method/`,
`tools/`, `.claude/` before anything was edited — the only spec
references are fixture NAMES in `push-guard.spec.ts` and the
`token-missing` assertion at its line 1564, none of them touched).

**THE ONE COST, STATED**: a checkout holding a token minted before this
commit has entries without `treeAtWrite`, and they are refused rather
than assumed clean — the same treatment a missing `dirty` already gets,
because assuming is this card's own defect one release earlier. It costs
one battery re-run, which a push owes anyway. `tools/e2e/tests/
gate-run.spec.ts` pins that decision with a body which produces the old
shape by DELETING the field from a real token.

### The bodies, and the window is CONSTRUCTED rather than simulated

Three added, one changed, in `gate-run.spec.ts` (41 bodies at the base
→ 44 at `7de9d30`).

The two spanning bodies build a real git repository and a real
Playwright fixture whose **own test body commits into that repository**,
so the commit really lands after `runSuite` has read the tree and before
`recordVerdicts` writes it. A body that merely handed `writeToken` two
trees would have passed against the broken runner as well. Each carries
its positive control built the same way with the mid-run commit flipped
off — same helper, one boolean — so `stale` and `unkeyed` are
discriminations rather than what the judge says to everything.
`NO_BACKGROUND_MAINTENANCE` is threaded into the CHILD's git calls too
(T-178): the commit that makes the fixture interesting is exactly the
command that detaches a maintenance grandchild into the `.git` the
teardown walks.

**The changed body** is the round-trip one. It ran the fixture suite
with `root` = the fixture DIRECTORY (no `.git`) while writing the token
into a separate repository, so the runner read "git would not say" and
the writer read a different checkout's tree — two checkouts answering
for the two halves of a body whose own name says *"the tree it ran at"*.
Its `root` is now the token repository; the fixture's `cwd` is absolute
so the suite still runs exactly where it did. The mutant that makes
`currentTree` return `""` kills it, which is the proof the change is
load-bearing rather than cosmetic.

### Mutant drills — five, each RED, each restored and proved by sha256

Drilled at commits `4aa7d83` (D1–D4) and `7de9d30` (D5), restored with
`git restore --source=<commit> --staged --worktree -- <path>` and the
worktree hashed against `git show <commit>:<path> | shasum -a 256`.

| # | mutant, ONE side only | red |
|---|---|---|
| D1 | `gate-run.mjs`: drop `tree` from the `judge` call in `runSuite` — literally the BASE's runner | both spanning bodies (2 failed, 41 passed) |
| D2 | `gate-token.mjs`: record `treeAtWrite` as the entry's own tree | the `treeAtWrite` assertion + the moved-back body (2 failed, 41 passed) |
| D3 | `gate-token.mjs`: delete the tree-disagreement clause in `judgeToken` | the moved-back body ALONE (1 failed, 42 passed) |
| D4 | `gate-run.mjs`: `currentTree` returns `""` | the CHANGED round-trip body + both spanning bodies (3 failed, 40 passed) |
| D5 | `gate-token.mjs`: delete the missing-`treeAtWrite` clause, leaving the disagreement one | the migration body ALONE (1 failed, 43 passed) |

D1 is the drill's own shape the card asks for: it is the base's runner,
and the spanning bodies are RED against it and GREEN against this one.
No DATA mutant is owed — the property here is a pair of hashes computed
by code, not a corpus the suite reads.

### What is OWED AT THE MERGE and could not be done inside this fence

1. **`docs/CAPABILITIES.md` is a census short by three lines.** It is
   generated from the spec names and three names were added, so
   `npm run capabilities` (from `tools/e2e/`) is owed IN THE MERGE
   COMMIT. The file is outside this lane's fence and was deliberately
   NOT regenerated here.
2. **`docs/CONVENTIONS.md`'s one-line gloss for `token-unkeyed` now
   under-describes it** — it reads *"(tracked files were dirty when it
   was minted)"* and the reason now also covers a run that spanned a
   commit and an entry that recorded no write-time tree. Outside the
   fence; filed as `T-203-s2` and owed a sentence at the merge.
3. **GRAPH REGEN FIRES on this diff and is expected to be a NO-OP.**
   `tools/e2e/tests/gate-run.spec.ts` is a `*.ts` outside `docs/`, which
   is the trigger, and the trigger is deliberately wider than the walk.
   Every path this diff touches is under `tools/` or `/.claude/`, and
   `.supertaskrignore` excludes both (the latter root-anchored);
   `grep -c 'gate-run\|gate-token' docs/architecture/graph.json` answers
   **0** at `7de9d30`. So the graph cannot move by construction — but
   that bullet's own instruction is ASK THE GATE INSTEAD OF PREDICTING,
   and `index --check` was NOT run in this lane: it needs a cargo build
   this fence owes nothing to, and the rust leg is not owed here either
   (T-271, scoped suites for executors). It is the integrator's to run.

### Suggestions filed

`T-203-s2` (CONVENTIONS' gloss), `T-203-s3` (the verdict LINE still
carries no tree), `T-203-s4` (the residual this card does NOT close: an
edit made and reverted DURING a run is invisible to both readings).
Each names `T-203` as its class parent and carries a `touches:` line.
