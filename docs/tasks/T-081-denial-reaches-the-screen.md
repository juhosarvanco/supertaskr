---
id: T-081
title: A denial is news when it happens — the in-band channel the runner drops, and the fixture that was a guess
feature: F-03
milestone: 4
priority: 39
size: M
status: done
blocked_by: []
touches: [app-agent]
builder:
verifier: claude-opus-5
built_by: claude-opus-5 @fresh (re-built after the rejection by claude-opus-5 @T-081-fix)
verified_by: claude-opus-5 @T-081-verify (re-verified @T-081-verify2, 2026-08-20)
review: same-model
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
- THE existing `an_in_band_auth_failure_is_typed_authfailed_not_a_relayed_exit_code`
  pin (`app/src-tauri/tests/agent_runner.rs:1347`) SHALL stay green, and
  the three `#[ignore]` attributes SHALL remain exactly three.
  **NAME CORRECTED 2026-08-25 (T-108, at `43f995a`).** This criterion
  cited `an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail`,
  which no Rust function has ever carried; the planner copied it from
  `docs/tasks/T-025-agent-runner.md`, where it was coined and where it is
  now corrected too. **The criterion's SUBSTANCE always held** — the body
  above is the one that carries the guarantee and it is green — and this
  card's own verifier notes discharge it against that body. What was
  unverifiable was the CITATION, which is why the fix is here in the
  criterion and not only in the verifier's notes at the far end of this
  file: a reader who stops at the criteria has the wrong string. (No
  line number and no line COUNT is written into that pointer, on this
  correction's own rule — the section is named instead, because a
  heading survives an edit above it and a digit does not.)
- **A CRITERION THAT NAMES A TEST SHALL NAME IT BY A STRING
  `git grep -- '*.rs'` FINDS AS A DEFINITION**, and **THE PATHSPEC IS
  PART OF THE RULE.** Written here, beside the criterion it governs,
  because that is where criteria are read. Derived at `43f995a`:
  `git grep -n "fn an_in_band_auth_failure" -- '*.rs'` returns exactly one
  definition at exit **0**, and the phantom under the same pathspec exits
  **1** — correctly. **UNRESTRICTED (`-- .`) IT EXITS 0**, matching this
  card's own prose about the phantom, so the search that looks like the
  obvious one confirms a definition that does not exist. The rule learned
  this on itself: writing the finding is what put the string into `docs/`.
- **THE FILTER TRAP SITS BESIDE IT AND IS WORSE, BECAUSE IT LOOKS LIKE A
  PASS.** `cargo test --test <target> <name>` exits **0** on a name that
  matches nothing, so *"the pin passes"* and *"the pin is not there"* are
  the same verdict. Measured at `43f995a` on this repository's own
  suite: the phantom prints `test result: ok. 0 passed; 0 failed; 0
  ignored; 0 measured; 77 filtered out`, the real name prints `1 passed;
  0 failed; 0 ignored; 0 measured; 76 filtered out`, **and BOTH exit 0.**
  **READ THE PASSED AND FILTERED COUNTS, NEVER THE EXIT CODE** — the exit
  is the same number for both, so it carries no information here at all.

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

### SECOND EXECUTOR, AFTER THE REJECTION — what this pass added

Appended, not substituted: everything above is the first executor's and
stands. Built by `claude-opus-5` `@T-081-fix`, continuing on
`task/T-081-denial-relay` from the verdict commit **`ba31a10`**. Three
commits: **`6251d37`** the fixture and the pin, **`7171d7c`** an un-red
of the app suite that was not mine to cause, and this one.

**UNDERSTANDING, CONFIRMED BEFORE ANYTHING WAS TOUCHED.** The runner's
join is RIGHT and stays byte-unmoved; the rejection is one missing body.
Criterion 4 names `tool_use_id` as the join key and no stream in the
suite could distinguish it from `tool_name`, so moving both join sites
together left all 351 bodies green. The fix is fixture-sized: add the one
shape where the two answers differ — the same tool refused twice with
only one of the two refusals announced in band — and one body asserting
both ids reach the screen.

### THE NEW FIXTURE, AND WHY IT DISCRIMINATES WHERE ITS NEIGHBOURS CANNOT

`denied-same-tool-one-announced` in `fake_agent.rs`, and
`a_second_refusal_of_the_same_tool_is_not_swallowed_by_the_first` in
`tests/agent_runner.rs`. The stream is one in-band
`permission_denied` (`Bash` / `toolu_announced`), an `emit_tool_use`
marker, then a `result` with `is_error: false`,
`terminal_reason: "completed"` listing **`Bash` / `toolu_announced` AND
`Bash` / `toolu_never_announced`**.

**THE TWO EXISTING FIXTURES MISS IT BY CONSTRUCTION, AND IT IS THE SAME
BLIND SPOT TWICE.** `denied-then-completed` announces BOTH denials in
band, so a name join filters both and the count is still two.
`denied-live-and-silent` gives its two ids DIFFERENT names (`Bash`,
`WebFetch`), so a name join separates them exactly as cleanly as an id
join. A property is only pinned by a stream in which the right answer and
the wrong one DIFFER, and neither of those is one.

**THIS IS `T-081-s2` REPRODUCED IN A NEW COSTUME, AND THE PATTERN IS THE
LESSON RATHER THAN THE LINE.** `s2` reported that the old
`["Bash", "WebFetch"]` guess made a NAME look like it could identify a
denial. The fixtures written to replace that guess reintroduced the same
blind spot from the other side — one by announcing everything, one by
using two names — and the finding that named the hazard did not stop its
own card from re-opening it. **A finding that identifies a confusion does
not immunise the next artefact against it**; only a stream where the two
readings disagree does. The general form, and it is worth carrying:
**when a card reports that X was mistaken for Y, the pin that closes it
must be a case where X and Y give DIFFERENT answers — not a case where
the confusion happens to be harmless.**

**THE DISCRIMINATING SHAPE IS THE OBSERVED TURN'S OWN, re-derived here
rather than quoted.** `docs/research/captures/real-planner-turn-2026-08-19.jsonl`
was parsed line by line in Python — **27 lines on disk, 27 whole JSON
objects, no line skipped and nothing grepped**, since the file is written
with spaces after its colons and a compact-JSON grep finds nothing:

    line 17  system/permission_denied  tool_name="Bash"  tool_use_id="toolu_01FAHQKCKFrBLrmVtRiuLT9L"
             decision_reason_type="subcommandResults"  decision_reason ABSENT
             error ABSENT  error_status ABSENT
    line 19  system/permission_denied  tool_name="Bash"  tool_use_id="toolu_0173K9Q72m797nLBonDtrc3R"
             decision_reason_type="other"  decision_reason PRESENT
             error ABSENT  error_status ABSENT
    line 27  result  is_error=false  terminal_reason="completed"
             permission_denials names=["Bash","Bash"]
             ids=["toolu_01FAHQKCKFrBLrmVtRiuLT9L","toolu_0173K9Q72m797nLBonDtrc3R"]

**Two identical names, two distinct ids.** So the name cannot identify a
denial on the one turn anybody has actually seen, and the missing in-band
line is the only constructed half. That half is named in the fixture's
comment the way `tool-denied`'s halves are: 2.1.226 announces every
denial it makes, so a partial announcement cannot be captured from it —
but a lost or malformed line, and the runner's own `MAX_DENIALS` cap on
LIVE emits (which deliberately leaves the late channel to report the
rest), both produce exactly this shape against a CLI that refuses one
tool repeatedly. **The fixture therefore earns its place on merit and not
only as a mutant-killer.**

**THE FAILURE DIRECTION IS SILENCE**, which is the defect the whole card
exists to fix. The ids are self-describing rather than the capture's real
ones precisely so the assertion message names WHICH channel was lost;
`tool_use_id` is opaque to the runner and its bytes carry no behaviour.

### THE POISON DRILL — five rounds, all three limbs, and the inverse question answered

Run against the committed implementation, so `git show HEAD:<path>` is
the restoration authority. **Every mutation is ONE-SIDED** — the producer
(`agent/runner.rs`), never a literal the assertion shares with it. **Every
mutated TEXT was read back with `git diff -U1/-U2` and printed in full
before any suite ran**, never a substitution count: the Python pass
asserted its own occurrence count was 1 at each site AND the diff was
read, because a substitution that reports success while landing one of
two is the failure this repo has already seen. Every restoration is proved
by sha256 against `git show HEAD:app/src-tauri/src/agent/runner.rs`
(**`10c7bca22290862b4224cd10d9564513603914e9614909d33d0baaa2109852bb`**)
AND an empty `git diff -- <path>` — **five for five**.

The suite figures below come from `cargo test --no-fail-fast`, stated as
such: bare `cargo test` stops after the first failing TARGET and reports
only the binaries that ran (M1 bare reads `191 passed / 1 failed / 1
ignored`, exit 101), which cannot answer "which bodies red". The headline
GREEN figures elsewhere on this card are from the bare invocation.

| # | mutation (producer side, one-sided) | exit | bodies RED |
|---|---|---|---|
| **M1** | **both join sites `tool_use_id` -> `tool_name`** — the verifier's exact mutant | **101** | **`a_second_refusal_of_the_same_tool_is_not_swallowed_by_the_first` — AND NOTHING ELSE.** 351 / 1 / 3 |
| M2 | the join deleted, `.filter(\|_d\| true)` (over-report) | 101 | recovery pin + mixed pin + **mine**. 349 / 3 / 3 |
| M3 | the late emit deleted, `.iter().take(0)` (silence) | 101 | result-only pin + mixed pin + **mine**. 349 / 3 / 3 |
| M7 | all-or-nothing partition, `.filter(\|_d\| announced_denials.is_empty())` | 101 | mixed pin + **mine**. 350 / 2 / 3 |
| M10 | the late emit takes the FIRST result entry's name: `denials.first().and_then(\|d\| d.tool_name.clone())` | 101 | **mixed pin ONLY.** 351 / 1 / 3 |

**M1 IS THE ROUND THAT WAS OWED, AND IT IS A SOLE KILL.** Text read back
before the suite ran, both sites in one diff:

    @@ -1939,3 +1939,3 @@         @@ -2032,3 +2032,3 @@
    -  if let Some(id) = &tool_use_id {    -  .filter(|d| match &d.tool_use_id {
    +  if let Some(id) = &tool_name {      +  .filter(|d| match &d.tool_name {

and the red is the silence, in the runner's own words:

    assertion `left == right` failed: both refusals of the SAME tool reach the
    screen - the join is on `tool_use_id`, and a join on `tool_name` reports
    only the announced one and drops the other into silence
      left: [Some("toolu_announced")]
     right: [Some("toolu_announced"), Some("toolu_never_announced")]

That reproduces the verifier's scratch `vfy-same-name-split` exactly,
including the exit code, from a fixture that is now committed.

### THE INVERSE QUESTION, ASKED IN BOTH DIRECTIONS

**Does the new body merely duplicate an existing one?** No — **M1 is a
mutant it alone kills**, and it is the survivor the rejection was about.

**Does the new body make an existing one redundant?** This is the
question the brief asked me not to disturb, and **one of the verdict's
statements moves — measured, and reported rather than absorbed.**

The verdict established that criterion 4's two bodies are independent by
finding **M7**, the all-or-nothing partition, and recording it as killed
by `one_denial_on_each_channel_is_reported_once_each` *"and by nothing
else"*. **That is no longer true, and it could not have stayed true**: my
fixture's whole premise is a non-empty `announced_denials` at the
`result` line, so any fixture with the discriminating shape necessarily
reds under M7. M7 now kills two bodies.

So M7 no longer demonstrates the mixed-channel body's independence, and I
derived a replacement rather than leaving the claim resting on a mutant
that has stopped separating them. **M10** — the late emit reading its
tool name off the FIRST result entry instead of its own, a plausible
wrong-binding slip — **is killed by
`one_denial_on_each_channel_is_reported_once_each` and by nothing else**,
including my new body. The property is the one only a DIFFERENT-names
fixture can hold: that a denial which reached only the cumulative record
carries ITS OWN tool name. Both entries in my stream are `Bash`, so mine
is structurally blind to it, exactly as the mixed one is blind to M1.

**The two bodies are complements, and the matrix shows it.** Mine alone
kills M1; the mixed one alone kills M10; M2, M3 and M7 they share.
**Poison shape six: still NOT present, on a different mutant than the
verdict used.**

### CRITERION 7 CITES A PIN THAT DOES NOT EXIST, AND THE RECORD SHOULD SAY WHICH BODY CARRIES THE GUARANTEE

Confirmed at this tip, not taken on trust.
`git grep "fn an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail" -- .`
over all tracked paths **exits 1 — no match**. The string occurs in
exactly three files, all prose: `docs/tasks/T-025-agent-runner.md`,
this card (twice: the criterion and the verdict), and `T-081-s8`.

**A CRITERION THAT CITES A NON-EXISTENT PIN CANNOT BE DISCHARGED AS
WRITTEN**, and the mechanical route does not fail — it lies:

    cargo test --test agent_runner an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail
      test result: ok. 0 passed; 0 failed; 0 ignored; 73 filtered out    EXIT 0

Exit **0** and the word `ok`, for a pin that does not exist. That is the
same non-answer class as an empty exit code, and it is why the citation
matters rather than being a typo.

**THE BODY THAT ACTUALLY CARRIES THE GUARANTEE IS
`an_in_band_auth_failure_is_typed_authfailed_not_a_relayed_exit_code`**,
`app/src-tauri/tests/agent_runner.rs:1347`. Run by name at this tip:

    cargo test --test agent_runner an_in_band_auth_failure_is_typed_authfailed_not_a_relayed_exit_code
      test an_in_band_auth_failure_is_typed_authfailed_not_a_relayed_exit_code ... ok
      test result: ok. 1 passed; 0 failed; 0 ignored; 72 filtered out    EXIT 0

**Criterion 7 is satisfied against that body**, and the second half is
unmoved: `git grep -c -E '^\s*#\[ignore' -- .` from the repo ROOT over all
tracked paths returns **three files with one attribute each** — `perf.rs`,
`self_graph.rs`, `agent_runner.rs`; total three. (Pathspec stated per
`T-082-s2`.) `T-081-s8` already owns the correction and needs no
duplicate; **it lives on THIS BRANCH, added by the verdict commit
`fede266`, and NOT on main** — the dispatch brief says otherwise and is
wrong, checked with `git cat-file -e main:<path>`, which fails.

### THE APP SUITE WAS RED WHEN I INHERITED IT, AND THE RED WAS THE VERDICT'S

**A gate that reds is news.** `npm test` from `app/` at the inherited tip
`ba31a10` fails: **830 passed / 1 failed, 41 of 42 files**, exit 1.

    FAIL test/architecture-dogfood.test.ts >
      both input layers parse clean (the smoke-test discipline)
    "field": "status",
    "file": "docs/tasks/T-081-s7-…-mis-specified.md",
    "message": "… field 'status' must be one of suggested | planned | building |
      verifying | rejected | merging | done | parked, got \"closed\""

`T-081-s7` shipped with `status: closed`, which is outside the parser's
vocabulary and is the only occurrence in the tree
(`git grep "^status: closed" -- .`). **`docs/` is an INPUT to the app
suite** — T-024's dogfood body parses the live tree — so a docs-only
verdict commit turned a code gate red.

**ATTRIBUTED RATHER THAN ASSUMED.** Re-measured with this lane's two Rust
files checked back out to `ba31a10`, making the tree byte-identical to the
inherited tip: the same body fails, exit 1. The red predates
`6251d37`.

Fixed at `7171d7c` by setting `s7`'s status to **`suggested`** — the value
every other finding on this card carries, one of the two the parser
accepts for a minimal finding file (`task.ts:157`), and the value T-083's
integrator ruled a DISCHARGED finding should keep, because disposition
belongs to triage. The body is untouched and a note records the edit.
`npm test` is **831 / 831, 42 files, exit 0** after it.

The MECHANISM is filed as **`T-081-s9`**: a verdict measures the suites at
the commit under review and then COMMITS — the verdict body and its own
findings — and nothing between the verdict and the merge re-measures. The
same mechanism staled the verdict's `CONTROL 554` (it is 556 once
`fede266` lands two finding files). **A role that writes to the tree owes
the tree's gates, even when what it wrote was prose.**

### EVERY GATE, EVERY RANGE WITH ITS DOT COUNT, EVERY EXIT CODE

Main moved again during this lane: the brief names **`3b4326d`**; it is
**`f4f77d7`** (*"STATE: T-081 rejected, and two rulings that went against
the architect"*), one commit further on. Merge-base is unmoved at
`d61e986`.

**THE FORECAST IS THE COMMAND THE RANGE RULE PRESCRIBES FOR AN EXECUTOR**
(CONVENTIONS, merged at `5c60e5a` — the rule is on main and NOT on this
branch, which was cut before it), exit read from `$?` and not swallowed by
the command substitution:

    TREE=$(git merge-tree --write-tree f4f77d7 7171d7c)   exit 0
      tree 0dabf0f1065bf33622004783c67e0cc023edcf66
    git diff --name-only f4f77d7 "$TREE"                  -> 20 paths

    git diff --name-only d61e986..7171d7c  (TWO dots, branch-only)   -> 20   cmp vs the forecast: exit 0
    git diff --name-only f4f77d7...7171d7c (THREE dots, FORBIDDEN)   -> 20
    git diff --name-only f4f77d7..7171d7c  (TWO dots,  FORBIDDEN)    -> 31   main's eleven commits, in reverse

The forecast and the branch-only range are byte-identical here under
`cmp`, and no merge conflict is forecast. The forbidden pre-merge two-dot
form adds **eleven** paths this lane never touched — the same lie T-083
measured at 6 -> 24 on its own lane.

Suffix census of the 20: **10 md, 4 rs, 5 ts, 1 tsx**.

| gate | trigger | matches | verdict |
|---|---|---|---|
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **6** | **FIRES** — `BOOT_CHECK_EXIT=0` |
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` outside `docs/` | **6** | **FIRES** — `index --check` exit **1**, REAL red |
| T-024 three-fixture rule | `docs/architecture/components/` | **0** | does not fire |

Both counts are unmoved from the first executor's, and necessarily so:
my three commits touch two `.rs` files already inside BOOT GATE's six,
and ten `.md` files that match neither trigger.

    NPUTER_BOOT_PORT=19791 npm run boot:check   (from tools/e2e)   BOOT_CHECK_EXIT=0
      [nputer] project folder: /Users/ujju/Projects/nputer-T-081
      [nputer] window "main" created

Port 19791 was bind-probed free on **all four** of `127.0.0.1`,
`0.0.0.0`, `::1` and `::` before use and `lsof`-empty afterwards.
**1420 was never bound, connected to or signalled** — the only question
asked of it was `lsof -nP -iTCP:1420 -sTCP:LISTEN`, which every time named
node **82549** on `[::1]:1420`. The human's app is **97844** (ppid 82364,
started Wed Aug 19 21:53:30), and all four of 82342 / 82364 / 82549 /
97844 are the same pids with the same start times before and after every
suite, the drill and the boot check. The brief's pids are correct.

**`index --check` EXIT 1 IS A REAL RED AND NO `graph.json` IS COMMITTED.**
Run from `app/src-tauri` with `--root ../..`, so not the false red the
`--root` note warns about, and the real-red shape is present — both
counts and a file diff:

    committed:   575619 bytes · 118 files · 995 symbols · 1518 edges
    fresh index: 576235 bytes · 118 files · 996 symbols · 1520 edges
    files +0 -0 ~6 · edges +2 -0
      + GenesisEvent -> GenesisDenial (type_ref)
      + GenesisTurn  -> GenesisDenial (type_ref)

Byte-identical to what the first executor recorded, which is expected: I
added no TypeScript. The regen belongs at the CHECKPOINT and
`docs/architecture/graph.json` is outside this fence.

| suite | at `ba31a10` (inherited) | at this tip | exit |
|---|---|---|---|
| bare `cargo test` (not `--all-targets`) | **351 / 0 / 3** | **352 / 0 / 3** | `CARGO_TEST_EXIT=0` |
| app `npm test` | **830 / 831 — FAILED**, exit 1 | **831 / 831**, 42 files | `APP_TEST_EXIT=0` |
| parser `npx vitest run` | — | **263 / 263**, 12 files | `PARSER_EXIT=0` |

Both cargo figures summed programmatically over **fifteen** `test result:`
lines from the BARE invocation. The +1 is the one new body. `3 ignored` is
unmoved. `npm run build` precedes the app suite (`APP_BUILD_EXIT=0`), as
this card already records is required.

Also green, each `$?` read unpiped: `npx tsc --noEmit` from app/
(`TSC_APP_EXIT=0`), `npx tsc -p tsconfig.test.json` (`TSC_TEST_EXIT=0`),
`npx tsc --noEmit` from lib/parser (`PARSER_TSC_EXIT=0`),
`npm run typecheck` from tools/e2e (`E2E_TYPECHECK_EXIT=0`), and the token
lint both ways: `LINT_SELFTEST_EXIT=0` (49 TOKEN + 4 CONTROL samples, 71
walk-policy, 8 evidence-floor) and `LINT_TOKENS_EXIT=0` — **TOKEN 119 /
CONTROL 557**. CONTROL closes arithmetically: 548 at `d61e986`, + 6 at
`94476b4` (s1…s6) = 554, + 2 at `fede266` (s7, s8) = **556**, + 1 at
`7171d7c` (s9) = **557**. TOKEN is unmoved because `docs/` is outside the
TOKEN roots and my two `.rs` files are under `app/src-tauri`, not
`app/src`.

The E2E lane itself was not run: `tools/e2e` is a 0-path diff and nothing
reachable from a browser bundle moved. Its typecheck and both token-lint
arms were run instead.

### SECURITY SWEEP, re-derived at this tip

- `app/src-tauri/src/acl_pin.rs` is a **0-file diff** across
  `d61e986..7171d7c` (TWO dots), sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`.
- **92 grants**, three independent ways over the symbol-anchored body:
  92 quote-bearing lines, 92 quoted strings, 92 UNIQUE quoted strings.
  Declaration line **54**, closing `];` line **147**, span **94**,
  entries **55–146 = 92**, comment-or-blank inside the body **ZERO**.
  Confirms the first executor and the verifier; STATE's "128 / 36" is
  `T-082-s1`'s and no duplicate is filed.
- `ENV_ALLOWLIST` **BYTE-IDENTICAL** at `d61e986` and this tip (`cmp`
  exit 0): **423 bytes, 16 entries, 16 unique**. Anchored on
  `pub const ENV_ALLOWLIST: &[&str] = &[` specifically — a looser anchor
  also matches `ENV_ALLOWLIST_LINUX` and a test, which is how a first
  attempt here produced nonsense before it was re-derived.
- **IPC surface unmoved at 13**: 13 `#[tauri::command]` attributes in
  `lib.rs` and 13 names inside `generate_handler!`, read verbatim. (A
  trailing-comma-based count returns 12 and is wrong — the last name has
  none.) This lane adds no command, no grant and no capability.
- The branch diff contains **no** `Cargo.toml`, `Cargo.lock`,
  `package.json`, `package-lock.json`, `tauri.conf.json` or capability
  file. No new input path: the fixture is a canned stream and the pin
  reads events.

### WHAT RAN, AND WHAT DID NOT

Everything ran in this worktree, never in the main checkout, with
`CARGO_TARGET_DIR` pointed at scratch and `lib/parser/node_modules`,
`lib/parser/dist` and `tools/e2e/node_modules` symlinked read-only from
the main checkout for the duration and deleted afterwards
(`app/node_modules` was already such a symlink). **No `npm ci`, no
`npm install`, no `pkill`, and no real model call of any kind** — the
capture is a file and it was parsed, not grepped. `git status --porcelain`
is empty at the branch tip.

### FINDINGS

`T-081-s9` a verdict measures the suites at the commit under review, then
commits more, and nothing re-measures — T-081's own verdict left the
branch tip failing `npm test`.

### FOR THE VERIFIER

- The runner is **byte-unmoved**: `git diff d61e986..HEAD --
  app/src-tauri/src/agent/runner.rs` is unchanged from the first
  executor's, and every mutation in the drill above was restored and
  proved by sha256. The fix is a fixture and a pin.
- **One verdict statement moved and it is stated above rather than
  absorbed**: M7 no longer kills the mixed-channel body alone. M10 is the
  replacement that does, and it was validated in both directions.
- `T-081-s8` is on THIS BRANCH, not on main.
- `index --check` exits **1** by design; no regenerated graph is
  committed.
- The one edit outside the drill-and-fixture story is `T-081-s7`'s
  `status:` field, which was breaking the app suite. If you disagree with
  `suggested` as the value, the alternative the parser accepts for a
  minimal finding file is `parked`; `done` is not available without the
  full task field set.

## Verdicts

### 2026-08-19 — REJECTED (claude-opus-5 @T-081-verify, review: same-model)

**One blocking defect, and it is a MISSING PIN rather than a wrong line
of code.** The shipped runner joins the two denial channels on
`tool_use_id` and is correct. Nothing in the suite holds it there:
changing the join key to `tool_name` — the exact substitution
criterion 4 names as wrong, and the exact substitution `T-081-s2` was
written about — leaves the whole cargo suite GREEN at **351 passed /
0 failed / 3 ignored, `CARGO_TEST_EXIT=0`**. Everything else on this
card re-derived cleanly, including three claims the dispatch brief had
backwards, and the two decisions it flagged for attention are both
right. This is a narrow rejection with a fixture-sized fix, written and
validated below, not a rebuild.

**Range derived, dot counts stated.** Main moved under this review
(T-083 merged at `5c60e5a`). `git merge-base main 94476b4` is
`d61e986`, matching the card. `main...94476b4` (THREE dots) and
`$(git merge-base ...)..94476b4` (TWO dots on a branch-only range) each
give **17 paths** — ten code, seven docs — and `d61e986..94476b4` (TWO
dots) gives the card's **10** code paths plus the docs. The naive
`main..94476b4` (TWO dots, pre-merge) reports **26 files** and drags in
T-083's `docs/tasks/T-083-*` history. The card's "Ten paths" is the code
subset; both figures are right under their own scope.

### THE DEFECT — criterion 4 names `tool_use_id` as the join key, and no body can tell it from `tool_name`

Criterion 4: *"`tool_use_id` is present on both and **is the join key**."*
`T-081-s2` exists to report that the old `["Bash","WebFetch"]` guess
"made a name look like it could be a join key". **The new fixtures
reproduce that weakness in a new costume.**

MUTANT (mine, derived from the criterion, not from the pins). One
conceptual change, both sites moved together, text read back with
`git diff -U1` before any suite ran:

    -                            if let Some(id) = &tool_use_id {
    +                            if let Some(id) = &tool_name {
                                     announced_denials.push(id.clone());

    -                                .filter(|d| match &d.tool_use_id {
    +                                .filter(|d| match &d.tool_name {
                                         Some(id) => !announced_denials.iter().any(|seen| seen == id),

RESULT: `cargo test` (bare) — **351 / 0 / 3 over fifteen `test result:`
lines, exit 0. ZERO bodies red.** The survivor is total.

**WHY BOTH NEW FIXTURES MISS IT.** `denied-then-completed` announces
BOTH denials in band, so a name join filters both and the count is
still two. `denied-live-and-silent` gives its two ids DIFFERENT names
(`Bash` on both channels, `WebFetch` result-only), so a name join
separates them just as cleanly as an id join. Neither stream contains
the one shape that discriminates: **the same tool name where one
instance was announced and another was not** — which is the observed
2.1.226 turn's own shape (`Bash` twice) with a single in-band line lost.

**THE FAILURE DIRECTION IS SILENCE**, not a duplicate — the defect this
card exists to fix. Demonstrated, not argued. Scratch fixture
`vfy-same-name-split`: one in-band denial `Bash`/`toolu_announced`, an
`Activity` marker, then a `result` (`is_error: false`,
`terminal_reason: "completed"`, exit 0) listing
`Bash`/`toolu_announced` AND `Bash`/`toolu_never_announced`.

| build | `Denied` ids reported |
|---|---|
| shipped (`tool_use_id` join) | `[toolu_announced, toolu_never_announced]` — **exit 0** |
| mutant (`tool_name` join) | `[toolu_announced]` — **exit 101** |

    assertion `left == right` failed: both refusals of the SAME tool reach the screen
      left: [Some("toolu_announced")]
     right: [Some("toolu_announced"), Some("toolu_never_announced")]

A refusal the CLI reported is dropped on the floor and the user is never
told. Nothing in the suite notices.

**FIX (in-fence, fixture-sized).** Add the discriminating stream to
`fake_agent.rs` and one body to `tests/agent_runner.rs` asserting the
two ids in order. The scenario above is sufficient as written and was
validated in both directions here — it reds under the name join and
greens on the shipped implementation. It also earns its place on
merit: a lost or oversize in-band line, and the `MAX_DENIALS` live-emit
cap, all produce exactly this partial-announcement shape against a CLI
that refuses one tool repeatedly.

### WHAT SURVIVED THE ATTACK — the rest of the card is sound

**Criterion 4's two bodies ARE genuinely independent; poison shape six
is closed.** The executor's own drill left this open — rounds 3 and 4
are each killed by a neighbour (the recovery pin kills 3, the
result-only pin kills 4), so "the pair criterion 4 needed" does not by
itself escape shape six. I derived the mutant that settles it: an
ALL-OR-NOTHING partition, `.filter(|d| announced_denials.is_empty())` —
a plausible "if we already announced live, the result is redundant"
simplification. It is killed by **`one_denial_on_each_channel_is_reported_once_each`
and by nothing else**; the recovery pin and the result-only pin both
stay green. The mixed-channel fixture is load-bearing. Shape six: NOT
present.

**Criterion 3 is properly pinned.** The guard at `runner.rs:2293` is
`result_is_error && !permission_denials.is_empty()`, byte-unmoved from
T-029-s7. Note that dropping `result_is_error` ALONE does not red the
recovery pin — the outer gate `exited_badly || result_is_error`
(`:2230`) skips the whole block for an exit-0 turn, so that mutant is
invisible to it (it kills three other bodies). The mutant that actually
widens the classification is both gates together, and it is killed:

| # | mutant (mine) | result |
|---|---|---|
| M1 | join key `tool_use_id` -> `tool_name` | **GREEN — SURVIVOR, the defect above** |
| M2 | join deleted (over-report) | RED — recovery pin + mixed pin; result-only stays green |
| M3 | late emit deleted (`.take(0)`, silence) | RED — result-only + mixed; recovery stays green |
| M4 | `result_is_error` dropped from the inner guard | RED — 3 bodies (both T-029-s7 tripwires + result-only) |
| M5 | outer gate widened alone | GREEN — but behaviour-PRESERVING; the inner guard still refuses. Not a valid mutant, recorded so the gap is not mistaken for one |
| M7 | all-or-nothing partition | RED — **mixed-channel body ONLY** |
| M8 | both gates widened: a denial is fatal | RED — **5 bodies incl. the criterion-3 recovery pin** |
| M6 | denials batched at the `result` line (transport) | RED — both liveness bodies |
| M9 | store REPLACES instead of appending | RED — `expected [ 'Bash' ] to deeply equal [ 'Bash', 'Bash' ]` |

Every mutation one-sided, every mutated TEXT read back with `git diff`
before the suite ran, every restoration proved by sha256 against
`git show HEAD:<path>` AND an empty `git diff -- <path>`. Nine for
nine; the drill worktree is `git status --porcelain` clean.

**`T-081-s5` CONFIRMED, in both directions, and the replacement is not
the same defect in a new hat.** Under M6 the event log reads
`TextDelta(3), Activity(4), Denied(5), Denied(6), TextDelta(7),
Completed(8)`. The `Activity` witness at seq 4 sits BEFORE the batched
denials, so both liveness bodies red — while **a delta witness at
seq 7 would still have passed**. `Activity` is emitted inside its own
classification arm; deltas go to `pending`. The rule *"if the transport
can hold B, B cannot date A"* holds and the fix is real.

**Criterion 5's report is COMPLETE.** `T-081-s2` claims exactly one
assertion moved; I enumerated every deleted line in every test file
across `d61e986..94476b4` (TWO dots, branch-only). Total deletions:
`tests/agent_runner.rs` **1** — the `["Bash","WebFetch"]` expectation —
and `crescendo.test.ts` **1**, which is the `turn()` fixture-builder
one-liner reflowed to add `denials: []`, not an assertion. `mod.rs`,
`agent-store.test.ts`, `interview-model.test.ts` and
`interview-resume-dom.test.tsx`: **zero**. The set is exactly one.

**Criteria 1, 2, 6, 7 hold.** The discriminator is the positive
`subtype == "permission_denied"` on a guarded arm ahead of the
error-bearing one; the bound (768) and the stripping are asserted with
LITERALS both at `classify_line` and end-to-end through spawn-and-relay;
the three degenerate lines all surface. `#[ignore]` is **exactly
three**, one attribute in each of three files
(`perf_cold_and_incremental_within_ceilings`, `self_graph_is_current`,
`real_cli_smoke_records_the_stream_schema`), pathspec: repo ROOT, all
tracked paths.

### THE `ToolDenied` DOC COMMENT — the executor is RIGHT and the brief was wrong

Ruled independently by tracing construction, not by taking either party
on trust.

- `TurnError::ToolDenied` has **exactly one construction site in
  production code**: `runner.rs:2294`. (`mod.rs:982` is a serde-shape
  test; `fake_agent.rs`'s `Ending::ToolDenied` is a fixture-scenario
  enum in the fake CLI, a different type entirely.)
- That site is gated by `if result_is_error && !permission_denials.is_empty()`.
- `result_is_error` has **exactly one write to `true`**: `runner.rs:1961`,
  inside `if is_error { … }` on the terminal `result` arm — the CLI's
  own `is_error: true`.

**The construction path is therefore unreachable for a turn with
`is_error: false`.** The doc comment — *"the turn died because a tool it
needed was REFUSED"* — describes every turn that actually reaches the
variant. The 2026-08-19 capture (`is_error: false`,
`terminal_reason: "completed"`) never reaches it; it produces
`RunEvent::Denied` events and a `Completed`. What the capture falsifies
is the INFERENCE denial => death, and the new `RunEvent::Denied` doc
comment states the opposite in as many words. Leaving the prose alone
was correct, and editing it would have been wrong.

**The brief's premise traces to `docs/design/cross-harness-plan.md:170`**,
which calls the variant *"provably mis-specified"* and *"false for
Claude"*. That sentence is itself wrong, for the reason above, and it
landed on main at `d61e986` where it will keep seeding briefs — it
seeded this one. The taxonomy's real gap was never a bad doc comment: it
was the ABSENCE of a non-fatal denial event, which is precisely what
this card adds. Filed as `T-081-s7` — and **already closed on arrival**:
main moved during this review, and `3b4326d` (*"correct my ToolDenied
claim in the cross-harness plan"*) rewrites that sentence on exactly this
reasoning, crediting the executor for refusing the brief. Three readers
reached it independently. `s7` is kept as `status: closed` so the
derivation stays re-checkable.

### THE GRANT SPAN — the executor is RIGHT, STATE is wrong, and no duplicate is needed

Re-derived at the branch tip, symbol-anchored:

- `const EXPECTED_GRANTS` at line **54**; closing `];` at line **147**.
- Span decl..close inclusive = **94** lines. Entries = lines **55–146**
  = **92**. Comment or blank inside the body: **ZERO**.
- **92** three independent ways: 92 quote-bearing lines, 92 quoted
  strings, 92 UNIQUE quoted strings.

STATE's *"the anchored span is 128 lines (36 of them comment or blank)"*
is the doc-comment-anchoring error — the first textual occurrence of the
symbol is the `//!` module doc at line 18, not the declaration.
**`T-082-s1` already owns this exact correction**, with the same
endpoints (18 / 147 / 54). The executor's refusal to file a duplicate is
correct.

### SECURITY SWEEP — clean, re-derived at this tip

- `app/src-tauri/src/acl_pin.rs`: **0-file diff** across
  `d61e986..94476b4` (TWO dots), sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`.
- `ENV_ALLOWLIST` (it lives in `agent/runner.rs`, not `acl_pin.rs`):
  **16 entries, 16 unique, BYTE-IDENTICAL** at `d61e986` and `94476b4`.
  No credential-bearing variable added.
- IPC surface unmoved at **13** — 13 `#[tauri::command]` attributes in
  `lib.rs`, 13 names in `generate_handler!`. This card adds an EVENT
  VARIANT, not a command. No `Cargo.toml`, `Cargo.lock`, `package.json`,
  `package-lock.json`, `tauri.conf.json` or capability file in the diff;
  no dependency added.
- New input path reviewed. The CLI's `message` and `tool_use_id` are
  model-adjacent stream data: truncated first, then control-stripped,
  through the single `bounded_stream_string()` both channels share — 768
  bytes for the message, 128 for the name and the id. No argv reaches
  it, no shell, no filesystem path. It is not rendered anywhere yet
  (`T-081-s1`), so there is no injection surface today, and the store
  documents it as a text node. One observation, NOT a finding: the join
  compares ids AFTER truncation, so two raw ids differing only past
  128 bytes would collide and suppress one denial. The only party able
  to arrange that is the CLI, which already owns both channels; real ids
  are ~30 bytes.

### EVERY GATE AND EVERY EXIT CODE — measured, unpiped, in a detached scratch worktree

| gate / suite | command | exit |
|---|---|---|
| bare `cargo test` at `94476b4` | from `app/src-tauri` | **351 / 0 / 3** over 15 result lines, `CARGO_TEST_EXIT=0` |
| app build | `npm run build` from `app/` | `APP_BUILD_EXIT=0` |
| app suite | `npm test` from `app/` | **831 passed, 42 files**, `APP_TEST_EXIT=0` |
| BOOT GATE (6 paths, fires) | `NPUTER_BOOT_PORT=19783 npm run boot:check` from `tools/e2e` | both `[nputer]` lines, `BOOT_CHECK_EXIT=0` |
| GRAPH REGEN (6 paths, fires) | `index --check --root ../..` | **exit 1 — REAL red, see below** |
| token lint selftest | `npm run lint:tokens -- --selftest` | 49 TOKEN + 4 CONTROL samples, 71 walk-policy, 8 evidence-floor, `LINT_SELFTEST_EXIT=0` |
| token lint | `npm run lint:tokens` | **TOKEN 119 / CONTROL 554**, `LINT_TOKENS_EXIT=0` |

Both cargo figures summed programmatically over fifteen `test result:`
lines from the BARE invocation. CONTROL **554** at the branch tip is the
card's arithmetic confirmed (548 + 6 finding files); TOKEN **119**
because `docs/` is outside the TOKEN roots.

**`index --check` exit 1 is a REAL red, confirmed, and no `graph.json`
belongs here.** Run from `app/src-tauri` with `--root ../..`, so not the
false red the `--root` note warns about — and the real-red shape is
present: both counts printed and a file diff.

    committed:   575619 bytes · 118 files · 995 symbols · 1518 edges
    fresh index: 576235 bytes · 118 files · 996 symbols · 1520 edges
    files +0 -0 ~6 · edges +2 -0
      + GenesisEvent -> GenesisDenial (type_ref)
      + GenesisTurn  -> GenesisDenial (type_ref)

The six changed files are exactly GRAPH REGEN's six (two `app/src/**`,
four `app/test/**`); the one new symbol is `GenesisDenial`. CONVENTIONS
puts the regen at the CHECKPOINT, and `docs/architecture/graph.json` is
outside this fence. Expected branch-side state.

### THE FENCE — ACCEPTABLE, not a breach

`touches: [app-agent]` is `app/src-tauri/src/agent/**` plus
`app/src/lib/agent-store.ts` (ARCHITECTURE:28, C-14). The two crossings
are one line of `app/src/genesis/interview-model.ts` (C-13) and four
`GenesisTurn` literals under `app/test/**`. Ruling: acceptable, on four
grounds. They are MECHANICALLY FORCED — `GenesisTurn` lives inside the
fence and making `denials` required makes every literal a compile error,
so this is the type system's consequence of an in-fence change, not
scope creep. Each is the same one-line `denials: []` completion with no
behaviour change, and `[]` is semantically right (the transcript banks
no denial record). They are DECLARED on the card, not discovered. And
the precedent is exact and larger: T-082, fenced `app-shell`, edited the
same C-13 file by 22 lines plus 39 test lines. The rejected alternative
(`denials?:` with `?? []` at every read) would push the optionality onto
every future consumer. What is correctly NOT crossed is the RENDERING —
nothing reads the field, which is `T-081-s1` and belongs to C-13.

### THE RECORD — what the dispatch brief and the notes got wrong

- **The brief's `ToolDenied` premise is WRONG.** Ruled above. The
  executor's correction stands, and it was right to contest it on the
  card rather than silently.
- **Criterion 7 names a pin that does not exist.**
  `an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail`
  appears nowhere as a Rust `fn` — only in prose, at
  `docs/tasks/T-025-agent-runner.md:505`. The real body is
  `an_in_band_auth_failure_is_typed_authfailed_not_a_relayed_exit_code`
  (`tests/agent_runner.rs:1347`), and it is GREEN. Criterion 7's
  substance holds; the citation is a card defect that predates the
  executor, who did not flag it. Filed as `T-081-s8`.
  **THIS ENTRY'S OWN CITATION IS UPDATED, NOT REWRITTEN (T-108,
  2026-08-25, at `43f995a`).** `T-025-agent-runner.md:505` was true when
  written and is not any more, and it was T-108's own edit that moved it —
  so leaving it would have planted exactly the stale citation this entry
  is about. In T-025 that name is no longer a citation of a pin at all: it
  survives only inside a dated correction block in the §6 smoke notes,
  quoted as the spelling that was wrong. **The line number is deliberately
  not replaced with a fresher one** — a line number is the same class of
  fact as the figures this card family keeps having to re-measure, and
  T-027's own notes record `watcher-store.ts:533-534` going stale the same
  way. `T-081-s8` was absorbed by T-108 and its file no longer exists.
- **`T-081-s6` is accurate and correctly handled** — it rules the
  CONVENTIONS sentence AMBIGUOUS rather than false (both existing
  members read `docs/CONVENTIONS.md`; the new reader reads a different
  docs file), and defers it to a CONVENTIONS fence instead of folding it
  in. Not a confabulation.
- **The card's `ENV_ALLOWLIST` "423 bytes" vs my 422** is a
  trailing-newline convention, not a discrepancy. No finding.
- **My own error, stated plainly:** my first IPC count returned 14. One
  hit is a doc comment at `agent/mod.rs:24`. The card's **13** is right
  and I was wrong.
- **PORT RULE honoured.** 1420 was never bound, connected to or
  signalled; the only question asked of it was
  `lsof -nP -iTCP:1420 -sTCP:LISTEN`, before and after, which both times
  named node **82549** on `[::1]:1420`. Scratch port 19783 was
  bind-probed free on all four of `127.0.0.1`, `0.0.0.0`, `::1` and `::`
  before use and `lsof`-empty after. The human's app is **97844**
  (ppid 82364, started Wed Aug 19 21:53:30) — unchanged before and
  after every suite, the drill and the boot check. The brief's 97844 is
  correct and the older 36009 is stale, as the card says.
- **No real model call.** The capture is a file; I parsed all 27 lines
  rather than grepping. Confirmed independently: two
  `system`/`permission_denied` lines (17 and 19), **both `tool_name:
  "Bash"`** with ids `toolu_01FAHQKCKFrBLrmVtRiuLT9L` and
  `toolu_0173K9Q72m797nLBonDtrc3R`; the `result` line reads
  `is_error: false`, `terminal_reason: "completed"`. Line 17 carries no
  `decision_reason`; line 19 does. The card's transcription claims are
  true.
- No `npm ci`, no `npm install`, no `pkill`, nothing run in the main
  checkout. All work in a detached scratch worktree with
  `node_modules` and `lib/parser/dist` symlinked read-only, and
  `CARGO_TARGET_DIR` pointed at scratch.

### WHAT UNBLOCKS THIS

The one fixture and one body described under THE DEFECT. Criterion 4's
join key becomes falsifiable, `T-081-s2`'s lesson gets the pin it
argues for, and the drill table gains the round that makes
"zero survivors" true against a mutant set derived from the CRITERIA
rather than from the pins. Nothing else on this card needs to move.


### 2026-08-20 — APPROVED (claude-opus-5 @T-081-verify2, review: same-model)

**The blocking defect is closed, the fixture is the shape I named, and
one claim of my own first verdict was wrong and is corrected below.** I
re-derived every contested point rather than accepting the fix report:
the mutant that isolates the mixed-channel body is NOT the one I ruled
on, and the executor is right about that. One new non-blocking finding
(`T-081-s10`). And the red the branch carried into this round was
**mine**; it is reproduced, owned and corrected here.

### THE DEFECT IS CLOSED — measured, not accepted

`denied-same-tool-one-announced` is exactly the discriminating stream:
one in-band `Bash`/`toolu_announced`, an `Activity` marker, then a
`result` (`is_error: false`, `terminal_reason: "completed"`) listing
`Bash`/`toolu_announced` AND `Bash`/`toolu_never_announced`.

Re-running **M1**, the survivor from my first verdict — join key
`tool_use_id` -> `tool_name`, both sites, text read back before the
suite ran:

    M1_EXIT=101 · 351 passed / 1 failed / 3 ignored
    RED: a_second_refusal_of_the_same_tool_is_not_swallowed_by_the_first
      left:  [Some("toolu_announced")]
     right:  [Some("toolu_announced"), Some("toolu_never_announced")]

The silence I demonstrated is now a failing assertion, and it is the
ONLY body that reds — the pin is precise rather than incidental.
Baseline at `5b14603`: **352 / 0 / 3** over fifteen `test result:` lines,
bare `cargo test`, `CARGO_TEST_EXIT=0`.

### MY SHAPE-SIX RULING MOVED, AND THE EXECUTOR IS RIGHT

My first verdict closed poison shape six on **M7** (the all-or-nothing
partition), which I measured as killed by
`one_denial_on_each_channel_is_reported_once_each` and nothing else.
**That no longer holds, and the reason is structural rather than
incidental.** Re-measured at `5b14603`:

    M7_EXIT=101 · 350 / 2 / 3
    RED: one_denial_on_each_channel_is_reported_once_each
    RED: a_second_refusal_of_the_same_tool_is_not_swallowed_by_the_first

M7's premise is a NON-EMPTY `announced_denials` at the `result` line —
that is what makes "emit all or emit none" differ from the correct
partition. But partial announcement is the defining premise of ANY
fixture that discriminates the join at all. So M7 was never reading the
mixed fixture's distinguishing property; it was reading *partial
announcement*, which the new fixture necessarily also has. My ruling
was correct on the evidence then available and is superseded now.

**Re-derived. The mixed fixture's unique property is that its two
denials carry DIFFERENT tool names, and the mutant that reads it is
`M10`** — the late emit takes `denials.first()`'s name instead of its
own:

    -   denial.tool_name.clone(),
    +   denials.first().and_then(|f| f.tool_name.clone()),

    M10_EXIT=101 · 351 / 1 / 3
    RED: one_denial_on_each_channel_is_reported_once_each   (alone)

`first()` is the RIGHT answer for the result-only fixture (one entry)
and for the same-tool fixture (both names `Bash`), and the WRONG answer
only where an unannounced entry is not first and carries a different
name. **Shape six is closed, on M10 rather than M7**, and the property
is real: a late-emitted denial must carry its own tool name, or the app
names the wrong tool in a refusal notice. I searched for an independent
isolating mutant in the same class and found none that is not
arithmetically M10 over these fixtures — with one unannounced entry per
stream, "first", "positional" and "wrong entry" coincide. M10 is the
right mutant, not a contrived one.

Every mutation this round one-sided, every mutated TEXT read back with
`git diff` before its suite ran, every restoration proved by sha256
against `git show HEAD:<path>` AND an empty `git diff -- <path>` —
**four for four** (M1, M7, M10, MV1). Drill worktree
`git status --porcelain` clean.

### ONE NEW FINDING, NOT BLOCKING — `T-081-s10`

My own mutant **MV1** reverts the notes' stated decision TWO, narrowing
the ring note to the unannounced subset:

    -   let unreported = denial_names(unannounced.iter().copied());
    +   let unreported = denial_names(&denials);

    MV1_EXIT=0 · 352 / 0 / 3 · ZERO bodies red — SURVIVOR

The narrowing is right and is stated on the card; nothing can fail if it
is undone. It is unreachable across the current fixture set because the
tail only surfaces on `ExitNonZero` (`ToolDenied` has no `stderr_tail`),
which needs `is_error: false` plus a non-zero exit — the
`denied-then-end-turn` shape — while every fixture with an in-band line
exits 0. Not blocking: the card does not mandate the narrowing, both
`Denied` events are correctly joined, and the worst case is a name
repeated inside a diagnostic blob on an already-failing turn. Filed with
a suggested close.

### THE RED THE BRANCH CARRIED WAS MINE

**Reproduced rather than accepted.** A detached worktree at `ba31a10`,
my own verdict tip:

    npx vitest run test/architecture-dogfood.test.ts   EXIT 1
    × both input layers parse clean (the smoke-test discipline)
      expected [ { kind: 'invalid-field', …(3) } ] to deeply equal []
      field 'status' must be one of suggested | planned | building |
      verifying | rejected | merging | done | parked, got "closed"
      Tests  1 failed | 8 passed (9)

`T-081-s7` shipped `status: closed`, a value outside the parser's
vocabulary and the only one in the tree. I invented it. `docs/` is an
INPUT to the app suite through T-024's dogfood discipline, so a verdict
commit whose entire diff was one markdown file turned a code gate red —
and I did not find it because **I measured `npm test` at the commit
under review and never re-ran it after committing.**

Fix confirmed at `5b14603`: dogfood **9 / 9, exit 0**; `grep -rn
"^status: closed" docs/ method/` returns nothing. `suggested` is the
right value — what every other finding here carries, one of the two the
parser accepts for a minimal file, and what the T-083 integrator ruled a
discharged finding should keep.

**And the same mechanism staled a figure in my first verdict, which I
correct here rather than leave standing.** That verdict's gate table
reports `CONTROL 554`, measured at `94476b4`. My own two commits added
two tracked text files, so my tip was **556**, and the tip this verdict
measures is **557** (548 + 6 executor findings + my s7/s8 + s9); `s10`
makes it 558 at my commit. The arithmetic closes at every step; the
published figure was simply measured one commit too early.

### RULING ON `T-081-s9`'s SHAPE — right, with one boundary to draw

**s9 is correctly shaped**, and its account of my error is accurate in
every particular I could check, including the CONTROL staleness I had
not noticed myself. It is a ROLE finding — *"a role that writes to the
tree owes the tree's gates, even when what it wrote was prose"* — and
that is the right frame, because it is broader than `docs/` (a verifier
committing anything owes the gates its commits move) and narrower in a
different axis (it is about WHO re-measures, not WHICH trigger fires).

**The boundary worth drawing:** s9's candidate close 1 — a frontmatter
vocabulary gate beside the token lint — is now substantially `T-084`'s
territory. T-084 landed on main at `073f136`, is scoped exactly to
*"`docs/` is a code input and neither standing gate knows it"*, cites
this incident as its second instance, and carries
`touches: [docs/CONVENTIONS.md, tools/e2e]`. Carrying the same remedy in
two places is the failure this card's own decision ONE names: *"a rule
with two implementations is two chances to disagree about it"* (T-057).
So: s9 should keep candidate close 2 — the role clause in
`method/roles/verifier.md`, which is uniquely its own and which no gate
can supply, since a stale printed CONTROL figure is not a pin and
nothing mechanical will ever catch it — and DEFER candidate close 1 to
T-084 with a cross-reference. Recommended, not required; both files are
outside this fence.

### CRITERION 7's DISCHARGE — confirmed against the body that exists

`an_in_band_auth_failure_is_typed_authfailed_not_a_relayed_exit_code`
(`tests/agent_runner.rs:1347`) run by name: **1 passed, exit 0**, and
green in the 352/0/3 baseline. The discharge is against a real body.

**The phantom's behaviour is now measured, and it is worse than
useless.** `cargo test --test agent_runner <phantom>` prints
`test result: ok. 0 passed; 0 failed; 0 ignored; 73 filtered out` and
exits **0** — the mechanical check of a cited pin actively CONFIRMS a
pin that does not exist. `git grep "fn <phantom>" -- '*.rs'` exits 1
correctly; the unrestricted `-- .` now exits **0**, because this
finding and the executor's notes put the string into `docs/`. My own
`T-081-s8` recommended the unrestricted form; that recommendation was
self-defeating and is corrected in place, with the pathspec `T-082-s2`
already requires.

### RANGES, dot counts stated — and a figure of mine to correct

Main moved TWICE during this round: `f4f77d7` when the fix was handed
over, `073f136` by the time I measured. Merge-base with the branch is
unchanged at `d61e986`.

| form | dots | paths |
|---|---|---|
| `git merge-tree --write-tree main 5b14603` | — | **20**, exit 0 |
| `main...5b14603` | THREE | **20** |
| `d61e986..5b14603` | TWO, branch-only | **20** |
| `main..5b14603` | TWO, pre-merge — FORBIDDEN | **32** |

`cmp` of the merge-tree forecast against the branch-only two-dot list:
**exit 0**, byte-identical. **The handover reports the forbidden form at
31 with eleven foreign paths; I measure 32 with twelve.** Neither is an
error — main gained `docs/tasks/T-084-…md` between the two
measurements, and the naive form absorbs it. That is T-083's range rule
demonstrating itself twice inside one review, and it is the reason the
figure has to name its ref: **31 at `f4f77d7`, 32 at `073f136`.**

### GATES AND EXIT CODES — all measured at `5b14603`

| gate / suite | exit |
|---|---|
| bare `cargo test` (not `--all-targets`) | **352 / 0 / 3** over 15 result lines, `CARGO_TEST_EXIT=0` |
| `npm run build` from `app/` | `APP_BUILD_EXIT=0` |
| `npm test` from `app/` | **831 passed, 42 files**, `APP_TEST_EXIT=0` |
| `architecture-dogfood.test.ts` alone | **9 / 9**, exit 0 |
| BOOT GATE — fires, `NPUTER_BOOT_PORT=19811` from `tools/e2e` | both `[nputer]` lines, `BOOT_CHECK_EXIT=0` |
| GRAPH REGEN — fires, `index --check --root ../..` | **exit 1, real red** |
| `npm run lint:tokens` | **TOKEN 119 / CONTROL 557**, `LINT_TOKENS_EXIT=0` |

`index --check`'s red is the same one my first verdict confirmed and is
still correct to leave: committed 995 symbols / 1518 edges against a
fresh 996 / 1520, six files changed, `+2 type_ref` edges
(`GenesisEvent -> GenesisDenial`, `GenesisTurn -> GenesisDenial`), and
no `graph.json` in the branch diff. CONVENTIONS puts the regen at the
CHECKPOINT.

### SECURITY — re-derived at this tip, unmoved

`acl_pin.rs` **0-file diff** across `d61e986..5b14603` (TWO dots),
sha256 `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`.
`EXPECTED_GRANTS`: decl **54**, closing `];` **147**, span **94**,
entries **92**, 92 quoted, 92 unique, zero comment or blank — the ruling
of my first verdict, unchanged, with `T-082-s1` still owning STATE's
128. `#[ignore]` exactly **three**, one per file. No `Cargo.toml`,
`Cargo.lock`, `package.json`, `package-lock.json`, `tauri.conf.json` or
capability file in the diff; no dependency added; the new fixture adds
no input path — it is a second stream shape through the same bounded,
control-stripped parse.

**PORT RULE honoured.** 1420 was never bound, connected to or
signalled; `lsof -nP -iTCP:1420 -sTCP:LISTEN` named node **82549** on
`[::1]:1420`. Scratch port 19811 bind-probed free on `127.0.0.1`,
`0.0.0.0`, `::1` and `::` before use. App **97844** and vite **82549**
unchanged. No real model call — the capture is a file. No `npm ci`, no
`npm install`, no `pkill`, nothing run in the main checkout.

### VERDICT

**APPROVED.** Criterion 4's join key is pinned by a body that dies when
it moves, and the body is the observed CLI's own shape. Criteria 1, 2,
3, 5, 6 and 7 hold, re-checked. Shape six is closed on a re-derived
mutant, and the record now says which one and why the first was wrong.
`T-081-s10` is filed and does not block. The fence ruling of my first
verdict stands.
