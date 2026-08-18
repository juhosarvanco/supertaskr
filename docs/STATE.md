# State

Updated: 2026-08-18 by integrator (T-060 merged and checkpointed),
gpt-5.6 @fresh

## Just completed

**T-060 — the resolver trusts nothing it did not just prove.** F-03,
milestone 3, size M, nine acceptance criteria, absorbing T-047-s1,
T-047-s4, T-047-s5 and T-047-s6. `touches: [app-agent]`. Built by
`claude-opus-5 @fresh`, independently verified by `codex/gpt-5 @fresh`,
`review: independent`. Approved branch tip **`a5f31f2`**. Merge
**`91ab46e`**.

T-060 removes the resolver's disk cache rather than trying to make a
poisonable file slightly safer. `agent-paths.json`, its serde types,
reader, writer, invalidator, path helper and `RunnerConfig::config_dir`
are gone. Resolution is now the Rust test seam, then one fresh probe,
then typed `cliNotFound`. A future performance cache, if measurement
ever justifies one, is constrained in the source to a process-lifetime
memo and never a file.

Every path produced by `PATH` search or login-shell `command -v` passes
one gate before `Command::new`: absolute, no raw or component `.`/`..`,
file name equal to the adapter binary, executable. Relative, empty and
dot PATH entries can no longer turn the app's launch directory into an
execution source. `$SHELL` must be an absolute executable named `zsh`,
`bash` or `sh`; other values fall back to `/bin/zsh`. The docs now state
the exact boundary: `RunnerConfig` reads no environment, the resolver
reads `SHELL`, `PATH` and `NPUTER_NO_REAL_CLI`, and the spawned child is
still built with `env_clear()` plus the unchanged 16-entry allowlist.

No ordinary Rust test can resolve the user's real CLI. With
`NPUTER_NO_REAL_CLI` unset, the refusal is derived from Cargo's `deps`
test-binary directory and rustdoc's `rustdoctest*` directory; the one
ignored, explicitly gated real smoke opts out with `=0`. The doctest is
itself the pin for the environment the first implementation missed.

### The rejection is part of the result

The approved branch preserves the first verifier's **REJECTED** verdict
at `33b249a`. The initial proof temporarily set a process-global guard in
a multithreaded libtest binary. Its sibling tripwire, whose purpose was
to prove nothing needed setting, observed that lift and flaked at
realistic thread counts. The rejection reproduced before repair: 5/5
failures at 4 threads and 5/5 at 8 on the historical binary; the quiet
10-thread control was 0/5.

Fix `3fbb04b` moves the guarded and lifted arms into child processes.
Each child receives a composed environment and an empty PATH; the parent
requires a successful child, exactly one passed test, and the guarded
arm's separate receipt. The final verifier ran the repaired binary 10/10
green at 4, 8 and 10 threads and approved it in `a5f31f2`. The pre-approval
acceptance section and prior verdict were preserved; the approved verdict
records their hashes.

## Integration evidence

### Preflight and semantic merge

Main was clean at checkpoint `1288d8d`; the approved worktree was clean
at `a5f31f2`; their real merge base is `6404a43`. The two sides intersect
in exactly two files:

- `app/src-tauri/src/lib.rs`
- `docs/ARCHITECTURE.md`

`git merge-tree --write-tree --messages 1288d8d a5f31f2` completed with
no conflict and produced simulated tree **`f02d789a`**. The actual no-ff
merge auto-merged the same two files and produced **`91ab46e`**.

The `lib.rs` result keeps all of T-063: `STARTUP_FAILED_EVENT`, the
`startup-failed` stderr listener, `startup_failed_line`, and all five of
its unit tests. T-060 changes only the runner setup, deleting the
`config_dir` override and supplying `RunnerConfig::default()`. The
generated-handler block is byte-identical at the base, main-before,
approved tip and simulated result:

    sha256 4e062a2e898297c96601daa078e5960285df5e4b1117514e4a9e0d2c04ebbdc3

All thirteen handler entries remain. The architecture auto-merge keeps
T-063's startup-failure channel and T-062's one-scroll-model history,
while replacing T-047's obsolete cache description with T-060's actual
probe, gate and test-refusal contract.

### Full suite on merged main

ADR-011 order was respected. Existing lockfile-resolved installations
were used; no model, real-CLI smoke, dependency install or network call
was made.

- `lib/parser`: build and `tsc --noEmit` green; **225/225 tests in 11
  files**.
- `app`: `tsc --noEmit` and production build green; **821/821 tests in
  42 files**. Bundle: `index-tsWZtfZi.js` 498.88 kB and
  `index-BeT5MY7f.css` 43.90 kB.
- `app/src-tauri`: bare `cargo test` green; **325 passed + 3 intentional
  ignores**, zero failures. This is the approved branch's 320 plus five
  preserved T-063 startup tests. The one T-060 doctest ran and passed;
  the ignored real-model smoke did not run.
- `tools/e2e`: typecheck green; **82/82 Playwright executions**, one
  worker, retries 0, no skips. The sandbox first refused the local bind
  with `EPERM`; the exact lane passed with local-port permission on
  scratch port 17650.
- token lint: **clean over 117 files**, zero allowlist; `--selftest`
  **49 samples + 14 walk-policy checks** green.
- `cargo audit --no-fetch`: exit 0 over **472 locked crates**, **0
  vulnerabilities / 17 allowed informational warnings**, the unchanged
  baseline. It loaded the existing 1,216-advisory local database; failure
  to take Cargo's package-cache lock was informational and did not change
  the scan or verdict.

### Boot gate — fired and passed

The trigger is the merge range `1288d8d..91ab46e`, not the old branch
point. It contains three files under `app/src-tauri/**`, zero under
`app/src/**`, and neither manifest. `NPUTER_BOOT_PORT=17651 npm run
boot:check` exited **0** and detected both required lines:

    [nputer] project folder: /Users/ujju/Projects/nputer
    [nputer] window "main" created

The gate stopped its process tree. Port 1420 was never selected or
borrowed.

### Graph gate — did not fire; graph remains current

The merge contains no `*.ts`, `*.tsx`, `*.js` or `*.jsx` outside docs,
so graph regeneration correctly did not fire. The currentness gate was
still run from merged main and exited 0:

    graph.json is CURRENT
    558780 bytes · 115 files · 965 symbols · 1476 edges

The committed SHA-256 remains
`4bd19d87732e999a6b697ee42829d30a8033cb9d06cea4117262d174761852f1`.
The repository still has no remote, so this written CI gate remains
dormant; the checkpoint does not rely on it having run elsewhere.

### Poison discipline — all twelve changed/new bodies discriminated

The integrator independently made one relation-breaking mutation in
each of the seven changed/new unit-test bodies in `runner.rs` and five
changed/new integration-test bodies in `tests/agent_runner.rs`. Every
exact-body run failed: **12 red out of 12 bodies**. The mutations broke
the config/environment boundaries, resolved-path expectations, deleted-
cache pin, shell-name gate, test guard, relative-path refusal, disk-cache
absence, child PATH provenance, integration guard and child-process
non-vacuity receipt/filter path.

Restoration is byte-proven and the two files have an empty diff from the
merge commit:

    runner.rs        fe6faf86c3466e91fd4979f5e5e40532d078afdd6eef8a6ad066a53757d62da1
    agent_runner.rs  9eb4261986316bcb1d2e05a583828eda0e70c0b621d1c4e9bccbab866614bdef

The final bare Rust suite was rerun after restoration and stayed green.

## Documentation and decision judgment

- **ROADMAP edited.** T-060 changes the trust boundary between disk,
  environment and `execve`, records the preserved rejection, and makes
  clear that this hardening does not supply the still-missing real-model
  genesis evidence.
- **ARCHITECTURE edited.** The resolver interface now records no disk
  cache, one gate on both probe sources, the three environment reads,
  name-checked shell, structural test/doctest refusal and the remaining
  shape-not-identity residual.
- **Registry not edited.** No component, ownership path or relation
  changed. The Rust resolver remains under C-14; the current graph does
  not index Rust.
- **No ADR.** This closes filed defects inside the existing ADR-003 and
  ADR-017 boundaries. No dependency, IPC command, capability grant,
  manifest, lockfile, method contract or cross-component interface moved.
- **Task stamped done.** Builder/verifier stamps and `review:
  independent` were already committed on the approved branch. The prior
  rejection and later approved verdict remain intact. Checkpoint changes
  only `status: verifying` to `status: done` plus two confirmed prose
  corrections: the parent owns the guarded receipt check and `3fbb04b` is
  described as the then-HEAD. The suspected EOF issue was checked but not
  changed: the task ends in exactly one LF, matching the neighbouring
  completed task cards rather than carrying an extra blank line.

## In progress / broken right now

No task is building or verifying at this architect checkpoint. T-060's five
finding cards remain `status: suggested` as historical records of its first
build and verification; s1 through s5 are closed in the parent task and do
not need separate implementation lanes.

T-062-s3 is no longer a ghost. Architect triage promoted it to **T-066**:
the parse-error list remains an unbounded sibling above `board-scroll`, and
an independent current-head browser reproduction still reopens page scroll
and collapses the board. The count is message-wrap dependent; the invariant
is not. T-066 keeps short diagnostics outside the board and gives the list a
token-backed ceiling plus its own scroll.

T-043, T-056, T-057 and T-058 were re-derived before dispatch rather than
trusted from older line numbers. T-056 now covers both live and T-029
rehydrated turn identity. T-057 absorbed T-063-s7, T-063-s4 and T-062-s5 and
corrected two stale premises. T-058's P5 control-byte corpus now includes the
docs/method/root records succession depends on. T-043 remains planned but is
not in the immediate wave: an early direct-child reap must not abandon a
resistant same-group grandchild, the old card claimed a fixture that does not
exist, and its honest touch set includes app-shell.

Still untriaged after this bounded pass: T-062-s4, the map's horizontal
wheel/native-scroll double movement, and T-063-s2, the four cross-language
event names with no mechanical join.

## Next up

1. Dispatch one conflict-free wave from the checkpoint that follows this
   triage: T-066 (`app-shell`, `tools/e2e`), T-055 (`lib-parser`) and T-056
   (`app-interview`). T-057/T-058 wait because each overlaps T-066; T-043
   waits because its corrected touch set includes app-shell.
2. Integrate serially after fresh verification, regenerating the graph for
   each indexed TypeScript merge and firing boot for shipped app changes.
3. Triage T-062-s4 and T-063-s2 before selecting the following wave. T-057
   and T-058 can then run together once T-066 releases their components.
4. Run the human-owned authenticated genesis below. Milestone 3's task
   work, including resolver hardening, is through the pipeline; the
   product evidence is not.

## Human-owned evidence and decisions

- **Real genesis run:** authenticate the supported CLI, then perform one
  timed end-to-end genesis on a toy idea, target <=30 minutes, with light
  and dark completion screenshots. No planner turn has yet succeeded
  against a real model on this machine.
- **Relaunch the desktop app.** A long-running process may predate
  T-051, T-063, T-062 and T-060. Relaunch is required to load the current
  Rust resolver, startup listener and window contract together.
- **T-062 visual judgment:** decide whether the bounded shell and its
  internal board/map scrollbars feel right in both schemes.
- **Stray real-smoke directories:** the two pre-existing
  `nputer-t025-realsmoke-*` session directories remain a human
  delete-or-keep decision; this integration did not touch them.
- **Repository remote:** there is still no remote. CI, including graph
  currency and xvfb boot, has never run on a real runner.

Milestone 3's implementation list is complete, but the milestone is not
claimed until the real timed genesis exists. T-060 proves the resolver
cannot accidentally call the developer's CLI from the test suite; it
does not prove an interview with a model that can misunderstand the user.

## Health of the tree

At the T-060 checkpoint:

- main has T-060 merge `91ab46e` plus this checkpoint;
- parser, app, Rust, E2E, token lint, audit, boot and graph-currentness
  gates are green;
- committed graph: **115 files / 965 symbols / 1476 edges**, SHA-256
  `4bd19d87732e999a6b697ee42829d30a8033cb9d06cea4117262d174761852f1`;
- board on main: **130 task files — 46 done / 19 planned / 16 parked /
  49 suggested / 0 building / 0 verifying**, plus **9** files under
  `docs/tasks/rejected/`;
- **45** merge commits match `^Merge T-`, representing **45 distinct
  task IDs**; there are 46 done cards because T-040 is done without a
  matching task merge;
- the clean approved T-060 worktree is removed after this checkpoint;
  branch `task/T-060-resolver` is retained at `a5f31f2`.

Security movement for T-060: zero dependencies, zero manifest or
lockfile lines, zero new IPC commands, zero capability grants, zero
allowlist entries, zero model calls. `acl_pin.rs` remains SHA-256
`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`
with 92 grants. `ENV_ALLOWLIST` remains 16 entries and byte-identical to
base.

## Open questions

- Should resolver identity ever be stronger than path shape, and what
  install identity could be verified without trusting another writable
  file?
- Should T-062's frame invariant cover parse-error states universally?
- Should map wheel input pan, natively scroll, or choose one by axis?
- What gate owns a contract spelled independently across Rust and
  TypeScript? T-063's `startup-failed` event remains the live example.
- Does the shared main worktree need a formal rule for what reaches a
  human's running app before a relaunch?
