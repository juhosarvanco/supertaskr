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
built_by:
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

## Verdicts
