---
id: T-156-s1
title: The health bands have no way into a checkpoint, because the record template and the CONVENTIONS bullet are both outside the fence that built them
status: suggested
suggested_by: executor claude-opus-5 @T-156
---

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
