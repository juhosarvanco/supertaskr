---
id: T-029
title: Genesis resume + hand-driven fallback — restart-proof, CLI-optional
feature: F-03
milestone: 3
priority: 7
size: M
status: building
blocked_by: [T-027]
touches: [app-interview, app-agent]
builder: claude-opus-5 @fresh
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review:
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
(`runner.rs:1338-1372`) because exit 1 means a dozen things and the
stream says which. Routed: `failureHeadline`/`failureAction`
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


## Verdicts
