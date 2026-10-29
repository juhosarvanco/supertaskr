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
    pub(super) fn descriptor(&self) -> Value {
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
    let validate = || operation.verify().and_then(|_| validate_native_selection());
    let historical = matches!(operation, InitializationOperation::Replay { .. });
    validate().map_err(|code| InitializationFailure::selection(code, historical))?;
    let attempt = state.next();
    let lease = state
        .begin("genesis-initialization", attempt)
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
        std::fs::rename(&records, home.join("original-records")).unwrap();
        std::fs::create_dir(&records).unwrap();
        let refusal = invoke_initialization_operation(&state, &operation, &|| Ok(())).unwrap_err();
        assert_eq!(refusal.code, "genesis-selected-folder-changed");
        assert!(!refusal.unknown);
        assert_eq!(std::fs::read_to_string(&calls).unwrap(), first);
        std::fs::remove_dir_all(home).unwrap();
    }
    use std::time::{SystemTime, UNIX_EPOCH};
}
