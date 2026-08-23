---
id: T-013-s3
title: The churn subprocess is bounded in commits and in paths, and NOT in wall-clock time
status: suggested
suggested_by: executor claude-opus-5 @T-013
---

`churn_at` in `app/src-tauri/src/churn.rs` runs `git log` through
`Command::output()`, which blocks until the child exits. Three bounds
exist and one does not:

- **commits** — `--max-count=5000`, and reaching it sets `truncated`;
- **paths** — `CHURN_MAX_PATHS`, same;
- **input** — `stdin` is `Stdio::null()`, so the child can never block
  waiting to be typed at;
- **time** — nothing.

On this repository the whole read is **0.4 s wall and 97 KB of output**,
measured. On a repository with a pathological object store, a network
filesystem, or a `.git` that makes git retry, it is unbounded, and the
cost is one `spawn_blocking` thread held for as long as git wants. The
UI does not freeze (that is what `spawn_blocking` buys) and the pane
stays on `loading`, so the visible failure is an overlay segment that
never enables — a slow silence rather than a crash.

**THE PRIOR ART IS THE RUNNER'S, AND SO IS THE OPEN QUESTION.** C-14
bounds its login-shell probe at 10 s (T-025 §6), and `T-043-s3` records
that that timeout **has no escalation** — it gives up waiting without
reaping. Adding a naive timeout here would reproduce that defect on a
second surface, which is why this card added none rather than adding a
half one.

The shape that would close both: one bounded-wait helper with a
SIGTERM-then-SIGKILL escalation on the child's process group, used by
the runner's probe and by this read. `T-043-s3` should be weighed
together with this, not separately — they are the same missing
primitive, seen from two surfaces.
