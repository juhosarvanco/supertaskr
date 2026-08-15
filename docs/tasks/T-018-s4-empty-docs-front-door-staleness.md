---
title: Empty docs/ appearing leaves the noDocs screen claiming it is absent
status: suggested
suggested_by: verifier claude-fable-5 @T-018-verify
---

T-018 residual (2), sharpened by verification: after a docsless
startup, `mkdir docs` re-arms the watch (verified live) but emits
nothing — the empty tree equals the empty baseline, and the suppression
invariant is the right default. Cost: the front door keeps saying
"no docs/ found in <path>" while docs/ now exists, until the first
collected file lands (which does flip the screen — verified;
`applyDocsPayload` sets phase "open"). The executor sided with the
suppression invariant plus the design's "an empty folder is an
invitation"; the verdict rules that defensible and criterion-literal.

If the staleness ever matters: emit exactly ONCE on the (unarmed →
armed) docs-watch transition even when the outcome equals the baseline
— the frontend would then show the empty board (the invitation rendered
live) instead of a stale claim of absence. Small change in
`ensure_docs_watch`'s (false, true) arm; the suppression invariant
stays intact for every other batch. Alternative: a `docsPresent` field
on the snapshot, but that widens the payload for one screen's benefit.
