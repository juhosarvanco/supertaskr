---
id: T-112-s1
title: The brief assembler is built and proved and nothing registers it — the command's registration and the IPC census both live in app-shell, which T-112's fence does not carry
feature: F-04
milestone: 4
priority: 5
size: S
status: building
suggested_by: executor claude-opus-5@subagent @T-112
blocked_by: []
touches: [app-shell, app-dispatch, app-board]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**T-112's CRITERION 1 ORDERS WORK OUTSIDE ITS OWN CARD'S `touches:`,
AND THIS IS THE HALF THE LANE COULD NOT BUILD.** The criterion reads
*"THE app SHALL gain one command assembling the executor brief for one
card … **The IPC census moves and SHALL be corrected at both ends,
never widened**"*. Both ends are `app-shell`:

- the REGISTRATION is `app/src-tauri/src/lib.rs`'s `generate_handler!`
  list, and `lib.rs` is in `C-05-app.md`'s `paths:`;
- BOTH census pins are in `app/test/crescendo-dom.test.tsx`, also
  C-05's — `the frontend reaches exactly the thirteen commands it is
  allowed` and `Rust exposes exactly seventeen commands`.

T-112's `touches:` is `[app-dispatch, app-board]`, which expands to
C-15 + C-08/C-09/C-17/C-18 and reaches neither file.
`method/tasks/TASK-FORMAT.md` rules this case in as many words —
*"A card whose criterion and whose fence disagree is a DEFECTIVE CARD,
not a hard call for the lane"* — and `roles/executor.md` rules the
lane's own move: record it, route it, build the rest. So this is
routed rather than built, and the fence was NOT widened from inside the
lane.

**IT IS THE SAME DISPOSITION `T-110` TOOK AND `T-126` DISCHARGED**, one
card over, for the identical reason: `app/src-tauri/src/dispatch/mod.rs`
already carries the sentence *"registration lives in
`app/src-tauri/src/lib.rs`, which is C-05's `app-shell` — outside
T-110's `[app-dispatch]` fence"*, and `T-110-s1` carried that wiring
until T-126 landed it. This card is that suggestion's twin for the
brief.

## What is already built and proved, so this card adds no derivation

`app/src-tauri/src/dispatch/brief.rs` holds the whole assembler and its
pins (28 bodies under `cargo test`). `brief_for_card(project_root,
task_id, role)` is the command's shape already: one task id and one
role cross the boundary, both strings the board holds, and the project
root is the app's own — so the registered command stays a zero-path one
under ADR-012 and `acl_pin.rs` stays a 0-file diff, which is that
criterion's own second clause.

`app/src/lib/dispatch-store.ts` carries the mirrored wire types
(`BriefOutcomeWire` and friends), pinned against serde's output by
`the_wire_form_is_tagged_and_camel_cased_the_way_the_ts_mirror_expects`.
`app/src/components/board/Board.tsx` already threads `dispatch` and
`brief` into the drawer as optional props, and
`app/src/lib/task-detail.ts`'s `selectBriefPanel` renders them.

## Acceptance criteria

- THE app SHALL register the assembler as one `#[tauri::command]` in
  `app/src-tauri/src/lib.rs`, taking the narrowest argument surface that
  works — no path crosses the boundary in either direction (ADR-012).
- THE IPC census SHALL be corrected at BOTH ends in
  `app/test/crescendo-dom.test.tsx` and never widened; `acl_pin.rs`
  SHALL be a 0-file diff, and the grant count SHALL be re-derived at the
  lane's own ref rather than quoted from here.
- THE board root SHALL fill `Board.tsx`'s `dispatch` and `brief` props
  from the store, so the drawer's dispatch block reaches a real card.
- A pin SHALL cover `Board.tsx`'s prop threading, which no suite reaches
  today — `T-112-s4` carries the measurement and the reason.

## TRIAGE (2026-08-30, standing triage sitting #4) — PROMOTED F-04 p5, as filed

Fence, priority and criteria re-derived at `b60b06d` and nothing on the
card moved: `p5` is free in F-04 (the planned column holds p3, p4, p6,
p7, p8), and the two census pins the card names are live —
`command grep -n "thirteen commands\|seventeen commands" app/test/crescendo-dom.test.tsx`
answers at lines 503 and 550. `command grep -n "brief" app/src-tauri/src/lib.rs`
returns NOTHING at this ref, which is the card's whole subject: the
assembler is still unregistered and the drawer's brief block still
cannot render.

**DISPATCH IS BLOCKED ON @human's `T-140-s4` RULING, NOT ON THIS CARD.**
The graph sits at **410 bytes** of headroom at `b60b06d`
(`wc -c docs/architecture/graph.json` = 1,039,590 against the crate's
1,040,000 budget), and this card's fence reaches indexed source. The
sitting records the block rather than lowering the priority. **This remains the next code dispatch the moment the
limit is ruled** — T-112's verifier recommended it and nothing since has
displaced it.
