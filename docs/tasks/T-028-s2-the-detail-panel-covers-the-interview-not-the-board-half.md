---
title: On the genesis board, clicking a card opens the detail panel over the whole window
status: suggested
suggested_by: executor claude-opus-5 @T-028
---

T-028 mounts the REAL board in the interview's right half, read-only and
composition-only. It inherits every board behaviour for free — which is
the point — including one that reads differently on a split screen than
it does on the board pane.

**The shape.** `TaskDetailPanel` (T-005) is
`fixed inset-y-0 right-0 z-10 … w-150`
(`app/src/components/board/TaskDetailPanel.tsx:91`). On the board pane
that is correct: it is a right-edge drawer over a full-width board. On
the genesis screen the board occupies only the right half beside a 640px
conversation, so the drawer opens across the WHOLE WINDOW — 600px of it
over the board it came from, the rest over the interview. At the app's
own 1280-wide lane geometry the panel is 600px against a 640px right
half, so it very nearly replaces the pane and reaches into the chat.

Nothing breaks: the panel is read-only, `attachPanelDismissal` still
dismisses it on pointerdown, and the conversation underneath is
untouched. It is a composition question, not a correctness one.

**Why T-028 did not fix it.** Its fence is explicit — board files are
READ-ONLY, criterion 1 is composition only — and every plausible fix
edits one: scoping the panel to a containing element needs a positioning
prop or a portal target on `TaskDetailPanel`, and suppressing the panel
on this screen needs a prop on `Board`. Half-fixing it from the outside
(an overlay, a duplicate panel, a CSS override reaching into board
internals) would be worse than leaving it, and would put a second
spelling of the detail panel in the tree.

**What a fix probably looks like**, for whoever picks this up: `Board`
already takes exactly one prop (`model`), and the smallest honest
addition is an optional `onOpen`/`renderPanel` seam so a host can decide
where the detail lands — which is also what T-022 (front-door
persistence) and T-034-s3 will want when the map's lens grows a panel.
Worth doing ONCE, in the board's lane, rather than three times from
outside it.

**@human judgment, if it is wanted before any code:** on a split screen,
should a card's detail open as a drawer over everything, as a panel
inside the right half, or not at all while an interview is running? The
third is defensible — the board is the reward, not yet the workspace.
