//! Backup authority starts at a native save receipt or a strict cold offer.
//! The webview never supplies roots, operation IDs, programs or destinations.
use super::*;

#[derive(Default)]
pub(super) struct BackupState {
    offers: BTreeMap<String, BackupOffer>,
    pending: BTreeMap<(String, String), BackupOffer>,
}
#[derive(Clone)]
struct BackupOffer {
    product: SelectedInitializationDirectory,
    operation_id: String,
    save_operation_id: String,
    commit: String,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupRecovery {
    token: String,
    commit: String,
    recorded_state: String,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupReceipt {
    operation_id: String,
    save_operation_id: String,
    commit: String,
    file: String,
    archive_digest: String,
}
#[derive(Clone, Debug, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum BackupOutcome {
    Backups {
        attempt: u64,
        product_dir: String,
        backups: Vec<BackupRecovery>,
    },
    BackedUp {
        operation_key: String,
        attempt: u64,
        commit: String,
        receipt: BackupReceipt,
    },
    BackupCancelled {
        operation_key: String,
        attempt: u64,
        commit: String,
    },
    BackupError {
        operation_key: String,
        attempt: u64,
        commit: Option<String>,
        code: String,
        message: String,
        unknown: bool,
    },
}
fn invalid() -> BridgeError {
    BridgeError::after_launch(
        "records-app-backup-protocol",
        "The backup service returned invalid information. Local records remain saved.",
    )
}
fn id(value: &Value) -> Result<String> {
    value
        .as_str()
        .filter(|v| {
            !v.is_empty()
                && v.len() <= 128
                && v.as_bytes()[0].is_ascii_alphanumeric()
                && v.bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
        })
        .map(str::to_owned)
        .ok_or_else(invalid)
}
fn commit(value: &Value) -> Result<String> {
    value
        .as_str()
        .filter(|v| is_oid(v))
        .map(str::to_owned)
        .ok_or_else(invalid)
}
fn rows(value: &Value) -> Result<&Vec<Value>> {
    if value["status"] != "backups" {
        return Err(invalid());
    }
    value["backups"]
        .as_array()
        .filter(|v| v.len() <= 10_000)
        .ok_or_else(invalid)
}
fn offer(product: &SelectedInitializationDirectory, row: &Value) -> Result<BackupOffer> {
    if row["observation"] != "stored-progress"
        || !matches!(
            row["state"].as_str(),
            Some("starting" | "unknown" | "finished")
        )
    {
        return Err(invalid());
    }
    Ok(BackupOffer {
        product: product.clone(),
        operation_id: id(&row["operationId"])?,
        save_operation_id: id(&row["saveOperationId"])?,
        commit: commit(&row["commit"])?,
    })
}
fn selected(watch: &WatchState, original: &SelectedInitializationDirectory) -> Result<()> {
    original.verify().map_err(|_| {
        BridgeError::new(
            "records-app-backup-origin-changed",
            "The original product folder is unavailable. Local records remain saved.",
        )
    })?;
    if watch.project_dir().as_deref() != Some(original.path()) {
        return Err(BridgeError::new(
            "records-app-stale",
            "The selected product changed. Open its original saved record to back it up.",
        ));
    }
    Ok(())
}
fn error(
    key: &str,
    attempt: u64,
    original_commit: Option<String>,
    error: BridgeError,
    unknown: bool,
) -> BackupOutcome {
    BackupOutcome::BackupError {
        operation_key: key.into(),
        attempt,
        commit: original_commit,
        code: error.code,
        message: error.message,
        unknown,
    }
}
pub fn discover_backups(
    watch: &WatchState,
    state: &RecordEditorState,
    attempt: u64,
) -> BackupOutcome {
    let result = (|| -> Result<BackupOutcome> {
        let _flight = watch.begin_pick().ok_or_else(|| {
            BridgeError::new(
                "records-app-busy",
                "A workspace operation is still running.",
            )
        })?;
        let product = watch.project_dir().ok_or_else(|| {
            BridgeError::new(
                "records-app-unavailable",
                "Open a product to find previous backups.",
            )
        })?;
        let original = SelectedInitializationDirectory::capture(&product).map_err(|_| invalid())?;
        let lease = state.begin("backup-recoveries", attempt)?;
        let deadline = Instant::now() + Duration::from_secs(120);
        let tool = state.tool(deadline, &lease.cancel)?;
        selected(watch, &original)?;
        let result = invoke_tool(
            &tool,
            &product,
            &json!({"version":1,"requestId":format!("backup-discover-{}",state.next()),
            "operation":"backup-discover","productRoot":product}),
            deadline,
            &lease.cancel,
        )?;
        let mut offers = BTreeMap::new();
        let mut summaries = Vec::new();
        for row in rows(&result)? {
            let offered = offer(&original, row)?;
            let token = format!("backup-recovery-{}", state.next());
            summaries.push(BackupRecovery {
                token: token.clone(),
                commit: offered.commit.clone(),
                recorded_state: row["state"].as_str().unwrap().into(),
            });
            offers.insert(token, offered);
        }
        // A retained native intent may precede canonical publication. Keep it
        // separately addressable even after another save uses the same buffer.
        let pending: Vec<_> = state
            .backups
            .lock()
            .expect("backup mutex poisoned")
            .pending
            .values()
            .filter(|prior| {
                prior.product == original
                    && !offers
                        .values()
                        .any(|known| known.operation_id == prior.operation_id)
            })
            .cloned()
            .collect();
        for prior in pending {
            if offers
                .values()
                .any(|known| known.operation_id == prior.operation_id)
            {
                continue;
            }
            let token = format!("backup-recovery-{}", state.next());
            summaries.push(BackupRecovery {
                token: token.clone(),
                commit: prior.commit.clone(),
                recorded_state: "native-intent".into(),
            });
            offers.insert(token, prior);
        }
        selected(watch, &original)?;
        state.backups.lock().expect("backup mutex poisoned").offers = offers;
        Ok(BackupOutcome::Backups {
            attempt,
            product_dir: product.display().to_string(),
            backups: summaries,
        })
    })();
    result.unwrap_or_else(|e| error("backup-recoveries", attempt, None, e, false))
}
/// The native caller owns the folder dialog closure. Picker cancellation never
/// starts a backup or changes the local save's status.
pub fn backup_saved(
    watch: &WatchState,
    state: &RecordEditorState,
    key: &str,
    expected_commit: &str,
    attempt: u64,
    choose_parent: impl FnOnce() -> Option<PathBuf>,
) -> BackupOutcome {
    let historical = {
        let backups = state.backups.lock().expect("backup mutex poisoned");
        backups
            .offers
            .get(key)
            .or_else(|| {
                backups
                    .pending
                    .get(&(key.to_owned(), expected_commit.to_owned()))
            })
            .cloned()
    };
    let receipt = recovery::captured_receipt(state, key);
    let original_commit = historical
        .as_ref()
        .map(|row| row.commit.clone())
        .or_else(|| receipt.as_ref().map(|(_, r)| r.commit.clone()));
    let mut unknown = historical.is_some();
    let result = (|| -> Result<BackupOutcome> {
        if !is_oid(expected_commit) || original_commit.as_deref() != Some(expected_commit) {
            return Err(BridgeError::new(
                "records-app-backup-receipt-changed",
                "The displayed save receipt changed. Refresh before backing it up.",
            ));
        }
        let _flight = watch.begin_pick().ok_or_else(|| {
            BridgeError::new(
                "records-app-busy",
                "A workspace operation is still running.",
            )
        })?;
        let product = if let Some(prior) = &historical {
            prior.product.clone()
        } else {
            SelectedInitializationDirectory::capture(&receipt.as_ref().ok_or_else(invalid)?.0)
                .map_err(|_| invalid())?
        };
        selected(watch, &product)?;
        let lease = state.begin(key, attempt)?;
        let deadline = Instant::now() + Duration::from_secs(120);
        let tool = state.tool(deadline, &lease.cancel)?;
        let invoke = |mut request: Value| -> Result<Value> {
            selected(watch, &product)?;
            request["version"] = json!(1);
            request["requestId"] = json!(format!("backup-native-{}", state.next()));
            request["productRoot"] = json!(product.path());
            let result = invoke_tool(&tool, product.path(), &request, deadline, &lease.cancel)?;
            selected(watch, &product)?;
            Ok(result)
        };
        let prior = if historical.is_some() {
            historical
        } else {
            let discovered = invoke(json!({"operation":"backup-discover"}))?;
            let (_, saved) = receipt.as_ref().ok_or_else(invalid)?;
            let mut matching = Vec::new();
            for row in rows(&discovered)? {
                let prior = offer(&product, row)?;
                if prior.save_operation_id == saved.operation_id {
                    if prior.commit != saved.commit {
                        return Err(invalid());
                    }
                    matching.push(prior);
                }
            }
            if matching.len() > 1 {
                return Err(BridgeError::new(
                    "records-app-backup-ambiguous",
                    "Several original backups exist for this save. No new backup was started.",
                ));
            }
            matching.pop()
        };
        let replaying = prior.is_some();
        let retained = if let Some(prior) = prior {
            prior
        } else {
            let (_, saved) = receipt.as_ref().ok_or_else(invalid)?;
            let settings = invoke(
                json!({"operation":"backup-settings","saveOperationId":saved.operation_id}),
            )?;
            if settings["commit"] != saved.commit
                || settings["saveOperationId"] != saved.operation_id
            {
                return Err(invalid());
            }
            match settings["status"].as_str() {
                Some("configured") => {}
                Some("not-configured") => {
                    let Some(parent) = choose_parent() else {
                        return Ok(BackupOutcome::BackupCancelled {
                            operation_key: key.into(),
                            attempt,
                            commit: saved.commit.clone(),
                        });
                    };
                    selected(watch, &product)?;
                    let parent = SelectedInitializationDirectory::capture(&parent).map_err(|_| BridgeError::new("records-app-backup-folder", "The chosen backup folder is unavailable. Local records remain saved."))?;
                    let configured = invoke(
                        json!({"operation":"backup-configure","saveOperationId":saved.operation_id,
                        "expectedToken":settings["token"],"parent":parent.descriptor()}),
                    )?;
                    parent.verify().map_err(|_| invalid())?;
                    if configured["status"] != "configured"
                        || configured["commit"] != saved.commit
                        || configured["saveOperationId"] != saved.operation_id
                    {
                        return Err(invalid());
                    }
                }
                _ => return Err(invalid()),
            }
            BackupOffer {
                product: product.clone(),
                operation_id: format!(
                    "backup-{}-{}-{}",
                    std::process::id(),
                    docs_watch::now_ms(),
                    state.next()
                ),
                save_operation_id: saved.operation_id.clone(),
                commit: saved.commit.clone(),
            }
        };
        // Retain identity before the owned child can publish its operation.
        state
            .backups
            .lock()
            .expect("backup mutex poisoned")
            .pending
            .insert((key.into(), retained.commit.clone()), retained.clone());
        unknown = true;
        let request = if replaying {
            // A retained ID can never capture current source/configuration
            // merely because its old response/physical row is unavailable.
            json!({"operation":"backup-replay","operationId":retained.operation_id})
        } else {
            json!({"operation":"backup","operationId":retained.operation_id,"saveOperationId":retained.save_operation_id})
        };
        let result = invoke(request)?;
        if result["status"] != "backed-up"
            || result["operationId"] != retained.operation_id
            || result["saveOperationId"] != retained.save_operation_id
            || result["commit"] != retained.commit
            || result["attribution"] != "exact"
        {
            return Err(invalid());
        }
        let file = result["file"]
            .as_str()
            .filter(|p| Path::new(p).is_absolute())
            .ok_or_else(invalid)?
            .to_owned();
        let archive_digest = result["archiveDigest"]
            .as_str()
            .filter(|p| {
                p.len() == 71
                    && p.starts_with("sha256:")
                    && p[7..]
                        .bytes()
                        .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
            })
            .ok_or_else(invalid)?
            .to_owned();
        state
            .backups
            .lock()
            .expect("backup mutex poisoned")
            .pending
            .retain(|_, old| {
                old.product != retained.product
                    || old.commit != retained.commit
                    || old.operation_id != retained.operation_id
            });
        Ok(BackupOutcome::BackedUp {
            operation_key: key.into(),
            attempt,
            commit: retained.commit.clone(),
            receipt: BackupReceipt {
                operation_id: retained.operation_id,
                save_operation_id: retained.save_operation_id,
                commit: retained.commit,
                file,
                archive_digest,
            },
        })
    })();
    result.unwrap_or_else(|e| error(key, attempt, original_commit, e, unknown))
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use std::fs;
    use std::os::unix::fs::PermissionsExt;
    use std::time::{SystemTime, UNIX_EPOCH};
    static NEXT: AtomicU64 = AtomicU64::new(0);
    struct Fixture {
        root: PathBuf,
        product: PathBuf,
        parent: PathBuf,
        program: PathBuf,
        watch: WatchState,
        state: RecordEditorState,
    }
    impl Fixture {
        fn new(lose: bool) -> Self {
            let root = std::env::temp_dir().join(format!(
                "supertaskr-native-backup-{}-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::SeqCst),
                SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_nanos()
            ));
            fs::create_dir(&root).unwrap();
            fs::create_dir_all(root.join("product/docs")).unwrap();
            fs::create_dir(root.join("backup-parent")).unwrap();
            let root = root.canonicalize().unwrap();
            let product = root.join("product");
            let parent = root.join("backup-parent");
            let program = root.join("supertaskr");
            let script = format!(
                "#!/usr/bin/env node\nconst root={},lose={};\n",
                serde_json::to_string(&root).unwrap(),
                lose
            ) + r#"
const fs=require('node:fs'),path=require('node:path');
if(JSON.stringify(process.argv.slice(2))!=='["records","--stdio"]')process.exit(91);
const q=JSON.parse(fs.readFileSync(0,'utf8'));fs.appendFileSync(path.join(root,'calls'),JSON.stringify(q)+'\n');
const emit=result=>process.stdout.write(JSON.stringify({version:1,requestId:q.requestId,ok:true,result}));
const savedCommit=(q.saveOperationId==='native-save-b'?'b':'a').repeat(40),rowFile=path.join(root,'row.json');
if(q.operation==='backup-discover'){emit({status:'backups',backups:fs.existsSync(rowFile)?[JSON.parse(fs.readFileSync(rowFile))]:[]});}
else if(q.operation==='backup-settings'){if(fs.existsSync(rowFile)&&JSON.parse(fs.readFileSync(rowFile)).saveOperationId===q.saveOperationId)process.exit(92);emit({status:fs.existsSync(path.join(root,'configured'))?'configured':'not-configured',saveOperationId:q.saveOperationId,commit:savedCommit,token:'sha256:'+'b'.repeat(64)});}
else if(q.operation==='backup-configure'){
 const p=fs.statSync(q.parent.path,{bigint:true});if(String(p.dev)!==q.parent.device||String(p.ino)!==q.parent.inode||q.parent.path!==path.join(root,'backup-parent'))process.exit(93);
 fs.writeFileSync(path.join(root,'configured'),'chosen');emit({status:'configured',saveOperationId:'native-save',commit:savedCommit});
}else if(q.operation==='backup-replay'){
 if(!fs.existsSync(rowFile)||JSON.parse(fs.readFileSync(rowFile)).operationId!==q.operationId){process.stdout.write(JSON.stringify({version:1,requestId:q.requestId,ok:false,error:{code:'private-backup-operation-absent',message:'Original backup unavailable',state:'refused',operationId:q.operationId}}));process.exit(1);}
 const row=JSON.parse(fs.readFileSync(rowFile));if(row.operationId!==q.operationId)process.exit(95);
 row.state='finished';fs.writeFileSync(rowFile,JSON.stringify(row));emit({status:'backed-up',operationId:row.operationId,saveOperationId:row.saveOperationId,commit:row.commit,file:path.join(root,'controlled.private-backup.json'),archiveDigest:'sha256:'+'c'.repeat(64),attribution:'exact'});
}else if(q.operation==='backup'){
 if(!['native-save','native-save-b'].includes(q.saveOperationId))process.exit(94);
 if(fs.existsSync(path.join(root,'lose-before-row'))){process.stdout.write('lost before canonical capture');process.exit(0);}
 if(fs.existsSync(rowFile)&&JSON.parse(fs.readFileSync(rowFile)).saveOperationId===q.saveOperationId&&JSON.parse(fs.readFileSync(rowFile)).operationId!==q.operationId)process.exit(95);
 const row={operationId:q.operationId,saveOperationId:q.saveOperationId,commit:savedCommit,state:'unknown',observation:'stored-progress'};fs.writeFileSync(rowFile,JSON.stringify(row));
 if(lose&&!fs.existsSync(path.join(root,'lost-once'))){fs.writeFileSync(path.join(root,'lost-once'),'lost');process.stdout.write('lost response');}
 else{row.state='finished';fs.writeFileSync(rowFile,JSON.stringify(row));emit({status:'backed-up',operationId:q.operationId,saveOperationId:q.saveOperationId,commit:savedCommit,file:path.join(root,'controlled.private-backup.json'),archiveDigest:'sha256:'+'c'.repeat(64),attribution:'exact'});}
}else process.exit(96);
"#;
            fs::write(&program, script).unwrap();
            fs::set_permissions(&program, fs::Permissions::from_mode(0o700)).unwrap();
            let state = Self::state(&program);
            let watch = WatchState::start(Some(product.clone()), |_| {});
            recovery::remember_receipt(
                &state,
                "receipt-a",
                &product,
                &SaveReceipt {
                    operation_id: "native-save".into(),
                    commit: "a".repeat(40),
                    tree: "d".repeat(40),
                    r#ref: "refs/heads/main".into(),
                    previous_revision: "e".repeat(40),
                    recovered: false,
                    paths: vec!["docs/note.md".into()],
                    cleanup_warning: None,
                },
            );
            Self {
                root,
                product,
                parent,
                program,
                watch,
                state,
            }
        }
        fn state(program: &Path) -> RecordEditorState {
            RecordEditorState {
                tool_override: Some(ResolvedTool {
                    program: program.into(),
                    child_path: std::env::var_os("PATH").unwrap_or_default(),
                }),
                ..Default::default()
            }
        }
        fn calls(&self) -> Vec<Value> {
            fs::read_to_string(self.root.join("calls"))
                .unwrap_or_default()
                .lines()
                .map(|line| serde_json::from_str(line).unwrap())
                .collect()
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            self.watch.stop_for_test();
            self.state.stop();
            fs::remove_dir_all(&self.root).unwrap();
        }
    }
    #[test]
    fn native_backup_preserves_save_on_cancel_and_unknown_then_replays_same_id_after_cold_discovery(
    ) {
        let f = Fixture::new(true);
        let original = recovery::captured_receipt(&f.state, "receipt-a").unwrap().1;
        let refused = backup_saved(&f.watch, &f.state, "receipt-a", &"f".repeat(40), 1, || {
            panic!("must not pick for a changed displayed receipt")
        });
        assert!(matches!(
            refused,
            BackupOutcome::BackupError { unknown: false, .. }
        ));
        assert!(f.calls().is_empty());
        assert!(matches!(
            backup_saved(&f.watch, &f.state, "receipt-a", &original.commit, 2, || {
                None
            }),
            BackupOutcome::BackupCancelled { .. }
        ));
        assert!(!f.root.join("configured").exists());
        assert!(!f.root.join("row.json").exists());
        assert!(matches!(
            backup_saved(&f.watch, &f.state, "receipt-a", &original.commit, 3, || {
                Some(f.parent.clone())
            }),
            BackupOutcome::BackupError { unknown: true, .. }
        ));
        let first: Value =
            serde_json::from_slice(&fs::read(f.root.join("row.json")).unwrap()).unwrap();
        assert!(
            matches!(backup_saved(&f.watch,&f.state,"receipt-a",&original.commit,4,||panic!("original backup never picks a new folder")),BackupOutcome::BackedUp{ref receipt,..} if receipt.operation_id==first["operationId"].as_str().unwrap())
        );
        assert_eq!(
            recovery::captured_receipt(&f.state, "receipt-a")
                .unwrap()
                .1
                .commit,
            original.commit
        );
        let cold = Fixture::state(&f.program);
        let discovered = discover_backups(&f.watch, &cold, 5);
        let token = match discovered {
            BackupOutcome::Backups { backups, .. } => {
                assert_eq!(backups.len(), 1);
                assert_eq!(backups[0].recorded_state, "finished");
                backups[0].token.clone()
            }
            other => panic!("{other:?}"),
        };
        assert!(
            matches!(backup_saved(&f.watch,&cold,&token,&original.commit,6,||panic!("cold original backup must not pick/configure")),BackupOutcome::BackedUp{ref receipt,..} if receipt.operation_id==first["operationId"].as_str().unwrap())
        );
        let calls = f.calls();
        let backups: Vec<_> = calls
            .iter()
            .filter(|q| q["operation"] == "backup" || q["operation"] == "backup-replay")
            .collect();
        assert_eq!(backups.len(), 3);
        assert!(backups
            .iter()
            .all(|q| q["operationId"] == first["operationId"]));
        assert_eq!(backups[0]["operation"], "backup");
        assert!(backups
            .iter()
            .skip(1)
            .all(|q| q["operation"] == "backup-replay" && q.get("saveOperationId").is_none()));
        assert_eq!(
            calls
                .iter()
                .filter(|q| q["operation"] == "backup-configure")
                .count(),
            1
        );
        assert!(calls.iter().all(|q| q.get("program").is_none()
            && q.get("tool").is_none()
            && q.get("profile").is_none()));
        cold.stop();
    }
    #[test]
    fn native_backup_missing_original_row_never_recaptures_changed_settings_under_retained_id() {
        let f = Fixture::new(false);
        fs::write(
            f.root.join("lose-before-row"),
            "Stop before canonical capture",
        )
        .unwrap();
        assert!(matches!(
            backup_saved(
                &f.watch,
                &f.state,
                "receipt-a",
                &"a".repeat(40),
                1,
                || Some(f.parent.clone())
            ),
            BackupOutcome::BackupError { unknown: true, .. }
        ));
        assert!(!f.root.join("row.json").exists());
        let original = f.state.backups.lock().unwrap().pending
            [&("receipt-a".into(), "a".repeat(40))]
            .operation_id
            .clone();
        fs::write(
            f.root.join("configured"),
            "Changed current destination must not be recaptured",
        )
        .unwrap();
        let outcome = backup_saved(&f.watch, &f.state, "receipt-a", &"a".repeat(40), 2, || {
            panic!("retained original cannot pick again")
        });
        assert!(
            matches!(outcome,BackupOutcome::BackupError{ref code,unknown:true,..} if code=="private-backup-operation-absent")
        );
        let calls = f.calls();
        assert_eq!(
            calls.iter().filter(|q| q["operation"] == "backup").count(),
            1
        );
        assert_eq!(
            calls
                .iter()
                .filter(|q| q["operation"] == "backup-configure")
                .count(),
            1
        );
        assert_eq!(
            calls
                .iter()
                .filter(|q| q["operation"] == "backup-settings")
                .count(),
            1
        );
        assert_eq!(calls.last().unwrap()["operation"], "backup-replay");
        assert_eq!(calls.last().unwrap()["operationId"], original);
        assert!(calls.last().unwrap().get("saveOperationId").is_none());
        assert!(!f.root.join("row.json").exists());
        assert_eq!(
            f.state.backups.lock().unwrap().pending[&("receipt-a".into(), "a".repeat(40))]
                .operation_id,
            original
        );
        assert_eq!(
            recovery::captured_receipt(&f.state, "receipt-a")
                .unwrap()
                .1
                .commit,
            "a".repeat(40)
        );
    }
    #[test]
    fn native_backup_later_save_gets_its_own_backup_and_keeps_an_older_unknown_addressable() {
        for unknown_first in [false, true] {
            let f = Fixture::new(false);
            if unknown_first {
                fs::write(f.root.join("lose-before-row"), "Missing original row").unwrap();
            }
            let first = backup_saved(&f.watch, &f.state, "receipt-a", &"a".repeat(40), 1, || {
                Some(f.parent.clone())
            });
            if unknown_first {
                assert!(matches!(
                    first,
                    BackupOutcome::BackupError { unknown: true, .. }
                ));
                fs::remove_file(f.root.join("lose-before-row")).unwrap();
            } else {
                assert!(matches!(first, BackupOutcome::BackedUp { .. }));
                assert!(f.state.backups.lock().unwrap().pending.is_empty());
            }
            let original_pending = f
                .state
                .backups
                .lock()
                .unwrap()
                .pending
                .values()
                .next()
                .map(|p| p.operation_id.clone());
            let mut later = recovery::captured_receipt(&f.state, "receipt-a").unwrap().1;
            later.operation_id = "native-save-b".into();
            later.commit = "b".repeat(40);
            recovery::remember_receipt(&f.state, "receipt-a", &f.product, &later);
            let second = backup_saved(&f.watch, &f.state, "receipt-a", &later.commit, 2, || {
                panic!("already configured")
            });
            assert!(
                matches!(second,BackupOutcome::BackedUp{ref receipt,..} if receipt.commit==later.commit&&receipt.save_operation_id==later.operation_id),
                "{second:?}"
            );
            assert!(!f
                .state
                .backups
                .lock()
                .unwrap()
                .pending
                .contains_key(&("receipt-a".into(), later.commit.clone())));
            if let Some(original_id) = original_pending {
                assert_eq!(
                    f.state.backups.lock().unwrap().pending[&("receipt-a".into(), "a".repeat(40))]
                        .operation_id,
                    original_id
                );
                let offered = match discover_backups(&f.watch, &f.state, 3) {
                    BackupOutcome::Backups { backups, .. } => backups
                        .into_iter()
                        .find(|row| row.commit == "a".repeat(40))
                        .unwrap(),
                    other => panic!("{other:?}"),
                };
                assert_eq!(offered.recorded_state, "native-intent");
                let old = backup_saved(
                    &f.watch,
                    &f.state,
                    &offered.token,
                    &"a".repeat(40),
                    4,
                    || panic!("old unknown cannot pick a new route"),
                );
                assert!(matches!(
                    old,
                    BackupOutcome::BackupError { unknown: true, .. }
                ));
                let calls = f.calls();
                assert_eq!(calls.last().unwrap()["operation"], "backup-replay");
                assert_eq!(calls.last().unwrap()["operationId"], original_id);
                assert_eq!(
                    calls.iter().filter(|q| q["operation"] == "backup").count(),
                    2
                );
                assert!(f
                    .state
                    .backups
                    .lock()
                    .unwrap()
                    .pending
                    .values()
                    .any(|p| p.operation_id == original_id));
            }
            assert_eq!(
                recovery::captured_receipt(&f.state, "receipt-a")
                    .unwrap()
                    .1
                    .commit,
                later.commit
            );
        }
    }
    #[test]
    fn native_backup_refuses_original_product_replacement_after_picker_without_configuring_successor(
    ) {
        let f = Fixture::new(false);
        let original = f.root.join("original-product");
        let outcome = backup_saved(&f.watch, &f.state, "receipt-a", &"a".repeat(40), 1, || {
            fs::rename(&f.product, &original).unwrap();
            fs::create_dir_all(f.product.join("docs")).unwrap();
            fs::write(f.product.join("canary"), "Successor owner").unwrap();
            Some(f.parent.clone())
        });
        assert!(
            matches!(outcome,BackupOutcome::BackupError{ref code,unknown:false,..} if code=="records-app-backup-origin-changed")
        );
        assert!(f
            .calls()
            .iter()
            .all(|q| q["operation"] != "backup-configure" && q["operation"] != "backup"));
        assert!(!f.root.join("configured").exists());
        assert_eq!(
            fs::read_to_string(f.product.join("canary")).unwrap(),
            "Successor owner"
        );
    }
}
