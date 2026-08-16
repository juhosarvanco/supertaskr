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
            let exe = std::env::current_exe().expect("current_exe");
            let mut command = Command::new(exe);
            command.env("NPUTER_FAKE_SCENARIO", "grandchild");
            match command.spawn() {
                Ok(child) => {
                    if let Some(turn_dir) = &turn_dir {
                        let _ = fs::write(
                            turn_dir.join("grandchild-pid.txt"),
                            child.id().to_string(),
                        );
                    }
                }
                Err(err) => eprintln!("fake-agent: could not fork a grandchild: {err}"),
            }
            sleep_forever();
        }
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
        "auth-error" => {
            emit_init(&session_id, &model);
            println!(
                "{}",
                serde_json::json!({
                    "type": "system", "subtype": "api_retry", "attempt": 1,
                    "max_retries": 10, "retry_delay_ms": 508,
                    "error_status": 401, "error": "authentication_failed",
                    "session_id": session_id
                })
            );
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
