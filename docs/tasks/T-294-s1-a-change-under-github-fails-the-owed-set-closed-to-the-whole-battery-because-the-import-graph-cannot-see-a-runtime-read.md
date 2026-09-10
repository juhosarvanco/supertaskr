---
id: T-294-s1
title: "A change under .github/ makes the owed set the WHOLE BATTERY, because the only spec that reads the workflow reads it at RUNTIME and no static import graph can see that edge"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-294, measured at the base 1597d2045383cacc5b147f251135b599e6173ae4, 2026-09-10"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The owed-set derivation places a changed path three ways: under a
package root, through the static import graph rooted at the specs, or
through the DOCS GATE's reader map. A path none of the three can place
makes the whole battery owed, with the reason recorded. That is the
right direction to fail in, and it fires on every CI change.

Measured at the base, over the range the last checkpoint added:

    THE DERIVATION FAILED CLOSED — the derivation cannot place
    .github/workflows/ci.yml (it lies under no package root, no spec
    reaches it through a static import, and it is not a document the
    DOCS GATE maps); README.md (…the same three)

So a push that touches only the workflow owes the parser suite, the app
suite, the rust suite and the whole end-to-end leg — about 34 minutes of
runner, for a file no compiled body imports.

## Why the graph cannot see it

`workflow-parity.spec.ts` READS the workflow, and it reads it the only
way a YAML file can be read: `readFileSync` at run time. `specReach`
walks STATIC IMPORT specifiers, so this edge is invisible to it by
construction, not by omission. The same shape is why `README.md` is
unplaceable: `landing-gate.spec.ts` and others read tracked text files
whose paths are string literals.

The instrument that already solves this class exists. The DOCS GATE
derives a reader map for `docs/**` from source SITES rather than from
imports, and `deriveOwed` already consults it — a docs path a reader
reads is placed into that reader's own suite. What is missing is the
same census pointed at the tracked text files OUTSIDE `docs/`.

## What a fix would look like

Widen the site census the DOCS GATE already runs so it also resolves
sites naming a tracked path outside `docs/`, and hand `deriveOwed` that
map beside the docs one. The fail-closed arm stays exactly as it is for
anything the widened census still cannot place, so the change can only
ever narrow a set that is currently the whole battery, and never narrow
one that is currently derived.

## Acceptance criteria

- WHEN the owed set is derived for a range that touches only
  `.github/workflows/ci.yml` THE derivation SHALL place it into the
  end-to-end leg through the spec that reads it, and SHALL name the
  reader in the reason.
- WHEN a tracked text file outside `docs/` is read by no source site
  THE derivation SHALL still fail closed to the whole battery, with the
  reason naming the path.
