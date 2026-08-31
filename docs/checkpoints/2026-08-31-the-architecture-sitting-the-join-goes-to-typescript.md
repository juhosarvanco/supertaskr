# Checkpoint: the architecture sitting — the join goes to TypeScript behind a test path, and the sitting nearly booked it on a grep that matched prose

Date: 2026-08-31. Seat: architect/integrator. Scope: the ruling
`T-126-s2` has been parked on since the eleventh triage; the forced order
it imposes on three cards; four cards filed from what the measurement
walked into on the way.

## The question, and why it was ripe

`T-126-s2` records that `join_lanes` is compiled, webview-unreachable,
and has **no zero-argument shape** — its second argument is the board's
stamps and the board is parsed in TypeScript. The eleventh triage parked
it with an explicit un-park condition: *"a consumer needs to render the
four lane states."* `T-112-s1` registered `dispatch_brief` and wired
`dispatch-store.ts` to it. **The condition fired**, and the card's own
text said what it wanted: a ruling before a fence.

## THE RULING, AND THE ARGUMENT IS AN ASYMMETRY RATHER THAN A PREFERENCE

Three shapes, and they are not refused on comparable grounds:

- **Shape 1, stamps inbound — dead on ADR-012.** A `Vec<BoardStamp>`
  argument is caller input crossing the boundary, and narrowness is
  supposed to live in the command's own signature.
- **Shape 2, parse the board in Rust — dead on T-057**, with
  `T-033-s11`'s measured harm behind it: two engines already disagree
  about one registry for `non_code`.
- **Shape 3, join in TypeScript — refused by `T-110` on MEASUREMENT**:
  four one-side-only producer mutants survived `npm run build` and
  `npm test` at exit 0, because `app/vitest.config.ts` collects `test/**`
  only and nothing imports `dispatch-store.ts`.

**Shapes 1 and 2 are refused by architectural properties. Shape 3 is
refused by test reachability — and a lane can fix that.** An objection
with a remedy standing beside two objections without one is not a
three-way choice; it is one option and a price.

**So the join goes to TypeScript, after and only after the dispatch view
model has a test path.** In the other order it reproduces `T-110`
exactly, and this project has already paid for that lesson once.

## The order is forced, and this re-ranked the board

- **`T-112-s4` blocks `T-126-s2`.** C-18 declares no test path, so
  `[app-board]` cannot add one without editing the registry, and that
  card already measured `Board.tsx`'s prop threading as deletable with
  the whole app run green. `blocked_by` now says so.
- **`T-112-s5` follows the join**, and its own shape 3 needs the
  C-09 → C-15 edge declared — a registry edit in the same file
  `T-112-s4` opens. **Two cards want one file opened once.**
- `T-112-s4` moved **priority 25 → 2** and was dispatched on that basis.

## THE SITTING NEARLY GOT THIS WRONG, AND THE WAY IT NEARLY WENT WRONG IS THE LESSON

It opened by testing whether `T-110`'s refutation had **healed** — a fair
question, since `T-112-s1` had just added test bodies in that area.
`grep -l dispatch-store app/test/` returned two files, which looked like
exactly that.

**Both were false positives.** One match is a comment; the other is a
path string literal inside a registry census. **A census satisfied by a
MENTION rather than by a USE** — the fifth instance of that family in
this repository, and this time it very nearly booked an architecture
decision on prose.

The check that settled it was grepping for `import` / `require` /
`import(` rather than for the module's name. The refutation **holds, and
is worse than `T-110` recorded**: nothing imports `dispatch-store.ts` by
any spelling, and its exported `hydrateJoin` is referenced exactly once
outside its own file — in a doc comment.

## Four cards filed, three of them found on the way rather than looked for

- **`T-185`** — `DispatchReading` in `board-model.ts` drops `notLanes`
  and `truncated`, **the two fields whose own doc comments forbid
  dropping them** (*"reported, never dropped"*; *"the answer is a
  floor"*). Both are produced by `hydrateJoin` and read by **nothing** —
  three occurrences in all of `app/src`, all inside one file.
  `board-model.ts` does not import `dispatch-store.ts`, so nothing can
  notice them diverging. The consequence is user-visible: **the board
  cannot say its lane list is a floor**, while `App.tsx:660` already
  renders exactly that note for the docs tree. And the drift is currently
  hidden by a false comment claiming the two types are one shape.
- **`T-186`** — the `crate-index` walk, routed by `T-140-s9` and
  **re-measured here before filing rather than transcribed**: the same
  four shadowed checks, the same false *"belt-and-suspenders"* comment,
  and one symlink body whose links point OUTSIDE, so containment alone
  produces its green. The card explicitly forbids assuming
  `T-140-s9`'s undetectable-by-construction verdict, because this crate
  filters on extension and language where `docs_watch` did not.
- **`T-187`** — **met while dispatching, not read.** A lane based on the
  newest `Checkpoint:` commit reads a **stale copy of its own card**;
  this seat amended `T-112-s4` and dispatched it two commits later, and
  the derived base predated the amendment. Caught only because this seat
  remembered writing it — the memory-held catch `T-167-s8`'s evidence
  says decays. The base rule is right for the TREE and wrong for the
  CARD, and the two coincide by accident.
- **`T-188`** — `T-088`'s ruling that an empty registry glob is *"INTENT,
  never a defect"* is correct and is kept, but it answers one of two
  cases. A glob that **once matched and no longer does** is a false claim,
  presents identically as zero files, and this repository measured one
  surviving **nine merges** before @human's eye caught it at a triage.
  The two are mechanically separable — a stale glob *used to match* — so
  the check is not "is this empty" but "was this ever non-empty".

## What this sitting did NOT do, deliberately

**It did not write an ADR.** `docs/decisions` and `docs/rooms` were held
by a live `T-162-s1` lane, so the ruling went onto the cards and into
this record instead. **The fence discipline binds the seat that wrote
it**, and an architect stepping over a live lane's fence to record an
architecture decision would be the most expensive possible way to learn
that. An ADR is owed once that lane lands.

**It did not re-litigate `T-088`.** `CLAUDE.md` says to check
`docs/CAPABILITIES.md` and the existing record before concluding
something is missing; a suspected empty-glob gap turned out to be half
ruled already, and the card filed is the unruled half only. `T-138` is
the standing reminder of what skipping that costs — a working day.

## Board

Triage sitting #6 folded `T-183` into `T-184` (same file, same fence,
and their design questions compose — one decision settles both halves)
and promoted `T-182`. **Five lanes dispatched and live**, fences proved
pairwise disjoint at dispatch: `T-184` (app-agent), `T-167-s8`
(.claude + tools/e2e), `T-182` (docs/CONVENTIONS.md), `T-162-s1`
(docs/decisions + docs/rooms), `T-112-s4` (app-board + registry).

**CI run 33345525234 on `bd8a8e8` — the eleven-lane tip — completed
green**, with both of the night's known intermittents (`T-161`'s stderr
drain, `T-178`'s fixture teardown) now carrying their fixes.

## THE SEAT BROKE ITS OWN INSTRUMENT FOUR TIMES AND THE POSITIVE CONTROL IS WHAT FOUND IT

Every gate reading in this sitting was taken as
`npm run --silent <gate> 2>&1 | tail -n; echo "exit=$?"`, **from the
repository root.** Both halves are wrong and they hid each other:

- **There is no `package.json` at the repository root.** The gate scripts
  live in `tools/e2e/`. Every root invocation exited **254**.
- **`$?` after a pipe is the PIPE's status**, which is `tail`'s. So 254
  became `exit=0`, and `--silent` swallowed the message that would have
  said so.

**Four consecutive "lint exit=0" readings were vacuous** — and three card
commits were made on their strength. Re-run from `tools/e2e/` with the
status captured before the pipe, the gates do pass, so nothing shipped
broken. **That is luck, not evidence, and the distinction is the point.**

Proved rather than asserted, with a control both ways:

    ( false | tail -1 );               echo $?   # -> 0   the mask
    ( set -o pipefail; false | tail -1 ); echo $?   # -> 1   without it

This is `T-142`'s finding — *"zero is indistinguishable from a clean
result"* — arriving at this seat's own hands, on the same night it filed
`T-188` for the same shape in the registry. Written into `docs/STATE.md`'s
standing hazards: **redirect, capture `$?`, then look.**

## Gates

- **DOCS GATE — exit 0**, real status captured without a pipe: budgets
  hold, 4 gated, 0 awaiting; every live card's frontmatter parses with a
  legal status
- `lint:tokens` — **exit 0** (TOKEN 161 files, CONTROL 1,021 tracked)
- `capabilities:check` — **exit 0, CURRENT (27,333 bytes)**
- **HEALTH — 7 inside, 0 drifting, 0 BREACHED**, 3 unread, 4 UNKEPT.
  **The band caught this record's own writing**: the new hazard drifted
  `docs/STATE.md` to 6.10 % of its warn line, and the fix was the one
  this file's contract already names — point at the records rather than
  transcribe them. 7,615 bytes, inside.
- **GRAPH REGEN — not owed, and DERIVED rather than skipped**:
  `Lang::for_extension` (`crates/nputer-index/src/graph.rs:94`) accepts
  `ts|tsx|mts|cts`, `js|jsx`, `rs` only, so `.md` returns `None` and the
  walk cannot see a docs-only change. Read rather than run, deliberately:
  five lanes were building, and `T-088-s4`'s cache cliff is a standing
  hazard.
- **BOOT GATE / METHOD EVAL — not owed**: no `app/**` or `method/**` path
  in this checkpoint's diff.

## Owed after this record

- ~~An **ADR for this ruling**, once `T-162-s1` releases `docs/decisions`.~~
  **CORRECTED, same sitting.** `docs/decisions` was released when
  `T-162-s1` merged, and this seat went to write the ADR and stopped:
  **every ADR in this repository that names a decider names @human**, and
  every one carries `Status: ratified`. There is no "proposed" status to
  file under and inventing one would be a governing-document change made
  to fit an errand.
  **So this is not owed from this seat — it is @human's to ratify or
  overrule**, and the ruling meanwhile stands where an architect's ruling
  belongs: on `T-126-s2`, cross-referenced from `T-112-s4` and
  `T-112-s5`, and in this record. The ruling APPLIES ADR-012 and `T-057`
  to one seam; it does not amend either, which is why it was within this
  seat's authority to make and is not within it to enshrine.
- **@human, untouched all night as asked**: the FORM question (reopened),
  the steering split, the three permission questions, and thirty seconds
  on the interview's new ending at a narrow width.
