---
id: T-092
title: The poison taxonomy pass — a containment pin with no uniqueness floor, three unnumbered shapes, and four places the drill's own procedure cannot fail
feature: F-06
milestone: 4
priority: 48
size: M
status: done
blocked_by: []
touches: [docs/CONVENTIONS.md, app-agent]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5 @T-092 — code dc3c5af; drilled at that commit
verified_by: claude-opus-5
review: same-model
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

### Gates and suites, every exit read from `$?` unpiped

Diff for the executor's own pair, `5887cd4..HEAD` (the RANGE RULE's
executor pair — never `merge-base..tip`): **5 paths**, 574 insertions,
19 deletions. `docs/CONVENTIONS.md` and `app/src-tauri/src/agent/kit.rs`
are the fence; the other three are this card and its two routed
findings. Nothing outside.

**STANDING GATES, derived from that 5-path diff rather than assumed:**

- **GRAPH REGEN — FIRES.** The diff carries a `*.rs` file outside docs/.
  Asked rather than predicted:
  `cargo run -p nputer-index -- index --check --root ../..` **exit 1**,
  and it is a REAL stale, not the `--root` false red — it prints both
  sides (`1020023 bytes · 189 files · 2152 symbols · 2111 edges`,
  identical) plus a `~1` file diff naming
  `app/src-tauri/src/agent/kit.rs (content, loc 514 -> 562)`. No symbol
  or edge moved. **NOT REGENERATED HERE:** `docs/architecture/graph.json`
  is outside this fence and the bullet lands it *with the CHECKPOINT*, so
  it is the integrator's. Budget while you are there: **1 020 023 of
  1 040 000 bytes, 98.1%, 19 977 left.**
- **BOOT GATE — FIRES**, and this role runs it too (T-046 criterion 6):
  the diff touches `app/src-tauri/**`. Port read at zero rows on BOTH
  stacks immediately before binding (`lsof -nP -i6TCP:14620` and
  `-i4TCP:14620`, both exit 1, read 2026-08-27T14:06:13Z on Mac.lan),
  then `NPUTER_BOOT_PORT=14620 npm run boot:check` from tools/e2e/ →
  **exit 0**, both lines: `[nputer] project folder:
  /Users/ujju/Projects/nputer-T-092` and `[nputer] window "main"
  created`. 14620 released afterwards (zero rows). **The human's app was
  never touched** — 1420 read only with the one permitted command, held
  throughout by pid 19746 on `[::1]:1420`, never bind-probed, never
  connected to.
- **DOCS GATE — FIRES**, 4 paths under docs/ are code inputs, owing four
  suites. All four run below. `npm run lint:docs` (the named whole-tree
  form and CI's step) **exit 0**, including
  *"governing-document budgets hold"*.

**SUITES** at tip, in the order run:

| command | from | result | exit |
|---|---|---|---|
| `cargo test` (baseline, before any edit) | app/src-tauri/ | 518 passed, 18 `test result:` lines | 0 |
| `npx vitest run` | lib/parser/ | 15 files, **314 passed** | 0 |
| `npx tsc --noEmit` | lib/parser/ | — | 0 |
| `npm run build` | app/ | both `tsc` calls + bundle | 0 |
| `npm test` | app/ | 47 files, **1013 passed** | 0 |
| `npm test` (`NPUTER_E2E_PORT=14593`) | tools/e2e/ | **233 passed**, workflow-parity 17/17 | 0 |
| `npm run lint:tokens` | tools/e2e/ | TOKEN 144 files, CONTROL 829 tracked | 0 |
| `npm run lint:tokens -- --selftest` | tools/e2e/ | 65+4 samples, 87 walk-policy, 9 evidence-floor | 0 |
| `npm run lint:docs` | tools/e2e/ | budgets hold | 0 |
| `cargo test` (tip) | app/src-tauri/ | **518 passed**, 18 lines | 0 |

**ARM (c) PROVED RATHER THAN ASSUMED.** After
`git worktree remove /private/tmp/t092-drill`, bare `cargo test` in the
lane is **518 passed / exit 0 with zero "no such file" failures** —
T-013's pollution signature is 33 failures naming a directory that no
longer exists, and the drill's own `CARGO_TARGET_DIR` is why none
appeared. The drill worktree is removed; it is one command to re-cut at
`dc3c5af` with the same derived stem, and the driver is preserved.

**One honest lapse, recorded rather than smoothed:** the FIRST e2e run
(`NPUTER_E2E_PORT=14592`) had its port read AFTER binding rather than
immediately before, against `T-132-s6`'s clause. It came back holding
exactly one row, my own lane's vite (pid 22181, 127.0.0.1:14592), so
nothing collided — but the reading order was wrong and the rule is about
the order. The re-run at the final tip (14593) and the boot check (14620)
were both read at zero rows first.

## Verdict — APPROVED (verifier, 2026-08-27, claude-opus-5 @T-092-verify)

Measured at **`73d7870`** unless another ref is named. Every figure below
carries the ref it was derived at; none is quoted from the card, the
notes or the brief.

**BOUNDED READ, DECLARED.** The attack set was written to
`<scratchpad>/T-092-attack-set.md` and hashed
(`6d3a2c8e20e09a18512e4af285348bd163499a927b3cd2877ea306d9b03d9740`)
at **2026-08-27T14:12:48Z**, BEFORE any diff hunk, the card at the tip,
or the implementation notes were opened. Read before that stamp: the
brief, `method/roles/verifier.md`, and `CLAUDE.md`, `docs/STATE.md`,
`docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md`, `docs/CAPABILITIES.md`
and this card **all at `5887cd4`**; `docs/ROADMAP.md` deliberately not
read. Two leaks, recorded rather than smoothed: `git diff --name-only`
(5 paths, no content) and `git log --oneline | wc -l` (count only) were
run before the stamp, and `git worktree add` echoed one commit subject
line. No reasoning, no notes, no hunk.

Drilled in a DETACHED scratch worktree **outside the repository** at
`/private/tmp/v092-1240c3f2` — 26 characters, stem derived from this
session's own id, never a fixed name — with
`CARGO_TARGET_DIR=/private/tmp/v092-1240c3f2/target` inside itself
(arm (c)). Driver `<scratchpad>/v092-1240c3f2-drill.sh`, one stem, every
artefact. The driver's guard asks *is this MY drill* by resolving the
stem's own path, requiring a DETACHED HEAD and requiring the exact
commit. Worktree removed afterwards.

### The control reproduces, so the card fixed something real

The whole claim is that the PRE-FIX pin was vacuous. **Reproduced
independently on the base ref**, not taken from the notes. At `5887cd4`,
one planted duplicate of the stamp elsewhere in the file, then gotcha
one's pinned sentence rewritten to cite the symbol — its own subject
deleted, `grep -c "currently v0.1.7"` still 1:

    cargo test --lib from app/src-tauri/  ->  198 passed / 0 failed, exit 0

Green with its subject deleted, at exit 0. The card's D1 figure is
**exact at my own ref**.

### Every arm, drilled one side only (the DOC, never the assertion)

Substitution count asserted, mutated text read back with `git diff -U0`
BEFORE each run, restored byte-exact against the commit the drill ran at.

| arm | mutation | subs | `cargo test --lib` |
|---|---|---|---|
| C1 | **CONTROL** — drill B against the PRE-FIX body at `5887cd4` | 1+1 | **198 / 0, exit 0** |
| C2 | drill B against the FIXED body at `73d7870` | 1+1 | **197 / 1, exit 101** |
| C3b | drill B on the **second** pin, `plan-interview.md` | 1+1 | **197 / 1, exit 101** |
| D5 | plant a second line carrying the CONVENTIONS anchor | 1 | **197 / 1, exit 101**, anchor message |
| D6 | reword the anchor away, stamp left present and correct | 1 | **197 / 1, exit 101**, anchor message |
| D7 | plant a second line carrying the `## Output` anchor | 1 | **197 / 1, exit 101**, anchor message |

C3b is the sharp one: after it, `grep -c "(v0.1.7"
method/interview/plan-interview.md` is still **1**, so the pre-fix
whole-file `contains` would have PASSED. Both instances are closed, not
one. D7 extends the notes' D5 to the second haystack, which the notes did
not drill.

Anchor uniqueness attacked at all three boundaries: **twice** -> RED
(D5/D7), **zero times** -> RED (D6), **a line carrying something else**
-> still pins, because the line is returned whole. `the_one_line_carrying`
sits inside `#[cfg(test)] mod tests` (`kit.rs:296`), so **nothing was
added to the shipped binary**.

Restoration proved by sha256 against the drill's own commit on every arm:
`docs/CONVENTIONS.md 26322cd6…`, `method/interview/plan-interview.md
19d5a011…`, `app/src-tauri/src/agent/kit.rs 6c42a704…`, with `git diff`
and `git diff --cached` both 0 bytes. Those three shas also prove the
fence's files are **byte-identical between `dc3c5af` and `73d7870`**, so
the notes' drill figures are still true at the tip they are tabled under.

### The two failures the drill caught inside itself — both re-run

- **A mutation reporting `SUBSTITUTIONS=0` that went green.** Reproduced
  directly: the same `perl -0777` pattern carrying a literal U+2014
  substitutes **1** without a UTF-8 layer and **0** under `-CSD`, because
  the `-e` program's bytes are never decoded while the file's are. The
  notes' mechanism is exactly right. I hit the same class independently
  on my own first C3 attempt, and only the asserted count told me.
- **`git checkout <commit> -- <path>` STAGES.** Reproduced at `73d7870`,
  and it is **sharper than the notes state**: after the staged checkout
  and a bare `git checkout -- <path>`, `git diff -- <path>` is **0
  bytes** while the file is the wrong one (`42d65592…` where `6c42a704…`
  belongs). POISON DRILL offers that empty diff as an ALTERNATIVE
  restoration proof, so **one of the two prescribed proofs passes on a
  failed restore**, and committing first does not close it. Filed as
  `T-092-s4`; it is not a criterion failure and does not block.

### Criteria

Every one discharged. **BODY** where the card says body, **PROSE** where
it says prose, and the declination is principled: a `contains`-over-
CONVENTIONS body asserting each new clause would have manufactured fresh
shape-eight instances in the same commit that catalogues the shape.

1. **Catalogue closed and numbered in one place** — MET. SEVEN's entry
   reproduces its namer's wording (`T-076:659` at `5887cd4`) and names
   the sightings rather than a tally; the card's *four independent
   sightings* reconciles exactly once `T-102` is read as corroborating
   `T-069-s3` — `git grep -il "shape seven" -- docs/` returns **6** files
   at `5887cd4` (1 namer + 4 sightings + 1 corroboration).
2. **NINE ratified, not minted** — MET, and **all three citations
   verified by name at `5887cd4`**: `T-080:615` (*"Shape nine"*),
   `T-083:1071` (mutant table row **N4**, *"SHAPE NINE"*), `T-095:19`.
   Numbering by the card's own listing order would have put the empty
   comparison at nine and falsified all three. EIGHT is likewise
   consistent with `T-078:1341`'s prior use. TEN and ELEVEN collide with
   nothing — `git grep -in "shape ten|shape eleven"` is empty at the
   base. No ordinal is assigned twice.
3. **Both pins gain a uniqueness floor, drill B shown RED** — MET; the
   table above.
4. **Class sweep run and recorded** — MET. The criterion's own command
   returns **760** raw hits at `73d7870`, exact against the notes. The
   one live instance is real: `lib/parser/test/rejected-exclusion.test.ts:51`
   `expect(content).toContain('status: rejected')` over a whole card,
   under a comment at :48 claiming a FRONTMATTER property. Correctly
   routed out of fence as `T-092-s1` (C-06). The worked example is where
   it is said to be (`agent/mod.rs:1172`), and the false positive is
   recorded rather than hidden.
5. **"DRILL AT A COMMIT" + the snapshot's own `cmp` proof** — MET.
6. **Shape six's isolating-mutant check, finishing not replacing** — MET,
   and said in as many words: *"it replaces nothing above, it finishes
   it"*.
7. **Non-emptiness before evidence + proof shown capable of failing** —
   MET.
8. **Class-and-sweep clause, obeyed on its own edit** — MET. `grep -n
   "POISON$"` returns line **900** at `4d2f03c` and **nothing, exit 1**
   at both `5887cd4` and `73d7870`: ADR-019's compaction reflowed it away
   before this lane existed, and the "left with the sweep recorded" arm
   is the honest one. I re-ran the class over six named handles at the
   tip — `POISON$ DOCS$ BOOT$ GRAPH$ RANGE$ LANE$`, all **0** — and
   showed the sweep capable of failing against a planted split.
9. **Per-lane scratch identity** — MET, as a construction rather than a
   rule, covering worktree, target dir, driver and results; the guard
   distinguishes MY drill from A drill; and the shared scratchpad is
   stated in as many words.
10. **Drafter's note removed** — MET, both halves discharged (0 hits for
    `DRAFTER'S NOTE` and for `remove before landing`).

### Gates and suites, at `73d7870`, every exit read from `$?` unpiped

DOCS GATE diff half in THE ONE SPELLING, RANGE RULE **executor** pair
(`merge-tree` exit read FIRST = 0, tree `f31a3ec`): **FIRES**, exit 1,
5 paths, 4 under `docs/` are code inputs, owing exactly four suites. All
four run, plus the rest:

| command | from | result | exit |
|---|---|---|---|
| `cargo test` | app/src-tauri/ | **518 passed / 0 failed**, 18 `test result:` lines | 0 |
| `npm test` | app/ | 47 files, **1013 passed** | 0 |
| `npx vitest run` | lib/parser/ | 15 files, **314 passed** | 0 |
| `npm test` (`NPUTER_E2E_PORT=14625`) | tools/e2e/ | `Running 233 tests`, **233 passed**, workflow-parity 17 | 0 |
| `npx tsc --noEmit` | lib/parser/ | — | 0 |
| `npm run build` | app/ | both `tsc` calls + bundle | 0 |
| `npm run lint:tokens -- --selftest` | tools/e2e/ | 65+4 samples, 87 walk-policy, 9 evidence-floor | 0 |
| `npm run lint:tokens` | tools/e2e/ | TOKEN 144 files, CONTROL **831** tracked | 0 |
| `npm run lint:docs` | tools/e2e/ | budgets hold, 4 gated, 0 awaiting | 0 |
| `npm run typecheck` | tools/e2e/ | — | 0 |

**BOOT GATE — FIRES** (the diff touches `app/src-tauri/**`) and was RUN,
not argued away. Port 14626 read at **zero rows on BOTH stacks
immediately before binding** (`-i6TCP` exit 1, `-i4TCP` exit 1, 14:28:15Z),
then `NPUTER_BOOT_PORT=14626 npm run boot:check` from tools/e2e/ ->
**exit 0**, both lines: `[nputer] project folder:
/private/tmp/v092-1240c3f2` and `[nputer] window "main" created`; port
released afterwards. Independently, **100% of the Rust change is inside
`#[cfg(test)] mod tests`**, so the shipped surface did not move at all.
The human's app was read once with the one permitted command and nothing
else — `node` pid 19746 on `[::1]:1420 (LISTEN)`, never bind-probed,
never connected to.

**GRAPH REGEN — FIRES and is NOT this seat's**, confirmed to be exactly
the staleness the brief names and nothing else. `index --check --root
../..` exit **1**, a REAL stale (both sides print counts; a `--root`
false red would say `committed: MISSING`):

    committed / fresh index: 1020023 bytes · 189 files · 2152 symbols · 2111 edges
    files  +0  -0  ~1
    | ~ app/src-tauri/src/agent/kit.rs  (content, loc 514 -> 562)
    budget: 1020023 of 1040000 bytes (98.1%) - 19977 left

Byte count identical, **zero symbols moved, zero edges moved, one file,
content only**. `docs/architecture/graph.json` is outside this fence and
the bullet lands it with the CHECKPOINT.

**MIDDLE DOT**, checked over a NAMED RANGE per the card's own new clause
and shown capable of failing: `git diff -U0 5887cd4..73d7870 --
docs/CONVENTIONS.md | grep '^+' | grep <U+00B7>` -> **0**; the same
pipeline against a planted hit -> **1**.

### Security sweep

Clean, and REJECTED-level nothing. Zero dependency changes (no
`Cargo.toml`, `Cargo.lock`, `package.json` or lockfile in the diff);
`acl_pin.rs` untouched, so `EXPECTED_GRANTS` did not move; no secret,
key or token on any added line; no new input path, no new endpoint, no
`unsafe`. The only `panic!`/`assert!` added is inside `#[cfg(test)]`
and is the pin's own discriminator — drilled RED above. The helper reads
strings the test already holds; it opens nothing.

### Fence and interfaces

`touches: [docs/CONVENTIONS.md, app-agent]`. Five changed paths:
`docs/CONVENTIONS.md`, `app/src-tauri/src/agent/kit.rs` (C-14's
territory per ARCHITECTURE's code-layout rule), and this card plus its
two routed findings. Nothing outside. The three-file method bump
(T-078-s3) still works — the const and both doc stamps move together —
but it now also requires the stamps to stay on their anchors' lines; see
`T-092-s3`.

### The byte budget — RULED: acceptable, no compression pass owed

Authority is `DOC_BUDGETS` in `tools/e2e/scripts/docs-gate.mjs`:
`docs/CONVENTIONS.md` `{ landed: 86373, warn: 107967, fail: 129560 }`.
Measured with `wc -c`: **95,644** at `5887cd4`, **107,048** at both
`dc3c5af` and `73d7870`. Delta **+11,404**; headroom **12,323 -> 919**;
**92.5%** of the seat's headroom spent by one card. Every figure in the
brief and in `T-092-s2` reproduces exactly.

The gate is not merely un-failed, it does not even WARN — 107,048 is
under 107,967, and `lint:docs` prints *"governing-document budgets
hold"* at exit 0. ADR-019 set that line; a card that lands under it has
obeyed the rule, and every byte added here is MECHANISM, which ADR-019's
own *"a hazard is never deleted to fit"* protects. Two compression passes
already moved the instance measurements out to the cards that own them.
Blocking on this would be a verifier overriding a gate that answered.

**But 919 bytes is not headroom for anything**, and the next card at this
seat cannot add a paragraph without warning. `T-092-s2` is correctly
filed, its three options are the right three, and it should be triaged
ahead of the next `docs/CONVENTIONS.md` card rather than after it.
`T-092-s5` is the same decision seen from the other side.

### Findings filed — none of them blocking

`T-092-s3` (the anchor is line-scoped, so a reflow that leaves the
document CORRECT reds it with a remedy that names the wrong repair —
measured), `T-092-s4` (the staged-checkout hazard above),
`T-092-s5` (*"EVERY ORDINAL IS MINTED HERE"* while shapes ONE to FOUR are
numbered nowhere — inherited, not introduced), `T-092-s6` (the shape-six
paragraph lands `833` with no ref, and the app suite is 1013 today).

### Every figure that disagreed with my own measurement

Reported in full, as the brief asks. **Only one is wrong**; the rest are
labels or denominators.

1. **`lint:tokens` CONTROL 829 -> the tree says 831.** The notes table it
   under *"SUITES at tip"*. Tracked files: **847** at `5887cd4` and
   `dc3c5af`, **849** at `73d7870` — the two routed findings — so 829 was
   measured at or before `dc3c5af` and went stale when the notes' own
   commit landed. Textbook FIGURE CASE, harmless (exit 0 either way),
   and worth naming because this pipeline names it.
2. **`T-092-s1`'s "37 times"** is EXACT at its stated ref `dc3c5af` and
   is **42** at `73d7870` — the s-card's own text moved the count it
   reports. The card says *"Re-derive rather than quoting these"* and
   gives the command, so it is honest; it is still a stale number sitting
   in a card about stale numbers.
3. **`T-092-s1` and `T-092-s2` both call `dc3c5af` "T-092's tip".** It is
   the WORK commit; the tip is `73d7870`. The ref is right, the label is
   not.
4. **CONVENTIONS' new `1 failed / 832 passed of 833`** carries no ref and
   is 180 short of today's 1013. `T-092-s6`.
5. **SEVEN's "four" against the brief's "five"** are two counts of two
   different things and both reproduce: 6 files name the shape at
   `5887cd4`, of which one is the namer and one is a corroboration. The
   landed entry names the cards and refuses a tally, which is the right
   answer to the disagreement.
6. **The card's `v0.1.5` stamp measurements** are a method version stale
   (v0.1.7 since ADR-019) and the notes say so; the COUNTS still
   reproduce, 1 and 1, at `73d7870`.
7. **The brief's "three unnumbered shas"** are three unnumbered SHAPES;
   the brief corrects itself and I did not inherit the noun. No set of
   three shas exists anywhere in the card.
8. Everything else reproduces exactly, at my own refs: 198/0 exit 0;
   197/1 exit 101 on every drilled arm; 760 raw sweep hits; `POISON$`
   line 900 at `4d2f03c` and gone at `5887cd4`; 95,644 -> 107,048 against
   107,967 with 919 left; `kit.rs` loc 514 -> 562 with no symbol or edge
   moved; 518/18, 1013/47, 314/15, 233 with workflow-parity 17; TOKEN 144;
   selftest 65+4/87/9; the placeholder twice and the literal once; the
   three restoration sha256s.

**APPROVED.** The vacuity was real, the fix closes both instances rather
than the one that was reported, the anchor's own uniqueness is an
assertion and not a comment, and the four blind spots in the drill's
procedure are written where the next session reads. Merging is the
integrator's; `docs/architecture/graph.json` is theirs to regenerate with
the checkpoint.

### Step 7 — the gates re-run at the tip THIS VERDICT created

A verdict is a WRITE, and prose is a code input here. The section above
was measured at `73d7870`; this one is measured at **`00bb50b`**, the
commit that appended it and filed `T-092-s3`…`s6`, and re-confirmed at
the tip that appended THIS section (a prose-only append to a card whose
frontmatter did not move — the four counts below are unchanged, which is
what makes the section true at its own tip rather than at the last one).

The DOCS GATE at `00bb50b`, same one spelling, same executor pair,
`merge-tree` exit read first = 0: **exit 1, nine paths under docs/**, the
same four suites owed. All four re-run:

| command | from | result | exit |
|---|---|---|---|
| `cargo test` | app/src-tauri/ | **518 passed / 0 failed**, 18 lines | 0 |
| `npm test` | app/ | 47 files, **1013 passed** | 0 |
| `npx vitest run` | lib/parser/ | 15 files, **314 passed** | 0 |
| `npm test` (`NPUTER_E2E_PORT=14627`, read at zero rows on both stacks first) | tools/e2e/ | **233 passed** | 0 |
| `npm run lint:tokens` | tools/e2e/ | TOKEN 144, CONTROL **835** tracked | 0 |
| `npm run lint:docs` | tools/e2e/ | frontmatter parses, budgets hold | 0 |

CONTROL moves **831 -> 835**: four filed findings, four tracked files.
That is the same mechanism that made the notes' 829 stale, stated here
with its ref so it cannot repeat. No card's frontmatter broke, no title
opens with a reserved indicator, no control byte was introduced (swept
with `perl -0777` over all five files before the commit), and
`docs/CONVENTIONS.md` is untouched by this seat, so the byte budget is
where the section above left it.

**One more finding, found while auditing the notes' own figures:**
`T-092-s7` — the notes derive their gate list from `5887cd4..HEAD` and
label it *"the RANGE RULE's executor pair"*, but `<main>..HEAD` before
the merge is the pair that rule bans by name; the prescribed right-hand
endpoint is the merge TREE. Main never moved on this lane
(`git merge-base --is-ancestor 5887cd4 73d7870` exits 0), so the two
forms are **byte-identical under `cmp`** here and every gate fired
correctly — the right answer by the forbidden route, which is the exact
failure CONVENTIONS predicts one notation over. Not blocking, and nothing
downstream is wrong.

**And a second stale figure in the same sentence**, completing the audit
above: the notes' *"5 paths, 574 insertions, 19 deletions"* is EXACT at
`2502d16` — the commit that carried the notes — and is **642 insertions**
at `73d7870`, which appended 68 more lines to this card. The path count
and the deletions are stable; only the insertion count moved, and it
moved because the notes' own later commit moved it.

The verdict stands: **APPROVED**.

**CORRECTION, recorded rather than smoothed — the section above went
stale in its own commit.** It says *"CONTROL moves 831 -> 835"* and
stamps that at `00bb50b`, which is true; but `T-092-s7` landed in the
SAME commit as the section, so at **`64ed2b6`** the lint reads **CONTROL
836** — five filed findings, five tracked files. The parenthetical's
claim was about the four SUITE counts and those held exactly, re-run at
`64ed2b6`: `cargo test` **518 / 0 in 18 lines**, `npx vitest run`
**314**, `npm test` from app/ **1013 / 47**, `npm test` from tools/e2e/
(port 14628, read at zero rows on both stacks) **233**, `lint:docs`
clean, every exit 0. The CONTROL row is the fifth figure and it moved,
by the same mechanism that moved the notes' 829 and their 574 — a count
of the tree, written into the tree, by the commit that changes the tree.
**836 is stable at this file's own tip**, because this correction adds no
file. Three instances of one shape in one lane, which is the argument for
the rule rather than against the lane.
