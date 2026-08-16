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
//!   files. Port 1420 is never involved.

use std::collections::VecDeque;
use std::io::{BufReader, Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{mpsc, Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use serde::Serialize;

use super::adapter::{is_executable_file, parse_major, AgentAdapter};

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
    /// relayed for T-027 to show — auth expiry has no reliable exit-code
    /// signature, so classification is a named silence, not a pretense.
    ExitNonZero { code: Option<i32>, stderr_tail: String },
    /// The stream did not carry what the protocol needs.
    MalformedStream { why: String },
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

/// The cache file beside the app config, so the login-shell probe runs
/// once per install rather than once per turn.
fn cache_path(cfg: &RunnerConfig) -> Option<PathBuf> {
    cfg.config_dir.as_ref().map(|dir| dir.join("agent-paths.json"))
}

/// Resolve the adapter's binary (§6 order): the test seam, then the
/// cached path, then a login-shell probe, then a typed not-found.
///
/// GUI-launch PATH poverty is the whole problem being solved: a packaged
/// .app launched from Finder inherits a minimal PATH that has never seen
/// the user's `~/.local/bin`, homebrew, nvm, or asdf shims.
pub fn resolve_cli(cfg: &RunnerConfig, adapter: &AgentAdapter) -> Result<ResolvedCli, ResolveError> {
    // (0) Test seam: an injected binary is used verbatim, version probe
    // included, so fixture scenarios exercise the same code path.
    if let Some(path) = &cfg.binary_override {
        let version = probe_version(cfg, path, adapter);
        return finish(cfg, path.clone(), version, cfg.path_override.clone(), adapter);
    }

    let mut probed: Vec<String> = Vec::new();

    // (1) Cached path from a previous probe, if still executable.
    if let Some(cache) = cache_path(cfg) {
        if let Some((path, login_path)) = read_cache(&cache, adapter.key) {
            if is_executable_file(&path) {
                let version = probe_version(cfg, &path, adapter);
                return finish(cfg, path, version, login_path, adapter);
            }
            // Stale cache (uninstalled, moved): fall through and re-probe.
            probed.push(format!("cached {}", path.display()));
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
            if let Some(cache) = cache_path(cfg) {
                write_cache(&cache, adapter.key, &path, login_path.as_deref());
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

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct CacheEntry {
    path: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    login_path: Option<String>,
}

fn read_cache(path: &Path, key: &str) -> Option<(PathBuf, Option<String>)> {
    let raw = std::fs::read_to_string(path).ok()?;
    let parsed: CacheFile = serde_json::from_str(&raw).ok()?;
    let entry = parsed.entries.get(key)?.clone();
    Some((PathBuf::from(entry.path), entry.login_path))
}

fn write_cache(path: &Path, key: &str, binary: &Path, login_path: Option<&str>) {
    let mut file: CacheFile = std::fs::read_to_string(path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default();
    file.entries.insert(
        key.to_string(),
        CacheEntry {
            path: binary.display().to_string(),
            login_path: login_path.map(str::to_string),
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
    Result { text: String, is_error: bool },
    /// A well-formed JSON line carrying an error the CLI is reporting
    /// in-band (e.g. `system`/`api_retry` with `error_status: 401`).
    /// Kept as diagnostics so a failure has the CLI's own words even when
    /// nothing ever reaches stderr.
    Diagnostic(String),
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
                let status = status.map(|v| v.to_string()).unwrap_or_default();
                let error = error.and_then(|v| v.as_str()).unwrap_or("").to_string();
                StreamLine::Diagnostic(format!("{subtype}: {error} {status}").trim().to_string())
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
            StreamLine::Result { text, is_error }
        }
        _ => StreamLine::Ignored,
    }
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

    let mut command = Command::new(&cli.path);
    command
        .args(adapter.argv(req.resume.as_deref()))
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
                            if out.native_session_id.as_deref() != Some(id.as_str()) {
                                emitter.session_registered(id.clone());
                                out.native_session_id = Some(id);
                            }
                        }
                        if model.is_some() {
                            out.model = model;
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
                    StreamLine::Result { text, is_error } => {
                        saw_json_anchor = true;
                        if is_error {
                            // The CLI's own explanation, which may be the
                            // ONLY one there is (stderr can be empty).
                            stderr_ring
                                .lock()
                                .expect("stderr ring poisoned")
                                .push(text.as_bytes());
                            result_is_error = true;
                        }
                        result_text = Some(text);
                    }
                    StreamLine::Diagnostic(note) => {
                        saw_json_anchor = true;
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
            StreamLine::Result { text: "done".into(), is_error: false }
        );
        // The real 2.1.226 auth-failure shape: subtype STILL says
        // "success" — `is_error` is the field that tells the truth.
        assert_eq!(
            classify_line(
                r#"{"type":"result","subtype":"success","is_error":true,"api_error_status":401,"result":"Failed to authenticate."}"#
            ),
            StreamLine::Result { text: "Failed to authenticate.".into(), is_error: true }
        );
        // In-band system errors become diagnostics, not silence.
        match classify_line(
            r#"{"type":"system","subtype":"api_retry","attempt":1,"error_status":401,"error":"authentication_failed"}"#,
        ) {
            StreamLine::Diagnostic(note) => {
                assert!(note.contains("api_retry") && note.contains("authentication_failed"));
                assert!(note.contains("401"));
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
