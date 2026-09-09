---
id: T-203-s1
title: The verdict token reads its TREE after the suite and its REF before it, so a run that spans a commit mints a GREEN for a tree it never graded — `token-stale` cannot see it and the token itself shows the disagreement
feature: F-06
milestone: 4
size: S
priority: 2
status: done
suggested_by: "T-126-s2's executor, from its OWN token file — a killed e2e leg wrote ref=300d04b beside tree=48d50df, two commits apart, at 2026-09-02"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, .claude/hooks/gate-token.mjs, tools/e2e/tests/gate-run.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
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

## Verdicts

### VERDICT 2026-09-09 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent (verifier, phase 2)

attack set: sha256:62f4fcbbf9f89ffddbc0660b264a347b094e3b2304ad449f887d9c9166a9287e (attack-set-T-203-s1.md)
ground truths: sha256:cbb7c6e6ba3d2a44bc149d718784b31c61738225022873aed910adcc054cd836 (ground-T-203-s1.md)

Judged at **d8d1d19** from the detached bench `../nputer-V-T-203-s1`, base `c2a0952`.
Every figure below was measured by this seat at d8d1d19 unless it names another ref.

**THE FRAME I ACTUALLY HAD.** Phase 1 wrote its attack set tool-less BY INSTRUCTION, not
by a harness that can deny tools, and this verdict says so because a later reader cannot
tell the two apart. My own brief named the tip, the base, the fence and the port, plus
ground rules about the token schema, the expected census staleness and the T-256 append
— no mutant numbers, no path counts, no suite figures, so nothing executor-derived leaked
above the line. I read the two sealed files, then `verifier.md`, STATE, ARCHITECTURE and
CONVENTIONS, then the card AT ITS BASE, then the diff — and I opened the executor's report
and the card's implementation notes only after the findings below were written.

#### The battery, at my own tip
`parser` exit 0 / **389** bodies · `app` exit 0 / **1171** · `rust` exit 0 / **651** bodies
over **18** targets · `e2e` exit 0 / **743** (740 at base + the three new). `gate-run.spec.ts`
alone: **44 passed**, exit 0 (41 at base + 3). Beside them: `npm run typecheck` exit 0,
`npm run lint:tokens` exit 0 clean, `npm run lint:docs` exit 0, `index --check` exit **0
CURRENT**. `npm run capabilities:check` exit **1 STALE** — committed 63301 bytes against a
fresh 63722, and the **421**-byte delta is the three new body names as `- <name>` bullets
TO THE BYTE, so nothing else moved in the census; the regeneration is the integrator's.

The token the bench's own runner minted carries, on all four suites, `ref` =
`d8d1d190475528a1cdfed181928a5d75f42f0846` and `tree` = `treeAtWrite` =
`635bade106972a05c79a48c5c5ed762717c5dfe5` — which is what `git rev-parse HEAD^{tree}`
answers in my hand. `git status --porcelain` was empty before and after every run.

#### The fence, and the one judgement that was mine
Eight paths. Three fenced producers, the lane's own card, three NEW `T-203-s2/s3/s4`
cards (each `status: suggested`, each with `suggested_by` and `touches:`), and one
EXISTING card, `T-256`. That last one is **17 added, 0 removed**: a new `## Corroborations`
section appended at end of file, with no existing line changed. **I judge it an APPEND —
the record left whole** — and it is permitted rather than overlooked. Nothing under
`docs/checkpoints/`, no ADR, no existing verdict touched; `docs/CAPABILITIES.md` never
appears in the name list.

Base's 41 test names are a strict SUBSET of the tip's 44: none deleted, none renamed, no
`.skip`/`.fixme`/`.only`. One EXISTING body's ARRANGEMENT moved — body 38's
`runSuite(fixtureSuite(dir), { root: dir })` became `{ root: repo }` — with its name and
every assertion unchanged. **I measured that change rather than accepting its comment**:
at the tip, under the OLD arrangement, body 38 FAILS with *Expected: "fresh" / Received:
"stale"*, because `dir` is not a git checkout, so the runner reads `tree=""` and
`dirty=true` and the entry is permanently stale. The change was forced by the fix and is
a STRENGTHENING, not a weakening to fit: under the old arrangement the body's own name was
false, since the entry's tree came from the WRITER's repository and never from the root
the runner ran against. It still discriminates — mutant M9 kills it.

#### The controls, each shown where its arming was ABSENT
**C1 — base runner, tip spec.** Base `gate-run.mjs` + base `gate-token.mjs` with the tip's
spec: **3 failed / 41 passed**, exit 1, and the three failures are exactly the three new
bodies. The text is the card's own defect:

    Error: the runner reads the tree BEFORE it spawns
    Expected: "76e42febe34e4fac3aa1cafc31cec201f0b828e0"
    Received: undefined

and on the entry, `Received: "4b91fed33a120f1e61fa03cc23627c3f660c9f89"` — the writer's
late tree in place of the graded one. Both files restored, sha256 MATCH.

**C2 — no commit in the window.** The bench's own complete four-suite token, handed to the
REAL `push-guard.mjs` `decide`: **allow**, with the token arm SILENT (a fresh token says
nothing, by that file's own rule) and `graph-current` as the fall-through. No spurious
refusal.

**C3 — guard compatibility.** Against a fixture checkout the guard recognises, with the
graph, cheap-check and CI arms stubbed and the REAL holder: a tip-minted coherent token →
**allow**; the base-era live token bytes VERBATIM (ground G9) → **block `token-stale`**,
read cleanly; the same base-era shape re-keyed to that tree so the missing field is the
only objection → **block `token-unkeyed`**, naming it. No crash and no shape rejection on
any leg. `readToken` is untouched and `TOKEN_VERSION` is **1 at both refs**, so the schema
growth is purely additive and an old token still parses; the reason-code set is
byte-identical base to tip — `token-green/incomplete/missing/red/stale/unkeyed/unmeasured`,
none renamed, none removed, none added.

*(Disclosed: my first run of the C3 driver threw a TypeError. The stack put it in MY stub
— a `holder` returning `undefined` where the guard's contract is `{state}` — not in the
guard. Re-run with the real `holderVerdict`, every leg answered cleanly.)*

#### The drill — kill-set containment, and the site the property lives
Each mutation was READ BACK from `git diff` before its run and restored with a sha256
proof against HEAD's blob.

| mutant | site | kills |
|---|---|---|
| M1 drop `tree` from the runner's `judge` call | gate-run.mjs | 42, 43 |
| M2 re-read the tree AFTER the spawn | gate-run.mjs | 42, 43 |
| M3 `tree: batchTree` — writer precedence flip | gate-token.mjs | 42, 43 |
| M4 drop `tree, dirty` from `refuse()` only | gate-run.mjs | **none — 44 passed** |
| M5 `atWrite !== atWrite` | gate-token.mjs | **43 only** |
| M6a `\|\|` → `&&` in the missing-field branch | gate-token.mjs | **44 only** |
| M6b rename the `token-unkeyed` code | gate-token.mjs | 43, 44 |
| M8 `dirty: batchDirty` — drop the early half | gate-token.mjs | **none — 44 passed** |
| M9 disable the STALE arm | gate-token.mjs | 38, 42 |

Neither of bodies 42 and 43 contains the other: M9 lies in kill(42)\kill(43) and M5 in
kill(43)\kill(42); body 44 is separate again (M6a). M5 and M6a each produce a failing-body
count of exactly ONE, which is shape SIX's own asking. Something died at BOTH sites the
property lives — the ordering in `gate-run.mjs` (M1, M2) and the precedence in
`gate-token.mjs` (M3) — so the drill is aimed and not merely accounted.

**The DATA mutant (T-221's rule; the property lives in the token).** Hand-authored tokens,
the guard run directly against each:
- the BASE writer's own shape for a spanning run (`ref`=A, `tree`=B, no `treeAtWrite`) →
  **block `token-unkeyed`**. The defect's own specimen shape is now refused.
- the FIXED writer's shape for that same run (`tree`=A, `treeAtWrite`=B), pushed at B →
  **block `token-stale`**. The refusal the card said could not fire, firing.
- a FORGED but internally coherent token (`tree`=`treeAtWrite`=B, `ref`=A) → **allow**.
  Named as the honest residual and routed to `T-203-s5`.

#### Security sweep — mandatory, over everything that moved
Every git call in the new spec code is `execFileSync` with an argv ARRAY: no shell, no
interpolation into a command line, and `gitIn` spreads `NO_BACKGROUND_MAINTENANCE`. The
generated child fixture embeds only `repo` and `maint`, both through `JSON.stringify`.
Every repository the new bodies commit into is a `mkdtempSync` temp dir built by
`tokenRepo` with `git init -q -b main` — CONVENTIONS' PIN THE DEFAULT BRANCH rule — and a
LOCAL `user.email`/`user.name`, so it needs no host git identity, which is the T-239-s4
lesson honoured. **Measured rather than reasoned**: the bench's `git status --porcelain`
was EMPTY before and after every one of the twelve suite runs and `git log` never moved —
no stray commit, no dirt, nothing written to the host repository. No new dependency: the
spec's import block is byte-identical base to tip. Nothing is executed from data. The docs
gate's injection scan reports 0 hits in 0 of 5 docs paths against 7 patterns. No secrets,
keys, endpoints or authz surface anywhere in the diff.

#### Adjacent features
The eight out-of-fence `writeToken` callers — `landing-gate.spec.ts:279` and seven in
`push-guard.spec.ts` — are unedited and all GREEN inside the 743-body e2e leg, so the
signature's blast radius is closed empirically rather than by reading.

**One behaviour change is disclosed, and it is in the safe direction**: `dirty` is now
OR-ed across BOTH ends of a run, so a battery that started dirty and ended clean now
refuses where it previously passed. That is intended, it is stated in the writer's own
header, and nothing asserts it — which is correction 2.

#### The corrections
Both are about instruments for behaviour the lane added BEYOND the card's letter. The
card's own criteria are met: the tree is captured beside the ref before the spawn, the
entry records both trees, and a body commits between the spawn and the write and requires
the token not to claim the new tree.

**CORRECTION 1 — the REFUSAL path's pre-spawn readings are unfenced.** `runSuite`'s
`refuse()` closure correctly carries `tree` and `dirty`, but **mutant M4 removes them and
all 44 bodies pass**. This is the path the card's OWN EVIDENCE came from: its specimen is
`{"exit": -1, "bodies": 0, "verdict": "REFUSED", "ref": "300d04b…", "tree": "48d50df…"}`.
THE BODY THAT PINS IT: drive a cd-guard refusal — which spawns nothing, so it is cheap
enough to be a body — and assert the REFUSED verdict carries the pre-spawn tree and dirt.
CHECKED BY ME against an implementation that lacks the property: that body is GREEN at
d8d1d19 and RED under M4, where it reports `tree` and `dirty` as `undefined`.

**CORRECTION 2 — the early/late `dirty` OR is unfenced.** `writeToken`'s
`dirty: v.dirty === true ? true : batchDirty` is the whole of the widening above, and
**mutant M8 reduces it to `dirty: batchDirty` and all 44 bodies pass**. THE BODY THAT PINS
IT: a repository DIRTY when the run starts and CLEAN by the time the token is written —
the one arrangement only the early reading can see — asserting the entry keeps
`dirty: true` and that `judgeToken` refuses it `token-unkeyed` naming the dirt. CHECKED BY
ME: GREEN at d8d1d19, and under M8 the entry's dirt drops to `false` and the judgement
falls from `unkeyed` to `unmeasured`.

Neither correction touches a file outside the existing fence.

#### Re-derived AFTER the findings above were written — the report, the notes, the messages

The executor's report, the card's implementation notes and all four commit messages were
opened only at this point. Every figure in them that I could re-measure, I did.

**Agreeing, at my own tip**: base `c2a0952` (`git merge-base main HEAD` answers it, so the
report is right to correct the brief's row 4); tip tree `635bade1…`; parser **389**, app
**1171**, e2e **743**; `lint:tokens` clean at **182** TOKEN files and **1345** CONTROL
files; `capabilities:check` **63301 → 63722**; the docs gate FIRING and naming exactly
three suites; `push-guard.spec.ts` at **86** bodies; `forbidOnly: true` set; `grep -c` over
`graph.json` answering **0**. The two restoration hashes the report prints —
`937ca5b4…eedda` for `gate-run.mjs` and `27ee685e…6dd0` for `gate-token.mjs` — are
byte-for-byte the ones I computed independently from `git show d8d1d19:<path>`, so its
drills really were restored. Its drill results reconcile with mine once each is read at
the ref it was taken at: D1 = my M1, D3 = my M5 (the moved-back body ALONE), D5 = my M6a
(the migration body ALONE), each with 43 bodies at `4aa7d83` and 44 at `7de9d30`.
The `T-256` corroboration's central claim is true against the live lane: that worktree's
`app/package-lock.json` really is mode `-r--r--r--`.

**Four things to record.**

1. **The report's own tally is wrong and its list is right.** It says *"Files moved — 7"*
   and *"`docs/tasks/` (4)"*; `git diff --name-only c2a0952..d8d1d19` returns **8**, of
   which **5** are under `docs/tasks/`. The enumeration beside those numbers names all
   five correctly, so this is CONVENTIONS' *CITE THE SHAPE, NOT THE TALLY* exactly. It is
   confined to the scratch report — **the card's implementation notes carry no such
   count**, so nothing wrong enters the tree and there is nothing to correct.
2. **Two gates the report left open are now closed, by me, at d8d1d19.** It records
   `index --check` as NOT RUN and owed to the integrator: I ran it, **exit 0, CURRENT**
   (1198600 bytes, 201 files, 2560 symbols, 2453 edges), so its prediction that the regen
   is a no-op is confirmed by the gate rather than by the derivation. It records `rust` as
   not run and not owed: the docs gate indeed does not name cargo, and I ran it anyway —
   **exit 0, 651 bodies over 18 targets, GREEN**.
3. **I disagree with one of its judgements, and my measurement settles it.** The report and
   the notes both state *"No DATA mutant is owed — the property here is a pair of hashes
   computed by code, not a corpus the suite reads."* The property lives in a FILE that a
   SEPARATE PROCESS reads and never in the writer's memory: `push-guard.mjs` only ever
   sees `.supertaskr/gate-verdict.json`. A data mutant was owed, I ran one, and it is the
   only thing in this pass that demonstrated the purpose clause reaching downstream —
   including the single most valuable result here, that the shape the OLD writer minted
   for a spanning run is now REFUSED. The code is right; the reason for skipping the
   mutant is not. Not a correction, because nothing is wrong with the work — recorded so
   the next reader does not inherit the rule.
4. **A minor one, in the tree.** The notes cite *"the `token-missing` assertion at its line
   1564"*. That line is correct today — I checked — but CONVENTIONS' *A CITATION NAMES A
   SYMBOL, NOT A LINE* rules against exactly this, and it will drift silently. Too small
   to hold a merge; named so it can be fixed if the card is touched again.

**The id check, re-run at my own ref, because main moved under it.** The report says
`T-203-s2/s3/s4` were checked free with `git grep -ho` on main returning only `T-203-s1`.
At my ref main is `89f23ca` and that grep returns `T-203-s1` AND `T-203-s2` — but there is
**no collision**: `git ls-tree -r --name-only main -- docs/tasks/` shows `T-203-s1` as the
only `T-203-s*` CARD on main, and the `s2…s4` hits are inside a checkpoint record written
after this lane began, describing this lane's own output. The ids are free; the report was
true when it looked.

#### One suggested card filed, and it is not a failure
`T-203-s5` — `ref` and `tree` are two separate `git` invocations and nothing ever compares
them, so an entry can name a commit and a tree from different commits and the guard allows
it (M7c). It is a residual rather than a defect, and the direction is the point: the suite
spawns after BOTH reads, so a commit landing between them leaves the KEY correct and only
`ref` — a field the guard never reads — stale. `T-203-s1`'s purpose clause holds.
