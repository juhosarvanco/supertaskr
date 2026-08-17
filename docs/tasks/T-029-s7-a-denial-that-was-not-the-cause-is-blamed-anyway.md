---
id: T-029-s7
title: A permission denial the planner ROUTED AROUND is blamed for an unrelated failure — `terminal_reason: "end_turn"` is read and then ignored
status: suggested
suggested_by: verifier claude-opus-5 @T-029
---

The smaller sibling of T-029-s6, in the same closure and the same shape:
`permission_denials` is treated as the CAUSE of a failure whenever it is
merely PRESENT.

`permission_denials` on the CLI's `result` line is a cumulative record of
everything refused during the turn, not a statement that a refusal ended
it. A planner denied `WebFetch`, that shrugs and continues, and whose
process then exits nonzero for an unrelated reason, is classified:

    init · text delta
    result{ is_error:false, terminal_reason:"end_turn",
            permission_denials:[{tool_name:"WebFetch"}] }
    exit 1
    => ToolDenied { denials: ["WebFetch"], terminal_reason: Some("end_turn") }

Reproduced against branch tip `c3f86ad` through
`RunnerConfig::binary_override`. The screen then renders "the planner was
refused a tool it needed" over the hint "The planner asked for WebFetch
and nputer's allowlist does not carry it" — while the turn's own
`terminal_reason`, sitting in the same typed struct that was just read,
says `end_turn`.

This is milder than s6: `failureAction` leaves `retry: true` for
`toolDenied`, so no affordance is removed and the user is not sent to a
no-op command. It is still a fabricated cause presented in the runner's
confident voice, and the evidence contradicting it was already parsed.

**The close** is a guard in the same `if exited_badly || result_is_error`
block: require the turn to have actually died of the refusal —
`result_is_error` true, or `terminal_reason` outside the CLI's
normal-completion set — before `ToolDenied` is returned, and fall through
to the relayed `ExitNonZero` otherwise.

This should be closed together with T-029-s5's one real observation: the
set of `terminal_reason` values a real denial produces is exactly the
thing that is still a guess, and the guard needs it. Until then the
conservative form (require `result_is_error`) is safe on its own and
keeps the shipped `tool-denied` fixture green, which sets
`is_error: true`.
