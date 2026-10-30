//! Managed genesis command/callback provenance. The native watcher owns paths;
//! frontend attempts correlate a request and never select another location.
use serde::{Deserialize, Serialize};
use std::sync::{atomic::Ordering, mpsc, Arc, Mutex};

use super::context::{
    ExpectedContext, GenesisContext, GenesisSession, InitializedSetup, PreparedContext,
    RuntimeRecord,
};
use super::runner::{self, Emitter, ResolveError, RunEvent, TurnError, TurnRequest};
use super::sessions::{self, SessionEntry, TranscriptLine};
use super::{adapter, kit, AgentState, Phase, StartOutcome, TurnInFlight};
use crate::docs_watch::{self, PickInFlight, WatchState};
use crate::record_editor::RecordEditorState;

fn original_planner_decision(
    watch: &WatchState, editor: &RecordEditorState, prepared: &PreparedContext,
    planner: &super::planner::PlannerSession,
) -> Result<super::planner::Decision, String> {
    let observed = crate::record_editor::inspect_original_planner(watch, editor, prepared, &planner.provenance.product_revision)?;
    super::planner::Decision::from_observation(&observed)
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    pub expected_context: ExpectedContext,
    pub attempt: u64,
}
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Identity {
    pub activation: u64,
    pub token: String,
    pub session_id: String,
    pub origin_digest: String,
    pub initiating_attempt: u64,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Event {
    #[serde(flatten)]
    pub context: ExpectedContext,
    pub attempt: u64,
    pub identity: Identity,
    pub event: RunEvent,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Reply<T: Serialize> {
    #[serde(flatten)]
    pub context: ExpectedContext,
    pub attempt: u64,
    pub seq: u64,
    pub identity: Option<Identity>,
    pub result: T,
}
#[derive(Clone, Debug)]
pub(super) struct Activation {
    pub context: GenesisContext,
    pub session: GenesisSession,
    pub identity: Identity,
    pub setup: Option<InitializedSetup>,
    pub event_attempt: u64,
    pub bank_ack: Option<super::banking::Receipt>,
    pub bank_problem: Option<String>,
}

fn reply<T: Serialize>(
    agent: &AgentState,
    request: &Request,
    identity: Option<Identity>,
    result: T,
) -> Reply<T> {
    Reply {
        context: request.expected_context,
        attempt: request.attempt,
        seq: agent.emitter.next_sequence(),
        identity,
        result,
    }
}
fn emitter(agent: &AgentState, activation: &Activation, attempt: u64) -> Emitter {
    let scope = activation.context.expected();
    let identity = activation.identity.clone();
    let inner = agent.inner.clone();
    let sink = agent.managed_sink.clone();
    agent.emitter.with_sink(Arc::new(move |event| {
        if let Ok(mut state) = inner.lock() {
            if state
                .managed
                .as_ref()
                .is_some_and(|active| active.identity == identity)
            {
                state.last_event_at_ms = Some(super::runner::now_ms());
            }
        }
        if let Some(sink) = &sink {
            sink(Event {
                context: scope,
                attempt,
                identity: identity.clone(),
                event,
            });
        }
    }))
}
fn activate(
    agent: &AgentState,
    prepared: &PreparedContext,
    session: GenesisSession,
    setup: Option<InitializedSetup>,
    attempt: u64,
) -> Activation {
    let activation = agent.activation_sequence.fetch_add(1, Ordering::SeqCst) + 1;
    static NEXT_TOKEN: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let token = format!(
        "activation-{}-{nanos}-{}-{activation}",
        std::process::id(),
        NEXT_TOKEN.fetch_add(1, Ordering::SeqCst)
    );
    let identity = Identity {
        activation,
        token,
        session_id: session.id.clone(),
        origin_digest: prepared.context.fingerprint(),
        initiating_attempt: attempt,
    };
    let bank_ack=super::banking::view(agent,&prepared.context,&session)
        .filter(|view|view.current).and_then(|view|view.receipts.first().cloned());
    let bank_problem=super::banking::view(agent,&prepared.context,&session).and_then(|view|view.code);
    Activation {
        context: prepared.context.clone(),
        session,
        identity,
        setup,
        event_attempt: attempt,
        bank_ack,
        bank_problem,
    }
}

#[derive(Clone, Copy)]
pub enum StartAction {
    Start,
    Resume,
    Fresh,
}

pub fn prepare(watch: &WatchState, request: &Request) -> Result<PreparedContext, String> {
    if request.attempt == 0 || request.attempt > 9_007_199_254_740_991 {
        return Err("genesis-request-attempt-invalid".into());
    }
    PreparedContext::capture(watch, Some(request.expected_context))
}

pub fn preparation_failed(
    agent: &AgentState,
    request: &Request,
    code: String,
) -> Reply<StartOutcome> {
    reply(agent, request, None, StartOutcome::Error { message: code })
}

/// Proposal answer refs use raw lowercase hex. The existing shared helper
/// returns a prefixed digest, while session origins retain that prefix.
pub(super) fn answer_digest(text:&str)->String {
    super::skills::sha256_hex(text.as_bytes()).strip_prefix("sha256:").expect("shared SHA256 prefix").to_owned()
}
fn bank_context(active: &Activation, answer: Option<(u32, &str)>) -> String {
    let Some(setup) = &active.setup else { return String::new(); };
    let refs = answer.map(|(turn, digest)| serde_json::json!([{"turn":turn,"sha256":digest}]))
        .unwrap_or_else(|| serde_json::json!([]));
    let context = serde_json::json!({"version":1,"setupId":setup.setup_id,
        "sessionId":active.session.id,"originDigest":active.context.fingerprint(),
        "expectedProductRevision":setup.product_revision,"expectedRecordsRevision":setup.records_revision,
        "settings":setup.settings,"answerRefs":refs,"acceptedBank":active.bank_ack,"lastBankProblem":active.bank_problem});
    format!("\n<supertaskr-bank-context-v1>\n{context}\n</supertaskr-bank-context-v1>\n")
}
fn inline_prompt(active: &Activation, continuation: bool) -> String {
    let mut prompt = String::from("You are the planner in an initialized separated workspace. Your actual working directory is RECORDS; every docs/ path is relative to it. The driver owns all PRODUCT changes and Git banking. Never invoke Git, commit/push, claim an unacknowledged bank is committed, or infer access from a path. The canonical public kit follows inline; its names are logical inputs, not filesystem grants. Human turns stay plain text.\n");
    if active.session.planner.as_ref().is_some_and(|planner| planner.selection.harness == "codex") {
        prompt.push_str("Use the file inspection/edit tools already provided by your Codex driver within RECORDS; native file edit/apply_patch is appropriate. This prompt grants no additional shell, tool or directory access. Do not write PRODUCT.\n");
    } else {
        prompt.push_str("Do not invoke shell tools. Use the existing RECORDS read/write/edit tools; no additional permission is granted.\n");
    }
    if continuation {
        prompt.push_str(
            "Continue the banked interview from RECORDS; do not repeat already banked questions.\n",
        );
    }
    if let Some(setup) = &active.setup {
        prompt.push_str(&format!("Original setup: {}. Session: {}. Origin: {}. Current PRODUCT input: {}. Current RECORDS input: {}. Setup request: {}. Setup receipt: {}.\nValidated committed project settings: {}\n",
            setup.setup_id, active.session.id, active.context.fingerprint(), setup.product_revision, setup.records_revision,
            setup.request_digest, setup.receipt_digest, setup.settings));
    }
    prompt.push_str(&bank_context(active, None));
    for file in kit::KIT_FILES {
        prompt.push_str(&format!(
            "\n--- BEGIN CANONICAL KIT {} ---\n{}\n--- END CANONICAL KIT {} ---\n",
            file.rel, file.content, file.rel
        ));
    }
    prompt
}

enum Startup {
    Started,
    Failed(TurnError),
    Cancelled,
}
struct StartupClaim {
    selection: Mutex<Option<PickInFlight>>,
    sender: Mutex<Option<mpsc::Sender<Startup>>>,
}
impl StartupClaim {
    fn finish(&self, result: Startup) {
        self.selection
            .lock()
            .expect("genesis startup claim poisoned")
            .take();
        if let Some(sender) = self
            .sender
            .lock()
            .expect("genesis startup sender poisoned")
            .take()
        {
            let _ = sender.send(result);
        }
    }
}

fn start_worker(
    agent: &AgentState,
    prepared: PreparedContext,
    active: Activation,
    cli: runner::ResolvedCli,
    entry: SessionEntry,
    prompt: String,
    resume: Option<String>,
    turn: u32,
    attempt: u64,
    flight: TurnInFlight,
) -> mpsc::Receiver<Startup> {
    let (sender, receiver) = mpsc::channel();
    let startup = Arc::new(StartupClaim {
        selection: Mutex::new(Some(prepared.selection)),
        sender: Mutex::new(Some(sender)),
    });
    let base = emitter(agent, &active, attempt);
    let observing = startup.clone();
    let inner = agent.inner.clone();
    let event_inner = inner.clone();
    let identity = active.identity.clone();
    let forwarding = base.clone();
    let events = base.with_sink(Arc::new(move |event| {
        match &event {
            RunEvent::Started { .. } => {
                if let Ok(mut state) = event_inner.lock() {
                    if state
                        .managed
                        .as_ref()
                        .is_some_and(|a| a.identity == identity)
                    {
                        state.phase = Phase::Running;
                    }
                }
                observing.finish(Startup::Started);
            }
            RunEvent::Failed { error, .. } => observing.finish(Startup::Failed(error.clone())),
            _ => {}
        }
        // Delegate through the original envelope/timestamp sink, never through
        // whichever activation might be current when this callback runs.
        forwarding.forward(event);
    }));
    let cfg = agent.cfg.clone();
    let child = agent.child.clone();
    let cancel = agent.cancel.clone();
    let banking = agent.banking_callback.clone();
    let worker_startup = startup.clone();
    let failure_inner = inner.clone();
    let failure_identity = active.identity.clone();
    let failure_events = base.clone();
    let spawned = std::thread::Builder::new()
        .name("genesis-turn".into())
        .spawn(move || {
            let request = TurnRequest {
                project_dir: active.context.records.clone(),
                prompt,
                resume,
                turn,
            };
            let outcome = if cancel.load(Ordering::SeqCst) {
                worker_startup.finish(Startup::Cancelled);
                runner::TurnOutcome {
                    cancelled: true,
                    ..runner::TurnOutcome::default()
                }
            } else if active.context.split() {
                match active.session.planner.as_ref().ok_or_else(|| "genesis-planner-provenance-required".to_string())
                    .and_then(|planner| planner.verify_executable(&cli).and_then(|()| planner.selection.adapter().map(|adapter| (planner, adapter)))) {
                    Ok((planner, adapter)) => runner::run_configured_turn(&cfg, adapter, &cli, &request, &events, &child, &cancel, &planner.selection.model),
                    Err(code) => {
                        let error = TurnError::SpawnFailed { os: code };
                        events.failed(turn, error.clone());
                        runner::TurnOutcome { error: Some(error), ..Default::default() }
                    }
                }
            } else {
                runner::run_turn(&cfg, adapter::planner_adapter(), &cli, &request, &events, &child, &cancel)
            };
            let settled=settle_original(&active, entry, &outcome, turn);
            let bank=settled && active.context.split() && !outcome.cancelled && outcome.error.is_none() && outcome.text.is_some();
            let mut state = inner.lock().expect("agent state poisoned");
            if state
                .managed
                .as_ref()
                .is_some_and(|a| a.identity == active.identity)
            {
                if outcome.native_session_id.is_some() {
                    state.native_session_id = outcome.native_session_id.clone();
                }
                if outcome.model.is_some() {
                    state.model = outcome.model.clone();
                }
                state.phase = if outcome.error.is_some() {
                    Phase::Failed
                } else {
                    Phase::Idle
                };
                state.last_error = outcome.error;
            }
            drop(state);
            // The original child has ceased. Keep its flight/cancel ownership
            // through transcript settlement and the finite banking callback.
            if bank {
                if let Some(finish)=banking { finish(super::banking::BankTurn {active,turn,cancel,flight});return; }
            }
            drop(flight);
        });
    if let Err(error) = spawned {
        let error = TurnError::SpawnFailed {
            os: error.to_string(),
        };
        if let Ok(mut state) = failure_inner.lock() {
            if state
                .managed
                .as_ref()
                .is_some_and(|active| active.identity == failure_identity)
            {
                state.phase = Phase::Failed;
                state.last_error = Some(error.clone());
            }
        }
        failure_events.failed(turn, error.clone());
        startup.finish(Startup::Failed(error));
    }
    receiver
}

fn settle_original(
    active: &Activation,
    mut entry: SessionEntry,
    outcome: &runner::TurnOutcome,
    turn: u32,
) -> bool {
    let mut guarded = || -> Result<(), String> {
        active.context.verify_original()?;
        active
            .context
            .runtime_record(RuntimeRecord::Sessions, true)?;
        active
            .context
            .runtime_record(RuntimeRecord::Transcript, true)?;
        let current = sessions::load_read_only(&active.context.product)
            .map_err(|_| "genesis-registry-unavailable")?;
        if current
            .sessions
            .iter()
            .find(|row| row.id == entry.id)
            .is_some_and(|row| {
                row.genesis.as_ref() != Some(&active.session) || row.status == "dead"
            })
        {
            return Err("genesis-original-registry-entry-changed".into());
        }
        if let Some(text) = &outcome.text {
            sessions::append_transcript(
                &active.context.product,
                &TranscriptLine {
                    turn,
                    role: "planner".into(),
                    text: text.clone(),
                    at_ms: runner::now_ms(),
                    machine: false,
                    genesis: Some(active.session.transcript_origin()),
                },
            )
            .map_err(|_| "genesis-transcript-unavailable")?;
        }
        entry.native_session_id = outcome
            .native_session_id
            .clone()
            .or(entry.native_session_id.clone());
        entry.model = outcome.model.clone().or(entry.model.clone());
        entry.turns = entry
            .turns
            .saturating_add(u64::from(outcome.text.is_some()));
        entry.status = "idle".into();
        entry.genesis = Some(active.session.clone());
        active
            .context
            .runtime_record(RuntimeRecord::Sessions, true)?;
        sessions::upsert(&active.context.product, entry.clone())
            .map_err(|_| "genesis-registry-unavailable")?;
        Ok(())
    };
    match guarded() { Ok(())=>true,Err(code)=>{eprintln!("[supertaskr] original genesis runtime settlement unavailable: {code}");false} }
}

fn guard_legacy_kit(context: &GenesisContext) -> Result<(), String> {
    context.runtime_record(RuntimeRecord::Transcript, true)?;
    for relative in kit::KIT_FILES
        .iter()
        .map(|file| file.rel)
        .chain(std::iter::once("kit.json"))
    {
        let mut at = context.product.clone();
        let parts = [".supertaskr", "genesis", "kit"]
            .into_iter()
            .chain(relative.split('/'))
            .collect::<Vec<_>>();
        for (position, part) in parts.iter().enumerate() {
            at.push(part);
            match std::fs::symlink_metadata(&at) {
                Ok(meta) => {
                    let last = position + 1 == parts.len();
                    if meta.file_type().is_symlink()
                        || if last {
                            !meta.is_file()
                        } else {
                            !meta.is_dir()
                        }
                    {
                        return Err("genesis-kit-unavailable".into());
                    }
                    #[cfg(unix)]
                    if last {
                        use std::os::unix::fs::MetadataExt;
                        if meta.nlink() != 1 {
                            return Err("genesis-kit-unavailable".into());
                        }
                    }
                }
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
                Err(_) => return Err("genesis-kit-unavailable".into()),
            }
        }
    }
    context.verify_original()
}

/// The command wrapper captures `prepared` before scheduling this work. The
/// selection claim then stays owned until a real Started/Failed observation.
pub fn start_prepared(
    watch: &WatchState,
    agent: &AgentState,
    editor: &RecordEditorState,
    request: Request,
    prepared: PreparedContext,
    action: StartAction,
) -> Reply<StartOutcome> {
    let mut confirmed = None;
    let perform = || -> Result<StartOutcome, String> {
        let Some(flight) = agent.begin_turn() else {
            return Ok(StartOutcome::Busy);
        };
        let context = prepared.context.clone();
        if request.expected_context != context.expected() {
            return Err("genesis-selection-changed".into());
        }
        context.verify(watch)?;
        // The installed service validates setup and current policy before any
        // retained legacy registry-repair or runtime-write path is entered.
        let setup = if context.split() {
            let observed =
                crate::record_editor::inspect_initialized_project(watch, editor, &prepared)?;
            Some(context.initialization_observation(&observed)?)
        } else {
            None
        };
        let record = match sessions::genesis_record_for_context(&context) {
            Ok(record) => record,
            Err(_) if matches!(action, StartAction::Fresh) => {
                context.runtime_record(RuntimeRecord::Sessions, true)?;
                let _ = sessions::load(&context.product);
                None
            }
            Err(_) => return Err("genesis-registry-unavailable".into()),
        };
        if let Some(setup)=setup.as_ref().filter(|_|agent.banking_callback.is_some()) {
            let session=record.as_ref().and_then(|record|record.genesis.as_ref());
            let banking=super::banking::before_turn(agent,editor,&context,session,setup)?;
            context.verify(watch)?;
            if banking.as_ref().is_some_and(|view|view.phase==super::banking::Phase::Recovery) {
                let session=session.ok_or("genesis-bank-original-session-required")?;
                if session.setup.as_ref()!=Some(&setup.original) || session.planner.is_none() {return Err("genesis-bank-original-session-required".into());}
                let active=activate(agent,&prepared,session.clone(),Some(setup.clone()),request.attempt);
                confirmed=Some(active.identity.clone());
                let mut state=agent.inner.lock().expect("agent state poisoned");
                state.project_dir=Some(context.product.clone());state.phase=Phase::Idle;
                state.turn=record.as_ref().map_or(0,|row|row.turns.min(u64::from(u32::MAX)) as u32);
                state.registry_id=record.as_ref().map(|row|row.registry_id.clone());
                state.native_session_id=record.as_ref().and_then(|row|row.native_session_id.clone());
                state.managed=Some(active);
                return Err("genesis-bank-recovery-required".into());
            }
        }
        let probe = docs_watch::probe_plan(&context.records);
        let own_initial_seed = matches!(action, StartAction::Start) && context.split()
            && setup.as_ref().is_some_and(|setup| setup.pristine_seed);
        if matches!(action, StartAction::Fresh) && probe.has_plan()
            || !docs_watch::routes_to_genesis(&probe, sessions::reachability_of(record.as_ref())) && !own_initial_seed
        {
            return Ok(StartOutcome::AlreadyPlanned {
                path: context.product.display().to_string(),
            });
        }
        if let Some(record) = &record {
            if context.split() && !matches!(action, StartAction::Fresh)
                && record.genesis.as_ref().and_then(|session| session.planner.as_ref()).is_none()
            { return Err("genesis-planner-provenance-required".into()); }
            if matches!(action, StartAction::Start) {
                if let Some(id) = &record.native_session_id {
                    return Ok(StartOutcome::ResumeAvailable {
                        native_session_id: id.clone(),
                        turns: record.turns,
                        model: record.model.clone(),
                    });
                }
            }
            if !matches!(action, StartAction::Fresh) {
                if let Some(why) = &record.session_id_rejected {
                    return Ok(StartOutcome::SessionIdRejected {
                        registry_path: sessions::SESSIONS_REL.into(),
                        why: why.clone(),
                    });
                }
            }
        }
        if matches!(action, StartAction::Resume)
            && record
                .as_ref()
                .and_then(|row| row.native_session_id.as_ref())
                .is_none()
        {
            return Ok(StartOutcome::NothingToResume);
        }
        let resuming = matches!(action, StartAction::Resume);
        let retained = if context.split() && resuming {
            Some(record.as_ref().and_then(|record| record.genesis.as_ref()).and_then(|session| session.planner.as_ref()).ok_or("genesis-planner-provenance-required")?)
        } else { None };
        let original = if let Some(planner) = retained { Some(original_planner_decision(watch, editor, &prepared, planner)?) } else { None };
        let adapter = if context.split() {
            let selection = if let Some(planner) = retained { &planner.selection } else {
                setup.as_ref().ok_or("genesis-initialization-required")?.planner.ready()?.0
            };
            if !resuming && selection.harness == "codex" && !matches!(selection.vehicle.as_deref().unwrap_or(&selection.session_policy.default), "fresh" | "subagent") {
                return Err("genesis-planner-vehicle-unavailable".into());
            }
            selection.adapter()?
        } else {
            adapter::planner_adapter()
        };
        let cli = match runner::resolve_cli(&agent.cfg, adapter) {
            Ok(cli) => cli,
            Err(ResolveError::NotFound { probed }) => {
                return Ok(StartOutcome::CliNotFound { probed })
            }
            Err(ResolveError::Unsupported { found }) => {
                return Ok(StartOutcome::UnsupportedVersion { found })
            }
        };
        if let Some(planner) = retained { planner.verify(original.as_ref().ok_or("genesis-planner-provenance-required")?, &cli)?; }
        context.verify(watch)?;
        if !context.split() {
            guard_legacy_kit(&context)?;
            kit::materialize(&context.product).map_err(|_| "genesis-kit-unavailable")?;
        }
        context.runtime_record(RuntimeRecord::Sessions, true)?;
        let registry = sessions::load_read_only(&context.product)
            .map_err(|_| "genesis-registry-unavailable")?;
        let existing = record
            .as_ref()
            .and_then(|record| {
                registry
                    .sessions
                    .iter()
                    .find(|entry| entry.id == record.registry_id)
            })
            .cloned();
        if let (Some(record), Some(entry)) = (&record, &existing) {
            if !record.matches_entry(entry) {
                return Err("genesis-registry-changed".into());
            }
        } else if record.is_some() {
            return Err("genesis-registry-changed".into());
        }
        let mut session = if resuming {
            record
                .as_ref()
                .and_then(|record| record.genesis.clone())
                .unwrap_or_else(|| GenesisSession::new(&context))
        } else {
            GenesisSession::new(&context)
        };
        if let Some(setup) = &setup {
            if resuming {
                let planner = session.planner.as_ref().ok_or("genesis-planner-provenance-required")?;
                planner.verify(original.as_ref().ok_or("genesis-planner-provenance-required")?, &cli)?;
                if existing.as_ref().is_none_or(|entry| entry.agent != planner.selection.harness) { return Err("genesis-original-planner-changed".into()); }
            } else {
                session.planner = Some(super::planner::PlannerSession::capture(&setup.planner, &cli)?);
                session.setup = Some(setup.original.clone());
            }
        }
        let active = activate(agent, &prepared, session, setup, request.attempt);
        let packs = if resuming {
            existing
                .as_ref()
                .map(|entry| entry.skills.clone())
                .unwrap_or_default()
        } else if context.split() {
            Vec::new()
        } else {
            super::report_skills(&context.product).packs
        };
        let native_id = if resuming {
            record
                .as_ref()
                .and_then(|record| record.native_session_id.clone())
        } else {
            None
        };
        let turn = if resuming {
            record
                .as_ref()
                .unwrap()
                .turns
                .saturating_add(1)
                .min(u32::MAX as u64) as u32
        } else {
            1
        };
        if registry.sessions.iter().any(|entry| {
            entry
                .id
                .strip_prefix('S')
                .and_then(|id| id.parse::<u64>().ok())
                == Some(u64::MAX)
        }) {
            return Err("genesis-registry-id-unavailable".into());
        }
        let entry = SessionEntry {
            id: if resuming {
                record.as_ref().unwrap().registry_id.clone()
            } else {
                sessions::next_id(&registry)
            },
            agent: adapter.key.into(),
            model: if resuming {
                record.as_ref().and_then(|record| record.model.clone())
            } else {
                None
            },
            native_session_id: native_id.clone(),
            created: if resuming {
                existing.as_ref().unwrap().created.clone()
            } else {
                sessions::iso8601_utc(runner::now_ms())
            },
            turns: if resuming {
                record.as_ref().unwrap().turns
            } else {
                0
            },
            tasks: Vec::new(),
            roles: vec!["planner".into()],
            status: "running".into(),
            skills: packs.clone(),
            genesis: Some(active.session.clone()),
        };
        let prompt = if context.split() {
            inline_prompt(&active, resuming || matches!(action, StartAction::Fresh))
        } else if resuming {
            kit::assemble_resume_nudge(&context.product)
        } else {
            kit::assemble_kickoff_for_with(&context.product, &packs)
        };
        if own_initial_seed {
            // Version resolution and executable capture may take time. The
            // pristine bootstrap exception must still be true at the final
            // admission before installing a session or launching its planner.
            let observed=crate::record_editor::inspect_initialized_project(watch,editor,&prepared)?;
            let current=context.initialization_observation(&observed)?;
            let original=active.setup.as_ref().ok_or("genesis-initialization-changed")?;
            let (selection,_)=current.planner.ready()?;
            if active.session.planner.as_ref().is_none_or(|planner| &planner.selection!=selection) {
                return Err("genesis-original-planner-changed".into());
            }
            if !current.pristine_seed { return Ok(StartOutcome::AlreadyPlanned {path:context.product.display().to_string()}); }
            if current.setup_id!=original.setup_id || current.receipt_digest!=original.receipt_digest
                || current.request_digest!=original.request_digest || current.product_revision!=original.product_revision
                || current.records_revision!=original.records_revision { return Err("genesis-initialization-current-changed".into()); }
        }
        context.verify(watch)?;
        context.runtime_record(RuntimeRecord::Sessions, true)?;
        sessions::install_current_genesis(&context, &registry, entry.clone())
            .map_err(|_| "genesis-registry-unavailable")?;
        context.runtime_record(RuntimeRecord::Transcript, true)?;
        sessions::append_transcript(
            &context.product,
            &TranscriptLine {
                turn,
                role: "user".into(),
                text: prompt.clone(),
                at_ms: runner::now_ms(),
                machine: true,
                genesis: Some(active.session.transcript_origin()),
            },
        )
        .map_err(|_| "genesis-transcript-unavailable")?;
        {
            let mut state = agent.inner.lock().expect("agent state poisoned");
            agent.cancel.store(false, Ordering::SeqCst);
            state.phase = Phase::Idle;
            state.project_dir = Some(context.product.clone());
            state.turn = turn;
            state.native_session_id = native_id.clone();
            state.model = entry.model.clone();
            state.cli_version = cli.version.clone();
            state.registry_id = Some(entry.id.clone());
            state.last_error = None;
            state.last_event_at_ms = None;
            state.managed = Some(active.clone());
        }
        confirmed = Some(active.identity.clone());
        let startup = start_worker(
            agent,
            prepared,
            active,
            cli,
            entry,
            prompt,
            native_id,
            turn,
            request.attempt,
            flight,
        );
        match startup.recv_timeout(agent.cfg.start_timeout) {
            Ok(Startup::Started) => Ok(StartOutcome::Started { turn }),
            Ok(Startup::Failed(error)) => Err(format!(
                "genesis-planner-start-failed: {}",
                serde_json::to_string(&error).unwrap_or_default()
            )),
            Ok(Startup::Cancelled) => Err("genesis-planner-start-cancelled".into()),
            Err(_) => Err("genesis-planner-start-unconfirmed".into()),
        }
    };
    let result = perform().unwrap_or_else(|message| StartOutcome::Error { message });
    reply(agent, &request, confirmed, result)
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SessionRequest {
    pub expected_context: ExpectedContext,
    pub attempt: u64,
    pub identity: Identity,
}
impl SessionRequest {
    pub fn request(&self) -> Request {
        Request {
            expected_context: self.expected_context,
            attempt: self.attempt,
        }
    }
}
#[derive(Clone, Debug, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum ReadOutcome<T: Serialize> {
    Ready { value: T },
    Error { message: String },
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    pub status: super::GenesisStatus,
    pub record: Option<sessions::GenesisRecord>,
    pub starting: bool,
    pub event_attempt: Option<u64>,
    pub event_context: Option<ExpectedContext>,
    pub banking: Option<super::banking::View>,
}
fn read_reply<T: Serialize>(
    agent: &AgentState,
    request: &Request,
    identity: Option<Identity>,
    value: Result<T, String>,
) -> Reply<ReadOutcome<T>> {
    reply(
        agent,
        request,
        identity,
        match value {
            Ok(value) => ReadOutcome::Ready { value },
            Err(message) => ReadOutcome::Error { message },
        },
    )
}
pub fn read_failed<T: Serialize>(
    agent: &AgentState,
    request: &Request,
    message: String,
) -> Reply<ReadOutcome<T>> {
    read_reply(agent, request, None, Err(message))
}
pub fn send_failed(
    agent: &AgentState,
    request: &Request,
    message: String,
) -> Reply<super::SendOutcome> {
    reply(agent, request, None, super::SendOutcome::Error { message })
}
fn current_activation(agent: &AgentState, request: &SessionRequest) -> Result<Activation, String> {
    let state = agent.inner.lock().expect("agent state poisoned");
    state
        .managed
        .as_ref()
        .filter(|active| active.identity == request.identity)
        .cloned()
        .ok_or_else(|| "genesis-activation-changed".into())
}
fn session_entry(active: &Activation, registry_id: &str) -> Result<SessionEntry, String> {
    active.context.verify_original()?;
    active
        .context
        .runtime_record(RuntimeRecord::Sessions, false)?;
    let registry = sessions::load_read_only(&active.context.product)
        .map_err(|_| "genesis-registry-unavailable")?;
    registry
        .sessions
        .into_iter()
        .find(|row| {
            row.id == registry_id
                && row.genesis.as_ref() == Some(&active.session)
                && row.status != "dead"
        })
        .ok_or_else(|| "genesis-original-registry-entry-changed".into())
}

/// Frozen native selection, original session token and actual human bytes are
/// captured before scheduling. No successor session or path supplies defaults.
pub fn send_prepared(
    watch: &WatchState,
    agent: &AgentState,
    editor: &RecordEditorState,
    request: SessionRequest,
    prepared: PreparedContext,
    text: String,
) -> Reply<super::SendOutcome> {
    let ordinary = request.request();
    let mut confirmed = None;
    let perform = || -> Result<super::SendOutcome, String> {
        if text.len() > sessions::TRANSCRIPT_TEXT_CAP {
            return Err("genesis-answer-too-large".into());
        }
        let Some(flight) = agent.begin_turn() else {
            return Ok(super::SendOutcome::Busy);
        };
        if prepared.context.expected() != request.expected_context {
            return Err("genesis-selection-changed".into());
        }
        prepared.context.verify(watch)?;
        let mut active = current_activation(agent, &request)?;
        active.event_attempt = request.attempt;
        if active.context.origin != prepared.context.origin {
            return Err("genesis-activation-changed".into());
        }
        let (registry_id, turn) = {
            let state = agent.inner.lock().expect("agent state poisoned");
            (
                state.registry_id.clone().ok_or("genesis-no-session")?,
                state.turn.checked_add(1).ok_or("genesis-turn-limit")?,
            )
        };
        let mut entry = session_entry(&active, &registry_id)?;
        let Some(resume) = entry
            .resume_id()
            .map_err(|_| "genesis-session-id-rejected")?
            .map(str::to_owned)
        else {
            return Ok(super::SendOutcome::NoSession);
        };
        if active.context.split() {
            let observed =
                crate::record_editor::inspect_initialized_project(watch, editor, &prepared)?;
            let setup = prepared.context.initialization_observation(&observed)?;
            if active.setup.as_ref().is_none_or(|prior| {
                prior.setup_id != setup.setup_id
                    || prior.request_digest != setup.request_digest
                    || prior.receipt_digest != setup.receipt_digest
            }) {
                return Err("genesis-initialization-changed".into());
            }
            active.setup = Some(setup);
        }
        if let Some(setup)=active.setup.as_ref().filter(|_|agent.banking_callback.is_some()) {
            let banking=super::banking::before_turn(agent,editor,&active.context,Some(&active.session),setup)?;
            prepared.context.verify(watch)?;
            if banking.as_ref().is_some_and(|view|view.phase==super::banking::Phase::Recovery) { return Err("genesis-bank-recovery-required".into()); }
            active.bank_problem=banking.as_ref().and_then(|view|view.code.clone());
            active.bank_ack=banking.and_then(|view|view.receipts.first().cloned()).or(active.bank_ack);
        }
        let adapter = if active.context.split() {
            active.session.planner.as_ref().ok_or("genesis-planner-provenance-required")?.selection.adapter()?
        } else {
            adapter::planner_adapter()
        };
        let cli = match runner::resolve_cli(&agent.cfg, adapter) {
            Ok(cli) => cli,
            Err(ResolveError::NotFound { probed }) => {
                return Ok(super::SendOutcome::CliNotFound { probed })
            }
            Err(ResolveError::Unsupported { .. }) => {
                return Err("genesis-cli-version-unsupported".into())
            }
        };
        if active.context.split() {
            let planner = active.session.planner.as_ref().ok_or("genesis-planner-provenance-required")?;
            planner.verify(&original_planner_decision(watch, editor, &prepared, planner)?, &cli)?;
            if entry.agent != planner.selection.harness { return Err("genesis-original-planner-changed".into()); }
        }
        prepared.context.verify(watch)?;
        if session_entry(&active, &registry_id)? != entry {
            return Err("genesis-registry-changed".into());
        }
        let digest = answer_digest(&text);
        let prompt = if let Some(setup) = &active.setup {
            format!("Original setup: {}. Session: {}. Origin: {}. PRODUCT input: {}. RECORDS input: {}. Validated committed project settings: {}. Human answer reference: turn={}, sha256={}, bytes={}. This digest correlates actual captured text; it does not authenticate an interpretation.{}\n--- HUMAN ANSWER ---\n{}",
                setup.setup_id, active.session.id, active.context.fingerprint(), setup.product_revision, setup.records_revision, setup.settings, turn, digest, text.len(), bank_context(&active, Some((turn, &digest))), text)
        } else {
            text.clone()
        };
        active
            .context
            .runtime_record(RuntimeRecord::Transcript, true)?;
        sessions::append_transcript(
            &active.context.product,
            &TranscriptLine {
                turn,
                role: "user".into(),
                text,
                at_ms: runner::now_ms(),
                machine: false,
                genesis: Some(active.session.transcript_origin()),
            },
        )
        .map_err(|_| "genesis-transcript-unavailable")?;
        entry.status = "running".into();
        active
            .context
            .runtime_record(RuntimeRecord::Sessions, true)?;
        sessions::upsert(&active.context.product, entry.clone())
            .map_err(|_| "genesis-registry-unavailable")?;
        {
            let mut state = agent.inner.lock().expect("agent state poisoned");
            if state
                .managed
                .as_ref()
                .is_none_or(|prior| prior.identity != active.identity)
            {
                return Err("genesis-activation-changed".into());
            }
            agent.cancel.store(false, Ordering::SeqCst);
            state.phase = Phase::Idle;
            state.turn = turn;
            state.last_error = None;
            state.managed = Some(active.clone());
        }
        confirmed = Some(active.identity.clone());
        let startup = start_worker(
            agent,
            prepared,
            active,
            cli,
            entry,
            prompt,
            Some(resume),
            turn,
            request.attempt,
            flight,
        );
        match startup.recv_timeout(agent.cfg.start_timeout) {
            Ok(Startup::Started) => Ok(super::SendOutcome::Accepted { turn }),
            Ok(Startup::Failed(_)) => Err("genesis-planner-start-failed".into()),
            Ok(Startup::Cancelled) => Err("genesis-planner-start-cancelled".into()),
            Err(_) => Err("genesis-planner-start-unconfirmed".into()),
        }
    };
    let result = perform().unwrap_or_else(|message| super::SendOutcome::Error { message });
    reply(agent, &ordinary, confirmed, result)
}

/// Explicit recovery uses the native offered token and exact activation. No
/// model/transcript write or fresh bank capture is permitted by this command.
pub fn replay_bank_prepared(
    watch:&WatchState,agent:&AgentState,editor:&RecordEditorState,
    request:SessionRequest,prepared:PreparedContext,token:String,
)->Reply<ReadOutcome<super::banking::View>> {
    let ordinary=request.request();
    let result=(||{
        let flight=agent.begin_turn().ok_or("genesis-bank-busy")?;
        prepared.context.verify(watch)?;
        if prepared.context.expected()!=request.expected_context {return Err("genesis-selection-changed".into());}
        let mut active=current_activation(agent,&request)?;
        if active.context.origin!=prepared.context.origin || !super::banking::offered(agent,&active,&token) {return Err("genesis-bank-offer-changed".into());}
        active.context.verify_original()?;
        active.event_attempt=request.attempt;
        let turn={
            let mut state=agent.inner.lock().expect("agent state poisoned");
            if state.managed.as_ref().is_none_or(|current|current.identity!=active.identity) {return Err("genesis-activation-changed".into());}
            state.managed=Some(active.clone());agent.cancel.store(false,Ordering::SeqCst);state.turn
        };
        super::banking::finish(agent,editor,super::banking::BankTurn {active:active.clone(),turn,cancel:agent.cancel.clone(),flight});
        super::banking::view(agent,&active.context,&active.session).ok_or_else(||"genesis-bank-response-unavailable".into())
    })();
    read_reply(agent,&ordinary,Some(request.identity),result)
}

pub fn status_prepared(
    watch: &WatchState,
    agent: &AgentState,
    request: Request,
    prepared: PreparedContext,
) -> Reply<ReadOutcome<Status>> {
    // Allocate before the read: a racing newer event must outrank this pull.
    let seq = agent.emitter.next_sequence();
    let mut identity = None;
    let value = (|| {
        if request.expected_context != prepared.context.expected() {
            return Err("genesis-selection-changed".into());
        }
        prepared.context.verify(watch)?;
        let record = sessions::genesis_record_for_context(&prepared.context)
            .map_err(|_| "genesis-registry-unavailable")?;
        prepared.context.verify(watch)?;
        let state = agent.inner.lock().expect("agent state poisoned");
        let active = state
            .managed
            .as_ref()
            .filter(|a| a.context.origin == prepared.context.origin);
        identity = active.map(|a| a.identity.clone());
        let status = super::GenesisStatus {
            phase: if active.is_some() {
                state.phase
            } else {
                Phase::Idle
            },
            project_dir: Some(prepared.context.product.display().to_string()),
            turn: if active.is_some() { state.turn } else { 0 },
            native_session_id: if active.is_some() {
                state.native_session_id.clone()
            } else {
                None
            },
            cli_version: if active.is_some() {
                state.cli_version.clone()
            } else {
                None
            },
            method_version: kit::METHOD_SNAPSHOT_VERSION.into(),
            last_error: if active.is_some() {
                state.last_error.clone()
            } else {
                None
            },
            last_event_at_ms: if active.is_some() {
                state.last_event_at_ms
            } else {
                None
            },
        };
        let banking=active.and_then(|active|super::banking::view(agent,&active.context,&active.session))
            .or_else(||record.as_ref().and_then(|record|record.genesis.as_ref()).and_then(|session|super::banking::view(agent,&prepared.context,session)));
        Ok(Status {
            status,
            record,
            starting: active.is_some()
                && agent.running.load(Ordering::SeqCst)
                && state.phase == Phase::Idle,
            event_attempt: active.map(|active| active.event_attempt),
            event_context: active.map(|active| active.context.expected()),
            banking,
        })
    })();
    Reply {
        context: request.expected_context,
        attempt: request.attempt,
        identity,
        seq,
        result: match value {
            Ok(value) => ReadOutcome::Ready { value },
            Err(message) => ReadOutcome::Error { message },
        },
    }
}

pub fn transcript_prepared(
    watch: &WatchState,
    agent: &AgentState,
    request: Request,
    prepared: PreparedContext,
) -> Reply<ReadOutcome<Vec<TranscriptLine>>> {
    let value = (|| {
        if request.expected_context != prepared.context.expected() {
            return Err("genesis-selection-changed".into());
        }
        prepared.context.verify(watch)?;
        let record = sessions::genesis_record_for_context(&prepared.context)
            .map_err(|_| "genesis-registry-unavailable")?;
        prepared
            .context
            .runtime_record(RuntimeRecord::Transcript, false)?;
        let origin = record
            .as_ref()
            .and_then(|r| r.genesis.as_ref())
            .map(GenesisSession::transcript_origin);
        let lines =
            sessions::read_transcript_tail(&prepared.context.product, super::MAX_REHYDRATED_LINES)
                .into_iter()
                .filter(|line| match (&line.genesis, &origin) {
                    (Some(a), Some(b)) => a == b,
                    (None, None) => !prepared.context.split(),
                    _ => false,
                })
                .map(|mut line| {
                    line.text = sessions::truncate_utf8(&line.text, runner::MAX_EVENT_TEXT);
                    line
                })
                .collect();
        prepared.context.verify(watch)?;
        Ok(lines)
    })();
    read_reply(agent, &request, None, value)
}

/// Cancellation can address the offered original activation after navigation.
/// The handle is captured under that activation's lock; no latest-job fallback.
pub fn cancel_scoped(
    agent: &AgentState,
    request: SessionRequest,
) -> Reply<ReadOutcome<super::CancelOutcome>> {
    let ordinary = request.request();
    let value = (|| {
        if request.attempt == 0 || request.attempt > 9_007_199_254_740_991 {
            return Err("genesis-request-attempt-invalid".into());
        }
        let state = agent.inner.lock().expect("agent state poisoned");
        state
            .managed
            .as_ref()
            .filter(|a| {
                a.identity == request.identity && a.context.expected() == request.expected_context
            })
            .ok_or("genesis-activation-changed")?;
        // The exact offered activation owns this process even if its old
        // directory disappeared. Filesystem checks remain on callback writes.
        let handle = agent.child.lock().expect("child slot poisoned").clone();
        if !agent.running.load(Ordering::SeqCst) {
            return Ok(super::CancelOutcome::Idle);
        }
        agent.cancel.store(true, Ordering::SeqCst);
        if let Some(handle) = handle {
            runner::terminate_group_async(&handle, agent.cfg.kill_grace);
        }
        Ok(super::CancelOutcome::Cancelled { turn: state.turn })
    })();
    read_reply(agent, &ordinary, Some(request.identity), value)
}

/// Preserve the existing manual colocated seam with finite runtime guards.
/// Split manual banking needs the same explicit backend bank service as the
/// automated planner and remains visibly unavailable until that route exists.
pub(crate) fn kickoff_prepared(
    watch: &WatchState,
    prepared: PreparedContext,
) -> Result<super::KickoffOutcome, String> {
    if prepared.context.split() {
        return Err("genesis-managed-kickoff-unavailable".into());
    }
    prepared.context.verify(watch)?;
    guard_legacy_kit(&prepared.context)?;
    prepared
        .context
        .runtime_record(RuntimeRecord::Sessions, true)?;
    Ok(super::kickoff(watch))
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use std::os::unix::fs::PermissionsExt;
    use std::{
        fs,
        path::PathBuf,
        sync::atomic::AtomicU64,
        time::{Duration, Instant},
    };
    static NEXT: AtomicU64 = AtomicU64::new(0);
    struct Fixture {
        home: PathBuf,
        a: PathBuf,
        b: PathBuf,
        watch: WatchState,
        agent: AgentState,
        events: mpsc::Receiver<Event>,
        editor: RecordEditorState,
    }
    impl Fixture {
        fn new() -> Self {
            Self::with_docs(true)
        }
        fn with_docs(with_docs: bool) -> Self {
            let home = std::env::temp_dir().join(format!(
                "supertaskr-managed-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::SeqCst)
            ));
            fs::create_dir(&home).unwrap();
            let home = home.canonicalize().unwrap();
            let a = home.join("a");
            let b = home.join("b");
            for root in [&a, &b] {
                fs::create_dir(root).unwrap();
                if with_docs {
                    fs::create_dir(root.join("docs")).unwrap();
                }
            }
            let script = home.join("agent.sh");
            fs::write(&script, r##"#!/bin/sh
if [ "$1" = '--version' ]; then
  if [ -f "$SUPERTASKR_MANAGED_DUMP/hold-version" ]; then
    : > "$SUPERTASKR_MANAGED_DUMP/version-ready"
    while [ -f "$SUPERTASKR_MANAGED_DUMP/hold-version" ]; do /bin/sleep 0.01; done
  fi
  echo '2.1.226 (Claude Code)'; exit 0
fi
printf '%s\n' "$@" > "$SUPERTASKR_MANAGED_DUMP/args"
/bin/cat > "$SUPERTASKR_MANAGED_DUMP/prompt"
if [ -f "$SUPERTASKR_MANAGED_DUMP/fail-first" ]; then /bin/rm "$SUPERTASKR_MANAGED_DUMP/fail-first"; exit 17; fi
/bin/pwd > "$SUPERTASKR_MANAGED_DUMP/cwd"
echo '{"type":"system","subtype":"init","session_id":"managed-session","model":"fixture-model"}'
: > "$SUPERTASKR_MANAGED_DUMP/ready"
while [ -f "$SUPERTASKR_MANAGED_DUMP/hold" ]; do /bin/sleep 0.01; done
echo '{"type":"result","subtype":"success","is_error":false,"num_turns":1,"result":"Original planner answer."}'
"##).unwrap();
            fs::set_permissions(&script, fs::Permissions::from_mode(0o700)).unwrap();
            let cfg = runner::RunnerConfig {
                binary_override: Some(script),
                probe_login_shell: false,
                extra_env: vec![("SUPERTASKR_MANAGED_DUMP".into(), home.display().to_string())],
                start_timeout: Duration::from_secs(2),
                stall_timeout: Duration::from_secs(5),
                kill_grace: Duration::from_millis(150),
                ..runner::RunnerConfig::default()
            };
            let (sink, events) = mpsc::channel();
            let agent = AgentState::new_managed(cfg, move |event| {
                let _ = sink.send(event);
            });
            let watch = WatchState::start(None, |_| {});
            if with_docs {
                assert!(matches!(
                    docs_watch::apply_picked_folder(&watch, &a, watch.begin_pick().unwrap()),
                    docs_watch::PickOutcome::Picked { .. }
                ));
            } else {
                assert!(matches!(
                    docs_watch::apply_genesis_folder(&watch, &a, watch.begin_pick().unwrap()),
                    docs_watch::PickOutcome::Genesis { .. }
                ));
            }
            Self {
                home,
                a,
                b,
                watch,
                agent,
                events,
                editor: RecordEditorState::default(),
            }
        }
        fn request(&self, attempt: u64) -> Request {
            let scope = self.watch.message_scope();
            Request {
                attempt,
                expected_context: ExpectedContext {
                    selection_sequence: scope.selection_sequence,
                    context_sequence: scope.context_sequence,
                },
            }
        }
        fn start(&self, attempt: u64, action: StartAction) -> Reply<StartOutcome> {
            let request = self.request(attempt);
            let prepared = prepare(&self.watch, &request).unwrap();
            start_prepared(
                &self.watch,
                &self.agent,
                &self.editor,
                request,
                prepared,
                action,
            )
        }
        fn pick(&self, root: &std::path::Path) {
            assert!(matches!(
                docs_watch::apply_picked_folder(
                    &self.watch,
                    root,
                    self.watch.begin_pick().unwrap()
                ),
                docs_watch::PickOutcome::Picked { .. }
            ));
        }
        fn wait(&self, f: impl Fn() -> bool) {
            let deadline = Instant::now() + Duration::from_secs(5);
            while !f() {
                assert!(
                    Instant::now() < deadline,
                    "controlled native lifecycle did not settle"
                );
                std::thread::sleep(Duration::from_millis(5));
            }
        }
        fn idle(&self) {
            self.wait(|| !self.agent.running.load(Ordering::SeqCst));
        }
        fn status(&self, attempt: u64) -> Reply<ReadOutcome<Status>> {
            let request = self.request(attempt);
            let prepared = prepare(&self.watch, &request).unwrap();
            status_prepared(&self.watch, &self.agent, request, prepared)
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            self.agent.reap_for_exit();
            self.idle();
            self.watch.stop_for_test();
            let _ = fs::remove_dir_all(&self.home);
        }
    }

    #[test]
    fn managed_split_configured_planner_refreshes_current_cuts_and_resumes_only_original_model_and_executable() {
        managed_split_configured_planner_contract(false);
    }

    #[test]
    fn managed_split_codex_planner_cold_resume_keeps_original_provider_after_future_q5_choice() {
        managed_split_configured_planner_contract(true);
    }

    fn managed_split_configured_planner_contract(codex: bool) {
        use crate::workspace::WorkspaceResolver;
        use std::os::unix::fs::MetadataExt;
        let mut fx = Fixture::new();
        let model = if codex { "gpt-6.1-sol" } else { "claude-opus-5" };
        let harness = if codex { "codex" } else { "claude" };
        let requested = if codex { "codex/gpt-6.1-sol@subagent" } else { "claude-opus-5@subagent" };
        let native_id = if codex { "0199a213-81c0-7800-8aa1-bbab2a035a53" } else { "managed-session" };
        if codex {
            let program = fx.agent.cfg.binary_override.as_ref().unwrap();
            let source = fs::read_to_string(program).unwrap()
                .replace("2.1.226 (Claude Code)", "codex-cli 0.165.0-alpha.1.2")
                .replace(r#"{"type":"system","subtype":"init","session_id":"managed-session","model":"fixture-model"}"#,
                    r#"{"type":"thread.started","thread_id":"0199a213-81c0-7800-8aa1-bbab2a035a53"}"#)
                .replace(r#"echo '{"type":"result","subtype":"success","is_error":false,"num_turns":1,"result":"Original planner answer."}'"#,
                    "echo '{\"type\":\"item.completed\",\"item\":{\"id\":\"answer\",\"type\":\"agent_message\",\"text\":\"Original planner answer.\"}}'\necho '{\"type\":\"turn.completed\",\"usage\":{\"input_tokens\":10,\"cached_input_tokens\":0,\"output_tokens\":5}}'");
            fs::write(program, source).unwrap();
        }
        let roadmap=kit::KIT_FILES.iter().find(|file|file.rel=="docs-templates/ROADMAP.md").unwrap().content;
        fs::write(fx.b.join("docs/ROADMAP.md"),roadmap).unwrap();
        let git = |root: &std::path::Path, args: &[&str]| {
            let out = std::process::Command::new("git").args(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","-C"])
                .arg(root).args(args).output().unwrap();
            assert!(out.status.success(),"{}",String::from_utf8_lossy(&out.stderr));
            String::from_utf8(out.stdout).unwrap().trim().to_owned()
        };
        for root in [&fx.a, &fx.b] {
            git(root,&["init","-q"]); fs::write(root.join(".gitignore"),".supertaskr/\n").unwrap();
            fs::write(root.join("seed.txt"),"Actual ordinary split consumer fixture\n").unwrap();
            git(root,&["add","."]); git(root,&["commit","-qm","Initial fixture history"]);
        }
        let resolver=WorkspaceResolver::new().unwrap();
        let p=resolver.measure_product_identity(&fx.a,"HEAD").unwrap();
        fs::write(fx.b.join("workspace-association.json"),serde_json::json!({"version":1,"projectId":"configured-planner-fixture",
            "product":{"objectFormat":p.object_format,"rootCommits":p.root_commits}}).to_string()).unwrap();
        git(&fx.b,&["add","."]); git(&fx.b,&["commit","-qm","Associate fixture notes"]);
        fs::create_dir_all(fx.a.join(".supertaskr")).unwrap();
        fs::write(fx.a.join(".supertaskr/workspace.json"),serde_json::json!({"version":1,"projectId":"configured-planner-fixture","productRoot":fx.a,"recordsRoot":fx.b}).to_string()).unwrap();
        fx.pick(&fx.a);
        let context=GenesisContext::capture(&fx.watch,None).unwrap(); assert!(context.split());
        let initial_revision=git(&fx.a,&["rev-parse","HEAD"]);
        let initial_records_revision=git(&fx.b,&["rev-parse","HEAD"]);
        let wire = || {
            let current=GenesisContext::capture(&fx.watch,None).unwrap();
            let origin=serde_json::to_value(&current.origin).unwrap();
            let directory=|at:PathBuf| { let s=fs::metadata(&at).unwrap(); serde_json::json!({"path":at,"device":s.dev().to_string(),"inode":s.ino().to_string()}) };
            let repository=|role:&str| {
                let entry=&origin[role];let common=entry["commonDirectory"]["path"].as_str().unwrap();
                serde_json::json!({"root":entry["root"]["path"],"gitDir":entry["gitDirectory"]["path"],"commonDir":common,
                    "identities":[entry["root"],entry["gitDirectory"],entry["commonDirectory"],directory(PathBuf::from(common).join("objects"))]})
            };
            let revision=git(&fx.a,&["rev-parse","HEAD"]);
            serde_json::json!({"status":"current","installation":{"runtimeKit":"verified"},"planning":{"pristineSeed":true},
                "receipt":{"status":"initialized","operationId":"init-controlled-model","projectId":"configured-planner-fixture",
                    "requestDigest":format!("sha256:{}","a".repeat(64)),"receiptDigest":format!("sha256:{}","b".repeat(64)),
                    "product":{"root":fx.a,"commit":initial_revision},"records":{"root":fx.b,"commit":initial_records_revision}},
                "current":{"productRevision":revision,"recordsRevision":git(&fx.b,&["rev-parse","HEAD"]),"product":repository("product"),"records":repository("records"),
                    "association":{"projectId":"configured-planner-fixture"},"docs":origin["docs"],"runtime":origin["runtime"]},
                "settings":{"version":1,"languages":[]},"settingsProvenance":{"kind":"committed","productRoot":fx.a,"productRevision":revision,
                    "configDigest":format!("sha256:{}","c".repeat(64)),"tool":{"methodVersion":kit::METHOD_SNAPSHOT_VERSION,"manifestDigest":"d".repeat(64)}},
                "planner":{"status":"ready","selection":{"role":"planner","requested":requested,"harness":harness,"model":model,"vehicle":"subagent",
                    "sessionPolicy":{"default":"fresh","warnAfterTurns":30}},"provenance":{"configurationDigest":format!("sha256:{}","c".repeat(64)),"productRevision":revision,"toolManifestDigest":"d".repeat(64)}}})
        };
        let observation=fx.home.join("current.json"); fs::write(&observation,wire().to_string()).unwrap();
        let original_observation=fx.home.join("original-planner.json"); fs::write(&original_observation,wire().to_string()).unwrap();
        let tool=fx.home.join("supertaskr");
        fs::write(&tool,format!(r#"#!/usr/bin/env node
const fs=require('node:fs');const q=JSON.parse(fs.readFileSync(0,'utf8'));
if(JSON.stringify(process.argv.slice(2))!=='["init","--stdio"]'||!['inspect','planner'].includes(q.operation)||q.productRoot!=={})process.exit(91);
if(q.operation==='planner'&&q.productRevision!=={})process.exit(92);
const file=q.operation==='planner'?{}:{};
process.stdout.write(JSON.stringify({{version:1,requestId:q.requestId,ok:true,result:JSON.parse(fs.readFileSync(file))}}));
"#,serde_json::to_string(&fx.a).unwrap(),serde_json::to_string(&initial_revision).unwrap(),serde_json::to_string(&original_observation).unwrap(),serde_json::to_string(&observation).unwrap())).unwrap();
        fs::set_permissions(&tool,fs::Permissions::from_mode(0o700)).unwrap();
        fx.editor=RecordEditorState::with_controlled_program(tool);
        let mut unsupported=wire();unsupported["planner"]=serde_json::json!({"status":"cannot-run","code":3,"reason":"project-role-harness-unsupported","diagnostics":["Explicit supported planner required"]});
        fs::write(&observation,unsupported.to_string()).unwrap();
        assert!(matches!(fx.start(1,StartAction::Start).result,StartOutcome::Error {ref message} if message=="genesis-planner-unavailable:project-role-harness-unsupported"));
        assert!(!fx.home.join("args").exists());assert!(!fx.a.join(sessions::SESSIONS_REL).exists());
        assert_eq!(fx.watch.project_dir().as_deref(),Some(fx.a.as_path()));
        fs::write(fx.b.join("docs/ROADMAP.md"),"Existing owner's changed plan\n").unwrap();
        let mut edited=wire();edited["planning"]["pristineSeed"]=false.into();fs::write(&observation,edited.to_string()).unwrap();
        assert!(matches!(fx.start(2,StartAction::Start).result,StartOutcome::AlreadyPlanned {..}));
        fs::write(fx.b.join("docs/ROADMAP.md"),roadmap).unwrap();
        fs::write(&observation,wire().to_string()).unwrap();
        assert!(matches!(fx.start(3,StartAction::Fresh).result,StartOutcome::AlreadyPlanned {..}),"Fresh keeps its bare plan guard even for owned seed");
        assert!(!fx.home.join("args").exists());assert!(!fx.a.join(sessions::SESSIONS_REL).exists());
        fs::write(fx.home.join("hold-version"),"ordinary resolution barrier").unwrap();
        let request=fx.request(4);let prepared=prepare(&fx.watch,&request).unwrap();
        let changed_during_resolution=std::thread::scope(|scope| {
            let watch=&fx.watch;let agent=&fx.agent;let editor=&fx.editor;
            let task=scope.spawn(move ||start_prepared(watch,agent,editor,request,prepared,StartAction::Start));
            fx.wait(||fx.home.join("version-ready").exists());
            fs::write(fx.b.join("docs/ROADMAP.md"),"Owner plan changed while resolving the CLI\n").unwrap();
            let mut changed=wire();changed["planning"]["pristineSeed"]=false.into();fs::write(&observation,changed.to_string()).unwrap();
            fs::remove_file(fx.home.join("hold-version")).unwrap();task.join().unwrap()
        });
        assert!(matches!(changed_during_resolution.result,StartOutcome::AlreadyPlanned {..}));
        assert!(!fx.home.join("args").exists());assert!(!fx.a.join(sessions::SESSIONS_REL).exists());
        fs::write(fx.b.join("docs/ROADMAP.md"),roadmap).unwrap();fs::write(&observation,wire().to_string()).unwrap();
        let started=fx.start(5,StartAction::Start); assert!(matches!(started.result,StartOutcome::Started {..}),"{started:?}"); fx.idle();
        let first=sessions::genesis_record_for_context(&context).unwrap().unwrap();
        let planner=first.genesis.as_ref().unwrap().planner.as_ref().unwrap();
        let original_setup=first.genesis.as_ref().unwrap().setup.as_ref().unwrap();
        assert_eq!(original_setup.operation_id,"init-controlled-model");
        assert_eq!(original_setup.product_revision,initial_revision);
        assert_eq!(original_setup.records_revision,initial_records_revision);
        assert_eq!(planner.selection.model,model);
        let registry: sessions::SessionsFile = serde_json::from_slice(&fs::read(fx.a.join(sessions::SESSIONS_REL)).unwrap()).unwrap();
        assert_eq!(registry.sessions.iter().find(|entry|entry.id==first.registry_id).unwrap().agent,harness);
        assert_eq!(first.model.as_deref(),if codex { None } else { Some("fixture-model") });
        assert_eq!(first.native_session_id.as_deref(),Some(native_id));
        assert_eq!(planner.provenance.product_revision,initial_revision);
        let machine = |prompt: &str| -> serde_json::Value {
            serde_json::from_str(prompt.split_once("<supertaskr-bank-context-v1>\n").unwrap().1
                .split_once("\n</supertaskr-bank-context-v1>").unwrap().0).unwrap()
        };
        let kickoff = fs::read_to_string(fx.home.join("prompt")).unwrap();
        let initial_context = machine(&kickoff);
        assert_eq!(initial_context["setupId"],"init-controlled-model");
        assert_eq!(initial_context["sessionId"],first.genesis.as_ref().unwrap().id);
        assert_eq!(initial_context["originDigest"],context.fingerprint());
        assert_eq!(initial_context["expectedProductRevision"],initial_revision);
        assert_eq!(initial_context["expectedRecordsRevision"],initial_records_revision);
        assert_eq!(initial_context["answerRefs"],serde_json::json!([]));
        assert!(kickoff.contains(if codex { "native file edit/apply_patch" } else { "Do not invoke shell tools" }));
        assert_eq!(fs::read_to_string(fx.home.join("cwd")).unwrap().trim(),fx.b.to_str().unwrap());
        assert!(fs::read_to_string(fx.home.join("args")).unwrap().contains(&format!("--model\n{model}\n")));
        assert_eq!(fs::read_dir(fx.a.join("docs")).unwrap().count(),0,"no PRODUCT scaffold from split planner");

        fs::write(fx.a.join("later.txt"),"Later ordinary PRODUCT fixture cut\n").unwrap();git(&fx.a,&["add","later.txt"]);git(&fx.a,&["commit","-qm","Later product input"]);
        fs::write(fx.b.join("later.txt"),"Later ordinary RECORDS fixture cut\n").unwrap();git(&fx.b,&["add","later.txt"]);git(&fx.b,&["commit","-qm","Later records input"]);
        let mut future=wire();
        future["planner"]["selection"]["harness"]=if codex { "claude" } else { "codex" }.into();
        future["planner"]["selection"]["model"]=if codex { "claude-opus-5" } else { "gpt-6.1-sol" }.into();
        future["planner"]["selection"]["requested"]=if codex { "claude-opus-5@subagent" } else { "codex/gpt-6.1-sol@subagent" }.into();
        fs::write(&observation,future.to_string()).unwrap();
        let expected=fx.request(6); let request=SessionRequest {expected_context:expected.expected_context,attempt:expected.attempt,identity:started.identity.unwrap()};
        let sent=send_prepared(&fx.watch,&fx.agent,&fx.editor,request.clone(),prepare(&fx.watch,&expected).unwrap(),"Original typed answer\n".into());
        assert!(matches!(sent.result,super::super::SendOutcome::Accepted {..}),"{sent:?}");fx.idle();
        let prompt=fs::read_to_string(fx.home.join("prompt")).unwrap();assert!(prompt.contains(&git(&fx.a,&["rev-parse","HEAD"])));assert!(prompt.contains(&git(&fx.b,&["rev-parse","HEAD"])));
        assert!(prompt.ends_with("Original typed answer\n"));
        let answer_context = machine(&prompt);
        assert_eq!(answer_context["expectedProductRevision"],git(&fx.a,&["rev-parse","HEAD"]));
        assert_eq!(answer_context["expectedRecordsRevision"],git(&fx.b,&["rev-parse","HEAD"]));
        use sha2::Digest;
        assert_eq!(answer_context["answerRefs"],serde_json::json!([{"turn":2,"sha256":format!("{:x}",sha2::Sha256::digest(b"Original typed answer\n"))} ]));
        assert!(fs::read_to_string(fx.home.join("args")).unwrap().contains(&format!("--model\n{model}\n")), "future Q5 choice never retargets the original provider/model");

        let cold=AgentState::new_managed(fx.agent.cfg.clone(),|_|{});
        let resume=|attempt| {let request=fx.request(attempt);let prepared=prepare(&fx.watch,&request).unwrap();start_prepared(&fx.watch,&cold,&fx.editor,request,prepared,StartAction::Resume)};
        let resumed=resume(7);assert!(matches!(resumed.result,StartOutcome::Started {..}),"{resumed:?}");fx.wait(||!cold.running.load(Ordering::SeqCst));
        let args=fs::read_to_string(fx.home.join("args")).unwrap();
        assert!(args.contains(&format!("{}\n{native_id}\n",if codex { "--json" } else { "--resume" })),"{args}");
        assert_eq!(args.lines().filter(|arg|*arg==native_id).count(),1);
        assert!(args.contains(&format!("--model\n{model}\n")));assert!(!args.lines().any(|s|s=="subagent"));
        if codex { assert!(args.contains("exec\n--sandbox\nworkspace-write\nresume\n--json\n")); assert!(!args.lines().any(|arg|matches!(arg,"--last"|"--all"|"--ignore-rules"|"--ignore-user-config"))); }
        let current=sessions::genesis_record_for_context(&context).unwrap().unwrap();assert_eq!(current.genesis.as_ref().unwrap().planner.as_ref().unwrap(),planner);
        assert_eq!(current.genesis.as_ref().unwrap().setup.as_ref(),Some(original_setup),"cold resume retains original setup, not current later revisions");
        assert_ne!(original_setup.records_revision,git(&fx.b,&["rev-parse","HEAD"]));
        let registry=fx.a.join(sessions::SESSIONS_REL);let transcript=fx.a.join(sessions::TRANSCRIPT_REL);let stable_registry=fs::read(&registry).unwrap();let stable_transcript=fs::read(&transcript).unwrap();let stable_prompt=fs::read(fx.home.join("prompt")).unwrap();
        let original_wire=fs::read(&original_observation).unwrap();
        let mut changed=wire();changed["planner"]["selection"]["model"]=if codex { "gpt-6-luna" } else { "claude-sonnet-5" }.into();changed["planner"]["selection"]["requested"]=if codex { "codex/gpt-6-luna@subagent" } else { "claude-sonnet-5@subagent" }.into();fs::write(&original_observation,changed.to_string()).unwrap();
        assert!(matches!(resume(8).result,StartOutcome::Error {ref message} if message=="genesis-original-planner-changed"));
        fs::write(&original_observation,original_wire).unwrap();
        let program=fx.agent.cfg.binary_override.as_ref().unwrap();let held=fx.home.join("original-agent");fs::rename(program,&held).unwrap();fs::copy(&held,program).unwrap();
        assert!(matches!(resume(9).result,StartOutcome::Error {ref message} if message=="genesis-original-planner-changed"));
        fs::remove_file(program).unwrap();fs::rename(&held,program).unwrap();
        assert_eq!(fs::read(&registry).unwrap(),stable_registry);assert_eq!(fs::read(&transcript).unwrap(),stable_transcript);assert_eq!(fs::read(fx.home.join("prompt")).unwrap(),stable_prompt);
        let mut old:serde_json::Value=serde_json::from_slice(&stable_registry).unwrap();old["sessions"][0]["genesis"].as_object_mut().unwrap().remove("planner");fs::write(&registry,old.to_string()).unwrap();
        assert!(matches!(resume(10).result,StartOutcome::Error {ref message} if message=="genesis-planner-provenance-required"));
        fs::write(&registry,&stable_registry).unwrap();
        assert!(matches!(resume(11).result,StartOutcome::Started {..}));fx.wait(||!cold.running.load(Ordering::SeqCst));cold.reap_for_exit();
    }

    #[test]
    fn managed_original_turn_settles_a_after_b_navigation_and_resume_has_new_activation() {
        let fx = Fixture::new();
        fs::write(fx.home.join("hold"), "").unwrap();
        let started = fx.start(1, StartAction::Start);
        assert!(
            matches!(started.result, StartOutcome::Started { turn: 1 }),
            "{started:?}"
        );
        let original = started.identity.unwrap();
        fx.wait(|| fx.home.join("ready").exists());
        fx.pick(&fx.b);
        let status = fx.status(2);
        assert!(status.identity.is_none());
        let ReadOutcome::Ready { value } = status.result else {
            panic!("B status must be available");
        };
        assert!(value.record.is_none());
        assert_eq!(value.status.phase, Phase::Idle);
        assert_eq!(value.status.turn, 0);
        let request = fx.request(3);
        let prepared = prepare(&fx.watch, &request).unwrap();
        assert!(
            matches!(transcript_prepared(&fx.watch, &fx.agent, request, prepared).result, ReadOutcome::Ready { value } if value.is_empty())
        );
        fs::remove_file(fx.home.join("hold")).unwrap();
        fx.idle();
        assert!(!fx.b.join(sessions::SESSIONS_REL).exists());
        assert!(!fx.b.join(sessions::TRANSCRIPT_REL).exists());
        let original_lines = sessions::read_transcript(&fx.a);
        assert!(original_lines
            .iter()
            .any(|line| line.text == "Original planner answer."
                && line
                    .genesis
                    .as_ref()
                    .is_some_and(|origin| origin.session_id == original.session_id)));
        assert!(fx.events.try_iter().all(|event| event.identity == original
            && event.attempt == 1
            && event.context == started.context));
        fx.pick(&fx.a);
        let resumed = fx.start(4, StartAction::Resume);
        assert!(matches!(resumed.result, StartOutcome::Started { turn: 2 }));
        let successor = resumed.identity.unwrap();
        assert_eq!(successor.session_id, original.session_id);
        assert_ne!(successor.token, original.token);
        assert!(successor.activation > original.activation);
        let stale = cancel_scoped(
            &fx.agent,
            SessionRequest {
                expected_context: started.context,
                attempt: 5,
                identity: original,
            },
        );
        assert!(
            matches!(stale.result, ReadOutcome::Error { message } if message == "genesis-activation-changed")
        );
        fx.idle();
        assert_eq!(
            sessions::load_read_only(&fx.a).unwrap().sessions[0].turns,
            2
        );
    }

    #[test]
    fn managed_send_retains_exact_human_bytes_and_captured_activation_cancel_works_after_navigation(
    ) {
        let fx = Fixture::new();
        let started = fx.start(1, StartAction::Start);
        fx.idle();
        let identity = started.identity.unwrap();
        fs::write(fx.home.join("hold"), "").unwrap();
        let request = SessionRequest {
            expected_context: started.context,
            attempt: 2,
            identity: identity.clone(),
        };
        let prepared = prepare(&fx.watch, &request.request()).unwrap();
        let human = "Exact human message: å\nkeep $literal `bytes`  ";
        let sent = send_prepared(
            &fx.watch,
            &fx.agent,
            &fx.editor,
            request,
            prepared,
            human.into(),
        );
        assert!(matches!(
            sent.result,
            super::super::SendOutcome::Accepted { turn: 2 }
        ));
        fx.wait(|| fs::read_to_string(fx.home.join("prompt")).ok().as_deref() == Some(human));
        assert!(sessions::read_transcript(&fx.a)
            .iter()
            .any(|line| !line.machine && line.role == "user" && line.text == human));
        fx.pick(&fx.b);
        let cancelled = cancel_scoped(
            &fx.agent,
            SessionRequest {
                expected_context: started.context,
                attempt: 3,
                identity,
            },
        );
        assert!(matches!(
            cancelled.result,
            ReadOutcome::Ready {
                value: super::super::CancelOutcome::Cancelled { turn: 2 }
            }
        ));
        fx.idle();
        fs::remove_file(fx.home.join("hold")).unwrap();
        let positive = fx.start(4, StartAction::Start);
        assert!(matches!(positive.result, StartOutcome::Started { turn: 1 }));
        fx.idle();
        assert_eq!(
            sessions::load_read_only(&fx.b).unwrap().sessions[0].turns,
            1
        );
        assert_eq!(
            fs::read_to_string(fx.home.join("cwd")).unwrap().trim_end(),
            fx.b.to_string_lossy()
        );
    }

    #[test]
    fn managed_first_docs_and_reselection_offer_original_session_without_retargeting_callbacks() {
        let fx = Fixture::with_docs(false);
        fs::write(fx.home.join("hold"), "").unwrap();
        let started = fx.start(1, StartAction::Start);
        assert!(
            matches!(started.result, StartOutcome::Started { .. }),
            "{started:?}"
        );
        let original = started.identity.clone().unwrap();
        fx.wait(|| fx.home.join("ready").exists());
        fs::create_dir(fx.a.join("docs")).unwrap();
        fx.wait(|| fx.watch.message_scope().context_sequence > started.context.context_sequence);
        let observed = fx.status(2);
        assert_eq!(observed.identity, Some(original.clone()));
        assert_ne!(observed.context, started.context);
        assert!(
            matches!(observed.result, ReadOutcome::Ready { value } if value.event_context == Some(started.context) && value.status.phase == Phase::Running)
        );
        fs::create_dir(fx.b.join("docs")).unwrap();
        fx.pick(&fx.b);
        assert!(fx.status(3).identity.is_none());
        fx.pick(&fx.a);
        let current = fx.status(4);
        assert_eq!(current.identity, Some(original.clone()));
        assert!(
            matches!(current.result, ReadOutcome::Ready { value } if value.event_context == Some(started.context))
        );
        fs::remove_file(fx.home.join("hold")).unwrap();
        fx.idle();
        assert!(fx
            .events
            .try_iter()
            .all(|event| event.context == started.context && event.identity == original));
        let request = SessionRequest {
            expected_context: fx.request(5).expected_context,
            attempt: 5,
            identity: original,
        };
        let prepared = prepare(&fx.watch, &request.request()).unwrap();
        let sent = send_prepared(
            &fx.watch,
            &fx.agent,
            &fx.editor,
            request,
            prepared,
            "Current A answer".into(),
        );
        assert!(
            matches!(sent.result, super::super::SendOutcome::Accepted { turn: 2 }),
            "{sent:?}"
        );
        fx.idle();
        assert!(!fx.b.join(sessions::SESSIONS_REL).exists());
        assert!(sessions::read_transcript(&fx.a)
            .iter()
            .any(|line| line.text == "Current A answer"));
    }

    #[test]
    fn managed_cancel_stops_exact_owned_child_after_original_root_is_replaced() {
        let fx = Fixture::new();
        fs::write(fx.home.join("hold"), "").unwrap();
        let started = fx.start(1, StartAction::Start);
        assert!(
            matches!(started.result, StartOutcome::Started { .. }),
            "{started:?}"
        );
        fx.wait(|| fx.home.join("ready").exists());
        fs::rename(&fx.a, fx.home.join("a-retired")).unwrap();
        fs::create_dir(&fx.a).unwrap();
        let result = cancel_scoped(
            &fx.agent,
            SessionRequest {
                expected_context: started.context,
                attempt: 2,
                identity: started.identity.unwrap(),
            },
        );
        assert!(
            matches!(
                result.result,
                ReadOutcome::Ready {
                    value: super::super::CancelOutcome::Cancelled { turn: 1 }
                }
            ),
            "{result:?}"
        );
        fx.idle();
        assert!(!fx.a.join(".supertaskr").exists());
        assert!(fx.agent.child.lock().unwrap().is_none());
    }

    #[test]
    fn managed_failed_preinit_retry_is_current_after_cold_reopen_and_resume() {
        let fx = Fixture::new();
        fs::write(fx.home.join("fail-first"), "").unwrap();
        let initial = fx.start(1, StartAction::Start);
        assert!(
            matches!(initial.result, StartOutcome::Started { .. }),
            "{initial:?}"
        );
        fx.idle();
        let failed = sessions::load_read_only(&fx.a).unwrap().sessions[0].clone();
        assert!(failed.native_session_id.is_none());
        assert_eq!(failed.status, "idle");
        let original_active = fx.agent.inner.lock().unwrap().managed.clone().unwrap();
        assert!(fx
            .events
            .try_iter()
            .any(|event| matches!(event.event, RunEvent::Failed { .. })));
        fx.pick(&fx.b);
        let request = fx.request(2);
        let foreign_context = prepare(&fx.watch, &request).unwrap();
        let mut foreign = failed.clone();
        foreign.id = "foreign-origin".into();
        foreign.genesis = Some(GenesisSession::new(&foreign_context.context));
        drop(foreign_context);
        fx.pick(&fx.a);
        sessions::upsert(&fx.a, foreign.clone()).unwrap();
        let retried = fx.start(3, StartAction::Start);
        assert!(
            matches!(retried.result, StartOutcome::Started { turn: 1 }),
            "{retried:?}"
        );
        fx.idle();
        let rows = sessions::load_read_only(&fx.a).unwrap().sessions;
        assert_eq!(
            rows.iter().find(|row| row.id == failed.id).unwrap().status,
            "dead"
        );
        assert_eq!(rows.iter().find(|row| row.id == foreign.id), Some(&foreign));
        let recovered = rows.iter().find(|row| row.id == "S2").unwrap();
        assert_eq!(
            recovered.native_session_id.as_deref(),
            Some("managed-session")
        );
        assert_eq!(recovered.status, "idle");
        let before_rows = rows.clone();
        let before_transcript = fs::read(fx.a.join(sessions::TRANSCRIPT_REL)).unwrap();
        settle_original(
            &original_active,
            failed.clone(),
            &runner::TurnOutcome {
                text: Some("A retired callback cannot revive S1".into()),
                ..Default::default()
            },
            1,
        );
        assert_eq!(
            sessions::load_read_only(&fx.a).unwrap().sessions,
            before_rows
        );
        assert_eq!(
            fs::read(fx.a.join(sessions::TRANSCRIPT_REL)).unwrap(),
            before_transcript
        );
        let cold = AgentState::new_managed(fx.agent.cfg.clone(), |_| {});
        let request = fx.request(4);
        let prepared = prepare(&fx.watch, &request).unwrap();
        let status = status_prepared(&fx.watch, &cold, request, prepared);
        assert!(
            matches!(status.result, ReadOutcome::Ready { value } if value.record.as_ref().is_some_and(|row| row.registry_id == "S2" && row.native_session_id.as_deref() == Some("managed-session")))
        );
        let request = fx.request(5);
        let prepared = prepare(&fx.watch, &request).unwrap();
        let resumed = start_prepared(
            &fx.watch,
            &cold,
            &fx.editor,
            request,
            prepared,
            StartAction::Resume,
        );
        assert!(
            matches!(resumed.result, StartOutcome::Started { turn: 2 }),
            "{resumed:?}"
        );
        assert_ne!(
            resumed.identity.as_ref().unwrap().token,
            retried.identity.as_ref().unwrap().token
        );
        assert_eq!(
            resumed.identity.as_ref().unwrap().session_id,
            retried.identity.as_ref().unwrap().session_id
        );
        fx.wait(|| !cold.running.load(Ordering::SeqCst));
        let rows = sessions::load_read_only(&fx.a).unwrap().sessions;
        assert_eq!(rows.iter().find(|row| row.id == "S2").unwrap().turns, 2);
        assert_eq!(rows.iter().find(|row| row.id == foreign.id), Some(&foreign));
        let reopened = AgentState::new_managed(fx.agent.cfg.clone(), |_| {});
        let request = fx.request(6);
        let prepared = prepare(&fx.watch, &request).unwrap();
        let again = start_prepared(
            &fx.watch,
            &reopened,
            &fx.editor,
            request,
            prepared,
            StartAction::Resume,
        );
        assert!(
            matches!(again.result, StartOutcome::Started { turn: 3 }),
            "{again:?}"
        );
        let previous = resumed.identity.unwrap();
        let next = again.identity.unwrap();
        assert_eq!(
            previous.activation, next.activation,
            "both cold native counters begin at one"
        );
        assert_eq!(previous.session_id, next.session_id);
        assert_ne!(previous.token, next.token);
        fx.wait(|| !reopened.running.load(Ordering::SeqCst));
        assert_eq!(
            sessions::load_read_only(&fx.a)
                .unwrap()
                .sessions
                .iter()
                .find(|row| row.id == "S2")
                .unwrap()
                .turns,
            3
        );
    }

    #[test]
    fn managed_stale_request_is_effect_free_and_status_never_repairs_corrupt_registry() {
        let fx = Fixture::new();
        let request = fx.request(1);
        let prepared = prepare(&fx.watch, &request).unwrap();
        let wrong = Request {
            expected_context: ExpectedContext {
                context_sequence: request.expected_context.context_sequence + 1,
                ..request.expected_context
            },
            ..request
        };
        let refused = start_prepared(
            &fx.watch,
            &fx.agent,
            &fx.editor,
            wrong,
            prepared,
            StartAction::Start,
        );
        assert!(
            matches!(refused.result, StartOutcome::Error { message } if message == "genesis-selection-changed")
        );
        assert!(!fx.a.join(".supertaskr").exists());
        assert!(!fx.home.join("prompt").exists());
        fs::create_dir_all(fx.a.join(".supertaskr")).unwrap();
        fs::write(fx.a.join(sessions::SESSIONS_REL), "not-json").unwrap();
        assert!(
            matches!(fx.status(2).result, ReadOutcome::Error { message } if message == "genesis-registry-unavailable")
        );
        assert_eq!(
            fs::read_to_string(fx.a.join(sessions::SESSIONS_REL)).unwrap(),
            "not-json"
        );
        assert_eq!(fs::read_dir(fx.a.join(".supertaskr")).unwrap().count(), 1);
    }
}
