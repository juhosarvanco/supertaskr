---
title: Parser smoke test still expects five backbone features (F-06 broke it)
status: rejected
suggested_by: executor claude-fable-5 @T-006
---

lib/parser's smoke suite parses this repo's live docs/ tree; its
"parses the five backbone features in order" case hardcodes
`['F-01' … 'F-05']`. The F-06 promotion (commit c1cec7b, 2026-08-15)
added the sixth backbone feature to docs/ROADMAP.md, so the case now
fails on a clean checkout of main: expected 5, received 6 (F-06
appended, order otherwise intact — observed during T-006 verification,
whose diff touches app/ only).

The sibling cases still pass ("finds zero issues in the live tree",
"parses the milestone-1 tasks"), so the parser itself is fine — only
the pinned expectation is stale. C-06 is `verified`, and its suite is
the milestone-2 gate for T-008 (which will touch lib/parser anyway).

Suggest: update lib/parser/test/smoke.test.ts to expect the six-feature
backbone (or derive the expectation from ROADMAP order rather than a
literal list, so backbone growth stops breaking a smoke test whose real
job is "the live tree parses cleanly"). One-file change, touches
lib-parser — outside T-006's [app-shell, app-board] scope, hence filed
instead of fixed.

2026-08-15 — architect triage at T-006 integration: REJECTED — already fixed on main (67cccd7) before integration.
