---
id: T-160-s2
title: A criterion written inside a fenced or indented block is invisible to the preflight, which is the hole card-figures found in its own paste-ready lines one card earlier
feature: F-04
milestone: 4
priority: 4
size: S
status: suggested
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-160
builder:
verifier:
built_by:
verified_by:
review:
---

## The hole, and where its precedent is

The preflight reads a card through `proseOnly` (card-figures.mjs),
which blanks fenced and indented blocks to empty lines so line numbers
survive. Every claim class but one therefore stops at the block
boundary: a path named only inside an indented block is never resolved,
a `@ <hash>` stamp inside one is never asked about, and a HELD-by claim
inside one is never read against the lane list.

**card-figures.mjs already found this hole in itself and closed it for
exactly one arm**, and its comment says why: the `card:<key>` stamp is
an EXPLICIT machine claim, so it is audited wherever it sits, transcript
blocks included — *"a hole this lane found in its own notes: the
paste-ready lines were pasted into an indented block, which the prose
reader blanks, so the author who built the gate escaped it by
formatting."*

The preflight's own output SAYS this, under the `paths` class's
`cannot:` row, so it is disclosed rather than hidden. What is not
settled is whether it should be closed.

## The argument on both sides, so a seat does not re-derive it

Closing it for PATHS is not obviously right. A card body's indented
blocks are transcripts of commands, and a transcript of `git ls-files`
or of a brief is full of paths that were true at some other ref and are
not claims at all — which is precisely the reason the bare-arrow and
census arms stay prose-only.

The narrow version worth measuring: read paths inside a block ONLY when
the block sits under the acceptance-criteria heading, and measure the
over-fire over the live board before choosing.

## Acceptance criteria

- THE seat SHALL measure the candidate rule over every live card before
  taking it, and SHALL record the residual either way.
- IF the rule is refused THEN the refusal SHALL be written where the
  next reader is, beside the `cannot:` row that already names the hole.
