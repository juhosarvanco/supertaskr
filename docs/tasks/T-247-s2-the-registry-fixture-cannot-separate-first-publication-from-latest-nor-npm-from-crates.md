---
id: T-247-s2
title: The dependency gate's registry fixture answers every field and both registries at once, so neither the first-publication field nor the per-manifest routing is measured
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-247
blocked_by: []
touches: [tools/e2e/tests/landing-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-203`** (where ONE arrangement decides two answers,
the second one is not measuring what it looks like it measures).
**Disposition hint: two small edits to one fixture; fold into the next
lane touching this spec.**

`landing-gate.spec.ts`'s `fakeRegistry` answers every request with
`{ time: { created: D }, crate: { created_at: D } }` for one `D`, and
every body points BOTH `NPUTER_REGISTRY_NPM` and
`NPUTER_REGISTRY_CRATES` at that one server. Two properties the gate
really has therefore go unmeasured, both verified correct at `f6bc5c8`
by direct call rather than by the suite.

**One — first publication versus latest.** The card's second criterion
turns on FIRST publication, and `REGISTRIES` reads `time.created` for
npm and `crate.created_at` for crates (confirmed against the live
services: `left-pad` answers `time.created` 2014-03-14 and
`time.modified` 2024-04-16; `serde` answers `crate.created_at`
2014-12-05 and `crate.updated_at` 2026-07-18). Mutating
`created: "time.created"` to `"time.modified"` does red five bodies —
but only because the fixture serves no `modified` field at all, so the
probe reports *"its answer carries no time.modified"* and the kill is
by field-ABSENCE, not by a wrong date. A fixture serving both dates
would let the substitution through. What is owed: answer `modified` /
`updated_at` with a LATER date than `created` / `created_at`, and a
body asserting a package whose latest release postdates the card still
lands.

**Two — the routing.** Because both variables point at one server, no
body distinguishes a `Cargo.*` addition going to the crates base URL
from a `package.json` addition going to npm's. Pointed at two separate
loopback servers, the gate routes correctly: `app/src-tauri/Cargo.lock`'s
`a-crate-name` reached the crates server and `tools/e2e/package-lock.json`'s
`an-npm-name` reached the npm server, neither crossing. What is owed is
a body that arms the two variables separately and asserts which server
was asked — no body in the file commits a `Cargo.*` change through the
wired hook at all today.
