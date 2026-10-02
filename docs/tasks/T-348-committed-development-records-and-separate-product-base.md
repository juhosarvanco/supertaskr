---
id: T-348
title: Read committed development records from their selected repository with a separate product base
feature: F-03
milestone: 4
priority: 1
size: M
status: planned
blocked_by: [T-347]
touches: [tools/e2e/scripts/records.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/records.spec.ts, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/brief-flush.spec.ts]
builder: gpt-6.1-sol@xhigh
verifier: gpt-6.1-sol@xhigh
built_by:
verified_by:
review: independent
---

Provide a read-only committed-card view and frozen task snapshot from the selected records repository, with an independently resolved product starting commit. This is a bounded records-consumer foundation, not physical migration or split execution. Configured split workspaces must refuse legacy orchestration routes that still assume cards and code share one repository; they must not silently display or mutate a stale product-side board.

## Source and reconciliation

Prepared against product commit 78dbff8c92590921a15ad8ffd5e062cb8fc50277, with T-347 as the implementation prerequisite. Existing cardIndex reads live task cards from one root; context reads conventions, cards, components, process and integration Git history from that same root. Dispatch stamp commits currently supply the product lane cut. The snapshot here separates those references before later work adapts dispatch, native preparation and landing. It is the committed-card portion of M2 and M4 preparation; app/watchers, component expansion, metrics consumers and the full orchestration lifecycle remain separate work. T-309/T-329 retain succession/jobs obligations, T-279-s1 retains transitional cost findings, and T-303/T-244-s1 retain configuration/package obligations.

## Acceptance criteria

- WHEN a committed-card snapshot is requested THE tools/e2e/scripts/records.mjs reader SHALL resolve the selected records root through T-347 using its local/product discovery and source-neutral validator without opening a working-tree association, resolve the requested records revision to an exact commit in that repository, and read tracked card bytes from that commit rather than the working tree, a stale product copy or a product Git object with the same-looking reference. The portable association SHALL be read and validated from the same exact records commit, never substituted from the working tree. The association and card entries SHALL be regular Git blobs, with symlink and gitlink entries refused by name. Missing repository, commit or task SHALL refuse by name; duplicate declared task ids and a card path whose declared id differs SHALL refuse rather than select a winner.
- WHEN the reader returns a task THE immutable receipt SHALL carry the project association, records repository role, exact records commit, repository-relative card path, object format, card blob id and unchanged card bytes, plus the portable association path, blob identity and detached association values from that same commit; the association SHALL match the captured local binding and actual product lineage at the independently resolved product base. Missing or mismatched committed association SHALL refuse; ordinary CLI display SHALL print a concise receipt and active contract, not archived grant history or raw unrelated cards. The returned values and retained bytes SHALL be detached from mutable caller inputs and protected from caller mutation. The snapshot SHALL be data, not dispatch approval or write permission.
- WHEN a product starting revision accompanies a snapshot THE reader SHALL resolve it only in productRoot and carry it as an independently labelled product base; records commit and product base SHALL never be substituted for one another or compared as one first-parent distance. Bodies SHALL use independent histories, including an identical reference name resolving to different commits and a records-only commit that leaves the product base unchanged.
- WHEN the read-only records view lists tasks or displays a selected task THE tools/e2e/scripts/brief.mjs CLI SHALL use the selected committed records revision and carry its provenance, require an explicit product starting revision for a paired snapshot, and run before legacy context loading. The list SHALL distinguish a legitimately empty committed board from an unresolved root or revision. View operations SHALL not build the parser/app, run suites, change product HEAD/index/tree or its verdict token, write records, revise grants, create worktrees, commit, push or contact a remote. These absences SHALL be checked by process/write controls and state comparison, with a real read as the positive control. The existing live-arm/flag inventory in tools/e2e/tests/brief-flush.spec.ts SHALL account for the supported records views and their modifiers without hiding accepted flags or weakening the inventory check.
- WHEN a split binding is present and an existing orchestration arm whose roots have not yet been adapted is requested THE CLI SHALL retain T-347's guard and refuse before legacy context construction or side effects, naming the unsupported route and the available read-only views. This temporary restriction SHALL cover dispatch, brief/card/state/preflight, fence/bench/merge, express, grant, seat and run routes until their respective migration contracts adapt them; it SHALL NOT be claimed as enforcement on directly imported APIs. Colocated routes SHALL preserve their existing behavior. No split binding SHALL be activated for this project by this lane.
- WHEN an already captured snapshot is used after the working card, records branch, local binding or association changes THE captured receipt and bytes SHALL stay fixed; requesting a new revision SHALL return a separately identified snapshot, never silently refresh the original. Malformed cards and unsafe card paths SHALL produce actionable record-reader errors, not an empty board or a product-test fallback.
- WHEN this foundation is verified THE bodies in tools/e2e/tests/records.spec.ts and tools/e2e/tests/brief.spec.ts SHALL prove split read selection despite a conflicting product-side copy, independent base/record refs, immutable captured bytes, duplicate/id mismatch refusals, no private-record requirement for product-only root inspection, and refusal-before-effects for unsupported split arms. The notes SHALL name the precise supported view/snapshot APIs and distinguish tested fixture behavior from actual split delivery, which is not claimed.

## Implementation notes

Keep the reader independent of generated parser builds: reuse existing source-only card parsing helpers or equivalent established pure helpers, with no import-time I/O. Read committed Git bytes; uncommitted drafting views and assisted record saves come in the records fast-path contract. Task IDs do not authorize anything here. Root/resource reservations, frozen-admission authority lookup, native assignment changes, app/watchers and physical cutover are explicitly later migration slices. No private remote is created, no user files are moved and no product CI exemption is introduced.

## Verdicts
