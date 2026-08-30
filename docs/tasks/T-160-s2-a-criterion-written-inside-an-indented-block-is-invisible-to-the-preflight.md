---
id: T-160-s2
title: A criterion written inside a fenced or indented block is invisible to the preflight, which is the hole card-figures found in its own paste-ready lines one card earlier
feature: F-04
milestone: 4
priority: 3
size: M
status: planned
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-160
builder:
verifier:
built_by:
verified_by:
review:
---

**PROMOTED at the first standing triage, 2026-08-30, as the OWNER OF ITS CLASS — four findings, one seat, one pass over the same three files.**

The class is *the preflight's reading of a card is narrower or blunter
than the thing it claims to check*. All four members land in
`tools/e2e` on `card-figures.mjs`, `card-preflight.mjs` and `brief.mjs`;
each was re-derived at this ref before absorption and each HOLDS. They
are absorbed rather than filed beside each other because four cards
against one function region are four triage decisions that can disagree
and four lanes that would each rebuild the same fixture — the T-111-s10
precedent (seven findings, one edit).

**EVERY ABSORBED FINDING KEEPS ITS OWN ACCEPTANCE.** This card is not a
licence to sweep: each arm below names its own command, and the arms
that ask for a MEASUREMENT before a change must report the measurement
even where they then decline to change anything.

Absorbs: T-160-s3 (Standing triage 2026-08-30 (architect seat)) — the preflight cannot be asked for on its own — `brief.mjs:177` refuses `--preflight` without `--task`, and `brief.mjs:216` emits arm one for any `--task`, so the card selector and the brief's trigger are the same flag. Re-derived at this ref: in `brief.mjs --task T-059 --preflight` the `# THE CARD PREFLIGHT` header appears at output line 166, behind 165 lines of brief. The card's own body rules it *"NOT a defect and that is why it is a suggestion"*, so it rides here as an ergonomics arm whose constraint is that no pinned invocation's output may change. File removed in this commit.

Absorbs: T-160-s5 (Standing triage 2026-08-30 (architect seat)) — the ownership arm reads a criterion that promises a path will NOT change exactly like one that promises it will, so the sharpest false positive is a card being careful. Re-derived at this ref: `brief.mjs --task T-056 --preflight` exits 1 naming `app/src/lib/agent-store.ts`, a path T-056's criteria name only inside `BLAST RADIUS: ... SHALL be zero-byte task-branch diffs`. The ask is a MEASUREMENT FIRST — partition every ownership hit by negative-scope phrasing and read both halves by hand — and only then exclude the shape or record the refusal. **Its census must be RE-DERIVED, not copied:** the card says 18 hits on done cards and 1 planned; at this ref the arm fires 19 times across 16 cards, split 14 done / 4 parked / 1 planned. The headline is sound and the split has moved, which is this card's parent's own lesson about transcribed figures. File removed in this commit.

Absorbs: T-157-s3 (Standing triage 2026-08-30 (architect seat)) — a criterion written inside a fenced or indented block is invisible to the same `proseOnly` reader, and the EARS-shape arm is the other half of that blindness — it reported 2 of 3 of T-157's own acceptance criteria as not reaching SHALL. Same files, same reader, same pass: `card-figures.mjs:187-198` blanks fenced blocks and any line matching `/^ {4,}\S/`, and both `card-preflight.mjs:484` (path claims) and `:564` (ref stamps) read its output. Absorbed here rather than left in F-04's own column because a lane that narrows the prose reader for one arm and not the other leaves the blindness half-fixed. File removed in this commit.

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
