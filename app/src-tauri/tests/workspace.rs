//! Qualification of the production export, never a #[path] replacement.
use serde_json::{json, Value};
use std::cell::RefCell;
use std::collections::BTreeMap;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use supertaskr_lib::workspace::*;

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
        .env("GIT_AUTHOR_NAME", "Workspace fixture")
        .env("GIT_AUTHOR_EMAIL", "fixture@example.invalid")
        .env("GIT_COMMITTER_NAME", "Workspace fixture")
        .env("GIT_COMMITTER_EMAIL", "fixture@example.invalid")
        .env_remove("GIT_DIR")
        .env_remove("GIT_WORK_TREE")
        .env_remove("GIT_CONFIG_COUNT")
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "fixture git {args:?}: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    let mut text = String::from_utf8(output.stdout).unwrap();
    if text.ends_with('\n') {
        text.pop();
    }
    text
}
fn repository(root: &Path, format: &str) {
    fs::create_dir_all(root.join("safe")).unwrap();
    git(
        root,
        &[
            "init",
            "-q",
            "--initial-branch=main",
            &format!("--object-format={format}"),
        ],
    );
    fs::write(root.join("safe/existing.txt"), "tracked control\n").unwrap();
    git(root, &["add", "."]);
    git(root, &["commit", "-qm", "fixture root"]);
}
struct Fixture {
    dir: PathBuf,
    product: PathBuf,
    records: PathBuf,
}
impl Fixture {
    fn new() -> Self {
        Self::named("product", "records", "sha1")
    }
    fn named(product: &str, records: &str, format: &str) -> Self {
        let dir = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("target")
            .join(format!(
                "workspace-T-347-s1-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            ));
        fs::create_dir_all(&dir).unwrap();
        let dir = fs::canonicalize(dir).unwrap();
        let fx = Self {
            product: dir.join(product),
            records: dir.join(records),
            dir,
        };
        repository(&fx.product, format);
        repository(&fx.records, format);
        fx
    }
    fn binding(&self) -> Value {
        json!({"version":1,"projectId":"fixture-project","productRoot":self.product,"recordsRoot":self.records})
    }
    fn write_binding(&self, value: &Value) {
        fs::create_dir_all(self.product.join(".supertaskr")).unwrap();
        fs::write(
            self.product.join(WORKSPACE_BINDING_REL_PATH),
            serde_json::to_vec(value).unwrap(),
        )
        .unwrap();
    }
    fn bind(&self, resolver: &WorkspaceResolver<'_>, commit: &str) -> Value {
        self.write_binding(&self.binding());
        let id = resolver
            .measure_product_identity(&self.product, commit)
            .unwrap();
        let association = json!({"version":1,"projectId":"fixture-project","product":{"objectFormat":id.object_format,"rootCommits":id.root_commits}});
        self.write_association(&association);
        association
    }
    fn write_association(&self, value: &Value) {
        fs::write(
            self.records.join(WORKSPACE_ASSOCIATION_REL_PATH),
            serde_json::to_vec(value).unwrap(),
        )
        .unwrap();
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        fs::remove_dir_all(&self.dir).unwrap();
    }
}
fn resolver() -> WorkspaceResolver<'static> {
    WorkspaceResolver::new().expect("trusted Git required for qualification")
}
fn development(r: &WorkspaceResolver<'_>, product: &Path) -> Workspace {
    r.resolve_workspace(product, WorkspaceMode::Development, "HEAD")
        .unwrap()
}
fn resource(
    r: &WorkspaceResolver<'_>,
    w: &Workspace,
    role: RepositoryRole,
    path: &str,
) -> Result<ResourceLocation, WorkspaceFinding> {
    r.resolve_resource(
        w,
        ResourceRequest {
            role: Some(role),
            path,
            source: None,
        },
        &LegacyTokenMap::new(),
    )
}
fn error<T: std::fmt::Debug>(result: Result<T, WorkspaceFinding>, code: &str) {
    assert_eq!(result.unwrap_err().code, code);
}
#[cfg(unix)]
fn symlink(target: &Path, link: &Path) {
    std::os::unix::fs::symlink(target, link).unwrap();
}

#[test]
fn legacy_modes_and_runtime_are_checkout_local() {
    let fx = Fixture::new();
    let r = resolver();
    let w = development(&r, &fx.product);
    assert_eq!(w.product_root(), fx.product);
    assert_eq!(w.records_root(), fx.product);
    assert_eq!(w.runtime_root(), fx.product.join(".supertaskr"));
    assert_eq!(w.layout(), Layout::Colocated);
    assert_eq!(w.association().status, AssociationStatus::Unconfigured);
    assert!(!fx.product.join(".supertaskr").exists());
    let product = resource(&r, &w, RepositoryRole::Product, "safe/new.txt").unwrap();
    let records = resource(&r, &w, RepositoryRole::Records, "safe/new.txt").unwrap();
    assert_eq!(product.physical_path, records.physical_path);
    assert_ne!(product.key, records.key);
    assert!(product.colocated_overlap);
    assert!(product.authority.contains("no write ownership"));
    let only = r
        .resolve_workspace(&fx.product, WorkspaceMode::ProductOnly, "HEAD")
        .unwrap();
    assert_eq!(only.association().status, AssociationStatus::Unverified);
    error(
        resource(&r, &only, RepositoryRole::Records, "safe/new.txt"),
        "resource-records-unverified",
    );
    error(
        r.resolve_workspace(&fx.product.join("safe"), WorkspaceMode::Development, "HEAD"),
        "product-root-nested",
    );
    error(
        r.resolve_workspace(&fx.dir, WorkspaceMode::Development, "HEAD"),
        "product-root-nested",
    );
    let nonrepo = fx.dir.join("non-repository");
    fs::create_dir(&nonrepo).unwrap();
    fs::write(nonrepo.join(".git"), "not a Git directory declaration\n").unwrap();
    error(
        r.resolve_workspace(&nonrepo, WorkspaceMode::Development, "HEAD"),
        "product-repository-unavailable",
    );
    error(
        r.resolve_workspace(Path::new(""), WorkspaceMode::Development, "HEAD"),
        "product-root-missing",
    );
    fs::write(fx.product.join(".supertaskr"), "file").unwrap();
    error(
        r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
        "runtime-location-invalid",
    );
    fs::remove_file(fx.product.join(".supertaskr")).unwrap();
    fs::create_dir_all(fx.product.join(".supertaskr/.git")).unwrap();
    error(
        r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
        "runtime-repository",
    );
    fs::remove_dir_all(fx.product.join(".supertaskr/.git")).unwrap();
    assert_eq!(development(&r, &fx.product).layout(), Layout::Colocated);
    git(&fx.product.join(".supertaskr"), &["init", "-q", "--bare"]);
    error(
        r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
        "runtime-repository",
    );
    #[cfg(unix)]
    {
        fs::remove_dir_all(fx.product.join(".supertaskr")).unwrap();
        symlink(&fx.records, &fx.product.join(".supertaskr"));
        error(
            r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
            "runtime-escape",
        );
    }
}

#[test]
fn explicit_binding_and_association_never_fall_back() {
    let fx = Fixture::new();
    let r = resolver();
    let association = fx.bind(&r, "HEAD");
    let identity = r.measure_product_identity(&fx.product, "HEAD").unwrap();
    fs::create_dir_all(fx.product.join("docs/tasks")).unwrap();
    fs::write(fx.product.join("docs/tasks/stale.md"), "decoy").unwrap();
    assert_eq!(
        development(&r, &fx.product).association().status,
        AssociationStatus::Verified
    );
    for (field, value, code) in [
        ("version", json!(2), "binding-version-unsupported"),
        ("projectId", json!("../host"), "binding-project-id"),
        (
            "recordsRoot",
            json!("relative"),
            "binding-records-root-invalid",
        ),
        ("productRoot", json!(""), "binding-product-root-invalid"),
        ("extra", json!(true), "binding-schema"),
        ("productRoot", json!(fx.records), "binding-product-mismatch"),
        ("recordsRoot", json!(fx.product), "binding-layout-mismatch"),
        (
            "recordsRoot",
            json!(fx.records.join("safe")),
            "records-root-nested",
        ),
        (
            "recordsRoot",
            json!(fx.dir.join("absent")),
            "records-root-unreadable",
        ),
    ] {
        let mut binding = fx.binding();
        binding[field] = value;
        fx.write_binding(&binding);
        error(
            r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
            code,
        );
    }
    for omitted in ["version", "projectId", "productRoot", "recordsRoot"] {
        let mut binding = fx.binding();
        binding.as_object_mut().unwrap().remove(omitted);
        fx.write_binding(&binding);
        error(
            r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
            "binding-schema",
        );
    }
    fs::write(fx.product.join(WORKSPACE_BINDING_REL_PATH), "{").unwrap();
    error(
        r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
        "binding-malformed",
    );
    fx.write_binding(&fx.binding());
    for (field, value, code) in [
        ("version", json!(2), "association-version-unsupported"),
        (
            "projectId",
            json!("foreign"),
            "association-project-mismatch",
        ),
        ("projectId", json!("/machine"), "association-project-id"),
        ("extra", json!(true), "association-schema"),
    ] {
        let mut bad = association.clone();
        bad[field] = value;
        fx.write_association(&bad);
        error(
            r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
            code,
        );
    }
    for (product, code) in [
        (
            json!({"objectFormat":"unknown","rootCommits":["a"]}),
            "association-object-format-unsupported",
        ),
        (
            json!({"objectFormat":"sha1","rootCommits":[]}),
            "association-root-commits-invalid",
        ),
        (
            json!({"objectFormat":"sha1","rootCommits":["a"]}),
            "association-root-commits-invalid",
        ),
        (
            json!({"objectFormat":"sha1","rootCommits":["a".repeat(40)]}),
            "association-root-commits-mismatch",
        ),
        (
            json!({"objectFormat":"sha256","rootCommits":["a".repeat(64)]}),
            "association-object-format-mismatch",
        ),
        (
            json!({"objectFormat":"sha1","rootCommits":identity.root_commits,"remote":"not authority"}),
            "association-product-schema",
        ),
    ] {
        let mut bad = association.clone();
        bad["product"] = product;
        fx.write_association(&bad);
        error(
            r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
            code,
        );
    }
    let assoc = fx.records.join(WORKSPACE_ASSOCIATION_REL_PATH);
    fs::remove_file(&assoc).unwrap();
    error(
        r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
        "association-missing",
    );
    fs::create_dir(&assoc).unwrap();
    error(
        r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
        "association-unreadable",
    );
    fs::remove_dir(&assoc).unwrap();
    fs::write(&assoc, "{").unwrap();
    error(
        r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
        "association-malformed",
    );
    #[cfg(unix)]
    {
        fs::remove_file(&assoc).unwrap();
        symlink(&fx.dir.join("missing"), &assoc);
        error(
            r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
            "association-unreadable",
        );
        fs::remove_file(&assoc).unwrap();
        fs::write(
            fx.dir.join("outside.json"),
            serde_json::to_vec(&association).unwrap(),
        )
        .unwrap();
        symlink(&fx.dir.join("outside.json"), &assoc);
        error(
            r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
            "association-escape",
        );
        let binding = fx.product.join(WORKSPACE_BINDING_REL_PATH);
        fs::remove_file(&binding).unwrap();
        symlink(&fx.dir.join("missing"), &binding);
        error(
            r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
            "binding-unreadable",
        );
    }
    let captured = validate_association(
        &association,
        &identity,
        "fixture-project",
        "commit:captured",
    )
    .unwrap();
    assert_eq!(captured.source, "commit:captured");
    assert!(captured.assurance.unwrap().contains("not authentication"));
    // Match the actual Node boundary: product-only preserves this declaration
    // without an OS path operation, while development reports unreadable.
    fs::remove_file(fx.product.join(WORKSPACE_BINDING_REL_PATH)).unwrap();
    let mut nul_binding = fx.binding();
    nul_binding["recordsRoot"] = json!(format!("{}\0declared", fx.records.display()));
    fx.write_binding(&nul_binding);
    let oracle = node(&fx.product, "product-only", "HEAD");
    assert_eq!(oracle["ok"]["recordsRoot"], nul_binding["recordsRoot"]);
    let only = r
        .resolve_workspace(&fx.product, WorkspaceMode::ProductOnly, "HEAD")
        .unwrap();
    assert_eq!(oracle, json!({"ok": only}));
    error(
        r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
        "records-root-unreadable",
    );
    assert_eq!(
        node(&fx.product, "development", "HEAD"),
        json!({"error":"records-root-unreadable"})
    );
    nul_binding = fx.binding();
    nul_binding["productRoot"] = json!(format!("{}\0declared", fx.product.display()));
    fx.write_binding(&nul_binding);
    error(
        r.resolve_workspace(&fx.product, WorkspaceMode::ProductOnly, "HEAD"),
        "product-root-unreadable",
    );
    assert_eq!(
        node(&fx.product, "product-only", "HEAD"),
        json!({"error":"product-root-unreadable"})
    );
}

struct Audit {
    private: PathBuf,
    deny: bool,
    calls: RefCell<Vec<(AccessOperation, PathBuf)>>,
}
impl AccessObserver for Audit {
    fn before(&self, operation: AccessOperation, path: &Path) -> io::Result<()> {
        self.calls
            .borrow_mut()
            .push((operation, path.to_path_buf()));
        if self.deny && path.starts_with(&self.private) {
            Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "private trap",
            ))
        } else {
            Ok(())
        }
    }
}
#[test]
fn product_only_attempts_zero_private_operations_with_live_controls() {
    let fx = Fixture::new();
    let plain = resolver();
    fx.bind(&plain, "HEAD");
    let audit = Audit {
        private: fx.records.clone(),
        deny: true,
        calls: RefCell::new(Vec::new()),
    };
    let r = WorkspaceResolver::with_observer(Some(&audit)).unwrap();
    for state in ["decoy", "missing", "inaccessible"] {
        if state == "missing" {
            fs::remove_dir_all(&fx.records).unwrap();
        }
        if state == "inaccessible" {
            fs::create_dir(&fx.records).unwrap();
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                fs::set_permissions(&fx.records, fs::Permissions::from_mode(0o000)).unwrap();
            }
        }
        audit.calls.borrow_mut().clear();
        let w = r
            .resolve_workspace(&fx.product, WorkspaceMode::ProductOnly, "HEAD")
            .unwrap();
        assert_eq!(w.records_root(), fx.records);
        assert_eq!(w.association().status, AssociationStatus::Unverified);
        error(
            resource(&r, &w, RepositoryRole::Records, "safe/existing.txt"),
            "resource-records-unverified",
        );
        assert!(resource(&r, &w, RepositoryRole::Product, "safe/existing.txt").is_ok());
        let calls = audit.calls.borrow();
        assert!(!calls.is_empty());
        assert_eq!(
            calls
                .iter()
                .filter(|(_, p)| p.starts_with(&fx.records))
                .count(),
            0,
            "{state}: swallowed errors must still count"
        );
        drop(calls);
        error(
            r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
            "records-root-unreadable",
        );
        assert!(audit
            .calls
            .borrow()
            .iter()
            .any(|(op, p)| *op == AccessOperation::Canonicalize && p == &fx.records));
        // Same hook must catch each actual metadata/read/canonical/Git entry,
        // independently of whether that operation's error is recoverable.
        let control = WorkspaceResolver::with_observer(Some(&audit)).unwrap();
        error(
            control.workspace_binding_present(&fx.records),
            "binding-unreadable",
        );

        #[cfg(unix)]
        if state == "inaccessible" {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&fx.records, fs::Permissions::from_mode(0o755)).unwrap();
        }
    }
    // Allow development once to independently prove reads and Git on private
    // records really reach the same boundary, rather than a test-only trap.
    repository(&fx.records, "sha1");
    fx.bind(&plain, "HEAD");
    let allow = Audit {
        private: fx.records.clone(),
        deny: false,
        calls: RefCell::new(Vec::new()),
    };
    let r = WorkspaceResolver::with_observer(Some(&allow)).unwrap();
    development(&r, &fx.product);
    for operation in [
        AccessOperation::Metadata,
        AccessOperation::Read,
        AccessOperation::Canonicalize,
        AccessOperation::Git,
    ] {
        assert!(
            allow
                .calls
                .borrow()
                .iter()
                .any(|(op, p)| *op == operation && p.starts_with(&fx.records)),
            "missing {operation:?} control"
        );
    }
    // Deny individually at all four real boundaries: a swallowed operation is
    // still recorded. Product-only stays silent under EACH denial mechanism.
    struct One {
        root: PathBuf,
        operation: AccessOperation,
        hits: RefCell<usize>,
    }
    impl AccessObserver for One {
        fn before(&self, op: AccessOperation, path: &Path) -> io::Result<()> {
            if op == self.operation && path.starts_with(&self.root) {
                *self.hits.borrow_mut() += 1;
                Err(io::Error::new(
                    io::ErrorKind::PermissionDenied,
                    "one-operation trap",
                ))
            } else {
                Ok(())
            }
        }
    }
    for operation in [
        AccessOperation::Metadata,
        AccessOperation::Read,
        AccessOperation::Canonicalize,
        AccessOperation::Git,
    ] {
        let one = One {
            root: fx.records.clone(),
            operation,
            hits: RefCell::new(0),
        };
        let r = WorkspaceResolver::with_observer(Some(&one)).unwrap();
        let w = r
            .resolve_workspace(&fx.product, WorkspaceMode::ProductOnly, "HEAD")
            .unwrap();
        error(
            resource(&r, &w, RepositoryRole::Records, "safe/new.txt"),
            "resource-records-unverified",
        );
        assert_eq!(*one.hits.borrow(), 0);
        assert!(r
            .resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD")
            .is_err());
        assert!(*one.hits.borrow() > 0);
    }
}

#[test]
fn selected_complete_history_ignores_other_refs_and_replacements() {
    let fx = Fixture::new();
    let r = resolver();
    let original = git(&fx.product, &["rev-parse", "HEAD"]);
    git(&fx.product, &["checkout", "-q", "--orphan", "extra"]);
    git(&fx.product, &["commit", "-qm", "second root"]);
    let second = git(&fx.product, &["rev-parse", "HEAD"]);
    git(
        &fx.product,
        &[
            "merge",
            "--allow-unrelated-histories",
            "-qm",
            "union",
            "main",
        ],
    );
    let selected = git(&fx.product, &["rev-parse", "HEAD"]);
    git(
        &fx.product,
        &["checkout", "-q", "--orphan", "unrelated-only-ref"],
    );
    git(
        &fx.product,
        &["commit", "-qm", "third root only at another ref"],
    );
    let third = git(&fx.product, &["rev-parse", "HEAD"]);
    let mut expected = vec![original.clone(), second];
    expected.sort();
    let id = r.measure_product_identity(&fx.product, &selected).unwrap();
    assert_eq!(id.root_commits, expected);
    assert_eq!(id.selected_commit, Some(selected.clone()));
    assert!(!id.root_commits.contains(&third));
    assert_eq!(node(&fx.product, "identity", &selected), json!({"ok": id}));
    assert_eq!(
        r.measure_product_identity(&fx.product, &original)
            .unwrap()
            .root_commits,
        vec![original.clone()]
    );
    let mut association = fx.bind(&r, &selected);
    association["product"]["rootCommits"] = json!(expected
        .iter()
        .rev()
        .map(|s| s.to_uppercase())
        .chain([expected[0].clone()])
        .collect::<Vec<_>>());
    fx.write_association(&association);
    assert_eq!(
        r.resolve_workspace(&fx.product, WorkspaceMode::Development, &selected)
            .unwrap()
            .association()
            .product_identity
            .as_ref()
            .unwrap()
            .root_commits,
        expected
    );
    assert_eq!(
        node(&fx.product, "development", &selected),
        json!({"ok": r.resolve_workspace(&fx.product, WorkspaceMode::Development, &selected).unwrap()})
    );
    git(&fx.product, &["replace", &original, &third]);
    assert_eq!(
        r.measure_product_identity(&fx.product, &selected).unwrap(),
        id
    );
    git(&fx.product, &["replace", "-d", &original]);
    for commit in ["", "--all", "-h"] {
        error(
            r.measure_product_identity(&fx.product, commit),
            "product-commit-invalid",
        );
    }
    error(
        r.measure_product_identity(&fx.product, "unknown-ref"),
        "product-commit-unavailable",
    );
    assert_eq!(
        node(&fx.product, "identity", "HEAD\0"),
        json!({"error":"product-commit-unavailable"})
    );
    error(
        r.measure_product_identity(&fx.product, "HEAD\0"),
        "product-commit-unavailable",
    );
    let graft = fx.product.join(".git/info/grafts");
    fs::write(&graft, format!("{selected}\n")).unwrap();
    error(
        r.measure_product_identity(&fx.product, &selected),
        "product-history-grafted",
    );
    fs::remove_file(&graft).unwrap();
    let shallow = fx.dir.join("shallow");
    git(
        &fx.dir,
        &[
            "clone",
            "-q",
            "--depth=1",
            &format!("file://{}", fx.product.display()),
            shallow.to_str().unwrap(),
        ],
    );
    error(
        r.measure_product_identity(&shallow, "HEAD"),
        "product-history-shallow",
    );
    git(&fx.product, &["commit-graph", "write", "--reachable"]);
    assert!(fx.product.join(".git/objects/info/commit-graph").exists());
    let object = fx
        .product
        .join(".git/objects")
        .join(&original[..2])
        .join(&original[2..]);
    fs::remove_file(object).unwrap();
    error(
        r.measure_product_identity(&fx.product, &selected),
        "product-history-incomplete",
    );
}

#[test]
fn supported_object_formats_and_trailing_newline_roots_preserve_identity() {
    let r = resolver();
    for format in ["sha1", "sha256"] {
        // Failure to support either advertised format is an explicit failure,
        // never a skipped green. This machine's Git must demonstrate support.
        let fx = Fixture::named("product \n", "records \n", format);
        let association = fx.bind(&r, "HEAD");
        let id = r.measure_product_identity(&fx.product, "HEAD").unwrap();
        assert_eq!(id.root_commits.len(), 1);
        assert_eq!(
            id.root_commits[0].len(),
            if format == "sha1" { 40 } else { 64 }
        );
        assert_eq!(
            git(&fx.product, &["rev-parse", "--show-toplevel"]),
            fx.product.to_str().unwrap()
        );
        let w = development(&r, &fx.product);
        assert_eq!(node(&fx.product, "development", "HEAD"), json!({"ok": w}));
        assert_eq!(node(&fx.product, "identity", "HEAD"), json!({"ok": id}));
        assert_eq!(w.product_root(), fx.product);
        assert_eq!(w.records_root(), fx.records);
        assert_eq!(w.association().status, AssociationStatus::Verified);
        assert_eq!(
            resource(&r, &w, RepositoryRole::Records, "safe/new.txt")
                .unwrap()
                .physical_path,
            fx.records.join("safe/new.txt")
        );
        assert_eq!(
            validate_association(&association, &id, "fixture-project", "captured")
                .unwrap()
                .product_identity,
            Some(id)
        );
    }
}

#[test]
fn resources_require_roles_sources_and_safe_physical_locations() {
    let fx = Fixture::new();
    let r = resolver();
    fx.bind(&r, "HEAD");
    let w = development(&r, &fx.product);
    let p = resource(&r, &w, RepositoryRole::Product, "safe/existing.txt").unwrap();
    let rec = resource(&r, &w, RepositoryRole::Records, "safe/existing.txt").unwrap();
    assert_eq!(p.relative_path, rec.relative_path);
    assert_ne!(p.physical_path, rec.physical_path);
    assert_ne!(p.key, rec.key);
    assert!(!p.colocated_overlap);
    assert_eq!(p.source, "working-tree");
    let request = ResourceRequest {
        role: Some(RepositoryRole::Product),
        path: "safe/existing.txt",
        source: Some("commit:captured"),
    };
    let captured = r
        .resolve_resource(&w, request.clone(), &LegacyTokenMap::new())
        .unwrap();
    assert_ne!(p.key, captured.key);
    assert_eq!(
        serde_json::from_str::<Value>(&captured.key).unwrap(),
        json!([
            "product",
            "safe/existing.txt",
            "commit:captured",
            "explicit-repository-role"
        ])
    );
    error(
        r.resolve_resource(
            &w,
            ResourceRequest {
                source: Some(""),
                ..request
            },
            &LegacyTokenMap::new(),
        ),
        "resource-source-invalid",
    );
    let request = ResourceRequest {
        role: None,
        path: "safe/only-records.txt",
        source: None,
    };
    fs::write(
        fx.records.join(request.path),
        "private existence must not choose role",
    )
    .unwrap();
    let legacy = BTreeMap::from([(
        request.path.into(),
        vec![RepositoryRole::Product, RepositoryRole::Product],
    )]);
    let legacy_result = r.resolve_resource(&w, request.clone(), &legacy).unwrap();
    assert_eq!(legacy_result.root, fx.product);
    assert_eq!(
        legacy_result.resolution_rule,
        ResolutionRule::ExplicitLegacyTokenMap
    );
    error(
        r.resolve_resource(&w, request.clone(), &LegacyTokenMap::new()),
        "resource-legacy-unmapped",
    );
    for roles in [
        vec![],
        vec![RepositoryRole::Product, RepositoryRole::Records],
    ] {
        error(
            r.resolve_resource(
                &w,
                request.clone(),
                &BTreeMap::from([(request.path.into(), roles)]),
            ),
            "resource-legacy-ambiguous",
        );
    }
    error(RepositoryRole::parse("runtime"), "resource-role-unknown");
    let numeric = r
        .resolve_resource(
            &w,
            ResourceRequest {
                role: Some(RepositoryRole::Records),
                path: "1:/new.txt",
                source: Some("commit:captured"),
            },
            &LegacyTokenMap::new(),
        )
        .unwrap();
    assert_eq!(
        node(&fx.product, "resource-numeric-drive", "HEAD"),
        json!({"ok":numeric})
    );
    for (path, code) in [
        ("", "resource-absolute-or-empty"),
        ("/absolute", "resource-absolute-or-empty"),
        ("C:/absolute", "resource-absolute-or-empty"),
        ("C:\\absolute", "resource-absolute-or-empty"),
        ("\\\\host\\share", "resource-absolute-or-empty"),
        ("safe//x", "resource-traversal"),
        ("safe/./x", "resource-traversal"),
        ("safe/../x", "resource-traversal"),
        ("safe/", "resource-traversal"),
        ("safe\\x", "resource-traversal"),
        ("safe/nu\0l", "resource-invalid"),
        (".GiT/config", "resource-control-path"),
        ("safe/.SuPeRtAsKr/x", "resource-control-path"),
    ] {
        error(resource(&r, &w, RepositoryRole::Product, path), code);
    }
    #[cfg(unix)]
    {
        symlink(&fx.product.join("safe"), &fx.product.join("inside"));
        for path in ["inside/existing.txt", "inside/new/nested.txt"] {
            assert_eq!(
                resource(&r, &w, RepositoryRole::Product, path)
                    .unwrap()
                    .physical_path,
                fx.product.join(path.replacen("inside", "safe", 1))
            );
        }
        symlink(&fx.records, &fx.product.join("outside"));
        for path in ["outside/safe/existing.txt", "outside/new/nested.txt"] {
            error(
                resource(&r, &w, RepositoryRole::Product, path),
                "resource-symlink-escape",
            );
        }
        symlink(&fx.dir.join("missing"), &fx.product.join("broken"));
        error(
            resource(&r, &w, RepositoryRole::Product, "broken/new.txt"),
            "resource-unreadable",
        );
        symlink(&fx.product.join(".git"), &fx.product.join("control"));
        error(
            resource(&r, &w, RepositoryRole::Product, "control/new.txt"),
            "resource-control-path",
        );
    }
}

#[test]
#[cfg(unix)]
fn actual_git_common_storage_and_runtime_aliases_are_excluded() {
    let fx = Fixture::new();
    let r = resolver();
    let common = fx.product.join("git-common-storage");
    fs::rename(fx.product.join(".git"), &common).unwrap();
    let control = fx.product.join("git-control-storage");
    fs::create_dir(&control).unwrap();
    fs::copy(common.join("HEAD"), control.join("HEAD")).unwrap();
    fs::copy(common.join("index"), control.join("index")).unwrap();
    fs::write(control.join("commondir"), "../git-common-storage\n").unwrap();
    fs::write(
        fx.product.join(".git"),
        format!("gitdir: {}\n", control.display()),
    )
    .unwrap();
    assert_eq!(
        fs::canonicalize(git(&fx.product, &["rev-parse", "--absolute-git-dir"])).unwrap(),
        control
    );
    assert_eq!(
        fs::canonicalize(git(&fx.product, &["rev-parse", "--git-common-dir"])).unwrap(),
        common
    );
    let w = development(&r, &fx.product);
    assert!(resource(&r, &w, RepositoryRole::Product, "safe/new.txt").is_ok());
    for (storage, alias) in [(&common, "common-alias"), (&control, "control-alias")] {
        symlink(storage, &fx.product.join(alias));
        for token in [
            format!("{alias}/HEAD"),
            format!("{alias}/new/x"),
            format!("{}/HEAD", storage.file_name().unwrap().to_str().unwrap()),
            format!("{}/new/x", storage.file_name().unwrap().to_str().unwrap()),
        ] {
            for role in [RepositoryRole::Product, RepositoryRole::Records] {
                error(resource(&r, &w, role, &token), "resource-control-path");
            }
        }
    }
    symlink(&common, &fx.product.join(".supertaskr"));
    error(
        r.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
        "runtime-control-path",
    );
    fs::remove_file(fx.product.join(".supertaskr")).unwrap();
    let storage = fx.product.join("runtime-storage");
    fs::create_dir(&storage).unwrap();
    fs::write(storage.join("existing.json"), "{}").unwrap();
    symlink(&storage, &fx.product.join(".supertaskr"));
    symlink(&storage, &fx.product.join("runtime-alias"));
    let w = development(&r, &fx.product);
    for token in [
        "runtime-storage/existing.json",
        "runtime-storage/new/x",
        "runtime-alias/existing.json",
        "runtime-alias/new/x",
    ] {
        for role in [RepositoryRole::Product, RepositoryRole::Records] {
            error(resource(&r, &w, role, token), "resource-control-path");
        }
    }
    // Real linked checkout proves discovery of external common metadata too.
    let linked = fx.dir.join("linked");
    git(
        &fx.product,
        &[
            "worktree",
            "add",
            "-q",
            linked.to_str().unwrap(),
            "-b",
            "linked-fixture",
        ],
    );
    let linked_w = development(&r, &linked);
    assert!(resource(&r, &linked_w, RepositoryRole::Product, "safe/new.txt").is_ok());
    symlink(&common, &linked.join("external-common"));
    error(
        resource(
            &r,
            &linked_w,
            RepositoryRole::Product,
            "external-common/config",
        ),
        "resource-symlink-escape",
    );
}

#[test]
fn trusted_query_environment_is_shared_with_churn() {
    if let Ok(product) = std::env::var("SUPERTASKR_WORKSPACE_CHILD_PRODUCT") {
        let r = resolver();
        let root = PathBuf::from(product);
        assert_eq!(development(&r, &root).product_root(), root);
        assert_eq!(
            r.measure_product_identity(&root, "HEAD")
                .unwrap()
                .selected_commit
                .as_deref(),
            Some(
                std::env::var("SUPERTASKR_WORKSPACE_CHILD_ID")
                    .unwrap()
                    .as_str()
            )
        );
        return;
    }
    let fx = Fixture::new();
    git(
        &fx.records,
        &["commit", "--allow-empty", "-qm", "decoy selected commit"],
    );
    let trace_control = fx.dir.join("trace-refs-positive-control");
    let trace = Command::new("git")
        .current_dir(&fx.product)
        .args(["rev-parse", "HEAD"])
        .env("GIT_TRACE_REFS", &trace_control)
        .output()
        .unwrap();
    assert!(trace.status.success());
    assert!(
        trace_control.is_file(),
        "the trace-effect assertion requires actual tool support"
    );
    fs::remove_file(trace_control).unwrap();
    let decoy = fx.records.join(".git");
    let output = Command::new(std::env::current_exe().unwrap())
        .args([
            "--exact",
            "trusted_query_environment_is_shared_with_churn",
            "--nocapture",
        ])
        .env("SUPERTASKR_WORKSPACE_CHILD_PRODUCT", &fx.product)
        .env(
            "SUPERTASKR_WORKSPACE_CHILD_ID",
            git(&fx.product, &["rev-parse", "HEAD"]),
        )
        .env("GIT_DIR", &decoy)
        .env("GIT_WORK_TREE", &fx.records)
        .env("GIT_COMMON_DIR", &decoy)
        .env("GIT_CONFIG_COUNT", "1")
        .env("GIT_CONFIG_KEY_0", "core.bare")
        .env("GIT_CONFIG_VALUE_0", "true")
        .env("GIT_CONFIG_PARAMETERS", "'core.bare=true'")
        .env("GIT_SHALLOW_FILE", fx.dir.join("missing-shallow"))
        .env("GIT_TRACE", fx.dir.join("unexpected-trace"))
        .env("GIT_TRACE2_EVENT", fx.dir.join("unexpected-trace2"))
        .env("GIT_TRACE_REFS", fx.dir.join("unexpected-trace-refs"))
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "child failed: {} {}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(String::from_utf8_lossy(&output.stdout).contains("1 passed"));
    assert!(!fx.dir.join("unexpected-trace").exists());
    assert!(!fx.dir.join("unexpected-trace2").exists());
    assert!(!fx.dir.join("unexpected-trace-refs").exists());
}

fn node(product: &Path, operation: &str, commit: &str) -> Value {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap();
    let output=Command::new("node").current_dir(root).args(["--input-type=module","-e",r#"
      import {resolveWorkspace,resolveResource,measureProductIdentity} from './tools/e2e/scripts/workspace.mjs';
      const [product,operation,commit]=JSON.parse(process.env.SUPERTASKR_WORKSPACE_ORACLE);
      try {let value; if(operation==='identity')value=measureProductIdentity(product,{commit});
      else {const w=resolveWorkspace({productRoot:product,mode:operation==='product-only'?'product-only':'development',commit});
      const token=operation==='resource'?'safe/new.txt':operation==='resource-numeric-drive'?'1:/new.txt':'safe/existing.txt';
      value=operation.startsWith('resource')?resolveResource(w,{role:'records',path:token,source:'commit:captured'}):w;}
      console.log(JSON.stringify({ok:value}));}catch(e){console.log(JSON.stringify({error:e.code}));}
    "#]).env("SUPERTASKR_WORKSPACE_ORACLE",serde_json::to_string(&(product,operation,commit)).unwrap()).output().unwrap();
    assert!(
        output.status.success(),
        "Node oracle unavailable: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    serde_json::from_slice(&output.stdout).unwrap()
}
fn snapshot(root: &Path) -> BTreeMap<PathBuf, Vec<u8>> {
    fn walk(root: &Path, path: &Path, out: &mut BTreeMap<PathBuf, Vec<u8>>) {
        for entry in fs::read_dir(path).unwrap() {
            let path = entry.unwrap().path();
            let metadata = fs::symlink_metadata(&path).unwrap();
            let key = path.strip_prefix(root).unwrap().to_path_buf();
            if metadata.file_type().is_symlink() {
                out.insert(
                    key,
                    fs::read_link(&path)
                        .unwrap()
                        .to_string_lossy()
                        .as_bytes()
                        .to_vec(),
                );
            } else if metadata.is_dir() {
                out.insert(key, vec![]);
                walk(root, &path, out);
            } else {
                let mut bytes = format!(
                    "{:?}:{:?}:",
                    metadata.permissions(),
                    metadata.modified().unwrap()
                )
                .into_bytes();
                bytes.extend(fs::read(&path).unwrap());
                out.insert(key, bytes);
            }
        }
    }
    let mut out = BTreeMap::new();
    walk(root, root, &mut out);
    out
}
#[test]
fn native_and_node_semantics_agree_without_filesystem_or_ref_effects() {
    let fx = Fixture::new();
    let r = resolver();
    for mode in [WorkspaceMode::Development, WorkspaceMode::ProductOnly] {
        let operation = if mode == WorkspaceMode::Development {
            "development"
        } else {
            "product-only"
        };
        assert_eq!(
            node(&fx.product, operation, "HEAD"),
            json!({"ok":r.resolve_workspace(&fx.product,mode,"HEAD").unwrap()})
        );
    }
    fx.bind(&r, "HEAD");
    let before = snapshot(&fx.dir);
    assert!(!before.is_empty());
    for mode in [WorkspaceMode::Development, WorkspaceMode::ProductOnly] {
        let operation = if mode == WorkspaceMode::Development {
            "development"
        } else {
            "product-only"
        };
        assert_eq!(
            node(&fx.product, operation, "HEAD"),
            json!({"ok":r.resolve_workspace(&fx.product,mode,"HEAD").unwrap()})
        );
    }
    let w = development(&r, &fx.product);
    let native = r
        .resolve_resource(
            &w,
            ResourceRequest {
                role: Some(RepositoryRole::Records),
                path: "safe/new.txt",
                source: Some("commit:captured"),
            },
            &LegacyTokenMap::new(),
        )
        .unwrap();
    assert_eq!(node(&fx.product, "resource", "HEAD"), json!({"ok":native}));
    let existing = r
        .resolve_resource(
            &w,
            ResourceRequest {
                role: Some(RepositoryRole::Records),
                path: "safe/existing.txt",
                source: Some("commit:captured"),
            },
            &LegacyTokenMap::new(),
        )
        .unwrap();
    assert_eq!(
        node(&fx.product, "resource-existing", "HEAD"),
        json!({"ok":existing})
    );
    assert_eq!(
        node(&fx.product, "identity", "HEAD"),
        json!({"ok":r.measure_product_identity(&fx.product,"HEAD").unwrap()})
    );
    assert_eq!(
        snapshot(&fx.dir),
        before,
        "real file/ref contents changed during native and Node reads"
    );
    // Demonstrate the effect witness catches both ordinary files and real refs.
    fs::write(fx.product.join("effect-control"), "detect me").unwrap();
    assert_ne!(snapshot(&fx.dir), before);
    fs::remove_file(fx.product.join("effect-control")).unwrap();
    assert_eq!(snapshot(&fx.dir), before);
    git(
        &fx.product,
        &["update-ref", "refs/heads/effect-control", "HEAD"],
    );
    assert_ne!(snapshot(&fx.dir), before);
    git(
        &fx.product,
        &["update-ref", "-d", "refs/heads/effect-control"],
    );
    assert_eq!(snapshot(&fx.dir), before);
    fs::write(fx.product.join(WORKSPACE_BINDING_REL_PATH), "{").unwrap();
    assert_eq!(
        node(&fx.product, "development", "HEAD"),
        json!({"error":r.resolve_workspace(&fx.product,WorkspaceMode::Development,"HEAD").unwrap_err().code})
    );
    // A denied actual Git launch is observable and cannot pass as no work.
    struct DenyGit(RefCell<usize>);
    impl AccessObserver for DenyGit {
        fn before(&self, op: AccessOperation, _: &Path) -> io::Result<()> {
            if op == AccessOperation::Git {
                *self.0.borrow_mut() += 1;
                Err(io::Error::new(
                    io::ErrorKind::PermissionDenied,
                    "Git process trap",
                ))
            } else {
                Ok(())
            }
        }
    }
    let trap = DenyGit(RefCell::new(0));
    let denied = WorkspaceResolver::with_observer(Some(&trap)).unwrap();
    error(
        denied.resolve_workspace(&fx.product, WorkspaceMode::Development, "HEAD"),
        "product-repository-unavailable",
    );
    assert_eq!(*trap.0.borrow(), 1);
}
