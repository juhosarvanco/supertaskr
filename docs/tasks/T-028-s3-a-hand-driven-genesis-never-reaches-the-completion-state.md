---
title: A hand-driven genesis gets the board but never the completion state or its CTA
status: suggested
suggested_by: executor claude-opus-5 @T-028
---

Found while building T-028's completion signal, and worth writing down
because the two halves of that screen now disagree about who the user is.

**The shape.** T-028's lens→board SWITCH is pure file evidence
(`boardReadiness`: task files that parsed), so it fires identically
whether the writer is T-025's spawned planner or a human hand-driving the
method in a terminal — ADR-006's mode, and exactly the property T-027
celebrated for its banked chips. But the COMPLETION state is
`completionOf(docs, turns, inFlight)`, and its first condition is
`turns.length === 0 → blocker: "noTurns"`. A hand-driven genesis has no
turns at all, because nothing spawned a planner and nothing emitted on
`genesis-turn`.

So a user hand-driving the method sees the cards rain into the right
half, correctly and live — and then never sees "The board is ready", and
never gets the one CTA that lands them in the board pane. Their only way
out of the interview screen is the folder picker (⌘O), which re-opens the
project they are already in.

**Why T-028 did not just drop the turn condition.** Because the condition
is what keeps the completion state from firing on a folder that merely
HAS task files — and without it, opening a genesis on a directory
somebody already planned would be greeted with "The board is ready"
before a single question had been asked. The turn requirement is the only
evidence the app has that a conversation happened here at all. Removing
it trades a missing celebration for a false one, which is the wrong
direction (the criterion's own words: an empty board must never be
celebrated).

**The honest closer is probably not on this screen.** Two candidates:

1. **A way out that does not need a completion signal.** The genesis
   screen has no rail and no "open this as a project" affordance of its
   own; `openBoardFromGenesis` (`app/src/lib/watcher-store.ts:434`) is
   already a pure, IPC-free phase move, so a quiet header control would
   cost one button and would serve BOTH modes. This is the small one.
2. **A completion signal that does not require a turn** — e.g. the
   interview is "over" when the banking map's stage-8 artifacts are all
   present and unchanged for some window. That is a real inference with a
   real false-positive risk, and it belongs to whoever owns the resume
   rule.

Adjacent and probably the right home: **T-029**, which owns resume AND
the hand-driven fallback. It is already the card that knows what the app
should do when the runner is not the writer.
