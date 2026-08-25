---
id: T-110-s3
title: dispatch-store.ts ships with no vitest pin, because the only collector that could run one is app-shell's — the fourth instance of T-015-s1
status: suggested
suggested_by: executor claude-opus-5 @T-110
---

**This is `T-015-s1`'s general form arriving a fourth time, and it
subordinates itself to that finding**, which the architect accepted in
full at `cd79f97` on 2026-08-25. T-015-s1 already says it: *"A slug whose
components claim no path any test collector reads is a fence in which no
card can be verified. Today that is true of `app-map`, `app-interview`
and `app-agent`'s TS half."* **Add `app-dispatch`'s TS half**, measured
the same way:

- `app/vitest.config.ts` collects `include: ["test/**/*.test.{ts,tsx}"]`
  and nothing else, so a TS pin must live at `app/test/<name>.test.ts`.
- `app/test/**` and `app/vitest.config.ts` are both in C-05's `paths:`,
  slug `app-shell`.
- C-15 claims `app/src-tauri/src/dispatch/**` and
  `app/src/lib/dispatch-store.ts`. Neither is collected by any test
  runner in this repository.

So T-110 shipped its store with **no vitest body driving it**, and said
so in the file rather than leaving the gap to be discovered.

**THE RUST HALF DOES NOT HAVE THIS PROBLEM AND THE DIFFERENCE IS WORTH
RECORDING**, because it points at the cheaper half of the general fix:
Rust unit tests live INSIDE the module they test, so
`#[cfg(test)] mod tests` in `app/src-tauri/src/dispatch/lanes.rs` is
inside `[app-dispatch]` by construction — and `app/src-tauri/tests/**`,
the integration entry point, is claimed by NO component at all (a row
T-015-s1's collector table does not have). A TS suite that lived beside
its module — `app/src/lib/*.test.ts`, collected by widening the vitest
`include` once — would give every pane and plumbing slug the same
property Rust already has, without re-claiming `app/test/**` file by
file. That is a THIRD arm beside T-015-s1's two, and it moves no
live-registry fixture on the day it lands, because a new test file under
`app/src/lib/` is claimed by whichever component's glob already covers
that directory.

## What the pins should assert, once a fence can carry them

The bodies T-110 would have written, listed so the work is not
re-derived:

1. **Each of the four states, driven by a fixture** — including a card
   at `building` with no lane (`died`), which is the shape nothing in the
   tree can currently see, and a lane whose task id is on no card
   (`stampSkipped` with `card: null`).
2. **`unavailable` is not `notDispatched`.** A scan that refused must
   NOT produce rows at all; a board that could not read the lanes must
   never render every card as "not dispatched". This is the join's own
   version of "an empty list may not mean two things".
3. **ADR-009**: `rows` is a `Map`, and two lanes carrying one task id
   (`task/T-110-a`, `task/T-110-b`) both survive the join rather than one
   overwriting the other.
4. **`existsOnDisk` is carried, never folded** into the state — a
   pruned-but-not-removed lane must stay distinguishable from a card
   whose lane was never registered.
5. **THE VOCABULARY EQUALITY NOTHING HOLDS TODAY.** `LaneScan`,
   `WorktreeEntry`, `EntryDefect` and `BranchRejection` exist twice — as
   serde-tagged Rust enums and as a TS union — and no test compares them.
   T-057's rule ("a rule with two implementations is two chances to
   disagree") applies exactly. The cheap form is a body that
   `serde_json::to_value`s one of each Rust variant and asserts the tag
   set against the TS one; the honest form is generating the TS from the
   Rust.

Fence: `[app-dispatch, app-shell]` for arms 1–4 as the tree stands
today; arm 5 needs `crate-index`-style thought about where a
cross-language pin lives, and should be dispatched with, not before, the
wiring in `T-110-s1`.
