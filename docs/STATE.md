# State

Updated: 2026-08-25 by the T-031 integrator (independent hand, size M).

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: FOUR LANES ARE LIVE,
AND THIS CHECKPOINT IS THE ONE WHERE A FORECAST SURVIVED ITS OWN
ENDPOINTS MOVING BY AN ORDER OF MAGNITUDE.** T-031 was measured against a
graph of 126 files; it merged into one of 172. Its predicted delta
reproduced **to the byte** anyway. The lesson to carry is the one the
previous checkpoint asked for in as many words: **forecast the DELTA,
re-derive the ENDPOINTS.**

## THE LANE LIST, DERIVED FROM `git worktree list` AT THIS COMMIT

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is a
scratch worktree and not a lane (the T-089 correction in CONVENTIONS).
**FIVE** detached scratch worktrees were live beside these four when this
integration began (two drills, a clean checkout, a graph probe and a
verification worktree) and **ZERO remain at this commit** — a sixth
appeared and all five were removed while the merge was being tested. They
held no fence at any point.

| lane | fence (`touches:`) | where it is |
|---|---|---|
| **T-123** | `[app-shell, app-agent]` | building, under a SECOND verification pass after a first-round rejection |
| **T-110** | `[app-dispatch]` | **REJECTED TWICE — the circuit breaker has fired**, see below |
| **T-033** | `[docs/architecture/components/, lib-parser, app-map]` | building |
| **T-079** | `[tools/e2e]` | building |

**T-110's ROW IS NOT THE DISPATCHER'S REPORT — IT WAS FOUND ON DISK,
MID-INTEGRATION, AND IT LANDED ON MAIN BETWEEN THIS MERGE AND THIS
CHECKPOINT.** A concurrent session STAGED
`docs/rooms/t110-second-rejection.md` into this checkout's shared index
while the merge was being tested, and then COMMITTED it as **`06f26cb`**,
whose first parent is this integration's own merge `5fbfd4e`. So this
checkpoint's parent is `06f26cb` and not the merge. The room records that
T-110 has been rejected by **two independent verifier sessions on two
different defects** — the second finding that a symlinked gitdir is
followed, which falsifies the first verifier's all-clear — that
`method/tasks/TASK-FORMAT.md`'s *"two rejections → stop; open a room,
escalate to the human"* circuit breaker has therefore fired, that **no
third executor was dispatched**, and that it is addressed to **@human**.
Nothing about it is broken or urgent for a merge: T-110 has never merged,
its worktree is intact at its own verdict commit, and `[app-dispatch]` is
still held by it. **THAT FILE IS NOT THIS CHECKPOINT'S AND IS NOT IN THIS
COMMIT** — it was left exactly as found, and its own session committed it.
It is recorded here because a lane table that said "under a second
verification pass" would have been stale on the one lane a human most
needs to look at.

**THERE IS STILL NO TIP COLUMN AND THIS IS THE FOURTH MEASUREMENT SAYING
SO — THE CRUDEST ONE YET.** T-096's integrator added one and three of its
four tips went stale within eight minutes; `b7b4213` removed it; T-010's
checkpoint watched all three move again inside one turn. **Inside THIS
turn, between the worktree list read at the merge and the one read at the
commit, TWO of the four tips moved** — T-110 `2b20ea8` → `0bdaa24` and
T-123 `338a7e2` → `01086d5` — **and the entire scratch population turned
over**, five worktrees removed and one created. Those two figures are
written here only as evidence that they cannot be written in a table. **A
live lane's tip is a live-environment fact, not a function of a tree.**
What is stable is WHICH lane holds WHICH fence — that did not move at all.
For a tip, run `git worktree list`.

**THE BOARD CANNOT TELL YOU THE LAST COLUMN AND THIS CHECKPOINT SAYS SO
RATHER THAN PRETENDING OTHERWISE.** All four cards read `status: building`
with an empty `verifier:`, derived from disk here, so "under a second
verification pass" comes from the dispatcher's report at this turn and not
from the repository. `git worktree list` is the authority on which fences
are held; the board's `status:` is not, and neither carries a lane's PHASE.

**T-031's own worktree is removed in the same breath as this commit**, in
the order lane-protocol rule 6 fixes (merge, then checkpoint, then remove),
so **`[app-board]` and `[app-interview]` are FREE**. Also free:
`crate-index`, `app-map`'s sibling slugs not held above, `.github/`,
`docs/CONVENTIONS.md` and `method/`. **`docs/architecture/components/` is
NOT free** — T-033 holds it, which matters to the next integrator for the
reason the ARCHITECTURE section below gives.

## Just completed

**T-031 — the board's last file-derived text surfaces stop being able to
widen the board, and a parser issue finally reaches the card it is about.**
F-02, milestone 4, size M, `touches: [app-board, app-interview]`, **fence
never widened**. Built by `claude-opus-5 @T-031`, verified independently
and adversarially by `claude-opus-5 @T-031-verify`; `review: same-model`.
Main-before **`25a9e2c`**, lane tip **`ee73363`**, merge **`5fbfd4e`**,
this checkpoint after it. It absorbs six findings — T-017-s1/s2/s3,
T-019-s1, T-024-s4, T-024-s6 — triaged together on 2026-08-16.

**SIX OF SEVEN CRITERIA ARE BUILT AND THE SEVENTH IS DELIBERATELY NOT,
WHICH IS THE DISPOSITION MAIN NOW HAS THREE PRECEDENTS FOR** (T-010's
verdict, T-101's checkpoint, this). Criterion 3 — the verdict splitter's
column-0 anchor — needs `app/src/lib/verdicts.ts`, which
`C-05-app.md` lists in `paths:` under `touch_slugs: [app-shell]`, held
live by T-123 at dispatch and still held now. The card's fence resolves to
C-08/C-09/C-11 and C-13, **none of which claims that file**. The verifier
re-derived the ruling from the registry rather than reading it off the
notes, and confirmed the defect is REAL: one column-0 rejection plus two
verbatim quotes of earlier headers renders `data-rejected-count="2"`.
Routed as `T-031-s1`.

## What this does, stated plainly

- **Eight file-derived text surfaces take the T-017 treatment** —
  GhostCard's provenance line, the panel's `h2` and id/ref line, both
  blocker chips, the touches slugs, both provenance stamps, the file-path
  footer and the panel's `suggested_by` row. The verifier drove a hostile
  docs tree through `__nputerDocsHarness` into the real bundle at
  1280×720 and measured CONTAINERS, not classes: hostile column **377px
  == clean column 377px**, panel `scrollWidth − clientWidth` **0** with a
  10k title, 10k blocker id, 10k touches slug and two 10k stamps live.
- **`detail-ref` deliberately loses `shrink-0`** — it prints a FILE PATH
  for an id-less suggestion, so it is unbounded text, and a flex item that
  refuses to shrink cannot be contained by any break utility. This is the
  one place the sweep changes ordinary layout, and the adjacent feature
  held: an ordinary `T-902` still lays out in **one** client rect.
- **A verdict SCROLLS rather than re-flows.** `VerdictBlock` takes
  `overflow-x-auto` and deliberately NOT `break-words`, because a verdict
  is a verbatim quotation and re-flowing it changes what the reader sees.
  Measured: verdict body `scrollWidth` **74 398 > clientWidth**, panel
  overflow **0**.
- **A parser issue reaches the card it is about, through ONE join.**
  `issuesByFile` in `board-model.ts` is the only join between
  `model.issues` and a card; `selectTaskDetail` imports it rather than
  filtering again, so the face's mark and the panel's list **cannot
  disagree**. It reads the FIELD structurally (`"file" in issue`), so a
  kind added tomorrow that carries `file` joins the day it lands.
  **The header aggregate did not move** — it still counts the whole model,
  strictly more than the sum of the per-card marks, because the cross-file
  kinds the lens correctly skips are still in it.
- **Zero new tokens**, `tokens.css` a 0-file diff, both schemes measured
  in the browser off the rendered mark's own computed style.

## THE REGEN — the delta held, the endpoints did not

`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph --
--ignored`, exit **0**. `index --check --root ../..` was **exit 1, a REAL
red** at the merge (both count lines and a `~11` file list, which is how it
is told apart from the `--root` false red, whose second line says
`committed: MISSING`) and **exit 0, CURRENT** after the regen and again
after this checkpoint's doc writes.

| | committed at `25a9e2c` | fresh at this checkpoint |
|---|---|---|
| bytes | 890 866 | **894 664** (+3 798) |
| files | 172 | **172** (+0 −0, ~11 changed) |
| symbols | 1874 | **1885** (+11) |
| edges | 1842 | **1848** (+8 −2) |

**THE LANE MEASURED `648863 · 126 · 1126 · 1712` -> `652661 · 126 · 1137 ·
1718` AND WAS RIGHT ABOUT EVERYTHING EXCEPT WHERE IT STARTED.** T-010's
checkpoint moved the committed graph under it by +46 files and +748
symbols. The endpoints are therefore unrecognisable and **the delta is
identical**: +3798 bytes, +11 symbols, +8/−2 edges, ~11 files, at both
refs. That is what "forecast the DELTA, re-derive the ENDPOINTS" buys, and
it is the first time this repository has watched the advice pay.

**ONE REGEN WAS ENOUGH HERE, AND SAYING WHY MATTERS MORE THAN THE FACT.**
T-010's checkpoint needed two because it edited INDEXED fixture files and
a byte comparison would have missed the difference. **This checkpoint edits
only `docs/`, which `.nputerignore` excludes**, so no doc write can move
the graph — and the claim was CHECKED rather than argued: `index --check`
was run again after every doc write above and stayed **exit 0**. The
distinction to carry: the second regen is owed when the checkpoint touches
an indexed file, not as ritual.

**NO COMPONENT RELATION MOVED, AND IT IS DERIVED RATHER THAN REASONED.**
`arch drift` over the fresh graph and over main-before's committed graph
are **byte-identical apart from the graph header line** (`diff` exit 0):
findings **14**, undeclared **11**, unmapped **0**, declared_only **3**
(C-01, C-11, C-15), ambiguous 0, dangling 0. The two new cross-file edges
land on `C-09->C-08` — declared in C-09's own `depends_on` — and
`C-05->C-08`; the other six are intra-file. **NO FIXTURE RECONCILIATION
WAS OWED**, unlike T-010's merge: `files +0 −0` keeps `fileComponent.size`
at 172, and the two live registry fixtures pin nothing that moved. The app
suite came back **958/958 on the first run against the regenerated graph**,
with no assertion touched and none loosened.

## Ranges, every dot count stated, at their own refs

**MAIN DID NOT MOVE UNDER THIS MERGE — IT MOVED UNDER THE CHECKPOINT
INSTEAD**, which is item 8 below and does not touch a single figure in
this section. `git rev-parse main` answered **`25a9e2c`** before the merge
and it is the merge's real first parent; `06f26cb` landed afterwards, so
it is this CHECKPOINT's parent and no range below is computed against it.
Main advanced **11 first-parent commits / 80 paths** under
this lane, `765362e` → `d43455b` → `c6ef751` → `e884802` → `ee9dacb` →
`e27673d` → `bbcbc39` → `b7b4213` → `d64c673` → `8776326` → `e1f3023` →
`25a9e2c`.

    git merge-tree --write-tree 25a9e2c ee73363 -> tree 044c470e…, exit 0 (read from $? FIRST)
    git diff --name-only 25a9e2c <TREE>                        -> 17   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 25a9e2c..5fbfd4e   (THE MERGE'S DIFF) -> 17   the only one that means anything
    git diff --name-only 25a9e2c...5fbfd4e  (collapses AT the merge) -> 17
    git diff --name-only 25a9e2c...ee73363  (THREE dots, pre-merge)  -> 17
    git diff --name-only 765362e..ee73363   (TWO, branch-only)       -> 17
    git diff --name-only 25a9e2c..ee73363   (TWO dots, FORBIDDEN)    -> 97
    git diff --name-only 765362e..5fbfd4e   (merge-base..merge, FORBIDDEN) -> 97
    git diff --name-only 765362e..25a9e2c   (main's advance)         -> 80

**THE FORBIDDEN COUNT IS 97 BY BOTH FORBIDDEN SPELLINGS AND IT IS PURE
LEFT-ENDPOINT DRIFT**: main advanced **80** paths from the cut, the branch
**17**, `comm -12` over the sorted lists is **EMPTY**, and 80 + 17 = 97 —
the arithmetic that proves the two sets disjoint. A naive range would have
reported this lane as touching **97** paths including a Rust indexer crate
it never opened: a **5.7x** overstatement, and the largest this repository
has recorded.

**THE FORECAST WAS EXACT, WHICH IS THE MERGE-TREE PROPERTY RATHER THAN A
LUCKY RUN.** `merge-tree --write-tree` returned
`044c470ec529946df2fd0d77e2f57c3a82a6ea6a`, and that **IS** the merge's own
`HEAD^{tree}` byte for byte. Parents are `25a9e2c` and `ee73363` and
nothing else; **NOTHING WAS WRITTEN INTO THE MERGE COMMIT.**

The verifier measured **16** paths at its own ref `d64c673`; its verdict
commit `ee73363` added the verdict plus `T-031-s5`, which is the whole
difference.

## THREE standing gates — DERIVED from the merge's own 17 paths

| gate | trigger | on these 17 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **11 — FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **7 — FIRES** |
| DOCS GATE | a `docs/` path a code suite reads | **6 — FIRES**, three suites |

- **GRAPH REGEN — FIRES on 11 of 17**, 7 under `app/src` and 4 under
  `app/test`. **The trigger's new `*.rs` arm (`e1f3023`, `T-123-s5`)
  changed nothing here and was still read as it now stands rather than
  from memory** — this merge carries zero `.rs` paths, so the four TS/JS
  suffixes decide it alone. A trigger widened the night before is exactly
  the kind a reader quotes stale.
- **BOOT GATE — FIRES, 7 of 17**, all `app/src/**`; `app/src-tauri/**` is
  a **0-file diff**. Run on scratch port **15091**: exit **0**, both
  `[nputer]` lines observed — `[nputer] project folder:
  /Users/ujju/Projects/nputer` and `[nputer] window "main" created`.
- **DOCS GATE — exit 1**, invoked DIRECTLY with the 17 paths as ARGUMENTS,
  ROOT-RELATIVE, never through `xargs`. **6 of 17 under `docs/`, THREE
  suites owed** — `npm test from app/`, `npm test from tools/e2e/`,
  `npx vitest run from lib/parser/` — all three green. The run reports
  **12 derived readers across 4 suites**, **0 frontmatter issues**, a
  census of **123 docs-shaped sites in 22 files, 12 of them in 10 files
  resolving into this repo's docs/**, **25 files holding the repository
  root** (11 derived, 0 unlinked, 14 with no linkable site), **1
  package-relative site**, and the root-anchor ledger at 6 entries. Note
  that `cargo test` is NOT owed: the six paths are all flat
  `docs/tasks/T-*.md`, and the gate's answer is proportional to the
  trigger rather than equal to it.
- **`T-010-s10`'s HOLE DID NOT APPLY AT THIS MERGE AND THAT IS WORTH
  KNOWING RATHER THAN CLAIMING CREDIT FOR.** The gate derives its card
  list from TRACKED files; all six new docs paths arrive **inside the
  merge commit**, so they were tracked before the gate ever ran. The hole
  is real for a checkpoint that WRITES a new card — this one writes none —
  and the workaround (`git add` first) stays owed by whoever does.

## Suites, every number derived at this checkpoint, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own `$?`
on an unpiped command, captured on the very next token. Every suite was run
at the merge AND again after the doc writes.

- **app: 958/958 across 46 files**, exit **0**, after `npm run build` exit
  **0** — at the merge, again against the regenerated graph, and again
  after the doc writes. **THE BUNDLE MOVED AND IT IS SUPPOSED TO**:
  `index-D41xl3Gz.css` / 45.18 kB and `index-CNznNhXD.js` / 527.99 kB,
  against main's previous 45.06 kB / 526.42 kB. Seven `app/src` files are
  bundle input here, so a byte-identical bundle would have been the
  finding.
- **parser: 264/264 across 12 files**, exit **0**; `npx tsc --noEmit` exit
  **0**. **The notes and the verdict both say 263** — correct at the
  verifier's ref, because this lane was cut from `765362e`, before T-096's
  merge added a body, and stale at mine. The repository wins. This is the
  SECOND consecutive checkpoint to record this exact correction.
- **cargo: 408 passed / 0 failed / 3 ignored** summed over **15**
  `test result:` lines, exit **0** — **twice**, at the merge and again
  after the doc writes. See the flake section below for the honest tally
  rather than this single number.
- **E2E: 143/143**, exit **0**, on scratch ports **15090** (at the merge)
  and **15092** (after the doc writes); `npm run typecheck` **0** both
  times.
- **token lint: selftest 0, lint 0** — clean at **TOKEN 131 / CONTROL
  642** at the merge and **CONTROL 643** after the doc writes, **and the
  one added file is NOT this checkpoint's.** CONTROL derives from
  `git ls-files`, which reads the INDEX rather than HEAD, so the
  concurrently-staged `docs/rooms/t110-second-rejection.md` above joined
  the corpus the moment another session staged it. This checkpoint adds no
  tracked file at all. That is a live worked example of why both counts
  are PRINTED and pinned by nothing: **derive them at your own ref**, and
  note that on a shared checkout "your own ref" is not even enough —
  the corpus can move without the branch moving.
- **`npm run lint:docs` exit 0**, run the way CI will run it, at the merge
  and again after the doc writes.
- **`cargo audit` exit 0 — 0 vulnerabilities, 17 informational warnings**
  over **473** locked crates, byte-for-byte the disposition T-010's
  checkpoint recorded, and necessarily so: **zero manifest or lockfile
  paths are in this merge's diff** (`Cargo.lock`, `Cargo.toml`,
  `app/package.json`, `app/package-lock.json` → 0 of 17), so this merge
  adds no dependency in either ecosystem. The verifier's independent
  sweep agrees — zero dependency additions, zero secrets, zero
  `dangerouslySetInnerHTML`/`innerHTML`/`eval`/`href=`/`src=` in the added
  lines, and hostile field content driven through seven frontmatter fields
  and a verdict body reached the DOM as **text nodes only**.

## `T-088-s4` — THE HONEST TALLY, WHICH IS A CLEAN ONE THIS TIME

The unparked watcher flake
(`docs_watch::tests::startup_arm_watches_the_initial_root`, and since
T-010's checkpoint also
`docs_created_after_a_docsless_startup_arms_and_emits`) **did not fire
once during this integration**. Full `cargo test --no-fail-fast` runs at
this checkpoint: **408 / 0 / 3 at exit 0 every time, zero red**.

**THAT IS DATA ABOUT THE FLAKE, NOT AN ABSENCE OF IT, AND THE DIFFERENCE
IS THE LOAD.** T-010's tally was **3 red in 6 full-suite runs** under three
live lanes, one of them drilling, plus the human's `tauri dev`, during the
largest merge this repository has taken. Four lanes are live now — more,
not fewer — but this merge's cargo work is small: `app/src-tauri/**` is a
**0-file diff**, so nothing recompiled and the suite ran against a warm
`target/`. The mechanism named in T-010's finding is unchanged and
unfixed: `recv_emit`, a 10-second wall-clock bound on FSEvents delivery,
called at **20 sites across 11 test bodies**. **A green tally does not
retire it** — the two tallies are kept apart rather than averaged, and the
fix is still `[app-shell]`, held live by T-123. `status: suggested`,
awaiting triage.

## Documents ticked

- **ARCHITECTURE — NOTHING WAS OWED AND THE DERIVATION IS RECORDED
  BECAUSE THE ANSWER IS COUNTER-INTUITIVE FOR A MERGE THIS VISIBLE.** No
  interface moved: `app/src-tauri/**` is a 0-file diff, so IPC stays at
  FOURTEEN and `acl_pin.rs` is untouched at 92 grants; zero new tokens;
  and `arch drift` is byte-identical, so no dependency edge appeared at
  the component level. The pure-lens rule is unmoved — this card reads and
  renders and writes nothing.
- **AND C-08/C-09's "ROWS" ARE NOT IN ARCHITECTURE.md AT ALL**, which the
  next integrator should know because a dispatch brief asked this
  checkpoint to judge them there. The Components table stops at **C-07**;
  C-08 and C-09 live as registry FILES under
  `docs/architecture/components/`. Their bodies could fairly gain a clause
  — C-08's names "card faces, slice line, ghost/parked treatments, model
  and review badges" and now also carries a soft-issue mark; C-09's names
  "full frontmatter, body sections, blocker links, provenance marks" and
  now also an issues section — but **neither sentence is FALSIFIED**, both
  are incomplete enumerations rather than claims gone false, and
  **`docs/architecture/components/` is held live by T-033**, whose whole
  card is a zero-drift registry pass. So the state already answers it and
  no finding is filed: the lane that would write the clause is the lane
  currently holding the fence.
- **ROADMAP — TICKED, and NOT because this merge made a sentence true or
  false.** It makes none: no ROADMAP sentence names T-031 or its content,
  derived rather than assumed. What the derivation FOUND is that the
  milestone-4 paragraph's inherited-backlog census — *"45 cards already
  carry `milestone: 4`… 29 F-02, 11 F-06, 3 F-03, 2 F-01"* — has been
  stale since 2026-08-19. On disk at this commit it is **85** cards
  carrying `milestone: 4`, of which **5 are F-04** and so ARE this
  milestone's content, leaving **80** inherited: 41 F-02, 21 F-06, 12
  F-03, 6 F-01. Corrected in place with the ref on T-101's precedent — the
  same one that paragraph's own parenthetical already uses — with the
  ARGUMENT untouched, because the argument never depended on the digits.
  It is the "DERIVE THE COUNT AT YOUR OWN REF" hazard CONVENTIONS names,
  found by an integrator checking whether a sentence was true before
  ticking it.
- **CONVENTIONS — nothing owed.** The GRAPH REGEN bullet's `*.rs` arm
  landed the night before at `e1f3023` and was read as it now stands; this
  merge carries no `.rs` path, so it neither exercises nor contradicts it.
- **The card** is stamped `done`, `built_by: claude-opus-5 @T-031`,
  `verified_by: claude-opus-5 @T-031-verify`, `review: same-model`, and
  carries an `## Integration` section with the range table and the regen.
- **The lane's and the verifier's five suggestion files stay as filed**
  (`T-031-s1` … `T-031-s5`). **No new finding is filed by this
  integration**, which is a first in several checkpoints and is a
  deliberate call rather than an oversight: the two things worth saying
  (the registry clause, the stale ROADMAP census) are respectively already
  a live lane's subject and fixed in place here.

## @HUMAN — THREE ITEMS, AND THEY ARE THE FIRST OUTSTANDING ONES SINCE T-010

The previous checkpoint closed with "there is no outstanding @human item."
There are three now. **Every one is a perception question no headless pass
can settle** — the lane's notes and the verifier's verdict agree on all
three and the verifier added none — and they are grouped so they can be
answered in ONE sitting, with the app already running.

1. **The soft-issue mark's amber ink against all six status fills, in both
   schemes.** It is `text-warning` ink sitting between the id and the title
   on the card's own status paper. On the amber `building`/`verifying`
   pair it may read as noise; on the teal `done`/`merging` pair it will be
   the loudest thing on the card. Measured colours, so the question is
   purely "does it read": light `--warning rgb(179,96,10)`, dark
   `rgb(240,166,60)`.
2. **Where the `issues` section sits in the panel body.** It is currently
   **FIRST**, above acceptance criteria, on the argument that a defect
   notice the reader has to scroll to is not a notice. That is a taste
   call and it is the one thing here that is cheap to move.
3. **Whether `max-w-24` is the right badge clip.** 6rem of 11px mono is
   roughly **ten** characters; `opus`, `fable` and `codex` are
   comfortable, a long single-token model name will ellipsize. The full
   raw stamp is preserved on `title=` and the panel prints it verbatim, so
   nothing is hidden — the question is only whether the clip looks right.

**AND A FOURTH @HUMAN ITEM EXISTS THAT IS NOT THIS CHECKPOINT'S TO
CLAIM**, flagged here only so it is not missed: T-110's escalation room
(`docs/rooms/t110-second-rejection.md`, staged by a concurrent session, not
in this commit) is addressed to @human and is a DECISION rather than a
look. The three above are perception questions about the board; that one is
about a card rejected twice. They are unrelated and should not be answered
in the same breath.

## The board, derived from disk at this checkpoint

**182 flat task files — 78 done / 41 planned / 41 parked / 18 suggested /
0 verifying / 4 building; 26 in `rejected/`.**
78 + 41 + 41 + 18 + 4 = 182. T-031's stamp moves done from 77 to 78 and
verifying from 1 to 0; building is 4 because batch C stamped T-033 and
T-079 at `25a9e2c`. **This checkpoint writes no new task file**, so 182 is
the count before and after.

**THE SUGGESTION BACKLOG IS EIGHTEEN AND IT IS TWO CARDS' WORK**:
`T-010-s1`…`-s11` (eleven) and `T-031-s1`…`-s5` (five), beside `T-096-s1`
and the unparked `T-088-s4`. The eighth triage took the backlog to zero
five commits ago; whoever triages next is looking at a fresh cycle in
which **TWO size-M cards with adversarial verifiers supplied sixteen of
the eighteen entries.** That is the cost and the yield of the discipline,
in one number.

## Provenance — SELF-DECLARED, never read off a trailer

T-031 is **built by `claude-opus-5` and verified independently by a
separate `claude-opus-5` session**; `built_by: claude-opus-5 @T-031`,
`verified_by: claude-opus-5 @T-031-verify`, `review: same-model` — same
model, different hand, which is what that value means (T-104's ruling:
`review:` means blindness rather than model diversity). **The blindness
was taken BY THE REF here**, which is the strongest form available: the
verifier read the spec at the BASE `765362e` via `git show` and formed and
ran its whole attack — fixture, measurements, ablations and seventeen
mutants — before opening the lane's implementation notes or test files.
**The `Co-Authored-By` trailer on this lane's commits is a harness
constant and is NOT evidence of a model** — T-085 proved it and T-101 made
the proof sharper with a counterexample inside one session. Nothing here
reads a model off a commit signature.

**78 done cards — 58 `same-model`, 14 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 58 + 14 + 5 + 1 = 78. T-031 moves `same-model` from 57
to 58.

At this checkpoint main contains T-031's merge `5fbfd4e`, another
session's room commit `06f26cb`, and this commit.
Cargo, app, parser, E2E, token lint and its selftest, the docs gate and the
graph-currency gate are all green; **all three standing gates were DERIVED
and all three FIRED and were RUN.** Nothing is broken.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else**, before and after — no bind, no connect, no signal, on any
interface. Holder `node` pid **82549**, one socket `TCP [::1]:1420
(LISTEN)`, identical throughout.

1. **THE APP DID NOT RELAUNCH, AND THAT IS THE MEASUREMENT THIS
   CHECKPOINT EXISTS TO RECORD.** `target/debug/nputer` is pid **5686**,
   started **2026-08-25 02:10:08** — the SAME pid and the SAME start time
   T-010's checkpoint recorded, before AND after this merge, and again
   after the boot check built into the shared `target/`. T-010's merge
   touched `app/src-tauri/**` on 33 paths and the binary relaunched one
   second later; this one touches it on **ZERO**, so vite HMR'd the
   frontend and the Rust process was never restarted.
2. **SO THE BOOT-GATE TRIGGER SET AND THE RELAUNCH TRIGGER SET ARE NOT
   THE SAME SET, DEMONSTRATED RATHER THAN ASSERTED.** Three checkpoints
   have conflated them. BOOT GATE fires on `app/src-tauri/**` **or**
   `app/src/**` **or** either manifest — 7 paths here, all `app/src/**`,
   and it fired and was run. `tauri dev` restarts on the Rust half alone.
   A merge can therefore owe the boot gate and leave the running binary
   untouched, which is exactly this one, and the two facts should never
   again be predicted from each other.
3. **The integrator's `cargo` runs share `target/` with the human's live
   dev app** (T-113's observation, confirmed a third time): the graph
   gate, the regen, the full cargo suite and the boot check all built into
   the shared directory while the app was running, and it survived all of
   them unchanged.
4. **The map pane sees a slightly different graph**: +11 symbols and +6
   net edges across eleven files, no node's file list changed, no relation
   row moved, no drift ring lit. A human opening the map after this
   checkpoint is looking at the same picture with a little more detail
   inside four boxes — the opposite of the last checkpoint.
5. **The BOARD, however, is where a human will see this at a glance.**
   Every card whose file carries a parser issue now wears a mark it did
   not wear yesterday, and the panel lists the parser's own sentences
   verbatim. That is the first time a parse issue has been visible on the
   card it is about rather than only in the header aggregate.

**No process from this integration survives.** Scratch ports **15090**
(E2E) and **15091** (boot check) were each read with `lsof` FIRST (zero
rows) and then bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1` and
`::` before use, in that order and never the reverse, and both were free
again after. **No `pkill` at any point.** No `npm ci` or `npm install` was
run in the main checkout. **The untracked zero-byte file `z`** still sits
there — not this integrator's, not staged, left alone for the eighth
checkpoint running.

## In progress / broken right now

**FOUR LANES ARE LIVE — see the table at the top of this file, which is
derived from `git worktree list` and is the thing to re-derive rather than
to quote.** `[app-board]` and `[app-interview]` were released by this
checkpoint. `git branch` still lists every lane this repo has ever run,
which is the intended asymmetry: the BRANCH is kept and only the WORKTREE
is removed.

**A LANE CUT NOW OWES ITS REGEN FORECAST AGAINST 1885 SYMBOLS / 1848 EDGES
at 894 664 bytes / 172 files**, and should **forecast the DELTA and
re-derive the endpoints** — advice this checkpoint just watched succeed
across an order-of-magnitude endpoint move.

**THE GRAPH IS AT 89.47% OF ITS BUDGET, UP FROM 89.09%.** 894 664 of
`max_graph_bytes` 1 000 000 leaves **105 336** bytes of headroom, and of
the docs collector's `MAX_FILE_BYTES` 1 048 576 leaves **153 912**.
Nothing truncates. **Nothing reports the headroom either** — no gate, no
test, no line of output — which is `T-010-s3`, and this merge spent 3 798
bytes of it without anything saying so.

## Next up

1. **THE SIZE IS STILL THE ONE THING TO WATCH, AND IT MOVED AGAIN.**
   `T-010-s3` is not blocking and the floor argument is structural, but
   two consecutive merges have now spent headroom silently. It remains the
   finding worth promoting at the next triage.
2. **T-031's OWN FIVE FINDINGS, AND ONE OF THEM IS LIVE-BROKEN CODE.**
   `T-031-s1` is the verdict splitter: the defect is real and MEASURED
   (a card with quoted headers reads `rejected ×2`), the one-token fix
   (`line.trim()` -> `line`) was applied in the verifier's drill and left
   the app suite at 958/958, and **nothing in the tree pins the current
   broken behaviour or would catch the fix** — so that lane owes the pins
   as much as the token. Its fence is `[app-shell]`, held by T-123.
   `T-031-s5` refutes a claim in shipped source: `ModelBadge.tsx`'s header
   says all three of `min-w-0 max-w-24 truncate` are load-bearing, and
   ablation measured `min-w-0` changing **nothing at any level** on that
   element, because per CSS Flexbox §4.5 a `max-width` already clamps the
   automatic minimum. `T-031-s2` (join on `file` vs `files`), `T-031-s3`
   (two more surfaces in the same class) and `T-031-s4` (the registry
   claims `app/test/**` for `app-shell` while thirteen lanes fenced
   without it have edited it) are the rest.
3. **THE REGISTRY'S DRIFT ROW FROM T-010 IS STILL WAITING FOR THE
   ARCHITECT.** `D1:C-05->C-07` (`T-010-s4`) is real and undeclared;
   C-05's "Depends on" column already reads *"C-07 when F-06 lands"*, so
   the declaration is arguably owed rather than merely available. **T-033
   holds `docs/architecture/components/` right now**, so this is that
   lane's to settle or to leave.
4. **TWO ROUTED SECURITY-ADJACENT FINDINGS ARE LIVE AND NEITHER BLOCKS.**
   `T-010-s8` (hostile source shapes abort the indexer at exit 134, and
   `index_repo` hosts it IN-PROCESS so the abort takes the app with it)
   and `T-010-s9` (the `cargo:` package-id qualifier closes the npm/cargo
   collision from one side only). Latent.
5. **`T-096-s1` is still open** — a parser body whose TITLE claims a layer
   order it cannot check. Fence `[lib-parser]`, **held by T-033**.
6. **`T-088-s4` IS IN THE BACKLOG AND CAME BACK CLEAN HERE.** Zero red in
   this integration's cargo runs, against 3-in-6 at T-010's. Both tallies
   stand; neither retires the other, and the fence `[app-shell]` is held
   by T-123.
7. **`T-010-s11` is a two-line manifest edit** for whoever next holds
   `[crate-index]`, which is FREE: the crate still calls itself a TS/JS
   indexer in two places.
8. **A CONCURRENT SESSION WROTE TO MAIN AGAIN — INTO THE SHARED INDEX
   FIRST AND THEN ONTO THE BRANCH — AND IT IS A SHARPER HAZARD THAN THE
   ONE T-010'S CHECKPOINT RECORDED.** Main was `25a9e2c` before the merge
   and is the merge's own first parent, so nothing moved under the MERGE.
   It moved under the CHECKPOINT. In order: another session ran `git add`
   in this working checkout mid-run, so
   `docs/rooms/t110-second-rejection.md` sat **staged in the shared index**
   alongside this checkpoint's four modified files; minutes later that
   session committed it as **`06f26cb`** on top of `5fbfd4e`, so this
   checkpoint's parent is a commit that did not exist when its doc writes
   began. **NEITHER HALF BROKE ANYTHING, AND THE FIRST HALF COULD HAVE.**
   `git commit -a`, or any commit that does not name its paths, would have
   swallowed another lane's escalation room into this checkpoint —
   silently, with a clean-looking tree, and attributed to the wrong hand.
   This checkpoint was committed by NAMING its four paths explicitly.
   **THE STANDING ADVICE THEREFORE GAINS A SECOND HALF**: `git rev-parse`
   main at the moment of the merge and read the merge's own first parent
   afterwards — *and read `git status` immediately before every commit and
   name your paths, because on this checkout the index is shared even in
   the window when the branch is still.* T-010's checkpoint saw main move
   fifty-one seconds before its merge; this one saw it move between the
   merge and the checkpoint. **The window is not "around the merge" — it
   is the whole integration.**
9. **The GNU `xargs` column still closes at the first push**, and
   `git remote` still returns zero remotes.
10. **THREE @HUMAN ITEMS ARE OUTSTANDING** — see their own section above.
    They are all perception, all on the board and the panel, and all
    answerable in one sitting with the app already running.
