---
id: T-072-s4
title: The repo now counts renders in exactly one place, and the card that exists to reduce them counts none
status: parked
wake: T-032
suggested_by: executor claude-opus-5 @T-072
---

T-072 criterion 3 added the first render-count pin in this repository:
`a quiet snapshot costs the conversation NO extra render, a banking one
costs exactly one` in `app/test/interview-chat-dom.test.tsx`. It is six
lines — a `<Profiler>` around the component under test, a counter in
`onRender`, and a DELTA taken across one prop change with a positive
control beside it.

**WHY THIS IS WORTH GENERALISING RATHER THAN LEAVING AS ONE TEST.**
T-056's whole subject is render cost — it memoises `PlannerTurn` on the
turn object and caches the rehydration projection by payload identity —
and it shipped no counter, so its property is held by argument. T-057
then moved a baseline into the same `useState` as the chips and undid
part of it; T-057-s2 recorded the regression HONESTLY and added the
sentence that matters here: *"no test on the branch can see it."* Two
merges later, T-072 measured it — restoring the pre-T-072 storage reads
**`{ quiet: 2, banking: 2 }`** against the pinned
**`{ quiet: 1, banking: 2 }`**, so the regression was one commit and one
counter away from being visible the day it landed.

**THE SHAPE, so a second one does not invent its own.** Count COMMITS,
not renders — `<Profiler onRender>` fires once per commit that includes
its subtree, so a state update React bails out of is invisible, which is
the property being pinned. Assert a DELTA across one change rather than
an absolute, because a mount settles several async boundary calls and an
absolute pins those instead. And ALWAYS carry the moving arm: on its
own, "costs no extra render" is satisfied equally by a counter that
cannot move, by a component that stopped observing its input, and by a
`Profiler` that was never wired up — the same one-sidedness CONVENTIONS'
A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL bullet is about.

**Candidates, in the order their cost is argued rather than measured:**
`PlannerTurn`'s memo (T-056's own claim, currently held by an identity
assertion on the projection and not by a render count), the board pane's
re-render on an unchanged docs snapshot, and the map pane's two lenses.

Filed rather than done because every one of them is outside
`[app-interview]`.

**PARKED at the fifth triage (2026-08-20).** Unpark when the first card claiming a render-cost property (T-056's memo, the board pane, or a map lens) lands — it takes the idiom with it.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-032; the repository counts renders in one place and the card that exists to reduce them counts none.
