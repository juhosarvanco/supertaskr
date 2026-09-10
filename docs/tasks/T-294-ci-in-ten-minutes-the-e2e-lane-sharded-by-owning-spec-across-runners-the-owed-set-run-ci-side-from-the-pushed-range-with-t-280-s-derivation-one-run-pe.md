---
id: T-294
title: CI in ten minutes — the e2e lane sharded by owning spec across runners, the owed set run CI-side from the pushed range with T-280's derivation, one run per push and no waiting on the previous run, with the whole four suites nightly on main
feature: F-04
milestone: 4
size: M
priority: 1
status: building
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: []
touches: [.github/, tools/e2e/scripts/gate-run.mjs, tools/e2e/scripts/ci-owed.mjs, tools/e2e/tests/gate-run.spec.ts, tools/e2e/tests/workflow-parity.spec.ts, tools/e2e/tests/push-guard.spec.ts, .claude/hooks/push-guard.mjs, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

A CI run takes 34 to 36 minutes: the e2e lane 21, cargo 5, the runner's setup 8; and the push guard refuses a push while the previous run is in flight, so pushes serialize behind a 35-minute wait. Playwright shards natively by spec file; the owed-set derivation reads a range and is the same code locally and on the runner.

## Acceptance criteria

- WHEN a push arrives THE workflow SHALL derive the owed set from the pushed range with `gate-run.mjs --owed-set --range <base>..<tip>` on the runner and run the suites and specs it names, the e2e specs sharded across runner jobs by the owning-spec map, the solo-lock legs unsharded; a records-only push SHALL complete in under five minutes and a code push in under thirteen, measured on three consecutive runs.
- WHEN a push is made while a run is in flight THE guard SHALL allow it and CI SHALL run once per push keyed by its commit; the guard's in-flight refusal is retired and the refusal on a concluded red run stays an announcement.
- WHEN the nightly schedule fires THE whole four suites SHALL run on main, and a red SHALL open a finding naming the merge commit that bisection by the owed set attributes it to.
- WHEN the workflow-parity spec reads CONVENTIONS' CI bullet THE bullet SHALL state the sharding, the owed set and the nightly whole run, and the spec SHALL stay green; the free-disk floor (T-278-s2) SHALL hold on every shard.

## Implementation notes

### The criteria, restated as a checklist before coding

Written to the lane's scratch at the start, before a line was edited,
and reproduced here as the cheap keeper asks (ADR-024's H5).

C1 the owed set, derived on the runner, sharded — (a) derived ON THE
RUNNER with the blessed gate-runner's own `--owed-set --range` arm; (b)
the suites it names run and the ones it does not are SKIPPED JOBS; (c)
the specs it names for the leg; (d) those specs sharded across runner
jobs by the owning-spec map; (e) the solo-lock legs unsharded; (f) a
records-only push under five minutes, a code push under thirteen, over
three consecutive runs.

C2 the guard allows — (a) a push while a run is in flight is ALLOWED;
(b) one run per push, keyed by its commit; (c) the in-flight refusal
retired; (d) the concluded-red announcement stays; (e) say which
concurrency setting was chosen and why, and a cancelled run never reads
as a judgement.

C3 the nightly — (a) a schedule trigger on main; (b) the whole four
suites; (c) a red opens a finding naming the merge commit the owed-set
bisection attributes it to.

C4 the bullet and the floor — (a) the CI bullet states the sharding;
(b) the owed set; (c) the nightly whole run; (d) workflow-parity stays
green; (e) the free-disk floor holds on every shard.

### What was built

ONE JOB BECAME A JOB GRAPH in the single workflow file. `owed` derives
what the pushed range owes and publishes it as job outputs; `checks`,
`parser`, `app`, `native` and `e2e` are `needs:` on that answer;
`nightly-finding` fires only on a red scheduled run. No second workflow
file: the push guard reads ONE workflow by path to place a failing step,
and splitting the steps into a reusable workflow would have taken that
sentence away from the seat.

`ci-owed.mjs` is the new program. It turns the event into a RANGE — a
push's `before` and tip, which is THE RANGE RULE's own integrator pair —
spawns the blessed gate-runner's `--owed-set` arm exactly as the push
guard does, and turns the answer into the `if:` switches and the shard
matrix. It is SPAWNED rather than imported for two reasons that are not
the guard's: the criterion names that spelling, so the runner's log
should carry a line a seat can paste at home; and a derivation that
crashed inside this program would be this program's failure, while a
spawn's non-zero exit is the derivation's, in its own words.

THE BOOT CHECK IS DERIVED FROM THE SUITES, not from a second copy of
BOOT GATE's trigger. Every path that trigger names lies under `app/`, so
every one of them owes the app suite or the rust suite through the
package roots the derivation already read — which makes "app or rust is
owed" a superset of the trigger, computed from an answer this program
was handed. Wrong only in the permitted direction.

### C2's concurrency choice, and why it is this one

THE GROUP IS THE COMMIT (`github.sha`) AND `cancel-in-progress` STAYS
TRUE. Keyed by the ref, a second push landed in the running run's own
group and cancelled it; keyed by the commit, two pushes hold two groups
and neither can cancel the other — one run per push, and nobody waits.
The setting stays true so that a SECOND run over the SAME commit still
supersedes the first, which is the only case where the cancelled run
measured a byte-identical tree and therefore loses no judgement.

A CANCELLED RUN CANNOT READ AS A JUDGEMENT, and that is held rather than
asserted: `cancelled` is in the push guard's own NON_VERDICT_CONCLUSIONS,
so the guard walks PAST a cancellation to the newest run that concluded
something. The alternative spelling, `cancel-in-progress: false`, was
considered and rejected: it would also have redded a body outside this
lane's original fence whose premise is that CI cancels, and it buys
nothing the commit key does not already give.

The guard's in-flight refusal is retired and now ANNOUNCES: the run is
named, with its elapsed time, its head sha and `gh run watch`, plus the
sentence that two verdicts are live and arrive in whatever order they
finish. `SUPERTASKR_CANCEL_CI` is retired WITH it, with the reason at
both the header and the constant's old site: a variable that clears a
refusal nothing raises is the override hatch this guard ships none of.
Its name survives in the retirement record and is BOUND nowhere in the
code, and a body pins exactly that.

### What the fence would not reach, and the ask

The retirement's keeper lives in `push-guard.spec.ts`, which the card's
original `touches:` did not name. An ask was written to the lane's
scratch at the START of the lane, parked, and the rest of the card was
built while it stood. The seat GRANTED the widening by one path and
amended the touches line. Four bodies pinned the refusal directly and
were rewritten to pin the ruled property; five more used a live run as
scaffolding for a different property (which branch the remote was asked
about, whether the arm was reached at all) and had their OBSERVABLE
moved from the exit code to the sentence, their own property untouched.

### The runner figures, and which of them are the integrator's

THE WORKFLOW DOES NOT RUN ON A LANE BRANCH. Its `push:` trigger names
`main` only, plus `pull_request`, `workflow_dispatch` and now a
schedule. So the three consecutive runs C1(f) asks for CANNOT be
triggered from this lane without pushing, which no lane may do. Those
figures are the integrator's to read after the merge, from `gh run view
--json jobs`, and the shape to read them in is: the run's wall clock is
its slowest job, and each shard job carries its own spec list in its
display name.

What was measured locally instead, at this lane's own tip: the
derivation itself answers in about a second over the whole tree; the
range this lane's base added owes all four suites and 39 spec files,
which the default four shards split 10/10/10/9. The end-to-end leg's
whole run is 21 minutes on the runner by this card's own measurement, so
four shards put the leg's own share at about five, and each shard pays a
setup its job actually needs — the shard job runs no apt step and no
cargo cache, because the lane drives the vite DEV server and needs
neither.

### Two things a reader should know before the first run

THE APP IS NOT BUILT IN THE SHARD JOB. The lane's own preflight demands
the parser installed and BUILT and the app INSTALLED, and nothing more;
the dev server is what it drives. Checked at this tip: no spec reads the
app's built bundle. If one ever does, the shard reds with the preflight's
own message and the remedy is one step.

THE CENSUS CHECK IS RED UNTIL THE ARM REGENERATES. This lane adds and
renames spec bodies, and `docs/CAPABILITIES.md` is generated from those
names and lies outside every fence a tools/e2e lane can carry. Under
ADR-024's third amendment the regeneration is the arm's step at the
merge, run after the corrections and before the commit; CI's `--check`
is the backstop.

### The document's budget

`docs/CONVENTIONS.md` is 140143 bytes against ADR-019's warn line of
146878, so 6735 bytes of headroom, 4.59 per cent. The CI paragraph and
the rewritten push bullet are +1479 bytes net after five cuts: the
divergence archaeology two cards already carry, the orphan drill's
reason its own spec entry keeps, two placement clauses that named a step
now in another job, and the middle-dot rule's worked cost. The docs gate
reports the budgets holding.

### Self-drill

Fifteen mutants, one per new body and one per rewritten one, each shown
RED and restored, with the restoration proved by sha256 over the whole
file rather than by a re-read of the line. Every mutant is a ONE-EDIT
change to a SOURCE file, never to a spec, so a red is the edit and never
the scaffolding. The log is at the lane's scratch stem.

    the rust switch misspelled in the job graph          2 bodies RED
    the asking step loses its id                         2 bodies RED
    the lane step stops reading the shard's spec list    2 bodies RED
    the nightly finding fires on every scheduled run     1 body RED
    the app job builds the parser before installing it   1 body RED
    a disk reading dropped from the shard job            1 body RED
    the boot step stops being its job's last             1 body RED
    the derivation's flags reach it in the wrong order   1 body RED
    an all-zero `before` is read as a commit             1 body RED
    the shard split stops sorting                        1 body RED
    the boot switch forgets the rust suite               1 body RED
    a switch is emitted only for the owed suites         1 body RED
    a shard count of zero is accepted                    1 body RED
    the in-flight sentence claims a cancellation         1 body RED
    the retired acknowledgement is read again            1 body RED

    restore failures 0 · bodies that stayed green under their
    own mutant 0 · all three mutated files sha256-IDENTICAL after

### Gates derived from this lane's own diff

GRAPH REGEN fires — the diff touches `.mjs` and `.ts` outside `docs/`.
ASKED THE GATE rather than the wording: `index --check` answers CURRENT
at this tip, 201 files, 2561 symbols, 2453 edges, exit 0, so no
regeneration is owed. BOOT GATE does NOT fire: the diff touches nothing
under the app's source trees or either manifest. DOCS GATE fires on
`docs/CONVENTIONS.md`, and the gate's whole-tree half is green. METHOD
EVAL GATE does not fire: no `method/` path moved and no citation-grammar
line was added under `docs/tasks/`.

### Suggested cards filed

T-294-s1, T-294-s2, T-294-s3 — see their own files.

## Verdicts
