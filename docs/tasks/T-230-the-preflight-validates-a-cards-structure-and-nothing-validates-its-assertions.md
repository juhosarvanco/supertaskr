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
2489853, as the T-211 instance says; the T-203 quote is absent from
docs/CONVENTIONS.md at 2489853 (`grep -c` reads 0), as the card says.
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
way this module's own header requires. Across 436 live cards there are
5,334 double-quoted runs in prose, median 4 per card; paragraph-scoped
against the tracked tree, 2,399 of them sit beside a repository path
(median 2 per card, max 49) and 2,935 name no source at all. The
paragraph is the unit because the hard wrap puts the quote on one line
and the file it is about on the next; a line-scoped join finds 455 and
drops exactly the ones the wrap split. A backticked run counts inside a
MARKER and not in the unmarked report, because in ordinary prose this
project backticks every path, command and symbol it mentions and the
report would be unreadable and therefore unread.

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
