# State

Updated: 2026-08-19 by integrator (T-073 merged and checkpointed),
claude-opus-5 @fresh

## Just completed

**T-073 — the ambient node surface stops being a write permit for
`app/src`.** F-02, milestone 4, size S, `touches: [app-shell]`. Built
and verified by `claude-opus-5 @fresh`, `review: same-model`. Approved
branch tip **`bb4cd14`**; merge **`a137d20`**. The card was at
`status: verifying`; the integrator stamped **`done`** at this
checkpoint, the fourth card running (T-043, T-057, T-076, T-073).

**A GUARD THAT USED TO BE FREE, AND STOPPED BEING FREE WITHOUT ANYONE
DECIDING THAT IT SHOULD.** `app/tsconfig.json` read
`"include": ["src", "test"]`, so `app/test/node-builtins.d.ts` was
visible to `app/src`. That file exists **precisely because** the app
ships no `@types/node`: a webview module reaching for a node builtin
fails `tsc` by construction, which is half of ADR-017 — the spawned
planner writes, the app renders what lands — enforced by the type
system rather than by review. T-028 legitimately extended the file with
`mkdtempSync`/`mkdirSync`/`writeFileSync`/`rmSync` and `node:os`'s
`tmpdir` for its own temp-project writes, and the side effect was that
`app/src` acquired them too. Measured at the base rather than argued: a
four-line probe under `app/src` importing `mkdirSync`/`writeFileSync`
typechecked at **exit 0, zero diagnostics**.

**THE SPLIT HAD TO BE A PROGRAM BOUNDARY, AND THE CARD'S OWN SECOND
OPTION WAS REFUTED BY MEASUREMENT.** The criterion offered "a second
ambient file included only by a test-scoped tsconfig, **or** a
`declare module` block inside the one test that needs it". The second is
not an alternative: **ambient module declarations merge PROGRAM-WIDE**.
With the write block deleted from the shared file and written only at
the bottom of `crescendo-dom.test.tsx`, the `app/src` probe **still
compiled at exit 0** — and a module file can AUGMENT an ambient module
but never CREATE one (`TS2664`, "Invalid module name in augmentation",
for the matching `node:os` block). One program cannot both grant the
writes to a test and deny them to `app/src`. Filed as `T-073-s3`,
reproduced on both limbs by the verifier, and it belongs in
CONVENTIONS because the card specified an option that could not have
worked.

**WHAT WAS BUILT.** `app/test/node-builtins-write.d.ts` carries T-028's
whole surface, moved as ONE unit because `tmpdir` is what makes the
writes land outside the repo. `app/tsconfig.test.json` is `extends`
plus `include: ["src", "test"]` and nothing else, so the two programs
cannot drift in any compiler OPTION. `app/tsconfig.json` narrows to
`["src", "test/node-builtins.d.ts"]` — the shipped frontend plus the
read-only surface, named one path at a time so the guard is legible in
the config. And `app/package.json`'s build becomes
`tsc && tsc -p tsconfig.test.json && vite build`.

**THE SWEEP IS THE SECOND, INDEPENDENT CLOSER — "BOTH, NOT EITHER" IS
MEASURED.** `crescendo-dom.test.tsx` now shares ONE `frontendFiles()`
walk with the IPC census beside it, and the sink sweep runs over all of
`src`: **8 files → 47 files across 9 directories**, all clean of all
eleven sinks. On ONE probe the type gate reds at exit 2 (TS2305 +
TS2724) and the sweep reds at exit 1, while **the pre-T-073 sweep
replayed verbatim over the identical tree reports `files=8 hits=0`**.

**ZERO BEHAVIOUR CHANGE, IN THE STRONG FORM.** `app/src` is
byte-identical to main-before (53/53 files match `git show HEAD:<path>`,
0 mismatches); no bundle input moved at all
(`app/src`, `index.html`, `vite.config.ts`, `package-lock.json`,
`components.json` — 0-file diff); and a HEAD build against a build with
`16bb47b`'s `app/tsconfig.json` swapped in reports `diff -r`
**DIRECTORIES IDENTICAL**, exit 0, at the MERGED tree rather than the
branch's. Both sides emit `index-DjYVlJel.js` 501.37 kB and
`index-CwYF5FQb.css` 43.95 kB — main's own T-076 figures, unmoved.

## The two findings, which matter more than the merge

Both survive the **full 827-test app suite at exit 0**, and both are
**shape seven** — a mutant no body kills, produced by deriving the
mutant set from the PINS rather than from the CRITERIA. **This is the
third independent discovery of that shape in three lanes in one day**
(`T-076-s4` at this morning's merge, `T-069-s3` in the relay lane, and
now these). Three lanes that could not see each other is no longer
evidence about a card; it is evidence about the METHOD's drill clause.

- **`T-073-s4` — the corpus pin holds ONE of the sweep's three
  dimensions.** It pins what `frontendFiles()` RETURNS. It does not pin
  the sink VOCABULARY: deleting `"fetch("` from `SINKS` with a live
  `await fetch("https://example.com/telemetry", {method:"POST", …})` in
  `app/src` gives **42 files / 827 tests / exit 0** with a network sink
  in the shipped frontend, and `tsc` is structurally blind to it because
  `fetch` is DOM-typed — which is exactly the class the sweep exists
  for. It does not pin the sweep's ITERATION either: one
  `if (file === "…") continue; // known false positive` inside the loop
  leaves the sink unswept, **14/14 green**, with the corpus pin
  untouched BY CONSTRUCTION because the corpus genuinely did not change.
  A per-file excuse is how a sweep dies in practice — the first
  legitimate false positive earns one, and nothing then holds the rest.
  **And `rmSync` matches NONE of the eleven sink strings**, so for the
  most destructive call in T-028's surface the type guard is a SINGLE
  point of failure.
- **`T-073-s5` — the include pin admits TWO passing reverts.** It is a
  **first-match regex over raw text**, so widening the include line
  while leaving the old value in an explanatory comment gives
  compiler-obeys-second, pin-reads-first: `tsc` exits 0 with a write
  probe under `app/src` and the pin passes **14/14 with the guard
  gone**. And a single
  `/// <reference path="./node-builtins-write.d.ts" />` at the top of
  the shared ambient file puts the writes back in the app program with
  **every pinned fact untouched** — include list unmoved, neither
  ambient file's export set moved — **827/827 green with
  `rmSync(dir, {recursive:true, force:true})` live in `app/src`**. The
  verifier **measured the fix rather than proposing it**:
  `tsc --noEmit --listFiles` catches the triple-slash reference and
  closes all three doors by asserting the PROGRAM instead of a proxy
  for it.

**WHY IT IS STILL APPROVED, IN THE HONEST FRAME.** Both findings are
about the **third pin** — a mechanism the card built BEYOND its
criteria, on the correct instinct that a restoration nothing holds is no
restoration. The instinct deserves the credit; the mechanism is one
dimension short in two places. **Nothing the criteria bought is
weakened: the app program genuinely denies the writes today, and the
sweep genuinely covers all 47 files today. What is not held is that
both STAY true.** That is the whole of it, and it is the next card
rather than this one.

## The size-S question, closed by the integrator

TASK-FORMAT's ceremony table reads **"S | executor + tests. No verifier,
no separate integrator."** — a sharper question than the verdict handed
over, because it dispenses with BOTH extra passes. Taken literally it
would have licensed `done` at handoff and no merge pass at all.

**RULING: the `size:` field stays `S`, and the ceremony that ran was
M-shaped.** The field measures the WORK, and the work is genuinely S —
six files under `app/`, zero Rust, zero IPC, zero grant, `app/src`
byte-identical and the bundle proved identical by `diff -r`. Neither
extra pass was triggered by size:

1. **The verifier was triggered by a FENCE BREACH the executor declared
   it could not judge.** A tier that says "no verifier" cannot also say
   "and the executor may rule on its own out-of-fence edit." The pass
   paid for itself in a way that is measured, not argued: it produced
   `T-073-s4` and `T-073-s5`, and it turned the flagged
   `app/package.json` line into a ruling backed by numbers. A real type
   error planted in a test file: bare `tsc` **exit 0** (misses it),
   `vitest` **exit 0** (transpiles without typechecking),
   `tsc -p tsconfig.test.json` **exit 2** (catches it). **Without that
   one manifest line nothing in this repo typechecks any of the 42 test
   files** — a silent, permanent coverage loss in exchange for avoiding
   a one-word manifest edit. IN FENCE, and the line stays.
2. **The integrator was triggered by CONVENTIONS, not by TASK-FORMAT.**
   This merge fires two standing gates, and the graph regen is defined
   as the integrator's act AT THE CHECKPOINT because a graph
   regenerated into the merge commit is stale again the moment the
   dogfood fixtures are reconciled — which this merge demonstrated
   again, below. A size tier in `method/` cannot dispense with a gate
   in `docs/CONVENTIONS.md`: something has to regenerate the graph, and
   "no separate integrator" has no answer for who.

The honest reading is that the S row describes the ceremony that is
SUFFICIENT when a card stays inside its fence and moves nothing the
gates watch. **T-073 does neither.** The row needs that carve-out
written into it; it is an open question below rather than a sixth
suggestion file, because T-078 owns exactly this text and is in flight.

## Card corrections carried, not summarised

Five are recorded in the verdict. Re-derived or re-read at this merge:

1. **"Parsed out of the JSON, not string-matched" is FALSE for the
   include half** — and so is the test's own comment, "neither
   assertion can be satisfied by a comment". It is
   `/"include"\s*:\s*\[([^\]]*)\]/.exec(text)` over the raw file:
   first match wins, and comments are text. The **export-surface**
   halves ARE read from declarations, so that part of the sentence
   stands. This is the fact `T-073-s5` turns on and the reason it is
   quoted here rather than left on the card.
2. **"The pin reds on every realistic narrowing"** is true of the FILE
   dimension only — see `T-073-s4`.
3. **A quoted restoration hash belongs to an earlier commit, not HEAD.**
   `crescendo-dom.test.tsx`'s `deb2badd…` is the file at **`1a1e388`**,
   correct for the P1–P5 drills that ran before the third pin landed and
   a mismatch for anyone checking it against HEAD. Name the commit
   beside the hash. (This is the same lesson as T-076's stale range
   figure, one level down: **a hash is a fact about a COMMIT.**)
4. The `app/src` aggregate digest `4fe995c4…` does not reproduce under
   four obvious forms of the same computation; the load-bearing claim
   (53 files, 0 mismatches against `git show HEAD:<path>`) reproduces
   exactly, **and reproduced again at this merge**. Quote the command
   or quote only the per-file result.
5. `T-073-s2` names the triple-slash reference as a way a file enters a
   program without noticing that it therefore also walks around the pin
   the same card built. Cross-reference `T-073-s5`.

## Integration truth

T-073 and main shared base **`76cf034`** — which is also the
`merge-base`, because T-076 merged into main from the same base.
Main-before was **`16bb47b`** and the approved worktree was clean at
**`bb4cd14`**. Main advanced **24** paths from that base (T-076's merge
plus its checkpoint); T-073 changed **12**. **Their changed-file
intersection is EMPTY**, computed with `comm -12` over the two sorted
lists rather than argued from the slugs. The read-only `merge-tree`
predicted tree **`fc43e32b`** before anything was written, and the no-ff
merge **`a137d20`** produced that tree exactly, with parents `16bb47b`
and `bb4cd14` and nothing else.

**The merge's diff (`16bb47b..a137d20`) is TWELVE files**,
+1184/−41: six under `app/` (`package.json`, `tsconfig.json`, the new
`tsconfig.test.json`, `test/crescendo-dom.test.tsx`,
`test/node-builtins.d.ts`, the new `test/node-builtins-write.d.ts`) and
six under `docs/tasks/` (the card and its five `T-073-s*` files). By
suffix that is **6 `.md` + 3 `.json` + 2 `.ts` + 1 `.tsx`**; four are
additions and eight modifications. `file --mime` reports
`charset=utf-8` on eleven and `us-ascii` on `app/package.json` — a
subset, not a discrepancy. The naive `merge-base..HEAD` derivation
returns **THIRTY-SIX**, and because the intersection is empty,
12 + 24 = 36 exactly, which is the arithmetic check that the two sets
really are disjoint.

**The brief's ranges were re-derived rather than trusted, and they were
right this time.** The last merge's brief carried a figure belonging to
the executor's tip rather than the approved one; this one named
`bb4cd14`, 12 files and the 117→118 graph delta, and every one
reproduces. What did NOT survive re-derivation is the graph's
BASELINE — see the gate section: the branch measured against the
pre-T-076 graph and its symbol/edge/byte figures are stale by
construction, which is why the rule is to re-derive against MERGED main
and not to carry a delta.

**The board, derived from disk at both ends.** Main-before: **111 task
files, 53 done / 27 planned / 20 parked / 11 suggested**. At this
checkpoint: **116 task files, 54 done / 26 planned / 20 parked / 16
suggested**; 54 + 26 + 20 + 16 = 116. The deltas are exactly T-073
planned→done and the five new suggestion files. Ten files sit in
`docs/tasks/rejected/` and are counted separately, as always.

**Security movement is zero, and the manifest limb is the one that
needed checking rather than assuming.** The merge's diff contains **no
`.rs` file, no lockfile, no `Cargo.toml` and no `tauri.conf.json`** —
0 paths matched. It DOES contain three `.json` files, which is unusual
for this repo, so each was read: `app/package.json`'s whole diff is one
line inside `"scripts"` — **no dependency, devDependency or version
moved** — and the two tsconfigs are compiler configuration with no
network, path or capability surface. `acl_pin.rs` is byte-identical
across the merge (sha256
`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`)
with **92** grants counted twice from the `EXPECTED_GRANTS` array body —
92 entry lines and 92 unique strings agreeing. The IPC surface is
unchanged at **thirteen** commands, derived from both ends: 13
`#[tauri::command]` attributes in `app/src-tauri/src/lib.rs` (a
fourteenth `git grep` hit is prose in `agent/mod.rs`'s doc comment) and
13 names in `generate_handler!`. **Three** ignored tests, which is what
the cargo run itself reports.

## Suites, every number derived at this merge, exits read unpiped

No suite was piped through `tail`, `head` or `grep`; every command
redirected to a file and the exit code was read with `echo $?` from the
command itself.

- **parser: 263/263 across 12 files**, exit 0; `tsc --noEmit` exit 0.
  **UNCHANGED, and it is unchanged for a derivable reason**: the merge's
  diff contains **zero `lib/parser` paths**, so main's post-T-076
  baseline carries unmoved. `lib/parser` was NOT rebuilt — nothing in it
  moved — which is why the human's frontend did not hot-update this
  time (below).
- **app: 827/827 across 42 files**, exit 0, run twice — once at the
  merge and again after the graph regen and fixture reconciliation.
  `npm run build` exit 0 with **265 modules transformed**. The build is
  a PREREQUISITE, not a courtesy: without `app/dist` twelve
  shipped-bundle assertions fail by design. **The `+2` is DERIVED, not
  carried**: main-before is 825, and the count of `it()`/`test()`
  openers under `app/test` moves **775 → 777** across the merge's own
  diff — all of it `crescendo-dom.test.tsx` **12 → 14**, the corpus pin
  and the include/surface pin — with the test-FILE count unchanged at
  **42**, because the one new file is a `.d.ts` and not a suite.
  **And the bundle was proved unchanged the strong way, at the merged
  tree**: both sides built, `diff -r dist dist-base` exit 0,
  DIRECTORIES IDENTICAL, every asset and `index.html` — not just the
  hashed names. `dist-base/` was removed and `app/tsconfig.json`
  restored, sha256-verified against `git show HEAD:<path>`.
- **bare Rust workspace: 337 passed / 0 failed / 3 ignored**, exit 0,
  summed from **fifteen** `test result:` lines: `nputer_lib` 117 ·
  `fake_agent` 0 · `nputer` 0 · `agent_runner` 60 + 1 ignored ·
  `nputer_index` lib 123 · `nputer-index` bin 0 · arch 7 · cli 13 ·
  containment 3 · golden 7 · perf 0 + 1 · self_graph 2 + 1 · watch 4 ·
  doctests 1 / 0. Identical to main's baseline, and it has to be: the
  merge's diff has **zero `.rs` paths**.
- **E2E: 88/88**, exit 0, `npm run typecheck` exit 0, scratch port
  **17308** bind-probed free with a real `net.createServer().listen()`
  before use and proven free again afterwards, one worker, zero
  retries, zero skips. The lane was RUN rather than argued away —
  `workflow-parity.spec.ts:243` pins `npm run build` as a COMMAND
  STRING, not a script body, so the manifest edit is invisible to it,
  and that is a claim worth measuring rather than repeating.
- **token lint: TOKEN 119 / CONTROL 514**, exit 0; selftest **49 TOKEN
  samples + 2 CONTROL samples, 37 walk-policy checks**, exit 0.
- **`cargo audit -n`** (no fetch) exit 0: **0 vulnerabilities / 17
  allowed warnings** over 472 locked crates against the existing
  1,216-advisory database — the same 16 `unmaintained` + 1 `unsound`
  baseline, unmoved.

**BOTH LINT COUNTS MOVE AND BOTH ARITHMETICS CLOSE FROM TWO
DIRECTIONS.** TOKEN 118 → **119** is exactly the one new file under
`app/test` (`node-builtins-write.d.ts`); `app/tsconfig.test.json` sits
in `app/`, not `app/test/`, so it correctly counts for CONTROL and not
for TOKEN. Tracked files are **525** at main-before and **532** at the
merge — the five `T-073-s*` files plus the two new `app/` files, and
nothing else — and 532 − 18 binary assets gives **514**, which is what
the shipped scanner reports. **Nothing pins either count**, which is
what T-058-s1 is about and what T-080 — now a live lane — inherits.

**No `npm ci` or `npm install` ran in the main checkout** (T-052
mechanism B): every suite ran against the existing install. **AND THE
FRESH-INSTALL PROOF WAS TAKEN THIS TIME, in a detached scratch worktree
at the MERGED COMMIT — because this merge moves the manifest and the
last two did not.** The gap the last checkpoint declared deliberate is
closed, and it was worth closing here rather than anywhere: the line
that moved IS the build command, so a fresh install is the only thing
that proves the new command resolves from nothing.

`git worktree add --detach` at the checkpoint, then ADR-011's fresh-clone
ORDER, parser first: `npm ci` and `npm run build` in `lib/parser` both
exit **0** (13 `dist/*.js` emitted); `npm ci` in `app/` exits **0** with
`node_modules/@nputer/parser` resolving through the `file:../lib/parser`
symlink; and `npm run build` exits **0** running the script that
actually changed —

    > tsc && tsc -p tsconfig.test.json && vite build

— for **265 modules transformed**. Then the strong part: the app suite
in that clean tree is **827/827 across 42 files at exit 0**, and
`diff -r` between the fresh worktree's `dist/` and the main checkout's
reports **IDENTICAL**. That is a THIRD independent reproduction of
`index-DjYVlJel.js` 501.37 kB / `index-CwYF5FQb.css` 43.95 kB — from
main-before's tsconfig, from HEAD's, and now from a clean install of the
merged commit. The worktree (289 MB) was removed with
`git worktree remove --force` and the directory deleted; no lockfile,
`node_modules` or `dist` in the main checkout was touched by it.
`app/package-lock.json` is a 0-file diff across the merge.

## The two gates, with their triggers computed

**BOOT GATE — IT FIRES, ON THE MANIFEST LIMB ALONE.** The trigger is
`app/src/**`, `app/src-tauri/**`, `app/package.json` or
`app/src-tauri/Cargo.toml` over **`16bb47b..a137d20`**:
`app/src-tauri/**` **0**, `app/src/**` **0**,
`app/src-tauri/Cargo.toml` **0**, `app/package.json` **1**. The
frontend limb does not fire at all, which is unusual and is the direct
consequence of `app/src` being byte-identical.

Run as `NPUTER_BOOT_PORT=17307 npm run boot:check` from `tools/e2e`,
port bind-probed free before spawning and well away from 1420.
**`BOOT_EXIT=0`** — my own `echo $?`, not the script's word — with both
startup lines seen: `[nputer] project folder: /Users/ujju/Projects/nputer`
and `[nputer] window "main" created`. The tree was stopped cleanly
(`exit=null signal=SIGTERM`) and 17307 was re-probed FREE afterwards.

**BOTH DERIVATIONS AGREE THIS TIME — 1 path and 1 path — AND THAT DOES
NOT RESTORE THE SENTENCE CONVENTIONS STILL CARRIES.** The naive
`76cf034..a137d20` filter also matches exactly `app/package.json`,
because main's own advance was `lib/parser/**` + `docs/**` and contains
no trigger path at all. So this merge is not a second counter-example.
**But the last one was**: at the T-076 merge the two derivations
returned **0 and 5**, the first time they disagreed about the ANSWER
rather than the width, which falsifies CONVENTIONS' own line "it has
never yet changed WHETHER the gate fires — both derivations fired all
six times." That sentence is now false and stays false; one agreeing
merge does not un-falsify it. **T-078 owns the text and should correct
it rather than let a second integrator re-derive the counter-example.**

**GRAPH REGEN — the trigger FIRES, and here the two derivations DO
disagree, in width.** `*.ts/*.tsx/*.js/*.jsx` outside `docs/` over the
merge's diff matches **THREE** files, all under `app/test/`:
`crescendo-dom.test.tsx`, `node-builtins-write.d.ts`,
`node-builtins.d.ts`. The naive derivation matches **EIGHTEEN** — the
extra fifteen are T-076's `lib/parser` work, already merged and already
regenerated at its own checkpoint. Same gate, same answer, a trigger
set six times too wide.

**The read-only gate was run first and its forecast checked line by
line before anything was written, against MERGED MAIN and not against
the branch's figures:**

    INDEX_CHECK_EXIT=1   graph.json is STALE
      committed:   575351 bytes · 117 files · 995 symbols · 1518 edges
      fresh index: 575612 bytes · 118 files · 995 symbols · 1518 edges
      files  +1  -0  ~2
      | + app/test/node-builtins-write.d.ts
      | ~ app/test/crescendo-dom.test.tsx  (content, loc 575 -> 677)
      | ~ app/test/node-builtins.d.ts      (content, loc 47 -> 49)

The committed graph at main-before hashes
`56178286e733de5cc7029cb70ec23ee48a48307e13f97ef0824734609e55abea`,
exactly what the last checkpoint recorded. **The branch's own figures
were 571733 → 571994 bytes, 989 symbols, 1508 edges — correct against
the PRE-T-076 graph and stale against this one.** The FILE delta is
identical on both baselines and so is the **+261-byte** delta, which is
the cross-check that the file movement is T-073's alone.

**`symbols +0` and `edges +0` are the load-bearing lines, and they are a
first for this ledger.** A file JOINS the index and contributes no
symbol, because the new file is an ambient declaration file: nothing in
it is a definition the extractor names. So no node and no edge moves,
and the only fixture consequences are the file COUNT and C-05's
mapping row.

**The `ceaa949` order was followed and it MATTERED, measurably, for the
TWENTY-THIRD hold** (derived from the ledger: T-076's was the
twenty-second). Regen to MEASURE
(`56178286…` → `5adafa45…`, 575,612 bytes), then the fixture edits,
then a re-check that proved the edits had staled the measuring regen —
`files +0 -0 ~2`, `architecture-dogfood.test.ts` loc 1680→1730 and
`map-dogfood-render.test.tsx` loc 354→365 — then the FINAL regen, then a
THIRD regen and `cmp`. **Byte-identical: the regeneration is
deterministic.** Final graph: **575,619 bytes · 118 files · 995 symbols
· 1518 edges**, sha256
`aba7c44b1c6a20d9d2c8093eb792371b9f88208b34472492f5f0f91b88653993`.

**T-054's standing clause, discharged by hand.** There is still no git
remote and `ci.yml` has never executed a single step, so `index --check`
as a CI gate remains true in the future tense only. The integrator ran
it: after the final regen and again after every documentation edit,
`cargo run -p nputer-index -- index --check --root ../..` from
`app/src-tauri` exits **0** and reports **CURRENT**. The docs edits do
not stale it because `docs/` is `.nputerignore`d — proven by re-running
the gate after them rather than reasoned from the ignore file.

**`--root` is load-bearing, and it was demonstrated rather than quoted.**
Run from `app/src-tauri` WITHOUT it, `index --check` exits **1** and
prints a headline **string-identical** to the real staleness report —
compared programmatically, not by eye — with
`committed: MISSING at docs/architecture/graph.json` only on the SECOND
line. A reader who stops at the headline reads a false red.

**T-024's three-fixture rule does NOT fire, VERIFIED rather than
assumed.** Its trigger is DECLARING A COMPONENT
(`docs/CONVENTIONS.md:145`), and
`git diff 16bb47b..a137d20 -- docs/architecture/components/` is a
**0-file diff**. No component was declared; the registry still stops at
`C-14`. `lib/parser/test/smoke.test.ts` was correctly left untouched.

## The fixture forecast, and whether it was complete

**Forecast, derived from the indexed added-file list and the registry
globs BEFORE anything red was run: THREE assertions move.** The file
count `fileComponent.size` 117 → 118 and its `it()` name; **C-05's
mapping row 54 → 55**, because `app/test/**` is C-05's glob and its only
claimant; and `map-dogfood-render.test.tsx`'s index hint
`committed graph · 117 files` → 118.

**The forecast was COMPLETE, and the mechanism is why.** A throwaway
probe `it()` was appended to `architecture-dogfood.test.ts` and run once
against the freshly regenerated graph, printing in single lines every
value the two dogfood fixtures assert. It printed:

    fileComponent.size 118 · unmappedFiles []
    mapping C-05 55 / C-06 25 / C-08 10 / C-09 3 / C-10 2 /
            C-12 14 / C-13 8 / C-14 1  (= 118)
    registry 11 ids · declared 11 · placeholder 0 · mode full
    relation table 32 rows — 13 confirmed / 10 undeclared / 9 planned
    C-05->C-06 observedCount 10 · its fileEdges list 10 entries
    the ten undeclared pairs, unchanged
    derived.issues [] · project issues 0 · graph issues 0
    declaredOnly [C-01,C-07,C-11] · pinned [C-01]
    C-12's fourteen-file list, unchanged
    graph files 118 · edges 1518

**And the probe earned its keep on exactly the hazard it exists for.**
The size check and C-05's row are the FIRST and SECOND assertions in the
SAME `it()` body. The suite run reports one failure —
`expected 118 to be 117` at line 1035 — and vitest never reaches C-05's
row while that one is red, so the failure output shows ONE of the two
moving assertions and gives no hint of the other. Ten merges running
have had to catch a second assertion inside an already-moving body; this
one was derived first and confirmed second, which is the discipline
working rather than luck.

The probe was removed and **the removal proved by sha256 against
`git show HEAD:<path>`** — `eddd4d0ba451af5d2f2e243bec662d544a94a1fb696d73af29dbb788e71d2996`,
matching exactly — never by a clean `git status`, and `git grep` from
the repo ROOT finds no residue. The app suite is **827/827** against the
reconciled fixtures.

## What ACTUALLY reached the human's running app

**Port 1420 is the human's app** — a vite listener (node pid **82549**,
up since Aug 18 03:45:46) serving this checkout. It was never bound,
connected to or signalled; read-only `lsof` only, checked at the start
and again at the end, same pid both times. Scratch ports **17307** and
**17308** were bind-probed free before use and proven free again after.

1. **Their app PROCESS was NOT replaced.** Pid **45155** (started
   11:37:17) is the same process the last checkpoint recorded, under the
   same unchanged `tauri dev` supervisor (ppid 82364). `tauri dev`
   watches `app/src-tauri/**`, and this merge is a **0-file diff**
   there.
2. **It is still running an unlinked PRE-T-043 image, and the on-disk
   binary has now moved a fourth time.** `lsof` shows pid 45155 holding
   inode **26762149** while the on-disk debug binary is inode
   **27219709** — rewritten at 15:07 by this integration's own boot-gate
   `tauri dev` build, into the human's shared `target/` directory. The
   inode series across three checkpoints is now
   26813168 → 27086578 → **27219709**, against a running image that has
   not moved since T-043. On macOS, replacing a running binary does not
   touch the running process. **The window they are looking at still
   contains the pre-T-043 grace poll**, so the relaunch item below has
   now been owed across THREE merges.
3. **THEIR FRONTEND DID NOT TAKE A HOT UPDATE THIS TIME — the opposite
   of the last merge, and it is the cleanest such answer this log has
   recorded.** `app/src` is a 0-file diff, so nothing the dev server
   serves directly moved; and `lib/parser/dist/*.js` — which sits in the
   dev server's LIVE module graph through the
   `app/node_modules/@nputer/parser` → `lib/parser` symlink, because
   `@nputer/parser` is deliberately NOT in vite's optimized-deps list —
   is **byte-unchanged, mtime still 14:31**, since the merge moves no
   parser source and no parser build was required or run. `app/package.json`
   moved, but only inside `"scripts"`; no dependency changed, so vite's
   dep optimizer had nothing to re-run, and the dev server was not
   restarted (`npm run dev` pid 82504 and the vite node 82549 are both
   the originals from Aug 18). **So: their board and map are still
   running T-076's parser, unchanged by this merge — which is correct,
   because this merge changes nothing a running frontend could show.**
4. **The map pane DID see a new graph** — `docs/architecture/graph.json`
   moved 575,351 → 575,619 bytes, and it is inside the watch root. Their
   map's index hint now reads **118 files**.
5. **Docs-watcher snapshots.** The watcher ships a full snapshot of
   `<project>/docs` on every change, so their board re-read the tree:
   T-073 now shows `done`, five new `T-073-s*` cards appeared, and
   STATE.md and ARCHITECTURE.md moved with this checkpoint. ROADMAP.md
   did NOT — see below.
6. **A SECOND WINDOW DID OPEN AND CLOSE, and they may have seen the
   flash.** The boot gate fired, so `tauri dev` was spawned on scratch
   port 17307 in this checkout, opened a real window, printed both
   `[nputer]` lines and was SIGTERM'd. This is the opposite of the last
   merge, where the gate did not fire and there was no flash. It is
   also why the on-disk binary moved in item 2.
7. **`app/dist` was rewritten** by the required pre-suite build (and a
   throwaway `dist-base/` was built beside it and removed). The dev
   server does not serve `dist` and no module in its graph imports it,
   so this is invisible to their window.

**No process from this integration survives.** Census by
`ps -Ao pid,ppid,stat,lstart,command` at the end: zero `vitest`, zero
`playwright` or `chromium` of mine, zero `cargo` or `rustc`, zero
`fake_agent` of mine, no stray `tauri dev` and no orphaned shell; both
scratch ports free. **No broad `pkill` was used at any point.** The two
`nputer-T-060` orphans (`52504`/`52505`, ppid 1, start
`Tue Aug 18 16:21:18`) predate this session, are unchanged before and
after, and are deliberately left alone — they are `T-043-s1`, not this
integration's to claim or clean.

**THE SCRATCH DIRECTORY IS NOT PRIVATE, THIRD OBSERVATION, AND THIS TIME
THE OTHER WRITER WAS CAUGHT IN THE ACT.** A live `playwright` tree
running from `/Users/ujju/Projects/nputer-T-080/tools/e2e` under
`claude` pid **92215** — the same pid the last checkpoint recorded as
the T-073 LANE's, now working T-080 — is writing
`t080-focused-base.txt` into the very session-keyed scratch directory
this integration was given. No filename collided, because this session
prefixed every file `T073-integ-`. **Prefix your scratch files or lose
them**; the directory is keyed by session and shared in practice.

## Health of the tree

At this checkpoint main contains T-073 merge `a137d20` plus this
checkpoint. Parser, app, Rust, E2E, token lint, audit, boot and
graph-currentness gates are all green.

**ROADMAP WAS NOT TICKED, and the reason is measured rather than
asserted.** The discriminator this repo uses is: does it change what a
USER can do? T-073 answers no, and the answer is unusually easy to
check because the card's fourth criterion IS that question: `app/src` is
byte-identical at 53/53, no bundle input moved, and two builds of the
merged tree — one with the merged `tsconfig.json` and one with
main-before's — produce `diff -r` DIRECTORIES IDENTICAL. **A change
that provably cannot alter one byte of the shipped bundle cannot alter
what a user can do.** The precedent is unanimous once the class is
right: T-019, T-030, T-053 and T-076 — the internal-correctness cards —
have zero ROADMAP presence, and this one is further from the user than
any of them, since it is tsconfig and tests only. T-055 remains the
case worth distinguishing: a commented-out roadmap row was a phantom
FEATURE on the board, which the user sees. Nothing here is.

**ARCHITECTURE WAS TOUCHED, in two places, and the call is easy.**
`app-shell` is **C-05**, which has a row IN the Components table (the
table runs C-01…C-07), so the "no C-id, no paragraph" test that
excluded T-058 does not apply. And the substance is architectural in the
strict sense rather than by courtesy: **the shell now compiles as TWO
PROGRAMS instead of one**, which is a structural fact about C-05 that no
amount of reading its source reveals. The Interfaces section's ADR-017
bullet also gained a clause, because the guard T-073 restored is that
rule's TYPE-LEVEL half — "the spawned planner writes, the app renders
what lands" was being enforced by the compiler for free, and had
silently stopped being. Both entries record what is NOT held as well as
what is: the two passing reverts, and the fix the verifier measured
(`tsc --noEmit --listFiles` — assert the program, not a proxy for it).

## Provenance

T-073 is **built and verified by `claude-opus-5 @fresh`**,
`review: same-model` — the same model on both sides, honestly stamped.
Re-derived across all done cards at this checkpoint rather than assumed:
**54 done cards — 43 read `same-model`, 5 read `self-verified`, 5 read
`independent`, and T-056 is a done card whose `review:` is EMPTY.**
T-073 is the card that moves `same-model` from 42 to 43.

Of the five `independent` stamps, **only three have different models on
the two sides**: T-057 and T-058 (codex/gpt-5.6 built, claude-opus-5
verified) and T-060 (claude-opus-5 built, codex/gpt-5 verified). **T-055
and T-066 are stamped `independent` with the SAME model on both sides**,
which is `same-model` by the convention's own definition. That count is
unchanged by this merge, and no card's history was re-stamped.

**A fifth data point on who stamps `done`, and it is the strongest one
yet, because this is the case where the OTHER answer was available.**
T-073's verifier left `status: verifying` for the integrator, exactly as
T-043's and T-076's did, and the integrator stamped it at the checkpoint
— four of the last five agree, with T-058's executor the outlier. What
makes this instance different is that the card is size **S**, and
`method/roles/executor.md:19` explicitly permits `done` at size S. The
executor could have stamped it and did not. The rule now has both a
practice and a case where the practice held against a written
permission.

## In progress / broken right now

**THREE sibling lanes are live**, and a **FOURTH appeared mid-integration
that no brief mentioned**. All were verified against their branch refs
through this repository's shared object store rather than assumed from
their slugs. No sibling worktree was read into, written to, built from
or signalled.

**Every tip below moved while this integration ran, two of them twice**,
so each is recorded with its value at the moment of writing and should
be read as a moving target, not a fact.

- **T-069 — the turn's own end decides the diagnosis**
  (`task/T-069-relay`, worktree `../nputer-T-069`). F-03, milestone 3,
  size S, `touches: [app-agent]`. `ab8e4bf` at the last checkpoint,
  **`fb578a9`** now, subject **"T-069 verdict (6/6): APPROVED"** — so
  this lane is no longer in verification; **it is ready to integrate**,
  and it is the one that independently found shape seven as `T-069-s3`.
  Changes 7 paths, all `app/src-tauri/**` plus its own cards.
- **T-078 — the conventions describe the machine that exists**
  (`task/T-078-conventions`, worktree `../nputer-T-078`). F-01,
  milestone 4, size M, `touches: [docs/CONVENTIONS.md, method/]`. **In a
  post-rejection RE-VERIFICATION**, moving fast: `5b5e1c7` at the start
  of this integration, then `0db536a`, then **`445a7a4`** minutes later,
  subject "re-verify: stamp verifier fields, re-prove the rejected entry
  by hash, final suite state". Changes **16** paths from base `e4a5ae7`,
  carrying nine `T-078-s*` findings. **Three items in this checkpoint are
  its text to write**: the boot-gate sentence that is now false, the
  size-S carve-out, and `T-073-s2`'s program-scope sentence.
- **T-080 — NEW, and dispatched into this integration's window**
  (`task/T-080-gate-sees`, worktree `../nputer-T-080`), cut from
  **`16bb47b`** — the LAST CHECKPOINT and not a merge commit, which is
  T-014-s3 being obeyed. It committed its first work during this
  integration: **`fef8870`**, 3 paths, all under `tools/e2e`
  (`scripts/lint-tokens.mjs`, `scripts/token-scan.mjs`,
  `tests/token-scan.spec.ts`), subject "a corpus floor that bites, an
  evidence floor, and a third exit code". **This is the lane that
  inherits T-058-s1**, the finding that nothing pins TOKEN or CONTROL —
  and this merge moved both (118→119, 507→514), so the lane's subject is
  live rather than theoretical.

**All four are disjoint from this merge**, computed with `comm -12`
against this merge's own twelve-file list rather than inferred from
`touches:` — T-069 changed 7 paths, T-078 16, T-080 3, and every
intersection is **0**, re-computed at the END of the integration against
the tips above rather than the ones the brief named. `app-shell` is released by this merge.

Nothing is broken. No lane is blocked on this checkpoint.

## Next up

1. **Triage the sixteen undispositioned suggestions** — six `T-043-s*`,
   five `T-076-s*` and five `T-073-s*`. **Treat `T-076-s4`, `T-069-s3`
   and `T-073-s4`/`s5` as ONE item.** Three lanes that could not see
   each other found the same shape in one day: every "zero survivors"
   claim in this archive is a claim about the PINS, because that is
   where every mutant set was derived from. The remedy is small and
   belongs in T-078's drill clause: derive at least one mutant from a
   CRITERION with the test file closed.
2. **`T-073-s5` carries a measured fix and should be cheap.** The
   verifier did not propose `tsc --noEmit --listFiles`; it MEASURED that
   it catches the triple-slash reference and closes all three doors at
   once. A card that replaces a shape-matching regex with an assertion
   about the actual program is small, and it also answers the executor's
   own recorded doubt.
3. **`T-073-s2` needs a RULING, not work.** The test program necessarily
   contains `app/src`, so no arrangement denies the writes there while
   tests import the frontend. The restored property is "the program
   `npm run build` gates on denies the write". Accept it and write the
   sentence into CONVENTIONS — which is T-078's file.
4. **T-070** remains newly dispatchable on the fence T-043 released
   (`app-agent`, `blocked_by: []`). **T-065**
   (`blocked_by: [T-057, T-058]`) remains unblocked and undispatched;
   **T-067** and **T-068** still wait behind it. **T-077** inherits
   T-053-s1 and owns the consumer story for `duplicate-id`'s `space`.
5. The human-owned authenticated genesis below, which is still the whole
   remaining milestone-3 gate.

Dispatch the next lane from THIS checkpoint, not from the merge commit
(T-014-s3): a merge carries a graph the checkpoint has not regenerated
yet, and a lane cut from one inherits a red `index --check` through no
fault of its own. **That is not hypothetical this time either** — this
merge DID stale the graph, so `a137d20` is exactly the kind of commit
the rule exists to keep lanes off. T-080 is the worked example the other
way, cut from `16bb47b`.

## Human-owned evidence and decisions

- **Real genesis run:** authenticate the supported CLI, then perform one
  timed end-to-end genesis on a toy idea, target <=30 minutes, with
  light and dark completion screenshots. No planner turn has succeeded
  against a real model on this machine.
- **Relaunch the desktop app — still owed, and now THREE merges stale.**
  The process was replaced at the T-043 merge but runs an unlinked
  pre-merge image (inode `26762149` against an on-disk `27219709` that
  has since been rewritten three times), so it does not contain T-043's
  kill path. **A cancel in that window still pays the full five
  seconds.** Note that the asymmetry the last checkpoint measured has
  NOT widened: their frontend is current as of T-076 and this merge
  moved nothing a frontend can show, so the gap is still exactly
  "T-043's Rust", not more.
- **Confirm the quit-mid-turn behaviour** (T-043's own @human line):
  start a `hang`-scenario genesis, quit the app, and it should close
  promptly rather than after a five-second pause. Requires the relaunch
  above first, which is why it has not been discharged.
- **Visual judgment:** decide whether the bounded shell and its internal
  board/map/error scrollbars feel right in both schemes.
- **Stray real-smoke directories:** the pre-existing
  `nputer-t025-realsmoke-*` directories remain a human delete-or-keep
  choice.
- **The two `nputer-T-060` `fake_agent` orphans** (`52504`/`52505`) are
  still alive at ppid 1 and are safe to kill by pid; they are recorded
  as `T-043-s1` rather than swept, because nobody has attributed them.
- **Repository remote:** there is still no remote. **CI has never run on
  a real runner**, so `index --check` as a CI step remains true in the
  future tense only; the integrator ran it by hand at this checkpoint
  and it exited 0 (T-054's standing clause). The same is true of the
  token lint's dependency on git being on PATH.

Milestone 3's implementation list is complete, but the milestone is not
claimed until the real timed genesis exists.

## Open questions

- **Does TASK-FORMAT's size-S row need a carve-out, and what is it?**
  The row reads "executor + tests. No verifier, no separate integrator."
  T-073 needed both, and neither for a reason about size: a fence breach
  the executor could not judge, and two CONVENTIONS gates that name the
  integrator by role. The ruling is recorded on the card; what is open
  is the TEXT, and it is T-078's file. Candidate shape: the S tier holds
  while a card stays inside its fence and moves nothing a standing gate
  watches — otherwise it escalates, and the escalation is not a
  re-sizing.
- **Is `T-073-s4` shape seven, and has the archive's "zero survivors"
  claim been retired?** The last checkpoint asked whether `T-076-s4` was
  the seventh shape. It is now the third independent sighting in a
  single day, from three lanes that could not see each other
  (`T-076-s4`, `T-069-s3`, `T-073-s4`/`s5`). The taxonomy question is
  triage's; the question triage cannot defer is whether every previous
  sweep's "zero survivors" now means less than it was read to mean.
  `T-043-s4` (a mechanism made unfalsifiable by a REDUNDANT second path)
  still needs its own answer.
- **Should a pin ever assert a PROXY for the thing it means?** T-073's
  include pin is a regex over config TEXT standing in for "what is in
  the program", and both passing reverts walk through exactly that gap.
  The verifier measured the alternative (`tsc --noEmit --listFiles`).
  This generalises past this card: the corpus pin asserts a directory
  set standing in for "what the sweep covers", and `T-073-s4`'s two
  mutants walk through THAT gap. Same shape, twice, in one card.
- **What does `review: independent` mean — a different session, or a
  different model?** Five done cards carry it and only three have
  different models on the two sides. T-056 is also a done card with an
  empty `review:` where `self-verified` looks intended. ADR-016 says the
  distinction remains first-class DATA and always visible in TEXT, but
  never says which distinction.
- **Does a card's `status: done` belong to the verifier or the
  integrator?** Four of the last five now answer "the integrator, at the
  checkpoint" (T-043, T-057, T-076, T-073) against T-058's executor
  stamping it in the build commit — and T-073 is the strongest instance,
  because at size S `method/roles/executor.md:19` PERMITTED the executor
  to stamp it and the executor declined. This is close enough to settled
  to be written down.
- **Should `aliasedIdSlots` keep its `compare` parameter?** It has
  exactly one caller passing exactly one value, and its doc has to warn
  that a different caller could reintroduce the NaN. Endorsed by two
  sessions and filed by neither.
- **Should a restoration sha be recorded at all?** This merge adds a
  third instance of the underlying problem and it is the cleanest yet:
  `crescendo-dom.test.tsx`'s recorded `deb2badd…` is the file at
  `1a1e388`, not at HEAD. A sha proves restoration at a COMMIT and stops
  meaning anything the moment the file moves for any other reason —
  exactly like the stale range figure and the stale graph baseline this
  merge also had to correct. **Provisional answer forming across three
  instances: record the sha WITH the commit it belongs to, or record the
  per-file comparison instead of an aggregate.**
- **Should `docs/CONVENTIONS.md` legend the token lint's exit codes?**
  A criterion of T-078, with T-080 restoring the distinction; left open
  here because T-078 is in a post-rejection fix as this is written.
- T-057-s2 leaves an unpinned behaviour change in C-13 that moves
  against T-056's direction; it is T-072's third criterion.

**Answered by this merge, and left in place rather than edited out:**
*"Is `app/package.json` in T-073's fence?"* — **yes, and removing the
line would have been the real defect.** The fence reads "TypeScript,
tsconfig and tests only — no Rust", and the card states its own purpose:
the fence spans both halves of C-05 and the `app/src-tauri` half is
untouched. `touches:` is scheduling, not permission
(`method/tasks/TASK-FORMAT.md:18`). The alternative was measured, not
argued: bare `tsc` exit 0, `vitest` exit 0,
`tsc -p tsconfig.test.json` exit 2 on a real planted type error.

## The fourth triage — 46 suggestions, then 50, dispositioned to zero

Run by `claude-opus-5 @fresh` as a read-only analyst, then applied in
the main checkout. The backlog was enumerated from disk rather than
inherited: **46** files at `status: suggested` before T-058 merged,
**50** after its four verifier findings landed with it, **42** after the
eight resolutions were committed at `9b15f7d`, and **zero** after that
pass.

**Twelve cards born, T-069 through T-080**, absorbing 35 suggestions.
Two folds (T-051-s8 into T-065, T-063-s3 into T-064). Four parks, each
with a dated unpark trigger. One rejection (T-051-s2, superseded). Eight
resolutions, recorded at `9b15f7d` as dated lines on the cards that
actually closed them.

**EIGHT FINDINGS WERE ALREADY CLOSED AND NOBODY HAD SAID SO.** Four were
expected; four were not. T-060-s3, s4 and s5 were closed inside T-060's
own re-verification, whose verdict says "No blocker or new suggestion
remains" — the files were never removed, and they sat at
`status: suggested` through three triages. T-029-s1 was closed at
`2fc3475`, a commit whose subject is literally that it corrects the
trace s1 was filed about. **The lesson is in T-078**: a verdict sentence
that reads as closing five findings, while two of them asked for written
rules, is exactly how a rule goes unwritten while everyone believes it
exists.

**Four citations no longer resolved**, every one drifted downward by a
later merge into the same file while the finding's substance reproduced
exactly. T-078 carries the rule that follows: a citation names a symbol,
not a line. T-043's two drifted anchors were a fifth and sixth instance;
T-076 supplied a seventh of a different kind (`roadmap.ts:48`, wrong
when written rather than drifted).

**The poison shapes have ordinals.** **Shape five** — the assertion SET
has no cardinality or coverage floor (T-058-s2, absorbed by T-080).
**Shape six** — a body that reds under an expected-value poison while
killing no mutant another test does not already kill (T-057-s1,
absorbed by T-072). Both are written into T-078's drill clause.
**Shape seven** — a mutant NO body kills, produced by deriving the
mutant set from the pins rather than the criteria — has now been found
independently by three lanes in one day and belongs in the same clause.

**Appended 2026-08-19, at T-073's checkpoint.** Suggested is
**sixteen**: the six `T-043-s*`, the five `T-076-s*` and the five
`T-073-s*`, all undispositioned. The **corpus figures quoted in this
section are as of `9b15f7d` and remain stale**: CONTROL was 521 there,
502 two checkpoints ago, 507 at the last one and is **514** here. The
20.6%-unpinned analysis that made T-080 survives the change in
denominator; the raw totals do not — and T-080 is now a LIVE LANE, so
the next checkpoint should be able to stop saying that nothing pins
these counts.
