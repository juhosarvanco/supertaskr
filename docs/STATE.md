# State

Updated: 2026-08-25 by the T-010 integrator (independent hand, size M).

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: THREE LANES ARE LIVE
AND EVERY ONE OF THEM HOLDS A FENCE, AND THE MAP JUST CHANGED SHAPE.**
This checkpoint lands the largest merge this repository has taken. Every
`.rs` file in the tree is visible to the graph for the first time; the
committed graph goes from 648 886 to **890 866 bytes — 89.09% of its own
budget** — and every lane cut from here inherits new regen endpoints.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is a
scratch worktree and not a lane (the T-089 correction in CONVENTIONS).
Three scratch worktrees belonging to other lanes were live beside these
and hold no fence.

| lane | fence (`touches:`) | where it is |
|---|---|---|
| **T-123** | `[app-shell, app-agent]` | rebuild in flight after a REJECTED verdict |
| **T-110** | `[app-dispatch]` | rebuild in flight after a REJECTED verdict |
| **T-031** | `[app-board, app-interview]` | building, and drilling — a `drill-T-031-verify` worktree is live |

**THE PREVIOUS CHECKPOINT DELETED THIS TABLE'S TIP COLUMN AND WAS RIGHT
TO, AND THIS INTEGRATION IS THE THIRD MEASUREMENT SAYING SO.** Between the
lane list read at the start of this turn and the one read at its end, all
three tips moved: T-123 `895324a` → `d69c0d3`, T-110 `6fea6a1` →
`0c521d5`, T-031 `fe7ffc6` → `75afa0a` — and T-031's had already moved
from the `765362e` the previous checkpoint recorded. **A live lane's tip is
a live-environment fact, not a function of a tree.** What is stable is
WHICH lane holds WHICH fence. For a tip, run `git worktree list`.

**THE BOARD CANNOT TELL YOU THE LAST COLUMN, AND THIS CHECKPOINT SAYS SO
RATHER THAN PRETENDING OTHERWISE.** All three cards read `status: building`
with an empty `verifier:`, derived from disk here, so "rebuild after a
rejection" comes from the dispatcher's report at this turn and not from the
repository. `git worktree list` is the authority on which fences are held;
the board's `status:` is not, and neither carries a lane's PHASE.

**T-010's own worktree is removed in the same breath as this commit**, in
the order lane-protocol rule 6 fixes (merge, then checkpoint, then remove),
so `[crate-index]` and `[docs/architecture/components/]` are FREE. Every
other fence in ARCHITECTURE's slug table is free too — `lib-parser`,
`app-map`, `tools/e2e`, `.github/`, `docs/CONVENTIONS.md`, `method/`.

## Just completed

**T-010 — the indexer collects Rust, and the component that WRITES the
graph stops being the one component the graph could not see.** F-06,
milestone 4, size M, `touches: [crate-index, docs/architecture/components/]`,
**fence never widened**. Built by `claude-opus-5 @T-010`, verified
independently and adversarially by `claude-opus-5 @T-010-verify`; `review:
same-model`. Main-before **`b7b4213`**, lane tip **`9cce194`**, merge
**`d64c673`**, this checkpoint after it. It had been F-06's long-open
milestone-4 card since 2026-08-15.

**NOT ONE OF THE 46 FILES THAT JOINED THE MAP IS NEW ON DISK.** That is
the whole shape of this merge: `Lang::for_extension("rs")` returns
`Some(Lang::Rust)` and `IndexOptions::default().languages` becomes
`[Ts, Js, Rust]`, so a walk that already ran over this tree simply starts
admitting an extension it refused. `extract/rust.rs` is the sibling of
`extract/ts.rs` on the same contract; `resolve/rust.rs` is the part that
is genuinely not the TS side, because a Rust file's place in the tree is
declared somewhere else — cargo target auto-discovery, a `mod` walk to a
module→file map, then `use` paths by longest module prefix under six
anchors.

## What this does to the map, stated plainly

- **`languages` goes `["ts"]` → `["rust","ts"]`.** 46 `.rs` files enter
  the index: C-07 **0 → 32**, C-05 59 → **65**, C-14 1 → **8**, C-10
  2 → **3**. 172 files map and `unmappedFiles` is still `[]`.
- **C-07 stops being a declared-only face.** Its D3 clears — the only D3
  in this repository's ledger ever cleared by a change to the WALK rather
  than by a file being written. Declared-only components go 4 → **3**.
- **A new relation appears: `D1:C-05->C-07`**, the first finding in this
  tree with a Rust file at BOTH ends (`src/index_cmd.rs` → the crate's own
  `lib.rs`). Undeclared goes 10 → **11**; C-05's drift chip 4 → **5**.
  Left undeclared on the standing rule — the integrator regenerates, the
  ARCHITECT rules on the registry. Routed as `T-010-s4`.
- **A relation FLIPS KIND, and it is a prediction written down at T-025
  coming true unedited.** `C-14→C-10` has carried the fixture comment *"no
  TS import can confirm a Rust-side dependency until T-010 extracts
  Rust"* since 2026-08-16. It is now **confirmed, 2 file edges**
  (`agent/mod.rs` and `tests/agent_runner.rs` reaching `docs_watch.rs`).
  Planned 10 → **9**, confirmed 13 → **14**, rows 33 → **34**.
- **The registry settlement was made BEFORE the regen, which is what the
  card's problem statement demanded**, and the argued set was FIVE and not
  the four that statement enumerated — `src/churn.rs` arrived with T-013 a
  week after that triage. C-05 takes `acl_pin.rs`, `churn.rs`,
  `index_cmd.rs`; C-14 takes `src/bin/fake_agent.rs` and
  `tests/agent_runner.rs`. Nothing is declined, so `arch drift` reports
  **`unmapped=0`**: the regen CONFIRMS a decision instead of discovering a
  problem.

## THE SIZE IS THE FINDING, AND THE HEADROOM IS THE THING NOTHING REPORTS

**890 866 bytes = 89.0866% of `max_graph_bytes` (1 000 000) and 84.9596%
of the docs collector's `MAX_FILE_BYTES` (1 048 576).** Headroom **109 134**
and **157 710** bytes. Nothing truncates — `truncated_symbols` and
`truncated_files` are both ABSENT from the emitted stats. Both constants
were read out of the source (`emit.rs`/`lib.rs` and `docs_watch.rs`), not
quoted.

**THE CAP CANNOT BE CROSSED WHILE THE BUDGET STANDS, AND THE FLOOR WAS
RE-DERIVED RATHER THAN ACCEPTED.** Emptying every symbol array and dropping
the **1 214** dependent `s:` edges gives **186 888 bytes**, which sits
**813 112** below `max_graph_bytes` — so `apply_budget`'s "emit over budget
anyway" branch is unreachable on any tree of this shape, and the 1 MiB cap
whose breach would break the map pane SILENTLY sits above a budget that
stops first. The re-serializer was proved before it was used to measure:
`JSON.stringify(g, null, 2) + "\n"` reproduces the committed file at
**890 866 = 890 866**, byte for byte.

**THE VERIFIER MEASURED 890 843 AND 186 865 AND WE DO NOT DISAGREE.** Both
of my figures are exactly **+23** on theirs, and +23 is what T-096's merge
added to this graph between their base and mine. A figure that reproduces
with its delta explained is the only kind worth quoting; `T-010-s3` carries
the finding and it does not block.

## CRITERION 5's FIXTURE HALF — the debt the verdict assigned, paid here

The verdict APPROVED with criterion 5's second clause explicitly **NOT
MET**: *"all THREE live-registry fixtures SHALL be reconciled in the same
change"*. The fence ruling behind that was checked and is correct —
`app/test/**` is C-05's `app-shell`, held LIVE by T-123, so widening was
two live lanes on one fence rather than a fence question — and CONVENTIONS
itself puts the regen at the CHECKPOINT and says a merge regen moves the
two app fixtures. **The third fixture was verified NOT OWED rather than
assumed**: `lib/parser/test/smoke.test.ts` pins the component ID LIST, no
component is declared here, and it is **264/264 at exit 0** throughout.

**THE FULL SET WAS DERIVED BEFORE ANYTHING WAS RUN, and the app suite came
back 940/940 ON THE FIRST RUN with no hidden second assertion.** A
throwaway probe (T-088's technique) computed every quantity off the fresh
graph; the probe was removed and its removal proved by an empty tracked
`git status`. **Fifteen assertions moved across nine bodies, plus three
body titles and two stale comments** — every one corrected to its new
derived value, none loosened:

| fixture | assertion | from | to |
|---|---|---|---|
| dogfood | `fileComponent.size` | 126 | **172** |
| dogfood | tally C-05 / C-07 / C-10 / C-14 | 59 / — / 2 / 1 | **65 / 32 (new row) / 3 / 8** |
| dogfood | `findings` | 10 D1 + 4 D3 | **11 D1 + 3 D3** — `D1:C-05->C-07` in, `D3:C-07` out, `D1:C-05->C-14` 6 → 8 fileEdges |
| dogfood | relation table | 33 rows | **34** — new `C-05→C-07`; `C-05→C-10` 34 → 38; `C-05→C-14` 6 → 8; `C-14→C-10` planned → **confirmed 2** |
| dogfood | `drift` / `declaredOnly` | 8 / 4 ids | **7 / 3** — C-07 out of both |
| map | C-05 drift chip / panel chip | `drift 4` / `4 drift findings` | **`drift 5` / `5 drift findings`** + the C-07 sentence asserted |
| map | rendered edges / undeclared | 33 / 10 | **34 / 11** |
| map | header hint | `126 files` | **`172 files`** |
| map | the C-07 body | *"declared-only, zero TS files match its globs"* | **inverted whole** |

**THE C-07 BODY COULD ONLY BE REWRITTEN, AND IT IS NOT A LOOSENING.** Its
premise is false BY DESIGN after this merge, so each of its three
assertions became the negation of the one it replaced — no declared-only
border, no `declared · no files yet`, and `32 files` on the face — with the
D3 ring and `data-drift` newly asserted ABSENT. Its status word is derived
LIVE on the C-12 body's own churn-proof rule rather than pinned, because
T-010's own card is what rolls C-07 up: a literal there would red on the
pipeline moving the card rather than on the map being wrong.

## THE REGEN, AND WHY THE SECOND ONE WAS NEEDED

`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph --
--ignored`, exit **0**, run TWICE — once to derive the fixture values and
again after they were written, per the GRAPH REGEN bullet's own reason.
`index --check --root ../..` was **exit 1, a REAL red** at the merge
(printing both count lines and a `+46` file list, which is how it is told
apart from the `--root` false red) and **exit 0, CURRENT** after the second
regen and again after the doc writes.

| | committed at `b7b4213` | fresh at this checkpoint |
|---|---|---|
| bytes | 648 886 | **890 866** (+241 980, +37.3%) |
| files | 126 | **172** (+46, every one `.rs`, none new on disk) |
| symbols | 1126 | **1874** (+748) |
| edges | 1712 | **1842** (+130 — 628 import / 533 call / 681 type_ref) |
| packages | 17 | **24** (+7 cargo; 13 npm / 7 cargo / 4 node) |
| `languages` | `["ts"]` | **`["rust","ts"]`** |
| `unresolved` | 1 | **1** — the same TS `./index.css` asset |

**NOT ONE RUST `use` IN THIS REPOSITORY IS UNRESOLVED**, which is the
strongest single statement about the resolver.

**THE SECOND REGEN WAS NEEDED AND A BYTE COMPARISON WOULD HAVE MISSED IT
— that is new, and it sharpens T-050's rule rather than repeating it.**
Both regens report **890 866 bytes**. The file is NOT the same:
`architecture-dogfood.test.ts` goes `loc` 1852 → **1949** inside the graph
and `map-dogfood-render.test.tsx` 418 → **483**, because the checkpoint
edits indexed fixture files and the digit widths happen not to move. Only
`index --check`, which compares CONTENT, can tell. **A checkpoint that
quotes a byte count as proof of currency would have shipped a stale
graph.**

## Ranges, every dot count stated, at their own refs

**MAIN MOVED UNDER THIS MERGE — DURING IT.** `git rev-parse main` answered
**`bbcbc39`** and the `merge-tree` forecast was taken against that;
**fifty-one seconds later** another session committed **`b7b4213`** (a
docs-only STATE.md correction), so the merge's real first parent is
`b7b4213`. Main advanced **10 first-parent commits / 23 paths** under this
lane, `d46f71f` → `f1dbed1` → `cd79f97` → `765362e` → `d43455b` → `c6ef751`
→ `e884802` → `ee9dacb` → `e27673d` → `bbcbc39` → `b7b4213`.

    git merge-tree --write-tree b7b4213 9cce194 -> tree 54b88607…, exit 0 (read from $? FIRST)
    git diff --name-only b7b4213 <TREE>                        -> 47   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only b7b4213..d64c673   (THE MERGE'S DIFF) -> 47   the only one that means anything
    git diff --name-only b7b4213...d64c673  (collapses AT the merge) -> 47
    git diff --name-only b7b4213...9cce194  (THREE dots, pre-merge)  -> 47
    git diff --name-only d46f71f..9cce194   (TWO, branch-only)       -> 47
    git diff --name-only b7b4213..9cce194   (TWO dots, FORBIDDEN)    -> 70
    git diff --name-only d46f71f..d64c673   (merge-base..merge, FORBIDDEN) -> 70
    git diff --name-only d46f71f..b7b4213   (main's advance)         -> 23

**THE FORBIDDEN COUNT IS 70 BY BOTH FORBIDDEN SPELLINGS AND IT IS PURE
LEFT-ENDPOINT DRIFT**: main advanced **23** paths from the cut, the branch
**47**, `comm -12` over the sorted lists is **EMPTY**, and 23 + 47 = 70 —
the arithmetic that proves the two sets disjoint.

**THE FORECAST TAKEN AT THE WRONG LEFT ENDPOINT DIFFERED BY EXACTLY ONE
PATH, AND THAT PATH IS MAIN'S OWN COMMIT.** The tree forecast against
`bbcbc39` and the merge's own tree differ in `docs/STATE.md` and nothing
else. Re-run against `b7b4213`, `merge-tree --write-tree` returns
`54b886076e94e19d5efbaf8d1fded99c2fc2d07f`, which **IS** the merge's
`HEAD^{tree}` byte for byte. This is the RANGE RULE's mechanism observed
live rather than quoted: **verify main's tip at the moment of the merge,
because "or later" can mean fifty-one seconds later.** Parents are
`b7b4213` and `9cce194` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.**

The verifier measured **44** paths at its own ref `cb13957`; its verdict
commit `9cce194` added the card plus `T-010-s8`, `-s9`, `-s10`, which is
the whole difference.

## THREE standing gates — DERIVED from the merge's own 47 paths

| gate | trigger | on these 47 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` outside `docs/` | **1 — FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **33 — FIRES** |
| DOCS GATE | a `docs/` path a code suite reads | **14 — FIRES**, four suites |

- **GRAPH REGEN — FIRES on ONE path**, the fixture's
  `rust-workspace/app/web/panel.ts`, and the gate was **ASKED rather than
  predicted**. One path fires the trigger and 46 files move the graph,
  which is the trigger being deliberately wider than the walk working in
  the direction nobody plans for.
- **BOOT GATE — FIRES, 33 of 47.** `crate-index` is
  `app/src-tauri/crates/nputer-index/**`, inside the `app/src-tauri/**`
  trigger. The lane's own brief called it not-owed and the executor
  corrected that on the branch; it is derived here again rather than
  inherited. Run on scratch port **15051**: exit **0**, both `[nputer]`
  lines observed.
- **DOCS GATE — exit 1**, invoked DIRECTLY with the 47 paths as ARGUMENTS,
  ROOT-RELATIVE, never through `xargs`. **14 of 47 under `docs/`, FOUR
  suites owed** — `cargo test from app/src-tauri/`, `npm test from app/`,
  `npm test from tools/e2e/`, `npx vitest run from lib/parser/`. The run
  reports **12 derived readers across 4 suites**, **0 frontmatter issues**,
  a census of **123 docs-shaped sites in 22 files, 12 of them in 10 files
  resolving into this repo's docs/**, **25 files holding the repository
  root** (11 derived, 0 unlinked, 14 with no linkable site), **1
  package-relative site**, and the root-anchor ledger at 6 entries. All
  four suites ran at the merge AND again after this checkpoint's doc
  writes.
- **`T-010-s10`'s HOLE WAS WORKED AROUND RATHER THAN WALKED INTO.** The
  gate derives its card list from TRACKED files, so this checkpoint's one
  new doc (`T-010-s11`) was `git add`ed BEFORE the gate ran on it. It
  reports 0 frontmatter issues with the card staged, which is a
  measurement and not a hope.

## Suites, every number derived at this checkpoint, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own `$?`
on an unpiped command, captured on the very next token. Every suite was run
at the merge AND again after the doc writes.

- **cargo: 408 passed / 0 failed / 3 ignored** summed over **15**
  `test result:` lines, exit **0** — at the merge, and again on the re-run
  after the doc writes. **THE FIRST POST-DOC-WRITES RUN WAS 407 / 1 / 3 AT
  EXIT 101 AND IT IS RECORDED RATHER THAN RE-RUN AWAY**: it is
  `T-088-s4`'s parked flake, whose armed trigger this fires — see its own
  section below.
- **app: 940/940 across 46 files**, exit **0**, after `npm run build` exit
  **0** — and **931/940 at exit 1** against the regenerated graph before
  the fixtures were reconciled, which is the verifier's measurement
  reproduced exactly. **THE BUNDLE IS BYTE-IDENTICAL TO MAIN'S** —
  `index-C86RloYb.css` / 45.06 kB and `index-DEkJr3K8.js` / 526.42 kB,
  both unmoved, which a merge adding no bundle input requires.
- **parser: 264/264 across 12 files**, exit **0**; `npx tsc --noEmit` exit
  **0**. **The brief and the verdict both said 263** — correct at the
  verifier's ref and stale at mine, because T-096 added one body on
  2026-08-24. The repository wins.
- **E2E: 143/143**, exit **0**, on scratch ports **15050**, **15052** and
  **15053** across three runs; `npm run typecheck` **0**.
- **token lint: selftest 0, lint 0** — clean at **TOKEN 131 / CONTROL 636**
  at the merge and **CONTROL 637** at this checkpoint, the one added file
  being `T-010-s11`. Both counts are PRINTED and pinned by nothing; derive
  them at your own ref rather than quoting these.
- **`npm run lint:docs` exit 0**, run the way CI will run it.
- **`cargo audit` exit 0 — 0 vulnerabilities, 17 informational warnings**
  over **473** locked crates, identical in kind to CONVENTIONS' baseline
  and exactly ONE crate larger than the 472 audited there. This merge adds
  `tree-sitter-rust "=0.24.2"` (checksum `439e577d…`, the maintained
  upstream tree-sitter org, MIT): **exactly one new `[[package]]` block and
  ZERO new transitive crates** — its deps `cc` and `tree-sitter-language`
  were already locked. The `=` pin discipline is honoured, matching its
  three siblings; verified in the manifest, not assumed.

## Documents ticked

- **ARCHITECTURE — SIX sentences corrected in place with the ref**
  (`T-010-s7`, T-101's precedent). Four said `languages: ["ts"]` still
  hides `app/src-tauri/src/agent/**` — C-14's own paragraph plus T-043's,
  T-069's and T-113's, each written as the reason a merge moved no graph,
  all four true AT their merges. **The sentence was its own argument and
  the argument won**; the correction records that a merge under that tree
  can move the graph from here on, which is a new obligation and not only
  a tense fix. The C-07 row's *"Rust language extraction T-010 still
  open"* is now done with the size figures beside it, and the Map-data
  churn paragraph's *"never Rust, never markdown"* parenthesis has spent
  its Rust half — the glob fallback is UNREACHABLE for `.rs` now, so the
  busiest component in this repository gets file-level churn attribution
  for the first time. The markdown half still holds.
- **CONVENTIONS — THE FOUR WALKS row is true again** (`T-010-s1`). It said
  *"A new `.rs` is seen by CONTROL ONLY — the indexer deliberately does
  not collect Rust"*; both halves were false the moment this merged, and
  it is a code input to `cargo test` besides. **THE AUTHORITY COLUMN
  NEEDED NOTHING** — it already named `Lang::for_extension` and
  `walk_root`, which is exactly where the change landed. That is the
  bullet's own design working: the signpost went stale and the gate did
  not. GRAPH REGEN's citation of the row is unaffected.
- **ROADMAP IS TICKED, in two places, and it is DERIVED rather than
  assumed.** Milestone 3's promise that the F-06 remainder "re-enters
  after it" named four cards; that paragraph said *"T-010 and T-015 remain
  planned"* and is now **T-015 alone**. F-06's own backbone entry gains a
  "Since T-010" clause: the REALITY half is no longer one language, and
  drift becomes symmetrical — `app/src-tauri/**` can create and clear
  findings where before it could do neither.
- **The card** is stamped `done`, `built_by: claude-opus-5 @T-010`,
  `verified_by: claude-opus-5 @T-010-verify`, `review: same-model`, and
  carries an `## Integration` section with the reconciliation table.
- **The lane's and the verifier's ten suggestion files stay as filed.**

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else**, before and after — no bind, no connect, no signal, on any
interface. Holder `node` pid **82549**, one socket `TCP [::1]:1420
(LISTEN)`, identical throughout.

1. **THIS MERGE REACHED THE RUNNING WINDOW AND THE APP RELAUNCHED —
   expected, ruled acceptable, and MEASURED rather than assumed.** It
   touches `app/src-tauri/**` on 33 paths, which is `tauri dev`'s restart
   trigger. `target/debug/nputer` was pid **88272**, started **2026-08-24
   14:02:15**, before the merge; it is pid **5686**, started **2026-08-25
   02:10:08**, after — **one second** after the merge commit's own
   timestamp of 02:10:07. The vite process is UNCHANGED at pid 82549 on
   `[::1]:1420`, which is the right asymmetry: the Rust binary rebuilds
   and relaunches, the frontend server does not.
2. **The integrator's `cargo` runs share `target/` with the human's live
   dev app** (T-113's observation, confirmed again): the graph gate, two
   regens, the full cargo suite and the boot check all built into the
   shared directory while the app was running.
3. **The map pane sees a genuinely different graph this time**, unlike the
   last five checkpoints. Every node's file list, the node picture's
   scale, one whole relation row, one relation's KIND and C-05's drift
   ring all move. A human opening the map after this checkpoint is looking
   at a different repository from the one it drew yesterday.

**No process from this integration survives.** Scratch ports **15050** and
**15052**/**15053** (E2E, three runs) and **15051** (boot check) were each
read with `lsof` FIRST (zero rows) and then bind-confirmed free on
`127.0.0.1`, `0.0.0.0`, `::1` and `::` before use, in that order and never
the reverse, and all were free again after. **No `pkill` at any point.** No `npm ci` or `npm install` was
run in the main checkout. **The untracked zero-byte file `z`** still sits
there — not this integrator's, not staged, left alone for the seventh
checkpoint running.

## `T-088-s4` IS UNPARKED, BECAUSE ITS ARMED TRIGGER FIRED HERE

The parked watcher flake
(`docs_watch::tests::startup_arm_watches_the_initial_root`) carried the
condition *"UNPARK THE MOMENT IT REDS A VERDICT OR A MERGE … the first
time it costs a verifier a false REJECTED or an integrator a false red at
a checkpoint."* **It cost one.** The post-doc-writes `cargo test
--no-fail-fast` exited **101 at 407 passed / 1 failed / 3 ignored**, on
that body alone, with the same `expected a docs-changed emit: Timeout` at
the same line.

**THAT IT WAS NOT THIS MERGE IS DERIVED RATHER THAN ASSUMED**, which is
the whole reason the finding exists: `git diff --name-only b7b4213..d64c673
-- app/src-tauri/src/` is **0 files** — 32 of the 33 `app/src-tauri/**`
paths are under `crates/nputer-index/**` and the 33rd is `Cargo.lock` — and
the SAME suite ran **408 / 0 / 3 at exit 0** at the merge on byte-identical
Rust. The immediate full re-run was **408 / 0 / 3, exit 0**; the body alone
re-ran green — and then **IT FIRED AGAIN on the final full run over the
final tree**, same body, same message.

**THE FINAL TALLY AT THIS INTEGRATION IS 3 RED IN 6 FULL-SUITE RUNS** —
three at **408 / 0 / 3 exit 0**, two at **407 / 1 / 3**, one at **406 / 2 /
3**, all six over trees whose Rust is byte-identical — beside **4 isolated
re-runs of the named body, all green**, and one module-scoped run at 52 / 1.
That is an order of magnitude above the 1-in-8 rate that supported parking.
The two tallies are kept apart rather than added: T-088's was 1 red in 2
full runs on 2026-08-24. The predicted condition was present throughout: three lanes live,
one of them drilling, plus the human's `tauri dev`, during the largest
merge this repository has taken. **A CHECKPOINT CAN NO LONGER CLOSE THIS
SUITE WITHOUT RE-RUNNING IT**, which is the briefing cost the parking note
already named, now paid twice in one integration. Status returns to
`suggested` for triage; **the FIX is not the integrator's and could not
have been made here** — the fence is `[app-shell]`, held live by T-123.

**AND THE FINDING IS NARROWER THAN THE DEFECT — A SECOND BODY WENT RED AT
THIS CHECKPOINT, WHICH IS NEWS THE FILE DID NOT CARRY.** A third full run
over the final tree exited **101 at 406 / 2 / 3**, with
`docs_watch::tests::docs_created_after_a_docsless_startup_arms_and_emits`
failing beside the named one **at the SAME panic site,
`src/docs_watch.rs:1523`, with the same message**. The mechanism is one
HELPER and not one body: `recv_emit`, a 10-second wall-clock bound on
FSEvents delivery, **called at 20 sites across 11 test bodies** in that
module. Both bodies are green every time they are re-run in isolation and
red under the loaded full suite, which locates the cause in concurrency
with the rest of the suite rather than in either body. **The finding's
title still says "a watcher startup-arm test", singular; renaming is
triage's call, but the blast radius to quote is eleven callers.**

**WHAT THIS CHECKPOINT THEREFORE CLAIMS ABOUT CARGO, EXACTLY.** The suite
is green on the final tree — **408 / 0 / 3, exit 0**, and that is the last
run — and it also produced **407 / 1 / 3** twice and **406 / 2 / 3** once
over the same Rust, every failure inside `docs_watch::tests` and every one
through `recv_emit`. **No other body in any of the 15 `test result:` lines
failed at any point in this integration.** That is stated as a range rather
than as a single green, because a single green would be the less true of
the two.

## The board, derived from disk at this checkpoint

**177 flat task files — 77 done / 43 planned / 41 parked / 13 suggested /
0 verifying / 3 building; 26 in `rejected/`.**
77 + 43 + 41 + 13 + 3 = 177. T-010's stamp moves done from 76 to 77 and
building from 4 to 3; this checkpoint's own `T-010-s11` is the 177th file,
and `T-088-s4` moves parked → suggested when its armed trigger fires below.
Both counted AFTER they were written rather than before.

**THE SUGGESTION BACKLOG IS THIRTEEN AND ELEVEN OF THEM ARE T-010's**,
which is what a size-M card with an adversarial verifier produces:
`T-010-s1`…`-s10` from the lane and the verdict, plus `T-010-s11` filed
here, beside `T-096-s1` from the previous checkpoint and the unparked
`T-088-s4`. The eighth triage took the backlog to zero four commits ago;
whoever triages next is looking at a fresh cycle in which ONE card supplied
eleven of the thirteen entries.

## Provenance — SELF-DECLARED, never read off a trailer

T-010 is **built by `claude-opus-5` and verified independently by a
separate `claude-opus-5` session**; `built_by: claude-opus-5 @T-010`,
`verified_by: claude-opus-5 @T-010-verify`, `review: same-model` — same
model, different hand, which is what that value means (T-104's ruling:
`review:` means blindness rather than model diversity). **The
`Co-Authored-By` trailer on this lane's commits is a harness constant and
is NOT evidence of a model** — T-085 proved it and T-101 made the proof
sharper with a counterexample inside one session. Nothing here reads a
model off a commit signature.

**77 done cards — 57 `same-model`, 14 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 57 + 14 + 5 + 1 = 77. T-010 moves `same-model` from 56
to 57.

At this checkpoint main contains T-010's merge `d64c673` plus this commit.
Cargo, app, parser, E2E, token lint and its selftest, the docs gate, the
audit and the graph-currency gate are all green; **all three standing
gates were DERIVED and all three FIRED and were RUN.** Nothing is broken.

## In progress / broken right now

**THREE LANES ARE LIVE — see the table at the top of this file, which is
derived from `git worktree list` and is the thing to re-derive rather than
to quote.** `[crate-index]` and `[docs/architecture/components/]` were
released by this checkpoint. `git branch` still lists every lane this repo
has ever run, which is the intended asymmetry: the BRANCH is kept and only
the WORKTREE is removed.

**A LANE CUT NOW OWES ITS REGEN FORECAST AGAINST 1874 SYMBOLS / 1842 EDGES
at 890 866 bytes / 172 files**, and should **forecast the DELTA and
re-derive the endpoints**. Every figure any earlier checkpoint quotes for
the graph is now wrong by an order of magnitude, and a lane that touches
`app/src-tauri/**` — which four cards do — moves the graph for the first
time in this repository's life.

## Next up

1. **THE SIZE IS THE ONE THING TO WATCH NOW.** `T-010-s3` is not blocking
   and the floor argument is structural, but the graph is at 89.09% of its
   budget and **nothing reports the headroom** — no gate, no test, no line
   of output. The next thing to add symbols at this scale has 109 134
   bytes to spend, and it will find out by `apply_budget` starting to drop
   symbol arrays rather than by being told. That is the finding worth
   promoting at the next triage.
2. **THE REGISTRY HAS A NEW DRIFT ROW WAITING FOR THE ARCHITECT.**
   `D1:C-05->C-07` (`T-010-s4`) is real, undeclared, and deliberately not
   drained at the merge that surfaced it — the standing rule. C-05's own
   "Depends on" column already reads *"C-07 when F-06 lands"*, so the
   declaration is arguably owed rather than merely available.
3. **TWO ROUTED SECURITY-ADJACENT FINDINGS ARE LIVE AND NEITHER BLOCKS.**
   `T-010-s8`: three hostile source shapes abort the indexer at exit 134,
   measured PRE-EXISTING against the base binary on TS shapes — but
   `index_repo` hosts the indexer IN-PROCESS, so the abort takes the app
   with it, and `IndexOutcome::Error`'s *"never a panic"* comment is false
   for that class. `T-010-s9`: the `cargo:` package-id qualifier closes
   the npm/cargo collision from one side only, and the TS derivation
   reports nothing — silently wrong rather than loudly. Latent.
4. **`T-096-s1` is still open** — a parser body whose TITLE claims a layer
   order it cannot check. Fence `[lib-parser]`, free.
5. **`T-010-s11` is a two-line manifest edit** for whoever next holds
   `[crate-index]`: the crate still calls itself a TS/JS indexer in two
   places.
6. **`T-088-s4` IS BACK IN THE BACKLOG AND IT IS THE ONE THE NEXT TRIAGE
   SHOULD NOT PARK AGAIN.** Its trigger was armed for exactly this and
   exactly this happened. The fence `[app-shell]` is held by T-123, so it
   waits on that lane rather than on a decision.
7. **A CONCURRENT SESSION IS WRITING TO MAIN IN THIS CHECKOUT.** `b7b4213`
   landed fifty-one seconds before this merge, from another hand. That is
   not a defect and it broke nothing — but an integrator here should
   `git rev-parse` main at the moment of the merge and read the merge's
   own first parent afterwards, rather than trusting a tip read a minute
   earlier.
8. **The GNU `xargs` column still closes at the first push**, and
   `git remote` still returns zero remotes.
9. **There is no outstanding @human item.**
