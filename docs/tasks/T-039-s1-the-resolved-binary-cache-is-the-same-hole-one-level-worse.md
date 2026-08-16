---
id: T-039-s1
title: The resolved-binary cache is the same file-borne hole one level worse — `agent-paths.json` picks the EXECUTABLE and the child's PATH
status: suggested
suggested_by: executor claude-opus-5 @T-039
---

T-039 closed the session id: a value that came off a stream, went into a
file, and came back out as an argv element. The criterion's reasoning
for the READ boundary was that `.nputer/sessions.json` is "a losable
runtime file an attacker or a corruption could reach".

**`agent-paths.json` is the same kind of file, and what it decides is
strictly bigger than one argv element.** It lives in the app config dir
(`app.path().app_config_dir()`, wired at `lib.rs:361`), it is written by
`runner.rs:write_cache` after the login-shell probe, and it is read back
by `runner.rs:read_cache` into two values that are used, unvalidated,
for:

1. **the binary the app executes.** `resolve_cli` step (1) takes
   `entry.path` and, if `is_executable_file(&path)` is true, spawns it —
   first `probe_version(path, ["--version"])`, then
   `Command::new(&cli.path)` for every turn (`runner.rs:843`). The only
   gate is "is this an executable file", never "is this the CLI we
   probed". A poisoned entry is arbitrary code execution as the user,
   inside the project directory, at the moment the user clicks start.
2. **the child's `PATH`.** `entry.login_path` becomes `ResolvedCli
   .login_path` and then the child's `PATH` verbatim
   (`apply_child_env`). The spawned planner's own Bash resolves `git`,
   `cp`, `mkdir` and `git commit` through it — so an attacker who cannot
   touch the binary path can still choose which `git` the agent runs,
   with the six-pattern allowlist happily matching on the COMMAND STRING
   (the gap T-025-s4 already names).

Reachability is the same as T-025-s6's was before T-029: it needs
something already writing files as the user (a sync client restoring an
old profile, a backup, another tool, a compromised process). The
argument T-039's card makes — cheap to close now, expensive to discover
later — applies unchanged.

Not fixed inside T-039 because its fence is the session-id path through
`agent/**`, and because the right answer is a design call rather than a
one-liner. Options, cheapest first:

- **Bound the cache to the probe.** Store a signature alongside the path
  (the `--version` line the probe observed, the binary's mtime/size) and
  re-probe when it does not match. Cheap, keeps the GUI-PATH-poverty fix
  intact.
- **Validate the shape on read**: absolute path, no `..` component, and
  its file name equals `adapter.binary` — a cached `claude` may not be
  called anything else. Cheap and catches the crude version.
- **Do not cache the PATH at all**, or validate each element is
  absolute; the login probe is 10 s once per install, and the PATH is
  the half nothing gates today.

Whatever is chosen, the pin is the same shape as T-039's: craft the file
with a hostile entry, assert the runner refuses it with a typed outcome
rather than spawning.
