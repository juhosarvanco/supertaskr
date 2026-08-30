---
id: T-164-s1
title: The launcher cannot tell whether the app is already running, because T-164's own criterion forbids it to look — and its second step is the one install channel that CORRUPTS rather than interrupts
feature: F-02
milestone: 4
priority: 20
size: S
status: suggested
blocked_by: []
touches: [bin]
suggested_by: executor claude-opus-5@subagent @T-164
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND WHILE BUILDING T-164, NOT DECIDED THERE — it is a question about
that card's own criteria, and an executor does not rule on its card.**
`bin/app-dev.mjs` runs `npm ci` in the target's `lib/parser` whenever its
derivation says an install is needed, and CONVENTIONS' own T-052 bullet
says `npm ci` is **the one channel that CORRUPTS rather than interrupts**
— it removes `node_modules` while a live vite serves out of it, and what
the NEXT read needs is destroyed. The launcher is normally run when no
app is up, which is why this is a suggestion and not a defect; but
nothing stops a human running it twice, and the second run would install
underneath the first run's app. **THE OBVIOUS GUARD IS THE ONE THING THE
CARD FORBIDS**: T-164's criteria say the script SHALL NOT touch port 1420
beyond what `tauri dev` does and SHALL NOT probe it, so the script reads
nothing about 1420 — deliberately, and it says so in its own header. The
open question is whether STATE's ONE PERMITTED READ,
`lsof -nP -iTCP:1420 -sTCP:LISTEN`, is a "probe" in that criterion's
sense: STATE draws the line at binding and connecting and calls the lsof
form the read that is allowed, so a REFUSAL built on it would take no
port, exchange no packet and reserve nothing — the T-046 detect-and-
refuse shape, applied to a human's launcher instead of to the pipeline.
**IT IS NOT A CORROBORATION OF T-052**, whose class is the PIPELINE
breaking the human's app; here the actor is the human's own launcher and
the remedy is a decision about this script's criteria, which only @human
or the orchestrator can take. If the answer is yes, the script gains one
precondition — refuse with the holder's pid and socket named, in the
refusal shape it already has, exit 3 — and if the answer is no, the
reason belongs on T-164 as a dated line so the next reader stops
re-asking.
