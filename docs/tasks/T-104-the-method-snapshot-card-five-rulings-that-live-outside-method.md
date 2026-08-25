---
id: T-104
title: NINE ratified rulings live everywhere except the file that ratifies them — the method-snapshot card, deferred until the deferral started costing rulings
feature: F-01
milestone: 4
priority: 4
size: M
status: verifying
blocked_by: []
touches: [method/, docs/CONVENTIONS.md, app-agent]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs (seventh triage, 2026-08-24): T-089-s1, T-089-s9, T-089-s10, T-089-s11, T-061-s1 — files removed in this commit.

Absorbs (eighth triage, 2026-08-25): T-088-s1 — file removed in this
commit. **A CARD'S CRITERION TRANSCRIBED A DERIVED COUNT AND DISPATCHED
IT STALE.** T-088's last criterion promised the docs gate would name
*"five readers, three suites"*; the tree said **seven readers across four
suites**, and the missing suite was `cargo test` — the one no TypeScript
reader would have guessed. CONVENTIONS already forbids this for its OWN
prose (*"NO COUNT IS TRANSCRIBED INTO THIS BULLET, AND THAT IS THE
POINT"*, and *"CITE THE SHAPE, NOT THE TALLY"*), and the gate prints its
census on every run precisely so nobody writes it down. The rule was
applied to the bullet and never to the SEAT THAT WRITES CRITERIA.
**A criterion SHALL name the gate's COMMAND, never its OUTPUT** — a
count in an acceptance criterion is a line number by another name, and it
goes stale under other people's merges exactly the way a line number
does. This belongs in `method/tasks/TASK-FORMAT.md` beside the criteria
guidance, which is why it rides this card rather than a docs fence.

> **DRAFTER'S NOTE — remove before landing.** The `touches:` above is
> the card's whole point and should not be trimmed. `T-078-s3` measured
> that a `method/` FORMAT change is a THREE-file commit whose third file
> is Rust; four of the five items below were deferred by four different
> cards for exactly that reason, each writing *"belongs to whichever
> card can carry that"*. This is that card, and a fence without
> `app-agent` reproduces the deferral. **Whether a bump is owed at all
> is triage's call and should be decided BEFORE dispatch** — see the
> first criterion.

Absorbs: T-084-s5, T-078-s8, T-080-s6, T-080-s1, T-081-s9, T-078-s3
(sixth triage, 2026-08-20). All six files removed in this commit.

**`method/` is the generic, product-agnostic convention and it is where
this project's task encoding is RATIFIED.** Five rulings that this
repository now enforces in code, in prose, or in practice are written
everywhere except there.

## Why they all stalled: a docs fence cannot reach `method/`

`docs/CONVENTIONS.md`'s first gotcha says *"Changes to method/ formats
are version-bumped (currently v0.1.5) and noted here"*. **That string is
a live pin.** `snapshot_version_matches_the_live_method_stamps` in
`app/src-tauri/src/agent/kit.rs` reads the real `docs/CONVENTIONS.md`
off disk on every `cargo test` and asserts it carries `currently
v{METHOD_SNAPSHOT_VERSION}`, alongside the same check against
`method/interview/plan-interview.md`'s Output heading;
`METHOD_SNAPSHOT_VERSION` is a Rust `const`, and `acl_pin.rs` asserts
the IPC status payload's `methodVersion` equals it (all three verified
at `4d2f03c`). **So a method bump is a three-file commit — `method/…`,
the CONVENTIONS stamp, and a Rust constant — and the third file is
outside any docs-only fence.**

This is the right design: the kit ships compiled-in copies of the method
files, so a version that lies about what shipped would be worse than no
version. **The finding is that nothing says so where the person about to
edit `method/` is looking.** The gotcha reads as bookkeeping
("version-bumped and noted here"), not as "and this is enforced from
Rust, so your docs-only card cannot do it".

## The five rulings

1. **THE DISPOSITION RULING** (T-084-s5). T-084 answered the question a
   verifier asked in frontmatter: *"resolved by other work" is not a
   fourth triage move and `closed` is not a ninth status* — it is a
   DISPOSITION, disposition belongs to triage, and a discharged finding
   keeps `status: suggested` with the discharge recorded in its own body
   until triage promotes, parks or rejects it. It is enforced in code
   (`DISPOSITION_RULING` in `tools/e2e/scripts/docs-scan.mjs`, printed at
   the point of failure and pinned in
   `tools/e2e/tests/docs-input-gate.spec.ts`) and written in
   CONVENTIONS' suggestion-triage bullet. **`method/tasks/TASK-FORMAT.md`
   — which carries the three moves and the "Rationale of record"
   paragraph — says nothing**: `grep -n "disposition\|closed"` over that
   file returns ZERO at `4d2f03c`.
2. **A TITLE THAT OPENS WITH A SYMBOL IS AN UNPARSEABLE CARD**
   (T-080-s6). Task frontmatter is YAML and a plain scalar may not begin
   with a reserved indicator, so `title: ` followed immediately by a
   backtick is a `YAMLParseError`. **The convention's own prose names
   symbols in backticks constantly, so this is the natural thing to
   write** — two of one card's five findings were written that way, and
   what caught them was an off-by-two in four scroll-containment bodies
   (`Expected "60"` against `Received "62"` at `146c333`), three steps
   from the cause. **The mechanical half is now T-084's and it is
   built**; what remains is the WRITING rule, in the file that tells
   people how to write a card. Audited repo-wide after that fix: 0
   unparseable files of 116, and 0 titles starting with any
   YAML-reserved character.
3. **A CRITERION CAN SPECIFY A CHECK THAT CANNOT FAIL** (T-080-s1).
   T-080's first criterion offered two forms of a coverage floor and
   preferred the one that, read literally, **can never fail**: the
   corpus is DEFINED as the tracked list minus the exclusions, so adding
   a suffix to the exclusion set removes it from the expectation at the
   same instant it removes it from the corpus — the deletion deletes its
   own failure, poison five one rung up. The card's SECOND criterion
   then required the floor to bite for that same suffix, **so criteria 1
   and 2 could not both be satisfied by the form criterion 1 preferred.**
   The general lesson belongs in the decomposition rules beside the
   poison shapes: **a criterion that names a relation between a policy
   and a view DERIVED from that policy has specified a tautology**, and
   it reads exactly like a real check until someone tries to red it.
   The card's own evidence paragraph missed it because the evidence was
   gathered by mutating the policy, not by mutating the proposed check.
4. **A PROPOSED REPLACEMENT SENTENCE IS EVIDENCE TOO** (T-078-s8). A
   finding correctly caught a wrong numeral and then proposed prose to
   replace it — and **both halves of the proposal were false**: it named
   a directory the search never touches (zero hits at three refs) and it
   inverted the one hit its own argument rested on. The DIAGNOSIS was
   measured; only the REMEDY was not. **A finding is read as a unit**,
   and an executor working from the ask rather than re-deriving would
   have replaced one false sentence with a differently false one while
   believing they had adopted the more rigorous arm. The ask:
   **prose PROPOSED as a replacement carries the measurement that
   produced it, or is marked unverified.** (Recorded because it cuts
   both ways: the same session nearly filed a second instance against a
   sibling finding and caught itself by running the command AS WRITTEN
   rather than as assumed — all four of that sibling's figures reproduce
   byte-for-byte.)
5. **A ROLE THAT WRITES TO THE TREE OWES THE TREE'S GATES, EVEN WHEN
   WHAT IT WROTE WAS PROSE** (T-081-s9). A verdict measured `npm test`
   from app/ at **831 passed, exit 0** at the commit under review, then
   committed the verdict and two findings — one carrying `status:
   closed`, outside the parser's eight-value vocabulary — **and left the
   branch tip at 830 of 831, exit 1**. Attributed rather than assumed:
   re-measured with the later executor's Rust files checked back out, so
   the tree was byte-identical to the inherited tip. **Nothing between a
   verdict and a merge re-runs the suites the verdict quotes.** The
   mechanical half is T-084's and it is built; **the role clause is what
   survives, and the CONTROL half of the same incident is why** — that
   verdict's printed `CONTROL 554` was stale at its own tip by two
   tracked files, and no gate will ever catch a stale printed number.
   `method/roles/verifier.md` is the file.

## Carried forward from `T-089-s7` (seventh triage, 2026-08-24)

`T-089-s7` is rejected as discharged — its arm 1 landed in T-089's
re-execution — **but one residual survives only inside the file the
convention schedules for removal**, so it is copied here rather than
buried:

- **Row 5's slug map is named but never located.** It is
  `docs/ARCHITECTURE.md` plus each component's `touch_slugs:`, and no
  row says so; every other row names a file.
- **Row 5's two named sources disagree today** — the board reports zero
  cards `building` while `git worktree list` reports live lanes — and
  the precedence rule between them lives in CONVENTIONS, also unnamed.
  This card SHALL name both the map and the precedence, because an
  assembler transcribing row 5 cannot compute fence disjointness
  without them.

`T-089-s11` records the same two rows from the verdict side; both are
absorbed here.

## ARCHITECT, 2026-08-25, at `8f8ec31` — PRIORITY RAISED 60 → 4, AND THE REASON IS THAT THE DEFERRAL STARTED COSTING RULINGS

This card said, of rulings six and seven, that they were carried here
*"rather than given their own card precisely because a second card would
reproduce the deferral this one exists to end."* **The deferral happened
anyway — to this card, at priority 60, behind thirty others.** Two more
rulings arrived after that sentence was written. There are now **nine**,
and the title has been corrected from five.

**Measured at `8f8ec31`, and it is a clean zero.** Searching `method/`
and `docs/CONVENTIONS.md` for the operative phrase of each ruling —
*"informational independence"*, *"S cards touching shipped code"*,
*"LANE state"*, *"stop condition"*, *"weigh rejections"* — returns
**0 occurrences of any of them, in either place.** Every one of the nine
lives in this card, in git commit messages, and nowhere a role or a
convention is read from.

**AND THE COST ARRIVED THE SAME NIGHT, TO THE ARCHITECT WHO MADE THE
RULING.** Ruling NINE says the executor stamps `verifying` in its own
lane. Hours after ratifying it, the architect wrote a dispatch brief for
T-116 instructing the executor **not** to stamp `status:`. The executor
followed `method/roles/executor.md` and T-104 instead of the brief, was
right to, and said so in its report. **Nothing broke, because the
executor read the repository rather than the brief — which is exactly
the safeguard that stops working the moment a ruling is not IN the
repository.**

That is the argument for the priority, and it is stronger than "the docs
are stale": **a ruling that lives only in a card cannot be followed by
anyone who does not happen to read that card**, and the people who most
need these nine — dispatchers writing briefs, executors deciding
ceremony, verifiers deciding what `review:` means — read `method/` and
`docs/CONVENTIONS.md`. @human ruled *"solidify them into the way
we/nputer works"* on 2026-08-25. **Until this card lands, they are not
solidified; they are minuted.**

**ONE CONSTRAINT ON THE `docs/CONVENTIONS.md` HALF, AND IT IS HARD.**
`T-091` adds a reader that parses the **RANGE RULE** bullet and asserts
roughly thirty figures inside it, and it is approved and awaiting
integration as this is written. **This card SHALL NOT edit the RANGE RULE
bullet, its figures, its flip lists, or its command recipes.** The
rulings here belong in `method/roles/*.md`, `method/tasks/TASK-FORMAT.md`
and `method/lane-protocol.md`; where CONVENTIONS is genuinely owed a
sentence, it goes somewhere the reader does not parse. IF T-091 has
landed by the time this lane runs THEN run its reader and prove the
figures still hold; IF it has not THEN say so and leave the bullet
untouched.

## TWO MORE RULINGS ARRIVED 2026-08-25, AND THEY ARE THE SAME SHAPE — RATIFIED EVERYWHERE EXCEPT `method/`

Both were ruled by @human on 2026-08-25 (*"All of your decisions are
great — solidify them into the way we/nputer works"*), and both land in
`method/` files this card's fence is the only one that can reach. They
are carried here rather than given their own card precisely because a
second card would reproduce the deferral this one exists to end.

**SIX — THE CEREMONY TABLE'S SIZE-S ROW IS TOO WIDE.**
`method/tasks/TASK-FORMAT.md` gives size S "executor + tests; the
executor is its OWN integrator. No verifier, no *separate* integrator."
The ruling narrows it: **an S card that touches SHIPPED CODE gets a
verifier; an S card whose diff is docs, method or tooling keeps
self-integration.** The evidence is this project's own record —
**13 of 75 done cards are `self-verified` at `d43455b`**, and the
figure's own movement is the argument: it was **10** at T-090's
checkpoint and the three S cards that self-integrated on 2026-08-24/25
are exactly the delta, two of them (`T-090`, `T-113`) into shipped
surfaces. (Derived from disk here and corrected in the writing — the
architect first transcribed the stale 10, which is the same failure the
first criterion below guards against.) A fourth, `T-015`, turned out to be
UNBUILDABLE in a way only a careful executor caught. Nothing went wrong;
the point is that nothing adversarial was watching the two that touched
shipped code. **The rung is cheap** — it adds one session to a minority
of S cards and leaves the docs/tooling majority untouched.

**SEVEN — THE INDEPENDENCE THAT PAYS IS INFORMATIONAL, NOT MODEL
DIVERSITY, AND `review:` SHOULD SAY SO.** Derived from disk at
`d43455b`: of 75 done cards, **56 `same-model`, 5 `independent`, 10
`self-verified`, 1 empty**. `method/roles/verifier.md` and the `review:`
vocabulary both read as though a DIFFERENT MODEL were the guarantee —
yet the sharpest verdict this project has recorded, T-101's rejection
with three blocking findings none of which appeared in the executor's
own eleven-row matrix, was **`same-model`**. What produced it was the
INFORMATIONAL constraint (card + diff, never the executor's reasoning),
which is the same property `T-121`'s arm 2 is about. **The method should
say that the blindness is the guarantee and the model string is
provenance** — so a `same-model` verdict stops reading as a weaker
verdict than it is, and nobody is tempted to buy diversity instead of
blindness. This is prose, not a new status: the four `review:` values do
not change.

**EIGHT — THE TWO-REJECTION STOP CONDITION COUNTS REJECTIONS AND SHOULD
WEIGH THEM.** `method/tasks/TASK-FORMAT.md` says *"Two rejections →
stop; open a room, escalate to the human."* It fired on `T-110` on
2026-08-25 and **over-triggered**, which @human named on being handed
the room: *"this kind of fix could have been done by you without me, so
there might be fine-tuning needed with the double rejection rule."*
They were right, and the waiver they then granted is the evidence.

**WHAT THE RULE CANNOT CURRENTLY TELL APART**, measured on the card that
tripped it:

- **A card in trouble** — the same defect surviving two attempts, or
  rejections whose causes compound, or a spec nobody can build to. That
  is what the escalation is FOR: a human decides whether the card is
  wrong rather than the builders.
- **A card being built well under an adversarial process** — T-110's two
  rejections were on **different** defects, each **novel**, each carrying
  a **concrete named fix inside the fence** (pass 1: four states with no
  pin driving them; pass 2: a two-token symlink follow). Nothing repeated
  and nothing compounded. Escalating that spends a human on a decision
  the architect already had the evidence to make.

The rule counts EVENTS where it should weigh WHAT THEY SAY, so a card
gets punished for being verified thoroughly — which is the opposite of
the incentive this pipeline wants, and it is worse the better the
verifiers get.

- **THE STOP CONDITION SHALL DISTINGUISH REPEAT FAILURE FROM SUCCESSIVE
  DISTINCT FAILURES.** Two rejections stop the card when the SAME defect
  survives a rebuild, when a rejection's cause was known and not closed,
  or when the fix lies outside the card's fence. Where each rejection is
  a distinct, newly-found defect with a named in-fence remedy, **the
  ARCHITECT may waive once, in writing, on the card**, and the waiver
  SHALL record which distinction it relied on. A THIRD rejection is
  terminal in every case: park and re-plan, never a fourth pass.
- **AN ESCALATION SHALL STILL BE WRITTEN EVEN WHEN THE ARCHITECT
  WAIVES.** The room is what makes the judgement reviewable, and it cost
  almost nothing on T-110 — @human read it and ruled in one line. What
  changes is that the room says *"waiving, here is why"* rather than
  *"stopped, awaiting you"*, so the pipeline keeps moving while the
  human keeps the veto.
- IF the architect is the seat that DISPATCHED the failing card THEN the
  waiver SHALL name that, because a dispatcher waiving a stop on its own
  dispatch is exactly the conflict the human escalation exists to catch —
  T-110's own two rejections both trace partly to briefs this architect
  wrote.

**NINE — `verifying` IS UNREACHABLE ON THE BOARD, AND THE FIELD SHOULD
SAY WHAT IT CAN ACTUALLY MEAN.** Four sessions asked the architect to
rule on why `verifying` reads **0** while lanes are genuinely in
verification. It is ruled here, and the answer is not a bug to fix:

**THE WINDOW IS ONE COMMIT WIDE, MEASURED THREE WAYS.** An executor
stamps `verifying` inside its LANE, and that stamp reaches `main` only
when the merge lands — at which point the integrator's own checkpoint
stamps `done` in the next commit. So a card reads `building` at the
merge's parent, **`verifying` at the merge commit itself**, and `done`
at the checkpoint. T-124's integrator caught it in the act, T-052's
integrator **predicted and reproduced it exactly**, and T-086's
integrator added a third, independent witness: a detached
`drill-T-107-verify` worktree on disk while T-107's card on main still
read `building`. **Three sources, and the card is the one that lies.**
Re-measured at `9b9c997`: four live lanes, four worktrees, and **all
four cards read `building`** — `verifying` appears nowhere on the board
while two of the four are under verification right now.

**SO `verifying` IS NOT A BOARD STATE. IT IS A LANE STATE.** The
vocabulary in `method/tasks/TASK-FORMAT.md` presents all eight statuses
as if they were equally observable on the integration branch, and two of
them are not: `verifying` is visible on main for exactly one commit, and
`merging` has never been observed at all. **This is not a defect in
`git`, in the parser, or in any lane — it is the field claiming a
reach it does not have.** It is also precisely what F-04 exists to
expose: `T-110`'s lane reader reads the WORKTREE list, and the product
is the DISAGREEMENT between that and `status:`.

- **THE STATUS VOCABULARY SHALL SAY WHICH STATES ARE OBSERVABLE ON THE
  INTEGRATION BRANCH AND WHICH ARE LANE-LOCAL**, so a reader of the
  board stops treating `verifying: 0` as evidence that nothing is being
  verified. `building` is durable on main from the pre-cut stamp until
  the merge; `verifying` and `merging` are lane-local and transit main
  in at most one commit.
- **NO NEW STATUS AND NO STAMP-EARLIER FIX.** The obvious repair —
  have the executor stamp `verifying` on the integration branch — is
  REFUSED: it re-opens the two-writer merge conflict the pre-cut stamp
  order exists to prevent (`lane-protocol.md`, "Why the branch carries
  the dispatch stamp and the lane does not"), and would trade a legible
  gap for a hand-resolved conflict on every card.
- **THE HONEST READER IS THE WORKTREE LIST**, which lane-protocol rule 7
  already makes the authority. The vocabulary SHALL point at it rather
  than leaving each session to rediscover that the board cannot answer
  the question — four have now had to.
- IF `T-111`'s disposition work lands first THEN this clause SHALL
  CITE it rather than restate it: the board will then say *dispatchable
  / blocked / fenced* from the joined view, and the status field's job
  shrinks to what it can actually carry.

**ALL FOUR DEPEND ON THE BUMP QUESTION BELOW**, and they look different
under it: six and eight change NORMATIVE sentences (the ceremony table
decides what a pipeline owes; the stop condition decides when it halts),
nine is a clarification plus a documented refusal, and seven is a
clarification of what an existing field already means. Answer them per
item, as the first criterion requires.

## Acceptance criteria

- **THE SIZE-S CEREMONY ROW SHALL BE NARROWED AS RULED**, and the
  boundary SHALL be stated in terms a dispatcher can apply without
  judgement — "touches shipped code" needs to name how it is decided
  (the card's `touches:` against the component registry is the obvious
  mechanism, since a slug already distinguishes `app-*`/`lib-parser`/
  `crate-index` from `method/`, `docs/*` and `tools/e2e`). IF the
  boundary cannot be made mechanical THEN say so and give the dispatcher
  the rule of thumb plus the reason it is not a gate.
- **`review:`'s MEANING SHALL BE CORRECTED IN PROSE WITHOUT ADDING A
  VALUE**: the guarantee is the INFORMATIONAL constraint, the model
  string is provenance, and the figures above SHALL be re-derived at the
  lane's own ref rather than transcribed (a count in a method file is a
  line number by another name).
- **THE BUMP QUESTION SHALL BE ANSWERED FIRST AND IN WRITING**: are
  these CLARIFICATIONS of the existing three moves and the existing
  format — in which case they are prose in `method/` and no version
  moves — or are any of them NEW NORMATIVE SENTENCES, in which case the
  commit is v0.1.6 and carries `METHOD_SNAPSHOT_VERSION`, the
  CONVENTIONS stamp and the Rust const together. The disposition ruling
  looks like the first (nothing about the three moves changed) and the
  proposed-prose rule looks like the second. **State the answer per
  item.**
- IF the version moves THEN all three files SHALL move in ONE commit and
  `cargo test` SHALL be run to prove the stamp pins agree — both of
  them, the CONVENTIONS one and `plan-interview.md`'s. IF it does not
  move THEN the card SHALL say so explicitly, because silence here reads
  as an omission.
- **`method/tasks/TASK-FORMAT.md` SHALL CARRY THE DISPOSITION RULING**
  beside the three triage moves it already enumerates, and it SHALL NOT
  restate the status vocabulary — this tree has exactly one, in
  `lib/parser/src/types.ts`, which the gate READS rather than restates.
- **TASK-FORMAT.md SHALL CARRY THE TITLE RULE**: a title beginning with
  a YAML-reserved indicator is quoted. IT SHALL NAME THE GATE THAT NOW
  CATCHES IT rather than restating the incident's counts.
- **THE DECOMPOSITION RULES SHALL CARRY THE TAUTOLOGY RULE**, beside the
  poison shapes, together with its sibling observation that **two
  criteria on one card can contradict** — the second is what turned the
  first from a style note into a measured defect.
- **THE SUGGESTION-FILE CONVENTION SHALL REQUIRE A PROPOSED REPLACEMENT
  TO CARRY ITS MEASUREMENT OR SAY IT HAS NONE**, in whichever `method/`
  file governs how a finding is written.
- **`method/roles/verifier.md` SHALL SAY THAT A VERIFIER WHO COMMITS TO
  THE BRANCH RE-RUNS WHATEVER GATE ITS OWN COMMITS COULD MOVE**, and
  that in this repository `docs/**` moves the app suite, the parser
  suite, the lane and the cargo suite. The clause SHALL cover the FIGURE
  case as well as the gate case: a count measured at the commit under
  review is stale at the tip the verdict creates.
- **THE THREE-FILE COUPLING SHALL BE NAMED IN THE GOTCHA a `method/`
  editor is looking at**, by SYMBOL — `METHOD_SNAPSHOT_VERSION` in
  `app/src-tauri/src/agent/kit.rs` — so the next card that plans a
  `method/` edit under a docs-only fence learns it from the file rather
  than from a red Rust suite.
- **NO CRITERION HERE SHALL BE SATISFIED BY A SENTENCE THAT NAMES NO
  MECHANISM.** Each of the five is either enforced somewhere (say
  where), or explicitly discipline-only (say so) — the distinction is
  the thing this repository keeps losing.

Verification: headless — `cargo test` from app/src-tauri (the two stamp
pins and the `acl_pin` `methodVersion` assertion), `npm test` from app/,
`npx vitest run` from lib/parser, and `npm test` from tools/e2e, because
the DOCS GATE fires on the CONVENTIONS edit and `method/` is read by the
compiled kit. Record which suites the gate owed and their exits. **The
POISON DRILL applies to any assertion this card changes**, and if the
version const moves, DRILL THE STAMP PINS: change one stamp and require
the RED, read the mutated text back, restore per-path and prove by
sha256 at the drill's own commit. Note that a stamp pin is a CONTAINMENT
assertion with the uniqueness hole T-092 closes — coordinate if both
land in the same window. @human: none.


## Implementation notes — executor, 2026-08-25, lane tip measured at `aea8b9e`

Base `fbae94a`. **Main moved under this lane mid-run**: it was `fbae94a`
at dispatch and is `ca5fb96` now, because **T-091 merged while this card
was being built** — which turns this card's IF/THEN constraint from the
second arm to the first. See "T-091" below.

### THE BUMP QUESTION, ANSWERED FIRST AND PER ITEM — **v0.1.6 IS OWED**

The criterion asks whether these are CLARIFICATIONS of the existing
format (prose, no version move) or NEW NORMATIVE SENTENCES (a three-file
commit). Answered per item, as required:

| # | ruling | reading | moves the version? |
|---|---|---|---|
| 1 | disposition — no fourth move, no ninth status | **clarification**; the three moves are untouched, this says what they already implied | no |
| 2 | a title opening with a YAML-reserved indicator is quoted | **clarification**; YAML already forbids it, the file simply never said so | no |
| 3 | the tautology rule | **new guidance**, in the decomposition rules; guidance is not a format | no, on its own |
| 4 | a proposed replacement carries its measurement | **NEW NORMATIVE** — it adds a requirement to what a suggestion file must carry, which is a format | **YES** |
| 5 | a role that writes to the tree owes the tree's gates | **new normative for the ROLE**; `roles/verifier.md` is not a format file and does not ship in the kit | no |
| 6 | the size-S ceremony row narrows | **NEW NORMATIVE** — the ceremony table decides what a pipeline OWES | **YES** |
| 7 | `review:` means informational independence | **clarification**; no new value, the three stay three | no |
| 8 | the stop condition weighs rather than counts | **NEW NORMATIVE** — it decides when the pipeline HALTS, and it adds an architect waiver that did not exist | **YES** |
| 9 | `verifying` is a lane state | **clarification plus a documented refusal**; no new status, and the obvious repair is explicitly declined | no |
| — | T-088-s1: a criterion names the gate's COMMAND, never its OUTPUT | **new normative guidance** on how criteria are written | contributes |

**Three items independently force it — 4, 6 and 8 — and SIX and EIGHT
would each force it alone**, because they change the two sentences that
decide what a pipeline owes and when it stops. The card's own architect
section predicted exactly this ("six and eight change NORMATIVE
sentences"), and the prediction holds.

**AND THE VERSION HAD ALREADY DRIFTED, WHICH IS A SECOND AND INDEPENDENT
ARGUMENT.** `METHOD_SNAPSHOT_VERSION` was stamped `"0.1.5"` at
**`74a0274`** (T-025). Since then **three** `method/` commits landed —
`677171a` (T-052), `88f75d9` and `1e5c4e9` (both T-089) — and the kit's
fourteen `include_str!` sources grew **23 890 → 25 418 bytes** with the
const never moving. **Every one of those 1 528 bytes is
`method/tasks/TASK-FORMAT.md`** (5 397 → 6 925), derived per-file rather
than inferred from the total: the other five changed `method/` files
(`README.md`, `lane-protocol.md`, `roles/executor.md`,
`roles/integrator.md`, `roles/orchestrator.md`) **are not in the kit at
all**, so they moved `method/` without moving what ships. So v0.1.5 was
already lying about the shipped kit by 1 528 bytes before this card wrote
a line, and TASK-FORMAT.md — the sole drifting file — is the file this
card edits most.

After this card the same fourteen sources total **38 407 bytes**, a
**+12 989** move against `fbae94a`. A version that did not follow that
would not be bookkeeping in arrears; it would be false.

**THE THREE PINNED FILES MOVED IN ONE COMMIT** (`aea8b9e`), as the gotcha
requires: the CONVENTIONS stamp, `plan-interview.md`'s Output heading,
and `METHOD_SNAPSHOT_VERSION`. `cargo test` is **460 passed / 0 failed /
3 ignored, exit 0**, summed over **16** `test result:` lines — identical
to main's reference — so both stamp pins and `acl_pin`'s `methodVersion`
assertion agree at v0.1.6.

### THE BUMP IS NOT A FOUR-PLACE FACT, AND THREE OF ITS PLACES ARE OUTSIDE THIS FENCE

CONVENTIONS' first gotcha called this "a FOUR-PLACE FACT, THREE PINNED
AND ONE NOT". **Derived at `fbae94a` with
`git grep -n "0\.1\.5"`, it is not four.** Three are pinned (the two doc
stamps and the const). The unpinned references are:

- `docs/CONVENTIONS.md`'s own genesis-kit gotcha — **in fence, handled**
- `docs/ARCHITECTURE.md`'s C-01 row, `built (v0.1.5)` — **OUT OF FENCE**
- `docs/architecture/components/C-01-method.md`'s status comment — **OUT OF FENCE**
- `app/src/genesis/genesis-derive.ts`'s `(v0.1.5, T-023)` comment — **OUT OF FENCE**
- twelve `methodVersion: "0.1.5"` FIXTURE literals across five
  `app/test/**` files and `tools/e2e/tests/shell-harness.ts` — **OUT OF FENCE**

**The fixtures and the references want opposite treatment**, which is why
the corrected gotcha states the SHAPE and a derivation command instead of
a tally: a fixture needs *some* version string and moving it is churn; a
reference that CLAIMS the current version goes stale. **None of the
fixtures red at the bump** — verified rather than assumed: each
constructs its own payload and asserts its own literal back, and nothing
compares them to the Rust const. `app` is **962/962** and `tools/e2e`
green at v0.1.6.

The two genuine stale CLAIMS — ARCHITECTURE's C-01 row and C-01's own
file — are **routed as `T-104-s1`, not edited**: `docs/ARCHITECTURE.md`
and `docs/architecture/components/` are outside `touches:`, and a fence
is not widened from inside the lane it fences (lane-protocol rule 5).

**ONE JUDGEMENT MADE AGAINST THE LETTER OF A DELETED INSTRUCTION, DECLARED
RATHER THAN BURIED.** The gotcha said a bump "must hand-update" the
genesis-kit reference `(v0.1.5, T-023)`. Read literally that would make
it `(v0.1.6, T-023)` — but T-023 ratified the banking table at v0.1.5 and
did not ratify anything at v0.1.6, and the sibling suggestion-triage
bullet's `(v0.1.4, T-016)` is plainly a RATIFICATION record that no bump
has ever moved. The two references have identical shape and were being
given opposite treatment. It now reads **`(ratified v0.1.5, T-023 — a
RATIFICATION record …, NOT a claim about the current method version)`**,
which discharges the concern the instruction had (a reader can no longer
mistake it for a current-version claim) without destroying the fact it
carried. Flagged for the verifier as the one place this lane chose the
instruction's purpose over its wording.

### T-091 — IT LANDED MID-LANE, SO ITS READER WAS RUN

At dispatch, `tools/e2e/tests/range-rule.spec.ts` did not exist on main
(`git cat-file -e main:…` exit 128) and the card's second arm applied. It
merged at **`ca5fb96`** while this lane was building, so **the first arm
applies and the reader was run.**

It was run against the **actual merged tree**, not against either side:
`git merge-tree --write-tree ca5fb96 aea8b9e` gives tree
**`82e1194`**, and `git commit-tree` on that tree produced the dangling
commit **`fec416a`** for a detached scratch worktree. **No ref was moved**
— `git commit-tree` writes an object and nothing else, and `main` and the
lane branch were re-read afterwards to prove it.

**RESULT: 25 of 25 `range-rule.spec.ts` lines green.** The bullet's
figures still hold with this card's CONVENTIONS edit in the tree. The
reader printed one DISCLOSURE (GRAPH REGEN's flip figures are right at
their stated ref but the paragraph does not carry its TRIGGER, which has
since gained `.rs`) — disclosed by design, not a failure, and not this
card's to fix.

**THE CONSTRAINT WAS HONOURED THE WHOLE TIME, AND PROVED BY BYTES RATHER
THAN BY INTENT.** The RANGE RULE bullet is **byte-identical** across this
diff: sha256 **`308176748241376b99fbf10153b0299178e977a6c46a89c79afe01ff83a51b33`**
on both sides, and in fact the **entire region from that bullet to EOF**
is byte-identical at **`cafc225d313a14019cc5f32b2e47b54eceec62846f6101887a0e705eeb8a5cc4`**.
The three CONVENTIONS hunks are at old lines **266**, **283–292** and
**376** — all of them above the bullet, which begins at old line 546.

### EVERY FIGURE RE-DERIVED AT THIS LANE'S REF, AGAINST THE CARD'S OWN

**The card carries two figures for one quantity and they disagree.** Both
are attributed to `d43455b`; one is right.

| the card says | at `d43455b`, re-derived | at `fbae94a`, this lane's base |
|---|---|---|
| ruling SIX: "13 of 75 done cards are `self-verified`" | **13 of 75 — CORRECT** | **17 of 88** |
| ruling SEVEN: "of 75 done cards, 56 `same-model`, 5 `independent`, 10 `self-verified`, 1 empty" | **56 / 5 / 13 / 1 — the `self-verified` figure is WRONG** | **65 / 5 / 17 / 1 of 88** |

**RULING SEVEN'S FIGURES DO NOT SUM TO THEIR OWN STATED TOTAL**: 56 + 5 +
10 + 1 = **72**, against the "75 done cards" in the same sentence. The
card's ruling SIX paragraph records that "the architect first transcribed
the stale 10 … and corrected it in the writing" — **the correction was
applied to ruling SIX and never to ruling SEVEN**, and the stale 10 is
still there, three paragraphs down, in a sentence that refutes itself by
arithmetic. This is the card's own first criterion failing inside the card
that writes it, which is the strongest available argument for the rule and
is why the rule is written as **name the COMMAND, never the OUTPUT** and
why **no count from this lane was transcribed into any `method/` file.**

Other figures, all re-derived here:

- **The "clean zero" reproduces exactly.** The five operative phrases
  return **0 occurrences** across `method/` and `docs/CONVENTIONS.md` at
  `8f8ec31` (the card's ref) and again at `fbae94a`. Confirmed, not
  assumed.
- `grep -n "disposition\|closed"` over `method/tasks/TASK-FORMAT.md`
  returned **0** at `fbae94a`, reproducing the card's measurement at
  `4d2f03c`.
- **Board at `fbae94a`: 244 flat task files — 88 done / 37 planned / 41
  parked / 75 suggested / 3 building / 0 verifying / 0 merging**, plus 26
  in `rejected/`; 88+37+41+75+3 = 244. STATE's 38 planned / 2 building at
  `54076fe` differs by exactly this card's own dispatch stamp.
- `review:` over the 88 done cards: **65 `same-model`, 17
  `self-verified`, 5 `independent`, 1 EMPTY** — reproduces STATE exactly.
- **`verifying` reads 0 on the board at both refs while lanes are live**,
  which is ruling NINE observed one more time in the act of writing
  ruling NINE down.

### WHERE EACH RULING LANDED, AND WHETHER IT IS ENFORCED OR DISCIPLINE

The last criterion requires each to be either enforced somewhere (say
where) or explicitly discipline-only (say so). Every clause carries that
sentence in the file itself; summarised:

| ruling | file | enforced or discipline |
|---|---|---|
| 1 disposition | `tasks/TASK-FORMAT.md` | **ENFORCED** — a card-input gate refuses the value at the point of writing (this project's is `DISPOSITION_RULING` in `tools/e2e/scripts/docs-scan.mjs`, pinned in `docs-input-gate.spec.ts`; `method/` names no path, being product-agnostic) |
| 2 title | `tasks/TASK-FORMAT.md` | **ENFORCED** — the same gate, `docs-scan.mjs`'s reserved-indicator message, pinned by `docs-input-gate.spec.ts` |
| 3 tautology | `interview/decomposition.md` | **DISCIPLINE**, and the file says so — with a procedure (try to red it; mutate the CHECK, not the policy) |
| 4 proposed replacement | `tasks/TASK-FORMAT.md` | **DISCIPLINE**, stated — no gate can tell measured prose from confident prose, which is why the author must mark it |
| 5 verifier owes gates | `roles/verifier.md` | **the GATE half is enforceable** by the project's docs gate; **the FIGURE half explicitly never will be**, and the file says so |
| 6 size-S ceremony | `tasks/TASK-FORMAT.md` | **DISCIPLINE with a mechanical path** — read off `touches:`; `method/` cannot draw the code/convention partition (no slugs here), so the project supplies it and until then it is a rule of thumb. This is the criterion's IF/THEN branch, taken deliberately. |
| 7 `review:` | `tasks/TASK-FORMAT.md` | **DISCIPLINE**, stated — nothing can verify a verifier stayed blind |
| 8 stop condition | `tasks/TASK-FORMAT.md` | **DISCIPLINE**, stated — nothing computes "same defect"; the room is the reviewable artifact |
| 9 `verifying` | `tasks/TASK-FORMAT.md` | **documented gap plus a REFUSAL**; the honest reader is the lane list (lane-protocol rule 7) |
| T-088-s1 criterion rule | `tasks/TASK-FORMAT.md` | **DISCIPLINE**, stated |
| T-089-s7 row 5 | `roles/executor.md` | the map is LOCATED (architecture doc + each component's `touch_slugs:`, **field authoritative**) and the PRECEDENCE is named (lane list over board `status:`) |

**THREE COUPLINGS THE RULINGS CREATED WERE FOLLOWED RATHER THAN LEFT.**
Narrowing the size-S row falsifies two sentences elsewhere, and both were
repaired in the same commit: `lane-protocol.md` rule 4 ("once its tests
pass" — an S card with a verifier waits for the VERDICT) and rule 6
("with no verdict to preserve it for" — which is now false for exactly
that row, so the worktree survives). `roles/executor.md` row 11 now asks
the brief to name WHICH ceremony row a size-S card falls on. And
`method/README.md`'s lifecycle line said "Verifier (independent by
default)", the model-diversity reading ruling SEVEN exists to correct.

### THE CRITERION THAT WAS ALREADY MET BEFORE THIS LANE STARTED

**"THE THREE-FILE COUPLING SHALL BE NAMED IN THE GOTCHA … by SYMBOL."**
It already was, at `fbae94a`: the first gotcha names
`METHOD_SNAPSHOT_VERSION`, `app/src-tauri/src/agent/kit.rs` and
`snapshot_version_matches_the_live_method_stamps`. T-089 wrote it. This
lane did not re-add it; it corrected the FOUR-PLACE sentence beside it and
deleted the two sentences that gotcha asked to have deleted once the debt
was paid. Recorded because a criterion that is already satisfied should
be reported as satisfied-and-untouched rather than quietly ticked.

### POISON DRILL

The version bump changes no assertion BODY — `snapshot_version_matches_
the_live_method_stamps` is byte-unchanged — but it changes the values two
of its asserts read, so it is drilled.

- **Where**: a detached scratch worktree at `aea8b9e`, named for this
  lane, **outside the repository**, with its own `CARGO_TARGET_DIR`
  inside it.
- **Mutated**: ONE PRODUCER — `docs/CONVENTIONS.md`'s stamp, v0.1.6 back
  to v0.1.5, with the const left at 0.1.6. **The assertion was never
  touched**; `git diff --name-only` in the drill listed
  `docs/CONVENTIONS.md` and nothing else, and the mutated text was read
  back with `git diff` BEFORE the run.
- **Result: RED, exit 101**, panicking at `kit.rs:450` with *"docs/
  CONVENTIONS.md no longer says 'currently v0.1.6' - bump
  METHOD_SNAPSHOT_VERSION with the method"*.
- **It reached the CONVENTIONS arm**, which is the ordered-asserts trap
  the gotcha documents: mutating CONVENTIONS alone passes the
  plan-interview arm first, so the second assert is genuinely exercised
  rather than shadowed.
- **Restored and proved per path by sha256**, all three matching the
  pre-mutation baselines: `docs/CONVENTIONS.md` `b0528df4…`,
  `method/interview/plan-interview.md` `86053229…`,
  `app/src-tauri/src/agent/kit.rs` `8a56ccc5…`. The drill worktree was
  clean afterwards apart from its own target dir.

### SUITES AND GATES — every exit read unpiped from its own `$?`

- **`cargo test --no-fail-fast` from `app/src-tauri`: 460 passed / 0
  failed / 3 ignored, exit 0**, SUMMED over **SIXTEEN** `test result:`
  lines, count DERIVED. Lib suite **4.00s** — the GREEN band (T-088-s4's
  clock test separates green under 9.5s from red over 14.6s), as expected
  for this lane's own fresh target dir. **Both known intermittents read
  BY NAME, not inferred from a green exit**:
  `docs_watch::tests::startup_arm_watches_the_initial_root` `ok`, and
  `a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
  `ok`. ONE run; nothing to declare.
- **parser: `npx vitest run` — 268/268 across 12 files, exit 0** (after
  `npm run build` from `lib/parser`, which was run FIRST per the
  fresh-clone ORDER).
- **app: `npm run build` exit 0, `npm test` — 962/962 across 46 files,
  exit 0.** The build was run before the suite and after the parser
  build, so the TS2339 trap STATE documents never arose.
- **DOCS GATE: exit 1, FIRES**, run DIRECTLY from the repo root with the
  RANGE RULE's own path list and **never through `xargs`**. It reports
  **12 derived docs readers across 4 suites, 0 frontmatter issues**, and
  it owes **TWO** suites on this diff — `cargo test from app/src-tauri/`
  and `npm test from tools/e2e/` — because the one path under `docs/` in
  the diff is `docs/CONVENTIONS.md`. Both were run. **The card's own
  Verification section predicted FOUR suites and the gate says two**; the
  parser and app suites were run anyway and are green, so the difference
  costs nothing here, but it is the card's own "ask the gate, never
  predict the output" rule failing in the card's own closing paragraph.
- **GRAPH REGEN: FIRES, AND THE GRAPH IS STALE — exit 1.** The trigger is
  `*.ts/*.tsx/*.js/*.jsx` or `*.rs` outside `docs/`, and this diff
  carries one `.rs` file. **ASKED rather than predicted**, twice, and the
  answer is the same both times: **exit 1, STALE**. It is a REAL stale
  read off the SECOND line as this project's own trap requires — it
  prints both counts and a `~` file diff rather than
  `committed: MISSING`:

      committed:   925217 bytes · 178 files · 1968 symbols · 1886 edges
      fresh index: 925217 bytes · 178 files · 1968 symbols · 1886 edges
      files  +0  -0  ~1
      | ~ app/src-tauri/src/agent/kit.rs  (content)

  **EVERY HEADLINE COUNT IS IDENTICAL AND ONLY THE `~` LINE DIFFERS** —
  T-033's checkpoint finding, reproduced here by a **ONE-CHARACTER**
  change (the `5` of `"0.1.5"` becoming a `6` inside an existing
  `const`). A session that confirmed the graph by comparing byte, file,
  symbol and edge counts would ship a stale graph with **no figure
  capable of showing it**. This is the sharpest available instance of
  that rule and it is worth carrying forward: it did not need a
  reconciliation or a fixture move, only one byte inside an indexed file.
  **THE REGEN IS NOT THIS LANE'S TO COMMIT**: CONVENTIONS puts it on the
  INTEGRATOR at the CHECKPOINT, and `docs/architecture/graph.json` is
  outside `touches:` besides. **Flagged LOUDLY here rather than left
  silent, per that bullet's own instruction** — the integrator owes a
  regen, and must ask the gate AFTER its last write rather than after its
  first.
- **BOOT GATE: FIRES, exit 0** — the diff touches `app/src-tauri/**`. Run
  in this lane's own worktree on scratch port **15299**, `lsof`-read free
  before and after. **BOTH `[nputer]` lines observed**: `[nputer] project
  folder: /Users/ujju/Projects/nputer-T-104` and `[nputer] window "main"
  created`. The folder line confirms it opened its OWN checkout, not the
  human's. Child pid 43691, process tree stopped on SIGTERM; no orphan.
- **E2E lane: TWO RUNS, BOTH DECLARED, and the first red is a KNOWN
  intermittent identified by its signature rather than by re-running
  until green.** Run against the MERGED tree in the forecast worktree —
  the only tree holding both T-091's reader and this card's edits — on
  scratch port **15297**, chosen after `lsof` showed **15298 already held
  by another lane**, which is the check earning its keep.
  **RUN 1: 170 passed, 1 failed, exit 1.** The failure is
  `tools/e2e/tests/token-scan.spec.ts:201`, and it is **`T-120-s3`**,
  matched on STATE's own stated signature — a FRACTIONAL millisecond
  against a WHOLE number:

      Expected: 1787668190199.766
      Received: 1787668190200

  The forecast worktree was minutes old, which is precisely the
  "red exactly once in every fresh checkout" condition; `.766` rounds to
  `200`, which is the documented rounding mechanism (`Stats.mtime` is a
  `Date` and holds whole milliseconds), and the failure repairs the
  condition that caused it. **It is not this card's change**: nothing in
  this diff touches `tools/e2e`, and the diff is byte-disjoint from that
  spec.
  **RUN 2: 171 passed, 0 failed, exit 0.** Run once, deliberately, and
  declared — to confirm the "green forever after" half rather than to
  manufacture a green. 170 + 1 on run 1 against 171 + 0 on run 2 is the
  finding's own predicted arithmetic, and the owed suite is green.
  **T-091's `range-rule.spec.ts` is 25 of 25 in both runs.**

**PORT 1420 WAS READ ONCE, READ-ONLY, AND NOTHING ELSE.**
`lsof -nP -iTCP:1420 -sTCP:LISTEN` returned `node` pid **88948**, one
socket `TCP [::1]:1420 (LISTEN)`. No bind, no connect, no signal. That is
a live-environment fact and is already stale for you.

### WHERE THE CARD AND THE BRIEF WERE WRONG

Named plainly, because a brief nobody contradicts is a brief that gets
copied — and because this card is *about* stale and unverified writing.

1. **RULING SEVEN'S FIGURES ARE STALE AND SELF-REFUTING.** "56
   `same-model`, 5 `independent`, 10 `self-verified`, 1 empty" of "75 done
   cards" sums to **72**. Re-derived at the card's own `d43455b`, the
   `self-verified` figure is **13**, and 56+5+13+1 = 75. The card's ruling
   SIX paragraph says the architect caught the stale 10 while writing —
   **it was corrected in ruling SIX and left uncorrected in ruling
   SEVEN.** This is the card's own first criterion failing inside the card
   that writes it, and it is the single best argument for the rule.
2. **"The four `review:` values do not change" — there are THREE.**
   `independent | same-model | self-verified`. The fourth thing on the
   board is the EMPTY field on T-056, which is an absence, not a value.
   The clause as written was still honoured (nothing was added).
3. **The card cites "the first criterion" for the bump question TWICE**
   (the drafter's note and the architect's 2026-08-25 section) — **the
   bump question is the THIRD criterion.** The brief inherited this and
   repeated it. Harmless, and worth fixing before the next reader plans
   around criterion 1.
4. **The card's Verification paragraph predicts FOUR suites; the gate says
   TWO.** It names `cargo test`, `npm test` from app/, `npx vitest run`
   from lib/parser and `npm test` from tools/e2e. `docs-gate.mjs` on this
   diff's own path list owes **`cargo test` and `npm test from tools/e2e/`
   only**, because the sole `docs/` path in the diff is
   `docs/CONVENTIONS.md`. All four were run and all four are green, so it
   cost nothing — but it is *"name the gate's COMMAND, never its OUTPUT"*
   violated in the closing paragraph of the card that writes that rule.
5. **"THE DECOMPOSITION RULES SHALL CARRY THE TAUTOLOGY RULE, beside the
   poison shapes" cannot be honoured literally**: `grep -ri poison
   method/` returns **0**. The poison shapes live in
   `docs/CONVENTIONS.md`'s POISON DRILL bullet, which is product-specific.
   The rule went into `interview/decomposition.md` step 3, where criteria
   are actually written, which is what "the decomposition rules" names.
6. **One criterion was already satisfied before the lane started.** The
   three-file coupling was already named by symbol in the gotcha at
   `fbae94a` — T-089 wrote it. Reported as satisfied-and-untouched rather
   than quietly ticked.
7. **THE T-091 CONSTRAINT FLIPPED ARMS MID-LANE, WHICH NEITHER THE CARD
   NOR THE BRIEF ANTICIPATED.** Both frame it as a question with one
   answer to be checked once ("check, do not assume"). Checked at
   dispatch, T-091 had NOT landed (`git cat-file -e
   main:tools/e2e/tests/range-rule.spec.ts` → exit 128); it merged at
   `ca5fb96` while this lane was building. **The instruction to check
   rather than assume was right and is what caught it** — but the honest
   generalisation is that a live repository fact needs re-checking AT
   HANDOFF, not only at dispatch, exactly the way STATE says a pid or a
   port holder does. Both arms were ultimately exercised: the bullet was
   left untouched (arm 2's requirement) *and* the reader was run (arm 1's).
8. **THE BRIEF WAS RIGHT ABOUT RULING NINE**, and says several briefs that
   night were not. This one correctly instructed `status: verifying` in
   the lane with `verifier:`, `verified_by:` and `review:` left empty,
   which is what `method/roles/executor.md` and this card both require.
   Recorded because the correction clause cuts both ways.
9. **Every other figure the brief carried reproduced exactly**: the kit's
   23 890 → 25 418 bytes across three `method/` commits; cargo's 460/0/3
   over 16 lines with the lib suite near 4.06s (4.00s here); the clean
   zero at `8f8ec31`; the `T-120-s3` fractional-millisecond signature; and
   the warning that a stale graph can hide behind identical headline
   counts, which this lane then reproduced with a one-character change.

### WHAT I AM LEAST CONFIDENT ABOUT

- **The size-S boundary is the weakest of the nine**, and it is weak by
  construction rather than by drafting. `method/` is product-agnostic, so
  it cannot name the slugs that would make the partition mechanical; the
  criterion's IF/THEN branch was taken honestly, but the result is that a
  dispatcher still exercises judgement on the one ruling whose whole
  point was to remove judgement. **The repair is one sentence in the
  PROJECT's conventions** naming which slugs ship — filed as `T-104-s2`.
- **Ruling NINE now has two homes** — the reach clause in TASK-FORMAT.md
  and the stamp instruction in `roles/executor.md` — and the card's own
  IF clause says that if `T-111`'s disposition work lands first, this
  clause SHALL CITE it rather than restate it. **`T-111` has not landed**,
  so the clause is written standalone; whoever lands T-111 should collapse
  it rather than leave two descriptions of one thing.
- **`method/runtime/nputer.yaml`'s `verifier: claude # resolver default:
  independent of builder` was left alone.** It reads as the
  model-diversity framing ruling SEVEN corrects, but it is a *session*
  default and is compatible; it also ships in the kit, so touching it has
  a cost. Left, and named here rather than silently.

### Findings filed

- **`T-104-s1`** — the method version is CLAIMED in `docs/ARCHITECTURE.md`'s
  C-01 row and in `docs/architecture/components/C-01-method.md`, both
  outside this fence, both stale at v0.1.6. Names what is deliberately
  NOT owed (the `methodVersion` fixtures) and why.
- **`T-104-s2`** — the narrowed size-S row is mechanical only once this
  project names which slugs SHIP; `tools/e2e` is the case that will be
  misread, and `non_code:` is a different axis and must not be reused.

### THE TWO EDITS T-091'S CHECKPOINT ROUTED HERE — DECLINED, WITH REASONS, NOT DROPPED

T-091's checkpoint routed two earned `docs/CONVENTIONS.md` edits to this
card because **this card holds that file**. It does. **It is also
forbidden the paragraph both edits live in**, and the routing was computed
from fence ownership, which cannot see that.

Derived at `aea8b9e`: the RANGE RULE bullet spans lines **558–730**.

| routed edit | where it lands | verdict |
|---|---|---|
| `T-091-s3`'s trigger-beside-the-ref clause | the GRAPH REGEN flip figures at lines **667, 682, 686, 688, 713** — the bullet's **flip list** | **DECLINED**, named verbatim in this card's prohibition |
| the `bdada11` sharpening | line **659**, *"a command substitution that swallows it hands you an EMPTY forecast…"* — one of the bullet's **command recipes** | **DECLINED**, also named verbatim |

This card's constraint is *"SHALL NOT edit the RANGE RULE bullet, its
figures, its flip lists, or its command recipes."* Both edits are inside
two of those four named categories, so taking either would breach the
card's own hard constraint — the one written specifically to protect
T-091's reader. **Left routed and filed as `T-104-s3`.**

**BOTH ARE CORRECT AND BOTH SHOULD LAND.** This lane confirmed the
`bdada11` sharpening first-hand while obeying it — `merge-tree`'s exit was
read from `$?` BEFORE the substitution, exit 0, tree `82e1194` — and
T-091's own reader printed the trigger disclosure during this lane's run,
so `T-091-s3`'s residue is observed rather than theoretical.
**The reason for the prohibition is now spent**: it existed because T-091
was approved and unintegrated, and T-091 merged at `ca5fb96`. The next
`docs/CONVENTIONS.md` card carries no such clause and should take both.

**THE GENERAL FINDING IS WORTH MORE THAN THE TWO EDITS** and is why
`T-104-s3` exists rather than a note here: **a fence names PATHS, and this
project has begun writing prohibitions at a finer grain than a path.**
Routing by "which lane holds this file" will keep producing routings that
are correct at the fence and impossible at the card, and the failure is
silent — the receiving lane finds it only by reading its own card closely.

## VERDICT — APPROVED — adversarial verifier, claude-opus-5, 2026-08-25

Branch `task/T-104-method-snapshot`, tip **`51fb002`** (`git rev-parse`,
confirmed). Verified from a detached worktree at
`/Users/ujju/Projects/nputer-T-104-verify`, cut from the lane tip,
outside the repository. **Every figure below re-derived at `51fb002`,
not at `aea8b9e`** — which is what turned up the two stale figures in
section D.

**BOUNDED READ, DECLARED.** The card was read at its BASE REF
(`git show fbae94a:docs/tasks/T-104-…md`) at **15:05Z**, and the attack
set was written down at **15:06Z**, before the lane's diff, notes or
findings were opened. Nine rulings were derived from the card in my own
words for semantic search, plus **two obligations the brief never
mentioned** — T-088-s1's criterion rule and T-089-s7's ROW 5 residual.

### A. RANGE — 13 paths, and my ref is not the brief's

`merge-tree --write-tree` exit read from `$?` **before** substitution:
**exit 0**, tree `be67d6e`.

    MAIN=eea61e0   (NOT the brief's 540ae0f — main moved; T-116 merged)
    prescribed:  13 paths
    forbidden `main..HEAD`:  34 paths, of which 11 are PHANTOM DELETIONS

The brief measured 29 under the forbidden form at `540ae0f`; at
`eea61e0` it is **34**, a 2.62× drift. The phantom deletions include
T-091's `range-rule.mjs` and `range-rule.spec.ts` and T-130's card —
main's advance appearing as deletions through a drifted left endpoint.
**The lane deletes nothing.** All 13 paths are inside
`[method/, docs/CONVENTIONS.md, app-agent]` plus the card's own
`docs/tasks/T-104*` files.

### B. THE RULINGS — read for MEANING, never for the card's phrasing

All nine land, plus both unlisted obligations. **None is wider than
ratified.** Located by reading, not grepping:

| # | landed in | verdict |
|---|---|---|
| 1 disposition | TASK-FORMAT.md | EXACT — keeps `status: suggested`, discharge in its own body, disposition is triage's |
| 2 title/YAML | TASK-FORMAT.md | EXACT + enumerates the reserved indicators; no incident counts restated |
| 3 tautology | decomposition.md step 3 | EXACT + adds the "try to red it" procedure and the two-criteria-contradict sibling |
| 4 proposed prose | TASK-FORMAT.md | EXACT |
| 5 role owes gates | verifier.md rule 7 + new section | EXACT, and the FIGURE case is explicit |
| 6 size-S ceremony | TASK-FORMAT.md table + prose | correct; IF/THEN branch taken (see C) |
| 7 `review:` | TASK-FORMAT.md | EXACT, and it **corrects the card**: "The three `review:` values" |
| 8 stop condition | TASK-FORMAT.md | EXACT — all four sub-clauses, including the dispatcher-conflict IF |
| 9 `verifying` lane-state | TASK-FORMAT.md + executor.md | EXACT — refusal documented, worktree list named |
| T-088-s1 | TASK-FORMAT.md | EXACT — **and obeys itself**: it states no count |
| T-089-s7 ROW 5 | executor.md row 5 | **SATISFIED** — map located AND precedence named |

**Attacks that found nothing, reported because they found nothing:**

- **Did landing ruling NINE restate the status vocabulary** (criterion 5
  forbids it)? **No** — the lane added no vocabulary listing.
- **Did any census count get transcribed into `method/`?** **No.** Every
  numeral in the added method text is a structural reference (rule 4/6/7,
  step 8, row 5/11) or the version stamp. The ruling is applied to itself.
- **Did anything add a status or a stamp-earlier fix** (both REFUSED by
  ruling NINE)? **No.**
- **Is ruling NINE's `T-111` IF clause owed?** **No** — T-111 returned to
  `planned` at `29c0f4f`; antecedent false. The lane flagged it correctly.

### C. THE DECLINE — CORRECT, and the routing seat is the real finding

Measured independently at `51fb002`: the RANGE RULE bullet starts at
**558** and the next top-level bullet (GRAPH REGEN) at **731**, so it
spans **558–730** — the lane's figure exactly. At base `fbae94a` the
same span is **546–718**. Line **659** is the command-recipe sentence
*"an EMPTY forecast wearing the costume of a clean gate"*; **667, 682,
686, 688, 713** are the GRAPH REGEN flip figures. Both routed edits land
inside two of the four categories the prohibition names verbatim.

**RULED: the decline is CORRECT, not over-cautious.** There is no
reading under which those edits sit outside "its flip lists, or its
command recipes". The prohibition honoured, **proved by bytes rather
than intent** — both sha256 claims reproduce:

    RANGE RULE bullet   308176748241376b99fbf10153b0299178e977a6c46a89c79afe01ff83a51b33
    bullet → EOF        cafc225d313a14019cc5f32b2e47b54eceec62846f6101887a0e705eeb8a5cc4

**On "a fence names paths, never paragraphs":** a real gap, and narrow.
Two instances exist (this card, and T-091 forbidden the file it wrote a
reader for). `T-104-s3` is right to put the repair at the routing seat
rather than in the fence format.

**The card's IF/THEN was honoured on the arm that actually applied.**
T-091 merged mid-lane, so the reader was owed and was run. I ran it too,
against the merged content — and did **not** need a `commit-tree`
checkout, because the equivalence is provable by sha256: the merged
tree's `docs/CONVENTIONS.md` is byte-identical to the lane's
(`b0528df4…`) and the merged tree's reader is byte-identical to main's
(`47190eec…`), since main never touched CONVENTIONS and the lane never
touched `tools/e2e`. **Result: 25 passed, exit 0** — and the reader
printed exactly the trigger-beside-the-ref DISCLOSURE the lane reported,
which is `T-091-s3`'s own subject. The residue is observed, not theoretical.

### D. TWO FIGURES ARE STALE AT THE HANDOFF TIP — ruling FIVE, biting its author

Both were measured at `aea8b9e` and both moved when `51fb002` committed
notes, findings **and three `method/` files**. The notes header names
`aea8b9e`, which is ruling FIVE's second arm ("or name the ref you
measured at"), so this is a disclosure rather than a breach — but it
labels `aea8b9e` as "lane tip" when the tip is `51fb002`.

**D1 — THE DOCS GATE OWES FOUR SUITES, NOT TWO, AND THE CARD WAS RIGHT.**
Run at the merged tree from the repo root, prescribed spelling, no
`xargs`: **exit 1, FIRES**, 12 derived readers across 4 suites, 0
frontmatter issues, and **5 paths under `docs/` are code inputs** — not
one. The four T-104 cards joined `docs/CONVENTIONS.md` the moment the
notes commit landed. Owed:

    cargo test from app/src-tauri/ · npm test from app/
    npm test from tools/e2e/ · npx vitest run from lib/parser/

The notes say the gate "owes **TWO**" and use that to charge the card
with predicting four — *"the card's own 'ask the gate, never predict the
output' rule failing in the card's own closing paragraph."* **At the tip
this lane hands over, the gate says FOUR and the card's Verification
section named exactly those four.** The charge is refuted at the merge.
The card is still open to the narrower criticism that it predicted at
all; it is not open to the one filed. **Correct notes item 4.**

**D2 — THE KIT BYTE TOTAL.** `38 407` is right at `aea8b9e` (I reproduce
it exactly) and is **38 471** at `51fb002`, because the notes commit
edited `TASK-FORMAT.md`. The delta against base is **+13 053**, not
+12 989. The bump argument is unaffected — `23 890 → 25 418` and
TASK-FORMAT's `5 397 → 6 925` (+1 528, all of it) both reproduce exactly.

**Neither defect cost anything substantive: all four suites were run and
all four are green at `51fb002`**, which I re-measured rather than
inherited.

### E. TWO WRONG SENTENCES IN THE FINDINGS — both in-fence, both actionable

**E1 — `T-104-s2` NAMES A LOCATION THAT DOES NOT EXIST.** It says the
missing sentence *"belongs in `docs/CONVENTIONS.md` beside the slug
map"*. **There is no slug map in `docs/CONVENTIONS.md`** — `grep -n slug`
returns two hits, both the `task/T-NNN-<slug>` branch spelling, a
different sense of the word. The slug map is `docs/ARCHITECTURE.md`'s
block plus each component's `touch_slugs:`, exactly as **this lane's own
`executor.md` row 5 edit now states**. The finding contradicts the ruling
it rides beside, and it is the shape of **ruling FOUR** — proposed prose
carrying no measurement. Consequence: s2's proposed fence
`[docs/CONVENTIONS.md]` is likely wrong; the right fence is s1's.
**s1 and s2 can ride one card.**

**A cheaper repair than s2 proposes, derived from the registry:** all 13
components carry `touch_slugs:`, and the only `[]` is C-01 (`method/`).
Every other slug ships. `tools/e2e`, `docs/**` and `.github/` have no
component at all — so **s2's own trap case falls out for free**: the
partition needs neither a new field nor a prose list, only *"a `touches:`
entry that is a registry slug is shipped code; a bare path is not."*
s2 offers only "add a field or write the prose list" and misses this.
**s2's warning about `non_code:` is correct and well-founded** — C-11
carries `non_code: true` and two slugs, so it is provably a different axis.

**E2 — "TWELVE `methodVersion` FIXTURE LITERALS" IS ELEVEN.** Derived at
`51fb002`: `methodVersion: "0.1.5"` appears **11** times across the five
`app/test/**` files and `shell-harness.ts` (the file list is right); two
further lines are `expect(...).toBe("0.1.5")` assertions, giving 13 if
counted. Neither is 12. The substance of `T-104-s1` is untouched — but
the corrected CONVENTIONS bullet this lane wrote says **"DERIVE THE LIST,
NEVER QUOTE IT"** and "deliberately states no count", and the finding
beside it quotes a wrong one.

### F. WHAT I COULD NOT BREAK

**`T-104-s1` IS TRUE AND THE INTEGRATOR MUST ACT ON IT.** Both claims
verified at `51fb002`: `docs/ARCHITECTURE.md:18` reads
`built (v0.1.5)` and `docs/architecture/components/C-01-method.md:9`
reads `# pinned: built and versioned (v0.1.5)`. **This merge ships two
newly-false statements.** Both are outside `touches:`; declining to widen
the fence was right (lane-protocol rule 5).

**THE GENESIS-KIT JUDGEMENT IS SOUND.** The lane overrode a written
instruction (*a bump "must hand-update"* the `(v0.1.5, T-023)`
reference) and reinterpreted it as a ratification record. The analogy it
rests on holds: `(v0.1.4, T-016)` sits in the same file at a version two
bumps stale and has never moved. Declaring it rather than burying it was
the right call.

**THE DRILL REPRODUCES, INCLUDING THE SHADOWING CLAIM.** Three mutations,
in my own worktree, assertion bodies never touched:

| # | mutation | result |
|---|---|---|
| 1 | CONVENTIONS `v0.1.6`→`v0.1.5`, const left at 0.1.6 | **RED, exit 101, `kit.rs:450:9`** — the CONVENTIONS arm |
| 2 | plan-interview `v0.1.6`→`v0.1.5` only | **RED, exit 101, `kit.rs:443:9`** — arm 1 |
| 3a | const only, `0.1.6`→`0.1.7` | **RED, exit 101, `kit.rs:443:9`** |
| 3b | then fix ONLY the file the panic named | **RED, exit 101, `kit.rs:450:9`** — a SECOND red, not a green |

**The shadowing claim is CONFIRMED and the drill proves what it claims.**
The asserts are ordered — plan-interview at 443, CONVENTIONS at 450 — so
mutating CONVENTIONS alone passes arm 1 and genuinely exercises arm 2.
Drill 3 additionally verifies the CONVENTIONS gotcha's own sentence
about const-only bumps yielding a second red. **Restored per path,
proved by three matching sha256** (`b0528df4…`, `86053229…`,
`8a56ccc5…`), worktree clean.

**THE ARITHMETIC.** Derived independently at three refs:

| ref | done | same-model | independent | self-verified | empty |
|---|---|---|---|---|---|
| `d43455b` | **75** | 56 | 5 | **13** | 1 |
| `fbae94a` | **88** | 65 | 5 | 17 | 1 |
| `eea61e0` | **89** | 66 | 5 | 17 | 1 |

**Ruling SEVEN is self-refuting exactly as reported**: 56+5+10+1 = **72**
against its own "75 done". The true `self-verified` at `d43455b` is
**13**, and ruling SIX's "13 of 75" is **right** — so the architect's
correction was applied to SIX and never to SEVEN. **The lane's own
re-derivation (88 — 65/17/5/1 at `fbae94a`) reproduces exactly.**

**SUITES AND GATES — every exit from `$?`, unpiped; counts derived.**

| suite / gate | result | exit |
|---|---|---|
| `cargo test --no-fail-fast` (app/src-tauri) | **460 passed / 0 failed / 3 ignored**, summed over **16** `test result:` lines | **0** |
| lib suite clock | **3.98s** — GREEN band (<9.5s) | — |
| `npx vitest run` (lib/parser) | **268/268**, 12 files | **0** |
| `npm run build` (app) | after the parser build | **0** |
| `npm test` (app) | **962/962**, 46 files | **0** |
| `npm test` (tools/e2e) run 1 | 145 passed, **1 failed** | **1** |
| `npm test` (tools/e2e) run 2 | **146 passed** | **0** |
| `range-rule.spec.ts` vs merged content | **25/25** | **0** |
| DOCS GATE | **FIRES**, 4 suites owed (see D1) | **1** |
| GRAPH REGEN | **STALE** | **1** |
| BOOT GATE (port 15296) | both `[nputer]` lines, no orphan | **0** |

`lib/parser` was built FIRST; the TS2339 trap never arose. Both watched
intermittents read **BY NAME**, not inferred from a green exit:
`docs_watch::tests::startup_arm_watches_the_initial_root` `ok` and
`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
`ok`. No `cargo clean`.

**BOTH E2E RUNS DECLARED.** Run 1's single red is `token-scan.spec.ts:201`
= `T-120-s3`, identified by STATE's signature rather than by re-running
until green — `Expected: 1787670420302.8657` against
`Received: 1787670420303`, a fractional millisecond against a whole
number, in a minutes-old checkout. **Note the count: the lane's tree is
146, not 171.** 171 is the MERGED count (146 + T-091's 25) and the lane
says so; the brief's bare "171/171" hides both the merge and the two runs.

**GRAPH REGEN — THE ONE-CHARACTER STALE, REPRODUCED EXACTLY:**

    committed:   925217 bytes · 178 files · 1968 symbols · 1886 edges
    fresh index: 925217 bytes · 178 files · 1968 symbols · 1886 edges
    files  +0  -0  ~1
    | ~ app/src-tauri/src/agent/kit.rs  (content)

Every headline figure identical; only the `~` line differs — from the
`5` of `"0.1.5"` becoming a `6`. **A session that confirmed the graph by
comparing byte, file, symbol and edge counts would ship a stale graph
with no figure capable of showing it.** `graph.json` is outside
`touches:` and CONVENTIONS puts the regen on the INTEGRATOR at the
checkpoint: **correctly flagged, correctly not taken.**

Port **1420** was read once with `lsof`, read-only: `node` pid **88948**,
one socket `TCP [::1]:1420 (LISTEN)`. No bind, no connect, no signal.

### G. WHAT THE CARD GOT WRONG — including four the lane did not catch

Confirmed from the lane's list: ruling SEVEN's figures (G/above);
*"the four `review:` values"* — `REVIEW_MODES` in
`lib/parser/src/types.ts` holds **three**, and the lane corrected it in
the landed prose; *"beside the poison shapes"* is **unbuildable**,
`grep -ri poison method/` returns **0** and the poison shapes live in
`docs/CONVENTIONS.md` (6 hits) — `interview/decomposition.md` step 3 was
the right home; and the three-file coupling was **already satisfied at
`fbae94a`** by T-089, correctly reported as satisfied-and-untouched.

**New, and the lane did not catch these:**

1. **"THE FIRST CRITERION" IS CITED THREE TIMES, NOT TWICE, AND THEY DO
   NOT ALL MEAN THE SAME CRITERION.** Base lines **44** and **361** cite
   it for the bump question, which is the **THIRD**. Base line **237**
   cites it for transcribing a stale count — that is the **SECOND**
   ("figures SHALL be re-derived … rather than transcribed"). The lane
   and the brief both said "twice", and both missed that one of the three
   points somewhere else entirely.
2. **CRITERION 5's UNIQUENESS CLAIM IS FALSE.** It asserts *"this tree
   has exactly one [status vocabulary], in `lib/parser/src/types.ts`"*.
   **`method/tasks/TASK-FORMAT.md:15` restates it** —
   `status: planned  # suggested | planned | building | verifying | …` —
   byte-identical at base, so the criterion is premised on a false claim
   about the very file it governs. The lane added nothing, so the
   operative half is satisfied; the premise is still wrong.
3. **CRITERION 11 SAYS "EACH OF THE FIVE" WHEN THERE ARE NINE.** The
   title was corrected five → NINE and this numeral was not.
4. **THE CARD'S OWN "CLEAN ZERO AT `8f8ec31`" IS A PHRASE-MATCH.** All
   five shorthand phrases do return 0 there — I reproduce it — but a
   phrase-match is not an absence test, which is the trap the brief warns
   about and the card commits. The conclusion happens to hold; the method
   does not support it. **The lane's fix is the honest counter-move**: it
   added the literal phrase *"informational independence"* to
   TASK-FORMAT.md, so the next such search finds meaning where the card
   only found words.

### H. WHERE THE BRIEF WAS WRONG — five, and one is a fabrication

1. **"THE LANE NOTES ITS OWED-SUITE COUNT WENT 2 → 4 … AND IT RE-RAN
   EVERYTHING AT THE FINAL TIP. VERIFY IT DID."** **It does not, and it
   did not.** The card records **TWO** throughout and contains no 2→4
   discussion and no final-tip re-run. I found the 2→4 move myself (D1)
   by running the gate at `51fb002`. The brief credited the lane with an
   observation it never made — the most consequential brief error here,
   because it would have had a verifier tick a box instead of running
   a gate.
2. **"89 done — 66 same-model / 17 self-verified / 5 independent /
   1 empty"** attributed to the lane's re-derivation. **The lane never
   claims this.** It re-derived at `fbae94a`: **88 — 65/17/5/1**, which I
   confirm exactly. 89/66/17/5/1 is correct at main `eea61e0` — it is the
   *brief's own* measurement, wearing the lane's name and carrying no
   ref. That is ruling FIVE's FIGURE case committed in the brief that
   commissions ruling FIVE.
3. **"The card cites 'the first criterion' twice; it is the third."**
   Three times, and one of them is the second. See G1.
4. **"13 paths … the forbidden two-dot form gives 29."** 13 reproduces at
   my ref, but the forbidden form now gives **34** with **11** phantom
   deletions. The brief's `540ae0f` is two merges stale.
5. **"lane reports … lib 4.13s"** — the notes say **4.00s** (main's
   reference is 4.06s). I measured **3.98s**. Minor, but this card is
   about transcribed figures.

**The brief was RIGHT about the thing it flagged hardest**: measuring
these rulings by phrase would have produced a false negative. Ruling
NINE and EIGHT are at `TASK-FORMAT.md:232`/`:254` in the executor's own
wording, and reading for meaning is what found them.

### I. REQUIRED CORRECTIONS — none blocking, all inside the fence

1. Notes item 4: the docs gate owes **FOUR** at `51fb002`; withdraw the
   charge against the card's Verification section (D1).
2. Notes: kit total **38 471** at the tip, delta **+13 053** (D2).
3. `T-104-s2`: strike *"beside the slug map"* — CONVENTIONS has none;
   name `docs/ARCHITECTURE.md` + `touch_slugs:`, revisit the proposed
   fence, and add the registry-derived option (E1).
4. `T-104-s1` and notes: **eleven** fixture literals, not twelve (E2).

**FOR THE INTEGRATOR:** the GRAPH REGEN is owed at the checkpoint and
must be asked AFTER the last write, not the first. `T-104-s1` is
verified true — `docs/ARCHITECTURE.md`'s C-01 row and
`C-01-method.md`'s status comment ship stale at v0.1.6 and need a fence
this card never held.

**APPROVED.** The nine rulings say what was ratified and no more, the
bump is correct in all three pinned places and survives four mutations,
the hard prohibition was honoured to the byte, and every suite and gate
is green or correctly disclosed at the tip I measured. What I found is a
record that is stale in two figures and two findings that carry an
unmeasured sentence each — on a card whose whole subject is exactly
that, which is the most useful place for it to happen.

*Verified by claude-opus-5 as an independent adversarial session, from
the card and the diff. `verifier:`, `verified_by:` and `review:` are
deliberately left unstamped — they are the integrator's.*
