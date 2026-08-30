---
id: T-164-s2
title: Nothing outside bin/ says the launcher exists — a command written to replace a personal note is discoverable only by the seat that wrote it
feature: F-02
milestone: 4
priority: 21
size: S
status: planned
blocked_by: []
touches: [docs/CONVENTIONS.md, README.md, tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-164
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND WHILE BUILDING T-164, ROUTED RATHER THAN FIXED: both files are
outside that lane's fence** (`touches: [bin]`; `docs/CONVENTIONS.md` was
additionally held by a lane on `T-163-s3`, which has since landed —
corrected at triage, see below). T-164 exists
so a three-step ritual stops living in a personal note — but
`bin/app-dev.mjs` is named in no command list, no front door and no
gotcha, so the note it replaces is still the only thing that says the
command exists, and the next session to open the app will find the
ritual before it finds the script. Two places want one sentence each:
CONVENTIONS' **Build & test** section, whose bullets are the command
census a session reads first, and the README's human front door (T-158).
**AND THE CONVENTIONS HALF CARRIES A MECHANISM THAT REDS THE LANE THAT
FORGETS IT** — `deriveExpectedSteps` in
`tools/e2e/tests/workflow-parity.spec.ts` reads exactly the
`run from <dir>/:` bullets of that section and reds by name on a command
it cannot map to a CI step. This launcher is LOCAL ONLY by construction
(it starts the human's app; the pipeline never drives the app), so the
bullet must land with its `LOCAL_ONLY` entry in the SAME commit, which
is the two-package edit the `npm run health` bullet above it already
warns about. That is why this is a card and not a line smuggled into a
doc: the fix is one sentence and two packages.

## Triage — standing sitting #3, 2026-08-30 (architect seat)

**PROMOTED F-02 p21**, at `@ 51fa31c0964c`. Small, ready, and the needle
is still live — re-derived here rather than taken on the filing's word:

    command grep -rn app-dev README.md docs/CONVENTIONS.md tools/e2e/tests/workflow-parity.spec.ts
    -> no match in any of the three

So `bin/app-dev.mjs` is named in the launcher card, in its own file, and
nowhere a session or a human would look.

**FENCE CORRECTED AT PROMOTION — `tools/e2e` ADDED.** As filed the fence
was `[docs/CONVENTIONS.md, README.md]`, and the card's own body explains
why that cannot work: the `LOCAL_ONLY` entry that keeps
`workflow-parity.spec.ts` from redding on the new bullet lives at
`tools/e2e/tests/workflow-parity.spec.ts:315`, and the card requires it
to land in the SAME commit. A fence that excludes the file the card says
must move in the same commit is the defective-card shape `T-160-s4`
exists to refuse; corrected rather than dispatched and discovered. This
is the same correction `T-156-s5` already carries for the same coupling
— that card is F-06 p14 with `[docs/CONVENTIONS.md, tools/e2e]`, it is
the OTHER command owed a Build-and-test bullet, and the two overlap on
two entries.

**AND THE OVERLAP IS NAMED RATHER THAN LEFT TO A DISPATCHER.**
`T-156-s5` and this card cannot run at once, and they want adjacent
sentences in the same section of the same file. Whoever dispatches
either should consider taking both in one lane — one Build-and-test
pass, one `LOCAL_ONLY` reconciliation, one parity run — rather than two
lanes that will conflict in the same paragraph. Not absorbed here
because they are different commands owed to different audiences and
either can ship alone; recorded so the choice is deliberate.

## Acceptance criteria

- THE launcher SHALL be named in CONVENTIONS' Build & test section, in
  the bullet style that section already uses, so the command census a
  session reads first contains it.
- THE launcher SHALL be named at the README's human front door, in one
  sentence, as the way to open the app.
- THE CONVENTIONS bullet and its `LOCAL_ONLY` entry SHALL land in the
  SAME commit, and the entry SHALL carry the reason CI does not run it:
  the launcher starts the human's app and the pipeline never drives the
  app.
- THE bullet SHALL NOT claim the launcher is a gate, and SHALL NOT be
  added to any CI sequence.
- Verification: headless — the workflow-parity body that maps every
  documented command to a CI step or a `LOCAL_ONLY` claim runs green,
  and it is the check that proves both halves landed together.

**PREFLIGHT AT PROMOTION — IT REFUSED ONCE, AND THE REFUSAL WAS
CORRECTED RATHER THAN RULED.** `node scripts/brief.mjs --task T-164-s2
--preflight`, run from the e2e package at `@ 51fa31c0964c`, first
exited 1 with THREE findings. One of them was about this card and not
about the clock:

    STATED REASON NO LONGER HOLDS at …T-164-s2….md line 21:
    "`T-163-s3`'s live lane", and no live lane is on T-163-s3 now.
    A lane is a LIVE fact — it carries the time it was read at and
    never a commit — so a card holding one from its filing is quoting
    a worktree that has gone.

The tool is right and the card was wrong in the way that matters: the
sentence read as a standing obstacle when it was a snapshot. Fixed in
the opening paragraph — the lane is named in the past tense and pointed
at this note — rather than ruled, because a ruling would have left the
next reader believing a worktree still exists. **The re-run exits 1 with
TWO findings and both are the same live lane**: `T-154-s2` holds
`tools/e2e` and `docs/CONVENTIONS.md`, two of this card's three entries.
Everything else ran clean: paths missing **0**, criteria naming paths the
fence does not reserve **0**, unrunnable figures **0**, `blocked_by`
nothing, ref stamps **1 of 1 resolving**.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
