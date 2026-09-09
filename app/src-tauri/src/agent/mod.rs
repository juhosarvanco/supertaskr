//! T-025 (C-14): the agent runner — the app spawns the USER'S OWN agent
//! CLI headless, hands it the method kit, and renders what it writes.
//!
//! ADR-017: the spawned planner is the writer of `docs/`; the app writes
//! only `.supertaskr/` runtime files and remains a lens. ADR-003: spawn and
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
//! `.supertaskr/sessions.json` through its own gate, so no id crosses the
//! boundary in either direction.
//!
//! Module layout follows the `index_cmd` seam precedent: everything the
//! Tauri commands do lives in `pub fn`s minus the Tauri runtime, so cargo
//! tests drive it directly and the `#[tauri::command]` wrappers in lib.rs
//! stay thin.
//!
//! **T-175 ADDS TWO SEAMS AND NO COMMANDS, AND THE GAP IS RECORDED RATHER
//! THAN LEFT TO BE FOUND.** [`cold_start`] and [`cold_start_status`] are
//! the cold-start test's whole Rust half — built, driven directly by
//! `cargo test` through the seam above, and reachable from the webview by
//! NOTHING, because a `#[tauri::command]` wrapper and its
//! `generate_handler!` line live in `app/src-tauri/src/lib.rs`, which is
//! C-05 `app-shell` and outside T-175's `[app-agent, app-interview]`
//! fence. That is the disposition `app/src-tauri/src/dispatch/mod.rs`
//! already records for `dispatch_lanes` (T-110 → T-126) and T-112 records
//! for the brief assembler (→ T-112-s1): record it, route it, build the
//! rest, and never widen a fence from inside the lane it fences. The
//! routing card is `T-175-s1`.

pub mod adapter;
pub mod kit;
pub mod runner;
pub mod sessions;
pub mod skills;

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};

use serde::Serialize;

// `self` so the T-123 routing rule reads `docs_watch::routes_to_genesis`
// at its call sites: it is C-05's rule, called and never copied.
use crate::docs_watch::{self, probe_plan, WatchState};
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

// ---- T-175: the cold-start test's typed surface -------------------------

/// The cold reader's working directory, relative to the project root.
///
/// **THIS IS THE RESTRICTION, AND IT IS A PATH RATHER THAN A SENTENCE.**
/// The card says so in as many words — *"The restriction has to be stated
/// against a path set, not against the project"* — because `.supertaskr/`
/// holds the interview transcript, is gitignored, and is nonetheless
/// present on disk in the generated project. A session started in the
/// project ROOT can reach it; a session started HERE has it above its
/// working directory, alongside nothing else it was ever told about.
pub const COLD_START_CWD_REL: &str = "docs";

/// The turn number a cold-start child carries.
///
/// Interview turns are 1-based (`start_genesis` opens at turn 1), so ZERO
/// is a number no interview turn can hold. Not decoration: the shared
/// [`ChildHandle`] and every log line downstream carry a turn, and a cold
/// start appearing as "turn 3" in a cancel notice would be an interview
/// turn as far as any reader could tell.
pub const COLD_START_TURN: u32 = 0;

/// Where the cold-start test is, for a pane that mounts late or polls.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ColdStartPhase {
    /// Never run in this app process, or run and stood down — the offer
    /// is available. A CANCELLED run lands here too, which is the
    /// affordance rule: stopping the test must cost nothing.
    #[default]
    Idle,
    Running,
    /// The reader answered; `answer` carries its words.
    Done,
    /// The run failed; `error` carries the typed reason.
    Failed,
}

/// What asking for the cold-start test answered.
///
/// **EVERY ARM COSTS THE PERSON NOTHING** (the T-069/T-101/T-102/T-107/
/// T-113 family's rule, and this card's fourth criterion). No arm ends the
/// interview, marks the project unfinished, or removes an affordance: the
/// finished project is finished before this is called and exactly as
/// finished after every one of these.
#[derive(Clone, Debug, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum ColdStartOutcome {
    /// A child is spawned. The answer arrives through [`cold_start_status`].
    Started,
    /// A turn — interview or cold start — is already in flight. The
    /// single-flight claim is SHARED with genesis on purpose: exactly one
    /// child exists at a time, so the child slot `genesis_cancel` and the
    /// exit hook read is never ambiguous about whose group it is killing.
    Busy,
    /// No project is open.
    NoProject,
    /// The project has no `docs/` tree, so there is nothing to read back
    /// and nowhere to stand the reader up. Typed rather than an error
    /// string: it is the one refusal a person can act on, and the action
    /// is "finish the interview", never "try again".
    NoDocs { rel: String },
    /// The agent CLI could not be found. The same shape as
    /// [`StartOutcome::CliNotFound`] on purpose — the hand-driven fallback
    /// is the same fallback.
    CliNotFound { probed: Vec<String> },
    /// Found, but too old to trust the flag semantics against.
    UnsupportedVersion { found: String },
}

/// The cold-start test's own catch-up pull — [`GenesisStatus`]'s sibling,
/// and deliberately a SEPARATE reading.
///
/// **NOTHING HERE IS PART OF THE INTERVIEW'S STATE, WHICH IS THE WHOLE
/// RULING THIS CARD IS BUILT ON.** Triage ruled the cold-start test
/// OFFERED, NEVER GATED: completion is at the last bank. So a running cold
/// start must not set [`Phase::Running`], must not add a turn, must not
/// touch the transcript or the session registry, and must not appear in
/// [`GenesisStatus`] at all — because every one of those is an input to
/// the completion the pane has already drawn, and moving any of them would
/// make a finished project un-finish itself the moment somebody accepted
/// the offer.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ColdStartReading {
    pub phase: ColdStartPhase,
    /// The reader's own words, whole. Never a score and never a verdict —
    /// the pane splits the gaps out of it for rendering (criterion 3) and
    /// this side keeps the text intact.
    pub answer: Option<String>,
    pub error: Option<TurnError>,
    pub started_at_ms: Option<u64>,
    pub finished_at_ms: Option<u64>,
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
    /// T-175: the cold-start test's state, and it is a SECOND cell rather
    /// than four more fields on [`Inner`]. The separation is the ruling:
    /// `Inner` is the interview's, every field of it feeds
    /// [`GenesisStatus`], and `GenesisStatus` is an input to the
    /// completion the board has already drawn. A cold start that wrote
    /// into `Inner` would gate the completion it is only allowed to be
    /// offered beside.
    cold: Arc<Mutex<ColdInner>>,
}

#[derive(Default)]
struct ColdInner {
    phase: ColdStartPhase,
    answer: Option<String>,
    error: Option<TurnError>,
    started_at_ms: Option<u64>,
    finished_at_ms: Option<u64>,
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
            cold: Arc::new(Mutex::new(ColdInner::default())),
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
    /// two paths that make "no child process SHALL outlive the app" true
    /// for every exit the app controls.
    ///
    /// **WHAT "no orphan" MEANS HERE, exactly** (T-043, absorbing
    /// T-025-s5): no orphaned descendant THAT STAYS IN THE GROUP. The
    /// signal is `killpg`, so it reaches the CLI and every tool
    /// subprocess it forked — and a descendant that calls `setsid()`
    /// leaves the group and survives. That is a property of process
    /// groups, not a defect, and it is measured rather than argued: the
    /// T-025 verifier's escapee probe recorded `child_alive=false
    /// escapee_alive=true child_pid=72417 escapee_pid=72418
    /// escapee_pgid=72418`. A descendant SWEEP stays a deliberate
    /// non-goal — the selected CLI can create a new session, and after
    /// reparenting the ancestry is undiscoverable — and what bounds the
    /// exposure is narrower and true: no `Bash(...)` pattern the planner
    /// is granted intentionally daemonizes. Revisit when that allowlist
    /// widens.
    ///
    /// **THIS THREAD DOES NOT OWN THE `Child`** — the worker running the
    /// turn does, and it is the only thread that may `waitpid`. So the
    /// wait here is the OBSERVER's poll: it reads the reaped flag off the
    /// shared [`ChildHandle`] the worker publishes to, which is what lets
    /// a cooperative group release the app's exit in milliseconds instead
    /// of holding the main thread for the full five-second grace
    /// (T-025-s7). If no worker is there to publish, the poll costs the
    /// full grace — the behaviour this call always had.
    ///
    /// A SIGKILL of the app itself cannot run cleanup; that orphan is
    /// bounded to ONE turn by the spawn-per-turn topology (§1), and this
    /// is where that honesty is recorded rather than papered over.
    pub fn reap_for_exit(&self) {
        self.cancel.store(true, Ordering::SeqCst);
        let handle = self.child.lock().expect("child slot poisoned").clone();
        if let Some(handle) = handle {
            println!(
                "[supertaskr] agent: app exiting - terminating turn {} process group {}",
                handle.turn, handle.pid
            );
            let exit = runner::terminate_group_observing(&handle, self.cfg.kill_grace);
            println!(
                "[supertaskr] agent: turn {} process group {} left after {} ms (reaped={} groupEmpty={} sigkilled={})",
                handle.turn,
                handle.pid,
                exit.waited.as_millis(),
                exit.reaped,
                exit.group_empty,
                exit.escalated
            );
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
    //
    // T-123: THE SAME ROUTING RULE THE SHELL USES, by call and not by
    // copy — `docs_watch::routes_to_genesis` has one implementation and
    // this is one of its four callers. A folder whose plan our own
    // resumable interview wrote is not an overwrite target, so the command
    // that carries the resume OFFER must not refuse it before the registry
    // has been looked at.
    //
    // **ONE READ OF THE REGISTRY, SPENT ON BOTH QUESTIONS** (T-123's
    // rebuild). The first pass read it twice here — once through the
    // routing accessor and again through `sessions::load` — and the two
    // reads are what forced the `if planned` backstop that used to sit
    // below: with a predicate that admitted a planner it could not resume,
    // this command could reach a folder's fresh spawn on a plan. Reading
    // once, and admitting only `Resumable`, makes that state unreachable
    // rather than caught, and `resume_genesis` has always had this shape.
    let probe = probe_plan(&project_dir);
    let record = sessions::genesis_record(&project_dir);
    if !docs_watch::routes_to_genesis(&probe, sessions::reachability_of(record.as_ref())) {
        return StartOutcome::AlreadyPlanned { path: project_dir.display().to_string() };
    }

    // A recorded planner session for this project is a CHOICE, not an
    // auto-resume (T-029 renders it) — and the id it offers came through
    // T-039's registry gate inside `genesis_record`, never straight off the
    // field. The file is runtime state in the user's project dir; anything
    // with disk access can write it, and T-029 spawns from what it says.
    if let Some(record) = &record {
        match (&record.native_session_id, &record.session_id_rejected) {
            (Some(id), _) => {
                return StartOutcome::ResumeAvailable {
                    native_session_id: id.clone(),
                    turns: record.turns,
                    // THE READ BOUNDARY, not the raw field (T-047-s3). A
                    // registry written by a pre-T-047 build can hold ~1 MiB
                    // of `model`; upgrading does not clean it.
                    model: record.model.clone(),
                }
            }
            // LOUD, never silent: refusing to resume is the safe half, but
            // starting a fresh interview while a poisoned entry sits on
            // disk would hide the fact that something wrote it.
            //
            // T-029 (T-039-s3): TYPED now. The webview routes this to
            // "your saved session is unusable — start fresh" rather than
            // to a generic error toast, which it could not do while this
            // shared an envelope with "the registry could not be written".
            //
            // T-123's rebuild moved WHERE this can be reached, not whether
            // it is reachable: on a folder that holds a plan the routing
            // guard above has already answered `AlreadyPlanned`, because
            // the one action this notice offers (`genesis_fresh`) refuses a
            // planned folder by design and the notice would be inert. On a
            // folder with no plan it renders exactly as T-029 built it, and
            // "start fresh" works.
            (None, Some(why)) => {
                return StartOutcome::SessionIdRejected {
                    registry_path: sessions::SESSIONS_REL.to_string(),
                    why: format!(
                        "refusing to resume session '{}': {why}. \
                         That file is runtime state, losable by charter - starting fresh loses nothing about the project.",
                        // The entry's own id is file-borne data too: bounded
                        // and escaped, like everything else that came off disk.
                        sessions::truncate_utf8(&record.registry_id, 32).escape_debug(),
                    ),
                }
            }
            // A planner entry with no id recorded: nothing to resume from,
            // so genesis proceeds as a fresh start. THE FOLDER HAS NO PLAN
            // — the routing guard above admits only `Resumable` past a
            // plan, and this arm is `NotResumable` — so the fresh spawn
            // below is the T-026 case it always was. That is why the
            // `if planned` backstop the first pass added here is GONE
            // rather than kept: it guarded a state the predicate now makes
            // unreachable, no input could red it, and a guard no test can
            // reach is a guard the next reader cannot trust.
            (None, None) => {}
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

    // T-167: THE ORG'S SKILL PACKS, discovered ONCE per genesis and used
    // for both things that need them — the kickoff the planner is handed
    // and the stamp the registry keeps. Two reads would be two chances to
    // disagree about one folder.
    let found = report_skills(&project_dir);

    // THE FRESH-SPAWN PATH'S OWN READ, taken here rather than beside the
    // routing question above: `next_id` needs the whole file, and this
    // line is reached only where nothing was resumable, so it cannot
    // disagree with a routing answer it does not feed.
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
        skills: found.packs.clone(),
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

    let prompt = kit::assemble_kickoff_with(&project_dir, &found.packs);
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

/// DISCOVER the opened project's organization skill packs and REPORT what
/// was skipped (T-167, criterion 1: "a pack that fails to parse is
/// REPORTED by name and skipped, never a crash and never silently
/// absorbed").
///
/// The report is a log line per rejected pack, in the module's own
/// `[supertaskr] agent:` voice and through the same
/// [`docs_watch::sanitize_for_log`] every other file-borne value here goes
/// through. It is deliberately NOT an error outcome: one unreadable pack
/// must not refuse a genesis, which is the whole difference between
/// "skipped" and "fatal".
///
/// Called ONCE per spawn, and its answer feeds both the kickoff and the
/// registry stamp — the "exactly ONE place" discipline `genesis_record`
/// keeps for the registry.
fn report_skills(project_dir: &std::path::Path) -> skills::Discovered {
    let found = skills::discover(project_dir);
    for reject in &found.rejected {
        println!(
            "[supertaskr] agent: skill pack '{}' under {} was SKIPPED - {}",
            docs_watch::sanitize_for_log(&reject.dir),
            skills::SKILLS_REL_DIR,
            docs_watch::sanitize_for_log(&reject.why),
        );
    }
    if !found.packs.is_empty() {
        println!(
            "[supertaskr] agent: {} organization skill pack(s) loaded from {}: {}",
            found.packs.len(),
            skills::SKILLS_REL_DIR,
            found
                .packs
                .iter()
                .map(|p| format!(
                    "{} ({})",
                    docs_watch::sanitize_for_log(&p.name),
                    docs_watch::sanitize_for_log(&p.hash)
                ))
                .collect::<Vec<_>>()
                .join(", "),
        );
    }
    found
}

/// `genesis_resume()` — zero-argument. Respawn the RECORDED native
/// session through the adapter's resume template (T-029 criterion 1).
///
/// THE SUCCESSION GUARANTEE APPLIED TO THE INTERVIEW. Everything this
/// needs is on disk: the id comes from `.supertaskr/sessions.json` through
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
    // THE ONE PLACE the fact lives (criterion "exactly ONE place"), read
    // ONCE and used for both questions below (T-123): the routing guard
    // and the resume itself. Two reads would be two chances to disagree
    // about one file.
    let record = sessions::genesis_record(&project_dir);

    // Same defense in depth as `start_genesis`: the answer must not depend
    // on which screen the user is looking at — and since T-123 it is the
    // SAME rule, `docs_watch::routes_to_genesis`, by call and not by copy.
    // **THIS IS THE COMMAND THE WHOLE CARD IS FOR.** T-029 built the
    // resume offer; the plan guard here refused it for exactly the folders
    // the offer exists to rescue, so a session that banked stage 0 could
    // be routed to its own screen and still be refused at the button.
    // Resuming an interview that AUTHORED a plan is not an overwrite; it
    // is the opposite. A folder with a plan and NO RESUMABLE session is
    // still refused, unmoved — and "no resumable session" is the rebuilt
    // predicate's phrasing, so this command refuses exactly the folders the
    // shell's routing refuses. When the two disagree the user reaches a
    // screen whose button answers no, which is the shape of dead end this
    // whole card exists to remove.
    let probe = probe_plan(&project_dir);
    if !docs_watch::routes_to_genesis(&probe, sessions::reachability_of(record.as_ref())) {
        return StartOutcome::AlreadyPlanned { path: project_dir.display().to_string() };
    }

    let Some(record) = record else {
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
    // The kit is re-materialized rather than assumed: `.supertaskr/` is
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
///
/// **T-123 DELIBERATELY DID NOT TOUCH THIS GUARD** (criterion 7). Its
/// two siblings above now ask `docs_watch::routes_to_genesis`, so a folder
/// holding a plan its own RESUMABLE interview wrote is reachable and
/// resumable again. This one keeps the BARE `has_plan` refusal, because
/// this is the destructive door: it marks the recorded session `dead` and
/// spawns a NEW planner at stage 0. The case that makes the difference
/// concrete is a CLONED repository that happens to carry a `.supertaskr/` —
/// a registered session that did NOT write the plan sitting beside it. For
/// that folder the right answer is resume and never a fresh interview,
/// which is why T-029 kept `genesis_fresh` off `genesis_start`'s flag in
/// the first place, and why the registry does not open this door.
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
        Ok(Some(id)) => println!("[supertaskr] agent: abandoning planner session {id} - starting fresh"),
        Ok(None) => {}
        Err(err) => {
            return StartOutcome::Error {
                message: format!("could not update the session registry: {err}"),
            }
        }
    }

    // T-167: one discovery, feeding both the kickoff and the stamp.
    let found = report_skills(&project_dir);

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
        skills: found.packs.clone(),
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

    let prompt = kit::assemble_kickoff_for_with(&project_dir, &found.packs);
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
///
/// SINCE T-070 IT IS ALSO THE READ BUDGET, which is the whole change:
/// this number used to describe what survived a whole-file parse, and now
/// it describes how much of the file is touched.
pub const MAX_REHYDRATED_LINES: usize = 200;

/// `genesis_transcript()` — zero-argument. The chat's rehydration source
/// (T-029 criteria 1 and 2).
///
/// LOSABLE BY CHARTER, and the caller must treat it that way: an empty
/// answer is not an error and never blocks a resume. A missing file, a
/// corrupt file, a file of nothing but garbage lines — all three answer
/// the same empty vector, and the screen renders banked-progress from
/// `docs/` instead. That is the whole of criterion 2.
///
/// THE BOUND IS AT THE READ (T-070). `transcript.jsonl` is append-only
/// and NOTHING rotates, truncates, compacts or deletes it — the only cap
/// in the module is [`sessions::TRANSCRIPT_TEXT_CAP`], on ONE LINE. Until
/// T-070 this function read the whole file back and threw all but the
/// last 200 lines away, so a tens-of-MiB transcript cost a tens-of-MiB
/// read and parse on every arrival at the interview screen. It now asks
/// [`sessions::read_transcript_tail`] for the tail, which seeks from the
/// end and never touches the bytes in front of it. The failure mode was
/// always a SLOW read and never a wrong answer, which is why the fix is
/// a change of reader and not of format.
pub fn transcript(watch: &WatchState) -> Vec<TranscriptLine> {
    let Some(project_dir) = watch.project_dir() else {
        return Vec::new();
    };
    let mut lines = sessions::read_transcript_tail(&project_dir, MAX_REHYDRATED_LINES);
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
        /// WHAT WAS ALREADY BANKED HERE, on the ONE path that never
        /// resolves a CLI (T-070 criterion 3).
        ///
        /// `sessions::genesis_record` reads `.supertaskr/sessions.json` with
        /// no CLI anywhere in the call, so carrying it here costs
        /// nothing and is available exactly where the CLI-gated commands
        /// have already given up. `None` means no interview was ever
        /// running in this folder (or it was explicitly abandoned) — the
        /// same "losable by charter" answer the registry gives
        /// everywhere else, and never an error.
        record: Option<sessions::GenesisRecord>,
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
///
/// AND IT IS THE UNIVERSAL FALLBACK BECAUSE IT RESOLVES NO CLI — which
/// is exactly why T-070 hangs the `GenesisRecord` off it. `fresh_genesis`
/// resolves one before it looks at the registry at all, and `start` and
/// `resume` resolve one before they can say anything past the recorded
/// id; a user whose CLI has been uninstalled or renamed reaches this
/// command and nothing else. The record read adds no process, no path
/// lookup and no second source of truth.
pub fn kickoff(watch: &WatchState) -> KickoffOutcome {
    let Some(project_dir) = watch.project_dir() else {
        return KickoffOutcome::NoProject;
    };
    // T-123 NAMED THIS AND DID NOT BUILD IT (`T-123-s1`). The two spawn
    // commands now ask `docs_watch::routes_to_genesis`; this one still
    // refuses a planned folder outright, so the user with no supported CLI
    // — the one class that reaches this command and nothing else — still
    // meets the dead end on a folder their own registered interview
    // planned. It is a routing decision the card's criteria do not cover
    // and it is left for a ruling rather than widened here: this command
    // MATERIALIZES the kit and assembles a prompt, and which prompt
    // (`assemble_kickoff_for` already forks on `has_banked_docs`) is a
    // second question the same ruling has to answer.
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
        // THE ONE PLACE the fact lives — the same reader `resume_genesis`
        // uses, and no second copy (T-026-s3, held).
        record: sessions::genesis_record(&project_dir),
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
/// holds the caller for the grace period. T-043 changed only what the
/// background half watches for — the observer's two-limb poll rather than
/// `kill(pid, 0)` — so the escalation stops once the worker has reaped
/// and the group is empty, instead of SIGKILLing a pgid whose pid may by
/// then belong to somebody else.
pub fn cancel(agent: &AgentState) -> CancelOutcome {
    let handle = agent.child.lock().expect("child slot poisoned").clone();
    match handle {
        Some(handle) => {
            agent.cancel.store(true, Ordering::SeqCst);
            println!(
                "[supertaskr] agent: cancelling turn {} - signalling process group {}",
                handle.turn, handle.pid
            );
            runner::terminate_group_async(&handle, agent.cfg.kill_grace);
            CancelOutcome::Cancelled { turn: handle.turn }
        }
        None => CancelOutcome::Idle,
    }
}

// ---- T-175: the cold-start test ----------------------------------------

/// `genesis_cold_start()` — spawn the FRESH, docs-restricted session the
/// method names, over the project the interview just planned.
///
/// **THE READING RESTRICTION IS THE TEST, AND IT IS A CONTRACT OF THE
/// SPAWN RATHER THAN AN INSTRUCTION IN THE PROMPT.** A session that read
/// the interview transcript, the planner's context, or the repository
/// outside `docs/` is not cold, and a green answer from it is worthless.
/// Three things carry that here, and none of them is a sentence the model
/// could decline to follow:
///
///  1. **The child's working directory is `<project>/docs`**, never the
///     project root — so `.supertaskr/` (transcript, session registry, the
///     materialized kit) and every other sibling sit ABOVE it. This is the
///     half the card asks to be stated "against a path set, not against
///     the project".
///  2. **The argv is [`adapter::CLAUDE_COLD_START_V1`]**, which grants no
///     directory (`--add-dir` absent), no permission mode, no tool, and
///     denies `Bash` by name — the spelling `cat ../.supertaskr/…` would have
///     needed. That table's own doc comment carries the flag-by-flag
///     reasoning and the residual.
///  3. **The prompt is [`kit::assemble_cold_start_prompt`], which takes no
///     arguments** — so, unlike every other prompt in this module, it
///     cannot name a path above `docs/`. Telling a cold reader where the
///     transcript lives would undo (1) in one sentence.
///
/// **AND IT IS OFFERED, NEVER GATED** (the 2026-08-30 triage ruling, on
/// this card). This function writes nothing into [`Inner`], appends no
/// transcript line, upserts no session entry and returns no arm that
/// removes an affordance — so the completion the board has already drawn
/// is exactly as true after this call as before it, on every path
/// including the failures.
pub fn cold_start(watch: &WatchState, agent: &AgentState) -> ColdStartOutcome {
    // The shared single-flight claim: one child at a time, so the child
    // slot `cancel` and the exit hook read is unambiguous. Dropped on
    // every early return below, which is what makes a refusal free.
    let Some(flight) = agent.begin_turn() else {
        return ColdStartOutcome::Busy;
    };
    let Some(project_dir) = watch.project_dir() else {
        return ColdStartOutcome::NoProject;
    };

    // THE CWD IS DERIVED AND THEN CHECKED, in that order. A cold start
    // over a project with no docs/ would otherwise spawn a child into a
    // directory that does not exist and report the OS's word for it.
    let docs = project_dir.join(COLD_START_CWD_REL);
    if !docs.is_dir() {
        return ColdStartOutcome::NoDocs { rel: COLD_START_CWD_REL.to_string() };
    }

    let adapter = adapter::cold_start_adapter();
    let cli = match runner::resolve_cli(&agent.cfg, adapter) {
        Ok(cli) => cli,
        Err(ResolveError::NotFound { probed }) => return ColdStartOutcome::CliNotFound { probed },
        Err(ResolveError::Unsupported { found }) => {
            return ColdStartOutcome::UnsupportedVersion { found }
        }
    };

    {
        let mut guard = agent.cold.lock().expect("cold-start state poisoned");
        // A fresh run CLEARS the previous answer rather than layering on
        // it: the fix-and-repeat loop means the same person runs this
        // twice over a docs tree they changed in between, and a stale
        // answer beside a running one is a lie about which tree was read.
        *guard = ColdInner {
            phase: ColdStartPhase::Running,
            answer: None,
            error: None,
            started_at_ms: Some(now_ms()),
            finished_at_ms: None,
        };
    }

    println!(
        "[supertaskr] agent: cold-start test - spawning a fresh session in {}",
        crate::docs_watch::sanitize_for_log(&docs.display().to_string()),
    );

    spawn_cold_start(
        agent,
        cli,
        TurnRequest {
            // The child's CWD. Named `project_dir` by the runner because
            // every other caller passes one; for this surface it is the
            // docs tree, and that difference IS the restriction.
            project_dir: docs,
            prompt: kit::assemble_cold_start_prompt(),
            // Never `Some`. A resumed cold start has read something, and
            // the adapter's own template refuses it besides.
            resume: None,
            turn: COLD_START_TURN,
        },
        flight,
    );
    ColdStartOutcome::Started
}

/// `genesis_cold_start_status()` — the cold-start test's catch-up pull.
///
/// Synchronous and in-memory, exactly like [`status`]. Separate from it
/// for the reason [`ColdStartReading`] states: the interview's status is
/// an input to the completion the board draws, and this must never be.
pub fn cold_start_status(agent: &AgentState) -> ColdStartReading {
    let guard = agent.cold.lock().expect("cold-start state poisoned");
    ColdStartReading {
        phase: guard.phase,
        answer: guard.answer.clone(),
        error: guard.error.clone(),
        started_at_ms: guard.started_at_ms,
        finished_at_ms: guard.finished_at_ms,
    }
}

/// Run the cold-start turn on its own thread.
///
/// **THE EMITTER IS SILENT, AND THAT IS THE DESIGN RATHER THAN A GAP.**
/// `genesis-turn` is the INTERVIEW's channel: the store folds every
/// payload on it into the conversation, by turn number. A cold-start
/// delta arriving there would be rendered as the planner speaking, and a
/// cold-start `Started` would arm the store's own in-flight claim — which
/// is `flightOf`'s `claimed` arm, and therefore the completion panel
/// standing down. So this turn's stream reaches no channel at all and its
/// answer is READ through [`cold_start_status`], which is the
/// `genesis_status` precedent applied to a run that must stay outside the
/// interview's state.
fn spawn_cold_start(agent: &AgentState, cli: ResolvedCli, req: TurnRequest, flight: TurnInFlight) {
    let cfg = agent.cfg.clone();
    let cold = agent.cold.clone();
    let child = agent.child.clone();
    let cancel = agent.cancel.clone();
    cancel.store(false, Ordering::SeqCst);

    std::thread::spawn(move || {
        // Released under the `cold` lock at the end of this block, for the
        // reason spelled out in `spawn_turn` (T-281-s8's sweep): the same
        // two-observable shape lives here, with `cold_start_status()` as
        // the phase reader and `settle_cold` as the poller that would race
        // it.
        let adapter = adapter::cold_start_adapter();
        let emitter = Emitter::new(Arc::new(|_event| {}), Arc::new(AtomicU64::new(0)));
        let outcome = runner::run_turn(&cfg, adapter, &cli, &req, &emitter, &child, &cancel);

        let mut guard = cold.lock().expect("cold-start state poisoned");
        guard.finished_at_ms = Some(now_ms());
        match (&outcome.error, outcome.cancelled, &outcome.text) {
            (Some(error), _, _) => {
                guard.phase = ColdStartPhase::Failed;
                guard.error = Some(error.clone());
                println!(
                    "[supertaskr] agent: cold-start test failed: {}",
                    crate::docs_watch::sanitize_for_log(&format!("{error:?}"))
                );
            }
            // CANCELLED IS NOT A FAILURE AND COSTS NOTHING. The person hit
            // stop; the offer comes back, and the previous answer stays
            // cleared because the run that would have replaced it did not
            // finish.
            (None, true, _) => {
                guard.phase = ColdStartPhase::Idle;
                guard.started_at_ms = None;
                guard.finished_at_ms = None;
                println!("[supertaskr] agent: cold-start test cancelled");
            }
            (None, false, Some(text)) => {
                guard.phase = ColdStartPhase::Done;
                guard.answer = Some(text.clone());
                println!("[supertaskr] agent: cold-start test answered ({} bytes)", text.len());
            }
            // A turn that ended clean and said nothing. Typed rather than
            // rendered as an empty success: "the reader answered nothing"
            // and "the reader is still thinking" are different situations
            // and the screen must not show the second for the first.
            (None, false, None) => {
                guard.phase = ColdStartPhase::Failed;
                guard.error = Some(TurnError::MalformedStream {
                    why: "the cold-start session ended without an answer".to_string(),
                });
                println!("[supertaskr] agent: cold-start test ended with no answer");
            }
        }
        // Still inside the lock the terminal phase was written under.
        drop(flight);
    });
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
        // The latch travels in and is released BELOW, under the very lock
        // that publishes the terminal phase — not at the end of this
        // thread (T-281-s8). An unwind still releases it: the closure owns
        // it, so a panic anywhere here drops it.
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
            // T-167: the pack stamp CARRIES FORWARD, the way `created`
            // does. This entry is rebuilt from scratch on every completed
            // turn, so a stamp written at spawn and not carried here would
            // be erased by turn 1's own completion — the provenance would
            // exist for the length of one child process. The packs are NOT
            // re-discovered: the stamp records what THIS session was
            // briefed with, and re-reading the folder mid-session would
            // silently rewrite that history if a pack changed under it.
            let skills = previous.map(|s| s.skills.clone()).unwrap_or_default();
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
                skills,
            };
            drop(guard);
            if let Err(err) = sessions::upsert(&project_dir, entry) {
                eprintln!("[supertaskr] agent: session registry write failed: {err}");
            }
        }

        // THE TERMINAL PHASE AND THE LATCH ARE PUBLISHED AS ONE STEP
        // (T-281-s8). A caller reads the end of a turn through TWO pieces
        // of shared state — `status()` takes this mutex for the phase,
        // `begin_turn()` reads the `running` latch — and every caller that
        // polls the phase until it leaves `Running` and then sends is
        // racing the gap between them. Written phase-first and released at
        // the END OF THE THREAD, that gap was every drop and every
        // `println!` after this block, and it was measured: a 50 ms stall
        // dropped into it turns
        // `a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
        // from a 1-in-720 intermittent (720 runs under 12x load, this Mac,
        // 2026-09-09) into 10 reds out of 10, `send_turn` answering `Busy`
        // for a turn that was already over — the same red the T-281 bench
        // took at d086c73 and CI run 34347086580 took on 0a1c7cf.
        // Releasing the latch WHILE THIS LOCK IS HELD orders the two:
        // whoever can see the terminal phase acquired this mutex after we
        // released it, so the free latch is visible to them too. It is
        // safe in the other direction as well — a `send_turn` that wins
        // the latch here blocks on this mutex until the line below, then
        // sets `Running` itself.
        let mut guard = inner.lock().expect("agent state poisoned");
        guard.phase = if outcome.error.is_some() { Phase::Failed } else { Phase::Idle };
        guard.last_error = outcome.error.clone();
        drop(flight);
        drop(guard);

        match (&outcome.error, outcome.cancelled) {
            (Some(error), _) => println!(
                "[supertaskr] agent: turn {} failed: {}",
                req.turn,
                crate::docs_watch::sanitize_for_log(&format!("{error:?}"))
            ),
            (None, true) => println!("[supertaskr] agent: turn {} cancelled", req.turn),
            (None, false) => println!("[supertaskr] agent: turn {} completed", req.turn),
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

    // ---- the arrival-path tripwire's three helpers (T-070 rebuild) -----

    /// A function's body, brace-matched from its signature, with `//`
    /// comments stripped.
    ///
    /// The signature must name EXACTLY ONE function in the file: a
    /// renamed or duplicated hop must red here rather than quietly pick
    /// the wrong body, which is the failure mode a source assertion is
    /// most likely to have.
    fn body_of(source: &str, signature: &str) -> String {
        let hits = source.matches(signature).count();
        assert_eq!(hits, 1, "'{signature}' names {hits} functions, expected exactly 1");
        let start = source.find(signature).expect("signature");
        let open = start + source[start..].find('{').expect("an opening brace");
        let mut depth = 0usize;
        let mut end = 0usize;
        for (idx, ch) in source[open..].char_indices() {
            match ch {
                '{' => depth += 1,
                '}' => {
                    depth -= 1;
                    if depth == 0 {
                        end = open + idx;
                        break;
                    }
                }
                _ => {}
            }
        }
        assert!(end > open, "unbalanced braces after '{signature}'");
        // Comments are PROSE. A doc note naming `fs::read` must not red a
        // body about what the CODE does — and stripping them is also what
        // keeps this pin from being a grep for a word.
        source[open + 1..end]
            .lines()
            .map(|line| match line.find("//") {
                Some(at) => &line[..at],
                None => line,
            })
            .collect::<Vec<&str>>()
            .join("\n")
    }

    /// Every name that is CALLED in `body`, sorted and deduped.
    ///
    /// A call is an identifier path immediately in front of a `(`, which
    /// also catches tuple-struct patterns (`Some(`, `Ok(`) — deliberately,
    /// because the allowlist is meant to be the body's whole vocabulary
    /// rather than a curated subset of it.
    fn callees(body: &str) -> Vec<String> {
        let bytes = body.as_bytes();
        let mut found: Vec<String> = Vec::new();
        for (idx, ch) in body.char_indices() {
            if ch != '(' {
                continue;
            }
            let mut end = idx;
            while end > 0 && bytes[end - 1].is_ascii_whitespace() {
                end -= 1;
            }
            let mut start = end;
            while start > 0 {
                let byte = bytes[start - 1];
                if byte.is_ascii_alphanumeric() || byte == b'_' || byte == b':' {
                    start -= 1;
                } else {
                    break;
                }
            }
            let name = body[start..end].trim_matches(':');
            // Keywords take a parenthesised expression without calling
            // anything.
            if name.is_empty()
                || matches!(name, "if" | "while" | "for" | "match" | "return" | "in" | "let")
            {
                continue;
            }
            found.push(name.to_string());
        }
        found.sort();
        found.dedup();
        found
    }

    /// A file's PRODUCTION half: everything in front of its unit-test
    /// module. A test may call the unbounded reader, and may quote the
    /// name of anything it pins; production may do neither.
    ///
    /// The marker is the whole `mod tests {` line rather than the
    /// attribute alone, because `lib.rs` carries a `#[cfg(test)] mod
    /// acl_pin;` at line 15 and cutting there would hide the file.
    fn production_half(source: &str) -> &str {
        let marker = "\n#[cfg(test)]\nmod tests {";
        match source.find(marker) {
            Some(at) => &source[..at],
            None => source,
        }
    }

    /// Every `.rs` file under this crate's `src/`, production half only,
    /// `//` comments stripped, as `(path-from-src, text)`.
    ///
    /// A DIRECTORY WALK rather than `include_str!`, and the difference is
    /// stated rather than glossed: `include_str!` binds the text to what
    /// was COMPILED, which is what the three named hops above want. This
    /// arm is a claim about files nobody has written yet, so it cannot
    /// name them, and it reads the tree cargo just compiled from
    /// `CARGO_MANIFEST_DIR` instead of the process's working directory.
    fn production_sources() -> Vec<(String, String)> {
        fn walk(dir: &std::path::Path, root: &std::path::Path, out: &mut Vec<(String, String)>) {
            let mut entries: Vec<std::path::PathBuf> = std::fs::read_dir(dir)
                .unwrap_or_else(|err| panic!("read {}: {err}", dir.display()))
                .filter_map(Result::ok)
                .map(|entry| entry.path())
                .collect();
            entries.sort();
            for path in entries {
                if path.is_dir() {
                    walk(&path, root, out);
                } else if path.extension().is_some_and(|ext| ext == "rs") {
                    let text = std::fs::read_to_string(&path).expect("read a source file");
                    let stripped = production_half(&text)
                        .lines()
                        .map(|line| match line.find("//") {
                            Some(at) => &line[..at],
                            None => line,
                        })
                        .collect::<Vec<&str>>()
                        .join("\n");
                    let name = path
                        .strip_prefix(root)
                        .expect("under src/")
                        .to_string_lossy()
                        .replace('\\', "/");
                    out.push((name, stripped));
                }
            }
        }
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("src");
        let mut out = Vec::new();
        walk(&root, &root, &mut out);
        assert!(out.len() >= 5, "the source walk found {} files", out.len());
        out
    }

    /// **THE ARRIVAL READ IS BOUND TO THE BOUNDED READER — STRUCTURALLY,
    /// BECAUSE NOTHING BEHAVIOURAL CAN DO IT (T-070 criterion 2, and the
    /// whole of its first verdict's BLOCKING 1).**
    ///
    /// `the_tail_read_costs_the_budget_and_not_the_file` measures
    /// `tail_lines` through a `Counting` reader, and that measurement is
    /// airtight for what it covers: `tail_lines` is generic over
    /// `R: Read + Seek` and is handed no path, so `src` is its ONLY
    /// channel to any byte on disk. What it cannot see is whether the
    /// arrival read goes anywhere near it. Two whole-file mutants — one
    /// in `read_transcript_tail`, one in `transcript` — survived the
    /// entire Rust suite at 356/0/3, because neither passes a byte
    /// through the injected reader.
    ///
    /// So this body pins the SHAPE the measurement needs in order to mean
    /// anything: from the IPC command down to the generic walk, each hop
    /// reaches the next one and reaches the file NO OTHER WAY. It is an
    /// allowlist of CALLEES per hop rather than a search for a forbidden
    /// word, and that is the difference that matters — a denylist is
    /// bypassed by a new helper with an innocent name, while a new callee
    /// of any name fails this list by name.
    ///
    /// WHY IT SURVIVES A REWRITE OF THE CALLER: it names no line, no
    /// order, no argument count and no body shape. Reorder the arrival
    /// path, rename its locals, split its loop — as long as it still
    /// reaches the file only through the bounded reader, its callee set is
    /// unchanged and this stays green. It FAILS CLOSED, which is the point:
    /// the one edit it cannot tolerate is a new way out of the path, and
    /// that is exactly the edit that needs a human to look.
    #[test]
    fn the_only_production_path_to_the_transcript_is_the_bounded_one() {
        // THE PRODUCTION HALVES, and the cut is load-bearing: this body
        // lives in one of the files it reads, so every signature it looks
        // for is also a string literal a few lines below. Reading the
        // production half is what keeps the pin from finding itself.
        let lib = production_half(include_str!("../lib.rs"));
        let module = production_half(include_str!("mod.rs"));
        let sessions = production_half(include_str!("sessions.rs"));
        assert!(lib.contains("fn genesis_transcript("), "lib.rs was cut too short");
        assert!(module.contains("pub fn transcript("), "mod.rs was cut too short");
        assert!(sessions.contains("fn tail_lines"), "sessions.rs was cut too short");

        // HOP 0 — the IPC command. It delegates and does nothing else.
        assert_eq!(
            callees(&body_of(lib, "fn genesis_transcript(")),
            vec!["agent::transcript"],
            "the rehydration command reaches the file through something new"
        );

        // HOP 1 — the arrival read. Its whole vocabulary, and the bounded
        // reader is in it.
        let arrival = body_of(module, "pub fn transcript(");
        assert!(arrival.len() > 100, "the arrival body did not extract: {arrival:?}");
        assert_eq!(
            callees(&arrival),
            vec![
                "Some",
                "Vec::new",
                "project_dir",
                "sessions::read_transcript_tail",
                "sessions::truncate_utf8",
            ],
            "agent::transcript gained or lost a callee - if it is a new way to reach \
             transcript.jsonl, that is the T-070 defect; if it is not, add it here \
             deliberately"
        );
        // …and it asks for the BUDGET, not for a multiple of it. A caller
        // that passes usize::MAX gets a ceiling that saturates and a walk
        // with nothing to stop it, and no callee moves.
        let args = {
            let at = arrival.find("read_transcript_tail(").expect("the call");
            let rest = &arrival[at..];
            let open = rest.find('(').expect("open");
            let close = rest.find(')').expect("close");
            rest[open + 1..close].to_string()
        };
        assert_eq!(
            args.split(',').nth(1).map(str::trim),
            Some("MAX_REHYDRATED_LINES"),
            "the arrival read's budget argument moved: {args}"
        );

        // HOP 2 — the reader. It opens the file, hands it to the generic
        // walk, and parses what comes back.
        let reader = body_of(sessions, "pub fn read_transcript_tail(");
        assert_eq!(
            callees(&reader),
            vec![
                "Ok",
                "Vec::new",
                "collect",
                "filter_map",
                "fs::File::open",
                "iter",
                "ok",
                "serde_json::from_str",
                "tail_lines",
                "transcript_path",
            ],
            "read_transcript_tail gained or lost a callee - a whole-file read here is \
             invisible to the Counting pin, because nothing reaches the injected reader"
        );

        // HOP 3 — the walk itself. It is measured behaviourally elsewhere;
        // what is pinned here is the SIGNATURE that makes the measurement
        // total, plus the absence of any second channel to a file.
        assert_eq!(
            sessions
                .matches("fn tail_lines<R: Read + Seek>(src: &mut R, max_lines: usize)")
                .count(),
            1,
            "tail_lines' signature moved - Counting only measures what passes through src, \
             so a tail_lines that can open a path of its own is unmeasured"
        );
        // THE LEAVES of hops 1 and 2, so the walk above cannot be dodged
        // by hiding the read one call further down an allowlisted name —
        // `truncate_utf8` is the sharpest of these, because a whole-file
        // read planted THERE leaves every callee set above byte-identical
        // and never touches the counted reader either.
        //
        // The list is the three ways to OPEN a file, and deliberately not
        // a list of ways to read one: `read_to_end` on `src` inside
        // `tail_lines` is the injected reader being used, which is
        // measured rather than forbidden, and pinning it here would take
        // the work away from the body that should be doing it.
        for leaf in [
            body_of(sessions, "fn tail_lines<R: Read + Seek>("),
            body_of(sessions, "fn transcript_path("),
            body_of(sessions, "pub fn truncate_utf8("),
        ] {
            for forbidden in ["fs::", "File::", "include_str"] {
                assert!(
                    !leaf.contains(forbidden),
                    "an arrival-path leaf names '{forbidden}': {leaf}"
                );
            }
        }

        // AND THE UNBOUNDED READER HAS NO PRODUCTION CALLER AT ALL. It
        // stays `pub` as the tests' assertion channel (its own doc comment
        // argues that); putting it back on a production path is the defect
        // this card closed, so the count is pinned rather than trusted.
        assert_eq!(
            sessions.matches("read_transcript(").count(),
            1,
            "read_transcript is called in sessions.rs production code"
        );
        assert!(sessions.contains("pub fn read_transcript("));
        for (name, source) in [("agent/mod.rs", module), ("lib.rs", lib)] {
            assert_eq!(
                source.matches("read_transcript(").count(),
                0,
                "{name} calls the WHOLE-FILE reader in production"
            );
        }

        // THE CONTAINMENT ARM, and it is what makes the four hops above a
        // claim about the PRODUCT rather than about three files. Every
        // check so far pins the path from `genesis_transcript` down; none
        // of them says a word about a SECOND path opened somewhere else,
        // and the transcript cannot be read without first being named.
        // `agent/sessions.rs` is the only production file allowed to name
        // it, in any of its three spellings.
        let sources = production_sources();
        let owner = sources
            .iter()
            .find(|(name, _)| name == "agent/sessions.rs")
            .map(|(_, text)| text.as_str())
            .unwrap_or_else(|| {
                panic!(
                    "the walk missed the module it is about: {:?}",
                    sources.iter().map(|(name, _)| name).collect::<Vec<&String>>()
                )
            });
        for (name, text) in &sources {
            if name == "agent/sessions.rs" {
                continue;
            }
            for spelling in ["transcript_path", "TRANSCRIPT_REL", "genesis/transcript.jsonl"] {
                assert!(
                    !text.contains(spelling),
                    "{name} names the transcript file ('{spelling}') in production. Only \
                     agent/sessions.rs may, because a reader that can name the file can \
                     read all of it, and no pin above would see that read"
                );
            }
        }

        // …AND INSIDE THE ONE MODULE THAT MAY NAME IT, the namings are
        // counted. The arm above sends a would-be second reader here; this
        // one meets it. Comments are stripped, so this is a census of the
        // CODE and prose about the file is free.
        for (spelling, expected, who) in [
            ("transcript_path(", 4, "its declaration plus append_transcript, read_transcript, read_transcript_tail"),
            ("TRANSCRIPT_REL", 2, "its declaration plus transcript_path"),
            ("genesis/transcript.jsonl", 1, "the TRANSCRIPT_REL declaration"),
        ] {
            assert_eq!(
                owner.matches(spelling).count(),
                expected,
                "agent/sessions.rs names the transcript as '{spelling}' a different number \
                 of times. Expected {expected}: {who}. A NEW one is a new way to reach the \
                 file, and every pin above is blind to it"
            );
        }
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
            "supertaskr-t025-planned-{}-{}",
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
        assert!(!dir.join(".supertaskr").exists(), "a refused start writes nothing");
        let _ = std::fs::remove_dir_all(&dir);
    }

    // ---- T-123: the commands behind the offer, and the door that stays
    // shut ---------------------------------------------------------------

    /// A folder in the reproduction's shape: the scaffolded stage-0
    /// ROADMAP (zero features, every example commented) and an EMPTY
    /// `docs/tasks/`. Returned unregistered; each arm decides that.
    fn planned_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "supertaskr-t123-{}-{}-{}",
            tag,
            std::process::id(),
            now_ms()
        ));
        std::fs::create_dir_all(dir.join("docs/tasks")).expect("mkdirs");
        std::fs::write(
            dir.join("docs/ROADMAP.md"),
            "# Roadmap\n\n## Backbone\n<!-- one bullet per feature, e.g.\n     - F-01: Capture -->\n",
        )
        .expect("roadmap");
        dir
    }

    /// One idle planner with a usable native session id, written as TEXT
    /// in the shape the live reproduction's registry carries. `native` is
    /// `None` for the entry that has nothing to resume from.
    fn register_planner(dir: &std::path::Path, native: Option<&str>) {
        std::fs::create_dir_all(dir.join(".supertaskr")).expect("mkdir .supertaskr");
        let id_line = match native {
            Some(id) => format!("\"native_session_id\": \"{id}\",\n      "),
            None => String::new(),
        };
        std::fs::write(
            dir.join(".supertaskr/sessions.json"),
            format!(
                "{{\n  \"sessions\": [\n    {{\n      \"id\": \"S1\",\n      \
                 \"agent\": \"claude\",\n      \"model\": \"claude-opus-5\",\n      {id_line}\
                 \"created\": \"2026-08-24T18:32:51Z\",\n      \"turns\": 1,\n      \
                 \"tasks\": [],\n      \"roles\": [\n        \"planner\"\n      ],\n      \
                 \"status\": \"idle\"\n    }}\n  ]\n}}\n"
            ),
        )
        .expect("registry");
    }

    /// **T-123 CRITERION 1, AT THE COMMAND THE OFFER COMES OUT OF.**
    ///
    /// Routing the pick to the genesis screen is only half a rescue: the
    /// chat auto-starts, `genesis_start` answers, and `resumeAvailable` IS
    /// the resume offer. While this command refused a planned folder
    /// outright, a session that banked stage 0 could be routed to its own
    /// screen and still be refused at the button.
    ///
    /// The positive control is the body directly above — the same call on
    /// the same shape of folder with no registry answers `AlreadyPlanned`
    /// and writes nothing.
    #[test]
    fn a_registered_interview_gets_the_resume_offer_on_the_plan_it_wrote() {
        let dir = planned_dir("start-offer");
        register_planner(&dir, Some("00000000-1111-2222-3333-444444444444"));
        let watch = detached_watch(Some(dir.clone()));
        let agent = silent_agent(RunnerConfig::default());
        match start_genesis(&watch, &agent) {
            StartOutcome::ResumeAvailable {
                native_session_id,
                turns,
                ..
            } => {
                assert_eq!(native_session_id, "00000000-1111-2222-3333-444444444444");
                assert_eq!(turns, 1, "the turn the interview really banked");
            }
            other => panic!("expected ResumeAvailable, got {other:?}"),
        }
        // The OFFER is not a spawn: nothing ran, nothing was materialized.
        assert!(matches!(status(&agent).phase, Phase::Idle));
        assert!(
            !dir.join(".supertaskr/genesis").exists(),
            "an offer writes no kit"
        );
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// **T-123 CRITERION 7 — A PLANNED FOLDER NEVER REACHES A FRESH
    /// SPAWN.**
    ///
    /// The registry re-opened `genesis_start`'s door, and the shape that
    /// tests whether it opened too far is a registered planner with NO
    /// native id: there is nothing to resume, and before the guard below
    /// existed the command would have fallen straight through to
    /// materializing a kit and spawning a planner at stage 0 — on a folder
    /// that already holds a plan. The route is resume or nothing.
    #[test]
    fn a_registered_session_with_nothing_to_resume_never_starts_a_fresh_one_on_a_plan() {
        let dir = planned_dir("start-no-id");
        register_planner(&dir, None);
        let before = std::fs::read(dir.join(".supertaskr/sessions.json")).expect("registry");
        let watch = detached_watch(Some(dir.clone()));
        let agent = silent_agent(RunnerConfig::default());
        match start_genesis(&watch, &agent) {
            StartOutcome::AlreadyPlanned { path } => assert_eq!(path, dir.display().to_string()),
            other => panic!("expected AlreadyPlanned, got {other:?}"),
        }
        assert!(matches!(status(&agent).phase, Phase::Idle));
        assert!(!dir.join(".supertaskr/genesis").exists(), "no kit was written");
        assert_eq!(
            std::fs::read(dir.join(".supertaskr/sessions.json")).expect("registry"),
            before,
            "and no second session was registered - a fresh start would have upserted S2"
        );
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// **T-123 CRITERION 7's OTHER HALF — `genesis_fresh` STILL REFUSES A
    /// PLANNED FOLDER, and that is deliberate rather than overlooked.**
    ///
    /// It is the destructive door: it marks the recorded session `dead`
    /// and spawns a NEW planner at stage 0. The case that makes the
    /// difference concrete is a CLONED repository carrying a `.supertaskr/` —
    /// a registered session that did NOT write the plan beside it — where
    /// the right answer is resume and never a fresh interview. So the
    /// registry opens `start` and `resume` and does NOT open this.
    #[test]
    fn fresh_genesis_still_refuses_a_planned_folder_even_with_a_session_registered() {
        let dir = planned_dir("fresh-refused");
        register_planner(&dir, Some("00000000-1111-2222-3333-444444444444"));
        let before = std::fs::read(dir.join(".supertaskr/sessions.json")).expect("registry");
        let watch = detached_watch(Some(dir.clone()));
        let agent = silent_agent(RunnerConfig::default());
        match fresh_genesis(&watch, &agent) {
            StartOutcome::AlreadyPlanned { path } => assert_eq!(path, dir.display().to_string()),
            other => panic!("expected AlreadyPlanned from the destructive door, got {other:?}"),
        }
        assert_eq!(
            std::fs::read(dir.join(".supertaskr/sessions.json")).expect("registry"),
            before,
            "the recorded session was NOT marked dead"
        );
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// **T-123 CRITERION 1, AT THE COMMAND THE OFFER LEADS TO** — with its
    /// positive control in the same body.
    ///
    /// `genesis_resume` carried the same bare plan guard, so taking the
    /// offer would have answered `AlreadyPlanned` on exactly the folders
    /// the offer exists for. Past the guard the command resolves a CLI,
    /// and under `cargo test` that arm is STRUCTURALLY refused (T-060), so
    /// `CliNotFound` is what "the guard let this through" looks like here
    /// — a typed refusal from two functions further on, naming the guard
    /// that refused it. Nothing spawns either way.
    #[test]
    fn resuming_the_plan_your_own_interview_wrote_is_not_an_overwrite() {
        let dir = planned_dir("resume-allowed");
        register_planner(&dir, Some("00000000-1111-2222-3333-444444444444"));
        let watch = detached_watch(Some(dir.clone()));
        let agent = silent_agent(RunnerConfig::default());
        match resume_genesis(&watch, &agent) {
            StartOutcome::CliNotFound { probed } => assert!(
                probed.iter().any(|line| line.contains("refused")),
                "past the plan guard and stopped by the CLI gate: {probed:?}"
            ),
            other => panic!("expected the resume to get past the plan guard, got {other:?}"),
        }
        let _ = std::fs::remove_dir_all(&dir);

        // THE POSITIVE CONTROL: the same call, the same shape of folder,
        // no registry. The no-overwrite guarantee is unmoved.
        let bare = planned_dir("resume-refused");
        let watch = detached_watch(Some(bare.clone()));
        let agent = silent_agent(RunnerConfig::default());
        match resume_genesis(&watch, &agent) {
            StartOutcome::AlreadyPlanned { path } => assert_eq!(path, bare.display().to_string()),
            other => panic!("expected AlreadyPlanned with no registry, got {other:?}"),
        }
        let _ = std::fs::remove_dir_all(&bare);
    }

    /// **T-123 REBUILD — `genesis_start` REFUSES EXACTLY WHAT THE ROUTING
    /// REFUSES, and the acceptance proof sits in this body.**
    ///
    /// The rejected first pass let a plan-holding folder past this guard
    /// on the strength of a planner entry it could not resume. The webview
    /// then met `AlreadyPlanned` or `SessionIdRejected` on a screen with no
    /// resume offer and no working action. Both shapes are driven here,
    /// and the third arm proves the fixture is otherwise ACCEPTED — one
    /// JSON field apart (CONVENTIONS: A NEGATIVE ASSERTION NEEDS A
    /// POSITIVE CONTROL).
    ///
    /// The registry is read back after every arm: a refusal that wrote a
    /// session would be a fresh interview started on somebody's plan,
    /// which is the thing criterion 7 exists to make impossible.
    #[test]
    fn start_refuses_a_plan_whose_registered_interview_cannot_be_resumed() {
        // ---- ARM 1: registered, no id recorded.
        let no_id = planned_dir("start-notresumable-noid");
        register_planner(&no_id, None);
        let before = std::fs::read(no_id.join(".supertaskr/sessions.json")).expect("registry");
        let watch = detached_watch(Some(no_id.clone()));
        let agent = silent_agent(RunnerConfig::default());
        match start_genesis(&watch, &agent) {
            StartOutcome::AlreadyPlanned { path } => assert_eq!(path, no_id.display().to_string()),
            other => panic!("expected AlreadyPlanned, got {other:?}"),
        }
        assert!(matches!(status(&agent).phase, Phase::Idle));
        assert!(!no_id.join(".supertaskr/genesis").exists(), "no kit was written");
        assert_eq!(
            std::fs::read(no_id.join(".supertaskr/sessions.json")).expect("registry"),
            before,
            "and no second session was registered - a fresh start would have upserted S2"
        );
        let _ = std::fs::remove_dir_all(&no_id);

        // ---- ARM 2: registered with an id the T-039 boundary refuses.
        // The first pass answered `SessionIdRejected` here, whose only
        // affordance is "start a fresh session" - and `genesis_fresh`
        // refuses a planned folder by design (criterion 7), so that notice
        // could not be acted on. The honest answer is the one the folder
        // got before T-123: it holds a plan, so it opens as a project.
        let refused = planned_dir("start-notresumable-refused");
        register_planner(&refused, Some("--dangerously-skip-permissions"));
        let before = std::fs::read(refused.join(".supertaskr/sessions.json")).expect("registry");
        let watch = detached_watch(Some(refused.clone()));
        let agent = silent_agent(RunnerConfig::default());
        match start_genesis(&watch, &agent) {
            StartOutcome::AlreadyPlanned { path } => {
                assert_eq!(path, refused.display().to_string())
            }
            other => panic!("expected AlreadyPlanned for a refused id on a plan, got {other:?}"),
        }
        assert_eq!(
            std::fs::read(refused.join(".supertaskr/sessions.json")).expect("registry"),
            before,
            "the poisoned entry is left exactly as it was found"
        );
        let _ = std::fs::remove_dir_all(&refused);

        // ---- ARM 3: THE ACCEPTANCE PROOF, one field away from arm 1.
        let usable = planned_dir("start-notresumable-control");
        register_planner(&usable, Some("00000000-1111-2222-3333-444444444444"));
        let watch = detached_watch(Some(usable.clone()));
        let agent = silent_agent(RunnerConfig::default());
        match start_genesis(&watch, &agent) {
            StartOutcome::ResumeAvailable { turns, model, .. } => {
                assert_eq!(turns, 1);
                // The offer's whole payload comes off the ONE record this
                // command now reads, so the field that rides furthest from
                // the routing question is asserted too — a drill mutant
                // that dropped it survived the first sweep of this rebuild,
                // and a field nothing asserts is a field anything may do to.
                assert_eq!(
                    model.as_deref(),
                    Some("claude-opus-5"),
                    "through T-047-s3's display boundary, off the same single read"
                );
            }
            other => panic!(
                "the same fixture with a usable id must be ACCEPTED, or arms 1 and 2 \
                 prove nothing: got {other:?}"
            ),
        }
        let _ = std::fs::remove_dir_all(&usable);

        // ---- ARM 4: AND THE T-039 NOTICE IS NOT SILENCED, only moved to
        // where it can be acted on. The same poisoned entry on a folder
        // with NO plan still answers `SessionIdRejected`, and there
        // `genesis_fresh` really can start over.
        let unplanned = std::env::temp_dir().join(format!(
            "supertaskr-t123-start-refused-noplan-{}-{}",
            std::process::id(),
            now_ms()
        ));
        std::fs::create_dir_all(&unplanned).expect("mkdirs");
        register_planner(&unplanned, Some("--dangerously-skip-permissions"));
        let watch = detached_watch(Some(unplanned.clone()));
        let agent = silent_agent(RunnerConfig::default());
        match start_genesis(&watch, &agent) {
            StartOutcome::SessionIdRejected { registry_path, why } => {
                assert_eq!(registry_path, sessions::SESSIONS_REL);
                assert!(why.contains("S1"), "the entry names itself: {why}");
            }
            other => panic!("expected SessionIdRejected with no plan in the way, got {other:?}"),
        }
        let _ = std::fs::remove_dir_all(&unplanned);
    }

    /// **T-123 REBUILD — THE TWO GUARDS AGREE, WHICH IS THE WHOLE POINT.**
    ///
    /// `genesis_resume` is the command the offer leads to. If it refused
    /// folders the routing sends to the interview screen — or accepted
    /// folders the routing sends to the board — the user would meet a
    /// button that answers no. Both commands now ask
    /// `docs_watch::routes_to_genesis` with the same reachability, so the
    /// pair cannot drift; this body drives the shape where the first pass
    /// made them drift.
    #[test]
    fn resume_refuses_a_plan_whose_registered_interview_cannot_be_resumed() {
        for (tag, native) in [
            ("resume-notresumable-noid", None),
            (
                "resume-notresumable-refused",
                Some("--dangerously-skip-permissions"),
            ),
        ] {
            let dir = planned_dir(tag);
            register_planner(&dir, native);
            let watch = detached_watch(Some(dir.clone()));
            let agent = silent_agent(RunnerConfig::default());
            match resume_genesis(&watch, &agent) {
                StartOutcome::AlreadyPlanned { path } => {
                    assert_eq!(path, dir.display().to_string())
                }
                other => panic!("expected AlreadyPlanned for {tag}, got {other:?}"),
            }
            assert!(matches!(status(&agent).phase, Phase::Idle));
            let _ = std::fs::remove_dir_all(&dir);
        }

        // THE ACCEPTANCE PROOF, one field away: past the plan guard and
        // stopped two functions later by T-060's structural CLI refusal.
        let usable = planned_dir("resume-notresumable-control");
        register_planner(&usable, Some("00000000-1111-2222-3333-444444444444"));
        let watch = detached_watch(Some(usable.clone()));
        let agent = silent_agent(RunnerConfig::default());
        match resume_genesis(&watch, &agent) {
            StartOutcome::CliNotFound { probed } => assert!(
                probed.iter().any(|line| line.contains("refused")),
                "past the plan guard and stopped by the CLI gate: {probed:?}"
            ),
            other => panic!("the resumable fixture must get past the guard, got {other:?}"),
        }
        let _ = std::fs::remove_dir_all(&usable);
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
            registry_path: ".supertaskr/sessions.json".into(),
            why: "it begins with '-'".into(),
        })
        .expect("serialize");
        assert_eq!(
            json,
            serde_json::json!({
                "kind": "sessionIdRejected",
                "registryPath": ".supertaskr/sessions.json",
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
        // T-081's live denial event, in the same shape. The camelCase
        // spelling is the contract `agent-store.ts` mirrors: `toolName`
        // and `toolUseId` are `null` when the CLI's line did not carry
        // them, and `message` is a plain empty string rather than null,
        // because a denial with no explanation still happened.
        let json = serde_json::to_value(RunEvent::Denied {
            seq: 7,
            turn: 1,
            tool_name: Some("Bash".into()),
            tool_use_id: Some("toolu_1".into()),
            message: "the following part requires approval".into(),
        })
        .expect("serialize");
        assert_eq!(
            json,
            serde_json::json!({
                "kind": "denied", "seq": 7, "turn": 1, "toolName": "Bash",
                "toolUseId": "toolu_1", "message": "the following part requires approval"
            })
        );
        let json = serde_json::to_value(RunEvent::Denied {
            seq: 8,
            turn: 1,
            tool_name: None,
            tool_use_id: None,
            message: String::new(),
        })
        .expect("serialize");
        assert_eq!(
            json,
            serde_json::json!({
                "kind": "denied", "seq": 8, "turn": 1,
                "toolName": serde_json::Value::Null,
                "toolUseId": serde_json::Value::Null, "message": ""
            })
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
