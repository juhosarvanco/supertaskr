---
id: T-347
title: Explicit workspace roots and repository-qualified resources prepare product and records separation
feature: F-03
milestone: 4
priority: 1
size: M
status: planned
blocked_by: []
touches: [tools/e2e/scripts/workspace.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/workspace.spec.ts, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/brief-flush.spec.ts]
builder: gpt-6.1-sol@xhigh
verifier: gpt-6.1-sol@xhigh
built_by:
verified_by:
review: independent
---

Provide one explicit contract for locating product source, development records and local runtime, plus repository-qualified paths. This is preparatory product code: it preserves the colocated workflow and does not move records or claim split dispatch is implemented. The root descriptor is association and path resolution, never owner authorization or proof that two workers can safely run together.

## Source and reconciliation

Prepared against product commit 78dbff8c92590921a15ad8ffd5e062cb8fc50277. The current arm's context, card index and component index take one root; no workspace resolver exists there. The September M1 proposal was not filed. Older unfiled proposals used T-345 and T-346, and a checkpoint calls T-345 a proposed express demonstration. Those labels are preserved as history rather than reused. This card is the roots/resource portion of M1. T-303 keeps its broader configuration and installation audit; this card does not claim it complete. T-344's operational grant and runtime ownership remain in place. Native desktop execution is the supported implementation route; T-312 and the cross-harness demonstrations remain deferred.

## Acceptance criteria

- WHEN the workspace resolver runs THE tools/e2e/scripts/workspace.mjs module SHALL return named productRoot, recordsRoot and runtimeRoot, layout, association provenance and limitations; runtimeRoot SHALL remain the selected product checkout's existing runtime directory, not a Git repository or a writable fence root, and tools/e2e/tests/workspace.spec.ts SHALL include an import-only body to prove the module launches no command or write on import.
- WHEN no local workspace binding is configured THE resolver SHALL retain the colocated product/records layout; WHEN a split binding is configured THE local binding SHALL name the product and records locations and the project association explicitly, while the portable association in records SHALL contain no local absolute path, hostname, hardware identity or credential. A copied records repository SHALL carry association but not machine locations. The resolved product and records roots SHALL be repository top levels, not nested directories silently interpreted as roots.
- WHEN a split association is checked THE resolver SHALL compare the binding's project identifier with the portable association and the declared product object format and root-commit set with the actual product repository; missing, unreadable, mismatched or unsupported declarations SHALL refuse by name. These checks SHALL be described as accidental-mismatch detection, not authentication, and changing a network-derived hostname SHALL change no resolution decision. Root-commit comparison SHALL use exact equality of normalized root-commit sets reachable from the selected product commit; shallow or incomplete history SHALL be a named inability, not a root set inferred from shallow boundaries. A source-neutral association validator SHALL accept captured association data and measured product identity so a later committed reader can validate the same schema without reading working-tree association bytes.
- WHEN product-only resolution is requested THE resolver SHALL require only the product checkout and its runtime location, without opening private records or requiring their existence, and SHALL explicitly report records association as unverified; WHEN development resolution is requested for a configured split workspace THE records root and association SHALL be validated, and missing records SHALL be a named inability rather than an empty board or a fallback to a stale product-side copy.
- WHEN a resource is resolved THE key SHALL distinguish product and records repository roles, relative path and source token/resolution rule. A caller-supplied explicit legacy-token map SHALL decide bare-token ownership without consulting which destination file happens to exist; unknown roles, unmapped tokens and tokens mapped to both roles SHALL refuse by name. Colocated roles resolving to the same physical path SHALL NOT be described as disjoint reservations. This representation SHALL encode no delivery route.
- WHEN a relative resource is resolved THE module SHALL refuse absolute tokens, traversal, Git-control/runtime paths, unknown roots and symlink escapes, including a new destination beneath an existing escaping symlink. Bodies SHALL distinguish valid new files beneath safe tracked directories from escapes. Resource resolution SHALL NOT grant write ownership or modify a fence.
- WHEN tools/e2e/scripts/brief.mjs is invoked with the standalone read-only workspace inspection mode THE answer SHALL use this resolver before ordinary context loading, report the selected roots and what is and is not supported, and refuse combinations with other arms. The mode SHALL not write a binding or portable association, initialize runtime, revise a grant, stamp a card, create a worktree, commit, push or run product checks. WHEN a split binding is present THE existing development-orchestration CLI arms SHALL refuse before ordinary context loading or side effects, naming the supported workspace inspection route: dispatch, brief/card/state/preflight, fence/bench/merge, express, grant, seat and run. An unreadable, malformed or unresolved configured binding SHALL produce a named inability and never fall back to colocated operation; only an absent binding selects that default. The guard SHALL be covered in tools/e2e/tests/brief.spec.ts with a conflicting product-records fixture and SHALL claim only the CLI boundary, not directly imported APIs. Existing colocated arms SHALL remain unchanged. The existing live-arm/flag inventory in tools/e2e/tests/brief-flush.spec.ts SHALL account for the supported workspace inspection route and its modifiers without hiding accepted flags or weakening the inventory check.
- WHEN this preparation is verified THE bodies SHALL include valid colocated and split repositories, wrong/missing associations, equal relative paths in different roles, ambiguous legacy mapping, a stale colocated records copy and the path-escape controls. The implementation notes SHALL record the final local binding and portable association schema and explicitly state that split orchestration, component expansion consumers, paired reservations and landing authority are not activated by this card.

## Implementation notes

The local read contract is proposed as the ignored runtime workspace binding, with a portable workspace association at the records root. The executor may settle JSON field spellings inside this contract and document them; no remote, record store or public migration is created. Use only existing Node/Git dependencies. The workspace inspection command is a small mode on the existing arm, not a second CLI. Follow the normal ask path for any necessary scope expansion. The distinct product base and records snapshot implementation belongs to T-348; no cross-repository commit distance is computed here.

## Verdicts
