---
id: T-058-s3
title: The mechanism T-058 exists to correct still stands, verbatim, in the comment of the check T-058 was ordered to preserve
status: suggested
suggested_by: verifier claude-opus-5 @T-058
---

T-058's ninth criterion replaced T-034's false sentence with T-034-s6's
measured table, and the executor did that correctly — the durable record
in `docs/tasks/T-034-map-tasks-lens.md` now says the gates are not
blinded and the binary-skipping searcher is. A repo-wide sweep confirms
the prose is clean.

The same sweep finds exactly one surviving site, and it is inside the
one file T-058's sixth criterion ordered kept **exactly as it is**:

`app/test/map-tasks-lens-dom.test.tsx:579-581`, in the comment heading
the standing C0 check —

> "...makes grep(1) treat it as BINARY. Every grep-based gate in this
> repo then silently stops seeing that file: the raw-HTML gate above,
> `lint:tokens`, the CI greps."

That is T-034-s5's diagnosis word for word, and it is the claim s6
measured and superseded. All three of its assertions are false as
measured on this machine:

| claim in the comment | measured |
|---|---|
| the raw-HTML gate stops seeing the file | it reads through `readFileSync(…, "utf8")` and still matches |
| `lint:tokens` stops seeing the file | same reader; it still matches — and since T-058 it reads raw bytes on purpose |
| "the CI greps" stop seeing the file | `.github/workflows/ci.yml` contains zero greps (`git grep` for grep/rg/ugrep/ag over it exits 1) |

Reproduced independently on a scratch file carrying one U+0000 between
two copies of a needle: `file --mime` reports `charset=binary`;
`/usr/bin/grep` prints "Binary file … matches" and exits **0** with the
line text suppressed; the same grep with `-I` prints nothing and exits
**1**; Node's `readFileSync(…, "utf8")` finds **both** occurrences.

This is not a defect against the executor. The card's criterion six is
explicit that the file is preserved, and it names a good reason — the
check "works, it names codepoint and offset, and it is proven by
planting" (SHA-256 verified unchanged at
`b6995559033ac5c6f693527a430b0a6c98fb87f9980cfeadd13f6d0e459740b1`).
The wrong wording was simply outside the fence T-058 was given.

The whole argument for criterion nine applies here unchanged, and more
strongly: this comment sits directly above the working check, so it is
the FIRST thing a future session reads when it goes to harden this
property, and it will send them to harden the CI greps that do not
exist. Three comment lines, no behaviour, no test change.

Suggested replacement in the same voice: keep the "compiles, bundles and
tests green" opening and the T-012 / T-034 history, and swap the middle
for the measured version — `file(1)` calls the source data, this repo's
Node-based gates still read it, and a binary-skipping searcher
(`ripgrep`, or `ugrep -I`) returns no match at all and exits 1, which is
how every agent session searches this tree.
