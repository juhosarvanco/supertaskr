//! Shared helpers for the integration suites.
//!
//! Materialization rule (plan §8): fixtures are copied to a temp tree
//! first, renaming `_gitignore` -> `.gitignore`, `_supertaskrignore` ->
//! `.supertaskrignore`, `_node_modules/` -> `node_modules/`, `_Cargo.toml` ->
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
            "supertaskr-t009-it-{}-{}-{}",
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

/// Give the OWNER the write bit back on a materialized file, keeping
/// every other bit the copy carries (T-216-s4).
///
/// `fs::copy` copies the source's permission bits. Since T-210 a lane
/// worktree's tracked files OUTSIDE its fence are `-r--r--r--`, and
/// `tests/fixtures/**` is outside almost every fence — so a fixture
/// materialized inside a lane arrived read-only and every body that then
/// EDITS the temp tree panicked with `PermissionDenied` instead of
/// running. Two bodies did, measured at `e648590` in this repository's
/// own lane for `T-216-s4`: `a_cycle_planted_into_a_fixture_reds_the_real
/// _process_and_is_named_as_a_path` (cli.rs) and
/// `incremental_reindex_after_an_edit_matches_a_fresh_index` (golden.rs),
/// the second one panicking inside `TempTree::write` here rather than in
/// its own file.
///
/// THE COPY IS THIS PROCESS'S OWN SCRATCH, removed on drop, so nothing
/// here wants the checkout's modes: a fixture materialized to be EDITED
/// is materialized writable. `| 0o200` rather than
/// `Permissions::set_readonly(false)`, which on Unix sets the write bit
/// for every class that can read — the exec bit and the group/other bits
/// a fixture may carry stay exactly as the copy found them.
fn unlock(path: &Path) {
    let mut perms = fs::metadata(path)
        .expect("stat materialized fixture file")
        .permissions();
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mode = perms.mode();
        perms.set_mode(mode | 0o200);
    }
    #[cfg(not(unix))]
    {
        perms.set_readonly(false);
    }
    fs::set_permissions(path, perms).expect("unlock materialized fixture file");
}

/// Copy a tree into a scratch destination, applying the materialization
/// renames and `unlock`ing every file it writes.
///
/// PUBLIC so the read-only-source property has a body of its own: the
/// defect only reproduces when the SOURCE is read-only, which the live
/// `tests/fixtures/**` tree is in a lane and is not anywhere else — a
/// control that leaned on the ambient tree would be green in the very
/// checkout a drill runs in. `golden.rs`'s
/// `a_materialized_fixture_is_writable_even_when_its_source_is_read_only`
/// manufactures the source instead.
pub fn copy_dir(from: &Path, to: &Path) {
    for entry in fs::read_dir(from).expect("read fixture dir") {
        let entry = entry.expect("fixture entry");
        let name = entry.file_name();
        let name = name.to_str().expect("utf8 fixture name");
        if name == "expected-graph.json" {
            continue;
        }
        let materialized = match name {
            "_gitignore" => ".gitignore",
            "_supertaskrignore" => ".supertaskrignore",
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
            unlock(&dst);
        }
    }
}

pub fn update_golden() -> bool {
    std::env::var("SUPERTASKR_UPDATE_GOLDEN").as_deref() == Ok("1")
}

/// This repo's root: manifest-relative, four levels up
/// (app/src-tauri/crates/supertaskr-index -> repo).
pub fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .ancestors()
        .nth(4)
        .expect("repo root four levels up")
        .to_path_buf()
}
