---
id: T-228-s2
title: CONVENTIONS' lane bullet says a card whose touches no longer match the manifest's stamp refuses with re-expand, stated without an order — false for writes under docs/tasks since T-228
feature: F-06
milestone: 4
size: S
priority: 4
status: planned
suggested_by: verifier claude-opus-5@subagent @T-228-verify, verdict de5e71e, 2026-09-02
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-228 reordered `decide()` in `.claude/hooks/lane-fence.mjs` to
`alwaysWritable`, then the stale-stamp comparison, then the paths, so a
write under `docs/tasks/` is allowed while the card and the manifest
disagree. CONVENTIONS' lane bullet still reads *"A card whose `touches:`
no longer matches the manifest's stamp refuses with `re-expand`"* with no
order, which is now false for `docs/tasks/` writes. No suite reads that
sentence, so nothing reds; a reader of CONVENTIONS is told the old
behaviour. The verifier could not fix it: CONVENTIONS was outside the
widened fence.

## What is asked

One sentence in the lane bullet stating the order the hook answers in,
with `docs/tasks/` named as the directory the stamp check no longer
suspends, and a pointer at T-228 rather than a restatement of its body.
CONVENTIONS is near its byte ceiling; the sentence replaces the imprecise
one rather than adding to it.

## Acceptance criteria

- The lane bullet names the order alwaysWritable, stamp, paths, and says
  a `docs/tasks/` write is allowed during a half-performed widening.
- CONVENTIONS' byte size does not grow past the warn line.
- docs-gate on CONVENTIONS runs the suites it names green.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 4, at the T-225-s2 merge (6691fc5)

The architect seat. Two CONVENTIONS sentences, one lane: the lane bullet order and the GRAPH REGEN suffix list (T-205-s6).

## Absorbs: T-205-s6 (2026-09-02, at the T-225-s2 merge (6691fc5))

GRAPH REGEN's trigger lists `.ts/.tsx/.js/.jsx` and omits `.mjs`, so a lane changing a `.mjs` derives `not owed` from a suffix list rather than from the graph, and today only a coincidence makes that answer right

**MET WHILE DERIVING T-205's OWN GATES, AND THE RIGHT ANSWER WAS
REACHED BY A DIFFERENT ROUTE THAN THE BULLET'S.** T-205's merge diff
carries 12 paths: 10 `.md` and 2 `.mjs` under `tools/method-evals/evals/`.
`docs/CONVENTIONS.md`'s GRAPH REGEN bullet fires *"at any merge whose
diff touches `*.ts/*.tsx/*.js/*.jsx` or `*.rs` outside docs/"*. **`.mjs`
is not on that list**, so a reader obeying the bullet literally answers
NOT OWED — and a reader obeying its evident purpose (code outside
`docs/`) answers OWED. Two readings, opposite answers, and the bullet is
the thing a lane is told to DERIVE from.

## Why the literal answer happens to be right, and why that is the problem

Measured at `7547c96`: `docs/architecture/graph.json` declares
`languages: ["rust", "ts"]` over 200 files, and holds **zero** paths
under `tools/` and **zero** `.mjs` of any kind. So the graph cannot move
on this diff, and NOT OWED is correct — **but it is correct because of
what the indexer happens to index, not because of what the suffix list
happens to say.** The bullet and the truth agree by coincidence, and a
coincidence is not a derivation. The day the indexer learns JavaScript,
or the day a `.mjs` lands somewhere the walk reaches, the bullet keeps
saying NOT OWED and nothing reds.

**AND THE TREE ALREADY DISAGREES WITH ITSELF ABOUT THIS SUFFIX**:
`MODULE_SUFFIXES` in `tools/e2e/scripts/docs-scan.mjs` is
