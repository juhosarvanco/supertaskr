---
id: T-069-s1
title: The mirrored `status.last_error` assertions cannot fail unless the match arm above them already has
status: suggested
suggested_by: executor claude-opus-5 @T-069
---

An idiom repeated across the T-029 family in
`app/src-tauri/tests/agent_runner.rs`: match on the failure event, then
assert the settled status is NOT some other variant.

```rust
match wait_failed(&h.events) {
    TurnError::ExitNonZero { code, .. } => assert_eq!(code, Some(1)),
    other => panic!("expected ExitNonZero, got {other:?}"),
}
let status = settle(&h.agent);
assert!(
    !matches!(status.last_error, Some(TurnError::ToolDenied { .. })),
    "a denial the turn survived is not the cause of its death: {:?}",
    status.last_error
);
```

**The trailing assertion has no independent falsifying path.** Measured
during T-069's poison sweep (round R10 — the `result_is_error` guard
dropped from the `ToolDenied` arm, the mutation these lines exist to
catch): both bodies reddened at the `other => panic!` arm
(`agent_runner.rs:1539` and `:1583`), never at the negative assertion
below. `run_turn` sets `out.error = Some(error.clone())` and then emits
the same value, so the event and the stored status cannot disagree about
the VARIANT; by the time the negative assertion runs, the match arm has
already accepted the variant it forbids.

The negative form is also green under the storage bug it looks like it
would catch: if `last_error` were dropped on the way into `AgentState`,
`!matches!(None, Some(ToolDenied))` is still true.

**This is not a T-069 defect and nothing here is wrong.** The lines are
harmless documentation of intent, and T-069 wrote one more of them
(`a_fatal_denial_the_cli_did_not_flag_as_an_error_still_names_the_tool`)
deliberately, to match the file's existing shape rather than to diverge
from five neighbours. It is filed because the POISON DRILL bullet in
CONVENTIONS asks for a body that cannot red to be named rather than
quietly kept, and because the count matters: at least four bodies carry
this shape.

**Two ways to close, neither obviously right.** Replace the negative
with a positive `assert_eq!` on the whole settled error, so the
event-to-state path is genuinely pinned (it would then red if
`AgentState` dropped or rewrote the classification) — or delete the
lines and let the match arm carry the claim alone. The first adds a
real assertion; the second removes a decorative one. Whether the
event-to-state path deserves its own pin at all is the actual question,
and it belongs to whoever owns `agent/mod.rs`'s status storage rather
than to a classification card.
