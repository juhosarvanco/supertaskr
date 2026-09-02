---
id: T-230-s7
title: QUOTED RUNS THAT SPAN THE 70-COLUMN HARD WRAP ARE INVISIBLE TO THE UNMARKED CENSUS — unmarkedQuotes decides nearness over the paragraph but extracts needles line by line with a class that stops at the newline, so 2,386 runs on 364 of 448 cards are never seen, 6.5 times the floor drop T-230-s5 counted
feature: F-06
milestone: 4
priority: 2
size: M
status: verifying
suggested_by: verifier claude-opus-5@subagent @T-230-s3-verify, phase 1 at f5bad14, 2026-09-02
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**THE CENSUS SEES A QUOTE ONLY WHEN IT FITS ON ONE LINE.** `unmarkedQuotes`
in tools/e2e/scripts/brief.mjs decides `nearPath` over the whole paragraph
and then extracts the quoted needles LINE BY LINE with `QUOTED_RUN`, whose
character class is `[^"\n]+`. Every card in docs/tasks/ is hard-wrapped at
seventy columns, so a quoted sentence that crosses a line break — the
ordinary shape of a quoted acceptance criterion — is two half-runs to the
extractor and neither opens and closes on its line. Measured at f5bad14
by the T-230-s3 verifier, controls printed first: **2,386 quoted runs
across 364 of 448 cards cross a wrap**, against the 369 runs on 140 cards
that T-230-s5 found dropped below the four-character floor. T-230-s3's
own card is an instance: lines 44–45, where it quotes T-230's first
acceptance criterion to make its case, are invisible to the arm that
card is about.

The consequence is a false-negative census, and a false-negative census
is the wrong kind: T-230 exists because a card's quotation of a
document it did not read is the claim most worth catching, and the
longer the quotation the likelier it wraps.

## The construction

Extract needles from the PARAGRAPH the nearness decision already
reads, with the wrap folded — join the paragraph's lines on a single
space before matching, the way the parser folds a card's own frontmatter
title, and let the class be `[^"]+` bounded by the paragraph. A run that
spans two paragraphs is not a quotation and stays unseen; say so in the
`cannot` line, without a digit (the `note()` path throws on one). The
floor and the marker rules are unchanged; only what reaches them changes.

## Acceptance criteria

- WHEN a card paragraph carries a quoted run that crosses a line break
  THE unmarked census SHALL see it as ONE run, and a body SHALL plant
  such a run in a fixture card and show it counted, with the same card
  minus the wrap as the control.
- WHEN the same run is marked with the card-claim marker THE census
  SHALL treat it exactly as it treats a single-line marked run.
- THE preflight of the live board SHALL print how many runs the fold
  newly reaches, once, at the lane's tip, beside the T-230-s5 floor
  count, so the record carries both figures.
- A run that spans two paragraphs SHALL stay unseen and the `cannot`
  line SHALL say so in words.
- Verification: headless.
- **Guard-class: `review: independent`, set at filing.**

## Read beside

T-230 (the arm), T-230-s3 (the title and frontmatter gap, whose lane
this filing is blocked behind because both edit the same reader),
T-230-s5 (the floor count), and the T-230-s3 verifier's phase-1 ground
truth in the sitting's record.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 2, size M, fence corrected

The architect seat, at the stamp of T-230-s3's merge (6ccfda4). The
fence this card was filed with named tools/e2e/scripts/brief.mjs, which
carries zero occurrences of the reader the card is about; the reader
lives in tools/e2e/scripts/card-preflight.mjs (T-230-s10, the
executor's finding, absorbed below). T-230-s3 is done, so the blocker is
gone. The figure in the title is estimator-dependent: the verifier's
estimator reads 2,386 runs on 364 cards at f5bad14 and at 80c36f8, the
executor's reads 2,345 on 363 — the lane SHALL settle on one estimator,
print both controls, and state the figure at its own tip. Size M because
four residuals of the same module ride this lane below; one verifier,
one bounded file pair.

## Absorbs: T-230-s10 (2026-09-02)

The fence correction above is that card's whole ask; its lesson — a
fence that names a real file and the wrong one is the case no guard
catches, and the preflight does not warn — stays here as the reason a
dispatcher greps the fence for the symbol the card names before the
stamp.

## Absorbs: T-230-s8 (2026-09-02)

The claim-class disclosure body asserts `c.checks`, `c.refuses` and
`c.cannot` read from `CLAIM_CLASSES` itself, so five of six classes
cannot fail it (mutants M10 and M11 of T-230-s3's drill, and the
verifier's D2, all survived on exactly this). The lane SHALL pin each
class's three strings as literals, and a one-capital mutant per class
SHALL red the body.

## Absorbs: T-230-s9 (2026-09-02)

Six author-text interpolations in the quotes arm's report lines are still
unescaped (T-230-s4 named one site; there are seven; one is fixed). The
lane SHALL escape the six DISPLAY sites and SHALL leave every `raise()`
SUBJECT raw, because `dischargedBy` matches rulings against the subject —
with a body proving a plain ruling still discharges a plain subject after
the change.

## Absorbs: T-230-s11 (2026-09-02)

The new scalar scope reads values through `frontmatterFields`, whose
`stripInlineComment` cuts a scalar at the first space-hash, so a quoted
assertion after one vanishes with no sighting and no count. The lane
SHALL read the raw scalar for the quotes arm (a local read in
card-preflight.mjs; dispatch-brief.mjs is outside this fence and stays
as it is), with a planted card carrying a space-hash inside a quoted
title as the control.

## Implementation notes — 2026-09-02, executor claude-opus-5@subagent

Built in `/Users/ujju/Projects/nputer-T-230-s7` on
`task/T-230-s7-quote-arm-four-residuals`, base `763548cc6139` (the
dispatch stamp), code tip `70cd4261abf85cbfd9724f0ad0c77c628eea29c4`.
Every figure below is at that code tip unless it names another ref. The
fence held: exactly `tools/e2e/scripts/card-preflight.mjs` and
`tools/e2e/tests/card-preflight.spec.ts`, plus this card.

### What was written, per absorbed card

**T-230-s7, the fold.** `unmarkedQuotes` decided nearness over the
paragraph and then extracted line by line, so the class's newline bound
was doing the work. The paragraph's non-marker lines are now joined on a
SINGLE SPACE and the needle matched over that; each run keeps the line it
OPENS on, carried through the fold by an offset table, so a listing still
names a place in the file rather than the top of a paragraph. A MARKER
LINE BREAKS THE FOLD rather than joining it — a marker's needle belongs
to the marked half, and folding through one would both leak that needle
into the unmarked census and pair quotes either side of it that nobody
wrote as a pair. `QUOTED_RUN` is now `[^"]+` / `[^”]+`, per the card's
construction; the honest note about that is in the drill below.

**T-230-s10, the fence.** The correction was the triage's and is already
on this card; nothing was built for it. Its lesson is recorded in the
module nowhere, because it is a dispatcher's habit and not a code fact.

**T-230-s8, the disclosure.** All six claim classes' three strings are
now pinned as literals in `PINNED_CLAIM_CLASSES` beside
`PINNED_NOT_A_CLAIM_CLASS`, asserted with `toEqual` against the constant
AND printed-text `toContain` against the literals. The parametrised loop
stays, reading the constant, so the two halves answer different
questions. Measured: a one-capital mutant on `paths.checks` — a class the
old four literals did not cover — now reds (M14).

**T-230-s9, the six display sites.** Escaped: the CHECKED and HELD
record, the QUOTED CLAIM NOT IN FILE record, that finding's own message
(both the needle and the source), the marker sighting's collapsed text,
and both NOT CHECKED listings. Left RAW: every `raise()` SUBJECT — the
two in this arm at the false-claim and uncheckable sites — because
`dischargedBy` matches a dated ruling against exactly that string. The
positive control is in `a quoted-claim finding is dischargeable by a
dated ruling naming its quote`, extended with the probe that actually
DISCRIMINATES: a ruling naming the subject BARE. A ruling that writes the
needle in quotes discharges either way, because an escaped subject is
that same string with quotes round it; only the bare one separates them,
and M12 reds it.

**T-230-s11, the raw scalar.** `frontmatterScalars` still takes its FIELD
SET from `frontmatterFields` — which keys exist, and which are lists
rather than scalars — and now reads the scalar's own TEXT off the key's
line through `FRONTMATTER_SCALAR`. `stripInlineComment` cuts at the first
space-hash without knowing about quotes, so a hash inside a quoted title
truncated the value mid-needle and the assertion vanished with no
listing, no sighting and no floor count. `dispatch-brief.mjs` is
untouched, as the card requires. The cost is that a genuine trailing YAML
comment joins the scanned text: the conservative direction, and
`unwrapScalar`'s own.

### The settled estimator, both controls, and the figure at my tip

**THE ESTIMATOR IS THE PRODUCTION FOLD, INSTRUMENTED**, and it is settled
because it is not an estimator: the same units (paragraph, marker lines
breaking it), the same class, joined on a NEWLINE instead of a space —
which `collapse` maps to the same run text — so a match that crosses a
wrap is exactly a match containing a newline. It reproduces the
dispatching seat's own reading at my base (2,561 across 386) to the unit.
Board: 473 flat cards at `70cd426`.

- CONTROL A, the LINE-scoped reading (the module at `763548c`, run over
  this board): **5,973** unmarked runs — 5,928 body, 45 frontmatter —
  across **422** of 473 cards, **388** below the floor.
- CONTROL B, the FOLDED reading (the module at `70cd426`, same board):
  **8,421** runs — 8,376 body, 45 frontmatter — across **451** of 473
  cards, **356** below the floor.
- **THE FIGURE: 2,561 quoted runs cross the hard wrap, on 386 of 473
  cards, at `70cd426`** — every one of them above the floor, because a
  run that spans a wrap is long by construction. The arithmetic delta
  between the two controls is +2,448; the two differ because the fold
  also re-pairs within a line, which the next paragraph counts.
- **THE T-230-s5 FLOOR COUNT, BESIDE IT: 356 at `70cd426`**, against
  **388** by the line-scoped reading. The floor count FELL by 32 because
  two short halves of one wrapped run are now one long run.

**THE CARD'S TWO PRIOR FIGURES ARE NEITHER WRONG NOR THIS ONE.** 2,386
across 364 at `f5bad14` and 2,345 across 363 at `80c36f8` were two
approximations of a question the module could not then answer; the
dispatching seat re-derived its own estimator at `f5bad14` as 2,427
across 364, which reproduces the card's CARD count exactly and sits
within about two percent of its run count. The board grew from 448 flat
cards to 473 between those refs and this one, which is most of the
difference in the card counts.

**THE FOLD LOSES RUNS AND THE `cannot` LINE NOW SAYS SO.** Joining a
paragraph lets an odd quote character reach across what used to be a line
boundary, so a run the line-scoped reading listed can be swallowed into a
longer one: **233 runs across 127 cards at `70cd426`** (the dispatching
seat read 234 across 127 at `763548c`; the one-run difference is the
line-scoped replica's, not the board's). No acceptance criterion mentions
it — it is a consequence of the card's own construction — so it is
disclosed in the class's `cannot` line, in words and with no digit, and
pinned by a literal in the disclosure body. The fold reaches far more
than it drops, and what it drops is not none.

**THE CANARY, AND IT IS THIS CARD.** At `70cd426` — that is, this file
as it stood BEFORE these notes were appended — it carried exactly two `"`
characters, at lines 22 and 43, in DIFFERENT paragraphs. Its own
preflight at `70cd426` prints `quoted and NOT marked, beside a path this
card names: 0`, `naming no source at all: 0`, `below the quote floor: 0`,
exit 0 — so the fourth criterion is measured on the LIVE board and not
only in a fixture: a fold that joined across paragraphs would make those
non-zero.

### Every command, in order, with its exit read from `$?`

    lib/parser: dist present at the cut, no install needed          (verified)
    app: npm ci                                                     exit 0
    tools/e2e: npm ci                                               exit 0
    tools/e2e: npx playwright test tests/card-preflight.spec.ts     exit 1  (41 passed, 1 failed — the disclosure literal this card moves)
    tools/e2e: npm run typecheck                                    exit 0
    tools/e2e: npx playwright test tests/card-preflight.spec.ts     exit 0  (47 passed)
    git commit (code + spec), later amended twice                   exit 0
    node census-T-230-s7.mjs <base module> <board>                  exit 0
    node census-T-230-s7.mjs <tip module> <board>                   exit 0
    node estimator-T-230-s7.mjs <tip module> <board>                exit 0
    tools/e2e: node scripts/brief.mjs --preflight --task T-230-s7    exit 0
    drill worktree at 70cd426: parser npm ci + build                exit 0
    drill worktree: app npm ci, tools/e2e npm ci                    exit 0
    drill baseline: card-preflight + git-fixture                    exit 0  (51 passed)
    drill: eighteen mutants, one at a time                          (table below)
    drill baseline, after the drill                                 exit 0  (51 passed)
    app: npm run build                                              exit 0
    gate-run.mjs parser                                             exit 0  bodies=363   GREEN
    gate-run.mjs app                                                exit 0  bodies=1141  GREEN
    gate-run.mjs rust                                               exit 0  bodies=639   GREEN
    gate-run.mjs e2e                                                exit 0  bodies=602   GREEN
    app/src-tauri: cargo run -p nputer-index -- index --check       exit 0  CURRENT
    tools/e2e: npm run capabilities:check                           exit 1  STALE

No suite red was inherited: the four legs are GREEN at `70cd426` with no
attribution owed. The `session-economics` bodies that red in a lane cut
before a sibling landed did not fire here, because this lane's base IS
the newest dispatch stamp.

**THE CENSUS IS STALE AND THAT IS THE INTEGRATOR'S** (T-230-s3's
verifier, correction 1): `capabilities:check` exits 1, committed 50,248
bytes against a fresh 50,632, by the five bodies this lane adds
(card-preflight.spec.ts goes 42 → 47). The fence leaves
docs/CAPABILITIES.md read-only, so **the integrator regenerates it with
`npm run capabilities` IN THE MERGE COMMIT**; forgetting it reds CI's
census-currency step on that push.

### Poison drill — eighteen mutants, seventeen kills, one disclosed survivor

Run in a detached worktree at `/private/tmp/nd-T-230-s7`, stem derived
from the lane, cut at the code tip `70cd426`. One side only, never a
literal the two share; every mutation read back with `git diff --stat`
before the suite ran; every restoration by `git restore
--source=70cd426 --staged --worktree` proved by sha256 with an empty
`git diff 70cd426 -- <path>` as its companion. Suites:
`card-preflight.spec.ts` + `git-fixture.spec.ts`, the two consumers.
Baseline in that tree, before and after: **51 passed, exit 0**.

| mutant | site | bodies red |
|---|---|---|
| M1 the fold reverted to line-by-line extraction | `unmarkedQuotes` flush | 3 |
| M2 the joiner emptied — lines glued with no space | the fold | 3 |
| M3 every run dated at the top of its unit | the offset table | 1 |
| M4 the marker line folded in with the prose | the fold's marker branch | 2 |
| M5 the marker line skipped without ending the unit | the fold's marker branch | 1 |
| M6 the needle class bounded by the LINE again | `QUOTED_RUN` | **0 — SURVIVED** |
| M7 both NOT CHECKED listings unescaped | the two report lines | 1 |
| M8 the CHECKED and HELD record unescaped | the report line | 1 |
| M9 the QUOTED CLAIM NOT IN FILE record unescaped | the report line | 1 |
| M10 the finding message's own pair unescaped | the `raise()` MESSAGE | 2 |
| M11 the marker sighting unescaped | the report line | 1 |
| M12 the `raise()` SUBJECT escaped | the `raise()` SUBJECT | 1 |
| M13 the scalar read back through the comment strip | `frontmatterScalars` | 1 |
| M14 one capital in `paths.checks` (DATA) | the string constant | 1 |
| M15 one capital in the `quotes` fold clause (DATA) | the string constant | 1 |
| M16 the planted wrapped quote un-wrapped (DATA, fixture) | the spec's plant | 1 |
| M17 the planted space-hash removed (DATA, fixture) | the spec's plant | 1 |
| M18 the blank line stops ending the unit | `unmarkedQuotes` loop | 5 |

Restoration hashes at `70cd426`, every mutant and both baselines:
`c3d13b871a21e2fd131b03808157fd437c424fb426a2d80b073f2f6fe08d127c`
for `tools/e2e/scripts/card-preflight.mjs`, and
`523f8fc0497796903f74470fc2ab8ab98ae192ca5ea8bef533add810e5214bfc`
for `tools/e2e/tests/card-preflight.spec.ts`.

**KILL SETS, BY BODY, OVER THE BODIES THIS LANE ADDED OR CHANGED.** The
wrap body `{M1,M2,M3,M16}`; the marked-twin `{M1,M2,M4,M5}`; the
paragraph-boundary body `{M1,M2,M18}`; the escape body
`{M7,M8,M9,M10,M11,M18}`; the discharge body `{M10,M12}`; the raw-scalar
body `{M13,M17}`; the disclosure body `{M14,M15}`. **No one of those
contains another**, so each is load-bearing. It did not start that way:
before M18 the paragraph-boundary body's set was `{M1,M2}`, a subset of
two others, and the mutant that isolates it — deleting the blank-line
flush so a paragraph never ends — was added for exactly that reason. Two
PRE-EXISTING bodies (`T-210's instance is REPORTED` and `a quoted run
below the floor is COUNTED`) come out at `{M18}` alone; that is an
artifact of a wide mutant against a mutant set aimed at this diff, and
their own properties are pinned by T-230-s3's drill rather than by this
one.

**M6 SURVIVED AND IT IS STRUCTURAL RATHER THAN A HOLE.** The card's
construction asks for `[^"]+` and the class was changed to it, but on a
FOLDED unit the two classes cannot be told apart — the caller removed
every newline before the match — so reverting the class alone changes
nothing observable and the whole suite stays green. The FOLD is the
property, and M1, M2 and M18 kill it three different ways. The change is
kept because the card names it and because a newline bound on a unit
that can no longer contain one is a second answer to a settled question;
it is reported here rather than passed off as a kill, per the rule that a
body which cannot red is the finding.

### The standing gates, derived on the merge forecast

`git merge-tree --write-tree main HEAD` exits **0** — a clean forecast —
and `git diff --name-only main <tree>` names **3** paths: this card,
`tools/e2e/scripts/card-preflight.mjs` and
`tools/e2e/tests/card-preflight.spec.ts`. The forecast is what the gates
are derived on rather than the branch tip, because a lane's last commit
is its notes and the documentation gate is the one it is guaranteed to
feed after answering for it; the path SET does not move when that commit
lands, so these decisions hold for the tip as well.

- **GRAPH REGEN — FIRES**, on `tools/e2e/tests/card-preflight.spec.ts`
  (`*.ts` outside docs/). The regen is a no-op by construction: the walk
  excludes `tools/`, so a diff confined there matches the trigger and
  cannot move the graph. ASKED rather than predicted —
  `cargo run -p nputer-index -- index --check --root ../..` exits **0**,
  CURRENT, 200 files / 2,504 symbols / 2,395 edges.
- **BOOT GATE — NOT OWED**: none of the 3 forecast paths is under
  `app/src-tauri/**` or `app/src/**`, and neither manifest moves.
- **DOCS GATE — FIRES**, on 1 path under docs/ that code suites read.
  `docs-gate.mjs` on that literal path exits **1** and names three
  suites: `npm test from app/`, `npm test from tools/e2e/`, and
  `npx vitest run from lib/parser/` — twelve readers between them. All
  three were run at the tip carrying this card's change, GREEN. Its own
  two checks also pass: every live card's frontmatter parses with a legal
  status, and the four gated governing budgets hold.
- **METHOD EVAL GATE — NOT OWED**: no forecast path is under `method/**`.

`.nputerignore` and the four walks are why GRAPH REGEN's trigger is wider
than its effect; that is the bullet's own worked example and this diff is
another instance of it.

### What the verifier should attack hardest

- **THE FOLD'S LOSS IS THE HALF NOBODY ASKED FOR.** 233 runs across 127
  cards stop being listed on their own. Re-derive it at your own ref; the
  script is a scratch reproduction of the production fold and its only
  addition is a multiset difference against the line-scoped reading.
- **THE MARKER SEGMENT RULE IS AN INVENTION OF THIS LANE.** The card says
  a marker's needle is the marked half's; it does not say a marker line
  ENDS a unit. Both M4 and M5 red, so the choice is pinned, but it is a
  choice: a reader that merely skipped the line would fold across it.
- **`cardLines` WAS NOT TOUCHED**, and the T-230-s3 precedent is why:
  seven consumers across five claim classes plus the ruling reader read
  through it. Every change here is at a call site this card names.
- **THE RAW SCALAR SCANS A REAL YAML COMMENT.** Zero frontmatter runs
  moved on the live board (45 at both controls), so it costs nothing
  today, but a card that writes ` # a note` after a quoted title will now
  have that comment scanned. Conservative on purpose; say so if you
  disagree with the direction.
- **NO `cannot` STRING MAY CARRY A DIGIT** — `note()` throws on one, and
  the disclosure body now asserts it as a rule as well.

### Filed, not built

Nothing. Every ask on this card and on the four it absorbs is inside the
fence and was built; the one thing this lane deliberately did not do is
change `dispatch-brief.mjs`'s `stripInlineComment`, which T-230-s11 rules
out by name.

## Fix pass — 2026-09-02, executor claude-opus-5@subagent

Against V-T-230-s7's REJECTED verdict (its own copy is on the bench
`/Users/ujju/Projects/nputer-V-T-230-s7`, commit `5b2c251`). One finding,
its sealed attack A4; the verdict is upheld in full and nothing else was
reopened.

**THE FINDING, IN THE VERIFIER'S WORDS.** The fold ends a unit at a
`CARD CLAIM` LINE, which is the right idea, but a marker's payload wraps
like everything else in a seventy-column document, and the CONTINUATION
line of a wrapped marker is not itself a marker line: it joins the NEXT
unit carrying the needle's orphan closing quote, and under `[^"]+` that
orphan pairs with the next run's OPENING quote, so the real unmarked run
is swallowed and a run nobody wrote is listed in its place. It is the
second acceptance criterion's own arrangement, and the direction this
card calls the wrong kind — a false-negative census AND a fabricated
listing, on a line a dispatcher decides on. The module's own comment had
promised exactly this containment and the branch reached one line short
of it.

**REPRODUCED FIRST, AT MY OWN TIP.** Driving the module's own export over
the verifier's fixture, `unmarkedQuotes` returns
`a sentence nobody marked at all` with the base module and
`And the card also asserts` at `70cd426`. One difference from the
verdict's transcript, stated because a figure is a figure: my reading
dates the fabricated run at line **7** — the orphan quote's own line —
where the verdict prints line 8. The text, which is the finding, is
identical.

**THE REPAIR IS ONE BRANCH AND ONE HELPER.** `markerEnd` is the
boundary: the marked segment grows while the marker's own quoting is
open — an odd number of straight quotes, or a typographic pair still
unclosed — and stops the moment it closes; `flush()` skips to that index
instead of to the marker's own line. A marker whose quoting NEVER closes
inside its paragraph falls back to consuming only its own line, exactly
as before, because swallowing the rest of the paragraph would drop real
assertions in silence — the failure this whole class exists against.
Backticks are deliberately not balanced: a backticked needle is a needle
to `MARKED_NEEDLE` and not to `QUOTED_RUN`, so an orphan backtick cannot
corrupt this census.

**THE BODY IS THE VERIFIER'S FIXTURE**, planted as `a marker whose NEEDLE
wraps ends its own unit, and the run after it survives`: the wrapped
marker with an ordinary unmarked assertion after it in the same
paragraph, the plant itself guarded (the marker line must carry an ODD
number of quotes), the single-line twin asserted equal — the criterion's
*exactly as* in its own words — the boundary driven directly at four
edges including the malformed fallback, and the whole arm asserted
through a fixture world.

**RED BEFORE, GREEN AFTER.** Drill at `17711d5` in a detached worktree
`/private/tmp/nd-T-230-s7`, module mutated ONE SIDE ONLY, the landing
read from `git diff --stat` rather than from the mutator: **M19 — the
marker segment ends at the LINE again** kills exactly this body and
nothing else, `1 failed / 51 passed`. Baseline in that tree before and
after the drill: **52 passed, exit 0**. Restored by `git restore
--source=17711d5 --staged --worktree`, proved by sha256
`e816eba056d843dba881fc6fb82ab3c04b40bd04fb438327dbd14d4c93411374` for
the module and
`a6f6e1bb5f99f77e2492ad114f4903f2b8a85e337c12d203960bfc7ebb2ebb27` for
the spec, with an empty per-path diff against `17711d5` as companion.
The body's kill set is `{M19}`; no other body's contains it and it
contains no other's. The worktree is removed.

**EVERY BOARD FIGURE IS UNCHANGED BY THE REPAIR, AND THE REASON IS
MEASURED HERE RATHER THAN QUOTED.** At `17711d5` over the same 473 flat
cards: 8,421 runs (8,376 body + 45 frontmatter) across 451 cards, 356
below the floor, 2,561 wrap-spanning across 386, 233 lost to re-pairing
across 127 — every one identical to the pre-fix reading, and **zero
cards moved**. The cause is that **the live board carries 0 marked
claims across 473 flat cards** (3 marker-shaped sightings, all in blocks
or frontmatter), re-derived at this tip rather than taken from the
verdict. Nothing on the board was wrong today; that is a latency and not
a defence, for a guard whose whole subject is the marker. One
consequence worth stating: the scratch estimator that re-implements the
fold now lags production by this one branch, and it agrees only because
that marker count is zero.

**COMMANDS, in order, with exits read from `$?`:** reproduction 0 · repair
written, diff read back · `npm run typecheck` 0 · spec 1 (the plant
guard, mis-written on its first draft) · guard corrected, `npm run
typecheck` 0 · spec 0 (**48 passed**, was 47) · census at the fix 0 ·
estimator at the fix 0 · live marker census 0 · commit 0 · drill setup
(parser ci+build, app ci, e2e ci) 0 · drill baseline 0 (52) · M19 ·
drill baseline after 0 (52) · worktree removed 0. The four-suite battery
and the standing gates at the fix-pass tip are in the report; the gate
DECISIONS do not move, because the merge forecast names the same three
paths it named before.
