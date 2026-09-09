---
id: T-281-s1
title: "The drill's failure reader has a vitest arm that no real vitest run has ever produced — it is pinned by a fixture somebody typed, and the two are the same claim only by assertion"
feature: F-04
milestone: 4
size: S
priority: 7
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-281, 2026-09-09, at 0ecbab9"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/cli.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

`failingBodies` in tools/e2e/scripts/merge.mjs reads WHICH bodies a run
reported as failing, in two dialects: Playwright's numbered
`file:L:C` line and Vitest's `FAIL <file> > <name>`. The Playwright arm
was written against a REAL captured failure — the log of a drill run
against brief.spec.ts — and the body's fixture is that log's shape. The
Vitest arm was written against nobody's output. Every correction this
repository has ever assigned lived in `tools/e2e/tests/*.spec.ts`
(measured over the nine merges of 2026-09-09), so the vitest path has
never run, and the fixture in cli.spec.ts is a shape a hand typed from
memory of what vitest prints.

That is the T-210 class exactly: a control whose fixture already carries
the property it asserts about. If vitest's real line differs — a
different indent, an extra project prefix, the summary shape under
`Failed Tests` — then a correction whose body lives in `lib/parser` or
`app` grades as a SURVIVOR or as "reds more than itself" on a drill that
actually held, and the merge stops for the wrong reason.

The work: make one body in `lib/parser` or `app` fail on purpose, CAPTURE
its output, and pin the arm against the capture rather than against a
typed shape — the way the Playwright arm already is. If the real shape
differs, that is the finding.

Class parent: T-281. Disposition hint: promote before the first
correction whose body does not live under tools/e2e.
