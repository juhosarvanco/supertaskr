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
/// T-013 (C-12's data, C-05's registration): the map's churn surface —
/// the app's SECOND subprocess, and the only one that reads a
/// stranger's repository. `pub` for the same reason `docs_watch` is:
/// the seam is driven directly by tests. src/churn.rs states the four
/// properties its argv, its environment and its output parser hold.
pub mod churn;
/// T-126 (C-15's data, C-05's registration): the dispatch surface's Rust
/// half — the lane reader T-110 built, verified three times, and merged
/// into nothing.
///
/// **THIS ONE LINE IS THE WHOLE OF WHY THIS CARD EXISTS.** `rustc`
/// compiles no file that no module declares, so from T-110's merge until
/// this commit `app/src-tauri/src/dispatch/**` reached a compiler only
/// through `app/src-tauri/tests/dispatch_lanes.rs`, a two-line `#[path]`
/// shim compiled as part of a TEST target. Measured at `41900d6` in a
/// detached scratch worktree with its own target dir: a planted type
/// error in `dispatch/lanes.rs` left `cargo build` at exit **0** with
/// zero errors and "Finished `dev` profile", while
/// `cargo check --test dispatch_lanes` over the same mutated byte exited
/// **101** with `error[E0308]: mismatched types`. The suite proved the
/// code worked and proved nothing about the app containing it.
///
/// **THE FENCE, RECORDED SO THE ROUTING IS NOT READ AS AN OVERSIGHT.**
/// T-110's `touches:` was `[app-dispatch]`; this line lives in C-05's
/// `app-shell`, held by a live lane at all three of that card's
/// dispatches. Its executors routed the wiring rather than widening —
/// the right call three times over. The defect was never the routing; it
/// was that the routing had nowhere to land until `app-shell` came free.
///
/// `pub` for the reason `docs_watch` and `churn` are, plus one this
/// module adds: `join.rs`'s surface has no non-test caller yet, so a
/// PRIVATE module would make every one of its `pub` items dead code and
/// the declaration that ends the silence would arrive wearing a warning
/// per item.
pub mod dispatch;
/// T-140-s1 (C-12's data, C-05's registration): the map's own channel —
/// the component rollup at rest and file-level detail on a pull, so the
/// pane stops needing a payload that is linear in file count. `pub` for
/// the reason `docs_watch` and `churn` are: the seam is driven directly
/// by tests, and `arch_cmd.rs` states the containment argument its one
/// argument rests on.
pub mod arch_cmd;
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
use arch_cmd::{DetailOutcome, RollupOutcome};
use churn::{ChurnDisabled, ChurnOutcome};
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

/// Resolve the project folder this supertaskr instance opens at launch.
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
        "[supertaskr] startup-failed: recv_at_ms={recv_at_ms} payload={}",
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
        .set_title("Open an supertaskr project folder")
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

/// T-140-s1: THE SIXTEENTH COMMAND — the map's resting payload.
///
/// **ZERO ARGUMENTS, the `index_repo`/`repo_churn`/`dispatch_lanes`
/// pattern.** The project root comes from `WatchState`, the graph's
/// location is a `&'static` relative path inside the crate, and what
/// comes back is a picture whose size is a function of the REGISTRY
/// rather than of the tree. No webview grant moves — an app command is
/// not a grant, which is the whole ADR-012 point, so `acl_pin.rs`'s
/// 92-grant `core:default` set is a 0-line diff across this card.
///
/// **WHY IT EXISTS RATHER THAN RIDING THE DOCS WATCHER.** T-140 ruled at
/// `MAX_FILE_BYTES`'s own definition site that the graph LEAVES that
/// pipeline: a broadcast of the whole docs tree cannot express "detail
/// for what is on screen" at any cap, and the cap it would need is
/// against a driver that is linear in file count. `arch_cmd.rs` carries
/// the rest of the argument.
///
/// Reading and parsing a graph is blocking fs + serde work, so it goes
/// through `spawn_blocking` like `index_repo`.
#[tauri::command]
async fn arch_rollup(app: tauri::AppHandle) -> RollupOutcome {
    let handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let state = handle.state::<WatchState>();
        arch_cmd::run_rollup(&state)
    })
    .await
    .unwrap_or_else(|err| RollupOutcome::Unreadable {
        message: format!("rollup task failed: {err}"),
    })
}

/// T-140-s1: THE SEVENTEENTH COMMAND — file-level detail for ONE thing
/// the user opened.
///
/// **THE FIRST MAP COMMAND THAT TAKES AN ARGUMENT, AND THE ARGUMENT IS
/// NOT A PATH.** `target` is a KEY into the document this command has
/// just read — `c:<component-id>` or `f:<graph file id>` — looked up by
/// equality against ids the process already holds. Nothing joins it onto
/// the project root, opens it, or hands it to the filesystem, so a
/// traversal string is a MISS rather than a traversal (pinned by name in
/// `rollup::tests` and again in `arch_cmd::tests`). That is ADR-010's
/// containment kept while still letting the pane say WHICH thing is on
/// screen, which is the one fact a zero-argument command cannot carry
/// and the whole reason T-140 routed this as a channel.
///
/// The argument is length-bounded before it is looked up, because a miss
/// ECHOES the target back so the pane can say what it could not serve.
#[tauri::command]
async fn arch_detail(app: tauri::AppHandle, target: String) -> DetailOutcome {
    if !arch_cmd::target_within_bounds(&target) {
        // Refused without the echo: the answer is still the typed
        // refusal, so the pane's handling is one path rather than two.
        return DetailOutcome::Answered {
            detail: supertaskr_index::rollup::Detail::Unknown {
                target: String::new(),
            },
        };
    }
    let handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let state = handle.state::<WatchState>();
        arch_cmd::run_detail(&state, &target)
    })
    .await
    .unwrap_or_else(|err| DetailOutcome::Unreadable {
        message: format!("detail task failed: {err}"),
    })
}

/// T-013: the map's churn overlay data — commits per path over the last
/// 30 days, read by shelling out to `git` (ADR-013 / map plan §0.0-6).
///
/// **THE FOURTEENTH COMMAND, AND THE FIRST SINCE T-029.** It is
/// ADR-012 APPLIED rather than reopened: ZERO ARGUMENTS (the project
/// root comes from `WatchState`, never from the webview), a typed
/// outcome out, and NO new webview grant — app commands are un-gated by
/// the ACL, which is the whole ADR-012 point, so `acl_pin.rs` stays a
/// 0-file diff at its 92-grant `core:default` set. What is genuinely
/// new is a SUBPROCESS, and the narrowness that ADR-012 says lives in
/// the command's own signature lives here in `churn.rs`'s argv: every
/// element is a `&'static str`, the project path is the child's working
/// directory and appears in no argument, and nothing git prints can
/// reach the webview — the outcome has no message field to carry it.
///
/// Why not ride `index_repo`, the surface that already exists: churn
/// must be available WITHOUT re-indexing (an overlay the user cannot
/// see until they rewrite a committed file is not an overlay), and
/// selecting an overlay must never write `graph.json`. The two are also
/// different clocks — the graph is a function of the TREE, churn of the
/// HISTORY — so `index --check` would go stale on every commit if churn
/// rode the committed payload (ADR-014 forbids exactly that).
#[tauri::command]
async fn repo_churn(app: tauri::AppHandle) -> ChurnOutcome {
    // Spawning and draining a child is blocking work; keep it off the
    // async runtime's core threads (the T-007 spawn_blocking pattern).
    let handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let state = handle.state::<WatchState>();
        churn::run_churn(&state)
    })
    .await
    .unwrap_or_else(|err| {
        // The join error is a detail for the app's log, never for a
        // canvas — the outcome carries a typed reason and nothing else.
        eprintln!("[supertaskr] churn: task failed: {}", docs_watch::sanitize_for_log(&err.to_string()));
        ChurnOutcome::disabled(ChurnDisabled::GitFailed)
    })
}

/// T-126: what the lane reader had to say, plus the one fact it cannot
/// express about itself.
///
/// [`dispatch::lanes::LaneScan`] answers five ways about a FOLDER, and
/// every one of them presumes there is a folder. "No project is open" is
/// a fact about the APP, so it is named here rather than smuggled in as
/// a sixth kind of empty — the `ChurnDisabled::NoProject` precedent, and
/// the same argument `LaneScan`'s own header makes: no two of these are
/// the same empty list, and a board that renders one string for two of
/// them can report neither.
///
/// It is declared HERE and not in `dispatch/` because that is C-15's
/// path and this lane's fence is `[app-shell]`. The consequence is
/// disclosed rather than hidden: `app/src/lib/dispatch-store.ts` (C-15)
/// mirrors `LaneScan` and does NOT yet mirror this wrapper, which is
/// `T-126-s1`.
#[derive(Clone, Debug, PartialEq, Eq, serde::Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
enum DispatchLanesOutcome {
    /// Nothing resolved at launch and nothing picked.
    NoProject,
    /// The reader ran over the open project. Everything it is able to
    /// say — including its own four refusals — is inside `scan`.
    Answered { scan: dispatch::lanes::LaneScan },
}

/// The seam [`dispatch_lanes`] is a one-line wrapper over: everything
/// the command does once `WatchState` has been asked which project is
/// open.
///
/// The `churn::churn_at` precedent, and it exists for the same reason: a
/// `tauri::State` cannot be constructed in a unit test, so a command
/// whose whole body reads state is a command nothing can drive. The
/// decision lives where a test can reach it.
fn dispatch_lanes_at(project_root: Option<&Path>) -> DispatchLanesOutcome {
    match project_root {
        None => DispatchLanesOutcome::NoProject,
        Some(root) => DispatchLanesOutcome::Answered {
            scan: dispatch::lanes::read_lanes(root),
        },
    }
}

/// T-126: THE FIFTEENTH COMMAND, and F-04's first.
///
/// **ZERO ARGUMENTS, AND THAT IS ADR-012 APPLIED RATHER THAN CITED.**
/// The project root comes from `WatchState` — the same source
/// `repo_churn` and `index_repo` read — so no path, no branch name and
/// no task id crosses the boundary inbound. `tauri::State` is an
/// extractor Tauri fills in, not a caller-supplied datum: the webview's
/// whole call is `invoke("dispatch_lanes")`. And an app command is not a
/// webview grant, so `acl_pin.rs` is a 0-file diff at the same 92-grant
/// `core:default` set (ADR-012, applied rather than reopened).
///
/// **SYNCHRONOUS, WHERE ITS TWO NEAREST SIBLINGS ARE NOT, AND THE
/// DIFFERENCE IS THE WORK.** `repo_churn` spawns a subprocess and
/// `index_repo` parses a tree, so both go through `spawn_blocking`.
/// This reads one directory listing plus two files per entry, each
/// bounded by `MAX_METADATA_BYTES` (4 KiB) with the listing bounded by
/// `MAX_WORKTREE_ENTRIES` — strictly less work than `docs_snapshot`,
/// which walks the whole of docs/ on this same thread and has since
/// T-003.
///
/// **WHAT IT DELIBERATELY DOES NOT DO IS JOIN.**
/// `dispatch::join::join_lanes` needs the board's stamps, and the board
/// is parsed in TypeScript — so a joining command would have to take
/// them as an argument, which is the one thing this criterion forbids.
/// The reader is what the card asks to be reachable; the join stays
/// reachable to Rust callers and is `T-126-s2`.
#[tauri::command]
fn dispatch_lanes(state: tauri::State<'_, WatchState>) -> DispatchLanesOutcome {
    dispatch_lanes_at(state.project_dir().as_deref())
}

/// T-112-s1: what the brief assembler had to say, plus the one fact it
/// cannot express about itself.
///
/// **THE `DispatchLanesOutcome` SHAPE, DELIBERATELY.**
/// [`dispatch::brief::BriefOutcome`] answers five ways about a PROJECT,
/// and every one of them presumes there is a project. "No project is open"
/// is a fact about the APP, so it is named here rather than smuggled in as
/// a sixth kind of refusal — folding it into `NoSuchCard` would tell a
/// user with no project open that their card does not exist.
///
/// **AND THE TS MIRROR MOVES IN THIS COMMIT, WHICH IS `T-126-s1`'s WHOLE
/// FINDING APPLIED RATHER THAN REPEATED.** That card exists because
/// `DispatchLanesOutcome` added exactly this wrapper and
/// `app/src/lib/dispatch-store.ts` was outside the fence that added it, so
/// the mirror never learned about it. This lane holds both `app-shell` and
/// `app-dispatch`, so `DispatchBriefWire` is written beside this enum
/// instead of being routed.
#[derive(Clone, Debug, PartialEq, Eq, serde::Serialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
enum DispatchBriefOutcome {
    /// Nothing resolved at launch and nothing picked.
    NoProject,
    /// The assembler ran over the open project. Everything it is able to
    /// say — including its own four refusals — is inside `outcome`.
    Answered { outcome: dispatch::brief::BriefOutcome },
}

/// The seam [`dispatch_brief`] is a wrapper over: everything the command
/// does once `WatchState` has been asked which project is open.
///
/// The [`dispatch_lanes_at`] precedent, and it exists for the same reason:
/// a `tauri::State` cannot be constructed in a unit test, so a command
/// whose whole body reads state is a command nothing can drive.
fn dispatch_brief_at(
    project_root: Option<&Path>,
    task_id: &str,
    role: dispatch::brief::Role,
) -> DispatchBriefOutcome {
    // T-112-s1's VERDICT, correction 1: this guard lived in the async
    // command, which takes a `tauri::AppHandle` and therefore cannot be
    // driven by a unit test — so the blind verifier's mutant turning it
    // into `if false` SURVIVED the whole cargo suite. A bound that nothing
    // can poison is a bound nothing keeps. It sits on the seam now, ahead
    // of the project read, because an over-long id is refused whether or
    // not a project is open — the behaviour the command already had.
    if !dispatch::brief::task_id_within_bounds(task_id) {
        return DispatchBriefOutcome::Answered {
            outcome: dispatch::brief::BriefOutcome::NoSuchCard {
                task_id: String::new(),
            },
        };
    }
    match project_root {
        None => DispatchBriefOutcome::NoProject,
        Some(root) => DispatchBriefOutcome::Answered {
            outcome: dispatch::brief::brief_for_card(root, task_id, role),
        },
    }
}

/// T-112-s1: THE EIGHTEENTH COMMAND — **a card hands you its brief.**
///
/// The assembler has been built, proved and compiled into this binary
/// since T-112; what was missing was this line. Its module header says so
/// in as many words: registration is `app/src-tauri/src/lib.rs`, which is
/// C-05's `app-shell`, and T-112's `[app-dispatch, app-board]` fence did
/// not reach it. This is the same disposition `lanes.rs` took at T-110 and
/// `T-126` discharged, one card later.
///
/// **TWO ARGUMENTS, AND NEITHER OF THEM IS A PATH** (ADR-012's
/// *narrowness lives in the command's own signature*). The project root
/// comes from `WatchState` — the source `dispatch_lanes`, `repo_churn` and
/// `index_repo` all read — so no path crosses inbound and none goes back:
/// the outcome carries repository-RELATIVE sources, which is what the
/// assembler emits either way.
///
/// `task_id` is a KEY into the directory listing this command has just
/// taken, matched by equality against names `docs/tasks` handed over —
/// the `arch_detail` shape. Nothing joins it onto the project root, opens
/// it, or hands it to the filesystem, so a traversal string is a MISS
/// rather than a traversal. It is length-bounded BEFORE it is looked up,
/// because a miss ECHOES the id back so the caller can say what it could
/// not serve.
///
/// `role` is a closed enum rather than a string, so serde refuses a third
/// spelling before any file is read.
///
/// **ZERO NEW WEBVIEW GRANTS.** An app command is not a grant, which is
/// the whole ADR-012 point, so `acl_pin.rs` is a 0-file diff at the same
/// `core:default` set — re-derived at this lane's own ref rather than
/// quoted, and recorded on the card.
///
/// Reading a directory, a card, the contract and the project's own
/// governing documents is blocking fs work, so it goes through
/// `spawn_blocking` like `arch_detail` and `index_repo` rather than
/// holding Tauri's main thread.
#[tauri::command]
async fn dispatch_brief(
    app: tauri::AppHandle,
    task_id: String,
    role: dispatch::brief::Role,
) -> DispatchBriefOutcome {
    // The bound is enforced on the seam (`dispatch_brief_at`), where a
    // test can reach it — T-112-s1's verdict, correction 1. Refused
    // without the echo, and still as the assembler's own typed answer, so
    // the caller's handling stays one path rather than two.
    let handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let state = handle.state::<WatchState>();
        dispatch_brief_at(state.project_dir().as_deref(), &task_id, role)
    })
    .await
    .unwrap_or_else(|err| {
        // A join failure is not "no project" and not "no card": it is the
        // assembler never having run. The contract it could not read is
        // the honest name for that, and it carries the source and the
        // reason — sanitised, because it reaches the app's own log family
        // the same way `repo_churn`'s does.
        DispatchBriefOutcome::Answered {
            outcome: dispatch::brief::BriefOutcome::ContractMissing {
                source: dispatch::brief::CONTRACT_FILE.to_string(),
                because: dispatch::brief::SourceMiss::Unreadable {
                    because: format!(
                        "the brief task failed: {}",
                        docs_watch::sanitize_for_log(&err.to_string())
                    ),
                },
            },
        }
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
/// arguments — the id is read Rust-side out of `.supertaskr/sessions.json`
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
/// `.supertaskr/genesis/transcript.jsonl`; an empty answer means "render the
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
                Some(dir) => println!("[supertaskr] project folder: {}", dir.display()),
                None => println!(
                    "[supertaskr] project folder: none resolved (no .git from cwd or executable) - pick a folder to open a project"
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
                        eprintln!("[supertaskr] watch: emit failed: {err}");
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
            // outside `.supertaskr/` at all and there is nothing for the
            // shell to hand it. Resolution is a probe or a typed
            // not-found.
            let agent_emit = app.handle().clone();
            let agent_cfg = agent::runner::RunnerConfig::default();
            app.manage(AgentState::new(agent_cfg, move |event| {
                if let Err(err) = agent_emit.emit(agent::GENESIS_EVENT, event) {
                    eprintln!("[supertaskr] agent: emit failed: {err}");
                }
            }));

            // T-003: the frontend echoes each applied snapshot as a
            // `model-updated` event; logging it (sanitized — the payload
            // summarizes untrusted repo content) makes the full
            // change -> parsed-model round trip observable on stdout,
            // which is how the ≤1s criterion is measured.
            app.listen("model-updated", |event| {
                println!(
                    "[supertaskr] model-updated: recv_at_ms={} payload={}",
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
                println!("[supertaskr] window \"{}\" created", window.label());
            } else {
                eprintln!("[supertaskr] warning: main window not found at setup");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            docs_snapshot,
            pick_project_folder,
            pick_genesis_folder,
            start_genesis_here,
            index_repo,
            // T-013: the fourteenth. A SUBPROCESS surface, still zero
            // arguments and still zero grants (see repo_churn above).
            repo_churn,
            // T-140-s1: the sixteenth and seventeenth — the map's own
            // channel. `arch_rollup` is zero-argument like every command
            // above it; `arch_detail` is the FIRST to take one, and its
            // argument is a key into a document rather than a path (the
            // containment argument is on the command and in
            // arch_cmd.rs). Zero new webview grants either way.
            arch_rollup,
            arch_detail,
            // T-126: the fifteenth, and F-04's first. Registered in the
            // SAME commit that declares `pub mod dispatch;` — a module
            // the binary compiles but the webview cannot reach is half
            // the defect this card fixes. Zero arguments (the project
            // root is `WatchState`'s) and zero grants; see the doc
            // comment on `dispatch_lanes` above.
            dispatch_lanes,
            // T-112-s1: THE EIGHTEENTH — the brief assembler's one door.
            // Built, proved and compiled into this binary since T-112;
            // this line is the whole of what T-112's fence could not
            // reach. Two arguments, neither a path (a key into a listing
            // this command just took, and a closed role enum), and zero
            // new grants.
            dispatch_brief,
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
        //
        // **THE CLAIM AT ITS REAL WIDTH, AND IT IS LIVE HERE TOO**
        // (T-043, absorbing T-025-s5): no orphaned descendant THAT STAYS
        // IN THE GROUP. `killpg` reaches the CLI and every tool
        // subprocess it forked; a descendant that calls `setsid()` leaves
        // the group and survives — measured by the T-025 verifier as
        // `child_alive=false escapee_alive=true child_pid=72417
        // escapee_pid=72418 escapee_pgid=72418`. A descendant sweep stays
        // a deliberate NON-GOAL: the selected CLI can create a new
        // session and ancestry is undiscoverable after reparenting. What
        // bounds the exposure is narrower and true — no Bash pattern the
        // planner is granted intentionally daemonizes.
        //
        // T-043 also made this hook CHEAP in the ordinary case. It blocks
        // the thread that quits the app, and it holds no `Child`, so it
        // used to poll `kill(pid, 0)` — true for a zombie — and pay the
        // whole five-second grace even when the CLI had already gone. It
        // now reads the reap the turn worker publishes on the shared
        // `ChildHandle` and lets go in milliseconds, while a resistant
        // same-group descendant still costs the full grace and still gets
        // SIGKILLed. See `AgentState::reap_for_exit`.
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
            "supertaskr-t007-walkup-{}-{}",
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
        assert!(line.starts_with("[supertaskr] startup-failed: recv_at_ms=1700000000123 payload="));
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
            "supertaskr-t007-norepo-{}-{}",
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

    // ---- T-126: the lane reader's one door -----------------------------
    //
    // NEITHER BODY READS THIS REPOSITORY'S OWN `.git`, and that is the
    // card's criterion rather than a preference: six lane worktrees and a
    // drill were live on this machine while these were written, appearing
    // and disappearing, so a body asserting against the live worktree
    // list is non-deterministic by construction. Both drive
    // `dispatch::fixtures`, the temp-directory tree C-15's own bodies use
    // — one definition of what git writes, not two.

    /// **THE TWO EMPTIES ARE DIFFERENT FACTS.**
    ///
    /// `NoProject` is a fact about the APP and every `LaneScan` refusal
    /// is a fact about a FOLDER, so a wrapper that collapsed them would
    /// tell a user with no project open that their project is not a git
    /// repository. The assertion that this is refused needs its POSITIVE
    /// CONTROL beside it (docs/CONVENTIONS.md's rule): the second half
    /// proves a real directory DOES reach the reader, so `NoProject`
    /// cannot be satisfied by "the seam never calls anything".
    #[test]
    fn no_open_project_is_its_own_outcome_and_never_a_folder_refusal() {
        assert_eq!(dispatch_lanes_at(None), DispatchLanesOutcome::NoProject);

        // The control: a real directory, built the way the producer's own
        // fixtures build one, reaches the reader and comes back as the
        // reader's own answer about a folder.
        let root = dispatch::fixtures::scratch("t126-no-project-control");
        assert_eq!(
            dispatch_lanes_at(Some(&root)),
            DispatchLanesOutcome::Answered {
                scan: dispatch::lanes::LaneScan::NotAGitRepository
            },
            "an open folder with no .git must reach the READER's refusal, not the app's"
        );
        let _ = fs::remove_dir_all(&root);
    }

    /// The seam really reaches the reader, and what comes back is the
    /// lane git wrote down — id, branch and all. A wrapper that returned
    /// a constant empty scan would satisfy the body above and fail this
    /// one, which is the whole reason both exist.
    #[test]
    fn the_command_seam_returns_the_lane_git_wrote_down_under_the_open_project() {
        let root = dispatch::fixtures::repo_with_worktrees_dir("t126-seam");
        dispatch::fixtures::register(
            &root,
            "nputer-T-126",
            &dispatch::fixtures::branch_head("task/T-126-lane-reader-compiled"),
            true,
        );

        let outcome = dispatch_lanes_at(Some(&root));
        let DispatchLanesOutcome::Answered {
            scan: dispatch::lanes::LaneScan::Scanned { entries, truncated },
        } = outcome
        else {
            panic!("expected a scan of the open project, got {outcome:?}");
        };
        assert!(!truncated, "one registered worktree is not a truncated answer");
        assert_eq!(entries.len(), 1);
        let dispatch::lanes::WorktreeEntry::Lane {
            task_id,
            branch,
            exists_on_disk,
            ..
        } = &entries[0]
        else {
            panic!("expected a lane, got {:?}", entries[0]);
        };
        assert_eq!(task_id, "T-126");
        assert_eq!(branch, "task/T-126-lane-reader-compiled");
        assert!(exists_on_disk);

        let _ = fs::remove_dir_all(&root);
    }

    // ---- T-112-s1: the brief assembler's one door ----------------------
    //
    // NEITHER BODY READS THIS REPOSITORY'S OWN `.git`, for the reason the
    // T-126 pair above gives and one this pair adds: this checkout is a
    // worktree, so its `.git` is a FILE and the live lane reader answers
    // `GitIsAFile` here and `Scanned` in the integration checkout. A body
    // that read it would pass in one checkout and not in the other. Both
    // drive `dispatch::fixtures`, the temp-directory tree C-15's own
    // bodies use.

    /// The four method and docs sources the assembler reads, copied out of
    /// this repository into a fixture so the fixture's brief is assembled
    /// from the SAME documents a real dispatch would use.
    ///
    /// `brief.rs`'s own end-to-end body copies this set; the verifier role
    /// file is the one addition, and it is what makes the role argument
    /// observable rather than assumed.
    fn plant_the_brief_sources(root: &Path) {
        let here = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .join("..")
            .canonicalize()
            .expect("the repository root is two directories above app/src-tauri");
        for rel in [
            "CLAUDE.md",
            "docs/CONVENTIONS.md",
            "method/roles/executor.md",
            "method/roles/verifier.md",
            "method/lane-protocol.md",
            "method/tasks/TASK-FORMAT.md",
        ] {
            let dest = root.join(rel);
            fs::create_dir_all(dest.parent().expect("a parent")).expect("dirs");
            fs::copy(here.join(rel), &dest).expect("copy a source");
        }
        // Row 5 expands the card's `touches:` through the live component
        // registry, so the registry travels with the fixture — the same
        // set `brief.rs`'s own end-to-end body plants.
        let components = root.join("docs/architecture/components");
        fs::create_dir_all(&components).expect("dirs");
        for entry in fs::read_dir(here.join("docs/architecture/components")).expect("components") {
            let entry = entry.expect("a component file");
            fs::copy(entry.path(), components.join(entry.file_name())).expect("copy");
        }
    }

    /// Write one card onto a fixture project's board.
    fn plant_a_card(root: &Path, id: &str) {
        let tasks = root.join("docs").join("tasks");
        fs::create_dir_all(&tasks).expect("docs/tasks");
        fs::write(
            tasks.join(format!("{id}-a-card.md")),
            format!("---\nid: {id}\ntitle: A card\nsize: M\nstatus: building\ntouches: [app-dispatch]\n---\n"),
        )
        .expect("the card");
    }

    /// **THE TWO EMPTIES ARE DIFFERENT FACTS**, and this is the
    /// `dispatch_lanes` pair's argument one command over.
    ///
    /// `NoProject` is a fact about the APP; every `BriefOutcome` refusal is
    /// a fact about a PROJECT. A wrapper that collapsed them would tell a
    /// user with no project open that their card does not exist. The
    /// assertion that this is refused needs its POSITIVE CONTROL beside it
    /// (docs/CONVENTIONS.md's rule): the second half proves a real
    /// directory DOES reach the assembler, so `NoProject` cannot be
    /// satisfied by "the seam never calls anything".
    #[test]
    fn no_open_project_is_its_own_outcome_and_never_an_assembler_refusal() {
        assert_eq!(
            dispatch_brief_at(None, "T-112-s1", dispatch::brief::Role::Executor),
            DispatchBriefOutcome::NoProject
        );

        // The control: a real directory, built the way the producer's own
        // fixtures build one, reaches the assembler and comes back as the
        // ASSEMBLER's own answer about a project.
        let root = dispatch::fixtures::scratch("t112s1-no-project-control");
        assert!(
            matches!(
                dispatch_brief_at(Some(&root), "T-112-s1", dispatch::brief::Role::Executor),
                DispatchBriefOutcome::Answered { .. }
            ),
            "an open folder must reach the ASSEMBLER's refusal, not the app's"
        );
        let _ = fs::remove_dir_all(&root);
    }

    /// **AN OVER-LONG TASK ID IS REFUSED WITHOUT ECHOING ITSELF, AND THE
    /// BOUND IS ON THE SIDE A TEST CAN REACH** (T-112-s1's verdict,
    /// correction 1). The verifier's mutant turned the guard into
    /// `if false` and the whole cargo suite stayed green, because the
    /// guard sat in the async command where no unit test can drive it.
    /// The POSITIVE CONTROL is the second half: an id one byte inside the
    /// bound reaches the assembler and comes back echoing itself, so this
    /// body cannot be satisfied by a seam that refuses everything.
    #[test]
    fn an_over_long_task_id_is_refused_on_the_seam_and_never_echoed_back() {
        let root = dispatch::fixtures::scratch("t112s1-bound");
        let over = "T-".to_string() + &"9".repeat(dispatch::brief::MAX_TASK_ID_CHARS);
        assert!(over.chars().count() > dispatch::brief::MAX_TASK_ID_CHARS);

        assert_eq!(
            dispatch_brief_at(Some(&root), &over, dispatch::brief::Role::Executor),
            DispatchBriefOutcome::Answered {
                outcome: dispatch::brief::BriefOutcome::NoSuchCard {
                    task_id: String::new()
                }
            },
            "an over-long id must be refused WITHOUT echoing itself back"
        );

        // THE CONTROL: an id inside the bound is not refused by the bound —
        // it reaches the assembler, which answers about the CARD and
        // echoes the id it was given.
        let inside = "T-".to_string() + &"9".repeat(dispatch::brief::MAX_TASK_ID_CHARS - 3);
        assert!(inside.chars().count() <= dispatch::brief::MAX_TASK_ID_CHARS);
        assert_eq!(
            dispatch_brief_at(Some(&root), &inside, dispatch::brief::Role::Executor),
            DispatchBriefOutcome::Answered {
                outcome: dispatch::brief::BriefOutcome::NoSuchCard {
                    task_id: inside.clone()
                }
            },
            "an id inside the bound must reach the assembler and echo"
        );
        let _ = fs::remove_dir_all(&root);
    }

    /// **THE SEAM CARRIES BOTH ARGUMENTS, AND EACH IS PROVED BY THE ANSWER
    /// MOVING WITH IT.** A seam that dropped the task id would answer the
    /// same for a card that is there and one that is not; a seam that
    /// hardcoded the executor would hand a verifier the executor's brief —
    /// which is the leak `verifier.md` forbids, arriving through the one
    /// place no downstream reader can see it.
    #[test]
    fn the_seam_carries_the_task_id_and_the_role_into_the_assembler() {
        let root = dispatch::fixtures::repo_with_worktrees_dir("t112s1-seam");
        plant_a_card(&root, "T-901");
        plant_the_brief_sources(&root);

        // THE TASK ID: an id no card carries is its own answer, and it
        // ECHOES the id the seam was given rather than a constant.
        assert_eq!(
            dispatch_brief_at(Some(&root), "T-902", dispatch::brief::Role::Executor),
            DispatchBriefOutcome::Answered {
                outcome: dispatch::brief::BriefOutcome::NoSuchCard {
                    task_id: "T-902".to_string()
                }
            }
        );

        // THE ROLE: the same card, two roles, two different briefs. The
        // role file follows the argument, and only the verifier's brief
        // carries the marker its half is split at.
        let DispatchBriefOutcome::Answered {
            outcome: dispatch::brief::BriefOutcome::Assembled { brief: executor },
        } = dispatch_brief_at(Some(&root), "T-901", dispatch::brief::Role::Executor)
        else {
            panic!("the executor's brief did not assemble");
        };
        assert_eq!(executor.role, dispatch::brief::Role::Executor);
        assert_eq!(executor.role_file, "method/roles/executor.md");
        assert_eq!(executor.task_id, "T-901");
        assert_eq!(executor.marker, None);

        let DispatchBriefOutcome::Answered {
            outcome: dispatch::brief::BriefOutcome::Assembled { brief: verifier },
        } = dispatch_brief_at(Some(&root), "T-901", dispatch::brief::Role::Verifier)
        else {
            panic!("the verifier's brief did not assemble");
        };
        assert_eq!(verifier.role, dispatch::brief::Role::Verifier);
        assert_eq!(verifier.role_file, "method/roles/verifier.md");
        assert!(
            verifier.marker.is_some(),
            "the verifier's brief lost the line its two halves are split at"
        );

        let _ = fs::remove_dir_all(&root);
    }

    /// The wrapper is a WIRE type, and `T-126-s1` is the record of what it
    /// costs when the TS mirror does not learn about one. This pins the
    /// two spellings `app/src/lib/dispatch-store.ts` mirrors.
    #[test]
    fn the_wrapper_serializes_as_the_tagged_camel_cased_shape_the_ts_mirror_expects() {
        let none = serde_json::to_value(DispatchBriefOutcome::NoProject).expect("serializable");
        assert_eq!(none["kind"], "noProject");

        let answered = serde_json::to_value(DispatchBriefOutcome::Answered {
            outcome: dispatch::brief::BriefOutcome::NoSuchCard {
                task_id: "T-901".to_string(),
            },
        })
        .expect("serializable");
        assert_eq!(answered["kind"], "answered");
        // The assembler's own tag survives the wrapper unchanged: the
        // mirror unwraps one level and reads `BriefOutcomeWire` beneath.
        assert_eq!(answered["outcome"]["kind"], "noSuchCard");
        assert_eq!(answered["outcome"]["taskId"], "T-901");
    }
}
