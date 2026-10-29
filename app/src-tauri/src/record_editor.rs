//! Installed ordinary-record service bridge. Roots and paths are captured from
//! native selection; the webview supplies only offered tokens and draft text.
use crate::agent::runner::{
    child_group_has_members, login_shell, terminate_group_owning, validate_resolved_program,
    write_prompt_interruptibly, ChildHandle, ENV_ALLOWLIST, ENV_ALLOWLIST_LINUX,
};
use crate::agent::skills::sha256_hex;
use crate::docs_watch::{self, RecordsObservation, WatchState};
use crate::workspace::WorkspaceResolver;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{mpsc, Arc, Condvar, Mutex};
use std::time::{Duration, Instant};

mod recovery;
pub use recovery::{acknowledge, discover, recover};
mod backup;
pub use backup::{backup_saved, discover_backups, BackupOutcome};
mod initialization;
#[cfg(all(test, unix))]
mod init_actor_env_tests;
pub(crate) use initialization::{invoke_initialization_operation, InitializationFailure, InitializationOperation, SelectedInitializationDirectory};

const MAX_DOCUMENT: usize = 1_048_576;
const MAX_PROTOCOL: usize = 4 * 1_048_576;
const MAX_STDERR: usize = 65_536;
const CHECK_TIME: Duration = Duration::from_secs(10);
const SAVE_TIME: Duration = Duration::from_secs(30);
const STOP_GRACE: Duration = Duration::from_secs(2);
const LOGIN_PROBE: &str =
    "command -v supertaskr && printf '\\nSUPERTASKR_RECORDS_PATH=%s\\n' \"$PATH\"";
// Attribution data only. Routing/configuration variables remain excluded;
// the canonical Init constructor validates and freezes the actual actor.
const INIT_ACTOR_ENV: &[&str] = &["GIT_AUTHOR_NAME", "GIT_AUTHOR_EMAIL", "GIT_AUTHOR_DATE",
    "GIT_COMMITTER_NAME", "GIT_COMMITTER_EMAIL", "GIT_COMMITTER_DATE", "EMAIL"];

#[derive(Clone, Debug)]
struct BridgeError {
    code: String,
    message: String,
    launched: bool,
    certain_refused: bool,
    next_operation_id: Option<String>,
}
impl BridgeError {
    fn new(code: &str, message: &str) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
            launched: false,
            certain_refused: false,
            next_operation_id: None,
        }
    }
    fn after_launch(code: &str, message: &str) -> Self {
        Self {
            launched: true,
            ..Self::new(code, message)
        }
    }
}
type Result<T> = std::result::Result<T, BridgeError>;

struct ActiveProcess {
    key: String,
    attempt: u64,
    cancel: Arc<AtomicBool>,
}
pub struct RecordEditorState {
    serial: AtomicU64,
    offers: Mutex<BTreeMap<String, OfferedFile>>,
    buffers: Mutex<BTreeMap<String, Buffer>>,
    recovery: Mutex<recovery::RecoveryState>,
    backups: Mutex<backup::BackupState>,
    active: Mutex<Option<ActiveProcess>>,
    ceased: Condvar,
    closing: AtomicBool,
    #[cfg(test)]
    tool_override: Option<ResolvedTool>,
}
impl Default for RecordEditorState {
    fn default() -> Self {
        Self {
            serial: AtomicU64::new(0),
            offers: Mutex::new(BTreeMap::new()),
            buffers: Mutex::new(BTreeMap::new()),
            recovery: Mutex::new(recovery::RecoveryState::default()),
            backups: Mutex::new(backup::BackupState::default()),
            active: Mutex::new(None),
            ceased: Condvar::new(),
            closing: AtomicBool::new(false),
            #[cfg(test)]
            tool_override: None,
        }
    }
}
struct ProcessLease<'a> {
    state: &'a RecordEditorState,
    key: String,
    attempt: u64,
    cancel: Arc<AtomicBool>,
}
impl Drop for ProcessLease<'_> {
    fn drop(&mut self) {
        let mut active = self
            .state
            .active
            .lock()
            .expect("record operation mutex poisoned");
        if active
            .as_ref()
            .is_some_and(|p| p.key == self.key && p.attempt == self.attempt)
        {
            *active = None;
            self.state.ceased.notify_all();
        }
    }
}
impl RecordEditorState {
    #[cfg(test)]
    pub(crate) fn with_controlled_program(program: PathBuf) -> Self {
        assert!(program.is_absolute());
        Self { tool_override: Some(ResolvedTool { program,
            child_path: std::env::join_paths(sanitized_dirs(&std::env::var_os("PATH").unwrap_or_default())).unwrap() }), ..Self::default() }
    }
    fn next(&self) -> u64 {
        self.serial.fetch_add(1, Ordering::SeqCst) + 1
    }
    fn begin(&self, key: &str, attempt: u64) -> Result<ProcessLease<'_>> {
        let mut active = self.active.lock().expect("record operation mutex poisoned");
        if self.closing.load(Ordering::SeqCst) {
            return Err(BridgeError::new(
                "records-app-closing",
                "The app is closing.",
            ));
        }
        if active.is_some() {
            return Err(BridgeError::new(
                "records-app-busy",
                "A record operation is still running.",
            ));
        }
        let cancel = Arc::new(AtomicBool::new(false));
        *active = Some(ActiveProcess {
            key: key.into(),
            attempt,
            cancel: cancel.clone(),
        });
        Ok(ProcessLease {
            state: self,
            key: key.into(),
            attempt,
            cancel,
        })
    }
    pub fn cancel(&self, key: &str, attempt: u64) -> bool {
        let active = self.active.lock().expect("record operation mutex poisoned");
        if let Some(active) = active
            .as_ref()
            .filter(|p| p.key == key && p.attempt == attempt)
        {
            active.cancel.store(true, Ordering::SeqCst);
            true
        } else {
            false
        }
    }
    pub fn stop(&self) {
        self.closing.store(true, Ordering::SeqCst);
        let mut active = self.active.lock().expect("record operation mutex poisoned");
        while let Some(process) = active.as_ref() {
            process.cancel.store(true, Ordering::SeqCst);
            active = self
                .ceased
                .wait(active)
                .expect("record operation mutex poisoned");
        }
    }
    fn tool(&self, deadline: Instant, cancel: &AtomicBool) -> Result<ResolvedTool> {
        #[cfg(test)]
        if let Some(tool) = &self.tool_override {
            validate_resolved_program(&tool.program, "supertaskr").map_err(|_| {
                BridgeError::new(
                    "records-app-tool-unavailable",
                    "The installed record tool path is invalid.",
                )
            })?;
            return Ok(tool.clone());
        }
        resolve_tool(deadline, cancel)
    }
}

#[derive(Clone)]
struct ResolvedTool {
    program: PathBuf,
    child_path: std::ffi::OsString,
}
fn sanitized_dirs(raw: &std::ffi::OsStr) -> Vec<PathBuf> {
    std::env::split_paths(raw)
        .filter(|dir| {
            dir.is_absolute()
                && !dir.as_os_str().is_empty()
                && !dir
                    .to_string_lossy()
                    .split('/')
                    .any(|part| part == "." || part == "..")
        })
        .collect()
}
fn child_environment(command: &mut Command, path: Option<&std::ffi::OsStr>) {
    command.env_clear();
    for key in ENV_ALLOWLIST.iter().chain(if cfg!(target_os = "linux") {
        ENV_ALLOWLIST_LINUX.iter()
    } else {
        [].iter()
    }) {
        if let Some(value) = std::env::var_os(key) {
            if value.len() <= 65_536 {
                command.env(key, value);
            }
        }
    }
    command.env("TERM", "dumb");
    if let Some(path) = path {
        command.env("PATH", path);
    }
}

struct ChildOutput {
    success: bool,
    stdout: Vec<u8>,
}
struct OwnedChild {
    child: Child,
    handle: ChildHandle,
    ceased: bool,
}
impl OwnedChild {
    fn stop(&mut self) {
        if self.ceased {
            return;
        }
        let _ = terminate_group_owning(&mut self.child, &self.handle, STOP_GRACE);
        let _ = self.child.wait();
        self.handle.mark_reaped();
        while child_group_has_members(&self.handle) {
            std::thread::sleep(Duration::from_millis(20));
        }
        self.ceased = true;
    }
}
impl Drop for OwnedChild {
    fn drop(&mut self) {
        self.stop();
    }
}
fn drain(
    mut input: impl Read,
    limit: usize,
    overflow: Arc<AtomicBool>,
) -> std::io::Result<Vec<u8>> {
    let mut output = Vec::new();
    let mut block = [0u8; 8192];
    loop {
        let count = input.read(&mut block)?;
        if count == 0 {
            return Ok(output);
        }
        if output.len().saturating_add(count) <= limit {
            output.extend_from_slice(&block[..count]);
        } else {
            overflow.store(true, Ordering::SeqCst);
        }
    }
}

/// One owning thread drains all pipes and owns waitpid. It releases its caller's
/// selection latch only after the complete owned process group has ceased.
fn run_child(
    mut command: Command,
    input: Vec<u8>,
    deadline: Instant,
    stdout_limit: usize,
    cancel: &AtomicBool,
) -> Result<ChildOutput> {
    #[cfg(not(unix))]
    {
        let _ = (command, input, deadline, stdout_limit, cancel);
        return Err(BridgeError::new(
            "records-app-platform-unavailable",
            "Record editing is unavailable on this platform.",
        ));
    }
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        if cancel.load(Ordering::SeqCst) {
            return Err(BridgeError::new(
                "records-app-cancelled",
                "Record operation cancelled.",
            ));
        }
        if Instant::now() >= deadline {
            return Err(BridgeError::new(
                "records-app-timeout",
                "Record operation timed out.",
            ));
        }
        command
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .process_group(0);
        let child = command.spawn().map_err(|_| {
            BridgeError::new(
                "records-app-tool-unavailable",
                "The installed Supertaskr CLI could not start.",
            )
        })?;
        let handle = ChildHandle::new(child.id() as i32, 0);
        let mut owned = OwnedChild {
            child,
            handle: handle.clone(),
            ceased: false,
        };
        let stdin = owned.child.stdin.take().expect("piped record stdin");
        let stdout = owned.child.stdout.take().expect("piped record stdout");
        let stderr = owned.child.stderr.take().expect("piped record stderr");
        let overflow = Arc::new(AtomicBool::new(false));
        let (out_tx, out_rx) = mpsc::channel();
        let (err_tx, err_rx) = mpsc::channel();
        let (in_tx, in_rx) = mpsc::channel();
        let input_stop = Arc::new(AtomicBool::new(false));
        let writer_stop = input_stop.clone();
        let output_overflow = overflow.clone();
        let stderr_overflow = overflow.clone();
        let out_thread = std::thread::spawn(move || {
            let _ = out_tx.send(drain(stdout, stdout_limit, output_overflow));
        });
        let err_thread = std::thread::spawn(move || {
            let _ = err_tx.send(drain(stderr, MAX_STDERR, stderr_overflow));
        });
        let in_thread = std::thread::spawn(move || {
            let result = write_prompt_interruptibly(stdin, &input, &writer_stop);
            let _ = in_tx.send(result);
        });
        let mut failure = None;
        let success = loop {
            if cancel.load(Ordering::SeqCst) {
                failure = Some((
                    "records-app-cancelled",
                    "Record operation cancelled; its result must be reconciled.",
                ));
                break false;
            }
            if overflow.load(Ordering::SeqCst) {
                failure = Some((
                    "records-app-output-limit",
                    "The record service response exceeded its size limit.",
                ));
                break false;
            }
            if Instant::now() >= deadline {
                failure = Some((
                    "records-app-timeout",
                    "The record service timed out; its result must be reconciled.",
                ));
                break false;
            }
            match owned.child.try_wait() {
                Ok(Some(status)) => {
                    handle.mark_reaped();
                    break status.success();
                }
                Ok(None) => std::thread::sleep(Duration::from_millis(20)),
                Err(_) => {
                    failure = Some((
                        "records-app-process-unavailable",
                        "The record service result is unavailable.",
                    ));
                    break false;
                }
            }
        };
        // Stop the owned writer independently of who still holds its reader.
        // Group cleanup retains its existing scope and policy.
        input_stop.store(true, Ordering::SeqCst);
        owned.stop();
        let output = out_rx.recv().map_err(|_| {
            BridgeError::after_launch(
                "records-app-output-unavailable",
                "Record service output is unavailable.",
            )
        });
        let errors = err_rx.recv();
        let written = in_rx.recv();
        let _ = out_thread.join();
        let _ = err_thread.join();
        let _ = in_thread.join();
        if let Some((code, message)) = failure {
            return Err(BridgeError::after_launch(code, message));
        }
        if overflow.load(Ordering::SeqCst) {
            return Err(BridgeError::after_launch(
                "records-app-output-limit",
                "The record service response exceeded its size limit.",
            ));
        }
        if !matches!(errors, Ok(Ok(_))) || !matches!(written, Ok(Ok(()))) {
            return Err(BridgeError::after_launch(
                "records-app-pipe-unavailable",
                "The record service response is unavailable.",
            ));
        }
        let stdout = output?.map_err(|_| {
            BridgeError::after_launch(
                "records-app-output-unavailable",
                "Record service output is unavailable.",
            )
        })?;
        Ok(ChildOutput { success, stdout })
    }
}

fn resolve_tool(deadline: Instant, cancel: &AtomicBool) -> Result<ResolvedTool> {
    let mut probe = Command::new(login_shell());
    probe.args(["-l", "-c", LOGIN_PROBE]);
    child_environment(&mut probe, std::env::var_os("PATH").as_deref());
    let output = run_child(
        probe,
        Vec::new(),
        deadline.min(Instant::now() + Duration::from_secs(2)),
        MAX_STDERR,
        cancel,
    )
    .map_err(|mut error| {
        error.launched = false;
        error
    })?;
    let mut program = None;
    let mut login_path = None;
    if output.success {
        let text = String::from_utf8(output.stdout).map_err(|_| {
            BridgeError::new(
                "records-app-tool-unavailable",
                "Install the Supertaskr CLI to edit records.",
            )
        })?;
        for line in text.lines() {
            if let Some(value) = line.strip_prefix("SUPERTASKR_RECORDS_PATH=") {
                login_path = Some(std::ffi::OsString::from(value));
            } else if program.is_none()
                && validate_resolved_program(Path::new(line), "supertaskr").is_ok()
            {
                program = Some(PathBuf::from(line));
            }
        }
    }
    let path = login_path
        .or_else(|| std::env::var_os("PATH"))
        .unwrap_or_default();
    let mut dirs = sanitized_dirs(&path);
    let program = program
        .or_else(|| {
            dirs.iter()
                .map(|dir| dir.join("supertaskr"))
                .find(|file| validate_resolved_program(file, "supertaskr").is_ok())
        })
        .ok_or_else(|| {
            BridgeError::new(
                "records-app-tool-unavailable",
                "Install the Supertaskr CLI to edit and save records.",
            )
        })?;
    if let Some(parent) = program.parent() {
        if !dirs.iter().any(|dir| dir == parent) {
            dirs.insert(0, parent.to_path_buf());
        }
    }
    let child_path = std::env::join_paths(dirs).map_err(|_| {
        BridgeError::new(
            "records-app-tool-unavailable",
            "The installed Supertaskr CLI path is unavailable.",
        )
    })?;
    Ok(ResolvedTool {
        program,
        child_path,
    })
}

fn invoke_tool(
    tool: &ResolvedTool,
    product: &Path,
    request: &Value,
    deadline: Instant,
    cancel: &AtomicBool,
) -> Result<Value> {
    invoke_command(tool, product, request, deadline, cancel, InstalledCommand::Records)
}

// Fixed native consumers only; no command name or executable comes from IPC.
enum InstalledCommand { Records, Index, Init }
impl InstalledCommand {
    fn verb(&self) -> &'static str { match self { Self::Records => "records", Self::Index => "index", Self::Init => "init" } }
}
fn invoke_command(
    tool: &ResolvedTool, product: &Path, request: &Value, deadline: Instant,
    cancel: &AtomicBool, consumer: InstalledCommand,
) -> Result<Value> {
    let input = serde_json::to_vec(request).map_err(|_| {
        BridgeError::new(
            "records-app-request",
            "The record request could not be encoded.",
        )
    })?;
    if input.len() > MAX_PROTOCOL {
        return Err(BridgeError::new(
            "records-app-input-limit",
            "This record is too large to edit here.",
        ));
    }
    let mut command = Command::new(&tool.program);
    command.args([consumer.verb(), "--stdio"]).current_dir(product);
    child_environment(&mut command, Some(&tool.child_path));
    if matches!(consumer, InstalledCommand::Init) {
        for key in INIT_ACTOR_ENV {
            if let Some(value)=std::env::var_os(key) {command.env(key,value);}
        }
    }
    let output = run_child(command, input, deadline, MAX_PROTOCOL, cancel)?;
    let envelope: Value = serde_json::from_slice(&output.stdout).map_err(|_| {
        BridgeError::after_launch(
            "records-app-protocol",
            "The installed record service returned an invalid response.",
        )
    })?;
    let valid = envelope.as_object().is_some_and(|object| object.len() == 4)
        && envelope["version"] == 1
        && envelope["requestId"] == request["requestId"];
    if !valid {
        return Err(BridgeError::after_launch(
            "records-app-protocol",
            "The record service response did not match this request.",
        ));
    }
    if envelope["ok"] == true && output.success && envelope["result"].is_object() {
        return Ok(envelope["result"].clone());
    }
    if envelope["ok"] == false {
        let error = &envelope["error"];
        let code = error["code"]
            .as_str()
            .filter(|code| {
                !code.is_empty()
                    && code.len() <= 128
                    && code
                        .bytes()
                        .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
            })
            .ok_or_else(|| {
                BridgeError::after_launch(
                    "records-app-protocol",
                    "The record service error response was invalid.",
                )
            })?;
        let message = error["message"]
            .as_str()
            .filter(|message| message.len() <= 2000)
            .ok_or_else(|| {
                BridgeError::after_launch(
                    "records-app-protocol",
                    "The record service error response was invalid.",
                )
            })?;
        if !matches!(error["state"].as_str(), Some("refused" | "unknown")) {
            return Err(BridgeError::after_launch(
                "records-app-protocol",
                "The record service error state was invalid.",
            ));
        }
        if request["operationId"].is_string() && error["operationId"] != request["operationId"] {
            return Err(BridgeError::after_launch(
                "records-app-protocol",
                "The record service error did not match the original operation.",
            ));
        }
        let next_operation_id = match error.get("nextOperationId") {
            None => None,
            Some(value) => Some(
                value
                    .as_str()
                    .filter(|id| {
                        error["state"] == "refused"
                            && request["operationId"].is_string()
                            && *id != request["operationId"].as_str().unwrap()
                            && id.starts_with("save-")
                            && id.len() <= 128
                            && id
                                .bytes()
                                .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
                    })
                    .ok_or_else(|| {
                        BridgeError::after_launch(
                            "records-app-protocol",
                            "The replacement save identifier was invalid.",
                        )
                    })?
                    .to_owned(),
            ),
        };
        return Err(BridgeError {
            code: code.into(),
            message: message.into(),
            launched: error["state"] != "refused",
            certain_refused: error["state"] == "refused",
            next_operation_id,
        });
    }
    Err(BridgeError::after_launch(
        "records-app-protocol",
        "The record service response was incomplete.",
    ))
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorOrigin {
    project_dir: String,
    records_dir: String,
    selection_sequence: u64,
    context_sequence: u64,
    association_id: Option<String>,
    root_incarnation: String,
    docs_incarnation: Option<String>,
}
#[derive(Clone)]
struct NativeContext {
    origin: EditorOrigin,
    product: PathBuf,
    product_revision: String,
}

/// Trusted location data for the app's graph consumers, captured by the same
/// origin checks as editing. This is not a reservation or a write grant.
pub(crate) struct SelectedRecordsContext {
    pub product: PathBuf,
    pub records: PathBuf,
    pub product_revision: String,
    pub expected_origin: Value,
    pub scope: docs_watch::MessageScope,
}
pub(crate) fn selected_records_context(watch: &WatchState) -> std::result::Result<SelectedRecordsContext, String> {
    let selected = context(watch).map_err(|error| error.code)?;
    verify_context(watch, &selected).map_err(|error| error.code)?;
    let scope = watch.message_scope();
    if scope.project_dir.as_deref() != Some(selected.product.to_string_lossy().as_ref())
        || scope.selection_sequence != selected.origin.selection_sequence
        || scope.context_sequence != selected.origin.context_sequence
    { return Err("graph-selection-changed".into()); }
    Ok(SelectedRecordsContext {
        product: selected.product,
        records: PathBuf::from(&selected.origin.records_dir),
        product_revision: selected.product_revision.clone(),
        expected_origin: json!({"recordsRoot": selected.origin.records_dir,
            "rootIncarnation": selected.origin.root_incarnation,
            "docsIncarnation": selected.origin.docs_incarnation,
            "associationId": selected.origin.association_id,
            "productRevision": selected.product_revision}),
        scope,
    })
}

/// Reuse the reviewed owned-child lease and termination path for a fixed graph
/// command. The selected roots are never taken from a webview argument.
pub(crate) fn index_selected_records(
    watch: &WatchState, state: &RecordEditorState, cache_dir: Option<PathBuf>, expected_scope: &docs_watch::MessageScope,
) -> std::result::Result<(Value, docs_watch::MessageScope), String> {
    let selected = context(watch).map_err(|error| error.code)?;
    let scope = expected_scope.clone();
    if scope.project_dir.as_deref() != Some(selected.product.to_string_lossy().as_ref())
        || scope.selection_sequence != selected.origin.selection_sequence
        || scope.context_sequence != selected.origin.context_sequence
    { return Err("graph-selection-changed".into()); }
    let attempt = state.next();
    let lease = state.begin("source-index", attempt).map_err(|error| error.code)?;
    let deadline = Instant::now() + SAVE_TIME;
    let tool = state.tool(deadline, &lease.cancel).map_err(|error| error.code)?;
    verify_context(watch, &selected).map_err(|error| error.code)?;
    // Lease acquisition/tool resolution may have yielded while selection moved.
    // Recheck the same frozen request, never construct a replacement origin.
    if watch.message_scope().selection_sequence != scope.selection_sequence
        || watch.message_scope().context_sequence != scope.context_sequence {
        return Err("graph-selection-changed".into());
    }
    let request = json!({"version":1,"requestId":format!("graph-index-{attempt}"),"operation":"index",
        "productRoot": selected.product,
        "operationId": format!("graph-{}-{}-{attempt}",std::process::id(),docs_watch::now_ms()),
        "expectedOrigin":{"recordsRoot":selected.origin.records_dir,"rootIncarnation":selected.origin.root_incarnation,
            "docsIncarnation":selected.origin.docs_incarnation,"associationId":selected.origin.association_id,
            "productRevision":selected.product_revision},"cacheDir":cache_dir});
    invoke_command(&tool, &selected.product, &request, deadline, &lease.cancel, InstalledCommand::Index)
        .map(|result| (result, scope))
        .map_err(|error| error.code)
}

/// The prepared genesis context owns the existing selection claim throughout
/// this fixed read. No command, root, TOOL path or config comes from a webview.
pub(crate) fn inspect_initialized_project(
    watch: &WatchState,
    state: &RecordEditorState,
    prepared: &crate::agent::context::PreparedContext,
) -> std::result::Result<Value, String> {
    let original = &prepared.context;
    original.verify(watch)?;
    let attempt = state.next();
    let lease = state.begin("genesis-inspect", attempt).map_err(|error| error.code)?;
    let deadline = Instant::now() + CHECK_TIME;
    let tool = state.tool(deadline, &lease.cancel).map_err(|error| error.code)?;
    original.verify(watch)?;
    let request = json!({"version":1,"requestId":format!("genesis-inspect-{attempt}"),
        "operation":"inspect","productRoot":original.product});
    let result = invoke_command(&tool, &original.product, &request, deadline, &lease.cancel, InstalledCommand::Init)
        .map_err(|error| error.code)?;
    original.verify(watch)?;
    Ok(result)
}
#[derive(Clone)]
struct OfferedFile {
    context: NativeContext,
    path: String,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ObservedFile {
    present: bool,
    sha256: String,
    mode: String,
}
#[derive(Clone)]
struct PendingSave {
    operation_id: String,
    content: String,
    native_attempt: u64,
    frontend_attempt: u64,
    records_revision: String,
}
#[derive(Clone)]
struct Buffer {
    id: String,
    offered_token: String,
    context: NativeContext,
    path: String,
    content: String,
    records_revision: String,
    expected_file: ObservedFile,
    expected_context: String,
    operation_id: String,
    pending: Option<PendingSave>,
    last_save: Option<PendingSave>,
    refresh_after_save: Option<ObservedFile>,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorFile {
    token: String,
    path: String,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorBuffer {
    id: String,
    file_token: String,
    path: String,
    content: String,
    origin: EditorOrigin,
    product_revision: String,
    records_revision: String,
    observed_file: ObservedFile,
    operation_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    recovery_content: Option<String>,
}
impl Buffer {
    fn payload(&self) -> EditorBuffer {
        EditorBuffer {
            id: self.id.clone(),
            file_token: self.offered_token.clone(),
            path: self.path.clone(),
            content: self.content.clone(),
            origin: self.context.origin.clone(),
            product_revision: self.context.product_revision.clone(),
            records_revision: self.records_revision.clone(),
            observed_file: self.expected_file.clone(),
            operation_id: self.operation_id.clone(),
            recovery_content: self.pending.as_ref().map(|pending| pending.content.clone()),
        }
    }
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveReceipt {
    operation_id: String,
    commit: String,
    tree: String,
    r#ref: String,
    previous_revision: String,
    recovered: bool,
    paths: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    cleanup_warning: Option<String>,
}
#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum EditorAction {
    Check,
    Save,
    Replay,
}
#[derive(Clone, Debug, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum EditorOutcome {
    Recoveries {
        attempt: u64,
        product_dir: String,
        recoveries: Vec<recovery::EditorRecovery>,
    },
    Recovered {
        operation_key: String,
        attempt: u64,
        recovery: recovery::EditorRecovery,
        receipt: SaveReceipt,
    },
    Files {
        attempt: u64,
        origin: EditorOrigin,
        files: Vec<EditorFile>,
    },
    Opened {
        operation_key: String,
        attempt: u64,
        buffer: EditorBuffer,
    },
    Checked {
        operation_key: String,
        attempt: u64,
        buffer_id: String,
        origin: EditorOrigin,
        accepted: bool,
        blocking: usize,
        warnings: usize,
        retained: usize,
        messages: Vec<String>,
        operation_id: String,
    },
    Saved {
        operation_key: String,
        attempt: u64,
        buffer_id: String,
        origin: EditorOrigin,
        receipt: SaveReceipt,
        submitted_content: String,
        message: Option<String>,
    },
    Error {
        operation_key: String,
        attempt: u64,
        origin: Option<EditorOrigin>,
        code: String,
        message: String,
        unknown: bool,
        operation_id: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        next_operation_id: Option<String>,
    },
}
fn outcome_error(
    key: &str,
    attempt: u64,
    origin: Option<EditorOrigin>,
    error: BridgeError,
    operation_id: Option<String>,
) -> EditorOutcome {
    EditorOutcome::Error {
        operation_key: key.into(),
        attempt,
        origin,
        code: error.code,
        message: error.message,
        unknown: operation_id.is_some(),
        operation_id,
        next_operation_id: error.next_operation_id,
    }
}
pub fn unavailable(state: &RecordEditorState, key: &str, attempt: u64) -> EditorOutcome {
    let buffers = state.buffers.lock().expect("record buffers mutex poisoned");
    let buffer = buffers.get(key);
    let operation_id = buffer.and_then(|buffer| {
        buffer
            .pending
            .as_ref()
            .or(buffer.last_save.as_ref())
            .filter(|pending| pending.frontend_attempt == attempt)
            .map(|pending| pending.operation_id.clone())
    });
    outcome_error(
        key,
        attempt,
        buffer.map(|buffer| buffer.context.origin.clone()),
        BridgeError::after_launch(
            "records-app-unavailable",
            "The record operation result is unavailable.",
        ),
        operation_id,
    )
}
fn origin(project: &Path, records: &RecordsObservation) -> Result<EditorOrigin> {
    if records.availability != "available" {
        return Err(BridgeError::new(
            "records-app-unavailable",
            "The selected records home is unavailable.",
        ));
    }
    Ok(EditorOrigin {
        project_dir: project.display().to_string(),
        records_dir: records.records_dir.clone().ok_or_else(|| {
            BridgeError::new(
                "records-app-unavailable",
                "The selected records home is unavailable.",
            )
        })?,
        selection_sequence: records.selection_sequence,
        context_sequence: records.context_sequence,
        association_id: records.association_id.clone(),
        root_incarnation: records.root_incarnation.clone().ok_or_else(|| {
            BridgeError::new(
                "records-app-origin-unavailable",
                "The records directory identity is unavailable.",
            )
        })?,
        docs_incarnation: records.docs_incarnation.clone(),
    })
}
fn context(watch: &WatchState) -> Result<NativeContext> {
    let (product, records) = watch.selected_records().ok_or_else(|| {
        BridgeError::new(
            "records-app-unavailable",
            "Open a product with available records before editing.",
        )
    })?;
    let selected = origin(&product, &records)?;
    let resolver = WorkspaceResolver::new().map_err(|_| {
        BridgeError::new(
            "records-app-source-unavailable",
            "The product source is unavailable.",
        )
    })?;
    let workspace = resolver
        .resolve_workspace(
            &product,
            crate::workspace::WorkspaceMode::Development,
            "HEAD",
        )
        .map_err(|_| {
            BridgeError::new(
                "records-app-stale",
                "The selected records association is unavailable or changed.",
            )
        })?;
    if workspace.records_root() != Path::new(&selected.records_dir)
        || workspace.association().project_id != selected.association_id
    {
        return Err(BridgeError::new(
            "records-app-stale",
            "This draft belongs to an earlier records home. Its text has been kept.",
        ));
    }
    let identity = resolver
        .measure_product_identity(&product, "HEAD")
        .map_err(|_| {
            BridgeError::new(
                "records-app-source-unavailable",
                "Record editing needs an available product Git revision.",
            )
        })?;
    let product_revision = identity.selected_commit.ok_or_else(|| {
        BridgeError::new(
            "records-app-source-unavailable",
            "The product revision is unavailable.",
        )
    })?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let stat = std::fs::symlink_metadata(workspace.records_root()).map_err(|_| {
            BridgeError::new(
                "records-app-stale",
                "The original records home is unavailable.",
            )
        })?;
        if stat.file_type().is_symlink()
            || format!("{}:{}", stat.dev(), stat.ino()) != selected.root_incarnation
        {
            return Err(BridgeError::new(
                "records-app-stale",
                "The original records directory was replaced. Its draft text has been kept.",
            ));
        }
        let docs =
            std::fs::symlink_metadata(workspace.records_root().join("docs")).map_err(|_| {
                BridgeError::new(
                    "records-app-stale",
                    "The original records directory is unavailable.",
                )
            })?;
        if !docs.is_dir()
            || docs.file_type().is_symlink()
            || Some(format!("{}:{}", docs.dev(), docs.ino())) != selected.docs_incarnation
        {
            return Err(BridgeError::new(
                "records-app-stale",
                "The records documents were replaced. Your draft text has been kept.",
            ));
        }
    }
    Ok(NativeContext {
        origin: selected,
        product,
        product_revision,
    })
}
fn verify_context(watch: &WatchState, expected: &NativeContext) -> Result<()> {
    let actual = context(watch)?;
    if actual.origin != expected.origin || actual.product_revision != expected.product_revision {
        return Err(BridgeError::new(
            "records-app-stale",
            "This draft belongs to an earlier records context. Its text has been kept.",
        ));
    }
    Ok(())
}
fn is_oid(value: &str) -> bool {
    matches!(value.len(), 40 | 64)
        && value
            .bytes()
            .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
}
fn digest(content: &[u8]) -> String {
    sha256_hex(content).trim_start_matches("sha256:").into()
}
fn observed(value: &Value) -> Result<ObservedFile> {
    let file: ObservedFile = serde_json::from_value(value.clone()).map_err(|_| {
        BridgeError::after_launch(
            "records-app-protocol",
            "The record service file observation was invalid.",
        )
    })?;
    if !file.present
        || file.sha256.len() != 64
        || !file
            .sha256
            .bytes()
            .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
        || !matches!(file.mode.as_str(), "100644" | "100755")
    {
        return Err(BridgeError::after_launch(
            "records-app-protocol",
            "The record service file observation was invalid.",
        ));
    }
    Ok(file)
}
fn read_buffer(
    state: &RecordEditorState,
    tool: &ResolvedTool,
    offered: &OfferedFile,
    offered_token: &str,
    deadline: Instant,
    cancel: &AtomicBool,
) -> Result<Buffer> {
    let request = json!({"version":1,"requestId":format!("record-read-{}", state.next()),"operation":"read",
        "productRoot":offered.context.product,"productRevision":offered.context.product_revision,"path":offered.path});
    let result = invoke_tool(tool, &offered.context.product, &request, deadline, cancel)?;
    let text = result["contentBase64"].as_str().ok_or_else(|| {
        BridgeError::after_launch(
            "records-app-protocol",
            "The record service returned no file content.",
        )
    })?;
    let bytes = BASE64.decode(text).map_err(|_| {
        BridgeError::after_launch(
            "records-app-protocol",
            "The record service returned invalid file bytes.",
        )
    })?;
    if bytes.len() > MAX_DOCUMENT {
        return Err(BridgeError::new(
            "records-app-document-limit",
            "This record is too large to edit here.",
        ));
    }
    let content = String::from_utf8(bytes).map_err(|_| {
        BridgeError::after_launch("records-app-protocol", "This record is not UTF-8 text.")
    })?;
    let file = observed(&result["observedFile"])?;
    let revision = result["recordsRevision"]
        .as_str()
        .filter(|value| is_oid(value))
        .ok_or_else(|| {
            BridgeError::after_launch("records-app-protocol", "The records revision was invalid.")
        })?;
    let expected_context = result["expectedContext"]
        .as_str()
        .filter(|value| {
            value.starts_with("sha256:")
                && value.len() == 71
                && value[7..]
                    .bytes()
                    .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
        })
        .ok_or_else(|| {
            BridgeError::after_launch(
                "records-app-protocol",
                "The record service context receipt was invalid.",
            )
        })?;
    let operation_id = result["operationId"]
        .as_str()
        .filter(|value| {
            value.starts_with("save-")
                && value.len() <= 128
                && value
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b == b'-')
        })
        .ok_or_else(|| {
            BridgeError::after_launch(
                "records-app-protocol",
                "The next save operation identifier was invalid.",
            )
        })?;
    let origin = &result["recordOrigin"];
    let incarnation = format!(
        "{}:{}",
        origin["device"].as_str().unwrap_or(""),
        origin["inode"].as_str().unwrap_or("")
    );
    let docs_incarnation = format!(
        "{}:{}",
        origin["docsDevice"].as_str().unwrap_or(""),
        origin["docsInode"].as_str().unwrap_or("")
    );
    if result["status"] != "read"
        || result["path"] != offered.path
        || result["productRevision"] != offered.context.product_revision
        || origin["root"] != offered.context.origin.records_dir
        || incarnation != offered.context.origin.root_incarnation
        || origin["docsDirectory"]
            != Path::new(&offered.context.origin.records_dir)
                .join("docs")
                .display()
                .to_string()
        || Some(docs_incarnation) != offered.context.origin.docs_incarnation
        || !origin["gitDirectory"]
            .as_str()
            .is_some_and(|value| Path::new(value).is_absolute())
        || !origin["commonDirectory"]
            .as_str()
            .is_some_and(|value| Path::new(value).is_absolute())
        || file.sha256 != digest(content.as_bytes())
    {
        return Err(BridgeError::after_launch("records-app-origin-changed", "The records origin changed while opening this file. Its bytes were not attached to another context."));
    }
    let mut buffer = Buffer {
        id: format!("record-buffer-{}", state.next()),
        offered_token: offered_token.into(),
        context: offered.context.clone(),
        path: offered.path.clone(),
        content,
        records_revision: revision.into(),
        expected_file: file,
        expected_context: expected_context.into(),
        operation_id: operation_id.into(),
        pending: None,
        last_save: None,
        refresh_after_save: None,
    };
    recovery::restore_capture(&result, &mut buffer)?;
    Ok(buffer)
}

pub fn files(watch: &WatchState, state: &RecordEditorState, attempt: u64) -> EditorOutcome {
    let result = (|| {
        let _flight = watch.begin_pick().ok_or_else(|| {
            BridgeError::new(
                "records-app-busy",
                "A workspace operation is still running.",
            )
        })?;
        let snapshot = match docs_watch::project_status(watch) {
            docs_watch::ProjectStatus::Open { snapshot } => snapshot,
            _ => {
                return Err(BridgeError::new(
                    "records-app-unavailable",
                    "Open a product with available records before editing.",
                ))
            }
        };
        let context = context(watch)?;
        if snapshot
            .records
            .as_ref()
            .map(|records| origin(Path::new(&snapshot.project_dir), records))
            .transpose()?
            .as_ref()
            != Some(&context.origin)
        {
            return Err(BridgeError::new("records-app-stale", "The records context changed while listing files. Try the current records home again."));
        }
        let mut offers = state.offers.lock().expect("record offers mutex poisoned");
        offers.clear();
        let files = snapshot
            .files
            .iter()
            .filter(|file| file.path.ends_with(".md"))
            .map(|file| {
                let token = format!("record-file-{}", state.next());
                offers.insert(
                    token.clone(),
                    OfferedFile {
                        context: context.clone(),
                        path: file.path.clone(),
                    },
                );
                EditorFile {
                    token,
                    path: file.path.clone(),
                }
            })
            .collect();
        Ok(EditorOutcome::Files {
            attempt,
            origin: context.origin,
            files,
        })
    })();
    result.unwrap_or_else(|error| outcome_error("files", attempt, None, error, None))
}

pub fn open(
    watch: &WatchState,
    state: &RecordEditorState,
    token: &str,
    attempt: u64,
) -> EditorOutcome {
    let offered = state
        .offers
        .lock()
        .expect("record offers mutex poisoned")
        .get(token)
        .cloned()
        .map(Ok)
        .unwrap_or_else(|| recovery::offer_for_open(watch, state, token));
    let origin = offered
        .as_ref()
        .ok()
        .map(|file| file.context.origin.clone());
    let result = (|| {
        let offered = offered?;
        if state
            .buffers
            .lock()
            .expect("record buffers mutex poisoned")
            .len()
            >= 32
        {
            return Err(BridgeError::new(
                "records-app-buffer-limit",
                "There are too many open record drafts.",
            ));
        }
        let _flight = watch.begin_pick().ok_or_else(|| {
            BridgeError::new(
                "records-app-busy",
                "A workspace operation is still running.",
            )
        })?;
        let lease = state.begin(token, attempt)?;
        let deadline = Instant::now() + CHECK_TIME;
        verify_context(watch, &offered.context)?;
        let tool = state.tool(deadline, &lease.cancel)?;
        let buffer = read_buffer(state, &tool, &offered, token, deadline, &lease.cancel)?;
        recovery::verify_opened_recovery(state, token, &buffer)?;
        verify_context(watch, &offered.context)?;
        let payload = buffer.payload();
        state
            .buffers
            .lock()
            .expect("record buffers mutex poisoned")
            .insert(buffer.id.clone(), buffer);
        Ok(EditorOutcome::Opened {
            operation_key: token.into(),
            attempt,
            buffer: payload,
        })
    })();
    result.unwrap_or_else(|error| outcome_error(token, attempt, origin, error, None))
}

fn refresh_buffer(
    state: &RecordEditorState,
    tool: &ResolvedTool,
    buffer: &mut Buffer,
    deadline: Instant,
    cancel: &AtomicBool,
) -> Result<()> {
    if let Some(saved_file) = &buffer.refresh_after_save {
        let offered = OfferedFile {
            context: buffer.context.clone(),
            path: buffer.path.clone(),
        };
        let fresh = read_buffer(
            state,
            tool,
            &offered,
            &buffer.offered_token,
            deadline,
            cancel,
        )?;
        if &fresh.expected_file != saved_file {
            return Err(BridgeError::new(
                "records-app-file-changed",
                "This file changed after the save. Your draft text has been kept.",
            ));
        }
        buffer.records_revision = fresh.records_revision;
        buffer.expected_file = fresh.expected_file;
        buffer.expected_context = fresh.expected_context;
        buffer.operation_id = fresh.operation_id;
        buffer.refresh_after_save = None;
    }
    Ok(())
}
fn receipt(result: &Value, operation_id: &str) -> Result<SaveReceipt> {
    let read = |key: &str| {
        result[key]
            .as_str()
            .filter(|value| is_oid(value))
            .map(str::to_owned)
            .ok_or_else(|| {
                BridgeError::after_launch(
                    "records-app-protocol",
                    "The persistence receipt was invalid.",
                )
            })
    };
    if result["status"] != "saved"
        || result["operationId"] != operation_id
        || !result["recovered"].is_boolean()
        || !result["ref"]
            .as_str()
            .is_some_and(|value| value.starts_with("refs/heads/"))
    {
        return Err(BridgeError::after_launch(
            "records-app-protocol",
            "The persistence receipt did not match the submitted save.",
        ));
    }
    let paths: Vec<String> = serde_json::from_value(result["paths"].clone()).map_err(|_| {
        BridgeError::after_launch(
            "records-app-protocol",
            "The persistence receipt paths were invalid.",
        )
    })?;
    Ok(SaveReceipt {
        operation_id: operation_id.into(),
        commit: read("commit")?,
        tree: read("tree")?,
        r#ref: result["ref"].as_str().unwrap().into(),
        previous_revision: read("previousRevision")?,
        recovered: result["recovered"].as_bool().unwrap(),
        paths,
        cleanup_warning: result.get("cleanupWarning").map(|_| "Saved. Recovery cleanup is pending; local history changes may remain unavailable.".into()),
    })
}
fn check_messages(result: &Value) -> Vec<String> {
    result["blocking"]
        .as_array()
        .into_iter()
        .flatten()
        .take(20)
        .filter_map(|entry| entry["message"].as_str())
        .map(|message| message.chars().take(500).collect())
        .collect()
}

pub fn run(
    watch: &WatchState,
    state: &RecordEditorState,
    buffer_id: &str,
    attempt: u64,
    action: EditorAction,
    content: &str,
) -> EditorOutcome {
    let original = state
        .buffers
        .lock()
        .expect("record buffers mutex poisoned")
        .get(buffer_id)
        .cloned();
    let origin = original
        .as_ref()
        .map(|buffer| buffer.context.origin.clone());
    let was_pending = original.as_ref().is_some_and(|buffer| {
        buffer.pending.is_some() || action == EditorAction::Replay && buffer.last_save.is_some()
    });
    let original_pending = original
        .as_ref()
        .and_then(|buffer| {
            buffer.pending.as_ref().or_else(|| {
                (action == EditorAction::Replay)
                    .then_some(buffer.last_save.as_ref())
                    .flatten()
            })
        })
        .cloned();
    let native_attempt = state.next();
    let mut submitted_pending: Option<PendingSave> = None;
    let result = (|| {
        let mut buffer = original.ok_or_else(|| {
            BridgeError::new(
                "records-app-buffer-unknown",
                "Open this record again before editing.",
            )
        })?;
        if action == EditorAction::Replay && buffer.pending.is_none() {
            buffer.pending = buffer.last_save.clone();
        }
        if content.len() > MAX_DOCUMENT {
            return Err(BridgeError::new(
                "records-app-document-limit",
                "This record is too large to edit here.",
            ));
        }
        let _flight = watch.begin_pick().ok_or_else(|| {
            BridgeError::new(
                "records-app-busy",
                "A workspace operation is still running.",
            )
        })?;
        let lease = state.begin(buffer_id, attempt)?;
        let deadline = Instant::now()
            + if action == EditorAction::Check {
                CHECK_TIME
            } else {
                SAVE_TIME
            };
        if action != EditorAction::Replay {
            verify_context(watch, &buffer.context)?;
        }
        let tool = state.tool(deadline, &lease.cancel)?;
        if action != EditorAction::Replay {
            if buffer.pending.is_some() {
                return Err(BridgeError::new(
                    "records-app-save-unknown",
                    "Reconcile the previous save before submitting changed text.",
                ));
            }
            refresh_buffer(state, &tool, &mut buffer, deadline, &lease.cancel)?;
        }
        if action == EditorAction::Check {
            let request = json!({"version":1,"requestId":format!("record-check-{}", state.next()),"operation":"check",
                "productRoot":buffer.context.product,"productRevision":buffer.context.product_revision,"recordsRevision":buffer.records_revision,
                "path":buffer.path,"expectedFile":buffer.expected_file,"expectedContext":buffer.expected_context,"edit":{"contentBase64":BASE64.encode(content.as_bytes())}});
            let checked = invoke_tool(
                &tool,
                &buffer.context.product,
                &request,
                deadline,
                &lease.cancel,
            )?;
            if checked["status"] != "checked"
                || !checked["accepted"].is_boolean()
                || observed(&checked["observedFile"])? != buffer.expected_file
                || checked["expectedContext"] != buffer.expected_context
            {
                return Err(BridgeError::after_launch(
                    "records-app-protocol",
                    "The validation response did not match this draft's original file/context.",
                ));
            }
            let count = |key: &str| checked[key].as_array().map_or(0, Vec::len);
            let response = EditorOutcome::Checked {
                operation_key: buffer_id.into(),
                attempt,
                buffer_id: buffer_id.into(),
                origin: buffer.context.origin.clone(),
                accepted: checked["accepted"].as_bool().unwrap(),
                blocking: count("blocking"),
                warnings: count("warnings"),
                retained: count("retained"),
                messages: check_messages(&checked),
                operation_id: buffer.operation_id.clone(),
            };
            state
                .buffers
                .lock()
                .expect("record buffers mutex poisoned")
                .insert(buffer_id.into(), buffer);
            return Ok(response);
        }
        let mut pending = if action == EditorAction::Replay {
            buffer.pending.clone().ok_or_else(|| {
                BridgeError::new(
                    "records-app-no-pending-save",
                    "There is no unknown save to reconcile.",
                )
            })?
        } else {
            PendingSave {
                operation_id: buffer.operation_id.clone(),
                content: content.into(),
                native_attempt,
                frontend_attempt: attempt,
                records_revision: buffer.records_revision.clone(),
            }
        };
        pending.native_attempt = native_attempt;
        pending.frontend_attempt = attempt;
        submitted_pending = Some(pending.clone());
        buffer.pending = Some(pending.clone());
        state
            .buffers
            .lock()
            .expect("record buffers mutex poisoned")
            .insert(buffer_id.into(), buffer.clone());
        let request = if action == EditorAction::Replay {
            json!({"version":1,"requestId":format!("record-replay-{}", state.next()),"operation":"replay",
                "productRoot":buffer.context.product,"operationId":pending.operation_id})
        } else {
            json!({"version":1,"requestId":format!("record-save-{}", state.next()),"operation":"save",
                "productRoot":buffer.context.product,"productRevision":buffer.context.product_revision,"recordsRevision":buffer.records_revision,
                "path":buffer.path,"expectedFile":buffer.expected_file,"expectedContext":buffer.expected_context,
                "edit":{"contentBase64":BASE64.encode(pending.content.as_bytes())},"operationId":pending.operation_id})
        };
        let saved = invoke_tool(
            &tool,
            &buffer.context.product,
            &request,
            deadline,
            &lease.cancel,
        )?;
        let receipt = receipt(&saved, &pending.operation_id)?;
        if receipt.previous_revision != pending.records_revision {
            return Err(BridgeError::after_launch(
                "records-app-protocol",
                "The persistence receipt belongs to a different original revision.",
            ));
        }
        let wanted = ObservedFile {
            present: true,
            sha256: digest(pending.content.as_bytes()),
            mode: buffer.expected_file.mode.clone(),
        };
        // The immutable accepted receipt belongs to the submitted bytes. Any
        // optional fresh observation is separately validated; later owners do
        // not turn this historical acceptance into an unknown operation.
        let current_matches = saved
            .get("observedFile")
            .map(observed)
            .transpose()?
            .as_ref()
            == Some(&wanted);
        if !receipt.paths.contains(&buffer.path) {
            return Err(BridgeError::after_launch(
                "records-app-protocol",
                "The save receipt did not include this draft's file.",
            ));
        }
        buffer.content = pending.content.clone();
        buffer.refresh_after_save = Some(wanted);
        buffer.last_save = Some(pending.clone());
        buffer.pending = None;
        state
            .buffers
            .lock()
            .expect("record buffers mutex poisoned")
            .insert(buffer_id.into(), buffer.clone());
        recovery::remember_receipt(state, buffer_id, &buffer.context.product, &receipt);
        Ok(EditorOutcome::Saved {
            operation_key: buffer_id.into(),
            attempt,
            buffer_id: buffer_id.into(),
            origin: buffer.context.origin,
            receipt,
            submitted_content: pending.content,
            message: (!current_matches).then(|| "The earlier save completed. The current file will be read again before another save.".into()),
        })
    })();
    result.unwrap_or_else(|error| {
        finish_error(
            state,
            buffer_id,
            attempt,
            native_attempt,
            origin,
            error,
            was_pending,
            submitted_pending.as_ref(),
            original_pending.as_ref(),
        )
    })
}

#[allow(clippy::too_many_arguments)]
fn finish_error(
    state: &RecordEditorState,
    buffer_id: &str,
    attempt: u64,
    native_attempt: u64,
    origin: Option<EditorOrigin>,
    error: BridgeError,
    was_pending: bool,
    submitted_pending: Option<&PendingSave>,
    original_pending: Option<&PendingSave>,
) -> EditorOutcome {
    let mut buffers = state.buffers.lock().expect("record buffers mutex poisoned");
    let unknown =
        !error.certain_refused && (was_pending || submitted_pending.is_some() && error.launched);
    let pending = if unknown {
        submitted_pending
            .or(original_pending)
            .map(|pending| pending.operation_id.clone())
    } else {
        None
    };
    if !unknown {
        if let Some(buffer) = buffers.get_mut(buffer_id) {
            if buffer
                .pending
                .as_ref()
                .is_some_and(|pending| pending.native_attempt == native_attempt)
            {
                buffer.pending = None;
                if let Some(id) = &error.next_operation_id {
                    buffer.operation_id = id.clone();
                }
            }
        }
    }
    outcome_error(buffer_id, attempt, origin, error, pending)
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use std::fs;
    use std::os::unix::fs::PermissionsExt;
    static NEXT: AtomicU64 = AtomicU64::new(0);
    fn git(root: &Path, args: &[&str]) -> String {
        let output = Command::new("git")
            .current_dir(root)
            .args([
                "-c",
                "maintenance.auto=false",
                "-c",
                "gc.auto=0",
                "-c",
                "commit.gpgsign=false",
            ])
            .args(args)
            .env("GIT_AUTHOR_NAME", "Record fixture")
            .env("GIT_AUTHOR_EMAIL", "fixture@example.invalid")
            .env("GIT_COMMITTER_NAME", "Record fixture")
            .env("GIT_COMMITTER_EMAIL", "fixture@example.invalid")
            .env_remove("GIT_DIR")
            .env_remove("GIT_WORK_TREE")
            .env_remove("GIT_CONFIG_COUNT")
            .output()
            .unwrap();
        assert!(
            output.status.success(),
            "fixture Git {args:?}: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        String::from_utf8(output.stdout).unwrap().trim().into()
    }
    fn repository(root: &Path) {
        fs::create_dir_all(root.join("docs")).unwrap();
        fs::write(
            root.join("docs/ROADMAP.md"),
            "# Roadmap\n\n## Backbone\n- F-01: Test — fixture\n",
        )
        .unwrap();
        git(root, &["init", "-q", "--initial-branch=main"]);
        git(root, &["config", "user.name", "Record fixture"]);
        git(root, &["config", "user.email", "fixture@example.invalid"]);
        git(root, &["add", "."]);
        git(root, &["commit", "-qm", "Initial record fixture"]);
    }
    struct Fixture {
        root: PathBuf,
        product: PathBuf,
        records: PathBuf,
        watch: WatchState,
        editor: RecordEditorState,
    }
    impl Fixture {
        fn new(scenario: &str) -> Self {
            let root = std::env::temp_dir().join(format!(
                "supertaskr-record-editor-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::SeqCst)
            ));
            fs::create_dir_all(&root).unwrap();
            let root = root.canonicalize().unwrap();
            let product = root.join("product");
            let records = root.join("records");
            repository(&product);
            repository(&records);
            fs::write(product.join("docs/ROADMAP.md"), "PRODUCT DECOY\n").unwrap();
            Self::bind(&product, &records);
            let program = root.join("supertaskr");
            let preamble = format!(
                "#!/usr/bin/env node\nconst scenario={};\nconst fixture={};\n",
                serde_json::to_string(scenario).unwrap(),
                serde_json::to_string(root.to_str().unwrap()).unwrap()
            );
            // Controlled wire/effect responses. These are not the installed
            // production save service and do not qualify actual save delivery.
            fs::write(&program, preamble + r#"
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const args=process.argv.slice(2);if(JSON.stringify(args)!=='["records","--stdio"]'&&!(scenario==='graph-index'&&JSON.stringify(args)==='["index","--stdio"]'))process.exit(91);
const q=JSON.parse(fs.readFileSync(0,'utf8'));fs.appendFileSync(path.join(fixture,'calls'),q.operation+'\n');
const emit=result=>process.stdout.write(JSON.stringify({version:1,requestId:q.requestId,ok:true,result}));
const operations=()=>fs.readdirSync(fixture).filter(name=>name.endsWith('.operation.json')).map(name=>JSON.parse(fs.readFileSync(path.join(fixture,name),'utf8')));
const metadata=op=>{const {capture,...row}=op;return row;};
if(q.operation==='discover'){emit({status:'recoveries',recoveries:operations().filter(op=>!fs.existsSync(path.join(fixture,op.operationId+'.ack'))).map(metadata)});process.exit(0);}
if(q.operation==='acknowledge'){const op=operations().find(op=>op.operationId===q.operationId);if(!op||op.receipt?.commit!==q.commit)process.exit(93);fs.writeFileSync(path.join(fixture,q.operationId+'.ack'),'acknowledged');emit({status:'acknowledged',operationId:q.operationId,commit:q.commit});process.exit(0);}
const records=q.operation==='replay'?operations().find(op=>op.operationId===q.operationId).recordOrigin.root:JSON.parse(fs.readFileSync(path.join(q.productRoot,'.supertaskr/workspace.json'),'utf8')).recordsRoot;
const git=args=>cp.execFileSync('git',['-C',records,'-c','maintenance.auto=false','-c','gc.auto=0','-c','commit.gpgsign=false',...args],{encoding:'utf8'}).trim();
const physical=file=>{const b=fs.readFileSync(file);return{present:true,sha256:crypto.createHash('sha256').update(b).digest('hex'),mode:(fs.statSync(file).mode&73)?'100755':'100644'};};
const rootStat=fs.statSync(records,{bigint:true}),docsStat=fs.statSync(path.join(records,'docs'),{bigint:true});
const recordOrigin={root:records,gitDirectory:path.join(records,'.git'),commonDirectory:path.join(records,'.git'),device:String(rootStat.dev),inode:String(rootStat.ino),docsDirectory:path.join(records,'docs'),docsDevice:String(docsStat.dev),docsInode:String(docsStat.ino)};
const expectedContext='sha256:'+crypto.createHash('sha256').update(JSON.stringify(recordOrigin)).digest('hex');
if(q.operation==='index'){
 if(q.expectedOrigin.recordsRoot!==records||q.expectedOrigin.rootIncarnation!==`${recordOrigin.device}:${recordOrigin.inode}`)process.exit(94);
 fs.mkdirSync(path.join(records,'docs/architecture'),{recursive:true});fs.writeFileSync(path.join(records,'docs/architecture/graph.json'),'controlled native graph effect\n');
 emit({status:'indexed',changed:true,files:1,symbols:1,edges:0,truncated:false,graphBytes:31,durationMs:1,recovered:false});
}else if(q.operation==='read'){
 const file=path.join(records,q.path);if(scenario==='wrong-origin')recordOrigin.root=path.join(fixture,'foreign-records');
 const matching=operations().filter(op=>!fs.existsSync(path.join(fixture,op.operationId+'.ack'))&&JSON.stringify(op.recordOrigin)===JSON.stringify(recordOrigin)&&op.paths.includes(q.path));
 const pending=matching.filter(op=>op.state==='pending'&&op.editorRecovery==='available');
 const recoveries=matching.map(op=>({...metadata(op),...(pending.length===1&&pending[0]===op?{capture:op.capture}:{})}));
 emit({status:'read',path:q.path,productRevision:q.productRevision,recordsRevision:git(['rev-parse','HEAD']),contentBase64:fs.readFileSync(file).toString('base64'),observedFile:physical(file),operationId:'save-'+crypto.randomUUID(),expectedContext,recordOrigin,recoveries});
}else if(q.operation==='check'){
 emit({status:'checked',accepted:true,blocking:[],warnings:[],retained:[],procedural:[],observedFile:physical(path.join(records,q.path)),expectedContext});
}else if(q.operation==='save'){
 if(scenario==='terminal-refused'&&!fs.existsSync(path.join(fixture,'refused-once'))){fs.writeFileSync(path.join(fixture,'refused-once'),'known zero effects');process.stdout.write(JSON.stringify({version:1,requestId:q.requestId,ok:false,error:{code:'OPERATION_POLICY_REFUSED',message:'Known zero-effect refusal',state:'refused',operationId:q.operationId,nextOperationId:'save-next-refused-operation'}}));process.exit(1);}
 const op={operationId:q.operationId,state:'pending',createdAt:new Date().toISOString(),productRoot:q.productRoot,productRevision:q.productRevision,recordsRevision:q.recordsRevision,recordOrigin,paths:[q.path],expectedContext:q.expectedContext,editorRecovery:'available',capture:{operationId:q.operationId,path:q.path,contentBase64:q.edit.contentBase64,expectedFile:q.expectedFile,expectedContext:q.expectedContext,productRevision:q.productRevision,recordsRevision:q.recordsRevision}};
 if(scenario==='unsupported-pending-restart'||scenario==='derived-pending-restart')op.editorRecovery='unavailable';
 fs.writeFileSync(path.join(fixture,q.operationId+'.operation.json'),JSON.stringify(op));
 if(scenario==='pending-restart'||scenario==='unsupported-pending-restart'||scenario==='derived-pending-restart'){process.stdout.write('interrupted before working effect');process.exit(0);}
 const previousRevision=git(['rev-parse','HEAD']);fs.writeFileSync(path.join(records,q.path),Buffer.from(q.edit.contentBase64,'base64'));
 git(['add','--',q.path]);git(['commit','-qm','Controlled fixture record effect']);
 const result={status:'saved',operationId:q.operationId,commit:git(['rev-parse','HEAD']),tree:git(['rev-parse','HEAD^{tree}']),ref:'refs/heads/main',previousRevision,recovered:false,paths:[q.path],procedural:[],observedFile:physical(path.join(records,q.path)),expectedContext};
 if(scenario==='save-observation-advanced'){fs.writeFileSync(path.join(records,q.path),'Later owner working bytes\n');result.observedFile=physical(path.join(records,q.path));}
 fs.writeFileSync(path.join(fixture,q.operationId+'.json'),JSON.stringify(result));
 Object.assign(op,{state:'accepted',editorRecovery:'unavailable',receipt:{commit:result.commit,tree:result.tree,ref:result.ref,previousRevision:result.previousRevision}});fs.writeFileSync(path.join(fixture,q.operationId+'.operation.json'),JSON.stringify(op));
 if(scenario==='lost-save-response')process.stdout.write('response lost');else emit(result);
}else if(q.operation==='replay'){
 const op=operations().find(op=>op.operationId===q.operationId);
 if(op?.state==='pending'){
  const root=op.recordOrigin.root,gitAt=args=>cp.execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
  fs.writeFileSync(path.join(root,op.capture.path),Buffer.from(op.capture.contentBase64,'base64'));gitAt(['add','--',op.capture.path]);gitAt(['commit','-qm','Recovered controlled fixture effect']);
  const written=op.paths.slice();
  if(scenario==='derived-pending-restart'){fs.writeFileSync(path.join(root,'docs/INDEX.md'),'# Index\n\nDerived private index.\n');gitAt(['add','--','docs/INDEX.md']);gitAt(['commit','--amend','--no-edit','-q']);written.push('docs/INDEX.md');}
  const result={status:'saved',operationId:op.operationId,commit:gitAt(['rev-parse','HEAD']),tree:gitAt(['rev-parse','HEAD^{tree}']),ref:'refs/heads/main',previousRevision:op.recordsRevision,recovered:true,paths:written,procedural:[]};
  Object.assign(op,{state:'accepted',editorRecovery:'unavailable',receipt:{commit:result.commit,tree:result.tree,ref:result.ref,previousRevision:result.previousRevision}});fs.writeFileSync(path.join(fixture,op.operationId+'.operation.json'),JSON.stringify(op));fs.writeFileSync(path.join(fixture,op.operationId+'.json'),JSON.stringify(result));
 }
 const result=JSON.parse(fs.readFileSync(path.join(fixture,q.operationId+'.json'),'utf8'));result.recovered=true;delete result.observedFile;emit(result);
}else process.exit(92);
"#).unwrap();
            fs::set_permissions(&program, fs::Permissions::from_mode(0o755)).unwrap();
            let child_path = std::env::join_paths(sanitized_dirs(
                std::env::var_os("PATH").as_deref().unwrap_or_default(),
            ))
            .unwrap();
            let editor = RecordEditorState {
                tool_override: Some(ResolvedTool {
                    program,
                    child_path,
                }),
                ..RecordEditorState::default()
            };
            let watch = WatchState::start(Some(product.clone()), |_| {});
            let _ = docs_watch::project_status(&watch);
            Self {
                root,
                product,
                records,
                watch,
                editor,
            }
        }
        fn bind(product: &Path, records: &Path) {
            fs::create_dir_all(product.join(".supertaskr")).unwrap();
            let identity = WorkspaceResolver::new()
                .unwrap()
                .measure_product_identity(product, "HEAD")
                .unwrap();
            fs::write(records.join("workspace-association.json"), serde_json::to_vec(&json!({"version":1,"projectId":"record-fixture","product":{"objectFormat":identity.object_format,"rootCommits":identity.root_commits}})).unwrap()).unwrap();
            fs::write(product.join(".supertaskr/workspace.json"), serde_json::to_vec(&json!({"version":1,"projectId":"record-fixture","productRoot":product,"recordsRoot":records})).unwrap()).unwrap();
        }
        fn open(&self) -> EditorBuffer {
            let token = match files(&self.watch, &self.editor, 1) {
                EditorOutcome::Files { files, .. } => {
                    files
                        .into_iter()
                        .find(|file| file.path == "docs/ROADMAP.md")
                        .unwrap()
                        .token
                }
                other => panic!("expected native offers: {other:?}"),
            };
            match open(&self.watch, &self.editor, &token, 2) {
                EditorOutcome::Opened { buffer, .. } => buffer,
                other => panic!("expected opened private record: {other:?}"),
            }
        }
        fn restarted_editor(&self) -> RecordEditorState {
            RecordEditorState {
                tool_override: self.editor.tool_override.clone(),
                ..RecordEditorState::default()
            }
        }
    }

    #[test]
    fn restarted_editor_recovers_captured_pending_text_and_original_id_before_new_saves() {
        let fx = Fixture::new("pending-restart");
        let original = fx.open();
        let submitted = format!("{}\nInterrupted original text.\n", original.content);
        assert!(matches!(
            run(
                &fx.watch,
                &fx.editor,
                &original.id,
                3,
                EditorAction::Save,
                &submitted
            ),
            EditorOutcome::Error { unknown: true, .. }
        ));
        let restarted = fx.restarted_editor();
        assert!(restarted.buffers.lock().unwrap().is_empty());
        let discovered = serde_json::to_value(discover(&fx.watch, &restarted, 4)).unwrap();
        assert_eq!(discovered["kind"], "recoveries");
        let token = discovered["recoveries"][0]["token"].as_str().unwrap();
        assert_eq!(
            discovered["recoveries"][0]["operationId"],
            original.operation_id
        );
        let recovered = match open(&fx.watch, &restarted, token, 5) {
            EditorOutcome::Opened { buffer, .. } => buffer,
            other => panic!("expected original recovery draft: {other:?}"),
        };
        assert_eq!(
            recovered.recovery_content.as_deref(),
            Some(submitted.as_str())
        );
        assert_eq!(recovered.operation_id, original.operation_id);
        assert!(matches!(
            run(
                &fx.watch,
                &restarted,
                &recovered.id,
                6,
                EditorAction::Save,
                "new text must not reuse captured intent"
            ),
            EditorOutcome::Error { unknown: true, .. }
        ));
        assert!(
            matches!(run(&fx.watch, &restarted, &recovered.id, 7, EditorAction::Replay, "ignored newer UI text"), EditorOutcome::Saved { ref submitted_content, ref receipt, .. } if submitted_content == &submitted && receipt.operation_id == original.operation_id)
        );
        assert_eq!(
            fs::read_to_string(fx.records.join("docs/ROADMAP.md")).unwrap(),
            submitted
        );
        assert!(acknowledge(&fx.watch, &restarted, &recovered.id, 8));
        let after = serde_json::to_value(discover(&fx.watch, &restarted, 9)).unwrap();
        assert_eq!(after["recoveries"], json!([]));
        assert_eq!(
            fs::read_to_string(fx.root.join("calls"))
                .unwrap()
                .lines()
                .filter(|v| *v == "save")
                .count(),
            1
        );
        restarted.stop();
    }

    #[test]
    fn accepted_restart_receipt_is_discovered_before_current_binding_and_never_reopens_old_text() {
        let fx = Fixture::new("lost-save-response");
        let original = fx.open();
        let submitted = format!("{}\nAccepted but unacknowledged.\n", original.content);
        assert!(matches!(
            run(
                &fx.watch,
                &fx.editor,
                &original.id,
                3,
                EditorAction::Save,
                &submitted
            ),
            EditorOutcome::Error { unknown: true, .. }
        ));
        let accepted = git(&fx.records, &["rev-parse", "HEAD"]);
        fs::write(
            fx.product.join(".supertaskr/workspace.json"),
            "unavailable current binding",
        )
        .unwrap();
        let restarted = fx.restarted_editor();
        let discovered = serde_json::to_value(discover(&fx.watch, &restarted, 4)).unwrap();
        assert_eq!(discovered["kind"], "recoveries");
        let row = &discovered["recoveries"][0];
        assert_eq!(row["state"], "accepted");
        assert_eq!(row["editorAvailable"], false);
        assert_eq!(row["receipt"]["commit"], accepted);
        assert!(!row.as_object().unwrap().contains_key("content"));
        assert!(restarted.buffers.lock().unwrap().is_empty());
        assert!(acknowledge(
            &fx.watch,
            &restarted,
            row["token"].as_str().unwrap(),
            5
        ));
        assert_eq!(git(&fx.records, &["rev-parse", "HEAD"]), accepted);
        restarted.stop();
    }

    #[test]
    fn unsupported_pending_edit_blocks_new_buffer_and_replays_original_operation_without_current_binding(
    ) {
        let fx = Fixture::new("unsupported-pending-restart");
        let original = fx.open();
        let submitted = format!(
            "{}\nOriginal unsupported editor capture.\n",
            original.content
        );
        assert!(matches!(
            run(
                &fx.watch,
                &fx.editor,
                &original.id,
                3,
                EditorAction::Save,
                &submitted
            ),
            EditorOutcome::Error { unknown: true, .. }
        ));
        let restarted = fx.restarted_editor();
        let token = match files(&fx.watch, &restarted, 4) {
            EditorOutcome::Files { files, .. } => {
                files
                    .into_iter()
                    .find(|f| f.path == original.path)
                    .unwrap()
                    .token
            }
            other => panic!("expected file list: {other:?}"),
        };
        assert!(
            matches!(open(&fx.watch, &restarted, &token, 5), EditorOutcome::Error { ref code, .. } if code == "records-app-recovery-unavailable")
        );
        assert!(restarted.buffers.lock().unwrap().is_empty());
        fs::write(
            fx.product.join(".supertaskr/workspace.json"),
            "unavailable current binding",
        )
        .unwrap();
        let discovered = serde_json::to_value(discover(&fx.watch, &restarted, 6)).unwrap();
        let token = discovered["recoveries"][0]["token"].as_str().unwrap();
        assert!(
            matches!(recover(&fx.watch, &restarted, token, 7), EditorOutcome::Recovered { ref receipt, .. } if receipt.operation_id == original.operation_id)
        );
        assert_eq!(
            fs::read_to_string(fx.records.join("docs/ROADMAP.md")).unwrap(),
            submitted
        );
        assert!(restarted.buffers.lock().unwrap().is_empty());
        restarted.stop();
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            self.editor.stop();
            self.watch.stop_for_test();
            let _ = fs::remove_dir_all(&self.root);
        }
    }

    #[test]
    fn recovery_admits_the_original_edit_and_actual_generated_index_write() {
        let fx = Fixture::new("derived-pending-restart");
        let original = fx.open();
        let submitted = format!("{}\nOriginal edit with derived index.\n", original.content);
        assert!(matches!(
            run(&fx.watch, &fx.editor, &original.id, 3, EditorAction::Save, &submitted),
            EditorOutcome::Error { unknown: true, .. }
        ));
        let restarted = fx.restarted_editor();
        let discovered = serde_json::to_value(discover(&fx.watch, &restarted, 4)).unwrap();
        let row = &discovered["recoveries"][0];
        assert_eq!(row["paths"], json!([original.path]));
        assert_eq!(row["recordsDir"], original.origin.records_dir);
        assert_eq!(row["operationId"], original.operation_id);
        let token = row["token"].as_str().unwrap();
        let receipt = match recover(&fx.watch, &restarted, token, 5) {
            EditorOutcome::Recovered { receipt, .. } => receipt,
            other => panic!("expected original receipt with derived write: {other:?}"),
        };
        assert_eq!(receipt.operation_id, original.operation_id);
        assert_eq!(receipt.previous_revision, original.records_revision);
        assert_eq!(receipt.paths, vec![original.path.clone(), "docs/INDEX.md".into()]);
        assert_eq!(git(&fx.records, &["rev-parse", "HEAD"]), receipt.commit);
        assert_eq!(fs::read_to_string(fx.records.join(&original.path)).unwrap(), submitted);
        assert_eq!(fs::read_to_string(fx.records.join("docs/INDEX.md")).unwrap(), "# Index\n\nDerived private index.\n");
        assert_eq!(fs::read_to_string(fx.product.join(&original.path)).unwrap(), "PRODUCT DECOY\n");
        assert!(restarted.buffers.lock().unwrap().is_empty());
        assert!(acknowledge(&fx.watch, &restarted, token, 6));
        let after = serde_json::to_value(discover(&fx.watch, &restarted, 7)).unwrap();
        assert_eq!(after["recoveries"], json!([]));
        restarted.stop();
    }

    #[test]
    fn initialization_inspection_uses_a_fixed_command_under_the_original_selection_claim() {
        use crate::agent::context::{ExpectedContext, PreparedContext};
        let fx = Fixture::new("normal");
        let calls = fx.root.join("init-calls");
        // Controlled wire only; this proves the fixed native command/context
        // boundary, not installed production setup/current-admission delivery.
        fs::write(fx.root.join("supertaskr"), format!(r#"#!/usr/bin/env node
const fs=require('node:fs');
if(JSON.stringify(process.argv.slice(2))!=='["init","--stdio"]')process.exit(91);
const q=JSON.parse(fs.readFileSync(0,'utf8'));fs.appendFileSync({},JSON.stringify(q)+'\n');
process.stdout.write(JSON.stringify({{version:1,requestId:q.requestId,ok:true,result:{{status:'controlled-current',productRoot:q.productRoot}}}}));
"#, serde_json::to_string(&calls).unwrap())).unwrap();
        let token = |watch: &WatchState| { let scope = watch.message_scope(); ExpectedContext {
            selection_sequence: scope.selection_sequence, context_sequence: scope.context_sequence } };
        let prepared = PreparedContext::capture(&fx.watch, Some(token(&fx.watch))).unwrap();
        assert!(fx.watch.begin_pick().is_none(), "the prepared command keeps its selected origin claimed");
        let result = inspect_initialized_project(&fx.watch, &fx.editor, &prepared).unwrap();
        assert_eq!(result["status"], "controlled-current");
        let first = fs::read_to_string(&calls).unwrap();
        let sent: Value = serde_json::from_str(first.trim()).unwrap();
        assert_eq!(sent["productRoot"], json!(fx.product));
        assert_eq!(sent["operation"], "inspect");
        assert_eq!(sent.as_object().unwrap().keys().cloned().collect::<Vec<_>>(), vec!["operation", "productRoot", "requestId", "version"]);
        let next = fx.root.join("other-records"); repository(&next); Fixture::bind(&fx.product, &next);
        assert!(inspect_initialized_project(&fx.watch, &fx.editor, &prepared).is_err());
        assert_eq!(fs::read_to_string(&calls).unwrap(), first, "stale origin refuses before another child launch");
        drop(prepared);
        assert!(matches!(docs_watch::apply_picked_folder(&fx.watch, &fx.product, fx.watch.begin_pick().unwrap()), docs_watch::PickOutcome::Picked {..}));
        let current = PreparedContext::capture(&fx.watch, Some(token(&fx.watch))).unwrap();
        assert_eq!(current.context.records, next);
        assert_eq!(inspect_initialized_project(&fx.watch, &fx.editor, &current).unwrap()["status"], "controlled-current");
        assert_eq!(fs::read_to_string(&calls).unwrap().lines().count(), 2);
    }

    #[test]
    fn a_queued_index_request_never_acquires_a_successor_selection_as_write_authority() {
        let original = Fixture::new("graph-index");
        let replacement = Fixture::new("graph-index");
        let frozen = original.watch.message_scope();
        let old_token = crate::index_cmd::IndexSelectionToken {selection_sequence:frozen.selection_sequence,context_sequence:frozen.context_sequence};
        // This is the scheduling gap: native command capture precedes the
        // blocking job. Switching before that job must refuse the old request.
        assert!(matches!(docs_watch::apply_picked_folder(&original.watch, &replacement.product,
            original.watch.begin_pick().unwrap()), docs_watch::PickOutcome::Picked {..}));
        let refused = crate::index_cmd::run_index_for_scope(&original.watch, &original.editor, None, frozen.clone());
        assert!(matches!(refused.outcome, crate::index_cmd::IndexOutcome::Error {..}));
        assert_eq!(refused.scope.project_dir, frozen.project_dir);
        assert!(matches!(index_selected_records(&original.watch, &original.editor, None, &frozen),
            Err(ref code) if code == "graph-selection-changed"), "the bridge itself must retain the caller's original origin");
        assert!(!original.records.join("docs/architecture/graph.json").exists());
        assert!(!replacement.records.join("docs/architecture/graph.json").exists());
        assert!(!original.root.join("calls").exists(), "the old job must not launch a tool for the new selection");
        let successor = original.watch.message_scope();
        assert!(crate::index_cmd::capture_index_scope(&original.watch, Some(&old_token)).is_err(),
            "a rendered A click must refuse if native B was already selected before IPC entry");
        assert!(crate::index_cmd::capture_index_scope(&original.watch, None).is_err(), "managed views require their native-issued pair");
        let current_token = crate::index_cmd::IndexSelectionToken {selection_sequence:successor.selection_sequence,context_sequence:successor.context_sequence};
        assert!(crate::index_cmd::capture_index_scope(&original.watch, Some(&current_token)).is_ok());
        let accepted = crate::index_cmd::run_index_for_scope(&original.watch, &original.editor, None, successor.clone());
        assert!(matches!(accepted.outcome, crate::index_cmd::IndexOutcome::Indexed {changed:true,..}));
        assert_eq!(accepted.scope.project_dir, successor.project_dir);
        assert!(!original.records.join("docs/architecture/graph.json").exists());
        assert_eq!(fs::read_to_string(replacement.records.join("docs/architecture/graph.json")).unwrap(), "controlled native graph effect\n");
        assert_eq!(fs::read_to_string(original.root.join("calls")).unwrap(), "index\n");
    }

    #[test]
    fn known_zero_effect_refusal_adopts_fresh_id_and_keeps_original_text_editable() {
        let fx = Fixture::new("terminal-refused");
        let original = fx.open();
        let submitted = format!("{}\nFirst refused draft.\n", original.content);
        let refused = run(
            &fx.watch,
            &fx.editor,
            &original.id,
            3,
            EditorAction::Save,
            &submitted,
        );
        assert!(
            matches!(refused, EditorOutcome::Error { unknown: false, next_operation_id: Some(ref id), .. } if id == "save-next-refused-operation")
        );
        let buffer = fx
            .editor
            .buffers
            .lock()
            .unwrap()
            .get(&original.id)
            .cloned()
            .unwrap();
        assert!(buffer.pending.is_none());
        assert_eq!(buffer.operation_id, "save-next-refused-operation");
        assert_eq!(
            fs::read_to_string(fx.records.join(&original.path)).unwrap(),
            original.content
        );
        let corrected = format!("{}\nCorrected draft.\n", original.content);
        assert!(
            matches!(run(&fx.watch, &fx.editor, &original.id, 4, EditorAction::Save, &corrected), EditorOutcome::Saved { ref receipt, .. } if receipt.operation_id == "save-next-refused-operation")
        );
    }

    #[test]
    fn exact_receipt_survives_later_working_observation_but_another_save_requires_fresh_file() {
        let fx = Fixture::new("save-observation-advanced");
        let original = fx.open();
        let submitted = format!("{}\nOriginal accepted text.\n", original.content);
        assert!(
            matches!(run(&fx.watch, &fx.editor, &original.id, 3, EditorAction::Save, &submitted), EditorOutcome::Saved { ref submitted_content, message: Some(_), .. } if submitted_content == &submitted)
        );
        assert_eq!(
            fs::read_to_string(fx.records.join(&original.path)).unwrap(),
            "Later owner working bytes\n"
        );
        assert!(
            matches!(run(&fx.watch, &fx.editor, &original.id, 4, EditorAction::Save, "must not overwrite later bytes"), EditorOutcome::Error { ref code, unknown: false, .. } if code == "records-app-file-changed")
        );
        assert_eq!(
            fs::read_to_string(fx.records.join(&original.path)).unwrap(),
            "Later owner working bytes\n"
        );
    }

    #[test]
    fn native_offers_bind_read_check_and_controlled_save_to_private_file() {
        let fx = Fixture::new("normal");
        let buffer = fx.open();
        assert!(!buffer.content.contains("PRODUCT DECOY"));
        let content = format!("{}\nPrivate draft edit.\n", buffer.content);
        assert!(matches!(
            run(
                &fx.watch,
                &fx.editor,
                &buffer.id,
                3,
                EditorAction::Check,
                &content
            ),
            EditorOutcome::Checked { accepted: true, .. }
        ));
        let saved = run(
            &fx.watch,
            &fx.editor,
            &buffer.id,
            4,
            EditorAction::Save,
            &content,
        );
        assert!(
            matches!(saved, EditorOutcome::Saved { ref submitted_content, .. } if submitted_content == &content)
        );
        assert_eq!(
            fs::read_to_string(fx.records.join("docs/ROADMAP.md")).unwrap(),
            content
        );
        assert_eq!(
            fs::read_to_string(fx.product.join("docs/ROADMAP.md")).unwrap(),
            "PRODUCT DECOY\n"
        );
        let newer = format!("{content}\nA second edit.\n");
        assert!(matches!(
            run(
                &fx.watch,
                &fx.editor,
                &buffer.id,
                5,
                EditorAction::Save,
                &newer
            ),
            EditorOutcome::Saved { .. }
        ));
        assert_eq!(
            fs::read_to_string(fx.records.join("docs/ROADMAP.md")).unwrap(),
            newer
        );
    }

    #[test]
    fn arbitrary_frontend_token_and_wrong_origin_never_offer_a_buffer() {
        let fx = Fixture::new("wrong-origin");
        fs::write(fx.root.join("outside.md"), "REACHABLE FOREIGN FILE").unwrap();
        assert!(
            matches!(open(&fx.watch, &fx.editor, "../../outside.md", 1), EditorOutcome::Error { ref code, .. } if code == "records-app-file-unknown")
        );
        assert!(!fx.root.join("calls").exists());
        let token = match files(&fx.watch, &fx.editor, 2) {
            EditorOutcome::Files { files, .. } => files[0].token.clone(),
            other => panic!("{other:?}"),
        };
        assert!(
            matches!(open(&fx.watch, &fx.editor, &token, 3), EditorOutcome::Error { ref code, .. } if code == "records-app-origin-changed")
        );
        assert!(fx.editor.buffers.lock().unwrap().is_empty());
    }

    #[test]
    fn same_product_rebind_with_identical_history_refuses_old_buffer_and_admits_new_origin() {
        let fx = Fixture::new("normal");
        let old = fx.open();
        let second = fx.root.join("records-second");
        git(
            &fx.root,
            &[
                "clone",
                "-q",
                "--no-hardlinks",
                fx.records.to_str().unwrap(),
                second.to_str().unwrap(),
            ],
        );
        git(&second, &["config", "user.name", "Record fixture"]);
        git(
            &second,
            &["config", "user.email", "fixture@example.invalid"],
        );
        Fixture::bind(&fx.product, &second);
        assert!(
            matches!(run(&fx.watch, &fx.editor, &old.id, 3, EditorAction::Save, "old context must not write successor"), EditorOutcome::Error { ref code, unknown: false, .. } if code == "records-app-stale")
        );
        assert_eq!(
            fs::read_to_string(second.join("docs/ROADMAP.md")).unwrap(),
            old.content
        );
        let fresh = fx.open();
        assert_ne!(fresh.origin.records_dir, old.origin.records_dir);
        assert!(matches!(
            run(
                &fx.watch,
                &fx.editor,
                &fresh.id,
                4,
                EditorAction::Save,
                "# Current R2 record\n"
            ),
            EditorOutcome::Saved { .. }
        ));
        assert_eq!(
            fs::read_to_string(second.join("docs/ROADMAP.md")).unwrap(),
            "# Current R2 record\n"
        );
        assert_eq!(
            fs::read_to_string(fx.records.join("docs/ROADMAP.md")).unwrap(),
            old.content
        );
    }

    #[test]
    fn unknown_result_retains_exact_id_and_submitted_bytes_through_later_history_and_selection() {
        let fx = Fixture::new("lost-save-response");
        let original = fx.open();
        let submitted = "# Accepted original draft\n";
        let failed = run(
            &fx.watch,
            &fx.editor,
            &original.id,
            3,
            EditorAction::Save,
            submitted,
        );
        let operation_id = match failed {
            EditorOutcome::Error {
                unknown: true,
                operation_id: Some(id),
                ..
            } => id,
            other => panic!("{other:?}"),
        };
        assert_eq!(operation_id, original.operation_id);
        assert!(
            matches!(run(&fx.watch, &fx.editor, &original.id, 4, EditorAction::Save, "different proposed bytes"), EditorOutcome::Error { unknown: true, operation_id: Some(ref id), .. } if id == &operation_id)
        );
        fs::write(fx.records.join("later.md"), "later private owner\n").unwrap();
        git(&fx.records, &["add", "later.md"]);
        git(
            &fx.records,
            &["commit", "-qm", "Later legitimate private history"],
        );
        let advanced = git(&fx.records, &["rev-parse", "HEAD"]);
        let c = fx.root.join("other-product");
        repository(&c);
        assert!(matches!(
            docs_watch::apply_picked_folder(&fx.watch, &c, fx.watch.begin_pick().unwrap()),
            docs_watch::PickOutcome::Picked { .. }
        ));
        let replay = run(
            &fx.watch,
            &fx.editor,
            &original.id,
            5,
            EditorAction::Replay,
            "new unsaved bytes are not replay input",
        );
        assert!(
            matches!(replay, EditorOutcome::Saved { ref origin, ref receipt, ref submitted_content, .. } if origin == &original.origin && receipt.operation_id == operation_id && receipt.recovered && submitted_content == submitted)
        );
        assert_eq!(git(&fx.records, &["rev-parse", "HEAD"]), advanced);
        assert_eq!(
            fs::read_to_string(c.join("docs/ROADMAP.md")).unwrap(),
            "# Roadmap\n\n## Backbone\n- F-01: Test — fixture\n"
        );
    }

    #[test]
    fn stale_cancel_cannot_cancel_a_new_operation() {
        let state = RecordEditorState::default();
        let first = state.begin("buffer", 1).unwrap();
        assert!(!state.cancel("buffer", 0));
        assert!(state.cancel("buffer", 1));
        assert!(first.cancel.load(Ordering::SeqCst));
        assert!(state.begin("buffer", 2).is_err());
        drop(first);
        let newer = state.begin("buffer", 2).unwrap();
        assert!(!state.cancel("buffer", 1));
        assert!(!newer.cancel.load(Ordering::SeqCst));
    }

    #[test]
    fn obsolete_error_cleanup_cannot_clear_newer_pending_save() {
        let fx = Fixture::new("normal");
        let buffer = fx.open();
        let newer = PendingSave {
            operation_id: "save-newer".into(),
            content: "newer".into(),
            native_attempt: 200,
            frontend_attempt: 20,
            records_revision: buffer.records_revision.clone(),
        };
        fx.editor
            .buffers
            .lock()
            .unwrap()
            .get_mut(&buffer.id)
            .unwrap()
            .pending = Some(newer.clone());
        let old = PendingSave {
            operation_id: "save-old".into(),
            content: "old".into(),
            native_attempt: 100,
            frontend_attempt: 10,
            records_revision: buffer.records_revision.clone(),
        };
        let refused = BridgeError {
            certain_refused: true,
            ..BridgeError::new("records-refused", "No operation was created")
        };
        let result = finish_error(
            &fx.editor,
            &buffer.id,
            10,
            100,
            Some(buffer.origin.clone()),
            refused.clone(),
            false,
            Some(&old),
            None,
        );
        assert!(matches!(
            result,
            EditorOutcome::Error { unknown: false, .. }
        ));
        assert_eq!(
            fx.editor
                .buffers
                .lock()
                .unwrap()
                .get(&buffer.id)
                .unwrap()
                .pending
                .as_ref()
                .unwrap()
                .operation_id,
            newer.operation_id
        );
        finish_error(
            &fx.editor,
            &buffer.id,
            20,
            200,
            Some(buffer.origin),
            refused,
            false,
            Some(&newer),
            None,
        );
        assert!(
            fx.editor
                .buffers
                .lock()
                .unwrap()
                .get(&buffer.id)
                .unwrap()
                .pending
                .is_none(),
            "same-attempt refusal clears only its own pending operation"
        );
    }

    #[test]
    fn healthy_input_writer_delivers_every_byte_before_reader_eof() {
        let command = Command::new("/bin/cat");
        let input = vec![b'x'; MAX_DOCUMENT];
        let result = run_child(
            command,
            input.clone(),
            Instant::now() + Duration::from_secs(5),
            MAX_PROTOCOL,
            &AtomicBool::new(false),
        ).expect("healthy installed-service input pipe");
        assert!(result.success);
        assert_eq!(result.stdout, input);
    }

    #[test]
    fn cancellation_collects_owned_group_and_blocked_input_writer_before_returning() {
        let root = std::env::temp_dir().join(format!("record-input-cancel-{}-{}", std::process::id(), NEXT.fetch_add(1, Ordering::SeqCst)));
        fs::create_dir_all(&root).unwrap();
        let script = root.join("blocked.sh");
        let pid_file = root.join("pid");
        fs::write(&script, format!("#!/bin/sh\nprintf '%s' \"$$\" > '{}'\nexec /bin/sleep 30\n", pid_file.display())).unwrap();
        let cancel = Arc::new(AtomicBool::new(false));
        let trigger = cancel.clone();
        let observed = pid_file.clone();
        let cancelling = std::thread::spawn(move || {
            let until = Instant::now() + Duration::from_secs(2);
            while !observed.exists() && Instant::now() < until { std::thread::sleep(Duration::from_millis(5)); }
            trigger.store(true, Ordering::SeqCst);
        });
        let mut command = Command::new("/bin/sh"); command.arg(&script);
        let start = Instant::now();
        let result = run_child(command, vec![b'x'; MAX_PROTOCOL], Instant::now() + Duration::from_secs(5), MAX_PROTOCOL, &cancel);
        cancelling.join().unwrap();
        assert!(matches!(result, Err(BridgeError { ref code, launched: true, .. }) if code == "records-app-cancelled"));
        assert!(start.elapsed() < Duration::from_secs(3));
        let pid: i32 = fs::read_to_string(&pid_file).unwrap().parse().unwrap();
        assert!(!child_group_has_members(&ChildHandle::new(pid, 0)));
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn timeout_collects_owned_group_and_blocked_input_writer_before_returning() {
        let root = std::env::temp_dir().join(format!(
            "record-process-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::SeqCst)
        ));
        fs::create_dir_all(&root).unwrap();
        let script = root.join("blocked.sh");
        let pid_file = root.join("pid");
        fs::write(
            &script,
            format!(
                "#!/bin/sh\nprintf '%s' \"$$\" > '{}'\ntrap '' TERM\n/bin/sleep 30 &\nwait\n",
                pid_file.display()
            ),
        )
        .unwrap();
        let mut command = Command::new("/bin/sh");
        command.arg(&script);
        let result = run_child(
            command,
            vec![b'x'; MAX_PROTOCOL],
            Instant::now() + Duration::from_millis(200),
            MAX_PROTOCOL,
            &AtomicBool::new(false),
        );
        assert!(
            matches!(result, Err(BridgeError { ref code, launched: true, .. }) if code == "records-app-timeout")
        );
        let pid: i32 = fs::read_to_string(&pid_file).unwrap().parse().unwrap();
        assert!(!child_group_has_members(&ChildHandle::new(pid, 0)));
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn output_caps_and_request_correlation_refuse_oversized_or_foreign_responses() {
        let mut command = Command::new("/bin/sh");
        command.args([
            "-c",
            "while :; do printf 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; done",
        ]);
        let result = run_child(
            command,
            Vec::new(),
            Instant::now() + Duration::from_secs(2),
            1024,
            &AtomicBool::new(false),
        );
        assert!(
            matches!(result, Err(BridgeError { ref code, .. }) if code == "records-app-output-limit")
        );
        let fx = Fixture::new("normal");
        let script = fx.root.join("supertaskr");
        fs::write(&script, "#!/bin/sh\ncat >/dev/null\nprintf '%s' '{\"version\":1,\"requestId\":\"foreign\",\"ok\":true,\"result\":{}}'\n").unwrap();
        let tool = fx.editor.tool_override.as_ref().unwrap();
        let result = invoke_tool(
            tool,
            &fx.product,
            &json!({"version":1,"requestId":"own","operation":"read"}),
            Instant::now() + Duration::from_secs(2),
            &AtomicBool::new(false),
        );
        assert!(
            matches!(result, Err(BridgeError { ref code, .. }) if code == "records-app-protocol")
        );
    }
}

#[cfg(test)]
mod accepted_cleanup_tests {
    use super::*;
    #[test]
    fn accepted_receipt_keeps_success_and_exposes_cleanup_separately() {
        let value = json!({"status":"saved","operationId":"save-original","commit":"a".repeat(40),
            "tree":"b".repeat(40),"ref":"refs/heads/main","previousRevision":"c".repeat(40),
            "recovered":true,"paths":["docs/rooms/note.md"],"cleanupWarning":"records-save-index-locked"});
        let saved = receipt(&value, "save-original").expect("exact accepted receipt remains saved");
        assert_eq!(saved.commit, "a".repeat(40));
        assert!(saved.recovered);
        assert_eq!(saved.cleanup_warning.as_deref(), Some("Saved. Recovery cleanup is pending; local history changes may remain unavailable."));
    }
}
