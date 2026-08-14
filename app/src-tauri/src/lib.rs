mod docs_watch;

use std::env;
use std::path::PathBuf;
use tauri::{Listener, Manager};

use docs_watch::{DocsSnapshot, WatchState};

/// Resolve the project folder this nputer instance operates on.
///
/// Default (T-001): the repository the app lives in — found by walking up
/// from the process working directory to the first directory containing a
/// `.git` entry (file or directory, so git worktrees count). Falls back to
/// the working directory itself when no repository is found.
fn resolve_project_dir() -> PathBuf {
    let cwd = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let mut dir = cwd.clone();
    loop {
        if dir.join(".git").exists() {
            return dir;
        }
        match dir.parent() {
            Some(parent) => dir = parent.to_path_buf(),
            None => return cwd,
        }
    }
}

/// T-003: the frontend's one pull — the current docs tree as a snapshot.
/// Narrow by construction (ADR-010): no arguments, reads only
/// `<resolved project>/docs`, symlinks skipped, canonical-prefix contained
/// (see docs_watch::collect_docs_files). Subsequent updates arrive as
/// `docs-changed` events pushed by the watcher; both share one seq counter.
#[tauri::command]
fn docs_snapshot(state: tauri::State<'_, WatchState>) -> DocsSnapshot {
    docs_watch::snapshot_now(&state)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // T-001 acceptance: log the resolved project folder on startup.
            let project_dir = resolve_project_dir();
            println!("[nputer] project folder: {}", project_dir.display());

            // T-003: watcher state + docs watcher thread.
            app.manage(WatchState::new(project_dir));
            docs_watch::spawn_watcher(app.handle().clone());

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
        .invoke_handler(tauri::generate_handler![docs_snapshot])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
