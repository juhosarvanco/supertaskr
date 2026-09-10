---
id: T-299
title: The process as settings, the schema and the arm — a `process:` section in the runtime template with three profiles and about ten switches, each declared once in a schema with its explanation, its effect, its constraints and the band it is measured by; the arm reads the section at dispatch and merge and refuses a combination the constraints forbid
feature: F-01
milestone: 4
size: M
tier: guarded
priority: 2
status: building
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-296]
touches: [method/runtime/supertaskr.yaml, method/runtime/process-schema.yaml, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/merge.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

The runtime template already carries role defaults; the loop's options ruled in ADR-024 are switches with dependencies (the tiers need the fence hook and the owed-set token) and a floor that cannot be switched off (the fence, the token and guard, the landing gate, records never rewritten).

## Acceptance criteria

- WHEN the runtime template is read THE `process:` section SHALL name a profile (fast, standard, guarded-everything) and the switches under it, and the schema beside it SHALL carry, per switch, what it does, how it changes the loop, what it needs on, whether it may be turned off, and which band measures it — the ONE source every renderer reads.
- WHEN the arm dispatches or merges THE tier rules, the phase-1 spawn, the whole-suite net, the regenerations' place, the cheap keepers and the model per role SHALL be read from the section, and a body SHALL show each switch changing the arm's behaviour and a forbidden combination refused by name.
- WHEN a switch is ignored by the arm THE body for that switch SHALL red — one mutant per switch, planted where the arm reads it.

## Implementation notes

**What landed.** `method/runtime/process-schema.yaml` is new and is the
ONE declaration: 42 switches, 10 of them FLOOR, under three profiles
(`guarded-everything`, `standard`, `fast`). Every switch answers ten
fields, and the field list is the criterion's own question set: `what`
it does, `effect` how it changes the loop, `reads` which arm symbol
consults it, `needs` its constraints, `floor` whether it may be turned
off, `band` which band measures it, `cost` what this project measured,
plus `type`, `values` and the three `profiles` columns. A switch missing
one of them REFUSES the parse, because a schema row with a blank in it
is a settings screen with a blank in it. The runtime template grew a
`process:` section naming the profile this project runs, the three that
exist, and the switches it departs from; it carries no explanation of
its own, and this project departs from `standard` at no switch today.

**What the schema was built from.** The loop room's switch inventory,
33 rows plus the floor sentence. The schema carries all 33, the floor's
own ids, and one more: `ci.per_push_runs`, which the room's constraint
column names for `push.batching` without giving it a row of its own. A
body parses the room's table and requires the two to agree both ways
round, so a row ruled there and missing here reds, and a switchable
option invented here that neither the room nor a constraint names reds
too.

**Where the arm reads it.** Six behaviours branch on a switch, each with
a body showing the switch changing the arm rather than describing it:
`classifyTier` on `verify.tier` (at `guarded-for-every-card` the whole
size ladder is switched off and every card takes the guarded tier);
`phase1Owed` on `verify.phase1` (by-the-arm, by-the-seat and off are
three different answers, and the bounded tier is owed none); the brief's
model row on `dispatch.model_per_role` (at `by-hand` the arm names no
model and says so, rather than reading the template anyway);
`wholeSuiteNet` on `record.whole_suite_net`; `regenPlace` on
`merge.regen_graph` and `merge.regen_census` (by-the-arm is a graded
step, by-the-seat is a STOP naming what is owed); and `keeperSteps` on
`merge.keepers` (off leaves the card's own preflight standing, because
`dispatch.preflight` is FLOOR). Every read goes through one accessor,
`switchValue`, and a switch the resolution dropped is a refusal there
rather than an `undefined` that reads as false.

**The forbidden combinations.** A constraint reads `<this value> => <other
id>=<value>`, with a star for every value and a pipe for alternatives.
An unsatisfied one names BOTH switches and BOTH values, and the arm
REFUSES: the dispatch context refuses before a row is assembled, and the
merge verb refuses before a worktree is removed or a merge is staged.
Three are reachable and all three are drilled: the net switched off
while `verify.suites` and `ci.owed` need it, `merge.meters_to_bands` on
with `record.bands` off, and `push.batching` on against per-merge CI
runs. An override on a FLOOR switch is a fourth refusal, by name, for
every one of the ten.

**Nothing else moved, and that is asserted.** The `standard` profile
reproduces the merge plan this verb built before the switches existed,
step for step, over four different path sets; a caller that passes no
settings at all gets the same plan. `keeperSteps` and `tailPlan` take
the settings as an OPTIONAL input for that reason, and because
`tools/e2e/tests/merge.spec.ts` calls both and is outside this fence.

**Why the parser is by hand.** These scripts are what the CLI packages
and the genesis installs, and a package's dev dependencies are not there
when it is installed; the `roles:` block above it is parsed the same way
for the same reason. The e2e suite parses the SAME file with a real YAML
library and requires the two readings to agree field for field, so the
hand parser is checked against a parser it shares no line with.

**One body per switch, and the mutant executed rather than described.**
The third criterion asks that a switch the arm ignores reds ITS OWN
body. The arm reads every switch through one accessor, so "ignored" has
a single shape, and each of the 42 bodies builds the resolution with its
own switch dropped and requires the refusal to name it. A table of 42
hand-planted mutants would have been 42 chances to plant the wrong one.
The switch id list is TYPED in the spec and compared to the schema both
ways, so a switch added without a body reds by name.

**Gates derived from this diff.** GRAPH REGEN fires (`.mjs` and `.ts`
outside docs). METHOD EVAL GATE fires (`method/` moved) and the bump is
owed: `--bump 0.1.22..0.1.23`. DOCS GATE fires on `docs/CONVENTIONS.md`
and names `cargo test from app/src-tauri/` and `npm test from tools/e2e/`.
BOOT GATE is NOT owed: the diff touches no path under the app's source
or either manifest. The docs gate also reports the budget WARN on
`docs/CONVENTIONS.md`, which was already past its warn line at the base
and is 1,976 bytes further past it now; that is the standing condition
T-296-s2 holds, not a new one, and the fail line is far off.

**The self-drill.** 19 mutants, each in the PRODUCER and never in an
assertion, each shown green first, then RED, then restored and proved by
a content hash. Recorded under the report's own drill block.

**What I did not do.** No new flag on the brief command: a flag owes an
entry in the flush suite's arm list, and that file is outside this
fence. No regeneration of the behaviour census or the index: adding
bodies moves both and the regeneration is the merge's, in the merge
commit. The four cards below are what I noticed and left.

## Verdicts

**The switch inventory** — every step of the ceremony as a switch with its old and ruled values, costs and constraints — is recorded in docs/rooms/loop-cost-and-speed.md (appended 2026-09-10) and is this card's input; the schema SHALL carry every row and the floor.
