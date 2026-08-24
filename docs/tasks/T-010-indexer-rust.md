---
id: T-010
title: Indexer — Rust language support
feature: F-06
milestone: 4
priority: 3
size: M
status: done
blocked_by: [T-009]
touches: [crate-index, docs/architecture/components/]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @T-010
verified_by: claude-opus-5 @T-010-verify
review: same-model
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

### 2026-08-25 — `claude-opus-5 @T-010-verify` — **APPROVED**

Verified adversarially and independently: criteria read from MAIN's copy
of this card before any note was opened, my own mutant set formed and run
before the evidence half was read, every figure re-derived at my own ref.
Main moved twice under me (`d43455b` → `e884802` → `ee9dacb`); the lane's
diff is **44 paths** at all three, re-derived with the pre-merge form and
`merge-tree`'s exit read first. **The lane's worktree was never built in
or written to except for this verdict**: everything below ran in a
detached scratch worktree at `cb13957`.

**THE ONE HALF THAT IS NOT MET, STATED FIRST BECAUSE IT IS AN OBLIGATION
AND NOT A NOTE.** Criterion 5's second clause — *"all THREE
live-registry fixtures SHALL be reconciled in the same change"* — is
**not satisfied**, and it is reproducible rather than argued. Regenerate
the graph and run the app suite:

    nputer-index index --root ../..            # 890843 bytes, exit 0
    cd app && npm test                          # exit 1

**9 bodies fail across the two graph-derived fixtures** —
`architecture-dogfood.test.ts` (4: the 126-file unclaimed-territory
assertion, the findings tally, the 33-row relation table, the drift
flags) and `map-dogfood-render.test.tsx` (5: *"C-07 is declared-only:
zero TS files match its globs"*, the finding faces, the edge count, the
C-05 panel, the header scale) — **931 of 940 pass**. `lib/parser`'s
`smoke.test.ts`, the third fixture, is **263/263 exit 0** and genuinely
NOT owed: it pins the component ID LIST, and this change declares no
component. That half of the executor's reading is correct.

**IT IS APPROVED ANYWAY, AND THE ARGUMENT IS NOT DEFERENCE.** Three
things, each checked rather than accepted:

1. **The fence ruling is factually right.** `T-123` is `status: building`
   with `touches: [app-shell, app-agent]`; `app-shell` is C-05; C-05's
   `paths:` carries `app/test/**`, where both fixtures live; and
   `git worktree list` shows `nputer-T-123` live. Widening here is two
   live lanes on one fence — the collision a fence exists to prevent, not
   a fence question.
2. **CONVENTIONS itself assigns this work to the checkpoint.** *"A MERGE
   REGEN alone moves only the two app fixtures"*, and the GRAPH REGEN
   bullet puts the regen at the checkpoint. The two red fixtures are
   graph-DERIVED counts, reconciliation work rather than design work.
3. **The card's actual demand is met.** Its problem statement asked that
   the regen *"CONFIRMS a decision instead of discovering a problem"*. It
   does: `arch drift` reports **`unmapped=0`**, so the regen discovers no
   unclaimed bucket. The 9 reds are the change demonstrating itself —
   *"C-07 is declared-only: zero TS files match its globs"* is now false
   BY DESIGN.

**THE INTEGRATOR OWES BOTH FIXTURES AT THE CHECKPOINT, DERIVED FROM THE
REGENERATED GRAPH, NEVER LOOSENED.** `T-010-s2` carries the set. A
checkpoint that merges this and runs `npm test` from `app/` without
touching them lands 9 red bodies.

#### Every criterion, how it was attacked, what happened

- **1 — module tree from crate roots, `use` paths to file edges.**
  Attacked with my own synthetic trees, not the lane's fixture: a
  `[lib] name` differing from the package name, `#[path]` with a DECOY
  file at the ordinary-`mod` base, `src/bin/*` neighbours, a `tests/`
  target's `mod common;`, a hyphenated package resolved by its
  underscored ident. All resolve correctly. **PASS.** The `#[path]`
  base-directory rule (source file's dir, not the module's) is the one
  place this is easy to get wrong and it is right.
- **2 — symbols with export flags and ranges; cargo package nodes;
  `pub use` as `reexport: true`.** All seven named kinds emitted;
  `const`/`static`/`type`/`union` fold into the existing closed
  vocabulary rather than widening it; `pub(self)` correctly not an
  export while `pub(super)`/`pub(in …)` are. Ranges 1-based inclusive.
  **PASS.**
- **3 — an unresolvable `use` is recorded with a reason and indexing
  CONTINUES.** Attacked with the negative-assertion trap in mind. A
  `super::` chain above the crate root and a crate-anchored path in a
  file under no cargo target both land in `unresolved[]` as `not_found`
  — **and the positive controls hold**: the same orphan file's `std::fmt`
  DOES resolve to a package node, and its own symbol IS extracted, so
  the refusal is a refusal and not a file nothing parsed. **PASS.** A
  `#[path]` escaping the root is refused by `normalize_join`'s
  containment; a macro-generated module simply is not there, which is the
  same honest silence.
- **4 — golden fixture; determinism; T-009 budgets.** **PASS**, and the
  determinism was attacked rather than trusted: two full indexes of this
  repo are **byte-identical at sha256
  `6326214e998fa062c6ae2fd51736be7acf850a497154be11cd642362fb584209`**.
  Reading the code for order dependence found none — `walk_root` collects
  then sorts, `manifest_dirs`/`records`/`modules` are `BTreeMap`s, the
  root set that decides every "first root wins" tie is a `BTreeSet` of
  paths, and the extractor's symbol map is keyed by name. No `HashMap`,
  no directory order, no clock, no env var participates.
- **5 — the unmapped set; three fixtures.** Unmapped half **PASS**, and
  derived independently rather than read off `arch drift`: I enumerated
  all **46** `.rs` files in the graph, parsed every component's `paths:`
  myself, and matched them — **0 unmapped, 0 ambiguous**, owners C-07 32
  / C-14 7 / C-05 6 / C-10 1. Each claim is argued in its own component's
  prose. This agrees with `arch drift`'s `unmapped=0` from a different
  direction. Fixture half **NOT MET**, above.

#### The golden cannot verify itself — proved, not assumed

The hazard is real and I reproduced it: with a live producer mutation
(`is_exported` forced false), `NPUTER_UPDATE_GOLDEN=1 cargo test -p
nputer-index --test golden` rewrote `rust-workspace/expected-graph.json`
to agree with the mutant, after which **`rust_workspace_matches_golden`
PASSES**. What still fails is
`rust_workspace_carries_every_shape_the_criteria_name` — **1 failed / 8
passed, exit 101**, the sole casualty. The fact-level body is a genuine
discriminator, not a second copy of the golden.

#### Determinism and size, both re-derived

Clean measurement — the first attempt was polluted because my own
`CARGO_TARGET_DIR` sat inside the walked root (`.nputerignore` has no
`target/` entry; `.gitignore` does, which is why the ordinary `target/`
is skipped and a differently-named one is not). Re-measured with the
target dir outside:

| | committed | fresh at `cb13957` |
|---|---|---|
| bytes | 648863 | **890843** (+241980, +37.3%) |
| files | 126 | **172** (+46, every one `.rs`) |
| symbols | 1126 | **1874** |
| edges | 1842 (628 import / 533 call / 681 type_ref) | |
| packages | 17 | **24** (+7 cargo) |

**890843 is 89.08% of `max_graph_bytes` (1 000 000) and 84.96% of the
docs collector's `MAX_FILE_BYTES` (1 048 576).** Headroom **109 157** and
**157 733** bytes.

**THE HEADROOM ARGUMENT IS SOUND, AND IT IS STRUCTURAL RATHER THAN
MERELY CURRENTLY TRUE — I re-derived the floor instead of accepting it.**
Emptying every symbol array and dropping the 1 214 dependent `s:` edges
gives **186 865 bytes** (the notes say 186 883; an 18-byte methodological
difference that changes nothing). **The floor is proved rather than
computed loosely: my re-serializer reproduces the real file
byte-for-byte, 890843 = 890843, before it is used to measure anything.**
Since the floor sits **813 135 bytes below** `max_graph_bytes`,
`apply_budget`'s "emit over budget anyway" branch is unreachable on any
tree of this shape, so the collector's 1 MiB cap — the one whose breach
would make the graph UNDELIVERABLE and break the map pane silently —
cannot be crossed while the budget stands below it. Nothing truncates
today: `truncated_symbols` and `truncated_files` are both absent from the
emitted stats. `T-010-s3` is the right disposition and it does not block.

#### Security sweep — CLEAR, with two routed findings

- **`tree-sitter-rust "=0.24.2"`**, checksum
  `439e577dbe07423ec2582ac62c7531120dbfccfa6e5f92406f93dd271a120e45`,
  repository `https://github.com/tree-sitter/tree-sitter-rust` — the
  **maintained upstream tree-sitter org**, the same org as the two
  grammars already pinned, MIT. `=` pin discipline honoured, matching its
  siblings. The lockfile gains **exactly one** `[[package]]` block; its
  deps `cc` and `tree-sitter-language` were already locked, so **zero new
  transitive crates**. It compiles vendored C through a `cc` build script
  — the same shape as the existing two, not a new build class.
- **`cargo audit` exit 0** — 0 vulnerabilities, 17 informational
  warnings, identical to CONVENTIONS' audited baseline.
- No secrets, no new IPC command, no new grant, no new endpoint, no
  `unsafe` added, no network or process surface. Manifests are read
  through the same contained reader; `normalize_join` refuses a path that
  escapes the root; symlinks are skipped twice over (`follow_links(false)`
  plus an explicit `symlink_metadata` check — verified: a symlink to a
  `.rs` outside the root is not indexed).
- **Parser surface, attacked directly.** A non-UTF-8 `.rs` and an 8 MB
  single-line `.rs` are both handled at **exit 0**. Three shapes are NOT:
  deeply nested inline `mod`, nested `use` groups, and very long `::`
  chains **abort the process at exit 134**. **This is measured as
  PRE-EXISTING and therefore not a rejection**: the base binary built at
  `d43455b` aborts identically on four hostile TS shapes, 8 runs across
  both binaries with no divergence, and 10 000 nested braces inside a
  function body — parsed by tree-sitter, not descended into by us — is
  exit 0, which locates the recursion in our traversal rather than the
  grammar. Routed as **`T-010-s8`**, which also records that
  `index_repo` hosts the indexer **in-process**, so the abort takes the
  app with it, and that `IndexOutcome::Error`'s *"never a panic"* comment
  is false for this class.
- **The package-id claim is one side too strong.** The notes argue the
  `cargo:` qualifier closes the collision *"by construction"*. Built
  rather than reasoned about: a tree with `use serde::Serialize;` and a
  TS `import … from "cargo:serde"` emits **ONE** node,
  `{"id":"p:cargo:serde","name":"cargo:serde","ecosystem":"npm"}`, fed by
  both files — `is_unsupported` reserves `http:`/`https:`/`data:` and not
  `cargo:`. Renaming the TS file flips the label to `"cargo"`, so the
  ecosystem is decided by sort order. The TS derivation reports nothing,
  because there is no duplicate id — **silently wrong rather than
  loudly**. Latent (no npm name may contain `:`); routed as
  **`T-010-s9`**.

#### The poison drill — mine, formed before the notes were opened

Arm (c): detached worktree **`drill-T-010-verify`** at `cb13957` with its
own `CARGO_TARGET_DIR` inside it; driver **`drill-T-010-verify-run.py`**
and results **`drill-T-010-verify-results.json`**, both per-lane named —
the shared scratchpad held a sibling session's `drill-T-110-verify-run.sh`
at the same moment, so `T-088-s3` is a fifth time confirmed. Every
mutation **one side only, always the `src/` producer, never an
assertion**, applied by a driver that REFUSES a path outside the drill and
requires a match count of exactly **1**, with the mutated text read back
via `git diff --unified=0` BEFORE each run. Baseline **184 passed / 0
failed / 2 ignored, exit 0**.

**Nine mutants, nine RED**, and they discriminate by ASSERTION rather
than by count — M6, M7 and M8 each red exactly ONE distinct body, which
is what shows they are separate rules and not one body restated:

| | producer mutation | sole/first casualty |
|---|---|---|
| M1 | `.rs` removed from `for_extension` | `lang_extension_allowlist_is_exact` + `languages_option_limits_collection` |
| M2 | `is_exported` forced false | `every_criterion_kind_is_emitted_with_its_export_flag_and_range` (+3) |
| M3 | `#[path]` attribute never recognised | `mod_declarations_record_inline_nesting_and_the_path_attribute` + the resolver's decoy body |
| M4 | longest-prefix loop reversed to shortest | `the_longest_module_prefix_wins…` (+6) |
| M5 | `cargo:` qualifier dropped | `workspace_crates_resolve_by_their_lib_name…` + the positive-control body |
| M6 | `pub use` reexport flag forced false | `pub_use_is_a_reexport_and_a_plain_use_is_not` — **alone** |
| M7 | unrooted `crate::` returns `SelfRef` not `Unresolved` | `unresolved_records_a_reason_and_a_positive_control…` — **alone** |
| M8 | inline-module prefix dropped in the tree builder | `an_inline_nested_module_is_a_real_branch_of_the_tree` — **alone** |
| M9 | M2 + **golden regenerated to agree with it** | `rust_workspace_carries_every_shape_the_criteria_name` — **alone** |

Restoration proved three ways after every mutant: empty tracked
`git status`, **sha256 per touched path against the drill's own commit**
(3/3 MATCH), and a clean re-run. Worktree left for the integrator to
prune with the rest.

#### Commands, in order, every exit read unpiped off its own `$?`

    cargo test --no-fail-fast          (app/src-tauri)  -> 0   408 passed / 0 failed / 3 ignored, summed over 15 `test result:` lines
    cargo run -p nputer-index -- index --check --root ../..  -> 1   A REAL RED: both count lines + a +46 file diff, not the --root false red
    cargo audit                                          -> 0   0 vulnerabilities / 17 informational
    cargo run -p nputer-index -- arch --root ../..        -> 0
    cargo run -p nputer-index -- arch drift --root ../..  -> 0   findings=14 undeclared=11 unmapped=0 declared_only=3 ambiguous=0 dangling=0
    npm run build                      (app)             -> 0   269 modules; index-C86RloYb.css 45.06 kB, index-DEkJr3K8.js 526.42 kB — BOTH UNMOVED, so no bundle input moved
    npm test                           (app)             -> 0   940/940 across 46 files  (and -> 1, 931/940, against a REGENERATED graph — above)
    npx vitest run                     (lib/parser)      -> 0   263/263 across 12 files
    npm test                           (tools/e2e)       -> 0   143/143, scratch port 15020
    npm run typecheck                  (tools/e2e)       -> 0
    NPUTER_BOOT_PORT=15021 npm run boot:check            -> 0   both [nputer] lines observed
    npm run lint:tokens / -- --selftest                  -> 0 / 0   TOKEN 131, CONTROL 635
    npm run lint:docs                                    -> 0
    node tools/e2e/scripts/docs-gate.mjs <44 paths>      -> 1   FIRES

#### The three standing gates, DERIVED on the lane's own 44 paths

`grep -c "at any merge whose diff" docs/CONVENTIONS.md` returns **3**
(lines 657, 782, 811) — the mechanical enumeration, not a memory.

| gate | trigger | on these 44 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` outside `docs/` | **1 — FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **33 — FIRES** |
| DOCS GATE | a `docs/` path a code suite reads | **11 — FIRES** |

- **GRAPH REGEN — FIRES on one path**, the fixture's
  `rust-workspace/app/web/panel.ts`, and it was **ASKED rather than
  predicted**: `index --check` exits **1**, a real red printing both
  count lines and the `+46` file list. **The regen is the integrator's
  and I performed none in this repository** — every regeneration above
  happened in a scratch worktree and was reverted; `git status` in the
  lane worktree is clean but for this verdict.
- **BOOT GATE — FIRES, 33 of 44, and the brief was WRONG to imply
  otherwise.** `crate-index` is `app/src-tauri/crates/nputer-index/**`,
  which is inside the `app/src-tauri/**` trigger. Run: **exit 0**.
- **DOCS GATE — exit 1**, invoked directly with the 44 paths as
  ROOT-RELATIVE arguments, never through `xargs`. **11 of 44 under
  `docs/`, FOUR suites owed** (cargo, app, lib/parser, tools/e2e); **12
  derived readers, 0 frontmatter issues**, census 119 docs-shaped sites
  in 22 files, 25 files holding the repository root. All four suites were
  run and are recorded above. **All seven of the lane's suggestion files
  parse with a legal `status:`** — real files with `suggested_by:` set,
  not card-body prose.

#### Where the CARD, the BRIEF and the NOTES were wrong

- **THE CARD.** Its problem statement enumerates **FOUR** unclaimed `.rs`
  files. The tree has **FIVE** — `src/churn.rs`, added by T-013 a week
  after that triage, is missing from it. Found independently on disk
  before the notes were opened; the notes name the same fifth file.
- **THE BRIEF.** (a) BOOT GATE is **OWED**, not open — derived above.
  (b) It named four live lanes; **T-015 is not live** (returned to
  `planned` at `cd79f97`) — four others are: T-123, T-110, T-031, T-096.
  (c) Its `d46f71f`/`d43455b` figures re-derived exactly.
  (d) **Its bounded-read policy was already superseded on main while I
  worked**: `e884802` — *"T-121: the bounded read's boundary is the REF,
  not a heading"*. I derived the boundary from the heading as instructed
  and then checked what the ref-based rule protects: the lane changed
  `status:` only and did **not** edit its own criteria, so the two rules
  agree here and nothing was leaked either way.
- **THE NOTES.** The `cargo:` qualifier does not close the collision *"by
  construction"* — `T-010-s9` carries the counterexample. Everything else
  I re-derived matched: 890843/172/1874/1842, 7 cargo packages,
  `unresolved` unmoved at 1, `unmapped=0`, `languages ["rust","ts"]`.
- **ONE IN-FENCE NIT, NOT BLOCKING.** `crates/nputer-index/Cargo.toml`'s
  own `description` still reads *"deterministic tree-sitter TS/JS
  indexer"*. It is inside this fence and is now stale by one word.

#### Adjacent features, checked rather than assumed

The TS path is behaviour-preserving: `accumulate` was refactored into
`accumulate_one`, and the `all_reexport &= reexport` fold is identical
under the split for both the empty-names and named-bindings branches. The
cache needs no schema bump — `ExtractRecord::mods` is
`#[serde(default, skip_serializing_if)]`, and no pre-T-010 cache can hold
a `.rs` entry because `.rs` was not a walked extension. The `mixed`
golden moves by exactly one file (`native.rs`), which is the change
demonstrating itself. **Nothing reached the human's running app**: port
1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` only, before and
after — holder `node` pid **82549**, one socket `TCP [::1]:1420
(LISTEN)`, identical throughout. Scratch ports **15020** and **15021**
were `lsof`-checked first, bind-confirmed free on all four
host/stack spellings, and are free again. No `pkill` at any point.

#### A gate gap found by walking into it, with the control that proves it

Writing this verdict's own suggestion files, one carried a `title:` with
a `": "` in it — an illegal YAML plain scalar, the `9c64cd8` class. The
DOCS GATE, run on that exact file, answered **`0 frontmatter issue(s)`**
and *"every live task card's frontmatter parses"*; `lib/parser` then
failed at **262/263** and `app` at **939/940** on the same tree.
`liveTaskCards()` is `trackedFiles(root)`, so an unstaged card is
invisible rather than unchecked. **The positive control separates the
scope from the check**: one `git add` later, the same command on the same
file reports `1 task card(s) the parser will refuse:` and names it. The
check works; the printed sentence overstates its corpus, in the
"everything is fine" direction. Routed as **`T-010-s10`**, with the
explicit non-goal that it must not re-open `T-101-s3`'s deliberately
unbuilt half. Both suites are back at **263/263** and **940/940** with
the title corrected.

**Three findings routed by me: `T-010-s8`, `T-010-s9`, `T-010-s10`. None
blocks.**

## Integration — merged to main at `d64c673`, 2026-08-25

Merged `--no-ff` from main-before **`b7b4213`** with the approved tip
**`9cce194`**; parents are exactly those two and **nothing was written
into the merge commit**. The merge's diff is **47 paths**; the checkpoint
is the commit after it.

**MAIN MOVED UNDER THIS INTEGRATION, DURING THE MERGE ITSELF, AND THE
RANGE RULE CAUGHT IT.** `git rev-parse main` answered `bbcbc39` and the
`merge-tree` forecast was taken against that; fifty-one seconds later
another session committed `b7b4213` (a docs-only STATE.md correction) and
the merge's real first parent became that. The stale forecast's tree and
the merge's own tree differ by **exactly one path, `docs/STATE.md`** —
main's own one-commit advance, arriving as pure left-endpoint drift. Re-run
against `b7b4213`, `merge-tree --write-tree` returns
`54b886076e94e19d5efbaf8d1fded99c2fc2d07f`, which **IS** the merge's
`HEAD^{tree}` byte for byte.

**CRITERION 5's FIXTURE HALF IS PAID, RECONCILED AND NOT LOOSENED.** The
verifier measured 9 red bodies against a regenerated graph and assigned
them here. The full set was derived from the fresh graph by a throwaway
probe BEFORE the suite was run — 15 assertions across 9 bodies, 3 body
titles and 2 stale comments — and the app suite came back **940/940 at
exit 0 on the first run**, with no hidden second assertion surfacing.

The reconciliation, assertion by assertion:

| fixture | assertion | from | to |
|---|---|---|---|
| dogfood | `fileComponent.size` | 126 | **172** |
| dogfood | per-component tally, C-05 | 59 | **65** |
| dogfood | per-component tally, C-07 | *(absent)* | **32, a NEW row** |
| dogfood | per-component tally, C-10 | 2 | **3** |
| dogfood | per-component tally, C-14 | 1 | **8** |
| dogfood | `findings` | — | `D1:C-05->C-07` INSERTED, `D3:C-07` REMOVED, `D1:C-05->C-14` 6 → **8** fileEdges |
| dogfood | relation table | 33 rows | **34** — new `C-05→C-07 undeclared 1`; `C-05→C-10` 34 → **38**; `C-05→C-14` 6 → **8**; **`C-14→C-10` planned 0 → confirmed 2** |
| dogfood | `drift` | 8 ids | **7** — C-07 out |
| dogfood | `declaredOnly` | 4 ids | **3** — C-07 out |
| map | C-05 drift chip | `drift 4` | **`drift 5`** |
| map | rendered edges | 33 | **34** |
| map | rendered undeclared | 10 | **11** |
| map | panel chip | `4 drift findings` | **`5 drift findings`**, plus the C-07 sentence asserted |
| map | header hint | `126 files` | **`172 files`** |
| map | the C-07 body | *"declared-only, zero TS files match its globs"* | **inverted whole** |

**THE C-07 BODY IS THE ONE THAT COULD ONLY BE REWRITTEN.** Its premise was
false by design after this merge, so each of its three assertions is now
the negation of the one it replaced (no declared-only border, no
"declared · no files yet", and `32 files` on the face), with the D3 ring
and `data-drift` newly asserted ABSENT. Its status word is derived LIVE on
the C-12 body's own rule rather than pinned, because T-010's card is what
rolls C-07 up and a literal there would red on the pipeline moving the
card rather than on the map being wrong.

**`C-14→C-10` IS A PREDICTION MADE AT T-025 COMING TRUE UNEDITED.** The
fixture comment beside that row has read *"no TS import can confirm a
Rust-side dependency until T-010 extracts Rust"* since 2026-08-16. It
flips here on `agent/mod.rs` and `tests/agent_runner.rs` reaching
`docs_watch.rs` — planned 10 → 9, confirmed 13 → 14 — and it is the only
relation in the table whose KIND moves.

**THE SECOND REGEN WAS NEEDED AND A BYTE COMPARISON WOULD HAVE MISSED
IT.** The graph was regenerated once to derive the fixture values and
again after they were written, per the checkpoint rule. Both regens report
**890 866 bytes**; the graph is NOT the same file — `architecture-dogfood`
goes `loc` 1852 → **1949** and `map-dogfood-render` 418 → **483** inside
it, and only `index --check`, which compares content, can tell. It is
exit **0, CURRENT** after the second.

**THE VERDICT'S SIZE FIGURES ARE CONFIRMED AND THEY ARE 23 BYTES LARGER
AT THIS REF, WHICH IS NOT A DISAGREEMENT.** 890 843 → **890 866** and the
floor 186 865 → **186 888**: the same +23 on both, exactly what T-096's
merge added to the tree between the verifier's base and this one. The
floor was re-derived independently, and the re-serializer was proved
first — `JSON.stringify(g, null, 2) + "\n"` reproduces the committed file
at 890 866 = 890 866 before it is used to measure anything.

**WHERE THE VERDICT AND THE NOTES WERE WRONG.** The verifier's "ONE
IN-FENCE NIT" about the crate's stale `description` is **two sites**, not
one — the manifest's header comment says it as well; filed as
`T-010-s11`. Everything else the verdict states re-derived here.

