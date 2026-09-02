---
id: T-236-s1
title: The Rust brief's row 4 reads the integration branch as the FIRST backticked name in the LANE PROTOCOL bullet, and at every ref since T-089 that name has been `method/lane-protocol.md`, not `main`
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: executor claude-fable-5-1@subagent @T-236
blocked_by: []
touches: [app/src-tauri/src/dispatch/brief.rs]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND WHILE PINNING, NOT WHILE CUTTING — the T-236 compaction did not
move it and could not have fixed it.** `row_lane` in
app/src-tauri/src/dispatch/brief.rs derives this project's lane
spellings from docs/CONVENTIONS.md: `bullet_containing(&conventions,
"integration branch \`")` selects the whole column-zero THE LANE
PROTOCOL bullet (`top_level_bullets` folds every whitespace-led
continuation line and every `  - ` sub-bullet into it), and then takes
`backticked(&spellings).into_iter().next()` as the integration branch.
The first backticked name in that bullet is the opener's
`method/lane-protocol.md`, not the sub-bullet's `main`. Measured
mechanically on 2026-09-02 by replicating the splitter in node against
the document at T-236's base `3170247` and at its tip `d01b24f`: both
answer `"method/lane-protocol.md"` (the `task/`, `../` and `git
worktree add` picks are correct at both, because they search by
prefix rather than position). The value feeds `find_base`'s
`git log --first-parent --format='%H %s' {integration} | grep -m1 …`
line, so the command the Rust brief prints for the dispatcher names a
file path where a ref belongs. No cargo body asserts the integration
branch — the fixture test at brief.rs asserts only that the create
line contains `git worktree add` and the task id — which is why it
has stayed green; the JS assembler (`laneSpellings` in
tools/e2e/scripts/dispatch-brief.mjs) reads the same bullet by LABEL
with a lookbehind guard and gets `main`, so the two implementations of
one rule disagree, which is T-057's class. The fix is in C-15's fence:
read the integration branch by its label (`integration branch \``)
the way the JS side does, and add the positive control the JS side
already has — a body that asserts `main` from the live document and
reds when the label moves.
