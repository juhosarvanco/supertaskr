---
id: T-305
title: The push guard announces an over-run — a token that graded more suites or specs than the pushed range owed is allowed and NOTICED, naming the legs run beyond the owed set, so a seat that still runs the whole battery by habit is told
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 3
status: building
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-294]
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

On 2026-09-10 the seat ran four whole legs for ranges that owed two specs, four times, after T-280 had made the push owe its range; nothing said so.

## Acceptance criteria

- WHEN the guard judges a token whose graded set exceeds the range's owed set THE push SHALL be allowed and a notice SHALL name each suite or spec graded beyond the set with the minutes the owed set would have taken — seen on a planted token.

## Implementation notes

Built by claude-opus-5@subagent on branch task/T-305-the-over-run-notice,
base 3e791c58f6db8bb798057ebc126c2a222eb74022.

**Where it sits.** One arm inside the verdict-token arm of
`.claude/hooks/push-guard.mjs`, reached only where the token judged
FRESH and an owed set was derivable for the push's own range. It re-runs
nothing, derives no owed set of its own — the one `decideWith` already
asked the runner for is the one it reads — and returns no verdict. The
sentence rides in `notices`, which the runner writes to stderr before the
verdict and whatever the verdict is, so an over-run is still heard on a
push a later arm refuses.

**Two axes, because the owed set has two.** A SUITE the token records as
graded against HEAD's own tree that the range does not owe; and the one
scopable leg either run WHOLE where the range owed part of it, or run
with a scope carrying spec files the range does not owe. An entry with no
scope graded the whole leg, which is that field's meaning in
`.claude/hooks/gate-token.mjs`, so the whole-leg face is an absent field
rather than a list of names this arm cannot know.

**Three things are deliberately not an over-run**, each with its own body
and its own mutant on this bench:

- a leg graded against an EARLIER tree. `writeToken` merges entries
  across runs, so a leg graded before the last commit is still in the
  token, and minutes paid for a tree this push does not carry were not
  paid for this push. `judgeToken` cannot see it either way: it reads
  staleness only over the suites it requires, which is exactly why this
  arm asks for itself.
- a leg the runner DECLINED to grade. That verdict word means no
  toolchain, zero bodies, or a count that would not sum, and a leg that
  did not run cost nobody a minute. The word is pinned against the
  runner's own `judge` rather than against a literal here.
- a push where the owed set could not be derived at all. There is no set
  to exceed, and the fallback is already the whole battery.

**The minutes are a TABLE and the notice says so.** Both figures are
docs/CONVENTIONS.md's own, in the bullet that publishes the blessed
gate-runner: the browser leg at ten of the battery's eleven minutes,
measured on T-224's fix passes, and the other three legs at seconds each.
So the browser leg is 600 seconds, the battery is 660, and the residual
60 is split three ways; the per-spec figure for a narrowed leg is 600
over the 40 spec files tracked at the base ref, which is 15 seconds each.
A body reads both sentences out of the document and checks the table
against them, so a re-measurement landing there reds a body here by name.
No figure in it was measured by this lane, and the reason is on the
constant: THE TOKEN CARRIES NO DURATION AT ALL — a suite entry records
the moment it was written and never how long its suite took — so there is
no reading of the actual run for this arm to prefer, and every sentence
it prints says about. T-305-s1 is the card for closing that.

**Declared limits.** A push refused for another reason prints the refusal
and not this notice, which is deliberate: the refusal is the news. A leg
whose figure this table does not carry is listed as unpriced and the
estimate is called a floor rather than silently counted as nothing. A
long list of spec files is counted first and sampled second, capped, so a
truncated list can never read as the whole one.

**What the merge owes.** The behaviour census gains 5 sentences, so the
merge commit owes `npm run capabilities` — the standing rule for a lane
that adds test bodies. Nothing under method/ moved and no rule text was
reworded.

**One new import edge, declared.** tools/e2e/tests/push-guard.spec.ts now
imports the runner at tools/e2e/scripts/gate-run.mjs, for one function:
the judge that writes the verdict word this arm filters on. A change to
the runner therefore owes this spec from now on, which is the honest
reading of a body that asserts against the runner's behaviour.

## Verdicts
