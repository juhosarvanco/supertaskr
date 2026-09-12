---
id: T-303-s3
title: "The interpreter arm of the identity matcher disambiguates a flattened argument vector by reading the DISK — read the process's own argument vector instead, so the ambiguity class disappears rather than being guessed at"
feature: F-03
milestone: 4
priority: 4
size: S
status: suggested
suggested_by: executor claude-opus-5@subagent @T-303-s1
blocked_by: []
touches: [tools/e2e/scripts/checkout-currency.mjs, tools/e2e/tests/checkout-currency.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**THE AMBIGUITY IS THE PROCESS READER'S, NOT THE MATCHER'S.** The
process table flattens a command line into one string, so a space in it
may belong to a script path or may separate one argument from the next,
and the boundary that would tell them apart is already gone by the time
the matcher sees it. T-303-s1 met this while narrowing the interpreter
arm, which must decide whether a Claude-looking argument is the executed
script or a later argument that merely looks like one. Its answer is to
corroborate a spaced candidate against the filesystem: the candidate
must be absolute, must name an existing file, and must have no earlier
existing prefix — and any earlier existing prefix makes the row
ambiguous and refuses it.

**WHAT IS WRONG WITH THAT ANSWER, STATED PLAINLY.** It is fail-closed
and it is measured, so nothing is unsound. But it puts a disk read
inside a predicate a guard calls, it makes a pure function of a command
line into a function of the host's filesystem, and its correctness
depends on a coincidence NOT holding rather than on evidence. The
platform keeps the evidence: an operating system holds the real argument
vector, with its boundaries intact, and both platforms this project runs
on expose it.

**THE SHAPE OF THE WORK.** Teach the process reader to return the
argument vector as a LIST where the platform offers one, keep the
flattened string as the fallback where it does not, and let the
interpreter arm decide on the list. The corroboration arm then survives
only as the fallback path, and the ambiguity class it exists for is gone
wherever the list is available. The refusal direction must not change:
where neither the list nor the corroboration can decide, the arm still
declines.

## Acceptance criteria

- WHEN the platform exposes a process's real argument vector THE reader
  SHALL return it with its boundaries intact, and the interpreter arm
  SHALL decide on that list rather than on the flattened string.
- WHEN the list is unavailable THE arm SHALL fall back to the behaviour
  it has today, and SHALL still refuse every row it refuses today.
- WHEN the arm decides on a list THE decision SHALL NOT read the
  filesystem, and a body SHALL prove a spaced entrypoint is identified
  with no corroborating file present.
