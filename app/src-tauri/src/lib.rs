use std::env;
use std::path::PathBuf;
use tauri::Manager;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // T-001 acceptance: log the resolved project folder on startup.
            let project_dir = resolve_project_dir();
            println!("[nputer] project folder: {}", project_dir.display());

            // Startup evidence that the main window actually exists.
            if let Some(window) = app.get_webview_window("main") {
                println!("[nputer] window \"{}\" created", window.label());
            } else {
                eprintln!("[nputer] warning: main window not found at setup");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
