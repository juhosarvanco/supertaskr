---
id: T-282
title: The triage view clusters suggested cards by fence and class parent and flags duplicates for the human, and the backlog band's lines are RE-DERIVED from the loop's measured arrival, clearing cost and closure rates rather than raised
feature: F-06
milestone: 4
size: S
priority: 3
status: done
suggested_by: "@human (2026-09-09): decision 4 of the seat's review of the outside review — \"re-derive via the keeper\"; the outside review had proposed a filtering agent and raising the band from 40 to 80"
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/scripts/health-bands.config.mjs, tools/e2e/tests/health-bands.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
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

**Correction (the integrator, 2026-09-09, assigned by the verifier as C4):** the figures the notes call read over the tree this commit makes are the BASE board's — at bf22ede, with this lane's own three cards on the board, they are 83 live suggestions (not 80), 43 fence clusters (42), 19 class clusters (18), 5 sharing ground with nothing (3), the section 18,422 bytes (18,038); criterion 5's AFTER reading for the seat's stamp is drifting at 83 cards against 46/92, not 80. The verdict word is unchanged. The notes above stand as written; this line is the record.

Absorbs: T-282-s1 (the wiring — `if (full) say(render(triageClusterRecs(dctx)))` in brief.mjs's dispatch arm, with the body "THE TRIAGE CLUSTERS REACH THE RENDERED ANSWER" in brief.spec.ts; landed at this merge as the integrator's write at @human's word of 2026-09-09, "Land it inside T-282's merge").

## Verdicts

### VERDICT 2026-09-09 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent (verifier, phase 2)

attack set: sha256:b4604725b13bf2f8634b7281ac1ef47eb214f7f82949557b7da4f85599adeff7 (attack-set-T-282.md)

Judged at the lane tip `bf22ede97c8d6c5f6c1d85d3a3213a90a54a06e6`, against the
base `3a69385a9b2a6256ffe2ac97b256de929ca932f9`, on the detached bench
`/Users/ujju/Projects/nputer-V-T-282`. The five sealed inputs, verified by
`shasum -a 256` before anything else was opened and all five matching:

    b4604725b13bf2f8634b7281ac1ef47eb214f7f82949557b7da4f85599adeff7  attack-set-T-282.md
    1a7d43e68eb2aa9fb9159efe6e8a1f25f633c96187197afbd63c5dd93bcdb0a5  ground-T-282.md
    0a3c517ff34e6d968ba4395a18f572f1f8a772c035a567640e5100eb196e776a  ground-T-282-addendum.md
    d13905d4fe0148f385332492e414372947d3a5e52c31fe23105d8fd093ed4d04  ground-T-282-addendum-2.md
    9ec3d3830dbf7c289a71d332e9776af8a15cdfd62a36228c97b8c55c699f18c1  ground-T-282-addendum-3.md

**THE FRAME I ACTUALLY HAD** was: the card at base, the dispatcher's five sealed
ground truths, and the diff — no executor reasoning, notes or commit messages —
for every finding below on criteria 1, 2 and 4 and for the whole mutant drill.
The report, the implementation notes and the commit messages were opened ONLY
afterwards, to re-derive claims, and where they corrected me I say so.
**THE BRIEF CARRIED NO CONTEXT PACK** — it is hand-written by the seat — so per
`method/roles/verifier.md` step 0 I read `docs/CONVENTIONS.md` END TO END rather
than by its bullets, and `docs/STATE.md` and `docs/ARCHITECTURE.md` besides.

#### What holds

- **THE FENCE IS CLEAN.** `git diff --name-only 3a69385..bf22ede` is eight paths:
  the four fenced files, this card, and three NEW cards under `docs/tasks/`.
  `gate-run.mjs`, `gate-run.spec.ts`, `docs/CONVENTIONS.md` (T-271),
  `ci.yml`, `workflow-parity.spec.ts` (T-278-s2), `verifier.md`, `integrator.md`,
  `merge.mjs`, `cli.spec.ts` (T-281), `method/tasks/TASK-FORMAT.md` and every
  `package.json` are untouched. The method stamp still reads **v0.1.12**.
- **THE SHARED VIEW DID NOT MOVE.** Rendered `brief.mjs --dispatch --full` at the
  base and at the tip and diffed them with shas and clocks normalised: identical
  but for this card's own status word (`building` -> `verifying`) and the HEAD
  sha, plus the 1 byte that word costs the answer's self-measurement. STARTABLE
  membership and ordering, UNBLOCKED BUT FENCED, the census — all unchanged.
  The `dispatch-brief.mjs` diff is **+414 / -0**, so nothing existing was touched.
- **NO BODY WAS RENAMED OR REMOVED.** `brief.spec.ts` 58 -> 64 `test(` openers,
  `health-bands.spec.ts` 22 -> 24; the set difference in the removed direction is
  EMPTY on both. Run alone at my tip: brief **72 passed exit 0**, health-bands
  **24 passed exit 0**.
- **THE VIEW CHANGES NO CARD (criterion 1's prohibition, C3).** Two full renders
  plus the live-board body, `git status --porcelain` empty throughout and
  `git diff --stat -- docs/tasks/` empty. Statically: the added block contains no
  `writeFileSync`, `appendFileSync`, `execSync`, `execFileSync`, `spawnSync`,
  `rmSync` or `renameSync`, and no write-enabled mode exists to be flipped.
- **THE CLUSTERING IS DERIVED, NOT HAND-KEPT.** No literal `T-NNN` appears in the
  added CODE at all — only in its doc comments. Driven against the live board it
  moves: removing a flagged member drops the flag; a synthetic clone of a planned
  card on both keys IS flagged; the same clone with a different class parent is
  NOT; the same class parent with a disjoint fence is NOT.
- **THE FLAG DISCRIMINATES, MEASURED.** Over the live board at my tip (83
  suggestions x 147 planned/building) the class parent alone matches **67** pairs,
  the fence alone **2,854**, and BOTH — the flag — **13**: 0.44% of the pairs
  either signal would fire on, 9 distinct suggestions, a **10.8%** flag rate.
  Neither vacuous-positive nor vacuous-negative.
- **THE ORACLE THE UNDECIDABLE TRIO STOOD FOR HOLDS.** `T-216-s6` and `T-238-s5`
  have NO FILE at the base (ground addendum G8), so the attack set's sharpest test
  cannot be run as written. What it was testing — whether kinship crosses stems —
  IS decidable and passes: `T-229-s3 ~ T-155-s6`, `T-278-s3 ~ T-216-s3` and
  `T-265-s3 ~ T-264-s6` are all flagged across different stems, each joined by the
  suggestion's own `Class parent:` line and by no id arithmetic.
- **ONE EXPANDER, NOT TWO.** `fencePaths` calls `expandFenceEntry` and
  `sharedGround` decides overlap with `pathsOverlap` — the same two the STARTABLE
  derivation and `fenceOverlaps` already use. The directory-vs-file case
  (`app-board` against `app/src/components/board/TaskCard.tsx`) clusters, and a
  raw-string intersection could not.
- **NO PARKED, DONE OR REJECTED CARD REACHES THE VIEW**, checked over every id the
  view renders; every duplicate counterparty is `planned`.
- **PERFORMANCE IS A NON-ISSUE**: `triageClusters` over the live board is **5 ms**;
  the whole `--dispatch --full` render is 1.13 s at the tip against 1.02 s at the
  base.
- **CRITERION 2's DERIVATION IS RECORD-BACKED, FIGURE BY FIGURE.** I re-read every
  number against the record its `measured.at` names, and every one is verbatim
  there: the amnesty's **140 dispositions / 477,081 tokens / 136 tool uses / 45.5
  minutes / ~3.4k per card**; standing triage #1's **46 -> 0 / 227,693 tokens / 88
  tool uses / 26 min / ~4.9k per disposition**; the tallies **22 / 14 / 14** in
  standing triage 2, 3 and 4 and **5** (4 promoted + 1 absorbed) in #5; **16
  dispositioned** in the 2026-09-02 fourth-fable record and **5 dispositioned** in
  the 2026-09-03 form-sitting record. 92 x 4.9k = ~451k checks out. And I
  reproduced the arrival figures independently: of the 80 suggestions live at the
  base, git add-date gives **14 on 2026-09-08 and 57 on 2026-09-09** (55 joined
  directly, 2 more through a rename, 2 with no add commit in first-parent history)
  — exactly what the entry claims. The `suggested_by` reading differs (40 on
  09-09) and I first logged that as unexplained; the notes explain it precisely,
  and the load-bearing claim holds under either reading.
- **CRITERION 3 IS ANSWERED, NOT PASSED OVER.** The card states with figures that
  the unit stays `cards`, names both alternatives the criterion offers and the
  sibling bands that already keep them, and gives a correctness reason for not
  renaming (`readingsFromTree` in `health-bands.mjs` is outside the fence). Silence
  would have been unmet; this is not silence.
- **CRITERION 5 IS LEFT TO THE SEAT, CORRECTLY.** No checkpoint file, no
  `docs/STATE.md`, nothing outside the fence; the notes claim no checkpoint was
  written, and none was.
- **SECURITY (§F6) IS CLEAN.** `expandFenceEntry` is pure string work and touches
  no filesystem, so `../../../etc/passwd`, `/etc/passwd`, `**`, `{a,b}/**/*` and
  `~/.ssh/id_rsa` are echoed as tokens and never read; a 100,000-character field
  and a 10,000-id kinship line both return in 4 ms; no shell interpolation, no
  network, no `process.env`, no `$HOME`, no new dependency, `package.json`
  untouched.

#### The verdict, and why it is not APPROVED plain

**CRITERION 1 IS REFUSED WITH EVIDENCE, AND THE REFUSAL IS THE RIGHT ACT.** The
criterion's WHEN-clause is not satisfied at this tip: `brief.mjs --dispatch --full`
renders no triage section — I ran it and grepped, 0 hits for `TRIAGE CLUSTERS`,
`BY FENCE`, `BY CLASS PARENT` and `DUPLICATE CANDIDATES`, and
`triageClusterRecs` has exactly one caller in the repository, `brief.spec.ts`.
The render site (`brief.mjs`, `dispatch-order.mjs`) is outside this card's fence.
The lane asked for the widening at its start, was never granted it, did not widen
itself, said so in as many words, and filed the one-line wiring as `T-282-s1`.
**A LANE THAT COULD NOT WIDEN AND SAID SO IS NOT A LANE THAT WIDENED**, and what
shipped in-fence is the honest partial: a complete derivation with six bodies over
it, of which the drill kills six mutants. I assign no correction for the wiring —
it is outside the fence and already carded. The seat's own disclosure that its
watcher never listed the ask is recorded here as the cause.

**THE CORRECTIONS BELOW ARE CRITERION 4's OWN SUBJECT.** The card exists because an
outside review proposed moving this band from 40 to 80 with no measurement and the
ruling was to re-derive instead. The body written to refuse that does not refuse
it. I moved `triage/live-suggestions`' breach line from 92 to **80** — the exact
number the review proposed and the seat refused — left the derivation untouched,
and the suite ran **24 passed, exit 0**.

#### The drill — every mutant, where it landed, and what it did

Data mutants only, per T-221: criterion 2's property lives in the CONFIG DATA, and
a code mutant cannot grade it. Each landed in
`tools/e2e/scripts/health-bands.config.mjs`, was read back from `git diff` before
its suite ran, and was restored with
`git restore --source=bf22ede --staged --worktree`, with the file's sha256
(`c194cc75c9a37a7352c777fda2fb82ae35547d3f364015f9adccf6b02fe15042`) re-checked
after every single one and MATCHING every time. Suite:
`SUPERTASKR_E2E_PORT=25282 npx playwright test tests/health-bands.spec.ts`.

| mutant | what moved | exit | tally | verdict |
|---|---|---|---|---|
| D9 | breach 92 -> 93 | 1 | 1 failed / 23 passed | KILLED — the lines body |
| D10 | drift 46 -> 47 | 1 | 1 failed / 23 passed | KILLED — the lines body |
| D11 | `measured.reason` -> `""` | 1 | 5 failed / 19 passed | KILLED |
| D14 | reason rewritten to derive 35 / 70, lines left at 46 / 92 | 1 | 1 failed / 23 passed | KILLED — the lines body |
| D15 | `measured.at` deleted | 1 | 5 failed / 19 passed | KILLED — incl. the records body |
| D13 | `at`'s ref replaced by a well-formed nonexistent 40-hex sha | 0 | 24 passed | SURVIVES — shape-only, and DECLARED |
| D16a | `suite/lib-seconds`' `metric` string reworded | 0 | 24 passed | negative control — nothing red, correct |
| D16b | `suite/e2e-seconds`' `marker` string reworded | 0 | 24 passed | negative control — nothing red, correct |
| **D9b** | **breach 92 -> 140** | **0** | **24 passed** | **SURVIVOR** |
| **D9c** | **breach 92 -> 80** | **0** | **24 passed** | **SURVIVOR** |
| **D10b** | **drift 46 -> 22** | **0** | **24 passed** | **SURVIVOR** |
| **D18** | **`triage/net-arrivals-per-window` breach 46 -> 40** | **0** | **24 passed** | **SURVIVOR** |
| **D12** | **the whole reason replaced by recordless prose, `at` untouched** | **0** | **24 passed** | **SURVIVOR** |

D13's survival is NOT held against the lane: the body documents shape-only
checking with a reason (ADR-019's Records clause forbids a suite depending on
`docs/checkpoints/` contents), and I report it as the weaker pin it declares
itself to be rather than as a defect.

**WHY THE FOUR LINE SURVIVORS SURVIVE.** The agreement body asks whether a band's
drift and breach values appear as number TOKENS anywhere in its reason.
`triage/live-suggestions`' reason states **26 distinct numbers**, of which **19 lie
in 1..200**: 1 3 3.4 4 4.9 5 8 9 14 16 22 26 40 45.5 46 57 80 92 140. Any of those
passes as a legal line for that band with the derivation untouched — including 80,
which appears there *because the paragraph argues against it*. **A NUMBER THAT
APPEARS BECAUSE THE DERIVATION REFUTED IT IS NOT A DERIVATION OF THAT NUMBER**, and
that is the whole of correction 1. D18 shows the same hole on the second band this
lane moved: 40 is quoted in the sentence that re-derives 46, so the move can be
undone in silence.

**WHY D12 SURVIVES.** Commit `2b442bb` narrowed the records check from the whole
`measured` entry to `measured.at` alone, after the lane's own M8 survived the
entry-wide form. The narrowing is disclosed and the reasoning is sound as far as it
goes — but criterion 4's words are *"a body SHALL red when THE DERIVATION names no
record"*, and criterion 2's are *"a line typed without a derivation is refused by
the band's own body"*. With only the address checked, this band's entire derivation
can be replaced by *"The line felt too tight for the way this board moves now, and
everybody at the review agreed... We are confident this is right"* — keeping 46 and
92, naming no commit, no card and no path — and the suite stays 24-for-24 green.
The lane's stated obstacle is real and I checked it: `triage/oldest-suggestion-days`
is the ONE band whose reason names no record, which is why correction 2 carries a
one-clause config edit that gives that reason the record it already argues from.

**SCOPE, STATED RATHER THAN ASSUMED (the aiming-not-accounting test).** The
agreement body is whole-file: moving `suite/lib-seconds`' drift 9.5 -> 9.6 also reds
it, so D9/D10/D14's kills come from a body about EVERY band and not only this one.
It is not mere accounting — it carries its own positive control on
`triage/live-suggestions` — but the corrections below are deliberately SITED on the
two bands this card re-derived, which is where the property lives.

#### CORRECTION 1 — the re-derived lines must be pinned to the sentence that derives each one

Add to `tools/e2e/tests/health-bands.spec.ts`, inside
`EVERY BAND'S LINES ARE STATED IN ITS OWN MEASURED REASON — a moved line owes a new
derivation`, immediately after the existing positive control. **Run RED against the
implementation lacking it** (breach 80, breach 140, drift 22 and net-arrivals
breach 40 each red it; D12 reds it too) **and GREEN against one carrying it**
(24 passed, exit 0, at this tip, unmodified). Verbatim:

    // AND THE RE-DERIVED BANDS' LINES ARE PINNED TO THE SENTENCE THAT
    // DERIVES EACH ONE, never to the bag of numbers the paragraph happens
    // to contain. MEASURED: triage/live-suggestions' reason states 19
    // distinct values between 1 and 200, so the membership check above
    // passes for breach 80 — the exact number the outside review proposed
    // and this ruling REFUSED — and for 140, and for drift 22. A number
    // that appears because the derivation argued AGAINST it is not a
    // derivation of that number.
    expect(
      real.measured.reason,
      "triage/live-suggestions' drift line is not the number its own derivation sentence derives",
    ).toContain(`The drift line is that measured sitting: ${real.drift} cards`);
    expect(
      real.measured.reason,
      "triage/live-suggestions' breach line is not the number its own derivation sentence derives",
    ).toContain(`The breach line is TWO of it — ${real.breach} cards`);
    const net = STANDING_BANDS.find((b) => b.id === "triage/net-arrivals-per-window")!;
    expect(
      net.measured.reason,
      "triage/net-arrivals-per-window's breach line is not the ceiling its own sentence re-derives",
    ).toContain(`to zero cheaply from 40 to ${net.breach}`);

```mutant
correction: CORRECTION 1 — the re-derived lines pinned to their own derivation sentence
file: tools/e2e/scripts/health-bands.config.mjs
spec: tools/e2e/tests/health-bands.spec.ts
body: EVERY BAND'S LINES ARE STATED IN ITS OWN MEASURED REASON — a moved line owes a new derivation
message: breach line is not the number its own derivation sentence derives
--- old
    drift: 46,
    breach: 92,
--- new
    drift: 46,
    breach: 80,
```

#### CORRECTION 2 — the derivation itself, not only its address, must name a record

Two edits, both inside this card's fence. In
`tools/e2e/tests/health-bands.spec.ts`, inside `A DERIVATION THAT NAMES NO RECORD IS
REFUSED — a reason nobody can go and read is not a measurement`, extend the
per-band loop. **Run RED against the implementation lacking it** (the recordless-prose
reason reds it) **and GREEN against one carrying it** (24 passed, exit 0). Verbatim,
appended inside the existing `for (const b of allBands(DOC_BUDGETS)) { … }`:

    // AND THE DERIVATION ITSELF, which is what the criterion says: "a
    // body SHALL red when THE DERIVATION names no record". MEASURED: with
    // the address alone checked, this entry's whole reason could be
    // replaced by "everybody at the review agreed ... we are confident
    // this is right" — keeping the two numbers, naming nothing — and the
    // suite stayed 24-for-24 green. The address says WHERE the reading
    // was taken; the reason has to say WHAT it was taken from.
    expect(
      recordsNamed(b.measured.reason),
      `${b.id}'s measured reason cites no commit, no card and no path — it argues, and an ` +
        "argument nobody can go and check is the raised line this file exists to refuse",
    ).not.toEqual([]);

And in `tools/e2e/scripts/health-bands.config.mjs`, `triage/oldest-suggestion-days` —
the ONE band whose reason names no record, which is the honest obstacle the lane
found — gains the record its own sentence already argues from, no existing word
removed:

    "15 DAYS IS NOT A ROUND NUMBER — it is the amnesty's own worst reading " +
    "(docs/checkpoints/2026-08-29-amnesty-triage.md). The board's " +

The mutant below is planted AFTER correction 2's config clause lands: it strips
that clause back to the text this tip carries, which leaves
`triage/oldest-suggestion-days`' reason naming no record at all. Drilled on the
bench — **exit 1, 1 failed / 23 passed**, the one failure being this body, printing
`triage/oldest-suggestion-days's measured reason cites no commit, no card and no
path`.

```mutant
correction: CORRECTION 2 — the derivation itself must name a record
file: tools/e2e/scripts/health-bands.config.mjs
spec: tools/e2e/tests/health-bands.spec.ts
body: A DERIVATION THAT NAMES NO RECORD IS REFUSED — a reason nobody can go and read is not a measurement
message: cites no commit, no card and no path
--- old
        "15 DAYS IS NOT A ROUND NUMBER — it is the amnesty's own worst reading " +
        "(docs/checkpoints/2026-08-29-amnesty-triage.md). The board's " +
--- new
        "15 DAYS IS NOT A ROUND NUMBER — it is the amnesty's own worst reading. The board's " +
```

#### CORRECTION 3 — a quotation attributed to a record that does not carry it

`triage/live-suggestions`' new `measured.reason` says the amnesty *"dispositioned
140 cards for 477,081 tokens over 45.5 minutes (~3.4k per card) and **its own record
calls that the state where clearing had 'become its own project'**"*. Every figure
in that sentence is verbatim in
`docs/checkpoints/2026-08-29-amnesty-triage.md`; **the quotation is not**.
`grep -n -i 'project' docs/checkpoints/2026-08-29-amnesty-triage.md` returns
NOTHING, and `grep -rn -i "own project" docs/checkpoints/` matches one unrelated
line in a 2026-09-01 record. The phrase is the band's OWN PRIOR reason — the text
this very commit deleted — re-attributed to the checkpoint. The card's
Implementation notes repeat it (*"which its own record calls the state where
clearing had become its own project"*).

This is a one-clause fix and no body pins it: **CORRECTION 3 CARRIES NO MUTANT
BLOCK, and that is stated rather than left as a shortfall.** A body that checked
quotations against `docs/checkpoints/` would be exactly the dependency ADR-019's
Records clause forbids, which is the same reason correction 2 stops at shape.
Re-attribute the phrase to the band's prior entry (`git show
3a69385:tools/e2e/scripts/health-bands.config.mjs`), or drop the quotation marks
and make it the argument it is. In an entry whose entire purpose is that a figure
travels with the record that carries it, a quotation that does not is the one
sentence a later reader will check first.

#### CORRECTION 4 — the live-board figures are the base board's, labelled as this tip's

The notes say the figures were *"read over the tree this commit makes"* and the
report heads them *"Tree facts at `bf22ede` unless stated"*. They are the tree
WITHOUT this lane's own three new cards. Driven at `bf22ede` and again with
`T-282-s1/s2/s3` filtered out, the same code gives:

| figure | notes / report | measured at `bf22ede` | (the base board) |
|---|---|---|---|
| live suggestions | 80 | **83** | 80 |
| fence clusters | 42 | **43** | 42 |
| class clusters | 18 | **19** | 18 |
| sharing ground with nothing | 3 | **5** | 3 |
| duplicate candidates | 13 | 13 | 13 |
| the section's bytes | 18,038 | **18,422** | 18,037 |
| criterion 5's AFTER reading | "drifting at 80 cards" | **83 cards** | 80 |

The last row is the one that matters: criterion 5 asks the SEAT to stamp the band's
reading, and the number offered for that stamp is one the tree does not carry —
`grep -l '^status: suggested' docs/tasks/T-*.md | wc -l` is **83** at this tip. The
verdict word is unaffected (83 is drifting against 46/92 either way), and the
clusters do move with every card filed exactly as the notes say — but three of the
cards that moved them are this lane's own.

**AND ONE MORE FIGURE IN THE REPORT ONLY** (not a record, so not a correction, but
named because it is the same slip): the report gives `brief.mjs --dispatch --full`
as **116,172 bytes, 178% of one pipe buffer**. I rendered it at both ends — **127,410
bytes at the base and 127,411 at the tip, 194.4%** — and the answer's own margin
block prints `output: 127411 of 65536 bytes (194.4%)` in the run itself. The
argument the figure supports only gets stronger.

#### The battery, at my own tip, through the blessed runner

Run once at `bf22ede97c8d6c5f6c1d85d3a3213a90a54a06e6` from the bench root, tree
clean, `SUPERTASKR_E2E_PORT=25282`, counts read beside the exits:

    gate-verdict suite=parser exit=0 bodies=389  targets=1  verdict=GREEN
    gate-verdict suite=app    exit=0 bodies=1171 targets=1  verdict=GREEN
    gate-verdict suite=rust   exit=0 bodies=654  targets=18 verdict=GREEN
    gate-verdict suite=e2e    exit=0 bodies=772  targets=1  verdict=GREEN

The executor's reported counts for parser (389), app (1171) and e2e (772) are
CONFIRMED at the same ref by an independent run; rust is my own reading, which the
report did not claim.

#### Not failures — filed as cards, never as verdict prose

`T-282-s4` (the broadest fence cluster holds 52 of 83 suggestions on the bare token
`tools/`), `T-282-s5` (`verifying` is a live board status the duplicate match set
does not include), `T-282-s6` (card-derived text reaches the rendered dispatch
answer with no control-character filter — PRE-EXISTING at three sites in the base,
not this lane's).

#### Disposition

**APPROVED WITH ASSIGNED CORRECTIONS.** Criterion 2 is met and its arithmetic
survived a figure-by-figure re-derivation against the eight records it names.
Criterion 3 is answered explicitly with figures. Criterion 4 is met in shape and
the two corrections above close the gap between its shape and its words. Criterion
5 is correctly the seat's. Criterion 1 is REFUSED WITH EVIDENCE — the render site
is outside the fence, the ask was made and never granted, the lane did not widen
itself, and `T-282-s1` names the one line; the fence held, which is the property
that mattered more than the section.

#### Step 7 — the gates my own commits could move, run at my own tip

My range is `bf22ede..0c5442a`: four cards under `docs/tasks/` (this one and
`T-282-s4/s5/s6`) plus the two correction files. Recorded here because a role that
writes to the tree owes the tree's gates even when what it wrote was prose.

- **DOCS GATE — FIRES and is DISCHARGED.** `node tools/e2e/scripts/docs-gate.mjs`
  handed the four literal paths, exit **1**, naming three owed suites. All three
  GREEN at `0c5442af12470331e5ea0548311e4ff18be94ba0` through the blessed runner:
  `parser exit=0 bodies=389`, `app exit=0 bodies=1171`, `e2e exit=0 bodies=772`.
  The gate also reports *"every live task card's frontmatter parses, with a legal
  status"* and 0 injection hits over the four paths.
- **METHOD EVAL GATE — FIRES and is DISCHARGED.** This verdict adds a line matching
  the citation grammar under `docs/tasks/`. `node tools/method-evals/run.mjs` exits
  **0**, 10 model-free evals. And `node tools/method-evals/verdict-digest.mjs
  --scratch <this session's scratchpad>` reports this card's own citation
  **VERIFIED** against the saved attack set.
- **GRAPH REGEN — trigger matches, act NOT MINE and not run here.** My range touches
  a `.ts` outside `docs/` (`health-bands.spec.ts`). It adds assertions inside two
  EXISTING bodies and exports nothing new, and the regen is the checkpoint's act by
  the bullet's own words. Said out loud rather than skipped in silence.
- **BOOT GATE — NOT OWED.** No path under `app/src/**`, `app/src-tauri/**` or a
  manifest.
- **CAPABILITIES — NOT OWED BY MY COMMITS.** `git diff bf22ede..HEAD --
  tools/e2e/tests/` adds no `test(` opener, so no spec NAME moved. The lane's own
  eight new names still owe `npm run capabilities` in the merge commit (T-201).
- **THE BENCH IS NOT PUSHED AND THE LANE WAS NOT TOUCHED.** Two commits here, both
  detached: `5cc7556` (this verdict and the three cards) and `0c5442a` (the two
  correction bodies, after the verdict so its figures still name the tip they were
  measured at).
