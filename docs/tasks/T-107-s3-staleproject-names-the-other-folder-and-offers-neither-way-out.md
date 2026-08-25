---
id: T-107-s3
title: staleProject names the other folder the session belongs to and offers neither way back to it nor a way forward here
status: suggested
suggested_by: executor claude-opus-5 @T-107
---

**The second of the two arms T-107's criterion 6 enumeration turned up.**
Same shape as the card that found it: a correct, typed diagnosis with no
next step.

`noticeSentence` in `app/src/genesis/InterviewChat.tsx` renders
`staleProject` as, verbatim at `c4c15c8`:

    the running session belongs to ${outcome.sessionProject}, not the folder now open.

`SendOutcome::StaleProject { session_project }` carries the other
project's path as a TYPED field, so the app knows exactly which folder
the live session belongs to. **Two next steps exist and the screen offers
neither**: reopen that folder (the session is still live and resumable
there), or start a fresh session in the folder now open.

**IT IS NOT A CANDIDATE FOR THE HAND-DRIVEN ROUTE**, which is the ruling
T-107 recorded beside it in `noticeRoutesToHandDriven`: the CLI is fine
here, so offering the mode that needs no CLI answers a question nobody
asked. That is why this arm needed its own finding rather than riding
T-107's change.

## What makes it worth a card rather than a shrug

The user reaching this has TWO projects in play and the app is the only
thing that knows which is which. Everything needed is already on hand:
`outcome.sessionProject` is the path, `openProject`-shaped affordances
exist in the shell (⌘O and the front door, T-049), and
`freshInterview(projectDir)` is already wired to a button in the
`sessionIdRejected` block one branch up.

## The open question, which is why this is `suggested` and not a task

**Whether a genesis notice may open a folder at all.** Every affordance
this pane owns today acts on the project it was handed. Reopening
`sessionProject` would make this notice the second place in the app that
changes which project is open — the first being the shell's own front
door — and that is a boundary question rather than a wiring one.
The cheap half is not: **"Start a fresh session here"** is already a
button this pane renders elsewhere, acts only on the open project, and
is a complete answer to the situation on its own.

Fence `[app-interview]` for the cheap half. The folder-opening half needs
`[app-shell]` beside it and should not be taken without a ruling.
A pin belongs in `app/test/interview-chat-dom.test.tsx`, which is
`[app-shell]` — see `T-107-s4`.
