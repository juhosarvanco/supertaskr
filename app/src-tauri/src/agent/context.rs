//! Original genesis locations and physical provenance. The watcher and existing
//! workspace resolver select the locations; a webview supplies only correlation.
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::docs_watch::{MessageScope, PickInFlight, WatchState};
use crate::workspace::{Layout, WorkspaceMode, WorkspaceResolver};

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ExpectedContext {
    pub selection_sequence: u64,
    pub context_sequence: u64,
}
impl ExpectedContext {
    pub fn matches(self, scope: &MessageScope) -> bool {
        self.selection_sequence == scope.selection_sequence
            && self.context_sequence == scope.context_sequence
    }
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DirectoryIdentity {
    path: PathBuf,
    device: String,
    inode: String,
}
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RepositoryIdentity {
    root: DirectoryIdentity,
    git_directory: Option<DirectoryIdentity>,
    common_directory: Option<DirectoryIdentity>,
}
/// Stable persisted session provenance deliberately excludes transient watcher
/// sequences and current commits. A legitimate bank may advance either history.
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SessionOrigin {
    version: u8,
    layout: String,
    association_id: Option<String>,
    product: RepositoryIdentity,
    records: RepositoryIdentity,
    docs: Option<DirectoryIdentity>,
    runtime: Option<DirectoryIdentity>,
}
/// Exact original accepted setup facts. Current bank bases are deliberately
/// separate: legitimate PRODUCT or RECORDS commits do not rewrite this receipt.
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct InitializationReceipt {
    pub operation_id: String,
    pub request_digest: String,
    pub receipt_digest: String,
    pub project_id: String,
    pub product_revision: String,
    pub records_revision: String,
}
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct GenesisSession {
    pub id: String,
    pub origin: SessionOrigin,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub planner: Option<super::planner::PlannerSession>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub setup: Option<InitializationReceipt>,
}
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TranscriptOrigin {
    pub session_id: String,
    pub origin_digest: String,
}
#[derive(Clone, Debug)]
pub struct GenesisContext {
    pub product: PathBuf,
    pub records: PathBuf,
    pub origin: SessionOrigin,
    pub scope: MessageScope,
}
pub struct PreparedContext {
    pub context: GenesisContext,
    pub selection: PickInFlight,
}
#[derive(Clone, Debug)]
pub(crate) struct InitializedSetup {
    pub original: InitializationReceipt,
    pub setup_id: String,
    pub request_digest: String,
    pub receipt_digest: String,
    pub product_revision: String,
    pub records_revision: String,
    pub settings: serde_json::Value,
    pub planner: super::planner::Decision,
    pub pristine_seed: bool,
}
/// A native-picked, inspected workspace before selection. It has no watcher
/// sequence, activation or webview authority. Final Select supplies those.
#[derive(Clone, Debug)]
pub(crate) struct InitializedCandidate {
    product: PathBuf,
    records: PathBuf,
    origin: SessionOrigin,
    pub setup: InitializedSetup,
}
fn current_split_origin(product: &Path) -> Result<(PathBuf, PathBuf, SessionOrigin), String> {
    let resolver = WorkspaceResolver::new().map_err(|error| error.to_string())?;
    let workspace = resolver.resolve_workspace(product, WorkspaceMode::Development, "HEAD").map_err(|error| error.to_string())?;
    if workspace.layout() != Layout::Split { return Err("genesis-initialized-split-required".into()); }
    let product = workspace.product_root().to_path_buf();
    let records = workspace.records_root().to_path_buf();
    let origin = SessionOrigin { version:1, layout:"split".into(), association_id:workspace.association().project_id.clone(),
        product:repository(&resolver,&product,true)?, records:repository(&resolver,&records,true)?,
        docs:Some(directory(&records.join("docs"))?), runtime:Some(directory(&product.join(".supertaskr"))?) };
    Ok((product, records, origin))
}
impl InitializedCandidate {
    pub(crate) fn capture(product: &Path, value: &serde_json::Value) -> Result<Self, String> {
        let (product, records, origin) = current_split_origin(product)?;
        let setup = admit_initialization(&product, &records, &origin, value)?;
        let candidate = Self { product, records, origin, setup };
        candidate.verify()?;
        Ok(candidate)
    }
    pub(crate) fn product(&self) -> &Path { &self.product }
    pub(crate) fn verify(&self) -> Result<(), String> {
        let (product, records, origin) = current_split_origin(&self.product)?;
        if product != self.product || records != self.records || origin != self.origin {
            return Err("genesis-initialization-origin-changed".into());
        }
        let resolver = WorkspaceResolver::new().map_err(|error| error.to_string())?;
        if resolver.measure_product_identity(&product,"HEAD").map_err(|error| error.to_string())?.selected_commit.as_deref() != Some(self.setup.product_revision.as_str())
            || resolver.measure_product_identity(&records,"HEAD").map_err(|error| error.to_string())?.selected_commit.as_deref() != Some(self.setup.records_revision.as_str()) {
            return Err("genesis-initialization-current-changed".into());
        }
        if current_split_origin(&self.product)? != (product, records, origin) {
            return Err("genesis-initialization-origin-changed".into());
        }
        Ok(())
    }
    pub(crate) fn verify_observation(&self, product: &Path, observed: &crate::docs_watch::RecordsObservation) -> Result<(), String> {
        let incarnation = |identity: &DirectoryIdentity| format!("{}:{}",identity.device,identity.inode);
        if product != self.product || observed.layout != "split" || observed.availability != "available"
            || observed.records_dir.as_deref() != Some(self.records.to_string_lossy().as_ref())
            || observed.association_id != self.origin.association_id
            || observed.root_incarnation.as_deref() != Some(incarnation(&self.origin.records.root).as_str())
            || observed.docs_incarnation != self.origin.docs.as_ref().map(incarnation) {
            return Err("genesis-initialization-origin-changed".into());
        }
        self.verify()
    }
}
#[derive(Clone, Copy)]
pub enum RuntimeRecord {
    Sessions,
    Transcript,
}
impl PreparedContext {
    pub fn capture(watch: &WatchState, expected: Option<ExpectedContext>) -> Result<Self, String> {
        let selection = watch.begin_pick().ok_or("genesis-selection-busy")?;
        if watch.message_scope().records.is_some() && expected.is_none() {
            return Err("genesis-selection-context-required".into());
        }
        let context = GenesisContext::capture(watch, expected)?;
        Ok(Self { context, selection })
    }
}

fn session_id_valid(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 128
        && id
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"._-".contains(&byte))
}
impl GenesisSession {
    pub fn new(context: &GenesisContext) -> Self {
        use std::sync::atomic::{AtomicU64, Ordering};
        static NEXT: AtomicU64 = AtomicU64::new(0);
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        Self {
            id: format!(
                "genesis-{}-{nanos}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::SeqCst)
            ),
            origin: context.origin.clone(),
            planner: None,
            setup: None,
        }
    }
    pub fn matches(&self, context: &GenesisContext) -> bool {
        session_id_valid(&self.id) && self.origin == context.origin
    }
    pub fn transcript_origin(&self) -> TranscriptOrigin {
        TranscriptOrigin {
            session_id: self.id.clone(),
            origin_digest: self.origin.fingerprint(),
        }
    }
}
impl SessionOrigin {
    pub fn fingerprint(&self) -> String {
        let value = serde_json::to_value(self).expect("finite session origin");
        format!(
            "sha256:{}",
            super::skills::sha256_hex(
                &serde_json::to_vec(&value).expect("canonical session origin")
            )
        )
    }
}
impl TranscriptOrigin {
    pub fn matches(&self, context: &GenesisContext) -> bool {
        session_id_valid(&self.session_id) && self.origin_digest == context.fingerprint()
    }
}

fn directory(path: &Path) -> Result<DirectoryIdentity, String> {
    let metadata =
        std::fs::symlink_metadata(path).map_err(|_| "genesis-original-home-unavailable")?;
    if metadata.file_type().is_symlink() || !metadata.is_dir() {
        return Err("genesis-original-home-unavailable".into());
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        Ok(DirectoryIdentity {
            path: path.to_path_buf(),
            device: metadata.dev().to_string(),
            inode: metadata.ino().to_string(),
        })
    }
    #[cfg(not(unix))]
    {
        Err("genesis-physical-identity-unsupported".into())
    }
}
fn repository(
    resolver: &WorkspaceResolver<'_>,
    root: &Path,
    split: bool,
) -> Result<RepositoryIdentity, String> {
    let identity = directory(root)?;
    let controls = if split {
        Some(
            resolver
                .repository_control_roots(root)
                .map_err(|error| error.to_string())?,
        )
    } else {
        None
    };
    Ok(RepositoryIdentity {
        root: identity,
        git_directory: controls
            .as_ref()
            .map(|paths| directory(&paths[0]))
            .transpose()?,
        common_directory: controls
            .as_ref()
            .map(|paths| directory(&paths[1]))
            .transpose()?,
    })
}
fn selected_same(a: &MessageScope, b: &MessageScope) -> bool {
    a.project_dir == b.project_dir
        && a.selection_sequence == b.selection_sequence
        && a.context_sequence == b.context_sequence
        && a.records.as_ref().map(|r| {
            (
                &r.layout,
                &r.records_dir,
                &r.association_id,
                &r.root_incarnation,
                &r.docs_incarnation,
                &r.availability,
            )
        }) == b.records.as_ref().map(|r| {
            (
                &r.layout,
                &r.records_dir,
                &r.association_id,
                &r.root_incarnation,
                &r.docs_incarnation,
                &r.availability,
            )
        })
}

fn admit_initialization(product: &Path, records: &Path, origin: &SessionOrigin, value: &serde_json::Value) -> Result<InitializedSetup, String> {
    verify_original_paths(product, records, origin)?;
    let current = &value["current"];
    let as_value = |identity: &DirectoryIdentity| serde_json::to_value(identity).ok();
    let repository_matches = |expected: &RepositoryIdentity, observed: &serde_json::Value| {
        let identities = observed["identities"].as_array();
        let Some(identities) = identities.filter(|rows| rows.len() == 4) else { return false; };
        let (Some(git), Some(common)) = (&expected.git_directory, &expected.common_directory) else { return false; };
        observed["root"].as_str().map(Path::new) == Some(expected.root.path.as_path())
            && observed["gitDir"].as_str().map(Path::new) == Some(git.path.as_path())
            && observed["commonDir"].as_str().map(Path::new) == Some(common.path.as_path())
            && as_value(&expected.root).as_ref() == Some(&identities[0])
            && as_value(git).as_ref() == Some(&identities[1])
            && as_value(common).as_ref() == Some(&identities[2])
            && directory(&common.path.join("objects")).ok().and_then(|fact| as_value(&fact)).as_ref() == Some(&identities[3])
    };
    if origin.layout != "split"
        || value["status"] != "current"
        || value["installation"]["runtimeKit"] != "verified"
        || !repository_matches(&origin.product, &current["product"])
        || !repository_matches(&origin.records, &current["records"])
        || origin.docs.as_ref().and_then(as_value).as_ref() != Some(&current["docs"])
        || origin.runtime.as_ref().and_then(as_value).as_ref() != Some(&current["runtime"])
        || current["association"]["projectId"].as_str() != origin.association_id.as_deref()
    {
        return Err("genesis-initialization-origin-changed".into());
    }
    let string = |at: &serde_json::Value| at.as_str().map(str::to_owned).ok_or_else(|| "genesis-initialization-response-unavailable".to_string());
    let setup_id = string(&value["receipt"]["operationId"])?;
    let request_digest = string(&value["receipt"]["requestDigest"])?;
    let receipt_digest = string(&value["receipt"]["receiptDigest"])?;
    let original_product_revision = string(&value["receipt"]["product"]["commit"])?;
    let original_records_revision = string(&value["receipt"]["records"]["commit"])?;
    let product_revision = string(&current["productRevision"])?;
    let records_revision = string(&current["recordsRevision"])?;
    let digest = |text: &str| text.strip_prefix("sha256:").is_some_and(|hex| hex.len() == 64 && hex.bytes().all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase()));
    let oid = |text: &str| [40, 64].contains(&text.len()) && text.bytes().all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase());
    if !session_id_valid(&setup_id) || !digest(&request_digest) || !digest(&receipt_digest)
        || !oid(&product_revision) || !oid(&records_revision)
        || !oid(&original_product_revision) || !oid(&original_records_revision)
        || value["receipt"]["status"] != "initialized"
        || value["receipt"]["projectId"].as_str() != origin.association_id.as_deref()
        || value["receipt"]["product"]["root"].as_str().map(Path::new) != Some(product)
        || value["receipt"]["records"]["root"].as_str().map(Path::new) != Some(records)
        || !value["settings"].is_object()
        || value["settingsProvenance"]["kind"] != "committed"
        || value["settingsProvenance"]["productRoot"].as_str().map(Path::new) != Some(product)
        || value["settingsProvenance"]["productRevision"].as_str() != Some(product_revision.as_str())
    {
        return Err("genesis-initialization-response-unavailable".into());
    }
    if value["settingsProvenance"]["tool"]["methodVersion"].as_str() != Some(super::kit::METHOD_SNAPSHOT_VERSION) {
        return Err("genesis-method-update-required".into());
    }
    verify_original_paths(product, records, origin)?;
    let planner = super::planner::Decision::from_observation(value)?;
    let pristine_seed = value["planning"]["pristineSeed"].as_bool().ok_or("genesis-initialization-response-unavailable")?;
    let original = InitializationReceipt { operation_id: setup_id.clone(), request_digest: request_digest.clone(),
        receipt_digest: receipt_digest.clone(), project_id: origin.association_id.clone().ok_or("genesis-initialization-response-unavailable")?,
        product_revision: original_product_revision, records_revision: original_records_revision };
    Ok(InitializedSetup { original, setup_id, request_digest, receipt_digest, product_revision, records_revision, settings: value["settings"].clone(), planner, pristine_seed })
}

fn verify_original_paths(product: &Path, records: &Path, origin: &SessionOrigin) -> Result<(), String> {
    let resolver = WorkspaceResolver::new().map_err(|error| error.to_string())?;
    if repository(&resolver, product, origin.layout == "split")? != origin.product
        || repository(&resolver, records, origin.layout == "split")? != origin.records
        || origin
            .docs
            .as_ref()
            .map(|identity| directory(&identity.path))
            .transpose()?
            != origin.docs
        || origin
            .runtime
            .as_ref()
            .map(|identity| directory(&identity.path))
            .transpose()?
            != origin.runtime
    {
        return Err("genesis-original-home-changed".into());
    }
    Ok(())
}

impl GenesisContext {
    /// Caller must acquire the existing picker latch before this capture and
    /// retain it until its finite writes and actual spawn boundary are complete.
    /// `None` exists only for the legacy direct embedding seam. Production IPC
    /// requires the path-free expected context from the initiating UI request.
    pub fn capture(watch: &WatchState, expected: Option<ExpectedContext>) -> Result<Self, String> {
        let scope = watch.message_scope();
        if expected.is_some_and(|value| !value.matches(&scope)) {
            return Err("genesis-selection-changed".into());
        }
        let product = watch.project_dir().ok_or("genesis-no-project")?;
        if scope.project_dir.as_deref() != Some(product.to_string_lossy().as_ref()) {
            return Err("genesis-selection-changed".into());
        }
        let resolver = WorkspaceResolver::new().map_err(|error| error.to_string())?;
        let explicit = resolver
            .workspace_binding_present(&product)
            .map_err(|error| error.to_string())?;
        let (product, records, association_id) = if explicit {
            let selected = scope
                .records
                .as_ref()
                .ok_or("genesis-records-unavailable")?;
            if selected.layout != "split" || selected.availability != "available" {
                return Err("genesis-records-unavailable".into());
            }
            let workspace = resolver
                .resolve_workspace(&product, WorkspaceMode::Development, "HEAD")
                .map_err(|error| error.to_string())?;
            if workspace.layout() != Layout::Split
                || selected.records_dir.as_deref()
                    != Some(workspace.records_root().to_string_lossy().as_ref())
                || selected.association_id != workspace.association().project_id
            {
                return Err("genesis-selection-changed".into());
            }
            (
                workspace.product_root().to_path_buf(),
                workspace.records_root().to_path_buf(),
                selected.association_id.clone(),
            )
        } else {
            // Only affirmative binding absence preserves the old plain-folder
            // embedding behavior. It introduces no blanket Git/HEAD requirement.
            let canonical = product
                .canonicalize()
                .map_err(|_| "genesis-original-home-unavailable")?;
            if scope.records.as_ref().is_some_and(|selected| {
                selected.layout != "colocated"
                    || selected.records_dir.as_deref() != Some(canonical.to_string_lossy().as_ref())
            }) {
                return Err("genesis-selection-changed".into());
            }
            (canonical.clone(), canonical, None)
        };
        let docs_path = records.join("docs");
        let docs = if explicit {
            Some(directory(&docs_path)?)
        } else {
            None
        };
        let origin = SessionOrigin {
            version: 1,
            layout: if explicit { "split" } else { "colocated" }.into(),
            association_id,
            product: repository(&resolver, &product, explicit)?,
            records: repository(&resolver, &records, explicit)?,
            docs,
            runtime: if explicit {
                Some(directory(&product.join(".supertaskr"))?)
            } else {
                None
            },
        };
        if explicit {
            let selected = scope.records.as_ref().unwrap();
            let incarnation =
                |identity: &DirectoryIdentity| format!("{}:{}", identity.device, identity.inode);
            if selected.root_incarnation.as_deref()
                != Some(incarnation(&origin.records.root).as_str())
                || selected.docs_incarnation != origin.docs.as_ref().map(incarnation)
            {
                return Err("genesis-selection-changed".into());
            }
        }
        if !selected_same(&scope, &watch.message_scope()) {
            return Err("genesis-selection-changed".into());
        }
        Ok(Self {
            product,
            records,
            origin,
            scope,
        })
    }
    pub fn expected(&self) -> ExpectedContext {
        ExpectedContext {
            selection_sequence: self.scope.selection_sequence,
            context_sequence: self.scope.context_sequence,
        }
    }
    pub fn verify(&self, watch: &WatchState) -> Result<(), String> {
        let current = Self::capture(watch, Some(self.expected()))?;
        if current.origin != self.origin || !selected_same(&self.scope, &current.scope) {
            return Err("genesis-selection-changed".into());
        }
        Ok(())
    }
    pub fn split(&self) -> bool {
        self.origin.layout == "split"
    }
    /// Admit the installed service's current read against this original native
    /// observation. Backend paths stay here; they never become webview routing.
    pub(crate) fn initialization_observation(&self, value: &serde_json::Value) -> Result<InitializedSetup, String> {
        admit_initialization(&self.product, &self.records, &self.origin, value)
    }
    pub fn fingerprint(&self) -> String {
        self.origin.fingerprint()
    }
    /// Original callbacks may settle their own runtime record after navigation.
    /// They revalidate the captured physical homes, not a successor binding.
    pub fn verify_original(&self) -> Result<(), String> {
        verify_original_paths(&self.product, &self.records, &self.origin)
    }
    /// Only the two existing native runtime records are named here. No caller
    /// path crosses IPC, and this does not grant PRODUCT configuration writes.
    pub fn runtime_record(
        &self,
        record: RuntimeRecord,
        create_parents: bool,
    ) -> Result<PathBuf, String> {
        self.verify_original()?;
        let relative = match record {
            RuntimeRecord::Sessions => super::sessions::SESSIONS_REL,
            RuntimeRecord::Transcript => super::sessions::TRANSCRIPT_REL,
        };
        let names: Vec<_> = relative.split('/').collect();
        let mut target = self.product.clone();
        for (position, name) in names.iter().enumerate() {
            target.push(name);
            let last = position + 1 == names.len();
            match std::fs::symlink_metadata(&target) {
                Ok(metadata) => {
                    if metadata.file_type().is_symlink()
                        || (!last && !metadata.is_dir())
                        || (last && !metadata.is_file())
                    {
                        return Err("genesis-runtime-path-unavailable".into());
                    }
                    #[cfg(unix)]
                    if last {
                        use std::os::unix::fs::MetadataExt;
                        if metadata.nlink() != 1 {
                            return Err("genesis-runtime-path-unavailable".into());
                        }
                    }
                }
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                    if !last && create_parents {
                        self.verify_original()?;
                        std::fs::create_dir(&target)
                            .map_err(|_| "genesis-runtime-path-unavailable")?;
                    }
                }
                Err(_) => return Err("genesis-runtime-path-unavailable".into()),
            }
        }
        self.verify_original()?;
        Ok(target)
    }
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use crate::docs_watch::{apply_picked_folder, PickOutcome};
    use crate::workspace::{WORKSPACE_ASSOCIATION_REL_PATH, WORKSPACE_BINDING_REL_PATH};
    use std::fs;
    use std::process::Command;
    use std::sync::atomic::{AtomicU64, Ordering};

    static NEXT: AtomicU64 = AtomicU64::new(0);
    struct Fixture {
        home: PathBuf,
        product: PathBuf,
        records: PathBuf,
        other: PathBuf,
        watch: WatchState,
    }
    fn git(root: &Path, args: &[&str]) {
        let output = Command::new("git")
            .arg("-C")
            .arg(root)
            .args([
                "-c",
                "gc.auto=0",
                "-c",
                "maintenance.auto=false",
                "-c",
                "commit.gpgsign=false",
            ])
            .args(args)
            .output()
            .unwrap();
        assert!(
            output.status.success(),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );
    }
    impl Fixture {
        fn new() -> Self {
            let home = std::env::temp_dir().join(format!(
                "supertaskr-genesis-context-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::SeqCst)
            ));
            fs::create_dir(&home).unwrap();
            let home = home.canonicalize().unwrap();
            let product = home.join("code");
            let records = home.join("records");
            let other = home.join("records-other");
            for root in [&product, &records, &other] {
                fs::create_dir(root).unwrap();
                git(root, &["init", "-q", "--initial-branch=main"]);
                git(root, &["config", "user.name", "Genesis fixture"]);
                git(root, &["config", "user.email", "fixture@example.invalid"]);
                fs::create_dir(root.join("docs")).unwrap();
                fs::write(
                    root.join("docs/ROADMAP.md"),
                    "# Fixture roadmap\n\n## Milestones\n\nM1 — fixture.\n",
                )
                .unwrap();
                git(root, &["add", "."]);
                git(root, &["commit", "-qm", "Fixture root"]);
            }
            let resolver = WorkspaceResolver::new().unwrap();
            let identity = resolver.measure_product_identity(&product, "HEAD").unwrap();
            for root in [&records, &other] {
                fs::write(root.join(WORKSPACE_ASSOCIATION_REL_PATH), serde_json::json!({"version":1,"projectId":"genesis-fixture",
                    "product":{"objectFormat":identity.object_format,"rootCommits":identity.root_commits}}).to_string()).unwrap();
                git(root, &["add", "."]);
                git(root, &["commit", "-qm", "Association fixture"]);
            }
            let watch = WatchState::start(None, |_| {});
            let fixture = Self {
                home,
                product,
                records,
                other,
                watch,
            };
            fixture.bind(&fixture.records);
            fixture.pick();
            fixture
        }
        fn bind(&self, records: &Path) {
            fs::create_dir_all(self.product.join(".supertaskr")).unwrap();
            fs::write(
                self.product.join(WORKSPACE_BINDING_REL_PATH),
                serde_json::json!({"version":1,"projectId":"genesis-fixture",
                "productRoot":self.product,"recordsRoot":records})
                .to_string(),
            )
            .unwrap();
        }
        fn pick(&self) {
            let outcome = apply_picked_folder(&self.watch, &self.product, self.watch.begin_pick().unwrap());
            assert!(matches!(
                outcome,
                PickOutcome::Picked { .. }
            ), "authored context fixture pick returned {outcome:?}");
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            self.watch.stop_for_test();
            fs::remove_dir_all(&self.home).unwrap();
        }
    }

    fn controlled_initialization_observation(context: &GenesisContext) -> serde_json::Value {
        controlled_initialization_observation_parts(&context.product, &context.records, &context.origin)
    }
    fn controlled_initialization_observation_parts(product_root: &Path, records_root: &Path, origin: &SessionOrigin) -> serde_json::Value {
        let resolver = WorkspaceResolver::new().unwrap();
        let product = resolver.measure_product_identity(&product_root, "HEAD").unwrap();
        let records = resolver.measure_product_identity(&records_root, "HEAD").unwrap();
        let repository = |origin: &RepositoryIdentity, measured: &crate::workspace::ProductIdentity| {
            let git = origin.git_directory.as_ref().unwrap();
            let common = origin.common_directory.as_ref().unwrap();
            serde_json::json!({"root":origin.root.path,"gitDir":git.path,"commonDir":common.path,
                "objectFormat":measured.object_format,"rootCommits":measured.root_commits,
                "identities":[origin.root,git,common,directory(&common.path.join("objects")).unwrap()]})
        };
        // Controlled service-wire receipt. Original acceptance itself is owned
        // and tested by the actual Node service; this tests native admission.
        serde_json::json!({"status":"current","installation":{"runtimeKit":"verified"},"planning":{"pristineSeed":false},
            "receipt":{"status":"initialized","operationId":"init-controlled-wire","projectId":origin.association_id,
                "requestDigest":format!("sha256:{}","a".repeat(64)),"receiptDigest":format!("sha256:{}","b".repeat(64)),
                "product":{"root":product_root,"commit":product.selected_commit},"records":{"root":records_root,"commit":records.selected_commit}},
            "current":{"productRevision":product.selected_commit,"recordsRevision":records.selected_commit,
                "product":repository(&origin.product,&product),"records":repository(&origin.records,&records),
                "association":{"projectId":origin.association_id},"docs":origin.docs,"runtime":origin.runtime},
            "settings":{"version":1,"languages":[]},"settingsProvenance":{"kind":"committed","productRoot":product_root,
                "configDigest":format!("sha256:{}","c".repeat(64)),"productRevision":product.selected_commit,
                "tool":{"methodVersion":super::super::kit::METHOD_SNAPSHOT_VERSION,"manifestDigest":"d".repeat(64)}},
            "planner":{"status":"ready","selection":{"role":"planner","requested":"claude-opus-5@subagent","harness":"claude","model":"claude-opus-5","vehicle":"subagent",
                "sessionPolicy":{"default":"fresh","warnAfterTurns":30}},"provenance":{"configurationDigest":format!("sha256:{}","c".repeat(64)),
                "productRevision":product.selected_commit,"toolManifestDigest":"d".repeat(64)}}})
    }

    #[test]
    fn persisted_planner_selection_filters_original_records_before_resume_id_use() {
        use crate::agent::sessions::{self, SessionEntry};
        let fixture = Fixture::new();
        let original = GenesisContext::capture(&fixture.watch, None).unwrap();
        original.runtime_record(RuntimeRecord::Sessions, true).unwrap();
        let entry = |id: &str, genesis: Option<GenesisSession>| SessionEntry {
            id: id.into(), agent: "claude".into(), model: None, native_session_id: Some(format!("native-{id}")),
            created: sessions::iso8601_utc(0), turns: 1, tasks: vec![], roles: vec!["planner".into()],
            status: "idle".into(), skills: vec![], genesis,
        };
        sessions::upsert(&fixture.product, entry("S1", Some(GenesisSession::new(&original)))).unwrap();
        fixture.bind(&fixture.other); fixture.pick();
        let current = GenesisContext::capture(&fixture.watch, None).unwrap();
        assert!(sessions::genesis_record_for_context(&current).unwrap().is_none(), "R1 must not be offered as an R2 resume");
        sessions::upsert(&fixture.product, entry("S2", None)).unwrap();
        assert!(sessions::genesis_record_for_context(&current).unwrap().is_none(), "scope-less legacy registry data is not split provenance");
        sessions::upsert(&fixture.product, entry("S3", Some(GenesisSession::new(&current)))).unwrap();
        let file = fixture.product.join(sessions::SESSIONS_REL);
        let before = fs::read(&file).unwrap();
        assert_eq!(sessions::genesis_record_for_context(&current).unwrap().unwrap().registry_id, "S3");
        assert_eq!(sessions::genesis_record_for_context(&original).unwrap().unwrap().registry_id, "S1");
        assert_eq!(sessions::genesis_record(&fixture.product).unwrap().registry_id, "S1", "the direct legacy embedding seam retains its existing selection rule");
        assert_eq!(fs::read(&file).unwrap(), before);
    }

    #[test]
    fn initialization_wire_is_admitted_only_for_its_original_native_context_and_committed_settings() {
        let fixture = Fixture::new();
        let original = GenesisContext::capture(&fixture.watch, None).unwrap();
        let wire = controlled_initialization_observation(&original);
        let admitted = original.initialization_observation(&wire).unwrap();
        assert_eq!(admitted.setup_id, "init-controlled-wire");
        assert_eq!(admitted.product_revision, wire["current"]["productRevision"].as_str().unwrap());
        assert_eq!(admitted.records_revision, wire["current"]["recordsRevision"].as_str().unwrap());
        assert_eq!(admitted.settings["languages"], serde_json::json!([]));
        assert_eq!(admitted.planner.ready().unwrap().0.model, "claude-opus-5");
        let mut wrong_role = wire.clone(); wrong_role["planner"]["provenance"]["configurationDigest"] = format!("sha256:{}", "0".repeat(64)).into();
        assert_eq!(original.initialization_observation(&wrong_role).unwrap_err(), "genesis-planner-provenance-unavailable");
        let mut wrong_manifest = wire.clone(); wrong_manifest["planner"]["provenance"]["toolManifestDigest"] = format!("sha256:{}", "d".repeat(64)).into();
        wrong_manifest["settingsProvenance"]["tool"]["manifestDigest"] = wrong_manifest["planner"]["provenance"]["toolManifestDigest"].clone();
        assert_eq!(original.initialization_observation(&wrong_manifest).unwrap_err(), "genesis-planner-provenance-unavailable", "TOOL manifest hashes retain the canonical owner's bare-hex format");
        let mut unsupported_role = wire.clone(); unsupported_role["planner"] = serde_json::json!({"status":"cannot-run","code":3,"reason":"project-role-harness-unsupported","diagnostics":["Explicit supported planner required"]});
        assert!(original.initialization_observation(&unsupported_role).unwrap().planner.ready().is_err(), "current setup remains observable while its planner is unavailable");
        let mut working = wire.clone(); working["settingsProvenance"]["kind"] = "working".into();
        assert_eq!(original.initialization_observation(&working).unwrap_err(), "genesis-initialization-response-unavailable");
        let mut wrong_inode = wire.clone(); wrong_inode["current"]["docs"]["inode"] = "0".into();
        assert_eq!(original.initialization_observation(&wrong_inode).unwrap_err(), "genesis-initialization-origin-changed");
        let mut wrong_method = wire.clone(); wrong_method["settingsProvenance"]["tool"]["methodVersion"] = "another-method".into();
        assert_eq!(original.initialization_observation(&wrong_method).unwrap_err(), "genesis-method-update-required");
        fixture.bind(&fixture.other); fixture.pick();
        let successor = GenesisContext::capture(&fixture.watch, None).unwrap();
        assert_eq!(successor.initialization_observation(&wire).unwrap_err(), "genesis-initialization-origin-changed");
        assert!(successor.initialization_observation(&controlled_initialization_observation(&successor)).is_ok());
    }

    #[test]
    fn initialized_candidate_uses_current_physical_roots_and_exact_cuts_without_minting_a_selection() {
        let fixture=Fixture::new();let original=GenesisContext::capture(&fixture.watch,None).unwrap();
        let initial_scope=fixture.watch.message_scope();let wire=controlled_initialization_observation(&original);
        let candidate=InitializedCandidate::capture(&fixture.product,&wire).unwrap();
        candidate.verify_observation(&fixture.product,initial_scope.records.as_ref().unwrap()).unwrap();
        assert_eq!(fixture.watch.message_scope().selection_sequence,initial_scope.selection_sequence);
        let mut future=wire.clone();future["current"]["productRevision"]="0".repeat(40).into();future["settingsProvenance"]["productRevision"]="0".repeat(40).into();future["planner"]["provenance"]["productRevision"]="0".repeat(40).into();
        assert_eq!(InitializedCandidate::capture(&fixture.product,&future).unwrap_err(),"genesis-initialization-current-changed");
        fixture.bind(&fixture.other);
        assert!(candidate.verify().is_err());
        let (product,records,origin)=current_split_origin(&fixture.product).unwrap();
        let next_wire=controlled_initialization_observation_parts(&product,&records,&origin);
        let next=InitializedCandidate::capture(&fixture.product,&next_wire).unwrap();
        assert!(next.verify_observation(&fixture.product,initial_scope.records.as_ref().unwrap()).is_err());
        assert_eq!(fixture.watch.message_scope().selection_sequence,initial_scope.selection_sequence);
        fixture.pick();next.verify_observation(&fixture.product,fixture.watch.message_scope().records.as_ref().unwrap()).unwrap();
        assert!(fixture.watch.message_scope().selection_sequence>initial_scope.selection_sequence);
    }

    #[test]
    fn split_context_uses_actual_records_and_persists_physical_origin_without_transient_sequences()
    {
        let fixture = Fixture::new();
        let context = GenesisContext::capture(&fixture.watch, None).unwrap();
        assert_eq!(context.product, fixture.product);
        assert_eq!(context.records, fixture.records);
        assert!(context.split());
        assert!(context.origin.product.git_directory.is_some());
        assert!(context.origin.records.common_directory.is_some());
        let persisted = serde_json::to_string(&context.origin).unwrap();
        assert!(!persisted.contains("selectionSequence"));
        assert!(!persisted.contains("Revision"));
        assert_eq!(
            serde_json::from_str::<SessionOrigin>(&persisted).unwrap(),
            context.origin
        );
        fixture.pick();
        let reopened = GenesisContext::capture(&fixture.watch, None).unwrap();
        assert!(reopened.scope.selection_sequence > context.scope.selection_sequence);
        assert_eq!(reopened.origin, context.origin);
        assert_eq!(reopened.fingerprint(), context.fingerprint());
        assert!(reopened.fingerprint().starts_with("sha256:"));
        assert!(
            context.verify(&fixture.watch).is_err(),
            "stable session provenance must not erase activation ordering"
        );
        assert!(reopened.verify(&fixture.watch).is_ok());
    }

    #[test]
    fn same_product_new_records_refuses_original_request_and_session_but_admits_new_context() {
        let fixture = Fixture::new();
        let original = GenesisContext::capture(&fixture.watch, None).unwrap();
        fixture.bind(&fixture.other);
        fixture.pick();
        assert!(GenesisContext::capture(&fixture.watch, Some(original.expected())).is_err());
        assert!(original.verify(&fixture.watch).is_err());
        let successor = GenesisContext::capture(&fixture.watch, None).unwrap();
        assert_eq!(successor.product, original.product);
        assert_eq!(successor.records, fixture.other);
        assert_ne!(successor.origin, original.origin);
        assert_ne!(successor.fingerprint(), original.fingerprint());
        assert!(successor.verify(&fixture.watch).is_ok());
        assert!(
            original.verify_original().is_ok(),
            "navigation does not retarget or forbid the original runtime settlement"
        );
        assert_eq!(
            original
                .runtime_record(RuntimeRecord::Transcript, true)
                .unwrap(),
            fixture.product.join(super::super::sessions::TRANSCRIPT_REL)
        );
        assert!(!fixture.other.join(".supertaskr").exists());
        assert!(!GenesisSession::new(&original).matches(&successor));
        assert!(!fixture.product.join(".supertaskr/sessions.json").exists());
    }

    #[test]
    fn legitimate_setup_commits_do_not_rewrite_session_origin() {
        let fixture = Fixture::new();
        let original = GenesisContext::capture(&fixture.watch, None).unwrap();
        fs::write(
            fixture.product.join("supertaskr.yaml"),
            "# Explicit fixture configuration bank\n",
        )
        .unwrap();
        git(&fixture.product, &["add", "supertaskr.yaml"]);
        git(
            &fixture.product,
            &["commit", "-qm", "Local setup bank fixture"],
        );
        let advanced = GenesisContext::capture(&fixture.watch, Some(original.expected())).unwrap();
        assert_eq!(advanced.origin, original.origin);
        assert!(original.verify(&fixture.watch).is_ok());
    }

    #[test]
    fn removed_split_binding_cannot_relabel_an_old_request_as_colocated_before_revalidation() {
        let fixture = Fixture::new();
        let original = GenesisContext::capture(&fixture.watch, None).unwrap();
        // Ordinary FIFO scheduling control preserves the real committed scope
        // while the on-disk binding disappears, without rewriting authority.
        let release = fixture.watch.pause_for_test();
        let original_scope = original.scope.clone();
        fs::remove_file(fixture.product.join(WORKSPACE_BINDING_REL_PATH)).unwrap();
        assert_eq!(
            fixture.watch.message_scope().context_sequence,
            original_scope.context_sequence
        );
        assert!(
            matches!(GenesisContext::capture(&fixture.watch, Some(original.expected())), Err(ref code) if code == "genesis-selection-changed")
        );
        assert_eq!(
            fixture.watch.message_scope().records.unwrap().layout,
            "split"
        );
        release.send(()).unwrap();
        fixture.pick();
        let current = GenesisContext::capture(&fixture.watch, None).unwrap();
        assert!(!current.split());
        assert_eq!(current.records, fixture.product);
        assert!(current.scope.context_sequence > original_scope.context_sequence);
        assert!(current.verify(&fixture.watch).is_ok());
    }

    #[test]
    fn preparation_holds_the_existing_selection_latch_and_native_sessions_keep_original_correlation(
    ) {
        let fixture = Fixture::new();
        assert!(
            PreparedContext::capture(&fixture.watch, None).is_err(),
            "a managed effect requires the initiating UI context"
        );
        let captured = GenesisContext::capture(&fixture.watch, None).unwrap();
        let prepared = PreparedContext::capture(&fixture.watch, Some(captured.expected())).unwrap();
        assert!(fixture.watch.begin_pick().is_none());
        let first = GenesisSession::new(&prepared.context);
        let next = GenesisSession::new(&prepared.context);
        assert_ne!(first.id, next.id);
        assert!(first.matches(&prepared.context));
        assert!(first.transcript_origin().matches(&prepared.context));
        let mut invalid = first.clone();
        invalid.id = "../untrusted".into();
        assert!(!invalid.matches(&prepared.context));
        let expected = prepared.context.expected();
        drop(prepared);
        let latch = fixture
            .watch
            .begin_pick()
            .expect("original preparation released its own selection claim");
        drop(latch);
        fixture.pick();
        assert!(PreparedContext::capture(&fixture.watch, Some(expected)).is_err());
        assert!(
            fixture.watch.begin_pick().is_some(),
            "refused stale preparation must release its own claim"
        );
    }

    #[test]
    fn existing_runtime_records_keep_their_original_private_home_without_exposing_control_paths() {
        use super::super::sessions::{self, SessionEntry, TranscriptLine};
        let fixture = Fixture::new();
        let original = GenesisContext::capture(&fixture.watch, None).unwrap();
        let session = GenesisSession::new(&original);
        sessions::upsert(
            &fixture.product,
            SessionEntry {
                id: "S1".into(),
                agent: "claude".into(),
                model: None,
                native_session_id: Some("fixture-native-id".into()),
                created: sessions::iso8601_utc(0),
                turns: 1,
                tasks: vec![],
                roles: vec!["planner".into()],
                status: "idle".into(),
                skills: vec![],
                genesis: Some(session.clone()),
            },
        )
        .unwrap();
        sessions::append_transcript(
            &fixture.product,
            &TranscriptLine {
                turn: 2,
                role: "user".into(),
                text: "actual typed fixture bytes\n".into(),
                at_ms: 1,
                machine: false,
                genesis: Some(session.transcript_origin()),
            },
        )
        .unwrap();
        let record = sessions::genesis_record(&fixture.product).unwrap();
        assert_eq!(record.genesis, Some(session.clone()));
        let rendered = serde_json::to_string(&record).unwrap();
        assert!(!rendered.contains("gitDirectory"));
        assert!(
            !rendered.contains("genesis"),
            "native physical facts stay backend-only"
        );
        let captured = sessions::read_transcript_tail(&fixture.product, 1);
        assert_eq!(captured[0].text, "actual typed fixture bytes\n");
        assert!(captured[0].genesis.as_ref().unwrap().matches(&original));
        assert!(!serde_json::to_string(&captured)
            .unwrap()
            .contains("gitDirectory"));
        fixture.bind(&fixture.other);
        fixture.pick();
        let successor = GenesisContext::capture(&fixture.watch, None).unwrap();
        let unchanged = sessions::genesis_record(&fixture.product).unwrap();
        assert_eq!(unchanged.genesis, Some(session));
        assert!(!unchanged.genesis.as_ref().unwrap().matches(&successor));
        assert!(!captured[0].genesis.as_ref().unwrap().matches(&successor));
    }

    #[test]
    fn runtime_records_refuse_symlinked_descendants_and_foreign_hardlinked_files() {
        use std::os::unix::fs::symlink;
        let fixture = Fixture::new();
        let original = GenesisContext::capture(&fixture.watch, None).unwrap();
        let outside = fixture.home.join("outside");
        fs::create_dir(&outside).unwrap();
        symlink(&outside, fixture.product.join(".supertaskr/genesis")).unwrap();
        assert!(original
            .runtime_record(RuntimeRecord::Transcript, true)
            .is_err());
        assert!(!outside.join("transcript.jsonl").exists());
        fs::remove_file(fixture.product.join(".supertaskr/genesis")).unwrap();
        let foreign = outside.join("foreign.json");
        fs::write(&foreign, "foreign preimage\n").unwrap();
        fs::hard_link(
            &foreign,
            fixture.product.join(super::super::sessions::SESSIONS_REL),
        )
        .unwrap();
        assert!(original
            .runtime_record(RuntimeRecord::Sessions, true)
            .is_err());
        assert_eq!(fs::read_to_string(foreign).unwrap(), "foreign preimage\n");
    }

    #[test]
    fn replacing_the_product_runtime_directory_cannot_retarget_an_original_callback() {
        let fixture = Fixture::new();
        let original = GenesisContext::capture(&fixture.watch, None).unwrap();
        let retired = fixture.home.join("retired-runtime");
        fs::rename(fixture.product.join(".supertaskr"), &retired).unwrap();
        copy_directory(&retired, &fixture.product.join(".supertaskr"));
        assert!(original.verify_original().is_err());
        assert!(original
            .runtime_record(RuntimeRecord::Transcript, true)
            .is_err());
        assert!(!fixture
            .product
            .join(".supertaskr/genesis/transcript.jsonl")
            .exists());
        let current = GenesisContext::capture(&fixture.watch, None).unwrap();
        assert_ne!(current.fingerprint(), original.fingerprint());
        assert!(current
            .runtime_record(RuntimeRecord::Transcript, true)
            .is_ok());
    }

    fn copy_directory(from: &Path, to: &Path) {
        fs::create_dir(to).unwrap();
        for entry in fs::read_dir(from).unwrap() {
            let entry = entry.unwrap();
            let destination = to.join(entry.file_name());
            if entry.file_type().unwrap().is_dir() {
                copy_directory(&entry.path(), &destination);
            } else {
                fs::copy(entry.path(), destination).unwrap();
            }
        }
    }
    #[test]
    fn a_same_history_product_git_directory_replacement_is_not_the_original_session() {
        let fixture = Fixture::new();
        let original = GenesisContext::capture(&fixture.watch, None).unwrap();
        let retired = fixture.home.join("retired-product-git");
        fs::rename(fixture.product.join(".git"), &retired).unwrap();
        copy_directory(&retired, &fixture.product.join(".git"));
        assert!(original.verify(&fixture.watch).is_err());
        let current = GenesisContext::capture(&fixture.watch, None).unwrap();
        assert_ne!(
            original.origin.product.git_directory,
            current.origin.product.git_directory
        );
        assert!(current.verify(&fixture.watch).is_ok());
    }

    #[test]
    fn only_affirmative_binding_absence_keeps_plain_non_git_legacy_folder_behavior() {
        let home = std::env::temp_dir().join(format!(
            "supertaskr-genesis-legacy-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::SeqCst)
        ));
        fs::create_dir(&home).unwrap();
        let home = home.canonicalize().unwrap();
        let (sender, _receiver) = std::sync::mpsc::channel();
        let watch = WatchState::new(
            Some(home.clone()),
            std::sync::Arc::new(AtomicU64::new(0)),
            sender,
        );
        let original = GenesisContext::capture(&watch, None).unwrap();
        assert_eq!(original.product, original.records);
        assert!(!original.split());
        assert!(original.origin.docs.is_none());
        assert!(original.verify(&watch).is_ok());
        assert!(!home.join(".git").exists());
        fs::create_dir(home.join("docs")).unwrap();
        assert!(
            original.verify(&watch).is_ok(),
            "an original legacy planner may scaffold its own docs"
        );
        fs::remove_dir(home.join("docs")).unwrap();
        fs::create_dir(home.join(".supertaskr")).unwrap();
        fs::write(
            home.join(WORKSPACE_BINDING_REL_PATH),
            "malformed explicit binding",
        )
        .unwrap();
        assert!(GenesisContext::capture(&watch, None).is_err());
        assert!(!home.join("docs").exists());
        assert!(!home.join(".git").exists());
        fs::remove_dir_all(home).unwrap();
    }
}
