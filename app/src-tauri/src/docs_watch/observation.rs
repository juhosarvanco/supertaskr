//! Selected product and records observation are separate facts. This module
//! composes the delivered resolver with the existing watcher; it grants no
//! write authority and accepts no path from the webview.
use super::*;
use crate::workspace::{Layout, WorkspaceMode, WorkspaceResolver};
use std::sync::Condvar;

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordsObservation {
    pub selection_sequence: u64,
    pub context_sequence: u64,
    pub layout: String,
    /// Display data, never a path argument accepted back from the webview.
    pub records_dir: Option<String>,
    pub association_id: Option<String>,
    pub root_incarnation: Option<String>,
    pub docs_incarnation: Option<String>,
    pub availability: String,
    pub finding: Option<String>,
    /// This names the actual working-tree collection, not Git HEAD. It is
    /// observation provenance, not an atomic/coherent-tree or save receipt.
    pub content_revision: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageScope {
    pub seq: u64,
    pub project_dir: Option<String>,
    pub selection_sequence: u64,
    pub context_sequence: u64,
    pub records: Option<RecordsObservation>,
}
impl MessageScope {
    pub(super) fn from_snapshot(snapshot: &DocsSnapshot) -> Option<Self> {
        snapshot.records.as_ref().map(|records| Self {
            seq: snapshot.seq,
            project_dir: Some(snapshot.project_dir.clone()),
            selection_sequence: records.selection_sequence,
            context_sequence: records.context_sequence,
            records: Some(records.clone()),
        })
    }
    pub(super) fn legacy(product: Option<PathBuf>, seq: u64) -> Self {
        Self {
            seq,
            project_dir: product.map(|p| p.display().to_string()),
            selection_sequence: 0,
            context_sequence: 0,
            records: None,
        }
    }
}
#[derive(Clone, Debug, Serialize)]
pub struct ScopedOutcome<T> {
    #[serde(flatten)]
    pub outcome: T,
    pub scope: MessageScope,
}

#[derive(Clone)]
pub(super) struct SharedSelection {
    project: Arc<Mutex<Option<PathBuf>>>,
    current: Arc<Mutex<Option<ManagedSelection>>>,
}
impl SharedSelection {
    pub(super) fn new(project: Arc<Mutex<Option<PathBuf>>>) -> Self {
        Self {
            project,
            current: Arc::new(Mutex::new(None)),
        }
    }
    pub(super) fn get(&self) -> Option<ManagedSelection> {
        self.current
            .lock()
            .expect("observation mutex poisoned")
            .clone()
    }
    pub(super) fn set(&self, selection: ManagedSelection) {
        *self.current.lock().expect("observation mutex poisoned") = Some(selection);
    }
    pub(super) fn unavailable_snapshot(
        &self,
        seq: &AtomicU64,
        message: &str,
    ) -> Option<DocsSnapshot> {
        let current = self.current.lock().expect("observation mutex poisoned");
        Some(
            current
                .as_ref()?
                .unavailable_snapshot(next_seq(seq), message),
        )
    }
    fn commit(&self, selection: &mut ManagedSelection, seq: &AtomicU64) -> u64 {
        let mut current = self.current.lock().expect("observation mutex poisoned");
        let stamp = next_seq(seq);
        selection.selection_sequence = stamp;
        selection.context_sequence = stamp;
        *self.project.lock().expect("project mutex poisoned") = Some(selection.product.clone());
        *current = Some(selection.clone());
        stamp
    }
    pub(super) fn scope(&self, seq: u64) -> MessageScope {
        match self.get() {
            Some(current) => {
                let mut records = current.envelope(seq);
                records.content_revision = None;
                MessageScope {
                    seq,
                    project_dir: Some(current.product.display().to_string()),
                    selection_sequence: current.selection_sequence,
                    context_sequence: current.context_sequence,
                    records: Some(records),
                }
            }
            None => MessageScope::legacy(
                self.project.lock().expect("project mutex poisoned").clone(),
                seq,
            ),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub(super) struct ManagedSelection {
    pub(super) product: PathBuf,
    records: Option<PathBuf>,
    layout: String,
    association_id: Option<String>,
    root_id: Option<(u64, u64)>,
    docs_id: Option<(u64, u64)>,
    availability: String,
    finding: Option<String>,
    selection_sequence: u64,
    context_sequence: u64,
}
fn incarnation(id: Option<(u64, u64)>) -> Option<String> {
    id.map(|(device, inode)| format!("{device}:{inode}"))
}
impl ManagedSelection {
    pub(super) fn legacy(product: PathBuf, seq: u64) -> Self {
        Self::located(product.clone(), product, "colocated", None, seq)
    }
    fn located(
        product: PathBuf,
        records: PathBuf,
        layout: &str,
        association_id: Option<String>,
        seq: u64,
    ) -> Self {
        let present = has_plain_docs_dir(&records);
        Self {
            product,
            root_id: dir_identity(&records),
            docs_id: present
                .then(|| dir_identity(&records.join(DOCS_DIR)))
                .flatten(),
            records: Some(records),
            layout: layout.into(),
            association_id,
            availability: if present { "available" } else { "noDocs" }.into(),
            finding: None,
            selection_sequence: seq,
            context_sequence: seq,
        }
    }
    pub(super) fn unavailable(product: PathBuf, seq: u64, finding: String) -> Self {
        Self {
            product,
            records: None,
            layout: "unavailable".into(),
            association_id: None,
            root_id: None,
            docs_id: None,
            availability: "unavailable".into(),
            finding: Some(finding),
            selection_sequence: seq,
            context_sequence: seq,
        }
    }
    pub(super) fn envelope(&self, seq: u64) -> RecordsObservation {
        RecordsObservation {
            selection_sequence: self.selection_sequence,
            context_sequence: self.context_sequence,
            layout: self.layout.clone(),
            records_dir: self.records.as_ref().map(|p| p.display().to_string()),
            association_id: self.association_id.clone(),
            root_incarnation: incarnation(self.root_id),
            docs_incarnation: incarnation(self.docs_id),
            availability: self.availability.clone(),
            finding: self.finding.clone(),
            content_revision: (self.availability != "unavailable")
                .then(|| format!("working-tree-observation:{seq}")),
        }
    }
    pub(super) fn snapshot(&self, seq: u64, outcome: CollectOutcome) -> DocsSnapshot {
        let mut snapshot = snapshot_from(&self.product, seq, outcome);
        snapshot.records = Some(self.envelope(seq));
        snapshot
    }
    pub(super) fn unavailable_snapshot(&self, seq: u64, message: &str) -> DocsSnapshot {
        let mut failed = self.clone();
        failed.availability = "unavailable".into();
        failed.finding = Some(message.into());
        failed.snapshot(seq, CollectOutcome::default())
    }
    fn same_context(&self, other: &Self) -> bool {
        let mut old = self.clone();
        old.selection_sequence = other.selection_sequence;
        old.context_sequence = other.context_sequence;
        old == *other
    }
}

/// Presence is independently fallible. Only an affirmative absence permits
/// the old non-Git folder/genesis behavior.
pub(super) fn binding_absent(product: &Path) -> bool {
    WorkspaceResolver::new().and_then(|r| r.workspace_binding_present(product)) == Ok(false)
}
fn resolve(product: PathBuf, seq: u64) -> ManagedSelection {
    let resolved = (|| {
        let resolver = WorkspaceResolver::new().map_err(|e| e.to_string())?;
        if !resolver
            .workspace_binding_present(&product)
            .map_err(|e| e.to_string())?
        {
            if !is_plain_dir(&product) {
                return Err("selected product is no longer a plain directory".into());
            }
            return Ok(ManagedSelection::legacy(product.clone(), seq));
        }
        let workspace = resolver
            .resolve_workspace(&product, WorkspaceMode::Development, "HEAD")
            .map_err(|e| e.to_string())?;
        Ok(ManagedSelection::located(
            workspace.product_root().to_path_buf(),
            workspace.records_root().to_path_buf(),
            if workspace.layout() == Layout::Split {
                "split"
            } else {
                "colocated"
            },
            workspace.association().project_id.clone(),
            seq,
        ))
    })();
    resolved.unwrap_or_else(|finding| {
        let mut failed = ManagedSelection::unavailable(product.clone(), seq, finding);
        // ProductOnly validates binding data without touching private files.
        // Retain this declared destination solely for display/recovery wakeups.
        if let Ok(workspace) = WorkspaceResolver::new()
            .and_then(|r| r.resolve_workspace(&product, WorkspaceMode::ProductOnly, "HEAD"))
        {
            if workspace.layout() == Layout::Split {
                failed.records = Some(workspace.records_root().to_path_buf());
                failed.layout = "split".into();
                failed.association_id = workspace.association().project_id.clone();
            }
        }
        failed
    })
}

enum Decision {
    Pending,
    Commit,
    Cancelled,
    Committed(DocsSnapshot),
}
/// The gate coordinates an existing selection attempt, not an identity or
/// grant. A timeout and the native commit inspect the same locked decision.
pub struct SelectionGate {
    decision: Mutex<Decision>,
    changed: Condvar,
    genesis: bool,
    expectation: Option<SelectionExpectation>,
}
pub(super) type SelectionExpectation = Arc<dyn Fn(&Path, &RecordsObservation) -> Result<(), String> + Send + Sync>;
impl SelectionGate {
    #[cfg(test)]
    fn new() -> Self {
        Self::for_genesis(false)
    }
    fn for_genesis(genesis: bool) -> Self {
        Self {
            decision: Mutex::new(Decision::Pending),
            changed: Condvar::new(),
            genesis,
            expectation: None,
        }
    }
    fn cancel_or_committed(&self) -> Option<DocsSnapshot> {
        let mut decision = self.decision.lock().expect("selection gate poisoned");
        if let Decision::Committed(snapshot) = &*decision {
            return Some(snapshot.clone());
        }
        *decision = Decision::Cancelled;
        self.changed.notify_one();
        None
    }
}

pub(super) fn open(state: &WatchState, product: &Path) -> PickOutcome {
    // Preserve the existing empty legacy pick and its finite genesis offer.
    if binding_absent(product) && !has_plain_docs_dir(product) {
        state.remember_rejected(product);
        return PickOutcome::NoDocs {
            path: product.display().to_string(),
            probe: probe_plan(product),
        };
    }
    open_selected(state, product, false)
}

pub(super) fn open_genesis(
    state: &WatchState,
    product: &Path,
    reach: GenesisReachability,
    git: bool,
) -> PickOutcome {
    match open_selected(state, product, true) {
        PickOutcome::Picked { snapshot }
            if routes_to_genesis(&PlanProbe::from_docs_snapshot(&snapshot, git), reach) =>
        {
            let docs_present = snapshot
                .records
                .as_ref()
                .is_some_and(|records| records.availability == "available");
            PickOutcome::Genesis {
                project_dir: snapshot.project_dir.clone(),
                seq: snapshot.seq,
                snapshot: docs_present.then_some(snapshot),
            }
        }
        other => other,
    }
}

fn open_selected(state: &WatchState, product: &Path, genesis: bool) -> PickOutcome {
    open_expected(state, product, genesis, None)
}
pub(super) fn open_initialized(state: &WatchState, product: &Path, expectation: SelectionExpectation) -> PickOutcome {
    open_expected(state, product, false, Some(expectation))
}
fn open_expected(state: &WatchState, product: &Path, genesis: bool, expectation: Option<SelectionExpectation>) -> PickOutcome {
    let mut gate = SelectionGate::for_genesis(genesis);
    gate.expectation = expectation;
    let gate = Arc::new(gate);
    let (prepared, prepared_rx) = mpsc::channel();
    let (completed, completed_rx) = mpsc::channel();
    let error = |message: String| PickOutcome::Error {
        path: product.display().to_string(),
        message,
    };
    if state
        .ctl
        .send(WatchCtl::Select {
            product: product.to_path_buf(),
            gate: gate.clone(),
            prepared,
            completed,
        })
        .is_err()
    {
        return error("watcher thread is not running".into());
    }
    match prepared_rx.recv_timeout(REARM_TIMEOUT) {
        Ok(Ok(())) => {
            let mut decision = gate.decision.lock().expect("selection gate poisoned");
            if matches!(*decision, Decision::Pending) {
                *decision = Decision::Commit;
                gate.changed.notify_one();
            }
        }
        result => {
            if let Some(snapshot) = gate.cancel_or_committed() {
                return PickOutcome::Picked { snapshot };
            }
            return error(match result {
                Ok(Err(message)) => message,
                Err(mpsc::RecvTimeoutError::Timeout) => {
                    "watcher re-arm timed out; previous selection retained".into()
                }
                _ => {
                    "watcher dropped the re-arm acknowledgement; previous selection retained".into()
                }
            });
        }
    }
    match completed_rx.recv_timeout(REARM_TIMEOUT) {
        Ok(snapshot) => {
            state.clear_rejected();
            PickOutcome::Picked { snapshot }
        }
        Err(_) => match gate.cancel_or_committed() {
            Some(snapshot) => {
                state.clear_rejected();
                PickOutcome::Picked { snapshot }
            }
            None => error("watcher selection did not commit; previous selection retained".into()),
        },
    }
}

fn empty_target() -> WatchTarget {
    WatchTarget {
        root: None,
        docs: None,
        docs_id: None,
        sentinel: None,
        last: CollectOutcome::default(),
        managed: None,
        auxiliary: Vec::new(),
    }
}
fn watched(target: &WatchTarget) -> Vec<PathBuf> {
    let mut paths = target.auxiliary.clone();
    paths.extend(target.docs.iter().cloned());
    paths.extend(target.sentinel.iter().cloned());
    paths.sort();
    paths.dedup();
    paths
}
fn retire<T: notify_debouncer_mini::notify::Watcher>(
    debouncer: &mut Debouncer<T>,
    old: &WatchTarget,
    keep: &WatchTarget,
) {
    let keep = watched(keep);
    for path in watched(old) {
        if !keep.contains(&path) {
            let _ = debouncer.watcher().unwatch(&path);
        }
    }
}
fn auxiliary<T: notify_debouncer_mini::notify::Watcher>(
    debouncer: &mut Debouncer<T>,
    target: &mut WatchTarget,
    path: &Path,
) {
    if !watched(target).contains(&path.to_path_buf())
        && is_plain_dir(path)
        && debouncer
            .watcher()
            .watch(path, RecursiveMode::NonRecursive)
            .is_ok()
    {
        target.auxiliary.push(path.to_path_buf());
    }
}
fn prepare<T: notify_debouncer_mini::notify::Watcher>(
    debouncer: &mut Debouncer<T>,
    selection: ManagedSelection,
) -> WatchTarget {
    let mut target = empty_target();
    if let Some(root) = &selection.records {
        target.root = Some(root.clone());
        if selection.availability == "unavailable" {
            // Never collect an unvalidated or replaced repository.
        } else if has_plain_docs_dir(root) {
            if let Err(message) = rearm(debouncer, &mut target, root.clone()) {
                let mut failed = selection.clone();
                failed.availability = "unavailable".into();
                failed.finding = Some(message);
                target.managed = Some(failed);
            }
        } else {
            arm_sentinel(debouncer, &mut target, root);
            if target.sentinel.is_none() {
                let mut failed = selection.clone();
                failed.availability = "unavailable".into();
                failed.finding = Some("records root sentinel could not be installed".into());
                target.managed = Some(failed);
            }
        }
        // The parent is only a non-recursive wakeup for whole-root loss and
        // reappearance. Collection always revalidates the selected binding.
        if let Some(parent) = root.parent() {
            auxiliary(debouncer, &mut target, parent);
        }
    }
    auxiliary(
        debouncer,
        &mut target,
        &selection.product.join(".supertaskr"),
    );
    auxiliary(debouncer, &mut target, &selection.product);
    if target.managed.is_none() {
        target.managed = Some(selection);
    }
    target.last = collect(&target);
    target
}
fn collect(target: &WatchTarget) -> CollectOutcome {
    match &target.managed {
        Some(selection) if selection.availability != "unavailable" => selection
            .records
            .as_ref()
            .map_or_else(CollectOutcome::default, |root| collect_docs_tree(root)),
        _ => CollectOutcome::default(),
    }
}

pub(super) fn initialize<T: notify_debouncer_mini::notify::Watcher>(
    debouncer: &mut Debouncer<T>,
    target: &mut WatchTarget,
    shared: &SharedSelection,
    product: PathBuf,
    seq: u64,
) {
    let candidate = prepare(debouncer, resolve(product, seq));
    shared.set(candidate.managed.clone().expect("prepared context"));
    *target = candidate;
}

pub(super) fn select<T: notify_debouncer_mini::notify::Watcher>(
    debouncer: &mut Debouncer<T>,
    target: &mut WatchTarget,
    shared: &SharedSelection,
    seq: &AtomicU64,
    product: PathBuf,
    gate: Arc<SelectionGate>,
    prepared: mpsc::Sender<Result<(), String>>,
    completed: mpsc::Sender<DocsSnapshot>,
    before_publish: &mut impl FnMut(&WatchTarget),
) {
    if matches!(
        *gate.decision.lock().expect("selection gate poisoned"),
        Decision::Cancelled
    ) {
        return;
    }
    let candidate = prepare(debouncer, resolve(product.clone(), 0));
    let expected = |target: &WatchTarget| -> Result<(), String> {
        if let Some(expectation) = &gate.expectation {
            let selection = target.managed.as_ref().ok_or("initialized selection unavailable")?;
            expectation(&selection.product, &selection.envelope(0))?;
        }
        Ok(())
    };
    if let Err(message) = expected(&candidate) {
        retire(debouncer, &candidate, target);
        let _ = prepared.send(Err(message));
        return;
    }
    let genesis_ready = |target: &WatchTarget| {
        target.managed.as_ref().is_some_and(|selection| {
            selection.layout == "colocated" && selection.availability != "unavailable"
        })
    };
    if gate.genesis && !genesis_ready(&candidate) {
        retire(debouncer, &candidate, target);
        let _ = prepared.send(Err(
            "legacy genesis watch could not be installed; previous selection retained".into(),
        ));
        return;
    }
    if prepared.send(Ok(())).is_err() {
        retire(debouncer, &candidate, target);
        return;
    }
    let decision = gate.decision.lock().expect("selection gate poisoned");
    let (decision, _) = gate
        .changed
        .wait_timeout_while(decision, REARM_TIMEOUT, |d| matches!(d, Decision::Pending))
        .expect("selection gate poisoned");
    if !matches!(*decision, Decision::Commit) {
        retire(debouncer, &candidate, target);
        return;
    }
    drop(decision);
    // Revalidate after acknowledgement and collect again. Candidate events
    // queued during the rendezvous are subsequently diffed against these bytes.
    let mut committed = prepare(debouncer, resolve(product, 0));
    if expected(&committed).is_err() {
        retire(debouncer, &candidate, target);
        retire(debouncer, &committed, target);
        gate.cancel_or_committed();
        return;
    }
    if gate.genesis && !genesis_ready(&committed) {
        retire(debouncer, &candidate, target);
        retire(debouncer, &committed, target);
        gate.cancel_or_committed();
        return;
    }
    let mut selection = committed.managed.clone().expect("prepared context");
    let check = resolve(selection.product.clone(), 0);
    if !selection.same_context(&check) {
        selection.availability = "unavailable".into();
        selection.finding = Some(
            "records context changed during selection collection; refresh to reconcile".into(),
        );
        committed.last = CollectOutcome::default();
        committed.managed = Some(selection.clone());
    }
    if gate.genesis && !genesis_ready(&committed) {
        retire(debouncer, &candidate, target);
        retire(debouncer, &committed, target);
        gate.cancel_or_committed();
        return;
    }
    if expected(&committed).is_err() {
        retire(debouncer, &candidate, target);
        retire(debouncer, &committed, target);
        gate.cancel_or_committed();
        return;
    }
    let mut decision = gate.decision.lock().expect("selection gate poisoned");
    if !matches!(*decision, Decision::Commit) {
        retire(debouncer, &candidate, target);
        retire(debouncer, &committed, target);
        return;
    }
    retire(debouncer, &candidate, &committed);
    retire(debouncer, target, &committed);
    // Stamp the actual commit while holding the same selection lock used by
    // timeout status capture. A preceding A failure cannot overtake this C
    // commit merely because C's final collection started earlier.
    let stamp = shared.commit(&mut selection, seq);
    committed.managed = Some(selection.clone());
    let snapshot = selection.snapshot(stamp, committed.last.clone());
    // Keep the baseline equal to the snapshot, so a write in this final
    // window remains dirty and is delivered by the queued fs batch.
    committed.last = CollectOutcome {
        files: snapshot.files.clone(),
        skipped: snapshot.skipped.clone(),
        skipped_total: snapshot.skipped_total,
        truncated: snapshot.truncated,
    };
    *target = committed;
    before_publish(target);
    *decision = Decision::Committed(snapshot.clone());
    drop(decision);
    let _ = completed.send(snapshot);
}

fn reconcile<T: notify_debouncer_mini::notify::Watcher>(
    debouncer: &mut Debouncer<T>,
    target: &mut WatchTarget,
    shared: &SharedSelection,
    seq: &AtomicU64,
) -> bool {
    let Some(current) = shared.get() else {
        return false;
    };
    let mut latest = resolve(current.product.clone(), current.selection_sequence);
    if current.layout == "split" && latest.layout == "colocated" {
        latest = current.clone();
        latest.availability = "unavailable".into();
        latest.finding = Some("established split binding disappeared; select the product again to change its records home".into());
    }
    latest.context_sequence = current.context_sequence;
    let mut changed = !current.same_context(&latest);
    if changed
        || target.root != current.records
        || target
            .managed
            .as_ref()
            .is_none_or(|s| s.selection_sequence != current.selection_sequence)
    {
        // Replaced same-path handles must actually be removed before a new
        // watch is installed; merely watching the pathname again is backend
        // dependent. This is recovery of the committed target, not a pick.
        if current.records == latest.records
            && (current.docs_id != latest.docs_id || current.root_id != latest.root_id)
        {
            if let Some(path) = target.docs.take() {
                let _ = debouncer.watcher().unwatch(&path);
            }
            if current.root_id != latest.root_id {
                if let Some(path) = target.sentinel.take() {
                    let _ = debouncer.watcher().unwatch(&path);
                }
            }
        }
        let mut candidate = prepare(debouncer, latest);
        changed = !current.same_context(candidate.managed.as_ref().expect("prepared context"));
        if changed {
            candidate
                .managed
                .as_mut()
                .expect("prepared context")
                .context_sequence = next_seq(seq);
        }
        retire(debouncer, target, &candidate);
        *target = candidate;
        shared.set(target.managed.clone().expect("prepared context"));
    } else if let Some(root) = target.root.clone() {
        let _ = ensure_docs_watch(debouncer, target, &root);
    }
    changed
}

fn observed<T: notify_debouncer_mini::notify::Watcher>(
    debouncer: &mut Debouncer<T>,
    target: &mut WatchTarget,
    shared: &SharedSelection,
    seq: &AtomicU64,
) -> Option<DocsSnapshot> {
    reconcile(debouncer, target, shared, seq);
    let before = shared.get()?;
    // A physical target mismatch never supplies selected-context bytes.
    if target.root != before.records {
        return None;
    }
    let stamp = next_seq(seq);
    let outcome = collect(target);
    // Association/incarnation is checked across collection and publication.
    if reconcile(debouncer, target, shared, seq) {
        let mut selection = shared.get()?;
        // Do not attach a new context to bytes collected from another one.
        selection.availability = "unavailable".into();
        selection.finding =
            Some("records context changed during collection; refresh to reconcile".into());
        selection.context_sequence = next_seq(seq);
        target.managed = Some(selection.clone());
        shared.set(selection.clone());
        return Some(selection.snapshot(next_seq(seq), CollectOutcome::default()));
    }
    Some(before.snapshot(stamp, outcome))
}
pub(super) fn read<T: notify_debouncer_mini::notify::Watcher>(
    debouncer: &mut Debouncer<T>,
    target: &mut WatchTarget,
    shared: &SharedSelection,
    seq: &AtomicU64,
) -> ProjectStatus {
    match observed(debouncer, target, shared, seq) {
        Some(snapshot) => ProjectStatus::Open { snapshot },
        None => ProjectStatus::NoProject,
    }
}
pub(super) fn handle_batch<T: notify_debouncer_mini::notify::Watcher>(
    debouncer: &mut Debouncer<T>,
    target: &mut WatchTarget,
    shared: &SharedSelection,
    seq: &AtomicU64,
    events: &[DebouncedEvent],
    sink: &impl Fn(&DocsSnapshot),
    before_publish: &mut impl FnMut(&WatchTarget),
) {
    if events.is_empty() {
        return;
    }
    let previous = target.managed.clone();
    let baseline = target.last.clone();
    let Some(snapshot) = observed(debouncer, target, shared, seq) else {
        return;
    };
    let outcome = CollectOutcome {
        files: snapshot.files.clone(),
        skipped: snapshot.skipped.clone(),
        skipped_total: snapshot.skipped_total,
        truncated: snapshot.truncated,
    };
    if previous == target.managed && baseline == outcome {
        return;
    }
    target.last = outcome;
    before_publish(target);
    sink(&snapshot);
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::process::Command;
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
            .env("GIT_AUTHOR_NAME", "Observation fixture")
            .env("GIT_AUTHOR_EMAIL", "fixture@example.invalid")
            .env("GIT_COMMITTER_NAME", "Observation fixture")
            .env("GIT_COMMITTER_EMAIL", "fixture@example.invalid")
            .env_remove("GIT_DIR")
            .env_remove("GIT_WORK_TREE")
            .env_remove("GIT_CONFIG_COUNT")
            .output()
            .unwrap();
        assert!(
            output.status.success(),
            "git {args:?}: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        String::from_utf8(output.stdout).unwrap().trim().into()
    }
    fn repository(root: &Path, source: &str) {
        fs::create_dir_all(root.join("docs")).unwrap();
        fs::write(root.join(source), "source history\n").unwrap();
        git(root, &["init", "-q", "--initial-branch=main"]);
        git(root, &["add", "."]);
        git(root, &["commit", "-qm", "fixture history"]);
    }
    struct Fixture {
        root: PathBuf,
        product: PathBuf,
        records: PathBuf,
    }
    impl Fixture {
        fn new() -> Self {
            let root = std::env::temp_dir().join(format!(
                "supertaskr-observation-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::SeqCst)
            ));
            let product = root.join("product");
            let records = root.join("product-private");
            repository(&product, "product-source.txt");
            repository(&records, "private-only.txt");
            let fx = Self {
                root: root.canonicalize().unwrap(),
                product: product.canonicalize().unwrap(),
                records: records.canonicalize().unwrap(),
            };
            fs::write(fx.product.join("docs/record.md"), "PRODUCT DECOY").unwrap();
            fs::write(fx.records.join("docs/record.md"), "private one").unwrap();
            fx.bind(&fx.records);
            fx
        }
        fn association(&self) -> serde_json::Value {
            let identity = WorkspaceResolver::new()
                .unwrap()
                .measure_product_identity(&self.product, "HEAD")
                .unwrap();
            json!({"version":1,"projectId":"observation-fixture","product":{"objectFormat":identity.object_format,"rootCommits":identity.root_commits}})
        }
        fn bind(&self, records: &Path) {
            fs::create_dir_all(self.product.join(".supertaskr")).unwrap();
            fs::write(
                records.join("workspace-association.json"),
                serde_json::to_vec(&self.association()).unwrap(),
            )
            .unwrap();
            fs::write(self.product.join(".supertaskr/workspace.json"), serde_json::to_vec(&json!({"version":1,"projectId":"observation-fixture","productRoot":self.product,"recordsRoot":records})).unwrap()).unwrap();
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.root);
        }
    }
    struct Live {
        state: WatchState,
        events: mpsc::Receiver<DocsSnapshot>,
        architecture: mpsc::Receiver<ArchitectureChange>,
    }
    impl Live {
        fn new(initial: Option<PathBuf>) -> Self {
            Self::new_with_sink(initial, |_| {})
        }
        fn new_with_sink(initial: Option<PathBuf>, observer: impl Fn(&DocsSnapshot) + Send + 'static) -> Self {
            let (tx, events) = mpsc::channel();
            let (graph_tx, architecture) = mpsc::channel();
            let state = WatchState::start_with_architecture(initial, move |snapshot| {
                observer(snapshot);
                let _ = tx.send(snapshot.clone());
            }, move |change| {
                let _ = graph_tx.send(change.clone());
            });
            let live = Self { state, events, architecture };
            let _ = project_status(&live.state); // startup installation barrier
            live
        }
        fn pick(&self, root: &Path) -> DocsSnapshot {
            match apply_picked_folder(&self.state, root, self.state.begin_pick().unwrap()) {
                PickOutcome::Picked { snapshot } => snapshot,
                other => panic!("expected picked observation: {other:?}"),
            }
        }
        fn read(&self) -> DocsSnapshot {
            match project_status(&self.state) {
                ProjectStatus::Open { snapshot } => snapshot,
                other => panic!("expected observation: {other:?}"),
            }
        }
        fn pause(&self) -> mpsc::Sender<()> {
            let (ready, reached) = mpsc::channel();
            let (release, resumed) = mpsc::channel();
            self.state
                .ctl
                .send(WatchCtl::Pause {
                    ready,
                    release: resumed,
                })
                .unwrap();
            reached
                .recv_timeout(Duration::from_secs(2))
                .expect("controller reached FIFO scheduling barrier");
            release
        }
        fn until(&self, want: impl Fn(&DocsSnapshot) -> bool) -> DocsSnapshot {
            let deadline = std::time::Instant::now() + Duration::from_secs(8);
            let mut seen = Vec::new();
            loop {
                let remaining = deadline.saturating_duration_since(std::time::Instant::now());
                let snapshot = self.events.recv_timeout(remaining).unwrap_or_else(|e| {
                    panic!("private observation did not arrive: {e}; {seen:?}")
                });
                if want(&snapshot) {
                    return snapshot;
                }
                seen.push((snapshot.seq, snapshot.records.clone()));
            }
        }
    }
    impl Drop for Live {
        fn drop(&mut self) {
            let (ack, rx) = mpsc::channel();
            let _ = self.state.ctl.send(WatchCtl::Stop { ack });
            rx.recv_timeout(Duration::from_secs(2))
                .expect("owned watcher stopped after dropping its debouncer");
        }
    }
    fn text(snapshot: &DocsSnapshot) -> Option<&str> {
        snapshot
            .files
            .iter()
            .find(|f| f.path == "docs/record.md")
            .map(|f| f.content.as_str())
    }

    #[test]
    fn initialized_expectation_refusal_at_each_rendezvous_keeps_original_watch_and_allows_later_selection() {
        let a=Fixture::new();let b=Fixture::new();let live=Live::new(None);let original=live.pick(&a.product);
        for fail_at in 1..=3 {
            let target=b.product.clone();let records=b.records.display().to_string();let seen=Arc::new(AtomicU64::new(0));let count=seen.clone();
            let expectation:SelectionExpectation=Arc::new(move |product,observed| {
                assert_eq!(product,target);assert_eq!(observed.records_dir.as_deref(),Some(records.as_str()));
                if count.fetch_add(1,Ordering::SeqCst)+1==fail_at {Err("original inspected setup changed".into())} else {Ok(())}
            });
            let flight=live.state.begin_pick().unwrap();let result=select_initialized_folder(&live.state,&b.product,expectation);drop(flight);
            assert!(matches!(result,PickOutcome::Error {..}),"{result:?}");assert_eq!(seen.load(Ordering::SeqCst),fail_at);
            assert_eq!(live.state.project_dir(),Some(a.product.clone()));
            assert_eq!(live.read().records.as_ref().unwrap().selection_sequence,original.records.as_ref().unwrap().selection_sequence);
            let marker=format!("original file event after refused stage {fail_at}");fs::write(a.records.join("docs/record.md"),&marker).unwrap();
            live.until(|snapshot|text(snapshot)==Some(marker.as_str()));
        }
        let flight=live.state.begin_pick().unwrap();let accepted=select_initialized_folder(&live.state,&b.product,Arc::new(|_,_|Ok(())));drop(flight);
        let accepted=match accepted {PickOutcome::Picked {snapshot}=>snapshot,other=>panic!("{other:?}")};
        assert!(accepted.seq>original.seq);assert_eq!(accepted.records.as_ref().unwrap().records_dir.as_deref(),Some(b.records.to_str().unwrap()));
        fs::write(b.records.join("docs/record.md"),"positive initialized watch event").unwrap();live.until(|snapshot|text(snapshot)==Some("positive initialized watch event"));
    }

    #[test]
    fn split_selection_and_real_watch_keep_product_source_identity() {
        let fx = Fixture::new();
        let live = Live::new(None);
        let selected = live.pick(&fx.product);
        assert_eq!(selected.project_dir, fx.product.display().to_string());
        assert_eq!(text(&selected), Some("private one"));
        assert_eq!(
            selected.records.as_ref().unwrap().records_dir,
            Some(fx.records.display().to_string())
        );
        let serialized = serde_json::to_value(&selected).unwrap();
        assert_eq!(serialized["records"]["layout"], "split");
        assert!(serialized["records"]["contentRevision"]
            .as_str()
            .unwrap()
            .starts_with("working-tree-observation:"));
        fs::write(fx.records.join("docs/record.md"), "private two").unwrap();
        let changed = live.until(|s| text(s) == Some("private two"));
        assert!(changed.seq > selected.seq);
        assert_eq!(
            changed.records.as_ref().unwrap().selection_sequence,
            selected.seq
        );
        match crate::churn::run_churn(&live.state) {
            crate::churn::ChurnOutcome::Measured { paths, .. } => {
                assert!(paths.iter().any(|p| p.path == "product-source.txt"));
                assert!(!paths.iter().any(|p| p.path == "private-only.txt"));
            }
            other => panic!("PRODUCT source operation failed: {other:?}"),
        }
        assert_eq!(
            fs::read_to_string(fx.product.join("docs/record.md")).unwrap(),
            "PRODUCT DECOY"
        );
    }

    #[test]
    fn graph_only_publication_emits_scoped_invalidation_without_docs_or_graph_bytes() {
        let fx = Fixture::new();
        let graph_dir = fx.records.join("docs/architecture");
        fs::create_dir_all(&graph_dir).unwrap();
        fs::write(graph_dir.join("graph.json"), "original graph").unwrap();
        let second = fx.root.join("records-two");
        let selected_root = second.display().to_string();
        let selected_graph = second.join("docs/architecture/graph.json");
        let wrote = Arc::new(std::sync::atomic::AtomicBool::new(false));
        let wrote_in_sink = wrote.clone();
        let live = Live::new_with_sink(Some(fx.product.clone()), move |snapshot| {
            if snapshot.records.as_ref().is_some_and(|records| records.availability == "available" && records.records_dir.as_deref() == Some(selected_root.as_str())) &&
                !wrote_in_sink.swap(true, Ordering::SeqCst) {
                // A receiver can react as soon as its new context is published.
                // Make that write synchronous so a post-publication baseline
                // cannot silently absorb it on a faster watcher thread.
                fs::write(&selected_graph, "new selected graph").unwrap();
            }
        });
        let first = live.read();
        fs::write(fx.records.join("docs/record.md"), "ordinary note change").unwrap();
        live.until(|s| text(s) == Some("ordinary note change"));
        assert!(live.architecture.try_recv().is_err(), "ordinary notes do not reset graph readers");
        fs::write(graph_dir.join("graph.tmp"), "external graph payload never broadcast").unwrap();
        fs::rename(graph_dir.join("graph.tmp"), graph_dir.join("graph.json")).unwrap();
        let changed = live.architecture.recv_timeout(Duration::from_secs(8)).expect("graph-only change invalidates architecture readers");
        assert_eq!(changed.scope.project_dir, Some(fx.product.display().to_string()));
        assert_eq!(changed.scope.context_sequence, first.records.as_ref().unwrap().context_sequence);
        assert!(changed.scope.seq > first.seq);
        let wire = serde_json::to_string(&changed).unwrap();
        assert!(wire.len() < 2048);
        assert!(!wire.contains("external graph payload") && !wire.contains("graph.json"));
        assert!(live.events.try_recv().is_err(), "graph-only writes never broadcast the docs tree");

        repository(&second, "private-two.txt");
        fs::create_dir_all(second.join("docs/architecture")).unwrap();
        fs::write(second.join("docs/architecture/graph.json"), "second baseline").unwrap();
        fx.bind(&second);
        let selected = live.until(|s| s.records.as_ref().is_some_and(|records| records.availability == "available" && records.records_dir.as_deref() == second.to_str()));
        assert!(wrote.load(Ordering::SeqCst), "the new-context receiver actually wrote its graph");
        fs::write(graph_dir.join("graph.json"), "old records poison").unwrap();
        let current = live.architecture.recv_timeout(Duration::from_secs(8)).unwrap_or_else(|error| panic!("new available context positive graph notice: {error}; selected={:?}", selected.records));
        assert_eq!(current.scope.context_sequence, selected.records.as_ref().unwrap().context_sequence);
        assert_eq!(current.scope.records.unwrap().records_dir.as_deref(), second.to_str());
        assert!(live.architecture.try_recv().is_err(), "the retired home cannot send a selected graph notice");
    }

    #[test]
    fn same_product_rebind_and_identical_docs_replacement_publish_new_contexts() {
        let fx = Fixture::new();
        let live = Live::new(Some(fx.product.clone()));
        let first = live.read();
        let second_root = fx.root.join("records-two");
        repository(&second_root, "private-two.txt");
        fs::write(second_root.join("docs/record.md"), "private one").unwrap();
        fx.bind(&second_root);
        let rebound = live.until(|s| {
            s.records.as_ref().unwrap().records_dir.as_deref()
                == Some(second_root.to_str().unwrap())
        });
        assert_eq!(rebound.project_dir, first.project_dir);
        assert_eq!(
            rebound.records.as_ref().unwrap().selection_sequence,
            first.records.as_ref().unwrap().selection_sequence
        );
        assert!(
            rebound.records.as_ref().unwrap().context_sequence
                > first.records.as_ref().unwrap().context_sequence
        );
        fs::rename(second_root.join("docs"), second_root.join("docs-retired")).unwrap();
        fs::create_dir(second_root.join("docs")).unwrap();
        fs::write(second_root.join("docs/record.md"), "private one").unwrap();
        let replaced = live.until(|s| {
            s.records.as_ref().unwrap().docs_incarnation
                != rebound.records.as_ref().unwrap().docs_incarnation
        });
        assert_eq!(text(&replaced), text(&rebound));
        fs::write(second_root.join("docs/record.md"), "after replacement").unwrap();
        live.until(|s| text(s) == Some("after replacement"));
    }

    #[test]
    fn whole_records_root_loss_foreign_reappearance_and_positive_recovery() {
        let fx = Fixture::new();
        let live = Live::new(Some(fx.product.clone()));
        let first = live.read();
        let parked = fx.root.join("retired-records");
        fs::rename(&fx.records, &parked).unwrap();
        let missing = live.until(|s| s.records.as_ref().unwrap().availability == "unavailable");
        assert_eq!(missing.project_dir, first.project_dir);
        assert!(missing.files.is_empty());
        repository(&fx.records, "foreign.txt");
        fs::write(fx.records.join("docs/record.md"), "FOREIGN POISON").unwrap();
        let refused = live.read();
        assert_eq!(
            refused.records.as_ref().unwrap().availability,
            "unavailable"
        );
        assert!(refused.files.is_empty());
        fs::remove_dir_all(&fx.records).unwrap();
        fs::rename(&parked, &fx.records).unwrap();
        let recovered = live.until(|s| {
            s.records.as_ref().unwrap().availability == "available"
                && text(s) == Some("private one")
        });
        assert!(
            recovered.records.as_ref().unwrap().context_sequence
                > first.records.as_ref().unwrap().context_sequence
        );
        fs::write(fx.records.join("docs/record.md"), "recovered watch").unwrap();
        live.until(|s| text(s) == Some("recovered watch"));
    }

    #[test]
    fn explicit_broken_binding_selects_product_without_product_docs_fallback() {
        let fx = Fixture::new();
        fs::write(fx.product.join(".supertaskr/workspace.json"), "malformed").unwrap();
        let live = Live::new(None);
        let selected = live.pick(&fx.product);
        assert_eq!(live.state.project_dir(), Some(fx.product.clone()));
        assert_eq!(
            selected.records.as_ref().unwrap().availability,
            "unavailable"
        );
        assert!(selected.files.is_empty());
        assert!(selected
            .records
            .as_ref()
            .unwrap()
            .finding
            .as_ref()
            .unwrap()
            .contains("binding-malformed"));
        fx.bind(&fx.records);
        live.until(|s| text(s) == Some("private one"));
    }

    #[test]
    fn legacy_non_git_folder_requires_affirmative_absence() {
        let fx = Fixture::new();
        let folder = fx.root.join("legacy-folder");
        fs::create_dir_all(folder.join("docs")).unwrap();
        fs::write(folder.join("docs/record.md"), "legacy").unwrap();
        let live = Live::new(None);
        let selected = live.pick(&folder);
        assert_eq!(text(&selected), Some("legacy"));
        assert_eq!(selected.records.as_ref().unwrap().layout, "colocated");
        fs::create_dir(folder.join(".supertaskr")).unwrap();
        fs::write(folder.join(".supertaskr/workspace.json"), "malformed").unwrap();
        assert_eq!(
            live.read().records.as_ref().unwrap().availability,
            "unavailable"
        );
    }

    #[test]
    fn precommit_candidate_disconnect_and_late_cleanup_cannot_change_newer_selection() {
        let a = Fixture::new();
        let b = Fixture::new();
        let c = Fixture::new();
        let live = Live::new(Some(a.product.clone()));
        let before = live.read();
        let gate = Arc::new(SelectionGate::new());
        let (prepared, ready) = mpsc::channel();
        let (completed, response) = mpsc::channel();
        live.state
            .ctl
            .send(WatchCtl::Select {
                product: b.product.clone(),
                gate: gate.clone(),
                prepared,
                completed,
            })
            .unwrap();
        ready.recv_timeout(Duration::from_secs(3)).unwrap().unwrap();
        fs::write(b.records.join("docs/record.md"), "candidate before commit").unwrap();
        assert!(
            live.events.try_recv().is_err(),
            "candidate cannot publish before the native commit"
        );
        assert!(gate.cancel_or_committed().is_none());
        drop(response);
        let selected_c = live.pick(&c.product);
        assert_eq!(live.state.project_dir(), Some(c.product.clone()));
        assert!(selected_c.seq > before.seq);
        // An obsolete cancellation consults only its own gate.
        assert!(gate.cancel_or_committed().is_none());
        fs::write(c.records.join("docs/record.md"), "newer C").unwrap();
        let changed = live.until(|s| text(s) == Some("newer C"));
        assert_eq!(changed.project_dir, c.product.display().to_string());
    }

    #[test]
    fn response_loss_after_commit_reconciles_authoritative_selection() {
        let a = Fixture::new();
        let b = Fixture::new();
        let live = Live::new(Some(a.product.clone()));
        let gate = Arc::new(SelectionGate::new());
        let (prepared, ready) = mpsc::channel();
        let (completed, response) = mpsc::channel();
        live.state
            .ctl
            .send(WatchCtl::Select {
                product: b.product.clone(),
                gate: gate.clone(),
                prepared,
                completed,
            })
            .unwrap();
        ready.recv_timeout(Duration::from_secs(3)).unwrap().unwrap();
        *gate.decision.lock().unwrap() = Decision::Commit;
        gate.changed.notify_one();
        drop(response);
        let authoritative = live.read();
        assert_eq!(authoritative.project_dir, b.product.display().to_string());
        let original = gate
            .cancel_or_committed()
            .expect("actual commit survives response loss");
        assert_eq!(original.project_dir, authoritative.project_dir);
        assert_eq!(
            original.records.as_ref().unwrap().selection_sequence,
            authoritative.records.as_ref().unwrap().selection_sequence
        );
    }

    #[test]
    fn public_status_timeout_keeps_committed_context_and_recovers_with_real_file_event() {
        let fx = Fixture::new();
        let c = Fixture::new();
        let live = Live::new(Some(fx.product.clone()));
        let before = live.read();
        let release = live.pause();
        // Exercise the same public status + wrapper path as docs_snapshot,
        // paying the actual production timeout without changing its bound.
        let response = live.state.scoped_status(project_status(&live.state));
        let failed = match &response.outcome {
            ProjectStatus::Open { snapshot } => snapshot,
            other => panic!("expected selected observation failure: {other:?}"),
        };
        let failed_records = failed.records.as_ref().unwrap();
        let previous_records = before.records.as_ref().unwrap();
        assert_eq!(failed_records.availability, "unavailable");
        assert_eq!(
            failed_records.selection_sequence,
            previous_records.selection_sequence
        );
        assert_eq!(
            failed_records.context_sequence,
            previous_records.context_sequence
        );
        assert_eq!(
            serde_json::to_value(&response.scope.records).unwrap(),
            serde_json::to_value(&failed.records).unwrap()
        );
        assert_eq!(
            live.state
                .selected
                .as_ref()
                .unwrap()
                .get()
                .unwrap()
                .availability,
            "available"
        );
        release.send(()).unwrap();
        let healthy = live.read();
        assert!(healthy.seq > failed.seq);
        assert_eq!(
            healthy.records.as_ref().unwrap().selection_sequence,
            failed_records.selection_sequence
        );
        assert_eq!(healthy.records.as_ref().unwrap().availability, "available");
        fs::write(
            fx.records.join("docs/record.md"),
            "healthy after status timeout",
        )
        .unwrap();
        let changed = live.until(|snapshot| text(snapshot) == Some("healthy after status timeout"));
        assert!(changed.seq > failed.seq);
        assert_eq!(
            changed.records.as_ref().unwrap().selection_sequence,
            failed_records.selection_sequence
        );
        let committed_c = live.pick(&c.product);
        assert!(committed_c.seq > failed.seq);
        let late_a = live.state.scoped_status(ProjectStatus::Open {
            snapshot: failed.clone(),
        });
        assert_eq!(
            late_a.scope.selection_sequence,
            failed_records.selection_sequence
        );
        assert_ne!(
            late_a.scope.selection_sequence,
            committed_c.records.as_ref().unwrap().selection_sequence
        );
    }

    #[test]
    fn public_status_failure_before_any_commit_is_visible_without_fabricating_selection() {
        let state = WatchState::start(None, |_| {});
        let (ack, stopped) = mpsc::channel();
        state.ctl.send(WatchCtl::Stop { ack }).unwrap();
        stopped.recv_timeout(Duration::from_secs(2)).unwrap();
        let response = state.scoped_status(project_status(&state));
        assert!(matches!(
            response.outcome,
            ProjectStatus::Unavailable { .. }
        ));
        assert_eq!(response.scope.selection_sequence, 0);
        assert!(response.scope.records.is_none());
        assert!(state.project_dir().is_none());
    }

    #[test]
    fn public_genesis_timeout_cancels_queued_candidate_and_preserves_a_then_c_watch() {
        let a = Fixture::new();
        let c = Fixture::new();
        let b = a.root.join("uncommitted-genesis-b");
        fs::create_dir(&b).unwrap();
        let live = Live::new(Some(a.product.clone()));
        let before = live.read();
        let release = live.pause();
        let outcome = apply_genesis_folder(&live.state, &b, live.state.begin_pick().unwrap());
        assert!(
            matches!(outcome, PickOutcome::Error { ref message, .. } if message.contains("timed out"))
        );
        assert_eq!(live.state.project_dir(), Some(a.product.clone()));
        release.send(()).unwrap();
        let recovered = live.read();
        assert_eq!(
            recovered.records.as_ref().unwrap().selection_sequence,
            before.records.as_ref().unwrap().selection_sequence
        );
        fs::write(
            a.records.join("docs/record.md"),
            "A still observed after B timeout",
        )
        .unwrap();
        live.until(|snapshot| text(snapshot) == Some("A still observed after B timeout"));
        let selected_c = live.pick(&c.product);
        // A late legacy request cannot install B over the newer managed C.
        let (ack, answer) = mpsc::channel();
        live.state
            .ctl
            .send(WatchCtl::ArmGenesis { root: b, ack })
            .unwrap();
        assert!(answer
            .recv_timeout(Duration::from_secs(2))
            .unwrap()
            .is_err());
        assert_eq!(
            live.read().records.as_ref().unwrap().selection_sequence,
            selected_c.records.as_ref().unwrap().selection_sequence
        );
        fs::write(
            c.records.join("docs/record.md"),
            "C still observed after late B",
        )
        .unwrap();
        let changed =
            live.until(|snapshot| text(snapshot) == Some("C still observed after late B"));
        assert_eq!(changed.project_dir, c.product.display().to_string());
    }

    #[test]
    fn managed_docsless_genesis_commits_only_with_sentinel_and_observes_first_docs() {
        let fx = Fixture::new();
        let folder = fx.root.join("legacy-genesis");
        fs::create_dir(&folder).unwrap();
        let live = Live::new(Some(fx.product.clone()));
        let outcome = apply_genesis_folder(&live.state, &folder, live.state.begin_pick().unwrap());
        let response = live.state.scoped_pick(outcome, live.state.message_scope());
        let stamp = match response.outcome {
            PickOutcome::Genesis {
                seq,
                snapshot: None,
                ..
            } => seq,
            other => panic!("expected docs-less managed genesis: {other:?}"),
        };
        assert_eq!(response.scope.selection_sequence, stamp);
        assert_eq!(
            response.scope.records.as_ref().unwrap().availability,
            "noDocs"
        );
        fs::create_dir(folder.join("docs")).unwrap();
        fs::write(folder.join("docs/record.md"), "first genesis records").unwrap();
        let appeared = live.until(|snapshot| text(snapshot) == Some("first genesis records"));
        assert_eq!(appeared.records.as_ref().unwrap().selection_sequence, stamp);
        assert_eq!(appeared.project_dir, folder.display().to_string());
    }
}
