---
id: T-071
title: The interview screen stops speaking past what it knows — one clock, one outcome, one way out
feature: F-03
milestone: 3
priority: 14
size: M
status: planned
blocked_by: []
touches: [app-interview, app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-107-s1 (2026-09-13, pile 2 batch 2, the owner's approval of 2026-09-13). The sibling's file is removed in the same commit as this line; its obligation sits below tagged with its source, and its full text is kept under the absorbed heading.

Absorbs (seventh triage, 2026-08-24): T-064-s2 — files removed in this commit.

Absorbs: T-028-s1, T-028-s3, T-029-s4 (fourth triage, 2026-08-19). The
suggestion files are removed in the same commit as this card.

THREE FACTS THE SCREEN ASSEMBLES FROM SOURCES THAT DISAGREE OR EXPIRE,
and in each case the screen speaks as if it did not.

THE CLOCK. `startGenesisClock` in `app/src/genesis/interview-source.ts`
keeps the origin at module level, keyed by project dir. A remount keeps
it (the state is in the module, not a ref) and a switch to a different
genesis project re-bases, both correct — but an APP RESTART re-bases to
zero, so a genesis resumed the next morning reads the time since the app
was reopened. NORTH_STAR's success criterion 2 is the TIMED one, "idea
to dispatchable milestone-1 board in under 30 minutes, the magic moment,
timed", and this screen's completion state is where that number is read
off. A clock that silently restarts under-reports on exactly the runs
most likely to be long: the ones where the user closed the app and came
back.

THE EXIT. T-028's lens-to-board switch is pure file evidence, so it
fires identically whether the writer is a spawned planner or a human
hand-driving the method in a terminal — ADR-006's mode, and the property
T-027 celebrated. But the completion state's first condition is
`turns.length === 0` yielding `blocker: "noTurns"`, and a hand-driven
genesis has no turns because nothing emitted on `genesis-turn`. So that
user watches the cards rain into the right half, correctly and live, and
then never sees "The board is ready" and never gets the one CTA that
lands them in the board pane. Their only way out is the folder picker,
which re-opens the project they are already in.

THE OUTCOME. The same typed outcome is stored twice —
`InterviewUiState.notice` and `GenesisState.lastOutcome` — and
`InterviewChat` reads `ui.notice ?? genesis.lastOutcome`, deriving the
resume offer, the unusable-session block and the generic notice from
that one expression. The precedence is documented at the call site and
the reason is real: the module value is the live answer to a call this
screen just made, the store value is the durable one that survives a
remount, and reading only one loses a case. **It was found by the E2E
lane, not by reasoning** — the served bundle's harness pushes outcomes
through the STORE, so a resume offer driven only by `ui.notice` rendered
nothing there. That is the store/UI split-brain T-027 section 1 argued
against, currently resolved by a precedence rule rather than by there
being one value.

## Acceptance criteria
- THE elapsed label SHALL NOT claim more than its origin knows. The
  cheapest honest arm is the label itself — it is a tilde already, and
  naming the span it measures costs one string and stops the number
  claiming more than it has. THE DURABLE ARM (a first-event stamp beside
  `lastEventAtMs` and `turn` on `GenesisStatus`) is a field on C-14's
  Rust payload and **WIDENS THIS CARD'S FENCE TO `app-agent`**; IF taken,
  that SHALL be recorded with its reasoning BEFORE implementation, and
  the card's `touches` SHALL be updated before dispatch rather than
  during the build.
- THE genesis screen SHALL have a way out that does not require a
  completion signal. `openBoardFromGenesis` is already a pure, IPC-free
  phase move, so a quiet header control costs one button and serves BOTH
  modes.
- THE TURN REQUIREMENT ON THE COMPLETION STATE SHALL NOT BE DROPPED. It
  is the only evidence the app has that a conversation happened here at
  all; without it, opening a genesis on a folder somebody already
  planned is greeted with "The board is ready" before a single question
  has been asked. Removing it trades a missing celebration for a false
  one, which is the wrong direction and is the criterion's own words —
  an empty board must never be celebrated. A pin SHALL hold that
  direction.
- THE OUTCOME SHALL HAVE ONE WRITER. Either `reduceGenesisOutcome`
  becomes it and `interview-source` reads it, or the notice leaves the
  store — the second is probably wrong, since durability across a
  remount is the property T-029 spent its length adding. BOTH existing
  paths SHALL keep their pins: the module path and the store path, the
  latter because the E2E lane drives outcomes through the store and is
  the only place the split-brain was visible.

Verification: headless — app Vitest for the three mechanisms, one lane
spec for the store-driven resume offer and one for the exit control. The
elapsed label is display-only; no telemetry (NORTH_STAR non-goal).
- WHEN the notice explains an unsupported CLI THE ruling of 2026-08-29 SHALL be recorded beside `noticeRoutesToHandDriven` in app/src/genesis/interview-model.ts: the notice transcribes no hardcoded minimum or version floor (T-107 criterion 3), the `min_major` payload field is NOT added, and the observed CLI version the notice already prints (`outcome.found`) stays; a body pins the absence of a copied floor while keeping the observed version. The current no-floor display decision is recorded here under the triage of 2026-08-29. Reconsideration is triggered when a second adapter with a different minimum version arrives; any later displayed floor must come from the adapter's authority. Recording this decision fulfils the source's separate documentation action and does not authorize adding the payload field in this lane. (absorbed from T-107-s1)

## Absorbed from T-107-s1 — The adapter's minimum version reaches the frontend through nothing, so the notice can refuse to transcribe it and cannot name it either (kept whole)

Title as filed: "The adapter's minimum version reaches the frontend through nothing, so the notice can refuse to transcribe it and cannot name it either"

Filed as: status parked, priority None, size None, touches None, wake None, suggested_by executor claude-opus-5 @T-107.

**T-107's criterion 3 says `CLAUDE_V1.min_major` is the authority and a
notice hard-coding "2" is a second implementation (T-057). It is right,
and the honest consequence is that the notice can currently name NOTHING
— because the authority reaches this side through no channel at all.**

Derived at `c4c15c8`, from both ends:

- `app/src-tauri/src/agent/adapter.rs` — `AgentAdapter::min_major`, and
  `CLAUDE_V1.min_major = 2`. Read by `runner.rs`'s `finish`, which
  compares it against `parse_major(<the --version line>)` and returns
  `ResolveError::Unsupported { found }` on a miss.
- `StartOutcome::UnsupportedVersion { found: String }` in
  `app/src-tauri/src/agent/mod.rs` carries **the version line and nothing
  else** — no floor, no resolved path, no manager, no channel.
- Frontend side: `grep -rn "minMajor\|min_major" app/src/` returns
  **zero** rows outside unrelated CSS-ish `min-` identifiers, and
  `GenesisStatusPayload` carries `cliVersion` and no floor.

**SO T-107 SHIPPED THE ONLY HONEST SENTENCE AVAILABLE** — "older than
this app can drive" — which is exactly what this side can derive from
the type, and it deliberately does not say "2". **THE CARD'S OWN
SUGGESTED SHAPE-2 WORDING CANNOT BE TAKEN AS WRITTEN**: it reads *"nputer
needs claude 2 or newer; update it however you installed it"*, and that
first clause is precisely the transcription its own criterion 3 forbids.
That contradiction is recorded on the card's implementation notes and is
the reason this finding exists rather than a wording preference.

### The fix, and it is small (T-107-s1)

Add the floor to the payload where the refusal is already produced:

    UnsupportedVersion { found: String, min_major: u32 }

`mod.rs` has three construction sites (all `return
StartOutcome::UnsupportedVersion { found }` on the `ResolveError::
Unsupported` arm of `resolve_cli`), and each already has `adapter` in
scope — `let adapter = planner_adapter();` sits directly above every one
of them — so the value is one field, not a plumbing exercise. The mirror
in `app/src/lib/agent-store.ts` gains `minMajor: number` (serde is
`rename_all_fields = "camelCase"` on that enum, so the wire name is
free), and `tools/e2e/tests/shell-harness.ts` carries the same mirror.

Then the notice can say the floor from its authority, and a future
adapter with a different floor moves the sentence without anybody
editing it.

### Why T-107 did not build it (T-107-s1)

`app/src-tauri/**` is C-14 `app-agent`, outside T-107's `[app-interview]`
fence and held by a live lane (T-102) at that dispatch. The mirror in
`agent-store.ts` is C-05 `app-shell`, also outside it, and the e2e mirror
is `[tools/e2e]`, held by T-091. **Three fences for one field**, which is
worth stating because it is the reason a one-word improvement to a
sentence is a card rather than an edit.

### The one thing to decide first (T-107-s1)

**Whether the notice should name a number at all.** T-107 argues in the
renderer that it should not need to: the user's actionable instruction is
"update to the current release", which is right under any floor, and a
major-version integer on a user-facing screen is a fact about nputer's
internals rather than about the user's machine. If that reading wins,
this finding is closed by ruling rather than by code — and the ruling
should be written beside `noticeRoutesToHandDriven` in
`app/src/genesis/interview-model.ts`, which is where the refusal to
transcribe is already recorded.

Amnesty triage 2026-08-29 (triage seat): PARKED — TRIAGE TAKES THE RULING THE CARD ASKED FOR: the notice names no number. T-107's shipped sentence — "older than this app can drive" — is the honest one, criterion 3 forbids the transcription, and a major-version integer on a user-facing screen is a fact about nputer's internals rather than about the user's machine. The plumbing this card designs (min_major on the payload, one field at three construction sites) is correct and is not owed until the ruling changes. RESURFACES: the arrival of a SECOND adapter with a different min_major, at which point the floor must reach the frontend from its authority rather than from a sentence; or the next app-agent dispatch, if the ruling above is to be written down beside noticeRoutesToHandDriven where the refusal to transcribe already lives.

## Implementation notes

## Verdicts
