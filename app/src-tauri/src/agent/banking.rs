//! Receipt-owned managed interview banking. Paths and operation identifiers
//! stay native; the renderer receives original scoped facts and opaque offers.
use std::collections::BTreeMap;
use std::sync::{atomic::Ordering, Arc};

use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::context::{GenesisContext, GenesisSession, InitializedSetup};
use super::managed::{Activation, Identity};
use super::{sessions, AgentState};
use crate::record_editor::{
    invoke_initialization_operation, invoke_owned_bank_operation, InitializationOperation,
    RecordEditorState, SelectedInitializationDirectory,
};

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Receipt {
    pub receipt_digest: String,
    pub stage: u8,
    pub completed_stage: u8,
    pub records_commit: String,
    pub product_commit: Option<String>,
    pub turn: u32,
    pub paths: Vec<String>,
}
#[derive(Clone, Copy, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum Phase {
    Ready,
    Banking,
    Recovery,
    Refused,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct View {
    pub phase: Phase,
    pub recovery_token: Option<String>,
    pub code: Option<String>,
    pub current: bool,
    pub completed_stage: Option<u8>,
    pub receipts: Vec<Receipt>,
    pub cleanup_warnings: Vec<String>,
}
impl Default for View {
    fn default() -> Self {
        Self {
            phase: Phase::Ready,
            recovery_token: None,
            code: None,
            current: false,
            completed_stage: None,
            receipts: Vec::new(),
            cleanup_warnings: Vec::new(),
        }
    }
}
#[derive(Clone)]
struct Pending {
    operation_id: String,
    token: String,
}
#[derive(Clone)]
struct Entry {
    setup_id: String,
    pending: Option<Pending>,
    view: View,
    qualified_revisions: Option<(String, String)>,
}
#[derive(Default)]
pub(super) struct State {
    entries: BTreeMap<String, Entry>,
}

/// Constructed only after the actual original child has ceased and registry
/// settlement succeeds. Holding the caller's TurnInFlight covers this callback.
pub(crate) struct BankTurn {
    pub(super) active: Activation,
    pub(super) turn: u32,
    pub(super) cancel: Arc<std::sync::atomic::AtomicBool>,
    pub(super) flight: super::TurnInFlight,
}
#[derive(Clone, Debug, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum Notice {
    Banking { seq: u64, view: View },
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Event {
    #[serde(flatten)]
    pub context: super::context::ExpectedContext,
    pub attempt: u64,
    pub identity: Identity,
    pub event: Notice,
}

fn key(context: &GenesisContext, session: &GenesisSession) -> String {
    format!("{}:{}", context.fingerprint(), session.id)
}
fn unique(prefix: &str) -> String {
    static NEXT: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
    format!(
        "{prefix}-{}-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos(),
        NEXT.fetch_add(1, Ordering::SeqCst)
    )
}
fn ensure<'a>(
    state: &'a mut State,
    context: &GenesisContext,
    session: &GenesisSession,
    setup: &InitializedSetup,
) -> Result<&'a mut Entry, String> {
    let key = key(context, session);
    if !state.entries.contains_key(&key) && state.entries.len() >= 128 {
        return Err("genesis-bank-recovery-capacity".into());
    }
    let entry = state.entries.entry(key).or_insert_with(|| Entry {
        setup_id: setup.setup_id.clone(),
        pending: None,
        view: View::default(),
        qualified_revisions: None,
    });
    if entry.setup_id != setup.setup_id {
        return Err("genesis-initialization-changed".into());
    }
    Ok(entry)
}
pub(super) fn view(
    agent: &AgentState,
    context: &GenesisContext,
    session: &GenesisSession,
) -> Option<View> {
    let entry = agent
        .banking
        .lock()
        .expect("bank state poisoned")
        .entries
        .get(&key(context, session))
        .cloned()?;
    let mut view = entry.view;
    if view.current
        && entry
            .qualified_revisions
            .as_ref()
            .is_none_or(|(product, records)| {
                context.current_revisions_match(product, records) != Ok(true)
            })
    {
        view.current = false;
        view.completed_stage = None;
    }
    Some(view)
}
/// Called under the managed turn/selection claims before transcript or model
/// effects. A missing canonical row never retires retained RAM unknown intent.
pub(super) fn before_turn(
    agent: &AgentState,
    editor: &RecordEditorState,
    context: &GenesisContext,
    session: Option<&GenesisSession>,
    setup: &InitializedSetup,
) -> Result<Option<View>, String> {
    let prefix = format!("{}:", context.fingerprint());
    if agent
        .banking
        .lock()
        .expect("bank state poisoned")
        .entries
        .iter()
        .any(|(key, entry)| {
            key.starts_with(&prefix)
                && entry.setup_id == setup.setup_id
                && entry.pending.is_some()
                && session.is_none_or(|session| key != &format!("{prefix}{}", session.id))
        })
    {
        return Err("genesis-bank-original-session-required".into());
    }
    if let Some(session) = session {
        return refresh(agent, editor, context, session, setup).map(Some);
    }
    let product = SelectedInitializationDirectory::capture(&context.product)?;
    let result = invoke_initialization_operation(
        editor,
        &InitializationOperation::Banks { product },
        &|| context.verify_original(),
    )
    .map_err(|error| error.code)?;
    if result["status"] != "banks" {
        return Err("genesis-bank-response-unavailable".into());
    }
    if result["banks"]
        .as_array()
        .ok_or("genesis-bank-response-unavailable")?
        .iter()
        .any(|row| {
            row["setupId"].as_str() == Some(setup.setup_id.as_str()) && row["state"] != "banked"
        })
    {
        return Err("genesis-bank-original-session-required".into());
    }
    Ok(None)
}

pub(super) fn offered(agent: &AgentState, active: &Activation, token: &str) -> bool {
    !token.is_empty()
        && agent
            .banking
            .lock()
            .expect("bank state poisoned")
            .entries
            .get(&key(&active.context, &active.session))
            .and_then(|entry| entry.pending.as_ref())
            .is_some_and(|pending| pending.token == token)
}
fn guard(active: &Activation) -> Result<(), String> {
    active.context.verify_original()?;
    active
        .context
        .runtime_record(super::context::RuntimeRecord::Sessions, false)?;
    let row = sessions::genesis_record_for_context(&active.context)
        .map_err(|_| "genesis-registry-unavailable")?
        .ok_or("genesis-original-registry-entry-changed")?;
    if row.genesis.as_ref() != Some(&active.session) {
        return Err("genesis-original-registry-entry-changed".into());
    }
    Ok(())
}
fn notify(agent: &AgentState, active: &Activation) {
    if let (Some(sink), Some(view)) = (
        &agent.banking_sink,
        view(agent, &active.context, &active.session),
    ) {
        sink(Event {
            context: active.context.expected(),
            attempt: active.event_attempt,
            identity: active.identity.clone(),
            event: Notice::Banking {
                seq: agent.emitter.next_sequence(),
                view,
            },
        });
    }
}
fn string(value: &Value) -> Result<String, String> {
    value
        .as_str()
        .map(str::to_owned)
        .ok_or_else(|| "genesis-bank-response-unavailable".into())
}
fn oid(value: &Value) -> Result<String, String> {
    let value = string(value)?;
    if ![40, 64].contains(&value.len())
        || !value
            .bytes()
            .all(|v| v.is_ascii_hexdigit() && !v.is_ascii_uppercase())
    {
        return Err("genesis-bank-response-unavailable".into());
    }
    Ok(value)
}
fn receipt(value: &Value, turn: u32, paths: Vec<String>) -> Result<Receipt, String> {
    let digest = string(&value["receiptDigest"])?;
    let stage = value["stage"]
        .as_u64()
        .filter(|n| *n <= 8)
        .ok_or("genesis-bank-response-unavailable")? as u8;
    let completed = value["completedStage"]
        .as_u64()
        .filter(|n| *n <= 8 && *n >= u64::from(stage))
        .ok_or("genesis-bank-response-unavailable")? as u8;
    if value["status"] != "banked"
        || digest.strip_prefix("sha256:").is_none_or(|s| {
            s.len() != 64
                || !s
                    .bytes()
                    .all(|v| v.is_ascii_hexdigit() && !v.is_ascii_uppercase())
        })
    {
        return Err("genesis-bank-response-unavailable".into());
    }
    Ok(Receipt {
        receipt_digest: digest,
        stage,
        completed_stage: completed,
        records_commit: oid(&value["records"]["commit"])?,
        product_commit: if value["product"].is_null() {
            None
        } else {
            Some(oid(&value["product"]["commit"])?)
        },
        turn,
        paths,
    })
}

/// Read-only canonical discovery. RAM unknown intent remains pending even if
/// its response was lost before OP publication; absence cannot recapture it.
pub(super) fn refresh(
    agent: &AgentState,
    editor: &RecordEditorState,
    context: &GenesisContext,
    session: &GenesisSession,
    setup: &InitializedSetup,
) -> Result<View, String> {
    context.verify_original()?;
    let product = SelectedInitializationDirectory::capture(&context.product)?;
    let result = invoke_initialization_operation(
        editor,
        &InitializationOperation::Banks { product },
        &|| context.verify_original(),
    )
    .map_err(|error| error.code)?;
    if result["status"] != "banks" {
        return Err("genesis-bank-response-unavailable".into());
    }
    let rows = result["banks"]
        .as_array()
        .ok_or("genesis-bank-response-unavailable")?;
    let origin =
        serde_json::to_value(&context.origin).map_err(|_| "genesis-bank-response-unavailable")?;
    let mut pending = None;
    for row in rows.iter().filter(|row| {
        row["setupId"].as_str() == Some(setup.setup_id.as_str()) && row["state"] != "banked"
    }) {
        if row["origin"] != origin
            || row["sessionId"].as_str() != Some(session.id.as_str())
            || row["originDigest"].as_str() != Some(context.fingerprint().as_str())
        {
            return Err("genesis-bank-original-session-required".into());
        }
        if pending.is_some() {
            return Err("genesis-bank-recovery-ambiguous".into());
        }
        pending = Some(string(&row["operationId"])?);
    }
    let mut qualified = None;
    let current = &result["current"];
    if current["status"] == "current"
        && current["setupId"].as_str() == Some(setup.setup_id.as_str())
        && current["sessionId"].as_str() == Some(session.id.as_str())
        && current["originDigest"].as_str() == Some(context.fingerprint().as_str())
        && current["productRevision"].as_str() == Some(setup.product_revision.as_str())
        && current["recordsRevision"].as_str() == Some(setup.records_revision.as_str())
    {
        let mut receipts = Vec::new();
        for bank in current["banks"]
            .as_array()
            .ok_or("genesis-bank-response-unavailable")?
        {
            let turn = bank["turn"]
                .as_u64()
                .and_then(|n| u32::try_from(n).ok())
                .filter(|n| *n > 0)
                .ok_or("genesis-bank-response-unavailable")?;
            let paths = bank["paths"]
                .as_array()
                .ok_or("genesis-bank-response-unavailable")?
                .iter()
                .map(string)
                .collect::<Result<Vec<_>, _>>()?;
            receipts.push(receipt(&bank["receipt"], turn, paths)?);
        }
        let completed = current["completedStage"]
            .as_u64()
            .and_then(|n| u8::try_from(n).ok())
            .filter(|n| *n <= 8);
        if completed != receipts.iter().map(|row| row.completed_stage).max() {
            return Err("genesis-bank-response-unavailable".into());
        }
        qualified = Some((receipts, completed));
    }
    context.verify_original()?;
    let mut state = agent.banking.lock().expect("bank state poisoned");
    let entry = ensure(&mut state, context, session, setup)?;
    if let Some(operation_id) = pending {
        match &entry.pending {
            Some(old) if old.operation_id != operation_id => {
                return Err("genesis-bank-recovery-ambiguous".into())
            }
            None => {
                entry.pending = Some(Pending {
                    operation_id,
                    token: unique("bank-offer"),
                })
            }
            _ => {}
        }
    }
    if let Some((receipts, completed)) = qualified {
        entry.view.receipts = receipts;
        entry.view.completed_stage = completed;
        entry.view.current = true;
        entry.qualified_revisions = Some((
            setup.product_revision.clone(),
            setup.records_revision.clone(),
        ));
    } else {
        entry.view.current = false;
        entry.view.completed_stage = None;
    }
    if let Some(pending) = &entry.pending {
        entry.view.phase = Phase::Recovery;
        entry.view.recovery_token = Some(pending.token.clone());
        entry.view.code = Some("genesis-bank-recovery-required".into());
    }
    Ok(entry.view.clone())
}

/// No caller can choose another path, source overlay or executable. The
/// original setup cuts are frozen before the fixed native Bank request starts.
pub(crate) fn finish(agent: &AgentState, editor: &RecordEditorState, turn: BankTurn) {
    let BankTurn {
        active,
        turn,
        cancel,
        flight,
    } = turn;
    let active = &active;
    let Some(setup) = &active.setup else {
        return;
    };
    let original = key(&active.context, &active.session);
    let prepared = (|| {
        guard(active)?;
        let mut state = agent.banking.lock().expect("bank state poisoned");
        let entry = ensure(&mut state, &active.context, &active.session, setup)?;
        let prior = entry.view.clone();
        let replay = entry.pending.is_some();
        let pending = entry
            .pending
            .get_or_insert_with(|| Pending {
                operation_id: unique("bank"),
                token: unique("bank-offer"),
            })
            .clone();
        entry.view.phase = Phase::Banking;
        entry.view.recovery_token = Some(pending.token.clone());
        entry.view.code = None;
        entry.view.current = false;
        entry.view.completed_stage = None;
        Ok::<_, String>((pending, replay, prior))
    })();
    let (pending, replay, prior) = match prepared {
        Ok(value) => value,
        Err(code) => {
            refused(agent, active, code);
            drop(flight);
            notify(agent, active);
            return;
        }
    };
    notify(agent, active);
    let result =
        (|| {
            let product = SelectedInitializationDirectory::capture(&active.context.product)
                .map_err(|code| crate::record_editor::InitializationFailure {
                    message: code.clone(),
                    code,
                    unknown: replay,
                })?;
            let operation = if replay {
                InitializationOperation::BankReplay {
                    product,
                    operation_id: pending.operation_id.clone(),
                }
            } else {
                InitializationOperation::Bank {
                    product,
                    operation_id: pending.operation_id.clone(),
                    session_id: active.session.id.clone(),
                    origin_digest: active.context.fingerprint(),
                    expected_product_revision: setup.product_revision.clone(),
                    expected_records_revision: setup.records_revision.clone(),
                }
            };
            invoke_owned_bank_operation(editor, &operation, &|| guard(active), cancel)
        })();
    let mut accepted = None;
    {
        let mut state = agent.banking.lock().expect("bank state poisoned");
        let entry = state
            .entries
            .get_mut(&original)
            .expect("bank entry retained");
        match result {
            Ok(value) if value["status"] == "unchanged" && !replay => {
                // Keep the existing acknowledgement/cuts. This historical
                // response cannot manufacture another banked chip.
                if receipt(&value["receipt"], turn, Vec::new()).is_ok() {
                    entry.pending = None;
                    entry.view = prior;
                    entry.view.phase = Phase::Ready;
                    entry.view.recovery_token = None;
                } else {
                    entry.view.phase = Phase::Recovery;
                    entry.view.code = Some("genesis-bank-response-unavailable".into());
                }
            }
            Ok(value) if value["operationId"].as_str() == Some(pending.operation_id.as_str()) => {
                match receipt(&value, turn, Vec::new()) {
                    Ok(receipt) => {
                        accepted = Some(receipt.clone());
                        entry.pending = None;
                        entry.view.phase = Phase::Ready;
                        entry.view.recovery_token = None;
                        entry.view.code = None;
                        entry.view.current = false;
                        entry.view.completed_stage = None;
                        entry.view.cleanup_warnings = value["cleanupWarnings"]
                            .as_array()
                            .into_iter()
                            .flatten()
                            .map(|warning| {
                                match warning["code"].as_str() {
                                    Some("PROJECT_BANK_OLD_CLAIM_NOT_HELD") => {
                                        "PROJECT_BANK_OLD_CLAIM_NOT_HELD"
                                    }
                                    Some("PROJECT_BANK_ACCEPTED_LOCK_UNAVAILABLE") => {
                                        "PROJECT_BANK_ACCEPTED_LOCK_UNAVAILABLE"
                                    }
                                    _ => "PROJECT_BANK_CLEANUP_UNAVAILABLE",
                                }
                                .to_owned()
                            })
                            .take(4)
                            .collect();
                        if !entry
                            .view
                            .receipts
                            .iter()
                            .any(|old| old.receipt_digest == receipt.receipt_digest)
                        {
                            entry.view.receipts.insert(0, receipt);
                        }
                    }
                    Err(code) => {
                        entry.view.phase = Phase::Recovery;
                        entry.view.code = Some(code);
                    }
                }
            }
            Ok(_) => {
                entry.view.phase = Phase::Recovery;
                entry.view.code = Some("genesis-bank-response-unavailable".into());
            }
            Err(error) => {
                entry.view.code = Some(error.code);
                if error.unknown {
                    entry.view.phase = Phase::Recovery;
                } else {
                    entry.pending = None;
                    entry.view.phase = Phase::Refused;
                    entry.view.recovery_token = None;
                }
            }
        }
    }
    if let Some(receipt) = accepted {
        {
            let mut state = agent.inner.lock().expect("agent state poisoned");
            if let Some(current) = state
                .managed
                .as_mut()
                .filter(|current| current.identity == active.identity)
            {
                current.bank_ack = Some(receipt.clone());
            }
        }
        // Acceptance survives an optional unavailable fresh observation. Only
        // a revalidated current inspection can supply subsequent proposal cuts.
        if let Ok(product) = SelectedInitializationDirectory::capture(&active.context.product) {
            if let Ok(observed) = invoke_initialization_operation(
                editor,
                &InitializationOperation::Inspect { product },
                &|| guard(active),
            ) {
                if let Ok(fresh) = active.context.initialization_observation(&observed) {
                    if fresh.original == setup.original {
                        let _ = refresh(agent, editor, &active.context, &active.session, &fresh);
                        let mut state = agent.inner.lock().expect("agent state poisoned");
                        if let Some(current) = state
                            .managed
                            .as_mut()
                            .filter(|current| current.identity == active.identity)
                        {
                            current.setup = Some(fresh);
                            current.bank_ack = Some(receipt);
                        }
                    }
                }
            }
        }
    }
    // Emit terminal banking state only after the single-flight claim is
    // actually released, so a racing status cannot strand a ready receipt as
    // still preparing. Child cessation precedes this point in the transport.
    drop(flight);
    notify(agent, active);
}
fn refused(agent: &AgentState, active: &Activation, code: String) {
    if let Some(setup) = &active.setup {
        if let Ok(entry) = ensure(
            &mut agent.banking.lock().expect("bank state poisoned"),
            &active.context,
            &active.session,
            setup,
        ) {
            entry.view.phase = if entry.pending.is_some() {
                Phase::Recovery
            } else {
                Phase::Refused
            };
            entry.view.code = Some(code);
        }
    }
}
