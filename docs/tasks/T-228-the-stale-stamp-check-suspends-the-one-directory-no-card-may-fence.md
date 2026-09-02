---
id: T-228
title: THE STALE-STAMP CHECK SUSPENDS THE ONE DIRECTORY NO CARD MAY FENCE — during a half-performed widening a lane cannot write its notes, its findings, or its own exit stamp, and the check that costs this never prevented the abuse it looks like it prevents
feature: F-06
milestone: 4
priority: 2
size: S
status: building
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

## Implementation notes — 2026-09-02, and the card is NOT complete

**THE FIX IS BUILT AND THREE OF THE SIX CRITERIA CANNOT BE BUILT UNDER
THIS FENCE.** `touches: [.claude]` reaches `decide()` and reaches
nothing that can hold a body for it. Every reader of
`.claude/hooks/lane-fence.mjs` lives in `tools/e2e`
(`command grep -rn 'lane-fence\.mjs' app lib tools .github
--exclude-dir=node_modules` at `4c16b37`), so the only place a body
driving `decide()` can live is
`tools/e2e/tests/lane-fence.spec.ts` — outside this card's fence, and
refused by the guard this card repairs. Asked of the live manifest
rather than assumed:

    ALLOW  inside-the-fence     .claude/hooks/lane-fence.mjs
    ALLOW  always-writable      docs/tasks/T-228-….md
    BLOCK  outside-the-fence    tools/e2e/tests/lane-fence.spec.ts

**THE WIDENING ASKED FOR IS ONE FILE**, and it is disjoint from every
lane live at dispatch: `tools/e2e/tests/lane-fence.spec.ts`. Not
`tools/e2e` — that collides with `T-225-s2`
(`tools/e2e/scripts/brief.mjs`, `tools/e2e/tests/brief.spec.ts`, …) and
with `T-230-s7` (`tools/e2e/scripts/card-preflight.mjs`,
`tools/e2e/tests/card-preflight.spec.ts`). Routed as `T-228-s1`.

### What landed

`decide()` in `.claude/hooks/lane-fence.mjs` now answers in the order
the card prescribes — **`alwaysWritable` → stale-stamp → `paths`**. The
`rel` derivation moved up with the first stage; nothing else moved, and
the code string `stale-stamp` is untouched (the `T-210` coupling).

### The measurement — four states, not two

The window is TWO disagreements and the card's own S1/S2 pair exercises
only one of them. Driven through `decide()` against a real armed fixture
(`buildLaneFence`/`writeLaneFence`, a real git worktree), at `fa410f7`:

    state     lane card  manifest   held  granted  never  card  file
    C-narrow  NARROW     NARROW     ALLW  BLOCK    BLOCK  ALLW  ALLW
    W-B       WIDE       NARROW     BLCK  BLOCK    BLOCK  ALLW  ALLW
    W-A       NARROW     WIDE       BLCK  BLOCK    BLOCK  ALLW  ALLW
    C-wide    WIDE       WIDE       ALLW  ALLOW    BLOCK  ALLW  ALLW

**W-A is the card's S1** — the dispatch moved (main amended, the fence
re-expanded, the lane's own card not yet updated: `roles/executor.md`
fast path A) — and **C-wide is the card's S2**, reproduced row for row.
**W-B is the other half**, a lane editing its own `touches:`, and it is
the half `T-210`'s body drives. Before the reorder, every cell in W-A
and W-B read `BLOCK stale-stamp`, the card and the fresh suggestion file
included.

### The drill — the ORDER mutated, and one mutant survives everything

Drilled at `fa410f7`, one side only (the code under test, never an
assertion), each mutation read back with `git diff --stat` and restored
with `git restore --source=fa410f7 --staged --worktree`, sha256 proved
against `git show fa410f7:.claude/hooks/lane-fence.mjs`
(`4d3b0973b4e2c04bfb088f912e2b008e865e16b395e1f364839e610dbc799245`,
matched after all three).

| mutant | kind | suite | kill set |
|---|---|---|---|
| M1 `alwaysWritable` moved back AFTER the stale-stamp check — the pre-fix order | ORDER | 58 passed, exit 0 | **EMPTY** |
| M2 the stale-stamp check moved to the END — the obvious fix | ORDER | 1 failed / 57 passed, exit 1 | `lane-fence.spec.ts:447` |
| M3 `live !== manifest.touchesLine` inverted | PREDICATE | 15 failed / 43 passed, exit 1 | 15 bodies |

**M1's EMPTY KILL SET IS THE FINDING AND IT IS THE CARD'S FIRST
CRITERION, MEASURED.** The suite as committed cannot tell the repaired
order from the defect: restore the old sequence and 58 of 58 still pass.
So the fix is real and UNGUARDED, and the missing body is not a
formality.

**M2 IS ALREADY GUARDED** — by the very body `T-210` wrote and this
card's coupling note names. Its last assertion (`ask(fx.lane,
"tools/e2e/x.ts").code === "stale-stamp"`) is what reds, so criterion 2
holds today without a new body.

**M3 IS THE CARD'S FOURTH CRITERION DEMONSTRATED FROM THE OTHER SIDE.**
A predicate mutant is loud in fifteen places and says nothing about the
sequence: it does not move the card or the fresh-suggestion cell in ANY
of the four states. A drill that mutates comparisons and leaves the
sequence alone measures nothing about this card, exactly as the
criterion says.

### Criteria, one by one

1. **BUILT, UNMEASURED BY THE SUITE.** W-A/W-B above: the card and a
   fresh `docs/tasks` file are ALLOWED `always-writable` in the window,
   `docs/STATE.md` — never granted — stays BLOCKED. No committed body
   asserts it (M1's kill set is empty). **Routed: `T-228-s1`.**
2. **HOLDS, AND IS GUARDED.** W-A `newly-granted` stays `BLOCK
   stale-stamp`; M2 flips it to `ALLOW inside-the-fence` and reds
   `lane-fence.spec.ts:447`.
3. **HOLDS, UNCHANGED.** C-narrow/C-wide `never-granted` stays `BLOCK
   outside-the-fence`; the whole 58-body suite is green.
4. **DRILLED.** M1 and M2 are ORDER mutants; M3 is the predicate
   counter-example the criterion asks to be excluded.
5. Verification: headless throughout. No browser, no screen.
6. `review: independent` — unchanged.

### The gap a successor closes in minutes

The four-state probe and the three-mutant drill live in this session's
scratchpad as `probe-T-228.mjs` and `drill-T-228.mjs`; the body
`T-228-s1` asks for is the probe's W-A arm written as three
`expect`s against `decide()`, in the file that already builds exactly
this fixture. **Status stays `building`**: three criteria are met, one
is built and unguarded, and stamping `verifying` over an empty kill set
would certify the thing this card exists to object to.
