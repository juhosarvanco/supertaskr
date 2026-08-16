---
title: Genesis mode does not survive a restart — the folder is remembered, the intent is not
status: suggested
suggested_by: executor claude-opus-5 @T-026
---

T-026's `genesis` screen state lives in the frontend store for the
session only, and Rust's `WatchState.last_rejected` (the folder "Start
an interview here" means) is in-memory too. Quit the app mid-interview
and relaunch: launch resolution finds the same docs-less root, the
front door renders the "No plan in <folder>" card for it, and one click
is back where you were. Nothing is lost — docs/ is the record (ADR-017)
and the watcher re-arms from the sentinel — but the app forgets that an
interview was in progress, which is a different thing from forgetting
the folder.

Two tasks already own halves of the fix and neither is blocked by this:
T-022 (front-door persistence, milestone 4) would persist the last
project and the recents rows the design draws; T-029 (genesis resume /
hand-driven fallback) owns the "an interview was running — resume or
start fresh?" decision, which needs T-025's session registry
(.nputer/sessions.json) rather than a remembered screen state. The
suggestion is only to keep them from BOTH inventing a persistence
mechanism: whoever lands first should decide where "the shell was in
genesis on <folder>" is written (the runtime .nputer/ registry is the
natural home — never docs/, which stays project truth), and the other
consumes it.

Recorded here because T-026 deliberately shipped no persistence at all:
a genesis project that only exists in RAM cannot lie about a stale
session, and the recovery path is one click on a card the app already
renders truthfully.
