---
id: T-029
title: Genesis resume + hand-driven fallback — restart-proof, CLI-optional
feature: F-03
milestone: 3
priority: 7
size: M
status: done
blocked_by: [T-027]
touches: [app-interview, app-agent]
builder: claude-opus-5 @fresh
verifier: claude-opus-5 @fresh (re-verification 2026-08-18)
built_by: claude-opus-5 @fresh
verified_by: claude-opus-5 @fresh (re-verification 2026-08-18)
review: same-model
---

The succession guarantee applied to the interview: files are the only
state that matters, so an app restart mid-interview loses nothing,
and a missing CLI degrades to the method's manual protocol rendered
live — option (b) as a first-class MODE (the ADR-006 instrument),
not a separate build.

Absorbs: T-025-s1, T-026-s3 (triage 2026-08-16) — the typed
classification this task routes on, and the "where does 'the shell was
in genesis on <folder>' live" question that T-022 must not answer
separately.

Also absorbs: T-027-s2, T-039-s3, T-047-s3 (triage 2026-08-17). All
three are the same shape as the `AuthFailed` criterion below and as
each other — **a fact that is known and typed inside the process, and
then delivered nowhere a user can see it.** T-027-s2 is a refused turn
subscription that leaves the chat permanently empty while the plan
visibly assembles beside it; T-039-s3 is two refusals riding blunt
catch-all arms; T-047-s3 is a registry field validated on the way in
and never on the way out. This task owns every "the conversation is
not where you left it" state, and it is the first task with a real
caller for the third. Their suggestion files are removed in the same
commit as this line.

GATE: T-039 (session-id injection) must merge before this dispatches —
this is the task that reads the id off .nputer/sessions.json, which is
exactly what makes that injection reachable.

## Acceptance criteria
- WHEN the app reopens a project with an in-flight genesis (genesis
  eligibility true + a live .nputer/sessions.json planner entry or
  .nputer/genesis/ present) THE app SHALL offer resume: respawn via
  the adapter's resume template with the recorded native session id,
  chat history rehydrated from transcript.jsonl when present; the
  derived stage and banked artifacts come from docs/ (truth), never
  from the cache.
- IF the transcript cache is missing or corrupt THEN resume SHALL
  still work from docs/ + the session id, rendering banked-progress
  summary in place of history (losable-by-charter, pinned in tests).
- IF the native session no longer resumes (CLI error) THEN the app
  SHALL offer continue-with-a-fresh-session: kickoff assembled with
  T-023's resume rule (read the banked docs, state the next stage,
  continue) — degraded, never dead.
- WHEN no supported CLI is found (T-025's typed not-found) THE
  genesis screen SHALL render the hand-driven mode: the fully
  assembled kickoff prompt in a copyable block ("run this in any
  agent CLI in your terminal — I'll render what lands"), the T-024
  lens live on the right, and the same completion detection
  (T-028) — the split-view magic with zero agent plumbing, any
  model, any CLI.
- IF the user cancels a spawned interview THEN the child process
  SHALL be dead (T-025's kill contract exercised from the UI path),
  docs/ untouched, and the project SHALL remain openable/resumable.

Verification: headless — served-bundle + cargo restart-simulation
tests (kill mid-interview at a scripted stage, reopen, both resume
paths; cache-corruption fixture; not-found routing). @human, listed
explicitly: one real hand-driven run in the fallback mode (this
doubles as an ADR-006 manual-interview instrument check).
- THE runner SHALL classify an in-band authentication failure as a
  TYPED outcome rather than a relayed blob. Measured against the real
  claude 2.1.226: stderr is COMPLETELY EMPTY, the failure arrives on
  stdout as an `api_retry` line with `error_status: 401`, and the
  `result` line's `subtype` still reads `"success"` while `is_error`
  is true. An `AuthFailed { status, message }` variant SHALL let this
  screen render the one action that helps ("your CLI's login has
  expired — run `claude login`") and route STRAIGHT to the
  hand-driven fallback. `terminal_reason` and `permission_denials`
  SHALL be read alongside it, so a turn that died because
  `--allowedTools` was too narrow says so by name (T-025-s1).
- THE fact that "an interview was running on <folder>" SHALL be
  written in exactly ONE place — the runtime `.nputer/` registry,
  never docs/, which stays project truth — and T-022 SHALL consume it
  rather than invent a second mechanism (T-026-s3).
- `GenesisState` SHALL CARRY THE FACT THAT THE TURN CHANNEL IS NOT
  OPEN. `startInterviewSource` wraps `listen("genesis-turn")` in a
  try/catch — it must, because an unhandled rejection at the app root
  is what T-050 spent a task removing — and the whole user-visible
  response is a `console.error`
  (`interview-source.ts:134`). The screen renders normally, the input
  is enabled, "Start the interview" works, `genesis_start` reports
  `started { turn: 1 }`, the planner really runs and really writes
  into `docs/`, the RIGHT half shows the files landing — **and the
  left half stays empty forever with no explanation.** Shape 1 of the
  two: C-14 gains a `listenerFailed: boolean` (or a new typed
  `lastOutcome` variant), `startGenesisListener` sets it, and the chat
  renders the existing inline-notice treatment over it. Shape 2 (a
  flag private to the source module) is REJECTED in advance: it makes
  the store and the UI disagree about whether the interview is live,
  which is the split-brain T-027 §1 spent its length arguing against.
  Reproduction needs no new machinery: make the `listen` mock reject
  in `interview-harness.test.ts` (T-027-s2).
- THE TWO SESSION-ID REFUSALS SHALL GET THEIR OWN TYPED VARIANTS now
  that this task touches both sides of the wire. Today capture-side
  rides `TurnError::MalformedStream { why }` and registry-read side
  rides `StartOutcome::Error { message }` — both correct, both blunt:
  `MalformedStream` files an attempted argv injection next to a
  truncated line, and the webview cannot tell "your runtime file holds
  an unusable id — delete it" from "the registry could not be written"
  without reading English. Add
  `StartOutcome::SessionIdRejected { registry_path, why }` and
  `TurnError::RejectedSessionId { why }` with their `agent-store.ts`
  mirrors, and route the first to a "your saved session is unusable —
  start fresh" affordance rather than a generic error toast. The
  rejection strings already exist and are already escaped; only the
  envelope changes. **This is the same delivery-not-detection shape as
  the `AuthFailed` criterion above** — the fact is typed and captured
  and then routed somewhere nobody reads (T-039-s3).
- `SessionEntry.model` SHALL GAIN A READ BOUNDARY, mirroring what
  T-039 gave the id. T-047 validated the model at the CAPTURE boundary
  (`adapter.rs:402`, 128 bytes, printable ASCII, no space) and left
  the READ side raw — the exact asymmetry T-039's criterion 3 was
  written about, and every word of T-039's argument for the id ("a
  losable runtime file in the user's project directory, writable by
  anything with disk access") applies to `model` too.
  `display_model() -> Result<Option<&str>, ModelRejection>` with
  callers going through the accessor and reading the raw field
  becoming the bug. **Unlike the id's, a rejection here SHALL NOT
  refuse to start** — there is nothing to refuse, the session is fine
  — it renders as "model not recorded" and says so once in a log line.
  A registry written by a pre-T-047 build can hold ~1 MiB of model
  (measured: 200,290 bytes of `sessions.json` from a 200,000-byte
  model) and upgrading does not clean it. **This suggestion's original
  home was T-027, which has landed and renders nothing off this
  struct** — verified at triage, the only `.model` under
  `app/src/genesis/**` is `docs.model.features` — and this task is the
  first with a real caller (T-047-s3).

## Implementation notes

**Architect, 2026-08-17 — the auth criterion traced end to end on the
merged tree, because T-027 made it reachable and the human's token is
revoked.** This is what the flagship screen does TODAY on a revoked
login, verified by reading the merged code rather than inferred:

1. The real CLI **exits 1** on this failure — `runner.rs:1299` says so
   in its own words ("Not observed in the 2.1.226 smoke (it exited 1)").
   So the turn is typed `ExitNonZero { code: Some(1), stderr_tail }`,
   NOT the `result_is_error` branch above it.
2. **`stderr_tail` is empty**, because this failure carries nothing on
   stderr (the criterion above measured that).
3. `failureDetail` (`interview-model.ts:390`) returns `null` for an
   empty trimmed detail, and `FailureBlock`
   (`interview-turns.tsx:259`) renders the detail span only when it is
   non-null.
4. **So the screen says exactly "the planner exited with code 1", with
   no detail at all**, followed by "Nothing was lost…" and a **Try
   again** button that fails identically every time. The user is given
   no reason to suspect their login, and the one affordance offered is
   the one that cannot work.
5. **The 401 IS already in the process.** `runner.rs:896–902` parses the
   in-band `api_retry` line and emits
   `Diagnostic("api_retry: <error> 401")`. The information that would
   solve the user's problem is captured, typed, and then routed to a
   channel the failure block never reads. **The gap is delivery, not
   detection** — which should make this cheaper than the criterion's
   wording suggests.

`interview-model.ts:366–370`'s own comment already names this as this
task's territory ("auth-vs-anything-else is T-029's"), so nothing here
contradicts T-027; it is the fence T-027 correctly declined to cross.

**Priority consequence**: this is not a degraded-mode nicety. Until it
lands, the first real run of the flagship screen by a user whose CLI
login has lapsed is a dead end with a button that lies. Treat criterion
"AuthFailed" as the task's leading edge rather than its tail, and
consider landing it before the resume machinery if the two want
splitting.

---

**Executor, claude-opus-5 @fresh, 2026-08-17.** Built on `bdecad8`
(T-028's checkpoint), branch `task/T-029-resume-fallback`, worktree
`/Users/ujju/Projects/nputer-T-029`.

### THE ARCHITECT'S AUTH TRACE IS WRONG ON THREE OF ITS FIVE STEPS — verify this first

Steps 1 and 5 hold. Steps 2, 3 and 4 do not, and the correction matters
because it changes what the criterion is actually for.

**Step 2 says `stderr_tail` is EMPTY. It is not.** The
`stderr_ring` is not a stderr ring — it is a DIAGNOSTIC ring with THREE
writers, and only one of them is stderr (`runner.rs:1078` creates it;
`:1088` is the stderr thread; `:1194` pushes the `result` line's text on
`is_error`; `:1204` pushes the `api_retry` diagnostic; `:1211` pushes
non-JSON lines). T-025 wired the in-band lines into it on purpose, and
said so in its own test name. Measured on the pre-fix tree, verbatim from
`cargo test --test agent_runner an_in_band_auth_failure -- --nocapture`:

    ExitNonZero { code: Some(1), stderr_tail:
      "api_retry: authentication_failed 401\nFailed to authenticate.
       API Error: 401 OAuth access token has been revoked." }

**So steps 3 and 4 fall with it.** `failureDetail` returns that string
(non-empty), `FailureBlock` renders the span, and the screen did NOT say
"the planner exited with code 1" with no detail at all. **It said "the
planner exited with code 1" over an escaped ONE-LINE BLOB of the CLI's
own words** — `sanitize_for_log` escapes control characters, so the `\n`
renders as two literal characters rather than a line break.

**The criterion still stands, and its own wording is the accurate one:**
"a TYPED outcome rather than a RELAYED BLOB". The bytes were being
delivered; the MEANING was not, and neither was the one action that
helps. **The real defect is the Try again button**, which fails
identically forever because nothing about a revoked login changes between
two presses. That is what this build removes.

**The pre-existing regression pin `agent_runner.rs:533` is what proves
all of this** — it asserted `stderr_tail.contains("401")` and passed on
main. Anyone re-deriving the trace hits it in one command.

**One other citation was checked before being built on** — the habit
T-028's missing "completion signal" earned. Criterion 3 cites "T-023's
resume rule". It **EXISTS**: `method/roles/planner.md:79`, § Resume rule,
and `assemble_resume_kickoff` transcribes its substance. So this card's
citations are one-for-one worse than T-028's and one-for-one better.

### Criteria → evidence

**AuthFailed (led, as instructed).** `TurnError::AuthFailed { status,
message }` at `runner.rs:100`. Detection: `classify_line` now reads the
result line's `api_error_status` / `terminal_reason` /
`permission_denials` as TYPED fields (`runner.rs:1005-1017`) and
`StreamLine::Diagnostic` keeps the status as a NUMBER beside the note
(`runner.rs:915-923`); the relay loop tracks them (`runner.rs:1156-1160`,
`:1249-1276`); classification runs **before the exit code is looked at**
(`runner.rs:1428-1491` — the cited `1338-1372` was wrong when written;
corrected in place by the SECOND EXECUTOR rather than left standing.
The verifier measured `1418-1456` at `307319b` and was right; the fix
below adds fourteen lines of comment inside the block, so the live
range is the one quoted here) because exit 1 means a dozen things and
the stream says which. Routed: `failureHeadline`/`failureAction`
(`interview-model.ts:388-460`), rendered `interview-turns.tsx:266-346`.
Tests: `agent_runner.rs:533`, `interview-model.test.ts:707`,
`interview-resume-dom.test.tsx:160`, `resume-fallback.spec.ts:48`.
`terminal_reason` + `permission_denials` read alongside as
`TurnError::ToolDenied` (T-025-s1) — `runner.rs:107`, fixture
`fake_agent.rs:172-201`, test `agent_runner.rs:590`.

**Criterion 1 — resume.** `agent::resume_genesis` (`mod.rs:414`) reads
the id through `SessionEntry::resume_id`, respawns on the adapter's
`resume_args`, and the chat rehydrates from `transcript.jsonl`
(`mergeRehydrated`, `interview-model.ts:311-397`). The stage and the
banked artifacts come from `docs/`, never the cache — `stageOf(docs)` is
unchanged. Test: `agent_runner.rs:1723` asserts `--resume
fake-session-0001` in turn 2's argv, spawned by an `AgentState` that
never saw turn 1.

**Criterion 2 — losable cache.** `agent::transcript` (`mod.rs:601`)
answers an empty vector for missing, corrupt and unreadable alike;
`refreshGenesisTranscript` does the same for a refused invoke
(`agent-store.ts:479`). Tests: `agent_runner.rs:1793` drills deleted AND
corrupted (they reach different code and only one was exercised before);
`interview-resume-dom.test.tsx:378` drills empty / `undefined` /
rejected.

**Criterion 3 — fresh session.** `agent::fresh_genesis` (`mod.rs:497`)
marks the old entry `dead` (the method's own word,
`method/runtime/sessions-schema.md:27`) and kicks off with
`kit::assemble_resume_kickoff` (`kit.rs:249`). Test:
`agent_runner.rs:1849` — no `--resume` in argv, the kickoff carries
"RESUME RULE" and "never overwrite real content", the old entry is
`dead` not deleted, and `docs/NORTH_STAR.md` is byte-identical after.

**Criterion 4 — hand-driven MODE.** `agent::kickoff` (`mod.rs:648`)
MATERIALIZES the kit before answering, so the prompt names a kit that
exists; `assemble_kickoff_for` picks stage-0 or resume from FILE
EVIDENCE (`kit.rs:218`). Rendered `InterviewChat.tsx:HandDrivenBlock`,
reachable from the `cliNotFound` card, from an auth failure and from the
listener notice. Tests: `agent_runner.rs:1975`,
`interview-resume-dom.test.tsx:497`, `resume-fallback.spec.ts:48`.

**Criterion 5 — cancel.** `agent_runner.rs:1919`: the UI path
(`agent::cancel`), the child dead by `pid_alive`, `docs/` never created,
then a REBOOT into a live `ResumeAvailable` and a working resume.

**Criterion "exactly ONE place" (T-026-s3).** `sessions::genesis_record`
(`sessions.rs:245`) derives the fact from `.nputer/sessions.json` and
nothing else; `GenesisRecord` is the type T-022 consumes. Test
`agent_runner.rs:1943` proves it by DELETING that one file — the fact
goes with it, which is only true if there is no second copy, and
`docs/` is unaffected either way.

**T-027-s2 — listenerFailed.** `GenesisState.listenerFailed`
(`agent-store.ts:186`), set by `startGenesisListener`
(`agent-store.ts:395`), rendered `InterviewChat.tsx:~430`. **Shape 2 was
respected: the flag is on the STORE.** Two things beyond the card: the
latch is RELEASED on failure so a retry genuinely re-subscribes, and
**the auto-start refuses a dead channel** — spawning a planner that
really writes into `docs/` while this half can never show a word of it is
the defect made worse by doing it unasked. The explicit button still
works. Tests: `interview-resume-dom.test.tsx:~430`,
`resume-fallback.spec.ts:90`.

**T-039-s3 — two typed refusals.** `StartOutcome::SessionIdRejected {
registry_path, why }` (`mod.rs:80`) and `TurnError::RejectedSessionId {
why }` (`runner.rs:117`), both routed. The rejection strings are
unchanged and still escaped; only the envelopes moved. Four pre-existing
cargo tests were updated to the new envelopes.

**T-047-s3 — the model's read boundary.** `SessionEntry::display_model`
+ `model_for_display` (`sessions.rs:98-120`), with a REAL CALLER:
`StartOutcome::ResumeAvailable.model`. A rejection refuses nothing — it
renders "model not recorded" and logs once. Test `agent_runner.rs:2013`
drills the ~1 MiB class, a terminal escape, a space and a homoglyph, and
proves the resume still stands for every one; the exotic-but-real
`us.anthropic.claude-sonnet-4@20240620:0` still comes through.

### One design decision the card did not ask for

`TranscriptLine` gained `machine: bool` (`sessions.rs:170`). The kickoff
and the resume nudge ride `role: "user"` because they genuinely are the
user half of the protocol — but the human did not type them, and a
rehydrated chat drawing "You are the planner. KIT ROOT: …" in their own
bubble would be the chat claiming they said it. The alternative was
recognising machine text by READING it, which is the classify-by-string
this project bans everywhere else. `#[serde(default,
skip_serializing_if)]`, so a pre-T-029 transcript parses unchanged.

### Suites, first-hand in this worktree, never piped through `tail`

- **lib/parser** build 0 · `tsc --noEmit` 0 · **225/225 (11 files)** —
  unchanged, zero parser files touched.
- **app** `tsc --noEmit` 0 · build 0 · **795/795 (42 files)** (main 768/41
  → +27 tests, +1 file: `interview-resume-dom.test.tsx` 16 and
  `interview-model.test.ts` +11). Bundle `index-Bf-QNmtC.js` 497.86 kB /
  `index-CryMc_lw.css` 43.90 kB (main: 488.81 / 43.79).
- **app/src-tauri** bare `cargo test` → **307 passed + 3 ignored, 0
  failed, ZERO warnings** (main 299+3 → +8). Breakdown
  108/0/0/40/123/0/7/13/3/7/0/2/4/0/0.
- **tools/e2e** typecheck 0 · `NPUTER_E2E_PORT=15420 npm test` → **74
  passed** (main 70 → +4, `resume-fallback.spec.ts`).
- **`npm run lint:tokens`** → clean, **116 files** (main 114 → +2), zero
  allowlist; `--selftest` 49 samples + 14 walk-policy checks green.
- **BOOT GATE (T-046 criterion 6): FIRED, RAN, GREEN.** Trigger:
  `app/src/**` and `app/src-tauri/**` both touched. Scratch port
  **15430**, bind-probed free immediately before use. Both `[nputer]`
  lines detected, `BOOT_EXIT=0`, run twice. Ports 15420/15430/15431 empty
  afterwards; no stray `tauri dev`; **1420 read-only `lsof` only, one
  listener throughout, never bound, connected to or signalled.**

### The poison sweep — 40 bodies, 100%, and ONE vacuous assertion caught

Run **inline, no scratch script** (T-028's better pattern). Six rounds,
**36 source mutations** across ten files; every new or changed test body
was shown RED under a mutation of the thing it tests.

- **Rust: 9 bodies** (2 rounds, 11 mutations) — auth classification
  disabled, tool-denial disabled, `RejectedSessionId` reverted to
  `MalformedStream`, `resume: None`, `display_model` made infallible,
  `transcript` emptied, `mark_planner_dead` no-opped,
  `assemble_kickoff_for` pinned to stage-0, `find_planner` blinded,
  `machine: true` flipped.
- **TypeScript: 27 bodies** (3 rounds, 19 mutations).
- **E2E: 4 specs** (2 rounds, 5 mutations) — the listener spec needed a
  RENDER mutation rather than a store one, because a browser has no
  `listen` to refuse and the door sets the twin directly.

**THE VACUOUS ONE, found and fixed rather than reported.** "REFUSES TO
AUTO-START over a dead channel" stayed GREEN with the guard removed: the
refused `listen` also skips the status pull, so `methodVersion` stayed
null and the auto-start's OTHER gate was doing the work. The test now
lands the status explicitly and asserts that gate is open first
(`interview-resume-dom.test.tsx:~487`); it reds correctly.

**RESTORATION PROVED BY sha256 against `git show HEAD:<path>`, not by a
clean `git status`** — all ten source files byte-identical after every
round.

### The security sweep

`EXPECTED_GRANTS` **byte-identical at `bdecad8` and HEAD: 92 grants,
identical sha256 at both refs** (6134 bytes over the whole `const …
&[…];` declaration, 6097 over the array body alone — the brief's 6135
is one of those two off by a newline; the load-bearing fact is that the
two refs MATCH, and `acl_pin.rs` itself is a 0-file diff). `acl_pin.rs`, `capabilities/` and `gen/`
are 0-file diffs. **`adapter.rs` is a 0-file diff** — no flag added, the
bypass ban untouched, the six-pattern allowlist unchanged. Child env
allowlist untouched (`env_clear()` + allowlist). **Zero new
dependencies, zero lockfile lines.** No `innerHTML` /
`dangerouslySetInnerHTML` / `eval` / `new Function` under `app/src`. **No
`writeTextFile` / `writeFile` / `mkdir` under `app/src`** (ADR-017
holds — every new write is Rust-side and inside `.nputer/`). **Exactly
one `#[ignore]`d real-CLI smoke, not run, not duplicated. No model was
called by anything.** `file(1)` over all 20 changed files: all text, none
`data`, zero C0 bytes outside tab/newline.

### What I deliberately did NOT do

- **No clipboard button on the hand-driven block.** A copy button needs a
  webview capability this app does not have, and ADR-012 says a grant is
  added by the task that genuinely needs it. The block is selectable
  text; asserted absent in the lane.
- **`docs/architecture/graph.json` NOT regenerated** — integrator's
  ritual. It WILL need regenerating: 8 `.ts/.tsx` files outside `docs/`
  moved, and `interview-model.ts` gained exported symbols.
- **`touches:` left as dispatched** (`[app-interview, app-agent]`),
  though this build also edits `app-shell` (`agent-store.ts`,
  `lib.rs`) and `tools/e2e/`. Fields lock at `status: building`
  (TASK-FORMAT § Lifecycle); a process note, not a builder error —
  the same shape T-028 hit.
- **No ADR.** The four new commands are the ADR-012 pattern already
  ruled (app-defined, zero-argument, no grant); the typed variants are
  ADR-017's existing discipline. Nothing here is a new SHAPE.
- **The @human item in the card's Verification is untouched**: one real
  hand-driven run in the fallback mode. It needs a human and, for the
  spawned half, a `claude login`.

---

### SECOND EXECUTOR, claude-opus-5 @fresh, 2026-08-18 — closing the rejection

Fresh session, briefed with the verifier's findings and nothing of the
first executor's assumptions. Built on **`307319b`** (the verifier's own
verdict commit) in `/Users/ujju/Projects/nputer-T-029`; two commits on
top, no rebase, no squash, no history rewritten. **Main was never
touched** and is still clean at `2fc3475`. The `## Verdicts` section
below is untouched: the REJECTED verdict is the record of what happened.

**Both findings closed, because they are the same defect twice.** The
verifier's evidence reproduced EXACTLY — every row, every message
string, including the control that discriminates. Nothing in s6 or s7
failed to reproduce.

**T-029-s6 (blocking).** `auth_status` was a MONOTONE LATCH: the
`Result` arm overwrote it only when the terminal line carried an
`api_error_status` of its own, so a 401 the CLI **retried and got past**
survived to the classification closure and relabelled whatever actually
killed the turn. The close is one line — **assign, never merge**
(`runner.rs:1338`), so a terminal `result` WITHOUT an `api_error_status`
CLEARS a status an earlier `api_retry` left behind. The terminal line is
the turn's own verdict.

**T-029-s7, the CONSERVATIVE arm ONLY** (`runner.rs:1483`):
`permission_denials` is a cumulative record of what was refused, not a
statement that a refusal ended the turn, so `ToolDenied` now requires
`result_is_error`. **The wider `terminal_reason`-set guard was
DELIBERATELY NOT BUILT**, and the reason is written into the code beside
the guard: the set of `terminal_reason` values a real denial produces is
exactly what **T-029-s5 records as still unverified** — the
`tool-denied` fixture's `"refusal"` is constructed, not transcribed,
because a revoked login cannot provoke a live denial — and building a
guard on an unverified set is how this card earned its rejection in the
first place. `result_is_error` is a field the CLI demonstrably sets.

Both live in the same `if exited_badly || result_is_error` block, now
**`runner.rs:1428-1491`**. The block's header comment no longer claims
the property that failed ("a transient `api_retry` the CLI recovered
from classifies nothing"); it states the rule that replaced it — each
arm binds to the turn's TERMINAL state, never to evidence the turn
walked away from.

**The whole change is 3 files, +340/-7, and TWO behavioural lines.** No
TypeScript changed: `failureAction`'s `retry: false` for `authFailed` was
never the bug — it is right for a REAL auth failure, and the bug was
that ordinary failures were being called one.

#### The six pins — four RED against the pre-fix code, two green by design

The fixture scenarios are in `fake_agent.rs`; **the control shares the
emitter** (`retry_then(…, with_retry: bool, …)`), so `enospc-no-retry`
is `retry-401-then-enospc` minus **exactly one line** by construction
rather than by two fixtures agreeing to stay in step.

| # | stream | pre-fix | post-fix |
|---|---|---|---|
| 1 | 401 · delta · `result{is_error:true, error_during_execution, "…ENOSPC…"}` · exit 1 | `AuthFailed{401, "Error: ENOSPC: no space left on device, write '/Users/x/docs/NORTH_STAR.md'"}` **RED** | `ExitNonZero{1}`, ENOSPC still in the tail |
| 2 | 401 · delta · `result{is_error:false, "Here is your first question."}` · exit 1 | `AuthFailed{401, "the agent CLI could not authenticate"}` **RED** | `ExitNonZero{1}` |
| 3 | **CONTROL** — row 1 minus the 401 line | `ExitNonZero{1}` (green) | `ExitNonZero{1}` |
| 4 | 401 · `result{is_error:true, refusal, denials:[Bash]}` · exit 1 | `AuthFailed{401, "I was not permitted to run the tools this stage needs."}` **RED** | `ToolDenied{["Bash"], Some("refusal")}` |
| 5 | **COUNTER-PIN** — 403 diagnostic, NO result line at all · exit 1 | `AuthFailed{403}` (green) | `AuthFailed{403}` |
| 6 | delta · `result{is_error:false, end_turn, denials:[WebFetch]}` · exit 1 (s7) | `ToolDenied{["WebFetch"], Some("end_turn")}` **RED** | `ExitNonZero{1}` |

Rows 3 and 5 are green on both sides **and that is their job**. Row 3 is
the discriminator: pre-fix it classified `ExitNonZero` while row 1 —
the same stream plus one line — classified `AuthFailed`, which is what
makes row 1's red mean what it says. Row 5 is the counter-pin an
over-broad fix breaks, and it is not redundant: gating the auth arm on
`result_is_error` reds row 5 while
`an_in_band_auth_failure_is_typed_authfailed_not_a_relayed_exit_code`
stays GREEN, so nothing shipped was watching that case.

**Honest limit of row 3, stated rather than discovered later.** Post-fix
the control can no longer discriminate on the retry line — flipping its
`with_retry` to `true` leaves it green, because making those two streams
indistinguishable IS the fix. Its live value is the pre-fix comparison
above plus the pin that a plain ENOSPC stream still relays the CLI's
words; it reds under a real mutation (round E below).

#### The poison sweep — 6 rounds, run INLINE, no scratch script

| round | mutation | red |
|---|---|---|
| A | both fixes reverted (the pre-fix code) | rows 1, 2, 4, 6 |
| B | the s6 assignment alone reverted | rows 1, 2, 4 |
| C | the s7 `result_is_error` guard alone dropped | row 6 |
| D | the OVER-BROAD fix — `result_is_error` required for `AuthFailed` too | row 5 |
| E | the `result` line's text no longer pushed into the ring | rows 1, 3 |
| F | the control's `with_retry` flipped ON | **nothing — expected, see above** |

B and C isolate the two fixes cleanly: neither reds the other's row.
**Restoration proved by sha256 against `git show HEAD:<path>` after
every round**, never by a clean `git status` — all three files
byte-identical each time.

#### Suites, first-hand in this worktree, never piped through `tail`

- **lib/parser** `tsc --noEmit` 0 · **225/225 (11 files)** — zero parser
  files touched.
- **app** `tsc --noEmit` 0 · build 0 · **795/795 (42 files)** — unchanged,
  and the bundle is byte-for-byte the same build: `index-Bf-QNmtC.js`
  497.86 kB / `index-CryMc_lw.css` 43.90 kB, identical hashes to the
  first build's, which is the check that no frontend file moved.
- **app/src-tauri** bare `cargo test` → **313 passed + 3 ignored, 0
  failed, ZERO warnings**. Derivation: 307 (the verified figure) **+6**,
  the six new pins, all in `agent_runner`. Breakdown
  `108/0/0/46/123/0/7/13/3/7/0/2/4/0/0` — every slot identical to the
  verifier's except `40 → 46`. Warnings re-checked with `touch` +
  `cargo check --all-targets`, not off a cached build.
- **tools/e2e** typecheck 0 · `NPUTER_E2E_PORT=15460 npm test` → **74
  passed**.
- **`npm run lint:tokens`** → clean, **116 files**; `--selftest` 49
  samples + 14 walk-policy checks green.
- **BOOT GATE (T-046 criterion 6): FIRED, RAN, GREEN, twice.** Trigger
  derived as `2fc3475..HEAD` (main-before-the-merge, per CONVENTIONS —
  never the merge-base): 12 files under `app/src/**` + `app/src-tauri/**`.
  This session's own two commits touch `app/src-tauri/**` alone, so the
  gate fires on either derivation. Scratch ports **15470** and **15471**,
  each `lsof`-checked AND bind-probed free immediately before use. Both
  `[nputer]` lines detected (`project folder:`, `window "main" created`),
  **`BOOT_EXIT=0`**. All scratch ports free afterwards, no stray
  `tauri dev` or vite from this worktree. **Port 1420 was read with
  `lsof` only — never bound, connected to, or signalled; one listener
  (the human's app, in `/Users/ujju/Projects/nputer`) throughout.**
- **NO MODEL WAS CALLED.** The one `#[ignore]`d real-CLI smoke was not
  run, not duplicated, and the diff adds and removes no `#[ignore]`.

#### Security sweep — a 3-file diff, and the three files are the point

`git diff --name-only 307319b..HEAD` is exactly `runner.rs`,
`fake_agent.rs`, `tests/agent_runner.rs`. **Zero dependency or lockfile
lines** — `package.json`, `package-lock.json`, `Cargo.toml`,
`Cargo.lock` are 0-file diffs. `adapter.rs`, `acl_pin.rs`,
`capabilities/` and `gen/` are 0-file diffs, so no bypass flag was added
and **no webview grant moved: 92 grants, `acl_pin.rs` whole-file sha256
`8d24cbad706d9e6f…`, identical at `307319b` and HEAD.** (Quoting the
whole-file hash and not an `EXPECTED_GRANTS` byte count is deliberate —
three agents produced three different figures from three different byte
ranges; the hash is the only reproducible form.) **`ENV_ALLOWLIST`
byte-identical across both refs — 422 bytes, 16 entries, sha256
`cf80f850b96a6f03…`.** No `innerHTML` / `dangerouslySetInnerHTML` /
`eval` / `new Function` and no `writeTextFile` / `writeFile` / `mkdir`
under `app/src` (nothing under `app/src` changed at all, so ADR-017
holds trivially). `file(1)` over all three changed files: text/UTF-8,
none `data`, zero C0 bytes outside tab/newline.

#### For the integrator, not defects and not mine to fix

1. **`acl_pin.rs`'s command roster still lists only T-025's four
   commands**, though T-025 and T-026 both extended it — the verifier's
   accuracy note 2, re-confirmed here as a **0-file diff**. It is a
   comment and a name-agnostic loop, not a pin: `has_app_acl == false`
   gates all app commands identically and `EXPECTED_GRANTS` is
   unchanged. Structurally harmless, outside this card's fence, and
   flagged rather than silently fixed.
2. **`docs/architecture/graph.json` NOT regenerated** — integrator's
   ritual, unchanged from the first executor's note. This session moved
   no `.ts/.tsx` file, so it adds nothing to what was already owed.
3. **The verifier's accuracy note 1 is only PARTLY closed.** The
   classification-block citation is corrected in place above, because
   this session touched that block. The others it named
   (`runner.rs:100/107/117`, `mod.rs:414/497/601/648`,
   `sessions.rs:170`) land in the doc comment above the item rather
   than on it; left alone deliberately — the substantive claims check
   out and rewriting citations this session did not touch would be
   editing another executor's record for cosmetics.

#### What I deliberately did NOT do

- **Not the wider s7 guard.** Argued above and in the code; the narrow
  arm is the whole of what T-029-s7 asks for as safe today.
- **No TypeScript change.** The affordance logic was never wrong.
- **No criteria touched, no `status` change, no
  `builder:`/`built_by:`/`verifier:`/`verified_by:` touched** — the next
  verifier restamps. `status: building` stands.
- **s1–s5 stay filed as suggestions.** Scope not widened.


## Verdicts

---

**Verifier, claude-opus-5 @fresh, 2026-08-17 — REJECTED.** Fresh
session, adversarial pass, everything below re-derived first-hand in
`/Users/ujju/Projects/nputer-T-029`. Main was never touched.

**Range derived, not accepted.** `git merge-base HEAD main` =
`bdecad8`; tip `c3f86ad`; `bdecad8..c3f86ad` = **7 commits, 26 files,
+3647/-137**. Main's `2fc3475` is a docs-only STATE correction that is
NOT on this branch, so `main..HEAD` is the same 7 commits.

**The card carries TEN criterion bullets, not eight** — five original,
two folded at the 2026-08-16 triage (T-025-s1 → the `AuthFailed`
criterion, T-026-s3 → the "exactly ONE place" criterion) and three at
the 2026-08-17 triage. Counted mechanically off the `## Acceptance
criteria` section. Nine of the ten hold under attack.

### THE BLOCKING FINDING — the auth classification masks unrelated failures

The dispatch brief named this as the sharpest risk in the card, on the
grounds that "a misclassified ordinary failure would tell a user to
`claude login` when their login is fine". **It does.** Reproduced
against the real `run_turn`, driven through
`RunnerConfig::binary_override` with a scripted CLI, with a control
that discriminates:

    init · api_retry 401 · text delta · result{is_error:true,
      terminal_reason:"error_during_execution", result:"Error: ENOSPC…"} · exit 1
    => AuthFailed { status: Some(401), message: "Error: ENOSPC: no space
                    left on device, write '/Users/x/docs/NORTH_STAR.md'" }

    CONTROL — byte-identical but with NO 401 line
    => ExitNonZero { code: Some(1), stderr_tail: "Error: ENOSPC" }

`auth_status` is a MONOTONE LATCH: the `Diagnostic` arm sets it from any
in-band `error_status`, and the `Result` arm overwrites it only when the
terminal line carries an `api_error_status` of its own, so a 401 seen
anywhere survives to the classification closure. The comment above that
closure asserts the property that fails — *"a transient `api_retry` the
CLI recovered from classifies nothing"* — which is true for a turn that
SUCCEEDS and false for the third case: a turn that survives the retry
and then dies of something else. The fixture's own transcribed line is
the CLI announcing its retry budget (`"attempt":1,"max_retries":10,
"retry_delay_ms":508`); a 401 retried ten times exists because some of
those retries succeed.

**Why this is worse than the blunt failure it replaces.** For
`authFailed`, `failureAction` returns `retry: false`, so `FailureBlock`
REMOVES the **Try again** button — the action that would have worked —
prints `claude login`, and offers the hand-driven route. The rendered
detail is the failure's own text, so the block contradicts itself:
"your CLI's login has expired" directly above "Error: ENOSPC: no space
left on device".

**And it shadows this task's own new classification.** A REAL tool
denial (`terminal_reason:"refusal"`, `permission_denials:[{tool_name:
"Bash"}]` — the exact shape `ToolDenied` was added for) behind a
transient 401 reports as `AuthFailed`. The shipped discriminating test
`a_turn_killed_by_a_denied_tool_names_the_tool_rather_than_the_exit_code`
only covers a stream with no prior 401.

**WHAT MUST CHANGE — one line, verified.** In the `Result` arm, drop the
`is_some()` guard so a terminal result line without `api_error_status`
CLEARS the stale status:

    auth_status = api_error_status;

Applied on this branch: all four masking rows then classify
`ExitNonZero` / `ToolDenied { denials: ["Bash"], terminal_reason:
Some("refusal") }`; a 403 diagnostic with no result line still
classifies `AuthFailed`; and the **entire shipped cargo suite stays
green — 307 passed, 3 ignored, 0 failed**, including
`an_in_band_auth_failure_is_typed_authfailed_not_a_relayed_exit_code`,
because the real transcribed auth failure carries `api_error_status:
401` on its own result line. A regression pin belongs with it: the
control row above is the discriminator, and no shipped test currently
puts a diagnostic 401 in front of an unrelated failure. Filed as
**T-029-s6**; the milder `permission_denials` sibling (a denial the
planner routed around, blamed for an unrelated exit) is **T-029-s7**.

### Criterion by criterion — what was verified and HOW

| # | criterion | verdict | how |
|---|---|---|---|
| 1 | resume off disk | HOLDS | mutation `resume: Some(id)` → `None` reds `an_app_restart_mid_interview_resumes_the_recorded_session_off_disk`; stage/artifacts read from `docs/`, `stageOf` untouched |
| 2 | losable transcript cache | HOLDS | `transcript()` blinded → reds `a_lost_or_corrupt_transcript_still_resumes_from_the_registry_and_docs` + the restart test |
| 3 | fresh session | HOLDS | `mark_planner_dead` no-opped → reds `a_session_that_will_not_resume_continues_as_a_fresh_one_over_the_banked_docs`; PROBE-C3 shows exactly one live entry after a cancelled fresh kickoff (S1 dead, S2 idle) |
| 4 | hand-driven MODE | HOLDS | `assemble_kickoff_for` pinned to stage-0 → reds `the_hand_driven_kickoff_materializes_a_real_kit_and_names_it` + the fresh-session test |
| 5 | cancel contract | HOLDS, attacked hard | own probes: cancel DURING RESUME kills child AND grandchild (no orphaned group — the T-046-s1 shape does not fire here), `docs/` never created, 2nd and 3rd cancel → `Idle`, registry stays 1×`idle`, reopen → `ResumeAvailable` → re-resume Started+completed; cancel before any turn and between turns → `Idle` with the latch NOT consumed; two concurrent cancels from two threads → both `Cancelled{turn:1}`, child dead, no panic |
| 6 | AuthFailed / ToolDenied | **FAILS** | see above. Detection and routing are right; the SCOPE is not |
| 7 | exactly ONE place (T-026-s3) | HOLDS, converse checked | `genesis_record` reads `load(project_dir)` and nothing else; `git grep` finds no second persisted mechanism — nothing derives eligibility from `.nputer/genesis/` presence, and the only production writes are `.nputer/sessions.json`, `.nputer/genesis/transcript.jsonl`, `.nputer/genesis/kit/**`. No production write under `docs/` (the two in `mod.rs` are past the `#[cfg(test)]` at :834). One log line prints the registry PATH on a corrupt-registry rename — transient stdout, not a persisted second copy |
| 8 | listenerFailed (T-027-s2) | HOLDS, ex-vacuous test re-proved | shape 1 confirmed: `GenesisState.listenerFailed` on the STORE (`agent-store.ts:206`), no module-private flag anywhere. Removing `if (genesis.listenerFailed) return;` now reds precisely — `expected [ 'genesis_start', …(1) ] to not include 'genesis_start'`. Latch-release and set-at-all mutations red separately |
| 9 | two typed refusals (T-039-s3) | HOLDS | reverting the init-gate envelope to `MalformedStream` reds `a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded` and `every_hostile_id_class_fails_the_turn_at_capture`; `sessionIdRejected` routed to its own affordance in `InterviewChat.tsx:139/736` |
| 10 | model read boundary (T-047-s3) | HOLDS | `an_unusable_recorded_model_renders_as_not_recorded_and_never_refuses_a_resume` green; `display_model`/`model_for_display` are the accessors, rejection logs once and renders "(model not recorded)" |

### The executor's refutation of the architect's trace — VERIFIED, and it is right

`stderr_ring` is a DIAGNOSTIC ring with three writers, not a stderr
ring. `an_in_band_auth_failure_...` asserts `stderr_tail.contains("401")`
and the pre-fix behaviour was a relayed one-line blob, not an empty
detail. The executor was correct to refuse to build on the card's
steps 2–4.

### Attacks that HELD

- **`permission_denials` wrong-shape (the s5 guess).** camelCase
  `toolName`, `tool_name` of type 42/null/array, an object instead of an
  array — **every one degrades to `ExitNonZero`, never to a wrong
  diagnosis**, exactly as claimed. Bounds are real: 40 denials → 16 kept
  (`MAX_DENIALS`); a 500-byte name → 128 bytes; a blank name filtered;
  `tool` alias read; extra fields ignored; an escaped ESC survives as
  the literal `\u{1b}`, control-stripped. The one gap is presence-vs-cause
  (T-029-s7), not shape.
- **Four new IPC commands.** 13 registered in `invoke_handler!`, 13
  `#[tauri::command]`. Counted from the other side: 10 literal
  `invoke("…")` call sites in `app/src` plus 3 through the `runPicker(name)`
  indirection = 13. **The two agree.** All four new commands are
  ZERO-ARGUMENT — `tauri::State` extractors only, no path, no session id,
  no flag crosses the boundary in either direction.
- **`genesis_fresh` as `genesis_start` with a flag — judged
  independently, and the executor is right.** A flag would move a
  DESTRUCTIVE selector (mark the user's live session dead) across the IPC
  boundary, which is precisely what ADR-012's "narrowness lives in the app
  commands' own signatures (zero-argument where possible)" exists to
  prevent. The two also have opposite preconditions: `genesis_start` must
  never destroy state and returns `ResumeAvailable` instead.
- **No ADR needed.** ADR-012's own Consequences section anticipates F-03
  genesis panes adding app commands and says the justification goes in the
  TASK FILE and is swept by the verifier — an ADR is for a new SHAPE (a
  first grant, a first path-taking command). None of the four is one.

### Numbers re-derived first-hand, never piped through `tail`

- **lib/parser 225/225 (11 files)**, `tsc --noEmit` 0.
- **app 795/795 (42 files)**, `tsc --noEmit` 0.
- **cargo bare `cargo test` → 307 passed · 0 failed · 3 ignored**,
  breakdown `108/0/0/40/123/0/7/13/3/7/0/2/4/0/0`, **zero warnings**
  (re-checked with `touch` + `cargo check --all-targets`, not off a
  cached build). Every executor figure matches exactly.
- **tools/e2e `NPUTER_E2E_PORT=15440 npm test` → 74 passed.**
- **`npm run lint:tokens` → clean, 116 files**; `--selftest` 49 samples +
  14 walk-policy checks green.
- **BOOT GATE: FIRED, RAN, GREEN.** Scratch port **15450**, bind-probed
  free immediately before use. Both `[nputer]` lines detected
  (`project folder:`, `window "main" created`), **exit 0**. No stray
  `tauri dev`/vite afterwards; 15440/15450/15451 all free. **Port 1420
  was read with `lsof` only — never bound, connected to, or signalled;
  no listener throughout.**
- **NO MODEL WAS CALLED.** The `#[ignore]`d smoke was never run.

### The poison sweep, re-derived independently

**17 mutations, 17 RED, zero vacuous**, run INLINE (no scratch script).
Rust: auth classification disabled · tool-denial disabled ·
`exited_badly` dropped so classification no longer precedes the exit
code · denial-object form ignored · `RejectedSessionId` reverted ·
`resume: None` · `mark_planner_dead` no-opped · `transcript()` blinded ·
`assemble_kickoff_for` pinned to stage-0. TypeScript: auto-start guard
removed · `machine` flag ignored · rehydration dropped · `retry: false`
→ `true` · latch never released · `listenerFailed` never set ·
`failureDetail` stops carrying the auth message. **Restoration proved by
sha256 against `git show HEAD:<path>` after every single round** — never
by a clean `git status`.

### Security sweep — clean

Zero dependency or lockfile changes (`package-lock.json`, `Cargo.lock`,
`package.json`, `Cargo.toml`: 0-file diff). No `innerHTML` /
`dangerouslySetInnerHTML` / `eval` / `new Function` under `app/src`. No
`writeTextFile` / `writeFile` / `mkdir` under `app/src` (ADR-017 holds).
No shell strings — argv-as-data throughout. **`adapter.rs`,
`acl_pin.rs`, `capabilities/` and `gen/` are all 0-file diffs**, so no
bypass flag was added and no webview grant moved. **`ENV_ALLOWLIST`
byte-identical across the two refs — 422 bytes, 16 entries, sha256
`02d2f26f608416fc…`** — so no API key or token path to a spawned child
was opened. **Exactly one `#[ignore]`d real-CLI smoke
(`agent_runner.rs:1635`), not run, not duplicated** — the diff
adds and removes no `#[ignore]` at all; the other two ignores are the
pre-existing `nputer-index` perf and self-graph harnesses. `file(1)`
over all 26 changed files: text/UTF-8, none `data`, and a byte scan
finds zero C0 controls outside tab/newline.

### `EXPECTED_GRANTS` — the folklore number, settled

Measured at both refs, and **the load-bearing fact holds: byte-identical,
92 grants, sha256 of the declaration equal at `bdecad8` and `c3f86ad`
(`7b3d8e1a0705892f…`), with `acl_pin.rs` a 0-file diff.** The convention,
stated precisely so this stops drifting:

| measurement | bytes |
|---|---|
| `const EXPECTED_GRANTS: &[&str] = &[ … ];` — the whole declaration | **6134** |
| …the same, plus the newline that terminates the `];` line | **6135** |
| `&[ … ]` / `[ … ]` | 6110 / 6109 |
| between the brackets, exclusive | 6107 |
| array lines only, trailing newline dropped | 6106 |

**So both circulating figures are real and neither is wrong — 6134 is
the declaration, 6135 is the declaration including its terminating
newline.** The executor's 6134 for the whole declaration reproduces
exactly. Its **6097 for "the array body" does NOT reproduce** under any
convention tried (the body measures 6106–6107; there are no comment
lines inside the array to explain a 10-byte gap). **Recommended
canonical form: quote `92 grants, sha256 identical at both refs` and
stop quoting a byte count at all** — the count is what turned into
folklore; the hash is what carries the meaning.

### Two accuracy notes for the integrator, not defects

1. **The implementation notes' line citations drift.** The typed
   classification is at `runner.rs:1418-1456`, not the cited
   `1338-1372`; several others (`runner.rs:100/107/117`,
   `mod.rs:414/497/601/648`, `sessions.rs:170`) land in the doc comment
   above the item rather than on it. The substantive claims all check
   out — only the coordinates are stale.
2. **`acl_pin.rs`'s command roster still lists only T-025's four.** The
   four new commands are absent from both the remote-denial loop and
   `t025_genesis_commands_are_locally_invokable_and_remotely_denied`.
   Not a hole — the ACL decision is name-agnostic and structural
   (`has_app_acl == false` gates all app commands identically, and
   `EXPECTED_GRANTS` is unchanged), and the file's own comment says the
   loop proves nothing per-name. But T-025 and T-026 both extended the
   roster, and the pattern lapsed here.

### Verdict

**REJECTED**, narrowly and with one required change: bind the auth
classification to the terminal result line so a recovered `api_retry`
401 cannot latch (T-029-s6's one-liner), and add the discriminating
regression pin. Everything else in this card — nine of ten criteria,
every suite, the whole security sweep, the cancel contract under five
distinct attacks, and the `permission_denials` degradation the executor
asked to be attacked on — stands up. T-029-s7 is a follow-up, not a
blocker.

---

**Verifier, claude-opus-5 @fresh, 2026-08-18 — RE-VERIFICATION after the
rejection.** Fresh session, adversarial, everything below re-derived
first-hand in `/Users/ujju/Projects/nputer-T-029`. **Main was never
touched**; port 1420 was read with `lsof` only. The REJECTED verdict
above is untouched — it is the record.

**Range derived, not accepted.** `git merge-base HEAD main` =
`bdecad8`; tip `4540821`. **`bdecad8..4540821` = 12 commits**, of which
the fix under review is the last two (`5379752`, `4540821`) on top of
the rejection commit `307319b`. Main has moved `2fc3475 → 4e4d900`
since the second executor wrote its notes; the delta is `docs/STATE.md`
ALONE (`git diff --name-status 2fc3475..4e4d900`), it is not on this
branch, and the merge-base is unchanged. **Ten criterion bullets**,
counted mechanically off `## Acceptance criteria` (`awk` section slice,
`grep -c '^- '` = 10).

### CARD INTEGRITY — the check nobody would think to run

Both claims verified **by hash**, not by reading:

    ## Verdicts           236 lines  sha256 1d180a1898e32830…
    ## Acceptance criteria  99 lines  sha256 149083f2a5edb28b…

identical at `307319b`, `5379752` AND `4540821`. **The record of the
rejection was not softened, shortened, or edited in any byte.** The
card's only change is +185/-2, all of it new second-executor notes plus
one corrected citation. No criterion moved. `status: building` stands;
no stamp fields were touched by the executor.

### THE FIX REDS AND GREENS AS CLAIMED — six rounds, re-run, not accepted

Run in this worktree by mutating the tree in place and restoring with
`git checkout` + **sha256 proof** after every round (all three files
byte-identical to `4540821` at the end: `a043f954…`, `e2442af8…`,
`cac9deda…`).

| round | mutation | reds I measured | claimed |
|---|---|---|---|
| A | `runner.rs` taken straight from `307319b` (the true pre-fix code) | rows 1, 2, 4, 6 — **4 failed / 42 passed** | 4 |
| B | s6 assignment alone reverted to the `is_some()` latch | rows 1, 2, 4 — **3 failed** | same |
| C | s7 `result_is_error` guard alone dropped | row 6 — **1 failed** | same |
| D | the OVER-BROAD fix: `result_is_error &&` added to the AuthFailed arm | **row 5 ONLY — 1 failed / 45 passed** | same |
| E | the `result` line's text no longer pushed into the ring | rows 1 **and 3 (the control)** — **2 failed** | same |

**Round D is the one that justifies the counter-pin, and it holds.**
Under the over-broad fix `a_diagnostic_auth_failure_with_no_result_line_at_all_is_still_authfailed`
is the *only* red in the whole 46-test binary — the shipped
`an_in_band_auth_failure_is_typed_authfailed_not_a_relayed_exit_code`
stays GREEN. Nothing that shipped was watching that case, so the
counter-pin is load-bearing rather than decorative.

**Round E settles the question the executor raised against itself.**
Row 3 (the control) is green either way post-fix — but it is NOT a test
that cannot fail: dropping the result-line relay reds it. The executor
disclosed this limit rather than being caught at it, and the disclosure
is accurate. B and C isolate the two fixes cleanly: neither reds the
other's row.

### THE NUMBERS — re-derived, none accepted

- **cargo**, bare `cargo test` in `app/src-tauri`: **313 passed / 0
  failed / 3 ignored**, summed by `awk` over the 15 `test result:`
  lines. Per-binary **`108/0/0/46/123/0/7/13/3/7/0/2/4/0/0`** — every
  slot identical to the rejection's except `40 → 46`, exactly the six
  new pins. **Zero warnings**: the single `-i warning` hit in the whole
  log is a test *name*
  (`warnings_and_unknown_event_types_do_not_fail_the_turn`), and
  `touch src/lib.rs src/agent/runner.rs && cargo check --all-targets`
  recompiled clean with no diagnostic line at all.
- **Exactly three `#[ignore]` attributes repo-wide**, the same three
  files and the same three at `307319b` (`perf.rs:53`,
  `self_graph.rs:58`, `agent_runner.rs:1802` / `:1635` pre-fix — the
  line moved because tests were inserted above it, the attribute did
  not). None added, none removed. **The real-CLI smoke was not run and
  no model was called.**

### SECURITY SWEEP — clean

- **Zero dependency/lockfile lines**: `git diff --name-only
  307319b..4540821 -- '*package.json' '*package-lock.json'
  '*Cargo.toml' '*Cargo.lock'` is EMPTY.
- `adapter.rs`, `acl_pin.rs`, `capabilities/`, `gen/` — **0-file
  diffs**. `acl_pin.rs` whole-file **sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`
  identical at `bdecad8`, `307319b`, `5379752` and `4540821`** — so the
  grant set cannot have moved. **92 grants** (counted off
  `EXPECTED_GRANTS`); per the standing instruction no byte count is
  quoted, the whole-file hash is the reproducible form.
- `ENV_ALLOWLIST` **sha256
  `cf80f850b96a6f03661c2f0871a54b5199ab82eeefb39da29e76c13ef1e7245e`
  identical at both refs**, **16 entries** listed out. (My extraction
  measures the block at 423 bytes where the notes say 422 — a
  one-byte range boundary, and precisely why the hash is the form to
  quote.)
- **No `innerHTML` / `dangerouslySetInnerHTML` / `eval` / `new
  Function` and no shell string added anywhere in the diff** — grep for
  added lines matching `Command::new|/bin/sh|sh -c|eval\(` over
  `307319b..4540821` returns nothing. The three pre-existing `/bin/sh`
  hits are a test fixture, a comment, and an assertion that the source
  does NOT contain `Command::new("/bin/sh")`.
- **ADR-017 holds trivially**: `git diff --name-only 307319b..4540821 --
  app/src` is EMPTY — nothing under `app/src` changed at all.
- `file(1)` over the three changed code files: all **Unicode text,
  UTF-8**, none `data`.

### THE TWO FINDINGS — closed, and the closes judged rather than accepted

**T-029-s6 — CLOSED.** The one line does what the finding asked, and I
attacked it as an over-correction rather than reading it. Every stream I
could think of that the NEW behaviour might get wrong, driven through
the real `run_turn`:

| stream | post-fix |
|---|---|
| `result` line arrives TWICE, 401 on the first, none on the second | `ExitNonZero{1}` — tail keeps the auth sentence |
| `api_retry` 401 · `result{is_error:true, api_error_status:429}` | `ExitNonZero{1}` — 429 is not an auth code, correctly not guessed |
| `api_retry` 401 · delta · exit 1, **NO result line** | `AuthFailed{401}` — the counter-pin's rule, filed as **s9 edge 1** |
| auth status ONLY in the diagnostic, `result` line without it | `ExitNonZero{1}` — filed as **s9 edge 2**, measured against `307319b` too |
| **the TRANSCRIBED `auth-error` scenario** | **`AuthFailed{401, "…401 OAuth access token has been revoked."}`** |

The last row is the one that matters: **the real 2.1.226 shape is
untouched**, at both refs. The flagship affordance still fires on the
failure it exists for. Two edges are real and I filed them (s9); neither
is a regression against main and both degrade in the safe direction —
one is pre-existing and unreached, the other trades a true positive for
the pre-T-029 relayed blob, with the 401 still legible in the tail and
Try again restored. **Losing a diagnosis to a blob is strictly better
than the false positive it replaced**, which took the retry away from a
user whose login was fine.

**T-029-s7 — CLOSED, narrow arm, and the trade is right.** The
reasoning holds on its own terms: `result_is_error` is a field the CLI
demonstrably sets, the wider `terminal_reason` guard needs the set
T-029-s5 records as unverified, and building on a guessed vocabulary is
what earned the rejection. **Refusing to build the wider guard was the
correct call and it is disclosed in the code, not only in the notes** —
fourteen lines at `runner.rs:1461-1480`, sitting on the guard itself,
where the next reader meets it before they meet the narrowness. That is
the right place; the disclosure obligation is met.

The accepted blind spot is real and I measured what it actually costs:
`ExitNonZero { code: Some(1), stderr_tail: "" }` — **empty**, because
the ring push is gated on `is_error`. So "a relayed exit code keeps Try
again" is half true: Try again is kept, nothing is relayed. **Filed as
s8** with a close that needs no unverified vocabulary. Not blocking — an
honest bare exit code beats a confident false cause.

### THE JUDGEMENT ON ROW 3 — the pin the executor flagged against itself

**It is still earning its place, and the executor's reasoning is
sound.** Post-fix row 3 cannot discriminate on the retry line, and the
executor is right that this is not a defect but the fix's definition:
rows 1 and 3 becoming indistinguishable IS what "the terminal line is
the verdict" means. Disclosing that rather than being caught at it is
the correct behaviour, and **the claim that it reds under a different
mutation is TRUE — I ran it.** Round E (result-line text no longer
pushed into the ring) reds rows 1 AND 3, and the shipped auth test stays
green through it, so row 3 is watching something nothing else watches.
It is a relay pin, not a classification pin, and it is not vacuous. This
is not the "test that cannot fail" defect this project caught six times.

### THE NINE CRITERIA THAT HELD — re-driven, not taken on the record

- **CANCEL CONTRACT.** Re-driven under two attacks no shipped pin
  covers. Cancel DURING A RESUMED turn (turn 2, `hang` scenario after a
  completed turn 1): `Cancelled { turn: 2 }`, **child AND grandchild
  both dead**, `docs/` never created, **zero `Failed` events**, and the
  project reopens `ResumeAvailable { native_session_id:
  "fake-session-0001", turns: 1 }`. **Double cancel while the turn is
  still live**: both calls return `Cancelled { turn: 2 }` — idempotent,
  no panic, no double-kill — and a third after settle returns `Idle`.
  The shipped grandchild pin (`agent_runner.rs:414`) proves the signal
  reaches the GROUP.
- **`permission_denials` malformed shapes.** Thirteen shapes driven
  through the real classifier. Every unrecognised shape degrades to
  `ExitNonZero`, **never to a wrong `ToolDenied`**: non-array (string,
  object), arrays of numbers, of nulls, of nested arrays, objects
  without `tool_name`, and whitespace-only names all fall through. The
  recognised ones are bounded exactly as documented — a 400-byte name
  truncates to **128**, 40 entries cap at **16**, and a name carrying
  `ESC[31m`, `\n` and `BEL` renders **escaped** (`Ba\u{1b}[31msh\nEVIL\u{7}`),
  so no terminal-control sequence reaches a log or the UI. Unaffected by
  the s7 guard, which sits after the shape parse.
- **"Exactly ONE place".** `the_fact_that_an_interview_ran_here_lives_in_exactly_one_file`
  is a real discriminator, not an existence check: it deletes
  `.nputer/sessions.json` and asserts the fact is GONE while
  `docs/NORTH_STAR.md` still stands — which only passes if no second
  copy exists — and separately asserts nothing under `docs/` carries the
  registry id or the native id.
- **`listenerFailed` store-owned, and its test still discriminates.**
  Shape 1, correctly: the field is declared on `GenesisState`
  (`agent-store.ts:206`), written by `startGenesisListener`'s catch
  (`:423`) and released on a successful retry (`:426`); the
  `interview-source.ts:143` setter is the DEV-only browser twin writing
  **the same shipped field**, not a module-private flag. **Proved
  non-vacuous by poisoning it**: dropping `listenerFailed: true` from
  the catch reds all THREE tests, including the one whose comment
  records an earlier vacuous green — and it reds for the meaningful
  reason (`expected [ 'genesis_start', …(1) ] to not include
  'genesis_start'`: it really would spawn a planner over a dead
  channel).

### THE REMAINING NUMBERS — all re-derived first-hand

- **app**: `tsc --noEmit` 0 · **795 passed (795), 42 files**.
- **lib/parser**: `tsc --noEmit` 0 · **225 passed (225), 11 files**.
- **tools/e2e**: `NPUTER_E2E_PORT=15480 npm test` → **74 passed
  (14.8s)**, "Running 74 tests using 1 worker".
- **lint:tokens**: `lint-tokens: clean (116 files scanned under
  app/src, app/test, tools/e2e)`.
- **BUNDLE HASHES REPRODUCE EXACTLY** — my own `npm run build` emits
  `dist/assets/index-Bf-QNmtC.js` **497.86 kB** and
  `dist/assets/index-CryMc_lw.css` **43.90 kB**, the same content-hashed
  names the executor recorded. Vite hashes filenames by content, so
  identical names mean a byte-identical bundle, independently
  corroborating the empty `app/src` diff. **The fix is Rust-only.**
- **BOOT GATE: FIRED, RAN, GREEN.** The diff touches
  `app/src-tauri/**`, so the gate applies. `NPUTER_BOOT_PORT=15490 npm
  run boot:check` (15490 bind-probed free first): both startup lines
  detected — `[nputer] project folder:
  /Users/ujju/Projects/nputer-T-029` and `[nputer] window "main"
  created` — tree stopped on SIGTERM, **exit 0**. Scratch ports 15480
  and 15490 free afterwards, zero stray `tauri dev` from this worktree.
  **Port 1420 was read with `lsof` only, never bound, connected to or
  signalled — one listener (the human's app, pid 82549) throughout.**
- **NO MODEL WAS CALLED.** Every drill ran against
  `CARGO_BIN_EXE_fake_agent`; the `#[ignore]`d smoke was never run.

### Two new findings, and one correction to the record

**T-029-s8** — the declined s7 diagnosis relays nothing
(`stderr_tail: ""`), so the screen reads "the planner exited with code
1" with no detail; close is one `push`, no unverified vocabulary.
**T-029-s9** — the terminal-line rule's two measured edges, one
pre-existing false positive and one new-but-safe false negative; the ask
is one sentence of disclosure, not a change. Neither blocks.

**One correction, offered as fact not fault**: the second executor's
notes say main "is still clean at `2fc3475`". Main has since moved to
`4e4d900`; the delta is `docs/STATE.md` alone and is not on this branch,
so nothing downstream changes. Its `ENV_ALLOWLIST` figure of 422 bytes
measures 423 by my extraction — a range-boundary byte, and exactly why
the standing instruction says to quote the hash.

### Verdict

**APPROVED.** Both findings are genuinely closed, by the closes their
findings specified, with the reasoning stated where the next reader
meets it. The nine criteria that held were re-driven rather than
inherited, and all nine still hold — the cancel contract survives two
attacks no shipped pin covers, the denial parser degrades under thirteen
malformed shapes, the one-place fact has one place, and the
`listenerFailed` pins red when poisoned. The fix is three files and two
behavioural lines; the bundle is byte-identical, so nothing moved that
was not meant to. **The record of the rejection is intact to the byte,
proven by hash at three refs** — the check that mattered most here, and
it is clean.

Six poison rounds re-run and all six reproduce, including the two the
executor flagged against itself: the counter-pin genuinely reds under an
over-broad fix while nothing shipped notices, and the control genuinely
reds under a real mutation. Neither is a test that cannot fail.

`status: building` stands; the @human hand-driven run is still owed.
