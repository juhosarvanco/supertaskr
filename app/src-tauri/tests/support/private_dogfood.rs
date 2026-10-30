//! Explicit, bound private provenance context; compiled only by its opt-in caller.
use std::path::{Path, PathBuf};
pub fn records_root() -> PathBuf {
    use supertaskr_lib::workspace::{Layout, WorkspaceMode, WorkspaceResolver};
    let raw = std::env::var("SUPERTASKR_PRIVATE_DOGFOOD_CONTEXT").expect("select explicit bound private dogfood first");
    let context: serde_json::Value = serde_json::from_str(&raw).expect("private dogfood context JSON");
    let product = Path::new(context["productRoot"].as_str().expect("product origin"));
    let revision = context["productRevision"].as_str().expect("product revision");
    let compiled_source = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap().parent().unwrap().canonicalize().unwrap();
    assert_eq!(product.canonicalize().unwrap(), compiled_source, "compiled and selected product origins differ");
    assert!(revision.len() == 40 && revision.bytes().all(|byte| byte.is_ascii_hexdigit()), "full selected product revision required");
    let mut git = std::process::Command::new("git");
    git.args(["-C", product.to_str().unwrap(), "rev-parse", "HEAD"]);
    for (key, _) in std::env::vars_os() { if key.to_string_lossy().starts_with("GIT_") { git.env_remove(key); } }
    let head = git.output().expect("read selected product revision");
    assert!(head.status.success());
    assert_eq!(String::from_utf8(head.stdout).unwrap().trim(), revision, "selected source revision changed");
    let workspace = WorkspaceResolver::new().expect("native resolver").resolve_workspace(product, WorkspaceMode::Development, revision).expect("selected private binding must validate");
    assert_eq!(workspace.layout(), Layout::Split, "no implicit colocated board");
    assert_eq!(workspace.records_root(), Path::new(context["recordsRoot"].as_str().expect("records origin")), "selected private origin changed");
    workspace.records_root().to_path_buf()
}
