---
id: T-219-s5
title: "Two documents outside T-219-s3's fence still describe `carveOutFor`'s own-card arm as a carve-out the hook applies — one spec comment says the assertion pinning it will red when it is fixed, and it did not"
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: executor claude-opus-5@subagent @T-219-s3
blocked_by: []
touches: [tools/e2e/tests/lane-fence.spec.ts, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**Class parent: `T-219-s3`**, which removed `carveOutFor`'s first arm —
the one reading `manifest.excluded` and answering for a lane's own card
file — after measuring that no manifest the parser can produce selects
it. The hook's own header was rewritten in that lane's fence. **Two
sites that describe the same arm are outside it**, so they were routed
rather than touched, and both are PROSE: no assertion moved and no body
is red today.

## The exact sites

1. `tools/e2e/tests/lane-fence.spec.ts`, the comment block above the
   `ownCard` assertions in *the carve-outs each free a DIFFERENT write,
   and the fence still holds around them* (the paragraph opening "THE
   OWN-CARD WRITE IS STILL ALLOWED, AND IT NO LONGER TAKES THE
   CARVE-OUT"). It reads `carveOutFor`'s FIRST arm answers for a lane's
   own card file` in the present tense, and ends *"the arm is ROUTED as
   `T-219-s3` rather than touched here, and this assertion is what will
   red when it is fixed."* **The arm was removed rather than made
   reachable, so the assertion did NOT red** — it is now the permanent
   pin, which is what `T-219-s3`'s own card prescribes for that branch of
   the decision (*"IF the arm is removed THEN … its comment pointing here
   SHALL be updated"*). The assertion and its message are still correct
   and should stay; only the comment's tense and its promise move.

2. `tools/e2e/tests/lane-fence.spec.ts`, the comment on the
   `"missing the excluded field the carve-outs are read from"` case in *a
   manifest the hook cannot read is a refusal, never a shrug*. It says
   the lane-less arm *"can only do that from a manifest that carries the
   carve-out"*. `readManifest` still REQUIRES `excluded` and the
   assertion is unchanged, but the field is now a SHAPE check — a
   manifest missing it was written by a writer older than `T-154-s2` —
   and no arm reads it. The label string is part of the assertion's
   message rather than a bare comment, so this one is a two-line edit.

3. `docs/CONVENTIONS.md`, the `THE LANE PROTOCOL` bullet, sentence
   opening **THE CARVE-OUTS ARE CRITERIA AND NEVER THE HOOK'S
   JUDGEMENT**. It lists three: `docs/tasks/` as `alwaysWritable`, *"a
   card's own file is outside every fence (its `excluded`)"*, and this
   seat's standing writes. The middle clause's CLAIM is still true — a
   card's own file is outside every fence — but it is listed as a
   carve-out the hook applies, and the hook no longer has an arm for it.
   `expandFence` subtracts the file from `paths` at dispatch, so the
   write meets no reservation at all. **The regex the spec's *the
   carve-out set this hook holds is the one docs/CONVENTIONS.md
   publishes* body extracts (`never a lane's to veto — exactly (.*?), no
   more`) is in the THIRD clause and is untouched by this**, which is why
   nothing reds.

## And the gap the removal leaves, MEASURED rather than supposed

`T-219-s3`'s resurrection drill put the removed arm back, byte-identical
to the text it had at `a7cc65b8064d`, and ran the whole of
`lane-fence.spec.ts` at `f6aca05`: **54 passed, 0 failed.** The suite
cannot tell the arm's presence from its absence in EITHER direction —
which is exactly the sentence the arm's own header wrote about itself
(*"an arm no write can select is an arm no mutation can kill"*) and the
reason it was removed rather than left inert. **Nothing reds if somebody
re-adds it**, so the removal is protected by a comment today and by no
body.

**A BODY THAT CLOSES THAT MUST ASSERT THE ARM, NOT THE PRESENCE OF A
CARVE-OUT.** A direct call `carveOutFor(<a card file>, <a manifest with
that file in `excluded`>)` is NOT `undefined` either way: with the arm it
answers the own-file arm, and without it the very next arm answers, since
every card lives under `docs/tasks` and that is `alwaysWritable`. So the
discriminator is the `domain` and the `why` the call returns — the
own-file arm names `${taskId}'s own card file` and the unfenceable arm
names `no card may fence it` — and a body that only checked for a
carve-out being returned would pass under both arrangements and pin
nothing.

## Acceptance criteria

- Site 1's comment SHALL describe the arm in the past tense and name
  `T-219-s3` as where it was removed and why, replacing the promise that
  the assertion will red; the assertion and its message stay.
- Site 2's label SHALL say the field is required as a manifest SHAPE
  check rather than as a carve-out source.
- Site 3's sentence SHALL attribute the own-file carve-out to
  `expandFence` at dispatch rather than to the hook's criteria, without
  moving the published `docs/STATE.md`/`docs/checkpoints` clause the
  spec's regex reads.
- A BODY SHALL pin that `carveOutFor` answers a card file through the
  UNFENCEABLE arm and not through an own-file arm, discriminating on the
  returned `domain`/`why` rather than on a carve-out being returned at
  all — the paragraph above says why presence proves nothing — and it
  SHALL be demonstrated red against a re-added arm before the card
  closes.
- The three prose edits above SHALL leave every existing body green:
  `lane-fence.spec.ts` in full, and the CONVENTIONS comparison body by
  name.

## The fence collision to expect, and the lane it may belong to

**Both sites were held by ONE live lane when this was filed** — read
2026-09-02T04:57Z on `Mac.lan`, from `git worktree list --porcelain`
joined to each lane's own manifest: `T-215-s1` on
`task/T-215-s1-limits-paragraph-keeper` reserves exactly
`docs/CONVENTIONS.md` and `tools/e2e/tests/lane-fence.spec.ts`. So this
card is not startable while that lane lives, **and the cheaper route may
be to hand these three edits to `T-215-s1` rather than to dispatch this
card at all** — that is the dispatching seat's call, not this card's.
`T-219-s3`'s own brief said the spec was "free now but not yours",
which was true when the brief was assembled and false by the time the
lane measured it; the worktree list is the authority.
