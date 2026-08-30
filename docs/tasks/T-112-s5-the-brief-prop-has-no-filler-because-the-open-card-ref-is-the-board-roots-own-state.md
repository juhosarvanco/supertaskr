---
id: T-112-s5
title: The brief prop has no filler even once the join lands — the open-card ref is Board.tsx's own useState, so the shell that mounts the board cannot know which card to ask a brief for
status: suggested
suggested_by: executor claude-opus-5@subagent @T-112-s1
---

**MEASURED WHILE BUILDING `T-112-s1`, AND IT IS NOT THE JOIN.** The join's
gap is `T-126-s2` and is corroborated there; this is the SECOND thing
standing between the registered `dispatch_brief` command and a rendered
brief, it is independent of that ruling, and it survives it. Filed
separately because a card that unparks `T-126-s2` and stops there will
still not render a brief.

`Board.tsx` takes `dispatch` and `brief` as optional props and holds the
open card entirely to itself:

    const [openRef, setOpenRef] = useState<TaskRef | undefined>(undefined);

`App.tsx` — C-05, the file that mounts the board root — renders
`<Board model={model} />` and never learns `openRef`. So the shell can
compute a `DispatchReading`, which is a fact about the whole repository,
and **cannot compute a `BriefOutcomeView`, which is a fact about ONE
card**: `readBrief(taskId, role)` needs the id of the card the user just
opened, and the only component that knows it is the one being handed the
answer.

Three shapes exist and none of them is obviously right, which is why this
is filed rather than decided:

1. **Lift `openRef` to the shell.** Honest, and it moves ephemeral VIEW
   state across a component boundary to serve one consumer — the trade
   `A RENDER-PHASE REF STAMP`'s closing sentence warns about, and the one
   T-027's planning pass refused for a different log.
2. **Fetch in `Board.tsx`.** The composition root gains an effect and an
   `invoke`, which contradicts that file's own design note in as many
   words (*"this file makes no decision about them"*) and puts I/O in the
   one board file with no test path of its own (`T-112-s4`).
3. **Fetch in `TaskDetailPanel.tsx`.** Nearest to the need — the drawer
   already knows its `taskRef` — and it makes C-09 reach C-15, an
   undeclared component edge today.

Shape 3 is the likeliest and is the one that needs the registry looked at
first; the `brief` PROP could then stay as the test seam it already is,
which is what `app/test/board-truth.test.tsx` drives.

## Where it was found

`T-112-s1` registered the command and wired `dispatch-store.ts` to it, so
the assembler is reachable from the webview for the first time. The card's
criterion 3 asked for both props to be filled from the store; neither
half is buildable today, for two DIFFERENT reasons, and that lane routed
both rather than widening its fence or deciding a parked ruling from
inside a lane. Read this beside `T-126-s2`'s corroboration of the same
date and `T-112-s4`, whose registry gap is a third, separate thing.
