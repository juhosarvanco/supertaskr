---
id: T-234
title: Fifty live cards carry implementation notes the parser cannot see and twenty carry invisible verdicts — `splitSections` matches three heading names EXACTLY, and a dated parenthetical drops the whole section silently
feature: F-06
milestone: 4
priority: 2
size: M
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-216-s1, as a verdict item against one card; the board-wide census was measured at the integration seat, which is what turned it from a nit into this"
blocked_by: []
touches: [lib/parser, tools/e2e]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**A VERIFIER FOUND ONE CARD'S NOTES INVISIBLE. THE BOARD HAS FIFTY.**

`lib/parser/src/task.ts`'s `splitSections` matches heading text against an
exact-keyed map:

    'acceptance criteria' -> acceptanceCriteria
    'implementation notes' -> implementationNotes
    'verdicts'             -> verdicts

and its own comment states the consequence plainly: *"headingless
stretches under UNKNOWN headings stay dropped."* So
`## Implementation notes (executor, 2026-09-01)` — a spelling the method's
own practice produced — matches nothing, and the section vanishes.

## The census, measured through the real parser, not by grep

Parsed all 440 live cards with `splitSections` and compared against the
headings actually present in each body:

    live cards                                              440
    cards whose notes heading the parser CANNOT see           50
    cards whose verdict heading the parser CANNOT see         20

**Eleven percent of the board has implementation notes that no program can
read**, and one card in twenty two has an unreadable verdict. Confirmed on
a single card end to end: sections present were `[preamble,
acceptanceCriteria]` only, and `implementationNotes` came back `DROPPED`
with the text sitting in the file, perfectly legible to a human.

## Why nothing has ever gone red

The docs gate checks FRONTMATTER — every live card's frontmatter parses,
with a legal status, and it says so on every run. **Nothing checks that a
section a card visibly contains is a section a program can reach.** The
failure is silent in both directions: the file looks right, the gate looks
green, and the reader that loses the content is `app/src/lib/task-detail.ts`,
which simply renders nothing where the notes would be.

## The twenty invisible verdicts are the worse half

Notes are documentation. **A verdict is evidence**, and ADR-020's
`Rework cycles:` line is specified as *"dispatch → verdict count, derived
on the card's own Verdicts section at this ref."* For twenty cards that
derivation reads an absent section. `north-star/rejection-rate-by-size`
already reports itself UNKEPT because *"verdicts are prose headings with
no ratified marker"* — **this card is the sharper problem underneath it:
not that the verdict lacks a marker, but that the SECTION is unreachable.**

## What this is not

**Not a spelling mistake by any one seat.** The parenthetical form is
established practice with at least six distinct variants in use, applied
by executors and verifiers across weeks. A card written today following
the surrounding convention lands in the fifty. **The convention and the
parser disagree, and the parser is silent about it** — which is the whole
defect.

## Acceptance criteria

- A body SHALL demonstrate the defect: a card carrying a visible
  `## Implementation notes (…)` heading whose parsed `implementationNotes`
  is undefined. **A body asserting only that the bare spelling parses is
  degenerate against this card and SHALL be treated as absent.**
- `splitSections` SHALL either match the three known sections tolerantly
  (a documented normalisation — trailing parenthetical, case, surrounding
  whitespace) or SHALL surface an unmatched `##` heading as a finding a
  gate can read. **Silently dropping SHALL NOT remain an option**, whichever
  is chosen.
- WHERE tolerant matching is chosen, the normalisation SHALL be stated in
  `method/tasks/TASK-FORMAT.md` so a card author can predict it, and the
  three key names SHALL remain the only recognised sections.
- A gate SHALL fail on a card whose body contains a heading beginning with
  a known section name that the parser does not resolve to that section.
  **The gate SHALL be shown to red against at least one of the fifty cards
  in the census above before the fix, and green after.**
- The census SHALL be re-derived at the fixing ref rather than transcribed
  from this card — the figures above carry their measurement and go stale
  like any other.
- Verification: headless.
