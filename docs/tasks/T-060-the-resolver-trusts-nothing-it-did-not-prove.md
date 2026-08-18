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
verifier: codex/gpt-5 @fresh
built_by: claude-opus-5 @fresh
verified_by: codex/gpt-5 @fresh
review: independent
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

**Numbered as the card numbers them.** [Second executor's correction: this
list ran 1–8 for a card that carries NINE criterion bullets — it silently
folded criterion 2 (the measurement) into the section above, which shifted
every number after it and is where the code's wrong `criterion N`
references came from.]

1. **The cache is RETIRED.** `CacheFile`, `CacheEntry`, `read_cache`,
   `write_cache`, `invalidate_cache`, `cache_path`,
   `RunnerConfig::config_dir` and resolution step (1) are deleted, and
   so is `lib.rs`'s `config_dir:` — the app now hands the runner a bare
   `RunnerConfig::default()`. **`probe_login_path` went too**: its only
   caller was the cache-hit arm, so retiring the file also removed a
   resolve path that could spawn the user's login shell TWICE, and took
   the resolver's `$SHELL` read sites from two to one.
2. **The measurement was taken, and it inverted the worry** — the section
   above. No memo, no file.
3. **One gate, every door.** `validate_cached_binary` →
   `validate_resolved_binary` (the old name was a lie once the cache
   went), applied inside `which_in` to every candidate a search path
   produces and again to whatever `command -v` printed, before
   `probe_version`'s `Command::new`.
4. **`$SHELL` is name-checked** in the new `login_shell()` against
   `zsh`/`bash`/`sh`, `/bin/zsh` otherwise, with fish's differing
   `-l -c` named as the reason.
5. **`RunnerConfig`'s doc comment is scoped honestly** and lists the
   resolver's three environment reads, with a companion pin that
   re-derives that list from the source so the comment cannot silently
   go stale.
6. **`NPUTER_NO_REAL_CLI`**, and it is stronger than the criterion
   asked. `=1` forbids the two real-CLI arms, `=0` permits them, and
   **UNSET is DERIVED**: forbidden iff the process is a cargo test
   binary, which cargo runs out of `<target>/<profile>/deps/`. Nothing
   is set, exported, wrapped or remembered, so a test file written next
   year inherits the refusal.
7. **The guard is proven by the attack that found it** —
   `the_configuration_that_reached_the_real_cli_now_resolves_to_typed_not_found`
   reconstructs T-047's verifier's config verbatim, with a TATTLING
   `$SHELL` so "the shell never spawned" is measured rather than
   inferred.
8. **The pins that guarded deleted code are rewritten, not dropped.**
   `the_resolution_cache_stores_a_path_and_never_a_login_path` →
   `there_is_no_cache_to_poison`; the poisoned-cache integration tests →
   `there_is_no_agent_paths_json_to_poison_at_any_door`, which plants the
   entry T-047's gate **accepted** rather than one it refused, and
   asserts no `agent-paths.json` is ever written by walking the whole
   temp tree.
9. **Blast radius held**: `acl_pin.rs` a 0-file diff, `ENV_ALLOWLIST`
   byte-identical, no new grant, no new IPC command, no new dependency,
   no bypass-permissions flag, no lockfile line.

### WHY A `.cargo/config.toml` `[env]` ENTRY WAS REJECTED

The criterion says the guard is "set once for the whole suite", and
`[env]` is the obvious mechanism. **It would have broken the human's
app**: the development app would have inherited `NPUTER_NO_REAL_CLI=1`
and rendered the hand-driven fallback forever, three days before the
milestone-closing genesis run. The derived default reaches the same
property without touching anything outside the crate.

**[CORRECTED by the second executor — T-060-s5. The conclusion above is
right; the mechanism first recorded for it was not.]** The original
sentence read "cargo applies `[env]` to `cargo run` as well as
`cargo test`, and `tauri dev` IS `cargo run` from `app/src-tauri`". The
first half is true and the second is false, and the verifier measured
both halves: the tauri v2 CLI binary contains no `cargo run` string at
all (only `` Failed to run `cargo build` ``), and the live process tree
is `tauri dev` → `target/debug/nputer` with **no cargo process between
them** — `cargo run` would still be sitting there waiting on its child.
The CLI runs `cargo build` and spawns the produced binary itself.

**The conclusion survives for a better reason.** With
`[env] NPUTER_VERIFIER_PROBE = "reached"` in
`app/src-tauri/.cargo/config.toml`, the app the boot check spawned
carried `NPUTER_VERIFIER_PROBE=reached` **plus the full `CARGO_*` runtime
set** — the tauri CLI reconstructs cargo's run environment for the binary
it spawns, and `[env]` rides along with it. The control is the plain case:
a binary `cargo build`-ed and exec'd with no cargo anywhere sees
`Err(NotPresent)`. So the dev app DOES inherit `[env]`, by the CLI's doing
rather than cargo's, and the rejection stands. A right conclusion resting
on a wrong mechanism is how a future reader checks the mechanism, finds it
false, and concludes the decision was unfounded — the verifier nearly did.
The corrected sentence is now in `runner.rs` and `docs/ARCHITECTURE.md`
as well as here.

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
change with this card. None of the nine acceptance criteria covers it;
it changes user-visible failure TEXT rather than what the resolver
trusts; and mixing a behavioural change to turn classification into a
security card means a rejection on either blocks both. The card's own
blast radius is "`runner.rs` and the suites' shared setup" for the
RESOLVER. Left filed and unchanged for the next `app-agent` lane, with
its claim re-read against the code and confirmed live: the `result`
line's text is pushed into the diagnostic ring only under `if is_error`
(`runner.rs:1420-1426` after this card's edits), so a terminal line with
`is_error: false` contributes nothing to `stderr_tail`.

### SECOND EXECUTOR, claude-opus-5 @fresh, 2026-08-18 — closing the rejection

Fresh session, briefed with the verifier's findings and none of the first
executor's assumptions. Built on **`33b249a`** (the verifier's own verdict
commit) in `/Users/ujju/Projects/nputer-T-060`; two commits on top, no
rebase, no squash, no history rewritten. `## Verdicts` below is
**byte-identical** to `33b249a` (317 lines, sha256 `005ae7a2908b8086…`) —
the REJECTED verdict is the record of what happened and it stays. `##
Acceptance criteria` is byte-identical too (**75 lines, sha256
`baeb738d92b9a236…`, nine bullets counted mechanically**); `status:`,
`builder:`, `built_by:`, `verifier:`, `verified_by:` and `review:`
untouched. **Main was never touched** — read-only `lsof`/`ps` only, and
1420 carried the same one healthy listener (`node` pid 82549) before and
after every step. `../nputer-T-062` was never entered.

**The blocker reproduced before I changed a line**, on the verifier's own
protocol (the built binary, run from `app/src-tauri`, counting process
exit codes): **`--test-threads=8` → 15/15 red, `--test-threads=4` → 9/15**,
every failure the same assertion at `:1829` with `left: Some("0")`. The
verifier measured 13/15 at 4 and I measured 9/15; same band, and a race's
rate is not a constant. Nothing in T-060-s3 failed to reproduce.

#### The fix is the race, not the assertion

The assertion is the point of the card, so it does not move. What moves is
the lift.

**`the_configuration_that_reached_the_real_cli_now_resolves_to_typed_not_found`
now runs each of its two arms in a CHILD PROCESS** — this same test binary,
re-invoked with `--exact` on its own name, with `NPUTER_NO_REAL_CLI`,
`$SHELL` and `PATH` **composed by the parent rather than mutated in it**.
The parent body ends by asserting its own environment is untouched
(`NPUTER_NO_REAL_CLI` still unset, `$SHELL` still what it was), so "nothing
global moved" is measured rather than promised. There is no window at any
thread count, because there is no window.

Two properties the in-process version could not have, and they are why this
close was worth more than a `Mutex`:

- **Each child's `PATH` is an EMPTY DIRECTORY.** `which_on_path` reads the
  process's own `PATH`, so the lifted arm — the one that deliberately runs
  with the guard OFF — now *cannot* reach the developer's real `claude`
  even if every fixture in it were broken. That is exactly how T-060-s1
  happened. It is structurally unreachable now instead of argued away by
  the fixture shell, and both halves are still in place.
- **The guarded arm's evidence is an ABSENCE** (no tattle, no session
  file), and a child that never ran satisfies every absence. So it writes a
  receipt, and `t060_run_arm` refuses a run it cannot see: child exit
  status, `"1 passed"` in the child's own output, and `guarded-ran.txt`.
  An `--exact` filter that matches nothing exits **0** with `0 passed`, and
  that is precisely the vacuity this project keeps catching.

**The lib had the same shape and takes the finding's other close.**
`src/agent/runner.rs`'s `the_real_cli_arms_are_forbidden_from_a_test_binary`
set the variable process-wide too. It was harmless only because no other
lib unit test happens to read it — which is the argument that failed in the
integration binary. `guard_decision(setting, is_cargo_test_binary)` is now
a pure function, so both directions of the override are pinned without any
process changing, and the pin is **wider** than what it replaced (it now
covers `None` + not-a-test-binary, the shipped app's case, which nothing
covered before). That the WRAPPER still reads the variable is not
assertable without a mutation, so it is pinned behaviourally instead, by
the lifted child — and drill D3 proves that pin bites.

**Rate after the fix, same binary, same protocol, 130 runs:**

| `--test-threads` | before | after |
|---|---|---|
| 1 | 0 / 6 (verifier) | **0 / 15** |
| 2 | 3 / 15 (verifier) | **0 / 15** |
| 4 | **9 / 15** (mine) / 13 / 15 (verifier) | **0 / 15** |
| 5 | 10 / 10 (verifier) | **0 / 15** |
| 6 | 10 / 10 (verifier) | **0 / 15** |
| 8 | **15 / 15** (mine and verifier) | **0 / 15** |
| 10 (this box's default) | 0 / 15 (verifier) | **0 / 15** |
| default, no flag | 0 / 25 (verifier) | **0 / 25** |

Every one of the 130 runs read `48 passed; 0 failed; 1 ignored`. The two
loud bands — 4, which is `ubuntu-24.04`'s vCPU count, and 8 — are the two I
re-measured myself before the fix, so the after-column is a comparison
against numbers I derived rather than accepted.

**The residual, stated rather than buried.** Two process-global mutations
remain in the crate's tests, both in the LIB binary: `$SHELL` in
`the_login_shell_is_name_checked_not_merely_executable`, and three
`NPUTER_*` seam variables in `default_config_reads_nothing_from_the_
environment`. Neither can be observed today, and the reason is worth
writing down because it is the guard's own doing: `login_shell()` has
exactly two callers, this test and `login_shell_probe`, and the probe is
unreachable from any test in that binary *because the guard forbids it*.
Measured, not argued: the lib binary at `--test-threads` 8 and 4, **0/10
each**. I did not convert them — "no other test reads it" is the argument
that failed once already, but the honest way to retire it is to make the
whole suite's env handling a decision, not to smuggle a second refactor
into a rejection fix.

#### T-060-s4 — CLOSED, and it closed itself on me

**Judgement: close it now, and it is not a judgement call once you read
criterion 6.** The criterion is that no test can resolve the user's real
CLI *structurally rather than by discipline*. A doctest is a test. A hole
that only a doctest falls through is still inside the criterion the card
claims to satisfy, so "latent" was a statement about today's file list, not
about the property.

`is_test_harness_dir` now covers `deps` and `rustdoctest*`. Widening only
ever forbids MORE, so the failure mode of a false positive is a resolve
that says "not found", never a spawn.

**And then the finding happened to its own fix.** Writing s4 up, I put the
measured `current_exe` output in an indented block in a doc comment — which
is a **doctest** — and `cargo test` went red with `unknown start of token:
\u{2026}`. The crate's "zero doctests today" was never a property of the
crate; it was a property of what nobody had written yet, and it survived
about forty minutes of somebody writing documentation about doctests. That
block is now fenced ```` ```text ````.

So the fix is pinned twice, and the second pin is the one that matters:

- `is_test_harness_dir` is unit-tested on both spellings and on seven names
  that must NOT match (`debug`, `release`, `MacOS`, `bin`, `target`,
  `rustdoc`, `dep`, and `None`);
- **the crate's one doctest asserts `real_cli_arms_forbidden()` from inside
  a doctest** — the exact environment s4 measured as failing open. It is
  written like the `deps` tripwire beside it: if rustdoc stops naming its
  temp dir `rustdoctest*`, a test reds and names the mechanism, instead of
  every future doctest quietly getting the developer's real CLI.

**`cargo nextest` remains UNMEASURED.** It is still not installed here and
I did not install one to close a latent arm of a latent finding. The
reasoning in s4 stands and is reasoning, not measurement: `nextest run`
executes the same binaries in place out of `<target>/<profile>/deps/`, so
the derivation should hold; `nextest archive` extracts elsewhere and nobody
has looked. Nothing in this repo runs nextest.

#### T-060-s5 — TAKEN, and the correction is in all three places

Corrected in `runner.rs`'s `real_cli_arms_forbidden` header, in
`docs/ARCHITECTURE.md`, and in this card's own "WHY A `.cargo/config.toml`
`[env]` ENTRY WAS REJECTED" section above. **The decision was right; the
mechanism recorded for it was wrong**, and the verifier's measurement is
the better reason: `tauri dev` is `cargo build` plus a direct spawn with no
cargo process in the tree, and the spawned app inherits `[env]` anyway
because the tauri CLI reconstructs cargo's run environment for it —
measured against a no-cargo control. I did not re-run that measurement: it
would mean putting a `.cargo/config.toml` into a tree with the human's app
running, and the verifier's evidence is specific, controlled and internally
consistent. **Flagged as accepted rather than re-derived.**

#### The count — one literal, one implicit, both fixed

The card carries **NINE** criterion bullets. The implementation notes said
"eight" **once** literally (in "WHAT I DID NOT DO", now corrected), and
once implicitly: the "criterion by criterion" list ran **1–8**, having
folded criterion 2 (the measurement) into its own section above without
renumbering. That list now runs 1–9 in the card's own order.

**That implicit miscount had a consequence nobody had noticed**: the code's
`criterion N` references were numbered off the notes' list rather than the
card's. `runner.rs`'s guard banner, `RunnerConfig::probe_login_shell`'s doc
and `resolve_cli`'s refusal comment all said "T-060 criterion 4" for a
property that is the card's criterion **6**; the attack-proof test said
"criterion 6" for the card's **7**. Corrected in all five places. (T-025's
and T-039's own `criterion N` citations in the same files are theirs and
were left alone.)

#### Poison drills — 8 mutations, 8 RED, run inline

No scratch script. Each was a `perl -0pi` edit, the affected body run, then
`git checkout --` and **sha256 against `git show HEAD:<path>`**, where HEAD
is the fix commit `3fbb04b`:

| # | mutation | body | result |
|---|---|---|---|
| D1 | `guard_decision`'s derived arm returns `false` | `the_no_real_cli_guard_is_on…` **and** the lib's `the_real_cli_arms_are_forbidden…` | RED ×2 |
| D2 | `resolve_cli`'s probe arm stops refusing | guarded child arm | RED |
| D3 | `real_cli_arms_forbidden` stops reading the variable | **lifted** child arm | RED |
| D4a | `is_test_harness_dir` drops the `rustdoctest` arm | the **doctest** and the lib pin | RED ×2 |
| D4b | `is_test_harness_dir` returns `true` for everything | the lib pin's negative loop (`debug` is not a harness) | RED (the control) |
| D5 | `T060_TEST_NAME` gains a suffix, so `--exact` matches nothing | the parent's "did not run" guard | RED |
| D6 | the guarded arm stops writing its receipt | the parent's proof-of-run | RED |
| D7 | the children's `PATH` points at the fixture `bin/` instead of the empty dir | the lifted arm's "must really be empty" | RED |

D4a/D4b are a pair on purpose: one proves the predicate matches what it
must, the other proves it does not match everything, which is the shape a
constant-true predicate would sail through. D5/D6 exist because moving a
body into a child process **creates** a vacuity channel that did not exist
before — a filter miss is exit 0 — so the drills are aimed at the new
mechanism rather than only at the old property.

**One drill I deliberately did NOT run**: pointing a lifted arm at the
machine's real `PATH`. That is T-060-s1's accident with the safety removed,
and reconstructing it to watch it fail is not evidence worth a spawn of the
developer's `claude`. D7 is the same assertion driven with the FIXTURE's
`bin/` — inside the temp tree, never the machine. Related, and it fell out
of D2: with the probe arm's guard removed, the guarded child still reached
no binary, because `which_on_path`'s own guard and the empty `PATH` both
held. The verifier's "defence in depth, measured" reproduces under a
harsher mutation than the one that first showed it.

#### Suites — first-hand in this worktree, exits read unpiped

- **lib/parser** `npm run build` 0 + `npx tsc --noEmit` 0 + `npx vitest
  run` → **225/225 (11 files)**, exit 0.
- **app** `npx tsc --noEmit` 0, `npm run build` 0, `npx vitest run` →
  **795/795 (42 files)**, exit 0. Bundle **`index-Bf-QNmtC.js` 497.86 kB /
  `index-CryMc_lw.css` 43.90 kB** — the same content hashes STATE records,
  which is what a zero-frontend-file diff must produce.
- **app/src-tauri** bare `cargo test` → **320 passed / 0 failed / 3
  ignored**, exit 0 read from `echo $?` on an unpiped run. Slots
  `112/0/0/48/123/0/7/13/3/7/0/2/4/1/0`. **The delta from the branch's 319
  is exactly one, and it is the doctest** — the 14th slot goes 0 → 1.
  Every other slot is unchanged, `agent_runner` included: the child-process
  rewrite added no test NAME, because the arms are the same test.
  **Zero warnings off a forced recompile**: `cargo clean -p nputer`
  (removed 14143 files, 3.6 GiB) then `cargo check --all-targets`, exit 0,
  no `warning` line — **and the control discriminates**: an unused
  variable planted in `tests/agent_runner.rs` produces `warning: unused
  variable` from the same command, so the zero is a measurement of the test
  target and not of cargo skipping it. (My first attempt at that control
  named the variable `_drill_unused` and saw nothing, which is the lint
  behaving correctly and the control being wrong.)
- **tools/e2e** `npm run typecheck` 0 + `NPUTER_E2E_PORT=17494 npm test` →
  **74 passed in 13.8 s**, exit 0. `lint:tokens` → **clean, 116 files**.

**BOOT GATE: FIRED** (`app/src-tauri/**` in the range), **RAN, GREEN.**
Scratch port **17496**, bind-probed free on both `127.0.0.1` and `::1`
immediately before use. Both startup lines detected, tree stopped by
SIGTERM. **`BOOT_EXIT=0` is my own `echo $?` — the script does not print
it**; the line is mine and the exit code is real. 17494 and 17496 were both
empty afterwards, no `target/debug/nputer` from this worktree survived, and
**1420 was never bound, connected to or signalled** — the same `node` pid
82549 held it before and after.

#### The standing invariants, re-derived rather than carried

- **`ENV_ALLOWLIST` byte-identical**: 16 entries, **423 bytes, sha256
  `cf80f850b96a6f03…`**, and `diff` against `33b249a`'s copy is empty.
  **Its anchored range MOVED — it is lines 891–910 now, not 831–850** —
  because this fix adds 60 lines above it. The range is a location, the
  hash is the invariant; quoting the old range at the new file would be a
  false negative.
- **`acl_pin.rs`**: 0-file diff, whole-file sha256 `8d24cbad706d9e6f…`,
  **92 grants**.
- **Zero new IPC commands**: `lib.rs` is a 0-file diff over my range, so
  the `generate_handler!` block is byte-identical by construction (mine
  hashes `64db2075f664e6dd…` by my own extraction at both refs; the
  verifier's `4e062a2e…` is a different span of the same bytes).
- **Exactly THREE `#[ignore = "…"]` attributes repo-wide**, the same three
  (`perf.rs:53`, `self_graph.rs:58`, `agent_runner.rs:2279`). The
  child-process design was chosen partly *because* the obvious alternative
  — an `#[ignore]`d helper the parent runs explicitly — would have added a
  fourth.
- **No new dependency, no lockfile line, no new grant, no bypass flag.**
- **NO MODEL WAS CALLED.** The `#[ignore]`d smoke never ran (`1 ignored` on
  every `agent_runner` line) and `NPUTER_REAL_CLI` was never set. The one
  thing this branch now executes more of is the FAKE agent, in a temp tree,
  on an empty `PATH`. **Disclosure**: unlike the verifier I did not run
  `claude --version` at all — the timing criterion was not mine to re-derive
  and re-running it would have been a spawn for a number already twice
  measured.

#### What I am not confident about

- **The doctest is a new CI surface.** It passes here and its mechanism is
  a literal `rustdoctest` prefix in rustdoc's own source, which is
  platform-independent — but I have measured it on macOS only. If it ever
  reds on `ubuntu-24.04`, the message says what to look at, and that is the
  trade I chose deliberately over leaving the hole silent.
- **`cargo nextest`**: unmeasured, as above.
- **The two remaining lib-binary env mutations**: measured clean at 0/10
  on both loud thread counts, and safe today only because of a property of
  the guard. That is the same *kind* of argument that failed, even though
  this instance has a mechanism behind it rather than an absence.

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

---

**Re-verifier, codex/gpt-5 @fresh, 2026-08-18 — APPROVED.** Clean-room
pass from the task, project rules and `6404a43..99bfc49` only. The prior
REJECTED verdict remains byte-identical to `33b249a`: its 317-line
`## Verdicts` payload hashes to
`005ae7a2908b8086807317409321f0bc339acfa934bd8c61e7e5c445e2cefca6`
before this entry. The 75-line acceptance section likewise remains
byte-identical at `baeb738d92b9a236b73f041c7b287c2a466dd78dbf1888bd322a6a1e1a515d23`.

**The rejection reproduces, and the fix removes its class.** I built the
rejected revision `9c40da7` from an immutable `git archive`, offline and
with its own target directory, then ran its integration-test binary
directly. With only the unrelated filesystem-watcher body skipped (the
sandbox made that body time out when a binary was run directly), the
historical binary produced the exact rejected assertion — guard variable
`left: Some("0")`, expected `None` — **5/5 at `--test-threads=4` and 5/5
at 8**; the quiet-band control at 10 was **0/5**. The tip binary under the
identical protocol was **10/10 green at 4, 10/10 at 8 and 10/10 at 10**,
with zero race signatures in all 30 runs. Bare `cargo test`, including the
watcher body, is independently green below.

**The child-process proof is non-vacuous and cannot fall through to an
ambient CLI.** The exact parent body passes and reports `1 passed`; the
control proves why that check is load-bearing — an intentionally missing
`--exact` filter exits **0** with `0 passed`. The parent additionally
requires the guarded receipt. I placed an executable `claude` tattler on
the PARENT's only PATH entry and reran the proof: it stayed green and the
tattle marker remained absent, while the lifted child still resolved the
fixture path it records. Thus the child-composed empty PATH, not ambient
machine state, bounds the guard-off arm. `NPUTER_NO_REAL_CLI` was unset for
the derived-default runs; the ignored real-CLI smoke remained ignored and
`NPUTER_REAL_CLI` was never set. No real CLI or model was called.

**The resolver attacks discriminate.** Both relative-PATH pins pass: the
unit body first proves the absolute spelling resolves, then refuses the
same executable through bare, dot and empty elements; the integration body
proves no process/tattle for the relative spellings and a process for the
absolute control. The shell-name pin honours only absolute executable
`zsh`/`bash`/`sh` names and refuses the arbitrary-executable/fish/relative
shapes. The accidental default configuration resolves to typed not-found
without spawning its tattling shell or registering a session. The guard's
pure decision pin covers explicit `0`, explicit `1`, derived test/app
answers and an unrecognised-value control.

**The doctest hole is closed with a biting pin.** The shipped doctest
passes from rustdoc's real `rustdoctest*` directory. In an archived tip
copy I removed only the `rustdoctest` predicate and reran `cargo test
--doc`: exit **101**, the doctest failed with “a DOCTEST must not be able
to reach the real CLI”. Restoring the real tip returns **1/1 green**. This
is the previously fail-open environment itself, not a unit-only restatement.

**All nine criteria hold.** Cache types/functions/config path and
`probe_login_path` are absent; resolution is seam → one fresh probe →
typed not-found. The recorded measurement supports no memo/file. The same
resolved-path validator gates PATH candidates and shell output before
`probe_version`. `$SHELL` is name-checked. `RunnerConfig` documentation now
scopes its claim and names the resolver's exactly three environment reads.
The real-CLI refusal is structural across cargo tests and doctests. The
attack that found the lapse is the child-process proof above. Deleted-cache
pins are stronger replacements rather than removals. Blast radius holds.

**Security and architecture sweep: clean.** No dependency, manifest or
lockfile line; no new IPC command or grant; `acl_pin.rs`, capabilities and
generated schemas are outside the diff; `ENV_ALLOWLIST` remains 16 entries
and byte-identical; no credential family was added to child inheritance;
argv stays data and the branch adds no shell command line. The only
production `lib.rs` change removes `config_dir` and supplies
`RunnerConfig::default()`. The task's documentation corrections agree with
the code: `tauri dev` is described as build plus direct spawn with cargo's
run environment reconstructed, test detection covers both `deps` and
`rustdoctest*`, and the remaining shape-not-identity residual is disclosed.

**Required suites and gates, first-hand:** parser build + types + Vitest
**225/225 (11 files)**; app types + build + Vitest **795/795 (42 files)**;
bare offline Rust suite **320 passed / 3 ignored / 0 failed**, including
**48 passed / 1 ignored** in `agent_runner` and **1/1** doctest; headless
E2E **74/74**, one worker, retries 0; token lint clean over **116 files**
and selftest **49 samples + 14 walk-policy checks**. The first E2E run,
contending with three parallel build/test jobs, timed out one locator at
30 s (73/74); that exact body reran alone in **320 ms**, and the full lane
then reran alone **74/74 in 14.5 s**. Boot gate on scratch port **17523**
detected both startup lines — `[nputer] project folder:` and
`[nputer] window "main" created` — then stopped its tree, exit 0.
`cargo audit --no-fetch` used the existing local advisory database and
exited 0 over 472 crates: **0 vulnerabilities / 17 allowed warnings**, the
recorded baseline. It made no network request; every Cargo manifest and
lockfile is also a zero-line branch diff.

No blocker or new suggestion remains. T-060 is ready for integration.
