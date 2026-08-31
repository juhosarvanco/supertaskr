---
id: T-201
title: A `tools/e2e`-fenced lane that adds a test body CANNOT satisfy the capabilities gate inside its own fence — the census is generated FROM spec names and written to a file no such fence carries, so every one of them ships a stale gate to the integrator
feature: F-06
milestone: 4
priority: 3
size: S
status: planned
blocked_by: []
touches: [docs/CONVENTIONS.md, method/tasks/TASK-FORMAT.md]
suggested_by: "T-142-s1's executor, which hit it and described the structural half rather than filing it; id allocated by the architect/integrator seat"
builder:
review:
---

**MET BY A LANE THAT COULD NOT DISCHARGE ITS OWN GATE**, and it named the
structure rather than treating it as its own accident.

## The mechanism

`docs/CAPABILITIES.md` is **generated from the e2e spec names** — that is
its whole design, and `CLAUDE.md` says so: *"generated from the e2e spec
names, so a sentence in it is false the moment its test reds."*
`capabilities:check` reds when the file and the specs disagree.

So **adding one test body under `tools/e2e/tests/` necessarily makes the
census stale** — `T-142-s1` measured its own delta at **exactly 68
bytes**, one rendered test-name line, nothing else.

**And `docs/CAPABILITIES.md` is not in a `[tools/e2e]` fence.** The lane
that caused the staleness cannot fix it. It must hand the integrator a
red gate and a note.

## Why this is structural rather than one lane's bad luck

**It has held since `T-153-s8` added `capabilities:check` to CI**, and it
applies to *every* `tools/e2e`-fenced card that adds a body — which is
most of them, because that is where this project's own tooling is tested.

Two lanes hit it in one night (`T-167-s8` at 27,333 → 29,053;
`T-142-s1` at 29,053 → 29,121). **Both handled it correctly and neither
could have avoided it.**

## What a fix decides

1. **Whether the remedy is a `touches:` convention or a fence rule.**
   The lane's own suggestion is the cheap one: **a card whose fence
   includes `tools/e2e` and which will add a test body should carry
   `docs/CAPABILITIES.md` in `touches:` at DISPATCH.** That is a rule for
   the dispatcher, and this seat is the party that keeps getting it
   wrong.
2. **Whether a dispatcher can know in advance.** A card does not always
   know it will add a body. **If it cannot be known at dispatch, the rule
   must be "the integrator regenerates" — and then it must be WRITTEN,
   because it is currently discovered per lane.** Say which, and do not
   leave it to be re-derived.
3. **Whether `alwaysWritable` is the right home.** The manifest already
   carries `docs/tasks` that way. Adding `docs/CAPABILITIES.md` would let
   any lane regenerate it — **argue whether that is safe**, since the
   census is a generated artefact and a lane regenerating it mid-flight
   would embed its own board state.

## Acceptance criteria

- THE rule SHALL be stated in exactly one place and referenced from the
  others; `T-057` forbids a second statement of it.
- WHERE the answer is a `touches:` convention, `method/tasks/TASK-FORMAT.md`
  SHALL say so; where it is an integrator obligation,
  `docs/CONVENTIONS.md`'s checkpoint ritual SHALL carry it beside the
  other regenerations.
- **A lane adding a `tools/e2e` body SHALL NOT have to discover this by
  redding a gate** — the dispatch or the ritual tells it.
- The card SHALL say what happens when a lane adds a body and the
  integrator forgets: today the next lane inherits the red.

## Read beside

`T-153-s8` (which added the CI keeper and created this), `T-167-s8` and
`T-142-s1` (both instances, both handled correctly), and `T-199` — the
other case where two individually-correct rules leave a lane unable to
satisfy something it is told it owns.
