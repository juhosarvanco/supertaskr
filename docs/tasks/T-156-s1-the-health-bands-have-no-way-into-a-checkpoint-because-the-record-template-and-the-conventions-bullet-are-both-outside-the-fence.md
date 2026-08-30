---
id: T-156-s1
title: The health bands have no way into a checkpoint, because the record template and the CONVENTIONS bullet are both outside the fence that built them
feature: F-06
milestone: 4
priority: 14
size: M
status: planned
blocked_by: []
touches: [docs/checkpoints/, docs/CONVENTIONS.md, .github/workflows/]
suggested_by: executor claude-opus-5 @T-156
builder:
verifier:
built_by:
verified_by:
review:
---

**PROMOTED at the first standing triage, 2026-08-30, as the owner of the ROUTED REFUSALS T-156 could not build. It absorbs T-156-s2, its own other half.**

Both are the same shape stated twice: T-156's fence was `[tools/e2e]`,
and the recording mechanisms its criteria needed all live outside it. The
lane widened nothing to reach them, which is the one repair an executor
may never make — so these are **routed refusals, not oversights**, and
they are the reason `npm run health` exits 3 today.

`docs/STATE.md` names them together and treats them as one obligation:
*"the one designed non-zero exit a session will meet: `npm run health`
exits 3 while four bands await keepers (T-156-s1/s2) — never read that 3
as clean, and never 'fix' it."* Two cards for one exit code would be two
triage decisions that can disagree about a state STATE describes once.

**THE HARD HALF IS NOT A SCRIPT AND THE CARD SAYS SO.** Every band here
needs a MARKER — a place where a fact is recorded at the moment it
happens, by whoever it happens to. The scanner is the easy part.
**And the sampling trap is carried forward as a criterion**: a cold start
that went badly is exactly the one nobody writes up, so the marker must
be owed by the SESSION rather than by whoever noticed a problem.
A denominator that only collects successes is worse than no band.

**DISPATCH NOTE:** carries `docs/CONVENTIONS.md`, held by the live
`task/T-111-s10-poison-drill-bullet` lane at this sitting.

Absorbs: T-156-s2 (Standing triage 2026-08-30 (architect seat)) — the constitution's three indicators have a band each and still nothing to read, because the recording mechanisms they need all live outside the fence that declared them. Same routed-refusal shape, same parent lane, same `authority.kind: "none"` consequence, and the same fence this card needs — `docs/checkpoints/` for the marker, `docs/CONVENTIONS.md` for the bullet. It brings the three NORTH_STAR bands (`cold-start-pass-rate`, `drift-incidents`, `rejection-rate-by-size`) and the sampling-trap argument, which is carried above as a criterion rather than lost in the merge. File removed in this commit.

**THIS IS A ROUTED REFUSAL, NOT AN OVERSIGHT.** T-156's fence is
`touches: [tools/e2e]`, and two of its own criteria land outside it.
Quoted, so the next reader argues with the card rather than with this
summary:

> - WHEN a watched metric breaches its band THE script SHALL emit a
>   finding naming the metric, the reading, the band and the
>   derivation — **and the checkpoint SHALL carry it.**

and, from the same card's shape:

> 3. Run at checkpoints (**a line in the record template's Gates
>    section**) and on CI's schedule once the pipeline is green
>    (behind `T-153`).

The first clause of that criterion is built and pinned. The second half
of it — and the whole of shape item 3 — is a write to
`docs/checkpoints/TEMPLATE.md`, to `docs/CONVENTIONS.md`'s *Build &
test* section, and to `.github/workflows/ci.yml`. The lane widened
nothing to reach them, which is the one repair an executor may never
make.

## What is owed, and why it is more than one line

1. **`docs/checkpoints/TEMPLATE.md`** — a Gates line running
   `npm run health` from tools/e2e with the checkpoint's own captured
   output as `--readings`, so the three readings-authority bands
   (`graph/budget-headroom-bytes`, `suite/lib-seconds`,
   `suite/e2e-seconds`) stop being UNREAD. **At every ref today the
   command exits 3 partly for this reason**, and an exit code that never
   changes is one nobody reads.

2. **`docs/CONVENTIONS.md`, the tools/e2e bullet** — the command has to
   be listed where every other command in this repository is listed, or
   it is a command only its own author knows about. NOTE THE COUPLING,
   because it is the trap: `tools/e2e/tests/workflow-parity.spec.ts`
   DERIVES CI's steps from that bullet, so adding
   `npm run health` there and nowhere else fails the lane by name — the
   worked example is in the CI bullet's own retraction, where T-090 walked
   into exactly this while adding `npm run lint:docs`. The same commit
   must therefore add either a `ci.yml` step or a `LOCAL_ONLY` entry with
   the reason. **Half of that pair is inside `[tools/e2e]` and half is
   not, which is why this cannot be split along the fence line.**

3. **`.github/workflows/ci.yml`** — and the disposition is a real
   question rather than a formality. The bands are a REPORTER, not a
   gate (no tier acts on anything), which is the disposition
   `index --watch`, `arch` and `boot:orphan-drill` already have: LOCAL
   ONLY, with the reason written down. But the card asks for it "on CI's
   schedule once the pipeline is green (behind `T-153`)", and a
   scheduled reporter is a different thing from a per-push step. Whoever
   takes this decides, in writing.

4. **`docs/CONVENTIONS.md` again, for the fourth band family** — the
   graph band's reading has an awkward property worth stating where
   people will meet it: `index --check` is the authority, and a LANE
   cannot run it honestly once it has built anything with cargo, because
   the worktree's own `target/` sits inside the graph walk (`T-153-s3`,
   `T-111-s10`). So the readings for that band come from the
   INTEGRATOR's checkout, not from a lane's. That is a fact about who
   can hold a reading, and it belongs beside the command.

## Suggested fence

`[docs/CONVENTIONS.md, docs/checkpoints, .github, tools/e2e]` — the last
one because of the `workflow-parity.spec.ts` coupling above, which no
smaller fence can honour.

## Implementation notes

**CONFIRMATION, WRITTEN BEFORE ANYTHING WAS TOUCHED** (executor
claude-opus-5, lane `/Users/ujju/Projects/nputer-T-156-s1`, branch
`task/T-156-s1-bands-into-checkpoints`, cut from `1d297c9`, fence
`[.github/workflows, docs/CONVENTIONS.md, docs/checkpoints]` with
`docs/tasks/` always writable). I read docs/STATE.md, docs/ROADMAP.md,
docs/ARCHITECTURE.md, docs/CONVENTIONS.md, docs/CAPABILITIES.md,
docs/NORTH_STAR.md and this card in full, plus the three mechanisms the
card names — `tools/e2e/scripts/health-bands.config.mjs`,
`tools/e2e/tests/workflow-parity.spec.ts` and
`docs/checkpoints/TEMPLATE.md`. My task is the recording half T-156
could not build: the health bands have no way into a checkpoint record,
so the three readings-authority bands are UNREAD at every ref and
`machinery/gate-seconds` has no keeper at all — and the four things owed
are a Gates line in the record template that runs `npm run health` with
the checkpoint's own captured output as `--readings`, the CONVENTIONS
ceremony sentence that makes writing it part of the ritual, a WRITTEN
disposition for `.github/workflows/ci.yml` (step, scheduled reporter, or
local-only with the reason), and the statement — beside the command,
where people meet it — that the graph band's reading can only come from
the INTEGRATOR's checkout because a lane that has built with cargo has
its own `target/` inside the graph walk. The hard half is the MARKER and
not a scanner, and the sampling trap is a criterion rather than a note:
a marker owed by whoever noticed a problem collects only successes, so
every marker here is owed by the SESSION, every time, with
`not derivable here` plus a reason when it cannot be measured. **I know
before starting that this card's own suggested fence names `tools/e2e`
and mine does not**, and that item 2 is a PAIR — the command in the
`Build & test` bullet AND its `CI_SEQUENCE`/`LOCAL_ONLY` entry in
`workflow-parity.spec.ts` — that has to land in one commit; I will
measure that red rather than predict it, build every half that is inside
the fence, and route the rest rather than widen anything or quietly
write the command in a shape the derivation cannot see.

### What landed

| file | what |
|---|---|
| `docs/checkpoints/TEMPLATE.md` | Gates gains the HEALTH BANDS block; Metrics goes from three stamped lines to five |
| `docs/CONVENTIONS.md` | one named bullet, `HEALTH BANDS AT THE CHECKPOINT`, in Gotchas beside the four standing gates |
| `docs/tasks/T-156-s5-*.md`, `docs/tasks/T-156-s6-*.md` | the two routed halves, filed |
| `.github/workflows/ci.yml` | **UNCHANGED, on purpose** — the disposition is LOCAL ONLY and is argued below |

**Item 1 — the Gates line.** The record now stamps the census line and
the exit, names the readings file as the output of gates the checkpoint
already ran, and carries three things the card asked for beside it: the
`--` measurement, the capture rule (a bare `| tee` hands you tee's
status, which every gate bullet forbids), and the graph band's
integrator-only reading with its `T-153-s3`/`T-111-s10` reason.

**The three markers, which are the hard half.** `Gate runtime:` was
already a stamped line (T-157) and is now NAMED as
`machinery/gate-seconds`' only reading. `Cold start:` and
`Drift incidents:` are new, and both are owed by the SESSION at every
checkpoint rather than by whoever noticed a problem — the sampling trap,
carried as a criterion. **The denominator they build is named rather
than assumed**: switches and windows that REACHED A CHECKPOINT, which is
not every switch, so whoever sets the bands' limits reads the census as
a floor. `north-star/rejection-rate-by-size` gets NO marker here: its
own config entry says the marker belongs in
`method/tasks/TASK-FORMAT.md`, which no fence this card holds reaches,
and inventing a checkpoint-shaped substitute would be the known-vacuous
keeper docs/NORTH_STAR.md calls a stop-the-line defect.

**And ADR-019 constrains the future keeper, which is worth more than a
sentence.** The Records clause forbids any suite, gate or generator from
depending on docs/checkpoints/, so a scanner over the records is the
WRONG build of the next card. The template says so where it binds: these
readings reach `npm run health` hand-carried into `--readings` at the
checkpoint that wrote them — the hand reporter that clause already
allows.

### The band census, before and after — UNCHANGED, and that is the honest answer

    npm run health   # from tools/e2e/, unpiped, both runs

| | bands | inside | drifting | BREACHED | unread | UNKEPT | exit |
|---|---|---|---|---|---|---|---|
| before (`1d297c9`) | 14 | 7 | 0 | 0 | 3 | 4 | **3** |
| after (`44cfbc9`) | 14 | 7 | 0 | 0 | 3 | 4 | **3** |

**A band's authority is data in `tools/e2e/scripts/health-bands.config.mjs`,
which this fence does not hold**, so no write inside it can move a band
off `authority.kind: "none"`. What moved is that the markers those
entries ask for now exist. Routed as `T-156-s6`, which also carries the
finding that the flip waits on RECORDS rather than on a fence: there is
still no landed measurement to set a limit from, and the config's own
`machinery/gate-seconds` reason forbids setting one from a guess.

**THE MECHANISM ITSELF IS PROVEN END TO END**, with this lane's own suite
output as the readings file:

    npm run health -- --readings <this lane's npm test output>
    health-bands: 14 band(s) — 8 inside, 0 drifting, 0 BREACHED, 2 unread, 4 UNKEPT   (exit 3)

`suite/e2e-seconds` moved from UNREAD to a reading. The other two stay
unread because this lane ran neither `cargo test` nor `index --check`,
which is exactly what the template now tells a checkpoint to feed it.

### Item 2 is REFUSED AND ROUTED, measured rather than predicted

Adding `` `npm run health` `` to the `Build & test` tools/e2e bullet and
changing nothing else takes `workflow-parity.spec.ts` to **3 failed of
17, exit 1** at `8c210b2` — *"lists [tools/e2e] npm run health, which
this spec has no entry for — add it to CI_SEQUENCE … or to LOCAL_ONLY"*,
plus the two fixtures that assert the live doc derives cleanly. **Both
dispositions live in that spec**, so a `ci.yml` step would not have
rescued the doc edit either. The mutant was reverted with
`git checkout docs/CONVENTIONS.md` and the tree was clean before the
real edits. Filed as `T-156-s5` with the measurement.

**WHAT WAS AVAILABLE AND WAS NOT TAKEN**: `FIXTURE: the shape that IS
silent` pins that a command in a bullet with no `run from <dir>/:`
marker is genuinely invisible to the derivation, so the command could
have been written into `Build & test` in silence. It was not. The
command is written down in the bullet that owns the ceremony, which is
where `node tools/method-evals/run.mjs` already lives for exactly this
reason (T-155's own routed half, `T-155-s1`) — and that bullet says
plainly that the listing is owed and where it went.

### Item 3, the CI disposition, decided in writing: LOCAL ONLY

Written into the CONVENTIONS bullet so the next editor of ci.yml meets
it. Three reasons; the first is decisive.

1. `npm run health` exits **3 at every ref** while any band is unkept,
   so a step would red every push for no actionable signal — the AUDIT
   GATE POLICY's own argument against `--deny warnings`, one layer up.
2. The readings that make the run informative are the OUTPUTS of steps
   the job already runs, so a step would either report three bands
   UNREAD or need the job rewired to capture and re-feed them.
3. The card's *"on CI's schedule once the pipeline is green"* form is
   refused for reason 1 and one more: a scheduled reporter re-runs the
   whole pipeline to produce those readings, and `on: schedule` is not
   one of the three triggers `workflow-parity.spec.ts` pins ci.yml to
   (`["pull_request", "push", "workflow_dispatch"]`, asserted as an
   exact set) — so even the scheduled form is a two-package commit.

**So ci.yml is untouched and the four cargo-audit command copies were
never approached.** Revisiting is behind `T-156-s4`, whose subject is
whether the exit code can move at all.

### Gates

| gate | how | result |
|---|---|---|
| `npm run lint:docs` from tools/e2e/ | unpiped, twice (after CONVENTIONS, after the cards) | **exit 0** both times; budgets hold, 4 gated |
| `npm test` from tools/e2e/ | `NPUTER_E2E_PORT=14741`, lsof zero rows first, redirected so `$?` is the suite's | **2 failed / 318 passed, exit 1** — both attributed below |
| `npx vitest run` from lib/parser/ | DOCS GATE owed it | 315 passed / 15 files, **exit 0** |
| `npm test` from app/ | DOCS GATE owed it (`npm run build` first, exit 0) | 1015 passed / 47 files, **exit 0** |
| `cargo test` from app/src-tauri/ | DOCS GATE owed it | **NOT RUN — argued, see below** |
| `npm run health` from tools/e2e/ | before and after | **exit 3** both, by design |

**THE DOCS GATE FIRES** on this diff — three paths under `docs/` are
code inputs — and names four suites. Derived, not guessed:

    TREE=$(git merge-tree --write-tree 1bcdb4c HEAD)   # exit 0
    node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only 1bcdb4c "$TREE")   # exit 1, FIRES

**`cargo test` was NOT run, and the reason is a targeted proof rather
than a shrug.** The only cargo-side reader of docs/CONVENTIONS.md is
`app/src-tauri/src/agent/kit.rs`'s
`snapshot_version_matches_the_live_method_stamps`, which calls
`the_one_line_carrying(&conventions, "formats are version-bumped", …)`
and asserts that line contains `currently v0.1.8`. At this ref
`grep -c 'formats are version-bumped' docs/CONVENTIONS.md` is **1** and
that line is *"method/ formats are version-bumped (currently v0.1.8) and
noted here."* — untouched by this diff, which adds one bullet in Gotchas
and moves no stamp. Against that: running `cargo test` in a lane builds
a multi-gigabyte `target/` INSIDE the worktree, which is both the cargo
cache cliff's own trigger (STATE's first standing hazard) and the graph
walk's (`T-153-s3`). **This is news, not silence**: the integrator owes
the run at the merge.

### The two e2e reds are the live-lane class, PROVEN one side only

Both are in `session-economics.spec.ts` (lines 73 and 247), and both say
the same thing:

    brief: FOUND 1 thing(s) the assembler could not settle:
      fences are not disjoint: T-156-s1 docs/checkpoints/ against
      T-157 docs/checkpoints/ — the same entry (lane-protocol rule five).

**THE COUNTERFACTUAL, RUN RATHER THAN ASSERTED.** `git checkout 1d297c9
-- docs/` plus `git rm` of the two new cards put the tree's `docs/` back
to the base ref exactly (`git diff --cached --name-only 1d297c9` empty)
while the lane stayed live. The same spec then gave **2 failed / 8
passed, exit 1 — the same two bodies, the same message**. So the red is
this LANE EXISTING, not this diff; `git diff 1d297c9..HEAD` moves
neither input (this card's `touches:` line is unchanged and T-157's card
is not in the diff). The tree was restored with
`git checkout HEAD -- docs/`, `git status --porcelain` empty. The first
attempt at this drill was CONTAMINATED and is recorded rather than
hidden: `rm -f` left the two new cards in the index, so `brief.mjs` hit
ENOENT and exited 3 with five bodies red — a false counterfactual that
would have been read as "the diff made it worse".

**AND IT REFINES THE TWO CARDS THAT ALREADY OWN THIS DEFECT.**
`T-143-s1` and `T-162-s2` both state it as *"every lane that holds
`tools/e2e`"*. T-157's card reads `touches: [docs/checkpoints/,
tools/e2e]`, so the real blast radius is **any lane whose fence
intersects EITHER entry** — this lane holds no `tools/e2e` and reds
identically through `docs/checkpoints/`. No third card is filed for a
defect already filed twice; the refinement belongs on those two.

### Figures in this section

Every count above is from a run in this lane, redirected to a file so
`$?` is the command's own, at the ref named beside it. Byte figures:
`docs/CONVENTIONS.md` 131,514 → **137,350** (`wc -c`), warn line 164,393,
so `docs-headroom/docs/CONVENTIONS.md` reads **16.45%** against a drift
line of 10% — INSIDE, and the band says so on the runs above.
