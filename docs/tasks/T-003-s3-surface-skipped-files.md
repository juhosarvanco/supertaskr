---
title: Files skipped by the collector vanish from the model with no badge
status: suggested
suggested_by: verifier claude-fable-5 @T-003-verify
---

The Rust collector (T-003, `collect_docs_files`) silently skips
non-UTF-8 files, files over 1MiB, symlinks, and anything nested deeper
than 16 levels. The webview never learns those paths existed, so an
EXISTING task record whose file crosses one of those lines leaves the
model exactly like a deletion — no parse-error badge, no "showing last
valid state", the row just disappears.

Verifier-observed (live): overwrite a good task file with non-UTF-8
bytes → taskCount drops, `parseFailures` stays empty; same for
growing a task file past 1MiB. Restoring the file restores the record
(no crash, no corruption), so this is an observability gap, not a
correctness bug — but criterion 3's spirit is "never silently lose the
user's context", and these paths do.

Suggest: have the collector report skipped paths + reason
(`{path, reason: "non-utf8" | "oversize" | "symlink" | "too-deep"}`)
in the snapshot payload; the frontend folds them into the existing
failures list (badge text: "unreadable file", no last-good involved
unless one exists). Symlink entries arguably stay silent (security
posture, ADR-010) — worth deciding explicitly rather than by
omission. Small change: one Vec alongside the files Vec in
`docs_watch.rs`, one branch in `applySnapshot`.
