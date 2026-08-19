# State

Updated: 2026-08-19 by integrator (T-078 merged and checkpointed),
claude-opus-5 @fresh

## Just completed

**T-078 — the conventions describe the machine that exists.** F-01,
milestone 4, size M, `touches: [docs/CONVENTIONS.md, method/]`. Built and
verified by `claude-opus-5` (`@T-078` / `@T-078-reverify`),
`review: same-model`. Approved branch tip **`d219482`**; merge
**`fed70a2`**. The card was at `status: verifying`; the integrator
stamped **`done`** at this checkpoint, the sixth card running (T-043,
T-057, T-076, T-073, T-069, T-078).

**IT IS DOCS-ONLY AND THAT IS THE POINT.** Sixteen paths, every one under
`docs/`: `CONVENTIONS.md`, `T-054`'s card, T-078's own card and thirteen
new `T-078-s*` findings. No `.ts`, no `.tsx`, no `.rs`, no manifest, no
lockfile, no capability file — the first merge in this ledger with a
**zero-code diff**, which is what makes several of the measurements below
unusually sharp.

**WHAT LANDED IN CONVENTIONS, eight rules and one correction.** The
four-walks table (the graph's walk, the lint's TOKEN corpus, the lint's
CONTROL corpus, the parser's live docs) with the AUTHORITY file named for
each rather than its contents restated, plus the two live readers that
sit outside all four and a statement that the list is CLOSED at two. The
token lint's exit-code legend — CI's first step was the only gate without
one, and the legend describes the gap honestly: exit 1 means EITHER a
violation OR a gate that could not read the tree. The middle-dot
separator rule, given a home in the CI bullet a next editor will actually
open. `A CITATION NAMES A SYMBOL, NOT A LINE`, with the sub-rule that a
hit COUNT is a line number by another name. The poison drill's
ONE-SIDEDNESS clause and ordinals for shapes FIVE and SIX. The
negative-control rule and the guard-lift rule, both of which were
believed to exist and were written nowhere. GRAPH REGEN stops claiming
present tense for a gate that has never run, and gains "ask the gate
instead of predicting". T-054's own notes are corrected with it.

## THE BRIEF'S RANGE WAS ITSELF THE TRAP, AND THIS IS THE FINDING

The dispatch brief told this integrator that the merge's diff is
`d92dceb..HEAD` and NEVER `e4a5ae7..HEAD`, and said its sixteen-file list
was verified against **`d92dceb...HEAD`** — three dots. **`A...B` is
DEFINITIONALLY `$(git merge-base A B)..B`.** So the brief produced its
correct answer by computing the exact range it had labelled the trap, and
the range it prescribed in words — two-dot `d92dceb..d219482` — returns
**76 paths**, sixty of which are main's own already-merged work appearing
in REVERSE. Measured, all three at once:

    git diff --name-only d92dceb..d219482    -> 76   (what the brief SAYS)
    git diff --name-only d92dceb...d219482   -> 16   (what the brief DID)
    git diff --name-only e4a5ae7..d219482    -> 16   (the labelled trap; byte-identical to the line above)

**THE RULE IS ONLY COHERENT WHEN `HEAD` IS THE MERGE COMMIT**, and that
is the reading every worked example in CONVENTIONS uses (T-027's 9 vs 36;
T-069's `fb750cf..7e3e8b5`). Before the merge exists there is no commit
whose tree is main-plus-branch, so `<main-before>..<branch tip>` is a
SYMMETRIC comparison of two divergent tips and cannot be the gate's
window. **`T-078-s9` is exactly this finding**, filed by the lane's own
executor, measured on this branch when it was nine files, and it is a
`suggested` file rather than shipped text — so the trap is still live in
`CONVENTIONS.md` today and it caught the dispatch brief on the very card
that documents it.

**IT NEARLY COST A FALSE ALARM IN THE OTHER DIRECTION.** Reading the
76-path list, this integrator formed the hypothesis that `d92dceb` had
put `app/package.json` and five `app/src-tauri/**` files onto main as a
direct commit, which the BOOT GATE's wording ("at any MERGE") could never
have caught — a real hole, worth running the gate over. **Refuted by
measuring `d92dceb` against its own parent: it is SIX paths, all under
`docs/`.** The `.rs` and manifest entries were T-069's, T-073's and
T-076's, each already boot-gated at its own merge. A two-dot range does
not merely inflate a count; it attributes main's history to the wrong
commit in both directions.

## Integration truth

T-078 and main share merge-base **`e4a5ae7`**, which is far behind.
Main-before-the-merge was **`d92dceb`** and the approved worktree was
clean at **`d219482`** (`git status --porcelain` empty). Main advanced
**60** paths from that base; T-078 changed **16**. **Their changed-file
intersection is EMPTY**, computed with `comm -12` over the two sorted
lists; 60 + 16 = 76, which is exactly the two-dot count above, and that
arithmetic is the check that the two sets really are disjoint.

The read-only `git merge-tree --write-tree d92dceb d219482` predicted
tree **`2e873dfdab9ed4e23b0d002cbc577ba3b70f1cfc`** BEFORE anything was
written, with no conflict; the no-ff merge **`fed70a2`** produced that
tree **exactly**, with parents `d92dceb` and `d219482` and nothing else.
The staged set at `git merge --no-commit` was the sixteen paths and
nothing more, read with `git diff --cached --stat` before the commit.

**The merge's diff (`d92dceb..fed70a2`) is SIXTEEN files**, +2315/−36,
**all `.md` under `docs/`**: `docs/CONVENTIONS.md` (+273/−36),
`docs/tasks/T-054-…` and the T-078 card modified, thirteen `T-078-s*`
files added. Three modifications, thirteen additions.

**`98f931e` — the which-diff clause itself — is an ancestor of BOTH
sides** (`git merge-base --is-ancestor`, exit 0 against `d219482` and
against `d92dceb`), which is why `CONVENTIONS.md` merged without a
conflict despite being the file both this lane and that commit edited.
Confirmed rather than trusted.

**No id collision.** `T-081` and `T-082` were taken by `d92dceb`;
T-078's own files are all `T-078-sN`, so the two id ranges do not meet.
Verified on disk: thirteen `T-078-s*.md` present, `T-080`/`T-081`/`T-082`
present, no duplicate.

## The two gates, with BOTH derivations computed — and BOTH now disagree

**THIS IS THE FIRST MERGE WHERE THE TWO DERIVATIONS DISAGREE ON *BOTH*
GATES AT ONCE.** Every figure below is over the merge commit, which is
the only form of the rule that means anything.

| gate | prescribed `d92dceb..fed70a2` | naive `e4a5ae7..fed70a2` |
|---|---|---|
| BOOT GATE (`app/src-tauri/**`, `app/src/**`, either manifest) | **0 — DOES NOT FIRE** | 6 — would fire |
| GRAPH REGEN (`*.ts/*.tsx/*.js/*.jsx` outside `docs/`) | **0 — DOES NOT FIRE** | 18 — would fire |

The naive derivation's 6 boot paths are `app/package.json` plus five
`app/src-tauri/**` Rust files; its 18 graph paths are five under
`app/test` and thirteen under `lib/parser`. **Every one of the 24 was
merged and gated at its own merge.** The dispatch brief forecast that
neither gate fires; the forecast is CONFIRMED under the prescribed
derivation and FALSIFIED under the naive one, which is precisely the
condition CONVENTIONS still says cannot happen.

**CONVENTIONS' SENTENCE IS NOW FALSE THREE TIMES, AND T-078 DID NOT FIX
IT.** The BOOT GATE bullet still reads *"It has never yet changed WHETHER
the gate fires — both derivations fired all six times."* The merged file
carries it verbatim, and **the check itself is a small worked example of
the rule this card ships**: a single-line `grep` for
`never yet changed WHETHER` returns **0**, because the sentence wraps
across two physical lines — it is found only by collapsing newlines
first, or by searching the short fragment `both derivations fired all
six`, which sits whole on one line. A grep that spans a wrap is a
citation that drifts. `git diff d92dceb fed70a2 -- docs/CONVENTIONS.md`
contains **zero** hits for `derivations fired`, so this merge did not
touch the line. The tally against it:

- T-076's merge — GRAPH REGEN, **0 vs 5**
- T-069's merge — GRAPH REGEN, **0 vs 18**
- T-078's merge — GRAPH REGEN **0 vs 18**, and **BOOT GATE 0 vs 6**

**The third instance is the one that ends the argument**, because it is
the BOOT GATE falsifying a sentence that lives in the BOOT GATE's own
bullet and is about the BOOT GATE. The first two were its cross-
referenced sibling. **This was checked against T-078's shipped text and
is NOT covered by it** — the card's criteria never name that sentence,
and `T-078-s9` names it only in passing while asking for something else
(the pre-merge notation). **Recorded as a finding for a follow-up card
rather than edited in: approved is approved.**

**T-054's standing clause, discharged by hand.** There is still no git
remote and `ci.yml` has never executed a step, so `index --check` as a CI
gate remains true in the future tense only — which is now what the file
itself says, in T-078's own words. Run at the merge from `app/src-tauri`
with `--root ../..`:

    INDEX_CHECK_EXIT=0
    [nputer-index] graph.json is CURRENT - ../../docs/architecture/graph.json
      matches a fresh index (575619 bytes, 118 files, 995 symbols, 1518 edges)

Byte-for-byte the figure T-069's checkpoint recorded, and
`docs/architecture/graph.json` is a **0-file diff across the merge**.
This is the first checkpoint that can cite T-078's own new clause while
obeying it: *ask the gate instead of predicting*. The gate agrees with
the prescribed derivation.

**THE BOOT GATE WAS NOT RUN, AND THE REASON IS DERIVED RATHER THAN
ASSUMED.** Its trigger matches zero paths in the merge's diff. More than
that, the whole of main since the last boot-gated merge `7e3e8b5` is
docs-only, checked commit by commit: `47b7988` 4 paths / 0 non-docs,
`d92dceb` 6 paths / 0 non-docs, `fed70a2` 16 paths / 0 non-docs — boot
trigger 0, 0 and 0. There is no unproven manifest or Rust movement on
main to cover. Running it would have flashed a window at the human and
rebuilt their binary to prove something no commit since `7e3e8b5` could
have broken.

**T-024's three-fixture rule does NOT fire**, verified rather than
assumed: `git diff d92dceb fed70a2 -- docs/architecture/components/` is a
0-file diff. The registry still stops at `C-14`.

## The poison drill: there was nothing to poison, stated rather than skipped

**This merge contains no code, so there is no assertion to mutate.** Not
one `.ts`, `.tsx`, `.rs`, `.mjs` or manifest path is in its diff, and no
test body moved. A drill would have had to invent a target, which is a
worse answer than saying so.

**WHAT WAS DONE INSTEAD IS THE MEASUREMENT A DRILL EXISTS TO SUPPORT:
that the merged artifact IS the verified artifact.** All sixteen changed
paths were sha256'd at three points — the verifier-approved tip
`d219482`, the merge commit `fed70a2`, and the working tree — and all
three agree on every file, **0 mismatches**. `docs/CONVENTIONS.md` is
`965b621915e0c88c…`, the T-078 card `b217e3dfd1572705…`, `T-054`'s card
`86a38647c1021eb8…`. Every byte on main is a byte the verifier read.

**AND THE MERGED TEXT WAS EXERCISED BY FOUR LIVE READERS, WHICH IS BETTER
THAN A HASH.** T-078's own walk table claims this file has exactly two
readers outside the four walks; both were run at the merged tree and both
are green. (1) `snapshot_version_matches_the_live_method_stamps` in
`app/src-tauri/src/agent/kit.rs` reads `docs/CONVENTIONS.md` off disk on
every `cargo test` and asserts the `currently v0.1.5` stamp — it ran and
passed. (2) `tools/e2e/tests/workflow-parity.spec.ts` derives CI parity
from the "Build & test" section this card edited — it ran and passed,
which is the middle-dot rule's own subject vindicating the edit that
documents it. Two further readers were exercised that the table correctly
does NOT list for this file but does for the merge's other thirteen: the
parser's live-docs walk (`lib/parser/test/smoke.test.ts`, zero issues over
a tree that gained thirteen `docs/tasks/T-*.md` files) and the CONTROL
corpus. **A docs merge whose text is read by a Rust test, a Playwright
test and the parser is not an unverifiable merge.**

## Suites, every number derived at this merge, exits read unpiped

No suite's exit code was taken through a pipe; each command's own `$?`
was echoed immediately and the counts read from the saved full output.

- **parser: 263/263 across 12 files**, `PARSER_EXIT=0`; `npx tsc
  --noEmit` `PARSER_TSC_EXIT=0`. The smoke test parses this repo's live
  `docs/` tree and requires **zero issues** — it now does so over
  thirteen more task files.
- **app: 827/827 across 42 files**, `APP_TEST_EXIT=0`. `npm run build`
  `APP_BUILD_EXIT=0` with **265 modules transformed**, emitting
  `index-DjYVlJel.js` **501.37 kB** and `index-CwYF5FQb.css` **43.95 kB**
  — unmoved, which a 0-file diff under `app/src` requires. T-073's two
  programs survived the merge intact: the script is still
  `tsc && tsc -p tsconfig.test.json && vite build`, and both
  `app/tsconfig.test.json` and `app/test/node-builtins-write.d.ts` are
  present on main.
- **bare Rust workspace: 343 passed / 0 failed / 3 ignored**,
  `CARGO_TEST_EXIT=0`, summed programmatically from **fifteen**
  `test result:` lines: `nputer_lib` 117 · `fake_agent` 0 · `nputer` 0 ·
  `agent_runner` 66 + 1 ignored · `nputer_index` lib 123 ·
  `nputer-index` bin 0 · arch 7 · cli 13 · containment 3 · golden 7 ·
  perf 0 + 1 · self_graph 2 + 1 · watch 4 · doctests 1 / 0. **Zero
  movement from T-069's checkpoint**, which a zero-code merge requires.
- **E2E: 88/88**, `E2E_EXIT=0`; `npm run typecheck`
  `E2E_TYPECHECK_EXIT=0`. Scratch port **19427** bind-probed free on BOTH
  stacks (IPv4 and IPv6) with a real `net.createServer().listen()` before
  use and proven free again afterwards — deliberately not the lane's
  14520 default, because T-080 is a live `tools/e2e` lane. One worker,
  zero retries, zero skips.
- **token lint: `LINT_SELFTEST_EXIT=0`, `LINT_TOKENS_EXIT=0`** —
  `lint-tokens: clean (TOKEN 119 files under app/src, app/test,
  tools/e2e; CONTROL 533 tracked text files)`.
- **`cargo audit -n`** (no fetch) `CARGO_AUDIT_EXIT=0`: 472 locked
  crates, **0 vulnerabilities / 17 allowed warnings** — the same 16
  `unmaintained` + 1 `unsound` baseline, unmoved, which a 0-file
  `Cargo.lock` diff requires.

**BOTH LINT COUNTS CLOSE FROM TWO DIRECTIONS.** TOKEN is **unchanged at
119**: the merge adds no file under `app/src`, `app/test` or `tools/e2e`.
CONTROL moves **520 → 533**, and both derivations agree with the shipped
scanner. Way one, from the merge: 520 at `d92dceb` + 13 additions − 0
deletions = **533**. Way two, from the tree: `git ls-tree -r` gives 551
tracked at `fed70a2`, minus 18 paths excluded by the scanner's own
`CONTROL_BINARY_EXTENSIONS` / `SKIP_DIRS` sets (read out of
`token-scan.mjs` rather than remembered) = **533**. The same method
re-derives **496 at `e4a5ae7`**, which is the figure T-078's new text
prints — so the card's own corpus number is confirmed at the merge.
**Nothing pins either count** — still `T-058-s1`, still T-080's subject.

## Security sweep — zero movement, and the limb that needed checking is none of them

The merge's diff contains **no lockfile, no `Cargo.toml`, no
`package.json`, no `tauri.conf.json`, no capability file and no `.rs`** —
0 paths matched any of them. The figures were nonetheless derived at the
merged tree rather than inherited:

- `app/src-tauri/src/acl_pin.rs` is a **0-file diff across the merge**,
  sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`,
  with **92** grants counted three independent ways over the anchored
  `EXPECTED_GRANTS` body: 92 entry lines, 92 unique strings, 92 lines of
  span. No byte count is quoted for the grant set, deliberately.
- `ENV_ALLOWLIST` in `app/src-tauri/src/agent/runner.rs` is unmoved at
  **423 bytes / 16 entries**, extracted by anchoring on the symbol
  `const ENV_ALLOWLIST` and its closing `];` — never a byte offset.
- Exactly **three** `#[ignore]` ATTRIBUTES repo-wide, from an anchored
  `git grep` at the repo ROOT. **Cited by symbol, applying the rule this
  merge ships**: `perf_cold_and_incremental_within_ceilings`
  (`crates/nputer-index/tests/perf.rs`), `self_graph_is_current`
  (`crates/nputer-index/tests/self_graph.rs`) and
  `real_cli_smoke_records_the_stream_schema` (`tests/agent_runner.rs`).
  The other 8 of the 11 grep hits are prose in doc comments.
- IPC surface unchanged at **thirteen** commands, derived from both ends:
  13 `#[tauri::command]` in `lib.rs` and 13 names in `generate_handler!`.

## The fixture forecast, and whether it was complete

**Forecast, made before any suite ran: ZERO assertions move.** The
derivation is one line — the merge's diff is sixteen `.md` files under
`docs/`, and `docs/` is `.nputerignore`d, so nothing in it can enter the
graph or the TOKEN corpus.

**The forecast was COMPLETE, and it was confirmed three ways
independently**: `index --check` reports CURRENT at the merge with no
regen run at all; the app suite is 827/827 across 42 files with no
fixture reconciliation of any kind; and TOKEN held at 119 while CONTROL
moved by exactly the thirteen files added. **The one thing the forecast
did NOT predict is that the merged text would be READ by three live test
readers** — it was, and all three are green. That is the sharper claim
and it belongs beside the forecast rather than inside it.

## What ACTUALLY reached the human's running app

**Port 1420 is the human's app** — a vite listener on `[::1]:1420` (node
pid **82549**, up since Aug 18 03:45:46). It was never bound, connected
to or signalled; read-only `lsof` only, at the start and again at the
end, **same pid both times**. Scratch port **19427** was bind-probed free
on both stacks before use and proven free again after.

1. **Their app process was NOT replaced, and for a docs-only merge that
   is the correct outcome.** Pid **36009** (started Wed Aug 19 15:33:23,
   ppid 82364) is the same process before and after this integration.
   `tauri dev` watches `app/src-tauri/**`; this merge's diff there is
   zero paths, so the watcher had nothing to see.
2. **The window they are looking at is still current.** No code has moved
   on main since T-069's merge `7e3e8b5` — three consecutive docs-only
   commits, verified path by path above — so the image pid 36009 is
   running remains a merged-tree build containing T-043's kill path and
   T-069's relay. **The relaunch debt stays discharged.**
3. **`app/src-tauri/target/debug/nputer` WAS rewritten on disk**, at
   16:12, by this integration's own `cargo test` — 39,764,360 bytes,
   against the 39,730,872 the last checkpoint's boot gate wrote. Both are
   builds of the same unchanged source under different invocations. On
   macOS replacing a binary does not touch the running process, so pid
   36009 is unaffected; what it means is that if the human quits and
   restarts, they relaunch from this build of the same source.
4. **Their frontend did NOT take a hot update.** `app/src` is a 0-file
   diff and `lib/parser/dist/*.js` — which sits in the dev server's live
   module graph through the `app/node_modules/@nputer/parser` symlink —
   was not rebuilt, because no parser source moved. The dev server was
   not restarted (`npm run dev` 82504 and vite 82549 are the originals).
5. **The map pane saw NOTHING new.** `docs/architecture/graph.json` is a
   0-file diff. Their map's index hint still reads **118 files**,
   correctly.
6. **Docs-watcher snapshots — this is the whole of what they will see.**
   The watcher ships a full snapshot of `<project>/docs` on every change,
   so their board re-read the tree: T-078 now shows `done`, **thirteen**
   new `T-078-s*` cards appeared, and STATE.md moved with this
   checkpoint. Their suggestion column jumps from nineteen to
   thirty-two, which is the largest single-merge jump this ledger
   records.
7. **`app/dist` was rewritten** by the required pre-suite build. The dev
   server does not serve `dist` and no module in its graph imports it, so
   this is invisible to their window.

**No process from this integration survives.** Census by
`ps -Ao pid,ppid,command` at the end: zero `vitest`, zero `playwright` or
`chromium`, zero `cargo` or `rustc`, zero `fake_agent` of mine, no stray
`tauri dev`, no orphaned shell; the scratch port free; the T-078 worktree
removed. **No broad `pkill` was used at any point.** The two
`nputer-T-060` orphans (`52504`/`52505`, ppid 1, started Aug 18 16:21:18)
are unchanged before and after and are deliberately left alone — they are
`T-043-s1`. An unrelated `ClawStudio/Omputer` process (pid 58407) is the
human's and was never touched.

**THE SCRATCH DIRECTORY IS NOT PRIVATE, FIFTH OBSERVATION.** Every file
this session wrote into the shared session-keyed directory was prefixed
`T078-integ-`. The directory is keyed by session and shared in practice;
prefix or lose it.

## The board, derived from disk at both ends

Main-before (`d92dceb`): **120 task files, 55 done / 27 planned / 19
parked / 19 suggested**; 55 + 27 + 19 + 19 = 120. At this checkpoint:
**133 task files, 56 done / 26 planned / 19 parked / 32 suggested**;
56 + 26 + 19 + 32 = 133. The deltas are exactly T-078 planned →
(verifying, from the branch) → done and the thirteen new suggestion
files. Ten files sit in `docs/tasks/rejected/` and are counted
separately, as always.

## Provenance

T-078 is **built and verified by `claude-opus-5`**
(`@T-078` / `@T-078-reverify`), `review: same-model` — the same model on
both sides, honestly stamped. Re-derived across all done cards at this
checkpoint rather than assumed: **56 done cards — 45 read `same-model`,
5 read `self-verified`, 5 read `independent`, and T-056 is a done card
whose `review:` is EMPTY**; 45 + 5 + 5 + 1 = 56, so every done card
carries the field. T-078 is the card that moves `same-model` from 44 to
45.

Of the five `independent` stamps, only three have different models on the
two sides (T-057, T-058, T-060); T-055 and T-066 are stamped
`independent` with the SAME model on both sides. Unchanged by this merge;
no card's history was re-stamped.

**A SEVENTH DATA POINT ON WHO STAMPS `done`, AND IT SETTLES IT.** T-078's
verifier left `status: verifying` for the integrator, exactly as T-043's,
T-076's, T-073's and T-069's did, and the integrator stamped it at the
checkpoint — **six of the last seven**, with T-058's executor the only
outlier. This one is size **M**, so the size-S permission in
`method/roles/executor.md` was not even in play; the practice now holds
across both size tiers. **The open question below is closed on the
evidence and left for someone to write into `method/` — which T-078
could not do, for the reason `T-078-s3` records.**

## ROADMAP and ARCHITECTURE: both deliberately NOT touched

**ROADMAP was NOT ticked.** The discriminator this repo uses is: does it
change what a USER can do or see? T-078 answers **no** — it changes what
a CONTRIBUTOR can read. ROADMAP carries no T-078 entry and no sentence
that this merge makes true or false; `grep` for `T-078` in
`docs/ROADMAP.md` returns nothing. The precedent class is T-019 / T-030 /
T-053 / T-076 / T-073, not T-029 / T-043 / T-069.

**ARCHITECTURE was NOT touched, and the card agrees.** No component
interface moved — the merge's diff contains no source of any kind — and
T-078's own criteria state the boundary in as many words: *ARCHITECTURE
describes the GUARD, never how to test one*. That is why the
negative-control and guard-lift rules went into CONVENTIONS rather than
into C-05's or C-14's narrative. `grep` for `T-078` in
`docs/ARCHITECTURE.md` returns nothing, and it is right that it does.

## Findings from this integration, none rejection-grade

- **`CONVENTIONS.md`'s BOOT GATE sentence needs a follow-up card, and it
  now has three worked examples.** *"It has never yet changed WHETHER the
  gate fires — both derivations fired all six times"* is false at T-076
  (0 vs 5), T-069 (0 vs 18) and here (GRAPH REGEN 0 vs 18 AND BOOT GATE
  0 vs 6). T-078 owned the file and did not touch this sentence; that is
  not a defect in T-078, whose criteria never named it. **The mechanism
  is now understood well enough to write the replacement**: any lane
  whose own diff avoids a gate's trigger, cut from a checkpoint main has
  since advanced PAST with work that hits it, reproduces this — and a
  docs-only lane reproduces it on both gates at once. The sentence should
  become a WARNING about the naive derivation, not a reassurance about
  it.
- **`T-078-s9` is live and it caught the dispatch brief.** The pre-merge
  inversion it documents is still in the shipped file, and it produced a
  76-path range in this very integration. It should be promoted with the
  bullet above — they are one edit to one bullet, and filing them apart
  would put two cards on `docs/CONVENTIONS.md`, which T-078's own opening
  argues against.
- **T-078's legend clause has a dangling promise, and T-080's approved
  branch does not keep it.** The new token-lint legend says *"T-080
  restores the distinction; this legend gains its second row when it
  lands."* T-080 is APPROVED at `72bc98a` and its twelve paths are nine
  `docs/tasks/` files and three under `tools/e2e/scripts` and
  `tools/e2e/tests` — **`docs/CONVENTIONS.md` is not among them**. So
  T-080's integrator will land the behaviour and leave the legend
  describing the old one. Small, concrete, and better caught now than at
  that merge.

## Health of the tree

At this checkpoint main contains T-078 merge `fed70a2` plus this
checkpoint. Parser, app, Rust, E2E, token lint and the graph-currentness
gate are all green; the boot gate did not fire and was correctly not run.
Nothing is broken.

## In progress / broken right now

**ONE sibling lane holds a worktree, and it is now APPROVED. Two further
sessions run outside the repo.** Every tip below was verified against its
branch ref through this repository's shared object store rather than
assumed from a slug. No sibling worktree was read into, written to, built
from or signalled.

- **T-080 — the gate that runs first can see what it is for**
  (`task/T-080-gate-sees`, worktree `../nputer-T-080`), cut from the
  checkpoint `16bb47b`. **APPROVED and QUEUED**: tip **`72bc98a`**,
  subject "T-080 verdict (3/3): APPROVED — plus s7 (poison shape nine)
  and s8", **12** paths — `tools/e2e/scripts/lint-tokens.mjs`,
  `tools/e2e/scripts/token-scan.mjs`,
  `tools/e2e/tests/token-scan.spec.ts` and nine `docs/tasks/` files
  (`T-080-s1` … `s8` plus its own card). Its changed-file intersection
  with this merge is **0**, computed with `comm -12` at the END of the
  integration against the tip above rather than the one the brief named
  — it had moved. **It carries poison shape NINE**, which lands two
  ordinals past what T-078 just wrote down; the drill taxonomy will need
  a pass once it merges.
- **A REAL-CLI OBSERVATION SESSION, outside the repo.** Its first
  product landed on main at `d92dceb` —
  `docs/research/real-cli-observation.md` plus the 27 protocol-bearing
  lines, T-081, T-082, and T-029-s5 folded. It writes nothing further
  here without a commit of its own.
- **An F-04 DECOMPOSITION PASS, outside the repo.** Read-only from this
  tree's point of view.

The T-078 worktree is removed; the branch `task/T-078-conventions` is
kept at `d219482`. No lane is blocked on this checkpoint.

## Next up

1. **Integrate T-080.** It is approved, queued, and its three code paths
   are the first non-docs movement on main since `7e3e8b5` — so its
   merge is the one where the boot gate and GRAPH REGEN derivations both
   become live again, and where the token lint's exit-code legend T-078
   just shipped acquires its second row (see the finding above: T-080's
   branch does not write it).
2. **File the CONVENTIONS gate-range card**, folding `T-078-s9` into it.
   Three worked examples, one bullet, one edit. It is the cheapest
   correction on the board and it has now cost two consecutive dispatch
   briefs a wrong range.
3. **Triage the thirty-two undispositioned suggestions** — six
   `T-043-s*`, five `T-076-s*`, five `T-073-s*`, three `T-069-s*` and
   thirteen `T-078-s*`. The backlog has grown by 13 in one merge; this is
   the largest single jump the ledger records and the fifth triage is
   overdue. **Treat `T-076-s4`, `T-069-s3` and `T-073-s4`/`s5` as ONE
   item**, unchanged from the last checkpoint.
4. **`T-069-s2` remains the cheapest real improvement on the board**:
   one arm (`StreamLine::Activity` sets the same flag), one fixture, one
   body. **`T-069-s1` is one line** and improves five bodies at once.
5. **T-070** is dispatchable on the fence T-043 released (`app-agent`,
   `blocked_by: []`), and `app-agent` is free. **T-065**
   (`blocked_by: [T-057, T-058]`) remains unblocked and undispatched;
   **T-067** and **T-068** still wait behind it. **T-077** inherits
   T-053-s1. **T-081** and **T-082** are newly filed and undispatched.
6. The human-owned authenticated genesis below — still the whole
   remaining milestone-3 gate.

Dispatch the next lane from THIS checkpoint, not from the merge commit
(T-014-s3). **The usual reason does not apply and the rule still does**:
this merge did not stale the graph, so `fed70a2` happens to be a safe cut
point; "happens to be" is not a rule, and T-080 restores the hazard the
moment it lands.

## Human-owned evidence and decisions

- **Real genesis run:** authenticate the supported CLI, then perform one
  timed end-to-end genesis on a toy idea, target <=30 minutes, with light
  and dark completion screenshots. The observation session has now
  measured the CLI's real stream shapes; the timed genesis itself is
  still owed.
- **Confirm the quit-mid-turn behaviour** (T-043's own @human line):
  start a `hang`-scenario genesis, quit the app, and it should close
  promptly rather than after a five-second pause. Runnable — the relaunch
  it waited on happened at T-069's merge and nothing has moved since.
- **Visual judgment:** decide whether the bounded shell and its internal
  board/map/error scrollbars feel right in both schemes.
- **Stray real-smoke directories:** the pre-existing
  `nputer-t025-realsmoke-*` directories remain a human delete-or-keep
  choice.
- **The two `nputer-T-060` `fake_agent` orphans** (`52504`/`52505`) are
  still alive at ppid 1 and are safe to kill by pid; recorded as
  `T-043-s1` rather than swept, because nobody has attributed them.
- **Repository remote:** there is still no remote. **CI has never run on
  a real runner**, so `index --check` as a CI step remains true in the
  future tense only — which `CONVENTIONS.md` now says itself, in T-078's
  own words, instead of claiming a gate holds it. The integrator ran it
  by hand at this checkpoint and it exited 0. The same is true of the
  token lint's dependency on git being on PATH.

Milestone 3's implementation list is complete, but the milestone is not
claimed until the real timed genesis exists.

## Open questions

- **Should CONVENTIONS' gate-range rule be corrected, or replaced?**
  **Sharpened, not merely repeated.** Two distinct defects now sit in one
  bullet: the reassurance that the two derivations always agree (false
  three times, and this merge falsifies it on BOTH gates at once), and
  the notation that inverts before the merge exists (`T-078-s9`, which
  caught this integration's own brief). They are one edit. What is still
  open is whether the bullet should name `git merge-tree --write-tree` as
  the pre-merge form, which is conflict-aware and needs no merge commit.
- **Where does a lane whose fence is `app/src-tauri/**` run its poison
  drill?** Unchanged and still unwritten. T-078 rewrote the drill bullet
  and did not answer this — correctly, since its criteria never named it.
  Candidate rule stands: any drill that mutates a watched source tree
  runs in a scratch worktree with its own `CARGO_TARGET_DIR`, and the
  checkpoint says so.
- **Does TASK-FORMAT's size-S row need a carve-out?** Unchanged, and
  T-078 explains why it could not close it: `T-078-s3` records that a
  `[docs/CONVENTIONS.md, method/]` fence cannot carry a `method/` format
  bump, because the version stamp is pinned by a Rust test
  (`snapshot_version_matches_the_live_method_stamps`) and bumping it
  makes the commit's third file Rust. **Any card that edits `method/`
  formats needs a fence that reaches `app/src-tauri`.**
- **How many poison shapes are there, and who renumbers them?** T-078
  gave ordinals to FIVE and SIX. `T-078-s13` proposes **EIGHT** (a
  containment pin with no uniqueness floor) and T-080's `s7` proposes
  **NINE**, while SEVEN — the mutant no body kills, derived from pins
  rather than criteria — has four independent sightings and no single
  owner. The taxonomy is being extended by three lanes that cannot see
  each other, which is exactly how it acquired two fifths before.
- **Should a pin ever assert a PROXY for the thing it means?** Unchanged
  (T-073's include pin, its corpus pin) — and `T-080-s8` is a fresh
  instance of the same question from the lint's side.
- **What does `review: independent` mean — a different session, or a
  different model?** Unchanged: five done cards carry it and only three
  have different models on the two sides.
- **Should `aliasedIdSlots` keep its `compare` parameter?** Endorsed by
  two sessions and filed by neither.
- T-057-s2 leaves an unpinned behaviour change in C-13 that moves against
  T-056's direction; it is T-072's third criterion.

**Answered by this merge, and left in place rather than edited out:**

- *"Should `docs/CONVENTIONS.md` legend the token lint's exit codes?"* —
  **YES, and it now does.** The legend describes the gate as it behaves
  today, including the collapse: exit 1 means either a violation or a
  gate that could not read the tree, while the two neighbouring gates
  each reserve a code for "could not run". It is written so it does not
  depend on T-080 landing first. **Its second row is now owed by
  whoever integrates T-080, because T-080's own branch does not write
  it.**
- *"Which walk sees this file?"* — **CLOSED by the four-walks table**,
  which names the AUTHORITY file for each walk rather than restating its
  contents, so it cannot drift from the files that decide it. Every
  integrator was re-deriving this.
- *"Does a card's `status: done` belong to the verifier or the
  integrator?"* — **the integrator, at the checkpoint.** Six of the last
  seven now answer it, across both size tiers, against T-058's executor
  alone. The evidence is finished; only the writing-down is left, and it
  belongs in `method/` rather than here.
