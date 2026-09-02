---
id: T-234
title: Fifty live cards carry implementation notes the parser cannot see and twenty carry invisible verdicts — `splitSections` matches three heading names EXACTLY, and a dated parenthetical drops the whole section silently
feature: F-06
milestone: 4
priority: 2
size: M
status: planned
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

Parsed every live card with `splitSections` and compared against the
headings actually present in each body. **Measured at `c5c2b47`; re-derive
rather than quote:**

    live cards (flat docs/tasks/T-*.md)                     441
    cards whose notes heading the parser CANNOT see           50
    cards whose verdict heading the parser CANNOT see         20
    cards in BOTH sets                                        12
    UNION — cards losing at least one section                 58

**Thirteen percent of the board loses a section the file visibly
contains.** Confirmed on a single card end to end: sections present were
`[preamble, acceptanceCriteria]` only, and `implementationNotes` came back
`DROPPED` with the text sitting in the file, perfectly legible to a human.

**THE DENOMINATOR IS `docs/tasks/T-*.md` FLAT, WHICH IS THE PROJECT'S OWN
DEFINITION OF LIVE** (`brief.mjs --state` uses it). `docs/tasks/rejected/`
holds a further 41 cards; including them inflates both the numerator and
the denominator and answers a different question. Two seats censused this
independently and disagreed at 58/441 against 67/479 — **the whole gap was
the rejected directory**, and neither figure was arithmetically wrong.

**THIS CARD'S OWN DENOMINATOR MOVED WHILE IT WAS BEING WRITTEN**, from 440
to 441, because committing this card added a card to the board it counts.

**AND THE FIRST ACCOUNT OF THAT, WRITTEN HERE, OVER-GENERALISED THE RULE
IT CITED.** It said a census of the board *"cannot be pinned by care"* —
a verifier measured that and it is false:

    live flat T-*.md at 57f2962 -> 441   c5c2b47 -> 441   c733d75 -> 441

*(That third column said `main` for one commit — **the second time on this
card that a bare `main` appeared inside a table built to demonstrate the
rule against it.** Caught by the verifier, who declined to ask for the
amendment and pointed at the pattern instead: `main` is the natural way to
write "and it is still true NOW", and **"now" is the one thing a committed
document cannot hold.** That is why the rule keeps being broken by the
people writing it down, and it is in `docs/CONVENTIONS.md`.)*

**A census IS pinnable.** It moves only when a card is added or removed,
and a card's own creation is a one-time +1; after that commit the figure
is stable, and `441 at c5c2b47` stays true. That is
`docs/CONVENTIONS.md`'s form 1 working exactly as written.

**The two classes are different and conflating them makes the rule read
broader than it is:**

- **A distance to a moving tip** changes at EVERY commit to the branch, so
  pinning genuinely cannot catch it. That is the class CONVENTIONS names.
- **A census** can only fail to be pinned by measuring BEFORE the commit
  that ships it. **A sequencing trap, not an impossibility** — measure
  after, or state the ref, and it holds.

## PARTIAL INVISIBILITY IS THE WORSE FAILURE, AND NINE CARDS HAVE IT

Nine live cards carry a dropped heading **beside a bare one that
parses** — 3 notes, 6 verdicts, measured at `c5c2b47`. The section
therefore renders, and renders COMPLETE.

`T-123` is the worked example:

    line  462   ## Verdicts                              <- parsed
    line 1225   ## Verdicts (continued) — THE SECOND PASS <- dropped

The parsed section is 15,564 characters and does **not** contain the
second pass. A reader gets a full verdicts section, no empty space, and
**no signal whatever that a second verification pass exists and is
missing.**

**Total invisibility at least shows an absence. Partial invisibility shows
a complete-looking section that is not complete** — which is worse,
because nothing prompts anybody to look. Any fix must decide what happens
to a second same-named section rather than only what happens to a
decorated one.

*(Counted three times here before it reproduced: once with a regex that
let `verdicts?` match a bare `## Verdicts` via its own trailing `s` — 165
false positives — and once too narrow to see singular `## Verdict:`
decorations at all — 4. The figure below is the one that reproduces
another seat's independent count.)*

## Two headings that are not spellings at all

    T-025-s4  ## Verdicts Queues for the next standing sitting with this evidence.
    T-123     ## Verdicts (continued) — THE SECOND PASS

The first is a prose sentence that acquired a `##` — the heading swallowed
the line, and that card's entire verdicts section is unreachable. **Both
are inside the 20.** A tolerant matcher must decide deliberately whether
it accepts these; a normalisation that swallows the first would be reading
a typo as an intent.

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
  `method/tasks/TASK-FORMAT.md` so a card author can predict it — IF that
  file is outside the fence at dispatch THEN the lane SHALL record the
  exact sentence, route it as a suggestion naming the fence it needs, and
  say so (triage 2026-09-02: that file ships, and its edit rides the next
  method bump); the three key names SHALL remain the only recognised
  sections either way.
- A gate SHALL fail on a card whose body contains a heading beginning with
  a known section name that the parser does not resolve to that section.
  **The gate SHALL be shown to red against at least one of the fifty cards
  in the census above before the fix, and green after.**
- The fix SHALL state what happens to a SECOND heading resolving to a
  section already filled, and a body SHALL cover the partial-invisibility
  case. **A fix that resolves only the total case leaves the nine cards
  whose section renders complete while missing content, and those are the
  ones no reader can be prompted to check.**
- The census SHALL be re-derived at the fixing ref rather than transcribed
  from this card — the figures above carry their measurement and go stale
  like any other.
- Verification: headless.

## TRIAGE, 2026-09-02 — DISPOSITION IS PROMOTE, AND IT IS NOT APPLIED

Triaged at the architect seat at 1cd2c8d. The stamp stays `suggested` for
T-225's reason and no other: `brief.mjs --dispatch` printed 60,040 bytes
at 85dda6d against the 65,536-byte loss point, a promotion costs about
645 bytes, and the in-flight sections of the wave dispatched tonight
spend the rest. T-225 is dispatched as soon as T-216-s4 lands; when
T-225 lands, promote this card without re-triaging it. Read this as a
tool limit, never as a verdict on the finding.

**Criterion 3 rewritten as a ROUTE at the seat**: the TASK-FORMAT sentence
rides the next method bump (T-229 owes it); the fence stays
`[lib/parser, tools/e2e]`. Guard-class, review independent already set.

**APPLIED, 2026-09-02, at the stamp of T-225's merge (7435eae):** the
byte ceiling that held this promotion no longer binds — `brief.mjs
--dispatch` answers what can START and `--full` is the triage view — so
the disposition above is now the stamp: `status: planned`.
