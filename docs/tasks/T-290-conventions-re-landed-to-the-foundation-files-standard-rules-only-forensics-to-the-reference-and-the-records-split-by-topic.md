---
id: T-290
title: CONVENTIONS re-landed to the foundation-files standard (ADR-023) — every bullet cut to its rule and its keeper, the forensics moved to the reference chapters and the cards, split into topic files under docs/conventions/ with the index carrying each opener verbatim, the readers and budgets re-pointed in the same commit
feature: F-01
milestone: 4
size: L
tier: guarded
priority: 2
status: verifying
suggested_by: "@human (2026-09-09): \"Rule A–D as proposed\" — decision B of docs/rooms/foundation-files-standard.md"
blocked_by: []
touches: [docs/CONVENTIONS.md, docs/conventions/, docs/reference/, docs/INDEX.md, docs/CAPABILITIES.md, tools/e2e/scripts/, tools/e2e/tests/, .claude/hooks/, app/src-tauri/src/agent/kit.rs, app/src-tauri/src/dispatch/brief.rs, app/src-tauri/src/lib.rs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by:
review: independent
---

## What was measured

docs/CONVENTIONS.md is 134,029 bytes at 6c7c7e6 against a budget of 117,502 / 146,878 / 176,253 where its siblings sit under 10 KB: two sections (Gotchas 98 KB, Build & test 35 KB), 39 bullets, the largest twelve between 4 and 15 KB. 61 code and spec files name it by path (21 specs); the context pack reads its bullets by opener (bulletByOpening, boldedOpeners); the kit's pin test reads its stamp line. 35 planned cards fence it whole. Overlap is not the cause (one duplicated line in 283 of 70+ characters, none shared verbatim with another live document); content class is. Dispatch AFTER the rename sitting (the rename edits this file's spellings) and after T-287 (the fence token for a file that does not exist yet).

## Acceptance criteria

- WHEN the lane starts THE census SHALL be taken first and committed to the card with its ref, before a byte moves: every reader of docs/CONVENTIONS.md by path across the tree (the docs gate's own derivation and `git grep -l`, code and message strings apart from comments), every bullet a pack reader cites by opener (bulletByOpening and boldedOpeners in tools/e2e/scripts/dispatch-brief.mjs, and the app's dispatch brief in app/src-tauri/src/dispatch/brief.rs, which reads the lane-spelling and dispatch-from bullets), every program-read sentence (the sentences the specs pin verbatim, the DOCS GATE and RANGE RULE lines, the Build & test commands, the method-version stamp sentence the kit's pin test reads), the hooks under .claude/hooks/ that name the file, and the cards whose fences name the file whole.
- WHEN a bullet is re-landed THE result SHALL be its rule as an imperative, the keeper it names, and the card that made it — and nothing else; its history, measurements and argument SHALL move VERBATIM to the docs/reference chapter that owns the topic or to the card that owns the history, with a pointer in place; a moved paragraph that differs from the base by a byte is a rewrite of a record and is refused.
- WHEN the file is split THE topic files SHALL live under docs/conventions/ beside the bootstrap README, docs/CONVENTIONS.md SHALL remain the index carrying each bullet's opener verbatim and the file it lives in, every program-read sentence SHALL be byte-identical to the base — proved by the census diffed against the base, as T-236's compaction proved it — and the method-version stamp sentence SHALL stay in docs/CONVENTIONS.md byte-identical but for the version the merge verb moves; where the release-note history goes is the lane's design, and the bump's writer in tools/e2e/scripts/merge.mjs is re-pointed at it in the same commit, the seat's merge practice told on the card.
- WHEN a reader is re-pointed THE re-pointing SHALL land in the same commit as the move; DOC_BUDGETS in tools/e2e/scripts/docs-scan.mjs SHALL carry a row per topic file and a re-landed row for docs/CONVENTIONS.md itself at its size as the index, each landed as `wc -c` at the landing commit with `warn = ceil(landed + max(F, landed × 0.25))` and `fail = ceil(max(landed × 1.5, warn + F))` — one formula for every size, so a file under 4F lands with fail F above warn and warn never crosses fail — F re-derived at the landing commit by ADR-019 addendum 5's rule (one ordinary merge's growth of the smallest governed document), recorded beside the standing 2,053 and applied to the rows this lane lands, the other rows keeping their lines; INDEXED_DOCS SHALL carry each topic file so docs/INDEX.md gains one generated line per topic file, regenerated in the same commit; both pack readers — the e2e arm's and the app's — SHALL find a bullet across the topic files, pinned by bodies in both suites; and the message strings that name a bullet's home SHALL name the file it now lives in.
- WHEN the lane is done THE fence census SHALL be re-read and recorded on the card: the non-done cards whose fences name docs/CONVENTIONS.md whole (70 at 767a68ff, 45 of them planned), each with the topic file its subject moved to, as the records action the seat takes after the merge — the lane edits no card but its own; the four legs and the docs gate SHALL be green at the tip; the health band docs-headroom/docs/CONVENTIONS.md SHALL read inside; the whole result SHALL be measured on the card — the index plus every topic file summed against the pre-split file at the base, the bytes moved verbatim to docs/reference and the cards listed with their destinations, per-file headroom reported per file and never compared with the old single-file headroom; and the ADR-019 addendum that re-lands the budgets SHALL be proposed by the seat to the owner with the rows' commit, the formula and the re-derived F, never written by the lane.
- IF a bullet's rule cannot be separated from its argument THEN the card SHALL say which and why, and the bullet SHALL move whole to the reference chapter with its rule restated in one line in the index — never left in place.

## Former criteria — 2026-09-09, superseded by the refreshed contract of 2026-09-14 (kept verbatim)

- WHEN the lane starts THE census SHALL be taken first and committed to the card: every reader of docs/CONVENTIONS.md by path (the docs gate's census, `git grep -l`), every bullet the context pack reads by opener, and the stamp line's readers — before a byte moves.
- WHEN a bullet is re-landed THE result SHALL be its rule as an imperative, the keeper it names, and the card that made it — and nothing else; its history, measurements and argument SHALL move VERBATIM to the docs/reference chapter that owns the topic or to the card that owns the history, with a pointer in place.
- WHEN the file is split THE topic files SHALL live under docs/conventions/, CONVENTIONS.md SHALL remain the index carrying each bullet's opener verbatim and the file it lives in, and every program-read sentence (the Build & test commands, the DOCS GATE and RANGE RULE lines the specs read, the stamp line) SHALL be byte-identical to the base — proved by the census, as T-236's compaction proved it.
- WHEN a reader is re-pointed THE re-pointing SHALL land in the same commit as the move, the docs gate's DOC_BUDGETS SHALL carry a budget per topic file of the same order as the other governing documents, and the pack's reader SHALL find a bullet across the topic files.
- WHEN the lane is done THE fence census SHALL be re-read: the planned cards fencing docs/CONVENTIONS.md whole before and after, and the four legs green at the tip; the health band docs-headroom/docs/CONVENTIONS.md SHALL read inside.
- IF a bullet's rule cannot be separated from its argument THEN the card SHALL say which and why, and the bullet SHALL move whole to the reference chapter with its rule restated in one line in the index — never left in place.

## Refreshed contract of 2026-09-14 (the owner's ruling of 2026-09-14: bootstrap, contract and fence refreshed before dispatch)

Measured at 767a68ff: docs/CONVENTIONS.md is 173,024 bytes against the budget row landed 117,502 / warn 146,878 / fail 176,253 (3,229 bytes under the hard line before T-322's allowance of at most 2,000); Gotchas 127,679 bytes, Build & test 44,830; twenty bullets open with a bolded name. Files naming the path: 47 under tools/e2e, 11 under app/src-tauri, 5 hooks, 3 under lib/parser, 365 cards, 22 checkpoint records; of the 21 scripts under tools/e2e/scripts/ that name it, seven do so in code or message strings a reader follows (brief.mjs, docs-gate.mjs, gate-run.mjs, health-bands.config.mjs, lane-fence.mjs, rename-scan.mjs, token-scan.mjs) and the rest in comments, so the fence names the directory whole rather than a list that the census will outgrow; the app's dispatch brief (app/src-tauri/src/dispatch/brief.rs) reads two bullets by opener and its test plants the file as a brief source (app/src-tauri/src/lib.rs), so both are fenced; docs/INDEX.md is generated from INDEXED_DOCS in docs-scan.mjs and the docs gate reds while it is stale, so it is fenced with docs/CAPABILITIES.md, which the same command rewrites. Cards fencing the file whole: 70 not done, 45 planned. The bootstrap docs/conventions/README.md landed at be4776ee; the fence and reader inventory at 94402337; this refresh consolidates the criteria and completes the fence. The order after the lanes live today is T-290, then T-320 re-checked against this lane's resulting structure, then the T-312 rerun.

## Ruling of 2026-09-14 — the budget addendum's shape approved (the owner, on the seat's proposal as amended by the Codex orchestrator's review)

Before this card's dispatch the owner approved the shape of the ADR-019 addendum this lane's landing will need, and the refreshed criteria of the same day are amended in place by this line (the pre-amendment wording is in the tree at 35a79138): one formula for every size — `warn = ceil(landed + max(F, landed × 0.25))`, `fail = ceil(max(landed × 1.5, warn + F))` — so no small-file exception is left to the executor; F re-derived at the landing commit by addendum 5's rule and recorded beside the standing value, the choice explicit; and the whole result measured — the index and every topic file summed against the pre-split file, the material moved to historical records listed, per-file headroom not presented as comparable to the old single-file headroom. The addendum's verbatim text is shown to the owner with the figures from the landed tree and appended by the seat on that showing.

## Refresh of 2026-09-14, before dispatch (the architect seat's step-2 triage on the owner's ruling of 2026-09-14)

The blocker is cleared: T-287 is done, and the dead fence entry it left — docs/conventions/, a directory with nothing tracked under it — is answered by the bootstrap records action of 2026-09-14 (docs/conventions/README.md, the neutral note that reserves the directory and readies nothing else). The fence gains the three scripts the docs gate derives as readers of docs/CONVENTIONS.md beside the specs it already reserved: tools/e2e/scripts/cli.mjs, tools/e2e/scripts/merge.mjs and tools/e2e/scripts/range-rule.mjs, so a reader re-pointed by the split is edited inside the fence. The reader inventory as measured today, for the census the lane takes as its own opening act: the docs gate derives fourteen readers (app/src-tauri/src/agent/kit.rs; tools/e2e/scripts/cli.mjs and merge.mjs; the specs brief, cli, dispatch-order, docs-input-gate, gate-run, lane-fence, merge, push-guard, range-rule, run-record and workflow-parity), five hooks under .claude/hooks/ name the file (expand-fence, lane-fence, pre-push-guard, push-guard, landing-gate), and the kit carries the genesis template copy under method/docs-templates/, which is not this file. The size is L and the work is substantial — readers, budgets and tests, not a text trim; dispatched after T-322 in the owner's order, and only where the measured CONVENTIONS headroom permits that order.

## Amendment of 2026-09-14, during the lane (the architect seat, on the executor's ask)

INDEXED_DOCS in tools/e2e/scripts/docs-scan.mjs is a ruled constant: ruledIndexedDocs reads the four document names out of ADR-024 decision 2's own sentence and docs-input-gate.spec.ts asserts the constant equals that set, so a topic file added to INDEXED_DOCS reds the keeper of a ruling, and amending the ADR is the owner's voice and outside this fence. Criterion 4's clause "INDEXED_DOCS SHALL carry each topic file so docs/INDEX.md gains one generated line per topic file, regenerated in the same commit" is read from this line by its outcome: docs/INDEX.md gains one generated line per topic file, nested under the Conventions entry, through a second named constant beside INDEXED_DOCS whose members are derived from docs/CONVENTIONS.md's own pointer section, regenerated by `npm run capabilities` in the same commit as the split, pinned both ways (a topic file with no pointer line reds, a pointer line with no file reds); INDEXED_DOCS itself stays the ruled four. The letter was the seat's phrasing before the constant's ruling was in view; the ADR is not amended by this lane, and whether INDEXED_DOCS should one day carry the topic files is a records question for the owner after the merge.

## Implementation notes
<!-- executor appends before finishing -->

### The re-landing, measured (criteria 2, 3 and 5)

Three commits, so the machinery was green before a sentence was cut and
the repair that followed is legible on its own. Sizes at this lane's tip
against the single file at the base `37d89ff739d0`:

```
the document at the base                       176155 bytes, 66 bullets
docs/CONVENTIONS.md, now the index               13544
  docs/conventions/app-and-ui.md                  6331
  docs/conventions/architecture.md               14613
  docs/conventions/commands.md                   18566
  docs/conventions/dispatch-and-scratch.md        8080
  docs/conventions/gates-and-the-push.md         10971
  docs/conventions/lanes.md                      21524
  docs/conventions/merging.md                    23347
  docs/conventions/records-and-rooms.md          22030
  docs/conventions/shell-and-scripts.md           5943
  docs/conventions/standing-gates.md             14850
  docs/conventions/verification.md               11154
the index and every chapter, summed              170953
```

The sum is stated because the criteria ask for it and it is NOT the
interesting figure: it counts eleven chapter headings and eleven leads
that did not exist at the base, and a pointer sentence in every bullet
whose forensics moved. What LEFT the conventions is `25057` bytes of
bullet text, moved verbatim; the docs/reference chapters grew by `32342`
bytes, the difference being each chapter's own T-290 heading and lead and
the new chapter 16's introduction.

**Where the forensics went** — verbatim, each entry named for the bullet
it came out of:

```
docs/reference/05-dispatch.md         9039 ->  12153   +3114
docs/reference/07-verification.md     8710 ->  13684   +4974
docs/reference/08-landing.md          9236 ->  12824   +3588
docs/reference/09-records.md          7668 ->   9306   +1638
docs/reference/10-gates.md            8156 ->  12031   +3875
docs/reference/11-health.md           5942 ->   6557    +615
docs/reference/13-surfaces.md         5002 ->   5859    +857
docs/reference/14-versions.md         5864 ->  14664   +8800
docs/reference/16-the-repository.md      0 ->   4676   +4676   NEW
docs/reference/README.md              5095 ->   5300    +205   its table
```

`docs/reference/16-the-repository.md` is new because the other fifteen
chapters each own a STAGE of the loop and the tree's own build, command
and shell forensics belong to none of them. It also takes the settings
material, whose closer home would have been chapter 15 — and chapter 15
is GENERATED from the schema, so nothing may be appended to it by hand.

**Per-file headroom, per file.** It is NOT the old single-file figure
made better and no comparison is drawn: that was one document's runway,
these are twelve, landed fresh and each at the top of its own band by
construction.

```
docs-headroom/docs/CONVENTIONS.md      was -19.9% BREACHED, now 20.0% inside
every chapter                          20.0% or above, inside
```

### The proof that every program-read sentence is byte-identical

Three checks, each RUN against the written tree rather than claimed:

- **Every literal a reader pins is still in the corpus.** Derived, not
  typed: every string literal in every tracked source that names the
  document, comments stripped by the docs gate's own stripper and bare
  file paths excluded, kept where the base carries it verbatim. `164`
  literals; `0` missing at this tip.
- **Every sentence of every bullet is still somewhere.** `878` sentences
  of the 66 bullets at the base, each found in the corpus or in the
  docs/reference chapter its forensics moved to. `0` lost. The tool
  refuses a bullet whose kept and moved runs do not tile it, so the
  compaction is a partition of the base text and not a rewrite.
- **Every PARSER this repository points at the document answers.** That
  is the check the first two could not be: `parseRangeRule` demands
  twelve measurements out of one bullet with ANCHORED REGULAR
  EXPRESSIONS, and no string-literal census can see one. Every candidate
  move was tried against every parser and kept only where all of them
  still answered.

Three defects in that proof were found by running it, and each is
recorded because a proof that was wrong once is a proof whose shape
matters: a sentence quoted in a HEADER COMMENT counted as a pin until
the stripper was applied; the coverage check read `git ls-files
docs/reference`, which cannot see a chapter this lane had created and not
yet staged, and reported a dozen moved sentences as lost; and the regex
readers were invisible until the blessed gate-runner reported a
SCOPED-RED over a piped run that had said "1031 passed, exit 0" — the
exit of `tail`, not of playwright, which is this project's own rule about
a gate read through a pipe, met in its own lane.

### Where a rule could not be separated from its argument (criterion 6)

The honest finding of this lane, and it is about the document rather than
the work: **after ADR-019's compaction and T-236's, this document is
predominantly RULE.** Of `174305` bytes of bullet text at the base,
`25057` are history, measurement or argument that could be cut away; the
rest is the rule itself, the keeper it names, an exit-code legend, a
command spelling, or a sentence a program reads by its exact text. The
foundation-files standard's remaining gain here is STRUCTURAL — the
split, the index, the per-file budgets — and not textual.

The bullets whose argument stayed, and why:

- **THE RANGE RULE keeps eight measurements, and a PROBE decided that
  rather than a judgement.** `parseRangeRule` reads them by anchored
  regex: the T-027 path counts, the T-078 counts, the scored range, the
  merges that separate three dots' two scores, the ceiling's
  denominator, the flip totals, the `Not "rarely"` refusal and the
  T-083-s1 correction. They are measurements AND the bullet's contract
  with its own keeper, which is exactly what this criterion is for.
- **THE LANE PROTOCOL, THE PROCESS IS SETTINGS, GUARD-CLASS PATHS, THE
  SHIPPED PARTITION, DECLARING A COMPONENT, THE FOUR WALKS, BOUNDED
  WAITS, THE RUN RECORD, THE VERIFIER'S BENCH, THE SEAT PROPOSES BEFORE
  IT RECORDS, PORT RULE and the four per-package command bullets** — the
  argument in each is a MAP, a LEGEND or a SPELLING rather than a story:
  the guard-class map, the four exit codes, the lane's four backticked
  names, the settings rows' three labels. A reader who lost them would
  lose the rule. Nothing moved out of them.
- **THE PUSH IS JUDGED BY GIT ITSELF SINCE T-314 is pinned clause by
  clause** by tools/e2e/tests/push-guard.spec.ts — a 500-byte length
  floor, `--no-verify`, "never installed", the two named proposals. Its
  argument IS its contract with that body.
- **A GATE READ THROUGH A PIPE, A LINE NUMBER IS A FIGURE, NEVER TYPE A
  PATH YOU CAN DERIVE, FIT A BYTE-BANDED DOCUMENT, PIN THE DEFAULT
  BRANCH, THIS SHELL'S grep IS A SHIM, AND THEN READ IT, DISPATCH FROM
  THE LAST CHECKPOINT, THE MERGE INTO MAIN IS, [?] MARKS AN UNRESOLVED
  CLAIM, LIFTING A SAFETY GUARD, THE CHECKPOINT COMMIT'S SUBJECT** — at
  the standard already, or reduced to it with one sentence moved.

Every one of these keeps its rule as the first thing in it, and the
chapters group them so a reader opens one topic rather than the whole
document.

### The fence census, re-read at this tip (criterion 5)

```
cards fencing docs/CONVENTIONS.md whole      134
  of them not done                            72
  of those planned                            45
  also fencing docs/conventions/               1
```

CORRECTED BY THE VERIFIER, 2026-09-14: the lane derived these over every
card file under docs/tasks/ at any depth, which counts the two `rejected`
cards under docs/tasks/rejected/ that name the path — and no reader of
this repository counts those. The derivation that matches every reader is
`liveTaskCards`, the FLAT non-recursive walk the parser and the docs gate
both take; over it the figures are 134 at any status, 72 not done, 45
planned. The planned half was right either way, because both extras are
`status: rejected`.

The refresh measured 70 not done at `767a68ff`; two more were filed
before this lane cut. **Every one of the 71 that does not also fence
docs/conventions/ now fences an INDEX**: its criteria are about a rule,
and the rule is in a chapter its fence cannot reach, so the first thing
each lane will meet is a write hook refusing the only file that matters.
The subject-to-chapter mapping is derivable from the index — it publishes
every opener beside its chapter — and the keeper that would make the
preflight say so is filed as T-290-s5. The cards themselves are the
seat's records action after the merge; this lane edits no card but its
own.

### The ADR-019 addendum — PROPOSED, never written by the lane

Criterion 5 asks for it to be proposed with the rows' commit, the formula
and the re-derived F. The verbatim text is in the lane's report and in
the scratch file `addendum-T-290.md`; the rows are in
tools/e2e/scripts/docs-scan.mjs at this lane's tip, the formula is the
one the owner approved on 2026-09-14, and `F` = **1733** re-derived here
beside the standing **2053** — the mean of docs/STATE.md's 177 positive
first-parent deltas over 262 changes (median 581, max 12039). STATE is
still the smallest governed document on every reading addendum 5 used,
and the eleven chapters have no history at the commit that creates them,
so they cannot be the derivation's subject at their own landing.

### In-fence follow-through

- The five fixtures that plant this document now plant the chapters,
  derived through `conventionsFiles` rather than listed: lane-fence,
  lane-lock, card-preflight, checkout-currency, push-guard's seat
  fixture and docs-input-gate's index fixture.
- `conventionsText` refuses BOTH directions by name — a pointer whose
  chapter cannot be opened or has lost its bullet, and a chapter file the
  index names nowhere.
- Every message string that named a bullet's home names the chapter it
  lives in, and the cli spec's filter reads both spellings with its
  non-vacuity floor intact.
- The bump writer names docs/reference/14-versions.md as the release
  note's home; the stamp sentence stays in docs/CONVENTIONS.md,
  byte-identical.

### The census at the base, taken before a byte moved (criterion 1)

Every figure below is `docs/CONVENTIONS.md` as it stands at this lane's
base commit `37d89ff739d04543c97d972add1f119ca403746d`, derived in the
lane worktree with the commands each block names. The card's own
measurement of 134,029 bytes is historical, at `6c7c7e6`; the refresh
figure of 173,024 bytes is at `767a68ff`. The file has grown by every
merge since, and the headroom under the hard line is now the smallest
it has been at any dispatch of this card.

**The document, and what the budget says about it.**

```
wc -c docs/CONVENTIONS.md          176155 bytes     @ 37d89ff739d0
wc -l docs/CONVENTIONS.md            2552 lines     @ 37d89ff739d0
top-level `- ` bullets                 66           @ 37d89ff739d0
  preamble (before "## Build & test")   516 bytes
  "## Build & test"                   44830 bytes   (31 bullets)
  "## Gotchas"                       130809 bytes   (35 bullets)
DOC_BUDGETS row (tools/e2e/scripts/docs-scan.mjs, ADR-019 addendum 6)
  landed 117502  warn 146878  fail 176253
  under the HARD line                    98 bytes
  headroom under the WARN line       -29277 bytes = -19.9% of warn
  health band docs-headroom/docs/CONVENTIONS.md: BREACHED
    (breach line 2% of warn, drift line 10%, healthy above)
```

Ninety-eight bytes under a hard failure is the reading that matters
most here: at this base the docs gate reds on any merge that adds a
hundred bytes to this file, so the compaction is not a tidying job that
could wait another week.

**Readers by path.** `git grep -l 'docs/CONVENTIONS\.md'` names 520
tracked files at the base:

```
368  docs/tasks/           (cards)
 68  tools/                (47 tools/e2e/, 21 tools/method-evals/)
 24  app/
 22  docs/checkpoints/     (records)
  9  method/
  6  docs/rooms/
  5  .claude/hooks/
  4  docs/reference/
  3  lib/parser/
  3  docs/decisions/
  1 each: docs/conventions/README.md, docs/architecture/, docs/INDEX.md,
          docs/CONVENTIONS.md, docs/CAPABILITIES.md, bin/, README.md,
          .github/workflows/ci.yml
```

**Readers the docs gate itself derives** (`docsReaders` in
tools/e2e/scripts/docs-scan.mjs): 36 readers of `docs/` in all, of which
14 carry the prefix `docs/CONVENTIONS.md` and are therefore the set a
change to this file OWES a suite for:

```
app/src-tauri/src/agent/kit.rs                   suite app/src-tauri
tools/e2e/scripts/cli.mjs                        suite tools/e2e
tools/e2e/scripts/merge.mjs                      suite tools/e2e
tools/e2e/tests/brief.spec.ts                    suite tools/e2e
tools/e2e/tests/cli.spec.ts                      suite tools/e2e
tools/e2e/tests/dispatch-order.spec.ts           suite tools/e2e
tools/e2e/tests/docs-input-gate.spec.ts          suite tools/e2e
tools/e2e/tests/gate-run.spec.ts                 suite tools/e2e
tools/e2e/tests/lane-fence.spec.ts               suite tools/e2e
tools/e2e/tests/merge.spec.ts                    suite tools/e2e
tools/e2e/tests/push-guard.spec.ts               suite tools/e2e
tools/e2e/tests/range-rule.spec.ts               suite tools/e2e
tools/e2e/tests/run-record.spec.ts               suite tools/e2e
tools/e2e/tests/workflow-parity.spec.ts          suite tools/e2e
```

**The hooks that name the file by path** (all five under .claude/hooks/,
as the refresh measured):

```
.claude/hooks/expand-fence.mjs      the fresh-worktree sentence
.claude/hooks/lane-fence.mjs        the branch spelling, via laneSpellings
.claude/hooks/pre-push-guard.mjs    cites the file in its refusal text
.claude/hooks/push-guard.mjs        cites the file in its refusal text
.claude/hooks/landing-gate.mjs      the integration branch, via laneSpellings
```

**The scripts that name the file in code or in a message string a
reader follows** — the reason the fence names tools/e2e/scripts/ whole:

```
tools/e2e/scripts/brief.mjs                the scratch rule and the serial ritual
tools/e2e/scripts/cli.mjs                  CONVENTIONS_PATH; every command's `source:`
tools/e2e/scripts/docs-gate.mjs            the one spelling, in its own message
tools/e2e/scripts/docs-scan.mjs            conventionsText, conventionsBullet, DOC_BUDGETS
tools/e2e/scripts/dispatch-brief.mjs       laneSpellings, bulletByOpening, boldedOpeners
tools/e2e/scripts/dispatch-order.mjs       lanesFrom, through laneSpellings
tools/e2e/scripts/gate-run.mjs             the blessed runner and the range rule
tools/e2e/scripts/health-bands.config.mjs  the AUDIT GATE and HEALTH BANDS shapes
tools/e2e/scripts/lane-fence.mjs           laneSpellings and the fresh-worktree sentence
tools/e2e/scripts/merge.mjs                CONVENTIONS_PATH, setupSteps, METHOD_STAMP_FILES
tools/e2e/scripts/range-rule.mjs           the gate triggers, via conventionsBullet
tools/e2e/scripts/rename-scan.mjs          lists the path
tools/e2e/scripts/token-scan.mjs           cites the file in its message text
```

**The bullets a pack reader cites by opener.** `conventionHeadings` in
tools/e2e/scripts/dispatch-brief.mjs derives 49 openers off the document
(the standing gates, the named disciplines and every bolded opener);
`citedConventionBullets` against the 41 tracked `.mjs` gate sources finds
19 of them cited today, which is the set the context pack transcribes or
cites at a dispatch:

```
AUDIT GATE · THE BLESSED GATE-RUNNER · AND SINCE T · AND THEN READ IT ·
NEVER TYPE A PATH YOU CAN DERIVE · SCRATCH RULE · PORT RULE ·
THE PROCESS IS SETTINGS, AND EVERY SWITCH IS DECLARED ONCE ·
GUARD-CLASS PATHS, IN THIS PROJECT'S OWN SPELLING ·
A CITATION NAMES A SYMBOL, NOT A LINE · THE FOUR WALKS · THE RANGE RULE ·
GRAPH REGEN · THE LANE PROTOCOL · DISPATCH FROM THE LAST CHECKPOINT ·
BOOT GATE · DOCS GATE · METHOD EVAL GATE · POISON DRILL
```

The app's own dispatch brief (app/src-tauri/src/dispatch/brief.rs) reads
this document for rows 4 and 6 to 10 — more than the refresh recorded,
and the correction is stated here rather than left to be discovered: not
only the lane-spelling and dispatch-from bullets, but the build ORDER
bullet, the fresh-worktree ordering, the four package command bullets,
the standing gate bullets, the named discipline bullets and the PORT
RULE bullet. Its test in app/src-tauri/src/lib.rs plants the file as a
brief source.

**The program-read sentences.** These are the passages a program looks
for by exact text; each one is byte-identical across this lane's
landing, and the proof is a diff of the extracted passage against the
base rather than a claim:

```
conventionsBullet phrases (tools/e2e/scripts/docs-scan.mjs callers)
  "DOCS GATE (T-084"                     docs-input-gate.spec.ts
  "BOOT GATE (T-046"                     range-rule.mjs
  "GRAPH REGEN (T-009-s1"                range-rule.mjs
  "THE LANE PROTOCOL"                    lane-fence.spec.ts, laneSpellings
  "app/src-tauri (C-05 Rust half"        push-guard.spec.ts
  "AND THEN READ IT"                     push-guard.spec.ts
  "THE BLESSED GATE-RUNNER (T-202):"     push-guard.spec.ts
  "THE PUSH IS JUDGED BY GIT ITSELF SINCE T-314"   push-guard.spec.ts
  "run from lib/parser/:"                docs-input-gate.spec.ts
  "run from app/:"                       docs-input-gate.spec.ts
  "run from app/src-tauri/:"             docs-input-gate.spec.ts
  "run from tools/e2e/:"                 docs-input-gate.spec.ts
laneSpellings labels, read inside THE LANE PROTOCOL (dispatch-brief.mjs,
and the same rule in Rust in app/src-tauri/src/dispatch/brief.rs)
  "integration branch `...`"   "branch `...`"
  "worktree `...`"             "Created with `...`"
the method stamp, the one line app/src-tauri/src/agent/kit.rs pins
  "method/ formats are version-bumped (currently v0.1.31) and noted here."
the Build & test commands, read verbatim by
  tools/e2e/tests/workflow-parity.spec.ts against .github/workflows/ci.yml
  tools/e2e/scripts/cli.mjs (every `source:` and every derived command)
  tools/e2e/scripts/merge.mjs setupSteps (the fresh-clone ORDER bullet)
the standing gate TRIGGER sentences, parsed by standingGates
  GRAPH REGEN · BOOT GATE · DOCS GATE · METHOD EVAL GATE
the CI bullet, mirrored step for step by workflow-parity.spec.ts
the fresh-worktree sentence, quoted by .claude/hooks/expand-fence.mjs
  "A FRESH WORKTREE HAS NOTHING INSTALLED AND NOTHING BUILT"
```

**The cards whose fences name the file whole.** 134 cards at the base
by `liveTaskCards`, the FLAT walk every reader of this board takes — of
which 72 are not done and 45 of those are planned. The refresh measured
70 not done at `767a68ff`; two more have been filed since. (This line
read 136 / 74 until the verifier's correction of 2026-09-14: the lane's
own derivation walked docs/tasks/ recursively and counted two `rejected`
cards no reader sees.)
The per-card mapping of subject to topic file is recorded at the end of
the lane, as criterion 5 asks.


## Verdicts

### 2026-09-14 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

Guarded tier, two-spawn bench. Graded at base `37d89ff739d04543c97d972add1f119ca403746d`,
tip `9cfca369c3e2c2cf4c0786d01b3a7173773b7dc0`, on the verifier bench worktree detached at
that tip. The diff was read before the executor's notes and before its report, and the
attack set was written by a spawn with no tools against the card at its base.

attack set: sha256:27f07b7bbdc145d56f05c4f625420b2273f283483a5f204fb51fb0747084f1f0 (attack-set-T-290.md)

The other two sealed inputs, cited under the same rule:

- ground, taken at the base by the seat's instrument —
  sha256:e935742e81c85be68ea1c2a3ea8c42b13ffc2f586f1457f3f87b33d4ee9e3839 (ground-T-290.md)
- the card at the base —
  sha256:642cf6dea19307f1995b38ffb3f3823b2f7858035dc7f139ff9066ca0cbf57c1

All three verified against the saved files at the start of phase 2.

**The frame I actually had.** Two spawns, as the guarded tier constructs it. Phase 1 returned
an attack set and sixteen measurement requests; the seat answered all sixteen at the base
before the diff existed. My brief named no executor-derived specific — no mutant count, no
suite figure, no path count — so phase 1 was not broken above the line. I read the diff, then
the specs, then the notes on the card, then the report, in that order.

#### The verdict in one paragraph

This is the strongest re-landing I have graded on this project, and its central claims are
true under measurement rather than under assertion: the 66 bullets moved BYTE-IDENTICAL at the
split commit (zero diff), every derived parser answers identically at base and tip, not one
sentence of the base document was paraphrased or lost, every budget row is exact to the
integer, and `F` re-derives to 1,733 under addendum 5's own rule. The four legs and the docs
gate are green at the tip. What it missed is a CLASS rather than a case: three readers of
docs/CONVENTIONS.md that live outside the lane's fence and outside all four legs — and two of
them were RED at the tip while every leg was green. That is why this is approved with
corrections and not approved outright: a leg that cannot see a reader cannot report it, and
the census that was supposed to see them collapsed two directories into one label.

#### A row per acceptance criterion

| # | criterion | verdict | what decided it |
|---|---|---|---|
| 1 | census taken first, committed with its ref, before a byte moves | **MET, with a correction** | `dfa43a26` changes the card and nothing else; `docs/CONVENTIONS.md` at that commit is blob `bddec6c9` — the base's own blob — and `docs/conventions/` holds only `README.md`. So it was taken first, mechanically, not reconstructed. I re-derived every class against the sealed ground: the 14 docs-gate readers, the 5 hooks, the 49 openers, the 19 cited, the byte and section counts and the band reading all agree exactly. Two figures do not — see corrections 1 and 5. |
| 2 | bullet cut to rule + keeper + card; history moved VERBATIM | **MET** | Of 670 distinct sentences in the base's 66 bullets, 573 are byte-verbatim in the chapters and 85 byte-verbatim in `docs/reference`; the 12 that match neither whole are CUT SEAMS, and for every one of them I found the prefix verbatim at one destination and the suffix verbatim at the other, with no unaccounted middle. Zero paraphrase, zero deletion. All 25 release-note lines are verbatim in `docs/reference/14-versions.md` and none is left duplicated in the index. All 33 `docs/reference/...` pointers resolve to files that exist. |
| 3 | split under `docs/conventions/`, index carries every opener verbatim, program-read sentences byte-identical, stamp stays | **MET** | At the split commit `a1aaad16` the spliced document's 66 bullets are BYTE-IDENTICAL to the base's 66 — `diff` over the raw extraction is empty. At the tip, T-236's own proof shape (run the readers, diff the OUTPUT) is zero-diff for `parseRangeRule`, `bootGateTrigger`, `graphRegenTrigger`, `parseDocsGateRecipe`, `laneSpellings`, `packageCommands`, `standingGates` and `conventionHeadings` (49 openers, same order, same content). `bulletByOpening` throws for exactly the same 4 openers at base and tip — the pre-existing 70-character truncation the ground recorded, filed as T-290-s4; none newly throws. The stamp line is byte-identical, on exactly one line of `docs/CONVENTIONS.md`, which is what the kit's line-scoped uniqueness pin needs. |
| 4 | readers re-pointed in the same commit; budgets; INDEXED_DOCS; both pack readers pinned; message strings | **MET** | I recomputed all 12 budget rows from the tip's own `wc -c`: every `landed` equals the file, every `warn` equals `ceil(landed + max(1733, landed × 0.25))` and every `fail` equals `ceil(max(landed × 1.5, warn + 1733))` — 12 of 12 exact, no row off by one. The two files under 4F land with `fail` exactly F above `warn`, as the ruling predicted. STATE, ROADMAP and ARCHITECTURE keep their lines unchanged. `F` = 1733: I re-derived it independently over first-parent deltas of `docs/STATE.md` and got 177 positive of 261 usable changes, mean 1732.65, median 581, max 12039 — the card's figures exactly. F FELL from 2053, so the new rows are tighter, not more generous. `INDEXED_DOCS` is still the ruled four; the chapter lines come from a second derived constant, as the seat's amendment ruled, and `capabilities:check` answers CURRENT for both generated files — so the index was regenerated, not hand-edited. Both pack readers carry real bodies with their own negative halves, and both drill DATA mutants with the positive control run FIRST. |
| 5 | closing fence census; four legs and docs gate green; band inside; whole result measured; addendum proposed | **MET, with corrections** | Whole battery at the sent tip: parser 454, app 1171, rust 657 over 18 targets, e2e 1164, `gate-run` exit 0. `lint:docs` exit 0, 15 gated budgets hold, 0 frontmatter issues. `docs-headroom/docs/CONVENTIONS.md` reads **20.00% inside** (13,544 against a 16,930 warn line) where the base read −19.93% BREACHED; every chapter reads 20.00% or above. STATE and ROADMAP stay breached and were breached at the base — not this lane's, and filed as T-290-s2. The whole-result sum is stated as an arithmetic identity against the base and I checked its arithmetic: the chapters sum to 157,409, plus the 13,544 index gives the 170,953 the card states, and the 32,342 bytes of `docs/reference` growth is the sum of its own table. `ADR-019` is byte-unchanged in the lane's range — blob `2d5cae13` at base and tip — so the addendum really was proposed and not written. The fence census's counts are corrected below. |
| 6 | a rule inseparable from its argument is named, and moves whole | **MET, and answered well** | Not the empty set I pre-committed to attacking. The card names the bullets whose argument stayed and why, in three groups, and THE RANGE RULE's eight retained measurements were decided by a PROBE — `parseRangeRule` reads them by anchored regex — rather than by judgement. I confirmed that: `parseRangeRule`'s output is byte-identical base to tip, which it could not be had those measurements been cut. |

#### What I could not fault, said plainly, because a verdict that only lists defects misreports the work

- **The splice is the right design and it is checked in both directions.** `conventionsText` refuses a pointer whose chapter cannot be opened, a pointer whose chapter no longer carries its bullet, a chapter file no pointer names, and leftover bullets the index does not point at. Four refusals, all of them ADDITIONS. I diffed `tools/e2e/scripts/docs-scan.mjs` hunk by hunk: four hunks, and not one relaxes a check. The gate was not widened to pass its own lane.
- **The bodies can fail, and were shown failing.** Both new Rust bodies and all four new JS bodies plant DATA mutants and run the unmutated positive control FIRST. One of them guards its own vacuity in as many words: *"the index publishes no pointer, so this body would prove nothing"*.
- **The fixtures are derived, never listed.** `conventionsFiles()` in JS and the whole-directory copy in `app/src-tauri/src/lib.rs` — a chapter added later cannot leave either fixture silently short. That is the shape the same problem takes in the three files I had to correct, and the lane got it right everywhere inside its fence.
- **Idempotence and cwd-independence.** `capabilities.mjs --check` answers CURRENT from `tools/e2e`, from the repository root and from `/`; the working tree is clean after every run.
- **The security sweep found no injection point.** No shell interpolation of document content anywhere in the new code; no new dependency; no secret; no endpoint. The JS pointer matcher is doubly hardened (an `[a-z0-9-]+` charset that cannot spell `..`, and `path.basename` at the read). The one absolute home path in `docs/conventions/lanes.md` was in the base document at its line 1963 and moved verbatim, which is what criterion 2 demands. `lint:tokens` and `rename-scan.mjs` both exit 0.

#### The findings

**FINDING 1 — the METHOD EVAL GATE is RED at the tip, and it FIRES at this merge.**
`node tools/method-evals/run.mjs` exits **0 with 12 of 12 green** at the base (measured in a
clean clone checked out at `37d89ff7`, because an export without `.git` cannot run MF-06 or
MF-11 and would have been an unfair comparison). At tip `9cfca369` it exits **1** with two
failures:

- **MF-01** — `tools/method-evals/lib/fixture-root.mjs`'s `LIVE_COPY_SET` copies
  `docs/CONVENTIONS.md` and no chapters, so the materialized fixture root carries a table of
  contents. `conventionsText` then throws this lane's OWN new refusal and the brief assembler
  exits 3. The refusal is working exactly as designed; the fixture is short.
- **MF-09** — `tools/method-evals/evals/mf-09-attack-set-digest-refusal.mjs` declares
  `reads: ["method/**/*.md", "docs/CONVENTIONS.md"]` and looks the attack-set citation grammar
  up in the index alone. That grammar is at `docs/conventions/standing-gates.md:176`, byte for
  byte. The eval reports it as *"a grammar nobody documents"* while it sits in the chapter the
  index points at.

This is not a gate the card's criterion 5 names, which is why criterion 5 still reads MET. It
is a gate that fires on *"a line matching the citation grammar under docs/tasks/"* — the line
this very verdict adds — so the integrator meets it at this merge. Corrected below.

**FINDING 2 — the seat pack's shipped host-command check is RED at the tip.**
`node method/skills/supertaskr-seat/scripts/host-command-check.mjs --repo .` at the base:
`HOST> commands 24 · resolved 24`, `cwd: resolved 14`, `findings: 0`, exit 0. At the tip:
`resolved 7`, `cwd: resolved 3`, `findings: 28`, exit 1. Its `DEFAULT_AUTHORITIES` is
`["docs/CONVENTIONS.md", "docs/STATE.md"]` and it resolves every `HOST>` command against the
authority its row names — so seventeen commands became findings against a repository whose
commands had not moved a byte. `SKILL.md` promises in as many words that the pack invents no
command; at this tip that promise is mechanically false.

**FINDING 3 — the census collapsed two directories into one label, and that is where both
breakages hid.** The census's bucket table reads ` 68  tools/e2e/`. At the base the tree has
47 files under `tools/e2e/` and 21 under `tools/method-evals/`; 68 is the sum of both. The
label is simply wrong about which directory it counted, and `tools/method-evals/` — which
carries MF-01's fixture and MF-09's read — appears nowhere in the census. The `9 method/`
bucket is labelled honestly but was never classified either, and it holds finding 2. Criterion
1 asks for *"every reader of docs/CONVENTIONS.md by path across the tree"*; the grep found
them and the classification did not.

**FINDING 4 — the card's fence census counts cards no reader of this board sees.** The card
reports 136 fencing cards and 74 not done, at the base and again at the tip. Derived the way
every reader of this board derives it — `liveTaskCards`, the FLAT non-recursive walk the
parser and the docs gate both take — the figures are **134 at any status, 72 not done, 45
planned**. The two extras are `docs/tasks/rejected/T-092-s2-…` and
`docs/tasks/rejected/T-132-s2-…`, both `status: rejected`. The planned half was right either
way. It matters because criterion 1's whole purpose is a census somebody else can re-derive,
and this one cannot be re-derived to its own numbers by any reader in the tree.

**FINDING 5 (security sweep, parity) — the two implementations of one rule disagree about
what a pointer is.** The e2e arm matches a pointer with
`/^ {2}- (docs\/conventions\/[a-z0-9-]+\.md) — (.*)$/` and reads the chapter back through
`path.basename`. `conventions_pointer` in `app/src-tauri/src/dispatch/brief.rs` required only
the prefix, a `.md` suffix and no whitespace. So a line spelling
`  - docs/conventions/../../etc/passwd.md — A RULE` is a NON-pointer on the JS side, where it
is copied through as ordinary text, and a traversing read on the Rust side. The reachable
severity is low — the input is a first-party governed document and the effect is a read whose
bytes must then open with the published opener — but it is precisely the drift the splice's
own doc comment says must not happen, and the JS side already shows the intended standard.

**FINDING 6 — three dead bindings, three new compiler warnings.** Swapping
`live.read_text(CONVENTIONS)` for `live_conventions()` left `let live = live_files();` unused
in three bodies of `app/src-tauri/src/dispatch/brief.rs`. `cargo test --lib --no-run` reports
`warning: unused variable: 'live'` three times at the tip and **zero** times at the base.
Non-gating, and removed below.

#### Where I gave a criterion no weight, and said so before I saw the diff

Attack 5.1, pre-committed in the sealed set: *"the health band SHALL read inside"* is decided
by the lane itself, because the lane writes the budget row the band is checked against. I
score it **GREEN BY CONSTRUCTION and give it no weight**. The repository already knows this —
`tools/e2e/scripts/health-bands.config.mjs`'s own `measured.reason` says *"Headroom at a
compaction landing is 20% by construction (warn = landed x 1.25), so a freshly landed document
starts at the top of its own band."* The reading that carries information is the BASE one,
which the sealed ground took before the diff existed: −19.93%, breached, 98 bytes under the
hard line. That is the number this lane was dispatched against, and it is the number that
makes the work necessary.

#### One reading the criteria asked for and the card gives as a rule instead of a list

Criterion 5 asks for the non-done fencing cards *"each with the topic file its subject moved
to"*. The card gives the counts, the observation that every such card now fences an INDEX
whose rules it cannot reach, a derivation (the index publishes every opener beside its
chapter), and a filed keeper (T-290-s5) — but not the enumeration. The criterion's own clause
calls this *"the records action the seat takes after the merge"* and forbids the lane to edit
another card, so I read it as satisfied by the lane and OWED by the seat, and I name the
reading rather than leaving it to be inferred. The seat has 71 cards to annotate after this
merge, not 73.

#### The assigned corrections

Five corrections, four with a body and a mutant block, one a figure correction that carries no
block and says so. Each is committed on this bench after this verdict, one commit per
correction. **Three of them land OUTSIDE this lane's fence** (`tools/method-evals/` and
`method/skills/`), which is unavoidable — the readers they repair are outside it, and that is
finding 3 restated. **The fence on main must be widened to carry
`tools/method-evals/` and `method/skills/supertaskr-seat/scripts/` before this verdict is
merged**, or the landing gate will refuse the merge for bodies outside the fence.

1. **The eval fixture plants the chapters.** `docs/conventions` joins `LIVE_COPY_SET` as a
   DIRECTORY, beside `docs/architecture` — never a list of chapter names, for the reason that
   list's own header already gives. RED against the tip's fixture set, GREEN with it.
2. **The eval corpus is the index AND its chapters.** A new `conventionsPaths()` in
   `tools/method-evals/lib/corpus.mjs` derives the set from the index's own pointer lines;
   MF-09 spends it for both its corpus and its bullet search, and its `reads` names the
   chapters. RED against the index-only corpus, GREEN with the derived one.
3. **An authority may be an index.** `host-command-check.mjs` gains `authorityText`, which
   folds in every chapter the authority points at — derived from its pointer lines, held to a
   charset that cannot spell `..`, and required to sit under the authority's own directory,
   because the pack ships into projects this repository never sees. RED against the raw read,
   GREEN with the fold. The check's own `--selftest` still catches all 7 degradations and
   misses none, so the fix did not soften it.
4. **The two matchers agree.** `conventions_pointer` in the app's brief holds the chapter stem
   to the same `[a-z0-9-]+` the e2e arm's regex holds it to. Finding 6's three dead bindings
   go in the same commit.
5. **The census figures.** 136/74 becomes 134/72 on the card and on T-290-s5, with the
   derivation named and the earlier reading kept as a record of what was measured; the
   ` 68  tools/e2e/` bucket becomes ` 68  tools/` with its two directories spelled. **This
   correction carries NO mutant block, and that is deliberate: it is a figure in prose, there
   is no property in the tree for a body to pin, and a shortfall a verdict has not explained
   reads exactly like a body nobody wrote.**

#### Both readings, for every body I committed

| body | spec | RED against | GREEN against |
|---|---|---|---|
| the model-free eval suite's fixture root plants every file this project's conventions are made of | tools/e2e/tests/docs-input-gate.spec.ts | `LIVE_COPY_SET` without the chapter directory — *"the eval fixture copies nothing that carries docs/conventions/commands.md"* | the corrected set; 3 passed |
| the model-free eval suite reads this project's conventions as the index AND its chapters | tools/e2e/tests/docs-input-gate.spec.ts | `conventionsPaths()` returning the index alone — *"no file the model-free evals read spells the attack-set citation grammar"* | the derived paths; 3 passed |
| the seat pack's host-command check resolves every command it publishes against this project's conventions | tools/e2e/tests/docs-input-gate.spec.ts | the raw authority read — *"the pack publishes a command this project's conventions no longer name"* | `authorityText`; 24 of 24 resolved |
| a_chapter_spelling_the_e2e_arm_refuses_is_not_a_pointer_here_either | app/src-tauri/src/dispatch/brief.rs | the tip's matcher, and again under the block below — *"this matcher accepted \"  - docs/conventions/../../etc/passwd.md — A RULE\""* | the charset-held matcher; 1 passed |

Each of the four mutants was read from `git diff` after planting, not from a mutator's report,
and each was restored from a copy taken before planting.

#### The mutant blocks

```mutant
correction: the eval fixture plants the chapters
file: tools/method-evals/lib/fixture-root.mjs
spec: tools/e2e/tests/docs-input-gate.spec.ts
body: the model-free eval suite's fixture root plants every file this project's conventions are made of
message: the eval fixture copies nothing that carries
--- old
  "docs/architecture",
  "docs/conventions",
--- new
  "docs/architecture",
```

```mutant
correction: the eval corpus is the index and its chapters
file: tools/method-evals/lib/corpus.mjs
spec: tools/e2e/tests/docs-input-gate.spec.ts
body: the model-free eval suite reads this project's conventions as the index AND its chapters
message: no file the model-free evals read spells the attack-set citation grammar
--- old
    if (m !== null && !out.includes(String(m[1]))) out.push(String(m[1]));
--- new
    if (m !== null && out.length > 99) out.push(String(m[1]));
```

```mutant
correction: an authority may be an index
file: method/skills/supertaskr-seat/scripts/host-command-check.mjs
spec: tools/e2e/tests/docs-input-gate.spec.ts
body: the seat pack's host-command check resolves every command it publishes against this project's conventions
message: the pack publishes a command this project's conventions no longer name
--- old
    corpus.set(rel, collapse(authorityText(repo, rel)));
--- new
    corpus.set(rel, collapse(readFileSync(p, "utf8")));
```

```mutant
correction: the two pointer matchers agree
file: app/src-tauri/src/dispatch/brief.rs
spec: app/src-tauri/src/dispatch/brief.rs
body: a_chapter_spelling_the_e2e_arm_refuses_is_not_a_pointer_here_either
message: which the e2e arm's regex refuses
--- old
    if stem.is_empty()
        || !stem
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
    {
        return None;
    }
--- new
    if stem.is_empty() {
        return None;
    }
```

Correction 5 carries no block, as its entry above says in as many words.

#### The graph, reported and not regenerated

`cargo run -p supertaskr-index -- index --check --root ../..` from `app/src-tauri` exits **1,
STALE**, at tip `9cfca369` — Rust moved and `docs/architecture/graph.json` is outside this
lane's fence, so this is stale BY CONSTRUCTION and the merge regenerates it. Budget line at
that ref: `1230259 of 2145959 bytes (57.3%) - 915700 left`. My own corrections move
`app/src-tauri/src/dispatch/brief.rs` again, so the regen is owed at the merge and not before.

#### Step 7 — the gates at MY OWN tip, `a6e1dfacde1fcda15472b1df8d98b58796eee7bd`

Every figure above the corrections was measured at the tip I was sent,
`9cfca369c3e2c2cf4c0786d01b3a7173773b7dc0`. My verdict, five correction commits and the census
regeneration created a new tip, and a figure without its ref is wrong the moment anybody writes
again — so the whole battery was re-run here, not re-quoted.

| gate | at `9cfca369` (the tip I was sent) | at `a6e1dfac` (my own tip) |
|---|---|---|
| `gate-run.mjs parser` | GREEN, 454 bodies, 1 target | GREEN, 454 bodies, 1 target |
| `gate-run.mjs app` | GREEN, 1171 bodies, 1 target | GREEN, 1171 bodies, 1 target |
| `gate-run.mjs rust` | GREEN, 657 bodies, 18 targets | GREEN, **658** bodies, 18 targets |
| `gate-run.mjs e2e` | GREEN, 1164 bodies, 1 target | GREEN, **1167** bodies, 1 target |
| `gate-run` exit | 0 | 0 |
| `lint:docs` (docs gate) | 0 — 36 readers, 0 findings, 15 budgets hold | 0 — 36 readers, 0 findings, 15 budgets hold |
| `capabilities:check` | 0 — CURRENT (110330 bytes), INDEX.md CURRENT | 0 — CURRENT (110629 bytes), INDEX.md CURRENT |
| `index --check` | 1 STALE — by construction, see below | 1 STALE — by construction, see below |
| `lint:tokens` | 0 | 0 |
| `rename-scan.mjs` | 0 | 0 |
| `npx tsc --noEmit` (tools/e2e) | 0 | 0 |
| `health-bands-run.mjs` | 3 — 28 bands, 13 inside, 2 drifting, 4 BREACHED | 3 — 28 bands, 13 inside, 2 drifting, 4 BREACHED |
| **`tools/method-evals/run.mjs`** | **1 — MF-01 and MF-09 FAILED** | **0 — 12 of 12** |
| **`host-command-check.mjs --repo .`** | **1 — 7 of 24 resolved, 28 findings** | **0 — 24 of 24, 0 findings** |
| `host-command-check.mjs --selftest` | 0 — 7 degradations, 7 caught | 0 — 7 degradations, 7 caught |

The two rows in bold are findings 1 and 2, measured at the base as well: `run.mjs` exits **0 with
12 of 12** at `37d89ff7`, and `host-command-check` resolves **24 of 24** there with 0 findings.
Both base readings were taken in a clean clone checked out at the base ref, not in a `git
archive` export — an export has no `.git`, and MF-06 and MF-11 need one, so an export would have
compared two different things.

`docs/CAPABILITIES.md` went 110,330 → 110,629 bytes here because the corrections add four bodies
(three in `tools/e2e/tests/docs-input-gate.spec.ts`, one in
`app/src-tauri/src/dispatch/brief.rs`); the census is CURRENT at my tip, regenerated in its own
commit, and `docs/INDEX.md` is unchanged at 7,736 bytes.

**The graph, still stale and still by construction.** `index --check` from `app/src-tauri` exits
1 at `a6e1dfac` with `files +0 -0 ~2`: `app/src-tauri/src/dispatch/brief.rs` (loc 3634 → 3855,
symbols 85 → 90) and `app/src-tauri/src/lib.rs` (loc 1375 → 1382), plus one import edge gained
for `VecDeque`. `docs/architecture/graph.json` is outside this lane's fence; the regen is the
integrator's at the merge. Budget at my tip: `1230259 of 2145959 bytes (57.3%) - 915700 left`.

#### Two readings I took that nothing asked me for, and both are clean

**The docs gate at every intermediate commit of the lane.** Attack 4.1 in the sealed set says
criterion 4's *"the re-pointing SHALL land in the same commit as the move"* is vacuous in a
single-commit lane. This lane is six commits, so the clause has content — and `npm run
lint:docs` exits 0 at `a1aaad16`, `a50bbd0c` and `7e0ee2c9` in a clean clone at each. No commit
in the range leaves a tree the docs gate refuses.

**Every mutant anchor matches exactly once, both ways.** For each of the four blocks I counted
the `--- old` text in the file as committed and the `--- new` text in the mutated file: 1 and 1,
four times. An anchor matching twice names no site and was applied at the wrong site on this
project once already.

#### What the integrator owes that this verdict cannot do for it

1. **Widen the fence on main before merging**, to carry `tools/method-evals/` and
   `method/skills/supertaskr-seat/scripts/`. Three of the five corrections land there because
   the readers they repair live there, and the landing gate reads the fence from the merge's
   first parent.
2. **Regenerate the graph at the merged tree**, then the dogfood pins — `app/src-tauri` moved
   twice, once in the lane and once in correction 4.
3. **The METHOD EVAL GATE fires at this merge**, because this verdict adds a line matching the
   citation grammar under `docs/tasks/`. It is green at my tip and was red at the one I was
   sent; run it at the merged tree and record its exit, as the gate's own bullet asks.
4. **The seat's records action stands**: 71 non-done cards fence the index alone and will each
   meet a write hook refusing the only file that matters. T-290-s5 is the keeper for it.

The two body counts that moved are the corrections' own: rust 657 → **658** for
`a_chapter_spelling_the_e2e_arm_refuses_is_not_a_pointer_here_either`, and e2e 1164 → **1167**
for the three bodies in `tools/e2e/tests/docs-input-gate.spec.ts`. Every `gate-verdict` line
above carries `ref=a6e1dfacde1fcda15472b1df8d98b58796eee7bd`, which is the tip this postscript
is committed onto — the figures and the tree agree, and neither is quoted from the other run.
