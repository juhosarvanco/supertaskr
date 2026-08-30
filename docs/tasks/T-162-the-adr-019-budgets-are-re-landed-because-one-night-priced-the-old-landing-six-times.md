---
id: T-162
title: The ADR-019 budgets are RE-LANDED — ROADMAP and CONVENTIONS compacted on their own terms and warn/fail re-derived from the new landing, because one night priced the old landing six times
feature: F-04
milestone: 4
priority: 1
size: M
status: building
blocked_by: []
touches: [docs/ROADMAP.md, docs/CONVENTIONS.md, docs/decisions, tools/e2e]
suggested_by: "@human ruling (2026-08-30, rulings sitting): full re-landing pass approved over raise-the-lines-only and keep-absorbing"
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

**FILED AT @HUMAN'S RULING (2026-08-30), planned at filing** — the
T-160 precedent for a card that exists because a decision landed.

## The measurement that forced the decision

`npm run health` (tools/e2e/) reads both bands; derive at your own
ref, never quote this paragraph. At filing: ROADMAP BREACHED (headroom
under 2% of the warn line, re-breached SIX times in one night of
one-sentence-per-merge growth, an absorption trim paid each time) and
CONVENTIONS drifting with the seat HELD — `T-156-s1` and every further
CONVENTIONS lane parked on the runway. The landed figures are too
tight for the measured merge velocity; nibbling at 3am was the
alternative @human declined.

## Acceptance criteria

- THE lane SHALL compact docs/ROADMAP.md and docs/CONVENTIONS.md each
  on its OWN terms under ADR-019's law: RECORD-shaped sentences move
  to the records that keep them (cards, checkpoint records, room
  resolutions — cited, not deleted); RULE and TRUTH sentences stay,
  reworded only where a shorter sentence says the same thing. A hazard
  is never deleted to fit. The 2026-08-27 compaction record is the
  worked precedent (docs/checkpoints/2026-08-27-adr019-compaction.md).
- CONVENTIONS sentences are PINNED by readers — brief, dispatch-order,
  docs-input-gate, lane-fence, range-rule, workflow-parity among them
  (the census: `npm run lint:docs` reader rows). THE lane SHALL run
  the reader suites and keep every pin green; where a pinned sentence
  must move or shrink, the pin moves in the same commit, never
  loosened to a weaker assertion.
- WHEN both files are landed THE lane SHALL re-derive `DOC_BUDGETS`
  (tools/e2e/scripts/docs-scan.mjs) by ADR-019's own formula — warn at
  landed size × 1.25, fail at landed size × 1.5 — for the two re-landed
  files ONLY; the other budgets keep their landings.
- THE lane SHALL write the record of execution as a dated addendum in
  docs/decisions/019-governing-docs-rules-truths-records.md naming
  both new landings with their derivation, plus its own checkpoint
  record — the 2026-08-27 form.
- THE health bands SHALL read INSIDE for both docs-headroom bands
  after the landing (`npm run health`), and the RE-BREACH price is
  stated: if the new ROADMAP landing buys less than the old landing's
  measured one-night growth (~six sentences), the card has not
  answered the velocity problem and SHALL say so rather than land a
  number that fails next week.
- THE DOCS GATE fires on this diff; run what it owes, exits unpiped.

## Fence note at filing

`touches:` carries the two governing docs, docs/decisions for the
addendum, and tools/e2e because DOC_BUDGETS and the pins live there.
This fence collides with every e2e-seat card — dispatch ALONE on the
e2e seat, and `T-160-s4`/`T-156-s1` queue behind it. `T-156-s1`
unblocks the moment this lands; it is the first consumer of the new
runway.

## Implementation notes

Lane `task/T-162-adr019-relanding`, worktree
`/Users/ujju/Projects/nputer-T-162`, cut from `25850bd`. Four commits:
`c0b865b` ROADMAP, `5b85715` CONVENTIONS, `fa1d027` budgets + addendum
+ `T-162-s1`, plus `T-162-s2`.

### The two landings, with their derivations

    document             before    landed     warn      fail
    docs/ROADMAP.md      10,315     9,801    12,252    14,702
    docs/CONVENTIONS.md 134,167   131,514   164,393   197,271

`git cat-file -s c0b865b:docs/ROADMAP.md` = 9801 and
`git cat-file -s 5b85715:docs/CONVENTIONS.md` = 131514; before-figures
are the same command at `25850bd`. `warn = ceil(landed × 1.25)`,
`fail = ceil(landed × 1.5)` — ADR-019 §Budgets' formula at the rounding
the 2026-08-27 and 2026-08-29 landings used (6772×1.25 = 8465 exact,
8399×1.25 = 10498.75 → 10499, 110342×1.25 = 137927.5 → 137928: ceil,
not round). Written into `DOC_BUDGETS`
(tools/e2e/scripts/docs-scan.mjs) for those two entries ONLY; STATE and
ARCHITECTURE keep their 2026-08-27 landings untouched.

### What moved, and what did not

ROADMAP (−514, −5.0%): three days of per-merge chronicle to the
checkpoint records that already hold it; the method version stopped
being quoted where CONVENTIONS' first-gotcha stamp is the keeper; F-03's
second copy of the real-model gate replaced by a pointer to milestone 3,
which states it once; the milestone-4 tally replaced by the derivation
the same paragraph already ordered. Kept whole: the graph-budget
derive-never-quote rule, milestone 3's gate, milestone 4's
derive-the-progress command, the six `- F-NN:` rows the parser pins in
order and F-02's name and `story map` description.

CONVENTIONS (−2,653, −2.0%): the per-release method changelog to T-159's
card and checkpoint (the `currently v0.1.8` stamp line kit.rs reads is
untouched and still the only line carrying `formats are
version-bumped`); the POISON DRILL bullet's transcribed drill
measurements to T-013, T-092, T-130-s1, T-145-s3, T-153-s5 and
T-111-s10; the xargs BSD/GNU narrative to T-153-s6; the token-lint
replaced-row story to T-058 and T-080; T-090's retraction message to
T-090. Every rule, tell, remedy, hazard and poison-shape ordinal
FIVE..ELEVEN is whole, the `- POISON DRILL (` opener and the
`namedDisciplines` name survive, and the RANGE RULE bullet was not
touched at all because range-rule.mjs parses it sentence by sentence.
The DOCS GATE bullet's parsed recipe and exit-code matrix are byte-exact.

**NO PIN WAS MOVED AND NONE WAS LOOSENED**, because no pinned sentence
had to move: the reader suites were run after every write and never
redded. brief, dispatch-order, range-rule, workflow-parity,
docs-input-gate: **127 passed, exit 0**, run mid-pass; all five green
again in the full lane run.

### The correction the pass found

CONVENTIONS' DOCS GATE bullet described the PRE-T-085 site rule — "a
path-forming call in the file whose first literal segment is `docs` AND
whose base expression EVALUATES TO THE REPOSITORY ROOT — both halves
load-bearing". T-085 subsumed both halves under ONE containment test
(docs-SHAPED literal, RESOLVED against whatever its base evaluates to,
kept when it lands inside `<root>/docs`) precisely so a package-relative
docs read holding no root is seen — and one is live in
`app/src-tauri/tests/agent_runner.rs`, which the gate's own census
prints as a `climb` row. Nothing compares the bullet to
`docs-scan.mjs`, so the two implementations disagreed unnoticed: T-057's
rule arriving in prose. The bullet now names that module's
`THE DERIVATION` header as the authority and states both discriminators
in the current terms.

### The RE-BREACH price, both halves

Full statement in ADR-019 addendum 4. Short form: ROADMAP's new landing
buys **2,451 bytes** of warn headroom — about **2.3×** the card's
~six-sentence bar (six merges at the 177-byte median per-commit delta
measured over the night of 2026-08-29/30) but only **1.4×** that whole
night's **+1,761-byte** net growth across sixteen commits. CONVENTIONS
buys **32,879** against **+23,825** measured in fourteen hours: **1.4
days**. AND THE UNCOMFORTABLE HALF: `warn = landed × 1.25` makes
headroom exactly a quarter of the landing, so this pass's cuts COST
runway — 128 bytes on ROADMAP, 663 on CONVENTIONS — and what bought the
runway was RE-BASING (warn 10,499 → 12,252 and 137,928 → 164,393). A
deeper cut would have shortened the runway it was meant to lengthen, so
the compaction was taken exactly as far as ADR-019's law reaches and no
further. Filed as `T-162-s1` rather than rewriting §Budgets from inside
the lane dispatched to execute it.

### Gates, unpiped

    npm run lint:tokens   (tools/e2e)      exit 0  TOKEN 155 / CONTROL 898
    npm run lint:docs     (tools/e2e)      exit 0  4 budgets gated
    npm run typecheck     (tools/e2e)      exit 0
    npx vitest run        (lib/parser)     exit 0  315/315
    npm test              (app)            exit 0  1015/1015, 47 files
    cargo test            (app/src-tauri)  exit 0  525 passed / 0 failed
                                                   / 4 ignored, 19 result
                                                   lines; lib.rs 4.05s
    NPUTER_E2E_PORT=15731 npm test (e2e)   exit 1  318 passed / 2 failed
    npm run health        (tools/e2e)      exit 3  7 inside, 0 drifting,
                                                   0 BREACHED, 3 unread,
                                                   4 UNKEPT

Port 15731 was `lsof -nP -iTCP:15731 -sTCP:LISTEN`-read at ZERO ROWS
immediately before the bind. Health's exit 3 is the designed one while
four bands await keepers (`T-156-s1`/`s2`) and both docs-headroom bands
now read INSIDE — the criterion's condition.

**THE E2E LANE'S TWO FAILURES ARE NOT THIS DIFF'S, AND THAT IS PROVEN
RATHER THAN ASSERTED.** `tools/e2e/tests/session-economics.spec.ts`
lines 73 and 247 spawn `brief.mjs --task T-157` and require exit 0.
T-157 is `status: done` with `touches: [docs/checkpoints/, tools/e2e]`,
and brief.mjs tests that fence against the MACHINE-scoped live lane
list, so it refuses at exit 1 while ANY e2e-seat lane exists:
*"fences are not disjoint: T-162 tools/e2e against T-157 tools/e2e"*.
Reproduced with NONE of this diff present — a detached scratch worktree
cut at `25850bd`, same command, same refusal, exit 1 — then removed.
Filed as `T-162-s2` with three arms. It fires on every card STATE
queues for this seat.

### The DOCS GATE's own answer on this diff

    TREE=$(git merge-tree --write-tree 25850bd HEAD)   # exit 0
    node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only 25850bd "$TREE")

exit **1** — the gate HAS a verdict, which is the gate working. It owes
FOUR suites, one more than the dispatch brief listed: `cargo test from
app/src-tauri/` as well as app, parser and tools/e2e, because
`app/src-tauri/src/agent/kit.rs` reads docs/CONVENTIONS.md off disk on
every run. All four were run, all four green — and the cargo one is the
suite that would have caught a moved `currently v0.1.8` stamp, which is
why the changelog compaction left that line alone. The lib suite's own
time was **4.05s**, inside the cargo-cache-cliff hazard's green band, so
its result is a claim about the tree.

### POISON DRILL disposition, and the positive control that stands in

**NO TEST BODY WAS ADDED OR CHANGED**, so the drill's own trigger does
not fire: the diff is two governing documents, one decision record, two
suggestion cards and one DATA table (`DOC_BUDGETS`). What the criterion
about the health bands needs instead is a positive control, and this
pass has one measured on the same tree: with the OLD figures the band
read *"BREACHED — docs-headroom/docs/ROADMAP.md … headroom 184 bytes =
1.75% of the warn line"* and CONVENTIONS' read *"drifting … 2.73%"*;
with the new figures both read INSIDE. Same tree, same command, the
reading moved with the table — so "INSIDE" is a claim about the budget
and not a band that cannot fail.

### The criterion this lane could NOT meet, recorded rather than papered over

The fourth criterion asks for "its own checkpoint record — the
2026-08-27 form". **THIS LANE'S FENCE CANNOT WRITE ONE.** `touches:` is
[docs/ROADMAP.md, docs/CONVENTIONS.md, docs/decisions, tools/e2e] and
`docs/checkpoints/` is outside it; the lane-fence hook refuses the
write, correctly. It is also the right division: ADR-019 §Records has
the checkpoint record written AT THE INTEGRATION, before docs/STATE.md
is regenerated, which is the integrator's step and not the executor's.
The execution record this card owed is therefore split — ADR-019
addendum 4 (written, in fence) plus these notes — and the checkpoint
record is the integrator's to write at the merge. Recorded here rather
than widened.
