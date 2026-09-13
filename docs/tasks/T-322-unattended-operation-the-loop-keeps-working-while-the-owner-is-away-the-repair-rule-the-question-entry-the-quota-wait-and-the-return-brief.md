---
id: T-322
title: "Unattended operation: the loop keeps working while the owner is away — a rejected lane or a CI red becomes a repair dispatched inside the approval mode's scope, a decision the coordinator may not make becomes a question entry in its room while every unrelated card continues, a quota refusal becomes a wait and a retry, and the owner returns to one return brief naming what merged, what was parked and why, and what awaits a ruling"
feature: F-04
milestone: 4
size: M
priority: 2
status: suggested
suggested_by: "the architect seat on 2026-09-13, from the owner's question the same evening about leaving the computer for hours; filing authorizes no development"
blocked_by: []
touches: [method/roles/orchestrator.md, method/rooms/ROOM-FORMAT.md, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

On 2026-09-13 the owner asked what happens when they leave the computer for five hours and a lane fails or a CI run reds: the fix must not wait for them. Under the loop as it stands, the standing authorization of 2026-09-12 told the seat to STOP at a rejected verdict, a spawn refused for quota, a record that must be shown before appending, and the in-card decisions; the seat filed the fix for the CI red at 8d26c8c5 (T-314-s6) and then waited for a word before promoting it. Everything that keeps the loop going in the owner's absence is today the seat's judgement and its ledger: which failure produces which repair, which decision may wait, what to do when a spawn is refused, and what to tell the owner on return. Four pieces of the architecture carry that instead. The approval mode and its scope (T-319, as amended the same evening) say which dispatches need no yes — the listed cards, or the listed cards and the repairs the work produces. The repair rule says what a failure produces: a REJECTED verdict is re-entered with the verdict as the executor's input, and a CI red on a body the merge added is attributed by name from the runner's log and filed as a repair card at priority 1 in the order's next slot. The question entry says where a reserved decision goes while the owner is away: the seat's QUESTION in the relevant room, marked as the seat's and never as a ruling — the ruling entry still waits for the owner's yes (T-307) — with every card that does not depend on it continuing and the dependent ones NOT STARTABLE with the question named. The return brief is the one page the owner reads on return: what merged with its CI conclusion by name, what was parked and why, the question entries awaiting a ruling, the lanes live, the repairs dispatched under the scope, each with its ref. Two operational facts belong in the conventions rather than in a body: the host must stay awake for the seat to run (the loop runs on the owner's machine), and a seat whose session dies is resumed by a replacement seat from the run record and the ledger (ADR-025). The wait verb exists (T-298); what is missing is the rule that a quota refusal is waited out and retried rather than stopped on, now that the owner has removed the budget limitation.

## Acceptance criteria

- WHEN a lane's verdict is REJECTED, or a CI run on main reds on a body the merge added, THE coordinator SHALL, inside the approval mode's scope, produce the repair without a further approval — the rejected lane re-entered with the verdict as the executor's input, or a repair card filed at priority 1 naming the run, the body and the merge, promoted and dispatched in the order's next slot — and outside the scope SHALL queue it as a question entry; pinned by bodies over a fixture verdict and a fixture run log.
- WHEN a decision the coordinator may not make arises THE coordinator SHALL append a question entry to the relevant room in the seat's own voice, marked as a question and never as a ruling, and SHALL continue every card that does not depend on it; the dispatch order SHALL name the question on each dependent card it holds as NOT STARTABLE; the ruling entry SHALL still be proposed verbatim and appended on the owner's yes (T-307); pinned by a body that parks one decision and requires the next unrelated dispatch to proceed, and by a method eval on the room format's question-entry shape.
- WHEN a spawn is refused for quota THE coordinator SHALL wait with the wait verb until the window reopens, retry the same spawn, and record the wait, never abandoning the lane or the order; a stop on quota exists only where the approval mode's record says so; pinned by a body over a fixture refusal.
- WHEN the owner returns THE return brief (`brief.mjs --since <instant>`) SHALL list what merged with its CI conclusion by name, what was parked and why, the question entries awaiting a ruling, the lanes live and their phase, and the repairs dispatched under the scope, each item with its ref, and SHALL say plainly what it cannot know (a run still in progress, a lane's phase unreported); pinned by bodies over a fixture history.
- WHEN this card lands THE conventions SHALL carry, at the loop's section, the host keep-awake requirement and the resumption of a dead seat from the run record and the ledger (ADR-025), each as an operational rule with its derive command, and the orchestrator role file's stop list SHALL name only the stops the approval mode's record reserves.

## Implementation notes

## Verdicts
