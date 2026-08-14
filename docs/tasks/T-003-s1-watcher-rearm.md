---
title: Watcher does not re-arm when docs/ is replaced or appears late
status: suggested
suggested_by: executor claude-fable-5 @T-003
---

The T-003 watcher arms once at startup against `<project>/docs`. Two
edge cases discovered while building it are handled by going idle, not
by recovery: (1) if the project has no `docs/` directory when the app
starts, the watcher logs `watcher idle` and never arms — creating
`docs/` later changes nothing until restart; (2) if `docs/` itself is
deleted and recreated (e.g. `git checkout` of a branch without it, or
tooling that replaces the directory wholesale), the underlying OS watch
handle may go stale — notify does not re-arm on a recreated root, and
in-place edits inside a replaced tree can stop producing events.
Normal file-level operations (create/modify/rename/delete inside
docs/, including whole-subtree changes) are unaffected and covered by
T-003's snapshot-per-batch design.

Suggest: watch the project root non-recursively as a sentinel and
(re)arm the docs/ recursive watch whenever a `docs` entry appears or is
replaced; emit a fresh snapshot on re-arm. Small, self-contained change
inside app/src-tauri/src/docs_watch.rs. Related: T-001-s1 (project-dir
override) — a packaged .app launched from Finder has cwd `/`, resolves
no repo, and hits case (1) immediately, so that suggestion's override
decision is what makes this one matter for packaged builds.
