---
id: T-082-s2
title: The ignore-attribute hit tally is true only under a pathspec nobody states
status: suggested
suggested_by: executor claude-opus-5 @T-082
---

STATE's security sweep says: *"Exactly **three** `#[ignore]` ATTRIBUTES
repo-wide, from an anchored `git grep` at the repo ROOT (11 raw hits for
`#[ignore`; the other 8 are prose)."* The dispatch brief for this card
repeated "11 grep hits, 8 are prose" as a figure to re-derive.

**Re-derived at `ddcc8bb`, from the repo root, the raw tally is 62, not
11** — 3 attributes and 59 prose. The 11 is correct only under a
`-- '*.rs'` pathspec, which neither STATE nor the brief states. Both
figures are true; they are answers to different questions, and the
sentence names only the working DIRECTORY.

This is a live trap rather than a pedantic one, because the two
qualifiers look alike and only one is written down. CONVENTIONS' rule —
*"Search from the repo ROOT — `git grep` run from a subdirectory silently
scopes itself to that subdirectory"* — is about `cwd`. A PATHSPEC is a
second, independent scope with the same effect on the number and no rule
covering it. A reader who follows the written instruction exactly (root,
no pathspec) gets 62 and concludes the sweep has drifted by 51.

**The tally has already drifted three times inside the repo's own
record**, which is the argument for not quoting it at all: T-069's notes
say *"The other 53 `#[ignore` hits are prose"* (56 total), STATE says 11
(8 prose), and this card measures 62 (59 prose). Every card that writes
about `#[ignore]` raises the count, so the number is a function of how
much has been written about it — which is exactly CONVENTIONS' own *CITE
THE SHAPE, NOT THE TALLY: a hit COUNT is a line number by another name.*

**The invariant is the ATTRIBUTE count and its three symbols**, and that
reproduces exactly at `ddcc8bb` from an anchored
`git grep -n -E '^\s*#\[ignore'` at the root:
`perf_cold_and_incremental_within_ceilings`
(`app/src-tauri/crates/nputer-index/tests/perf.rs`), `self_graph_is_current`
(`app/src-tauri/crates/nputer-index/tests/self_graph.rs`) and
`real_cli_smoke_records_the_stream_schema`
(`app/src-tauri/tests/agent_runner.rs`) — confirmed independently by
`cargo test` reporting `3 ignored`. The fix is to stop quoting the raw
tally, or to state its pathspec in the same breath.
