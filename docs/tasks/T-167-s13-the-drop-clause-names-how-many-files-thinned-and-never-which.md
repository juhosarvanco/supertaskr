---
id: T-167-s13
title: The drop clause names HOW MANY files the emitter thinned and never WHICH — apply_budget discards the only record of that, so the one actionable half of a truncation report cannot be printed
feature: F-06
milestone: 4
priority: 4
size: S
status: verifying
suggested_by: executor claude-opus-5@subagent @T-167-s5
blocked_by: []
touches: [crate-index]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**FOUND WHILE BUILDING T-167-s5, AND DELIBERATELY NOT BUILT THERE.**
That card asked the alarm block to print the drop "and ideally which
files thinned". The count was built and pinned; the LIST was not, and
the reason is a signature rather than an oversight — which is the
distinction `T-196` and `T-208` established for this family.

`emit::apply_budget` accumulates the set it empties in a local
`all_dropped: BTreeSet<String>` and returns only `Graph`. The set is
dropped on return, and **it is not recoverable from the emitted
document**: a file whose `symbols` array was emptied by the budget is
byte-for-byte indistinguishable from a file that never had symbols. So
`stats.truncated_files` — a COUNT — is the last surviving trace of
which files were thinned, and a count cannot name them.

**THE UNIT IS THE POINT, AND T-167-s5 PINNED IT.** That lane's clause
prints `truncated_files` and says in the printed line that the unit is
FILES whose array was emptied, never symbols. This card does not move
that; it asks for the half a reader can act on. A count tells a lane
the map is lying; the list tells it *where*, which is the difference
between "regenerate and hope" and "these four files have no symbol
panel in the map today".

## Why it is a separate card

The change is to the EMITTER's signature or to `Graph`, not to a render
clause — `apply_budget` would have to return its dropped set (or record
it in `stats` as a list beside the count), and `CheckReport` would carry
it through to `check::drop_clause`. That is a different blast radius
from T-167-s5's, which stayed entirely inside `check.rs`'s own render
path, and it lands in the same file the schema is pinned on.

**AND THE SCHEMA IS THE REAL QUESTION.** `Stats` is under ADR-014's
content-determined rule and every optional member is omitted when
0/false. A list of paths in `stats` is a new schema member with a size
that grows with the truncation — on a badly truncated graph it is a
list of hundreds of paths inside the very document whose size caused
the truncation, which is a feedback loop worth deciding deliberately
rather than discovering. The cheaper shape may be to leave the schema
alone and return the set from `apply_budget` to `check` only, so the
list is printed by the gate and never committed.

## Acceptance criteria

- WHERE the fresh emit thinned any file, THE alarm block SHALL name
  WHICH files, bounded the way `check::MAX_LINES` already bounds every
  other delta list in this report ("... and N more").
- THE list SHALL be the emitter's own record of what IT emptied, never
  a re-derivation from empty `symbols` arrays — a file that legitimately
  has no symbols must never appear in it, and a fixture containing one
  is the control that decides it.
- WHERE the schema gains a member, THE decision SHALL be recorded
  against ADR-014's content-determined rule, including what the member
  costs on an already-truncated document.
- THE change SHALL NOT move `check::drop_clause`'s COUNT or its printed
  unit — `T-167-s5` pinned both, and the list is an addition beside
  them rather than a replacement for them.

## TRIAGE, 2026-09-02 — DISPOSITION IS PROMOTE, AND IT IS NOT APPLIED

Triaged at the architect seat at 1cd2c8d. The stamp stays `suggested` for
T-225's reason and no other: `brief.mjs --dispatch` printed 60,040 bytes
at 85dda6d against the 65,536-byte loss point, a promotion costs about
645 bytes, and the in-flight sections of the wave dispatched tonight
spend the rest. T-225 is dispatched as soon as T-216-s4 lands; when
T-225 lands, promote this card without re-triaging it. Read this as a
tool limit, never as a verdict on the finding.

**Holds**; F-06 p4 `[crate-index]`; `review: independent` set, because
the drop clause is the gate's own report.

**APPLIED, 2026-09-02, at the stamp of T-225's merge (7435eae):** the
byte ceiling that held this promotion no longer binds — `brief.mjs
--dispatch` answers what can START and `--full` is the triage view — so
the disposition above is now the stamp: `status: planned`.

## Implementation notes (executor, 2026-09-09)

Built in lane `task/T-167-s13-drop-clause-names-which`, worktree
`/Users/ujju/Projects/nputer-T-167-s13`, base
`098cfe10a9e94fadf56122b77597df8e64a7f58f`. Two commits:
`e4c818b` (the change) and `86ce9f1` (a killer for the one guard the
drill found unreachable).

**WHAT LANDED.** `emit::apply_budget` now returns
`(Graph, BTreeSet<String>)` — the set it emptied, the same fact
`stats.truncated_files` counts. `crate::index_with_drops` (new,
`pub(crate)`) carries that set beside the graph; `index`'s PUBLIC
signature did not move, so `cli`, `watch`, the goldens and every
integration test are untouched by construction.
`CheckReport::fresh_truncated_paths` holds it and `check::drop_clause`
prints a `WHICH FILES` list beneath the counted sentence. The record
reaches no file: `graph.json` gains nothing.

**CRITERION 1 — the alarm block names WHICH files, bounded by
`check::MAX_LINES`.** MET. The block now ends:

```
[supertaskr-index] !! WHICH FILES - the emitter's own record of the arrays IT emptied, never a
[supertaskr-index] !! re-derivation from empty symbols arrays (a file that has none of its own is
[supertaskr-index] !! indistinguishable in the document and never appears here):
[supertaskr-index] !!   | - src/fat.ts
```

The bound is FACTORED rather than copied: `check::bounded` is the one
implementation of `MAX_LINES` + `"... and N more"`, and `emit_lines`
(the delta lists) now spends it too. A second `take(MAX_LINES)` would
have been one rule with two implementations, which is the defect
`emit::floor_len` already exists to avoid in this crate. Evidence:
`the_named_list_is_bounded_by_max_lines_like_every_other_delta_list`
drives 25 dropped files and requires 20 printed, `... and 5 more`, the
head in the record's own sorted order, and the COUNT still whole at 25
— the one place a bounded list could quietly become a smaller claim.

**CRITERION 2 — the emitter's own record, never a re-derivation.** MET,
and this is the criterion the drill was built around. Evidence:
`the_named_files_are_the_emitters_record_never_a_re_derivation_from_empty_arrays`.
The fixture is `src/fat.ts` (400 exports, the budget takes it) beside
`src/legitimately-symbol-less.ts` (a file the walk indexes and the
extractor finds nothing in). **THE CONTROL IS SHOWN ARMED BEFORE ITS
ZERO IS WRITTEN DOWN**: the body asserts that a fresh index at the tight
budget carries BOTH files with empty `symbols` arrays — exactly
`["src/fat.ts", "src/legitimately-symbol-less.ts"]` — so the forbidden
re-derivation really would have had a second hit to report. Then the
record is asserted to be `["src/fat.ts"]`, the render is asserted to
print that and only that, and `legitimately-symbol-less` is asserted
absent. `emit::tests::the_returned_record_names_the_files_this_pass_emptied_and_no_others`
holds the same property one layer down, on the returned `BTreeSet`.

**CRITERION 3 — the schema decision, against ADR-014's
content-determined rule.** MET, and the decision is AGAINST the member.
Recorded here and in `check::drop_clause`'s doc comment.

- A `stats.truncated_paths` would SATISFY ADR-014's rule. The rule bans
  VOLATILE fields — a commit sha, a timing, an absolute path, a cache
  identity — and a path list is a pure function of the tree, so
  determinism and byte-stability survive it intact. **That is exactly
  why the rule could not decide this**, and saying so is half the
  criterion: refusing the member "because ADR-014" would have been a
  reason that does not hold.
- What decides it is the COST, and the cost falls in the one state the
  document can least afford it. The list's size GROWS WITH THE
  TRUNCATION, so the worse the degradation the more bytes the record
  spends inside the very document whose size caused it — a feedback
  loop, and in the wrong direction: those bytes force further drops,
  which lengthen the list. **THE FIGURE, at its own ref**: over the 201
  file entries of `docs/architecture/graph.json` at
  `098cfe10a9e94fadf56122b77597df8e64a7f58f` the mean path is 35.5
  bytes, which is 45.5 bytes as an array element at `stats`' depth
  (6-space indent, quotes, comma, newline), so a 200-file truncation
  would commit about 9 100 bytes to describe a truncation those bytes
  made worse. The mean moves with the tree; the SIGN of the loop does
  not.
- And the member buys nothing the return does not. The GATE is the only
  reader, it indexes FRESH on every run, and a fresh index is where the
  record is still alive — so the transient path is not a weaker version
  of the schema member, it is the same information at the only moment
  anybody asks for it. Committing it would additionally make every
  truncation a `graph.json` DIFF of its own path list, on top of the
  diff the truncation already causes.
- The residual, stated rather than discovered: a reader of a COMMITTED
  `graph.json` still cannot learn which files were thinned — only a
  fresh `index --check` can say. That is unchanged from before this card
  and is the schema member's one genuine advantage; it is declined at
  the price above. `T-140-s1` remains the fix for the truncation itself.

**CRITERION 4 — `drop_clause`'s COUNT and printed unit unmoved.** MET.
The counted sentence and the `unit: FILES whose array was emptied,
never symbols` clause are byte-identical to T-167-s5's; the list is
appended beneath them. T-167-s5's three pins
(`a_drop_speaks_even_at_healthy_headroom_which_is_where_it_used_to_be_silent`,
`the_flag_alone_still_speaks_when_no_file_count_was_ever_recorded`,
`printed_dropped_files`) are untouched and green, and the new body
re-asserts the count, the unit sentence and the ORDER (the counted
sentence before `WHICH FILES`) so a later edit that swapped the
addition for a replacement reds by name.

**COMMANDS, in the order run, each read from `$?` unpiped.**

| command | exit |
|---|---|
| `cargo test -p supertaskr-index --no-fail-fast` (base `098cfe1`) | 0 — 270 passed, 0 failed, 2 ignored |
| `cargo run -q -p supertaskr-index -- index --check --root ../..` (base) | 0 — CURRENT |
| `cargo build -p supertaskr-index` | 0 |
| `cargo test -p supertaskr-index --no-fail-fast` (at `e4c818b`) | 0 — 273 passed, 0 failed, 2 ignored |
| `cargo test -p supertaskr-index --lib --no-fail-fast` (at `86ce9f1`) | 0 — 220 passed |
| `cargo test --no-fail-fast` (workspace, at `86ce9f1`) | 0 — 645 passed, 0 failed, 4 ignored |
| `cargo run -q -p supertaskr-index -- index --check --root ../..` (at `86ce9f1`) | **1 — STALE, expected: see GRAPH REGEN below** |
| `npm ci` + `npm run build` from `lib/parser/` | 0 / 0 |
| `npm ci` from `app/` | 0 (`npm install` is **refused** here — see the correction clause) |
| `npm ci` from `tools/e2e/` | 0 |
| `SUPERTASKR_BOOT_PORT=15167 npm run boot:check` from `tools/e2e/` | 0 |

**GATES, derived from this lane's own diff** (`git merge-tree
--write-tree` against the integration tip, the RANGE RULE's pre-merge
form — the forecast includes this notes commit, so the derivation does
not move when it lands):

- **GRAPH REGEN — FIRES** (`*.rs` outside `docs/`), and `index --check`
  says **STALE at exit 1**, correctly: this lane's own three source
  files moved. `files +0 -0 ~3` (check.rs `loc 1556 -> 1881, symbols
  17 -> 18`; emit.rs `loc 395 -> 471`; lib.rs `loc 528 -> 556, symbols
  25 -> 26`), `edges +1 -1` (emit.rs's `std` import gains `BTreeSet`),
  and the fresh document is 1 193 357 bytes against the committed
  1 192 822. **THE REGEN IS THE INTEGRATOR'S AND THIS LANE LEFT
  `docs/architecture/graph.json` ALONE** — it is outside the fence, and
  a lane re-pinning counts for a tree that does not exist yet is T-211's
  ruling. The regen moves the two app dogfood fixtures with it; the
  registry did not change, so the parser pin holds.
- **BOOT GATE — FIRES** (`app/src-tauri/**`), and CONVENTIONS assigns it
  to the executor too. Exit **0**, both startup lines — `[supertaskr]
  project folder: /Users/ujju/Projects/nputer-T-167-s13` and
  `[supertaskr] window "main" created` — tree stopped on SIGTERM, and
  `lsof -nP -iTCP:15167 -sTCP:LISTEN` read back to zero rows at
  2026-09-09T02:02:38Z on Mac.lan, so no orphaned listener. The human's
  app on 1420 was read (never probed) before and after and is the same
  process throughout: `node 38601`. The gate is genuinely reachable
  here — `app/src-tauri/Cargo.toml` takes `supertaskr-index` as a path
  dependency, so this crate is compiled into the app binary.
- **DOCS GATE — FIRES** (this commit's own `docs/tasks/` path); the run
  and its exit are in the handoff report.
- **METHOD EVAL GATE — NOT OWED**: no `method/**` path, and no line
  matching the citation grammar is added under `docs/tasks/` by this
  lane (the `attack set:` line is the verifier's).

**DRILLS — seven mutants, each read back with `git diff`, run in a
DETACHED scratch worktree at a named commit with its own
`CARGO_TARGET_DIR` inside itself, each restored with `git restore
--source=<commit> --staged --worktree` and PROVED by sha256 against
`git show <commit>:<path>`.** Drill baseline in that worktree: 273
passed / 0 failed at `e4c818b`, 274 / 0 at `86ce9f1`.

| # | mutation (one side only) | at | suite | bodies killed |
|---|---|---|---|---|
| 1 | `check::check` builds the list by re-deriving from empty `symbols` arrays — **THE CARD'S OWN NAMED MUTANT** | `e4c818b` | 271 passed, **2 failed** | `the_named_files_are_the_emitters_record_…`, `the_flag_alone_still_speaks_…` |
| 2 | `bounded`'s `min(MAX_LINES)` removed | `e4c818b` | 271, **2 failed** | `the_named_list_is_bounded_…`, `long_delta_lists_are_truncated_with_an_honest_count` |
| 3 | `bounded`'s remainder forced to `0` | `e4c818b` | 271, **2 failed** | the same two |
| 4 | `apply_budget`'s under-budget return hands back an EMPTY record | `e4c818b` | 271, **2 failed** | `the_returned_record_names_…`, `the_named_files_are_the_emitters_record_…` |
| 5 | `drop_clause`'s `if !head.is_empty()` → `if true` | `e4c818b` | **273 passed, 0 failed — SURVIVOR** | none |
| 5b | the same mutation, after `86ce9f1` | `86ce9f1` | 273, **1 failed** | `a_count_with_no_record_prints_the_count_and_never_an_empty_heading` |
| 6 | `all_dropped` seeded with a file nothing emptied | `86ce9f1` | 266, **8 failed** | incl. `under_budget_graphs_pass_through_untouched` (its NEW assertion is the only one that reds there) |
| 7 | the record's sorted order reversed on the way out of `index_with_drops` | `86ce9f1` | 273, **1 failed** | `the_named_list_is_bounded_…` (its head-order assertion) |

**MUTANT 5 IS THE FINDING, AND IT IS WHY THERE IS A SECOND COMMIT.**
`check()` fills the count and the record from the SAME `apply_budget`
call, so "a count with no list" is unreachable through the gate and the
guard was defensive code no fixture could reach — a body that cannot
red is the finding (POISON DRILL). `CheckReport` is public with public
fields, so the state IS constructible by a caller; `86ce9f1` adds a body
that drives `drop_clause` through a hand-built report and pins that the
count survives an absent list while the heading does not appear. 5b
then kills it with a failing-body count of exactly ONE (shape SIX's
asking).

Mutant 1's kill set is TWO and both bodies are this card's; they are not
duplicates, and the reason is worth stating rather than waving at.
`the_named_files_…` decides the case the criterion is about — a file
truncated BESIDE a file that legitimately has none. The floor body
decides a different state: nothing was emptied at all, so the record
must be empty — and under mutant 1 it reds at the ROOMY arm, where the
re-derivation names `src/legitimately-symbol-less.ts` on a tree where
NOTHING was dropped. That is the sharpest reading of the defect
available: the forbidden implementation reports a truncation that never
happened.

**WHERE THE BRIEF WAS WRONG.** Two places, both benign, both named
because a brief nobody contradicts is a brief that gets copied.

1. The brief's ROW 4 gives the base as
   `f83f7f13d4741a911c1f71fe6bfc3ba350db1f86` (the newest `Checkpoint:`
   at assembly time) and the create command with it. The lane was
   actually cut at `098cfe10a9e94fadf56122b77597df8e64a7f58f` — this
   card's own dispatch stamp, which the brief's own ROW 5 reports as
   this lane's tip and which the dispatch mandate names as the base.
   The repository wins: `git log` in this worktree shows `098cfe1` as
   the base, and it is a non-merge commit carrying the checkpoint's
   graph, which is what the DISPATCH bullet's REASON asks for. No
   figure in these notes is derived from the brief's hash.
2. ROW 6 transcribes the fresh-worktree bullet's `npm install` for
   `app/`. **In a fenced lane that command cannot run**: the physical
   fence layer leaves out-of-fence tracked files read-only, `app/` is
   outside this card's fence, and `npm install` writes
   `app/package-lock.json` — exit **243**, `EACCES`. `npm ci` (CI's own
   spelling for `app/`, and the first of the two declared CI
   divergences) reads the lock and does not write it: exit **0**. This
   is the fence working, not a defect, and it is stated here because
   every fenced lane that needs the app installed will meet it.

**WHAT WAS NOTICED AND NOT DONE** — routed, never built:
`T-167-s14`, `status: suggested`. The emitter's record now exists and
exactly two other callers print emit stats without it: `cli.rs`'s
`Command::Index` arm and `watch::index_once`'s `WatchEvent::Indexed`.
Both write a graph and report `files/symbols/edges` with no word about a
truncation, so `index --watch` — the local delivery loop — can quietly
write a thinned map and say nothing until somebody runs `--check`. In
this card's fence and deliberately outside its four criteria.

**FOR THE VERIFIER.** The graph is STALE at this tip BY DESIGN and the
regen belongs to the integrator (T-211): `docs/architecture/graph.json`
is outside this fence and was not touched. The three files the delta
names are exactly this lane's three source files and nothing else.
