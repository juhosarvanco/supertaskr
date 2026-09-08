//! Shared helpers for in-module unit tests (T-003's TempTree pattern).
//! Compiled only under `cfg(test)`.

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

static COUNTER: AtomicU64 = AtomicU64::new(0);

/// Unique scratch dir under the system temp dir; removed on drop.
pub(crate) struct TempTree(PathBuf);

impl TempTree {
    pub(crate) fn new(tag: &str) -> Self {
        let dir = std::env::temp_dir().join(format!(
            "supertaskr-t009-{}-{}-{}",
            tag,
            std::process::id(),
            COUNTER.fetch_add(1, Ordering::SeqCst)
        ));
        fs::create_dir_all(&dir).expect("mk temp tree");
        Self(dir)
    }

    pub(crate) fn root(&self) -> &Path {
        &self.0
    }

    pub(crate) fn write(&self, rel: &str, content: &str) {
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

/// This repo's root: manifest-relative, four levels up
/// (app/src-tauri/crates/supertaskr-index -> repo). Same derivation as the
/// integration suites' `common::repo_root`, needed here because T-014's
/// registry reader is exercised against the live dogfood registry from an
/// in-module test.
pub(crate) fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .ancestors()
        .nth(4)
        .expect("repo root four levels up")
        .to_path_buf()
}
