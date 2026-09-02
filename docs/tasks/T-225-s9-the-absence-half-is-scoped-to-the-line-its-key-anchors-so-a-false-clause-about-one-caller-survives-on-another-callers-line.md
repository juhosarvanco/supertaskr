---
id: T-225-s9
title: The absence half is scoped to the line its key anchors, so a clause that is false about ONE caller survives on ANOTHER caller's line
feature: F-06
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: verifier claude-opus-5@subagent @V-T-225-s1
blocked_by: []
touches: [tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**NOT A FAILURE OF T-225-s1, AND FILED SO IT IS NOT RE-DERIVED.** That
card's two rejections are both closed and drilled: the default is
bracketed from both sides to ±1, and `Claim` gained the `absent` half that
catches the retired clause restored beside the true text. This is a
THIRD-ORDER variant the fix does not reach, measured while confirming that
it does reach the first two.

`disagreements()` narrows the haystack to the line its `key` anchors —
which is SHAPE EIGHT's remedy and is right — and then asks both questions
of that line only. So a sentence about caller A, planted on caller B's
line, meets neither B's needles nor B's ban list.

Measured at `b1dc556`, one substitution in `dispatch-brief.mjs`, the
pipe-reader arm's tail `"on the tail"` extended to
`"on the tail, and spawnSync past its maxBuffer likewise receives a prefix
with no error"`. That clause is FALSE — the same run measures `ENOBUFS`,
`SIGTERM` and an overrun — and `brief.spec.ts` answers 4 passed on the
margin bodies, 39 passed whole. A neighbouring mutant that plants the
clause where it is TRUE but misplaced survives for the same reason, and
that one is only untidy.

**WHY IT WAS NOT A REJECTION.** The criterion the parent card carries is
that each named caller's own line agrees with what that caller was
measured doing, and it now does, on both questions, with two controls that
themselves red when disarmed. This is the boundary every checker over free
prose has: the ban list is per-claim because the claims are per-caller.

**WHAT A FIX WOULD DECIDE.** Whether the banned phrases are additionally
swept across the WHOLE arm minus the line that legitimately owns each one
— cheap, and it makes the ban list a property of the block rather than of
a line — or whether that is the wrong trade, since the phrase *"receives a
prefix with no error"* is TRUE on the fixed-read line and must stay there.
The shape to weigh is a global sweep with a per-claim allow, against the
current per-claim ban with no global half.
