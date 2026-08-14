---
id: T-001-s1
title: Expose resolved project dir to the frontend (Tauri command/state)
status: suggested
suggested_by: executor claude-fable-5 @T-001
---

T-001 resolves the project folder in Rust (`resolve_project_dir()` in
`app/src-tauri/src/lib.rs`, .git walk-up from cwd) but only logs it to
stdout — nothing consumes it yet. T-003 (watcher/live reload) will need
that same path to know which repo to watch, and the frontend will need it
to display/confirm which project is open. Suggest promoting the resolved
path to Tauri managed state plus a small `get_project_dir` command (and
deciding then whether an explicit override — CLI arg or env var — is
wanted for opening a project other than the repo the app lives in, which
the packaged .app will need since its cwd is `/`). One decision, three
lines of plumbing, saves T-003 re-deriving it.
