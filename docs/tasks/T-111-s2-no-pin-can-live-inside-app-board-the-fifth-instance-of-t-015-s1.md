---
id: T-111-s2
title: No pin can live inside [app-board] — T-111 is unbuildable in its fence, measured with a positive control, and it is T-015-s1's fifth instance
status: suggested
suggested_by: executor claude-opus-5 @T-111
---

**T-111 CANNOT BE BUILT INSIDE `[app-board]`, AND THIS IS MEASURED RATHER
THAN REASONED.** The card demands pins for four disagreement states, a
normalisation function ("in **one function with its own pin**"), a ceiling
constant ("**with its own assertion**") and a dangling-blocker case. Every
one of them is a TypeScript derivation landing under `app/src/**`. The
app's only test collector cannot see `app/src/**`.

## The fence, derived from the component files rather than from prose

`[app-board]` is C-08 ∪ C-09 ∪ C-11 — read from each component file's own
`touch_slugs:` at `e04f5b3`, the authority ARCHITECTURE names:

    app/src/components/board/{Board,FeatureColumn,GhostCard,ParkedRow,
                              SliceLine,TaskCard,TaskDetailPanel}.tsx
    app/src/components/board/badges/**
    app/src/components/board/panel-dismissal.ts
    app/src/lib/board-model.ts
    app/src/lib/task-detail.ts
    app/src/styles/**
    app/src/assets/**

Thirteen globs. Not one of them is a test collector, and not one of them
is read by one.

## The measurement, with the positive control the negative claim needs

A body asserting `expect("collected").toBe("not collected")` was written
to `app/src/components/board/badges/t111-collector-probe.test.ts` — inside
the fence, under C-08's own `badges/**` glob — and run two ways, in the
lane worktree at `e04f5b3`. The file was untracked throughout and removed
afterwards; `git status --short` is empty and the suite re-runs at
958/958.

| arm | collector | the same file | result |
|---|---|---|---|
| **A** | the SHIPPED `app/vitest.config.ts`, unchanged | present on disk | **exit 0 — 46 files / 958 tests, unchanged from baseline** |
| **B** | a throwaway config OUTSIDE the repository whose `include` names that exact path | byte-identical | **exit 1 — 1 failed / 1**, `AssertionError: expected 'collected' to be 'not collected'` |

**ARM B IS WHAT MAKES ARM A MEAN ANYTHING.** Without it, arm A's green is
equally explained by an inert body. With it, arm A measures PLACEMENT: the
shipped collector does not see paths under `app/src/**`.

**A FALSE POSITIVE CONTROL WAS CAUGHT ON THE WAY, and it is worth
recording**: arm B's first run also exited 1, but on
`Error: Cannot find module 'vitest/config'` — a STARTUP error from a
config file sitting in a directory with no `node_modules`, not the
assertion. An exit code alone could not tell the two apart. The config was
rewritten to export a plain object with no import, and the second run
carried the assertion text. **An exit read without its count or its
message is not a measurement**, which is this project's standing rule
arriving in the drill rather than in a suite.

The third, independent line: the config text itself reads
`include: ["test/**/*.test.{ts,tsx}"]`, and **both `app/vitest.config.ts`
and `app/test/**` are in C-05's `paths:` — slug `app-shell`**, held right
now by live lane T-033.

## This is T-015-s1's general form, arriving a fifth time

`T-015-s1` states it: *"A slug whose components claim no path any test
collector reads is a fence in which no card can be verified."* The
architect accepted it in full at `cd79f97`, and the T-015 card carries the
ruling that follows from it — *"The lane below built nothing and was RIGHT
to … **The dispatch defect was the ARCHITECT'S**, not the lane's …
Re-dispatch only when `app-shell` is free."* T-015's `touches:` was
corrected in place from `[app-map]` to `[app-map, app-shell]`.

The tally, at `e04f5b3`: `app-map` (T-015), `app-interview`, `app-agent`'s
TS half, `app-dispatch`'s TS half (`T-110-s3`), and now **`app-board`**.
That is five of the eight slugs in the vocabulary. The three that escape
are `lib-parser` (its own collector), `crate-index` (Rust), and
`app-shell` (which owns the collector).

**THE ASYMMETRY IS THE MECHANISM AND IT IS WORTH NAMING PLAINLY.** A Rust
card never has this problem twice over: `#[cfg(test)] mod tests` lives
inside the module it tests, and `app/src-tauri/tests/**` is claimed by NO
component, so an integration entry point is always reachable. **There is
no TypeScript counterpart**, because C-05 claims `app/test/**`
explicitly. A Rust card can pin from any fence; a TypeScript card can pin
only if it holds `app-shell`. T-110 walked exactly this asymmetry — its
first pass shipped an unpinned TS join and was REJECTED for it, and its
rebuild's whole content was relocating that join into Rust where a pin
could reach it. **T-111 has no such relocation available**: every path in
`[app-board]` is `app/src/**`.

## The fence T-111 needs

**`[app-board, app-shell]`** — the same correction T-015 received, for the
same reason. It buys `app/test/**` for the pins and `app/vitest.config.ts`
if the collector is widened. `app-shell` is held by T-033 today, so the
card is **re-dispatchable when T-033 lands** and not before.

Two things the architect should decide with it, because they change the
shape of the re-cut card rather than only its fence:

1. **Does `[app-board, app-shell]` re-introduce `T-111-s1`?** It does not
   remove it — it makes it moot for this pair by holding both slugs. The
   C-11 double-claim still stands for every future pair.
2. **Widen the collector once, or claim `app/test/**` file by file?**
   `T-110-s3` already argues the third arm: add `src/**/*.test.{ts,tsx}`
   to `app/vitest.config.ts`'s `include` so a suite can live beside its
   module, which gives every pane and plumbing slug the property Rust
   already has and retires this finding for the whole vocabulary rather
   than for one card. It is a one-line change inside `app-shell`. **It
   would want its own thought about which component claims a co-located
   test file** — C-08's `paths:` names FILES, not a directory glob, so
   `app/src/lib/board-model.test.ts` would land unmapped (the
   `T-110-s9`-shaped question, one size smaller).

## What the pins should assert, so the work is not re-derived

Listed in the card's own order, with the fixture each needs:

1. **Six dispositions, one per card**, each carrying its reason:
   `dispatchable`, `blocked` (naming unmet blocker ids), `fenced` (naming
   the overlapping token AND the lane), `not-topmost` (naming the card
   above it), `at-ceiling`, `not-applicable`.
2. **The four join states, from a fixture in which NO card carries
   `building`** — the card names this explicitly, so the lane set alone
   must produce `fenced`. Note that `app/src-tauri/src/dispatch/join.rs`
   already holds `live`/`died`/`stampSkipped`/`notDispatched` with a pin
   under each (T-110's rebuild): **the re-cut card should CONSUME that
   vocabulary, not spell a second one.** Two implementations of one rule
   is what T-110 exists to remove one layer up.
3. **Normalisation, one function, its own pin, driven from the live
   board's own tokens** — see `T-111-s3` for the two collisions that
   exist at `e04f5b3` and the two that a trailing-slash rule does not
   reach.
4. **The reason as TEXT**, with a NEGATIVE CONTROL: a derivation that
   returns one reason for everything satisfies "the reason names the
   token" as readily as a correct one. Each state's pin needs a sibling
   showing a different input yielding a different sentence.
5. **The ceiling constant, asserted against `orchestrator.md`'s 3–5** —
   and NOT parametrised by itself (CONVENTIONS' rule, and the shape that
   let `BRANCH_MAX_LEN` and `MAX_METADATA_BYTES` survive T-110's first
   drill). Hardcode the bound in the body.
6. **The dangling blocker.** Measured at `e04f5b3`: **31 cards carry a
   `blocked_by`, and ZERO of them name an id that is not on the board**,
   so this case CANNOT be driven from the live board and needs a
   synthetic fixture. The data path is already there and owes no
   plumbing — `parseProjectFromFiles` pushes `validateProject`'s issues
   into `result.issues`, so `selectBoard(model)` already receives
   `dangling-reference` with its `nearMiss` hint, and `board-model.ts`
   already consumes `ParseIssue[]` through `issuesByFile`.
7. **`done`/`parked` carry no reason at all** — with the positive control
   that a card which SHOULD carry one does.

Absorbs (eleventh triage, 2026-08-26): T-110-s3 T-110-s13 — files removed in this
commit. Same defect seen from more than one side; this file is the
survivor because it carries the measurement or the general fix.
