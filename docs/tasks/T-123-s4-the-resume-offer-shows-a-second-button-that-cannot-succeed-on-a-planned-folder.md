---
id: T-123-s4
title: The resume offer shows a second button that cannot succeed on the very folder the offer exists for — "Start a fresh session" beside "Pick up where it stopped"
status: suggested
suggested_by: executor claude-opus-5 @T-123-rebuild
---

Found while rebuilding T-123 after a REJECTED verdict whose finding was a
control that could not succeed. This is the same shape, one screen over,
and it is **not** a defect this rebuild introduced — it has been there
since T-029 and only becomes reachable in the ordinary case now that
T-123 routes a planned folder to the interview screen at all.

**THE SHAPE.** On the card's own reproduction — a folder holding the
stage-0 `docs/ROADMAP.md` its own interview wrote, with a resumable
planner in `.nputer/sessions.json` — the pick routes to genesis,
`genesis_start` answers `ResumeAvailable`, and `InterviewChat` renders the
`interview-resume-offer` block with **two** buttons
(`app/src/genesis/InterviewChat.tsx:412-444`):

| button | testid | call | on a planned folder |
|---|---|---|---|
| Pick up where it stopped | `interview-resume` | `genesis_resume` | **works** |
| Start a fresh session | `interview-fresh` | `genesis_fresh` | `AlreadyPlanned` |

`fresh_genesis` refuses a folder that holds a plan on a bare
`probe.has_plan()`, and **that refusal is correct and deliberate** —
T-123 criterion 7 requires it, because `genesis_fresh` is the destructive
door (it marks the recorded session `dead` and spawns a new planner at
stage 0) and a cloned repository carrying somebody else's `.nputer/` must
route to resume and never to a fresh interview. The pin
`fresh_genesis_still_refuses_a_planned_folder_even_with_a_session_registered`
(`app/src-tauri/src/agent/mod.rs`) exists to keep it that way.

So the button is not wrong to refuse. **It is wrong to be offered.**

**WHY IT IS A SUGGESTION AND NOT A REJECTION OF THE REBUILD.** The screen
is not a dead end: the other button works, which is the whole of what the
card asked for. Nothing is destroyed, nothing is silent — pressing it
renders *"&lt;path&gt; already exists — this folder has a plan."* The
severity is one wasted click and a sentence that reads like a refusal of
the screen rather than of the one action.

**WHY IT IS WORTH A RULING ANYWAY.** T-050's ruling is that no reachable
screen is a dead end; its natural sibling is that no rendered control is
one either. The rebuild of T-123 was rejected for routing users to a
screen whose only actions could not succeed, and the fix was to stop
routing them there. This is the residue of the same question on the
screen that *is* correctly reached, and the honest answers are a ruling,
not a reflex:

1. **Hide it when the folder holds a plan.** The offer block would need
   to know `has_plan`, which no payload currently carries — so this costs
   a field on `StartOutcome::ResumeAvailable` (C-14) as well as the
   render (`app-interview`).
2. **Keep it and say what it will do**, e.g. disable it with the reason
   *"this folder already holds a plan — a fresh session would start over
   on it"*. Same payload cost, and it teaches the guarantee instead of
   hiding it.
3. **Rule that it stays as it is**, on the grounds that the refusal
   message is already accurate and the button is the user's only route to
   discovering the guarantee exists.

**FENCE.** `app-interview` (`app/src/genesis/InterviewChat.tsx`) for the
render, plus `app-agent` (`app/src-tauri/src/agent/mod.rs`) if the chosen
answer needs the plan fact in the payload. **NOT reached for by this
rebuild**: `app-interview` is outside T-123's `touches: [app-shell,
app-agent]`, and it was held by the live T-031 lane on the night this was
found.

Related: `T-123-s1` is the mirror of this on the hand-driven door —
`genesis_kickoff` refusing a folder its own interview planned. Both are
"the routing question was answered in one place and not in another".
