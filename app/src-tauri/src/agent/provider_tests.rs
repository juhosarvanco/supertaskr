//! Controlled provider contracts. These tests inject their own executable;
//! none resolves the user's signed-in CLI or makes a model request.
#![cfg(unix)]
use super::{adapter, planner, runner, sessions};
use std::{
    fs,
    os::unix::fs::PermissionsExt,
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Arc, Mutex,
    },
    time::Duration,
};
const UUID: &str = "0199a213-81c0-7800-8aa1-bbab2a035a53";
static NEXT: AtomicU64 = AtomicU64::new(0);
struct Fixture {
    home: PathBuf,
    records: PathBuf,
    cfg: runner::RunnerConfig,
}
impl Fixture {
    fn new(mode: &str) -> Self {
        let home = std::env::temp_dir().join(format!(
            "supertaskr-codex-provider-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::SeqCst)
        ));
        fs::create_dir(&home).unwrap();
        let home = home.canonicalize().unwrap();
        let records = home.join("records  ");
        fs::create_dir(&records).unwrap();
        let program = home.join("codex");
        fs::write(&program,r#"#!/bin/sh
if [ "$1" = '--version' ]; then echo 'codex-cli 0.165.0-alpha.1.2'; exit 0; fi
printf '%s\n' "$@" > "$SUPERTASKR_PROVIDER_HOME/args"
/bin/cat > "$SUPERTASKR_PROVIDER_HOME/prompt"
/bin/pwd -P > "$SUPERTASKR_PROVIDER_HOME/cwd"
if [ "$SUPERTASKR_PROVIDER_MODE" = 'wrong-thread' ]; then
  echo '{"type":"thread.started","thread_id":"0199a213-81c0-7800-8aa1-bbab2a035a54"}'
else
  echo '{"type":"thread.started","thread_id":"0199a213-81c0-7800-8aa1-bbab2a035a53"}'
fi
if [ "$SUPERTASKR_PROVIDER_MODE" = 'stall' ]; then /bin/sleep 10; exit 0; fi
if [ "$SUPERTASKR_PROVIDER_MODE" = 'failed' ]; then echo '{"type":"turn.failed","error":{"message":"Codex provider refused this turn"}}'; exit 0; fi
if [ "$SUPERTASKR_PROVIDER_MODE" = 'auth' ]; then echo '{"type":"turn.failed","error":{"message":"Authentication expired; sign in again","status":401}}'; exit 0; fi
echo '{"type":"item.started","item":{"id":"work","type":"command_execution","command":"unused fixture activity","status":"in_progress"}}'
echo '{"type":"item.completed","item":{"id":"comment","type":"agent_message","text":"Preparing the interview."}}'
echo '{"type":"item.completed","item":{"id":"answer","type":"agent_message","text":"What should this project do?"}}'
echo '{"type":"turn.completed","usage":{"input_tokens":100,"cached_input_tokens":50,"output_tokens":10}}'
"#).unwrap();
        fs::set_permissions(&program, fs::Permissions::from_mode(0o700)).unwrap();
        let cfg = runner::RunnerConfig {
            binary_override: Some(program),
            probe_login_shell: false,
            extra_env: vec![
                (
                    "SUPERTASKR_PROVIDER_HOME".into(),
                    home.display().to_string(),
                ),
                ("SUPERTASKR_PROVIDER_MODE".into(), mode.into()),
            ],
            start_timeout: Duration::from_secs(2),
            stall_timeout: Duration::from_millis(200),
            kill_grace: Duration::from_millis(100),
            ..Default::default()
        };
        Self { home, records, cfg }
    }
    fn run(&self, resume: Option<&str>) -> (runner::TurnOutcome, Vec<runner::RunEvent>) {
        let adapter = &adapter::CODEX_SEPARATED_PLANNER_V1;
        let cli = runner::resolve_cli(&self.cfg, adapter).unwrap();
        let events = Arc::new(Mutex::new(Vec::new()));
        let sink = events.clone();
        let emitter = runner::Emitter::new(
            Arc::new(move |event| sink.lock().unwrap().push(event)),
            Arc::new(AtomicU64::new(0)),
        );
        let outcome = runner::run_configured_turn(
            &self.cfg,
            adapter,
            &cli,
            &runner::TurnRequest {
                project_dir: self.records.clone(),
                prompt: "Private fixture answer on stdin only.".into(),
                resume: resume.map(str::to_owned),
                turn: 1,
            },
            &emitter,
            &Mutex::new(None),
            &AtomicBool::new(false),
            "gpt-6.1-sol",
        );
        let captured = events.lock().unwrap().clone();
        (outcome, captured)
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.home);
    }
}

#[test]
fn codex_exec_fresh_and_exact_resume_keep_cwd_stdin_explicit_model_and_actual_usage() {
    let f = Fixture::new("success");
    for resume in [None, Some(UUID)] {
        let (out, events) = f.run(resume);
        assert!(out.error.is_none(), "{:?}", out.error);
        assert!(!out.cancelled);
        assert_eq!(out.text.as_deref(), Some("What should this project do?"));
        assert_eq!(out.native_session_id.as_deref(), Some(UUID));
        assert_eq!(out.model, None, "no model was observed in the Codex event");
        assert_eq!(
            out.usage.as_ref().map(|usage| usage.output_tokens),
            Some(10)
        );
        let args = fs::read_to_string(f.home.join("args")).unwrap();
        let args = args.lines().collect::<Vec<_>>();
        assert!(args
            .windows(2)
            .any(|pair| pair == ["--sandbox", "workspace-write"]));
        assert!(args
            .windows(2)
            .any(|pair| pair == ["--model", "gpt-6.1-sol"]));
        assert_eq!(args.iter().filter(|arg| **arg == "--model").count(), 1);
        assert_eq!(
            args.iter().filter(|arg| **arg == "resume").count(),
            usize::from(resume.is_some())
        );
        assert_eq!(
            args.iter().filter(|arg| **arg == UUID).count(),
            usize::from(resume.is_some())
        );
        assert!(!args.iter().any(|arg| [
            "--last",
            "--all",
            "--add-dir",
            "--ignore-rules",
            "--ignore-user-config",
            "--dangerously-bypass-approvals-and-sandbox",
            "--dangerously-bypass-hook-trust"
        ]
        .contains(arg)));
        assert!(!args
            .iter()
            .any(|arg| arg.contains("Private fixture answer")));
        assert_eq!(
            fs::read_to_string(f.home.join("prompt")).unwrap(),
            "Private fixture answer on stdin only."
        );
        assert_eq!(
            fs::read_to_string(f.home.join("cwd"))
                .unwrap()
                .trim_end_matches('\n'),
            f.records.to_str().unwrap()
        );
        assert!(events
            .iter()
            .any(|event| matches!(event, runner::RunEvent::Completed { .. })));
    }
}

#[test]
fn codex_wrong_thread_failed_terminal_and_stall_never_finish_as_a_success() {
    for mode in ["wrong-thread", "failed", "stall", "auth"] {
        let f = Fixture::new(mode);
        let (out, events) = f.run(Some(UUID));
        assert!(out.text.is_none());
        assert!(out.error.is_some(), "{mode}");
        if mode == "wrong-thread" {
            assert!(matches!(
                out.error,
                Some(runner::TurnError::RejectedSessionId { .. })
            ));
            assert_eq!(out.native_session_id, None);
        }
        if mode == "auth" {
            assert!(matches!(
                out.error,
                Some(runner::TurnError::AuthFailed {
                    provider: Some(runner::AuthProvider::Codex),
                    status: Some(401),
                    ..
                })
            ));
            assert_eq!(
                serde_json::to_value(out.error.as_ref().unwrap()).unwrap()["provider"],
                "codex"
            );
        }
        assert!(
            !events
                .iter()
                .any(|event| matches!(event, runner::RunEvent::Completed { .. })),
            "{mode}"
        );
    }
}

#[test]
fn codex_uuid_version_and_provider_are_finite_and_original_executable_is_frozen() {
    let adapter = &adapter::CODEX_SEPARATED_PLANNER_V1;
    for version in [
        "codex-cli 0.165.0-alpha.1.2",
        "codex-cli 0.166.0",
        "codex-cli 1.0.0",
    ] {
        assert_eq!(adapter.version_supported(version), Some(true));
    }
    for version in [
        "codex-cli 0.164.9",
        "codex-cli 0.100.0",
        "2.1.226 (Claude Code)",
        "unknown",
        "codex-cli 0.165",
    ] {
        assert_eq!(adapter.version_supported(version), Some(false));
    }
    for id in [
        "named-thread",
        "--last",
        "--all",
        "latest",
        "../thread",
        "0199A213-81c0-7800-8aa1-bbab2a035a53",
    ] {
        assert!(adapter.argv(Some(id)).is_err(), "{id}");
    }
    assert!(adapter.argv(Some(UUID)).is_ok());
    assert!(adapter
        .argv_for_model(Some(UUID), "--ignore-rules")
        .is_err());
    let f = Fixture::new("success");
    let cli = runner::resolve_cli(&f.cfg, adapter).unwrap();
    let original = planner::Decision::Ready {
        selection: planner::Selection {
            role: "planner".into(),
            requested: "codex/gpt-6.1-sol@subagent".into(),
            harness: "codex".into(),
            model: "gpt-6.1-sol".into(),
            vehicle: Some("subagent".into()),
            session_policy: planner::SessionPolicy {
                default: "fresh".into(),
                warn_after_turns: 30,
            },
        },
        provenance: planner::Provenance {
            configuration_digest: format!("sha256:{}", "a".repeat(64)),
            product_revision: "b".repeat(40),
            tool_manifest_digest: "c".repeat(64),
        },
    };
    let captured = planner::PlannerSession::capture(&original, &cli).unwrap();
    let mut unavailable = cli.clone(); unavailable.version = None;
    assert_eq!(planner::PlannerSession::capture(&original, &unavailable).unwrap_err(), "genesis-planner-executable-version-unavailable");
    unavailable = cli.clone(); unavailable.path = f.home.join("absent");
    assert_eq!(planner::PlannerSession::capture(&original, &unavailable).unwrap_err(), "genesis-planner-executable-path-unavailable");
    unavailable.path = f.home.clone();
    assert_eq!(planner::PlannerSession::capture(&original, &unavailable).unwrap_err(), "genesis-planner-executable-kind-or-size");
    captured.verify(&original, &cli).unwrap();
    let mut future = original.clone();
    if let planner::Decision::Ready { selection, .. } = &mut future {
        selection.harness = "claude".into();
        selection.model = "claude-opus-5".into();
        selection.requested = "claude-opus-5@subagent".into();
    }
    assert!(captured.verify(&future, &cli).is_err());
    captured.verify(&original, &cli).unwrap();
    let path = f.cfg.binary_override.as_ref().unwrap();
    let mut bytes = fs::read(path).unwrap();
    bytes.extend_from_slice(b"\n# changed executable\n");
    fs::write(path, bytes).unwrap();
    assert!(captured.verify_executable(&cli).is_err());
}

#[test]
fn codex_registry_resume_is_uuid_only_and_serialization_does_not_replace_claude() {
    let base = serde_json::json!({"id":"new-codex","agent":"codex","native_session_id":UUID,"created":"2026-10-30T00:00:00Z","turns":1,"tasks":[],"roles":["planner"],"status":"waiting"});
    let codex: sessions::SessionEntry = serde_json::from_value(base.clone()).unwrap();
    assert_eq!(codex.resume_id().unwrap(), Some(UUID));
    let cold: sessions::SessionEntry =
        serde_json::from_str(&serde_json::to_string(&codex).unwrap()).unwrap();
    assert_eq!(cold.agent, "codex");
    assert_eq!(cold.resume_id().unwrap(), Some(UUID));
    assert_eq!(cold.model, None);
    let mut invalid = base.clone();
    invalid["native_session_id"] = "unqualified-name".into();
    assert!(serde_json::from_value::<sessions::SessionEntry>(invalid)
        .unwrap()
        .resume_id()
        .is_err());
    let mut legacy = base;
    legacy["agent"] = "claude".into();
    legacy["native_session_id"] = "original-claude-session".into();
    let legacy: sessions::SessionEntry = serde_json::from_value(legacy).unwrap();
    assert_eq!(legacy.resume_id().unwrap(), Some("original-claude-session"));
    assert_eq!(adapter::planner_adapter().key, "claude");
}
