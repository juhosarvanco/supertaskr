---
id: T-225-s12
title: The triage view `--dispatch --full` is 40,672 bytes past one pipe buffer — the biggest arm there is, now announced on every run and filtered by nothing
feature: F-06
milestone: 4
size: M
priority: 2
status: done
suggested_by: executor claude-opus-5@subagent @T-225-s2
blocked_by: []
touches: [tools/e2e/scripts/dispatch-order.mjs, tools/e2e/tests/dispatch-order.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

**THE ARM T-225-s7 ASKED TO HAVE ANNOUNCED IS NOW ANNOUNCED, AND WHAT IT
ANNOUNCES IS THE WORST NUMBER ON THE BOARD.** T-225-s2 added
`--dispatch --full` to the margin guard's `LIVE_ARMS`. Measured back to
back at one held board, the base `09526da` in a detached drill and the
diff in the lane immediately after:

    --dispatch --full    105,910 -> 106,208 bytes

against a 65,536-byte pipe buffer: **40,672 PAST**, about 162% of one
buffer, and T-225-s2 moved it in the wrong direction by 298 bytes
because the margin block now discloses its own cost.

**T-225-s2 COULD NOT SHRINK IT AND SAYS SO.** That card's two passages —
`docs/CONVENTIONS.md`'s LANE PROTOCOL bullet and `method/lane-protocol.md`
rule four — are row 4 and row 10 of the `--task` arm and appear nowhere
in the dispatch arm. The `--dispatch --full` answer is a function of
`dispatch-order.mjs`'s own rendering: since T-225 the default arm carries
the dispatchable-now filter and `--full` spells out every set the filter
dropped, which is exactly what makes it the TRIAGE view
(`docs/STATE.md`, TRIAGE IS OWED AT THE STAMP) and exactly what makes it
the biggest invocation this command has.

**SO THE CEILING HAS MOVED ONE ARM ALONG AGAIN**, which is this family's
whole pattern: T-225 moved it off `--dispatch`, T-225-s2 moved it off
`--task <id> --state --full`, and the arm the project reads most
deliberately is the one still past the line.

**WHY IT WAS NOT BUILT IN THE LANE.** `tools/e2e/scripts/dispatch-order.mjs`
is outside T-225-s2's fence.

**WHAT A FIX WOULD DECIDE.** Whether `--full` spells out every dropped
set at full width or only the sets a triage sitting acts on; whether the
per-card body is truncated with its own disclosure the way the margin
block discloses the whole; or whether the arm is SPLIT so a reader asks
for one dropped set at a time. The third is the shape T-225-s2 took for
its two passages — an address rather than the bytes — and it is the one
that does not have to choose what to leave out.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 2, at the T-225-s2 merge (6691fc5)

The architect seat. The biggest arm there is, announced on every run and filtered by nothing.

## Acceptance criteria — DERIVED, 2026-09-02, executor claude-opus-5@subagent

The card was dispatched without this section (`brief.mjs --task` said so:
*"the card carries no acceptance criteria, so there is nothing to build
against"*). These are read off the card's own prose above and off
`dispatch-order.mjs`'s contract comments, and each one is a property that
was measured rather than an intention.

1. **`--dispatch --full` is materially smaller at ONE HELD BOARD**,
   measured base and tip back to back at the same ref, with the ref, the
   worktree count and the lane count named beside every figure.
2. **Nothing a triage sitting acts on leaves the answer.** Every ruled
   card keeps its row in `--full`; every ruling keeps the LANE it names
   and the EXACT SHARED PATHS it names — the two things the card's own
   prose says `--full` exists for.
3. **The term removed is the one that SCALES**, not a set that was
   dropped: `dispatchReport`'s own note names the cost as
   O(cards x lanes x paths), and the removal is the O(cards x lanes)
   half. The census's RULED half and the row-per-ruled-card contract are
   unchanged (`THE POSITIVE CONTROL` body, which exists to kill exactly
   the "smaller by emitting less" mutant).
4. **Each live lane's branch and worktree appear EXACTLY ONCE in the
   whole answer** — on the lane's own row under THE LIVE LANES, where the
   answer now says in as many words that they are. More than once means a
   ruling still re-spells one; zero means the fix bought its bytes by
   deleting what the reader came for.
5. **The removal cannot be WRONG.** The needle is built from the lane
   record rather than recognised as a shape, so a lane spelled any other
   way leaves the reason WHOLE — bigger than it needs to be and never
   wrong.
6. **`--dispatch --full` stays the biggest announced arm**, so
   `brief-flush.spec.ts`'s biggest-arm assertion stays green. This is a
   CEILING ON THE FIX rather than a property of it, and it is why
   criterion 1 reads "materially smaller" rather than "under one buffer"
   — see BUILT, below.

## BUILT, 2026-09-02 — executor claude-opus-5@subagent

**MEASURED AT `cde65b5`, EIGHTEEN WORKTREES AND FIVE LANES LIVE, BASE AND
TIP BACK TO BACK, THE BOARD UNMOVED BETWEEN THE TWO READS** (`git
worktree list --porcelain | grep -c`, taken before and after each pair):

    --dispatch --full   123,153 -> 99,943 bytes   (-23,210, -18.8%)
    --dispatch           49,202 -> 49,382 bytes   (+180, the disclosure below)
    every other announced arm      unchanged      (none renders this report)

**WHAT WAS REMOVED, AND WHAT EACH BYTE COST.** The parser spells a lane
into a reason as `T-202-s1 (refs/heads/task/T-202-s1-solo-lock-whole-path-key
at /Users/ujju/Projects/nputer-T-202-s1)`, and `--full` prints one reason
per held card — so every live lane's BRANCH and absolute WORKTREE PATH
were re-spelled once per card: **252 addresses, 23,388 bytes** across 120
rulings at this ref. Every one of them was a repeat of THE LIVE LANES
section a page above, which spells each lane's branch and worktree
exactly once. **The reader loses nothing it acts on**: the lane ID and the
shared PATHS — free that lane, argue with that overlap — are still in
every ruling, untouched, and the address is still in the same answer,
once, under a heading that names it. **The 180 bytes the default arm
GAINED are the price of saying so**: two note lines under THE LIVE LANES
telling a reader where the address went, because a disclosure a reader
has to infer is not one.

**WHAT WAS NOT BUILT, AND WHY THE RANKING DECIDED IT.** The card asks for
one pipe buffer, 65,536 bytes. That is **not reachable from this fence**,
and the obstruction is not arithmetic alone:

- **Arithmetic.** Everything outside the FENCED section is 51,326 bytes
  at this ref (STARTABLE alone is 39,345 over 62 cards), so the fenced
  rows would have to fit in about 14,200 bytes while the 55 title rows
  alone are 17,935. No lossless shape fits.
- **THE RANKING FLOOR, which binds first.** `brief-flush.spec.ts`'s
  margin guard requires the BIGGEST measured arm to carry `--full`. The
  second-biggest is `--task T-133 --preflight` at 74,443 bytes, which
  carries no `--full` and renders no dispatch report, so nothing in this
  fence can shrink it. **Any tip taking this view below 74,443 reds that
  guard by name**, in a file this fence does not hold. Verified on both
  sides: the guard was run at the base (green, `--dispatch --full`
  biggest at 123,153) and at the tip (green, biggest at 99,943, 25,500
  clear of the floor).

**ROUTED, NOT BUILT** — T-225-s17 (the arm SPLIT per dropped set, the
shape this card itself preferred; needs `brief.mjs`'s flag parsing, held
by T-239), T-225-s18 (the ranking floor; needs
`tools/e2e/tests/brief-flush.spec.ts`, which T-225-s13 already holds and
may absorb it), and the standing T-225-s11 (shrink the preflight arm),
which would lower the floor from the other side.

## VERDICT — APPROVED at `9af6afd`, 2026-09-02

Blind verifier, `claude-opus-5@subagent`, bench
`/Users/ujju/Projects/nputer-V-T-225-s12`, phase 1 detached at the BASE
`cde65b52800c`. **THE FRAME WAS TWO SPAWNS.** Phase 1 ran with the lane's
worktree, branch and diff untouched; three artefacts were sealed at
**2026-09-02T13:12:09Z**, before any byte of the work was read:

    attack set   809afa6eacf5d4b3f7c390f3103cb978187e5ba279ca9f1f44e074b3f59168c7
    ground truth 4103ea1fb806841c4c12d7ea822911c807921ef1b5ef0121805790032339252e
    stamps       stamps-V-T-225-s12.txt, both digests + the sealing time

Both re-verified byte-identical after the verdict was written. The
dispatching brief's phase-2 message carried executor-derived specifics
(figures, mutant names, body counts) — which is phase 2's business and
arrived only after the seal, so the phase-1 blindness is intact and is a
property of the spawn rather than of a marker I kept.

### The card had no acceptance criteria, and the sealed attack set said so first

Sealed §0: *"THE CARD HAS NO ACCEPTANCE CRITERIA AND NO EARS LIST … with
no criteria, an executor may declare victory against whichever of the
three shapes it happened to build."* The lane derived six criteria and
labelled them DERIVED. I judged against my own sealed properties P-A…P-N
and then checked the lane's six against them; they agree, and none of
them is looser than what was sealed.

### Two obstructions were sealed before the diff, and the lane hit both

**T2, THE ARITHMETIC** (sealed): everything outside the FENCED section is
51,069 B at `cde65b5`, the margin block returns ~1,031 B in its UNDER
arm, so the budget under 65,536 is **~15,498 B** while the 55 fenced
TITLE rows alone are **18,014 B** — over by 2,516 before one reason
sentence. *"On this board, at this ref, with these lanes, `--dispatch
--full` CANNOT come under one pipe buffer while keeping a title row per
fenced card."*

**T3/P1, THE RANKING FLOOR** (sealed, and pre-committed as a prediction):
`brief-flush.spec.ts`'s margin guard requires the biggest measured arm to
carry `--full`; the second-biggest is `--task T-133 --preflight`, which
carries none and renders no dispatch report, so nothing in this fence can
shrink it. *"PREDICTION P1: any tip that brings `--dispatch --full` below
74,099 bytes … REDS."* Sealed with the immunity argument too: the
preflight sweep costs ~190 B per checkout, so it would take ~78 checkouts
leaving the machine to move the floor.

The lane reached both independently and **routed rather than breached**
them (T-225-s17, T-225-s18). Sealed §5 named this landing in advance as
approvable: *"the arm does NOT come under the buffer, the saving is real,
measured, and disclosed, and the residual is filed as a card with the
arithmetic in it."*

### What I measured myself, at ONE HELD BOARD, back to back

Four rounds in one sitting on this bench, `git worktree list` captured
whole-line before and after and **HELD** across all of them: **17
worktree entries, 5 live lanes** (T-202-s1, T-205-s8, T-216-s8,
T-225-s12, T-239). The base figures reproduce phase 1's sealed ground
truth to the byte.

| arm | BASE `cde65b5` | TIP `9af6afd` | base board + TIP script | tip board + BASE script |
|---|---|---|---|---|
| `--dispatch --full` | **123,155** | **99,946** | **99,945** | 123,156 |
| `--dispatch` | 49,204 | 49,385 | 49,384 | 49,205 |
| `--task T-133 --state --full` | 59,187 | 59,271 | 59,187 | 59,271 |
| `--task T-133 --preflight` | 74,099 | 74,100 | 74,099 | 74,100 |
| `--state` | 12,565 | 12,648 | 12,565 | 12,648 |
| `--card T-133` | 5,156 | 5,244 | 5,156 | 5,244 |

**THE BOARD IS A THIRD PARTY AND IT IS SEPARATED HERE RATHER THAN
ASSUMED AWAY.** The tip adds two cards to `docs/tasks/` and 88 lines to
this one, so a naive base-vs-tip delta is partly the lane's own prose. The
two isolation rounds separate them: the SCRIPT alone takes
`--dispatch --full` from **123,155 to 99,945 — 23,210 bytes, 18.85%** —
and the BOARD growth is worth **+1 byte** (123,155 → 123,156). The
default arm pays **+180**, which is the two note lines.

**THE RECONCILIATION CLOSES TO THE BYTE**, re-derived rather than taken:
252 addresses across five lanes in the base's answer (49 + 49 + 51 + 49 +
54), each 85–100 B of ` (branch at worktree)`, **23,388 B** of term.

    123,155 − 23,388 + 180 (the two notes) − 2 (the margin block's own
    digits narrowing: 120,495 → 97,287 and OVER by 57,619 → 34,409)
    = 99,945 = the measured isolation round.

The lane's BUILT section left 2 bytes unreconciled and named them; they
are the margin block re-measuring itself, and the identity is exact once
that is counted. Its figures are uniformly 2 bytes below mine because it
measured in the lane checkout, whose path `…/nputer-T-225-s12` is two
characters shorter than this bench's and is printed once as
`repository: <path>` — a confirmation, not a discrepancy.

### The sealed properties, re-derived

- **P-A · THE RULING DOES NOT MOVE.** `ruled: 62 startable, 55 fenced, 0
  unfenceable, 0 waiting, 3 blocked` — identical across all four rounds
  and both verbosities. `drawn cards: 362`, `ready on blocked_by alone:
  117`, `startable once the lanes are counted: 62` all unmoved. The two
  routed cards are `status: suggested` and are not drawn.
- **P-B · THE TRIAGE READER'S FIELDS ARE STILL REACHABLE.** All 55
  `holds <paths>` clauses survive verbatim, and the lane ids survive in
  exactly the rulings that carried the address: 50 / 50 / 52 / 50 / 55
  rulings name T-202-s1 / T-205-s8 / T-216-s8 / T-225-s12 / T-239 at the
  tip, against 50 / 50 / 52 / 50 / 55 occurrences of each branch at the
  base. Nothing a triage sitting acts on left the answer.
- **P-C · WHAT MOVED IS DISCLOSED IN THE OUTPUT**, at both verbosities,
  in two note lines under THE LIVE LANES — 180 bytes the default arm pays
  to say where the address went.
- **P-D · THE THREE SETS THAT STAY IN FULL STILL DO.** No set lost its
  arm; UNFENCEABLE and WAITING are 0 on this board and are driven by the
  spec's injected fixture, not by the live read.
- **P-E · THE DENSITY KEEPS ITS KEEPER.** 130 title rows and 130 ruling
  rows at base and at tip, `125 card(s) spelled out` and `67` unchanged.
  No row was dropped to buy a byte — the defect the module's own census
  comment exists against.
- **P-F · THE ADJACENT SUITE.** The tip's ranking is 99,946 / 74,100 /
  59,271 / 52,654 / 49,385 / 41,426 / 12,648 / 5,244 — `--dispatch
  --full` is still the biggest arm and still carries `--full`, 25,846 B
  clear of the floor. P1 is respected as a CEILING rather than breached.
- **P-G · THE PROVENANCE FLOOR.** Zero unstamped lines on either arm at
  either ref.
- **P-H · IT STILL WRITES NOTHING.** `git status --porcelain` empty after
  all four rounds and all thirty-two invocations.
- **P-I · THE DEFAULT IS NOT MADE WORSE.** 49,385 B, 16,151 left under
  one buffer.
- **P-J · NO FIGURE IS TRANSCRIBED.** The two new bodies carry no numeric
  byte literal; every figure they print is derived in the run and
  disclosed.
- **P-L · THE FENCE WAS KEPT.** Five paths: the two in `touches:`, this
  card, and two `status: suggested` cards filed under
  `suggested_by: executor claude-opus-5@subagent @T-225-s12`. Nothing
  outside.
- **P-M · SECURITY.** `laneAddressOnce` is a `split`/`join` on a literal
  built from the lane record — no regular expression, so a worktree path
  carrying a metacharacter cannot become a wildcard and there is no
  catastrophic-backtracking surface. No new input path, no filesystem
  read, no shell-out, no dependency added to `tools/e2e/package.json`, no
  secret. The failure mode is the safe one: an unmatched spelling leaves
  the reason WHOLE.

### The drill: containment in BOTH directions, and a DATA mutant

Seven mutants, each applied to the tip on this bench, each landing READ
BACK from `git diff` rather than from the mutator's report, each restored
and the restore proved by sha256 `6d1abdba…`. Baseline: 19 passed.

The two new bodies are named here by their own capitals rather than by an
ordinal — `ADDRESS-ONCE` is *"A LANE'S ADDRESS IS SPELLED ONCE, and the
ruling still NAMES the lane and the shared path"* and
`SAVING-ON-THE-REAL-BOARD` is *"...AND THE SAVING IS MEASURED ON THE REAL
BOARD AT THIS REF, never on the fixture alone"*.

| mutant | where it lands | kill set |
|---|---|---|
| **D1** the call site becomes `(reason) => reason` — the base's rendering, helper still exported | `dispatchReport`'s routing | **{ADDRESS-ONCE, SAVING-ON-THE-REAL-BOARD}** |
| **D2** `.join(lane.taskId)` → `.join("")` — the id leaves with the address | the helper | {ADDRESS-ONCE, SAVING-ON-THE-REAL-BOARD} |
| **D3** the FENCED arm alone stops routing through `ruling()` | one call site of five | {ADDRESS-ONCE, SAVING-ON-THE-REAL-BOARD} |
| **D4** the LIVE LANES row stops spelling branch and worktree — the address DELETED rather than moved | the lane row | {WORKTREE-LIST-IS-LIVE, ADDRESS-ONCE, SAVING-ON-THE-REAL-BOARD} |
| **D5** a regex shape-recogniser replaces the record-built needle | the helper | **{ADDRESS-ONCE} alone** |
| **D6** `lanes.slice(0, 1)` — correct on the fixture's one lane, wrong on the live five | the helper's loop | **{SAVING-ON-THE-REAL-BOARD} alone** |
| **D7** the fenced rows dropped at `--full` — "smaller by emitting less" | the fenced emitter | {DISPATCHABLE-NOW-FILTER, POSITIVE-CONTROL, ADDRESS-ONCE} |

**NEITHER NEW BODY CONTAINS THE OTHER, AND ONE MUTANT EACH PROVES IT.**
D5 kills ADDRESS-ONCE alone: only its control — `laneAddressOnce(raw, [])`
must return its argument, and a foreign spelling must come back whole —
can tell a needle built from the lane record from a pattern that
recognises a shape. D6 kills SAVING-ON-THE-REAL-BOARD alone: a helper that routes only the
first lane is correct on the injected `ONE_LANE` fixture ADDRESS-ONCE uses
and wrong on the five live lanes SAVING-ON-THE-REAL-BOARD measures. Both are load-bearing;
neither is a restatement.

**D1 IS MY OWN STEP-2b DEMONSTRATION AND I RAN IT RATHER THAN ASSERTING
IT.** A control is only a control where the arming differs, so the two
new bodies were run against an implementation that LACKS the property —
the call site rendering exactly as the base does — and both RED while all
seventeen pre-existing bodies stay green. The greenness at the tip is
therefore worth something.

**D7 SAYS THE CARD'S OWN NAMED DEFECT IS STILL GUARDED.** Sealed attack
M4 was *"narrow the ruling rather than the printing"* — the emitter made
smaller by emitting less of the board. It kills THE DISPATCHABLE-NOW
FILTER and THE POSITIVE CONTROL, both pre-existing and both untouched by
this lane.

**AND THE PROPERTY LIVES IN DATA, SO ONE MUTANT IS A DATA MUTANT**
(verifier.md 2b, `T-221`). *"Each lane's address appears exactly once"* is
a function of the LANE LIST, not of the code, so I drove
`dispatchContext`'s `porcelain` seam without touching one byte of the
tree:

    ARM A  the live list, 5 lanes:   saved 23,388 B, each address on
                                     exactly 1 line — the MEASURED arm
    ARM B  the same board, 0 lanes:  saved 0, the per-lane loop is EMPTY,
                                     SAVING-ON-THE-REAL-BOARD takes its VACUITY arm and
                                     DISCLOSES rather than passing quietly
    ARM C  5 lanes, removal a no-op: saved 0 → the vacuity arm, whose own
                                     assertion then REDS

**ARM C is the one that matters**: the honest-arm disclosure is not an
escape hatch a broken removal can hide in. A code-only drill would have
mis-graded this by construction.

### Gates, at the ref they were run at

    gate-verdict suite=parser exit=0 bodies=372  ref=9af6afd  GREEN
    gate-verdict suite=e2e    exit=0 bodies=626  ref=9af6afd  GREEN
    gate-verdict suite=app    exit=1 bodies=1146 ref=9af6afd  RED (attributed below)
    docs-gate on the five changed paths: FIRES, owing exactly those three suites
    tests/dispatch-order.spec.ts alone: 19 passed (17 before this card)

**THE APP RED IS ATTRIBUTED AT THE BASE, BY NAME, NOT BY COUNT.** I ran
the app suite at `cde65b5` on this same bench and got the identical
reading — `1146 bodies, 4 failed, 1142 passed`, the same two files and
the same four bodies:

    architecture-dogfood > all 185 files map and the bucket is EMPTY again
    architecture-dogfood > the full relation table: 33 confirmed, 2 undeclared, 10 planned
    architecture-dogfood > the T-009 package.path seam is consumed
    map-dogfood-render   > the header hint reads the committed graph's scale

They predate this lane, which touches no path under `app/`,
`docs/architecture/` or the graph. Not this card's.

### Findings that are NOT failures

1. **THE CENSUS IS STALE AND IT IS THE INTEGRATOR'S** (CONVENTIONS, the
   capabilities bullet): two new test names take `docs/CAPABILITIES.md`
   from 52,797 to 52,979 bytes. Verified here: `npm run
   capabilities:check` exits 1 naming the regeneration command. The
   fence leaves that file read-only, so it is owed in the MERGE commit.
2. **THE BUILT SECTION'S TWO UNRECONCILED BYTES ARE THE MARGIN BLOCK
   RE-MEASURING ITSELF** — `120,495 → 97,287` and `OVER by 57,619 →
   34,409` each narrow by one digit. Counting them closes the identity
   exactly; the lane named the residual rather than hiding it.
3. **MY OWN SEALED EXTRAPOLATION WAS 3–4% HIGH, AND I SAY SO.** The
   attack set predicted that with zero lanes both arms would render
   *"~86,300 B — still ~20,800 B over one pipe buffer"*. Measured through
   the data mutant: 80,370 B rendered, ≈83,000 with the margin block —
   still ~17,500 over. The conclusion (the breach is the ready set, not
   the lanes) stands; the number was an extrapolation from per-card
   averages and is corrected here rather than left standing.
4. **`built_by:` IS STILL EMPTY** at this tip. Rule 3 makes an empty side
   unconstrained, so nothing reds, and it is the builder's field rather
   than mine to fill.

### Every figure here carries its ref, deliberately

This verdict is itself a commit that adds prose to a card on the board,
and `--dispatch --full` is a function of that board — so the byte figures
above are true AT `cde65b5` and `9af6afd` and are already stale at the
tip this commit creates. That is the figure case, and the remedy taken is
the one CONVENTIONS names: every number is bound to the ref it was read
at.

**APPROVED.** The card's headline target — one pipe buffer — is NOT
reached, and the sealed attack set named that landing as approvable in
advance, before the diff existed, on exactly the conditions this lane
met: the saving is real (23,210 bytes, 18.85%, isolated from the board's
own growth), it is measured at one held board with the worktree and lane
counts named, nothing a triage reader acts on left the answer, the
residual is routed with the arithmetic in it, and the obstruction that
binds first — the ranking floor under `brief-flush.spec.ts` — is
respected rather than breached.
