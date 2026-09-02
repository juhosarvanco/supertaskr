---
id: T-236-s5
title: Row 4's other three lane spellings are read by SHAPE and its checkpoint marker DEFAULTS — the parity T-236-s1 bought for the integration branch, applied to the rest of the row
feature: F-06
milestone: 4
priority: 4
size: S
status: suggested
blocked_by: []
touches: [app/src-tauri/src/dispatch/brief.rs]
suggested_by: executor claude-opus-5@subagent @T-236-s1
builder:
verifier:
built_by:
verified_by:
review: independent
---

**CLASS PARENT: T-236-s1**, whose fix this is the residual of. **DISPOSITION
HINT: promote and fold into the next lane that opens `row_lane`** — it is
one function, the reading is already written beside it, and the card that
established the rule is the natural precedent to cite.

**FOUND WHILE BUILDING T-236-s1, NOT FIXED THERE.** That card's fix
sentence names the integration branch and nothing else, and its own body
rules the other three picks *"correct at both"* refs — so this is a scope
call rather than a fence one: the path is inside T-236-s1's fence, and
widening the change would have been a different card built under this
one's ceremony.

## Two properties, one function

`row_lane` in `app/src-tauri/src/dispatch/brief.rs` now reads the
integration branch by its LABEL, with the same refusal `laneSpellings` in
`tools/e2e/scripts/dispatch-brief.mjs` carries. The rest of the row does
not.

- **THE OTHER THREE ARE READ BY SHAPE.** `branch` is whichever backticked
  run `starts_with("task/")`, `worktree` whichever `contains("../")`, and
  `create` whichever `starts_with("git worktree add")`. A shape filter is
  not positional and survives a reordering — which is exactly why it read
  correctly through the defect T-236-s1 fixed — but it answers with the
  FIRST run that happens to match, so a bullet that grows a second
  `task/`-prefixed or `../`-carrying name answers with whichever comes
  first and says nothing. The JS reader keys all three on the words
  BEFORE the backtick (`branch`, `worktree`, `Created with`) and throws
  when the label does not introduce exactly one name.
- **AND THE CHECKPOINT MARKER DEFAULTS.** The marker spent in the
  `find_base` command is taken from the DISPATCH bullet by a shape test
  (ends with a colon, opens upper-case) and ends in
  `.unwrap_or_else(|| "Checkpoint:".to_string())`. That is the failure
  T-236-s1's own commit message describes one line up: a defaulted
  spelling is SILENT, because the printed pipeline ends in `cut`, so the
  dispatcher gets a plausible command built from this module's memory
  rather than from the document. The remedy is the one already in the
  file — refuse, naming the row and the source, the way the label read
  now does.

## Why it is a suggestion rather than a criterion

T-236-s1's card states the other picks are correct at its base and at its
tip, and it is right: this is a latent divergence rather than a live
defect, so nothing is printed wrongly today. What it costs is the
guarantee — T-057's class is two implementations of one rule, and half a
parity is still two rules.
