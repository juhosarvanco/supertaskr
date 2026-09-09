---
id: T-282
title: The triage view clusters suggested cards by fence and class parent and flags duplicates for the human, and the backlog band's lines are RE-DERIVED from the loop's measured arrival, clearing cost and closure rates rather than raised
feature: F-06
milestone: 4
size: S
priority: 3
status: verifying
suggested_by: "@human (2026-09-09): decision 4 of the seat's review of the outside review — \"re-derive via the keeper\"; the outside review had proposed a filtering agent and raising the band from 40 to 80"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/scripts/health-bands.config.mjs, tools/e2e/tests/health-bands.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

At the second sitting of 2026-09-09 the board carried 67 suggested
cards against a band that breaches at 40. The band's own `measured`
entry derives its lines from one reading: the amnesty triage of
2026-08-29 dispositioned 140 cards in one architect sitting for about
477k tokens, roughly 3.4k tokens per card, so a 40-card backlog is the
largest one sitting clears without becoming its own project, and the
drift line is half of it. Two nights of the loop since then filed 27
and 20 cards; every one carries a fence (the seat derived it: 57 of
57, then 67), so the triage that remains is promotions and closures,
and the cost per card is not the amnesty's.

The same sitting found the same defect filed three times (T-216-s6,
T-256, T-238-s5) and a card that duplicated a live lane's remedy. The
rule exists — search before filing; append a corroboration to the
class parent — and two lanes obeyed it; the instrument that would show
the third filing beside the first at triage does not.

## Acceptance criteria

- WHEN `brief.mjs --dispatch --full` renders its triage section THE
  view SHALL cluster the suggested cards by fence overlap (their
  expanded `touches:`) and by class parent (the `T-NNN-s<n>` id and
  any `Absorbs:` or `Class parent:` line the card carries), naming
  each cluster's members, and SHALL flag a suggested card whose fence
  and class parent both match a planned or building card as a
  DUPLICATE CANDIDATE — a flag for the human, never a closure: the view
  changes no card.
- WHEN the backlog band `triage/live-suggestions` is read THE lines
  SHALL derive from a measurement taken on this repository's own
  records — cards filed per sitting and cards dispositioned per sitting
  over the checkpoints since the amnesty, and the tokens per
  disposition where a checkpoint stamped them — with the derivation
  written into the band's `measured` entry beside the commit and the
  records it read; a line typed without a derivation is refused by the
  band's own body.
- IF the measurement says the band should measure something other than
  a count (the backlog's AGE, or its size against the clearing rate)
  THEN the card SHALL say so with the figures and the band SHALL change
  accordingly, its unit and authority updated in the same commit.
- THE health-bands spec SHALL pin that the band's lines and its
  `measured` entry agree (a moved line owes a new derivation), and a
  body SHALL red when the derivation names no record.
- WHEN the checkpoint is recorded THE record SHALL stamp the band's
  reading before and after, with the clock.

## Implementation notes

Executor claude-opus-5@subagent, lane `task/T-282-triage-clusters-and-band-rederived`,
base `3a69385a9b2a6256ffe2ac97b256de929ca932f9`. Every figure below was
re-derived in this lane at that ref unless it carries its own clock.

### Criterion 1 — BUILT, AND NOT WIRED. The render site is outside the fence.

The card's fence is `dispatch-brief.mjs`, `brief.spec.ts`,
`health-bands.config.mjs`, `health-bands.spec.ts`. Criterion 1 names the
render site — `brief.mjs --dispatch --full` — and **that view is built by
`dispatchReport` in `tools/e2e/scripts/dispatch-order.mjs`, called from
`brief.mjs`; neither file is in the fence**, and neither carries a
triage-of-suggestions section today. A `status: suggested` card reaches
`dispatchReport` only inside `underway`, which that report filters to
`IN_FLIGHT`, so suggestions are rendered nowhere at this ref.

So the derivation and its bodies were built inside the fence and the
one-line wiring was ASKED for (`$S/ask-T-282.md`, written at the start of
the lane so the seat could act while the lane kept building — the ask is
never a wait). No grant arrived; the fence manifest and the card's
`touches:` line both still read the four original paths, and this lane
writes neither half of its own grant. **The wiring is filed as
`T-282-s1`**, naming the exact call site and the one line.

What is in the fence and finished, in `dispatch-brief.mjs`:

- `classStem` / `classKin` / `CLASS_KIN_OPENERS` — the class parent, from
  the id's own stem and from every `Absorbs:` or `Class parent:` line,
  in all four spellings live on this board (inline, parenthesised,
  bolded, and the `## Class parent` HEADING with the ids under it).
- `fencePaths` / `sharedGround` — the ground two cards both reserve,
  decided by the same private `pathsOverlap` `fenceOverlaps` uses, so a
  fence this calls shared is one that module calls not-disjoint.
- `triageBoard` / `TRIAGE_STATUSES` — the suggested, planned and building
  cards with their fence tokens and their class parents.
- `triageClusters` — the two groupings and the duplicate flag.
- `triageClusterRecs` — the section, as stamped records. It needs only
  `{root, ref, at, host, full}`, which BOTH context shapes in this
  repository carry, so the wiring is one line at either candidate site.

**THE FIRST BUILD OF THE FENCE HALF WAS WRONG AND THE MEASUREMENT IS WHY
IT CHANGED.** Connected components of *shares ground with* is the obvious
reading of "cluster by fence overlap"; driven against this board it
returned **75 of the 80 live suggestions as ONE cluster**, because a card
fenced on `tools/` and a card fenced on `app/` are joined by any third
card fencing both. That is a cluster that names nothing. The shipped
version keys a cluster on the GROUND — *the cards that reserve this
path* — dedupes by member set, and a card may appear in several. The
invariant a body now pins is the one the transitive build cannot hold:
every member reserves every path its own row names.

Driven against the live board in this lane's working tree, `--full`: 80
live suggestions, 42 fence clusters, 18 class clusters, **13 DUPLICATE
CANDIDATES**, 3 suggestions sharing ground with nothing, 0 unfenced.
(Both this and the size below are functions of the board and move with
the next card filed; they were read over the tree this commit makes.) Two of the flags are cross-stem and
would not have been found by the id alone (`T-229-s3` and `T-229-s5`
against planned `T-155-s6`, joined by their own `Class parent:` lines);
`T-265-s3 ~ T-264-s6` is the shape the card's own prose describes.

Cost, measured over the same tree: the section renders **18,038 bytes**
against a `--dispatch --full` answer of **116,172**. That answer is
already 178% of one pipe buffer and the command's own margin block
already discloses it; the section is one line per cluster and prints no
titles for exactly that reason (T-225's lesson, applied to its own
command).

### Criterion 2 — the band is RE-DERIVED from the records, not raised.

`triage/live-suggestions` moves **drift 20 -> 46, breach 40 -> 92**, and
the whole derivation is written into the band's `measured` entry beside
the commit and the records it read. In short, from
`docs/checkpoints/` since the amnesty:

| sitting | dispositioned | tokens | per disposition |
|---|---|---|---|
| 2026-08-29 amnesty | 140 | 477,081 (45.5 min) | ~3.4k |
| 2026-08-30 standing triage #1 | 46 (queue 46 -> 0) | 227,693 (26 min) | ~4.9k |
| 2026-08-30 #2 | 22 | not derivable at that seat | — |
| 2026-08-30 #3 | 14 | not derivable at that seat | — |
| 2026-08-30 #4 | 14 | not derivable at that seat | — |
| 2026-08-31 #5 | 5 | not stamped | — |
| 2026-09-02 fourth fable window | 16 (37 filed) | — | — |
| 2026-09-03 form sitting window | 5 (18 filed) | — | — |

The largest backlog a single sitting has taken to zero CHEAPLY is 46, in
26 minutes; the only larger clear on record is the amnesty's 140, which
its own record calls the state where clearing had become its own
project. So the drift line is that measured sitting (46) and the breach
line is two of it (92) — which at the measured 4.9k per disposition is
~451k tokens, the amnesty's own 477k bill reached from the other side,
and which sits inside an interval no sitting has ever cleared anything
in. The arrival side is why the old 40 stopped discriminating: **14
suggestions filed 2026-09-08 and 57 filed 2026-09-09** by git add-date,
so a line at 40 breaches after one night of the loop by construction.

Arrivals were cross-read two ways because the `suggested_by` field does
not require a date and 23 of the 80 live suggestions carry none (the
field's contract in `method/tasks/TASK-FORMAT.md` asks for *"role,
model@session, or human"*, so this is not a format violation and no card
is filed for it): dated `suggested_by` gives 2026-09-02: 3, 2026-09-08:
14, 2026-09-09: 40; git add-date gives 2026-09-02: 7, 2026-09-08: 14,
2026-09-09: 57, with 2 unattributable through a rename.

### Criterion 3 — answered with the figures, and the unit stays `cards`.

The IF asks whether the measurement says to measure something other than
a count, and names two candidates: the backlog's AGE and its size
against the clearing rate.

- **AGE is already kept**, by `triage/oldest-suggestion-days` (drift 5,
  breach 15), which read 7.37 days at this ref.
- **The arrival RATE is already kept**, by
  `triage/net-arrivals-per-window`, which read 14 cards.
- What this band owed was therefore not a different quantity but a
  **rate-derived line**, and that is what it now has: both lines are the
  measured clearing rate expressed in cards.

The unit is NOT renamed, and the reason is a correctness one rather than
a preference: the reading is a card count computed by `readingsFromTree`
in `tools/e2e/scripts/health-bands.mjs`, **which is outside this card's
fence**. A `unit:` string changed here without that reader changing would
put a label on a number it does not describe — the silent mis-report the
whole config exists against, and the same defect class as
`Playwright's summary unit is READ, never assumed`. Nothing is routed
for a unit change because the measurement does not ask for one; what it
asked for is in the lines.

### Criterion 4 — two bodies in `health-bands.spec.ts`, and one forced consequence.

- *EVERY BAND'S LINES ARE STATED IN ITS OWN MEASURED REASON* — for every
  band with a numeric line, that number must appear as a number token in
  its `measured.reason`. The number test is tokenised, not substring:
  `140` does not state a breach of 40 and `9.3` does not state a drift of
  9, and the substring reading passes both, which is how a band drifts
  from its own derivation invisibly. It carries its own positive control
  (a real band's line moved by one fails the same check).
- *A DERIVATION THAT NAMES NO RECORD IS REFUSED* — every `measured` entry
  must name a commit ref, a card id or a repository path. SHAPE ONLY, and
  deliberately: ADR-019's Records clause forbids a suite depending on
  `docs/checkpoints/` contents, so the body asks whether the reason cites
  something a reader can open, never whether that file is still there.
  Controls both ways, including the recordless justification a raised
  band actually looks like from the inside.

Three existing bands did not state their own lines and were amended so
that they do, **without one existing word being removed** — each addition
is arithmetic the reason already specified: `graph/budget-headroom-bytes`
(*"four of them"* = 63,004 bytes), `suite/e2e-seconds` (*"1.5x and 2.0x"*
of 156 = 234 and 312 seconds), and `triage/net-arrivals-per-window`
(*"one measured day's arrivals"* = 9).

**ONE LINE MOVED IN A SECOND BAND AND IT WAS FORCED.**
`triage/net-arrivals-per-window`'s breach line was 40 because its own
reason derives it from *"the count band's own one-sitting ceiling"*. That
ceiling is what criterion 2 re-derived, so the line moves with it: **40
-> 46**, with the move argued in that band's own `measured` entry. Its
DRIFT line is untouched — that belongs to the arrival measurement and
this card measured the clearing side. Leaving it at 40 would have left a
derivation naming a ceiling this config no longer holds, which is exactly
what the first new body refuses.

### Criterion 5 — the SEAT'S act, and the readings it needs are here.

*"WHEN the checkpoint is recorded THE record SHALL stamp the band's
reading before and after, with the clock"* is performed by whoever writes
the checkpoint, not by this lane; a record written here would be a second
writer in `docs/checkpoints/`. Both readings are supplied so the stamp
costs nothing, taken in this worktree on 2026-09-09 (Mac.lan), the
"before" through `npm run health -- --config <the config at 3a69385>`:

- **BEFORE**: `health-bands: 14 band(s) — 2 inside, 3 drifting, 2
  BREACHED, 3 unread, 4 UNKEPT`, exit 3; `triage/live-suggestions`
  **BREACHED**, reading 80 cards, band drift 20 / breach 40.
- **AFTER**: `health-bands: 14 band(s) — 2 inside, 4 drifting, 1
  BREACHED, 3 unread, 4 UNKEPT`, exit 3; `triage/live-suggestions`
  **drifting at 80 cards against the 46 drift line, not yet the 92 breach
  line**.

Exit 3 is the designed answer while any band is unkept, before and after.
The one remaining breach is `docs-headroom/docs/STATE.md`, which is not
this card's.

### Noticed and not done

- **`T-282-s1`** — the one-line wiring criterion 1 needs
  (`tools/e2e/scripts/brief.mjs`).
- **`T-282-s2`** — `docs/reference/11-health.md` carries the band table
  by hand and now disagrees with the config in two rows. Derived: nothing
  under `tools/` or `.claude/` reads that page, so no gate can see it.
- **`T-282-s3`** — no checkpoint record stamps a disposition tally, so
  the clearing rate this band now rests on had to be read out of eight
  records' prose, worded differently every time.

For the verifier: the two places to press are the fence half's keying
(the invariant body is the one that separates it from the transitive
build) and the `measured` entry's arithmetic, which is re-derivable from
the eight records named in the entry's own `at` field.

### The poison drill — 8 mutants, 8 bodies, 8-for-8

Drilled at commit `e909b79` (M1-M6) and `2b442bb` (M7, M8), tree clean at
both, one mutant at a time. Every mutant moves the PRODUCER — the module
under test, or the CONFIG DATA where the property is data — never an
assertion and never a literal the two share; each mutation was read back
with `git diff` before its suite ran; each restore used `git restore
--source=<commit> --staged --worktree` and is proved by **sha256 against
the drill commit, which MATCHED on all eight**.

| mutant | one-side change | suite | tally | killed |
|---|---|---|---|---|
| M1 | fence clustering keys on `p === key` instead of `pathsOverlap(p, key)` | brief.spec.ts | exit 1, 1 failed / 71 passed | THE FENCE CLUSTERS ARE KEYED ON GROUND |
| M2 | the class-parent test is dropped from the duplicate flag | brief.spec.ts | exit 1, 1 failed / 71 passed | A DUPLICATE CANDIDATE NEEDS BOTH SIGNALS |
| M3 | the heading lookahead in `classKin` never runs | brief.spec.ts | exit 1, 1 failed / 71 passed | THE CLASS PARENT IS READ OFF THE CARD'S OWN LINES |
| M4 | `TRIAGE_STATUSES` says `suggestion` where the parser says `suggested` | brief.spec.ts | exit 1, 2 failed / 70 passed | THE STATUSES ... ARE THE PARSER'S OWN WORDS, and the class-parent body with it |
| M5 | the `--full` gate is `if (false)`, so the default view prints the page | brief.spec.ts | exit 1, 1 failed / 71 passed | THE DEFAULT VIEW IS ONE COUNTED LINE |
| M6 | the duplicate match set becomes every card that is not `done` | brief.spec.ts | exit 1, 2 failed / 70 passed | A DUPLICATE CANDIDATE NEEDS BOTH SIGNALS, and THE VIEW IS A READ |
| M7 | `triage/live-suggestions` drift 46 -> 47 with its derivation untouched | health-bands.spec.ts | exit 1, 1 failed / 23 passed | EVERY BAND'S LINES ARE STATED IN ITS OWN MEASURED REASON |
| M8 | a real `measured.at` replaced by "raised at the review, by agreement" | health-bands.spec.ts | exit 1, 1 failed / 23 passed | A DERIVATION THAT NAMES NO RECORD IS REFUSED |

**THE DRILL CHANGED THE WORK, WHICH IS THE ONLY REASON TO RUN ONE.** M8
SURVIVED its first pass — 24-for-24, exit 0 — because the body asked
`measured.at` and `measured.reason` TOGETHER and the reason beside the
mutated address still cited a source: the band read as addressed while
its address had become a sentence. The body now asks the ADDRESS itself,
which is stronger, is satisfied by every band at this ref, and is what
criterion 2's own words ask for (*"beside the commit and the records it
read"*). One band's reason — `triage/oldest-suggestion-days` — argues
honestly in prose and cites nothing of its own, which is why the check is
on `at` and not on the whole entry. That correction is commit `2b442bb`.

Kill-set containment, stated rather than assumed: M4 and M6 each killed
TWO bodies and both spillovers are the property's own site. M4 empties
the fixture board for every body that builds one through `triageBoard`,
and M6's widened match set is exactly what the live-board body's *"a
duplicate never names a card that is itself a suggestion"* assertion
exists to catch.

## Verdicts
