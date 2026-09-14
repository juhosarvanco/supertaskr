---
id: T-319-s3
title: "A blob sha of forty digits reads as a NUMBER to a real YAML parser and as a sha to this repository's hand reader, and nothing asks the dispatch block to quote one — the two readings this project keeps checking against each other can disagree about which revision was approved"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-319, measured while writing that card's fixtures: an all-digit sha in a cards map made the hand reading and a real YAML reading of the same document disagree, and the fixture was changed rather than the rule"
blocked_by: []
touches: [lib/parser/src/process-settings.ts, lib/parser/test/process-settings.test.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

The dispatch block records each approved card at the blob sha of its file
at approval. A sha is forty hexadecimal characters, and roughly one sha
in ten to the sixteenth carries no hex letter at all — forty digits. A
hand reader that takes the text reads such a value as the forty
characters that are written; a real YAML parser reads it as a floating
point number and hands back something that is no longer a sha.

Measured on this card's own fixtures: with the card shas written as forty
repeated digits, the hand reading answered the sha and a real YAML parse
of the same document answered 1.1111111111111112e+39. The fixture was
changed to carry hex letters so the comparison body could run at all,
which fixed the body and left the rule where it was.

This matters because the two readings are exactly what this project keeps
checking against each other — the hand reader exists because a packaged
script has no devDependencies, and its licence is a body that compares it
to a parser it shares no line with. A value the two read differently is
the one shape that comparison cannot see, and in a record of an approval
it is the field that says WHICH revision was approved.

## Acceptance criteria

- WHEN a card's blob sha is read out of the dispatch block THE reader SHALL answer the same forty characters whether or not the sha carries a hex letter, and SHALL say what it wants when the value is one a YAML reader would have taken for a number, pinned by a body over an all-digit sha written both bare and quoted.
- WHEN the two readings are compared THE body SHALL run over a document carrying an all-digit sha and SHALL require the hand reading and a real YAML reading to agree, so the class this finding names is the one the body measures.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
