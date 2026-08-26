---
id: C-05
name: App
layer: app
paths:                    # the shell/umbrella only — panes and plumbing own their files
  - app/index.html
  - app/vite.config.ts
  - app/vitest.config.ts
  - app/test/**
  - app/src/App.tsx
  - app/src/main.tsx
  - app/src/index.css
  - app/src/vite-env.d.ts
  - app/src/components/shell/**
  # components/ui/**, lib/utils.ts and lib/verdicts.ts left for C-16 at
  # T-033 — shared primitives, extracted so children stop depending on
  # the shell to import a Button. No file moved on disk.
  - app/src-tauri/src/lib.rs
  - app/src-tauri/src/main.rs
  - app/src-tauri/src/acl_pin.rs      # T-010 settlement, see below
  - app/src-tauri/src/churn.rs        # T-010 settlement, see below
  - app/src-tauri/src/index_cmd.rs    # T-010 settlement, see below
  - app/src-tauri/build.rs
  - app/src-tauri/tauri.conf.json
  - app/src-tauri/capabilities/**
  - app/src-tauri/tests/graph_budget_bench.rs   # T-141 settlement, see below
depends_on: [C-01, C-06, C-07, C-08, C-09, C-10, C-11, C-12, C-13, C-14, C-16]
decisions: [ADR-007, ADR-008, ADR-010, ADR-012]
status: auto
touch_slugs: [app-shell]
---
The front door (ADR-008): Tauri shell + window frame + hardened webview
config, mounting panes over the project's files. Umbrella for the app
package (harness, shared ui primitives); the board pane, detail panel,
watcher plumbing and design tokens are its child components C-08–C-11.
Read-only lens; writes stay single-field frontmatter edits or thread
appends, nothing else.

**THE THREE `.rs` FILES ADDED AT T-010, AND WHY THEY ARE CLAIMED RATHER
THAN DECLINED.** This component named its Rust half three files at a
time — `lib.rs`, `main.rs`, `build.rs` — while three more sat beside them
owned by nobody. They were invisible only because the indexer collected
no Rust; T-010 makes them territory, so the registry settles them here
(ADR-004) instead of letting the regen discover an unmapped bucket.
`index_cmd.rs` and `churn.rs` are the shell's own command bodies, the
thing this file already calls "the thin command wrappers" — ARCHITECTURE
names the churn source "C-05's Rust half" in as many words, and
`index_cmd.rs` is the seam T-012 opened onto C-07, so claiming it is what
makes the DECLARED C-05→C-07 dependency observable at all. `acl_pin.rs`
drives real InvokeRequests against `capabilities/**`, a path this
component already claims, so the pin belongs to the surface it pins.
Nothing here is declined: every `.rs` under `app/src-tauri/` is now
claimed by C-05, C-10, C-14 or C-07, and the D2 unmapped bucket stays
gone. The two fixture files T-025 left over — `src/bin/fake_agent.rs` and
`tests/agent_runner.rs` — went to C-14 at the same triage, because a
component's test double belongs to the component it doubles.

**THE BENCH HARNESS ADDED AT T-139 AND SETTLED HERE AT T-141, AND WHY IT
IS THIS COMPONENT AND NOT EITHER ONE IT IMPORTS.**
`tests/graph_budget_bench.rs` measures what it costs to deliver
`docs/architecture/graph.json` to the map pane. It imports both sides of
the seam it measures — `nputer_index` (C-07) and `docs_watch` (C-10) — so
it landed under no component's globs at T-139's regen and became the
SECOND D2 this repository has ever carried, drawing two undeclared shadow
edges out of the unmapped node. **The two components it imports are the
two wrong answers, and for the same reason in mirror.** C-07 is a
standalone crate with `depends_on: []` that the app depends on; claiming
the harness there would declare that the indexer depends on the app's
docs watcher, inverting the real direction. Claiming it in C-10 would
give the watcher a dependency on the indexer it does not have. **C-05
already declares both** and already owns `app/src-tauri/`'s shell files
by name, and the harness sits in the app's own test directory measuring
the app's own delivery path — the T-010 rule at `tests/agent_runner.rs`,
that a component's suite belongs to the component it exercises, applied
to a harness whose subject is a seam rather than a module.

**AND THE CHOICE WAS MEASURED RATHER THAN ARGUED.** `arch --root ../..`
at `2a922ce`, one arrangement at a time:

    no owner (as merged)   39 edges   5 findings   D2 + 2 shadow rows
    claimed in C-05        37 edges   4 findings   nothing added
    claimed in C-07        38 edges   5 findings   new undeclared C-07 -> C-10
    claimed in C-10        38 edges   5 findings   new undeclared C-10 -> C-07

Only C-05 moves both columns DOWN. The harness's two observed file edges
fold into `C-05 -> C-07` (1 -> 2) and `C-05 -> C-10` (39 -> 40), both
already CONFIRMED — **the claim adds nothing this registry did not
already carry**, which is the test that separated it from the two
candidates that looked closer. A declaration that LENGTHENS the relation
table has picked the wrong owner.
