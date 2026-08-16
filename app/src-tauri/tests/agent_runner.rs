//! T-025 §7: the agent runner's lifecycle matrix, driven against the
//! FAKE agent CLI. **No model is called by anything in this file** — the
//! binary under `CARGO_BIN_EXE_fake_agent` is a canned stream emitter
//! built by cargo, and every config here sets `probe_login_shell: false`,
//! so no test can spawn a login shell or resolve the user's real CLI even
//! by accident.
//!
//! The one env-gated real smoke lives at the bottom, `#[ignore]`d.

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicU64;
use std::sync::{mpsc, Arc};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

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

    let cfg = RunnerConfig {
        binary_override: Some(opts.binary.unwrap_or_else(fake_agent_bin)),
        // A PATH the child can be asserted against, byte for byte.
        path_override: Some("/nputer-test-path/bin:/nputer-test-path/sbin".into()),
        extra_env,
        probe_login_shell: false,
        config_dir: Some(config),
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

/// THE REGRESSION PIN FOR WHAT THE REAL SMOKE FOUND. Against the live
/// `claude 2.1.226` this task's first smoke run produced
/// `exitNonZero { code: 1, stderrTail: "" }` — a typed failure that told
/// the user NOTHING, because the CLI reports authentication failures in
/// band on stdout (an `api_retry` system line plus a `result` line whose
/// `subtype` still reads "success" while `is_error` is true) and leaves
/// stderr completely empty.
///
/// The `auth-error` scenario transcribes those exact lines. The runner
/// must now surface the CLI's own words, because for this failure they
/// are the only words there are.
#[test]
fn an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail() {
    let h = harness("autherror", Options { scenario: "auth-error", ..Options::default() });
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::ExitNonZero { code, stderr_tail } => {
            assert_eq!(code, Some(1));
            assert!(
                stderr_tail.contains("401") && stderr_tail.contains("authenticate"),
                "the failure must carry the CLI's own explanation, got: {stderr_tail:?}"
            );
            assert!(
                stderr_tail.contains("authentication_failed"),
                "the in-band api_retry diagnostic rides too, got: {stderr_tail:?}"
            );
        }
        other => panic!("expected ExitNonZero, got {other:?}"),
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
        StartOutcome::ResumeAvailable { native_session_id, turns } => {
            assert_eq!(native_session_id, "fake-session-0001");
            assert_eq!(turns, 1);
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
        TurnError::MalformedStream { why } => {
            assert!(why.contains("unusable session id"), "{why}");
            assert!(why.contains("begins with '-'"), "names the rejection: {why}");
            assert!(why.contains("--resume"), "names why it matters: {why}");
            assert!(!why.contains("dangerously"), "the refused id is not echoed back: {why}");
        }
        other => panic!("expected MalformedStream, got {other:?}"),
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
            TurnError::MalformedStream { why } => assert!(
                why.contains("unusable session id") && why.contains(fragment),
                "{tag}: expected {fragment:?} in {why:?}"
            ),
            other => panic!("{tag}: expected MalformedStream, got {other:?}"),
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
        TurnError::MalformedStream { why } => {
            assert!(why.contains("4096 bytes") && why.contains("128-byte bound"), "{why}")
        }
        other => panic!("expected MalformedStream, got {other:?}"),
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
        match agent::start_genesis(&h.watch, &h.agent) {
            StartOutcome::Error { message } => {
                assert!(message.contains("refusing to resume session 'S1'"), "{message}");
                assert!(message.contains(sessions::SESSIONS_REL), "{message}");
                assert!(
                    message.contains("begins with '-'") || message.contains("U+"),
                    "the outcome names the rejection: {message}"
                );
                assert!(!message.contains("dangerously"), "no echo of the id: {message}");
            }
            other => panic!("expected a typed refusal for {hostile:?}, got {other:?}"),
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
        StartOutcome::ResumeAvailable { native_session_id, turns } => {
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
        Some(TurnError::MalformedStream { ref why }) => {
            assert!(why.starts_with("refusing to resume:"), "{why}");
            assert!(why.contains("begins with '-'"), "{why}");
        }
        other => panic!("expected MalformedStream, got {other:?}"),
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
    let root = std::env::temp_dir().join(format!("nputer-t025-realsmoke-{}", now_ms()));
    let project = root.join("project");
    fs::create_dir_all(&project).expect("mk project");

    let cfg = RunnerConfig { config_dir: Some(root.join("config")), ..RunnerConfig::default() };
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
