/// T-025 (C-14): the agent runner — spawns the user's own agent CLI
/// headless for genesis turns. `pub` so the integration suite
/// (tests/agent_runner.rs) can drive the seam functions directly; the
/// webview reaches exactly four commands and nothing else.
pub mod agent;
/// `pub` since T-025: the two-direction watcher test lives in the
/// integration suite and drives the REAL watcher thread against the
/// runner's real write set. No item's visibility changed — the module's
/// own `pub fn`s were already public.
pub mod docs_watch;
mod index_cmd;

/// T-021: the pinned webview ACL surface (test-only module — the pin
/// itself is a cargo test; see src/acl_pin.rs for why it exists).
#[cfg(test)]
mod acl_pin;

use std::env;
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicU64;
use std::sync::Arc;
use tauri::{Emitter, Listener, Manager};
use tauri_plugin_dialog::DialogExt;

use agent::{AgentState, CancelOutcome, GenesisStatus, SendOutcome, StartOutcome};
use docs_watch::{PickOutcome, ProjectStatus, WatchState};
use index_cmd::IndexOutcome;

/// Walk up from `start` to the first directory containing a `.git` entry
/// (file or directory, so git worktrees count).
fn git_walk_up(start: &Path) -> Option<PathBuf> {
    let mut dir = start.to_path_buf();
    loop {
        if dir.join(".git").exists() {
            return Some(dir);
        }
        if !dir.pop() {
            return None;
        }
    }
}

/// Resolve the project folder this nputer instance opens at launch.
///
/// T-007 resolution order (recorded in docs/tasks/T-007-open-own-repo.md):
/// 1. `.git` walk-up from the process working directory — T-001's rule,
///    what `npm run tauri dev` and cwd-launched binaries hit, and the
///    explicit-intent signal (launching from inside a repo means "open
///    this repo").
/// 2. `.git` walk-up from the canonicalized executable path — a packaged
///    .app launched from Finder has cwd `/`, but when the bundle lives
///    inside a repo checkout this still finds "the repo the app lives in".
/// 3. None — no repo found anywhere: the frontend lands on the friendly
///    empty state with the folder picker (T-007), instead of T-001's
///    silent fallback to cwd (which for a packaged app meant watching the
///    nonexistent `/docs` forever).
fn resolve_project_dir() -> Option<PathBuf> {
    if let Ok(cwd) = env::current_dir() {
        if let Some(root) = git_walk_up(&cwd) {
            return Some(canonical_or(root));
        }
    }
    if let Ok(exe) = env::current_exe() {
        if let Ok(exe) = exe.canonicalize() {
            if let Some(dir) = exe.parent() {
                if let Some(root) = git_walk_up(dir) {
                    return Some(canonical_or(root));
                }
            }
        }
    }
    None
}

/// Canonicalize when possible (display + containment anchor); fall back to
/// the resolved path if the fs refuses (it exists — we just found .git).
fn canonical_or(path: PathBuf) -> PathBuf {
    path.canonicalize().unwrap_or(path)
}

/// T-063: the event the frontend raises when a startup attempt does not
/// finish. An EVENT, not a command — nothing new is invokable, the
/// `invoke_handler!` list below is unchanged, and `EXPECTED_GRANTS` does
/// not move. The webview already owns `emit`: it is how `model-updated`
/// has reached this process since T-003.
const STARTUP_FAILED_EVENT: &str = "startup-failed";

/// T-063: build the `startup-failed` log line.
///
/// A PURE FUNCTION so the sanitising half is testable without a Tauri
/// runtime; the listener in `run()` is then one `eprintln!` of what this
/// returns, so the thing under test is the thing that ships.
///
/// WHY THE SANITISE IS MANDATORY rather than tidy. `payload` is the
/// serialized `{step, message, attempt}` object, and `message` is
/// `String(reason)` over an arbitrary rejection from the IPC boundary —
/// so a NUL, a BEL, an `ESC [ 31 m` run, or ten thousand characters can
/// all be inside it. The DOM renders that safely and T-050's
/// verification proved it does (a text node, no markup, the whole 10 000
/// on screen). A TERMINAL does not: ESC sequences repaint it, BEL rings
/// it, and an unbroken 10 000-character line is not an entry a human can
/// read. The same string is therefore handled differently at the two
/// sinks BY DESIGN, and `sanitize_for_log` is what makes the stdio sink
/// safe — control characters escaped, the payload capped at
/// `MAX_ECHO_LOG_CHARS` with an explicit truncation marker so the cap
/// never lies by omission.
fn startup_failed_line(payload: &str, recv_at_ms: u64) -> String {
    format!(
        "[nputer] startup-failed: recv_at_ms={recv_at_ms} payload={}",
        docs_watch::sanitize_for_log(payload)
    )
}

/// T-003/T-007: the frontend's one pull at startup — which project is open
/// and, when one is, the current docs tree as a snapshot. Narrow by
/// construction (ADR-010): no arguments, reads only
/// `<resolved project>/docs`, symlinks skipped, canonical-prefix contained
/// (see docs_watch::collect_docs_tree). Subsequent updates arrive as
/// `docs-changed` events pushed by the watcher; both share one seq counter.
#[tauri::command]
fn docs_snapshot(state: tauri::State<'_, WatchState>) -> ProjectStatus {
    docs_watch::project_status(&state)
}

/// T-007: the folder picker. The webview NEVER supplies a path — invoking
/// this zero-argument command opens the native folder dialog in Rust; the
/// chosen directory is validated (canonicalized; must contain a plain,
/// non-symlink docs/ — T-003's rules), the watcher is re-armed on it, and
/// a typed outcome comes back. Cancelling, picking a docs-less folder, or
/// a re-arm failure all leave the previously open project untouched.
///
/// T-021 single-flight (absorbs T-007-s3): the `PickInFlight` guard is
/// claimed BEFORE the dialog opens, so concurrent invocations — a
/// double-click race, or a compromised webview trying to stack native
/// dialogs — get the typed `Busy` outcome and no dialog at all. The
/// guard travels through the whole pipeline (dialog -> validate ->
/// re-arm -> commit) and its Drop releases the latch on every path,
/// including a panicked blocking task.
#[tauri::command]
async fn pick_project_folder(app: tauri::AppHandle) -> PickOutcome {
    let Some(flight) = app.state::<WatchState>().begin_pick() else {
        return PickOutcome::Busy; // a pick is already in flight
    };

    // Native dialog: the plugin dispatches to the main thread itself and
    // calls back from a helper thread; a bounded channel bridges it back
    // into this async command.
    let (tx, mut rx) = tauri::async_runtime::channel::<Option<tauri_plugin_dialog::FilePath>>(1);
    app.dialog()
        .file()
        .set_title("Open an nputer project folder")
        .pick_folder(move |picked| {
            let _ = tx.blocking_send(picked);
        });
    let picked = rx.recv().await.flatten();

    let Some(file_path) = picked else {
        return PickOutcome::Cancelled; // dialog dismissed (or dropped); guard drops here
    };
    let path = match file_path.into_path() {
        Ok(path) => path,
        Err(err) => {
            return PickOutcome::Error {
                path: String::new(),
                message: format!("dialog returned an unusable selection: {err}"),
            }
        }
    };

    // Validation + re-arm + snapshot are blocking fs work; keep them off
    // the async runtime's core threads. The flight guard moves into the
    // task so the latch is held until apply returns (or panics).
    let handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let state = handle.state::<WatchState>();
        docs_watch::apply_picked_folder(&state, &path, flight)
    })
    .await
    .unwrap_or_else(|err| PickOutcome::Error {
        path: String::new(),
        message: format!("picker task failed: {err}"),
    })
}

/// T-026: the GENESIS picker — the zero-argument variant of the folder
/// picker for "Start an interview" (⌘N). Same ADR-012 posture as
/// `pick_project_folder`, command for command: the webview supplies no
/// path, the native dialog opens in Rust, the choice is validated here
/// (canonicalized; must be a plain, non-symlink directory — the T-003
/// rule family applied to the root), and only a typed outcome comes back.
///
/// The difference is what a valid choice MEANS: a folder with no plan
/// opens as a genesis project (watcher armed on T-018's root sentinel, so
/// the interview's first `mkdir docs` lights the ordinary pipeline), while
/// a folder that already holds one is never offered genesis — it opens as
/// the normal project it is (`apply_genesis_folder` routes it). Cancelling
/// or failing validation leaves the previously open project untouched.
#[tauri::command]
async fn pick_genesis_folder(app: tauri::AppHandle) -> PickOutcome {
    let Some(flight) = app.state::<WatchState>().begin_pick() else {
        return PickOutcome::Busy; // a pick is already in flight
    };

    let (tx, mut rx) = tauri::async_runtime::channel::<Option<tauri_plugin_dialog::FilePath>>(1);
    app.dialog()
        .file()
        .set_title("Start an interview in a folder")
        .pick_folder(move |picked| {
            let _ = tx.blocking_send(picked);
        });
    let picked = rx.recv().await.flatten();

    let Some(file_path) = picked else {
        return PickOutcome::Cancelled; // dialog dismissed; guard drops here
    };
    let path = match file_path.into_path() {
        Ok(path) => path,
        Err(err) => {
            return PickOutcome::Error {
                path: String::new(),
                message: format!("dialog returned an unusable selection: {err}"),
            }
        }
    };

    let handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let state = handle.state::<WatchState>();
        docs_watch::apply_genesis_folder(&state, &path, flight)
    })
    .await
    .unwrap_or_else(|err| PickOutcome::Error {
        path: String::new(),
        message: format!("picker task failed: {err}"),
    })
}

/// T-026: "Start an interview here" — genesis in the folder the front
/// door is already talking about, with NO dialog and, as always, no path
/// from the webview (ADR-012). The target is Rust's own memory of the
/// user's last dialog choice that turned out to have no `docs/`, falling
/// back to the open project (the launch-resolved repo with no plan — the
/// first-launch genesis entry). A webview that invokes this out of turn
/// can therefore only re-open a folder the USER already chose, and the
/// plan check in `apply_genesis_folder` still governs.
#[tauri::command]
async fn start_genesis_here(app: tauri::AppHandle) -> PickOutcome {
    // Scoped so the State borrow never crosses the await below.
    let claimed = {
        let state = app.state::<WatchState>();
        state.begin_pick().map(|flight| (flight, state.genesis_target()))
    };
    let Some((flight, target)) = claimed else {
        return PickOutcome::Busy;
    };
    let Some(target) = target else {
        // The guard drops here, releasing the latch.
        return PickOutcome::Error {
            path: String::new(),
            message: "no folder to start an interview in - open a folder first".into(),
        };
    };

    let handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let state = handle.state::<WatchState>();
        docs_watch::apply_genesis_folder(&state, &target, flight)
    })
    .await
    .unwrap_or_else(|err| PickOutcome::Error {
        path: String::new(),
        message: format!("genesis task failed: {err}"),
    })
}

/// T-012: run the indexer over the open project and write the committed
/// graph (ADR-013/014/015). Zero-argument by construction (ADR-010/012
/// pattern): the webview names no path — the project root comes from
/// WatchState, the cache dir from the app's own cache path — and only
/// counts and timestamps come back. Delivery of the new graph rides the
/// docs watcher (the write lands inside watched docs/), so this command
/// returns the volatile stats and the snapshot arrives on its own; an
/// unchanged tree produces no write and no snapshot at all (the T-009
/// loop-termination brake, pinned live in index_cmd tests).
#[tauri::command]
async fn index_repo(app: tauri::AppHandle) -> IndexOutcome {
    // Cache location is the app's business, never the webview's; the
    // crate treats None as "no cache" (full parse) — degradation, not
    // failure.
    let cache_dir = app
        .path()
        .app_cache_dir()
        .ok()
        .map(|dir| dir.join("index-cache"));

    // Indexing is blocking fs + parse work; keep it off the async
    // runtime's core threads (the T-007 spawn_blocking pattern).
    let handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let state = handle.state::<WatchState>();
        index_cmd::run_index(&state, cache_dir)
    })
    .await
    .unwrap_or_else(|err| IndexOutcome::Error {
        message: format!("index task failed: {err}"),
    })
}

/// T-025 criterion 1: start the genesis interview. ZERO ARGUMENTS — the
/// kickoff prompt is assembled Rust-side from the compiled-in method
/// snapshot plus the open project from `WatchState`, never from the
/// webview, and the adapter table is data inside the binary that no
/// command returns.
///
/// `async` on purpose: the first-ever call may run the login-shell probe
/// (§6, bounded at 10s), and Tauri runs synchronous commands on the main
/// thread. Async commands with borrowed `State` must return `Result`; the
/// `Err` arm is unreachable by construction — every failure is a typed
/// outcome, which is the whole PickOutcome discipline.
#[tauri::command]
async fn genesis_start(
    watch: tauri::State<'_, WatchState>,
    agent: tauri::State<'_, AgentState>,
) -> Result<StartOutcome, String> {
    Ok(agent::start_genesis(&watch, &agent))
}

/// T-025 criterion 1: the user's own typed answer — the ONLY
/// webview-supplied datum in the whole runner. It is passed to the child
/// as DATA on stdin (never an argv element, never interpolated into a
/// shell line): argv is world-readable in `ps`, and an interview answer
/// can carry a private product idea.
#[tauri::command]
async fn genesis_send_turn(
    text: String,
    watch: tauri::State<'_, WatchState>,
    agent: tauri::State<'_, AgentState>,
) -> Result<SendOutcome, String> {
    Ok(agent::send_turn(&watch, &agent, text))
}

/// T-025 criterion 3: the mount-time catch-up pull (the `docs_snapshot`
/// precedent), so a pane that mounts late learns where the interview is
/// without replaying events. Synchronous: it reads in-memory state only.
#[tauri::command]
fn genesis_status(agent: tauri::State<'_, AgentState>) -> GenesisStatus {
    agent::status(&agent)
}

/// T-025 criterion 1: kill the current turn's process group. Answers
/// immediately — SIGTERM goes out synchronously and the grace + SIGKILL
/// escalation runs on its own thread, so this never holds the caller.
#[tauri::command]
fn genesis_cancel(agent: tauri::State<'_, AgentState>) -> CancelOutcome {
    agent::cancel(&agent)
}

/// T-029 criterion 1: respawn the RECORDED native session. Zero
/// arguments — the id is read Rust-side out of `.nputer/sessions.json`
/// through its own gate, so no session id ever crosses the boundary in
/// either direction. `async` for the same reason `genesis_start` is.
#[tauri::command]
async fn genesis_resume(
    watch: tauri::State<'_, WatchState>,
    agent: tauri::State<'_, AgentState>,
) -> Result<StartOutcome, String> {
    Ok(agent::resume_genesis(&watch, &agent))
}

/// T-029 criterion 3: continue with a FRESH session when the native one
/// will not resume. Degraded, never dead — the old entry is marked dead
/// and the new kickoff carries the method's resume rule.
#[tauri::command]
async fn genesis_fresh(
    watch: tauri::State<'_, WatchState>,
    agent: tauri::State<'_, AgentState>,
) -> Result<StartOutcome, String> {
    Ok(agent::fresh_genesis(&watch, &agent))
}

/// T-029 criteria 1–2: the chat's rehydration source. Reads the losable
/// `.nputer/genesis/transcript.jsonl`; an empty answer means "render the
/// banked-progress summary instead" and is never an error.
#[tauri::command]
fn genesis_transcript(watch: tauri::State<'_, WatchState>) -> Vec<agent::sessions::TranscriptLine> {
    agent::transcript(&watch)
}

/// T-029 criterion 4: the hand-driven mode's copyable block (ADR-006's
/// manual-interview instrument). Materializes the kit and returns the same
/// assembled prompt the spawn would have used — one text, one source of
/// truth, any model, any CLI.
#[tauri::command]
fn genesis_kickoff(watch: tauri::State<'_, WatchState>) -> agent::KickoffOutcome {
    agent::kickoff(&watch)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // T-001 acceptance: log the resolved project folder on startup.
            // T-007: resolution may legitimately find nothing — say so
            // instead of pretending cwd is a project.
            let project_dir = resolve_project_dir();
            match &project_dir {
                Some(dir) => println!("[nputer] project folder: {}", dir.display()),
                None => println!(
                    "[nputer] project folder: none resolved (no .git from cwd or executable) - pick a folder to open a project"
                ),
            }

            // T-003/T-007: shared seq counter + re-armable watcher thread.
            let seq = Arc::new(AtomicU64::new(0));
            let emit_handle = app.handle().clone();
            let ctl = docs_watch::spawn_watcher_thread(
                seq.clone(),
                project_dir.clone(),
                move |snapshot| {
                    if let Err(err) = emit_handle.emit("docs-changed", snapshot) {
                        eprintln!("[nputer] watch: emit failed: {err}");
                    }
                },
            );
            app.manage(WatchState::new(project_dir, seq, ctl));

            // T-025: the agent runner. Its one event channel is
            // `genesis-turn` (the `docs-changed` precedent); the webview
            // never learns or supplies it.
            //
            // **T-060: the config is now the DEFAULT, with nothing
            // overridden.** It used to carry `config_dir` — the app
            // config dir, which is where the resolved-binary cache lived.
            // That cache is retired, so the runner holds no durable state
            // outside `.nputer/` at all and there is nothing for the
            // shell to hand it. Resolution is a probe or a typed
            // not-found.
            let agent_emit = app.handle().clone();
            let agent_cfg = agent::runner::RunnerConfig::default();
            app.manage(AgentState::new(agent_cfg, move |event| {
                if let Err(err) = agent_emit.emit(agent::GENESIS_EVENT, event) {
                    eprintln!("[nputer] agent: emit failed: {err}");
                }
            }));

            // T-003: the frontend echoes each applied snapshot as a
            // `model-updated` event; logging it (sanitized — the payload
            // summarizes untrusted repo content) makes the full
            // change -> parsed-model round trip observable on stdout,
            // which is how the ≤1s criterion is measured.
            app.listen("model-updated", |event| {
                println!(
                    "[nputer] model-updated: recv_at_ms={} payload={}",
                    docs_watch::now_ms(),
                    docs_watch::sanitize_for_log(event.payload())
                );
            });

            // T-063: THE ONE FAILURE A USER REPORTS IS THE ONE THE LOG
            // COULD NOT DESCRIBE. `recordStartupFailure` ended at a
            // webview `console.error`, and a WKWebView console never
            // reaches this process's stdout — so on 2026-08-16 @human hit
            // a startup dead end, sent a screenshot AND their log, and the
            // log was healthy through seq 22 because the thing that broke
            // had no way to write to it. This listener is that way.
            //
            // stdERR, deliberately, where `model-updated` uses stdout: one
            // is the healthy round trip and the other is a failure, and a
            // reader filtering a long session's log should be able to
            // separate them without parsing.
            app.listen(STARTUP_FAILED_EVENT, |event| {
                eprintln!(
                    "{}",
                    startup_failed_line(event.payload(), docs_watch::now_ms())
                );
            });

            // Startup evidence that the main window actually exists.
            if let Some(window) = app.get_webview_window("main") {
                println!("[nputer] window \"{}\" created", window.label());
            } else {
                eprintln!("[nputer] warning: main window not found at setup");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            docs_snapshot,
            pick_project_folder,
            pick_genesis_folder,
            start_genesis_here,
            index_repo,
            // T-025: four app commands, ZERO new webview grants — app
            // commands are not grants, which is the whole ADR-012 point.
            genesis_start,
            genesis_send_turn,
            genesis_status,
            genesis_cancel,
            genesis_resume,
            genesis_fresh,
            genesis_transcript,
            genesis_kickoff
        ])
        // T-025 criterion 1 ("child processes SHALL not outlive the
        // app"): `.build(...).run(|app, event| ...)` instead of
        // `.run(context)`, so the exit paths the app controls reap the
        // turn's process group. A SIGKILL of the app itself cannot run
        // cleanup; that orphan is bounded to one turn by the
        // spawn-per-turn topology, and `AgentState::drop` covers the
        // ordinary teardown.
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if matches!(
                event,
                tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit
            ) {
                app.state::<AgentState>().reap_for_exit();
            }
        });
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn git_walk_up_finds_the_first_repo_root_from_a_nested_dir() {
        let base = env::temp_dir().join(format!(
            "nputer-t007-walkup-{}-{}",
            std::process::id(),
            docs_watch::now_ms()
        ));
        let repo = base.join("repo");
        let nested = repo.join("app/src-tauri");
        fs::create_dir_all(&nested).expect("mkdirs");
        // A .git FILE, as git worktrees create — must count as a repo.
        fs::write(repo.join(".git"), "gitdir: elsewhere").expect("git file");

        assert_eq!(git_walk_up(&nested), Some(repo.clone()));
        assert_eq!(git_walk_up(&repo), Some(repo.clone()));
        let _ = fs::remove_dir_all(&base);
    }

    // ---- T-063: the startup-failed log line ----------------------------

    /// The payload the frontend really sends, built the way `serde_json`
    /// would render `{step, message, attempt}` — a JSON object with the
    /// message already JSON-escaped. Only `message` is hostile; the other
    /// two fields are a closed set and a number.
    fn payload(step: &str, message: &str, attempt: u32) -> String {
        format!(
            "{{\"step\":\"{step}\",\"message\":{},\"attempt\":{attempt}}}",
            serde_json::to_string(message).expect("a string always serializes")
        )
    }

    #[test]
    fn startup_failed_line_is_prefixed_stamped_and_carries_the_payload() {
        let line = startup_failed_line(
            &payload("subscribe", "listen: the event channel refused", 1),
            1_700_000_000_123,
        );
        // The shape a log reader greps for, and the same shape
        // `model-updated` uses one listener up.
        assert!(line.starts_with("[nputer] startup-failed: recv_at_ms=1700000000123 payload="));
        assert!(line.contains("\"step\":\"subscribe\""));
        assert!(line.contains("the event channel refused"));
        assert!(line.contains("\"attempt\":1"));
        // One line, always: a multi-line log entry is a log entry that
        // can be forged by whatever wrote the message.
        assert_eq!(line.lines().count(), 1);
    }

    /// T-063's MANDATORY sanitise, driven with T-050's own hostile string:
    /// a NUL + BEL + ESC run and 10 000 characters, which is what the
    /// verification of the DOM sink put through it. The DOM renders that
    /// safely; a terminal would not.
    ///
    /// ONE THING MEASURED HERE THAT THE CARD DOES NOT SAY, and it changes
    /// which half of the sanitise is load-bearing on the live path: by the
    /// time a payload reaches this function it has been through JSON, and
    /// JSON strings cannot carry raw control bytes — the frontend's
    /// serializer has already turned the ESC into the six ASCII characters
    /// `\u001b`. So on the live path the CAP is what the sanitise adds,
    /// and the escaping is defence in depth. That is worth having anyway:
    /// this function's argument is a `&str` and nothing in its type says a
    /// serializer stands in front of it — see the test below, which passes
    /// raw control bytes straight in.
    #[test]
    fn startup_failed_line_survives_a_10k_hostile_message_from_the_boundary() {
        let hostile = format!("\u{0}\u{7}\u{1b}[31m{}", "A".repeat(10_000));
        let line = startup_failed_line(&payload("snapshot", &hostile, 4), 7);

        // NOT ONE RAW CONTROL BYTE reaches the terminal — asserted over
        // the whole line rather than over the three characters we happen
        // to have thought of.
        assert!(
            !line.chars().any(char::is_control),
            "a raw control character survived into the log line"
        );
        // The escape survives as EVIDENCE rather than being dropped: an
        // absent ESC is a lie about what the boundary sent. JSON wrote
        // `\u001b` as six ASCII characters, none of them control, so
        // `sanitize_for_log` passes them straight through.
        assert!(
            line.contains("\\u001b[31m"),
            "the escaped ESC is not legible in the line: {line}"
        );
        // The 10 000 characters are capped, and the cap SAYS SO.
        assert!(line.ends_with("…(truncated)"));
        assert!(
            line.chars().count() < 1_000,
            "10 000 characters reached the terminal unclipped: {} chars",
            line.chars().count()
        );
    }

    /// The same hostile run with NO serializer in front of it — raw NUL,
    /// BEL and ESC bytes handed straight to the line builder. This is the
    /// card's claim taken literally ("the message is an arbitrary string
    /// from the boundary"), and it is the test that would still hold if
    /// the payload ever stopped being JSON.
    #[test]
    fn startup_failed_line_escapes_raw_control_bytes_too() {
        let raw = "{\"step\":\"subscribe\",\"message\":\"\u{0}\u{7}\u{1b}[31mred\",\"attempt\":1}";
        let line = startup_failed_line(raw, 3);
        assert!(
            !line.chars().any(char::is_control),
            "a raw control character survived into the log line"
        );
        assert!(line.contains("\\u{1b}[31mred"), "{line}");
        assert!(line.contains("\\u{0}\\u{7}"), "{line}");
        assert_eq!(line.lines().count(), 1);
    }

    /// The evidence a diagnosis needs, and the whole of what is discarded
    /// today: four attempts are four DISTINCT lines carrying four attempt
    /// numbers. The frontend half of this proof (four presses really do
    /// emit four payloads, numbered 1..4) is in
    /// `app/test/startup-recovery.test.ts`; this is the half that turns
    /// each payload into a log line.
    #[test]
    fn four_attempts_are_four_distinct_lines_with_four_attempt_numbers() {
        let lines: Vec<String> = (1..=4)
            .map(|n| startup_failed_line(&payload("subscribe", "refused", n), 1_000 + n as u64))
            .collect();
        for (i, line) in lines.iter().enumerate() {
            assert!(
                line.contains(&format!("\"attempt\":{}", i + 1)),
                "line {i} does not carry attempt {}: {line}",
                i + 1
            );
        }
        let unique: std::collections::BTreeSet<&String> = lines.iter().collect();
        assert_eq!(unique.len(), 4, "four attempts must not collapse into one line");
    }

    /// A deadline is a THIRD failure the log has to be able to describe —
    /// and the one that was previously indistinguishable from "still
    /// waiting", because the latch made "Try again" a no-op while an
    /// attempt was in flight. Nothing in the line builder is
    /// step-specific; this pins that it stays that way.
    #[test]
    fn the_deadline_step_reaches_the_log_like_any_other() {
        let line = startup_failed_line(
            &payload("deadline", "no answer from the docs watcher within 8000 ms", 2),
            9,
        );
        assert!(line.contains("\"step\":\"deadline\""));
        assert!(line.contains("within 8000 ms"));
    }

    #[test]
    fn git_walk_up_returns_none_without_a_repo() {
        let base = env::temp_dir().join(format!(
            "nputer-t007-norepo-{}-{}",
            std::process::id(),
            docs_watch::now_ms()
        ));
        let nested = base.join("plain/folder");
        fs::create_dir_all(&nested).expect("mkdirs");
        // Walking up from a repo-less temp tree must not invent a root.
        // (If the machine's temp dir itself sits inside a repo this would
        // find it — system temp dirs do not.)
        assert_eq!(git_walk_up(&nested), None);
        let _ = fs::remove_dir_all(&base);
    }
}
