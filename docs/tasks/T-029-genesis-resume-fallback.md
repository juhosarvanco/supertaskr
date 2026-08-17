---
id: T-029
title: Genesis resume + hand-driven fallback — restart-proof, CLI-optional
feature: F-03
milestone: 3
priority: 7
size: M
status: planned
blocked_by: [T-027]
touches: [app-interview, app-agent]
builder:
verifier:
built_by:
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

## Verdicts
