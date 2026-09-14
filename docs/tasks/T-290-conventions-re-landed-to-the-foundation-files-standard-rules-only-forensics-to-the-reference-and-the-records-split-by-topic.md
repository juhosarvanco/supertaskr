---
id: T-290
title: CONVENTIONS re-landed to the foundation-files standard (ADR-023) — every bullet cut to its rule and its keeper, the forensics moved to the reference chapters and the cards, split into topic files under docs/conventions/ with the index carrying each opener verbatim, the readers and budgets re-pointed in the same commit
feature: F-01
milestone: 4
size: L
priority: 2
status: planned
suggested_by: "@human (2026-09-09): \"Rule A–D as proposed\" — decision B of docs/rooms/foundation-files-standard.md"
blocked_by: []
touches: [docs/CONVENTIONS.md, docs/conventions/, docs/reference/, docs/INDEX.md, docs/CAPABILITIES.md, tools/e2e/scripts/, tools/e2e/tests/, .claude/hooks/, app/src-tauri/src/agent/kit.rs, app/src-tauri/src/dispatch/brief.rs, app/src-tauri/src/lib.rs]
builder:
verifier:
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
- WHEN a reader is re-pointed THE re-pointing SHALL land in the same commit as the move; DOC_BUDGETS in tools/e2e/scripts/docs-scan.mjs SHALL carry a row per topic file of the same order as the other governing documents (landed as `wc -c` at the landing commit, warn and fail by the rounding every landing has used) and a re-landed row for docs/CONVENTIONS.md itself at its size as the index; INDEXED_DOCS SHALL carry each topic file so docs/INDEX.md gains one generated line per topic file, regenerated in the same commit; both pack readers — the e2e arm's and the app's — SHALL find a bullet across the topic files, pinned by bodies in both suites; and the message strings that name a bullet's home SHALL name the file it now lives in.
- WHEN the lane is done THE fence census SHALL be re-read and recorded on the card: the non-done cards whose fences name docs/CONVENTIONS.md whole (70 at 767a68ff, 45 of them planned), each with the topic file its subject moved to, as the records action the seat takes after the merge — the lane edits no card but its own; the four legs and the docs gate SHALL be green at the tip; the health band docs-headroom/docs/CONVENTIONS.md SHALL read inside, and the ADR-019 addendum that re-lands the budgets SHALL be proposed by the seat to the owner with the row's commit and rounding, never written by the lane.
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

## Refresh of 2026-09-14, before dispatch (the architect seat's step-2 triage on the owner's ruling of 2026-09-14)

The blocker is cleared: T-287 is done, and the dead fence entry it left — docs/conventions/, a directory with nothing tracked under it — is answered by the bootstrap records action of 2026-09-14 (docs/conventions/README.md, the neutral note that reserves the directory and readies nothing else). The fence gains the three scripts the docs gate derives as readers of docs/CONVENTIONS.md beside the specs it already reserved: tools/e2e/scripts/cli.mjs, tools/e2e/scripts/merge.mjs and tools/e2e/scripts/range-rule.mjs, so a reader re-pointed by the split is edited inside the fence. The reader inventory as measured today, for the census the lane takes as its own opening act: the docs gate derives fourteen readers (app/src-tauri/src/agent/kit.rs; tools/e2e/scripts/cli.mjs and merge.mjs; the specs brief, cli, dispatch-order, docs-input-gate, gate-run, lane-fence, merge, push-guard, range-rule, run-record and workflow-parity), five hooks under .claude/hooks/ name the file (expand-fence, lane-fence, pre-push-guard, push-guard, landing-gate), and the kit carries the genesis template copy under method/docs-templates/, which is not this file. The size is L and the work is substantial — readers, budgets and tests, not a text trim; dispatched after T-322 in the owner's order, and only where the measured CONVENTIONS headroom permits that order.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
