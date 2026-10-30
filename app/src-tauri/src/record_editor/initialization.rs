//! Finite native setup transport over the existing installed-child lifecycle.
//! Only native folder selection constructs directory observations; no raw
//! request, executable, plan or root is deserialized from a webview here.
use super::*;

#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct SelectedInitializationDirectory {
    path: PathBuf,
    device: String,
    inode: String,
}
impl SelectedInitializationDirectory {
    pub(crate) fn capture(path: &Path) -> std::result::Result<Self, String> {
        let path = path
            .canonicalize()
            .map_err(|_| "genesis-selected-folder-unavailable")?;
        if path.to_str().is_none() {
            return Err("genesis-selected-folder-name-unsupported".into());
        }
        let metadata =
            std::fs::symlink_metadata(&path).map_err(|_| "genesis-selected-folder-unavailable")?;
        if !metadata.is_dir() || metadata.file_type().is_symlink() {
            return Err("genesis-selected-folder-unavailable".into());
        }
        #[cfg(unix)]
        {
            use std::os::unix::fs::MetadataExt;
            Ok(Self {
                path,
                device: metadata.dev().to_string(),
                inode: metadata.ino().to_string(),
            })
        }
        #[cfg(not(unix))]
        {
            Err("genesis-selected-folder-identity-unsupported".into())
        }
    }
    pub(crate) fn path(&self) -> &Path {
        &self.path
    }
    pub(crate) fn descriptor(&self) -> Value {
        json!({"path":self.path,"device":self.device,"inode":self.inode})
    }
    pub(crate) fn verify(&self) -> std::result::Result<(), String> {
        if Self::capture(&self.path)? != *self {
            return Err("genesis-selected-folder-changed".into());
        }
        Ok(())
    }
    fn expected(&self) -> Value {
        json!({"device":self.device,"inode":self.inode})
    }
}

#[derive(Clone, Debug)]
pub(crate) enum InitializationOperation {
    Discover {
        product: SelectedInitializationDirectory,
    },
    Inspect {
        product: SelectedInitializationDirectory,
    },
    Banks {
        product: SelectedInitializationDirectory,
    },
    Bank {
        product: SelectedInitializationDirectory,
        operation_id: String,
        session_id: String,
        origin_digest: String,
        expected_product_revision: String,
        expected_records_revision: String,
    },
    BankReplay {
        product: SelectedInitializationDirectory,
        operation_id: String,
    },
    Replay {
        product: SelectedInitializationDirectory,
        operation_id: String,
    },
    Initialize {
        product: SelectedInitializationDirectory,
        records: SelectedInitializationDirectory,
        operation_id: String,
        project_id: String,
    },
}
impl InitializationOperation {
    fn product(&self) -> &SelectedInitializationDirectory {
        match self {
            Self::Discover { product }
            | Self::Inspect { product }
            | Self::Banks { product }
            | Self::Bank { product, .. }
            | Self::BankReplay { product, .. }
            | Self::Replay { product, .. }
            | Self::Initialize { product, .. } => product,
        }
    }
    fn verify(&self) -> std::result::Result<(), String> {
        self.product().verify()?;
        if let Self::Initialize { records, .. } = self {
            records.verify()?;
        }
        Ok(())
    }
    fn request(&self, request_id: &str) -> Value {
        let mut request =
            json!({"version":1,"requestId":request_id,"productRoot":self.product().path()});
        match self {
            Self::Discover { .. } => request["operation"] = json!("discover"),
            Self::Inspect { .. } => request["operation"] = json!("inspect"),
            Self::Banks { .. } => request["operation"] = json!("banks"),
            Self::BankReplay { operation_id, .. } => {
                request["operation"] = json!("bank-replay");
                request["operationId"] = json!(operation_id);
            }
            Self::Bank {
                operation_id,
                session_id,
                origin_digest,
                expected_product_revision,
                expected_records_revision,
                ..
            } => {
                request["operation"] = json!("bank");
                request["operationId"] = json!(operation_id);
                request["sessionId"] = json!(session_id);
                request["originDigest"] = json!(origin_digest);
                request["expectedProductRevision"] = json!(expected_product_revision);
                request["expectedRecordsRevision"] = json!(expected_records_revision);
            }
            Self::Replay { operation_id, .. } => {
                request["operation"] = json!("replay");
                request["operationId"] = json!(operation_id);
            }
            Self::Initialize {
                product,
                records,
                operation_id,
                project_id,
            } => {
                request["operation"] = json!("initialize");
                request["operationId"] = json!(operation_id);
                request["projectId"] = json!(project_id);
                request["recordsRoot"] = json!(records.path());
                request["expectedRoots"] =
                    json!({"product":product.expected(),"records":records.expected()});
            }
        }
        request
    }
}

#[derive(Clone, Debug)]
pub(crate) struct InitializationFailure {
    pub code: String,
    pub message: String,
    /// Replay retains uncertainty about its original operation even when this
    /// invocation never launches. For other actions, false describes this
    /// invocation only; the caller must retain any separately known old ID.
    pub unknown: bool,
}
impl InitializationFailure {
    fn selection(code: String, unknown: bool) -> Self {
        Self { code, message: "The original setup folders or selection changed. Keep the original setup to reconcile its result.".into(), unknown }
    }
}

/// Caller retains its existing picker claim until this function returns.
/// The callback validates that native claim/selection; directory verification
/// here independently retains the originally chosen physical folders.
pub(crate) fn invoke_initialization_operation(
    state: &RecordEditorState,
    operation: &InitializationOperation,
    validate_native_selection: &dyn Fn() -> std::result::Result<(), String>,
) -> std::result::Result<Value, InitializationFailure> {
    invoke_initialization(state, operation, validate_native_selection, None)
}

/// The original managed turn retains this exact cancellation cell while its
/// post-turn bank owns the same service lease. Only finite bank effects may
/// borrow it; readonly discovery and initial setup keep their existing owners.
pub(crate) fn invoke_owned_bank_operation(
    state: &RecordEditorState,
    operation: &InitializationOperation,
    validate_original_activation: &dyn Fn() -> std::result::Result<(), String>,
    cancel: Arc<AtomicBool>,
) -> std::result::Result<Value, InitializationFailure> {
    if !matches!(
        operation,
        InitializationOperation::Bank { .. } | InitializationOperation::BankReplay { .. }
    ) {
        return Err(InitializationFailure::selection(
            "genesis-bank-operation-required".into(),
            false,
        ));
    }
    invoke_initialization(state, operation, validate_original_activation, Some(cancel))
}

fn invoke_initialization(
    state: &RecordEditorState,
    operation: &InitializationOperation,
    validate_native_selection: &dyn Fn() -> std::result::Result<(), String>,
    original_cancel: Option<Arc<AtomicBool>>,
) -> std::result::Result<Value, InitializationFailure> {
    let validate = || operation.verify().and_then(|_| validate_native_selection());
    let historical = matches!(
        operation,
        InitializationOperation::Replay { .. } | InitializationOperation::BankReplay { .. }
    );
    validate().map_err(|code| InitializationFailure::selection(code, historical))?;
    let attempt = state.next();
    let lease = original_cancel
        .map_or_else(
            || state.begin("genesis-initialization", attempt),
            |cancel| {
                let key = match operation {
                    InitializationOperation::Bank { operation_id, .. }
                    | InitializationOperation::BankReplay { operation_id, .. } => {
                        format!("genesis-bank:{operation_id}")
                    }
                    _ => {
                        unreachable!("only the finite bank wrapper supplies original cancellation")
                    }
                };
                state.begin_with_cancel(&key, attempt, cancel)
            },
        )
        .map_err(|error| InitializationFailure {
            code: error.code,
            message: error.message,
            unknown: historical,
        })?;
    let deadline = Instant::now() + Duration::from_secs(120);
    let tool = state
        .tool(deadline, &lease.cancel)
        .map_err(|error| InitializationFailure {
            code: error.code,
            message: error.message,
            unknown: historical,
        })?;
    validate().map_err(|code| InitializationFailure::selection(code, historical))?;
    let request = operation.request(&format!("native-init-{attempt}"));
    let result = invoke_command(
        &tool,
        operation.product().path(),
        &request,
        deadline,
        &lease.cancel,
        InstalledCommand::Init,
    )
    .map_err(|error| InitializationFailure {
        unknown: historical || error.launched && !error.certain_refused,
        code: error.code,
        message: error.message,
    })?;
    validate().map_err(|code| InitializationFailure::selection(code, true))?;
    Ok(result)
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use std::os::unix::fs::PermissionsExt;
    #[test]
    fn typed_initialization_transport_sends_native_roots_and_refuses_replacements_before_launch() {
        let home = std::env::temp_dir().join(format!(
            "supertaskr-native-init-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let product = home.join("product");
        let records = home.join("records");
        let program = home.join("supertaskr");
        let calls = home.join("calls.jsonl");
        std::fs::create_dir_all(&product).unwrap();
        std::fs::create_dir(&records).unwrap();
        std::fs::write(&program,format!(r#"#!/usr/bin/env node
const fs=require('node:fs');if(JSON.stringify(process.argv.slice(2))!=='["init","--stdio"]')process.exit(91);
const q=JSON.parse(fs.readFileSync(0,'utf8'));fs.appendFileSync({},JSON.stringify(q)+'\n');
process.stdout.write(JSON.stringify({{version:1,requestId:q.requestId,ok:true,result:{{status:'controlled-initialization',operation:q.operation}}}}));
"#,serde_json::to_string(&calls).unwrap())).unwrap();
        std::fs::set_permissions(&program, std::fs::Permissions::from_mode(0o700)).unwrap();
        let state = RecordEditorState {
            tool_override: Some(ResolvedTool {
                program,
                child_path: std::env::var_os("PATH").unwrap_or_default(),
            }),
            ..Default::default()
        };
        let p = SelectedInitializationDirectory::capture(&product).unwrap();
        let r = SelectedInitializationDirectory::capture(&records).unwrap();
        let operation = InitializationOperation::Initialize {
            product: p.clone(),
            records: r,
            operation_id: "native-setup".into(),
            project_id: "native-project".into(),
        };
        let result = invoke_initialization_operation(&state, &operation, &|| Ok(())).unwrap();
        assert_eq!(result["status"], "controlled-initialization");
        let first = std::fs::read_to_string(&calls).unwrap();
        let request: Value = serde_json::from_str(first.trim()).unwrap();
        assert_eq!(request["productRoot"], json!(p.path()));
        assert_eq!(
            request["recordsRoot"],
            json!(records.canonicalize().unwrap())
        );
        assert_eq!(request["expectedRoots"]["product"], p.expected());
        assert!(request.get("program").is_none());
        assert!(request.get("tool").is_none());
        assert!(request.get("plans").is_none());
        let refusal = invoke_initialization_operation(
            &state,
            &InitializationOperation::Discover { product: p.clone() },
            &|| Err("native-selection-changed".into()),
        )
        .unwrap_err();
        assert!(!refusal.unknown);
        assert_eq!(std::fs::read_to_string(&calls).unwrap(), first);
        let replay = InitializationOperation::Replay {
            product: p.clone(),
            operation_id: "original-pending".into(),
        };
        let refusal = invoke_initialization_operation(&state, &replay, &|| {
            Err("native-selection-changed".into())
        })
        .unwrap_err();
        assert!(
            refusal.unknown,
            "a prelaunch refusal cannot erase original replay uncertainty"
        );
        assert_eq!(std::fs::read_to_string(&calls).unwrap(), first);
        for (name, operation) in [
            (
                "banks",
                InitializationOperation::Banks { product: p.clone() },
            ),
            (
                "bank",
                InitializationOperation::Bank {
                    product: p.clone(),
                    operation_id: "original-bank".into(),
                    session_id: "original-session".into(),
                    origin_digest: format!("sha256:{}", "a".repeat(64)),
                    expected_product_revision: "b".repeat(40),
                    expected_records_revision: "c".repeat(40),
                },
            ),
            (
                "bank-replay",
                InitializationOperation::BankReplay {
                    product: p.clone(),
                    operation_id: "original-bank".into(),
                },
            ),
        ] {
            let answer = invoke_initialization_operation(&state, &operation, &|| Ok(())).unwrap();
            assert_eq!(answer["operation"], name);
        }
        let first = std::fs::read_to_string(&calls).unwrap();
        let requests: Vec<Value> = first
            .lines()
            .map(|line| serde_json::from_str(line).unwrap())
            .collect();
        assert_eq!(requests.len(), 4);
        assert_eq!(requests[2]["sessionId"], "original-session");
        assert_eq!(requests[2]["expectedProductRevision"], "b".repeat(40));
        assert_eq!(requests[2]["expectedRecordsRevision"], "c".repeat(40));
        for request in &requests[1..] {
            assert_eq!(request["productRoot"], json!(p.path()));
            assert!(request.get("recordsRoot").is_none());
            for forbidden in ["program", "tool", "plans", "settings", "profile"] {
                assert!(request.get(forbidden).is_none());
            }
        }
        assert_eq!(
            requests[3].as_object().unwrap().len(),
            5,
            "replay carries the original ID without fresh inputs"
        );
        let refusal = invoke_initialization_operation(
            &state,
            &InitializationOperation::BankReplay {
                product: p.clone(),
                operation_id: "original-bank".into(),
            },
            &|| Err("native-selection-changed".into()),
        )
        .unwrap_err();
        assert!(
            refusal.unknown,
            "failed prevalidation must retain the original bank ID"
        );
        assert_eq!(std::fs::read_to_string(&calls).unwrap(), first);
        std::fs::rename(&records, home.join("original-records")).unwrap();
        std::fs::create_dir(&records).unwrap();
        let refusal = invoke_initialization_operation(&state, &operation, &|| Ok(())).unwrap_err();
        assert_eq!(refusal.code, "genesis-selected-folder-changed");
        assert!(!refusal.unknown);
        assert_eq!(std::fs::read_to_string(&calls).unwrap(), first);
        std::fs::remove_dir_all(home).unwrap();
    }
    #[test]
    fn original_turn_cancellation_stops_its_owned_bank_after_the_original_folder_moves() {
        let home = std::env::temp_dir().join(format!(
            "supertaskr-owned-bank-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let product = home.join("product");
        std::fs::create_dir_all(&product).unwrap();
        let program = home.join("supertaskr");
        let calls = home.join("calls.json");
        std::fs::write(&program, format!(r#"#!/usr/bin/env node
const fs=require('node:fs');const q=JSON.parse(fs.readFileSync(0,'utf8'));
if(JSON.stringify(process.argv.slice(2))!=='["init","--stdio"]'||q.operation!=='bank')process.exit(91);
fs.writeFileSync({},JSON.stringify({{request:q,pid:process.pid}}));setInterval(()=>{{}},1000);
"#,serde_json::to_string(&calls).unwrap())).unwrap();
        std::fs::set_permissions(&program, std::fs::Permissions::from_mode(0o700)).unwrap();
        let state = RecordEditorState::with_controlled_program(program);
        let operation = InitializationOperation::Bank {
            product: SelectedInitializationDirectory::capture(&product).unwrap(),
            operation_id: "original-owned-bank".into(),
            session_id: "original-session".into(),
            origin_digest: format!("sha256:{}", "a".repeat(64)),
            expected_product_revision: "b".repeat(40),
            expected_records_revision: "c".repeat(40),
        };
        let cancel = Arc::new(AtomicBool::new(false));
        let result = std::thread::scope(|scope| {
            let original_cancel = cancel.clone();
            let running = scope.spawn(|| {
                invoke_owned_bank_operation(&state, &operation, &|| Ok(()), original_cancel)
            });
            let deadline = Instant::now() + Duration::from_secs(5);
            while !calls.exists() && Instant::now() < deadline {
                std::thread::sleep(Duration::from_millis(10));
            }
            if !calls.exists() {
                cancel.store(true, Ordering::SeqCst);
                let stopped = running.join().unwrap();
                panic!("controlled bank did not launch: {stopped:?}");
            }
            assert!(!state.cancel("unoffered-bank", 1));
            std::fs::rename(&product, home.join("original-product")).unwrap();
            std::fs::create_dir(&product).unwrap();
            cancel.store(true, Ordering::SeqCst);
            running.join().unwrap()
        })
        .unwrap_err();
        assert!(result.unknown);
        assert_eq!(result.code, "records-app-cancelled");
        let observed: Value = serde_json::from_slice(&std::fs::read(calls).unwrap()).unwrap();
        assert_eq!(observed["request"]["operationId"], "original-owned-bank");
        let pid = observed["pid"].as_i64().unwrap() as i32;
        assert_eq!(
            unsafe { libc::kill(pid, 0) },
            -1,
            "owned bank child must be collected before its lease releases"
        );
        assert_eq!(
            std::io::Error::last_os_error().raw_os_error(),
            Some(libc::ESRCH)
        );
        assert!(state.active.lock().unwrap().is_none());
        assert!(std::fs::read_dir(&product).unwrap().next().is_none());
        std::fs::remove_dir_all(home).unwrap();
    }
    use std::time::{SystemTime, UNIX_EPOCH};
}
