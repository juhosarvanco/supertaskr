---
id: T-228
title: THE STALE-STAMP CHECK SUSPENDS THE ONE DIRECTORY NO CARD MAY FENCE — during a half-performed widening a lane cannot write its notes, its findings, or its own exit stamp, and the check that costs this never prevented the abuse it looks like it prevents
feature: F-06
milestone: 4
priority: 2
size: S
status: verifying
blocked_by: []
touches: [.claude, tools/e2e/tests/lane-fence.spec.ts, tools/e2e/tests/lane-lock.spec.ts]
suggested_by: "T-211's executor and its blind verifier, independently and then jointly, 2026-09-01 — the executor met it while repairing a false positive control, the verifier reproduced it at a separate bench, and the counter-argument was tested and failed"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
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
