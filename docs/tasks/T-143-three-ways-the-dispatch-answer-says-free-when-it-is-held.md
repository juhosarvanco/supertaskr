---
id: T-143
title: ONE mechanism corrupts the dispatch answer toward FREE and it lives in two implementations — the other two claims in this card did not survive being measured
feature: F-06
milestone: 4
priority: 3
size: M
status: verifying
suggested_by: architect claude-opus-5
blocked_by: []
touches: [lib-parser, tools/e2e]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-137-s10 (Amnesty triage 2026-08-29 (triage seat)) — the same report, and it survives its own refusal: the architect's framing (this is R1's dual) is REFUSED with four of the repository's own sentences, because R1 concerns a lane PROVED live on disk while this would manufacture a hold out of a status: field. What survives is a real reporting gap — readDispatchOrder computes underway and dispatchReport never emits it, so a card at status: building with a declared fence appears ZERO times in the whole report, and a session picking among three cards that overlap its ground by containment is not told. The architect reports nearly dispatching against it.

Absorbs: T-137-s12 (Amnesty triage 2026-08-29 (triage seat)) — the same file, the same reason sentence, and the same class of reader: a human choosing whether to override a COARSE-fence warning. Its measurement is the reason it cannot be left to a rewrite — the mutation from "no card for it" to "no card for them" kills ZERO bodies, while the nearest existing arm pins the clause's PRESENCE and neither of its numbers, so the fix owes a second body with two blind lanes or the plural half ships as unpinned as it is today.

Absorbs: T-137-s11 (Amnesty triage 2026-08-29 (triage seat)) — mechanism 1 alive in the second implementation, found only because a seat was checking somebody else's claim. It carries the measurement that makes the row actionable — supplying the missing card off main moves 15 cards from startable to fenced through the same fence module — and the distinction worth keeping: this is not R1's silent false green but a verdict word its own report contradicts four lines above, which is the DOCS GATE bullet's "three layers from its cause" at a distance of four lines.

**PROMOTED at the amnesty triage, 2026-08-29, as the owner of the
answers-toward-FREE class — and its census has MOVED since it was
written, in both directions.** Re-derived at this base:

- **MECHANISM 1 IS CLOSED IN `lanes.ts` AND ALIVE IN THE SECOND
  IMPLEMENTATION.** T-137's merge fixed `lib/parser/src/lanes.ts:293`;
  `T-137-s11` (absorbed) then found the same sentence about the same
  join in `dispatch-brief.mjs`'s `fenceLedger`, where a lane whose card
  this checkout cannot read contributes no holder and every slug it
  reserves reports `FREE` — four lines below the report's own
  "no live card — board says unknown" warning. Supplying the missing
  card off main moved **15 cards from `startable` to `fenced`** through
  the same fence module, so those FREE rows are about ground a live lane
  demonstrably reserves.
- **MECHANISM 2 is REFUSED by this card's own correction** and stays
  refused.
- **MECHANISM 3 stands as a DISPLAY trap**, not a wrong answer: the
  `--task` half answers correctly with the witness paths named, and
  `docs/STATE.md` now warns every session never to read the ledger's
  FREE column as a verdict. It nearly took a lane once.

Absorbs: T-137-s11, T-137-s12.

## Acceptance criteria

- WHEN any lane's card cannot be resolved in this checkout THE fence
  ledger SHALL NOT print `FREE` for a row that is not explicitly held.
  The vocabulary is already correct and already shipped in
  `lib/parser/src/lanes.ts` — `unusable`, "no overlap PROVED and none
  ruled out" — and the row SHALL read `UNKNOWN` naming the ids whose
  fences could not be read. It SHALL NOT be folded into `FREE` and the
  row SHALL NOT be dropped.
- `FREE` SHALL be treated as the same class of word as `disjoint`: a
  claim about the whole world, unreachable when part of the world could
  not be read.
- THE per-slug ledger SHALL say what it is answering, since two slugs
  can share a component (C-11 declares `[app-shell, app-board]`) and a
  reader who takes the FREE column for a verdict is misled by a display
  rather than by a wrong answer. Either the display carries the
  qualifier or it points at the `--task` half that answers properly.
- THE `fenced` reason's residual clause SHALL agree in NUMBER with the
  list it names (`T-137-s12`): the sibling `unfenceable` branch already
  carries a `many` flag with two dedicated poison arms pinning both
  directions, and the `fenced` branch was written in the same commit
  without it. A mutation from "no card for it" to "no card for them"
  kills ZERO bodies today, so the fix owes a SECOND body with two blind
  lanes — without it the plural half stays exactly as unpinned.
- WHERE this card's own three mechanisms are quoted THEY SHALL be
  re-derived first. This card has already been wrong about two of its
  three claims and says so in its own body.

**Found in one sitting, deriving one night's dispatch.** Three separate
mechanisms, three different files, one shared property:

> **Every one of them reports FREE when the fence is HELD. Not one can
> fail the other way.**

A check that can only err toward "go" is not a check.

## The three

**1. A lane whose card this checkout cannot resolve holds nothing.**
`lib/parser/src/lanes.ts:293` — `if (other === undefined) continue`. A
card compared only against such lanes is reported "disjoint from every
live lane" and called `startable`. Found by T-137's verifier, which
measured **15 of 20 startable answers false** with one lane up. The
module states the correct principle fifteen lines above, about an absent
registry — *"every slug token is unresolvable **rather than that every
fence is free**"* — applies it to tokens, and violates it for lanes.
`lanesWithNoCard` IS computed and reaches exactly one place: a field on
the returned summary. **Reported, never acted on.**

**2. REFUSED — see the correction below. Its dual — a card in
`building` with no worktree.** The fence
ledger is derived from lanes, and a lane is a worktree on a task branch.
`T-135` is `building`, declares `touches: [crate-index,
method/tasks/TASK-FORMAT.md]`, and has no worktree because its Half A
merged and the card was deliberately left open. `brief.mjs --state`
prints **`crate-index: FREE`**, and `method/tasks/TASK-FORMAT.md` does
not appear in the ledger at all.

**3. The `--state` LEDGER's FREE column is per-SLUG, and two slugs can
share a component.** `docs/architecture/components/C-11-*.md` declares
`touch_slugs: [app-shell, app-board]`. With `app-shell` held, the ledger
prints `app-board: FREE`. They intersect at C-11.

**MECHANISM 3 IS NARROWER THAN THE OTHER TWO AND THIS CARD ORIGINALLY
OVERSTATED IT — corrected here rather than quietly.** The `--task` half
of the same tool is CORRECT. Asked properly it answers:

    T-141 and T-112: OVERLAP — T-141 app-shell against T-112 app-board,
      both reserve app/src/assets/**
    T-141 and T-112: OVERLAP — ... both reserve app/src/styles/**

with the witness paths named. **So the dispatch VERDICT is sound; it is
the ledger DISPLAY that misleads**, and only a reader who takes a FREE
column for a verdict is misled. That is a real trap — the architect fell
into it on 2026-08-26 — but it is consumer confusion between two
questions, not a wrong answer. Mechanisms 1 and 2 corrupt the answer
itself; 3 does not.

## What this cost, tonight, live

Mechanism 3 nearly took a lane. `T-112` was the highest-priority card
that survived every other filter — `blocked_by: [T-111]` with T-111
`done`, and `touches: [app-dispatch, app-board]` reading FREE, FREE. It
overlaps the live `T-141`. It was the only candidate on the board.

**But the process would have caught it**, and the honest version of this
item is the interesting one: the documented step before dispatch is to
assemble the brief with `--task`, and that step reports the overlap
correctly. **The architect skipped it because the ledger had already
answered** — which is the actual lesson. A cheap display that
approximates an expensive verdict gets consulted INSTEAD of it.

Mechanism 2 was caught by hand seconds earlier: the three cards that
night's stamp freed — T-105, T-128, T-131 — all touch `method/`, which
**contains** `method/tasks/TASK-FORMAT.md` by containment.

**Containment-is-overlap has now been the proximate cause five separate
times in this project.** This is the first time all three mechanisms
were seen together.

## Why the direction matters more than the count

A fence is a WRITE partition and its whole job is to make concurrent
lanes safe. **A false HELD costs a delay. A false FREE costs a
collision, and the collision is silent** — two lanes write the same
region, both suites stay green, and the loss appears at a merge that
looks ordinary. That asymmetry is why three mechanisms all failing
toward "go" is one finding rather than three.

## The shape of a fix, not the fix

1. **State the property once and pin it**: a hold may not vanish because
   one side of a join is absent. Mechanisms 1 and 2 are the two sides of
   exactly that; 3 is the same shape with the join being slug→component.
2. **Make the ledger emit verdicts, not availability.** A FREE column
   keyed by slug cannot express "free as a name, held as a region". The
   consumer asks *may I dispatch this card* and should be answered in
   those terms, with the witness component named.
3. **Distinguish the two questions rather than merging them** — "what is
   physically being written now" (worktrees) and "what is claimed"
   (board status) are both legitimate and they are not the same answer.
   Mechanism 2 may be an *undisclosed split* rather than a bug, and that
   is a smaller, different fix. **Settle which before writing code.**

## One caution for whoever takes it

**Do not verify this with a census.** `T-142` is the card about queries
that answer a different question than the one asked, and every mechanism
here is one. Prove each fix with a POSITIVE CONTROL: construct the held
state, see the tool say HELD, then remove the hold and see it say FREE.
**A fix that only ever prints HELD passes every test written from this
card's text.**

---

# CORRECTION, 2026-08-26 — TWO OF THIS CARD'S THREE CLAIMS FAILED

**Written by the architect who filed it, after both were measured by
other hands. Recorded rather than quietly edited, because a card that
overstates and then tidies itself is worse than one that overstates.**

## Mechanism 2 is REFUSED

T-137's rework was asked to judge it and did, on four of this
repository's own sentences: criterion 2's "every live **lane**" read with
criterion 3's live stamp; `executor.md` row 5, whose two examples are
both the board **under**-reporting; `lane-protocol.md` rule 7 as this
repo applies it — T-111's branch was kept and that checkpoint still says
"there are zero lanes"; and `docs/STATE.md`'s own capitals, **"ONE CARD
IS `status: building` WITH NO LANE, AND THAT IS ALSO ON PURPOSE."**
`T-135-s4` already records that the stamp has no true value.

**The distinction that settles it: R1 drops a PROVED live writer. The
dual would INVENT one.** A hold conjured from a board stamp is not the
same object as a hold erased despite a worktree, and only the second is
a false green. **The board under-reports by construction and the lane
list is authoritative — that is the design, not a defect.**

One further correction to what this card originally implied:
`method/tasks/TASK-FORMAT.md` is absent from the ledger **because T-135
is not a lane**, not because the ledger cannot spell a path token. It
can.

## Mechanism 3 was already narrowed above

The `--task` verdict is sound; only the `--state` display misleads.

## What survives, and it is not small

**Mechanism 1 is real, was measured, and lives in TWO implementations.**
T-137's rework fixed `lanes.ts` and found the identical
`if (card === undefined) continue` in `dispatch-brief.mjs`'s
`fenceLedger`, filed as `T-137-s11` and deliberately left in place as
another card's ground. **One defect, two copies — which is the
`T-057` second-implementation shape, and it is a better finding than the
three-mechanism story this card was filed on.**

## The lesson this card is now also an instance of

Filed with three claims on one night's evidence; **one survived.** The
two that failed were the two the author reasoned to rather than
measured — and mechanism 2 was reasoned to *by the architect and then
handed to an executor as a suggestion*, which is how an unmeasured claim
acquires the authority of a dispatch. `T-142` is the general shape and
this is a second instance of it.

Integrator at the T-153-s5 dispatch (2026-08-29): TWO MORE MEASURED
INSTANCES, both the suffixed-id truncation. (4) `brief.mjs --task
T-153-s5` resolved card T-153 and `--write-fence` stamped T-153's
app-shell fence into the s5 lane — caught by reading the manifest back
before dispatch. (5) Retroactive: the T-153-s2 lane ran its WHOLE arc
under its parent's manifest for the same reason — the armed hook was
enforcing a fence nobody dispatched (no damage: the work was
independently verified and its paths happened to lie inside the wrong
fence's expansion). Root cause: `normaliseTaskId`'s path fallback and
`laneSpellings`' branch matcher both preferred the unsuffixed reading
of `task/T-NNN-<slug>`. Fixed at the seat in dispatch-brief.mjs with a
pinning body in lane-fence.spec.ts (the suffixed-id round-trip); this
card keeps the CLASS — the `--state` join and ledger display still
carry it, and the pinned pair is the floor, not the sweep.

---

# Implementation notes — executor claude-opus-5@subagent, lane `task/T-143-free-when-held`

Base `0276fb54ef3272c2de5c2fc0b8d061071e531a78`; dispatch commit
`c74890a89e967e9baca2dfac4ce3c1bdd0e9db0b`; work commit
`69bf790ccfb72f909a30b5d60ae702bcd1df1ab2`. Every figure below carries
the ref it was measured at; every live fact carries the clock and host.

## What the class turned out to be, measured rather than quoted

**Criterion 5 first: this card's own three mechanisms, re-derived at
`c74890a89e96` before anything was built.**

- **MECHANISM 1 — ALIVE, and in THREE implementations, not two.** The
  card names `lanes.ts` (fixed at `62a4364`) and `fenceLedger` (left as
  this card's ground). **The class sweep found a THIRD**:
  `tools/e2e/scripts/card-figures.mjs`'s `contention` deriver, which
  answers *"which live lane holds each entry of this card's fence right
  now"*, carried the identical `if (other === undefined) continue` with
  the identical `FREE` four lines below — and `card-figures.spec.ts`
  named `contention` in NO body, in either direction. It was found by
  running the sweep this project's own bullet requires, not by a report.
- **MECHANISM 2 — REFUSED, and it stays refused.** Nothing here
  manufactures a hold from a `status:` field. The one place it would
  have been quietly undone is the new IN FLIGHT section, and that
  section says so in its own comment and in its own printed note.
- **MECHANISM 3 — a DISPLAY trap, confirmed and closed as a display.**
  The `--task` half still answers correctly; the `--state` ledger now
  says what it is answering and points at the half that answers.

**And the dispatch brief's item (a) is REFUTED at this ref.** The brief
asked me to derive whether the `--state` LANE-LIST JOIN still reads
`task/T-153-s2-…` to the parent card. It does not. Reproduced with a
synthetic porcelain at `c74890a89e96`:

    laneWorktrees("… branch refs/heads/task/T-153-s2-clock-restore-guard …")
      -> taskId "T-153-s2"

and the ledger printed `app-agent: T-153-s2` — the CHILD's fence, not
T-153's `app-shell`. The T-153-s5 fix to `laneSpellings.branchRe`
reached this join because the join spends the same matcher.

**What was still open there, and is now closed:** `laneWorktrees` holds
its OWN copy of the id extraction (`T-${m[1]}`), a SECOND
implementation of `lane-fence.mjs`'s `laneIdOf`, and the pin in
`lane-fence.spec.ts` drives `laneIdOf` and `normaliseTaskId` — never
`laneWorktrees`. Drill **D6** confirms it: truncating the id in
`laneWorktrees` killed nothing before this lane and kills one body now.

## What was built

| # | Producer | What it stopped saying |
|---|---|---|
| 1 | `dispatch-brief.mjs` `fenceLedger` | `FREE` for every slug a lane it could not read reserves. Now `UNKNOWN`, naming the ids; a HELD row carries the residual too, as `readDispatchOrder`'s `fenced` reason already did. |
| 2 | `card-figures.mjs` `contention` | the same sentence, in the third implementation, found by the sweep. |
| 3 | `dispatch-brief.mjs` `deriveFence` (ROW 5) | `DISJOINT` over lanes it never compared, and *"fewer than two fences to compare"* when there were three lanes and two were unreadable. |
| 4 | `dispatch-brief.mjs` `stateReport` | a bare FREE column with no statement of what it answers. It now names the question it is NOT answering and points at `--task`, and the slugs that are not independent are DERIVED from `touch_slugs` rather than naming `C-11` in prose. |
| 5 | `lanes.ts` `rule()` | *"no card for it"* about a list of two. |
| 6 | `dispatch-order.mjs` `dispatchReport` | nothing at all about a card in flight (T-137-s10, absorbed). |

**Criterion 4, in full.** The `fenced` residual now carries a `blindMany`
flag mirroring the `unfenceable` branch written in the same commit WITH
one. Both directions are pinned, one body each — the singular half added
to the existing `a PROVED overlap still outranks it` body, the plural
half a new body with two blind lanes. Drills **D1** and **D2** are the
two sides: before this lane the mutation killed zero bodies; each side
now kills exactly one.

**Criterion 3 is derived, not written.** `slugsSharingComponents` joins
the registry's own `touch_slugs` fields, so a component declared
tomorrow is in the answer with nothing edited. At `c74890a89e96` it
finds exactly one: *app-board and app-shell both expand through C-11*
— the card's own example, arrived at from the data.

**The absorbed T-137-s10, and the line I did not cross.** `underway` is
the scheduler's word for *"status is not planned"*, so it holds every
`done` and `parked` card — **127 and 124 at `c74890a89e96`**, which is a
dump and not a report. The section is filtered through the parser's own
exported `IN_FLIGHT` set, so a fourth status added there arrives here
with nothing edited, and every row says which of the two it is. At
`c74890a89e96` it prints two cards: T-143 (has a lane, fence held for
real) and **T-135 (no lane, holds no fence — the board stamp is all
there is)**. That is mechanism 2's own example, reported without being
promoted to a hold.

## The sweep — the class, the search, and the result

**Class**: a join that drops a lane, card or token it cannot read, and
lets the surviving answer read `FREE` or `disjoint` — a claim about the
whole world made without reading all of it.

**Search**, at `c74890a89e96`, over `tools/e2e/scripts`,
`lib/parser/src`, `app/src` and `.claude/hooks`:

    command grep -rn "=== undefined) continue" <those roots>
    command grep -rn '"FREE"\|FREE`\|disjoint'   <those roots>

**Result — four sites in the class, three of them defects:**

- `lib/parser/src/lanes.ts` — already fixed at `62a4364`. Verified still
  fixed here.
- `tools/e2e/scripts/dispatch-brief.mjs` `fenceLedger` — **DEFECT, fixed
  here.**
- `tools/e2e/scripts/card-figures.mjs` `contention` — **DEFECT, fixed
  here, and the reason the sweep was worth running.**
- `tools/e2e/scripts/dispatch-brief.mjs` `deriveFence` — **DEFECT in the
  `disjoint` spelling, fixed here.**

**Clean, checked and recorded so the zero is not confused with an unrun
search:**

- `tools/e2e/scripts/card-preflight.mjs` — defers the ruling to the
  parser's `readDispatchOrder` and reports `no live card` explicitly on
  its `heldClaims` join. No FREE-when-held.
- `app/src/lib/board-model.ts` — already carries `fenceKnown` and
  `blindLanes` (T-111's work), and refuses rather than guessing when the
  registry is absent. Nothing in `app/` calls `readDispatchOrder` at
  all, so the terminal is the only consumer of the parser's lane term.

## The poison drill — 8 mutants, one side each, every restoration hashed

Work COMMITTED first at `69bf790`, then mutated, per the DRILL AT A
COMMIT clause. Every mutant moves the PRODUCER and never an assertion.
Restorations are `git restore --source=HEAD --staged --worktree --` and
proved by sha256 against `git show HEAD:<path>`.

| # | Producer mutated | Mutation | Suite | Result |
|---|---|---|---|---|
| D1 | `lanes.ts` | `blindMany` ternary → unconditional `'no card for it'` | parser | **exit 1 · 1 failed / 314 passed** |
| D2 | `lanes.ts` | ternary → unconditional `'no cards for them'` | parser | **exit 1 · 1 failed / 314 passed** |
| D3 | `dispatch-brief.mjs` | `fenceLedger` drops the unreadable lane again | e2e brief | **exit 1 · 2 failed / 28 passed** |
| D4 | `dispatch-brief.mjs` | `slugsSharingComponents` filter `> 1` → `> 2` | e2e brief | **exit 1 · 1 failed / 29 passed** |
| D5 | `dispatch-brief.mjs` | ROW 5's residual block gated to `if (false)` | e2e brief | **exit 1 · 1 failed / 29 passed** |
| D6 | `dispatch-brief.mjs` | `laneWorktrees` truncates the suffixed id | e2e brief | **exit 1 · 1 failed / 29 passed** |
| D7 | `card-figures.mjs` | `contention` drops the unreadable lane again | e2e card-figures | **exit 1 · 1 failed / 27 passed** |
| D8 | `dispatch-order.mjs` | IN FLIGHT widens back to the whole `underway` set | e2e dispatch-order | **exit 1 · 2 failed / 11 passed** |

**8 mutants, 8 kills, 10 distinct bodies red across them.** Every
restoration MATCHED by sha256, and `git status --porcelain` was empty
after the run. D3's first attempt was **SKIPPED rather than counted**:
its anchor text occurred twice in the file, the script refused to
substitute, and it was re-run against a unique anchor — recorded because
a mutant that did not apply and a mutant that did not kill are the same
line in a table that only prints a count.

D8 killed one body BEYOND its target (`--dispatch runs on the live
repository, exits 0, and WRITES NOTHING`), which is honest collateral:
widening the section to 251 rows moves the whole report.

## The positive controls, which the card asks for by name

*"Do not verify this with a census … prove each fix with a POSITIVE
CONTROL: construct the held state, see the tool say HELD, then remove
the hold and see it say FREE."* Every new body does both sides, on
fixtures that differ in exactly one lane:

- the ledger with one blind lane says `UNKNOWN` on every row and names
  it; **the same board with that lane removed says `FREE`** and every
  `unknownFrom` is empty.
- `contention` with no lane live says `FREE` for every fence entry;
  with one blind lane it says `UNKNOWN` for every one.
- ROW 5 with no blind lane prints the plain *"fewer than two fences to
  compare"* and no residual.
- the suffixed-branch body proves the join is a PREFERENCE, not a
  suffix-appender: `task/T-153-inotify-sentinels` still reads `T-153`.
- the shared-component body asserts the independent walk is NON-EMPTY
  before comparing, so two empty lists cannot agree.

## Suites and gates, with counts and unpiped exits

In the lane, `NPUTER_E2E_PORT=14143` — `lsof -nP -iTCP:14143 -sTCP:LISTEN`
returned zero rows immediately before binding, read on Mac.lan. Port
1420 was read once with the one permitted command and never touched.

| Command | cwd | Result |
|---|---|---|
| `npx vitest run` | lib/parser/ | **exit 0 - 315 passed / 15 files** (314 at base) |
| `npx tsc --noEmit` | lib/parser/ | **exit 0** |
| `npm run build` | lib/parser/ | **exit 0** |
| `npm run build` | app/ | **exit 0** |
| `npm test` | app/ | **exit 0 - 1015 passed / 47 files** |
| `npx tsc --noEmit` | tools/e2e/ | **exit 0** |
| `npm test` | tools/e2e/ | **exit 1 - 2 failed / 318 passed** |

**THE TWO REDS ARE PRE-EXISTING AND ARE NOT THIS DIFF'S.** Measured at
the dispatch commit `c74890a89e96` with NO edit of mine in the tree:
**2 failed / 311 passed, exit 1**, the same two bodies with the same
message. They are `T-143-s1`, and the arithmetic closes: 313 bodies at
base, seven added here, 320 total, 318 green.

**GATES, derived from the merge-tree forecast the RANGE RULE prescribes**
- `TREE=$(git merge-tree --write-tree main HEAD)` (exit 0), then
`git diff --name-only main "$TREE"`: **10 paths** at tip
`445e02e3a159904118a8eb04e6241d2944fe095e`, two under `docs/tasks/` and
eight under `lib/parser/` and `tools/e2e/`.

- **GRAPH REGEN - FIRES** (the diff carries `*.ts` outside `docs/`).
  ASKED rather than predicted:
  `cargo run -p nputer-index -- index --check --root ../..` from
  app/src-tauri/ exits **1 STALE**, and the movement is content-only -
  **+0 -0 ~2 files, 0 symbols and 0 edges moved**, `lanes.ts` loc
  527 -> 538 and `lanes.test.ts` loc 415 -> 456. **The regen is NOT
  taken here**: `docs/architecture/graph.json` is outside this card's
  fence, and the bullet commits it WITH THE CHECKPOINT. **Owed to the
  integrator.** Noted in passing, not raised as a finding: the budget
  reads **1022964 of 1040000 bytes (98.4%), 17036 left** - which is
  @human's standing `T-151` item, not this lane's.
- **BOOT GATE - NOT OWED.** No path in the forecast is under
  `app/src-tauri/**` or `app/src/**`, and neither manifest moved.
  Derived on all 10 paths.
- **DOCS GATE - FIRES**, exit **1**, on the two `docs/tasks/` paths.
  It named three suites and **all three were run**: `npm test` from
  app/, `npm test` from tools/e2e/, `npx vitest run` from lib/parser/.
  The gate also reported *"every live task card's frontmatter parses,
  with a legal status"* and **0 frontmatter issues** in the live tree.
- **METHOD EVAL GATE - NOT OWED.** No path in the forecast is under
  `method/**`. Derived on all 10 paths.

**AND ONE REGENERATION THIS LANE MAY NOT TAKE.** Seven spec bodies were
added under `tools/e2e/tests/`, so the behaviour census moved:
`npm run capabilities:check` from tools/e2e/ exits **1 STALE - committed
24849 bytes, a fresh generation is 25444 bytes**. `docs/CAPABILITIES.md`
is outside this card's fence, so the `npm run capabilities` regen is
**owed to the integrator**, with that byte pair as the expected delta.
The two standalone lints are clean at this tip: `npm run lint:docs`
exit **0**, `npm run lint:tokens` exit **0**.

**These decisions were derived at `445e02e3`, one commit BEHIND the tip
that carries this table.** The last commit adds only prose to these two
`docs/tasks/` files: it cannot move GRAPH REGEN - the graph walk does
not index `docs/`, which the check above demonstrates by naming only
the two `lib/parser` files after a commit that had already edited a
card - it cannot move BOOT GATE or the METHOD EVAL GATE, and it leaves
the DOCS GATE firing on the same two paths. Every suite figure above
was re-measured at the tip.

## What the class STILL hides after this card — the honest omission

1. **`fenceLedger` and `contention` both compare fence entries as
   STRINGS.** They join a lane's `touches:` token to a slug NAME; they
   do not expand through `fence.ts`. So a lane declaring the PATH
   `app/src/components/board/` still leaves `app-board` reading `FREE`,
   and the two overlap by containment. The new qualifier tells the
   reader that in as many words and points at `--task`, which does
   expand — **but the ledger is still a name join, and making it a
   region join is a different card.** This is the same shape as
   mechanism 3 and it survives at a second remove.
2. **`FREE` is still not the same word as a verdict.** The card's own
   fix sketch item 2 asks the ledger to *"emit verdicts, not
   availability"*. This lane made the display honest about which
   question it answers; it did not change the question.
3. **`lanesWithNoCard` is still terminal-only.** Nothing in `app/` calls
   `readDispatchOrder`, so the pane's own frontier
   (`board-model.ts`'s `fenceKnown` / `blindLanes`) is a SECOND
   implementation of the same idea, currently correct. Two correct
   copies of one rule is the `T-057` shape one merge away from
   diverging.
4. **The `--state` ledger prints one line per slug and the blind-lane
   clause is repeated on every one of them.** At `c74890a89e96` that is
   nine identical tails. It is loud on purpose — a reader who skims one
   row must not miss it — but a reviewer may reasonably prefer one
   banner. Left as it is rather than guessed at.

## Routed, not built

- **`T-143-s1`** — two `session-economics.spec.ts` bodies red for every
  lane that holds `tools/e2e`. **This is a PRE-EXISTING red, measured at
  the base commit before any edit of mine**, and it is inside this
  card's fence but outside its class. Filed rather than fixed: greening
  another card's assertion to make one's own lane look clean is exactly
  the move a verifier should distrust.
