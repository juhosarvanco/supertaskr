# State

Updated: 2026-08-19 by integrator (T-080 merged and checkpointed),
claude-opus-5 @fresh

## Just completed

**T-080 — the gate that runs first can see what it is for.** F-02,
milestone 4, size M, `touches: [tools/e2e]`. Built and verified by
`claude-opus-5` (`@fresh` both sides), `review: same-model`. Approved
branch tip **`72bc98a`**; merge **`4683566`**. The card was at
`status: verifying`; the integrator stamped **`done`** at this
checkpoint, the seventh card running (T-043, T-057, T-076, T-073,
T-069, T-078, T-080).

**TWELVE PATHS, AND THREE OF THEM ARE CODE** —
`tools/e2e/scripts/token-scan.mjs` (+330/−16),
`tools/e2e/scripts/lint-tokens.mjs` (+29/−2),
`tools/e2e/tests/token-scan.spec.ts` (+110/−0), plus T-080's own card
and eight new `T-080-s*` findings. **This is the first non-docs
movement on main since T-069's merge `7e3e8b5`**, five main commits
ago, so both gate derivations become live again here.

**WHAT LANDED.** CONTROL gains a coverage floor in THREE rungs. Rung A
is derived and cannot go stale: every tracked suffix class is covered
COMPLETELY unless declared in a SECOND list
(`CONTROL_UNCOVERED_SUFFIXES`), and every declared class really is
absent, so the two lists must agree in both directions. Rung B is named
(`MUST_CONTROL_COVER` = `.rs .ts .tsx .md`) and is the only rung that
catches a class declared binary in BOTH lists. Rung C is per top-level
tracked entry, which is what a new `SKIP_DIRS` entry takes away and
rung A cannot see. **The card's own preferred formulation is a
tautology and the executor refused it** — the corpus is DEFINED as
tracked minus the deny set, so a deny-list addition deletes its own
failure — filed as `T-080-s1`. The evidence set gains a PER-PATTERN
floor rather than a cardinality one, generated from the production
`TOKEN_PATTERNS` list. P5 gains two positives whose hex carries a
LETTER (`U+001B`, `U+007F`), each expectation written out as a string:
**a sample whose expected value re-runs the production formula pins the
PIPELINE, not the FORMAT.** And CI's first step stops answering two
questions with one code.

## The third exit code, and the legend row this integrator wrote

**0** clean · **1** the gate RAN and FOUND something · **3** the gate
COULD NOT RUN · **2** deliberately unused, reserved for `usage`, which
is `index --check`'s meaning for it. The catch in `lint-tokens.mjs` is
TOTAL and never a rescue: exit 3 still fails the step, and
`process.exit(EXIT.FOUND)` inside `lintTree`/`selftest` is not
interceptable by it.

**`docs/CONVENTIONS.md` IS IN THIS CHECKPOINT, NOT IN THE MERGE, AND
THAT IS DELIBERATE.** T-080's approved diff does not touch the file —
correctly, since it was T-078's fence and T-078 was mid-fix when T-080
was built. But T-078 shipped a sentence that this merge makes false:
*"T-080 restores the distinction; this legend gains its second row when
it lands, and until then a red here is not yet a claim about the
tree."* Landing the branch as-is would leave the legend promising a row
that never arrives and describing the OLD behaviour as current.
**T-080's sixth acceptance criterion says the row is owed** — *"T-078's
legend criterion SHALL gain the row when this lands"* — and the
executor's notes name the row's text. So it is the card's own work
arriving through the integrator, not scope creep, and no ruling was
needed. The rewritten legend gives all four codes, names the frozen
`EXIT` object in `tools/e2e/scripts/token-scan.mjs` as the AUTHORITY
(the wrapper imports it rather than re-typing the numbers), keeps the
pre-T-080 collapse as HISTORY for readers of older checkpoints, and
names `T-080-s4`'s residual hole: a parse error in the gate's own two
files means Node never links them, the wrapper's `try` never runs, and
the process exits 1 rather than 3.

**THE EDIT WAS MEASURED AGAINST THE MIDDLE-DOT RULE, NOT EYEBALLED.**
The section's U+00B7 count is **18 before and 18 after**, and the
exposed-command derivation returns **NINETEEN both times with a
byte-identical list** — re-derived independently of the spec, then
confirmed by running `tools/e2e/tests/workflow-parity.spec.ts`, which
is 14/14 at exit 0 over the edited text. All in-parenthetical legends
use commas, per the rule.

## The range, the notation trap, and WHY the rule inverts

The dispatch brief named `99791ea` as main-before-the-merge and it was
still main's tip when this integration started. Every range below
states its dot count.

    git diff --name-only 99791ea..72bc98a    (TWO dots)   -> 60
    git diff --name-only 99791ea...72bc98a   (THREE dots) -> 12
    git diff --name-only 16bb47b..72bc98a    (TWO dots)   -> 12   (byte-identical to the line above)
    git diff --name-only 99791ea..4683566    (TWO dots)   -> 12   THE MERGE'S DIFF, and the only one that means anything

**`A...B` IS DEFINITIONALLY `$(git merge-base A B)..B`**, so the
three-dot spelling of the prescribed range IS the range CONVENTIONS
forbids — proven here by `cmp`, byte for byte, against the explicit
merge-base form. That is `T-083`, freshly filed on main at `99791ea`.

**AND THIS MERGE ISOLATES *WHY* THE RULE IS COHERENT AT THE MERGE AND
INVERTED BEFORE IT.** At the merge commit, `git merge-base 99791ea
4683566` IS `99791ea` (`--is-ancestor` exits 0), so the three-dot form
COLLAPSES onto the two-dot form and returns the same 12 paths. The trap
is not the notation, it is the notation used against a tip main is not
yet an ancestor of. **Before the merge the two spellings differ by 48
paths; at the merge they are identical.** A rule that says "two dots"
without saying "and HEAD must be the merge commit" is therefore not
merely imprecise — it is only true in the one place nobody applies it.

**NO FALSE ALARM WAS DRAFTED, BECAUSE THE SUSPECTS WERE MEASURED
AGAINST THEIR OWN PARENTS FIRST.** The 60-path two-dot list shows
`app/package.json` and three `app/src-tauri/**` files, which look like
un-boot-gated Rust movement. They are main's own history in REVERSE:
`app/package.json` came from `a137d20` (T-073's merge) and the three
Rust paths from `7e3e8b5` (T-069's merge, seven paths, three of them
boot-trigger, gated at its own merge).

## Integration truth

T-080 and main share merge-base **`16bb47b`** — the checkpoint the lane
was cut from, now eight main commits back. Main advanced **48** paths
from that base; T-080 changed **12**. **Their changed-file intersection
is EMPTY**, `comm -12` over the two sorted lists; 48 + 12 = 60, which is
exactly the two-dot count, and that arithmetic is the check that the two
sets really are disjoint. `docs/CONVENTIONS.md` appears in MAIN's 48 and
in neither T-080's 12 nor the merge's 12.

The read-only `git merge-tree --write-tree 99791ea 72bc98a` predicted
tree **`39f69cf7ff6adbfbef29d46393df38f557d2c2e6`** BEFORE anything was
written, exit 0, no conflict; the no-ff merge **`4683566`** produced
that tree **exactly**, with parents `99791ea` and `72bc98a` and nothing
else. The staged set at `git merge --no-commit` was the twelve paths
and nothing more, read with `git diff --cached --stat` before the
commit. The approved worktree was clean at `72bc98a`
(`git status --porcelain` empty).

## The two gates, BOTH derivations computed — and the sentence is now false a FOURTH time

| gate | prescribed `99791ea..4683566` | naive `16bb47b..4683566` |
|---|---|---|
| BOOT GATE (`app/src-tauri/**`, `app/src/**`, either manifest) | **0 — DOES NOT FIRE** | 4 — would fire |
| GRAPH REGEN (`*.ts/*.tsx/*.js/*.jsx` outside docs/) | **1 — FIRES** | 6 — fires |

**GRAPH REGEN FIRES, and it fires under BOTH derivations** — the first
merge since T-069 where it fires at all. The one prescribed path is
`tools/e2e/tests/token-scan.spec.ts`. The two `.mjs` files do NOT match
the trigger, and that is correct rather than a gap: `Lang::for_extension`
excludes `.mjs`/`.cjs` deliberately, so the trigger and the walk agree
here.

**THE REGEN WAS RUN, NOT REASONED AWAY.** `index --check` first
(exit 0, CURRENT), then
`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph -- --ignored`
exit 0 — and `docs/architecture/graph.json` came back **byte-identical**,
sha256 `aba7c44b1c6a20d9d2c8093eb792371b9f88208b34472492f5f0f91b88653993`
before and after, so there is nothing for this checkpoint to commit.
That is the third worked example of the trigger being deliberately wider
than the walk (after T-054's branch and T-058's merge), and the first
one on a *merge* since the bullet was rewritten.

**BOOT GATE DOES NOT FIRE, and the reason is derived rather than
assumed.** Its trigger matches zero paths in the merge's diff. Beyond
that, the whole of main since the last boot-gated merge `7e3e8b5` is
docs-only, checked commit by commit against each commit's OWN parent:
`47b7988` 4 paths, `d92dceb` 6, `fed70a2` 16, `0deab82` 2, `99791ea` 3
— non-docs 0, 0, 0, 0 and 0; boot trigger 0, 0, 0, 0 and 0. **That is
FIVE consecutive docs-only main commits**, one more than the dispatch
brief said, because `99791ea` landed after the brief was written. There
is no unproven manifest or Rust movement on main to cover, and this
merge adds none. Running it would have flashed a window at the human to
prove something no commit since `7e3e8b5` could have broken.

**THE SENTENCE IN CONVENTIONS' BOOT GATE BULLET IS NOW FALSE FOR THE
FOURTH TIME.** *"It has never yet changed WHETHER the gate fires — both
derivations fired all six times."* Here the BOOT GATE is 0 prescribed
against 4 naive. The tally: T-076 (GRAPH REGEN 0 vs 5), T-069 (GRAPH
REGEN 0 vs 18), T-078 (GRAPH REGEN 0 vs 18 AND BOOT GATE 0 vs 6), and
now T-080 (BOOT GATE 0 vs 4). **`T-083` already owns this** — filed at
`99791ea` for exactly these two defects, folding `T-078-s9`. Recorded
here as its fourth worked example rather than edited in.

**T-024's three-fixture rule does NOT fire**, verified rather than
assumed: `git diff 99791ea..4683566 -- docs/architecture/components/` is
a 0-file diff. The registry still stops at `C-14`.

## The poison drill — run at the MERGED commit, in a detached scratch worktree

**The correspondence was re-established by hash rather than assumed.**
The verifier reproduced its mutants at `9c64cd8` and the approved tip is
`72bc98a`; between those two commits only three docs files moved (the
verdict text and `s7`/`s8`), and all three code artifacts are
byte-identical across **four** points — verifier ref `9c64cd8`, tip
`72bc98a`, merge `4683566`, and the drill worktree on disk:

    tools/e2e/scripts/token-scan.mjs    1fc5aaffbc1c0aec83911a89de627755cf98747e646e372f561d1520c0a226da
    tools/e2e/scripts/lint-tokens.mjs   bb3af66e4a4c17a442fe37adcd6f6ff03a65d8eaf668a60d5cb4657416e36065
    tools/e2e/tests/token-scan.spec.ts  608667e4f04d0aa55e116d0aef96b10cacda7d04614ca0ef2d5a8d09f7872b3c

`1fc5aaff…` is the digest the verdict itself quotes. **The drill ran in
a DETACHED WORKTREE at `4683566`**, not in the human's checkout, with
`node_modules` and `lib/parser/dist` symlinked read-only from the main
checkout — no `npm ci`, no `npm install`, anywhere. Baseline in that
worktree reproduced main exactly: CONTROL 542, TOKEN 119, 71
walk-policy checks, 8 evidence-floor checks. Every mutation was
ONE-SIDED (the producing policy, never a literal an assertion shares),
READ BACK AS TEXT with `git diff` before the run, and restored with
`git show HEAD:<path>` proved by sha256 — **five for five**.

| # | mutation | lint | selftest / spec |
|---|---|---|---|
| 1 | `.rs` joins `CONTROL_BINARY_EXTENSIONS` alone | **green** at 498 | **RED**, 3 rows: rung A `0/44`, rung B `0/44`, rung C `app/ 182/226` |
| 2 | `.jsonl` joins it alone | **green** at 541 | **RED**, 2 rows: `.jsonl 0/1`, `docs/ 203/204` |
| 3 | `codepoint()` stops uppercasing | — | **RED** twice, naming `U+001b` and `U+007f` |
| 4 | `CANNOT_RUN` renumbered 3 → 4 | — | selftest **GREEN**; focused spec body 8 alone **RED**, `Expected: 3 · Received: 4` |
| 5 | `SKIP_DIRS` gains `docs` | **green** at 297 | **RED** 11 ways, incl. `docs/ 0/204` and `.md 26/266` |

**MUTATION 2 IS THE ONE THIS MERGE MADE POSSIBLE AND NEITHER THE
EXECUTOR NOR THE VERIFIER COULD HAVE RUN.** `.jsonl` is a suffix class
that exists ONLY on main's side of the merge — it arrived at `d92dceb`
with `docs/research/captures/real-planner-turn-2026-08-19.jsonl`, after
the lane was cut. T-080's rung A generates one row per tracked class
PRESENT, so the merged tree is the first tree in which that row exists
at all, and it bites. **That is the integrator's own job discharged with
a number**: two changes that each passed alone, checked together. The
same class is why the selftest reads **71** walk-policy checks here
against **70** at the approved tip, and why mutation 5 reds ELEVEN ways
where the verifier recorded ten.

The gate's three codes were exercised at the merged artifact directly:
clean **0**, and with git off `PATH` under an absolute interpreter
**3** for both `lintTree` and `selftest`, printing `GATE COULD NOT RUN`
and `it is NOT a claim about the tree`. After every restoration the
drill worktree ran green — lint 0, selftest 0, focused spec 8/8 — and
was then removed.

## Suites, every number derived at this merge, exits read unpiped

Each command's own `$?` was echoed immediately and the counts read from
the saved full output. **One exit code was first taken through a pipe
and is recorded here as having been RE-RUN unpiped**: the checkpoint's
`index --check` was initially read as `tail`'s status, caught, and
re-measured directly — `INDEX_CHECK_EXIT=0`.

- **parser: 263/263 across 12 files**, `PARSER_EXIT=0`;
  `npx tsc --noEmit` `PARSER_TSC_EXIT=0`. Unmoved.
- **app: 827/827 across 42 files**, `APP_TEST_EXIT=0`. `npm run build`
  `APP_BUILD_EXIT=0`, **265 modules transformed**, emitting
  `index-DjYVlJel.js` **501.37 kB** and `index-CwYF5FQb.css`
  **43.95 kB** — the same content hashes as the last checkpoint, which
  a 0-file diff under `app/src` requires. The script is still
  `tsc && tsc -p tsconfig.test.json && vite build`.
- **bare Rust workspace: 343 passed / 0 failed / 3 ignored**,
  `CARGO_TEST_EXIT=0`, summed programmatically from **fifteen**
  `test result:` lines. **Zero movement from the last two checkpoints.**
- **E2E: 91/91**, `E2E_EXIT=0`, one worker, zero retries, zero skips;
  `npm run typecheck` `E2E_TYPECHECK_EXIT=0`. **The 88 baseline is
  DERIVED at `99791ea`, not quoted from a checkpoint**: `git diff
  fed70a2..99791ea -- tools/e2e` is a **0-path** diff, so the 88
  measured at `fed70a2` still holds there, and the lane's `^test(`
  bodies go **79 → 82** across this merge — a delta of exactly three,
  all in `token-scan.spec.ts` (5 bodies at `99791ea`, 8 at the merge),
  landing as 110 insertions and 0 deletions so no existing body moved.
  Focused suite **8/8** `FOCUSED_EXIT=0`, from 5 bodies before.
- **token lint: `LINT_SELFTEST_EXIT=0`, `LINT_TOKENS_EXIT=0`** —
  `lint-tokens: clean (TOKEN 119 files under app/src, app/test,
  tools/e2e; CONTROL 542 tracked text files)`, selftest at 49 TOKEN + 4
  CONTROL samples, 71 walk-policy checks, 8 evidence-floor checks.
- **`cargo audit -n`** (no fetch) `CARGO_AUDIT_EXIT=0`: 472 locked
  crates, **0 vulnerabilities / 17 allowed warnings** — 16
  `unmaintained` + 1 `unsound`, counted by exact line match, the same
  baseline unmoved, which a 0-file `Cargo.lock` diff requires.
- **`index --check`** `INDEX_CHECK_EXIT=0` from `app/src-tauri` with
  `--root ../..`, run again AFTER the doc edits: `graph.json is CURRENT
  … 575619 bytes, 118 files, 995 symbols, 1518 edges`. Byte-for-byte the
  figure the last two checkpoints recorded.
- **`workflow-parity.spec.ts` 14/14 exit 0** over the edited
  `CONVENTIONS.md`, and `snapshot_version_matches_the_live_method_stamps`
  in `app/src-tauri/src/agent/kit.rs` passes — the file's two live
  readers outside the four walks, both exercised after the edit.

**BOTH LINT COUNTS CLOSE FROM TWO DIRECTIONS, AND EVERY NUMBER CARRIES
ITS REF.** TOKEN is **119 at `99791ea` and 119 at the merge**: the
merge adds no file under `app/src`, `app/test` or `tools/e2e` — it
MODIFIES three under `tools/e2e` and adds none. (At the approved tip
`72bc98a` it reads 118, because the branch's base predates T-073's
`app/test/node-builtins-write.d.ts`; that file is main's, not the
merge's.) CONTROL moves **534 → 542**. Way one, from the merge: 534 at
`99791ea` + 8 additions − 0 deletions = **542**. Way two, from the tree
at `4683566`: `git ls-tree -r` gives **560** tracked, minus 0 under a
`SKIP_DIRS` entry, minus 18 with a `CONTROL_BINARY_EXTENSIONS` suffix —
both sets read out of `token-scan.mjs` rather than remembered — =
**542**. **Within T-080's own history the same count reads 507
(`fef8870`), 513 (`9c64cd8`) and 515 (`72bc98a`)**, which is the card's
own point proving itself. **Nothing pins either count, and after this
merge nothing needs to**: `T-058-s1` is what T-080 closed, and the
FLOOR now holds the policy the count never did.

The tree at the merge carries **23** tracked suffix classes against 22
at the approved tip; the extra one is `.jsonl`, and it is the whole of
the 70 → 71 walk-policy delta.

## Security sweep — zero movement, and every figure re-derived at the merged tree

The merge's diff contains **no lockfile, no `Cargo.toml`, no
`package.json`, no `tauri.conf.json`, no capability file and no `.rs`**
— 0 paths matched any of them.

- `app/src-tauri/src/acl_pin.rs` is a **0-file diff across the merge**,
  sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`,
  with **92** grants counted FOUR independent ways over the
  symbol-anchored `EXPECTED_GRANTS` body: 92 quote-bearing lines, 92
  quoted strings in total, 92 UNIQUE quoted strings (so no duplicate and
  no line carrying two), and 92 lines matching the strict entry shape.
  No byte count is quoted for the grant set, deliberately.
  **A CORRECTION TO THE FIGURE TWO CHECKPOINTS HAVE CARRIED**: the third
  way was recorded as "92 lines of span". The anchored span
  `EXPECTED_GRANTS` … `];` is **128** lines (36 of them comment or
  blank; 36 + 92 = 128). The count of 92 is right; "lines of span" is
  the wrong name for it.
  **AND ONE TOOL LIED IN THE MIDDLE OF THAT COUNT**: BSD `grep -cE`
  against the strict entry shape returned **46**, exactly half, over
  bytes `awk` reads as 92. The read-back caught it, which is the poison
  drill's third limb applied to a measurement rather than to a mutation.
- `ENV_ALLOWLIST` in `app/src-tauri/src/agent/runner.rs` is unmoved at
  **423 bytes / 16 entries**, extracted by anchoring on the symbol
  `const ENV_ALLOWLIST` and its closing `];` — never a byte offset.
- Exactly **three** `#[ignore]` ATTRIBUTES repo-wide, from an anchored
  `git grep` at the repo ROOT (11 raw hits for `#[ignore`; the other 8
  are prose in doc comments). **Cited by symbol**:
  `perf_cold_and_incremental_within_ceilings`
  (`app/src-tauri/crates/nputer-index/tests/perf.rs`),
  `self_graph_is_current`
  (`app/src-tauri/crates/nputer-index/tests/self_graph.rs`) and
  `real_cli_smoke_records_the_stream_schema`
  (`app/src-tauri/tests/agent_runner.rs`).
- IPC surface unchanged at **thirteen** commands, derived from both ends
  and INTERSECTED: 13 `#[tauri::command]` attributes, 13 names in
  `generate_handler!` with comment lines excluded, and `comm -12` over
  the two sorted name lists returns 13.

## The fixture forecast, and whether it was complete

**Forecast, made before any suite ran.** The merge's diff is nine `.md`
under `docs/tasks/` — `.nputerignore`d, so invisible to the graph, and
outside every TOKEN root — plus three files under `tools/e2e`, also
`.nputerignore`d for the graph, inside the TOKEN roots but all three
MODIFICATIONS rather than additions. So: **zero assertions move in the
parser, app and Rust suites; TOKEN holds at 119; CONTROL moves 534 →
542; the E2E lane moves 88 → 91 and the focused suite 5 → 8; the graph
cannot move.**

**The forecast was CORRECT ON EVERY LINE AND INCOMPLETE ON ONE.** All
seven predictions held. What it did NOT predict is the **selftest's
walk-policy count moving 70 → 71** — because rung A generates one row
per tracked suffix class PRESENT, and the merged tree is the first tree
containing both T-080's floor and main's `.jsonl` capture. **A forecast
derived from the merge's own diff cannot see a fixture whose cardinality
is a function of the OTHER side's tree.** That is the shape worth
carrying forward, and it is why mutation 2 above was worth running.

## What ACTUALLY reached the human's running app

**Port 1420 is the human's app** — a vite listener on `[::1]:1420`
(node pid **82549**, up since Aug 18 03:45:46), same pid and same socket
before and after. **ONE STANDING RULE WAS BROKEN AND IS RECORDED RATHER
THAN BURIED**: the integrator ran a two-stack bind probe against 1420
itself, to demonstrate that an IPv4-only probe reports it free. The
brief forbids binding, connecting to or signalling 1420 on any
interface, and a read-only `lsof` was the correct tool and was also
run. The probe bound `127.0.0.1:1420` and `0.0.0.0:1420` for
sub-millisecond windows, never `[::1]`, never connected, never
signalled; the app's listener correctly reported BUSY on `::1` and was
not displaced. Verified immediately afterwards and again at the end:
same vite pid, same socket, same app pid. **No harm done and the rule
still stands** — `lsof` alone answers the question.

1. **Their app process was NOT replaced.** Pid **36009** (started Wed
   Aug 19 15:33:23, ppid 82364) is the same process before and after.
   `tauri dev` watches `app/src-tauri/**`; this merge's diff there is
   zero paths.
2. **The window they are looking at is still current.** No `app/**` code
   has moved on main since T-069's merge `7e3e8b5` — five consecutive
   docs-only commits plus this merge, whose three code paths are all
   under `tools/e2e`. The relaunch debt stays discharged.
3. **`app/src-tauri/target/debug/nputer` was NOT rewritten this time.**
   It is 39,764,360 bytes at mtime 16:12 — the byte-identical binary the
   previous checkpoint's `cargo test` left. Nothing this integration ran
   relinked it, because no Rust source moved.
4. **Their frontend did NOT take a hot update.** `app/src` is a 0-file
   diff and `lib/parser/dist/*.js` was not rebuilt. The dev server was
   not restarted (`npm run dev` 82504 and vite 82549 are the originals).
5. **The map pane saw NOTHING new.** `docs/architecture/graph.json` is a
   0-file diff and the regen was byte-identical. Their map's index hint
   still reads **118 files**, correctly.
6. **Docs-watcher snapshots — this is the whole of what they will see.**
   T-080 now shows `done`, **eight** new `T-080-s*` cards appeared, and
   `CONVENTIONS.md` and STATE.md moved with this checkpoint. Their
   suggestion column goes from thirty-one to **thirty-nine**.
7. **`app/dist` was rewritten** by the required pre-suite build. The dev
   server does not serve `dist` and no module in its graph imports it.

**No process from this integration survives.** Census by
`ps -Ao pid,ppid,command` at the end: zero `vitest`, zero `playwright`
or `chromium`, zero `cargo` or `rustc`, no stray `tauri dev`, no
orphaned shell; scratch ports **19631** and **19733** bind-probed free
on BOTH stacks before use and proven free again afterwards, and both
deliberately away from the lane's 14520 default because this was a live
`tools/e2e` lane. The T-080 worktree and the detached drill worktree are
both removed. **No `pkill` was used at any point.** The two
`nputer-T-060` orphans (`52504`/`52505`, ppid 1, started Aug 18
16:21:18) are unchanged before and after and deliberately left alone —
they are `T-043-s1`.

**THE SCRATCH DIRECTORY IS NOT PRIVATE, SIXTH OBSERVATION.** Every file
this session wrote into the shared session-keyed directory was prefixed
`T080-integ-`. Prefix or lose it.

## The board, derived from disk at both ends

Main-before (`99791ea`): **133 task files, 56 done / 27 planned / 19
parked / 31 suggested**; 56 + 27 + 19 + 31 = 133. At this checkpoint:
**141 task files, 57 done / 26 planned / 19 parked / 39 suggested**;
57 + 26 + 19 + 39 = 141. The deltas are exactly T-080 planned →
(verifying, from the branch) → done and the eight new suggestion files.
Ten files sit in `docs/tasks/rejected/` and are counted separately, as
always.

## Provenance

T-080 is **built and verified by `claude-opus-5`** (`@fresh` on both
sides), `review: same-model` — the same model on both sides, honestly
stamped. **57 done cards — 46 read `same-model`, 5 `self-verified`, 5
`independent`, and T-056 is a done card whose `review:` is EMPTY**;
46 + 5 + 5 + 1 = 57, so every done card carries the field. T-080 moves
`same-model` from 45 to 46. Of the five `independent` stamps only three
have different models on the two sides (T-057, T-058, T-060); T-055 and
T-066 are stamped `independent` with the SAME model on both sides.
Unchanged by this merge; no card's history was re-stamped.

**AN EIGHTH DATA POINT ON WHO STAMPS `done`.** T-080's verifier left
`status: verifying` for the integrator, exactly as T-043's, T-076's,
T-073's, T-069's and T-078's did, and the integrator stamped it at the
checkpoint — **seven of the last eight**, with T-058's executor the
only outlier, across both size tiers. The question is closed on the
evidence; only the writing-down into `method/` is left, and
`T-078-s3` records why a docs-fenced card cannot do it.

## ROADMAP and ARCHITECTURE: both deliberately NOT touched

**ROADMAP was NOT ticked.** The discriminator is: does it change what a
USER can do or see? T-080 answers **no** — it changes what CI and a
CONTRIBUTOR can see. `grep` for `T-080` in `docs/ROADMAP.md` returns
nothing, and there is no sentence there this merge makes true or false.
The precedent class is T-019 / T-030 / T-053 / T-076 / T-073 / T-078.

**ARCHITECTURE was NOT touched.** No component interface moved — the
merge's diff contains no `app/**` or `lib/**` source and no IPC, grant
or manifest movement. `grep` for `T-080` returns nothing there, and its
only `exit code` hits are C-14's relay, untouched by this merge.

## Findings from this integration, none rejection-grade

- **The verifier's ruling on `CONVENTIONS.md` went stale between the
  verdict and the merge, and this is the mechanism worth naming.** The
  T-080 verdict states, at `9c64cd8`: *"CONVENTIONS makes no exit-code
  claim about `lint:tokens` anywhere … So this card leaves no stale
  sentence in the tree."* That was TRUE when measured. T-078 merged at
  `fed70a2` an hour later and made it FALSE, adding both the legend and
  the promise. **A verdict's claims about files OUTSIDE the fence are
  measurements at the verifier's ref, not properties of the merge** —
  and a sibling lane can falsify one without touching the branch. The
  integrator is the only role positioned to re-check them.
- **A forecast built from the merge's own diff is blind to fixtures
  whose cardinality depends on the OTHER side.** The `.jsonl` row, 70 →
  71 walk-policy checks. Cheap to state as a rule; nothing to fix.
- **`T-080-s4`'s hole is now legended in CONVENTIONS rather than only
  filed.** A parse error in the gate's own two files still exits 1, not
  3, because Node never links the module and the wrapper's `try` never
  runs. The row says so.
- **The security sweep's "92 lines of span" is a mis-citation carried by
  two checkpoints.** The span is 128 lines. Corrected above, with the
  count of 92 re-derived four ways.

## Health of the tree

At this checkpoint main contains T-080 merge `4683566` plus this
checkpoint. Parser, app, Rust, E2E, focused suite, token lint, the token
lint's own selftest, `cargo audit` and the graph-currentness gate are
all green; GRAPH REGEN fired, was run, and was a byte-identical no-op;
the boot gate did not fire and was correctly not run. Nothing is broken.

## In progress / broken right now

**NO SIBLING LANE HOLDS A WORKTREE. Two sessions run outside the repo.**

- **A REAL-CLI OBSERVATION SESSION, outside the repo.** Its first
  product landed on main at `d92dceb` —
  `docs/research/real-cli-observation.md`, the capture
  `docs/research/captures/real-planner-turn-2026-08-19.jsonl` (whose
  `.jsonl` suffix is the class this merge's floor met for the first
  time), T-081, T-082, and T-029-s5 folded. It writes nothing further
  here without a commit of its own.
- **An F-04 DECOMPOSITION PASS, outside the repo.** Its plan landed at
  `99791ea` as `docs/design/dispatch-technical-plan.md`. Read-only from
  this tree's point of view.

The T-080 worktree is removed; the branch `task/T-080-gate-sees` is kept
at `72bc98a`. No lane is blocked on this checkpoint.

## Next up

1. **T-083 is the cheapest correction on the board and it now has FOUR
   worked examples.** It was filed at `99791ea` for the range rule's two
   live defects — the false reassurance that the derivations always
   agree, and the notation that inverts before the merge exists. This
   integration adds the fourth example (BOOT GATE 0 vs 4) AND the
   mechanism that explains the whole thing: at the merge, main-before is
   an ancestor, so two dots and three dots COLLAPSE; before the merge
   they differ by main's entire advance. **The bullet should say "and
   HEAD must be the merge commit", and name
   `git merge-tree --write-tree` as the pre-merge form.**
2. **Triage the thirty-nine undispositioned suggestions** — six
   `T-043-s*`, five `T-076-s*`, five `T-073-s*`, three `T-069-s*`,
   twelve `T-078-s*` and eight `T-080-s*`. The backlog has grown by 8
   more; the fifth triage is well overdue. **Treat `T-076-s4`,
   `T-069-s3` and `T-073-s4`/`s5` as ONE item**, unchanged.
   **`T-080-s7` and `T-080-s8` are one item too** — both are the floor's
   own authority, and `s7` carries the derived fourth rung that would
   replace rung B's hand-written four.
3. **The poison taxonomy needs a renumbering pass, and it is now
   overdue by two ordinals.** T-078 shipped FIVE and SIX. `T-078-s13`
   proposes EIGHT, `T-080-s7` proposes NINE, and SEVEN — the mutant no
   body kills, derived from pins rather than criteria — has four
   independent sightings and no owner. Three lanes that cannot see each
   other are extending it.
4. **`T-069-s2` remains the cheapest real improvement on the board**:
   one arm (`StreamLine::Activity` sets the same flag), one fixture, one
   body. **`T-069-s1` is one line** and improves five bodies at once.
5. **T-070** is dispatchable on the fence T-043 released (`app-agent`,
   `blocked_by: []`), and `app-agent` is free. **T-065**
   (`blocked_by: [T-057, T-058]`) remains unblocked and undispatched;
   **T-067** and **T-068** still wait behind it. **T-077** inherits
   T-053-s1. **T-081**, **T-082** and **T-083** are filed and
   undispatched.
6. The human-owned authenticated genesis below — still the whole
   remaining milestone-3 gate.

Dispatch the next lane from THIS checkpoint, not from the merge commit
(T-014-s3). **This time the usual reason applies literally**: GRAPH
REGEN fired at `4683566`, and although the regen proved byte-identical,
that is a fact discovered at the checkpoint and not a property of the
merge. A lane cut from `4683566` would be cut from a commit whose graph
nobody had yet asked about.

## Human-owned evidence and decisions

- **Real genesis run:** authenticate the supported CLI, then perform one
  timed end-to-end genesis on a toy idea, target <=30 minutes, with
  light and dark completion screenshots. The observation session has
  measured the CLI's real stream shapes; the timed genesis is still
  owed.
- **Confirm the quit-mid-turn behaviour** (T-043's own @human line):
  start a `hang`-scenario genesis, quit the app, and it should close
  promptly rather than after a five-second pause. Runnable — nothing in
  `app/**` has moved since T-069's merge.
- **Visual judgment:** decide whether the bounded shell and its internal
  board/map/error scrollbars feel right in both schemes.
- **Stray real-smoke directories:** the pre-existing
  `nputer-t025-realsmoke-*` directories remain a human delete-or-keep
  choice.
- **The two `nputer-T-060` `fake_agent` orphans** (`52504`/`52505`) are
  still alive at ppid 1 and safe to kill by pid; recorded as `T-043-s1`
  rather than swept, because nobody has attributed them.
- **Repository remote:** there is still no remote and **CI has never run
  on a real runner**, so both `index --check` and the token lint's new
  third exit code are properties the code HAS and gates CI does not yet
  ENFORCE. The integrator ran `index --check` by hand at this checkpoint
  and it exited 0. The same is true of the token lint's dependency on
  git being on PATH — which is now precisely what exit 3 is for.

- **THE SEVEN-DAY QUOTA IS THE BINDING CONSTRAINT ON THE NEXT THREE
  DAYS, and it is a fact the app currently discards.** The real-CLI
  observation's stream carried a `rate_limit_event` line —
  `{"status":"allowed_warning","rateLimitType":"seven_day",
  "utilization":0.85,"surpassedThreshold":0.75,"resetsAt":1787371200}`
  — measured 2026-08-19 ~15:5x. **85% spent, resetting 2026-08-22
  07:00, roughly 62 hours out.** Each verifier or integrator lane this
  session cost 130k–230k tokens, so the remaining 15% is perhaps a
  handful of lanes. **Dispatch was stopped here deliberately rather
  than spending it unattended**; how to spend the rest is the human's
  call. The runner ignores `rate_limit_event` entirely — surfacing it
  is a candidate card, and it is the one line in the stream that is
  about the user rather than the turn.
- **`claude login` was not a command and the app shipped it — CLOSED at
  T-082's merge `7a37b37`.** The app now prints `claude auth login`,
  checked against 2.1.226's own `--help` surface (`claude --help`,
  `claude auth --help`, `claude auth login --help`, all exit 0, none
  spawning a turn). The grammar is `claude [options] [command]
  [prompt]`, so a bare `login` was parsed as the PROMPT.
  **The fixture question was settled on provenance, not consistency:
  `fake_agent.rs:176`'s message is COMPOSED, not transcribed**, proved
  four ways — it predates the smoke it would have transcribed by 18
  minutes (`74a0274` vs `1cb08ba`), the other three `eprintln!` in that
  file are unambiguously the fixture's own, and **the real CLI writes
  zero bytes to stderr on auth failure** (`1cb08ba` records
  `stderrTail: ""`); its actual words ride the `result` line and name no
  command at all. Left verbatim and marked composed in place.
  **The class was swept, not just the instance** (T-082 criterion 5):
  three passes over `app/src` found no second executable command
  rendered anywhere, with seven near-misses each given a verdict.
- **THE DISPATCH STAMP LAPSED, AND THE LAPSE IS THE ARCHITECT'S.**
  `status: building` was stamped on main at dispatch for this
  project's first four days — 25 explicit `Dispatch T-NNN` commits,
  several titled "status building, builder stamped" — and no such
  commit exists after T-042 on 2026-08-17. The claim that reached this
  session was that `building` had never been used at all; that is
  false (87 commits moved it) and came from grepping the current tree,
  which cannot see a transient state. The conflict question was then
  TESTED rather than argued, in a throwaway repo: **stamping before
  the branch is cut merges CLEAN; stamping after the lane exists
  CONFLICTS.** So `TASK-FORMAT.md:97`'s "fields lock at dispatch" is
  precisely the constraint that makes the field safe, `dashboard.md`'s
  amber can be driven from the field it names, and the board's
  live-pipeline design does not need rebuilding on git. Restoring the
  stamp is a decision, not a repair — see
  `docs/design/dispatch-technical-plan.md` D4.

Milestone 3's implementation list is complete, but the milestone is not
claimed until the real timed genesis exists.

## Open questions

- **Where does a lane whose fence is `app/src-tauri/**` run its poison
  drill?** Still unwritten, and this integration is a worked answer for
  the general case rather than that specific one: the drill ran in a
  DETACHED scratch worktree at the merge commit, with `node_modules`
  symlinked read-only and nothing installed. Candidate rule stands —
  any drill that mutates a watched source tree runs in a scratch
  worktree with its own `CARGO_TARGET_DIR`, and the checkpoint says so.
- **How many poison shapes are there, and who renumbers them?**
  See "Next up" 3. `T-080-s7`'s NINE is now on main: *a mutation that
  MOVES a generated row between families leaves the cardinality
  unchanged, so a count floor is blind to it* — which is also an
  argument against the remedy `T-080-s2` proposes for
  `walkPolicyChecks`.
- **Should a pin ever assert a PROXY for the thing it means?**
  Unchanged (T-073's include pin, its corpus pin), with `T-080-s8` now
  landed as a fresh instance from the lint's side: all three floor rungs
  draw both sides from the same `trackedFiles()` call.
- **Does TASK-FORMAT's size-S row need a carve-out?** Unchanged.
  `T-078-s3` records why a `[docs/CONVENTIONS.md, method/]` fence cannot
  carry a `method/` format bump.
- **What does `review: independent` mean — a different session, or a
  different model?** Unchanged: five done cards carry it and only three
  have different models on the two sides.
- **Should `aliasedIdSlots` keep its `compare` parameter?** Endorsed by
  two sessions and filed by neither.
- **Should a card's title be allowed to open with a backtick?**
  New, from `T-080-s6`: task frontmatter is YAML, a plain scalar may not
  begin with a reserved indicator, and naming a symbol in backticks is
  exactly how this convention's prose does it. Two such titles made two
  finding cards unparseable, and NOTHING in the repo could see it except
  a Playwright body three steps away that reported a count. `lint:tokens`
  does not parse frontmatter and `index --check` ignores `docs/`.
- T-057-s2 leaves an unpinned behaviour change in C-13 that moves
  against T-056's direction; it is T-072's third criterion.

**Answered by this merge, and left in place rather than edited out:**

- *"Should `docs/CONVENTIONS.md` legend the token lint's exit codes?"* —
  **YES, and it now has its SECOND ROW.** T-078 wrote the legend and
  promised the row; T-080 built the behaviour and could not reach the
  file; this integrator wrote it, because that is what keeps the docs
  true at the checkpoint. All four codes are legended, the AUTHORITY is
  named as the frozen `EXIT` object rather than restated, the pre-T-080
  collapse is kept as history, and `T-080-s4`'s residual hole is named.
- *"Is `T-058-s1` — nothing pins either corpus count — still open?"* —
  **CLOSED, and closed at the right rung.** Nothing pins the COUNTS and
  nothing should; what T-080 pins is the POLICY, in three rungs, so a
  deny-list addition now fails against something that did not move with
  it. Measured here at the merge: `.rs` alone drops CONTROL 542 → 498
  with the lint still green at exit 0 and the selftest red three ways.
