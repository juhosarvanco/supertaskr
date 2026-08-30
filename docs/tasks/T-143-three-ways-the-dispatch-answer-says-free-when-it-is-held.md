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

---

## Verdicts

### 2026-08-30 — verifier claude-opus-5@subagent — **APPROVED WITH ASSIGNED CORRECTIONS**

Independent hand, lane `task/T-143-free-when-held`, pair
`c74890a89e96..14075ac2ddd6`. Every figure below was measured by this
seat at the ref it names; nothing is relayed from the executor's report.

**PROVENANCE OF THE BLINDNESS, DISCLOSED RATHER THAN CLAIMED**
(`method/roles/verifier.md` step 0). The dispatch brief's DUTIES section
named executor-derived specifics ABOVE its own marker — the expected
suite counts, the two session-economics reds with their cause, "the
executor's eight" drills, the five-instance containment history — so
phase 1 was broken above the line by the brief, and the executor's
report travelled in the same message. What this seat could still keep,
and did: the attack set was written from the card at its BASE REF
`c74890a89e96` and committed to a file before the diff was opened, and
the card's Implementation notes were not read until every measurement
below had been taken. The attack set is reproduced verbatim in section
ONE so the blindness is auditable rather than asserted.

## ONE — the phase-1 attack set, as written, before the diff

A. **Criterion 1.** A1 plant a lane whose card cannot be resolved,
require no row prints FREE. A2 require the row is neither dropped nor
folded into FREE. A3 the card's own caution as a POSITIVE CONTROL — held
-> HELD, hold removed -> FREE; a fix that can only print UNKNOWN is a
reject. A4 the row NAMES the ids, plural and singular. A5 a zero-lane
world still answers FREE.
B. **Criterion 2.** A6 a DISJOINT verdict over an unreadable lane is the
same lie; require it withheld. A7 any cardinality sentence must count
what it could not read.
C. **Criterion 3.** A8 is the qualifier on the REAL path, and can it
vanish under a branch. A9 NAME vs REGION — a lane declaring a bare PATH
containing a slug's region; the design question.
D. **Criterion 4.** A10 mutate the residual's number word, require a
red. A11 the owed second body must kill a mutant no other body kills
(failing-body count exactly ONE). A12 the 1-versus-2 boundary, both
directions.
E. **Criterion 5.** A13 re-derive mechanism 1 in EVERY implementation and
look for a third. A14 re-derive the suffixed-branch claim; a pin for an
already-fixed defect risks shape SEVEN.
F. **Mine, from the class.** A15 IN_FLIGHT — a done card must not print
underway, a building card with a fence must. A16 poison one side only,
producer side, committed first, sha256-proved. A17 shape EIGHT
haystacks. A18 shape TEN empty comparisons. A19 security on the
lane-id input path. A20 adjacency — preflight, board-model, brief.spec,
the ARCHITECTURE prose block, the census. A21 determinism of row and id
order. A22 `brief.mjs`'s four exit codes unmoved. A23 no legitimate
dispatch newly REFUSED. A24 my own enumeration of every consumer.

## TWO — the owed battery, re-run by this seat, exits unpiped

At tip `14075ac2ddd6`, in the lane worktree. `NPUTER_E2E_PORT=14537`;
`lsof -nP -iTCP:14537 -sTCP:LISTEN` returned ZERO ROWS immediately
before binding. Port 1420 was never probed, bound or connected to.

| command | cwd | result |
|---|---|---|
| `npx vitest run` | lib/parser/ | **exit 0 — 315 passed / 15 files** |
| `npx tsc --noEmit` | lib/parser/ | **exit 0** |
| `npm run build` | lib/parser/ | **exit 0** |
| `npm run build` | app/ | **exit 0** |
| `npm test` | app/ | **exit 0 — 1015 passed / 47 files** |
| `npm run typecheck` | tools/e2e/ | **exit 0** |
| `npm run lint:docs` | tools/e2e/ | **exit 0** |
| `npm run lint:tokens` | tools/e2e/ | **exit 0** — TOKEN 155 files, CONTROL 890 tracked text files |
| `npm test` | tools/e2e/ | **exit 1 — 2 failed / 318 passed (3.0m)** |

Arithmetic checked by this seat rather than accepted: the diff adds
FIVE bodies to `brief.spec.ts`, ONE to `card-figures.spec.ts` and ONE to
`dispatch-order.spec.ts` — seven — against the census's 313, and
318 + 2 = 320. The parser's 315 is 314 + the one new `lanes.test.ts`
body.

**THE TWO REDS ARE PRE-EXISTING AND LANE-CAUSED — VERIFIED, NOT
ACCEPTED, AND THE COUNTERFACTUAL IS MEASURED.** This seat cut a DETACHED
scratch worktree at the dispatch commit — `git worktree add --detach
/tmp/v143-base c74890a`, `git status` empty, NO edit of this lane's in
the tree — and ran the command the two bodies assert on:

    node tools/e2e/scripts/brief.mjs --task T-157   ->  exit 1
    brief: FOUND 1 thing(s) the assembler could not settle:
      fences are not disjoint: T-143 tools/e2e against T-157 tools/e2e
        — the same entry (lane-protocol rule five).

EXACTLY ONE finding, and it is the HELD-FENCE ANSWER: correct behaviour
by a command whose honest answer is FOUND while a lane holds
`tools/e2e`. **The greening is proved rather than reasoned** — the same
assembler at the same commit, handed a porcelain with the lane removed:
`lanes=[] findings=0`, against `lanes=[T-143] findings=1` on the live
list. So the two bodies go green the moment this lane's worktree is
removed, and they will red again for the NEXT lane that holds
`tools/e2e`. `T-143-s1` is the right disposition and the integrator owes
it nothing at this merge.

## THREE — the drills, this seat's own, producer-side, one side each

Work already COMMITTED at `14075ac2ddd6`; every mutant moves a PRODUCER
and never an assertion; every mutation was read back with `git diff -U0`
before its suite ran; every restoration is `git restore --source=HEAD
--staged --worktree --` PROVED by sha256 against `git show HEAD:<path>`,
with `git status --short` empty after each. **THIRTEEN mutants, twelve
kills and one deliberate ZERO which is the finding.** Six of the twelve
are directions the executor's own table does not carry.

| # | producer | mutation | suite | bodies red |
|---|---|---|---|---|
| V-M9a | `lanes.ts` | `blindMany` -> `false` | parser lanes | **1 failed / 16 passed** |
| V-M9b | `lanes.ts` | `blindMany` -> `true` | parser lanes | **1 failed / 16 passed** |
| V-M1 | `dispatch-brief.mjs` | `fenceLedger` drops the unreadable lane again | e2e ×3 | **2 failed / 69 passed** |
| V-M2 † | `dispatch-brief.mjs` | ledger's `blind.length === 0` -> `false`: it can ONLY say UNKNOWN | e2e ×3 | **2 failed / 69 passed** |
| V-M3 † | `dispatch-brief.mjs` | `named` -> `"a live lane"`: the ids are not named | e2e brief | **2 failed / 28 passed** |
| V-M4a † | `dispatch-brief.mjs` | ledger `many` -> `false` | e2e brief | **1 failed / 29 passed** |
| V-M6a | `card-figures.mjs` | `contention` drops the unreadable lane again | e2e ×3 | **1 failed / 70 passed** |
| V-M6b † | `card-figures.mjs` | `contention` `many` -> `true` (a DIVERGENCE from the other two) | e2e card-figures | **1 failed / 27 passed** |
| V-M7b † | `dispatch-brief.mjs` | ROW 5's residual gated `if (true)` — printed ALWAYS | e2e brief | **1 failed / 29 passed** |
| V-M8a | `dispatch-order.mjs` | IN FLIGHT widened back to the whole `underway` set | e2e dispatch-order | **2 failed / 11 passed** |
| V-M8b † | `dispatch-order.mjs` | IN FLIGHT emptied (`= []`) | e2e dispatch-order | **1 failed / 12 passed** |
| V-M10 | `dispatch-brief.mjs` | `laneWorktrees` truncates the suffixed id | e2e brief + lane-fence | **1 failed / 55 passed** |
| V-M11 | `dispatch-brief.mjs` | `slugsSharingComponents` filter `> 1` -> `> 99` | e2e brief | **1 failed / 29 passed** |
| **V-M13** | `dispatch-brief.mjs` | *"is live"* -> *"are live"* in the new fewer-than-two clause | e2e ×3 | **0 failed / 71 passed — THE FINDING** |

† not a direction the executor drilled.

**Baseline for the ×3 column, measured before any mutant: 71 passed,
exit 0, 14.3s** over `brief.spec.ts`, `card-figures.spec.ts`,
`dispatch-order.spec.ts`.

**A9/A11 answered mechanically rather than by opinion.** V-M10 kills
exactly ONE body and `lane-fence.spec.ts` stays green under it — so the
new suffixed-branch body kills a mutant no other body kills, which is
`T-072-s2`'s test for shape SIX, and the "pinned anyway" decision is
vindicated even though the brief's item (a) was wrong about the
truncation being live. V-M4a, V-M6b, V-M7b, V-M8b and V-M11 each give a
failing-body count of exactly one.

**The card's own caution is MET.** V-M2 is the mutant the caution
describes — *"a fix that only ever prints HELD passes every test written
from this card's text"* — and it does NOT pass here: the ledger body's
negative-control half reds, along with the suffixed-branch body.

**A15, observed live rather than only mutated.** `node
tools/e2e/scripts/brief.mjs --dispatch` at `14075ac2ddd6` prints exactly
TWO rows under IN FLIGHT ON THE BOARD: T-143 (`verifying`, 2 paths,
*"it HAS a lane above, so that fence is held for real"*) and T-135
(`building`, 2 paths, *"it has NO lane, so it holds no fence — the board
stamp is all there is"*). No `done` and no `parked` card appears.
Board census re-derived by this seat at `14075ac2ddd6`: **done 127,
parked 124, planned 63, suggested 5, building 1, verifying 1 — 321
cards**, and the parser's exported `IN_FLIGHT` is
`{building, verifying, merging}`. Unfiltered, that section would print
258 rows.

## FOUR — the sweep, enumerated by this seat rather than checked against a claim

`git grep` from the repository ROOT over `tools/e2e/scripts`,
`lib/parser/src` and `app/src` for `.lanes`, `heldBy`, `laneWorktrees`,
`readDispatchOrder`, the `FREE` literal and `undefined) continue`.
**Every consumer of the lane list or of a fence token, with its
disposition:**

| consumer | disposition |
|---|---|
| `lanes.ts` `rule()` / `readDispatchOrder` | fixed at `62a4364`; number agreement added here, both directions pinned |
| `dispatch-brief.mjs` `fenceLedger` | FIXED here — UNKNOWN, ids named, held rows carry the residual |
| `dispatch-brief.mjs` `deriveFence` (ROW 5) | FIXED here — see correction 1 |
| `dispatch-brief.mjs` `stateReport` lane list | already correct — prints `no live card` / `board says unknown` per lane |
| `dispatch-brief.mjs` `stateReport` "not a lane" block | no world-claim; detached entries only |
| `dispatch-brief.mjs` `laneWorktrees` | the id join, now pinned on a suffixed branch |
| `card-figures.mjs` `contention` | FIXED here — the third implementation |
| `card-preflight.mjs` `heldClaims` join | already correct — reports `no live card` explicitly and defers the ruling to `readDispatchOrder` |
| `dispatch-order.mjs` `dispatchReport` | lane list + the new IN FLIGHT section |
| `.claude/hooks/lane-fence.mjs` | reads the manifest, never the lane list — out of the class |
| `app/src/lib/board-model.ts` | already correct — `fenceKnown`, `blindLanes`, and an `undecidable` refusal; the CAVEAT is genuinely consumed at the dispatchable sentence, not merely computed. **But see routed `T-143-s3`.** |
| `app/src/lib/dispatch-store.ts` | carries `DispatchRow.lanes`; no fence claim of its own |

**No consumer the sweep missed.** Nothing under `app/` calls
`readDispatchOrder` — confirmed by this seat's own grep, not relayed.

## FIVE — the ruling on the NAME-versus-REGION join

**The disclosure SATISFIES criterion 3, and the criterion is narrower
than the defect. Region-joining the ledger is a ROUTED card, not an
assigned correction — but the qualifier's stated CAUSE is wrong on this
tree today, and that half is assigned.**

**The containment history, re-derived at `14075ac2ddd6` rather than
quoted.** `git grep 'by containment\|containment is overlap\|CONTAINMENT'
-- docs/ method/`: `method/lane-protocol.md` rule 5 states the principle;
`T-111` added separator-anchored containment to `touchTokensOverlap` and
censused ELEVEN new tokens that were a containment family the previous
census did not have; `T-085` ruled its own reader exclusion a property of
containment; `T-138` refused a `method/roles/orchestrator.md` release
because `T-135` holds `method/tasks/TASK-FORMAT.md` — *"Name the file"*;
`T-137` was handed three `method/` cards that overlap `T-135` by
containment; and this card's own night is the fifth, where `method/`
contains `method/tasks/TASK-FORMAT.md`. Five instances, in the fence
domain, and `expandFence`/`sharedDomain` already implement the rule.

**The hole is LIVE and this seat measured it, with no unreadable card
anywhere in the fixture.** A census over the whole board at
`14075ac2ddd6`: **63 distinct `touches:` tokens, 55 of them not a slug
name, and 2 of those 55 overlap a slug's region by containment** — both
on `T-159-s4`, both against `app-interview`. Constructed:

    lane task/T-159-s4-…  (card READABLE — blind lanes: none)
    --state ledger  ->  app-interview: FREE
    --task fenceOverlaps against T-027
      ->  OVERLAP — T-159-s4 app/src/genesis/genesis-derive.ts
          against T-027 app-interview, both reserve
          app/src/genesis/genesis-derive.ts and app/src/genesis/**

One command, two halves, opposite answers about one set of files, and
the ledger's half is the one that says FREE.

**Why it is nonetheless not a failed criterion.** Criterion 1's own
EARS clause opens *"WHEN any lane's card cannot be resolved in this
checkout"*, and so does criterion 2's *"unreachable when part of the
world could not be read"*. The instance above has nothing unreadable in
it, so it falls outside both. Criterion 3 offers TWO arms — *"Either the
display carries the qualifier or it points at the `--task` half"* — and
this diff takes BOTH. The criterion is met.

**What is NOT met is the accuracy of the words chosen**, and that is
assigned below: the qualifier explains itself with the slug-sharing
cause, which is the cause this tree does NOT have a live instance of,
and omits the containment cause, which is the cause it does.

## SIX — ASSIGNED CORRECTIONS (the integrator performs; none blocks the merge)

**CORRECTION 1 — `tools/e2e/scripts/dispatch-brief.mjs`, `deriveFence`'s
new *"fewer than two READABLE fences to compare"* clause: it disagrees
in NUMBER with the list it names, which is CRITERION 4's own class, in a
sentence THIS DIFF wrote, four lines from the sentence that gets it
right.** Rendered by this seat at `14075ac2ddd6` with one, two and three
unreadable lanes live:

    fewer than two READABLE fences to compare — T-901, T-902, T-903
      is live and could not be expanded at all, so nothing below is a
      claim about it

**And it is unpinned in BOTH directions**, exactly as the `fenced`
residual was before this lane: drill **V-M13** mutated `is live` to
`are live` and the three specs came back **71 passed, 0 killed**. The
ROW-5 body asserts only the clause's PREFIX. Fix: make the verb and the
trailing pronoun functions of `blind.length`, the way the two clauses
beside it already are, and add the two assertions to
`brief.spec.ts`'s *"`DISJOINT` is the same class of word as `FREE`"*
body, which already builds the two-blind-lane fixture and needs no new
one. A FIX NAMES ITS CLASS AND ITS SWEEP — and this sweep did not reach
the sentences the fix itself wrote.

**CORRECTION 2 — same file, `stateReport`'s `shared.length === 0`
branch, which asserts a universal its premise does not support.** It
prints *"no component is claimed by two slugs today, so no row here is
free-as-a-name and held-as-a-region"*. The clause after *"so"* is FALSE
independently of the clause before it: the `T-159-s4` instance in
section FIVE is a row that is free as a name and held as a region with
NO component shared by two slugs. The branch is unreachable today
(`C-11` exists, and V-M11 proves the derivation is pinned), which is
precisely why it will be believed on the day it fires. Fix: end the
sentence at *"today"*, or state the containment cause in the same
breath.

**CORRECTION 3 — same file, the three `note(...)` lines above the
ledger: add the containment cause.** The Implementation notes claim the
qualifier *"tells the reader that in as many words"*; the rendered text
says only *"Two slugs can expand through one component"*. A lane
declaring a bare PATH inside a slug's region is not two slugs and not
one component — it is the other cause, and it is the one with a live
instance. One line, beside the two already there.

All three are single-sentence edits inside `tools/e2e`, which this lane
already holds; they are assigned rather than required before merge
because none of them changes an ANSWER — correction 1 changes a word in
a sentence that is already reaching the reader, and 2 and 3 change what
a reader is told about a display that already points at the half that
answers properly.

## SEVEN — routed, not assigned

- **`T-143-s2`** — the ledger and `contention` are NAME joins and a
  fence is a REGION; make them expand through `fence.ts`. Filed with the
  live census (2 of 55 path tokens today) and the two-halves-disagree
  measurement above, so the next seat starts from data rather than from
  the card's `C-11` example.
- **`T-143-s3`** — `app/src/lib/board-model.ts`'s blind-lane CAVEAT is a
  THIRD live instance of correction 1's number-agreement class
  (*"2 of those lanes (X, Y) is claimed by no card, so its fence could
  not be READ"*), and it is OUTSIDE this card's fence, so it is routed
  rather than corrected.

## EIGHT — the rest of the attack set, answered

- **A5** a zero-lane world still answers `FREE`, and every `unknownFrom`
  is empty — the ledger body's own negative control, re-run under V-M2.
- **A17 / A18** no new assertion searches a whole-file haystack for a
  needle it also owns, and every comparison in the new bodies asserts
  its expected side NON-EMPTY first (`readableLane()` throws rather than
  returning nothing; the shared-component body asserts `wanted.length >
  0`; the contention body asserts `entries.length > 0`; the IN FLIGHT
  body asserts both `inFlight.length > 0` and `doneOnes.length > 0`).
  Shapes EIGHT and TEN: clear.
- **A19 SECURITY.** No dependency was added — the diff touches no
  manifest. The only new input path is the lane id, which comes from
  `spellings.branchRe` over `git worktree list --porcelain` and is spent
  on `Array.prototype.join` into display text; nothing is interpolated
  into a shell, a path, a regex or a filesystem read. No new endpoint, no
  secret, no key. **Clear.**
- **A21** determinism holds: `blind` is push-ordered over
  `laneWorktrees`' own `taskId` sort and deduped; the ledger's rows are
  `[...all].sort()`.
- **A22 / A23** `brief.mjs` is untouched by the diff, so its four exit
  codes are unmoved, and nothing new REFUSES: the ledger's answer widened
  from two words to a sentence and no code path gained a throw.
- **A20 ADJACENCY, the one real consequence.** `fenceLedger`'s `heldBy`
  is now a SENTENCE rather than an id list whenever a blind lane is live.
  This seat checked every reader: the only two are `stateReport`'s own
  render and `brief.spec.ts`. Nothing parses the field. Safe — and the
  new `unknownFrom: string[]` is the machine-readable half for whoever
  needs one next.

## NINE — the gates at MY OWN TIP, because prose is a code input

Re-derived after this verdict and the two suggestion cards were
committed; every figure at the ref it names. This seat's commits are
`docs/tasks/` ONLY.

- **GRAPH REGEN — fires for the LANE and cannot be moved by me.** Asked
  rather than predicted, at `14075ac2ddd6` from `app/src-tauri/`:
  `index --check --root ../..` exits **1 STALE**, content-only —
  **`files +0 -0 ~2`, 0 symbols, 0 edges**, `lib/parser/src/lanes.ts`
  loc 527 -> 538 and `lib/parser/test/lanes.test.ts` loc 415 -> 456,
  committed and fresh both **1022964 bytes**. `docs/` is
  `.nputerignore`d, so my own prose commits cannot move it. **The regen
  is the INTEGRATOR's, at the checkpoint.** Noted in passing and not
  raised: the budget reads **1022964 of 1040000 (98.4%), 17036 left** —
  @human's standing `T-151` item.
- **CAPABILITIES — STALE, and the regen is the integrator's.**
  `npm run capabilities:check` exits **1 — committed 24849 bytes, a
  fresh generation is 25444**, the seven new spec bodies. `read, don't
  regen` observed: `docs/CAPABILITIES.md` is outside this fence.
- **DOCS GATE — fires on my paths and I ran what it named.**
- **BOOT GATE / METHOD EVAL GATE — NOT OWED**, derived over the whole
  forecast path list: nothing under `app/src/**`, `app/src-tauri/**`,
  either manifest, or `method/**`.

## TEN — verdict

**APPROVED WITH ASSIGNED CORRECTIONS.** The refusal-to-lie property is
real and it is pinned in three implementations plus the parser's: a lane
whose card this checkout cannot read now yields `UNKNOWN` naming the
ids, and `FREE`, `DISJOINT` and *"fewer than two"* have each stopped
being claims about a world nobody read. The card's own caution — that a
fix which can only print HELD passes every test written from its text —
was drilled directly and does not pass. The sweep found a THIRD
implementation nobody had reported and pinned it in both directions. The
two e2e reds are pre-existing, lane-caused, and this seat proved the
counterfactual rather than reasoning it. The three corrections are
single sentences, and every one of them is about what a reader is TOLD
rather than about what the tool ANSWERS — which is the right shape for a
card whose whole subject is that a cheap display gets consulted instead
of an expensive verdict.
