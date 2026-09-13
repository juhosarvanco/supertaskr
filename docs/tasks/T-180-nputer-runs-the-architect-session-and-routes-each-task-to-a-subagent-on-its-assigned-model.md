---
id: T-180
title: Nothing makes the model assignment TRUE — nputer passes no `--model` to any CLI, so D5 is enforced by whoever happens to be dispatching by hand; @human's direction is that nputer runs the architect session and routes each task to a subagent on its assigned model
feature: F-05
milestone: 4
priority: 1
size: L
status: parked
blocked_by: []
touches: [app-agent, app-dispatch]
suggested_by: "@human, 2026-08-30, in session — raised while ruling T-169-s2"
builder:
verifier:
built_by:
verified_by:
review:
---

**@human's question and direction, near-verbatim (2026-08-30):** *"Is
the decision of the model honored by Claude and Codex? We hit the
question again of should the process be run from claude or codex or from
the nputer app. If ran from nputer, then nputer should run the architect
session and know how to route the tasks to subagent sessions with
correct model."*

**THE ANSWER TO THE QUESTION IS NO, AND THAT IS WHY THIS CARD EXISTS.**

## What is true today, derived at `2489b0f`

**D5 IS RULED AND BINDING** (`docs/rooms/cockpit-or-mirror.md`, @human,
2026-08-30): *"Of course the models the human assigns to different tasks
do those tasks as assigned."* The ruling names two mechanics — every
adapter ENFORCES the assignment where its CLI can be told, and where a
spawn path cannot force it, nputer VERIFIES instead and flags any
mismatch on the board.

**The verifying half exists. The enforcing half does not.**

- `app/src-tauri/src/agent/adapter.rs:126` states it as a property:
  *"`--model` — the user's CLI default IS the model (ADR-003); the init
  line reports it"*, and `:763` repeats *"we never pass `--model`"*. The
  only occurrence of the string in that file is in the list of CLI flag
  NAMES the argv rule refuses in a value position — it is never emitted.
- So the genesis planner runs on **whatever the installed CLI defaults
  to**. At @human's walk that happened to be `claude-opus-5[1m]`, read
  off the init line rather than requested.
- `tools/e2e/tests/session-economics.spec.ts` states the same from the
  other side: *"the recommendation names a seat strength and never a
  model, because this project passes no `--model`"*.
- And for executor/verifier work there is no spawn path AT ALL — F-04
  deliberately spawns nothing. **Today the assignment is honoured by
  whichever session is dispatching by hand**, reading `builder:` off the
  card and setting the model on the subagent it launches. That worked on
  2026-08-30; it is a discipline, not a property, and it is exactly the
  class of thing this project converts into a mechanism.

**So a card can name a model nothing will ever read.** `T-169`'s flag
catches a mismatch AFTER the fact, which is the right backstop and is
not the same as the assignment being true.

## What this card decides — and the first question is @human's own

1. **WHERE THE LOOP RUNS.** @human's sentence reopens it deliberately:
   Claude Code, Codex, or the nputer app. The direction stated is
   nputer — nputer runs the architect session and routes tasks to
   subagent sessions. **This is a product-shape decision, not a lane's**,
   and it reaches ADR-008 (app-first) and the F-05 ordering ruled in
   `docs/rooms/cockpit-or-mirror.md` (follower-first: the in-app
   orchestrator conversation comes AFTER F-04's spawn path). A lane may
   not quietly re-order that.
2. **PER-ADAPTER ENFORCEMENT.** D5 says "where its CLI can be told".
   Derive per adapter at the lane's own ref whether it can: the claude
   adapter's `--model` is a real flag (it is in the refused-in-value-
   position list, which proves the CLI parses it), and the codex
   adapter's equivalent is UNMEASURED here and must be measured rather
   than assumed.
3. **AND ADR-003 IS THE THING THAT HAS TO MOVE, WHICH IS WHY THIS IS NOT
   A SMALL CARD.** *"The user's CLI default IS the model"* is a decision
   with a reason — it keeps nputer out of the business of knowing model
   names, and it is why no model string reaches argv today. Passing
   `--model` reverses it. **The reversal is @human's to ratify**, and
   this card records the two costs the ruling should see: a model name
   becomes untrusted input reaching argv (the adapter's whole validation
   posture exists because of that class), and nputer starts carrying
   knowledge of which model names each CLI accepts, which goes stale
   outside this repository.
4. **WHAT HAPPENS WHERE IT CANNOT BE FORCED** stays D5's second half and
   is already built: record what ran, flag the mismatch. This card must
   not weaken it — an enforced path and a verified path are both wanted,
   because a human pasting a brief by hand is a permanent case.

## Acceptance criteria

- THE lane SHALL NOT begin until @human has ruled question 1 (where the
  loop runs) and question 3 (whether ADR-003's no-`--model` property is
  reversed); both are recorded on this card, dated.
- WHERE an adapter's CLI can be told which model to run, the spawn path
  SHALL tell it, and the assignment SHALL come from the card's
  `builder:`/`verifier:` field rather than from any default.
- WHERE it cannot, the existing VERIFY half SHALL remain untouched, and
  the lane SHALL state which adapters fall on which side, MEASURED at
  its own ref.
- A model name reaching argv SHALL pass the same validation posture the
  adapter already applies to every other untrusted string, and the body
  proving it SHALL carry a positive control.
- Verification: headless — the app crate's `cargo test`, with the
  argv-rule bodies extended rather than loosened.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->

## PARKED THE SAME DAY IT WAS FILED — @human, 2026-08-30, correcting this card's framing

**@human, verbatim:** *"This is a product decision we still need to make
and plan. Because its not a either or question. Its a question of how
much is steered from nputer and how much is steered from Claude or
Codex. So dont execute the new card yet."*

**THE CARD'S QUESTION 1 WAS PUT WRONGLY AND THIS IS THE CORRECTION.** It
asked WHERE the loop runs — Claude Code, Codex, or the nputer app — as
three alternatives. They are not alternatives. The question is a DIAL:
how much steering sits in nputer and how much stays in the agent CLI,
and the answer may legitimately DIFFER PER CONCERN (interview, build,
verify, architect). A card offering three doors cannot express the
answer, which is why it is parked rather than re-scoped in place.

**THE ROOM IS `docs/rooms/steering-split.md`**, opened at this ruling,
carrying @human's framing, the four dial positions and the four
questions the planning has to answer — including the one this card never
asked: what a user who prefers their own CLI gets.

**RESURFACES: `docs/rooms/steering-split.md` records a RESOLUTION.**
That is the only event; no lane, no sitting and no seat may substitute
for it.

**AND NOTHING IS BLOCKED MEANWHILE, which is why parking costs nothing
here.** The enforcement gap is live but inert while dispatch is
hand-driven: every dispatching session reads `builder:` off the card and
sets the model on the subagent it launches, which is what happened on
2026-08-30 for both lanes of that day. The gap is that this is a
DISCIPLINE — if a future dispatcher forgets, nothing catches it at spawn
time and only `T-169`'s after-the-fact flag would notice. That is the
cost of the park, stated so the room can weigh it.

Woken 2026-09-13 (the owner's ruling 8 of 2026-09-13): docs/rooms/steering-split.md now records its resolution for the current stage (the native apps are the cockpit for now, the app a mirror first), which is this card's wake condition; it is re-triaged at the next pruning batch, its app-spawn scope reassessed against the current plan; waking authorizes neither promotion nor dispatch, and the status stays parked until that triage.
