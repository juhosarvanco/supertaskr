---
id: T-153-s19
title: "`index --watch` re-indexes on every write into a directory the walk can never index — `is_interesting` keys on names and extensions, so a cargo target dir inside the worktree churns the watcher through a whole build"
feature: F-06
milestone: 4
size: S
priority: 9
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-153-s3, phase 2 attack A-14, 2026-09-09
blocked_by: []
touches: [app/src-tauri/crates/supertaskr-index/src/watch.rs]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`T-153-s3` taught `walk_root` to skip any directory carrying cargo's own
`CACHEDIR.TAG`, so a drill's `CARGO_TARGET_DIR` under a lane-derived stem
can no longer enter the graph. **The WATCHER was not taught the same
thing, and it is a different function.** `watch::watch` registers
`RecursiveMode::Recursive` over the whole canonical root and then triages
each event through `is_interesting` (`src/watch.rs:75`), which refuses on
exactly two NAMES — `.git` and `node_modules` — and otherwise accepts any
path whose extension maps to a `Lang`.

So a write to `<stem>-target/debug/build/pkg-1a2b3c/out/generated.ts` is
"interesting", the debounce window closes, and `index_once` runs a FULL
re-index whose walk then correctly excludes that file. The work is
real and its result is always the same graph.

**Derived, not recalled** — read at `a007884` in the verification bench:

- `src/watch.rs:165` — `.watch(&canon_root, RecursiveMode::Recursive)`
- `src/watch.rs:87` — `if name == ".git" || name == "node_modules"`
- `src/watch.rs:101` — any path whose extension has a `Lang` is
  interesting, whatever directory it sits in

## Why it is a suggestion and not a defect of that lane

**It predates the fix and is not in the class the fix closed.** A
directory literally named `target` triggers exactly the same churn today
and always has: `is_interesting` never carried a build-output rule of any
kind, by name or otherwise, so nothing about it was made worse by keying
the graph walk on the tag. `T-153-s3`'s criteria are about what enters
the GRAPH, and after that lane nothing from a tagged directory does.

The cost is a live seat's, not a gate's, and the convention is what
creates it: CONVENTIONS' POISON DRILL puts the `CARGO_TARGET_DIR` INSIDE
the drill worktree, so a seat running `index --watch` beside a `cargo
test` re-indexes the whole tree once per debounce window for the length
of the build, and every one of those indexes returns the same bytes.

## Arms

- **(a)** Teach `is_interesting` the same tag rule the walk now has, by
  calling `walk`'s predicate on the event's ancestor directories. Exact,
  and it costs a stat per event on the hot path.
- **(b)** Cheaper and coarser: cache the tagged directories found by the
  last walk and refuse events beneath them, refreshing the set on each
  index. No new I/O in the triage.
- **(c)** Decide the churn is acceptable and pin it as a known cost with
  a body, so the next reader does not re-derive this. The weakest arm,
  but it is a real answer and cheaper than either fix.

## Acceptance criteria

- THE watcher SHALL NOT re-index in response to a write beneath a
  directory carrying a conforming `CACHEDIR.TAG`, when arm (a) or (b) is
  taken — or, under arm (c), a body SHALL record that it does and why
  that was chosen.
- THE change SHALL carry a positive control: a write beneath a TAGGED
  directory is triaged out and an otherwise identical write beneath an
  untagged one still triggers an index, so the refusal is shown capable
  of failing (`A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL`,
  docs/CONVENTIONS.md).
- THE existing `.git`/`node_modules` refusals SHALL keep their own
  bodies: whatever lands here is an addition, and a lane that replaces
  two name rules with one tag rule has widened what the watcher
  re-indexes rather than narrowed it.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
