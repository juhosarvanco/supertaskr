---
id: T-321
title: "Retire a lane by the arm: preserve the lane's unfinished candidate deliberately (tracked changes, untracked work and the ignored artifacts a manifest names, never dependencies, credentials or verifier-only material), verify it recoverable by a restore-and-hash check, compare capture against removal, then remove the worktree and the bench under the applicable retirement authorization — a failed check or an interrupted run leaves the original recoverable and refuses the removal"
feature: F-04
milestone: 4
size: M
priority: 3
status: suggested
suggested_by: "the architect seat on 2026-09-13, from the T-301 retirement done by hand the same day and the Codex orchestrator's reconciliation review; filed on the owner's ruling for a later window, not the repair window; filing authorizes no development"
blocked_by: []
touches: [tools/e2e/scripts/retire-lane.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/retire-lane.spec.ts, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## What was measured

On 2026-09-13 the owner parked T-301 and ruled that its unfinished candidate be preserved and verified before the worktrees were removed, because the lane branch alone (task/T-301-settings-screen at de5805b1) carried none of the working tree's five modified and seven untracked files, and because the recovery clone's copy could not be assumed identical. The seat did it by hand: the status listing captured; the fifteen files (modified, untracked and the lane metadata that mattered) archived to a tar with a sha256 manifest; a patch of the modified files against the branch tip; the same fifteen files committed on an evidence ref (evidence/T-301-wip-2026-09-13 at 5840b725); the archive restored into a scratch directory and every hash re-verified, fifteen of fifteen; the recovery clone's copy compared file by file (three identical, nine differing — the clone was not the same work); the worktree compared once more against the capture immediately before removal; then the lane worktree and the bench removed and the branches kept. The archive and its receipts live in the evidence directory beside the repository. About forty minutes of the seat and eleven ledger lines, none of it an arm, and a second seat would reconstruct the procedure from a checkpoint's prose. The loop's verbs own dispatch, bench, merge and wait; retirement — preserve, verify, remove — is the seat's hand today. This card is one verb for one lane at a time, not a backup service, and it belongs to a later window than the repair window of 2026-09-14.

## Acceptance criteria

- WHEN the retire verb runs for a lane THE verb SHALL first require a quiescent writer — no run record of the lane in a live state, no process holding the worktree, no unanswered ask in the lane's ask file — and SHALL refuse by name otherwise, pinned by a body per condition.
- WHEN the writer is quiescent THE verb SHALL capture the lane's state deliberately: the branch tip and the base, the status listing, every tracked change as a patch against the tip, every untracked file, and the ignored artifacts a manifest names (the lane's run records and its ask file), and SHALL exclude dependencies, build outputs, credentials and verifier-only material (the reviews directory) by rule rather than by omission, pinned by bodies that plant one of each and require its absence from the archive; the archive is written outside the repository at the path the invocation names, with a sha256 manifest of every file it holds, and an evidence ref (a branch under evidence/) carries the same files as one commit on the lane tip.
- WHEN the archive is written THE verb SHALL restore it into a scratch directory and re-hash every file against the manifest, SHALL compare the evidence ref's tree to the manifest, and SHALL compare the worktree once more against the capture immediately before removal; a mismatch, a failed restore or an interruption at any step SHALL leave the worktree, the branch and the archive in place and refuse the removal by name, pinned by a body per failure.
- WHEN every check passes THE verb SHALL remove the worktree and the bench, keep the lane branch and the evidence ref, and write a receipt into the archive directory and to its stdout naming the surviving refs and their tips, the archive path, the manifest's hash and the checks it ran, so that a fresh seat resumes from the receipt without reconstructing the procedure; the receipt SHALL name the retirement authorization the verb ran under (the card's parked status with its dated ruling line, or an owner's ruling named by date), and a lane without one SHALL be refused, pinned by a body.
- WHEN this card lands THE conventions SHALL carry the verb's spelling once at the loop's section and SHALL name the seat's hand procedure of 2026-09-13 as retired by it.

## Implementation notes

## Verdicts
