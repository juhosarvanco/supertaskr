---
id: T-244-s2
title: "The CLI ships inside `@supertaskr/e2e` (private) because T-244's fence named `tools/e2e/`, so the package a user would install is the e2e lane's — the name `supertaskr` is free at 2026-09-09 and nothing yet claims it"
feature: F-01
milestone: 4
size: M
priority: 6
status: suggested
suggested_by: "executor claude-opus-5@subagent, in T-244's lane, 2026-09-09 — the fence T-244 was dispatched with named tools/e2e/, and the criteria named tools/e2e/bin/ and tools/e2e/scripts/cli.mjs as the creation targets"
blocked_by: []
touches: [tools/e2e/]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

T-244 built `npx supertaskr` inside `tools/e2e/`, because that is where
its fence and its named creation targets put it. The consequence is that
the package carrying the `supertaskr` bin is `@supertaskr/e2e`, whose
`package.json` says `"private": true` and whose description is the
real-input E2E lane. `npm pack` and a local install work — T-244's spec
proves them on every run — but the artefact is honestly the wrong one to
publish: its name is the lane's, its `private` flag is the lane's, and
its version is the lane's.

The name is not the obstacle. Re-derived at this ref: `npm view
supertaskr version` answers `E404 Not Found` (2026-09-09T00:07Z,
Mac.lan), with `npm view react version` answering `19.2.8` at exit 0 as
the control that the query can answer otherwise. **The name is free and
unclaimed.**

## What a fix would decide

Where the published package's ROOT lives, which T-244 could not choose:

- a package root of its own (`cli/`, or the repository root) with its own
  `name: supertaskr`, its own version line, `files` and `bin`, importing
  the scripts rather than re-hosting them; or
- keeping `tools/e2e/` as the root and renaming the package, which makes
  the e2e lane and the shipped CLI one artefact — a claim ADR-011's
  three-standalone-packages shape argues against.

Whichever wins, the claim on the registry is @human's (T-266 is the
checklist), and nothing here publishes.

## How to know it is fixed

`npm pack` in the chosen root yields a tarball whose `package.json` reads
`"name": "supertaskr"` and carries no `private` flag, and the existing
body in `tools/e2e/tests/cli.spec.ts` installs THAT tarball and runs
`npx supertaskr` against it.
