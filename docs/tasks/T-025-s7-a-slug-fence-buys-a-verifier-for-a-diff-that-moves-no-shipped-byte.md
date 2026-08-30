---
id: T-025-s7
title: A slug fence buys a verifier for a diff that moves no shipped byte — the same file, the same change, two ceremony rows, decided by how the fence was spelled
feature: F-04
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: []
touches: [docs/CONVENTIONS.md]
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

## Acceptance criteria

- THE ceremony row for a size-S card SHALL be derivable from written rule
  without reading the diff twice and getting two answers.
- WHERE a fence is narrowed or re-spelled for a disjointness reason, THE
  rule SHALL say whether the ceremony row moves with it.
- THE ruling SHALL be recorded with its reason even where shape 1 wins, so
  the next reader inherits the decision rather than re-deriving it.
