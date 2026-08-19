---
id: T-069-s2
title: The auth discriminator declines evidence that is stronger than the evidence it acts on
status: suggested
suggested_by: verifier claude-opus-5 @T-069
---

T-069 closed the residual false positive — a recovered 401 with no
`result` line, which classified `AuthFailed` and took Try again away
from a user whose login was fine — with `text_after_auth_status`
(`app/src-tauri/src/agent/runner.rs:1635`, guarding the auth arm at
`:1991`). The flag is set only on `StreamLine::TextDelta` (`:1718`).

**The runner's own justification does not stop at text.** The comment
beside the guard says model text "is streamed by a request that
SUCCEEDED, so a delta after the last status-bearing line is the CLI
demonstrating it got past that status". That argument applies verbatim
to `StreamLine::Activity`, which `classify_line` produces from
`stream_event`/`content_block_start` with a `tool_use` block, and from
an `assistant` message carrying one (`:1392-1420`). Both are the SAME
model response as a text delta, in a different content-block type.

**And that evidence is stronger, not weaker.** The honest limit T-069
states is that the CLI writes its own prose into a nominally-model
field, so a delta can be the CLI rather than the model. A `tool_use`
block naming a tool is not prose and the CLI has no reason to fabricate
one. The discriminator therefore reads the evidence that CAN be forged
and ignores the evidence that cannot.

**Measured.** A probe scenario — init · `api_retry` 401 · one `tool_use`
block · exit 1, no `result` line — driven through the real `run_turn`
with `RunnerConfig::binary_override`, against the shipped tip:

```
VERIFIER PROBE 2 CLASSIFICATION => AuthFailed { status: Some(401), message: "the agent CLI could not authenticate" }
```

The false positive T-069 exists to close survives for every turn that
recovered a 401 and then called a tool without saying anything first —
an ordinary opening for a planner that reads the repo before it speaks.

**This is a narrowing of the closure, not a defect in it.** Everything
T-069 built is correct and its pins discriminate; the family it reaches
is simply smaller than its own argument. Closing it is one arm — set the
flag in the `Activity` arm too — plus one fixture and one body. The
counter-pin is unaffected: `auth-403-no-result` streams neither text nor
tool use.

The one question worth settling first is whether `Activity` should carry
the same weight as a delta or MORE, since T-069's stated limit does not
apply to it. If more, the two could diverge later — a delta is
withdrawable evidence, a tool call is not.
