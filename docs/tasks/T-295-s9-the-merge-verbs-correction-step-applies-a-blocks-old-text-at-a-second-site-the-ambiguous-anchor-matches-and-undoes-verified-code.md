---
id: T-295-s9
title: "The merge verb's correction step applies a mutant block's old text at a SECOND site the ambiguous anchor matches, undoing verified code on main — the role file says an anchor matches exactly once, and the step trusts that instead of checking it"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 2
status: done
suggested_by: "the architect seat at the T-314 merge, 2026-09-13"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
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

### The integrator's corrections of 2026-09-14 (the verdict's two wording corrections, applied as an append because a record is never rewritten)

- Correction 1: the step's comment in merge.mjs gave a false reason for counting the working file (that the working copy is what a commit takes). Replaced by the true one: the verb's precondition:clean step refuses a dirty tree and every writing step also stages, so the working file is the staged content by construction; the verdict's correction 2 pins that invariant.
- Correction 4: this card's own measured section and the lane's comments say the block's `old` text occurred at TWO sites at 88ca5166. Measured by the verifier and by M15: the three-line `old` and `new` texts each occur ONCE — the arrangement was both-present, which the counts now refuse — and it is the single-line needle that occurs twice. The comments in merge.mjs and merge.spec.ts are corrected in the merge; this line corrects the record; the lane's notes paragraph describing its fixture ("in miniature, `old` at two sites") describes the fixture and stands.

## Verdicts

Promoted 2026-09-13 (the architect seat's step-2 triage, under the owner's ruling of 2026-09-13 to run the regular ceremony without token or time limits; the Codex orchestrator's reconciliation review of the same day supported the order): to planned at priority 2 — the verb rewrote one line of verified code on main at the T-314 merge and the standing procedure is the seat's hand until this lands; dispatched after T-314-s6 and before the T-312 rerun.

### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

The measured fault is closed on its own real input. I took the block the
T-314 verdict actually committed — `correction: C3`, whose `old` is the
three lines opening `if (!executable(site.hookFile)) {` and whose `new`
is the same three with `!present(...)` — and ran it against the real
blob `.claude/hooks/hook-install.mjs` at 88ca5166, through the reader
this diff removes and through the reader it installs. The base reader
**writes**: exactly one line moves, and it is the presence check the
block was never about — `if (!present(site.hookFile)) {` becomes
`if (!executable(site.hookFile)) {`, the exact line main lost.
The tip's reader **refuses**, writes nothing, and prints
`` `old` matches 1 site(s), `new` matches 1 site(s) ``. That is the card's
whole subject reproduced and killed, not a miniature of it.

Three criteria are met, and four corrections are assigned: two are
wording repairs to statements this diff commits into living code that my
own measurements contradict, and two are bodies committed on this bench
after this verdict, each with a mutant block.

#### The frame I actually had, and the seals

The pass was TWO SPAWNS. Phase 1 held no tools, no diff and no notes; it
wrote the attack set and the eighteen measurement requests from the card
at the base alone. I am a fresh spawn: I hold tools, I read the diff and
the specs before the executor's report, and I cannot return to phase 1's
frame. Nothing executor-derived reached me above the line — the brief's
duties section named no mutant count, no path count and no suite figure.

- the attack set, sha256
  `29d163a5fc1241b16510c7b630edab4b4bb8d4c5ca1624d3f3063a7f936d73f8`
- the ground with the seat's addendum (M1 to M18), sha256
  `72a8ecc449e69cd44f0a12290555ba77fd4123bd6779e51cce7c6f4f89b8f507`
- the addendum's raw transcript beside it, sha256
  `053e81696af65853eaee46fcebbb313fdd79738ecd61424f9ec70d270f7bda9c`
- the card at the base 329041c5, sha256
  `0817c7de2e11985e16e37cadbc51dd3f389f82bb8ab09cefb8d02bd629a96b0e`,
  re-derived on this bench and equal.

Every one of the eighteen measurements was taken. None came back "not
taken", so no criterion below rests on unmeasured ground.

#### The counts this verdict CLAIMS, which are the ones at the tree a merge grades

This table is first on purpose. The reader that grades a merge's own runs
against a verdict takes the FIRST count it finds beside each leg's name,
and my two correction bodies move the e2e count off the tip I was sent —
so the claim has to be the tree the merge will actually read, not the one
I was handed, or the verb stops on a count that moved for no fault of the
diff.

| leg | bodies | measured |
|---|---|---|
| parser | 413 | unmoved by this verdict |
| app | 1171 | unmoved by this verdict |
| rust | 655 | unmoved by this verdict, over 18 targets |
| e2e | 1085 | ade1b2de plus this verdict's two correction bodies, taken before either was committed |

The e2e leg reads RED at that count until correction 3 is applied — 1
failed, 1084 passed, and the one failure is correction 3's own body,
which is the RED reading step 5b requires and is named as such below. The
verb applies every correction BEFORE it regenerates or drills, so the
merged tree's own e2e run is over the same 1085 bodies with none failing.

#### The suites, whole, at the tip I was sent

The guarded tier keeps the whole battery. All four legs at
ade1b2dec9226258137f881f190b33aa88c9b797, on this bench, port 25295:
the parser leg 413 bodies exit 0 GREEN; the app leg 1171 bodies exit 0
GREEN; the rust leg 655 bodies over 18 targets exit 0 GREEN; the e2e leg
1083 bodies exit 0 GREEN. Not one red, and nothing to attribute to a
named intermittent.

`tools/e2e/tests/merge.spec.ts` alone: 33 passed, and the two fenced
files hash to `f4f57e19669d36905b91c212677cac14b675d75b95976bfb5650a73952696dc2`
and `1e4534ef260775b262ba1b14d72dbaa55c25ea3976b655d74606e2f10209df36`,
equal to the restore hashes the lane's notes publish — so the tree the
lane drilled is the tree I graded.

#### A row per acceptance criterion, with the reading that decided it

| criterion | verdict | the reading that decided it |
|---|---|---|
| C1 and C2, the originals | SUPERSEDED, not graded | The card's two amendments of 2026-09-13 replace both in as many words; each is graded below under the text that supersedes it. C1's language survives only in "count both texts", which A1-1 carries. |
| A1-1 — count both anchors in the block's file as it will be committed; act on `old` 1 / `new` 0 and `old` 0 / `new` 1; REFUSE every other arrangement by name before any write; the claim rests on the counts, never on the block's sentence | **MET**, with two corrections | `correctionFor` counts raw occurrences of both texts and branches on nothing else; the mask and its inference are gone. Driven, not read: my own run of the real T-314 block over the real 88ca5166 blob refuses where the base writes (above). The state table is pinned arm by arm at (1,0), (0,1), (0,0), (1,1), (2,1), (0,2) and on the idempotent re-run. My mutant V1 — the apply state widened to any `new`-once tree, which IS the masked reader — reds 2 bodies at 31 passed, so the guard was seen failing where it is absent. My mutant V3 — apply on `new` at two or more sites — reds a DIFFERENT single body, so neither refusal body's kill set contains the other. **Correction 1**: the step's comment gives a false reason for counting the working file. **Correction 3**: the counter walks past an overlapping site, so a `new` text matching twice can be counted once and written at the first. |
| A2-1 — a refused block is written not at all, and the file is byte-identical to its state immediately before the step ran; the reference is the PRE-OPERATION state, never the bench tip; the control is that an applied block moves the hash | **MET** | The refusal branch returns before any `writeFileSync`, read off the diff. The body hashes `src/a.ts` on the runner's own plan line for `correction:1` and again after the run. I checked the boundary the card names rather than trusting it: the runner's loop is `printStep(out, step); const code = runStep(step, stepIo);`, so that plan line is printed immediately before that step runs and the hash is genuinely pre-operation, not pre-verb. My mutant V2 — the refusal branch made to write before returning — reds EXACTLY the byte-identity assertion, 1 failed / 32 passed: the pin is isolated. The control arm is a distinct fixture and a distinct invocation, and requires the hash to MOVE. My DATA mutant V5 — the ambiguous fixture disarmed by deleting the second site the block's `new` text matched — reds the refusal body alone, which is what separates "refused because ambiguous" from "refused, full stop". |
| A2-2 — the standing comparison reads the index and the working tree separately, because one `git diff <bench tip> -- <file>` answers empty while a wrong line sits staged; the evidence covers a staged-only corruption and a legitimate integration difference that survives unchanged | **MET**, with a residual | Delivered as executable evidence inside the fence, which is what I pre-committed to demand: a real git fixture takes all three readings and requires the single spelling to answer the empty string while `--cached` names the line. That negative control is the only thing that makes the criterion non-vacuous and it is OBSERVED, not asserted. The second half carries both a wrong staged line and an authorized integration change, and requires the whole-file restore to lose the authorized change while the site-scoped one keeps it. Residual, recorded as a finding and not a correction: the fixture is a clean checkout rather than an in-progress merge, and the criterion's scenario is a staged merge — measurement M11 took the same three readings inside a real in-progress merge with MERGE_HEAD standing and got the same three answers, so the property holds on measured ground the body does not itself carry. |
| C3 — the correction step's line states both counts it measured, so a seat reading one line per step sees the ambiguity before the drill | **MET**, in the only coherent reading | I pre-committed that this sentence is degenerate as written and that I would accept it only with a single-measurement binding pinned by fixtures with DIFFERENT count pairs. Both are here. One `CorrectionCounts` object is measured once in `correctionFor`, spread onto all three answers, and printed through one `correctionCountsLine` — the number printed IS the number branched on, and there is no second measurement to disagree with the first. All three outcomes print it, applied as well as refused, which is the "counts only on refusal" attack refuted. My mutant V4 — `correctionCountsLine` returning the ambiguous pair as a CONSTANT — reds 3 bodies at 30 passed, because four distinct pairs are asserted; a constant or a placeholder cannot pass. The literal "when the plan is printed" cannot be satisfied by any implementation: the plan is printed before any step runs, so the counts do not exist yet. The step's own run line is the only place they can be, and it is before the drill, which is the sentence's stated purpose. |

#### The pre-commitments from the attack set, honoured one by one

- **D1, C3 degenerate as written.** Resolved in the diff's favour on the
  single-measurement binding and the differing fixtures, above.
- **D2, A2-2 might be out of fence or delivered as prose.** It is neither:
  a git-fixture body inside `tools/e2e/tests/merge.spec.ts`. The preflight
  at the base answered 0 criteria naming a path the fence does not reserve
  (M10), so the suspicion was mine and the tree refutes it.
- **D3, the `old`/`new` direction might be inverted.** Measurement M3
  settled it before the diff: the base step writes `old` where the tree
  carries `new`, and the diff keeps that direction. I pinned it myself
  rather than take the label's word — a block with `old: "GOOD"`,
  `new: "BAD"` over `"p\nBAD\nq\n"` returns `"p\nGOOD\nq\n"`. The
  card's amendment and the code agree, and my pre-commitment to report a
  card defect if they had not is discharged unused.
- **D4, "as it will be committed" is under-determined.** Upheld, and it
  is correction 1 and correction 2 below. The diff names ONE content and
  it is the working file; the content a commit takes is the index. They
  agree at the correction step for a reason the diff does not name.

#### The attacks that failed, which is most of them

`$&`, `$1` and `$'` inside a block's `old` are written literally — the
apply uses a FUNCTION replacement, and I drove a block whose `old` is
`X$&Y$1Z$'` through it to see the literal come out. No regex is built
from block text, so the metacharacter and ReDoS attacks have no surface.
`old === new` is refused twice over, at the reader and again by the
counts. An empty `new` cannot reach a write. A second site differing by
indentation or by CRLF is counted as its own site and refused, so the
byte-exactness attack turns out to defend rather than expose. Counts are
taken inside the step, per step, from a fresh read, so the stale-counts
and TOCTOU attacks find nothing. "Refused by name" is not cosmetic: the
step returns `EXIT.FOUND`, the runner stops the verb, and the body
asserts the ledger exit and `stopped at correction:1` rather than a log
line. The guard is not off the real path — one body drives `mergeMain`
end to end, and my V1 and V5 mutants both land through it. The refusal
is a named return, not a throw, so the plan line survives it.

#### The drills I ran myself, each restored and the restoration proved

Aiming stated, landing read from `git diff` and from the planter's own
refusal to plant a non-unique anchor, never from a mutator's report. All
at ade1b2de; after every one, `tools/e2e/scripts/merge.mjs` hashes back
to `f4f57e19…96dc2` and `tools/e2e/tests/merge.spec.ts` to
`1e4534ef…09df36`.

| # | mutant, and where it is aimed | reading | what it proves |
|---|---|---|---|
| V1 | the apply state widened to `counts.newSites === 1` — the masked reader's own answer restored, at the state table | 2 failed, 31 passed | the positive control on the guard, SEEN red where the property is absent |
| V2 | the refusal branch writes before it returns, at the no-write site | 1 failed, 32 passed | A2-1's hash pin is isolated to exactly that assertion |
| V3 | apply when `new` matches two or more sites, at the state table | 1 failed, 32 passed | the two refusal bodies' kill sets are disjoint; neither contains the other |
| V4 | `correctionCountsLine` returns the ambiguous pair as a constant, at the one spelling | 3 failed, 30 passed | C3 survives no constant; four distinct pairs are asserted |
| V5 | DATA — the ambiguous fixture disarmed: the second site the block's `new` text matched is deleted | 1 failed, 32 passed | the refusal is caused by the ambiguity, not by an implementation that refuses everything |
| V7 | the correction step writes but does not STAGE, at the `git add` | 1 failed beyond the correction-3 body, 33 passed | correction 2's body bites, and bites alone |

#### The security sweep, concrete to what this diff changes

No new input path, no new endpoint, no new dependency, no secret. The
diff adds no subprocess: the one `git` call in the step is the
pre-existing `spawnSync` in array form with a `--` separator, so no
shell string exists to inject into and a path beginning with `-` cannot
be read as a flag. A block's `file` is validated at the read, which
refuses a path escaping the root, so the step's `path.join` cannot be
walked out of the tree. Nothing is built into a regex, so neither a
metacharacter nor a catastrophic pattern reaches a matcher. The refusal
line prints the block's own repo-relative path and no file content, so
it cannot carry a home path into a merge message and stop a later push
at the forbidden-spelling keeper. Both new fixtures build under
`os.tmpdir()` and tear down through `removeGitFixture`; neither runs
`git` in a live checkout, and the one that sets an identity uses
`fixture@example.invalid`, which the suite already carries. A malformed
block still cannot reach this function at all. Nothing here is
REJECTED-level.

#### Adjacent features, checked rather than assumed

The apply branch now runs only where `old` was absent and lands it once,
so the tree `plantMutant` meets carries the `old` anchor exactly once —
the precondition it refuses to proceed without is strengthened, not
weakened. The `already` branch narrows: a tree carrying `old` at two
sites with `new` absent used to be waved through as "already" and would
then have been refused one step later by the drill; it is now refused at
the step, which moves the same answer earlier and loses nothing. The
usage text and the step title moved, and no body pinned either verbatim
— the whole e2e leg is green at 1083 bodies. `correctionSteps`,
`assignsCorrections`, `drillSteps` and the message writer are untouched
in shape.

#### The findings that are not corrections

1. **The substring retreat is real, argued, and costs the seat hand
   work.** Where a block's `new` text is a substring of its own `old` — a
   clause deleted, a guard dropped — an already-corrected tree carries
   both, which is now a refusal. Its idempotent re-run is therefore
   refused too, so "run it twice, write once" holds for ordinary blocks
   and not for overlapping ones. The card's amendment orders exactly this
   and the lane argues it in the body and in the notes rather than hiding
   it, which is the right handling; I record it so the next seat to meet
   a refused block knows it may be honest. I file **T-295-s11** for the
   remedy the lane proposed and did not file.
2. **A2-2's body is a clean checkout, not an in-progress merge.** Graded
   MET above on M11's measured ground. Worth a body some day; not worth a
   correction, because the reading it would add has already been taken.
3. **The card's own central figures are off, and the record stands.** The
   card says the `old` text occurs at TWO sites in
   `.claude/hooks/hook-install.mjs` at 88ca5166 and the `new` text at
   one. Measured: the block's three-line `old` occurs ONCE and its
   three-line `new` ONCE (M15 says the same, and my own run over the real
   blob confirms it — it is the single-line needle that occurs twice,
   because the two-space form is a substring of a four-space line). The
   card's narrative also attributes the damage to the "already carries"
   line when the branch that did it is the apply branch. The lane found
   the second half and said so; the first half is correction 4 below,
   because the lane copied the wrong figure into living code.

#### The assigned corrections

Four corrections, two mutant blocks. Corrections 1 and 4 are wording
repairs to statements about measurements: **each pins no property and
owes no block, and I say so here in as many words** so the shortfall
between four corrections and two blocks is not read as two bodies nobody
wrote. Corrections 2 and 3 are bodies committed on this bench in the
commit after this verdict, in `tools/e2e/tests/merge.spec.ts`, each run
both ways before it was committed.

**Correction 1 — the step's comment gives a FALSE reason for counting
the working file, and the true reason is worth naming.** Not blocking.
The comment above the read in `applyCorrectionStep` says "the merge is
staged and the working copy is what the commit takes". A commit takes
the INDEX, never the working tree, and the card's own later amendment
exists precisely because a wrong line can sit staged under a clean
working file. The counts are nevertheless taken on the committed content
— but for a reason the diff never states: the verb's own
`precondition:clean` step refuses to merge onto a dirty tree, so the
index and the working tree agree before the merge, and every step that
writes between there and here also stages what it wrote. Replace the
false claim with that one. The invariant it names is what correction 2
pins.

**Correction 2 — the invariant the counts rest on is asserted by
nobody, and now is.** Committed on this bench after this verdict, in
`tools/e2e/tests/merge.spec.ts`. The body drives the whole verb on a
fixture and reads the INDEX straight — `git show :src/a.ts` — requiring
the staged content to carry the correction, and requiring `git diff
--name-only -- src/a.ts` to be empty, so that what the step counted on
disk is what the commit would take. Read **RED** against an
implementation lacking the property — the step's `git add` replaced by a
`git status --porcelain` that stages nothing and still exits 0 — at 1
failed beyond the correction-3 body / 33 passed, failing on `the STAGED
content carries the correction`; and **GREEN** against the implementation
carrying it, in the 35-passed run. Note for the drill: this block is in
the already-applied state, so nothing is written for it and the drill is
what grades it.

**Correction 3 — the counter walks past an overlapping site, so a text
matching TWO sites can be counted as one and written at the first.**
Committed on this bench after this verdict, in
`tools/e2e/tests/merge.spec.ts`. `occurrences` advances by the needle's
own length, so a needle whose prefix is also its suffix is counted low:
`occurrences("YYY", "YY")` answers 1 where the text carries two sites.
A block with `old: "XX"`, `new: "YY"` over `"zz YYY zz"` is therefore
read as `old` 0 / `new` 1 — an actionable state — and applied, leaving
`"zz XXY zz"`. That is this card's whole subject reached through the
counter rather than through the state table, and the card says in as many
words that the safety claim rests on the counts. I measured the size of
it rather than assert it: over all 56 mutant blocks committed under
`docs/tasks`, one block already carries anchors that self-overlap, and
across every block against its live file the two strides disagree ZERO
times today — so this is a latent hardening, not a live fault, and it is
assigned rather than rejected for that reason. The fix strides by one,
which can only ever raise a count; every caller of this function —
`plantMutant`'s anchor, `plantMutant`'s back-check and `bumpOne`'s stamp
anchor — asks "exactly once", so no caller can be weakened by it. Read
**RED** against the implementation lacking the property, which is the
tip as it stands, at 1 failed / 34 passed, failing on `three Ys carry two
overlapping YY sites`; and **GREEN** against one carrying it at 35
passed, with the whole file's other 33 bodies green under the change.

**Correction 4 — the "TWO sites" figure is copied from the card into
living code, and it is wrong.** Not blocking. Three places now state that
at the T-314 merge the block's `old` text matched
`.claude/hooks/hook-install.mjs` at TWO sites and its `new` text at ONE:
the doc comment above `correctionFor`, the comment opening the rewritten
refusal body, and the criterion-by-criterion paragraph of the
implementation notes. Measured against the real blob at 88ca5166 with
the real block, both three-line texts match exactly ONCE, and the
arrangement that cost main a line is one-of-each — which is the same
arrangement the lane's own ambiguous fixture builds and the same one its
body asserts as `` `old` matches 1 site(s), `new` matches 1 site(s) ``.
The prose contradicts the body beside it. Restate all three as one site
each, and keep the two-site case where it belongs: as the further
arrangement the state table also refuses, which the body already covers
at (2,1). The card's own "What was measured" section is the RECORD and is
not rewritten; this verdict corrects it.

```mutant
correction: correction 2 — the invariant the counts rest on is asserted by nobody
file: tools/e2e/scripts/merge.mjs
spec: tools/e2e/tests/merge.spec.ts
body: what the correction step WROTE is also STAGED, so the working file it counted IS the content the commit will take
message: the STAGED content carries the correction
--- old
  const added = spawnSync("git", ["-C", io.projectRoot, "add", "--", block.file], { encoding: "utf8" });
--- new
  const added = spawnSync("git", ["-C", io.projectRoot, "status", "--porcelain", "--", block.file], { encoding: "utf8" });
```

```mutant
correction: correction 3 — the counter walks past an overlapping site
file: tools/e2e/scripts/merge.mjs
spec: tools/e2e/tests/merge.spec.ts
body: the counter counts OVERLAPPING sites, so an anchor whose prefix is also its suffix names TWO sites and is refused
message: three Ys carry two overlapping YY sites
--- old
    // STRIDE BY ONE, never by the needle's length (T-295-s9): a needle
    // whose prefix is also its suffix matches at OVERLAPPING positions,
    // and a stride of `needle.length` walks past the second one and
    // reports ONE site where the text names two. Every caller of this
    // function asks "exactly once", so a count that is low by one is a
    // write at a site nobody named.
    at = haystack.indexOf(needle, at + 1)
--- new
    at = haystack.indexOf(needle, at + needle.length)
```

I checked both anchors with the very function under test before writing
them here: in `tools/e2e/scripts/merge.mjs` at this bench, correction 2's
`old` matches 1 and its `new` 0 — the already-applied state, nothing
written; correction 3's `old` matches 0 and its `new` 1 — the owed state,
applied at that one site. Neither is an arrangement this card's own step
refuses, and neither anchor matches twice.

#### The order the merge owes these two blocks

Correction 3's block is APPLIED and correction 2's is ALREADY, so both
are actionable and the verb's own step will say so on its line. The
corrections all run before any drill, which the plan already guarantees,
and that order matters here: correction 3's body is RED until correction
3 is applied, so a drill of correction 2's block taken before correction
3 is applied would red two bodies and be refused as a mutant that reds
more than its own body. In the verb's own order it reds exactly one.

#### The census, which this verdict makes staler

`npm run capabilities:check` from `tools/e2e` answers STALE at the tip I
was sent — committed 100241 bytes against a fresh 100538 — because the
lane renamed one body and added two. My own two bodies add to that. The
lane REPORTS it and the integrator regenerates `docs/CAPABILITIES.md`
and `docs/INDEX.md` in the merge commit, which is the convention
`docs/CONVENTIONS.md` publishes and not a defect of this diff.

#### Step 7 — the gates at the tip I CREATED, which is not the tip I was sent

Every figure in this section is measured at
`a225c8b622f52b2d6ee4284811e8b8603c2c02a0` — this bench after the verdict
commit, the correction-bodies commit and the filed card. The tables above
name `ade1b2de` and stay true there; these name this ref, because a
count without its ref is wrong the moment anybody writes again, and I
wrote three times.

| leg | bodies | exit | verdict |
|---|---|---|---|
| the parser leg | 413 | 0 | GREEN |
| the app leg | 1171 | 0 | GREEN |
| the rust leg | 655 over 18 targets | 0 | GREEN |
| the e2e leg | 1085 | 1 | RED, by design — one body, named below |

**The one red is mine, it is deliberate, and it is the RED reading step
5b requires.** 1 failed, 1084 passed, 17.3 minutes. The failure is
`tests/merge.spec.ts` › `the counter counts OVERLAPPING sites, so an
anchor whose prefix is also its suffix names TWO sites and is refused`,
failing on `three Ys carry two overlapping YY sites`. That body is
correction 3, committed here against an implementation that lacks the
property, exactly as step 5b describes: a body committed without both
readings is a body nobody has graded, and the only way to take the RED
reading is to commit it before the correction is applied. The verb
applies every correction BEFORE it regenerates or drills, so this body is
green at the merged tree and the leg is 1085 of 1085 there. **A seat that
picks this branch up before the merge will see this red: it is this
verdict's, not the lane's, and it is healed by applying correction 3.**

No other red anywhere. The push-guard leg is green, so the named
intermittent at this base — the body that reds when two hook runs
straddle a minute boundary (T-314-s5) — did not fire on this run and
nothing here needs attributing to it. The `range-rule` DISCLOSURE line
about GRAPH REGEN's flip figures printed in the run and is a
measurement, not a failure, by its own words.

`npm run capabilities:check` from `tools/e2e` — **exit 1, STALE**:
committed 100241 bytes against a fresh generation of 100770. It was
already stale at the tip I was sent, at 100538, because the lane renamed
one body and added two; my two correction bodies account for the rest.
The lane REPORTS this and the integrator regenerates
`docs/CAPABILITIES.md` and `docs/INDEX.md` in the merge commit, which is
the convention `docs/CONVENTIONS.md` publishes for a fence that leaves
the census read-only. **The fresh figure to expect at the merge is not
this one** — it is taken over the merged tree, which carries main's own
moves as well.

`cargo run -p supertaskr-index -- index --check --root ../..` from
`app/src-tauri` — **exit 0, CURRENT**: 1216090 bytes, 203 files, 2593
symbols, 2488 edges; budget 1216090 of 2145959 bytes (56.7%), 929869
left; floor 240298 of 2145959 (11.2%). My three commits are two markdown
files and one spec file, and the committed graph carries no path under
`tools/e2e`, so the regen could not move for them and did not.

I also re-read the two fenced files at this tip:
`tools/e2e/scripts/merge.mjs` still hashes to
`f4f57e19669d36905b91c212677cac14b675d75b95976bfb5650a73952696dc2`,
which is the lane's own restore hash — I drilled six mutants into it and
every one is backed out. `tools/e2e/tests/merge.spec.ts` has moved, as it
must, since corrections 2 and 3 are committed in it.

#### What I wrote to the tree, so a later reader can subtract it

Three commits on this bench after the tip I was sent: the verdict; the
two correction bodies in `tools/e2e/tests/merge.spec.ts`, which add two
bodies and one import and change no other line of that file; and
`docs/tasks/T-295-s11-…md`, a suggested card filed under step 6. No code
file was changed by me: corrections 1 and 4 are wording repairs stated in
this verdict for the merging seat, and corrections 2 and 3 reach
`tools/e2e/scripts/merge.mjs` only through the mutant blocks above. The
lane's own tip is untouched; nothing was pushed; no other checkout was
written to.
