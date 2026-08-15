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
            "nputer-t009-{}-{}-{}",
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
