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
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review:
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
