---
id: T-221
title: THE ONE CHARACTER THAT MAKES CONTAINMENT CONTAINMENT IS UNPINNED — drop `sharedDomain`'s separator and NOTHING REDS, while three call sites now decide whether lanes may run at all
feature: F-06
milestone: 4
priority: 2
size: S
status: done
blocked_by: []
touches: [lib-parser]
suggested_by: "T-209's blind verifier, as suggestion S1 in its APPROVED verdict; re-raised by it after T-212 was dispatched onto the same primitive, and confirmed at the architect/integrator seat"
builder:
review: independent
---

**ONE CHARACTER DECIDES WHETHER `tools/e2e` CONTAINS `tools/e2e-helpers`,
AND NOTHING HOLDS IT THERE.**

`lib/parser/src/fence.ts:270-271`:

```ts
if (b.startsWith(`${a}/`)) return b;
if (a.startsWith(`${b}/`)) return a;
```

The behaviour is CORRECT today. `T-209`'s verifier planted the probe and
measured `tools/e2e` versus `tools/e2e-helpers` correctly **allowed**.

**But drop the `/` and nothing in the repository reds.** Measured at
`9d90978`, rebuilding the parser first:

    parser                                        344/344 GREEN
    lane-fence + card-preflight + dispatch-order   87/87  GREEN

Confirmed independently at this seat: **no body anywhere names an
adjacent-prefix pair.** `grep` over `lib/parser/test/` and
`tools/e2e/tests/` returns nothing.

## WHY THIS GOT WORSE WHILE IT SAT UNFILED

When the verifier raised it, `sharedDomain` had **one** consumer. Since
then:

- **`T-209` merged** (`4cb2313`) — the dispatch guard now REFUSES a lane
  whose fence overlaps a live one, and it computes that with this
  primitive.
- **`T-212` was dispatched** (`0a8dd58`) to add the **push** and **merge**
  call sites onto the same function, by that card's own instruction not
  to re-derive it.

So a silent regression here no longer misprints a row in a brief. It
**serialises lanes that never touch, at three gates**, and it does so
quietly, because a spurious refusal looks exactly like a correct one.

**THAT IS RULE 5'S OWN MEASUREMENT REINTRODUCED BY THE TOOL BUILT TO END
IT.** Rule 5 records the cost precisely: *"Measured on the session that
ran six lanes concurrently: every block was a naming collision and not
one real collision occurred."* Six for six spurious. This is the one
character standing between that measurement and its recurrence.

## The shape of the fix, and why it is small

**One body.** An adjacent-prefix pair asserted DISJOINT — `tools/e2e`
against `tools/e2e-helpers`, or any pair where one string is a prefix of
the other and neither is a path prefix of the other.

**A removal-only mutant cannot find this** and that is the point:
deleting the separator does not delete a behaviour, it WIDENS one, and
every existing body asserts cases that stay true under the widening. This
is the fourth instance in three days of *removal-only mutants cannot
distinguish an exact matcher from a containment one* — and the first
where the containment primitive itself is the subject.

## Acceptance criteria

- A BODY SHALL assert that a pair of paths where one is a STRING prefix
  of the other but not a PATH prefix is **disjoint**, and it SHALL red
  when the separator is dropped from either direction of `sharedDomain`.
- THE drill SHALL mutate **each direction separately**. The function has
  two symmetric lines; a body that only covers one leaves the other
  exactly as unpinned as before, which is this card in miniature.
- **A POSITIVE CONTROL SHALL prove a genuine containment pair is still
  reported as SHARED** — a guard that reports everything disjoint is
  indistinguishable from one that works, and would silently disarm
  `T-209`'s refusal entirely.
- THE mutant's landing SHALL be read from `git diff`, never from the
  mutator's own report — four instances across two agents in one night,
  where a pattern that silently failed to match reported "survived".
- Verification: headless, the parser suite.

## Read beside

`T-209` (the dispatch guard, first consumer, whose verifier raised this),
`T-212` (the push and merge call sites, dispatched onto the same
primitive), `method/lane-protocol.md` **rule 5** — cited by ordinal and by
its own capitals, because a line number is a figure and this project
falsified two of them in one night.

## Why the verifier did not file this itself

Recorded because the reasoning is right and worth keeping: *"I hold no
lane, my bench is gone, and writing into the checkout you're sitting in
is the collision rule 4 answers no."* It handed the finding back rather
than taking a write it had no standing for — and re-raised it unprompted
when the dispatch of `T-212` made it more urgent than when it was
written.

## Implementation notes

Built at base `9d56b47`, branch `task/T-221-lane`, worktree
`/Users/ujju/Projects/nputer-T-221`. Diff: **one file**,
`lib/parser/test/fence.test.ts`. **`lib/parser/src/fence.ts` IS
UNCHANGED** — the behaviour was correct, only unpinned, and this card was
never a fix.

### What was added

Five bodies in one `describe`, `T-221 — THE ONE CHARACTER THAT MAKES
CONTAINMENT CONTAINMENT`:

1. a fixture-shape guard;
2. **DIRECTION ONE** — the adjacent-prefix pair with the deeper string on
   the RIGHT, asserted disjoint; pins the `b.startsWith` line;
3. **DIRECTION TWO** — the same pair with the deeper string on the LEFT;
   pins the `a.startsWith` line;
4. **POSITIVE CONTROL, RIGHT deeper** — a genuine child still SHARED,
   witness = the narrower domain;
5. **POSITIVE CONTROL, LEFT deeper** — the same containment from the
   other side.

**THE FIXTURE IS DERIVED, NEVER TYPED.** The domain is `fenceOf('T-038')`
— a `done` card whose `touches: [tools/e2e/]` expands to exactly
`tools/e2e`, this card's own motivating domain — and the sibling
(`-helpers`) and the child (`/tests`) are CONSTRUCTED from it. Body 1
exists because `''` is the repository root and `sharedDomain`
short-circuits on it two lines BEFORE either separator: a fixture that
came back empty would take both disjointness pins green against code that
never ran the thing they exist to pin.

### The drill — five mutants, every landing read from `git diff`

Drilled at commit `aeb49ee` (the work was committed FIRST). Mutated the
CODE side only; the test file's sha256 is unchanged end to end. Each
landing was read from the actual `git diff`, never from the editor's own
report — and note that `git diff --numstat` printed `1 1` for M1 and M2,
which cannot distinguish a one-for-one character swap from any other
one-line edit.

| # | mutant | suite | kill set |
|---|---|---|---|
| M1 | direction one's separator dropped | 1 failed / 348 passed | **DIRECTION ONE alone** |
| M2 | direction two's separator dropped | 1 failed / 348 passed | **DIRECTION TWO alone** |
| M3 | direction one's whole line deleted | 3 failed / 346 passed | POSITIVE CONTROL RIGHT + `PIN TWO (b)` + `THE ARCHITECT'S OWN ERROR, AS A PIN` |
| M4 | direction two's whole line deleted | 1 failed / 348 passed | **POSITIVE CONTROL LEFT alone** |
| M5 | `normalizeFenceToken`'s trailing-slash drop deleted | 10 failed / 339 passed | contains body 1 |

M1 and M2 are the card's demand met exactly: **each direction kills its
own body and neither kills the other's.** A body covering one direction
would have left the other exactly as unpinned as before.

Restored after each with
`git restore --source=HEAD --staged --worktree -- lib/parser/src/fence.ts`
— both sides named, per the POISON DRILL's staged-index clause — and
proved by hash rather than by an empty diff:

    28c022e68c8e98895a7539aa9e184037f55e6c83a8278e193ba8f9054fb101a5
      lib/parser/src/fence.ts  (== git show HEAD:<path> at every restore)
    910da270e46eb75c95652c941d12e97c804cadbe96e1bb58a2b320e5fb526b53
      lib/parser/test/fence.test.ts  (never mutated)

### TWO FINDINGS THE CARD DID NOT CARRY

**(1) THE CARD'S CLAIM REPRODUCES AT THIS BASE, MEASURED RATHER THAN
INHERITED.** Under M1 the suite was 348/349: every one of the 344
pre-existing bodies stayed GREEN with the separator dropped. The card
measured that at `9d90978`; it still holds at `9d56b47`.

**(2) THE LEFT-DEEPER LINE WAS UNPINNED IN THE POSITIVE DIRECTION TOO,
AND THAT IS A SECOND HOLE THE CARD DOES NOT MENTION.** M4 deletes that
line OUTRIGHT and kills exactly ONE body in 349 — the positive control
added here. Before this card that line could have been **deleted
entirely** and the whole 344-body suite would have stayed green. Its
mirror is not in that position: M3 kills two pre-existing bodies
(`PIN TWO (b)` and `THE ARCHITECT'S OWN ERROR, AS A PIN`), because both
exercise containment with the shallower domain on the LEFT. **The
asymmetry is the finding.** The card reasoned that the two lines were
equally unpinned under the WIDENING mutant, which is true; they turn out
to be *unequally* pinned under the REMOVAL one. A removal-only mutant
reaches this half and misses the card's half; the widening mutant reaches
the card's half and misses this one. **Neither mutant class alone reaches
this function**, which is a sharper statement of the card's own thesis
than the card makes.

### The class and its sweep

**CLASS:** a path-containment test written as a bare `startsWith` with no
separator anchor — the off-by-one that makes `tools/e2e` "contain"
`tools/e2e-helpers`.

**SWEEP, EMPTY apart from the subject.** `grep -rn "startsWith"
lib/parser/src/` returns 16 call sites at this ref — a non-empty result,
so the search is shown capable of answering. Four are containment tests
and all four carry their separator: `sharedDomain` (the subject, twice),
`expandFence`'s own-file carve-out, and `assignment.ts`'s
`executed.startsWith` guard. The remaining twelve are prefix STRIPPING or
sigil tests, not containment. Outside the fence I read the three siblings
that compute this same question, and all three are anchored:
`touchTokensOverlap` in `app/src/lib/board-model.ts` — whose own doc
comment names this exact hazard by name — `lane-fence.mjs`'s domain test,
and `range-rule.mjs`'s `triggerMatches`, whose excluded directory is
captured by a regex that includes the slash. **No route owed.**

### Gates, derived at this tip from the merge forecast

- **GRAPH REGEN — FIRES.** The forecast diff carries
  `lib/parser/test/fence.test.ts`, a `.ts` outside `docs/`. ASK THE GATE
  rather than predicting; the crate is outside this fence, so the run is
  the integrator's.
- **BOOT GATE — NOT OWED.** Nothing under `app/src-tauri/**`,
  `app/src/**`, or either manifest.
- **DOCS GATE — FIRES.** The forecast diff carries this card, a path
  under `docs/` the parser suite reads live. The suite it owes is the
  parser's own, run here: **349/349, exit 0**.
- **METHOD EVAL GATE — NOT OWED.** Nothing under `method/**`.

## VERDICT — APPROVED, 2026-09-01, blind verifier at `1e84b59`

Bench `/Users/ujju/Projects/nputer-V-221`, detached at the lane's BASE
`9d56b47` — never the tip. Attack set stamped
`d3a4ca717af23bca58c4f9b7660da52d399ad7f24c876ed695548817b1509a31`
BEFORE the diff was opened, and unrevised after.

**Every executor claim reproduced independently.** All five mutants
re-planted at the bench, each landing read from `git diff`, each kill
required to be a NAMED body raising an `AssertionError` with an
expected-vs-actual — never a suite error.

| mutant | measured | kill set |
|---|---|---|
| M1 separator dropped, direction one | 1/348 | DIRECTION ONE only |
| M2 separator dropped, direction two | 1/348 | DIRECTION TWO only |
| M3 right containment line deleted | 3/346 | POS CTRL RIGHT + PIN TWO (b) + ARCHITECT'S OWN ERROR |
| M4 left containment line deleted | 1/348 | POS CTRL LEFT only |
| M5 normalise slash-drop deleted | 10/339 | contains body 1 |

Suite 349/349 exit 0, typecheck 0. **`fence.ts`'s blob is `893a8a8` at
both refs** — byte-identical, so this card was a PIN and never a fix.

**Kill-set CONTAINMENT, not count**: DIRECTION ONE `{M1,C}` against
DIRECTION TWO `{M2,C}` — neither contains the other, so both are
load-bearing. Same for the two positive controls.

### THE FINDING THIS LANE ADDS TO THE METHOD

The base picture, measured at `9d56b47`:

    line                   widening mutant   removal mutant
    right-deeper           0 kills           2 kills
    left-deeper            0 kills           0 kills

The right line had positive coverage and no separator coverage; **the
left line had neither — it could have been DELETED OUTRIGHT with the
whole suite green.** Headline: *neither mutant class alone reaches this
function.* A removal-only drill reads the right line as covered and never
finds this card's defect at all.

**The verifier refined the executor's phrasing rather than repeating
it**: the claim that widening *misses* the left line is stronger than the
measurement supports — M2 also returns 0 at base, so widening does flag
it. What M4 uniquely establishes is that the left line's EXISTENCE, not
merely its separator, was unasserted.

### A DERIVATION GUARD IS UNDER-MEASURED BY CODE MUTANTS, BY CONSTRUCTION

The fixture guard's kill set is `{M5}`, contained in POS CTRL LEFT's —
which reads as a restatement and is not one. The verifier planted a
**DATA mutant**, changing `T-038`'s `touches:` to `tools/method-evals/`,
and it killed **exactly body 1**. Kill set `{M5, DM1}`: uncontained.

**The guard is load-bearing against derivation drift, and no code mutant
can show it.** Kept here because it generalises: where a body exists to
prove a fixture is DERIVED rather than typed, the mutant that tests it is
a mutation of the DATA, and a code-only drill will always mis-grade it as
a restatement.

### Note-level corrections, none blocking

1. *"Diff: one file"* is true of the work commit `aeb49ee`, not the tip
   (2 files, +233/−1). **Name the ref** — the same class of figure this
   project corrected two commits earlier.
2. The sweep calls four sites containment tests; `component.ts:328` is a
   fifth. Safe (`outer.slice(0,-2)` retains the `/`), census off by one.
3. POS CTRL RIGHT's kill set is identical to pre-existing `PIN TWO (b)`
   under everything tried — a restatement in kill-set terms. Its value is
   co-location and diagnosis, not discrimination.
4. `fenceOf('T-038')` runs at describe-evaluation and `card()` throws, so
   a DELETED `T-038` fails as a collection error rather than a clean
   assertion. A changed `touches:` fails cleanly.

### AND THE FOURTH CRITERION DEMONSTRATED RATHER THAN ASSERTED

The verifier's own first M1 attempt used `perl`, the shell ate the
escaping, and what landed was ``b.startsWith(`​`)`` — the whole
interpolation gone rather than the separator — reddening 9 bodies, which
would have been recorded as a kill for direction one.

**`git diff --numstat` printed `1 1` for that wrong mutant and for the
correct one, identically.** On this exact file, in this exact function,
numstat cannot tell a correct separator mutant from one that deletes the
interpolation. That is an argument for the rule independent of anybody's
carefulness.
