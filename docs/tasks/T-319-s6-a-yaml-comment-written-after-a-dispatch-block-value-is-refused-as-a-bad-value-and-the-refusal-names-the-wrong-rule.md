---
id: T-319-s6
title: "A YAML comment written after a dispatch block value is refused as a bad value, and the refusal names the wrong rule: the block's own key line may carry a comment and none of its value lines may, in the one record an owner edits by hand and approves verbatim"
feature: F-04
milestone: 4
size: XS
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-319 phase 2, measured on the bench at the lane's tip while probing the reader's tolerance of the idiom the two runtime files are written in"
blocked_by: []
touches: [lib/parser/src/process-settings.ts, lib/parser/test/process-settings.test.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The dispatch block reader takes a value line as everything after the
colon, trimmed, with its quotes stripped. A trailing YAML comment is part
of that value. Measured on the verifier's bench at the lane's tip:
`approval: standing  # the mode` was refused with "`approval` is
`standing  # the mode`, which is not one of its values (each, until,
standing)" — a refusal that names the value rule for what is really a
comment the reader did not expect.

The reader already knows about comments in two places: a whole line
beginning with `#` inside the block is skipped, and the block's own key
line may carry one, which its header pattern spells out. A value line may
not, and nothing says why the three differ.

This matters more here than it would in most files. Both runtime files
are written almost entirely in comments — the template's dispatch section
is a comment today and says so — and the block is the record an owner
edits by hand and approves verbatim, which is the shape of edit a note on
the line is for: who the grant was for, which lane, why the ceiling. The
refusal is fail-closed and quotes the offending text, so nothing is
misread; what is wrong is that a legal YAML line is refused and the
sentence sends the reader to the wrong rule.

The same reading belongs to the schema parser beside it, which has always
behaved this way, so the repair has to say whether it is the block's
alone or both readers'.

## Acceptance criteria

- WHEN a dispatch block value line carries a trailing YAML comment THE reader SHALL read the value without the comment, exactly as a real YAML parser does, pinned by a body over a mode, a quoted instant, a flow list and a blob sha each written with a trailing comment, and by a body requiring the hand reading and a real YAML reading of the same document to agree.
- WHEN a `#` sits inside a quoted value THE reader SHALL keep it, because a comment marker inside quotes is not a comment, pinned by a body over a quoted value carrying one.
- WHEN the repair lands THE notes SHALL say whether the schema parser beside it takes the same reading or keeps its own, so that the two readers' difference is a decision rather than an accident.

## Implementation notes

## Verdicts
