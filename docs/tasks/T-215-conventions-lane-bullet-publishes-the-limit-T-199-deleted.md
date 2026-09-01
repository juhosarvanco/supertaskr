---
id: T-215
title: docs/CONVENTIONS.md's lane bullet still publishes the limit T-199 deleted — "a path outside the writing checkout is allowed in BOTH seats", and the sibling-lane hole "deliberately" left open
feature: F-06
milestone: 4
priority: 2
size: S
status: suggested
blocked_by: [T-199]
touches: [docs/CONVENTIONS.md]
suggested_by: "T-199's executor, which could not correct it: docs/CONVENTIONS.md is outside `touches: [.claude, tools/e2e]` AND was held by the live T-189 lane at dispatch"
builder:
review:
---

**A DOCUMENT THAT PUBLISHES A GUARD'S LIMITS IS PART OF THE GUARD**, and
two of the sentences it publishes stop being true the moment `T-199`
merges.

## The two sentences, verbatim

`docs/CONVENTIONS.md`, the lane bullet's *THE LIMITS, WRITTEN DOWN
BECAUSE A GUARD BELIEVED WIDER THAN IT IS IS WORSE THAN NO GUARD*
paragraph:

> A path OUTSIDE the writing checkout is allowed in BOTH seats, the
> manifest's domains being repository-relative: the scratchpad and a
> drill tree are reachable, and so is a sibling lane's own tree — that
> last one deliberately, because nothing separates an architect reaching
> into a lane from THAT LANE'S OWN EXECUTOR writing into it from a shell
> parked elsewhere.

After `T-199` the WRITING checkout is not a term in the rule at all. What
survives is narrower and is already written in
`.claude/hooks/lane-fence.mjs`'s limit 2: **a path in NO git checkout is
not judged.** The scratchpad and `/tmp` are still reachable; a drill tree
is reachable by limit 3 (detached), not by this one; **a sibling lane's
tree is NOT reachable any more** — it is judged by that lane's fence.

## Why it is a card and not a line in T-199's diff

`docs/CONVENTIONS.md` is outside `T-199`'s `touches: [.claude,
tools/e2e]`, and at that lane's dispatch it was held by the live
**T-189** lane. Rule 5 says an executor whose work reaches outside its
own fence has found a dispatch error rather than a licence — so it was
routed, and this is the routing.

**THE DIVERGENCE REDS NOTHING**, which is why it needs a card rather
than a gate to catch it. `lane-fence.spec.ts` compares the hook's
LANE_BRANCH_RE and its carve-out set against this document, but nothing
compares the LIMITS prose against the code, so the two can drift in
silence — which is the shape of `T-199` itself one document over.

## Acceptance criteria

- The lane bullet's limits paragraph SHALL state the limits
  `.claude/hooks/lane-fence.mjs` actually holds after `T-199`, including
  the sibling-lane residue named as a residue rather than as a design.
- The dispatch brief's *"a PreToolUse hook enforces it"* sentence SHALL
  be true when printed (`T-199`'s fourth criterion) — say plainly that
  it is enforced only from the merge of `T-199` forward, because
  `.claude/settings.json` runs the hook out of `CLAUDE_PROJECT_DIR`,
  which is the DISPATCHING checkout and not the lane.
- CONSIDER whether the limits paragraph should be COMPARED against the
  hook's header the way the branch spelling already is, rather than kept
  in step by hand.
- Verification: headless.

## TRIAGE, 2026-09-01 — DISPOSITION IS **PROMOTE**, AND IT IS NOT APPLIED

Triaged at the architect seat this date. The finding is real, its
evidence reproduces, and its blocker has landed. **The disposition is
PROMOTE and the stamp still reads `suggested`** — held for one reason
that is not about this card:

**THE DISPATCH BRIEF HAS NO ROOM.** `brief.mjs --dispatch` emits 60,731
bytes against a 65,536-byte spawn buffer at `a014b81`. Promoting the
seven correct suggestions in this cluster costs **4,515 bytes** and
leaves **290** — inside the boundary that silently truncates, and the
same boundary that reddened a lane's own gate earlier in this window.
Four went through; this one is the arithmetic's remainder, not triage's.

**READ THIS AS A TOOL LIMIT, NEVER AS A VERDICT ON THE FINDING.** A card
held back by a byte ceiling looks identical on the board to one triage
declined, and that is the thing this paragraph exists to prevent. Filed
as `T-225`; when it lands, promote this card without re-triaging it.
