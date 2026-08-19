---
id: T-081
title: A denial is news when it happens — the in-band channel the runner drops, and the fixture that was a guess
feature: F-03
milestone: 4
priority: 39
size: M
status: verifying
blocked_by: []
touches: [app-agent]
builder:
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review:
---

Absorbs: T-029-s5 (fifth triage, 2026-08-19). The suggestion file is
removed in the same commit as this card.

**T-029-s5's close condition was "one observation, not a build", and the
observation happened** — one authenticated planner turn against CLI
2.1.226 on 2026-08-19, recorded at `docs/research/real-cli-observation.md`
with the protocol lines preserved verbatim at
`docs/research/captures/real-planner-turn-2026-08-19.jsonl`. It answered
all three of s5's unknowns and turned up a fourth thing nobody had asked
about. Two of the four answers cost nothing; the other two are this card.

WHAT THE OBSERVATION SETTLED, AND WHY IT IS NOT WORK:

- `permission_denials` entries **are objects carrying `tool_name`**, on
  the `result` line, cumulatively. `denial_names()` reads `tool_name`
  first — **correct as written**, and the defensive string branch is
  now known-unused rather than unknown.
- `terminal_reason` for a completed turn reads **`"completed"`**, not
  the fixture's guessed `"refusal"`. This *vindicates* the narrow guard
  (`result_is_error && !denials.is_empty()`): the wider
  "`terminal_reason` outside the normal set" form would have needed
  `"completed"` in the normal set, and this run — **two denials with
  `is_error: false`** — is precisely the denial-then-recover turn that
  must never be reported as a failure. Do not widen it.

ONE MECHANISM, AND IT IS THE THING THE OBSERVATION FOUND BY ACCIDENT:
**the CLI announces a denial the moment it happens, on a channel the
runner throws away, and the app stays silent until the turn ends.**

    {"type":"system","subtype":"permission_denied","tool_name":"Bash",
     "tool_use_id":"toolu_…","decision_reason_type":"subcommandResults",
     "message":"This Bash command contains multiple operations. The
     following part requires approval: …","uuid":"…","session_id":"…"}

It carries `tool_name`, `tool_use_id`, `decision_reason_type`, `message`
and sometimes `decision_reason` — **and never `error` or
`error_status`**, so `classify_line`'s `"system"` arm returns `Ignored`.
Re-checked on HEAD after T-069 merged: still `Ignored`.

That is the same shape of silence T-069 just closed one layer up. T-069
made a parsed denial reach the screen instead of vanishing into an empty
tail; this one never reaches the parse at all. On the observed turn the
two denials were separated from the `result` line by **roughly forty
seconds** of recovery work, and during those forty seconds a watching
human had no way to know the agent had been refused anything.

**THE FIXTURE IS STILL A CONSTRUCTION AND NOW IT DOES NOT HAVE TO BE.**
`fake_agent.rs`'s `tool-denied` scenario was written from documented
field names — s5's central complaint. A real capture now exists. The
scenario should be transcribed from it the way the auth scenario was
transcribed from the 2.1.226 smoke, including the `decision_reason_type`
values actually seen (`subcommandResults`, `other`) which nobody guessed.

## Acceptance criteria

- THE runner SHALL classify a `system`/`permission_denied` line as a
  denial event rather than `Ignored`, keyed on the `subtype` and never
  on the presence of an error field — the discriminator SHALL be a
  positive shape, because the line's defining property is what it
  LACKS and a lack cannot be matched.
- THE denial SHALL reach the frontend at the moment it arrives, carrying
  the tool name and the CLI's own `message`, bounded and control-stripped
  by the same discipline `denial_names()` already applies. A pin SHALL
  assert the bound and the stripping on this path specifically — reusing
  the helper is not the same as being covered by its tests.
- **A DENIAL THAT THE TURN LATER RECOVERS FROM SHALL NOT MAKE THE TURN A
  FAILURE.** A pin SHALL drive the observed shape end to end: two
  `permission_denied` lines, then a `result` with `is_error: false`,
  `terminal_reason: "completed"` and both denials present — and SHALL
  require the turn to succeed while both denials were surfaced live.
  This is the observed case, not a synthetic one.
- **THE SAME DENIAL SHALL NOT BE REPORTED TWICE.** The `result` line
  carries the denials cumulatively and the in-band lines carry them
  individually; `tool_use_id` is present on both and is the join key. A
  pin SHALL show one denial reported once when it arrives on both
  channels, and SHALL show a `result`-only denial (no in-band line) still
  reported — the older CLI path must not regress to silence.
- THE `fake_agent.rs` `tool-denied` scenario SHALL be transcribed from
  `docs/research/captures/real-planner-turn-2026-08-19.jsonl` rather than
  constructed, and its provenance SHALL be stated in the file the way the
  auth scenario's is. IF the transcription changes any assertion in the
  existing suite THEN the change SHALL be reported as a finding about the
  guess, never quietly absorbed.
- IF a `permission_denied` line arrives with no `tool_name`, an empty
  `message`, or a `tool_use_id` that no later `result` corroborates THEN
  it SHALL still be surfaced with what it has — a denial the app cannot
  fully describe is not a denial the user should be denied.
- THE existing `an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail`
  pin SHALL stay green, and the three `#[ignore]` attributes SHALL remain
  exactly three.

Verification: headless — `cargo test` from app/src-tauri against the
transcribed fixture; `npm test` from app/ for the live surface; the boot
gate, because this touches `app/src-tauri/**`. Every new assertion
poisoned and shown RED before restoration, restorations proved by hash.
**No real model call** — the capture is a file. @human: whether a live
denial notice reads as information rather than alarm.

## Implementation notes

Built by `claude-opus-5` `@fresh`, branch `task/T-081-denial-relay`, cut
from **`d61e986`** (main's tip at dispatch; the newest `Checkpoint:`
commit was `88c394f` and the diff `88c394f..d61e986` — TWO dots — is
**one** path, `docs/design/cross-harness-plan.md`, so the branch point is
docs-only ahead of the checkpoint).

**UNDERSTANDING, CONFIRMED BEFORE ANYTHING WAS TOUCHED.** The CLI
announces a permission denial the moment it happens, on a
`system`/`permission_denied` line whose defining property is what it
LACKS — no `error`, no `error_status` — which is exactly why
`classify_line`'s `system` arm, which asks whether an error field is
PRESENT, returned `Ignored` for it and the user learned nothing until the
turn ended, forty seconds later on the observed run. This card makes that
line a classified event keyed POSITIVELY on `subtype`, relays it to the
store as it arrives with the tool name and the CLI's own message bounded
and control-stripped on this path specifically, joins it against the
`result` line's cumulative `permission_denials` on `tool_use_id` so one
denial is reported exactly once while a `result`-only denial is still
reported at all, keeps a recovered denial firmly OUT of the failure
classification (the observed turn carried two and completed), and
transcribes the `tool-denied` fixture from the real capture rather than
from documented field names — reporting, as a finding, the one existing
assertion the transcription moved.

### What changed

- **`app/src-tauri/src/agent/runner.rs`** — `StreamLine::Denial`, matched
  by a guarded arm on `subtype == "permission_denied"` placed AHEAD of
  the error-bearing `system` arm; `RunEvent::Denied` +
  `Emitter::denied`; `MAX_DENIAL_MESSAGE_BYTES`; `ResultDenial` and
  `denial_entries()`, which parse the `result` line's array ONCE and
  expose two views (`denial_names()` for `ToolDenied`, `tool_use_id` for
  the join); `bounded_stream_string()` / `denial_field()`, the
  truncate-then-sanitize discipline extracted so both channels cannot
  apply it two slightly different ways; the relay loop's `Denial` arm
  (flush pending, record the id, emit, capped at `MAX_DENIALS` live
  emits); and the `Result` arm's PARTITION.
- **`app/src-tauri/src/agent/mod.rs`** — two `RunEvent::Denied`
  assertions in `outcomes_serialize_in_the_pick_outcome_shape`, pinning
  the camelCase wire names the store mirrors and that `toolName` /
  `toolUseId` are `null` rather than absent while `message` is `""`.
- **`app/src-tauri/src/bin/fake_agent.rs`** — `emit_observed_denials()`
  and `observed_denial_entries()`, transcribed verbatim off the capture;
  `tool-denied` rebuilt on them; three new scenarios,
  `denied-then-completed`, `denied-live-and-silent` and
  `denied-partial-fields`.
- **`app/src/lib/agent-store.ts`** — `GenesisDenial`, the `"denied"`
  event, `GenesisTurn.denials`, and the reducer arm that APPENDS without
  touching `status`.
- **`app/src/genesis/interview-model.ts`** — one field completion in
  `rehydrate` (see the fence note below).
- Tests: five new bodies in `app/src-tauri/tests/agent_runner.rs`, three
  new in `runner.rs`'s unit module, two new in
  `app/test/agent-store.test.ts`, one changed expectation, and four
  `GenesisTurn` literals completed.

### The three decisions worth a verifier's attention

**ONE — the join lives in Rust and nowhere else.** The store appends what
it is given; it does not re-join on `toolUseId`. A rule with two
implementations is two chances to disagree about it (T-057's lesson).
The store's own comment says so, so a future reader does not "fix" the
missing dedupe.

**TWO — the `result` line's unannounced denials are EMITTED, not only
relayed into the ring.** T-069 put the names in `stderr_tail`, and
`stderr_tail` rides `ExitNonZero` — so a denial the planner recovered
from on a turn that SUCCEEDED reached nobody, even after T-069. The late
emit is what makes "the older CLI path must not regress to silence" true
for a succeeding turn. The ring note is narrowed to the same unannounced
subset, because a name already delivered as its own event does not need
repeating in a tail; every T-069 pin is green, since none of its fixtures
carries an in-band line.

**THREE — the classification is UNTOUCHED.** `result_is_error &&
!permission_denials.is_empty()` is exactly as narrow as T-029-s7 left it,
and `denied-fatal-not-flagged` is still the standing tripwire against
widening it. The capture VINDICATES that narrowness — `terminal_reason`
on a completed turn reads `"completed"`, so the wider form would have
needed `"completed"` in its normal set — and the card says not to widen
it. **`TurnError::ToolDenied`'s doc comment says the turn "died because a
tool it needed was REFUSED", which the capture does not falsify** — that
variant is only ever constructed for a turn the CLI itself flagged
`is_error`, so the sentence still describes every turn that reaches it.
What the capture falsifies is the reading that a DENIAL implies death,
and the new `RunEvent::Denied` doc comment states the opposite in as many
words rather than editing prose outside these criteria.

### The fence, stated plainly rather than left to be noticed

`touches: [app-agent]` is `app/src-tauri/src/agent/**` plus
`app/src/lib/agent-store.ts`. Two edits sit outside it and both are
consequences of making `GenesisTurn.denials` a REQUIRED field rather than
an optional one:

- `app/src/genesis/interview-model.ts` (C-13) — one line, `denials: []`
  in `rehydrate`'s planner turn. It is a field completion, not a
  behaviour change, and it is semantically the right value: the banked
  transcript holds no denial record (`T-081-s3`).
- Four `GenesisTurn` literals in `app/test/**` — same one-line
  completion.

The alternative was `denials?:` with a `?? []` at every read, which buys
a smaller diff by making every future consumer carry the optionality.
Precedent for the crossing: T-082, fenced `app-shell`, edited the same
C-13 file. **What is NOT here is the RENDERING** — the notice a human
would see lives in C-13's chat, outside this fence, and the card's own
@human question cannot be answered until it lands. Filed as `T-081-s1`.

### Every gate and every exit code, unpiped

Ranges state their dot count. Counts are derived at a named ref, never
quoted from a checkpoint.

    git diff --name-only d61e986..HEAD    (TWO dots)   -> 10 paths

| gate | trigger | matches | verdict |
|---|---|---|---|
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **6** | **FIRES** — run, `BOOT_CHECK_EXIT=0` |
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` outside `docs/` | **6** | **FIRES** — `index --check` exit **1**, see below |
| T-024 three-fixture rule | `docs/architecture/components/` | 0 | does not fire |

BOOT GATE's six are the four `app/src-tauri/**` paths plus the two
`app/src/**` ones; neither manifest moved. GRAPH REGEN's six are the two
`app/src/**` and the four `app/test/**`; the four `.rs` paths do not
match the trigger, correctly — `Lang::for_extension` collects no Rust.

    NPUTER_BOOT_PORT=19741 npm run boot:check   (from tools/e2e)   BOOT_CHECK_EXIT=0
      [nputer] project folder: /Users/ujju/Projects/nputer-T-081
      [nputer] window "main" created

Port 19741 was bind-probed free on **all four** of `127.0.0.1`,
`0.0.0.0`, `::1` and `::` before use and released afterwards
(`lsof -nP -iTCP:19741 -sTCP:LISTEN` empty). **Port 1420 was never bound,
connected to or signalled** — the only question asked of it was
`lsof -nP -iTCP:1420 -sTCP:LISTEN`, before and after, which both times
named node pid 82549 on `[::1]:1420`.

**`index --check` EXITS 1 ON THIS BRANCH, AND THAT IS NEWS RATHER THAN
SILENCE.** From `app/src-tauri` with `--root ../..`, so not the false red
the `--root` note warns about — the second line prints both counts and a
file diff, which is the real-red shape:

    committed:   575619 bytes · 118 files · 995 symbols · 1518 edges
    fresh index: 576235 bytes · 118 files · 996 symbols · 1520 edges
    files +0 -0 ~6 · edges +2 -0
      + GenesisEvent -> GenesisDenial (type_ref)
      + GenesisTurn  -> GenesisDenial (type_ref)

The one new symbol is `GenesisDenial`. **No regenerated `graph.json` is
committed here, deliberately**: CONVENTIONS puts the regen at the
CHECKPOINT, not at the branch or the merge, because the checkpoint edits
indexed fixture files afterwards. `docs/architecture/graph.json` is also
outside this fence. The integrator regenerates and commits it; this is
the expected branch-side state, not a defect, and it is recorded so
nobody mistakes it for one.

### Suites, each `$?` read unpiped, each count derived at its ref

Baselines were MEASURED at `d61e986` in a detached scratch worktree with
`node_modules` and `lib/parser/dist` symlinked read-only from the main
checkout — no `npm ci` and no `npm install` anywhere — rather than quoted
from STATE, which records them at `cb3aa31`, two merges back.

| suite | at `d61e986` | at `25633a9` | exit |
|---|---|---|---|
| bare `cargo test` (not `--all-targets`) | **343 / 0 failed / 3 ignored** | **351 / 0 / 3** | `CARGO_TEST_EXIT=0` |
| app `npm test` | **829 / 829**, 42 files | **831 / 831**, 42 files | `APP_TEST_EXIT=0` |
| parser `npx vitest run` | — | **263 / 263**, 12 files | `PARSER_EXIT=0` |

Both cargo figures are summed programmatically over **fifteen**
`test result:` lines from the bare invocation; `--all-targets` was not
used, because it skips doc-tests. The +8 is exactly the eight new bodies
(three unit, five integration); `3 ignored` is unmoved, and criterion 7's
independent check agrees: `git grep -c -E '^\s*#\[ignore' -- .` from the
repo ROOT over all tracked paths returns **three** files with one each —
`perf_cold_and_incremental_within_ceilings`, `self_graph_is_current`,
`real_cli_smoke_records_the_stream_schema`. (Pathspec stated per
`T-082-s2`; the raw `#[ignore` tally is meaningless and is not quoted.)
The app's +2 is the two new `agent-store.test.ts` bodies. The app suite
needs `npm run build` first — twelve bodies FAIL rather than skip without
`app/dist`, in both trees — so `APP_BUILD_EXIT=0` precedes it: 265
modules, `index-CwYF5FQb.css` 43.95 kB unchanged and
`index-3bNJ6pCB.js` 501.54 kB against the checkpoint's
`index-DjYVlJel.js` 501.37 kB, which a moved `app/src` requires.

Also green: `npx tsc --noEmit` from app/ (`TSC_APP_EXIT=0`),
`npx tsc -p tsconfig.test.json` (`TSC_TEST_EXIT=0` — the second program
T-073 made load-bearing), `npx tsc --noEmit` from lib/parser
(`PARSER_TSC_EXIT=0`), `npm run typecheck` from tools/e2e
(`E2E_TYPECHECK_EXIT=0`), and the token lint both ways:
`LINT_SELFTEST_EXIT=0` (49 TOKEN + 4 CONTROL samples, 71 walk-policy
checks, 8 evidence-floor checks) and `LINT_TOKENS_EXIT=0` —
**TOKEN 119, CONTROL 548** at `25633a9`, the code commit. CONTROL closes
arithmetically at that ref: 548 at `d61e986` + 0 additions − 0 deletions
= 548, since the code commit adds and removes no tracked file. **At the
NOTES commit it is 554**, because this card's six `T-081-s*` findings are
six new tracked text files under `docs/` and CONTROL is every tracked
first-party text file — 548 + 6 − 0 = 554, and that is the number a
verifier measuring at the branch TIP will see. TOKEN is **119 at both**:
six files under the TOKEN roots are MODIFIED, none is added, and
`docs/` is outside those roots entirely.

**The E2E lane itself was not run.** `tools/e2e` is a 0-path diff, and
the lane drives a browser bundle whose only reachable surface here is a
store field nothing renders (`T-081-s1`); its typecheck and both token
lint arms were run instead.

### Security sweep, re-derived at this branch tip rather than quoted

- `app/src-tauri/src/acl_pin.rs` is a **0-file diff** across
  `d61e986..HEAD`, sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`.
- **92 grants**, three independent ways over the symbol-anchored
  `EXPECTED_GRANTS` body: 92 quote-bearing lines, 92 quoted strings in
  total, 92 UNIQUE quoted strings. No byte count is quoted.
  **AND THE SPAN FIGURE IS WRONG IN BOTH DIRECTIONS THE RECORD CARRIES.**
  The declaration is at line 54, the closing `];` at line 147: the span
  is **94** lines, of which 92 are entries (55–146) and ZERO are comment
  or blank. STATE's correction — "the anchored span is **128** lines (36
  of them comment or blank; 36 + 92 = 128)" — is itself the
  doc-comment-anchoring error it was written to correct; `T-082-s1` owns
  it and no duplicate is filed.
- `ENV_ALLOWLIST` unmoved at **423 bytes / 16 entries**, anchored on
  `pub const ENV_ALLOWLIST` and its closing `];`.
- IPC surface unmoved at **thirteen**: 13 `#[tauri::command]` attributes
  and 13 names inside `generate_handler!`. **This card adds an EVENT
  VARIANT, not a command** — no grant, no manifest, no capability file
  moved, and the branch's diff contains no lockfile, no `Cargo.toml`, no
  `package.json` and no `tauri.conf.json`.

### The poison drill — ten rounds, all three limbs

Run against the committed implementation (`25633a9`), so
`git show HEAD:<path>` is the restoration authority. Every mutation is
**ONE-SIDED** — a producer, never a literal an assertion shares with it;
every bound and every wire name is asserted with a LITERAL because a test
parametrised by the constant it checks cannot pin that constant. Every
mutation's **TEXT was read back with `git diff -U1` and printed in full
before any suite ran**, never a substitution count. Every restoration is
proved by sha256 against `git show HEAD:<path>` AND an empty
`git diff -- <path>` — **ten for ten**.

| # | mutation (producer side) | result |
|---|---|---|
| 1 | the `subtype` guard reads `permission_DENIED` | **RED** — 3 unit + 3 integration bodies; the denial line falls back to `Ignored` |
| 2 | a denial is returned as the turn's cause of death | **RED** — 7 bodies, incl. this card's recovery pin and all four T-029-s7 / T-069 pins |
| 3 | the join is deleted (every result entry is "unannounced") | **RED** — the recovery pin and the mixed-channel pin; the result-only pin stays GREEN |
| 4 | the late emit is deleted (`.take(0)`) | **RED** — the result-only pin and the mixed-channel pin; the recovery pin stays GREEN |
| 5 | `MAX_DENIAL_MESSAGE_BYTES` 768 → 512 | **RED** — the unit bound pin and the end-to-end bound pin |
| 6 | the message is truncated but no longer sanitized | **RED** — the same two, on the control bytes |
| 7 | one transcribed byte paraphrased (`subcommandResults` → `subcommandResult`) | **RED** — the transcription pin, naming the field |
| 8 | the join key's wire name drifts to `toolUsedId` | **RED** — the serde shape pin |
| 9 | the store REPLACES the denial list instead of appending | **RED** — `["Bash"]` against `["Bash","Bash"]` |
| 10 | a `completed` turn clears its denials | **RED** — the post-completion assertion |

**ROUNDS 3 AND 4 ARE THE PAIR CRITERION 4 NEEDED, AND EACH ONE'S GREEN IS
AS LOAD-BEARING AS ITS RED.** 3 is over-reporting and 4 is silence; the
recovery pin kills only 3, the result-only pin kills only 4, and the
mixed-channel pin kills both — which is the shape a single-channel
fixture cannot have.

**THE DRILL CAUGHT TWO REAL DEFECTS IN MY OWN FIRST DRAFT**, and both are
filed rather than quietly fixed. (a) The no-double-reporting body killed
no mutant the recovery body did not already kill — **poison shape SIX**,
found by the drill's second question, and closed by the
`denied-live-and-silent` fixture that MIXES the channels. (b) Both
liveness assertions used a text DELTA as their witness, and deltas are
coalesced: one streamed after the denials still flushes at the end of the
relay loop, so the assertion passed under a batch-at-the-result mutant.
Both now use an `Activity` marker, which is emitted the instant its line
is classified — and which is also what the real planner did, decomposing
the refused command and running the pieces. Filed as `T-081-s5` with the
general rule: **if the transport can hold B, B cannot date A.**

### What ran, and what survived it

Everything ran in the worktree or in a detached scratch worktree, never
in the main checkout, with `node_modules` and `lib/parser/dist`
symlinked read-only. **No `npm ci`, no `npm install`, no `pkill`, and no
real model call of any kind** — the capture is a file, and every stream
in this card comes from `fake_agent`. The human's app was verified
untouched at both ends: `npm run tauri dev` 82342 → tauri 82364 →
`target/debug/nputer` 97844, vite 82549 on `[::1]:1420`, all four the
same pids before and after, and 97844 started **21:53:30**, thirty-five
minutes before this worktree existed. **The dispatch brief names the app
as pid 36009; it is 97844** — same ppid 82364, so `tauri dev` relaunched
it before this lane started. Both scratch worktrees were removed and the
scratch symlinks deleted; `git status --porcelain` is empty at the
branch tip.

**ONE OBSERVATION THAT CONTRADICTS WHAT THIS SECTION FIRST CLAIMED, AND
IS CORRECTED RATHER THAN DROPPED.** The main checkout's
`app/src-tauri/target/debug/nputer` DID move during this lane's window:
39,730,872 bytes at 22:17 when first read, 39,764,360 at 23:07 when read
again, with `target/debug/deps` stamped 23:07. **It is not this lane's.**
Every `cargo` invocation here — the suites, the drill and the boot check
alike — ran with
`CARGO_TARGET_DIR=<scratch>/T081-target`, whose own `debug/nputer` is a
third, different binary (39,862,184 bytes), and this worktree is a
separate directory from the checkout `tauri dev` watches. The size it
landed on is the one STATE records at the T-080 checkpoint, which is what
a MAIN-checkout `cargo test` produces; the sibling T-083 integration was
live in the same window and holds a drill worktree in the shared scratch
directory. Recorded because "I did not touch it" is a claim that has to
survive a second measurement, and the first version of this paragraph
asserted the binary was unmoved on the strength of one reading. The
human's app was not restarted by it — 97844 is the same process before
and after.

### Findings

`T-081-s1` the denial reaches the store and nothing renders it (the fence
boundary, and where the notice goes when C-13 takes it) · `T-081-s2` the
guess said two tools and reality refused one tool twice — **criterion 5's
mandated report on the one assertion the transcription moved** ·
`T-081-s3` a restart forgets what the planner was refused · `T-081-s4` a
byte bound above `docs_watch`'s log cap never bites, and
`MAX_AUTH_MESSAGE_BYTES` is already there · `T-081-s5` an order assertion
whose witness is itself buffered dates nothing · `T-081-s6` the cargo
suite now reads a THIRD docs file off disk, so CONVENTIONS' "closed at
two" sentence needs its scope.

### For the verifier

- The card's criterion 2 is satisfied to the STORE. Read `T-081-s1`
  before judging whether "reaches the frontend" is met — the fence is the
  reason, and it is stated rather than hidden.
- Criterion 5's assertion change is `T-081-s2`, not a silent edit.
- `index --check` exits **1** on this branch by design; see above.
- The two liveness assertions are the sharpest claims here and the
  easiest to weaken by accident. If you poison them, poison the
  TRANSPORT (batch the denials at the `result` line), not the fixture.

## Verdicts
