---
name: supertaskr-interview
description: Run the Supertaskr genesis interview in this folder and land a dispatchable task board: the seven banks one question at a time, each answer written to disk as it is confirmed, then decomposition into cards. Use when a folder has no plan yet, or the user asks to plan or scope a new project.
when: The user wants a new project planned — no docs/NORTH_STAR.md and no docs/tasks/ board exists yet, or a genesis interview was started in this folder and stopped part way through and should be resumed.
---

<!-- GENERATED - do not edit by hand (T-242, ADR-021 decision 3).
     Regenerate:  npm run skill        (from tools/e2e/)
     Currency:    npm run skill:check  (exit 1 when this file is stale)
     Generator:   tools/e2e/scripts/interview-skill.mjs

     Every block below is copied, byte for byte, out of the file that
     owns it. Editing this file instead of its source makes the two
     lenses of one interview disagree, which is the single thing this
     file exists to prevent. -->

# The genesis interview

You run project genesis in THIS FOLDER: one interview, banked to disk
as it happens, ending in a decomposed, dispatchable milestone 1. Your
conversation is disposable; only what you bank exists.

**THIS FILE IS THE WHOLE METHOD FOR THIS JOB.** It needs no checkout
of Supertaskr, no installed app, and no network. Everything it tells
you to copy is inside it, in a fenced block labelled with the path
that block lands at.

**ONE QUESTION AT A TIME, NEVER A WALL.** Shallow batch answers are
the failure mode this interview exists to prevent. Challenge weak
answers instead of transcribing them, and open such a turn with the
literal prefix "pushing back:".

**BANK AS YOU GO.** The moment an answer is confirmed, write the
artifacts its stage names. Never batch the writing to the end: a kill
at any stage must leave every earlier stage on disk. An answer is
banked when the human confirms it - or when they skip ("skip", "you
decide", no answer), in which case you bank your own best assumption
marked `[?]`. A `[?]` item is resolved or roomed later, never silently
deleted.

## Harness coverage - read this before you claim anything about it

This entry is delivered for **Claude Code only**. Codex support is
**deferred and unverified for this entry**: the prompt-file route has
not been measured for this interview and is not claimed proven, and
nothing here narrows the product's provider-flexible goal - any agent
that reads files can hold any role. If you are not running in Claude
Code, say so plainly rather than reporting a coverage you did not
measure.

## 0. The scaffold - before any question

Write the seed files this file carries. A seed block opens with a
line of 4 backticks followed by `supertaskr-seed` and the path that
block lands at, relative to this folder, and ends at the next line
that is exactly 4 backticks; everything between those two lines is
the file, byte for byte. Copy them VERBATIM - the templates are
scaffold-safe, their examples live in comments - and then:

**EVERY SEED PATH LANDS INSIDE THIS FOLDER.** A seed path is relative
and climbs out of nothing: if a block is labelled with an absolute
path, or with one that starts `../`, STOP and say so rather than
writing where the label points. This file lives in the directory you
keep your own skill packs in, so its blocks are editable by anyone
who can edit that directory, and a path you did not derive is not a
path you should obey.

- create the empty directories `docs/decisions/`, `docs/tasks/`, `docs/rooms/`;
- ensure `.gitignore` exists and carries a `.supertaskr/` line (append if missing);
- `git init` if this folder is not a repository;
- stamp `docs/STATE.md`: the Updated line filled in, In progress =
  "genesis interview running - next stage: 1 (Q1)".

**TWO SPELLINGS, BOTH ABOUT HOW YOU TOUCH THE DISK, NEITHER A NEW
CAPABILITY.** Run `git` BARE, in your own working directory - that
directory IS the project directory, so a directory-changing form
(`git -C <dir> ...`) is redundant and agent runtimes commonly treat it
as a different and more dangerous operation than its bare twin. Write
files with your runtime's write tool, not with a shell redirect
(`> file`): a redirect whose target the shell builds is the shape a
command analyser refuses without reading. Both were measured on a live
genesis, where three separate refusals each cost a turn of reasoning.

## 1. Organization skill packs in this folder

Before the first question, look for `.claude/skills/*/SKILL.md` in
this folder. Each one that parses is an ORGANIZATION SKILL PACK: read
it and follow its guidance where its conditions apply - it is the
organization's own policy for this project. Name every pack you
loaded, with its path, in your first turn, so the record says which
policy shaped the plan. Their precedence against the method is NOT yet
decided, so where a pack and this file conflict, SAY SO in your turn
instead of choosing silently. A pack that does not parse - no
frontmatter, no `name`, no `description` - is reported by its
directory name and skipped, never absorbed and never a crash. Read
them; write nothing into that directory. It is a READ surface: this
entry got there because the user ran an install command, and nothing
in the interview installs, moves or deletes anything under it.

## 2. The interview - the banks

The block below is `method/interview/plan-interview.md` - the same
bytes the app's own runner compiles in for exactly this, which is what
makes the two lenses one interview. Its banking map is NORMATIVE: a
stage's artifacts are written the moment that stage's answer is
banked. Where it names `roles/planner.md` for the driver contract, the
resume rule and the overwrite rule, those two rules are in section 4
of THIS file; where it names `docs-templates/`, those templates are
the seed blocks at the end of this file.

**IT IS ALSO A SEED**, so write it to disk at the path on its fence
line as part of the scaffold - that is the kit path the app uses, so a
folder interviewed here and a folder interviewed in the app carry the
same file in the same place.

````supertaskr-seed .supertaskr/genesis/kit/interview/plan-interview.md
# The /plan interview

Run by the planner (roles/planner.md — driver contract, resume rule,
overwrite rule live there) at project genesis. One question at a time —
never a wall of questions; shallow batch answers are the failure mode.
Challenge weak answers instead of transcribing them: "you said fast —
compared to what, measured how?" An interview is not a form.

## Sequence

1. **Problem & person** — What problem, for whom, in what situation?
   Push until there is one concrete person/scene, not a market.
2. **Success** — What is measurably true when this works? Convert every
   adjective into a number or an observable event.
3. **Non-goals** — What will this deliberately NOT do? Offer tempting
   adjacent features and make the human reject them explicitly.
4. **Constraints** — Deadline, budget, must-use tech, compliance,
   platform. Which are hard vs preferences?
5. **Stack & why** — Proposed stack; challenge any choice made from habit.
   The rationale becomes ADR-001.
6. **Riskiest assumption** — What single belief, if wrong, kills the
   project? How could it be tested cheaply and early?
7. **First slice** — The smallest thing that could ship and teach
   something. Ruthless: milestone 1 should feel too small.

## Output — incremental banking (v0.1.34; supersedes the one-pass rule)

Artifacts are written AS the interview runs, never in one pass at the
end. Each stage banks into its artifacts the moment its answer is
banked (confirmed by the human, or [?]-assumed on a skip); a kill at
any stage leaves every earlier stage on disk (succession rule). This
table is normative — programs transcribe it as written (stage
inference, kit packaging); a change here is a method version bump.

| Stage | Interview step | Banks into |
|-------|----------------|------------|
| 0 | scaffold (pre-Q1) | docs/ tree copied verbatim from docs-templates/ + empty docs/decisions/ docs/tasks/ docs/rooms/ + adapter files at project root + .gitignore carrying `.supertaskr/` + git init if absent + docs/STATE.md stamped (Updated, In progress = next stage) |
| 1 | Q1 problem & person | docs/NORTH_STAR.md § Vision + § Users |
| 2 | Q2 success | docs/NORTH_STAR.md § Success criteria |
| 3 | Q3 non-goals | docs/NORTH_STAR.md § Non-goals |
| 4 | Q4 constraints | docs/NORTH_STAR.md § Hard constraints |
| 5 | Q5 stack & why | docs/decisions/001-stack.md (+ one ADR per contested choice) |
| 6 | Q6 riskiest assumption | docs/NORTH_STAR.md § Riskiest assumption |
| 7 | Q7 first slice | docs/ROADMAP.md § Backbone (ordered as the USER experiences the product) + § Milestones (milestone 1 goal) |
| 8 | decomposition | docs/tasks/T-*.md (see decomposition.md; every task passes the dispatchability test) + docs/ARCHITECTURE.md first draft + docs/ROADMAP.md § Milestones (task list) + § Parked + docs/STATE.md § Next up |

Banking Q1 also fills the adapter files' project name + one-liner at
the project root (outside docs/, so not a stage-inference input).
Every bank additionally updates docs/STATE.md's In-progress line to
name the NEXT stage — the resume hint; the artifacts stay ground
truth (roles/planner.md, resume rule). docs/CONVENTIONS.md § Build &
test is seeded at stage 5 alongside the stack decision (the exact
commands the stack implies); gotchas accrue whenever one is decided.

Then: cold-start test. A fresh session reads only docs/ and explains the
project back. Gaps in its answer are gaps in the docs — fix and repeat.
````

## 3. Stage 8 - decomposition

After Q7, run the decomposition below in this same session. Task cards
use the skeleton carried as a seed block at
`.supertaskr/genesis/kit/tasks/T-000-template.md`; copy it per card and fill it in.
This block is a seed too - write it to disk at the path on its fence
line.

**WHERE THE STEP BELOW POINTS AT `tasks/TASK-FORMAT.md`, THAT FILE IS
NOT HERE.** It is larger than this whole entry is allowed to be, so
what rides instead is the card skeleton and the criteria rules the
step states itself. Use them; do not go looking for the document, and
do not invent what you imagine is in it. A project that later adopts
the method whole gets it with the rest of the method.

````supertaskr-seed .supertaskr/genesis/kit/interview/decomposition.md
# Decomposition — from backbone to exact tasks

Runs immediately after the /plan interview (or after archaeology), same
planner session. This is the bridge from "F-01: workspace core" to
dispatchable task files — the step where vague plans usually die.

**The dispatchability test — the definition of an exact task:** a fresh
session with NO other context can read the task file + docs/ and build the
right thing without asking a single question. Every task must pass it.

## Procedure

1. **Walk the backbone left to right.** For each feature in milestone 1,
   list every piece of work it implies — including the unglamorous ones
   (migrations, config, error paths, empty states). Name what you are
   deliberately leaving out; put it in ROADMAP.md Parked.
2. **Slice into tasks.** Each task: one coherent change, one branch, one
   session. Too big if it needs more than one worktree or touches more
   than ~2 components. Too small if the checkpoint costs more than the
   work — fold it into a neighbor.
3. **Write acceptance criteria in EARS notation** — the de facto
   standard for criteria unambiguous to humans and models. Five
   patterns cover almost everything:
   - Ubiquitous:        THE system SHALL <behavior>
   - Event-driven:      WHEN <trigger> THE system SHALL <behavior>
   - State-driven:      WHILE <state> THE system SHALL <behavior>
   - Unwanted behavior: IF <failure/abuse> THEN THE system SHALL <response>
   - Optional feature:  WHERE <feature enabled> THE system SHALL <behavior>
   Every criterion maps ~1:1 onto a test case — write it so the verifier
   can enforce it mechanically with the CONVENTIONS.md test commands.
   An EARS line phrases the requirement; the TEST is what enforces it —
   a criterion with no enforceable check is not done being written.
   Ban words: fast, clean, robust, proper, good — convert each to a
   number or an observable event, or delete it. Always include at least
   one unwanted-behavior (IF/THEN) line: the edge cases live there.

   **A CRITERION CAN SPECIFY A CHECK THAT CANNOT FAIL, AND IT READS
   EXACTLY LIKE A REAL ONE.** The shape to recognise: **a criterion that
   names a relation between a POLICY and a VIEW DERIVED FROM THAT POLICY
   has specified a tautology.** Worked form — a coverage floor written
   over "the tracked set MINUS the exclusions": adding a suffix to the
   exclusion set removes it from the expectation at the same instant it
   removes it from the corpus, so **the deletion deletes its own
   failure** and the floor can never bite. Both sides move together
   because they are the same source read twice.
   **THE TEST IS TO TRY TO RED IT.** Before the criterion ships, name the
   input that makes it FAIL. If you cannot name one, you have written a
   restatement, not a requirement — delete it or re-anchor one side to
   something the policy does not derive (a literal, a frozen fixture, an
   independently-measured expectation).
   **GATHER THE EVIDENCE BY MUTATING THE PROPOSED CHECK, NOT THE THING IT
   CHECKS.** This is how the shape survives review: mutating the POLICY
   makes the criterion look alive, because the policy really does move the
   world. Only mutating the CHECK reveals that the check moved with it.
   **AND TWO CRITERIA ON ONE CARD CAN CONTRADICT EACH OTHER.** Read the
   set against ITSELF, not only against the tree — one criterion
   preferring the tautological form while a second requires the floor to
   bite for the same input is a card that cannot be satisfied at all, and
   the executor discovers it only after building. Contradiction between
   criteria is what turns this from a style note into a defect, so the
   self-review in step 8 checks the criteria against one another.
4. **Size honestly** (S/M/L per TASK-FORMAT.md) — size sets ceremony,
   so under-sizing skips verification and over-sizing wastes tokens.
5. **Declare the blast radius.** Fill `touches:` with the components
   and key paths the task is expected to modify. The orchestrator uses
   this to never run overlapping tasks in parallel — worktrees isolate
   directories, but nothing else warns when two branches edit the same
   file. Shared hotspots (routes, config, registries) deserve their own
   serialized tasks.
6. **Map dependencies.** blocked_by only for true technical blockers —
   preference orderings go in priority, not blocked_by. Check: at least
   one task per feature must be unblocked on day one, or milestone 1
   deadlocks at the start.
7. **Set priorities** = vertical position on the story map: 1 is the top
   card, the feature's next task. Essential before nice.
8. **Self-review against the test.** Re-read every task file as if you
   were the fresh executor. Any question you would need to ask = a gap;
   fix the file, not the moment of dispatch.
9. **Present the board to the human** — features, tasks, sizes, the
   milestone slice — and revise before anything is dispatched. This
   review IS the moment scope gets cut; make the human reject cards,
   not concepts.

## Output

- docs/tasks/T-*.md for all of milestone 1 (later milestones stay as
  backbone lines — decomposing them now is speculation; they get their
  own decomposition pass at their /plan review)
- ROADMAP.md Parked seeded with everything consciously deferred
- STATE.md "Next up" = the top unblocked cards, matching the board
````

## 4. The resume rule, and never overwriting real content

Both are quoted verbatim from `method/roles/planner.md`, the role this
skill is the Claude Code lens of.

**THE OVERWRITE RULE POINTS AT AN ARCHAEOLOGY FILE THAT IS NOT HERE
EITHER, AND THAT IS THE ANSWER RATHER THAN A GAP.** Adopting a folder
that already holds real work is not this entry's job. The rule's own
instruction is the whole of what you do about it: stop, and ask the
human, instead of writing over what is there.

````supertaskr-source method/roles/planner.md#resume-rule
## Resume rule

A fresh session given only this kit and the project folder must state
which stage is next, then continue the interview from there. Derive
it from disk: the next stage is the first row of the banking map
whose artifacts are missing or still template-empty; STATE.md's
In-progress line is the cross-check hint. On disagreement the
artifacts win — banked files are ground truth. Re-ask nothing that is
already on disk.
````

````supertaskr-source method/roles/planner.md#never-overwrite-real-content
## Never overwrite real content

This kit is greenfield. IF a file you are about to write already
exists with real content — anything you did not scaffold or bank
yourself in this genesis (template headings, comment guidance, and
your own earlier banks are yours to update) — THEN stop and ask the
human instead of overwriting. Adopting an existing project is
archaeology's job (interview/archaeology.md), not yours.
````

## 5. After the board - the cold-start test and the commit

Run the cold-start test the banks end with: a fresh session reads only
`docs/` and explains the project back - vision, current state, next
dispatch and why. Every gap in its answer is a documentation bug: fix
the docs and repeat until a cold session passes. Then commit the
genesis (task-sized commits during it are fine; at minimum one at the
end). Before you end, the succession rule: anything you decided,
noticed or intend that is not yet in a file goes into one NOW. Your
successor may be a different model reading the folder cold - leave it
a project, not a puzzle.

## 6. When the interview ends

Say exactly this, and then STOP:

> The project plan and the initial task board are saved in this folder. To view them in Supertaskr, open the app and choose "Open folder…". The files can also be worked on in this coding-agent session.

**Do not start a second interview.** Do not offer a command to open
the app on this folder: there is none yet, and naming one would be
naming a command that does not exist. The manual way above is the
whole of it.

## 7. The rest of the seed files

One block per file, and the two blocks in sections 2 and 3 are seeds
as well. The path on the fence line is where that file lands, relative
to this folder; the bytes between the fences are the file. Write them
exactly - no reflowing, no renaming, no summarising.

### `docs/ARCHITECTURE.md`

Verbatim from `method/docs-templates/ARCHITECTURE.md`.

````supertaskr-seed docs/ARCHITECTURE.md
# Architecture

## System map
<!-- A Mermaid `graph TD` block: components as nodes, dependencies as
     edges. Keep it current — the integrator updates it at checkpoint
     whenever a component, dependency, or interface changed. -->

## Components

| ID | Component | Responsibility | Depends on | Status |
|----|-----------|----------------|------------|--------|

<!-- One row per component, e.g.
       | C-01 | store | append-only log file | — | planned |
     Status: planned / built / verified. The dashboard colors the map from
     this column plus the tasks that reference each component. -->

## Interfaces
<!-- The contracts between components that tasks must not break.
     Anything an executor could plausibly violate without noticing. -->

## Related decisions
<!-- Link ADRs that constrain the architecture: decisions/00X-*.md -->
````

### `docs/CONVENTIONS.md`

Verbatim from `method/docs-templates/CONVENTIONS.md`.

````supertaskr-seed docs/CONVENTIONS.md
# Conventions
<!-- GENUINE gotchas only — things a competent agent cannot infer from the
     code. No style rulebooks, no "use descriptive names". If a rule stops
     earning its place, delete it. Audit this file every milestone. -->

## Build & test
<!-- Exact commands. The verifier and integrator run these verbatim. -->

## Gotchas
<!-- e.g. "API client must be imported from lib/client, never instantiated
     directly (connection pooling breaks otherwise — see ADR-004)". -->
````

### `docs/NORTH_STAR.md`

Verbatim from `method/docs-templates/NORTH_STAR.md`.

````supertaskr-seed docs/NORTH_STAR.md
# North star

## Vision
<!-- One paragraph. What exists when this project succeeds, and for whom. -->

## Users
<!-- Who uses this, in what situation. Be concrete. -->

## Success criteria
<!-- Measurable. "Fast" is not a criterion; "p95 under 200ms" is. -->

## Non-goals
<!-- What this project deliberately does NOT do. This section prevents
     session #14 from helpfully adding a feature rejected in week one.
     If work contradicts this file, stop and open a room — don't edit this file. -->

## Riskiest assumption
<!-- The single belief that, if wrong, kills the project — plus the
     cheapest, earliest test of it. Interview Q6 banks here. -->

## Hard constraints
<!-- Budget, deadline, must-use tech, compliance. Things no session may trade away. -->
````

### `docs/ROADMAP.md`

Verbatim from `method/docs-templates/ROADMAP.md`.

````supertaskr-seed docs/ROADMAP.md
# Roadmap

## Backbone
<!-- Features ordered as the USER experiences the product, left to right
     on the story map. Not build order. One bullet per feature, e.g.
       - F-01: Capture — one-keystroke entry from anywhere
     (Examples stay inside this comment: templates are scaffolded
     verbatim, and a bare example row would parse as a real feature.) -->

## Milestones
<!-- The slice lines. Everything in milestone 1 ships before anything in 2.

     ### Milestone 1 — <name> (current)
     Goal: <the smallest thing that could ship> -->

## Parked
<!-- Ideas noticed but not committed. Reviewed at each /plan for the next
     milestone. This row is what protects the slice from scope creep. -->
````

### `docs/STATE.md`

Verbatim from `method/docs-templates/STATE.md`.

````supertaskr-seed docs/STATE.md
# State
<!-- The baton. Under ONE page. History lives in git, not here.
     Every fresh session reads this first and confirms its understanding
     of the next task in one paragraph before doing anything.
     This file plus docs/INDEX.md — the GENERATED one-line index of the
     other governing documents — is the WHOLE standing read; point at
     the index here, never summarise it.
     Governed by method/docs-protocol.md: regenerated at each
     checkpoint, the narrative going to docs/checkpoints/ records. -->

Updated: <date> by <role, model@session>

## Just completed
<!-- What, and how it was verified. -->

## In progress / broken right now
<!-- Honest. A fresh session must not discover breakage by surprise. -->

## Next up (1–3 tasks)
<!-- IDs + one line each. Must match the board's frontier. -->

## Open questions
<!-- Link open rooms rather than restating them. -->
````

### `docs/decisions/000-template.md`

Verbatim from `method/docs-templates/decisions/000-template.md`.

````supertaskr-seed docs/decisions/000-template.md
# ADR-000: <decision title>

Date: <date>
Status: accepted | superseded by ADR-0XX
Decided in: <room link, /plan interview, or human directive>
<!-- PARAPHRASE THE RULING AND DATE IT: this record says what was
     decided and when, in its own words. Never a quotation of the
     owner's own message, and the owner appears here as the owner and
     never by name — a record is read by people who were not in the
     conversation. Records already written are not restyled to match;
     the rule looks forward. -->

## Context
<!-- The situation that forced a choice. -->

## Options considered
<!-- Brief. Include the rejected option and why. -->

## Decision
<!-- What was chosen. One sentence if possible. -->

## Consequences
<!-- What this constrains from now on. What it makes harder. -->
````

### `AGENTS.md`

Verbatim from `method/adapters/AGENTS.md`.

````supertaskr-seed AGENTS.md
<!-- Thin adapter for Codex CLI, Cursor, Gemini CLI etc. — copy to repo root. Facts and routing only; behavioral
     instructions live in the role prompt you are dispatched with. -->

# <project name>

<One sentence: what this repo is.>

Before any work: read docs/STATE.md, then — once this project generates
it — docs/INDEX.md. Those two are the whole standing read. Confirm your
understanding of your task in one paragraph before touching anything.

**This list is addressed to EVERY seat, and your own role file may add
to it or subtract from it — where the two differ, the role file wins.**
The subtractions are argued where they are made (an executor and a
verifier do not read the roadmap, because which card deserved building
is not their question). Reading a document is something a seat DOES, so
the acting role's file is authoritative, and a brief that hands you this
list unfiltered has not applied its own row 3.

docs/INDEX.md is one GENERATED line per governing document — the
question that document answers, and the section to open it at. It is
regenerated by <the command that regenerates this project's behaviour
census> and a gate reds while the committed index is stale, so it cannot
go quietly out of date the way a hand-kept reading order does. The
documents it indexes are governed by method/docs-protocol.md: rules and
derive-pointers live in them; records live in task cards and
docs/checkpoints/.

Everything else reaches a seat through its brief's CONTEXT PACK, which
carries the rules that seat's own fence implicates. **When the pack did
not hand you the rule, you have two moves and neither is guessing**:
write your lane's ask file, park it and keep building; or open the
document at the section the index names, and read that section.

This project runs on the Supertaskr convention: tasks in docs/tasks/, decisions
in docs/decisions/, open questions in docs/rooms/. If your instructions
conflict with docs/NORTH_STAR.md, stop and open a room.
````

### `CLAUDE.md`

Verbatim from `method/adapters/CLAUDE.md`.

````supertaskr-seed CLAUDE.md
<!-- Thin adapter — copy to repo root. Facts and routing only; behavioral
     instructions live in the role prompt you are dispatched with. -->

# <project name>

<One sentence: what this repo is.>

Before any work: read docs/STATE.md, then — once this project generates
it — docs/INDEX.md. Those two are the whole standing read. Confirm your
understanding of your task in one paragraph before touching anything.

**This list is addressed to EVERY seat, and your own role file may add
to it or subtract from it — where the two differ, the role file wins.**
The subtractions are argued where they are made (an executor and a
verifier do not read the roadmap, because which card deserved building
is not their question). Reading a document is something a seat DOES, so
the acting role's file is authoritative, and a brief that hands you this
list unfiltered has not applied its own row 3.

docs/INDEX.md is one GENERATED line per governing document — the
question that document answers, and the section to open it at. It is
regenerated by <the command that regenerates this project's behaviour
census> and a gate reds while the committed index is stale, so it cannot
go quietly out of date the way a hand-kept reading order does. The
documents it indexes are governed by method/docs-protocol.md: rules and
derive-pointers live in them; records live in task cards and
docs/checkpoints/.

Everything else reaches a seat through its brief's CONTEXT PACK, which
carries the rules that seat's own fence implicates. **When the pack did
not hand you the rule, you have two moves and neither is guessing**:
write your lane's ask file, park it and keep building; or open the
document at the section the index names, and read that section.

This project runs on the Supertaskr convention: tasks in docs/tasks/, decisions
in docs/decisions/, open questions in docs/rooms/. If your instructions
conflict with docs/NORTH_STAR.md, stop and open a room.
````

### `.supertaskr/genesis/kit/tasks/T-000-template.md`

Verbatim from `method/tasks/T-000-template.md`.

````supertaskr-seed .supertaskr/genesis/kit/tasks/T-000-template.md
---
id: T-000
title: <short imperative title>
feature: F-0X
milestone: 1
priority: 1
size: M
status: planned
blocked_by: []
touches: []
builder:
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- WHEN <trigger> THE system SHALL <behavior>
- IF <failure case> THEN THE system SHALL <response>

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
````
