---
id: T-154-s3
title: A new spec file makes the generated behaviour census stale, and nothing in the lane or in CI says so
status: suggested
suggested_by: executor claude-opus-5 @T-154
---

`docs/CAPABILITIES.md` is GENERATED from the e2e spec names (T-138-s1,
ADR-019) and carries its own currency command —
`npm run capabilities:check` from tools/e2e, "exit 1 when stale", says
its own header. **Nothing runs it.** Derive at your own ref: no spec
under `tools/e2e/tests/` mentions it, and `.github/workflows/ci.yml` has
no step for it (`grep -rn capabilities tools/e2e/tests .github/` at
`3607a94`).

So a card that adds a spec file leaves the census stale, silently, and
the staleness reaches whoever reads CLAUDE.md's instruction to *"check
docs/CAPABILITIES.md first"* before concluding a feature is missing —
which is the exact failure the generated census was built to remove. It
is the shape of the DOCS GATE's own two incidents one document over: the
document goes wrong three layers from the edit, and the person who finds
it is not the person who caused it.

**THIS CARD'S OWN LANE IS THE INSTANCE.** T-154 adds
`tools/e2e/tests/lane-fence.spec.ts` with twenty-five behaviours; the
suite went 233 → 258 tests. `docs/CAPABILITIES.md` is outside T-154's
fence, so the regeneration is the integrator's at the checkpoint
(`npm run capabilities` from tools/e2e) and the executor could only say
so — which is why it is said here as well as in the report, because a
report is not a record.

## The fix, and the choice inside it

A spec body that runs the generator's own `--check` arm and fails on
stale is the cheap version, and it fits beside the docs-input gate:
`capabilities.mjs` is already a derived docs reader in the tools/e2e
suite. THE CHOICE IS WHETHER IT REDS THE LANE OR ONLY CI. A lane-red
means an executor whose fence does not reach `docs/` cannot make its own
lane green — the routing problem T-154 hit here — so the honest options
are (a) red the lane and rule that a spec-adding card's fence must reach
`docs/CAPABILITIES.md`, or (b) red at the checkpoint only, as a
CI/integrator step, keeping the executor's fence narrow. Both are
defensible; picking one is triage's call and not an executor's.
