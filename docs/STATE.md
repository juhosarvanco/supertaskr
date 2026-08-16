# State

Updated: 2026-08-16 by integrator (T-025 merge), claude-opus-5 @fresh

## Just completed
T-025 (agent runner, L, app-agent + app-shell) done and merged — built
by `claude-opus-5 @fresh`, verified by `claude-opus-5 @fresh`,
`review: same-model`, **APPROVED first pass**. **MILESTONE 3'S HARD
CORE.** The app can now spawn the user's own agent CLI to write their
plan. Declares component **C-14** (agent runner).

**WHAT IT IS, in one breath.** One short-lived child process per
interview turn — never a long-lived pipe — resumed on turn N≥2 by the
CLI's OWN native session id, captured from the stream's init line.
Four app commands (`genesis_start()`, `genesis_send_turn(text)`,
`genesis_status()`, `genesis_cancel()`), three of them zero-argument
and the fourth taking the only webview-supplied datum in the whole
surface: the user's typed answer, which travels on **stdin**, never in
argv (argv is world-readable in `ps`, and answers carry private product
ideas). One event channel, `genesis-turn`, carrying `started` /
`textDelta` / `activity` / `completed` / `failed` / `sessionRegistered`
with a monotonic `seq` so the store stale-drops exactly like watcher
snapshots; deltas, not turn-final, with a structural 250 ms bound
(25 ms poll, 150 ms coalesce) so there is no dead air the runner is
responsible for. The method kit is **compiled into the binary**
(`include_str!`, 14 files, pinned to `method/**` by parity tests that
go red when a scaffold file is added) and **materialized per genesis**
into `<project>/.nputer/genesis/kit/`, which puts it inside the agent's
own cwd scope so no directory grant beyond the project exists. The
session registry (`.nputer/sessions.json`, exactly the nine fields
`method/runtime/sessions-schema.md` names) and the transcript
(`.nputer/genesis/transcript.jsonl`) are **runtime files, losable by
charter** — docs/ stays the only truth (ADR-017). Every failure is
typed (`SpawnFailed`, `StartTimeout`, `Stall`, `ExitNonZero`,
`MalformedStream`), leaves the project untouched by construction (the
runner never opens a path under `docs/`), leaves the session resumable
(`status: "idle"`), and never panics. Binary resolution handles
GUI-launch PATH poverty: cached path → login-shell probe once → typed
`cliNotFound { probed }`, never a dead end.

**THE SECURITY RESULTS, because they are the point of this card.**
Every one re-derived by the verifier first-hand rather than read off
the builder's notes.
- **ZERO NEW WEBVIEW GRANTS.** `gen/schemas/` is gitignored, so reading
  the working tree proves nothing; the ACL was re-derived from **two
  independent trees with separate `CARGO_TARGET_DIR`s** (branch point
  `f7fdf13` unpacked via `git archive` into scratch, HEAD in the
  worktree, `rm -rf gen/schemas` before each). **All four artifacts
  byte-identical across the pair** — `capabilities.json` is literally
  `"permissions":["core:default"]`. `EXPECTED_GRANTS` byte-identical
  between the trees: 6135 bytes, **92 grant lines**, `cmp` clean.
  `std::process` is not a plugin; the four new commands are app-defined
  and therefore un-gated, which is exactly ADR-012's mechanism. T-021's
  pin was EXTENDED, never weakened: a new test registers all four on a
  MockRuntime app carrying the shipped authority, invokes them from the
  local origin (getting real typed payloads — `idle`, `noProject`,
  `noSession`, a real status) and gets an ACL denial from the remote
  origin for each. That is strictly stronger than the name-agnostic
  denial loop it sits beside.
- **ZERO NEW CRATES**, verified from `Cargo.lock` and `Cargo.toml`, not
  from the notes: both byte-identical to the branch point AND to main.
  The kill uses two `extern "C"` declarations (`killpg`, `kill`) rather
  than buying `libc` for twenty lines; the ISO-8601 formatter is
  hand-rolled and cross-checked against `date -u -r` on all six of its
  epochs, including both %100 and %400 leap rules.
- **SIXTEEN ENV CANARIES, ZERO LEAKS.** The verifier planted its own,
  not the builder's: `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`,
  `ANTHROPIC_BASE_URL`, `CLAUDE_CODE_OAUTH_TOKEN`,
  `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `GITHUB_TOKEN`,
  `GH_TOKEN`, `NPM_TOKEN`, `GOOGLE_APPLICATION_CREDENTIALS`,
  `TAURI_SIGNING_PRIVATE_KEY`, and the **hostile** `NPUTER_AGENT_BIN` /
  `NPUTER_AGENT_PATH` / `NPUTER_AGENT_ARGS=--dangerously-skip-permissions`
  / `NPUTER_AGENT_SCENARIO`, plus the fake's own seam variable set to a
  hostile value. **None reached the child by name, and none by value
  under another name.** The seam variable arrived carrying the SEAM's
  value — which proves the child's environment is **BUILT, not
  inherited**. Production reads exactly three env vars (`SHELL`, guarded
  to an absolute executable; `PATH`, twice) and has **no env-var binary
  override of any kind**.
- **NO MODEL IN ANY SUITE — PROVEN, NOT ARGUED.** A tattling `claude`
  shim was planted first on `PATH` **and** as `SHELL`, and a full
  `cargo test` run under it: 200 passed + 3 ignored, **tattle file
  ABSENT**. No suite resolves or executes any `claude`, real or
  poisoned. Structural, not conventional: every integration config sets
  `probe_login_shell: false`, and the one config that leaves it `true`
  never reaches resolution because `start_genesis` returns `noProject`
  first.
- **THE BYPASS PIN, drilled on all three spellings.**
  `--dangerously-skip-permissions`, `--allow-dangerously-skip-permissions`
  (a second spelling that genuinely exists in 2.1.226) and the mode
  string `bypassPermissions` were each planted into the adapter one at a
  time — red each time with the named message, clean after each revert.

**THE FOUR VERIFIER FINDINGS. s6 is the sharp one and it is a GATE.**
- **T-025-s6 — SESSION-ID INJECTION. Must close before T-029; not a
  backlog item.** `claude --help` shows `-r, --resume [value]` takes an
  **OPTIONAL** argument, and the captured session id is substituted into
  argv **unvalidated** — so an id beginning with `-` parses as a
  standalone flag rather than as `--resume`'s value. The verifier
  MEASURED it: injecting `"--dangerously-skip-permissions"` as the id
  yields the argv tail `["WebSearch", "--resume",
  "--dangerously-skip-permissions"]` **while the bypass pin stays
  green** — the pin guards the adapter table, not the substituted data.
  Unreachable today: only the CLI authors that id, and `send_turn`
  resumes from memory. **It becomes reachable at T-029, which reads the
  id off `.nputer/sessions.json` — a file on disk.** The suggestion
  carries a one-line fix and a pin extension. Close it before T-029
  builds on the registry, not after.
- **T-025-s4 — the Bash allowlist carries no path scope.**
  `--allowedTools` matches the COMMAND STRING, never the paths it
  touches. So `Bash(cp:*)` is a filesystem-wide read+write primitive
  (`cp ~/.aws/credentials ./docs/x.md` matches the pattern) and
  `Bash(mkdir:*)` creates directories anywhere. The criterion's "cwd
  scoping IS the containment" is true of `acceptEdits` and **NOT** of
  the Bash allowlist — a gap unnamed in the plan and in its silences.
  Not a rejection: the six patterns are the T-023-recorded imperative
  surface, and both verbs look avoidable (Read+Write is cwd-scoped and
  Write creates parents) — but making that change safely needs ONE
  observed real stage-0 run, which is exactly what s2 owns. **Read s2
  and s4 together.**
- **T-025-s5 — a `setsid()` grandchild outlives the group kill.**
  Reproduced with an independent double-forking fake: the ordinary
  grandchild dies with the group (both pids probed dead), a
  SIGTERM-ignoring child is correctly SIGKILLed and reaped with no
  zombie, but a grandchild that calls `setsid()` survives with its own
  pgid. A property of process groups, not a code defect — but the plan's
  §5 "no orphaned grandchildren", unqualified, overstates the mechanism.
  Practical exposure is nil while the allowlist has no daemonizing verb.
- **T-025-s7 — the kill grace is ALWAYS paid in full.** `pid_alive` is
  `kill(pid, 0)`, which is true for a **zombie**, and the turn's child is
  our own unreaped child — so the grace never short-circuits when the
  child dies promptly. Measured **3.035 s** of held single-flight latch
  on a 3 s grace with a child that dies on the FIRST SIGTERM. In
  production that is **~5 s of `busy` after a cancel**, and
  `reap_for_exit` blocks the **MAIN THREAD ~5 s on app quit**. Latency
  only, nothing unsafe — and worth watching for during the @human
  quit-the-app check below.

**THE BUILDER'S OWN TWO SELF-CAUGHT BUGS**, found by the tests it was
writing rather than by review: (1) a cancel that raced the stream EOF
was being reported as `ExitNonZero` — cancel is an OUTCOME, not an
error; (2) `MalformedStream`'s discrimination order put the init check
ahead of the no-JSON-at-all check, so a stream with nothing in it got
the wrong diagnosis. Both fixed in scope. The verifier then rebuilt the
discrimination boundary by hand with six constructed streams and
confirmed the order is right, including that the init check is
correctly **turn-1-only** and that an exit **0** carrying
`is_error: true` is still typed as a failure — so a CLI-declared
failure can never be relayed to the user as the planner's answer.

**WHAT THE REAL SMOKE FOUND, and it earned its keep.** Run once,
off-suite, against the installed `claude 2.1.226`. It could NOT observe
a real model turn — **this machine's `claude` OAuth token is revoked**
and every attempt 401s (a manual invocation with the FULL ambient
environment fails identically, so `env_clear` is not the cause and
forwarding a key would not have helped, besides being forbidden). What
it DID establish: the real CLI accepts the whole adapter argv; the init
line is captured (`native_session_id`, `model`); the registry is written
correctly; `--verbose` is still genuinely required (dropping it fails at
ARGUMENT-VALIDATION time, before any model call — measured, not
inherited). And **it found a real defect by failing**: the CLI reports
authentication failure **IN BAND on stdout** — an `api_retry` line with
`error_status: 401`, then a `result` line whose **`subtype` still reads
`"success"`** while `is_error` is true and `result` holds the actual
message — and writes **nothing to stderr**. The plan's §6 had assumed
the stderr tail would carry it, which is why the first run produced
`exitNonZero { code: 1, stderrTail: "" }`: a typed failure carrying no
information at all. `classify_line` now reads `is_error` and never
trusts `subtype`, and the observed lines are transcribed verbatim as a
regression fixture. Filed as T-025-s1.

**SUITES ON MERGED MAIN**, all four re-derived here first-hand, fresh
installs, ADR-011 order, and the app half re-run AFTER this checkpoint's
fixture edits and graph regen:
- lib/parser `npm ci` + `npm test` **159/159 (10 files)**, `npx tsc
  --noEmit` clean, `npm run build` clean.
- app `npm install` + `npx tsc --noEmit` clean + `npm run build` exit 0
  + `npm test` **483/483 (27 files)** — the merged expectation DERIVED,
  not assumed: main's 468 plus the branch's 15 new `agent-store.test.ts`
  tests, landing exactly. Bundle **442.05 kB, `index-DvrlAOQE.js` —
  byte-for-byte the same asset T-037's merge shipped**, and that is
  correct: nothing imports `agent-store.ts` yet, so Rollup drops it.
  Grepped to be sure (`genesis-turn`, `genesisStart`,
  `reduceGenesisEvent` → 0 hits in the bundle). **The runner's TS half
  is not in the shipped app until T-027 calls it.**
- app/src-tauri bare `cargo test` **200 passed + 3 ignored**, run
  **three times with identical aggregate counts**, plus five extra runs
  of the `agent_runner` target alone (24 passed + 1 ignored every time).
  **THE VERIFIER'S FLAKE DID NOT APPEAR HERE** — it reported one
  unreproducible red (23/1) in its very first 3× loop, could not
  reproduce it across 30 further runs, and lost the failure name. Eight
  runs at this merge, all green. It stays on the books as an
  **unreproduced, unnamed flake in `agent_runner`**: if anyone ever sees
  it, capture the test name and output VERBATIM before re-running —
  that name is the missing evidence.
- tools/e2e `npm ci` + `npx playwright test` **17/17 in 4.8s**,
  headless, one worker, its OWN vite. `npm run lint:tokens` **GREEN — 37
  files scanned, clean** (T-038's fix holding on a tree this branch
  adds no UI to), `--selftest` **43 samples green**.

Nothing ever bound or contacted port 1420: the runner opens no sockets
at all and no suite starts a server. No server left running. **No model
call was made anywhere in this merge** — the env-gated `#[ignore]` smoke
was deliberately NOT run, and the boot-check was not run.

**THE MERGE CONFLICT, resolved as forecast.** Exactly **two hunks**
conflicted, both in `app/test/architecture-dogfood.test.ts`;
`app/test/map-dogfood-render.test.tsx` auto-merged. Both sides had
reconciled the same fixtures for different reasons — main's T-037 merge
moved the GRAPH-derived numbers, this branch moved the REGISTRY-derived
ones (it declares C-14). (a) The dated addendum block: **kept BOTH**,
they record different events, with a third added below them for this
merge. (b) The "all 8x files map" title + `fileComponent.size`: took
**main's 86**, then this checkpoint's own regen moved it to 88. **The
trap, and I checked it explicitly rather than trusting the auto-merge:**
three main-side value changes auto-merge correctly and a take-one-side
resolution would have silently reverted them — `["C-05", 37]`,
`["C-05","C-10","confirmed",19]`, `["C-05","C-13","undeclared",4]`, and
**D1:C-05→C-13's four fileEdges**. All four verified present in the
committed tree alongside C-14's additions. The resolved file's diff
against main is exactly the branch's registry additions and nothing
else.

STANDING INTEGRATOR PRACTICE (T-009-s1, the ratified CONVENTIONS interim
regen rule; retires when T-014's `nputer index --check` becomes the
gate) — **THIRTEENTH** exercise. It FIRED and moved the graph to
**88 files, 595 symbols, 990 edges** (from 86 / 565 / 941 — **49 edges
added, ZERO removed**), 363,994 bytes, sha256
`a433638041054391c98499ab4e7b6809891a30c18df119a4db0a1ed6dfa24789` —
**byte-identical across two consecutive golden regens**, and the plain
(non-golden) ignored self-check PASSES, so the committed graph is
current. Still `languages: ["ts"]`, still **zero `.rs` files indexed**,
still zero `tools/` paths. Every number below was derived TWICE before
the fixtures were touched — once by enumerating the raw added/removed
file and edge sets against the pre-merge graph, once by re-running the
derivation engine — and the two agreed with each other and with the
branch's forecast:
- files 86 → 88: adds `app/src/lib/agent-store.ts` (C-14's own, by its
  explicit declared path) and `app/test/agent-store.test.ts` (C-05's, by
  the `app/test/**` umbrella); nothing removed. Content-changed
  (hash/loc only, symbol counts unmoved): the two dogfood fixtures and
  `lib/parser/test/smoke.test.ts` — i.e. exactly the three registry pins
  the BRANCH moved.
- mapping 86 → 88; **C-05 37 → 38, C-14 0 → 1**. Every other count
  holds — C-06 21, C-08 10, C-09 3, C-10 2, C-12 11, C-13 2. D2 stays
  empty, no unmapped node, `derived.issues` stays `[]`.
- findings: **one added, one cleared, net unchanged at eight rows.**
  **D3:C-14 CLEARS** (it has a file now) and a new undeclared
  **D1:C-05→C-14** appears with one file edge — the app/test umbrella
  reaching into C-14's store, the exact shape C-13 took at T-024.
  **C-14 appeared in the drift set and cleared inside a single merge**:
  the branch put it in `drift` and `declaredOnly` because it had no
  indexed file, and the regen takes it back out. That is the ritual
  working.
- relation table 27 → 28 rows: `C-05→C-14` lands **undeclared** at 1.
  Tally 13 confirmed / 5 undeclared / 9 planned → **13 / 6 / 9**.
  `C-14→C-10` **STAYS PLANNED at 0**, exactly as forecast:
  `agent-store.ts` imports only `@tauri-apps/api`, so no TS import can
  confirm the Rust-side `WatchState` dependency until T-010.
- **THE FIVE NEW `.rs` FILES ARE INVISIBLE, and the map therefore
  UNDER-REPORTS C-14 badly.** `app/src-tauri/src/agent/{mod,adapter,kit,
  runner,sessions}.rs` are ~3,200 lines and are C-14's larger half by
  far; its indexed footprint is **one TS file**. They join at T-010.
- The ceaa949 ordering lesson, **TENTH hold, measured not asserted**:
  regenerating BEFORE the fixture edits landed gave sha `be66245e…`;
  regenerating after them gives `a4336380…`. A regen-first ordering
  would have committed a stale graph.

FIXTURES RECONCILED. `app/test/architecture-dogfood.test.ts` (title and
`toBe` 86 → 88; `["C-05",37]` → 38; a new `["C-14",1]` row; the new
D1:C-05→C-14 finding; D3:C-14 removed; two test titles retallied to six
undeclared / three declared-only and 13/6/9; the new relation row; C-14
out of `drift` and `declaredOnly`) plus a dated addendum enumerating
every delta above and stating plainly that it SUPERSEDES the branch
block's absolute numbers. `app/test/map-dogfood-render.test.tsx` (27 →
28 edges, undeclared 5 → 6, C-05's drift count 3 → 4 in both places,
index hint 86 → 88). **Changed, never loosened** — every moved number is
still pinned by the same whole-array `toEqual` or exact `toHaveLength`,
and the map fixture gained a STRICTLY NEW assertion on the rendered
sentence "C-05 imports C-14 without declaring the dependency." so the
renumbering can never pass on a different finding.
**`lib/parser/test/smoke.test.ts` was correctly NOT touched here** — the
BRANCH already moved it (+C-14, eleven ids) because it declares a
component. That is the T-024 three-fixtures lesson holding: a component
DECLARATION moves three fixtures, a merge regen alone moves two.

INTEGRATOR JUDGMENT CALLS, recorded.
- **C-05→C-14 STAYS UNDECLARED**, the same call T-037's merge made for
  C-05→C-13 and for the same three reasons: the fixture's own
  maintenance contract names two actors (the integrator regenerates, the
  ARCHITECT changes the registry); a `depends_on` edit changes DERIVED
  OUTPUT (a finding drains, the tally moves to 14/5/9), which is a
  ruling; and draining a finding at the merge that created it destroys
  the signal before any architect reads it. **These two are one question
  asked twice and should be ruled together at the next triage.**
- **ARCHITECTURE: three truth-fixes, NO new table row.** The C-13
  precedent at T-024's merge governs — the table lists the seven
  top-level components and C-08…C-14 are C-05's children in the
  registry; C-12 and C-13 were not given rows, so C-14 does not get one.
  What DID move: C-05's status cell (it now registers C-14's four
  commands and the exit-reap hook, so the shell can spawn the planner
  although nothing in the UI calls it yet); the Interfaces **"Genesis:"**
  line, which described only the rendering half and now carries the
  SPAWNING half — the four commands, spawn-per-turn, resume by native
  session id, the built-not-inherited environment, and the fact that the
  `.nputer/` runtime files are **real rather than planned** — closing
  with what is NOT true (no UI calls it; never run against a real
  model); and the **"Code layout"** bullet, which gains app-agent's
  territory. That bullet also gained a note the next reader will need:
  **FOUR `.rs` files under `app/src-tauri/` are claimed by no
  component** — `acl_pin.rs` and `index_cmd.rs` (pre-existing) plus
  T-025's `src/bin/fake_agent.rs` and `tests/agent_runner.rs`. All four
  are invisible while the indexer is TS-only and become a live
  unmapped-territory question the moment T-010 lands. I did not edit the
  registry to fix it — same role boundary as above.
- **ROADMAP: rewritten honestly, and it does NOT claim the loop works.**
  Milestone 3's Progress line now says the MECHANISM exists and is
  proven against a fake CLI, that the one real-CLI smoke could not
  complete because this machine's OAuth token is revoked, that nothing
  in the UI calls the runner, and that **"by hand" is therefore NOT
  removed yet**. The remainder is T-027, T-028, T-029 plus one observed
  real turn.
- **NO NEW ADR** (three-prong, and I considered it rather than
  defaulting). The three candidates were real: this is the project's
  FIRST child-process spawn, it introduces an env allowlist policy, and
  it introduces a kill contract. All three are already chartered.
  **Spawn**: ADR-017 clauses 1/2/6 decide that genesis runs as the
  user's own CLI spawned and resumed headless behind Rust-side
  app-defined commands, and ADR-003 decides spawn-not-API; what T-025
  added was the TOPOLOGY (per-turn vs long-lived pipe), which is one
  component's reversible implementation choice and is recorded in the
  task file's §1 with its rejected alternatives. **Kill contract**:
  ADR-002 already rules that killing anything is safe because the files
  are the brain; T-025's group-kill is the mechanical realization, and
  its measured LIMITS are recorded as s5/s7 rather than as doctrine.
  **Env allowlist**: this was the closest call. The principle ("no key
  or token reaches the child") is ADR-003's "never holds API keys or
  proxies tokens" made mechanical, and the user-visible consequence (a
  user whose CLI auths only via an env API key cannot use in-app
  genesis) is already absorbed by ADR-017 clause 5, which makes
  hand-driven genesis a first-class universal fallback. It stays a
  C-14-local const with a source-level pin. **It will want a charter
  when a SECOND component spawns agents** — F-04's dispatch through C-02
  or C-04 — because the right answer there is genuinely not obvious: a
  CLI the user runs from their own shell inheriting that shell's
  environment is arguably correct, which makes "built, not inherited" a
  boundary rather than a universal. Flagged here so F-04's decomposition
  meets the question rather than re-deriving it. Prong two: nothing here
  contradicts any ADR — `EXPECTED_GRANTS` byte-identical (ADR-012 held),
  zero new crates and no lockfile line (ADR-011 untouched), no API call
  (ADR-003 held), the app writes nothing under `docs/` (ADR-017 held).
  Prong three: the durable calls are recorded in the task file's applied
  §§1–10 and its eight ruled deviations.

## In progress / broken right now
**NOTHING IS BUILDING.** No task is dispatched, no worktree is open —
the t025 worktree is removed and its branch KEPT alongside
t023/t024/t026/t036/t037/t038. Main tree clean; all four suites green;
the token lint green; the committed graph current.

**ONE STANDING RISK, and it is a scheduling one, not a defect**:
**T-025-s6 must close before T-029 starts.** T-029 is the task that
reads the native session id off `.nputer/sessions.json` and spawns from
it, which is the exact step that turns s6 from unreachable into
reachable. Treat it as a gate on that task's dispatch, not as a
backlog item.

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020), no
longer gated (T-038 closed the token lint). At the repo's first push
(`git remote -v` is still empty), confirm in order: the ubuntu
apt/webkit2gtk set installs; the three `uses:` SHA pins resolve;
playwright-on-Linux runs the lane; `cargo audit` behaves as it does
locally; the xvfb `tauri dev` boot prints both `[nputer]` startup lines.
AND (T-018-s3 fold) the THREE T-018 SENTINEL LIVE TESTS inside the
ubuntu `cargo test` step — replaced-wholesale and deleted-recreated
docs/. They discriminate only where inotify watches INODES; macOS
FSEvents watches paths and was accidentally resilient, which is why
T-018's replace-half evidence is mechanism-only today. Green there
CLOSES that evidence gap; red there is a real reconcile gap macOS could
never surface, and gets filed immediately. This run also closes
T-001/T-003's Linux halves, and it carries T-026-s1 (the plan probe's
exact-case match makes macOS and Linux disagree about "already has a
plan") and T-021-s1 (the ACL pin is macOS-derived). **New with this
merge**: the ubuntu `cargo test` step now also runs the 24 `agent_runner`
integration tests, which spawn real child processes and send real
signals — the first time this repo's CI exercises process control on
Linux. Watch it, and watch for the unnamed `agent_runner` flake there
too.

## Next up (1–4)
1. **@human — THE VISUAL SESSION IS OPEN AND UNCHANGED BY THIS MERGE.**
   T-025 ships **zero UI** and its store is not even in the bundle, so
   every item below stands exactly as the T-038 checkpoint left it.
   **The route to the pane**: "Start an interview" on a docs-less
   folder, or "Start an interview here" on a folder the app just
   refused.
   - **T-024's pane, light AND dark** — the item this session was
     scheduled on: built/forming/slot card contrast in dark, the warm
     writing-row border, the five type sizes that moved 0.5–1px, and the
     substituted footer right slot (`stage ~4 · constraints`).
   - **Two framing questions that exist only because of the mount.**
     (a) T-024 drew the pane as the **RIGHT HALF of a split view**;
     until T-027 it sits **full-width inside T-026's card frame**. Does
     its `bg-sidebar` ground read right framed by a `bg-card` bordered
     box — a sidebar tone inside a card, which the design never draws?
     And does the **five-across backbone grid** still hold at full width
     when it was drawn for a half-width pane? **This is the question
     T-027's planning pass waits on** (see item 2). (b) The slot is
     `min-h-0 flex-1` so the pane's own `overflow-y-auto` scrolls — but
     the shell's column is **`min-h-screen`, not `h-screen`**, so at
     very short window heights the page may grow before the pane's own
     scroll region engages. One look at a short window with the complete
     tree loaded.
   - **T-026's front door, light AND dark**: the two-button row and the
     "No plan in &lt;folder&gt;" card against the design's `open a
     folder` screen — button sizes/inks, the checklist ○/✓ (the ✓ rides
     `--review-disc`, whose dark value #4ecf9e is a token-family
     derivation, not measured from a dark mockup), the card's 10px vs
     the design's 12px radius, and whether the footnote reads as a
     footnote.
   - **The at-a-glance amber judgment** (T-012 criterion 5's human half
     — drift stroke vs building/verifying fills, BOTH schemes, incl.
     composed building+drift; the dogfood hero renders it live). Note
     C-05's drift count reads **4** now, not 3.
   - **The launch-shot re-judgment** (T-006's pending screenshot
     predates the rail — light + dark now include it).
   - **The T-023 dry-run conversational quality judgment** (did the two
     "pushing back:" challenges actually challenge; the founder was
     builder-scripted in-session, so true cold-context evidence still
     arrives with T-029).
   - **T-026-s4's question**: point the app at a folder whose `docs/`
     holds files but no plan (a lone ARCHITECTURE.md). It renders
     **through the lens** now, as the pane's own `docs/ · 0 files
     written` scaffold with `expected` placeholder rows and north star
     `forming…`. Judge whether THAT reads right over a non-empty docs/.
   - **The real picker flows on the real screen** — the standing T-007
     checklist, still @human because native dialogs are unreachable from
     a browser harness and tauri-driver has no macOS: "Start an
     interview" → native dialog → a docs-less folder lands on the
     genesis screen; ⌘N and ⌘O on the front door; "Start an interview
     here" on a folder the app just refused; a folder that already has a
     plan → the board, not genesis.
   - **NEW, from T-025 — the `tauri dev` quit-the-app orphan check.**
     The runner's criterion says child processes SHALL not outlive the
     app, and the exit hook is proven at unit level through its seam,
     but the real quit is a screen action this pipeline cannot take.
     Start a `hang`-scenario genesis in a scratch project, quit the app,
     confirm no orphan — **and watch for T-025-s7's ~5 s main-thread
     hang on quit**, which is expected, harmless, and worth confirming
     is only ~5 s.
   - **NEW, from T-025 — ONE REAL OBSERVED PLANNER TURN, on an
     authenticated machine.** This is the biggest unobserved thing in
     the project right now. This machine's `claude` OAuth token is
     revoked, so no model call has ever gone through the runner. Two
     separate questions ride on it: does the kickoff land a real planner
     in stage 0 (the conversational half), and is the six-pattern Bash
     allowlist sufficient for a real stage-0 scaffold (which is what
     T-025-s4 needs before it can narrow `Bash(cp:*)` / `Bash(mkdir:*)`
     safely). **T-025-s2 carries the exact command.**
   - **A Linux run** — the "watch the first CI run" item above.
2. MILESTONE 3 (T-023…T-029, ADR-017). **T-027 (interview split view,
   L) is UNBLOCKED by this merge** — its `blocked_by` [T-024 ✓, T-025 ✓,
   T-026 ✓] is fully satisfied and it is the next task in the app-shell
   lane. **IT IS DELIBERATELY NOT DISPATCHED.** T-027 builds the LEFT
   half of a composition whose whole design question — the pane
   currently renders full-width where it was drawn as the right half —
   is precisely what the human is judging in the open visual session
   (item 1a). Dispatching its size-L planning pass before that verdict
   would have the planner guess the answer the human is in the middle of
   giving. Its planning pass waits on that verdict. T-028/T-029 behind
   it, and **T-029 additionally waits on T-025-s6** (see above).
   The milestone itself is NOT claimed: the first slice delivers
   hand-driven genesis, and the runner exists, but no agent loop has run.
3. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16 night): the app-shell
   lane queue was T-021 → T-026 → T-025 → T-022; **T-021, T-026 and
   T-025 are all DONE**, so the standing grant's next named item is
   **T-022**, with T-027 ahead of it in milestone order but held for the
   visual verdict. Milestone 3 runs through T-029 as blockers clear.
   Triage: APPLY granted — but tasks NEWLY created by triage do NOT
   dispatch without the human. Unchanged method rules: a second REJECTED
   on any task parks that lane for the human; @human judgments are never
   self-answered.
4. Suggestion backlog for the NEXT TRIAGE — **31 suggestion files on
   disk**, counted at this merge, none dispatched. **Three are parked in
   place** (T-008-s1 awaits F-04/F-05 layout decisions, T-018-s1 awaits
   a Windows lane, T-003-s2 is already encoded) and **T-024-s2 is
   DISCHARGED** (C-13's D3 cleared at T-024's own merge — resolve it, do
   not schedule it). That leaves **twenty-seven** genuinely awaiting
   disposition: T-020-s3 · T-020-s6 · T-021-s1 · T-021-s2 · T-021-s3 ·
   T-024-s1 · T-024-s3 · T-024-s4 · T-024-s5 · T-024-s6 · **T-025-s1 ·
   T-025-s2 · T-025-s3 · T-025-s4 · T-025-s5 · T-025-s6 · T-025-s7** ·
   T-026-s1 · T-026-s2 · T-026-s3 · T-026-s4 · T-026-s5 · T-026-s6 ·
   T-026-s7 · T-036-s1 · T-038-s1 · T-038-s2. **Read the T-025 seven in
   this order: s6 first (it is a gate on T-029, not a suggestion), then
   s2+s4 as a pair (s4 cannot be actioned safely until s2's observed run
   happens), then s1/s3/s5/s7.**
   **CORRECTION OF THE PREVIOUS BATON**: the last two entries said the
   `T-037-s1` file was still on disk and wanted one `git rm`. **It is
   already gone** — commit `f502d0c` removed it while absorbing it into
   T-038, before that STATE was written. Observation (b) is DISCHARGED;
   the T-016 encoding is complete for that pair. Verified by
   `--diff-filter=D`, not assumed.
   INTEGRATOR OBSERVATIONS for the same triage:
   (a) **RULE ON C-05→C-13 AND C-05→C-14 TOGETHER.** They are the same
   question — the shell's umbrella and its source reaching a child
   component that the registry does not list as a dependency — and both
   are now live undeclared D1 rows the map draws. Declare both, declare
   neither, or write down why umbrella test edges do not count. My
   reasoning for leaving them is above; it wants an architect.
   (b) **THE T-010 UNMAPPED-TERRITORY PROBLEM IS NOW BIGGER THAN IT
   LOOKS.** Four `.rs` files under `app/src-tauri/` are claimed by no
   component (`acl_pin.rs`, `index_cmd.rs`, `src/bin/fake_agent.rs`,
   `tests/agent_runner.rs`), and C-14's declared Rust half is ~3,200
   lines the map cannot see at all. The moment T-010 lands, the dogfood
   fixture's "zero unclaimed territory" assertion goes red and C-14's
   file count jumps. That is a REGISTRY question to settle before T-010
   builds, not at its merge.
   (c) **SIXTEEN open suggestion files still carry no `id:` field**
   (re-verified by grep at this merge — the count held across eight new
   files because T-025's seven and T-038's two all carry one). The T-016
   encoding requires an id at parking and the parser accepts the
   omission silently, which is why it keeps recurring. Worth a rule,
   same family as T-030's parser-strictness pass.

## Open questions
None.
