---
id: T-229-s11
title: Five more shape-EIGHT pins regex a whole Rust source file and take the FIRST match, so a decoy in a `//` comment satisfies each one — the class sweep T-229-s10 owed
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: executor claude-opus-5@subagent @T-229-s10, the class sweep at 21a74e6, 2026-09-09
blocked_by: []
touches: [app/test/crescendo-dom.test.tsx, app/test/dispatch-store.test.ts, app/test/crescendo.test.ts, app/test/agent-store.test.ts, app/test/startup-recovery.test.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

**Class parent: `T-229`**, and the SWEEP `T-229-s10` owed under
`docs/CONVENTIONS.md`'s *A FIX NAMES ITS CLASS AND ITS SWEEP*.
`T-229-s10` fixed the ONE `.exec(readFileSync(...))` instance in
`app/test/` — that narrow sweep is now zero, and it was shown capable of
finding a hit by running the identical grep at `900fbfa`, where it
returns the line the card fixed. **The WIDER shape is not zero.** Five
bodies still run a regex over the WHOLE text of a Rust source file and
take the FIRST match, with no uniqueness floor on the anchor — POISON
DRILL shape EIGHT, and Rust has `//` comments, so a decoy comment placed
ABOVE the real declaration satisfies each pin with its own subject
rewritten:

- `app/test/crescendo-dom.test.tsx:562` — the eighteen-command handler
  list, `/invoke_handler\(tauri::generate_handler!\[([\s\S]*?)\]\)/` over
  `src-tauri/src/lib.rs`. **This one is inside `T-229-s10`'s OWN fence**
  and was left alone deliberately: no criterion on that card reaches it,
  and widening a lane's diff past its criteria is the repair an executor
  may not make. A follow-up lane fenced on this one file is cheap.
- `app/test/dispatch-store.test.ts:565` — `IN_FLIGHT_STATUSES` over
  `join.rs`.
- `app/test/dispatch-store.test.ts:572` — `DISPATCH_STATES` over the same
  file.
- `app/test/crescendo.test.ts:736` — `COLD_START_GAPS_HEADING`.
- `app/test/agent-store.test.ts:578` — `probe_timeout: Duration::from_secs(N)`.
- `app/test/startup-recovery.test.ts:1177` — `cold_max < N`.

MEASURED at `21a74e6083edfae28d511db3b55ee8d6060bb09d` by
`git grep -n '\.exec(' <ref> -- 'app/test/*'`. Not one of them was
mutated, so this card claims the SHAPE and not a measured kill set: each
site needs its own drill before it is called a defect.

## Acceptance criteria

1. Each site above is either narrowed to an ANCHOR that is not the
   needle with the anchor's own uniqueness asserted, or shown by a drill
   to be unreachable by a comment decoy — a site cleared by argument
   rather than by a run is not cleared.
2. Every site that changes carries a positive control that RUNS: the
   comment decoy REDS the new body and is demonstrated GREEN against the
   body as it stands.
