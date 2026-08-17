//! T-025 (C-14): the agent runner — the app spawns the USER'S OWN agent
//! CLI headless, hands it the method kit, and renders what it writes.
//!
//! ADR-017: the spawned planner is the writer of `docs/`; the app writes
//! only `.nputer/` runtime files and remains a lens. ADR-003: spawn and
//! resume, never API calls, never keys. ADR-012: the surface lives
//! Rust-side behind app-defined commands and the webview grant set stays
//! exactly `core:default` — `std::process` is not a plugin, so there is
//! nothing to grant.
//!
//! EIGHT commands since T-029, seven of them zero-argument:
//! `genesis_start` · `genesis_send_turn(text)` · `genesis_status` ·
//! `genesis_cancel` · `genesis_resume` · `genesis_fresh` ·
//! `genesis_transcript` · `genesis_kickoff`. The user's typed answer is
//! STILL the ONLY webview-supplied datum anywhere in this module, and it
//! travels as data on the child's stdin — never interpolated into a
//! command line, never in argv. T-029's four additions take no arguments
//! at all: the session id they resume from is read Rust-side out of
//! `.nputer/sessions.json` through its own gate, so no id crosses the
//! boundary in either direction.
//!
//! Module layout follows the `index_cmd` seam precedent: everything the
//! Tauri commands do lives in `pub fn`s minus the Tauri runtime, so cargo
//! tests drive it directly and the `#[tauri::command]` wrappers in lib.rs
//! stay thin.

pub mod adapter;
pub mod kit;
pub mod runner;
pub mod sessions;

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};

use serde::Serialize;

use crate::docs_watch::{probe_plan, WatchState};
use adapter::planner_adapter;
use runner::{
    now_ms, ChildHandle, Emitter, ResolveError, ResolvedCli, RunEvent, RunnerConfig, TurnError,
    TurnRequest,
};
use sessions::{SessionEntry, TranscriptLine};

/// The one webview event channel (§4).
pub const GENESIS_EVENT: &str = "genesis-turn";

// ---- typed outcomes (PickOutcome discipline) ---------------------------

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum StartOutcome {
    /// Turn 1's child is spawned. Completion arrives as events.
    Started { turn: u32 },
    /// A turn is already in flight (single-flight claim, T-021's pattern).
    Busy,
    /// No project is open — nothing to interview about.
    NoProject,
    /// The folder already holds a plan, so genesis is never offered for
    /// it (T-026's predicate, re-checked Rust-side: defense in depth
    /// against an out-of-order webview call).
    AlreadyPlanned { path: String },
    /// The registry already remembers a planner session here. Start does
    /// NOT auto-resume; T-029 renders the choice and `resume_genesis`
    /// takes it. `model` comes through [`SessionEntry::model_for_display`]
    /// — the read boundary, never the raw field (T-047-s3).
    ResumeAvailable { native_session_id: String, turns: u64, model: Option<String> },
    /// The agent CLI could not be found. Never a dead end — T-029 renders
    /// the hand-driven fallback from exactly this.
    CliNotFound { probed: Vec<String> },
    /// Found, but too old to trust the flag semantics against.
    UnsupportedVersion { found: String },
    /// T-029 (T-039-s3): the recorded session id is UNUSABLE. It used to
    /// ride `Error { message }` beside "the registry could not be
    /// written", and a webview could not tell the two apart without
    /// reading English — though only one of them has an affordance
    /// ("start fresh"). The refusal string is unchanged and already
    /// escaped; only the envelope is new.
    SessionIdRejected { registry_path: String, why: String },
    /// T-029: asked to resume, and there is nothing recorded to resume
    /// from. A race (the registry moved under the offer), not an error.
    NothingToResume,
    Error { message: String },
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum SendOutcome {
    Accepted { turn: u32 },
    Busy,
    /// No genesis session is running in this app process.
    NoSession,
    /// The open project changed under the session (the user picked a
    /// different folder mid-interview). The runner never auto-kills on a
    /// project switch; `genesis_cancel` stays available.
    StaleProject { session_project: String },
    CliNotFound { probed: Vec<String> },
    Error { message: String },
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum CancelOutcome {
    /// The turn's process group was signalled. The NATIVE session stays
    /// resume-eligible: the kill is of the turn, not the conversation.
    Cancelled { turn: u32 },
    Idle,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Phase {
    Idle,
    Running,
    Failed,
}

/// The mount-time catch-up pull (the `docs_snapshot` precedent): a late
/// pane learns where the interview is without replaying events.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenesisStatus {
    pub phase: Phase,
    pub project_dir: Option<String>,
    pub turn: u32,
    pub native_session_id: Option<String>,
    pub cli_version: Option<String>,
    /// The compiled-in snapshot's version — what a genesis started now
    /// would run.
    pub method_version: String,
    pub last_error: Option<TurnError>,
    pub last_event_at_ms: Option<u64>,
}

// ---- managed state ------------------------------------------------------

#[derive(Default)]
struct Inner {
    phase: Phase,
    project_dir: Option<PathBuf>,
    turn: u32,
    native_session_id: Option<String>,
    model: Option<String>,
    cli_version: Option<String>,
    registry_id: Option<String>,
    last_error: Option<TurnError>,
    last_event_at_ms: Option<u64>,
}

impl Default for Phase {
    fn default() -> Self {
        Phase::Idle
    }
}

/// Exclusive claim on the runner (§5's single-flight — T-021's
/// `PickInFlight` pattern). Holding the value IS the claim; its Drop
/// releases the latch on every path, panic included.
pub struct TurnInFlight(Arc<AtomicBool>);

impl Drop for TurnInFlight {
    fn drop(&mut self) {
        self.0.store(false, Ordering::SeqCst);
    }
}

/// Everything the four commands share. Managed by Tauri in production;
/// constructed directly by tests.
pub struct AgentState {
    cfg: RunnerConfig,
    inner: Arc<Mutex<Inner>>,
    running: Arc<AtomicBool>,
    child: Arc<Mutex<Option<ChildHandle>>>,
    /// Set to true by cancel/exit so the relay loop stops promptly.
    cancel: Arc<AtomicBool>,
    emitter: Emitter,
}

impl AgentState {
    /// `sink` receives every `genesis-turn` payload (production: the
    /// Tauri event; tests: a channel).
    pub fn new(cfg: RunnerConfig, sink: impl Fn(RunEvent) + Send + Sync + 'static) -> Self {
        let inner: Arc<Mutex<Inner>> = Arc::new(Mutex::new(Inner::default()));
        let stamped = inner.clone();
        // Every emitted event stamps `lastEventAtMs`, which is what T-027
        // renders elapsed time from — dead air is measurable, not guessed.
        let wrapped: Arc<dyn Fn(RunEvent) + Send + Sync> = Arc::new(move |event: RunEvent| {
            if let Ok(mut guard) = stamped.lock() {
                guard.last_event_at_ms = Some(now_ms());
            }
            sink(event);
        });
        Self {
            cfg,
            inner,
            running: Arc::new(AtomicBool::new(false)),
            child: Arc::new(Mutex::new(None)),
            cancel: Arc::new(AtomicBool::new(false)),
            emitter: Emitter::new(wrapped, Arc::new(AtomicU64::new(0))),
        }
    }

    fn begin_turn(&self) -> Option<TurnInFlight> {
        self.running
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .ok()
            .map(|_| TurnInFlight(self.running.clone()))
    }

    /// Kill the live child's process group and wait for it. Called from
    /// the `RunEvent::ExitRequested`/`Exit` hook and from `Drop` — the
    /// two paths that make "child processes SHALL not outlive the app"
    /// true for every exit the app controls.
    ///
    /// A SIGKILL of the app itself cannot run cleanup; that orphan is
    /// bounded to ONE turn by the spawn-per-turn topology (§1), and this
    /// is where that honesty is recorded rather than papered over.
    pub fn reap_for_exit(&self) {
        self.cancel.store(true, Ordering::SeqCst);
        let handle = *self.child.lock().expect("child slot poisoned");
        if let Some(handle) = handle {
            println!(
                "[nputer] agent: app exiting - terminating turn {} process group {}",
                handle.turn, handle.pid
            );
            runner::terminate_group(handle.pid, self.cfg.kill_grace);
        }
    }
}

impl Drop for AgentState {
    fn drop(&mut self) {
        self.reap_for_exit();
    }
}

// ---- the four command seams ---------------------------------------------

/// `genesis_start()` — zero-argument. The kickoff prompt is assembled
/// Rust-side from the bundled method snapshot plus the open project from
/// `WatchState`; the webview supplies nothing.
pub fn start_genesis(watch: &WatchState, agent: &AgentState) -> StartOutcome {
    let Some(flight) = agent.begin_turn() else {
        return StartOutcome::Busy;
    };
    let Some(project_dir) = watch.project_dir() else {
        return StartOutcome::NoProject;
    };

    // T-026's plan-eligibility predicate, re-checked here. The webview
    // could call this out of turn; the answer must not depend on the
    // screen the user is looking at.
    let probe = probe_plan(&project_dir);
    if probe.has_plan() {
        return StartOutcome::AlreadyPlanned { path: project_dir.display().to_string() };
    }

    // A recorded planner session for this project is a CHOICE, not an
    // auto-resume (T-029 renders it) — and the id it offers is read
    // through T-039's registry gate, never straight off the field. The
    // file is runtime state in the user's project dir; anything with disk
    // access can write it, and T-029 spawns from what it says.
    let registry = sessions::load(&project_dir);
    if let Some(existing) = sessions::find_planner(&registry) {
        match existing.resume_id() {
            Ok(Some(id)) => {
                return StartOutcome::ResumeAvailable {
                    native_session_id: id.to_string(),
                    turns: existing.turns,
                    // THE READ BOUNDARY, not the raw field (T-047-s3). A
                    // registry written by a pre-T-047 build can hold ~1 MiB
                    // of `model`; upgrading does not clean it.
                    model: existing.model_for_display(),
                }
            }
            // A planner entry with no id recorded: nothing to resume from,
            // so genesis proceeds as a fresh start.
            Ok(None) => {}
            // LOUD, never silent: refusing to resume is the safe half, but
            // starting a fresh interview while a poisoned entry sits on
            // disk would hide the fact that something wrote it.
            //
            // T-029 (T-039-s3): TYPED now. The webview routes this to
            // "your saved session is unusable — start fresh" rather than
            // to a generic error toast, which it could not do while this
            // shared an envelope with "the registry could not be written".
            Err(rejection) => {
                return StartOutcome::SessionIdRejected {
                    registry_path: sessions::SESSIONS_REL.to_string(),
                    why: format!(
                        "refusing to resume session '{}': {rejection}. \
                         That file is runtime state, losable by charter - starting fresh loses nothing about the project.",
                        // The entry's own id is file-borne data too: bounded
                        // and escaped, like everything else that came off disk.
                        sessions::truncate_utf8(&existing.id, 32).escape_debug(),
                    ),
                }
            }
        }
    }

    let adapter = planner_adapter();
    let cli = match runner::resolve_cli(&agent.cfg, adapter) {
        Ok(cli) => cli,
        Err(ResolveError::NotFound { probed }) => return StartOutcome::CliNotFound { probed },
        Err(ResolveError::Unsupported { found }) => {
            return StartOutcome::UnsupportedVersion { found }
        }
    };

    // The kit lands INSIDE the project, so reading it rides the CLI's own
    // cwd scoping and no directory grant beyond the project exists.
    if let Err(err) = kit::materialize(&project_dir) {
        return StartOutcome::Error {
            message: format!("could not write the method kit: {err}"),
        };
    }

    let id = sessions::next_id(&registry);
    let entry = SessionEntry {
        id: id.clone(),
        agent: adapter.key.to_string(),
        model: None,
        native_session_id: None,
        created: sessions::iso8601_utc(now_ms()),
        turns: 0,
        tasks: Vec::new(),
        roles: vec!["planner".to_string()],
        status: "running".to_string(),
    };
    if let Err(err) = sessions::upsert(&project_dir, entry) {
        return StartOutcome::Error {
            message: format!("could not write the session registry: {err}"),
        };
    }

    {
        let mut guard = agent.inner.lock().expect("agent state poisoned");
        guard.phase = Phase::Running;
        guard.project_dir = Some(project_dir.clone());
        guard.turn = 1;
        guard.native_session_id = None;
        guard.model = None;
        guard.cli_version = cli.version.clone();
        guard.registry_id = Some(id);
        guard.last_error = None;
    }

    let prompt = kit::assemble_kickoff(&project_dir);
    // Turn 1's user half-turn IS the kickoff: recording it keeps the
    // transcript a complete protocol record rather than a half of one.
    let _ = sessions::append_transcript(
        &project_dir,
        &TranscriptLine {
            turn: 1,
            role: "user".into(),
            text: prompt.clone(),
            at_ms: now_ms(),
            machine: true,
        },
    );

    spawn_turn(agent, cli, TurnRequest { project_dir, prompt, resume: None, turn: 1 }, flight);
    StartOutcome::Started { turn: 1 }
}

/// `genesis_resume()` — zero-argument. Respawn the RECORDED native
/// session through the adapter's resume template (T-029 criterion 1).
///
/// THE SUCCESSION GUARANTEE APPLIED TO THE INTERVIEW. Everything this
/// needs is on disk: the id comes from `.nputer/sessions.json` through
/// [`SessionEntry::resume_id`]'s gate, and the STAGE and the banked
/// artifacts come from `docs/` — never from a cache, because `docs/` is
/// the only project truth (ADR-017 clause 4). The transcript is a
/// rendering convenience and its loss costs nothing but scrollback.
pub fn resume_genesis(watch: &WatchState, agent: &AgentState) -> StartOutcome {
    let Some(flight) = agent.begin_turn() else {
        return StartOutcome::Busy;
    };
    let Some(project_dir) = watch.project_dir() else {
        return StartOutcome::NoProject;
    };
    // Same defense in depth as `start_genesis`: the answer must not depend
    // on which screen the user is looking at.
    let probe = probe_plan(&project_dir);
    if probe.has_plan() {
        return StartOutcome::AlreadyPlanned { path: project_dir.display().to_string() };
    }

    // THE ONE PLACE the fact lives (criterion "exactly ONE place").
    let Some(record) = sessions::genesis_record(&project_dir) else {
        return StartOutcome::NothingToResume;
    };
    if let Some(why) = record.session_id_rejected {
        return StartOutcome::SessionIdRejected {
            registry_path: sessions::SESSIONS_REL.to_string(),
            why: format!(
                "refusing to resume session '{}': {why}. \
                 That file is runtime state, losable by charter - starting fresh loses nothing about the project.",
                sessions::truncate_utf8(&record.registry_id, 32).escape_debug()
            ),
        };
    }
    let Some(native_session_id) = record.native_session_id else {
        return StartOutcome::NothingToResume;
    };

    let adapter = planner_adapter();
    let cli = match runner::resolve_cli(&agent.cfg, adapter) {
        Ok(cli) => cli,
        Err(ResolveError::NotFound { probed }) => return StartOutcome::CliNotFound { probed },
        Err(ResolveError::Unsupported { found }) => {
            return StartOutcome::UnsupportedVersion { found }
        }
    };
    // The kit is re-materialized rather than assumed: `.nputer/` is
    // losable by charter, so a resume must survive its own kit having
    // been deleted between sessions.
    if let Err(err) = kit::materialize(&project_dir) {
        return StartOutcome::Error {
            message: format!("could not write the method kit: {err}"),
        };
    }

    let turn = record.turns.saturating_add(1).min(u32::MAX as u64) as u32;
    {
        let mut guard = agent.inner.lock().expect("agent state poisoned");
        guard.phase = Phase::Running;
        guard.project_dir = Some(project_dir.clone());
        guard.turn = turn;
        guard.native_session_id = Some(native_session_id.clone());
        guard.model = record.model.clone();
        guard.cli_version = cli.version.clone();
        guard.registry_id = Some(record.registry_id);
        guard.last_error = None;
    }

    let prompt = kit::assemble_resume_nudge(&project_dir);
    let _ = sessions::append_transcript(
        &project_dir,
        &TranscriptLine {
            turn,
            role: "user".into(),
            text: prompt.clone(),
            at_ms: now_ms(),
            machine: true,
        },
    );
    spawn_turn(
        agent,
        cli,
        TurnRequest { project_dir, prompt, resume: Some(native_session_id), turn },
        flight,
    );
    StartOutcome::Started { turn }
}

/// `genesis_fresh()` — zero-argument. CONTINUE WITH A FRESH SESSION
/// (T-029 criterion 3): degraded, never dead.
///
/// The native session would not resume — a CLI error, a refused id, an
/// expired server-side session — so the conversation restarts while the
/// PROJECT does not. The old registry entry is marked `dead`, which is
/// the method's own word for it (`method/runtime/sessions-schema.md`:
/// "Killing a session = mark status dead; the project resumes from
/// docs/"), and the kickoff carries the planner role's RESUME RULE
/// (`method/roles/planner.md` § Resume rule) so the new session derives
/// the next stage from disk instead of re-asking what is already banked.
///
/// `docs/` is untouched by any of this. Nothing the user answered is lost.
pub fn fresh_genesis(watch: &WatchState, agent: &AgentState) -> StartOutcome {
    let Some(flight) = agent.begin_turn() else {
        return StartOutcome::Busy;
    };
    let Some(project_dir) = watch.project_dir() else {
        return StartOutcome::NoProject;
    };
    let probe = probe_plan(&project_dir);
    if probe.has_plan() {
        return StartOutcome::AlreadyPlanned { path: project_dir.display().to_string() };
    }

    let adapter = planner_adapter();
    let cli = match runner::resolve_cli(&agent.cfg, adapter) {
        Ok(cli) => cli,
        Err(ResolveError::NotFound { probed }) => return StartOutcome::CliNotFound { probed },
        Err(ResolveError::Unsupported { found }) => {
            return StartOutcome::UnsupportedVersion { found }
        }
    };
    if let Err(err) = kit::materialize(&project_dir) {
        return StartOutcome::Error {
            message: format!("could not write the method kit: {err}"),
        };
    }

    // Abandon the old session BEFORE minting the new one, so `next_id`
    // sees the settled file and `find_planner` cannot pick the dead entry.
    match sessions::mark_planner_dead(&project_dir) {
        Ok(Some(id)) => println!("[nputer] agent: abandoning planner session {id} - starting fresh"),
        Ok(None) => {}
        Err(err) => {
            return StartOutcome::Error {
                message: format!("could not update the session registry: {err}"),
            }
        }
    }

    let registry = sessions::load(&project_dir);
    let id = sessions::next_id(&registry);
    let entry = SessionEntry {
        id: id.clone(),
        agent: adapter.key.to_string(),
        model: None,
        native_session_id: None,
        created: sessions::iso8601_utc(now_ms()),
        turns: 0,
        tasks: Vec::new(),
        roles: vec!["planner".to_string()],
        status: "running".to_string(),
    };
    if let Err(err) = sessions::upsert(&project_dir, entry) {
        return StartOutcome::Error {
            message: format!("could not write the session registry: {err}"),
        };
    }

    {
        let mut guard = agent.inner.lock().expect("agent state poisoned");
        guard.phase = Phase::Running;
        guard.project_dir = Some(project_dir.clone());
        guard.turn = 1;
        guard.native_session_id = None;
        guard.model = None;
        guard.cli_version = cli.version.clone();
        guard.registry_id = Some(id);
        guard.last_error = None;
    }

    let prompt = kit::assemble_kickoff_for(&project_dir);
    let _ = sessions::append_transcript(
        &project_dir,
        &TranscriptLine {
            turn: 1,
            role: "user".into(),
            text: prompt.clone(),
            at_ms: now_ms(),
            machine: true,
        },
    );
    spawn_turn(agent, cli, TurnRequest { project_dir, prompt, resume: None, turn: 1 }, flight);
    StartOutcome::Started { turn: 1 }
}

/// Most transcript half-turns one rehydration will carry. The TAIL is
/// kept — a mid-interview reload wants the recent conversation, and the
/// early turns are banked in `docs/` anyway.
pub const MAX_REHYDRATED_LINES: usize = 200;

/// `genesis_transcript()` — zero-argument. The chat's rehydration source
/// (T-029 criteria 1 and 2).
///
/// LOSABLE BY CHARTER, and the caller must treat it that way: an empty
/// answer is not an error and never blocks a resume. A missing file, a
/// corrupt file, a file of nothing but garbage lines — all three answer
/// the same empty vector, and the screen renders banked-progress from
/// `docs/` instead. That is the whole of criterion 2.
pub fn transcript(watch: &WatchState) -> Vec<TranscriptLine> {
    let Some(project_dir) = watch.project_dir() else {
        return Vec::new();
    };
    let mut lines = sessions::read_transcript(&project_dir);
    if lines.len() > MAX_REHYDRATED_LINES {
        lines.drain(..lines.len() - MAX_REHYDRATED_LINES);
    }
    for line in &mut lines {
        // A second, independent bound at the boundary the webview reads:
        // the file's own cap is 256 KiB per line and this channel is a
        // chat, not a file viewer.
        line.text = sessions::truncate_utf8(&line.text, runner::MAX_EVENT_TEXT);
    }
    lines
}

/// What the hand-driven fallback needs (T-029 criterion 4).
#[derive(Clone, Debug, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum KickoffOutcome {
    /// The prompt, ready to copy. `kitRoot` really exists on disk by the
    /// time this answers — a prompt naming a kit that was never written
    /// would send the user's own CLI looking for nothing.
    Ready {
        prompt: String,
        project_dir: String,
        kit_root: String,
        method_version: String,
        /// True when `docs/` already holds banked work, so the prompt is
        /// the RESUME kickoff rather than the stage-0 one.
        resuming: bool,
    },
    NoProject,
    AlreadyPlanned { path: String },
    Error { message: String },
}

/// `genesis_kickoff()` — zero-argument. ADR-006's hand-driven mode as a
/// FIRST-CLASS MODE rather than a separate build: the same kit, the same
/// prompt, the same lens, the same completion detection — the user's own
/// terminal in place of the spawn.
///
/// It MATERIALIZES the kit, which is the difference between a copyable
/// block and a working one: `assemble_kickoff` names a kit root, and
/// nothing else in the hand-driven path would ever write it.
pub fn kickoff(watch: &WatchState) -> KickoffOutcome {
    let Some(project_dir) = watch.project_dir() else {
        return KickoffOutcome::NoProject;
    };
    let probe = probe_plan(&project_dir);
    if probe.has_plan() {
        return KickoffOutcome::AlreadyPlanned { path: project_dir.display().to_string() };
    }
    if let Err(err) = kit::materialize(&project_dir) {
        return KickoffOutcome::Error {
            message: format!("could not write the method kit: {err}"),
        };
    }
    KickoffOutcome::Ready {
        prompt: kit::assemble_kickoff_for(&project_dir),
        project_dir: project_dir.display().to_string(),
        kit_root: kit::kit_root(&project_dir).display().to_string(),
        method_version: kit::METHOD_SNAPSHOT_VERSION.to_string(),
        resuming: kit::has_banked_docs(&project_dir),
    }
}

/// `genesis_send_turn(text)` — the user's own typed answer, the only
/// webview-supplied datum in this module. It is passed as DATA on stdin;
/// it never becomes part of a command line.
pub fn send_turn(watch: &WatchState, agent: &AgentState, text: String) -> SendOutcome {
    let Some(flight) = agent.begin_turn() else {
        return SendOutcome::Busy;
    };

    let (project_dir, resume, next_turn) = {
        let guard = agent.inner.lock().expect("agent state poisoned");
        let Some(project_dir) = guard.project_dir.clone() else {
            return SendOutcome::NoSession;
        };
        let Some(resume) = guard.native_session_id.clone() else {
            // Turn 1 never produced an init line: there is nothing to
            // resume, and the session is not recoverable by sending.
            return SendOutcome::NoSession;
        };
        (project_dir, resume, guard.turn + 1)
    };

    // The open project moved under the session (the picker). Refuse the
    // send rather than write another project's interview into this one;
    // cancel stays available (no entanglement with picker code).
    match watch.project_dir() {
        Some(open) if open == project_dir => {}
        _ => {
            return SendOutcome::StaleProject {
                session_project: project_dir.display().to_string(),
            }
        }
    }

    let adapter = planner_adapter();
    let cli = match runner::resolve_cli(&agent.cfg, adapter) {
        Ok(cli) => cli,
        Err(ResolveError::NotFound { probed }) => return SendOutcome::CliNotFound { probed },
        Err(ResolveError::Unsupported { found }) => {
            return SendOutcome::Error {
                message: format!("the agent CLI is too old to resume with: {found}"),
            }
        }
    };

    {
        let mut guard = agent.inner.lock().expect("agent state poisoned");
        guard.phase = Phase::Running;
        guard.turn = next_turn;
        guard.last_error = None;
    }
    let _ = sessions::append_transcript(
        &project_dir,
        &TranscriptLine {
            turn: next_turn,
            role: "user".into(),
            text: text.clone(),
            at_ms: now_ms(),
            // The human typed this one.
            machine: false,
        },
    );

    spawn_turn(
        agent,
        cli,
        TurnRequest { project_dir, prompt: text, resume: Some(resume), turn: next_turn },
        flight,
    );
    SendOutcome::Accepted { turn: next_turn }
}

/// `genesis_status()` — the catch-up pull.
pub fn status(agent: &AgentState) -> GenesisStatus {
    let guard = agent.inner.lock().expect("agent state poisoned");
    GenesisStatus {
        phase: guard.phase,
        project_dir: guard.project_dir.as_ref().map(|p| p.display().to_string()),
        turn: guard.turn,
        native_session_id: guard.native_session_id.clone(),
        cli_version: guard.cli_version.clone(),
        method_version: kit::METHOD_SNAPSHOT_VERSION.to_string(),
        last_error: guard.last_error.clone(),
        last_event_at_ms: guard.last_event_at_ms,
    }
}

/// `genesis_cancel()` — kill the turn's process group.
///
/// Answers immediately: SIGTERM goes out synchronously and the 5 s grace
/// + SIGKILL escalation runs on its own thread, so the command never
/// holds the caller for the grace period.
pub fn cancel(agent: &AgentState) -> CancelOutcome {
    let handle = *agent.child.lock().expect("child slot poisoned");
    match handle {
        Some(handle) => {
            agent.cancel.store(true, Ordering::SeqCst);
            println!(
                "[nputer] agent: cancelling turn {} - signalling process group {}",
                handle.turn, handle.pid
            );
            runner::terminate_group_async(handle.pid, agent.cfg.kill_grace);
            CancelOutcome::Cancelled { turn: handle.turn }
        }
        None => CancelOutcome::Idle,
    }
}

/// Run one turn on its own thread and settle the bookkeeping when it
/// ends. The single-flight guard travels into the thread, so the latch is
/// held for the whole turn and released on every exit path.
fn spawn_turn(agent: &AgentState, cli: ResolvedCli, req: TurnRequest, flight: TurnInFlight) {
    let cfg = agent.cfg.clone();
    let inner = agent.inner.clone();
    let child = agent.child.clone();
    let cancel = agent.cancel.clone();
    let emitter = agent.emitter.clone();
    cancel.store(false, Ordering::SeqCst);

    std::thread::spawn(move || {
        let _flight = flight; // released when this thread ends
        let adapter = planner_adapter();
        let outcome = runner::run_turn(&cfg, adapter, &cli, &req, &emitter, &child, &cancel);

        // --- settle the registry + transcript + phase -----------------
        let project_dir = req.project_dir.clone();
        let registry_id = inner
            .lock()
            .expect("agent state poisoned")
            .registry_id
            .clone();

        if let Some(id) = &outcome.native_session_id {
            inner.lock().expect("agent state poisoned").native_session_id = Some(id.clone());
        }
        if outcome.model.is_some() {
            inner.lock().expect("agent state poisoned").model = outcome.model.clone();
        }

        if let Some(text) = &outcome.text {
            let _ = sessions::append_transcript(
                &project_dir,
                &TranscriptLine {
                    turn: req.turn,
                    role: "planner".into(),
                    text: text.clone(),
                    at_ms: now_ms(),
                    machine: false,
                },
            );
        }

        // The registry entry is upserted whatever happened: a failed or
        // cancelled turn leaves it `idle` and RESUMABLE — the next send
        // just resumes (criterion 5's "keep the session resumable").
        if let Some(id) = registry_id {
            let file = sessions::load(&project_dir);
            let previous = file.sessions.iter().find(|s| s.id == id);
            let created = previous
                .map(|s| s.created.clone())
                .unwrap_or_else(|| sessions::iso8601_utc(now_ms()));
            let turns = previous.map(|s| s.turns).unwrap_or(0)
                + if outcome.text.is_some() { 1 } else { 0 };
            let guard = inner.lock().expect("agent state poisoned");
            let entry = SessionEntry {
                id,
                agent: adapter.key.to_string(),
                model: guard.model.clone(),
                native_session_id: guard.native_session_id.clone(),
                created,
                turns,
                tasks: Vec::new(),
                roles: vec!["planner".to_string()],
                status: "idle".to_string(),
            };
            drop(guard);
            if let Err(err) = sessions::upsert(&project_dir, entry) {
                eprintln!("[nputer] agent: session registry write failed: {err}");
            }
        }

        let mut guard = inner.lock().expect("agent state poisoned");
        guard.phase = if outcome.error.is_some() { Phase::Failed } else { Phase::Idle };
        guard.last_error = outcome.error.clone();
        drop(guard);

        match (&outcome.error, outcome.cancelled) {
            (Some(error), _) => println!(
                "[nputer] agent: turn {} failed: {}",
                req.turn,
                crate::docs_watch::sanitize_for_log(&format!("{error:?}"))
            ),
            (None, true) => println!("[nputer] agent: turn {} cancelled", req.turn),
            (None, false) => println!("[nputer] agent: turn {} completed", req.turn),
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::mpsc;

    fn detached_watch(project: Option<PathBuf>) -> WatchState {
        let (ctl, rx) = mpsc::channel();
        std::mem::forget(rx); // keep the channel alive; no watcher thread needed
        WatchState::new(project, Arc::new(AtomicU64::new(0)), ctl)
    }

    fn silent_agent(cfg: RunnerConfig) -> AgentState {
        AgentState::new(cfg, |_| {})
    }

    #[test]
    fn start_without_a_project_is_no_project_and_spawns_nothing() {
        let watch = detached_watch(None);
        let agent = silent_agent(RunnerConfig::default());
        assert!(matches!(start_genesis(&watch, &agent), StartOutcome::NoProject));
        // The single-flight latch was released on the early return.
        assert!(matches!(start_genesis(&watch, &agent), StartOutcome::NoProject));
        assert!(matches!(status(&agent).phase, Phase::Idle));
    }

    #[test]
    fn send_without_a_session_is_no_session() {
        let watch = detached_watch(None);
        let agent = silent_agent(RunnerConfig::default());
        assert!(matches!(send_turn(&watch, &agent, "hi".into()), SendOutcome::NoSession));
    }

    #[test]
    fn cancel_with_no_child_is_idle() {
        let agent = silent_agent(RunnerConfig::default());
        assert!(matches!(cancel(&agent), CancelOutcome::Idle));
    }

    #[test]
    fn status_reports_the_compiled_method_version_before_anything_runs() {
        let agent = silent_agent(RunnerConfig::default());
        let status = status(&agent);
        assert_eq!(status.method_version, kit::METHOD_SNAPSHOT_VERSION);
        assert_eq!(status.turn, 0);
        assert_eq!(status.project_dir, None);
        assert_eq!(status.native_session_id, None);
        assert_eq!(status.last_error, None);
    }

    #[test]
    fn a_project_that_already_has_a_plan_is_refused_before_any_spawn() {
        let dir = std::env::temp_dir().join(format!(
            "nputer-t025-planned-{}-{}",
            std::process::id(),
            now_ms()
        ));
        std::fs::create_dir_all(dir.join("docs")).expect("mkdirs");
        std::fs::write(dir.join("docs/ROADMAP.md"), "# Roadmap").expect("roadmap");
        let watch = detached_watch(Some(dir.clone()));
        let agent = silent_agent(RunnerConfig::default());
        match start_genesis(&watch, &agent) {
            StartOutcome::AlreadyPlanned { path } => assert_eq!(path, dir.display().to_string()),
            other => panic!("expected AlreadyPlanned, got {other:?}"),
        }
        // Nothing was written: no kit, no registry.
        assert!(!dir.join(".nputer").exists(), "a refused start writes nothing");
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// The outcome enums serialize in the PickOutcome shape the store
    /// mirrors: a `kind` tag, camelCase fields.
    #[test]
    fn outcomes_serialize_in_the_pick_outcome_shape() {
        let json = serde_json::to_value(StartOutcome::ResumeAvailable {
            native_session_id: "abc".into(),
            turns: 3,
            model: Some("claude-opus-5".into()),
        })
        .expect("serialize");
        assert_eq!(
            json,
            serde_json::json!({
                "kind": "resumeAvailable", "nativeSessionId": "abc", "turns": 3,
                "model": "claude-opus-5"
            })
        );
        // T-029's new envelopes, in the same shape (T-039-s3).
        let json = serde_json::to_value(StartOutcome::SessionIdRejected {
            registry_path: ".nputer/sessions.json".into(),
            why: "it begins with '-'".into(),
        })
        .expect("serialize");
        assert_eq!(
            json,
            serde_json::json!({
                "kind": "sessionIdRejected",
                "registryPath": ".nputer/sessions.json",
                "why": "it begins with '-'"
            })
        );
        let json = serde_json::to_value(TurnError::AuthFailed {
            status: Some(401),
            message: "Failed to authenticate.".into(),
        })
        .expect("serialize");
        assert_eq!(
            json,
            serde_json::json!({
                "kind": "authFailed", "status": 401, "message": "Failed to authenticate."
            })
        );
        let json = serde_json::to_value(TurnError::ToolDenied {
            denials: vec!["Bash".into()],
            terminal_reason: Some("refusal".into()),
        })
        .expect("serialize");
        assert_eq!(
            json,
            serde_json::json!({
                "kind": "toolDenied", "denials": ["Bash"], "terminalReason": "refusal"
            })
        );
        let json = serde_json::to_value(SendOutcome::StaleProject {
            session_project: "/p".into(),
        })
        .expect("serialize");
        assert_eq!(json, serde_json::json!({ "kind": "staleProject", "sessionProject": "/p" }));
        let json = serde_json::to_value(CancelOutcome::Cancelled { turn: 2 }).expect("serialize");
        assert_eq!(json, serde_json::json!({ "kind": "cancelled", "turn": 2 }));
        let json = serde_json::to_value(RunEvent::Completed {
            seq: 4,
            turn: 2,
            text: "ok".into(),
            truncated_relay: false,
        })
        .expect("serialize");
        assert_eq!(
            json,
            serde_json::json!({
                "kind": "completed", "seq": 4, "turn": 2, "text": "ok", "truncatedRelay": false
            })
        );
        let json = serde_json::to_value(TurnError::ExitNonZero {
            code: Some(3),
            stderr_tail: "boom".into(),
        })
        .expect("serialize");
        assert_eq!(
            json,
            serde_json::json!({ "kind": "exitNonZero", "code": 3, "stderrTail": "boom" })
        );
    }

    /// Every event carries a strictly increasing seq from one counter, so
    /// the store's stale-drop works exactly like the docs snapshots'.
    #[test]
    fn every_event_carries_a_monotonic_seq() {
        let (tx, rx) = mpsc::channel();
        let agent = AgentState::new(RunnerConfig::default(), move |event| {
            let _ = tx.send(event);
        });
        agent.emitter.started(1);
        agent.emitter.text_delta(1, "a".into());
        agent.emitter.session_registered("id".into());
        agent.emitter.completed(1, "done".into(), false);
        let seqs: Vec<u64> = rx.try_iter().map(|e| e.seq()).collect();
        assert_eq!(seqs, vec![1, 2, 3, 4]);
        // …and emitting stamps lastEventAtMs, which T-027 renders elapsed
        // time from.
        assert!(status(&agent).last_event_at_ms.is_some());
    }
}
