---
id: T-310
title: "GitHub-side required checks as a process switch — main refuses an update whose exact commit has not passed the check on the runner, promoted from a staging branch; the switch reports the real protection state or unknown and never claims enforcement a local flag cannot see; off by default"
feature: F-04
milestone: 4
size: M
priority: 3
status: suggested
suggested_by: "the owner's ruling of 2026-09-12: option A, the procedural push check, is accepted for v1 and option B is deferred to when it makes sense, filed here so the plan and the rooms can cite it; the Codex orchestrator's condition that the switch must report actual protection state"
blocked_by: []
touches: [method/runtime/process-schema.yaml, .github/workflows/ci.yml, tools/e2e/scripts/merge.mjs, docs/CONVENTIONS.md, docs/conventions/app-and-ui.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/gates-and-the-push.md, docs/conventions/lanes.md, docs/conventions/merging.md, docs/conventions/shell-and-scripts.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

ADR-025 decision 3 records that in v1 a deliberate bypass of the push check is closed by procedure. The enforced alternative is a ruleset on the public remote requiring the CI check to have passed on the exact commit before main may advance to it, which GitHub supports as a direct promotion from a staging branch without a pull request per landing. Its guarantee holds only when the agents' credentials carry neither bypass nor administration rights and the check comes from a workflow source they cannot weaken. This card is the switch and the promotion step; the ruleset and the token scoping are the owner's acts and are its preconditions, not its work.

## Acceptance criteria

- WHEN the switch is off THE loop SHALL behave exactly as today, and the switch's row SHALL be labelled by its real implementation status.
- WHEN the switch is on THE explicitly authorized closing step SHALL push the merge commit to the staging branch, wait for the runner's check over the intended main-to-candidate range on that exact commit, and promote main to it only when that check is green and the required protections are confirmed active on the remote; a check that is unknown, pending or failed SHALL leave main unchanged; main advancing before promotion SHALL invalidate the check and require it again on the new range; the merge verb's stop-before-commit contract SHALL be preserved, publication belonging to the closing step alone.
- WHEN the switch reports its state THE report SHALL come from the remote's actual protection settings, or say unknown when they cannot be read; a local flag SHALL never claim that enforcement exists.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by the paths its fence reserves and the words its title uses: docs/conventions/app-and-ui.md, docs/conventions/dispatch-and-scratch.md, docs/conventions/gates-and-the-push.md, docs/conventions/lanes.md, docs/conventions/merging.md, docs/conventions/shell-and-scripts.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
