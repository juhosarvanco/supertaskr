---
id: T-081-s2
title: The guessed denial fixture said two tools; the real turn refused one tool twice
status: suggested
suggested_by: executor claude-opus-5 @T-081
---

T-081's fifth criterion requires that *"IF the transcription changes any
assertion in the existing suite THEN the change SHALL be reported as a
finding about the guess, never quietly absorbed."* It changed exactly
one, and this card is that report.

**The assertion.** `a_turn_killed_by_a_denied_tool_names_the_tool_rather_than_the_exit_code`
in `app/src-tauri/tests/agent_runner.rs` read

    assert_eq!(denials, vec!["Bash".to_string(), "WebFetch".to_string()]);

against `fake_agent.rs`'s constructed `tool-denied` scenario, whose
`permission_denials` array named `Bash` and `WebFetch` with ids `tu_01`
and `tu_02`. It now reads `["Bash", "Bash"]`, because that is what the
capture holds.

**What really happened, and why it is one tool twice.** The 2.1.226 turn
in `docs/research/captures/real-planner-turn-2026-08-19.jsonl` was
refused twice, both times on `Bash`, for two structurally different
reasons: a compound command whose sub-commands were not all covered by
the six-pattern allowlist (`decision_reason_type: "subcommandResults"`),
and a `cp` with a glob, which is refused independently of any pattern
(`decision_reason_type: "other"`, *"Glob patterns are not allowed in
write operations."*). Two refusals of the same tool in one turn is
therefore not an edge case — it is the ordinary consequence of a
per-invocation permission gate.

**THE GUESS DID NOT MERELY DIFFER, IT SUGGESTED A WRONG KEY.** A fixture
with two distinct names lets `tool_name` look like it might identify a
denial. It cannot. T-081 needed a join between the in-band channel and
the cumulative `result` list precisely to avoid reporting one denial
twice, and `tool_name` would have joined the two Bash denials into one
and lost a real refusal. `tool_use_id` is the only field that
distinguishes them, and it is the field the constructed fixture treated
as decoration (`tu_01`, `tu_02`). The guess was harmless while nothing
read the ids, and would have been a defect the day something did.

`denial_names()` does NOT deduplicate, and should not: two refusals are
two refusals. The store does not deduplicate either, for the same reason.

**ONE THING THE TRANSCRIPTION COST, RECORDED SO IT IS NOT DISCOVERED
LATER.** No fixture on the FATAL path now carries two DISTINCT tool names
in one `permission_denials` array — `tool-denied` is two Bash entries,
`retry-401-then-tool-denied` and `denied-fatal-not-flagged` are one Bash
each, `denied-then-end-turn` is one WebFetch. The distinct-names shape
lives in `denied-live-and-silent` (Bash + WebFetch) and in
`result_denial_entries_carry_the_join_key_beside_the_name`, both on
non-fatal paths. That is coverage, not a hole — but if a future card
widens the fatal classification it should put the two-distinct-names case
back on that path rather than assume it is still there.
