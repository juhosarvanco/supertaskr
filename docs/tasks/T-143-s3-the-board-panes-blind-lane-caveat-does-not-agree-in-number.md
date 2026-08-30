---
id: T-143-s3
title: The board pane's blind-lane CAVEAT says "is claimed" and "its fence" about a list of two, which is the third live instance of T-143's own number-agreement class
feature: F-06
milestone: 4
priority: 6
size: S
status: verifying
suggested_by: verifier claude-opus-5@subagent @T-143
blocked_by: []
touches: [app-board]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**FOUND BY T-143's VERIFIER WHILE ENUMERATING THAT CARD'S SWEEP, and
routed because it is OUTSIDE that lane's fence** (`[lib-parser,
tools/e2e]`; this is `app/src/lib/board-model.ts`, which is `app-board`).

## The sentence

`dispatchFrontier`'s dispatchable reason in
`app/src/lib/board-model.ts` appends, when a live lane's card cannot be
read:

    " CAVEAT: " + blindLanes.length + " of those lanes (" +
      joinIds(blindLanes.map((l) => l.branch)) +
      ") is claimed by no card, so its fence could not be READ —
       unknown is not empty."

With two blind lanes that renders as *"2 of those lanes (X, Y) **is**
claimed by no card, so **its** fence could not be READ"*.

## Why it is the same finding and not a typo

T-143's criterion 4 exists because `lanes.ts`'s `fenced` residual said
*"no card for it"* about a list of two, while its sibling
`unfenceable` branch — written in the SAME commit — carried a `many`
flag with two dedicated poison arms. The card's argument is that this
sentence is read by a human deciding whether to OVERRIDE a coarse-fence
warning, and *"the LAST sentence that can afford to read as though one
lane were unreadable when three are"*. **The board pane's caveat is read
by exactly that person, in the GUI rather than the terminal.**

T-143 fixed the parser's copy (both directions pinned, one body each)
and the two `tools/e2e` copies. This is the third live one, and T-143's
verifier assigned a fourth — a clause the T-143 diff itself wrote — as a
correction at that merge. Four copies of one sentence-shaped rule.

## What it owes

1. The number agreement, derived from `blindLanes.length` the way the
   surrounding sentence already derives *"live lane"* / *"live lanes"*
   two clauses earlier in the same string.
2. **A pin in both directions**, because the existing coverage does not
   have one. DERIVED BY READING the tree at `14075ac2ddd6` rather than
   by mutating it — `app/src` is outside T-143's fence, so its verifier
   would not plant there: exactly ONE body drives this sentence,
   *"a lane no card claims has an UNKNOWN fence, and the caveat says
   so"* in `app/test/select-board.test.ts`. It drives ONE blind lane and
   asserts `toContain("CAVEAT")` and the branch name, never the verb and
   never the pronoun, so the mutation from *"is"* to *"are"* has nothing
   to fail against. That is the exact state T-143 measured on the parser
   before it fixed it. A two-blind-lane body is what the fix owes, and
   the existing body already carries the positive control to copy.
3. Nothing else. The caveat is genuinely CONSUMED at the dispatchable
   sentence rather than merely computed, which T-143's verifier checked
   and recorded; `blindLanes` is not a second `lanesWithNoCard`.

## Whether the class deserves a mechanical keeper

Worth asking at triage rather than deciding here. Four instances of
"a residual clause whose number must agree with the list it names" have
now been found by hand, in three packages, one of them introduced by the
very lane that was fixing the other three. A lint for this is not
obviously honest (a grep for singular verbs near a `.length` would fire
on prose that is fine, which is the reason `docs/CONVENTIONS.md` refuses
the comparable figure-in-a-comment lint in writing). **The cheaper
keeper is a shared helper** — one function that renders *"N lanes (a, b)
are"* / *"1 lane (a) is"* — so the four copies become one, and the
number stops being a thing each author has to remember.

## PROMOTED at standing triage sitting #2 (2026-08-30), F-06 priority 6 — and the keeper question is ANSWERED: NOT HERE

**RULED: this card takes the instance and the pin, and does NOT build the
shared helper.** The card asked the question at triage and the answer is
a fence fact rather than a preference: the copies of this sentence live
in three different packages, so one helper cannot be written from inside
`app-board` — a criterion ordering it would be a criterion the fence
forbids, which `method/tasks/TASK-FORMAT.md` names a DEFECTIVE CARD. The
lint arm stays declined for the reason the card already gives. **If the
lane still believes a helper is right after building the instance, it
ROUTES the argument with what it learned rather than taking it.**

## Acceptance criteria

- THE caveat's number SHALL be derived from the blind-lane count the
  same way the surrounding sentence already derives *"live lane"* /
  *"live lanes"* two clauses earlier in the same string — the verb and
  the pronoun both, since the current text gets both wrong together.
- THE change SHALL be pinned IN BOTH DIRECTIONS: one body driving a
  single blind lane and one driving two, each asserting the rendered
  verb and pronoun rather than only that the caveat appears. The
  existing one-lane body asserts neither, so a mutation between the two
  spellings has nothing to fail against today.
- THE lane SHALL NOT touch the caveat's other half: the clause is
  genuinely consumed at the dispatchable sentence rather than merely
  computed, which this card's parent checked and recorded.
- THE lane SHALL NOT build a shared renderer, and SHALL route the
  argument for one if it still holds after the work — see the ruling
  above.
- Verification: headless. The app's own unit suite green at the lane's
  ref, with the new two-lane body shown failing against the singular
  spelling before it passes against the derived one.

## Implementation notes

**BUILT 2026-08-30 by executor claude-opus-5@subagent**, lane
`/Users/ujju/Projects/nputer-T-143-s3` on
`task/T-143-s3-number-agreement`, cut at `51fa31c0964c`; the work is one
commit, `4054a7d`. Fence read from `.nputer/lane-fence.json`
(`touches: [app-board]`); both edited source paths are in the manifest and
`docs/tasks/` is the always-writable domain. `brief.mjs --task T-143-s3`
from tools/e2e/ exits 0 and prints T-143-s3 DISJOINT from all three
sibling lanes live at the run (T-154-s2, T-159-s1, T-167-s1).

### The fix, before and after

`selectDispositions` in `app/src/lib/board-model.ts`. BEFORE — one
spelling for every length, four lines after the same string derives
`" live lane" + (inFlight.length === 1 ? "" : "s")`:

    ") is claimed by no card, so its fence could not be READ — unknown is not empty."

AFTER — the verb, the pronoun, and the noun the pronoun governs all
derived from `blindLanes.length`:

    (blindLanes.length === 1
      ? ") is claimed by no card, so its fence could not be READ"
      : ") are claimed by no card, so their fences could not be READ") +
    " — unknown is not empty."

The NOUN moves with the pronoun because each lane has its own fence, which
is how `lib/parser/src/lanes.ts` renders the same decision
(`many ? 'those fences' : 'that fence'`) — that file was read, never
edited: it is `lib-parser` and outside this fence.

### Files changed

- `app/src/lib/board-model.ts` — the ternary above plus the comment saying
  who reads this sentence and why the noun follows the pronoun.
- `app/test/select-board.test.ts` — the existing body *"a lane no card
  claims has an UNKNOWN fence, and the caveat says so"* now asserts the
  rendered SINGULAR clause (it asserted only `toContain("CAVEAT")` and the
  branch name, which is what left the mutation nothing to fail against);
  new body *"TWO lanes no card claims: the caveat says ARE and THEIR
  FENCES"* drives two blind lanes, asserts the rendered PLURAL clause,
  refuses the singular spellings, and carries a positive control — the
  same two-lane reading with one lane claimed renders the singular again,
  so the number is proved DERIVED rather than constant.
- `docs/tasks/T-143-s6-…-tools-e2e-imports-neither-app-nor-parser.md` —
  the routing the last criterion orders (see below).

### POISON DRILL — 4 mutants, 4 killed, restorations sha256-proved

Committed FIRST (`4054a7d`), then drilled in a DETACHED scratch worktree
at that commit, one stem derived from the lane id (`T-143-s3-drill`) spent
on the worktree, the driver script and every results file. TypeScript
only, so no `CARGO_TARGET_DIR`. `app/dist` built in the drill tree before
the baseline, per the bullet's own clause. Drill baseline: 49 files /
1048 tests, exit 0. Every mutant is ONE-SIDED — `board-model.ts` only,
never a test literal — and each mutated TEXT was read back from
`git diff -U0`, not inferred from a substitution count (all four reported
`substitutions: 1`).

| mutant | code under test → | suite | what redded |
|---|---|---|---|
| m1 plural verb | `) are claimed` → `) is claimed` | exit 1, 1 of 1048 | the two-lane body |
| m2 plural pronoun+noun | `their fences` → `its fence` | exit 1, 1 of 1048 | the two-lane body |
| m3 singular arm | `) is claimed … its fence` → the plural spelling | exit 1, 2 of 1048 | the one-lane body AND the two-lane body's control |
| m4 the count test | `blindLanes.length === 1` → `!== 1` | exit 1, 2 of 1048 | both bodies |

m1, m2 and m4 are the card's *"shown failing against the singular
spelling before it passes against the derived one"* — the two-lane body
reds against the singular text in three independent ways. Restoration
after every mutant: `git restore --source=4054a7d --staged --worktree --`
(both sides named), then the HASH, which is the proof —
`3f03ab7103ad259da1d36b387a48f5ec464269b82f36d29b2f5ed631ec29a5f0` for
`board-model.ts`, identical for all four and to the pre-drill reading; the
test file never moved (`8638ce7dc287be7b8164338f4ee404acb162ede15f906681db775d53fb64e9f2`).
Post-drill the drill tree ran 1048/1048 exit 0 with a clean `git status`,
and the worktree was removed.

### Gates, unpiped exit codes read from `$?`

- `npm test` from app/ — **exit 0**, 49 files / 1048 tests at `4054a7d`
  (baseline before the change at the same ref, built: 49 / 1047 — the
  delta is this card's one new body).
- `npm run build` from app/ — **exit 0** (the app's typecheck IS its two
  `tsc` calls; `npm run typecheck` does not exist here, T-073).
- `npx vitest run` from lib/parser/ — **exit 0**, 16 files / 336 tests;
  `npx tsc --noEmit` — **exit 0**.
- `npm run lint:docs` from tools/e2e/ — **exit 0** (every live card's
  frontmatter parses with a legal status, including the new T-143-s6;
  governing-document budgets hold).
- DOCS GATE, diff half, run at `a8a7441` in the ONE SPELLING, unpiped,
  against `main` = `51fa31c0964c` (`git merge-tree --write-tree` exit 0,
  tree `7a85cae1`) — **exit 1, which is the gate HAVING a verdict**: the
  two cards this lane writes are code inputs, so it names three suites.
  Two of the three are green above, at the tip that carries the cards.
  The third is the e2e lane, below.
- `npm test` from tools/e2e/ (`NPUTER_E2E_PORT=14543`, lsof-read at ZERO
  rows immediately before binding; 1420 left to the human's app) —
  **exit 1: 319 passed, 2 failed**, and both failures are the LIVE-LANE
  class, not this diff. Both are in `tests/session-economics.spec.ts`
  and both carry the same assembler refusal: *"fences are not disjoint:
  T-154-s2 tools/e2e against T-157 tools/e2e — the same entry"*. That is
  a fact about the live worktree list and two OTHER cards — the sibling
  lane T-154-s2 holds `tools/e2e` while T-157 declares it — reproduced
  outside the suite by `node tools/e2e/scripts/brief.mjs --task T-157`
  from this checkout. `git diff --name-only main HEAD` at `a8a7441` is
  four paths, none under `tools/e2e/` and none a card either message
  names. This is the class `T-143-s1` was filed for; nothing in
  `tools/e2e` was touched, that tree being a sibling lane's today.
- NOT RUN, and owed at the merge rather than here: GRAPH REGEN
  (`index --check`) and the BOOT GATE — this diff touches `app/src/**`
  and `*.ts` outside docs/, so both fire, and both are the integrator's
  step at the merge's own commit pair.

### Criteria

All four buildable criteria are met and the fifth (verification) is the
drill above. **Nothing is unmet.** The third criterion was obeyed by
NOT acting: the caveat's other half — whether the clause is consumed —
was left alone, and this lane confirmed only that it still is (the string
is appended to `reason` at the `dispatchable` arm, which the app renders).

### The routing the fourth criterion orders

Filed as **T-143-s6** (`status: suggested`), and the argument is NARROWER
than this card's body assumed, which is the point of routing it after
building rather than before. `app/package.json` already depends on
`@nputer/parser`, so a helper in `lib-parser` reaches `lanes.ts` and
`board-model.ts` — two of the four copies. It CANNOT reach
`dispatch-brief.mjs`: `tools/e2e/package.json`'s own description says that
package *"imports neither app nor parser"* by design (ADR-011 family), and
reversing that for a nine-word renderer is an ADR-scale call, not a
keeper. And the four copies do not share a SENTENCE — three deliberate
wordings — so what is shareable is the DECISION (singular or plural from a
length), not the prose. The card proposes the dull pair-picker and writes
down the case against it too.

## Verdicts
