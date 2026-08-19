---
id: T-082-s4
title: An unsupported CLI version is diagnosed with no recovery command at all
status: suggested
suggested_by: executor claude-opus-5 @T-082
---

Found by T-082's criterion 5, which required enumerating every other
executable command the app renders in a failure path. The enumeration
turned up no second bad command — but it turned up a failure path that
names a fixable problem and offers nothing to fix it with.

`noticeSentence` in `app/src/genesis/InterviewChat.tsx` renders
`unsupportedVersion` as *"the agent CLI reports {found}, which is older
than this app can drive."* That is a correct, typed diagnosis
(`min_major: 2` in `adapter.rs`'s `CLAUDE_V1`), and it is a dead end in
the same shape T-029 exists to prevent elsewhere: the app knows exactly
what is wrong, the user can fix it in one command, and the screen does
not say which command.

`unsupportedVersion` is not routed through `failureAction` at all — it is
a `StartOutcome`, not a `TurnError`, so it reaches `OutcomeNotice` rather
than `FailureBlock` and has no `command` slot to fill. That is why the
gap is structural rather than an oversight: the two families of "this
went wrong" have different renderers, and only one of them can carry an
action.

**The command exists and was read from the CLI's own surface at 2.1.226,
which spawns no turn:** `claude install [target]` (*"Install Claude Code
native build. Use [target] to specify version (stable, latest, or
specific version)"*) and `claude update|upgrade` (*"Check for updates and
install if available"*). Which of the two is right depends on how the
user installed — this machine's binary is `/opt/homebrew/bin/claude`,
where `brew upgrade` may be the honest answer instead — **and that is the
open question, not the missing string.** T-082's own lesson applies
directly: an app that guesses an install-manager command it never ran is
the same class of defect one layer over.

Two shapes, neither obviously right:

1. Give `OutcomeNotice` the same `hint`/`command` structure
   `FailureBlock` has, and name one command per outcome. Costs a second
   place where the app asserts a command surface it cannot verify.
2. Say what is true and nothing more — *"nputer needs claude 2 or newer;
   update it however you installed it"* — and route to the hand-driven
   mode, which needs no CLI at all and is already built.

Shape 2 is cheaper and inherits no risk. Recorded rather than built,
because T-082's fence is the auth path and choosing between these is a
product decision.
