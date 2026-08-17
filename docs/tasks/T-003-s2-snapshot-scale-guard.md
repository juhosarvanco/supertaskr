---
id: T-003-s2
title: Full-tree snapshot cost scales with total docs bytes; cap overflow is silent
status: parked
suggested_by: verifier claude-fable-5 @T-003-verify
---

T-003's watcher ships the ENTIRE docs tree on every change (deliberate:
race-free convergence). Verifier measurements on the ≤1s criterion
(macOS, debug binary, write → model-committed):

- file count is a non-issue: 36 files 283ms · 500 files 344ms ·
  1200 files 384ms · 2000 files (the MAX_FILES cap) 442ms;
- total bytes is the real axis: ~19MB of .md under docs/ → 845ms,
  ~29MB → 1062–1085ms — the 1s criterion breaks at roughly 25MB of
  markdown, while the caps admit up to 2000 × 1MiB ≈ 2GB in theory.

Every change also clones the whole tree twice more in Rust (byte
equality baseline + snapshot) and re-parses every task file in the
webview. Fine at nputer scale (~0.25MB today, 100× headroom), but the
knee exists and is silent when hit.

Related silent edge: past MAX_FILES (2000) the collector just stops
collecting mid-traversal, so WHICH files drop is traversal-order
dependent and nothing tells the frontend the snapshot is partial.

Suggest, in ascending order of effort: (1) include `truncated: bool`
(and skipped counts) in the snapshot payload so the frontend can badge
a partial tree; (2) skip content-shipping for non-model files above a
size threshold (the model only needs docs/tasks/* + ROADMAP; big
design docs are dead payload today); (3) if a real project ever nears
the knee, move to per-file mtime/hash caching or incremental
collection. Numbers and probe scripts reproducible per the T-003
verdict entry.

Triage 2026-08-15 (architect): PARKED — the truncated-flag/reporting half is absorbed by T-018; the scale work (content-skipping, incremental collection) waits for a real project near the ~25MB knee (100x headroom today).

Re-affirmed at triage 2026-08-17 (third pass): unchanged. docs/ is
still ~0.25MB against a ~25MB knee and no real project has come near
it. Worth noting the one thing that COULD move it — T-027 shipped the
interview, so a genesis project's docs/ is now written by a planner
rather than by hand — but a generated ROADMAP and task set is
kilobytes, not megabytes, and the knee is measured in tens of MB.
Unpark on a real project near the knee, not on a hypothesis about
one.
