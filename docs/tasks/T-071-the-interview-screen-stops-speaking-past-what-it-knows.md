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

## Implementation notes

## Verdicts
