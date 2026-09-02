---
id: T-219-s4
title: "`readDispatchOrder` calls a fence with UNRESOLVABLE tokens startable whenever no lane is live — the residual of V-T-219's finding, one criterion away from the empty-`touches:` case it shares a site with"
feature: F-06
milestone: 4
size: S
priority: 3
status: done
suggested_by: executor claude-opus-5@subagent @T-219
blocked_by: []
touches: [lib-parser]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

**Class parent: `T-219`**, and specifically V-T-219's rejection — *"`rule()`
reaches `compareFences` only through `holds`, and `holds` is empty when
the lane list is."* That verdict was about a card declaring NO
`touches:`, and T-219's fix pass closed exactly that. **The same sentence
is true of a fence whose tokens cannot be RESOLVED**, and that half was
measured, left, and filed here rather than taken, because it is a
different criterion and it moves another card's dispatchability.

## Measured at T-219's fix-pass tip

Over the live board through the built parser, with **no lanes handed in**
— the canonical dispatch moment:

    startable with NO lanes                                114
    would move under the criterion T-219 closed (tokens 0)   0
    would move under this one (unusable > 0)                 1
      T-164-s1  [planned]  unusable=["bin"]

`bin/` exists on disk and no component claims it, so `expandFence`
resolves it oracle-less to `unresolved` — which
`lib/parser/test/fence.test.ts`'s census body already records as a
standing, structural state rather than a defect of that card.

## Why it is the same defect

`lanes.ts` closes its own `unfenceable` sentence with *"A fence that
cannot be COMPUTED is not a fence that is free."* A fence carrying an
unresolvable token cannot be computed — that is what `unusable` MEANS,
and `compareFences` answers `unusable` for it the moment any lane is
live. With no lane live there is no comparison, so the card falls
through `holds.length === 0` and is reported startable, **while
`buildLaneFence` would refuse to arm it outright** (`fence.unusable.length
> 0` throws before anything else). Two halves disagreeing in the safe
direction by luck rather than by rule — which is the sentence T-227 was
filed about and T-219 exists to end.

## Why it was NOT taken in T-219's fix pass

- The verdict named ONE finding and said the rest was tested and holds.
  Widening a fix pass past its verdict spends a verification nobody gave.
- It changes what `brief.mjs --dispatch` reports can START for a card
  that is not this one's subject. That is a board-visible change and
  deserves its own dispatch, not a rider.

## What to build

- `rule()`'s `holds.length === 0` guard SHALL also require the fence to
  be COMPARABLE, not merely declared — the term beside the existing
  `fence.tokens.length > 0`.
- The `unfenceable` clause list SHALL gain a cause naming the
  unresolvable tokens, so the reason says which token and not merely
  that something was wrong; the existing `tokens.length > 0` clause for
  the hold path is the shape to reuse.
- A body SHALL hand in NO lane and prove a card with an unresolvable
  token is not startable, WITH the control that a card whose tokens all
  resolve still is — the pair T-219's own no-lane body uses.
- THE LIVE-BOARD EFFECT SHALL BE STATED in the notes at the ref it was
  measured at, because this moves a real card: derive it, never quote
  this card's figure.
- Verification: headless.

## Read beside

`T-219` and its `## VERDICT` (the rejection this is the residual of),
`T-227` (the two-halves-disagree shape), `T-164-s1` (the card the change
moves), `lib/parser/src/lanes.ts`'s `rule()`.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at T-219's merge (64fed70)

The architect seat. The residual of V-T-219's own finding, one
criterion over: a fence whose tokens cannot be RESOLVED is startable
when no lane is live. The wider `unusable.length > 0` remedy was
measured to move T-164-s1 (planned, `touches: [bin]`) from startable to
unfenceable ORACLE-LESS ONLY — at the surface that dispatches,
`brief.mjs --dispatch` supplies the known-path oracle, `bin/.gitkeep`
is tracked, `bin` resolves as a path and no live card moves (the
verifier's phase-1 measurement; the triage stamp above had dropped the
qualifier). So the card SHALL decide the case on the record with the
oracle supplied — a planned card whose only token resolves to nothing
is not dispatchable, and says why — proved on a PLANTED card, and SHALL
NOT edit T-164-s1's card. One lane with the sibling below.

## Absorbs: T-219-s2 (2026-09-02)

A bare dot token normalises to `.` and expands to a domain no
repository-relative path can match — the fence permits nothing,
collides with nothing and reports no issue. The same module, the same
class (`expandFence` answering confidently where it should refuse): a
third refusal, with its own body and a live-board census printed with
its control.

## Implementation notes — 2026-09-02, executor claude-opus-5@subagent

Lane `task/T-219-s4-unresolvable-fence-never-startable`, worktree
`/Users/ujju/Projects/nputer-T-219-s4`, base
`24bfec8e10b3b13699e137befc11c729b13fd986` — the dispatch stamp itself,
which is also this lane's HEAD at cut. Every figure below is measured at
that base with this diff in the working tree unless it names another ref.

### THE RULING ON THE UNRESOLVABLE CASE, WITH THE ORACLE SUPPLIED

**The criterion is correct and lands: a fence that cannot be RESOLVED is
never `startable`, lanes or no lanes.** `rule()`'s `holds.length === 0`
guard now reads

    holds.length === 0 && fence.tokens.length > 0 && fence.unusable.length === 0

— the term beside `tokens.length > 0` the card asks for, read off
`expandFence`'s own answer rather than re-derived (T-057).

**AND THE LIVE-BOARD EFFECT IS ZERO, WHICH IS NOT WHAT THE TRIAGE STAMP
SAID.** Measured at `24bfec8e10b3` over the live board (474 cards
parsed), no lanes handed in, through the built parser, BOTH WAYS:

| | startable | unfenceable | ready cards with `unusable > 0` |
|---|---|---|---|
| before, WITH the dispatch oracle | 111 | 0 | 0 |
| **after**, WITH the dispatch oracle | **111** | **0** | **0** |
| before, oracle-less | 111 | 0 | 1 — `T-164-s1` |
| **after**, oracle-less | **110** | **1** | 1 — `T-164-s1` |

`brief.mjs --dispatch` reaches `readDispatchOrder` through
`tools/e2e/scripts/dispatch-order.mjs`, which passes
`knownPaths: knownPathOracle(root)`; that oracle is every tracked path
PLUS every ancestor prefix of one; `bin/.gitkeep` and `bin/app-dev.mjs`
are tracked at this base; so `bin` resolves `kind: 'path'` with
`unusable: []` and **no live card moves at the surface that
dispatches.** `lane-fence.mjs` (`buildLaneFence`) supplies the same
oracle. The only live card with a non-empty `unusable` under the oracle
is `T-054` (`done`, so `underway`, so it never reaches the fence term).

So the TRIAGE stamp's *"was measured to move `T-164-s1` from startable
to unfenceable"* is true ORACLE-LESS ONLY, and the card was amended
mid-lane by the dispatching seat to carry that qualifier.
**`T-164-s1`'s card is NOT edited**, and the reason is the card's own
rule turned the right way round: its fence resolves at every surface
that dispatches or arms, so editing it would be changing a card's fence
to move a measurement rather than to fix a defect.

**The oracle-less answer is nonetheless the CORRECT answer for the
consumer that gets it.** A reader with no repository cannot tell `bin`
from a word that names nothing — that is `expandFence`'s own documented
gap — and *"a fence that cannot be COMPUTED is not a fence that is
free"* is this module's own closing sentence. `unfenceable` is what it
should hear.

**The defect is real WITH the oracle supplied**, which is what the
bodies prove rather than the board: an oracle settles a bare word it
CARRIES and says nothing about one it does not, so a planted token no
repository contains is unresolvable with the oracle exactly as without
it — and the zero-lane board is where it was getting a green light.
`lanes.test.ts`'s first new body hands in an oracle of four real paths
and pins `startable: []`, with the same board and the same oracle
answering `unfenceable` when one lane IS live: V-T-219's asymmetry,
reproduced one criterion over.

### THE CLAUSE LIST GAINED THE CAUSE THAT NEEDS NO LANE

Every `unfenceable` clause was keyed on a HOLD, and there are no holds
when the lane list is empty — so the sentence arrived with an empty
middle in the one state where the card's own token is the whole story.
Three causes became four:

- the card's own token, read off `fence.unusable` (**new**) — remedy:
  spell it as a slug or a path, or hand the reader an oracle;
- the LANE'S card's token — remedy: spell it better THERE;
- no card in this checkout for a live lane — remedy: fetch it;
- the card declares no `touches:` at all (T-227's, unchanged).

`compareFences` returns the UNION of both sides' `unusable`, so the
hold clause now SUBTRACTS the card's own raw tokens. Before the
subtraction one token bought two clauses pointing at two different
cards to repair.

### THE BARE-DOT REFUSAL (absorbed `T-219-s2`)

`./` and `.//` normalise to nothing and were already refused with the
sentence *"a fence cannot reserve the repository root"*. A BARE DOT
normalises to `.` — the leading-`./` strip loop has nothing left to
strip — and `.` carries a `.`, so `looksLikePath` classified it a PATH
reserving the domain `.`. Measured at the base before the change:

    expandFence({touches:['.']}) -> kind 'path', paths ['.'],
                                    unusable [], issues []
    compareFences(that, {touches:['lib/parser']}) -> 'disjoint'

The two spellings of the repository root meant the identical thing and
one was refused with a sentence while the other was accepted with a
lie. `expandFence` now carries a third refusal, `DOT_DOMAIN`, and it is
**a PATH-SEGMENT test on the normalised token's FIRST segment** —
`/^\.\.?(?:\/|$)/` — so it reaches `.`, `..` and `../…` and nothing
else. That shape was chosen against the blast radius, not by taste.
**Measured HERE rather than relayed**, at `24bfec8e10b3` over the live
board's **118 distinct normalised** `touches:` tokens:

| refusal shape | tokens broken | cards |
|---|---|---|
| `startsWith('.')` | 8 | 34 |
| `includes('.')` | 89 | 139 |
| first segment `.` or `..` — **shipped** | **0** | **0** |

The dispatching seat relayed 10/34, 91/139 and 0 from its own blind
verifier's phase-1 read at the same base; the CARD counts agree exactly
and the two token counts differ by two each, which is the denominator:
this table dedupes on the NORMALISED token, where `tools/e2e/` and
`tools/e2e` are one. Same ruling either way, and the relayed figures
are attributed rather than absorbed. The `widened` drill below is this
table as a mutant, and the live-board census is what caught it.

Refused by the CLASS rather than by the one spelling, which is
`T-219`'s own lesson turned on its residual — that card exists because
`docs/tasks` was refused while the `docs` containing it was waved
through.

**DECLARED CEILING, ROUTED NOT FOLDED**: an INTERIOR dot segment
(`lib/./parser`) has the identical symptom and a DIFFERENT remedy — it
names real ground spelled badly, so the honest fix NORMALISES rather
than refuses. Filed as `T-219-s6` (`status: suggested`,
`touches: [lib-parser]`). 0 live tokens carry one at this base, and the
new census body asserts that zero so it reds the day one is written.

### THE CENSUSES, EACH PRINTED WITH ITS CONTROL FIRST

Both new live-board censuses expect ZERO, and a zero-count census is
satisfied by a predicate that never matches anything. So each runs its
own instrument over a PLANTED card first and asserts the planted card is
found, then runs the live board:

- `T-219-s2` census — planted `T-940` carrying `.` and `../nputer-app`
  is found by the identical predicate; live board: **0**; interior dot
  segments: **0**.
- `T-219-s4` census — planted `T-941` carrying `nowhere-at-all` is
  found WITH the oracle supplied; live `planned` cards with an
  uncomparable fence, with the oracle: **0**; the same population
  oracle-less: **`T-164-s1 bin`**, which is what stops the zero above
  being vacuous — drop the oracle and the board does produce an
  instance.

### COMMANDS, IN THE ORDER RUN, WITH THE EXIT READ FROM `$?` UNPIPED

| # | command | cwd | exit |
|---|---|---|---|
| 1 | `npx vitest run` (baseline) | lib/parser | 0 — 363 passed / 363, 16 files |
| 2 | `node measure-T-219-s4.mjs` (live board, before) | lane root | 0 |
| 3 | `npx vitest run` (after the `rule()` term) | lib/parser | 0 — 366 |
| 4 | `npx vitest run` (after the fence bodies) | lib/parser | 0 — 372 |
| 5 | `npx tsc --noEmit` | lib/parser | 0 |
| 6 | `npm run build` | lib/parser | 0 |
| 7 | `node measure-T-219-s4.mjs` (live board, after) | lane root | 0 |
| 8 | 8 poison drills (table below) | lane root | each as recorded |
| 9 | `npm ci` | app | 0 |
| 10 | `npm run build` | app | 0 |
| 11 | `npm ci` | tools/e2e | 0 |
| 12 | `gate-run.mjs parser` | lane root | 0 — GREEN, 372 bodies |
| 13 | `gate-run.mjs app` | lane root | 0 — GREEN, 1141 bodies |
| 14 | `gate-run.mjs rust` | lane root | 0 — GREEN, 639 bodies, 18 targets |
| 15 | `gate-run.mjs e2e` | lane root | 0 — GREEN, 602 bodies |
| 16 | `npx vitest run` (card amendment folded in) | lib/parser | 0 — 372 |
| 17 | `npx tsc --noEmit` · `npm run build` | lib/parser | 0 · 0 |
| 18 | `cargo run -q -p nputer-index -- index --check --root ../..` | app/src-tauri | **1 — STALE**, a real stale (counts printed, not MISSING) |
| 19 | `npm run capabilities:check` | tools/e2e | 0 — **CURRENT** (50745 bytes) |
| 20 | `docs-gate.mjs <5 changed paths>` | lane root | **1 — FIRES** |
| 21 | `gate-run.mjs parser` (after the `verifying` stamp) | lane root | 0 — GREEN, 372 |
| 22 | `gate-run.mjs app` (after the stamp) | lane root | 0 — GREEN, 1141 |
| 23 | `docs-gate.mjs docs/tasks/T-219-s6-…md` | lane root | **1 — FIRES**; frontmatter parses, status legal |
| 24 | `gate-run.mjs e2e` (2nd, abandoned — below) | lane root | **3 — REFUSED, `zero-bodies`** |
| 25 | `npx playwright test <the 2 docs-gate specs>` | tools/e2e | **1 — REFUSED at config load**, `EADDRINUSE` on 15219 |
| 26 | `gate-run.mjs e2e` (FINAL tree, foreground) | lane root | 0 — GREEN, 602 bodies |

`NPUTER_E2E_PORT=15219` on every gate-run, per this lane's dispatch;
`1420` was read twice (`lsof`, nothing listening) and never touched.

**ROWS 24–26 ARE A MACHINE-SCOPED COLLISION, REPORTED RATHER THAN
TIDIED** — `method/lane-protocol.md` rule 4 names this class in as many
words, and two of those three exits look like defects and are not. The
second e2e run was started while FIVE checkouts on this host were
running Playwright at once (`T-219-s4`, `T-237-s2`, `V-T-225-s1`,
`V-T-230-s7`, `V-T-237-s2` — read 2026-09-02T08:22:25Z on `Mac.lan` via
`pgrep` + `lsof -d cwd`). It reached body **88 of 602 in eight
minutes**: a suite whose wall time is a health band was measuring the
contention rather than the tree, so I killed MY OWN run and no other.
Two things followed, and both are the machinery working:

- **`gate-run` REFUSED the killed run** — `exit=-1 bodies=0
  verdict=REFUSED reason=zero-bodies`. A killed suite exits non-zero and
  would otherwise read as a RED this lane caused; the blessed runner
  declined to call zero bodies an answer at all, which is instance 2 of
  its own charter catching a live case.
- **Killing the Playwright parent ORPHANED its web server**, which kept
  LISTENING on the lane port, so the next invocation died at config LOAD
  — *"lane port 15219 is not bindable (EADDRINUSE)"* — an exit 1 that is
  not a test result and names no body. `lsof -nP -iTCP:15219
  -sTCP:LISTEN` returned one `node` pid whose cwd was **this lane's own
  `app/`**; it was killed, the port went free, and row 26 is green. A
  PORT is machine-scoped while a worktree is checkout-scoped: every
  written rule stayed satisfied while these two collided.

Row 26 is the authoritative e2e reading, and it is the FINAL tree — the
`verifying` stamp, these notes and `T-219-s6` all in place. **No red in
this lane was ever attributable to the diff**: rows 12–15 were green
before the contention began, and rows 21–22 and 26 are green after it.

### DRILLS — one side only, every restore proved by sha256

`lib/parser/src/lanes.ts` pristine
`0b03bb190fa4117bab43221b8ac14daa34bee17dac7e83c472bd538d68d56fba`;
`lib/parser/src/fence.ts` pristine
`c43287022938e79cebc67862ba08a3d26e65dc0992e355572c78694f11f9bc52`;
`docs/tasks/T-164-s1-…md` pristine
`1118b9bd27830711c5ee4c2cb03b758ff817a4d981959f38ba69fdfd81361553`.
**Every drill restored to its pristine hash, byte for byte**; no drill
touched a test file, and no drill ran in another checkout.

| mutant | what was mutated | killed |
|---|---|---|
| `guardterm` | `lanes.ts`: drop `&& fence.unusable.length === 0` | 2 — the unresolvable-token body and the bare-dot body |
| `ownclause` | `lanes.ts`: `if (own.length > 0)` → `> 99` | 4 — those two, the attribution body, and the PRE-EXISTING `THE THIRD VERDICT IS CARRIED` body |
| `nosubtract` | `lanes.ts`: drop `.filter((t) => !own.includes(t))` | 1 — the attribution body alone |
| `dotbranch` | `fence.ts`: `if (false && DOT_DOMAIN.test(…))` | 5 — four `T-219-s2` fence bodies and the bare-dot lanes body |
| `onespelling` | `fence.ts`: `DOT_DOMAIN` → `/^\.$/` | 1 — the climbs-out body ALONE |
| `widened` | `fence.ts`: `DOT_DOMAIN` → `/^\./` | 3 — the climbs-out body's CONTROL and two LIVE-BOARD censuses |
| `dataplant` (DATA) | `T-164-s1`'s card: `touches: [bin]` → `[bin, .]` | 3 — all three live-board censuses |
| `guardterm2` | `guardterm` repeated at the final tip | 2, unchanged |

**THE POSITIVE CONTROLS WERE SEEN FAILING, in the two directions that
matter.** `onespelling` is the refusal built for ONE spelling — it reds
the climbs-out body and nothing else, so that body is what stops
`T-219`'s own defect being repeated inside its residual. `widened` is
the refusal built too broadly — it reds the control INSIDE the
climbs-out body (`.claude/hooks` refused) and two live-board censuses,
so the widened direction, which is the dangerous one and looks just as
green, is pinned by this repository's own data and not by an assertion.
`dataplant` is the DATA mutant the census needs: it proves the LIVE
loop, not only the planted control, finds a real instance.

**KILL-SET CONTAINMENT.** `nosubtract` ⊂ `ownclause` and `guardterm` ⊂
`ownclause`, but the containment is at the BODY level and not at the
assertion level: `guardterm` reds the state assertions
(`startable: []`) while `ownclause` reds the reason assertions in the
same bodies, which is why both terms are load-bearing. Neither
`widened` nor `dotbranch` contains the other (`dotbranch` kills no
live-board census; `widened` kills no fence-token body but the
climbs-out one), and neither `widened` nor `dataplant` contains the
other. **And no mutant of the eight killed `T-219`'s own two
`T-219/T-227` bodies** — measured, not argued — so nothing added here
is riding on what that card already pinned.

### STANDING GATES, DERIVED ON THE MERGE FORECAST

Six paths in the forecast diff (`git merge-tree --write-tree main HEAD`
→ `git diff --name-only main <tree>`):

    lib/parser/src/fence.ts
    lib/parser/src/lanes.ts
    lib/parser/test/fence.test.ts
    lib/parser/test/lanes.test.ts
    docs/tasks/T-219-s4-…md
    docs/tasks/T-219-s6-…md

- **GRAPH REGEN — FIRES.** Four `*.ts` paths outside `docs/`.
  `index --check` reads **STALE** at this tip with the four files named
  and counts printed (1170079 → 1170311 bytes, 2504 → 2505 symbols);
  regeneration is the integrator's, in the merge commit.
- **DOCS GATE — FIRES.** Asked, not assumed: `docs-gate.mjs` over the
  changed paths exits 1 and names `docs/tasks/T-219-s4-…md` as a code
  input to twelve readers across three suites — `npm test` from `app/`,
  `npm test` from `tools/e2e/`, `npx vitest run` from `lib/parser/`.
  All three were run AFTER the `status: verifying` stamp and are green
  (rows 21–23 above). Frontmatter parses for every live card, statuses
  are legal, governing-document budgets hold.
- **BOOT GATE — NOT OWED.** No path under `app/src-tauri/**` or
  `app/src/**`, neither manifest.
- **METHOD EVAL GATE — NOT OWED.** No path under `method/**`.
- `capabilities:check` is **CURRENT**: this lane renamed no e2e spec
  body and added none, and CAPABILITIES is generated from the e2e spec
  names.

### FOR THE VERIFIER

- The two behaviour changes are independent and compose: `expandFence`
  gains a refusal, `rule()` gains a term. Either alone leaves half the
  bare-dot path open, which is what the `dotbranch` and `guardterm`
  drills separate.
- The clause SUBTRACTION is the one change that alters an EXISTING
  sentence: a token owned by the card is no longer re-attributed to the
  lane it was compared against. The pre-existing `THE THIRD VERDICT IS
  CARRIED` body covers it (it reds under `ownclause`), and the new
  attribution body pins both arms.
- Nothing outside `lib/parser/**` and `docs/tasks/` was written. No
  throw was added, no filesystem read, no interface removed.
- The battery figures in the table above were read on this working tree
  with everything except this notes section in place; appending prose to
  a task-card body changes no frontmatter, no `touches:` and no
  `status:`, so it moves no suite's answer.

### WHERE THE BRIEF WAS WRONG

1. **Row 4's base commit is wrong, as the dispatch message predicted
   (T-233).** The brief says `5d3d516d495c879514bc0362f919ab4bd75c0069`;
   this worktree's HEAD at cut is
   `24bfec8e10b3b13699e137befc11c729b13fd986`, which the brief's own
   rows 7/39/51 also report as the integration tip and the lane tip.
   Every figure here is measured at the HEAD, not at row 4.
2. **The card's own "Measured at T-219's fix-pass tip" figures have
   moved and one of them was unqualified.** `startable with NO lanes`
   reads **111**, not 114, at this base. And *"would move under this one
   (unusable > 0): 1"* is an ORACLE-LESS measurement: with the oracle
   `brief.mjs --dispatch` supplies, **0** cards move. The card says
   *"derive it, never quote this card's figure"*, and this is what
   deriving it returned. The dispatching seat amended the card in flight
   with the same finding; the amendment was copied into this lane by
   path and is committed with this work.
3. **The dispatch message's conditional on `T-164-s1` does not fire.**
   It says *"if the correct ruling makes it unfenceable, the card is
   repaired there and said so"*. With the oracle supplied — the surface
   that dispatches and the surface that arms — the correct ruling leaves
   `T-164-s1` `startable`, so there is nothing to repair; the amended
   card now forbids the edit outright, and no edit was made.
4. **The brief's ADVISORY block says *"the card carries no acceptance
   criteria, so there is nothing to build against"*.** The card carries
   a `## What to build` list of five SHALL clauses plus a TRIAGE ruling
   and an absorbed sibling. That is the assembler's pattern-keyword miss
   (`method/interview/decomposition.md`), not a property of the card,
   and it fed the seat recommendation.
5. **Row 11 offers two ceremony rows and does not pick one**, as it says
   it will not. Derived here: the diff touches shipped code
   (`lib/parser/src/**`), so the row is *S, touching shipped code —
   executor → verifier*. The card carries `review: independent` and a
   named verifier, and the dispatch message says this lane does not
   merge; the three agree, so nothing was guessed upward.

## VERDICT — APPROVED at `9970370a`, 2026-09-02, blind verifier `claude-opus-5[1m]@subagent`

Bench `/Users/ujju/Projects/nputer-V-T-219-s4`, cut alongside the lane at
this card's BASE `24bfec8e10b3` (orchestrator 5c) and installed there in
CONVENTIONS' fresh-clone ORDER. Judged over
`git diff 24bfec8e10b3..9970370a99066f3a4d0dc9f3bfedd59710c67a2e` —
6 files, +942/−11, of which 0 lines were DELETED from either test file.

**THE BLINDNESS WAS CLOCK-SHAPED, NOT MERELY DISCIPLINED**, and it is
stamped rather than asserted. Phase 1 was sealed before the lane's tip
existed:

    attack-V-T-219-s4.md   sha256 1b010fd57acdf66a5abeca1ed52494d7bde1fdd8c95c05249e30cedde6f103cd
    ground-V-T-219-s4.md   sha256 04cd98522444238d392380c5935739b9dbd275df895a36f70f3b789460fe5b9c
                           sealed 2026-09-02T07:57:38Z
    addendum (below)       sha256 eececdc0a5c5a2afb2e40faccfa03e81dc27777af55d1543a1be8508772e92b7
                           sealed 2026-09-02T08:01:40Z

The phase-2 dispatch message DID carry executor-derived specifics (the
guard's text, body counts, suite figures, blast radii). **That did not
break phase 1, and the hashes are why**: both files were sealed and their
digests reported before that message was written, so the attack set cannot
have been assembled from it. Every figure this verdict prints was
re-derived in this bench; where mine and the lane's differ, §6 reconciles
them rather than picking one.

**The card was amended BY PATH mid-phase-1** (`65010e4d63e7`, after my
phase-1 measurement found the TRIAGE stamp's T-164-s1 casualty false at
the dispatch surface). I sealed a separate ADDENDUM against the amended
text rather than editing the first seal, so the pre-amendment record stays
auditable. **A28**: the card copy at this tip is NOT byte-identical to
`65010e4d`'s — it differs by `status: building`→`verifying` and an
appended notes section, which is exactly the permitted set; the amended
TRIAGE paragraph is byte-unchanged.

### 1. The criteria, each measured

**`rule()`'s guard SHALL also require the fence to be COMPARABLE** — met.
The term is `fence.unusable.length === 0`, added INSIDE the
`holds.length === 0` guard rather than as an early return (T-057; the
module's own comment demands this so the `cardMissing` clause can still
accumulate). It is read off `expandFence`'s own answer, not re-derived —
and it is not `fence.paths.length > 0`, which I had pre-committed as the
wrong term because it would silently also move a card whose own-file
carve-out emptied `paths` (§7).

**The `unfenceable` clause list SHALL gain a cause naming the unresolvable
tokens** — met, and the gap was real: every pre-existing clause is keyed
on a HOLD, and `holds` is empty when the lane list is, so before this diff
a zero-lane refusal would have printed `"…none could be ruled out: . A
fence that cannot be COMPUTED…"`. The new `own` clause is read off the
same `fence.unusable` the guard tests, so the word that refuses and the
word that explains cannot diverge. **Unasked-for and correct**: the hold
clause now SUBTRACTS the card's own tokens, because `compareFences`
returns the UNION and one token previously bought two clauses pointing at
two different cards to repair. I had this as attack item A7 and the lane
had already closed it.

**A body SHALL hand in NO lane, with the control** — met. The zero-lane
body asserts `expect(order.lanes).toEqual([])` by name (V-T-219's exact
finding, pinned), and carries FOUR controls, not one: a resolving card
still startable; the same token plus an oracle that CARRIES it, startable
again (pinning the refusal to resolvability rather than to the word); an
oracle that does NOT carry it, still refused; and the one-lane arm showing
the asymmetry that made this V-T-219's shape.

**THE LIVE-BOARD EFFECT SHALL BE STATED, derived, at its ref** — met, and
correctly qualified. Re-derived by me at `9970370a` with my own phase-1
scripts, over the live board with no lanes:

| | startable | unfenceable |
|---|---|---|
| base `24bfec8e`, WITH the dispatch oracle | 111 | 0 |
| tip `9970370a`, WITH the dispatch oracle | **111** | **0** |
| base `24bfec8e`, oracle-less | 111 | 0 |
| tip `9970370a`, oracle-less | **110** | **1** (`T-164-s1`) |

**No live card moves at the surface that dispatches.** This matches the
lane's own table cell for cell and matches the amended TRIAGE.

**With the oracle supplied, proved on a PLANTED card** (the amendment's
criterion) — met, and I proved it independently. Planted
`touches: [zzzznosuchthing]` with the FULL `knownPathOracle` (1324
entries) supplied: `startable` at `24bfec8e`, **`unfenceable` at
`9970370a`**, reason naming the token. Planted `touches: [.]`, same
oracle: `startable` with `paths: ["."]` at the base, **`unfenceable` with
`unusable: ["."]`** at the tip. The resolving control `[lib-parser]` stays
`startable` in all four cells — it did not move, which is what makes it a
control.

**SHALL NOT edit T-164-s1's card** — met.
`git diff --stat 24bfec8e..9970370a -- 'docs/tasks/T-164*'` is empty.

### 2. The bare dot, and the two halves meeting

`DOT_DOMAIN = /^\.\.?(?:\/|$)/`, a FIRST-SEGMENT test on the NORMALISED
form, hung in `expandFence` between the empty-token refusal and
`unfenceableWithin`. **It pushes the raw token onto `unusable`**, which is
the half I pre-committed as the one that could silently be missing (A17):
an issue-only refusal would have left the dispatch answer `startable`.
Measured at `9970370a`: `.` `..` `../x` `./x` → `unresolved`, `paths: []`;
`./lib/parser` → `path` `["lib/parser"]`; `.claude`, `.github/workflows/`,
`.gitignore`, `./docs/tasks/x.md` → all still `path`. **No legitimate
token was broken.**

### 3. THE DRILL — kill-set containment, run by me, landings read from `git diff`

Six mutants, each landing verified from `git diff --unified=0`, each
reverted before the next, tree clean after (`67` bodies in
`lanes.test.ts` + `fence.test.ts` at this tip):

| mutant | kill set |
|---|---|
| **M1** drop `&& fence.tokens.length > 0` | T-219's *"refused with NO LANE LIVE"* — **and nothing else** |
| **M2** drop `&& fence.unusable.length === 0` | s4 *"UNRESOLVABLE … NO LANE LIVE"*, s4 *"BARE DOT … unstartable here"* |
| **M5** drop `.filter((t) => !own.includes(t))` | s4 *"names the card that owns each unresolved token"* |
| **M6** disable the `own` clause | L210 *"an unresolvable token is `unfenceable`"* + all three s4 bodies |
| **M3 (DATA)** new body's fixture token made RESOLVABLE | s4 *"UNRESOLVABLE … NO LANE LIVE"* |
| **M4** disable the `DOT_DOMAIN` branch | s4 bare-dot body + all four `expandFence` bare-dot bodies |

**M1's kill set and M2's kill set are DISJOINT.** Neither contains the
other, so T-219's own body and this card's are both load-bearing and the
new one is not a restatement — which is the finding step 2b asks for, and
the reason a kill count of one was never the test. M5 is independently
load-bearing. **M3 is the data mutant**: the body reds when its fixture
token is made resolvable, so the fixture carries the property rather than
the assertions passing vacuously. Every mutant landed at the site the
property lives — `rule()`'s guard, `rule()`'s clause list, `expandFence`'s
token loop — never in a reason string or a sort.

### 4. Controls, judged as test code (verifier.md 2b)

Both new live-board censuses expect ZERO and **run their control FIRST,
where the arming is ABSENT**: a planted card is pushed through the
identical predicate over the identical loop and is FOUND, before the live
zero is asserted. That is the T-210/T-203 defect answered by construction
rather than by assertion — one arrangement does not decide both sides. The
oracle-less row is what stops the oracle-supplied zero being vacuous, run
through the same predicate over the same population. The `interior` row
censuses the DECLARED CEILING at zero so it reds the day one is written,
rather than leaving it silent.

### 5. Security sweep — clean

No dependency change (`package.json`/lock untouched). No new import, no
`readFileSync`, no `process.`, no `eval`/`new Function` anywhere in the
`lib/parser/src` diff — the package stays pure and browser-safe. One new
regex, `/^\.\.?(?:\/|$)/`: start-anchored, no nested quantifier, no
alternation over a repeated group — linear, so no backtracking exposure on
attacker-controlled `touches:` text. No object-literal map introduced
(ADR-009). **The guard fails CLOSED**: every ambiguity lands in `unusable`
and therefore in `unfenceable`, never in `disjoint`.

### 6. Figures reconciled rather than disputed

The lane reports the blast radii over **118 distinct NORMALISED** tokens
(8 / 89 / 0); I measured **124 distinct RAW** tokens (10 / 91 / 0). Both
are true at `9970370a` — `.claude` and `.claude/` are two raw tokens and
one normalised one — and **the CARD counts agree exactly: 34, 139, 0.**
Not a discrepancy; two denominators, and the lane named its own.
Independently confirmed: `startsWith('.')` would refuse 34 live cards,
`includes('.')` 139, the segment test **0**. The lane chose the only shape
that costs nothing.

Also re-derived here: parser **372** bodies green at `9970370a`
(363 at `24bfec8e`, so +9 = +3 `lanes` +6 `fence`), `tsc --noEmit` 0.
`index --check` is **STALE** at this tip — 2504→2505 symbols, +232 bytes,
one new symbol (`DOT_DOMAIN`), with the real two-sided second line rather
than the `committed: MISSING` false red. **That is not a finding**: the
GRAPH REGEN bullet makes regeneration the INTEGRATOR's at the merge, and a
`lib-parser` lane that regenerated `docs/architecture/graph.json` would
have written outside its fence. The lane disclosed it.

### 7. NOT failures — routed, never blocking (verifier.md step 6)

1. **A trailing or interior dot segment is still accepted**: `x/.`,
   `x/./y`, `x/../y` classify `path` at `9970370a` and reserve domains
   nothing can match. This is the lane's DECLARED ceiling, said in the
   code at the site, censused at zero, and routed as **`T-219-s6`**
   (`status: suggested`, `suggested_by` set) — whose remedy, resolving a
   `.` segment and a `..` segment in `normalizeFenceToken`, covers the
   trailing shape as well as the interior one. Correctly routed, not
   folded in.
2. **A FIFTH instance of the same "two halves disagree" class, and it is
   PRE-EXISTING.** A subject whose fence fully resolves, held by a lane
   whose CARD declares no `touches:`, reaches `unfenceable` with an EMPTY
   clause middle: *"…none could be ruled out: . A fence that cannot be
   COMPUTED…"* — the exact string T-219's own body asserts against, from
   the other side. I measured it at BOTH `24bfec8e` and `9970370a` and it
   is byte-identical, so this diff neither caused nor worsened it.
   `compareFences` returns `unusable` with an EMPTY `unusable` list for a
   token-less counterparty, and no clause can speak. Worth a card.
3. **A card whose only token is its own file** (`touches:` = its own path)
   is `startable` at both refs with `paths: []`, while `buildLaneFence`
   refuses to arm it on `fence.paths.length === 0`. Also pre-existing,
   also outside this card's ask.

### 8. Step 7 — the gates my OWN commit could move

This verdict is prose in `docs/tasks/`, and prose is a code input here.
Re-run at MY tip, not at the tip I was sent — results in the commit
message of the verdict commit itself.

**AND IT CAUGHT ONE — MINE.** The first form of this stamp was
`verified_by: claude-opus-5[1m]@subagent`, this seat's exact model id.
`gate-run parser` came back `exit=1 bodies=372 verdict=RED`: four bodies
across `assignment.test.ts` and `smoke.test.ts`, on one
`assignment-violation` issue — *"'verifier' assigns "claude-opus-5@subagent"
but 'verified_by' records "claude-opus-5[1m]@subagent" … 'claude-opus-5'
is not among the models the stamp names"*. The `[1m]` context-window
suffix is not read as the model it qualifies, and **assignment is binding
(D5)**, so the FIELD carries the assigned identity and this prose carries
the exact one. A verdict measured green at the commit it was sent and
committed without re-running would have handed that red to whoever picked
the branch up next, attributed to them. It is recorded here rather than
quietly fixed, because the rule that caught it is only worth what its
instances are.

Gates at the tree this commit carries, all four re-run AFTER the verdict
prose was written, none inherited from the tip I was sent:

    gate-verdict suite=parser exit=0 bodies=372  ref=9970370a  GREEN
    gate-verdict suite=app    exit=0 bodies=1141 ref=9970370a  GREEN
    gate-verdict suite=e2e    exit=0 bodies=602  ref=9970370a  GREEN
    docs-gate <this card>  FIRES — names app/, tools/e2e/ and lib/parser
      as owed (all three run above); 0 frontmatter issues; every live
      task card parses with a legal status; ADR-019 budgets hold.

**AND ONE MORE ATTRIBUTION, RECORDED BECAUSE I NEARLY GOT IT WRONG.**
While my e2e run was in flight the sibling lane `T-229-s8` was running
its own on this machine, and I spent several minutes tailing ITS
temporary output directory believing it was mine — watching
`push-guard.spec.ts:2718 › a lane holds no seat, so a holder record in
one refuses nothing` go red. It is not this tree's red: the assertion's
own stack names `/Users/ujju/Projects/nputer-T-229-s8/tools/e2e/tests/
push-guard.spec.ts:2753`, every spec path in MY run resolves under
`/Users/ujju/Projects/nputer-V-T-219-s4`, and my run finished
`602 passed`. STATE's rule is *attribute a red by NAME, never by count* —
here the name that settled it was a PATH, and two concurrent e2e runs on
one machine are exactly the arrangement that makes a temp-directory guess
look like a measurement. **Reported to the dispatching seat as an
observation about that lane, not a ruling on it.**
