---
id: T-029-s4
title: The interview's outcome state lives in two places and the chat picks between them — one source would be better than a documented precedence rule
status: suggested
suggested_by: executor claude-opus-5 @T-029
---

The same typed outcome is stored twice: `interview-source.ts` keeps
`InterviewUiState.notice` (set by `startInterview`/`sendAnswer`/
`takeStart`) and `agent-store.ts` keeps `GenesisState.lastOutcome` (set
by `reduceGenesisOutcome`). They are written from the same object on the
Tauri path, so they normally agree.

T-029 needed both. `InterviewChat` now reads
`ui.notice ?? genesis.lastOutcome` and derives the resume offer, the
unusable-session block and the generic notice from that ONE expression.
The precedence is documented at the call site and the reason is real —
the module value is the live answer to a call this screen just made, the
store value is the durable one that survives a component remount, and
reading only one of them loses a case.

**Found by the E2E lane, not by reasoning**: the served bundle's harness
pushes outcomes through the STORE, so a resume offer driven only by
`ui.notice` rendered nothing there. That is exactly the store/UI
split-brain T-027 §1 argued against and T-029's own T-027-s2 criterion
rejected a shape over — and it is currently resolved by a precedence
rule rather than by there being one value.

The close is a merge, not a rule: either `reduceGenesisOutcome` becomes
the only writer and `interview-source` reads it, or the notice moves out
of the store. Both are contained edits; the second is probably wrong,
since durability across a remount is the property T-029 spent its length
adding.

Not urgent — it is correct today and pinned by tests on both paths — but
it is a second place for a fact to live, in the task whose spine is that
facts should have one.
