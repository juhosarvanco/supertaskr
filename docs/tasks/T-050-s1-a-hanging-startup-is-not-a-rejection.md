---
id: T-050-s1
title: A startup that HANGS is not a startup that rejected — T-050's retry cannot help it, and the screen still says "waiting"
status: suggested
suggested_by: executor claude-opus-5 @T-050
---

T-050 answers a startup attempt that REJECTS. It does not answer one that
never settles, and the two look identical to the user.

**The mechanism.** `startDocsWatcher` holds the in-flight attempt in the
`startup` latch and hands the SAME promise to every later caller. That is
the property that keeps React's double-effect from opening two
subscriptions, and it is right. But it also means that while an attempt
is genuinely in flight, the retry affordance is a no-op by construction:
pressing "Try again" calls `startDocsWatcher()`, which returns the
promise that is already hanging. Nothing re-attempts, and the screen goes
on saying "waiting for the first docs snapshot…" — which is TRUE, and
also exactly what @human's screenshot showed.

**Why this matters for THIS report.** T-050's card is explicit that the
trigger for @human's stranded instance is not proven. The rejection path
is now recoverable and visible; a hang is neither. If their instance was
hung rather than rejected, they would still see the same sentence today —
with three buttons under it instead of none, which is a real improvement
(⌘O, "Open a folder…" and "Start an interview" all work from that screen,
and a successful pick leaves it for the board), but the retry would still
do nothing and nothing would say why.

**What it would take.** A deadline on the attempt, recorded as a third
`StartupStep` (or a `kind` beside `step`) so the copy can say "the
watcher did not answer in N seconds" rather than "was refused":

```ts
await Promise.race([
  listen(...),
  new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), N)),
]);
```

Two things to get right, neither of which belongs in an S card written
under a fence:

1. **A raced-out attempt is still running.** Its `listen` may resolve
   later and register a subscription nobody is tracking, so a retry could
   end up with two. The latch would need to hold the abandoned attempt,
   or the subscription would need an unlisten path (`listen` resolves to
   one and the store currently discards it — see T-050-s2).
2. **N is a guess** unless someone measures a cold Tauri start on a slow
   machine. Too short and every slow launch shows a failure screen that
   is not one; too long and the affordance arrives after the user has
   quit.

Cheapest honest intermediate, if the timeout is judged not worth it: make
the waiting copy say how long it has been waiting, so a hang is visibly
different from a slow start. That needs a timer and a re-render, no new
failure semantics, and no guess about N.
