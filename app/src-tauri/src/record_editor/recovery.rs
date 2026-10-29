//! Recovery reads and acknowledgement use the same installed service and its
//! canonical operation records. Tokens never grant the webview a root or ID.
use super::*;

#[derive(Default)]
pub(super) struct RecoveryState {
    offers: BTreeMap<String, RecoveryOffer>,
    receipts: BTreeMap<String, ReceiptOwner>,
}
#[derive(Clone)]
struct RecoveryOffer {
    product: PathBuf,
    product_revision: String,
    records_revision: String,
    record_origin: Value,
    expected_context: String,
    summary: EditorRecovery,
}
#[derive(Clone)]
struct ReceiptOwner {
    product: PathBuf,
    receipt: SaveReceipt,
}
pub(super) fn captured_receipt(
    state: &RecordEditorState,
    key: &str,
) -> Option<(PathBuf, SaveReceipt)> {
    state
        .recovery
        .lock()
        .expect("record recovery mutex poisoned")
        .receipts
        .get(key)
        .map(|owner| (owner.product.clone(), owner.receipt.clone()))
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorRecovery {
    token: String,
    operation_id: String,
    state: String,
    records_dir: String,
    paths: Vec<String>,
    editor_available: bool,
    reason: Option<String>,
    receipt: Option<SaveReceipt>,
}
fn invalid() -> BridgeError {
    BridgeError::after_launch(
        "records-app-recovery-protocol",
        "The saved-operation recovery information was invalid.",
    )
}
fn operation_id(value: &Value) -> Result<String> {
    value
        .as_str()
        .filter(|id| {
            !id.is_empty()
                && id.len() <= 128
                && id
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
        })
        .map(str::to_owned)
        .ok_or_else(invalid)
}
fn context_digest(value: &Value) -> Result<String> {
    value
        .as_str()
        .filter(|v| {
            v.len() == 71
                && v.starts_with("sha256:")
                && v[7..]
                    .bytes()
                    .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
        })
        .map(str::to_owned)
        .ok_or_else(invalid)
}
fn exact_revision(value: &Value) -> Result<String> {
    value
        .as_str()
        .filter(|v| is_oid(v))
        .map(str::to_owned)
        .ok_or_else(invalid)
}
fn origin_valid(value: &Value) -> bool {
    ["root", "gitDirectory", "commonDirectory", "docsDirectory"]
        .iter()
        .all(|key| {
            value[key]
                .as_str()
                .is_some_and(|v| Path::new(v).is_absolute())
        })
        && ["device", "inode", "docsDevice", "docsInode"]
            .iter()
            .all(|key| {
                value[key]
                    .as_str()
                    .is_some_and(|v| !v.is_empty() && v.bytes().all(|b| b.is_ascii_digit()))
            })
        && value["docsDirectory"].as_str()
            == value["root"]
                .as_str()
                .and_then(|root| Path::new(root).join("docs").to_str().map(str::to_owned))
                .as_deref()
}
fn origin_matches(value: &Value, origin: &EditorOrigin) -> bool {
    origin_valid(value)
        && value["root"] == origin.records_dir
        && format!(
            "{}:{}",
            value["device"].as_str().unwrap(),
            value["inode"].as_str().unwrap()
        ) == origin.root_incarnation
        && Some(format!(
            "{}:{}",
            value["docsDevice"].as_str().unwrap(),
            value["docsInode"].as_str().unwrap()
        )) == origin.docs_incarnation
}
fn paths(value: &Value) -> Result<Vec<String>> {
    let paths: Vec<String> = serde_json::from_value(value.clone()).map_err(|_| invalid())?;
    if paths.is_empty()
        || paths.iter().any(|p| {
            !p.starts_with("docs/")
                || p.split('/').any(|part| {
                    part.is_empty() || [".", "..", ".git", ".supertaskr"].contains(&part)
                })
                || p.chars().any(char::is_control)
                || p.contains('\\')
        })
    {
        return Err(invalid());
    }
    Ok(paths)
}
fn metadata(state: &RecordEditorState, product: &Path, row: &Value) -> Result<RecoveryOffer> {
    if row["productRoot"] != product.display().to_string()
        || !origin_valid(&row["recordOrigin"])
        || !matches!(
            row["state"].as_str(),
            Some("pending" | "accepted" | "uncertain")
        )
    {
        return Err(invalid());
    }
    let id = operation_id(&row["operationId"])?;
    let product_revision = exact_revision(&row["productRevision"])?;
    let records_revision = exact_revision(&row["recordsRevision"])?;
    let expected_context = context_digest(&row["expectedContext"])?;
    let paths = paths(&row["paths"])?;
    let receipt = if row["state"] == "accepted" {
        let receipt = receipt(
            &json!({"status":"saved","operationId":id,"recovered":true,"paths":paths,
            "commit":row["receipt"]["commit"],"tree":row["receipt"]["tree"],"ref":row["receipt"]["ref"],"previousRevision":row["receipt"]["previousRevision"]}),
            &id,
        )?;
        if receipt.previous_revision != records_revision {
            return Err(invalid());
        }
        Some(receipt)
    } else {
        None
    };
    let editor_available = match row["editorRecovery"].as_str() {
        Some("available") => row["state"] == "pending",
        Some("unavailable") => false,
        _ => return Err(invalid()),
    };
    let summary = EditorRecovery {
        token: format!("record-recovery-{}", state.next()),
        operation_id: id,
        state: row["state"].as_str().unwrap().into(),
        records_dir: row["recordOrigin"]["root"].as_str().unwrap().into(),
        paths,
        editor_available,
        receipt,
        reason: row["reason"]
            .as_str()
            .map(|v| v.chars().take(500).collect()),
    };
    Ok(RecoveryOffer {
        product: product.into(),
        product_revision,
        records_revision,
        expected_context,
        record_origin: row["recordOrigin"].clone(),
        summary,
    })
}
pub(super) fn remember_receipt(
    state: &RecordEditorState,
    key: &str,
    product: &Path,
    receipt: &SaveReceipt,
) {
    state
        .recovery
        .lock()
        .expect("record recovery mutex poisoned")
        .receipts
        .insert(
            key.into(),
            ReceiptOwner {
                product: product.into(),
                receipt: receipt.clone(),
            },
        );
}

/// Discovery precedes current binding/profile resolution, including unavailable
/// selections. The PRODUCT path comes only from the committed native selection.
pub fn discover(watch: &WatchState, state: &RecordEditorState, attempt: u64) -> EditorOutcome {
    let result = (|| {
        let _flight = watch.begin_pick().ok_or_else(|| {
            BridgeError::new(
                "records-app-busy",
                "A workspace operation is still running.",
            )
        })?;
        let product = watch.project_dir().ok_or_else(|| {
            BridgeError::new(
                "records-app-unavailable",
                "Open a product before looking for interrupted saves.",
            )
        })?;
        let lease = state.begin("recoveries", attempt)?;
        let deadline = Instant::now() + CHECK_TIME;
        let tool = state.tool(deadline, &lease.cancel)?;
        let request = json!({"version":1,"requestId":format!("record-discover-{}",state.next()),"operation":"discover","productRoot":product});
        let result = invoke_tool(&tool, &product, &request, deadline, &lease.cancel)?;
        if result["status"] != "recoveries" {
            return Err(invalid());
        }
        let rows = result["recoveries"].as_array().ok_or_else(invalid)?;
        let offers = rows
            .iter()
            .map(|row| metadata(state, &product, row))
            .collect::<Result<Vec<_>>>()?;
        if watch.project_dir().as_ref() != Some(&product) {
            return Err(BridgeError::new(
                "records-app-stale",
                "The selected product changed during recovery discovery.",
            ));
        }
        let mut recovery = state
            .recovery
            .lock()
            .expect("record recovery mutex poisoned");
        recovery.offers.clear();
        let mut summaries = Vec::new();
        for offer in offers {
            if let Some(receipt) = &offer.summary.receipt {
                recovery.receipts.insert(
                    offer.summary.token.clone(),
                    ReceiptOwner {
                        product: product.clone(),
                        receipt: receipt.clone(),
                    },
                );
            }
            summaries.push(offer.summary.clone());
            recovery.offers.insert(offer.summary.token.clone(), offer);
        }
        Ok(EditorOutcome::Recoveries {
            attempt,
            product_dir: product.display().to_string(),
            recoveries: summaries,
        })
    })();
    result.unwrap_or_else(|error| outcome_error("recoveries", attempt, None, error, None))
}

pub(super) fn offer_for_open(
    watch: &WatchState,
    state: &RecordEditorState,
    token: &str,
) -> Result<OfferedFile> {
    let offer = state
        .recovery
        .lock()
        .expect("record recovery mutex poisoned")
        .offers
        .get(token)
        .cloned()
        .ok_or_else(|| {
            BridgeError::new(
                "records-app-file-unknown",
                "Choose a file from the current records listing.",
            )
        })?;
    let context = context(watch)?;
    // Derived INDEX may be listed too; the service owns which sole user edit
    // can be reopened. Actual read capture is checked again below.
    if !offer.summary.editor_available
        || !origin_matches(&offer.record_origin, &context.origin)
        || offer.product != context.product
    {
        return Err(BridgeError::new("records-app-recovery-unavailable", "This operation can be reconciled only at its original records home; it cannot be opened in the selected home."));
    }
    let path = offer
        .summary
        .paths
        .iter()
        .filter(|p| p.as_str() != "docs/INDEX.md")
        .collect::<Vec<_>>();
    if path.len() != 1 || !path[0].ends_with(".md") {
        return Err(invalid());
    }
    Ok(OfferedFile {
        context,
        path: path[0].clone(),
    })
}

pub(super) fn verify_opened_recovery(
    state: &RecordEditorState,
    token: &str,
    buffer: &Buffer,
) -> Result<()> {
    let recovery = state
        .recovery
        .lock()
        .expect("record recovery mutex poisoned");
    if let Some(offer) = recovery.offers.get(token) {
        if buffer.pending.as_ref().map(|p| p.operation_id.as_str())
            != Some(offer.summary.operation_id.as_str())
            || buffer.context.product_revision != offer.product_revision
            || buffer.records_revision != offer.records_revision
            || buffer.expected_context != offer.expected_context
        {
            return Err(BridgeError::new("records-app-recovery-unavailable", "The original interrupted draft is not available to reopen. Its operation remains available for reconciliation."));
        }
    }
    Ok(())
}

/// Only the unique supported single-edit capture returned by the service's
/// exact-origin read can restore content. Discovery metadata alone has no bytes.
pub(super) fn restore_capture(result: &Value, buffer: &mut Buffer) -> Result<()> {
    let Some(rows) = result.get("recoveries") else {
        return Ok(());
    };
    let rows = rows.as_array().ok_or_else(invalid)?;
    for row in rows {
        operation_id(&row["operationId"])?;
        if row["productRoot"] != buffer.context.product.display().to_string()
            || !origin_matches(&row["recordOrigin"], &buffer.context.origin)
            || !paths(&row["paths"])?.contains(&buffer.path)
            || !matches!(
                row["state"].as_str(),
                Some("pending" | "accepted" | "uncertain")
            )
        {
            return Err(invalid());
        }
    }
    let captures = rows
        .iter()
        .filter(|row| row.get("capture").is_some())
        .collect::<Vec<_>>();
    if captures.len() > 1 {
        return Err(invalid());
    }
    let Some(row) = captures.first() else {
        return if rows.iter().any(|row| row["state"] != "accepted") {
            Err(BridgeError::new("records-app-recovery-unavailable", "An earlier operation affects this record. Reconcile its original operation before opening a new editable draft."))
        } else {
            Ok(())
        };
    };
    if row["state"] != "pending"
        || row["editorRecovery"] != "available"
        || !origin_matches(&row["recordOrigin"], &buffer.context.origin)
    {
        return Err(invalid());
    }
    let capture = &row["capture"];
    let id = operation_id(&capture["operationId"])?;
    if row["operationId"] != id || capture["path"] != buffer.path {
        return Err(invalid());
    }
    let encoded = capture["contentBase64"].as_str().ok_or_else(invalid)?;
    let bytes = BASE64.decode(encoded).map_err(|_| invalid())?;
    if bytes.len() > MAX_DOCUMENT || bytes.contains(&0) || BASE64.encode(&bytes) != encoded {
        return Err(invalid());
    }
    let content = String::from_utf8(bytes).map_err(|_| invalid())?;
    let product_revision = exact_revision(&capture["productRevision"])?;
    let records_revision = exact_revision(&capture["recordsRevision"])?;
    if row["productRevision"] != product_revision || row["recordsRevision"] != records_revision {
        return Err(invalid());
    }
    buffer.context.product_revision = product_revision;
    buffer.records_revision = records_revision.clone();
    buffer.expected_file = observed(&capture["expectedFile"])?;
    buffer.expected_context = context_digest(&capture["expectedContext"])?;
    if row["expectedContext"] != buffer.expected_context {
        return Err(invalid());
    }
    buffer.operation_id = id.clone();
    buffer.pending = Some(PendingSave {
        operation_id: id,
        content,
        native_attempt: 0,
        frontend_attempt: 0,
        records_revision,
    });
    Ok(())
}

fn receipt_paths_match(edited: &[String], written: &[String]) -> bool {
    let mut expected = edited.to_vec();
    expected.sort();
    let mut actual = written.to_vec();
    actual.sort();
    if expected.windows(2).any(|pair| pair[0] == pair[1])
        || actual.windows(2).any(|pair| pair[0] == pair[1])
    {
        return false;
    }
    // Discovery lists captured user edits; the accepted write set may also
    // contain the service's sole generated record. Every edited path must
    // still appear, and no other receipt-only path is admitted.
    if !expected.iter().any(|path| path == "docs/INDEX.md") {
        actual.retain(|path| path != "docs/INDEX.md");
    }
    actual == expected
}

/// Wider or earlier-origin operations retain their own metadata/receipt rather
/// than being made into a buffer for the currently selected records home.
pub fn recover(
    watch: &WatchState,
    state: &RecordEditorState,
    token: &str,
    attempt: u64,
) -> EditorOutcome {
    let result = (|| {
        let offer = state
            .recovery
            .lock()
            .expect("record recovery mutex poisoned")
            .offers
            .get(token)
            .cloned()
            .ok_or_else(|| {
                BridgeError::new(
                    "records-app-recovery-unknown",
                    "Refresh the interrupted-save list before reconciling this operation.",
                )
            })?;
        let _flight = watch.begin_pick().ok_or_else(|| {
            BridgeError::new(
                "records-app-busy",
                "A workspace operation is still running.",
            )
        })?;
        let lease = state.begin(token, attempt)?;
        let deadline = Instant::now() + SAVE_TIME;
        let tool = state.tool(deadline, &lease.cancel)?;
        let request = json!({"version":1,"requestId":format!("record-recover-{}",state.next()),"operation":"replay","productRoot":offer.product,"operationId":offer.summary.operation_id});
        let result = invoke_tool(&tool, &offer.product, &request, deadline, &lease.cancel)?;
        let receipt = receipt(&result, &offer.summary.operation_id)?;
        if receipt.previous_revision != offer.records_revision
            || !receipt_paths_match(&offer.summary.paths, &receipt.paths)
        {
            return Err(invalid());
        }
        remember_receipt(state, token, &offer.product, &receipt);
        Ok(EditorOutcome::Recovered {
            operation_key: token.into(),
            attempt,
            recovery: offer.summary,
            receipt,
        })
    })();
    result.unwrap_or_else(|error| outcome_error(token, attempt, None, error, None))
}

#[cfg(test)]
mod tests {
    use super::receipt_paths_match;

    #[test]
    fn recovery_receipt_paths_admit_only_exact_edits_and_the_generated_index() {
        let paths = |values: &[&str]| values.iter().map(|v| (*v).to_owned()).collect::<Vec<_>>();
        let edited = paths(&["docs/rooms/note.md"]);
        assert!(receipt_paths_match(&edited, &edited));
        assert!(receipt_paths_match(
            &edited,
            &paths(&["docs/INDEX.md", "docs/rooms/note.md"])
        ));
        for written in [
            paths(&["docs/INDEX.md"]),
            paths(&["docs/rooms/other.md", "docs/INDEX.md"]),
            paths(&["docs/rooms/note.md", "docs/rooms/other.md"]),
            paths(&["docs/rooms/note.md", "docs/INDEX.md", "docs/INDEX.md"]),
            paths(&["docs/rooms/note.md", "docs/rooms/note.md"]),
        ] {
            assert!(
                !receipt_paths_match(&edited, &written),
                "refuse {written:?}"
            );
        }
    }
}

/// The webview supplies only a receipt token already handled in its reducer.
/// Failure is notification bookkeeping; it never changes saved/unknown state.
pub fn acknowledge(watch: &WatchState, state: &RecordEditorState, key: &str, attempt: u64) -> bool {
    (|| -> Result<()> {
        let owner = state.recovery.lock().expect("record recovery mutex poisoned").receipts.get(key).cloned().ok_or_else(invalid)?;
        let _flight = watch.begin_pick().ok_or_else(invalid)?;
        let lease = state.begin(key, attempt)?;
        let deadline = Instant::now() + CHECK_TIME;
        let tool = state.tool(deadline, &lease.cancel)?;
        let request = json!({"version":1,"requestId":format!("record-ack-{}",state.next()),"operation":"acknowledge","productRoot":owner.product,
            "operationId":owner.receipt.operation_id,"commit":owner.receipt.commit});
        let result = invoke_tool(&tool, &owner.product, &request, deadline, &lease.cancel)?;
        if result["status"] != "acknowledged" || result["operationId"] != owner.receipt.operation_id || result["commit"] != owner.receipt.commit { return Err(invalid()); }
        Ok(())
    })().is_ok()
}
