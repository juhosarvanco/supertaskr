---
id: T-206
title: CONVENTIONS gains the two drill failure modes 2026-08-31 discovered, and one runbook line that would have saved an hour of the wrong CI diagnosis
feature: F-06
milestone: 4
priority: 4
size: S
status: planned
blocked_by: []
touches: [docs/CONVENTIONS.md]
suggested_by: "the outgoing architect seat's fix plan (relayed 2026-08-31, approved in direction by @human); all three additions were measured the same night"
builder:
review:
---

Three additions, each with a measured instance. **All are prose in a
document already near its drift line, so each must earn its bytes** — the
lane should expect to pay for them with a correction elsewhere, as
`T-142-s1` did.

## 1. The mutant that reds over ZERO BODIES

`docs/CONVENTIONS.md`'s POISON DRILL section says a mutant must produce
the RED. **It does not say the red must have a denominator.**

Measured: `T-167-s8`'s mutant broke syntax, so the suite exited **1
having run no bodies at all** — and an exit code calls that a kill.
`T-186` hit the same shape twice in its own drill checks. The remedy is
one sentence: **read the COUNTS, and a red with zero bodies is a void
arm, not a kill.**

## 2. The costume vacuity

`T-186`'s phrase, and it is the better name: **a check can fail in a way
that wears the drill's own costume.** Its `diff` compared two *empty*
files and exited 0; its duplicate-id scan ran over an *empty corpus*.
Both look exactly like a passing check.

The remedy is mechanical and already proven: **print the size of what you
are comparing BEFORE you read the verdict**, and run every check once
against a planted positive.

**This is poison shape TEN aimed at the drill's own instruments rather
than at the subject** — the catalogue has the shape; what it lacks is the
instruction to point it inward.

## 3. The runbook line: CI diagnosis reads check-run ANNOTATIONS first

**Measured, and it cost this seat real time.** GitHub Actions stopped
starting — zero steps, no log blob, two commits, five attempts. This seat
checked the workflow file, the jobs API, `--log-failed`, the Actions
permissions and the billing endpoint, concluded *"most likely exhausted
minutes, unconfirmable from here"*, and wrote that into a checkpoint
record.

**The answer was in the check-run annotations the whole time**, in plain
English:

> *"The job was not started because recent account payments have failed
> or your spending limit needs to be increased."*

`gh api repos/<owner>/<repo>/check-runs/<id>/annotations`. **One line in
the runbook: before concluding a CI failure is unconfirmable, read the
check-run annotations.** A zero-step job's reason lives there and nowhere
else.

## Acceptance criteria

- EACH addition SHALL cite its measured instance rather than stating a
  rule abstractly — this project's own evidence is that a rule without an
  instance decays.
- THE byte delta SHALL be reported against the band, and if the addition
  would drift `docs/CONVENTIONS.md`, **the lane SHALL pay for it with a
  correction elsewhere rather than shipping the drift.**
- ANY phrase a reader must find uniquely SHALL match exactly one bullet —
  `T-182` red 11 bodies by quoting a bullet name verbatim, and
  `T-142-s1` hit the same trap from the other side.
- NO addition SHALL restate something already stated elsewhere in the
  document; a second statement is `T-057`'s defect.
- Verification: headless, the CONVENTIONS-reading specs.

## Read beside

`T-202` (which mechanises what item 1 states in prose — this card is the
sentence, that card is the runner), `T-186` and `T-167-s8` (the measured
instances), and `docs/CONVENTIONS.md`'s existing POISON DRILL and shape
catalogue.
