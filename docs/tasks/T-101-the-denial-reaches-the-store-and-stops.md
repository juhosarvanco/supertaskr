---
id: T-101
title: The live denial reaches the store and stops — the fact exists, in order, on the right turn, bounded and stripped, and nothing renders it
feature: F-03
milestone: 4
priority: 57
size: M
status: planned
blocked_by: []
touches: [app-interview]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-081-s1 (sixth triage, 2026-08-20). That file is removed in
this commit.

**T-081 shipped the fact and could not ship the notice.** Its second
criterion reads *"THE denial SHALL reach the frontend at the moment it
arrives, carrying the tool name and the CLI's own `message`"*, and it
does: `RunEvent::Denied` crosses the `genesis-turn` channel and
`reduceGenesisEvent` lands it on `GenesisTurn.denials` in arrival order.
**No component reads that field.** Verified at `4d2f03c`: `git grep -n
denials -- app/src` returns `app/src/lib/agent-store.ts` and
`app/src/genesis/interview-model.ts`, and the interview-model hits are
`error.denials` — the TERMINAL `toolDenied` error, a different datum on
a different path. No `.tsx` file mentions the live list at all.

**That is a FENCE fact, not an oversight.** T-081's `touches:` is
`[app-agent]`, which ARCHITECTURE defines as `app/src-tauri/src/agent/**`
plus `app/src/lib/agent-store.ts`. The chat a human would see a denial
in is **C-13** — `app/src/genesis/InterviewChat.tsx` and
`app/src/genesis/interview-turns.tsx`, area `app-interview`. A card
fenced to the runner and its store cannot build the notice, and building
it anyway would have been the scope creep the role forbids.

**The gap is visible in T-081's own @human line**, which asks *"whether
a live denial notice reads as information rather than alarm"*. Nothing
exists to judge.

**Where it goes, so the builder does not rediscover it.** `PlannerTurn`
in `interview-turns.tsx` already renders mid-stream furniture off the
same turn object — `planner.activity[planner.activity.length - 1]` is
the last tool label beside the pulse dot (verified at `4d2f03c`).
`denials` is the same kind of datum on the same object and wants the
same neighbourhood.

**Three things the store already knows, each of which breaks a naive
renderer.** All three are documented at `GenesisTurn.denials` and in
`GenesisDenial` itself:

- **A denial is not a failure.** The transcribed turn carried two and
  COMPLETED — the planner decomposed the refused command and carried on.
  The store's own comment says a non-empty list says nothing about how
  the turn ends; read `status` for the outcome. Rendering denials in the
  failure treatment would say the opposite of what the runner measured,
  and `FailureBlock` is the wrong component for exactly that reason.
- **The list can name one tool twice.** The real CLI refused `Bash`
  twice in one observed turn — a compound command whose sub-commands
  were not all covered, and a `cp` with a glob. The list is deliberately
  not deduped; `toolUseId` is what tells the entries apart.
- **`toolName` and `toolUseId` are `string | null` and `message` may be
  empty.** A renderer that assumes both fields are present prints
  "undefined" on the screen the card exists to make trustworthy.

## Acceptance criteria

- **A REFUSED TOOL SHALL BE VISIBLE IN THE TRANSCRIPT AT THE MOMENT IT
  ARRIVES**, on the turn it belongs to, without waiting for the turn to
  end. The store already delivers it live; this criterion is about the
  screen.
- **THE NOTICE SHALL NOT USE THE FAILURE TREATMENT.** A turn carrying
  denials that completes SHALL render as a completed turn — assert both
  the denial notice and the completed status in one body, because the
  measured real turn is exactly that case.
- **TWO DENIALS NAMING THE SAME TOOL SHALL BOTH APPEAR**, distinguished
  by `toolUseId` rather than deduped. A body SHALL drive the
  two-`Bash` case the runner measured.
- **A DENIAL WITH A NULL `toolName` OR AN EMPTY `message` SHALL RENDER
  SOMETHING A HUMAN CAN READ**, and the assertion SHALL be that the
  string "undefined" and the string "null" appear nowhere in the
  rendered subtree.
- IF the notice is placed beside the activity line THEN it SHALL survive
  the same re-render conditions that furniture does, and the body SHALL
  assert it after a subsequent delta rather than only at arrival — a
  notice that a later render drops is worse than none.
- **THE ORDER SHALL BE THE ORDER THE USER WAS TOLD**, matching the
  store's arrival order, and the body asserting it SHALL use a witness
  that is EMITTED rather than buffered (T-092's absorbed T-081-s5: the
  transport can hold a delta, so a delta cannot date anything).
- IF the denial notice and the terminal `toolDenied` error can both be
  on screen at once THEN the same refusal SHALL NOT read as two
  different events — T-081's criterion 4 (*the same denial shall not be
  reported twice*) is a rendering obligation as much as a runner one.

Verification: headless — `npm test` and `npm run build` from app/ with
counts and exits stated, and the tools/e2e lane if any body lands there
(note THE E2E LANE'S HONEST SCOPE: the genesis screen's actions are IPC,
so the lane can prove the notice RENDERS from a store state, never that
a real denial reached it). POISON DRILL on every new body, one side
only: delete the notice, drop one of the two same-tool entries, null the
`toolName` — each read back with `git diff` before the run and each
required RED; restores proved by sha256 at the drill's own commit. Then
T-092's shape-six check per body. **@human: yes, one look** — T-081's
own open question, unanswerable until now: does a live denial notice
read as information rather than alarm on a turn that then completes?
