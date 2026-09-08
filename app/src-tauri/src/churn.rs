use std::collections::BTreeMap;
use std::ffi::OsString;
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};

use serde::Serialize;

use crate::agent::runner::{login_shell, validate_resolved_program};
use crate::docs_watch::{now_ms, sanitize_for_log, WatchState};

/// The map's CHURN surface (T-013): commits-per-path over a fixed
/// window, read by shelling out to `git` (ADR-013 / plan §0.0 item 6 —
/// no `git2` dependency; smaller surface, ADR-003 spirit).
///
/// THIS IS THE APP'S SECOND SUBPROCESS AND IT IS TREATED LIKE THE FIRST
/// (C-14's runner, ADR-003). Five properties hold by construction and
/// each is pinned by a test below:
///
/// 0. **Which `git` runs is RESOLVED by the app, never inherited.** The
///    first door (T-060) exists to hold exactly this, and T-013's first
///    draft did not: `Command::new("git")` plus `current_dir(root)` made
///    the child `chdir` into the opened project and only THEN resolve a
///    bare `git`, so a relative or empty `PATH` element resolved a `git`
///    shipped INSIDE the repository being read (a verifier ran it end to
///    end). Now [`resolve_git`] produces an ABSOLUTE, traversal-free,
///    name-checked path through the SAME gate the CLI resolver uses
///    ([`validate_resolved_program`], T-060's "one standard, applied at
///    every door"); the child's `PATH` is SET by the app to a
///    sanitized, absolute-only search list, so neither `current_dir` nor
///    a relative element can aim git's own helper resolution at the
///    project; and a `git` that cannot be resolved to a trusted absolute
///    path is a typed `Disabled { GitUnavailable }`, never a bare-name
///    spawn.
/// 1. **Every argv element is a compile-time literal.** Not one byte of
///    argv is formatted, interpolated or derived from anything — not
///    from the webview, not from the project path, not from a config
///    value. `argv_is_all_literals` walks the two argv arrays and
///    asserts it; `no_path_in_argv` asserts the project root never
///    appears in either. The root reaches git as the child's WORKING
///    DIRECTORY (`current_dir`) and nowhere else, which is also why
///    `-C <path>` is deliberately NOT used.
/// 2. **Never a shell.** `Command::new("git")` with an argv array;
///    there is no `sh -c` anywhere in this file and no string is ever
///    concatenated into a command line.
/// 3. **Nothing git says reaches the webview.** The outcome carries a
///    typed `reason` enum and counts — never a message, never a path
///    git printed, never a stderr line. A failure's detail goes to the
///    app's STDERR through `sanitize_for_log` (the T-063 stream
///    choice), where a human can read it and a canvas cannot. So "an
///    error string on the canvas" is unreachable rather than avoided.
/// 4. **A non-repo degrades, it does not break.** Every failure mode —
///    git missing, not a work tree, a repo with no commits, git exiting
///    non-zero — lands on `ChurnOutcome::Disabled` with its own reason,
///    and the pane disables the churn segment.
///
/// The output parser is the other half of the surface, and it is pure
/// over bytes (`parse_churn`) so it can be poisoned without a git.
/// `git log -z` does NOT quote paths, so a filename containing a
/// newline arrives raw; `is_safe_repo_relative` refuses it and every
/// refusal is COUNTED into `rejected` rather than dropped in silence.

/// The window the design's map-behavior screen names ("churn · 30d").
/// The plan's §4.6 draft said 90 days; the design bundle that supersedes
/// it draws 30 and the panel section T-012 shipped is already labelled
/// `churn · 30d`. 30 wins, and the divergence is recorded in the card.
pub const CHURN_WINDOW_DAYS: u32 = 30;

/// Commit ceiling — a bound on both the child's runtime and the buffer
/// we read back. Reaching it is a DEFINED degraded state (`truncated`),
/// never a silent drop.
pub const CHURN_MAX_COMMITS: usize = 5_000;

/// Distinct-path ceiling for the same reason.
pub const CHURN_MAX_PATHS: usize = 20_000;

/// The argv literals. Held as consts so the pin tests can read the same
/// bytes the child gets, and so nothing in this file is tempted to
/// `format!` one of them.
const ARG_SINCE: &str = "--since=30.days.ago";
const ARG_MAX_COUNT: &str = "--max-count=5000";

/// Probe argv: is this a work tree, and does it have a HEAD?
///
/// One invocation answers both, because `rev-parse` evaluates its
/// arguments in order: `--is-inside-work-tree` prints `true`/`false`
/// first, and only then does `HEAD` fail on a repo with no commits.
/// Measured on git 2.50.1 — four cases, four signatures:
///   work tree + history : exit 0,   stdout starts `true`
///   work tree, no commit: exit 128, stdout starts `true`
///   bare repository     : exit 0,   stdout starts `false`
///   not a repository    : exit 128, stdout empty
const PROBE_ARGV: &[&str] = &[
    "--no-optional-locks",
    // The fsmonitor clear rides BOTH argvs now (T-013 F1). It is not
    // exploitable through `rev-parse --is-inside-work-tree HEAD` on git
    // 2.50.1 — the verifier confirmed neither invocation triggers
    // fsmonitor — but the pair is one compile-time literal and carrying
    // it on only one of two invocations is an asymmetry a reader has to
    // reason about; defence in depth is cheaper than that footnote.
    "-c",
    "core.fsmonitor=",
    "rev-parse",
    "--is-inside-work-tree",
    "HEAD",
];

/// Log argv. `-z` is load-bearing: with it `--name-only` emits raw
/// NUL-terminated paths, so a path can never be confused with a
/// separator the way a newline-separated (and repo-config-quotable)
/// listing can. `--relative` scopes the answer to the working directory
/// and strips its prefix, so a project folder opened INSIDE a larger
/// repository can never be told about paths outside itself.
/// `--format=%x01%ct` marks each commit with a byte no accepted path may
/// contain, followed by its committer timestamp.
const LOG_ARGV: &[&str] = &[
    "--no-optional-locks",
    // A repository can point `core.fsmonitor` at a program git will
    // RUN. Reading a stranger's repo must not run their code, so it is
    // cleared on the command line, which outranks every config file.
    "-c",
    "core.fsmonitor=",
    "log",
    ARG_SINCE,
    "--no-merges",
    "--no-renames",
    ARG_MAX_COUNT,
    "-z",
    "--name-only",
    "--relative",
    "--format=%x01%ct",
];

/// Environment variables that would move git's idea of WHICH repository
/// it is reading, or hand it configuration or a program to execute. The
/// child's `PATH` is SET explicitly by [`run_git`] (property 0), and its
/// environment is otherwise inherited; these are the keys that survival
/// would let whatever launched the app steer.
///
/// **TWELVE since T-013 F1** (the verifier measured the list at nine and
/// named the three missing). The last three are the config-injection
/// triple that ranks at the same level as `-c` on the command line:
///   - `GIT_CONFIG_GLOBAL` / `GIT_CONFIG_SYSTEM` repoint the global and
///     system config files, and a config file can set `core.fsmonitor`
///     or an alias — measured: a `GIT_CONFIG_GLOBAL` pointing at a file
///     that sets `core.fsmonitor` DOES take effect.
///   - `GIT_CONFIG_COUNT` gates the numbered `GIT_CONFIG_KEY_<n>` /
///     `GIT_CONFIG_VALUE_<n>` inline-config family: git reads none of
///     that family when `GIT_CONFIG_COUNT` is absent, so removing the
///     count neutralises the whole triple with one key and there is no
///     per-`n` list to keep in sync.
const GIT_ENV_REMOVED: &[&str] = &[
    "GIT_DIR",
    "GIT_WORK_TREE",
    "GIT_COMMON_DIR",
    "GIT_INDEX_FILE",
    "GIT_OBJECT_DIRECTORY",
    "GIT_ALTERNATE_OBJECT_DIRECTORIES",
    "GIT_CEILING_DIRECTORIES",
    "GIT_EXTERNAL_DIFF",
    "GIT_PAGER",
    "GIT_CONFIG_GLOBAL",
    "GIT_CONFIG_SYSTEM",
    "GIT_CONFIG_COUNT",
];

/// Why the churn overlay is off. A CLOSED vocabulary: the frontend
/// renders one fixed sentence per variant, so no string git produced can
/// reach a screen.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ChurnDisabled {
    /// No project is open (nothing resolved at launch, nothing picked).
    NoProject,
    /// `git` could not be started at all (not installed, not on PATH).
    GitUnavailable,
    /// The project folder is not inside a git work tree (or is bare).
    NotAGitRepo,
    /// A work tree with no commits yet — nothing has churned because
    /// nothing has happened. Distinct from `NotAGitRepo` on purpose: a
    /// freshly `git init`ed genesis folder is the ordinary case.
    NoHistory,
    /// git ran and exited non-zero. The detail is on the app's stderr.
    GitFailed,
}

/// One path's churn inside the window.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChurnPath {
    /// Repo-relative, POSIX, containment-checked (`is_safe_repo_relative`).
    pub path: String,
    /// Commits in the window that touched it.
    pub commits: usize,
    /// Committer time of the most recent of those commits, ms since
    /// epoch; 0 when every marker for it failed to parse.
    pub last_commit_ms: u64,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum ChurnOutcome {
    Disabled {
        reason: ChurnDisabled,
    },
    Measured {
        window_days: u32,
        /// Commits in the window (markers seen), whether or not they
        /// contributed an accepted path.
        commits: usize,
        /// Sorted by path (BTreeMap order) — deterministic output.
        paths: Vec<ChurnPath>,
        /// A ceiling was reached: the answer is a floor, not the truth.
        truncated: bool,
        /// Entries the boundary REFUSED — control bytes, an escaping or
        /// absolute path, invalid UTF-8, an unparseable timestamp.
        /// Reported so a refusal is never silence.
        rejected: usize,
        measured_at_ms: u64,
    },
}

impl ChurnOutcome {
    pub fn disabled(reason: ChurnDisabled) -> Self {
        ChurnOutcome::Disabled { reason }
    }
}

/// What the probe learned.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum RepoProbe {
    Ready,
    NoHistory,
    NotAGitRepo,
    GitUnavailable,
}

/// A `git` the app resolved and trusts: an absolute, traversal-free,
/// name-checked, executable program (through the SHARED T-060 gate) plus
/// the sanitized `PATH` the child is GIVEN — never the app's own
/// inherited one. Both halves are property 0.
struct ResolvedGit {
    /// Absolute path to the `git` binary; passed to `Command::new`, so
    /// no `current_dir` and no `PATH` element can change which file runs.
    program: PathBuf,
    /// The child's `PATH`, SET not inherited: only the absolute,
    /// traversal-free directories of a sanitized search list, so git's
    /// own helper resolution cannot be aimed at the opened project.
    child_path: OsString,
}

/// The login-shell probe script — a compile-time literal, no
/// interpolation (property 1's discipline, applied to resolution too).
const GIT_LOGIN_PROBE: &str = "command -v git && echo SUPERTASKR_GIT_PATH=$PATH";

/// Resolve `git` to a trusted absolute path and a sanitized child `PATH`,
/// the same way C-14's CLI resolver resolves `claude` (T-060): a
/// login-shell PATH probe, then the SHARED shape gate, then a typed
/// refusal. Returns `None` when no trusted `git` can be found — the
/// caller turns that into `Disabled { GitUnavailable }`, never a
/// bare-name spawn.
///
/// **Why the probe DRIVER is mirrored here rather than called on the
/// runner's**: the runner's `login_shell_probe` / `which_in` are private
/// and hard-keyed to the `claude` adapter, and generalising them would
/// refactor the exact functions T-060's security rests on for no gain
/// here. What actually carries the security — the shape gate
/// [`validate_resolved_program`] and the name-checked shell selection
/// [`login_shell`] — is REUSED, not re-implemented, so the one standard
/// lives in one place (T-057).
fn resolve_git() -> Option<ResolvedGit> {
    let (login_answer, login_path) = login_shell_git();
    // The search list we resolve over AND hand to the child: the login
    // shell's rich PATH if we captured one, else the app's own.
    let raw_path = login_path.or_else(|| std::env::var("PATH").ok());
    resolve_git_from(login_answer, raw_path.as_deref())
}

/// The pure core of resolution, over explicit inputs — a test seam that
/// spawns nothing and reads no environment, so the relative/empty PATH
/// vectors can be driven without mutating this process's `PATH` (the
/// thread-unsafe move T-060-s3 warns against). `login_answer` is the
/// login shell's `command -v git` result if any; `raw_path` is the
/// search list, sanitized to absolute-only dirs for BOTH resolution and
/// the child's `PATH`, so a relative or empty element survives into
/// neither use.
fn resolve_git_from(login_answer: Option<PathBuf>, raw_path: Option<&str>) -> Option<ResolvedGit> {
    let dirs = sanitized_dirs(raw_path);

    // Candidate order mirrors the runner: the login shell's own
    // `command -v` answer first (still gated — a hostile shell PATH can
    // print a relative path), then a gated lookup over the sanitized
    // dirs. Nothing is executed on the way to refusing.
    let program = login_answer
        .filter(|p| validate_resolved_program(p, "git").is_ok())
        .or_else(|| which_git(&dirs))?;

    // The child at least gets git's own directory, so its siblings
    // resolve even if the sanitized search list came back empty.
    let mut child_dirs = dirs;
    if let Some(parent) = program.parent() {
        if parent.is_absolute() && !child_dirs.iter().any(|d| d == parent) {
            child_dirs.insert(0, parent.to_path_buf());
        }
    }
    let child_path = std::env::join_paths(&child_dirs).ok()?;
    Some(ResolvedGit { program, child_path })
}

/// Split a search path and keep only ABSOLUTE, traversal-free
/// directories — dropping the empty element (POSIX CWD), `.`, `..` and
/// any bare relative name. This is the list `current_dir(root)` must not
/// be able to steer, expressed as data.
fn sanitized_dirs(path: Option<&str>) -> Vec<PathBuf> {
    let Some(path) = path else {
        return Vec::new();
    };
    std::env::split_paths(path)
        .filter(|dir| {
            !dir.as_os_str().is_empty()
                && dir.is_absolute()
                && !dir.components().any(|c| {
                    matches!(
                        c,
                        std::path::Component::ParentDir | std::path::Component::CurDir
                    )
                })
        })
        .collect()
}

/// Gated PATH lookup for `git`, mirroring the runner's `which_in` for one
/// fixed name over an already-sanitized dir list: a candidate that is not
/// absolute/traversal-free/named `git`/executable produces NO answer
/// rather than a path `Command::new` would hand to the OS.
fn which_git(dirs: &[PathBuf]) -> Option<PathBuf> {
    dirs.iter()
        .map(|dir| dir.join("git"))
        .find(|candidate| validate_resolved_program(candidate, "git").is_ok())
}

/// Run the user's login shell — the name-checked one the CLI resolver
/// uses ([`login_shell`]) — with a fixed `command -v git` script, in the
/// APP's own working directory and NEVER `current_dir(root)`, so the
/// probe itself cannot resolve against the opened project. Its answer is
/// untrusted here; [`resolve_git`] gates it.
fn login_shell_git() -> (Option<PathBuf>, Option<String>) {
    if cfg!(not(unix)) {
        return (None, None);
    }
    let mut command = Command::new(login_shell());
    command
        .arg("-l")
        .arg("-c")
        .arg(GIT_LOGIN_PROBE)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null());
    let Ok(output) = command.output() else {
        return (None, None);
    };
    if !output.status.success() {
        return (None, None);
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut found: Option<PathBuf> = None;
    let mut login_path: Option<String> = None;
    for line in stdout.lines() {
        let line = line.trim();
        if let Some(rest) = line.strip_prefix("SUPERTASKR_GIT_PATH=") {
            login_path = Some(rest.to_string());
        } else if !line.is_empty() && found.is_none() {
            found = Some(PathBuf::from(line));
        }
    }
    (found, login_path)
}

/// Spawn the resolved `git` in `root` with a fixed argv. `Command::new`
/// gets the ABSOLUTE program (property 0), the child's `PATH` is SET from
/// `git.child_path` and never inherited, and every element of `argv` is a
/// `&'static str` by type (property 1).
fn run_git(git: &ResolvedGit, root: &Path, argv: &[&'static str]) -> Option<Output> {
    let mut command = Command::new(&git.program);
    command
        .args(argv)
        .current_dir(root)
        .env("PATH", &git.child_path)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    for key in GIT_ENV_REMOVED {
        command.env_remove(key);
    }
    match command.output() {
        Ok(output) => Some(output),
        Err(err) => {
            eprintln!(
                "[supertaskr] churn: git could not start: {}",
                sanitize_for_log(&err.to_string())
            );
            None
        }
    }
}

fn probe_repo(git: &ResolvedGit, root: &Path) -> RepoProbe {
    let Some(output) = run_git(git, root, PROBE_ARGV) else {
        return RepoProbe::GitUnavailable;
    };
    // The first line is `--is-inside-work-tree`'s answer; anything else
    // (including no line at all) means git never got that far.
    let stdout = String::from_utf8_lossy(&output.stdout);
    let first = stdout.lines().next().unwrap_or("").trim();
    if first != "true" {
        return RepoProbe::NotAGitRepo;
    }
    if output.status.success() {
        RepoProbe::Ready
    } else {
        RepoProbe::NoHistory
    }
}

/// Repo-relative POSIX path hygiene at the subprocess boundary — the
/// same stance `graph.ts` takes at the file boundary, plus a control-byte
/// refusal that `git log -z` makes necessary: `-z` does not quote, so a
/// filename may legitimately carry any byte except NUL and `/`.
///
/// A refused path is COUNTED, never dropped silently, and never renders:
/// nothing downstream prints a churn path, so a hostile name cannot
/// reach a canvas even if it were accepted.
pub fn is_safe_repo_relative(path: &str) -> bool {
    if path.is_empty() || path.len() > 4096 {
        return false;
    }
    if path.chars().any(|c| c.is_control()) {
        return false;
    }
    if path.starts_with('/') || path.contains('\\') {
        return false;
    }
    path.split('/')
        .all(|segment| !segment.is_empty() && segment != "." && segment != "..")
}

/// What `parse_churn` learned from one `git log` run.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct ParsedChurn {
    pub commits: usize,
    pub paths: Vec<ChurnPath>,
    pub rejected: usize,
    pub truncated_paths: bool,
}

/// Parse `git log -z --name-only --format=%x01%ct` output.
///
/// THE WIRE FORMAT, measured on git 2.50.1 rather than remembered
/// (fenced as `text`: an indented block here is a rustdoc DOCTEST, and
/// bare `cargo test` runs it — which is how this comment first turned
/// into a compile error):
///
/// ```text
/// \x01<ct>\0 \n<first path>\0 <path>\0 <path>\0 \x01<ct>\0 …
/// ```
///
/// `-z` NUL-terminates every entry, and the blank line git puts between
/// a commit header and its diff survives as a SINGLE `\n` glued to the
/// FRONT of that commit's first path entry — and only when the commit
/// has paths at all (an empty commit emits its marker and nothing else).
/// That byte is structural, so it is stripped from exactly one entry per
/// commit and from no other. Blanket-stripping a leading newline would
/// LAUNDER a hostile filename that begins with one; stripping only the
/// structural byte leaves `"\nevil"` still carrying its newline, so
/// `is_safe_repo_relative` still refuses it. The drill in the tests
/// below plants exactly that name.
pub fn parse_churn(stdout: &[u8]) -> ParsedChurn {
    let mut totals: BTreeMap<String, (usize, u64)> = BTreeMap::new();
    let mut parsed = ParsedChurn::default();
    let mut current_ct: Option<u64> = None;
    // Set the moment a marker is read; the next entry — if it is a path
    // — owns the structural newline.
    let mut expect_structural_newline = false;

    let mut entries = stdout.split(|byte| *byte == 0u8).peekable();
    while let Some(entry) = entries.next() {
        // `split` yields a trailing empty slice after the final NUL.
        if entry.is_empty() && entries.peek().is_none() {
            break;
        }
        if entry.first() == Some(&0x01) {
            parsed.commits += 1;
            expect_structural_newline = true;
            current_ct = match std::str::from_utf8(&entry[1..]).ok().and_then(|text| {
                let trimmed = text.trim();
                if trimmed.is_empty() {
                    None
                } else {
                    trimmed.parse::<u64>().ok()
                }
            }) {
                Some(seconds) => Some(seconds.saturating_mul(1000)),
                None => {
                    // A marker whose timestamp is not a number: the
                    // commit still COUNTS (it happened), its recency does
                    // not, and the refusal is reported.
                    parsed.rejected += 1;
                    None
                }
            };
            continue;
        }

        let body = if expect_structural_newline && entry.first() == Some(&b'\n') {
            &entry[1..]
        } else {
            entry
        };
        expect_structural_newline = false;

        let Ok(path) = std::str::from_utf8(body) else {
            parsed.rejected += 1;
            continue;
        };
        if !is_safe_repo_relative(path) {
            parsed.rejected += 1;
            continue;
        }
        match totals.get_mut(path) {
            Some(slot) => {
                slot.0 += 1;
                slot.1 = slot.1.max(current_ct.unwrap_or(0));
            }
            None => {
                if totals.len() >= CHURN_MAX_PATHS {
                    parsed.truncated_paths = true;
                    continue;
                }
                totals.insert(path.to_string(), (1, current_ct.unwrap_or(0)));
            }
        }
    }

    parsed.paths = totals
        .into_iter()
        .map(|(path, (commits, last_commit_ms))| ChurnPath {
            path,
            commits,
            last_commit_ms,
        })
        .collect();
    parsed
}

/// The `repo_churn` seam (the `index_cmd::run_index` pattern):
/// everything the Tauri command does, minus the Tauri runtime, so cargo
/// tests drive it directly against real repositories.
pub fn run_churn(state: &WatchState) -> ChurnOutcome {
    let Some(root) = state.project_dir() else {
        return ChurnOutcome::disabled(ChurnDisabled::NoProject);
    };
    churn_at(&root)
}

/// The same, rooted at an explicit directory (tests; `run_churn` is the
/// only caller that reads `WatchState`).
pub fn churn_at(root: &Path) -> ChurnOutcome {
    // Property 0: resolve WHICH git runs before touching the project.
    // A git that cannot be resolved to a trusted absolute path is a
    // typed refusal, never a bare-name spawn inside `root`.
    let Some(git) = resolve_git() else {
        return ChurnOutcome::disabled(ChurnDisabled::GitUnavailable);
    };

    match probe_repo(&git, root) {
        RepoProbe::GitUnavailable => {
            return ChurnOutcome::disabled(ChurnDisabled::GitUnavailable)
        }
        RepoProbe::NotAGitRepo => return ChurnOutcome::disabled(ChurnDisabled::NotAGitRepo),
        RepoProbe::NoHistory => return ChurnOutcome::disabled(ChurnDisabled::NoHistory),
        RepoProbe::Ready => {}
    }

    let Some(output) = run_git(&git, root, LOG_ARGV) else {
        return ChurnOutcome::disabled(ChurnDisabled::GitUnavailable);
    };
    if !output.status.success() {
        eprintln!(
            "[supertaskr] churn: git log exited {} - {}",
            output.status.code().unwrap_or(-1),
            sanitize_for_log(&String::from_utf8_lossy(&output.stderr))
        );
        return ChurnOutcome::disabled(ChurnDisabled::GitFailed);
    }

    let parsed = parse_churn(&output.stdout);
    ChurnOutcome::Measured {
        window_days: CHURN_WINDOW_DAYS,
        commits: parsed.commits,
        truncated: parsed.truncated_paths || parsed.commits >= CHURN_MAX_COMMITS,
        rejected: parsed.rejected,
        paths: parsed.paths,
        measured_at_ms: now_ms(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    // ---- the argv surface, swept the way a verifier would -------------

    #[test]
    fn every_argv_element_is_a_compile_time_literal_and_none_of_them_is_a_shell() {
        // The type is the proof for "literal" (&'static str cannot hold a
        // runtime path); these assertions are about SHAPE, so a future
        // edit that adds an interpolated-looking element is loud.
        for argv in [PROBE_ARGV, LOG_ARGV] {
            assert!(!argv.is_empty());
            for arg in argv {
                assert!(!arg.contains(';'), "argv element looks like a shell line: {arg}");
                assert!(!arg.contains('|'), "argv element looks like a shell line: {arg}");
                assert!(!arg.contains('&'), "argv element looks like a shell line: {arg}");
                assert!(!arg.contains('`'), "argv element carries a backtick: {arg}");
                assert!(!arg.contains('$'), "argv element carries a substitution: {arg}");
                assert!(!arg.contains('\n'), "argv element carries a newline: {arg}");
            }
        }
        // Positive control for the sweep above: the assertions can fail.
        // (A negative assertion needs a positive control — CONVENTIONS.)
        let hostile = "log; rm -rf /";
        assert!(hostile.contains(';'), "the sweep's own predicate is inert");
    }

    #[test]
    fn no_project_path_ever_reaches_argv() {
        // `-C` is the flag that WOULD put a path in argv; it is absent by
        // decision, and the root travels as the child's cwd instead.
        for argv in [PROBE_ARGV, LOG_ARGV] {
            assert!(
                !argv.contains(&"-C"),
                "the project root must not be an argv element"
            );
            for arg in argv {
                assert!(!arg.starts_with('/'), "argv element is a path: {arg}");
            }
        }
    }

    #[test]
    fn the_window_literals_agree_with_the_window_constant_and_with_themselves() {
        // Both halves on purpose: a test parametrised by the constant it
        // checks cannot pin that constant (CONVENTIONS, T-063).
        assert_eq!(ARG_SINCE, format!("--since={CHURN_WINDOW_DAYS}.days.ago"));
        assert_eq!(ARG_SINCE, "--since=30.days.ago");
        assert_eq!(CHURN_WINDOW_DAYS, 30);
        assert_eq!(ARG_MAX_COUNT, format!("--max-count={CHURN_MAX_COMMITS}"));
        assert_eq!(ARG_MAX_COUNT, "--max-count=5000");
        assert_eq!(CHURN_MAX_COMMITS, 5_000);
    }

    #[test]
    fn the_log_argv_keeps_the_four_flags_the_containment_argument_rests_on() {
        for flag in ["-z", "--name-only", "--relative", "--no-optional-locks"] {
            assert!(LOG_ARGV.contains(&flag), "{flag} left the log argv");
        }
        // The fsmonitor clear is a PAIR; either half alone does nothing.
        // Since T-013 F1 it rides BOTH argvs, not the log argv only.
        for argv in [PROBE_ARGV, LOG_ARGV] {
            let position = argv.iter().position(|arg| *arg == "-c");
            assert_eq!(
                argv.get(position.expect("-c present") + 1),
                Some(&"core.fsmonitor="),
                "the fsmonitor clear left an argv"
            );
        }
    }

    #[test]
    fn the_config_injection_family_is_removed_from_the_child_env() {
        // Property 0's environment half: the config-injection triple ranks
        // with `-c`, so it must not survive from whatever launched the
        // app. Twelve, and the three the verifier named are present.
        assert_eq!(GIT_ENV_REMOVED.len(), 12, "the removal list is twelve since T-013 F1");
        for key in ["GIT_CONFIG_GLOBAL", "GIT_CONFIG_SYSTEM", "GIT_CONFIG_COUNT"] {
            assert!(GIT_ENV_REMOVED.contains(&key), "{key} must be removed from the child env");
        }
    }

    // ---- containment ---------------------------------------------------

    #[test]
    fn containment_accepts_ordinary_paths_and_refuses_the_hostile_shapes() {
        // Positive control first: these must be ACCEPTED, or the
        // refusals below prove nothing but a broken predicate.
        for good in ["a.ts", "app/src/x.tsx", "docs/tasks/T-013.md", "a b/c-d.rs"] {
            assert!(is_safe_repo_relative(good), "{good} should be accepted");
        }
        for bad in [
            "",
            "/etc/passwd",
            "../outside.ts",
            "app/../../outside.ts",
            "app//double.ts",
            "app/./same.ts",
            "app\\win.ts",
            "ev\nil.txt",
            "bell\u{7}.txt",
            "tab\there.txt",
        ] {
            assert!(!is_safe_repo_relative(bad), "{bad:?} should be refused");
        }
    }

    // ---- property 0: which git runs (T-013 F1) -------------------------

    #[test]
    fn the_git_gate_holds_the_same_standard_the_cli_resolver_does() {
        use std::os::unix::fs::PermissionsExt;
        // Positive control: an ABSOLUTE, executable, git-named file passes
        // the SHARED gate — or the refusals below prove only a broken
        // predicate (a negative assertion needs a positive control).
        let root = std::env::temp_dir().join(format!(
            "supertaskr-t013-gate-{}-{}",
            std::process::id(),
            now_ms()
        ));
        fs::create_dir_all(&root).expect("mk temp dir");
        let good = root.join("git");
        fs::write(&good, "#!/bin/sh\nexit 0\n").expect("write");
        fs::set_permissions(&good, fs::Permissions::from_mode(0o755)).expect("chmod");
        assert!(
            validate_resolved_program(&good, "git").is_ok(),
            "an absolute, executable `git` must pass the gate"
        );

        // The shapes the exploit needs, refused by the one standard.
        assert!(validate_resolved_program(Path::new("git"), "git").is_err(), "a bare name");
        assert!(validate_resolved_program(Path::new("./git"), "git").is_err(), "a relative path");
        assert!(
            validate_resolved_program(&root.join("bin/../git"), "git").is_err(),
            "a traversal component"
        );
        let notgit = root.join("notgit");
        fs::write(&notgit, "#!/bin/sh\nexit 0\n").expect("write");
        fs::set_permissions(&notgit, fs::Permissions::from_mode(0o755)).expect("chmod");
        assert!(
            validate_resolved_program(&notgit, "git").is_err(),
            "a file not named git"
        );
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn a_git_reachable_only_by_a_relative_path_element_never_resolves() {
        use std::os::unix::fs::PermissionsExt;
        // The rejected draft resolved `<project>/git` because a relative
        // or empty PATH element plus `current_dir(project)` reached it.
        // Both the sanitizer (drops the element) and the shared gate
        // (refuses the relative candidate) close it. Planted the runner's
        // own way — UNDER the test's CWD, so a relative lookup genuinely
        // finds the file and only its SHAPE is what refuses it (CONVENTIONS
        // — a negative assertion needs a positive control that would
        // otherwise be ACCEPTED). No process `PATH` is mutated: the search
        // list is an explicit argument (the `which_in` idiom).
        let cwd = std::env::current_dir().expect("cwd");
        assert_eq!(
            cwd.file_name().and_then(|n| n.to_str()),
            Some("src-tauri"),
            "cargo no longer runs tests from the package root — the relative fixture \
             below would not resolve and this test would pass for the wrong reason"
        );
        let rel_dir = format!("target/supertaskr-t013-relgit-{}-{}", std::process::id(), now_ms());
        let abs_dir = cwd.join(&rel_dir);
        fs::create_dir_all(&abs_dir).expect("mk rel dir");
        let planted = abs_dir.join("git");
        fs::write(&planted, "#!/bin/sh\nexit 0\n").expect("write");
        fs::set_permissions(&planted, fs::Permissions::from_mode(0o755)).expect("chmod");

        // POSITIVE CONTROL: reached ABSOLUTELY the very same file resolves.
        assert_eq!(
            which_git(&[abs_dir.clone()]),
            Some(planted.clone()),
            "the absolute spelling must resolve, or the refusals below prove nothing"
        );
        // …and it is executable THROUGH a relative path, so the only thing
        // refusing it below is its relative shape, not its mode.
        assert!(
            crate::agent::adapter::is_executable_file(Path::new(&format!("{rel_dir}/git"))),
            "the relative fixture must be executable through a relative path"
        );

        // 1) The gate refuses the relative dir directly: `dir.join("git")`
        //    is relative, so `which_git` produces no candidate.
        assert_eq!(which_git(&[PathBuf::from(&rel_dir)]), None);
        // 2) The sanitizer drops the empty element, `.`, `..` and any bare
        //    relative dir, so the whole hostile search path yields nothing.
        for hostile in [rel_dir.as_str(), ".", "", ".:", ":", "..:."] {
            assert_eq!(
                which_git(&sanitized_dirs(Some(hostile))),
                None,
                "sanitized {hostile:?} produced a candidate; a relative element must not"
            );
        }
        // 3) End to end: a `.`-first search path that ALSO holds the
        //    absolute planted dir resolves to the ABSOLUTE git, and the
        //    child's PATH the app SETS carries no relative element.
        let mixed = format!(".:{rel_dir}:{}", abs_dir.display());
        let resolved =
            resolve_git_from(None, Some(&mixed)).expect("the absolute element resolves");
        assert!(resolved.program.is_absolute(), "the resolved git must be absolute");
        assert_eq!(resolved.program.file_name().and_then(|n| n.to_str()), Some("git"));
        for dir in std::env::split_paths(&resolved.child_path) {
            assert!(dir.is_absolute(), "child PATH element {dir:?} is not absolute");
            assert!(
                !dir.as_os_str().is_empty()
                    && !dir.components().any(|c| matches!(
                        c,
                        std::path::Component::CurDir | std::path::Component::ParentDir
                    )),
                "child PATH element {dir:?} is relative"
            );
        }
        // 4) A login-shell answer that is itself relative is refused too;
        //    a purely relative search path then resolves nothing.
        assert!(resolve_git_from(Some(PathBuf::from("./git")), Some(".:")).is_none());

        let _ = fs::remove_dir_all(&abs_dir);
    }

    #[test]
    fn run_git_spawns_the_resolved_program_and_sets_the_childs_path() {
        use std::os::unix::fs::PermissionsExt;
        // The OTHER half of property 0, which the resolution tests do not
        // reach: `run_git` must spawn `git.program` (the ABSOLUTE path we
        // resolved) and NOT a bare name, and it must SET the child's PATH
        // from `git.child_path` rather than inherit the app's. A stand-in
        // that echoes its own `$0` and `$PATH` proves both — reverting to
        // `Command::new("git")` moves `$0` off our program, and dropping
        // the `env("PATH", …)` moves `$PATH` off our sentinel.
        let root = std::env::temp_dir().join(format!(
            "supertaskr-t013-rungit-{}-{}",
            std::process::id(),
            now_ms()
        ));
        fs::create_dir_all(&root).expect("mk temp dir");
        let program = root.join("git");
        fs::write(&program, "#!/bin/sh\necho \"PROG=$0\"\necho \"PATH=$PATH\"\nexit 0\n")
            .expect("write");
        fs::set_permissions(&program, fs::Permissions::from_mode(0o755)).expect("chmod");

        let sentinel = "/supertaskr-sentinel-t013-only";
        let git = ResolvedGit {
            program: program.clone(),
            child_path: OsString::from(sentinel),
        };
        let output = run_git(&git, &root, PROBE_ARGV).expect("the stand-in runs");
        let stdout = String::from_utf8_lossy(&output.stdout);
        assert!(
            stdout.contains(&format!("PROG={}", program.display())),
            "run_git spawned something other than the resolved program: {stdout}"
        );
        assert!(
            stdout.contains(&format!("PATH={sentinel}")),
            "run_git did not SET the child's PATH from git.child_path: {stdout}"
        );

        let _ = fs::remove_dir_all(&root);
    }

    // ---- the parser, poisoned without a git ----------------------------

    /// Build the exact wire shape git emits, so the fixtures are not a
    /// guess about the format (see `parse_churn`'s doc comment for the
    /// measurement).
    fn wire(commits: &[(&str, &[&str])]) -> Vec<u8> {
        let mut out: Vec<u8> = Vec::new();
        for (ct, paths) in commits {
            out.push(0x01);
            out.extend_from_slice(ct.as_bytes());
            out.push(0);
            for (index, path) in paths.iter().enumerate() {
                if index == 0 {
                    out.push(b'\n');
                }
                out.extend_from_slice(path.as_bytes());
                out.push(0);
            }
        }
        out
    }

    #[test]
    fn counts_one_commit_per_path_and_keeps_the_newest_timestamp() {
        let bytes = wire(&[
            ("1700000200", &["a.ts", "b.ts"]),
            ("1700000100", &["a.ts"]),
        ]);
        let parsed = parse_churn(&bytes);
        assert_eq!(parsed.commits, 2);
        assert_eq!(parsed.rejected, 0);
        assert!(!parsed.truncated_paths);
        assert_eq!(
            parsed.paths,
            vec![
                ChurnPath { path: "a.ts".into(), commits: 2, last_commit_ms: 1_700_000_200_000 },
                ChurnPath { path: "b.ts".into(), commits: 1, last_commit_ms: 1_700_000_200_000 },
            ]
        );
    }

    #[test]
    fn an_empty_commit_contributes_a_commit_and_no_path() {
        let bytes = wire(&[("1700000200", &[]), ("1700000100", &["a.ts"])]);
        let parsed = parse_churn(&bytes);
        assert_eq!(parsed.commits, 2);
        assert_eq!(parsed.paths.len(), 1);
        assert_eq!(parsed.paths[0].commits, 1);
    }

    #[test]
    fn a_path_with_a_newline_is_refused_and_counted_never_laundered() {
        // The structural newline is stripped from the first path of a
        // commit; a filename that BEGINS with one therefore still
        // carries a newline when the containment check sees it.
        let bytes = wire(&[("1700000200", &["ev\nil.txt", "plain.txt"])]);
        let parsed = parse_churn(&bytes);
        assert_eq!(parsed.rejected, 1, "the hostile name must be refused");
        assert_eq!(
            parsed.paths,
            vec![ChurnPath {
                path: "plain.txt".into(),
                commits: 1,
                last_commit_ms: 1_700_000_200_000
            }],
            "and the clean sibling in the same commit must survive"
        );

        // The laundering case, in the position where a blanket strip
        // would have hidden it: a name that IS "\nevil", first in its
        // commit, arrives as two newlines.
        let laundering = wire(&[("1700000200", &["\nevil.txt"])]);
        let parsed = parse_churn(&laundering);
        assert_eq!(parsed.rejected, 1);
        assert!(parsed.paths.is_empty(), "\\nevil.txt must not become evil.txt");
    }

    #[test]
    fn a_timestamp_that_is_not_a_number_degrades_it_does_not_crash() {
        let mut bytes: Vec<u8> = Vec::new();
        bytes.push(0x01);
        bytes.extend_from_slice(b"not-a-number");
        bytes.push(0);
        bytes.push(b'\n');
        bytes.extend_from_slice(b"a.ts");
        bytes.push(0);
        let parsed = parse_churn(&bytes);
        assert_eq!(parsed.commits, 1, "the commit still happened");
        assert_eq!(parsed.rejected, 1, "the unparseable timestamp is reported");
        assert_eq!(parsed.paths.len(), 1);
        assert_eq!(parsed.paths[0].commits, 1);
        assert_eq!(parsed.paths[0].last_commit_ms, 0, "recency is unknown, not invented");
    }

    #[test]
    fn invalid_utf8_and_escaping_paths_are_refused_and_counted() {
        let mut bytes: Vec<u8> = Vec::new();
        bytes.push(0x01);
        bytes.extend_from_slice(b"1700000200");
        bytes.push(0);
        bytes.push(b'\n');
        bytes.extend_from_slice(&[0xff, 0xfe]); // never valid UTF-8
        bytes.push(0);
        bytes.extend_from_slice(b"../escape.ts");
        bytes.push(0);
        bytes.extend_from_slice(b"/absolute.ts");
        bytes.push(0);
        bytes.extend_from_slice(b"kept.ts");
        bytes.push(0);
        let parsed = parse_churn(&bytes);
        assert_eq!(parsed.rejected, 3);
        assert_eq!(parsed.paths.len(), 1);
        assert_eq!(parsed.paths[0].path, "kept.ts");
    }

    #[test]
    fn garbage_bytes_that_are_no_wire_format_at_all_produce_no_panic() {
        for junk in [
            b"\x00\x00\x00".as_slice(),
            b"\x01".as_slice(),
            b"\n".as_slice(),
            b"".as_slice(),
            &[0x01, 0xff, 0xfe, 0x00],
        ] {
            let parsed = parse_churn(junk);
            assert!(parsed.paths.len() <= 1);
        }
    }

    #[test]
    fn the_path_ceiling_is_a_defined_degraded_state() {
        let names: Vec<String> = (0..CHURN_MAX_PATHS + 5).map(|i| format!("f{i}.ts")).collect();
        let refs: Vec<&str> = names.iter().map(String::as_str).collect();
        let parsed = parse_churn(&wire(&[("1700000200", &refs)]));
        assert!(parsed.truncated_paths, "the ceiling must be reported");
        assert_eq!(parsed.paths.len(), CHURN_MAX_PATHS);
        assert_eq!(parsed.rejected, 0, "a ceiling is not a refusal");
    }

    // ---- against real repositories -------------------------------------

    struct TempRepo(PathBuf);
    impl TempRepo {
        fn new(tag: &str) -> Self {
            let dir = std::env::temp_dir().join(format!(
                "supertaskr-t013-{}-{}-{}",
                tag,
                std::process::id(),
                now_ms()
            ));
            fs::create_dir_all(&dir).expect("mk temp dir");
            Self(dir)
        }
        fn root(&self) -> &Path {
            &self.0
        }
        fn git(&self, argv: &[&str]) {
            let status = Command::new("git")
                .args(argv)
                .current_dir(&self.0)
                .stdin(Stdio::null())
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status()
                .expect("git available for the fixture");
            assert!(status.success(), "fixture git {argv:?} failed");
        }
        fn init(&self) {
            self.git(&["init", "-q", "."]);
            self.git(&["config", "user.email", "t@example.invalid"]);
            self.git(&["config", "user.name", "t"]);
            self.git(&["config", "commit.gpgsign", "false"]);
        }
        fn write(&self, rel: &str, content: &str) {
            let path = self.0.join(rel);
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent).expect("mk parent");
            }
            fs::write(path, content).expect("write fixture file");
        }
        fn commit(&self, message: &str) {
            self.git(&["add", "-A"]);
            self.git(&["commit", "-q", "-m", message]);
        }
    }
    impl Drop for TempRepo {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn a_directory_that_is_not_a_repository_disables_rather_than_breaks() {
        let tree = TempRepo::new("norepo");
        // A bare directory under the system temp dir is not inside any
        // work tree (temp dirs are not repositories on any platform this
        // ships to); if that ever stopped holding, this asserts the
        // DISABLED family rather than a crash, which is the property.
        match churn_at(tree.root()) {
            ChurnOutcome::Disabled { reason } => {
                assert_eq!(reason, ChurnDisabled::NotAGitRepo);
            }
            other => panic!("expected a disabled outcome, got {other:?}"),
        }
    }

    #[test]
    fn a_repository_with_no_commits_says_so_in_its_own_word() {
        let tree = TempRepo::new("nohistory");
        tree.init();
        match churn_at(tree.root()) {
            ChurnOutcome::Disabled { reason } => assert_eq!(reason, ChurnDisabled::NoHistory),
            other => panic!("expected NoHistory, got {other:?}"),
        }
    }

    #[test]
    fn a_real_repository_is_measured_and_a_hostile_filename_is_refused_in_place() {
        let tree = TempRepo::new("measured");
        tree.init();
        tree.write("plain.txt", "a\n");
        tree.write("sub/deep.txt", "c\n");
        tree.write("ev\nil.txt", "b\n");
        tree.commit("one");
        tree.write("plain.txt", "a2\n");
        tree.commit("two");

        match churn_at(tree.root()) {
            ChurnOutcome::Measured {
                window_days,
                commits,
                paths,
                truncated,
                rejected,
                ..
            } => {
                assert_eq!(window_days, 30);
                assert_eq!(commits, 2);
                assert!(!truncated);
                assert_eq!(rejected, 1, "the newline filename must be refused");
                let named: Vec<(&str, usize)> =
                    paths.iter().map(|p| (p.path.as_str(), p.commits)).collect();
                assert_eq!(named, vec![("plain.txt", 2), ("sub/deep.txt", 1)]);
                assert!(paths[0].last_commit_ms > 0);
            }
            other => panic!("expected Measured, got {other:?}"),
        }
    }

    #[test]
    fn a_folder_inside_a_repository_is_told_only_about_itself() {
        // --relative is what makes an opened SUBFOLDER contained: paths
        // outside it are not reported and its own prefix is stripped, so
        // nothing the app renders can name a file outside the project.
        let tree = TempRepo::new("subdir");
        tree.init();
        tree.write("outside.txt", "x\n");
        tree.write("inner/kept.txt", "y\n");
        tree.commit("one");

        match churn_at(&tree.root().join("inner")) {
            ChurnOutcome::Measured { paths, .. } => {
                let named: Vec<&str> = paths.iter().map(|p| p.path.as_str()).collect();
                assert_eq!(named, vec!["kept.txt"], "outside.txt must not be reported");
            }
            other => panic!("expected Measured, got {other:?}"),
        }
    }

    #[test]
    fn nothing_git_says_can_reach_the_serialized_outcome() {
        // The whole disabled vocabulary serializes to a closed set of
        // words; there is no message field for a git string to ride.
        for reason in [
            ChurnDisabled::NoProject,
            ChurnDisabled::GitUnavailable,
            ChurnDisabled::NotAGitRepo,
            ChurnDisabled::NoHistory,
            ChurnDisabled::GitFailed,
        ] {
            let json = serde_json::to_string(&ChurnOutcome::disabled(reason)).expect("serialize");
            assert!(json.starts_with("{\"kind\":\"disabled\""), "{json}");
            assert!(!json.contains("message"), "{json}");
            assert!(!json.contains("fatal"), "{json}");
        }
    }
}
