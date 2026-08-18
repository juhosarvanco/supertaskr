---
id: T-060
title: The resolver trusts nothing it did not just prove — retire the cache, gate the probe, forbid the real CLI in tests
feature: F-03
milestone: 3
priority: 10
size: M
status: verifying
blocked_by: []
touches: [app-agent]
builder: claude-opus-5 @fresh
verifier: claude-opus-5 @fresh
built_by: claude-opus-5 @fresh
verified_by: claude-opus-5 @fresh
review: same-model
---

Absorbs: T-047-s1, T-047-s4, T-047-s5, T-047-s6 (triage 2026-08-17).
The suggestion files are removed in the same commit as this card.

Four findings inside the same forty lines of `runner.rs`, and three of
the four say so themselves ("folds naturally into T-047-s1 if the
resolver is being reshaped anyway"). STATE names these as the sharpest
open set in the project and records that there is NO STANDING SECURITY
GATE — T-025-s6 closed at T-039 and nothing replaced it.

SERIALIZE app-agent with T-043, which is building on the same
component.

Re-verified at triage: `read_cache`/`write_cache` at `runner.rs:639`
/`:646`; `std::env::var("SHELL")` at `:447` and `:502`;
`which_on_path` at `:547` calling `which_in` at `:552`;
`RunnerConfig::default()` still ships `probe_login_shell: true` at
`:194`.

THE UNIFYING SENTENCE, and it is why these are one card: the code
already knows which values it would not trust from a file, and runs
them anyway. `validate_cached_binary` calls a relative path
`NotAbsolute` and discards it; the probe arm executes it.

## Acceptance criteria
- THE RESOLVED-BINARY CACHE SHALL BE RETIRED — `CacheFile`,
  `CacheEntry`, `read_cache`, `write_cache`, `invalidate_cache` and
  resolution step (1) deleted; `resolve_cli` becomes
  probe-then-typed-not-found. Its stated justification is already
  gone (`runner.rs:227` says the file exists "so the login-shell
  probe runs once per install rather than once per turn", and T-047
  took the not-cached arm on the PATH, so the login shell is spawned
  on every resolve anyway), the probe already returns the binary path
  in the same spawn, and the measured cost of not caching is ~7 ms
  against the 47–50 ms `claude --version` probe the same resolve runs
  unconditionally. The whole file-to-exec class stops existing rather
  than being narrowed (T-047-s1).
- IF a heavy login shell is measured as a real cost (a `~/.zshrc`
  doing nvm/rbenv/conda init can be hundreds of ms — the one input
  the suggestion did not have) THEN the answer SHALL be a
  PROCESS-LIFETIME memo of the probe result, never a file, keeping
  both the cheapness and the no-file-to-poison property. The
  measurement SHALL be taken and recorded either way.
- THE FRESHLY-PROBED PATH SHALL PASS THE SAME GATE the cached one had
  to: absolute, no `.` or `..` component, name equal to
  `adapter.binary`, executable — with a failure treated as "this
  probe found nothing" (fall through to the next arm, then to typed
  `cliNotFound`). `which_on_path` reads the APP's inherited `PATH`
  and hands each entry to `which_in`, which does `dir.join(binary)`,
  so a RELATIVE PATH entry (a dot, an empty element meaning CWD, a
  bare directory name) produces a relative binary path that is
  EXECUTED — reproduced by T-047's verifier with a tattler:
  `resolve_cli -> Ok(ResolvedCli { path: "relbin/claude", … })`,
  `TATTLE EXISTS: true`, `would the CACHE gate have accepted it?
  Err(NotAbsolute)` (T-047-s5).
- `$SHELL` SHALL be name-checked against the shells whose `-l -c`
  semantics the script actually relies on (`zsh`, `bash`, `sh` —
  noting fish's `-l -c` differs), falling back to `/bin/zsh`
  otherwise; OR the environment SHALL be dropped as an input in
  favour of the OS's own record. Today any absolute executable named
  anything is run with `-l -c <script>` (T-047-s4).
- THE `RunnerConfig` COMMENT SHALL BE SCOPED HONESTLY. Its doc
  comment says "production reads NOTHING from the environment" and a
  test pins it (`default_config_reads_nothing_from_the_environment`)
  — true of the CONFIG and false of the RESOLVER two functions away.
  A reader of that pin would not guess `SHELL` picks the program
  (T-047-s4).
- NO TEST SHALL BE ABLE TO RESOLVE THE USER'S REAL CLI, structurally
  rather than by discipline. `resolve_cli` SHALL refuse the
  login-shell and `which_on_path` arms when a guard variable is set
  (`NPUTER_NO_REAL_CLI=1`), set once for the whole suite, with the
  one env-gated real smoke unsetting it deliberately. Today the
  property lives in a field every test must remember
  (`..RunnerConfig::default()` is the idiom, and the default is
  `true`) and it FAILED: T-047's verifier accidentally spawned the
  developer's real `claude` with the genesis planner prompt from
  `cargo test`. No model ran and no tokens were spent only because
  the token is revoked — that is luck, not a control (T-047-s6).
- THE GUARD SHALL BE PROVEN BY THE ATTACK THAT FOUND IT: reconstruct
  the verifier's accidental configuration (`probe_login_shell: true`,
  `binary_override: None`, no cache entry, a controlled `$SHELL` that
  answers the PATH question and fails `command -v`) and assert it now
  resolves to typed not-found instead of reaching the developer's
  machine. A guard nobody has watched refuse is a guard nobody has
  watched.
- THE PINS THAT GUARD DELETED CODE SHALL BE REWRITTEN, not dropped:
  `the_resolution_cache_stores_a_path_and_never_a_login_path` and the
  poisoned-cache integration tests become "there is no cache to
  poison", which is a strictly stronger assertion.
- BLAST RADIUS: `runner.rs` and the suites' shared setup. No new
  grant, no new IPC, no new command. `acl_pin.rs`'s 92-grant set
  byte-unchanged and proven so.

Verification: headless — bare `cargo test` from app/src-tauri/, with
the relative-PATH attack and the accidental-real-CLI path each shown
refused. No model call, no network. @human: the stray session
directories T-047-s6 left outside the repo are a delete-or-keep
decision and are on STATE's list — there are now several, not one.

## Implementation notes

Built by `claude-opus-5 @fresh` in `../nputer-T-060` on
`task/T-060-resolver`, based on `6404a43`. **Five commits**, all four
suites green first-hand, `cargo test` **319 passed / 0 failed / 3
ignored**, exit 0, **zero warnings** (baseline 313/0/3).

### The measurement criterion 2 demanded, and it inverts the worry

Taken by hand at the shell, medians of 8–15 runs, this machine,
2026-08-18:

| what | ms |
|---|---|
| `zsh -l -c 'command -v claude && echo …$PATH'` — this machine | 3.7–7.8, **median 4.0** |
| the same with a 4000-line `~/.zshrc` + `compinit` | **unchanged — the file is never read** |
| the same with a conda/pyenv/rbenv-shaped `~/.zprofile` (3 interpreter spawns) | 41–47, **median 41** |
| `claude --version` — run unconditionally by the same resolve | 39–42, **median 40** |

**THE INPUT THE SUGGESTION DID NOT HAVE.** `zsh -l -c` is a
NON-INTERACTIVE login shell: it reads `.zshenv`, `.zprofile` and
`.zlogin` and **does not read `.zshrc` at all**. Verified with marker
files in each of the four (`bash -l -c` behaves the same way, reading
`.bash_profile` and not `.bashrc`). nvm, rbenv, pyenv and conda all
install their init into `~/.zshrc` by default — the one file this probe
never sources. The feared "hundreds of ms" case therefore needs a user
who hand-moved that init into `.zprofile`, and even that measures at
PARITY with the `--version` probe already being paid.

**VERDICT: no memo, no file.** Criterion 1's plain
probe-then-typed-not-found stands, and the ruling on what a future cache
may look like (a process-lifetime memo, never a file) is written into
`runner.rs` where the cache used to be.

**One correction to the card**: the `--version` probe is **~40 ms** here,
not 47–50. The login-shell figure (~4 ms vs the card's ~7) reproduces in
shape. The conclusion is unchanged and slightly stronger.

### What was built, criterion by criterion

1. **The cache is RETIRED.** `CacheFile`, `CacheEntry`, `read_cache`,
   `write_cache`, `invalidate_cache`, `cache_path`,
   `RunnerConfig::config_dir` and resolution step (1) are deleted, and
   so is `lib.rs`'s `config_dir:` — the app now hands the runner a bare
   `RunnerConfig::default()`. **`probe_login_path` went too**: its only
   caller was the cache-hit arm, so retiring the file also removed a
   resolve path that could spawn the user's login shell TWICE, and took
   the resolver's `$SHELL` read sites from two to one.
2. **One gate, every door.** `validate_cached_binary` →
   `validate_resolved_binary` (the old name was a lie once the cache
   went), applied inside `which_in` to every candidate a search path
   produces and again to whatever `command -v` printed, before
   `probe_version`'s `Command::new`.
3. **`$SHELL` is name-checked** in the new `login_shell()` against
   `zsh`/`bash`/`sh`, `/bin/zsh` otherwise, with fish's differing
   `-l -c` named as the reason.
4. **`RunnerConfig`'s doc comment is scoped honestly** and lists the
   resolver's three environment reads, with a companion pin that
   re-derives that list from the source so the comment cannot silently
   go stale.
5. **`NPUTER_NO_REAL_CLI`**, and it is stronger than the criterion
   asked. `=1` forbids the two real-CLI arms, `=0` permits them, and
   **UNSET is DERIVED**: forbidden iff the process is a cargo test
   binary, which cargo runs out of `<target>/<profile>/deps/`. Nothing
   is set, exported, wrapped or remembered, so a test file written next
   year inherits the refusal.
6. **The guard is proven by the attack that found it** —
   `the_configuration_that_reached_the_real_cli_now_resolves_to_typed_not_found`
   reconstructs T-047's verifier's config verbatim, with a TATTLING
   `$SHELL` so "the shell never spawned" is measured rather than
   inferred.
7. **The pins that guarded deleted code are rewritten, not dropped.**
   `the_resolution_cache_stores_a_path_and_never_a_login_path` →
   `there_is_no_cache_to_poison`; the poisoned-cache integration tests →
   `there_is_no_agent_paths_json_to_poison_at_any_door`, which plants the
   entry T-047's gate **accepted** rather than one it refused, and
   asserts no `agent-paths.json` is ever written by walking the whole
   temp tree.
8. **Blast radius held**: `acl_pin.rs` a 0-file diff, `ENV_ALLOWLIST`
   byte-identical, no new grant, no new IPC command, no new dependency,
   no bypass-permissions flag, no lockfile line.

### WHY A `.cargo/config.toml` `[env]` ENTRY WAS REJECTED

The criterion says the guard is "set once for the whole suite", and
`[env]` is the obvious mechanism. **It would have broken the human's
app.** Cargo applies `[env]` to `cargo run` as well as `cargo test`, and
`tauri dev` IS `cargo run` from `app/src-tauri` — so the development app
would have inherited `NPUTER_NO_REAL_CLI=1` and rendered the hand-driven
fallback forever, three days before the milestone-closing genesis run.
The derived default reaches the same property without touching anything
outside the crate.

### FOR THE VERIFIER — the two things a drill caught, and the one I hit

- **A poison drill caught both relative-PATH tests passing for the wrong
  reason.** Reverting `which_in` to `is_executable_file` left them
  GREEN, because `relbin/claude` did not exist relative to the test's
  CWD and the old check refused it too. Both now plant their fixture
  under the test's own working directory (`target/`, gitignored, unique
  per pid+ms, removed after) and ASSERT the fixture is reachable
  relatively before relying on it. Re-drilled: the unit body goes RED.
- **The integration body stays green on that single mutation and reds
  only when BOTH gates go.** That is defence in depth measured, not a
  gap — `which_in` gates each candidate and `resolve_cli` gates the
  probe's answer.
- **T-060-s1 — I reproduced T-047-s6's accident myself, inside the test
  meant to prove it cannot happen.** The first draft of the guard's
  discriminating half lifted the guard while `$SHELL` still failed
  `command -v`, so resolution fell through to `which_on_path`, read my
  own `PATH`, found the real `/opt/homebrew/bin/claude` and executed it
  with `--version`. No model ran and no tokens were spent — it is a
  version banner — but it is the same class of accident. Fixed twice
  over: the lifted arm now uses a shell whose `command -v` names the
  planted fixture, and a PRE-FLIGHT assert at the top of that body fails
  before the first resolve if the guard is already off.

### WHAT I DID NOT DO

**T-029-s8 is NOT folded, deliberately.** It is one `push` in the same
file and the same lane, and it is the right fix — but it is not one
change with this card. None of the eight acceptance criteria covers it;
it changes user-visible failure TEXT rather than what the resolver
trusts; and mixing a behavioural change to turn classification into a
security card means a rejection on either blocks both. The card's own
blast radius is "`runner.rs` and the suites' shared setup" for the
RESOLVER. Left filed and unchanged for the next `app-agent` lane, with
its claim re-read against the code and confirmed live: the `result`
line's text is pushed into the diagnostic ring only under `if is_error`
(`runner.rs:1420-1426` after this card's edits), so a terminal line with
`is_error: false` contributes nothing to `stderr_tail`.

## Verdicts

---

**Verifier, claude-opus-5 @fresh, 2026-08-18 — REJECTED.** Fresh
session, adversarial pass, every number below re-derived first-hand in
`/Users/ujju/Projects/nputer-T-060`. Main was never touched: the only
interaction with it at any point was read-only `lsof`/`ps`, and 1420
carried one healthy listener (`node` pid 82549) at start and at end.
`../nputer-T-063` was never entered.

**Eight of the nine criteria hold, several of them better than the card
claims. One test defect blocks, and it is in the guard's own tripwire.**

**Range derived, not accepted.** `git merge-base HEAD main` =
`6404a43`; tip `9c40da7`; `6404a43..9c40da7` = **5 commits, 7 files,
+1553 / −534**. The brief's figures reproduce exactly.

**The card carries NINE criterion bullets, not eight.** Counted
mechanically off `## Acceptance criteria`; the implementation notes say
"eight" twice. `## Acceptance criteria` is **75 lines, sha256
`baeb738d92b9a236…`, byte-identical at all five branch refs** — no
criterion moved on the branch.

### THE BLOCKING FINDING — the guard's lift window races the guard's own pin

Filed as **T-060-s3**. The executor recorded the parallel-mutation
hazard honestly and argued it survivable because no other test asserts
on `$SHELL`. That is true, and it is the wrong variable. The race is on
**`NPUTER_NO_REAL_CLI`**, between two bodies this card introduces:
`the_configuration_that_reached_the_real_cli_now_resolves_to_typed_not_found`
sets it process-wide across `tests/agent_runner.rs:1989-2009`, and
`the_no_real_cli_guard_is_on_without_anything_being_set` asserts at
`:1829` that it is unset — which is the entire property that body
exists to pin.

Verbatim, `--test-threads=8`, same binary, same tree:

    thread 'the_no_real_cli_guard_is_on_without_anything_being_set'
      panicked at tests/agent_runner.rs:1829:5:
    assertion `left == right` failed: the guard must hold with the
      variable UNSET - if a suite has to set it, a suite can forget it
      left: Some("0")
     right: None

    test result: FAILED. 47 passed; 1 failed; 1 ignored; 0 measured;
      0 filtered out; finished in 3.45s

Rate by thread count, run from `app/src-tauri` (cargo's own cwd):
**1 → 0/6 · 2 → 3/15 · 3 → 0/10 · 4 → 13/15 · 5 → 10/10 · 6 → 10/10 ·
8 → 15/15 · 10 → 0/15 · 16 → 0/15 · 32 → 0/15 · default → 0/25.**

**Why it was missed, and why that is the point.** libtest's default is
the core count; this box has 10, which sits in a quiet band. `ci.yml:55`
runs `ubuntu-24.04` and `ci.yml:127` runs a bare `cargo test` — four
vCPUs, the loudest band but one. The card's "319 passed, exit 0" is real
and reproduces here; it is a property of this hardware, not of the test.

It blocks because the body it breaks is the card's **tripwire** — the
one assertion whose job is to notice if the guard ever stops holding. A
tripwire that reds on a 4-core box is one an integrator learns to re-run
until green, which is exactly the channel a real guard failure would
come through. T-060-s3 names three closes; the one that removes the
class is running the lifted arm in a **child process**, which also
retires the `set_var`-in-a-threaded-program hazard entirely.

### Criterion by criterion

**1. The cache is retired — HOLDS, and the residual the executor flagged
is now closed.** `CacheFile`, `CacheEntry`, `read_cache`, `write_cache`,
`invalidate_cache`, `cache_path`, `RunnerConfig::config_dir` and
`probe_login_path` are all gone; `lib.rs` hands the runner a bare
`RunnerConfig::default()` and no longer calls `app_config_dir()` at all,
so the process never learns a config dir path. The executor's own caveat
— that `find_named` scans only the temp tree — I closed at the source:
**`runner.rs` contains ZERO filesystem writes outside `#[cfg(test)]`**
(`grep` for `fs::write|create_dir|File::create|OpenOptions|rename|copy`
hits only test-module lines and `stdin.write_all`). And behaviourally,
no `agent-paths.json` exists anywhere under `~/Library/Application
Support` on this machine after a full suite run.

**2. The measurement — HOLDS, and the inversion reproduces with a
positive control.** Marker files in a scratch `HOME`:

    zsh -l -c   → .zshenv, .zprofile, .zlogin        (NO .zshrc)
    zsh -i -c   → .zshenv, .zshrc                    ← the control
    bash -l -c  → .bash_profile                      (NO .bashrc)

The interactive control is what makes the absence evidence rather than a
broken fixture. Timings, medians of 15, this machine: login-shell probe
**3.6 ms**; the same with a 4000-line `.zshrc` + `compinit` **3.6 ms,
unchanged**; `claude --version` **36.7 ms**. The card's 4.0 / 40 both
reproduce in shape and slightly low. My pathological `.zprofile` measured
19.4 ms rather than 41 — a lighter fixture than the executor's, same
conclusion. **"No memo, no file" is justified**: the probe costs a tenth
of the version probe the same resolve already pays, and the one file
nvm/rbenv/pyenv/conda write into is the one file it never reads.

**3. One gate, every door — HOLDS.** Re-drove the attack. All five
relative spellings reach no process and the tattler stays absent; the
same directory spelled absolutely resolves AND fires the tattler, so the
absence is evidence. With **both** gates removed the T-047 accident
reconstructs verbatim:

    [target/nputer-t060-relbin-…] expected NotFound, got
      Ok(ResolvedCli { path: "target/nputer-t060-relbin-…/claude",
                       version: Some("2.1.226 (Claude Code)"), … })

— and that version string is the FAKE agent's default banner
(`fake_agent.rs:54`), so the drill executed the fixture, never the
machine. With only `which_in` reverted the body stays green: the
executor's "defence in depth, measured" is exactly right, reproduced.

**4. `$SHELL` name-checked — HOLDS.** `/bin/ls`, `/usr/bin/true`,
`/bin/cat`, fish, a relative `zsh`, empty and absent all fall back to
`/bin/zsh`; `/bin/zsh`, `/bin/bash`, `/bin/sh` are honoured as
themselves, so the gate has a discriminating half. One `$SHELL` read
site remains, down from two.

**5. The `RunnerConfig` comment scoped honestly — HOLDS, and the
companion pin is better than the criterion asked.** It re-derives the
list from the source rather than restating it, and it pins
`NO_REAL_CLI_VAR`'s VALUE separately — T-063's "a test parametrised by a
constant cannot pin that constant", applied unprompted.

**6. No test can resolve the real CLI — HOLDS in every environment I
could reach except one, filed as T-060-s4.** The `deps` derivation
survived relative invocation from inside `deps/` (macOS resolves
`current_exe` absolutely), a renamed target dir, and `CARGO_TARGET_DIR`.
A binary copied OUT of `deps/` fails **loudly** rather than silently.
It fails OPEN in a **rustdoc doctest** — measured, `parent =
Some("rustdoctestTieiwm")`, `cfg!(test) = false` — which falsifies the
card's and `ARCHITECTURE.md`'s "a test file written next year inherits
the refusal". Latent only: the crate has zero doctests today
(`Doc-tests nputer_lib … running 0 tests`). `cargo nextest` is NOT
installed here and is therefore unmeasured. Two-line fix in s4.

**7. The guard proven by the attack that found it — HOLDS; both T-060-s1
fixes verified against a genuinely guard-off binary.** Running the guard
test from a copy of the test binary outside `deps/`:

    thread 'the_configuration_that_reached_the_real_cli_now_resolves_to_typed_not_found'
      panicked at tests/agent_runner.rs:1909:5:
    the guard is already off before this test does anything - refusing to resolve

`:1909` is the pre-flight; the first `resolve_cli` in that body is
`:1926`. The pre-flight is load-bearing, measured, not argued. The
lifted arm's fixture shell is the only `$SHELL` visible during the
window and it names the planted binary, and the body asserts
`resolved.path == root/bin/claude` plus a binary tattle, so a lifted
resolve that wandered onto the machine could not pass. **Every other
site that weakens the guard was swept**: exactly two exist
(`tests/agent_runner.rs:1989-2009` and the `#[ignore]`d smoke at
`:2116`), plus `src/agent/runner.rs:2200-2204` in the lib binary, where
no other body resolves. None has s1's shape. The lift window's OTHER
consequence is the blocker above.

**8. The pins that guarded deleted code rewritten — HOLDS.**
`there_is_no_cache_to_poison` is a source assertion that proves its own
comment-strip works before relying on it, and
`there_is_no_agent_paths_json_to_poison_at_any_door` plants the entry
T-047's gate ACCEPTED rather than one it refused, at three doors, and
walks the tree for a written file. Strictly stronger than what it
replaced, as claimed.

**9. Blast radius — HOLDS, every element re-measured.** See the sweep.

### The security sweep — this card IS the sweep

- **Zero dependency or lockfile lines.** `git diff 6404a43 9c40da7 --
  '*Cargo.toml' '*Cargo.lock' '*package.json' '*package-lock.json'` is
  empty.
- **Zero new IPC commands.** The `generate_handler!` block hashes
  `4e062a2e898297c9…` at the base AND at the tip — byte-identical. The
  only `lib.rs` change is dropping `config_dir:`.
- **No bypass-permissions flag in any adapter table.** Every hit for
  `dangerously`/`bypassPermissions` is a test asserting their ABSENCE or
  a hostile fixture.
- **No API key or token can reach a spawned child — proven, both
  directions.** With `ANTHROPIC_API_KEY=sk-ant-…` genuinely set in the
  parent process, `the_child_gets_the_allowlist_and_never_a_secret`
  passes (the key does not reach the child); add `ANTHROPIC_API_KEY` to
  `ENV_ALLOWLIST` and the same body reds behaviourally:
  `ANTHROPIC_API_KEY must not reach the spawned CLI`. `apply_child_env`
  is `env_clear()` → allowlist → forced `TERM=dumb` → explicit PATH →
  the Rust-only seam (ADR-003).
- **`acl_pin.rs`**: 0-file diff over the range; whole-file sha256
  **`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`**;
  **92 grants** in `EXPECTED_GRANTS`.
- **`ENV_ALLOWLIST`**: **16 entries**; **lines 831–850 of
  `src/agent/runner.rs`, 423 bytes, sha256 `cf80f850b96a6f03…`** (stating
  the range, per the standing lesson — 831–849 gives 420 bytes and a
  different hash). Byte-identical to the base by `diff`.
- **Exactly THREE `#[ignore]` attributes repo-wide**, the same three:
  `perf.rs:53`, `self_graph.rs:58`, `agent_runner.rs:2104`. All spelled
  `#[ignore = "…"]`, which a bare `#[ignore]` grep misses.
- **NO MODEL WAS CALLED.** The `#[ignore]`d smoke never ran — every
  `agent_runner` result line reads `1 ignored`, and `NPUTER_REAL_CLI`
  was never set. No `~/.claude/projects` directory was created in the
  last three hours and none exists under any `nputer-T-060` name; the
  only strays are the two pre-existing `nputer-t025-realsmoke-*` that
  STATE already lists. **Disclosure**: I did execute
  `/opt/homebrew/bin/claude --version` fifteen times to re-derive
  criterion 2's timing. That is a version banner and cannot call a
  model; it is the same call the resolver makes at resolve time.

### Suites, all first-hand, exits read unpiped

- **lib/parser** `npm run build` 0 + `npx tsc --noEmit` 0 + `npx vitest
  run` → **225/225 (11 files)**, exit 0.
- **app** `npx tsc --noEmit` 0, `npm run build` 0, `npx vitest run` →
  **795/795 (42 files)**, exit 0. Bundle **`index-Bf-QNmtC.js`
  497.86 kB / `index-CryMc_lw.css` 43.90 kB** — the same content hashes
  STATE records for main, which is what a zero-frontend-file diff must
  produce.
- **app/src-tauri** bare `cargo test` → **319 passed / 0 failed / 3
  ignored**, exit 0 (`echo $?` on an UNPIPED run — my first attempt
  piped through `tail` and read tail's exit code, which is the trap the
  brief names). Slots `112/0/0/48/123/0/7/13/3/7/0/2/4/0/0`; main's
  baseline was `108/…/46/…` = 313, so +4 lib and +2 integration. **Zero
  warnings off a genuinely forced recompile**: `cargo clean -p nputer`
  (removed 13102 files, 3.1 GiB) then `cargo check --all-targets`, exit
  0, no `warning` line. Re-run green after every poison drill was
  restored.
- **tools/e2e** `npm run typecheck` 0 + `NPUTER_E2E_PORT=17470 npm test`
  → **74 passed in 14.2 s**, exit 0. `lint:tokens` → **clean, 116 files**.

**BOOT GATE: FIRED** (`app/src-tauri/**` = 3 files in the range),
**RAN, GREEN.** Scratch port **17480**, bind-probed free on both `::1`
and `127.0.0.1` immediately before use. Both startup lines detected,
tree stopped. **`BOOT_EXIT=0` is my own `echo $?` — the script does not
print it**; the line is mine and the exit code is real. 17470 and 17480
were both empty afterwards and 1420 was never bound, connected to or
signalled.

**Not mine, but worth the integrator's eyes**: five orphaned
`target/debug/nputer` processes with ppid 1 are live from
`/Users/ujju/Projects/nputer-T-063`, started 04:17–04:21 — T-061's
hazard recurring in that lane, hours before this session.

### Poison drills — 12 red, 2 designed-green controls, run inline

No scratch script; each was a `perl -0pi` edit followed by
`git checkout --` and a dirty-file count of 0. Every mutation one-sided
AND relation-breaking.

| # | mutation | body | result |
|---|---|---|---|
| P1 | `which_in` reverted to `is_executable_file` | `a_relative_search_path_element_finds_nothing` | RED |
| P2 | drop `is_absolute` in `validate_resolved_binary` | `a_resolved_binary_path_must_look_like…` | RED |
| P3 | drop the guard in `resolve_cli`'s probe arm | `the_configuration_that_reached…` | RED |
| P4 | drop `which_on_path`'s own guard | `a_relative_search_path_element_finds_nothing` | RED |
| P5 | `login_shell` drops the name check | `the_login_shell_is_name_checked…` | RED |
| P6 | derived default returns `false` when unset | `the_no_real_cli_guard_is_on…` | RED |
| P7 | drop the RAW `.`-segment scan | `a_resolved_binary_path…` | RED |
| P8 | reintroduce `fn read_cache` | `there_is_no_cache_to_poison` | RED |
| P9a | **one** gate down (`which_in` only) | `a_relative_search_path_element_reaches_no_process` | GREEN (by design) |
| P9b | **both** gates down | same body | RED |
| P10 | a 4th `std::env::var` in the resolver | `the_resolver_does_read_the_environment…` | RED |
| P11 | `ANTHROPIC_API_KEY` onto `ENV_ALLOWLIST` | `the_env_allowlist_carries_no_credential_family` | RED |
| P12 | same, with the key really set in the parent env | `the_child_gets_the_allowlist_and_never_a_secret` | RED (control GREEN) |

P1 is the re-derivation the brief asked for: it reds on the **planted
relative fixture** (`left: Some("target/nputer-t060-rel-…/claude")`) and
on none of the other four spellings — so the T-060-s2 fix is what makes
the body discriminate, and the positive control is genuine. P9a/P9b
reproduce the executor's honest "defence in depth" claim exactly.

### The `.cargo/config.toml` rejection — the decision is RIGHT, the mechanism sentence is wrong

Filed as **T-060-s5**, docs-only. `tauri dev` is **not** `cargo run`:
the tauri v2 CLI binary contains no `cargo run` string at all (only
`` Failed to run `cargo build` ``) and the live process tree is
`tauri dev` → `target/debug/nputer` with **no cargo process between
them**. I nearly concluded the rejection was unfounded, then measured
it: with `[env] NPUTER_VERIFIER_PROBE = "reached"` in
`app/src-tauri/.cargo/config.toml`, the app the boot check spawned
carried `NPUTER_VERIFIER_PROBE=reached` plus the full `CARGO_*` runtime
set. The control — a binary `cargo build`-ed and exec'd with no cargo
anywhere — sees `Err(NotPresent)`. **So the dev app DOES inherit
`[env]`, the human's app would have rendered the hand-driven fallback
forever, and the derived default is justified.** Config removed, tree
verified clean before this verdict was written.

### The `verifying` stamp — legal, and correctly rendered

`method/tasks/TASK-FORMAT.md:15` lists it in the status enum and
`method/roles/executor.md:18` instructs it; `9d30d0e` is the ruling.
The parser accepts it (`lib/parser/src/types.ts:13,128`) and the live
smoke re-parses the whole tree at 0 issues with this card in it.
`statusVisual("verifying")` returns `{ token: "verifying", pulse: true }`
(`app/src/lib/board-model.ts:57-58`) — its own token pair, distinct from
`building`'s, plus the motion-safe 5px pulsing dot
(`TaskCard.tsx:59,67,73`). Correct, not a defect. Whether the two ambers
read as distinct to a human eye is @human's call, not mine.

### T-029-s8 not folded — the right call, and this rejection proves it

Confirmed live: the `result` line's text enters the diagnostic ring only
under `if is_error` (`runner.rs:1420`), so `is_error: false` contributes
nothing to `stderr_tail`. The claim is true. Leaving it filed is
correct — no criterion covers it, it changes user-visible failure TEXT
rather than what the resolver trusts, and it lives in `run_turn`'s
classification closure, a different lane of the same file. **And the
argument is now demonstrated rather than argued**: this card is being
rejected, so a folded s8 would have had its correct fix blocked by a
defect it has nothing to do with.

### What the executor must do

Close **T-060-s3** — the tripwire cannot be allowed to red at CI's
thread count. T-060-s4 (two lines) and T-060-s5 (one sentence in three
places) are cheap enough to take in the same pass and I would take them,
but neither blocks. Nothing else on this branch needs to change: the
resolver itself is correct, the gate holds at every door I could reach,
and the measurement that overturned the card's own premise is sound.

