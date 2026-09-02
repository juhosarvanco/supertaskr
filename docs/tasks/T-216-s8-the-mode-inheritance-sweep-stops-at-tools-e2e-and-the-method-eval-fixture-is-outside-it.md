---
id: T-216-s8
title: The mode-inheritance sweep is recorded over four trees and `tools/method-evals/` is not one of them — its fixture copies `method/` out of the live checkout and hands each eval a write into the copy
feature: F-06
milestone: 4
priority: 4
size: S
status: suggested
blocked_by: []
touches: [tools/method-evals/lib/fixture-root.mjs]
suggested_by: verifier claude-opus-5@subagent @V-216-s4
builder:
verifier:
built_by:
verified_by:
review: independent
---

**FOUND WHILE VERIFYING `T-216-s4`, AND FILED BECAUSE A SWEEP'S SCOPE IS
THE SWEEP.** `T-216-s4` fixed the mode-inheritance class in the two files
its fence reached and routed the rest as `T-216-s7`, whose sweep is
recorded — correctly and in writing — over `app/test`,
`lib/parser/test`, `tools/e2e/tests` and the `nputer-index` crate.
`tools/method-evals/` is a fifth first-party tree and is outside that
scope.

## The site

`materialize` in `tools/method-evals/lib/fixture-root.mjs` builds each
eval's project by copying out of the LIVE checkout:

    cpSync(<repoRoot>/method, <dir>/method, { recursive: true })
    cpSync(<repoRoot>/docs/architecture, <dir>/docs/architecture, …)
    cpSync(<repoRoot>/<rel>, <dir>/<rel>)   for LIVE_DOCS and LIVE_ADAPTERS

`cpSync` carries the source's permission bits (measured on node v22.22.0:
a `0444` source copies to `0444`). Since `T-210`, every tracked file
outside a lane's fence is `-r--r--r--` in that lane, and `method/**` is
outside almost every fence. The fixture then hands each eval a generic
writer over that same tree — `write: (rel, text) => writeFileSync(path
.join(dir, rel), text)` — so any eval that writes a path the copy already
holds meets `EACCES` inside a lane rather than running.

## IT DOES NOT RED TODAY, AND THAT IS THE FINDING RATHER THAN AN EXCUSE

Measured in a detached bench at `1757f33` with the physical layer's
read-only state reproduced over `T-216-s4`'s own six-path fence:

    node tools/method-evals/run.mjs --set model-free   unarmed  exit 0, 6 evals
    node tools/method-evals/run.mjs --set model-free   ARMED    exit 0, 6 evals

So no eval writes into the copied tree at this ref. **The site is latent,
not live** — the same shape `T-216-s7` records for `perf.rs`'s
`#[ignore]`d body, and it is written down for the same reason: a latent
instance with no keeper surfaces the day somebody adds the eval that
writes one.

**WHY IT IS WORTH A LINE AT ALL.** The METHOD EVAL GATE is owed at any
merge whose diff touches `method/**` (docs/CONVENTIONS.md), and the seat
that owes it is normally sitting in a lane — which is exactly the
checkout where `method/**` is read-only. The gate that judges method
changes is the gate most likely to be run from the tree that cannot
copy them writably.

## What a fix decides

Whether this joins `T-216-s7`'s scope as a fourth file, or takes its own
one-line repair. `T-216-s7`'s second criterion already argues the shape:
one implementation per package rather than one per call site (T-057), and
this is the only such copy in `tools/method-evals/`.

## Acceptance criteria

- WHERE `tools/method-evals/lib/fixture-root.mjs` copies out of the live
  checkout, the copy SHALL NOT carry the source's write bits.
- A positive control SHALL manufacture a read-only SOURCE rather than
  find one — the precondition is a property of the CHECKOUT, so a body
  that leans on the ambient tree is green in every checkout a drill runs
  in. `T-216-s4` ships two such controls to copy, one per language.
- The eval suite SHALL still answer exit 0 over its declared eval count,
  read from the run's own census line rather than from its exit alone.
- Verification: headless.
