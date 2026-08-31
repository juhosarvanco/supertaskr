---
id: T-199
title: The lane fence judged NOTHING all night — every lane worktree is outside the dispatching checkout, so `lane-fence.mjs`'s own limit 2 allows every write unjudged, and seven lanes' compliance was discipline
feature: F-06
milestone: 4
priority: 1
size: M
status: planned
blocked_by: []
touches: [.claude, tools/e2e]
suggested_by: "T-190's executor, which DRILLED THE FENCE ITSELF and found the write succeeded; re-derived from the hook's source at the architect/integrator seat before filing"
builder:
review:
---

**A LANE DRILLED THE INSTRUMENT THAT WAS SUPPOSED TO BE CONSTRAINING IT,
AND THE INSTRUMENT WAS NOT THERE.** `T-190`'s executor wrote to a path
**outside** its `.nputer/lane-fence.json` as a deliberate drill. **The
write succeeded.** It removed the file immediately and reported it.

## Re-derived at this seat from the hook's own source

`.claude/hooks/lane-fence.mjs:786`:

    return allow("outside-the-checkout",
      `${abs} is outside ${root} (limit 2 in this file's header)`);

and the header at line ~754 states the design plainly: *"A detached
checkout is not judged at all (limit 3), **a path outside this checkout is
not judged (limit 2)**, a lane whose manifest cannot be read reserves
nothing (limit 4)."*

**The limit is DECLARED, deliberate, and correct in isolation.** What is
new is the configuration it meets.

## Why it swallows every lane in this session's shape

The dispatching seat runs from a nested checkout
(`.claude/worktrees/<name>`), and lane worktrees are **siblings** of the
repository (`../nputer-T-NNN`) — which `method/lane-protocol.md` rule 3
REQUIRES. Subagents inherit the dispatching session's project root.

So every lane write is, from the hook's point of view, **outside the
checkout** — and `laneLessVerdict` allows it **unjudged**. Not denied,
not permitted-with-a-carve: **never evaluated.**

**The two rules are individually right and jointly fatal**: rule 3 puts
lanes outside the repository, and limit 2 declines to judge outside the
repository. Nothing in either names the other.

## THE EXPOSURE, STATED PLAINLY

**Seven lanes ran on 2026-08-31 believing a hook enforced their fences.
None was enforced.** Every dispatch brief from the architect/integrator
seat said *"a PreToolUse hook enforces it"*, and that sentence was false
for the entire night.

**What actually happened is the good news and also the point**: every
lane stayed inside its fence, and several **routed rather than widened**
when the fix lay outside — `T-112-s4`, `T-186`, `T-192` and `T-190` all
did so explicitly. **Compliance was total and it was DISCIPLINE.**

`T-167-s8`'s absorbed evidence is that over one night, every
mechanically-triggered gate held and **every memory-held obligation
decayed**. The fence has been in the second category without anyone
knowing, and it survived only because it was also written into every
brief in prose.

## This is the guard-class defect in its purest form

`method/tasks/TASK-FORMAT.md`: *"a guard's characteristic defect shows up
as **nothing happening, which is also what success looks like**."*

**A fence that judges nothing and a fence that approves everything are
byte-identical from outside.** Seven lanes' worth of clean writes is
exactly what a working fence produces — and exactly what an absent one
produces when the writers are careful. Only a lane that **deliberately
attacked its own fence** could tell them apart, and one did.

## What a fix decides

1. **Where `root` should come from.** The hook resolves the dispatching
   checkout; what it needs is the LANE's worktree, which the manifest
   already names in `worktree`. **The manifest may already carry the
   answer** — check before inventing a resolution.
2. **Whether limit 2 should narrow or the root should move.** Limit 2
   exists so the hook does not police unrelated files on the machine, and
   that reason is still good. **Narrowing it to "outside every known lane
   worktree" preserves the intent** — but argue it, and say what it costs.
3. **What the hook does when it cannot decide.** Limits 3 and 4 also
   ALLOW. A guard that fails open is a defensible choice and an
   indefensible silence: whatever is decided, **an unjudged write should
   be visible**, or this card recurs in a new shape.
4. **Whether the dispatch brief may claim enforcement at all.** Until a
   body proves the hook denies a real out-of-fence write from a real
   lane, the sentence *"a PreToolUse hook enforces it"* is a claim
   nothing backs.

## Acceptance criteria

- A body SHALL prove the hook **DENIES** a write outside the manifest
  from a lane worktree in the shape this project actually dispatches —
  sibling worktree, nested dispatching checkout — and a **positive
  control** SHALL prove the same body passes an in-fence write.
- **THE CONTROL IS THE POINT**: a body that only asserts in-fence writes
  succeed passes identically against a hook that judges nothing, and is
  the vacuity this card exists to remove.
- WHERE the hook declines to judge, the decline SHALL be OBSERVABLE
  rather than silent.
- THE brief's enforcement sentence SHALL be true when it is printed, or
  SHALL not be printed.
- `method/lane-protocol.md` rule 3 SHALL NOT be weakened to fit the hook;
  the hook moves.
- Verification: headless.

## Read beside

`T-167-s8` (mechanical triggers hold, memory-held obligations decay —
measured), `T-189` (self-integration and the concurrent ceiling, another
pair of individually-right rules that do not name each other), and
`method/lane-protocol.md` rule 3, which is correct and stays.
