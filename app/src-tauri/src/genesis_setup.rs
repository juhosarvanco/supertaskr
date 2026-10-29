//! New-project setup uses native choices and the installed finite Init service.
//! In-memory offers correlate UI intent; the canonical operation is the only
//! durable ledger. A known uncertain ID is replayed, never recaptured.
use crate::agent::context::{ExpectedContext, GenesisContext, InitializedCandidate};
use crate::agent::sessions;
use crate::docs_watch::{self, MessageScope, PickOutcome, WatchState};
use crate::record_editor::{
    invoke_initialization_operation, InitializationOperation, RecordEditorState,
    SelectedInitializationDirectory,
};
use crate::workspace::WorkspaceResolver;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::{
    atomic::{AtomicU64, Ordering},
    Arc, Mutex,
};

#[derive(Default)]
pub(crate) struct SetupState {
    sequence: AtomicU64,
    active: AtomicU64,
    offer: Mutex<Option<Offer>>,
    pending: Mutex<BTreeMap<PathBuf, Pending>>,
}
#[derive(Clone)]
struct Offer {
    token: String,
    product: SelectedInitializationDirectory,
    context: ExpectedContext,
}
#[derive(Clone)]
struct Pending {
    product: SelectedInitializationDirectory,
    records: SelectedInitializationDirectory,
    operation_id: String,
    project_id: String,
    accepted: Option<Value>,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
pub(crate) enum HereTarget {
    Selected,
    Offered { token: String },
}
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct HereRequest {
    pub expected_context: ExpectedContext,
    pub attempt: u64,
    pub target: HereTarget,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SetupNotice {
    pub token: String,
    pub product_dir: String,
    pub status: String,
    pub code: Option<String>,
    pub message: String,
}
pub(crate) struct SetupResult {
    pub outcome: PickOutcome,
    pub notice: Option<SetupNotice>,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PickReply {
    #[serde(flatten)]
    pub selected: docs_watch::ScopedOutcome<PickOutcome>,
    pub genesis_offer: Option<String>,
    pub attempt: Option<u64>,
    pub setup_notice: Option<SetupNotice>,
}
fn pair(scope: &MessageScope) -> ExpectedContext {
    ExpectedContext {
        selection_sequence: scope.selection_sequence,
        context_sequence: scope.context_sequence,
    }
}
fn valid_id(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 128
        && value.as_bytes()[0].is_ascii_alphanumeric()
        && value
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
}
fn valid_attempt(attempt: u64) -> bool {
    attempt > 0 && attempt <= 9_007_199_254_740_991
}
fn oid(value: &Value) -> bool {
    value.as_str().is_some_and(|v| {
        [40, 64].contains(&v.len())
            && v.bytes()
                .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
    })
}
fn digest(value: &Value) -> bool {
    value.as_str().is_some_and(|v| {
        v.strip_prefix("sha256:").is_some_and(|h| {
            h.len() == 64
                && h.bytes()
                    .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
        })
    })
}
fn receipt_matches(value: &Value, pending: &Pending) -> bool {
    value["status"] == "initialized"
        && value["operationId"] == pending.operation_id
        && value["projectId"] == pending.project_id
        && ["requestDigest", "bindingDigest", "receiptDigest"]
            .iter()
            .all(|key| digest(&value[key]))
        && [("product", &pending.product), ("records", &pending.records)]
            .iter()
            .all(|(role, root)| {
                value[role]["root"].as_str().map(Path::new) == Some(root.path())
                    && oid(&value[role]["commit"])
                    && oid(&value[role]["tree"])
                    && value[role]["attribution"] == "exact"
                    && value[role]["ref"].as_str().is_some_and(|r| {
                        r.starts_with("refs/heads/")
                            && r.len() <= 1024
                            && !r.chars().any(char::is_control)
                    })
            })
}
fn failure(product: Option<&Path>, message: impl Into<String>) -> SetupResult {
    SetupResult {
        outcome: PickOutcome::Error {
            path: product.map(|p| p.display().to_string()).unwrap_or_default(),
            message: message.into(),
        },
        notice: None,
    }
}
impl SetupState {
    fn next(&self) -> u64 {
        self.sequence.fetch_add(1, Ordering::SeqCst) + 1
    }
    pub(crate) fn reply(
        &self,
        watch: &WatchState,
        result: SetupResult,
        initial: MessageScope,
        attempt: Option<u64>,
    ) -> PickReply {
        let selected = watch.scoped_pick(result.outcome, initial);
        let genesis_offer = if attempt.is_some() {
            None
        } else {
            match &selected.outcome {
                PickOutcome::NoDocs { path, .. } => {
                    SelectedInitializationDirectory::capture(Path::new(path))
                        .ok()
                        .map(|product| {
                            let token = format!(
                                "genesis-offer-{}-{}-{}",
                                std::process::id(),
                                docs_watch::now_ms(),
                                self.next()
                            );
                            *self.offer.lock().expect("setup offer mutex poisoned") = Some(Offer {
                                token: token.clone(),
                                product,
                                context: pair(&selected.scope),
                            });
                            token
                        })
                }
                PickOutcome::Cancelled | PickOutcome::Busy => None,
                _ => {
                    *self.offer.lock().expect("setup offer mutex poisoned") = None;
                    None
                }
            }
        };
        PickReply {
            selected,
            genesis_offer,
            attempt,
            setup_notice: result.notice,
        }
    }
}
struct Active<'a> {
    state: &'a SetupState,
    id: u64,
    scope: MessageScope,
}
impl Active<'_> {
    fn verify(&self, watch: &WatchState) -> Result<(), String> {
        let current = watch.message_scope();
        // Binding/docs observations may advance within the same selection,
        // including the binding installed by this very operation. They do not
        // choose our frozen P/R. A different native selection retires the call.
        if self.state.active.load(Ordering::SeqCst) != self.id
            || current.selection_sequence != self.scope.selection_sequence
            || current.project_dir != self.scope.project_dir
        {
            return Err("genesis-setup-selection-changed".into());
        }
        Ok(())
    }
}
impl Drop for Active<'_> {
    fn drop(&mut self) {
        let _ = self
            .state
            .active
            .compare_exchange(self.id, 0, Ordering::SeqCst, Ordering::SeqCst);
    }
}
fn claim<'a>(state: &'a SetupState, watch: &WatchState) -> Active<'a> {
    let id = state.next();
    state.active.store(id, Ordering::SeqCst);
    Active {
        state,
        id,
        scope: watch.message_scope(),
    }
}
fn invoke(
    editor: &RecordEditorState,
    watch: &WatchState,
    active: &Active<'_>,
    operation: InitializationOperation,
    pending: Option<&Pending>,
) -> Result<Value, crate::record_editor::InitializationFailure> {
    invoke_initialization_operation(editor, &operation, &|| {
        active.verify(watch)?;
        if let Some(pending) = pending {
            pending.product.verify()?;
            pending.records.verify()?;
        }
        Ok(())
    })
}
fn original_row(product: &SelectedInitializationDirectory, row: &Value) -> Result<Pending, String> {
    if row["originStatus"] != "matched"
        || !matches!(row["state"].as_str(), Some("pending" | "initialized"))
        || row["roots"]["product"] != product.descriptor()
    {
        return Err("The original setup folders are unavailable. Restore the original folders before reconciling setup.".into());
    }
    let operation_id = row["operationId"]
        .as_str()
        .filter(|v| valid_id(v))
        .ok_or("Original setup information is unavailable.")?
        .to_owned();
    let project_id = row["projectId"]
        .as_str()
        .filter(|v| valid_id(v))
        .ok_or("Original setup information is unavailable.")?
        .to_owned();
    let records = SelectedInitializationDirectory::capture(Path::new(
        row["roots"]["records"]["path"]
            .as_str()
            .ok_or("Original notes folder is unavailable.")?,
    ))?;
    if records.descriptor() != row["roots"]["records"] {
        return Err(
            "The original notes folder changed. Keep the original setup for recovery.".into(),
        );
    }
    let mut pending = Pending {
        product: product.clone(),
        records,
        operation_id,
        project_id,
        accepted: None,
    };
    if row["state"] == "initialized" {
        if !receipt_matches(&row["receipt"], &pending) {
            return Err(
                "The original setup receipt is unavailable. No replacement setup was started."
                    .into(),
            );
        }
        pending.accepted = Some(row["receipt"].clone());
    }
    Ok(pending)
}
fn initialized_failure(path: &Path, token: &str, message: impl Into<String>) -> SetupResult {
    let message = message.into();
    let mut result = failure(Some(path), message.clone());
    result.notice = Some(SetupNotice {
        token: token.into(),
        product_dir: path.display().to_string(),
        status: "initialized".into(),
        code: None,
        message,
    });
    result
}
fn run_selected(
    watch: &WatchState,
    state: &SetupState,
    editor: &RecordEditorState,
    active: &Active<'_>,
    product: SelectedInitializationDirectory,
    choose_records: impl FnOnce() -> Option<PathBuf>,
    expected_records: Option<&docs_watch::RecordsObservation>,
) -> SetupResult {
    let path = product.path().to_path_buf();
    let token = format!("setup-result-{}-{}", std::process::id(), active.id);
    let mut pending = state
        .pending
        .lock()
        .expect("setup pending mutex poisoned")
        .get(&path)
        .cloned();
    let mut fresh = false;
    if pending
        .as_ref()
        .is_some_and(|prior| prior.product != product)
    {
        return failure(
            Some(&path),
            "The original setup folder changed. Restore it before reconciling setup.",
        );
    }
    if pending.is_none() {
        let discovered = match invoke(
            editor,
            watch,
            active,
            InitializationOperation::Discover {
                product: product.clone(),
            },
            None,
        ) {
            Ok(value) => value,
            Err(error) => return failure(Some(&path), error.message),
        };
        let Some(rows) = discovered["initializations"]
            .as_array()
            .filter(|rows| rows.len() <= 10_000 && discovered["status"] == "initializations")
        else {
            return failure(
                Some(&path),
                "Setup recovery information is unavailable. No replacement setup was started.",
            );
        };
        if rows.len() > 1 {
            return failure(
                Some(&path),
                "Several original setups require reconciliation. No replacement setup was started.",
            );
        }
        if let Some(row) = rows.first() {
            pending = match original_row(&product, row) {
                Ok(value) => Some(value),
                Err(message) => return failure(Some(&path), message),
            };
        } else {
            match WorkspaceResolver::new().and_then(|r|r.workspace_binding_present(&path)) {
                Ok(false)=>{},_=>return failure(Some(&path),"This folder already has a notes binding or its binding is unavailable. Open its original project instead of creating another setup."),
            }
            let Some(records) = choose_records() else {
                return SetupResult {
                    outcome: PickOutcome::Cancelled,
                    notice: None,
                };
            };
            let records = match SelectedInitializationDirectory::capture(&records) {
                Ok(value) => value,
                Err(message) => return failure(Some(&path), message),
            };
            if records == product {
                return failure(
                    Some(&path),
                    "Choose separate folders for code and private notes.",
                );
            }
            let nonce = format!(
                "{}-{}-{}",
                std::process::id(),
                docs_watch::now_ms(),
                state.next()
            );
            pending = Some(Pending {
                product: product.clone(),
                records,
                operation_id: format!("setup-{nonce}"),
                project_id: format!("project-{nonce}"),
                accepted: None,
            });
            fresh = true;
        }
    }
    let mut pending = pending.expect("selected or original setup");
    if let Some(expected) = expected_records {
        let original = pending.records.descriptor();
        let incarnation = format!(
            "{}:{}",
            original["device"].as_str().unwrap(),
            original["inode"].as_str().unwrap()
        );
        if expected.records_dir.as_deref() != pending.records.path().to_str()
            || expected.root_incarnation.as_deref() != Some(incarnation.as_str())
        {
            return failure(Some(&path),"The displayed notes are not this setup's original notes. Choose its original code folder to reconcile setup.");
        }
    }
    state
        .pending
        .lock()
        .expect("setup pending mutex poisoned")
        .insert(path.clone(), pending.clone());
    let operation = if fresh {
        InitializationOperation::Initialize {
            product: pending.product.clone(),
            records: pending.records.clone(),
            operation_id: pending.operation_id.clone(),
            project_id: pending.project_id.clone(),
        }
    } else {
        InitializationOperation::Replay {
            product: pending.product.clone(),
            operation_id: pending.operation_id.clone(),
        }
    };
    let receipt = match invoke(editor, watch, active, operation, Some(&pending)) {
        Ok(value) => value,
        Err(error) => {
            if fresh && !error.unknown {
                state
                    .pending
                    .lock()
                    .expect("setup pending mutex poisoned")
                    .remove(&path);
            }
            let unknown = error.unknown || !fresh;
            let message = if pending.accepted.is_some() {
                format!("Local setup completed, but its current state is unavailable. Keep the original folders. {}",error.message)
            } else if unknown {
                format!("The original setup needs reconciliation. Choose this same code folder again; keep both original folders. {}",error.message)
            } else {
                error.message
            };
            let mut result = failure(Some(&path), message.clone());
            result.notice = Some(SetupNotice {
                token,
                product_dir: path.display().to_string(),
                status: if pending.accepted.is_some() {
                    "initialized"
                } else if unknown {
                    "unknown"
                } else {
                    "refused"
                }
                .into(),
                code: Some(error.code),
                message,
            });
            return result;
        }
    };
    if pending
        .accepted
        .as_ref()
        .is_some_and(|prior| prior != &receipt)
    {
        return initialized_failure(&path,&token,"Local setup was previously confirmed, but the repeated receipt changed. Keep the original folders and reconcile the original setup.");
    }
    if !receipt_matches(&receipt, &pending) {
        let mut result=failure(Some(&path),"The setup receipt could not be confirmed. Reconcile this same setup before starting another.");
        result.notice = Some(SetupNotice {
            token,
            product_dir: path.display().to_string(),
            status: "unknown".into(),
            code: None,
            message: "Keep the original code and notes folders for setup recovery.".into(),
        });
        return result;
    }
    pending.accepted = Some(receipt);
    state
        .pending
        .lock()
        .expect("setup pending mutex poisoned")
        .insert(path.clone(), pending.clone());
    let inspected = match invoke(
        editor,
        watch,
        active,
        InitializationOperation::Inspect {
            product: product.clone(),
        },
        Some(&pending),
    ) {
        Ok(value) => value,
        Err(error) => {
            let mut result = failure(
                Some(&path),
                format!(
                    "Local setup completed, but it could not be opened. {}",
                    error.message
                ),
            );
            result.notice = Some(SetupNotice {
                token,
                product_dir: path.display().to_string(),
                status: "initialized".into(),
                code: Some(error.code),
                message:
                    "Local setup completed. Reopen the original code folder to finish opening it."
                        .into(),
            });
            return result;
        }
    };
    let candidate=match InitializedCandidate::capture(&path,&inspected) {Ok(value) if value.setup.setup_id==pending.operation_id=>value,_=>return initialized_failure(&path,&token,"Local setup completed, but its current folders or configuration changed. Reopen the original code folder to reconcile it.")};
    if let Err(message) = active.verify(watch) {
        return initialized_failure(&path,&token,format!("Local setup completed. Its original folders were kept, but the displayed project changed. {message}"));
    }
    let expected = candidate.clone();
    let outcome = docs_watch::select_initialized_folder(
        watch,
        candidate.product(),
        Arc::new(move |product, records| expected.verify_observation(product, records)),
    );
    let outcome = match outcome {
        PickOutcome::Picked { snapshot } => {
            let scope = watch.message_scope();
            let resumable = GenesisContext::capture(watch, Some(pair(&scope)))
                .ok()
                .and_then(|context| {
                    sessions::genesis_record_for_context(&context)
                        .ok()
                        .flatten()
                })
                .is_some_and(|record| {
                    sessions::reachability_of(Some(&record))
                        == sessions::GenesisReachability::Resumable
                });
            state
                .pending
                .lock()
                .expect("setup pending mutex poisoned")
                .remove(&path);
            if candidate.setup.pristine_seed || resumable {
                PickOutcome::Genesis {
                    project_dir: snapshot.project_dir.clone(),
                    seq: snapshot.seq,
                    snapshot: Some(snapshot),
                }
            } else {
                PickOutcome::Picked { snapshot }
            }
        }
        other => other,
    };
    let message = if matches!(
        outcome,
        PickOutcome::Genesis { .. } | PickOutcome::Picked { .. }
    ) {
        "Local code and private notes history are ready. Nothing was published."
    } else {
        "Local setup completed. Reopen the original code folder to finish opening it."
    };
    SetupResult {
        outcome,
        notice: Some(SetupNotice {
            token,
            product_dir: path.display().to_string(),
            status: "initialized".into(),
            code: None,
            message: message.into(),
        }),
    }
}
pub(crate) fn new_setup(
    watch: &WatchState,
    state: &SetupState,
    editor: &RecordEditorState,
    attempt: u64,
    choose_product: impl FnOnce() -> Option<PathBuf>,
    choose_records: impl FnOnce() -> Option<PathBuf>,
) -> SetupResult {
    if !valid_attempt(attempt) {
        return failure(
            None,
            "The setup request is unavailable. Try opening setup again.",
        );
    }
    let Some(_flight) = watch.begin_pick() else {
        return SetupResult {
            outcome: PickOutcome::Busy,
            notice: None,
        };
    };
    let active = claim(state, watch);
    let Some(product) = choose_product() else {
        return SetupResult {
            outcome: PickOutcome::Cancelled,
            notice: None,
        };
    };
    let product = match SelectedInitializationDirectory::capture(&product) {
        Ok(value) => value,
        Err(message) => return failure(None, message),
    };
    run_selected(watch, state, editor, &active, product, choose_records, None)
}
pub(crate) fn here_setup(
    watch: &WatchState,
    state: &SetupState,
    editor: &RecordEditorState,
    request: HereRequest,
    choose_records: impl FnOnce() -> Option<PathBuf>,
) -> SetupResult {
    if !valid_attempt(request.attempt) {
        return failure(
            None,
            "The setup request is unavailable. Try opening setup again.",
        );
    }
    let Some(_flight) = watch.begin_pick() else {
        return SetupResult {
            outcome: PickOutcome::Busy,
            notice: None,
        };
    };
    let active = claim(state, watch);
    if !request.expected_context.matches(&active.scope) {
        return failure(
            None,
            "The displayed project changed. Open setup from its current view.",
        );
    }
    let selected_target = matches!(request.target, HereTarget::Selected);
    let product = match request.target {
        HereTarget::Offered { token } => state
            .offer
            .lock()
            .expect("setup offer mutex poisoned")
            .as_ref()
            .filter(|offer| offer.token == token && offer.context == request.expected_context)
            .map(|offer| offer.product.clone()),
        HereTarget::Selected => {
            let selected = active.scope.records.as_ref();
            watch
                .project_dir()
                .and_then(|path| SelectedInitializationDirectory::capture(&path).ok())
                .filter(|product| {
                    if selected.is_some_and(|r| r.layout == "split") {
                        return true;
                    }
                    let d = product.descriptor();
                    selected.is_some_and(|r| {
                        r.layout == "colocated"
                            && r.root_incarnation.as_deref()
                                == Some(
                                    format!(
                                        "{}:{}",
                                        d["device"].as_str().unwrap(),
                                        d["inode"].as_str().unwrap()
                                    )
                                    .as_str(),
                                )
                    })
                })
        }
    };
    let Some(product) = product else {
        return failure(
            None,
            "The original folder offer is unavailable. Choose the code folder again.",
        );
    };
    if product.verify().is_err() {
        return failure(
            Some(product.path()),
            "The original code folder changed. Restore it or choose a new folder.",
        );
    }
    run_selected(
        watch,
        state,
        editor,
        &active,
        product,
        choose_records,
        active
            .scope
            .records
            .as_ref()
            .filter(|r| selected_target && r.layout == "split"),
    )
}

#[cfg(all(test, unix))]
#[path = "genesis_setup_tests.rs"]
mod tests;

#[cfg(all(test, unix))]
#[path = "genesis_setup_installed_tests.rs"]
mod installed_tests;
