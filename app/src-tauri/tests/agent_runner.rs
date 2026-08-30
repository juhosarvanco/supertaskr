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
    /// T-043: SIGTERM -> this -> SIGKILL. The default stays the 300 ms
    /// every pre-T-043 body was written against; the kill-path timing
    /// bodies raise it, because "released well inside the grace" is only
    /// a claim when the grace is comfortably larger than the scheduling
    /// noise of the machine measuring it.
    kill_grace: Duration,
    /// T-153-s2 (the verdict's assigned correction): a body that drives
    /// the production PATH arm of `apply_child_env` against the execve
    /// element bound sets its own. `None` keeps the harness's standard
    /// two-entry test PATH, which other bodies assert byte for byte.
    path_override: Option<String>,
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
            kill_grace: Duration::from_millis(300),
            path_override: None,
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
        // A PATH the child can be asserted against, byte for byte — or
        // the body's own, when it drives the PATH arm (T-153-s2).
        path_override: Some(
            opts.path_override
                .unwrap_or_else(|| "/nputer-test-path/bin:/nputer-test-path/sbin".into()),
        ),
        extra_env,
        probe_login_shell: false,
        start_timeout: opts.start_timeout,
        stall_timeout: opts.stall_timeout,
        coalesce: Duration::from_millis(40),
        kill_grace: opts.kill_grace,
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

/// **THE FIXTURE DEADLINE, AND IT IS AN ALARM RATHER THAN A BUDGET.**
/// Every body in this file but one drives `CARGO_BIN_EXE_fake_agent`,
/// whose whole canned stream lands in milliseconds; nothing here is
/// waiting on a network or a model. So twenty seconds is not "long
/// enough for a fixture", it is *far* longer than any fixture may take —
/// a fixture that needs more than this has a defect, and this deadline
/// is what says so. **Do not raise it to make a body pass.**
const FIXTURE_DEADLINE: Duration = Duration::from_secs(20);

/// **THE REAL-CLI DEADLINE — the one wait in this file that is measuring
/// a MODEL rather than a fixture, and the only one that may be minutes.**
/// Used by `real_cli_smoke_records_the_stream_schema` and by nothing
/// else.
///
/// **THE CITATION (T-025-s5).** On 2026-08-30 the real smoke ran against
/// a real model for the first time in this project's life (this machine,
/// claude 2.1.226, `NPUTER_REAL_CLI=1 cargo test --test agent_runner
/// real_cli_smoke -- --ignored --nocapture`). The 2026-08-16 park reason
/// — a revoked OAuth token — was stale: auth passed, the runner
/// registered native session `677664de-…`, real text streamed ("I'll
/// start by reading the planner role definition."), and `Read`, `Bash`,
/// `Read` ran through the allowlist with no denial. Then this body's
/// wait — `FIXTURE_DEADLINE`, shared with every fake-driven body in the
/// file — expired MID-TURN and panicked, and the harness reaped a
/// healthy turn. It reaped it cleanly, too: process group gone in 550 ms,
/// no SIGKILL, which is the failure path passing a test it was never
/// given. **The deadline was measuring the fixture, not the turn.**
///
/// **WHY FIFTEEN MINUTES, derived rather than picked.**
/// 1. It must sit ABOVE the production runner's own bounds, so that a
///    genuinely stuck real turn is ended by the RUNNER — as a typed
///    `StartTimeout` or `Stall` this smoke then records, which is the
///    whole point of the body — instead of being destroyed by a harness
///    panic that records nothing. `RunnerConfig::default()` (the config
///    this smoke uses, `agent/runner.rs`) worst-cases at
///    `start_timeout` 30 s + `stall_timeout` 300 s + `kill_grace` 5 s =
///    335 s. That is a FLOOR for this number, not the number.
/// 2. `stall_timeout` is idle-since-the-last-line, so it never bounds a
///    healthy turn's WALL CLOCK: every delta resets it, and a stage-0
///    scaffold that streams steadily for ten minutes trips nothing in
///    the runner. This deadline is therefore the only wall clock over a
///    real turn, and it has to be a real turn's budget — minutes — not
///    a stall detector wearing one.
/// 3. Fifteen minutes is ~2.7x the floor in (1), so the runner's own
///    typed failure arrives first in every mode the runner can see, and
///    a panic HERE means only "the runner failed to bound itself" —
///    which is a finding, not noise.
/// 4. The two errors are not symmetric, and that is what buys the slack.
///    Too small destroys the evidence the run exists to collect, and
///    2026-08-30 is the worked example. Too large costs one human,
///    hand-running an `#[ignore]`d body with `--nocapture` in front of
///    them, a wait they can end with ^C. No suite and no CI can reach
///    this constant: `#[ignore]` and `NPUTER_REAL_CLI=1` both stand.
const REAL_CLI_DEADLINE: Duration = Duration::from_secs(15 * 60);

fn wait_for(
    events: &mpsc::Receiver<RunEvent>,
    label: &str,
    pred: impl Fn(&RunEvent) -> bool,
) -> RunEvent {
    wait_for_within(events, FIXTURE_DEADLINE, label, pred)
}

/// `wait_for` with the deadline named by the caller. Only the real smoke
/// passes anything but `FIXTURE_DEADLINE`, and `wait_for` above keeps
/// every fake-driven call site unchanged.
fn wait_for_within(
    events: &mpsc::Receiver<RunEvent>,
    within: Duration,
    label: &str,
    pred: impl Fn(&RunEvent) -> bool,
) -> RunEvent {
    let deadline = Instant::now() + within;
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
    panic!(
        "timed out waiting for {label} after {}s; saw: {seen:#?}",
        within.as_secs()
    );
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

/// T-081: EVERY event of one turn, in arrival order, up to and including
/// the terminal one.
///
/// `wait_for` throws away everything it walked past, which is the right
/// shape for "did the turn end this way" and the wrong shape for "when,
/// relative to the rest of the stream, did this arrive". A denial that
/// reaches the screen only at the end of the turn is precisely the defect
/// T-081 exists to fix, and telling that apart from a denial that reached
/// it live is an ORDER question.
fn collect_turn(events: &mpsc::Receiver<RunEvent>) -> Vec<RunEvent> {
    let deadline = Instant::now() + FIXTURE_DEADLINE;
    let mut seen = Vec::new();
    while Instant::now() < deadline {
        match events.recv_timeout(Duration::from_millis(200)) {
            Ok(event) => {
                let terminal =
                    matches!(event, RunEvent::Completed { .. } | RunEvent::Failed { .. });
                seen.push(event);
                if terminal {
                    return seen;
                }
            }
            Err(mpsc::RecvTimeoutError::Timeout) => continue,
            Err(mpsc::RecvTimeoutError::Disconnected) => break,
        }
    }
    panic!("the turn never reached a terminal event; saw: {seen:#?}");
}

/// The `Denied` events out of a collected turn, with their seq, so both
/// WHAT arrived and WHEN it arrived are assertable.
fn denied_events(seen: &[RunEvent]) -> Vec<(u64, Option<String>, Option<String>, String)> {
    seen.iter()
        .filter_map(|e| match e {
            RunEvent::Denied { seq, tool_name, tool_use_id, message, .. } => {
                Some((*seq, tool_name.clone(), tool_use_id.clone(), message.clone()))
            }
            _ => None,
        })
        .collect()
}

/// Block until the turn thread has finished settling (phase leaves
/// Running), so registry/transcript assertions are not racing it.
///
/// **THIS ONE KEEPS `FIXTURE_DEADLINE` EVEN FOR THE REAL SMOKE, and the
/// reason is in `run_turn`'s order** (T-025-s5's sweep): the child is
/// reaped and the group terminated BEFORE the terminal event is
/// classified and emitted, so by the time any caller's `wait_for` has
/// returned, everything left for this poll to wait on is
/// `agent/mod.rs`'s post-turn bookkeeping — a transcript append and a
/// session-registry upsert, both local disk. No model is on this side of
/// the terminal event, so twenty seconds is the same alarm here that it
/// is everywhere else in this file.
fn settle(agent: &agent::AgentState) -> GenesisStatus {
    let deadline = Instant::now() + FIXTURE_DEADLINE;
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

/// **T-102, RESOLVING `T-069-s1`: THE FAMILY REPLACEMENT FOR THE
/// MIRRORED NEGATIVES THAT COULD NOT FAIL.**
///
/// The idiom this replaces was: match on the failure EVENT, `other =>
/// panic!` on the wrong variant, and then assert the SETTLED status is
/// NOT some third variant —
/// `assert!(!matches!(status.last_error, Some(TurnError::AuthFailed { .. })))`.
/// Measured during T-069's own poison sweep (round R10, the mutation
/// those lines exist to catch): both bodies reddened at the `other =>
/// panic!` arm and NEVER at the negative below it. `run_turn` sets
/// `out.error = Some(error.clone())` and then emits that same value, so
/// the event and the stored status cannot disagree about the VARIANT —
/// by the time the negative runs, the match arm above has already
/// accepted the variant the negative forbids. Worse, the form is GREEN
/// under the storage bug it looks like it would catch: `AgentState`
/// dropping the classification leaves `last_error: None`, and
/// `!matches!(None, Some(AuthFailed))` is true.
///
/// **SO THE FAMILY IS REPLACED BY A POSITIVE, WHICH IS THE FIRST OF THE
/// TWO DISPOSITIONS THE CARD OFFERS.** The claim worth making is not
/// "the settled error is not some other variant" — the arm above already
/// said that — but "**the settled error IS the failure event, whole**".
/// That is a real property of a real seam: `run_turn` returns an
/// `out.error` and `agent/mod.rs` stores it into `Inner::last_error` in a
/// separate statement, with FOUR other statements in that file clearing
/// the same field to `None`. A drop, a clear, or a rewrite between the
/// event and the status is exactly what this reds on, and the retired
/// form saw none of the three.
///
/// **THE ORIGINAL CLAIM SURVIVES RATHER THAN BEING TRADED AWAY**, which
/// is what makes this a replacement and not a deletion: each call site
/// still names, in its message, the variant its turn must not be
/// confused with — but the confusion is now ruled out by an equality
/// against the whole error, which entails the old inequality and much
/// more besides.
///
/// Comparing against the EVENT rather than against a literal is
/// deliberate: `stderr_tail` carries whatever the fixture's CLI wrote to
/// stderr, so a literal would be either brittle or weakened back into a
/// variant check — which is the form being retired.
fn assert_settled_error_is(status: &GenesisStatus, expected: &TurnError, why: &str) {
    assert_eq!(
        status.last_error.as_ref(),
        Some(expected),
        "{why}\n\
         The settled status must carry the SAME error the turn's failure event did, \
         whole and unrewritten. A `None` here is the classification being DROPPED \
         between `run_turn` and `AgentState` — which every NEGATIVE form of this \
         assertion was green under (T-069-s1, T-102)."
    );
}

/// The error off a collected turn's terminal `Failed` event, for the
/// bodies that use `collect_turn` instead of `wait_failed` and still owe
/// the positive above.
fn terminal_error(seen: &[RunEvent]) -> TurnError {
    match seen.last() {
        Some(RunEvent::Failed { error, .. }) => error.clone(),
        other => panic!("the turn did not end in a failure event: {other:#?}"),
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
    let deadline = Instant::now() + FIXTURE_DEADLINE;
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

    let mut guard = GroupGuard::new();
    let child_pid: i32 = guard.watch(
        wait_for_file(&turn_dump(&h.dump, 1).join("pid.txt")).trim().parse().expect("child pid"),
    );
    let grandchild_pid: i32 = guard.watch(
        wait_for_file(&turn_dump(&h.dump, 1).join("grandchild-pid.txt"))
            .trim()
            .parse()
            .expect("grandchild pid"),
    );
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
    let mut guard = GroupGuard::new();
    let child_pid: i32 = guard.watch(
        wait_for_file(&turn_dump(&h.dump, 1).join("pid.txt")).trim().parse().expect("child pid"),
    );
    let grandchild_pid: i32 = guard.watch(
        wait_for_file(&turn_dump(&h.dump, 1).join("grandchild-pid.txt"))
            .trim()
            .parse()
            .expect("grandchild pid"),
    );

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

// ---- T-043: the kill path, its two limbs and its honest grace ---------
//
// **WHY THESE BODIES EXIST AT ALL.** Before T-043 the committed suite had
// never met a process that refuses SIGTERM: the T-025 verifier built one
// by hand, measured it and deleted it, so "the suite covers a resistant
// child" was a claim about a probe that no longer existed. The fake agent
// now carries `hang-resistant` and `hang-resistant-grandchild`
// permanently, and everything below drives them.
//
// **PROCESS HYGIENE IS THE POINT OF THE FIXTURE, SO IT IS NOT LEFT TO
// CARE.** A `sleeper-resistant` process ignores SIGTERM by construction;
// leaking one is not a tidiness lapse, it is exactly the defect this card
// is about. So every pid these tests create is owned by an RAII guard
// whose `Drop` runs on the unwinding path too — a failed assertion, and a
// POISON DRILL is a deliberately failed assertion, still cleans up. The
// guard signals only pids and process groups it recorded itself: no
// `pkill`, no name match, nothing that can reach a process this file did
// not create.

#[cfg(unix)]
mod sig {
    extern "C" {
        pub fn kill(pid: i32, sig: i32) -> i32;
        pub fn killpg(pgrp: i32, sig: i32) -> i32;
    }
    pub const SIGTERM: i32 = 15;
    pub const SIGKILL: i32 = 9;
}

/// One fake-agent process in ITS OWN process group (pgid == pid, exactly
/// as `run_turn` spawns), plus whatever it forked, plus the guarantee
/// that all of it is gone when this value dies.
#[cfg(unix)]
struct OwnedGroup {
    child: std::process::Child,
    handle: nputer_lib::agent::runner::ChildHandle,
    pid: i32,
    dump: PathBuf,
    root: PathBuf,
}

#[cfg(unix)]
impl OwnedGroup {
    /// Spawn `scenario` into a fresh process group. stdin is closed at
    /// once (the fake reads to EOF), stdout/stderr go nowhere: these
    /// bodies are about lifetimes, not streams.
    fn spawn(tag: &str, scenario: &str) -> Self {
        use std::os::unix::process::CommandExt;
        let root = std::env::temp_dir().join(format!(
            "nputer-t043-{}-{}-{}",
            tag,
            std::process::id(),
            now_ms()
        ));
        let dump = root.join("dump");
        fs::create_dir_all(&dump).expect("mk dump");
        let mut command = std::process::Command::new(fake_agent_bin());
        command
            .env("NPUTER_FAKE_SCENARIO", scenario)
            .env("NPUTER_FAKE_DUMP_DIR", &dump)
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null());
        command.process_group(0);
        let child = command.spawn().expect("spawn the fake");
        let pid = child.id() as i32;
        let handle = nputer_lib::agent::runner::ChildHandle::new(pid, 1);
        // THE HANDSHAKE, not a sleep. `spawn` returns at fork; the child
        // installs its SIGTERM disposition after `exec`, and a signal
        // sent into that window kills a "resistant" fixture like a
        // cooperative one — measured at 27 ms on the first run of the
        // resistant body below. `ready.txt` is written by the scenario
        // once it is in the state the test is about to measure. For
        // `hang-resistant-grandchild` the writer is the GRANDCHILD, which
        // is exactly the process whose readiness that test depends on.
        wait_for_file(&dump.join("ready.txt"));
        Self { child, handle, pid, dump, root }
    }

    /// The pid the scenario forked into the same group, once it exists.
    fn grandchild(&self) -> i32 {
        wait_for_file(&self.dump.join("turn-1").join("grandchild-pid.txt"))
            .trim()
            .parse()
            .expect("grandchild pid")
    }

    /// Kill everything this guard created and reap our own child.
    /// Idempotent, so `finish` and `Drop` can both call it.
    fn cleanup(&mut self) {
        unsafe {
            sig::killpg(self.pid, sig::SIGKILL);
            sig::kill(self.pid, sig::SIGKILL);
        }
        let _ = self.child.wait();
        let _ = fs::remove_dir_all(&self.root);
    }

    /// The happy-path close: clean up, then PROVE every pid named here is
    /// gone rather than assert it was probably killed.
    fn finish(mut self, pids: &[i32]) {
        self.cleanup();
        let deadline = Instant::now() + Duration::from_secs(10);
        for pid in pids {
            while nputer_lib::agent::runner::pid_alive(*pid) && Instant::now() < deadline {
                std::thread::sleep(Duration::from_millis(20));
            }
            assert!(
                !nputer_lib::agent::runner::pid_alive(*pid),
                "pid {pid} survived this test - a kill-path body must never leak a process"
            );
        }
        assert!(
            !nputer_lib::agent::runner::group_has_members(self.pid),
            "process group {} still has members after cleanup",
            self.pid
        );
    }
}

#[cfg(unix)]
impl Drop for OwnedGroup {
    fn drop(&mut self) {
        self.cleanup();
    }
}

/// **THE RAII HALF FOR THE HARNESS-DRIVEN BODIES**, and it exists because
/// a poison drill proved it necessary rather than because it looked
/// prudent.
///
/// `OwnedGroup` above owns the processes it spawned itself. These bodies
/// get theirs from the RUNNER, so until now their only cleanup was the
/// production code under test doing its job — and when poison drill P3
/// removed the group limb from the early release,
/// `the_exit_reap_pays_the_full_grace_…` failed exactly as intended and
/// LEAKED its SIGTERM-immune grandchild, which then sat on this machine
/// with ppid 1 until it was found by hand. **A test that reds must not
/// need the code it is testing to be correct in order to clean up after
/// itself.**
///
/// Register a pid the moment it is known; `Drop` SIGKILLs exactly the
/// registered pids and exactly their process groups, on the unwinding
/// path too. No `pkill`, no name match.
#[cfg(unix)]
struct GroupGuard(Vec<i32>);

#[cfg(unix)]
impl GroupGuard {
    fn new() -> Self {
        Self(Vec::new())
    }
    /// Record `pid` and hand it straight back, so registration reads as
    /// part of learning the pid rather than as a separate step somebody
    /// can forget.
    fn watch(&mut self, pid: i32) -> i32 {
        self.0.push(pid);
        pid
    }
}

// NOTE: this guard deliberately has no `assert_all_gone` twin to
// `OwnedGroup::finish`. Every body that registers a pid here already
// asserts THAT pid gone, by name, with a message that says what its
// survival would mean; a second uniform assertion over the same pids
// would be a duplicate that reds only when the specific one already did.
// The guard's job is the CLEANUP, which is the half no assertion covers.

#[cfg(unix)]
impl Drop for GroupGuard {
    fn drop(&mut self) {
        for pid in &self.0 {
            unsafe {
                sig::killpg(*pid, sig::SIGKILL);
                sig::kill(*pid, sig::SIGKILL);
            }
        }
    }
}

/// **THE MEASUREMENT THE WHOLE CARD RESTS ON, PINNED.**
///
/// `pid_alive` is `kill(pid, 0)`, and it is TRUE FOR A ZOMBIE. The turn's
/// child is our own child, so between its exit and its `wait()` it is
/// precisely that — which is why the pre-T-043 poll, which asked only
/// this question, could never release early and always paid the full
/// grace. `group_has_members` is the question that survives the zombie:
/// once the child is reaped and nothing else holds the pgid, it is false.
#[test]
#[cfg(unix)]
fn a_zombie_answers_pid_alive_and_that_is_why_the_grace_needed_two_limbs() {
    let mut g = OwnedGroup::spawn("zombie", "sleeper");
    let pid = g.pid;
    // Alive and in its own group.
    assert!(nputer_lib::agent::runner::pid_alive(pid), "the sleeper is running");
    assert!(nputer_lib::agent::runner::group_has_members(pid), "its group holds it");

    // SIGTERM the PROCESS, deliberately not the group, and do not wait.
    unsafe {
        sig::kill(pid, sig::SIGTERM);
    }
    let deadline = Instant::now() + Duration::from_secs(10);
    while g.child.try_wait().ok().flatten().is_none() && Instant::now() < deadline {
        // Spin WITHOUT reaping: `try_wait` would clear the zombie, which
        // is the state being measured. Fall through on the timer.
        std::thread::sleep(Duration::from_millis(500));
        break;
    }
    std::thread::sleep(Duration::from_millis(200));

    // THE ZOMBIE WINDOW: the process is dead and `kill(pid, 0)` says yes.
    assert!(
        nputer_lib::agent::runner::pid_alive(pid),
        "a dead-but-unreaped child must still answer kill(pid, 0) - if this reds, \
         the platform stopped behaving the way the two-limb poll is written for"
    );

    // Reap it. Now both questions agree, and only now.
    let status = g.child.wait().expect("wait");
    assert!(status.code().is_none(), "SIGTERM kills by signal, not by exit code: {status:?}");
    assert!(!nputer_lib::agent::runner::pid_alive(pid), "the reaped pid is gone");
    assert!(
        !nputer_lib::agent::runner::group_has_members(pid),
        "an empty process group must report empty - this is the ESRCH arm"
    );
    g.finish(&[pid]);
}

/// LIMB ONE, on the owner's path: a cooperative child is reaped INSIDE
/// the poll, the group empties, and the call returns in milliseconds.
///
/// The bound is written as a literal, not as a fraction of the grace: a
/// body parametrised by the constant it is pinning cannot pin it.
#[test]
#[cfg(unix)]
fn a_cooperative_group_releases_the_owning_poll_well_inside_the_grace() {
    let mut g = OwnedGroup::spawn("coop", "sleeper");
    let pid = g.pid;
    let handle = g.handle.clone();
    let exit = nputer_lib::agent::runner::terminate_group_owning(
        &mut g.child,
        &handle,
        Duration::from_millis(3000),
    );
    assert!(exit.reaped, "the poll must reap the direct child itself: {exit:?}");
    assert!(exit.group_empty, "the group must be observed empty: {exit:?}");
    assert!(!exit.escalated, "a cooperative group must never be SIGKILLed: {exit:?}");
    assert!(
        exit.waited < Duration::from_millis(1000),
        "a cooperative group cost {} ms of a 3000 ms grace - the poll is not releasing early",
        exit.waited.as_millis()
    );
    assert!(handle.reaped(), "the owner must PUBLISH the reap for the observers");
    assert!(!nputer_lib::agent::runner::pid_alive(pid), "no zombie behind an early release");
    g.finish(&[pid]);
}

/// **THE CASE A NAIVE `child.try_wait()` + `return` GETS WRONG**, and the
/// reason early release needs both limbs rather than one.
///
/// The direct child cooperates: it dies on the first SIGTERM and is
/// reaped inside the poll within milliseconds. Its same-group grandchild
/// IGNORES SIGTERM. An implementation that released on the reap alone
/// would return here at ~50 ms and leave that grandchild running forever,
/// with nothing left in the process that would ever escalate to SIGKILL —
/// a latency defect traded for a leaked process, which is the worse of
/// the two. So the poll runs to the deadline and kills the survivor.
#[test]
#[cfg(unix)]
fn a_reaped_child_with_a_resistant_grandchild_pays_the_full_grace_and_kills_the_survivor() {
    let mut g = OwnedGroup::spawn("resistantgc", "hang-resistant-grandchild");
    let pid = g.pid;
    let gc = g.grandchild();
    assert_ne!(pid, gc);
    assert!(nputer_lib::agent::runner::pid_alive(gc), "the resistant grandchild is running");

    let handle = g.handle.clone();
    let exit = nputer_lib::agent::runner::terminate_group_owning(
        &mut g.child,
        &handle,
        Duration::from_millis(800),
    );

    assert!(exit.reaped, "the DIRECT child cooperated and must have been reaped: {exit:?}");
    assert!(
        !exit.group_empty,
        "the resistant grandchild must still have held the group at the deadline: {exit:?}"
    );
    assert!(exit.escalated, "the survivor must have been SIGKILLed: {exit:?}");
    assert!(
        exit.waited >= Duration::from_millis(800),
        "THE POLL RETURNED EARLY ({} ms of an 800 ms grace) WITH A SURVIVOR IN THE GROUP - \
         this is the exact regression the two-limb release exists to prevent",
        exit.waited.as_millis()
    );

    let deadline = Instant::now() + Duration::from_secs(10);
    while nputer_lib::agent::runner::pid_alive(gc) && Instant::now() < deadline {
        std::thread::sleep(Duration::from_millis(20));
    }
    assert!(
        !nputer_lib::agent::runner::pid_alive(gc),
        "THE RESISTANT GRANDCHILD OUTLIVED THE GRACE - SIGKILL never reached the group"
    );
    g.finish(&[pid, gc]);
}

/// A resistant DIRECT child: the full grace is paid, SIGKILL follows, and
/// the child is still reaped — the fix must not leave a zombie behind the
/// escalation.
#[test]
#[cfg(unix)]
fn a_resistant_direct_child_costs_the_full_grace_then_sigkill_then_reaps() {
    let mut g = OwnedGroup::spawn("resistant", "sleeper-resistant");
    let pid = g.pid;
    let handle = g.handle.clone();
    let exit = nputer_lib::agent::runner::terminate_group_owning(
        &mut g.child,
        &handle,
        Duration::from_millis(800),
    );
    assert!(
        !exit.reaped,
        "a child that ignores SIGTERM cannot have been reaped during the grace: {exit:?}"
    );
    assert!(!exit.group_empty, "it was still in its group at the deadline: {exit:?}");
    assert!(exit.escalated, "SIGKILL must follow the grace: {exit:?}");
    assert!(
        exit.waited >= Duration::from_millis(800),
        "the full grace must be paid for a resistant child, not {} ms",
        exit.waited.as_millis()
    );
    let status = g.child.wait().expect("the SIGKILLed child is reapable");
    assert!(status.code().is_none(), "killed by a signal, not an exit code: {status:?}");
    assert!(
        !nputer_lib::agent::runner::pid_alive(pid),
        "the SIGKILLed child was left as a ZOMBIE - the escalation path must still reap"
    );
    g.finish(&[pid]);
}

/// **THE OBSERVER'S TWO LIMBS, AND ITS CONTROL.**
///
/// `reap_for_exit` and the cancel's background escalation hold a
/// `ChildHandle` and never the `Child`, so they cannot `waitpid`. They
/// learn the reap from the flag the worker publishes.
///
/// Arm one: the flag arrives, the group is empty, the observer releases
/// early. Arm two is the CONTROL, and it is what makes the flag
/// load-bearing rather than decorative: the child is reaped by somebody
/// who does NOT publish, so the group is genuinely empty while the flag
/// stays false — and the observer must still run the full grace. An
/// implementation that released on group-emptiness alone passes arm one
/// and reds here.
#[test]
#[cfg(unix)]
fn the_observers_early_release_needs_the_owners_reap_and_not_only_an_empty_group() {
    // --- arm one: the owner publishes ---------------------------------
    let mut g = OwnedGroup::spawn("observed", "sleeper");
    let published_pid = g.pid;
    let handle = g.handle.clone();
    let observer = std::thread::spawn(move || {
        nputer_lib::agent::runner::terminate_group_observing(&handle, Duration::from_millis(3000))
    });
    // Stand in for the worker: wait the child, then publish.
    let _ = g.child.wait();
    g.handle.mark_reaped();
    let exit = observer.join().expect("observer thread");
    assert!(exit.reaped && exit.group_empty, "both limbs must hold: {exit:?}");
    assert!(!exit.escalated, "nothing survived, so nothing may be SIGKILLed: {exit:?}");
    assert!(
        exit.waited < Duration::from_millis(1000),
        "a published reap must release the observer early, not after {} ms",
        exit.waited.as_millis()
    );
    g.finish(&[published_pid]);

    // --- arm two: the CONTROL, nobody publishes ------------------------
    let mut silent = OwnedGroup::spawn("unobserved", "sleeper");
    let silent_pid = silent.pid;
    let handle = silent.handle.clone();
    let observer = std::thread::spawn(move || {
        nputer_lib::agent::runner::terminate_group_observing(&handle, Duration::from_millis(800))
    });
    // Reaped, so the group really is empty — but the flag stays false.
    let _ = silent.child.wait();
    let exit = observer.join().expect("observer thread");
    assert!(!exit.reaped, "nobody published, so the observer must not claim a reap: {exit:?}");
    assert!(exit.group_empty, "the group did empty: {exit:?}");
    assert!(
        !exit.escalated,
        "an empty group must not be SIGKILLed - that pid may already belong to somebody else: {exit:?}"
    );
    assert!(
        exit.waited >= Duration::from_millis(800),
        "AN EMPTY GROUP ALONE RELEASED THE OBSERVER after {} ms - the owner's reap is the \
         other limb and it is not optional",
        exit.waited.as_millis()
    );
    silent.finish(&[silent_pid]);
}

/// THE USER-FELT HALF, through the real command path: a cancel releases
/// the single-flight latch in milliseconds instead of holding `busy` for
/// the whole grace (T-025-s7 measured 3.035 s on a 3 s grace).
#[test]
#[cfg(unix)]
fn a_cancel_releases_the_turn_latch_well_inside_the_grace() {
    let h = harness(
        "cancellatency",
        Options {
            scenario: "hang",
            kill_grace: Duration::from_millis(3000),
            ..Options::default()
        },
    );
    assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Started { .. }));
    let mut guard = GroupGuard::new();
    let child_pid: i32 = guard.watch(
        wait_for_file(&turn_dump(&h.dump, 1).join("pid.txt")).trim().parse().expect("child pid"),
    );
    let grandchild_pid: i32 = guard.watch(
        wait_for_file(&turn_dump(&h.dump, 1).join("grandchild-pid.txt"))
            .trim()
            .parse()
            .expect("grandchild pid"),
    );

    let at_cancel = Instant::now();
    assert!(matches!(agent::cancel(&h.agent), CancelOutcome::Cancelled { turn: 1 }));
    settle(&h.agent);
    let latch_released = at_cancel.elapsed();

    // NOTE: `genesis_cancel`'s PROMPTNESS is deliberately not asserted
    // here, and a poison drill is why. Once the poll releases early, a
    // cancel that escalated on the CALLER's thread would also return in
    // milliseconds against this cooperative group — so the assertion sat
    // green under the mutation it was supposed to catch. It lives in
    // `a_turn_whose_child_ignores_sigterm_…` instead, where a blocking
    // escalation costs the full grace and the claim can fail.
    assert!(
        latch_released < Duration::from_millis(1000),
        "the turn latch was held {} ms of a 3000 ms grace after a cooperative child died - \
         the grace is being paid in full again",
        latch_released.as_millis()
    );
    assert!(!nputer_lib::agent::runner::pid_alive(child_pid), "the child outlived the cancel");
    assert!(
        !nputer_lib::agent::runner::pid_alive(grandchild_pid),
        "the grandchild outlived the cancel"
    );
}

/// THE APP-EXIT HALF: `reap_for_exit` blocks the thread that quits the
/// app, so a cooperative group must let go of it in milliseconds. It owns
/// no `Child`, so this only holds through the handle's published reap.
#[test]
#[cfg(unix)]
fn the_exit_reap_returns_well_inside_the_grace_for_a_cooperative_group() {
    let h = harness(
        "exitlatency",
        Options {
            scenario: "hang",
            kill_grace: Duration::from_millis(3000),
            ..Options::default()
        },
    );
    agent::start_genesis(&h.watch, &h.agent);
    let mut guard = GroupGuard::new();
    let child_pid: i32 = guard.watch(
        wait_for_file(&turn_dump(&h.dump, 1).join("pid.txt")).trim().parse().expect("child pid"),
    );
    let grandchild_pid: i32 = guard.watch(
        wait_for_file(&turn_dump(&h.dump, 1).join("grandchild-pid.txt"))
            .trim()
            .parse()
            .expect("grandchild pid"),
    );

    let at_exit = Instant::now();
    h.agent.reap_for_exit();
    let blocked = at_exit.elapsed();
    assert!(
        blocked < Duration::from_millis(1000),
        "quitting the app blocked for {} ms of a 3000 ms grace on a cooperative group",
        blocked.as_millis()
    );
    settle(&h.agent);
    assert!(!nputer_lib::agent::runner::pid_alive(child_pid), "quitting the app leaves no child");
    assert!(
        !nputer_lib::agent::runner::pid_alive(grandchild_pid),
        "quitting the app leaves no grandchild"
    );
}

/// …AND THE EXIT PATH'S OTHER HALF, because a fast exit that abandoned a
/// survivor would be a worse app than a slow one: the same quit against a
/// cooperative child with a resistant same-group grandchild must NOT
/// return early, and must leave the grandchild dead.
#[test]
#[cfg(unix)]
fn the_exit_reap_pays_the_full_grace_when_a_same_group_descendant_resists() {
    let h = harness(
        "exitresist",
        Options {
            scenario: "hang-resistant-grandchild",
            kill_grace: Duration::from_millis(900),
            ..Options::default()
        },
    );
    agent::start_genesis(&h.watch, &h.agent);
    let mut guard = GroupGuard::new();
    let child_pid: i32 = guard.watch(
        wait_for_file(&turn_dump(&h.dump, 1).join("pid.txt")).trim().parse().expect("child pid"),
    );
    let grandchild_pid: i32 = guard.watch(
        wait_for_file(&turn_dump(&h.dump, 1).join("grandchild-pid.txt"))
            .trim()
            .parse()
            .expect("grandchild pid"),
    );
    assert!(nputer_lib::agent::runner::pid_alive(grandchild_pid), "the resistant one is running");

    let at_exit = Instant::now();
    h.agent.reap_for_exit();
    let blocked = at_exit.elapsed();
    assert!(
        blocked >= Duration::from_millis(900),
        "the exit reap returned after {} ms of a 900 ms grace while a resistant same-group \
         descendant was still running - it abandoned it",
        blocked.as_millis()
    );
    settle(&h.agent);
    let deadline = Instant::now() + Duration::from_secs(10);
    while nputer_lib::agent::runner::pid_alive(grandchild_pid) && Instant::now() < deadline {
        std::thread::sleep(Duration::from_millis(20));
    }
    assert!(!nputer_lib::agent::runner::pid_alive(child_pid), "the child outlived the exit");
    assert!(
        !nputer_lib::agent::runner::pid_alive(grandchild_pid),
        "THE RESISTANT GRANDCHILD OUTLIVED THE APP - SIGKILL never reached the group"
    );
}

/// THE RESISTANT DIRECT CHILD, end to end through the real cancel path:
/// the full grace is paid, SIGKILL follows, the child is reaped, and no
/// zombie is left behind. The pre-T-043 code passed the first two of
/// those by accident — it paid the full grace for EVERY child.
#[test]
#[cfg(unix)]
fn a_turn_whose_child_ignores_sigterm_pays_the_full_grace_and_leaves_no_zombie() {
    let h = harness(
        "resistturn",
        Options {
            scenario: "hang-resistant",
            kill_grace: Duration::from_millis(900),
            ..Options::default()
        },
    );
    agent::start_genesis(&h.watch, &h.agent);
    let mut guard = GroupGuard::new();
    let child_pid: i32 = guard.watch(
        wait_for_file(&turn_dump(&h.dump, 1).join("pid.txt")).trim().parse().expect("child pid"),
    );
    // The disposition is installed after exec; wait for the fact itself.
    wait_for_file(&h.dump.join("ready.txt"));
    assert!(nputer_lib::agent::runner::pid_alive(child_pid), "the resistant child is running");

    let at_cancel = Instant::now();
    assert!(matches!(agent::cancel(&h.agent), CancelOutcome::Cancelled { turn: 1 }));
    let cancel_returned = at_cancel.elapsed();
    settle(&h.agent);
    let latch_released = at_cancel.elapsed();
    // THE PROMPTNESS CLAIM LIVES HERE, not on the cooperative body: this
    // is the only fixture where "answers immediately and escalates in the
    // background" and "escalates on the caller's thread" have different
    // observable answers, because only here does the escalation cost the
    // whole grace.
    assert!(
        cancel_returned < Duration::from_millis(300),
        "genesis_cancel held the caller for {} ms of a 900 ms grace - the SIGTERM is \
         synchronous but the escalation must not be",
        cancel_returned.as_millis()
    );
    assert!(
        latch_released >= Duration::from_millis(900),
        "the latch released after {} ms of a 900 ms grace while the child was still \
         ignoring SIGTERM - the grace was not paid",
        latch_released.as_millis()
    );
    assert!(
        !nputer_lib::agent::runner::pid_alive(child_pid),
        "the resistant child outlived its SIGKILL, or was left as a ZOMBIE"
    );
    assert!(
        !nputer_lib::agent::runner::group_has_members(child_pid),
        "the turn's process group still has members after the cancel"
    );
    // A cancel is an OUTCOME: no typed failure, even for a killed child.
    let events: Vec<RunEvent> = h.events.try_iter().collect();
    assert!(
        !events.iter().any(|e| matches!(e, RunEvent::Failed { .. })),
        "a cancel must not surface as a typed failure: {events:#?}"
    );
}

/// Cancel, exit and `Drop` can all observe the same turn at once, and two
/// of them can arrive after it is already gone. None of that may panic,
/// double-reap or leave anything behind.
#[test]
#[cfg(unix)]
fn concurrent_cancel_exit_and_drop_observations_stay_idempotent() {
    let child_pid: i32;
    let grandchild_pid: i32;
    let mut guard = GroupGuard::new();
    {
        let h = harness(
            "idempotent",
            Options {
                scenario: "hang",
                kill_grace: Duration::from_millis(1200),
                ..Options::default()
            },
        );
        agent::start_genesis(&h.watch, &h.agent);
        child_pid = guard.watch(
            wait_for_file(&turn_dump(&h.dump, 1).join("pid.txt")).trim().parse().expect("pid"),
        );
        grandchild_pid = guard.watch(
            wait_for_file(&turn_dump(&h.dump, 1).join("grandchild-pid.txt"))
                .trim()
                .parse()
                .expect("grandchild pid"),
        );

        // Three observations of one turn, overlapping on purpose.
        agent::cancel(&h.agent);
        h.agent.reap_for_exit();
        h.agent.reap_for_exit();
        assert!(matches!(agent::cancel(&h.agent), CancelOutcome::Idle | CancelOutcome::Cancelled { .. }));
        settle(&h.agent);
        // A cancel after the turn has settled has nothing to signal.
        assert!(matches!(agent::cancel(&h.agent), CancelOutcome::Idle));
        // …and the fourth observation is `Drop`, at the end of this scope.
    }
    assert!(!nputer_lib::agent::runner::pid_alive(child_pid), "the child survived four observers");
    assert!(
        !nputer_lib::agent::runner::pid_alive(grandchild_pid),
        "the grandchild survived four observers"
    );
}

/// **THE PUBLISH THE CANCEL PATH DOES NOT COVER**, and this body exists
/// because a poison drill stayed GREEN without it.
///
/// On the cancel/failure path the grace poll reaps and publishes as it
/// goes, so deleting `run_turn`'s trailing `handle.mark_reaped()` reds
/// nothing there. The line is load-bearing on the HAPPY path, where no
/// grace poll runs at all: a turn that finishes normally is reaped by a
/// plain `child.wait()`, and an app-exit observer holding a clone of the
/// handle has no other way to learn it. Without the publish, a quit that
/// races the end of a successful turn polls for the whole five-second
/// grace — on the thread that is quitting the app — against a pgid whose
/// pid the OS may already have handed to somebody else.
///
/// The observation is DETERMINISTIC rather than raced: the slot is
/// written before `started` is emitted, so a sink that sees `Started` is
/// guaranteed to find the handle there. That is the same ordering
/// `reap_for_exit` depends on.
#[test]
#[cfg(unix)]
fn a_happy_turn_still_publishes_its_reap_to_whoever_holds_the_handle() {
    use nputer_lib::agent::adapter::planner_adapter;
    use nputer_lib::agent::runner::{run_turn, ChildHandle, Emitter, TurnRequest};
    use std::sync::atomic::AtomicBool;
    use std::sync::Mutex;

    let h = harness("publish", Options::default());
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

    let child_slot: Arc<Mutex<Option<ChildHandle>>> = Arc::new(Mutex::new(None));
    // The observer: exactly what `reap_for_exit` does — clone the handle
    // out of the shared slot while the turn is live, and keep it.
    let observed: Arc<Mutex<Option<ChildHandle>>> = Arc::new(Mutex::new(None));
    let watching = child_slot.clone();
    let keep = observed.clone();
    let emitter = Emitter::new(
        Arc::new(move |event| {
            if matches!(event, RunEvent::Started { .. }) {
                *keep.lock().expect("observed") =
                    watching.lock().expect("slot").clone();
            }
        }),
        Arc::new(AtomicU64::new(0)),
    );
    let cancel = AtomicBool::new(false);

    let out = run_turn(
        &cfg,
        adapter,
        &cli,
        &TurnRequest {
            project_dir: h.project.clone(),
            prompt: "an answer".into(),
            resume: None,
            turn: 1,
        },
        &emitter,
        &child_slot,
        &cancel,
    );
    assert!(out.error.is_none(), "the happy turn must succeed: {:?}", out.error);

    let handle = observed.lock().expect("observed").clone().expect(
        "the handle must be in the slot by the time `started` is emitted - that ordering \
         is what reap_for_exit reads",
    );
    assert!(
        handle.reaped(),
        "a turn that ended HAPPILY never published its reap, so an exit observer holding \
         this handle would poll the full grace for a child that is already gone"
    );
    assert!(!nputer_lib::agent::runner::pid_alive(handle.pid), "and it really is gone");
    assert!(child_slot.lock().expect("slot").is_none(), "the slot is cleared after the turn");
}

/// PRODUCTION'S GRACE, pinned BY VALUE and on its own.
///
/// It is deliberately not folded into a timing body: a test parametrised
/// by a constant cannot pin that constant, so the number lives here where
/// changing it is the only way to make this red.
#[test]
fn the_production_kill_grace_is_five_seconds() {
    assert_eq!(RunnerConfig::default().kill_grace, Duration::from_secs(5));
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
    let failed = wait_failed(&h.events);
    match &failed {
        // T-081 MOVED THIS EXPECTATION, AND THE MOVE IS THE FINDING
        // (`T-081-s2`). It read `["Bash", "WebFetch"]` while the fixture
        // was a construction. The real capture refuses `Bash` TWICE — one
        // compound command whose sub-commands were not all covered, and
        // one `cp` with a glob — so the transcribed fixture names one
        // tool twice, and this list says so. Nothing deduplicates: two
        // refusals of one tool are two refusals, and the ONLY field that
        // tells them apart is `tool_use_id`.
        //
        // T-102: THIS CENSUS IS A PALINDROME, WHICH IS WHY IT CANNOT BE
        // THE ORDER PIN. `["Bash", "Bash"]` reversed is itself, so this
        // body kills a first-name-only mutant of `denial_names` (on
        // LENGTH) and is blind to an order mutant.
        // `the_cumulative_record_keeps_every_name_in_the_order_the_cli_listed_them`
        // is the body with two DIFFERENT names, and it is the one that
        // sees the difference.
        TurnError::ToolDenied { denials, terminal_reason } => {
            assert_eq!(denials, &vec!["Bash".to_string(), "Bash".to_string()]);
            assert_eq!(terminal_reason.as_deref(), Some("refusal"));
        }
        other => panic!("expected ToolDenied, got {other:?}"),
    }
    let status = settle(&h.agent);
    assert_eq!(status.phase, Phase::Failed);
    // Same failure shape as the auth case, different classification.
    assert_settled_error_is(
        &status,
        &failed,
        "exit 1 + `is_error` is the same shape the auth failure has, so this turn's \
         `ToolDenied` must reach the settled status intact rather than becoming \
         `AuthFailed`, some other variant, or nothing at all",
    );
    // And the project is untouched: a denied tool is not a write.
    assert!(!h.project.join("docs").exists());
}

// ---- T-081: THE DENIAL THAT REACHES THE SCREEN WHEN IT HAPPENS ---------
//
// T-069 made a parsed denial reach the screen instead of vanishing into
// an empty tail. This family is the layer under that one: the CLI
// announces a denial the MOMENT it happens, on a
// `system`/`permission_denied` line, and until T-081 the runner threw
// that line away. On the observed 2.1.226 turn the two denials were
// roughly forty seconds ahead of the `result` line, and for those forty
// seconds a watching human had no way to know the planner had been
// refused anything.

/// **THE OBSERVED TURN, DRIVEN END TO END.** Two `permission_denied`
/// lines, then a `result` with `is_error: false`,
/// `terminal_reason: "completed"` and both denials listed — a real turn
/// that really SUCCEEDED with two refusals inside it.
///
/// Three properties, and the third is the one a passing body could most
/// easily fake:
///
/// 1. THE TURN SUCCEEDS. `Completed`, phase `Idle`, no error at all. A
///    denial is not a failure, and `denied-fatal-not-flagged` above is
///    the standing tripwire against widening the guard to make it one.
/// 2. BOTH DENIALS CARRY THE CLI'S OWN WORDS — the tool name and the
///    sentence the CLI wrote, not a summary the app invented.
/// 3. THEY ARRIVE **LIVE**, WHICH IS AN ORDER CLAIM, NOT A PRESENCE ONE.
///    The fixture uses a tool AFTER being refused — the recovery the real
///    planner performed — so a runner that collected the denials and
///    emitted them at the `result` line would put both `Denied` events
///    behind that `Activity` instead of in front of it. Asserting only
///    that two denials turned up somewhere in the turn would pass over
///    exactly the behaviour this card exists to change. **A DELTA WILL
///    NOT DO AS THE WITNESS** and this was measured rather than reasoned:
///    deltas are coalesced, so one streamed after the denials still
///    flushes at the end of the relay loop and lands behind a batched
///    denial too. An `Activity` is emitted the instant its line arrives.
#[test]
fn a_denial_reaches_the_screen_the_moment_it_happens_and_the_turn_still_succeeds() {
    let h = harness(
        "deniedcompleted",
        Options { scenario: "denied-then-completed", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    let seen = collect_turn(&h.events);

    let denied = denied_events(&seen);
    assert_eq!(denied.len(), 2, "one event per denial, no more: {seen:#?}");
    assert_eq!(denied[0].1.as_deref(), Some("Bash"));
    assert_eq!(denied[0].2.as_deref(), Some("toolu_01FAHQKCKFrBLrmVtRiuLT9L"));
    assert!(
        denied[0].3.contains("The following part requires approval"),
        "the CLI's own sentence, not a summary: {:?}",
        denied[0].3
    );
    assert_eq!(denied[1].1.as_deref(), Some("Bash"));
    assert_eq!(denied[1].2.as_deref(), Some("toolu_0173K9Q72m797nLBonDtrc3R"));
    assert_eq!(
        denied[1].3,
        "Glob patterns are not allowed in write operations. Please specify an exact file path."
    );

    // THE ORDER CLAIM. The tool the planner reached for AFTER being
    // refused must follow the refusals in the event log — which it
    // cannot do if the denials were held back to the terminal line.
    let last_denial_seq = denied[1].0;
    let activity: Vec<u64> = seen
        .iter()
        .filter_map(|e| match e {
            RunEvent::Activity { seq, .. } => Some(*seq),
            _ => None,
        })
        .collect();
    assert!(
        activity.iter().any(|seq| *seq > last_denial_seq),
        "the recovery tool ran AFTER the denials, so the denials were live rather \
         than batched at the end: {seen:#?}"
    );
    let completed_seq = match seen.last() {
        Some(RunEvent::Completed { seq, .. }) => *seq,
        other => panic!("the observed turn SUCCEEDS; got {other:?}"),
    };
    assert!(last_denial_seq < completed_seq);

    let status = settle(&h.agent);
    assert_eq!(status.phase, Phase::Idle, "two denials, and the turn still completed");
    assert!(status.last_error.is_none(), "a denial is not a failure: {:?}", status.last_error);
}

/// **THE SAME DENIAL IS NOT REPORTED TWICE — AND THE ONE THAT ARRIVED ON
/// ONLY ONE CHANNEL IS STILL REPORTED ONCE.** This is criterion 4 whole,
/// and it needs a stream neither of its neighbours has.
///
/// `permission_denials` on the `result` line is CUMULATIVE: it lists the
/// denials the in-band channel already announced AND any it did not.
/// `tool_use_id` is on both channels and is the join key. So the fixture
/// mixes them — `toolu_on_both_channels` arrives twice over, and
/// `toolu_result_line_only` arrives once, at the end, the way it would
/// from a CLI with no in-band channel at all.
///
/// **A COUNT OVER A SINGLE-CHANNEL STREAM CANNOT SEE ANY OF THIS**, which
/// is why this body exists rather than another assertion on the observed
/// turn. Measured, on the drill: with the in-band arm disabled entirely
/// the observed turn STILL reports both of its denials exactly once, off
/// the `result` line, so a two-ids assertion there is green while the
/// whole live channel is dead. Over THIS stream the two failure
/// directions are separable and neither is silent — drop the join and
/// there are three events, drop the late emit and there is one.
///
/// The turn exits 0 on purpose: `stderr_tail` rides `ExitNonZero`, so
/// T-069's ring relay is provably not what reported the silent one.
#[test]
fn one_denial_on_each_channel_is_reported_once_each() {
    let h = harness(
        "deniedjoin",
        Options { scenario: "denied-live-and-silent", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    let seen = collect_turn(&h.events);
    let denied = denied_events(&seen);
    assert_eq!(
        denied.iter().map(|d| d.2.clone()).collect::<Vec<_>>(),
        vec![
            Some("toolu_on_both_channels".to_string()),
            Some("toolu_result_line_only".to_string()),
        ],
        "each id exactly once, from whichever channel carried it: {seen:#?}"
    );
    // The one that came in band kept the CLI's words; the one that only
    // ever appeared in the cumulative record has none to keep, and the
    // app says so rather than inventing any.
    assert_eq!(denied[0].1.as_deref(), Some("Bash"));
    assert_eq!(denied[0].3, "This Bash command contains multiple operations.");
    assert_eq!(denied[1].1.as_deref(), Some("WebFetch"));
    assert_eq!(denied[1].3, "");
    // …and the live one really was live: the tool the planner reached
    // for between the two sits BETWEEN them in the event log. Nothing
    // about a count could say that.
    let activity: Vec<u64> = seen
        .iter()
        .filter_map(|e| match e {
            RunEvent::Activity { seq, .. } => Some(*seq),
            _ => None,
        })
        .collect();
    assert!(
        activity.iter().any(|seq| *seq > denied[0].0 && *seq < denied[1].0),
        "the recovery tool ran BETWEEN the live denial and the late one: {seen:#?}"
    );
    let status = settle(&h.agent);
    assert_eq!(status.phase, Phase::Idle);
    assert!(status.last_error.is_none());
}

/// **AND THE JOIN KEY IS `tool_use_id`, WHICH IS A CLAIM NO STREAM ABOVE
/// CAN FALSIFY.** Criterion 4 names the key in as many words; this is the
/// body that holds it there.
///
/// Its two neighbours are both blind to the key by construction, and the
/// blindness is the same one twice.
/// `a_denial_reaches_the_screen_the_moment_it_happens_and_the_turn_still_succeeds`
/// announces BOTH of the observed turn's denials in band, so joining on
/// `tool_name` filters both and the count is still two.
/// `one_denial_on_each_channel_is_reported_once_each` gives its two ids
/// DIFFERENT names (`Bash`, `WebFetch`), so joining on `tool_name`
/// separates them exactly as well as joining on `tool_use_id` does.
/// Swap the key in the runner and the whole cargo suite stays green.
///
/// **THIS IS `T-081-s2` IN A NEW COSTUME, AND THAT IS THE LESSON RATHER
/// THAN THE LINE.** `s2` reported that the old `["Bash", "WebFetch"]`
/// guess made a NAME look like it could identify a denial; the fixtures
/// that replaced the guess reintroduced the same blind spot from the
/// other side. A property is only pinned by a stream in which the wrong
/// answer and the right one DIFFER.
///
/// The one shape where they differ is the observed turn's own — **the
/// same tool refused twice** (the capture's census is `["Bash", "Bash"]`)
/// — with one of the two in-band lines missing. A name join then reads
/// the second refusal as one it already announced and drops it.
///
/// **THE FAILURE DIRECTION IS SILENCE**, not a duplicate: the assertion
/// below reds with ONE id where two are owed, which is a refusal the CLI
/// reported and the user is never told about. That is the exact defect
/// this card exists to fix, arriving through the fix.
#[test]
fn a_second_refusal_of_the_same_tool_is_not_swallowed_by_the_first() {
    let h = harness(
        "deniedsamename",
        Options { scenario: "denied-same-tool-one-announced", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    let seen = collect_turn(&h.events);
    let denied = denied_events(&seen);
    assert_eq!(
        denied.iter().map(|d| d.2.clone()).collect::<Vec<_>>(),
        vec![
            Some("toolu_announced".to_string()),
            Some("toolu_never_announced".to_string()),
        ],
        "both refusals of the SAME tool reach the screen - the join is on \
         `tool_use_id`, and a join on `tool_name` reports only the announced \
         one and drops the other into silence: {seen:#?}"
    );
    // Both name `Bash`, which is the whole point: NOTHING about the tool
    // name separates these two events, so nothing but the id can have
    // told them apart.
    assert_eq!(denied[0].1.as_deref(), Some("Bash"));
    assert_eq!(denied[1].1.as_deref(), Some("Bash"));
    // The announced one kept the CLI's own sentence; the one that
    // reached only the cumulative record has none to keep, and the app
    // invents nothing.
    assert_eq!(denied[0].3, "This Bash command contains multiple operations.");
    assert_eq!(denied[1].3, "");
    // …and the announced one really was announced LIVE rather than
    // replayed at the end: the tool the planner reached for next sits
    // BETWEEN the two events. An `Activity` witness rather than a delta,
    // for `T-081-s5`'s reason - if the transport can hold B, B cannot
    // date A.
    let activity: Vec<u64> = seen
        .iter()
        .filter_map(|e| match e {
            RunEvent::Activity { seq, .. } => Some(*seq),
            _ => None,
        })
        .collect();
    assert!(
        activity.iter().any(|seq| *seq > denied[0].0 && *seq < denied[1].0),
        "the recovery tool ran AFTER the live denial and BEFORE the late one: {seen:#?}"
    );
    let status = settle(&h.agent);
    assert_eq!(status.phase, Phase::Idle, "two denials of one tool, and the turn completed");
    assert!(status.last_error.is_none(), "a denial is not a failure: {:?}", status.last_error);
}

/// **AND THE OLDER PATH DOES NOT REGRESS TO SILENCE.** A CLI that writes
/// no in-band line at all — every fixture in this file before T-081, and
/// any CLI build predating the channel — still has its denial reported,
/// from the `result` line, on the same channel the live ones use.
///
/// `denied-then-end-turn` is the existing T-029-s7 fixture: one
/// `WebFetch` denial the planner ROUTED AROUND, no in-band line, and a
/// process that exits 1 for its own reasons. T-069's tail relay covers
/// it only because that turn FAILS — `stderr_tail` rides `ExitNonZero`
/// and nothing else — so the same denial on a turn that SUCCEEDS was
/// still silent after T-069. This is the arm that closes that.
#[test]
fn a_result_only_denial_with_no_in_band_line_is_still_reported() {
    let h = harness(
        "deniedresultonly",
        Options { scenario: "denied-then-end-turn", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    let seen = collect_turn(&h.events);
    let denied = denied_events(&seen);
    assert_eq!(denied.len(), 1, "the result line's own denial, reported: {seen:#?}");
    assert_eq!(denied[0].1.as_deref(), Some("WebFetch"));
    assert_eq!(denied[0].2.as_deref(), Some("tu_07"));
    assert_eq!(
        denied[0].3, "",
        "a result entry carries `tool_input`, never a message - the app says what it \
         HAS and invents nothing"
    );
    // …and T-113 CHANGED WHAT THE TAIL DOES HERE. This assertion read
    // `stderr_tail.contains("WebFetch")` from T-069 until T-113: the
    // runner pushed a `permission_denials: <names>` ring note for the
    // SAME `unannounced` vector the event above came from, so this one
    // refusal reached the screen twice once T-101 built the second
    // surface. The note is deleted; the event above is the report.
    //
    // THIS BODY IS THE WEAK HALF OF THAT PROPERTY AND SAYS SO: with the
    // note gone this fixture's tail is EMPTY (`is_error: false` keeps the
    // result text out of the ring and the CLI writes no stderr), so
    // "does not name it" here is satisfied equally by a dead ring. The
    // pin with a POSITIVE CONTROL is
    // `a_result_only_denial_is_a_live_event_and_is_not_repeated_in_the_tail`.
    match seen.last() {
        Some(RunEvent::Failed { error: TurnError::ExitNonZero { code, stderr_tail }, .. }) => {
            assert_eq!(*code, Some(1));
            assert!(
                !stderr_tail.contains("WebFetch"),
                "the refusal is already on screen as its own `Denied` event: {stderr_tail:?}"
            );
        }
        other => panic!("expected ExitNonZero, got {other:?}"),
    }
    settle(&h.agent);
}

/// **T-113: ONE REFUSAL, ONE REPORT — AND THE TAIL IS SHOWN CARRYING
/// SOMETHING ELSE, SO THE ABSENCE MEANS SOMETHING.**
///
/// `T-081`'s criterion 4 reads THE SAME DENIAL SHALL NOT BE REPORTED
/// TWICE, and the runner broke it on exactly one path. ONE partition drove
/// TWO reports over ONE vector: a live `Denied` event per entry, and —
/// sixty lines further down the same arm — a `permission_denials: <names>`
/// note pushed into the diagnostic ring, which becomes `ExitNonZero`'s
/// `stderr_tail` and is rendered verbatim by `failureDetail` inside
/// `FailureBlock`. T-069 added that note when NOTHING rendered a denial
/// and it was right then; T-081 added the live events and narrowed the
/// note to the `unannounced` set — which is precisely the set the emit
/// loop three statements up had just announced. The narrowing removed the
/// note for the denials that did not need it and kept it for the ones that
/// did not either. It went LIVE rather than latent at T-101, which built
/// the second surface: one result-only refusal produced a `DenialNotice`
/// row AND a failure block reading `permission_denials: WebFetch`.
///
/// **BOTH HALVES SIT IN THIS ONE BODY BECAUSE EACH IS SATISFIABLE WITHOUT
/// THE OTHER.** "The tail does not name it" is satisfied by a runner that
/// emits nothing at all; "the event fired" is satisfied by one that also
/// still writes the note. Only the conjunction is the property.
///
/// **AND THE NEGATIVE HAS ITS POSITIVE CONTROL** (CONVENTIONS: A NEGATIVE
/// ASSERTION NEEDS A POSITIVE CONTROL). `denied-result-only-nonzero`'s CLI
/// writes a real sentence to stderr, so the tail is measured CARRYING
/// something ON THIS TURN. Against a merely EMPTY tail,
/// `!contains("WebFetch")` cannot tell a fixed double report from a dead
/// ring, a dead stderr pump, or a turn that never reached `ExitNonZero` at
/// all — and the two `denied-then-end-turn` bodies have exactly that empty
/// tail, which is why neither of them can be this pin.
///
/// The SECOND entry has no `tool_name`, which answers criterion 6 with a
/// measurement instead of a promise: `denial_names` is a `filter_map` over
/// `tool_name`, so that entry contributed NOTHING to the deleted note —
/// the note was never its surface, and restoring the note would not have
/// covered it. Its live event carries it.
///
/// SHAPE SIX, asked and answered — no other body drives this call. The two
/// `denied-then-end-turn` bodies have no control (empty tail);
/// `one_denial_on_each_channel_is_reported_once_each` exits ZERO on
/// purpose, so it has no `stderr_tail` to inspect at all; and
/// `a_denial_missing_its_fields_still_reaches_the_screen_bounded_and_stripped`
/// puts its nameless denial on the IN-BAND channel over an EMPTY
/// `permission_denials`, so it never reaches this partition.
#[test]
fn a_result_only_denial_is_a_live_event_and_is_not_repeated_in_the_tail() {
    let h = harness(
        "deniedonce",
        Options { scenario: "denied-result-only-nonzero", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    let seen = collect_turn(&h.events);

    // HALF ONE — the refusal reached the screen, live, one event per
    // denial, the nameless entry included.
    let denied = denied_events(&seen);
    assert_eq!(
        denied.iter().map(|d| (d.1.clone(), d.2.clone())).collect::<Vec<_>>(),
        vec![
            (Some("WebFetch".to_string()), Some("tu_113".to_string())),
            (None, Some("tu_113_nameless".to_string())),
        ],
        "every result-only entry gets its own event, and the one `denial_names` \
         drops for having no name is kept: {seen:#?}"
    );

    // HALF TWO — …and the tail does not say it a second time.
    match seen.last() {
        Some(RunEvent::Failed { error: TurnError::ExitNonZero { code, stderr_tail }, .. }) => {
            assert_eq!(*code, Some(1));
            // THE POSITIVE CONTROL, ASSERTED FIRST: this tail is carrying
            // the CLI's own stderr on this very turn, so the two absences
            // below are absences rather than silence.
            assert!(
                stderr_tail.contains("transport closed before the session could be saved"),
                "the ring relayed the CLI's own stderr, so this tail is LIVE and the \
                 absences below mean something: {stderr_tail:?}"
            );
            assert!(
                !stderr_tail.contains("WebFetch"),
                "the tool is already on screen as its own `Denied` event and is NOT \
                 repeated in the tail: {stderr_tail:?}"
            );
            assert!(
                !stderr_tail.contains("permission_denials"),
                "…and the deleted note's own label went with it: {stderr_tail:?}"
            );
        }
        other => panic!("expected ExitNonZero, got {other:?}"),
    }

    // The CUMULATIVE record is a DIFFERENT question and is pinned on its
    // own stream by
    // `a_turn_killed_by_a_denied_tool_names_the_tool_rather_than_the_exit_code`.
    // Here `is_error` is false, so nothing claims the denial killed the
    // turn — and `ToolDenied` carries no `stderr_tail` field at all, which
    // is why its record is not what this body is about.
    let status = settle(&h.agent);
    assert_settled_error_is(
        &status,
        &terminal_error(&seen),
        "a denial the turn routed around is not the cause of its death, so this must \
         settle as the very `ExitNonZero` the event carried — not `ToolDenied`",
    );
}

/// **A DENIAL THE APP CANNOT FULLY DESCRIBE IS NOT A DENIAL THE USER
/// SHOULD BE DENIED** (criterion 6), and the same body carries
/// criterion 2's bound-and-strip pin on this path specifically.
///
/// Line one has no `tool_name`, an empty `message` and a `tool_use_id`
/// that NO `result` entry corroborates — the turn's terminal
/// `permission_denials` is EMPTY, so nothing at the end of the turn would
/// ever have mentioned it. Line two is 4 000 plain bytes, so the BOUND is
/// what it measures. Line three is short and control-laden, so the
/// STRIPPING is what it measures; the two are separate lines because
/// escaping runs after truncation and lengthens the result, which makes a
/// combined length assertion meaningless.
///
/// Reusing `denial_names()`'s helper is not the same as being covered by
/// its tests, so the bound and the stripping are measured HERE, through
/// the whole spawn-and-relay path, with literals rather than the
/// constants the producer reads.
#[test]
fn a_denial_missing_its_fields_still_reaches_the_screen_bounded_and_stripped() {
    let h = harness(
        "deniedpartial",
        Options { scenario: "denied-partial-fields", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    let seen = collect_turn(&h.events);
    let denied = denied_events(&seen);
    assert_eq!(denied.len(), 3, "every degenerate line still arrives: {seen:#?}");

    // No tool name, no message, an id nothing corroborates — surfaced.
    assert_eq!(denied[0].1, None, "an absent tool name is None, never an invented one");
    assert_eq!(denied[0].2.as_deref(), Some("toolu_orphan_no_name"));
    assert_eq!(denied[0].3, "");

    // THE BOUND, against a literal rather than the constant the producer
    // reads: 4 000 bytes of plain text in, 768 out.
    assert_eq!(denied[1].1.as_deref(), Some("Bash"));
    assert_eq!(
        denied[1].3.len(),
        768,
        "the message is cut at the module's own byte bound before it reaches the webview"
    );

    // THE STRIPPING.
    assert_eq!(denied[2].1.as_deref(), Some("Write"));
    assert!(!denied[2].3.contains('\n'), "no raw newline survives: {:?}", denied[2].3);
    assert!(!denied[2].3.contains('\u{1b}'), "no raw ESC survives: {:?}", denied[2].3);
    assert!(denied[2].3.contains("\\n"), "it is ESCAPED, not deleted: {:?}", denied[2].3);
    assert!(denied[2].3.contains("\\u{1b}"), "…and so is the ESC: {:?}", denied[2].3);

    let status = settle(&h.agent);
    assert_eq!(status.phase, Phase::Idle, "none of the three is a failure");
    assert!(status.last_error.is_none());
}

/// **THE FIXTURE IS A TRANSCRIPTION, AND THIS IS WHAT MAKES THAT
/// CHECKABLE RATHER THAN CLAIMED** (criterion 5).
///
/// `fake_agent.rs`'s denial scenario was written from documented field
/// names — T-029-s5's central complaint — and a comment claiming a
/// transcription is worth exactly as much as the next editor's care. So
/// this body reads
/// `docs/research/captures/real-planner-turn-2026-08-19.jsonl` off disk,
/// runs the fake agent, and compares the two side by side. A paraphrase
/// reds against the file it claims to be quoting.
///
/// The precedent for a cargo test reading a docs file is
/// `snapshot_version_matches_the_live_method_stamps` in
/// `src/agent/kit.rs`, which reads `docs/CONVENTIONS.md` on every
/// `cargo test`. This adds a THIRD live reader outside CONVENTIONS' four
/// walks; see the implementation notes.
///
/// `session_id` and `uuid` are deliberately NOT compared: they are the
/// identity of one run, not the shape of the protocol, and the fixture
/// binds `session_id` to whatever session it is playing.
#[test]
fn the_tool_denied_fixture_is_a_transcription_not_a_construction() {
    let capture = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../docs/research/captures/real-planner-turn-2026-08-19.jsonl");
    let raw = fs::read_to_string(&capture)
        .unwrap_or_else(|err| panic!("{} is the source of the fixture: {err}", capture.display()));
    // The file is PRETTY-PRINTED JSON, one object per line. A substring
    // grep for a compact `"subtype":"permission_denied"` finds nothing in
    // it and reads as an empty file; parse, never match text.
    let captured: Vec<serde_json::Value> = raw
        .lines()
        .filter(|l| !l.trim().is_empty())
        .map(|l| serde_json::from_str(l).expect("every capture line is JSON"))
        .collect();
    let captured_denials: Vec<&serde_json::Value> = captured
        .iter()
        .filter(|v| {
            v.get("type").and_then(|t| t.as_str()) == Some("system")
                && v.get("subtype").and_then(|t| t.as_str()) == Some("permission_denied")
        })
        .collect();
    assert_eq!(captured_denials.len(), 2, "the capture's two in-band denials");
    let captured_entries = captured
        .iter()
        .find(|v| v.get("type").and_then(|t| t.as_str()) == Some("result"))
        .and_then(|v| v.get("permission_denials"))
        .expect("the capture's result line lists its denials");

    let out = std::process::Command::new(fake_agent_bin())
        .env("NPUTER_FAKE_SCENARIO", "denied-then-completed")
        .stdin(std::process::Stdio::null())
        .output()
        .expect("the fake agent runs");
    let emitted: Vec<serde_json::Value> = String::from_utf8_lossy(&out.stdout)
        .lines()
        .filter(|l| !l.trim().is_empty())
        .map(|l| serde_json::from_str(l).expect("every fixture line is JSON"))
        .collect();
    let emitted_denials: Vec<&serde_json::Value> = emitted
        .iter()
        .filter(|v| {
            v.get("type").and_then(|t| t.as_str()) == Some("system")
                && v.get("subtype").and_then(|t| t.as_str()) == Some("permission_denied")
        })
        .collect();

    assert_eq!(emitted_denials.len(), captured_denials.len());
    for (i, (emitted, captured)) in emitted_denials.iter().zip(&captured_denials).enumerate() {
        for key in ["tool_name", "tool_use_id", "decision_reason_type", "decision_reason", "message"]
        {
            assert_eq!(
                emitted.get(key),
                captured.get(key),
                "denial {i}: `{key}` is not what the capture says it is"
            );
        }
    }
    // The shape variation nobody guessed, asserted as a variation rather
    // than trusted to survive the loop above: the FIRST line carries no
    // `decision_reason` and the SECOND one does.
    assert_eq!(emitted_denials[0].get("decision_reason"), None);
    assert!(emitted_denials[1].get("decision_reason").is_some());

    let emitted_entries = emitted
        .iter()
        .find(|v| v.get("type").and_then(|t| t.as_str()) == Some("result"))
        .and_then(|v| v.get("permission_denials"))
        .expect("the fixture's result line lists its denials");
    assert_eq!(emitted_entries, captured_entries, "the cumulative record, entries whole");

    // THE HALF THAT IS STILL A CONSTRUCTION, said out loud here so it
    // cannot be mistaken for transcribed: no FATAL denial has ever been
    // observed, so `tool-denied`'s ending is a guess. The observed turn
    // COMPLETED, and `denied-then-completed` above is faithful to it.
    let terminal = captured
        .iter()
        .find(|v| v.get("type").and_then(|t| t.as_str()) == Some("result"))
        .expect("terminal line");
    assert_eq!(terminal.get("is_error").and_then(|v| v.as_bool()), Some(false));
    assert_eq!(
        terminal.get("terminal_reason").and_then(|v| v.as_str()),
        Some("completed"),
        "the guessed \"refusal\" was never observed - `tool-denied`'s ending stays a \
         construction and says so in the fixture"
    );
}

/// T-124: THE 2026-08-24 TRANSCRIPTION IS CHECKED AGAINST REAL CAPTURED
/// BYTES, FOR THE ONE REASON THAT CAN BE CHECKED AT ALL.
///
/// `adapter::OBSERVED_PLANNER_REFUSALS` carries three refusals transcribed
/// from the CLI's rows AS RENDERED on screen — there is no JSONL capture
/// of that turn, and `real_cli_arms_forbidden` means there never can be
/// one from a test. So two of the three are unverifiable by construction
/// and this body does not pretend otherwise.
///
/// **THE THIRD ONE IS VERIFIABLE, AND IT IS WORTH THE BODY.** The CLI
/// emits a fixed sentence ahead of the command it refuses, and the
/// 2026-08-19 capture on disk contains that same sentence from the same
/// CLI version. Asserting the transcription reproduces it byte for byte
/// does two things a comment cannot: it reds on a paraphrase, and it
/// settles the one transcription question the rendered form leaves open —
/// whether the backticks in the source are the CLI's or the transcriber's
/// markdown. **The capture carries none**, so they are the transcriber's,
/// and the const strips them.
///
/// The precedent is the body directly above: a cargo test reading a docs
/// file, after `snapshot_version_matches_the_live_method_stamps`. This
/// adds NO new reader — it is the same capture that body already reads.
#[test]
fn the_2026_08_24_transcription_agrees_with_the_2026_08_19_capture() {
    use nputer_lib::agent::adapter::{
        RefusalMechanism, OBSERVED_PLANNER_REFUSALS,
    };

    let capture = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../docs/research/captures/real-planner-turn-2026-08-19.jsonl");
    let raw = fs::read_to_string(&capture)
        .unwrap_or_else(|err| panic!("{} corroborates the transcription: {err}", capture.display()));
    let captured_messages: Vec<String> = raw
        .lines()
        .filter(|l| !l.trim().is_empty())
        .map(|l| serde_json::from_str::<serde_json::Value>(l).expect("every capture line is JSON"))
        .filter(|v| v.get("subtype").and_then(|t| t.as_str()) == Some("permission_denied"))
        .filter_map(|v| v.get("message").and_then(|m| m.as_str()).map(str::to_owned))
        .collect();

    // The CLI's fixed sentence, LIFTED OUT OF THE CAPTURE rather than
    // written down here: a literal in this file would be a third copy of
    // the same string and would move with any edit to the const.
    let preamble = captured_messages
        .iter()
        .find_map(|m| {
            m.split_inclusive("requires approval: ")
                .next()
                .filter(|p| *p != m.as_str())
        })
        .expect("the capture's subcommandResults denial quotes a command after a fixed preamble");
    assert!(
        preamble.len() > 40,
        "a preamble short enough to match by accident proves nothing: {preamble:?}"
    );

    let ours = OBSERVED_PLANNER_REFUSALS
        .iter()
        .find(|r| r.mechanism == RefusalMechanism::OurAllowlist)
        .expect("one captured refusal is our own allowlist's");
    assert!(
        ours.reason.starts_with(preamble),
        "T-124: the transcribed reason must reproduce the CLI's own sentence byte for byte.\n\
         capture: {preamble:?}\n\
         ours:    {:?}",
        ours.reason
    );

    // THE DISCRIMINATING HALF: the capture's own quoted command is a
    // DIFFERENT command from the one 2026-08-24 refused, so this is a
    // corroboration of the SENTENCE and not of the whole message. Said
    // out loud, and asserted, so the body cannot be read as claiming more
    // than it proves.
    assert!(
        !captured_messages.iter().any(|m| m == ours.reason),
        "the two turns refused different commands; if these ever match, one of the two \
         fixtures is quoting the wrong turn"
    );
    // And the backtick question, settled against the file: the CLI writes
    // the command it refuses PLAIN, so a transcription carrying markdown
    // code spans would be quoting its own rendering.
    for message in &captured_messages {
        assert!(
            !message.contains('`'),
            "the CLI's own denial text carries no backticks: {message:?}"
        );
    }
    assert!(!ours.reason.contains('`'), "…and neither does the transcription: {:?}", ours.reason);
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
    let failed = wait_failed(&h.events);
    match &failed {
        TurnError::ExitNonZero { code, stderr_tail } => {
            assert_eq!(*code, Some(1));
            // The CLI's own words still arrive — the fix narrows the
            // CLASSIFICATION, it does not silence the relay.
            assert!(stderr_tail.contains("ENOSPC"), "{stderr_tail}");
        }
        other => panic!("expected ExitNonZero, got {other:?}"),
    }
    let status = settle(&h.agent);
    assert_eq!(status.phase, Phase::Failed);
    assert_settled_error_is(
        &status,
        &failed,
        "a 401 the CLI RECOVERED from is not this turn's cause, so the disk-full \
         `ExitNonZero` must settle exactly as it was emitted rather than as \
         `AuthFailed`",
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
    let failed = wait_failed(&h.events);
    match &failed {
        TurnError::ExitNonZero { code, .. } => assert_eq!(*code, Some(1)),
        other => panic!("expected ExitNonZero, got {other:?}"),
    }
    let status = settle(&h.agent);
    assert_settled_error_is(
        &status,
        &failed,
        "a turn that ANSWERED did not fail to authenticate, so its `ExitNonZero` must \
         settle whole rather than as `AuthFailed`",
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
///
/// **T-102 RE-RAN IT AS A COUNTER-PIN AGAINST ITS OWN WIDENING**
/// (criterion 2), and this is the body that had to be named. T-069's
/// closure rested on "this stream carries no DELTA"; after T-102 the
/// guard withdraws on a `tool_use` block as well, so the counter-pin's
/// standing had to be re-derived rather than inherited. It holds, and it
/// holds by construction on a WIDER foot than before: `auth-403-no-result`
/// is an init, one `api_retry` diagnostic and an exit — it streams
/// NEITHER content-block type, so there is no evidence of either kind for
/// the widened flag to read.
///
/// It is still RED-ABLE, which is the claim that matters and the one a
/// widening can quietly destroy: dropping the `!evidence_after_auth_status`
/// guard's negation, or making the `Activity`/`TextDelta` arms set the
/// flag unconditionally rather than under `auth_status.is_some()`, turns
/// this turn into an `ExitNonZero` and reds here.
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
///
/// T-069 ADDS THE OTHER HALF OF THE QUESTION: what does the user SEE?
/// The classifier declining is right; the turn arriving with an EMPTY
/// tail was not. `is_error: false` also means the `result` text never
/// reaches the diagnostic ring, so this turn measured
/// `ExitNonZero { code: Some(1), stderr_tail: "" }` — `failureDetail`
/// returns null for an empty trimmed detail, `FailureBlock` renders no
/// detail span, and the screen read exactly "the planner exited with
/// code 1" with nothing under it. The denial had been parsed into a
/// bounded, control-stripped `Vec<String>` and then dropped on the
/// floor. RELAYING IS NOT DIAGNOSING: the classification is unchanged
/// below and the name arrives anyway.
#[test]
fn a_denial_the_planner_routed_around_is_not_blamed_for_an_unrelated_exit() {
    let h = harness(
        "deniedendturn",
        Options { scenario: "denied-then-end-turn", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    let seen = collect_turn(&h.events);
    // T-113 MOVED THE RELAY'S SURFACE, NOT THE PROPERTY. This body
    // asserted `stderr_tail.contains("WebFetch")` from T-069 until T-113.
    // The declined diagnosis STILL relays what it parsed — it does it as
    // the denial's own live event, which carries the `tool_use_id` the
    // note could not spell — and the tail no longer repeats it. The
    // assertion is moved rather than dropped so this body still holds
    // T-069's user-facing half: the tool is NAMED.
    let denied = denied_events(&seen);
    assert_eq!(
        denied.iter().map(|d| d.1.clone()).collect::<Vec<_>>(),
        vec![Some("WebFetch".to_string())],
        "the tool the CLI refused is named even though the classifier declined \
         to blame it: {seen:#?}"
    );
    match seen.last() {
        Some(RunEvent::Failed { error: TurnError::ExitNonZero { code, stderr_tail }, .. }) => {
            assert_eq!(*code, Some(1));
            assert!(
                !stderr_tail.contains("WebFetch"),
                "…and it is named ONCE: the tail does not repeat the event above \
                 (positive control in \
                 `a_result_only_denial_is_a_live_event_and_is_not_repeated_in_the_tail`): \
                 {stderr_tail:?}"
            );
        }
        other => panic!("expected ExitNonZero, got {other:?}"),
    }
    let status = settle(&h.agent);
    assert_settled_error_is(
        &status,
        &terminal_error(&seen),
        "a denial the turn SURVIVED is not the cause of its death, so this settles as \
         the emitted `ExitNonZero` rather than as `ToolDenied`",
    );
}

/// T-069, THE SHARPEST RELAY CASE. A denial that really DID end the turn
/// — `terminal_reason: "refusal"`, the CLI's own sentence saying it was
/// refused — which the CLI nonetheless wrote with `is_error: false`.
/// T-029-s7's narrow guard declines it, correctly and deliberately: the
/// wider `terminal_reason` form needs the vocabulary T-029-s5 records as
/// UNVERIFIED, and this fixture's `"refusal"` is precisely the
/// constructed value that finding is about.
///
/// So this is the turn with the most to lose from a declined diagnosis
/// and it lost everything: no `is_error` means no result text in the
/// ring, no claim means no `denials` on the variant, and the tail
/// measured EMPTY. It is now the case that proves the relay is not
/// merely a nicer `ToolDenied` — the user is told which tool by a
/// variant that never claimed the tool killed anything.
///
/// It is ALSO a tripwire in the other direction, said out loud rather
/// than discovered: widening the guard to `terminal_reason == "refusal"`
/// turns this into `ToolDenied` and REDS here, so building on the
/// unverified vocabulary stays a deliberate, visible act.
#[test]
fn a_fatal_denial_the_cli_did_not_flag_as_an_error_still_names_the_tool() {
    let h = harness(
        "deniedfatal",
        Options { scenario: "denied-fatal-not-flagged", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    let seen = collect_turn(&h.events);
    // T-113: the same move as the body above, on the sharpest relay case.
    // This assertion read `stderr_tail.contains("Bash")` from T-069 until
    // T-113. The turn with the most to lose from a declined diagnosis
    // still loses nothing — the user is told which tool, by a variant that
    // never claimed the tool killed anything — and is told ONCE.
    let denied = denied_events(&seen);
    assert_eq!(
        denied.iter().map(|d| d.1.clone()).collect::<Vec<_>>(),
        vec![Some("Bash".to_string())],
        "the refused tool is relayed even when nothing claimed it: {seen:#?}"
    );
    match seen.last() {
        Some(RunEvent::Failed { error: TurnError::ExitNonZero { code, stderr_tail }, .. }) => {
            assert_eq!(*code, Some(1));
            assert!(
                !stderr_tail.contains("Bash"),
                "…and the tail does not repeat the event above (positive control in \
                 `a_result_only_denial_is_a_live_event_and_is_not_repeated_in_the_tail`): \
                 {stderr_tail:?}"
            );
        }
        other => panic!("expected ExitNonZero, got {other:?}"),
    }
    let status = settle(&h.agent);
    assert_settled_error_is(
        &status,
        &terminal_error(&seen),
        "`is_error: false` is not a turn the CLI says it failed, so the declined \
         diagnosis settles as the emitted `ExitNonZero` rather than as `ToolDenied`",
    );
}

/// **T-102 criteria 4 AND 6: THE SPLIT PAIR, ON THE ONLY TURN SHAPE THAT
/// CAN SHOW IT.** One fixture closes both denial gaps at once, because
/// `T-069-s3` and `T-081-s10` wanted the same edit from opposite
/// directions — a SECOND denial, and an IN-BAND line.
///
/// **THE THREE CONDITIONS HAVE ALWAYS LIVED IN DIFFERENT FIXTURES, WHICH
/// IS WHY NOTHING DROVE THIS.** The reachable case needs a denial
/// announced in band, the cumulative `result` line listing it as well
/// (always true — the array is cumulative), AND the turn classified
/// `ExitNonZero` rather than `ToolDenied`, so a `stderr_tail` exists at
/// all. `denied-then-end-turn`, `denied-fatal-not-flagged` and
/// `denied-result-only-nonzero` satisfy the third and carry NO in-band
/// line; `denied-live-and-silent` and `denied-same-tool-one-announced`
/// carry one and exit ZERO. `denied-announced-and-silent-nonzero` is the
/// intersection.
///
/// **THREE PROPERTIES, AND EACH IS SATISFIABLE WITHOUT THE OTHERS, WHICH
/// IS WHY THEY ARE ONE BODY.**
///
///   ONE — the announced denial arrives at its IN-BAND MOMENT and is not
///   re-emitted at `Result` time. The `Activity` between the two channels
///   is the liveness witness (`denied-then-completed` records why an
///   `Activity` dates a moment and a coalesced delta does not), so this
///   is an ORDER fact and not a pair of counts: a runner that held its
///   denials back to the `result` line would put BOTH after the marker.
///
///   TWO — the unannounced one arrives at `Result` time rather than not
///   at all. Dropping the late emit gives one event, dropping the join
///   gives three, and only the correct partition gives these two in this
///   order.
///
///   THREE — and the tail names NEITHER of them (T-113's deletion),
///   with the CLI's own stderr in it as the POSITIVE CONTROL.
///
/// **SHAPE SIX, ASKED AND ANSWERED WITH A MEASUREMENT RATHER THAN A
/// PROMISE.** T-113's own pin
/// (`a_result_only_denial_is_a_live_event_and_is_not_repeated_in_the_tail`)
/// drives a single RESULT-ONLY denial, so every denial it sees is
/// unannounced and the NARROW restoration
/// (`denial_names(unannounced…)`) and the WIDE one
/// (`denial_names(&denials)`) are the same mutant over that stream. Over
/// THIS stream they are two: the narrow restoration puts `WebFetch` in
/// the tail, and the wide one additionally puts `Bash` — the ANNOUNCED
/// name, the one whose double report was T-113's entire subject — in it.
/// **The wide restoration is the mutant only this body kills**, and it is
/// exactly the pre-T-081 shape a careless revert would land back on.
/// This body also drives the announced/unannounced ORDER, which no
/// `ExitNonZero` fixture could reach before it.
#[test]
fn an_announced_denial_is_not_repeated_at_result_time_and_neither_name_reaches_the_tail() {
    let h = harness(
        "deniedsplit",
        Options { scenario: "denied-announced-and-silent-nonzero", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    let seen = collect_turn(&h.events);

    // PROPERTIES ONE AND TWO — each denial reaches the screen exactly
    // once, and WHEN it did is what tells the two channels apart.
    let denied = denied_events(&seen);
    assert_eq!(
        denied.iter().map(|d| (d.1.clone(), d.2.clone())).collect::<Vec<_>>(),
        vec![
            (Some("Bash".to_string()), Some("tu_102_announced".to_string())),
            (Some("WebFetch".to_string()), Some("tu_102_never_announced".to_string())),
        ],
        "each denial is reported ONCE: the announced one from the in-band line, the \
         silent one from the cumulative `result` list, and the announced one is NOT \
         repeated when the `result` line lists it again: {seen:#?}"
    );

    // …and the ORDER against the liveness witness, which is what makes
    // "at its in-band moment" a fact rather than a hope. The `Activity`
    // sits between the two channels in the stream, so it must sit
    // between the two events on screen.
    let marker = seen
        .iter()
        .position(|e| matches!(e, RunEvent::Activity { label, .. } if label == "Write"))
        .expect("the liveness witness must have arrived: {seen:#?}");
    let denial_positions: Vec<usize> = seen
        .iter()
        .enumerate()
        .filter(|(_, e)| matches!(e, RunEvent::Denied { .. }))
        .map(|(i, _)| i)
        .collect();
    assert_eq!(denial_positions.len(), 2, "two denials, two events: {seen:#?}");
    assert!(
        denial_positions[0] < marker,
        "the ANNOUNCED denial is news when it happens, so it lands BEFORE the tool \
         call that followed it in the stream: {seen:#?}"
    );
    assert!(
        denial_positions[1] > marker,
        "…and the SILENT one could not be known until the `result` line, so it lands \
         after: {seen:#?}"
    );

    // PROPERTY THREE — the tail repeats neither, and the control comes
    // first so the two absences are absences rather than silence.
    let failed = terminal_error(&seen);
    match &failed {
        TurnError::ExitNonZero { code, stderr_tail } => {
            assert_eq!(*code, Some(1));
            assert!(
                stderr_tail.contains("transport closed before the session could be saved"),
                "THE POSITIVE CONTROL: the ring relayed the CLI's own stderr on this \
                 very turn, so the absences below mean something: {stderr_tail:?}"
            );
            assert!(
                !stderr_tail.contains("Bash"),
                "the ANNOUNCED denial is already on screen as its own live event and \
                 the tail does not say it again — this is the name the WIDE \
                 restoration of the deleted ring note would put back, and no other \
                 body can see it: {stderr_tail:?}"
            );
            assert!(
                !stderr_tail.contains("WebFetch"),
                "…and neither is the silent one, which arrived as its own event too: \
                 {stderr_tail:?}"
            );
            assert!(
                !stderr_tail.contains("permission_denials"),
                "…and the deleted note's own label went with it: {stderr_tail:?}"
            );
        }
        other => panic!("expected ExitNonZero, got {other:?}"),
    }

    // The CUMULATIVE record is a DIFFERENT question and is asserted
    // separately, on its own stream, by
    // `the_cumulative_record_keeps_every_name_in_the_order_the_cli_listed_them`
    // — a body that conflates the two pins neither. Here `is_error` is
    // false, so nothing claims a denial killed this turn, and
    // `ToolDenied` carries no `stderr_tail` field at all.
    let status = settle(&h.agent);
    assert_settled_error_is(
        &status,
        &failed,
        "`is_error: false` declines the `ToolDenied` claim, so this settles as the \
         emitted `ExitNonZero`",
    );
}

/// **T-102 criterion 5: THE ORDER AND THE COMPLETENESS OF THE SURVIVING
/// RECORD.**
///
/// After T-113 deleted the ring note, `denial_names(&denials)` feeding
/// the cumulative `ToolDenied` record is the LAST runner-side producer of
/// a multi-name record — and no fixture could see it work.
///
/// **RE-MEASURED AT THIS CARD'S BASE RATHER THAN TAKEN ON REPORT, AND THE
/// NOTE ON THE CARD IS HALF RIGHT.** `retry-401-then-tool-denied` drives
/// the join with ONE entry. `tool-denied` drives it with TWO — so a
/// first-name-only mutant already reds there, on LENGTH — but both of
/// them are `Bash`, because the real 2.1.226 capture refused the same
/// tool twice (`T-081-s2`). **A two-element list of one repeated name is
/// a palindrome**: reverse the join and `["Bash", "Bash"]` is still
/// `["Bash", "Bash"]`, and `assert_eq!` cannot tell. So the gap is real
/// and is narrower than "more than one name" — it is ORDER, and this is
/// the only body in the file that can see it.
///
/// The separator lives render-side (`failureDetail`'s join, in
/// `app-interview`) and is outside this card's fence; this body asserts
/// the VECTOR the runner produces and reaches across for nothing.
///
/// SHAPE SIX: its unique mutant is a REORDERING of `denial_names` — a
/// `.rev()`, or a sort. `tool-denied`'s census is blind to it by
/// construction, `denied-announced-and-silent-nonzero` never reaches the
/// `ToolDenied` arm at all (`is_error: false`), and the live `Denied`
/// events are a different producer on a different channel.
#[test]
fn the_cumulative_record_keeps_every_name_in_the_order_the_cli_listed_them() {
    let h = harness(
        "twonames",
        Options { scenario: "tool-denied-two-names", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    let failed = wait_failed(&h.events);
    match &failed {
        TurnError::ToolDenied { denials, terminal_reason } => {
            // BOTH names, in the CLI's own order. Completeness and order
            // in one `assert_eq!`, which is the only form that has both:
            // a `contains` pair would survive a reversal and a length
            // check would survive a swap.
            assert_eq!(
                denials,
                &vec!["WebFetch".to_string(), "Bash".to_string()],
                "the cumulative record keeps every name the `result` line listed, in \
                 the order it listed them"
            );
            assert_eq!(terminal_reason.as_deref(), Some("refusal"));
        }
        other => panic!("expected ToolDenied, got {other:?}"),
    }
    let status = settle(&h.agent);
    assert_settled_error_is(
        &status,
        &failed,
        "the record the user is shown is the record the turn produced, whole",
    );
}

/// T-069: THE PIN ON THE FALSE NEGATIVE T-029 BOUGHT.
///
/// `auth_status = api_error_status;` is assigned, never merged — the
/// terminal line is the turn's own verdict — and that is right. Its
/// undisclosed consequence is that an auth failure naming its status
/// ONLY in a diagnostic, with a `result` line that carries none, stops
/// being typed and degrades to `ExitNonZero`. The trade costs 2.1.226
/// NOTHING for exactly one reason: the transcribed shape carries
/// `api_error_status` on its own `result` line.
///
/// That reason is a fact about the CLI, and facts about the CLI move.
/// This stream is `auth-error` minus its `api_retry` diagnostic — one
/// `bool` apart, same emitter — so the `result` line is the only carrier
/// of the status left. If a future transcription moves the status off
/// the terminal line, `auth-error` keeps classifying `AuthFailed` off
/// its diagnostic and says nothing, while THIS reds.
#[test]
fn the_transcribed_auth_shape_carries_its_status_on_its_own_result_line() {
    let h = harness(
        "authresultonly",
        Options { scenario: "auth-error-result-only", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::AuthFailed { status, message } => {
            assert_eq!(
                status,
                Some(401),
                "with no diagnostic in the stream the terminal line is the only \
                 place this status can have come from"
            );
            assert!(message.contains("revoked"), "the CLI's own sentence: {message:?}");
        }
        other => panic!(
            "the transcribed auth failure stopped being typed when its diagnostic \
             was removed — `api_error_status` has moved off the `result` line, got {other:?}"
        ),
    }
    settle(&h.agent);
}

/// T-069: A TERMINAL LINE OUTRANKS THE TEXT THAT CAME BEFORE IT — and
/// this body exists because, without it, the line that says so could be
/// deleted with the whole suite still green.
///
/// T-069's discriminator reads model text as evidence the CLI got past a
/// status. A CLI that streams a few words and THEN has its credentials
/// refused produces exactly that evidence in front of a genuine auth
/// failure, and its `result` line names the status again. The terminal
/// line is the turn's own verdict (T-029's rule) so it wins, which the
/// runner implements by clearing the flag wherever a status is written.
///
/// No other stream in this file puts a delta between an auth diagnostic
/// and an auth result line, so no other body can tell that clearing from
/// its absence. That is the shape T-043-s4 named — a mechanism with no
/// falsifying body — and this is the body.
#[test]
fn an_auth_failure_that_streamed_text_before_it_failed_is_still_typed() {
    let h = harness(
        "authaftertext",
        Options { scenario: "auth-error-after-text", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::AuthFailed { status, message } => {
            assert_eq!(status, Some(401));
            assert!(message.contains("revoked"), "the CLI's own sentence: {message:?}");
        }
        other => panic!(
            "the terminal line named the status again, so the text before it is not \
             evidence the CLI got past anything: {other:?}"
        ),
    }
    settle(&h.agent);
}

/// T-069's RULING, built: the residual false positive is closed on
/// evidence the stream already carries.
///
/// A recovered `api_retry` 401, then MODEL TEXT, then a process that
/// dies without writing any `result` line. There is no terminal verdict
/// to clear the status, so T-029's rule cannot reach this turn and it
/// classified `AuthFailed` — removing Try again (`failureAction` returns
/// `retry: false` for `authFailed`) and sending a user whose login is
/// fine to `claude login`. That is the exact harm T-029 exists to undo,
/// surviving in the one family its rule cannot see.
///
/// The discriminator is the delta: text can only be streamed by a
/// request that SUCCEEDED, so text after the last status-bearing
/// diagnostic is the stream's own evidence that the CLI got past the
/// error. No `terminal_reason` vocabulary is consulted — T-029-s5's
/// objection does not reach this — and the 401 stays legible in the
/// tail, so nothing that was relayed before is lost.
#[test]
fn a_recovered_auth_retry_followed_by_model_text_and_no_result_line_is_not_an_auth_failure() {
    let h = harness(
        "retrynoresult",
        Options { scenario: "retry-401-then-no-result", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    let failed = wait_failed(&h.events);
    match &failed {
        TurnError::ExitNonZero { code, stderr_tail } => {
            assert_eq!(*code, Some(1));
            // Declined as a DIAGNOSIS, still delivered as a RELAY.
            assert!(
                stderr_tail.contains("401"),
                "the status the stream named is still legible: {stderr_tail:?}"
            );
        }
        other => panic!("expected ExitNonZero, got {other:?}"),
    }
    let status = settle(&h.agent);
    assert_settled_error_is(
        &status,
        &failed,
        "the CLI ANSWERED after that 401, so it is not what killed the turn and the \
         relayed `ExitNonZero` must settle whole rather than as `AuthFailed`",
    );
}

/// T-069: THE DISCRIMINATOR IS SCOPED TO THE LAST STATUS, and this is
/// the body that can tell. The CLI recovers one 401, streams its answer,
/// then hits a SECOND 401 it does not recover from and dies with no
/// `result` line. The text sits BETWEEN the two, so it is evidence about
/// the first and says nothing about the second: this is a real
/// authentication failure and must stay typed, or T-069 would have
/// closed a false positive by opening a false negative on the same
/// family.
///
/// Its unique mutant is the flag's reset in the runner's `Diagnostic`
/// arm — the line that makes "after the LAST status-bearing diagnostic"
/// true rather than "after any status ever seen". Delete that line and
/// only this body reds.
#[test]
fn a_second_auth_retry_behind_the_recovered_one_is_still_an_auth_failure() {
    let h = harness(
        "secondretry",
        Options { scenario: "retry-401-text-then-401-no-result", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::AuthFailed { status, .. } => assert_eq!(status, Some(401)),
        other => panic!(
            "the text was evidence about the FIRST 401, not the second: {other:?}"
        ),
    }
    settle(&h.agent);
}

/// THE CONTROL for
/// `a_recovered_auth_retry_followed_by_model_text_and_no_result_line_is_not_an_auth_failure`
/// — the same emitter, one `bool` apart, so it is that stream minus
/// exactly the 401 line. Pre-fix the pair classified `AuthFailed` and
/// `ExitNonZero` respectively; post-fix both are `ExitNonZero`, which is
/// what the fix means.
///
/// Unlike T-029's control this one keeps a falsifying body of its own:
/// nothing in this stream ever reaches the diagnostic ring, so flipping
/// the fixture's `with_retry` back on reds it here rather than passing
/// unnoticed. That is the assertion doing the discriminating — the 401
/// row asserts the tail NAMES the status, this one asserts there is no
/// status to name.
#[test]
fn the_same_no_result_stream_without_the_retry_line_has_nothing_to_relay() {
    let h = harness(
        "noresultctl",
        Options { scenario: "no-result-no-retry", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::ExitNonZero { code, stderr_tail } => {
            assert_eq!(code, Some(1));
            assert!(
                stderr_tail.trim().is_empty(),
                "this stream carries no diagnostic at all, so the ring stays empty \
                 and the 401 in the row above can only have come from that one line: \
                 {stderr_tail:?}"
            );
        }
        other => panic!("expected ExitNonZero, got {other:?}"),
    }
    settle(&h.agent);
}

// ---- T-102: THE DISCRIMINATOR READS THE EVIDENCE THAT CANNOT BE FORGED
//      ----------------------------------------------------------------
//
// T-069's closure above rests on an argument about MODEL RESPONSES —
// they are "streamed by a request that SUCCEEDED" — but it was
// implemented against ONE of the two content-block types a model
// response arrives in. `classify_line` turns a `text_delta` into
// `StreamLine::TextDelta` and a `tool_use` into `StreamLine::Activity`;
// only the first arm set the flag.
//
// And the arm that was missing carries the STRONGER evidence. The honest
// limit T-069 states is that the CLI writes its own prose into the
// nominally-model text field, so a delta can be the CLI rather than the
// model. A `tool_use` block naming a tool is not prose and the CLI has no
// reason to fabricate one. The discriminator read the evidence that CAN
// be forged and ignored the evidence that cannot.

/// **T-102's RULING, BUILT: the same closure on the block type T-069
/// could not see.**
///
/// A recovered `api_retry` 401, then a `tool_use` block — and no
/// `result` line at all. Against the shipped tip this measured
/// `AuthFailed { status: Some(401), message: "the agent CLI could not
/// authenticate" }`, which removes Try again (`failureAction` returns
/// `retry: false` for `authFailed`) and prints `claude login` at a user
/// whose login is fine.
///
/// **THE FAMILY IS AN ORDINARY OPENING, NOT AN EXOTIC ONE**, which is
/// what made the narrowing worth closing rather than disclosing: a
/// planner that reads the repo before it speaks calls a tool with no
/// delta in front of it, so EVERY turn that recovered a 401 and then
/// called a tool without saying anything first fell in it.
///
/// **THIS IS THE DELTA ROW MINUS EXACTLY ONE LINE**, by construction
/// rather than by two fixtures agreeing to stay in step: `no_result_after`
/// emits both, and the `Evidence` axis is the only thing that differs.
/// So a runner that classifies these two differently is discriminating on
/// the BLOCK TYPE and on nothing else, which is precisely the defect.
///
/// SHAPE SIX, asked and answered. Its unique mutant is the flag set in
/// the runner's `Activity` arm: delete those two lines and ONLY this body
/// reds — the delta rows above set the flag from `TextDelta` and never
/// touch `Activity`, and `denied-then-completed` and its siblings drive
/// `Activity` on turns that name no auth status at all, so the guard
/// they exercise is not this one.
#[test]
fn a_recovered_auth_retry_followed_by_a_tool_call_and_no_result_line_is_not_an_auth_failure() {
    let h = harness(
        "retrytooluse",
        Options { scenario: "retry-401-then-tool-use-no-result", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    let seen = collect_turn(&h.events);

    // THE EVIDENCE ITSELF, ASSERTED BEFORE THE CLASSIFICATION IT
    // JUSTIFIES. Without this the body cannot tell "the tool call was
    // read as evidence" from "the tool call never arrived and something
    // else withdrew the claim".
    assert!(
        seen.iter().any(|e| matches!(e, RunEvent::Activity { label, .. } if label == "Read")),
        "the `tool_use` block must actually have reached the runner as an Activity, \
         or this turn's classification is not evidence about tool calls at all: \
         {seen:#?}"
    );
    assert!(
        !seen.iter().any(|e| matches!(e, RunEvent::TextDelta { .. })),
        "…and NO delta rode with it: a delta here would let T-069's original arm \
         withdraw the claim and this body would pass without the widening: {seen:#?}"
    );

    let failed = terminal_error(&seen);
    match &failed {
        TurnError::ExitNonZero { code, stderr_tail } => {
            assert_eq!(*code, Some(1));
            // Declined as a DIAGNOSIS, still delivered as a RELAY — the
            // same trade the delta row records.
            assert!(
                stderr_tail.contains("401"),
                "the status the stream named is still legible: {stderr_tail:?}"
            );
        }
        other => panic!(
            "the CLI called a tool after that 401, which only a request that SUCCEEDED \
             can stream, so this is not an authentication failure: {other:?}"
        ),
    }
    let status = settle(&h.agent);
    assert_settled_error_is(
        &status,
        &failed,
        "a tool call after the 401 is the stream's own evidence the CLI got past it, \
         so this settles as the relayed `ExitNonZero` rather than as `AuthFailed`",
    );
}

/// THE CONTROL for the row above — the same emitter, one `bool` apart, so
/// it is that stream minus exactly the 401 line.
///
/// A turn that dies with no `result` line is an `ExitNonZero` whether or
/// not anything ever authenticated, so without this row "not
/// `AuthFailed`" above is satisfied equally by a runner that read the
/// tool call as evidence and by one that never classified this shape at
/// all. The discriminating assertion is the tail: the 401 row asserts the
/// status is legible in it, this one asserts there is no status to name,
/// so flipping the fixture's `with_retry` back on reds here rather than
/// passing unnoticed.
#[test]
fn the_same_tool_use_stream_without_the_retry_line_has_nothing_to_relay() {
    let h = harness(
        "toolusectl",
        Options { scenario: "tool-use-no-result-no-retry", ..Options::default() },
    );
    agent::start_genesis(&h.watch, &h.agent);
    match wait_failed(&h.events) {
        TurnError::ExitNonZero { code, stderr_tail } => {
            assert_eq!(code, Some(1));
            assert!(
                stderr_tail.trim().is_empty(),
                "this stream carries no diagnostic at all, so the ring stays empty and \
                 the 401 in the row above can only have come from that one line: \
                 {stderr_tail:?}"
            );
        }
        other => panic!("expected ExitNonZero, got {other:?}"),
    }
    settle(&h.agent);
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
    let deadline = Instant::now() + FIXTURE_DEADLINE;
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

    // **THE RELATIVE ELEMENT MUST RESOLVE TO A REAL FILE**, or arm one
    // asserts nothing. A poison drill proved that: with `which_in`
    // reverted to its pre-T-060 `is_executable_file` check, an earlier
    // version of this body stayed GREEN, because `relbin/claude` did not
    // exist relative to the test's CWD and the old check refused it for
    // the wrong reason. So the tattling binary is ALSO planted under the
    // test's own working directory, where a relative lookup finds it.
    //
    // cargo runs test binaries with cwd = the package root, and `target/`
    // is inside it and gitignored. Asserted, not assumed.
    let cwd = std::env::current_dir().expect("cwd");
    assert_eq!(
        cwd.file_name().and_then(|n| n.to_str()),
        Some("src-tauri"),
        "cargo no longer runs tests from the package root - the relative fixture below \
         would not resolve and this test would pass for the wrong reason"
    );
    let rel_dir = format!("target/nputer-t060-relbin-{}-{}", std::process::id(), now_ms());
    plant_binary(&cwd.join(&rel_dir).join("claude"));
    assert!(
        Path::new(&format!("{rel_dir}/claude")).is_file(),
        "the relative fixture must be reachable through a relative path"
    );

    // ARM ONE: the relative element. Refused, and nothing executed.
    for hostile in [rel_dir.as_str(), ".", "", "relbin:.", ".:relbin"] {
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

    let _ = fs::remove_dir_all(cwd.join(&rel_dir));
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

/// **THE GUARD IS ON IN THIS TEST BINARY (T-060 criterion 6).**
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
///
/// **AND NOTHING IN THIS BINARY CAN RACE IT (T-060-s3).** This body used
/// to red 15 times in 15 at `--test-threads=8` and 9 in 15 at 4 —
/// `ubuntu-24.04`'s vCPU count, and `ci.yml` runs a bare `cargo test` —
/// because the guard's own proof test lifted `NPUTER_NO_REAL_CLI`
/// process-wide for the width of one resolve, and this assertion landed
/// in the window. That lift now happens in a CHILD PROCESS. A tripwire
/// that reds on CI is one an integrator learns to re-run until green,
/// which is exactly the channel a real guard failure would arrive
/// through, so a flake HERE is worse than a flake anywhere else.
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

/// The child-arm marker. **Absent means this process is the PARENT** and
/// drives the two arms below; present means this process IS one arm,
/// re-invoked by the parent with an environment the parent composed.
const T060_ARM_VAR: &str = "NPUTER_T060_ARM";
/// Where the parent put the fixtures, handed to each child.
const T060_ROOT_VAR: &str = "NPUTER_T060_ROOT";
/// The `--exact` filter the parent re-invokes itself with. It is the name
/// of the test below; a filter that matches NOTHING exits 0 with
/// "0 passed", so `t060_run_arm` refuses to accept a run it cannot see.
const T060_TEST_NAME: &str =
    "the_configuration_that_reached_the_real_cli_now_resolves_to_typed_not_found";

/// **THE GUARD PROVEN BY THE ATTACK THAT FOUND IT (T-060 criterion 7,
/// T-047-s6) — IN CHILD PROCESSES, WHICH IS T-060-s3's FIX.**
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
/// **WHY THIS BODY SPAWNS ITSELF.** The discriminating half has to run
/// with the guard LIFTED, and the first version lifted it by setting
/// `NPUTER_NO_REAL_CLI` in THIS process. libtest runs these bodies on
/// threads of one process, so the window was visible to every sibling:
/// `the_no_real_cli_guard_is_on_without_anything_being_set` — the tripwire
/// whose entire job is "nothing has to be set" — read the lift and went
/// red. Measured before the fix: **15/15 at `--test-threads=8`, 9/15 at
/// 4**, and 4 is the vCPU count of the `ubuntu-24.04` runner `ci.yml`
/// runs a bare `cargo test` on (T-060-s3). A tripwire that reds on CI is
/// one an integrator learns to re-run until green, which is exactly the
/// channel a REAL guard failure would arrive through.
///
/// So each arm is a CHILD PROCESS: this same test binary, re-invoked with
/// `--exact` on this test's own name, with the guard, `$SHELL` and `PATH`
/// composed by the parent. **Nothing process-global is mutated here** —
/// the parent asserts as much about its own environment at the end — so
/// there is no window for any sibling to observe, at any thread count.
///
/// It also buys a property the in-process version could not have: each
/// child's `PATH` is an EMPTY DIRECTORY. The lifted arm therefore cannot
/// reach the developer's real `claude` even if every fixture in it were
/// broken, which is how T-060-s1's accident happened. That accident is
/// now structurally unreachable rather than argued away.
///
/// A guard nobody has watched refuse is a guard nobody has watched.
#[test]
fn the_configuration_that_reached_the_real_cli_now_resolves_to_typed_not_found() {
    match std::env::var(T060_ARM_VAR).ok().as_deref() {
        None => t060_parent_drives_both_arms(),
        Some("guarded") => t060_child_guarded_arm(),
        Some("lifted") => t060_child_lifted_arm(),
        Some(other) => panic!("unknown {T060_ARM_VAR} value {other:?} - the parent sets this"),
    }
}

/// Re-invoke THIS test binary, running only the test above, with an
/// environment this process composes rather than mutates.
fn t060_run_arm(arm: &str, root: &Path, shell: &Path, guard: Option<&str>) -> String {
    let exe = std::env::current_exe().expect("current_exe");
    let mut command = std::process::Command::new(exe);
    command
        .arg(T060_TEST_NAME)
        .args(["--exact", "--test-threads=1", "--nocapture"])
        .env(T060_ARM_VAR, arm)
        .env(T060_ROOT_VAR, root)
        .env("SHELL", shell)
        // THE EMPTY SEARCH PATH. `which_on_path` reads the process's own
        // `PATH`; a directory with nothing in it means no arm of this test
        // can reach a real binary, guard or no guard.
        .env("PATH", root.join("nopath"));
    match guard {
        Some(value) => command.env(nputer_lib::agent::runner::NO_REAL_CLI_VAR, value),
        None => command.env_remove(nputer_lib::agent::runner::NO_REAL_CLI_VAR),
    };
    let out = command.output().expect("re-invoke this test binary");
    let text = format!(
        "{}{}",
        String::from_utf8_lossy(&out.stdout),
        String::from_utf8_lossy(&out.stderr)
    );
    assert!(out.status.success(), "the `{arm}` arm FAILED in its own process:\n{text}");
    // …and it RAN. An `--exact` filter that matches nothing exits 0 with
    // "0 passed", which would make every assertion about this arm vacuous
    // — including the negative ones, which is the dangerous direction.
    assert!(
        text.contains("1 passed"),
        "the `{arm}` arm did not run - has {T060_TEST_NAME} been renamed?:\n{text}"
    );
    text
}

fn t060_child_root() -> PathBuf {
    PathBuf::from(std::env::var(T060_ROOT_VAR).expect("the parent sets the fixture root"))
}

fn t060_parent_drives_both_arms() {
    use std::os::unix::fs::PermissionsExt;

    let root = std::env::temp_dir().join(format!(
        "nputer-t060-accident-{}-{}",
        std::process::id(),
        now_ms()
    ));
    let project = root.join("project");
    fs::create_dir_all(&project).expect("mk project");
    fs::create_dir_all(root.join("nopath")).expect("mk the empty search path");
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
    let fail_shell = root.join("fail/zsh");
    fs::create_dir_all(root.join("fail")).expect("mk fail");
    fs::write(
        &fail_shell,
        format!(
            "#!/bin/sh\necho ran > {}\necho NPUTER_LOGIN_PATH=/nputer-t060/bin\nexit 1\n",
            tattle.display()
        ),
    )
    .expect("write shell");
    fs::set_permissions(&fail_shell, fs::Permissions::from_mode(0o755)).expect("chmod");

    // The shell for the discriminating half, whose `command -v` NAMES the
    // planted fixture — see T-060-s1: the first version of that arm left
    // `command -v` failing, so a lifted resolve fell through to
    // `which_on_path`, read the developer's own `PATH` and executed their
    // real `claude`. Both halves of the fix are here now: this shell, and
    // the empty `PATH` every arm runs on.
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

    // **PRE-FLIGHT, AND IT IS LOAD-BEARING RATHER THAN DECORATIVE.**
    // Both children resolve with `probe_login_shell: true`, so if the
    // guard is broken this body is a way to reach the developer's machine
    // — which is how T-060-s1 was found. Asserting the guard BEFORE the
    // first spawn makes a broken guard fail here, harmlessly. Each child
    // asserts its own expected guard state again on the far side of the
    // fork, because that is the process the resolve actually runs in.
    assert!(
        nputer_lib::agent::runner::real_cli_arms_forbidden(),
        "the guard is already off before this test does anything - refusing to resolve"
    );
    let shell_before = std::env::var("SHELL").ok();

    // ---- ARM ONE: the accident, refused -----------------------------
    //
    // The guard variable is REMOVED for this child, so what refuses is the
    // DERIVED default — the property the card claims — and not an explicit
    // `1` this test handed itself.
    t060_run_arm("guarded", &root, &fail_shell, None);
    assert!(
        root.join("guarded-ran.txt").exists(),
        "the guarded arm's evidence is a NEGATIVE (no tattle), so it has to prove it ran"
    );
    // The whole point, measured: no shell was spawned, at either door.
    assert!(
        !tattle.exists(),
        "THE LOGIN SHELL RAN - the guard fires after the spawn, not before"
    );
    assert!(!sessions::sessions_path(&project).exists(), "a session was registered");

    // ---- ARM TWO: THE DISCRIMINATING HALF ----------------------------
    //
    // Without it, "not found" could just mean the fixture was broken. So
    // the guard is lifted — by the environment this child is BORN with,
    // never by a mutation — and the same configuration must reach the same
    // shell and the same planted binary.
    t060_run_arm("lifted", &root, &ok_shell, Some("0"));
    assert!(
        lifted_tattle.exists(),
        "with the guard lifted the shell must run - otherwise the refusal above was \
         not the guard's doing"
    );
    assert!(binary_tattle.exists(), "…and it is that fixture binary the version probe ran");
    let recorded = fs::read_to_string(root.join("resolved.txt"))
        .expect("the lifted arm records what it resolved");
    let want = root.join("bin/claude").display().to_string();
    let mut lines = recorded.lines();
    assert_eq!(
        lines.next(),
        Some(want.as_str()),
        "the lifted resolve must land on the FIXTURE and never on the machine"
    );
    assert_eq!(lines.next(), Some("/nputer-t060/bin"));

    // **AND NOTHING GLOBAL MOVED.** This is T-060-s3 itself, asserted:
    // the guard variable is still unset in this process and `$SHELL` is
    // whatever it was, so no sibling body can observe this test at any
    // thread count. The tripwire above is what would notice if it did.
    assert_eq!(
        std::env::var(nputer_lib::agent::runner::NO_REAL_CLI_VAR).ok(),
        None,
        "this body must leave the guard variable UNSET - a lift window in a threaded \
         test binary is what T-060-s3 was"
    );
    assert_eq!(std::env::var("SHELL").ok(), shell_before, "…and $SHELL untouched too");
    assert!(
        nputer_lib::agent::runner::real_cli_arms_forbidden(),
        "the guard must be on for every test that runs after this one"
    );
    let _ = fs::remove_dir_all(&root);
}

/// ARM ONE, in its own process: the accidental configuration, refused by
/// the DERIVED guard, at the resolver door and at the app door.
fn t060_child_guarded_arm() {
    let root = t060_child_root();
    let project = root.join("project");
    let tattle = root.join("shell-ran.txt");

    assert!(
        nputer_lib::agent::runner::real_cli_arms_forbidden(),
        "the guard is already off before this arm does anything - refusing to resolve"
    );
    assert_eq!(
        std::env::var(nputer_lib::agent::runner::NO_REAL_CLI_VAR).ok(),
        None,
        "this arm must run on the DERIVED default - an explicit value would prove less"
    );
    assert_eq!(
        std::env::var("SHELL").ok(),
        Some(root.join("fail/zsh").display().to_string()),
        "the parent's tattling fixture shell is the only $SHELL this arm may see"
    );

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

    // THE RECEIPT. Everything this arm proves is an ABSENCE, and a child
    // that never ran leaves every absence intact. The parent asserts this
    // file exists before it believes any of it.
    fs::write(root.join("guarded-ran.txt"), "the guarded arm ran to the end").expect("receipt");
}

/// ARM TWO, in its own process: the same configuration with the guard
/// lifted by the environment this process was BORN with. Nothing here
/// mutates anything — and the search path is empty, so the only binary
/// this arm can possibly reach is the parent's planted fixture.
fn t060_child_lifted_arm() {
    let root = t060_child_root();
    assert_eq!(
        std::env::var(nputer_lib::agent::runner::NO_REAL_CLI_VAR).ok().as_deref(),
        Some("0"),
        "the parent lifts the guard by BIRTH, not by set_var"
    );
    assert!(
        !nputer_lib::agent::runner::real_cli_arms_forbidden(),
        "this arm exists to run with the guard OFF - and it is the variable that lifts it"
    );
    // With the guard off, the one thing that MUST hold is that the machine
    // is out of reach.
    let search_path = std::env::var("PATH").expect("PATH");
    assert_eq!(
        search_path,
        root.join("nopath").display().to_string(),
        "a guard-off arm may only run on the parent's empty search path"
    );
    assert_eq!(
        fs::read_dir(&search_path).expect("read the search path").count(),
        0,
        "…and it must really be empty, or this arm could reach a real binary"
    );

    let cfg = RunnerConfig {
        extra_env: vec![(
            "NPUTER_FAKE_TATTLE".to_string(),
            root.join("binary-ran.txt").display().to_string(),
        )],
        ..RunnerConfig::default()
    };
    let resolved = nputer_lib::agent::runner::resolve_cli(&cfg, adapter::planner_adapter())
        .expect("the fixture shell names a real, absolute, correctly named file");
    fs::write(
        root.join("resolved.txt"),
        format!(
            "{}\n{}\n",
            resolved.path.display(),
            resolved.login_path.as_deref().unwrap_or("<none>")
        ),
    )
    .expect("record what was resolved");
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
        // T-153-s2: THIS NUMBER WAS 200,000 AND THAT MADE THE BODY A
        // MACOS-ONLY TEST. The `model` reaches the fake CLI as the
        // `NPUTER_FAKE_MODEL` environment pair, and `execve` bounds each
        // string it copies — envp strings exactly as much as argv ones.
        // Linux's per-element cap is `MAX_ARG_STRLEN`, the kernel's
        // `PAGE_SIZE * 32`, so 131,072 bytes on a 4 KiB-page x86-64 and
        // INDEPENDENT of the much larger total `ARG_MAX`; 200,000 is over
        // it by construction, so the spawn could not succeed and the turn
        // died as `SpawnFailed` three layers from the cause. macOS has no
        // cap of that shape — measured at this task's ref on Darwin
        // 25.6.0 arm64, a single 1,040,000-byte env pair `exec`s cleanly
        // and the first failure is at 1,048,000, i.e. against `getconf
        // ARG_MAX` = 1,048,576, a TOTAL — which is why every local run
        // this repository ever made was green and CI was not.
        //
        // 50,000 is chosen against the THREE bounds this line sits
        // between, and it is the only band where the body means what its
        // name says. It must be over `adapter::MODEL_MAX_LEN` (128), or
        // the model is legal and nothing is refused. It must be under
        // `adapter::SPAWN_ELEMENT_MAX_LEN`, or the runner drops the pair
        // before the child sees it and the fake reports its own default
        // `fake-model-1` instead — a legal name that round-trips, which
        // `registry model` below would catch. And being under that bound
        // puts it under every platform's `execve` cap with room to spare,
        // which is what makes THIS the assertion that runs identically on
        // both. The refusal now comes from the product's own bound rather
        // than from a kernel, and that is the whole repair.
        ("oversize", "M".repeat(50_000)),
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

/// **T-153-s2, CRITERION: NOTHING THE RUNNER HANDS `execve` IS
/// UNBOUNDED, AND CROSSING THE BOUND COSTS THE VALUE RATHER THAN THE
/// TURN.**
///
/// The failure this body pins was found by CI and could not be found
/// locally: `execve` bounds every string it copies, argv and envp alike,
/// and Linux's per-element cap (`MAX_ARG_STRLEN`, the kernel's `PAGE_SIZE
/// * 32`) is independent of the far larger total `ARG_MAX`, while macOS
/// bounds only the total. One oversized pair therefore killed the WHOLE
/// spawn on one platform — `SpawnFailed { os: "Argument list too long" }`,
/// a turn that never started — and did nothing at all on the other.
///
/// **THE TWO ARMS ARE ONE BYTE APART AND THE FIRST ONE IS THE POSITIVE
/// CONTROL.** A body that only proved the oversized pair is missing would
/// pass just as happily if the pair never arrived for some unrelated
/// reason, or if the harness had stopped placing it at all: a refusal
/// that cannot be told from an absence is not evidence of a refusal. So
/// the widest pair that still FITS is asserted PRESENT, at its exact
/// byte length, through the child's own environment dump — and the same
/// value one byte wider is asserted ABSENT there, with everything else
/// about the turn unchanged.
///
/// The second half of each arm reads the registry, which is where the two
/// bounds are visibly different rules: the fitting value is placed and
/// then refused as a MODEL by [`adapter::MODEL_MAX_LEN`], so nothing is
/// recorded; the oversized one never reaches the child at all, so the
/// fake reports its own default and that default round-trips. Two
/// mechanisms, two different observable outcomes, neither of them
/// "nothing happened".
#[test]
fn an_env_pair_past_the_execve_element_bound_is_dropped_and_the_turn_stands() {
    // The harness places the model as this key.
    const KEY: &str = "NPUTER_FAKE_MODEL";
    // `execve` copies ONE string per pair — `KEY=VALUE` and its NUL — so
    // the widest value that still fits is the bound less the key, the
    // `=` and the terminator. The arithmetic belongs to
    // `adapter::child_env_pair_fits` and is spelled once here only to
    // name the boundary the two arms straddle; the assertions below
    // check the OUTCOME either side of it, not the sum.
    let widest = adapter::SPAWN_ELEMENT_MAX_LEN - KEY.len() - "=".len() - 1;

    // ---- THE POSITIVE CONTROL: the widest pair that fits is PLACED ----
    let h = harness(
        "env-at-bound",
        Options { model: Some("M".repeat(widest)), ..Options::default() },
    );
    assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Started { .. }));
    wait_completed(&h.events);
    settle(&h.agent);

    let env = read_env(&h.dump, 1);
    assert_eq!(
        env.get(KEY).map(String::len),
        Some(widest),
        "the widest pair that fits must reach the child WHOLE - if this is None the bound is \
         off by one in the refusing direction, and if it is a smaller number the value was \
         truncated, which this runner never does"
    );
    // And it is still refused one bound further in, by the model gate:
    // fitting into `execve` was never a claim about being a model name.
    assert_eq!(
        sessions::load(&h.project).sessions[0].model,
        None,
        "a {widest}-byte model is past MODEL_MAX_LEN and must not be recorded"
    );

    // ---- ONE BYTE WIDER: the pair is DROPPED, the turn still STANDS ----
    let h = harness(
        "env-over-bound",
        Options { model: Some("M".repeat(widest + 1)), ..Options::default() },
    );
    assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Started { .. }));
    // THE REGRESSION ITSELF: before the bound this line was the failure.
    // The spawn was refused whole, the turn came back `Failed`, and
    // `wait_completed` timed out three layers from the cause.
    wait_completed(&h.events);
    settle(&h.agent);

    let env = read_env(&h.dump, 1);
    assert!(
        !env.contains_key(KEY),
        "an oversized pair must not be handed to execve at all; the child saw {:?}",
        env.get(KEY).map(String::len)
    );
    // The child ran with the variable UNSET rather than with a shortened
    // one — the fake's own fallback is the discriminator, and it is a
    // legal name, so it round-trips.
    assert_eq!(
        sessions::load(&h.project).sessions[0].model.as_deref(),
        Some("fake-model-1"),
        "the fake should have fallen back to its default, which proves the pair was refused \
         whole rather than coerced into something acceptable"
    );
}

/// **T-153-s2, THE VERDICT'S ASSIGNED CORRECTION (performed by the
/// integrator at merge): the bound proven on channels PRODUCTION
/// actually walks.** The sibling above drives `NPUTER_FAKE_MODEL`,
/// which travels through `RunnerConfig.extra_env` — a documented test
/// seam whose only production construction is an empty Vec. The
/// verifier's mutants M5 and M6 (the allowlist loop and the PATH chain
/// each handed straight to `command.env`, bypassing `set_child_env`)
/// left the whole suite green: the guard's two production arms were
/// killed by nothing in the tree. This body is the kill, and its
/// acceptance was mechanical — with it in place, both mutants red.
///
/// Same discipline as the sibling: every refusal carries a positive
/// control one byte (or one placement) away, because a refusal that
/// cannot be told from an absence is not evidence of a refusal.
#[test]
fn an_oversized_path_or_allowlist_pair_meets_the_bound_on_the_production_channels() {
    // `PATH=` + value + NUL is the one string execve copies for the
    // pair; the arithmetic itself belongs to
    // `adapter::child_env_pair_fits`, and is spelled here only to name
    // the boundary the arms straddle.
    let widest = adapter::SPAWN_ELEMENT_MAX_LEN - "PATH".len() - "=".len() - 1;

    // ---- THE PATH CHAIN, positive control: the widest PATH that fits
    // arrives WHOLE, through `path_override` — the FIRST branch of
    // `apply_child_env`'s PATH chain and a real product field.
    let h = harness(
        "path-at-bound",
        Options { path_override: Some("P".repeat(widest)), ..Options::default() },
    );
    assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Started { .. }));
    wait_completed(&h.events);
    settle(&h.agent);
    let env = read_env(&h.dump, 1);
    assert_eq!(
        env.get("PATH").map(String::len),
        Some(widest),
        "the widest PATH that fits must reach the child WHOLE - None means the bound refuses \
         in the fitting direction, a smaller number means truncation, and this runner does \
         neither"
    );

    // ---- ONE BYTE WIDER: the pair is dropped whole and the turn
    // STANDS. A child with no PATH at all is the documented cost of the
    // drop (the spawn itself resolves through `binary_override`, an
    // absolute path); a turn that never starts was the regression.
    let h = harness(
        "path-over-bound",
        Options { path_override: Some("P".repeat(widest + 1)), ..Options::default() },
    );
    assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Started { .. }));
    wait_completed(&h.events);
    let status = settle(&h.agent);
    assert_eq!(
        status.native_session_id.as_deref(),
        Some("fake-session-0001"),
        "the turn must stand without its PATH - dropping the one pair is the bound's whole \
         contract, and failing the spawn over it was the E2BIG regression itself"
    );
    let env = read_env(&h.dump, 1);
    assert!(
        !env.contains_key("PATH"),
        "an oversized PATH must not be handed to execve at all; the child saw {:?} bytes",
        env.get("PATH").map(String::len)
    );

    // ---- THE ALLOWLIST LOOP: `HTTPS_PROXY` is a real `ENV_ALLOWLIST`
    // member read from THIS process's environment — the other
    // production arm. Planted small it rides; planted past the bound it
    // is dropped by the same one function. The plant is process-global
    // for a moment, and that is safe by construction: no body in this
    // suite asserts proxy keys, and while oversized the value is
    // dropped before any concurrent child could see it.
    std::env::set_var("HTTPS_PROXY", "https://proxy.invalid:8080");
    let h = harness("proxy-at-bound", Options::default());
    assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Started { .. }));
    wait_completed(&h.events);
    settle(&h.agent);
    let env = read_env(&h.dump, 1);
    assert_eq!(
        env.get("HTTPS_PROXY").map(String::as_str),
        Some("https://proxy.invalid:8080"),
        "the fitting allowlist pair is this arm's positive control and must ride"
    );

    std::env::set_var("HTTPS_PROXY", "H".repeat(adapter::SPAWN_ELEMENT_MAX_LEN));
    let h = harness("proxy-over-bound", Options::default());
    assert!(matches!(agent::start_genesis(&h.watch, &h.agent), StartOutcome::Started { .. }));
    wait_completed(&h.events);
    settle(&h.agent);
    std::env::remove_var("HTTPS_PROXY");
    let env = read_env(&h.dump, 1);
    assert!(
        !env.contains_key("HTTPS_PROXY"),
        "an allowlist value past the bound must be dropped by set_child_env, never handed to \
         execve; the child saw {:?} bytes",
        env.get("HTTPS_PROXY").map(String::len)
    );
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
    // T-025-s5: REAL CADENCE, not the fixtures'. A real stage-0 scaffold
    // runs minutes; every other stream this file has ever seen lands in
    // milliseconds. `REAL_CLI_DEADLINE` carries the derivation and the
    // 2026-08-30 run that this line exists because of.
    let event = wait_for_within(&events, REAL_CLI_DEADLINE, "completed or failed", |e| {
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
        // `..` rather than the exhaustive list T-070 would otherwise have
        // grown: `record` is asserted by
        // `the_hand_driven_kickoff_carries_what_was_banked`, whose FIRST
        // step is this same "nothing has run here yet" folder. Adding it
        // here too would be a body that reds under a poison while killing
        // no mutant another body does not (CONVENTIONS, shape six).
        agent::KickoffOutcome::Ready {
            prompt, project_dir, kit_root, method_version, resuming, ..
        } => {
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

/// T-070 CRITERION 1-2, AT THE COMMAND. The screen's arrival read is
/// bounded AT THE READ, and the proof is a fixture a whole-file read
/// cannot survive AT ALL.
///
/// THE MUTANT THIS EXISTS TO KILL is the one a fixture-bounded pin would
/// survive: an implementation that slurps the file and truncates
/// afterwards. It returns the same two hundred lines, so no assertion
/// about CONTENT can separate it from a tail read. So the fixture is
/// built so that reading from byte zero is not merely expensive but
/// IMPOSSIBLE: the first two mebibytes are bytes no UTF-8 decoder
/// accepts, `fs::read_to_string` fails on them, and `read_transcript`
/// answers with nothing. The bounded reader never seeks that far back,
/// so it never meets them.
///
/// It is the complement of `the_tail_read_costs_the_budget_and_not_the_file`
/// in `agent/sessions.rs`, and the pair is deliberate: a "read it all
/// LOSSILY, then truncate" implementation survives this body and dies on
/// the byte count there, while a mod.rs that goes back to the whole-file
/// reader survives nothing here. Neither body kills the other's mutant.
#[test]
fn the_arrival_read_is_bounded_by_the_budget_and_not_by_the_file() {
    const VALID_LINES: usize = 400;
    let h = harness("t070tailread", Options::default());
    let path = sessions::transcript_path(&h.project);
    fs::create_dir_all(path.parent().expect("parent")).expect("mk .nputer/genesis");

    // The HEAD: two mebibytes of undecodable bytes, laid out in
    // newline-terminated runs so the file is line-shaped throughout.
    let mut bytes: Vec<u8> = Vec::new();
    while bytes.len() < 2 * 1024 * 1024 {
        bytes.extend(std::iter::repeat(0xFFu8).take(4_095));
        bytes.push(b'\n');
    }
    let head_len = bytes.len();
    // The TAIL: real half-turns, each large enough that two hundred of
    // them are a fraction of the file rather than all of it.
    for turn in 1..=VALID_LINES {
        let line = serde_json::json!({
            "turn": turn,
            "role": if turn % 2 == 0 { "planner" } else { "user" },
            "text": format!("turn {turn} {}", "z".repeat(2_000)),
            "atMs": turn,
        });
        bytes.extend_from_slice(serde_json::to_string(&line).expect("encode").as_bytes());
        bytes.push(b'\n');
    }
    fs::write(&path, &bytes).expect("write the transcript");

    let file_len = fs::metadata(&path).expect("stat").len();
    assert!(
        file_len > 2 * 1024 * 1024,
        "the fixture must exceed the budget in BYTES by a wide margin: {file_len}"
    );
    assert!(
        VALID_LINES > agent::MAX_REHYDRATED_LINES,
        "…and in LINES, before the undecodable head is even counted"
    );

    // THE POSITIVE CONTROL FOR THE DISCRIMINATOR (CONVENTIONS' rule, one
    // level out): this fixture really does defeat a whole-file read.
    // Without this line, the assertion below would pass for an
    // implementation that reads everything and a fixture that happens to
    // be small, and the two would be indistinguishable.
    assert!(
        sessions::read_transcript(&h.project).is_empty(),
        "the whole-file reader cannot decode this file at all - that is the point"
    );

    // …and the arrival read answers the tail, in order, from the bytes
    // at the END of the file.
    let lines = agent::transcript(&h.watch);
    assert_eq!(lines.len(), agent::MAX_REHYDRATED_LINES, "the budget, exactly");
    assert_eq!(lines[0].turn, (VALID_LINES - agent::MAX_REHYDRATED_LINES + 1) as u32);
    assert_eq!(lines[agent::MAX_REHYDRATED_LINES - 1].turn, VALID_LINES as u32);
    assert!(lines[0].text.starts_with("turn 201 "), "{}", lines[0].text);
    // Nothing from the head leaked into the answer.
    assert!(
        lines.iter().all(|l| !l.text.contains('\u{fffd}')),
        "no undecodable byte reached the webview channel"
    );
    // The file is untouched: this read rotates, truncates and deletes
    // nothing, which is what keeps the losable-by-charter property.
    assert_eq!(fs::metadata(&path).expect("stat").len(), file_len);
    // …and the part it never touched is the MAJORITY of the file.
    assert!(head_len as u64 > file_len / 2, "head {head_len} of {file_len}");
}

/// T-070 CRITERION 3. The universal fallback answers the question the
/// CLI-gated commands cannot: WHAT WAS ALREADY BANKED HERE.
///
/// `genesis_kickoff` is the one genesis command that resolves no CLI, and
/// `sessions::genesis_record` reads `.nputer/sessions.json` with no CLI
/// anywhere in the call — so the record rides the outcome that is still
/// reachable when the user's CLI has been uninstalled or renamed.
#[test]
fn the_hand_driven_kickoff_carries_what_was_banked() {
    let h = harness("t070kickoffrecord", Options::default());

    // Before anything ran there is nothing to carry, and that is an
    // ANSWER rather than an omission.
    match agent::kickoff(&h.watch) {
        agent::KickoffOutcome::Ready { record, .. } => {
            assert!(record.is_none(), "nothing was ever running here: {record:?}")
        }
        other => panic!("expected Ready, got {other:?}"),
    }

    agent::start_genesis(&h.watch, &h.agent);
    wait_completed(&h.events);
    settle(&h.agent);

    // THE SAME FACT, FROM THE ONE PLACE IT LIVES. The record the kickoff
    // carries is `sessions::genesis_record`'s own answer — not a second
    // copy assembled here, which is what T-026-s3 forbids.
    let direct = sessions::genesis_record(&h.project).expect("the registry recorded a session");
    let carried = match agent::kickoff(&h.watch) {
        agent::KickoffOutcome::Ready { record, .. } => record.expect("the record rides Ready"),
        other => panic!("expected Ready, got {other:?}"),
    };
    assert_eq!(carried, direct);
    assert_eq!(carried.registry_id, "S1");
    assert_eq!(carried.turns, 1);
    assert_eq!(carried.native_session_id.as_deref(), Some("fake-session-0001"));

    // NO CLI WAS RESOLVED TO SAY IT. The kickoff spawns nothing — the
    // dump directory the fake writes into gained no second turn — and the
    // count came off disk, so a user with no CLI on their path still
    // learns their work was banked.
    assert!(!turn_dump(&h.dump, 2).exists(), "the record read spawns no child");

    // Losable by charter, held: delete the one file and the outcome is
    // still Ready, now carrying nothing.
    fs::remove_file(sessions::sessions_path(&h.project)).expect("delete the registry");
    match agent::kickoff(&h.watch) {
        agent::KickoffOutcome::Ready { record, prompt, .. } => {
            assert!(record.is_none(), "the fact went with the file: {record:?}");
            assert!(!prompt.is_empty(), "and the hand-driven prompt is unaffected");
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
