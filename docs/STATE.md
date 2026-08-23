# State

Updated: 2026-08-23 by claude-opus-5 @T-064-integrate (T-064 merged and
checkpointed).

## Just completed

**T-064 — the switch tells one story.** F-03, milestone 3, size M,
`touches: [app-shell]`. Built by `claude-opus-5 @T-064`, verified by
`claude-opus-5 @T-064-verify`; `review: same-model`. Approved on the
FIRST verdict with **seven findings, none blocking**. Approved branch
tip **`cdaf5b7`** — the VERDICT commit, not the executor's `09ce637`,
because the verdict added two finding files; merge **`71f49cf`**. The
card was at `status: verifying`; the integrator stamped **`done`** at
this checkpoint — the **twelfth** card running.

**WHAT LANDED.** The genesis switch measured ONE folder TWICE and
shipped both answers. `probe_plan` runs BEFORE the arming rendezvous,
because its answer decides whether genesis may be offered at all;
`build_snapshot` runs AFTER the ack, because collecting earlier could
produce a tree older than the emit baseline. Between them sits a channel
round trip bounded only by `REARM_TIMEOUT` — 10 seconds. Write a plan
into the folder in that window and the app put the interview screen over
a folder that plainly had one: T-026's criterion 5 defeated by TIMING
rather than by routing. Now `has_plan` is ONE predicate with TWO
constructors and the LATER reading wins — the post-ack re-read is
**veto-only** (reached only where the probe already said "no plan", so
it can turn genesis OFF and never ON) and its verdict is
`open_as_project`'s own outcome, because the two paths have already
converged. On the shell's side `reducePickOutcome` stops discarding an
overtaking `docs-changed` emit that is a FRESHER reading of the SAME
folder; the snapshot-less arm's watermark became a `Math.max` and can no
longer walk backwards (measured 8 -> 7 before); `probe` was dropped from
`PickOutcome::Genesis` (zero live readers under `app/src`, measured at
BOTH endpoints); and `ShellState` gained `watcherLive`, closing T-063-s3
by arm (b) so a refused RE-subscribe that left attempt 1's live handler
attached stops telling the user no file change can reach the board.

**THE CRITERION'S OWN CONJUNCT WAS UNSATISFIABLE AND THE REINTERPRETATION
IS WHY THIS MERGE IS NOT A NO-OP.** Criterion 1 spelled the guard on
`switched.projectDir`; `resetDocsForProjectSwitch` is
`{ ...emptyState(), seq: prev.seq }` and `emptyState().projectDir` is
`""`, while `PickOutcome::Genesis`'s `project_dir` is
`canon.display().to_string()` from a canonicalized path and is never
empty. Implemented literally the guard would have been **constant-false**
and arm (b) a no-op. The executor moved it to `prev.docs.projectDir` —
the model that exists BEFORE the reset, which is the one the question is
actually about — and the verifier ruled the reinterpretation faithful
after deriving the same unsatisfiability independently. **A criterion can
be wrong in a way that only measurement finds, and "implemented as
written" would have been the worse outcome here.**

**SEVENTEEN PATHS, NINE OF THEM CODE, EIGHT UNDER `docs/`.** Re-derived
here: `M` the card, `A` seven findings `T-064-s1`…`s7`, `M`
`app/src-tauri/src/docs_watch.rs`, `M` `app/src/App.tsx`, `M`
`app/src/lib/watcher-store.ts`, and `M` six app test files
(`crescendo.test.ts`, `genesis-switch-truth.test.tsx`,
`shell-harness.test.ts`, `startup-recovery.test.ts`,
`startup-screen.test.tsx`, `watcher-store.test.ts`). 1 + 7 + 3 + 6 = 17.
2246 insertions, 90 deletions. Suffix census: **8 md, 5 ts, 3 tsx, 1
rs**.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 9a8d523 cdaf5b7 -> tree bbbcb57d…, exit 0
    git diff --name-only 9a8d523 <TREE>                        -> 17   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 9a8d523...cdaf5b7   (THREE dots)      -> 17   cmp against the forecast: exit 0
    git diff --name-only 2036fb2..cdaf5b7    (TWO, branch-only)-> 17   cmp against the forecast: exit 0
    git diff --name-only 9a8d523..cdaf5b7    (TWO dots)        -> 150  THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only 9a8d523..71f49cf    (TWO dots)        -> 17   THE MERGE'S DIFF, the only one that means anything
    git diff --name-only 9a8d523...71f49cf   (THREE dots)      -> 17   collapses onto the line above
    git diff --name-only 2036fb2..71f49cf    (TWO dots)        -> 150  the naive at-merge range

`git merge-base --is-ancestor 9a8d523 71f49cf` exits **0**, so at the
merge two dots and three dots COLLAPSE. Merge-base **`2036fb2`**; main
advanced **133** paths from it, the branch **17**, `comm -12` over the
sorted lists is **EMPTY**, and 133 + 17 = 150 — exactly the forbidden
count, and that arithmetic is the check that the two sets are disjoint.

**THE BRIEF'S FORECAST OF THE PRESCRIBED COUNT WAS OFF BY ONE, AND THE
DRIFT IS THE INTERESTING PART.** The verifier measured **15** at
`4d2f03c`; the dispatch brief predicted "~16 now with the verdict's
findings"; it is **17**. The verdict added TWO files (`T-064-s6`,
`T-064-s7`), not one. 15 + 2 = 17. **A forecast of a count is not a
count** — T-084's checkpoint recorded right-hand drift, T-061's recorded
left-hand drift, and this one records a THIRD way a figure goes stale:
somebody else's arithmetic on a moving endpoint, relayed forward as if
it were measured.

**THE FORECAST WAS EXACT UNDER BOTH METRICS.** `git merge-tree
--write-tree` returned tree
**`bbbcb57dd3ac85f43a94311e0da358bc507923aa`** at exit 0, read from `$?`
and not swallowed by a command substitution — and **the no-ff merge's
own `HEAD^{tree}` IS that tree**, with parents `9a8d523` and `cdaf5b7`
and nothing else; `cmp` of the whole forecast patch against the merge's
later diff exits **0**. The staged set at `git merge --no-commit` was the
seventeen paths and nothing more, `cmp`-ed against the forecast at exit
0. **NOTHING WAS WRITTEN INTO THE MERGE COMMIT** (`T-083-s4`); the graph
regen and every integrator edit are in this checkpoint.

## THREE gates — all three FIRE, and the naive range flips no ANSWER

| gate | prescribed `9a8d523..71f49cf` (TWO dots) | naive `2036fb2..71f49cf` (TWO dots) |
|---|---|---|
| BOOT GATE (`app/src-tauri/**`, `app/src/**`, either manifest) | **3 — FIRES** | **3 — fires** |
| GRAPH REGEN (`*.ts/*.tsx/*.js/*.jsx` outside docs/) | **8 — FIRES** | 10 — fires |
| DOCS GATE (a `docs/` path a code suite reads) | **8 — FIRES**, three suites | 130 — fires |

**THE THIRD DISTINCT OUTCOME IN THREE CHECKPOINTS, and it is the one
that argues hardest for the rule.** T-084's naive range MANUFACTURED a
BOOT CHECK; T-061's naive range agreed on every gate's answer and got
the DOCS GATE right for the wrong reason; here the naive range agrees on
all three ANSWERS and is wrong about every COUNT — 3/10/130 against
3/8/130... and even the two that match are coincidences of this tree.
BOOT is 3 both ways only because main's own 11 non-docs paths are
entirely `tools/e2e/**`, which that gate cannot see; GRAPH differs by
exactly the two `tools/e2e/tests/*.spec.ts` files T-061 moved, which
`.nputerignore` excludes from the walk anyway. **A gate that gives the
right answer from the wrong set has not been run — it has been guessed
at, correctly, once.**

**BOOT GATE — OWED at 3 of 17, RUN, exit 0.**
`NPUTER_BOOT_PORT=14731 npm run boot:check` from tools/e2e exits **0**
with both `[nputer]` lines (*project folder:* and *window "main"
created*), child pid 98457, captured group 98457 (setsid, so pgid ==
pid), tree stopped on SIGTERM, no survivor on the port on any of the
four stacks afterwards. The overlay was read off the wire and rewrote
the port only, appending to the committed `beforeDevCommand` — T-061's
own mechanism, exercised by the first merge that owes this gate since it
landed.

**GRAPH REGEN — OWED on 8 paths, RUN AT THE CHECKPOINT, and a REAL RED.**
`index --check --root ../..` exits **1** at the merge with the real-red
discriminator satisfied on both halves: both count lines present
(committed *585305 bytes · 119 files · 1018 symbols · 1539 edges*; fresh
*587539 · 119 · **1021** · **1546***) and `files +0 -0 ~8` — eight
CONTENT changes, zero adds, zero deletes, so it is not the `--root`
false red. **+3 symbols / +7 edges (+8 / −1)**, exactly the executor's
probe and the verifier's re-measurement. The new symbol is
`genesisSwitchIsOvertaken`; the one removed edge is the
`watcher-store.test.ts -> watcher-store.ts` import row, replaced by the
same row carrying one more symbol. The regen exits **0** and
`index --check` exits **0** after it. **RE-CHECKED AFTER THESE
CHECKPOINT EDITS and still 0** (the twice-run lesson): this checkpoint's
own diff is `docs/**` only, which `.nputerignore` excludes, so the graph
committed here cannot be stale by construction — but "cannot be stale by
construction" is exactly the claim that has to be measured rather than
asserted.

**THE FIXTURE FORECAST WAS REAL AND THE DOGFOOD ASSERTIONS DID NOT MOVE
— re-derived, not inherited.** T-077's lesson is that moved assertions
surface ONE AT A TIME, so the check is that the suites ran AFTER the
regen against the graph this checkpoint commits, not before it:
`architecture-dogfood.test.ts` + `map-dogfood-render.test.tsx` are
**9 + 8 = 17/17** and `lib/parser`'s `smoke.test.ts` is **4/4**, all
green, matching the executor's probe figures.

**DOCS GATE — FIRES, exit 1**, invoked DIRECTLY with `$(cat <the 17>)`
and never through `xargs`. Eight `docs/` paths owing **three** suites:
`npm test from app/`, `npm test from tools/e2e/`, `npx vitest run from
lib/parser/`. `cargo test from app/src-tauri/` is correctly NOT owed —
its two readers resolve `docs/architecture/components` and
`docs/CONVENTIONS.md`, neither of which this merge touches. It reports
**11 derived readers across 4 suites**, **0 frontmatter issues**,
a census of **118 docs-shaped sites in 22 files, 11 of them in 9 files
root-anchored**, and *every live task card's frontmatter parses, with a
legal status* — which is the machine check that the seven new findings
are legal, run by the gate rather than by eye. **This checkpoint's own
diff is entirely `docs/**`, so the gate fires on it too and all three
owed suites were re-run AFTER these edits.**

## The verdict's findings exist as FILES — checked, not assumed

T-061's integrator found five verdict findings living only as card-body
text, invisible to triage. **That did not repeat here.** `T-064-s6` and
`T-064-s7` are real files in the branch diff, with legal frontmatter
(`status: suggested`, `suggested_by: verifier claude-opus-5
@T-064-verify`), and the docs gate's whole-tree frontmatter arm confirms
it independently. **Nothing had to be materialized.** The two the
verifier wrote are the ones a card body would have swallowed:

- **`T-064-s6`** — the interleaving pin's THIRD clause is unprotected.
  `apply_genesis_folder`'s commit is three statements under one comment;
  hoisting `state.clear_rejected()` alone above the `ArmGenesis` send is
  **exit 0, nothing red** (`M1e`), while the body's own doc comment
  claims it covers the candidate. **The verifier WROTE AND MEASURED the
  closing body in the verdict** — green as shipped, red under `M1e` with
  `left: None, right: Some(<the chosen folder>)`. It is out of the
  approved diff and was **NOT grafted in at this merge**; the finding
  carries the body, and whoever takes the card gets it for free.
- **`T-064-s7`** — not this lane's code. The docs gate exits **2** on an
  empty path list (T-084-s6's close) and **exit 0, nothing owed** on a
  list of ONE EMPTY STRING, which is what the `$(cat …)` spelling
  produces when the range command fails. The same silence T-084-s6
  closed, wearing one more layer of costume.

**THE SHAPE-SIX RULING IS IN THE VERDICT AND IS THIS CHECKPOINT'S ONE
PIECE OF TAXONOMY** (feeds T-092). CONVENTIONS' shape six is "a body
that **reds** under an expected-value poison while killing no mutant
another test does not already kill" — it CAN red.
`genesis_and_no_docs_wire_shapes_are_pinned`'s
`…get("probe").is_none()` cannot: it runs after an `assert_eq!` on the
same `serde_json::Value` against a four-key map, and object equality is
key-set exact, so the assertion is reached only when the value provably
has no `probe` key. The verifier proved it one-sidedly with
`#[serde(rename = "probe")]` on the producer: as shipped the NEIGHBOUR
panics first and the assertion never runs; hoisted above its neighbour,
the same mutant panics with the message the assertion was kept for.
**An assertion that cannot red is not a declared shape six, it is
vacuous** — and "kept for its failure message" is self-defeating when
the message can never print. The remedy is one line (move it above its
neighbour) and is strictly better than deletion. **Not edited here** —
it is characterized, not blocking, and it is not this role's ruling to
implement.

## Suites, every number derived at this checkpoint, exits read unpiped

Each command's own `$?` was echoed immediately. **No exit code here was
taken through a pipe** (`${PIPESTATUS[0]}` is EMPTY in zsh — the trap
that bit T-061's integrator). `docs-gate.mjs` was fed `$(cat <list>)`,
never `xargs`.

- **parser: 263/263 across 12 files**, `PARSER_EXIT=0`; `npx tsc
  --noEmit` **0**; `npm run build` **0** FIRST, per the fresh-clone
  order.
- **app: 854/854 across 43 files**, `APP_TEST_EXIT=0`; `npm run build`
  **0**, **265 modules transformed**, `index-BAC5mE8s.js` **503.16 kB**
  and `index-CwYF5FQb.css` **43.95 kB**. **The JS hash IS this merge's
  doing** — `App.tsx` and `watcher-store.ts` are bundle inputs and both
  moved (T-061's merge moved none, and its bundle hash was `f306ee9`'s).
  The CSS hash is unchanged: no class moved.
- **bare Rust workspace, `cargo test --no-fail-fast`: 355 passed / 0
  failed / 3 ignored, exit 0**, summed programmatically over **fifteen**
  `test result:` lines. Not `--all-targets`, which skips doc-tests.
  **The T-061-s4 kill-path flake
  (`the_exit_reap_pays_the_full_grace_when_a_same_group_descendant_resists`)
  did NOT fire** — one run, zero failures, no re-runs needed and none
  performed. T-061's integrator got 0-of-7 and the verifier 3-of-7; this
  is one more green datum on a load-dependent race, and **it is not a
  baseline**.
- **E2E: 129/129**, `E2E_EXIT=0`, scratch port **14733**;
  `npm run typecheck` **0**. The verifier measured **121** at their tip
  and that figure was already stale before the handoff — T-061 took the
  lane to 129 on main, and the merged tree is 129 because this branch
  adds no spec. **A suite total is a figure like any other and needs its
  ref.**
- **token lint: selftest 0, lint 0** — `clean (TOKEN 124 …; CONTROL 575
  tracked text files)`, 49 TOKEN + 4 CONTROL samples, **71** walk-policy
  checks, 8 evidence-floor checks. This is also the repo's only NUL gate
  and it is green; independently, the merge's seventeen paths were read
  as bytes with `grep -qP '\x00'` (never the `$'\x00'` shell form that
  T-061 recorded as a false-positive generator) and **0 carry a NUL**.
- **`cargo audit -n`** exit **0**: 472 crate dependencies, **0
  vulnerabilities / 17 allowed warnings**, unmoved — which a 0-file
  `Cargo.lock` diff requires.
- **`index --check`** exit **1** before the regen, **0** after it, and
  **0** again after these checkpoint edits.
- **DOCS GATE** exit **1**, owing three suites — all three above, run
  twice.
- **BOOT GATE** exit **0**, owed at 3 of 17 and run.

## CONTROL closes from both directions, and TOKEN does not move

| ref | what it is | tracked | CONTROL | TOKEN |
|---|---|---|---|---|
| `2036fb2` | merge-base | 608 | 590 | 123 |
| `9a8d523` | main-before (T-061's checkpoint) | 586 | 568 | 124 |
| `cdaf5b7` | approved tip (the VERDICT commit) | 615 | 597 | 123 |
| `71f49cf` | **the merge** | 593 | **575** | **124** |
| this checkpoint | no file added or removed | 593 | **575** | **124** |

**575 is closed twice and neither route is the lint's own word for it.**
From main: 568 + the branch's 7 added files = 575. From the branch: 597
− main's net 22 removed = 575. The lint printed 575. The non-CONTROL
remainder is **18 at all four refs** (608−590, 586−568, 615−597,
593−575), which is the third check and the one that would catch an added
binary. TOKEN does not move because this branch adds no file under
`app/src`, `app/test` or `tools/e2e` — it MODIFIES six such files, and
TOKEN counts files.

## The poison drill — the brief's one mutant, at the MERGED commit

Detached scratch worktree at `71f49cf`, with `CARGO_TARGET_DIR` set
INSIDE the drill directory (T-013-s7). **Correspondence established by
hash before anything was mutated**: `docs_watch.rs`
`e7661598c4632900b40d4775c34f673077ce7609c3b3df6a9551440ca67b3177`,
identical to `git show 71f49cf:app/src-tauri/src/docs_watch.rs` — so the
drilled artifact IS the merged artifact by construction.

- **CONTROL, shipped code: `cargo test -p nputer --lib` -> 123 passed /
  0 failed, exit 0.** Run in the same scratch worktree as the mutant, so
  the environment is not the variable.
- **MUTANT M1b — ONLY `let seq = state.next_seq();` hoisted above the
  `ArmGenesis` send**, the other two commit statements left in place.
  Substitution count 2 (one removal, one insertion), mutated text read
  back with `git diff` before anything ran. **Exit 101, 122 passed / 1
  failed**, and the ONE red body is
  `the_watch_is_armed_before_the_switch_commits_so_an_emit_can_overtake_the_reply`
  — *"the switch had not stamped itself when the watch was armed",
  `left: 1, right: 0`*. **The interleaving pin kills it ALONE, with no
  neighbour**, reproducing the verifier's 122/1 exactly.

Restored by `git show 71f49cf:<path>`, proved twice — empty `git diff`,
sha256 back to `e7661598…`.

**THE T-013-s7 PRECAUTION WAS NECESSARY HERE AND IT WAS NOT FREE, which
is the opposite of T-061's finding and worth recording beside it.**
T-061's drill was node-only and its scratch `CARGO_TARGET_DIR` finished
at **0 bytes**; this one is a Rust drill and the scratch target finished
at **1.4 GiB** after a cold build. The main checkout's `target/` was
untouched by the drill (its binary hash is unchanged across the whole
drill window). **The cost of the precaution is a cold Rust build; the
cost of skipping it is what it cost T-064's own verifier — 26 red bodies
across five binaries, all naming a deleted directory, and a
`cargo clean` of 25 778 files / 5.5 GiB to recover.** Pay the build.

## Security sweep — zero movement, every figure re-derived

The merge's diff contains **no lockfile, no `Cargo.toml`, no
`package.json`, no `tauri.conf.json`, no capability file and no
`.entitlements`** — zero manifest paths of any kind. **No dependency
added.** The change is **boundary-NARROWING**: a field leaves the IPC
payload and none is added.

- `app/src-tauri/src/acl_pin.rs` is a **0-file diff**, sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`.
  `EXPECTED_GRANTS`: declaration line **54**, closing `];` line **147**,
  entries 55–146 = **92**, with **ZERO** comment or blank — counted four
  independent ways over the symbol-anchored body (92 quote-bearing
  lines, 92 quoted strings, 92 UNIQUE quoted strings, 0 comment/blank).
- **IPC is THIRTEEN at both ends**: 13 anchored `#[tauri::command]` and
  13 `generate_handler!` entries with comments stripped. The census trap
  reproduces — the unanchored literal reads **14** (a doc comment).
  Dropping `probe` from `PickOutcome::Genesis` changes the SHAPE of one
  command's return value and adds no command, which is why this figure
  is unmoved and why saying so is not a null result.
- **Exactly THREE `#[ignore]` ATTRIBUTES**, anchored on
  `^[[:space:]]*#\[ignore` with pathspec `'*.rs'` from the repo ROOT,
  all three carrying `= "reason"`.
- No secret-shaped content: all **2246** added lines scanned for
  `sk-`/`AKIA`/PEM/bearer/assignment shapes — **0 hits**. **0** added
  `unsafe`.
- **THE SWEEP THIS CARD ACTUALLY NEEDS is the path handling on the new
  re-read**, and the verifier drove it rather than reasoning about it:
  `under_docs_dir` and `is_flat_task_file` run on post-canonicalize
  project-relative POSIX paths behind `is_collected_docs_path`, and the
  adversarial spellings `docs/tasks/../../evil.md`, `docs//ROADMAP.md`,
  `docsfoo/ROADMAP.md` and bare `docs` are all **false**. Every error in
  this predicate is in the VETO direction, which is the safe one: a
  false positive refuses genesis and opens the folder as a project.

## What ACTUALLY reached the human's running app

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and with
nothing else, before and after.** No bind, no connect, no signal, on any
interface. Holder `node` pid **82549**, one socket, `TCP [::1]:1420
(LISTEN)`, identical at both ends.

1. **THEIR APP RELAUNCHED, AND IT WAS THE MERGE'S WORKING-TREE WRITE
   THAT DID IT — not a cargo run, not the boot gate.** App pid
   **85379 -> 93036**, started 20:32:58, ten seconds BEFORE the merge
   commit was written at 20:33:08: the relaunch was triggered by
   `git merge --no-ff --no-commit` putting the new
   `app/src-tauri/src/docs_watch.rs` on disk, which their `tauri dev`
   watcher rebuilt and relaunched from. Parent `tauri dev` pid 82364,
   `npm run tauri dev` 82342, vite 82549 and its esbuild helper 82550
   are **all unchanged and all still from Aug 18** — the supervisor
   survived; only the app binary it owns was replaced, which is exactly
   what `tauri dev` is for. Vite also hot-pushed `App.tsx` and
   `watcher-store.ts` into the webview. **T-084's generalisation holds a
   THIRD time and gets sharper: it is the BOOT GATE's own trigger set
   that predicts whether the human's window survives an integration —
   and the trigger fires at the WORKING-TREE WRITE, not at the commit.**
2. **`app/src-tauri/target/debug/nputer` moved twice** — sha256
   `8ef00495…` -> `cb0ee5d9…`. Their own rebuild wrote it first; my
   cargo runs and the regen relinked it after. A file on disk cannot
   reach a loaded process, so pid 93036 is running whatever their
   watcher built and is unaffected by everything after. **The poison
   drill did not touch it at all** — that is what the scratch
   `CARGO_TARGET_DIR` buys.
3. **The map pane sees a NEW graph** — `docs/architecture/graph.json`
   moved for the first time in three checkpoints: 585305 -> 587539
   bytes, 119 files (unchanged), 1018 -> **1021** symbols, 1539 ->
   **1546** edges. One new symbol in C-05 (`genesisSwitchIsOvertaken`)
   and seven new edges, all inside C-05 and its test files. No component
   relation, finding or drift ring moves; the map's architecture lens
   will look the same and its symbol counts will not.
4. **Docs-watcher snapshots.** T-064 now shows `done`, **seven** new
   `T-064-s*` cards are live, STATE, ROADMAP and ARCHITECTURE all moved.
   The suggestion column goes from eight to **fifteen**.
5. **`app/dist` was rewritten** by the pre-suite build, and unlike
   T-061's merge the bytes really are this merge's: `index-BAC5mE8s.js`
   replaces `index-kNOKiTKD.js`.

**No process from this integration survives.** Scratch ports **14731**
(boot gate), **14733** (the e2e lane before the checkpoint edits) and
**14734** (the owed re-run after them) were bind-probed free on all four
stacks (`127.0.0.1`, `0.0.0.0`, `::1`, `::`) before use — an IPv4-only
probe of a v6 listener reports free, which is why all four — and
verified empty after. **No `pkill` was used at any point.** The T-064
worktree is removed and the branch kept. The two `nputer-T-060`
`fake_agent` orphans (`52504`/`52505`, ppid 1, started Aug 18 16:21:18)
are unchanged before and after and deliberately left alone —
`T-043-s1`, a parked human decision.

**AN UNTRACKED ZERO-BYTE FILE `z` SITS IN THE MAIN CHECKOUT** (mtime
2026-08-23 17:34, predating this session). It is not mine, it is not
staged, and it was left alone. Recorded because `git status --porcelain`
is a staged-set discipline input and a reader who sees it should know it
was seen and declined.

**THE SCRATCH DIRECTORY IS NOT PRIVATE, ELEVENTH OBSERVATION.** Every
file this session wrote there was prefixed `T064-integ-`. This session
shared the scratchpad with `basedrill` (at `f306ee9`) and `mdrill` (at
`b416efb`), both belonging to other live sessions and both left
untouched.

## Findings and corrections from this integration

- **THE DISPATCH BRIEF WAS WRONG OR STALE IN FOUR PLACES**, none of them
  affecting the merge: the prescribed count is **17**, not the predicted
  ~16 (the verdict filed two findings, not one); the three sibling lanes
  are described as "still in verification" / "awaiting a verdict" when
  in fact **all three carry REJECTED verdicts dated 2026-08-23** and are
  back at `verifying`; the e2e figure to expect was given as 129 and is
  129, which is right, while the verifier's 121 was already stale at
  handoff; and T-013's tip is `c7528cc`, not the `a2173f8` the last
  checkpoint recorded. **Every one of these is a figure that was true
  when it was written.**
- **ARCHITECTURE WAS AMENDED, in two places, and the discriminator was a
  sentence going from FALSE to TRUE rather than from incomplete to
  complete.** The Genesis bullet under Interfaces asserts *"a folder that
  already holds a plan is routed to the ordinary open, so no overwrite
  path exists by construction"*. For a folder that ACQUIRED a plan during
  the rendezvous that sentence was false, and T-042's carry-the-tree work
  is what made the falseness visible on screen. It is now true at both
  moments, and the bullet says so, with the wire narrowing
  (`PickOutcome::Genesis` loses `probe`; IPC still 13/13) and the
  overtaking-emit rule recorded beside it. C-05's status row gains the
  matching clause. **This is the case T-061's checkpoint decided the
  other way** — there the C-07 sentence was *incomplete* and was left to
  a finding; here it was *false*.
- **ROADMAP WAS TICKED**, and the discriminator is the standing one: does
  it change what a USER can do or see? T-064 answers YES on the *see*
  half, twice — the interview screen over a folder that has a plan, and
  the first frame of an interview being emptier than the frame before
  it. Both are seconds-wide windows nobody would file a bug for; they are
  in the list because **the screen they produce is indistinguishable
  from the bug T-042 was written to fix**, and milestone 3's progress
  section already tells that story paragraph by paragraph. The
  `watcherLive` copy fix rides along in the same entry, because it comes
  from @human's own startup thread.
- **No new ADR.** Nothing non-obvious was decided by this role. The
  judgement calls — amending ARCHITECTURE where T-061 declined to,
  ticking ROADMAP for a seconds-wide window, and NOT grafting in
  `T-064-s6`'s measured body — are recorded above.
- **`T-064-s4` UNDERCOUNTS ITSELF and the verdict says so** (V3): the
  hand-written E2E mirror is stale in FOUR places, not two, and two of
  the misses are on the line the finding quotes. **No correction was
  appended and that is deliberate** — the verifier's own point is that
  no COUNT survives the next card, so writing "four" into the finding
  would repeat the defect one number later. The finding's thesis is
  right; its floor has to be structural (the mirror type-checked against
  `app/src/lib/watcher-store.ts`, which is T-065's subject).

## The board, derived from disk at both ends

Main-before (`9a8d523`): **144 flat task files, 65 done / 43 planned /
28 parked / 8 suggested**; 65 + 43 + 28 + 8 = 144. At this checkpoint:
**151 flat task files, 66 done / 42 planned / 28 parked / 15
suggested**; 66 + 42 + 28 + 15 = 151. The deltas are exactly T-064
planned → done and the seven new suggestion files. Twenty-two files sit
in `docs/tasks/rejected/` and are counted separately, as always.

**THE SUGGESTION BACKLOG NEARLY DOUBLED, 8 -> 15, AND IT IS STILL THE
WHOLE QUEUE.** The sixth triage took it to zero at `f306ee9`; T-061
deposited eight and T-064 seven. That is two merges' worth of honest
residual on a column that peaked at 81, and the fifteen below are the
entire backlog rather than its newest layer.

## Provenance

T-064 is **built by `claude-opus-5` and verified by `claude-opus-5`**,
`review: same-model`, **approved on the first verdict** — the executor
handed off at `status: verifying` and the integrator stamped `done`
here, which is **twelve of the last thirteen**, with T-058's executor
still the only outlier. The question of who stamps `done` is closed on
the evidence; only the writing-down into `method/` is left, and
`T-078-s3` records why a docs-fenced card cannot do it.

**66 done cards — 51 read `same-model`, 9 `self-verified`, 5
`independent`, and T-056 is a done card whose `review:` is EMPTY**;
51 + 9 + 5 + 1 = 66, so every done card carries the field. T-064 moves
`same-model` from 50 to 51. No card's history was re-stamped.

## Health of the tree

At this checkpoint main contains T-064's merge `71f49cf` plus this
checkpoint. Parser, app, Rust, E2E, token lint, the lint's own selftest,
`cargo audit`, the graph-currentness gate and the docs gate are all
green; **all three standing gates FIRED and all three were RUN** — the
first merge in this series where the trigger arithmetic owed every one
of them. Nothing is broken.

**ONE KNOWN-FALSE SENTENCE FROM THE PREVIOUS CHECKPOINT IS STILL LIVE**:
`tauri-boot-check.mjs:212`'s pgid claim, carried by `T-061-s8`.
**T-064 adds a VACUOUS ASSERTION rather than a false sentence** —
`genesis_and_no_docs_wire_shapes_are_pinned`'s `…get("probe").is_none()`
cannot red where it sits (see the shape-six ruling above), carried by
the verdict and headed for T-092's taxonomy.

## In progress / broken right now

**THREE SIBLING LANES ARE LIVE, all three carry a REJECTED verdict dated
2026-08-23, and all three are PAIRWISE DISJOINT and disjoint from this
merge** — measured at this checkpoint with `comm -12` over each lane's
branch-only path list, every pair returning **0**, and every lane
against this merge's seventeen returning **0** too.

| lane | branch | tip | status on its branch | paths | `touches` |
|---|---|---|---|---|---|
| **T-013** | `task/T-013-semantic-zoom` | `c7528cc` | `verifying`, verdict **REJECTED** 2026-08-23 | 24 | `[app-map, app-shell]` |
| **T-070** | `task/T-070-arrival-reads-disk` | `fc5f5c9` | `verifying`, REJECTED then **rebuilt by a second executor** (`@T-070-fix`) | 11 | `[app-agent, app-interview]` |
| **T-089** | `task/T-089-brief-contract` | `989731c` -> `b38a3cf` | `verifying`, verdict **REJECTED** 2026-08-23 | 16 at `989731c` | `[method/, docs/CONVENTIONS.md]` |

**T-013 STILL SHARES THE `app-shell` SLUG AND STILL OVERLAPS IN ZERO
FILES** — measured a fourth time, at a tip (`c7528cc`) that is not the
one the last checkpoint recorded (`a2173f8`). The shared-slug case the
fence rules allow, and the one worth re-measuring at every checkpoint
because the fences are declared and the files are not.

**T-013'S INTEGRATOR MUST RE-DERIVE EVERYTHING AGAINST THIS MERGE, AND
THE GRAPH IS THE SPECIFIC TRAP.** T-013's regen forecast of **119 -> 126
files** was computed against a graph with **1018 symbols / 1539 edges**;
that graph no longer exists. This checkpoint commits **1021 / 1546** at
the same 119 files, so the FILE half of T-013's forecast is untouched
while its symbol and edge deltas were measured from a base that has
moved by +3 / +7. **The two regens compound and neither integrator's
figures are transitive.** T-089's merge-base is `4d2f03c`, not
`2036fb2`, so its range must be derived at its own base as well.

**T-089 MOVED TWICE WHILE I WAS MEASURING IT** — `b416efb` when the
worktree list was taken, `989731c` when its path count was derived,
`b38a3cf` at the final census — which is why every tip in that table is
named and why the path count carries the ref it was measured at. It is
the same lesson as the stale forecast above, arriving from a third
direction: **a sibling lane's tip is not a fact, it is a reading**.

`task/T-064-switch-one-story` is kept as a branch and its worktree is
removed. Scratch worktrees belonging to OTHER live sessions were present
DURING this integration and left untouched — `basedrill` at `f306ee9`
and `mdrill` at `b416efb` under the shared scratchpad, and
`nputer-T-070-vdrill2` at `fc5f5c9` beside the T-070 lane, which
appeared while this checkpoint was being written. **All three were gone
by the final census**, removed by their own sessions; do not read the
list as an inventory. **Zero processes from THIS integration survive**,
verified by grepping the full `ps` for this session's scratch prefix and
by re-probing all five of its scratch ports (14731-14735, every one
free).

## Next up

1. **Triage the FIFTEEN suggestions — the whole queue, still.** Two
   pairs from T-064 fold: `T-064-s1` + `T-064-s5` are one item (the
   casing rule and the directory-named-`*.md` case are both "one
   predicate, two inputs, two questions" at the same seam, and NEITHER
   side of either disagreement is held by a test today — that is the
   argument, not the bug). `T-064-s3` is T-065's subject arriving early,
   as is `T-064-s4`.
2. **`T-064-s6` IS THE SHARPEST OF THE SEVEN AND IT SHIPS ITS OWN
   CLOSER.** The verifier wrote and MEASURED the closing body — green as
   shipped, red under `M1e`. It is a card whose implementation is
   already done and whose remaining work is judgement: whether the
   candidate belongs inside the pin the doc comment already claims it is
   in. Size it against the claim, not against the diff.
3. **`T-064-s7` belongs with `T-061-s5` and `T-061-s7`** — all three are
   the standing gates' own contracts, and this one is a SECOND escape
   from a hole T-084-s6 was filed to close. A gate that answers "nothing
   owed" to a failed range command is the failure mode the whole range
   rule exists to prevent, reached one spelling later.
4. **THE SHAPE-SIX TAXONOMY (T-092) HAS ITS FIRST HARD RULING** and it
   came from a verdict rather than from the taxonomy card: declaring a
   shape six is honest only when the body can actually RED. Feed it in
   with the measurement, not the conclusion.
5. **Three lanes are in flight and all three were REJECTED today.** That
   is a new shape for this board — the previous eleven merges ran at
   roughly one rejection between them — and it is worth asking at triage
   whether the verdicts share a cause before treating them as three
   independent lanes having a bad day.
6. **`T-083-s2` remains sharp.** This checkpoint adds a fixture the set
   does not have: a prescribed count that was FORECAST rather than
   measured and came in one high, from a brief relaying a verifier's
   figure across an endpoint that had moved. T-084 contributed
   right-hand drift, T-061 left-hand drift; this is drift in the
   RELAY.
