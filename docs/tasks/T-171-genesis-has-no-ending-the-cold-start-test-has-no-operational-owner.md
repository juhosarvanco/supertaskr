---
id: T-171
title: Genesis has no ending — stage 7 banks, the method's cold-start test has no operational owner, and the screen rests on "planner is thinking…"
status: suggested
suggested_by: "@human's genesis walk (2026-08-30, /Users/ujju/Projects/first-walk) — the milestone-3 walk's principal finding"
touches: [app-interview, app-agent]
---

**WHAT @HUMAN SAW, at the end of a complete and otherwise successful
seven-question walk:** the last bank landed (eight docs files), the
board pane showed the three cards and "milestone 1 ships above" — and
the chat column ended on the planner saying, in its own words, that
the role file requires a cold-start test ("a fresh session that reads
only `docs/` and explains the project back"), that *"I can't be that
session; I have the whole interview in context"* — and then the
footer held **"planner is thinking… · ⌘. to stop"** with a disabled
bank button, indefinitely. @human's report, verbatim: *"I did the
whole walk and after the last question, the image is what it ended
with, and I don't know how to move forward from it."*

**THE PLANNER IS RIGHT AND THE APP HAS NO ANSWER.**
`method/interview/plan-interview.md` ends: *"Then: cold-start test. A
fresh session reads only docs/ and explains the project back. Gaps in
its answer are gaps in the docs — fix and repeat."* The interview
session is disqualified from running it BY CONSTRUCTION (it has the
interview in context — the blindness is the test), and nothing in the
app spawns the fresh session the method names. So the flow's last
stage exists in the method, is honestly refused by the planner, and
is owned by nobody. The stall is not a bug in the planner's turn; it
is a missing seat.

## What the fix has to decide

1. **A terminal state.** After the last bank the interview SHALL
   conclude visibly: the board presented as the product of the walk,
   a "genesis complete" state, and the next actions named (run the
   cold-start test; open the project). "planner is thinking…" SHALL
   never be a resting state — if no turn is in flight, the footer
   must not say one is.
2. **The cold-start test operationalized.** The app spawns a FRESH
   agent session whose reading is restricted to the new project's
   `docs/` and asks for the explain-back; the answer renders beside
   the board; its gaps are the actionable output (fix-and-repeat, per
   the method). This is agent-runner work (`app-agent`), and the
   restriction is the test — a session that read anything else is not
   cold.
3. **Whether the test blocks completion or follows it.** The method
   says "fix and repeat" but a human may reasonably stop at a green
   board. Suggest: completion is at the last bank; the cold-start
   test is offered, not gated — but that is triage's call, not this
   card's.

At the walk itself, the integration seat ran the cold-start test by
hand (a fresh Opus session restricted to first-walk/docs) so the walk
could finish the method's sequence; its result lands on this card
when it returns. The by-hand run is the workaround this card
eliminates.
