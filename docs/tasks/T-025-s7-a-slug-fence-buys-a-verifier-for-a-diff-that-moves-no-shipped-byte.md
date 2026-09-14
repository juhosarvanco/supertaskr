---
id: T-025-s7
title: A slug fence buys a verifier for a diff that moves no shipped byte — the same file, the same change, two ceremony rows, decided by how the fence was spelled
feature: F-04
milestone: 4
priority: 8
size: S
status: planned
blocked_by: []
touches: [docs/CONVENTIONS.md, docs/ARCHITECTURE.md, docs/conventions/standing-gates.md]
suggested_by: executor claude-opus-5@subagent @T-025-s6
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND WHILE BUILDING T-025-s6, NOT FIXED THERE.** It is outside that
lane's fence — the rule lives in `docs/CONVENTIONS.md`'s THE SHIPPED
PARTITION, IN SLUGS bullet and in `method/tasks/TASK-FORMAT.md`'s
ceremony table, and T-025-s6's fence is the `app-agent` slug.

**THE INSTANCE, in one pair.** `T-025-s5` and `T-025-s6` changed the SAME
FILE — `app/src-tauri/tests/agent_runner.rs`, a test file, no shipped byte
in either diff — and they fall on DIFFERENT rows of the ceremony table:

- `T-025-s5` carried `touches: [app/src-tauri/tests]`, a bare path. THE
  SHIPPED PARTITION puts every bare path that is neither a registry slug
  nor a `method/` path reaching a `KIT_FILES` entry on the NOT SHIPPED
  side, so it took row 1 — *S, diff outside shipped code* — no verifier,
  and it stamped `done`.
- `T-025-s6` carried the same card's fence CORRECTED AT PROMOTION to the
  registry slug `app-agent`. A registry slug is SHIPPED by the same
  bullet's first clause, so the identical diff takes row 2 — *S, touching
  shipped code* — and owes a verifier.

**WHY THAT IS NOT OBVIOUSLY WRONG, which is why this is a suggestion.**
The bullet's stated design is that a fence is a BLAST RADIUS, not a diff:
*"REACHES, not equals"*, and `app-agent` reaches `app/src-tauri/src/agent`
where shipped bytes live. Reading the row off `touches:` rather than off
the diff is deliberate — it is what lets triage price the ceremony BEFORE
dispatch, which `T-104` ruled is triage's call and which a lane cannot
make from inside its own fence. On that reading the pair above is the rule
working, and `T-025-s5` is the one that was under-ceremonied.

**AND WHY IT IS STILL WORTH A RULING.** The promotion note on
`T-025-s6` says WHY the fence was corrected, and the reason is
DISJOINTNESS — the bare directory path's one relevant file is reserved by
`app-agent` through C-14, which is the shape `T-160-s4` exists to refuse.
The ceremony consequence is not mentioned anywhere in that note, so it
reads like a side effect nobody priced. The general form: **narrowing a
fence to a SLUG for a disjointness reason silently buys a verifier**, and
the two fence spellings that are equally correct about which files a lane
may write disagree about how many sessions the card costs. A rule whose
cost changes with a spelling chosen for an unrelated reason is worth
either confirming out loud or refining.

**THE SHAPES TO CHOOSE BETWEEN**, so this is a ruling and not an open
question:
1. **CONFIRM IT AS IS.** The fence is the blast radius; a lane that MAY
   write shipped code owes a verifier whether or not it did, because the
   verifier is priced against what could have moved. Then say so in the
   bullet, so the next reader of a corrected fence sees the ceremony
   consequence beside the disjointness one.
2. **SPLIT THE TWO QUESTIONS.** Keep `touches:` as the write fence and
   let the ceremony row be read off the fence's SHIPPED PATHS ACTUALLY
   REACHED BY THE DIFF, which triage can still price before dispatch by
   asking what the card is going to change. Costs a second field or a
   second reading; buys a row that does not move when a fence is
   re-spelled.
3. **NAME AN EXCEPTION FOR TEST PATHS.** A slug's test files are not
   shipped bytes by any reading — `app/src-tauri/tests/agent_runner.rs`
   is in `app-agent`'s path set and ships nothing. The narrow version:
   the row is read off `touches:` EXCEPT where the diff is confined to
   paths the slug's own component declares as tests. Smallest change,
   and the one that would have made this pair agree.
   **AND THE TREE ALREADY LEANS THIS WAY, in a place nothing reads as a
   rule.** `docs/ARCHITECTURE.md`'s Code-layout bullet states C-14's
   ownership as *"`app/src-tauri/src/agent/**` + `agent-store.ts`"* — the
   test file is NOT in that sentence, while it IS in the path set
   `brief.mjs --write-fence` expands `app-agent` to (five paths, the
   manifest at `.nputer/lane-fence.json`). So the prose and the expansion
   already disagree about whether the test file is C-14's, and the
   SHIPPED reading rests entirely on the expansion. Whichever shape wins,
   those two should be made to agree or the difference made deliberate.

**WHAT THIS FINDING IS NOT.** It is not a claim that `T-025-s6` was
mis-promoted, and not a request to lighten it — that lane stamped
`verifying` deliberately, taking the heavier reading, with its argument
written on its own card. It is the observation that two equally faithful
readings of one bullet disagree about the same diff, which is the class
`T-145-s2` named: a question a lane cannot decide from inside its own
fence.

## Triage — standing sitting #3, 2026-08-30 (architect seat)

**PROMOTED F-04 p8, WITH SHAPE 1 RULED AT THE SEAT.** Ruled at
`@ 51fa31c0964c`. The card asked for a ruling and offered three shapes;
taking one is what makes this a card a lane can build instead of a
question a lane would have to answer.

**THE RULING: SHAPE 1. THE FENCE IS THE BLAST RADIUS AND THE CEREMONY
ROW IS READ OFF `touches:`, EVEN WHEN THE DIFF MOVES NO SHIPPED BYTE.**
The reason is not that shape 1 is the least work; it is that the other
two break a property this method rests on. `method/tasks/TASK-FORMAT.md`
opens by stating that *"the story map, the dispatch order, and the model
assignment are all pure functions of this frontmatter — no layout or
state is stored anywhere else"*, and `T-104` ruled that pricing the
ceremony belongs to TRIAGE, before dispatch. A row that is a pure
function of `touches:` satisfies both. A row read off "the shipped paths
the diff actually reaches" does not: at triage time there is no diff,
so the row would become a judgement about work not yet done — checkable
by nobody, and stored nowhere the parser can see it.

**SHAPE 2 IS DECLINED, WITH ITS REASON KEPT.** It is the intellectually
tidier answer and it is the one that costs the property above. It also
needs a second field or a second reading, and a second place where one
rule lives is T-057's shape.

**SHAPE 3 IS DECLINED, AND IT IS THE CLOSE ONE.** "The row is read off
`touches:` except where the diff is confined to the slug's own declared
test paths" would have made this card's own pair agree, and the card is
right that the tree leans that way. It is declined because **no
component declares which of its paths are tests.** `C-14`'s `paths:` is
a flat list of five entries at this base; nothing in it distinguishes
`app/src-tauri/src/agent/**` from `app/src-tauri/tests/agent_runner.rs`.
Shape 3 therefore is not a rule change, it is a registry feature —
a new per-path kind, three live-registry fixtures, and a parser that
reads it — proposed as a one-line exception. If somebody wants it, it
is a card of its own and it should be argued as the registry change it
is, not as a footnote to the ceremony table.

**AND THE RULING MAKES `T-025-s5` THE UNDER-CEREMONIED ONE, said out
loud because the card asked which of the pair was wrong.** Under shape 1
a bare `app/src-tauri/tests` fence took row 1 while the identical diff
under `app-agent` took row 2. That is the bare-path spelling being
imprecise about a blast radius, not the slug spelling being harsh. No
retrospective ceremony is owed — `T-025-s5` is `done` and re-opening a
landed card to buy a verifier for a test-file diff would be ceremony for
its own sake — but the direction of the error belongs in the record.

**THE SECOND HALF OF THIS CARD IS A LIVE DISAGREEMENT, RE-DERIVED HERE
RATHER THAN QUOTED**, and it survives whichever shape had won:

    grep -n 'C-14 owns' docs/ARCHITECTURE.md
    -> line 111: "C-14 owns `app/src-tauri/src/agent/**` + `agent-store.ts`"

    grep -n -A9 '^paths:' docs/architecture/components/C-14-*.md
    -> five entries, including app/src-tauri/tests/agent_runner.rs
       and app/test/agent-store.test.ts

Two documents describing one component's territory, one with two entries
and one with five, and the SHIPPED reading rests entirely on the second.
`docs/ARCHITECTURE.md` is added to this card's fence for that reason —
the prose is a signpost by ARCHITECTURE's own statement, and a signpost
that omits three of five paths is a signpost pointing somewhere else.

## Acceptance criteria

- THE SHIPPED PARTITION bullet SHALL state the ceremony consequence
  beside the disjointness one: narrowing or re-spelling a fence to a
  registry slug moves the card to the shipped row, and the verifier is
  priced against what the fence PERMITS rather than what the diff did.
- THE bullet SHALL carry the reason (the row is a pure function of the
  frontmatter, priced by triage before a diff exists), so the next
  reader inherits the ruling rather than re-deriving it.
- THE ceremony row for a size-S card SHALL be derivable from written
  rule without reading the diff twice and getting two answers.
- THE ARCHITECTURE prose describing a component's ownership SHALL agree
  with that component's own `paths:`, or SHALL say in the sentence that
  it is naming a subset and where the whole list lives. The lane SHALL
  fix the C-14 sentence at minimum and SHALL report whether other
  ownership sentences in the same bullet have the same gap.
- THE lane SHALL NOT edit `method/tasks/TASK-FORMAT.md`'s ceremony
  table: shape 1 changes nothing in the table, and a method edit would
  carry a version bump this card is not sized for.
- Verification: headless, through the docs gate that already reads these
  two documents; no suite body asserts the ceremony prose and none is
  added.

**PREFLIGHT AT PROMOTION, AND WHY IT IS NOT GREEN.**
`node scripts/brief.mjs --task T-025-s7 --preflight`, run from the e2e
package at `@ 51fa31c0964c`: **exit 1**, one finding, and it is the live
lane `T-154-s2` holding `docs/CONVENTIONS.md`. A fact about the clock.
Everything else ran clean: paths missing **0**, unrunnable figures **0**,
`blocked_by` nothing, ref stamps **1 of 1 resolving**. One path is
REPORTED and not refused — `method/tasks/TASK-FORMAT.md`, named by the
criterion that FORBIDS editing it; a prohibition has to name its subject,
the path is under no component, and the tool never refuses on that class.

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by opener: docs/conventions/standing-gates.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
