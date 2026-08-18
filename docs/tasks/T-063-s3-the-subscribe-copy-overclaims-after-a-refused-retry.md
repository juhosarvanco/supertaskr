---
title: "\"no file change can reach the board\" is FALSE when a refused re-subscribe leaves the old one live"
status: suggested
suggested_by: executor claude-opus-5 @T-063
---

T-063 made the store hold the unlisten handle, and that created one
interleaving whose SCREEN COPY is now wrong. It is small, it is in the
T-042 family (the app claiming more than it knows), and it is filed
rather than fixed because fixing it means a fourth `StartupStep` or a
second field, which is a design call this card had no mandate to take.

**The interleaving, and it is pinned green as a deliberate behaviour** in
`app/test/startup-recovery.test.ts` ("a refused re-subscribe does not
tear down the subscription that still works"):

1. attempt 1 subscribes SUCCESSFULLY, then `docs_snapshot` is refused.
   T-050's asymmetry: the subscription is LIVE and the app can still come
   up on its own at the next file change.
2. the user presses Try again. Attempt 2's `listen` is refused.
3. `recordStartupFailure("subscribe", …)` fires — correctly, that IS what
   happened — and the store deliberately does NOT tear attempt 1's
   subscription down, because turning a live watcher into no watcher in
   the name of retrying is strictly worse than doing nothing.

So the shell now holds `startupFailure.step === "subscribe"` while a live
`docs-changed` handler is attached. And `startupStepPhrase("subscribe")`
in `app/src/App.tsx` says:

> the watcher subscription was refused, so no file change can reach the
> board.

**The first clause is true. The second is false**, and it is the half the
user acts on: it tells them the app cannot recover on its own when in
fact the next file change will bring it up. Someone reading that sentence
correctly concludes they must retry or reopen; they need not.

**Reachability is low but not zero.** It needs a refused `invoke`
followed by a refused `listen` — a boundary that half-fails twice in
different halves. It is exactly the sort of state that shows up in a real
bug report and nowhere else, which is the whole reason T-063 exists.

**Closers, none of them free.**
(a) A `resubscribe` step distinct from `subscribe`, with copy that says
    the watcher is still live. Most honest, adds a fourth step to a type
    that just grew a third.
(b) Derive the sentence from whether a subscription is held rather than
    from the step — the store already knows (`unlistenDocs !== null`);
    it would have to reach the screen, which means a field on
    `StartupFailure` or on `ShellState`.
(c) Weaken the copy for all subscribe failures to something true in both
    cases ("the watcher subscription was refused"), losing the
    consequence clause that makes T-050's wording useful.

(b) is probably right and is roughly six lines, but it puts a second fact
about the subscription into shell state, and this executor did not want
to take that decision inside a card that already changes the shape of
`StartupStep`. **The @human copy judgment T-063 already asks for is the
natural place to settle it.**
