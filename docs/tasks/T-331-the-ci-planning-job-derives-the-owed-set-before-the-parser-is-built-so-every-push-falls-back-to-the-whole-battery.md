---
id: T-331
title: "CI's planning job derives the owed set before the parser is built, so the static import edge to the parser's built entry cannot land and every push falls back to all four suites and all 42 e2e specs, while the same range locally selects three suites and 12 specs: give the planning job the preparation its derivation needs, keep the fail-closed fallback for genuinely unresolved inputs, and prove the local and fresh-runner selections agree for one exact range"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 1
status: building
suggested_by: "the architect seat on 2026-09-15, from the Codex orchestrator's reading of run 34946192300, verified against the job logs and the local derivation"
blocked_by: []
touches: [.github/workflows/ci.yml, tools/e2e/scripts/ci-owed.mjs, tools/e2e/tests/workflow-parity.spec.ts, tools/e2e/tests/gate-run.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## The finding

CI runs the owed set CI-side since T-294: a planning job derives what the pushed range owes and the suite jobs run that. On the push of one amended card on 2026-09-15 the planning job's log reads that the derivation FAILED CLOSED because the static import graph has an edge it could not land on a file, the edge from the brief spec to the parser library's built entry, and it answered all four suites with the e2e leg whole: 42 spec files across four shards. The job checks out, sets up node and derives; it never installs or builds the parser, so the built entry does not exist when the graph is walked. The checks job gained exactly that preparation at T-317; the planning job did not. Locally, with the parser built, the same range derives parser, app and 12 e2e specs.

The fallback is the right answer for an input the derivation genuinely cannot resolve. Here the input is unresolvable only because of the job's own build order, so every push pays the fallback, and on this push the fallback cost a 37-minute shard for a change whose correct selection excludes that shard's slowest spec; the other three shards took 3 to 6 minutes, which suggests the size of the opportunity and does not establish the duration after the repair.

## What would settle it

The planning job prepares what its derivation walks: the parser installed and built before the owed set is derived (the same steps the checks job already runs), or the derivation resolving a generated entry through its owning source and build relationship without the build. The fail-closed answer stays for an input that is genuinely unresolved, and it names the input as it does today. A body proves parity: for one exact pushed range, the selection a fresh runner derives equals the selection the integration checkout derives, suite for suite and spec for spec. The card reports, for the push that lands it and for the next records-only push, the time to push and the time to CI completion separately; it promises no runner figure before that measurement.

## Acceptance criteria

- WHEN the planning job derives the owed set for a pushed range THE job SHALL have the parser library's built entry present before the derivation walks the import graph, or SHALL resolve that generated entry through its build relationship, and SHALL answer the same suites and specs the integration checkout answers for that range.
- WHEN an input of the derivation is genuinely unresolved THE derivation SHALL still fail closed to the whole battery and SHALL name the input.
- WHEN this card lands THE card SHALL record, for its own push and for the next records-only push, the time to push and the time to CI completion as two figures, with the specs each selection ran.

## Implementation notes

2026-09-15, the executor. The repair is the remedy this card names at the
head of "What would settle it": the planning job now prepares what its
derivation walks. `.github/workflows/ci.yml`'s `owed` job gained the two
steps the `checks` job has run since T-317, `npm ci` and `npm run build`
in `lib/parser`, placed before the step that asks, with the npm cache
keyed on that package's lockfile; the derivation itself is untouched, so
the fail-closed answer is the same code path it always was. The other
remedy the card offers, resolving a generated entry through its build
relationship, would have meant editing `tools/e2e/scripts/gate-run.mjs`,
which this lane's fence does not carry.

Measured at the base commit in the lane worktree, which begins with
nothing installed and nothing built: the walk reports two unresolved
edges, `tools/e2e/tests/brief.spec.ts` and `tools/e2e/tests/cli.spec.ts`
each importing `lib/parser/dist/pure.js`. After those two steps and
nothing else, zero. The two commands took 0.91 s and 0.69 s on this
machine with a warm npm cache.

The whole job was then run as the runner runs it, through
`tools/e2e/scripts/ci-owed.mjs` with the event environment of the push
this card was written from, over a stand-in tree holding exactly the
generated files the walk reaches and over one withholding them. Without
them the job writes `suites=app,e2e,parser,rust`, `e2e-whole=true`,
`spec-count=42`, `shard-count=4` and `run-boot=true`, and its log carries
the card's own sentence naming both edges. With them it writes
`suites=app,e2e,parser`, `e2e-whole=false`, `spec-count=12`,
`run-rust=false` and `run-boot=false` — the answer the integration
checkout gives for that range, suite for suite and spec for spec. The
saving is wider than the spec count alone: the rust leg and the boot
check, with its apt prerequisites and its cargo build, are skipped too.

Two keepers, both derived rather than listed. In
`tools/e2e/tests/workflow-parity.spec.ts` the generated inputs are read
off the tree — every file the derivation's own walk reaches that `git
ls-files` does not carry — and the `owed` job is held to installing and
building each one's package before it asks; a build output from a second
package arriving on the import graph reds there rather than quietly
restoring the battery. In `tools/e2e/tests/gate-run.spec.ts` a body takes
the integration checkout's answer for the range through `owedForRange`,
then derives the same range over a tree with those files withheld and
over one with them restored: the withheld arm fails closed and names both
edges, and the restored arm matches the checkout exactly. Each keeper
carries its own mutant fixture and its own positive control.

One body outside this card's subject was red by this change and is
repaired in place. The rename fixture in
`tools/e2e/tests/workflow-parity.spec.ts` chose its victim as the earliest
named step carrying a `working-directory` and then asserted that name was
written once; that held by luck until the `owed` job gained a step whose
name five other jobs already share. The fixture now chooses a victim whose
name is written once, which is what a single-site rename always required.
The class is a fixture selecting its subject by position and asserting a
property the position does not guarantee; the sweep over both fenced specs
found no other site.

The two figures the third criterion asks for are the seat's to take: they
are properties of a push that has not happened, and this lane records none
of them rather than inventing one. The merge also owes `npm run
capabilities`, because this card adds test names and the census is
generated from them.

## Verdicts
