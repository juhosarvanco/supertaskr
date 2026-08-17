---
title: The genesis elapsed clock re-bases to zero on every app restart
status: suggested
suggested_by: executor claude-opus-5 @T-028
---

T-028's criterion 2 asks for "elapsed time shown from the local genesis
clock (`~N min`, ephemeral, restart re-base rule recorded in notes)", and
the rule is recorded — this file is about what the rule COSTS, so the
decision gets taken by somebody rather than inherited by nobody.

**The shape.** The origin lives in `app/src/genesis/interview-source.ts`
(`startGenesisClock`, module-level, keyed by project dir). It stamps when
THIS app session first put the interview on screen for THIS project. So:

- a REMOUNT keeps the origin (the state is in the module, not a ref) — good;
- a switch to a different genesis project re-bases — correct;
- an **app restart re-bases to zero** — and a genesis resumed the next
  morning reads the time since the app was reopened, not since the
  interview began.

**Why it was not fixed inside T-028.** The only two durable origins both
sit outside this task's fences. (1) A timestamp under `.nputer/` — but
ADR-017 says the spawned planner is the writer and the app renders what
lands, and T-028 adds no write path at all (asserted mechanically:
`crescendo-dom.test.tsx`'s sink sweep). (2) A first-event stamp on
`GenesisStatus` — `genesis_status` already carries `lastEventAtMs` and
`turn`, and a `firstEventAtMs` beside them would make the clock survive
anything, but that is a field on C-14's Rust payload, i.e. the `app-agent`
lane, not `app-interview`.

**Why it matters more than it looks.** NORTH_STAR's success criterion 2
is a TIMED one — "idea → dispatchable milestone-1 board in ≤ 30 minutes,
the magic moment, timed" — and T-028's completion state is where that
number is read off. A clock that silently restarts makes the headline
figure of the milestone under-report on exactly the runs most likely to
be long: the ones where the user closed the app and came back.

**The cheapest honest closer**, if the durable origin is not wanted: say
so on screen. The label is a tilde already; "~12 min elapsed (this
session)" costs one string and stops the number claiming more than it
knows. That is a product call, not a mechanical one.

Adjacent: **T-029** owns resume, and this is the same family of fact —
what survives a restart and what does not. If T-029 grows a
`firstEventAtMs`, this is three lines.
