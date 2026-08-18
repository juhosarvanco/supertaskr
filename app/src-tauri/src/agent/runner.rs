//! T-025 §§1/4/6: the turn runner — one short-lived child per interview
//! turn, its stream relayed as events, every failure typed, the child
//! never outliving the app.
//!
//! Topology (§1): turn 1 spawns the adapter's spawn template and captures
//! the CLI's NATIVE session id from the stream's init line; every turn
//! N≥2 spawns the resume template with that id. Process lifetime = turn
//! lifetime, so kill semantics are trivial and an orphan is bounded to
//! one turn. The app-restart resume T-029 needs is the same code path as
//! turn 2.
//!
//! Security posture that lives in THIS file (§8):
//! - no shell, ever: `std::process::Command` with fixed argv arrays; the
//!   prompt is not in argv at all, it goes on stdin (argv is
//!   world-readable in `ps`, and answers can carry private product ideas);
//! - `env_clear()` + an explicit allowlist, so `ANTHROPIC_API_KEY`,
//!   `AWS_*`, `GOOGLE_*`, `GITHUB_TOKEN`, `NPM_TOKEN`, `TAURI_*` and
//!   anything like them never reach the child. The user's own CLI login
//!   (keychain/config) is the auth — ADR-003: nputer never holds keys or
//!   proxies tokens, and forwarding one from our env would make the app a
//!   token conduit;
//! - cwd is the canonical open project dir from `WatchState`, never a
//!   webview-supplied path;
//! - no sockets: the runner's whole I/O is child pipes and `.nputer/`
//!   files. Port 1420 is never involved;
//! - T-039: the CLI's own session id is DATA, and it is validated at the
//!   moment it is captured — before it is emitted, stored, or substituted
//!   into a resume argv. `--resume [value]` takes an OPTIONAL argument, so
//!   an unvalidated id beginning with `-` would parse as a standalone flag
//!   rather than as a value. The gate is `adapter::validate_session_id`,
//!   and assembly through `adapter::argv` is fallible so no path can skip
//!   it.

use std::collections::VecDeque;
use std::io::{BufReader, Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{mpsc, Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use serde::Serialize;

use super::adapter::{
    is_executable_file, parse_major, validate_model, validate_session_id, AgentAdapter,
};

// ---- caps (T-003's cap discipline, §4) --------------------------------

/// Largest single stream line the runner will assemble; beyond it the
/// turn fails as `MalformedStream` rather than ballooning memory.
pub const MAX_LINE_BYTES: usize = 1024 * 1024;
/// Largest text one `textDelta`/`completed` event may carry.
pub const MAX_EVENT_TEXT: usize = 32 * 1024;
/// Largest total delta text relayed per turn; beyond it deltas stop and
/// `completed.truncatedRelay` says so (the canonical result still rides).
pub const MAX_RELAY_BYTES: usize = 1024 * 1024;
/// Diagnostic stderr ring, kept for error tails only.
pub const MAX_STDERR_RING: usize = 64 * 1024;
/// T-029: most `permission_denials` entries a typed failure will carry.
/// The list is stream-borne, so it is bounded like everything else here.
pub const MAX_DENIALS: usize = 16;
/// T-029: byte bound on ONE denied tool name.
pub const MAX_DENIAL_BYTES: usize = 128;
/// T-029: byte bound on the message inside [`TurnError::AuthFailed`].
/// The CLI's real one is ~70 bytes; this is headroom with a hard stop.
pub const MAX_AUTH_MESSAGE_BYTES: usize = 2048;

pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

// ---- typed failures (§6) ----------------------------------------------

/// Every way a turn can fail, typed. `Cancelled` is deliberately NOT
/// here: a cancel is an outcome, not an error.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum TurnError {
    /// The child could not be started at all (ENOENT, EACCES, …).
    SpawnFailed { os: String },
    /// No first stream line within the start timeout.
    StartTimeout,
    /// No stream line for the stall timeout, mid-turn.
    Stall,
    /// The CLI exited nonzero. `stderr_tail` is the CLI's own words,
    /// relayed for T-027 to show — the residual class, after T-029's
    /// classification below has taken the two failures the stream names.
    ExitNonZero { code: Option<i32>, stderr_tail: String },
    /// The stream did not carry what the protocol needs.
    MalformedStream { why: String },
    /// T-029: THE CLI COULD NOT AUTHENTICATE, and it said so in band.
    ///
    /// Before this variant the fact was captured and then thrown into the
    /// diagnostic ring, so the screen showed `exitNonZero { code: 1 }`
    /// with an escaped one-line blob of the CLI's own words under it and
    /// a **Try again** button that would fail identically forever. The
    /// bytes were delivered; the MEANING was not, and neither was the one
    /// action that helps (`claude login`).
    ///
    /// Measured against claude 2.1.226: the failure arrives on STDOUT as
    /// a `system`/`api_retry` line with `error_status: 401`, then a
    /// `result` line whose `subtype` still reads `"success"` while
    /// `is_error` is true and `api_error_status` is 401; the process
    /// exits 1 and writes nothing to stderr of its own.
    AuthFailed { status: Option<u32>, message: String },
    /// T-029 (T-025-s1): the turn died because a tool it needed was
    /// REFUSED — `--allowedTools` too narrow, or a permission mode that
    /// declined. Named rather than relayed, so the screen can say which
    /// tool instead of showing an exit code.
    ToolDenied { denials: Vec<String>, terminal_reason: Option<String> },
    /// T-029 (T-039-s3): a session id was refused, at either gate — the
    /// stream's init line or the assembled resume argv.
    ///
    /// It used to ride [`TurnError::MalformedStream`], which files an
    /// ATTEMPTED ARGV INJECTION next to a truncated line. Both are
    /// correct and the shared envelope is blunt: only one of them means
    /// "the id in your runtime file is unusable — start fresh", and a
    /// webview could not tell which without reading English.
    RejectedSessionId { why: String },
}

// ---- events (§4: one channel, `genesis-turn`) --------------------------

/// One webview event. Every payload carries `seq` from a runner-owned
/// counter, so the store stale-drops exactly like docs snapshots.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum RunEvent {
    Started { seq: u64, turn: u32 },
    TextDelta { seq: u64, turn: u32, text: String },
    Activity { seq: u64, turn: u32, label: String },
    Completed { seq: u64, turn: u32, text: String, truncated_relay: bool },
    Failed { seq: u64, turn: u32, error: TurnError },
    SessionRegistered { seq: u64, native_session_id: String },
}

impl RunEvent {
    pub fn seq(&self) -> u64 {
        match self {
            RunEvent::Started { seq, .. }
            | RunEvent::TextDelta { seq, .. }
            | RunEvent::Activity { seq, .. }
            | RunEvent::Completed { seq, .. }
            | RunEvent::Failed { seq, .. }
            | RunEvent::SessionRegistered { seq, .. } => *seq,
        }
    }
}

/// The emit side of the one event channel. Production wraps
/// `app.emit("genesis-turn", …)`; tests wrap a channel.
#[derive(Clone)]
pub struct Emitter {
    sink: Arc<dyn Fn(RunEvent) + Send + Sync>,
    seq: Arc<AtomicU64>,
}

impl Emitter {
    pub fn new(sink: Arc<dyn Fn(RunEvent) + Send + Sync>, seq: Arc<AtomicU64>) -> Self {
        Self { sink, seq }
    }
    fn next(&self) -> u64 {
        self.seq.fetch_add(1, Ordering::SeqCst) + 1
    }
    pub fn started(&self, turn: u32) {
        (self.sink)(RunEvent::Started { seq: self.next(), turn });
    }
    pub fn text_delta(&self, turn: u32, text: String) {
        (self.sink)(RunEvent::TextDelta { seq: self.next(), turn, text });
    }
    pub fn activity(&self, turn: u32, label: String) {
        (self.sink)(RunEvent::Activity { seq: self.next(), turn, label });
    }
    pub fn completed(&self, turn: u32, text: String, truncated_relay: bool) {
        (self.sink)(RunEvent::Completed { seq: self.next(), turn, text, truncated_relay });
    }
    pub fn failed(&self, turn: u32, error: TurnError) {
        (self.sink)(RunEvent::Failed { seq: self.next(), turn, error });
    }
    pub fn session_registered(&self, native_session_id: String) {
        (self.sink)(RunEvent::SessionRegistered { seq: self.next(), native_session_id });
    }
}

// ---- configuration + the test seam -------------------------------------

/// Runner tunables. **Production reads NOTHING from the environment**:
/// `Default` is a pure constant, and the three override fields below are
/// filled only by a test constructing this struct in Rust. A hostile env
/// var therefore cannot redirect the production spawn (pinned by
/// `default_config_reads_nothing_from_the_environment`).
#[derive(Clone, Debug)]
pub struct RunnerConfig {
    /// TEST SEAM: the binary to spawn instead of resolving one.
    pub binary_override: Option<PathBuf>,
    /// TEST SEAM: the PATH handed to the child.
    pub path_override: Option<String>,
    /// TEST SEAM: extra env pairs on the child (fake-agent scenario
    /// selection). Always empty in production.
    pub extra_env: Vec<(String, String)>,
    /// TEST SEAM: `false` forbids the login-shell probe entirely, so no
    /// suite can spawn the user's shell or accidentally RESOLVE THE REAL
    /// CLI. Production is `true` — that probe is criterion 4's whole
    /// point (GUI-launch PATH poverty).
    pub probe_login_shell: bool,
    /// Where the resolution cache lives (the app's config dir).
    pub config_dir: Option<PathBuf>,
    /// No first stream line within this → `StartTimeout`.
    pub start_timeout: Duration,
    /// No stream line for this, mid-turn → `Stall`. Generous on purpose:
    /// message and tool gaps are real.
    pub stall_timeout: Duration,
    /// Text-delta coalescing window (§4's 150 ms half of the 250 ms bound).
    pub coalesce: Duration,
    /// SIGTERM → this grace → SIGKILL.
    pub kill_grace: Duration,
    /// Login-shell probe / `--version` timeout.
    pub probe_timeout: Duration,
}

impl Default for RunnerConfig {
    fn default() -> Self {
        Self {
            binary_override: None,
            path_override: None,
            extra_env: Vec::new(),
            probe_login_shell: true,
            config_dir: None,
            start_timeout: Duration::from_secs(30),
            stall_timeout: Duration::from_secs(300),
            coalesce: Duration::from_millis(150),
            kill_grace: Duration::from_secs(5),
            probe_timeout: Duration::from_secs(10),
        }
    }
}

// ---- binary resolution (§6) --------------------------------------------

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ResolveError {
    /// Nothing executable found. `probed` lists what was looked at — the
    /// typed outcome T-029 renders as the hand-driven fallback, never a
    /// dead end.
    NotFound { probed: Vec<String> },
    /// Found, but below the adapter's `min_major`.
    Unsupported { found: String },
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ResolvedCli {
    pub path: PathBuf,
    /// The `--version` line, verbatim, when the probe got one.
    pub version: Option<String>,
    /// The login-shell PATH, which becomes the child's PATH (the
    /// criterion's "explicit PATH augmentation": the planner's own Bash
    /// has to be able to find `git`).
    pub login_path: Option<String>,
}

/// The cache file beside the app config, so the login-shell probe's
/// `command -v` runs once per install rather than once per turn.
fn cache_path(cfg: &RunnerConfig) -> Option<PathBuf> {
    cfg.config_dir.as_ref().map(|dir| dir.join("agent-paths.json"))
}

// ---- T-047: what the cached binary path has to survive -----------------

/// Why a cached binary path was refused before anything executed it.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CachedPathRejection {
    Empty,
    /// Not absolute. A relative path resolves against the app's CWD, which
    /// is whatever the OS handed the process — not a location anyone chose.
    NotAbsolute,
    /// A `.` or `..` component. `Command::new` hands the string to the OS,
    /// which resolves traversal at exec time, so `…/bin/../evil/claude` is
    /// an executable path that does not look like one. Measured, not
    /// argued: this task's pre-fix probe executed exactly that.
    Traversal,
    /// The file name is not the adapter's own binary name.
    WrongName { expected: &'static str },
    /// Nothing executable there now (uninstalled, moved, chmod'ed).
    NotExecutable,
}

impl std::fmt::Display for CachedPathRejection {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Empty => write!(f, "it is empty"),
            Self::NotAbsolute => write!(f, "it is not an absolute path"),
            Self::Traversal => write!(f, "it carries a '.' or '..' component"),
            Self::WrongName { expected } => {
                write!(f, "its file name is not '{expected}'")
            }
            Self::NotExecutable => write!(f, "it is not an executable file"),
        }
    }
}

/// THE CACHED-PATH GATE (T-047, absorbing T-039-s1's first half).
///
/// `agent-paths.json` lives in the app config dir and was, before this,
/// believed entirely: `read_cache` deserialized a string into a `PathBuf`
/// and `resolve_cli` gated it on `is_executable_file` alone before handing
/// it to `Command::new` — so a poisoned entry executed its binary AT
/// RESOLVE TIME, before any turn, on every `start_genesis` AND every
/// `send_turn`. This task's pre-fix probe measured exactly that, twice
/// (a `--version` probe and a full spawn).
///
/// The rule is "what a fresh probe could have produced", because that is
/// the only honest bar for a value whose whole justification is "we
/// already probed this once". A login-shell probe resolves the NAME
/// `claude` — `command -v claude`, or `dir.join("claude")` over PATH — so
/// whatever it returns is absolute, traversal-free, and named `claude`.
/// A cached entry that is none of those is not a probe result.
///
/// **The honest residual, recorded rather than implied**: an absolute,
/// traversal-free path named `claude` pointing at an attacker's binary
/// still passes. Closing THAT needs the cache bound to a probe signature
/// or dropped entirely, and the precondition for reaching it is write
/// access to the user's own config dir — which also buys `~/.zshrc`. What
/// this closes is the gap between "an executable file" and "something a
/// probe could have said", which is where the traversal and misnamed
/// shapes lived.
pub fn validate_cached_binary(
    path: &Path,
    adapter: &AgentAdapter,
) -> Result<(), CachedPathRejection> {
    if path.as_os_str().is_empty() {
        return Err(CachedPathRejection::Empty);
    }
    if !path.is_absolute() {
        return Err(CachedPathRejection::NotAbsolute);
    }
    // Both halves, because they catch different things. `Components`
    // is authoritative for `..` — it preserves `ParentDir` — but it
    // NORMALIZES `.` away, and `Command::new` hands the RAW string to the
    // OS. So the raw segments are scanned too: what execve resolves is the
    // string, not Rust's view of it.
    let raw_has_dot_segment = path
        .to_str()
        .unwrap_or_default()
        .split(['/', std::path::MAIN_SEPARATOR])
        .any(|segment| segment == "." || segment == "..");
    if raw_has_dot_segment
        || path
            .components()
            .any(|c| matches!(c, std::path::Component::ParentDir | std::path::Component::CurDir))
    {
        return Err(CachedPathRejection::Traversal);
    }
    if path.file_name().and_then(|n| n.to_str()) != Some(adapter.binary) {
        return Err(CachedPathRejection::WrongName { expected: adapter.binary });
    }
    if !is_executable_file(path) {
        return Err(CachedPathRejection::NotExecutable);
    }
    Ok(())
}

/// Resolve the adapter's binary (§6 order): the test seam, then the
/// cached path, then a login-shell probe, then a typed not-found.
///
/// GUI-launch PATH poverty is the whole problem being solved: a packaged
/// .app launched from Finder inherits a minimal PATH that has never seen
/// the user's `~/.local/bin`, homebrew, nvm, or asdf shims.
///
/// **T-047 changes two things about what this function believes.** The
/// cached PATH is gone — the login PATH is never stored and is re-probed
/// when needed (see [`probe_login_path`]) — and the cached binary path now
/// has to pass [`validate_cached_binary`] before `probe_version` (which is
/// a `Command::new`) ever sees it. A cache entry that fails is discarded
/// from the file and the resolution falls through to a FRESH probe, ending
/// at typed `cliNotFound` if that also fails: never a silent fallback to
/// the poisoned value.
pub fn resolve_cli(cfg: &RunnerConfig, adapter: &AgentAdapter) -> Result<ResolvedCli, ResolveError> {
    // (0) Test seam: an injected binary is used verbatim, version probe
    // included, so fixture scenarios exercise the same code path.
    if let Some(path) = &cfg.binary_override {
        let version = probe_version(cfg, path, adapter);
        return finish(cfg, path.clone(), version, cfg.path_override.clone(), adapter);
    }

    let mut probed: Vec<String> = Vec::new();

    // (1) Cached path from a previous probe — validated first, executed
    // second. The order is the whole point: `probe_version` spawns.
    if let Some(cache) = cache_path(cfg) {
        if let Some(path) = read_cache(&cache, adapter.key) {
            match validate_cached_binary(&path, adapter) {
                Ok(()) => {
                    // The login PATH is NOT cached (T-047): a fresh probe,
                    // now, or nothing.
                    let login_path = probe_login_path(cfg);
                    let version = probe_version(cfg, &path, adapter);
                    return finish(cfg, path, version, login_path, adapter);
                }
                Err(rejection) => {
                    // Loud, discarded, and re-probed. `sanitize_for_log`
                    // because the refused path is file-borne data and this
                    // line goes to a terminal.
                    eprintln!(
                        "[nputer] agent: refusing the cached {} path in agent-paths.json: {rejection} - discarding it and re-probing. Refused: {}",
                        adapter.key,
                        crate::docs_watch::sanitize_for_log(&path.display().to_string())
                    );
                    invalidate_cache(cfg, adapter.key);
                    probed.push(format!("cached path (refused: {rejection})"));
                }
            }
        }
    }

    // (2) The login-shell probe, once. Fixed argv, no user data anywhere
    // in it — the `-c` argument is a compile-time constant. Suites turn
    // it off so no test can spawn a shell or resolve the real CLI.
    let probe = if cfg.probe_login_shell {
        login_shell_probe(cfg, adapter.binary)
    } else {
        cfg.path_override
            .as_ref()
            .and_then(|path| which_in(path, adapter.binary))
            .map(|found| (found, cfg.path_override.clone()))
    };
    match probe {
        Some((path, login_path)) => {
            // The gate is closed on the WRITE side too, so the cache can
            // never hold something the read side would refuse — otherwise
            // an unusual (but working) probe result would be re-written and
            // re-refused on every single turn. A probe result that fails is
            // still USED for this resolve: it came from the user's own login
            // shell, not from a file, which is the whole distinction this
            // task is drawing.
            if let Some(cache) = cache_path(cfg) {
                if validate_cached_binary(&path, adapter).is_ok() {
                    write_cache(&cache, adapter.key, &path);
                }
            }
            let version = probe_version(cfg, &path, adapter);
            finish(cfg, path, version, login_path, adapter)
        }
        None => {
            probed.push(format!("login shell `command -v {}`", adapter.binary));
            probed.push(format!("PATH lookup for `{}`", adapter.binary));
            Err(ResolveError::NotFound { probed })
        }
    }
}

/// THE LOGIN PATH, FRESHLY PROBED (T-047, absorbing T-039-s1's second and
/// completely ungated half).
///
/// `cli.login_path` becomes the child's `PATH` — which decides which `git`
/// and which `cp` the planner's own Bash resolves to, and therefore what
/// nputer's advertised six-pattern Bash allowlist actually contains
/// (T-025-s4: those patterns match the command STRING and carry no path
/// scope). Before this it was read out of `agent-paths.json` with no gate
/// whatsoever — not even an executable bit, because it is a string.
///
/// **The arm taken is "not cached at all", and the cost was measured
/// rather than assumed**: `zsh -l -c 'echo …$PATH'` is **6–8 ms** on this
/// machine, against the **47–50 ms** `claude --version` probe that already
/// runs on every single resolve. Re-probing is ~15% of a cost the resolve
/// path already pays, on a path that runs once per interview TURN. There
/// was nothing to trade.
///
/// The script is narrower than [`login_shell_probe`]'s on purpose: this
/// asks only for the PATH, so it is a compile-time constant with no
/// interpolation and no `command -v`.
fn probe_login_path(cfg: &RunnerConfig) -> Option<String> {
    // The seam: suites never spawn a shell, and their `path_override` is
    // the PATH the child is asserted against byte for byte.
    if !cfg.probe_login_shell {
        return cfg.path_override.clone();
    }
    if cfg!(not(unix)) {
        return None;
    }
    let shell = std::env::var("SHELL")
        .ok()
        .map(PathBuf::from)
        .filter(|p| p.is_absolute() && is_executable_file(p))
        .unwrap_or_else(|| PathBuf::from("/bin/zsh"));
    let mut command = Command::new(&shell);
    command
        .arg("-l")
        .arg("-c")
        .arg("echo NPUTER_LOGIN_PATH=$PATH")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null());
    let output = run_with_timeout(command, cfg.probe_timeout)?;
    if !output.status_ok {
        return None;
    }
    output
        .stdout
        .lines()
        .find_map(|line| line.trim().strip_prefix("NPUTER_LOGIN_PATH=").map(str::to_string))
        .filter(|path| !path.is_empty())
}

fn finish(
    _cfg: &RunnerConfig,
    path: PathBuf,
    version: Option<String>,
    login_path: Option<String>,
    adapter: &AgentAdapter,
) -> Result<ResolvedCli, ResolveError> {
    if let Some(line) = &version {
        if let Some(major) = parse_major(line) {
            if major < adapter.min_major {
                return Err(ResolveError::Unsupported { found: line.clone() });
            }
        }
        // No leading number: cannot tell. Proceeding beats refusing on a
        // cosmetic banner change (a real flag mismatch fails loudly at
        // the first turn, with the CLI's own stderr).
    }
    Ok(ResolvedCli { path, version, login_path })
}

/// `[$SHELL -l -c "command -v <bin> && echo NPUTER_LOGIN_PATH=$PATH"]`.
///
/// One spawn, both answers: where the binary is, and the PATH a login
/// shell would have given it. `$SHELL` is read from the APP's own
/// environment (it is the user's shell, not an agent-binary override) and
/// is accepted only if it is an absolute path to an executable file;
/// anything else falls back to `/bin/zsh`.
fn login_shell_probe(cfg: &RunnerConfig, binary: &str) -> Option<(PathBuf, Option<String>)> {
    if cfg!(not(unix)) {
        return which_on_path(binary).map(|p| (p, None));
    }
    let shell = std::env::var("SHELL")
        .ok()
        .map(PathBuf::from)
        .filter(|p| p.is_absolute() && is_executable_file(p))
        .unwrap_or_else(|| PathBuf::from("/bin/zsh"));

    // Compile-time constant script; `binary` is the adapter's own
    // `&'static str`, never user input. No interpolation of anything the
    // webview or the filesystem supplied.
    let script = match binary {
        "claude" => "command -v claude && echo NPUTER_LOGIN_PATH=$PATH",
        _ => return which_on_path(binary).map(|p| (p, None)),
    };
    let mut command = Command::new(&shell);
    command
        .arg("-l")
        .arg("-c")
        .arg(script)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null());
    let output = run_with_timeout(command, cfg.probe_timeout)?;
    if !output.status_ok {
        return which_on_path(binary).map(|p| (p, None));
    }
    let mut found: Option<PathBuf> = None;
    let mut login_path: Option<String> = None;
    for line in output.stdout.lines() {
        let line = line.trim();
        if let Some(rest) = line.strip_prefix("NPUTER_LOGIN_PATH=") {
            login_path = Some(rest.to_string());
        } else if !line.is_empty() && found.is_none() {
            let candidate = PathBuf::from(line);
            if is_executable_file(&candidate) {
                found = Some(candidate);
            }
        }
    }
    match found {
        Some(path) => Some((path, login_path)),
        None => which_on_path(binary).map(|p| (p, login_path)),
    }
}

/// Plain PATH lookup — the fallback when there is no usable login shell.
fn which_on_path(binary: &str) -> Option<PathBuf> {
    which_in(&std::env::var("PATH").ok()?, binary)
}

/// PATH lookup over an explicit search path.
fn which_in(path: &str, binary: &str) -> Option<PathBuf> {
    std::env::split_paths(path)
        .map(|dir| dir.join(binary))
        .find(|candidate| is_executable_file(candidate))
}

fn probe_version(cfg: &RunnerConfig, path: &Path, adapter: &AgentAdapter) -> Option<String> {
    let mut command = Command::new(path);
    command
        .args(adapter.version_argv())
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null());
    // The version probe gets the same hygienic environment as a turn:
    // never the app's ambient secrets.
    apply_child_env(&mut command, cfg, None);
    let output = run_with_timeout(command, cfg.probe_timeout)?;
    let line = output.stdout.lines().next()?.trim().to_string();
    if line.is_empty() {
        None
    } else {
        Some(line)
    }
}

struct SimpleOutput {
    status_ok: bool,
    stdout: String,
}

/// Run a short command with a wall-clock timeout, killing its group on
/// expiry. Used only for the two one-shot probes.
fn run_with_timeout(mut command: Command, timeout: Duration) -> Option<SimpleOutput> {
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        command.process_group(0);
    }
    let mut child = command.spawn().ok()?;
    let pid = child.id() as i32;
    let mut stdout = child.stdout.take();
    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || {
        let mut buf = String::new();
        if let Some(handle) = stdout.as_mut() {
            let _ = handle.take(MAX_LINE_BYTES as u64).read_to_string(&mut buf);
        }
        let _ = tx.send(buf);
    });
    let deadline = Instant::now() + timeout;
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                let stdout = rx.recv_timeout(Duration::from_secs(2)).unwrap_or_default();
                return Some(SimpleOutput { status_ok: status.success(), stdout });
            }
            Ok(None) => {
                if Instant::now() >= deadline {
                    kill_group_now(pid);
                    let _ = child.wait();
                    return None;
                }
                std::thread::sleep(Duration::from_millis(20));
            }
            Err(_) => return None,
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Default)]
struct CacheFile {
    #[serde(default)]
    entries: std::collections::BTreeMap<String, CacheEntry>,
}

/// **T-047: `login_path` is GONE from this struct, and its absence is the
/// fix.** serde ignores unknown fields, so an `agent-paths.json` written
/// by an older build — or planted by an attacker — still parses, and its
/// `login_path` is simply never read by anything. That is the "not cached
/// at all" arm stated structurally: there is no field to trust, so no code
/// path can be added later that trusts it by accident. The login PATH is
/// re-probed by `probe_login_path` when it is needed.
#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct CacheEntry {
    path: String,
}

fn read_cache(path: &Path, key: &str) -> Option<PathBuf> {
    let raw = std::fs::read_to_string(path).ok()?;
    let parsed: CacheFile = serde_json::from_str(&raw).ok()?;
    let entry = parsed.entries.get(key)?.clone();
    Some(PathBuf::from(entry.path))
}

fn write_cache(path: &Path, key: &str, binary: &Path) {
    let mut file: CacheFile = std::fs::read_to_string(path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default();
    file.entries.insert(
        key.to_string(),
        CacheEntry {
            path: binary.display().to_string(),
        },
    );
    if let Ok(bytes) = serde_json::to_vec_pretty(&file) {
        if let Err(err) = super::kit::write_atomic(path, &bytes) {
            eprintln!("[nputer] agent: could not cache the resolved binary: {err}");
        }
    }
}

/// Invalidate the cached path for `key` (called on a spawn ENOENT, so the
/// next start re-probes once).
pub fn invalidate_cache(cfg: &RunnerConfig, key: &str) {
    let Some(path) = cache_path(cfg) else { return };
    let Some(raw) = std::fs::read_to_string(&path).ok() else { return };
    let Ok(mut file) = serde_json::from_str::<CacheFile>(&raw) else { return };
    file.entries.remove(key);
    if let Ok(bytes) = serde_json::to_vec_pretty(&file) {
        let _ = super::kit::write_atomic(&path, &bytes);
    }
}

// ---- the environment allowlist (§1) ------------------------------------

/// Variables forwarded to the child when present in the app's own
/// environment. Everything else is dropped by `env_clear()`.
///
/// NOT here, deliberately, exemplars named: `ANTHROPIC_API_KEY` (ADR-003:
/// the user's own CLI login is the auth; forwarding a key would make the
/// app a token conduit), the cloud-credential families `AWS_*` /
/// `GOOGLE_*`, `GITHUB_TOKEN`, `NPM_TOKEN`, and `TAURI_*`. A GUI-launched
/// app never had the shell's environment anyway — `env_clear` makes dev
/// and packaged behavior identical instead of accidentally different.
pub const ENV_ALLOWLIST: &[&str] = &[
    "HOME",
    "USER",
    "LOGNAME",
    "SHELL",
    "TMPDIR",
    "LANG",
    "LC_ALL",
    // Proxy / CA routing: without these a corporate network simply fails,
    // and none of them is a credential.
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "NO_PROXY",
    "http_proxy",
    "https_proxy",
    "no_proxy",
    "SSL_CERT_FILE",
    "SSL_CERT_DIR",
    "NODE_EXTRA_CA_CERTS",
];

/// Linux-only additions (the CLI's config/state live under XDG there).
pub const ENV_ALLOWLIST_LINUX: &[&str] =
    &["XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_CACHE_HOME"];

/// Build the child's environment: cleared, then exactly the allowlist,
/// then the forced `TERM=dumb`, then PATH, then the test seam's extras.
fn apply_child_env(command: &mut Command, cfg: &RunnerConfig, login_path: Option<&str>) {
    command.env_clear();
    for key in ENV_ALLOWLIST {
        if let Some(value) = std::env::var_os(key) {
            command.env(key, value);
        }
    }
    if cfg!(target_os = "linux") {
        for key in ENV_ALLOWLIST_LINUX {
            if let Some(value) = std::env::var_os(key) {
                command.env(key, value);
            }
        }
    }
    // Forced, not forwarded: a headless child must never think it drives
    // a terminal that can render escape sequences.
    command.env("TERM", "dumb");
    // PATH is the login-shell PATH when we captured one (the criterion's
    // explicit augmentation); otherwise our own, so the child at least
    // has what we had.
    let path = cfg
        .path_override
        .clone()
        .or_else(|| login_path.map(str::to_string))
        .or_else(|| std::env::var("PATH").ok());
    if let Some(path) = path {
        command.env("PATH", path);
    }
    for (key, value) in &cfg.extra_env {
        command.env(key, value);
    }
}

// ---- kill safety (§5) ---------------------------------------------------

#[cfg(unix)]
mod signals {
    // libc is already linked into every Rust unix binary; declaring the
    // two symbols we need keeps §9's zero-new-crates fence intact and
    // avoids spawning `kill(1)` (which would be a shell-free but absurd
    // way to send a signal).
    extern "C" {
        fn killpg(pgrp: i32, sig: i32) -> i32;
        fn kill(pid: i32, sig: i32) -> i32;
    }
    pub const SIGTERM: i32 = 15;
    pub const SIGKILL: i32 = 9;

    pub fn kill_group(pgid: i32, sig: i32) {
        unsafe {
            killpg(pgid, sig);
        }
    }
    /// Signal 0 asks "could I signal this pid?" without sending one.
    pub fn pid_alive(pid: i32) -> bool {
        unsafe { kill(pid, 0) == 0 }
    }
}

/// Is `pid` still alive? Exported for the group-kill proof.
#[cfg(unix)]
pub fn pid_alive(pid: i32) -> bool {
    signals::pid_alive(pid)
}
#[cfg(not(unix))]
pub fn pid_alive(_pid: i32) -> bool {
    false
}

fn kill_group_now(pid: i32) {
    #[cfg(unix)]
    signals::kill_group(pid, signals::SIGTERM);
    #[cfg(not(unix))]
    let _ = pid;
}

/// A live child's identity, kept in shared state so `genesis_cancel`, the
/// `RunEvent` exit hook, and `Drop` can all reach it.
///
/// The child is spawned into its OWN process group (`process_group(0)`,
/// so pgid == pid), which is what makes the group kill safe: the signal
/// reaches the CLI and every tool subprocess it forked, and reaches
/// nothing of ours.
#[derive(Clone, Copy, Debug)]
pub struct ChildHandle {
    pub pid: i32,
    pub turn: u32,
}

/// SIGTERM the group, wait the grace period, SIGKILL what is left. Called
/// from the app-exit paths, where blocking is correct.
pub fn terminate_group(pid: i32, grace: Duration) {
    #[cfg(unix)]
    {
        signals::kill_group(pid, signals::SIGTERM);
        let deadline = Instant::now() + grace;
        while Instant::now() < deadline {
            if !signals::pid_alive(pid) {
                return;
            }
            std::thread::sleep(Duration::from_millis(25));
        }
        signals::kill_group(pid, signals::SIGKILL);
    }
    #[cfg(not(unix))]
    {
        let _ = (pid, grace);
    }
}

/// SIGTERM now and escalate on a background thread, so a `genesis_cancel`
/// command answers immediately instead of holding the caller for the
/// grace period.
pub fn terminate_group_async(pid: i32, grace: Duration) {
    #[cfg(unix)]
    {
        signals::kill_group(pid, signals::SIGTERM);
        std::thread::spawn(move || {
            let deadline = Instant::now() + grace;
            while Instant::now() < deadline {
                if !signals::pid_alive(pid) {
                    return;
                }
                std::thread::sleep(Duration::from_millis(25));
            }
            signals::kill_group(pid, signals::SIGKILL);
        });
    }
    #[cfg(not(unix))]
    {
        let _ = (pid, grace);
    }
}

// ---- stream classification ---------------------------------------------

#[derive(Debug, PartialEq, Eq)]
pub enum StreamLine {
    Init { session_id: Option<String>, model: Option<String> },
    TextDelta(String),
    Activity(String),
    /// The turn's canonical text. `is_error` is the CLI's OWN verdict on
    /// it: observed in the real 2.1.226 smoke, an authentication failure
    /// arrives as `subtype: "success"` with `is_error: true` and the
    /// human-readable reason in `result` — while STDERR STAYS EMPTY. Not
    /// reading this flag is what made the first smoke report
    /// `exitNonZero { code: 1, stderrTail: "" }` and tell the user
    /// nothing at all.
    ///
    /// T-029 reads the three TYPED fields beside `is_error` rather than
    /// leaving them to be inferred from the text: `api_error_status`
    /// (401 on the observed auth failure), `terminal_reason` (`api_error`
    /// there) and `permission_denials` (the tools the CLI was refused).
    Result {
        text: String,
        is_error: bool,
        api_error_status: Option<u32>,
        terminal_reason: Option<String>,
        permission_denials: Vec<String>,
    },
    /// A well-formed JSON line carrying an error the CLI is reporting
    /// in-band (e.g. `system`/`api_retry` with `error_status: 401`).
    /// Kept as diagnostics so a failure has the CLI's own words even when
    /// nothing ever reaches stderr — and, since T-029, with the status
    /// kept as a NUMBER beside the note rather than only inside it.
    Diagnostic { note: String, error_status: Option<u32> },
    /// A well-formed JSON line of a type we do not act on — ignored, so
    /// the protocol is forward-compatible with new CLI event types.
    Ignored,
    /// Not JSON at all. Real CLIs emit warnings; tolerated into the
    /// diagnostic ring rather than failing the turn.
    NotJson,
}

/// Classify one stream line (`ParseMode::StreamJsonV1`).
pub fn classify_line(line: &str) -> StreamLine {
    let Ok(value) = serde_json::from_str::<serde_json::Value>(line) else {
        return StreamLine::NotJson;
    };
    let kind = value.get("type").and_then(|v| v.as_str()).unwrap_or("");
    match kind {
        "system" if value.get("subtype").and_then(|v| v.as_str()) == Some("init") => {
            StreamLine::Init {
                session_id: value
                    .get("session_id")
                    .and_then(|v| v.as_str())
                    .map(str::to_string),
                model: value.get("model").and_then(|v| v.as_str()).map(str::to_string),
            }
        }
        // Other `system` subtypes are ignored EXCEPT when they carry an
        // error the CLI is reporting in-band (`api_retry` does: attempt,
        // `error_status`, `error`). Observed live in the 2.1.226 smoke.
        "system" => {
            let status = value.get("error_status");
            let error = value.get("error");
            if status.is_some() || error.is_some() {
                let subtype = value.get("subtype").and_then(|v| v.as_str()).unwrap_or("system");
                let error_status = status.and_then(as_status_u32);
                let status = status.map(|v| v.to_string()).unwrap_or_default();
                let error = error.and_then(|v| v.as_str()).unwrap_or("").to_string();
                StreamLine::Diagnostic {
                    note: format!("{subtype}: {error} {status}").trim().to_string(),
                    error_status,
                }
            } else {
                StreamLine::Ignored
            }
        }
        "stream_event" => {
            let event = value.get("event");
            let event_type = event
                .and_then(|e| e.get("type"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            match event_type {
                "content_block_delta" => {
                    let delta = event.and_then(|e| e.get("delta"));
                    if delta.and_then(|d| d.get("type")).and_then(|v| v.as_str())
                        == Some("text_delta")
                    {
                        if let Some(text) = delta.and_then(|d| d.get("text")).and_then(|v| v.as_str())
                        {
                            return StreamLine::TextDelta(text.to_string());
                        }
                    }
                    StreamLine::Ignored
                }
                "content_block_start" => {
                    let block = event.and_then(|e| e.get("content_block"));
                    if block.and_then(|b| b.get("type")).and_then(|v| v.as_str()) == Some("tool_use")
                    {
                        let name = block
                            .and_then(|b| b.get("name"))
                            .and_then(|v| v.as_str())
                            .unwrap_or("tool");
                        return StreamLine::Activity(name.to_string());
                    }
                    StreamLine::Ignored
                }
                _ => StreamLine::Ignored,
            }
        }
        "assistant" => {
            let content = value
                .get("message")
                .and_then(|m| m.get("content"))
                .and_then(|c| c.as_array());
            if let Some(blocks) = content {
                for block in blocks {
                    if block.get("type").and_then(|v| v.as_str()) == Some("tool_use") {
                        let name = block.get("name").and_then(|v| v.as_str()).unwrap_or("tool");
                        return StreamLine::Activity(name.to_string());
                    }
                }
            }
            StreamLine::Ignored
        }
        "result" => {
            let text = value
                .get("result")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            // NOTE (real smoke, claude 2.1.226): `subtype` reads
            // "success" even on an authentication failure — `is_error` is
            // the field that tells the truth.
            let is_error = value.get("is_error").and_then(|v| v.as_bool()).unwrap_or(false);
            StreamLine::Result {
                text,
                is_error,
                api_error_status: value.get("api_error_status").and_then(as_status_u32),
                terminal_reason: value
                    .get("terminal_reason")
                    .and_then(|v| v.as_str())
                    .map(str::to_string),
                permission_denials: denial_names(value.get("permission_denials")),
            }
        }
        _ => StreamLine::Ignored,
    }
}

/// An HTTP-ish status off a stream line, whether the CLI wrote it as a
/// number or as a string. Anything outside 100–599 is not a status and is
/// dropped rather than coerced — this value routes a classification.
fn as_status_u32(value: &serde_json::Value) -> Option<u32> {
    let n = match value {
        serde_json::Value::Number(n) => n.as_u64()?,
        serde_json::Value::String(s) => s.trim().parse::<u64>().ok()?,
        _ => return None,
    };
    (100..=599).contains(&n).then_some(n as u32)
}

/// The tool names off a `permission_denials` array. The CLI writes
/// objects (`{"tool_name": "Bash", …}`) and could write bare strings; both
/// are read, everything else is skipped, and each name is BOUNDED and
/// stripped of control characters before it can reach a log line or the
/// screen — it is model-adjacent data off a stream, like every other
/// string in this module.
fn denial_names(value: Option<&serde_json::Value>) -> Vec<String> {
    let Some(serde_json::Value::Array(items)) = value else {
        return Vec::new();
    };
    items
        .iter()
        .take(MAX_DENIALS)
        .filter_map(|item| match item {
            serde_json::Value::String(s) => Some(s.as_str()),
            serde_json::Value::Object(_) => item
                .get("tool_name")
                .or_else(|| item.get("tool"))
                .and_then(|v| v.as_str()),
            _ => None,
        })
        .filter(|name| !name.trim().is_empty())
        .map(|name| {
            crate::docs_watch::sanitize_for_log(&super::sessions::truncate_utf8(name, MAX_DENIAL_BYTES))
        })
        .collect()
}

// ---- the turn ----------------------------------------------------------

/// Everything one turn needs. `prompt` is the ONLY caller-supplied text
/// and it travels on stdin.
pub struct TurnRequest {
    pub project_dir: PathBuf,
    pub prompt: String,
    /// `None` = spawn a fresh session; `Some(id)` = resume.
    pub resume: Option<String>,
    pub turn: u32,
}

/// What one turn produced. Exactly one of `text` / `error` / `cancelled`
/// is meaningful; a cancel is an outcome, not an error.
#[derive(Clone, Debug, Default)]
pub struct TurnOutcome {
    pub native_session_id: Option<String>,
    pub model: Option<String>,
    pub text: Option<String>,
    pub truncated_relay: bool,
    pub error: Option<TurnError>,
    pub cancelled: bool,
}

/// Run one turn to completion, relaying its stream as events.
///
/// Never panics (criterion 5): every failure path is a `TurnError`, the
/// child's group is killed, and the project is left untouched — the
/// runner never writes under `docs/` at all, so "leave the project
/// untouched" is by construction, not by care.
#[allow(clippy::too_many_arguments)]
pub fn run_turn(
    cfg: &RunnerConfig,
    adapter: &AgentAdapter,
    cli: &ResolvedCli,
    req: &TurnRequest,
    emitter: &Emitter,
    child_slot: &Mutex<Option<ChildHandle>>,
    cancel: &AtomicBool,
) -> TurnOutcome {
    let mut out = TurnOutcome::default();

    // T-039, THE SPAWN-SIDE GATE. Assembly is fallible, and a refusal
    // happens BEFORE anything is spawned: no child, no argv, no partial
    // state. This is the second boundary for an id read out of
    // `.nputer/sessions.json` (the first is `SessionEntry::resume_id`) and
    // the last one for any future caller.
    let argv = match adapter.argv(req.resume.as_deref()) {
        Ok(argv) => argv,
        Err(rejection) => {
            // T-029 (T-039-s3): the spawn-side gate's own envelope. Same
            // refusal, same escaped string, a name the webview can route
            // on — "start fresh" is the affordance this one wants, and it
            // is not the affordance a truncated stream line wants.
            let error = TurnError::RejectedSessionId {
                why: format!("refusing to resume: {rejection}"),
            };
            out.error = Some(error.clone());
            emitter.failed(req.turn, error);
            return out;
        }
    };

    let mut command = Command::new(&cli.path);
    command
        .args(argv)
        .current_dir(&req.project_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    apply_child_env(&mut command, cfg, cli.login_path.as_deref());
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        // Own process group: pgid == the child's pid, so a group kill
        // reaches the CLI and every tool subprocess it forked, and
        // nothing of ours.
        command.process_group(0);
    }

    let mut child: Child = match command.spawn() {
        Ok(child) => child,
        Err(err) => {
            if err.kind() == std::io::ErrorKind::NotFound {
                invalidate_cache(cfg, adapter.key);
            }
            let error = TurnError::SpawnFailed { os: err.to_string() };
            out.error = Some(error.clone());
            emitter.failed(req.turn, error);
            return out;
        }
    };
    let pid = child.id() as i32;
    *child_slot.lock().expect("child slot poisoned") = Some(ChildHandle { pid, turn: req.turn });
    emitter.started(req.turn);

    // The prompt goes in on stdin and stdin closes — never in argv, which
    // `ps` shows to every user on the box.
    if let Some(mut stdin) = child.stdin.take() {
        let _ = stdin.write_all(req.prompt.as_bytes());
        // Dropping closes the pipe: the CLI sees EOF and starts.
    }

    let (line_tx, line_rx) = mpsc::channel::<LineMsg>();
    if let Some(stdout) = child.stdout.take() {
        let tx = line_tx.clone();
        std::thread::spawn(move || read_lines_capped(stdout, MAX_LINE_BYTES, tx));
    }
    drop(line_tx);

    let stderr_ring = Arc::new(Mutex::new(Ring::new(MAX_STDERR_RING)));
    if let Some(stderr) = child.stderr.take() {
        let ring = stderr_ring.clone();
        std::thread::spawn(move || {
            let mut reader = BufReader::new(stderr);
            let mut buf = [0u8; 4096];
            while let Ok(n) = reader.read(&mut buf) {
                if n == 0 {
                    break;
                }
                ring.lock().expect("stderr ring poisoned").push(&buf[..n]);
            }
        });
    }

    // --- the relay loop ---------------------------------------------
    let mut pending = String::new();
    let mut pending_since: Option<Instant> = None;
    let mut relayed: usize = 0;
    let mut saw_any_line = false;
    let mut saw_json_anchor = false;
    let mut last_activity: Option<String> = None;
    let mut result_text: Option<String> = None;
    let mut result_is_error = false;
    // T-029: the facts the stream NAMES, kept typed as they arrive rather
    // than folded into a diagnostic string and re-read out of it later.
    let mut auth_status: Option<u32> = None;
    let mut auth_message: Option<String> = None;
    let mut terminal_reason: Option<String> = None;
    let mut permission_denials: Vec<String> = Vec::new();
    let mut oversize = false;
    let mut last_line_at = Instant::now();
    let mut failure: Option<TurnError> = None;

    loop {
        if cancel.load(Ordering::SeqCst) {
            out.cancelled = true;
            break;
        }
        match line_rx.recv_timeout(Duration::from_millis(25)) {
            Ok(LineMsg::Line(line)) => {
                last_line_at = Instant::now();
                saw_any_line = true;
                match classify_line(&line) {
                    StreamLine::Init { session_id, model } => {
                        saw_json_anchor = true;
                        if let Some(id) = session_id {
                            // T-039, THE CAPTURE-SIDE GATE — before the
                            // event, before the registry, before any
                            // resume. A stream is data: the id is refused
                            // LOUDLY here rather than coerced into
                            // something acceptable, so `out
                            // .native_session_id` stays None, the settle
                            // path writes no id to `.nputer/sessions.json`,
                            // and `send_turn` has nothing to resume from.
                            if let Err(rejection) = validate_session_id(&id) {
                                // T-029 (T-039-s3): its OWN envelope, not
                                // `MalformedStream`. The refusal string is
                                // unchanged and already escaped; only what
                                // carries it moved.
                                failure = Some(TurnError::RejectedSessionId {
                                    why: format!(
                                        "the CLI's init line carried an unusable session id: {rejection}"
                                    ),
                                });
                                break;
                            }
                            if out.native_session_id.as_deref() != Some(id.as_str()) {
                                emitter.session_registered(id.clone());
                                out.native_session_id = Some(id);
                            }
                        }
                        // T-047, THE MODEL GATE (absorbing T-039-s2). The
                        // model rides the same init line the id does and
                        // is written to `.nputer/sessions.json` and
                        // rendered — before this it was accepted unbounded
                        // behind only the 1 MiB line cap.
                        //
                        // DELIBERATELY NOT SYMMETRIC WITH THE ID ABOVE,
                        // and this is the recorded reason: a refused id
                        // must fail the turn, because a turn whose id was
                        // refused cannot be resumed and telling the user
                        // otherwise would be a lie. A refused model costs
                        // the user nothing but the recorded name of what
                        // ran — the answer the planner just wrote is still
                        // good — so throwing away a completed interview
                        // turn over a cosmetic field would be a worse
                        // failure than the one being prevented. It is
                        // refused, never coerced (no truncation, no
                        // stripping): `out.model` stays None, the registry
                        // records no model, and the fact is said out loud
                        // on stdout rather than swallowed.
                        match model {
                            Some(model) => match validate_model(&model) {
                                Ok(()) => out.model = Some(model),
                                Err(rejection) => println!(
                                    "[nputer] agent: the CLI's init line carried an unusable model name ({rejection}) - the turn stands, the name is not recorded"
                                ),
                            },
                            None => {}
                        }
                    }
                    StreamLine::TextDelta(text) => {
                        saw_json_anchor = true;
                        if relayed < MAX_RELAY_BYTES {
                            if pending.is_empty() {
                                pending_since = Some(Instant::now());
                            }
                            pending.push_str(&text);
                        } else {
                            out.truncated_relay = true;
                        }
                    }
                    StreamLine::Activity(label) => {
                        saw_json_anchor = true;
                        flush_pending(emitter, req.turn, &mut pending, &mut pending_since, &mut relayed);
                        if last_activity.as_deref() != Some(label.as_str()) {
                            emitter.activity(req.turn, label.clone());
                            last_activity = Some(label);
                        }
                    }
                    StreamLine::Result {
                        text,
                        is_error,
                        api_error_status,
                        terminal_reason: reason,
                        permission_denials: denials,
                    } => {
                        saw_json_anchor = true;
                        if is_error {
                            // The CLI's own explanation, which may be the
                            // ONLY one there is (stderr can be empty).
                            stderr_ring
                                .lock()
                                .expect("stderr ring poisoned")
                                .push(text.as_bytes());
                            result_is_error = true;
                            // …and it is the best MESSAGE the auth failure
                            // has: the `api_retry` note is machine words,
                            // this line is the sentence a human reads.
                            auth_message = Some(text.clone());
                        }
                        // T-029-s6: ASSIGNED, NEVER MERGED. The terminal
                        // line is the turn's own verdict, so a `result`
                        // WITHOUT an `api_error_status` CLEARS a status
                        // an earlier `api_retry` left behind. Guarding
                        // this with `is_some()` made `auth_status` a
                        // MONOTONE LATCH: a 401 the CLI retried and got
                        // PAST survived to the classification below and
                        // relabelled whatever actually killed the turn —
                        // a full disk, a refused tool — as an auth
                        // failure, which then REMOVES the retry
                        // affordance and sends the user to `claude
                        // login` with a login that is fine.
                        auth_status = api_error_status;
                        if reason.is_some() {
                            terminal_reason = reason;
                        }
                        if !denials.is_empty() {
                            permission_denials = denials;
                        }
                        result_text = Some(text);
                    }
                    StreamLine::Diagnostic { note, error_status } => {
                        saw_json_anchor = true;
                        if error_status.is_some() {
                            auth_status = error_status;
                        }
                        stderr_ring.lock().expect("stderr ring poisoned").push(note.as_bytes());
                        stderr_ring.lock().expect("stderr ring poisoned").push(b"\n");
                    }
                    StreamLine::Ignored => saw_json_anchor = true,
                    StreamLine::NotJson => {
                        // A real CLI's warning line. Kept as diagnostics
                        // only; never relayed as model text.
                        stderr_ring
                            .lock()
                            .expect("stderr ring poisoned")
                            .push(line.as_bytes());
                    }
                }
            }
            Ok(LineMsg::Oversize) => {
                // Nothing further can be trusted from this stream: the
                // turn fails as MalformedStream and the group is killed.
                oversize = true;
                break;
            }
            Err(mpsc::RecvTimeoutError::Disconnected) => break, // EOF
            Err(mpsc::RecvTimeoutError::Timeout) => {
                // Coalescing window: a buffered delta never waits longer
                // than `cfg.coalesce` before it is emitted (§4's stated
                // bound — 150 ms coalesce + emit ≤ 250 ms).
                if let Some(since) = pending_since {
                    if since.elapsed() >= cfg.coalesce {
                        flush_pending(emitter, req.turn, &mut pending, &mut pending_since, &mut relayed);
                    }
                }
                let idle = last_line_at.elapsed();
                if !saw_any_line && idle >= cfg.start_timeout {
                    failure = Some(TurnError::StartTimeout);
                    break;
                }
                if saw_any_line && idle >= cfg.stall_timeout {
                    failure = Some(TurnError::Stall);
                    break;
                }
            }
        }
    }
    flush_pending(emitter, req.turn, &mut pending, &mut pending_since, &mut relayed);

    // A cancel that RACED the stream's EOF is still a cancel. Without
    // this re-read, `genesis_cancel` killing the child fast enough would
    // reach the loop as a plain EOF and be reported as `ExitNonZero`
    // (signal-killed, no code) — a typed FAILURE for something the user
    // deliberately did. Cancel is an outcome, not an error.
    if cancel.load(Ordering::SeqCst) {
        out.cancelled = true;
    }

    // --- reap, then decide -------------------------------------------
    let status = if failure.is_some() || out.cancelled {
        terminate_group(pid, cfg.kill_grace);
        let _ = child.wait();
        None
    } else {
        child.wait().ok()
    };
    // The turn's child is gone; nothing must outlive it.
    *child_slot.lock().expect("child slot poisoned") = None;

    if out.cancelled {
        return out;
    }
    let stderr_tail = stderr_ring.lock().expect("stderr ring poisoned").to_string();

    let error = failure.or_else(|| {
        if oversize {
            return Some(TurnError::MalformedStream {
                why: format!("a stream line exceeded {MAX_LINE_BYTES} bytes"),
            });
        }

        // T-029, THE TYPED CLASSIFICATION, and it runs BEFORE the exit
        // code is looked at — deliberately, because the exit code is the
        // least informative thing about either of these failures. The
        // real CLI exits 1 for an authentication failure and 1 for a
        // dozen unrelated things; the STREAM is where it says which.
        //
        // Scoped to a turn that actually failed. That scope is NOT
        // enough on its own, and T-029-s6/s7 are the two ways it was
        // not: a turn can reach here having SURVIVED the evidence it is
        // about to be classified on. So each arm below is bound to the
        // turn's TERMINAL state rather than to anything merely SEEN —
        // the auth status by the assignment above, the denials by the
        // `result_is_error` guard below. A classification is a claim
        // about what killed the turn; evidence the turn walked away from
        // does not support one.
        let exited_badly = matches!(status, Some(s) if !s.success());
        if exited_badly || result_is_error {
            // 401 (no/expired credentials) and 403 (credentials the API
            // will not accept). Every other status is somebody else's
            // problem and stays a relayed tail rather than a guess.
            if matches!(auth_status, Some(401) | Some(403)) {
                let message = auth_message
                    .as_deref()
                    .map(str::trim)
                    .filter(|m| !m.is_empty())
                    .unwrap_or("the agent CLI could not authenticate");
                return Some(TurnError::AuthFailed {
                    status: auth_status,
                    message: crate::docs_watch::sanitize_for_log(&super::sessions::truncate_utf8(
                        message,
                        MAX_AUTH_MESSAGE_BYTES,
                    )),
                });
            }
            // T-025-s1: a turn that died because `--allowedTools` was too
            // narrow says which tool, by name.
            //
            // T-029-s7: …and `result_is_error` is what makes "died
            // because" true. `permission_denials` is a CUMULATIVE RECORD
            // of everything refused during the turn, not a statement
            // that a refusal ended it: a planner denied `WebFetch`, that
            // routed around it and finished with `terminal_reason:
            // "end_turn"`, whose process then exits nonzero, was being
            // told it died of the refusal while its own terminal reason
            // said otherwise.
            //
            // THE NARROW GUARD IS DELIBERATE. The wider form — "or a
            // `terminal_reason` outside the CLI's normal-completion set"
            // — needs the set of reasons a REAL denial produces, and
            // that set is exactly what T-029-s5 records as still
            // unverified: the `tool-denied` fixture's `"refusal"` is
            // constructed, not transcribed, because no live denial could
            // be provoked from a revoked login. `result_is_error` is a
            // field the CLI demonstrably sets, so the guard rests on
            // observation rather than on a guess about a vocabulary.
            if result_is_error && !permission_denials.is_empty() {
                return Some(TurnError::ToolDenied {
                    denials: permission_denials.clone(),
                    terminal_reason: terminal_reason
                        .as_deref()
                        .map(crate::docs_watch::sanitize_for_log),
                });
            }
        }

        match status {
            Some(status) if !status.success() => Some(TurnError::ExitNonZero {
                code: status.code(),
                stderr_tail: crate::docs_watch::sanitize_for_log(&stderr_tail),
            }),
            _ => {
                if !saw_json_anchor {
                    Some(TurnError::MalformedStream {
                        why: "no JSON stream lines at all".into(),
                    })
                } else if req.resume.is_none() && out.native_session_id.is_none() {
                    Some(TurnError::MalformedStream {
                        why: "no session init line in the stream".into(),
                    })
                } else if result_text.is_none() {
                    Some(TurnError::MalformedStream {
                        why: "the CLI exited without a result line".into(),
                    })
                } else if result_is_error {
                    // Exit 0 but the CLI marked its own result an error.
                    // Not observed in the 2.1.226 smoke (it exited 1),
                    // but relaying a failure as if it were the planner's
                    // answer would be the worst outcome, so it is typed.
                    Some(TurnError::ExitNonZero {
                        code: status.and_then(|s| s.code()),
                        stderr_tail: crate::docs_watch::sanitize_for_log(&stderr_tail),
                    })
                } else {
                    None
                }
            }
        }
    });

    match error {
        Some(error) => {
            out.error = Some(error.clone());
            emitter.failed(req.turn, error);
        }
        None => {
            let text = result_text.unwrap_or_default();
            emitter.completed(req.turn, cap_text(&text), out.truncated_relay);
            out.text = Some(text);
        }
    }
    out
}

fn flush_pending(
    emitter: &Emitter,
    turn: u32,
    pending: &mut String,
    pending_since: &mut Option<Instant>,
    relayed: &mut usize,
) {
    if pending.is_empty() {
        *pending_since = None;
        return;
    }
    let text = std::mem::take(pending);
    *pending_since = None;
    *relayed += text.len();
    emitter.text_delta(turn, cap_text(&text));
}

fn cap_text(text: &str) -> String {
    super::sessions::truncate_utf8(text, MAX_EVENT_TEXT)
}

enum LineMsg {
    Line(String),
    /// A line exceeded the cap; the turn fails as `MalformedStream`.
    Oversize,
}

/// Read newline-delimited lines with a hard per-line cap, so a
/// pathological (or hostile) stream cannot balloon memory. Non-UTF-8
/// bytes are lossily decoded rather than dropping the line — the
/// classifier will simply call it not-JSON.
fn read_lines_capped(source: impl Read, cap: usize, tx: mpsc::Sender<LineMsg>) {
    let mut reader = BufReader::new(source);
    let mut line: Vec<u8> = Vec::new();
    let mut over = false;
    let mut buf = [0u8; 8192];
    loop {
        let n = match reader.read(&mut buf) {
            Ok(0) => break,
            Ok(n) => n,
            Err(_) => break,
        };
        for &byte in &buf[..n] {
            if byte == b'\n' {
                if over {
                    if tx.send(LineMsg::Oversize).is_err() {
                        return;
                    }
                    over = false;
                } else if !line.is_empty() {
                    let text = String::from_utf8_lossy(&line).into_owned();
                    if tx.send(LineMsg::Line(text)).is_err() {
                        return;
                    }
                }
                line.clear();
            } else if !over {
                line.push(byte);
                if line.len() > cap {
                    over = true;
                    line.clear();
                }
            }
        }
    }
    if over {
        let _ = tx.send(LineMsg::Oversize);
    } else if !line.is_empty() {
        let _ = tx.send(LineMsg::Line(String::from_utf8_lossy(&line).into_owned()));
    }
}

/// Bounded byte ring for stderr tails.
struct Ring {
    buf: VecDeque<u8>,
    cap: usize,
}

impl Ring {
    fn new(cap: usize) -> Self {
        Self { buf: VecDeque::new(), cap }
    }
    fn push(&mut self, bytes: &[u8]) {
        for &b in bytes {
            if self.buf.len() == self.cap {
                self.buf.pop_front();
            }
            self.buf.push_back(b);
        }
    }
    fn to_string(&self) -> String {
        let bytes: Vec<u8> = self.buf.iter().copied().collect();
        String::from_utf8_lossy(&bytes).into_owned()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_reads_nothing_from_the_environment() {
        // A hostile env cannot redirect the production spawn: the three
        // seam fields are Rust-only, filled by a test constructing the
        // struct — never by any variable.
        std::env::set_var("NPUTER_AGENT_BIN", "/tmp/evil");
        std::env::set_var("NPUTER_FAKE_SCENARIO", "happy");
        std::env::set_var("NPUTER_AGENT_PATH", "/tmp/evil/bin");
        let cfg = RunnerConfig::default();
        assert_eq!(cfg.binary_override, None);
        assert_eq!(cfg.path_override, None);
        assert!(cfg.extra_env.is_empty());
        assert_eq!(cfg.config_dir, None);
        assert!(
            cfg.probe_login_shell,
            "production DOES probe the login shell - that is criterion 4"
        );
        std::env::remove_var("NPUTER_AGENT_BIN");
        std::env::remove_var("NPUTER_FAKE_SCENARIO");
        std::env::remove_var("NPUTER_AGENT_PATH");
    }

    #[test]
    fn the_env_allowlist_carries_no_credential_family() {
        for key in ENV_ALLOWLIST.iter().chain(ENV_ALLOWLIST_LINUX) {
            let upper = key.to_ascii_uppercase();
            for banned in [
                "ANTHROPIC", "AWS_", "GOOGLE", "GITHUB", "NPM_TOKEN", "TAURI_", "TOKEN", "SECRET",
                "KEY", "PASSWORD", "CREDENTIAL",
            ] {
                assert!(
                    !upper.contains(banned),
                    "{key} looks like a credential family and must not be forwarded"
                );
            }
        }
        // TERM is never forwarded — it is FORCED to dumb.
        assert!(!ENV_ALLOWLIST.contains(&"TERM"));
        assert!(!ENV_ALLOWLIST.contains(&"PATH"), "PATH is set explicitly, not forwarded");
    }

    #[test]
    fn classify_reads_the_stream_json_v1_shapes() {
        assert_eq!(
            classify_line(r#"{"type":"system","subtype":"init","session_id":"S","model":"m"}"#),
            StreamLine::Init { session_id: Some("S".into()), model: Some("m".into()) }
        );
        assert_eq!(
            classify_line(
                r#"{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"hi"}}}"#
            ),
            StreamLine::TextDelta("hi".into())
        );
        assert_eq!(
            classify_line(
                r#"{"type":"stream_event","event":{"type":"content_block_start","content_block":{"type":"tool_use","name":"Write"}}}"#
            ),
            StreamLine::Activity("Write".into())
        );
        assert_eq!(
            classify_line(
                r#"{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Bash"}]}}"#
            ),
            StreamLine::Activity("Bash".into())
        );
        assert_eq!(
            classify_line(r#"{"type":"result","subtype":"success","result":"done"}"#),
            StreamLine::Result {
                text: "done".into(),
                is_error: false,
                api_error_status: None,
                terminal_reason: None,
                permission_denials: vec![],
            }
        );
        // The real 2.1.226 auth-failure shape: subtype STILL says
        // "success" — `is_error` is the field that tells the truth, and
        // since T-029 `api_error_status` is READ rather than skipped past.
        assert_eq!(
            classify_line(
                r#"{"type":"result","subtype":"success","is_error":true,"api_error_status":401,"terminal_reason":"api_error","result":"Failed to authenticate."}"#
            ),
            StreamLine::Result {
                text: "Failed to authenticate.".into(),
                is_error: true,
                api_error_status: Some(401),
                terminal_reason: Some("api_error".into()),
                permission_denials: vec![],
            }
        );
        // In-band system errors become diagnostics, not silence — and the
        // status rides as a NUMBER beside the note (T-029).
        match classify_line(
            r#"{"type":"system","subtype":"api_retry","attempt":1,"error_status":401,"error":"authentication_failed"}"#,
        ) {
            StreamLine::Diagnostic { note, error_status } => {
                assert!(note.contains("api_retry") && note.contains("authentication_failed"));
                assert!(note.contains("401"));
                assert_eq!(error_status, Some(401));
            }
            other => panic!("expected Diagnostic, got {other:?}"),
        }
        // A system line with no error stays ignored (e.g. `status`).
        assert_eq!(
            classify_line(r#"{"type":"system","subtype":"status","status":"requesting"}"#),
            StreamLine::Ignored
        );
        // Forward-compatible: an unknown JSON type is ignored, not fatal.
        assert_eq!(classify_line(r#"{"type":"brand_new_thing"}"#), StreamLine::Ignored);
        assert_eq!(classify_line(r#"{"no":"type"}"#), StreamLine::Ignored);
        // Non-JSON is tolerated (real CLIs warn on stdout).
        assert_eq!(classify_line("warning: node 18 is deprecated"), StreamLine::NotJson);
        assert_eq!(classify_line(""), StreamLine::NotJson);
    }

    #[test]
    fn line_reader_caps_a_single_line_and_reports_oversize() {
        let mut input = Vec::new();
        input.extend_from_slice(b"short\n");
        input.extend(std::iter::repeat(b'x').take(64));
        input.push(b'\n');
        input.extend_from_slice(b"after\n");
        let (tx, rx) = mpsc::channel();
        read_lines_capped(&input[..], 16, tx);
        let msgs: Vec<String> = rx
            .into_iter()
            .map(|m| match m {
                LineMsg::Line(l) => l,
                LineMsg::Oversize => "<oversize>".into(),
            })
            .collect();
        assert_eq!(msgs, vec!["short", "<oversize>", "after"]);
    }

    #[test]
    fn line_reader_emits_a_trailing_unterminated_line() {
        let (tx, rx) = mpsc::channel();
        read_lines_capped(&b"a\nb"[..], 1024, tx);
        let msgs: Vec<String> = rx
            .into_iter()
            .map(|m| match m {
                LineMsg::Line(l) => l,
                LineMsg::Oversize => "<oversize>".into(),
            })
            .collect();
        assert_eq!(msgs, vec!["a", "b"]);
    }

    #[test]
    fn the_stderr_ring_keeps_the_tail_not_the_head() {
        let mut ring = Ring::new(8);
        ring.push(b"0123456789abc");
        assert_eq!(ring.to_string(), "56789abc");
    }

    #[test]
    fn cap_text_bounds_one_event_payload() {
        let huge = "a".repeat(MAX_EVENT_TEXT + 100);
        assert_eq!(cap_text(&huge).len(), MAX_EVENT_TEXT);
        assert_eq!(cap_text("small"), "small");
    }

    /// T-047 (T-039-s1, first half): what a cached binary path has to
    /// survive before anything executes it.
    ///
    /// Each refused shape here is one this task MEASURED executing against
    /// the unfixed code — the traversal and misnamed rows both ran their
    /// binary at resolve time, through `probe_version`'s `Command::new`,
    /// before any turn existed.
    #[test]
    fn a_cached_binary_path_must_look_like_something_a_probe_could_have_said() {
        let adapter = super::super::adapter::planner_adapter();
        for (path, expected) in [
            ("", CachedPathRejection::Empty),
            ("claude", CachedPathRejection::NotAbsolute),
            ("bin/claude", CachedPathRejection::NotAbsolute),
            ("./bin/claude", CachedPathRejection::NotAbsolute),
            ("/opt/bin/../evil/claude", CachedPathRejection::Traversal),
            ("/opt/./claude", CachedPathRejection::Traversal),
            ("/../claude", CachedPathRejection::Traversal),
            (
                "/opt/homebrew/bin/tattler",
                CachedPathRejection::WrongName { expected: "claude" },
            ),
            ("/opt/homebrew/bin/", CachedPathRejection::WrongName { expected: "claude" }),
            // Absolute, traversal-free, correctly named — and nothing
            // there. The file check is KEPT, not replaced.
            ("/nonexistent-t047/bin/claude", CachedPathRejection::NotExecutable),
        ] {
            assert_eq!(
                validate_cached_binary(Path::new(path), adapter),
                Err(expected.clone()),
                "cached path {path:?} must be refused as {expected:?}"
            );
        }

        // The discriminating half: a real executable, absolute and named
        // `claude`, is accepted — a gate nobody can pass is not a gate.
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let dir = std::env::temp_dir().join(format!(
                "nputer-t047-cachepath-{}-{}",
                std::process::id(),
                now_ms()
            ));
            std::fs::create_dir_all(&dir).expect("mk dir");
            let good = dir.join("claude");
            std::fs::write(&good, "#!/bin/sh\nexit 0\n").expect("write");
            std::fs::set_permissions(&good, std::fs::Permissions::from_mode(0o755))
                .expect("chmod");
            assert_eq!(validate_cached_binary(&good, adapter), Ok(()));
            // …and the same file with the bit cleared is not.
            std::fs::set_permissions(&good, std::fs::Permissions::from_mode(0o644))
                .expect("chmod");
            assert_eq!(
                validate_cached_binary(&good, adapter),
                Err(CachedPathRejection::NotExecutable)
            );
            let _ = std::fs::remove_dir_all(&dir);
        }
    }

    /// T-047 (T-039-s1, second half): THE LOGIN PATH IS NOT CACHED.
    ///
    /// It used to be written into `agent-paths.json` and read back
    /// verbatim into the child's `PATH` with no gate whatsoever — not even
    /// an executable bit, because it is a string — which decides which
    /// `git` and which `cp` the planner's own Bash resolves to. The arm
    /// taken is "not cached at all": the field is gone from the struct, so
    /// there is nothing to trust and nothing a later change can trust by
    /// accident, and the PATH is re-probed instead (6-8 ms measured,
    /// against the 47-50 ms `--version` probe the same resolve already
    /// pays).
    #[test]
    fn the_resolution_cache_stores_a_path_and_never_a_login_path() {
        let dir = std::env::temp_dir().join(format!(
            "nputer-t047-cachefile-{}-{}",
            std::process::id(),
            now_ms()
        ));
        std::fs::create_dir_all(&dir).expect("mk dir");
        let cache = dir.join("agent-paths.json");

        // What we WRITE carries a path and nothing else.
        write_cache(&cache, "claude", Path::new("/opt/homebrew/bin/claude"));
        let raw = std::fs::read_to_string(&cache).expect("cache file");
        let parsed: serde_json::Value = serde_json::from_str(&raw).expect("parses");
        let entry = &parsed["entries"]["claude"];
        let keys: Vec<&String> = entry.as_object().expect("object").keys().collect();
        assert_eq!(keys, vec!["path"], "the written entry carries a path and nothing else");
        assert!(!raw.contains("login_path"), "no login PATH is ever written: {raw}");
        assert_eq!(read_cache(&cache, "claude"), Some(PathBuf::from("/opt/homebrew/bin/claude")));

        // What we READ ignores a `login_path` an older build — or an
        // attacker — left behind. It parses; it is simply unreachable.
        std::fs::write(
            &cache,
            r#"{"entries":{"claude":{"path":"/opt/homebrew/bin/claude","login_path":"/nputer-hostile/bin"}}}"#,
        )
        .expect("plant");
        assert_eq!(
            read_cache(&cache, "claude"),
            Some(PathBuf::from("/opt/homebrew/bin/claude")),
            "a planted login_path must not stop the entry parsing…"
        );
        // …and there is no accessor that could return it: `CacheEntry` has
        // one field. Re-derived from the type rather than asserted about
        // it — a round trip through the struct drops the planted value.
        write_cache(&cache, "claude", Path::new("/opt/homebrew/bin/claude"));
        assert!(
            !std::fs::read_to_string(&cache).expect("re-read").contains("nputer-hostile"),
            "the planted login_path survived a read-modify-write"
        );

        // The PATH's source is the probe channel, not the file. Under the
        // seam (`probe_login_shell: false`, which every suite sets so no
        // test can spawn a shell) that channel is `path_override`.
        let cfg = RunnerConfig {
            probe_login_shell: false,
            path_override: Some("/t047-fresh/bin".into()),
            ..RunnerConfig::default()
        };
        assert_eq!(probe_login_path(&cfg), Some("/t047-fresh/bin".to_string()));
        let cfg = RunnerConfig { probe_login_shell: false, ..RunnerConfig::default() };
        assert_eq!(probe_login_path(&cfg), None, "no seam, no shell, no PATH");

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn resolve_uses_the_injected_binary_without_probing() {
        // The seam short-circuits resolution: no login shell is spawned,
        // and the injected path is used verbatim.
        let cfg = RunnerConfig {
            binary_override: Some(PathBuf::from("/nonexistent/agent-binary")),
            ..RunnerConfig::default()
        };
        let resolved = resolve_cli(&cfg, super::super::adapter::planner_adapter())
            .expect("the seam never refuses");
        assert_eq!(resolved.path, PathBuf::from("/nonexistent/agent-binary"));
        assert_eq!(resolved.version, None, "a missing binary reports no version");
    }
}
