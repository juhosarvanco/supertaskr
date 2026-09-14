---
id: T-295-s17
title: "A kept spelling is announced to stderr and nowhere else, so the merge that exercised an exemption commits no trace of having done so — the ledger holds a step id and an exit, and the merge message is written from the verdict's own sentences"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "the T-295-s4 verifier (phase 2), claude-opus-5@subagent, 2026-09-14, grading that card's criterion 3 against its own reason for existing"
blocked_by: [T-295-s4]
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

T-295-s4's criterion 3 says a kept spelling is news, never silence, and
the build answers it: the keeper step prints one announcement per file,
class and table entry, on stderr, in default output. That is the right
stream and the right prominence — it is the one the acknowledged drill
uses, which is the reference the criterion names.

It is also the whole of it. The step's ledger entry carries a step id, a
title and an exit code. The readings file carries the `## Meters` block.
The merge message is written from the verdict's own sentences and counts
rather than composed. So the announcement reaches a terminal and nothing
the merge commits: a week later, a seat asking which merges waved a
credential-shaped value through has no record to read, and the only
answer available is to re-derive the added lines of every merge and run
the keeper over them again.

The argument for making that durable is the argument the exemption
itself rests on. A way through a guard is safe in proportion to how
visible its exercise is, and visibility that expires when the terminal
scrolls is visibility for the seat running the merge alone — never for
the reader who comes to the record later, which is the reader a keeper
exists to serve. The exemption is already narrow: the value is
enumerated and the site is named, so the record owes a count and a class
rather than a value, and can stay redacted exactly as the refusal is.

Where it should land is the card's question. The merge message is the
most readable and the most contested, because that message is derived
from the verdict rather than composed and this line is not the verdict's
to write. The readings line is the least contested and the least read.
The ledger is the natural home for a fact about a step, and it is also
the one whose shape every step shares.

## Acceptance criteria

- WHEN a merge exercises a fixture exemption THE verb SHALL record the
  exercise in something the merge COMMITS, naming the file, the class
  and the table entry that fired and repeating no value, pinned by a
  body in tools/e2e/tests/merge.spec.ts over a real repository.
- WHEN a merge exercises none THE committed record SHALL carry nothing
  about one, pinned by the control arrangement in the same spec, so the
  presence of the record is a fact about the merge rather than a line
  that always prints.
- WHERE the record lands in the merge message THE card SHALL say how
  that squares with the message being written from the verdict's own
  sentences and counts rather than composed, because that rule is
  asserted by a body of its own.

## Implementation notes

## Verdicts
