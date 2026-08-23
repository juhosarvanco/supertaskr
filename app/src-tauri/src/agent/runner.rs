//! T-025 §§1/4/6: the turn runner — one short-lived child per interview
//! turn, its stream relayed as events, every failure typed, the child
//! never outliving the app.
//!
//! **THE KILL GUARANTEE, STATED AT ITS REAL WIDTH** (T-043, absorbing
//! T-025-s5): no orphaned descendant THAT STAYS IN THE GROUP. The signal
//! is `killpg`, so it reaches the CLI and every tool subprocess it
//! forked; a descendant that calls `setsid()` leaves the group and
//! survives, which is a property of process groups rather than a defect
//! here. Measured, not argued — the T-025 verifier's escapee probe
//! recorded `child_alive=false escapee_alive=true child_pid=72417
//! escapee_pid=72418 escapee_pgid=72418`. A descendant SWEEP is a
//! deliberate NON-GOAL: the selected CLI can create a new session, and
//! after reparenting the ancestry is undiscoverable, so a sweep would
//! have to guess. What bounds the exposure is narrower and true — no
//! `Bash(...)` pattern the planner is granted intentionally daemonizes
//! (see [`super::adapter`]). Revisit when that allowlist widens.
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
/// T-081: byte bound on the CLI's OWN explanation of one denial, off a
/// `system`/`permission_denied` line.
///
/// **CHOSEN TO BE THE BOUND THAT ACTUALLY BITES, which is why it is not a
/// rounder number.** Every stream-borne string here is truncated and then
/// handed to [`crate::docs_watch::sanitize_for_log`], which caps at
/// `MAX_ECHO_LOG_CHARS` characters of its own. A value above that cap
/// would leave the other function's constant deciding the length for
/// ASCII text, and a pin on THIS bound would then be measuring a number
/// that lives in another file and can move without this one. 768 sits
/// below it, so the truncation here is the one a reader can predict.
///
/// The longest denial message in the 2.1.226 capture
/// (`docs/research/captures/real-planner-turn-2026-08-19.jsonl`) is 419
/// bytes — a whole compound `Bash` command quoted back — so the observed
/// shape passes through complete, with room to spare. A longer one is
/// cut, which is the correct direction for a string the CLI wrote about
/// what a model asked for.
pub const MAX_DENIAL_MESSAGE_BYTES: usize = 768;
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
    /// action that helps (`claude auth login`).
    ///
    /// **T-082: THAT ACTION READ `claude login` UNTIL 2026-08-19, AND THE
    /// CLI HAS NO SUCH COMMAND** — `claude [options] [command] [prompt]`
    /// parses an unrecognised leading word as the PROMPT, so the advice
    /// started a turn instead of a login. The runner never produced that
    /// string and does not produce the corrected one either: this variant
    /// carries a STATUS and the CLI's own MESSAGE, and the action is the
    /// app's, in `app/src/genesis/interview-model.ts`'s `failureAction`.
    /// Named here only so a reader of this doc comment is not sent to a
    /// command that does not exist.
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
    /// T-081: A TOOL WAS REFUSED, AND THE USER LEARNS IT NOW.
    ///
    /// The CLI announces a denial the moment it happens, on a
    /// `system`/`permission_denied` line; before this variant the runner
    /// dropped that line and the screen stayed silent until the turn
    /// ended. On the observed 2.1.226 turn the two denials were separated
    /// from the `result` line by roughly forty seconds of recovery work,
    /// and for those forty seconds a watching human had no way to know
    /// the planner had been refused anything.
    ///
    /// **THIS IS NOT A FAILURE EVENT.** The observed turn carried two
    /// denials and still finished with `is_error: false` and
    /// `terminal_reason: "completed"` — the planner decomposed the
    /// refused command and carried on. A `Denied` says a tool was
    /// refused; it says nothing at all about how the turn ends, and the
    /// turn that follows it is usually a success.
    ///
    /// Every field is optional-shaped for a reason recorded on the card:
    /// a denial the app cannot fully describe is not a denial the user
    /// should be denied. `tool_name` and `tool_use_id` are `None` when
    /// the line did not carry them, and `message` is empty when the CLI
    /// offered no explanation — a `result`-line denial, which carries no
    /// message at all, arrives exactly that way.
    Denied {
        seq: u64,
        turn: u32,
        tool_name: Option<String>,
        /// T-081's JOIN KEY. The same id appears on both channels, which
        /// is what lets one denial be reported once.
        tool_use_id: Option<String>,
        message: String,
    },
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
            | RunEvent::Denied { seq, .. }
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
    pub fn denied(
        &self,
        turn: u32,
        tool_name: Option<String>,
        tool_use_id: Option<String>,
        message: String,
    ) {
        (self.sink)(RunEvent::Denied { seq: self.next(), turn, tool_name, tool_use_id, message });
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

/// Runner tunables. **THIS STRUCT reads nothing from the environment**:
/// `Default` is a pure constant, and the three override fields below are
/// filled only by a test constructing this struct in Rust. A hostile env
/// var therefore cannot redirect the production spawn THROUGH THIS
/// STRUCT (pinned by `default_config_reads_nothing_from_the_environment`).
///
/// **T-060 (T-047-s4): SCOPED HONESTLY, because the older wording said
/// "production reads NOTHING from the environment" and a reader of that
/// pin would not guess that `$SHELL` picks which program runs.** The
/// claim is true of the CONFIG and false of the RESOLVER two functions
/// away, which reads three variables of the app's own environment:
///
/// - **`SHELL`** — [`login_shell`] picks the program spawned with
///   `-l -c`. Since T-060 it must also be NAMED `zsh`, `bash` or `sh`;
///   anything else falls back to `/bin/zsh`.
/// - **`PATH`** — [`which_on_path`]'s search list, when no login shell
///   answered. Every candidate it produces now passes
///   [`validate_resolved_binary`], so a relative PATH entry can no longer
///   yield a relative binary that gets executed.
/// - **`NPUTER_NO_REAL_CLI`** — the guard (see [`real_cli_arms_forbidden`]).
///
/// The CHILD's environment is a different question and is unchanged:
/// `env_clear()` plus [`ENV_ALLOWLIST`] (ADR-003).
#[derive(Clone, Debug)]
pub struct RunnerConfig {
    /// TEST SEAM: the binary to spawn instead of resolving one.
    pub binary_override: Option<PathBuf>,
    /// TEST SEAM: the PATH handed to the child, and — with
    /// `probe_login_shell: false` — the search path resolution uses in
    /// place of a login shell.
    pub path_override: Option<String>,
    /// TEST SEAM: extra env pairs on the child (fake-agent scenario
    /// selection). Always empty in production.
    pub extra_env: Vec<(String, String)>,
    /// TEST SEAM: `false` forbids the login-shell probe entirely.
    /// Production is `true` — that probe is criterion 4's whole point
    /// (GUI-launch PATH poverty).
    ///
    /// **This field is no longer what keeps a test off the real CLI.**
    /// It was, and it FAILED: it lives in a struct every test must
    /// remember, `..RunnerConfig::default()` is the idiom, and the
    /// default is `true` — so T-047's verifier spawned the developer's
    /// real `claude` from `cargo test`. The structural guard is
    /// [`real_cli_arms_forbidden`] (T-060 criterion 6).
    pub probe_login_shell: bool,
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

// ---- T-060 criterion 6: no test may resolve the user's real CLI --------

/// The guard variable. `NPUTER_NO_REAL_CLI=1` forbids the two arms that
/// could reach the developer's own `claude`; `=0` permits them.
pub const NO_REAL_CLI_VAR: &str = "NPUTER_NO_REAL_CLI";

/// **THE ACCIDENT THIS PREVENTS ALREADY HAPPENED.** T-047's verifier
/// built a `RunnerConfig` with `..RunnerConfig::default()`, whose
/// `probe_login_shell` is `true`, and `cargo test` spawned the
/// developer's real `claude` with the genesis planner prompt. No model
/// ran and no tokens were spent **only because the token is revoked —
/// that is luck, not a control.**
///
/// So the property stops living in a field every test must remember.
/// `resolve_cli` refuses the login-shell arm and the `which_on_path` arm
/// whenever this returns true, and falls through to typed `cliNotFound`
/// exactly as a machine with no CLI would.
///
/// **The default is DERIVED, not remembered** (this is the part the
/// criterion's "set once for the whole suite" was reaching for, and a
/// stronger form of it): with the variable unset, the arms are forbidden
/// iff this process is a cargo TEST binary — see
/// [`running_as_cargo_test_binary`]. Nothing has to be set, exported,
/// wrapped or configured, so a test file added next year inherits the
/// refusal without knowing this function exists. **Every kind of test
/// cargo builds is covered, doctests included** — that was not true when
/// T-060 was first built, and the exception is recorded in
/// [`is_test_harness_dir`] rather than left for the next reader to find
/// (T-060-s4).
///
/// **Why not a `.cargo/config.toml` `[env]` entry**, which is the obvious
/// "set once for the whole suite": it would reach the human's DEVELOPMENT
/// APP, which would then stop finding their CLI and render the
/// hand-driven fallback forever. Measured, because the obvious mechanism
/// sentence for this is wrong and was believed here for a while
/// (T-060-s5): `tauri dev` is NOT `cargo run` — the tauri v2 CLI runs
/// `cargo build` and spawns the produced binary itself, with no cargo
/// process between them — but it reconstructs cargo's run environment for
/// that binary, and `[env]` rides along with it. An
/// `[env] NPUTER_VERIFIER_PROBE = "reached"` in
/// `app/src-tauri/.cargo/config.toml` was measured reaching the spawned
/// dev app, alongside the full `CARGO_*` set; the control — a binary
/// `cargo build`-ed and exec'd with no cargo anywhere — sees nothing.
/// Right conclusion, checkable mechanism.
///
/// The escape is explicit and one-way: the `#[ignore]`d real smoke sets
/// `NPUTER_NO_REAL_CLI=0` before it resolves anything. It is the only
/// test in the repo that may, and it is additionally `#[ignore]`d and
/// gated on `NPUTER_REAL_CLI=1`.
///
/// **THIS DOCTEST IS THE PROOF FOR THE ONE KIND OF TEST THE DERIVATION
/// USED TO MISS** (T-060-s4). It is the crate's only doctest and it runs
/// in the environment that used to fail OPEN: `cfg!(test)` is false here
/// and rustdoc does not run this binary out of `deps/`. It is written the
/// same way as the `deps` tripwire in `tests/agent_runner.rs` — pin the
/// mechanism you depend on, loudly, so a rustdoc that stops naming its
/// temp directory `rustdoctest*` reds a test instead of quietly handing
/// every future doctest the developer's real CLI.
///
/// ```
/// assert!(
///     nputer_lib::agent::runner::real_cli_arms_forbidden(),
///     "a DOCTEST must not be able to reach the real CLI - if this red, \
///      rustdoc's temp dir is no longer named `rustdoctest*` and the \
///      derivation needs a new mechanism"
/// );
/// ```
pub fn real_cli_arms_forbidden() -> bool {
    guard_decision(
        std::env::var(NO_REAL_CLI_VAR).ok().as_deref(),
        running_as_cargo_test_binary(),
    )
}

/// The guard's whole decision, as a function of its INPUTS rather than of
/// the process it runs in.
///
/// **This split is T-060-s3's fix in the direction the finding called
/// "removing the need to mutate it at all".** The pins on "an explicit
/// `0` is the smoke's deliberate opt-out" and "an explicit `1` forbids"
/// used to be written by setting the variable process-wide inside a test
/// body — in a binary libtest runs on many threads, where a sibling body
/// asserting the variable is UNSET reads the mutation and goes red. Both
/// directions are properties of this function, so both can be pinned
/// without any process ever changing. That the WRAPPER really consults
/// the variable is pinned the only way it honestly can be: behaviourally,
/// by a test that runs a resolve in a child process born with it set
/// (`the_configuration_that_reached_the_real_cli_now_resolves_to_typed_not_found`).
fn guard_decision(setting: Option<&str>, is_cargo_test_binary: bool) -> bool {
    match setting {
        Some("1") => true,
        Some("0") => false,
        _ => is_cargo_test_binary,
    }
}

/// Is this process a cargo-built TEST binary?
///
/// Cargo puts unit-test and integration-test executables in
/// `<target-dir>/<profile>/deps/` and runs them from there; it runs
/// `cargo run` binaries from `<target-dir>/<profile>/` and a packaged
/// app from `…/Contents/MacOS/`. The parent directory's NAME is
/// therefore the discriminator, and it is one cargo controls rather than
/// one we chose: `deps` is where test harnesses live and nothing else
/// executes from.
///
/// `<target-dir>` itself is deliberately not checked — `CARGO_TARGET_DIR`
/// can point anywhere, so "an ancestor named `target`" is an assumption
/// and `deps` is not.
fn running_as_cargo_test_binary() -> bool {
    // `cfg!(test)` is true for the LIB's own unit tests and false for an
    // integration test linking the lib, so it is a corroborator, never
    // the whole answer.
    if cfg!(test) {
        return true;
    }
    let Ok(exe) = std::env::current_exe() else {
        return false;
    };
    is_test_harness_dir(exe.parent().and_then(|dir| dir.file_name()).and_then(|n| n.to_str()))
}

/// Does this directory NAME belong to a test harness cargo or rustdoc
/// built? Two spellings, and the second one is T-060-s4.
///
/// `deps` is cargo's, and covers unit tests and integration tests. The
/// other is rustdoc's: a DOCTEST is compiled to a temporary directory
/// named `rustdoctest<random>` and run from there, and `cfg!(test)` is
/// FALSE inside it because a doctest links the crate exactly as an
/// integration test does. Measured in T-060-s4:
///
/// ```text
/// current_exe = /var/folders/…/T/rustdoctestTieiwm/rust_out
/// parent      = Some("rustdoctestTieiwm")
/// cfg_test    = false
/// ```
///
/// (`text`, not Rust, and deliberately — an INDENTED block here becomes a
/// doctest, which is how the second executor turned this crate's zero
/// doctests into one broken one while documenting the hole. The
/// zero-doctest state was never a property of the crate, only of what
/// nobody had written yet.)
///
/// So before this arm, a doctest on [`resolve_cli`] — the most natural
/// thing in the world to write for a public resolver — would have run
/// with the guard OFF, spawned the developer's login shell and executed
/// their real `claude`. T-047-s6's accident, reachable by writing
/// documentation.
///
/// Widening only ever forbids MORE, so a false positive costs a resolve
/// and never a spawn.
fn is_test_harness_dir(name: Option<&str>) -> bool {
    matches!(name, Some("deps")) || matches!(name, Some(dir) if dir.starts_with("rustdoctest"))
}

// ---- T-047/T-060: what a resolved binary path has to survive -----------

/// Why a resolved binary path was refused before anything executed it.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ResolvedPathRejection {
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

impl std::fmt::Display for ResolvedPathRejection {
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

/// THE RESOLVED-PATH GATE — **one standard, applied at every door**
/// (T-060, absorbing T-047-s5; T-047 built it, for the cache only).
///
/// T-047 wrote this gate for `agent-paths.json` and left the FRESHLY
/// PROBED path exempt from it, which is two doors holding one standard
/// between them. The unifying sentence of T-060 is that gap: **the code
/// already knew which values it would not trust from a file, and ran them
/// anyway.** `which_on_path` reads the app's inherited `PATH` and hands
/// each entry to `which_in`, which does `dir.join(binary)` — so a
/// RELATIVE PATH entry (`.`, an empty element meaning CWD, a bare
/// `relbin`) produced a relative binary path that WAS EXECUTED, while
/// this same function called it `NotAbsolute` and discarded it.
///
/// T-060 retires the cache entirely, so the file half of that story is
/// gone; what survives is this function, now applied to the only paths
/// that remain — the ones a probe just produced.
///
/// The rule is "what an HONEST probe could have produced". A login-shell
/// probe resolves the NAME `claude` — `command -v claude`, or
/// `dir.join("claude")` over PATH — so whatever it returns SHOULD be
/// absolute, traversal-free, and named `claude`. A candidate that is none
/// of those did not come from the shell answering the question we asked;
/// it came from the search list being hostile.
///
/// **The honest residual, recorded rather than implied**: an absolute,
/// traversal-free path named `claude` pointing at an attacker's binary
/// still passes. The gate checks SHAPE and never IDENTITY — there is no
/// `canonicalize` here, so a symlink or a swapped file is enough, and no
/// race is needed. Closing that needs a signature or a pinned install
/// location, and its precondition is write access to a directory already
/// on the user's PATH.
pub fn validate_resolved_binary(
    path: &Path,
    adapter: &AgentAdapter,
) -> Result<(), ResolvedPathRejection> {
    validate_resolved_program(path, adapter.binary)
}

/// THE RESOLVED-PATH GATE, parametrized by the program NAME rather than
/// by an [`AgentAdapter`] — so a SECOND door can hold exactly the SAME
/// standard without a SECOND implementation of it (T-057: a rule with two
/// implementations is two chances to disagree; T-060: "one standard,
/// applied at every door"). [`validate_resolved_binary`] is this with the
/// adapter's own `binary`; `churn.rs`'s git resolver calls it with
/// `"git"`. The whole security content of the gate lives here, once.
pub fn validate_resolved_program(
    path: &Path,
    expected_name: &'static str,
) -> Result<(), ResolvedPathRejection> {
    if path.as_os_str().is_empty() {
        return Err(ResolvedPathRejection::Empty);
    }
    if !path.is_absolute() {
        return Err(ResolvedPathRejection::NotAbsolute);
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
        return Err(ResolvedPathRejection::Traversal);
    }
    if path.file_name().and_then(|n| n.to_str()) != Some(expected_name) {
        return Err(ResolvedPathRejection::WrongName { expected: expected_name });
    }
    if !is_executable_file(path) {
        return Err(ResolvedPathRejection::NotExecutable);
    }
    Ok(())
}

/// Resolve the adapter's binary (§6 order, as T-060 leaves it): the test
/// seam, then a probe, then a typed not-found. **There is no third
/// source, and in particular there is no file.**
///
/// GUI-launch PATH poverty is the whole problem being solved: a packaged
/// .app launched from Finder inherits a minimal PATH that has never seen
/// the user's `~/.local/bin`, homebrew, nvm, or asdf shims.
///
/// **T-060 RETIRES THE RESOLVED-BINARY CACHE** (T-047-s1). `agent-paths.json`
/// is not read, not written and not invalidated; `CacheFile`, `CacheEntry`,
/// `read_cache`, `write_cache`, `invalidate_cache`, `cache_path` and
/// `RunnerConfig::config_dir` are gone. **The whole file→exec class stops
/// existing rather than being narrowed.** Three reasons, in the order they
/// were established:
///
/// 1. **Its stated justification was already false.** The file existed
///    "so the login-shell probe runs once per install rather than once
///    per turn" — but T-047 stopped caching the login PATH, so
///    `probe_login_path` spawned the login shell on EVERY resolve
///    regardless, cache hit or not. The cache saved nothing it claimed
///    to save.
/// 2. **The probe already returns the binary path in the same spawn.**
///    `command -v claude && echo NPUTER_LOGIN_PATH=$PATH` is one process
///    for both answers.
/// 3. **The cost of not caching was measured, on this machine, by this
///    task** (see [`login_shell`] for the full table): the login-shell
///    probe is **3.7–7.8 ms, median 4.0**, against **39–42 ms, median
///    40** for the `claude --version` probe the same resolve runs
///    unconditionally. The card's ~7 ms / 47–50 ms figures reproduce in
///    shape; the version probe is ~40 ms here, not 47–50.
///
/// **THE FRESHLY-PROBED PATH NOW PASSES THE SAME GATE THE CACHED ONE HAD
/// TO** (T-047-s5) — [`validate_resolved_binary`], applied inside
/// [`which_in`] and again to whatever the probe returned. A failure is
/// treated as "this probe found nothing": fall through, then to typed
/// `cliNotFound`. Nothing is executed on the way to refusing.
pub fn resolve_cli(cfg: &RunnerConfig, adapter: &AgentAdapter) -> Result<ResolvedCli, ResolveError> {
    // (0) Test seam: an injected binary is used verbatim, version probe
    // included, so fixture scenarios exercise the same code path. This is
    // a Rust-only field — no environment variable can fill it (pinned by
    // `default_config_reads_nothing_from_the_environment`) — so it is not
    // a door the gate has to hold.
    if let Some(path) = &cfg.binary_override {
        let version = probe_version(cfg, path, adapter);
        return finish(cfg, path.clone(), version, cfg.path_override.clone(), adapter);
    }

    // (1) The probe, once. Fixed argv, no user data anywhere in it — the
    // `-c` argument is a compile-time constant.
    let probe = if cfg.probe_login_shell {
        if real_cli_arms_forbidden() {
            // T-060 criterion 6. Not "no shell was found": the arm is
            // REFUSED, and the refusal is named in `probed` so a test
            // that reaches here reads why instead of wondering.
            return Err(ResolveError::NotFound {
                probed: vec![format!(
                    "the login-shell and PATH arms are refused: {NO_REAL_CLI_VAR} forbids resolving a real `{}`",
                    adapter.binary
                )],
            });
        }
        login_shell_probe(cfg, adapter)
    } else {
        // The seam's own search path. `path_override` is a Rust field,
        // never the machine's `PATH`, so this arm cannot reach the user's
        // real CLI and is not guarded.
        cfg.path_override
            .as_ref()
            .and_then(|path| which_in(path, adapter))
            .map(|found| (found, cfg.path_override.clone()))
    };
    match probe {
        Some((path, login_path)) => {
            // THE GATE, on the last value before `probe_version` — which
            // is a `Command::new`. `which_in` gates its own candidates
            // too; this catches the OTHER producer, the path a login
            // shell's `command -v` printed on stdout.
            if let Err(rejection) = validate_resolved_binary(&path, adapter) {
                eprintln!(
                    "[nputer] agent: refusing the probed {} path: {rejection} - treating this probe as having found nothing. Refused: {}",
                    adapter.key,
                    crate::docs_watch::sanitize_for_log(&path.display().to_string())
                );
                return Err(ResolveError::NotFound {
                    probed: vec![
                        format!("probed path (refused: {rejection})"),
                        format!("login shell `command -v {}`", adapter.binary),
                        format!("PATH lookup for `{}`", adapter.binary),
                    ],
                });
            }
            let version = probe_version(cfg, &path, adapter);
            finish(cfg, path, version, login_path, adapter)
        }
        None => Err(ResolveError::NotFound {
            probed: vec![
                format!("login shell `command -v {}`", adapter.binary),
                format!("PATH lookup for `{}`", adapter.binary),
            ],
        }),
    }
}

/// THE PROGRAM RUN WITH `-l -c` (T-060, absorbing T-047-s4).
///
/// `$SHELL` is read from the APP's own environment — it is the user's
/// shell, not an agent-binary override — and **before T-060 any absolute
/// executable named anything was run with `-l -c <script>`.** That is a
/// wide door for a value the app does not control: `SHELL` is on
/// [`ENV_ALLOWLIST`] and is whatever the launching environment said.
///
/// The name check is not cosmetic. The script this runner passes relies
/// on POSIX-ish `-l -c` semantics — `command -v`, `$PATH`, `&&`. **fish
/// accepts `-l -c` and means something different by it** (`command -v` is
/// not its builtin spelling and `$PATH` is a list), so a fish user would
/// get a silently wrong answer rather than a loud one; and an arbitrary
/// executable named neither gets a script it never agreed to parse.
///
/// So `$SHELL` must be absolute, executable, AND named one of the three
/// whose `-l -c` this script is actually written for. Anything else falls
/// back to `/bin/zsh` — macOS's default login shell and a program that is
/// present by construction on the only platform this runner ships on.
///
/// **MEASURED, because criterion 2 required the measurement either way**
/// (this machine, 2026-08-18, medians of 8–15 runs):
///
/// | what | ms |
/// |---|---|
/// | `zsh -l -c 'command -v claude && echo …$PATH'`, this machine | 3.7–7.8, **median 4.0** |
/// | the same with a 4000-line `~/.zshrc` + `compinit` | **unchanged — see below** |
/// | the same with a conda/pyenv/rbenv-shaped `~/.zprofile` (3 interpreter spawns) | 41–47, **median 41** |
/// | `claude --version`, which the same resolve runs unconditionally | 39–42, **median 40** |
///
/// **THE INPUT THE SUGGESTION DID NOT HAVE, and it inverts the worry:**
/// `zsh -l -c` is a NON-INTERACTIVE login shell, so it reads `.zshenv`,
/// `.zprofile` and `.zlogin` and **does not read `.zshrc` at all**
/// (`bash -l -c` likewise reads `.bash_profile`, not `.bashrc`) —
/// verified by marker files in each. nvm, rbenv, pyenv and conda all
/// install their init into `~/.zshrc` by default, which is exactly the
/// file this probe never sources. The feared "hundreds of ms" case needs
/// a user who hand-moved that init into `.zprofile`, and even then it
/// measures at parity with the `--version` probe already being paid.
///
/// **Verdict: no memo, no file.** Criterion 1's plain
/// probe-then-typed-not-found stands.
///
/// **Shared since T-013**: `churn.rs` runs its own `command -v git`
/// through this same name-checked selection, so both doors run their
/// login-shell probe with the one program `$SHELL` is allowed to name.
pub fn login_shell() -> PathBuf {
    /// The shells whose `-l -c` semantics the script actually relies on.
    const SUPPORTED: [&str; 3] = ["zsh", "bash", "sh"];
    std::env::var("SHELL")
        .ok()
        .map(PathBuf::from)
        .filter(|p| {
            p.is_absolute()
                && p.file_name()
                    .and_then(|n| n.to_str())
                    .is_some_and(|name| SUPPORTED.contains(&name))
                && is_executable_file(p)
        })
        .unwrap_or_else(|| PathBuf::from("/bin/zsh"))
}

// **THE SECOND LOGIN-SHELL SPAWN IS GONE TOO (T-060).**
//
// T-047 added `probe_login_path` — a whole second `$SHELL -l -c` spawn
// asking only for `$PATH` — for exactly one caller: the CACHE-HIT arm,
// which had a binary path from the file and no PATH to go with it. With
// the cache retired that caller does not exist, and the one remaining
// probe answers both questions in one spawn (`command -v claude && echo
// NPUTER_LOGIN_PATH=$PATH`). So retiring the file did not merely remove
// a file: it removed a resolve path that could spawn the user's login
// shell TWICE, and the resolver's `$SHELL` read sites went from two to
// one — which is also the only reason the T-047-s4 name check has a
// single place to live.

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
/// shell would have given it. Which program that is, and why it is
/// name-checked since T-060, is [`login_shell`].
///
/// The path this returns is NOT trusted here — `resolve_cli` puts it
/// through [`validate_resolved_binary`] before `probe_version` can spawn
/// it. `command -v` prints whatever the shell resolved, and a shell whose
/// PATH holds a relative entry resolves to a relative path.
fn login_shell_probe(cfg: &RunnerConfig, adapter: &AgentAdapter) -> Option<(PathBuf, Option<String>)> {
    if cfg!(not(unix)) {
        return which_on_path(adapter).map(|p| (p, None));
    }
    // Compile-time constant script; the binary name is the adapter's own
    // `&'static str`, never user input. No interpolation of anything the
    // webview or the filesystem supplied.
    let script = match adapter.binary {
        "claude" => "command -v claude && echo NPUTER_LOGIN_PATH=$PATH",
        _ => return which_on_path(adapter).map(|p| (p, None)),
    };
    let mut command = Command::new(login_shell());
    command
        .arg("-l")
        .arg("-c")
        .arg(script)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null());
    let output = run_with_timeout(command, cfg.probe_timeout)?;
    if !output.status_ok {
        return which_on_path(adapter).map(|p| (p, None));
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
        None => which_on_path(adapter).map(|p| (p, login_path)),
    }
}

/// Plain PATH lookup over the APP'S OWN inherited `PATH` — the fallback
/// when there is no usable login shell.
///
/// **This is the arm T-047-s5 was about.** The app's `PATH` is whatever
/// the launching environment said, and a PATH entry may be relative: `.`,
/// an EMPTY element (which POSIX defines as the current directory), or a
/// bare `relbin`. `which_in`'s `dir.join(binary)` then yields a relative
/// binary path, and before T-060 it was executed. It is guarded twice
/// now — by [`real_cli_arms_forbidden`] against ever reaching a real CLI
/// from a test, and by [`validate_resolved_binary`] inside `which_in`
/// against the shape.
fn which_on_path(adapter: &AgentAdapter) -> Option<PathBuf> {
    if real_cli_arms_forbidden() {
        return None;
    }
    which_in(&std::env::var("PATH").ok()?, adapter)
}

/// PATH lookup over an explicit search path.
///
/// Every candidate passes [`validate_resolved_binary`], not merely
/// `is_executable_file` — so a relative search-path element produces NO
/// candidate rather than a relative binary that `Command::new` would hand
/// to the OS. A refused entry is simply not found, and the search
/// continues to the next element: this is a lookup, not a verdict.
fn which_in(path: &str, adapter: &AgentAdapter) -> Option<PathBuf> {
    std::env::split_paths(path)
        .map(|dir| dir.join(adapter.binary))
        .find(|candidate| validate_resolved_binary(candidate, adapter).is_ok())
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

// **THE RESOLVED-BINARY CACHE USED TO LIVE HERE (T-060 retired it).**
//
// `CacheFile`, `CacheEntry`, `read_cache`, `write_cache` and
// `invalidate_cache` are deleted, along with `cache_path` and
// `RunnerConfig::config_dir`. `agent-paths.json` is no longer read,
// written or invalidated by anything, at any door.
//
// **This comment is the only thing left, and it is here so the next
// reader does not reintroduce it.** T-047 narrowed the file — validating
// the cached path before executing it — and T-047-s1 then observed that
// the narrowing left the whole class alive for no benefit: the file's own
// justification ("so the login-shell probe runs once per install rather
// than once per turn") had already been falsified by T-047's other half,
// which re-probes the login PATH on every resolve regardless. See
// [`resolve_cli`] for the three reasons and [`login_shell`] for the
// measurements. A cache here would have to earn back a cost measured at
// **4 ms against a 40 ms probe the same resolve pays unconditionally** —
// and if it ever does, criterion 2 already ruled the shape: a
// PROCESS-LIFETIME memo, never a file.

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
    /// "No such process (group)". POSIX does not fix the numbers, but 3
    /// is ESRCH on every platform this ships or tests on (darwin, linux)
    /// — measured on darwin by this task's probe, and asserted at run
    /// time by `esrch_is_the_number_this_code_thinks_it_is`.
    pub const ESRCH: i32 = 3;

    pub fn kill_group(pgid: i32, sig: i32) {
        unsafe {
            killpg(pgid, sig);
        }
    }
    /// Signal 0 asks "could I signal this pid?" without sending one.
    ///
    /// **IT IS TRUE FOR A ZOMBIE**, and that one fact is the whole reason
    /// T-043 exists: the turn's child is OUR child, so between its exit
    /// and its `wait()` it is a zombie that answers this question `true`.
    /// Measured on this machine: SIGTERM a `/bin/sleep`, do not wait, and
    /// `kill(pid, 0)` keeps returning 0 until `wait()` runs.
    pub fn pid_alive(pid: i32) -> bool {
        unsafe { kill(pid, 0) == 0 }
    }
    /// Does the process GROUP still hold anyone we could signal?
    ///
    /// `killpg(pgid, 0)` is the group-shaped form of the question above.
    /// A non-zero return is only "empty" when errno says ESRCH: EPERM
    /// means somebody IS there and we may not signal them, which is
    /// emphatically not permission to declare the group gone. (EPERM
    /// cannot arise for our own children, which share our uid; the arm
    /// exists so the predicate is right rather than only usually right.)
    pub fn group_has_members(pgid: i32) -> bool {
        if unsafe { killpg(pgid, 0) } == 0 {
            return true;
        }
        std::io::Error::last_os_error().raw_os_error() != Some(ESRCH)
    }
}

/// Is `pid` still alive? Exported for the group-kill proof.
///
/// **A ZOMBIE ANSWERS `true`** — see [`signals::pid_alive`]. Anything
/// deciding "the child is gone" from this alone is measuring the wrong
/// thing; that is the defect T-043 fixed.
#[cfg(unix)]
pub fn pid_alive(pid: i32) -> bool {
    signals::pid_alive(pid)
}
#[cfg(not(unix))]
pub fn pid_alive(_pid: i32) -> bool {
    false
}

/// Does the process group `pgid` still hold a signalable member?
/// Exported so a test can assert the SURVIVOR half of the group kill
/// directly, rather than inferring it from one pid.
#[cfg(unix)]
pub fn group_has_members(pgid: i32) -> bool {
    signals::group_has_members(pgid)
}
#[cfg(not(unix))]
pub fn group_has_members(_pgid: i32) -> bool {
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
///
/// **T-043 MADE IT THE COORDINATION CHANNEL** (docs/STATE.md's open
/// question, answered the second way it offers): exactly ONE thread owns
/// the `std::process::Child` — the worker running [`run_turn`] — and it
/// is the only thread that may `waitpid`. Every other observer
/// (`genesis_cancel`, the app-exit hook, `Drop`) holds only this handle,
/// so "has the direct child been reaped?" is a fact they cannot learn for
/// themselves. Rather than give them a second `Child` (two reapers racing
/// one pid) or let them guess from `kill(pid, 0)` (true for a zombie,
/// which is the bug), the owner PUBLISHES the fact here and the observers
/// read it.
#[derive(Clone, Debug)]
pub struct ChildHandle {
    pub pid: i32,
    pub turn: u32,
    /// Set exactly once, by the worker that owns the `Child`, the moment
    /// a `wait`/`try_wait` returns a status. Never cleared: a reaped pid
    /// stays reaped, and the handle dies with the turn.
    reaped: Arc<AtomicBool>,
}

impl ChildHandle {
    pub fn new(pid: i32, turn: u32) -> Self {
        Self { pid, turn, reaped: Arc::new(AtomicBool::new(false)) }
    }
    /// Has the owner of the `Child` reaped it? Clones share the answer.
    pub fn reaped(&self) -> bool {
        self.reaped.load(Ordering::SeqCst)
    }
    /// Called by the owner, and only by the owner, after `waitpid`.
    pub fn mark_reaped(&self) {
        self.reaped.store(true, Ordering::SeqCst);
    }
}

/// What one grace poll actually did. Returned rather than logged so a
/// test can assert the SHAPE of the kill, not just its aftermath.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct GroupExit {
    /// The direct child was reaped — its zombie entry is gone and its pid
    /// is free for the OS to reuse.
    pub reaped: bool,
    /// The process group held no signalable member when the poll stopped.
    pub group_empty: bool,
    /// The grace ran out with someone still in the group, so SIGKILL went
    /// out. `false` means the group left of its own accord.
    pub escalated: bool,
    /// How long the poll ran, measured inside it — the number the "well
    /// inside the grace" criterion is about.
    pub waited: Duration,
}

/// **THE GRACE POLL, AND THE TWO FACTS IT NEEDS BEFORE IT LETS GO**
/// (T-043, absorbing T-025-s7).
///
/// SIGTERM the group, then poll until BOTH of these hold, or the grace
/// runs out and the survivors are SIGKILLed:
///
/// 1. **the direct child is reaped** — `reaped()` below, whose two
///    implementations are the whole of the coordination story; and
/// 2. **its process group is empty** — [`signals::group_has_members`].
///
/// **BOTH, and the reason is the case each one alone gets wrong.**
///
/// *Without (1)* the poll is what it was before T-043: `kill(pid, 0)` is
/// TRUE FOR A ZOMBIE, and the turn's child is our own unreaped child, so
/// a CLI that dies on the first SIGTERM still costs the full grace. The
/// T-025 verifier measured 3.035 s held on a 3 s grace against a child
/// that died immediately — five seconds of `busy` after every real
/// cancel, and five seconds of blocked main thread on app quit.
///
/// *Without (2)* — **and this is the regression this function is shaped
/// to prevent** — a bare `child.try_wait()` followed by `return` releases
/// the moment the DIRECT child dies, while a same-group grandchild that
/// ignored the SIGTERM keeps running with nothing left that will ever
/// escalate to SIGKILL. That trades a latency defect for a leaked
/// process, which is the worse of the two. So a reaped child with a live
/// group runs the poll to the deadline and kills the survivor.
///
/// **THE ESCALATION IS GUARDED BY THE GROUP, not by the clock.** Once the
/// direct child is reaped its pid is free for the OS to reuse, and the
/// pgid IS that pid; SIGKILLing it unconditionally at the deadline is a
/// use-after-free of a pid number. A pgid stays reserved exactly while
/// its group is non-empty, so re-testing membership immediately before
/// escalating is what keeps the signal aimed at the survivors and only at
/// them.
#[cfg(unix)]
fn terminate_group_polling(pid: i32, grace: Duration, mut reaped: impl FnMut() -> bool) -> GroupExit {
    let started = Instant::now();
    signals::kill_group(pid, signals::SIGTERM);
    let deadline = started + grace;
    loop {
        // Order matters: reap FIRST, then read the group. A pending
        // zombie is still a group member on some kernels, so asking about
        // the group before clearing our own child can only be wrong in
        // the direction of waiting longer.
        let is_reaped = reaped();
        let empty = !signals::group_has_members(pid);
        if is_reaped && empty {
            return GroupExit {
                reaped: true,
                group_empty: true,
                escalated: false,
                waited: started.elapsed(),
            };
        }
        if Instant::now() >= deadline {
            // Only survivors get SIGKILL — never a pid we already reaped.
            let escalated = !empty;
            if escalated {
                signals::kill_group(pid, signals::SIGKILL);
            }
            return GroupExit {
                reaped: is_reaped,
                group_empty: empty,
                escalated,
                waited: started.elapsed(),
            };
        }
        std::thread::sleep(POLL_INTERVAL);
    }
}

/// How often the grace poll looks. Small enough that "well inside the
/// grace" is about the child's behaviour rather than about this number.
#[cfg(unix)]
const POLL_INTERVAL: Duration = Duration::from_millis(25);

/// **THE OWNER'S FORM** — for the one thread that holds the `Child`.
///
/// It reaps AS IT POLLS (`try_wait`, which is why this can release
/// early), and publishes the fact on the handle so the observers below
/// can stop waiting too. `try_wait` caches the status, so the caller's
/// later `wait()` is a no-op rather than a second `waitpid`.
pub fn terminate_group_owning(
    child: &mut Child,
    handle: &ChildHandle,
    grace: Duration,
) -> GroupExit {
    #[cfg(unix)]
    {
        terminate_group_polling(handle.pid, grace, || {
            if handle.reaped() {
                return true;
            }
            match child.try_wait() {
                Ok(Some(_)) => {
                    handle.mark_reaped();
                    true
                }
                Ok(None) => false,
                // ECHILD and friends: there is nothing left to reap, so
                // treat the child as gone rather than spinning on it.
                Err(_) => {
                    handle.mark_reaped();
                    true
                }
            }
        })
    }
    #[cfg(not(unix))]
    {
        let _ = (child, handle, grace);
        NOT_UNIX
    }
}

/// **THE OBSERVER'S FORM** — for the app-exit paths, which hold the
/// handle and never the `Child`.
///
/// Blocking, which is correct where it is called from: the app is on its
/// way out and the point is not to leave before the group does. It cannot
/// `waitpid`, so it reads the flag the owner sets. If no owner is running
/// — a `Drop` with a stale slot, a worker that died — the flag never
/// arrives and this costs the full grace, which is exactly the behaviour
/// this call had before T-043. The fallback is the old floor, never worse.
pub fn terminate_group_observing(handle: &ChildHandle, grace: Duration) -> GroupExit {
    #[cfg(unix)]
    {
        terminate_group_polling(handle.pid, grace, || handle.reaped())
    }
    #[cfg(not(unix))]
    {
        let _ = (handle, grace);
        NOT_UNIX
    }
}

/// SIGTERM now and escalate on a background thread, so a `genesis_cancel`
/// command answers immediately instead of holding the caller for the
/// grace period. The escalation is the observer's poll, so it stops as
/// soon as the worker reaps and the group empties — rather than
/// SIGKILLing a pgid whose pid the OS may by then have handed to somebody
/// else.
pub fn terminate_group_async(handle: &ChildHandle, grace: Duration) {
    #[cfg(unix)]
    {
        // Synchronously, before this returns: the cancel's whole promise.
        signals::kill_group(handle.pid, signals::SIGTERM);
        let handle = handle.clone();
        std::thread::spawn(move || terminate_group_observing(&handle, grace));
    }
    #[cfg(not(unix))]
    {
        let _ = (handle, grace);
    }
}

/// The honest answer on a platform with no process groups. The repo's
/// standing Windows silence (T-025 §9) covers the rest.
#[cfg(not(unix))]
const NOT_UNIX: GroupExit = GroupExit {
    reaped: false,
    group_empty: false,
    escalated: false,
    waited: Duration::ZERO,
};

// ---- stream classification ---------------------------------------------

/// T-081: ONE ENTRY OF THE `result` LINE'S CUMULATIVE `permission_denials`
/// ARRAY, parsed once and read two ways.
///
/// Before this task the array was read straight to `Vec<String>` by
/// [`denial_names`], which is all [`TurnError::ToolDenied`] needs. The
/// `tool_use_id` beside each name was parsed by nobody, and it is the one
/// field that makes the in-band channel and this one joinable — the same
/// id appears on both. Keeping the two views on ONE parse is deliberate:
/// two walks of the same array are two chances to disagree about which
/// entries there are.
///
/// Both fields are `None` when the CLI did not write them. A bare string
/// entry — a shape the CLI could write and never has — yields a name with
/// no id, which the join then treats as uncorroborated, which is the safe
/// direction.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ResultDenial {
    pub tool_name: Option<String>,
    pub tool_use_id: Option<String>,
}

#[derive(Debug, PartialEq, Eq)]
pub enum StreamLine {
    Init { session_id: Option<String>, model: Option<String> },
    TextDelta(String),
    Activity(String),
    /// T-081: the CLI announcing a permission denial AT THE MOMENT IT
    /// HAPPENS — `system`/`permission_denied`, observed twice in the
    /// 2.1.226 capture.
    ///
    /// **IT IS MATCHED ON WHAT IT HAS, NEVER ON WHAT IT LACKS.** This
    /// line's most striking property is the absence of `error` and
    /// `error_status`, which is exactly why the `system` arm below
    /// returned [`StreamLine::Ignored`] for it — that arm asks whether an
    /// error field is present, and a lack cannot be matched. The
    /// discriminator is the positive one: `subtype == "permission_denied"`.
    ///
    /// The two observed lines differ in shape and both must classify: the
    /// first carries only `decision_reason_type` (`"subcommandResults"`),
    /// the second carries `decision_reason` as well (`"other"`). Neither
    /// value is read here — the CLI's human-readable `message` is what a
    /// person needs, and `decision_reason` stands in for it only when
    /// `message` is missing or empty.
    Denial { tool_name: Option<String>, tool_use_id: Option<String>, message: String },
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
        /// T-081: entries rather than names. [`denial_names`] is the view
        /// [`TurnError::ToolDenied`] takes of this; `tool_use_id` is the
        /// view the in-band join takes.
        permission_denials: Vec<ResultDenial>,
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
        // T-081: THE IN-BAND DENIAL, AHEAD OF THE ERROR-BEARING ARM
        // BELOW, and keyed on its own `subtype` rather than on anything
        // it happens to be missing. See `StreamLine::Denial`.
        "system"
            if value.get("subtype").and_then(|v| v.as_str()) == Some("permission_denied") =>
        {
            StreamLine::Denial {
                tool_name: denial_field(&value, "tool_name"),
                tool_use_id: denial_field(&value, "tool_use_id"),
                // `message` is the sentence a person reads. When the CLI
                // wrote none, `decision_reason` is what it has — on the
                // second observed line the two are the same string, so
                // this fallback costs nothing and covers a line that
                // carried only the reason.
                message: value
                    .get("message")
                    .and_then(|v| v.as_str())
                    .filter(|m| !m.trim().is_empty())
                    .or_else(|| {
                        value
                            .get("decision_reason")
                            .and_then(|v| v.as_str())
                            .filter(|m| !m.trim().is_empty())
                    })
                    .map(|m| bounded_stream_string(m, MAX_DENIAL_MESSAGE_BYTES))
                    .unwrap_or_default(),
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
                permission_denials: denial_entries(value.get("permission_denials")),
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

/// The ONE discipline every stream-borne string in this module travels
/// under: bounded in bytes, then stripped of control characters, before
/// it can reach a log line or the screen. Extracted at T-081 so the two
/// denial channels cannot apply it two slightly different ways — and so
/// that the JOIN between them compares ids that went through the same
/// transform on both sides.
fn bounded_stream_string(raw: &str, max: usize) -> String {
    crate::docs_watch::sanitize_for_log(&super::sessions::truncate_utf8(raw, max))
}

/// One optional, bounded, control-stripped field off a denial line.
/// Absent, non-string and blank all read the same: `None`.
fn denial_field(value: &serde_json::Value, key: &str) -> Option<String> {
    value
        .get(key)
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| bounded_stream_string(s, MAX_DENIAL_BYTES))
}

/// The entries off a `permission_denials` array. The CLI writes objects
/// (`{"tool_name": "Bash", "tool_use_id": "toolu_…", "tool_input": {…}}`
/// — confirmed by the 2.1.226 capture) and could write bare strings; both
/// are read, everything else is skipped, and every field is BOUNDED and
/// stripped of control characters — it is model-adjacent data off a
/// stream, like every other string in this module.
///
/// T-081 reads `tool_use_id` here for the first time. It changes nothing
/// about the names; it is what makes a `result` entry recognisable as the
/// SAME denial the in-band channel already announced.
fn denial_entries(value: Option<&serde_json::Value>) -> Vec<ResultDenial> {
    let Some(serde_json::Value::Array(items)) = value else {
        return Vec::new();
    };
    items
        .iter()
        .take(MAX_DENIALS)
        .filter_map(|item| match item {
            serde_json::Value::String(s) => Some(ResultDenial {
                tool_name: Some(s.as_str())
                    .map(str::trim)
                    .filter(|s| !s.is_empty())
                    .map(|s| bounded_stream_string(s, MAX_DENIAL_BYTES)),
                tool_use_id: None,
            }),
            serde_json::Value::Object(_) => Some(ResultDenial {
                tool_name: denial_field(item, "tool_name")
                    .or_else(|| denial_field(item, "tool")),
                tool_use_id: denial_field(item, "tool_use_id"),
            }),
            _ => None,
        })
        .collect()
}

/// The names view of those entries — what [`TurnError::ToolDenied`]
/// carries, and what the diagnostic ring note lists. An entry the CLI
/// wrote without a readable tool name contributes nothing here, exactly
/// as it did before T-081; it still exists as an entry, because the
/// denial happened whether or not the app can name it.
fn denial_names<'a>(entries: impl IntoIterator<Item = &'a ResultDenial>) -> Vec<String> {
    entries.into_iter().filter_map(|d| d.tool_name.clone()).collect()
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
            // T-060: there is no cache to invalidate here any more. A
            // spawn ENOENT simply fails the turn; the NEXT resolve probes
            // from scratch because every resolve does.
            let error = TurnError::SpawnFailed { os: err.to_string() };
            out.error = Some(error.clone());
            emitter.failed(req.turn, error);
            return out;
        }
    };
    let pid = child.id() as i32;
    // ONE handle, two holders: this thread owns the `Child` and does
    // every `waitpid`; the shared slot hands a clone to `genesis_cancel`
    // and the exit hook, which read the reaped flag this thread sets.
    let handle = ChildHandle::new(pid, req.turn);
    *child_slot.lock().expect("child slot poisoned") = Some(handle.clone());
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
    // T-081: the `tool_use_id` of every denial ALREADY announced live, so
    // the cumulative `result` list can be told apart from a repeat of it.
    // Bounded by the live-emit cap below, which is bounded by MAX_DENIALS.
    let mut announced_denials: Vec<String> = Vec::new();
    let mut live_denials: usize = 0;
    // T-069: has model text arrived since the last line that named an
    // auth status? Only meaningful for a turn that never writes a
    // terminal `result` line, which is the one family T-029's rule
    // cannot reach.
    let mut text_after_auth_status = false;
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
                        // T-069's discriminator, recorded where the
                        // evidence arrives. Model text is streamed by a
                        // request that SUCCEEDED, so a delta after the
                        // last status-bearing line is the stream saying
                        // the CLI got past that status. Kept as its own
                        // flag rather than read off `relayed`, which
                        // counts FLUSHED bytes only and carries no order
                        // relative to the diagnostic.
                        if auth_status.is_some() {
                            text_after_auth_status = true;
                        }
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
                    // T-081: A DENIAL IS NEWS WHEN IT HAPPENS.
                    StreamLine::Denial { tool_name, tool_use_id, message } => {
                        saw_json_anchor = true;
                        // Order on screen has to match order in the
                        // stream: a denial that lands mid-sentence must
                        // appear AFTER the words already streamed, not
                        // in front of them. Same flush the `Activity`
                        // arm does, for the same reason.
                        flush_pending(emitter, req.turn, &mut pending, &mut pending_since, &mut relayed);
                        // The cap is this module's standing discipline
                        // applied to an event COUNT rather than to a
                        // string length: a stream is untrusted, and a
                        // broken or hostile CLI must not be able to
                        // flood the webview. Past the cap the id is NOT
                        // recorded either, so the `result` line's own
                        // copy is still reported below — the denial
                        // arrives late rather than not at all.
                        if live_denials < MAX_DENIALS {
                            live_denials += 1;
                            if let Some(id) = &tool_use_id {
                                announced_denials.push(id.clone());
                            }
                            emitter.denied(req.turn, tool_name, tool_use_id, message);
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
                        //
                        // T-069 DISCLOSES WHAT THAT COST, because the
                        // comment above says why the rule is right and
                        // never said what it gave up. An auth failure
                        // that names its status ONLY in a diagnostic,
                        // over a `result` line carrying no
                        // `api_error_status` of its own, is CLEARED here
                        // and stops being typed: it degrades to
                        // `ExitNonZero`, with the auth sentence still in
                        // the tail and Try again restored. Measured one
                        // line apart at `307319b` (pre-fix, `AuthFailed`)
                        // and `4540821` (post-fix, `ExitNonZero`).
                        //
                        // IT COSTS 2.1.226 NOTHING, and that is the whole
                        // of why the trade is safe: the transcribed
                        // shape puts `api_error_status` on its own
                        // `result` line, so nothing observed is narrowed.
                        // THAT IS A FACT ABOUT THE CLI, AND FACTS ABOUT
                        // THE CLI MOVE. `auth-error-result-only` in
                        // `fake_agent.rs` is the transcribed stream minus
                        // its diagnostic — the terminal line is the only
                        // carrier of the status left — and
                        // `the_transcribed_auth_shape_carries_its_status_on_its_own_result_line`
                        // drives it, so a CLI version that moves the
                        // status REDS instead of silently losing the
                        // flagship affordance.
                        auth_status = api_error_status;
                        // The turn's own verdict has just spoken, so
                        // whatever the model said earlier no longer
                        // argues against it (see `text_after_auth_status`
                        // in the `Diagnostic` arm below).
                        text_after_auth_status = false;
                        if reason.is_some() {
                            terminal_reason = reason;
                        }
                        if !denials.is_empty() {
                            // T-081: THE JOIN, AND IT RUNS BEFORE ANYTHING
                            // IS REPORTED. `permission_denials` is
                            // CUMULATIVE — it lists every denial of the
                            // turn, including the ones the in-band
                            // channel already announced live, and
                            // `tool_use_id` is on both channels. Without
                            // this partition every observed denial would
                            // reach the user twice: once when it
                            // happened and once more at the end, which
                            // reads as two refusals rather than one.
                            //
                            // An entry with no id cannot be joined and
                            // is treated as UNANNOUNCED. That direction
                            // is deliberate: a repeat is a nuisance, a
                            // silence is the defect this card exists to
                            // fix.
                            let unannounced: Vec<&ResultDenial> = denials
                                .iter()
                                .filter(|d| match &d.tool_use_id {
                                    Some(id) => !announced_denials.iter().any(|seen| seen == id),
                                    None => true,
                                })
                                .collect();
                            // The older CLI path — and any denial the
                            // in-band channel missed — reaches the same
                            // screen the live ones do, late rather than
                            // never. T-069's ring relay below only ever
                            // surfaced on a FAILED turn, because
                            // `stderr_tail` rides `ExitNonZero`; a
                            // recovered denial on a SUCCEEDING turn was
                            // silent even after T-069.
                            for denial in &unannounced {
                                emitter.denied(
                                    req.turn,
                                    denial.tool_name.clone(),
                                    denial.tool_use_id.clone(),
                                    // The `result` line carries
                                    // `tool_input`, never a message. The
                                    // app says what it has and invents
                                    // nothing.
                                    String::new(),
                                );
                            }
                            // T-069: RELAYING IS NOT DIAGNOSING, and this
                            // push is the difference. The classification
                            // below may DECLINE these names — it does
                            // whenever the CLI did not flag its own
                            // result an error — and declining is right:
                            // a cumulative record of what was refused is
                            // not a statement that a refusal ended the
                            // turn. But a declined DIAGNOSIS was also
                            // relaying nothing. `is_error: false` means
                            // the branch above never pushed the result
                            // text either, so the turn arrived as
                            // `ExitNonZero { code: Some(1), stderr_tail:
                            // "" }`, `failureDetail` returned null for an
                            // empty trimmed detail, and the screen read
                            // "the planner exited with code 1" with
                            // nothing under it — while the names sat
                            // parsed, bounded and control-stripped in
                            // this very `Vec`.
                            //
                            // The `api_retry` note below is the
                            // precedent: the ring already carries
                            // diagnostics the classifier does not act
                            // on, because the ring is a DIAGNOSTIC ring
                            // and not a claim. Bounded by `denial_names`
                            // (16 × 128 bytes) and sanitized there, then
                            // sanitized again with the whole tail.
                            //
                            // T-081 NARROWS IT TO THE UNANNOUNCED SET
                            // for the same no-double-reporting reason:
                            // a name already delivered as its own event
                            // does not need repeating in the tail.
                            let unreported = denial_names(unannounced.iter().copied());
                            if !unreported.is_empty() {
                                let note =
                                    format!("permission_denials: {}", unreported.join(", "));
                                let mut ring = stderr_ring.lock().expect("stderr ring poisoned");
                                ring.push(note.as_bytes());
                                ring.push(b"\n");
                            }
                            // The CUMULATIVE record, whole and unjoined:
                            // `ToolDenied` names every tool the turn was
                            // refused, which is a different question from
                            // which of them the user has already been
                            // told about.
                            let names = denial_names(&denials);
                            if !names.is_empty() {
                                permission_denials = names;
                            }
                        }
                        result_text = Some(text);
                    }
                    StreamLine::Diagnostic { note, error_status } => {
                        saw_json_anchor = true;
                        if error_status.is_some() {
                            auth_status = error_status;
                            // A NEW status supersedes whatever text came
                            // before it: the discriminator is about text
                            // after the LAST status-bearing line, so a
                            // second 401 arriving behind a recovered
                            // first one still classifies.
                            text_after_auth_status = false;
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
        // The grace poll REAPS AS IT WAITS (T-043): the direct child is
        // cleared inside the loop, so a cooperative CLI releases the
        // single-flight latch in milliseconds instead of costing the full
        // grace — and a resistant same-group descendant still runs the
        // poll to the deadline and still gets SIGKILLed.
        let exit = terminate_group_owning(&mut child, &handle, cfg.kill_grace);
        if exit.escalated {
            println!(
                "[nputer] agent: turn {} did not leave within the {} ms grace - SIGKILLed process group {pid}",
                req.turn,
                cfg.kill_grace.as_millis()
            );
        }
        // A no-op when the poll already reaped; the real wait when the
        // poll had to escalate.
        let _ = child.wait();
        None
    } else {
        child.wait().ok()
    };
    // Whichever arm ran, this thread has now waited: publish it before
    // the slot is cleared, so an exit observer holding a clone stops
    // polling instead of racing the clear.
    handle.mark_reaped();
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
            //
            // T-069 CLOSES THE ONE FAMILY THE TERMINAL-STATE RULE CANNOT
            // REACH. A turn that writes NO `result` line has no terminal
            // verdict to clear a status with, so a 401 the CLI retried
            // and got past survived here and typed `AuthFailed` — which
            // removes Try again and sends a user whose login is fine to
            // `claude login`, the exact harm T-029 exists to undo.
            //
            // `text_after_auth_status` closes it on evidence the stream
            // ALREADY CARRIES: model text is streamed by a request that
            // SUCCEEDED, so a delta after the last status-bearing line
            // is the CLI demonstrating it got past that status. No
            // `terminal_reason` vocabulary is consulted — the set
            // T-029-s5 records as unverified is not touched here.
            //
            // IT WITHDRAWS A CLAIM, IT NEVER MAKES ONE, which is why it
            // is allowed to rest on weaker evidence than the arms above:
            // when it is wrong the turn degrades to `ExitNonZero` with
            // the status still legible in the tail and Try again
            // restored — the direction T-029's verifier ratified, where
            // losing a diagnosis to a relay beats a false positive that
            // takes the retry away. The counter-pin holds by
            // construction: `auth-403-no-result` streams no delta at
            // all, so its 403 still classifies.
            if matches!(auth_status, Some(401) | Some(403)) && !text_after_auth_status {
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

    /// **THIS PIN IS ABOUT THE STRUCT, AND SINCE T-060 IT SAYS SO.**
    ///
    /// Its name has always been true of `RunnerConfig` and a reader
    /// generalised it to the runner — which is T-047-s4's finding, and
    /// the reason the companion test below exists. Keeping the two apart
    /// is deliberate: one property, one body, so neither can hide behind
    /// the other.
    #[test]
    fn default_config_reads_nothing_from_the_environment() {
        // A hostile env cannot redirect the production spawn THROUGH THIS
        // STRUCT: the three seam fields are Rust-only, filled by a test
        // constructing the struct — never by any variable.
        std::env::set_var("NPUTER_AGENT_BIN", "/tmp/evil");
        std::env::set_var("NPUTER_FAKE_SCENARIO", "happy");
        std::env::set_var("NPUTER_AGENT_PATH", "/tmp/evil/bin");
        let cfg = RunnerConfig::default();
        assert_eq!(cfg.binary_override, None);
        assert_eq!(cfg.path_override, None);
        assert!(cfg.extra_env.is_empty());
        assert!(
            cfg.probe_login_shell,
            "production DOES probe the login shell - that is T-025 criterion 4"
        );
        std::env::remove_var("NPUTER_AGENT_BIN");
        std::env::remove_var("NPUTER_FAKE_SCENARIO");
        std::env::remove_var("NPUTER_AGENT_PATH");
    }

    /// **THE COMPANION THE PIN ABOVE NEEDED (T-060, T-047-s4).**
    ///
    /// "Production reads nothing from the environment" was true of the
    /// CONFIG and false of the RESOLVER two functions away. This body
    /// names the three variables the resolver actually reads, so the next
    /// reader meets the exception beside the rule instead of inferring it
    /// is not there.
    ///
    /// It is a SOURCE assertion, not a behavioural one, on purpose: the
    /// behaviour of each read is pinned by its own test below, and what
    /// was missing was a list nobody had to go looking for.
    #[test]
    fn the_resolver_does_read_the_environment_and_here_is_every_variable() {
        let source = include_str!("runner.rs");
        // Everything between the resolution banner and the child-env
        // banner: the resolver, and nothing else in the file.
        let from = source.find("// ---- binary resolution").expect("resolution banner");
        let to = source.find("// ---- the environment allowlist").expect("allowlist banner");
        let resolver = &source[from..to];

        let mut read: Vec<&str> = resolver
            .match_indices("std::env::var")
            .map(|(idx, _)| {
                let rest = &resolver[idx..];
                let open = rest.find('(').expect("call parens");
                let close = rest.find(')').expect("call parens");
                rest[open + 1..close].trim().trim_matches('"')
            })
            .collect();
        read.sort_unstable();
        read.dedup();

        assert_eq!(
            read,
            vec!["NO_REAL_CLI_VAR", "PATH", "SHELL"],
            "the resolver's environment reads moved - update RunnerConfig's doc comment \
             and this list together, because the doc comment is the only place a reader \
             is told the config pin does not cover them"
        );
        // …and the one read by constant is the guard, spelled out. A test
        // parametrised by a constant cannot pin that constant, so the
        // VALUE is pinned here, separately from every use of it.
        assert_eq!(NO_REAL_CLI_VAR, "NPUTER_NO_REAL_CLI");
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
        // T-081: …and the denial line, which ALSO has no error field, is
        // the one `system` subtype that must not fall through to it.
        assert_eq!(
            classify_line(
                r#"{"type":"system","subtype":"permission_denied","tool_name":"Bash","tool_use_id":"toolu_1","decision_reason_type":"subcommandResults","message":"nope"}"#
            ),
            StreamLine::Denial {
                tool_name: Some("Bash".into()),
                tool_use_id: Some("toolu_1".into()),
                message: "nope".into(),
            }
        );
        // Forward-compatible: an unknown JSON type is ignored, not fatal.
        assert_eq!(classify_line(r#"{"type":"brand_new_thing"}"#), StreamLine::Ignored);
        assert_eq!(classify_line(r#"{"no":"type"}"#), StreamLine::Ignored);
        // Non-JSON is tolerated (real CLIs warn on stdout).
        assert_eq!(classify_line("warning: node 18 is deprecated"), StreamLine::NotJson);
        assert_eq!(classify_line(""), StreamLine::NotJson);
    }

    /// T-081, THE BOUND AND THE STRIPPING ON *THIS* PATH.
    ///
    /// `denial_names()` has carried the same discipline since T-029 and
    /// its own tests cover it — but reusing a helper is not the same as
    /// being covered by that helper's tests, and this path reaches the
    /// screen with a string the CLI wrote about what a model asked for.
    /// Every expectation below is a LITERAL, never the constant the
    /// producer reads: a test parametrised by the constant it checks
    /// cannot pin that constant.
    #[test]
    fn an_in_band_denial_is_bounded_and_control_stripped_on_its_own_path() {
        // The bound. 5 000 plain bytes in, 768 out — the constant's
        // value, written out, so moving the constant reds here.
        let long = "A".repeat(5_000);
        let line = serde_json::json!({
            "type": "system", "subtype": "permission_denied",
            "tool_name": "Bash", "tool_use_id": "toolu_long", "message": long
        })
        .to_string();
        match classify_line(&line) {
            StreamLine::Denial { message, .. } => {
                assert_eq!(message.len(), 768, "the message is cut at the module's own bound");
                assert!(!message.contains('…'), "768 ASCII bytes stay under the log cap, so \
                     nothing appends a truncation marker here — read the length, not the tail");
            }
            other => panic!("expected Denial, got {other:?}"),
        }

        // The stripping. A control-bearing message must not reach the
        // screen or a log line with its bytes intact.
        let line = serde_json::json!({
            "type": "system", "subtype": "permission_denied",
            "tool_name": "Ba\u{1b}[31msh", "tool_use_id": "toolu_ctl",
            "message": "denied\nbecause\u{7f} of a rule"
        })
        .to_string();
        match classify_line(&line) {
            StreamLine::Denial { tool_name, message, .. } => {
                assert!(!message.contains('\n'), "no raw newline survives: {message:?}");
                assert!(!message.contains('\u{7f}'), "no raw DEL survives: {message:?}");
                assert!(message.contains("\\n"), "it is ESCAPED, not deleted: {message:?}");
                assert_eq!(
                    tool_name.as_deref(),
                    Some("Ba\\u{1b}[31msh"),
                    "the name travels under the same discipline"
                );
            }
            other => panic!("expected Denial, got {other:?}"),
        }

        // The name bound is the older, tighter one and applies here too.
        let line = serde_json::json!({
            "type": "system", "subtype": "permission_denied",
            "tool_name": "B".repeat(400), "message": "x"
        })
        .to_string();
        match classify_line(&line) {
            StreamLine::Denial { tool_name, tool_use_id, .. } => {
                assert_eq!(tool_name.map(|n| n.len()), Some(128));
                assert_eq!(tool_use_id, None, "an absent id is None, never an empty string");
            }
            other => panic!("expected Denial, got {other:?}"),
        }
    }

    /// T-081 criterion 6: a denial the app cannot fully describe is not a
    /// denial the user should be denied. Each degenerate line below still
    /// classifies as a `Denial` — the alternative is silence.
    #[test]
    fn a_denial_line_missing_its_fields_still_classifies() {
        assert_eq!(
            classify_line(r#"{"type":"system","subtype":"permission_denied"}"#),
            StreamLine::Denial { tool_name: None, tool_use_id: None, message: String::new() },
            "no tool, no id, no message - still a denial"
        );
        assert_eq!(
            classify_line(
                r#"{"type":"system","subtype":"permission_denied","tool_name":"Write","message":"   "}"#
            ),
            StreamLine::Denial {
                tool_name: Some("Write".into()),
                tool_use_id: None,
                message: String::new(),
            },
            "a blank message reads as no message, and the tool name still arrives"
        );
        // The SECOND observed line's shape: `decision_reason` beside
        // `message`. When the message is missing the reason is what the
        // line has, and what it has is what gets said.
        assert_eq!(
            classify_line(
                r#"{"type":"system","subtype":"permission_denied","tool_name":"Write","decision_reason_type":"other","decision_reason":"Glob patterns are not allowed in write operations."}"#
            ),
            StreamLine::Denial {
                tool_name: Some("Write".into()),
                tool_use_id: None,
                message: "Glob patterns are not allowed in write operations.".into(),
            }
        );
    }

    /// T-081: the `result` line's entries are parsed ONCE and read two
    /// ways — names for [`TurnError::ToolDenied`], `tool_use_id` for the
    /// join. The 2.1.226 capture is the shape driven here, and it is the
    /// shape nobody had: **both denials name the SAME tool**, so the name
    /// cannot be the join key and the id has to be.
    #[test]
    fn result_denial_entries_carry_the_join_key_beside_the_name() {
        let value: serde_json::Value = serde_json::from_str(
            r#"{"permission_denials":[
                {"tool_name":"Bash","tool_use_id":"toolu_01FAHQKCKFrBLrmVtRiuLT9L","tool_input":{"command":"…"}},
                {"tool_name":"Bash","tool_use_id":"toolu_0173K9Q72m797nLBonDtrc3R","tool_input":{"command":"…"}}
            ]}"#,
        )
        .expect("fixture parses");
        let entries = denial_entries(value.get("permission_denials"));
        assert_eq!(
            entries,
            vec![
                ResultDenial {
                    tool_name: Some("Bash".into()),
                    tool_use_id: Some("toolu_01FAHQKCKFrBLrmVtRiuLT9L".into()),
                },
                ResultDenial {
                    tool_name: Some("Bash".into()),
                    tool_use_id: Some("toolu_0173K9Q72m797nLBonDtrc3R".into()),
                },
            ]
        );
        // The names view is what T-029 always saw — and it is NOT deduped,
        // because two refusals of one tool are two refusals.
        assert_eq!(denial_names(&entries), vec!["Bash".to_string(), "Bash".to_string()]);

        // The defensive shapes, unchanged in what they yield to the names
        // view: a bare string is a name with no id; a number is nothing;
        // an object with no readable name is an ENTRY with no name, which
        // the join can still carry and the names view still drops.
        let value: serde_json::Value = serde_json::from_str(
            r#"{"d":["WebFetch",7,{"tool_use_id":"toolu_nameless"},{"tool":"Legacy"}]}"#,
        )
        .expect("fixture parses");
        let entries = denial_entries(value.get("d"));
        assert_eq!(
            entries,
            vec![
                ResultDenial { tool_name: Some("WebFetch".into()), tool_use_id: None },
                ResultDenial { tool_name: None, tool_use_id: Some("toolu_nameless".into()) },
                ResultDenial { tool_name: Some("Legacy".into()), tool_use_id: None },
            ]
        );
        assert_eq!(denial_names(&entries), vec!["WebFetch".to_string(), "Legacy".to_string()]);
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

    /// T-047 (T-039-s1, first half), **now the gate at EVERY door**
    /// (T-060, T-047-s5): what a resolved binary path has to survive
    /// before anything executes it.
    ///
    /// Each refused shape here is one T-047 MEASURED executing against
    /// the unfixed code — the traversal and misnamed rows both ran their
    /// binary at resolve time, through `probe_version`'s `Command::new`,
    /// before any turn existed. The three `relbin` rows are T-060's
    /// addition and they are the shapes a RELATIVE PATH ENTRY produces:
    /// `dir.join("claude")` over `.`, over an empty element and over a
    /// bare directory name.
    #[test]
    fn a_resolved_binary_path_must_look_like_something_a_probe_could_have_said() {
        let adapter = super::super::adapter::planner_adapter();
        for (path, expected) in [
            ("", ResolvedPathRejection::Empty),
            ("claude", ResolvedPathRejection::NotAbsolute),
            ("bin/claude", ResolvedPathRejection::NotAbsolute),
            ("./bin/claude", ResolvedPathRejection::NotAbsolute),
            // T-060: exactly what `which_in` builds from a relative PATH
            // element. The middle row is the EMPTY element — POSIX says
            // it means the current directory, and `PathBuf::from("")
            // .join("claude")` is `"claude"`.
            ("relbin/claude", ResolvedPathRejection::NotAbsolute),
            ("claude", ResolvedPathRejection::NotAbsolute),
            ("./claude", ResolvedPathRejection::NotAbsolute),
            ("/opt/bin/../evil/claude", ResolvedPathRejection::Traversal),
            ("/opt/./claude", ResolvedPathRejection::Traversal),
            ("/../claude", ResolvedPathRejection::Traversal),
            (
                "/opt/homebrew/bin/tattler",
                ResolvedPathRejection::WrongName { expected: "claude" },
            ),
            ("/opt/homebrew/bin/", ResolvedPathRejection::WrongName { expected: "claude" }),
            // Absolute, traversal-free, correctly named — and nothing
            // there. The file check is KEPT, not replaced.
            ("/nonexistent-t047/bin/claude", ResolvedPathRejection::NotExecutable),
        ] {
            assert_eq!(
                validate_resolved_binary(Path::new(path), adapter),
                Err(expected.clone()),
                "resolved path {path:?} must be refused as {expected:?}"
            );
        }

        // The joins above are asserted to BE what `which_in` produces,
        // rather than assumed to look like it — the bug was in the join.
        for element in [".", "", "relbin"] {
            let built = PathBuf::from(element).join(adapter.binary);
            assert_eq!(
                validate_resolved_binary(&built, adapter),
                Err(ResolvedPathRejection::NotAbsolute),
                "a relative PATH element {element:?} joins to {built:?}, which must be refused"
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
            assert_eq!(validate_resolved_binary(&good, adapter), Ok(()));
            // …and the same file with the bit cleared is not.
            std::fs::set_permissions(&good, std::fs::Permissions::from_mode(0o644))
                .expect("chmod");
            assert_eq!(
                validate_resolved_binary(&good, adapter),
                Err(ResolvedPathRejection::NotExecutable)
            );
            let _ = std::fs::remove_dir_all(&dir);
        }
    }

    /// **THERE IS NO CACHE TO POISON (T-060, retiring T-047's).**
    ///
    /// This body replaces `the_resolution_cache_stores_a_path_and_never_a
    /// _login_path`, and it is a strictly stronger assertion: that test
    /// pinned WHAT the cache stored, which only matters while a cache
    /// exists. What is pinned now is that the whole file→exec class is
    /// gone — no reader, no writer, no invalidator, no config field, no
    /// serde types, and no mention of the filename anywhere in the
    /// resolver.
    ///
    /// It is a SOURCE assertion because that is the only form that can
    /// fail for the right reason. A behavioural test ("planting
    /// `agent-paths.json` changes nothing") passes vacuously against a
    /// build that reintroduced the cache under a different filename; this
    /// one fails the moment a reader appears.
    #[test]
    fn there_is_no_cache_to_poison() {
        let source = include_str!("runner.rs");
        // Everything except this test module, MINUS every comment line.
        // The retirement is DOCUMENTED in the file it removed the code
        // from — deliberately, so the next reader does not reintroduce
        // it — so the words below are expected in prose and forbidden in
        // code, and only stripping comments can tell the two apart.
        let code: String = source[..source.find("#[cfg(test)]\nmod tests {").expect("test module")]
            .lines()
            .filter(|line| !line.trim_start().starts_with("//"))
            .collect::<Vec<_>>()
            .join("\n");
        let code = code.as_str();
        // The strip is proved to WORK, not assumed: a marker that exists
        // only inside a comment must be gone, and one that exists only in
        // code must survive.
        assert!(!code.contains("PROCESS-LIFETIME memo, never a file"), "comments were not stripped");
        assert!(code.contains("pub fn resolve_cli"), "the strip ate the code as well");

        for banned in [
            "agent-paths.json",
            "fn read_cache",
            "fn write_cache",
            "fn invalidate_cache",
            "fn cache_path",
            "struct CacheFile",
            "struct CacheEntry",
            "config_dir",
        ] {
            assert!(
                !code.contains(banned),
                "{banned:?} is back in the resolver - T-060 retired the resolved-binary \
                 cache so that a hostile file has NO path to `Command::new` at all. If a \
                 cache is genuinely needed again, criterion 2 already ruled its shape: a \
                 PROCESS-LIFETIME memo, never a file."
            );
        }

        // The ruling on what a future cache may look like must stay
        // WRITTEN DOWN in this file — in prose, which is why it is
        // asserted against the unstripped source.
        assert!(
            source.contains("PROCESS-LIFETIME memo, never a file"),
            "the ruling on what a future cache may look like must stay in the file"
        );
        // `serde_json` survives elsewhere in the crate; what must not is
        // any serde type in the RESOLVER, which existed only to give the
        // cache file a shape. Bounded by CODE landmarks, because the
        // banner comments are exactly what the strip above removed.
        let from = code.find("pub enum ResolveError").expect("resolver start");
        let to = code.find("pub const ENV_ALLOWLIST").expect("allowlist");
        assert!(from < to, "the resolver landmarks are out of order");
        assert!(
            !code[from..to].contains("serde"),
            "the resolver deserializes something again - the cache was the only reason it ever did"
        );
    }

    /// **`$SHELL` DECIDES WHICH PROGRAM RUNS (T-060, T-047-s4).**
    ///
    /// Before this, ANY absolute executable named anything was run with
    /// `-l -c <script>` — and `SHELL` is on `ENV_ALLOWLIST`, so it is
    /// whatever the launching environment said. The script relies on
    /// `command -v`, `$PATH` and `&&` behaving the POSIX way, which fish
    /// does not do for `-l -c`.
    #[test]
    fn the_login_shell_is_name_checked_not_merely_executable() {
        let restore = std::env::var("SHELL").ok();

        // A real, absolute, executable file that is NOT a supported
        // shell. `/bin/ls` qualifies on every macOS and Linux box and is
        // exactly the "absolute executable named anything" case.
        for hostile in ["/bin/ls", "/usr/bin/true", "/bin/cat"] {
            if !is_executable_file(Path::new(hostile)) {
                continue;
            }
            std::env::set_var("SHELL", hostile);
            assert_eq!(
                login_shell(),
                PathBuf::from("/bin/zsh"),
                "{hostile} is absolute and executable and must STILL not be run with -l -c"
            );
        }
        // fish is the named case: its `-l -c` differs, so even a real
        // shell that is not one of the three falls back.
        std::env::set_var("SHELL", "/opt/homebrew/bin/fish");
        assert_eq!(login_shell(), PathBuf::from("/bin/zsh"), "fish's -l -c is not ours");
        // Relative, empty and absent all fall back too.
        std::env::set_var("SHELL", "zsh");
        assert_eq!(login_shell(), PathBuf::from("/bin/zsh"), "a relative SHELL is not a program");
        std::env::set_var("SHELL", "");
        assert_eq!(login_shell(), PathBuf::from("/bin/zsh"));
        std::env::remove_var("SHELL");
        assert_eq!(login_shell(), PathBuf::from("/bin/zsh"));

        // THE DISCRIMINATING HALF: a gate nobody can pass is not a gate.
        // Each of the three supported names, at a real absolute path, is
        // honoured rather than overridden.
        let mut honoured = 0;
        for good in ["/bin/zsh", "/bin/bash", "/bin/sh"] {
            if !is_executable_file(Path::new(good)) {
                continue;
            }
            std::env::set_var("SHELL", good);
            assert_eq!(login_shell(), PathBuf::from(good), "{good} is a shell we support");
            honoured += 1;
        }
        assert!(honoured >= 2, "the discriminating half did not run: {honoured} shells found");
        // …and it is not passing merely because the fallback IS /bin/zsh:
        // /bin/bash and /bin/sh are honoured as themselves.
        assert!(
            is_executable_file(Path::new("/bin/bash")) || is_executable_file(Path::new("/bin/sh")),
            "no non-zsh supported shell on this box - the check above cannot discriminate"
        );

        match restore {
            Some(value) => std::env::set_var("SHELL", value),
            None => std::env::remove_var("SHELL"),
        }
    }

    /// **NO TEST CAN RESOLVE THE USER'S REAL CLI (T-060, T-047-s6).**
    ///
    /// This is the tripwire on the guard itself: `cargo test` runs its
    /// binaries out of `<target>/<profile>/deps/`, so
    /// `real_cli_arms_forbidden()` is true for every test in the repo
    /// with nothing set, exported or remembered. If that ever stops being
    /// true, THIS test goes red — before some other test quietly spawns
    /// the developer's `claude` with a planner prompt, which is what
    /// happened to T-047's verifier.
    #[test]
    fn the_real_cli_arms_are_forbidden_from_a_test_binary() {
        assert!(
            real_cli_arms_forbidden(),
            "a test process must never be able to reach the real CLI"
        );
        assert!(running_as_cargo_test_binary());

        // **THE OVERRIDE, PINNED WITHOUT MUTATING THIS PROCESS
        // (T-060-s3).** This body used to `set_var` the guard variable and
        // put it back. libtest runs these bodies on threads of ONE
        // process, so that window was visible to every sibling — the shape
        // that made the INTEGRATION tripwire red 15 times in 15 at
        // `--test-threads=8`. It was harmless here only because no other
        // lib unit test happens to read the variable, which is precisely
        // the argument that failed over there. The decision is a pure
        // function of (setting, is-test-binary), so both directions of the
        // override are assertable and nothing global moves.
        assert!(!guard_decision(Some("0"), true), "an explicit 0 is the smoke's deliberate opt-out");
        assert!(guard_decision(Some("1"), true));
        assert!(
            guard_decision(Some("1"), false),
            "an explicit 1 forbids even where the derivation would not"
        );
        assert!(guard_decision(None, true), "unset falls back to the derived answer");
        assert!(
            !guard_decision(None, false),
            "…and the derived answer is what the shipped APP gets: nothing forbidden"
        );
        assert!(
            guard_decision(Some("true"), true),
            "an unrecognised value is not a way to lift the guard - only a literal 0 is"
        );
        // That the wrapper really reads the VARIABLE rather than deriving
        // and ignoring it is not assertable here without mutating this
        // process, so it is pinned behaviourally instead, in a process of
        // its own, by the integration test's lifted arm.

        // And the derivation is not accidentally true of the shipped app:
        // a binary run from `<profile>/` or from a bundle is NOT a test.
        for not_a_test in ["/x/target/debug/nputer", "/A.app/Contents/MacOS/nputer", "/usr/bin/x"] {
            let parent = Path::new(not_a_test).parent().and_then(|p| p.file_name());
            assert_ne!(
                parent,
                Some(std::ffi::OsStr::new("deps")),
                "{not_a_test} must not look like a test binary"
            );
        }
        assert_eq!(
            Path::new("/x/target/debug/deps/agent_runner-1a2b").parent().and_then(|p| p.file_name()),
            Some(std::ffi::OsStr::new("deps")),
            "…and a real cargo test binary path must"
        );

        // **THE DIRECTORY NAMES THAT MEAN "A TEST HARNESS BUILT THIS"
        // (T-060-s4).** `deps` is cargo's; `rustdoctest<random>` is
        // rustdoc's, and inside it `cfg!(test)` is FALSE — measured — so
        // the derivation used to fail OPEN for the one kind of test nobody
        // would think to check.
        assert!(is_test_harness_dir(Some("deps")));
        assert!(
            is_test_harness_dir(Some("rustdoctestTieiwm")),
            "a doctest runs out of a `rustdoctest<random>` dir with cfg!(test) false - \
             a doctest on `resolve_cli` would otherwise reach the developer's own CLI"
        );
        for not_a_harness in ["debug", "release", "MacOS", "bin", "target", "rustdoc", "dep", ""] {
            assert!(
                !is_test_harness_dir(Some(not_a_harness)),
                "`{not_a_harness}` is not a test harness directory"
            );
        }
        assert!(!is_test_harness_dir(None), "an unnameable parent is not a test harness");
    }

    /// **A RELATIVE SEARCH-PATH ELEMENT YIELDS NO CANDIDATE (T-060,
    /// T-047-s5).**
    ///
    /// The lookup is the vulnerable step: `dir.join(binary)` over a
    /// relative `dir` builds a relative binary path, and `Command::new`
    /// hands that to the OS, which resolves it against whatever CWD the
    /// app was launched with. T-047's verifier reproduced the executed
    /// end of it with a tattler; this pins the refusal at the join.
    #[test]
    fn a_relative_search_path_element_finds_nothing() {
        use std::os::unix::fs::PermissionsExt;
        let adapter = super::super::adapter::planner_adapter();
        let root = std::env::temp_dir().join(format!(
            "nputer-t060-relpath-{}-{}",
            std::process::id(),
            now_ms()
        ));
        let relbin = root.join("relbin");
        std::fs::create_dir_all(&relbin).expect("mk relbin");
        let planted = relbin.join("claude");
        std::fs::write(&planted, "#!/bin/sh\nexit 0\n").expect("write");
        std::fs::set_permissions(&planted, std::fs::Permissions::from_mode(0o755)).expect("chmod");

        // THE DISCRIMINATING HALF FIRST, so a `None` below cannot mean
        // "there was nothing to find": reached ABSOLUTELY, the very same
        // file IS found.
        assert_eq!(
            which_in(&relbin.display().to_string(), adapter),
            Some(planted.clone()),
            "the absolute spelling of this directory must resolve - otherwise the \
             relative case below proves nothing"
        );

        // …and every relative spelling of a search path finds nothing.
        //
        // **THE RELATIVE ELEMENT HAS TO RESOLVE TO A REAL FILE OR THIS
        // ASSERTS NOTHING.** A poison drill caught exactly that: with
        // `which_in` reverted to its pre-T-060 `is_executable_file`
        // check, an earlier version of this body stayed GREEN, because
        // `relbin/claude` did not exist relative to the test's CWD and
        // the old check refused it for the wrong reason. So the fixture
        // is planted UNDER THE TEST'S OWN WORKING DIRECTORY, where a
        // relative lookup genuinely finds it.
        //
        // cargo runs test binaries with cwd = the package root, and
        // `target/` is inside it and gitignored. The assumption is
        // ASSERTED rather than relied on: if cargo ever changes it, this
        // test says so instead of quietly going vacuous again.
        let cwd = std::env::current_dir().expect("cwd");
        assert_eq!(
            cwd.file_name().and_then(|n| n.to_str()),
            Some("src-tauri"),
            "cargo no longer runs tests from the package root - the relative fixture \
             below would not resolve and this test would pass for the wrong reason"
        );
        let rel_dir = format!("target/nputer-t060-rel-{}-{}", std::process::id(), now_ms());
        let rel_planted = cwd.join(&rel_dir).join(adapter.binary);
        std::fs::create_dir_all(cwd.join(&rel_dir)).expect("mk rel dir");
        std::fs::write(&rel_planted, "#!/bin/sh\nexit 0\n").expect("write");
        std::fs::set_permissions(&rel_planted, std::fs::Permissions::from_mode(0o755))
            .expect("chmod");
        // The bug this pins, stated as a fact about the fixture: reached
        // as a FILE the planted binary is executable, so the only thing
        // refusing it below is its relative SHAPE.
        assert!(
            is_executable_file(Path::new(&format!("{rel_dir}/{}", adapter.binary))),
            "the relative fixture must be executable through a relative path - \
             otherwise `is_executable_file` refuses it and the gate is untested"
        );

        for hostile in [rel_dir.as_str(), ".", "", "relbin:.", ":/nonexistent-t060"] {
            assert_eq!(
                which_in(hostile, adapter),
                None,
                "search path {hostile:?} produced a candidate; a relative element must not"
            );
        }
        let _ = std::fs::remove_dir_all(cwd.join(&rel_dir));
        // A hostile element must not poison an otherwise good search
        // path either — the search CONTINUES past a refusal.
        assert_eq!(
            which_in(&format!(".:relbin:{}", relbin.display()), adapter),
            Some(planted.clone()),
            "a refused element must be skipped, not fatal"
        );

        // `which_on_path` is the SAME lookup over the app's own `PATH` —
        // asserted from the source rather than argued, because the whole
        // finding is that these two producers held different standards.
        let source = include_str!("runner.rs");
        let body_start = source.find("fn which_on_path(").expect("which_on_path");
        let body = &source[body_start..source.find("fn which_in(").expect("which_in")];
        assert!(
            body.contains("which_in(&std::env::var(\"PATH\").ok()?, adapter)"),
            "which_on_path must delegate to the gated which_in: {body}"
        );
        assert!(
            body.contains("real_cli_arms_forbidden()"),
            "…and must be behind the no-real-CLI guard"
        );

        let _ = std::fs::remove_dir_all(&root);
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
