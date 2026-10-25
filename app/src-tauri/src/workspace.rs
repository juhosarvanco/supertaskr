//! Read-only workspace locations (T-347-s1). Association detects accidental
//! mismatches; it authenticates nobody and grants no writes or reservations.
//! No import/startup effects and no webview path-authority command.
use crate::churn::{resolve_git, ResolvedGit, WorkspaceGitQuery};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};
use std::fmt;
use std::fs::{self, Metadata};
use std::io;
use std::path::{Path, PathBuf};

pub const WORKSPACE_BINDING_REL_PATH: &str = ".supertaskr/workspace.json";
pub const WORKSPACE_ASSOCIATION_REL_PATH: &str = "workspace-association.json";
pub const WORKSPACE_LIMITATIONS: [&str; 4] = [
    "Association is accidental-mismatch detection, not authentication or owner authorization.",
    "Split orchestration, component expansion consumers, paired reservations and landing authority are not activated.",
    "Resource resolution grants no write ownership, modifies no fence and encodes no delivery route.",
    "The runtime location belongs to the selected product checkout; it is not a repository role or writable fence root.",
];

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RepositoryRole {
    Product,
    Records,
}
impl RepositoryRole {
    pub fn parse(value: &str) -> Result<Self> {
        match value {
            "product" => Ok(Self::Product),
            "records" => Ok(Self::Records),
            _ => Err(finding("resource-role-unknown", value)),
        }
    }
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Product => "product",
            Self::Records => "records",
        }
    }
}
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum WorkspaceMode {
    #[default]
    Development,
    ProductOnly,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Layout {
    Colocated,
    Split,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AssociationStatus {
    Unconfigured,
    Unverified,
    Verified,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ObjectFormat {
    Sha1,
    Sha256,
}
impl ObjectFormat {
    fn parse(value: &str, label: &str) -> Result<Self> {
        match value {
            "sha1" => Ok(Self::Sha1),
            "sha256" => Ok(Self::Sha256),
            _ => Err(finding(format!("{label}-object-format-unsupported"), value)),
        }
    }
    fn length(self) -> usize {
        match self {
            Self::Sha1 => 40,
            Self::Sha256 => 64,
        }
    }
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductIdentity {
    pub object_format: ObjectFormat,
    pub root_commits: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_commit: Option<String>,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssociationResult {
    pub status: AssociationStatus,
    pub source: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub binding_path: Option<PathBuf>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub product_identity: Option<ProductIdentity>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assurance: Option<String>,
}
/// Constructed by resolution, never a writable root/fence grant. Private fields
/// prevent callers manufacturing an unverified records root as a verified one.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    product_root: PathBuf,
    records_root: PathBuf,
    runtime_root: PathBuf,
    layout: Layout,
    mode: WorkspaceMode,
    association: AssociationResult,
    limitations: Vec<&'static str>,
}
impl Workspace {
    pub fn product_root(&self) -> &Path {
        &self.product_root
    }
    pub fn records_root(&self) -> &Path {
        &self.records_root
    }
    pub fn runtime_root(&self) -> &Path {
        &self.runtime_root
    }
    pub fn layout(&self) -> Layout {
        self.layout
    }
    pub fn mode(&self) -> WorkspaceMode {
        self.mode
    }
    pub fn association(&self) -> &AssociationResult {
        &self.association
    }
}
#[derive(Clone, Debug)]
pub struct ResourceRequest<'a> {
    pub role: Option<RepositoryRole>,
    pub path: &'a str,
    pub source: Option<&'a str>,
}
pub type LegacyTokenMap = BTreeMap<String, Vec<RepositoryRole>>;
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ResolutionRule {
    ExplicitRepositoryRole,
    ExplicitLegacyTokenMap,
}
impl ResolutionRule {
    fn as_str(self) -> &'static str {
        match self {
            Self::ExplicitRepositoryRole => "explicit-repository-role",
            Self::ExplicitLegacyTokenMap => "explicit-legacy-token-map",
        }
    }
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceLocation {
    pub key: String,
    pub role: RepositoryRole,
    pub relative_path: String,
    pub source: String,
    pub resolution_rule: ResolutionRule,
    pub root: PathBuf,
    pub absolute_path: PathBuf,
    pub physical_path: PathBuf,
    pub colocated_overlap: bool,
    pub authority: &'static str,
}
/// Named failures match the Node resolver. Codes are emitted only by this
/// module's finite operations, never by Git or an observer.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct WorkspaceFinding {
    pub code: String,
    pub detail: String,
}
impl fmt::Display for WorkspaceFinding {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}: {}", self.code, self.detail)
    }
}
impl std::error::Error for WorkspaceFinding {}
fn finding(code: impl Into<String>, detail: impl ToString) -> WorkspaceFinding {
    WorkspaceFinding {
        code: code.into(),
        detail: detail.to_string(),
    }
}
type Result<T> = std::result::Result<T, WorkspaceFinding>;

/// Observation/denial at the actual read and launch boundaries. This is not OS
/// isolation or another resolver: it receives no policy result and can only
/// allow the unchanged operation or return an I/O error. No environment switch.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AccessOperation {
    Metadata,
    Read,
    Canonicalize,
    Git,
}
pub trait AccessObserver {
    fn before(&self, operation: AccessOperation, path: &Path) -> io::Result<()>;
}
/// One fixed resolved executable for this resolver's lifetime. Every filesystem
/// read below goes through these three wrappers; Git goes through churn's actual
/// launch callback. No other fs/process entry points occur in this module.
pub struct WorkspaceResolver<'a> {
    git: ResolvedGit,
    observer: Option<&'a dyn AccessObserver>,
}
impl WorkspaceResolver<'static> {
    pub fn new() -> Result<Self> {
        Self::with_observer(None)
    }
}
impl<'a> WorkspaceResolver<'a> {
    pub fn with_observer(observer: Option<&'a dyn AccessObserver>) -> Result<Self> {
        let git = resolve_git()
            .ok_or_else(|| finding("product-repository-unavailable", "trusted Git unavailable"))?;
        Ok(Self { git, observer })
    }
    fn before(&self, operation: AccessOperation, path: &Path) -> io::Result<()> {
        match self.observer {
            Some(observer) => observer.before(operation, path),
            None => Ok(()),
        }
    }
    fn stat(&self, path: &Path, label: &str) -> Result<Option<Metadata>> {
        // Only the filesystem can establish absence. An observer denial,
        // including NotFound, must never manufacture a missing binding.
        self.before(AccessOperation::Metadata, path)
            .map_err(|err| finding(format!("{label}-unreadable"), err))?;
        match fs::symlink_metadata(path) {
            Ok(stat) => Ok(Some(stat)),
            Err(err) if err.kind() == io::ErrorKind::NotFound => Ok(None),
            Err(err) => Err(finding(format!("{label}-unreadable"), err)),
        }
    }
    fn canonical(&self, path: &Path, code: &str) -> Result<PathBuf> {
        self.before(AccessOperation::Canonicalize, path)
            .and_then(|_| fs::canonicalize(path))
            .map_err(|err| finding(code, err))
    }
    fn read_json(&self, path: &Path, label: &str) -> Result<Value> {
        let text = self
            .before(AccessOperation::Read, path)
            .and_then(|_| fs::read_to_string(path))
            .map_err(|err| finding(format!("{label}-unreadable"), err))?;
        serde_json::from_str(&text).map_err(|err| finding(format!("{label}-malformed"), err))
    }
    fn query(&self, root: &Path, query: WorkspaceGitQuery<'_>, code: &str) -> Result<String> {
        let output = self
            .git
            .workspace_query(root, query, || self.before(AccessOperation::Git, root))
            .map_err(|err| finding(code, err))?;
        if !output.status.success() {
            return Err(finding(code, String::from_utf8_lossy(&output.stderr)));
        }
        let mut text = String::from_utf8(output.stdout).map_err(|err| finding(code, err))?;
        // Exactly ONE Git protocol newline; trim() destroys legal root bytes.
        if text.ends_with('\n') {
            text.pop();
        }
        Ok(text)
    }
    fn repository_root(&self, candidate: &Path, role: RepositoryRole) -> Result<PathBuf> {
        let label = role.as_str();
        if candidate.as_os_str().is_empty() {
            return Err(finding(
                format!("{label}-root-missing"),
                "a repository root is required",
            ));
        }
        let canonical = self.canonical(candidate, &format!("{label}-root-unreadable"))?;
        let top = self.query(
            &canonical,
            WorkspaceGitQuery::Top,
            &format!("{label}-repository-unavailable"),
        )?;
        if self.canonical(Path::new(&top), &format!("{label}-root-unreadable"))? != canonical {
            return Err(finding(
                format!("{label}-root-nested"),
                "selected location is not the repository top level",
            ));
        }
        Ok(canonical)
    }
    fn control_roots(&self, root: &Path, code: &str) -> Result<[PathBuf; 2]> {
        let git_dir = self.query(root, WorkspaceGitQuery::GitDir, code)?;
        let common = self.query(root, WorkspaceGitQuery::CommonDir, code)?;
        Ok([
            self.canonical(Path::new(&git_dir), code)?,
            self.canonical(&root.join(common), code)?,
        ])
    }
    pub fn workspace_binding_present(&self, product: &Path) -> Result<bool> {
        Ok(self
            .stat(&product.join(WORKSPACE_BINDING_REL_PATH), "binding")?
            .is_some())
    }
    fn runtime_location(&self, product: &Path) -> Result<PathBuf> {
        let runtime = product.join(".supertaskr");
        if self.stat(&runtime, "runtime")?.is_some() {
            let physical = self.canonical(&runtime, "runtime-unreadable")?;
            if !physical.starts_with(product) {
                return Err(finding(
                    "runtime-escape",
                    "runtime escapes selected product",
                ));
            }
            if !self.stat(&physical, "runtime")?.is_some_and(|s| s.is_dir()) {
                return Err(finding(
                    "runtime-location-invalid",
                    "runtime must be a directory",
                ));
            }
            let controls = self.control_roots(product, "runtime-repository-unavailable")?;
            if controls.iter().any(|p| physical.starts_with(p))
                || has_control_segment(
                    &physical.strip_prefix(product).unwrap().to_string_lossy(),
                    false,
                )
            {
                return Err(finding(
                    "runtime-control-path",
                    "runtime is inside Git control data",
                ));
            }
            if self.stat(&physical.join(".git"), "runtime")?.is_some()
                || self.query(
                    &physical,
                    WorkspaceGitQuery::Bare,
                    "runtime-repository-unavailable",
                )? == "true"
            {
                return Err(finding(
                    "runtime-repository",
                    "runtime cannot be a Git repository",
                ));
            }
        }
        Ok(runtime)
    }
    pub fn measure_product_identity(
        &self,
        product: &Path,
        commit: &str,
    ) -> Result<ProductIdentity> {
        let root = self.repository_root(product, RepositoryRole::Product)?;
        if self.query(
            &root,
            WorkspaceGitQuery::Shallow,
            "product-history-unavailable",
        )? != "false"
        {
            return Err(finding(
                "product-history-shallow",
                "complete history required",
            ));
        }
        let grafts = self.query(
            &root,
            WorkspaceGitQuery::Grafts,
            "product-history-unavailable",
        )?;
        if self.stat(&root.join(grafts), "product-history")?.is_some() {
            return Err(finding(
                "product-history-grafted",
                "grafted history cannot establish actual roots",
            ));
        }
        if commit.is_empty() || commit.starts_with('-') {
            return Err(finding(
                "product-commit-invalid",
                "name a selected product commit",
            ));
        }
        let selected = self.query(
            &root,
            WorkspaceGitQuery::Verify(commit),
            "product-commit-unavailable",
        )?;
        let format = ObjectFormat::parse(
            &self.query(
                &root,
                WorkspaceGitQuery::ObjectFormat,
                "product-object-format-unavailable",
            )?,
            "product",
        )?;
        let roots = self.query(
            &root,
            WorkspaceGitQuery::Roots(&selected),
            "product-history-incomplete",
        )?;
        let roots: Vec<String> = roots.split_whitespace().map(str::to_string).collect();
        let root_commits = normalize_roots(&roots, format, "product")?;
        Ok(ProductIdentity {
            object_format: format,
            root_commits,
            selected_commit: Some(selected),
        })
    }
    pub fn resolve_workspace(
        &self,
        product: &Path,
        mode: WorkspaceMode,
        commit: &str,
    ) -> Result<Workspace> {
        let product = self.repository_root(product, RepositoryRole::Product)?;
        let runtime_root = self.runtime_location(&product)?;
        let binding_path = product.join(WORKSPACE_BINDING_REL_PATH);
        if !self.workspace_binding_present(&product)? {
            return Ok(Workspace {
                records_root: product.clone(),
                product_root: product,
                runtime_root,
                layout: Layout::Colocated,
                mode,
                association: AssociationResult {
                    status: if mode == WorkspaceMode::ProductOnly {
                        AssociationStatus::Unverified
                    } else {
                        AssociationStatus::Unconfigured
                    },
                    source: "absent local binding; colocated default".into(),
                    binding_path: None,
                    project_id: None,
                    product_identity: None,
                    assurance: None,
                },
                limitations: WORKSPACE_LIMITATIONS.to_vec(),
            });
        }
        let binding = self.read_json(&binding_path, "binding")?;
        fields(
            &binding,
            &["version", "projectId", "productRoot", "recordsRoot"],
            "binding",
        )?;
        version(&binding["version"], "binding")?;
        let project_id = project_identifier(&binding["projectId"], "binding")?;
        for role in [RepositoryRole::Product, RepositoryRole::Records] {
            let value = &binding[format!("{}Root", role.as_str())];
            if !value.as_str().is_some_and(|s| Path::new(s).is_absolute()) {
                return Err(finding(
                    format!("binding-{}-root-invalid", role.as_str()),
                    "local repository locations must be absolute paths",
                ));
            }
        }
        if self.repository_root(
            Path::new(binding["productRoot"].as_str().unwrap()),
            RepositoryRole::Product,
        )? != product
        {
            return Err(finding(
                "binding-product-mismatch",
                "binding does not name selected product checkout",
            ));
        }
        let declared_records = PathBuf::from(binding["recordsRoot"].as_str().unwrap());
        let mut association = AssociationResult {
            status: AssociationStatus::Unverified,
            source: "local binding only; records association was not opened".into(),
            binding_path: Some(binding_path),
            project_id: Some(project_id.clone()),
            product_identity: None,
            assurance: None,
        };
        // This return precedes ALL private filesystem and Git operations.
        if mode == WorkspaceMode::ProductOnly {
            return Ok(Workspace {
                product_root: product,
                records_root: declared_records,
                runtime_root,
                layout: Layout::Split,
                mode,
                association,
                limitations: WORKSPACE_LIMITATIONS.to_vec(),
            });
        }
        let records = self.repository_root(&declared_records, RepositoryRole::Records)?;
        if product == records {
            return Err(finding(
                "binding-layout-mismatch",
                "configured split binding requires distinct repositories",
            ));
        }
        let association_path = records.join(WORKSPACE_ASSOCIATION_REL_PATH);
        if self.stat(&association_path, "association")?.is_none() {
            return Err(finding("association-missing", association_path.display()));
        }
        let physical = self.canonical(&association_path, "association-unreadable")?;
        if !physical.starts_with(&records) {
            return Err(finding("association-escape", association_path.display()));
        }
        let data = self.read_json(&association_path, "association")?;
        let identity = self.measure_product_identity(&product, commit)?;
        let verified = validate_association(
            &data,
            &identity,
            &project_id,
            &association_path.to_string_lossy(),
        )?;
        association.status = verified.status;
        association.source = verified.source;
        association.product_identity = verified.product_identity;
        association.assurance = verified.assurance;
        Ok(Workspace {
            product_root: product,
            records_root: records,
            runtime_root,
            layout: Layout::Split,
            mode,
            association,
            limitations: WORKSPACE_LIMITATIONS.to_vec(),
        })
    }
    pub fn resolve_resource(
        &self,
        workspace: &Workspace,
        resource: ResourceRequest<'_>,
        legacy: &LegacyTokenMap,
    ) -> Result<ResourceLocation> {
        safe_relative(resource.path)?;
        let (role, rule) = match resource.role {
            Some(role) => (role, ResolutionRule::ExplicitRepositoryRole),
            None => {
                let roles = legacy
                    .get(resource.path)
                    .ok_or_else(|| finding("resource-legacy-unmapped", resource.path))?;
                let distinct: BTreeSet<_> = roles.iter().copied().collect();
                if distinct.len() != 1 {
                    return Err(finding("resource-legacy-ambiguous", resource.path));
                }
                (
                    *distinct.iter().next().unwrap(),
                    ResolutionRule::ExplicitLegacyTokenMap,
                )
            }
        };
        if role == RepositoryRole::Records && workspace.mode == WorkspaceMode::ProductOnly {
            return Err(finding(
                "resource-records-unverified",
                "resolve development workspace before opening records",
            ));
        }
        let source = resource.source.unwrap_or("working-tree");
        if source.is_empty() {
            return Err(finding("resource-source-invalid", "name a source token"));
        }
        let root = match role {
            RepositoryRole::Product => &workspace.product_root,
            RepositoryRole::Records => &workspace.records_root,
        };
        let absolute = root.join(resource.path);
        let mut ancestor = absolute.as_path();
        while self.stat(ancestor, "resource")?.is_none() {
            ancestor = ancestor
                .parent()
                .ok_or_else(|| finding("resource-root-unavailable", root.display()))?;
        }
        let physical_ancestor = self.canonical(ancestor, "resource-unreadable")?;
        let suffix = absolute.strip_prefix(ancestor).unwrap();
        let physical = if suffix.as_os_str().is_empty() {
            physical_ancestor
        } else {
            physical_ancestor.join(suffix)
        };
        let relative = physical
            .strip_prefix(root)
            .map_err(|_| finding("resource-symlink-escape", resource.path))?;
        safe_relative(
            &relative
                .to_string_lossy()
                .replace(std::path::MAIN_SEPARATOR, "/"),
        )?;
        if self
            .control_roots(root, "resource-root-unavailable")?
            .iter()
            .any(|p| physical.starts_with(p))
        {
            return Err(finding("resource-control-path", resource.path));
        }
        if self.stat(&workspace.runtime_root, "runtime")?.is_some()
            && physical.starts_with(self.canonical(&workspace.runtime_root, "runtime-unreadable")?)
        {
            return Err(finding("resource-control-path", resource.path));
        }
        Ok(ResourceLocation {
            key: serde_json::to_string(&(role.as_str(), resource.path, source, rule.as_str()))
                .unwrap(),
            role,
            relative_path: resource.path.into(),
            source: source.into(),
            resolution_rule: rule,
            root: root.clone(),
            absolute_path: absolute,
            physical_path: physical,
            colocated_overlap: workspace.layout == Layout::Colocated,
            authority: "location only; no write ownership or disjoint reservation claim",
        })
    }
}
fn fields(value: &Value, keys: &[&str], label: &str) -> Result<()> {
    if !value
        .as_object()
        .is_some_and(|map| map.len() == keys.len() && keys.iter().all(|key| map.contains_key(*key)))
    {
        return Err(finding(
            format!("{label}-schema"),
            format!("expected exactly {}", keys.join(", ")),
        ));
    }
    Ok(())
}
fn version(value: &Value, label: &str) -> Result<()> {
    if value.as_f64() != Some(1.0) {
        return Err(finding(format!("{label}-version-unsupported"), value));
    }
    Ok(())
}
fn project_identifier(value: &Value, label: &str) -> Result<String> {
    let valid = value.as_str().filter(|s| {
        let b = s.as_bytes();
        !b.is_empty()
            && b.len() <= 128
            && b[0].is_ascii_alphanumeric()
            && b.iter()
                .all(|c| c.is_ascii_alphanumeric() || b"._-".contains(c))
    });
    valid.map(str::to_string).ok_or_else(|| {
        finding(
            format!("{label}-project-id"),
            "projectId must be a portable identifier",
        )
    })
}
fn normalize_roots(roots: &[String], format: ObjectFormat, label: &str) -> Result<Vec<String>> {
    if roots.is_empty()
        || roots
            .iter()
            .any(|s| s.len() != format.length() || !s.bytes().all(|b| b.is_ascii_hexdigit()))
    {
        return Err(finding(
            format!("{label}-root-commits-invalid"),
            "expected nonempty full root commit ids",
        ));
    }
    Ok(roots
        .iter()
        .map(|s| s.to_ascii_lowercase())
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect())
}
/// Pure validation over captured or committed association bytes, never I/O.
pub fn validate_association(
    data: &Value,
    identity: &ProductIdentity,
    project_id: &str,
    source: &str,
) -> Result<AssociationResult> {
    fields(data, &["version", "projectId", "product"], "association")?;
    version(&data["version"], "association")?;
    let declared_id = project_identifier(&data["projectId"], "association")?;
    project_identifier(&Value::String(project_id.into()), "binding")?;
    if declared_id != project_id {
        return Err(finding(
            "association-project-mismatch",
            "project identifiers differ",
        ));
    }
    fields(
        &data["product"],
        &["objectFormat", "rootCommits"],
        "association-product",
    )?;
    let format = ObjectFormat::parse(
        data["product"]["objectFormat"].as_str().unwrap_or(""),
        "association",
    )?;
    let roots: Vec<String> = data["product"]["rootCommits"]
        .as_array()
        .ok_or_else(|| finding("association-root-commits-invalid", "expected array"))?
        .iter()
        .map(|v| {
            v.as_str()
                .map(str::to_string)
                .ok_or_else(|| finding("association-root-commits-invalid", "expected full ids"))
        })
        .collect::<Result<_>>()?;
    let declared = normalize_roots(&roots, format, "association")?;
    let measured = normalize_roots(&identity.root_commits, identity.object_format, "product")?;
    if format != identity.object_format {
        return Err(finding(
            "association-object-format-mismatch",
            "object formats differ",
        ));
    }
    if declared != measured {
        return Err(finding(
            "association-root-commits-mismatch",
            "complete root sets differ",
        ));
    }
    Ok(AssociationResult {
        status: AssociationStatus::Verified,
        source: source.into(),
        binding_path: None,
        project_id: Some(project_id.into()),
        product_identity: Some(ProductIdentity {
            root_commits: measured,
            ..identity.clone()
        }),
        assurance: Some("accidental-mismatch detection, not authentication".into()),
    })
}
fn has_control_segment(path: &str, runtime: bool) -> bool {
    path.split(['/', '\\']).any(|p| {
        p.eq_ignore_ascii_case(".git") || (runtime && p.eq_ignore_ascii_case(".supertaskr"))
    })
}
fn safe_relative(token: &str) -> Result<()> {
    let windows_absolute = token.starts_with(['/', '\\'])
        || (token
            .as_bytes()
            .first()
            .is_some_and(u8::is_ascii_alphabetic)
            && token.as_bytes().get(1) == Some(&b':')
            && token.as_bytes().get(2).is_some_and(|b| b"/\\".contains(b)));
    if token.is_empty() || Path::new(token).is_absolute() || windows_absolute {
        return Err(finding("resource-absolute-or-empty", token));
    }
    if token.contains('\\')
        || token
            .split('/')
            .any(|p| p.is_empty() || p == "." || p == "..")
    {
        return Err(finding("resource-traversal", token));
    }
    if token.contains('\0') {
        return Err(finding("resource-invalid", "NUL is not a path character"));
    }
    if has_control_segment(token, true) {
        return Err(finding("resource-control-path", token));
    }
    Ok(())
}
