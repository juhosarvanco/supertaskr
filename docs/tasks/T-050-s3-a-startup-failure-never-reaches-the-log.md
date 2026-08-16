---
id: T-050-s3
title: A startup failure never reaches stdout — the one failure the user reports is the one the log cannot describe
status: suggested
suggested_by: verifier claude-opus-5 @T-050
---

T-050 makes a failed startup VISIBLE — on screen, to the person sitting
in front of it. It does not make it OBSERVABLE — in the log, to whoever
they send it to. Those are different audiences and today only the first
is served.

**The mechanism**, measured against the branch at `761e662`. Every other
boundary error in `watcher-store.ts` has a path to the Rust process:
`sendEcho` calls `emit("model-updated", …)`, Rust receives it and prints
through `println!`/`eprintln!` with `sanitize_for_log` applied
(`app/src-tauri/src/docs_watch.rs:846`). The startup failure has no such
path. `recordStartupFailure` ends at:

```ts
console.error("[nputer] startup failed at", step, reason);
```

and there is no `emit` anywhere on that route — `grep -n "emit(" ` over
the store returns exactly one call site, `sendEcho`, which is the docs
echo. A WKWebView `console.error` does not appear in the Tauri process's
stdout, so a stranded launch leaves **no trace at all** in the log the
user can copy.

**Why this is worth a card rather than a shrug.** It is not hypothetical:
it happened on 2026-08-16. @human reported this very defect with a
screenshot, sent their log, and the log was healthy through seq 22 —
because the thing that broke could not write to it. T-050's card had to
say, in its own words, that which trigger stranded their instance is NOT
claimed. With this closed, the next report answers itself: the step, the
attempt number and the stringified rejection would already be in the
file they attach.

The gap widens rather than narrows once the app can retry. A user who
presses "Try again" four times produces four failures and four attempt
numbers, all of which are exactly the evidence a diagnosis needs, and all
of which are discarded.

**What it would take.** The store already has the shape: one recorder,
one call site each side. The candidates, cheapest first:

1. **Ride the existing echo channel.** `emit("startup-failed", { step,
   message, attempt })` from `recordStartupFailure`, a listener beside
   the `model-updated` one in `app/src-tauri/src/lib.rs`, and
   `eprintln!("[nputer] startup failed at {step}: {}",
   sanitize_for_log(&message))`. New event, no new command and no new
   grant. `sanitize_for_log` is mandatory and is exactly why: the message
   is an arbitrary string from the boundary, and this verification put a
   NUL + BEL + ESC run and 10 000 characters through it — the DOM handles
   that safely today, a terminal would not, and the existing sanitiser
   already escapes control characters and truncates.
2. **Ask Rust instead of telling it.** A `report_startup_failure`
   command. More ceremony (a command and a capability entry) for the same
   result; the only advantage is a reply the frontend could act on.
3. **Do nothing but say so.** Put the step and attempt in the failure
   card's copy in a form a user can retype. Free, and strictly worse than
   either of the above, but it beats the current state where the number
   exists only in a devtools panel a non-developer will never open.

Option 1 is the one that matches the store's existing habits.

**Not a T-050 defect.** Criterion 2 asks that the failure be surfaced
"rather than swallowed … the user learns that startup failed and what
failed", and it is: on screen, verbatim, as a text node, with nothing
truncated. The `sanitize_for_log` clause it carries is satisfied
vacuously — nothing is echoed to stdout, so nothing needs sanitising.
This card is about the sentence AFTER that one: the discipline exists,
and the reason it currently has nothing to do is the same reason a real
investigation ran out of evidence.
