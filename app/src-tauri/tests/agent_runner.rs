//! T-025 §7: the agent runner's lifecycle matrix, driven against the
//! FAKE agent CLI. **No model is called by anything in this file** — the
//! binary under `CARGO_BIN_EXE_fake_agent` is a canned stream emitter
//! built by cargo.
//!
//! **T-060 CHANGED WHY THAT IS TRUE, and the difference is the point.**
//! It used to rest on "every config here sets `probe_login_shell: false`"
//! — a property held by DISCIPLINE, in a field every test had to
//! remember, with `..RunnerConfig::default()` as the idiom and the
//! default `true`. **It failed**: T-047's verifier spawned the
//! developer's real `claude` with the genesis planner prompt from
//! `cargo test`, and no tokens were spent only because the token is
//! revoked. Since T-060 the runner refuses the login-shell and PATH arms
//! from any cargo TEST binary on its own
//! (`runner::real_cli_arms_forbidden`), so a test that forgets the field
//! — or a test file written next year that never heard of it — gets a
//! typed `cliNotFound` rather than the user's machine.
//!
//! The one env-gated real smoke lives at the bottom, `#[ignore]`d. It is
//! the only test in the repo that opts out, and it does so explicitly.

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicU64;
use std::sync::{mpsc, Arc};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use nputer_lib::agent::adapter;
use nputer_lib::agent::runner::{RunEvent, RunnerConfig, TurnError};
use nputer_lib::agent::{
    self, sessions, CancelOutcome, GenesisStatus, Phase, SendOutcome, StartOutcome,
};
use nputer_lib::docs_watch::{
    self, apply_picked_folder, spawn_watcher_thread, DocsSnapshot, WatchCtl, WatchState, DEBOUNCE,
};

/// The canary planted in THIS process's environment. If it ever appears
/// in the child's environment dump, `env_clear()` + allowlist is broken
/// and an `ANTHROPIC_API_KEY` would ride along the same way.
const CANARY: &str = "NPUTER_TEST_SECRET";
const CANARY_VALUE: &str = "if-you-can-read-this-the-env-leaked";

fn now_ms() -> u128 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis()).unwrap_or(0)
}

fn fake_agent_bin() -> PathBuf {
    PathBuf::from(env!("CARGO_BIN_EXE_fake_agent"))
}

/// One genesis project, its dump dir, a `WatchState` and an `AgentState`
/// wired to the fake, plus the event channel.
struct Harness {
    project: PathBuf,
    dump: PathBuf,
    watch: WatchState,
    _ctl_rx: mpsc::Receiver<WatchCtl>,
    agent: agent::AgentState,
    events: mpsc::Receiver<RunEvent>,
    root: PathBuf,
}

impl Drop for Harness {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

struct Options<'a> {
    scenario: &'a str,
    version: &'a str,
    binary: Option<PathBuf>,
    /// Pre-create `<project>/docs` (so the ordinary docs watch can arm).
    with_docs: bool,
    start_timeout: Duration,
    stall_timeout: Duration,
    /// T-039: the session id the `hostile-id` scenario puts in its init
    /// line. `None` leaves the fake's own default (the T-025 verifier's
    /// exact injection).
    session_id: Option<&'a str>,
    /// T-047: the `model` the fake puts in its init line. `None` leaves
    /// the fake's own `fake-model-1`.
    model: Option<String>,
}

impl Default for Options<'_> {
    fn default() -> Self {
        Self {
            scenario: "happy",
            version: "2.1.226 (Claude Code)",
            binary: None,
            with_docs: false,
            start_timeout: Duration::from_millis(1500),
            stall_timeout: Duration::from_millis(1500),
            session_id: None,
            model: None,
        }
    }
}

fn harness(tag: &str, opts: Options<'_>) -> Harness {
    std::env::set_var(CANARY, CANARY_VALUE);

    let root = std::env::temp_dir().join(format!(
        "nputer-t025-{}-{}-{}",
        tag,
        std::process::id(),
        now_ms()
    ));
    let project = root.join("project");
    let dump = root.join("dump");
    let config = root.join("config");
    fs::create_dir_all(&project).expect("mk project");
    fs::create_dir_all(&dump).expect("mk dump");
    fs::create_dir_all(&config).expect("mk config");
    if opts.with_docs {
        fs::create_dir_all(project.join("docs")).expect("mk docs");
    }

    let mut extra_env = vec![
        ("NPUTER_FAKE_SCENARIO".to_string(), opts.scenario.to_string()),
        ("NPUTER_FAKE_DUMP_DIR".to_string(), dump.display().to_string()),
        ("NPUTER_FAKE_VERSION".to_string(), opts.version.to_string()),
    ];
    if let Some(id) = opts.session_id {
        extra_env.push(("NPUTER_FAKE_SESSION_ID".to_string(), id.to_string()));
    }
    if let Some(model) = &opts.model {
        extra_env.push(("NPUTER_FAKE_MODEL".to_string(), model.clone()));
    }

    let cfg = RunnerConfig {
        binary_override: Some(opts.binary.unwrap_or_else(fake_agent_bin)),
        // A PATH the child can be asserted against, byte for byte.
        path_override: Some("/nputer-test-path/bin:/nputer-test-path/sbin".into()),
        extra_env,
        probe_login_shell: false,
        start_timeout: opts.start_timeout,
        stall_timeout: opts.stall_timeout,
        coalesce: Duration::from_millis(40),
        kill_grace: Duration::from_millis(300),
        probe_timeout: Duration::from_secs(5),
    };

    let (ctl, ctl_rx) = mpsc::channel();
    let watch = WatchState::new(Some(project.clone()), Arc::new(AtomicU64::new(0)), ctl);
    let (tx, events) = mpsc::channel();
    let agent = agent::AgentState::new(cfg, move |event| {
        let _ = tx.send(event);
    });

    Harness { project, dump, watch, _ctl_rx: ctl_rx, agent, events, root }
}

fn wait_for(
    events: &mpsc::Receiver<RunEvent>,
    label: &str,
    pred: impl Fn(&RunEvent) -> bool,
) -> RunEvent {
    let deadline = Instant::now() + Duration::from_secs(20);
    let mut seen = Vec::new();
    while Instant::now() < deadline {
        match events.recv_timeout(Duration::from_millis(200)) {
            Ok(event) => {
                if pred(&event) {
                    return event;
                }
                seen.push(event);
            }
            Err(mpsc::RecvTimeoutError::Timeout) => continue,
            Err(mpsc::RecvTimeoutError::Disconnected) => break,
        }
    }
    panic!("timed out waiting for {label}; saw: {seen:#?}");
}

fn wait_completed(events: &mpsc::Receiver<RunEvent>) -> RunEvent {
    wait_for(events, "completed", |e| matches!(e, RunEvent::Completed { .. }))
}

fn wait_failed(events: &mpsc::Receiver<RunEvent>) -> TurnError {
    match wait_for(events, "failed", |e| matches!(e, RunEvent::Failed { .. })) {
        RunEvent::Failed { error, .. } => error,
        other => unreachable!("{other:?}"),
    }
}

/// Block until the turn thread has finished settling (phase leaves
/// Running), so registry/transcript assertions are not racing it.
fn settle(agent: &agent::AgentState) -> GenesisStatus {
    let deadline = Instant::now() + Duration::from_secs(20);
    loop {
        let status = agent::status(agent);
        if status.phase != Phase::Running {
            return status;
        }
        if Instant::now() >= deadline {
            panic!("turn never settled: {status:?}");
        }
        std::thread::sleep(Duration::from_millis(20));
    }
}

fn turn_dump(dump: &Path, turn: usize) -> PathBuf {
    dump.join(format!("turn-{turn}"))
}

fn read_argv(dump: &Path, turn: usize) -> Vec<String> {
    let raw = fs::read_to_string(turn_dump(dump, turn).join("argv.json"))
        .unwrap_or_else(|err| panic!("turn-{turn} argv dump: {err}"));
    serde_json::from_str(&raw).expect("argv.json parses")
}

fn read_env(dump: &Path, turn: usize) -> std::collections::BTreeMap<String, String> {
    let raw = fs::read_to_string(turn_dump(dump, turn).join("env.json")).expect("env dump");
    serde_json::from_str(&raw).expect("env.json parses")
}

fn read_dump(dump: &Path, turn: usize, name: &str) -> String {
    fs::read_to_string(turn_dump(dump, turn).join(name))
        .unwrap_or_else(|err| panic!("turn-{turn}/{name}: {err}"))
}

fn wait_for_file(path: &Path) -> String {
    let deadline = Instant::now() + Duration::from_secs(20);
    while Instant::now() < deadline {
        if let Ok(text) = fs::read_to_string(path) {
            if !text.trim().is_empty() {
                return text;
            }
        }
        std::thread::sleep(Duration::from_millis(20));
    }
    panic!("{} never appeared", path.display());
}

// ==== the lifecycle matrix ==============================================

/// THE ROUND TRIP: spawn turn 1, capture the native session id from the
/// stream, resume turn 2 with it. Everything the child was handed is
/// asserted from its own dump.
#[test]
fn spawn_turn_resume_round_trip_with_the_prompt_on_stdin() {
    let h = harness("roundtrip", Options::default());

    match agent::start_genesis(&h.watch, &h.agent) {
        StartOutcome::Started { turn } => assert_eq!(turn, 1),
        other => panic!("expected Started, got {other:?}"),
    }
    let registered = wait_for(&h.events, "sessionRegistered", |e| {
        matches!(e, RunEvent::SessionRegistered { .. })
    });
    match registered {
        RunEvent::SessionRegistered { native_session_id, .. } => {
            assert_eq!(native_session_id, "fake-session-0001")
        }
        other => unreachable!("{other:?}"),
    }
    match wait_completed(&h.events) {
        RunEvent::Completed { turn, text, truncated_relay, .. } => {
            assert_eq!(turn, 1);
            assert_eq!(text, "Hello, founder. What are we building?");
            assert!(!truncated_relay);
        }
        other => unreachable!("{other:?}"),
    }
    settle(&h.agent);

    // Turn 1's argv: the spawn template, NO --resume, and — critically —
    // NO PROMPT. The prompt is on stdin, because argv is world-readable
    // in `ps` and an interview answer can carry a private product idea.
    let argv1 = read_argv(&h.dump, 1);
    assert!(!argv1.iter().any(|a| a == "--resume"), "turn 1 spawns fresh: {argv1:?}");
    assert!(argv1.contains(&"-p".to_string()));
    assert!(argv1.contains(&"stream-json".to_string()));
    assert!(argv1.contains(&"acceptEdits".to_string()));
    assert!(
        !argv1.iter().any(|a| a.contains("KIT ROOT") || a.contains("You are the planner")),
        "the prompt must never appear in argv: {argv1:?}"
    );
    let stdin1 = read_dump(&h.dump, 1, "stdin.txt");
    assert!(stdin1.contains("You are the planner"));
    assert!(stdin1.contains(".nputer/genesis/kit"));
    // cwd is the canonical open project dir, from WatchState.
    assert_eq!(
        fs::canonicalize(read_dump(&h.dump, 1, "cwd.txt")).expect("cwd canonical"),
        fs::canonicalize(&h.project).expect("project canonical")
    );

    // TURN 2: the captured id rides the resume template as ONE element.
    let user_text = "a solo founder who forgets what she decided last week";
    match agent::send_turn(&h.watch, &h.agent, user_text.to_string()) {
        SendOutcome::Accepted { turn } => assert_eq!(turn, 2),
        other => panic!("expected Accepted, got {other:?}"),
    }
    match wait_completed(&h.events) {
        RunEvent::Completed { turn, .. } => assert_eq!(turn, 2),
        other => unreachable!("{other:?}"),
    }
    settle(&h.agent);

    let argv2 = read_argv(&h.dump, 2);
    let idx = argv2.iter().position(|a| a == "--resume").expect("turn 2 resumes");
    assert_eq!(argv2[idx + 1], "fake-session-0001");
    assert_eq!(read_dump(&h.dump, 2, "stdin.txt"), user_text);
    assert!(
        !argv2.iter().any(|a| a.contains(user_text)),
        "the user's answer must never reach argv: {argv2:?}"
    );
}

/// ENV HYGIENE with a planted canary (§10 obligation 3).
#[test]
fn the_child_gets_the_allowlist_and_never_a_secret() {
    let h = harness("envhygiene", Options::default());
    assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Started { .. }));
    wait_completed(&h.events);
    settle(&h.agent);

    let env = read_env(&h.dump, 1);

    // THE CANARY: planted in THIS process's environment, absent from the
    // child's. An ANTHROPIC_API_KEY would have leaked the same way.
    assert!(
        !env.contains_key(CANARY),
        "the planted canary reached the child - env_clear()+allowlist is broken: {:?}",
        env.keys().collect::<Vec<_>>()
    );
    // And nothing that even looks like a credential.
    for key in env.keys() {
        let upper = key.to_ascii_uppercase();
        for banned in ["ANTHROPIC", "AWS_", "GOOGLE_", "GITHUB", "NPM_TOKEN", "TAURI_"] {
            assert!(!upper.starts_with(banned), "{key} must not reach the spawned CLI");
        }
    }

    // What the child DOES get: the deliberate set.
    assert_eq!(env.get("TERM").map(String::as_str), Some("dumb"), "TERM is forced, not forwarded");
    assert_eq!(
        env.get("PATH").map(String::as_str),
        Some("/nputer-test-path/bin:/nputer-test-path/sbin"),
        "PATH is the explicitly captured login PATH, not ours"
    );
    assert_eq!(
        env.get("HOME").map(String::as_str),
        std::env::var("HOME").ok().as_deref(),
        "HOME rides: the CLI's own login config lives under it (ADR-003's auth)"
    );
    // The seam's own variables are there because the TEST put them there.
    assert_eq!(env.get("NPUTER_FAKE_SCENARIO").map(String::as_str), Some("happy"));
}

/// SESSION REGISTRY + TRANSCRIPT after a two-turn exchange (§10 ob. 8).
#[test]
fn the_registry_and_transcript_record_the_exchange() {
    let h = harness("registry", Options::default());
    agent::start_genesis(&h.watch, &h.agent);
    wait_completed(&h.events);
    settle(&h.agent);
    agent::send_turn(&h.watch, &h.agent, "answer one".into());
    wait_completed(&h.events);
    let status = settle(&h.agent);

    let file = sessions::load(&h.project);
    assert_eq!(file.sessions.len(), 1, "one planner session, upserted in place");
    let entry = &file.sessions[0];
    assert_eq!(entry.id, "S1");
    assert_eq!(entry.agent, "claude");
    assert_eq!(entry.roles, vec!["planner".to_string()]);
    assert_eq!(entry.tasks, Vec::<String>::new());
    assert_eq!(entry.native_session_id.as_deref(), Some("fake-session-0001"));
    assert_eq!(entry.model.as_deref(), Some("fake-model-1"), "model is RECORDED, never configured");
    assert_eq!(entry.turns, 2, "one increment per completed exchange");
    assert_eq!(entry.status, "idle", "between turns the session is idle and resumable");
    assert!(entry.created.ends_with('Z') && entry.created.len() == 20);

    // The transcript: two lines per exchange, in order.
    let lines = sessions::read_transcript(&h.project);
    assert_eq!(lines.len(), 4);
    assert_eq!(lines.iter().map(|l| (l.turn, l.role.as_str())).collect::<Vec<_>>(), vec![
        (1, "user"),
        (1, "planner"),
        (2, "user"),
        (2, "planner"),
    ]);
    assert!(lines[0].text.contains("You are the planner"), "turn 1's user half IS the kickoff");
    assert_eq!(lines[2].text, "answer one");
    assert_eq!(lines[1].text, "Hello, founder. What are we building?");

    // Status mirrors the same truth for a late-mounting pane.
    assert_eq!(status.phase, Phase::Idle);
    assert_eq!(status.turn, 2);
    assert_eq!(status.native_session_id.as_deref(), Some("fake-session-0001"));
    assert_eq!(status.cli_version.as_deref(), Some("2.1.226 (Claude Code)"));
    assert_eq!(status.method_version, nputer_lib::agent::kit::METHOD_SNAPSHOT_VERSION);
    assert!(status.last_event_at_ms.is_some());
}

/// THE KIT IS MATERIALIZED INSIDE THE PROJECT, so no directory grant
/// beyond the project's own cwd exists.
#[test]
fn the_kit_lands_inside_the_project_and_the_kickoff_points_at_it() {
    let h = harness("kit", Options::default());
    agent::start_genesis(&h.watch, &h.agent);
    wait_completed(&h.events);
    settle(&h.agent);

    let kit_root = h.project.join(".nputer/genesis/kit");
    assert!(kit_root.join("roles/planner.md").exists());
    assert!(kit_root.join("interview/plan-interview.md").exists());
    assert!(kit_root.join("docs-templates/NORTH_STAR.md").exists());
    assert!(kit_root.join("kit.json").exists());
    assert!(kit_root.starts_with(&h.project), "the kit rides inside the cwd scope");
    // The runner is not the docs writer (ADR-017): the happy scenario
    // writes nothing under docs/, and neither does the app.
    assert!(!h.project.join("docs").exists());
    // The kickoff on stdin names that exact path.
    assert!(read_dump(&h.dump, 1, "stdin.txt").contains(&kit_root.display().to_string()));
}

/// KILL ON CANCEL, with a GRANDCHILD the runner never knew about (§10
/// obligation 2). Killing only the direct child would leave it running.
#[test]
#[cfg(unix)]
fn cancel_kills_the_whole_process_group_including_a_grandchild() {
    let h = harness("groupkill", Options { scenario: "hang", ..Options::default() });
    assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Started { .. }));

    let child_pid: i32 = wait_for_file(&turn_dump(&h.dump, 1).join("pid.txt"))
        .trim()
        .parse()
        .expect("child pid");
    let grandchild_pid: i32 = wait_for_file(&turn_dump(&h.dump, 1).join("grandchild-pid.txt"))
        .trim()
        .parse()
        .expect("grandchild pid");
    assert_ne!(child_pid, grandchild_pid);
    assert!(nputer_lib::agent::runner::pid_alive(child_pid), "the child is running");
    assert!(nputer_lib::agent::runner::pid_alive(grandchild_pid), "the grandchild is running");

    match agent::cancel(&h.agent) {
        CancelOutcome::Cancelled { turn } => assert_eq!(turn, 1),
        other => panic!("expected Cancelled, got {other:?}"),
    }
    settle(&h.agent);

    // BOTH pids die. The grandchild is proof the signal went to the
    // GROUP, not the process.
    let deadline = Instant::now() + Duration::from_secs(15);
    while Instant::now() < deadline {
        if !nputer_lib::agent::runner::pid_alive(child_pid)
            && !nputer_lib::agent::runner::pid_alive(grandchild_pid)
        {
            break;
        }
        std::thread::sleep(Duration::from_millis(50));
    }
    assert!(!nputer_lib::agent::runner::pid_alive(child_pid), "the child outlived the cancel");
    assert!(
        !nputer_lib::agent::runner::pid_alive(grandchild_pid),
        "THE GRANDCHILD OUTLIVED THE CANCEL - the kill did not reach the process group"
    );

    // A cancel is an OUTCOME, not a failure: no `failed` event, and the
    // session stays resume-eligible.
    let events: Vec<RunEvent> = h.events.try_iter().collect();
    assert!(
        !events.iter().any(|e| matches!(e, RunEvent::Failed { .. })),
        "a cancel must not surface as a typed failure: {events:#?}"
    );
    let entry = sessions::load(&h.project).sessions.pop().expect("registry entry");
    assert_eq!(entry.status, "idle", "the kill is of the TURN; the session survives");
    assert_eq!(entry.native_session_id.as_deref(), Some("fake-session-0001"));
    assert!(matches!(agent::cancel(&h.agent), CancelOutcome::Idle), "nothing left to cancel");
}

/// THE APP-EXIT REAP: the same group kill, driven from the hook the
/// `RunEvent::ExitRequested`/`Exit` arm calls (§10 obligation 7's
/// unit-level half).
#[test]
#[cfg(unix)]
fn the_exit_hook_reaps_the_turns_process_group() {
    let h = harness("exitreap", Options { scenario: "hang", ..Options::default() });
    agent::start_genesis(&h.watch, &h.agent);
    let child_pid: i32 = wait_for_file(&turn_dump(&h.dump, 1).join("pid.txt"))
        .trim()
        .parse()
        .expect("child pid");
    let grandchild_pid: i32 = wait_for_file(&turn_dump(&h.dump, 1).join("grandchild-pid.txt"))
        .trim()
        .parse()
        .expect("grandchild pid");

    h.agent.reap_for_exit();

    // The GRANDCHILD is not our child, so nothing holds a zombie entry
    // for it: once the group signal lands it is gone immediately.
    assert!(
        !nputer_lib::agent::runner::pid_alive(grandchild_pid),
        "quitting the app leaves no grandchild"
    );
    // The direct child is signalled by the same `killpg`, but its pid
    // survives as a ZOMBIE until someone calls `wait()` — `kill(pid, 0)`
    // succeeds on zombies. The turn thread does that reap as it unwinds,
    // which `settle` waits for. (In production the app process is exiting
    // anyway, so an unreaped zombie is collected by init regardless; this
    // ordering is a test-precision point, not a leak.)
    settle(&h.agent);
    assert!(!nputer_lib::agent::runner::pid_alive(child_pid), "quitting the app leaves no child");
}

// ---- every §6 failure surface, typed ----------------------------------

#[test]
fn a_nonzero_exit_is_typed_with_the_clis_own_stderr_tail() {
    let h = harness("nonzero", Options { scenario: "nonzero", ..Options::default() });
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::ExitNonZero { code, stderr_tail } => {
            assert_eq!(code, Some(3));
            assert!(stderr_tail.contains("credentials expired"), "{stderr_tail}");
        }
        other => panic!("expected ExitNonZero, got {other:?}"),
    }
    let status = settle(&h.agent);
    assert_eq!(status.phase, Phase::Failed);
    // The project is untouched and the session stays resumable.
    assert!(!h.project.join("docs").exists());
    assert_eq!(sessions::load(&h.project).sessions[0].status, "idle");
}

/// THE REGRESSION PIN FOR WHAT THE REAL SMOKE FOUND, carried one step
/// further by T-029. Against the live `claude 2.1.226` this task's first
/// smoke run produced `exitNonZero { code: 1, stderrTail: "" }` — a typed
/// failure that told the user NOTHING, because the CLI reports
/// authentication failures in band on stdout (an `api_retry` system line
/// plus a `result` line whose `subtype` still reads "success" while
/// `is_error` is true) and leaves stderr completely empty.
///
/// T-025 fixed the SILENCE by routing the in-band lines into the same
/// ring stderr feeds, so the CLI's words arrived. What still did not
/// arrive was the MEANING: the screen read "the planner exited with code
/// 1" over an escaped one-line blob and offered a **Try again** button
/// that would fail identically forever. T-029 types it, so the screen can
/// name the one action that helps and route to the hand-driven fallback.
#[test]
fn an_in_band_auth_failure_is_typed_authfailed_not_a_relayed_exit_code() {
    let h = harness("autherror", Options { scenario: "auth-error", ..Options::default() });
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::AuthFailed { status, message } => {
            assert_eq!(status, Some(401), "the status the stream named, kept as a number");
            assert!(
                message.contains("authenticate") && message.contains("401"),
                "the CLI's own sentence is the message, got: {message:?}"
            );
            // Bounded and control-stripped like every other stream-borne
            // string: it is rendered, and it reaches log lines.
            assert!(!message.contains('\n'), "no raw newline survives: {message:?}");
        }
        other => panic!("expected AuthFailed, got {other:?}"),
    }
    let status = settle(&h.agent);
    assert_eq!(status.phase, Phase::Failed);
    // The session id was still captured, so the session stays resumable
    // once the human fixes their login — never a dead end.
    assert_eq!(status.native_session_id.as_deref(), Some("fake-session-0001"));
    assert_eq!(sessions::load(&h.project).sessions[0].status, "idle");
    // A failed turn is never banked as if the planner had answered.
    let lines = sessions::read_transcript(&h.project);
    assert!(lines.iter().all(|l| l.role != "planner"), "no planner line for a failed turn");
}

/// T-029 (T-025-s1): a turn that died because a TOOL was refused says
/// which tool, by name, instead of showing an exit code.
///
/// The discriminating half is the last assertion: this is the same exit
/// 1 + `is_error: true` shape the auth failure has, and it must NOT
/// classify as `AuthFailed` — the two are told apart by what the stream
/// named, not by how the process died.
#[test]
fn a_turn_killed_by_a_denied_tool_names_the_tool_rather_than_the_exit_code() {
    let h = harness("tooldenied", Options { scenario: "tool-denied", ..Options::default() });
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::ToolDenied { denials, terminal_reason } => {
            assert_eq!(denials, vec!["Bash".to_string(), "WebFetch".to_string()]);
            assert_eq!(terminal_reason.as_deref(), Some("refusal"));
        }
        other => panic!("expected ToolDenied, got {other:?}"),
    }
    let status = settle(&h.agent);
    assert_eq!(status.phase, Phase::Failed);
    // Same failure shape as the auth case, different classification.
    assert!(
        !matches!(status.last_error, Some(TurnError::AuthFailed { .. })),
        "exit 1 + is_error is not evidence of an auth failure: {:?}",
        status.last_error
    );
    // And the project is untouched: a denied tool is not a write.
    assert!(!h.project.join("docs").exists());
}

// ---- T-029-s6/s7: THE RECOVERED RETRY, AND THE DENIAL THAT WAS NOT THE
//      CAUSE ---------------------------------------------------------
//
// The first build classified off a MONOTONE LATCH: an `api_retry` 401
// seen anywhere in a turn survived to the classification closure, and
// `permission_denials` was read as the CAUSE whenever it was merely
// PRESENT. Both fabricate a cause for a turn that died of something
// else, and the auth one is worse than the blunt failure it replaced —
// `failureAction` returns `retry: false` for `authFailed`, so the screen
// REMOVES the Try again button (the action that would have worked) and
// prints `claude login` at a user whose login is fine.
//
// These six pins are the specification, and the two that discriminate
// are as load-bearing as the four that red: `the_same_stream_without…`
// is the control (only the 401 line differs), and `…403…no result line`
// is the counter-pin that catches an over-broad fix.

/// ROW 1. A recovered `api_retry` 401 in front of a full disk. The turn
/// died of ENOSPC and the screen must offer the one action that fixes a
/// full disk, which is trying again after clearing space.
#[test]
fn a_recovered_auth_retry_does_not_relabel_a_disk_full_failure_as_an_auth_failure() {
    let h = harness(
        "retryenospc",
        Options { scenario: "retry-401-then-enospc", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::ExitNonZero { code, stderr_tail } => {
            assert_eq!(code, Some(1));
            // The CLI's own words still arrive — the fix narrows the
            // CLASSIFICATION, it does not silence the relay.
            assert!(stderr_tail.contains("ENOSPC"), "{stderr_tail}");
        }
        other => panic!("expected ExitNonZero, got {other:?}"),
    }
    let status = settle(&h.agent);
    assert_eq!(status.phase, Phase::Failed);
    assert!(
        !matches!(status.last_error, Some(TurnError::AuthFailed { .. })),
        "a 401 the CLI RECOVERED from is not this turn's cause: {:?}",
        status.last_error
    );
}

/// THE CONTROL. Byte-identical to row 1 except that the `api_retry` line
/// is not emitted — same fixture function, one `bool` apart. It is green
/// on both sides of the fix by design: its job is to prove that the 401
/// line ALONE is what flipped the classification, which is what makes
/// row 1's red mean what it says.
#[test]
fn the_same_stream_without_the_retry_line_classifies_the_same_way() {
    let h = harness(
        "enospcctl",
        Options { scenario: "enospc-no-retry", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::ExitNonZero { code, stderr_tail } => {
            assert_eq!(code, Some(1));
            assert!(stderr_tail.contains("ENOSPC"), "{stderr_tail}");
        }
        other => panic!("expected ExitNonZero, got {other:?}"),
    }
    settle(&h.agent);
}

/// ROW 2. The 401 recovered, the planner ANSWERED (`is_error: false`,
/// a real question on the result line) and the process exited 1 anyway.
/// Nothing about this turn is an authentication failure.
#[test]
fn a_recovered_auth_retry_does_not_survive_a_result_line_that_is_not_an_error() {
    let h = harness(
        "retryclean",
        Options { scenario: "retry-401-then-clean-result", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::ExitNonZero { code, .. } => assert_eq!(code, Some(1)),
        other => panic!("expected ExitNonZero, got {other:?}"),
    }
    let status = settle(&h.agent);
    assert!(
        !matches!(status.last_error, Some(TurnError::AuthFailed { .. })),
        "a turn that answered did not fail to authenticate: {:?}",
        status.last_error
    );
}

/// ROW 3, the sharpest. A REAL tool denial — the exact shape this task
/// added `ToolDenied` for — standing behind a recovered 401. The latch
/// shadowed this task's own new classification with a stale one.
#[test]
fn a_real_tool_denial_behind_a_recovered_auth_retry_is_still_a_tool_denial() {
    let h = harness(
        "retrydenied",
        Options { scenario: "retry-401-then-tool-denied", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::ToolDenied { denials, terminal_reason } => {
            assert_eq!(denials, vec!["Bash".to_string()]);
            assert_eq!(terminal_reason.as_deref(), Some("refusal"));
        }
        other => panic!("expected ToolDenied, got {other:?}"),
    }
    settle(&h.agent);
}

/// THE COUNTER-PIN — the case the fix must NOT break, and the reason the
/// close is "a terminal result line clears the status" rather than "a
/// diagnostic status never classifies". Here the CLI dies of a 403
/// BEFORE writing any `result` line, so there is no terminal line to
/// clear anything, and the diagnostic is the only evidence there is.
/// This is a genuine authentication failure and must stay typed.
#[test]
fn a_diagnostic_auth_failure_with_no_result_line_at_all_is_still_authfailed() {
    let h = harness(
        "auth403",
        Options { scenario: "auth-403-no-result", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::AuthFailed { status, message } => {
            assert_eq!(status, Some(403));
            // No result line means no sentence from the CLI, so the
            // runner's own fallback wording is what is rendered.
            assert!(message.contains("authenticate"), "{message}");
        }
        other => panic!("expected AuthFailed, got {other:?}"),
    }
    settle(&h.agent);
}

/// T-029-s7. `permission_denials` on the `result` line is a CUMULATIVE
/// RECORD of everything refused during the turn, not a statement that a
/// refusal ended it. A planner denied `WebFetch`, that routed around it
/// and finished normally (`is_error: false`, `terminal_reason:
/// "end_turn"`), whose process then exits 1, did not die of the denial —
/// and its own terminal reason, sitting in the same typed struct the
/// denials came from, says so.
///
/// THE GUARD TAKEN IS THE NARROW ONE: `result_is_error`. The wider form
/// — "or a `terminal_reason` outside the CLI's normal-completion set" —
/// needs the set of reasons a REAL denial produces, and that set is
/// exactly what T-029-s5 records as still unverified (this machine's
/// login is revoked, so no denial can be provoked). Building the guard
/// on a guessed set is the mistake that earned this card its rejection.
#[test]
fn a_denial_the_planner_routed_around_is_not_blamed_for_an_unrelated_exit() {
    let h = harness(
        "deniedendturn",
        Options { scenario: "denied-then-end-turn", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
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
}

#[test]
fn a_first_turn_with_no_init_line_is_malformed() {
    let h = harness("noinit", Options { scenario: "no-init", ..Options::default() });
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::MalformedStream { why } => assert!(why.contains("init"), "{why}"),
        other => panic!("expected MalformedStream, got {other:?}"),
    }
    settle(&h.agent);
}

#[test]
fn a_non_json_flood_with_no_anchors_is_malformed() {
    let h = harness("flood", Options { scenario: "malformed-flood", ..Options::default() });
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::MalformedStream { why } => assert!(why.contains("no JSON"), "{why}"),
        other => panic!("expected MalformedStream, got {other:?}"),
    }
    settle(&h.agent);
}

#[test]
fn an_oversize_stream_line_is_malformed_not_an_out_of_memory() {
    let h = harness("oversize", Options { scenario: "oversize-line", ..Options::default() });
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::MalformedStream { why } => assert!(why.contains("exceeded"), "{why}"),
        other => panic!("expected MalformedStream, got {other:?}"),
    }
    settle(&h.agent);
}

#[test]
fn exit_zero_without_a_result_line_is_malformed() {
    let h = harness("noresult", Options { scenario: "exit-no-result", ..Options::default() });
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::MalformedStream { why } => assert!(why.contains("result"), "{why}"),
        other => panic!("expected MalformedStream, got {other:?}"),
    }
    settle(&h.agent);
}

#[test]
fn silence_before_the_first_line_is_a_start_timeout() {
    let h = harness(
        "starttimeout",
        Options {
            scenario: "slow-start",
            start_timeout: Duration::from_millis(400),
            ..Options::default()
        },
    );
    agent::start_genesis(&h.watch, &h.agent);
    assert_eq!(wait_failed(&h.events), TurnError::StartTimeout);
    settle(&h.agent);
}

#[test]
fn silence_mid_turn_is_a_stall() {
    let h = harness(
        "stall",
        Options {
            scenario: "slow-mid",
            start_timeout: Duration::from_secs(30),
            stall_timeout: Duration::from_millis(500),
            ..Options::default()
        },
    );
    agent::start_genesis(&h.watch, &h.agent);
    assert_eq!(wait_failed(&h.events), TurnError::Stall);
    settle(&h.agent);
}

#[test]
fn a_missing_binary_is_a_typed_spawn_failure_not_a_panic() {
    let h = harness(
        "spawnfail",
        Options {
            binary: Some(PathBuf::from("/nputer/definitely/not/here")),
            ..Options::default()
        },
    );
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::SpawnFailed { os } => assert!(!os.is_empty()),
        other => panic!("expected SpawnFailed, got {other:?}"),
    }
    settle(&h.agent);
}

/// Warnings and unknown event types are TOLERATED — a CLI that grows a
/// new stream type must not break the interview.
#[test]
fn warnings_and_unknown_event_types_do_not_fail_the_turn() {
    let h = harness("noisy", Options { scenario: "noisy", ..Options::default() });
    agent::start_genesis(&h.watch, &h.agent);
    match wait_completed(&h.events) {
        RunEvent::Completed { text, .. } => assert_eq!(text, "still fine"),
        other => unreachable!("{other:?}"),
    }
    settle(&h.agent);
    // The non-JSON warning never became model text.
    let lines = sessions::read_transcript(&h.project);
    assert!(lines.iter().all(|l| !l.text.contains("not JSON")));
}

// ---- resolution + refusals ---------------------------------------------

#[test]
fn a_cli_below_the_minimum_major_is_refused_loudly() {
    let h = harness("oldcli", Options { version: "1.9.0 (Claude Code)", ..Options::default() });
    match agent::start_genesis(&h.watch, &h.agent) {
        StartOutcome::UnsupportedVersion { found } => assert!(found.starts_with("1.9.0")),
        other => panic!("expected UnsupportedVersion, got {other:?}"),
    }
    // Nothing was spawned and nothing was written.
    assert!(!h.project.join(".nputer").exists());
}

#[test]
fn a_missing_cli_is_a_typed_not_found_never_a_dead_end() {
    let h = harness("notfound", Options::default());
    // Resolution with no injected binary and a PATH that holds nothing:
    // the login-shell probe is off, so this cannot find the real CLI.
    let cfg = RunnerConfig {
        binary_override: None,
        path_override: Some("/nputer-empty-path".into()),
        probe_login_shell: false,
        ..RunnerConfig::default()
    };
    let (tx, _rx) = mpsc::channel();
    let agent = agent::AgentState::new(cfg, move |e| {
        let _ = tx.send(e);
    });
    match agent::start_genesis(&h.watch, &agent) {
        StartOutcome::CliNotFound { probed } => {
            assert!(!probed.is_empty(), "the outcome says what was looked at");
            assert!(probed.iter().any(|p| p.contains("claude")));
        }
        other => panic!("expected CliNotFound, got {other:?}"),
    }
}

#[test]
fn a_second_start_offers_the_recorded_session_rather_than_auto_resuming() {
    let h = harness("resumeavail", Options::default());
    agent::start_genesis(&h.watch, &h.agent);
    wait_completed(&h.events);
    settle(&h.agent);

    match agent::start_genesis(&h.watch, &h.agent) {
        StartOutcome::ResumeAvailable { native_session_id, turns, model } => {
            assert_eq!(native_session_id, "fake-session-0001");
            assert_eq!(turns, 1);
            // T-047-s3: through `model_for_display`, never the raw field.
            assert_eq!(model.as_deref(), Some("fake-model-1"));
        }
        other => panic!("expected ResumeAvailable, got {other:?}"),
    }
    // No second turn ran.
    assert!(!turn_dump(&h.dump, 2).exists());
}

#[test]
fn a_turn_in_flight_refuses_a_second_one() {
    let h = harness("busy", Options { scenario: "hang", ..Options::default() });
    assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Started { .. }));
    wait_for(&h.events, "started", |e| matches!(e, RunEvent::Started { .. }));
    assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Busy));
    assert!(matches!(agent::send_turn(&h.watch, &h.agent, "x".into()), SendOutcome::Busy));
    agent::cancel(&h.agent);
    settle(&h.agent);
}

#[test]
fn a_project_switch_mid_genesis_yields_stale_project_not_a_cross_write() {
    let h = harness("stale", Options::default());
    agent::start_genesis(&h.watch, &h.agent);
    wait_completed(&h.events);
    settle(&h.agent);

    // The picker moved the open project out from under the session.
    let other = h.root.join("other-project");
    fs::create_dir_all(other.join("docs")).expect("mk other");
    let flight = h.watch.begin_pick().expect("picker free");
    // Commit the switch without a watcher thread: the ordinary path needs
    // a rendezvous, so drive the state directly through a fresh pick on a
    // detached channel is not possible - instead assert through a watch
    // whose project is simply different.
    drop(flight);
    let (ctl2, _rx2) = mpsc::channel();
    let watch2 = WatchState::new(Some(other.clone()), Arc::new(AtomicU64::new(0)), ctl2);
    match agent::send_turn(&watch2, &h.agent, "answer".into()) {
        SendOutcome::StaleProject { session_project } => {
            assert_eq!(session_project, h.project.display().to_string())
        }
        other => panic!("expected StaleProject, got {other:?}"),
    }
    // …and cancel remains available (the runner never auto-kills).
    assert!(matches!(agent::cancel(&h.agent), CancelOutcome::Idle));
}

// ---- .nputer/ stays outside the docs watch root (§5, criterion 3) ------

/// THE TWO-DIRECTION TEST. One live watcher, one docs-bearing project:
/// the runner's FULL write set produces ZERO snapshots, and then the
/// AGENT writing `docs/NORTH_STAR.md` lights the pipeline.
#[test]
fn the_runners_write_set_is_snapshot_silent_and_the_agents_docs_write_is_not() {
    let h = harness(
        "watchquiet",
        Options { scenario: "writes-docs", with_docs: true, ..Options::default() },
    );
    // A docs/ that exists but holds no plan: genesis-eligible, and the
    // ORDINARY recursive docs watch can arm on it.
    fs::write(h.project.join("docs/ARCHITECTURE.md"), "# Architecture\n").expect("seed docs");

    let seq = Arc::new(AtomicU64::new(0));
    let (emit_tx, emits) = mpsc::channel::<DocsSnapshot>();
    let ctl = spawn_watcher_thread(seq.clone(), None, move |snap| {
        let _ = emit_tx.send(snap.clone());
    });
    let watch = WatchState::new(None, seq, ctl);
    match apply_picked_folder(&watch, &h.project, watch.begin_pick().expect("free")) {
        docs_watch::PickOutcome::Picked { .. } => {}
        other => panic!("expected Picked, got {other:?}"),
    }

    // DIRECTION ONE: the runner's whole write set — the `.nputer/` dir
    // itself, the materialized kit, the registry, and a churn of
    // transcript appends. `.nputer/` sits OUTSIDE the recursive docs
    // watch; the root sentinel is non-recursive, so its own creation
    // wakes one batch that collects EQUAL to the baseline and is
    // suppressed. Nothing inside `.nputer/**` raises an event at all.
    nputer_lib::agent::kit::materialize(&h.project).expect("kit");
    sessions::upsert(
        &h.project,
        sessions::SessionEntry {
            id: "S1".into(),
            agent: "claude".into(),
            model: None,
            native_session_id: None,
            created: sessions::iso8601_utc(0),
            turns: 0,
            tasks: vec![],
            roles: vec!["planner".into()],
            status: "running".into(),
        },
    )
    .expect("registry");
    for turn in 0..50u32 {
        sessions::append_transcript(
            &h.project,
            &sessions::TranscriptLine {
                turn,
                role: "user".into(),
                text: format!("churn {turn}"),
                at_ms: 0,
                machine: false,
            },
        )
        .expect("transcript");
    }
    assert!(
        emits.recv_timeout(DEBOUNCE * 8).is_err(),
        "the runner's ENTIRE write set must produce zero docs snapshots"
    );

    // DIRECTION TWO: the fake agent writes docs/NORTH_STAR.md into its
    // cwd — the pipeline lights up, with no re-pick and no polling.
    let watch_for_agent = WatchState::new(
        Some(h.project.clone()),
        Arc::new(AtomicU64::new(0)),
        mpsc::channel().0,
    );
    agent::start_genesis(&watch_for_agent, &h.agent);
    wait_completed(&h.events);
    settle(&h.agent);

    let snapshot = emits
        .recv_timeout(Duration::from_secs(15))
        .expect("the agent's docs/ write must light the pipeline");
    assert!(
        snapshot.files.iter().any(|f| f.path == "docs/NORTH_STAR.md"),
        "the snapshot carries what the agent wrote: {:?}",
        snapshot.files.iter().map(|f| &f.path).collect::<Vec<_>>()
    );
    // Nothing under .nputer/ ever rides a snapshot.
    assert!(
        snapshot.files.iter().all(|f| !f.path.contains(".nputer")),
        "runtime files must never enter the docs model"
    );
}

// ---- surface fences -----------------------------------------------------

/// The fake agent is a TEST fixture: `tauri.conf.json` must never sidecar
/// it (or anything else) into a shipped bundle.
#[test]
fn the_bundle_declares_no_external_binaries() {
    let conf: serde_json::Value = serde_json::from_str(
        &fs::read_to_string(
            Path::new(env!("CARGO_MANIFEST_DIR")).join("tauri.conf.json"),
        )
        .expect("tauri.conf.json"),
    )
    .expect("parses");
    assert!(
        conf.pointer("/bundle/externalBin").is_none(),
        "an externalBin entry would ship a binary alongside the app - the fake agent never leaves the test tree"
    );
    let raw = fs::read_to_string(
        Path::new(env!("CARGO_MANIFEST_DIR")).join("tauri.conf.json"),
    )
    .expect("tauri.conf.json");
    assert!(!raw.contains("fake_agent"), "the fixture is never named in shipped config");
    assert!(!raw.contains("resources"), "the kit is compiled in, not a bundled resource (§3)");
}

/// No shell anywhere: the runner assembles argv arrays, never command
/// lines. This greps the module's own source for the shapes that would
/// mean otherwise (§8 item 3's review gate, made mechanical).
#[test]
fn no_source_in_the_agent_module_builds_a_shell_command_line() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("src/agent");
    let mut checked = 0;
    for entry in fs::read_dir(&dir).expect("agent module").flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("rs") {
            continue;
        }
        let source = fs::read_to_string(&path).expect("source");
        checked += 1;
        for (n, line) in source.lines().enumerate() {
            // The one `-c` in the tree is the login-shell probe's, whose
            // script argument is a compile-time constant; it is asserted
            // by name below rather than blanket-allowed.
            if line.contains("Command::new(\"sh\")")
                || line.contains("Command::new(\"/bin/sh\")")
                || line.contains("Command::new(\"bash\")")
            {
                panic!("{}:{} spawns a shell: {line}", path.display(), n + 1);
            }
        }
    }
    assert!(checked >= 5, "the whole module was scanned, not a subset");
    // The single shell invocation in the module is the PROBE, and its
    // script is a literal with no interpolation.
    let runner = fs::read_to_string(dir.join("runner.rs")).expect("runner.rs");
    assert!(runner.contains(r#""command -v claude && echo NPUTER_LOGIN_PATH=$PATH""#));
    assert!(
        !runner.contains("format!(\"command -v"),
        "the probe script must never be format!-assembled"
    );
}

// ---- T-039: the session-id injection gate ------------------------------
//
// `-r, --resume [value]` takes an OPTIONAL argument (2.1.226's own
// `--help`), so an id beginning with `-` is not the resume VALUE — it is a
// standalone FLAG. The T-025 verifier measured
// `--dangerously-skip-permissions` landing in a spawned argv exactly that
// way, through DATA, while the adapter's bypass pin stayed green because
// it searched the static TABLE. These are the pins for the gate that
// closes it, at both boundaries a captured id can arrive through.

/// THE REGRESSION PIN, end to end and data-borne: the fake CLI puts the
/// verifier's exact injection in its own init line. Before the gate, this
/// id was captured, emitted, written to `.nputer/sessions.json`, and
/// substituted into turn 2's argv as `["WebSearch", "--resume",
/// "--dangerously-skip-permissions"]` — a real spawned child, measured.
/// Now the turn fails typed and nothing downstream ever sees the id.
#[test]
fn a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded() {
    let h = harness("t039capture", Options { scenario: "hostile-id", ..Options::default() });
    assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Started { .. }));

    // Every event up to the failure, so ABSENCE is assertable too.
    let mut seen: Vec<RunEvent> = Vec::new();
    let deadline = Instant::now() + Duration::from_secs(20);
    let error = loop {
        match h.events.recv_timeout(Duration::from_millis(200)) {
            Ok(RunEvent::Failed { error, .. }) => break error,
            Ok(other) => seen.push(other),
            Err(mpsc::RecvTimeoutError::Timeout) if Instant::now() < deadline => continue,
            Err(err) => panic!("no failed event ({err:?}); saw {seen:#?}"),
        }
    };
    match &error {
        // T-029 (T-039-s3): its own envelope now. `MalformedStream` filed
        // this next to a truncated line; a refused id is a different fact
        // with a different remedy ("start fresh"), so it is named.
        TurnError::RejectedSessionId { why } => {
            assert!(why.contains("unusable session id"), "{why}");
            assert!(why.contains("begins with '-'"), "names the rejection: {why}");
            assert!(why.contains("--resume"), "names why it matters: {why}");
            assert!(!why.contains("dangerously"), "the refused id is not echoed back: {why}");
        }
        other => panic!("expected RejectedSessionId, got {other:?}"),
    }
    assert!(
        !seen.iter().any(|e| matches!(e, RunEvent::SessionRegistered { .. })),
        "the id must not be announced to the webview either: {seen:#?}"
    );
    assert!(
        !seen.iter().any(|e| matches!(e, RunEvent::Completed { .. })),
        "a turn whose init line is unusable is not an answer: {seen:#?}"
    );

    let status = settle(&h.agent);
    assert_eq!(status.phase, Phase::Failed);
    assert_eq!(status.native_session_id, None, "nothing to resume from");
    assert_eq!(status.last_error.as_ref(), Some(&error));

    // NOT WRITTEN TO THE REGISTRY. The entry exists (the start wrote it),
    // and its id field is empty — the hostile value never landed on disk.
    let registry = sessions::load(&h.project);
    assert_eq!(registry.sessions.len(), 1);
    assert_eq!(registry.sessions[0].native_session_id, None);
    assert_eq!(registry.sessions[0].status, "idle");
    let raw = fs::read_to_string(sessions::sessions_path(&h.project)).expect("registry file");
    assert!(!raw.contains("dangerously"), "the file must not carry it either: {raw}");

    // NO RESUME ATTEMPTED: there is nothing to resume with, and no second
    // child was ever spawned.
    assert!(matches!(agent::send_turn(&h.watch, &h.agent, "answer".into()), SendOutcome::NoSession));
    assert!(!turn_dump(&h.dump, 2).exists(), "no second child ran");
    let argv1 = read_argv(&h.dump, 1);
    assert!(!argv1.iter().any(|a| a == "--resume"), "turn 1 spawns fresh: {argv1:?}");
    assert!(
        !argv1.iter().any(|a| a.contains("dangerously")),
        "and nothing hostile is in turn 1's argv: {argv1:?}"
    );
}

/// The same capture gate, driven with one id per rejected class — the
/// allowlist is a shape, not a blocklist of the one string that was
/// measured. (NUL rides the registry path instead: `Command::env` cannot
/// carry one, so it is pinned at the unit level and in the read-boundary
/// test.)
#[test]
fn every_hostile_id_class_fails_the_turn_at_capture() {
    for (tag, id, fragment) in [
        ("dash", "--dangerously-skip-permissions", "begins with '-'"),
        ("traversal", "../../../etc/passwd", "starts with '.'"),
        ("slash", "a/../../b", "U+002F"),
        ("space", "e7954de6 --dangerously-skip-permissions", "U+0020"),
        ("newline", "e7954de6\n--dangerously-skip-permissions", "U+000A"),
        ("lookalike", "\u{435}7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77", "U+0435"),
        ("escape", "e7954\u{1b}[2Kde6", "U+001B"),
    ] {
        let h = harness(
            &format!("t039class-{tag}"),
            Options { scenario: "hostile-id", session_id: Some(id), ..Options::default() },
        );
        assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Started { .. }));
        match wait_failed(&h.events) {
            TurnError::RejectedSessionId { why } => assert!(
                why.contains("unusable session id") && why.contains(fragment),
                "{tag}: expected {fragment:?} in {why:?}"
            ),
            other => panic!("{tag}: expected RejectedSessionId, got {other:?}"),
        }
        settle(&h.agent);
        assert_eq!(sessions::load(&h.project).sessions[0].native_session_id, None, "{tag}");
    }

    // …and one absurdly long id, built rather than spelled out.
    let long = "a".repeat(4096);
    let h = harness(
        "t039class-long",
        Options { scenario: "hostile-id", session_id: Some(&long), ..Options::default() },
    );
    assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Started { .. }));
    match wait_failed(&h.events) {
        TurnError::RejectedSessionId { why } => {
            assert!(why.contains("4096 bytes") && why.contains("128-byte bound"), "{why}")
        }
        other => panic!("expected RejectedSessionId, got {other:?}"),
    }
    settle(&h.agent);
}

/// THE READ BOUNDARY (criterion 3). `.nputer/sessions.json` is a runtime
/// file in the user's project directory: a sync client, another tool, or a
/// corruption can write it, and T-029 spawns from what it says. A hostile
/// id in that file is refused with a typed outcome — and the discriminating
/// half: the same file with a well-shaped id still offers the resume.
#[test]
fn a_hostile_session_id_in_the_registry_file_is_refused_at_the_read_boundary() {
    let h = harness("t039registry", Options::default());
    let path = sessions::sessions_path(&h.project);
    fs::create_dir_all(path.parent().expect("parent")).expect("mkdir .nputer");
    let planted = |id: &str| {
        serde_json::json!({ "sessions": [{
            "id": "S1", "agent": "claude", "model": "claude-sonnet-5",
            "native_session_id": id, "created": "2026-08-16T09:20:02Z",
            "turns": 3, "tasks": [], "roles": ["planner"], "status": "idle"
        }]})
        .to_string()
    };

    for hostile in [
        "--dangerously-skip-permissions",
        "--permission-mode=bypassPermissions",
        // A NUL, which `execve` would truncate at — so what the CLI parses
        // would not be what anything checked. JSON carries it happily.
        "e7954de6\u{0}--dangerously-skip-permissions",
        "../../../../etc/passwd",
    ] {
        fs::write(&path, planted(hostile)).expect("plant a hostile registry");
        // T-029 (T-039-s3): its OWN envelope now. `Error { message }`
        // carried this next to "the registry could not be written", and
        // only one of the two has an affordance behind it.
        match agent::start_genesis(&h.watch, &h.agent) {
            StartOutcome::SessionIdRejected { registry_path, why } => {
                assert_eq!(registry_path, sessions::SESSIONS_REL);
                assert!(why.contains("refusing to resume session 'S1'"), "{why}");
                assert!(
                    why.contains("begins with '-'") || why.contains("U+"),
                    "the outcome names the rejection: {why}"
                );
                assert!(!why.contains("dangerously"), "no echo of the id: {why}");
            }
            other => panic!("expected SessionIdRejected for {hostile:?}, got {other:?}"),
        }
        // Nothing spawned, nothing materialized, and the file left alone
        // for the user to look at.
        assert!(!turn_dump(&h.dump, 1).exists(), "a refused read spawns no child");
        assert!(!h.project.join(".nputer/genesis/kit").exists(), "and materializes no kit");
        assert_eq!(fs::read_to_string(&path).expect("still there"), planted(hostile));
    }

    // THE DISCRIMINATING HALF: a well-shaped id is still offered.
    fs::write(&path, planted("e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77")).expect("plant a real id");
    match agent::start_genesis(&h.watch, &h.agent) {
        StartOutcome::ResumeAvailable { native_session_id, turns, .. } => {
            assert_eq!(native_session_id, "e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77");
            assert_eq!(turns, 3);
        }
        other => panic!("expected ResumeAvailable, got {other:?}"),
    }
    assert!(!turn_dump(&h.dump, 1).exists(), "offering a resume still spawns nothing");
}

/// THE CHOKE POINT. Even handed straight to `run_turn` — the call T-029's
/// restart-resume will make, with an id it read off disk — a hostile id
/// produces a typed failure and NO CHILD AT ALL. Assembly is fallible by
/// construction: there is no way to build a resume argv that skips the
/// validation.
#[test]
fn a_hostile_resume_id_handed_straight_to_the_runner_spawns_nothing() {
    use nputer_lib::agent::adapter::planner_adapter;
    use nputer_lib::agent::runner::{run_turn, Emitter, TurnRequest};
    use std::sync::atomic::AtomicBool;
    use std::sync::Mutex;

    let h = harness("t039choke", Options::default());
    let cfg = RunnerConfig {
        binary_override: Some(fake_agent_bin()),
        path_override: Some("/nputer-test-path/bin".into()),
        extra_env: vec![
            ("NPUTER_FAKE_SCENARIO".into(), "happy".into()),
            ("NPUTER_FAKE_DUMP_DIR".into(), h.dump.display().to_string()),
        ],
        probe_login_shell: false,
        ..RunnerConfig::default()
    };
    let adapter = planner_adapter();
    let cli = nputer_lib::agent::runner::resolve_cli(&cfg, adapter).expect("the fake resolves");
    let (tx, events) = mpsc::channel();
    let emitter = Emitter::new(
        Arc::new(move |event| {
            let _ = tx.send(event);
        }),
        Arc::new(AtomicU64::new(0)),
    );
    let child_slot = Mutex::new(None);
    let cancel = AtomicBool::new(false);

    let out = run_turn(
        &cfg,
        adapter,
        &cli,
        &TurnRequest {
            project_dir: h.project.clone(),
            prompt: "an answer".into(),
            resume: Some("--dangerously-skip-permissions".into()),
            turn: 2,
        },
        &emitter,
        &child_slot,
        &cancel,
    );
    match out.error {
        Some(TurnError::RejectedSessionId { ref why }) => {
            assert!(why.starts_with("refusing to resume:"), "{why}");
            assert!(why.contains("begins with '-'"), "{why}");
        }
        other => panic!("expected RejectedSessionId, got {other:?}"),
    }
    assert!(out.text.is_none() && !out.cancelled);
    assert!(!turn_dump(&h.dump, 1).exists(), "NOTHING was spawned");
    let relayed: Vec<RunEvent> = events.try_iter().collect();
    assert_eq!(relayed.len(), 1, "one failed event, no started: {relayed:#?}");
    assert!(matches!(relayed[0], RunEvent::Failed { .. }));

    // The same call with the observed real id shape spawns normally — the
    // gate refuses flags, not resumes.
    let out = run_turn(
        &cfg,
        adapter,
        &cli,
        &TurnRequest {
            project_dir: h.project.clone(),
            prompt: "an answer".into(),
            resume: Some("e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77".into()),
            turn: 2,
        },
        &emitter,
        &child_slot,
        &cancel,
    );
    assert!(out.error.is_none(), "{:?}", out.error);
    let argv = read_argv(&h.dump, 1);
    let idx = argv.iter().position(|a| a == "--resume").expect("resumed");
    assert_eq!(argv[idx + 1], "e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77");
}

// ==== T-060: what the runner trusts from disk — NOTHING =================
//
// T-047 wrote this section about a cache it had just GATED. T-060 retired
// that cache, so every test below asserts the strictly stronger property:
// not "a poisoned `agent-paths.json` is refused" but **there is no
// `agent-paths.json` to poison** — no reader, no writer, no invalidator,
// and no config path for one to live at.

/// Plant `agent-paths.json` BY HAND — a `format!` template, with no runner
/// code involved in producing it. This is what an attacker with write
/// access to the app config dir leaves behind.
///
/// **T-060 keeps this helper deliberately.** The runner can no longer
/// write such a file, so a test that could only produce files the code
/// writes could no longer produce one at all — and then "the file is
/// ignored" would be unfalsifiable.
fn plant_agent_paths(config: &Path, path: &str, login_path: Option<&str>) {
    fs::create_dir_all(config).expect("mk config");
    let entry = match login_path {
        Some(lp) => format!(r#"{{"path":{path:?},"login_path":{lp:?}}}"#),
        None => format!(r#"{{"path":{path:?}}}"#),
    };
    fs::write(config.join("agent-paths.json"), format!(r#"{{"entries":{{"claude":{entry}}}}}"#))
        .expect("plant agent-paths.json");
}

/// A REAL, executable binary at `dest` — the fake agent, copied. Given
/// `NPUTER_FAKE_TATTLE` it writes that file the instant it is executed, by
/// ANY argv including `--version`, which is what the resolve-time
/// `probe_version` reaches first.
fn plant_binary(dest: &Path) {
    fs::create_dir_all(dest.parent().expect("parent")).expect("mk bin dir");
    fs::copy(fake_agent_bin(), dest).expect("copy the fake agent");
}

/// A cfg that RESOLVES rather than taking the seam: `binary_override` is
/// None, so resolution has to find the binary for itself.
fn resolving_cfg(extra: Vec<(String, String)>, path_override: Option<&str>) -> RunnerConfig {
    RunnerConfig {
        binary_override: None,
        path_override: path_override.map(str::to_string),
        extra_env: extra,
        probe_login_shell: false,
        start_timeout: Duration::from_millis(1500),
        stall_timeout: Duration::from_millis(1500),
        coalesce: Duration::from_millis(40),
        kill_grace: Duration::from_millis(300),
        probe_timeout: Duration::from_secs(5),
    }
}

fn wired(project: &Path, cfg: RunnerConfig) -> (WatchState, agent::AgentState, mpsc::Receiver<RunEvent>) {
    let (ctl, ctl_rx) = mpsc::channel::<WatchCtl>();
    std::mem::forget(ctl_rx);
    let watch = WatchState::new(Some(project.to_path_buf()), Arc::new(AtomicU64::new(0)), ctl);
    let (tx, events) = mpsc::channel();
    let agent = agent::AgentState::new(cfg, move |event| {
        let _ = tx.send(event);
    });
    (watch, agent, events)
}

/// **THE T-060 HEADLINE (criterion 1, absorbing T-047-s1): THERE IS NO
/// CACHE TO POISON.**
///
/// This replaces `a_poisoned_agent_paths_json_executes_nothing_at_any_door`
/// and `the_cache_is_re_read_and_re_judged_before_every_turn`, and it is
/// stronger than both. Those asserted that a REFUSABLE entry was refused,
/// which leaves the question "what about an entry the gate accepts?" —
/// and T-047's own header answered it honestly: an absolute,
/// traversal-free file named `claude` pointing at an attacker's binary
/// still passed.
///
/// So the entry planted here is the one T-047's gate ACCEPTED: absolute,
/// traversal-free, named `claude`, and genuinely executable. Under T-047
/// this resolved and ran; under T-060 the file is not a source of
/// anything, so it resolves to typed not-found and the binary never
/// becomes a process. The tattle file's ABSENCE is the whole assertion.
#[test]
fn there_is_no_agent_paths_json_to_poison_at_any_door() {
    let root = std::env::temp_dir().join(format!(
        "nputer-t060-nocache-{}-{}",
        std::process::id(),
        now_ms()
    ));
    let project = root.join("project");
    let tattle = root.join("tattle.txt");
    fs::create_dir_all(&project).expect("mk project");
    // The entry T-047's gate would have ACCEPTED, not one it refused.
    plant_binary(&root.join("bin/claude"));
    let planted = root.join("bin/claude").display().to_string();
    plant_agent_paths(&root.join("config"), &planted, None);
    assert_eq!(
        nputer_lib::agent::runner::validate_resolved_binary(
            Path::new(&planted),
            adapter::planner_adapter()
        ),
        Ok(()),
        "the planted entry must be one T-047's gate ACCEPTED - otherwise this test \
         only re-proves T-047"
    );

    let extra = vec![
        ("NPUTER_FAKE_TATTLE".to_string(), tattle.display().to_string()),
        ("NPUTER_FAKE_SCENARIO".to_string(), "happy".to_string()),
    ];

    // DOOR 1 — `resolve_cli` itself, where `probe_version` spawned.
    let cfg = resolving_cfg(extra.clone(), Some("/nputer-test-path/bin"));
    match nputer_lib::agent::runner::resolve_cli(&cfg, adapter::planner_adapter()) {
        Err(nputer_lib::agent::runner::ResolveError::NotFound { probed }) => {
            assert!(
                !probed.iter().any(|p| p.contains("cached")),
                "nothing may report having consulted a cache: {probed:?}"
            );
            assert!(
                !probed.iter().any(|p| p.contains("agent-paths")),
                "the file is not even named as something that was looked at: {probed:?}"
            );
        }
        other => panic!("expected a typed NotFound, got {other:?}"),
    }
    assert!(!tattle.exists(), "THE PLANTED BINARY RAN AT RESOLVE TIME");

    // DOOR 2 — `start_genesis`, which resolves live on every start.
    let (watch, agent, _events) =
        wired(&project, resolving_cfg(extra.clone(), Some("/nputer-test-path/bin")));
    match agent::start_genesis(&watch, &agent) {
        StartOutcome::CliNotFound { probed } => {
            assert!(!probed.iter().any(|p| p.contains("cached")), "{probed:?}")
        }
        other => panic!("expected CliNotFound, got {other:?}"),
    }
    std::thread::sleep(Duration::from_millis(200));
    assert!(!tattle.exists(), "start_genesis executed the planted binary");
    // Nothing was written on the way to refusing, either.
    assert!(!sessions::sessions_path(&project).exists(), "registry written");
    assert!(!project.join(".nputer/genesis/kit").exists(), "kit materialized");

    // DOOR 3 — `send_turn`, which resolves again before every turn. Turn 1
    // goes through the SEAM so a live session exists; the file is planted
    // fresh underneath it and must still reach nothing.
    let dump = root.join("dump");
    fs::create_dir_all(&dump).expect("mk dump");
    let seam = RunnerConfig {
        binary_override: Some(fake_agent_bin()),
        extra_env: vec![
            ("NPUTER_FAKE_SCENARIO".to_string(), "happy".to_string()),
            ("NPUTER_FAKE_DUMP_DIR".to_string(), dump.display().to_string()),
        ],
        ..resolving_cfg(vec![], Some("/nputer-test-path/bin"))
    };
    let (watch, agent, events) = wired(&project, seam);
    assert!(matches!(agent::start_genesis(&watch, &agent), StartOutcome::Started { .. }));
    wait_completed(&events);
    while agent::status(&agent).phase == Phase::Running {
        std::thread::sleep(Duration::from_millis(20));
    }
    plant_agent_paths(&root.join("config"), &planted, None);
    match agent::send_turn(&watch, &agent, "answer two".into()) {
        SendOutcome::Accepted { turn } => assert_eq!(turn, 2),
        other => panic!("expected the turn to be accepted, got {other:?}"),
    }
    wait_completed(&events);
    while agent::status(&agent).phase == Phase::Running {
        std::thread::sleep(Duration::from_millis(20));
    }
    // The turn ran the SEAM's binary, not the file's — and the file's copy
    // is the one carrying the tattle variable.
    assert!(turn_dump(&dump, 2).exists(), "turn 2 did not spawn at all");
    assert!(!tattle.exists(), "send_turn resolved through the planted file");

    // …AND NOTHING EVER WROTE ONE. `config_dir` is gone from the struct,
    // so there is no path for a cache to be written to; the only
    // `agent-paths.json` under this tree is the one this test planted.
    let mut found: Vec<PathBuf> = Vec::new();
    find_named(&root, "agent-paths.json", &mut found);
    assert_eq!(
        found,
        vec![root.join("config/agent-paths.json")],
        "the runner wrote an agent-paths.json of its own"
    );

    let _ = fs::remove_dir_all(&root);
}

/// Every file named `name` under `dir`, recursively. Small and local: the
/// alternative is asserting a cache is absent at ONE path we chose, which
/// is exactly the assumption a reintroduced cache would break.
fn find_named(dir: &Path, name: &str, out: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            find_named(&path, name, out);
        } else if path.file_name().and_then(|n| n.to_str()) == Some(name) {
            out.push(path);
        }
    }
    out.sort();
}

/// **THE RELATIVE-PATH ATTACK, REFUSED (T-060 criterion 3, T-047-s5).**
///
/// T-047's verifier reproduced this with a tattler and recorded it
/// verbatim in the finding:
///
///     resolve_cli -> Ok(ResolvedCli { path: "relbin/claude", … })
///     TATTLE EXISTS: true
///     would the CACHE gate have accepted it? Err(NotAbsolute)
///
/// One gate, two doors, two answers: `validate_cached_binary` called the
/// path `NotAbsolute` and discarded it, and the probe arm executed it.
///
/// `which_on_path` reads the app's inherited `PATH` and hands each element
/// to `which_in`, which does `dir.join(binary)`. The element here is a
/// relative directory name — the same shape as `.`, as an empty element
/// (POSIX's spelling of the current directory) and as any unrooted entry a
/// dotfile appended without realising. This drives `which_in` through
/// `resolve_cli`'s search-path arm, which is the identical lookup and the
/// identical join; only the string's origin differs, and the finding was
/// never about its origin.
///
/// **BOTH HALVES RUN AGAINST THE SAME FIXTURE, IN ORDER.** The relative
/// spelling must reach no process; the ABSOLUTE spelling of the very same
/// directory must then reach one. A tattle file that never appears proves
/// nothing unless the tattler is shown to work.
#[test]
fn a_relative_search_path_element_reaches_no_process() {
    let root = std::env::temp_dir().join(format!(
        "nputer-t060-relpath-{}-{}",
        std::process::id(),
        now_ms()
    ));
    let project = root.join("project");
    let tattle = root.join("tattle.txt");
    fs::create_dir_all(&project).expect("mk project");
    plant_binary(&root.join("relbin/claude"));
    let extra = vec![
        ("NPUTER_FAKE_TATTLE".to_string(), tattle.display().to_string()),
        ("NPUTER_FAKE_SCENARIO".to_string(), "happy".to_string()),
    ];

    // ARM ONE: the relative element. Refused, and nothing executed.
    for hostile in ["relbin", ".", "", "relbin:.", ".:relbin"] {
        let cfg = resolving_cfg(extra.clone(), Some(hostile));
        match nputer_lib::agent::runner::resolve_cli(&cfg, adapter::planner_adapter()) {
            Err(nputer_lib::agent::runner::ResolveError::NotFound { .. }) => {}
            other => panic!("[{hostile}] expected NotFound, got {other:?}"),
        }
        assert!(
            !tattle.exists(),
            "[{hostile}] A RELATIVE PATH ELEMENT REACHED `Command::new`: {}",
            fs::read_to_string(&tattle).unwrap_or_default()
        );
        // …and through the app door too, which is where a real user is.
        let (watch, agent, _events) = wired(&project, resolving_cfg(extra.clone(), Some(hostile)));
        assert!(matches!(agent::start_genesis(&watch, &agent), StartOutcome::CliNotFound { .. }));
        std::thread::sleep(Duration::from_millis(150));
        assert!(!tattle.exists(), "[{hostile}] start_genesis executed it");
    }

    // ARM TWO, THE DISCRIMINATOR: the SAME directory, spelled absolutely.
    // Same binary, same fixture, same tattle file — only the spelling of
    // the search path differs, which is precisely the variable under test.
    let absolute = root.join("relbin").display().to_string();
    let cfg = resolving_cfg(extra.clone(), Some(&absolute));
    let resolved = nputer_lib::agent::runner::resolve_cli(&cfg, adapter::planner_adapter())
        .expect("the absolute spelling of the same directory must resolve");
    assert_eq!(resolved.path, root.join("relbin/claude"));
    assert!(
        tattle.exists(),
        "the tattler never fires at all - arm one proved nothing"
    );

    let _ = fs::remove_dir_all(&root);
}

/// **NO LOGIN PATH COMES OFF DISK, BECAUSE NOTHING DOES** (T-060,
/// completing T-047's second half).
///
/// `cli.login_path` becomes the child's `PATH`, which decides which `git`
/// and which `cp` the planner's own Bash resolves to — and it used to come
/// out of `agent-paths.json` verbatim, with no gate at all. Measured
/// pre-T-047, with the hostile element planted in the cache file:
///
///     [t047-probe-c] CHILD PATH: /nputer-hostile/bin:/tmp/nputer-attacker-shims
///     [t047-probe-c] child PATH carries the planted hostile element: true
///
/// T-047 removed the FIELD; T-060 removed the file. What is asserted is
/// unchanged in shape and stronger in premise: the planted value reaches
/// nothing, and what the child does get came through the probe channel.
#[test]
fn no_login_path_ever_comes_from_a_file() {
    const HOSTILE: &str = "/nputer-hostile/bin:/tmp/nputer-attacker-shims";

    // ARM ONE, the discriminating one: NO `path_override`, so if a file
    // were still trusted its `login_path` is exactly what `apply_child_env`
    // would reach for — as it did, pre-T-047.
    let root = std::env::temp_dir().join(format!(
        "nputer-t060-loginpath-{}-{}",
        std::process::id(),
        now_ms()
    ));
    let project = root.join("project");
    let dump = root.join("dump");
    fs::create_dir_all(&project).expect("mk project");
    fs::create_dir_all(&dump).expect("mk dump");
    plant_binary(&root.join("bin/claude"));
    plant_agent_paths(
        &root.join("config"),
        &root.join("bin/claude").display().to_string(),
        Some(HOSTILE),
    );

    let extra = vec![
        ("NPUTER_FAKE_SCENARIO".to_string(), "happy".to_string()),
        ("NPUTER_FAKE_DUMP_DIR".to_string(), dump.display().to_string()),
    ];
    // The binary comes through the SEAM here: with the cache retired the
    // file cannot supply one, and the question this test asks is about the
    // PATH, not about the binary.
    let cfg = RunnerConfig {
        binary_override: Some(root.join("bin/claude")),
        ..resolving_cfg(extra.clone(), None)
    };
    let (watch, agent, events) = wired(&project, cfg);
    assert!(matches!(agent::start_genesis(&watch, &agent), StartOutcome::Started { .. }));
    wait_completed(&events);
    while agent::status(&agent).phase == Phase::Running {
        std::thread::sleep(Duration::from_millis(20));
    }

    let child_path = read_env(&dump, 1).get("PATH").cloned().unwrap_or_default();
    assert!(
        !child_path.contains("nputer-hostile") && !child_path.contains("nputer-attacker-shims"),
        "A FILE'S login_path REACHED THE CHILD'S PATH: {child_path}"
    );
    // What it DID get is the live environment's PATH — the documented
    // fallback when no probe answered — never the file's.
    assert_eq!(
        child_path,
        std::env::var("PATH").unwrap_or_default(),
        "with no probe channel the child gets what WE have, not what the file said"
    );
    let _ = fs::remove_dir_all(&root);

    // ARM TWO: with the probe channel answering (under the seam, that is
    // `path_override`), the child's PATH is the FRESH value, byte for
    // byte, while the same hostile element sits in the file unread.
    let root = std::env::temp_dir().join(format!(
        "nputer-t060-freshpath-{}-{}",
        std::process::id(),
        now_ms()
    ));
    let project = root.join("project");
    let dump = root.join("dump");
    fs::create_dir_all(&project).expect("mk project");
    fs::create_dir_all(&dump).expect("mk dump");
    plant_binary(&root.join("bin/claude"));
    plant_agent_paths(
        &root.join("config"),
        &root.join("bin/claude").display().to_string(),
        Some(HOSTILE),
    );
    let extra = vec![
        ("NPUTER_FAKE_SCENARIO".to_string(), "happy".to_string()),
        ("NPUTER_FAKE_DUMP_DIR".to_string(), dump.display().to_string()),
    ];
    // Here the binary IS resolved rather than injected, over an absolute
    // search path — the one shape resolution still accepts.
    let cfg = resolving_cfg(extra, Some(&root.join("bin").display().to_string()));
    let (watch, agent, events) = wired(&project, cfg);
    assert!(matches!(agent::start_genesis(&watch, &agent), StartOutcome::Started { .. }));
    wait_completed(&events);
    while agent::status(&agent).phase == Phase::Running {
        std::thread::sleep(Duration::from_millis(20));
    }
    let child_path = read_env(&dump, 1).get("PATH").cloned().unwrap_or_default();
    assert_eq!(child_path, root.join("bin").display().to_string());
    assert!(
        fs::read_to_string(root.join("config/agent-paths.json"))
            .expect("the file is still there")
            .contains("nputer-hostile"),
        "the planted login_path is still ON DISK - it is simply never read"
    );
    let _ = fs::remove_dir_all(&root);
}

/// **THE GUARD IS ON IN THIS TEST BINARY (T-060 criterion 4).**
///
/// The lib's own `the_real_cli_arms_are_forbidden_from_a_test_binary`
/// cannot prove this case: inside the lib's unit-test build `cfg!(test)`
/// is true and short-circuits the derivation, so the `deps` check — the
/// mechanism every INTEGRATION test actually relies on — is never
/// exercised there. Here `cfg!(test)` is false, so this body is the only
/// place the real mechanism is pinned.
///
/// Nothing sets anything: no `[env]` entry, no wrapper, no shared setup,
/// no field on a struct. That is the whole claim.
#[test]
fn the_no_real_cli_guard_is_on_without_anything_being_set() {
    assert_eq!(
        std::env::var(nputer_lib::agent::runner::NO_REAL_CLI_VAR).ok(),
        None,
        "the guard must hold with the variable UNSET - if a suite has to set it, \
         a suite can forget it"
    );
    assert!(
        nputer_lib::agent::runner::real_cli_arms_forbidden(),
        "an integration test binary must not be able to reach the real CLI"
    );
    // And the mechanism is the one documented, not an accident of this
    // machine: this executable really does live in `deps/`.
    let exe = std::env::current_exe().expect("current_exe");
    assert_eq!(
        exe.parent().and_then(|p| p.file_name()).and_then(|n| n.to_str()),
        Some("deps"),
        "cargo stopped running test binaries out of deps/ - the derivation in \
         `running_as_cargo_test_binary` needs a new mechanism, and until it has one \
         every test in this repo can reach the user's real CLI"
    );
}

/// **THE GUARD PROVEN BY THE ATTACK THAT FOUND IT (T-060 criterion 6,
/// T-047-s6).**
///
/// T-047's verifier reconstructed a resolve with `probe_login_shell: true`
/// — the `..RunnerConfig::default()` idiom, and the default IS `true` —
/// and `cargo test` spawned the developer's own `claude` with the genesis
/// planner prompt. **No model ran and no tokens were spent only because
/// this machine's token is revoked. That is luck, not a control.**
///
/// This body is that exact configuration: `probe_login_shell: true`,
/// `binary_override: None`, no planted entry, and a controlled `$SHELL`.
/// It must now resolve to typed not-found instead of reaching the
/// developer's machine — **and the controlled `$SHELL` is a TATTLER, so
/// "the shell was never spawned" is measured rather than inferred.**
///
/// A guard nobody has watched refuse is a guard nobody has watched.
#[test]
fn the_configuration_that_reached_the_real_cli_now_resolves_to_typed_not_found() {
    use std::os::unix::fs::PermissionsExt;

    let root = std::env::temp_dir().join(format!(
        "nputer-t060-accident-{}-{}",
        std::process::id(),
        now_ms()
    ));
    let project = root.join("project");
    fs::create_dir_all(&project).expect("mk project");
    let tattle = root.join("shell-ran.txt");
    let lifted_tattle = root.join("shell-ran-lifted.txt");
    let binary_tattle = root.join("binary-ran.txt");

    // The binary the FIXTURE shell will point at, so that the lifted arm
    // below resolves inside this temp tree and never near the machine.
    plant_binary(&root.join("bin/claude"));

    // A "shell" that answers the PATH question, FAILS `command -v`, and
    // tattles if it is executed at all — T-047's verifier's exact shape.
    // Named `zsh` so it passes T-060's own name check: this test must not
    // pass for the wrong reason.
    let shell = root.join("fail/zsh");
    fs::create_dir_all(root.join("fail")).expect("mk fail");
    fs::write(
        &shell,
        format!(
            "#!/bin/sh\necho ran > {}\necho NPUTER_LOGIN_PATH=/nputer-t060/bin\nexit 1\n",
            tattle.display()
        ),
    )
    .expect("write shell");
    fs::set_permissions(&shell, fs::Permissions::from_mode(0o755)).expect("chmod");

    // **PRE-FLIGHT, AND IT IS LOAD-BEARING RATHER THAN DECORATIVE.**
    // Everything below resolves with `probe_login_shell: true`, so if the
    // guard is broken this body is a way to reach the developer's machine
    // — which is how T-060-s1 was found. Asserting the guard BEFORE the
    // first resolve makes a broken guard fail here, harmlessly, instead
    // of two statements later on somebody's real `claude`. It is also
    // what makes this test safe to poison-drill.
    assert!(
        nputer_lib::agent::runner::real_cli_arms_forbidden(),
        "the guard is already off before this test does anything - refusing to resolve"
    );

    let restore = std::env::var("SHELL").ok();
    std::env::set_var("SHELL", &shell);

    // THE ACCIDENTAL CONFIGURATION, verbatim: the default idiom, with
    // nothing turned off.
    let cfg = RunnerConfig {
        extra_env: vec![("NPUTER_FAKE_SCENARIO".to_string(), "happy".to_string())],
        ..RunnerConfig::default()
    };
    assert!(cfg.probe_login_shell, "the default MUST still be true - that is the trap");
    assert_eq!(cfg.binary_override, None, "…and no seam is set");

    let outcome = nputer_lib::agent::runner::resolve_cli(&cfg, adapter::planner_adapter());
    match &outcome {
        Err(nputer_lib::agent::runner::ResolveError::NotFound { probed }) => assert!(
            probed.iter().any(|p| p.contains("NPUTER_NO_REAL_CLI")),
            "the refusal must NAME the guard that refused: {probed:?}"
        ),
        other => panic!("THE GUARD DID NOT HOLD: {other:?}"),
    }
    // The whole point, measured: no shell was spawned.
    assert!(
        !tattle.exists(),
        "THE LOGIN SHELL RAN - the guard fires after the spawn, not before"
    );

    // Through the app door too, which is where the accident happened: a
    // `start_genesis` on a default config.
    let (watch, agent, _events) = wired(&project, cfg);
    assert!(matches!(agent::start_genesis(&watch, &agent), StartOutcome::CliNotFound { .. }));
    std::thread::sleep(Duration::from_millis(150));
    assert!(!tattle.exists(), "start_genesis spawned the login shell");
    assert!(!sessions::sessions_path(&project).exists(), "a session was registered");

    // ---- THE DISCRIMINATING HALF ------------------------------------
    //
    // Without it, "not found" could just mean the fixture was broken. So
    // the guard is lifted and the SAME configuration must reach the SAME
    // shell.
    //
    // **THE FIXTURE SHELL CHANGES FOR THIS ARM, AND THE REASON IS THE
    // FINDING ITSELF.** The first draft of this test lifted the guard
    // while `$SHELL` still failed `command -v` — so resolution fell
    // through to `which_on_path`, read the DEVELOPER'S OWN `PATH`, found
    // their real `/opt/homebrew/bin/claude` and executed it with
    // `--version`. **The discriminating half of the guard's own test was
    // a way to defeat the guard**, which is T-047-s6's accident happening
    // inside the proof that it cannot. Filed as T-060-s1.
    //
    // The fix is to make the lifted arm SUCCEED: a shell whose
    // `command -v` names the planted fixture, so the whole resolve stays
    // inside this temp tree and `which_on_path` is never reached. It also
    // makes the lift window safe for any test running concurrently — the
    // only `$SHELL` visible during it answers with a fixture path.
    let ok_shell = root.join("ok/zsh");
    fs::create_dir_all(root.join("ok")).expect("mk ok");
    fs::write(
        &ok_shell,
        format!(
            "#!/bin/sh\necho ran > {}\necho {}\necho NPUTER_LOGIN_PATH=/nputer-t060/bin\nexit 0\n",
            lifted_tattle.display(),
            root.join("bin/claude").display()
        ),
    )
    .expect("write ok shell");
    fs::set_permissions(&ok_shell, fs::Permissions::from_mode(0o755)).expect("chmod");
    std::env::set_var("SHELL", &ok_shell);

    let cfg = RunnerConfig {
        extra_env: vec![(
            "NPUTER_FAKE_TATTLE".to_string(),
            binary_tattle.display().to_string(),
        )],
        ..RunnerConfig::default()
    };
    std::env::set_var("NPUTER_NO_REAL_CLI", "0");
    let lifted = nputer_lib::agent::runner::resolve_cli(&cfg, adapter::planner_adapter());
    std::env::set_var("NPUTER_NO_REAL_CLI", "1");

    assert!(
        lifted_tattle.exists(),
        "with the guard lifted the shell must run - otherwise the refusal above was \
         not the guard's doing. resolve returned {lifted:?}"
    );
    let resolved = lifted.expect("the fixture shell names a real, absolute, correctly named file");
    assert_eq!(
        resolved.path,
        root.join("bin/claude"),
        "the lifted resolve must land on the FIXTURE and never on the machine"
    );
    assert!(binary_tattle.exists(), "…and it is that fixture binary the version probe ran");
    assert_eq!(resolved.login_path.as_deref(), Some("/nputer-t060/bin"));

    // Restored, and the restoration ASSERTED: every test that runs after
    // this one must find the guard back on.
    std::env::remove_var("NPUTER_NO_REAL_CLI");
    match restore {
        Some(value) => std::env::set_var("SHELL", value),
        None => std::env::remove_var("SHELL"),
    }
    assert!(
        nputer_lib::agent::runner::real_cli_arms_forbidden(),
        "the guard must be back on for every test that runs after this one"
    );
    let _ = fs::remove_dir_all(&root);
}

/// **CRITERION 4 (T-039-s2): THE `model` OFF THE INIT LINE IS BOUNDED.**
///
/// Measured pre-fix, from the same init line the session id rides:
///
///     [t047-probe-d/oversize] registry bytes: 200290 B, stored model len 200000 B
///     [t047-probe-d/control chars] stored model: "claude\u{1b}[2K\u{7}-opus\nSTOLEN"
///
/// A hostile model is REFUSED — never coerced, never truncated into
/// something acceptable — and the turn stands, because the answer the
/// planner just wrote is still good and a cosmetic field is not worth
/// destroying an interview turn over (the recorded asymmetry with the
/// session id, which MUST fail its turn because it cannot be resumed).
#[test]
fn a_hostile_init_line_model_is_refused_and_a_real_one_round_trips() {
    for (tag, model) in [
        ("oversize", "M".repeat(200_000)),
        ("control-chars", "claude\u{1b}[2K\u{7}-opus\nSTOLEN".to_string()),
        ("non-ascii", "clau\u{202e}de-opus".to_string()),
    ] {
        let h = harness(
            &format!("model-{tag}"),
            Options { model: Some(model.clone()), ..Options::default() },
        );
        assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Started { .. }));
        // THE TURN STANDS: a refused model does not fail the turn.
        wait_completed(&h.events);
        let status = settle(&h.agent);
        assert_eq!(
            status.native_session_id.as_deref(),
            Some("fake-session-0001"),
            "[{tag}] the id off the SAME init line still rides"
        );

        let registry = sessions::load(&h.project);
        assert_eq!(registry.sessions[0].model, None, "[{tag}] registry model");
        let raw = fs::read_to_string(sessions::sessions_path(&h.project)).expect("registry file");
        assert!(
            raw.len() < 1_000,
            "[{tag}] the registry is {} bytes - the model was not bounded",
            raw.len()
        );
        // Not coerced into something acceptable, either: the field is
        // ABSENT (serde skips a `None`), not present-and-shortened, and no
        // fragment of the hostile value survives anywhere in the bytes.
        assert!(
            !raw.contains("\"model\""),
            "[{tag}] the model key is written at all: {raw}"
        );
        for fragment in ["MMMM", "STOLEN", "\u{1b}", "\u{202e}", "1b5b", "202e"] {
            assert!(
                !raw.contains(fragment),
                "[{tag}] {fragment:?} survived into the registry: {raw}"
            );
        }
    }

    // The discriminating half: real model names still round-trip into
    // `.nputer/sessions.json` untouched, including provider spellings the
    // session-id character class would have refused.
    for model in ["claude-opus-5", "us.anthropic.claude-3-5-sonnet-20241022-v2:0"] {
        let h = harness(
            "model-good",
            Options { model: Some(model.to_string()), ..Options::default() },
        );
        assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Started { .. }));
        wait_completed(&h.events);
        settle(&h.agent);
        assert_eq!(sessions::load(&h.project).sessions[0].model.as_deref(), Some(model));
        assert!(fs::read_to_string(sessions::sessions_path(&h.project))
            .expect("registry file")
            .contains(model));
    }
}

// ---- the one env-gated real smoke (§7) ---------------------------------

/// THE ONLY TEST IN THE REPO THAT MAY CALL A REAL MODEL. `#[ignore]`d and
/// additionally env-gated, so neither `cargo test` nor CI can reach it;
/// it is run ONCE, by hand, to record the real stream's line shapes as
/// the fake fixtures' provenance.
///
///     NPUTER_REAL_CLI=1 cargo test --test agent_runner real_cli -- --ignored --nocapture
#[test]
#[ignore = "spawns the user's real agent CLI and calls a model; run explicitly, off-suite"]
fn real_cli_smoke_records_the_stream_schema() {
    if std::env::var("NPUTER_REAL_CLI").as_deref() != Ok("1") {
        eprintln!("NPUTER_REAL_CLI=1 not set - refusing to call a real model");
        return;
    }
    // T-060: THE ONE DELIBERATE OPT-OUT. Every other test in the repo is
    // refused the login-shell and PATH arms because it runs from a cargo
    // test binary; this one asks for them, in one line, after two gates
    // (`#[ignore]` and `NPUTER_REAL_CLI=1`) have already been passed by
    // hand. Explicit `0` rather than an unset, because unset means
    // "derive it" and the derivation would forbid it again.
    std::env::set_var(nputer_lib::agent::runner::NO_REAL_CLI_VAR, "0");
    let root = std::env::temp_dir().join(format!("nputer-t025-realsmoke-{}", now_ms()));
    let project = root.join("project");
    fs::create_dir_all(&project).expect("mk project");

    let cfg = RunnerConfig::default();
    let (tx, events) = mpsc::channel();
    let agent = agent::AgentState::new(cfg, move |event| {
        println!("[real-smoke] {}", serde_json::to_string(&event).unwrap_or_default());
        let _ = tx.send(event);
    });
    let (ctl, _rx) = mpsc::channel();
    let watch = WatchState::new(Some(project.clone()), Arc::new(AtomicU64::new(0)), ctl);

    println!("[real-smoke] start: {:?}", agent::start_genesis(&watch, &agent));
    let event = wait_for(&events, "completed or failed", |e| {
        matches!(e, RunEvent::Completed { .. } | RunEvent::Failed { .. })
    });
    println!("[real-smoke] terminal event: {event:#?}");
    println!("[real-smoke] status: {:#?}", settle(&agent));
    println!(
        "[real-smoke] registry: {}",
        fs::read_to_string(sessions::sessions_path(&project)).unwrap_or_default()
    );
    let _ = fs::remove_dir_all(&root);
}

// ==== T-029: the restart simulation =====================================
//
// THE SUCCESSION GUARANTEE APPLIED TO THE INTERVIEW. Every test below
// throws away the whole in-memory `AgentState` — the app process, as far
// as this module can simulate one — and asks the SAME project directory to
// carry on. Nothing is passed between the two halves except the files on
// disk, which is exactly the claim under test.

/// A second app process over the SAME project. Deliberately NOT a
/// `Harness`: it owns no root and cleans nothing up, so the original's
/// `Drop` stays the single owner of the temp tree.
struct Reboot {
    watch: WatchState,
    _ctl_rx: mpsc::Receiver<WatchCtl>,
    agent: agent::AgentState,
    events: mpsc::Receiver<RunEvent>,
}

/// Restart the app over `h.project`. The new `AgentState` shares nothing
/// with the old one: no session id, no turn number, no phase, no registry
/// id — `Inner::default()` all the way down. If a resume works after this,
/// it worked off disk.
fn reboot(h: &Harness, scenario: &str) -> Reboot {
    let cfg = RunnerConfig {
        binary_override: Some(fake_agent_bin()),
        path_override: Some("/nputer-test-path/bin:/nputer-test-path/sbin".into()),
        extra_env: vec![
            ("NPUTER_FAKE_SCENARIO".to_string(), scenario.to_string()),
            ("NPUTER_FAKE_DUMP_DIR".to_string(), h.dump.display().to_string()),
            ("NPUTER_FAKE_VERSION".to_string(), "2.1.226 (Claude Code)".to_string()),
        ],
        probe_login_shell: false,
        start_timeout: Duration::from_millis(1500),
        stall_timeout: Duration::from_millis(1500),
        coalesce: Duration::from_millis(40),
        kill_grace: Duration::from_millis(300),
        probe_timeout: Duration::from_secs(5),
    };
    let (ctl, ctl_rx) = mpsc::channel();
    let watch = WatchState::new(Some(h.project.clone()), Arc::new(AtomicU64::new(0)), ctl);
    let (tx, events) = mpsc::channel();
    let agent = agent::AgentState::new(cfg, move |event| {
        let _ = tx.send(event);
    });
    Reboot { watch, _ctl_rx: ctl_rx, agent, events }
}

/// CRITERION 1. Reopen a project with an in-flight genesis and the
/// interview carries on: the adapter's RESUME template, the recorded
/// native id, and a chat rehydrated from `transcript.jsonl`.
///
/// The discriminating assertion is `read_argv(.., 2)`: turn 2 was spawned
/// by a process that never saw turn 1, so `--resume fake-session-0001` in
/// its argv can only have come off disk.
#[test]
fn an_app_restart_mid_interview_resumes_the_recorded_session_off_disk() {
    let h = harness("t029resume", Options::default());
    agent::start_genesis(&h.watch, &h.agent);
    wait_completed(&h.events);
    let before = settle(&h.agent);
    assert_eq!(before.native_session_id.as_deref(), Some("fake-session-0001"));

    // --- the app dies here. Nothing below shares state with anything above.
    let app = reboot(&h, "happy");
    assert_eq!(
        agent::status(&app.agent).native_session_id,
        None,
        "the fresh process starts knowing nothing"
    );
    assert_eq!(agent::status(&app.agent).turn, 0);

    // The offer, read off `.nputer/sessions.json`.
    match agent::start_genesis(&app.watch, &app.agent) {
        StartOutcome::ResumeAvailable { native_session_id, turns, model } => {
            assert_eq!(native_session_id, "fake-session-0001");
            assert_eq!(turns, 1);
            assert_eq!(model.as_deref(), Some("fake-model-1"));
        }
        other => panic!("expected ResumeAvailable, got {other:?}"),
    }
    assert!(!turn_dump(&h.dump, 2).exists(), "offering a resume spawns nothing");

    // …and taking it.
    match agent::resume_genesis(&app.watch, &app.agent) {
        StartOutcome::Started { turn } => assert_eq!(turn, 2, "one past the recorded turn count"),
        other => panic!("expected Started, got {other:?}"),
    }
    wait_completed(&app.events);
    settle(&app.agent);

    let argv = read_argv(&h.dump, 2);
    let at = argv.iter().position(|a| a == "--resume").expect("the RESUME template was used");
    assert_eq!(argv[at + 1], "fake-session-0001", "the id came off disk, as ONE argv element");
    assert!(
        !argv.iter().any(|a| a.contains("dangerously")),
        "the bypass ban survives the resume path: {argv:?}"
    );

    // THE REHYDRATION. Turn 1's halves are still readable, and the app
    // wrote nothing under docs/ to get them.
    let lines = agent::transcript(&app.watch);
    assert!(lines.len() >= 2, "the transcript rehydrates: {lines:#?}");
    let planner = lines.iter().find(|l| l.role == "planner" && l.turn == 1).expect("planner half");
    assert!(!planner.machine, "the planner's own answer is not app-assembled");
    // THE APP-ASSEMBLED HALVES ARE MARKED, never recognised by reading
    // them. Turn 1's kickoff and the resume nudge both ride
    // `role: "user"` — they genuinely are the user half of the protocol —
    // so a rehydrated chat needs a TYPED way to keep "You are the
    // planner. KIT ROOT: …" out of the human's own bubble.
    let kickoff = lines.iter().find(|l| l.role == "user" && l.turn == 1).expect("user half");
    assert!(kickoff.machine, "the kickoff is app-assembled: {:?}", kickoff.text);
    let nudge = lines.iter().find(|l| l.role == "user" && l.turn == 2).expect("resume nudge");
    assert!(nudge.machine, "so is the resume nudge: {:?}", nudge.text);
    // …and it survives the round trip through the file, which is where
    // the serde default has to hold.
    let raw = fs::read_to_string(sessions::transcript_path(&h.project)).expect("jsonl");
    assert!(raw.contains("\"machine\":true"), "written, not inferred: {raw}");
    assert!(!h.project.join("docs").exists(), "the app is a lens; the planner writes docs/");
}

/// CRITERION 2. The transcript cache is LOSABLE BY CHARTER, and this pins
/// what that costs: scrollback, and nothing else.
///
/// Both losses are driven — the file deleted, and the file replaced with
/// garbage — because "missing" and "corrupt" reach different code (an
/// unreadable path against unparseable lines) and only one of them was
/// ever exercised before.
#[test]
fn a_lost_or_corrupt_transcript_still_resumes_from_the_registry_and_docs() {
    let h = harness("t029losscache", Options::default());
    agent::start_genesis(&h.watch, &h.agent);
    wait_completed(&h.events);
    settle(&h.agent);
    let path = sessions::transcript_path(&h.project);
    assert!(path.exists(), "there is a cache to lose");

    for (label, wreck) in [
        ("deleted", true),
        ("corrupt", false),
    ] {
        if wreck {
            fs::remove_file(&path).expect("delete the cache");
        } else {
            fs::write(&path, "\u{0}not json at all\n{\"turn\": \n\n").expect("corrupt the cache");
        }

        let app = reboot(&h, "happy");
        // The rehydration is empty — never an error, never a panic.
        assert!(agent::transcript(&app.watch).is_empty(), "{label}: no history to render");
        // …and the resume still works, because the ID is in the REGISTRY
        // and the banked progress is in `docs/`. Neither is this file.
        let record = sessions::genesis_record(&h.project)
            .unwrap_or_else(|| panic!("{label}: the registry is the truth and it survived"));
        assert_eq!(record.native_session_id.as_deref(), Some("fake-session-0001"), "{label}");
        assert!(record.turns >= 1, "{label}: {record:?}");
        let expected = record.turns as u32 + 1;
        match agent::resume_genesis(&app.watch, &app.agent) {
            StartOutcome::Started { turn } => assert_eq!(turn, expected, "{label}"),
            other => panic!("{label}: expected Started, got {other:?}"),
        }
        wait_completed(&app.events);
        settle(&app.agent);
        // The resumed turn re-appends, so the cache heals on its own.
        assert!(!agent::transcript(&app.watch).is_empty(), "{label}: the cache refills");
    }
}

/// CRITERION 3. The native session will not resume, and the interview is
/// DEGRADED RATHER THAN DEAD: a fresh session, kicked off with the
/// method's own resume rule, over the docs the last one banked.
#[test]
fn a_session_that_will_not_resume_continues_as_a_fresh_one_over_the_banked_docs() {
    let h = harness("t029fresh", Options::default());
    agent::start_genesis(&h.watch, &h.agent);
    wait_completed(&h.events);
    settle(&h.agent);

    // The planner banked something before the session went bad. (The fake
    // writes nothing, so the test stands in for it — which is honest: the
    // point is that `docs/` is the truth, whoever wrote it.)
    fs::create_dir_all(h.project.join("docs")).expect("mk docs");
    fs::write(h.project.join("docs/NORTH_STAR.md"), "# North star\n\nreal content\n")
        .expect("bank an artifact");

    // The recorded id goes bad under the app — a corrupted runtime file,
    // exactly the class T-039's read boundary exists for.
    let raw = fs::read_to_string(sessions::sessions_path(&h.project)).expect("registry");
    fs::write(
        sessions::sessions_path(&h.project),
        raw.replace("fake-session-0001", "--dangerously-skip-permissions"),
    )
    .expect("poison the id");

    let app = reboot(&h, "happy");
    match agent::start_genesis(&app.watch, &app.agent) {
        StartOutcome::SessionIdRejected { registry_path, why } => {
            assert_eq!(registry_path, sessions::SESSIONS_REL);
            assert!(why.contains("begins with '-'"), "{why}");
        }
        other => panic!("expected SessionIdRejected, got {other:?}"),
    }
    assert!(!turn_dump(&h.dump, 2).exists(), "a refused resume spawns nothing");

    // THE WAY FORWARD.
    match agent::fresh_genesis(&app.watch, &app.agent) {
        StartOutcome::Started { turn } => assert_eq!(turn, 1, "a fresh session starts at turn 1"),
        other => panic!("expected Started, got {other:?}"),
    }
    wait_completed(&app.events);
    settle(&app.agent);

    // A FRESH spawn: no `--resume` anywhere in the argv. (The fake dumps
    // into the first FREE `turn-N`, so this second spawn is `turn-2`
    // whatever the runner numbered the turn itself.)
    let argv = read_argv(&h.dump, 2);
    assert!(!argv.iter().any(|a| a == "--resume"), "a fresh session resumes nothing: {argv:?}");

    // The kickoff carries the METHOD'S resume rule, because docs/ is not
    // empty and telling a fresh planner to "scaffold stage 0 first" over
    // banked artifacts is how real content gets overwritten.
    let stdin = read_dump(&h.dump, 2, "stdin.txt");
    assert!(stdin.contains("RESUME RULE"), "{stdin}");
    assert!(stdin.contains("re-ask nothing that is already on disk"), "{stdin}");
    assert!(stdin.contains("never overwrite real content"), "{stdin}");

    // The old entry is ABANDONED, not deleted (the method's own word), a
    // new one is running, and the banked artifact is untouched.
    let file = sessions::load(&h.project);
    assert_eq!(file.sessions.len(), 2, "{file:#?}");
    assert_eq!(file.sessions[0].status, "dead", "the old session is marked, not erased");
    assert_eq!(file.sessions[1].id, "S2");
    assert_eq!(
        fs::read_to_string(h.project.join("docs/NORTH_STAR.md")).expect("still there"),
        "# North star\n\nreal content\n",
        "docs/ is project truth and nothing here writes it"
    );
}

/// CRITERION 5, FROM THE UI PATH. Cancel, then restart the app: the child
/// is dead, `docs/` was never touched, and the project is still openable
/// AND resumable — the three halves of "a mid-interview kill loses
/// nothing" (ADR-017 clause 3).
#[test]
#[cfg(unix)]
fn a_cancelled_interview_leaves_a_dead_child_an_untouched_docs_and_a_resumable_project() {
    let h = harness("t029cancel", Options { scenario: "hang", ..Options::default() });
    assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Started { .. }));
    let child_pid: i32 = wait_for_file(&turn_dump(&h.dump, 1).join("pid.txt"))
        .trim()
        .parse()
        .expect("child pid");

    // The UI path: exactly what `cancelTurn()` reaches.
    assert!(matches!(agent::cancel(&h.agent), CancelOutcome::Cancelled { turn: 1 }));
    settle(&h.agent);
    let deadline = Instant::now() + Duration::from_secs(15);
    while Instant::now() < deadline && nputer_lib::agent::runner::pid_alive(child_pid) {
        std::thread::sleep(Duration::from_millis(50));
    }
    assert!(!nputer_lib::agent::runner::pid_alive(child_pid), "the child outlived the cancel");
    assert!(!h.project.join("docs").exists(), "a cancel never touches docs/");

    // …and the project reopens into a live offer.
    let app = reboot(&h, "happy");
    match agent::start_genesis(&app.watch, &app.agent) {
        StartOutcome::ResumeAvailable { native_session_id, .. } => {
            assert_eq!(native_session_id, "fake-session-0001")
        }
        other => panic!("a cancelled interview must stay resumable, got {other:?}"),
    }
    match agent::resume_genesis(&app.watch, &app.agent) {
        StartOutcome::Started { .. } => {}
        other => panic!("expected Started, got {other:?}"),
    }
    wait_completed(&app.events);
    settle(&app.agent);
    assert!(!h.project.join("docs").exists(), "and the app still writes nothing under docs/");
}

/// THE "EXACTLY ONE PLACE" CRITERION (folding T-026-s3).
///
/// The fact that an interview was running on this folder is derived from
/// `.nputer/sessions.json` and from nothing else. Proved by REMOVING that
/// one file: the fact goes with it, which is only true if there is no
/// second copy anywhere — and `docs/`, the project's actual truth, is
/// unaffected either way.
#[test]
fn the_fact_that_an_interview_ran_here_lives_in_exactly_one_file() {
    let h = harness("t029oneplace", Options::default());
    agent::start_genesis(&h.watch, &h.agent);
    wait_completed(&h.events);
    settle(&h.agent);
    fs::create_dir_all(h.project.join("docs")).expect("mk docs");
    fs::write(h.project.join("docs/NORTH_STAR.md"), "# North star\n").expect("bank");

    let record = sessions::genesis_record(&h.project).expect("the fact is recorded");
    assert_eq!(record.registry_id, "S1");
    assert_eq!(record.turns, 1);
    assert_eq!(record.status, "idle");
    assert_eq!(record.native_session_id.as_deref(), Some("fake-session-0001"));
    assert_eq!(record.session_id_rejected, None);

    // Nothing under docs/ mentions the session, the registry id, or the
    // native id — the app never wrote there, and this is the assertion
    // that says so about the FACT rather than about the directory.
    let banked = fs::read_to_string(h.project.join("docs/NORTH_STAR.md")).expect("read");
    assert!(!banked.contains("fake-session-0001") && !banked.contains("S1"), "{banked}");

    // Delete the one file: the fact is gone, and `docs/` still stands.
    fs::remove_file(sessions::sessions_path(&h.project)).expect("delete the registry");
    assert!(
        sessions::genesis_record(&h.project).is_none(),
        "a second home for this fact would answer here"
    );
    assert!(h.project.join("docs/NORTH_STAR.md").exists(), "losing runtime state loses no truth");
}

/// CRITERION 4, THE RUST HALF. The hand-driven fallback is a MODE, not a
/// message: the kit is really on disk and the prompt really names it, so
/// the block a user pastes into their own terminal works.
#[test]
fn the_hand_driven_kickoff_materializes_a_real_kit_and_names_it() {
    let h = harness("t029handdriven", Options::default());
    assert!(!h.project.join(".nputer/genesis/kit").exists(), "nothing is materialized yet");

    match agent::kickoff(&h.watch) {
        agent::KickoffOutcome::Ready { prompt, project_dir, kit_root, method_version, resuming } => {
            assert!(!resuming, "an empty docs/ is a stage-0 start");
            assert_eq!(project_dir, h.project.display().to_string());
            assert!(prompt.contains(&kit_root), "the prompt names the kit root: {prompt}");
            assert!(prompt.contains(&project_dir), "…and the project: {prompt}");
            assert!(prompt.contains("stage 0"), "{prompt}");
            assert!(prompt.contains(&method_version), "{prompt}");
            // The kit root the prompt names EXISTS, with the role file the
            // prompt tells the planner to read.
            assert!(Path::new(&kit_root).join("roles/planner.md").is_file(), "{kit_root}");
        }
        other => panic!("expected Ready, got {other:?}"),
    }
    // Nothing was spawned to produce it, and docs/ is untouched.
    assert!(!turn_dump(&h.dump, 1).exists(), "the hand-driven mode spawns no child");
    assert!(!h.project.join("docs").exists());

    // Once work is banked, the SAME command hands over the resume kickoff
    // instead — one text, chosen from what is on disk.
    fs::create_dir_all(h.project.join("docs")).expect("mk docs");
    fs::write(h.project.join("docs/NORTH_STAR.md"), "# North star\n").expect("bank");
    match agent::kickoff(&h.watch) {
        agent::KickoffOutcome::Ready { prompt, resuming, .. } => {
            assert!(resuming, "banked docs make this a resume");
            assert!(prompt.contains("RESUME RULE"), "{prompt}");
            assert!(!prompt.contains("stage 0 scaffold first"), "{prompt}");
        }
        other => panic!("expected Ready, got {other:?}"),
    }
}

/// T-047-s3. An unusable `model` in the registry costs the NAME of what
/// ran and nothing else — deliberately unlike the id, which refuses the
/// whole resume, because there is nothing here to refuse.
#[test]
fn an_unusable_recorded_model_renders_as_not_recorded_and_never_refuses_a_resume() {
    let h = harness("t029model", Options::default());
    agent::start_genesis(&h.watch, &h.agent);
    wait_completed(&h.events);
    settle(&h.agent);

    // The pre-T-047 hazard, exactly: a registry written by an older build
    // holding a model no gate ever saw. Upgrading does not clean it.
    let path = sessions::sessions_path(&h.project);
    // Planted through serde, so a control byte lands as an ESCAPE inside
    // well-formed JSON. Writing the raw byte would make the file
    // unparseable and `load` would move it aside — which would prove the
    // corrupt-registry path all over again instead of the model gate.
    let plant = |model: &str| {
        let mut value: serde_json::Value =
            serde_json::from_str(&fs::read_to_string(sessions::sessions_path(&h.project)).expect("registry"))
                .expect("parses");
        value["sessions"][0]["model"] = serde_json::Value::String(model.to_string());
        fs::write(sessions::sessions_path(&h.project), value.to_string()).expect("plant a model");
    };
    for planted in [
        "m".repeat(200_000),                       // the ~1 MiB class T-047 measured
        "claude\u{1b}[2K-opus".to_string(),        // a terminal escape, in a rendered field
        "claude opus".to_string(),                 // a space
        "\u{435}laude-opus-5".to_string(),         // a Cyrillic homoglyph
    ] {
        plant(&planted);
        let file = sessions::load(&h.project);
        let entry = file.sessions.first().expect("the entry survives a bad model");
        assert!(entry.display_model().is_err(), "the read boundary refuses {:?}", &planted[..8.min(planted.len())]);
        assert_eq!(entry.model_for_display(), None, "…and renders as not recorded");
        // THE ASYMMETRY: the session is still perfectly resumable.
        assert_eq!(entry.resume_id(), Ok(Some("fake-session-0001")));
        let app = reboot(&h, "happy");
        match agent::start_genesis(&app.watch, &app.agent) {
            StartOutcome::ResumeAvailable { model, native_session_id, .. } => {
                assert_eq!(model, None, "the offer stands, without a name on it");
                assert_eq!(native_session_id, "fake-session-0001");
            }
            other => panic!("a bad model must not cost the resume, got {other:?}"),
        }
    }

    // …and a legitimately exotic provider spelling still comes through.
    let _ = &path;
    plant("us.anthropic.claude-sonnet-4@20240620:0");
    assert_eq!(
        sessions::load(&h.project).sessions[0].model_for_display().as_deref(),
        Some("us.anthropic.claude-sonnet-4@20240620:0")
    );
}
