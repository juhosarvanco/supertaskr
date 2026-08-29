---
id: T-153
title: The first CI run met inotify and recv_emit's one-write-one-emit assumption died on schedule — plus a zero-file snapshot no macOS run ever produced
feature: F-02
milestone: 4
priority: 40
size: S
status: building
blocked_by: []
touches: [app-shell]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

Filed 2026-08-29 from the repository's FIRST CI run (`33246335429`,
the activation push at `0423482`), at @human's direction. The
workflow's own header has said since T-020 that the first run to watch
is "the three T-018 sentinel live tests inside `cargo test` — ubuntu's
inotify [is] the first backend where replaced-wholesale /
deleted-recreated handles can actually die." This is that prediction
landing, one test over: not a dead handle but a coalescing assumption.

## What the run measured

`docs_watch::tests::a_file_crossing_the_size_line_emits_with_a_skip_not_a_silent_deletion`
FAILED at `src/docs_watch.rs:2494`
(`assertion failed: back.files.iter().any(|f| f.content == "b is back")`),
197/198 in its binary, exit 101 — green on every macOS run this
repository has ever made. The emit the assertion actually received,
from the runner's own log:

    [nputer] docs-changed: seq=4 files=0 skipped=0 truncated=false fs_events=3

## The two findings, separated because they want different fixes

1. **THE TEST'S SHAPE**: `recv_emit` (docs_watch.rs:1688) returns THE
   NEXT emit within 10s — no draining, no predicate. Every T-018 live
   body therefore assumes ONE write produces ONE emit, which is an
   FSEvents-coalescing accident, not a property the watcher promises:
   inotify delivers a 1 MiB write as multiple MODIFY events, a
   debounce window can split them, and an extra emit lands between the
   oversize emit and the shrink emit — so the second `recv_emit`
   consumes the wrong snapshot. The fix shape: recv until an emit
   satisfies the predicate (or quiescence), bounded by the existing
   timeout — asserting the CONVERGED state, which is what the test's
   sentence actually claims. Sweep the sibling live bodies for the
   same assumption while in the file.
2. **THE ZERO-FILE EMIT**: seq=4 reports `files=0 skipped=0` while
   `docs/a.md` and `docs/b.md` both exist on disk. If emits are full
   snapshots, a zero-file snapshot with two files present is a
   MID-WRITE COLLECTION artifact this backend can surface — and if one
   ever reaches the app, the board renders BLANK until the next
   change. Finding 1's fix makes the test tolerate this; it does not
   answer whether the app should. That question is this card's second
   criterion, and "the collector raced a non-atomic test write that
   production paths never produce" is an acceptable answer IF derived,
   not assumed — the T-070-s3 shape.

## Acceptance criteria

- WHEN a T-018 live body awaits a state change THE test SHALL accept
  it across however many emits the backend delivers, asserting the
  converged snapshot rather than the next one.
- IF a debounce window can collect a zero-file snapshot while files
  exist on disk THEN the card SHALL say why that cannot reach the app
  blank, or route what it finds.
- WHEN the fix lands THE first green CI run SHALL be recorded in the
  card, because the four steps behind the cargo step (docs gate, e2e
  lane, xvfb boot) have never yet run on Linux and their first contact
  is behind this red.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
