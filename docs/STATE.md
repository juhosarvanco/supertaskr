# State

Updated: 2026-08-25 by the T-123 integrator (independent hand, size M).

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: THREE LANES ARE
LIVE, ONE OF THEM IS STOPPED AND WAITING ON @HUMAN, AND THIS MERGE HANDS
THE ARCHITECT A RULING THE MAP NOW SHOWS.** T-123 puts this repository's
**FIRST COMPONENT CYCLE** on the map — `C-10 ⇄ C-14`, undeclared in one
direction and declared in the other — and gives C-10 its first drift
finding in its life. Nothing is broken; the registry is the architect's
to rule on and the drift is deliberately carried, not drained.

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is a
scratch worktree and not a lane (the T-089 correction in CONVENTIONS).
No detached entry was live at this read; two were live an hour earlier,
belonging to T-033's and T-079's drills.

| lane | fence (`touches:`) | where it is |
|---|---|---|
| **T-110** | `[app-dispatch]` | **STOPPED — two rejections, escalated to @human** |
| **T-033** | `[docs/architecture/components/, lib-parser, app-map]` | building |
| **T-079** | `[tools/e2e]` | building |

**THERE IS NO TIP COLUMN AND THAT IS THE FOURTH MEASUREMENT SAYING SO**
(`b7b4213` removed it; T-010 and T-031 each confirmed it). Between the
lane list read at the start of this turn and the one read at its end,
T-033 moved `25a9e2c` → `96f3ec7` → `9b9472b` and T-079 `25a9e2c` →
`b0b886d` → `2c21377`. **A live lane's tip is a live-environment fact,
not a function of a tree.** What is stable is WHICH lane holds WHICH
fence. For a tip, run `git worktree list`.

**THE BOARD CANNOT TELL YOU A LANE'S PHASE, AND T-110 IS THIS
CHECKPOINT'S PROOF.** All three cards read `status: building` on disk,
derived here — but T-110 has been REJECTED TWICE by two independent
verifier sessions and its circuit breaker has fired
(`docs/rooms/t110-second-rejection.md`, committed at `06f26cb` by a
concurrent session). Its card still says `building`. `git worktree list`
is the authority on which fences are HELD; the board's `status:` is not,
and neither carries a PHASE. Read the rooms.

**T-123's OWN WORKTREE IS REMOVED IN THE SAME BREATH AS THIS COMMIT**, in
the order lane-protocol rule 6 fixes (merge, then checkpoint, then
remove), so **`[app-shell]` and `[app-agent]` are FREE**. That matters
immediately: `T-088-s4`'s fix has been waiting on `[app-shell]` since it
was unparked, and it is dispatchable the moment this lands. Every other
fence in ARCHITECTURE's slug table is free too — `app-board`,
`app-interview`, `crate-index`, `.github/`, `docs/CONVENTIONS.md`,
`method/`.

## Just completed

**T-123 — a registered interview keeps its folder reachable, and the
routing predicate means RESUMABLE rather than merely PRESENT.** F-03,
milestone 4, size M, `touches: [app-shell, app-agent]`, **fence never
widened**. Main-before **`6802126`**, lane tip **`01086d5`**, merge
**`0358c0c`**, this checkpoint after it.

**THIS CARD WAS REJECTED, REBUILT BY A FRESH EXECUTOR, AND APPROVED ON A
SECOND INDEPENDENT PASS — and all four documents are on the record in the
card, in order.** Built by `claude-opus-5 @T-123`; REJECTED by
`claude-opus-5 @T-123-verify`; rebuilt by `claude-opus-5 @T-123-rebuild`;
APPROVED by `claude-opus-5 @T-123-verify2`. **Nothing above each new
heading was edited** — T-101's precedent, and the reason it matters here
is that the rebuild went PAST the verdict's proposed fix, so the record of
what was refused is also the record of why the wider fix was right.

## What this card MEANS, which is not the same as what it changed

**THE INTERVIEW'S OWN FIRST ACT USED TO MAKE ITSELF UNREACHABLE.** Stage 0
scaffolds `docs/ROADMAP.md`. A folder holding a ROADMAP has a plan. A
folder with a plan was never routed to genesis (T-026 criterion 5, and
that guard is correct — there is no overwrite path in this app by
construction). The resume offer T-029 built lives only behind the genesis
screen. So the session that wrote the plan was stranded by the plan it
wrote, on a folder whose `docs/tasks/` was empty and whose ROADMAP had
zero features, with no way back in from the UI.

**A REAL @HUMAN HIT THIS**, on this project's first genesis interview
against a real model, on 2026-08-24. `~/nputer-genesis-probe` is that
live instance and was **not touched by anyone in this lane** — the
executor, both verifiers and this integrator all built every fixture in a
temp directory instead.

**THE GUARD WAS RIGHT AND THE MISSING INPUT WAS THE SESSION REGISTRY.**
The routing question was *"does this folder hold a plan?"* and never
*"is one of OUR interviews running on it?"* — even though that second
fact has an owner. The routing now asks both:
`routes_to_genesis(probe, reach)` is `!probe.has_plan() || reach ==
Resumable`, one rule with one implementation in `docs_watch.rs` and four
callers, and the registry half has exactly one owner in C-14 that
`docs_watch.rs` asks rather than stat-ing `.nputer/` itself.

**AND A NOT-RESUMABLE SESSION CORRECTLY DOES NOT OPEN A SCREEN WHERE
NOTHING CAN HAPPEN — which is precisely what the first pass got wrong.**
The rejected build asked `genesis_record(..).is_some()`, true of a planner
entry with no usable `native_session_id` and of one whose id the T-039
boundary refuses. Routing either of those to genesis lands the user on a
screen with no offer, no working control and no way off it — a fresh
instance of T-050's own ruling that no reachable screen is a dead end, on
the reproduction's own folder shape. The verifier reproduced both through
the real `apply_genesis_pick` and rejected on it.

**THE REBUILD FIXED IT AT THE SOURCE AND WENT FURTHER THAN THE VERDICT
ASKED, FOR A REASON WORTH KEEPING.** The verdict proposed gating on
`record.native_session_id.is_some()` — right semantics. Taking only that
would have left the predicate a `bool`, and **a `bool` cannot express
"present, and no way back in" as distinct from "nothing of ours is
here": the two are literally the same value**, so no test could ever show
them differing — while CONVENTIONS requires a refusal to be shown
differing from an absence. C-14 therefore gained
`GenesisReachability { NoSession, NotResumable, Resumable }`. Naming the
third state is what made the missing control ASSERTABLE. The `if planned`
backstop the first build needed became UNREACHABLE and was removed rather
than kept as a guard no input can reach and no drill can red — a change
the first verdict did not anticipate, which the second attacked directly
and upheld.

**ZERO FRONTEND CHANGE, RE-DERIVED HERE RATHER THAN INHERITED.**
`app/src/**`, `app/test/**`, `lib.rs`, `acl_pin.rs`, `Cargo.toml`,
`Cargo.lock` and `app/package.json` are all **0-file** in this merge's
diff. IPC stays at FOURTEEN, the 92-grant `core:default` set is untouched,
no dependency moved, so `cargo audit` was not owed. The route lands on the
existing `PickOutcome::Genesis` variant `App.tsx` already renders.

## THE ARCHITECTURAL NEWS: THIS REPOSITORY'S FIRST COMPONENT CYCLE

**AND IT IS THE ARCHITECT'S TO RULE ON. IT IS NOT DECLARED HERE AND IT
IS NOT "FIXED" HERE.** `arch --root` over the regenerated graph, measured
at this checkpoint:

    component  C-10  Docs watcher  files=3  declared_deps=1  observed_deps=2  drift=D1
    edge  C-10 -> C-14  undeclared  observed=1     <- NEW
    edge  C-14 -> C-10  confirmed   observed=2     <- DECLARED since T-025

The registry declares exactly one direction: `C-10-docs-watcher.md` reads
`depends_on: [C-06]` and `C-14-agent-runner.md` reads `depends_on:
[C-10]`. So the observed graph now holds a two-node cycle, **C-10 ⇄
C-14**, and **C-10 picks up the FIRST drift finding of its life** — it
has been in this map since T-003 and has never carried one.

**THE MECHANISM, STATED SO IT IS IMPOSSIBLE TO MISS.** The single new file
edge is `docs_watch.rs -> agent/sessions.rs (import) symbols=[GenesisReachability]`.
`docs_watch.rs` is C-10; the accessor is C-14's. **This follows from the
CARD's own criterion 2, not from an executor's choice**: that criterion
says the shell *"SHALL ask `sessions::genesis_record` (or a sibling
accessor added beside it in C-14)"* and *"SHALL NOT stat `.nputer/` or
re-parse that JSON itself"*, and *"IF the accessor's current shape does not
answer this question THEN the new one lives in C-14 beside it and not in
`docs_watch.rs`"*. Any spelling that obeys that sentence puts a C-10 → C-14
edge in the graph — moving the TYPE would not help, because the CALL is
the edge. **No earlier pass noticed**: not the planner who wrote the
criterion, not the first executor, not the first verifier, not the
rebuild. The second verifier found it and filed `T-123-s8`.

**THREE ANSWERS ARE OPEN and `T-123-s8` argues each**: declare
`C-10 depends_on: [C-06, C-14]` and accept the cycle as architecture;
invert it, so C-14 owns the routing rule and C-10 calls nothing (which
contradicts criterion 2's own placement); or route the reachability fact
through C-05, which owns both today. **Left undeclared on the standing
rule — the integrator regenerates, the ARCHITECT rules on the registry**
— the same disposition `D1:C-05->C-07` took at T-010's checkpoint and
still holds. Note for whoever rules: **T-033 is live on
`[docs/architecture/components/]` right now**, so the registry edit that
answers this has a lane holding its fence.

## THE REGEN — the delta held, the endpoints did not, and the SECOND one is a sharper measurement than T-010's

`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph --
--ignored`, exit **0**, run TWICE. `index --check --root ../..` was
**exit 1, a REAL red** at the merge (both count lines plus a `~3` file
list, which is how it is told apart from the `--root` false red) and
**exit 0, CURRENT** after the second regen **and again after every doc
write in this checkpoint**.

| | committed at `6802126` | fresh at this checkpoint |
|---|---|---|
| bytes | 894 664 | **895 891** (+1 227) |
| files | 172 | **172** (+0 — no file added on disk) |
| symbols | 1885 | **1889** (+4) |
| edges | 1848 | **1849** (+2 −1) |

**BOTH VERDICTS AND THE REBUILD NOTES QUOTE `890 866 · 172 · 1874 ·
1842` → `892 093 · 172 · 1878 · 1843`, AND THEY ARE STALE AT THIS REF
WHILE THEIR DELTA IS EXACT.** T-031's checkpoint moved the committed graph
underneath them. **+1 227 bytes / +4 symbols / +1 net edge reproduces to
the byte at both refs** — the same shape T-031's integrator recorded one
merge earlier, and the second consecutive checkpoint where a forecast's
DELTA survived an intervening move in its own endpoints. Forecast the
delta; re-derive the endpoints.

**THE SECOND REGEN WAS NEEDED, AND THIS MEASUREMENT IS STRONGER THAN THE
ONE T-010 RECORDED.** After the two indexed fixture files were reconciled,
`index --check` was **exit 1, STALE — with ALL FOUR HEADLINE FIGURES
IDENTICAL ON BOTH SIDES**: `895 891 bytes · 172 files · 1889 symbols ·
1849 edges` committed and fresh alike. The only difference is `loc` —
`architecture-dogfood.test.ts` 1949 → **1988** and
`map-dogfood-render.test.tsx` 483 → **494**. The FILE's byte count is
identical across that regen (895 891 both sides) while its sha256 moves
**`7041d9e3…` → `7af1c79f…`**. T-010's integrator measured that a BYTE
comparison would have missed it; **a comparison of all four printed
figures would have missed it too.** Only `index --check`, which compares
CONTENT, can tell. A checkpoint quoting any headline number as proof of
currency ships a stale graph.

## THE FIXTURES — five assertions, four bodies, three titles, none loosened

The regen moves the two live-registry app fixtures, and every value was
DERIVED from the fresh `arch` report and the failure diffs together rather
than read off one of them:

| fixture | assertion | from | to |
|---|---|---|---|
| dogfood | `findings` | 14 | **15** — the new `D1:C-10->C-14` |
| dogfood | relation table | 34 rows | **35** — new `C-10→C-14 undeclared 1` |
| dogfood | tally in the body title | 14 / 11 / 9 | **14 / 12 / 9** |
| dogfood | `drift` | 7 nodes | **8** — C-10 joins |
| dogfood | `declaredOnly` | 3 ids | **3, UNMOVED** — asserted, not assumed |
| map | rendered edges | 34 | **35** |
| map | rendered undeclared | 11 | **12** |
| map | body title | *"the full 34-edge relation table"* | **35-edge** |

**THE THIRD LIVE-REGISTRY FIXTURE WAS VERIFIED NOT OWED RATHER THAN
SKIPPED**: `lib/parser/test/smoke.test.ts` pins the component ID LIST, no
component is declared here, and it is **264/264 at exit 0** throughout —
CONVENTIONS' own rule that a merge regen alone moves only the two app
fixtures. **C-14 does NOT join the drift set and that asymmetry is worth
keeping**: it is only the TARGET of the new edge and it already declares
C-10, which is exactly why this closes a CYCLE rather than adding a second
independent row. Both fixture comments say what their body is NOT
asserting — the map body cannot see C-10's new drift ring, and says so.

## Ranges, every dot count stated, at their own refs

**MAIN MOVED FOUR TIMES UNDER THIS LANE AND ONCE DURING THIS TURN**, and
for the first time in this repository's record **an integrator had to WAIT
rather than merge**: at the start of this turn `git status` showed another
session's uncommitted T-031 checkpoint in this checkout — `docs/STATE.md`
modified thirteen seconds earlier — with `docs/rooms/t110-second-rejection.md`
STAGED. **Merging into that index would have swept another session's file
into this merge commit**, breaking "nothing written into the merge". The
merge waited for `6802126` and `06f26cb` to land. That is STATE's own
standing observation (item 7 at T-010's checkpoint) costing real time
rather than being a note.

    git merge-tree --write-tree 6802126 01086d5 -> tree e23277c5…, exit 0 (read from $? BEFORE use)
    git diff --name-only 6802126 <TREE>                        -> 13   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 6802126..0358c0c   (THE MERGE'S DIFF) -> 13   the only one that means anything
    git diff --name-only 6802126...0358c0c  (collapses AT the merge) -> 13
    git diff --name-only 6802126...01086d5  (THREE dots, pre-merge)  -> 13
    git diff --name-only d46f71f..01086d5   (TWO, branch-only)       -> 13
    git diff --name-only 6802126..01086d5   (TWO dots, FORBIDDEN)    -> 107
    git diff --name-only d46f71f..0358c0c   (merge-base..merge, FORBIDDEN) -> 107
    git diff --name-only d46f71f..6802126   (main's advance)         -> 94

**THE FORBIDDEN COUNT IS 107 BY BOTH FORBIDDEN SPELLINGS AND IT IS PURE
LEFT-ENDPOINT DRIFT**: main advanced **94** paths from the cut, the branch
**13**, `comm -12` over the sorted lists is **EMPTY**, and 94 + 13 = 107 —
the arithmetic that proves the two sets disjoint. `git merge-base
--is-ancestor 6802126 0358c0c` exits **0**, which is why three dots
collapses to the prescribed set at the merge and not before it.

**THE FORECAST TREE IS THE MERGE'S OWN TREE, BYTE FOR BYTE.**
`merge-tree --write-tree` returned `e23277c5180619064ee26ca273874d7514149558`
and `git rev-parse 0358c0c^{tree}` is the same string. Parents are
`6802126` and `01086d5` and nothing else; **NOTHING WAS WRITTEN INTO THE
MERGE COMMIT.**

**EVERY EARLIER PASS MEASURED 9 PATHS AND ALL OF THEM WERE RIGHT.** The
rebuild and the second verifier both derived **9** at `338a7e2`; the
verdict commit `01086d5` then added this card's second verdict plus
`T-123-s6`, `-s7`, `-s8`, `-s9` — four files — and 9 + 4 = **13**. Main
advanced **17 first-parent commits** under this lane, `d46f71f` →
`6802126`, carrying T-015's, T-096's, T-010's and T-031's merges and their
checkpoints, the eighth triage, and three dispatch batches.

## THREE standing gates — DERIVED from the merge's own 13 paths

| gate | trigger | on these 13 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **3 — FIRES, and was OWED** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **3 — FIRES** |
| DOCS GATE | a `docs/` path a code suite reads | **10 — FIRES**, three suites |

- **GRAPH REGEN — AND THIS MERGE IS THE FIRST IN THIS REPOSITORY'S LIFE
  WHOSE REGEN IS OWED *ONLY* BECAUSE OF THE `*.rs` CLAUSE.** The four
  TS/JS suffixes alone match **0 of 13**. The clause was added at
  `e1f3023` by the architect, absorbing **`T-123-s5` — this lane's own
  finding**, filed the night before by its own rebuild. **A lane's finding
  made its own merge's gate fire**, and without it this merge is exactly
  the silent miss that finding predicted: a real +4 symbols and +1 edge
  behind a trigger reading zero. The gate was ASKED, not reasoned from —
  which is what the bullet instructs and what caught the gap originally.
- **BOOT GATE — exit 0**, scratch port **15111**, both `[nputer]` lines
  observed: `[nputer] project folder: /Users/ujju/Projects/nputer` and
  `[nputer] window "main" created`.
- **DOCS GATE — exit 1 (the gate's verdict: FIRES)**, invoked DIRECTLY
  from the repo root with the 10 paths as ARGUMENTS, ROOT-RELATIVE, never
  through `xargs`. **THREE suites owed** — `npm test from app/`,
  `npx vitest run from lib/parser/`, `npm test from tools/e2e/` — and all
  three ran at the merge AND again after this checkpoint's doc writes.
  It reports **12 derived readers across 4 suites**, **0 frontmatter
  issues**, *"every live task card's frontmatter parses, with a legal
  status"*, a census of **129 docs-shaped sites in 22 files, 12 of them in
  10 files resolving into this repo's docs/**, **25 files holding the
  repository root** (11 derived, 0 unlinked, 14 with no linkable site),
  **1 package-relative site**, and the root-anchor ledger at 6 entries.
  The census is DERIVED on every run and transcribed nowhere — 129 is this
  tree's, not the 125 the rebuild measured.
- **`T-010-s10`'s HOLE DID NOT BITE, AND THAT IS DERIVED RATHER THAN
  LUCKY.** The gate reads TRACKED files only, so an UNSTAGED new doc is
  invisible to it. **This checkpoint adds NO new file** — `git status`
  shows seven modified paths and zero additions — so there was nothing to
  `git add` first. A checkpoint that DOES add one still must.

## Suites, every number derived at this checkpoint, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own `$?`
on an unpiped command, captured on the very next token. Every suite was
run at the merge AND again after the doc writes.

- **cargo: 418 passed / 0 failed / 3 ignored, exit 0** on the FINAL tree,
  summed programmatically over **15** `test result:` lines. **THAT IS THE
  LAST OF FIVE RUNS AND THREE OF THE OTHER FOUR WERE RED — see the flake
  section below, because a single green would be the less true of the
  two statements.** The 3 ignored are unmoved: the `#[ignore]`d real-CLI
  smoke stays ignored, no model call, no CLI spawn.
- **app: 958/958 across 46 files**, exit **0**, after `npm run build` exit
  **0** — and **954/958 at exit 1** against the regenerated graph before
  the fixtures were reconciled, four bodies in the two dogfood files,
  which is the expected shape reproduced exactly. **The brief and both
  verdicts say 940**; correct at the lane's base `d46f71f` and stale at
  mine, because T-031 merged eighteen bodies on 2026-08-25.
- **parser: 264/264 across 12 files**, exit **0**; `npx tsc --noEmit` exit
  **0**. **The notes and both verdicts say 263** — correct at their refs,
  stale at mine since T-096. The repository wins; the third checkpoint
  running to record this same correction.
- **E2E: 143/143**, exit **0**, scratch ports **15110**, **15112** and
  **15113** across three runs; `npm run typecheck` **0**.
- **token lint: selftest 0, lint 0** — clean at **TOKEN 131 / CONTROL
  652**. Both counts are PRINTED and pinned by nothing; derive them at
  your own ref rather than quoting these.
- **`npm run lint:docs` exit 0**, run the way CI will run it, twice.
- **`cargo audit` exit 0 — 0 vulnerabilities, 17 informational warnings**
  over **473** locked crates, identical to CONVENTIONS' baseline in kind
  and to T-010's in count. **It was NOT OWED and is recorded as such**:
  `Cargo.lock` and both manifests are 0-file in this diff, so no crate
  moved. Run anyway because it is cheap and the baseline is worth
  re-confirming.
- **`index --check` exit 0** after the second regen and **again after
  every doc write**, which is the confirmation the GRAPH REGEN bullet
  assigns to the integrator by hand.

## `T-088-s4` — THE HONEST TALLY, AND IT IS THE WORST RATE YET

`docs_watch::tests::startup_arm_watches_the_initial_root` fired **3 times
in 4 full-suite runs** at this integration — **417 / 1 / 3 at exit 101**
three times, **418 / 0 / 3 at exit 0** once, and the green is the LAST
run over the FINAL tree. One isolated re-run of the named body was
**green**. **NOTHING WAS RE-RUN SILENTLY**: every run above is counted,
including the ones that made the red go away.

**THIS MERGE TOUCHES `docs_watch.rs`, SO T-010's EXONERATION ARGUMENT IS
NOT AVAILABLE AND A STRONGER ONE WAS DERIVED.** T-010 could say
`app/src-tauri/src/` was a 0-file diff. Here it is a 3-file diff. Instead:
**the ENTIRE `app/src-tauri/src/` tree at the merge is byte-identical to
the lane tip `01086d5`** (`git diff --name-only 01086d5 0358c0c --
app/src-tauri/src/` is **0 files**, because main touched 0 files there
under this lane) — and that exact Rust ran `cargo test --no-fail-fast`
**green at 393/0/3 four times** across the rebuild and the second
verification. The failing body and `recv_emit` are **untouched by this
merge's diff**, and the panic is the same `expected a docs-changed emit:
Timeout` inside `recv_emit`. **The line number moved 1523 → 1648 and the
SYMBOL did not**, which is CONVENTIONS' own "a citation names a symbol,
not a line" happening live in the file that rule is quoted about.

**THE BLAST RADIUS IS UNCHANGED AND ONE NEIGHBOURING NUMBER IS NOT — filed
for triage as a RATE hypothesis, not as a finding.** `recv_emit` is still
called at **20 sites across 11 bodies** (21 occurrences including its own
definition, identical before and after this merge). But T-123 adds **3
bodies to `docs_watch.rs`'s test module, 53 → 56**, each building a temp
tree and driving the real pick. That is the one thing about this merge
that could move the flake's RATE without touching its mechanism — more
bodies competing for wall clock inside one test binary against a
10-second FSEvents bound. **Four runs is not a controlled experiment and
this is labelled a hypothesis deliberately**; the load was also genuinely
high (T-033's Playwright suite ran concurrently through the first two
runs, 15-minute load average 9.08).

**THE THREE TALLIES ARE KEPT APART RATHER THAN AVERAGED**: T-088's was 1
red in 2 full runs; T-010's 3 in 6; T-031's **0**; this one **3 in 4**.
**THE FIX IS NOW UNBLOCKED** — the fence is `[app-shell]`, held live by
T-123 until this commit, **and released by it**. `status: suggested`, and
it is the one the next triage should not park again.

## Documents ticked

- **ARCHITECTURE — TWO CLAUSES CORRECTED IN PLACE WITH THE REF, and one
  of them is false in a way worth preserving** (T-101's precedent). (1)
  C-05's *"a folder that already holds a plan is routed to the ordinary
  open"* now carries its ONE exception inline. (2) The veto-only
  parenthetical — *"it is reached only where the probe already said 'no
  plan'"* — **is now FALSE while the PROPERTY it states is still TRUE**,
  which is exactly the kind of clause to correct rather than delete: the
  re-read is reached wherever `routes_to_genesis` said genesis, and the
  veto survives on a different derivation (`reach` is read ONCE and
  CARRIED, so only the docs half can move between the two readings, and it
  can only push `has_plan` toward true). **That carried-read half is the
  one thing the suite does not pin** — `T-123-s6`, a drill survivor. Two
  new paragraphs record T-123's account in C-05's genesis bullet and
  C-14's entry, including the cycle and the CLI-less residual.
- **ROADMAP IS TICKED IN TWO PLACES AND ONE IS A CORRECTION.** F-03's
  milestone-3 narrative gains T-123's paragraph, written in the entry
  style the section uses — what a user could not do before and can now.
  And T-064's own paragraph said landing on the interview screen over a
  plan-holding folder is *"the one state 'no overwrite path exists' is
  supposed to make unreachable"*; **that sentence now needs its
  exception**, corrected in place with the ref rather than deleted.
- **CONVENTIONS NEEDED NOTHING, AND THAT IS THE INTERESTING ANSWER.** The
  one edit this merge would have owed — `*.rs` in GRAPH REGEN's trigger —
  **was already made at `e1f3023`**, by the architect, absorbing this
  lane's own `T-123-s5`, before the merge existed.
- **The card** is stamped `done`, `built_by: claude-opus-5 @T-123
  (rebuilt after rejection by claude-opus-5 @T-123-rebuild, 2026-08-25)`,
  `verified_by:` naming BOTH passes, `review: same-model`, and carries an
  `## Integration` section. **The `verified_by` value uses EM DASHES and
  no colon-space**, and it was PARSED with the same `yaml` package
  lib/parser uses to prove it is a flat scalar rather than a nested
  mapping — the trap that has broken a card three times.
- **All nine suggestion files stay as filed, and `T-123-s5` records its
  DISCHARGE rather than looking open**: a `closed_by: e1f3023` line plus
  the argument, the shape `T-081-s7` uses. **Status stays `suggested` on
  purpose** — CONVENTIONS' fourth-question ruling is that "resolved by
  other work" is a DISPOSITION and disposition belongs to TRIAGE, not to
  the integrator.

## @HUMAN — FIVE ITEMS, AND THEY ARE OF THREE DIFFERENT KINDS

**Do not answer these in one breath; they are not the same kind of
question.**

1. **NEW, and it is T-123's own — a LOOK, and it is the reproduction run
   backwards.** Open a folder whose interview has banked stage 0 and
   confirm the resume offer is there and takes you back in.
   `~/nputer-genesis-probe` is the live instance; its session id is in its
   own `.nputer/sessions.json`. **And the part to notice while you are
   there**: on that newly reachable screen, a user with **NO supported
   CLI** meets three controls and **none of them can succeed** — resume
   answers `CliNotFound`, *"Start a fresh session"* answers
   `AlreadyPlanned` (`genesis_fresh` refuses a planned folder BY DESIGN,
   criterion 7), and the hand-driven kickoff the CLI-less path offers
   answers `AlreadyPlanned` too (`T-123-s1`). All three are disclosed at
   the site, routed as suggestions, and **explicitly judged non-blocking
   by the second verifier**, who wrote down the four reasons so a reader
   can disagree with them. The screen is not sealed — ⌘O/⌘N work — but
   that is keyboard-only reach, the same shape you already ruled on at
   T-020-s1.
2. **A DECISION, not a look, and it is the urgent one: T-110's escalation
   room** (`docs/rooms/t110-second-rejection.md`). T-110 has been rejected
   twice by two independent verifiers on two different defects; the
   circuit breaker fired and no third executor was dispatched. Nothing is
   broken — T-110 has never merged — but the `[app-dispatch]` fence stays
   held while it sits.
3–5. **THREE PERCEPTION QUESTIONS ABOUT THE BOARD, carried forward
   unchanged from T-031's checkpoint** and still outstanding: the
   soft-issue mark's amber ink against all six status fills in both
   schemes; whether the `issues` section belongs FIRST in the panel body;
   and whether `max-w-24` is the right badge clip. They can be answered in
   one sitting with the app already running.

## The board, derived from disk at this checkpoint

**191 flat task files — 79 done / 41 planned / 41 parked / 27 suggested /
0 verifying / 3 building; 26 in `rejected/`.**
79 + 41 + 41 + 27 + 0 + 3 = 191. T-123's stamp moves done 78 → 79 and
**verifying 1 → 0**; this checkpoint adds no file.

**THE SUGGESTION BACKLOG IS 27 AND TWO CARDS SUPPLIED TWENTY OF THEM** —
`T-010` eleven and `T-123` **nine**, beside `T-031`'s five, `T-096-s1` and
the unparked `T-088-s4`. T-123's nine are the shape a REJECTED-then-
rebuilt card produces: two from the first executor, one from the first
verdict, two from the rebuild, four from the second verdict.

## Provenance — SELF-DECLARED, never read off a trailer

T-123 is **built by `claude-opus-5`, rebuilt by a separate `claude-opus-5`
session after a rejection, and verified by TWO further independent
`claude-opus-5` sessions**; `review: same-model` — same model, different
hand, which is what that value means (T-104's ruling: `review:` means
blindness rather than model diversity). **The `Co-Authored-By` trailer on
this lane's commits is a harness constant and is NOT evidence of a model**
— T-085 proved it and T-101 sharpened the proof. Nothing here reads a
model off a commit signature.

**79 done cards — 59 `same-model`, 14 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 59 + 14 + 5 + 1 = 79. T-123 moves `same-model` 58 → 59.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else**, before and after — no bind, no connect, no signal, on any
interface. Holder `node` pid **82549**, one socket `TCP [::1]:1420
(LISTEN)`, identical throughout.

1. **THIS MERGE REACHED THE RUNNING WINDOW AND THE APP RELAUNCHED —
   expected, and MEASURED rather than predicted, as the brief required.**
   It touches `app/src-tauri/**` on 3 paths, which is `tauri dev`'s
   restart trigger. `target/debug/nputer` was pid **5686**, started
   **2026-08-25 02:10:08** (T-010's merge relaunched it), and is pid
   **82593**, started **2026-08-25 03:17:33** — **one second** after this
   merge commit's own timestamp of **03:17:32**, same parent **82364**.
   The vite process is UNCHANGED at pid 82549 on `[::1]:1420`, which is
   the right asymmetry: the Rust binary rebuilds and relaunches, the
   frontend server does not. **The second consecutive merge to produce a
   one-second signature**, which is now a reliable way to attribute a
   relaunch.
2. **The integrator's `cargo` runs share `target/` with the human's live
   dev app** (T-113's observation, confirmed again): the graph gate, two
   regens, five full cargo suites, the audit and the boot check all built
   into the shared directory while the app was running.
3. **The map pane sees a genuinely different graph.** One whole relation
   row appears, C-10 gains a drift ring for the first time, and the
   undeclared count moves 11 → 12. A human opening the map after this
   checkpoint sees a component cycle drawn on it.

**No process from this integration survives.** Scratch ports **15110**,
**15112** and **15113** (E2E, three runs) and **15111** (boot check) were
each read with `lsof` FIRST (zero rows across the whole 15110–15115 range) and then
bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and `::` in that
order and never the reverse, and all six were free again after. **No
`pkill` at any point.** No `npm ci` or `npm install` was run in the main
checkout. **`~/nputer-genesis-probe` was never opened** by this
integration. No sibling lane worktree was touched. **The untracked
zero-byte file `z`** still sits there — not this integrator's, not
staged, left alone for the ninth checkpoint running.

## In progress / broken right now

**THREE LANES ARE LIVE — see the table at the top, derived from
`git worktree list`, which is the thing to re-derive rather than to
quote.** **`[app-shell]` and `[app-agent]` were released by this
checkpoint.** `git branch` still lists every lane this repo has ever run,
which is the intended asymmetry: the BRANCH is kept and only the WORKTREE
is removed.

**T-110 IS STOPPED, NOT BUILDING.** Its card says `building` and its room
says the circuit breaker fired. Believe the room.

**A LANE CUT NOW OWES ITS REGEN FORECAST AGAINST 1889 SYMBOLS / 1849
EDGES at 895 891 bytes / 172 files**, and should **forecast the DELTA and
re-derive the endpoints** — that discipline has now paid off at two
consecutive checkpoints whose endpoints moved underneath them. The graph
sits at **89.59% of `max_graph_bytes`** (1 000 000), headroom **104 109**
bytes, which is 5 025 bytes tighter than T-010 left it and still reported
by no gate, no test and no line of output.

## Next up

1. **THE ARCHITECT OWES A RULING ON THE C-10 ⇄ C-14 CYCLE.** `T-123-s8`
   is the card, the three candidate answers are argued there, and
   **T-033 is live on `[docs/architecture/components/]`**, so the fence
   the answer needs is held. This is the first cycle this repository has
   drawn and the first D1 C-10 has ever carried.
2. **`T-088-s4` IS THE ONE THE NEXT TRIAGE SHOULD NOT PARK AGAIN, AND ITS
   FENCE IS NOW FREE.** Three red in four full runs at this integration is
   the worst rate recorded. The RATE hypothesis above (53 → 56 bodies in
   one module against a 10-second FSEvents bound) is a lead, not a
   diagnosis; `recv_emit`'s 20 sites across 11 bodies are the blast
   radius to quote.
3. **THE SIZE IS STILL THE THING NOTHING REPORTS.** `T-010-s3` is not
   blocking and the floor argument is structural, but the graph is at
   89.59% of its budget and nothing reports the headroom.
4. **TWO REGISTRY DRIFT ROWS NOW WAIT FOR THE ARCHITECT, not one.**
   `D1:C-05->C-07` (`T-010-s4`) is still undrained from T-010's
   checkpoint, and `D1:C-10->C-14` joins it here.
5. **THREE OF T-123's OWN NINE ARE ABOUT THE SAME SCREEN** — `T-123-s1`,
   `T-123-s2` and `T-123-s4` all concern what a user meets on the newly
   reachable interview screen, and they want deciding together rather
   than one at a time. `T-123-s3` (the routing read RENAMES a
   non-parsing registry aside, and a second corruption discards the
   first's copy), `T-123-s6` (the carried registry read is unpinned),
   `T-123-s7` (a non-event asserted without its control) and `T-123-s9`
   (`sessions::load` has no size cap and this card moves that read
   earlier) are the code-side four.
6. **`T-096-s1` is still open** — a parser body whose TITLE claims a layer
   order it cannot check. Fence `[lib-parser]`, held by T-033.
7. **`T-010-s11` is a two-line manifest edit** for whoever next holds
   `[crate-index]`, which is FREE: the crate still calls itself a TS/JS
   indexer in two places.
8. **A CONCURRENT SESSION WRITES TO MAIN IN THIS CHECKOUT, AND THIS TIME
   IT COST A WAIT RATHER THAN A SURPRISE.** An integrator here must
   `git status` the checkout before merging — not only `git rev-parse`
   main — because a STAGED file from another session lands in your merge
   commit, and read the merge's own first parent afterwards.
9. **The GNU `xargs` column still closes at the first push**, and
   `git remote` still returns zero remotes.
