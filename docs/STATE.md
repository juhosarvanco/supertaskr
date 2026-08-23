# State

Updated: 2026-08-23 by claude-opus-5 @T-089-integrate (T-089 merged and
checkpointed).

## Just completed

**T-089 — the dispatch brief is a written artifact, and the lane
protocol joins the method.** F-04, milestone 4, size M, `touches:
[method/, docs/CONVENTIONS.md]`. Built by `claude-opus-5 @T-089` then
rebuilt by a SECOND executor after rejection; verified by `claude-opus-5
@T-089-verify` across TWO passes; `review: same-model`. **REJECTED on the
first verdict, rebuilt, APPROVED on the second** — both verdicts are on
the card. Approved branch tip **`c43eadd`** (the second verdict `25dfce6`
plus that verdict's own DOCS GATE appendix). Merge **`4f25183`**; the card
was `verifying` and the integrator stamped **`done`** at this checkpoint.

**WHAT LANDED.** Roughly ninety cards had been dispatched with an
artifact no file described. The method now describes it: a **thirteen-row
normative dispatch brief contract** in `method/roles/executor.md` — one
row per component, its SOURCE, and what a session guesses when the row is
missing — plus a new `## The report` spec that row 12 points at and which
did not exist. A generic **`method/lane-protocol.md`** (7 rules: one
task/one branch/one worktree, base as a HASH and never a merge commit,
sibling worktree, executor never touching the integration branch with a
size-S carve-out, disjoint `touches:`, integrator removes the worktree,
the lane list is a fact on disk) holds the rules and leaves every NAME to
the project; `docs/CONVENTIONS.md` holds this project's spellings and does
not restate the rules. **`integrator.md` finally describes the merge that
happens** — `--no-ff` plus a SEPARATE checkpoint, with the reason for the
split (T-077's twice-run regen) and the reason not to rebase (the verdict
would name a commit nobody can diff). **The dispatch stamp gets an owner
and an order**: the architect writes `status: building` on the integration
branch BEFORE the cut, `TASK-FORMAT.md` authoritative for the FIELD and
`orchestrator.md` 5b for the ACT, each naming the split. One in-fence
correction rides along: CONVENTIONS' xargs sentence, which was false in
both halves.

**EIGHTEEN PATHS — 12 `docs/`, 6 `method/`, 0 other, and every one is
`.md`.** `M` `docs/CONVENTIONS.md`, `M` the card, `A` ten findings
`T-089-s1`…`s10`; `M` `method/README.md`, `A` `method/lane-protocol.md`,
`M` `method/roles/executor.md`, `M` `method/roles/integrator.md`, `M`
`method/roles/orchestrator.md`, `M` `method/tasks/TASK-FORMAT.md`. 2688
insertions, 20 deletions. **No code path, no manifest, no test file.**

## WHY `docs/STATE.md` IS EXCLUDABLE FROM A STALENESS SWEEP — read this before you grep

**The verifier nearly rejected this card a second time on a grep of this
file, and was saved by measuring rather than concluding.** The card
deletes a false `xargs` exit mapping from CONVENTIONS. A wider sweep at
the LANE tip found the same false mapping alive TWICE in `docs/STATE.md`
(lines 242 and 448-449 of that tip's copy), plus a third line asserting
CONVENTIONS "describes an `xargs` invocation" which the diff falsified.
Three live copies of a sentence a card exists to kill is a rejection —
except that none of them can reach the merge, for a reason that is a
property of this file and not of that lane:

**`docs/STATE.md` is a SNAPSHOT rewritten WHOLESALE at every checkpoint
(`method/roles/integrator.md` step 3), so a lane's copy of it is frozen
at the lane's base and says nothing about main. Two checkpoints landed
between T-089's cut and its merge; main's copy was already clean; and
`docs/STATE.md` is not in the merge's diff at all — `git diff --name-only
a15b78e 4f25183 | grep -c docs/STATE.md` returns **0**, re-derived here at
the merged commit, so the merge takes main's copy untouched.** The only
`xargs` line in this file's predecessor was *"never through `xargs`"*,
which is correct, and this file is a fresh write.

**The general rule, which is the part worth keeping:** a staleness sweep
must partition its hits into files the merge WRITES and files it does not,
and `docs/STATE.md` is always in the second set unless the integrator put
it there. A hit in a wholesale-regenerated snapshot is a hit in a build
output. **Grep the merge's path list, not the working tree** — the next
reader who runs the wider grep will otherwise reach the wrong conclusion,
exactly as the verifier did, and only measurement will get them back.

## Ranges, every dot count stated, at their own refs

Main-before **`a15b78e`** (T-070's checkpoint, verified as the tip at
start), approved tip **`c43eadd`**, merge-base **`4d2f03c`** (the
docs-only dispatch commit "F-04 opens", four commits after checkpoint
`2036fb2` and NOT a merge — the base the lane's own new CONVENTIONS
clause dissects).

    git merge-tree --write-tree a15b78e c43eadd -> tree 4e3ef5f0…, exit 0 (read from $?)
    git diff --name-only a15b78e <TREE>                      -> 18   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only a15b78e...c43eadd   (THREE dots)    -> 18
    git diff --name-only 4d2f03c..c43eadd    (TWO, branch-only) -> 18
    git diff --name-only a15b78e..c43eadd    (TWO dots)      -> 142  THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only a15b78e..4f25183    (TWO dots)      -> 18   THE MERGE'S DIFF, the only one that means anything

`git merge-base --is-ancestor a15b78e 4f25183` exits **0**, so at the
merge two dots and three dots COLLAPSE. The staged merge tree was
byte-identical to the forecast (`git write-tree` == `4e3ef5f0…`, the
staged path list `diff`-identical to the 18) and the merge's `HEAD^{tree}`
IS that tree, with parents `a15b78e` and `c43eadd` and nothing else.
**NOTHING WAS WRITTEN INTO THE MERGE COMMIT** (T-083-s4); every
integrator edit is in this checkpoint.

**THE FORBIDDEN COUNT IS 142 AND IT IS LEFT-ENDPOINT DRIFT.** Main
advanced **124** paths from the cut, the branch **18**; `comm -12` over
the sorted lists is **EMPTY**, and 124 + 18 = 142 — exactly the forbidden
count, which is what proves the two sets disjoint. The verifier measured
138 at `740f0b7` and 142 at `a15b78e` for the same unchanged branch: only
the forbidden form moved, for the fifth main tip running.

## THREE standing gates — TWO derived NOT OWED, ONE fires

Derived from the merge's own 18 paths, not assumed. Every path is `.md`.

| gate | trigger | on these 18 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` outside `docs/` | **0 — NOT OWED** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** |
| DOCS GATE | a `docs/` path a code suite reads | **12 — FIRES**, four suites |

The three are enumerable rather than remembered: `grep -n "at any merge
whose diff" docs/CONVENTIONS.md` returns exactly **3** at the merged tree
(lines 592, 717, 746), which is the mechanical test row 8 of the new brief
contract prescribes, run on the tree that ships it.

**GRAPH REGEN — NOT OWED, and confirmed rather than left as a
derivation.** `index --check --root ../..` at the merge exits **0**:
*CURRENT — 588891 bytes, 119 files, 1023 symbols, 1550 edges*, identical
to T-070's checkpoint. `.nputerignore` excludes `docs/` and `tools/` but
NOT `method/`, so the new `method/lane-protocol.md` was worth a look; the
indexer walks code symbols, the file count did not move, and the graph is
current. Re-run after this checkpoint's own doc edits: still **0**.

**BOOT GATE — NOT OWED at 0 of 18, and the human's app confirms it** (see
"What ACTUALLY reached the human's running app").

**DOCS GATE — FIRES, exit 1**, invoked DIRECTLY with the range rule's own
path list as ARGUMENTS and never through `xargs` — which would have been a
fine irony on the merge that corrects the xargs sentence, and a wrong
answer. Twelve `docs/` paths owe **FOUR** suites, one more than T-070's
three: `docs/CONVENTIONS.md` is in the diff and `app/src-tauri/src/agent/
kit.rs` reads it, so `cargo test from app/src-tauri/` is owed here where
it was correctly not owed there. It reports **11 derived readers across 4
suites**, **0 frontmatter issues**, a census of **118 docs-shaped sites in
22 files, 11 root-anchored in 9 files**, and *every live task card's
frontmatter parses, with a legal status* — the machine check that the ten
merged findings and the one materialized here are legal. All four owed
suites were re-run AFTER the checkpoint edits (T-081-s9).

## THE METHOD VERSION WAS **NOT** BUMPED — and that is the right answer

The card's fifth criterion says the method version SHALL be bumped. It was
not, and the omission is correct rather than missed: **the bump is a
FOUR-PLACE fact and one of the four is Rust, outside this card's fence.**
`app/src-tauri/src/agent/kit.rs` is C-14's `app-agent` slug, held by a live
lane at dispatch. Widening a fence from inside the lane is the one repair
the new contract says an executor may never make, so the criterion was
routed instead: **`T-089-s1` carries the debt with the exact three-file
edit**, and CONVENTIONS carries two sentences that the paying commit
deletes.

Verified at the merged tree — **all four agree at v0.1.5**:

| # | place | value | pinned? |
|---|---|---|---|
| 1 | `docs/CONVENTIONS.md:201` *"currently v0.1.5"* | 0.1.5 | by `snapshot_version_matches_the_live_method_stamps` |
| 2 | `method/interview/plan-interview.md:26` Output heading `(v0.1.5;` | 0.1.5 | by the same test |
| 3 | `app/src-tauri/src/agent/kit.rs:35` `METHOD_SNAPSHOT_VERSION` | "0.1.5" | it IS the constant |
| 4 | `docs/CONVENTIONS.md:311` genesis-kit gotcha `(v0.1.5, T-023)` | 0.1.5 | **NOT pinned — no test reads it** |

**The ordering asymmetry is now measured, not quoted** (drill M1/M2
below): a const-only bump reds on the plan-interview arm at `kit.rs:443`
and NEVER reaches the CONVENTIONS arm at `kit.rs:450`, so fixing the file
the panic names yields a SECOND red rather than a green. Move both doc
stamps and the const in ONE commit, and hand-update place 4 in the same
one.

## The stamp hazard: the shipped sentence is necessary, NOT sufficient

`TASK-FORMAT.md` ships *"it merges clean as long as only one side ever
writes it, and resolves by hand only when both do."* The verifier drove
three fixture merges at base `status: planned` and the result refines it:

| case | main after the cut | lane | `git merge --no-ff` | conflicts |
|---|---|---|---|---|
| A | writes `building` | writes `building` (IDENTICAL) | **exit 0** | 0 |
| B | writes `building` | writes `verifying` (its exit stamp) | **exit 1** | **1** |
| C | untouched | writes `building` (the T-054/T-063 shape) | **exit 0** | 0 |

Case A is both sides writing and it merges CLEAN — git sees one change
made twice. So "both do" is **necessary but not sufficient**; the
sufficient condition is both sides writing DIFFERENT values. **Case B is
the one that actually happens** — the architect stamps `building` late
while the lane writes its own exit status on the same line — and a rule
justified by its worst case should name the worst case that occurs. Ruled
NON-BLOCKING and hazard-SHRINKING: nothing in the tree falsifies the
sentence and the conclusion (the pre-cut order removes the hazard) is
untouched. **Recorded here so the next editor of that bullet has the
measurement and does not have to re-run the fixtures.**

## The verdict's residuals — one is a file now, two are findable now

The APPROVED verdict raised six non-blocking findings. `T-089-s9` (the
executor's own step 2 states "never touch the integration branch" as an
absolute against lane-protocol rule 4's new size-S carve-out — a
contradiction this very card's s8 fix introduced, in the file the executor
reads FIRST; plus the size-S executor told to "checkpoint" with no source
row 11 names defining one) and `T-089-s10` (`closed_by:` is an
undocumented key and the tree already holds a SECOND shape —
`docs/tasks/rejected/T-081-s7` carries `closed_by: 3b4326d (main, …)` —
with no rule for which applies) both arrived as real FILES with legal
frontmatter, checked here. **The T-061 hazard did not repeat for those
two.**

It did repeat for the other two. Finding 4 named three residual table rows
and said in as many words that "closed" must not read as "complete". Row
11 got `s9`. **Row 9 (Standing disciplines is row 8's untwinned twin — same
defect, same walk, and row 8 got an enumeration rule while row 9 did not)
and row 5 (the slug↔path map is NAMED but not LOCATED; it is
`docs/ARCHITECTURE.md` plus each `docs/architecture/components/*.md`'s
`touch_slugs:`, 11 such files) had NO file.** Row 5's only written copy sat
inside `T-089-s7` — which carries `closed_by:` and invites triage to
absorb-and-REMOVE it, so the convention schedules the last copy for
deletion. **Materialized here as `T-089-s11`, crediting the verifier.**
Neither row is fixed: `method/` was outside this integration's business and
the fixes are one phrase each.

## Suites, every number derived at the merge, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh; every exit below came off its own `$?`
on an unpiped command.

- **parser: 263/263 across 12 files**, exit **0**; `npm run build` **0**
  FIRST (fresh-clone order); `npx tsc --noEmit` **0**.
- **app: 857/857 across 43 files**, exit **0** — equal to `a15b78e`, since
  this merge adds no test body. `npm run build` **0**, 265 modules, and
  **both bundle hashes are UNCHANGED** — `index-DsNHI2Jr.js` 503.61 kB and
  `index-CwYF5FQb.css` 43.95 kB, byte-for-byte T-070's. A `.md`-only merge
  moves no bundle input, and the hashes are the proof rather than the
  claim.
- **bare Rust `cargo test --no-fail-fast`: 361 passed / 0 failed / 3
  ignored, exit 0**, summed programmatically over **fifteen** `test
  result:` lines. **The T-061-s4 kill-path flake did NOT fire** — honest
  tally **1 of 1 green**, one run, no re-run performed.
- **CONVENTIONS' four live readers, all green.** The two kit tests were run
  BY NAME across all targets and the WHOLE output read, because a
  zero-match filter still exits 0:
  `snapshot_version_matches_the_live_method_stamps` — **1 passed**, 126
  filtered out, **13** result lines, **0** occurrences of `FAILED`, exit
  **0**; `every_compiled_entry_matches_its_method_file_byte_for_byte` — the
  same shape, exit **0**. This merge EDITS `method/tasks/TASK-FORMAT.md`,
  which IS a KIT_FILE, and the byte-for-byte test stayed green because
  `include_str!` recompiles from the same file. `roles/executor.md` and the
  new `lane-protocol.md` are deliberately NOT kit files (the kit is the
  planner's kickoff set; `the_snapshot_table_covers_every_method_scaffold_file`
  walks only `docs-templates`, `adapters`, `tasks`), so a new file at
  `method/`'s root adds no kit obligation — derived, not assumed. The other
  two readers, `workflow-parity` and `docs-input-gate`, ran inside the e2e
  suite (14 and 30 bodies, all green).
- **E2E: 129/129**, exit **0**, scratch port **14771** at the merge and
  **14773** on the post-checkpoint re-run (each bind-probed free on
  `127.0.0.1`, `0.0.0.0`, `::1`, `::` before use — a fresh port per run,
  since lanes collided on the default 14520 today); `npm run typecheck`
  **0**. Adds no spec, so equals main.
- **token lint: selftest 0, lint 0** — `clean (TOKEN 124 …; CONTROL 592
  tracked text files)`, 49 TOKEN + 4 CONTROL samples, 71 walk-policy, 8
  evidence-floor. The script lives in `tools/e2e` and is run from there;
  `npm run lint:tokens` from the repo root exits 254 with ENOENT (there is
  no root `package.json`) — a wrong invocation, not a red gate.
- **`cargo audit -n`** exit **0**: 472 crates, **0 vulnerabilities / 17
  allowed warnings**, unmoved — a 0-file `Cargo.lock` diff requires it.
- **`index --check`** exit **0** at the merge and **0** again after this
  checkpoint's doc edits.
- **DOCS GATE** exit **1**, owing four suites — all four run twice.
- **BOOT GATE** and **GRAPH REGEN**: NOT OWED, derived at 0 of 18 each and
  stated rather than skipped in silence.

## CONTROL closes from both directions; TOKEN did not move

Tracked files **599 at `a15b78e` → 610 at the merge**, the delta exactly
the **eleven files this merge ADDS** — ten `T-089-s1`…`s10` plus
`method/lane-protocol.md`. So CONTROL **581 (a15b78e, last checkpoint's
figure) + 11 = 592 (merge)**, and the lint printed **592**. TOKEN is
**124**, unchanged: this merge adds no `.ts/.tsx/.mjs` FILE under
`app/src`, `app/test` or `tools/e2e`. This checkpoint adds `T-089-s11`,
one tracked doc, so CONTROL is **593** at the checkpoint; TOKEN unchanged.

## The poison drill — three mutants at the MERGED commit, each one-sided

Detached scratch worktree `../nputer-T089-idrill` at **`4f25183`**, with
`CARGO_TARGET_DIR` set INSIDE it (`.drilltarget`) — T-013-s7's
cross-worktree manifest-path hazard, which has cost three agents; the main
checkout's `target/` was untouched. **Correspondence by hash before any
mutation**: `app/src-tauri/src/agent/kit.rs`
`649c54defe39ae672a8dd6ec2e99b4ce31cf452e6f988bc617eb899e1d586f2b` and
`docs/CONVENTIONS.md`
`428b3e172a7d598ca5203697a73bbb7649756b0bad133840b8681d4a21e3dbf1`,
each identical to `git show 4f25183:<path>`.

- **Baseline: `cargo test -p nputer --lib` -> 127 passed / 0 failed, exit
  0.** Baseline `npx playwright test tests/workflow-parity.spec.ts` -> **14
  passed, exit 0** (scratch port 14772, bind-probed on four stacks; the
  drill's `node_modules` and `lib/parser/dist` were SYMLINKS to the main
  checkout's, so no install ran anywhere).
- **M1 — `METHOD_SNAPSHOT_VERSION` "0.1.5" → "0.1.6", const alone.**
  One substitution, read back with `git diff` first. **Exit 101, 126
  passed / 1 failed**, the one red body
  `snapshot_version_matches_the_live_method_stamps` panicking at
  **`kit.rs:443:9`** — *"plan-interview.md's Output heading no longer
  stamps v0.1.6"*. **The PLAN-INTERVIEW arm, not the CONVENTIONS arm: the
  ordering asymmetry the gotcha claims, measured.**
- **M2 — CONVENTIONS' `currently v0.1.5` → `v0.1.6`, doc stamp alone.**
  One substitution. **Exit 101, 126 / 1**, same test, panicking at
  **`kit.rs:450:9`** — *"docs/CONVENTIONS.md no longer says 'currently
  v0.1.5'"*. Both halves of the pin kill by name.
- **M3 — a `## Build & test` command string reworded** (`npx vitest run`
  → `npx vitest --run`, one substitution in the lib/parser bullet).
  **workflow-parity exit 1, three red bodies**, naming BOTH sides: *"the
  doc lists … which this spec has no entry for"* and *"this spec expects
  … which the doc no longer lists — the doc is the source of truth."*

Each restored by byte copy from `git show 4f25183:<path>`, proved by an
empty per-path `git diff` and sha256 back to the recorded values, with both
drills re-run GREEN at the restored state (127/0 and 14 passed). The
symlinks and `.drilltarget/` were removed and the worktree removed; the
main checkout's `node_modules` and `lib/parser/dist` are intact.

## Security sweep — zero movement, every figure re-derived

The merge's diff is **eighteen `.md` files and nothing else**: no lockfile,
no `Cargo.toml`, no `package.json`, no `tauri.conf.json`, no capability
file, no `.entitlements`. **No dependency added. No code changed at all.**

- `app/src-tauri/src/acl_pin.rs` is a **0-file diff**, sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`,
  `EXPECTED_GRANTS` unmoved at **92** entries (declared line 54, closed
  line 147), green inside the cargo run.
- **IPC is THIRTEEN at both ends**: 13 line-anchored `#[tauri::command]`
  and 13 `generate_handler!` entries. No command added.
- `ENV_ALLOWLIST` unmoved at **16**; `runner.rs` a 0-file diff.
- **Exactly THREE `#[ignore]` ATTRIBUTES** (line-anchored:
  `agent_runner.rs:3767`, `self_graph.rs:58`, `perf.rs:53`) — the naive
  grep returns 11 because eight are doc-comment mentions.
- **0 added process surface** (`Command::new` / `.spawn(` /
  `child_process` added lines: 0).
- **0 NULs across all 18 paths — and the FIRST probe was a false green
  caught by its canary.** `LC_ALL=C grep -qU $'\0'` in zsh degenerates to
  an empty pattern and reported NUL in all 18; the canary said so
  immediately (T-064's lesson, working). The reported figure is from a
  byte-count probe (`wc -c` vs `tr -d '\000' | wc -c`) validated on BOTH a
  positive canary and a negative control.
- **No commit hash leaked into `method/`.** `grep -rnE "\b[0-9a-f]{7,40}\b"
  over `method/` excluding the tool's own name and template ids returns
  **nothing**; the only ids in `method/` are the pre-existing template ones
  (`T-000`, `T-001`, `T-014`, `T-015`, `T-016`, `T-017`). Every measured
  figure the card produced stayed in `docs/`, where it belongs.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and nothing
else**, before and after — no bind, no connect, no signal, on any
interface. Holder `node` pid **82549**, one socket `TCP [::1]:1420
(LISTEN)`, identical throughout.

1. **THEIR APP DID NOT RELAUNCH, AND THAT WAS PREDICTED.** Pid **22955**,
   started 21:04:25, is the same process before and after, under the same
   supervisor chain (`npm run tauri dev` 82342 → `tauri dev` 82364 → the
   binary). **The BOOT GATE derived NOT OWED at 0 of 18, and the window
   survived — T-084's generalisation confirmed in the NEGATIVE direction
   for the first time**: the gate's trigger set predicts the human's window
   both ways. It has relaunched three times today from sibling merges; if
   it moves again, that is another lane.
2. **The map pane sees the SAME graph** — `docs/architecture/graph.json` is
   a 0-byte diff at 588891 / 119 files / 1023 symbols / 1550 edges. No
   component relation, finding or drift ring moved.
3. **`app/dist` was rewritten** by the pre-suite `npm run build`, to
   byte-identical asset hashes (`index-DsNHI2Jr.js`, `index-CwYF5FQb.css`)
   — a rebuild, not a change, and vite dev does not serve from `dist`.

**No process from this integration survives.** Four scratch ports were
used, each bind-probed free on all four stacks (`127.0.0.1`, `0.0.0.0`,
`::1`, `::`) immediately before use and free again after: **14771** (e2e
at the merge), **14772** (the drill's workflow-parity runs), **14773**
(the e2e re-run after the checkpoint edits) and **14774** (the e2e re-run
after this file's own last correction — a docs code input, so T-081-s9
owes the run that validates the sentence you are reading). None is the
default 14520, on which lanes collided today. **No `pkill` at any point.** No `npm ci` / `npm
install` was run in the main checkout. The T-089 worktree is removed and
the branch kept. The two `nputer-T-060` `fake_agent` orphans
(`52504`/`52505`, ppid 1) are unchanged and left alone (T-043-s1). **The
untracked zero-byte file `z`** still sits in the main checkout — not mine,
not staged, left alone.

## The board, derived from disk at this checkpoint

**168 flat task files, 68 done / 40 planned / 28 parked / 32 suggested / 0
verifying**; 68 + 40 + 28 + 32 = 168. Twenty-two files sit in
`docs/tasks/rejected/`, counted separately. The deltas from `a15b78e` are
T-089 verifying → done, the ten merged `T-089-s1…s10`, and `T-089-s11`
materialized here. Every flat card's `status:` is in the parser's
vocabulary (the docs gate confirms it whole-tree).

**FOUR LIVE LANES AND ZERO CARDS AT `status: building`** — the lapse the
merged TASK-FORMAT bullet now rules on, still live on this board. Read a
missing stamp as a missing stamp; the authority on what is being built is
`git worktree list` (lane-protocol rule 7), and it is the merged method's
own answer to its own board.

## Provenance and health

T-089 is **built by `claude-opus-5` (two executors) and verified by
`claude-opus-5` (two passes)**, `review: same-model`, **rejected then
approved**. **68 done cards — 53 `same-model`, 9 `self-verified`, 5
`independent`, 1 EMPTY (T-056)**; 53 + 9 + 5 + 1 = 68. T-089 moves
`same-model` from 52 to 53.

At this checkpoint main contains T-089's merge `4f25183` plus this
checkpoint. Parser, app, Rust, E2E, token lint and its selftest, `cargo
audit`, the graph-currentness gate and the docs gate are all green; **all
three standing gates were DERIVED, one fired and was run, two were owed
nothing and said so.** Nothing is broken. **Known residuals of the
delivered artifact are filed, not hidden**: `T-089-s1` (the four-place
method bump this card owes and could not reach), `T-089-s9` (the
executor's step-2 contradiction and the undefined checkpoint), `T-089-s10`
(`closed_by:`'s missing format bullet and its second shape), `T-089-s11`
(brief-table rows 9 and 5), and the seven earlier `s2`…`s8`, two of which
(`s7`, `s8`) carry `closed_by:`.

## In progress / broken right now

**FOUR SIBLING LANES ARE LIVE and all four are DISJOINT from this merge** —
`comm -12` over each lane's branch-only path list against this merge's
eighteen returns **0**. **Tips are READINGS, not facts**: three of them
moved during this integration, and a fifth entry (T-097's worktree)
appeared between two `git worktree list` calls minutes apart.

| lane | branch | tip (read at this checkpoint) | branch paths | base | `touches` (lane's own card) |
|---|---|---|---|---|---|
| **T-013** | `task/T-013-semantic-zoom` | `650fdbe` | 26 at `056cb3d` | `2036fb2` | `[app-map, app-shell, app-agent]` |
| **T-085** | `task/T-085-package-relative-docs` | `a15b78e` | 0 | `a15b78e` | `[tools/e2e]` |
| **T-097** | `task/T-097-aliased-column` | `cce52e0` | 0 at `a15b78e` | `a15b78e` | `[app-board]` |
| **T-101** | `task/T-101-denial-visible` | `81155cf` | 0 at `a15b78e` | `a15b78e` | `[app-interview]` |

**T-013 IS THE ONE WITH A FENCE STORY.** Its lane card widened `touches:`
to `[app-map, app-shell, app-agent]` while main's copy still reads
`[app-map]` — the widening lives only in the lane, which is what
lane-protocol rule 5 forbids doing from inside a lane and what its own
`T-013-s1` is about. It overlaps this merge in ZERO files regardless. **It
is re-verifying a security fix and owes a SECOND `app-shell` merge, and
that merge's integrator MUST RE-DERIVE THE GRAPH FORECAST AGAINST THE
LATEST REGEN** — 1023/1550 as of this checkpoint, which this merge did not
move. A forecast computed against 1021/1546 or 1018/1539 is stale; the
regens COMPOUND. Its base is `2036fb2`, so its range must be derived there.

T-085, T-097 and T-101 were each cut at `a15b78e` and have **not committed
yet** — zero branch paths, so disjointness is trivially true today and must
be re-measured at whatever tip they actually present.

`task/T-089-brief-contract` is kept as a branch and its worktree is
removed.

## Next up

1. **`T-089-s1` IS THE ONE WITH A DEADLINE-SHAPED COST.** The method
   version is owed a bump to v0.1.6 and CONVENTIONS carries two sentences
   admitting the debt. It is a THREE-FILE commit — `docs/CONVENTIONS.md`'s
   stamp, `method/interview/plan-interview.md`'s Output heading, and
   `kit.rs`'s `METHOD_SNAPSHOT_VERSION` — plus a fourth, unpinned
   hand-edit at `CONVENTIONS.md:311`. It needs a fence that includes
   `app-agent`. Do not split it: the two asserts are ORDERED and a partial
   bump yields a second red, measured twice at this merge's drill.
2. **`T-089-s9` is the sharpest of the residuals** — `method/roles/
   executor.md` step 2 states an absolute the same commit's
   `lane-protocol.md` rule 4 contradicts, in the file the executor reads
   FIRST. One clause fixes it. `T-089-s11`'s two rows are in the same file
   and the same pass.
3. **`T-089-s3` is the structural one**: the brief contract is a normative
   table with no reader — nothing in the repo checks that an assembled
   brief has thirteen rows. T-090+'s assembler is the natural place, and
   until then the contract is enforced by whoever reads it.
4. **`T-089-s2` (the verifier is blind to a file it is required to read)
   is recorded and NOT resolved, deliberately.** `roles/verifier.md` gives
   the verifier only the card and the diff while executor step 5 appends
   the executor's reasoning to that same card. Both verdicts on T-089 note
   the exposure honestly rather than pretending to it.
5. **`T-089-s10` sets a convention either way.** `closed_by:` now has two
   shapes in the tree (a task name here, a hash in
   `docs/tasks/rejected/T-081-s7`) and no rule. Both are defensible; the
   absence of a rule is not.
6. **Triage the THIRTY-TWO suggestions.** T-089 deposited eleven of them.
7. **The lane list beat the board again.** Four live worktrees, zero cards
   at `status: building`. The merged `orchestrator.md` 5b now owns the
   stamp and the order; the first dispatch after this checkpoint is the one
   that tests whether writing a rule down changes what happens.
