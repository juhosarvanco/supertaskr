---
id: T-137-s12
title: The fenced reason hard-codes the singular while naming a list, so the shipped report says "no card for it" about two lanes eight times on a page that gets it right four lines above
status: suggested
suggested_by: verifier claude-opus-5 @T-137-verify-2
touches: [lib-parser]
---

**FOUND BY A POISON ARM THAT SURVIVED, WHICH IS THE ONLY WAY IT WOULD
HAVE BEEN FOUND** — nothing reds for it, in either direction.

`lib/parser/src/lanes.ts`, in `rule()`'s `fenced` branch, builds the
residual clause that names the lanes it could not compare:

    const residual =
      blind.length === 0
        ? ''
        : ` And ${blind.map((h) => laneName(h.lane)).join(', ')} could not be compared at all — ` +
          'no card for it in this checkout — so this overlap may not be the only one.';

**`blind` is a LIST and `it` is a hard-coded singular.** With two
card-less lanes live the shipped `--dispatch` report prints, at
`2f7ad29` on 2026-08-26 with `T-141` and `T-145` both card-less:

    And T-141 (refs/heads/task/T-141-lane at …), T-145 (refs/heads/task/T-145-lane at …)
    could not be compared at all — no card for it in this checkout —
    so this overlap may not be the only one.

**Eight times in one report.** Four lines above, the consumer's own
sentence agrees in number correctly — *"so no fence could be proved
disjoint from **them**"* (`dispatch-order.mjs`, the empty-STARTABLE
branch, which carries
`o.lanesWithNoCard.length > 1 ? "them" : "it"`). **One page says both.**

## WHY THIS IS WORTH A CARD AND NOT A SHRUG

The module's own comment, two functions away, rules on exactly this:

> **NUMBER AGREEMENT IS NOT DECORATION HERE.** Three lanes went live on
> this machine while the sentence was being written, and a reason a human
> is meant to ARGUE with cannot read "T-141, T-145 has no card … disjoint
> from it".

That comment sits above the `unfenceable` branch, where the same author
introduced a `many` flag and pinned **both** directions with two
dedicated poison arms (`A6` forces it FALSE, `A7` forces it TRUE, one
unique kill each). **The `fenced` branch was written in the same commit
and did not get the flag.**

## THE MEASUREMENT THAT SAYS NOTHING PINS IT

Arm **V2**, producer only, run in a detached scratch worktree at a
17-character root and restored by sha256 to
`1ad1871f9fc54bfe40250a7682bcb1f034d72e2d58b2a53a58ed883e6b9c6481`:

    mutation                                   suite   result
    'no card for it'  ->  'no card for them'   parser  exit 0, 314/314, ZERO kills

The nearest existing arm, **A3**, forces the whole residual to `''` and
kills exactly one body — so the clause's **PRESENCE** is pinned and its
**NUMBER** is pinned in neither direction. Whichever word ships, the
suite is green.

## THE FIX, AND THE PIN IT OWES

Take the `many` flag the sibling branch already has:

    const many = blind.length > 1;
    … could not be compared at all — no card for ${many ? 'them' : 'it'} in this
      checkout — so this overlap may not be the only one.

**And pin BOTH directions**, the way `A6`/`A7` pin the sibling: the
existing outranking body (`a PROVED overlap still outranks it`) already
produces exactly one blind lane and can assert the singular; a second
body with two blind lanes asserts the plural. Without the second body the
plural half stays exactly as unpinned as it is today.

## SCOPE

`[lib-parser]` — one clause in one file, plus one test body. It touches
no ruling: the state is right, both lanes ARE named, and no information
is lost. **This is a word.** It is filed rather than folded into the
verdict because `method/roles/verifier.md` step 6 says findings that are
not failures are cards, and because the class — a reason sentence that
disagrees with itself on the same page — is the kind that gets read by a
human choosing whether to override a COARSE-fence warning.
