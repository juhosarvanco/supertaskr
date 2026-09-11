---
id: T-299
title: The process as settings, the schema and the arm — a `process:` section in the runtime template with three profiles and about ten switches, each declared once in a schema with its explanation, its effect, its constraints and the band it is measured by; the arm reads the section at dispatch and merge and refuses a combination the constraints forbid
feature: F-01
milestone: 4
size: M
tier: guarded
priority: 2
status: verifying
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-296]
touches: [method/runtime/supertaskr.yaml, method/runtime/process-schema.yaml, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/merge.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
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

### 2026-09-11 — claude-opus-5@subagent (verifier, phase 2) — APPROVED WITH ASSIGNED CORRECTIONS

Tier **guarded**, the blind two-phase bench. Judged at tip
**f0e96179595213f0cb587bc11e0068e7085039b4** against base
**c16fae29bbadc50837fd3b383fb117ae6051f7c0**, on a detached worktree of its own.

**The sealed inputs, cited.**

| input | sha256 |
|---|---|
| the attack set (phase 1, tool-less, written before the work existed) | `5e785612ba4512716d0c6eb6d5825dc8466231059f43e94a2ca43630640792da` |
| the ground, taken at the base by a script, with the seat's addendum | `cbf6e4929ae5ad062c3c24ad28b1297393d50a5941a581736949a392fe32c142` |
| the card at the base | `4f7aeb6bc6c98f94a08f106be8d1304e56bf244799c6c131ae08265bd44c91b8` |

**The frame I actually had.** Two spawns, genuinely. Phase 1 held no tool and
ran before the diff existed; this spawn is fresh and read the DIFF BEFORE THE
NOTES — the executor's report, the implementation notes and the commit messages
were opened only after every finding below was written and both mutants were
drilled. The dispatch named no executor-derived specific, so phase 1 was not
broken above the line. No ask file exists for this lane.

**Pre-commitments kept (phase 1, part 0).** P1 — criterion 2's *"a forbidden
combination refused by name"* is DEGENERATE as written: the singular article
makes one hardcoded pair satisfy its letter. I graded it against the card's own
title sentence instead, and name the singular as a **spec defect** whether or
not the work exceeded it. It did exceed it, generically. P2 — I did not grade
the number ten; I graded the schema against the room's inventory, supplied
whole as M3. P3 — I graded the drill by kill-set containment and site-aiming,
never the count. P4 — the schema is NOT generated from the room, so the
conformance body compares two independently maintained artefacts; the room file
is untouched by this diff, so one act does not decide both sides. P5 — both
controls I propose below carry their own 2b demonstration, run by me.

#### A row per acceptance criterion

| # | criterion | verdict | the evidence that decided it |
|---|---|---|---|
| 1 | the `process:` section names a profile and its switches; the schema carries, per switch, what it does, how it changes the loop, what it needs on, whether it may be turned off and which band measures it — the ONE source | **MET** | `process-schema.yaml` at the tip: **42 switches, 10 FLOOR, 3 profiles**; the parse REFUSES a row missing any of its ten fields. All **33** room rows carried, plus the floor's ids, plus `ci.per_push_runs` which the room's constraint column names without a row of its own. Band ids resolve against the project's real bands (body: EVERY BAND A SWITCH NAMES IS A BAND). The template's section carries a profile, `available:` and departures and **no explanation of its own** — I grepped the diff for the schema's sentences reappearing in the template or in CONVENTIONS and found none, so "declared once" holds against attack A1.2 |
| 2 | the arm reads the section at dispatch and at merge — tier rules, phase-1 spawn, whole-suite net, regenerations' place, cheap keepers, model per role — and a body shows each switch changing the arm, and a forbidden combination refused by name | **MET, with correction 1** | All six branch on their own switch through one accessor, and the `reads:` column is checked against sites **derived from the arm's own source**, both ways round. I ran the merge verb myself: with the checkout at `standard` the plan carries the four keeper steps; at `guarded-everything` it collapses to an announced `keeper:off` plus the FLOOR preflight. A forbidden combination refuses at exit **3** on both arms and names **both** switches, **both** values and the repair — derived from the schema's `needs:` rows, not an if-ladder, so a **second and third** independent pair refuse for free. Five of the six have a body observing an arm OUTPUT; **the phase-1 spawn's does not — correction 1** |
| 3 | a switch ignored by the arm reds the body for that switch — one mutant per switch, planted where the arm reads it | **MET, with correction 2** | 42 per-switch bodies, each EXECUTING its own data mutant (the resolution with that id dropped) and requiring the refusal to name it. The id list is typed on the spec side and the schema on the tree side, compared both ways, so neither can drift. Kill sets are pairwise non-contained: the shared `switchValue` mutant kills all 42, but each body's own schema-row mutant kills only itself — I drilled one and saw **1 failed / 175 passed**. No snapshot body exists in the diff, so attack A3.7's containment case does not arise. **What the family does not pin is the row's VALUES — correction 2** |

#### What I ran, and what it read

| leg | ref | bodies | exit | verdict |
|---|---|---|---|---|
| parser | f0e96179 | 389 | 0 | GREEN |
| app | f0e96179 | 1171 | 0 | GREEN |
| rust | f0e96179 | 655 | 0 | GREEN |
| e2e (whole) | f0e96179 | 996 | 0 | GREEN |
| `brief.spec.ts` scoped | f0e96179 | 174 | 0 | SCOPED-GREEN |

The whole battery, through the blessed runner from the bench, at the tip under
review. parser, app and rust match the base baseline **exactly** (389 / 1171 /
655 at `5ebdffff`), so no existing body moved; e2e moved 936 to 996, which is
this lane's 60 and nothing else. **No named intermittent fired** — neither
push-guard's minute-boundary body nor the rust grace-reap body.

**On the report's wall clock, re-measured.** The lane's report discloses a 5.4h
e2e reading as a suspended process rather than compute, and says so plainly.
**My own run of the same leg on this bench took about 15 minutes**, which
confirms the disclosure: the 5.4h is a clock, not a cost, and the bands should
not read it as a cycle.

#### The security sweep (step 3, mandatory)

Clean, and this card opens a new input path so the sweep is not a formality.
**No switch value reaches an argv, a command, a spawn argument, a path or a
file operation** — I grepped every accessor call site and every consumer;
`reads:` is a symbol name compared as a string and never invoked, and the
regenerations' place is an enum, never a path. **No dependency was added**: the
arm parses by hand precisely because a packaged script has no devDependencies,
and the hand parser reads only scalars and flow lists — no anchors, no aliases,
no merge keys, no type construction — so the YAML expansion and key-injection
surface does not exist. The real `yaml` library appears only in the spec, where
it is the independent check on the hand parser.

**The privilege attack (A2.10), which I judged REJECT-level in advance: DEFEATED.**
A lane whose diff switched off its own verification would be the whole mechanism
spent on nothing, so I ran it rather than read it. In a shared clone I put a
lane branch whose own tree sets `profile: guarded-everything` and left the
integration checkout at `standard`. The merge printed **`process: profile
standard, 42 switch(es)`** and planned the four cheap keepers. The settings are
read from the checkout being merged INTO, once, before any step is planned —
never from the branch being merged. A lane cannot vote on how it is verified.

**And the refusal stands in front of the irreversible act (A2.6).** With a
forbidden override on the integration checkout, a real (not dry) merge run
returned exit **3**, named both unsatisfied pairs, and left HEAD, the lane
branch and the working tree byte-identical. Exit 3 is `CANNOT_RUN` in this
project's existing vocabulary — distinct from success, from a finding, and from
usage — so no wrapper keying on status can read the refusal as a pass.

I also drove the three malformed-input boundaries by hand: a **misspelled**
switch key in the template, an **override on a FLOOR** switch, and a **value
outside a switch's own set**. Each refuses by name and names the repair; the
floor is neither silently coerced nor honoured.

#### Assigned corrections

Both are properties the implementation **already keeps** and **no body could
see** — the class this project has been bitten by before. Each is carried by a
body I wrote and committed on this bench after this verdict, run RED against an
arrangement lacking the property and GREEN with it, each **RED ALONE**.

**Correction 1 — the phase-1 spawn's switch is proved at the resolver and not
at the arm.** `phase1Owed` is proved three ways over, and the ritual step that
CONSUMES it is observed by nothing. I replaced the step's condition so it
branches on the tier alone — the arm ignoring `verify.phase1`, which is exactly
what it did before this card — and **the entire suite stayed green**. Of the six
behaviours the criterion names, this is the only one whose switch could be
disconnected from the arm in silence, and the criterion asks for a body showing
the switch changing *the arm's behaviour*. My body observes the ACT: a phase 1
brief written to disk, or not written, with the opposite profile as its control.
RED with the mutant at **1 failed / 175 passed**; GREEN restored, `dispatch-brief.mjs`
proved identical by sha256 `53fd6938a3a6cc36f19f3706aa58c279823e0880465585ceda6e22d88a09920a`.

**Correction 2 — the room's rows are compared by id and never by value.** The
conformance body compares ids both ways and is silent on which COLUMN a value
landed in. This project RUNS the `standard` column, so a row transcribed into
the wrong one is this project's loop quietly differing from what the decision
ruled. I verified all 33 rows are in fact correct today — this is an unpinned
property, not a defect in the data — and then planted a data mutant giving one
row the same value in both columns: **1 failed / 175 passed**, and the failure
was my new body alone. Neither side of my body is typed: the room's own table
says whether a row MOVED between its two columns, the schema's own table says
the same, and the two answers are compared as sets, so no mapping between the
two vocabularies is needed and no third copy is created. Restored, schema proved
identical by sha256 `a3e297e1fb01be5d81081ddc63d39743b3f1ead96ec0559e1275a45a7945b629`.

```mutant
correction: the phase-1 spawn's switch is proved at the resolver and not at the arm
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/brief.spec.ts
body: THE ARM'S PHASE-1 STEP READS `verify.phase1` — the brief is written or it is not, and the skip names the switch
message: the arm wrote a phase 1 brief while `verify.phase1` is by-the-seat
--- old
      const owed =
        plan.tierInput.process === undefined
--- new
      const owed =
        true
```

```mutant
correction: the room's rows are compared by id and never by value
file: method/runtime/process-schema.yaml
spec: tools/e2e/tests/brief.spec.ts
body: THE SCHEMA'S TWO COLUMNS MOVE EXACTLY WHERE THE ROOM'S OLD AND RULED COLUMNS MOVE
message: the room ruled these switch(es) changed and the schema gives them one value in both columns
--- old
    cost: "1 to 3 min"
    profiles:
      guarded-everything: "off"
      standard: "on"
--- new
    cost: "1 to 3 min"
    profiles:
      guarded-everything: "off"
      standard: "off"
```

Two corrections, two mutant blocks — no shortfall to explain.

#### The fence, the gates and the undeclared surface

**The fence holds.** Eleven paths changed, every one inside the seven the card
fenced plus `docs/tasks/`. `method/runtime/process-schema.yaml` is a NEW-FILE
RESERVATION under the tracked directory `method/runtime/`, which is what T-287
ruled it; `docs/CONVENTIONS.md` is admissible as a fence token here and the
preflight's census at the base read it as one. `tools/e2e/scripts/brief.mjs` is
fenced and untouched, which is a permission unspent, not a debt.

**No undeclared surface.** There is no `In-fence follow-through` heading and
none is owed: every changed path is an acceptance criterion's work, the four
cards step 6 requires, or the CONVENTIONS bullet that makes the ONE source
findable. The CONVENTIONS change is 28 lines ADDED and none removed, so no
sentence a spec pins verbatim was reworded — the regression class this project
names by name does not arise.

**The four filed cards are legal** — `suggested` status, `suggested_by` with a
measuring ref, `touches:` present, sizes S and M, no absolute path in prose, no
reserved opener. I have filed a fifth, **T-299-s5**.

#### Observations that are not failures

- **Criterion 2's singular article is a spec defect**, pre-committed above: *"a
  forbidden combination"* is satisfied completely by one hardcoded pair. The
  work is generic over the schema's constraint rows and exceeds it, but the
  criterion as written would have accepted far less, and the next card
  rendering from this schema should not inherit the phrasing.
- **`fast` differs from `standard` at exactly one switch** (`record.whole_suite_net`),
  because the room defined it as `standard` plus push batching — which
  `standard` already has on. The schema is faithful to the ruling; the thinness
  is the room's, not this diff's. Worth the owner's eye when the profiles are
  next refined, since a profile that differs at one switch is close to a label.
- **Universality (ADR-024 decision 7) is served in shape and broken in
  packaging**, and the lane found it and filed it as T-299-s2: the schema is not
  in the kit, so an installed project gets a `process:` section and no schema.
  The loader's tolerance then runs the pre-settings loop in silence. The fix is
  outside this fence, the card is correctly filed, and the degradation is
  graceful rather than wrong — so it is not a correction here. **The schema's
  own shape IS universal**: nothing in it names this repository, the costs are
  declared as a project's own readings, and T-300 to T-302 inherit a contract
  that a different project can carry.
- **35 of 42 switches are read by the ledger alone** — rendered and refused
  upon, but branched on by no arm yet. The schema says so honestly in each
  row's `reads:` field rather than claiming a branch, and the body enforces
  that honesty **in both directions**: a switch claiming a symbol with no site
  reds, and a ledger-only switch that an arm quietly starts branching on reds
  too. The lane filed it as T-299-s3. This is the right shape for a card whose
  job was the declaration.

#### Meters

- **Wall clock by phase**: seals and the role file 08:07–08:12 · the diff and
  the tree, before any note 08:12–08:35 · the whole battery 08:12–08:27 (run
  beside the reading; parser, app and rust inside 3 minutes, e2e about 15) ·
  my own probes — the clone, the privilege attack, the merge refusal, the three
  malformed inputs 08:30–08:40 · the correction bodies and their two drills
  08:40–08:55 · the report, the notes and the commit messages, read last,
  08:55–09:00 · the verdict, the card and step 7 from 09:00. About **2 h 20 m**.
- **Context consumed**: about 240,000 tokens of a 15,000,000-token window.
  Against ADR-024's guarded budget of 450K: inside it.
- **Model**: claude-opus-5@subagent, set at session start and never switched.
- **Suites run**: the whole four legs ONCE at f0e96179 (parser 389, app 1171,
  rust 655, e2e 996, all exit 0), plus `brief.spec.ts` scoped four times — once
  clean at 174, once with my bodies at 176, and once per mutant at 1 failed /
  175 passed.
- **Bodies graded**: 3,211 across the four legs at the tip; 60 of them this
  lane's, 2 of them mine.
- **Mutants drilled**: 2, one per assigned correction, each RED ALONE and each
  restored and proved by sha256. The lane's own 19 are its report's claim; I
  re-derived none of them and say so.
