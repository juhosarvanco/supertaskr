---
id: T-290
title: CONVENTIONS re-landed to the foundation-files standard (ADR-023) — every bullet cut to its rule and its keeper, the forensics moved to the reference chapters and the cards, split into topic files under docs/conventions/ with the index carrying each opener verbatim, the readers and budgets re-pointed in the same commit
feature: F-01
milestone: 4
size: L
tier: guarded
priority: 2
status: building
suggested_by: "@human (2026-09-09): \"Rule A–D as proposed\" — decision B of docs/rooms/foundation-files-standard.md"
blocked_by: []
touches: [docs/CONVENTIONS.md, docs/conventions/, docs/reference/, docs/INDEX.md, docs/CAPABILITIES.md, tools/e2e/scripts/, tools/e2e/tests/, .claude/hooks/, app/src-tauri/src/agent/kit.rs, app/src-tauri/src/dispatch/brief.rs, app/src-tauri/src/lib.rs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
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
 68  tools/e2e/
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

**The cards whose fences name the file whole.** 136 cards at the base,
of which 74 are not done and 45 of those are planned. The refresh
measured 70 not done at `767a68ff`; four more have been filed since.
The per-card mapping of subject to topic file is recorded at the end of
the lane, as criterion 5 asks.


## Verdicts
