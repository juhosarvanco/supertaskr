---
id: T-175-s1
title: The cold-start seam is built and proved and nothing reaches it — the two commands' registration, the IPC census and the completion panel's own DOM suite all live in app-shell, which T-175's fence does not carry
feature: F-03
milestone: 4
priority: 4
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-175
blocked_by: []
touches: [app-shell, app-agent, app-interview]
builder:
verifier:
built_by:
verified_by:
review:
---

**T-175's CRITERIA 1 AND 3 ORDER WORK OUTSIDE ITS OWN CARD'S `touches:`,
AND THIS IS THE HALF THE LANE COULD NOT BUILD.** The criteria read
*"WHEN the interview has banked its last stage THE app SHALL offer the
cold-start test as a named action"* and *"THE explain-back SHALL render
beside the board"*. A named action is a rendered affordance with a
working handler, and every remaining link in that handler's chain is
`app-shell`:

- the REGISTRATION of `genesis_cold_start` / `genesis_cold_start_status`
  is `app/src-tauri/src/lib.rs`'s `generate_handler!` list, and `lib.rs`
  is in `C-05-app.md`'s `paths:`;
- BOTH IPC census pins are in `app/test/crescendo-dom.test.tsx`, also
  C-05's — *"the frontend reaches exactly the fourteen commands it is
  allowed"* (a `toEqual` over the exact set, derived by scanning every
  `invoke<T>("name")` in the whole of `app/src/`) and *"Rust exposes
  exactly eighteen commands"* (a `toEqual` over `lib.rs`'s handler list);
- the DOM body that would prove the offer renders is in that same
  `crescendo-dom.test.tsx`, which is where `BoardCrescendo` is mounted.

T-175's `touches:` is `[app-agent, app-interview]`, which expands to
C-14 + C-13 and reaches none of those files — re-derived at `0a8dd58`
through `decide()` in `.claude/hooks/lane-fence.mjs`, not read off the
manifest. `method/tasks/TASK-FORMAT.md` rules this case in as many words
— *"A card whose criterion and whose fence disagree is a DEFECTIVE CARD,
not a hard call for the lane"* — and `roles/executor.md` rules the lane's
own move: record it, route it, build the rest. So this is routed rather
than built, and the fence was NOT widened from inside the lane.

**AND THE ONE-LINE WORKAROUND WAS AVAILABLE AND REFUSED, WHICH IS WORTH
RECORDING SO THE NEXT LANE DOES NOT REDISCOVER IT AS A GOOD IDEA.** The
frontend census scans for the literal `invoke<T>("name")`, so an invoke
through a `const` name — the spelling `pick_project_folder` and its two
siblings legitimately use, for the stated reason that they share one call
site with a variable — would have added the door without reddening
anything. That is dodging a census rather than passing one. The census
exists to enumerate the webview's IPC surface; a surface that hides from
it is exactly what it is for.

**IT IS THE SAME DISPOSITION `T-110` TOOK AND `T-126` DISCHARGED, AND
THAT `T-112` TOOK AND `T-112-s1` DISCHARGED**, and both said so on the
card. This is that suggestion's third instance.

## What is already built and proved, so this card adds no derivation

`app/src-tauri/src/agent/mod.rs` holds `cold_start(watch, agent)` and
`cold_start_status(agent)` — both ZERO-ARGUMENT at the boundary (the
project root is `WatchState`'s, and the docs subdirectory is derived
Rust-side from `COLD_START_CWD_REL`), so the registered commands stay
zero-path under ADR-012 and `acl_pin.rs` stays a 0-file diff at its
92-grant `core:default` set. The outcome types are already serde-tagged
camelCase in the shape every other genesis outcome uses
(`ColdStartOutcome`, `ColdStartReading`, `ColdStartPhase`).

`app/src-tauri/src/agent/adapter.rs` holds `CLAUDE_COLD_START_V1` and
`SPAWNABLE`; `app/src-tauri/src/agent/kit.rs` holds
`assemble_cold_start_prompt()`. Seven integration bodies in
`app/src-tauri/tests/agent_runner.rs` drive the seam end to end against
the fake CLI, including the restriction's own positive control.

`app/src/genesis/crescendo.ts` holds the pure half the pane needs —
`coldStartOffer(completion, cold)` and `splitColdStartAnswer(text)`, with
`ColdStartReading` mirroring the Rust wire type — pinned by eleven bodies
in `app/test/crescendo.test.ts`.

## What this card adds

- WHEN `lib.rs` registers the two commands THE census pins in
  `app/test/crescendo-dom.test.tsx` SHALL be corrected at BOTH ends,
  never widened — the Rust handler list and the frontend command list.
- WHEN the webview reaches them THE store's wrappers SHALL live in
  `app/src/lib/agent-store.ts` beside the other genesis invokes, using
  the same `startLike`/typed-outcome discipline, and the reading SHALL be
  polled rather than pushed (the cold-start turn deliberately emits on no
  event channel — `spawn_cold_start`'s doc comment says why).
- WHEN the completion state renders THE `BoardCrescendo` panel SHALL
  offer the cold-start test as a named action beside "Open the board",
  SHALL render the explain-back and its GAPS when one has been answered,
  and SHALL NOT gate completion on any of it.
- A DOM body in `crescendo-dom.test.tsx` SHALL prove the offer renders at
  completion, that the gaps are the actionable output, and that NO SCORE
  of any kind appears — the vocabulary sweep that file already applies to
  the dispatch fence is the shape.
- **THE SHARED CONSTANT SHALL STOP BEING TWO COPIES.**
  `COLD_START_GAPS_HEADING` exists in `kit.rs` (authoritative, the prompt
  is assembled from it) and again in `crescendo.ts` (the mirror). One
  pin comparing them, in the suite that can see both, is what this
  repository's own rule about two copies of one fact asks for.
