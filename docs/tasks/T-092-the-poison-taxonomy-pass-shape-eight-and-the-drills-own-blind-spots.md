---
id: T-092
title: The poison taxonomy pass — a containment pin with no uniqueness floor, three unnumbered shapes, and four places the drill's own procedure cannot fail
feature: F-06
milestone: 4
priority: 48
size: M
status: verifying
blocked_by: []
touches: [docs/CONVENTIONS.md, app-agent]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @T-092 — code dc3c5af; drilled at that commit
verified_by:
review:
---

Absorbs (seventh triage, 2026-08-24): T-097-s2 — files removed in this commit.

Absorbs (eighth triage, 2026-08-25): T-088-s3 (primary) and T-113-s2
(its corroboration, filed independently from a third seat and explicitly
subordinate) — both files removed in this commit.

## THE DRILL CONVENTION NAMES A FIXED PATH, AND CONCURRENT LANES COLLIDE ON IT

**Measured live across FOUR lanes on 2026-08-24/25, not anticipated.**
CONVENTIONS' POISON DRILL bullet says *"DRILL IN A DETACHED SCRATCH
WORKTREE AT A NAMED COMMIT"* and every session independently chose the
same literal path — `<scratchpad>/drill` — plus the same driver name.
T-088 and T-090 collided first: the second `git worktree add` was saved
only by git refusing an existing path, and `git worktree list` from
inside T-088's lane showed a `drill` worktree detached at T-090's tip.
T-113 reproduced it from a third seat. **Then naming the WORKTREE
per-lane proved insufficient**: T-110 used `drill-T-110` and still had
its `drill.py` and `drill-results.json` overwritten by a sibling, because
the collision simply moved from the directory to the FILES beside it.

**What the drill's own path guard cannot do**, which is the sharp half:
each driver's post-T-085 refusal guards the shared PREFIX, so it answers
*"is this A drill"* and never *"is this MY drill"*. Three sessions wrote
that guard independently and all three made the same mistake, which
argues the convention is under-specified rather than that the sessions
were careless. Nothing was corrupted in any instance — every restoration
was sha256-proved against its own commit — but the protection was git's,
not the discipline's.

- **THE POISON DRILL BULLET SHALL NAME A PER-LANE SCRATCH IDENTITY**
  covering the worktree, the driver script AND any results file, and the
  driver's own guard SHALL be able to distinguish its drill from a
  sibling's rather than merely recognising the shared prefix. IF the
  scratch directory is genuinely shared between concurrent sessions
  (it is — the session UUID in its path makes it LOOK private and it is
  not) THEN the bullet SHALL say so in as many words, because every
  session so far has assumed the opposite.

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
- **The reclassification shape** — `T-080-s7`
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

## Implementation notes (executor, 2026-08-27)

Lane `/Users/ujju/Projects/nputer-T-092`, branch `task/T-092-lane`, base
`5887cd4`, work commit **`dc3c5af`**. Every drill ran at `dc3c5af` in a
DETACHED scratch worktree, which is this card's own first clause obeyed
on its own edit.

### The three judgement calls

**1. Rule or construction, for the drill path — CONSTRUCTION.** The
bullet now says DERIVE ONE STEM FROM THE LANE ID and spend it on the
worktree, its `CARGO_TARGET_DIR`, the driver AND every results file, the
way `../nputer-T-NNN` already derives the lane worktree from the card. A
rule saying "pick something unique" is what the four colliding lanes
already believed they were doing; the derivation is the only form with
nothing left to choose. The guard clause is a construction too: it asks
*is this MY drill* by resolving the stem's own path, requiring DETACHED
HEAD and requiring the exact commit — three conditions a sibling's drill
cannot satisfy, where a prefix guard can only ask *is this A drill*.

**2. What "no uniqueness floor" should require — A NARROWED HAYSTACK,
not a count.** Both remedies red drill B, so this is not about power. A
bare `count() == 1` is **a number with no keeper**: nothing in it says
WHICH occurrence is the subject, so the first legitimate second copy reds
it and the cheapest repair is to bump the 1 to a 2 — after which any two
occurrences anywhere satisfy it, including zero in the right place. That
is the decay T-093's landed *"A COMMENT THAT RESTATES A MEASURED FIGURE
IS A SECOND IMPLEMENTATION"* describes, one category over. The anchor
has a keeper by construction: it NAMES the subject, and
`the_one_line_carrying` asserts the anchor's own uniqueness, so an anchor
that stops identifying one line fails loudly instead of quietly widening
back into a whole-file search. CONVENTIONS records both, prefers the
anchor, and requires the executor to say which it chose.

**3. The three unnumbered shapes — NUMBERING IS THE FIX, and one of the
three was already numbered.** A shape derived at read time has no citable
handle, and five cards already cite SEVEN by number against an entry that
did not exist. So: mint in ONE place, cards cite. **But NINE was already
taken.** `T-080` calls the reclassification shape *"Shape nine"* in landed
text, `T-083`'s mutant table row N4 cites SHAPE NINE, and `T-095` carries
the shape waiting for this card. Assigning nine in the card's listing
order would have made three landed citations wrong — so nine is
**RATIFIED, not minted**, and the empty comparison takes TEN and the
buffered witness ELEVEN. Both were tested for foldability first and both
are kept: TEN is EIGHT's opposite end (a corpus with NO members wanting a
lower floor, against a corpus that GAINED one wanting an upper), and the
causes — a failed producer against a duplicate — send a reader to
different repairs. ELEVEN is about TRANSPORT and folds into nothing.

### The drill

**Scratch identity, derived rather than chosen.** Lane branch
`task/T-092-lane` → card id `T-092` → **stem `t092`**. Worktree
`/private/tmp/t092-drill` (**23 characters**, well clear of `T-133-s5`'s
116–128 bracket), `CARGO_TARGET_DIR=/private/tmp/t092-drill/.t092-target`
(inside itself, arm (c)), driver `<scratchpad>/t092-drill.sh`, results
`<scratchpad>/t092-drill-results.txt`. One stem, every artefact.

**The guard was shown capable of failing before its OK was believed** —
pointed at a commit that is not this drill's it exits 3 naming the
mismatch, and pointed at stem `t999` it exits 3 saying that path is not a
git worktree. That second case is the one a prefix guard cannot answer.

Suite is `cargo test --lib` from `app/src-tauri/` (the changed body is a
lib unit test), one side only — the DOC, never the assertion — with the
substitution count asserted and the mutated text read back with
`git diff -U0` BEFORE each run.

| # | mutation | subs | expected | `cargo test --lib` |
|---|---|---|---|---|
| D3 | **drill A**: rewrite the pinned CONVENTIONS sentence to cite the symbol | 1 | RED | **197 passed / 1 failed, exit 101** |
| D2 | **drill B**: plant a second copy of the stamp, THEN rewrite the sentence | 1 + 1 | RED | **197 passed / 1 failed, exit 101** |
| D4 | **drill B on the second pin**, `plan-interview.md`'s Output heading | 1 + 1 | RED | **197 passed / 1 failed, exit 101** |
| D5 | plant a SECOND line carrying the anchor | 1 | RED | **197 / 1, exit 101**, message names the anchor |
| D6 | reword the anchor away | 1 | RED | **197 / 1, exit 101**, message names the anchor |
| D1 | **CONTROL, not a drill**: D2's mutation against the PRE-FIX body | 1 + 1 | GREEN | **198 passed / 0 failed, exit 0** |

**D1 is the whole finding.** The pre-fix whole-file `contains` is GREEN
at exit 0 with its own subject deleted. It moves two sides deliberately
(the doc and the body) because it is a before/after comparison rather
than a drill, and it is labelled that way in the driver.

D5 and D6 print the helper's own messages, which is what makes the
anchor's uniqueness a real assertion rather than a comment:

    docs/CONVENTIONS.md has more than one line containing "formats are
    version-bumped" - the anchor no longer identifies the stamped sentence
    docs/CONVENTIONS.md has no line containing "formats are version-bumped"
    - the anchor this pin narrows on has moved

**SHAPE SIX'S OWN NEW CHECK, RUN ON THIS CARD'S CHANGED BODY.** Drill A's
mutant over the WHOLE workspace, `cargo test --no-fail-fast`, exit 101:
**517 passed / 1 failed across 18 `test result:` lines**, and the
`failures:` block names exactly one body,
`agent::kit::tests::snapshot_version_matches_the_live_method_stamps`. A
failing-body count of ONE is the non-duplication, mechanically.

**RESTORATION.** Every file restored byte-exact against `dc3c5af`:
`docs/CONVENTIONS.md` sha256
`26322cd653a6c12de6a9bff65d7f937bfce4809f8d993c4235e83aab994d0b12`,
`method/interview/plan-interview.md`
`19d5a011d6ff261371e676223175b1054b4055b64edea4f7b8565c830ea639ad`,
`app/src-tauri/src/agent/kit.rs`
`6c42a7040fb463990c540c9385db5d0299adfad1af4063460c39282408ac6532`;
empty `git diff` and empty `git diff --cached` over the tracked tree; the
only `git status --porcelain` entry is the untracked `.t092-target/`,
which is arm (c) working. The LANE was clean throughout — the drill never
touched it.

### TWO THINGS THE DRILL CAUGHT IN THE DRILL, both of them this card's own subjects

**1. A mutation that did not land, caught only by its count.** D4's first
attempt reported `REWRITE SUBSTITUTIONS=0` and the suite went GREEN. That
green was not a finding about the fix — it was a finding about the
mutant. The pattern carried a literal U+2014 EM DASH in the `perl -e`
string, whose bytes are not decoded, so it could not match decoded text.
This is T-078's raw-byte lesson arriving from the other direction, and
**only the asserted substitution count distinguished it from a real
survivor.** The driver now carries a comment saying so, and the fixed
mutant reds.

**2. A restore that was really a revert, in the drill for the card that
adds "A RESTORE CANNOT TELL ITSELF FROM A REVERT".** D1's control sets
the pre-fix body up with `git checkout 5887cd4 -- …kit.rs` — which STAGES
it — so the driver's `git checkout -- <path>` restored from the INDEX and
handed back the OLD file. The restoration proof is what caught it:
`RESTORE FAILED for app/src-tauri/src/agent/kit.rs`. Repaired with
`git restore --source=<commit> --staged --worktree`, and re-proved above.
**The proof did its job here precisely because the drill ran AT A
COMMIT** — with the work uncommitted, that same sequence would have
compared clean against a HEAD that never saw it.

### The sweeps, recorded including the empty one

**Sweep 1 — shape eight's class**, the criterion's own command, at
`dc3c5af`:
`git grep -nE 'contains\(|toContain\(|\.includes\('` over `app/src-tauri`,
`tools/e2e` and `lib` → **760 raw hits**, of which **43** have a haystack
bound from a whole-file read. Filtering those to POSITIVE assertions with
a literal needle leaves 14 to judge; the negated ones in
`app/src-tauri/src/dispatch/lanes.rs` and `app/src-tauri/tests/agent_runner.rs`
are immune by construction, because a duplicate REDS a negative.

- **One live instance, and it is outside this fence:**
  `lib/parser/test/rejected-exclusion.test.ts` searches a WHOLE rejected
  card for `status: rejected` while its own comment says the property is
  about the FRONTMATTER. Filed as **`T-092-s1`**, fence `lib-parser`.
- **One already remedied, before the shape had a number:**
  `the_only_production_path_to_the_transcript_is_the_bounded_one` in
  `app/src-tauri/src/agent/mod.rs` cuts the file to its production half
  first and says why in a comment. It is now cited in CONVENTIONS as the
  second worked example.
- The sweep's own false positive is recorded rather than hidden:
  `docs-input-gate.spec.ts:1036` searches ONE package.json script value,
  not a file, and the heuristic could not tell.

**Sweep 2 — the class-and-sweep clause, obeyed on this card's own edit.**
The card names `grep -n "POISON$" docs/CONVENTIONS.md` returning line
**900** at `4d2f03c`. **At this lane's base `5887cd4` it returns nothing,
exit 1** — ADR-019's compaction reflowed it away before this lane
existed. So the instance is recorded as ALREADY GONE rather than fixed.
The CLASS was then swept: a named handle this file is searched by,
split across a hard wrap. **Zero at `dc3c5af`, and the sweep was shown
capable of failing first** — run against a scratch copy with `POISON
DRILL` deliberately split it reports `SPLIT 803: POISON | DRILL` and
exits 1; against the real file it reports 0 and exits 0.

### Which criteria are BODIES and which are PROSE

The card requires this distinction to be stated per item.

- **BODY** — the two containment pins gaining a uniqueness floor, and the
  anchor-uniqueness assertion inside `the_one_line_carrying`. Three
  assertions, all four arms drilled RED (D2–D6).
- **PROSE, and no body is possible** — the catalogue (SEVEN…ELEVEN with
  tells and remedies), the per-lane scratch identity, DRILL AT A COMMIT,
  the non-emptiness and proof-capable clauses, shape six's isolating
  check, and the class-and-sweep bullet. These are disciplines about how
  a session works, and CONVENTIONS already records why that stays a
  discipline: *"nothing can automate 'would this have failed'"*. What IS
  mechanical about them was used here rather than asserted — the sweeps
  were run and shown capable of failing, and the isolating-mutant check
  was run over the whole workspace.

### Flagged for the verifier

- **The byte budget is the sharp edge.** `docs/CONVENTIONS.md` goes
  95,644 → **107,048** bytes, **+11,404**, against ADR-019's warn line of
  107,967: **919 bytes left**. `npm run lint:docs` is CLEAN (a WARN does
  not count toward `breaches`), but one card spent 93% of the headroom
  the seat had. Two compression passes moved every instance measurement
  into the cards that own it, per ADR-019's *"a hazard is never deleted
  to fit"*. Filed as **`T-092-s2`**.
- **`kit.rs` is one of CONVENTIONS' own live readers**, so this edit
  moves the suite it is editing — that is why the DOCS GATE names
  `cargo test` for a docs-only path, and why the anchor and the stamp
  were re-counted after every CONVENTIONS pass.
- **The placeholder now appears twice in CONVENTIONS**
  (`currently v<METHOD_SNAPSHOT_VERSION>`), once in the live-readers
  paragraph and once in shape eight's entry citing it. That is safe
  BECAUSE it is a placeholder and not the literal, which is the entry's
  own point; `grep -c "currently v0.1.7" docs/CONVENTIONS.md` is still 1.
- The drafter's note was removed, as it instructs. Both halves are
  discharged: its ordinal ruling is section "The catalogue is closed at
  ELEVEN", and its second live instance is drill D4.

### Where the card and the brief were wrong

- **The card's shape-eight measurement is a version stale.** It reads
  `grep -c "currently v0.1.5" docs/CONVENTIONS.md` = 1 and
  `grep -c "(v0.1.5" method/interview/plan-interview.md` = 1 at
  `4d2f03c`. The method is at **v0.1.7** since ADR-019. The COUNTS
  reproduce exactly — 1 and 1 at `5887cd4` — so the shape stands
  unchanged; only the literal moved, which is the card's own subject
  happening to the card.
- **The card's `POISON$` instance is no longer live.** Line 900 at
  `4d2f03c`; nothing at `5887cd4`. Recorded with the sweep, per the
  criterion's "or left with the sweep recorded" arm.
- **The card says SEVEN has "four independent sightings".** Five cards
  name it at `5887cd4` — `T-076` (which named the shape), `T-069-s3`,
  `T-073-s4`, `T-077` and `T-080` — with `T-102` corroborating `T-069-s3`
  from a second seat. Four is defensible if the corroboration is folded
  into its subject, which is why CONVENTIONS names the cards and tells
  the reader to derive the count instead of carrying one.
- **The brief calls them "the three unnumbered shas".** They are the
  three unnumbered SHAPES; the card's own heading and title say so, and
  there is no set of three shas anywhere in the card. Answered as shapes.
- **The brief's byte figures reproduce exactly** — 95,644 at `5887cd4`
  against a 107,967 warn line, 12,323 of headroom. Its account of the
  T-093 landing and of the four-lane collision also reproduces.
