---
id: T-157-s2
title: The cost trend is stamped in every record and nothing can add it up — a by-hand economics reporter, and the one design constraint that decides whether it may exist at all
feature: F-01
milestone: 4
priority: 36
size: S
status: parked
blocked_by: []
touches: [tools/e2e]
suggested_by: executor claude-opus-5@subagent @T-157
builder:
verifier:
built_by:
verified_by:
review:
---

## What T-157 left standing

The checkpoint template now names three metrics lines and forbids
silence on any of them, so the per-arc cost of this pipeline is
STAMPED in every record from here on. The template's own lagging half
says the trend "lives across records — derive it over
docs/checkpoints/, never transcribe it here", and **nothing in the
tree can perform that derivation.** Every arc figure quoted in a
checkpoint so far was added up by hand, which is exactly the labour
ADR-020's fifth decision set out to remove.

**T-157 DELIBERATELY DID NOT BUILD THE REPORTER**, and the reason is
this project's own: machinery is the expensive answer to a problem the
cheap ones have not yet failed at. The cheap answer — consistently
stamped lines a reader can scan — has existed for exactly one card.
Give it a few more records, and if reading them by hand is still the
way the trend gets derived, build this.

## THE CONSTRAINT THAT SHAPES IT, AND IT IS NOT NEGOTIABLE

ADR-019's Records clause: no suite, gate or generator may DEPEND on
`docs/checkpoints/`'s contents. A reporter a human or a checkpointing
integrator RUNS BY HAND is fine; a gate is not.

**And the enforcement is subtler than the sentence.** `docs-scan.mjs`
derives the DOCS GATE's reader set from docs-shaped string literals in
the source corpus. A reporter that names its own default directory in
a runtime string ENROLS ITSELF as a reader of that directory — and
then every checkpoint record ever committed owes whatever suite that
file belongs to, which is the coupling the clause forbids, arrived at
sideways. Measured at `88890d0`: the one file that already names the
path (`docs-gate.mjs`, for the STATE-currency check, which reads
FILENAMES and COMMIT TIMES and never contents) is why the DOCS GATE
already fires on any record commit.

So: **the directory is an ARGUMENT with no default**, the reporter has
no docs-shaped literal anywhere in its runtime strings, and its spec
drives it over FIXTURE records in a temp directory and never over the
real ones. A reporter that cannot be pointed anywhere else is a
reporter that has a dependency.

## What it would report, and what it must admit

The stamped shape is prose, not a schema — on purpose. So the reporter
parses what it can, and the interesting half is the other one: it must
NAME every record whose metrics line it could not read, and every line
that says "not derivable here", rather than averaging over the ones it
understood. A trend computed over the records that happened to parse
is a confident wrong number, which is the failure the whole metrics
slot exists to prevent.

The health-bands reporter is the shape to copy: house exit codes (0
clean, 1 found, 2 called wrong, 3 could not run), 3 taking precedence
over 1, every figure carrying what it was read from.

## Acceptance criteria

- WHEN the reporter is run over a directory of records THE output
  SHALL name every record it could not parse and every "not derivable
  here" line it found, before any total it prints.
- THE reporter SHALL take its directory as a required argument and
  SHALL contain no docs-shaped literal in any runtime string, shown by
  `node tools/e2e/scripts/docs-gate.mjs --census` listing no new reader
  for `docs/checkpoints`.
- THE reporter's own suite SHALL drive it over fixture records in a
  temporary directory, and SHALL NOT read `docs/checkpoints/`.
- IF the records directory holds no parseable metrics line THEN the
  run SHALL say so and exit non-zero, never print a total over zero
  records.

Standing triage 2026-08-30 (architect seat): PARKED — because the card's own framing says the design question comes before the tool, and triage answering it would be triage designing it. The checkpoint template now names three metrics lines and forbids silence on any of them, so the per-arc cost of this pipeline is genuinely STAMPED in every record from here on and nothing can add it up. That much is real and unchanged at this ref.
**WHAT IT IS NOT IS URGENT, AND THE ARITHMETIC SAYS SO.** A by-hand economics reporter over the records has a denominator that grows one checkpoint at a time; the trend it would draw is a trend over a handful of arcs, and a reporter written now measures mostly its own construction. The card additionally names "the one design constraint that decides whether it may exist at all" and leaves it open — a card dispatched with its central constraint unresolved is a card whose executor has to rule on scope mid-lane, which is the shape this method routes rather than builds.
RESURFACES: whichever comes first — the next `tools/e2e` dispatch that opens the record-reading scripts (the default condition, its fence's component next dispatched), or the point at which the records carry enough stamped arcs for a trend to mean anything. IF the design constraint is settled before either fires THEN it promotes on that ruling alone. The seat that takes it re-derives how many records actually carry the three metrics lines at its own ref, rather than assuming every record since the template landed does.
