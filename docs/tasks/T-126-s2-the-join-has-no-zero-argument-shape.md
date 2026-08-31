---
id: T-126-s2
title: The join is the half F-04 actually renders and it has no zero-argument shape — the board's stamps are parsed in TypeScript and a joining command would have to take them inbound
feature: F-04
milestone: 4
priority: 3
size: M
status: planned
blocked_by: [T-190]
touches: [app-board, app-dispatch]
suggested_by: executor claude-opus-5 @T-126
builder:
review:
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
