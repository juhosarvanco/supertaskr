---
id: T-324
title: "The admission lifecycle: every admission the arm makes — the lane cut, a child start, a re-entry, a replacement writer — is bound to the grant's revision, the card's approved blob and the attempt's reservation; the three approval modes and the two recovery values are enforced at those boundaries; a pause stops new work at the next safe boundary with its scope stated; a successor coordinator inherits the grant from the block"
feature: F-04
milestone: 4
size: M
priority: 2
status: planned
suggested_by: "the architect seat on 2026-09-14, splitting T-319 under the orchestrator's sizing rule after the Codex orchestrator's pre-dispatch review named the owning files"
blocked_by: [T-319]
touches: [method/roles/orchestrator.md, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/run-record.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/run-record.spec.ts, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

T-319's effective contract, once its owning files were named, carried two test cycles: the grant block and its reader belong to the parser library and its vitest suite; the admission at attempt boundaries, the modes, the recovery policy's enforcement and the pause belong to the dispatch arm, the run record and the orchestrator role file, graded by the end-to-end suite. The orchestrator role file's step 2 says a card is the smallest unit that carries its own test cycle and anything larger is split before dispatch; this card is the arm's half. Today the arm's `--dispatch-lane` cuts a lane without consulting any grant, `startRun` reserves a resource before a harness launch, `continueRun` reconciles a previous execution, and none of the three reads an approval, so a lane can be cut, a pause recorded, and a start or re-entry still follow; a pause exists only in chat and the seat's ledger; and a successor coordinator has nothing to inherit but a checkpoint's prose. The grant this card reads is T-319's block through the parser's reader; this card adds no reader and no second ownership ledger.

## Acceptance criteria

- WHEN the arm admits work — at the lane cut (`--dispatch-lane`), at a child start (the run record's startRun), at a re-entry or continuation (continueRun) and at a replacement writer — THE admission SHALL be bound to the grant's current revision, the card's approved blob (a mechanical append is allowed: a status stamp, a notes or verdicts append, a filed follow-up line) and the attempt id of T-311's reservation; the grant is re-read at every boundary; a retry of an interrupted admission SHALL neither consume the approval twice nor create a second writer; no second ownership ledger is added; pinned by bodies: a pause recorded after the cut and before the start refuses the start; a consumed approval presented again is refused as consumed; an uncertain old writer holds the admission until reconciled; a lane cut is distinguished from the writer reservation.
- WHEN approval is each THE arm SHALL admit only a card the grant names at its current revision and SHALL refuse every other dispatch by name; WHEN approval is until THE arm SHALL admit the cards in the recorded order up to and including the until card, plus the repair chain that card's delivery needs (its CI read, and the repairs the recovery policy admits), SHALL refuse the next card in the order by name, and SHALL NOT cross a parked until card; WHEN approval is standing THE arm SHALL admit until a pause is recorded; pinned by a body per mode paired with each recovery value.
- WHEN recovery is none THE arm SHALL refuse an automatic repair, correction round or re-entry by name and record it as needing its own grant revision — an explicitly granted repair is admitted; WHEN recovery is repairs THE arm SHALL admit a repair only for a failure attributed to the approved work, classified and verified as any card, never a product-scope change or a waived verification; pinned by bodies: an out-of-scope proposed repair refused, an attributed repair admitted.
- WHEN a pause is recorded THE arm SHALL refuse new cuts, starts, re-entries and repair admissions; an active phase reaches its declared safe boundary (a running executor to its stamp, a running verifier to its verdict, a staged merge finished or aborted as the record says); with scope new-work the remaining verification and integration of an existing candidate may finish, with scope all they stop at the next boundary too; an immediate stop the owner requests is honoured at the next tool boundary with the state preserved; an owner-issued pause needs no second approval to be read; pinned by bodies for both scopes and the immediate stop.
- WHEN a successor coordinator takes the seat (T-238) THE successor SHALL inherit the current grant from the block and continue the order without the previous coordinator's identity, pinned by a body over a fixture runtime directory.
- WHEN the arm reports THE report SHALL separate the refusals it tested from the coordinator's obligations it cannot check (scope interpretation, an unreported integrity problem, a provider's live usage) and from advisory accounting; the orchestrator role file's step 5 SHALL say a dispatch inside the current grant is approved by the grant and every other dispatch still waits for the owner, the existing sentences kept and extended; the conventions carry the rule once at the loop's section.

## Implementation notes

## Verdicts

Promoted 2026-09-14 (the architect seat's step-2 split of T-319 under the owner's yes of 2026-09-14 to the order T-319, T-322 before the T-312 rerun): to planned at priority 2, in T-319's slot after it; T-322 is blocked by this card.
