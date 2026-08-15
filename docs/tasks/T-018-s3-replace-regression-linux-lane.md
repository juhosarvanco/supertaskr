---
title: Pin the replaced-docs regression where it discriminates (inotify/Linux)
status: suggested
suggested_by: verifier claude-fable-5 @T-018-verify
---

Verification correction (full detail in T-018's verdict): the T-018
notes called the replaced-wholesale cargo test "the regression proof —
on pre-T-018 main the in-place edit after a docs/ swap produces no
event and the test times out". Grafted verbatim onto the merge-base
(ff09f33) collector on macOS 15, that test PASSES pre-T-018 — six of
six runs — and deleted-then-recreated passes too. notify's macOS
FSEvents backend watches PATHS, so the old handle keeps delivering for
whatever lives at `<root>/docs`; macOS was accidentally resilient to
replacement all along. The only macOS-discriminating live regression is
docs-created-after-a-docsless-startup (times out pre-T-018, six of
six).

The stale-handle death IS real by mechanism on inotify (watches follow
inodes) and presumably ReadDirectoryChangesW (see T-018-s1) — the
T-018 reconcile is the right fix and demonstrably fires on macOS
("docs/ was replaced - re-armed" logs during the branch test; the seam
probes show docs_id tracking the new directory). But no lane currently
proves the replace half against a backend where it can actually die.

When the Linux run lands (STATE's standing item / T-020's CI lane), run
the three sentinel live tests there FIRST — replaced-wholesale and
deleted-recreated are expected to be the discriminating pair on
inotify. Until then, the replace half's evidence is the seam tests plus
mechanism analysis, not a live kill, and the T-018 record should be
read with the verdict's correction.
