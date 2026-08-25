---
id: T-110-s13
title: ADR-009's SHAPE is held by tsc and its KEY is held by nothing — the pin T-110-s3 should write is about the key, not the Map
status: suggested
suggested_by: verifier claude-opus-5 @T-110-verify3
---

**This subordinates itself to `T-110-s3`** (dispatch-store.ts ships with
no vitest pin, because the only collector that could run one is
`app-shell`'s — itself the fourth instance of `T-015-s1`). What is new
here is a MEASUREMENT that changes what that card's arm 3 should assert.
`T-110-s3` arm 3 says the pin should assert *"`rows` is a `Map`"*. Half
of that is already held by the compiler, and the half nobody has been
worrying about is the half that is open.

## Measured in T-110's third verification, in a detached drill worktree at `929e76a`

Four one-side-only PRODUCER mutants against
`app/src/lib/dispatch-store.ts`, each read back with `git diff -U1`
before its run and each restored to sha256 `7bef9138…`. Baseline in the
drill: `npm run build` exit 0, `npm test` 940/940 exit 0.

| mutant | what it does | `npm run build` | `npm test` |
|---|---|---|---|
| a deliberate type error (the CONTROL) | `readonly v3Probe: number = 1;` on `DispatchRow` | **exit 2**, `TS1246`, naming `src/lib/dispatch-store.ts` | 940/940 |
| plain object, **no** `any` | `const rows: Record<string, DispatchRow> = {}` | **exit 2**, `TS2740: Type 'Record<string, DispatchRow>' is missing … from type 'ReadonlyMap<string, DispatchRow>'` | — |
| plain object **via `any`** | `const rows: any = {}` | **exit 0** | **940/940** |
| **the `Map`, keyed by the WRONG field** | `rows.set(row.state, row)` | **exit 0** | **940/940** |

**THE CONTROL IS WHAT MAKES THE OTHER THREE READABLE**, and it is the
rung `docs/CONVENTIONS.md` requires: without it, "the build went red"
and "the build never looked at this file" are the same observation. It
went red, naming the file, so `tsc` demonstrably reads
`app/src/lib/dispatch-store.ts` even though **no file in the repository
imports it**.

## What that means, exactly

1. **ADR-009's SHAPE is genuinely pinned, and by the compiler rather
   than by a suite.** `DispatchJoin.rows` is typed
   `ReadonlyMap<string, DispatchRow>`, so swapping the `Map` for a plain
   object fails both `tsc` programs. Only an explicit `any` gets past
   it — and an `any` is a decision a reviewer can see in a diff, not a
   drift that arrives by accident. **This is more protection than
   "nothing", and no prior pass measured it**: T-110's second verdict
   records *"ADR-009 — MET, on both sides"* from reading the code.
2. **The KEY is pinned by NOTHING.** `rows.set(row.state, row)` builds a
   perfectly well-typed `ReadonlyMap<string, DispatchRow>` keyed by a
   dispatch state, and the whole app suite stays green at 940/940. Every
   consumer that will ever call `rows.get(taskId)` would miss, and the
   type system cannot tell — both `taskId` and `state` are assignable to
   `string`.

**SO THE BODY `T-110-s3` ARM 3 SHOULD WRITE IS NOT "rows is a `Map`".**
That is the arm the compiler already holds. It is:

    hydrateJoin(wire).rows.get("T-110") === <the row whose taskId is "T-110">

— one `get` by task id, which is the only assertion in this file that a
mutant can survive today. The two-lanes-on-one-id half of arm 3 lives on
the Rust side now (`two_lanes_carrying_one_task_id_both_survive`) and
needs no TypeScript copy.

## Two cheaper hardenings, if the fence stays unreachable

Neither needs a collector, so neither needs `app-shell`:

- **Brand the key.** A `type TaskId = string & { readonly __taskId: unique symbol }`
  on `DispatchRow.taskId` and on the `Map`'s key parameter makes
  `rows.set(row.state, row)` a compile error, closing the gap in the one
  place that is already inside `[app-dispatch]`. It costs one cast at the
  boundary where the wire is parsed.
- **Or accept it and say so.** The file already carries a paragraph
  explaining that a duplicate id is *"stated rather than guarded"*; a
  second sentence saying the key itself is unpinned until a collector can
  reach this file would at least stop the next reader concluding, as two
  verdicts did, that ADR-009 is fully held here.

## Why this is not a criterion failure and did not carry a rejection

T-110's criterion 3 says every collection keyed by a branch name,
worktree name or task id **SHALL BE a `Map` or a null-prototype object**.
It is one. The criterion does not say a pin shall drive it — criterion 4
says that, about the four states, and those are pinned in Rust. And a
vitest body for this file must live at `app/test/**` or widen
`app/vitest.config.ts`, both of which are C-05's `app-shell`: outside
`[app-dispatch]`, and `method/roles/executor.md` names widening a fence
from inside the lane as the one repair an executor may never make.

`app/src/lib/dispatch-store.ts`, fence `[app-dispatch]` for the branding
arm, `[app-dispatch, app-shell]` for the body — the same pair
`T-110-s3` already asks for, and it should be triaged WITH that card
rather than beside it.
