---
id: T-257
title: Two decision modes, audit and auto — a card's decision list is answered by the human before dispatch (the preflight refuses an unanswered item) or taken as the planner's proposed defaults and reviewed in one batch at the checkpoint, chosen per card over a project default like `review:`
feature: F-01
milestone: 4
size: M
priority: 2
status: planned
suggested_by: "@human (2026-09-08): \"Can we build two modes, auto and audit\" → \"file it\"; the decision list from docs/research's EARS-for-the-AI-era reading (its own warning: a skimmed list puts a human's name on a model's guess)"
blocked_by: [T-253]
touches: [method/tasks/TASK-FORMAT.md, method/runtime/nputer.yaml, tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts, tools/e2e/scripts/health-bands.config.mjs, tools/e2e/scripts/health-bands.mjs, tools/e2e/tests/health-bands.spec.ts, docs/checkpoints/TEMPLATE.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## Why this card exists

A model does not stall on an ambiguity; it resolves it and leaves no
trace. T-253 makes the decomposition step write each card's decisions
out — a question, the options, the planner's proposed default. This
card decides WHO answers and WHEN, in two modes, because the human's
minutes are the scarce input and the wrong default is the rework.
`review:` already works this way: a project default, a per-card
override, and a class of card (guard-class) that requires the dearer
value. Decisions get the same field.

## Acceptance criteria

- WHEN a card carries a decision list (T-253's `## Decisions` table:
  `D-NN <question> [a] … [b] … → proposed <x>`) AND its mode is
  `decide: audit` THE preflight SHALL refuse the dispatch while any
  item lacks an answer line stamped by the human (`@human: <x>`),
  naming the unanswered items — the human's name goes on the choices,
  never on the prose.
- WHEN the mode is `decide: auto` THE preflight SHALL stamp each
  unanswered item with the proposed default and `decided_by: planner`
  at dispatch, and the checkpoint record's Dispositions SHALL list every
  auto-decided item of every merge in the window, so the human reviews
  them in one batch after the fact (docs/checkpoints/TEMPLATE.md gains
  the row).
- WHEN no per-card `decide:` is set THE project default in
  method/runtime/nputer.yaml SHALL apply (a `decisions:` key, default
  `audit`); WHEN the card is guard-class, or its fence touches a
  security control, persisted data or user-facing behaviour, THE mode
  SHALL be `audit` regardless (the same clause that requires
  `review: independent`); WHEN the card took the quick path (T-241)
  THE mode SHALL be `auto`.
- WHEN the health bands run THE bands SHALL carry
  `decisions/items-per-card` (drift above 5, breach above 10, with
  the reason that a breached list is a card to split, not to skim) and
  `decisions/auto-rejections` (rejections whose verdict names an
  auto-decided item, derived from the verdicts' own text at the ref) —
  each declared with a keeper, per T-156's rules.
- TASK-FORMAT SHALL own the field's vocabulary (`audit | auto`) and
  the guard-class clause in one place; the method eval gate SHALL run
  with the bump's eval block; the preflight spec SHALL carry a planted
  audit card with one unanswered item (refused, by name) and a planted
  auto card (stamped, dispatchable) — the arming differs, per 2b.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
