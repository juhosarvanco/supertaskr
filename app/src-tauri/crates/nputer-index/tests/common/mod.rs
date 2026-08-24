//! Shared helpers for the integration suites.
//!
//! Materialization rule (plan §8): fixtures are copied to a temp tree
//! first, renaming `_gitignore` -> `.gitignore`, `_nputerignore` ->
//! `.nputerignore`, `_node_modules/` -> `node_modules/`, `_Cargo.toml` ->
//! `Cargo.toml` at copy time — committed real forms would really apply
//! (the repo's root gitignore ignores node_modules/, a fixture's own
//! .gitignore would hide fixture files from git itself, and a committed
//! `Cargo.toml` under this crate's own tests/ is a manifest cargo could
//! stumble into: a fixture must never be a build input, T-010). No
//! symlinks are ever committed in fixtures; symlink tests build theirs at
//! runtime.

#![allow(dead_code)] // each integration test binary uses a subset

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

static COUNTER: AtomicU64 = AtomicU64::new(0);

/// Unique scratch dir under the system temp dir; removed on drop.
pub struct TempTree(PathBuf);

impl TempTree {
    pub fn new(tag: &str) -> Self {
        let dir = std::env::temp_dir().join(format!(
            "nputer-t009-it-{}-{}-{}",
            tag,
            std::process::id(),
            COUNTER.fetch_add(1, Ordering::SeqCst)
        ));
        fs::create_dir_all(&dir).expect("mk temp tree");
        Self(dir)
    }

    pub fn root(&self) -> &Path {
        &self.0
    }

    pub fn write(&self, rel: &str, content: &str) {
        let path = self.0.join(rel);
        fs::create_dir_all(path.parent().expect("parent")).expect("mkdirs");
        fs::write(path, content).expect("write");
    }
}

impl Drop for TempTree {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

pub fn fixture_source(name: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join(name)
}

/// Copy a committed fixture into a fresh temp tree, applying the
/// materialization renames. `expected-graph.json` is not part of the
/// tree under test and is skipped.
pub fn materialize_fixture(name: &str) -> TempTree {
    let tree = TempTree::new(&format!("fix-{name}"));
    copy_dir(&fixture_source(name), tree.root());
    tree
}

fn copy_dir(from: &Path, to: &Path) {
    for entry in fs::read_dir(from).expect("read fixture dir") {
        let entry = entry.expect("fixture entry");
        let name = entry.file_name();
        let name = name.to_str().expect("utf8 fixture name");
        if name == "expected-graph.json" {
            continue;
        }
        let materialized = match name {
            "_gitignore" => ".gitignore",
            "_nputerignore" => ".nputerignore",
            "_node_modules" => "node_modules",
            "_Cargo.toml" => "Cargo.toml",
            other => other,
        };
        let src = entry.path();
        let dst = to.join(materialized);
        if entry.file_type().expect("file type").is_dir() {
            fs::create_dir_all(&dst).expect("mkdir");
            copy_dir(&src, &dst);
        } else {
            fs::copy(&src, &dst).expect("copy fixture file");
        }
    }
}

pub fn update_golden() -> bool {
    std::env::var("NPUTER_UPDATE_GOLDEN").as_deref() == Ok("1")
}

/// This repo's root: manifest-relative, four levels up
/// (app/src-tauri/crates/nputer-index -> repo).
pub fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .ancestors()
        .nth(4)
        .expect("repo root four levels up")
        .to_path_buf()
}
