---
id: T-300-s5
title: "A departure written into a template whose `process:` section is followed by a top-level comment lands AFTER that comment, outside the block a reader would look in — correct to both parsers, wrong to the person the section was kept readable for"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent (phase 2) @T-300, measured on the bench at 88b82c9b19752ea14a3b342764d79169c2a17b5c, 2026-09-12"
blocked_by: []
touches: [tools/e2e/scripts/settings.mjs, tools/e2e/tests/cli.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`switchesBlock` walks forward from the `process:` key looking for the
insertion point, and it treats a comment line as CONTENT so that a new
entry lands under the block's own prose rather than above it. That is
the right call for the comments inside the block. The test it uses is
`trimStart().startsWith("#")`, which is applied BEFORE the test that
ends the section — so a comment at column 0, after the section, is read
as part of the block too, and the insertion point advances past the
section's end.

Measured on the verifier's bench at the lane tip, against a copy of this
method's own template with four lines appended — a blank line, a
top-level comment, and a `notes:` section — `settings set
dispatch.keeper_at_base off` wrote the departure directly beneath the
top-level comment and above `notes:`.

## Why it is not a defect, and why it is still worth a card

Nothing breaks. A real YAML parser reads the entry back as
`process.switches`, the arm's own `processSection` finds it, the value
resolves, and setting the switch back to the profile's own value removes
the line and restores the file. Comments and blank lines do not end a
block mapping, so the line is semantically where it belongs however it
reads.

What suffers is the one thing the edit's whole design rests on. The
argument for a line edit over a YAML round trip is that the section is
method text a human wrote and every comment survives; a departure that
lands below the human's closing note, separated from the `switches:` key
it belongs to, is a line the next reader of that file will not find
where the file told them to look. The kit ships this template to other
projects, and a project that keeps a note at the foot of it is not doing
anything unusual.

## What a fix looks like

Stop advancing the insertion point on a comment once the section has
ended. The block ends at the first line that is neither blank, nor a
comment, nor indented; a comment at an indent SHALLOWER than the block's
own entries is the same signal, and the cheap version is to stop
advancing on any comment whose indent is not greater than the
`switches:` key's. The body to write is the one this card was measured
by: a template carrying a top-level comment after the section, one
`set`, and the entry required to land above that comment.

## Acceptance criteria

- WHEN a departure is written into a template whose `process:` section
  is followed by a comment at or outside the section's own indent THE
  entry SHALL be placed inside the `switches:` block and above that
  comment.
- WHEN the section is followed by nothing THE entry SHALL land where it
  lands today, under the block's own prose, so the shipped template's
  behaviour does not move.
