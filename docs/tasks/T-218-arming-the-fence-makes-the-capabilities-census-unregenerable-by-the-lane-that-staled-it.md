---
id: T-218
title: ARMING THE FENCE MAKES THE CAPABILITIES CENSUS UNREGENERABLE BY THE LANE THAT STALED IT — every test-adding lane now reds `capabilities:check` and cannot fix it, and CONVENTIONS requires the fix in the same commit
feature: F-06
milestone: 4
priority: 2
size: S
status: suggested
blocked_by: [T-199]
touches: [tools/e2e, docs/CONVENTIONS.md]
suggested_by: "T-199's executor, which hit it on its own diff: adding five e2e bodies reddened `capabilities:check` and the hook it had just armed refused it the file, `outside-the-fence`, at the very configuration the card exists to fix"
builder:
review:
---

**TWO RULES, INDIVIDUALLY RIGHT, THAT DO NOT NAME EACH OTHER** — the
class `T-199` was itself filed under, arriving in `T-199`'s own wake.

## The pair

`docs/CONVENTIONS.md`'s tools/e2e bullet, on `npm run capabilities`:

> The regeneration has to land in a COMMIT, and in the SAME commit as
> whatever moved a test name — otherwise the check reds on the next lane,
> layers from its cause, which is the DOCS GATE's own founding story.

And `docs/CAPABILITIES.md` is under `docs/`, which is in NO lane's
`alwaysWritable` — that set is `docs/tasks` and nothing else (the
parser's `UNFENCEABLE_PATHS`, stamped into every manifest).

**So a lane whose `touches:` does not carry `docs/` cannot obey the
sentence.** Any lane that adds, renames or removes an e2e test moves a
test name; the census goes stale in that lane's own diff; and the one
command that repairs it writes a file the lane's fence refuses.

## Why it is new, and why nobody hit it before

Until `T-199` the fence hook judged nothing in this project's dispatch
shape, so a lane simply wrote `docs/CAPABILITIES.md` and no instrument
objected. **The obligation was satisfied by the guard being broken.**
Arming the guard is what surfaces the collision — which is the honest
shape of this finding and not an argument against arming it.

## Measured on T-199's own lane

At `task/T-199-lane`, fence `touches: [.claude, tools/e2e]`, five bodies
added to `tools/e2e/tests/lane-fence.spec.ts`:

    npm run capabilities:check   exit 1
      capabilities: STALE — committed 33163 bytes, a fresh generation is
      33576 bytes; run npm run capabilities

    decide({ file_path: "<lane>/docs/CAPABILITIES.md" })
      BLOCK  judged=true  outside-the-fence

Every other gate on that lane was green, including the 409-body suite.

## What a fix decides

1. **Whether `docs/CAPABILITIES.md` joins the unfenceable set.** It is a
   GENERATED file with one generator and no hand edits, so two lanes
   regenerating it cannot disagree about content — only about whose
   generation ran last, which the integrator resolves at the merge like
   any other conflict. That is a real argument for `UNFENCEABLE_PATHS`
   and it should be ARGUED rather than assumed: the set is currently one
   directory and every addition to it is a hole in every fence at once.
2. **Or whether the obligation moves to the integrator**, and CONVENTIONS
   says so in as many words instead of naming a commit no lane can make.
   Cheaper, and it puts a memory-held obligation where `T-167-s8`
   measured them decaying.
3. **Or whether `capabilities:check` learns to ignore a lane's own
   staleness** — probably wrong, because a check that excuses the common
   case is the check that stops answering.

## Acceptance criteria

- A lane that adds an e2e test SHALL have a route to a green
  `capabilities:check` that its own fence permits, or CONVENTIONS SHALL
  name the seat that owns the regeneration instead of naming a commit
  the lane cannot make.
- WHICHEVER is chosen, the sentence in `docs/CONVENTIONS.md` SHALL be
  true when it is printed.
- Verification: headless.

## SECOND MEASURED INSTANCE — `T-209`'s lane, 2026-09-01

Independently, on a different card and a different fence
(`touches: [tools/e2e]`, base `d8e180b`), eleven bodies added to
`tools/e2e/tests/lane-fence.spec.ts`:

    npm run capabilities:check   exit 1
      capabilities: STALE — committed 33576 bytes, a fresh generation is
      34639 bytes; run npm run capabilities

    decide({ file_path: "<lane>/docs/CAPABILITIES.md" })
      BLOCK  judged=true  outside-the-fence
    decide({ file_path: "<lane>/tools/e2e/scripts/lane-fence.mjs" })
      ALLOW  judged=true  inside-the-fence

The second `decide` is the control: the hook is armed and
DISCRIMINATING, so the block above is a fence verdict and not a guard
refusing everything. Every other gate on that lane was green — e2e
420/420, parser 344/344, app 1116/1116, `lint:tokens` 0, `lint:docs` 0,
docs-gate not owed on the code paths.

**The two instances share no card, no fence and no seat**, which is what
makes this structural rather than one lane's bad luck: the committed
bytes of `docs/CAPABILITIES.md` went stale on both lanes at the moment
they did the thing they were dispatched to do. `T-209`'s lane did not
regenerate, for the reason this card names — a fence is not widened from
inside the lane it fences — and routed the obligation to the integrator's
merge commit, which is where every regeneration in `git log --
docs/CAPABILITIES.md` has actually landed (merge, checkpoint, or a
standalone integrator commit; never a lane's own).

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

## CORROBORATION — third instance, 2026-09-01 (T-210's lane, at `e7c277a`)

Adding `tools/e2e/tests/lane-lock.spec.ts` (12 bodies) staled the census
by the same mechanism, on a third fence and a third seat:

    npm run capabilities:check   exit 1
      capabilities: STALE — committed 39425 bytes, a fresh generation is
      40562 bytes; run npm run capabilities

    decide({ file_path: "<lane>/docs/CAPABILITIES.md" })
      BLOCK  outside-the-fence

Fence: `touches: [tools/e2e, method/lane-protocol.md]` — which shares
only `tools/e2e` with T-199's `[.claude, tools/e2e]` and T-209's, so
**the one thing the three instances have in common is adding a test
body**, not a fence spelling. Every other gate on the lane was green,
including the 491-body suite and the graph check. Routed to the
integrator's merge commit, as the two above were.

**THE CLASS NOW HAS THREE INSTANCES ACROSS THREE LANES, THREE FENCES AND
THREE SEATS**, which is what the triage note above was already holding
for `T-225`'s byte ceiling rather than for want of evidence.
