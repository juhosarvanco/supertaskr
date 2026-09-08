# 12 — Genesis

Genesis is how a project enters the method: one interview, banked to
disk as it runs, ending in a decomposed, dispatchable milestone 1 and a
folder a cold session can resume from. The planner's contract is
method/roles/planner.md; the interview is
method/interview/plan-interview.md; decomposition is
method/interview/decomposition.md; the kit is method/ itself.

## The kit

method/ is a versioned package (v0.1.10) a project copies in whole:

```
method/
  README.md              the method in one page; the succession guarantee
  roles/                 planner, orchestrator, executor, verifier, integrator
  interview/             plan-interview, decomposition, archaeology (parked)
  tasks/                 TASK-FORMAT.md, T-000-template.md
  lane-protocol.md       the lane: seven rules, two fast paths, the revert play
  docs-protocol.md       the three tiers and the eight laws
  docs-templates/        STATE, ROADMAP, ARCHITECTURE, CONVENTIONS, NORTH_STAR
  adapters/              CLAUDE.md and AGENTS.md templates
  rooms/                 the room format
  runtime/nputer.yaml    role → model defaults, thresholds (gitignored copy)
```

All kit paths are relative to the kit root; the kickoff names the kit
root and the project directory. Each layer works without the ones above
it: the convention works by hand with any model, the CLI automates the
typing, the daemon watches files and routes @mentions, the app renders
what the files say. A test pins the version stamp, so a method upgrade
is a visible diff. Every rule in the kit carries the incident that
wrote it, and nothing in method/ names a project's own paths or
commands: the rule lives in the kit and the spelling lives in the
project's CONVENTIONS.

## The interview

One question at a time, never a wall; shallow batch answers are the
failure mode. The planner challenges weak answers instead of
transcribing them, opening such turns with the literal prefix
"pushing back:" so a driver can style them. Seven questions, in order:

1. **Problem and person** — one concrete person and scene, not a market.
2. **Success** — every adjective converted to a number or an observable
   event.
3. **Non-goals** — tempting adjacent features offered and rejected
   explicitly.
4. **Constraints** — deadline, budget, must-use tech, compliance,
   platform; hard versus preference.
5. **Stack and why** — habit challenged; the rationale becomes ADR-001.
6. **Riskiest assumption** — the belief that, if wrong, kills the
   project, and the cheapest early test of it.
7. **First slice** — the smallest thing that could ship and teach
   something; milestone 1 should feel too small.

An answer is banked when the human confirms it, or when they skip, in
which case the planner banks its own best assumption marked `[?]`,
resolved or roomed later and never silently deleted. The transcript is
not project record; the banked docs are.

## Incremental banking

Artifacts are written as the interview runs, never in one pass at the
end, so a kill at any stage leaves every earlier stage on disk:

| stage | step | banks into |
|---|---|---|
| 0 | scaffold, before Q1 | docs/ copied from the templates; empty decisions/, tasks/, rooms/; the adapter files at the root; `.supertaskr/` in .gitignore; `git init` if absent; STATE stamped "next stage: 1" |
| 1 | Q1 | NORTH_STAR § Vision, § Users; the adapters' project name and one-liner |
| 2 | Q2 | NORTH_STAR § Success criteria |
| 3 | Q3 | NORTH_STAR § Non-goals |
| 4 | Q4 | NORTH_STAR § Hard constraints |
| 5 | Q5 | decisions/001-stack.md, one ADR per contested choice; CONVENTIONS § Build & test seeded |
| 6 | Q6 | NORTH_STAR § Riskiest assumption |
| 7 | Q7 | ROADMAP § Backbone (ordered as the user experiences the product), § Milestones |
| 8 | decomposition | docs/tasks/T-*.md; ARCHITECTURE first draft; ROADMAP § Parked; STATE § Next up |

Every bank updates STATE's in-progress line to name the next stage. The
resume rule: a fresh session given only the kit and the folder derives
the next stage from disk (the first stage whose artifacts are missing
or template-empty), with STATE's line as the cross-check; on
disagreement the artifacts win. The planner never overwrites real
content it did not scaffold.

## Decomposition

Runs immediately after Q7 in the same session: the bridge from "F-01:
workspace core" to dispatchable cards, the step where vague plans die.
The dispatchability test defines an exact task: a fresh session with no
other context can read the card plus docs/ and build the right thing
without asking a question.

1. Walk the backbone left to right; list every piece of work milestone
   1 implies, the unglamorous ones included; name what is left out and
   park it.
2. Slice into tasks: one coherent change, one branch, one session. Too
   big if it needs a second worktree or touches more than about two
   components; too small if the checkpoint costs more than the work.
3. Write acceptance criteria in EARS (chapter 03), at least one IF/THEN
   line per card, ban words converted or deleted, each criterion tried
   for the input that makes it fail.
4. Size honestly: size sets ceremony.
5. Declare the blast radius in `touches:`, path-granular; shared
   hotspots get their own serialised cards.
6. Map dependencies: `blocked_by` for true blockers only; at least one
   card per feature unblocked on day one.
7. Set priorities: 1 is the top card, the feature's next task.
8. Self-review every card as the fresh executor, and the criteria
   against each other.
9. Present the board to the human and revise before anything is
   dispatched; this review is where scope gets cut.

Later milestones stay as backbone lines until their own review;
decomposing them now is speculation. The edge and must-not questions
and the decision list (planned: T-253) extend step 3.

## The cold-start test

A fresh session reads only docs/ and explains the project back: vision,
current state, next dispatch and why. Every gap in its answer is a
documentation bug; fix the docs and repeat until a cold session passes.
Run at genesis and at every model or session switch; the outcome is
one of the five stamped lines in every checkpoint record (`Cold
start:`), and its band is UNKEPT until a machine-readable outcome per
switch exists (T-175 gives the seam an owner).

## Skill packs (T-167)

The interview asks whether the organisation has skill packs to load
(a house style, a compliance checklist, a stack's conventions), banks
the answer, and files one auditable card per pack, so a pack enters the
project through the same loop as any other work and its provenance is
on the record.

## The two lenses (ADR-021)

One interview, two lenses over one prompt and one file contract: the
interview skill in the agent app (planned: T-242, primary since the
2026-09-08 addendum) and the mirror app's genesis screen (C-13), a
split view where the chat is one pane and the folder's files fill the
other. Chips in the app come from the watcher seeing files land, never
from what the model said (ADR-017), so a skill-driven interview with
the app open beside it is the split view with the vendor holding the
chat half. The genesis screen already runs the interview end to end
with a spawned planner and banks the same artifacts (docs/CAPABILITIES.md
§ genesis-screen, § interview).

## Customisation by interview (T-173, planned)

More interview, not a settings screen: the planner drafts the answers
first and the human corrects, and what a project needs configured is
asked as questions whose answers bank into CONVENTIONS and supertaskr.yaml.

## Archaeology (parked, ADR-005)

Adopting an existing project is a different interview
(method/interview/archaeology.md): read the repository, bank what is
found marked `[?]`, and interview the human only about what the code
cannot say. Greenfield is the default; adoption returns when a user
asks for it.
