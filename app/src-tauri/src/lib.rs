mod docs_watch;
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
            index_repo
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
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
