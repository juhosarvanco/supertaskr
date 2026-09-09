---
id: T-280-s3
title: "A push whose range owes NOTHING is allowed against a token that records every suite RED at another tree, because an empty owed set asks the token no question at all"
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-280 phase 2, 2026-09-09, measured at cc7905d on the bench ../nputer-V-T-280"
blocked_by: [T-280]
touches: [.claude/hooks/gate-token.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

T-280's whole value case is the docs-only push that owes nothing, and
that case is right. This card is about what the guard then does with the
token it is holding, which is: nothing.

`judgeToken` derives `need` from `owed.suites`. When the range owes no
suite, `need` is empty, and every loop after it — the missing check, the
stale check, the unkeyed check, the red check — iterates over an empty
list. The judgement returned is `token-green`, with the detail
`"0 graded suite(s) recorded GREEN against HEAD's own tree ..."`.

Measured on the bench at `cc7905d`, with a token whose four entries are
all `verdict: "RED"` against a DIFFERENT tree:

    judgeToken({ token: allRed, tree: T,
                 owed: { range: "A..B", suites: [], e2e: {whole:false,specs:[]} } })
    -> { state: "fresh", code: "token-green",
         detail: "0 graded suite(s) recorded GREEN ..." }

So a seat whose parser suite is RED at the tree it is pushing may push a
docs-only commit, and the guard says the gates are green. **That may well
be the right rule** — the red was not caused by this push, the owed set
is honestly empty, and CI still runs the whole battery. The point of this
card is that the rule is currently an EMERGENT property of an empty loop
rather than a decision anybody made, and it is not stated anywhere: not
in CONVENTIONS' new bullet, not in a body, not in the refusal vocabulary.

The question to rule on, with evidence rather than taste:

- **LEAVE IT, AND SAY SO.** The owed set is the whole rule; a suite this
  range does not owe is not this push's business. Then CONVENTIONS says
  that in as many words, and a body pins `owed.suites === []` to
  `token-green` so the behaviour cannot drift silently.
- **REQUIRE NO KNOWN RED AT THE PUSHED TREE.** An empty owed set still
  refuses if the token records a suite RED against the very tree being
  pushed — cheap, and it stops a push that the pusher already knows is
  broken. It does NOT re-introduce the battery: a stale or missing entry
  stays fine, only a live red at this exact tree blocks.

Whichever lands owes a body of the shape T-280's own bodies have: the
empty owed set with a clean token (allowed), and the empty owed set with
a token red AT THIS TREE (the two rules differ exactly there, which is
what makes it a discrimination rather than a restatement).
