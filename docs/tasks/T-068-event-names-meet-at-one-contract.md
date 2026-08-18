---
id: T-068
title: Event names meet at one contract — four channels cannot rename silently
feature: F-02
milestone: 4
priority: 31
size: M
status: planned
blocked_by: [T-057, T-065]
touches: [app-shell, app-agent]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs T-063-s2 (architect triage 2026-08-18). T-063 exposed the fourth
cross-language event channel and demonstrated the silent failure: TypeScript
and Rust each compile and test when only one side renames its literal. The
problem already spans all four channels, so a local pin for `startup-failed`
would preserve the architecture defect.

The contract at this checkpoint is exactly:

| event | direction |
|---|---|
| `docs-changed` | Rust → webview |
| `genesis-turn` | Rust → webview |
| `model-updated` | webview → Rust |
| `startup-failed` | webview → Rust |

One committed data record SHALL define those names and directions. TypeScript
and Rust may generate or expose native constants from it at build time, but
production code SHALL NOT read a repository file at runtime. Both languages'
tests SHALL mechanically compare their constants and production transport
sites with the same record.

## Acceptance criteria
- `app/test/fixtures/event-contract.json` SHALL be the single reviewable
  contract with schema `{ "events": [{ "name": string, "direction":
  "rust-to-webview" | "webview-to-rust" }] }`. It SHALL contain exactly the
  four rows above, with unique names and no unowned metadata.
- TYPESCRIPT SHALL expose the four names from one production module at
  `app/src/lib/event-names.ts`; Rust SHALL expose them from one production
  module at `app/src-tauri/src/event_names.rs`. Transport endpoints SHALL use
  those constants, not repeat string literals.
- BOTH new shared modules SHALL be mapped explicitly to C-10 in
  `docs/architecture/components/C-10-docs-watcher.md`. C-05 and C-14 already
  depend on C-10, so the imports SHALL add no new component relation or drift;
  creating an unmapped file or a new component is a regression.
- TESTS in both languages SHALL parse the same committed contract and prove
  exact membership, exact direction and exact count. Renaming, adding,
  removing or swapping the direction of any one row SHALL red.
- THE test contract SHALL enumerate the production call-site catalogue for
  all four channels: every relevant Tauri `emit`/`listen` endpoint is covered,
  and no endpoint carries an uncontracted event name. A one-sided constant
  rename SHALL red before runtime.
- THE production build SHALL NOT read JSON, inspect the checkout, depend on
  source layout or require a code-generation step. The JSON is a build/test
  contract; the native modules are the runtime representation.
- EXISTING payloads, delivery direction, stdout/stderr routing, listener
  lifetime, startup recovery and model round-trip behaviour SHALL remain
  byte-for-byte or behaviourally unchanged except for replacing literals with
  constants.
- NO new Tauri event, command, capability grant, dependency, environment
  access, filesystem write or network surface may be introduced.
  `generate_handler!` SHALL remain 13 commands and the ACL surface 92 entries.
- EVERY new or changed assertion SHALL be poisoned red and restored exactly.

Verification: app types/build/full vitest, bare Rust, full E2E, explicit
rename/add/remove/direction-swap mutants, graph regeneration and boot gate.
@human: none.

## Implementation notes

## Verdicts
