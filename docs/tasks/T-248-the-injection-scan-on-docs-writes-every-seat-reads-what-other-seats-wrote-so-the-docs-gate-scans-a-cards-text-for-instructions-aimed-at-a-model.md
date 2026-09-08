---
id: T-248
title: The injection scan on docs writes — every seat reads what other seats wrote, so the docs gate scans a card's or a record's text for instructions aimed at a model and names them, advisory first
feature: F-06
milestone: 4
size: S
priority: 2
status: verifying
suggested_by: "@human ruling (2026-09-08, version sitting): \"approve the v1 five\" — GSD Core's prompt-injection guard on .planning/ writes (T-245); nputer's docs/ is read by every seat and scanned by nothing"
blocked_by: []
touches: [tools/e2e/scripts/docs-gate.mjs, tools/e2e/tests/docs-input-gate.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by:
review: independent
---

## Why this card exists

nputer's whole design routes every seat through docs/: cards, briefs,
verdicts, rooms, records. A card body an executor wrote is the next
verifier's input; a record a lane wrote is the next architect's. GSD
Core scans `.planning/` writes for injection patterns
(hooks/gsd-prompt-guard.js, advisory) and scans reads too
(gsd-read-injection-scanner.js). nputer has the blind verifier's hashed
attack set and hostile-payload-verified fences, and nothing that reads
prose for "ignore your instructions".

## Acceptance criteria

- WHEN the docs gate runs on a changed path under docs/ THE gate SHALL
  scan the text for instruction-shaped content aimed at a model
  (imperatives addressed to "you" with tool or role words, hidden
  Unicode, HTML comments carrying directives — the pattern set is the
  executor's, kept in ONE file with each pattern's positive control)
  and SHALL print each hit with file, line and pattern name.
- WHEN a hit is found THE gate SHALL be ADVISORY (exit unchanged) in
  this card; a later card may make named patterns blocking once the
  false-positive rate on this repository's own docs/ is measured and
  written down.
- WHEN the pattern file changes THE spec SHALL fail unless every pattern
  has a planted positive that fires and a planted negative that does
  not (proof of teeth).
- IF the scan cannot run THEN THE gate SHALL say so on its own line —
  never a silent pass (STATE's "AN EXIT MAY MEAN THE GATE NEVER RAN").
- The seat's own docs — this repository's cards and rooms — SHALL be
  scanned once at the merge and the hit count stamped in the checkpoint
  record with its derive command.

## Implementation notes

Built on `task/T-248-docs-injection-scan`, cut from `d1603bb`. The whole
diff is the two fenced paths plus this card and one routed finding.

**WHERE THE PATTERNS LIVE.** The card asks for ONE file carrying the
pattern set with each pattern's positive control. A separate pattern
file is outside this fence, so the table, its controls, the scanner and
the reporter are all in `tools/e2e/scripts/docs-gate.mjs`, and the spec
READS them rather than restating them (T-057). That needed one
structural change: until this card the gate RAN at import and exited the
importer's process, so nothing could read a table out of it.
`invokedAsCommand()` at the foot of the file now guards the CLI on being
the entry point. Every documented invocation is unchanged and all four
exit codes are unchanged, measured through the real binary.

**THE SEVEN PATTERNS**, each with a planted positive that fires and a
planted negative that does not, in the same object: J1 instruction
override; J2 an imperative addressed to `you` carrying a tool or role
word; J3 role reassignment or a claim of system authority; J4
zero-width characters; J5 the soft hyphen; J6 the Unicode tag block; J7
an HTML comment carrying a directive.

**EVERY INVISIBLE CHARACTER IS AN ESCAPE AND NONE IS TYPED.** The first
draft of J4 and J5 typed them literally. They are not P5 control bytes,
so the token lint stayed green and the diff showed nothing — the exact
failure the patterns exist to catch, in the file whose job is to catch
it. Caught by looking, not by a gate, which is why the file now carries
the rule in writing.

**J7'S SPAN IS BOUNDED AT 400 CHARACTERS EACH SIDE, AND THE BOUND IS A
MEASUREMENT.** Unbounded, the lazy run walks from an unclosed `<!--` in
ordinary prose to the next `-->` anywhere in the file:
`docs/tasks/T-030-parser-strictness-pass.md` produced three "hits" whose
excerpts were paragraphs of unrelated text. The ceiling is stated rather
than discovered, and the hidden-Unicode patterns have no such ceiling.

**A DEFECT THE SPEC'S OWN POSITIVE CONTROL CAUGHT.** `renderInvisible`
first asked whether a code point fell in a printable BAND, which makes
everything above that band invisible by default — so this project's
house em dash came back as `<U+2014>` and every excerpt of a hit in
ordinary prose was rendered unreadable by the function whose job is to
make hits readable. The set is now NAMED rather than banded, and bidi
overrides are in it: a character that can reorder a line while printing
as nothing is what an excerpt must not quote raw.

**TWO LIVE-FALSE CLAIMS IN THE FENCED FILE, CORRECTED IN THE SAME
COMMIT.** The header said this tree holds no tracked path containing a
space; it holds two, and feeding the gate `$(git ls-files docs/)`
fragments on them, which is how the sentence was falsified. The
behaviour behind it is out of this fence and is routed as `T-248-s1`.
The `DOC_BUDGETS` comment argued from "this file executes at import",
which the guard makes false; the move stands on T-057 alone now.

**THE SCAN OVER THIS REPOSITORY'S OWN docs/ (criterion five).** TWO hits
across 738 tracked paths, 0 unscannable, at the working tree of
`65637e1`: a zero-width character in
`docs/tasks/T-221-...-three-call-sites.md` and one J2 false positive in
`docs/tasks/T-101-the-denial-reaches-the-store-and-stops.md`. Derived
xargs-free, exit read unpiped, and space-safe:

    paths=(${(0)"$(git ls-files -z docs/)"})
    node tools/e2e/scripts/docs-gate.mjs "${paths[@]}"

Re-derive at the merge; the count is a property of prose other lanes
write. The record takes it (criterion five is the integrator's stamp).

**THE POISON DRILL: 9 MUTANTS, 9 KILLED**, every one derived from the
acceptance criteria and landing in the code under test, never in an
assertion. Drilled in this lane's own worktree at a named commit — it
has no concurrent reader — with `git restore --source=<commit>
--staged --worktree` and a sha256 comparison after each. Every
restoration matched
`5446e8deaa1ae6ed51865f5eeeae1aadda3ceb1a6099ca064d3287a9d5a8af8f`.

| mutant | criterion | bodies killed |
|---|---|---|
| M1 the LINE dropped from a hit | 1 | 1 |
| M2 the PATTERN NAME dropped | 1 | 1 |
| M3 the scanner returns nothing | 1 | 5 |
| M4 hits found and never printed | 1 | 3 |
| M5 a hit made blocking (`found += hits`) | 2 | 1 |
| M6 a pattern loses its positive (DATA) | 3 | 1 |
| M7 a pattern's negative now fires (DATA) | 3 | 1 |
| M8 the grader grades nothing | 3 | 2 |
| M9 the cannot-run line swallowed | 4 | 2 |

**AND THE DRILL EARNED ITS COST TWICE, ON THIS CARD'S OWN PINS.**

M5 SURVIVED the first pass. The body that exists to catch a scan made
blocking opened its window AT the call, and the mutant puts `found +=`
immediately BEFORE the call on the same line — one token outside the
window. The bytes moved, the suite ran, and nothing died: the failure
was AIMING, not accounting (verifier.md 2b).

Fixing that exposed a second fault, and this one was worse: the re-aimed
window opens at the block's comment, and that comment EXPLAINS that
`found` is out of scope — so the window contained the word by
construction and the body was RED on a correct gate. M5's apparent kill
was the body failing anyway. Found because M1 killed a body it had no
business killing. The window's CODE half is now taken with
`stripComments`, and the unmutated baseline was re-run and green (9 of 9)
BEFORE any kill was counted again.

**WHAT COULD NOT BE POISONED, NAMED (the drill's own rule).** Criterion
two — a hit leaves the exit unchanged — has NO behavioural pin on this
tree. Every path under `docs/` reaches a reader (two lane specs walk all
of it), so a diff carrying a docs path is exit 1 whatever the scan says,
and a diff carrying none never reaches the scan. There is no input for
which `found += hits` moves a code. The pin is therefore structural, the
body says so in its own name, and it asserts the premise so that it reds
if the tree ever gains a docs path with no reader — at which point the
behavioural pin becomes possible and should replace it.

**WHAT THE NEXT SEAT SHOULD LOOK AT.** The false-positive rate is now
measured and small, which is the precondition the card sets for making
NAMED patterns blocking. J2 is the one that produced the sole false
positive. J1, J4, J5 and J6 produced none on 738 files.

## Verdicts
