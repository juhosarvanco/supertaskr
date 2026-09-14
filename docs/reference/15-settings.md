# 15 — Settings

<!-- GENERATED — do not edit by hand (T-300, ADR-024 decision 6).
     Regenerate:  node tools/e2e/scripts/settings.mjs reference --write
     Currency:    tools/e2e/tests/cli.spec.ts compares the committed page
                  against a fresh generation, so a schema edit nobody
                  regenerated reds the end-to-end suite.
     Source: method/runtime/process-schema.yaml, and nothing else. Every sentence below
     is a field of that file; none of it is typed here, and none of it
     depends on what this project has its own switches set to. -->

The loop's own switches, at schema version 1: 42 of them under 3 profiles, 10 of which are FLOOR — no profile turns them off.

Each row says what makes it true: 6 are OPERATIONAL — the arm reads them and changing the value changes what it does — 24 are MANUAL, where a person or a seat performs what the row names and the row carries that instruction, and 12 are DECLARATIVE: a record rather than a control, read by nothing and addressed to nobody, so editing one alone changes nothing. A declarative row is not an absent behaviour — what it describes lives in code or in CI configuration that never consults this schema.

## The command

```
usage: supertaskr settings                      list the profile and every switch
       supertaskr settings set <switch> <value> write one departure into the template
       supertaskr settings reference            print the reference chapter
       supertaskr settings reference --write    write it to docs/reference/
       supertaskr settings reference --check    exit 1 while the committed page is stale

  --root <path>  the project to read; defaults to the checkout this script sits in

  Every switch is declared ONCE, in method/runtime/process-schema.yaml, and this
  command renders that file rather than restating it. Every row carries its LABEL —
  operational, manual or declarative — and a declarative row is a RECORD rather than
  a control, so `set` refuses one. exit codes: 0 clean · 1 found ·
  2 called wrong · 3 could not run.
```

## The profiles

- **`guarded-everything`** — the full-scale ceremony as it stood on 2026-09-09 — every card verified on the blind two-phase bench, the whole four suites at every push, and every regeneration and keeper done by a seat's hand
- **`standard`** — what ADR-024 ruled: three tiers chosen by the arm, one standing read, the arm merges, and the whole suite on a clock
- **`fast`** — standard with the whole-suite net nightly only and push batching on — the profile for a project whose CI minutes are the scarce thing

## The switches

### `read.standing`

what every seat reads before working

- **effect** — at five-documents-whole every dispatched seat reads the five governing documents end to end before it can start; at state-and-index it reads STATE and the one-line index, and every other rule reaches it through its brief's context pack
- **type** — choice of `five-documents-whole` · `state-and-index`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/token-budget-used`
- **cost** — about 50K tokens per seat
- **implementation** — manual
- **manual action** — every seat reads the standing set before it works: the root adapter names that set and each role file applies its own subtractions to it, so changing this value means editing the adapter and those role files
- **profiles** — `guarded-everything`: `five-documents-whole` · `standard`: `state-and-index` · `fast`: `state-and-index`

### `dispatch.keeper_at_base`

the fence's keeper spec run at the base before a lane is cut

- **effect** — on, the dispatch grades the keeper that pins the fenced property at the base and reports graded-and-green, graded-and-red or nothing-was-graded before a worktree exists; off, a lane is cut over a baseline nobody measured
- **type** — toggle of `off` · `on`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — 1 to 3 min
- **implementation** — declarative
- **profiles** — `guarded-everything`: `off` · `standard`: `on` · `fast`: `on`

### `dispatch.model_per_role`

the model of every dispatch read from the runtime template

- **effect** — at from-the-template the arm resolves each seat's model out of the template's roles block, prints it in row 1 and REFUSES a dispatch whose role has no default; at by-hand the arm names no model and the dispatching session's own is what a seat inherits
- **type** — choice of `by-hand` · `from-the-template`
- **needs** — `from-the-template => template.roles=on`
- **floor** — no
- **reads** — `roleModelRecs`
- **band** — `loop/token-budget-used`
- **cost** — not measured — the model is the input the token band divides by, never a cost of its own
- **implementation** — operational
- **profiles** — `guarded-everything`: `by-hand` · `standard`: `from-the-template` · `fast`: `from-the-template`

### `dispatch.ask_watcher`

the derived watcher over the live lanes' ask and report files

- **effect** — on, the seat's watcher is derived from the live lanes and fires on a NEW or a CHANGED ask file; off, a lane that parks a question waits for someone to remember it
- **type** — toggle of `off` · `on`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — no band measures this yet
- **cost** — not measured
- **implementation** — manual
- **manual action** — after every dispatch derive the watch list from the live lanes and watch each lane's ask file, firing on a new file and on a CHANGED one; this repository publishes no watcher of its own
- **profiles** — `guarded-everything`: `on` · `standard`: `on` · `fast`: `on`

### `dispatch.preflight`

the card preflight at dispatch

- **effect** — the card's own claims are re-derived against the tree before a lane is cut, so a brief is never assembled over a figure that has moved
- **type** — toggle of `on`
- **needs** — nothing
- **floor** — yes; an override that turns it off is refused
- **reads** — `processLedger`
- **band** — no band measures this yet
- **cost** — seconds
- **implementation** — declarative
- **profiles** — `guarded-everything`: `on` · `standard`: `on` · `fast`: `on`

### `template.roles`

the runtime template's own roles block, which the model per role is read from

- **effect** — the block exists and names a model for every role the arm dispatches; without it the arm has nothing to resolve and refuses rather than inheriting the dispatching session's model
- **type** — toggle of `on`
- **needs** — nothing
- **floor** — yes; an override that turns it off is refused
- **reads** — `processLedger`
- **band** — no band measures this yet
- **cost** — seconds
- **implementation** — manual
- **manual action** — keep a roles block in the runtime template naming a model for every role the arm dispatches
- **profiles** — `guarded-everything`: `on` · `standard`: `on` · `fast`: `on`

### `build.suites`

what the executor runs at its final commit

- **effect** — at fence-owes the lane runs every suite its fence touches, once; at owed-set it runs the set its own range owes, which is the smaller reading and the one the push and CI also take
- **type** — choice of `fence-owes` · `owed-set`
- **needs** — `* => push.token=on`
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — 5 to 15 min
- **implementation** — manual
- **manual action** — the executor runs the suites this value names ONCE, at its final code-and-notes commit, through the blessed gate-runner, and reports each leg with its ref, its count and its exit
- **profiles** — `guarded-everything`: `fence-owes` · `standard`: `owed-set` · `fast`: `owed-set`

### `build.self_drill`

one mutant per new body, red, restored and proved, in the report

- **effect** — at required the executor's report carries a self-drill block and a report without one is incomplete; at practised the drill is a habit and a lane that skips it is discovered at the bench or not at all
- **type** — choice of `practised` · `required`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — minutes in the lane
- **implementation** — manual
- **manual action** — the executor's report carries a self-drill block: one mutant per new body, planted where the property lives, shown red, restored, and the restore proved by hash
- **profiles** — `guarded-everything`: `practised` · `standard`: `required` · `fast`: `required`

### `build.criteria_echo`

the criteria restated as a checklist before coding

- **effect** — on, the executor writes the acceptance criteria back as a checklist before it touches anything, so a criterion it misread is caught while the cost of the miss is one paragraph
- **type** — toggle of `off` · `on`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — 1 min
- **implementation** — manual
- **manual action** — the executor restates every acceptance criterion as a checklist in the notes before it writes a line of the implementation
- **profiles** — `guarded-everything`: `off` · `standard`: `on` · `fast`: `on`

### `build.preflight_before_stamp`

the card preflight on the executor's own prose

- **effect** — on, the lane's own implementation notes are re-derived before the verifying stamp, so prose that breaks the card's own claims is caught in the lane rather than at the merge
- **type** — toggle of `off` · `on`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — seconds
- **implementation** — manual
- **manual action** — the executor re-derives the card's own claims over its finished notes and reaches a clean exit before it stamps the card verifying
- **profiles** — `guarded-everything`: `off` · `standard`: `on` · `fast`: `on`

### `verify.tier`

how a card is verified

- **effect** — at by-the-classifier the arm derives bounded, standard or guarded from the card's size, its fence against the guard-class list and whether a keeper already pins it; at guarded-for-every-card every card takes the blind two-phase bench whatever its size, which is the ceremony the room measured at 2.5 to 3.5 hours a card
- **type** — choice of `guarded-for-every-card` · `by-the-classifier`
- **needs** — `by-the-classifier => fence.hook=on` · `by-the-classifier => push.token=on`
- **floor** — no
- **reads** — `classifyTier`
- **band** — `loop/cycle-budget-used` · `loop/token-budget-used` · `loop/soft-verifier`
- **cost** — the tiers' own budgets: 20 min and 80K bounded, 75 min and 310K standard, 100 min and 450K guarded
- **implementation** — operational
- **profiles** — `guarded-everything`: `guarded-for-every-card` · `standard`: `by-the-classifier` · `fast`: `by-the-classifier`

### `verify.phase1`

the tool-less attack set written from the card before the diff

- **effect** — at by-the-arm the arm renders phase 1 for the standard and guarded tiers and renders none for bounded; at by-the-seat the arm renders nothing and the seat writes the phase brief by hand; off, nothing is written before the diff exists and the verifier's blindness is spent
- **type** — choice of `by-the-seat` · `by-the-arm` · `off`
- **needs** — nothing
- **floor** — no
- **reads** — `phase1Owed`
- **band** — `loop/token-budget-used`
- **cost** — about 60K tokens, 4 min beside the build
- **implementation** — operational
- **profiles** — `guarded-everything`: `by-the-seat` · `standard`: `by-the-arm` · `fast`: `by-the-arm`

### `verify.ground`

the ground truths at the base that phase 2 judges on

- **effect** — at by-a-script the arm takes the grounds and seals them, and the seat's further asks are answered by hand only on the guarded tier; at by-hand every ground is the seat's own measurement and the bench waits on it
- **type** — choice of `by-hand` · `by-a-script`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — 10 to 15 min of the seat
- **implementation** — declarative
- **profiles** — `guarded-everything`: `by-hand` · `standard`: `by-a-script` · `fast`: `by-a-script`

### `verify.sealed_inputs`

the attack set and the grounds hashed and cited

- **effect** — sealed, the verdict cites a digest of what it judged on and a reader can re-derive it; unsealed, a verdict's inputs are whatever the session remembers
- **type** — choice of `off` · `on` · `standard-and-guarded`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/soft-verifier`
- **cost** — seconds
- **implementation** — manual
- **manual action** — hash the attack set and the ground truths taken at the base, and cite those digests in the verdict so a reader can re-derive what it judged on
- **profiles** — `guarded-everything`: `on` · `standard`: `standard-and-guarded` · `fast`: `standard-and-guarded`

### `verify.separate_bench`

phase 2 on a detached worktree at the tip

- **effect** — on, the verifier measures on a checkout of its own and the lane's worktree is never the bench; off, the verifier measures where the executor built and a dirty lane is indistinguishable from a defect
- **type** — choice of `off` · `on` · `standard-and-guarded`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — a worktree
- **implementation** — declarative
- **profiles** — `guarded-everything`: `on` · `standard`: `standard-and-guarded` · `fast`: `standard-and-guarded`

### `verify.suites`

what the verifier runs at the tip

- **effect** — at whole the verifier grades the four legs end to end; at owed-set-except-guarded it grades the set the range owes and the guarded tier still takes the whole four
- **type** — choice of `whole` · `owed-set` · `owed-set-except-guarded`
- **needs** — `owed-set|owed-set-except-guarded => record.whole_suite_net=checkpoint-and-nightly|nightly`
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — 15 to 20 min, down to about 5
- **implementation** — manual
- **manual action** — the verifier runs the suites this value names at the lane's tip and reports each with the ref it ran at and its body count
- **profiles** — `guarded-everything`: `whole` · `standard`: `owed-set-except-guarded` · `fast`: `owed-set-except-guarded`

### `verify.mutants`

data mutants where the property is data, code mutants for containment

- **effect** — on, a keeper is proved by planting the defect it claims to catch — and where the property lives in data, the mutant is a DATA mutant; off, a vacuous keeper is green and nobody knows
- **type** — toggle of `off` · `on`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/soft-verifier`
- **cost** — inside phase 2
- **implementation** — manual
- **manual action** — prove each keeper by planting the defect it claims to catch, and plant a DATA mutant wherever the property lives in data rather than in code
- **profiles** — `guarded-everything`: `on` · `standard`: `on` · `fast`: `on`

### `verify.corrections_as_bodies`

a correction is a body the verifier commits plus a mutant block

- **effect** — on, an assigned correction arrives as a committed body with the mutant that drills it, and the merge re-drills it RED ALONE; off, a correction is prose the integrator interprets
- **type** — toggle of `off` · `on`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/soft-verifier`
- **cost** — not measured
- **implementation** — manual
- **manual action** — the verifier commits each assigned correction as a body with the mutant block that drills it, rather than as prose for the integrator to interpret
- **profiles** — `guarded-everything`: `on` · `standard`: `on` · `fast`: `on`

### `verify.reads_notes_last`

the verifier reads the diff before the executor's notes

- **effect** — the diff is judged on its own before the lane's account of it, so the verifier's reading is not the executor's reading repeated back
- **type** — toggle of `on`
- **needs** — nothing
- **floor** — yes; an override that turns it off is refused
- **reads** — `processLedger`
- **band** — `loop/soft-verifier`
- **cost** — not measured
- **implementation** — manual
- **manual action** — the verifier judges the diff on its own before it reads the lane's implementation notes
- **profiles** — `guarded-everything`: `on` · `standard`: `on` · `fast`: `on`

### `merge.by`

who runs the merge ritual

- **effect** — at by-the-arm the merge verb performs the ritual step by step and STOPS with the merge staged, and the seat reads one line per step and rules; at by-the-seat every step is a command a session types and a step it forgets is a step nobody sees missing
- **type** — choice of `by-the-seat` · `by-the-arm`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — 15 to 21 min, down to about 5
- **implementation** — manual
- **manual action** — run the merge through the arm's merge verb and rule on each step it stops at, rather than typing the ritual's steps by hand
- **profiles** — `guarded-everything`: `by-the-seat` · `standard`: `by-the-arm` · `fast`: `by-the-arm`

### `merge.redrill`

the re-drill of the verdict's correction blocks

- **effect** — at scoped each mutant is re-drilled against the spec the fix diff touches; at whole-spec every block is re-drilled over the whole spec, which is the same answer for more minutes
- **type** — choice of `whole-spec` · `scoped`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — minutes
- **implementation** — manual
- **manual action** — re-drill each mutant block the newest verdict carries against the spec that block names, and stop on a survivor or on a body that reds more than itself
- **profiles** — `guarded-everything`: `whole-spec` · `standard`: `scoped` · `fast`: `scoped`

### `merge.regen_graph`

the code graph regenerated when a source under the walk moved

- **effect** — at by-the-arm the regeneration, the currency check and the staging are steps in the merge plan with their own exits, and the dogfood pins run before the commit; at by-the-seat the plan carries a STOP naming what the seat owes and the regeneration happens off the ledger
- **type** — choice of `by-the-seat` · `by-the-arm`
- **needs** — nothing
- **floor** — no
- **reads** — `regenPlace`
- **band** — `loop/cycle-budget-used`
- **cost** — about 3 min when it fires
- **implementation** — operational
- **profiles** — `guarded-everything`: `by-the-seat` · `standard`: `by-the-arm` · `fast`: `by-the-arm`

### `merge.regen_census`

the behaviour census regenerated when a spec name moved

- **effect** — at by-the-arm the census regeneration and its staging are steps in the merge plan; at by-the-seat the plan carries a STOP naming what the seat owes
- **type** — choice of `by-the-seat` · `by-the-arm`
- **needs** — nothing
- **floor** — no
- **reads** — `regenPlace`
- **band** — `loop/cycle-budget-used`
- **cost** — about 1 min when it fires
- **implementation** — operational
- **profiles** — `guarded-everything`: `by-the-seat` · `standard`: `by-the-arm` · `fast`: `by-the-arm`

### `merge.keepers`

the cheap keepers at the merge — the pinned-sentence, forbidden-content and diff-size checks

- **effect** — on, each is a step with its own exit before the commit; off, the merge plan carries the floor preflight alone and a reworded pinned sentence or a forbidden spelling lands and is found afterwards
- **type** — toggle of `off` · `on`
- **needs** — nothing
- **floor** — no
- **reads** — `keeperSteps`
- **band** — `loop/cycle-budget-used`
- **cost** — seconds
- **implementation** — operational
- **profiles** — `guarded-everything`: `off` · `standard`: `on` · `fast`: `on`

### `merge.meters_to_bands`

the reports' meters appended to the bands at the merge

- **effect** — on, the lane's and the verifier's meters blocks are appended to the readings the bands parse; off, every report on the board carries a meters block that nobody reads
- **type** — toggle of `off` · `on`
- **needs** — `on => record.bands=on`
- **floor** — no
- **reads** — `processLedger`
- **band** — no band measures this yet
- **cost** — seconds
- **implementation** — manual
- **manual action** — hand the lane's and the verifier's reports to the merge, so their meters blocks reach the readings the bands parse
- **profiles** — `guarded-everything`: `off` · `standard`: `on` · `fast`: `on`

### `merge.message`

the merge message

- **effect** — at from-the-verdict every sentence comes out of the verdict or out of a figure the run measured; at by-the-seat the message is a summary of what the session remembers, and a count that has moved is remembered wrong
- **type** — choice of `by-the-seat` · `from-the-verdict`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — no band measures this yet
- **cost** — not measured
- **implementation** — manual
- **manual action** — take every sentence of the merge message out of the verdict or out of a figure the run measured
- **profiles** — `guarded-everything`: `by-the-seat` · `standard`: `from-the-verdict` · `fast`: `from-the-verdict`

### `push.owed`

what a push must have graded

- **effect** — at owed-set the push grades the set its own range owes, last, and the token keys on it; at whole the four legs run at every push
- **type** — choice of `whole` · `owed-set`
- **needs** — `* => push.token=on`
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — 15 min, down to 1 to 5
- **implementation** — manual
- **manual action** — grade the set the pushed range owes, last, and then push bare
- **profiles** — `guarded-everything`: `whole` · `standard`: `owed-set` · `fast`: `owed-set`

### `push.batching`

several merges per push

- **effect** — on, merges accumulate and one push carries them, which is fewer runs for the same tree; off, every merge is its own push and its own run
- **type** — toggle of `off` · `on`
- **needs** — `on => ci.per_push_runs=one`
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — fewer CI runs
- **implementation** — manual
- **manual action** — let merges accumulate and carry them in one push rather than pushing after each
- **profiles** — `guarded-everything`: `off` · `standard`: `on` · `fast`: `on`

### `push.wait_previous_run`

the guard refuses a push while a run is in flight

- **effect** — on, a push waits for the previous run to conclude; off, the guard ANNOUNCES the newest concluded verdict at every push and the reading stays the seat's
- **type** — toggle of `off` · `on`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — up to 35 min
- **implementation** — manual
- **manual action** — read the verdict the push guard announces before pushing, and at on wait for the run in flight to conclude first
- **profiles** — `guarded-everything`: `on` · `standard`: `off` · `fast`: `off`

### `push.token`

the owed-set token and the push guard

- **effect** — a push is refused unless the set its range owes has been graded and the token keys on that tree; a commit or a staged merge during the run unkeys it
- **type** — toggle of `on`
- **needs** — nothing
- **floor** — yes; an override that turns it off is refused
- **reads** — `processLedger`
- **band** — no band measures this yet
- **cost** — seconds
- **implementation** — declarative
- **profiles** — `guarded-everything`: `on` · `standard`: `on` · `fast`: `on`

### `ci.owed`

what CI runs per push

- **effect** — at owed-set the runner grades the set the pushed range owes; at everything it grades the four legs at every push
- **type** — choice of `everything` · `owed-set`
- **needs** — `owed-set => record.whole_suite_net=checkpoint-and-nightly|nightly`
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — 34 min, down to about 10
- **implementation** — declarative
- **profiles** — `guarded-everything`: `everything` · `standard`: `owed-set` · `fast`: `owed-set`

### `ci.sharding`

the e2e lane split across runners by owning spec

- **effect** — on, the longest leg is several jobs and the wall clock is the slowest shard; off, it is one job and the wall clock is the sum
- **type** — toggle of `off` · `on`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — 21 min, down to about 5
- **implementation** — declarative
- **profiles** — `guarded-everything`: `off` · `standard`: `on` · `fast`: `on`

### `ci.regen_check`

graph and census currency checked on the runner

- **effect** — on, a merge that forgot a regeneration reds on a machine that is not the seat's; off, a stale generated file travels until someone asks the gate by hand
- **type** — toggle of `off` · `on`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — no band measures this yet
- **cost** — seconds
- **implementation** — declarative
- **profiles** — `guarded-everything`: `on` · `standard`: `on` · `fast`: `on`

### `ci.per_push_runs`

how many runs a push starts

- **effect** — at one, a push carrying several merges starts one run and that run is the reading for the whole batch; at per-merge each merge is separately visible and batching cannot be told from a lost run
- **type** — choice of `one` · `per-merge`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — one run per push
- **implementation** — declarative
- **profiles** — `guarded-everything`: `per-merge` · `standard`: `one` · `fast`: `one`

### `record.whole_suite_net`

when the whole four suites run

- **effect** — the net under every switch that grades less than everything: at checkpoint-and-nightly the four legs run at every checkpoint and nightly in CI, and a red there is filed against the merge that caused it; at every-push there is no net because nothing is ever skipped
- **type** — choice of `every-push` · `checkpoint-and-nightly` · `nightly`
- **needs** — nothing
- **floor** — no
- **reads** — `wholeSuiteNet`
- **band** — `loop/cycle-budget-used`
- **cost** — 15 min per run
- **implementation** — manual
- **manual action** — run the four legs end to end on the clock this value names: the integrating seat takes the checkpoint half and the scheduled run takes the nightly one
- **profiles** — `guarded-everything`: `every-push` · `standard`: `checkpoint-and-nightly` · `fast`: `nightly`

### `record.bands`

cycle time and tokens per size and tier, with budgets

- **effect** — on, every lane's readings land in the bands and a tier drifting past its budget is visible at the next checkpoint; off, the budgets are numbers in an ADR
- **type** — toggle of `off` · `on`
- **needs** — nothing
- **floor** — no
- **reads** — `processLedger`
- **band** — no band measures this yet
- **cost** — seconds
- **implementation** — manual
- **manual action** — record each lane's readings in the bands' own file at the merge, and read the bands at every checkpoint
- **profiles** — `guarded-everything`: `off` · `standard`: `on` · `fast`: `on`

### `record.checkpoint`

the record and STATE regenerated at a sitting

- **effect** — the sitting's record is written and STATE is replaced from its template in the same commit, so the handoff baton is never a commit behind the tree
- **type** — toggle of `on`
- **needs** — nothing
- **floor** — yes; an override that turns it off is refused
- **reads** — `processLedger`
- **band** — `loop/cycle-budget-used`
- **cost** — 20 min per sitting
- **implementation** — manual
- **manual action** — write the sitting's record and replace STATE from its template in the same commit
- **profiles** — `guarded-everything`: `on` · `standard`: `on` · `fast`: `on`

### `fence.hook`

the lane fence and the write hook that keeps it

- **effect** — a lane may write only what its card fenced, and the hook refuses the write rather than reporting it afterwards
- **type** — toggle of `on`
- **needs** — nothing
- **floor** — yes; an override that turns it off is refused
- **reads** — `processLedger`
- **band** — no band measures this yet
- **cost** — seconds
- **implementation** — declarative
- **profiles** — `guarded-everything`: `on` · `standard`: `on` · `fast`: `on`

### `landing.gate`

the landing gate

- **effect** — a merge onto the integration branch is judged before it lands, and a card is resolved by the branch at the merge's second parent
- **type** — toggle of `on`
- **needs** — nothing
- **floor** — yes; an override that turns it off is refused
- **reads** — `processLedger`
- **band** — no band measures this yet
- **cost** — seconds
- **implementation** — declarative
- **profiles** — `guarded-everything`: `on` · `standard`: `on` · `fast`: `on`

### `docs.gate`

the docs gate

- **effect** — a path under docs/ is a CODE INPUT, and the gate names which suites a change to it owes — the trigger no other gate can see
- **type** — toggle of `on`
- **needs** — nothing
- **floor** — yes; an override that turns it off is refused
- **reads** — `processLedger`
- **band** — no band measures this yet
- **cost** — seconds
- **implementation** — declarative
- **profiles** — `guarded-everything`: `on` · `standard`: `on` · `fast`: `on`

### `method.stamp`

the method stamp and its eval gate when method text moves

- **effect** — a merge that moves method text bumps the stamp in every file that carries it and runs the method evals; a half bump reds the pin
- **type** — toggle of `on`
- **needs** — nothing
- **floor** — yes; an override that turns it off is refused
- **reads** — `processLedger`
- **band** — no band measures this yet
- **cost** — seconds
- **implementation** — manual
- **manual action** — bump the method stamp in every file that carries it, and run the method evals, in the merge that moves method text
- **profiles** — `guarded-everything`: `on` · `standard`: `on` · `fast`: `on`

### `record.immutable`

records never rewritten

- **effect** — a checkpoint, a verdict and a room entry are appended to and never edited, so the record of what was believed at a moment survives the belief
- **type** — toggle of `on`
- **needs** — nothing
- **floor** — yes; an override that turns it off is refused
- **reads** — `processLedger`
- **band** — no band measures this yet
- **cost** — seconds
- **implementation** — manual
- **manual action** — append to a checkpoint, a verdict or a room entry; never edit one
- **profiles** — `guarded-everything`: `on` · `standard`: `on` · `fast`: `on`

## The dispatch block

The runtime template's own `dispatch:` block — the dispatch approval mode, the recovery policy, and the grant that sets them. 16 field(s), declared in method/runtime/process-schema.yaml and read as ONE typed value by `dispatchBlock`.

a fresh seat in either harness inherits the owner's approval from the template rather than from a checkpoint's prose; a grant, a pause or a revocation is a dated edit to the block that appends the previous grant to its history and RAISES the revision, and which grant is current is decided by that revision and never by a date

Each row says what makes it true: 0 OPERATIONAL, 0 MANUAL, 16 DECLARATIVE. 3 row(s) are ADVISORY — recorded, rendered and validated, and read by nothing that stops anything: `limits` · `limits.tokens` · `limits.expires_at`.

When the block is ABSENT the reader answers the explicit no-grant state: `approval` is `each`, `recovery` is `none`, no grant, revision 0.

### `dispatch.approval`

when work STARTS — approval asked before every dispatch, a grant that runs up to and including a named card, or a standing grant that runs until a dated pause

- **required** — always
- **shape** — mode
- **values** — `each` · `until` · `standing`
- **absent** — `each`
- **advisory** — no
- **implementation** — declarative

### `dispatch.recovery`

whether the coordinator may dispatch a correction round, a re-entry after a rejection or a repair the work discovers — none, or the repairs necessary to the approved work

- **required** — always
- **shape** — mode
- **values** — `none` · `repairs`
- **absent** — `none`
- **advisory** — no
- **implementation** — declarative

### `dispatch.grant`

the approval itself, as the owner gave it; a block that carries no grant is a block that records nothing

- **required** — always
- **shape** — map
- **advisory** — no
- **implementation** — declarative

### `dispatch.grant.given_by`

who gave the grant, as the record names them — the reader attributes a grant to this and promises no tamper prevention from an integer

- **required** — with-parent
- **shape** — text
- **advisory** — no
- **implementation** — declarative

### `dispatch.grant.at`

the ISO instant the grant was given, which is a record and never the tie-breaker between two grants

- **required** — with-parent
- **shape** — instant
- **advisory** — no
- **implementation** — declarative

### `dispatch.grant.revision`

the revision of this grant, a positive integer strictly above every revision in the history — and the ONE thing that decides which grant is current

- **required** — with-parent
- **shape** — revision
- **advisory** — no
- **implementation** — declarative

### `dispatch.grant.order`

the approved cards in dispatch order, each id once

- **required** — with-parent
- **shape** — card-ids
- **advisory** — no
- **implementation** — declarative

### `dispatch.grant.until`

the card the grant runs up to and including, which must belong to the order — required under `until` and refused under every other mode

- **required** — with-until
- **shape** — card-id
- **advisory** — no
- **implementation** — declarative

### `dispatch.grant.cards`

each approved card at the revision it was approved AT — the 40-hex blob sha of its file — so that a card edited after the yes is a different card, keyed by exactly the ids the order names

- **required** — with-parent
- **shape** — card-blobs
- **advisory** — no
- **implementation** — declarative

### `dispatch.revoked`

the dated revocation of the grant, when there is one; a revoked block reads as NO CURRENT GRANT while the grant it revokes stays in the record

- **required** — optional
- **shape** — map
- **advisory** — no
- **implementation** — declarative

### `dispatch.revoked.at`

the ISO instant the grant was revoked

- **required** — with-parent
- **shape** — instant
- **advisory** — no
- **implementation** — declarative

### `dispatch.revoked.by`

who revoked it, as the record names them

- **required** — with-parent
- **shape** — text
- **advisory** — no
- **implementation** — declarative

### `dispatch.limits`

the ceilings the grant was given under, recorded and enforced by NOTHING in this tree — the owner's ruling of 2026-09-13 is that this project's own loop runs without them

- **required** — optional
- **shape** — map
- **advisory** — yes; nothing in this tree enforces it
- **implementation** — declarative

### `dispatch.limits.tokens`

a ceiling per provider, each a positive integer — ADVISORY: recorded and rendered, read by nothing that stops anything

- **required** — with-parent
- **shape** — token-ceilings
- **advisory** — yes; nothing in this tree enforces it
- **implementation** — declarative

### `dispatch.limits.expires_at`

the ISO instant the grant expires at — ADVISORY: recorded and rendered, read by nothing that stops anything

- **required** — with-parent
- **shape** — instant
- **advisory** — yes; nothing in this tree enforces it
- **implementation** — declarative

### `dispatch.history`

every earlier grant in order, each shaped exactly like `grant` and each at a revision strictly below the current one; an empty list is the honest shape of a first grant

- **required** — always
- **shape** — grants
- **advisory** — no
- **implementation** — declarative
