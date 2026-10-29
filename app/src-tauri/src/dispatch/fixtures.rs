//! T-110: the fixture repositories both halves of this module are proved
//! against, in ONE place.
//!
//! **NOTHING HERE READS THIS REPOSITORY'S OWN `.git`, and that is a
//! requirement rather than a preference.** Several lanes and drill
//! worktrees are live in this project at any moment, so a suite that read
//! the live tree would go red on its colleagues' work and green again
//! when they merged — non-deterministic by construction. Every byte a
//! body reads is written by these helpers first, in a temp directory.
//!
//! **AND THEY LIVE HERE RATHER THAN IN EACH TEST MODULE** because the
//! join's claim is *"the reader's output joined against the board"*: a
//! join proved against a hand-built `LaneScan` value would be proved
//! against a fiction, so `join.rs`'s bodies run the REAL reader over
//! these REAL fixture directories. Two copies of `register` would be two
//! definitions of what git writes, which is the exact divergence T-110
//! exists to remove one layer up.

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU32, Ordering};

static NEXT: AtomicU32 = AtomicU32::new(0);

/// A fresh temp directory nobody else in the process is using.
pub fn scratch(label: &str) -> PathBuf {
    let n = NEXT.fetch_add(1, Ordering::SeqCst);
    let dir = std::env::temp_dir().join(format!(
        "supertaskr-t110-{label}-{}-{}-{n}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0)
    ));
    fs::create_dir_all(&dir).expect("scratch dir");
    dir
}

/// A project root with a `.git` DIRECTORY and no worktrees yet.
pub fn repo(label: &str) -> PathBuf {
    let root = scratch(label);
    fs::create_dir_all(root.join(".git")).expect(".git");
    root
}

/// A project root with a `.git/worktrees` directory and nothing in it —
/// the shape a repository has once every lane has been pruned, and the
/// one a `died` fixture needs (the scan must SUCCEED and be empty, not
/// refuse).
pub fn repo_with_worktrees_dir(label: &str) -> PathBuf {
    let root = repo(label);
    fs::create_dir_all(root.join(".git").join("worktrees")).expect("worktrees dir");
    root
}

/// Register a worktree the way git does: an entry directory holding
/// `gitdir` (the worktree's own `.git` FILE — not the worktree, see
/// `lanes.rs`'s header) and `HEAD`.
///
/// `on_disk` decides whether the worktree directory is actually created
/// — the pruned-but-not-removed shape is this argument set to false, and
/// nothing else.
pub fn register(root: &Path, name: &str, head: &str, on_disk: bool) -> PathBuf {
    let entry = root.join(".git").join("worktrees").join(name);
    fs::create_dir_all(&entry).expect("entry dir");
    let worktree = root
        .parent()
        .expect("scratch has a parent")
        .join(format!("{}-{name}", root.file_name().unwrap().to_string_lossy()));
    if on_disk {
        fs::create_dir_all(&worktree).expect("worktree dir");
    }
    fs::write(
        entry.join("gitdir"),
        format!("{}\n", worktree.join(".git").display()),
    )
    .expect("gitdir");
    fs::write(entry.join("HEAD"), format!("{head}\n")).expect("HEAD");
    worktree
}

/// The bytes git writes into a worktree's `HEAD` for a branch checkout.
pub fn branch_head(branch: &str) -> String {
    format!("ref: refs/heads/{branch}")
}

/// An authored representative project, with the actual reusable method bytes.
/// The temporary home is owned by the reader and removed when it is dropped.
pub struct ExampleFiles {
    root: PathBuf,
    inner: super::brief::DiskFiles,
}
impl ExampleFiles { pub fn root(&self) -> &Path { &self.root } }
impl super::brief::FileSource for ExampleFiles {
    fn read_text(&self, rel: &str) -> Result<String, super::brief::SourceMiss> { self.inner.read_text(rel) }
    fn list_dir(&self, rel: &str) -> Result<Vec<String>, super::brief::SourceMiss> { self.inner.list_dir(rel) }
}
impl Drop for ExampleFiles {
    fn drop(&mut self) { let _ = fs::remove_dir_all(&self.root); }
}
fn copy_example_tree(from: &Path, to: &Path) {
    fs::create_dir_all(to).expect("example directory");
    for entry in fs::read_dir(from).expect("example source directory") {
        let entry = entry.expect("example source entry");
        let target = to.join(entry.file_name());
        if entry.file_type().expect("example entry kind").is_dir() {
            copy_example_tree(&entry.path(), &target);
        } else {
            fs::copy(entry.path(), target).expect("copy example bytes");
        }
    }
}

/// Portable fixture arrangement only. Policy bytes have one authored home;
/// package commands come from the actual public contributor contract.
pub fn seed_example_project(root: &Path) {
    let source = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap().parent().unwrap().to_path_buf();
    copy_example_tree(&source.join("tools/e2e/fixtures/project"), root);
    copy_example_tree(&source.join("method"), &root.join("method"));
    let contract = fs::read_to_string(source.join("CONTRIBUTING.md")).expect("public contributor contract");
    let commands = contract.split("## Build & test\n").nth(1).expect("build/check section")
        .split("\n## ").next().expect("build/check body");
    fs::write(root.join("docs/conventions/commands.md"), format!("# Commands\n\n{commands}")).expect("example commands");
    let mut pointers = Vec::new();
    for name in ["commands", "policy"] {
        let rel = format!("docs/conventions/{name}.md");
        for line in fs::read_to_string(root.join(&rel)).expect("example chapter").lines() {
            if let Some(opener) = line.strip_prefix("- ") {
                pointers.push(format!("  - {rel} — {opener}"));
            }
        }
    }
    let template = fs::read_to_string(root.join("docs/CONVENTIONS.md")).expect("example index template");
    let prefix = template.split("## Build & test").next().expect("example index prefix");
    fs::write(root.join("docs/CONVENTIONS.md"), format!("{prefix}## Build & test\n\n{}\n", pointers.join("\n"))).expect("example rule index");
    for rel in ["app", "lib/parser", "tools/e2e", ".github"] {
        fs::create_dir_all(root.join(rel)).expect("example package directory");
    }
}

pub fn example_project() -> ExampleFiles {
    let root = scratch("authored-records");
    seed_example_project(&root);
    ExampleFiles { inner: super::brief::DiskFiles::new(&root), root }
}
