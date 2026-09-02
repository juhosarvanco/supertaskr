---
id: T-228
title: THE STALE-STAMP CHECK SUSPENDS THE ONE DIRECTORY NO CARD MAY FENCE — during a half-performed widening a lane cannot write its notes, its findings, or its own exit stamp, and the check that costs this never prevented the abuse it looks like it prevents
feature: F-06
milestone: 4
priority: 2
size: S
status: done
blocked_by: []
touches: [.claude, tools/e2e/tests/lane-fence.spec.ts, tools/e2e/tests/lane-lock.spec.ts]
suggested_by: "T-211's executor and its blind verifier, independently and then jointly, 2026-09-01 — the executor met it while repairing a false positive control, the verifier reproduced it at a separate bench, and the counter-argument was tested and failed"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

**A LANE STUCK IN THE WIDENING WINDOW CANNOT FILE THE FINDING THAT
EXPLAINS WHY IT IS STUCK.**

`decide()` in `.claude/hooks/lane-fence.mjs` runs its stale-stamp
comparison — card `touches:` against the manifest's stamp — **before**
the `alwaysWritable` loop. So while a fence widening is half performed
(main amended and the manifest re-expanded, the lane's own card not yet
updated), there is no allow path at all.

Measured by driving `decide()` directly, twice, at two benches:

    S1 (window OPEN)     already-held BLOCK   newly-granted BLOCK
                         never-granted BLOCK  the card BLOCK
                         a fresh suggestion file BLOCK     — all stale-stamp

    S2 (window CLOSED)   already-held ALLOW   newly-granted ALLOW
                         never-granted BLOCK  the card ALLOW
                         a fresh suggestion file ALLOW

**S2 is what makes S1 a refusal rather than an absence.** The same
targets, the same function, one field changed.

## Why the cost is exactly the wrong cost

`docs/tasks` is `UNFENCEABLE_PATHS` — the directory the protocol itself
writes to on every card, which rule 5 says no card may hold. A write
there **can never be a fence breach by construction.**

What the window suspends is therefore: a lane's implementation notes, any
suggestion card it would file, and its own `status:` stamp. **The
protocol's own bookkeeping is the only thing this refusal reaches.**

And the visible symptom is circular: a lane that hits the window reaches
for the remedy the method prescribes — route it, file a suggestion — and
is refused again, with no sentence anywhere telling it the refusal is
expected. `T-211` has since written that disclosure into the law, which
is the right repair for the LAW and leaves this defect untouched.

## THE COUNTER-ARGUMENT, TESTED AND FAILED

The obvious defence is that a stale stamp means the guard cannot know
which side moved, and one unreachable state is a lane that has widened
ITSELF — so refusing everything is the safe answer.

**It does not survive inspection.** To widen itself at the write, a lane
must forge `manifest.paths`. The manifest sits outside every fence and a
shell-mediated write reaches it regardless (limit 1). **A lane forging
the manifest forges `touchesLine` to match its card in the same edit, and
the stamp check passes.**

So the stamp check never prevented self-widening. It detects a
HALF-PERFORMED DISPATCH and nothing else. What actually stops
self-widening is the landing gate reading the card as committed on the
integration branch.

**A check that cannot prevent the abuse it resembles is suspending the
one directory the protocol guarantees.**

## THE OBVIOUS FIX IS WRONG, AND THAT IS WHY THIS CARD EXISTS

Moving the stale-stamp check to the END would let a half-delivered grant
silently work — the new paths would come back `inside-the-fence` — which
**quietly deletes the two-writes property `T-211` has just written into
law.** A fix that reads as obviously correct would undo a rule landed the
same night.

The order that keeps every property:

    alwaysWritable  →  stale-stamp  →  paths

The unfenceable directory is restored during the window; the stale
manifest's `paths` stay untrusted; every containment property is
unchanged.

## Acceptance criteria

- WHILE a lane's card and manifest disagree, a write to
  `UNFENCEABLE_PATHS` SHALL be ALLOWED, and a body SHALL prove it by
  driving `decide()` in that state against the card, a fresh file in that
  directory, and a path the fence never granted.
- THE half-performed grant SHALL STILL BE REFUSED on the newly granted
  path — **this is the property the obvious fix destroys**, and a body
  SHALL fail if the stale-stamp check is moved to the end.
- **A POSITIVE CONTROL SHALL prove the ordinary refusal still refuses**:
  an out-of-fence path with a CURRENT stamp. A decision function made
  permissive in one state must be shown unchanged in every other.
- THE drill SHALL mutate the ORDER, not only the predicates — the defect
  is a sequence, so a mutant that edits a comparison and leaves the
  sequence alone measures nothing about this card.
- Verification: headless.
- **This card is GUARD-CLASS**: `review: independent`, set at filing.

## Read beside

`T-211` (which met this while repairing a false positive control, wrote
the disclosure into the law, and correctly refused to fix the guard from
outside its fence), `method/lane-protocol.md` rule 5 (the unfenceable
directory, by ordinal), `T-212` (the landing gate — the guard that
actually prevents self-widening), and `T-227` (the other place an empty
or disagreeing fence produces a verdict nobody intended).

## Attribution, because an unattributed finding reads as advice

The executor met it, reproduced it, and **declined to fix it** — `.claude`
was a live lane's fence — routing it instead with its reasoning stated.
Its own note records the irony: *this lane can only route because its
manifest and card happen to agree.* The verifier then reproduced it at a
separate bench, tested the counter-argument above until it failed, and
supplied the three-stage order. Neither seat could write the fix; both
were right not to.

## A COUPLING T-210 CREATES, NAMED BEFORE IT BITES — 2026-09-01

`T-210`'s lane wrote a body that probes `decide()` inside exactly this
card's window, and wrote it carefully: it uses the **newly-granted path
rather than the card**, so it asserts the refusal this card's second
criterion PRESERVES BY NAME. Its verifier audited that forward-
compatibility and it holds — this card can land without reding it.

**One residual.** That body also asserts `.code === "stale-stamp"`. So an
implementation of this card that RENAMES the code — even while keeping
the behaviour identical — reds a body in `tools/e2e`, which is outside
this card's own fence.

Named here rather than discovered at that lane's gate: **keep the code
string `stale-stamp`, or plan the two-act change** the fast-path law now
describes. Nobody has to guess.

## Implementation notes — 2026-09-02

`decide()` in `.claude/hooks/lane-fence.mjs` now answers in the order
this card prescribes — **`alwaysWritable` → stale-stamp → `paths`**. The
`rel` derivation moved up with the first stage; nothing else moved, and
the code string `stale-stamp` is untouched, per the `T-210` coupling
this card names.

### THE FENCE WAS TOO NARROW AS STAMPED, AND THE WIDENING IS RECORDED

Dispatched on `touches: [.claude]`, which reaches `decide()` and reaches
nothing that can hold a body for it: **no test file exists under
`.claude`**, and every reader of the hook lives in `tools/e2e`
(`command grep -rn 'lane-fence\.mjs' app lib tools .github
--exclude-dir=node_modules`). Asked of the live manifest rather than
assumed, the guard this card repairs refused the only files its own
criteria could be written in. The lane routed the finding and named the
widening it needed; the dispatcher amended the card on the integration
branch (`ae7e8a9`) to
`touches: [.claude, tools/e2e/tests/lane-fence.spec.ts,
tools/e2e/tests/lane-lock.spec.ts]`, re-expanded the manifest and wrote
the same line into the lane's own copy. **BOTH HALVES WERE READ BEFORE
THE LANE PROCEEDED** (`roles/executor.md` fast path A — a grant is two
agreeing files on disk, never a reply), and the guard was asked again:

    ALLOW  inside-the-fence     .claude/hooks/lane-fence.mjs
    ALLOW  inside-the-fence     tools/e2e/tests/lane-fence.spec.ts
    ALLOW  inside-the-fence     tools/e2e/tests/lane-lock.spec.ts
    BLOCK  outside-the-fence    tools/e2e/tests/brief.spec.ts

**The file-scoped spelling is load-bearing**: at `4c16b37` a bare
`tools/e2e` collides with `T-225-s2` (`scripts/brief.mjs`,
`tests/brief.spec.ts`, …) and with `T-230-s7`
(`scripts/card-preflight.mjs`, `tests/card-preflight.spec.ts`), while
the two spec files are disjoint from every lane live at dispatch.

### The window is TWO disagreements and only one of them measures this

Driven through `decide()` against a real armed fixture — the writer's
own `buildLaneFence`/`writeLaneFence` over a real git worktree — at
`698b88d`:

    state     lane card  manifest   held  granted  never  card  file
    C-narrow  NARROW     NARROW     ALLW  BLOCK    BLOCK  ALLW  ALLW
    W-B       WIDE       NARROW     BLCK  BLOCK    BLOCK  ALLW  ALLW
    W-A       NARROW     WIDE       BLCK  BLOCK    BLOCK  ALLW  ALLW
    C-wide    WIDE       WIDE       ALLW  ALLOW    BLOCK  ALLW  ALLW

**W-A is this card's S1 and C-wide is its S2**, reproduced row for row.
W-A is the half the card's own opening describes — *main amended and the
manifest re-expanded, the lane's own card not yet updated* — and it is
the ONLY half where the stale manifest actually CARRIES the newly
granted path, so it is the only half where refusing that path is a
measurement rather than an accident of a narrow fence. **W-B is the half
`T-210`'s body drives**, and it is untouched. Before the reorder every
cell in W-A and W-B read `BLOCK stale-stamp`, the card and the fresh
suggestion file included.

### The bodies

Both in `tools/e2e/tests/lane-fence.spec.ts`, sharing one asserted setup
helper (`halfDeliveredGrant`) so a window that silently failed to open
cannot satisfy either:

- **`the UNFENCEABLE directory stays open while the card and the
  manifest disagree`** — criterion 1. Drives `decide()` in W-A against
  the card, a fresh `docs/tasks` file and `docs/STATE.md`, a path the
  fence never granted. Its **positive control is criterion 3**, asserted
  FIRST: with a CURRENT stamp that same path is already refused
  `outside-the-fence`, so the allows cannot be a fence that failed to
  arm (docs/CONVENTIONS.md, LIFTING A SAFETY GUARD TO DISCRIMINATE). The
  window is then proved open by the SAME path changing its reason to
  `stale-stamp`.
- **`a HALF-DELIVERED grant is still refused ON THE PATH IT GRANTED`** —
  criterion 2, in the state where the manifest genuinely grants it. Its
  quiet-first arm asserts the path is `outside-the-fence` BEFORE the
  grant moves, so the refusal is not a path that was never reachable.

`tools/e2e/tests/lane-lock.spec.ts` carried a comment stating that the
hook refuses the Write tool on the lane's own card inside the window —
true when written, and exactly the defect this card repaired. The
comment is corrected. **The hook-side assertion is deliberately NOT
duplicated there**: a second copy would put that body in this one's kill
set and leave neither uniquely responsible (POISON DRILL shape SIX), and
the drill below shows the kill set is ONE.

### The drill — the ORDER mutated, not only the predicates

Drilled at `698b88d`, one side only (the code under test, never an
assertion), each mutation read back with `git diff --stat`, each restored
with `git restore --source=698b88d --staged --worktree` and proved by
sha256 against `git show 698b88d:.claude/hooks/lane-fence.mjs`
(`4d3b0973b4e2c04bfb088f912e2b008e865e16b395e1f364839e610dbc799245`,
matched after all four; `git status --short` empty each time). The suite
run is `tests/lane-fence.spec.ts tests/lane-lock.spec.ts`, which is
**every body in the tree that calls this `decide()`** — the other three
specs importing this module take `frontmatterLineOf`, `touchesLineOf`,
`within` and `RUNTIME_DIR_IGNORE`, and `push-guard.spec.ts`'s `decide`
is a different function.

| mutant | kind | suite | kill set |
|---|---|---|---|
| M1 `alwaysWritable` moved back AFTER the stale-stamp check — the PRE-FIX order | ORDER | 1 failed / 73 passed | **`the UNFENCEABLE directory stays open …` ALONE** |
| M2 the stale-stamp check moved to the END — the obvious fix | ORDER | 2 failed / 72 passed | `a HALF-DELIVERED grant …` + `lane-fence.spec.ts:447` |
| M3 `live !== manifest.touchesLine` inverted | PREDICATE | 19 failed / 55 passed | 19 bodies |
| M5 `paths` containment always matches | CONTROL | 15 failed / 59 passed | 15 bodies, both new ones on their CONTROL arms |

**M1 IS THE MUTANT THIS CARD IS ABOUT AND ITS KILL SET IS EXACTLY ONE.**
Measured before the widening landed, at `fa410f7` with the fix committed
and no new body, M1 left **58 of 58 green**: the tree could not tell the
repaired order from the defect. That number is the argument for the
widening and is recorded rather than described.

**M2's KILL SET IS TWO, DISCLOSED** (POISON DRILL shape SIX's own
procedure — name the bodies that already cover you). `T-210`'s body
reds on its already-held path; the new body reds on the newly granted
one, in the half where the manifest carries it, which is the criterion's
own wording and the arm `447` cannot reach.

**M3 IS THE FOURTH CRITERION FROM THE OTHER SIDE.** A predicate mutant
is loud in nineteen places and says nothing about the sequence: it does
not move the card or the fresh-suggestion cell in ANY of the four states
above. A drill that edits comparisons and leaves the sequence alone
measures nothing about this card, exactly as the criterion says.

**M5 IS THE POSITIVE CONTROLS DEMONSTRATED FAILING**, and each new body
fails ON ITS CONTROL ASSERTION rather than incidentally — the
`outside-the-fence` expectation for the first (`Error: docs/STATE.md is
inside the fence domain app/src/fixture`), the quiet-first
`outside-the-fence` expectation for the second.

### Criteria

1. **MET** — the body above, killed by M1 alone.
2. **MET** — the second body, killed by M2 alone among new bodies.
3. **MET** — the control arm, asserted first and demonstrated failing
   under M5.
4. **MET** — M1 and M2 are ORDER mutants; M3 is the predicate
   counter-example the criterion asks to be excluded.
5. **MET** — headless throughout: no browser assertion, no screen.
6. `review: independent` — unchanged, set at filing.

### For the integrator

**`docs/CAPABILITIES.md` IS STALE AT THIS TIP** and this lane's fence
leaves it read-only: two test names were added, so
`npm run capabilities` is owed IN THE MERGE COMMIT (docs/CONVENTIONS.md,
the census bullet). The routed card this lane filed while the fence was
narrow, `T-228-s1`, is DELETED in the same commit as the bodies it asked
for — its only content was that body.

## VERDICT — 2026-09-02 — claude-opus-5@subagent — APPROVED

Blind verifier, independent bench `nputer-V-T-228`, judged at
`6caeb30e1cb767e75c30b72fc261ad9e21a77208` checked out DETACHED. Every
figure below carries the ref it was measured at.

### The blindness, and it was BOTH halves rather than the stronger one

Phase 1 reached this seat in orchestrator 5c's preferred shape. When the
card was opened, `git worktree list` showed the lane standing at the base
`4c16b37` — **no commits, so there was no diff to decline to read.** By
the time the attack set was sealed the lane had moved to `f40ab23`, and
from then on the blindness was a discipline rather than a fact about the
clock. The attack set, a ground-truth table and their sha256 stamps were
written and sealed BEFORE the diff was opened
(`attack-V-T-228.md` `a0b83d5e8cbf8030b7332a05a3b3c38dfe6a63324c093208dbacfceb1c5dedb4`,
`ground-V-T-228.md` `8493dcfbf922780a69187ffbebe41197f5e9eb80fb18aee0ef8264e355a27a28`,
sealed `2026-09-02T10:11:44Z`), and both hashes were **re-verified
unchanged** after the verdict was written. The dispatching brief
separated the two phases and named no executor-derived figure above the
line.

### THE WIDENING WAS THE SEAT'S, ON THIS VERIFIER'S FACT — NOT THE EXECUTOR'S

Recorded because a later reader cannot tell the two apart and only one
would be a rule-5 breach. **Phase 1 of this verification produced the
finding independently**, before the lane had committed anything: `touches:
[.claude]` reaches `decide()` and reaches nothing that can hold a body for
it — the whole of `.claude/` is `settings.json` plus seven `.mjs` hooks
and **there is no test file under it**, so criterion 1's *"a body SHALL
prove it"* was unreachable inside the fence as stamped. The dispatching
seat, acting on that fact, amended the card on the integration branch at
`ae7e8a9`, re-expanded the manifest, and wrote the same line into the
lane's copy. The executor met the same wall from its own side and routed
it; **it widened nothing itself**, which is what rule 5 asks. The lane's
diff was judged against the widened fence, and every one of its four
paths sits inside it:

    .claude/hooks/lane-fence.mjs                 in the fence
    tools/e2e/tests/lane-fence.spec.ts           granted at ae7e8a9
    tools/e2e/tests/lane-lock.spec.ts            granted at ae7e8a9
    docs/tasks/T-228-….md                        alwaysWritable, never fenceable

### The behaviour, re-derived rather than read

Driven through `decide()` with this seat's OWN fixture — one throwaway
git checkout per arrangement, no code shared with `tools/e2e`'s, because
an arrangement that decides both the subject's answer and the control's
is the defect verifier.md 2b names. Five arrangements × six probes,
measured at `4c16b37` and again at `6caeb30`:

| probe | window OPEN (either half) | window CLOSED |
|---|---|---|
| the lane's own card | `block/stale-stamp` → **`allow/always-writable`** | unchanged `allow/always-writable` |
| a fresh `docs/tasks` file | `block/stale-stamp` → **`allow/always-writable`** | unchanged `allow/always-writable` |
| the newly granted path | **unchanged `block/stale-stamp`** | unchanged |
| the already-held path | **unchanged `block/stale-stamp`** | unchanged `allow/inside-the-fence` |
| a never-granted path | **unchanged `block/stale-stamp`** | unchanged `outside-the-fence` |
| `docs/STATE.md` | **unchanged `block`** | unchanged `outside-the-fence` |

**Six cells moved in the whole table and they are the six this card
buys** — the card and the fresh file, in both orientations of the window
and in the unreadable-card state. Every other cell of every arrangement,
including all twelve closed-window cells, is byte-identical to the base.

**AND THE TIP MATCHES A TARGET THIS SEAT PRE-COMMITTED.** In phase 1 the
card's own three-stage order was applied to a COPY of the hook and the
resulting table sealed. The tip's table is **identical to that
pre-committed target, cell for cell** — including the choice to place
`alwaysWritable` above BOTH stale-stamp arms rather than only the
mismatch, which was pre-committed as the expected and preferred reading
of an ambiguity the card's prose does not settle.

The adjacent arms are untouched: `no-manifest`, `not-judged-detached`,
`not-a-lane`, `not-a-repository`, `unreadable-request` all answer exactly
as at the base.

### Criterion by criterion

1. **MET.** The body drives `decide()` in the half-delivered-DISPATCH
   state against the card, a fresh `docs/tasks` file and `docs/STATE.md`
   — the three probes the criterion names, with the third asserted
   **BLOCK**, which is what the card's own S1/S2 table prints and the
   reading a permissive implementation would have got wrong.
2. **MET.** The second body refuses the newly granted path in the ONLY
   half where the stale manifest actually carries it, and asserts
   `manifest.paths` contains it so the refusal is a measurement rather
   than a path that was never reachable.
3. **MET, and its limit is recorded.** The control is asserted FIRST,
   with a current stamp, and shown capable of failing (M5 below). **What
   it cannot buy, measured here rather than argued**: every closed-window
   cell is identical across the base, the correct fix and the wrong fix,
   so criterion 3 alone cannot separate this implementation from the one
   the card exists to refuse. Criterion 2's probe is the load-bearing
   one, and it is present.
4. **MET.** Two ORDER mutants, both re-derived by this seat.
5. **MET.** Headless throughout — no browser assertion, no screen.

### The drill, re-derived at `6caeb30` and not taken from the notes

Scoped to `tests/lane-fence.spec.ts tests/lane-lock.spec.ts`, **74 bodies
green** unmutated. That scope is complete for this subject, checked
rather than assumed: those two files are the only ones in the tree
importing `decide` from this module (the other three importers take
`frontmatterLineOf`, `touchesLineOf`, `within`, `RUNTIME_DIR_IGNORE`).
Every landing was read back from `git diff`, never from the mutator; each
restored with `git restore --source=<tip> --staged --worktree` and proved
by sha256 against `4d3b0973b4e2c04bfb088f912e2b008e865e16b395e1f364839e610dbc799245`,
with `git status --short` empty after each.

| mutant | kind | result | kill set |
|---|---|---|---|
| the `alwaysWritable` loop moved back BELOW the stamp check (the pre-fix order) | ORDER | 1 / 74 | *the UNFENCEABLE directory stays open …* **alone** |
| the stamp check moved to the END | ORDER | 2 / 74 | *a HALF-DELIVERED grant …* + `lane-fence.spec.ts:447` |
| `live !== manifest.touchesLine` inverted | PREDICATE | 19 / 74 | 19 bodies, **and it moves ZERO criterion-1 cells** |
| the `paths` containment made always-true | CONTROL DEMO | 15 / 74 | 15, both new bodies failing **on their control assertions** (lines 538 and 574, read from the failure output) |
| the code string `stale-stamp` renamed | COUPLING | 4 / 74 | includes `lane-lock.spec.ts:775` — **`T-210`'s residual is live, not merely documented** |
| `alwaysWritable` emptied, then widened to `docs` (a DATA mutant, this seat's fixture) | DATA | — | the allow follows the MANIFEST field exactly; emptied it refuses again, widened it reaches `docs/STATE.md`. **No literal was compiled into the hook.** |

**KILL-SET CONTAINMENT HOLDS, WHICH IS THE JUDGEMENT AND NOT THE COUNT.**
`{523}` and `{447, 566}` — neither contains the other, so both new bodies
are load-bearing and neither restates the other. The predicate mutant's
19 and the control demo's 15 are loud everywhere and say nothing about
the sequence, which is the fourth criterion demonstrated from its far
side.

**AND ONE MUTANT PAIR IS ONE MUTANT.** Pre-committed in phase 1 and
confirmed against this tree: *"move both loops above the stamp check"*
and *"move the stamp check to the end"* produce a **byte-identical**
file (`9cce8d4018f980d81e0f2a8b4c8eef85b9e43347a1efd83274bddcdc3f6f1ccf`).
They are one reordering seen from two sides, so the card's *"the obvious
fix is wrong"* covers the whole class and a drill needs one mutant here,
not two. The lane's drill did not double-count it.

### Security sweep — REQUIRED, and clean

The subject is a guard, so this reordering is a privilege change. Ten
escape routes driven in BOTH window states at `6caeb30`, all refused:
the lane's own manifest and the runtime dir (the fourth arm),
`docs/STATE.md`, `docs/checkpoints`, `.git/config`, the lane's own copy
of the hook, and the prefix holes `docs/tasksX` and `docs/tasks-evil`.
**Traversal cannot ride the new first stage**: `docs/tasks/../STATE.md`
and `docs/tasks/../../.claude/hooks/lane-fence.mjs` are normalised by
`path.resolve` before `path.relative`, so they are refused like any other
out-of-fence path. The allow reads only `manifest.alwaysWritable`, which
no lane can write; the CARD — the one input a lane does control — is
still not consulted by any allow. No new dependency, no new input path,
no secret, no `catch` that allows. `within()` is unchanged, so containment
still requires the separator.

### Gates, each at the ref it was measured at

| gate | ref | reading |
|---|---|---|
| `gate-run parser` | `6caeb30` | exit 0, **372 bodies**, GREEN — equal to the base at `4c16b37` |
| `gate-run app` | `6caeb30` | exit 0, **1141 bodies**, GREEN |
| `gate-run e2e` | `6caeb30` | exit 0, **615 bodies**, GREEN — the base at `4c16b37` was **613**, and the delta is exactly the two bodies this card adds |
| `capabilities:check` | `6caeb30` | exit **1**, STALE — committed 51834 bytes, a fresh generation 51979. **The integrator's, in the merge commit**, and the lane disclosed it rather than leaving it to be found |
| `docs-gate.mjs` on all four changed paths | `6caeb30` | exit **1**, FIRES on the card path — owes app, tools/e2e, lib/parser, all three run above; *"every live task card's frontmatter parses, with a legal status"*; budgets 4 gated / 0 awaiting |

**ONE RED WAS MET AND IT WAS THIS BENCH, NAMED RATHER THAN COUNTED.**
The app gate first answered RED at `6caeb30` with 14 failures; every one
of them says `no build output at app/dist/assets — run npm run build in
app/ first`, and the diff contains no `app/` path at all. `npm run build`
in `app/`, then the gate again: GREEN at 1141. Recorded because
attributing that red to the diff is this seat's most common failure.

### OBSERVATIONS — not failures, and not blocking (verifier.md 6)

1. **`docs/CONVENTIONS.md`'s lane bullet is now imprecise, and this lane
   could not have fixed it** — that file is outside the widened fence.
   The sentence *"A card whose `touches:` no longer matches the
   manifest's stamp refuses with `re-expand`"* is stated without an order
   and is now false for writes under `docs/tasks/`, which is exactly what
   this card changed. No suite reads that sentence (the spec compares the
   LIMIT COUNT and the four declining codes, both unchanged), so nothing
   reds — it is a prose-currency finding for whoever holds that page.
2. **`docs/CAPABILITIES.md` is stale at this tip and that is the
   integrator's**, in the merge commit, per the census bullet. The lane
   disclosed it in its own notes rather than leaving it to be found; the
   base was CURRENT at 51834 bytes.

### Why APPROVED

Every criterion is met on evidence this seat re-derived rather than read.
The behaviour matches a target pre-committed and hashed before the diff
was opened, in a table where the six moving cells are exactly the six the
card buys and nothing else moves. The drill's two ORDER mutants have
kill sets that do not contain one another, the controls were shown
failing, and the property proved to live in the manifest by a data
mutant. The guard is not wider anywhere it was not meant to be.
