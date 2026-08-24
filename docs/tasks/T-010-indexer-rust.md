---
id: T-010
title: Indexer — Rust language support
feature: F-06
milestone: 4
priority: 3
size: M
status: verifying
blocked_by: [T-009]
touches: [crate-index, docs/architecture/components/]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

REGISTRY DECISION REQUIRED BEFORE DISPATCH (triage 2026-08-16, from
the T-025 integrator's finding; re-verified at triage by enumerating
every `.rs` under app/src-tauri/ against every component's `paths:`).
FOUR Rust files are claimed by NO component and are invisible only
because the indexer is TS-only: `src/acl_pin.rs`, `src/index_cmd.rs`,
`src/bin/fake_agent.rs`, `tests/agent_runner.rs`. C-05 claims lib.rs,
main.rs and build.rs BY NAME; C-10 claims docs_watch.rs; C-14 claims
`src/agent/**`; C-07 claims the nputer-index crate. The moment this
task lands, the dogfood suite's zero-unclaimed-territory assertion
goes red and C-14's indexed footprint jumps from one TS file to ~3,200
lines of Rust. Settle the claims (ADR-004) BEFORE this builds, so the
regen CONFIRMS a decision instead of discovering a problem.

## Acceptance criteria
- WHEN run on a Cargo workspace THE indexer SHALL build the module
  tree from crate roots ([lib]/[[bin]], src/lib.rs, src/main.rs,
  mod declarations incl. #[path]) and resolve use paths (crate::,
  super::, self::, workspace crate names) to file edges.
- THE indexer SHALL emit Rust symbols (fn, struct, enum, trait,
  impl, mod, macro) with export flags and ranges; external crates
  SHALL appear as cargo package nodes; pub use re-exports SHALL be
  recorded as import edges with reexport: true.
- IF a use path cannot be resolved THEN THE indexer SHALL record it
  in unresolved[] with a reason and continue.
- Golden fixture rust-workspace SHALL pass; determinism property
  SHALL hold with Rust files in the tree; indexing this repo's
  app/src-tauri SHALL complete within the T-009 budgets.
- WHEN the golden regen runs over this repo THE unmapped set SHALL be
  exactly the argued set recorded above — every `.rs` file under
  app/src-tauri/ either claimed by a component or explicitly declined
  in that component's prose — and all THREE live-registry fixtures
  SHALL be reconciled in the same change (docs/CONVENTIONS.md,
  "declaring a component moves three fixtures").

## Implementation notes

Built by `claude-opus-5 @T-010` (executor only — size M, so verifier and
integrator are two other hands). Branch `task/T-010-indexer-rust`, base
`d46f71f`. Every figure below is measured at the tip named beside it;
main moved from `d46f71f` to `cd79f97` during the lane.

### THE ARGUED SET WAS FOUR AND THE TREE HAS FIVE

The card's problem statement enumerates four unclaimed `.rs` files, from
the 2026-08-16 triage. Re-derived on disk at `d46f71f` there are **FIVE**:
`src/acl_pin.rs`, `src/index_cmd.rs`, `src/bin/fake_agent.rs`,
`tests/agent_runner.rs` **and `src/churn.rs`**, which T-013 added on
2026-08-23, a week after that triage. `arch drift` confirms it
mechanically — `D2:unmapped files=5` before the settlement, `unmapped=0`
after. ARCHITECTURE's own "Note for T-010" paragraph carries the same
stale four. The repository wins.

**The settlement (ADR-004), argued in each component's own prose rather
than only here.** C-05 takes `acl_pin.rs`, `churn.rs` and `index_cmd.rs`:
the first pins `capabilities/**`, a path C-05 already claims; the other
two are the shell's own command bodies, and ARCHITECTURE calls the churn
source "C-05's Rust half" in as many words. C-14 takes
`src/bin/fake_agent.rs` and `tests/agent_runner.rs` — a component's test
double and its suite belong to the component they exercise, the rule that
already puts `app/test/**` under C-05. **Nothing is declined**: every
`.rs` under `app/src-tauri/` is now claimed by C-05, C-07, C-10 or C-14,
so the D2 bucket is drained rather than argued into existence, and the
dogfood's `unmappedFiles: []` assertion stays true instead of needing to
be relaxed.

### WHAT WAS BUILT

`Lang::for_extension("rs")` returns `Some(Lang::Rust)` and
`IndexOptions::default().languages` is `[Ts, Js, Rust]` — one switch,
because every caller in the tree constructs options with
`..Default::default()`.

`extract/rust.rs` is the sibling of `extract/ts.rs` on the same
`Extractor` contract: `fn` / `struct` / `enum` / `trait` / `impl` / `mod`
/ `macro` with export flags and 1-based inclusive ranges;
`const`/`static`/`type`/`union` fold into the EXISTING closed kind
vocabulary rather than opening four more. Two silences mirror the TS
side exactly and are named in the module header: an inline `mod x { … }`
is ONE `mod` symbol the way a TS namespace is one `const` symbol, and an
`impl` block is ONE `impl` symbol the way a class is one `class` symbol —
neither's members are extracted. `impl` symbols are named
`impl <Type>` / `impl <Trait> for <Type>`, whitespace-collapsed, because
an inherent impl named after its type would MERGE into the `struct`
symbol and the kind `impl` could then never be observed.

`resolve/rust.rs` is the part that is genuinely not the TS side. TS
resolves a specifier against the walked set by trying filename
candidates; Rust cannot, because a file's place in the tree is declared
somewhere else. So: manifests found by the `PackageIndex::nearest`
pattern, cargo's own target auto-discovery (`[lib]`/`[[bin]]` when
declared, plus `src/lib.rs`, `src/main.rs`, `src/bin/*.rs`,
`src/bin/*/main.rs`, `build.rs`, `tests/*.rs`, `tests/*/main.rs`,
examples, benches), a `mod` walk to a `module path -> file` map, and then
`use` paths by LONGEST MODULE PREFIX under six anchors — `crate::`,
`self::`, `super::`, the crate's own lib name, a 2018 uniform path, and
another workspace crate's ident.

**Three decisions inside that are worth the verifier's eye.**

1. **The TOML reader is hand-rolled and deliberately small** — table
   headers plus `key = "string"`, quote-aware enough not to cut a `#`
   inside a string, reading four keys and nothing else. Every shape it
   cannot parse (inline table, array, multi-line string, dotted key)
   answers NOTHING, and every caller falls back to cargo's own
   auto-discovery, which is what a manifest declaring nothing means
   anyway. A `toml` crate would have bought the remaining shapes at the
   cost of widening this crate's `=`-pinned supply-chain surface for a
   fallback that already exists. `shapes_the_reader_cannot_parse_answer_
   nothing_rather_than_wrongly` pins that, including the one honest
   wart: a `"""` opener reads as an empty string, so callers treat an
   empty package name as absent.
2. **`#[path]` and an ordinary `mod` have DIFFERENT bases**, and the
   Rust reference is explicit about it: `#[path]` is relative to the
   SOURCE FILE's directory, an ordinary `mod` to the MODULE's. Inside
   `src/host.rs` they are `src/` and `src/host/` — two different files.
   The fixture for this carries a DECOY at the wrong base, so the body
   discriminates instead of merely passing.
3. **Cargo package ids are `p:cargo:<crate>`, not `p:<crate>`.**
   `app/src/lib/architecture/graph.ts` ENFORCES `id === "p:" + name` and
   reports a duplicate id as a graph issue, so a crate and an npm
   package sharing a bare name would collide into one node and light
   `derived.issues`. The `node:fs` precedent is exactly this shape, and
   qualifying the name closes the class by construction rather than by a
   population anyone could enumerate.

**A path that resolves back to its own file carries NO edge.** `use
super::*` inside `#[cfg(test)] mod tests` is the ordinary case and a
self-edge says nothing. It is a resolution, not an `unresolved`.

**`unresolved[]` has two honest shapes and both are pinned WITH A
POSITIVE CONTROL**: a `super::` chain that climbs above the crate root,
and any crate-anchored path in a file sitting under no cargo target. The
fixture's `orphan/stray.rs` is the second — and the same file's
`std::fmt` resolving to a package node, and its `stray` symbol being
extracted, are the controls that make the refusal a refusal rather than
an absence.

### THE FIXTURE, AND WHY IT IS COMMITTED AS `_Cargo.toml`

`tests/fixtures/rust-workspace/` is a two-crate workspace with a virtual
root manifest, a lib whose `[lib] name` is NOT its package name, a bin, a
`src/bin/*` target with a neighbour module, a `build.rs`, a `tests/`
target with `tests/common/mod.rs`, a `#[path]` relocation, a `pub use`
re-export, a `.ts` file (so ONE walk produces
`languages: ["rust", "ts"]`) and the orphan above. Manifests are
committed as `_Cargo.toml` and renamed at materialization, joining
`_gitignore` / `_nputerignore` / `_node_modules` for the same stated
reason: a real `Cargo.toml` under this crate's own `tests/` is a manifest
cargo could stumble into, and a fixture must never be a build input.

`rust_workspace_carries_every_shape_the_criteria_name` sits BESIDE the
byte golden on purpose. `NPUTER_UPDATE_GOLDEN=1` moves both sides of a
byte golden at once — the poison hazard the drill bullet warns about, one
layer down — so the facts body pins what the bytes are supposed to
CARRY. The drill proves the pair is not one test twice: N28 (cargo
packages claim the npm ecosystem) reds both, N29 (every Rust range ends
one row late) reds the goldens and leaves the facts body green.

The `mixed` golden moved too, by one file: `native.rs` was sitting in
that fixture the whole time as a deliberately-not-collected input, and it
is now collected. That is the change demonstrating itself.

### CRITERION 5 IS PART BUILT AND PART ROUTED, AND THE FENCE RULING IS EXPLICIT

The unmapped half is BUILT: `arch drift` reports `unmapped=0` over the
regenerated graph, with every `.rs` claimed and the argument in each
component's prose.

The three-fixture half is ROUTED as `T-010-s2`, and here is the ruling
rather than a shrug. STATE's rule is *widen when the fence makes THIS
CARD'S OWN criterion unbuildable; route when it makes a NEIGHBOURING
defect unfixable*. This is the card's own criterion, which points at
widening — **but T-123 holds `[app-shell, app-agent]` LIVE**, and C-05's
`app/test/**` glob puts both app fixtures inside it. Widening there is
not a fence question, it is two live lanes on one fence, which is the
collision a fence exists to prevent. So the fence is NOT widened and the
reconciliation is routed with its exact derived set.

**And the third fixture is measured as NOT OWED rather than assumed.**
`lib/parser/test/smoke.test.ts` asserts the component ID LIST and C-06's
full record; T-010 adds no component id and does not touch C-06. It is
**263/263 at exit 0** on the branch. CONVENTIONS' *"declaring a component
moves three fixtures"* is about DECLARING a new component; widening an
existing one's `paths:` moves the two graph-derived fixtures only.

**`docs/architecture/graph.json` is deliberately NOT regenerated in this
lane.** It is outside the fence, and CONVENTIONS puts the regen at the
CHECKPOINT for exactly the reason that applies here: the checkpoint edits
the indexed fixture files, so a graph regenerated earlier is stale again
the moment they are reconciled. The consequence is stated rather than
hidden: **`index --check` exits 1 on this branch and is RIGHT to** — a
real red, not the `--root` false red, and it prints both counts and a
`+46` file list, which is how the two are told apart.

### THE FORECAST — regenerated, measured, then reverted to the base bytes

Measured at tip `7a88565` by running the regen, reading the numbers, and
restoring `docs/architecture/graph.json` to its base bytes (648863).

| | base `d46f71f` | fresh at `7a88565` |
|---|---|---|
| bytes | 648863 | **890843** (+241980) |
| files | 126 | **172** (+46, every one `.rs`) |
| symbols | 1126 | **1874** (+748) |
| edges | 1712 | **1842** (+130) |
| packages | 17 | **24** (+7 cargo) |
| `languages` | `["ts"]` | `["rust", "ts"]` |
| `unresolved` | 1 | 1 (the same TS `./index.css` asset) |

**Not one Rust `use` in this repository is unresolved**, which is the
strongest single statement about the resolver, and the reason the
criterion's `unresolved[]` behaviour is pinned on the fixture and in
units instead.

Per component: C-05 59→**65**, C-06 25, **C-07 0→32** (its D3 clears —
T-033's card predicted exactly this), C-08 10, C-09 3, C-10 2→**3**,
C-11 0, C-12 18, C-13 8, C-14 1→**8**, C-15 0; 172 total. Findings go
from 10 undeclared / 1 unmapped / 3 declared-only to **11 / 0 / 3**: the
new one is `D1:C-05->C-07` (`T-010-s4`), and `D1:C-05->C-14` goes 7→8
file edges with two of them Rust.

**THE SIZE IS THE FINDING (`T-010-s3`) AND IT IS NOT BLOCKING.** 890843
bytes is **89.1% of `max_graph_bytes`** (1 000 000) and **84.9% of the
docs collector's 1 MiB per-file cap**. Nothing truncates —
`truncated_symbols` and `truncated_files` are both absent — and the
budget's FLOOR, every symbol array emptied with dependent `s:` edges
dropped, is **186883 bytes**, so the cap the map data rides cannot be
crossed while the budget stands. The headroom, not the size, is the thing
nothing reports.

### WHAT WAS DELIBERATELY NOT BUILT

No `call` and no `type_ref` candidates for Rust (`T-010-s6`). The
criteria name symbols, module-tree file edges, package nodes, re-exports
and `unresolved[]`; call graphs are a different product and would spend
the headroom above. Named in `resolve/rust.rs`'s header, not left silent.

### THE POISON DRILL — 34 mutants, 34 red, and the second question asked

Arm (c): a DETACHED scratch worktree at a named commit with its own
`CARGO_TARGET_DIR` **inside itself**, named `drill-T-010` rather than the
shared literal (`T-088-s3`) — and that naming earned its keep on the
night: `git worktree list` showed a sibling session's `drill-T-123-verify`
in the SAME scratch directory, which a shared `drill` path would have
collided with. Baseline 146 lib + 9 golden = **155, exit 0**. Every
mutation was applied by a driver that REFUSES a path outside the drill
and requires a match count of exactly **1**, **one side only — always the
`src/` producer, never an assertion** — with the mutated TEXT read back
via `git diff --unified=0` BEFORE its suite ran.

Round 1 at `8a4ab61`: 29 mutants, all red. Round 2 at `7a88565`: 4, all
red. One more (N33), red. **The parent worktree's `target/` mtime was
byte-identical before and after every round** — arm (c) doing its job.

**AND THE DRILL FOUND TWO THINGS ITS FIRST QUESTION CANNOT SEE.** The
shape-six pass (does any OTHER test already drive this exact call?) found
`module_declarations_survive_the_record_round_trip` redding under poison
while killing **no mutant `mod_declarations_record_inline_nesting_and_
the_path_attribute` did not already kill** — shape six exactly. It is now
`an_inline_nested_module_is_a_real_branch_of_the_tree`, a RESOLUTION body
with a decoy file, and N30 (the tree builder drops the inline prefix)
reds it ALONE. Separately, the merge fixture carried `pub impl_marker!();`
— not legal Rust — so the error-recovery mutant redded two bodies and the
two could not be told apart; with that corrected, N14b reds exactly one.

Shape six is answered for every new and changed body. **17 bodies are the
sole casualty of some mutant** after round 1, and rounds 2–3 added four
more separations: N14b (`a_syntax_error_still_extracts…`), N30
(`an_inline_nested_module…`), N31 (`languages_option_limits_collection`,
separated from the extension map) and N33
(`lang_extension_allowlist_is_exact`, separated by case-folding).
**ONE body cannot be separated and it is stated rather than papered
over**: `parse::grammars_load_and_parse_including_error_recovery`'s Rust
half dies with every Rust body, because every Rust body depends on the
grammar loading. It is not a duplicate — nothing else asserts the root
node's kind — but no producer mutation can red it alone, and that is a
property of the dependency, not of the assertion.

Restoration was proved THREE ways after every mutant and at the end of
each round: an EMPTY tracked `git diff` against the drill's own commit, a
**sha256 per touched path** against `git show HEAD:<path>`, and a clean
re-run. The only untracked entry at the end was `.drilltarget/`, which
arm (c) requires to be inside the worktree. Worktree removed and pruned.

### DETERMINISM AND VOLATILE-FIELD FREEDOM (ADR-014)

`fixtures_index_identically_twice`, `cold_and_warm_cache_yield_identical_
bytes`, `different_materialization_paths_yield_identical_bytes` and
`live_repo_indexes_deterministically` all cover the new fixture and the
Rust-bearing tree; every one green. Nothing Rust-side reads a clock, an
absolute path or an environment variable: manifests are read through the
same contained reader, and the only ordering that could have been
directory-dependent — which crate root wins a tie for a file that belongs
to several — is a `BTreeSet` of root paths, sorted, so it is a function
of the tree.

**The cache needed no schema bump and the reason is structural.**
`ExtractRecord` gains `mods`, but a cache written before T-010 cannot
hold a `.rs` entry, because `.rs` was not a walked extension; the field is
`#[serde(default, skip_serializing_if = "Vec::is_empty")]`, so a TS entry
round-trips byte-identically.

### WHERE THE BRIEF WAS WRONG

- **BOOT GATE is OWED, not "not owed".** The brief said the fence cannot
  produce `app/src-tauri/src/**` or `app/src/**`. The trigger CONVENTIONS
  states is `app/src-tauri/**` — and `crate-index` is
  `app/src-tauri/crates/nputer-index/**`, which matches. It was run:
  `NPUTER_BOOT_PORT=14979 npm run boot:check` **exit 0**, both `[nputer]`
  lines observed.
- **The unmapped set is FIVE, not four** — see the first section.
- **The base's `d46f71f` figures are right and STATE's live-lane list is
  not**: the brief lists four live lanes; T-015 was returned to `planned`
  at `cd79f97` and its worktree is gone, so three are live at hand-off.
- The brief's "1126 symbols / 1712 edges / 648863 bytes / 126 files"
  re-derived exactly at the base.

## Verdicts
