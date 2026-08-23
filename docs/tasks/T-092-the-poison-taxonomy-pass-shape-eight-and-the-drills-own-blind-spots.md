---
id: T-092
title: The poison taxonomy pass — a containment pin with no uniqueness floor, three unnumbered shapes, and four places the drill's own procedure cannot fail
feature: F-06
milestone: 4
priority: 48
size: M
status: planned
blocked_by: []
touches: [docs/CONVENTIONS.md, app-agent]
builder:
verifier:
built_by:
verified_by:
review:
---

> **DRAFTER'S NOTE — remove before landing.** Two things for the
> architect. **(1) ORDINALS MUST BE MINTED IN ONE PLACE.** This card is
> the taxonomy pass, so it should assign every outstanding ordinal —
> including the RECLASSIFICATION shape `T-080-s7` proposes, which the
> fifth triage folded into T-095 (the floors card). T-095 should CITE
> the ordinal this card mints rather than mint a second one; a number
> assigned twice is the defect this taxonomy exists to prevent.
> **(2) SHAPE EIGHT HAS TWO LIVE INSTANCES, not one.** The same test
> body carries a second containment pin over
> `method/interview/plan-interview.md`; T-078-s13 names only the
> CONVENTIONS one. Measured at HEAD `4d2f03c`.

Absorbs: T-078-s13, T-083-s3, T-081-s5, T-072-s1, T-072-s2, T-078-s11,
T-078-s12 (sixth triage, 2026-08-20). All seven files removed in this
commit.

**STATE has called this pass overdue by three ordinals for two
checkpoints running.** CONVENTIONS catalogues shapes ONE to SIX; SEVEN —
*the mutant no body kills, derived from the pins rather than from the
criteria* — has four independent sightings and no owner and no entry.
Three more shapes are queued behind it in suggestion files, each
measured, none numbered. This card closes the catalogue and, while it is
open, fixes the four places the drill's own PROCEDURE cannot fail.

## SHAPE EIGHT — an assertion that searches a corpus has no uniqueness floor

`snapshot_version_matches_the_live_method_stamps` in
`app/src-tauri/src/agent/kit.rs` pins the method stamp with
`conventions.contains(&format!("currently v{METHOD_SNAPSHOT_VERSION}"))`.
`String::contains` is satisfied by ANY occurrence anywhere in the
haystack, and the haystack is a whole file anybody may add to. So the
assertion pins *that the string exists somewhere in the file* while
every reader — and `METHOD_SNAPSHOT_VERSION`'s own doc comment, *"so a
method bump that forgets this const is red"* — takes it to pin *the
sentence in gotcha one*.

Measured with the assert's predicate modelled exactly (`grep -F -q`),
each drill asserting its substitution count and reading the mutated text
back, each restored byte-exact:

| drill | occurrences | predicate | meaning |
|---|---|---|---|
| baseline | 1 | passes | the pin holds |
| A: rewrite gotcha one to cite the symbol | 0 | **fails** | the pin discriminates |
| B: plant a second copy, THEN apply A | 1 | **passes** | GREEN with its subject deleted |

Drill B is the shape. **And the likeliest author of that second copy is
documentation ABOUT the pin** — T-078-s6 asked the walk table to name
this coupling, and the obvious way to name it is to quote the stamp. The
executor declined to duplicate the literal and cited maintainability;
the sharper reason it did not name is drill B.

**THE SECOND INSTANCE, added here.** The same body asserts
`interview.contains(&format!("(v{METHOD_SNAPSHOT_VERSION}"))` over
`method/interview/plan-interview.md`. Both haystacks hold exactly ONE
occurrence at `4d2f03c` (`grep -c "currently v0.1.5"
docs/CONVENTIONS.md` = 1; `grep -c "(v0.1.5"
method/interview/plan-interview.md` = 1), so both are one planted copy
away from drill B, in the one commit — a method bump — that edits both
files at once.

**Distinct from the seven.** One to four are "the matcher moved, the
value stayed"; here nothing moved. Five is an assertion SET with no
cardinality floor; here the assertion set is untouched and the HAYSTACK
gained a member. Six is a body that reds under a value poison while
killing no unique mutant; this body DOES kill a unique mutant, right up
until a duplicate appears somewhere it never looks.

**The remedy is mechanical**, which puts eight beside five rather than
six: assert the COUNT (`conventions.matches(&needle).count() == 1`) or
narrow the haystack to the line or section actually pinned.

## The three unnumbered shapes folded in

- **An empty comparison reports agreement** (T-083-s3). The producer
  fails, both sides come back empty, and `cmp` calls it a match. Two
  sightings hours apart in one lane: `git merge-tree --write-tree` exits
  1 and prints a conflict report where a tree OID was expected
  (measured at `bdada11`: exit 1, three stage lines, no bare OID), and a
  comparison loop that word-splits under `bash` and not under `zsh`
  printed `BYTE-IDENTICAL (0 paths)` — a green built out of two
  failures. Remedy is one line and it belongs in the drill: **assert the
  expected side is NON-EMPTY before comparing it**, the same trade
  `lint:tokens` exit 3 makes and the same one "a skipped gate is news"
  makes.
- **An order assertion whose witness is buffered dates nothing**
  (T-081-s5). A body claims A precedes B and picks as witness an event
  whose emission is DEFERRED, so the witness arrives late whatever the
  code does. Measured: T-081's first draft used a text delta, deltas are
  COALESCED by `flush_pending`, and the assertion passed under the
  batching mutant it was written to detect. The fix was a witness that
  is emitted rather than buffered — an `Activity` line, which is also
  what the real planner did. **The rule: when a test asserts A precedes
  B, ask whether B's arrival time is a property of B or of the
  transport. If the transport can hold B, B cannot date A.**
- **The reclassification shape** — see the drafter's note: `T-080-s7`
  measured a mutation that MOVES a generated row between families,
  leaving cardinality invariant, so a count floor is blind to it. It is
  carried by T-095 and it needs an ordinal from this card.

## Four places the drill's own procedure cannot fail

1. **A RESTORE CANNOT TELL ITSELF FROM A REVERT** (T-072-s1). The bullet
   prescribes both proofs against HEAD — `git show HEAD:<path> | shasum
   -a 256`, or an empty `git diff -- <path>` — **and both are satisfied
   perfectly by a restore that threw away work HEAD has never seen.**
   Measured, at the cost of three edits: `git checkout --` on a file
   whose implementation was still an uncommitted working-tree change
   reverted it to the branch point; the sha256 matched and `git diff
   --stat` was empty **at the moment the work was lost**. It was caught
   by the harness echoing the file back, not by either proof. The
   remedy is one clause and costs nothing: **DRILL AT A COMMIT** — commit
   the work first, then mutate, and both prescribed proofs become
   correct by construction. The scratch-snapshot alternative works too
   and needs its OWN proof (`cmp` against the snapshot), because
   `git show HEAD:` cannot see it. Verified absent at `4d2f03c`: `git
   grep -in "drill at a commit" -- docs/CONVENTIONS.md method/` exits 1.
2. **SHAPE SIX HAS NO REMEDY BUT IT DOES HAVE A CHECK** (T-072-s2).
   CONVENTIONS closes six with *"the drill has to ASK"* and leaves the
   reader without a procedure. T-072 ran one: after the drill reds, do
   not ask "is this a duplicate?" — **name a mutation of the code under
   test that this body kills, run the WHOLE suite under it, and require
   the failing-body count to be ONE.** A count of one IS the
   non-duplication, mechanically; a count above one names the bodies
   that already cover you, in the reporter's own output. Worked on the
   file the shape was found in: two mutants each gave **1 failed / 832
   passed of 833**, naming that body and nothing else. **The honest
   failure mode is the point**: if no such mutant exists, that is the
   finding, and the current wording gives a reader no way to say it.
3. **A COMMAND QUOTED AS PROOF MUST BE SHOWN CAPABLE OF FAILING**
   (T-078-s11). T-078's notes offer, as the *strong* form of the
   no-new-middle-dot check, `git diff -U0 -- docs/CONVENTIONS.md | grep
   '^+' | grep <U+00B7>` → no matches. **`git diff` with no range
   compares the WORKING TREE to the INDEX**, so on a clean tree — the
   state at every commit boundary, and the only state a reviewer can
   reproduce — that diff is 0 bytes and the grep returns "no matches"
   whatever the branch added. Measured at `5b5e1c7`: exit 0, 0 bytes, 0
   lines. The claim it supports is TRUE (re-derived with an explicit
   range: zero added lines over `041e8ec..HEAD`); the evidence offered
   for it is not evidence. **A diff-based check names its range, and a
   search-based one is run once against a planted hit before its zero is
   written down.**
4. **A FIX NAMES THE CLASS AND THE SWEEP, OR RECORDS THAT NONE WAS RUN**
   (T-078-s12). T-078's fix session found three defects of its own,
   fixed each where it stood, and in two cases left an identical sibling
   a few lines away — both inside the subsection that announces the
   sweep. One of the two is **still live at `4d2f03c`**: `grep -n
   "POISON$" docs/CONVENTIONS.md` returns line **900**, the guard-lift
   bullet's split of `POISON DRILL` across a line break, so an editor
   sweeping for every place the drill is discussed still misses it by
   the same mechanism the same branch fixed one bullet up. Both cases
   are one `git grep` from complete.

## Acceptance criteria

- **THE CATALOGUE SHALL BE CLOSED AND NUMBERED IN ONE PLACE.** SEVEN
  SHALL be written down with its four sightings; EIGHT SHALL be the
  uniqueness floor; the empty-comparison and buffered-witness shapes
  SHALL each get an ordinal or an explicit ruling that they are faces of
  an existing one; and the reclassification shape T-095 carries SHALL
  get its ordinal here. IF a shape is judged a duplicate THEN the ruling
  SHALL say which shape it folds into and why.
- **EACH SHAPE SHALL CARRY ITS TELL AND WHETHER IT HAS A MECHANICAL
  REMEDY**, the way five and six already do — that distinction is what a
  reader acts on.
- **THE TWO LIVE CONTAINMENT PINS IN
  `snapshot_version_matches_the_live_method_stamps` SHALL GAIN A
  UNIQUENESS FLOOR** — an occurrence count, or a narrowed haystack — and
  DRILL B SHALL be re-run against the fixed body and shown RED: plant a
  second copy of the stamp, delete the pinned sentence, require the
  failure.
- A SWEEP SHALL be run for the class and its result recorded even if
  empty: `git grep -nE 'contains\(|toContain\(|\.includes\('` over
  `app/src-tauri`, `tools/e2e` and `lib`, filtered to needles searched
  over a WHOLE-file string. THE ONES WHOSE NEEDLE ALSO APPEARS IN PROSE
  ABOUT THEMSELVES are the live ones.
- **THE RESTORATION CLAUSE SHALL SAY "DRILL AT A COMMIT"**, and it SHALL
  name the scratch-snapshot alternative WITH its own proof (`cmp`
  against the snapshot), because `git show HEAD:` cannot see it.
- THE SHAPE SIX paragraph SHALL gain the isolating-mutant check —
  failing-body count of ONE over the whole suite — stated as what the
  asking looks like when it is answered, NOT as a replacement for *"the
  drill has to ASK"*.
- THE drill SHALL require a NON-EMPTINESS assert before any comparison
  it treats as evidence, and SHALL require a proof command to be shown
  capable of failing (a named range, or one run against a planted hit).
- THE class-and-sweep clause SHALL be written, and **this card SHALL
  obey it on its own edit**: the live `POISON$` split at
  `docs/CONVENTIONS.md:900` is either fixed with the sweep recorded, or
  left with the sweep recorded.
- **NO CRITERION HERE IS MET BY PROSE ALONE WHERE A BODY IS POSSIBLE.**
  Shape eight's floor is a Rust assertion; the taxonomy is prose. Say
  which is which at each item — a criterion that cannot fail is a defect
  (T-095's absorbed T-080-s1).

Verification: headless — `cargo test` from app/src-tauri with the
changed `kit.rs` body, DRILL B run against it and shown RED with the
planted text read back, plus the full POISON DRILL on every changed
assertion: one side only, substitution count recorded, mutated text read
back with `git diff` BEFORE the suite runs, restore proved by sha256
against **the commit the drill ran at** — this card's own first clause.
The DOCS GATE fires on the CONVENTIONS edit; run what it owes and record
which, and note that `kit.rs` is one of CONVENTIONS' own live readers,
so this edit moves the suite it is editing. @human: none.
