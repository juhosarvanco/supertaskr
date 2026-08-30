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
