//! T-025 §7: THE FAKE AGENT CLI — a canned stream-json emitter that
//! stands in for the user's real agent in every suite.
//!
//! NO MODEL IS EVER CALLED, here or anywhere in the cargo suites. This
//! binary is the whole reason that claim holds: it speaks the adapter's
//! `StreamJsonV1` protocol from a script, records everything it was
//! handed (argv, environment, stdin, cwd, pid), and plays the failure
//! scenarios §6 types.
//!
//! It is a compiled Rust `[[bin]]`, not a shell script — that is this
//! task's answer to the card's "fixture packaging portable to Windows"
//! question: `#!/bin/sh` is unix-only and needs exec-bit games, while
//! `cargo` builds this everywhere and hands its path to the integration
//! test as `CARGO_BIN_EXE_fake_agent`.
//!
//! It is ALWAYS BUILT and NEVER BUNDLED. Always built because
//! `CARGO_BIN_EXE_*` is unset for required-features binaries under the
//! CONVENTIONS-verbatim bare `cargo test`, so a feature gate would break
//! the documented suite command; never bundled because `tauri.conf.json`
//! declares no `externalBin` and the bundler copies only the app's main
//! binary (asserted in the integration suite).
//!
//! SCENARIO SELECTION IS A TEST-SIDE SURFACE. The two variables below are
//! read by THIS binary, set by the TEST on the child it spawns. Production
//! has no environment-variable binary override of any kind: the runner's
//! `RunnerConfig` seam fields are Rust-only, and
//! `default_config_reads_nothing_from_the_environment` pins that.

use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;

fn main() {
    let argv: Vec<String> = std::env::args().collect();

    // T-047: THE TATTLE. If this binary is executed AT ALL — including by
    // the `--version` probe, which is what a poisoned `agent-paths.json`
    // reaches FIRST, before any turn — it writes a file naming its own
    // argv. The poisoned-cache proof is the ABSENCE of that file: a cached
    // path the runner refuses is a path that never became a process.
    if let Ok(tattle) = std::env::var("NPUTER_FAKE_TATTLE") {
        if let Some(parent) = Path::new(&tattle).parent() {
            let _ = fs::create_dir_all(parent);
        }
        let _ = fs::write(&tattle, format!("EXECUTED {argv:?}\n"));
    }

    // The version probe: answer and exit, without disturbing the turn
    // dumps (the runner probes the version at every resolution).
    if argv.iter().any(|a| a == "--version") {
        let version = std::env::var("NPUTER_FAKE_VERSION")
            .unwrap_or_else(|_| "2.1.226 (Claude Code)".to_string());
        println!("{version}");
        return;
    }

    let scenario = std::env::var("NPUTER_FAKE_SCENARIO").unwrap_or_else(|_| "happy".to_string());
    let dump = std::env::var("NPUTER_FAKE_DUMP_DIR").ok().map(PathBuf::from);

    // The grandchild exists only to prove the process-group kill reaches
    // a process the runner never knew about.
    if scenario == "grandchild" {
        sleep_forever();
        return;
    }
    // T-043: THE PERMANENT SIGTERM-RESISTANT FIXTURES. Before this task
    // there were NONE — the T-025 verifier built resistant processes by
    // hand, measured them and deleted them, so nothing in the committed
    // suite had ever met a process that refuses SIGTERM. These two are
    // that shape, kept.
    //
    // `sleeper-resistant` is the leaf: it ignores SIGTERM and sleeps, so
    // only SIGKILL removes it. It stands in BOTH roles — a resistant
    // direct child spawned straight by a test, and the resistant
    // same-group grandchild of `hang-resistant-grandchild` below.
    //
    // SIG_IGN SURVIVES `exec`, which is why the disposition is installed
    // HERE, by the process that needs it, and never by its parent: a
    // `hang-resistant-grandchild` parent that ignored SIGTERM would hand
    // that immunity down AND keep it, and that scenario needs exactly one
    // of the two to be resistant.
    if scenario == "sleeper-resistant" {
        ignore_sigterm();
        announce_ready(dump.as_deref());
        sleep_forever();
        return;
    }
    // The cooperative control for the same shape: no stream, no
    // grandchild, dies on the first SIGTERM.
    if scenario == "sleeper" {
        announce_ready(dump.as_deref());
        sleep_forever();
        return;
    }

    let mut stdin_text = String::new();
    let _ = std::io::stdin().read_to_string(&mut stdin_text);

    let turn_dir = dump.as_deref().map(|dir| next_turn_dir(dir));
    if let Some(turn_dir) = &turn_dir {
        record(turn_dir, &argv[1..], &stdin_text);
    }

    // A resumed turn echoes the id it was given back through its init
    // line, which is what makes the resume round trip assertable.
    let resumed = argv
        .iter()
        .position(|a| a == "--resume")
        .and_then(|i| argv.get(i + 1))
        .cloned();
    let session_id = resumed.unwrap_or_else(|| "fake-session-0001".to_string());
    let model = std::env::var("NPUTER_FAKE_MODEL").unwrap_or_else(|_| "fake-model-1".to_string());

    match scenario.as_str() {
        "happy" => {
            emit_init(&session_id, &model);
            emit_delta("Hello");
            emit_delta(", founder");
            emit_delta(". What are we building?");
            emit_tool_use("Write");
            emit_result("Hello, founder. What are we building?");
        }
        "noisy" => {
            // Real CLIs warn on stdout and grow new event types; both are
            // tolerated (§6: non-JSON into the ring, unknown types ignored).
            println!("warning: this is not JSON and must not fail the turn");
            emit_init(&session_id, &model);
            println!(r#"{{"type":"a_brand_new_event_type","payload":42}}"#);
            emit_delta("still fine");
            emit_result("still fine");
        }
        "writes-docs" => {
            // The AGENT is the writer of docs/ (ADR-017). This is what
            // lights the existing watcher pipeline.
            emit_init(&session_id, &model);
            let target = Path::new("docs");
            let _ = fs::create_dir_all(target);
            let _ = fs::write(
                target.join("NORTH_STAR.md"),
                "# North star\n\nWritten by the (fake) planner.\n",
            );
            emit_tool_use("Write");
            emit_result("banked docs/NORTH_STAR.md");
        }
        "hang" => {
            emit_init(&session_id, &model);
            // A grandchild in the same process group: killing only the
            // direct child would leave this one running.
            spawn_grandchild("grandchild", turn_dir.as_deref());
            sleep_forever();
        }
        // T-043: a turn whose DIRECT child refuses to leave. The grace
        // must be paid in full, SIGKILL must follow, and the child must
        // still be reaped — no zombie behind the fix.
        "hang-resistant" => {
            emit_init(&session_id, &model);
            ignore_sigterm();
            announce_ready(dump.as_deref());
            sleep_forever();
        }
        // T-043's CENTRAL CASE, and the one a naive `child.try_wait()`
        // followed by `return` gets wrong: the direct child is
        // COOPERATIVE (it dies on the first SIGTERM and is reaped
        // immediately) while a same-group grandchild IGNORES SIGTERM. An
        // early release on the reap alone leaves that grandchild running
        // with nothing left that would ever escalate.
        "hang-resistant-grandchild" => {
            emit_init(&session_id, &model);
            spawn_grandchild("sleeper-resistant", turn_dir.as_deref());
            sleep_forever();
        }
        // T-082 RULED ON THIS LINE'S PROVENANCE, AND THE ANSWER IS
        // **COMPOSED — NOT TRANSCRIBED**. It is the fixture's own voice,
        // written to give `exitNonZero` a non-empty stderr tail; it is not
        // a stand-in for anything the real CLI has ever printed, and it
        // must not be read as one. Four independent facts, none of them
        // remembered:
        //   1. It carries this binary's own `fake-agent: ` prefix, the
        //      same prefix as its three unambiguously-own diagnostics
        //      (unknown scenario / no current_exe / could not fork).
        //   2. It predates the observation it would have had to
        //      transcribe. This line was written at `74a0274`
        //      (2026-08-16 11:41), the T-025 scaffold; the 2.1.226 auth
        //      smoke was run and recorded eighteen minutes later at
        //      `1cb08ba`, which is the commit that added `auth-error`
        //      below.
        //   3. THE REAL CLI WRITES NOTHING TO STDERR WHEN IT CANNOT
        //      AUTHENTICATE. That smoke reported `stderrTail: ""`, and
        //      `docs/research/real-cli-observation.md` (2026-08-19,
        //      2.1.226) reconfirms "zero bytes on stderr … this CLI
        //      reports in band" — so there is no real stderr line here to
        //      transcribe.
        //   4. The words the CLI really does emit are on its `result`
        //      line and name no command at all: "Failed to authenticate.
        //      API Error: 401 OAuth access token has been revoked." The
        //      scenario that transcribes them is `auth-error`, below.
        // THE TEXT IS LEFT VERBATIM ANYWAY, and the `claude login` inside
        // it is now a command the app deliberately does NOT recommend
        // (T-082 moved the app's advice to `claude auth login`). That
        // makes this fixture a small standing witness for the same card's
        // rule that the app's advice is its own: a CLI naming one command
        // never moves what the screen prints.
        "nonzero" => {
            emit_init(&session_id, &model);
            eprintln!("fake-agent: credentials expired, please run `claude login`");
            std::process::exit(3);
        }
        // THE REAL AUTH-FAILURE SHAPE, transcribed from the 2.1.226 smoke
        // (implementation notes record the captured lines): the CLI
        // reports the failure IN BAND on stdout — an `api_retry` system
        // line, then a `result` line whose `subtype` still reads
        // "success" while `is_error` is true — exits 1, and writes
        // NOTHING to stderr. A runner that only tails stderr shows the
        // user an empty explanation.
        "auth-error" => auth_error(&session_id, &model, true, false),
        // T-069: THE AUTH FAILURE THAT SPOKE FIRST. Same transcribed
        // ending, with a text delta between the diagnostic and the
        // terminal line — a CLI that streamed a few words before its
        // credentials were refused. It exists to hold T-069's own
        // discriminator honest: model text is evidence the CLI got past
        // a status, but a TERMINAL LINE naming the status again
        // outranks it, and without this stream the line that says so
        // has nothing that would fail if it were deleted.
        "auth-error-after-text" => auth_error(&session_id, &model, true, true),
        // T-069: THE TRANSCRIBED TURN MINUS ITS `api_retry` LINE, so the
        // `result` line is the ONLY carrier of the status. This is the
        // pin for the false NEGATIVE T-029's terminal-line rule
        // introduced (disclosed in `runner.rs` beside `auth_status =
        // api_error_status;`): that rule is safe against 2.1.226 ONLY
        // because 2.1.226 puts `api_error_status` on the terminal line
        // itself. A CLI version that moved the status into the
        // diagnostic and left the `result` line bare would stop being
        // typed `AuthFailed` — silently, since `auth-error` above would
        // still classify off its diagnostic. This stream has no
        // diagnostic to fall back on, so moving the status REDS here.
        "auth-error-result-only" => auth_error(&session_id, &model, false, false),
        // T-029 (T-025-s1): THE TOO-NARROW-ALLOWLIST SHAPE — the turn
        // that DIES of a refusal, which is what `ToolDenied` exists for.
        //
        // **T-081 REPLACED THE HONESTY NOTE THAT USED TO SIT HERE, AND
        // THE REPLACEMENT IS NARROWER RATHER THAN GONE.** The old note
        // said the whole shape was constructed, because this machine's
        // login was revoked and no denial could be provoked. A real
        // denial has since been captured
        // (`docs/research/captures/real-planner-turn-2026-08-19.jsonl`,
        // 2.1.226, 2026-08-19), so this scenario is now HALF transcribed
        // and half constructed, and the halves are named:
        //
        //   TRANSCRIBED, byte for byte off that capture — the two
        //   in-band `permission_denied` lines emitted by
        //   `emit_observed_denials()` below, and both `permission_denials`
        //   entries: the real `tool_use_id`s, the real `tool_input`
        //   objects, and the real fact that **BOTH DENIALS NAME `Bash`**.
        //   The guess said `Bash` and `WebFetch`; reality refused the
        //   same tool twice, which is why `tool_use_id` and not
        //   `tool_name` is the join key T-081 needs (see `T-081-s2`).
        //
        //   STILL CONSTRUCTED, and unverifiable until a fatal denial is
        //   observed: the ENDING. `is_error: true`,
        //   `terminal_reason: "refusal"` and exit 1 are what a turn that
        //   DIED of a refusal is guessed to look like. The observed turn
        //   did not die — it read `is_error: false`,
        //   `terminal_reason: "completed"`, exit 0, and it is transcribed
        //   whole as `denied-then-completed` below. That is the shape
        //   T-029-s5 asked about and got: the guessed `"refusal"` was
        //   never seen, and `"completed"` is what a denial-bearing turn
        //   really reports when the planner routes around it.
        "tool-denied" => {
            emit_init(&session_id, &model);
            emit_delta("I need to remove the scaffold I just wrote");
            emit_observed_denials(&session_id);
            println!(
                "{}",
                serde_json::json!({
                    "type": "result", "subtype": "success", "is_error": true,
                    "terminal_reason": "refusal", "num_turns": 1,
                    "permission_denials": observed_denial_entries(),
                    "result": "I was not permitted to run the tools this stage needs."
                })
            );
            std::process::exit(1);
        }
        // T-081: **THE OBSERVED TURN, END TO END** — the whole point of
        // the capture and the one scenario in this file that transcribes
        // a turn nobody had to guess at.
        //
        // Two `permission_denied` lines announce refusals as they happen;
        // the planner then decomposes the refused command and carries on
        // (roughly forty seconds of recovery work in the real run, and a
        // second delta here to stand for it); the `result` line reports
        // `is_error: false`, `terminal_reason: "completed"` with BOTH
        // denials listed cumulatively, and the process exits **0**.
        //
        // A DENIAL IS NOT A FAILURE, and this stream is the proof. Any
        // rule that reads a denial as a cause of death fails this turn,
        // which is a real turn that really succeeded.
        //
        // **THE TOOL USE AFTER THE DENIALS IS LOAD-BEARING, NOT
        // DECORATION.** It is what makes "surfaced live" assertable, and
        // it has to be a `tool_use` rather than a delta: deltas are
        // COALESCED, so one emitted after the denials still flushes at
        // the end of the relay loop and lands behind a batched denial
        // too. A `tool_use` becomes an `Activity` event immediately, so
        // a runner that held its denials back to the `result` line would
        // put both of them AFTER this marker instead of before it.
        //
        // It is also what the real turn did: the planner answered the
        // refusal by decomposing the command and running the pieces.
        "denied-then-completed" => {
            emit_init(&session_id, &model);
            emit_delta("Let me scaffold the docs tree.");
            emit_observed_denials(&session_id);
            emit_tool_use("Bash");
            emit_delta(" Splitting that into single-verb commands instead.");
            println!(
                "{}",
                serde_json::json!({
                    "type": "result", "subtype": "success", "is_error": false,
                    "api_error_status": serde_json::Value::Null,
                    "terminal_reason": "completed", "stop_reason": "end_turn",
                    "num_turns": 32,
                    "permission_denials": observed_denial_entries(),
                    "result": "Stage 0 done - docs/ scaffolded from templates."
                })
            );
        }
        // T-081 criterion 4: **THE MIXED TURN, WHERE THE PARTITION
        // ACTUALLY PARTITIONS.** One denial arrives on BOTH channels —
        // in band as it happens, then again in the `result` line's
        // cumulative record — and a second arrives ONLY on the `result`
        // line, as it would from a CLI build with no in-band channel at
        // all. A correct join reports each exactly once, which is TWO
        // events; dropping the join gives three, and dropping the late
        // emit gives one.
        //
        // Constructed, and openly: no observed turn mixes the two,
        // because 2.1.226 announces every denial in band. That is the
        // point — the mixed shape is what a runner has to survive when a
        // line is lost or a CLI is older, and it cannot be captured from
        // a CLI that never produces it.
        //
        // The turn exits 0, so `stderr_tail` never reaches the screen and
        // T-069's ring relay cannot be what reports the silent one.
        "denied-live-and-silent" => {
            emit_init(&session_id, &model);
            println!(
                "{}",
                serde_json::json!({
                    "type": "system", "subtype": "permission_denied",
                    "tool_name": "Bash", "tool_use_id": "toolu_on_both_channels",
                    "decision_reason_type": "subcommandResults",
                    "message": "This Bash command contains multiple operations.",
                    "session_id": session_id
                })
            );
            // The liveness witness, for the reason `denied-then-completed`
            // records: an `Activity` is emitted the instant it arrives,
            // where a delta waits for the coalescing window.
            emit_tool_use("Write");
            println!(
                "{}",
                serde_json::json!({
                    "type": "result", "subtype": "success", "is_error": false,
                    "terminal_reason": "completed", "num_turns": 1,
                    "permission_denials": [
                        { "tool_name": "Bash", "tool_use_id": "toolu_on_both_channels" },
                        { "tool_name": "WebFetch", "tool_use_id": "toolu_result_line_only" }
                    ],
                    "result": "Here is your first question."
                })
            );
        }
        // T-081 criterion 4, and this is the stream the JOIN KEY ITSELF
        // turns on: **THE SAME TOOL REFUSED TWICE, WITH ONLY ONE OF THE
        // TWO REFUSALS ANNOUNCED IN BAND.**
        //
        // Its two neighbours cannot see the key at all, and the reason
        // is worth stating because it is the same blind spot twice:
        // `denied-then-completed` announces BOTH of its denials, so a
        // join on `tool_name` filters both and the count is still right;
        // `denied-live-and-silent` gives its two ids DIFFERENT names, so
        // a join on `tool_name` separates them just as cleanly as a join
        // on `tool_use_id`. Over this stream it cannot: both entries
        // name `Bash`, so a name join reads the SECOND refusal as one it
        // has already announced and drops it.
        //
        // **THE FAILURE DIRECTION IS SILENCE** — a refusal the CLI
        // reported reaches nobody — which is the defect this whole card
        // exists to fix, not the duplicate that would merely be a
        // nuisance.
        //
        // HALF TRANSCRIBED, and the halves are named the way
        // `tool-denied`'s are. TRANSCRIBED: the census `["Bash", "Bash"]`
        // is the observed turn's own
        // (`docs/research/captures/real-planner-turn-2026-08-19.jsonl`,
        // 2.1.226) — one tool refused twice, which is exactly what made
        // the old `["Bash", "WebFetch"]` guess able to hide this, and is
        // `T-081-s2`'s whole subject. CONSTRUCTED, openly: the MISSING
        // in-band line. 2.1.226 announces every denial it makes, so a
        // partial announcement cannot be captured from it — but a lost
        // or malformed line, and the runner's own `MAX_DENIALS` cap on
        // LIVE emits (which deliberately leaves the late channel to
        // report the rest), both produce exactly this shape against a
        // CLI that refuses one tool repeatedly.
        //
        // The ids are self-describing rather than the capture's real
        // ones so that an assertion failure names WHICH channel was
        // lost; `tool_use_id` is opaque to the runner and its bytes
        // carry no behaviour.
        //
        // The `emit_tool_use` between is the liveness witness, for the
        // reason `denied-then-completed` records at length: a delta is
        // coalesced and therefore dates nothing.
        "denied-same-tool-one-announced" => {
            emit_init(&session_id, &model);
            println!(
                "{}",
                serde_json::json!({
                    "type": "system", "subtype": "permission_denied",
                    "tool_name": "Bash", "tool_use_id": "toolu_announced",
                    "decision_reason_type": "subcommandResults",
                    "message": "This Bash command contains multiple operations.",
                    "session_id": session_id
                })
            );
            emit_tool_use("Bash");
            println!(
                "{}",
                serde_json::json!({
                    "type": "result", "subtype": "success", "is_error": false,
                    "terminal_reason": "completed", "num_turns": 1,
                    "permission_denials": [
                        { "tool_name": "Bash", "tool_use_id": "toolu_announced" },
                        { "tool_name": "Bash", "tool_use_id": "toolu_never_announced" }
                    ],
                    "result": "Stage 0 done - docs/ scaffolded from templates."
                })
            );
        }
        // T-081 criteria 2 and 6: THE DENIAL LINE THAT BARELY DESCRIBES
        // ITSELF. Constructed, deliberately and openly — the CLI has
        // never been seen to write either of these, and that is exactly
        // why they are here: the runner must not depend on fields the
        // capture happens to carry.
        //
        // Line one has NO `tool_name`, an EMPTY `message`, and a
        // `tool_use_id` no `result` entry corroborates. Line two is far
        // past the module's byte bound and carries nothing else, so the
        // BOUND is what the pin measures. Line three is short and stuffed
        // with control bytes, so the STRIPPING is what the pin measures.
        //
        // THE TWO ARE SEPARATE LINES BECAUSE THEY MEASURE DIFFERENT
        // THINGS, and putting them on one line hides both: the bound is
        // applied to the CLI's raw bytes and the escaping runs AFTER it,
        // so a control character inside a truncated string makes the
        // result LONGER than the bound. Measured — 768 bytes in, 774 out
        // for one newline and one ESC — which is correct behaviour and a
        // useless assertion.
        //
        // The turn then COMPLETES with an EMPTY `permission_denials`
        // array, so nothing on the terminal line would ever have
        // mentioned any of them.
        "denied-partial-fields" => {
            emit_init(&session_id, &model);
            println!(
                "{}",
                serde_json::json!({
                    "type": "system", "subtype": "permission_denied",
                    "tool_use_id": "toolu_orphan_no_name",
                    "decision_reason_type": "other",
                    "message": "",
                    "session_id": session_id
                })
            );
            println!(
                "{}",
                serde_json::json!({
                    "type": "system", "subtype": "permission_denied",
                    "tool_name": "Bash", "tool_use_id": "toolu_orphan_long",
                    "decision_reason_type": "other",
                    "message": "Z".repeat(4000),
                    "session_id": session_id
                })
            );
            println!(
                "{}",
                serde_json::json!({
                    "type": "system", "subtype": "permission_denied",
                    "tool_name": "Write", "tool_use_id": "toolu_orphan_loud",
                    "decision_reason_type": "other",
                    "message": "refused:\nbecause\u{1b}[31m of a rule",
                    "session_id": session_id
                })
            );
            println!(
                "{}",
                serde_json::json!({
                    "type": "result", "subtype": "success", "is_error": false,
                    "terminal_reason": "completed", "num_turns": 1,
                    "permission_denials": [],
                    "result": "I worked around all of those."
                })
            );
        }
        // T-029-s6: THE RECOVERED RETRY — the third case the first build
        // did not have a fixture for. `auth-error` above is a turn that
        // DIED of the 401; `happy` is a turn that never saw one. These
        // four are the turn in between: an `api_retry` 401 the CLI
        // retried and got PAST — its own line says `max_retries: 10`, and
        // a budget of ten exists because some of them succeed — followed
        // by a failure that has nothing to do with authentication.
        //
        // THE CONTROL SHARES THE CODE PATH. `retry_then(with_retry: bool)`
        // is one emitter, so `enospc-no-retry` is `retry-401-then-enospc`
        // MINUS EXACTLY ONE LINE by construction rather than by two
        // scenarios agreeing to stay in step. That single line is the
        // whole discriminator these pins turn on.
        "retry-401-then-enospc" => retry_then(&session_id, &model, true, Ending::Enospc),
        "enospc-no-retry" => retry_then(&session_id, &model, false, Ending::Enospc),
        "retry-401-then-clean-result" => retry_then(&session_id, &model, true, Ending::CleanResult),
        "retry-401-then-tool-denied" => retry_then(&session_id, &model, true, Ending::ToolDenied),
        // T-029-s7: a denial the planner ROUTED AROUND. The turn finished
        // normally — `is_error: false`, `terminal_reason: "end_turn"` —
        // and `permission_denials` is the cumulative record of what was
        // refused along the way, not a statement that a refusal ended it.
        // The process then exits nonzero for its own reasons.
        "denied-then-end-turn" => {
            emit_init(&session_id, &model);
            emit_delta("I could not fetch that, so I will ask you instead.");
            println!(
                "{}",
                serde_json::json!({
                    "type": "result", "subtype": "success", "is_error": false,
                    "terminal_reason": "end_turn", "num_turns": 1,
                    "permission_denials": [
                        { "tool_name": "WebFetch", "tool_use_id": "tu_07" }
                    ],
                    "result": "Here is your first question."
                })
            );
            std::process::exit(1);
        }
        // T-069: THE FATAL DENIAL THE CLI DID NOT FLAG. The turn really
        // died of the refusal — `terminal_reason: "refusal"`, the same
        // sentence `tool-denied` carries — but `is_error` is FALSE, so
        // T-029-s7's deliberately narrow guard DECLINES to claim it and
        // the turn is a plain `ExitNonZero`. That decline is right (the
        // wider `terminal_reason` guard needs the set T-029-s5 records
        // as unverified) and it is exactly where the relay has to work:
        // `is_error: false` also means the `result` text never reaches
        // the ring, so before T-069 this turn arrived with an EMPTY
        // tail and the screen read "the planner exited with code 1"
        // with nothing under it.
        "denied-fatal-not-flagged" => {
            emit_init(&session_id, &model);
            println!(
                "{}",
                serde_json::json!({
                    "type": "result", "subtype": "success", "is_error": false,
                    "terminal_reason": "refusal", "num_turns": 1,
                    "permission_denials": [
                        { "tool_name": "Bash", "tool_use_id": "tu_11" }
                    ],
                    "result": "I was not permitted to run the tools this stage needs."
                })
            );
            std::process::exit(1);
        }
        // T-029-s6's counter-pin: the case the fix must NOT break. A
        // diagnostic-only auth failure — status 403, and the CLI dies
        // before it writes any `result` line at all, so there is no
        // terminal line to clear the status. This must stay `AuthFailed`.
        "auth-403-no-result" => {
            emit_init(&session_id, &model);
            println!(
                "{}",
                serde_json::json!({
                    "type": "system", "subtype": "api_retry", "attempt": 1,
                    "max_retries": 10, "retry_delay_ms": 508,
                    "error_status": 403, "error": "permission_error",
                    "session_id": session_id
                })
            );
            std::process::exit(1);
        }
        // T-069: THE RESIDUAL FALSE POSITIVE AND ITS CONTROL. A recovered
        // `api_retry` 401, then MODEL TEXT — which only arrives because
        // the retry SUCCEEDED — and then the process dies without ever
        // writing a `result` line. There is no terminal verdict to clear
        // the status, so before T-069 this classified `AuthFailed` and
        // took the Try again button away from a user whose login is
        // fine. The control is the same stream minus the 401 line, and
        // as with `retry_then` both go through ONE emitter so the
        // control is the failing stream minus exactly one line by
        // construction rather than by two fixtures agreeing to stay in
        // step.
        "retry-401-then-no-result" => no_result_after(&session_id, &model, true, false),
        "no-result-no-retry" => no_result_after(&session_id, &model, false, false),
        // …and the third of the family, which keeps the discriminator
        // from over-reaching: the CLI recovers one 401, answers, and
        // then hits ANOTHER one it does not recover from. The budget
        // says `max_retries: 10`, so a turn spending two of them is
        // ordinary. The text sits between the two statuses, so it is
        // evidence about the FIRST and says nothing about the second —
        // which is why the runner scopes its flag to the LAST
        // status-bearing line rather than to any status ever seen.
        "retry-401-text-then-401-no-result" => no_result_after(&session_id, &model, true, true),
        // T-039: an init line carrying a HOSTILE session id — the fixture
        // for the capture-side gate. The id is the test's own choice
        // (`NPUTER_FAKE_SESSION_ID`), defaulting to the exact injection the
        // T-025 verifier measured. A CLI that emits this is either
        // compromised or is not the CLI we think it is; either way the id
        // must never reach argv, the registry, or a resume.
        "hostile-id" => {
            let hostile = std::env::var("NPUTER_FAKE_SESSION_ID")
                .unwrap_or_else(|_| "--dangerously-skip-permissions".to_string());
            emit_init(&hostile, &model);
            emit_delta("the id in my init line is a flag, not an id");
            emit_result("this turn must not be relayed as an answer");
        }
        "no-init" => {
            // A first turn with no init line: the session id can never be
            // captured, so the turn is MalformedStream.
            emit_delta("talking without introducing myself");
            emit_result("no init line here");
        }
        "malformed-flood" => {
            for i in 0..50 {
                println!("this is not json at all, line {i}");
            }
        }
        "oversize-line" => {
            emit_init(&session_id, &model);
            println!("{}", "x".repeat(1024 * 1024 + 64));
            emit_result("never read");
        }
        "exit-no-result" => {
            emit_init(&session_id, &model);
            emit_delta("started but never finished");
        }
        "slow-start" => sleep_forever(),
        "slow-mid" => {
            emit_init(&session_id, &model);
            emit_delta("one word");
            sleep_forever();
        }
        other => {
            eprintln!("fake-agent: unknown scenario {other:?}");
            std::process::exit(64);
        }
    }
}

/// Record everything the runner handed this process. This IS the
/// assertion channel: argv (no prompt, no shell string), the full
/// environment (the canary must be absent), stdin (the prompt), cwd (the
/// project dir) and the pid (the group-kill proof).
fn record(turn_dir: &Path, args: &[String], stdin_text: &str) {
    let _ = fs::create_dir_all(turn_dir);
    let _ = fs::write(
        turn_dir.join("argv.json"),
        serde_json::to_vec_pretty(&args).unwrap_or_default(),
    );
    let env: std::collections::BTreeMap<String, String> = std::env::vars().collect();
    let _ = fs::write(
        turn_dir.join("env.json"),
        serde_json::to_vec_pretty(&env).unwrap_or_default(),
    );
    let _ = fs::write(turn_dir.join("stdin.txt"), stdin_text);
    let _ = fs::write(
        turn_dir.join("cwd.txt"),
        std::env::current_dir().unwrap_or_default().display().to_string(),
    );
    let _ = fs::write(turn_dir.join("pid.txt"), std::process::id().to_string());
}

/// `<dump>/turn-1`, `<dump>/turn-2`, … so the resume round trip is
/// assertable turn by turn.
fn next_turn_dir(dump: &Path) -> PathBuf {
    let _ = fs::create_dir_all(dump);
    for n in 1..1000 {
        let candidate = dump.join(format!("turn-{n}"));
        if !candidate.exists() {
            let _ = fs::create_dir_all(&candidate);
            return candidate;
        }
    }
    dump.join("turn-overflow")
}

fn sleep_forever() {
    loop {
        std::thread::sleep(Duration::from_secs(3600));
    }
}

/// Fork one more copy of this binary INTO THE SAME PROCESS GROUP —
/// `Command` without `process_group`, so the pgid is inherited — and
/// record its pid where the test can read it. That inheritance is the
/// whole point: the runner never learns this pid, and only a GROUP signal
/// reaches it.
fn spawn_grandchild(scenario: &str, turn_dir: Option<&Path>) {
    let exe = match std::env::current_exe() {
        Ok(exe) => exe,
        Err(err) => {
            eprintln!("fake-agent: no current_exe: {err}");
            return;
        }
    };
    let mut command = Command::new(exe);
    command.env("NPUTER_FAKE_SCENARIO", scenario);
    match command.spawn() {
        Ok(child) => {
            if let Some(turn_dir) = turn_dir {
                let _ = fs::write(turn_dir.join("grandchild-pid.txt"), child.id().to_string());
            }
        }
        Err(err) => eprintln!("fake-agent: could not fork a grandchild: {err}"),
    }
}

/// THE HANDSHAKE THAT MAKES THE RESISTANT FIXTURES DETERMINISTIC.
///
/// `Command::spawn` returns as soon as the fork succeeds; the child only
/// installs its SIGTERM disposition after `exec`, several milliseconds
/// later. A test that signals immediately therefore lands in the window
/// where a "resistant" process is still running the DEFAULT disposition
/// and dies like a cooperative one — measured, not imagined: the first
/// run of `a_resistant_direct_child_costs_the_full_grace…` reaped its
/// resistant child in 27 ms.
///
/// So the disposition is announced. The test waits for this file, and
/// what it waits for is the fact it depends on, rather than a sleep long
/// enough to usually be true.
fn announce_ready(dump: Option<&Path>) {
    if let Some(dump) = dump {
        let _ = fs::create_dir_all(dump);
        let _ = fs::write(dump.join(READY_MARKER), std::process::id().to_string());
    }
}

/// `<dump>/ready.txt` — written by the sleeper scenarios once they are in
/// the state the test is about to measure.
pub const READY_MARKER: &str = "ready.txt";

/// Refuse SIGTERM, so only SIGKILL ends this process.
///
/// `signal` is in libc, which is already linked into every Rust unix
/// binary — the same zero-new-crates route `runner.rs`'s `killpg`/`kill`
/// declarations take. `SIG_IGN` is the pointer constant 1.
#[cfg(unix)]
fn ignore_sigterm() {
    extern "C" {
        fn signal(sig: i32, handler: usize) -> usize;
    }
    const SIGTERM: i32 = 15;
    const SIG_IGN: usize = 1;
    unsafe {
        signal(SIGTERM, SIG_IGN);
    }
}
#[cfg(not(unix))]
fn ignore_sigterm() {}

fn emit_init(session_id: &str, model: &str) {
    println!(
        "{}",
        serde_json::json!({
            "type": "system",
            "subtype": "init",
            "session_id": session_id,
            "model": model,
            "cwd": std::env::current_dir().unwrap_or_default().display().to_string(),
            "permissionMode": "acceptEdits"
        })
    );
}

fn emit_delta(text: &str) {
    println!(
        "{}",
        serde_json::json!({
            "type": "stream_event",
            "event": {
                "type": "content_block_delta",
                "index": 0,
                "delta": { "type": "text_delta", "text": text }
            }
        })
    );
}

fn emit_tool_use(name: &str) {
    println!(
        "{}",
        serde_json::json!({
            "type": "assistant",
            "message": { "role": "assistant", "content": [
                { "type": "tool_use", "id": "toolu_fake", "name": name, "input": {} }
            ]}
        })
    );
}

/// How a `retry_then` stream ENDS — the part that is the turn's actual
/// cause of death, none of which is authentication.
enum Ending {
    /// A full disk, reported the way the CLI reports its own errors:
    /// `is_error: true` with the message on the `result` line.
    Enospc,
    /// A turn that ANSWERED — `is_error: false`, a real question in the
    /// result — whose process then exits 1 anyway.
    CleanResult,
    /// A REAL tool denial, the exact shape `ToolDenied` exists for,
    /// standing behind the recovered 401.
    ToolDenied,
}

/// T-029-s6's stream: init · [the recovered `api_retry` 401] · a text
/// delta · a terminal `result` line that names the REAL cause · exit 1.
///
/// `with_retry` is the ONE line that separates the masking rows from the
/// control. Both go through this function on purpose: a control that is
/// "the same stream minus one line" has to be the same code minus one
/// line, or it decays into a second fixture that drifts.
fn retry_then(session_id: &str, model: &str, with_retry: bool, ending: Ending) {
    emit_init(session_id, model);
    if with_retry {
        // Byte-for-byte the `auth-error` scenario's line — the CLI
        // announcing its retry machinery, budget and all.
        println!(
            "{}",
            serde_json::json!({
                "type": "system", "subtype": "api_retry", "attempt": 1,
                "max_retries": 10, "retry_delay_ms": 508,
                "error_status": 401, "error": "authentication_failed",
                "session_id": session_id
            })
        );
    }
    match ending {
        Ending::Enospc => {
            emit_delta("Let me write the north star.");
            println!(
                "{}",
                serde_json::json!({
                    "type": "result", "subtype": "success", "is_error": true,
                    "terminal_reason": "error_during_execution", "num_turns": 1,
                    "result": "Error: ENOSPC: no space left on device, write '/Users/x/docs/NORTH_STAR.md'"
                })
            );
        }
        Ending::CleanResult => {
            emit_delta("Here is your first question.");
            println!(
                "{}",
                serde_json::json!({
                    "type": "result", "subtype": "success", "is_error": false,
                    "num_turns": 1,
                    "result": "Here is your first question."
                })
            );
        }
        Ending::ToolDenied => {
            println!(
                "{}",
                serde_json::json!({
                    "type": "result", "subtype": "success", "is_error": true,
                    "terminal_reason": "refusal", "num_turns": 1,
                    "permission_denials": [
                        { "tool_name": "Bash", "tool_use_id": "tu_01" }
                    ],
                    "result": "I was not permitted to run the tools this stage needs."
                })
            );
        }
    }
    std::process::exit(1);
}

/// T-069: the transcribed 2.1.226 auth failure — init · [the `api_retry`
/// system line carrying `error_status: 401`] · a `result` line whose
/// `subtype` still reads "success" while `is_error` is true AND which
/// carries an `api_error_status` OF ITS OWN · exit 1, stderr empty.
///
/// `with_retry_line` is the one line between `auth-error` and
/// `auth-error-result-only`, and `with_text` the one line between
/// `auth-error` and `auth-error-after-text`. All three go through this
/// emitter for the same reason `retry_then` exists: a stream that is
/// "the other stream minus one line" has to be the same code minus one
/// line, or the transcription can move on one side and not the other.
/// **What `auth-error-result-only` watches is precisely that the
/// `result` line still carries the status**, because that is the whole
/// reason T-029's terminal-line rule costs 2.1.226 nothing.
fn auth_error(session_id: &str, model: &str, with_retry_line: bool, with_text: bool) {
    emit_init(session_id, model);
    if with_retry_line {
        println!(
            "{}",
            serde_json::json!({
                "type": "system", "subtype": "api_retry", "attempt": 1,
                "max_retries": 10, "retry_delay_ms": 508,
                "error_status": 401, "error": "authentication_failed",
                "session_id": session_id
            })
        );
    }
    if with_text {
        emit_delta("Let me get started on that.");
    }
    println!(
        "{}",
        serde_json::json!({
            "type": "result", "subtype": "success", "is_error": true,
            "api_error_status": 401, "terminal_reason": "api_error",
            "num_turns": 1,
            "result": "Failed to authenticate. API Error: 401 OAuth access token has been revoked."
        })
    );
    std::process::exit(1);
}

/// T-069's stream for the residual false positive: init · [the recovered
/// `api_retry` 401] · a text delta · **no `result` line at all** ·
/// exit 1.
///
/// The delta is the load-bearing line, not decoration. Model text can
/// only be streamed by a request that SUCCEEDED, so text arriving after
/// the last status-bearing diagnostic is the stream's own evidence that
/// the CLI got past the 401 — which is what `runner.rs` classifies on.
/// The control (`with_retry: false`) is the same stream minus the 401,
/// which is what makes the other row's classification mean what it says.
/// `second_retry` adds a SECOND 401 after the text, which the text
/// cannot be evidence about — the row that keeps the discriminator from
/// eating a genuine auth failure it has no business claiming.
fn no_result_after(session_id: &str, model: &str, with_retry: bool, second_retry: bool) {
    emit_init(session_id, model);
    if with_retry {
        emit_api_retry_401(session_id, 1);
    }
    emit_delta("Right, let me start on the north star.");
    if second_retry {
        emit_api_retry_401(session_id, 2);
    }
    std::process::exit(1);
}

/// The `api_retry` diagnostic, byte-for-byte the transcribed one apart
/// from `attempt`. One emitter so the two places that stream it cannot
/// drift into two different transcriptions.
fn emit_api_retry_401(session_id: &str, attempt: u32) {
    println!(
        "{}",
        serde_json::json!({
            "type": "system", "subtype": "api_retry", "attempt": attempt,
            "max_retries": 10, "retry_delay_ms": 508,
            "error_status": 401, "error": "authentication_failed",
            "session_id": session_id
        })
    );
}

/// T-081: THE TWO IN-BAND DENIAL LINES, TRANSCRIBED.
///
/// Verbatim off `docs/research/captures/real-planner-turn-2026-08-19.jsonl`
/// (claude 2.1.226, 2026-08-19) — lines 17 and 19 of that file, minus
/// their `uuid`, with `session_id` re-bound to this run's own so the
/// stream is internally consistent. Nothing else is paraphrased.
///
/// **THE TWO LINES DIFFER IN SHAPE AND BOTH MUST CLASSIFY.** The first
/// carries only `decision_reason_type` (`"subcommandResults"`); the
/// second carries `decision_reason` as well (`"other"`). Neither carries
/// `error` or `error_status`, which is precisely why the runner ignored
/// both until T-081 keyed on `subtype` instead.
///
/// ONE EMITTER, TWO SCENARIOS, for the reason `retry_then` and
/// `auth_error` already give: `tool-denied` and `denied-then-completed`
/// differ only in how they END, so the transcribed half has to be the
/// same code or the two transcriptions drift apart.
///
/// `the_tool_denied_fixture_is_a_transcription_not_a_construction` in
/// `tests/agent_runner.rs` reads the capture off disk and compares it to
/// what this function prints, so an edit here that paraphrases the CLI
/// reds against the file it claims to be quoting.
fn emit_observed_denials(session_id: &str) {
    println!(
        "{}",
        serde_json::json!({
            "type": "system", "subtype": "permission_denied",
            "tool_name": r#"Bash"#,
            "tool_use_id": r#"toolu_01FAHQKCKFrBLrmVtRiuLT9L"#,
            "decision_reason_type": r#"subcommandResults"#,
            "message": r#"This Bash command contains multiple operations. The following part requires approval: KIT=.nputer/genesis/kit && mkdir -p docs/decisions docs/tasks docs/rooms && cp "$KIT"/docs-templates/*.md docs/ && cp "$KIT"/adapters/CLAUDE.md "$KIT"/adapters/AGENTS.md . && cp "$KIT"/runtime/nputer.yaml .nputer/nputer.yaml && printf '.nputer/\n' && git init -q 2>&1; git status --short; find . -path ./.git -prune -o -type f -print"#,
            "session_id": session_id
        })
    );
    println!(
        "{}",
        serde_json::json!({
            "type": "system", "subtype": "permission_denied",
            "tool_name": r#"Bash"#,
            "tool_use_id": r#"toolu_0173K9Q72m797nLBonDtrc3R"#,
            "decision_reason_type": r#"other"#,
            "decision_reason": r#"Glob patterns are not allowed in write operations. Please specify an exact file path."#,
            "message": r#"Glob patterns are not allowed in write operations. Please specify an exact file path."#,
            "session_id": session_id
        })
    );
}

/// The `permission_denials` array off the SAME captured turn, entries
/// whole: `tool_name`, `tool_use_id` and the full `tool_input` the CLI
/// really wrote. **Both entries name `Bash`** — the constructed fixture
/// this replaced said `Bash` and `WebFetch`, and that guess is what made
/// a name look like it could be a join key.
fn observed_denial_entries() -> serde_json::Value {
    serde_json::json!([
        {
            "tool_name": r#"Bash"#,
            "tool_use_id": r#"toolu_01FAHQKCKFrBLrmVtRiuLT9L"#,
            "tool_input": {
                "command": r#"KIT=.nputer/genesis/kit && mkdir -p docs/decisions docs/tasks docs/rooms && cp "$KIT"/docs-templates/*.md docs/ && cp "$KIT"/adapters/CLAUDE.md "$KIT"/adapters/AGENTS.md . && cp "$KIT"/runtime/nputer.yaml .nputer/nputer.yaml && printf '.nputer/\n' > .gitignore && git init -q 2>&1; git status --short; find . -path ./.git -prune -o -type f -print | sort"#,
                "description": r#"Scaffold docs tree, adapters, gitignore, git init"#
            }
        },
        {
            "tool_name": r#"Bash"#,
            "tool_use_id": r#"toolu_0173K9Q72m797nLBonDtrc3R"#,
            "tool_input": {
                "command": r#"mkdir -p docs/decisions docs/tasks docs/rooms && cp .nputer/genesis/kit/docs-templates/*.md docs/ && cp .nputer/genesis/kit/adapters/CLAUDE.md .nputer/genesis/kit/adapters/AGENTS.md . && cp .nputer/genesis/kit/runtime/nputer.yaml .nputer/nputer.yaml"#,
                "description": r#"Copy templates and adapters into place"#
            }
        }
    ])
}

fn emit_result(text: &str) {
    println!(
        "{}",
        serde_json::json!({
            "type": "result",
            "subtype": "success",
            "is_error": false,
            "num_turns": 1,
            "result": text
        })
    );
}
