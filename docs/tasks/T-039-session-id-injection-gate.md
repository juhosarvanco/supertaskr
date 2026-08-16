---
id: T-039
title: Session-id injection gate — a captured id must never parse as a flag
feature: F-03
milestone: 3
priority: 6
size: S
status: building
blocked_by: []
touches: [app-agent]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5 @fresh
verified_by: "claude-opus-5 @fresh"
review: same-model
---

Absorbs: T-025-s6. **This is a GATE on T-029, not a backlog item** —
T-029 is the task that reads the session id off `.nputer/sessions.json`
and spawns from it, which is precisely the step that turns this from
unreachable into reachable. It closes before T-029 dispatches.

What the T-025 verifier measured: `argv(Some(id))` substitutes the
captured session id into the resume template unvalidated, and
`claude --help` shows `-r, --resume [value]` takes an OPTIONAL
argument — so an id beginning with `-` parses as a standalone flag
rather than as the resume value. Injecting
`--dangerously-skip-permissions` produced the argv tail
`["WebSearch", "--resume", "--dangerously-skip-permissions"]`
**while the bypass pin stayed green**, because that pin searches the
adapter TABLE and this arrives through DATA. Unreachable today (only
the CLI authors that id, and `send_turn` resumes from memory), which
is exactly why it is cheap to close now and expensive to discover
later.

Verified despite the S size: the class is an argv injection, and the
pin that should have caught it is itself part of the fix. Executor +
adversarial verifier, not S-tier's executor-only path.

## Acceptance criteria
- THE captured session id SHALL be validated against a strict
  allowlist pattern before it is stored or substituted into argv —
  the CLI's own id shape (the observed form is recorded in T-025's
  real-smoke notes; derive the pattern from that rather than
  guessing), rejecting anything containing a leading `-`, a path
  separator, whitespace, a NUL, or any character outside the shape.
- IF a stream's init line carries an id that fails validation THEN
  the turn SHALL fail with a typed error naming the rejection, the
  id SHALL NOT be written to `.nputer/sessions.json`, and no resume
  SHALL be attempted with it — loud, never silently coerced or
  truncated into something acceptable.
- IF a session id read from an EXISTING `.nputer/sessions.json`
  fails validation THEN the runner SHALL refuse to resume from it
  and surface a typed outcome (the registry is a losable runtime
  file an attacker or a corruption could reach; T-029 will read it,
  so the check must live at the READ boundary, not only at capture).
- THE bypass pin SHALL be widened to cover data-borne flags: it
  SHALL assert over the FULLY ASSEMBLED argv — template plus every
  substituted value — that no element in a value position begins
  with `-`, in addition to its existing three-spelling search of the
  adapter table. The T-025 verifier's exact injection SHALL be a
  regression test that fails without the fix.
- THE existing runner behavior SHALL be otherwise unchanged: the
  spawn/resume round trip, session capture, transcript, kill
  semantics and typed failures all keep their current tests green,
  and no new grant, dependency, or IPC surface appears.

Verification: headless — cargo tests against the fake CLI, including
the verifier's measured injection as a failing→passing pin and at
least one hostile id read from a crafted registry file. No real model
calls. @human: none.

## Implementation notes

Built by `claude-opus-5 @fresh` on branch `t039-injection-gate`, branch
point main@7f5025b. Worktree-only; nothing committed to main. **Main
moved while this built** — `97845cf` (T-040, the human's inline
`default-run` fix) landed after the branch point; it touches
`app/src-tauri/Cargo.toml` and two `docs/tasks/T-040*` files, disjoint
from everything here, and reports cargo unchanged at 200 + 3.

### The validation pattern, and where it comes from

    ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$

Derived from what the CLI actually produces, not guessed:

- the ONE real id ever observed in this repo is a hyphenated
  lowercase-hex UUID — `e7954de6-…`, 36 bytes, recorded by T-025's
  real-CLI smoke and quoted in T-025-s2;
- `claude 2.1.226`'s own `--help` names the shape for its sibling flag:
  `--session-id <uuid>   Use a specific session ID for the conversation
  (must be a valid UUID)` (read first-hand at build time — `--help`
  only, no model call).

A UUID-exact regex was considered and **deliberately widened** to this
ASCII token, for two recorded reasons and no others: (1) a CLI that
changes its id format — a prefix, a ULID, a base58 blob — would
otherwise make every recorded session unresumable on upgrade, a loud
failure but a needless one; (2) the fake CLI the whole suite runs
against emits `fake-session-0001`, and pinning to UUID would have forced
a rewrite of the T-025 assertions this task is required to leave
standing. **The security property does not depend on the widening**:
every character in the allowlist is inert to an argument parser — no
leading `-` (so it can never be a flag), no `=` (so it can never be
`--flag=value`), no `/` or `\` (never a path), no whitespace, no NUL,
no control character, nothing outside ASCII, and a hard 128-byte bound.
A UUID is a strict subset. The first character is additionally required
to be alphanumeric, so `.`, `..` and `.hidden` are refused as a class:
an id is not a path component, and the day something joins one to a
path the answer is already no.

It is an ALLOWLIST — a shape an id may have — not a denylist of the
strings that were measured. `adapter.rs:258` is the whole rule; there is
no second copy.

### Criteria → evidence

**Criterion 1 — validated at capture, against a strict allowlist derived
from the observed shape, before storing or substituting.**
`adapter.rs:258` `validate_session_id`, `adapter.rs:167`
`SESSION_ID_MAX_LEN`, `adapter.rs:174` `SessionIdRejection` (six named
variants). The capture site is `runner.rs:931`, inside the
`StreamLine::Init` arm — BEFORE `emitter.session_registered`, before
`out.native_session_id` is set, before anything is written. Table pin:
`adapter.rs:493 the_session_id_gate_is_an_allowlist_not_a_denylist`.

**Criterion 2 — a failing id at capture fails the turn, typed, and is
never written or resumed.** `runner.rs:931-948` sets
`TurnError::MalformedStream { why }` and breaks the relay loop, so the
existing failure path runs unchanged: the group is killed, the turn is
reported `failed`, the registry entry settles `idle`. `MalformedStream`
is reused deliberately rather than adding a variant — s6 proposed it,
and a new `TurnError` arm would need a mirror in
`app/src/lib/agent-store.ts`, which this fence forbids (see T-039-s3).
The id is never coerced: there is no truncation, no re-encoding, no
"strip the leading dash" path anywhere. Pin:
`tests/agent_runner.rs:925` — one test asserting the typed error, the
ABSENCE of a `sessionRegistered` event, the ABSENCE of a `completed`
event, `native_session_id == None` in status AND in the registry file's
bytes, `send_turn` → `noSession`, and no second child ever spawned.
Class coverage through the same live capture path:
`tests/agent_runner.rs:990`.

**Criterion 3 — the REGISTRY READ boundary.** `sessions.rs:70`
`SessionEntry::resume_id()` — the accessor T-029 must use; reading the
raw field to spawn with is now the bug, and `adapter::argv` refuses it a
second time if anyone does. Used at `mod.rs:249`, where a rejection
becomes `StartOutcome::Error { message }` naming the file, the entry and
the reason (`Ok(None)` — an entry with no id — still starts fresh, which
is not an error). Pins: `sessions.rs:380` (unit, file crafted on disk)
and `tests/agent_runner.rs:1038` (through `start_genesis`, four hostile
ids including one carrying a NUL, plus the discriminating half: the same
file with a real UUID still yields `ResumeAvailable`).

**Criterion 4 — the bypass pin, widened to the fully assembled argv.**
`adapter.rs:420`, now three halves: (1) the existing three-spelling
case-insensitive table search, unchanged in wording and message, but its
input `all_argv_strings()` now substitutes FOUR real ids instead of one
UUID; (2) NEW — over the fully assembled argv of every adapter, spawn
and resume, an element may begin with `-` only by BEING the template's
own flag at that index, byte for byte; (3) NEW — the T-025 verifier's
exact injections (`--dangerously-skip-permissions`,
`--permission-mode=bypassPermissions`,
`--allow-dangerously-skip-permissions`, `-r`) are asserted to be
`Err(LeadingDash)`, i.e. to have no argv at all.
The same rule runs in PRODUCTION, not only in the pin:
`adapter.rs:289 check_no_data_borne_flag` is called from
`adapter.rs:311 argv` on every assembly. It returns a typed refusal
rather than panicking — a `debug_assert!` would leave the shipped binary
unguarded, and a panic in the spawn path would be worse than the typed
failure the runner already knows how to report.

**Criterion 5 — everything else unchanged.** The round trip, capture,
transcript, kill semantics and every typed failure keep their tests:
`cargo test` is 200 → **208 passed + 3 ignored**, +8 all new, 0 changed
in meaning except the one this task supersedes —
`a_hostile_session_id_stays_one_inert_argv_element` is now
`a_hostile_session_id_never_reaches_argv_at_all` (adapter.rs:703): its
old claim (one inert element) was true and insufficient, which is
exactly T-025-s6's finding; the test now asserts the stronger property
and keeps the old one for a well-shaped id. No new grant
(`EXPECTED_GRANTS`, `capabilities/`, `tauri.conf.json` all zero-diff),
no new dependency (`Cargo.toml`/`Cargo.lock` zero-diff), no new command,
no IPC surface: `StartOutcome`, `SendOutcome`, `CancelOutcome`,
`GenesisStatus`, `TurnError` and `RunEvent` all keep exactly their
variants, so `app/src/lib/agent-store.ts` needs no change and has none.

### The six proof obligations

**1. The failing→passing pin, measured both ways.** Reproduced FIRST
against unfixed code, at two levels. Unit, the verifier's exact
measurement:

    [t039-probe-a] argv tail: ["WebSearch", "--resume", "--dangerously-skip-permissions"]
    [t039-probe-a] argv tail: ["WebSearch", "--resume", "--permission-mode=bypassPermissions"]
    [t039-probe-a] the existing bypass pin is GREEN over the same table

And end to end through DATA — the fake CLI putting the injection in its
own init line, a real spawned child recording its own argv:

    [t039-probe-b] captured native_session_id: Some("--dangerously-skip-permissions")
    [t039-probe-b] registry native_session_id: Some("--dangerously-skip-permissions")
    [t039-probe-b] resume accepted, turn 2
    [t039-probe-b] TURN 2 CHILD ARGV TAIL: ["WebSearch", "--resume", "--dangerously-skip-permissions"]

The same inputs after the fix:

    [t039-probe-a] argv("--dangerously-skip-permissions") -> Err(LeadingDash): it begins with '-', which the CLI would parse as a FLAG rather than as the value of --resume
    [t039-probe-a] argv("--permission-mode=bypassPermissions") -> Err(LeadingDash): it begins with '-', which the CLI would parse as a FLAG rather than as the value of --resume
    [t039-probe-a] argv(real uuid) tail: ["WebSearch", "--resume", "e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77"]
    [t039-probe-b] turn 1 typed failure: {"kind":"malformedStream","why":"the CLI's init line carried an unusable session id: it begins with '-', which the CLI would parse as a FLAG rather than as the value of --resume"}
    [t039-probe-b] captured native_session_id: None
    [t039-probe-b] registry native_session_id: None
    [t039-probe-b] send_turn -> NoSession
    [t039-probe-b] turn-2 child dump exists: false

The probes were scratch; the permanent pins are the four integration
tests and the four unit tests listed above.

**2. Allowlist, not denylist — the table actually tested.** Accepted:
the observed real UUID `e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77`, the
fixture id `fake-session-0001`, a ULID, `sess_2f8a.9c`, `a`, `A1`, `0`,
and 128 bytes exactly. Rejected, each with its named variant:

| input | rejected as |
|---|---|
| `--dangerously-skip-permissions` | `LeadingDash` |
| `--permission-mode=bypassPermissions` | `LeadingDash` |
| `--allow-dangerously-skip-permissions`, `-r`, `-` | `LeadingDash` |
| `../../etc/passwd`, `.hidden` | `IllegalStart { '.' }` |
| `_leading` | `IllegalStart { '_' }` |
| `a/../b`, `a\b` | `IllegalChar` U+002F / U+005C |
| `has space`, `tab\there`, `line\nbreak` | `IllegalChar` U+0020 / U+0009 / U+000A |
| `abc\0--dangerously-skip-permissions` | `IllegalChar` U+0000 |
| `abc\u{1b}[2Kdef`, `abc\u{7f}` | `IllegalChar` U+001B / U+007F |
| Cyrillic `е7954de6`, full-width `－-abc` | `IllegalStart` U+0435 / U+FF0D |
| `e7954de6‐2ac1` (U+2010 hyphen) | `IllegalChar` U+2010 |
| `x; rm -rf ~ #\`whoami\`$(id)`, `a=b` | `IllegalChar` U+003B / U+003D |
| `""` | `Empty` |
| 129 bytes, 4096 bytes, 1 MiB | `TooLong { len }` |

Every row is asserted twice — through `validate_session_id` AND through
`CLAUDE_V1.argv(Some(id))`, so a future refactor that validates in only
one of the two places reds. Seven of these classes are additionally
driven through the LIVE capture path against the fake CLI
(`tests/agent_runner.rs:990`); NUL cannot ride a `Command::env` value,
so it is driven through the registry file instead, which is where a NUL
would realistically arrive.

**3. Both boundaries, proven independently.** Capture: the fake's init
line, above. Registry read: `.nputer/sessions.json` crafted by hand
with a planter closure — no runner code involved in producing it — then
`start_genesis` returns

    Error { message: "refusing to resume session 'S1' from
    .nputer/sessions.json: it begins with '-', which the CLI would parse
    as a FLAG rather than as the value of --resume. That file is runtime
    state, losable by charter - delete it to start over." }

with no child spawned, no kit materialized, and the planted file left
byte-identical (refusing to resume is not a licence to rewrite the
user's runtime state). A third, independent proof for T-029's actual
call shape: `run_turn` handed `resume: Some("--dangerously-skip-
permissions")` directly returns `MalformedStream` with ONE `failed`
event, no `started`, and no child at all — then the same call with the
real UUID spawns and resumes normally.

**4. The widened pin catches data-borne flags — drilled four times.**
(a) Removed the validation from `AgentAdapter::argv` (the exact pre-fix
code): **three tests red**, including the pin —
`a session id beginning with '-' must never assemble into argv:
"--dangerously-skip-permissions"`, printing the assembled tail.
(b) With validation still removed, planted `--add-dir=/` in the pin's
own id list so half one could not fire first: half two red with its own
message — `ADAPTER VALUE-POSITION VIOLATED (T-039): assembled argv
element 18 is "--add-dir=/", which begins with '-' without being the
template's own flag "{session_id}"`.
(c) Restored, then planted each of the three forbidden spellings in
`CLAUDE_V1.spawn_args`, one at a time: the original search fired every
time with its original message (`ADAPTER BYPASS BAN VIOLATED (T-025
§2) …`), including `--permission-mode=bypassPermissions` caught by the
`bypassPermissions` needle.
(d) Reverted; `git diff` on `adapter.rs` back to the intended 402/33,
suite green.

**5. Nothing else moved.** `cargo test` **208 passed + 3 ignored**,
three consecutive runs, identical every time; `cargo build` clean. App:
`npm run build` then `npm test` **483/483, 27 files**. lib/parser
**159/159, 10 files**. tools/e2e **17/17**. `npm run lint:tokens`
**clean, 37 files** (the T-038 false positive is gone from main).
Fence, `git diff --stat 7f5025b` — SIX files, all inside the agent
module and its fixtures:

    app/src-tauri/src/agent/adapter.rs  | 435 +++-
    app/src-tauri/src/agent/mod.rs      |  35 +-
    app/src-tauri/src/agent/runner.rs   |  46 +-
    app/src-tauri/src/agent/sessions.rs |  87 ++
    app/src-tauri/src/bin/fake_agent.rs |  13 +
    app/src-tauri/tests/agent_runner.rs | 287 +-

plus this task file and the suggestions at commit time. Zero diff to
`method/`, `lib/parser/`, `app/src/**`, `tools/`,
`docs/architecture/graph.json`, `docs_watch.rs`, `index_cmd.rs`,
`acl_pin.rs`, `lib.rs`, `capabilities/`, `tauri.conf.json`, and every
manifest and lockfile — checked as an explicit empty-set `git diff
--name-only` over that path list, not by eye. Nothing bound or contacted
port 1420; no real model was called (the `#[ignore]`d smoke was not run,
and `claude` was invoked only for `--help`/`--version` facts). No
`fake_agent` orphan survives: `pgrep -fl fake_agent` empty at the end.

**6. Every new test executes.** A poison `assert!(false, "T039-SWEEP
<name>")` was scripted into each of the EIGHT new test bodies, one at a
time, the specific test run, the sweep string confirmed in the failure
output, and the file restored and byte-compared. All eight red on
demand: the three adapter tests, the sessions read-boundary test, and
the four integration tests. The two MODIFIED tests were shown red by
drill 4 rather than by poison, which is stronger.

### Expected graph delta at merge: NONE

`docs/architecture/graph.json` must not move. The interim integrator
rule (T-009-s1) fires on a diff touching `*.ts/*.tsx/*.js/*.jsx` outside
`docs/`; this branch touches none — six `.rs` files, one task file, the
suggestions. `nputer-index` walks `Lang::Ts, Lang::Js` only, so the
agent module is invisible to it until T-010 lands Rust extraction. The
graph stays at 88 files. Do not regenerate.

### Deviations, and what was deliberately NOT done

1. **`AgentAdapter::argv` now returns `Result`.** The alternative was a
   second `try_argv` beside an infallible `argv`, which leaves the
   vulnerable spelling in the tree for a future caller to reach for.
   Making the ONE assembly function fallible is what makes the guarantee
   structural: there is no way to build a resume argv without passing
   the gate. Cost: five call sites in the existing adapter tests gained
   an `.expect()`.
2. **`TurnError::MalformedStream` is reused; no new variant.** A
   dedicated `RejectedSessionId` arm would read better in the store, and
   it would need a mirror in `app/src/lib/agent-store.ts` — outside this
   task's fence, and a partial mirror is worse than none. Filed as
   T-039-s3 for T-029, which touches both sides anyway.
3. **The registry-read refusal is `StartOutcome::Error { message }`**,
   the enum's existing typed arm for "this project's runtime state is
   not usable", for the same mirror reason. The message names the file,
   the entry and the rejection, and says the file is losable.
4. **The `model` field captured from the same init line was NOT
   validated.** It is data, it never reaches argv or a path, and serde
   escapes it into JSON — but it is unbounded and unchecked, and that is
   a different (much smaller) hole than the one this task closes. Filed
   as T-039-s2 rather than fixed silently.
5. **The refusal message never echoes the refused id.** It names the
   class, the offending character's codepoint, and the byte offset, with
   `escape_debug` on everything borrowed — so an id carrying a terminal
   escape or a newline cannot forge a log line or paint a terminal on
   its way through the explanation of why it was refused. Pinned by
   `adapter.rs:566`.

### Genuine silences, left open deliberately

- **The resolved-binary cache is the same class of hole, one level
  worse, and is out of this task's scope.** `agent-paths.json` in the
  app config dir feeds `Command::new(&cli.path)` — a file-borne PATH to
  an EXECUTABLE, gated only by "is it an executable file" — and its
  `login_path` becomes the child's `PATH`, deciding which `git` and `cp`
  the agent's own Bash resolves. Everything T-039's criterion 3 says
  about `.nputer/sessions.json` applies to it verbatim. Filed as
  T-039-s1; not fixed here because the fence is `agent/**`'s session-id
  path and because the right answer (re-probe rather than trust, or
  bound the cache to a probe signature) is a design call, not a
  one-liner.
- The gate is a SHAPE check, not an authenticity check: a well-formed id
  that simply is not this project's session still resumes whatever the
  CLI has under that id. Bounding that needs the CLI to expose session
  ownership, which it does not.
- `sessions.json`'s `agent` field is read but never used to select an
  adapter (v1 hard-codes the one entry), so a registry claiming a
  different agent is silently ignored — harmless today, worth knowing
  when the table grows.

## Verdicts

2026-08-16 — claude-opus-5 @fresh (verifier, same-model review):
**APPROVED.** Five criteria met. The vulnerability was reproduced
first-hand against the PRE-FIX code — both halves, unit and end-to-end
through a real spawned child — before the fix was read as a fix; the
allowlist was attacked by exhaustive brute force rather than by reading
its table; both boundaries were re-proved with the verifier's own hostile
registry and the verifier's own ids; every new test was poisoned red by
the verifier. One new suggestion filed (s4, the backstop's unchecked
slice lengths). Nothing found rises to a criterion failure.

**Merge is still clean.** Branch point re-derived: `git merge-base
t039-injection-gate main` = `7f5025b`, and main has since moved twice
(`97845cf` T-040 `default-run`, `2536776` the second triage, which
removed the absorbed `T-025-s6` file). `git merge-tree` over
`7f5025b..HEAD` vs `7f5025b..main` produces **zero conflict markers**;
the two ranges are disjoint.

**The CLI facts, read first-hand, not inherited.** `claude 2.1.226`.
`claude --help` line 175: `-r, --resume [value]` — SQUARE brackets, an
OPTIONAL argument, which is the entire mechanism of the bug. Line 189:
`--session-id <uuid>  Use a specific session ID for the conversation
(must be a valid UUID)` — the CLI's own name for the id shape, verbatim,
so the pattern's derivation is sourced and not guessed. `--help` and
`--version` only; the `#[ignore]`d smoke was never run and no model was
called.

**Criteria 1+2 — the vulnerability, reproduced by the verifier on the
pre-fix code.** Pre-fix `adapter.rs`/`runner.rs`/`sessions.rs`/`mod.rs`/
`tests/agent_runner.rs` were checked out from `7f5025b` and driven by a
scratch probe of the verifier's own writing. Unit half:

    [vprobe-a] argv tail for "--dangerously-skip-permissions": ["WebSearch", "--resume", "--dangerously-skip-permissions"]
    [vprobe-a] argv tail for "--add-dir=/": ["WebSearch", "--resume", "--add-dir=/"]

…and on the same tree `cargo test --lib
no_adapter_argv_can_ever_bypass_permissions` → **ok**. The pin was GREEN
while the flag was in the argv. Both halves of T-025-s6 confirmed.
End-to-end through DATA, a real spawned child recording its own argv:

    [vprobe-b] captured native_session_id: Some("--dangerously-skip-permissions")
    [vprobe-b] registry native_session_id: Some("--dangerously-skip-permissions")
    [vprobe-b] registry file carries 'dangerously': true
    [vprobe-b] send_turn -> Accepted { turn: 2 }
    [vprobe-b] TURN 2 CHILD ARGV TAIL: ["WebSearch", "--resume", "--dangerously-skip-permissions"]

The same probes against HEAD:

    [vprobe-a2] argv("--dangerously-skip-permissions") -> Err(LeadingDash)
    [vprobe-a2] argv("--add-dir=/") -> Err(LeadingDash)
    [vprobe-a2] argv(real uuid) tail: ["WebSearch", "--resume", "e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77"]
    [vprobe-b2] turn 1 typed failure: {"kind":"malformedStream","why":"the CLI's init line carried an unusable session id: it begins with '-', which the CLI would parse as a FLAG rather than as the value of --resume"}
    [vprobe-b2] captured native_session_id: None
    [vprobe-b2] registry native_session_id: None
    [vprobe-b2] registry file carries 'dangerously': false
    [vprobe-b2] send_turn -> NoSession
    [vprobe-b2] turn-2 child dump exists: false

`runner.rs:949` is the ONLY assignment to `out.native_session_id` in the
tree, and it sits immediately after the validation break — so there is no
second capture path to gate.

**THE STRONGEST ATTACK ON THE PATTERN — exhaustive, and it holds.** The
table in the notes is a list of strings; a list of strings cannot prove
an allowlist. The verifier swept **every codepoint from U+0000 to
U+2FFFF** (196,608 values) through `validate_session_id` in both
positions and compared the accept sets to `[A-Za-z0-9]` and
`[A-Za-z0-9._-]` by equality, not by sampling:

    [vprobe-c] accepted at position 0: 62 chars   (== '0'..='9','A'..='Z','a'..='z', asserted equal)
    [vprobe-c] accepted in body: 65 chars         (== the above + '-', '.', '_', asserted equal)

Both `assert_eq!`s passed. **It is a genuine allowlist**: no homoglyph,
no full-width form, no combining mark, no control character, no
non-ASCII codepoint anywhere in that range is accepted in either
position. The Cyrillic and full-width claims are true as a consequence of
the rule, not as rows in a table. Length is exact: 128 `Ok`, 129
`TooLong { len: 129 }`, 0 `Empty`; the length check runs on bytes BEFORE
the char loop, so a 1 MiB id costs one comparison.

Then, hunting for an ACCEPTED string that is still dangerous: all
261,950 accepted three-character ids were generated and each asserted to
be pure ASCII, to not begin with `-`, to carry no whitespace, control
char, `=`, `/`, `\`, `@`, `$` or `:`, to never equal `.` or `..`, and to
assemble into exactly one argv element whose last position does not begin
with `-`. All passed. The `.`/`..` composition attack was measured rather
than argued: `a..b`, `a..`, `a.` are indeed accepted, and
`Path::new("/base/x").join(…)` renders every one of them as
`Normal("a..")` — never `ParentDir`. Only a bare `..` is `ParentDir`, and
a bare `..` cannot pass the first-character rule. An accepted id is
always exactly one non-traversing path component. Normalization tricks
are closed structurally: the accept set is pure ASCII, whose NFC/NFD/NFKC
forms are itself, and no non-ASCII input ever gets through to be
normalized. Overlong UTF-8 cannot exist in a Rust `&str`, and the two
sources are both `serde_json` Strings.

**What survived the attack, reported honestly:** Windows-reserved device
names — `NUL`, `CON`, `AUX`, `PRN`, `COM1`, `LPT1`, `nul.txt` — are
accepted by the pattern, and `is_executable_file` returns `true`
unconditionally under `#[cfg(not(unix))]`. On a Windows host an id joined
into a path could name a device rather than a file. Not filed: nothing in
this tree joins the id to a path (it reaches `Command::args` only),
Windows is not a target today, and the effect would be an empty read, not
an escalation. Recorded so the day this ports, it is already known. Also
measured: `--help` says `--resume`'s value may be "a search term" for the
interactive picker, so a well-shaped id that is not this project's
session is a search term rather than an error — which is exactly the
"shape check, not authenticity check" silence the notes already record,
and it is bounded by the runner's existing start/stall timeouts.

**Criterion 3 — the registry read boundary, re-proved with the
verifier's own file and the verifier's own ids.** A hand-written
`.nputer/sessions.json` (a `format!` template, no runner code involved),
planted with eleven ids the builder never used — chosen from
`claude --help` for what they would actually DO, not for how they look:
`--settings=/tmp/nputer-evil-settings.json` (loads an arbitrary settings
file, arguably a worse injection than the measured one), `-c`
(`--continue`), `--fork-session`, `--safe-mode`, `--add-dir=/`, plus `""`,
`..`, a U+2010 lookalike, a NUL-carrying id, 129 bytes, and an
embedded-space id. **Every one**: `StartOutcome::Error` naming the file,
the entry (`'P9'`) and the rejection class; `child spawned: false`;
`kit materialized: false`; `file byte-identical: true`; and no echo of
the refused id in the message. The discriminating half, with ids the
builder never used — `01JQ8ZC4M7Q9K2VYB3T5N6XW0R`, `a`, `0`,
`sess.2f8a-9c_x` — all → `ResumeAvailable`; an entry with no id at all →
`Started`, not an error. The T-029-shaped path independently: `run_turn`
handed `resume: Some(hostile)` for six different values returned
`MalformedStream` every time with `spawned=false` and exactly one
`Failed` event, no `Started`; the same call with the real UUID spawned
and resumed normally.

**Criterion 4 — the widened pin, attacked and drilled.** Drills
re-derived, not accepted. (a) Removing `validate_session_id(id)?` from
`AgentAdapter::argv`: **three lib tests red**, the pin among them —
`a session id beginning with '-' must never assemble into argv:
"--dangerously-skip-permissions"`. (b) With the argv body restored to the
literal pre-fix shape (validation AND backstop removed) and `--add-dir=/`
planted in the pin's own id list — a string none of the three needles
match, so half one cannot fire — half two red with its own message:
`ADAPTER VALUE-POSITION VIOLATED (T-039): assembled argv element 18 is
"--add-dir=/", which begins with '-' without being the template's own
flag "{session_id}"`. Worth noting: with only the validation removed, the
PRODUCTION backstop caught `--add-dir=/` first, inside
`all_argv_strings()` — the guarantee is genuinely structural and not
test-only. (c) Each of the three original spellings planted in
`CLAUDE_V1.spawn_args` one at a time: all three fire with the ORIGINAL
message, `--permission-mode=bypassPermissions` caught by the
`bypassPermissions` needle exactly as claimed. (d) `adapter.rs` restored
and `shasum`-compared byte-identical after every drill.

**The strongest attack on the pin, and what survived.** The exemption
clause (`arg == *slot`) cannot be abused: it can only exempt a
non-substituted element, because a substituted position's slot is
`{session_id}` and an id equal to `{session_id}` is rejected
(`IllegalStart { ch: '{' }`). The rule is applied to EVERY index, not
only to positions the code believes are value positions, which is
stronger than criterion 4 asks. Two real gaps found, both in the
production backstop and both currently unreachable, filed as
**T-039-s4**: (1) `zip()` silently skips any assembled tail longer than
the template — a flag at index 2 with a 2-element template returns
`Ok(())`, while the TEST pin has the `assert_eq!(template.len(),
assembled.len())` the production function lacks; (2) the backstop covers
the leading-dash class only — `Bash(*)` substituted into an
`--allowedTools` value slot returns `Ok(())` — which is correct for
criterion 4 but narrower than the doc comment promises. Neither weakens
T-039: the session-id allowlist is what makes the class impossible, and
`@responsefile` and `+x`, which slip past the backstop, are both rejected
by the allowlist before they can reach it.

**Criterion 5 — nothing else moved, and the reuse of existing variants is
honest.** Enum surfaces compared programmatically old-vs-new:
`StartOutcome`, `SendOutcome`, `CancelOutcome`, `TurnError`, `RunEvent`
identical. `app/src/**` zero-diff, so `agent-store.ts` needs no mirror and
has none. `acl_pin.rs` zero-diff, so `EXPECTED_GRANTS` is untouched.
**Ruling on the deliberate reuse (deviations 2 and 3):** honest, and
correctly scoped. Both refusals ARE typed, both NAME the rejection in a
`why`/`message` the user can act on, neither is silent and neither is
coerced — the criteria are met on their own terms, not on a reading-down
of them, and a Rust variant with no TS mirror would be drift across a
fence this task was told to hold. What the reuse costs is MACHINE
distinguishability in a UI that does not yet exist. One sharpening for
T-029, recorded rather than filed twice: s3 frames the new variants as
"worth doing", but the `StartOutcome` half is closer to a precondition
for T-029 doing its job — T-029's resume affordance is exactly the screen
that must say "your saved session is unusable, delete it" differently
from "the registry could not be written", and today it can only tell
them apart by parsing English. The message already carries the
instruction, so no user is stranded meanwhile.

**Coercion sweep (criterion 2's "loud, never coerced").** Grepped the
whole agent module for `trim`/`replace`/`retain`/`strip_*`/`truncate`/
`filter`/`to_lowercase`/`normali*`: nothing touches the id path. The one
`truncate_utf8` near a rejection (`mod.rs:269`) bounds the ENTRY KEY
(`'S1'`) inside the error message, not the id, and the id itself is never
echoed at all — the message names the class, the codepoint and the byte
offset, all `escape_debug`'d, so a refused id carrying `\u{1b}[2K` cannot
paint a terminal on its way out. Re-derived: `it carries '\\0' (U+0000)
at byte 2, …`.

**Execution sweep — re-derived, not accepted.** A poison
`assert!(false, "T039-VSWEEP-<name>")` was scripted into each of the
**nine** changed test bodies one at a time (the 8 new + the renamed
`a_hostile_session_id_never_reaches_argv_at_all`), that single test run
by exact name, the sweep marker confirmed in the failure output, the file
restored and `shasum -a 256` compared byte-identical. **9/9 red on
demand.** Test-name delta independently derived by diffing function names
`7f5025b` vs `HEAD`: 8 added, 1 renamed, 0 deleted-without-replacement —
200 + 8 = 208, and the arithmetic matches the observed total.

**Suites, run fresh in this worktree.** Bare `cargo test` from
`app/src-tauri`: **208 passed + 3 ignored**, three consecutive runs,
identical every time. `cargo build` clean. App: `npm run build` (252
modules) then `npm test` **483/483, 27 files**. lib/parser **159/159, 10
files**. tools/e2e **17/17**. `npm run lint:tokens` **clean, 37 files**.
Nothing bound or contacted port 1420 — the runner opens no sockets and no
suite starts a server. `pgrep -fl fake_agent` empty at the end; no
orphans.

**Fence, proved as an empty set rather than by eye.** `git diff
--name-only 7f5025b..HEAD` is exactly TEN files: the six `.rs` inside
`app/src-tauri/src/agent/` + `bin/fake_agent.rs` + `tests/agent_runner.rs`,
this task file, and three suggestions. The same command restricted to
`method/`, `lib/parser/`, `app/src/`, `tools/`,
`docs/architecture/graph.json`, `docs_watch.rs`, `index_cmd.rs`,
`acl_pin.rs`, `lib.rs`, `capabilities/`, `tauri.conf.json` and every
`Cargo.toml`/`Cargo.lock`/`package.json`/`package-lock.json` returns
**nothing**. The graph-delta forecast (none) is right: no
`.ts/.tsx/.js/.jsx` file outside `docs/` moved.

**T-039-s1 — verified line by line, and it is REAL. Ruling: live
backlog, not a gate, and that makes it more urgent than s6 was, not
less.** Every element of the claim checks out. `read_cache`
(`runner.rs:450`) does `serde_json::from_str` → `PathBuf::from(entry
.path)` with **zero** validation — not absolute, not `..`-free, not
name-matched to `adapter.binary`, not signature-bound. `resolve_cli` step
(1) (`runner.rs:249-254`) gates it on **exactly** `is_executable_file`,
then hands it to `probe_version`, which does `Command::new(path)` —
**the poisoned binary is executed at RESOLVE time, before any turn**, a
step sharper than the s1 card claims. Then `run_turn` does
`Command::new(&cli.path)` (`runner.rs:843`) for every turn thereafter.
The second half is worse: `cli.login_path` reaches `apply_child_env`
(`runner.rs:850`) and becomes the child's `PATH` at `runner.rs:546-553`
with **no gate whatsoever** — not even an executable bit, since it is a
string. `resolve_cli` is called from both `mod.rs:278` (`start_genesis`)
and `mod.rs:375` (`send_turn`), so the file is read LIVE on every start
and every turn, not once at install. The config dir is real
(`lib.rs:361`, `app.path().app_config_dir()`).

Where it differs from T-025-s6, which decides whether it gates anything:
s6 was unreachable until T-029 landed, so "close it before T-029
dispatches" was the correct shape. **This path is already live in shipped
code — no future task turns it on.** There is therefore nothing for it to
gate; it is backlog, but backlog that is reachable today rather than
reachable later. The honest counterweight, which the s1 card does not
state and should: the precondition is write access to the user's own app
config dir, and anything with that generally also has `~/.zshrc`,
`~/.claude/settings.json` and LaunchAgents — so this is not a privilege
boundary crossing, it is one more equivalent-privilege persistence
surface. What lifts it above ordinary backlog is the COMPOSITION s1
correctly identifies: nputer's stated containment is a six-pattern Bash
allowlist, T-025-s4 already records that those patterns match the COMMAND
STRING and carry no path scope, and an ungated `login_path` silently
decides which `git`/`cp` those patterns resolve to. The containment
nputer advertises is weaker than it reads, and that is the class this
project treats as load-bearing. Encoding and scope are right; the
proposed fixes (bind the cache to a probe signature; validate absolute +
no `..` + filename == `adapter.binary`; do not cache the PATH) are the
right three. @human: worth a priority call at the next triage — the
verifier would take the third option first, since the PATH half is both
the ungated one and the cheap one.

**T-039-s2 — real, correctly sized, correctly deferred.** Verified:
`classify_line` reads `model` at `runner.rs:701`, `runner.rs:952-953`
copies it into `out.model` unvalidated, and the only bound anywhere is
`MAX_LINE_BYTES` (1 MiB) — so ~1 MiB per turn can land in a registry file
that is otherwise a few hundred bytes. The card's own limiting analysis
is right (never argv, never a path, serde-escaped), and declining to fold
it into a security task by sympathy is the correct instinct.

**T-039-s3 — real; see the ruling above.** `agent-store.ts:36`
(`malformedStream`) and `:67` (`error`) confirm the mirror argument and
confirm the webview genuinely cannot discriminate today.

Verified headless throughout; no screen control, no boot-check script, no
real model call, port 1420 never touched. @human: none blocking; one
priority call on s1 noted above.
