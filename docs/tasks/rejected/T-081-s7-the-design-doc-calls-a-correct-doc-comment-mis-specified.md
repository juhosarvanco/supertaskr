---
id: T-081-s7
title: The cross-harness plan calls a correct doc comment "provably mis-specified", and it is seeding briefs
status: rejected
suggested_by: verifier claude-opus-5 @T-081
closed_by: 3b4326d (main, 2026-08-19 23:22) — independently, before this file was written
---

**CLOSED ON ARRIVAL, AND THE RECORD IS KEPT BECAUSE THE AGREEMENT IS
THE POINT.** Main moved during T-081's verification: `3b4326d`, *"ROADMAP
gains milestone 4; correct my ToolDenied claim in the cross-harness
plan"*, rewrites the sentence below on exactly the reasoning given here
and credits T-081's executor for refusing the brief. Three readers
reached the same conclusion independently — the executor from the card,
the verifier by tracing construction sites, and the author of the
original sentence. No work remains; what follows is the derivation, kept
so the ruling is re-checkable rather than remembered.

`docs/design/cross-harness-plan.md:170` reads:

> **Breaks in the runner's taxonomy, not the table.** `TurnError` was
> written around Claude's stream, and one variant is now provably
> mis-specified: `ToolDenied`'s own doc comment says the turn "DIED
> because a tool it needed was REFUSED" — which is **false for Claude**
> (measured §2) and **true for Codex** (published §5).

**The doc comment is not false for Claude.** Traced at `94476b4`:

- `TurnError::ToolDenied` has exactly ONE construction site in
  production code, `app/src-tauri/src/agent/runner.rs:2294`.
  (`agent/mod.rs:982` is a serde-shape test; `bin/fake_agent.rs`'s
  `Ending::ToolDenied` is a fixture-scenario enum in the fake CLI, an
  unrelated type.)
- That site is gated by
  `if result_is_error && !permission_denials.is_empty()`.
- `result_is_error` has exactly ONE write to `true`,
  `runner.rs:1961`, inside `if is_error { … }` on the terminal `result`
  arm — the CLI's own `is_error: true`.

So the variant is unreachable for a turn with `is_error: false`, and the
sentence describes every turn that actually reaches it. The 2026-08-19
capture (`is_error: false`, `terminal_reason: "completed"`) never
reaches it: it produces `RunEvent::Denied` events and a `Completed`.

**What the capture falsifies is the INFERENCE `denial => death`, not
the doc comment** — and the taxonomy's real gap was never a mis-worded
variant. It was the ABSENCE of a non-fatal denial event, which is
exactly what T-081 added as `RunEvent::Denied`. The design doc
mis-locates the defect, so its item 3 ("per-adapter denial semantics —
is a refusal fatal or recoverable") is right while the sentence
introducing it is wrong.

**This is not academic.** The sentence landed on main at `d61e986` and
was quoted as fact in T-081's dispatch brief, which instructed the
executor that the capture falsified the doc comment. The executor
declined on the card and was correct; the verifier re-derived it
independently and agreed. A third reader will be told the same wrong
thing.

**Suggested close** (a `docs/design/` fence): replace the "provably
mis-specified" claim with the accurate one — the doc comment is true of
every turn that reaches the variant, and what Claude lacks is a variant
or event for a RECOVERABLE denial, now supplied by `RunEvent::Denied`.
Keep the Codex contrast, which is the paragraph's real point: the two
harnesses differ in whether a refusal is terminal, and the
normalisation layer has to say so per adapter.

---

**A NOTE ON THE `status:` FIELD, added by T-081's second executor and
the only edit made to this file.** It read `status: closed`, which is
not one of the eight values the parser accepts (`suggested | planned |
building | verifying | rejected | merging | done | parked`) — this was
the only `status: closed` in the tree — and it turned the app suite's
dogfood body RED at 830/831 for an `invalid-field` issue naming this
file. It now reads `suggested`, which is what every other finding on
this card carries, what the parser accepts for a minimal finding file
(`suggested` and `parked` are the two that do), and what the T-083
integrator ruled a DISCHARGED finding should keep: *"discharging a
finding is not the integrator's call to record as promoted, parked or
rejected"* (docs/STATE.md). Nothing above is altered and no information
is lost — `closed_by:` and the body still say the work is done. The
mechanism that let this reach a branch tip is `T-081-s9`.
