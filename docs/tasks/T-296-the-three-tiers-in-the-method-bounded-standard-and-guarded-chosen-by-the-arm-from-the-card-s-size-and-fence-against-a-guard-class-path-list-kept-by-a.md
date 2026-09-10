---
id: T-296
title: The three tiers in the method — bounded, standard and guarded, chosen by the arm from the card's size and fence against a guard-class path list kept by a test; phase 1 spawned by the arm beside the build and its ground taken by a script; the standard verifier's mode (diff before notes, the rubric, a row per criterion); the executor's criteria echo and self-drill block; the keeper green at the base before dispatch (ADR-024)
feature: F-01
milestone: 4
size: M
priority: 1
status: verifying
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-295]
touches: [method/tasks/TASK-FORMAT.md, method/roles/verifier.md, method/roles/executor.md, method/roles/orchestrator.md, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/card-preflight.mjs, tools/e2e/scripts/merge.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/card-preflight.spec.ts, tools/e2e/tests/merge.spec.ts, tools/e2e/tests/brief-flush.spec.ts, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

Every card today gets the same bench regardless of size, and the seat hand-writes both phases' briefs and takes the ground by hand. The tier is derivable from the card: its size, whether any fenced path is on the guard-class list, whether method text is fenced, and whether a keeper already pins the property. Blocked by T-295 so the verb it dispatches into exists.

## Acceptance criteria

- WHEN a card is dispatched THE arm SHALL classify it bounded, standard or guarded from its size, its fence against the guard-class list (hooks, gates, fences, the parser, the push and gate scripts, method text — a list in the method kept by a body that reds when a guard-class file is not on it) and whether a keeper pins the property, and SHALL print the tier and the reason; a card the arm cannot classify SHALL be refused, never guessed.
- WHEN the tier is standard THE arm SHALL spawn phase 1 tool-less at dispatch beside the executor, take the ground by a script (the fenced files' hashes, the census, the spec's body names, the arm's rendered findings), seal the three inputs by hash, and spawn phase 2 at the stamp with a brief assembled from the card and the tier; WHEN the tier is guarded THE seat's further ground asks SHALL be added by hand and the whole suites run.
- WHEN verifier.md is read THE standard mode SHALL be stated once: the diff before the executor's notes, the rubric (each criterion literally, boundaries, data mutants, the security sweep), a row per criterion with its evidence, corrections as committed bodies with MUTANT BLOCKs; WHEN executor.md is read THE criteria echo before coding and the self-drill block in the report SHALL be stated once; the eval gate SHALL run and the bump SHALL carry its block.
- WHEN a lane is cut THE arm SHALL run the fence's keeper spec at the base first and refuse a red baseline naming the body; WHEN a bounded card's diff at merge exceeds the XS bound THE merge SHALL bump it to standard.
- WHEN TASK-FORMAT.md is read THE tier SHALL be a derived field on the card, written by the arm at dispatch, never by an author.

## Implementation notes

**THE CRITERIA ECHO, written before a line of the implementation** (this
card's own criterion 3, applied to itself). Restated as a checklist:

1. The arm classifies every dispatch bounded / standard / guarded from
   the card's size, its fence against a guard-class list kept by a test,
   and whether a keeper already pins the property; it PRINTS the tier and
   the reason; a card it cannot classify is REFUSED naming what it could
   not read.
2. On the standard tier the arm renders phase 1 tool-less AT DISPATCH,
   takes the ground by a script, seals three inputs by hash, and renders
   phase 2 at the stamp; on the guarded tier the seat's further ground
   asks are added by hand and the whole suites run.
3. verifier.md states the standard mode ONCE; executor.md states the
   criteria echo and the self-drill block ONCE; the eval gate runs; the
   bump carries its block.
4. The arm runs the fence's keeper at the base and refuses a red
   baseline naming the body; a bounded card past the XS bound is BUMPED
   at the merge rather than refused.
5. TASK-FORMAT.md makes `tier:` a DERIVED field, written by the arm at
   dispatch and never by an author.

**WHERE EACH ONE LANDED.**

**Criterion 1 — the classifier.** `classifyTier` in
`tools/e2e/scripts/dispatch-brief.mjs` is a pure function of the card and
the tree. Guard-class outranks every size; L is guarded; XS is the only
size that can reach bounded, and only with every fenced path tracked and
a keeper answered green. Everything else is standard. The three
unreadable things are refusals with their own sentences: no `size:`, a
fence entry that expands to no path, and — for a bounded candidate only —
a keeper question the runner could not answer. The tier and its reason
are printed as step two's own ledger line and again in the block of lane
facts. The guard-class CLASSES live in `method/tasks/TASK-FORMAT.md`
under "The guard-class list" (seven of them, each argued in one line) and
the PROJECT's mapping of them onto paths lives in docs/CONVENTIONS.md's
GUARD-CLASS PATHS bullet — the same split this method already takes for
every lane spelling. The arm reads both and refuses either direction of a
disagreement. The keeper body derives this repository's candidates FROM
THE TREE by a rule that never reads the map (everything under `.claude/`,
`.github/workflows/`, `method/`, `lib/parser/src/`, plus every script in
`tools/e2e/scripts/` whose own name carries gate, guard, fence, lock,
push or landing) and reds naming any candidate no class covers: 61
candidates, 0 uncovered at this tip.

**Criterion 2 — phase 1 at dispatch, phase 2 at the stamp.** The ritual
grew three steps and now has eleven: `keeper` and `tier` in FRONT of the
stamp (a red baseline refused before anything is written, and the tier
stamped INTO the commit the lane inherits) and `phase1` at the end.
`renderPhase1` is a pure function whose parameter list IS the guarantee —
no root, no branch, no ref later than the base — and the arm feeds it the
card as `git show <base>:<card>` returned it, read at the stamp step
before any lane branch exists. The arm cannot spawn a seat and says so in
as many words; what it prints is the line to paste.
`brief.mjs --bench <id>` is the other end: it derives the tip off the
bench worktree and the base off `git merge-base`, writes the ground
(every fenced file's git blob and byte count at the base, the census
section and the body NAMES of every fenced spec, and the arm's own
preflight findings), seals the attack set, the ground and the card at the
base by sha256 into the stamps file, and renders the phase 2 brief from
the card, the tier, the tip and those digests. The guarded tier's
addendum has its own heading in the ground file and the phase 2 brief
names the whole battery for it; the standard tier gets the range's owed
set.

**Criterion 3 — the method text.** `method/roles/verifier.md` gains "The
standard mode, stated once": the diff before the notes, the rubric
(steps 2, 2b and 3 in order rather than re-summarised), a row per
criterion with its evidence, corrections as committed bodies with mutant
blocks, and the owed set rather than the whole battery.
`method/roles/executor.md` gains "The criteria echo, and the self-drill
block". `method/roles/orchestrator.md` 5b gains the tier stamp and the
keeper at the base, and a new 5e says who renders what.

**Criterion 4 — the keeper at the base, and the bump.** The keeper run is
DERIVED from docs/CONVENTIONS.md's blessed gate-runner bullet (the
script, the scoped suite, the `--owning` flag and the verdict token), so
nothing here types a runner path. Its answer is read off the OUTPUT and
not off the exit, and there are three answers, not two: graded green,
graded red, and NOTHING GRADED. That third one matters immediately — the
scoped derivation refuses rather than grades when it cannot place a
fenced path, and a fence naming method text is the ordinary case, so a
dispatch that read the exit alone would report every guarded card's
baseline as red. At the merge, `xsBoundFinding` became `xsBoundBump`: the
step passes, prints the bump, and writes `standard` onto the object the
readings step reads, so the band reading carries the bumped tier with
nobody typing `--tier`. The merge also now reads its tier off the card by
default.

**Criterion 5 — the derived field.** `tier:` is in TASK-FORMAT's
frontmatter block with the rule beside it, and both halves are enforced
in different places on purpose: the card preflight REPORTS a tier on an
undispatched card (where deleting a line is still the whole fix), and the
dispatch OVERWRITES whatever is there and announces the overwrite when
the two disagree. `stampCard` gained a per-key, anchored creation opt-in
so the field can be written onto a card whose template does not carry it;
every other missing key still refuses exactly as before.

**THE CLOSING BATTERY FOUND ONE RED AND IT WAS MINE.** The guard-class
map spelled `gate-run.mjs`, and `gate-run.spec.ts` requires
docs/CONVENTIONS.md to name the blessed runner in exactly ONE place — a
body in a file this fence does not name, redding on a line this fence
does. The map now matches the runner by SHAPE (a trailing `*` prefix
token) rather than by filename, which is the honester statement anyway:
what makes a file guard-class is being a gate runner. The trap is now
pinned where the map is written, so the next lane to touch it learns
before its battery rather than after.

**In-fence follow-through**

- `tools/e2e/tests/brief.spec.ts`, "the tier line is CREATED where a card
  has none" (about 12 lines): the drill found this body's arming-absent
  assertion passing for the WRONG REASON — the mutant it was meant to
  kill throws the same error CLASS from one branch further on, so the
  body now names the SENTENCE. The property is unchanged; what moved is
  whether the body can tell the two refusals apart.
- `tools/e2e/tests/brief.spec.ts`, the ritual's per-step harness (about
  30 lines): the two step numbers it typed (`> 6`, `> 2`) are now derived
  from `DISPATCH_STEPS`, because this card put three steps into that
  ritual and a typed number would have moved silently under them.

**What the verifier should look at hardest.** The keeper step's third
answer (nothing graded) is the branch that decides whether a guarded
card's dispatch proceeds, and it is decided by the ABSENCE of a verdict
line — a shape a mutant can make vacuous. The classifier's bounded branch
is the one with the smallest kill set: three conditions, each of which
falls to standard, and only the unanswered-keeper case refuses.

## The method bump, for the integrator

Four method files moved in this lane — `method/tasks/TASK-FORMAT.md`,
`method/roles/verifier.md`, `method/roles/executor.md` and
`method/roles/orchestrator.md` — so the METHOD EVAL GATE fires at this
merge and the method version moves with it. The version at the base is
`v0.1.20`, read out of docs/CONVENTIONS.md's own stamp line rather than
remembered, and the verb performs the bump:

    node tools/e2e/scripts/brief.mjs --merge T-296 --bump 0.1.20..0.1.21

The three stamp files are `merge.mjs`'s own `METHOD_STAMP_FILES` and are
not re-listed here. The gate was run in the lane and answered 0 over 11
model-free evals at the lane's tip; the merge's own run is the one that
grades the merged tree, and the block above is what tells it which
version to move to.

## Meters

- wall clock: about 100 minutes end to end, read off the session's own
  timestamps: the standing read and the design against the room's tier
  table 20 min; the method text 15 min; the arm, the classifier, the two
  renderers and the bench 30 min; the bodies 15 min; the drill and the
  battery 20 min.
- tier: guarded (the fence names method text and five guard-class paths).
- the self-drill: 16 mutants, 16 red, 16 restored and proved by sha256 —
  one of them only after the body it drilled was corrected, which is the
  drill earning its place rather than confirming it.

## Verdicts
