---
id: T-110-s5
title: Two of the lane reader's three size bounds are pinned by bodies parametrised by the bound itself, so neither can red
status: parked
suggested_by: verifier claude-opus-5 @T-110-verify
---

Measured in the T-110 verification drill at `c2fc3c6`, detached worktree
`drill-T-110-verify`, baseline `cargo test --test dispatch_lanes` 16/16
exit 0. Two producer-side mutants **SURVIVE at 16/16, exit 0**:
`BRANCH_MAX_LEN` 255 → 256, and `MAX_METADATA_BYTES` 4_096 → 40_960.

The mechanism is the one `docs/CONVENTIONS.md` already names — *"A TEST
PARAMETRISED BY THE CONSTANT IT CHECKS CANNOT PIN THAT CONSTANT"*
(T-063, in the NEGATIVE ASSERTION bullet). In
`the_lane_grammar_names_what_failed_instead_of_returning_nothing` the
input is `format!("task/T-1-{}", "a".repeat(BRANCH_MAX_LEN))` and the
expectation is `TooLong { len: BRANCH_MAX_LEN + 9 }`; in
`every_entry_defect_is_named_rather_than_dropped` the fixture is
`vec![b'a'; MAX_METADATA_BYTES as usize + 1]` and the expectation is
`HeadTooLarge { len: MAX_METADATA_BYTES + 1 }`. Both sides move with the
constant, so the assertion agrees with itself at any value.

**These are the two bounds the module's own doc comment calls a safety
property rather than tidiness** — `MAX_METADATA_BYTES`' comment argues
it from the app being pointable at a stranger's repository. The third,
`TASK_ID_MAX_DIGITS`, IS pinned and reds under 6 → 7, and the only
difference is that its row hardcodes `"task/T-1234567-x"` and
`TooManyDigits { len: 7 }` rather than deriving them. The fix is to give
the other two rows the same treatment: one literal input and one literal
expected length each, beside the derived rows rather than instead of
them. `app/src-tauri/src/dispatch/lanes.rs`, fence `[app-dispatch]`.

Absorbs (eleventh triage, 2026-08-26): T-110-s6 T-110-s10 T-110-s11 — files removed in this
commit. Same defect seen from more than one side; this file is the
survivor because it carries the measurement or the general fix.

Amnesty triage 2026-08-29 (triage seat): PARKED — the needle is live and the diagnosis is exact — BRANCH_MAX_LEN 255->256 and MAX_METADATA_BYTES 4096->40960 both survive at 16/16 exit 0, because input and expectation move together. It is CONVENTIONS' own T-063 shape, and the fix is mechanical: one literal input and one literal expected length per row, beside the derived rows rather than instead of them, exactly as TASK_ID_MAX_DIGITS already does. RESURFACES: the next app-dispatch dispatch — T-112 is the F-04 card that next holds that slug, and the module is app/src-tauri/src/dispatch/lanes.rs, which it will be reading anyway.
