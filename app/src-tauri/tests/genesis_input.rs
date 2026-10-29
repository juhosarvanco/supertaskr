//! Ordinary owned-process controls for inline method inputs. No real agent is
//! resolved or invoked, and no planner/authority proof campaign is performed.
#![cfg(unix)]
use std::fs;
use std::os::unix::fs::PermissionsExt;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use supertaskr_lib::agent::{
    adapter::CLAUDE_V1,
    runner::{
        pid_alive, run_turn, ChildHandle, Emitter, ResolvedCli, RunEvent, RunnerConfig, TurnError,
        TurnRequest,
    },
};
static SERIAL: AtomicU64 = AtomicU64::new(0);
struct Fixture(PathBuf);
impl Fixture {
    fn new(body: &str) -> Self {
        let root = std::env::temp_dir().join(format!(
            "supertaskr-genesis-input-{}-{}",
            std::process::id(),
            SERIAL.fetch_add(1, Ordering::SeqCst)
        ));
        fs::create_dir_all(&root).unwrap();
        let file = root.join("controlled-agent");
        fs::write(&file, format!("#!/bin/sh\n{body}\n")).unwrap();
        fs::set_permissions(&file, fs::Permissions::from_mode(0o755)).unwrap();
        Self(root.canonicalize().unwrap())
    }
    fn cli(&self) -> ResolvedCli {
        ResolvedCli {
            path: self.0.join("controlled-agent"),
            version: Some("controlled input fixture".into()),
            login_path: None,
        }
    }
    fn request(&self) -> TurnRequest {
        TurnRequest {
            project_dir: self.0.clone(),
            prompt: "x".repeat(1024 * 1024),
            resume: None,
            turn: 1,
        }
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}
fn config() -> RunnerConfig {
    RunnerConfig {
        probe_login_shell: false,
        start_timeout: Duration::from_millis(100),
        stall_timeout: Duration::from_secs(2),
        kill_grace: Duration::from_millis(100),
        ..RunnerConfig::default()
    }
}
fn emitter(child: Arc<Mutex<Option<ChildHandle>>>) -> (Emitter, Arc<Mutex<Option<i32>>>) {
    let observed = Arc::new(Mutex::new(None));
    let saved = observed.clone();
    (
        Emitter::new(
            Arc::new(move |event| {
                if matches!(event, RunEvent::Started { .. }) {
                    *saved.lock().unwrap() = child.lock().unwrap().as_ref().map(|h| h.pid);
                }
            }),
            Arc::new(AtomicU64::new(0)),
        ),
        observed,
    )
}
#[test]
fn large_inline_input_nonreader_pays_startup_deadline_and_is_collected() {
    let fx = Fixture::new("exec /bin/sleep 30");
    let child = Arc::new(Mutex::new(None));
    let (events, pid) = emitter(child.clone());
    let start = Instant::now();
    let out = run_turn(
        &config(),
        &CLAUDE_V1,
        &fx.cli(),
        &fx.request(),
        &events,
        &child,
        &AtomicBool::new(false),
    );
    assert!(
        matches!(out.error, Some(TurnError::StartTimeout)),
        "{out:?}"
    );
    assert!(start.elapsed() < Duration::from_secs(3));
    assert!(child.lock().unwrap().is_none());
    assert!(!pid_alive(pid.lock().unwrap().unwrap()));
}
#[test]
fn large_inline_input_remains_cancellable_while_writer_is_blocked() {
    let fx = Fixture::new("exec /bin/sleep 30");
    let child = Arc::new(Mutex::new(None));
    let (events, pid) = emitter(child.clone());
    let cancel = Arc::new(AtomicBool::new(false));
    let pending = cancel.clone();
    let observed = pid.clone();
    let trigger = std::thread::spawn(move || {
        while observed.lock().unwrap().is_none() {
            std::thread::sleep(Duration::from_millis(5));
        }
        pending.store(true, Ordering::SeqCst);
    });
    let mut cfg = config();
    cfg.start_timeout = Duration::from_secs(30);
    let start = Instant::now();
    let out = run_turn(
        &cfg,
        &CLAUDE_V1,
        &fx.cli(),
        &fx.request(),
        &events,
        &child,
        &cancel,
    );
    trigger.join().unwrap();
    assert!(out.cancelled);
    assert!(start.elapsed() < Duration::from_secs(3));
    assert!(child.lock().unwrap().is_none());
    assert!(!pid_alive(pid.lock().unwrap().unwrap()));
}
#[test]
fn healthy_reader_receives_every_inline_byte_before_eof_and_completes() {
    let fx=Fixture::new("/bin/cat > captured-input\nprintf '%s\\n' '{\"type\":\"system\",\"subtype\":\"init\",\"session_id\":\"controlled-input-session\"}' '{\"type\":\"result\",\"subtype\":\"success\",\"result\":\"Healthy answer\",\"is_error\":false}'");
    let child = Arc::new(Mutex::new(None));
    let (events, pid) = emitter(child.clone());
    let req = fx.request();
    let mut cfg = config();
    cfg.start_timeout = Duration::from_secs(2);
    let out = run_turn(
        &cfg,
        &CLAUDE_V1,
        &fx.cli(),
        &req,
        &events,
        &child,
        &AtomicBool::new(false),
    );
    assert!(out.error.is_none(), "{out:?}");
    assert_eq!(out.text.as_deref(), Some("Healthy answer"));
    assert_eq!(
        fs::read(fx.0.join("captured-input")).unwrap(),
        req.prompt.as_bytes()
    );
    assert!(child.lock().unwrap().is_none());
    assert!(!pid_alive(pid.lock().unwrap().unwrap()));
}

#[test]
fn success_after_closing_stdin_early_cannot_claim_the_full_prompt_was_delivered() {
    let fx = Fixture::new("exec 0<&-\nprintf '%s\\n' '{\"type\":\"system\",\"subtype\":\"init\",\"session_id\":\"controlled-input-session\"}' '{\"type\":\"result\",\"subtype\":\"success\",\"result\":\"Unconsumed answer\",\"is_error\":false}'");
    let child = Arc::new(Mutex::new(None));
    let (events, pid) = emitter(child.clone());
    let mut cfg = config();
    cfg.start_timeout = Duration::from_secs(2);
    let out = run_turn(
        &cfg,
        &CLAUDE_V1,
        &fx.cli(),
        &fx.request(),
        &events,
        &child,
        &AtomicBool::new(false),
    );
    assert!(
        matches!(out.error, Some(TurnError::PromptInputFailed { .. })),
        "{out:?}"
    );
    assert!(out.text.is_none());
    assert!(child.lock().unwrap().is_none());
    assert!(!pid_alive(pid.lock().unwrap().unwrap()));
}

#[test]
fn an_authentication_failure_remains_the_diagnosis_when_the_child_also_closed_stdin() {
    let fx = Fixture::new("exec 0<&-\nprintf '%s\\n' '{\"type\":\"system\",\"subtype\":\"init\",\"session_id\":\"controlled-input-session\"}' '{\"type\":\"result\",\"subtype\":\"success\",\"result\":\"Authentication required\",\"is_error\":true,\"api_error_status\":401}'\nexit 1");
    let child = Arc::new(Mutex::new(None));
    let (events, _) = emitter(child.clone());
    let mut cfg = config();
    cfg.start_timeout = Duration::from_secs(2);
    let out = run_turn(
        &cfg,
        &CLAUDE_V1,
        &fx.cli(),
        &fx.request(),
        &events,
        &child,
        &AtomicBool::new(false),
    );
    assert!(
        matches!(
            out.error,
            Some(TurnError::AuthFailed {
                status: Some(401),
                ..
            })
        ),
        "{out:?}"
    );
    assert!(out.text.is_none());
    assert!(child.lock().unwrap().is_none());
}

#[test]
fn diagnostic_output_is_drained_before_a_large_prompt_is_consumed() {
    let fx = Fixture::new("/bin/dd if=/dev/zero bs=65536 count=4 1>&2 2>/dev/null\n/bin/cat > captured-input\nprintf '%s\\n' '{\"type\":\"system\",\"subtype\":\"init\",\"session_id\":\"controlled-input-session\"}' '{\"type\":\"result\",\"subtype\":\"success\",\"result\":\"Healthy after diagnostics\",\"is_error\":false}'");
    let child = Arc::new(Mutex::new(None));
    let (events, _) = emitter(child.clone());
    let req = fx.request();
    let mut cfg = config();
    cfg.start_timeout = Duration::from_secs(2);
    let out = run_turn(
        &cfg,
        &CLAUDE_V1,
        &fx.cli(),
        &req,
        &events,
        &child,
        &AtomicBool::new(false),
    );
    assert_eq!(
        out.text.as_deref(),
        Some("Healthy after diagnostics"),
        "{out:?}"
    );
    assert_eq!(
        fs::read(fx.0.join("captured-input")).unwrap(),
        req.prompt.as_bytes()
    );
}

#[test]
fn stream_eof_with_owned_descendant_retaining_stdin_is_collected_before_return() {
    let fx = Fixture::new(
        "/bin/sleep 30 <&0 >/dev/null 2>/dev/null &\nexec 1>/dev/null 2>/dev/null\nwait",
    );
    let child = Arc::new(Mutex::new(None));
    let (events, pid) = emitter(child.clone());
    let start = Instant::now();
    let mut cfg = config();
    cfg.start_timeout = Duration::from_secs(2);
    let out = run_turn(
        &cfg,
        &CLAUDE_V1,
        &fx.cli(),
        &fx.request(),
        &events,
        &child,
        &AtomicBool::new(false),
    );
    assert!(
        matches!(
            out.error,
            Some(TurnError::MalformedStream { .. } | TurnError::ExitNonZero { .. })
        ),
        "{out:?}"
    );
    assert!(start.elapsed() < Duration::from_secs(3));
    assert!(child.lock().unwrap().is_none());
    assert!(!supertaskr_lib::agent::runner::group_has_members(
        pid.lock().unwrap().unwrap()
    ));
}
