---
id: T-201
title: A `tools/e2e`-fenced lane that adds a test body CANNOT satisfy the capabilities gate inside its own fence — the census is generated FROM spec names and written to a file no such fence carries, so every one of them ships a stale gate to the integrator
feature: F-06
milestone: 4
priority: 3
size: S
status: done
blocked_by: []
touches: [docs/CONVENTIONS.md, method/tasks/TASK-FORMAT.md]
suggested_by: "T-142-s1's executor, which hit it and described the structural half rather than filing it; id allocated by the architect/integrator seat"
builder: architect seat
built_by: claude-fable-5-1 @architect seat, 2026-09-02
review: self-verified
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

## Implementation notes

**DONE AT THE SEAT, 2026-09-02, under the T-216-s5 precedent.** The ask
was a SPELLING — whose commit carries the census regeneration — and the
class was already ruled by the GRAPH REGEN bullet's shape, so the
sentence was written directly into `docs/CONVENTIONS.md` rather than
through a lane: no lane was live, the fence was disjoint from everything,
and the four suites plus the docs gate are the check.

Absorbs: T-218, T-216-s2. T-218's four measured instances (the lanes of
T-199, T-209, T-210 and T-216-s1) and T-216-s2's fifth (the rename at
e67cb44, repaired at cf9d462) are this card's evidence; both bodies stay
readable at `git show 85dda6d:docs/tasks/<their file names>`.

The criteria, each answered:

- **Stated in exactly one place**: the `npm run capabilities` clause of
  the tools/e2e command bullet in docs/CONVENTIONS.md. It REFERENCES the
  GRAPH REGEN bullet as the owner's precedent and restates nothing.
- **Which answer**: the INTEGRATOR obligation, at the merge commit, before
  the checkpoint. A `touches:` convention was refused because a card
  cannot know at dispatch whether it will add a body; adding
  docs/CAPABILITIES.md to `alwaysWritable` was refused because a lane
  regenerating mid-flight embeds its own board state in a shared file.
  `method/tasks/TASK-FORMAT.md` is untouched, so no method bump is owed.
- **The dispatch tells the lane**: the brief's row 7 transcribes that
  bullet verbatim, and the executor's report already owes every command's
  exit, so a stale `capabilities:check` reaches the integrator as a
  reported reading rather than as a discovery.
- **When the integrator forgets**: CI's census-currency step reds on that
  push — e67cb44 did exactly that on 2026-09-01 (run 33556715639) and
  cf9d462 repaired it. The push that forgot is the one named; the next
  lane no longer inherits the red silently.

Not taken here: T-216-s2's second criterion asked that the lane's REPORT
obligation be written into `method/roles/executor.md`. That file ships
and a change to what a role must say is a method bump; the report's own
every-command rule already carries the obligation, so nothing is written
there. If a lane ever fails to report a stale census, that is the finding
to file.

## Verdicts

2026-09-02, self-verified at the architect seat: the four-suite battery
and the docs gate at the commit that lands this card are the only check
it took, and `review: self-verified` says so.
