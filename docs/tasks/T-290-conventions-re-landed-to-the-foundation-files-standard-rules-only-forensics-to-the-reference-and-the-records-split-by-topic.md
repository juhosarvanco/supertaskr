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
touches: [docs/CONVENTIONS.md, docs/conventions/, docs/reference/, tools/e2e/scripts/docs-scan.mjs, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/cli.mjs, tools/e2e/scripts/merge.mjs, tools/e2e/scripts/range-rule.mjs, tools/e2e/tests/, .claude/hooks/, app/src-tauri/src/agent/kit.rs]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

docs/CONVENTIONS.md is 134,029 bytes at 6c7c7e6 against a budget of 117,502 / 146,878 / 176,253 where its siblings sit under 10 KB: two sections (Gotchas 98 KB, Build & test 35 KB), 39 bullets, the largest twelve between 4 and 15 KB. 61 code and spec files name it by path (21 specs); the context pack reads its bullets by opener (bulletByOpening, boldedOpeners); the kit's pin test reads its stamp line. 35 planned cards fence it whole. Overlap is not the cause (one duplicated line in 283 of 70+ characters, none shared verbatim with another live document); content class is. Dispatch AFTER the rename sitting (the rename edits this file's spellings) and after T-287 (the fence token for a file that does not exist yet).

## Acceptance criteria

- WHEN the lane starts THE census SHALL be taken first and committed to the card: every reader of docs/CONVENTIONS.md by path (the docs gate's census, `git grep -l`), every bullet the context pack reads by opener, and the stamp line's readers — before a byte moves.
- WHEN a bullet is re-landed THE result SHALL be its rule as an imperative, the keeper it names, and the card that made it — and nothing else; its history, measurements and argument SHALL move VERBATIM to the docs/reference chapter that owns the topic or to the card that owns the history, with a pointer in place.
- WHEN the file is split THE topic files SHALL live under docs/conventions/, CONVENTIONS.md SHALL remain the index carrying each bullet's opener verbatim and the file it lives in, and every program-read sentence (the Build & test commands, the DOCS GATE and RANGE RULE lines the specs read, the stamp line) SHALL be byte-identical to the base — proved by the census, as T-236's compaction proved it.
- WHEN a reader is re-pointed THE re-pointing SHALL land in the same commit as the move, the docs gate's DOC_BUDGETS SHALL carry a budget per topic file of the same order as the other governing documents, and the pack's reader SHALL find a bullet across the topic files.
- WHEN the lane is done THE fence census SHALL be re-read: the planned cards fencing docs/CONVENTIONS.md whole before and after, and the four legs green at the tip; the health band docs-headroom/docs/CONVENTIONS.md SHALL read inside.
- IF a bullet's rule cannot be separated from its argument THEN the card SHALL say which and why, and the bullet SHALL move whole to the reference chapter with its rule restated in one line in the index — never left in place.

## Refresh of 2026-09-14, before dispatch (the architect seat's step-2 triage on the owner's ruling of 2026-09-14)

The blocker is cleared: T-287 is done, and the dead fence entry it left — docs/conventions/, a directory with nothing tracked under it — is answered by the bootstrap records action of 2026-09-14 (docs/conventions/README.md, the neutral note that reserves the directory and readies nothing else). The fence gains the three scripts the docs gate derives as readers of docs/CONVENTIONS.md beside the specs it already reserved: tools/e2e/scripts/cli.mjs, tools/e2e/scripts/merge.mjs and tools/e2e/scripts/range-rule.mjs, so a reader re-pointed by the split is edited inside the fence. The reader inventory as measured today, for the census the lane takes as its own opening act: the docs gate derives fourteen readers (app/src-tauri/src/agent/kit.rs; tools/e2e/scripts/cli.mjs and merge.mjs; the specs brief, cli, dispatch-order, docs-input-gate, gate-run, lane-fence, merge, push-guard, range-rule, run-record and workflow-parity), five hooks under .claude/hooks/ name the file (expand-fence, lane-fence, pre-push-guard, push-guard, landing-gate), and the kit carries the genesis template copy under method/docs-templates/, which is not this file. The size is L and the work is substantial — readers, budgets and tests, not a text trim; dispatched after T-322 in the owner's order, and only where the measured CONVENTIONS headroom permits that order.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
