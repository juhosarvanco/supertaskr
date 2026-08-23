---
id: T-107
title: An unsupported CLI version is diagnosed exactly and offered no way out — the one failure family whose renderer has no action slot
feature: F-03
milestone: 4
priority: 63
size: S
status: planned
blocked_by: []
touches: [app-interview]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs (seventh triage, 2026-08-24): T-070-s1 — files removed in this commit.

Absorbs: T-082-s4 (sixth triage, 2026-08-20). That file is removed in
this commit.

**Found by T-082's criterion 5, which required enumerating every other
executable command the app renders in a failure path.** The enumeration
turned up no second bad command — and turned up a failure path that
names a fixable problem and offers nothing to fix it with.

`noticeSentence` in `app/src/genesis/InterviewChat.tsx` renders
`unsupportedVersion` as, verbatim at `4d2f03c`:

    the agent CLI reports ${outcome.found}, which is older than this app can drive.

That is a correct, typed diagnosis — `CLAUDE_V1`'s `min_major: 2` in
`app/src-tauri/src/agent/adapter.rs`, verified — **and it is a dead end
in the same shape T-029 exists to prevent elsewhere: the app knows
exactly what is wrong, the user can fix it in one command, and the
screen does not say which command.**

**The gap is structural rather than an oversight.** `unsupportedVersion`
is a `StartOutcome`, not a `TurnError`, so it is not routed through
`failureAction` at all — it reaches `OutcomeNotice` rather than
`FailureBlock`, and `OutcomeNotice` has no `command` slot to fill (all
four symbols verified at `4d2f03c`; `failureAction` lives in
`interview-model.ts` and `FailureBlock` in `interview-turns.tsx`).
**Two families of "this went wrong" have different renderers, and only
one of them can carry an action.**

**The command exists and was read from the CLI's own surface at 2.1.226,
which spawns no turn**: `claude install [target]` (*"Install Claude Code
native build"*) and `claude update|upgrade` (*"Check for updates and
install if available"*). **Which of the two is right depends on how the
user installed** — the observed binary was `/opt/homebrew/bin/claude`,
where `brew upgrade` may be the honest answer instead — **and that is
the open question, not the missing string.** T-082's own lesson applies
directly: an app that guesses an install-manager command it never ran is
the same class of defect one layer over.

Two shapes, neither obviously right:

1. **Give `OutcomeNotice` the same `hint`/`command` structure
   `FailureBlock` has**, and name one command per outcome. Costs a
   second place where the app asserts a command surface it cannot
   verify.
2. **Say what is true and nothing more** — *"nputer needs claude 2 or
   newer; update it however you installed it"* — and route to the
   hand-driven mode, which needs no CLI at all and is already built.

Shape 2 is cheaper and inherits no risk. **The choice is a product
decision, which is why T-082 recorded it rather than building it.**

## Acceptance criteria

- **THE UNSUPPORTED-VERSION NOTICE SHALL OFFER A NEXT STEP THE USER CAN
  TAKE**, and the step SHALL be one the app can honour: a command the
  app has verified, or the hand-driven route that needs no CLI.
- **THE APP SHALL NOT PRINT AN INSTALL-MANAGER COMMAND IT CANNOT
  VERIFY.** IF a command is rendered THEN the card SHALL state how the
  app knows it is the right one for this installation, and IF it cannot
  know THEN shape 2 is the answer and the refusal SHALL be recorded at
  the renderer.
- **THE MINIMUM VERSION SHALL BE NAMED FROM THE ADAPTER, not
  transcribed.** `CLAUDE_V1.min_major` is the authority; a notice
  hard-coding "2" is a second implementation (T-057).
- IF `OutcomeNotice` gains an action slot THEN the two renderers' notion
  of an action SHALL stay ONE shape rather than two — a `hint`/`command`
  pair in two families that drift apart is the defect this card is
  fixing, arrived at from the other side.
- **A BODY SHALL DRIVE THE `unsupportedVersion` OUTCOME AND ASSERT THE
  NEXT STEP IS PRESENT AND REACHABLE** — the route, or the command
  string — rather than asserting the sentence text, which is prose and
  will be reworded.
- **THE OTHER `StartOutcome`/`SendOutcome` ARMS SHALL BE ENUMERATED AND
  RULED ON in one pass**: which of them name a fixable problem with no
  offered fix. `noticeSentence` has ten arms at `4d2f03c`, and this card
  should not leave a sibling behind for the same reason T-082's
  criterion 5 existed. THE ENUMERATION SHALL BE DERIVED FROM THE UNION
  TYPE, not from reading the switch — an arm added later must not escape
  the ruling.
- IF any arm is judged deliberately actionless (`busy`, for instance)
  THEN the decision SHALL be recorded beside it, so "we decided" cannot
  be read as "we forgot".

Verification: headless — `npm test` and `npm run build` from app/ with
counts and exits stated. **NO REAL MODEL CALL, in any suite, for any
reason**; the CLI's command surface is read from `--help`, which spawns
no turn, and **no backtick goes inside a shell string** while doing it —
single-quote a command name or omit it (T-093's absorbed T-082-s3, where
that exact motion started a real turn). POISON DRILL on the new body,
one side only, mutated text read back before the run, restore proved by
sha256 at the drill's own commit. **@human: yes, one look** — the notice
is the screen a user meets when their CLI is too old, and whether the
chosen wording reads as help rather than as a wall is not a headless
question.
