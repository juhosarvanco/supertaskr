---
id: T-060
title: The resolver trusts nothing it did not just prove — retire the cache, gate the probe, forbid the real CLI in tests
feature: F-03
milestone: 3
priority: 10
size: M
status: planned
blocked_by: []
touches: [app-agent]
builder:
verifier:
built_by:
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

## Verdicts
