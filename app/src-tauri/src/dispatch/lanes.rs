//! T-110: enumerate the lanes git has already written down.
//!
//! ```text
//! <repo>/.git/worktrees/<name>/gitdir -> /Users/…/nputer-T-110/.git
//! <repo>/.git/worktrees/<name>/HEAD   -> ref: refs/heads/task/T-110-lane-reader
//! ```
//!
//! **`gitdir` NAMES THE WORKTREE'S `.git` FILE, NOT THE WORKTREE.** The
//! card's problem statement says it "names the worktree's path"; the
//! bytes on disk say otherwise, measured on this repository's own four
//! live lanes at `d46f71f`, and the difference is one `parent()` call
//! that decides whether `exists_on_disk` is ever true. Reading the file
//! is what settled it.
//!
//! **THE TASK ID IS DERIVED BY A POSITIVE SHAPE, NEVER BY STRIPPING A
//! PREFIX** — the discipline [`crate::agent::adapter::validate_session_id`]
//! already applies one door down, and the reason is the same: these are
//! strings this project does not author. `strip_prefix("task/")` plus a
//! `split('-')` accepts `task/hotfix-please` and hands the board a task
//! id of `hotfix`; [`lane_task_id`] matches the WHOLE grammar and builds
//! the id out of the digits it validated. A branch that fails the shape
//! is a [`WorktreeEntry::NotALane`] carrying the [`BranchRejection`] that
//! named it — reported, never dropped, because a worktree the board
//! cannot classify is exactly the thing a reader needs told.
//!
//! **WHAT THIS DELIBERATELY DOES NOT DO.**
//!
//! - It does not follow a `.git` FILE to the common directory. Opening a
//!   worktree (this repository produces one per lane and one per drill)
//!   yields [`LaneScan::GitIsAFile`] — a typed refusal naming the case,
//!   which is what T-110's criterion asks for. Following it would answer
//!   a different question ("what lanes does my parent have") and is a
//!   ruling, not an implementation detail.
//! - It does not validate git ref names. `..`, a trailing `.lock` and
//!   the rest of `git-check-ref-format` are git's rules for what a ref
//!   MAY be called; this module asks only whether a branch is a LANE.
//! - It does not accept the older `tNNN-<slug>` branch spelling, which
//!   `docs/CONVENTIONS.md` records as live in this repository (37 of 69
//!   branches at `4d2f03c`) and explicitly not a mistake to fix. No
//!   worktree in the tree is on one, and `method/lane-protocol.md`'s
//!   spelling for a lane cut TODAY is `task/T-NNN-<slug>`. Such a
//!   worktree would be reported as [`WorktreeEntry::NotALane`] with
//!   [`BranchRejection::NotTheLaneNamespace`] — visible and wrong rather
//!   than invisible and wrong. Widening the grammar is a ruling
//!   (`T-110-s2`), and this comment is the trigger for it.

use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;

/// The one branch namespace a lane lives in (`method/lane-protocol.md`
/// as this project spells it in `docs/CONVENTIONS.md`: branch
/// `task/T-NNN-<slug>`).
pub const LANE_NAMESPACE: &str = "task";

/// The symbolic-ref prefix git writes into a `HEAD` file for a branch.
/// Git's own format, matched as a whole literal.
pub const HEAD_REF_MARKER: &str = "ref: ";

/// Where a branch ref lives. Also git's own format.
pub const HEADS_NAMESPACE: &str = "refs/heads/";

/// Longest branch name this reader will consider. Git has no such limit;
/// this one bounds the strings that reach the board.
pub const BRANCH_MAX_LEN: usize = 255;

/// Most digits a task id may carry. `T-001`…`T-124` today; six digits is
/// a million cards and still a bound.
pub const TASK_ID_MAX_DIGITS: usize = 6;

/// Biggest `gitdir` / `HEAD` file this reader will read. Both are a
/// single short line by construction; anything larger is a defect, not a
/// buffer to grow. The app can be pointed at a STRANGER's repository
/// (C-12's churn surface is the standing example), so the bound is a
/// safety property rather than tidiness.
pub const MAX_METADATA_BYTES: u64 = 4_096;

/// Most worktree entries this reader will return. Same reason: git's
/// bookkeeping directory is small by nature, and a repository that says
/// otherwise gets a FLOOR with `truncated: true` rather than an
/// unbounded allocation.
pub const MAX_WORKTREE_ENTRIES: usize = 4_096;

/// What `<repo>/.git/worktrees` had to say.
///
/// **FOUR OUTCOMES, AND NO TWO OF THEM ARE THE SAME EMPTY LIST.** That
/// is T-110's criterion in one type: `Scanned { entries: [] }` means the
/// directory exists and holds no lane, which is a different fact from
/// "this folder has no `.git`", from "it has a `.git` FILE" and from "it
/// has never had a worktree". A board that renders one string for all
/// four can report none of them.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum LaneScan {
    /// `.git/worktrees` was read. Entries are sorted by directory name,
    /// so the answer does not depend on the order the filesystem hands
    /// them back.
    Scanned {
        entries: Vec<WorktreeEntry>,
        /// [`MAX_WORKTREE_ENTRIES`] was reached: the list is a floor.
        truncated: bool,
    },
    /// No `.git` entry at this root at all.
    NotAGitRepository,
    /// `.git` is a FILE — this project folder is itself a worktree (or a
    /// submodule). Every lane in this repository is one, and every poison
    /// drill makes another.
    GitIsAFile,
    /// A `.git` directory with no `worktrees/` in it: a repository that
    /// has never registered a worktree, or one that has pruned them all.
    NoWorktreesDirectory,
    /// `.git/worktrees` exists and could not be listed — it is not a
    /// directory, or the read failed.
    WorktreesUnreadable,
}

/// One entry under `.git/worktrees/`.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum WorktreeEntry {
    /// A LANE: `HEAD` names a branch and the branch matches the lane
    /// grammar. These four fields are T-110's typed list.
    Lane {
        /// The `.git/worktrees/<name>` directory name. Git derives it
        /// from the worktree's basename and it is NOT the branch, NOT
        /// the task id, and not guaranteed to equal either.
        name: String,
        task_id: String,
        branch: String,
        worktree_path: String,
        /// The worktree directory is still there. `false` is a lane
        /// registered but pruned-but-not-removed — what a failed
        /// `git worktree remove` leaves behind, and precisely what a
        /// reader needs told.
        exists_on_disk: bool,
    },
    /// `HEAD` names a branch that is not lane-shaped.
    NotALane {
        name: String,
        branch: String,
        worktree_path: String,
        exists_on_disk: bool,
        reason: BranchRejection,
    },
    /// `HEAD` is an object id: a detached checkout. Every poison-drill
    /// worktree in this project is one, and `docs/CONVENTIONS.md` says
    /// in as many words that a detached entry is not a lane.
    Detached {
        name: String,
        worktree_path: String,
        exists_on_disk: bool,
    },
    /// The entry's own bookkeeping could not be read. Reported rather
    /// than skipped: a directory under `.git/worktrees` that answers
    /// nothing is a fact about the repository.
    Unreadable { name: String, defect: EntryDefect },
}

/// Why an entry under `.git/worktrees/` could not be turned into a lane.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum EntryDefect {
    /// Not a directory (a stray file under `.git/worktrees/`).
    NotADirectory,
    /// No `gitdir` file, or it could not be read.
    GitdirMissing,
    /// `gitdir` is larger than [`MAX_METADATA_BYTES`].
    GitdirTooLarge { len: u64 },
    /// `gitdir`'s bytes are not UTF-8. Never lossily converted — a path
    /// this reader cannot name is a defect, not a string with question
    /// marks in it.
    GitdirNotUtf8,
    /// `gitdir` is empty, or names a path with no parent directory.
    GitdirUnusable,
    /// No `HEAD` file, or it could not be read.
    HeadMissing,
    /// `HEAD` is larger than [`MAX_METADATA_BYTES`].
    HeadTooLarge { len: u64 },
    /// `HEAD`'s bytes are not UTF-8.
    HeadNotUtf8,
    /// `HEAD` is neither `ref: refs/heads/<branch>` nor an object id.
    HeadUnrecognised,
    /// `HEAD` is a symbolic ref outside `refs/heads/` — a checkout of a
    /// tag or a remote ref namespace.
    HeadNotABranch,
}

/// What a `HEAD` file said.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum HeadRef {
    /// `ref: refs/heads/<branch>` — the branch name, with git's own
    /// namespace matched and removed as a literal.
    Branch(String),
    /// An object id: a detached checkout.
    Detached,
}

/// Why a branch name is not a lane. Each variant names the part of the
/// grammar that failed, so "not a lane" is never a bare denial.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum BranchRejection {
    Empty,
    TooLong { len: usize },
    /// The first segment is not [`LANE_NAMESPACE`]. The older
    /// `tNNN-<slug>` spelling lands here; see this module's header.
    NotTheLaneNamespace,
    /// `task/` with nothing after it.
    NoTaskSegment,
    /// More slashes than the one the grammar has (`task/T-1-a/b`).
    ExtraSegment { segments: usize },
    /// The task segment does not open `T-`.
    NotATaskId,
    /// `task/T-` with no digits after it.
    NoDigits,
    /// A character in the id position that is neither a digit nor the
    /// slug separator (`task/T-11a-x`).
    IllegalIdChar { at: usize, ch: char },
    /// More than [`TASK_ID_MAX_DIGITS`] digits.
    TooManyDigits { len: usize },
    /// The digits are not followed by `-<slug>`.
    NoSlugSeparator,
    /// `task/T-110-` with nothing after the separator.
    EmptySlug,
    /// A byte outside the slug's character class.
    IllegalSlugChar { at: usize, ch: char },
}

/// THE READER. Enumerate the lanes `project_root` has registered.
///
/// Reads, in order: `<project_root>/.git` (is it a directory at all),
/// `<project_root>/.git/worktrees` (is there any bookkeeping), and then
/// each entry's `gitdir` and `HEAD`. It opens no process, writes no
/// byte, and follows no path it was not given by git's own files.
pub fn read_lanes(project_root: &Path) -> LaneScan {
    let dot_git = project_root.join(".git");
    let meta = match fs::symlink_metadata(&dot_git) {
        Ok(meta) => meta,
        Err(_) => return LaneScan::NotAGitRepository,
    };
    if !meta.is_dir() {
        // A `.git` FILE is the worktree-of-a-worktree case; a symlink is
        // not a directory either, and this reader does not chase one.
        return LaneScan::GitIsAFile;
    }

    let worktrees_dir = dot_git.join("worktrees");
    match fs::symlink_metadata(&worktrees_dir) {
        Err(_) => return LaneScan::NoWorktreesDirectory,
        Ok(meta) if !meta.is_dir() => return LaneScan::WorktreesUnreadable,
        Ok(_) => {}
    }

    let listing = match fs::read_dir(&worktrees_dir) {
        Ok(listing) => listing,
        Err(_) => return LaneScan::WorktreesUnreadable,
    };

    // Collect names first and SORT them: `read_dir` order is whatever the
    // filesystem says, and a board that reorders itself between two reads
    // of an unchanged repository is reporting noise as news.
    let mut names: Vec<String> = Vec::new();
    let mut truncated = false;
    for entry in listing.flatten() {
        match entry.file_name().into_string() {
            Ok(name) => names.push(name),
            // A directory name that is not UTF-8 cannot be a `<repo>`
            // relative path we could ever name back; counted as a
            // truncation of the answer rather than dropped in silence.
            Err(_) => truncated = true,
        }
    }
    names.sort();
    if names.len() > MAX_WORKTREE_ENTRIES {
        names.truncate(MAX_WORKTREE_ENTRIES);
        truncated = true;
    }

    let entries = names
        .into_iter()
        .map(|name| read_entry(&worktrees_dir, name))
        .collect();

    LaneScan::Scanned {
        entries,
        truncated,
    }
}

/// One `.git/worktrees/<name>` directory, turned into an entry.
fn read_entry(worktrees_dir: &Path, name: String) -> WorktreeEntry {
    let entry_dir = worktrees_dir.join(&name);
    match fs::symlink_metadata(&entry_dir) {
        Ok(meta) if meta.is_dir() => {}
        _ => {
            return WorktreeEntry::Unreadable {
                name,
                defect: EntryDefect::NotADirectory,
            }
        }
    }

    let gitdir_raw = match read_small(&entry_dir.join("gitdir"), MAX_METADATA_BYTES) {
        Ok(text) => text,
        Err(SmallRead::Missing) => {
            return WorktreeEntry::Unreadable {
                name,
                defect: EntryDefect::GitdirMissing,
            }
        }
        Err(SmallRead::TooLarge { len }) => {
            return WorktreeEntry::Unreadable {
                name,
                defect: EntryDefect::GitdirTooLarge { len },
            }
        }
        Err(SmallRead::NotUtf8) => {
            return WorktreeEntry::Unreadable {
                name,
                defect: EntryDefect::GitdirNotUtf8,
            }
        }
    };

    // `gitdir` holds the worktree's own `.git` FILE. The worktree is its
    // parent — measured, not assumed; see this module's header.
    let dot_git_path = PathBuf::from(gitdir_raw.trim_end_matches(['\n', '\r']));
    let worktree_path = match dot_git_path.parent() {
        Some(parent) if !parent.as_os_str().is_empty() => parent.to_path_buf(),
        _ => {
            return WorktreeEntry::Unreadable {
                name,
                defect: EntryDefect::GitdirUnusable,
            }
        }
    };
    let exists_on_disk = worktree_path.is_dir();
    let worktree_path_text = match worktree_path.into_os_string().into_string() {
        Ok(text) => text,
        Err(_) => {
            return WorktreeEntry::Unreadable {
                name,
                defect: EntryDefect::GitdirNotUtf8,
            }
        }
    };

    let head_raw = match read_small(&entry_dir.join("HEAD"), MAX_METADATA_BYTES) {
        Ok(text) => text,
        Err(SmallRead::Missing) => {
            return WorktreeEntry::Unreadable {
                name,
                defect: EntryDefect::HeadMissing,
            }
        }
        Err(SmallRead::TooLarge { len }) => {
            return WorktreeEntry::Unreadable {
                name,
                defect: EntryDefect::HeadTooLarge { len },
            }
        }
        Err(SmallRead::NotUtf8) => {
            return WorktreeEntry::Unreadable {
                name,
                defect: EntryDefect::HeadNotUtf8,
            }
        }
    };

    match parse_head(&head_raw) {
        Ok(HeadRef::Detached) => WorktreeEntry::Detached {
            name,
            worktree_path: worktree_path_text,
            exists_on_disk,
        },
        Ok(HeadRef::Branch(branch)) => match lane_task_id(&branch) {
            Ok(task_id) => WorktreeEntry::Lane {
                name,
                task_id,
                branch,
                worktree_path: worktree_path_text,
                exists_on_disk,
            },
            Err(reason) => WorktreeEntry::NotALane {
                name,
                branch,
                worktree_path: worktree_path_text,
                exists_on_disk,
                reason,
            },
        },
        Err(defect) => WorktreeEntry::Unreadable { name, defect },
    }
}

/// Why a small read failed.
enum SmallRead {
    Missing,
    TooLarge { len: u64 },
    NotUtf8,
}

/// Read a bookkeeping file, bounded, as UTF-8 — never lossily.
fn read_small(path: &Path, max: u64) -> Result<String, SmallRead> {
    let meta = fs::metadata(path).map_err(|_| SmallRead::Missing)?;
    if !meta.is_file() {
        return Err(SmallRead::Missing);
    }
    if meta.len() > max {
        return Err(SmallRead::TooLarge { len: meta.len() });
    }
    let bytes = fs::read(path).map_err(|_| SmallRead::Missing)?;
    String::from_utf8(bytes).map_err(|_| SmallRead::NotUtf8)
}

/// Parse a `HEAD` file's contents.
///
/// Git writes one of two things: a symbolic ref line, or an object id.
/// Both are matched as WHOLE shapes; anything else is a typed defect
/// rather than a guess.
pub fn parse_head(raw: &str) -> Result<HeadRef, EntryDefect> {
    let line = raw.trim_end_matches(['\n', '\r']);
    if let Some(rest) = line.strip_prefix(HEAD_REF_MARKER) {
        // The REF NAMESPACE is git's own literal, so matching and
        // removing it is reading git's format — not deriving an id by
        // stripping, which is what `lane_task_id` below refuses to do.
        let Some(branch) = rest.strip_prefix(HEADS_NAMESPACE) else {
            return Err(EntryDefect::HeadNotABranch);
        };
        if branch.is_empty() {
            return Err(EntryDefect::HeadNotABranch);
        }
        return Ok(HeadRef::Branch(branch.to_string()));
    }
    // A detached HEAD is an object id: SHA-1 is 40 hex, SHA-256 is 64.
    let looks_like_object_id = (line.len() == 40 || line.len() == 64)
        && line.chars().all(|ch| ch.is_ascii_hexdigit());
    if looks_like_object_id {
        return Ok(HeadRef::Detached);
    }
    Err(EntryDefect::HeadUnrecognised)
}

/// THE POSITIVE SHAPE. `task/T-<digits>-<slug>` matched whole, with the
/// task id BUILT from the digits that were validated.
///
/// The grammar:
///
/// ```text
/// lane-branch := "task" "/" "T" "-" digit{1,6} "-" slug
/// slug        := slug-char{1,}
/// slug-char   := ASCII alphanumeric | "-" | "_" | "."
/// ```
///
/// Every character is accounted for. Nothing is stripped and nothing is
/// inferred: `format!("T-{digits}")` is the id, so an id can only exist
/// where digits were found in the right place.
pub fn lane_task_id(branch: &str) -> Result<String, BranchRejection> {
    if branch.is_empty() {
        return Err(BranchRejection::Empty);
    }
    if branch.len() > BRANCH_MAX_LEN {
        return Err(BranchRejection::TooLong { len: branch.len() });
    }

    let segments: Vec<&str> = branch.split('/').collect();
    if segments.len() > 2 {
        return Err(BranchRejection::ExtraSegment {
            segments: segments.len(),
        });
    }
    if segments[0] != LANE_NAMESPACE {
        return Err(BranchRejection::NotTheLaneNamespace);
    }
    let task_segment = match segments.get(1) {
        Some(segment) if !segment.is_empty() => *segment,
        _ => return Err(BranchRejection::NoTaskSegment),
    };

    let mut chars = task_segment.char_indices();
    match chars.next() {
        Some((_, 'T')) => {}
        _ => return Err(BranchRejection::NotATaskId),
    }
    match chars.next() {
        Some((_, '-')) => {}
        _ => return Err(BranchRejection::NotATaskId),
    }

    let mut digits = String::new();
    let mut separator_at = None;
    for (at, ch) in chars {
        if ch.is_ascii_digit() {
            if separator_at.is_some() {
                // Digits after the separator are slug, not id.
                continue;
            }
            digits.push(ch);
            if digits.len() > TASK_ID_MAX_DIGITS {
                return Err(BranchRejection::TooManyDigits { len: digits.len() });
            }
        } else if ch == '-' && separator_at.is_none() {
            if digits.is_empty() {
                return Err(BranchRejection::NoDigits);
            }
            separator_at = Some(at);
        } else if separator_at.is_none() {
            // A non-digit before the separator: `T-11a-x` is not an id.
            return Err(BranchRejection::IllegalIdChar { at, ch });
        }
    }
    if digits.is_empty() {
        return Err(BranchRejection::NoDigits);
    }
    let Some(separator_at) = separator_at else {
        return Err(BranchRejection::NoSlugSeparator);
    };

    let slug = &task_segment[separator_at + 1..];
    if slug.is_empty() {
        return Err(BranchRejection::EmptySlug);
    }
    for (at, ch) in slug.char_indices() {
        if !(ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' || ch == '.') {
            return Err(BranchRejection::IllegalSlugChar { at, ch });
        }
    }

    Ok(format!("T-{digits}"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeMap;
    use std::sync::atomic::{AtomicU32, Ordering};

    // ---- fixtures, all of them in a temp directory ---------------------
    //
    // NOTHING HERE READS THIS REPOSITORY'S OWN `.git`, and that is a
    // requirement rather than a preference: four lanes and a drill
    // worktree were live while this was written, so a suite that read the
    // live tree would go red on its colleagues' work and green again when
    // they merged. Every byte below is written by the test that reads it.

    static NEXT: AtomicU32 = AtomicU32::new(0);

    /// A fresh temp directory nobody else in the process is using.
    fn scratch(label: &str) -> PathBuf {
        let n = NEXT.fetch_add(1, Ordering::SeqCst);
        let dir = std::env::temp_dir().join(format!(
            "nputer-t110-{label}-{}-{}-{n}",
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
    fn repo(label: &str) -> PathBuf {
        let root = scratch(label);
        fs::create_dir_all(root.join(".git")).expect(".git");
        root
    }

    /// Register a worktree the way git does: an entry directory holding
    /// `gitdir` (the worktree's own `.git` FILE) and `HEAD`.
    ///
    /// `on_disk` decides whether the worktree directory is actually
    /// created — the pruned-but-not-removed shape is this argument set
    /// to false, and nothing else.
    fn register(root: &Path, name: &str, head: &str, on_disk: bool) -> PathBuf {
        let entry = root.join(".git").join("worktrees").join(name);
        fs::create_dir_all(&entry).expect("entry dir");
        let worktree = root
            .parent()
            .expect("scratch has a parent")
            .join(format!("{}-{name}", root.file_name().unwrap().to_string_lossy()));
        if on_disk {
            fs::create_dir_all(&worktree).expect("worktree dir");
        }
        fs::write(entry.join("gitdir"), format!("{}\n", worktree.join(".git").display()))
            .expect("gitdir");
        fs::write(entry.join("HEAD"), format!("{head}\n")).expect("HEAD");
        worktree
    }

    fn branch_head(branch: &str) -> String {
        format!("ref: refs/heads/{branch}")
    }

    fn entries(scan: &LaneScan) -> &[WorktreeEntry] {
        match scan {
            LaneScan::Scanned { entries, .. } => entries,
            other => panic!("expected a scan, got {other:?}"),
        }
    }

    // ---- the seven fixture repositories the card enumerates ------------

    #[test]
    fn no_repository_is_its_own_answer_and_not_an_empty_list() {
        let root = scratch("norepo");
        assert_eq!(read_lanes(&root), LaneScan::NotAGitRepository);

        // POSITIVE CONTROL: the same directory, one `.git` later, stops
        // saying that — so "not a repository" is a reading of the tree
        // and not this function's only answer.
        fs::create_dir_all(root.join(".git")).expect(".git");
        assert_eq!(read_lanes(&root), LaneScan::NoWorktreesDirectory);
    }

    #[test]
    fn a_repository_with_no_worktrees_differs_from_one_whose_worktrees_are_all_gone() {
        // THE PROPERTY THE CARD NAMES: an empty list may never mean two
        // things. These two repositories both have zero lanes and they
        // answer differently.
        let never = repo("never");
        assert_eq!(read_lanes(&never), LaneScan::NoWorktreesDirectory);

        let pruned = repo("pruned");
        fs::create_dir_all(pruned.join(".git").join("worktrees")).expect("worktrees dir");
        assert_eq!(
            read_lanes(&pruned),
            LaneScan::Scanned {
                entries: vec![],
                truncated: false
            }
        );
    }

    #[test]
    fn one_live_lane_reads_back_as_its_four_fields() {
        let root = repo("live");
        let worktree = register(
            &root,
            "nputer-T-110",
            &branch_head("task/T-110-lane-reader"),
            true,
        );

        let scan = read_lanes(&root);
        assert_eq!(
            entries(&scan),
            [WorktreeEntry::Lane {
                name: "nputer-T-110".to_string(),
                task_id: "T-110".to_string(),
                branch: "task/T-110-lane-reader".to_string(),
                worktree_path: worktree.to_string_lossy().to_string(),
                exists_on_disk: true,
            }]
            .as_slice()
        );
    }

    #[test]
    fn a_pruned_but_not_removed_lane_is_reported_with_exists_on_disk_false() {
        let root = repo("stale");
        let worktree = register(
            &root,
            "nputer-T-042",
            &branch_head("task/T-042-genesis-switch"),
            false,
        );
        assert!(!worktree.exists(), "the fixture must not create the worktree");

        let scan = read_lanes(&root);
        let [entry] = entries(&scan) else {
            panic!("expected one entry, got {:?}", entries(&scan))
        };
        // REPORTED, NOT OMITTED — the whole point of the criterion.
        assert_eq!(
            entry,
            &WorktreeEntry::Lane {
                name: "nputer-T-042".to_string(),
                task_id: "T-042".to_string(),
                branch: "task/T-042-genesis-switch".to_string(),
                worktree_path: worktree.to_string_lossy().to_string(),
                exists_on_disk: false,
            }
        );

        // POSITIVE CONTROL: `exists_on_disk` tracks the DIRECTORY and
        // nothing else. Create it and the same registration flips.
        fs::create_dir_all(&worktree).expect("worktree dir");
        let scan = read_lanes(&root);
        let [entry] = entries(&scan) else { panic!("one entry") };
        assert!(
            matches!(entry, WorktreeEntry::Lane { exists_on_disk: true, .. }),
            "expected the same lane to flip to true, got {entry:?}"
        );
    }

    #[test]
    fn a_branch_that_is_not_a_lane_is_reported_as_such_rather_than_dropped() {
        let root = repo("notalane");
        register(&root, "hotfix", &branch_head("hotfix/please"), true);

        let scan = read_lanes(&root);
        let [entry] = entries(&scan) else {
            panic!("expected one entry, got {:?}", entries(&scan))
        };
        match entry {
            WorktreeEntry::NotALane { branch, reason, .. } => {
                assert_eq!(branch.as_str(), "hotfix/please");
                assert_eq!(reason, &BranchRejection::NotTheLaneNamespace);
            }
            other => panic!("expected NotALane, got {other:?}"),
        }

        // POSITIVE CONTROL: the SAME fixture with a lane-shaped branch is
        // a lane. "Reported as not a lane" therefore differs from "the
        // reader saw nothing here", which is the only thing that makes
        // the assertion above mean anything (CONVENTIONS: a negative
        // assertion needs a positive control).
        let root = repo("notalane-control");
        register(&root, "hotfix", &branch_head("task/T-9-x"), true);
        let scan = read_lanes(&root);
        let [entry] = entries(&scan) else { panic!("one entry") };
        assert!(
            matches!(entry, WorktreeEntry::Lane { task_id, .. } if task_id.as_str() == "T-9"),
            "expected a lane, got {entry:?}"
        );
    }

    #[test]
    fn a_detached_head_is_not_a_lane_and_says_so_by_name() {
        let root = repo("detached");
        // Every poison drill in this project produces exactly this.
        register(
            &root,
            "drill-T-110",
            "d46f71f7e036d87629f46efdb65f4b070b89cb36",
            true,
        );
        let scan = read_lanes(&root);
        let [entry] = entries(&scan) else { panic!("one entry") };
        assert!(
            matches!(entry, WorktreeEntry::Detached { name, .. } if name.as_str() == "drill-T-110"),
            "expected Detached, got {entry:?}"
        );

        // POSITIVE CONTROL: a SHA-256 object id detaches too, and one
        // character off a valid id is a defect rather than a lane.
        let root = repo("detached-256");
        register(&root, "d", &"a".repeat(64), true);
        assert!(matches!(
            &entries(&read_lanes(&root))[0],
            WorktreeEntry::Detached { .. }
        ));
        let root = repo("detached-bad");
        register(&root, "d", &"z".repeat(40), true);
        assert!(
            matches!(
                &entries(&read_lanes(&root))[0],
                WorktreeEntry::Unreadable {
                    defect: EntryDefect::HeadUnrecognised,
                    ..
                }
            ),
            "40 non-hex characters are not an object id"
        );
    }

    #[test]
    fn a_dot_git_file_rather_than_a_directory_is_its_own_typed_refusal() {
        // The worktree-of-a-worktree case, which this repository produces
        // every time a lane is cut and every time an agent drills.
        let root = scratch("gitfile");
        fs::write(
            root.join(".git"),
            "gitdir: /Users/somebody/Projects/nputer/.git/worktrees/nputer-T-110\n",
        )
        .expect(".git file");
        assert_eq!(read_lanes(&root), LaneScan::GitIsAFile);

        // POSITIVE CONTROL: the refusal is about the FILE, not about the
        // directory being unreadable in general — same root, `.git` as a
        // directory, and the reader proceeds.
        fs::remove_file(root.join(".git")).expect("rm .git");
        fs::create_dir_all(root.join(".git").join("worktrees")).expect(".git dir");
        assert_eq!(
            read_lanes(&root),
            LaneScan::Scanned {
                entries: vec![],
                truncated: false
            }
        );
    }

    #[test]
    fn worktrees_that_is_not_a_directory_is_distinct_from_having_none() {
        let root = repo("wtfile");
        fs::write(root.join(".git").join("worktrees"), b"not a directory").expect("worktrees file");
        assert_eq!(read_lanes(&root), LaneScan::WorktreesUnreadable);
    }

    // ---- the shapes an entry can be broken in --------------------------

    #[test]
    fn every_entry_defect_is_named_rather_than_dropped() {
        let root = repo("defects");
        let base = root.join(".git").join("worktrees");

        // A stray FILE under .git/worktrees.
        fs::create_dir_all(&base).expect("worktrees");
        fs::write(base.join("astray"), b"x").expect("stray file");

        // A directory with no gitdir.
        fs::create_dir_all(base.join("bnogitdir")).expect("dir");
        fs::write(base.join("bnogitdir").join("HEAD"), b"ref: refs/heads/task/T-1-a\n")
            .expect("HEAD");

        // A gitdir that is not UTF-8.
        fs::create_dir_all(base.join("cbadutf8")).expect("dir");
        fs::write(base.join("cbadutf8").join("gitdir"), [0xff, 0xfe, 0x2f]).expect("gitdir");
        fs::write(base.join("cbadutf8").join("HEAD"), b"ref: refs/heads/task/T-1-a\n")
            .expect("HEAD");

        // A gitdir with no parent path.
        fs::create_dir_all(base.join("dnoparent")).expect("dir");
        fs::write(base.join("dnoparent").join("gitdir"), b"\n").expect("gitdir");
        fs::write(base.join("dnoparent").join("HEAD"), b"ref: refs/heads/task/T-1-a\n")
            .expect("HEAD");

        // A missing HEAD.
        fs::create_dir_all(base.join("enohead")).expect("dir");
        fs::write(base.join("enohead").join("gitdir"), b"/tmp/somewhere/.git\n").expect("gitdir");

        // A HEAD pointing outside refs/heads/.
        fs::create_dir_all(base.join("ftag")).expect("dir");
        fs::write(base.join("ftag").join("gitdir"), b"/tmp/somewhere/.git\n").expect("gitdir");
        fs::write(base.join("ftag").join("HEAD"), b"ref: refs/tags/v1\n").expect("HEAD");

        // An oversized HEAD.
        fs::create_dir_all(base.join("ghuge")).expect("dir");
        fs::write(base.join("ghuge").join("gitdir"), b"/tmp/somewhere/.git\n").expect("gitdir");
        fs::write(
            base.join("ghuge").join("HEAD"),
            vec![b'a'; MAX_METADATA_BYTES as usize + 1],
        )
        .expect("HEAD");

        let scan = read_lanes(&root);
        let named: BTreeMap<&str, &EntryDefect> = entries(&scan)
            .iter()
            .filter_map(|entry| match entry {
                WorktreeEntry::Unreadable { name, defect } => Some((name.as_str(), defect)),
                _ => None,
            })
            .collect();

        assert_eq!(
            named,
            BTreeMap::from([
                ("astray", &EntryDefect::NotADirectory),
                ("bnogitdir", &EntryDefect::GitdirMissing),
                ("cbadutf8", &EntryDefect::GitdirNotUtf8),
                ("dnoparent", &EntryDefect::GitdirUnusable),
                ("enohead", &EntryDefect::HeadMissing),
                ("ftag", &EntryDefect::HeadNotABranch),
                (
                    "ghuge",
                    &EntryDefect::HeadTooLarge {
                        len: MAX_METADATA_BYTES + 1
                    }
                ),
            ])
        );
        // Seven entries in, seven defects out: nothing was dropped on the
        // way, which is the property this body exists for.
        assert_eq!(entries(&scan).len(), named.len());
    }

    #[test]
    fn entries_come_back_sorted_by_name_whatever_the_filesystem_says() {
        let root = repo("order");
        for name in ["nputer-T-123", "nputer-T-010", "nputer-T-110"] {
            register(&root, name, &branch_head("task/T-1-x"), true);
        }
        let scan = read_lanes(&root);
        let names: Vec<&str> = entries(&scan)
            .iter()
            .map(|entry| match entry {
                WorktreeEntry::Lane { name, .. } => name.as_str(),
                other => panic!("expected lanes, got {other:?}"),
            })
            .collect();
        assert_eq!(names, ["nputer-T-010", "nputer-T-110", "nputer-T-123"]);
    }

    // ---- the positive shape, from both sides ---------------------------

    #[test]
    fn the_lane_grammar_accepts_exactly_the_lane_spelling() {
        assert_eq!(lane_task_id("task/T-110-lane-reader").unwrap(), "T-110");
        assert_eq!(lane_task_id("task/T-001-task-parser").unwrap(), "T-001");
        assert_eq!(lane_task_id("task/T-9-x").unwrap(), "T-9");
        // The slug may carry digits, dots and underscores; the id is the
        // FIRST digit run and the separator is the first hyphen after it.
        assert_eq!(lane_task_id("task/T-110-s3-two.lanes_one").unwrap(), "T-110");
        assert_eq!(lane_task_id("task/T-123456-x").unwrap(), "T-123456");
    }

    #[test]
    fn the_lane_grammar_names_what_failed_instead_of_returning_nothing() {
        // Each row is a DIFFERENT reason, so "refused" is never one
        // undifferentiated answer.
        let cases: Vec<(&str, BranchRejection)> = vec![
            ("", BranchRejection::Empty),
            ("main", BranchRejection::NotTheLaneNamespace),
            // The older `tNNN-` spelling this repository still carries.
            ("t042-genesis-switch", BranchRejection::NotTheLaneNamespace),
            ("tasks/T-110-x", BranchRejection::NotTheLaneNamespace),
            ("Task/T-110-x", BranchRejection::NotTheLaneNamespace),
            ("task/", BranchRejection::NoTaskSegment),
            ("task/T-110-x/y", BranchRejection::ExtraSegment { segments: 3 }),
            ("task/hotfix-please", BranchRejection::NotATaskId),
            ("task/X-110-x", BranchRejection::NotATaskId),
            ("task/T110-x", BranchRejection::NotATaskId),
            ("task/T-", BranchRejection::NoDigits),
            ("task/T--x", BranchRejection::NoDigits),
            (
                "task/T-11a-x",
                BranchRejection::IllegalIdChar { at: 4, ch: 'a' },
            ),
            ("task/T-1234567-x", BranchRejection::TooManyDigits { len: 7 }),
            ("task/T-110", BranchRejection::NoSlugSeparator),
            ("task/T-110-", BranchRejection::EmptySlug),
            (
                "task/T-110-lane reader",
                BranchRejection::IllegalSlugChar { at: 4, ch: ' ' },
            ),
            (
                "task/T-110-lane~reader",
                BranchRejection::IllegalSlugChar { at: 4, ch: '~' },
            ),
        ];
        for (branch, expected) in cases {
            assert_eq!(
                lane_task_id(branch),
                Err(expected.clone()),
                "branch {branch:?} should be refused as {expected:?}"
            );
        }
        // `task/T-1-` is nine characters, so this is the bound plus nine.
        assert_eq!(
            lane_task_id(&format!("task/T-1-{}", "a".repeat(BRANCH_MAX_LEN))),
            Err(BranchRejection::TooLong {
                len: BRANCH_MAX_LEN + 9
            })
        );
    }

    #[test]
    fn the_id_is_built_from_validated_digits_and_never_stripped_off_a_prefix() {
        // THE COUNTEREXAMPLE THE CRITERION IS ABOUT. A prefix strip
        // (`branch.strip_prefix("task/")` then take up to the first
        // hyphen) accepts every string below and hands the board an id.
        // The positive shape refuses all four, each for its own reason.
        // `task/-110-x` is deliberately NOT in this list: a prefix strip
        // yields an EMPTY id for it, so it is refused by both
        // implementations and would prove nothing. The control below
        // caught that on its first run, which is the whole reason it is
        // written as a control rather than as a comment.
        for hostile in ["task/hotfix-please", "task/T110-x", "task/main", "task/T-x-110"] {
            let stripped = hostile
                .strip_prefix("task/")
                .and_then(|rest| rest.split('-').next())
                .filter(|id| !id.is_empty());
            assert!(
                stripped.is_some(),
                "the counterexample must be one a prefix strip ACCEPTS, or this body proves nothing"
            );
            assert!(
                lane_task_id(hostile).is_err(),
                "{hostile:?} must not be a lane"
            );
        }
    }

    #[test]
    fn head_is_parsed_as_a_whole_shape() {
        assert_eq!(
            parse_head("ref: refs/heads/task/T-110-lane-reader\n"),
            Ok(HeadRef::Branch("task/T-110-lane-reader".to_string()))
        );
        assert_eq!(
            parse_head("ref: refs/heads/main\r\n"),
            Ok(HeadRef::Branch("main".to_string()))
        );
        assert_eq!(
            parse_head("d46f71f7e036d87629f46efdb65f4b070b89cb36"),
            Ok(HeadRef::Detached)
        );
        assert_eq!(parse_head(""), Err(EntryDefect::HeadUnrecognised));
        assert_eq!(parse_head("ref: refs/heads/"), Err(EntryDefect::HeadNotABranch));
        assert_eq!(
            parse_head("ref: refs/remotes/origin/main"),
            Err(EntryDefect::HeadNotABranch)
        );
        assert_eq!(
            parse_head("d46f71f7e036d87629f46efdb65f4b070b89cb3"),
            Err(EntryDefect::HeadUnrecognised),
            "39 hex characters are not an object id"
        );
    }

    // ---- the write set, asserted rather than assumed -------------------

    /// Every file under `root`, path → bytes. Small fixtures only.
    fn snapshot(root: &Path) -> BTreeMap<PathBuf, Vec<u8>> {
        let mut out = BTreeMap::new();
        let mut stack = vec![root.to_path_buf()];
        while let Some(dir) = stack.pop() {
            for entry in fs::read_dir(&dir).expect("read_dir").flatten() {
                let path = entry.path();
                let meta = fs::symlink_metadata(&path).expect("metadata");
                if meta.is_dir() {
                    stack.push(path.clone());
                    // Record the directory itself, so a CREATED empty
                    // directory is a difference too.
                    out.insert(path, Vec::new());
                } else {
                    let bytes = fs::read(&path).unwrap_or_default();
                    out.insert(path, bytes);
                }
            }
        }
        out
    }

    #[test]
    fn the_reader_writes_nothing() {
        let root = repo("writeset");
        register(&root, "nputer-T-110", &branch_head("task/T-110-lane-reader"), true);
        register(&root, "nputer-T-042", &branch_head("task/T-042-x"), false);
        register(&root, "hotfix", &branch_head("hotfix/please"), true);
        register(&root, "drill", "d46f71f7e036d87629f46efdb65f4b070b89cb36", true);

        let before = snapshot(&root);
        let scan = read_lanes(&root);
        let after = snapshot(&root);

        assert_eq!(entries(&scan).len(), 4, "the reader must have done its work");
        assert_eq!(
            before.keys().collect::<Vec<_>>(),
            after.keys().collect::<Vec<_>>(),
            "the reader created or removed a path"
        );
        assert_eq!(before, after, "the reader changed a byte");

        // POSITIVE CONTROL: the snapshot comparison can fail. Without
        // this, "nothing changed" is equally satisfied by a snapshot that
        // sees nothing at all.
        fs::write(root.join(".git").join("planted"), b"x").expect("plant");
        assert_ne!(before, snapshot(&root), "the snapshot is inert");
    }

    #[test]
    fn no_subprocess_in_this_module() {
        // The module's own source, read at COMPILE time — this body opens
        // no file and runs no process to make its point.
        const SOURCE: &str = include_str!("lanes.rs");
        const MOD_SOURCE: &str = include_str!("mod.rs");

        // Assembled at runtime so the needles never appear literally in
        // the file being swept — otherwise this body would find itself.
        let needles = [
            format!("Command{}new", "::"),
            format!("std{}process{}Command", "::", "::"),
            format!("{}output()", "."),
            format!("{}spawn()", "."),
            format!("Stdio{}", "::"),
        ];
        for needle in &needles {
            assert!(
                !SOURCE.contains(needle.as_str()),
                "{needle} appears in the reader: this module is a FILE READ (ADR-003)"
            );
            assert!(!MOD_SOURCE.contains(needle.as_str()), "{needle} appears in mod.rs");
        }

        // POSITIVE CONTROL: the sweep's predicate is not inert.
        let planted = format!("let child = Command{}new(\"git\");", "::");
        assert!(
            needles.iter().any(|needle| planted.contains(needle.as_str())),
            "the sweep would not notice a subprocess if one were added"
        );
        // And the sweep is looking at the real file rather than an empty
        // string: the reader's own entry point is in it.
        assert!(SOURCE.contains("pub fn read_lanes"));
    }
}
