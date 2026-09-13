---
id: T-311-s5
title: "Fourteen live cards spell the criteria heading at depth three; the advisory seat reader requires depth two and read T-311's seven criteria as none, while the card preflight accepts either depth — one spelling, named by the task format and kept by a body"
feature: F-04
milestone: 4
size: M
tier: guarded
priority: 1
status: verifying
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
block and neither can drift from the cards. The known set is an
EXCLUSION: a card named in it is allowed to be where it is, so a repair
leaves the body green, while a card that is not named reds by name. The
list is not a licence either — the body requires at least one of the
pinned ids to still be on the board at another depth, so when the last
one is repaired it reds and asks for the list to be deleted rather than
extended.

The first draft of that body pinned the set as an EQUALITY in both
directions, so that a repair was as visible as a fifteenth card. The
seat's note in this lane's ask file, dated 2026-09-13, carries the
owner's ruling the criterion was waiting for: the cards still open at
depth three are repaired to depth two on the integration branch with no
criteria text changed, the readers go on accepting both depths, and this
body lists the measured set as an exclusion so that a repaired card
stays green. The criterion asks for a body "green at landing and reds on
the fifteenth", which is that exclusion; the equality was stricter than
the card and would have red on the ruling's own repair. Changed before
the graded run, with the repair simulated on one pinned card and the
body shown green under it.

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
  under the tasks directory, DONE cards included, because a done card's
  heading is still read by both readers. The seat's own census of the
  same base counts the live cards only and finds 6 at depth three; the
  ten pinned here are those 6 plus 4 done cards, and the two figures
  agree.
- The pinned set is an exclusion and the repair it anticipates lands on
  the integration branch rather than in this lane, so the body is green
  before and after it. What reds is a card at another depth that is not
  on the list, or the day the last pinned card is repaired.
- The merge verb's reader change is behavioural at a merge. The widening
  is measured above card by card; the one card whose answer MOVES rather
  than arrives is named.
- Nothing here reads or writes outside the six fenced paths and the two
  cards filed above.

## Verdicts

Promoted 2026-09-13 (the owner's ruling 5 of 2026-09-13): to planned at priority 2, one of the four instrument fixes the T-311 and T-300 lanes filed; before its lane the seat confirms the defect still exists at the dispatch base and assesses whether it shares a lane with its siblings while every requirement is preserved. Not dispatched by this ruling.

### 2026-09-13 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent (verifier, phase 2, guarded)

The four criteria are met — one rule imported rather than copied, the depth
named in words and kept by a body that reds on a card by id, the verdict
reader widened to the rule it enforces and re-narrowed only where a
correction block would slice a verdict in half, and the one heading shape
published where a verifier reads it. Two assigned corrections pin properties
the diff HAS and no body measures: the two readers still reach their one
shared rule through different prose models, and the follow-through's own
stated hazard — a global pattern asked through `.test` — is written in a
comment and measured by nothing.

#### THE FRAME I ACTUALLY HAD, said rather than promised

Two spawns. Phase 1 ran tool-less and wrote the attack set from the card at
the base; this spawn opened the diff first and the executor's notes only
after the diff was read, in the order the role file names. The brief's
duties section named no executor-derived specific — no mutant count, no path
count, no suite figure. The figures it carried (491 live cards, 14 at depth
three, "the third false stop in eight runs") are the CARD's own, measured
before the lane. I did not `git log` the lane before writing, and the notes
were opened after the code diff, the two spec diffs and the method diffs.

Sealed inputs, cited against the files as saved:

| input | sha256 |
|---|---|
| the attack set | `5c4cb00a4d41837eb1fc56620ea28ec9f6d55c1016acbd8338846bb585544443` |
| the ground, at the base | `37aa28ae950c402e8e5e1c90b48a09bdfaa3e9fef4d9bad083ffe8faa243c7a2` |
| the card at `71b52a01` | `06c650778796da6c7e931df2eb7b94acc446cd3c1c93923f26b8d1cd7f8d8323` |
| the card as amended at `ee9ed3cd` | `9f3e464a04b3817ee62e8d799592e4911f219ae1508aa9f53a40ba241761a08e` |

All four recomputed on this bench and matching. The amended card moves the
two absorbed criteria into the canonical section unchanged; the contract is
the same four criteria either way, and the lane's copy keeps the old
placement, which is the executor's unchanged contract and not a deviation.

Measured at the lane tip `163a46c7` unless a line names another ref. The
whole battery is owed at the tip THIS verdict creates, and it is recorded in
the postscript below the corrections, because a figure measured at the
commit I was sent is stale at the tip my own commits make.

#### A ROW PER ACCEPTANCE CRITERION, WITH THE EVIDENCE THAT DECIDED IT

| # | criterion | verdict | what decided it |
|---|---|---|---|
| 1 | the advisory seat reader matches the heading by the card preflight's own rule; a body drives both readers over a card at each depth and requires agreement | MET, with correction 1 | `session-economics.mjs` imports `CRITERIA_HEADING` from `card-preflight.mjs` and re-exports it; the body asserts IDENTITY (`toBe`), not equality, so a second copy cannot satisfy it. Driven over `##`, `###`, `####` with the absolute count 2 asserted for BOTH readers, and a depth-one heading refused by both as the negative control. The corpus body drives the pair over every card under `docs/tasks/`. I re-measured the section END independently: `optionalSection`'s new `/^#{2,}\s/` is byte-identical to the switch `cardLines` makes at `card-preflight.mjs`, so the two now stop in the same place as well as start there. Residual, assigned as correction 1 below. |
| 2 | the task format states the one spelling with the depth named, and a body over the cards reds naming any card at another depth — green at landing, red on the fifteenth | MET | `TASK-FORMAT.md` states it in WORDS ("WRITTEN AT DEPTH TWO — two hash marks and a space"), not only in an example, which is what the fourteen were drafted from. The body reads the depth the document NAMES, cross-checks it against the depth the document's own block SPELLS, and measures the board against that one number. **The fifteenth-card control, which the body does not run for itself, I ran**: a planted `T-905` with `### Acceptance criteria` and an id not on the list reds the body with `+ "T-905"` in the printed array. **The reciprocal control**: `T-312` repaired to depth two leaves the body GREEN (1 passed), so the owner's ruling-to-repair does not red the suite — the list is an exclusion and not an equality. The exclusion is ten literal ids with no predicate anywhere in the path. |
| 3 | (T-311-s7) a depth-three verdict heading carrying a date anywhere is found; date-first and date-last found, undated refused | MET, with a filed finding | `VERDICT_HEADING` is now `/^###\s+.*\d{4}-\d{2}-\d{2}/` behind `isVerdictHeading`, which also refuses a heading the file already counts as a CORRECTION. The body drives all three cases, both orderings, and a dated heading ABOVE the section. Near-misses refused by the date pattern: `T-300-s7` and `claude-opus-5@subagent` carry no `\d{4}-\d{2}-\d{2}`. `newestVerdict` is the only verdict-heading matcher in the script and the refusal message lives inside it, so there is no second site left narrow. I re-ran the board census myself and reproduced the executor's figures exactly — see the finding below for the one card whose answer moves. |
| 4 | (T-311-s7) the role file spells the one shape with the date's place named; product-agnostic | MET | Step 5a is added immediately after step 5, where a verifier following step 5 reads it, and it names the date's place in words while saying plainly that the reader accepts every shape the rule allows — so the sentence and the regex are a spelling and a reader rather than a guess and a regex. Product-agnostic: no product noun, no script name, no tool name. The pinning body BUILDS the heading out of the published shape and requires the reader to find it — the data-derived shape step 2b asks for, not a grep for a string. **`git diff 71b52a01 163a46c7 -- method/` removes ZERO lines**, so no pinned sentence was reworded or deleted by either method edit. |

#### THE IN-FENCE FOLLOW-THROUGH, GRADED AS PART OF THE DIFF

One entry is declared: the correction-block heading pattern in `merge.mjs`,
spelled three times, becomes one source string with three compiled forms.
It is inside the manifest, it is the T-057 property this project names by
number, and it is what makes the entry reader's exclusion the same shape the
file already counts rather than a fourth spelling — so it is in-fence, small
and load-bearing. **Its stated hazard has no body**: the comment explains
that the "does it head one" form is not the global one because `RegExp.test`
on a global regex carries `lastIndex` and answers true, false, true over one
unchanging input, and nothing in the suite asks the question twice.
`assignsCorrections` has no direct body in `merge.spec.ts` at all. That is
correction 2.

Nothing else in the diff is unlisted surface: the six fenced paths, this
card, and the two cards filed under step 6. No parser-library file, no
repair of any pinned card, no census or graph regeneration.

#### THE ATTACK SET, ANSWERED WHERE THE ANSWER IS NOT IN A ROW ABOVE

- **Two copies of one regex (A1.1)** — answered by import and re-export, and
  pinned by identity. There is no second literal.
- **The agreement body as a tautology (A1.2)** — it is not: the two readers
  are driven through `acceptanceCriteria` and `cardLines(...).hasCriteria`,
  their real entry points, over fixtures and over 796 real cards.
- **The card's own absorbed sub-heading, and any annotated heading (A1.5,
  A2.6)** — the shared rule matches the WHOLE line, so
  `### T-311-s7's acceptance criteria (kept whole)` is not a criteria
  heading for either reader. Probed directly: the advisory reader returns
  the card's own criterion and not the absorbed one. The lane's escape
  routes — weakening the matcher, or adding this card to the exclusion —
  were not taken.
- **The allowlist as a blanket (A2.1)** — ten literal ids, `Array.includes`,
  no predicate, and the ids are never used as a path.
- **The fourteen that are ten (A2.4)** — the card counted fourteen with a
  looser scan; under the rule the criterion itself names, four of them
  (T-093, T-112-s3, T-177, T-208) carry their criteria at depth TWO and a
  SECOND heading of that name inside a verdict. The ground taken at the base
  independently counts ten at depth three over the 794 flat cards, and my own
  census reproduces the same ten ids. The difference is a reader, not a
  repair, and the notes declare it. Not a silent scope change.
- **Exit 0 over zero cards (A2.5)** — both corpus bodies assert
  `read > 200` before they assert an empty list.
- **The sibling's removal (X2)** — `docs/tasks/T-311-s7-*.md` was removed at
  `b8b2c89d`, which `git merge-base --is-ancestor` confirms is an ancestor of
  this lane's base. It is not this diff's to make, and the board is clean
  without it.
- **The parser library's depth-two documentation (A1.9)** — the lane did not
  touch it and owes it nothing: the library's comments say the section is
  spelled at depth two, and depth two is precisely what the task format now
  states. The third site agrees with the new rule rather than contradicting
  it.
- **ReDoS and injection on the new input paths (step 3, mandatory)** — no
  finding. Every pattern is a literal; the only `new RegExp` calls take a
  module-level source string with no interpolation of file content.
  `optionalSection` accepts a `RegExp` from its caller and every caller
  passes a constant. `/^###\s+.*\d{4}-\d{2}-\d{2}/` backtracks over a
  heading line at worst linearly per whitespace position and cannot blow up;
  `/^#{2,}\s/` and the shared heading rule are anchored and bounded. No
  secret, no dependency addition, no endpoint, no path built from card data.

#### CORRECTION 1 (assigned) — the two readers share a rule and a section end, but not a prose model, and the corpus body cannot see it

The heading rule is one object and the section end is now the preflight's
own. What is still two rules is how each reader gets to the card: the
preflight looks at `proseOnly(cardBody(...))`, which BLANKS fenced lines and
lines indented four spaces or more, and the advisory reader looks at the card
as written. So a card that QUOTES the heading in a fence and then carries its
own section is read from two different places.

Measured on this bench with both readers driven directly:

    preflight opens at line 13  |  advisory opens at line 8
    advisory criteria: ["WHEN a card QUOTES the format THE quotation SHALL not be its criteria. ```"]

Both readers say "there IS a criteria section", so **the committed corpus
body — which compares two booleans — is GREEN on that card** while the two
collect different criteria from it. That is the defect this card exists to
kill, surviving one axis over, and the criterion's own words are "so both
answer the same criteria for the same card".

The body compares the SITE, driven through each reader's own entry point:
`cardLines(...)`'s first criteria-scoped line against `optionalSection`'s
returned section. 509 cards on this board carry a criteria section and all
509 agree, so the body is green at landing; the day a card quotes the format
before spelling it, the body reds naming that card. Its positive control is
run where the arming is ABSENT — the quoting card above — and shows BOTH
halves: the boolean comparison green, the site comparison not.

Read RED against an implementation lacking the property and GREEN against one
carrying it: with `findIndex` (the tip) `15 passed`; with the mutant below
`1 failed, 14 passed`, and the one failure is this body. The kill set is this
body alone — it contains no existing body and no existing body contains it:
the mutant leaves `session-economics.spec.ts`'s other 14 bodies and all 58
of `card-preflight.spec.ts` green (73 passed under the mutant, measured
before this body existed).

The mutant lands at the line that CHOOSES the site, which is where the
property lives. The first draft of this body re-derived the advisory site
with a `findIndex` of its own, and that draft SURVIVED this very mutant —
73 passed — which is the `T-210` shape the role file names. It was rewritten
to drive `optionalSection`, and the reading above is the rewritten one.

```mutant
correction: 1 — the two readers open the criteria section in the same place
file: tools/e2e/scripts/session-economics.mjs
spec: tools/e2e/tests/session-economics.spec.ts
body: the two readers open the criteria section in the SAME PLACE, and not merely both somewhere
message: different places on ONE card
--- old
  const start = lines.findIndex((l) => opens(l.trim()));
--- new
  const start = lines.findLastIndex((l) => opens(l.trim()));
```

#### CORRECTION 2 (assigned) — the follow-through's own stated hazard is written in a comment and measured by nothing

The three compiled forms of one source differ only in their FLAGS, and the
comment beside them says why the "does this verdict head a correction" form
is not the global one: `RegExp.test` on a global regex carries `lastIndex`
from call to call. The verb asks that question more than once in a run — the
plan asks it, the read at the tip asks it again — and the second answer is
the one that would silently drop every block. Nothing measures it, and
`assignsCorrections` has no direct body in the spec at all.

The body asks the same unchanging verdict three times in a row. The three
readings are consecutive on purpose: `String.match` resets a global regex's
`lastIndex`, so a `correctionHeadings` call between two of them would hide
exactly the carry this pins — the first draft interleaved them and would
have been vacuous. The fixture deliberately omits the words `ASSIGNED
CORRECTIONS`, which would answer through the other half of the disjunction
so that the flagged half is never asked, and the body asserts that omission
before it asserts anything else. A negative control reads a verdict heading
no correction twice and requires false both times.

Read RED against an implementation lacking the property and GREEN against one
carrying it: at the tip `30 passed`; with the mutant below `1 failed, 30
passed` and the one failure is this body, on its SECOND reading. No other
body in `merge.spec.ts` moves, so the kill set is this body alone.

```mutant
correction: 2 — assignsCorrections answers the same over one unchanging input
file: tools/e2e/scripts/merge.mjs
spec: tools/e2e/tests/merge.spec.ts
body: assignsCorrections answers the same over one unchanging input, however often it is asked
message: the SECOND reading of one unchanging verdict
--- old
    /\bASSIGNED\s+CORRECTIONS?\b/i.test(verdictText) || CORRECTION_IN_TEXT.test(verdictText)
--- new
    /\bASSIGNED\s+CORRECTIONS?\b/i.test(verdictText) || CORRECTION_HEADINGS.test(verdictText)
```

Two corrections, two mutant blocks.

#### A FINDING THAT DOES NOT BLOCK, FILED AS T-311-s10

The widening makes EVERY dated depth-three heading under `## Verdicts` a
verdict entry, and only a `CORRECTION` heading is excluded. I re-ran the
census on this bench with both patterns and reproduced the executor's
figures to the card: of 312 cards carrying the section at the lane tip (310
at the base the comment names, plus the two cards this lane files), 19 gain
an entry the anchored reader missed entirely, and ONE moves. The one that
moves is `T-238-s1`, from its own `APPROVED WITH ASSIGNED CORRECTIONS` entry
to a later `### Amendment of 2026-09-12 …` appended under the same section;
`T-317-s3` elects a heading that reads `### The seat's note, 2026-09-13 …`.

`verdictState` answers `verdict` for such a heading and `preludePlan` refuses
anything that is not `APPROVED` or `ACCEPTED`, so this is FAIL-CLOSED and its
refusal now NAMES the heading it read, which is a far better message than the
one the absorbed card was filed about. It is still a false stop of the same
class, now reachable on a card carrying a perfectly good approval, and the
executor's notes name `T-238-s1` and call the move correct. I do not reject on
it — the alternative, requiring a verdict WORD, re-narrows the reader below
the rule — but the class belongs on the board.

#### WHAT THIS VERDICT DOES NOT ESTABLISH

- The switch of criterion 2's body from an equality to an exclusion rests on
  a seat note in this lane's ask file carrying the owner's ruling of
  2026-09-13. I did not read the ask file; I graded the exclusion against the
  criterion's own words — "green at landing and reds on the fifteenth" — and
  ran both controls. The equality would have been stricter than the card.
- The body pinning the published heading shape requires EXACTLY ONE line in
  `verifier.md` that begins with `### ` and contains `<`. That is true today
  and is a fair way to find the shape without re-typing it, but it is a
  whole-file uniqueness claim, and a second illustrative heading anywhere in
  the file reds it. Noted, not filed.
- `newestVerdict` scans from the `## Verdicts` heading to the END OF FILE
  rather than to the end of that section. That is unchanged by this diff and
  harmless while `## Verdicts` is the last section a card carries, but the
  widening enlarges what it would pick up if one ever were not.

#### STEP 7 — THE GATES MY OWN COMMITS COULD MOVE, RUN AT THE TIP I CREATED

Appended INSIDE this verdict entry rather than as a new dated heading of its
own, because a second dated `### ` under this section would become the newest
entry and the verb would read this card from its middle — which is the very
finding filed as T-311-s10 one screen above.

My four commits — this verdict, the two corrections, and T-311-s10 — put two
new bodies in the tree and two cards on the board, so the figures the section
above measured at `163a46c7` are not the figures at my tip. Re-derived at
`a57634c5`, the whole battery through the blessed runner, one run, clean tree
(`dirty: false`, one tree hash across all four legs):

| suite | ref | bodies | exit | verdict |
|---|---|---|---|---|
| parser | `a57634c5` | 412 | 0 | GREEN |
| app | `a57634c5` | 1171 | 0 | GREEN |
| rust | `a57634c5` | 655 (18 targets) | 0 | GREEN |
| e2e | `a57634c5` | 1052 | 0 | GREEN |

The e2e count is the lane's 1050 plus the two bodies the corrections commit.
The guarded tier owes the whole battery and this is it, run after the writes
rather than before them.

`node scripts/capabilities.mjs --check` from `tools/e2e` exits 1: STALE,
committed 96334 bytes against a fresh generation of 97105. At the lane tip it
was 96921 — the lane's six new bodies — and the 184 bytes between them are my
two. The regeneration is the merge's, as the lane's notes already say; I name
the number so the integrator knows it grew by two after the verdict and does
not read a six-body staleness against an eight-body tree.

#### A FIGURE OF MY OWN, RE-DERIVED AND WRONG IN THE TEXT ABOVE

Records are appended and not rewritten, so the error stays where it is and
the reading stands here. In the second assigned correction I wrote "at the
tip `30 passed`". 30 was the count BEFORE that body existed; with it the spec
carries 31 and the green reading at my tip is `31 passed`. The mutant reading
is unaffected and was already right — `1 failed, 30 passed`, 31 bodies, the
one failure the new body. The first correction's figures are right as
written: 15 bodies, `15 passed` green, `1 failed, 14 passed` under the mutant,
and `card-preflight.spec.ts` carries 58 bodies, which is the 73 in that
paragraph less the 15.

Nothing else in this verdict was measured at a commit my own writes moved: the
board censuses (312 cards with a Verdicts section, 509 with a criteria
section, ten cards off depth) were taken at `163a46c7` and name that ref, and
my two cards are already counted in the 312.
