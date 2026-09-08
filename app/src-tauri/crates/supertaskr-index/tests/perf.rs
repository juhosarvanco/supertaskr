//! Perf harness (plan §8) — `#[ignore]`d so the default suite never
//! flakes; run explicitly on a RELEASE build (tree-sitter's C grammars at
//! -O0 are several times slower; debug numbers are not the criterion):
//!
//!   cargo test --release -p supertaskr-index --test perf -- --ignored --nocapture
//!
//! Asserts only generous 3x ceilings (1500 ms cold / 150 ms incremental);
//! the real <500 ms / <50 ms criterion numbers are demonstrated on
//! release builds and recorded in the task's implementation notes.

mod common;

use std::path::Path;
use std::time::Instant;

use supertaskr_index::{index, IndexOptions};

/// Copy the repo's walkable content (skip the heavyweight generated
/// trees) so the single-file-edit trial never mutates the real repo.
fn copy_repo_to(dst: &Path) {
    fn copy_dir(from: &Path, to: &Path) {
        for entry in std::fs::read_dir(from).expect("read dir") {
            let entry = entry.expect("entry");
            let name = entry.file_name();
            let name = name.to_str().unwrap_or("");
            if matches!(name, ".git" | "node_modules" | "target" | "dist") {
                continue;
            }
            let src = entry.path();
            let meta = std::fs::symlink_metadata(&src).expect("meta");
            if meta.file_type().is_symlink() {
                continue;
            }
            let dst = to.join(name);
            if meta.is_dir() {
                std::fs::create_dir_all(&dst).expect("mkdir");
                copy_dir(&src, &dst);
            } else if meta.is_file() {
                std::fs::copy(&src, &dst).expect("copy");
            }
        }
    }
    copy_dir(&common::repo_root(), dst);
}

fn ms(run: impl FnOnce()) -> u128 {
    let start = Instant::now();
    run();
    start.elapsed().as_millis()
}

#[test]
#[ignore = "perf harness: run on a release build (see module docs)"]
fn perf_cold_and_incremental_within_ceilings() {
    // COLD: 5 trials against the real repo, read-only (no cache).
    let cold_opts = IndexOptions {
        root: common::repo_root(),
        ..Default::default()
    };
    let mut cold: Vec<u128> = Vec::new();
    for _ in 0..5 {
        cold.push(ms(|| {
            index(&cold_opts).expect("cold index");
        }));
    }

    // INCREMENTAL: warm cache, exactly one file changed per trial —
    // on a copy, so the real repo is never mutated.
    let copy = common::TempTree::new("perf-copy");
    copy_repo_to(copy.root());
    let cache = common::TempTree::new("perf-cache");
    let warm_opts = IndexOptions {
        root: copy.root().to_path_buf(),
        cache_dir: Some(cache.root().to_path_buf()),
        ..Default::default()
    };
    index(&warm_opts).expect("prime cache");
    let edited = copy.root().join("app/src/main.tsx");
    assert!(edited.is_file(), "expected app/src/main.tsx in the copy");
    let original = std::fs::read_to_string(&edited).expect("read main.tsx");
    let mut warm: Vec<u128> = Vec::new();
    for trial in 0..5 {
        std::fs::write(
            &edited,
            format!("{original}\n// perf trial {trial}\n"),
        )
        .expect("edit one file");
        warm.push(ms(|| {
            index(&warm_opts).expect("incremental index");
        }));
    }

    println!("perf cold ms (5 trials, this repo): {cold:?}");
    println!("perf incremental ms (5 trials, 1-file edit): {warm:?}");
    let cold_max = *cold.iter().max().expect("cold max");
    let warm_max = *warm.iter().max().expect("warm max");
    assert!(cold_max < 1500, "cold {cold_max}ms >= 3x ceiling (criterion 500ms)");
    assert!(warm_max < 150, "incremental {warm_max}ms >= 3x ceiling (criterion 50ms)");
}
