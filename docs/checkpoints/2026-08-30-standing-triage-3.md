# Checkpoint: standing triage sitting #3 (2026-08-30, architect seat, no merge)

The day's tenth merge left fourteen suggestion cards behind it. **The
suggested column is 14 -> 0.** No merge, no lane, no code: the whole
sitting is `docs/tasks/**` plus this record, and one extra docket item
ruled because `T-112`'s dispatch waits on it.

## What called it, and it was not the band

    node scripts/brief.mjs --state          # from the e2e package, the BOARD section
    git grep -l "^status: suggested" docs/tasks/ | wc -l

**Before: 14**, at this sitting's base `@ 51fa31c0964cea5c2b8f9bf23858146cdfc18b6e`.
**After: 0** — the `suggested` row stops being printed at all, which is
what an empty column looks like in that census. The
`triage/live-suggestions` band (drift 20, breach 40, both in
`tools/e2e/scripts/health-bands.config.mjs`) was **HEALTHY at 14 the
whole time** and never called anything. This sitting is the standing
cadence doing its job before the band has to — which is the point of a
cadence, and worth saying because sitting #2's record opens with the
opposite case.

**THE BASE MOVED UNDER THIS SITTING AND THE RECORD SAYS SO.** Reading
began at `11e94867dd84` (the T-140-s1 checkpoint). While the cards were
being read the integrator dispatched the pre-walk wave, and the sitting
re-derived everything at the tip it actually wrote against,
`51fa31c0964c`, with **four lanes live** — `T-143-s3`, `T-154-s2`,
`T-159-s1`, `T-167-s1`. Every figure below is stamped at `51fa31c`
unless it names another ref. The moving base is not an inconvenience
here; it produced two of the sitting's three sharpest findings.

Board, same command, before -> after (`building`, `done` unchanged at
4 and 145):

| | before | after |
|---|---|---|
| suggested | 14 | **0** |
| planned | 65 | 73 |
| parked | 131 | 134 |
| flat task files | 359 | 356 |
| in rejected/ | 38 | 40 |

Before-figures derived at the base with
`git grep -l "^status: <s>" 51fa31c -- 'docs/tasks/T-*.md' | wc -l`;
after-figures from `brief.mjs --state`.

## The tally — 14 cards, four dispositions

**8 PROMOTED.** **1 ABSORBED** into one of them and removed in this
commit. **3 PARKED**, each with a condition somebody can check without
remembering the card. **2 ARCHIVED AS DISCHARGED** to
`docs/tasks/rejected/`, the reasoning line saying *discharged* rather
than *declined*, because the distinction is invisible in the status word
and is the one a later reader needs.

| card | disposition |
|---|---|
| T-163-s4 | PROMOTED F-06 p1 — red at the moment of its own promotion; body's script name corrected |
| T-167-s8 | PROMOTED F-06 p2 — the mechanical pre-push graph guard, three criteria added |
| T-167-s5 | PROMOTED F-06 p7 — the carrier, `Absorbs: T-167-s7`, retitled to cover both halves |
| T-140-s6 | PROMOTED F-06 p18, size raised S -> M, search file path corrected |
| T-167-s6 | PROMOTED F-06 p21, re-featured F-01 -> F-06, its own derive command corrected |
| T-025-s7 | PROMOTED F-04 p8 — SHAPE 1 RULED at the seat, shapes 2 and 3 declined with reasons |
| T-164-s1 | PROMOTED F-02 p20 — the probe question RULED (it is a read, not a probe) |
| T-164-s2 | PROMOTED F-02 p21 — fence corrected (`tools/e2e` added), stale live-fact corrected |
| T-167-s7 | ABSORBED into T-167-s5 |
| T-140-s5, T-140-s7 | ARCHIVED — discharged, verified here at this base |
| T-140-s4, T-169-s1, T-169-s2 | PARKED |

**AND ONE EXTRA DOCKET ITEM**: `T-031-s1` versus `T-112` — **RULED
SEQUENCED**, dated on both cards. Its reasoning is below.

## Preflight — every promotion, and why five of them are not green

`node scripts/brief.mjs --task T-NNN --preflight` from the e2e package,
all eight at `@ 51fa31c0964c`:

| card | exit | the parser rules | findings |
|---|---|---|---|
| T-140-s6 | 0 | startable | none |
| T-164-s1 | 0 | startable | none |
| T-167-s5 | 0 | startable | none |
| T-025-s7 | 1 | fenced | 1 — live lane |
| T-163-s4 | 1 | fenced | 1 — live lane |
| T-164-s2 | 1 | fenced | 2 — live lane |
| T-167-s6 | 1 | fenced | 2 — live lane |
| T-167-s8 | 1 | fenced | 2 — live lane |

**EVERY ONE OF THE EIGHT FINDINGS IS THE SAME LIVE LANE, `T-154-s2`,
which holds `.claude`, `tools/e2e` and `docs/CONVENTIONS.md`.** Zero
findings of any other class across all eight cards: no missing path, no
criterion naming a path a declared component owns, no unrunnable figure,
no unresolvable ref stamp, no stale blocker. Sitting #2 reported eleven
exit 0 and this one reports three; the difference is not card quality,
it is that sitting #2 sat at zero lanes and this one sat at four.

**AND THE FENCED EXIT IS NOT DISCHARGEABLE BY A CARD LINE — MEASURED,
NOT ASSUMED.** A `PREFLIGHT RULING (YYYY-MM-DD):` line was written on
`T-163-s4` and the tool answered *"ruling line 145 (2026-08-30)
discharges nothing at this ref"*. It is right: a ruling binds a finding
about the CARD, and a live lane is a fact about the clock that a card
cannot rule away. The line was withdrawn and replaced with prose, so
that the ruling vocabulary keeps meaning what it means. **The lesson for
the next sitting held over live lanes: a fenced preflight is the correct
result, and the thing to check is that the finding list contains NOTHING
ELSE.**

**TWO PREFLIGHT REFUSALS WERE CORRECTED RATHER THAN RULED.**

1. **`T-164-s2` held a live fact from its own filing.** The tool: *"STATED
   REASON NO LONGER HOLDS … `T-163-s3`'s live lane, and no live lane is
   on T-163-s3 now. A lane is a LIVE fact … so a card holding one from
   its filing is quoting a worktree that has gone."* Fixed in the card's
   opening paragraph, past tense, pointed at the triage note — because a
   ruling would have left the next reader believing a worktree exists.
2. **THE SITTING'S OWN WRITING CAUSED ONE, AND IT IS RECORDED BECAUSE IT
   IS THE MORE INSTRUCTIVE HALF.** The collider ruling written onto
   `T-112` named `app/src/lib/verdicts.ts` while explaining what
   `T-031-s1` does. That path is reserved by `app-shell`, which `T-112`
   does not carry, and the preflight refused: *"UNCOVERED CRITERION PATH
   … named in the acceptance criteria, exists at HEAD, and is reserved by
   the app-shell slug."* **A triage note is inside the card and the card
   is a fence claim** — an architect describing a neighbouring card's
   surfaces can widen the fence of the card being written on, silently.
   Rewritten to name the module by role and route the reader to
   `T-031-s1`. **The refusal is gone**, and `T-112`'s reported-uncovered
   count went 4 (pre-sitting) -> 6 (the bad note) -> 5: the one that
   remains is the string `tools/e2e` inside a QUOTATION of `T-031-s1`'s
   fence, which is under no component and is a class the tool never
   refuses on. Both numbers are stated because the difference between
   "reported" and "refused" is the whole distinction this class turns on.

## Four needle-checks that changed a disposition

1. **`T-140-s5` and `T-140-s7` are both DISCHARGED, and neither was taken
   on a stamp's word.** `T-140-s5`'s two TypeScript errors cannot fire:
   `command grep -c ROADMAP_SRC app/test/review-badge.test.tsx` is **0**
   and each of the file's three imports is used — closed at `51c3dfe`,
   whose subject is that very catch. `T-140-s7` predicted a D2 and the
   D2 never arrived: both files are claimed, with the one-line reasons
   the card asked for, at `C-05-app.md:45` and `C-12-map-pane.md:21`,
   in `da4d28b`'s own regen commit. The second is the good kind of
   discharge — a verifier's prediction pre-empted by the integrator
   before the run that would have reported it.
2. **`T-167-s7` IS LIVE AT THIS BASE AND IS READABLE FROM ONE FILE, which
   is why it stopped being a sibling and became half the carrier.** The
   committed graph is TRUNCATING right now:
   `perl -0777 -ne 'print $1 if /"stats"\s*:\s*(\{[^}]*\})/'
   docs/architecture/graph.json` answers `truncated_symbols: true,
   truncated_files: 2` at `files: 198, symbols: 2095`, and
   `wc -c docs/architecture/graph.json` is **1037788** against the
   crate's 1040000 — **2212 bytes left**. Read `check.rs` at this ref and
   the silence is structural: `budget_line`'s degradation sentence and
   `headroom_alarm`'s both live inside `used > budget` arms, so **under
   budget, in both functions, the word "dropped" cannot be printed at
   all.** The absorbed card inferred that from two regens; it is now a
   forty-line read.
3. **`T-167-s6`'s own derive command could not find the copy it was
   filed about.** It searched lib.rs for `MEAN of 15,751` or `15_751`.
   The crate spells it `mean single-commit growth of 15 751` — separator
   `0x20`, verified byte by byte. So a card written to join three copies
   of one statistic could enumerate only two, which is the card's own
   failure mode arriving one level down. That moved it off the
   decline arm of its own disposition hint and onto the promote arm.
4. **`T-169-s1`'s question is about the wrong slug.**
   `command grep -n 'board-truth' docs/architecture/components/*.md`
   answers **`C-05-app.md:17`** — the board's general DOM file is
   `app-shell`'s, inside the enumerated sixteen. So "should `app-board`'s
   expansion reach it" is not the question; the question is a RE-ROUTE
   between components, governed by the three-fixture DECLARING-A-COMPONENT
   bullet, and the one-file move is a two-slug lane. Parked with that
   derivation written down so the next reader starts from it.

## Three rulings taken at the seat, because a lane may not take them

- **`T-025-s7`: SHAPE 1. The fence is the blast radius and the ceremony
  row is read off `touches:`.** Not because it is cheapest: because the
  other two shapes break a property the method rests on.
  `method/tasks/TASK-FORMAT.md` opens by saying the story map, the
  dispatch order and the model assignment are pure functions of the
  frontmatter, and `T-104` put ceremony pricing in triage, before any
  diff exists. Shape 2 (read the row off the shipped paths the diff
  reaches) makes the row a judgement about work not yet done. Shape 3
  (exempt a slug's test paths) is the close one and is declined for a
  measured reason: **no component declares which of its paths are
  tests** — `C-14`'s `paths:` is a flat list of five — so shape 3 is a
  registry feature wearing a footnote's clothes. Recorded on the card
  with the consequence that `T-025-s5`, not `T-025-s6`, is the
  under-ceremonied one; no retrospective ceremony is owed.
- **`T-164-s1`: the lsof read is NOT a probe, so the guard is
  permitted.** `docs/STATE.md` already partitions the space at the one
  place it governs port 1420: *"read with `lsof -nP -iTCP:1420
  -sTCP:LISTEN` and nothing else — never bind-probe, never connect"*.
  T-164's criterion forbids what STATE forbids and cannot sensibly
  forbid the one form STATE names as permitted. The stake is not
  cosmetic: the launcher runs `npm ci`, which CONVENTIONS' T-052 bullet
  calls the one channel that CORRUPTS rather than interrupts, so a
  second run installs underneath the first run's live app.
- **`T-031-s1` versus `T-112`: SEQUENCED, NOT ABSORBED** — below, because
  it was the extra docket item.

## The extra docket item: T-112's last fence collider

**RULED SEQUENCED. `T-112` dispatches first; `T-031-s1` waits for its
landing.** Dated on both cards, with the full reasoning on `T-031-s1`
and a dispatcher-facing summary on `T-112`.

The overlap is real and is the one `T-112`'s own correction predicted
would survive the C-11 split: both cards declare `app-board`, and the
comparator calls it *the same entry* rather than an expansion accident.
Absorption was weighed and refused on three grounds, of which the second
decides it:

1. **The contracts are unrelated.** `T-112` assembles an executor brief
   from files and renders it in the panel. `T-031-s1` is the board's
   containment pass — a splitter anchored at column 0, two surfaces
   given `break-words`, a class pin replaced by a property assertion.
   One slug, no shared surface. The union is a grab-bag card.
2. **ABSORPTION WOULD MAKE `T-112` HARDER TO DISPATCH, WHICH INVERTS THE
   WHOLE POINT.** `T-112` fences `[app-dispatch, app-board]`;
   `T-031-s1` fences `[app-board, app-shell, tools/e2e]`. Folding hands
   `T-112` the `app-shell` train — exactly the coupling the C-11 split
   was performed to remove, the one that took `T-112`'s collision
   surface from 27 planned cards to 2. Clearing the last collider by
   widening the fence is not clearing it.
3. **`T-031-s1` is a whole card, not a residual** — two absorptions
   already, five criteria, and a fence derivation that cost a lane.

`T-112` goes first on value: F-04 p5 against F-02 p35, the named closing
act of its slice, with @human's genesis walk downstream. Nothing in
either card's CONTENT needs the other; only the fence serializes them.
**`blocked_by:` was deliberately NOT set on `T-031-s1`** — a fence
collision is not a content blocker, `brief.mjs --task` already answers
it live, and a false `blocked_by` would make the card undispatchable
even in a window where `T-112` is not running. The checkable condition
on the card is `T-112` is `done`.

## What the sitting deliberately did not do

- **It ruled nothing that is @human's.** `T-140-s4` (the graph size
  limit) and `T-169-s2` (the two-model stamp) are parked with @human's
  answer as the resurfacing condition, and this seat wrote no opinion
  about either answer. `T-140-s4`'s park carries one thing its filing
  did not: the graph is truncating NOW, so the value question is live
  rather than theoretical — which is a reason to route it faster, not a
  licence to answer it.
- **It did not re-open `T-169-s1`'s registry question in the abstract.**
  The honest price of paying that placement debt today is a two-slug
  lane plus a three-fixture reconciliation for zero behaviour change,
  bought while `app-board` is held. It waits for a lane that actually
  needs the file.
- **It did not touch the version-planning room.** Nothing in the
  fourteen traces to the charter; every card is a lane-filed defect or
  finding, so all fourteen triage normally under the standing rule and
  none needed a version ruling.
- **It asked no graph.** The sitting wrote `docs/tasks/**` and this file
  only, and `docs/` is excluded from the walk — but the rule is ASK IT,
  never predict, and this seat did not. It did READ the committed graph
  as a document (the stats blob above), which is not the same act.
- **`docs/CAPABILITIES.md` is untouched**: no spec file moved, so no
  behaviour sentence moved.

## Owed after this record

- **THE INTEGRATOR — `npm run lint:docs` WAS NOT RUN HERE**, and neither
  was any suite: this seat runs e2e package SCRIPTS only, and the docs
  gate is suite-adjacent. **Expect it to red on this very record**, the
  same by-construction hand-off sitting #2 documented: the gate refuses
  while a checkpoint record's last commit is newer than `docs/STATE.md`'s,
  this seat is forbidden `docs/STATE.md`, so regenerating STATE against
  this record clears it.
- **THE INTEGRATOR — THE E2E BATTERY IS RED AT THIS BASE AND IT IS NOT
  THIS SITTING'S DOING.** `tests/session-economics.spec.ts`'s positive
  control spawns `brief.mjs --task T-112` and asserts exit 0; at
  `51fa31c` that exits **1**, because `T-143-s3` holds `app-board` and
  the brief correctly refuses. The exit was measured here, unpiped; the
  SUITE was not run at this seat, so this record states the cause and
  refuses to predict a pass count. When that body reds it is `T-163-s4`
  — promoted to F-06 p1 for exactly this reason — and it is NOT a lane's
  diff. Its filing measured the same shape at `0f41aef` as 1 failed /
  319 passed, exit 1, against a different colliding card.
- **@human — two items, unchanged in substance and both routed rather
  than nudged**: the graph size-limit ruling (`T-140-s4`) and the
  one-word two-model-stamp answer (`T-169-s2`). Both parked with the
  answer as the condition.
- **THE NEXT DISPATCHER — four of the eight promotions contend.**
  `T-163-s4`, `T-167-s8`, `T-167-s6` and `T-164-s2` all reserve the e2e
  package or reach into it, and `T-164-s2` additionally overlaps the
  already-planned `T-156-s5` on two entries — the two want adjacent
  sentences in one section of one file, and taking both in a single lane
  is worth considering. Recorded so the choice is deliberate rather than
  discovered at a refusal.

## Metrics (ADR-020)

Cards dispositioned: 14, plus one extra docket ruling on two live cards.
Rework cycles: 0. Preflight refusals of a class other than a live lane:
**2 of 8, both corrected in the card rather than ruled** — and one of
the two was caused by this sitting's own prose, which is recorded above
rather than quietly fixed. Rulings taken at the seat: 3. Rulings
deliberately not taken: 2, both @human's. Lanes before and after: FOUR,
untouched — no lane's fence includes any file this sitting wrote, and
`T-159-s1`'s fence (fourteen named `docs/tasks/` files) was checked
against every card here and shares none. Tokens and wall clock: NOT
DERIVABLE at this seat — no meter was read, and this record refuses to
invent them rather than print a confident wrong figure.
