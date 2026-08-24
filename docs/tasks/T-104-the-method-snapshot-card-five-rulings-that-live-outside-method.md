---
id: T-104
title: Five ratified rulings live everywhere except the file that ratifies them — the method-snapshot card, dispatched with the fence a method bump actually needs
feature: F-01
milestone: 4
priority: 60
size: M
status: planned
blocked_by: []
touches: [method/, docs/CONVENTIONS.md, app-agent]
builder:
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

**BOTH DEPEND ON THE BUMP QUESTION BELOW**, and the two look different
under it: six changes a NORMATIVE sentence (the ceremony table decides
what a pipeline owes), while seven is a clarification of what an
existing field already means. Answer them per item, as the first
criterion requires.

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
