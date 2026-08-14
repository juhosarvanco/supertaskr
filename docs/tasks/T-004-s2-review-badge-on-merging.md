---
title: Consider showing the verification badge on merging (approved, not yet landed) cards
status: suggested
suggested_by: verifier claude-fable-5 @T-004-verify
---

T-004 renders the verification badge on done cards only — plan-literal
("on done cards the verification badge from review:"), pinned by unit
test, and the executor flagged the consequence honestly: a `merging`
card whose `review:` is already stamped (verification approved, merge
pending) shows NO badge until it lands. Verifier confirmed in DOM: a
merging card with `review: independent` + `built_by` set renders teal +
pulse + model badge, badge absent.

The information loss is real but narrow: during the merge window the
board says "approved" (teal + pulse) without saying WHICH guarantee
held (independent / same-model / self-verified) — exactly the
distinction docs/design/dashboard.md cares most about. The moment is
also when a human is likeliest to be looking at the card.

Decision belongs to the architect (T-005 card detail or T-006 design
pass): either show the badge on `merging` too (one-line change —
`toCard` in app/src/lib/board-model.ts already has an `isDoneish`
helper used for exactly this precedence on the model badge), or keep
done-only and let T-005's expanded card surface `review:` during the
merge window. If shown on merging, keep the pulse/badge combination
legible (the badge strokes reference `--status-done-bg`, which equals
`--status-merging-bg` today but may diverge under T-006).
