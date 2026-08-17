---
id: T-014-s5
title: Watch mode re-indexes on any extensionless change, so a cargo build makes it spin
status: suggested
suggested_by: executor claude-opus-5 @T-014
---

`watch::is_interesting` triages a debounced batch by: contained under
the canonical root, not inside `.git`/`node_modules`, then an extension
the indexer collects or a resolution-affecting basename
(`tsconfig.json`, `package.json`, `.gitignore`, `.nputerignore`). A path
with **no extension at all** passes, deliberately: a directory rename or
delete arrives as the directory's own path and may have taken source
files with it, and a missed change is a wrong graph while an extra
re-index is only work.

The cost of that choice is real on this repo. `target/` and `dist/` are
gitignored, so the WALK ignores them, but the WATCH does not: a running
`cargo build` writes thousands of extensionless fingerprint and
artifact files under `app/src-tauri/target/`, every debounce window of
which triggers a full re-index. Each one is cheap (T-009 measured a
cold index of this repo at 15–40 ms on a release build) and none of
them writes anything — `write_graph`'s read-compare-skip sees identical
bytes — so the graph, the fs events and the app are all unaffected. It
is wasted CPU next to a compiler, which is where CPU is least free.

**The cheap close, and it is genuinely cheap**: the watcher already
holds the previous index's file list. A changed path is interesting if
it is IN that list (a real source file), or if it has a collected
extension (a possible new one), or is a resolution-affecting basename —
and an extensionless path only if some walked file lives beneath it.
That keeps the directory-delete case honest and drops `target/`
entirely. It needs the walked set threaded out of `index()` or
recomputed, which is the only reason it is not in T-014: the criterion
asks for correctness inside the debounce window, and this is a
performance refinement that would have needed a new public seam.

Worth ranking against the ordinary triage list rather than treating as
urgent: nobody runs `--watch` and `cargo build` in the same tree today,
because nothing outside this crate runs `--watch` at all yet. The day
that changes is the day it bites.
