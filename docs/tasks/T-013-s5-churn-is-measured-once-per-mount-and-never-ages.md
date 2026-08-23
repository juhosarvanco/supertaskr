---
id: T-013-s5
title: Churn is measured once per pane mount and shows no age — after a project switch or the next commit, the overlay is confidently stale
status: suggested
suggested_by: executor claude-opus-5 @T-013
---

`loadChurn()` runs from `MapView`'s mount effect and nothing else calls
it. Under Tauri a remount re-measures; while the pane stays mounted the
answer is frozen, and **the payload's `measuredAtMs` is carried all the
way to the frontend and then rendered nowhere**.

Two consequences, one of them a truthfulness defect the rest of this
pane does not have:

1. **A commit made while the map is open does not move the bars.** The
   docs watcher cannot help — churn is a function of `.git`, which the
   watcher does not walk (CONVENTIONS, THE FOUR WALKS) — so there is no
   live path and no manual one either. The graph has `Re-index` and an
   `indexed 2m ago` hint beside it; churn has neither.
2. **A PROJECT SWITCH keeps the previous project's churn.** `MapView`
   is not remounted by a switch, so the store still holds the old
   repository's numbers, attributed against the new repository's
   components. Every other layer of this pane is a pure function of the
   docs snapshot and re-derives itself; churn is the only one that
   remembers.

The cheap arm is the honest one and is roughly six lines: render the
age the payload already carries (`indexHint`'s own `relativeTime` is
next door and does exactly this), and re-measure when the project dir
changes. The full arm is a `Re-measure` affordance beside the overlay
segment. Both are out of this card's criteria, and neither is safe to
guess at without the header-layout decision the design pass owns —
`T-022`'s persistence charter is the natural place, since it already
owns overlay and viewport state for this pane (see `T-034-s3`).
