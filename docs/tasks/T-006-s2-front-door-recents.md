---
title: Front-door recents list needs a store (welcome mockup parity)
status: suggested
suggested_by: executor claude-fable-5 @T-006
---

The open-a-folder mockup (docs/design/claudedesign_handoff/"nputer
app.dc.html", welcome tab) shows a "recent" list under the hero —
recently opened repos with task/done counts — plus a "Start an
interview" affordance and ⌘O/⌘N shortcuts. T-006 dressed the existing
empty state as the front door (hero wordmark, docs/ pitch, no-plan
card, primary/outline buttons) but deliberately rendered NO recents
and NO interview button: there is no recents store anywhere (T-007's
Rust side resolves one launch project and one picker flow; nothing
records history), the interview is F-03, and ⌘O is not wired. A design
pass must not invent data sources or dead controls.

Suggest: when the picker lands a valid project, append it to a small
Rust-side recents record (e.g. under the app config dir — NOT in the
project; pure-lens holds), expose it through the startup status
payload, and render the mockup's recent rows (path + `N tasks · M
done`) that open the project directly. Wire ⌘O to pick_project_folder
at the same time. Touches app-shell (src-tauri + watcher-store +
App.tsx); the T-006 styles for the rows already exist in the mockup.
