---
id: T-326
title: "Check-evidence reuse, observed and never applied: a diagnostic beside every owed run records the reuse decision a conservative per-suite input model would have made, skips nothing and enables nothing"
feature: F-04
milestone: 4
size: M
priority: 3
status: suggested
suggested_by: "the architect seat on 2026-09-15, filed on the owner's word after the Codex orchestrator's review of the check-evidence reuse proposal"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts, docs/conventions/gates-and-the-push.md, docs/conventions/standing-gates.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

The loop runs the same suites several times per landing: the executor's graded set, the verifier's battery at the sent tip and at its own tip, the seat's tail, the closing check. Whether any of those runs could have discharged a later obligation is unknown, because nothing records what an execution observed. The reuse proposal of 2026-09-14 estimated a saving and withdrew it on review: the parser's and the app's tests read the live board, method text and the committed graph, so package directories are not their input sets, and no run of T-290's landing was shown to qualify. Demonstrated savings are zero and potential savings are unmeasured.

## What would settle it

A diagnostic mode of the gate runner that, beside every owed run and changing none of them, derives a conservative per-suite input key (the package, the live-repository paths the suite opens, directory membership and absent inputs, generated outputs, the lockfiles, toolchains and the environment the suite reads), writes a source record for that actual qualified execution, and records the reuse decision it would have made against earlier records: the same key, a GREEN with valid counts on the blessed runner over a clean committed candidate, no later RED for the key, coverage at least as broad as the obligation. A suite whose inputs cannot be bounded is marked unbounded and the decision is run. The diagnostic skips nothing, admits nothing, and never suppresses a check: a missing cache, an unsupported suite, a failed key derivation or a disagreement leaves the ordinary path and result untouched and appears in the diagnostic report. No old record is manufactured from a commit hash after the fact. The token schemas and the push guards' decisions are unchanged; enabling reuse is a separate, later card after the diagnostic's evidence is reviewed. The storage is a rebuildable runtime cache written by the runner; a missing or corrupt cache means check.

## Two input dimensions a content hash does not describe, added 2026-09-16

THESE ARE WORKED EXAMPLES FROM T-330'S LANDING, not new requirements
invented for this card. Each is a case where two runs had the same bytes
under the paths a naive key would hash, and were nevertheless different
experiments. They argue for representing the dimension in the model, not
against the optimization.

**WHICH TREE THE FIXTURE READS.** The dispatch fixtures seed their scratch
roots through `git archive HEAD` — they consume the COMMITTED tree, and
the working tree they were launched from reaches them only through what
has been committed. On 2026-09-15 a whole end-to-end leg ran green with the
approved grant present in the working tree and ABSENT from HEAD; the
fixtures were exercising the old committed template, and the run
established nothing about the grant. Committing the grant and rerunning
changed the result. So a per-suite input key must carry which tree each
input is read from, and two executions differing only in HEAD are not the
same observation. A key derived from worktree bytes alone would have
called them identical and offered the wrong run for reuse.

**WHERE THE CHECKOUT SITS.** The shell-frame investigation of the same
session produced a location-sensitive result over identical source and
identical build bytes. Whatever its eventual cause, it is an existence
proof that at least one suite's outcome depends on the absolute path of
the checkout it ran in. A key that does not represent the root is
therefore not conservative, and a suite whose dependence on location
cannot be bounded is one of this card's UNBOUNDED cases — marked, and
run.

Both belong in the diagnostic's derivation from the start, because the
diagnostic's whole value is that its recorded decision can be compared
against what actually happened. A model that would have offered reuse in
either case above would be recorded as having been wrong, which is useful
— but only if the model represents the dimension well enough to be
graded on it.

## Implementation notes

## Verdicts
