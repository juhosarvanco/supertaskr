---
id: T-126-s2
title: The join is the half F-04 actually renders and it has no zero-argument shape — the board's stamps are parsed in TypeScript and a joining command would have to take them inbound
status: parked
suggested_by: executor claude-opus-5 @T-126
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
