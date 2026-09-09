---
id: T-112-s9
title: "The drawer asks the assembler on EVERY opened card, including cards whose disposition withholds the brief — one IPC per open that the panel then throws away, and the cheap fix would put the dispatchability judgement in two places"
feature: F-04
milestone: 4
size: S
priority: 9
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-112-s5, 2026-09-09"
blocked_by: []
touches: [app-board]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`T-112-s5`'s `useAssembledBrief` asks whenever the dispatch block will
render — that is, whenever the `dispatch` prop is present — and does NOT
ask whether the card is dispatchable first. On a card the frontier calls
`fenced` or `blocked`, `selectBriefPanel` returns the `withheld` arm and
the fetched outcome is never read. The brief is assembled Rust-side from
`method/`, the root adapter and CONVENTIONS, so this is not a free call.

## Why the obvious fix was REFUSED rather than missed

Gating the ask on the disposition means answering *"may this card be
dispatched?"* inside C-09, which is `selectBriefPanel`'s question and
`selectDispositions`' before it. Two implementations of that predicate
are two chances to disagree — the T-057 divergence this whole seam is
built to avoid, and the reason `task-detail.ts` TAKES the frontier's
answer instead of re-deriving one. One wasted call per opened card was
the cheaper mistake.

## The shape that would work

Let the judgement stay in one place and make it SAY whether an outcome is
wanted. `BriefPanel`'s `unavailable` arm currently answers *"the
assembler has not answered for this card yet"* — a caller cannot key on
that without matching a sentence, which would be worse than the waste.
A field would do it honestly: `selectBriefPanel` already knows it reached
the `outcome === undefined` branch AFTER the id, frontier and disposition
checks passed, and that is exactly the condition *"asking would be
useful"*. The drawer would then ask when the model says a brief is
wanted, and the predicate stays in the module a suite drives.

Everything named is inside `[app-board]` (`app/src/lib/task-detail.ts`,
`app/src/components/board/TaskDetailPanel.tsx` and C-09's own test
files); this is filed rather than built because it is a shape change to a
model type on a card whose ruling was about a fetch.
