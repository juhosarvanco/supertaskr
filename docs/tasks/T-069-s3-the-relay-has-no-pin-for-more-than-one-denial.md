---
id: T-069-s3
title: The denial relay has no pin for more than one denial, so its join can be silently reduced
status: suggested
suggested_by: verifier claude-opus-5 @T-069
---

T-069's criterion 1 says the parsed denial **NAMES** shall reach the
diagnostic ring "so `ExitNonZero`'s tail names them" — plural. The relay
implements that with
`format!("permission_denials: {}", denials.join(", "))`
(`app/src-tauri/src/agent/runner.rs:1833`) and is correct.

**Nothing drives the join with more than one name.** Both relayed
fixtures carry exactly ONE denial —
`denied-then-end-turn` (`app/src-tauri/src/bin/fake_agent.rs:269`,
`WebFetch`) and `denied-fatal-not-flagged` (`:295`, `Bash`) — and both
pins assert `stderr_tail.contains(<the one name>)`
(`app/src-tauri/tests/agent_runner.rs:1534`, `:1579`). The only
two-denial fixture is `tool-denied` (`:230`), which classifies
`ToolDenied` — a variant with no `stderr_tail` field at all
(`runner.rs:128`), so its tail is never rendered.

**Measured, twice.** Reducing the relay to the first name only —
`denials.join(", ")` → `denials.first().cloned().unwrap_or_default()` —
leaves `cargo test --test agent_runner` at **66 passed / 0 failed / 1
ignored, exit 0**. The combined form (label dropped, trailing newline
dropped, first name only) leaves the WHOLE workspace at **343 passed /
0 failed / 3 ignored, exit 0** across fifteen `test result:` lines.

**This is poison shape seven**, the one found hours before T-069 was
verified: zero survivors measured against a mutant set derived from the
PINS rather than from the CRITERIA. Every mutant the executor's twelve
rounds derived from its own pins reds correctly; the criterion's plural
was never turned into a mutant, so a mutation that silently discards
every refused tool but the first passes a 343-test suite.

**The fix is two lines.** Give `denied-fatal-not-flagged` a second
denial (`Read`, say, beside `Bash`) and assert both names in
`a_fatal_denial_the_cli_did_not_flag_as_an_error_still_names_the_tool`.
That pins the join, the separator and the ordering in one body, without
a new fixture or a new scenario.

It is filed rather than fixed because the shipped behaviour is right and
the card's criterion was measured met — this closes a coverage gap, not
a bug.
