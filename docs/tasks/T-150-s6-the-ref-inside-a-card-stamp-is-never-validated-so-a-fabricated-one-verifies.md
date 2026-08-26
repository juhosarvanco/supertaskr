---
id: T-150-s6
title: The ref inside a card stamp is never validated, so a fabricated one VERIFIES, and audit accepts any absolute path
status: suggested
suggested_by: verifier claude-opus-5 @T-150-verify
---

`CARD_STAMP` captures a `<ref>` group and **nothing ever reads it.**
`auditCard` asks only whether the deriver still produces the text at
HEAD, so the twelve hex characters beside a figure are decorative.

## MEASURED AT `80aab21`

A scratch file handed to `--audit`:

    board live cards: 316  <- @ 0000000deadbeef ; card:board     -> VERIFIED
    board live cards: 316  <- @ f174d5c32de7 ; card:board        -> VERIFIED
    board live cards: 313  <- @ f174d5c32de7 ; card:board        -> STALE

`0000000deadbeef` is not a commit in this repository. `f174d5c` IS one,
and at `f174d5c` the board held **313** cards — so row two states a
figure against a ref where it was FALSE and earns a VERIFIED anyway,
while row three states the figure that WAS true there and is correctly
STALE.

## THE CONTRACT IS DEFENSIBLE AND THE DISPLAY IS NOT

*"The deriver reproduces this line at THIS ref"* is the right rule: a
figure that reproduces now is true now, whatever ref is typed beside it,
and the tool's own report re-stamps every line with the CURRENT ref, so
its OUTPUT is honest. **What is not honest is the card**, which keeps
whatever the author typed under a verdict that reads as provenance —
inside the one card on this board whose subject is a figure with no
provenance. `T-150`'s own four figures carry `05a09e4` and verify at
`80aab21`; that is harmless here and it is the same mechanism.

## TWO SMALLER RESIDUALS FROM THE SAME PASS

- **A `card:` stamp inside a markdown TABLE CELL is not audited.** The
  `$` anchor is deliberate and documented — *"a pattern that matched
  mid-line would let a sentence quote a stamp and inherit its verdict"* —
  and a trailing ` |` defeats it. Named so it is a decision rather than a
  surprise; no live card does this today.
- **`--audit` reads any path.** `path.resolve(root, argv)` accepts an
  absolute path or one that climbs out of the repository, where
  `docs-gate.mjs` refuses exactly that shape as ambiguous (`T-101-s3`).
  Read-only, operator-supplied, no exposure — a consistency gap between
  two tools in the same directory.

## Disposal

`touches:` `[tools/e2e]`. Either **(a)** verify the ref resolves and is
an ancestor of HEAD, and report a fourth thing when it does not; or
**(b)** print one line in the report saying the ref is not checked and
what VERIFIED therefore means. **(b) is cheaper and may be enough** — the
gate's guarantee is about NOW, and saying so out loud is the whole of
this card's ask.
