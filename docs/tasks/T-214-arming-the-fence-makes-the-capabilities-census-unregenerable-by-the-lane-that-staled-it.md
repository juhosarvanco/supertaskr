---
id: T-214
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
