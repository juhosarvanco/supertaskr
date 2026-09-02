---
id: T-126-s2
title: The join is the half F-04 actually renders and it has no zero-argument shape — the board's stamps are parsed in TypeScript and a joining command would have to take them inbound
feature: F-04
milestone: 4
priority: 3
size: M
status: done
blocked_by: [T-198]
touches: [app-board, app-dispatch]
suggested_by: executor claude-opus-5 @T-126
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

**T-126's criterion 6 fired, and it fired on the JOIN rather than on the
reader.** The card asks the executor to say so and route it rather than
adding an argument to make it fit; this is that routing.

`dispatch::lanes::read_lanes(root)` fits a zero-argument command
perfectly — the project root comes from `WatchState`, which is the shell
knowing the open project rather than the webview supplying it. So
`dispatch_lanes` shipped.

`dispatch::join::join_lanes(scan, board)` does not. Its second argument
is `&[BoardStamp]` — one `{id, status}` per card — and **the board is
parsed in TypeScript**: `@nputer/parser` reads `docs/tasks/` and the Rust
side has no parser and no card reader. A joining command therefore has
exactly three shapes and all three are wrong today:

1. **Take the stamps inbound.** A `Vec<BoardStamp>` argument is caller
   input crossing the boundary, which is what ADR-012's "narrowness lives
   in the command's own signature" forbids and what T-126's criterion
   names in as many words.
2. **Parse the board in Rust.** A second implementation of the card
   parser — the exact divergence `T-033-s11` records for `non_code`,
   where two engines already disagree about one registry.
3. **Join in TypeScript.** Refuted by measurement, not by taste:
   T-110's first pass did this and four one-side-only producer mutants
   survived `npm run build` and `npm test` at exit 0, because
   `app/vitest.config.ts` collects `test/**` only and no file imports
   `dispatch-store.ts`. That rejection is why `join.rs` exists.

## What this means for F-04

`join_lanes` is compiled into the binary as of T-126 and reachable to any
Rust caller; it is not reachable from the webview and cannot be made so
by this card's rules. **Whoever renders the four states has to decide
where the board comes from before they decide where the join runs** —
and option 2 is likelier than it looks, because a lane reader that
already reads `.git` is one directory away from reading `docs/tasks/`.

Read it beside `T-110-s3` (the dispatch store has no pin because
`app/test/**` is `app-shell`) and `T-111`, which derives a board
disposition from the lane set and is the first consumer either way.

## Fence

`[app-dispatch]` for the command, plus `[app-shell]` for its
registration, plus `[lib-parser]` or `[crate-index]` if the board moves
to Rust. It wants a ruling before it wants a fence.

## PARKED — eleventh triage, 2026-08-26

Real and still true; not now. **UN-PARK WHEN:** a consumer needs to render the four lane states — i.e. `T-111`/`T-112`. Its own text says it wants a ruling before it wants a fence, and nothing is broken: `join_lanes` is compiled and webview-unreachable.

## CORROBORATION — 2026-08-31, `T-112-s1`'s executor, at `82f5722` + that lane's diff

**THE UN-PARK CONDITION ABOVE HAS FIRED, AND THIS CARD IS NOW THE ONLY
THING BETWEEN THE APP AND A RENDERED DISPATCH BLOCK.** Filed as a
corroboration rather than a sibling card, because this card already owns
the class (tasks/TASK-FORMAT.md, *search before filing*).

`T-112-s1`'s criterion 3 reads *"THE board root SHALL fill `Board.tsx`'s
`dispatch` and `brief` props from the store, so the drawer's dispatch
block reaches a real card."* Its `brief` half landed: `dispatch_brief` is
registered in `lib.rs` and reached by `dispatch-store.ts`'s `readBrief`.
Its `dispatch` half **cannot be built by any card that respects this
one's ruling**, and the chain is mechanical rather than a matter of
taste:

- `TaskDetailPanel.tsx` computes `briefPanel` as
  `dispatch === undefined ? undefined : selectBriefPanel(...)`, so the
  block does not render at all without a `DispatchReading`;
- `DispatchReading` is `joined | unavailable`, and `selectDispositions`
  in `board-model.ts` reads `row.state` and `row.lanes` off every joined
  row — the join's own classification;
- the only honest producers of that are `join_lanes`, whose three
  shapes this card refuses, or a `joined` reading over an EMPTY map,
  which is the exact lie the frontier's `unavailable` arm exists to
  prevent (*an empty lane set and an unread one are not the same fact*).

`T-112-s1` held `app-shell` AND `app-dispatch`, so its fence reached
both `lib.rs` and `join.rs` — **it could have registered a joining
command and deliberately did not.** This card says it wants a RULING
before it wants a fence, and an executor may not make an unruled
architecture decision from inside a lane. What is owed is the ruling,
not a lane.

**WHAT THE RULING NOW COSTS, STATED SO THE TRIAGE CAN PRICE IT.** Every
piece of F-04's dispatch block is built, proved and reachable except
this: the assembler (T-112, 29 bodies), its command (`T-112-s1`), the
lane reader (T-110/T-126), the join itself (`join.rs`, one pin per
state), the frontier (`selectDispositions`), the presentation
(`selectBriefPanel`) and the board root's threading — which `T-112-s1`
pinned in `app/test/board-truth.test.tsx`, killing the mutant `T-112-s4`
measured. The drawer's dispatch block renders correctly under that pin
and cannot render in the shipped app.

## THE RULING — architecture sitting, 2026-08-31, architect seat at `a3bb22d`

**UN-PARKED: the condition fired.** The eleventh triage said *"UN-PARK
WHEN: a consumer needs to render the four lane states."* `T-112-s1`
registered `dispatch_brief` and wired `dispatch-store.ts` to it, so the
consumer exists. This card asked for a ruling before a fence; here it is.

### Shape 1 and shape 2 are refused on properties that CANNOT be fixed

**Shape 1 — stamps inbound — is dead.** ADR-012 puts narrowness in the
command's own signature and a `Vec<BoardStamp>` argument is caller input
crossing the boundary. No measurement can revive it, because nothing
about the repository's test coverage is what makes it wrong.

**Shape 2 — parse the board in Rust — is dead.** It is a second card
parser, which is `T-057`'s rule, and the harm is not hypothetical:
`T-033-s11` records two engines already disagreeing about one registry
for `non_code`. Also unfixable-by-measurement, and for the same reason.

### Shape 3 is refused on TEST REACHABILITY, and that is a different KIND of objection

`T-110`'s rejection was measured, not aesthetic: four one-side-only
producer mutants survived `npm run build` and `npm test` at exit 0,
because `app/vitest.config.ts` collects `test/**` only and **no file
imports `dispatch-store.ts`.**

**This sitting re-measured that, expecting it to have healed, and it has
not — it is worse than `T-110` recorded:**

- Nothing under `app/src` or `app/test` imports `dispatch-store.ts`. Not
  by `import`, not by `require`, not by dynamic `import()`.
- Its exported `hydrateJoin` is referenced exactly once outside its own
  file, and **the reference is a doc comment** in
  `app/test/select-board.test.ts` — a fixture that hand-builds *"the
  shape `hydrateJoin` produces"* without calling it, and produces a
  different shape. That is filed as `T-185`.

### The asymmetry IS the ruling

Shapes 1 and 2 are refuted by architectural properties, which do not
decay and cannot be bought off. **Shape 3 is refuted by a property a lane
can fix.** An objection with a remedy and two objections without is not a
three-way choice; it is one option and a price.

**THE JOIN GOES TO TYPESCRIPT — after, and only after, the dispatch view
model has a test path.** Doing it in the other order reproduces `T-110`
exactly, and this project has already paid for that lesson once.

### The order is therefore FORCED, and this card is not first

- **`T-112-s4` is this card's BLOCKER, not its sibling.** C-18 declares
  no test path, so `[app-board]` cannot add one without editing the
  registry, and `Board.tsx`'s prop threading is deletable with the whole
  app run green — measured on that card. Until that is fixed, anything
  put in TypeScript here is unpinnable by construction. `blocked_by` now
  says so.
- **Then this card.**
- **Then `T-112-s5`**, whose own shape 3 (fetch in `TaskDetailPanel`)
  needs the C-09 → C-15 edge declared — a registry edit in the same file
  `T-112-s4` already opens.

### A note on how this ruling was nearly got wrong

The sitting opened with `grep -l dispatch-store app/test/`, which
returned two files and looked like the refutation had healed. **Both were
false positives**: one match is a comment, the other a path string
literal inside a registry census. A census satisfied by a MENTION rather
than by a USE is a failure family this repository has now met in five
places, and it very nearly booked an architecture decision. The check
that settled it was grepping for `import`/`require`/`import(` rather than
for the module's name.

## CORRECTION TO THE RULING — same day, and the lane the ruling DISPATCHED is what corrected it

**The ruling named the wrong component as the blocker.** It is corrected
here rather than quietly amended above, because the reasoning that
produced the error is worth more than the error.

`T-112-s4`'s executor measured, from inside `[app-board]`, that **the
dispatch view model is already reachable**:

- `selectDispositions` — driven by `app/test/select-board.test.ts`
- `selectBriefPanel` — driven by `app/test/select-task-detail.test.ts`
- the drawer's rendered block — driven by `app/test/detail-assignment.test.tsx`

All three in-fence, all three verified at that lane's own ref. **What no
test file may reach is `dispatch-store.ts` itself: C-15 declares no test
path either.** Routed as `T-190`.

### What survives and what does not

**The ruling's DIRECTION is unchanged and is now better supported.** The
join goes to TypeScript, and shape 3's objection is still test
reachability rather than architecture. The asymmetry that decided it —
shapes 1 and 2 refused on properties that cannot be fixed, shape 3 on one
a lane can — is untouched.

**What was wrong is the ATTRIBUTION.** The ruling said C-18's missing
test path was the obstacle. It is not: C-18's prop threading is now
pinned (see below), and the view model beneath it was always reachable.
**The obstacle is C-15's missing test path**, one component over, and
that is exactly where the unreachable code sits.

So `blocked_by` should name `T-190`, not `T-112-s4`. `T-112-s4` remains
worth doing on its own terms and remains a neighbour; it is not this
card's gate.

### And the ruling's own evidence was already pointing at C-15

This is the part worth keeping. The sitting measured that **nothing
imports `dispatch-store.ts`** and that `hydrateJoin` is referenced only
by a doc comment — both facts about **C-15**, and it wrote them down
correctly. Then it reached for the nearest carded registry gap and
attributed them to **C-18**, because `T-112-s4` was the card in front of
it and said "no test path" in its title.

**The measurement was right and the card it was pinned to was wrong.**
That is a quieter failure than a bad measurement and a harder one to
catch, and it was caught only because the ruling dispatched a lane that
went and looked.

### A second correction, from the same lane

`T-112-s4`'s own premise **healed before it was executed**. Its title
claims a mutant survives the whole app run; `T-112-s1` pinned the
threading in `board-truth.test.tsx` in the interval, and the lane
re-drilled each threading line separately and together — one side only,
restored and proven by hash — and **every mutant now dies**. So the
sitting's citation of *"deletable with the whole app run green"* was true
when written and false when quoted.

## `blocked_by` IS EMPTY AND THE BLOCKER IS REAL — a forward reference redded CI

This card's blocker is **`T-190`** (C-15 declares no test path), routed by
`T-112-s4` and living in that lane until it merges. Writing
`blocked_by: [T-190]` here **redded the parser suite on CI**:

    blocked_by names 'T-190' but no task in the model declares it

`blocked_by` is a resolved reference, not a note, so it cannot name a
card the model does not carry. The field is empty **and this paragraph is
the blocker of record** until `T-112-s4` merges and brings `T-190` with
it; the field is restored in that same merge.

**AND THE FIRST DIAGNOSIS OF THIS WAS WRONG — CORRECTED BY `T-142`'s LANE,
WHICH MEASURED IT.** This seat wrote that the instrument could not have
caught it. **It could, and it names the answer.**

`npm run lint:docs` is `docs-gate.mjs --census`. The CENSUS exits 0 and
prints no FIRES line and no owed suite at all. **The DOCS GATE proper,
given the changed path, exits 1 and names `lib/parser/test/smoke.test.ts`
BY NAME** as an owed reader — the exact body that reddened. Verified at
this seat:

    docs-gate: FIRES — 1 path(s) under docs/ are code inputs. Run:
      reader  lib/parser/test/smoke.test.ts  [npx vitest run from lib/parser/]

**So the instrument existed, worked, and was never asked.** The defect is
that the reassuring mode is the one whose npm alias sounds like the
general question, and its exit 0 means *"I wasn't asked"* while the
gate's contract reserves 0 for *"nothing owed"*. `T-090` argued this gate
should not be an npm script at all and recorded "exactly four" scripts;
there are now nine, including that alias. Filed as `T-142-s1`.

## `blocked_by` RESTORED — `T-190` landed with `T-112-s4`'s merge, 2026-08-31

The field is repointed at `T-190` in the same merge that brought it onto
main, as the paragraph above promised. **The obligation was memory-held
and it was discharged only because it was written down here and in the
checkpoint draft** — which is the whole argument of `T-167-s8`, met once
more.

## THE BLOCKER MOVES AGAIN — `T-190` PRICED THE WALL, `T-198` CROSSES IT

Second correction to this ruling's attribution, and both came from lanes
the ruling itself dispatched.

`T-190` measured that **no location an `[app-dispatch]` fence reaches is
collected by any runner** — `app/vitest.config.ts` collects `test/**`
relative to `app/` — so the pin this seam needs cannot be built from that
fence at all. It priced the wall exactly (the registry line reds one
body, owned by C-12) and routed the crossing as **`T-198`**, which
carries the four `touches:` tokens a lane actually needs.

So: the ruling's DIRECTION has never moved, and its BLOCKER has now moved
twice — C-18 → `T-190` → `T-198`. Each move was a measurement, and each
came from a lane that went and looked rather than from this seat
reasoning harder.

## BUILT — `T-126-s2`'s lane, 2026-09-02, at base `fb222cd`

**THE RULED SHAPE AND NOTHING ELSE.** The join is in TypeScript. This
card carried no `## Acceptance criteria` section — the dispatch brief's
own signal row says so — so the criteria below are the RULING's clauses,
read as criteria, each with its measurement at this lane's tip.

### C1 — the join lives in TypeScript, in C-15's own module

`app/src/lib/dispatch-store.ts` gains `IN_FLIGHT_STATUSES`, `isInFlight`,
`classify`, `REFUSAL_SENTENCES`/`refusalSentence` and
`joinLanes(scan, board)`. **MEASURED**: `npm run build` from `app/` exit
0 (both `tsc` programs plus `vite build`); `joinLanes` is exported and
imported by `app/test/dispatch-store.test.ts`.

**IT PRODUCES THE WIRE FORM AND HANDS IT TO `hydrateJoin`** rather than
filling a `Map` itself. That is not tidiness: it makes *"this join
produces what the Rust join would have put on the wire"* a fact about the
code, and it leaves ONE site in this repository that turns dispatch rows
into a keyed collection, so ADR-009's shape cannot be obeyed in one place
and forgotten in the other.

### C2 — it lands AFTER the view model has a test path, never before

`T-198` is `status: done` at this base and
`app/test/dispatch-store.test.ts` exists and collects.
**MEASURED**: `npx vitest run test/dispatch-store.test.ts` from `app/`
— 5 bodies at the base, **20** at the tip, all passing.

### C3 — the bodies KILL mutants rather than merely importing the module

**MEASURED, 15-for-15 at commit `ca8b963`**, one side only, each landing
read back with `git diff --unified=0` and each restore proved by
`shasum -a 256` against `git show ca8b963:<path>`:

| mutant | kill set (bodies) |
|---|---|
| `classify` `live` arm → `died` | 3 |
| `classify` `died` arm → `notDispatched` | 3 |
| `classify` `stampSkipped` arm → `notDispatched` | 3 |
| `classify` `notDispatched` arm → `stampSkipped` | 4 |
| `IN_FLIGHT_STATUSES` emptied | 6 |
| the no-card half short-circuited | 1 |
| the ASCII sort removed | 1 |
| `notLanes.push` dropped | 1 |
| `truncated` hardcoded `false` | 1 |
| two refusals given one sentence | 1 |
| duplicate board id → first wins | 1 |
| the second lane for one id dropped | 1 |
| a scanned-EMPTY repository treated as a refusal | 5 |
| `join.rs`'s `IN_FLIGHT_STATUSES` reworded (Rust side) | 1 |
| a plant of the absent sentence in `join.rs` (Rust side) | 1 |

**AND ONE MUTANT SURVIVED ON ITS FIRST SHAPE, WHICH IS THE FINDING WORTH
KEEPING.** The last row's plant was first written as an UNQUOTED doc
comment and the body stayed green — because the negative control searches
for the sentence as a Rust STRING LITERAL, quotes included. Re-planted
with the quotes it reds. That is the POISON DRILL's own proof clause
working as designed: *"a search-based check is run once against a PLANTED
HIT before its zero is written down"*, and the first plant proved the
plant wrong rather than the assertion.

### C4 — two spellings of one rule do not go unheld

T-110's indictment is *"two copies of one rule with a pin under only one
of them"*. `join.rs` keeps `join_lanes` — webview-unreachable, still
driven by `cargo test`, and still depended on by `brief.rs` for
`LaneScanRefusal` — so REMOVING it is a second architecture decision this
ruling did not take, and it is routed rather than taken.
`the_rust_join_and_this_one_spell_one_rule` reads `join.rs`'s source and
requires the three in-flight statuses, the four state names and the four
refusal sentences to agree. **MEASURED**: rewording the Rust constant
reds that body and nothing else.

## WHAT THIS CARD DID NOT BUILD, AND WHY EACH IS A ROUTE RATHER THAN A GAP

**THE DISPATCH BLOCK STILL DOES NOT RENDER IN THE SHIPPED APP.** The
corroboration above says this card is *"the only thing between the app
and a rendered dispatch block"*, and that is **the one place the record
was wrong** — measured from inside the fence rather than argued:

- `joinLanes` needs a `LaneScan`, whose only producer is the registered
  `dispatch_lanes`; `dispatch-store.ts` has no door onto it, and the door
  is `T-126-s1` — PARKED on a genuine RULING (mirror the
  `DispatchLanesOutcome` wrapper, or fold `noProject` into `LaneScan` as
  a sixth kind), whose own note assigns it to whoever holds
  `[app-dispatch]` when a frontend first calls the command. This lane
  held `[app-dispatch]` and declined it: its dispatch was the ruled shape
  and nothing else, and taking a second architecture decision to make
  this card's output visible is exactly the move `T-112-s1` declined for
  the same reason.
- The two files that render `<Board>` — `app/src/App.tsx:812` and
  `app/src/genesis/BoardCrescendo.tsx:135`, neither passing `dispatch` —
  are C-05's `app-shell`, which no `[app-board, app-dispatch]` fence
  reaches.

Routed as **`T-126-s9`** (the call site, with the door and the IPC census
fixture) and **`T-126-s8`** (the Rust join's disposition). Both suffixes
were checked against the whole tree first: `T-126-s4` through `T-126-s7`
are already spent — `s4` and `s5` are named across `T-126`'s own card and
`T-135`, and `s6`/`s7` were absorbed by `T-159`'s `Absorbs:` line — so
`s8` is the first free ordinal.

## VERDICT

**APPROVED** — 2026-09-02, verifier `claude-opus-5@subagent`, seat
`V-T-126-s2`, bench `/Users/ujju/Projects/nputer-V-T-126-s2`.
**Tip judged: `dd190023334a4c46c2e4ffcde6894b36c190460b`**, base
`fb222cdbe5d3d208f5c82b25d6644a27f1361dab`. Every figure below was
measured in this bench, each carries the ref it was measured at, and not
one was taken from the executor.

### The frame, and the seals

Phase 1 was a spawn of its own, before this diff existed. The attack set
and the ground truth were written from the card at `fb222cd` — with
`docs/CONVENTIONS.md`, `method/roles/verifier.md` and the F-04 entries of
`docs/ROADMAP.md` — and sealed at **2026-09-02T16:06:50Z**:

    attack set: sha256:1c61b5288fa6e087f67b7bbfeb8365777d97ad6f97bc83df3e39a7fd7598e918 (attack-V-T-126-s2.md)
    ground truth: sha256:6a0f0a046bc7635795e3f5b66e7715083c0eaa08d5adef4ebd018f130c01c2e3 (ground-V-T-126-s2.md)
    stamps-V-T-126-s2.txt carries both, the base ref and the sealing clock.

Both re-verified byte-identical after this verdict was written.

**WHAT THE BLINDNESS ACTUALLY WAS.** Phase 1 had a shell and used it: it
read the card and the governing documents at the base and MEASURED the
four suites, the arch and graph readings, the fence expansion and the
import census there. It never opened the lane, its branch, its diff or
any executor note, and the dispatching brief named no executor-derived
specific. Phase 2 arrived carrying the executor's own tree facts — its
fifteen mutants and their kill sets, its suite figures, its three routes.
That is phase 2's ordinary shape, and the answer is that **nothing below
rests on any of them**: the obligations are the ones sealed in phase 1,
the drill is the sealed one, and every count is mine.

**ONE DEVIATION, DISCLOSED.** `method/roles/verifier.md` says this seat
does not read `docs/ROADMAP.md`; my dispatcher instructed me to read its
F-04 dispatch entries and I did, in phase 1. They carry nothing about
this card's implementation.

### The card carries no acceptance criteria, so the RULING was read as one

Stated in phase 1 before the diff was opened, and the executor reached
the same conclusion independently. Nine obligations were sealed; each is
re-derived here.

**D1 — the join is in TypeScript.** MET. `joinLanes(scan, board)` in
`app/src/lib/dispatch-store.ts`, with `IN_FLIGHT_STATUSES`, `isInFlight`,
`classify`, `REFUSAL_SENTENCES` and `refusalSentence`. It builds the
`DispatchJoinWire` and hands it to `hydrateJoin`, so one site in this
repository turns dispatch rows into a keyed collection.

**D2 — reachable by a collected body, and the bodies BITE.** MET, and
this is the obligation the whole card turns on. See the drill below and,
above all, the control.

**D3 — shape 1 is not built.** MET. Swept over the whole diff at
`dd19002`: no `#[tauri::command]` added or changed, no `generate_handler`
line touched, no `invoke(` added. `app/src-tauri/src/lib.rs` is not in
the diff at all — 10 paths, and its absence is the fence holding.

**D4 — shape 2 is not built.** MET. No `read_dir`, no `serde_yaml`, no
`docs/tasks` read anywhere in the added Rust. The only Rust changes are
module-doc prose in `join.rs` and `mod.rs`.

**D5 — one rule, and the second spelling is HELD.** MET, and it is met by
a keeper rather than by a promise. The Rust join stays (`brief.rs` needs
its `LaneScanRefusal`, `lanes.rs` holds `include_str!("join.rs")`), and
its removal is routed as `T-126-s8`. The keeper is
`the_rust_join_and_this_one_spell_one_rule`. **Measured, not accepted:**

- **M11**, `join.rs`'s `IN_FLIGHT_STATUSES` reworded `merging` →
  `integrating`: app suite **1 failed | 1160 passed (1161)**, exit 1, and
  the one failure IS that body.
- **M11c**, the real drift case — one refusal sentence reworded in
  `join.rs` *and* in its own Rust expectation, so the Rust file is
  self-consistent: the TS pin **reds** (1 body). A drift cannot land
  green.
- **M12**, the pin's own negative control — a sentence the TS side does
  not author, planted in `join.rs` as a quoted literal: **reds**. The
  control is not inert.

**D6 — the fence holds.** MET. Ten paths: six code paths, all inside
`[app-board, app-dispatch]` (`dispatch/join.rs`, `dispatch/mod.rs`,
`Board.tsx`, `TaskDetailPanel.tsx`, `dispatch-store.ts`,
`dispatch-store.test.ts`), plus this card and three filed findings.
Nothing under `app/src/App.tsx`, `app/src-tauri/src/lib.rs`,
`app/vitest.config.ts`, `app/test/board-truth.test.tsx`,
`app/test/architecture-dogfood.test.ts` or any
`docs/architecture/components/C-*.md`.

**D7 — no undeclared cross-component edge.** MET, read from
`index --check --root ../..` at `dd19002` rather than forecast. STALE at
exit 1 by construction (a `.ts` joined the walk), `files +0 -0 ~6`, and
**edges +19 −1**: every added edge lands either inside C-15's own two
files or on `p:node:fs` / `p:node:path`, which are PACKAGE edges. No new
component-to-component edge, so no registry line is owed and the fence
did not need widening. `arch --root ../..` is **byte-identical to my base
capture** and `arch cycles` is ACYCLIC at exit 0. The importer census for
`dispatch-store.ts` is still exactly **1** file (the pin), against a
positive control of **13** for `board-model`.

**D8 — `unavailable` survives.** MET. A refused scan returns
`unavailable` with its own arm and its own sentence; the four sentences
are asserted whole and pairwise distinct; and the suite carries the
CONTROL that gives those four assertions meaning — the same board over a
**scanned but empty** repository comes back `joined`. My own hostile probe
adds the boundary the suite does not: an unknown refusal kind invented on
the Rust side comes back NOT `joined`.

**D9 — the regression floor.** MET; the table below.

### The drill — twelve mutants, all mine, all one side only

Every landing was read from `git diff`, never from a mutator's report;
every restore was proved with `shasum -a 256` against
`git show dd19002:<path>`; the app suite was rebuilt (`npm run build`,
exit 0 every time) before each reading.

| # | mutant, one side only | file | failing bodies |
|---|---|---|---|
| M1 | `classify`: `died` and `stampSkipped` arms swapped | store | **5** |
| M2 | `merging` removed from `IN_FLIGHT_STATUSES` | store | **3** |
| M3 | `IN_FLIGHT_STATUSES` emptied | store | **6** |
| M4 | the lane-on-no-card half short-circuited | store | **1** |
| M5 | `noWorktreesDirectory` given `notAGitRepository`'s sentence | store | **1** |
| M6 | a refused scan returns `joined` over an empty map | store | **1** |
| M7 | `notLanes` dropped at the return | store | **1** |
| M7b | `truncated` hardcoded `false` at the return | store | **1** |
| M8 | the second lane for one task id overwritten | store | **1** |
| M9 | the ASCII sort removed | store | **1** |
| M11 | `join.rs`'s `IN_FLIGHT_STATUSES` reworded | join.rs | **1** |
| M11c | one refusal sentence reworded in `join.rs`, self-consistently | join.rs | **1** |
| M12 | an absent sentence planted quoted in `join.rs` | join.rs | **1** |

Twelve of twelve died, and **each is aimed at the site its property
lives** — the classifier, the constant, the two halves of the row build,
the two carried fields, the sort, the refusal arm, and the Rust source
the cross-language pin reads. **KILL-SET CONTAINMENT, never the count:**
M4/M5/M7/M7b/M8/M9/M11 each kill exactly one body and they are seven
DIFFERENT bodies, so no two of those bodies contain each other and none
is a restatement. M1's five and M3's six are the wide ones, and they are
wide because those two mutants change an answer every state body reads.

**A DATA MUTANT WAS REQUIRED AND WAS RUN.** `the_rust_join_and_this_one_spell_one_rule`
is a derivation guard — its expectation is parsed out of `join.rs`'s
bytes — so a code-only drill would mis-grade it by construction (`T-221`).
M11, M11c and M12 mutate the DATA it reads, and all three red.

### The control, which is this verdict's load-bearing measurement

A mutant dying proves nothing unless the ARMING is what killed it. So M1
was re-run with the pin ABSENT — `app/test/dispatch-store.test.ts` moved
out of `test/**` collection, the mutant left in place:

    npm run build   exit 0
    npm test        exit 0    Test Files 50 passed (50)   Tests 1141 passed (1141)

**A wrong classification passes the ENTIRE app suite and both `tsc`
programs at exit 0 when no collected body drives the join, and reds five
bodies when one does.** That is T-110's defect reproduced deliberately on
this bench and then killed, and it is the whole of what the 2026-08-31
ruling made a precondition. The control is not a grader that fails
everything: with the pin restored and no mutant, the same suite is green
at 1161.

### Security sweep (mandatory)

- **No new input path crosses the boundary.** No command was added or
  changed; `acl_pin.rs` is a 0-file diff and the rust suite is green, so
  the `core:default` grant set is untouched.
- **ADR-009 obeyed, and probed rather than asserted.** `lanesByTask` is a
  `Map`, `claimed` a `Set`, the rows a `Map` via `hydrateJoin`. I ran a
  throwaway probe (since deleted; tree clean) driving `joinLanes` with
  task ids `__proto__` and `constructor` from a lane branch: both key
  correctly, `Object.prototype` is unpolluted, and `{}` gains no own
  property. `REFUSAL_SENTENCES` is a plain object, and legitimately so —
  its keys are the union's own discriminants, authored in a Rust enum
  here, not text read out of a file.
- **No new regular expression is applied to attacker-controllable text.**
  The three regexes added live in the TEST and are applied to `join.rs`'s
  own source at a fixed path.
- **No dependency added**, no secret or key in the diff, no markup built
  from a worktree-supplied string, and no unbounded growth — the scan's
  bound and its `truncated` flag are carried through rather than
  re-decided.
- **A pruned-but-not-removed lane** stays `live` with `existsOnDisk:
  false` on the row rather than folding into `died`; probed directly.

### Figures, each at its ref

| reading | base `fb222cd` | tip `dd19002` |
|---|---|---|
| `gate-run parser` | 372 GREEN | **372 GREEN** |
| `gate-run app` | 1146 GREEN | **1161 GREEN** |
| `gate-run rust` | 639 / 18 targets GREEN | **639 / 18 GREEN** |
| `gate-run e2e` (`NPUTER_E2E_PORT=25126`) | 626 GREEN | measured at my verdict commit |
| `npm run build` from `app/` | 0 | **0** |
| `boot:check` (`NPUTER_BOOT_PORT=26126`) | not owed | **0**, both `[nputer]` lines, no orphan |
| `index --check` | CURRENT, exit 0 | **STALE, exit 1** — expected; `edges +19 −1`, none crossing a component |
| `arch` summary | `components=15 files=201 … edges=45` | byte-identical |
| `arch cycles` | ACYCLIC | ACYCLIC |
| importers of `dispatch-store.ts` | 1 | 1 |

`docs-gate.mjs` on all four card paths: exit 1, FIRES, naming
`npm test from app/`, `npm test from tools/e2e/` and
`npx vitest run from lib/parser/`, and reporting that every live card's
frontmatter parses with a legal status. Those are the suites this verdict
commit itself owes, and they were re-run at MY tip rather than at the one
I was sent.

### Non-blocking observations — findings, never conditions of this verdict

1. **The cross-language pin's sentence third has a blind spot, and it is
   closed by the Rust suite rather than by the pin.** Rewording ONE
   refusal arm in `join.rs`'s `sentence()` while leaving `join.rs`'s own
   Rust expectation untouched (M11b) leaves the app suite **GREEN at exit
   0, 1161 passed** — because the old string survives as a quoted literal
   inside `join.rs`'s own test body, and the pin searches the whole file.
   That state is not reachable in a green tree: `cargo test` reds two
   bodies on it, and the self-consistent version (M11c) reds the pin. So
   the keeper holds against drift; what it does not hold alone is a file
   already at war with itself. Worth one sentence on `T-126-s8`.
2. **A prediction of mine was falsified, recorded because it was
   pre-committed.** Phase 1 named D6 as the obligation most likely to
   catch something, reasoning that a builder holding a ruling which calls
   this card *"the only thing between the app and a rendered dispatch
   block"* would reach for `App.tsx`. It did not. The lane measured the
   claim, found the record wrong, and routed `T-126-s9` instead.
3. `built_by:` is left empty and that is correct — `method/tasks/TASK-FORMAT.md`
   stamps `built_by` / `verified_by` / `review` **on done**, which is the
   integrator's moment for the first of them.
