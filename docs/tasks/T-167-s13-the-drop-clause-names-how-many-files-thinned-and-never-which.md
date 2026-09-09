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

### Addendum — the suites the DOCS GATE named, and the figures at the tip

Written after the notes commit above, because the gate that names these
suites is derived from a path list that INCLUDES that commit — the
merge-tree forecast the RANGE RULE prescribes, which is why the
derivation does not move when a later notes commit lands. The path list
is the same five paths either way.

`node tools/e2e/scripts/docs-gate.mjs <the five forecast paths>` — exit
**1** (the gate HAS a verdict): 2 paths under `docs/` are code inputs,
and it names three suites. All three run, all three green:

| command | exit | bodies |
|---|---|---|
| `npx vitest run` from `lib/parser/` | 0 | 389 passed, 16 files |
| `npm run build` from `app/` | 0 | — (`npm test` needs `app/dist`) |
| `npm test` from `app/` | 0 | 1163 passed, 51 files |
| `SUPERTASKR_E2E_PORT=15167 npm test` from `tools/e2e/` | 0 | 706 passed (12.6m) |

The port was read to zero rows before and after the lane run, and 1420
was never probed — only read. The app dogfood pins are green because
this lane did not touch `docs/architecture/graph.json`: they pin the
COMMITTED graph, which is unmoved, and the staleness lives between that
file and a FRESH index.

At the tip `2cb7c09c4c22e79915c1e6dee85d8a5b502e63ff`, working tree
clean: `cargo test -p supertaskr-index --no-fail-fast` exit **0**, 274
passed / 0 failed / 2 ignored; `cargo run -q -p supertaskr-index --
index --check --root ../..` exit **1**, STALE, the same three-file delta
recorded above.

## VERDICT — phase 2 of the blind bench

**APPROVED WITH ASSIGNED CORRECTIONS** — claude-opus-5@subagent,
2026-09-09, judged on a detached bench at
`/Users/ujju/Projects/nputer-V-T-167-s13`, tip
`c51b7ba26b1e809ea0b4644885017a1f6c5cde71`, base
`098cfe10a9e94fadf56122b77597df8e64a7f58f`.

attack set: sha256:9ad985e88ab3cfdfa3f1c91aed8570e140724f41b1a0b842b136e7f85b8f611b (attack-set-T-167-s13.md)
ground truth: sha256:afefc9f83d1f90662066b0d7a324ed497e1c1f1ede77fc25c2da31e2ee96cc01 (ground-T-167-s13.md)

Both digests were verified with `shasum -a 256` before either file was
opened, and both matched.

**All four criteria are MET in BEHAVIOUR and I could not falsify one.**
The corrections are two properties the criteria name that no body pins —
both proved live by mutants that survive the shipped suite, and both
closed by a body I wrote and demonstrated failing where the arming is
absent. Neither is a behaviour defect: I ran the correct behaviour at
the tip in both states before writing them down.

### THE FRAME I ACTUALLY HAD

- **Phase 1 was a genuinely separate spawn** and I did not write it. It
  was tool-less BY INSTRUCTION — this harness cannot deny a spawn its
  tools (STATE's bench bullet; `docs/reference/07-verification.md`,
  "Phase 2") — and its own return reports **0 tool calls**, 53,420
  tokens, 199 s. That is the honest weaker thing and it is why this
  paragraph exists.
- **MY BRIEF CARRIED EXECUTOR-DERIVED SPECIFICS, above the line, and I
  say so rather than pretend otherwise**: it named `index_with_drops`,
  `fresh_truncated_paths` and the commit subjects from the executor's
  report. I re-derived every one of them from `git diff 098cfe1..c51b7ba`
  and from the tree; no figure below is taken from the brief.
- **THE CARD AT THE TIP IS THE EXECUTOR'S REPORT.** Commits `2cb7c09`
  and `c51b7ba` write the implementation notes and the addendum INTO the
  card, so the instruction "read the card whole" and the instruction
  "read the notes only after the diff" cannot both be kept at this tip.
  I read the card first. Phase 1's blindness is unaffected — it read the
  card at the BASE, where those sections do not exist — but my own
  reading order was notes-then-diff, and a later reader should know it.
  `report-T-167-s13.md` (sha256:093da9672e154998fd875ac06a08f9b382888792bcd139d926b043ea6f142b22)
  I opened only AFTER the diff, to enumerate claims; it adds nothing the
  card does not carry.
- **A PREVIOUS PHASE-2 SPAWN WAS CUT OFF AT 02:40Z MID-DRILL.** Its
  scratch files (`V-T-167-s13-*`) were present. I ran one `ls` over the
  scratchpad and saw their names; **I opened none of them**, and every
  worktree, script, log and figure below is my own, written under
  `V2-` names. Nothing of that spawn was committed.

### THE BODIES I RAN, WITH COUNTS AND EXITS

Every count is my own measurement at a named ref, read from the
`test result:` lines summed across targets, never from an exit code
alone.

| run | ref | exit | bodies |
|---|---|---|---|
| `cargo test -p supertaskr-index --no-fail-fast` | base `098cfe1`, scratch worktree | **0** | 270 passed / 0 failed / 2 ignored, 12 targets |
| `cargo test -p supertaskr-index --no-fail-fast` | tip `c51b7ba`, drill worktree | **0** | **274 passed / 0 failed / 2 ignored**, 12 targets |

+4 bodies against the base, which is exactly the four `#[test]` fns the
diff adds. GT-6's 270 is confirmed independently.

The four graded suites were run at MY OWN tip — the commit this verdict
creates, not the commit I was sent — through the blessed runner from the
bench root, and their counts are recorded in the addendum commit at the
foot of this verdict.

### THE DRILL — 23 MUTANTS, 3 SURVIVORS

Detached scratch worktree at `c51b7ba`, its own `CARGO_TARGET_DIR` under
the scratchpad, work committed first. **Every landing read from
`git diff -U1`, never from the mutator's report** — the mutator refuses
unless its pattern matches exactly once, and each landing was printed.
**Every restore proved by sha256** against `git show c51b7ba:<path>` for
all four crate sources, with an empty per-path diff and a clean
`git status --porcelain` as companions. All 23 restores: `SHA_OK`,
`PERPATH_DIFF_LINES=0`, `STATUS_DIRTY=0`.

| # | mutation | result | bodies it reds |
|---|---|---|---|
| M1 | `check::check` re-derives the list from empty `symbols` arrays — **the card's own named mutant** | **KILLED** (272/2) | `the_named_files_are_the_emitters_record_never_a_re_derivation_from_empty_arrays` (at the ROOMY arm: "and must name nothing", `fresh_stats (4, 402, 0)`), `the_flag_alone_still_speaks_when_no_file_count_was_ever_recorded` ("nothing was emptied at this floor") |
| M2 | list ← committed-vs-fresh `symbols` diff | **KILLED** (272/2) | `the_named_files_…`, `the_named_list_is_bounded_…` (left 0, right 25) |
| M2b | the same, falling back to the naive re-derivation when no committed graph exists | **KILLED** (exit 101) | same class — no committed-vs-fresh shape survives |
| M3 | `apply_budget` accumulates the FIRST pass only | **SURVIVED** (274/0) | none — **ASSIGNED CORRECTION 2** |
| M4a | the under-budget return hands back an empty record | **KILLED** (272/2) | `the_named_files_…`, `emit::tests::the_returned_record_names_the_files_this_pass_emptied_and_no_others` |
| M4b | the FLOOR return hands back an empty record | **KILLED** (273/1) | `the_named_list_is_bounded_…` (left 0, right 25) |
| M5 | `bounded` takes the TAIL instead of the head | **KILLED** (273/1) | `the_named_list_is_bounded_…` (head order) |
| M6 | the drop list gets its own literal `19` instead of the shared bound | **KILLED** (273/1) | `the_named_list_is_bounded_…` |
| M7 | `... and N more` prints the TOTAL rather than the remainder | **KILLED** (273/1) | `the_named_list_is_bounded_…` |
| M8a | `drop_clause`'s count ← `fresh_truncated_paths.len()` | **KILLED** (273/1) | `a_count_with_no_record_prints_the_count_and_never_an_empty_heading` |
| M8b | `drop_clause`'s count ← the PRINTED head's length | **KILLED** (272/2) | `a_count_with_no_record_…`, `the_named_list_is_bounded_…` |
| M9 | the unit word: `FILES whose array was emptied` → `SYMBOLS dropped from those arrays` | **KILLED** (272/2) | `a_drop_speaks_even_at_healthy_headroom_which_is_where_it_used_to_be_silent` (T-167-s5's pin), `the_named_files_…` |
| M10 | a schema member emitted at empty (`skip_serializing_if` dropped from `Stats::truncated_files`) | **KILLED** (269/5) | `mixed_matches_golden`, `rust_workspace_matches_golden`, `ts_basic_matches_golden`, `ts_paths_alias_matches_golden`, `stable_json_ends_with_single_trailing_lf_and_2_space_indent` |
| M11 | `if !head.is_empty()` → `if true` (the executor's own survivor at `e4c818b`) | **KILLED** (273/1) | `a_count_with_no_record_…` — the `86ce9f1` body does its job |
| M12 | paths printed absolute and with `\` separators | **KILLED** (272/2) | `the_named_files_…`, `the_named_list_is_bounded_…` |
| M13 | the record's order reversed leaving `index_with_drops` | **KILLED** (273/1) | `the_named_list_is_bounded_…` |
| M16a | the record emptied at the **CURRENT** construction site (committed graph present and matching) | **SURVIVED** (274/0) | none — **ASSIGNED CORRECTION 1** |
| M16b | the record emptied at the **STALE** construction site (committed graph present and differing) | **SURVIVED** (274/0) | none — **ASSIGNED CORRECTION 1** |
| P1 | containment: the COUNT alone (`check`'s `truncated_files` + 1 where present) | KILLED (272/2) | `the_named_files_…`, `the_named_list_is_bounded_…` |
| P2 | containment: the RECORD alone (one member dropped in `index_with_drops`) | KILLED (272/2) | the same two |
| D1 | **DATA**: the legitimately-symbol-less file REMOVED from the fixture | **KILLED** (273/1) | `the_named_files_…`, on the ARMING assertion: *"the control is only a control if the re-derivation really has TWO hits"* — left `["src/fat.ts"]`, right `["src/fat.ts", "src/legitimately-symbol-less.ts"]` |
| D2 | **DATA**: the symbol-less file GIVEN a symbol | **KILLED** (273/1) | the same assertion, the same message |
| D3 | **DATA**: the symbol-less file made one the walk does not admit (`.txt`) | **KILLED** (273/1) | the same assertion, the same message |

**M10 answers the attack set's open question.** The set said a schema
member emitted at empty must die on a byte-identity body, *"and if no
such body exists, that is the finding"*. A body exists — five of them,
four goldens and the serialization pin. C3-a is guarded.

**M8a/M8b answer the other one.** The set said a count re-derived from
the list must die on a `> MAX_LINES` body *"or its absence is the
finding"*. Both re-derivation shapes die, in two different bodies. The
one the set predicted would survive — `list.len()` — dies on the
`86ce9f1` body, which is the body the executor added because its own
drill found the guard unreachable.

**D1/D2/D3 are the control's own demonstration, from the data side.**
All three disarm the control, and all three red on the ARMING assertion
by name rather than on the property. **The fixture cannot be silently
disarmed** — the failure this method produces most (T-210, T-203) is
guarded here, and the guard is what fires.

### THE CONTAINMENT MATRIX — FOUR CELLS

The attack set asked for a diagonal. **The honest answer is that the
diagonal is not where the separation lives, and this is a property of
the card rather than a defect:** criterion 4 asks the list to sit
BESIDE the count, so the two bodies that render both assert both, and
they red on either perturbation.

| perturbation (one fact only) | T-167-s5's COUNT pins | T-167-s13's joint LIST bodies |
|---|---|---|
| **P1 — the count alone** | **GREEN** ×3 | **RED** ×2 (`the_named_files_…`, `the_named_list_is_bounded_…`) |
| **P2 — the record alone** | **GREEN** ×3 | **RED** ×2 (the same two) |

T-167-s5's pins stay green under P1 for a reason worth naming rather
than waving at: `a_drop_speaks_even_at_healthy_headroom_…` asserts
`fresh_truncated_files > 0` and the rendered sentence, never an exact
value, and `the_flag_alone_…` reaches the floor arm where the count is
`None` and the perturbation is a no-op. **This lane's bodies assert the
EXACT count beside the list, so they are strictly stronger than the pins
they sit beside** — which is the opposite of the C4-c risk the attack
set flagged.

The separation the matrix was after is carried by the two SINGLE-fact
bodies, and their kill sets are disjoint — **neither contains the
other**:

| mutant | `a_count_with_no_record_…` (count, no list) | `the_returned_record_names_…` (record, no count path) |
|---|---|---|
| M8a — count ← list length | **RED** | GREEN |
| M4a — record emptied at the emit's return | GREEN | **RED** |

### THE CRITERIA, ONE BY ONE

**C1 — the alarm block names WHICH files, bounded like every other delta
list. MET.** The list renders beneath the counted sentence under a
`WHICH FILES` heading and goes through `check::bounded`, which is now
the ONE implementation of `MAX_LINES` + `"... and N more"` — `emit_lines`
spends it too. M5, M6, M7 and M13 all die on
`the_named_list_is_bounded_…` (25 dropped, 20 printed, `... and 5 more`,
head in sorted order, count still 25). **C1-e is proved by bytes rather
than asserted**: the full `index --check` report from the BASE binary
and from the TIP binary, on the same untruncated tree, is
**byte-identical** — both `sha256:f9909503bdf02a0dbb1945a127bb97b49da1f646a381e4dc07df7d524dfd1942`
— and identical again on a STALE tree whose report carries the delta
lists the `bounded` refactor moved. The refactor is behaviour-preserving
on the sibling lists, measured, not argued. C1-g holds: paths are
repo-root-relative with forward slashes, and M12 dies.

**C2 — the emitter's own record, never a re-derivation. MET, and this
is the criterion the lane is built around.** `apply_budget` returns its
`all_dropped` accumulator; `index_with_drops` carries it; `check` takes
it from the same call that produced the document. Every re-derivation
shape dies: the naive one (M1), the committed-vs-fresh one (M2), and the
hybrid that falls back to naive (M2b). The control — `src/fat.ts`
emptied by the budget beside `src/legitimately-symbol-less.ts` that the
walk indexes and the extractor finds nothing in — is **asserted armed
before its zero is written down**, and D1/D2/D3 prove that arming is
load-bearing. C2-f, the attack set's "most likely quiet failure", is
covered.

**C3 — the schema decision against ADR-014. MET. THE BRANCH TAKEN IS
THE CHEAP ONE: NO SCHEMA MEMBER.** I say so explicitly because the
attack set required it (C3-e), and it is not vacuous — the decision is
argued, recorded twice (the card and `check::drop_clause`'s doc
comment), and **it is correct about ADR-014's text.** I read ADR-014 at
the base. It requires the committed graph to be deterministic — *"same
tree → byte-identical bytes"* — and OMITS volatile fields (HEAD sha,
timings). A `stats.truncated_paths` is a pure function of the tree, so
it would SATISFY that rule; the record says exactly this, and refuses
the member on COST instead. **That is the honest reading**, and a record
that had refused the member "because ADR-014" would have been wrong.
The cost figure (mean path 35.5 bytes over the 201 file entries at
`098cfe10`, 45.5 bytes as an array element at `stats`' depth, ≈9 100
bytes for a 200-file truncation) is stated AT ITS OWN REF and is
re-derivable; the sign of the feedback loop — a record whose size grows
with the truncation, spending the budget that caused it — does not
depend on the mean.
**C3-a and C3-c, the claim that the schema did not move in practice,
are proved by bytes.** The TIP binary run against the BASE tree emits a
document that is byte-identical to the committed
`docs/architecture/graph.json`: **CURRENT, exit 0, 1 192 822 bytes, 201
files, 2 547 symbols, 2 441 edges**, the budget line unchanged at 55.6 %.
A schema member — even one omitted at empty by a wrong predicate —
could not survive that. M10 confirms the guard is live.

**C4 — the COUNT and its printed unit unmoved. MET.** The counted
sentence and the `unit: FILES whose array was emptied, never symbols`
clause are unchanged in the diff (the only edit to that `format!` is
binding its result to `out`), the list is appended beneath it, and
`the_named_files_…` re-asserts the ORDER so a later edit that swapped
the addition for a replacement reds by name. M9 kills the unit word on
T-167-s5's own pin. M8a and M8b kill both re-derivations of the count.
**C4-c: no T-167-s5 body was edited** — the diff removes no assertion
anywhere (`git diff | grep '^-\s*assert'` is empty); the two existing
bodies it touches (`the_flag_alone_…` and `emit::tests::under_budget_…`)
gain assertions and lose none. **C4-d: no downstream reader is exposed.**
`CheckReport` has exactly one non-test consumer, `cli.rs`'s
`Command::Check`, and GT-15's `Stats` consumers all read `graph.json`,
which did not move.

**`index --check`'s exit contract is unchanged**, measured on both
binaries over five probes: CURRENT **0**, STALE **1**, unknown flag
**2**, invalid root **3**, `--version` **0** — identical, base and tip.
`cli.rs` is not in the diff.

### SECURITY SWEEP

**S1 — paths printed verbatim: a REAL surface, and it is NOT this
lane's.** The walk admits a filename containing a newline or an ESC
byte; both reach `files[].path` in the emitted document verbatim
(`'src/ev\nil.ts'`, `'src/e\x1b[31m.ts'`), and the report's delta list
then emits a second physical line carrying no `[supertaskr-index]`
prefix. **I measured the base binary and the tip binary on that tree and
their reports diff to nothing**, so the class is older than this card
and the `WHICH FILES` list adds one more list to a surface that already
had one. Filed as `T-167-s15`, `status: suggested`; **not held against
this lane**. No absolute path leaks: the report is repo-root-relative
throughout.

**S2 — no new input path.** The diff adds no `fs::`, `File::`,
`metadata`, `read_to_string`, `env::`, `Command`, `process::` or
`unsafe`. No dependency was added; no `Cargo.toml` moved. The one new
public-facing surface is `pub fresh_truncated_paths` on an
already-public struct, and `index_with_drops` is deliberately
`pub(crate)`.

**S3 — no new panic path.** The only production slice added is
`&all[..head]` with `head = all.len().min(MAX_LINES)`, which cannot
exceed the length and cannot underflow in `all.len() - head`. Every
`unwrap`/`expect` the diff adds is inside `#[cfg(test)]`. Committed-
document parsing is untouched, so an older or malformed `graph.json`
still takes the same `Staleness::Unreadable` path.

**S4 — the report's size is bounded** at `MAX_LINES` entries plus one
tail line, on any truncation however large; the bounded body drives 25
and prints 20. The schema branch was declined, so no document grows.

**No finding is REJECTED-level.** All eight of the attack set's
falsifiers are clear: no re-derived list, no schema member, the count
unmoved and not re-derived, the list bounded with correct arithmetic,
the exit contract unchanged, the graph and the app dogfood pins
untouched, the fence intact (five paths, three of them the crate's own
sources, two of them `docs/tasks/`), and nothing in the security sweep.

### ASSIGNED CORRECTION 1 — the record is pinned only on the arm no indexed repository ever takes

`check` builds `CheckReport` at **three** sites: `Staleness::Missing`
(no committed graph), CURRENT (committed graph present and byte-equal),
and the general STALE arm. All three carry `fresh_truncated_paths`
correctly — **I ran the correct behaviour at the tip and saw it** — but
every shipped body reaches only the FIRST, because `TempTree` starts
with no `docs/architecture/graph.json` at all. **Emptying the record at
either of the other two leaves the suite at 274 passed / 0 failed**
(M16a, M16b). **In this repository every `index --check` takes one of
those two arms**, so criterion 1's production path is unguarded: the
feature could break on every real invocation and the crate suite would
stay green.

**THE BODY THAT PINS IT — WRITTEN AND CHECKED BY ME, IN A SCRATCH
WORKTREE, NOT PROPOSED ON FAITH.** `check::tests::probe_the_record_reaches_the_report_on_the_current_and_stale_arms`:
build the T-167-s13 fixture, take the tight budget, write
`stable_json(&index(&tight))` to `GRAPH_REL_PATH` so the CURRENT arm is
really reached (`current.stale.is_none()` asserted, not assumed), assert
the record and the printed list are `["src/fat.ts"]` there; then move
`src/thin0.ts` so the STALE arm is really reached (`stale.is_some()`
asserted) and assert the record survives and still prints.
**THE DEMONSTRATION I OWE FOR IT:** at the tip **1 passed / 0 failed**;
under M16a **0 passed / 1 failed**; under M16b **0 passed / 1 failed**.
It reds where the arming is absent, on both arms, and it passes where
the property is present.

### ASSIGNED CORRECTION 2 — the multi-pass accumulation has no body

`apply_budget` loops: emptying arrays changes `stats`, which changes the
document's size, so a marginal budget needs a further pass.
`all_dropped.extend(dropped)` is what makes the record cumulative.
**Restricting that to the first pass leaves the suite at 274 passed / 0
failed** (M3). The gap is inherited rather than created — the same
mutation corrupts `stats.truncated_files`, which is T-167-s5's count —
but criterion 2 is exactly the property it breaks, and the card's own
rule (a body that cannot red is the finding, which is why `86ce9f1`
exists) applies to a property that has no body at all.

**AND IT IS NOT AN EQUIVALENT MUTANT, WHICH I CHECKED BEFORE ASSIGNING
IT.** `emit::tests::probe_the_record_equals_what_was_emptied_at_every_budget`:
41 files (40 with one symbol each, so the greedy loop's overshoot is
small and a second pass is reachable, plus one that arrives bare),
sweeping **every** budget from 0 to the full document length and
asserting at each that the returned record equals exactly the set of
arrays this call emptied, and that `stats.truncated_files` is the
record's length. **THE DEMONSTRATION:** at the tip **1 passed / 0
failed**; under M3 it reds with **2 244 budgets disagreeing**, the first
at budget 8 900 (*record 39 != emptied 40*). Multi-pass is real, it is
reachable on a 41-file fixture, and nothing in the crate sees it today.
My earlier, coarser probe (files of 30/20/10 symbols, a 4 000-byte
sweep) PASSED under M3 — recorded because a control that cannot fail is
the defect this method produces most, and the first one I wrote could
not.

**Both corrections are test-only, inside the fence
(`app/src-tauri/crates/supertaskr-index/src/`), and neither asks the
implementation to change.** Applying them owes `npm run capabilities`
nothing (Rust bodies are not the e2e census) but does move the graph,
because `check.rs` and `emit.rs` are indexed files.

### WHAT I DID NOT JUDGE

Nothing was left UNJUDGED. The ground truths covered every fact the
attack set named; GT-6 (270 at the base) and GT-8 (`index --check`
CURRENT at 55.6 %) I re-measured myself and both held. The one arming
the attack set wanted that no body carries — D7, a file emptied by the
budget **and** already empty in the committed graph — is not load-
bearing here: every committed-vs-fresh implementation (M2, M2b) dies on
the plain control before D7 could be reached, so its absence lets no
wrong implementation through. It is noted, not assigned.

### FOR THE INTEGRATOR

- **The emitter's DOCUMENT did not move.** The tip binary on the base
  tree reproduces the committed graph byte-for-byte. No schema change,
  no golden moved, no app dogfood pin moved — this lane left
  `docs/architecture/graph.json` and `app/test/` alone, correctly.
- **THE GRAPH REGEN IS OWED ANYWAY, and it is content, not schema.**
  `index --check` at this tip is **STALE, exit 1**, because the lane's
  own three source files are indexed files: `files +0 -0 ~3`
  (`check.rs` loc 1556→1881 symbols 17→18; `emit.rs` loc 395→471;
  `lib.rs` loc 528→556 symbols 25→26), `edges +1 -1` (emit.rs's `std`
  import gains `BTreeSet`), fresh 1 193 357 bytes against the committed
  1 192 822. The regen is the integrator's at the merge (T-211) and it
  moves the six app dogfood pins with it.
- My own commits touch `docs/tasks/` only, and the graph indexes no
  `.md` (201 files: 92 `.ts`, 59 `.rs`, 50 `.tsx`), so this verdict adds
  nothing to that obligation.

### Verdict addendum — the four suites at MY OWN tip, and the schema proved structurally

Written after the verdict commit, because a count in prose is a claim
about a tree and my own commit changed the tree it counts. **Every
figure here is measured at `fab75450dd34a8ad86b92faee0a34994b3add0ea`**
— the verdict commit — through the blessed runner from the bench root,
never at the commit I was sent. The runner stamps the ref itself, so
each line below can be checked against its own token.

| suite | command | exit | bodies | ref |
|---|---|---|---|---|
| parser | `node tools/e2e/scripts/gate-run.mjs parser` | **0** | **389**, 1 target, GREEN | `fab7545` |
| app | `node tools/e2e/scripts/gate-run.mjs app` | **0** | **1163**, 1 target, GREEN | `fab7545` |
| rust | `node tools/e2e/scripts/gate-run.mjs rust` | **0** | **649**, 18 targets, GREEN | `fab7545` |
| e2e | `SUPERTASKR_E2E_PORT=25167 node tools/e2e/scripts/gate-run.mjs e2e` | **0** | **706**, 1 target, GREEN | `fab7545` |

The rust suite's 649 is the runner's body count; the raw output is
**645 passed / 0 failed / 4 ignored** across 18 targets, which is the
executor's own workspace figure exactly, and the crate-scope subset I
measured separately is 274 / 0 / 2. The DOCS GATE fires on this
verdict's two `docs/tasks/` paths (exit **1**, a verdict rather than a
failure) and names parser, app and e2e; all three are above, and rust is
run beside them because this bench holds a Rust lane.

**No gate my prose could move is left unrun**, which is the point of
running them here rather than quoting the executor's: this verdict adds
a card (`T-167-s15`) and 400-odd lines to another, and the parser
census, the board readers and the landing gate all read `docs/tasks/`
(STATE's own hazard, T-274).

**AND THE SCHEMA IS PROVED STRUCTURALLY, NOT ONLY BY BYTES.**
Regenerating on the untruncated bench tree and comparing against the
committed `docs/architecture/graph.json` object-by-object:

- top-level keys **identical** — `schema, root, languages, files,
  packages, edges, unresolved, stats`;
- `stats` keys **identical** — `{edges, files, symbols}` both sides, and
  no `truncated_*` member appears anywhere;
- file and symbol keys **identical** — `exported, hash, id, kind, lang,
  loc, name, path, range, symbols`;
- **no file added, none removed**, and exactly three entries changed:
  `check.rs`, `emit.rs`, `lib.rs` — this lane's own three sources.

So the byte delta at the tip (1 193 357 against 1 192 822) is content
and nothing else. **C3's declined member is declined in the emitted
document as well as in the prose.**

**THE D-SERIES, dispositions.** D1/D2/D3 are in the drill table above.
The rest: **D4** (a budget nothing can meet, every array emptied) is
already `the_named_list_is_bounded_…`'s own fixture, `max_graph_bytes:
1`. **D6** (a budget that thins nothing) is `the_named_files_…`'s ROOMY
arm, asserted as untruncated before its zero is read. **D5** (the
boundary and one byte below) is subsumed, far past what the attack set
asked, by ASSIGNED CORRECTION 2's body: it sweeps **every** budget from
0 to the full document length, so the boundary is not one case among
many but 9 000 of them. **D7** (emptied by the budget AND already empty
in the committed graph) has no body and needs none here — every
committed-vs-fresh implementation dies before D7 could decide it (M2,
M2b) — so it is noted and not assigned.
