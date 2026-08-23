---
id: T-084-s7
title: The root-anchor ledger lives in tools/e2e but four of its six entries argue about app/src-tauri — a fenced lane can red it and not be able to fix it
status: parked
suggested_by: executor claude-opus-5 @T-084-fix
---

`ROOT_ANCHOR_LEDGER` in `tools/e2e/scripts/docs-scan.mjs` is what turns
the DOCS GATE's blind spot from an argument into an account: it names
every root-anchored file the derivation could not link whose SUITE is
not already owed for all of `docs/`, and both the lane and the hand-run
gate assert it equals `unaccountedRootAnchors()` exactly. A new one
cannot arrive quietly. **That is the point, and it has a cost.**

Of the six entries today, four are `app/src-tauri/crates/nputer-index/**`
and one is `app/test/**`. Only `tools/e2e/**` is in the same fence as the
ledger.

So: a lane fenced to `[app-index]` or `[app-shell]` that adds a test file
computing the repository root — `common::repo_root()`, or
`resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")` — reds
`npm test` from tools/e2e with *"holds the root, unargued"*, and the fix
is one entry in a file that lane may not touch. The executor's options
are a room, a suggestion, or a fence widening, and none of the three is
free. **The red is correct and the file is named; what is missing is a
cheap in-fence way to discharge it.**

Three shapes worth weighing, none of them obviously right:

1. **Move the ledger to the tree.** A `docs/architecture/root-anchors.md`
   or a `.docs-anchors` file at the repo root that any lane may edit,
   read by the scanner. Cheapest for the fenced executor, but it turns a
   frozen constant into a text file whose entries nobody type-checks, and
   it puts a code input under `docs/` — which this gate would then have
   to own, recursively.
2. **Narrow the trigger to a diff.** Only demand an argument for a
   root-anchored file that the CURRENT diff added, so a lane pays only
   for what it wrote. That makes the assertion range-dependent, and the
   whole point of `docs-gate.mjs` taking PATHS rather than a range is
   that it forms no opinion about which two commits the diff means.
3. **Leave it and let the room happen.** The population is small (24
   root-anchored files in the whole tree, 6 unaccounted) and grows
   slowly; a room per occurrence may genuinely be cheaper than either
   mechanism.

Related but distinct: `T-084-s2` (the gate is not a CI step) means this
only bites a lane that runs the e2e suite at all. If `s2` is ever fixed,
this bites everybody.

**PARKED at the fifth triage (2026-08-20).** Unpark when T-084-s2's promoted card lands (the gate as a CI step). STATE already rules option 3 for now at 24/6; re-weigh then.
