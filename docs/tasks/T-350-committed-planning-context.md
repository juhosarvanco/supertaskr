---
id: T-350
title: Capture a committed planning context from private records and an independent product base
feature: F-03
milestone: 4
priority: 1
size: M
tier: standard
status: building
suggested_by: codex/gpt-6.1-sol @architect
blocked_by: [T-349]
touches: [tools/e2e/scripts/records.mjs, tools/e2e/scripts/records-context.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/records.spec.ts, tools/e2e/tests/records-context.spec.ts, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/brief-flush.spec.ts]
builder: gpt-6.1-sol@xhigh
verifier: gpt-6.1-sol@xhigh
review: independent
---

Make the next real records-consuming route a read-only planning packet: selected active card, committed component registry, explicitly selected governing sections and product method context, with a receipt for every input. The packet's records commit is separate from its product base. It must never be mistaken for a complete executor brief, dispatch permission or working reservation.

## Finding and reconciliation

Prepared at product commit e5099a01c019e7a2df748d3447817d36a5e0d473, with T-349 as the qualified-fence prerequisite. T-348's reader already captures exact committed cards and association bytes, while legacy brief construction still opens live cards, components and governing text in one root. This contract extends that committed reader rather than adapting an entire writable dispatch. T-204 still owns the full executor brief and its unresolved contract reconciliation; this planning packet does not fulfill it. T-303 and T-244-s1 keep portable setup and installed-package obligations. App/watchers, writable fences, landing, records saving and physical activation remain later migration work.

## Acceptance criteria

- WHEN a planning context is requested THE tools/e2e/scripts/records-context.mjs consumer SHALL capture one selected task through T-348 with explicit records revision and product starting revision, then read every selected records input from that same frozen records commit and every selected product input from the independently resolved product base. Extend and reuse tools/e2e/scripts/records.mjs's existing module-private committed-byte helpers through a shared exported capture primitive used by this consumer, preserving regular tracked blobs, immutable retained bytes, exact Git-mode/UTF-8 checks and named absence/refusal behavior. A working-tree association, dirty card, later HEAD, stale product board or same-looking reference in the other repository SHALL not replace an input.
- WHEN the packet is rendered THE default output SHALL contain only the selected active contract, qualified fence reading, selected component facts, explicitly requested governing sections and product method context, plus a concise per-input receipt identifying role, repository, exact commit, path, blob and section selection. Whole selected bytes SHALL be retained immutably for integrity, without printing historical card notes, verifier verdicts, archived grants or unrelated cards. Caller mutations and subsequent root, association, branch or working-file changes SHALL not alter a captured packet. Requested sections that are missing or ambiguous SHALL refuse by name instead of being omitted.
- WHEN components or fences are interpreted THE consumer SHALL measure and freeze canonical filesystem-root and Git common-directory facts at capture time through the already fenced records capture layer, refusing unsupported shared-common-directory or nested-root topology before returning a qualified fence reading. It SHALL use the canonical parser's public pure APIs and T-349's qualified fence model with those measured facts and the explicit ownership map. The committed registry SHALL supply slug ownership; no hand-maintained slug map, second component/YAML validator or path-prefix ownership guess SHALL be added. Invalid registry, missing mapping, conflicting physical facts or an unusable fence SHALL be reported as a named planning refusal. The receipt SHALL distinguish association identity, records commit, product base and the physically measured root facts.
- WHEN tools/e2e/scripts/brief.mjs exposes this consumer as the standalone view `--records-context <T-NNN> --records-revision <revision> --product-base <revision> --context-inputs <JSON-file>`, optionally with `--root <product-checkout>`, THE view SHALL enforce the request shape specified below, refuse malformed/dangling/duplicate modifiers and combinations with another view or mutating flag before dependency loading, run before legacy context construction, and print its supported limits. It SHALL not build dependencies, run suites, reserve writers, revise grants, take the seat, stamp cards, create worktrees, commit, push or contact a remote. A generated parser entry may be a declared prerequisite of this new view; if absent it SHALL refuse by name without installing or building it. Existing T-348 list/task views SHALL retain their source-only execution and not acquire that prerequisite through import-time loading.
- WHEN a configured split binding is present THE new read-only route SHALL leave every unadapted mutating or legacy orchestration route refused before side effects. The accepted flag inventory and pipe/file behavior in tools/e2e/tests/brief-flush.spec.ts and tools/e2e/tests/brief.spec.ts SHALL account for the new view and all modifiers without weakening exhaustive accepted-flag coverage. A bundle combining this view with a mutating flag SHALL refuse, not choose by flag order. No project split binding SHALL be activated by this lane.
- WHEN a packet is described to a reviewer or user THE output and final notes SHALL label it a selected planning context, list the requested inputs it actually covers and explicitly state that input selection is not proof of complete execution-rule coverage. It SHALL not label a task admitted, reserved, ready to execute or verified merely because this read succeeded. The notes SHALL name supported APIs, parser availability requirements and unresolved installed/package consumers.
- WHEN the consumer is verified THE bodies in tools/e2e/tests/records-context.spec.ts, tools/e2e/tests/records.spec.ts and tools/e2e/tests/brief.spec.ts SHALL use two independent repositories with conflicting same-spelled inputs and same-named refs. They SHALL prove frozen selections despite dirty/newer state, per-input provenance, regular-mode and missing/ambiguous-section refusals, complete committed-registry capture, mixed component expansion, real linked-worktree and nested-repository refusals, omitted history, caller immutability and no side effects using real reads as positive controls. They SHALL prove a configured split cannot reach an unadapted write route, and an absent parser build cannot break the existing source-only views. These are deterministic fixture bodies, not a claim of actual split delivery or a new demonstration campaign.

## Implementation notes

Draft v2 outside the product repository, incorporating independent review v1. Proposed new files live under already tracked script/test parents. Size M is provisional: one committed-context consumer test cycle with early CLI integration. Run only after T-349's delivered API is available; re-read the final fence and source claims against that new base before pinning the card. The local workspace stays colocated.

### Request shape and section selection

The request file is non-authoritative selection data, not another store or a substitute for committed inputs. Its UTF-8 JSON shape is `{version: 1, legacyTokenMap: {...}, inputs: [...]}` with no unknown top-level fields. Every input is exactly `{role: "product"|"records", path: "repository-relative/path", selector: {kind: "whole"}}` or the same object with selector `{kind: "section", depth: 1|2|3|4|5|6, heading: "exact plain heading text"}`. Unknown fields, malformed paths/control paths, duplicate selections and conflicting ownership entries refuse by name. Read the selected records commit's complete canonical component-file set, not a caller-provided partial slug registry; every used registry blob receives a receipt. Select no additional task card or operational grant archive as a context input: the selected task already arrives through its active-contract projection.

A section selector matches one exact ATX heading at its declared depth outside fenced or indented code. Duplicate matching headings or no match refuse. The selected section extends to the next non-inert heading at the same or shallower depth, or EOF. No fuzzy matching, recursive document discovery or silent source substitution. Whole-file selection is explicit; it does not mean every project rule was selected. The CLI reads this request without changing it and records the normalized selection in the packet receipt. Both the API and CLI enforce the same request contract.

Prefer explicit selected paths/sections over an invented promise that the packet automatically contains every rule. The source-neutral snapshot remains data. Keep the installed lightweight records editor/save/backup milestone separate; this card does not make record edits free and does not claim product-only packaging is qualified.

Requested implementation and independent code verification: GPT-6.1 Sol extra-high through native desktop workers. Workflow-only controls, if required beyond deterministic fixtures, use GPT-5.6 Luna. Record observed identity/usage only if actually available.

## Verdicts

