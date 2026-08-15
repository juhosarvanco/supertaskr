---
title: Map tasks lens — the pane's second lens (architecture · tasks)
status: suggested
suggested_by: executor claude-fable-5 @T-012
---

The design bundle ships a complete second lens for the map pane: the
"map · tasks" screen of docs/design/claudedesign_handoff/"nputer
app.dc.html" — the same pane chrome rendering board tasks in dependency
waves (critical path in #c96a4f, blocked/ready distinction on grey
cards, a summary strip: critical path · worst blocker · ready now),
switched by the lens segmented control (architecture · tasks) in the
pane header.

T-012 deliberately ships NEITHER the tasks lens nor the lens control
(plan §9 fence: "the tasks lens and the lens control [are] unbriefed
bonus scope"; criterion: "the lens control … is absent until a
tasks-lens task exists"). The design is fully drawn and waiting; a
promoted task would add the lens control to the T-012 pane header and
implement the dependency-wave layout over the existing task model
(blocked_by edges are already parsed — no new data source needed,
unlike churn). The bundle notes "its lens switch must work in both
directions", so the promotion should also cover lens view-state
(session-ephemeral until T-022, same as T-012's overlay state).
