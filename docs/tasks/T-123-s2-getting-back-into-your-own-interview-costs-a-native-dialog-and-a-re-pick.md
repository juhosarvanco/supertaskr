---
id: T-123-s2
title: Getting back into your own interview costs a native dialog and a re-pick of the folder you already have open
status: suggested
suggested_by: executor claude-opus-5 @T-123
---

T-123 makes the route exist. This is about what it costs to walk it, and
about a button whose label is now wrong for the case it serves.

**MEASURED BY READING THE TREE AT `8558352`, symbols named.** The board
header's affordance is `App.tsx`'s `data-testid="header-start-interview"`
and its handler is `pickGenesisFolder()` — `watcher-store.ts`'s wrapper
over the `pick_genesis_folder` command, which **opens the native
dialog**. So a user in @human's reproduction, sitting on the board of the
folder their interview just planned, gets back in by:

1. clicking **"Start an interview"**, then
2. re-choosing, in a native file dialog, the folder that is already open.

Only then does `apply_genesis_folder` run, see the registry, and route to
genesis. It works — that is what T-123 built — but the second step asks
the user to re-answer a question the app already knows the answer to.

**THE ZERO-ARGUMENT DOOR ALREADY EXISTS AND IS NOT WIRED HERE.**
`start_genesis_here` (`lib.rs`) takes no path: it reads
`state.genesis_target()`, which is *the open project* whenever no
rejected pick is pending, and hands it to the same
`apply_genesis_folder`. The front door's *"Start an interview here"*
button uses it; the board header does not. Wiring the header to it —
conditionally or outright — is a one-handler change in `App.tsx` and
needs no new command, no new grant and no payload movement.

**AND THE LABEL IS NOW WRONG FOR THIS CASE.** On a folder that registers
an interview, that button no longer starts one; it takes you back to one.
`InterviewChat`'s own auto-start comment leans on the label —
*"the user's action that reached this screen was literally 'Start an
interview'"* — so whoever changes the wording should read that comment
with it.

**WHY T-123 DID NOT DO IT.** `app-shell` is inside T-123's fence, so
this is scope rather than reach: no acceptance criterion names the board
header, and criterion 1 is satisfied by the route existing. It is also
genuinely a DESIGN question (does the header show a different label when
the open project registers a session? does it show a second control?)
rather than a mechanical follow-through, and T-050's *"no reachable
screen is a dead end"* is already satisfied without it.

**FENCE**: `[app-shell]` for the handler and the label;
add `app-board` if the answer is a new control in the board's own
header rather than a change to the shell's.
