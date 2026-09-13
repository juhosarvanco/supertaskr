---
id: T-254-s1
title: "The context pack's bullet set is corpus-wide, not per-card: every card gets the same thirteen bullets because the derivation searches every gate source, and narrowing it to the gates that FIRE on the card's own fence is what turns a flat 40% into a per-card figure"
feature: F-04
milestone: 4
size: M
priority: 3
status: parked
wake: T-292
suggested_by: "T-254's executor, 2026-09-09, from its own measurement: the saving came back as the same 59,716 bytes for three different cards"
blocked_by: [T-254]
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
---

## What was measured

T-254 shipped the pack. Its own criterion 4 measurement, taken over one
building card and two planned ones, came back with the SAME saving three
times — 59,716 bytes — and the same 13 bullets of 25. Only the component
entries moved, because those are the only per-card part.

The cause is the corpus. `citedConventionBullets` searches EVERY tracked
`.mjs` under `.claude/hooks/` and `tools/e2e/scripts/`, so the answer is
"which rules do this repository's gates cite at all", not "which rules do
THIS card's gates cite". That is a true and useful answer — it is what
lets a seat skip 60% of the document knowing which 40% binds — and it is
not the answer T-254's first criterion names.

## What a per-card derivation would take

Two derivations, both of which have a starting point in the tree already:

- WHICH GATES FIRE. `range-rule.mjs` already reads BOOT GATE's and GRAPH
  REGEN's triggers out of their own bullets (`bootGateTrigger`,
  `graphRegenTrigger`, `triggerMatches`) and matches them against a path
  list. The DOCS GATE and the METHOD EVAL GATE have no equivalent reader,
  and the fence's own path set is the path list to match.
- WHICH SOURCE IS WHICH GATE'S. A gate bullet NAMES its own runner: the
  DOCS GATE bullet names `docs-gate.mjs`, `docs-scan.mjs` and
  `xargs-dialect.mjs`; the METHOD EVAL GATE bullet names
  `tools/method-evals/run.mjs`; the LANE PROTOCOL bullet names
  `.claude/hooks/lane-fence.mjs` for the fence. GRAPH REGEN and BOOT GATE
  name no `.mjs` at all, so those two need another route or an honest
  declaration that they contribute the whole corpus.

## Acceptance criteria

- WHEN a card's fence matches no gate trigger but one THE pack SHALL name
  only the bullets that gate's own sources cite, and the brief SHALL say
  which gates it derived as firing and on what path count.
- WHEN a gate declares a trigger this command cannot parse THE pack SHALL
  say so by name and fall back to the whole corpus for that gate — never
  silently drop it, which would narrow the pack by breaking the reader.
- WHEN two cards with different fences are measured THE saving SHALL
  differ, and the card SHALL record both figures with their ref.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-292; narrowing the pack to the gates that fire on the card's own fence is a change to a module being carved.
