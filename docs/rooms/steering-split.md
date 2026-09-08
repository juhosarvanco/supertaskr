---
type: consultation
task: 
status: resolved
max_rounds: 3
---

# Room: the steering split — how much is steered from nputer, how much from Claude or Codex

Opened 2026-08-30 at @human's directive, in @human's own words:

> *"This is a product decision we still need to make and plan. Because
> its not a either or question. Its a question of how much is steered
> from nputer and how much is steered from Claude or Codex."*

**THE FRAMING IS THE RULING SO FAR, AND IT CORRECTS THIS SEAT.** `T-180`
was filed asking *where the loop runs* — Claude Code, Codex, or the
nputer app — as though the three were alternatives. They are not. The
real question is a DIAL, and every honest answer is a position on it
rather than a choice between three products.

## What is already true, so the room argues from facts

Derived at `2489b0f`; re-derive before relying on any of it.

- **D5 is RULED AND BINDING** (`docs/rooms/cockpit-or-mirror.md`,
  @human, 2026-08-30): *"Of course the models the human assigns to
  different tasks do those tasks as assigned."*
- **Nothing enforces it.** `app/src-tauri/src/agent/adapter.rs:126` and
  `:763`: *"we never pass `--model`"* — ADR-003 rules that the user's
  CLI default IS the model. The genesis planner therefore runs on
  whatever the installed CLI defaults to, reported on its init line
  rather than requested.
- **For build and verify work there is no spawn path at all.** F-04
  deliberately spawns nothing. Today the assignment is honoured by
  whichever session dispatches BY HAND — which worked on 2026-08-30, and
  is a discipline rather than a property.
- **The verify half of D5 exists**: `built_by:`/`verified_by:` record
  what actually ran and a mismatch is flagged (`T-169`).

## The dial, stated as positions rather than options

Each position is a different answer to "who decides, who spawns, who
holds the session". They are not mutually exclusive per CONCERN — the
whole point of the room is that the answer may differ for the interview,
for build work, and for verification.

1. **Agent-CLI steered (today).** nputer describes; the human or the
   agent CLI drives. nputer names a model on the card and reads back
   what ran. Cheapest, and the assignment is advice.
2. **nputer routes, the CLI executes.** nputer spawns each task with the
   assigned model passed explicitly. The assignment becomes a property.
   Cost: a model name becomes untrusted input reaching argv, and nputer
   starts carrying knowledge of which model names each CLI accepts —
   knowledge that goes stale outside this repository.
3. **nputer runs the architect session too.** The orchestrating
   conversation lives in the app, and subagent sessions are its
   children. This is the position @human's sentence points at, and it
   reaches ADR-008 (app-first) and the follower-first ordering ruled in
   `rooms/cockpit-or-mirror.md`, which puts the in-app orchestrator
   AFTER F-04's spawn path.
4. **Mixed by concern**, which is the position the framing implies is
   likeliest: e.g. nputer routes build/verify work (where assignment
   matters and the task is bounded) while the interview and the
   architect conversation stay in whichever CLI the human prefers.

## The questions this room has to answer, and they are not equal

1. **Per CONCERN, where does the dial sit?** Interview, build, verify,
   architect — four different answers are allowed and the room should
   expect them.
2. **Is ADR-003 reversed, and for which of those concerns?** *"The
   user's CLI default IS the model"* has a reason: it keeps nputer out of
   the business of knowing model names. Passing `--model` reverses it.
   The reversal may be right for build work and wrong for the interview.
3. **What does a user who prefers their own CLI get?** A product that
   only works when nputer drives is a different product from one that
   improves whatever the user already runs. This is the question with
   the most product surface and the least written down.
4. **What stays VERIFIED rather than ENFORCED, permanently?** A human
   pasting a brief by hand is not an edge case — it is the method's own
   fallback, and D5's second half exists for it. Whatever the dial ends
   up at, the verify half is not replaced by the enforce half.

## Sequencing, so this room does not block what it should not

`T-180` is PARKED on this room's resolution and is not startable. **It
is not blocking anything else**: the enforcement gap costs nothing while
dispatch is hand-driven and every dispatching session sets the model
deliberately, which is the practice today and is recorded on `T-180`.

RESOLUTION: none yet — @human plans this one; the positions above are a
seat's draft for that planning, not a vote.
