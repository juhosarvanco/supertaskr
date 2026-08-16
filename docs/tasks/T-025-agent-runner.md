---
id: T-025
title: Agent runner — spawn/resume headless planner turns, Rust-side, zero grants
feature: F-03
milestone: 3
priority: 4
size: L
status: building
blocked_by: [T-021, T-023, T-026]
touches: [app-agent, app-shell, docs/architecture/components/]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review:
---

Size L: planning pass required before dispatch (process topology:
per-turn resume vs long-lived piped process — decide against the
installed claude CLI's verified flags; fake-CLI fixture packaging
portable to Windows; delta-vs-turn streaming granularity). The
milestone's hard core and F-04's future substrate. Implements
ADR-017: the user's own agent CLI, spawned headless with the T-023
kit, the AGENT writing docs/ under its own project-scoped
permissions; the app writes only .nputer/ runtime files. ADR-012
pattern throughout: std::process (argv arrays, never a shell string),
no tauri-plugin-shell, no plugin JS bindings, webview grant set stays
exactly core:default. Declares component C-14-agent-runner (paths
app/src-tauri/src/agent/** + app/src/lib/agent-store.ts, touch slug
app-agent) in-branch. lib.rs command registration is the app-shell
touch — serialize with T-026 at dispatch.

## Acceptance criteria
- THE runner SHALL expose app-defined commands with typed outcomes
  (PickOutcome precedent): genesis_start() — zero-argument; kickoff
  prompt assembled Rust-side from the bundled method snapshot (a
  method snapshot compiled into the binary at build time — an
  include_str! table pinned to method/** by cargo parity tests,
  carrying the method version stamp — and materialized per-genesis
  under .nputer/genesis/kit/ so the spawned CLI reads it inside its
  own project-scoped permissions) plus
  the open project from WatchState, never from the webview;
  genesis_send_turn(text) — the user's own typed answer, the only
  webview-supplied datum, passed as data (stdin or one argv element
  per the adapter template), never interpolated into a shell line;
  genesis_status(); genesis_cancel() — kills the child process
  group; child processes SHALL not outlive the app.
- THE adapter SHALL be a declarative Rust-side table with exactly one
  v1 entry (claude: binary name, spawn/resume argv templates, output
  parse mode, permission flags scoped to the project dir (the CLI's
  own cwd scoping; the materialized kit lives inside it under
  .nputer/genesis/kit/, so no directory grant beyond the project
  exists); never a bypass-permissions flag) — adding an agent is one
  entry (ADR-003), and the table is unreachable from the webview.
- WHEN a turn runs THE runner SHALL emit turn lifecycle events to the
  webview (docs-changed event precedent): started, progress (content
  visible within the planning pass's stated latency bound — no dead
  air), completed with the turn text, or failed with a typed error;
  the CLI's native session id SHALL be captured from the stream and
  recorded in .nputer/sessions.json per
  method/runtime/sessions-schema.md (roles: ["planner"], turns
  incremented), and each exchanged turn appended to
  .nputer/genesis/transcript.jsonl — both runtime files, losable by
  charter, and .nputer/ SHALL remain outside the docs watch root
  (no snapshot spam; asserted in tests).
- THE binary resolution SHALL handle GUI-launch PATH poverty: resolve
  via a login-shell probe once, cache in app config, surface
  not-found as a typed outcome (T-029 renders it as the hand-driven
  fallback, never a dead end).
- THE full cargo suite SHALL drive the runner against a fake agent
  CLI fixture (canned stream output; no real model in any suite):
  spawn/turn/resume round trip, session id capture, transcript
  append, kill-on-cancel (no orphan process), malformed stream
  handling; one env-gated #[ignore] smoke MAY drive a real local CLI.
- IF the spawned CLI exits nonzero, emits unparseable output, or
  stalls past a timeout THEN the runner SHALL emit a typed failure
  for that turn, leave the project untouched, keep the session
  resumable, and never panic.
- IF the webview attempts anything beyond the four commands THEN the
  surface is unchanged: capabilities zero-diff proven per the T-007-s2
  protocol (regenerated gen/schemas/capabilities.json + runtime ACL
  probe; strings proves nothing — CONVENTIONS gotcha). Adapter flag
  changes are swept by the verifier with grant-level suspicion.

Verification: headless — cargo suites vs the fake CLI, ACL proof,
env-hygiene assertion on the spawned child (deliberate inherited env,
explicit PATH augmentation). @human: one real-CLI local smoke run
observed before the milestone closer.

## Implementation plan (size-L planning pass — planner session claude-fable-5, 2026-08-16)

Drafted read-only by the planning session; the architect reviews this section, applies it into docs/tasks/T-025-agent-runner.md, and commits — nothing below is in effect until that commit. Repo facts were verified against the working tree on 2026-08-16; CLI facts against the installed claude 2.1.226 (`/opt/homebrew/bin/claude`, `--help` recorded — no model was called). This pass settles the three questions the card names (process topology, fixture portability, streaming granularity) and every decision a fresh executor would otherwise guess, including two parentheticals the criteria fixed before the delivery mechanics were decided (§3 amendments, T-012 §1 precedent).

**Frontmatter change made by this pass:** `blocked_by` becomes `[T-021, T-023, T-026]`. T-021 is technical, not just queue order: this task must extend the pinned ACL-surface test T-021 lands (its `acl_pin.rs` enumerates app commands with real InvokeRequests) and copies its single-flight claim-guard pattern. T-026 is technical too: it lands the genesis screen state, the docs-less-folder open path, and the plan-eligibility predicate this runner re-checks Rust-side, and both tasks edit lib.rs command registration (the body's "serialize with T-026" line, now board-visible). `touches` stays `[app-agent, app-shell, docs/architecture/components/]` — true as written.

### 1. Process topology — spawn-per-turn, resume by native session id

**Decision: one short-lived child per interview turn; no long-lived piped process.** Turn 1 spawns the adapter's spawn template and captures the CLI's native session id from the stream; every turn N≥2 spawns the resume template with that id. Verified against the installed CLI (2.1.226): `-p/--print` (non-interactive), `-r/--resume <session-id>` (headless resume by id), `--output-format stream-json` (print mode), `--include-partial-messages` (delta events, print+stream-json only) all exist as documented flags. Consequences bought: process lifetime = turn lifetime, so kill semantics are trivial and an orphan is bounded to one turn; the app-restart resume T-029 needs is the SAME code path as turn 2 (nothing extra to build there beyond UI); a crashed turn never takes the interview down — the session lives CLI-side and in the registry. Cost accepted and named: per-turn CLI startup + session reload (seconds — interview cadence, not a hot loop).

Rejected: **long-lived piped process** (`--input-format stream-json`, one child for the whole interview) — lower per-turn latency, but a hung/crashed child kills the interview, "child never outlives the app" becomes a standing obligation instead of a per-turn one, stdin framing adds a second protocol surface, and T-029's restart resume needs the spawn-per-turn path built ANYWAY, so the piped mode is a second topology, not an alternative. Rejected: **`--session-id <uuid>` minting our own id** — removes the capture-from-stream step but adds an undocumented-semantics bet (fresh-session-with-given-id, collision behavior) and would need a criterion amendment; the criterion's capture-from-stream is kept as written (the init line is the stream's first event; its absence is already the malformed-stream failure).

**The user's answer travels on stdin** (write, close) — the adapter-template "stdin" option, chosen over one-argv-element: argv is world-readable in `ps` (answers can carry private product ideas), ARG_MAX bounds it, and stdin is equally shell-free. Never a shell string anywhere: `std::process::Command` with fixed argv arrays; the prompt is not in argv at all.

**cwd = the canonical open project dir from WatchState** (never webview-supplied). **Env hygiene: `env_clear()` + explicit allowlist**, not passthrough — the child gets exactly: `HOME`, `USER`, `LOGNAME`, `SHELL`, `TMPDIR`, `LANG`, `LC_ALL` (if set), `TERM=dumb` (forced), `PATH` = the login-shell PATH captured at probe time (§6 — the criterion's "explicit PATH augmentation"; the planner's own Bash needs to find git), proxy/CA routing vars if present (`HTTP_PROXY`/`HTTPS_PROXY`/`NO_PROXY` + lowercase, `SSL_CERT_FILE`, `SSL_CERT_DIR`, `NODE_EXTRA_CA_CERTS`), and on Linux `XDG_CONFIG_HOME`/`XDG_DATA_HOME`/`XDG_CACHE_HOME`. Explicitly NOT passed, exemplars named: `ANTHROPIC_API_KEY`, cloud-credential families (`AWS_*`, `GOOGLE_*`), `GITHUB_TOKEN`, `NPM_TOKEN`, `TAURI_*`. The user's own CLI login (keychain/config) is the auth (ADR-003); forwarding an API key from our env would make the app a token conduit, and a GUI-launched app never had the shell's env anyway — env_clear makes dev and packaged behavior identical instead of accidentally different. Recorded consequence: a user whose CLI auths ONLY via an env API key sees a typed turn failure with the CLI's own stderr; T-029's hand-driven mode is their path.

### 2. The adapter table — one declarative entry, flags justified line by line, bypass ban executable

A Rust-side `const`-shaped table in `app/src-tauri/src/agent/adapter.rs`, one v1 entry, unreachable from the webview (it is data inside the binary; no command returns it). Fields: `key: "claude"`, `binary: "claude"`, `min_major: 2` (found version below → typed UnsupportedVersion, §6), `spawn_args`, `resume_args` (a `{session_id}` slot filled as one argv element), `parse: StreamJsonV1`. Adding an agent is one entry (ADR-003's promise made concrete); nothing else in the runner names "claude".

v1 spawn argv after the binary, each flag's reason recorded as a table comment:

    -p --output-format stream-json --include-partial-messages --verbose
    --permission-mode acceptEdits
    --allowedTools "Bash(git init:*)" "Bash(git add:*)" "Bash(git commit:*)"
                   "Bash(git status:*)" "Bash(mkdir:*)" "Bash(cp:*)"
    --disallowedTools WebFetch WebSearch

Resume argv = the same + `--resume <native_session_id>`. Justification: `acceptEdits` auto-accepts file writes **inside cwd only** — the project-dir scoping the criterion demands is the CLI's own cwd model, with no `--add-dir` anywhere (§3 keeps the kit inside the project, so no grant beyond cwd exists); the six Bash patterns are exactly the kit's imperative surface as the T-023 verdict recorded it (file copies + docs writes + git init/add/commit, plus status/mkdir); `--disallowedTools WebFetch WebSearch` is free ADR-010 narrowing (a genesis interview has zero web business); `--verbose` rides along because stream-json in print mode has historically required it — the executor records at the §7 smoke whether 2.x still enforces that and notes it. Everything else the model attempts is auto-denied by the CLI in print mode and surfaces in the stream — loud, not hung. Deliberately NOT passed, with reasons: `--model` (the user's CLI default is the model; the init line reports what ran and the registry records it), `--bare` (forces API-key-only auth — OAuth/keychain never read — the exact opposite of our auth posture), `--settings`/`--setting-sources`/`--strict-mcp-config` (the user's CLI configuration is the user's; we ride it as ADR-003 intends), `--no-session-persistence` (resume is the point), `--max-budget-usd` (silently capping the user's own session is not ours to do — named growth candidate, §10).

**The no-bypass standing rule becomes an executable pin:** a cargo test asserts no adapter argv contains `--dangerously-skip-permissions`, `--allow-dangerously-skip-permissions` (NEW second spelling, present in 2.1.226's help), or the string `bypassPermissions` — red on the string appearing in any future entry, so the rule survives adapter growth without relying on verifier memory (the verifier still sweeps flags with grant-level suspicion per the criterion).

### 3. Kit delivery — compiled-in method snapshot, materialized per-genesis into .nputer/; two criteria amendments

**Decision: the method snapshot is compiled into the binary** — a static `include_str!` table of exactly the driver-contract kickoff set plus its operational references (13 files, ~60 KB): `roles/planner.md`, `interview/plan-interview.md`, `interview/decomposition.md`, `docs-templates/{NORTH_STAR,ROADMAP,ARCHITECTURE,CONVENTIONS,STATE}.md`, `docs-templates/decisions/000-template.md`, `adapters/{CLAUDE,AGENTS}.md`, `tasks/TASK-FORMAT.md`, `tasks/T-000-template.md`, `runtime/nputer.yaml` (planner.md step 1's MAY-seed reads it). A `METHOD_SNAPSHOT_VERSION: "0.1.5"` const sits beside the table. Three parity tests make drift loud: (a) content is by-construction (include_str! recompiles on file change); (b) a directory walk of `method/docs-templates`, `method/adapters`, `method/tasks` asserts every file found is in the table — a NEW template file turns cargo red until the table is deliberately updated; (c) the version const cross-checks the two live stamps (`(v0.1.5` in plan-interview.md's Output heading; "currently v0.1.5" in docs/CONVENTIONS.md) — a method bump without touching the const is red. CONVENTIONS' "programs transcribe the banking map / keep code in sync" gotcha is thereby enforced, not remembered.

**At genesis_start the snapshot is materialized to `<project>/.nputer/genesis/kit/`** (idempotent overwrite — app-owned runtime data, losable by charter) plus `kit.json` (`methodVersion`, `appVersion`, file list, `writtenAtMs`) — the version stamp on disk. This puts the kit INSIDE the agent's cwd: read access rides the project-dir scope, no extra grant exists, the exact kit version this genesis ran is auditable, stage 0's `.gitignore` line keeps it out of the project's git (proven in the T-023 dry run's `status --ignored` check), and T-029's hand-driven mode can point any CLI at the same path. The kickoff prompt is then small and assembled Rust-side (`pub fn assemble_kickoff(...)`, exported for T-029's copyable block); required elements — kit root path, project dir path, the planner.md pointer, plain-text-turns note, method version — draft text:

    You are the planner. KIT ROOT: <project>/.nputer/genesis/kit —
    PROJECT DIRECTORY: <project>. Read roles/planner.md at the kit
    root now and follow it exactly: stage 0 scaffold first, then the
    interview, one question at a time. Kit-internal paths resolve
    against the kit root; every docs/ path resolves inside the
    project directory. Turns are plain text. Method v0.1.5.

Rejected: **tauri.conf resources** (the criterion's literal phrasing) — `cargo test` has no AppHandle/resource_dir so tests would read a DIFFERENT path than production, dev/bundle resolution diverges, and pointing the agent at the app's install Resources would need `--add-dir` — a grant into the application bundle that acceptEdits could write through: absurd. Rejected: **embedding all kit files in the kickoff prompt** — the kit then exists only in the CLI's transcript (against the driver contract's readable-on-disk option and the transcript-is-not-record spirit), bloats every resumed context, and gives T-029's hand-driven block nothing to point at.

**Criteria amendments (exact text), T-012 §1 precedent — applied to the criteria above by the architect at this section's commit.** In criterion 1, the parenthetical "(a build-time Tauri resource carrying the method version stamp)" became:

> (a method snapshot compiled into the binary at build time — an
> include_str! table pinned to method/** by cargo parity tests,
> carrying the method version stamp — and materialized per-genesis
> under .nputer/genesis/kit/ so the spawned CLI reads it inside its
> own project-scoped permissions)

In criterion 2, "permission flags scoped to the project dir + read-only access to the bundled method snapshot; never a bypass-permissions flag" became:

> permission flags scoped to the project dir (the CLI's own cwd
> scoping; the materialized kit lives inside it under
> .nputer/genesis/kit/, so no directory grant beyond the project
> exists); never a bypass-permissions flag

All other criteria stand unchanged.

### 4. Command surface, events, and the store — names, shapes, caps, the stated latency bound

Module layout: `app/src-tauri/src/agent/{mod,adapter,runner,kit,sessions}.rs` (C-14 paths), following the index_cmd seam pattern — everything the Tauri commands do lives in pub fns minus the Tauri runtime, so cargo tests drive it directly; the `#[tauri::command]` wrappers stay thin. lib.rs (the app-shell touch, serialized behind T-026): register the four commands in `generate_handler!`, manage `AgentState`, and switch `.run(ctx).expect(...)` to `.build(ctx)...run(|app, event| ...)` so `RunEvent::ExitRequested`/`Exit` reaps the child group (§5).

Commands and typed outcomes (PickOutcome discipline: `#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]`):

- `genesis_start()` — zero-argument. Validates: project open (WatchState), genesis-eligible (re-check of T-026's plan-absence predicate — no docs/ROADMAP.md, no docs/tasks/*.md — Rust-side defense in depth against out-of-order webview calls; reuse/extract T-026's landed fn), no session running (single-flight claim), no recorded in-flight planner session for this project (else `resumeAvailable` — T-029 renders the choice; this task does not auto-resume at start). Resolves the binary (§6), materializes the kit (§3), writes the registry entry, spawns turn 1 with the kickoff on stdin, returns `started { turn: 1 }` once the child is spawned — completion arrives as events. Other outcomes: `busy`, `noProject`, `alreadyPlanned { path }`, `resumeAvailable { nativeSessionId, turns }`, `cliNotFound { probed }`, `unsupportedVersion { found }`, `error { message }`.
- `genesis_send_turn(text: String)` — the only webview-supplied datum anywhere; spawns the resume template with `text` on stdin. Outcomes: `accepted { turn }`, `busy`, `noSession`, `staleProject { sessionProject }` (§5), `cliNotFound`, `error`.
- `genesis_status()` — the mount-time catch-up pull (docs_snapshot precedent): `{ phase: "idle"|"running"|"failed", projectDir?, turn, nativeSessionId?, cliVersion?, methodVersion, lastError?, lastEventAtMs? }`.
- `genesis_cancel()` — kills the child process group (§5). Outcomes: `cancelled { turn }`, `idle`.

**One event channel, `genesis-turn`** (docs-changed precedent: `app.emit` from the runner's reader thread), every payload carrying `seq` from a runner-owned `AtomicU64` so the store stale-drops exactly like snapshots. Payload kinds: `started { turn }`, `textDelta { turn, text }`, `activity { turn, label }` (tool_use markers, e.g. "Write"), `completed { turn, text, truncatedRelay }` (text = the CLI `result` line's text — canonical, deterministic, what T-027 prefix-parses and the transcript stores), `failed { turn, error }` (§6's typed enum), `sessionRegistered { nativeSessionId }`. Rejected: tauri `ipc::Channel` per-call streaming — the broadcast event + status-pull pair is the established precedent, survives a late-mounting pane, and lets T-024's lens and T-027's chat both listen.

**Streaming granularity — settled: deltas, not turn-final** (the card's named fork). `--include-partial-messages` is on; the reader relays `content_block_delta` text through a 150 ms coalescing window; tool_use blocks become `activity`. **The stated latency bound (criterion 3's blank, filled):** every CLI stream line is reflected as a webview event within 250 ms of its arrival (150 ms coalesce + emit); `started` fires at spawn; the runner never buffers a turn. Dead air is thereby bounded by the model's own generation gaps — which the timeouts fence (§6) — never by runner buffering; T-027 renders elapsed-time from `lastEventAtMs`. Caps (T-003's cap discipline): 32 KiB per event, 1 MiB relayed text per turn (beyond: deltas stop, `completed.truncatedRelay = true`), 1 MiB per stream line (beyond: MalformedStream), 64 KiB stderr ring for error tails.

**acl_pin + capabilities consequence, named:** T-021's `acl_pin.rs` app-command roster gains the four genesis commands (allowed local, denied remote — genesis_status/genesis_cancel are safely invokable in-test; genesis_start returns `noProject` without spawning under the test builder, the pick_project_folder-style note applies); `EXPECTED_GRANTS` must NOT change; `gen/schemas/capabilities.json` is regenerated and proven zero-diff plus the runtime ACL probe (T-007-s2 protocol — `strings` proves nothing, CONVENTIONS gotcha). A deliberate, reviewed diff — the alarm working as designed.

**app/src/lib/agent-store.ts** (C-14's TS half): typed mirrors of every outcome/event/status payload, a pure `reduceGenesisEvent` reducer (exported, vitest-unit-tested — the watcher-store pattern) with seq stale-drop and turn-in-flight single-flight state (`picking`/`indexing` precedent), thin `startGenesis`/`sendGenesisTurn`/`cancelGenesis`/`refreshGenesisStatus` wrappers, `listen("genesis-turn")` wiring. **No UI, no component, no App.tsx diff** — T-027 consumes it.

### 5. Session lifecycle — registry, transcript, kill semantics, what survives restart

**.nputer/sessions.json** per method/runtime/sessions-schema.md, exactly its fields: `id` ("S1"… max+1), `agent: "claude"`, `model` (from the stream init line — recorded truth, not configured), `native_session_id` (captured from init; upserted the moment it arrives, with the `sessionRegistered` event), `created` (UTC ISO-8601, hand-rolled formatter — no chrono dep), `turns` (incremented per completed exchange), `tasks: []`, `roles: ["planner"]`, `status`: `running` during a turn, `idle` between and after cancel (the kill is of the TURN; the native session remains resume-eligible — T-029's respawn path), `dead` reserved for explicit abandonment (T-029's fresh-session choice). Writes are read-modify-write with temp+rename (atomic); a corrupt existing file is renamed to `sessions.json.corrupt` with a log line and a fresh registry starts — losable by charter, never silently destroyed. **.nputer/genesis/transcript.jsonl**: append-only, one line per protocol half-turn — `{turn, role: "user"|"planner", text, atMs}` — user line at accepted send, planner line (the result text, 256 KiB cap) at completion. Deltas are never cached. Both files are runtime, losable; docs/ stays the only truth (ADR-017 clause 4).

**What survives an app restart (T-029's rider, read):** the registry entry (native id + turns), the transcript (chat rehydration), the kit dir (re-materialized anyway), and docs/ (the real record). In-memory turn state and the live child do not — by design; a mid-turn app death orphans at most one single-turn child, which finishes or fails on its own (spawn-per-turn's bounded-orphan property, §1). Restart-resume needs zero new runner mechanics: T-029 respawns through the same resume template.

**Kill semantics, kill-safe-by-construction:** the child is spawned into its own process group (`CommandExt::process_group(0)`, unix); cancel sends SIGTERM to the group, waits a 5 s grace, then SIGKILL, then reaps — no orphaned grandchildren (the CLI's own tool subprocesses die with the group). The same reap runs from the RunEvent exit hook and from `AgentState`'s Drop — "child processes SHALL not outlive the app" is proven for every exit path the app controls; a SIGKILL of the app itself cannot run cleanup, and that honesty is recorded here rather than papered over (the orphan is one turn, bounded). Windows job objects: out of scope with the standing Windows silence (§9); the FIXTURE is Windows-portable (§7), the group-kill is unix-cfg'd.

**Single-flight and project identity:** one planner per app process — an `AtomicBool` claim-guard exactly like T-021's `PickInFlight` (typed `busy`, RAII release). The session records its project dir at start; if the open project changes mid-genesis (picker), `genesis_send_turn` returns `staleProject` and `genesis_cancel` remains available — the runner never auto-kills on project switch (no entanglement with picker code; consequence for T-026/T-027 named: switching away leaves a cancelable session, surfaced via status). Two app instances on one project can race the registry (atomic rename means no torn file, last writer wins) — accepted, named silence (§10).

**Why .nputer/ stays outside the watch root, and its pinned assertion:** the docs watch is recursive on `<project>/docs` only; T-018's root sentinel is NON-recursive on the project root, so writes inside `.nputer/**` raise no events at all, and the one wake `.nputer/`'s own creation causes runs the stat-check + collect and is suppressed by baseline equality ("content unchanged - suppressed"). The pinned test (criterion): drive `spawn_watcher_thread` with a channel sink on a docs-bearing fixture, perform the runner's full write set (mkdir .nputer, kit materialization, registry write, transcript appends), assert ZERO snapshots arrive; then have the fake agent write `docs/NORTH_STAR.md` and assert exactly the pipeline lights up — both directions in one test.

### 6. Failure surfaces and binary resolution — every path typed, loud, resumable

Typed error enum (inside `failed` events and outcomes): `SpawnFailed { os }`, `StartTimeout` (no first stream line within 30 s of spawn), `Stall` (no stream line for 300 s mid-turn — generous because message/tool gaps are real; both consts documented as tunable), `ExitNonZero { code, stderrTail }`, `MalformedStream { why }` (no init line on turn 1, non-JSON flood with no anchors, oversize line, exit 0 without a `result` line), `Cancelled` is an outcome, not an error. Non-JSON lines OTHERWISE tolerated into the diagnostic ring (real CLIs emit warnings) — unknown JSON `type`s ignored (forward-compatible). Every failure: kills the turn's group, marks the turn failed via event, leaves the registry entry `idle` (resumable — the next send_turn just resumes), touches nothing under docs/ (the runner never writes there at all — the failure criterion's "leave the project untouched" is by construction), never panics. Auth-expired has no reliable exit-code signature: it surfaces as `ExitNonZero` with the CLI's own stderr tail relayed for T-027 to show — classification is a named silence, not a pretense.

**Binary resolution (criterion 4):** order — (1) cached path from the app config dir (`agent-paths.json`) if still executable; (2) the login-shell probe, once: spawn `[$SHELL-or-/bin/zsh, "-l", "-c", "command -v claude && echo PATH=$PATH"]` with a 10 s timeout, fixed argv (no user data — argv-as-data holds), capturing BOTH the binary path and the login PATH (the §1 child-PATH source); (3) typed `cliNotFound { probed }` — never a dead end (T-029 renders the hand-driven fallback). A spawn ENOENT invalidates the cache and re-probes once. At resolution, `claude --version` (10 s timeout) is recorded into status; below `min_major` 2 → `unsupportedVersion { found }`, loud, with the found string.

### 7. Test strategy — the fake agent CLI, Windows-portable by construction; no model in any suite

**Honesty first:** no executable fake-CLI precedent exists in the merged tree (grep-verified: zero `std::process` uses — the app spawns nothing today). The charter is ADR-017's consequences line ("runner and pane tests run against a fake-CLI fixture emitting canned stream output; one env-gated ignored test may exercise a real local CLI"); the nearest precedents are the `__nputerDocsHarness` fake driver and the parser/indexer fixture-tree culture. This task CREATES the pattern; T-027/T-029's fixtures compose it.

**The fake agent is a Rust `[[bin]]`** — `app/src-tauri/src/bin/fake_agent.rs`, ~100 lines, std-only, always built (no feature gate: `CARGO_BIN_EXE_` is unset for required-features bins under the CONVENTIONS-verbatim bare `cargo test`, so a gate would break the suite command; cost = trivial build time), never bundled (tauri.conf has no `externalBin` — asserted in §10's protocol). This IS the card's "fixture packaging portable to Windows" answer: a compiled binary, not a shell script (rejected: `#!/bin/sh` is unix-only and needs exec-bit games). Scenario selection via env vars the TEST harness sets on the child (`NPUTER_FAKE_SCENARIO`, `NPUTER_FAKE_DUMP_DIR`) — test-side surface, not production's (the runner has NO env-var binary override; tests inject the binary path through the seam constructor, so a hostile env can never redirect the production spawn). The fake dumps its argv, full env, and stdin to the dump dir (the assertion channel), echoes `--resume` ids into its init line, and plays scenarios: `happy` (init → deltas → tool_use → result), `writes-docs` (writes docs/NORTH_STAR.md into cwd — drives §5's watcher-lights/nputer-quiet test), `hang` (spawns a grandchild, then sleeps — the group-kill proof: after cancel, BOTH pids are dead), `nonzero`, `no-init`, `malformed-flood`, `oversize-line`, `slow` (StartTimeout/Stall drills with 1 s test-tuned consts), `version` (for resolution tests).

**Where the tests live:** `app/src-tauri/tests/agent_runner.rs` (integration — `CARGO_BIN_EXE_fake-agent` is only set there, not in unit tests; the runner APIs go `pub` through the lib for it), plus unit tests beside the modules (adapter pins, kit parity, kickoff assembly, sessions serde, ISO formatter) and the §5 watcher-quiet test beside docs_watch's existing harness. The lifecycle matrix: spawn/turn/resume round trip (resume argv carries the captured id — asserted from the dump), session id + model capture, registry upsert + turns increment + atomic write, transcript append (two lines per exchange, caps), kill-on-cancel group proof, every §6 failure scenario mapping to its exact typed error, env hygiene (a canary `NPUTER_TEST_SECRET` planted in the test's own env does NOT reach the child; `HOME` does; `PATH` equals the injected login PATH; `TERM=dumb`), determinism (scripted streams, no sleeps beyond scenario semantics, test-tuned timeout consts injected through the seam).

**One env-gated real smoke** (`#[ignore]`, `NPUTER_REAL_CLI=1`): resolves the real claude, runs one trivial one-turn `-p` exchange in a temp dir, records the observed stream-json line shapes (init/delta/result) and the `--verbose` requirement answer into implementation notes — the ONE permitted model call, off-suite (the criterion's MAY). Fake fixtures are then authored FROM that recorded schema, and the recorded transcript is the verifier's drift reference. The @human real-run observation stays listed for the milestone closer, per the task's Verification line.

### 8. Security posture, enumerated

1. Webview grant set unchanged, exactly `core:default`: `std::process` is not a plugin, no new plugin, no JS bindings; proven by regenerated `gen/schemas/capabilities.json` zero-diff + the runtime ACL probe (T-007-s2; `strings` proves nothing — CONVENTIONS gotcha), and T-021's pinned test extended, not weakened (§4).
2. Command allowlist additions: exactly `genesis_start`, `genesis_send_turn`, `genesis_status`, `genesis_cancel` — three zero-argument, one taking the user's own text as data.
3. No shell interpolation anywhere: fixed argv arrays, prompt on stdin; grep gate in review — no `sh -c`, no format!-assembled command lines (the login-shell probe's `-c` argument is a compile-time constant).
4. The adapter table stays bypass-free, now machine-enforced (§2's pin covers both CLI spellings AND the `bypassPermissions` mode string) and verifier-swept with grant-level suspicion, `--allowedTools` justifications included.
5. Spawned CLI inherits NOTHING secret: env_clear + allowlist, pinned by the fake's env dump + planted canary (§7). The kit rides inside the project; no `--add-dir`; cwd scoping is the whole file surface.
6. Port 1420 never involved: the runner opens no sockets, contacts no ports, ever — its I/O is child pipes and `.nputer/` files.
7. Model output is data: relayed to the webview as typed event fields (T-027 renders text nodes; ADR-009 discipline is its criterion), never logged raw — every stdout log line of turn/stderr text passes the existing `sanitize_for_log` (escape + truncate), so a hostile stream cannot smuggle terminal escapes.
8. `.nputer/` writes are atomic temp+rename, never under docs/; the agent — not the app — is the docs/ writer (ADR-017), and killing anything mid-flight loses nothing the files don't hold.

### 9. Out-of-scope fence (do not build)

- No chat UI, no split view, no challenge treatment, no retry affordance (T-027 — it calls this store); no genesis entry/front-door affordances or screen states (T-026, already landed); no lens/derivation work (T-024); no restart-resume or hand-driven-fallback UI (T-029 — the MECHANISM lands here, the flow there); no completion detection (T-028).
- No daemon (ADR-017 clause 7 — C-04 stays F-05's decision); no CLI-of-our-own (C-02 stays planned); no second adapter entry (codex/gemini/ollama are one-entry-each later — the promise, not the work); no model picker, no `--model`.
- No reading of `.nputer/nputer.yaml` roles (the planner:claude default is v1-hardcoded as THE entry; yaml consultation is named growth); no Windows process-group/job work (standing silence; the fixture is portable, the kill is unix-cfg'd).
- Zero diff to: docs_watch.rs behavior (additive reuse only — eligibility predicate import at most), lib/parser/**, app/src UI (App.tsx untouched; agent-store.ts is the only frontend file), method/** (the snapshot READS it), capabilities/default.json, CSP, tauri.conf.json beyond nothing (no externalBin, no resources), every package.json/lockfile — **zero new external crates** (std + existing serde/serde_json/tauri only; the ISO formatter is hand-rolled and unit-tested rather than buying chrono).
- No token-delta persistence (transcript = final texts), no cost governor, no sockets.

### 10. Verification protocol, dispatch note, silences

**Executor proof obligations (§9-style):**
1. Suites green at branch-point truth (today's record: parser 159/159 · app 398/398 · bare cargo 121 passed + 2 ignored; T-021/T-024/T-026 will have moved these — keep whatever the branch point gives, deviation-noted per the T-023 precedent).
2. The full §7 lifecycle matrix vs the fake, including the grandchild group-kill proof (both pids probed dead) and every failure scenario's exact typed error asserted.
3. Env canary + PATH/TERM/HOME assertions from the fake's dump.
4. The §5 two-direction watcher test: full runner write-set → zero emits; fake writes docs/ → pipeline lights.
5. ACL: capabilities regenerated zero-diff, runtime probe green, acl_pin roster extended (remote-origin denial included) — and `EXPECTED_GRANTS` untouched.
6. Pin discrimination drills, failing→passing: transiently plant `--dangerously-skip-permissions` in the adapter → pin test red → revert; plant a scratch file in method/docs-templates/ → parity walk red → revert; both outputs quoted in notes.
7. Kill-on-app-exit: the RunEvent hook's reap driven through the seam (unit-level), plus one manual `tauri dev` run — start a `hang`-scenario genesis in a scratch project, quit the app, assert no orphan (T-001 precedent: a briefly-opened window is not screen control).
8. Registry/transcript files byte-checked against method/runtime/sessions-schema.md's field set; corrupt-registry drill (garbage file → `.corrupt` rename + fresh start, log line quoted).
9. The env-gated real smoke run once; observed stream schema + the `--verbose` answer recorded in notes; suites re-run WITHOUT the env var to prove no model call rides the default path.
10. Fence audit: `git diff --stat` confined to app/src-tauri/src/agent/**, src/bin/fake_agent.rs, tests/agent_runner.rs, lib.rs, acl_pin.rs (roster), gen/schemas regen, app/src/lib/agent-store.ts (+ its vitest file), docs/architecture/components/C-14-agent-runner.md, this task file. Nothing else — no manifest/lockfile lines.

**Verifier's likely attack surface, flagged now:** (1) fake-vs-real schema drift — diff the fixture lines against the smoke's recorded transcript; (2) kill escape — re-derive with a double-forking fake; (3) plant their own env canaries and a hostile `NPUTER_AGENT_*`-shaped env var to confirm production reads none; (4) adapter flag sweep incl. arguing any allowedTools pattern wider than the kit's imperative surface; (5) regen honesty (run the capabilities regen themselves; strings-gotcha); (6) sentinel spam probe — churn `.nputer/**` in a loop against a live watcher and count emits; (7) grep for shell strings and prompt-in-argv; (8) store reducer stale-drop and turn single-flight under event replay; (9) C-14 component file paths vs the actual diff (graph regen at merge WILL move graph.json — new .rs files; the T-009-s1 integrator ritual applies, intent file landed in-branch keeps it drift-clean).

**Dispatch note.** Builds in the app-shell lane strictly after T-021 and T-026 merge (frontmatter now says so); assumes from them: `acl_pin.rs` + `PickInFlight` (T-021), the genesis screen state, docs-less open path, and plan-eligibility predicate (T-026). If their landed shapes differ from this pass's observations, branch-point truth governs and the executor writes the deviation note. Executor reads: this section top to bottom; ADR-017/003/012 + the ADR-010 containment notes; method/roles/planner.md's driver contract + the banking map (the kit being packaged); method/runtime/sessions-schema.md; docs_watch.rs (outcome/serde/cap/seam patterns + the sentinel), index_cmd.rs (the seam precedent), watcher-store.ts (the store shape); T-021's landed acl_pin.rs; T-026's landed eligibility fn; the recorded `--help` facts in this section. Integrator at merge: graph regen (real .rs diff — the ritual triggers), ARCHITECTURE components table gains C-14 building/verified status, STATE.

**Genuine silences, left open deliberately:** CLI floor beyond major-2 (re-pin when a needed flag moves; re-pins are deliberate acts) · auth-failure classification (stderr tail is surfaced, not parsed) · two-instance same-project registry race (atomic rename bounds it to last-writer-wins) · SIGKILL-of-app orphan (bounded to one turn, stated) · Windows end to end (repo standing silence; fixture stays portable) · additional adapter entries and nputer.yaml role consultation (F-04-era) · `--max-budget-usd` as an opt-in cost governor (tempting, not ours to impose silently) · delta-rendering polish and challenge treatment (T-027's design budget) · true cold-context conversational quality (arrives with T-027/T-028's live run, @human).

## Implementation notes

Built by `claude-opus-5 @fresh` on branch `t025-agent-runner`, branch
point main@f7fdf13. Worktree-only; nothing committed to main.

### Suites — before → after (all re-derived first-hand at the branch point)

| Suite | Branch point | After |
|---|---|---|
| lib/parser (`npm ci` + `npx vitest run`) | 159/159, 10 files | **159/159, unchanged** |
| app (`npm install` + `npm test`) | 455/455, 24 files | **470/470, 25 files** (+15) |
| app/src-tauri bare `cargo test` | 139 passed + 2 ignored | **200 passed + 3 ignored** (+61, +1 ignored) |
| tools/e2e (`npm ci` + `npx playwright test`) | 17/17 | **17/17, untouched** |

`cargo build`, `npm run build`, `npx tsc --noEmit` (app AND lib/parser)
all clean. The cargo count was taken three consecutive times with
identical results (the T-021 determinism bar, applied because this
touches concurrency and child processes). Nothing ever bound or
contacted port 1420: the runner opens no sockets at all, and no suite
starts a server.

### Criteria → evidence

**Criterion 1 — four commands, typed outcomes, kickoff assembled
Rust-side, child never outlives the app.**
`app/src-tauri/src/lib.rs:317-370` declares `genesis_start`,
`genesis_send_turn`, `genesis_status`, `genesis_cancel`; registered at
`lib.rs:459-462`. All four are `tauri::State`-based and runtime-generic,
so `acl_pin.rs` registers and invokes them for real (criterion 7).
Seams: `agent/mod.rs:250` `start_genesis`, `mod.rs:341` `send_turn`,
`mod.rs:414` `status`, `mod.rs:435` `cancel`. `genesis_start` is
zero-argument; the kickoff comes from `kit::assemble_kickoff`
(`kit.rs:236`) over the compiled snapshot plus
`WatchState::project_dir()` — pinned by
`tests/agent_runner.rs:the_kit_lands_inside_the_project_and_the_kickoff_points_at_it`.
`genesis_send_turn(text)` is the only webview datum, and it goes on
stdin (`runner.rs:696`), asserted absent from argv by
`spawn_turn_resume_round_trip_with_the_prompt_on_stdin`. Cancel kills
the process group (`mod.rs:441` → `runner.rs:terminate_group_async`),
and the exit hook + `Drop` (`mod.rs:reap_for_exit`, `lib.rs:464-472`)
cover every exit the app controls — proven by
`cancel_kills_the_whole_process_group_including_a_grandchild` and
`the_exit_hook_reaps_the_turns_process_group`.

**Criterion 2 — declarative one-entry adapter table, cwd-scoped, never a
bypass flag.** `agent/adapter.rs:92` (`CLAUDE_V1`), `adapter.rs:143`
(`ADAPTERS`). Every flag carries its reason in the doc comment above the
const, including the six deliberately-omitted ones. Unreachable from the
webview: no command returns it, and `acl_pin.rs`'s local-invoke test
asserts the `genesis_status` payload contains no `claude`, `acceptEdits`,
`allowedTools`, `Bash(` or `--` substring. Pins:
`no_adapter_argv_can_ever_bypass_permissions`,
`permission_mode_is_accept_edits_and_scoped_to_cwd` (also asserts no
`--add-dir` anywhere), `allowed_tools_are_exactly_the_kits_imperative_surface`,
`a_hostile_session_id_stays_one_inert_argv_element`.

**Criterion 3 — lifecycle events with a stated bound, session id
captured and recorded, `.nputer/` outside the watch root.** One channel,
`genesis-turn` (`mod.rs:GENESIS_EVENT`); payload kinds at
`runner.rs:RunEvent`, `seq` on every variant
(`every_event_carries_a_monotonic_seq`). The 250 ms bound is structural:
the relay loop polls at 25 ms and flushes a buffered delta once it is
`cfg.coalesce` (150 ms) old — `runner.rs:912-919`. Session id capture +
registry write: `the_registry_and_transcript_record_the_exchange`.
`.nputer/` silence and the docs/ wake-up, in ONE test, both directions:
`the_runners_write_set_is_snapshot_silent_and_the_agents_docs_write_is_not`.

**Criterion 4 — binary resolution with login-shell probe, cached, typed
not-found.** `runner.rs:resolve_cli` (order: test seam → cache →
login-shell probe → typed `NotFound`), `login_shell_probe`, and the
`agent-paths.json` cache via `read_cache`/`write_cache`/`invalidate_cache`
(a spawn ENOENT invalidates and re-probes once). Pins:
`a_missing_cli_is_a_typed_not_found_never_a_dead_end`,
`a_cli_below_the_minimum_major_is_refused_loudly`,
`resolve_uses_the_injected_binary_without_probing`. The REAL probe path
was exercised once by the smoke: it found `/opt/homebrew/bin/claude` and
recorded `2.1.226 (Claude Code)` into status.

**Criterion 5 — the full cargo suite drives a fake CLI; no real model in
any suite.** `src/bin/fake_agent.rs` (auto-discovered `[[bin]]`, no
manifest line) + `tests/agent_runner.rs` (24 tests). Every config in that
file sets `probe_login_shell: false`, so **no suite can resolve the real
CLI even by accident**. Round trip, session id + model capture,
transcript append, kill-on-cancel with no orphan, malformed handling —
all present, each named after what it proves.

**Criterion 6 — typed failure, project untouched, session resumable,
never panics.** `runner.rs:TurnError` and the decision block at
`runner.rs:963-1000`. Each surface has its own test: `nonzero`,
`auth-error`, `no-init`, `malformed-flood`, `oversize-line`,
`exit-no-result`, `slow-start`, `slow-mid`, missing binary. "Leaves the
project untouched" is by construction — the runner never opens anything
under `docs/` — and is asserted in
`a_nonzero_exit_is_typed_with_the_clis_own_stderr_tail`. "Keeps the
session resumable" is asserted as registry `status == "idle"` after
every failure and after cancel.

**Criterion 7 — surface unchanged, zero-diff proven.** See obligation 5
below. `EXPECTED_GRANTS` untouched; four app commands added.

### §10's ten proof obligations

1. **Branch-point suites** — re-derived, table above. Deviation from the
   plan's figures noted there: the plan recorded parser 159 · app 398 ·
   cargo 121, and T-021/T-024/T-026 have since moved app to 455 and
   cargo to 139. The branch point governs (the T-023 precedent).
2. **The lifecycle matrix incl. the grandchild group-kill** — 24
   integration tests, all green. The `hang` scenario forks a real
   grandchild (`fake_agent.rs`, `Command::new(current_exe)` with scenario
   `grandchild`), writes BOTH pids to the dump, and the test asserts both
   alive before the cancel and both dead after. That is the difference
   between killing a process and killing a group. *Precision recorded in
   the test itself*: `kill(pid, 0)` succeeds on a ZOMBIE, so the direct
   child's pid is checked after the turn thread's own `wait()` (which
   `settle` waits for); the grandchild, being nobody's child of ours, is
   checked immediately.
3. **Env canary** — `NPUTER_TEST_SECRET` is planted in the TEST
   PROCESS's own environment by `harness()` and asserted absent from the
   child's full env dump, alongside a prefix sweep for `ANTHROPIC`,
   `AWS_`, `GOOGLE_`, `GITHUB`, `NPM_TOKEN`, `TAURI_`. Positive controls
   in the same test: `TERM == "dumb"` (forced, not forwarded), `PATH`
   byte-equal to the injected login PATH, `HOME` equal to ours. A second,
   source-level pin — `the_env_allowlist_carries_no_credential_family` —
   fails if anyone ever adds a key-shaped name to `ENV_ALLOWLIST`.
4. **The two-direction watcher test** — one live watcher thread, one
   docs-bearing genesis-eligible fixture. Direction one: `mkdir .nputer`,
   the whole kit materialization, the registry write, and **fifty**
   transcript appends (the verifier's "sentinel spam probe", built in)
   produce **zero** snapshots across eight debounce windows. Direction
   two: the `writes-docs` fake writes `docs/NORTH_STAR.md` into its cwd
   and the pipeline lights, the snapshot carrying that path and nothing
   under `.nputer/`.
5. **ACL** — done the way the T-026 verifier's protocol demands, both
   ends built independently with separate `CARGO_TARGET_DIR`s
   (`gen/schemas/` is gitignored, so reading the working tree proves
   nothing). Branch point: detached worktree at f7fdf13, `rm -rf
   gen/schemas`, own target dir, `cargo build`. HEAD: `rm -rf gen/schemas
   && cargo clean -p nputer && cargo build`. **All four artifacts hash
   identical across the pair**:

       acl-manifests.json   d3eace193b1e453756736eaf27bb156df62c7a41b2fe101403ee92ef93e69699
       capabilities.json    4fca70b5437f720b9a72c727c0663349aa9e8b31917dcc0a870012de02406b07
       desktop-schema.json  2a16f62c90a059a1b67e4501216bb3476f402087e99ba659dd38c9d0521f3b07
       macOS-schema.json    2a16f62c90a059a1b67e4501216bb3476f402087e99ba659dd38c9d0521f3b07

   — the same three digests T-026's merge recorded, which is the point.
   `EXPECTED_GRANTS` is byte-identical between the two trees: 6135 bytes,
   92 grant lines, `cmp` clean. The roster gained the four names in the
   remote-denial loop, AND a new test
   `t025_genesis_commands_are_locally_invokable_and_remotely_denied`
   REGISTERS all four on the MockRuntime app and invokes them from the
   local origin, getting `{"kind":"idle"}`, `{"kind":"noProject"}`,
   `{"kind":"noSession"}` and a real status payload back. That is
   strictly stronger than the name-agnostic denial loop (whose limits the
   T-026 verifier stated and which this file still records), and it is
   headless and spawn-free by construction: no project open ⇒ no
   resolution, no materialization, no child.
6. **Pin discrimination drills, both quoted.**
   (a) Planted `"--dangerously-skip-permissions"` into
   `CLAUDE_V1.spawn_args`:

       ADAPTER BYPASS BAN VIOLATED (T-025 §2): the argv element
       "--dangerously-skip-permissions" contains
       "--dangerously-skip-permissions". The runner may never ask a
       spawned CLI to skip its own permission checks - the CLI's
       cwd-scoped permission model IS the containment (criterion 2).
       Remove the flag; do not silence this test.

   Reverted; the pin is green and `git status` is clean.
   (b) Dropped a scratch `method/docs-templates/SCRATCH.md`:

       method/docs-templates/SCRATCH.md exists but is NOT in the compiled
       kit snapshot (T-025 §3). A new scaffold file must be added to
       KIT_FILES deliberately - the spawned planner can only copy what it
       was given.

   Reverted; `method/` has zero diff against main.
7. **Kill-on-app-exit** — the `RunEvent` hook's reap driven through the
   seam at unit level (`the_exit_hook_reaps_the_turns_process_group`,
   grandchild included). The `tauri dev` half is **@human**: this
   pipeline is headless-verification-only and a manual quit-the-app run
   is a screen action. What IS shown mechanically: the exact function the
   hook calls (`AgentState::reap_for_exit`) kills the whole group, and
   `lib.rs` now routes `ExitRequested`/`Exit` into it (the builder moved
   from `.run(ctx)` to `.build(ctx)…run(|app, event| …)`).
8. **Registry/transcript byte-checked** —
   `the_written_registry_matches_the_sessions_schema_field_for_field`
   walks every key `method/runtime/sessions-schema.md` names and asserts
   the written object has exactly those nine and no more.
   Corrupt-registry drill: `a_corrupt_registry_is_moved_aside_not_destroyed`
   writes garbage, asserts the `.corrupt` file holds the original bytes
   verbatim, the real path is free, and a fresh registry starts. The log
   line is `[nputer] agent: <path> did not parse (<err>) - moved to
   <path>.corrupt and starting a fresh registry`.
9. **The real smoke — run once, and it earned its keep.** See below.
   Suites were then re-run WITHOUT `NPUTER_REAL_CLI` and are green, which
   is the proof no model call rides the default path.
10. **Fence audit** — `git diff --stat main` is confined to:
    `app/src-tauri/src/agent/{mod,adapter,kit,runner,sessions}.rs` (new),
    `app/src-tauri/src/bin/fake_agent.rs` (new),
    `app/src-tauri/tests/agent_runner.rs` (new),
    `app/src-tauri/src/lib.rs`, `app/src-tauri/src/acl_pin.rs`,
    `app/src/lib/agent-store.ts` (new), `app/test/agent-store.test.ts`
    (new), `app/test/architecture-dogfood.test.ts`,
    `app/test/map-dogfood-render.test.tsx`, `lib/parser/test/smoke.test.ts`,
    `docs/architecture/components/C-14-agent-runner.md` (new), this task
    file, and three suggestion files. **No manifest line, no lockfile
    line, zero new external crates.** Zero diff to `method/**`,
    `lib/parser/src/**`, `capabilities/**`, `tauri.conf.json`,
    `docs_watch.rs`, `index_cmd.rs`, `docs/architecture/graph.json`, and
    every `app/src` file other than the new store.

### The real-CLI smoke: what it observed, and the defect it found

Run once, off-suite: `NPUTER_REAL_CLI=1 cargo test --test agent_runner
real_cli_smoke -- --ignored --nocapture`, against `claude 2.1.226` at
`/opt/homebrew/bin/claude`. **This is the fixtures' provenance.**

Observed stream schema (`type`/`subtype`, in arrival order):

    system/init      keys: agents, analytics_disabled, apiKeySource,
                     capabilities, claude_code_version, cwd,
                     fast_mode_disabled_reason, fast_mode_state,
                     mcp_servers, memory_paths, messaging_socket_path,
                     model, output_style, permissionMode, plugins,
                     product_feedback_disabled, session_id, skills,
                     slash_commands, subtype, tools, type, uuid
    system/status    {status:"requesting", uuid, session_id}
    system/api_retry {attempt, max_retries, retry_delay_ms,
                      error_status, error, session_id, uuid}
    assistant        {message:{…, content:[{type:"text", text:…}]}}
    result/success   {is_error, result, api_error_status, terminal_reason,
                      permission_denials, num_turns, usage, total_cost_usd,
                      duration_ms, session_id, uuid, subtype, type}

The fake's canned lines are a faithful SUBSET of these shapes. The two
`system` subtypes the fake did not originally emit (`status`,
`api_retry`) are now covered by classifier unit tests, and `api_retry`
has a fake scenario of its own.

**`--verbose`: still required, measured rather than inherited.** Dropping
it makes 2.1.226 refuse at ARGUMENT-VALIDATION time — `Error: When using
--print, --output-format=stream-json requires --verbose`, exit 1, on
stderr, **before any model call**. The adapter comment records this as a
measurement.

**THE DEFECT THE SMOKE FOUND.** The first smoke run reported
`exitNonZero { code: 1, stderrTail: "" }` — a typed failure carrying no
information at all. Capturing the raw stream showed why: the CLI reports
authentication failure **in band on stdout** (an `api_retry` line with
`error_status: 401`, then a `result` line whose **`subtype` still reads
`"success"`** while `is_error` is true and `result` holds `Failed to
authenticate. API Error: 401 OAuth access token has been revoked.`) and
writes **nothing to stderr**. §6 had assumed the stderr tail would carry
it. Fixed in scope: `classify_line` reads `is_error` and never trusts
`subtype`; in-band `system` errors become diagnostics; a nonzero exit
reports the CLI's own words when stderr is silent. The new fake scenario
`auth-error` transcribes the observed lines verbatim as the regression
pin (`an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail`).
Re-run against the real CLI, the failure now reads `api_retry:
authentication_failed 401 … Failed to authenticate. API Error: 401 OAuth
access token has been revoked.` Filed as **T-025-s1**.

**What the smoke could NOT observe: a real model turn.** Every attempt
401s — this machine's `claude` OAuth token is revoked, and a manual
invocation with the FULL ambient environment fails identically, so the
runner's `env_clear` is not the cause and forwarding a key would not have
helped (and is forbidden anyway, ADR-003). It DID establish that the real
CLI accepts the whole adapter argv, that the init line is captured
(`native_session_id`, `model: claude-sonnet-5`), and that the registry is
written correctly. The conversational half — does the kickoff land the
planner in stage 0, and is the six-pattern Bash allowlist sufficient for
a real stage-0 scaffold — is **@human**, filed as **T-025-s2** with the
exact command.

### Notes drafted for the integrator

- **READ FIRST — MAIN MOVED UNDER THIS BRANCH, and the two branches
  overlap in exactly two files.** Branch point was main@f7fdf13; while
  this task built, T-037 merged and main is now f502d0c. T-037's own
  branch touched `GenesisScreen.tsx` (disjoint from everything here, as
  the lane note promised), but **its MERGE COMMIT regenerated
  `graph.json` and reconciled the two app dogfood fixtures** — which are
  the same two files this branch had to touch to declare C-14. So expect
  a textual conflict in `app/test/architecture-dogfood.test.ts` and
  `app/test/map-dogfood-render.test.tsx`. The two edit sets are
  SEMANTICALLY DISJOINT and the resolution is "take both", per this
  table — a naive take-one-side loses half of it:

  | Assertion | main (T-037's, graph-derived) | this branch (registry-derived) | resolve to |
  |---|---|---|---|
  | `fileComponent.size` | **86** | 84 | 86 (then → 88 at regen) |
  | `["C-05", n]` | **37** | 35 | 37 (then → 38 at regen) |
  | map header hint | **`committed graph · 86 files`** | 84 files | 86 (then → 88) |
  | registry id list | 10 ids | **11 ids (+C-14)** | 11 |
  | `declared` length | 10 | **11** | 11 |
  | findings | three D3 | **four D3 (+D3:C-14)** | four |
  | relation table | 26 rows | **27 rows (+C-14→C-10 planned 0)** | 27 |
  | `drift` / `declaredOnly` | without C-14 | **with C-14** | with C-14 |
  | map nodes / edges | 10 / 26 | **11 / 27** | 11 / 27 |

  `lib/parser/test/smoke.test.ts` is NOT a conflict: T-037 declared no
  component and left it alone, so this branch's +C-14 applies cleanly.
- **Graph regen WILL fire** at the merge: the branch adds `.ts` outside
  docs/. Expected delta, forecast here and deliberately NOT applied
  in-branch (T-009-s1 is the integrator's ritual). **Against post-T-037
  main (86 files): 86 → 88** — `app/src/lib/agent-store.ts` (claimed by
  C-14's explicit path) and `app/test/agent-store.test.ts` (C-05's
  `app/test/**` umbrella). **The five new `.rs` files are INVISIBLE to
  the indexer** until T-010 lands Rust extraction (`languages: ["ts"]`
  today), so `app/src-tauri/src/agent/**` contributes nothing.
  Consequences to expect: `C-05` 37 → 38, `C-14` 0 → 1; **D3:C-14
  CLEARS** (it has a file); drift and declaredOnly drop C-14; and a **new
  undeclared row D1:C-05→C-14** is likely — the app/test umbrella
  reaching into C-14's store, the exact shape T-024's merge produced for
  C-13 and for the same reason. `C-14→C-10` stays **planned**:
  `agent-store.ts` imports only `@tauri-apps/api`, so no TS import can
  confirm the Rust-side dependency until T-010.
- **ARCHITECTURE.md** gains C-14 in the components table, and its
  Interfaces "Genesis:" line can gain the runner half: the user's own CLI
  spawned per turn and resumed by native session id, `.nputer/` runtime
  files only, four app commands and zero grants.
- **No new ADR** on the three-prong test: this implements ADR-017's
  already-settled architecture and ADR-012's IPC pattern, extending it to
  four more commands rather than bending it (`EXPECTED_GRANTS`
  byte-identical is the mechanical proof); it contradicts no ADR and adds
  no package; and the durable calls (topology, flag justifications, kit
  delivery, kill semantics) are recorded in the applied plan above.

### Deviations from the plan, with reasons

1. **The fake binary is `fake_agent`, not `fake-agent`.** A hyphenated
   name needs a `[[bin]]` stanza in `Cargo.toml`, and §10's fence forbids
   manifest lines. Cargo's `src/bin/` auto-discovery gives
   `CARGO_BIN_EXE_fake_agent` with zero manifest diff, which was the more
   load-bearing of the two constraints.
2. **The kit ships 14 files, not "13".** §3's parenthetical count and its
   own enumeration disagree; the enumeration is normative and was
   followed. Filed as **T-025-s3**.
3. **`genesis_start` and `genesis_send_turn` are `async` and return
   `Result<Outcome, String>`.** Tauri runs SYNCHRONOUS commands on the
   main thread, and the first-ever `genesis_start` may run the
   login-shell probe (bounded at 10 s) — a 10 s UI freeze. Async commands
   with borrowed `State` must return `Result`; the `Err` arm is
   unreachable by construction (every failure is a typed outcome) and the
   webview still receives the outcome object.
   `genesis_status`/`genesis_cancel` stay synchronous because both are
   fast: cancel signals synchronously and hands the grace + SIGKILL
   escalation to a background thread, so it never holds the caller for
   the 5 s grace.
4. **`RunnerConfig` has a fourth test-seam field, `probe_login_shell`.**
   The plan's three (binary/path/extra_env) leave `resolve_cli`'s
   not-found branch untestable without spawning the user's login shell —
   which would risk a suite resolving the REAL CLI. Setting it `false` in
   every test makes "no model in any suite" a structural property rather
   than a convention. Production is `true`, pinned by
   `default_config_reads_nothing_from_the_environment`.
5. **`docs_watch` is now `pub mod`, and `agent` is `pub mod`.** The
   two-direction watcher test needs the real `spawn_watcher_thread` from
   an integration test, and §10's fence excludes `docs_watch.rs` from the
   diff — so the test could not live beside its harness as §7 suggested.
   No item's visibility changed (they were already `pub fn`); only the
   module's.
6. **Turn 1's kickoff is written to the transcript as the `user` half.**
   §5 says "user line at accepted send", which leaves turn 1's user half
   missing and the kickoff recorded nowhere. Writing it keeps the
   transcript a complete protocol record; T-027 can choose not to render
   it.
7. **`classify_line` reads `result.is_error` and folds in-band system
   errors into the diagnostic ring.** Not in the plan because the plan
   did not know the CLI behaves this way. See the smoke section.
8. **The kill uses two `extern "C"` declarations (`killpg`, `kill`)
   rather than the `libc` crate.** §9 forbids new external crates and
   §10's fence forbids manifest lines; libc is already linked into every
   Rust unix binary, so declaring the two symbols is std-only. The
   alternative — spawning `kill(1)` — would be shell-free but absurd.
   Unix-gated, as §5 specifies.

### Genuine silences, left open deliberately

Everything §10 lists still stands, plus: the exit-0-with-`is_error` case
is typed as `ExitNonZero` with whatever code the process gave (never
observed live — 2.1.226 exits 1); auth failures are RELAYED, not
CLASSIFIED (T-025-s1); and `sanitize_for_log` is applied to the stderr
tail that reaches the event, so a hostile stream cannot smuggle terminal
escapes into a log, while the delta text relayed to the webview is
deliberately NOT escaped — it is model prose, and T-027 renders it as
text nodes (ADR-009 is that task's criterion; escaping here would corrupt
the content).

## Verdicts
