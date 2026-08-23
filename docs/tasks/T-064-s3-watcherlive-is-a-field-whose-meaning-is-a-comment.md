---
id: T-064-s3
title: The `watcherLive` flag is meaningful only while `startupFailure` is non-null and only a doc comment says so — the airtight shape is a field ON the failure, refused here because it reds a sibling lane's fence
status: suggested
suggested_by: executor claude-opus-5 @T-064
---

T-064 closes T-063-s3 by arm (b): the subscribe sentence's consequence
clause is derived from whether a `docs-changed` subscription is HELD,
which the store knows in its `unlistenDocs` handle. The fact lands in
`ShellState.watcherLive` (app/src/lib/watcher-store.ts), written by the
same `setShell` that records the failure.

**THE RESIDUAL IS A COUPLING NOTHING ENFORCES.** `watcherLive` answers
a question about ONE failure, and it lives beside `startupFailure`
rather than inside it. Today that is airtight because there is exactly
one writer, and `selectScreen` only ever hands the pair to the screen
together. It stops being airtight the moment a second site writes
`startupFailure` and forgets the sibling — at which point the screen
renders a stale answer to "did a watcher survive?", which is the exact
class of untruth T-063-s3 was filed about.

**THE SHAPE THAT CANNOT DRIFT IS `StartupFailure.watcherLive`** — one
object, one write, and the renderer already receives the whole object
through `ScreenModel`'s `startupFailed` variant.

**IT WAS REFUSED HERE FOR A MEASURED REASON, NOT A PREFERENCE.**
`tools/e2e/tests/startup-recovery.spec.ts:52` asserts

    expect(shell.startupFailure).toEqual({ step, message, attempt })

on that exact object, so a required fourth field REDS THE E2E LANE —
and `tools/e2e` was **T-061's fence** while T-064 was built. A red in a
sibling lane's fence, produced by a change with a fence-clean
alternative, is not news worth making. T-064's card names the
alternative in as many words for arm (b) ("a second fact about the
subscription into SHELL STATE"), so the fence-clean placement is also
the literal one.

**THE MOVE, when tools/e2e is free**: add `watcherLive` to
`StartupFailure`, drop it from `ShellState` and from `ScreenModel`,
and update the one e2e `toEqual`. Sized S. Two neighbours to do at the
same time, both stale mirrors of the same object — see `T-064-s4`.
