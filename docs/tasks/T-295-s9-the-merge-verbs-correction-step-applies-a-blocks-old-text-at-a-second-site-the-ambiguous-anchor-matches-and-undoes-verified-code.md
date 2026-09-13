---
id: T-295-s9
title: "The merge verb's correction step applies a mutant block's old text at a SECOND site the ambiguous anchor matches, undoing verified code on main — the role file says an anchor matches exactly once, and the step trusts that instead of checking it"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 2
status: building
suggested_by: "the architect seat at the T-314 merge, 2026-09-13"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

At the T-314 merge (17fd283b, 2026-09-13) the verifier's third correction block anchored on the three lines `if (!executable(site.hookFile)) {` / `return {` / `guarded: false,` (old) against `if (!present(site.hookFile)) {` / `return {` / `guarded: false,` (new). In `.claude/hooks/hook-install.mjs` at the bench tip 88ca5166 the `old` text occurs at two sites and the `new` text at one — the presence check that legitimately precedes the executable check in `hookStatus`. The verb's `correction:3` step reported exit 0, "the tree already carries the block's old text"; the merged tree on main then differed from the verified bench tip by ONE line: the presence check at that other site had become an executable check. The check that shadowed the not-executable branch made the correction's own body ("a hook git cannot EXECUTE is UNGUARDED…") red on the closing check at 647c74c6 while it was green on the bench at 88ca5166. The seat restored the file to the bench tip's bytes by hand and re-ran the spec green.

The role file's step 5b says each anchor matches its file EXACTLY ONCE and a block whose anchor matches twice names no site; the correction step trusts that rather than measuring it, and where the block's `new` text happens to match live code the step rewrites verified code into the mutant's opposite.

## Acceptance criteria

- WHEN the correction step reads a mutant block THE step SHALL count the sites the `old` text matches AND the sites the `new` text matches in the block's file at the merged tree, and SHALL refuse the block by name when either count is not exactly one — never applying `old` over a `new` match that is not the block's own site; a body plants a block whose `new` text matches a legitimate line elsewhere in a fixture file and requires the refusal, with the control that a block matching exactly once is still applied.
- WHEN a block is refused for an ambiguous anchor THE merged tree SHALL be left byte-identical to the bench tip for that file, pinned by a body that compares the file against the bench tip after the refusal.
- WHEN the verb's plan is printed THE correction step's line SHALL state both counts it measured, so a seat reading one line per step sees the anchor's ambiguity before the drill.

## Standing procedure until this card lands (the owner's instruction of 2026-09-13, for both harnesses)

After the merge verb stops, and before the seat drills or commits, the seat compares every file a mutant block names against the verified bench tip: `git diff <bench tip> HEAD -- <file>` for each such file MUST be empty, because the bench tip is the verified content. A non-empty diff means the correction step applied a block at a site other than the block's own (this card's finding); the seat restores the file from the bench tip (`git show <bench tip>:<file>`), re-runs the spec the block names, drills by hand at the site the verdict names, and records the restoration in the merge message. A block whose anchor matches more than one site is not handed to the verb's drill at all.

## Amendment of 2026-09-13 — the valid states of a block, and the comparison's subject (the Codex orchestrator's lean-delivery plan review of 2026-09-13; the seat's own correction)

This section supersedes the first criterion's rule "refuse when either count is not exactly one" and the standing procedure's `git diff <bench tip> HEAD` spelling; everything else stands.

- WHEN the correction step reads a mutant block THE step SHALL count, in the block's file as it will be committed, the sites the `old` text matches and the sites the `new` text matches, and SHALL act on exactly these states: `old` once and `new` absent — the correction is already applied, nothing is written; `old` absent and `new` once — the block is applied at that one site; any other combination (either text at two or more sites, both present, both absent) — REFUSED by name before any write, the file left in its pre-operation state, the two counts printed on the step's line. The safety claim rests on the counts the step measures, never on the block's sentence that its anchor is unique. Bodies cover all four states and the idempotent re-run.
- WHEN the seat applies the standing procedure THE comparison against the verified bench tip is over the content that will be committed — the staged merge and the working file (`git diff <bench tip> -- <file>` from the integration checkout, not `HEAD`, which does not describe a staged merge) — and a non-empty diff is INVESTIGATED before any restore: an authorized integration change (a correction the seat applied by hand, a keeper's redaction) is accounted for, not overwritten to produce an empty diff; only a change the step made outside the block's own site is restored from the bench tip.

## Amendment of 2026-09-13, the later one — a refused block leaves its file in its PRE-OPERATION state, and the standing comparison reads the index and the working tree separately (the Codex orchestrator's reconciliation review of 2026-09-13; the seat's own correction)

This section supersedes criterion 2 and the comparison spelling of the earlier amendment of 2026-09-13; everything else stands.

- WHEN a block is refused (any state other than the two the earlier amendment names as actionable) THE step SHALL perform no write to the block's file, and the file SHALL be byte-identical to its state immediately before the step ran — pinned by a body that hashes the file before the refused step and after it and requires the two hashes equal, with the control that an applied block moves the hash. The reference is the pre-operation state, not the bench tip: at a merge the file may legitimately differ from the bench tip by an authorized integration change (a correction the seat applied by hand, a keeper's redaction), and a refusal that restored the bench tip's bytes would erase it. Whether the file matches the verified content is the seat's separate investigation under the standing procedure, never the step's write.
- WHEN the seat applies the standing procedure THE comparison against the verified bench tip SHALL read the index and the working tree separately — `git diff --cached <bench tip> -- <file>` for the content staged to be committed, then `git diff -- <file>` for what the working tree adds to it — because a single `git diff <bench tip> -- <file>` reads only the working tree and answers empty while a wrong line sits staged and ready to commit. Both readings are investigated: a difference that is an authorized integration change is accounted for in the merge message; a difference the step made outside the block's own site is restored from the bench tip at that site only; the whole file is never restored merely to make a reading empty. The acceptance evidence covers a staged-only corruption (a wrong staged line under a restored working file) and a legitimate integration difference that survives the procedure unchanged.

## Implementation notes

Built 2026-09-14 by claude-opus-5@subagent in lane T-295-s9, base
329041c5, implementation commit b5746fa5. Two files, both in the fence:
tools/e2e/scripts/merge.mjs and tools/e2e/tests/merge.spec.ts.

**The step now counts, and the counting is the whole safety claim.**
`correctionFor` takes two readings of the block's file as it will be
committed — the sites the `old` text matches and the sites the `new`
text matches — and acts on exactly the two states the amendment of
2026-09-13 names: `old` once with `new` absent is already applied and
nothing is written; `old` absent with `new` once is applied at that one
site. Every other arrangement, including the T-314 one, is REFUSED by
name before any write, with both counts on the step's own line, and the
file left byte-identical to what the step found. The counts ride on
every answer the function gives (`oldSites`, `newSites`) and are printed
in one spelling, `correctionCountsLine`, so the three outcomes cannot
report their measurement three different ways.

**What went, and it went deliberately.** The reader this replaces MASKED
every occurrence of `old` and asked whether exactly one `new` survived.
At the T-314 merge one did — at the presence check that legitimately
preceded the executable check the block was about — and the step wrote
the block's `old` text over it. The mask also carried a second inference:
where a block's `new` text is a substring of its own `old`, an
already-corrected tree carries both and the mask deduced "already". The
two counts cannot tell that arrangement from "the correction is owed
here and its `old` text also occurs elsewhere", which is the arrangement
that cost main a line, so both-present is now a refusal rather than a
deduction. That is a retreat from an inference, not an oversight: a
refusal costs the seat one correction applied by hand at the site the
verdict names, and the inference cost verified code. The body that
pinned the old answer was rewritten to pin the refusal, and the thing it
was really protecting against — a defect left in the merged tree and
reported as a correction already made — survives, because the answer is
now loud instead of falsely "already".

**A property the refusal also buys**: an apply happens only where `old`
was absent and lands it once, so the tree the drill meets carries the
`old` anchor exactly once, which is what `plantMutant` already refuses
to proceed without.

**Criterion by criterion, as amended.** Criterion 1 (as amended): the
two actionable states and the refusal of every other, with the counts
never taken from the block's own sentence, pinned by "a block whose OLD
text also occurs elsewhere is REFUSED with both counts, never applied at
the site its NEW text names" — which carries the T-314 arrangement in
miniature (`old` at two sites, `new` at one legitimate site), the
one-of-each arrangement, `new` at two sites, both absent, the idempotent
re-run, and the control that a block naming one site is still applied.
Criterion 2 (as amended by the later amendment of 2026-09-13): "an
ambiguous anchor REFUSES the correction step with both counts, and
leaves the file byte-identical to what the step found" runs the whole
verb on a fixture repository, hashes the file on the runner's own plan
line for that step and again after the run, and requires the two hashes
equal, with the control arm — the same fixture with one site — requiring
the hash to MOVE. The reference is the pre-operation state, never the
bench tip, and the step's refusal branch performs no write at all.
Criterion 3: both counts are on the step's line in all three outcomes,
asserted on the refusal, on the applied line and in the unit bodies; the
step's own plan title and the verb's usage text say the line will carry
them.

**In-fence follow-through.**

- The body that pinned the masked reader's answer was replaced rather
  than deleted: same file, opposite property, with the measurement that
  changed the answer written into it.
- The verb's usage text now states the counting rule, because a seat
  reads the usage before it reads the step.
- A second new body, "a single git diff against the bench tip answers
  EMPTY over a wrong STAGED line", is the standing procedure's own
  acceptance evidence: it measures that a single `git diff` against the
  bench tip reads only the working tree and answers empty over a wrong
  line that is staged and ready to commit, that the index reading names
  it, and that a whole-file restore erases an authorized integration
  change the site-scoped restore keeps. The procedure itself stays the
  seat's hand and is not implemented here.

**Figures, every one at the implementation commit b5746fa5.**

- tools/e2e/tests/merge.spec.ts: 33 bodies, all green, the file's own
  run.
- The graded reading: `gate-run.mjs e2e --owning` over the two changed
  paths, exit 0, SCOPED-GREEN, 620 bodies across the 8 owning spec
  files. It is not the leg and does not mint a token, by its own words.
- `npm run typecheck` from tools/e2e: exit 0. `npm run lint:tokens`:
  clean, 188 TOKEN files and 1590 CONTROL files.
- The committed graph docs/architecture/graph.json carries 203 files and
  2488 edges at this ref and NOT ONE path under tools/e2e, so GRAPH
  REGEN fires by the letter of its path trigger over two changed files
  outside docs/ while the regen itself cannot move for this diff. The
  lane has no target/ and did not build the index crate to say so from
  the check's own mouth; that reading is the merge's.
- The census is STALE by construction and the merge regenerates it: one
  body title changed and two were added, and docs/CAPABILITIES.md is
  outside this fence. `npm run capabilities` at the merge, in the merge
  commit, also regenerates docs/INDEX.md.
- BOOT GATE: not owed, no path under app/src-tauri, app/src or either
  manifest. METHOD EVAL GATE: not owed, no path under method/ and no
  citation line added. DOCS GATE: FIRES on this card itself, which is a
  code input to 16 readers, and owes the app, parser and e2e suites.

**The drills, six mutants at b5746fa5, each restored and proved by
sha256 against the commit.** The restored hashes are
f4f57e19669d36905b91c212677cac14b675d75b95976bfb5650a73952696dc2 for
tools/e2e/scripts/merge.mjs and
1e4534ef260775b262ba1b14d72dbaa55c25ea3976b655d74606e2f10209df36 for
tools/e2e/tests/merge.spec.ts.

1. The state rule widened to apply on any `new`-once tree, which is the
   masked reader's answer: the two new refusal bodies RED, 31 passed,
   nothing else touched.
2. `correctionCountsLine` returning a constant: three bodies RED, the
   two new ones and the first correction body, which is the whole set
   that asserts the counts, 30 passed.
3. The refusal branch made to write before it returns: ONLY the
   byte-identity hash assertion RED, 32 passed — the criterion-2 pin,
   isolated.
4. A DATA mutant on the standing-procedure body: the wrong line left
   unstaged, so the index reading is empty and its assertion REDS.
5. A DATA mutant on the same body: the site-scoped restore replaced by
   the whole-file one, and the authorized change's assertion REDS.
6. The applied line's counts dropped: ONLY the control arm's assertion
   RED, 32 passed.

**Two suggestions, neither built here.**

- T-295-s11, size S: the mutant block grammar admits a block whose two
  anchors overlap — a `new` text that is a substring of its own `old` —
  and after this card such a block can only ever be refused at the
  merge, however honest it is. The reader could name that shape when it
  reads the block, so the verifier fixes the block rather than the merge
  stopping on it. Fence: tools/e2e/scripts/merge.mjs and
  tools/e2e/tests/merge.spec.ts.
- T-295-s12, size S: "the file as it will be committed" is the INDEX
  plus the working tree, and the step counts in the working file alone.
  The two agree today only because every step that writes also stages,
  which is a property nothing asserts — and the later amendment's own
  reason for reading the index separately is that a wrong line can sit
  staged under a clean working file. Either pin the agreement with a
  body or count where the commit reads. Fence:
  tools/e2e/scripts/merge.mjs and tools/e2e/tests/merge.spec.ts.

**Where the brief was wrong: nowhere I could measure.** Its facts about
the verb, the block layout, the T-314 slip and the drill's expectations
all held against the tree. One correction of the card's own record: the
"What was measured" section quotes the step as reporting "the tree
already carries the block's old text", and the code path that produces
the damage it then describes is the APPLY branch, whose line reads "now
carries the block's `old` text". The damage the section describes is the
apply branch's, and this lane read the card's measurement as that.

## Verdicts

Promoted 2026-09-13 (the architect seat's step-2 triage, under the owner's ruling of 2026-09-13 to run the regular ceremony without token or time limits; the Codex orchestrator's reconciliation review of the same day supported the order): to planned at priority 2 — the verb rewrote one line of verified code on main at the T-314 merge and the standing procedure is the seat's hand until this lands; dispatched after T-314-s6 and before the T-312 rerun.
