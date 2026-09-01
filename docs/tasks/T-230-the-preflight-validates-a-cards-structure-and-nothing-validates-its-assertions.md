---
id: T-230
title: THE PREFLIGHT VALIDATES A CARD'S STRUCTURE AND NOTHING VALIDATES ITS ASSERTIONS — three of four cards dispatched in one sitting carried a false claim about the repository, and every preflight ran GREEN
feature: F-06
milestone: 4
priority: 2
size: M
status: verifying
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts, tools/e2e/fixtures]
suggested_by: "the architect/integrator seat, 2026-09-01 — measured across the sitting's four dispatches, and routed after @human asked whether verification's first phase belongs before dispatch"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
review: independent
---

**A GREEN PREFLIGHT SAYS THE CARD'S DERIVABLE CLAIMS HOLD. IT SAYS
NOTHING ABOUT THE CARD'S SENTENCES.**

`brief.mjs --preflight` checks what it can DERIVE: the card file exists,
the fence expands through the registry, the blockers are met, the
frontmatter parses. All of that is structure.

It cannot check a sentence asserting something about the world. Measured
across the four cards dispatched on 2026-09-01 — **three carried a false
assertion, and all four preflights were GREEN**:

| card | the assertion | the measurement |
|---|---|---|
| `T-211` | `T-209`'s intersection is reachable as `--intersect` | `brief.mjs` freezes its flag list; no such flag. An unknown flag exits 2. |
| `T-203` | *"`docs/CONVENTIONS.md` ALREADY SAYS IT: an edit script's success is a GATE"* | zero occurrences at base and at tip |
| `T-210` | the design "EACCES-fails the checkpoint sync" | at git 2.50.1 it does not — git unlinks and recreates, and the file returns at umask default |

## THE COST IS PAID TWICE, OR PAID LATE

- `T-211`'s three false claims were found by its EXECUTOR mid-build **and
  independently by its VERIFIER in phase 1.** Two seats, the same
  discoveries, both billed.
- `T-203`'s false quote was **inherited by the executor without
  noticing** and caught only at verdict — where the remedy is a routed
  card rather than a corrected contract.
- `T-210`'s wrong prediction was found by measurement DURING the build,
  after the design had already been shaped around it.

**None of these is a hard defect in the work.** They are defects in the
CONTRACT, discovered by seats paid to build against it and judge it.

## What a fix decides

1. **Which assertions are mechanically checkable.** A quoted claim about
   a tracked file is (`does docs/CONVENTIONS.md contain this string?`). A
   claim about a flag is (`is it in the frozen list?`). A claim about a
   platform's behaviour is **not**, and the honest answer for that class
   is to route it to the verifier's phase-1 ground truth
   (`roles/verifier.md`) rather than pretend a scanner can settle it.
2. **Whether a false assertion REFUSES or DISCLOSES.** A card is prose
   and prose is allowed to be wrong in ways a fence is not — but *"this
   document already says X"* is checkable, and a preflight that finds it
   false and stays silent is the silence this project keeps converting
   into refusals.
3. **How a card MARKS an assertion it wants checked.** The cheap shape is
   a quoted string plus the file it claims to be in; the expensive shape
   is parsing prose. Prefer the cheap one and say what it does not reach.

## Acceptance criteria

- WHERE a card quotes a string and names a tracked file as its source,
  the preflight SHALL verify the string occurs in that file, and SHALL
  report every claim it could not evaluate rather than passing silently
  over it.
- THE report SHALL distinguish CHECKED-AND-HELD from NOT-CHECKABLE. A
  count that merges them is the census defect this project has already
  paid for twice (`T-142`, `T-142-s1`).
- **A POSITIVE CONTROL SHALL prove the check still PASSES a card whose
  quoted claim is true**, and a body SHALL fail if the checker is made to
  report everything unverifiable — a validator that flags every card is
  indistinguishable from one that works.
- **THE THREE INSTANCES ABOVE SHALL BE FIXTURES.** Each is a real,
  dated, reproducible false assertion, and a checker that cannot catch
  the cases that motivated it has not been measured.
- THE drill SHALL include a card whose quoted claim is true but whose
  NAMED FILE is wrong — the near-miss that a substring search over the
  whole tree would pass and a file-scoped one would catch.
- Verification: headless.
- **This card is GUARD-CLASS**: `review: independent`, set at filing.

## Read beside

`method/roles/orchestrator.md` step 5b — which now REQUIRES this audit by
hand, and is the interim answer until this card mechanises it.
`roles/verifier.md`'s phase-1 ground truth, which owns the class this
card cannot reach. `T-229` (a control that cannot fail — the same shape
one layer down: a check nobody proved capable of refusing). `T-146`
(a rule that lives only in records).

## Why the by-hand rule landed first

`orchestrator.md` 5b was amended the same day to require this audit at
the dispatching seat, before the stamp. **That is a habit, and this
project's own measurement is that a rule depending on a reader
remembering has a failure mode while a construction does not** — the
sentence is in 5b itself, four paragraphs up from the new one. This card
is the construction. Until it lands, the habit is what there is, and it
should be read as an admission rather than a solution.

## DISPATCH, 2026-09-02 — the stamp, and what the audit found

**Fence narrowed at dispatch to three paths**: the preflight module
(`tools/e2e/scripts/card-preflight.mjs`, which owns the `--preflight`
arm the brief wrapper dispatches to), its spec, and `tools/e2e/fixtures`
for the three instance fixtures the criteria demand. `brief.mjs` itself
is OUTSIDE the fence tonight: if the wrapper must change, record the
exact edit and route it. Three sibling lanes run concurrently
(T-216-s4, T-223, T-236); none touches these paths.

**Audit (orchestrator 5b)**: `brief.mjs` freezes its flag list
(`const FLAGS = Object.freeze([...])`, an unknown flag exits 2) at
2489853, as the T-211 instance says. CORRECTED AT 4018a7b: the T-203
quote is PRESENT in docs/CONVENTIONS.md in different casing — line 190
opens the bullet "AN EDIT SCRIPT'S SUCCESS IS A GATE, NOT A STEP", so
`grep -c` of the card's casing reads 0 and `grep -ic` reads 1. The first
version of this note asserted absence with a grep this seat never ran;
the instance is a CASE-POLICY question and the lane was told so.
The T-210 platform claim is the verifier's phase-1 ground truth.

**THE SECOND HALF OF THAT AUDIT WAS WRONG AND IS RETRACTED HERE, ON
THIS LANE'S COPY** (the dispatching seat corrected it from the
integration branch mid-build, and the correction reproduces at this
lane's own ref `c120f1d`). The T-203 quote is NOT absent: line 190 of
docs/CONVENTIONS.md opens the bullet in that document's own capitals, so
`grep -c` reads 0 and `grep -ic` reads 1. **The instance is a CASE
POLICY, not an absence**, which changes what the second criterion is
asking for rather than whether it can be met — see the implementation
notes, where the policy is stated and its three readings are pinned.

**Holder**: this lane does NOT hold the integration checkout and does
not merge; it stamps `verifying`, reports ready-to-merge with branch and
tip, and leaves its worktree standing. review: independent, on the card
since filing — the subject is a guard.

## Implementation notes

**WHAT LANDED: a SIXTH claim class, `quotes`, and one opt-in marker.** A
card asks for a check by writing one plain body line —
`CARD CLAIM (<tracked file>): "<quoted string>"` — and the arm opens that
ONE file and answers whether the string is in it. Everything else in the
class is REPORTED. The module is `tools/e2e/scripts/card-preflight.mjs`;
`tools/e2e/scripts/brief.mjs` needed NO edit, because the arm's findings
already flow into the wrapper's exit 1 and into the `--write-fence` gate,
so the fence held with nothing to route.

**DECISION ONE — REFUSE versus DISCLOSE, on the card's own reasoning.**
The card's second section says a false *"this document already says X"*
is checkable and a preflight that finds it false and stays silent is the
silence this project converts into refusals. So: **a CHECKED claim found
false REFUSES**, and **everything the arm could not evaluate DISCLOSES**.
What makes the refusing half safe is that the marker is OPT-IN — the
author wrote it, so a refusal is the answer to a question that was asked,
and the over-fire trap that forced every other arm here to be measured
narrow does not exist. That is the whole argument, and it is why the
unmarked half only ever reports.

**DECISION TWO — the case policy, which the dispatch audit got wrong.**
Retracted above and re-measured at `c120f1d`: `grep -c` reads 0 and
`grep -ic` reads 1 on docs/CONVENTIONS.md line 190. **The matcher is
CASE-SENSITIVE, and the folded answer is named in the finding's own
detail.** A card claiming a document *"already says"* a sentence has made
a claim about what the document says, and a heading in that document's
own capitals is not the same sentence as a lowercase rule in running
prose — a folded matcher calls them one and passes. The error a
case-sensitive matcher makes is VISIBLE, dischargeable by a dated
`PREFLIGHT RULING` on the card, and the reader is told which of the two
they are looking at; the error a folded matcher makes is silent, which is
the failure this whole card exists to end. All three readings are pinned
as bodies: absent, present-but-shouted, and quoted in the document's own
capitals.

**DECISION THREE — whitespace collapses on BOTH sides.** Every governing
document here wraps at about seventy columns, so a card quoting a
sentence quotes it unwrapped. docs/CONVENTIONS.md's A CITATION NAMES A
SYMBOL prescribes the remedy in as many words. Without it the arm would
refuse a card quoting a sentence that IS in the file, which is the one
error a guard may not make. `TRUE_CLAIM`'s fixture quote spans a wrap on
purpose so the property is measured rather than described.

**THE THREE DATED INSTANCES are fixtures in
`tools/e2e/fixtures/card-claims.ts`,** each carrying the bytes its source
holds in the fixture tree. Two are marked and CAUGHT; the third — the
platform claim — is REPORTED, because this card's own first section rules
that class out by name and routes it to the verifier's phase-1 ground
truth. Its body therefore measures the DISPOSITION: counted, listed,
refusing nothing, and never appearing as something the preflight checked.
**The second instance names a governing document of its own rather than
docs/CONVENTIONS.md**, because the spec's fixture helper copies the LIVE
document into every fixture repository and a body written against it
would pass or fail with tonight's edits.

**RUN ON ITS OWN CARD, at `c120f1d`, the arm named both of this card's
founding false assertions unprompted**: the T-203 quote at line 31 and
the T-210 platform claim at line 32, both under *quoted and NOT marked*.
Neither refuses anything — they are prose in a table — which is the
report doing exactly what the first criterion asks of it.

**MEASURED OVER THE LIVE BOARD before the thresholds were chosen**, the
way this module's own header requires. **Every figure below is stamped
at `cc08ea5`, this lane's own ref, and each was ALSO taken at the base
`74ca530` before a line was written** — the two readings differ by
exactly the two suggestion cards this lane files, which is the arithmetic
that says the delta is mine and not the board's:

    live cards                                    438  <- @ cc08ea5 (436 at 74ca530)
    double-quoted runs in card PROSE            5,338  <- @ cc08ea5 (5,334 at 74ca530)
    of those, beside a path, PARAGRAPH-scoped   2,401  <- @ cc08ea5 (2,399 at 74ca530)
    of those, naming no source at all           2,937  <- @ cc08ea5 (2,935 at 74ca530)
    the same join taken LINE-scoped                455  <- @ cc08ea5 (455 at 74ca530)

Per card the paragraph-scoped set has a median of 2 and a maximum of 49
(`docs/tasks/T-078-…`, @ `cc08ea5`). **The paragraph is the unit because
the hard wrap puts the quote on one line and the file it is about on the
next**: the line-scoped join is the same number at both refs and drops
exactly the ones the wrap split. A backticked run counts inside a MARKER
and not in the unmarked report, because in ordinary prose this project
backticks every path, command and symbol it mentions and the report would
be unreadable and therefore unread. **Re-derive rather than quoting**:
both scans are one pass over `cardLines()` across `git ls-files
docs/tasks/T-*.md`, and they move with the board.

**FOR THE VERIFIER, four things to attack.**
1. The refusing half is opt-in, so its blast radius is bounded by
   authorship — but a MALFORMED marker also refuses (no quoted string, an
   untracked source, a directory). That is deliberate: a marker is a
   request, and one nobody can read is not a check that passed. It is the
   most arguable call in the diff.
2. The marker is read from the PROSE reading, the opposite of
   `card-figures.mjs`'s `card:` stamp. The reason is that documentation
   ABOUT this marker is written in exactly the blocks the prose reader
   blanks, so a raw reading would turn every explanation of it into a live
   claim — including this card's. The escape hatch that opens is closed by
   REPORTING every marker-shaped line the prose reader could not see.
3. The unmarked listing prints one line per quote. On the largest live
   card that is 49 lines. It is a report and it is never summed with what
   was checked, but it is the part most likely to be judged too loud.
4. `clip()` elides the DISPLAY of an unmarked quote at 72 characters.
   Nothing compares against a clipped string, and every string that IS
   compared is printed whole.

**POISON DRILL: 16 mutants, all in the code under test, one side only,
run against the whole spec in a detached worktree at `c120f1d` with a
lane-derived stem, each restored and PROVED by sha256 against the
committed blob.** No mutant survived. No new body's kill set is contained
in any other body's, and seven of the twelve new-or-changed assertions
kill a mutant that no other body kills — including the two the criteria
name directly: the checker made to report everything unverifiable dies to
seven bodies (the positive control among them), and refusing on every
unmarked quote dies to exactly ONE, the T-210 instance. The counts, the
mutations and the restoration hashes are in the report.

**CORROBORATIONS RATHER THAN NEW CARDS.** `T-160-s1` already owns *the
preflight is a written ritual with no tripwire* — this card adds an arm
to a command nothing on the merge path runs, which makes that card
stronger and is not a second one. `T-160-s2` owns *a claim written inside
a fenced or indented block is invisible to the preflight*; a dated
evidence line is appended there, because for this marker the invisibility
is now REPORTED and that is evidence the class's remedy is cheap.

**A STALE CENSUS IS REPORTED, NEVER REGENERATED.** This lane adds eleven
test names to `tools/e2e/tests/card-preflight.spec.ts`, so
`docs/CAPABILITIES.md` is stale at this tip and `npm run capabilities:check`
reds by design. docs/CAPABILITIES.md is outside this fence; the
regeneration is the integrator's, in the merge commit, before the
checkpoint.

## Verdicts

### V-230 — APPROVED at `90dfe536ae32f52fe64ac14c16e62ec5fe6c6379`, 2026-09-02, claude-opus-5@subagent (verifier, `review: independent`)

**WHICH BLINDNESS I HAD: CLOCK-SHAPED, NOT DISCIPLINARY.** My bench was
cut with the lane, so when I wrote the attack set no diff, no branch tip
and no report existed to decline to read — verifier.md's preferred shape
and the weaker guarantee, which is why it is said. Phase 1 produced
`attack-V-T-230.md` (sha256 `8223bbdb5431fdae…64de0`) and
`ground-V-T-230.md` (`c244f3b74cf7b6c9…bea51`), both stamped
2026-09-01T22:19:35Z against base `74ca5306e508`, before this branch had
a commit on it. My brief separated the two phases and named no
executor-derived specific, so nothing above the line was broken. I read
the card at its base ref only, and the Implementation notes, the
commit messages and the lane's suggestion cards after this verdict was
drafted (below).

#### The battery, at the tip, in my own bench

`/Users/ujju/Projects/nputer-V-T-230` detached at the tip, installed in
CONVENTIONS' fresh-clone ORDER, through the blessed gate-runner from the
repo root with `NPUTER_E2E_PORT=25230`. **Counts read, not only codes:**

    gate-verdict suite=parser exit=0 bodies=349  ref=90dfe536ae32 verdict=GREEN
    gate-verdict suite=app    exit=0 bodies=1131 ref=90dfe536ae32 verdict=GREEN
    gate-verdict suite=rust   exit=0 bodies=631  ref=90dfe536ae32 verdict=GREEN  (18 targets)
    gate-verdict suite=e2e    exit=0 bodies=546  ref=90dfe536ae32 verdict=GREEN

**The two e2e reds this seat was told to expect are NOT reproducible
here, and that is the attribution.** This bench is a DETACHED worktree
with no armed physical layer, and the same 546 bodies that red inside a
lane fence pass here — so those two are environment-scoped (T-216-s4's
class), not this diff's. `capabilities:check` is stale at this tip by
design: eleven new spec names, `docs/CAPABILITIES.md` outside the fence,
regeneration the integrator's at the merge.

#### What the ground truth I stamped before the diff decided

Phase 1 measured all three instances at `74ca530` and pre-committed
three predictions. The load-bearing one:

**The T-203 instance is a CASE POLICY at this ref, not an absence.**
`docs/CONVENTIONS.md:190` carries `AN EDIT SCRIPT'S SUCCESS IS A GATE,
NOT A STEP` — T-203's routed remedy landed — so the quote as this card's
own table renders it is absent case-sensitively and FOUND
case-insensitively. I pre-committed that this was where the lane would
most likely break: a fixture pointed at the live document (which
`seedGoverningDocs()` copies into every fixture repo) could not
reproduce the instance under a folded matcher. **The lane found it
independently, and answered it head-on** — a planted document rather
than the live one, a case-SENSITIVE matcher with the folded answer
carried in the finding's detail, and three arms pinning all three
readings (absent / shouted / quoted-as-written). The argument for
sensitivity is the right one and is written where the next reader meets
it: the visible error is dischargeable by a dated ruling and the silent
one is not.

The other two hold as the card states them, re-measured here: an unknown
flag exits **2** against a frozen eleven-member list and `--intersect`
exists nowhere but in card prose; git 2.50.1 (Apple Git-155) at umask 022
writes straight through a `chmod 444` tracked file on both a real merge
and a fast-forward (`444 → 644`, exit 0). **One extension of the card's
third row, measured in phase 1 and offered rather than demanded:** a
read-only DIRECTORY is a different answer — `chmod 555` on the parent
takes the same merge to exit **1**, `unable to unlink old`. The platform
claim is conditional on which surface is locked, which strengthens rather
than weakens the card's ruling that this class belongs to phase-1 ground
truth.

#### Criterion by criterion, against the stamped attack set

1. **Quoted string verified against the named tracked file; every
   unevaluable claim reported — MET.** `checkClaim` opens exactly ONE
   file, after tracked-set membership, and the report lists per claim:
   CHECKED-and-HELD lines, `QUOTED CLAIM NOT IN FILE` lines with the
   file and the string, `NOT CHECKABLE` lines with their state, every
   marker-shaped line the prose reader cannot see, and every unmarked
   quoted run split by whether a path is named in the same paragraph.
   The check is OPT-IN, which my attack set flagged as the likeliest
   escape hatch (A1.6); it is not one here, because the unmarked half is
   enumerated rather than summarised. **The dogfood proves it**: run on
   this card at the tip, the arm surfaces this card's own three quoted
   assertions — line 31 (the T-203 row), line 32 (`EACCES-fails the
   checkpoint sync`), line 149 (`this document already says X`) — where
   the base ref's preflight said nothing about any of them.
   A1.3's hard-wrap demand is met on both sides (`collapse`), and A1.5's
   scope demand is met: markers are read in BODY scope, which is where
   two of the three founding instances state their claims.
2. **CHECKED-AND-HELD distinguished from NOT-CHECKABLE — MET.** Three
   counts, never summed, plus two more for the unmarked halves. My
   census mutant (M4 below) is the proof they are not one number.
3. **A positive control that PASSES, and a body that fails if everything
   is reported unverifiable — MET, and the control CAN fail.** This was
   my second pre-committed question (T-229's class). M2 and M9 kill the
   control; M3 does not. It is a check, not decoration.
4. **The three instances as fixtures — MET, and the third
   DISCRIMINATES.** This was my third pre-committed question, and I said
   in phase 1 that a T-210 fixture asserting only "the report contains a
   not-checkable line" would be degenerate, since a checker that flags
   everything satisfies it. The shipped body does not do that: it
   asserts the platform sentence is counted in `naming no source at all`
   AND that `marked claims: 0` / `CHECKED and HELD: 0` — and then moves
   the SAME sentence into a paragraph that names a file and requires it
   to land in the OTHER bucket. That is a discrimination, not an
   existence check. The fixtures also state which text they reproduce
   and why the second instance's path moves, which answers A4.1/A4.2 —
   both real cards have since been corrected in place, so a fixture over
   live card text would have been measuring a retraction.
5. **The near miss — MET, and it can tell the two checkers apart.** My
   sharpest single phase-1 demand was that the quoted string be PLANTED
   in a second real file, or the body cannot distinguish a file-scoped
   check from a tree-wide one (poison shape TEN). It is: `holder` and
   `named` are both written and both tracked, the body guards both
   properties, and the drill settles it empirically — M7 below, the data
   mutant that gives the wrongly-named file the quote, kills that body
   and nothing else.
6. **Headless — MET.** Every new body is node-only.
7. **Guard-class — MET.** `review: independent` was on the card at
   filing; this verdict consumed no executor input before it was drafted.

#### The drill I ran myself — CONTAINMENT, never the count

Thirteen mutants in my own bench, at a COMMIT, ONE SIDE ONLY, each
mutation read back from `git diff` before the suite ran, each restore
proved by sha256 against `git show HEAD:<path>`. Two of them are DATA
mutants,
because the property *this instance is false* lives in the fixture's own
bytes and a code-only drill mis-grades that by construction. Scope: the
module's only importer plus the only other spec that drives the
`--preflight` arm over a live card — `card-preflight.spec.ts` and
`checkout-currency.spec.ts`, **63 bodies green unmutated**.

| mutant | one side | landed in | killed (environment reds subtracted) |
|---|---|---|---|
| M1 search the whole tracked tree | module | `checkClaim` | T-211, T-203, near-miss, ruling |
| M2 every marked claim NOT CHECKABLE | module | `checkClaim` | positive control, T-211, T-203, near-miss, uncheckable, ruling, file-check |
| M3 every marked claim HELD | module | `checkClaim` | T-211, T-203, near-miss, ruling, file-check |
| M4 NOT CHECKABLE summed into HELD | module | the census lines | **uncheckable, and nothing else** |
| M5 drop the unmarked-quote listing | module | the report loop | **T-210, and nothing else** |
| M6 **DATA**: the frozen list gains `--intersect` | fixture | `FROZEN_FLAGS` | **T-211, and nothing else** |
| M7 **DATA**: the wrongly-named file gains the quote | fixture | `NEAR_MISS.namedText` | **near-miss, and nothing else** |
| M8 case-folded matching | module | `checkClaim` | T-203, file-check |
| M9 the wrap collapse dropped on the haystack | module | `checkClaim` | positive control, file-check |
| M10 markers read only in criteria scope | module | `cardClaims` | positive control, T-211, T-203, near-miss, uncheckable, sighting, ruling, marker-parser |
| M11 the sighting report emptied | module | `unseenMarkers` | **sighting, and nothing else** |
| M12 the marker loses its bullet tolerance | module | `CARD_CLAIM` | **marker-parser, and nothing else** |
| M13 the discharge subject becomes the source | module | the quote `raise` | **ruling, and nothing else** |

**THIRTEEN MUTANTS, ZERO SURVIVORS.** Every mutation was read back out of
`git diff` before its suite ran — never from a substitution count — and
every restore was proved by `shasum -a 256` against `git show HEAD:<path>`,
both files, after every mutant.

**CONTAINMENT, WHICH IS THE TEST — and no kill set here contains
another.** The pairs worth stating:

- **near-miss vs T-211.** Both die under M1, M2, M3 and M10, so the
  code-only mutants make them look like one body. **The two that separate
  them are both DATA mutants**: M7 kills the near-miss alone and M6 kills
  T-211 alone. That is verifier.md 2b's own warning arriving in the
  measurement rather than in theory — I predicted in phase 1 that M1
  would separate them and **it does not**, because a fixture repository
  contains the card that makes the claim, so a tree-wide search finds
  every needle in the card's own marker. Read the landing, not the
  prediction.
- **the positive control vs the census body** — criterion 3's two halves.
  M2 kills both, so M2 settles nothing. M9 kills the control alone and M4
  kills the census alone: two bodies, not one.
- **CAN THE POSITIVE CONTROL FAIL?** My second pre-committed question.
  **Yes, under three distinct mutants** — M2 (report everything
  unverifiable, the card's own wording), M9 (stop collapsing the wrap)
  and M10 (narrow to criteria scope). It is not T-229's class.
- **the T-210 disclosure body** dies under M5 and nothing else, and
  nothing else dies under M5. My third pre-committed question was whether
  that fixture discriminates or merely exists: a mutant that removes the
  listing while leaving the counts and the class paragraph standing kills
  it alone, so it measures the disclosure and not the vocabulary.
- **sighting vs marker-parser** were the one pair my first ten mutants
  could not separate — identical kill sets under them. M11 and M12,
  aimed one at each, settle it: neither contains the other.
- **the ruling body** was contained in three others under my first twelve;
  M13, aimed at the discharge subject, kills it alone and breaks that
  containment. A body declared a restatement on the strength of a mutant
  set that never aimed at its property is poison shape SEVEN wearing a
  verdict.

**THE ATTRIBUTION THAT COST ME A RE-RUN, RECORDED BECAUSE IT WOULD HAVE
BECOME A FALSE FINDING.** From M5 onward three bodies failed under every
mutant — `a discrepancy answers ONE and a preflight that could not run
answers THREE`, and checkout-currency's `THE WIRING'S POSITIVE CONTROL`
and `THE SWEEP AT ARM TIME` — joined by a fourth, `lane-lock.spec.ts`'s
*the DISPATCH STEP arms it*, once the scope widened at step 7 below.
**They are not this diff's and not my mutants'.** Re-run ONCE unmutated on a clean tree at the same tip: the
same three fail, 60 passed. The cause is in their own output — `verdict:
stale … It is 13 commit(s) behind main` — my bench is a detached checkout
at this lane's tip and MAIN ADVANCED under me while I drilled (14 commits
by the time I measured it). Those three bodies assert that the checkout
the suite runs in is CURRENT, which is a fact about the clock and not
about the tree. They were green in the battery I ran earlier tonight at
this same tip, with the same bytes. Subtracted from every kill set above,
and filed as `T-230-s6` because the property will bite every lane that
outlives a merge.

#### Step 7 — the gates my OWN commit could move, run at my OWN tip

Prose is a code input here, so this verdict and its four suggestion cards
owe the tree's gates. Asked rather than predicted, with separate literal
paths:

    node tools/e2e/scripts/docs-gate.mjs <my five paths>
    -> exit 1, FIRES: 5 paths under docs/ are code inputs
       every live task card's frontmatter parses, with a legal status
       owed: npm test from app/, npm test from tools/e2e/, npx vitest run from lib/parser/

Run through the blessed runner at `a58b624` — the commit this verdict
first made, which is my own tip and not the one I was sent:

    gate-verdict suite=parser exit=0 bodies=349  ref=a58b624b852e verdict=GREEN
    gate-verdict suite=app    exit=0 bodies=1131 ref=a58b624b852e verdict=GREEN
    gate-verdict suite=e2e    exit=1 bodies=546  ref=a58b624b852e verdict=RED
      4 failed / 542 passed

**THE FOUR ARE THE CLOCK AND NOT MY PROSE, AND THE CONTROL IS THE PROOF
RATHER THAN THE ARGUMENT.** They are the three named above plus
`lane-lock.spec.ts` *the DISPATCH STEP arms it* — which my drill scope did
not include, so it appears here first. Each one's own failure text carries
the cause: `verdict: stale … the judged checkout is at <sha>, which does
NOT contain 33e50b8a — the newest main commit touching .claude. It is 14
commit(s) behind main.` **I then checked the same four out at
`90dfe53` — the tip I was sent, before my verdict existed — and ran them
under the same clock: the SAME FOUR FAIL, 4 failed / 72 passed.** The
delta my commit contributes is zero. The e2e leg was 546/546 GREEN at
`90dfe53` earlier the same night, with the same bytes and an earlier main.
Filed as `T-230-s6`.

**AND THIS PARAGRAPH MOVED THE TIP IT REPORTS ON**, which is the figure
case verifier.md closes with: the verdict was amended to carry these
lines, so `a58b624` is now history rather than my tip. The amend is prose
only; the parser and app suites were re-run GREEN against it at the same
counts, and **no sha is stated for that tip on purpose** — pinning it
would be another commit and another sha, which is the regress
docs/CONVENTIONS.md forbids stating a distance to. Re-derive instead:
`node tools/e2e/scripts/gate-run.mjs parser|app|e2e` from the repository
root, and expect e2e's four clock reds until the checkout catches up to
main.

#### Security sweep — the checker opens files named by card prose

Seventeen adversarial probes driven straight through the exported
`checkClaim`, at the tip:

- **Path traversal closed by construction.** `../../../../etc/passwd`,
  `docs/../../../../etc/passwd`, `/etc/passwd`, `~/.ssh/id_rsa`,
  `/dev/null` and an absolute path INSIDE the repository all answer
  `untracked` and open nothing. The gate is membership in `git ls-files`,
  not a string test, so there is no spelling to get around.
- **Untracked and git-ignored sources are refused, not read** — an
  existing `node_modules` file and a built `lib/parser/dist/index.js`
  both answer `untracked`. A verdict that depended on an untracked file
  would be a fact about the checkout.
- **No subprocess, no dynamic regex, no new dependency.** The diff adds
  exactly ONE `readFileSync` and no `spawnSync`/`exec`/`new RegExp`/
  `eval`; the search is `String.includes`, so a needle of
  `(.*)+[\d]{9999}` is answered in 1.5 ms rather than catastrophically
  backtracked. Card text never reaches a shell, which keeps the module's
  own promise.
- **No unbounded read.** The largest tracked file (1.17 MB
  `docs/architecture/graph.json`) answers in 4.7 ms; a tracked binary
  (`.woff2`) is read without throwing.
- **A quoted run cannot carry a newline** (`[^"\n]+`), so the report
  cannot be forged into a second line.

#### Over-firing on the live board — measured, not assumed

Across **438 live cards at `90dfe53`**: **0** CARD CLAIM markers, so the
arm refuses **nothing** that stands today; 3 marker-shaped sightings,
all reported and none refused. The disclosure half lists 5,285 unmarked
quoted runs (2,385 beside a named path, 2,900 naming none). I re-derived
the module's own stated threshold claim rather than taking it: the
per-card distribution is min 0, **median 4**, p75 16, p90 33, max 112,
with 34 cards over 40 — so "a per-card median a reader can act on" is
true, and the paragraph split at 45% is the "roughly half" it claims.

#### Findings — three, none blocking, all filed as suggestions

**F1 — THE FRONTMATTER IS A SILENT BLIND SPOT, AND IT IS THE ONE PLACE
THIS ARM'S OWN DOCTRINE SAYS NOTHING MAY BE SILENT.** `cardClaims`,
`unseenMarkers` and `unmarkedQuotes` all read `cardBody`, which strips
the YAML block. Reproduced at the tip: a card whose title carries
`the design "EACCES-fails the checkpoint sync"` yields **no claim, no
sighting and no unmarked-quote line**, and a marker written inside a
frontmatter field is ignored without even a sighting. That matters
here rather than abstractly, because **T-210's real instance states its
false assertion in its TITLE** (its criteria begin at line 77; the
prediction is in the frontmatter and again at lines 22–41), and the
fixture reproduces the sentence in body prose. Nothing the arm reports
is wrong; its census is incomplete in a place its `cannot` text does not
admit, which is the gap `unseenMarkers` exists to close one line over.
Filed as `T-230-s3`.

**F2 — THE MARKER'S SOURCE IS INTERPOLATED RAW INTO THE REPORT LINE.**
The finding message runs the source through `JSON.stringify`; the
`NOT CHECKABLE line N: <state> source <source>` record does not, so a
card can write a source containing the report's own ` <- ` provenance
separator and have it printed mid-line. Measured: a marker naming
`docs/x  <- @ deadbeef ; forged` parses to exactly that source. Cosmetic
— the real provenance still follows, and the tracked-set gate means no
such file is ever opened — but the report is a thing other readers
grep. Filed as `T-230-s4`.

**F3 — THE QUOTE FLOOR DROPS CLAIMS WITHOUT COUNTING THEM.**
`MIN_QUOTE_CHARS = 4` is argued and pinned, but a run below it leaves no
trace: not in the two unmarked counts, not in a floor count of its own,
and not in the class's `cannot` text, which says the unmarked ones "are
COUNTED and LISTED rather than passed over". One number would close the
distance between what the report claims and what it does. Filed as
`T-230-s5`.

**One observation that is not a finding**, recorded so nobody has to
re-derive it: the tracked-set gate is a PATH gate rather than a
containment gate, so a tracked symlink pointing outside the repository
would be read through. There are **zero** tracked symlinks at this ref
(`git ls-files -s` carries no `120000` entry), so nothing is exposed
today, and `within()` from the fence hook is already imported by this
module if that ever changes.

#### What I checked against ARCHITECTURE and CONVENTIONS

The diff adds no command to the "Build & test" bullets, so
`workflow-parity` is untouched; no dependency, so the near-zero-dependency
property of these scripts holds; `tools/e2e` is dev tooling under no
component and `.nputerignore`d, so the new `.ts` matches GRAPH REGEN's
trigger and cannot move the graph — over-firing in the safe direction, as
that bullet prescribes. The new fixture is a `.ts` under `tools/e2e`, so
it joins both the TOKEN and the CONTROL corpora, and the lane's own
`token-scan.spec.ts` ran green inside the 546. The arm's four exit codes
are unchanged and the house `EXIT` object is still the authority. One
thing worth the integrator's eye and not a defect: the fixture now
carries a second copy of a CONVENTIONS sentence
(`AN EDIT SCRIPT'S SUCCESS IS A GATE, NOT A STEP`), which is poison shape
EIGHT's raw material should anything ever pin that sentence's uniqueness;
nothing does today.

#### Read after drafting

Drafted before opening anything the executor wrote. **After drafting I
read**: this card's `## Implementation notes` and its dispatch-note
retraction, the three commit messages on this branch, and the lane's
three suggestion cards. Nothing in them changed a word of the verdict
above; I record having read them because a reader cannot tell otherwise,
and one detail is worth naming as agreement rather than discovery — the
lane found the T-203 case-policy question on its own, from the
dispatching seat's corrected audit note, and my phase-1 ground truth
found it independently at `74ca530` before either was written down.
