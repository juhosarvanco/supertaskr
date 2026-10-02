---
id: T-347
title: Explicit workspace roots and repository-qualified resources prepare product and records separation
feature: F-03
milestone: 4
priority: 1
size: M
tier: standard
status: building
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

### Fresh recovery criteria echo — before implementation

- Return named product, records and runtime roots, layout, provenance and limitations; module import launches no command or write.
- Default only an absent binding to colocated roots; configured split bindings name both repository top levels and project association, with a machine-neutral portable association.
- Validate project, object format and exact complete reachable root-commit sets; expose source-neutral validation of captured association data and measured identity, with named refusals and no hostname dependence.
- Product-only resolution never opens records and marks their association unverified; development resolution validates configured records or refuses without stale-copy fallback.
- Key resources by role, relative path and source rule; explicit legacy mappings decide ownership, reject ambiguity and report colocated physical overlap honestly.
- Reject absolute, traversal, control/runtime and escaping symlink paths, including new destinations; allow safe new files and grant no ownership.
- Inspect workspace before context as a standalone read-only CLI mode; refuse mixed modes, invalid bindings and split development arms before side effects; preserve colocated behavior and account for workspace flags in the existing inventory.
- Cover valid layouts, association failures, role-equal paths, legacy ambiguity, stale records and path controls; document final schemas and deferred split orchestration, consumers, paired reservations and landing authority.

The local read contract is proposed as the ignored runtime workspace binding, with a portable workspace association at the records root. The executor may settle JSON field spellings inside this contract and document them; no remote, record store or public migration is created. Use only existing Node/Git dependencies. The workspace inspection command is a small mode on the existing arm, not a second CLI. Follow the normal ask path for any necessary scope expansion. The distinct product base and records snapshot implementation belongs to T-348; no cross-repository commit distance is computed here.

### Implemented contract and fresh recovery

The local binding is `.supertaskr/workspace.json` at the selected product checkout. Its exact JSON fields are `version: 1`, `projectId`, `productRoot` and `recordsRoot`; both locations are absolute paths. A configured binding declares split layout, names the selected product repository top level and a distinct records repository top level. Only an absent binding selects colocated operation. Malformed, unreadable, dangling, unsupported or unresolved bindings produce named refusals.

The portable records file is `workspace-association.json`, with exact fields `version: 1`, `projectId` and `product`; `product` has exactly `objectFormat` and `rootCommits`. Supported formats are `sha1` and `sha256`. Roots are non-empty sets of full object ids, normalized for case, order and duplicates before exact equality. Extra machine-location, hostname, hardware or credential fields refuse. Identity measurement disables replacement objects, lazy fetching, optional locks and commit-graph acceleration, and refuses shallow, grafted or incomplete history. Association detects accidental mismatches; it establishes no authentication or owner authorization.

`measureProductIdentity` reads product identity without records. `validateAssociation` accepts captured parsed association data, separately measured product identity, binding project id and a provenance label, and performs no I/O. Product-only resolution never stats, canonicalizes or opens private records, reports their association unverified and refuses records resources. Development resolution validates the configured records root and portable association without falling back to stale product-side records.

`resolveResource` retains repository role, relative path, source token and explicit-role or caller-supplied legacy mapping in its key. Ownership is never inferred from destination existence. Colocated roles keep distinct keys while reporting physical overlap. Lexical control/traversal checks plus canonicalization of the nearest existing ancestor reject existing symlink escapes and new destinations below escaping symlinks, while safe new files and internal symlinks resolve. Resource resolution grants no write ownership, changes no fence and encodes no delivery route. Runtime stays at the product checkout's existing runtime location and cannot be a Git repository, Git-control location or writable fence root.

The command is `brief.mjs --workspace [--product-only] [--root <product checkout>]`. It prints standalone JSON before ordinary context loading and rejects other arms or modifiers. The configured-binding CLI guard refuses split development orchestration before ordinary context or effects, names the inspection route, and keeps absent-binding colocated behavior. This claim covers the CLI boundary, not directly imported orchestration APIs. Split orchestration, component expansion consumers, paired reservations and landing authority are not activated.

The existing live-arm inventory now drives both workspace inspection modes. Its declared-flag derivation, unexplained-flag refusal, reverse inventory checks and planted unknown-flag control remain intact. The margin body measures non-empty output through file and pipe readers for both modes; their standalone JSON receives exit, parsed-root/mode/association and complete-answer equality assertions. Every ordinary prose arm retains the provenance-line assertion.

The four recovered implementation files are byte-for-byte equal to collected candidate `08ea3fe0e09d1dde57c1b2f9278904d6292d1cfb` and original drill snapshot `b8e7d6fb5f4508d3a2b9b65c4de8d5e58c7b4706`. This is recovery input from failed T-347-a2, not approved delivery. The fresh admission is `767e092ca862aa93ada86a9a6c919e1647859eea`; the reviewed v4 acceptance criteria and five-path fence remain intact. Failed original grading and the unsupported nested-fixture episode remain preserved in external evidence. No nested checkout or active-lane mutant was created in this recovery.

The actual native actor is `01a0feb2-bdcb-7a51-82a1-67cda8be515e`, executor task `migration347_reentry_executor_gpt61`; requested model/effort is gpt-6.1-sol/xhigh. Observed model and usage are unknown. `built_by` stays blank during building and verifying; completion provenance is integrator-owned.

### Attributed unchanged self-drill proof

The coordinator's frozen `coordinator-drills-b8e7d6fb-v1/results-T-347.json` is the original attempt's proof: baseline nine passes, M1–M9 each exit 1 with exactly one intended failed body, SHA256 restoration and nine restored passes. Fresh comparison of all four recovered source/spec files against that snapshot permits reuse of this unchanged-body proof. These are attributed coordinator measurements and are not this executor's fresh final grade.

| Mutant | Body and one-sided planted property | Original observed result |
| --- | --- | --- |
| M1 | Import-only body: add an import-time command at the producer; the live command trap fires. | Exit 1; one failed body. |
| M2 | Colocated/runtime body: disable bare-runtime rejection; the empty-runtime control holds and the expected bare-runtime refusal fails. | Exit 1; one failed body. |
| M3 | Exact-root association body: disable root-set equality; the union control holds and the expected subset mismatch fails. | Exit 1; one failed body. |
| M4 | Association refusal body: disable exact schema keys; a hostname-bearing association is accepted and its refusal fails. | Exit 1; one failed body. |
| M5 | Product-only body: remove the early product-only branch; instrumented private-records access fires. | Exit 1; one failed body. |
| M6 | Complete-history body: disable shallow-history refusal; complete-history control holds and shallow-history refusal fails. | Exit 1; one failed body. |
| M7 | Resource/path body: remove physical confinement at the producer; safe internal-symlink control holds and escaping-path refusal fails. | Exit 1; one failed body. |
| M8 | CLI arms body: disable the configured-binding guard; fixture dispatch reaches context and loses the expected split refusal. | Exit 1; one failed body. |
| M9 | CLI failure body: data mutant changes malformed-binding fixture bytes to the accepted valid binding; negative inspection exits 0. | Exit 1; one failed body. |

Restoration hashes at the original snapshot, also measured on the recovered bytes: workspace.mjs `1e9234c2bc0d9d420155ea88b04c446f39fa11d46dc021667af2f03f0b6e39c2`; brief.mjs `51edc8a4e197be042e45ca209982fc18d0a97aacc9722e1c5f3e1e7f75ef2473`; workspace.spec.ts `58411b8d941d7873858e30bef8ab559730092ed19d7ef4fb0582dcd0930bffcf`; brief.spec.ts `b0f966691eb05232f59aaa489e129cceb24e497f78e2b9a74bc2898d8b1d3b18`. No assertion and producer were changed together. Fresh recipes for the changed inventory/margin bodies use a committed snapshot and coordinator-owned detached scratch through this actor's durable ask.

### Fresh changed-body self-drill block

The coordinator mechanically executed this executor's frozen recipes at `61fce2bd3c737ee8e6333d2393f768897a77456e` in its owned detached scratch. The public `reentry/coordinator-drills-61fce2bd-v2/results-T-347.json`, actual mutation patches and failure logs were read; every M10–M14 run selected one body and exited 1 at its intended assertion. The restored combined control passed two bodies at exit 0. Both durable questions are acknowledged. The first M10 selection used a leading regex anchor that did not match Playwright's full titles and selected zero tests; its v1 no-body log remains preserved and is excluded from kills. The corrected v2 recipes change only those selections. No active-lane mutation occurred, the scratch was removed cleanly and all coordinator drill jobs ended.

| Mutant | Changed body and one-sided planted property | Fresh coordinator result |
| --- | --- | --- |
| M10 | Inventory DATA mutant removes the product-only live-arm entry; declared flags still include the modifier. | Exit 1; one failed body naming unannounced --product-only. |
| M11 | Margin body: resolver runtime location uses mutant-runtime while selected roots remain valid. | Exit 1; one failed body at JSON runtimeRoot expectation. |
| M12 | Margin body: CLI resolves development regardless of the product-only modifier. | Exit 1; one failed body at product-only mode/association expectation; development control holds. |
| M13 | Margin body: standalone inspection prints valid complete JSON then returns the usage exit. | Exit 1; one failed body at inspection exit expectation. |
| M14 | Margin body: producer emits equal-length file/pipe provenance values. | Exit 1; one failed body at complete JSON equality; byte counts, roots, modes and exits hold. |

Each mutation's restored working bytes match its snapshot bytes by SHA256 and empty per-path diff. M10 restores brief-flush.spec.ts to `a96e94799c67d6a0857b26185f273ade80f370593a5ae07b93b8452a9d80e5fb`; M11 restores workspace.mjs to `1e9234c2bc0d9d420155ea88b04c446f39fa11d46dc021667af2f03f0b6e39c2`; M12–M14 restore brief.mjs to `51edc8a4e197be042e45ca209982fc18d0a97aacc9722e1c5f3e1e7f75ef2473`. These five kills cover the two changed bodies; the unchanged nine new bodies retain their attributed M1–M9 proof above. Syntax/import failures and zero-body runs count as no kill.

### Correction clause and grading boundary

The brief's `tasks/TASK-FORMAT.md` pointer resolves to the tracked `method/tasks/TASK-FORMAT.md` ceremony table. Its runtime role default differs from this native assignment; requested settings do not prove observed identity. The normal binding and five-path local manifest were read and agree with this fresh card. The only code repair beyond the recovered bytes is the admitted CLI inventory compatibility obligation.

At committed preparation snapshot `61fce2bd3c737ee8e6333d2393f768897a77456e`, the range from fresh admission contains six paths: the five admitted source/spec paths and this card. Read-only owed-set derivation exits 0 and requires parser, app and whole e2e. The docs gate exits 1 meaning FIRES, with zero live-frontmatter issues; its fixture-root reader advisory names workspace.spec.ts. Graph `index --check` exits 0 CURRENT: 203 files, 2631 symbols and 2505 edges. Boot and method-eval triggers match zero paths; Rust suite is not owed. The same path set will remain through the notes and status-only commits; the final grade derives its own exact range again.

Fresh setup ran parser install/build, app install/build and e2e install, all exit 0. E2e typecheck exits 0. The retained focused compatibility iteration exits 0 with two passed bodies. A preliminary log redirect named a directory not yet created and refused before tests; the first successful focused iteration's log was removed by Playwright's default output cleanup, so the retained iteration uses a distinct output subdirectory. An initial docs-gate invocation used ambiguous plain-relative paths from package cwd and refused at usage exit 2; the corrected explicit `./` and `../../` spellings produced the FIRES reading above. None of these exploratory checks is claimed as the final grade.

New body names require capabilities census regeneration at the bench/merge, outside this lane's source fence. The TypeScript paths trigger the normal graph obligation there; the lane leaves generated files and pins to their owning seat. This executor grades its final code-and-notes commit over the fresh admission range, with actual exits and body counts in the report, then makes a last commit changing only this card's status to verifying. That status-only commit uses the role's sole no-rerun exemption.

## Verdicts
