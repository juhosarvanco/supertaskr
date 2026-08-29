---
id: T-093-s1
title: Everything T-093 added to CONVENTIONS is prose no keeper reads — inverting the rule's own headline reds nothing
status: parked
suggested_by: executor claude-opus-5 @T-093
---

**Measured, not suspected.** T-093's drill mutated the new citation
bullet's headline from *"A MISS IS NOT A REFUTATION, AND THERE ARE AT
LEAST THREE CAUSES"* to *"A MISS IS A REFUTATION AND THERE ARE NO CAUSES
AT ALL"* — the exact inversion of the rule the card exists to write —
and ran every mechanical reader of `docs/CONVENTIONS.md` over it at
`bc2d82a`. `parseRangeRule`, `bootGateTrigger`, `graphRegenTrigger`,
`parseDocsGateRecipe` and `npm run lint:tokens` were ALL GREEN. The two
mutants that DID red were structural (a duplicated `- PORT RULE:`
opener, a duplicated `run from tools/e2e/:` marker) and neither touches
what the rule SAYS.

**So this document's hand rules are held by discipline alone**, in a
repository whose own Law 2 is that a signpost goes stale and an
authority does not. `T-131` argues prose does not bind; this is that
argument with a measurement attached.

## The shape of a fix, not the fix

`tools/e2e/tests/range-rule.spec.ts` is the worked precedent: it derives
every figure in one bullet and pins them by `CHECK_IDS`, so the bullet
cannot be reworded into a lie without reddening by name. The citation
bullet now has the same structure — a numbered list of causes, each with
a named remedy — and the same treatment is available: derive the cause
list and require each cause to name a command that exists.

**The caution T-142 states applies here too**: do not build a lint that
greps for known-bad wording. The property worth pinning is *the list has
N causes and each names a runnable next step*, not *the prose avoids a
blacklist*.

**Fence**: `tools/e2e`. It could not be built inside T-093's
`[docs/CONVENTIONS.md]` fence, which is why it is a suggestion and not a
silent omission.

Amnesty triage 2026-08-29 (triage seat): PARKED — measured rather than suspected, and the measurement is the finding: inverting the citation bullet's own headline — a miss IS a refutation and there are no causes at all — left parseRangeRule, bootGateTrigger, graphRegenTrigger, parseDocsGateRecipe and lint:tokens ALL GREEN, while the two mutants that DID red were structural and touched nothing the rule says. So this document's hand rules are held by discipline alone in a repository whose own Law 2 is that a signpost goes stale and an authority does not. Its caution is the one that also constrains T-142: do not build a lint that greps for known-bad wording. RESURFACES: the next tools/e2e dispatch. range-rule.spec.ts is the worked precedent — derive the cause list and require each cause to name a command that exists, pinned by CHECK_IDS so the bullet cannot be reworded into a lie without reddening by name.
