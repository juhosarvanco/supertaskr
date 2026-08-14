---
title: Header controls count as outside clicks and close the detail panel
status: suggested
suggested_by: verifier claude-fable-5 @T-005-verify
---

Observed while verifying T-005's dark-mode behavior: clicking the
header's "Toggle theme" button while the detail panel is open closes
the panel, because the outside-click dismissal exempts only
`[data-card-trigger]` elements and the header is neither inside the
panel nor a card. This is the outside-click rule working exactly as
the builder specified — not a T-005 failure — but the interaction
reads as a surprise: a user checking a card's colors in both themes
loses the panel on every toggle, and any future app-chrome control
(pane switcher, sessions button, parse-badge hover-turned-click)
will inherit the same behavior.

Suggest: an architect call on whether app chrome should be exempt
from panel dismissal. Cheapest shape: a `data-panel-exempt`
attribute checked alongside `data-card-trigger` in
TaskDetailPanel.tsx's document click handler, applied to the header
(or just to the theme toggle). Alternatively fold the decision into
T-006's design pass, which owns the header's future anyway. A few
lines either way; no selector or model change involved.
