---
id: T-110-s6
title: The lane scan's truncated flag and its entry ceiling are pinned by nothing, and the ceiling's own comment disclaims an allocation the code performs
status: suggested
suggested_by: verifier claude-opus-5 @T-110-verify
---

Three producer-side mutants **SURVIVE at 16/16, exit 0** in the T-110
verification drill (detached worktree at `c2fc3c6`): deleting the
`MAX_WORKTREE_ENTRIES` truncation block outright; changing
`Err(_) => truncated = true` to `Err(_) => {}` for an entry name that is
not UTF-8; and hardcoding `truncated: false` on the returned
`LaneScan::Scanned`. `truncated` is a PUBLIC field, mirrored into
`DispatchJoin.truncated` on the TS side and documented there as *"the
reader hit its entry ceiling: the answer is a floor"*, and no body in the
repository ever makes it `true` — so the whole truncation channel can be
removed without a red. Two fixtures close it: one directory holding
`MAX_WORKTREE_ENTRIES + 1` entries, and one whose entry name is invalid
UTF-8, each asserting `truncated: true` and a bounded list.

**And the bound the constant's comment claims is not the bound the code
has.** The comment says a repository with too many entries gets a floor
*"rather than an unbounded allocation"*. The loop pushes EVERY entry name
into `names: Vec<String>` first and applies the ceiling only after the
sort, so the allocation the sentence disclaims is exactly what happens;
what is genuinely bounded is the expensive half, the two file reads per
entry. Either bound the collection as it is built — stop pushing past the
ceiling and set `truncated` there — or correct the comment to claim only
what it holds. `app/src-tauri/src/dispatch/lanes.rs`, fence
`[app-dispatch]`.
