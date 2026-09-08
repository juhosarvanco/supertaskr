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

## Verdicts

### 2026-09-09 — claude-fable-5-1@subagent (blind verifier, phase 2)

VERDICT: APPROVED WITH ASSIGNED CORRECTIONS

attack set: sha256:8bb544098ea67f5c3bef9f09f2005db69c87c2caf0fbeae7ea5c34c911cf5cd9 (attack-set-T-205-s1.md)
ground truths: sha256:8b640c5617bfaedba065ad4260688dd845183f6cadc234aa80388a3f3c16079f (ground-T-205-s1.md)

Bench `/Users/ujju/Projects/nputer-V-T-205-s1`, detached at the tip
`faf1b69ae2faca7d30ae0a300c86b8d8c2ba7b72` (branch
`task/T-205-s1-digest-refusal-wired`), base
`6dd44a604f10eeb242c5baafb79a3fe8db7c6d11`. Every figure below is my own
measurement at the ref it names; the executor's figures were claims and
each was re-derived. Scratch files carry `V-T-205-s1` in the session
scratchpad; the drill ran in a scratch worktree detached at `faf1b69`.

**THE FRAME I HAD.** Two spawns. Phase 1 (the attack set) was its own
spawn and reported 0 tool calls; this harness cannot deny tools, so the
no-tool property was kept by instruction and is disclosed here rather
than claimed (`docs/reference/07-verification.md`, the frame
disclosure). Phase 2, this seat, read in this order: the verifier
contract, the attack set (digest verified before opening), the ground
truths, the standing set, the card at the tip — whose Implementation
notes ARE the executor's notes, so I had read them before the diff and
say so — then the diff, and only then the executor's report and the
ask file. The card's notes carry executor-derived specifics (seven
mutants, fourteen citations, four suite figures); none was taken on
authority.

**THE DESIGN QUESTION (attacks A1–A4, falsifier F7).** Answered with
reasons: shape 1 (a checker) plus a shape 2 that commits SYNTHETIC
fixtures only — I read both saved fixtures, they say so in their own
text and hash to `188bd2bf…` and `c9768b57…`, the digests the fixture
cards cite; no real set is in the diff. Shape 3 is routed as
`T-205-s14`. Orchestrator 5c is argued on the card, not assumed. Held.

**THE CRITERIA, ONE BY ONE.**

1. *Invoked by something other than a seat remembering; the invoker
   named.* MET TO THE STANDARD THE PROJECT'S OTHER GATES MEET, and no
   higher. The invoker is `MF-10` inside `node tools/method-evals/run.mjs`,
   the METHOD EVAL GATE — a convention CONVENTIONS obliges the
   integrator to run on `method/**` merges. No hook, CI job or
   `gate-run` leg runs it (G13 re-derived: a grep over `.claude/hooks`,
   `.github`, `tools/e2e/scripts` and every `package.json` finds no
   invoker; the trigger lives in prose only, which answers the seat's
   question in ask 3). `MF-10` is in the default form (10 evals) and
   under `--selftest` (attack A1.5). The residual the executor names is
   real and LARGER than stated: even after correction 2 makes the gate
   fire at the merge that lands a citation, `MF-10` walks the board with
   NO root, so a bare-name citation is UNAVAILABLE and the gate stays
   green — at the gate the check constrains a citation's FORM (a
   truncation, a missing file part, prose mistaken for a citation) and
   never its CONTENT, until `T-205-s6` gives the sets a tree home or
   `T-205-s14` puts the leg at the landing. Content today is a hand
   step, `--scratch` on the dispatching session's scratchpad, and
   correction 1 writes exactly that into CONVENTIONS instead of the
   retired sentence.
2. *A mismatch causes a non-zero exit at the invocation point.* MET for
   the grammar the method spells, and demonstrated on a REAL verdict:
   T-264's card against a decoy `attack-set-T-264.md` in a temp root →
   REFUSED, exit 1, naming the card, line 352, the cited `6551265…` and
   the decoy's `e9e9206…`; against the sealed file → VERIFIED, exit 0
   (by `--scratch` and by `SUPERTASKR_ATTACK_SET_DIR`, and with a bogus
   `--scratch` ahead of the env root); with no root → UNAVAILABLE,
   exit 3. Two verdict entries on one card: both checked, first-bad and
   last-bad (A2.4). Swapped file names → REFUSED (A4.5). A 65th hex
   character → REFUSED; uppercase hex → VERIFIED, MF-09's documented
   canonicalisation (the refusal text says "lowercase" while the grammar
   is case-insensitive — cosmetic). NOT MET FOR THE SECOND DIGEST LINE
   (A2.3, mutant M5): every recent verdict — this one included — cites
   its ground truths on a line of its own, 16 such lines in 12 cards at
   `faf1b69` in two spellings plus one `seal:` line, and the collector
   sees `attack set:` alone, so a corrupted ground-truths file exits 0
   (probe P22). No method file, CONVENTIONS or reference chapter spells
   that line (reference 07 requires it "on lines of their own" and
   spells nothing), so a checker enforcing a spelling would be a lane
   ruling method text; filed as `T-205-s15` with the census and NOT
   charged as a rejection — the card's scope is T-205's chain, which is
   the attack set. The same anchor drops a bulleted or bold citation
   silently (P21: 0 cited, exit 3 alone, invisible in a board walk);
   zero such lines on the board today; same card.
3. *A missing or unreadable saved file is a refusal, never a skip.* MET.
   Pointed-at absolute path: mode 000 → REFUSED (EACCES); a directory →
   REFUSED (EISDIR); a dangling symlink → REFUSED (ENOENT); a zero-byte
   file → REFUSED (mismatch against `e3b0c442…`); an unreadable CARD →
   REFUSED. A bare name no root holds → UNAVAILABLE, exit 3, the file
   named and the method's expectation printed — the design's third
   outcome, never 0 and never silent; a bare name resolving to a
   directory is UNAVAILABLE too. 3 outranks 1 on a mixed tally (P25).
   `--scratch` with no value and an unknown flag → 2.
4. *Reaching the artifact without defaulting a machine-scoped path.*
   MET in the code, and the card says how: the citation's own absolute
   path, `--scratch` (repeatable, in order), `SUPERTASKR_ATTACK_SET_DIR`
   split on the path delimiter. A grep of the diff for tmpdir, homedir,
   HOME, `/tmp`, `.claude/projects`, glob and `??`/`||` fallbacks finds
   none on the resolution path (`tmpdir` appears only in MF-10's
   throwaway fixture dirs); the walk is cwd-independent (P24, run from
   `/`). BUT the seat's one explicit question in its answer to ask 1 —
   does a REPO-ROOT-RELATIVE citation resolve without a root? — went
   unanswered in the report, and the answer is NO: with
   `docs/benches/T-901/attack-set.md` present relative to the cwd and no
   root named, UNAVAILABLE, exit 3 (P17); with `--scratch <tree>`, 0.
   The card's sentence "one more resolution root and no code change" is
   false as written: `T-205-s6`'s criterion 2 needs the checkout-scoped
   repo root added as a resolution root — rule 4 forbids a MACHINE-scoped
   default, and a root derived from the file's own location, as
   `boardCards` already derives `docs/tasks`, is checkout-scoped.
   Correction 5 carries the measurement to that card.
5. *MF-09's matrix reused, not restated.* MET in the strong sense:
   `judge`, `CITATION`, `matrix` and the three degraded judges are
   imported; `WELL_FORMED` and `FULL_DIGEST` are built from
   `CITATION.source`; `MF-10` pins the production judge by identity;
   and mutant VM9 (withdraw the `matrix` export) takes the WHOLE suite
   to exit 3 at load — the reuse edge is load-bearing, not decorative.
   MF-09's behaviour is unmoved: five `export` keywords and a header
   note, matrix 5/5 and 4/4 degradations at `faf1b69`.

**RUNS AT `faf1b69`.** `node tools/method-evals/run.mjs` exit 0, 10
model-free evals; `--selftest` exit 0, MF-10 5 of 5 degradations
detected, MF-09 4 of 4; `--list` shows MF-10 priced deterministic. The
checker over the board with no root: 14 citations in 558 cards, 0
verified, 0 refused, 14 unavailable, exit 3; with `--scratch` on this
session's scratchpad: 7 VERIFIED (T-239-s4, T-246, T-247, T-248 twice,
T-249, T-264), 0 refused, 7 unavailable, exit 3 — the seven whose sealed
files still exist. The board census: 14 `attack set:` sites in 12 cards,
every one at line start and collected; G10's larger universe of 23
sha256-carrying cards is 12 citation carriers plus poison-drill restore
proofs the anchor correctly ignores. Probe battery: 30 scripted probes
(`V-T-205-s1-probes.sh`, full log beside it), every expectation met.

**THE DRILL — eleven mutants of my own, seven of them ones the executor
did not run, in a scratch worktree detached at `faf1b69`; every landing
read from `git diff -U0`; every restore proved by sha256 against
`git show faf1b69:<path>` (`verdict-digest.mjs` `1e64c8dc…`, the T-901
saved set `188bd2bf…`, `mf-09` `6d17f10f…`), `git status` empty as the
companion.**

| # | mutant (producer side) | `run.mjs` | `--selftest` | the body that reds |
|---|---|---|---|---|
| VM1 | every judged citation VERIFIED | 1 | 3 | MF-10 arm 2 (MISMATCH, MISSING), arm 3 T-902, 3b; no baseline for the control |
| VM2 | a REFUSED tally exits CLEAN | 1 | 0 | arm 3 T-902/T-903/T-904, 3b |
| VM3 | absent absolute path → UNAVAILABLE (the executor's M6) | 1 | 1 | 3b; control arm B undetected |
| VM4 | the line anchor dropped | 1 | 0 | T-901 (exit 1 for 0); arm 4 refuses T-205-s4:64 and T-262:46 for quoting the grammar |
| VM5 | the collector keeps only the LAST site | 0 | 0 | **SURVIVED** — the board count moved 14 → 12 and nothing pins it |
| VM6 | a built-in fourth root (this session's scratchpad path compiled in) | 0 | 0 | **SURVIVED** — arm 4 bypasses `resolutionRoots`; arm 5's card has no file there |
| VM8 | DATA: one byte appended to the committed saved set | 1 | 1 | T-901 by name; control arm C undetected |
| VM9 | MF-09's `matrix` export withdrawn | 3 | 3 | the suite will not load — the reuse edge is load-bearing |
| VM10 | an unreachable bare name labelled VERIFIED at the walk | 0 | 0 | **SURVIVED** — MF-10 reports "14 verified, 0 unavailable" on a board where nothing was reachable |
| VM11 | 1 outranks 3 | 0 | 0 | **SURVIVED** — a header claim with no body |
| VM12 | the `(<file>)` capture ignored, name derived from the card id | 1 | 3 | MATCH row lost, T-902 verifies; no baseline |

Seven of eleven killed at `faf1b69`. Containment: 3b is not contained by
arm 2 (VM3 separates them), T-901 is not contained by arm 4 (VM8), the
identity arm is the only body on the seams; no arm is a restatement.
VM10 is the finding: the fail-open this card exists to forbid, one level
below `exitFor` where control arm E cannot see it, accepted by arm 5
because `verified === cited` reads as "nothing unreachable".

**THE SURVIVORS ARE THE CORRECTION, AND IT IS DEMONSTRATED.** A patch on
MF-10 plus one fixture card (`V-T-205-s1-correction-mf10.patch`, 103
lines, sha256 `521aaca2f3eb99f4271d40552577506cfcbdbd9f1c1be8b1703486989753b86e`):
arm 1b pins the ordering on synthesized counts; fixture `T-906` carries
three citations — a mismatch, a match, a truncation — with the tally
"3 citation(s) in 1 card(s) — 1 verified, 2 REFUSED" as the assertion;
arm 5b runs the T-901 fixture's bare name with NO root and requires exit
3, "1 unavailable", never "1 verified", and the line "No root was named
at this call". Green unmutated: `run.mjs` 0 over 10 evals with 6 fixture
cards, `--selftest` 0 with 5 of 5. Under VM5: red, "T-906 … never says
…". Under VM6: red, "did not say that no root was named". Under VM10:
red, three findings, "exited 0 instead of 3". Under VM11: red, "exits 1
instead of 3". Arm 5b passes where the arming differs — a fixture, not
the live board — so it keeps measuring on the day every board citation
verifies, which is the day the executor's arm 5 goes quiet.

**SECURITY SWEEP.** The new input path is the board's text, which
`docs/tasks` always-writable makes every seat's. A citation's file part
is resolved by `path.join(root, name)` with no containment check, so
`(../outside/secret.md)` VERIFIES through a named root (P18); an
absolute citation hashes any readable file and the refusal PRINTS its
true digest (P18b) — a hash oracle over the operator's filesystem driven
by card text, `T-248`'s class. Read-only, no exec, no network, no new
dependency (the zero-dependency property holds), no secret in the diff,
`--scratch` values are paths and never shelled. Not REJECTED-level: the
board's writers are the project's own seats and the reader is a local
tool; filed as `T-277` with its one-line remedy.

**BASE-REF ATTRIBUTION.** The parser suite reds three
`test/fence.test.ts` live-board bodies by `T-274`'s fence token at the
base `6dd44a6` (repaired on main at `ab00399`, after this lane was cut);
the diff touches no parser file — 13 paths, 10 under
`tools/method-evals/`, 3 under `docs/tasks/`. Confirmed by name in the
battery below and not charged to the lane.

**PROSE FINDINGS IN THE EXECUTOR'S NOTES.** (a) "Routed as `T-205-s12`"
and "Routed as `T-205-s13`" name cards that were withdrawn and never
filed — main at `167621d` holds `T-205-s1..s6`, `s8..s11` and this lane's
`s14`; a reader following either finds nothing (correction 6). (b) The
paste-ready text the seat told the executor to keep on the card for asks
2, 3 and 4a is NOT on the card, although the ask file says the card
carries it; the text is supplied in corrections 1–3 and was checked in
the scratch worktree. (c) "560 cards" at `faf1b69`: 558, by
`ls docs/tasks/*.md | wc -l` and by MF-10's own detail line. (d) "13 real
citations" in the card's chain and in `T-205-s6`'s why: 14, which the
executor caught and I confirm.

**ASSIGNED CORRECTIONS — performed by the integrator at the landing,
each named in the merge message (reference 08); 4 is accepted
mechanically.**

1. `docs/CONVENTIONS.md`, the bench bullet — at `6dd44a6` and on main
   `167621d` lines 321–325 — replace the sentence from "**WHAT IS STILL
   A HAND STEP IS THE WIRING**" to "rather than as a mechanism." with
   hunk 1 of `V-T-205-s1-correction-prose.patch` (sha256
   `563032b7703cf8f2217f507affaaaccd3160204186c2f4b5a3cdc5e38c541d53`),
   which reads: **THE WIRING LANDED WITH `T-205-s1`**:
   `node tools/method-evals/verdict-digest.mjs` hands every `attack set:`
   line on the board to MF-09's judge — VERIFIED, REFUSED (exit 1), or
   UNAVAILABLE (exit 3, never a pass: a bare filename and no root named
   at the call) — and `MF-10` runs it in this gate over the board and
   over committed fixtures. **WHAT IS STILL A HAND STEP IS REACHING THE
   SCRATCHPAD**: the checker takes roots only from the call —
   `--scratch <dir>`, repeatable, or `SUPERTASKR_ATTACK_SET_DIR` — never
   a default (rule 4). Do it by hand at the merge — the landing card as
   the argument, `--scratch` on the dispatching session's scratchpad,
   exit read unpiped — until `T-205-s6` gives sealed sets a home in the
   tree. (Ask 2.)
2. `docs/CONVENTIONS.md`, the METHOD EVAL GATE bullet (`6dd44a6`
   1540–1542; main 1543–1545): after "at any merge whose diff touches
   `method/**`," insert "OR ADDS A LINE MATCHING THE CITATION GRAMMAR
   (`attack set: sha256:<hex> (<file>)`) under `docs/tasks/` — a
   verdict landing, the merge `MF-10` was built for —" so the sentence
   continues "run the model-free eval set and RECORD its exit in the
   checkpoint." Hunk 2 of the same patch. (Ask 3; the trigger is prose
   only, no code reads it.)
3. `docs/reference/10-gates.md` line 149: after "against three
   implementations lacking the property" insert "; MF-10 that comparison
   is RUN — `verdict-digest.mjs` over the board's citations and
   committed fixtures, an unreachable saved file exiting 3 and never
   passing" and let the full stop follow it. Hunk 3. (Ask 4a.)
   Corrections 1–3 were checked jointly in the scratch worktree at
   `faf1b69`: method evals 0 with MF-08 and MF-09's text arms holding,
   `--selftest` 0, `docs-gate.mjs --census` 0 with the governing-document
   budgets holding (4 gated), `lint-tokens` clean. CONVENTIONS' other
   readers named by the census — `kit.rs` under cargo and the brief,
   dispatch-order, docs-input-gate, gate-run and lane-fence specs — are
   the merge battery's to run.
4. `tools/method-evals/`: apply `V-T-205-s1-correction-mf10.patch` (MF-10
   arms 1b and 5b, fixture card
   `fixtures/verdict-digest/cards/T-906-three-citations-and-every-one-is-walked.md`).
   Acceptance: with the patch applied, mutants VM5, VM6, VM10 and VM11
   as specified in `V-T-205-s1-mutants.json` each red MF-10 by the
   finding quoted above, the unmutated tree runs 0 and `--selftest` 0,
   and the restore is proved by sha256.
5. On main, `docs/tasks/T-205-s6-…md`, under "## Implementation notes",
   append: "VERIFIER NOTE (T-205-s1's verdict at faf1b69, measured): a
   citation naming a repo-root-relative path
   (`docs/benches/T-901/attack-set.md`) with no `--scratch` and no
   `SUPERTASKR_ATTACK_SET_DIR` is UNAVAILABLE, exit 3, whatever the cwd;
   only an absolute path resolves without a root. Criterion 2 therefore
   needs the code change its own text allows for: `resolveCited` gains
   the checkout-scoped repo root, derived from the file's location as
   `boardCards` derives `docs/tasks` — checkout-scoped, not the
   machine-scoped default rule 4 forbids. And criterion 1's
   `sha256sum -c` is `shasum -a 256 -c` on this platform (CONVENTIONS'
   bench bullet)."
6. On this card, in the executor's notes: "Routed as `T-205-s12` for a
   ruling" → "Routed: the architect seat ruled it as `T-205-s6`";
   "Routed as `T-205-s13`" → "Routed as correction 2 of the verdict
   below, at this merge". And `T-205-s14`'s `blocked_by: [T-205-s6]`,
   as the executor's own notes instruct, now that the card exists.

**SUGGESTED, NOT BLOCKING.** `T-205-s15` (the second digest line has no
reader; a bulleted or bold citation vanishes) and `T-277` (root escape
and the hash oracle), both filed in this commit with the measurements.

**THE BATTERY** — the four suites through `gate-run.mjs`, the method
evals, and the gates prose can move — is appended in the next commit, at
the tip this verdict creates, with that ref on every figure.
