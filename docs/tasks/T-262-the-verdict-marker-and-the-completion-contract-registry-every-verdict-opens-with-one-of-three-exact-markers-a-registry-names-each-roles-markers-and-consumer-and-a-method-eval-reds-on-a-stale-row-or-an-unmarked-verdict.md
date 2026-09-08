---
id: T-262
title: The verdict marker and the completion-contract registry — every verdict opens with one of three exact-case markers on its own line, a registry names each role's markers and their consumer, and a method eval reds on a stale row or an unmarked verdict, which gives the rejection-rate band its keeper
feature: F-01
milestone: 4
size: S
priority: 17
status: planned
suggested_by: "the architect seat, 2026-09-08, from the GSD Core agent reference (github.com/open-gsd/gsd-core docs/AGENTS.md at 0ebc3cf (read 2026-09-08)): a registry of (agent, completion markers, consumed by, kind), enforced by a check — a stale row is a build failure"
blocked_by: []
touches: [method/roles/verifier.md, method/tasks/TASK-FORMAT.md, method/README.md, tools/method-evals, tools/e2e/scripts/health-bands.config.mjs, tools/e2e/tests/health-bands.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

A verdict is the one record a merge rests on, and no program can read
one: the health band `north-star/rejection-rate-by-size` is UNKEPT
because *"verdicts are prose headings with no ratified marker"*, and
the attempt at 78aabe5 found `VERDICT: APPROVED`, `VERDICT: PASS`,
dated headings carrying a bare word, and headings a regex must not be
trusted on. This card ratifies the marker, keeps a registry of every
role's completion contract, and makes a method eval red when the two
diverge, the way GSD Core fails its build on a stale registry row.

## Why this card exists

Three things wait on a machine-readable verdict. The rejection-rate
band's keeper (T-156-s2 routed it to a marker in TASK-FORMAT). The
wiring of the attack-set digest refusal against real verdicts
(T-205-s1: MF-09 demonstrates the refusal on fixtures and nothing runs
it on a card). And the metabolism's own count of rework cycles, which
every checkpoint derives by reading prose. A marker is one line; the
registry is what stops the marker drifting: a table of (role, markers,
consumed by, detection kind) that the eval compares against the role
files and against every verdict on the board.

## Acceptance criteria

- WHEN a verifier appends a verdict THE first line of the entry SHALL
  be exactly one of `VERDICT: APPROVED`, `VERDICT: APPROVED WITH
  ASSIGNED CORRECTIONS`, `VERDICT: REJECTED`, on a line of its own,
  exact case, and TASK-FORMAT's Verdicts section SHALL name the three
  and no fourth; the `attack set: sha256:…` and ground-truth lines
  SHALL follow on lines of their own as CONVENTIONS' bench bullet
  already spells them.
- WHEN method/README.md (or a file it names) carries the completion-
  contract registry THE table SHALL hold one row per role that returns
  something — executor (the report's required sections), verifier (the
  three markers, the digest lines), integrator (the checkpoint record's
  five metric lines) — with the consumer and the detection kind
  (sentinel-match, artifact, structured-return), and every marker in it
  SHALL be spelled once, read by the eval from the table.
- WHEN the method evals run THE eval SHALL red when a role file names a
  marker the registry lacks or the registry names one the role file
  lacks, and SHALL red naming the card when a `## Verdicts` entry dated
  after this card's merge carries no marker line; entries older than
  the merge are reported, never refused (the record is append-only and
  is not rewritten to fit a rule).
- WHEN `npm run health` runs THE rejection-rate band SHALL carry an
  authority that counts markers per size over the live cards, with the
  denominator named as verdicts stamped after the marker landed, and
  the band SHALL leave UNKEPT.
- IF a verdict's marker and its prose disagree (a REJECTED marker over
  an approving text) THEN the eval SHALL red naming the card: a marker
  is what a program reads and the prose is what a human reads, and the
  two must not be allowed to part.
- The method version SHALL bump (a format change), and the pin test
  SHALL move in the same lane.
