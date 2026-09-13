---
id: T-311-s5
title: "Fourteen live cards spell the criteria heading at depth three; the advisory seat reader requires depth two and read T-311's seven criteria as none, while the card preflight accepts either depth — one spelling, named by the task format and kept by a body"
feature: F-04
milestone: 4
size: M
tier: guarded
priority: 1
status: building
suggested_by: "executor claude-opus-5@subagent @T-311, reported in its notes after the stamp at a98e5a067ca815b984d133ed8b311366899499f4 and filed by the seat, 2026-09-12"
blocked_by: []
touches: [tools/e2e/scripts/session-economics.mjs, tools/e2e/tests/session-economics.spec.ts, method/tasks/TASK-FORMAT.md, tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts, method/roles/verifier.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review:
---

Absorbs: T-311-s7 (the owner's ruling of 2026-09-13: the readers pair runs as one lane now). The sibling's file is removed in the same commit as this line; its finding and its two acceptance criteria are kept whole below under their own heading, and the verifier's attack set covers them by the sibling's id. Both cards fix a reader that accepts a narrower shape than the rule it enforces (the merge verb's newest-verdict reader wants the date first; the advisory seat reader wants the criteria heading at depth two), both touch method text, and their fences are disjoint, so the folded fence is the union of the two. This fold departs from the limits T-284 (planned, not landed) proposes for batches — it spans two fences and carries a priority-1 card — by the owner's explicit ruling; the priority-1 card is not held behind anything, since the lane runs at once. Size re-stated from the sum: M.

## The finding

The task format names the section `## Acceptance criteria`. Measured on the
integration checkout at the T-311 dispatch: 491 live cards spell it so and 14
spell it `### Acceptance criteria` — T-093, T-112-s3, T-177, T-208, T-229-s4
and the nine cards of the 2026-09-12 planning batch (T-299-s6, T-300-s6,
T-311 to T-317), which were drafted in one file and inherited one depth.

Two readers disagree about them. The card preflight's heading pattern accepts
any depth from two, so those cards preflight green and their criteria are
checked. The advisory seat reader in the session-economics module compares
the heading as an exact string at depth two, so for T-311 it read the seven
criteria as none, reported "the card carries no acceptance criteria", and
answered TRY — the stronger seat, so nothing was lost this time. The parser
library documents the section as depth two as well. A card with criteria that
one reader sees and another does not is a card whose signals depend on which
tool asked.

## Acceptance criteria

- WHEN a card's criteria section is read by the advisory seat reader THE heading SHALL be matched by the same rule the card preflight uses, so both answer the same criteria for the same card; a body drives both readers over a card at each depth and requires agreement.
- WHEN the task format is read THE one spelling SHALL be stated there with the depth named, and a body over the live cards SHALL red naming any card at another depth — with the fourteen measured here listed as the known set at this ref so the body is green at landing and reds on the fifteenth; whether those fourteen are repaired is the owner's ruling, recorded on this card, since records are appended and not rewritten.

## Absorbed from T-311-s7 — a verdict whose heading carries its date at the end is invisible to the merge verb (kept whole)

Title as filed: "A verdict whose heading carries its date at the end is invisible to the merge verb — the newest-verdict reader wants the date first, the role file only says dated, and the T-311 merge stopped at the drill with the verdict in plain sight". Filed by the Claude seat after the T-311 merge on 2026-09-12; priority 1; fence tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts, method/roles/verifier.md.

### T-311-s7's finding

The T-311 verifier appended its verdict under the card's `## Verdicts`
heading as `### APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent,
verifier phase 2, 2026-09-12`, which is dated and names its model and
session as the role file's step 5 asks ("dated, with your model@session").
The merge verb's newest-verdict reader matches a heading against a pattern
that requires the date at the start, after at most one capitalised word. So
the verb planned no correction step, and its drill refused with "the card's
`## Verdicts` section carries no dated `### ` entry" while the entry stood
one screen above the message. Every earlier verdict happened to spell the
date first.

The seat ruled through: correction 1's block was drilled by hand (RED under
its mutant, restored and proved by sha256), correction 2 applied and drilled
both ways, the readings and the message written by hand. That is the third
false stop of the verb in eight runs, and the second whose cause is a
reader narrower than the rule it enforces.

### T-311-s7's acceptance criteria (kept whole)

- WHEN a verdict entry under `## Verdicts` is a depth-three heading carrying a date anywhere in it THE newest-verdict reader SHALL find it, and a body drives the reader over the two spellings seen so far (date first, date last) and a heading with no date, requiring the first two found and the third refused.
- WHEN the role file states the verdict's heading THE one shape SHALL be spelled there with the date's place named, so a verifier does not have to guess what a later reader wants; the sentence stays product-agnostic.

## Implementation notes
<!-- executor appends before finishing -->

### The criteria echo, written before a line of the implementation (executor claude-opus-5@subagent)

Four criteria, this card's own two and the two absorbed from T-311-s7,
restated as a checklist in my own words:

1. The advisory seat reader in the session-economics module matches the
   criteria heading by the CARD PREFLIGHT'S OWN RULE rather than by an
   exact depth-two string, so the two readers answer the same criteria
   for the same card. A body drives both readers over a card whose
   criteria sit at depth two and over one whose criteria sit at depth
   three, and requires them to agree; a body over every live card
   requires the two to agree there too.
2. The task format names the one spelling with its DEPTH said out loud,
   and a body over every live card reds naming any card whose criteria
   section is at another depth, the set measured at my own ref pinned in
   the body so it is green at landing and reds on the next card drafted
   at the wrong depth. Whether the pinned cards are repaired is the
   owner's ruling and this lane repairs none of them.
3. (T-311-s7) The merge verb's newest-verdict reader finds a depth-three
   heading under the Verdicts section that carries its date ANYWHERE in
   it. A body drives the reader over the two spellings seen so far, date
   at the start and date at the end, and over a heading with no date at
   all, requiring the two dated ones found and the undated one refused.
4. (T-311-s7) The verifier role file spells the one verdict heading
   shape with the date's place named, so a verifier does not guess what
   a later reader wants. The sentence stays product-agnostic, and it is
   added AROUND the pinned sentence a body already quotes rather than
   replacing it.

### What was built (executor claude-opus-5@subagent, lane T-311-s5)

Every figure below was measured in this lane at the base 71b52a01125d
unless another ref is named; the corpus figures do not move under this
lane's own diff except where a line says so.

**Criterion 1 — the advisory seat reader matches the heading by the card
preflight's rule.** The session-economics module no longer keeps its own
copy of the heading: it imports the preflight's `CRITERIA_HEADING` and
re-exports it, so the two readers hold the same object and a widening of
one is a widening of both on the same day. Its section reader now takes
a string or a pattern, and ends a section where the preflight's scope
ends — at the next heading of depth two or deeper, whatever depth the
section opened at — because two readers that find the same heading and
stop in different places still answer different criteria. Measured over
the 794 cards under the tasks directory at the base: the section-level
answers of the two readers now agree on every one, where before the
change 15 cards were seen by the preflight and not by this reader. The
bodies are "the criteria heading is matched by the CARD PREFLIGHT'S OWN
RULE" (identity of the rule, both readers driven over a card at depth
two, three and four, a depth-one heading refused by both as the negative
control, and the section end checked at two depths) and "the two readers
agree about the criteria section on every live card" (the corpus).

One reading changed as a consequence and it is the right change: a
criteria section that contains a deeper sub-heading now ends there for
this reader as it already did for the preflight. On the board at the
base that is one card, T-054, whose section reads as 6 criteria instead
of 12.

**Criterion 2 — one spelling, named in the task format and kept by a
body.** The task format now says out loud that every body-section
heading is written at depth two and why the depth is part of the
spelling. The body reads the depth the document NAMES in words, checks
it against the depth the document's own block SPELLS, and measures the
board against that one number, so the sentence cannot drift from the
block and neither can drift from the cards. The known set is pinned as
an EQUALITY in both directions: a card drafted at another depth reds,
and so does a repair or a fold that removes one, because a set that only
forbids additions rots into a licence.

The set at this lane's base is ten cards, not the fourteen the card's
finding counted, and the difference is a reader rather than a repair.
The finding's scan counted every line beginning with three hashes and
the words of the section name; the rule the readers actually use matches
the heading the section opens at. Four of the fourteen — T-093, T-112-s3,
T-177 and T-208 — carry their criteria at depth two and carry a SECOND
heading of that name further down, inside a verdict, where a verifier
tabled its findings criterion by criterion. Those cards are not at the
wrong depth. The ten that are: T-229-s4, whose only section of that name
is such a table, and the nine cards of the 2026-09-12 planning batch
(T-299-s6, T-300-s6, T-311, T-312, T-313, T-314, T-315, T-316, T-317).
Whether any of them is repaired is the owner's ruling and this lane
repaired none; the pinned set is a measurement, not a permission.

**T-311-s7's criterion 1 — a verdict entry is found wherever its date
sits.** The merge verb's newest-verdict reader now takes any depth-three
heading under the Verdicts section that carries a date anywhere in it.
Measured over the same 794 cards: 310 carry a Verdicts section; on 19 of
them this reader finds an entry the anchored one missed entirely, and on
one, T-238-s1, it moves from the verdict to a later dated entry appended
under the same heading, which is what the newest entry means.

What the date anchor was protecting is kept by an exclusion beside it: a
heading this file already counts as a CORRECTION block's is never read
as a verdict entry. Without it a correction heading carrying its own
date would become the newest entry and the verb would read the verdict
from its middle, dropping exactly the blocks the drill is about. No live
card's answer turns on that exclusion at this ref, so it is kept by a
body over a planted card, with a planted amendment heading as the
positive control that shows the reader does move for a dated entry that
is not a correction.

**T-311-s7's criterion 2 — the one shape, with the date's place named.**
The verifier role file gains step 5a: the entry's heading is a
depth-three heading that opens with the date, printed as an indented
shape with the verdict word and the model and session after it, and the
reason said plainly — "dated" says a date must be there and says nothing
about where, which is how a verdict became invisible to a reader that
wanted it first. The sentence is added around the existing one and
replaces nothing; the specs were grepped for the lines this lane touches
before either method file was edited, and no pinned sentence was removed
by this diff. The body builds a heading FROM the shape the role file
publishes, fills its placeholders and requires the reader to find it, so
a rewrite of the published shape into something the reader cannot find
reds rather than waiting for the next merge to discover it.

### In-fence follow-through

- `tools/e2e/scripts/merge.mjs`: the correction-block heading pattern was
  spelled three times — in `assignsCorrections`, in `correctionHeadings`
  and, as of this lane, in the entry reader. It is now one source string
  with three compiled forms beside it, and the reason the "does it head
  one" form is not the global one is written there: `RegExp.test` on a
  global regex carries `lastIndex` between calls and answers true, false,
  true over one unchanging input. Six lines added, three changed; it
  restores the property T-057 names and it is what makes the entry
  reader's exclusion the same shape the file already counts.

### What this lane did not do, filed instead

- **T-311-s8** — the same reader collects only dash-bullet criteria, so a
  criteria section written as a numbered list arrives empty and the
  advisory line reports that the card carries none. Six cards at this
  base sit on it. The heading half is repaired here; the bullet half
  needs a ruling about which shape the task format names, which is a
  criterion this card does not carry.
- **T-311-s9** — the card preflight re-enters criteria scope at every
  heading the rule matches, so a verdict's own per-criterion table is
  judged as the card's criteria. Seven cards carry two such headings at
  this base. The repair is in the preflight, which this lane's fence does
  not carry.

### For the verifier

- The corpus bodies are the ones that can surprise: they read every file
  under the tasks directory, so they move with the board. The pinned set
  in the depth body is an equality and is the thing most likely to red
  next, deliberately.
- The merge verb's reader change is behavioural at a merge. The widening
  is measured above card by card; the one card whose answer MOVES rather
  than arrives is named.
- Nothing here reads or writes outside the six fenced paths and the two
  cards filed above.

## Verdicts

Promoted 2026-09-13 (the owner's ruling 5 of 2026-09-13): to planned at priority 2, one of the four instrument fixes the T-311 and T-300 lanes filed; before its lane the seat confirms the defect still exists at the dispatch base and assesses whether it shares a lane with its siblings while every requirement is preserved. Not dispatched by this ruling.
