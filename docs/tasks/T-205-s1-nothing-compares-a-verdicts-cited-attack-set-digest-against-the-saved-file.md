---
id: T-205-s1
title: MF-09 proves the digest comparison refuses, and nothing RUNS it against a real verdict — the saved attack set lives in a scratchpad no gate may walk, so the last step of T-205's chain is a hand step
feature: F-06
milestone: 4
size: M
priority: 4
status: verifying
suggested_by: executor claude-opus-5@subagent @T-205
blocked_by: []
touches: [tools/method-evals]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review:
---

**WHAT T-205 BUILT, SO THIS CARD IS SCOPED TO WHAT IT DID NOT.**
`method/roles/orchestrator.md` 5d requires phase 1's return to be saved
and hashed before phase 2 is spawned and phase 2's verdict to cite the
digest, and it REFUSES a verdict whose citation does not match.
`tools/method-evals/evals/mf-09-attack-set-digest-refusal.mjs` holds
that refusal and demonstrates it: a five-row matrix (match, mismatch,
missing file, absent citation, truncated prefix) run against the
comparison, and a positive control that runs the SAME matrix against
three implementations lacking the property — a presence check, a prefix
compare, and a fail-open missing-file branch — requiring each to be
caught. **So the comparison is proved. Nothing invokes it.**

## The gap, stated precisely

**THE SAVED FILE IS NOT IN THE TREE.** `docs/CONVENTIONS.md`'s bench
bullet puts phase 1's return in the session scratchpad under the SCRATCH
RULE, so an eval that walked to it would be reading a MACHINE-scoped
surface — the class `method/lane-protocol.md` rule 4 rules on, and the
one it says to DERIVE from the lane rather than default. A repository
gate therefore cannot find the artifact a verdict cites, and the last
link in T-205's chain — *this verdict, against this file* — is run by
hand or not at all.

## The design question this card must answer first

Three shapes, and the card should pick with reasons rather than inherit
one:

1. **A checker the verifier and the integrator RUN**, taking the card
   and re-deriving the digest from the file the verdict names. Cheapest;
   catches an edited attack set; catches nothing if nobody runs it, and
   *nobody runs it* is exactly what T-205 was written about.
2. **The attack set committed beside the verdict**, which makes the
   digest checkable from the tree alone. Costs bytes in a byte-banded
   corpus, and puts an attack set where a later executor can read it —
   `roles/orchestrator.md` 5c says THE ATTACK SET NEVER REACHES THE
   EXECUTOR, and after the verdict is a different question than before
   it, which this card has to answer rather than assume.
3. **A gate at the landing**, where the card and the run's own capture
   are both in hand — the shape `gate-run`'s verdict token already uses.

## Acceptance criteria

- THE check SHALL be INVOKED by something other than a seat remembering
  to invoke it, and the card SHALL name what invokes it.
- A VERDICT citing a digest that does not match the file it names SHALL
  cause a non-zero exit at that invocation point, before the verdict is
  treated as a verdict.
- A MISSING or unreadable saved file SHALL be a refusal, never a skip.
- WHERE the artifact stays outside the tree, the card SHALL say how the
  invocation reaches it WITHOUT defaulting a machine-scoped path
  (`method/lane-protocol.md` rule 4).
- MF-09's matrix SHALL be REUSED rather than restated (`T-057`).

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 4, at the T-225-s2 merge (6691fc5)

The architect seat. The digest checker MF-09 proves needs an invoker over a real verdict; one method-evals lane after T-205-s4.

## Implementation notes — executor claude-opus-5@subagent, 2026-09-09

Lane `/Users/ujju/Projects/nputer-T-205-s1`, branch
`task/T-205-s1-digest-refusal-wired`, base `6dd44a6`. Fence
`tools/method-evals`, read back off `.supertaskr/lane-fence.json`; nothing
outside it was written.

### THE DESIGN QUESTION, ANSWERED WITH REASONS

The card names three shapes and says to pick rather than inherit.
**Shapes 1 and 2 are both built, in the only order that makes shape 1
survive its own objection; shape 3 is routed.**

- **SHAPE 1 — a checker.** `tools/method-evals/verdict-digest.mjs`.
  Cheap, catches an edited attack set, and the card's own objection is
  fatal on its own: *"catches nothing if nobody runs it, and nobody runs
  it is exactly what T-205 was written about."* So it is never shipped
  alone.
- **SHAPE 2 — the attack set committed beside the verdict. REFUSED, and
  this is the card's own open question rather than mine to close.**
  `roles/orchestrator.md` 5c says THE ATTACK SET NEVER REACHES THE
  EXECUTOR; the card says after the verdict is a different question and
  *"this card has to answer rather than assume"*. A lane executor
  answering it by committing sets into the tree is precisely the seat 5c
  excludes — and two of the sealed sets sitting in the scratchpad right
  now belong to LIVE lanes (`T-224`, `T-265`), whose executors would
  gain them. **No real attack set is committed anywhere in this diff.**
  The fixtures are synthetic and say so in their own text. Routed as
  `T-205-s12` for a ruling, and the checker needs no change when it
  comes: a tree home is one more resolution root.
- **SHAPE 3 — a gate at the landing.** The strongest, and outside this
  fence twice over (`tools/e2e`, which was `T-224`'s fence at dispatch).
  Routed as `T-205-s14`, parked behind `T-205-s12`.

### WHAT INVOKES IT (the first criterion's answer, stated on the card)

**`node tools/method-evals/run.mjs` — the METHOD EVAL GATE — through the
new eval `MF-10`.** `MF-10` is in the corpus, so the gate every seat
already owes runs the checker over the real board, over five committed
fixture cards, and over a real verdict, with no seat remembering
anything. **AND THE RESIDUAL IS NAMED RATHER THAN LEFT TO BE FOUND:**
that gate's trigger is `method/**` and a verdict lands in `docs/tasks/`,
so it fires on every merge except the one that lands the citation it
would check. One clause in `docs/CONVENTIONS.md` closes it; that file is
outside this fence. Routed as `T-205-s13`.

### THE OUTCOMES, AND WHY THERE ARE THREE AND NOT TWO

`VERIFIED` · `REFUSED` (exit 1) · `UNAVAILABLE` (exit 3, never a pass).
**Collapsing the last two would be the defect.** MF-09's MISSING row
already rules that a saved file we were POINTED at and could not read is
a refusal — otherwise deleting the file is the bypass — and that row is
enforced here unchanged, by the same judge. UNAVAILABLE is the different
case this card was written about: the citation names a bare filename in
a machine-scoped scratchpad, and `method/lane-protocol.md` rule 4 says
DERIVE it from the lane, never default it. So the checker refuses to
guess, prints where the method expects the file, and exits 3 — the house
code for *this run is not a claim* (`lib/exit.mjs`). Reaching outside the
tree is done through roots NAMED at the call and nowhere else:
`--scratch <dir>` (repeatable), `SUPERTASKR_ATTACK_SET_DIR`, or an
absolute path the citation itself carries. **There is no fourth root and
no built-in guess.**

### MEASURED AT `4de3675`, ON THE LIVE BOARD

- 14 citations in 556 cards. With no root named: 0 verified, 0 refused,
  **14 unavailable, exit 3**.
- With `--scratch` on the dispatching session's scratchpad: **7 VERIFIED,
  0 REFUSED, 7 unavailable, exit 3** — the seven whose sealed files still
  exist (T-239-s4, T-246, T-247, T-248 ×2, T-249, T-264). **This is the
  last link of T-205's chain, performed for the first time.**
- A decoy file written under a real citation's name (`attack-set-T-264.md`)
  is **REFUSED at exit 1**, naming the card, the line, the cited digest
  and the hash the file actually has.

### THE REUSE (fifth criterion, `T-057`)

`judge` and the citation grammar are IMPORTED from
`evals/mf-09-attack-set-digest-refusal.mjs`; `WELL_FORMED` and
`FULL_DIGEST` are BUILT from `CITATION.source` rather than retyped beside
it, so what a digest looks like is spelled once. MF-09 gains five
`export` keywords and a header note and **no behaviour moves**. `MF-10`
runs MF-09's `matrix` — the matrix, imported — through the checker's
whole walk, which is the arm a judge-level proof cannot reach: MF-09's
PREFIX row is a line the strict grammar never matches, so a collector
keyed on that grammar would lose the row *between* the two files.

### FOR THE VERIFIER

- **The line anchor is a judgement call and it is load-bearing in both
  directions.** `SITE` requires `attack set:` to open a line, because
  `docs/CONVENTIONS.md` says the citation goes *"on a line of its own"*.
  Two real cards (`T-205-s4:64`, `T-262:46`) quote the grammar
  mid-sentence while discussing the rule; without the anchor both become
  malformed citations and the gate reds for cards doing nothing wrong.
  The T-901 fixture carries such a paragraph so the anchor is under
  assertion rather than under trust.
- **`inspect` has two seams** (`judge`, `collect`) that exist only for
  the positive control. `MF-10` asserts BY IDENTITY that the production
  path uses MF-09's judge and the checker's own collector —
  `docs/CONVENTIONS.md`'s LIFTING A SAFETY GUARD TO DISCRIMINATE. Worth
  a second look: a seam is a way in.
- **Exit ordering: 3 outranks 1**, the same rule `run.mjs --bump` states,
  and both counts are always printed so the ordering never hides a row.
- I committed a red at `90b570e` (a substring expectation with the wrong
  case) and caught it on the next run; `bf3d67c` is the repair and says
  so. The cause was chaining a commit onto an edit without reading the
  exit back — AN EDIT SCRIPT'S SUCCESS IS A GATE, NOT A STEP, broken by a
  seat able to quote it.

### THE DRILL — 7 of 7, at `4de3675`, detached worktree, restored by sha256

Producer mutated (`verdict-digest.mjs`), one side only, every landing
read back with `git diff -U0` before the suite ran.

| # | mutant | `run.mjs` | `--selftest` |
|---|--------|-----------|--------------|
| M1 | fail-open on UNAVAILABLE | 1 RED | 1 RED |
| M2 | a walk that found nothing is CLEAN | 1 RED | 0 |
| M3 | the collector drops its LINE ANCHOR | 1 RED | 0 |
| M4 | the collector is MF-09's strict grammar alone | 1 RED | 0 |
| M5 | a malformed citation is SKIPPED | 1 RED | 0 |
| M6 | an absent absolute path becomes UNAVAILABLE | 1 RED | 1 RED |
| M7 | the shipped judge is a PRESENCE check | 1 RED | 3 RED |

Restoration: `sha256 1e64c8dc5e0d8d2e8fdb632b7de0ace681abeef834a8b7aaf62e1b74367ccbf2`
against `git show 4de3675:tools/method-evals/verdict-digest.mjs`, equal,
with `git status --porcelain` empty as the companion.

**THE FIRST PASS KILLED 6 OF 7 AND THE SURVIVOR IS THE FINDING.** M6 —
`resolveCited` returning `null` for an absolute path that does not exist
— turned MF-09's MISSING row into an UNAVAILABLE and every arm stayed
green, because the matrix only asks ACCEPT or REFUSE and both codes are
non-zero. The caller, though, is told *I could not tell you* about a file
somebody DELETED, which is MF-09's own bypass one level up. Arm 3b
(`4de3675`) closes it, and two earlier arms (`90b570e`) came out of the
same exercise: designing the kill set found two properties `MF-10`
claimed in its header with nothing able to fail on either.

**THE POSITIVE CONTROL IS DEMONSTRATED FAILING**, not merely passing:
`--selftest` goes RED under M1 and M6 (`MF-10: 1 of 5 degradation(s) went
undetected`) and refuses to claim a baseline at all under M7 (`COULD NOT
RUN — the UNDEGRADED checker already fails 2 matrix row(s)`).

### PARKED, ROUTED, NOT BUILT — AND RECONCILED AGAINST MAIN

The ask (`<scratch>/ask-T-205-s1.md`) was written before the build began
and every item was parked, not waited on. **BY THE TIME THE BATTERY RAN,
THE ARCHITECT SEAT HAD ALREADY ANSWERED IT ON MAIN, and two cards this
lane had drafted were duplicates of that answer — they were withdrawn
rather than filed.** Read at `b825e87` (main, 2026-09-09):

- **ASK 1, a tree home for the sealed sets** — refused as a lane write
  and ruled a card: **`T-205-s6`**, `docs/benches/<card-id>/` holding
  `attack-set.md` / `ground.md` / `stamps.txt`, written by the INTEGRATOR
  in the checkpoint commit that lands the verdict, `blocked_by:
  [T-205-s1]`. Its criterion 2 is this lane's checker exiting 0 with no
  `--scratch` — which is exactly the design here: **one more resolution
  root and no code change.** This lane's draft card for the same class
  was withdrawn; `T-205-s6` owns it and is better specified.
- **ASKS 2, 3 and 4a** — the bench bullet's own retraction, the METHOD
  EVAL GATE's trigger, and `docs/reference/10-gates.md`'s MF-10 line —
  **routed as CORRECTIONS AT THIS MERGE**, per `b825e87`'s subject. This
  lane's draft card for them was withdrawn too. **INTEGRATOR: those three
  edits are owed at the merge and no card carries them.**
- **ASK 4b, a leg at the landing**, is the one half nobody routed. Filed
  as **`T-205-s14`**, parked behind `T-205-s6`.

Also filed, and outside the ask entirely: **`T-276`** —
`tools/method-evals` is under no typecheck although every sibling package
is, and it carries two JSDoc errors today (`mf-05:60` TS2532,
`mf-09:203` TS7006, both pre-existing).

### A LANE MAY NOT `blocked_by` A CARD THAT LANDED AFTER ITS BASE — MEASURED, NOT REASONED

`T-205-s14` was filed with `blocked_by: [T-205-s6]`, which is the true
dependency and which **`T-205-s6` landed on main for at `b825e87`, after
this lane's base `6dd44a6`.** The lane cannot see it, so the parser
records a `dangling-reference` issue against the LIVE BOARD — and that
issue count is pinned in four places at once. It redded **seven bodies
across two suites**: `app/test/architecture-dogfood.test.ts`'s
*both input layers parse clean*, `app/test/select-board.test.ts`'s
*no live card names a blocker that does not exist*,
`tools/e2e/tests/push-checks.spec.ts`'s
*this repository's own board passes every cheap check*, and four
`tools/e2e/tests/shell-frame.spec.ts` bodies whose parse-error list pin
moved 60 → 61. One character of frontmatter, seven bodies, two suites.

The field is now `[]` and the card says in its own text that the
INTEGRATOR sets it at the merge, where `T-205-s6` exists. **Recorded here
because the failure is invisible from inside a lane**: the reference is
correct, the card is real, and only the base ref makes it wrong.

### THE PARSER LEG IS RED AT THE BASE AND THIS LANE DID NOT MOVE IT

`gate-run.mjs parser` at `f840f8f`: **exit 1, 377 bodies, 3 failed** —
`test/fence.test.ts`'s three live-board census bodies, every one naming
`T-274 docs/tasks` and nothing else. Attributed at the base in a detached
worktree at `6dd44a6` with `npx vitest run`: **identical — 3 failed / 374
passed of 377, the same three bodies, the same name.** The diff moves
nothing, and the four cards this lane files all expand cleanly. Main has
since repaired it at `ab00399`, whose own subject says *"the lanes cut in
between attribute the red at their base"*, which is exactly this.

### THE BATTERY AT THE TIP `f840f8f`

    gate-verdict suite=app    exit=0 bodies=1163 targets=1  GREEN
    gate-verdict suite=e2e    exit=0 bodies=690  targets=1  GREEN
    gate-verdict suite=rust   exit=0 bodies=639  targets=18 GREEN
    gate-verdict suite=parser exit=1 bodies=377  targets=1  RED  (T-274, at the base)

`node tools/method-evals/run.mjs` exit 0 over 10 evals; `--selftest` exit
0 over 10, MF-10's five degradations all detected. `npm run typecheck`,
`lint:tokens --selftest`, `lint:tokens` and `lint:docs` all exit 0.
