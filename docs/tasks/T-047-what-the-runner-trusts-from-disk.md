---
id: T-047
title: What the runner trusts from disk — the cached path, the cached PATH, the pin's blind tail
feature: F-03
milestone: 3
priority: 8
size: M
status: building
blocked_by: []
touches: [app-agent]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5 @fresh
verified_by: claude-opus-5 @fresh
review: same-model
---

Absorbs: T-039-s1, T-039-s2, T-039-s4. Triage 2026-08-16 (architect,
straight from T-039's verdict): T-039 closed one unvalidated
file→exec path and its verifier found three more in the same
component, two of them live in shipped code today. One task, because
they are one question — what does the runner believe without checking?

**s1, the live one, ruled by the T-039 verifier as backlog rather
than a gate — but with a real argument for priority.** `read_cache`
validates nothing; `resolve_cli` gates only on "is an executable
file"; `probe_version` then runs `Command::new(path)` — so a poisoned
`agent-paths.json` executes its binary AT RESOLVE TIME, before any
turn, and `resolve_cli` runs on both `start_genesis` and
`send_turn`, so the file is read live every time. The cached
`login_path` reaches the child's `PATH` with NO gate at all. The
honest counterweight, recorded so nobody over-reads this: the
precondition is write access to the user's own config dir, and
anything with that also has `~/.zshrc` — an equivalent-privilege
persistence surface, not a boundary crossing. What lifts it above
ordinary backlog is the composition: nputer ADVERTISES a six-pattern
Bash allowlist as containment, T-025-s4 (parked) records that those
patterns match command strings and carry no path scope, and an
ungated `login_path` decides which `git` and which `cp` they resolve
to. The verifier's recorded preference is the order below.

**s4, the pin's blind tail.** `check_no_data_borne_flag` zips two
slices, so ANY assembled tail longer than the template is never
inspected — a template of 2 with a flag at index 2 returns `Ok(())`.
The TEST copy of the rule carries the `assert_eq!(template.len(),
assembled.len())` the production function lacks: two copies of one
rule that disagree. Unreachable today, and exactly the shape of the
bug T-039 just closed.

Verified despite the size: every criterion here is a trust boundary.
Executor + adversarial verifier.

## Acceptance criteria
- THE cached login `PATH` SHALL stop being trusted as stored: either
  it is not cached at all (re-probed when needed) or every element is
  validated absolute and existing before it reaches the child's
  environment. Take the not-cached arm first unless the re-probe cost
  is measured and recorded as unacceptable — it is both the
  completely ungated half and the cheap one (T-039-s1).
- THE cached binary path SHALL be validated before `Command::new`
  and before `probe_version`: absolute, no `..` component, and the
  file check kept — so the resolve-time execution of an
  attacker-chosen binary requires beating the same rules a fresh
  probe would apply. IF validation fails THEN the cache entry SHALL
  be discarded and a fresh login-shell probe run, surfacing
  `cliNotFound` if that also fails — never a silent fallback to the
  poisoned value (T-039-s1).
- THE `is_executable_file` helper SHALL NOT return true by default
  on non-unix (`cfg(not(unix))` currently does), so a future Windows
  lane inherits a refusal rather than a hole — recorded by the T-039
  verifier as harmless today and deliberately unfiled (T-039-s1).
- THE `model` string captured from the init line SHALL be validated
  and bounded like the session id is — it is written to
  `.nputer/sessions.json`, rendered, and today accepted unbounded
  behind only the 1 MiB line cap. Reuse the session-id validator's
  shape rather than inventing a second rule if the character class
  fits; if it does not, say why in the header beside it (T-039-s2).
- THE `check_no_data_borne_flag` production function SHALL inspect
  the WHOLE assembled argv, not the zipped prefix: an assembled
  vector longer than its template SHALL be a refusal in production,
  not only in the test copy — and the test copy's length assertion
  SHALL be derived from the production rule rather than restated, so
  the two cannot drift apart again (T-039-s4).
- THE data-borne flag check SHALL be widened past the leading-dash
  class to the shapes the CLI actually treats specially — at minimum
  a value that is exactly a known flag name, and `--flag=value` forms
  — with each shape pinned by a plant-and-revert drill. The T-039
  verifier's own probe (`--settings=/tmp/evil.json`, which loads
  arbitrary settings and it judged arguably worse than the measured
  injection) SHALL be one of them (T-039-s4).
- THE existing behavior SHALL be otherwise unchanged: the
  spawn/resume round trip, capture, transcript, kill semantics, typed
  failures and T-039's own gate all keep their tests green; no new
  grant, dependency, command, or IPC variant.

Verification: headless — cargo tests against the fake CLI, including
a poisoned `agent-paths.json` proving no binary executes at resolve
time, and the s4 blind-tail case as a failing→passing pin. No real
model calls. @human: none.

## Implementation notes

Built by `claude-opus-5 @fresh` on branch `t047-runner-trust`, branch point
main@2961599. Worktree-only; nothing committed to main. Two other executors
were active in their own lanes (T-041 on `app/src/**`, T-046 on
`tools/e2e/scripts/**` + `docs/CONVENTIONS.md`); neither worktree was
entered and neither lane's files appear in this diff.

### EVERY HOLE WAS REPRODUCED FIRST, AGAINST THE UNFIXED CODE

Nothing below was read as a fix before it was measured as a bug. A scratch
probe (`tests/t047_probe.rs`, deleted before commit) was written and run on
the branch point, then re-run unchanged after the fix. The fake agent
gained a **TATTLE** (`bin/fake_agent.rs:43`): given `NPUTER_FAKE_TATTLE` it
writes that file the instant it is executed by ANY argv, `--version`
included — which is what a poisoned cache reaches first.

**Pre-fix.** The blind tail:

    [t047-probe-a] template len 2 assembled len 3
    [t047-probe-a] assembled: ["--resume", "e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77", "--dangerously-skip-permissions"]
    [t047-probe-a] check_no_data_borne_flag -> Ok(())
    [t047-probe-a] tail "--settings=/tmp/evil.json" -> Ok(())
    [t047-probe-a] tail "-c" -> Ok(())
    [t047-probe-a] tail "doctor (a SUBCOMMAND, no leading dash)" -> Ok(())

The poisoned cache, executing at RESOLVE time and then for a whole turn:

    [t047-probe-b/traversal] resolve_cli -> Ok(ResolvedCli { path: "…/bin/../evil/claude", version: Some("2.1.226 (Claude Code)"), login_path: None })
    [t047-probe-b/traversal] TATTLE FILE EXISTS: true
    [t047-probe-b/traversal] tattle says: EXECUTED ["…/bin/../evil/claude", "--version"]
    [t047-probe-b/misnamed]  TATTLE FILE EXISTS: true
    [t047-probe-b/misnamed]  tattle says: EXECUTED ["…/evil/tattler", "--version"]
    [t047-probe-b2] start_genesis -> Started { turn: 1 }
    [t047-probe-b2] TATTLE FILE EXISTS: true
    [t047-probe-b2] tattle says: EXECUTED ["…/bin/../evil/claude", "-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "acceptEdits", "--allowedTools", "Bash(git init:*)", …]

The cached PATH, and the unbounded model:

    [t047-probe-c] CHILD PATH: /nputer-hostile/bin:/tmp/nputer-attacker-shims
    [t047-probe-c] child PATH carries the planted hostile element: true
    [t047-probe-d/oversize] registry bytes: 200290 B, stored model len 200000 B
    [t047-probe-d/control chars] stored model: "claude\u{1b}[2K\u{7}-opus\nSTOLEN"

**Post-fix, same probe, unchanged:**

    [t047-probe-a] check_no_data_borne_flag -> Err(FlagInValuePosition { at: 2, arg: "--dangerously-skip-permissions", shape: KnownFlagName })
    [t047-probe-a] tail "--settings=/tmp/evil.json" -> Err(FlagInValuePosition { at: 2, arg: "--settings=/tmp/evil.json", shape: FlagEqualsValue })
    [t047-probe-a] tail "-c" -> Err(FlagInValuePosition { at: 2, arg: "-c", shape: KnownFlagName })
    [t047-probe-a] tail "doctor" -> Err(FlagInValuePosition { at: 2, arg: "doctor", shape: KnownSubcommand })
    [nputer] agent: refusing the cached claude path in agent-paths.json: it carries a '.' or '..' component - discarding it and re-probing. Refused: …/bin/../evil/claude
    [t047-probe-b/traversal] resolve_cli -> Err(NotFound { probed: ["cached path (refused: it carries a '.' or '..' component)", "login shell `command -v claude`", "PATH lookup for `claude`"] })
    [t047-probe-b/traversal] TATTLE FILE EXISTS: false
    [t047-probe-b/misnamed]  resolve_cli -> Err(NotFound { probed: ["cached path (refused: its file name is not 'claude')", …] })
    [t047-probe-b/misnamed]  TATTLE FILE EXISTS: false
    [t047-probe-b/relative]  resolve_cli -> Err(NotFound { probed: ["cached path (refused: it is not an absolute path)", …] })
    [t047-probe-b/relative]  TATTLE FILE EXISTS: false
    [t047-probe-b2] start_genesis -> CliNotFound { probed: ["cached path (refused: it carries a '.' or '..' component)", …] }
    [t047-probe-b2] TATTLE FILE EXISTS: false
    [t047-probe-c] child PATH carries the planted hostile element: false
    [nputer] agent: the CLI's init line carried an unusable model name (it is 200000 bytes, past the 128-byte bound) - the turn stands, the name is not recorded
    [t047-probe-d/oversize] registry bytes: 271 B, stored model len 6 B ("<none>")

### THE PATH QUESTION: the NOT-CACHED arm, and the measurement that settled it

**Arm taken: not cached at all, re-probed when needed.** The task told me to
take it unless the re-probe cost measured unacceptable. It does not, and the
margin is not close:

| probe | 5 runs, this machine |
|---|---|
| `zsh -l -c 'echo NPUTER_LOGIN_PATH=$PATH'` (the new one) | 8.3 / 7.1 / 6.7 / 6.4 / 5.9 ms |
| `claude --version` (already run on EVERY resolve, before and after) | 169.8 / 51.6 / 49.1 / 47.2 / 48.2 ms |

Re-probing adds **~7 ms to a resolve that already spends ~50 ms** on a probe
nobody has ever proposed removing — about 15%, on a path that runs once per
interview TURN, where a turn is seconds of model time. There was nothing to
trade, so the cheap half was also the completely-ungated half, exactly as
the T-039 verifier predicted.

The arm is taken **structurally, not by omission**: `login_path` is GONE
from `CacheEntry` (`runner.rs:635`), so there is no field to trust and no
later change can trust it by accident. serde ignores unknown fields, so an
`agent-paths.json` an older build wrote — or an attacker plants — still
parses and its `login_path` is simply unreachable. The PATH now comes from
`probe_login_path` (`runner.rs:438`), whose script is NARROWER than the
resolution probe's on purpose: it asks only for the PATH, so it is a
compile-time constant with no `command -v` and no interpolation.

### Criteria → evidence

**Criterion 1 — the cached login `PATH` stops being trusted as stored.**
`runner.rs:635` (`CacheEntry`, one field), `runner.rs:639`/`646`
(`read_cache`/`write_cache`, no login path in or out), `runner.rs:438`
(`probe_login_path`, the fresh probe), `runner.rs:362` (the cache-hit path
calling it). Pins: `runner.rs:1647`
`the_resolution_cache_stores_a_path_and_never_a_login_path` (the written
entry's key set is exactly `["path"]`; a planted `login_path` parses and is
unreachable; a read-modify-write drops it) and
`tests/agent_runner.rs:1425` `the_cached_login_path_never_reaches_the_child`
(both arms, end to end).

**Criterion 2 — the cached binary path validated before `Command::new` and
before `probe_version`.** `runner.rs:293` `validate_cached_binary` —
absolute, no `.`/`..` component, file name == `adapter.binary`, and the
executable-file check KEPT as the last step. `runner.rs:358` is the call,
and it sits BEFORE `probe_version`, which is the `Command::new` the pre-fix
probe caught executing. On failure: a sanitized loud line, `invalidate_cache`
(the entry is discarded from the file), `probed.push("cached path (refused:
…)")`, then the fresh login-shell probe, then typed `NotFound` →
`cliNotFound { probed }` — never a silent fallback to the poisoned value.
`runner.rs:403` closes the loop on the WRITE side: the cache can never come
to hold something the read side would refuse. Pins: `runner.rs:1582`
(the table, plus the discriminating half — a real absolute executable named
`claude` IS accepted, and the same file with the bit cleared is not),
`tests/agent_runner.rs:1260` (obligation 1, below) and
`tests/agent_runner.rs:1343`.

**Why `file name == adapter.binary`, which the criterion did not name.**
The criterion's own rationale is "requires beating the same rules a fresh
probe would apply", and a fresh probe resolves the NAME `claude` — via
`command -v claude` or `dir.join("claude")` — so everything it can ever
return is absolute, traversal-free AND named `claude`. It is the third of
T-039-s1's three proposed rules, and without it the misnamed poison
(`…/evil/tattler`) passes: it is absolute and traversal-free, and the
pre-fix probe measured it executing.

**Criterion 3 — `is_executable_file` no longer returns true by default on
non-unix.** `adapter.rs:672`. The old `#[cfg(not(unix))] { true }` read as
"we cannot check the bit here" and SPELLED "every file is executable" — the
permissive default for the one check standing between a cached path and
`Command::new`. It is now `false`, so a Windows lane inherits a refusal it
must deliberately implement rather than a hole it must remember to find, and
the refusal is loud by construction (fall through → fresh probe → typed
`cliNotFound`). Not runtime-testable on this host; the unix branch's two
directions ARE pinned (`runner.rs:1582`, the 0o755/0o644 pair).

**Criterion 4 — the `model` string validated and bounded.**
`adapter.rs:339` `MODEL_MAX_LEN` (128), `adapter.rs:345` `ModelRejection`
(four named variants), `adapter.rs:402` `validate_model`, called at
`runner.rs:1160` inside the same `StreamLine::Init` arm the session-id gate
lives in. Pins: `adapter.rs:1139` (the table, both directions) and
`tests/agent_runner.rs:1524` (end to end: oversize, control characters and a
bidi override refused with the turn STANDING, plus real names — including
`us.anthropic.claude-3-5-sonnet-20241022-v2:0` — round-tripping into
`.nputer/sessions.json`).

**THE CHARACTER CLASS IS WIDER THAN THE ID'S, and the criterion asked that
be justified in the header beside it — it is, at `adapter.rs:376-401`.** The
id's class is `[A-Za-z0-9._-]` because an id becomes an ARGV ELEMENT: every
character has to be inert to an argument parser, which is what rules out
`=`, `/`, `:` and `@`. A model is never argv (we never pass `--model`) and
never a path; it is a recorded fact that gets STORED and RENDERED. Reusing
the id's class would refuse real provider spellings for no security gain —
Bedrock's `us.anthropic.…-v1:0` carries `:`, Vertex's `claude-…@20240620`
carries `@`, a router-style `vendor/model` carries `/`. So the rule keeps
the id validator's SHAPE (first character alphanumeric, hard byte bound,
typed named rejections, never coerced, never echoes the refused bytes) and
widens the body to printable ASCII with no space, U+0021–U+007E. What it
still refuses is exactly what hurts a stored, displayed value: control
characters and terminal escapes, newlines that forge log records, DEL,
everything non-ASCII (homoglyphs, bidi overrides), and size.

**Criterion 5 — the whole assembled argv, and ONE copy of the length rule.**
`adapter.rs:587` `check_no_data_borne_flag` now walks `assembled` by index
and uses `template.get(at)`, so the tail past the template's end takes the
hostile branch instead of being skipped by `zip`; a length disagreement in
EITHER direction is itself a refusal (`adapter.rs:204`
`ArgvLengthMismatch`). **The test copy's length assertion is now DERIVED**:
`adapter.rs:782` replaced the pin's own `assert_eq!(template.len(),
assembled.len())` with `assert_eq!(check_no_data_borne_flag(template,
&assembled), Ok(()))` — the production function owns the rule and the pin
asserts through it, so there is no second copy left to drift. Pin:
`adapter.rs:969`.

**Criterion 6 — widened past leading-dash to the shapes the CLI actually
parses.** `adapter.rs:213` `ArgShape` (four named shapes), `adapter.rs:431`
`KNOWN_CLI_FLAGS` (every long and short option in `claude 2.1.226`'s own
`--help`, read first-hand at build time — `--help` ONLY, no model was
called), `adapter.rs:513` `KNOWN_CLI_SUBCOMMANDS`, `adapter.rs:540`
`classify_arg_shape` (ordered most-specific-first, ASCII-case-insensitive).
`--settings=/tmp/evil.json` is pinned as `FlagEqualsValue`, the shape the
verifier judged arguably worse than the measured injection. Pin:
`adapter.rs:1032`; drills in obligation 4.

**The genuinely new coverage is `KnownSubcommand`**, and it is the reason
"widened past the leading-dash class" is a real instruction rather than a
tidying one: `doctor`, `install`, `update`, `mcp`, `setup-token` carry NO
dash at all, `claude doctor` is a different program than `claude -p`, and
**`validate_session_id` accepts every one of them** — they are pure
`[A-Za-z0-9-]`. So this is a class the T-039 allowlist lets through and the
old backstop could never have caught. Measured both ways: `doctor` returned
`Ok(())` from the pre-fix function, and the drill below plants it as a real
session id with the T-039 gate fully intact and watches production refuse it.

**Criterion 7 — everything else unchanged.** cargo **208 → 217 passed + 3
ignored** (+9, all new; two existing tests changed only in the expected
VALUE of an assertion they already made). No new grant (`acl_pin.rs`,
`capabilities/`, `tauri.conf.json` all zero-diff), no new dependency
(`Cargo.toml`/`Cargo.lock` zero-diff), no new command, **no new IPC
variant**: `StartOutcome`, `SendOutcome`, `CancelOutcome`, `GenesisStatus`,
`TurnError` and `RunEvent` were compared variant-for-variant against
`2961599` and are IDENTICAL, so `app/src/lib/agent-store.ts` needs no mirror
and has none. `CachedPathRejection`, `ModelRejection` and `ArgShape` are
Rust-internal — none is `Serialize`, none crosses the IPC boundary; they
render into the existing `probed` / `message` / `why` strings.

### The eight proof obligations

**1. A POISONED `agent-paths.json` EXECUTES NOTHING.** Permanent pin:
`tests/agent_runner.rs:1260`
`a_poisoned_agent_paths_json_executes_nothing_at_any_door` — three poison
shapes (traversal, misnamed, relative), each pointing at a real executable
copy of the fake agent armed with the tattle, driven through `resolve_cli`
AND `start_genesis`, asserting the tattle-file ABSENT, a typed outcome whose
`probed` NAMES the discarded entry, no registry written and no kit
materialized. Third door: `tests/agent_runner.rs:1343`
`the_cache_is_re_read_and_re_judged_before_every_turn` — turn 1 resolves
through a LEGITIMATE cache entry (the discriminating half: the gate is one a
real probe result passes), the file is then poisoned mid-session, and
`send_turn` returns `CliNotFound` with no second child, no turn-2 dump, and
the single-flight latch released. The pre/post output is quoted verbatim at
the top of these notes; the headline line is
`[t047-probe-b2] TATTLE FILE EXISTS: true` → `false`.

**2. The cached PATH no longer reaches the child.**
`tests/agent_runner.rs:1425`, two arms. ARM ONE is the discriminating one —
no `path_override`, so if the cache were still trusted its `login_path` is
exactly what `apply_child_env` would reach for, as it did pre-fix
(`CHILD PATH: /nputer-hostile/bin:/tmp/nputer-attacker-shims`); post-fix the
child's PATH carries no trace of the planted element and equals the live
environment's PATH, the documented fallback. ARM TWO shows the PATH arriving
through the PROBE channel byte for byte (`/t047-freshly-probed/bin`) while
the same hostile element sits in the cache file **unread and still on disk**
— asserted, because refusing to read a value is not a licence to rewrite the
whole file.

**3. The s4 blind tail, failing → passing.** Pre-fix, quoted above:
`check_no_data_borne_flag -> Ok(())` for a 3-element vector against a
2-slot template with `--dangerously-skip-permissions` at index 2. Post-fix:
`Err(FlagInValuePosition { at: 2, arg: "--dangerously-skip-permissions",
shape: KnownFlagName })`. Permanent pin `adapter.rs:969`, which also covers
the inert-tail and the SHORTER-than-template directions. The test copy's
assertion is derived (`adapter.rs:782`), and that derivation was drilled:
making `argv` push one extra element past its template turns **seven** lib
tests red — including the bypass pin — with `the spawn template assembles:
FlagInValuePosition { at: 17, arg: "--settings=/tmp/evil.json", shape:
FlagEqualsValue }`. Under the pre-T-047 rule that same code would have
assembled silently; the property that used to live only in the test now
lives in production. `shasum -a 256` byte-identical after the drill
(`cd4078f1a51718411bbfc6e1d0b486a920e69705bfa7952fb9028ce225504de7`).

**4. The widened shapes, one plant-and-revert drill each.** Each shape was
planted as a SESSION ID in the pin's own `REAL_IDS` list — i.e. arriving as
DATA through the real assembly path — and, where `validate_session_id` would
refuse it first, the validation was stripped from `argv` too, so the
PRODUCTION BACKSTOP is what is under test. All eight fired; `adapter.rs`
`shasum` byte-identical before and after:

    === DRILL FlagEqualsValue  --settings=/tmp/evil.json ===       exit=101 (RED)
      | a real id assembles: FlagInValuePosition { at: 18, arg: "--settings=/tmp/evil.json", shape: FlagEqualsValue }
    === DRILL FlagEqualsValue  --permission-mode=bypassPermissions ===  exit=101 (RED)
      | a real id assembles: FlagInValuePosition { at: 18, arg: "--permission-mode=bypassPermissions", shape: FlagEqualsValue }
    === DRILL KnownFlagName    --settings ===                      exit=101 (RED)
      | a real id assembles: FlagInValuePosition { at: 18, arg: "--settings", shape: KnownFlagName }
    === DRILL KnownFlagName    -c ===                              exit=101 (RED)
      | a real id assembles: FlagInValuePosition { at: 18, arg: "-c", shape: KnownFlagName }
    === DRILL KnownFlagName    --fork-session ===                  exit=101 (RED)
      | a real id assembles: FlagInValuePosition { at: 18, arg: "--fork-session", shape: KnownFlagName }
    === DRILL LeadingDash      --a-flag-this-cli-has-never-heard-of ===  exit=101 (RED)
      | a real id assembles: FlagInValuePosition { at: 18, arg: "--a-flag-this-cli-has-never-heard-of", shape: LeadingDash }
    === DRILL KnownSubcommand  doctor ===   (validation stripped: FALSE)   exit=101 (RED)
      | a real id assembles: FlagInValuePosition { at: 18, arg: "doctor", shape: KnownSubcommand }
    === DRILL KnownSubcommand  install ===  (validation stripped: FALSE)   exit=101 (RED)
      | a real id assembles: FlagInValuePosition { at: 18, arg: "install", shape: KnownSubcommand }

The last two are the strongest rows in the table: the T-039 gate was fully
intact and **still let them through to the backstop**, which is what refused
them. And the ninth drill, reverting `check_no_data_borne_flag` to its
literal pre-T-047 body, reds three adapter tests including the MODIFIED
`the_assembled_argv_rule_refuses_a_flag_in_any_value_position`
(`left: shape: LeadingDash, right: shape: FlagEqualsValue` for
`--settings=/tmp/evil.json`).

**5. The `model` bound.** `tests/agent_runner.rs:1524`, three hostile
init-line models driven through the live capture path against the fake
(200,000 bytes; `claude\u{1b}[2K\u{7}-opus\nSTOLEN`; a U+202E bidi
override). Each: the turn STANDS and completes, the session id off the SAME
init line still rides, `sessions.json` carries no `model` key at all (serde
skips a `None` — the field is ABSENT, not present-and-shortened, so nothing
was coerced), the file stays under 1 kB against the pre-fix 200,290 B, and
no fragment of the hostile value (`MMMM`, `STOLEN`, the raw escapes, their
hex spellings) survives anywhere in the bytes. Then the discriminating half:
`claude-opus-5` and `us.anthropic.claude-3-5-sonnet-20241022-v2:0` both
round-trip into `.nputer/sessions.json` untouched.

**6. Nothing else moved.** Bare `cargo test` from `app/src-tauri`: **217
passed + 3 ignored**, three consecutive runs, identical every time (lib 105,
agent_runner 32 + 1 ignored, index 68, containment 3, golden 7, perf 0 + 1,
self_graph 2 + 1). `cargo build` clean, zero warnings. App: `npm run build`
(after `lib/parser`'s build, ADR-011 order) then `npm test` **483/483, 27
files** — bundle `index-DvrlAOQE.js` **442.05 kB, byte-for-byte the asset
T-039's merge shipped**, which is the correct outcome for a branch whose
entire payload is Rust. `npx tsc --noEmit` clean in both. lib/parser
**159/159, 10 files**. tools/e2e **17/17 in 4.8 s** (its own vite on 14520;
`resolveLanePort` throws on 1420). `npm run lint:tokens` clean, 37 files.
**T-039's own gate tests, run and named**: `no_adapter_argv_can_ever_bypass_
permissions`, `the_session_id_gate_is_an_allowlist_not_a_denylist`,
`a_rejection_names_itself_without_relaying_raw_bytes`,
`a_hostile_session_id_never_reaches_argv_at_all`,
`a_session_id_read_back_out_of_the_registry_is_validated`,
`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`,
`every_hostile_id_class_fails_the_turn_at_capture`,
`a_hostile_session_id_in_the_registry_file_is_refused_at_the_read_boundary`,
`a_hostile_resume_id_handed_straight_to_the_runner_spawns_nothing` — all
**ok**. The unnamed `agent_runner` flake did not appear in any of the ~15
suite runs this task made. **No `fake_agent` orphan survives** (`pgrep -fl
fake_agent` empty). **Nothing bound or contacted port 1420** — it is held by
the human's `node`/vite and was never touched. **No model was called**: the
env-gated `#[ignore]` smoke was not run, the boot-check script was not run,
and `claude` was invoked only for `--help` and `--version`.

**7. Every new test executes.** A poison `assert!(false,
"T047-SWEEP-<name>")` was scripted into each of the **NINE** new test bodies
one at a time, that single test run BY EXACT NAME (`-- --exact`, so exactly
one test ran), the marker confirmed in the failure output, the file restored
and `shasum -a 256` compared byte-identical. **9/9 red on demand**: the
three adapter tests, the two runner tests, the four integration tests. The
two MODIFIED tests were shown red by drill 4 and drill 9 instead, which is
stronger than a poison.

**8. Fence.** `git diff --stat 2961599` — **FOUR** files, all inside the
agent module and its fixtures:

    app/src-tauri/src/agent/adapter.rs  | 617 +++-
    app/src-tauri/src/agent/runner.rs   | 371 ++-
    app/src-tauri/src/bin/fake_agent.rs |  12 +
    app/src-tauri/tests/agent_runner.rs | 410 +++

plus this task file and the suggestions at commit time. Proved as an EMPTY
SET rather than by eye: `git diff --name-only 2961599` restricted to
`method/`, `lib/parser/`, `app/src/`, `tools/`,
`docs/architecture/graph.json`, `docs_watch.rs`, `index_cmd.rs`,
`acl_pin.rs`, `lib.rs`, `capabilities/`, `tauri.conf.json` and every
`Cargo.toml`/`Cargo.lock`/`package.json`/`package-lock.json` returns
**nothing**. Neither other executor's lane is touched and neither worktree
was entered.

### Expected graph delta at merge: NONE — verified, not forecast

`git diff --name-only 2961599` filtered to `*.ts/*.tsx/*.js/*.jsx` returns
**NOTHING**, so the T-009-s1 interim regen rule does not fire; and
`nputer-index` walks `Lang::Ts, Lang::Js` only, so four `.rs` files are
invisible to it until T-010. Proved positively and non-destructively by the
plain ignored self-check on this tree — `cargo test -p nputer-index --test
self_graph -- --ignored` → `self_graph_is_current ... ok` — which re-derives
the graph in memory and compares it to the committed bytes.
`docs/architecture/graph.json` is zero-diff. **Do not regenerate.**

### Deviations, and what was deliberately NOT done

1. **A refused MODEL does not fail its turn, while a refused session id
   does.** The asymmetry is deliberate and recorded at the call site
   (`runner.rs:1160`). A refused id MUST fail the turn: a turn whose id was
   refused cannot be resumed, and telling the user otherwise would be a lie.
   A refused model costs the user only the recorded NAME of what ran — the
   answer the planner just wrote is still good — so destroying a completed
   interview turn over a cosmetic field would be a worse failure than the
   one being prevented. It is refused, never coerced (no truncation, no
   stripping, no re-encoding): `out.model` stays `None`, the registry
   records nothing, and the fact is said out loud on stdout rather than
   swallowed. The criterion's own hedge ("reuse the validator's SHAPE …; if
   the class does not fit, say why") reads on the rule, not on the
   consequence.
2. **`SessionIdRejection` gained two variants; `ModelRejection` and
   `CachedPathRejection` are new enums.** None is `Serialize`, none crosses
   the IPC boundary, and all three render into strings the existing typed
   outcomes already carry — so `app/src/lib/agent-store.ts` needs no mirror,
   exactly as T-039 required. A new `TurnError`/`StartOutcome` arm was NOT
   added, for the same fence reason T-039 records (its s3 still stands).
3. **`FlagInValuePosition` gained a `shape` field rather than being split
   into four variants.** One rejection meaning "an element the CLI would
   parse specially sits where a value belongs", with the shape NAMED, keeps
   the call sites and the message shape intact and makes each drill
   distinguishable in the output. Two existing T-039 test constructions
   gained the field; both still assert exactly what they asserted before.
4. **`invalidate_cache` REWRITES `agent-paths.json` on a refusal**, which
   looks like it contradicts T-039's "refusing to resume is not a licence to
   rewrite the user's runtime state" — it does not. That rule protects
   `.nputer/sessions.json`, a file in the USER'S project that they may want
   to inspect. `agent-paths.json` is OUR OWN derived cache in the app config
   dir, the criterion says the entry "SHALL be discarded", and the refused
   path is echoed (sanitized) before removal, so nothing is lost silently.
5. **The write side of the cache is gated too** (`runner.rs:403`), which the
   criteria did not ask for. Without it an unusual-but-working probe result
   would be written and then refused on every subsequent turn — a loop of
   loud lines about a binary that works. A probe result that fails the gate
   is still USED for that resolve: it came from the user's own login shell,
   not from a file, which is the distinction this whole task draws.
6. **The `.` component is refused as well as `..`.** `..` is the dangerous
   one and `Components` preserves it; `.` is inert but `Components`
   NORMALIZES it away, so the raw string is scanned segment-wise too —
   `Command::new` hands the OS the string, not Rust's view of it.

### Genuine silences, left open deliberately

- **An absolute, traversal-free path named `claude` pointing at an
  attacker's binary still passes.** This is the honest residual and it is
  recorded in the function's own header (`runner.rs:273`). Closing it needs
  the cache bound to a probe signature or dropped entirely — filed as
  **T-047-s1**, which argues the cache now buys almost nothing.
- **`KNOWN_CLI_FLAGS` is a snapshot of one CLI version and will drift.** The
  leading-dash arm covers every `--`/`-` form whatever the table says, so
  drift costs only naming precision — EXCEPT for subcommands, where a CLI
  that grows a new one grows a shape the table does not know. Filed as
  **T-047-s2**.
- **`model` is validated on the way IN but not on the way OUT.** T-039 gave
  `native_session_id` a READ-boundary accessor (`SessionEntry::resume_id`)
  precisely because a registry file is losable runtime state anything with
  disk access can write; `model` has no equivalent, so a file written by an
  older build — or by an attacker — can still hand T-027 an unbounded,
  escape-carrying model to render. Out of this task's criteria, which name
  the init line. Filed as **T-047-s3**.
- **`$SHELL` reaches `Command::new` from the app's own ENVIRONMENT**
  (`runner.rs:438`, `runner.rs:493`), gated on absolute + executable but not
  on name, with a `/bin/zsh` fallback. Same class as everything this task
  closed, one source removed: environment rather than disk. Filed as
  **T-047-s4**.
- **The freshly-probed binary path is trusted more than a cached one**, on
  purpose: it is gated on `is_executable_file` only, not on
  `validate_cached_binary`. It came from the user's own login shell in this
  process, this second — the same trust level as `~/.zshrc`, which is the
  equivalent-privilege counterweight this task's own card records.
- **The `--allowedTools` value class is still not covered.** T-039-s4's
  second finding noted that `Bash(*)` substituted into an `--allowedTools`
  slot returns `Ok(())`; it still does, because `Bash(*)` is inert to the
  CLI's ARGUMENT parser and dangerous only to its PERMISSION parser. Nothing
  substitutes there today (the six patterns are `const`), and a rule about
  tool-pattern semantics belongs beside T-025-s4's allowlist work, not
  inside an argv-shape gate.

## Verdicts

2026-08-16 — claude-opus-5 @fresh (verifier, same-model review):
**APPROVED.** Seven criteria met. Every headline claim was re-derived from
scratch — the verifier wrote its OWN tattler (a `/bin/sh` script with the
tattle path baked into its TEXT, so it survives `env_clear()` and does not
depend on `NPUTER_FAKE_TATTLE` reaching the child), planted its OWN
`agent-paths.json` shapes by hand, checked the pre-fix `adapter.rs` +
`runner.rs` out of `2961599` and ran the same probe file against both
trees. The validator was then attacked with eighteen path shapes, the
widened argv rule with twelve, and the `--help` tables audited token for
token against a first-hand `claude --help`. **Two new suggestions filed
(s5, s6), both earned by reproduction. Nothing found rises to a criterion
failure.**

**Branch point re-derived**: `git merge-base HEAD main` = `2961599`. Main
has since moved to `94ee306` (T-046 merged); `git merge-tree` over
`2961599..HEAD` vs `2961599..main` produces **zero conflict markers**.

**No model was called by the verification, and one incident is recorded
rather than hidden** — see s6. `claude --help` and `claude --version` only;
the `#[ignore]`d smoke was never run; the boot-check script was never run;
e2e ran on its own port **14547**, and 1420 stayed the human's
(`node` pid 90127 LISTEN, untouched).

**CRITERION 1 — the cached login PATH stops being trusted as stored.**
Pre-fix, verifier's own hostile element planted in the cache file, no
`path_override` so the file is the only PATH source:

    [VC] CHILD PATH: /verifier-hostile/bin:/tmp/verifier-attacker-shims
    [VC] child PATH carries the planted hostile element: true

Post-fix, same probe, same planted file, unchanged:

    [VC] CHILD PATH: /Users/ujju/.local/bin:/opt/homebrew/…   (the live environment's)
    [VC] child PATH carries the planted hostile element: false
    [VC] our own PATH == child PATH: true
    [VC] cache file still holds the planted login_path: true

The last line is the one that matters twice: refusing to READ a value is
not a licence to rewrite the user's file, and the field is still there,
unread. **Structural unreachability re-derived rather than accepted**: a
planted `login_path` still parses (serde ignores unknown fields), `grep`
finds no `login_path` field on any live `Deserialize` type (`ResolvedCli`
carries one but derives no serde), and a read-modify-write drops it.
**The PATH's real source was then proved WITHOUT the seam**: `$SHELL`
pointed at a verifier-written script that answers `-l -c` with a PATH
nothing else on the machine has, `probe_login_shell: true`,
`path_override: None`:

    [ATK-probe] CHILD PATH: /t047v-freshly-probed/bin
    [ATK-probe] came from the live probe: true
    [ATK-probe] carries the cached hostile element: false

**The measurement holds and the re-probe did not land somewhere hotter.**
Independently timed on this machine: `zsh -l -c 'echo …$PATH'` 7.7 / 5.6 /
5.3 / 4.8 / 5.0 / 5.4 ms against `claude --version` 57.1 / 44.8 / 42.9 /
42.1 / 41.2 / 41.7 ms — the builder's 6–8 vs 47–50 reproduced. Frequency
was measured, not read: a counting `$SHELL` recorded **exactly one spawn
per turn** (1 at `start_genesis`, 1 at `send_turn`), and — with the cache
file deleted — still exactly one, the same shell simply running the wider
script. That is the sharper form of s1's argument: the cache saves **zero**
shell spawns, not one.

**CRITERION 2, THE HEADLINE — a poisoned `agent-paths.json` executes
nothing.** Verifier's own tattler, verifier's own JSON, both doors.
Pre-fix:

    [VB/traversal] resolve_cli -> Ok(ResolvedCli { path: "…/bin/../evil/claude", version: Some("9.9.9 (Verifier Tattler)"), login_path: Some("/verifier-hostile/bin") })
    [VB/traversal] TATTLE EXISTS AFTER RESOLVE: true
    [VB/traversal] tattle: VERIFIER-TATTLE argv0=…/bin/../evil/claude args=--version
    [VB/traversal] start_genesis -> Started { turn: 1 }
    [VB/traversal] TATTLE EXISTS AFTER START: true
    [VB/misnamed]  TATTLE EXISTS AFTER RESOLVE: true

Post-fix, same probe file, unchanged:

    [nputer] agent: refusing the cached claude path in agent-paths.json: it carries a '.' or '..' component - discarding it and re-probing. Refused: …/bin/../evil/claude
    [VB/traversal] resolve_cli -> Err(NotFound { probed: ["cached path (refused: it carries a '.' or '..' component)", "login shell `command -v claude`", "PATH lookup for `claude`"] })
    [VB/traversal] TATTLE EXISTS AFTER RESOLVE: false
    [VB/traversal] start_genesis -> CliNotFound { probed: ["cached path (refused: …)", …] }
    [VB/traversal] TATTLE EXISTS AFTER START: false
    [VB/traversal] cache file after: {   "entries": {} }
    [VB/misnamed]  resolve_cli -> Err(NotFound { probed: ["cached path (refused: its file name is not 'claude')", …] })
    [VB/relative]  resolve_cli -> Err(NotFound { probed: ["cached path (refused: it is not an absolute path)", …] })

Typed at both doors, the discarded entry NAMED in `probed`, the poisoned
path never relayed into the typed outcome, the entry gone from the file,
no silent fallback.

**Re-judged before EVERY turn — verified, not read.** Turn 1 through a
legitimate entry, poisoned mid-session with the verifier's own JSON:

    [ATK-turn] turn 1 -> Started { turn: 1 }
    [ATK-turn] turn 2 (poisoned between turns) -> CliNotFound { probed: ["cached path (refused: it carries a '.' or '..' component)", …] }
    [ATK-turn] tattle after turn 2: false
    [ATK-turn] turn-2 dump exists: false
    [ATK-turn] latch released (a second send also refuses): true

`resolve_cli` has exactly two production call sites (`mod.rs:278`
`start_genesis`, `mod.rs:375` `send_turn`) and no spawn path bypasses it.

**The WRITE side is gated too, and it discriminates.** A probe result
carrying a `.` component was USED for its own resolve and NOT written; a
clean one was written with a one-key entry:

    [ATK-write] probe result USED for this resolve: Ok("…/probe/./bin/claude")
    [ATK-write] cache file after: None
    [ATK-write] control cache file: Some("{ \"entries\": { \"claude\": { \"path\": \"…/probe/bin/claude\" } } }")

**ATTACKS ON THE VALIDATOR — eighteen shapes, what survived.** Refused:
`..`, `.`, relative, `~/…`, `$HOME/…`, empty, a DIRECTORY named `claude`
(`NotExecutable`), a 0644 file, a trailing slash, `CLAUDE` (byte-exact
name — stricter than this case-insensitive filesystem), a NUL inside the
path (`NotExecutable`) and a NUL in the name (`WrongName`), an ANSI escape
in the name. **Survived, all inside the residual the builder's own header
records** — "an absolute, traversal-free path named `claude` pointing at
an attacker's binary still passes": a **symlink** named `claude` pointing
elsewhere (the gate does not `canonicalize`), a real `claude` inside a
directory whose NAME carries a newline, `//double//slash`, and a
**setuid** binary (unexamined — and worth nothing to an attacker who
already owns the config dir). **TOCTOU adds nothing**: the gate never
checks identity, so an attacker with write access to the referenced
directory does not need to win a race — demonstrated directly by leaving
the path alone and swapping the FILE, after which the binary ran the full
resume argv. That is the residual, it is disclosed in the function header,
and s1 is the task that closes it.

**Log forging refused.** A planted path carrying `\u{1b}[2K` and two
newlines spelling a fake `[nputer] agent:` record printed through
`sanitize_for_log` as literal escapes on one physical line — `cat -v`
confirms no raw ESC byte reaches the terminal, and the `probed` vector
carries only the reason, never the bytes.

**CRITERION 3 — `is_executable_file` no longer defaults to true off-unix.**
Source-level only (`adapter.rs:686`, `false`; the diff shows `true` →
`false`), and only `aarch64-apple-darwin` is installed, so no cross-target
check was possible. The unix branch's two directions are pinned and were
re-run.

**CRITERION 4 — the model is bounded.** Pre-fix, three hostile init-line
models through the live capture path:

    [VD/oversize] registry bytes: 200290 B, stored model len 200000 B, has "model" key: true
    [VD/control]  stored model: Some("claude\u{1b}[2K\u{7}-opus\nSTOLEN")
    [VD/rtl-override] stored model: Some("clau\u{202e}de-opus")

Post-fix, unchanged probe:

    [nputer] agent: the CLI's init line carried an unusable model name (it is 200000 bytes, past the 128-byte bound) - the turn stands, the name is not recorded
    [VD/oversize] phase=Idle session_id=Some("fake-session-0001")
    [VD/oversize] registry bytes: 271 B, stored model len 0 B, has "model" key: false
    [VD/control]  registry bytes: 271 B, has "model" key: false
    [VD/rtl-override] registry bytes: 271 B, has "model" key: false

The turn STANDS in every case, the id off the same init line still rides,
and the key is **absent** rather than shortened — nothing was coerced. The
discriminating half round-trips, including a long Bedrock-style ARN the
session-id class would have refused:

    [VD/real] stored model: Some("claude-opus-5")
    [VD/bedrock-arn] stored model: Some("arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-5-sonnet-20241022-v2:0")   (101 B)

**CRITERION 5 — the blind tail, and ONE copy of the length rule.**
Pre-fix, template of 2, assembled of 3, flag at index 2:

    [VA] template len 2 assembled len 3
    [VA] flag past the template end -> Ok(())
    [VA] tail "--settings=/tmp/evil.json" -> Ok(())
    [VA] tail "doctor" -> Ok(())
    [VA] shorter -> Ok(())     [VA] empty -> Ok(())

Post-fix:

    [VA] flag past the template end -> Err(FlagInValuePosition { at: 2, arg: "--dangerously-skip-permissions", shape: KnownFlagName })
    [VA] tail "--settings=/tmp/evil.json" -> Err(FlagInValuePosition { at: 2, …, shape: FlagEqualsValue })
    [VA] tail "doctor" -> Err(FlagInValuePosition { at: 2, …, shape: KnownSubcommand })
    [VA] tail "" -> Err(ArgvLengthMismatch { template: 2, assembled: 3 })
    [VA] shorter -> Err(ArgvLengthMismatch { template: 2, assembled: 1 })
    [VA] empty -> Err(ArgvLengthMismatch { template: 2, assembled: 0 })
    [VA] reordered equal-length -> Err(FlagInValuePosition { at: 0, arg: "--resume", shape: KnownFlagName })

**The rule has exactly one home**, re-derived twice. `grep` finds no
restated `assert_eq!(template.len(), assembled.len())` anywhere. Deleting
the production length block reds exactly the dedicated pin and nothing else
(`the_argv_rule_inspects_the_whole_vector_not_the_zipped_prefix`, 104
passed / 1 failed). Making `argv` push one element past its template reds
**seven** lib tests including the derived pin — the builder's claim
reproduced verbatim, `at: 17` and all:

    a real id assembles: FlagInValuePosition { at: 19, arg: "--settings=/tmp/evil.json", shape: FlagEqualsValue }
    the spawn template assembles: FlagInValuePosition { at: 17, … }

`adapter.rs` `shasum -a 256` back to
`cd4078f1a51718411bbfc6e1d0b486a920e69705bfa7952fb9028ce225504de7` after
each drill. **Defeat attempts that did not work**: a lone `-` and a lone
`--` are both `LeadingDash`; a value equal to the template's literal at a
DIFFERENT index is refused (per-index exemption, not a set membership);
reordering at equal length is refused at index 0. **Two inert cases, both
ruled harmless**: `""` and the literal `{session_id}` classify as `None` —
neither is special to commander, and `validate_session_id` refuses both
long before assembly.

**CRITERION 6 — the tables audited against a first-hand `--help`.**
`claude 2.1.226`, `--help` read and parsed by the verifier:
**73 option tokens, 15 subcommand spellings.** Diffed against the source
tables: **zero misses in either direction for subcommands, zero misses for
flags.** The only asymmetry is two EXTRA rows —
`--append-system-prompt-file` and `--system-prompt-file` — which are real
flags named in `--bare`'s description prose but absent from the Options
list, so the table is a superset, i.e. stricter, i.e. harmless. **No miss
was found**, which is the finding; s2 remains right about the future.

**The subcommand class is real, and its reachability is calibrated.**
Re-derived: `validate_session_id` accepts all 15 subcommand spellings and
only the T-047 backstop refuses them —

    [ATK-argv] id doctor       validate=true argv=Err("argv element 18 would be 'doctor', … it is one of the CLI's own subcommands")
    [ATK-argv] id setup-token  validate=true argv=Err(…)
    [ATK-argv] id e7954de6-…   validate=true argv=Ok(19)

**One calibration on the builder's prose, not a criterion failure**: in
TODAY's template the substituted value sits at index 18, immediately after
`--resume` at 17, and `-r, --resume [value]` binds the next non-dash token
as its VALUE — so a bare `doctor` would be consumed as a resume value, not
dispatched as a subcommand. "`claude doctor` is a different program" is
true of the CLI; it is not true that today's argv would run it. The class
is a backstop for a future substituted slot, which is exactly what
`FlagInValuePosition`'s own doc comment says, and criterion 6's stated
minimum (known flag names, `--flag=value`) is met independently. The cost
side is real and measured — a CLI that ever issued a session id spelled
`doctor` would become unresumable — and s2 already records it.

**The `Bash(*)` note is ruled correct and correctly scoped.** `Bash(*)`
classifies as inert here, and rightly: it is a tool-PATTERN, invisible to
the argument parser and dangerous only to the permission parser. Nothing
substitutes into `--allowedTools` today (the six patterns are `const`, and
`no_adapter_argv_can_ever_bypass_permissions` still guards the table). A
rule about pattern semantics belongs with T-025-s4, not in an argv-shape
gate.

**CRITERION 7 — nothing else moved.** The six IPC enums were compared
against `2961599` body-for-body and are **byte-identical**: `StartOutcome`,
`SendOutcome`, `CancelOutcome`, `GenesisStatus`, `TurnError`, `RunEvent`.
`acl_pin.rs` (`EXPECTED_GRANTS`), `capabilities/`, `tauri.conf.json`:
zero-diff. `Cargo.toml` `35aa0898…` and `Cargo.lock` `03b5a5cb…`
**byte-identical** to the branch point — no new dependency.
`tauri::generate_handler!` identical — no new command. The three new enums
have no reference outside `adapter.rs`/`runner.rs` and none is
`Serialize`. **T-039's nine gate tests, run BY NAME**:
`no_adapter_argv_can_ever_bypass_permissions`,
`the_session_id_gate_is_an_allowlist_not_a_denylist`,
`a_rejection_names_itself_without_relaying_raw_bytes`,
`a_hostile_session_id_never_reaches_argv_at_all`,
`a_session_id_read_back_out_of_the_registry_is_validated`,
`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`,
`every_hostile_id_class_fails_the_turn_at_capture`,
`a_hostile_session_id_in_the_registry_file_is_refused_at_the_read_boundary`,
`a_hostile_resume_id_handed_straight_to_the_runner_spawns_nothing` — all
**ok**.

**EXECUTION SWEEP — 9/9.** Each new test body was poisoned with
`assert!(false, "T047V-SWEEP-<name>")`, run BY EXACT NAME so exactly one
test ran, the marker confirmed in the failure output, the file restored
from `HEAD` and `shasum -a 256` compared: **RED+marker, byte-identical, all
nine**. The set was derived from the diff rather than from the notes —
exactly 9 tests added, 0 removed, matching 208 → 217.

**SUITES (verifier's own runs).** cargo `217 passed + 3 ignored`, **three
consecutive runs, identical**, **zero warnings**. App: `npm run build` then
`npm test` → **483/483, 27 files**, bundle `index-DvrlAOQE.js` **442.05
kB**, `tsc --noEmit` clean. lib/parser **159/159, 10 files**, tsc clean.
tools/e2e **17/17 in 4.7 s** on port 14547. `lint:tokens` clean, 37 files.
**Graph delta: none** — `git diff --name-only 2961599` filtered to
`*.ts/tsx/js/jsx` is empty, and the plain ignored self-check
(`self_graph_is_current`) passes against the committed bytes with
`graph.json` unmodified.

**FENCE.** `git diff --name-only 2961599..HEAD` = four source files
(`adapter.rs`, `runner.rs`, `fake_agent.rs`, `tests/agent_runner.rs`) plus
this card and the suggestions. The forbidden set — `method/`, `lib/parser/`,
`app/src/`, `tools/`, `graph.json`, `docs_watch.rs`, `index_cmd.rs`,
`acl_pin.rs`, `lib.rs`, `capabilities/`, `tauri.conf.json` and every
manifest/lockfile — returns **nothing**. Neither other lane's files appear;
neither worktree was entered. No `fake_agent` orphan survives, no tattle
file or temp root remains.

**THE FOUR SUGGESTIONS, RULED.**

- **s4 (`$SHELL` → `Command::new`) — VERIFIED, and it is the sharpest of
  the four.** Reproduced directly: with `SHELL` pointed at a
  verifier-written script, that script was executed with `-l -c` and its
  answer became the child's PATH. The gate is shape-only (absolute +
  executable), never "what the program is". **Reachability, honestly:**
  in a GUI launch `SHELL` comes from the user's directory-services record
  (root to change) — but `launchctl setenv` in the user's own domain
  reaches subsequently-launched GUI apps with no admin, and in dev it is
  simply the launching terminal. So the precondition is code execution as
  the user, which already buys `~/.zshrc` — the very file this login shell
  is about to source. **Equivalent-privilege, correctly ruled, correctly
  not a gate.** Two things sharpen it, and s4 has one of them: T-047's own
  chosen arm makes this spawn happen **every turn** instead of once per
  install, and `RunnerConfig`'s doc comment "A hostile env var therefore
  cannot redirect the production spawn" is now demonstrably false — s4's
  option 3 is the necessary half, not the optional one. The half s4 does
  NOT name is `PATH`, filed as **s5**.
- **s1 (retire the cache) — VERIFIED AND STRENGTHENED.** Its economics
  argument is right and understated: measured with a counting shell, the
  cache saves **zero** login-shell spawns, not one — with or without the
  file, exactly one shell runs per turn, differing only in which script it
  is handed. Its quote of `runner.rs:227` is of the pre-fix wording (the
  line now says "the login-shell probe's `command -v`"), which does not
  touch the argument. The residual it exists to close was reproduced here
  three ways (symlink, content swap, newline-dir).
- **s2 (the table is a version snapshot) — VERIFIED, and the audit found
  no current miss.** Both sides of its cost analysis reproduced: the
  leading-dash arm covers unknown flags, subcommands are the one-sided
  exposure, and the false-positive direction is real (a `doctor`-shaped id
  becomes unresumable). One thing to add when it is picked up: the table
  also cannot see subcommands the CLI does not print in `--help`.
- **s3 (the model has no read boundary) — VERIFIED.** `SessionEntry.model`
  is a bare `pub` field; `native_session_id` has `resume_id()`. Nothing
  renders the disk-borne model today (`GenesisStatus` carries the
  in-memory one), so "do it in T-027" is the right placement.

**NEW: T-047-s5** — the freshly-probed path skips the gate the cached one
must pass, and `which_on_path` can hand back a RELATIVE path from the app's
inherited `PATH`; reproduced (`resolve_cli -> Ok(path: "relbin/claude")`,
executed, while `validate_cached_binary` calls the same string
`NotAbsolute` and the write gate declines to cache it). **T-047-s6** —
"no test can resolve the user's real CLI" is a discipline claim, not a
structural one; the verifier fell into it (a real `claude` process was
spawned by a scratch probe, though it 401'd and no model ran).

**@human:** one stray artifact outside the repo, left in place rather than
deleted — `~/.claude/projects/-private-var-folders-…-t047va-count-97806-…-project/`
(17 kB of synthetic, zero-token records from the s6 incident). Remove it if
you want it gone. Nothing else.
