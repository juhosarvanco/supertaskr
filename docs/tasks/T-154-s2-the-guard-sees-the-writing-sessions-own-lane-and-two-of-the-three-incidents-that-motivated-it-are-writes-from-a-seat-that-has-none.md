---
id: T-154-s2
title: The guard sees the writing session's own lane, and two of the three incidents that motivated it are writes from a seat that has none
feature: F-04
milestone: 4
priority: 4
size: M
status: verifying
blocked_by: []
touches: [.claude, tools/e2e, docs/CONVENTIONS.md]
suggested_by: executor claude-opus-5 @T-154
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
verified_by:
review: independent
---

**PROMOTED at the rulings sitting (2026-08-30): @human ruled lane-less
seats' writes IN SCOPE.** A write from a checkout that is not a lane
(the integration checkout above all) to a path some LIVE lane's
manifest reserves is refused mechanically — with the carve-outs the
ruling names, stated as criteria, not left to the hook's judgement:
`docs/tasks/` stays unfenceable, a card's own file is outside every
fence, and the integration seat's ordinary writes (docs/STATE.md,
docs/checkpoints/, the dispatch and closing stamps) are never a lane's
to veto. `review: independent` per TASK-FORMAT — the builder of a cage
is not its inspector. The cost question below (a hook reading sibling
worktrees on every write) is the executor's to measure and the card's
to answer honestly; a guard too slow to keep on is the gate nobody
runs, and saying so with a measurement is an acceptable outcome.

**T-154's spec paragraph and T-154's redesigned mechanism do not cover
the same set, and the difference is not a defect in either — it is a
gap that wants its own card.**

The card opens: *"Three logged incidents would have been blocked
mechanically: `db4c903` (an architect edit inside T-138's held fence),
T-126's breach (verdict `de05430` …), and the architect session's
2026-08-29 report ('I edited a file a live lane held')."*

The mechanism it then specifies — and which landed — arms on the
**WRITING session's own branch**: `decide` in
`.claude/hooks/lane-fence.mjs` settles lane-ness from the checkout's own
HEAD before it looks for a manifest, and a checkout that is not on a
`task/T-NNN-…` branch is allowed. That is deliberate and load-bearing:
it is the positive control the card's own second criterion requires, and
it is what keeps a stray manifest from ever locking an integrator out.

**But an architect editing a file inside a live lane's fence is doing it
FROM THE INTEGRATION CHECKOUT**, which is not a lane, so this guard
stands aside — correctly, by its own rules. It blocks an executor
reaching OUT of its fence. It does not block a seat with no fence
reaching IN. Two of the three incidents the card cites are the second
shape; T-126's breach is the first, and that one is covered.

## What the second shape would take

Not a variation on this hook — a different question. The hook would have
to know **every live lane's** fence, not its own: read
`git worktree list --porcelain`, filter on the branch (the spelling
`laneSpellings` publishes), read each lane's own
`.nputer/lane-fence.json`, and refuse a write in the integration
checkout to any path some other lane's manifest reserves. Every piece
exists — `lanesFrom` and `knownPathOracle` in
`tools/e2e/scripts/dispatch-order.mjs` already do the lane half for the
board — but a hook that reads sibling worktrees on every keystroke is a
different cost and a different failure surface from one that reads one
file, and the zero-dependency budget that makes v1 work at all would
have to stretch to a `git` subprocess or to walking `.git/worktrees/*`
by hand.

**IT ALSO NEEDS A RULING BEFORE IT NEEDS CODE.** A seat in the
integration checkout writes there legitimately and constantly — the
dispatch stamp, the checkpoint, the closing stamp, `docs/STATE.md` —
and `method/lane-protocol.md` rule 5's carve-outs (`docs/tasks/` is
unfenceable, a card's own file is outside every fence) were written for
a LANE reading its own fence, not for a third party reading someone
else's. Which of an architect's ordinary writes a live lane may veto is
a question for triage, and answering it in a hook would be the hook
deciding it.

Filed rather than built: T-154's fence reached `.claude/` and
`tools/e2e`, so the code was reachable and the RULING was not.

## Implementation notes
<!-- executor appends before finishing -->

### Understanding, confirmed before touching anything

I am extending `.claude/hooks/lane-fence.mjs` so that the seat with NO
lane is seen: after `decide` settles that the writing checkout is not on
a `task/T-NNN-…` branch — the arm that today allows unconditionally —
the hook learns EVERY LIVE LANE'S fence and refuses a write to a
repository-relative path some live lane's manifest reserves, with the
ruling's carve-outs applied as stated criteria and never as the hook's
judgement: `docs/tasks/` (taken from each manifest's own
`alwaysWritable`, which is the parser's `UNFENCEABLE_PATHS`), a card's
own file (each manifest's `excluded`), and the integration seat's
standing writes, `docs/STATE.md` and `docs/checkpoints`. The lane arm
is left BYTE-IDENTICAL — a checkout on a task branch keeps exactly its
current behaviour, which is the card's own condition — and v1's
positive control is preserved in both directions: a manifest is only
ever consulted for a checkout whose own HEAD is a lane branch, so a
stray manifest still locks nobody out, and every refusal in the new arm
rests on a POSITIVE, readable reservation. The learning is a
zero-dependency walk of git's own worktree administration
(`<common>/worktrees/*/HEAD` + `gitdir`) rather than a `git worktree
list` subprocess, and I measure both rather than asserting either,
because the cost question is this card's to answer honestly and a guard
too slow to keep on is the gate nobody runs. My fence is
`[.claude, tools/e2e, docs/CONVENTIONS.md]`; `method/lane-protocol.md`
rule 5's own sentence about a lane-less seat is OUTSIDE it and is
routed rather than edited, exactly as T-154 routed its rule-5 text.
`docs/tasks/` is writable for these notes and the suggestions I file. I
do not stamp `done`: `review: independent`, so this lane stops at
`verifying`.

### What landed

**ONE FUNCTION, TWO SEATS, AND THE TWO ARE NOT THE SAME RULE.**
`decide` still settles lane-ness FIRST and from the branch alone; what
changed is what happens on the other side of that test. A LANE answers
from its own manifest and every uncertainty is a REFUSAL — v1, arm for
arm, and the only edit inside it is that the path-field loop moved into
`targetOf`, which both seats now call rather than spelling twice. A SEAT
WITH NO LANE answers from EVERY LIVE LANE'S manifest and every
uncertainty is an ALLOW. The asymmetry is the design: a lane can be told
to stop, and the integration seat cannot, because stopping it stops
every dispatch, merge and checkpoint at once. So every refusal in the
new arm rests on a POSITIVE, readable reservation, and v1's load-bearing
property survives in a wider form — a manifest is consulted only for a
checkout whose OWN HEAD is on a lane branch, so a stray manifest still
locks nobody out, proven with one planted in a detached tree AND one in
a non-lane branch's tree.

**THE SIBLING-MANIFEST READ: GIT'S ADMINISTRATION, WALKED BY HAND.**
`liveLanes(root)` follows `.git` (file or directory) to the git
directory, follows `commondir` to the COMMON directory, and reads
`<common>/worktrees/*/HEAD` and `.../gitdir` — plus the common
directory's own HEAD for the main worktree, which git keeps outside
`worktrees/`. That is the same pair `git worktree list --porcelain`
prints, filtered on the BRANCH exactly as the lane bullet requires. No
subprocess: the zero-dependency property T-154 was redesigned to hold is
intact, and the spec's *"the hook depends on NOTHING a fresh worktree
lacks"* body still passes unchanged.

**THE COST, MEASURED AND NOT ASSERTED** — `Mac.lan`, node v22.22.0,
2026-08-30, against the live repository (seven worktree entries, FOUR of
them lanes), 200 calls per figure, two runs on a host carrying those
four lanes and a sitting:

| | run 1 | run 2 |
|---|---|---|
| the whole walk, every manifest read | 0.19 ms | 0.50 ms |
| `git worktree list --porcelain` ALONE | 11.06 ms | 23.66 ms |
| `decide` in a lane, v1 → this file | 0.054 → 0.048 ms | same |
| the runner end to end, seat, MISS | 38.5 → 39.3 ms | 38.4 → 39.8 ms |
| the runner end to end, seat, refusal | 41.4 ms | 41.4 ms |

**So the card's cost question answers: cheap enough to keep on, and the
design that would not have been is the one this file did not take.** The
subprocess costs FIFTY TIMES the whole walk; end to end a session pays
1–3 ms on a ~39 ms invocation, because node's own startup dominates both
and always did. **A LANE PAYS NOTHING** — its arm never reaches the
walk. The variance in the second run is the honest half: a busy host
moves both columns together.

**THE CARVE-OUTS, AS CRITERIA.** Two of the ruling's three were already
IN the manifest and are READ rather than re-spelled: `docs/tasks/`
arrives as `alwaysWritable` (the parser's `UNFENCEABLE_PATHS`) and a
card's own file as `excluded`. Only the third is a constant here —
`INTEGRATION_SEAT_PATHS = ["docs/STATE.md", "docs/checkpoints"]` — and
the spec COMPARES it against the sentence docs/CONVENTIONS.md now
publishes, the treatment `LANE_BRANCH_RE` already gets. The dispatch and
closing stamps needed no entry: they land in `docs/tasks/`. The own-file
test runs FIRST though the unfenceable directory would catch it anyway,
so each branch owns a distinct write and no branch is unkillable.

**A FOURTH CRITERION IS THE HOOK'S OWN AND IS FILED AS A QUESTION**
(`T-154-s4`): a checkout git records as mid-merge, mid-rebase,
mid-revert or mid-cherry-pick is free. Without it the guard refuses the
integrator the one act that consumes a fence, since a lane's conflicted
paths are inside that lane's fence by construction and the worktree is
removed only after the merge. It is mechanical — git writes the marker,
the hook stats it — but mechanical is not ruled, so it is declared at
the definition site, in CONVENTIONS, and on its own card.

**WHAT THE RULING'S CARVE-OUTS COST, MEASURED ON THE LIVE BOARD.**
`T-159-s1` fences fourteen individual card files. Every one of them is
under `docs/tasks/`, so this seat may write all fourteen — the carve-out
working exactly as ruled, and worth saying plainly because it means a
lane fencing card files gets no third-party protection for them. Read
against the live repository from the integration checkout, this lane's
own fence refuses `docs/CONVENTIONS.md` and `tools/e2e/…`, and
`T-167-s1`'s refuses `method/runtime/sessions-schema.md`.

**WHAT I DID NOT BUILD, AND WHY IT IS THE INTERESTING ONE.** A write
into a live lane's OWN TREE from a lane-less seat is still allowed
(limit 2). `liveLanes` knows every lane's worktree path, so mapping such
a write onto that lane's fence would have been four lines — and it is
not taken, because the hook has no term that separates an architect
reaching into a lane from THE LANE'S OWN EXECUTOR writing into it from a
shell parked elsewhere. That is not hypothetical: this card was built
that way, from a session whose cwd was the integration checkout, and the
four lines would have refused every write of this lane's own work.

### The drill ledger — one side only, mutation read back, restoration proved

Drilled in a DETACHED worktree at `/tmp/T154s2d` (short root), cut at
the tip under test with `git worktree add --detach`, the lane's
`node_modules` and `lib/parser/dist` symlinked in. No cargo in the
drill, so no `CARGO_TARGET_DIR` hazard. Baseline proved sound FIRST:
**37 of 37 green** before any mutant. Every mutant moves a PRODUCER —
never an assertion — every mutation was READ BACK off disk before its
run, and every restoration was `git restore --source=HEAD
--staged --worktree` plus a sha256 match against `git show HEAD:` with
an empty `git diff` as the companion.

| # | one-sided mutation | killed |
|---|---|---|
| n1 | `liveLanes` returns nothing | 9 |
| n2 | the lane list stops filtering on the BRANCH | **1** |
| n3 | only the first lane is read | 2 |
| n4 | a lane whose manifest cannot be read reserves the tree | 2 |
| n5 | the own-file carve-out is skipped | **1** |
| n6 | the unfenceable-directory carve-out is skipped | **1** |
| n7 | the seat's standing-writes carve-out is skipped | **1** |
| n8 | `INTEGRATION_SEAT_PATHS` drifts from CONVENTIONS' sentence | 2 |
| n9 | the mid-integration criterion never fires | **1** |
| n10 | the marker set gains a file that is always present | 9 |
| n11 | a DETACHED checkout is judged after all | **1** |
| n12 | the carve-outs are never consulted | **1** |
| n13 | the lane-less refusal returns allow | 5 |
| n14 | `commondir` is not followed | **1** |
| n15 | the main worktree is not a candidate | **1** |
| n17 | the lane arm inherits the seat's carve-outs | 3 |
| n18 | the refusal stops naming its route | **1** |
| n19 | `excluded` is no longer a field the reader requires | **1** |
| n20 | the lane-less out-of-checkout limit is deleted | **1** |

**Fourteen of the nineteen killed EXACTLY ONE body**, which is the
mechanical form of the non-duplication question. Two mutants (n13, n16
in an earlier numbering) failed to APPLY on their first spelling — a
`\Q…\E` block cannot carry a newline — and were re-run with a real
pattern rather than recorded as kills; a substitution that changes
nothing is not a drill, which is why the driver refuses one.

**THE DRILL FOUND THREE GAPS IN THIS CARD'S OWN WORK, EACH FIXED IN ITS
OWN COMMIT BEFORE THE LEDGER ABOVE WAS TAKEN.** Each was found by asking
*"which mutant kills this?"* rather than by running one.

1. `38dc1de` — **two producer branches with no discriminator**:
   following `commondir` (only a LINKED worktree has one, and every body
   wrote from the main checkout) and the main-worktree candidate. One
   new body drives the `arch-verify` shape and kills both (n14, n15).
2. `c221989` — **the branch filter was pinned by nothing**. The stray
   manifest sat only in the DETACHED drill, whose HEAD names no branch
   either way, so deleting `LANE_BRANCH_RE` from the walk changed no
   verdict. A second stray, in a worktree on a real non-lane branch,
   makes n2 kill exactly one body. And `excluded` became a required
   field with no shape asserting it (n19).
3. `9291c43` — **the lane-less out-of-checkout limit had no body**,
   though docs/CONVENTIONS.md now claims it of both seats. An arm no
   write drives is a claim nothing checks (n20).

### The gates, derived from the merge's diff and not from memory

Range per the RANGE RULE's executor row —
`TREE=$(git merge-tree --write-tree <main tip> HEAD)`, the `merge-tree`
exit read FIRST (**0**, a tree and not a conflict report) — then
`git diff --name-only <main tip> "$TREE"`.

- **BOOT GATE — NOT OWED.** Nothing under `app/src-tauri/**`,
  `app/src/**` or either manifest is in the set.
- **GRAPH REGEN — FIRES** on `tools/e2e/tests/lane-fence.spec.ts` (a
  `.ts` outside docs/). **ASKED THE GATE rather than predicting**:
  `cargo run -p nputer-index -- index --check --root ../..` from
  app/src-tauri/ answers **CURRENT**, exit **0** (1037788 bytes, 198
  files, 2095 symbols, 2292 edges). The regen is a no-op because every
  top-level prefix in this diff is excluded from the walk by
  `.nputerignore` — `docs/`, `tools/`, and `/.claude/` root-anchored —
  and the regen still belongs to the integrator at the checkpoint.
- **DOCS GATE — FIRES**, 2 paths under `docs/` are code inputs, and it
  names four suites: `cargo test` from app/src-tauri/, `npm test` from
  app/, `npm test` from tools/e2e/, `npx vitest run` from lib/parser/.
  All four are in the ledger below.
- **METHOD EVAL GATE — NOT OWED.** `method/` is **0 files** in the set,
  which is `T-154-s3` honoured by omission rather than by promise.

### The suite ledger — counts AND exits, unpiped, at the tip `e645754`

Every figure below is stamped at `e645754`, the commit carrying this
card's notes and its two routed suggestions — the four suites the DOCS
GATE named were re-run AFTER those cards were in the tree, because a
flat `docs/tasks/T-*.md` is a parser input and a ledger taken before
them is a ledger about a different tree. Ports read with
`lsof -nP -iTCP:<port> -sTCP:LISTEN` at zero rows immediately before
binding: the lane on **16154**, the drill on **16155**. Port 1420 was
never touched.

| command | where | result |
|---|---|---|
| `npm test` (`NPUTER_E2E_PORT=16154`) | tools/e2e | **330 passed, 2 failed**, exit **1** — both attributed below |
| `npm run typecheck` | tools/e2e | exit **0** |
| `npm run lint:tokens` | tools/e2e | clean — TOKEN 159 files, CONTROL 977 tracked text files; exit **0** |
| `npm run lint:docs` | tools/e2e | exit **0**; budgets HOLD, 4 gated, 0 awaiting a landing |
| `npx vitest run` | lib/parser | **336 passed** of 336; exit **0** |
| `npx tsc --noEmit` | lib/parser | exit **0** |
| `npm test` | app | **1047 passed** of 1047, 49 files; exit **0** |
| `cargo test --no-fail-fast` | app/src-tauri | **560 passed / 0 failed / 4 ignored** over 18 result blocks; exit **0** |
| `index --check --root ../..` | app/src-tauri | **CURRENT**, 1037788 bytes; exit **0** |

The e2e lane was **320** bodies at the base and is **332** here; all 12
new ones are in `tools/e2e/tests/lane-fence.spec.ts`, which runs **37 of
37** green — the 25 bodies T-154 landed, every one of them unchanged
except two that GAINED a case (the unreadable-manifest shapes and the
two-seats body), plus 12 new.

**THE BUDGET WARN DID NOT FIRE, WHICH IS A CHANGE SINCE T-154 AND IS
WORTH SAYING RATHER THAN ENJOYING.** That card left `docs/CONVENTIONS.md`
1,926 bytes over its warn line; `npm run lint:docs` here reports
*"governing-document budgets hold"* with this card's edit added, so the
line moved between then and now (ADR-019 derives it at each compaction
landing). The edit was still written to carry the mechanism, the
carve-outs and the limits and nothing else, and the now-false sentence
it replaces was deleted rather than left standing beside its successor.

**TWO E2E BODIES RED IN THIS LANE AND NEITHER IS THIS DIFF'S — the
class the dispatch brief predicted by name.**
`session-economics.spec.ts:73` and `:247` both shell out to
`brief.mjs --task T-157`, which refuses with a FINDING:

    fences are not disjoint: T-154-s2 tools/e2e against T-157 tools/e2e
      — the same entry (lane-protocol rule five).

That is MY OWN LANE's fence colliding with the card those bodies probe.
**Measured rather than argued**: the same command run from a detached
worktree cut at this lane's BASE commit `f3f4671`, carrying none of this
diff, exits **1** with the identical message. It is a live-environment
fact about the lane list — not a tree fact — and it clears when this
worktree is removed. Nothing here touches those files. The dispatch
brief predicted the class by name and predicted one body; it is two,
and the second (`:247`) reds through the same `--task T-157` call.

### Least confident

**THE SAME SENTENCE T-154 ENDED ON STILL STANDS, ONE LAYER OUT: no live
session has been observed being refused by this arm.** Every arm above
is driven by calling `decide` and by piping a request into the runner
against real git fixtures. The one thing that WAS observed live is the
read: from the integration checkout, against four real lanes, the arm
refuses `docs/CONVENTIONS.md` and `tools/e2e/…` to this lane and
`method/runtime/sessions-schema.md` to `T-167-s1`, and frees
`docs/STATE.md`, `docs/checkpoints/` and `docs/tasks/`. That is the
decision function reading the live board correctly; it is not a session
being stopped.

Two residuals worth a verifier's attention. **The fourth criterion**
(`T-154-s4`) is the executor adding to a ruling's list, and it should be
ruled rather than inherited. **And the guard now fails open in one MORE
shape than T-154 declared**: a lane whose manifest this seat cannot read
reserves nothing here, so a dispatch that skipped its fence step leaves
that lane unprotected against the integration seat — the refusal lands
on the lane's own first write instead, which is where a session exists
to be told, but the window between the two is real.

Standing triage 2026-08-30 (architect seat): PARKED — NOT RULED. docs/STATE.md states in as many words that "`T-154-s2` still needs a ruling", and that ruling is @human's; this card questions whether a guard should see the writing session's own lane, which is a policy call about what the method permits rather than a defect with a derivable answer. Two of the three incidents that motivated the guard are writes from a seat that HAS no lane, so the card is arguing the guard's premise, not its implementation — exactly the class a triage seat may route but not settle.
RESURFACES: @human rules the question STATE has queued. IF the ruling says a lane-less seat's writes are in scope THEN this promotes as a guard-class card and dispatches `review: independent` (TASK-FORMAT: the builder of a cage is not its inspector); IF it says the guard's current premise stands THEN this is DECLINED with the ruling named as the reason.
