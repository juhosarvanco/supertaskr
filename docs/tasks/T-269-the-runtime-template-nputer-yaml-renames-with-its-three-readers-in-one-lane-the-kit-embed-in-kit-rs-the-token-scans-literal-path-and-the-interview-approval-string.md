---
id: T-269
title: "The runtime template method/runtime/nputer.yaml renames to supertaskr.yaml WITH its three readers in one lane — the compile-time embed in kit.rs, the token scan's literal path, and the interview approval string — because a git mv alone fails the Rust build"
feature: F-01
milestone: 4
size: S
priority: 7
status: planned
suggested_by: "the T-265 executor's ASK 1 of 2026-09-08 (ask-T-265.md), re-deriving the T-264 verifier's routed line: three readers outside T-265's fence, one of them (tools/e2e/scripts/token-scan.mjs) inside T-224's live fence, so the rename could not be granted to T-265 by fast path A"
blocked_by: [T-224, T-265]
touches: [method/runtime/, method/roles/planner.md, docs/reference/12-genesis.md, app/src-tauri/src/agent/kit.rs, tools/e2e/scripts/token-scan.mjs, app/test/interview-chat-dom.test.tsx]
builder:
verifier:
built_by:
verified_by:
review: independent
---

ADR-022 decision 2 names the project config `supertaskr.yaml`, and the
kit's runtime template is the file genesis copies into a project. It has
three readers outside method/: `app/src-tauri/src/agent/kit.rs` embeds
it at compile time (`include_str!`, plus its kit-relative name and the
KIT_FILES list), `tools/e2e/scripts/token-scan.mjs` names it as a
tracked text format in the control corpus, and
`app/test/interview-chat-dom.test.tsx` expects the copy command in the
approval string. T-265 could not be granted the token scan's path while
T-224 held tools/e2e, so the rename is carved out of T-265 (its
criterion 1 says so) and lands here, after both, in one lane.

## Acceptance criteria

- WHEN the lane lands THE file SHALL be `method/runtime/supertaskr.yaml`
  (`git mv`), its header comment SHALL carry the new name, and the three
  readers SHALL name it: kit.rs's `include_str!` path, its `rel:` string
  and the KIT_FILES expectation; token-scan.mjs's control-corpus entry;
  the interview approval string in interview-chat-dom.test.tsx — and
  `cargo build` from app/src-tauri/ SHALL succeed at every commit of the
  lane (a half-landed rename fails the build, which is why the four move
  together).
- WHEN a genesis runs (the interview e2e or the app suite's genesis
  bodies) THE kit copied into the project SHALL carry `supertaskr.yaml`
  under runtime/, and the project's own config file SHALL be
  `.supertaskr/supertaskr.yaml`.
- WHEN method/roles/planner.md and docs/reference/12-genesis.md name the
  runtime template THE prose SHALL say the new name (the two lines T-265
  parked with the file).
- The lint:tokens control corpus SHALL still include the file under its
  new name (the `CONTROL includes tracked text format` body), and the
  suites owed by the docs gate SHALL run green.
