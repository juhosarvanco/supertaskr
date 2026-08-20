# State

Updated: 2026-08-20 by claude-opus-5 @T-084-integrate (T-084 merged and
checkpointed).

## Just completed

**T-084 — `docs/` is a code input, and the repo now has a THIRD standing
gate whose reader set is derived from the tree.** F-06, milestone 4, size
M, `touches: [docs/CONVENTIONS.md, tools/e2e]`. Built by `claude-opus-5
@T-084`, **re-built after a rejection by `claude-opus-5 @T-084-fix`**,
verified by `claude-opus-5 @T-084-verify` and re-verified
`@T-084-verify2`; `review: same-model`. **The first verdict was a
REJECTION and both verdicts are in the card.** Approved branch tip
**`c11bbd7`**; merge **`e8c4ab7`**. The card was at `status: verifying`;
the integrator stamped **`done`** at this checkpoint, the **tenth** card
running.

**FIFTEEN PATHS, FIVE OF THEM CODE, TEN UNDER `docs/`.** Re-derived
here: `M` `docs/CONVENTIONS.md` (+131), `M` the card (+1463), `A` eight
findings `T-084-s1`…`s8`, `A` `tools/e2e/scripts/docs-gate.mjs` (+212)
and `docs-scan.mjs` (+1752), `M` `token-scan.mjs` (10/4, two symbols
gained `export`), `A` `tools/e2e/tests/docs-input-gate.spec.ts` (+560),
`M` `tools/e2e/tsconfig.json`. 4473 insertions, 10 deletions. Suffix
census: **10 md, 3 mjs, 1 ts, 1 json**.

**THE BRIEF SAID FOURTEEN AND THE TREE SAYS FIFTEEN, and this is the
T-081 lesson recurring one card later, on the same side.** The
coordinator's 14/14/49 is the verifier's measurement at `fda5c92`; the
APPROVED tip is `c11bbd7`, the verdict commit, and `git diff
--name-status fda5c92..c11bbd7` shows it MODIFIES the card and ADDS
`T-084-s8`. So the brief's figures were measured one commit before the
tip it names as approved. **A count with no ref goes stale from the
RIGHT-hand side**, exactly as T-081's checkpoint wrote down — and the
new path is the finding the verifier filed while writing that verdict.

**WHAT LANDED.** Both standing gate triggers exclude `docs/` by
construction — GRAPH REGEN fires on `*.ts/*.tsx/*.js/*.jsx` OUTSIDE
docs/, BOOT GATE on `app/src/**`, `app/src-tauri/**` or a manifest — so a
commit whose whole diff is markdown matches NEITHER and has redded a
suite twice (`9c64cd8`, two backtick-opening card titles; `fede266`, a
`status:` outside the parser's vocabulary, which took `npm test` from
app/ to 830 of 831 on a one-markdown-file commit). Both were found three
layers from the cause by somebody who was not looking. The DOCS GATE is
now a bullet in `docs/CONVENTIONS.md`, a hand-run command
(`node tools/e2e/scripts/docs-gate.mjs <changed path>...` from the repo
root, fed the RANGE RULE's own path list), and an ENFORCING copy that
runs inside the lane today — `tools/e2e/tests/docs-input-gate.spec.ts`,
30 bodies. **The trigger is wide and the ANSWER is narrow**, per path,
each naming the reader files. The reader set is DERIVED, never listed:
`docs-scan.mjs` finds every tracked source file that resolves a docs path
against this repository's root, by a SITE arm (first literal segment is
`docs` AND the base evaluates to the repo root — both halves
load-bearing) or a CALL arm (a call that hands the root to a first-party
function which spends it on a docs path). The gate reads the task-status
vocabulary out of `lib/parser/src/types.ts` rather than restating it, so
this tree has exactly ONE status vocabulary (T-057).

## The rejection is the substance of this card — and it is not fully closed

**BLOCKING 1 was that the gate NAMED A GREEN SUITE while another
redded.** With the literal arm alone, a one-line edit to
`docs/ROADMAP.md` owed `npm test` from tools/e2e (114/114, exit 0) while
`npx vitest run` from lib/parser went 262/263 at exit 1 —
`smoke.test.ts` spells no docs path at all, it calls
`parseProject(repoRoot)`. The CALL arm closed it and did not over-owe
(the callee is not credited; `parseProject(fixture(...))` is not
credited; the arm discriminates on the ARGUMENT). Readers went 9 → 11
with no list edited. BLOCKING 2 made the tripwire's anchor arm follow
imports the way the site arm already did. BLOCKING 3 removed a wrong
digit rather than correcting it — CONVENTIONS carries NO count and points
at `docs-gate.mjs --census`.

**BUT THE SHAPE SURVIVES, AND I MEASURED IT AT THE MERGE.** See the s8
section below: a one-field edit to
`docs/research/captures/real-planner-turn-2026-08-19.jsonl` makes the
gate owe exactly `npm test from tools/e2e/`, that suite runs **121/121 at
exit 0**, and bare `cargo test` goes **351/1/3 at exit 101**. BLOCKING
1's own sentence, on a fifth prefix, against the APPROVED tip.

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 7f2f873 c11bbd7  -> tree d3299f6a…, exit 0
    git diff --name-only 7f2f873 <TREE>                        -> 15   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 7f2f873...c11bbd7   (THREE dots)      -> 15   cmp against the forecast: exit 0
    git diff --name-only e83ee1d..c11bbd7    (TWO, branch-only)-> 15   cmp against the forecast: exit 0
    git diff --name-only 7f2f873..c11bbd7    (TWO dots)        -> 50   THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only 7f2f873..e8c4ab7    (TWO dots)        -> 15   THE MERGE'S DIFF, the only one that means anything
    git diff --name-only 7f2f873...e8c4ab7   (THREE dots)      -> 15   collapses onto the line above, cmp exit 0
    git diff --name-only e83ee1d..e8c4ab7    (TWO dots)        -> 50   the naive at-merge range

`git merge-base --is-ancestor 7f2f873 e8c4ab7` exits **0**, so at the
merge two dots and three dots COLLAPSE. Merge-base **`e83ee1d`**; main
advanced **35** paths from it, the branch **15**, `comm -12` over the
sorted lists is **EMPTY**, and 35 + 15 = 50 — which is exactly the
forbidden count, and that arithmetic is the check that the two sets are
disjoint.

**THE FORECAST WAS EXACT UNDER BOTH METRICS, AND IN THE STRONGEST FORM
AVAILABLE.** `git merge-tree --write-tree` returned tree
**`d3299f6af539e020cbf54e4c938f0cf1e20c0056`** at exit 0, read from `$?`
and not swallowed by a command substitution — and **the no-ff merge's own
`HEAD^{tree}` IS that tree, byte for byte**, with parents `7f2f873` and
`c11bbd7` and nothing else. `cmp` of the whole patch against the merge's
later diff: exit 0. Another data point in `merge-tree`'s column under
both metrics.

The staged set at `git merge --no-commit` was the fifteen paths and
nothing more, `cmp`-ed against the forecast list at exit 0, zero
untracked and zero unstaged. The approved worktree was clean at
`c11bbd7`. **NOTHING WAS WRITTEN INTO THE MERGE COMMIT** (`T-083-s4`);
every integrator edit is in this checkpoint.

## THREE gates now — and this merge FLIPS one

| gate | prescribed `7f2f873..e8c4ab7` (TWO dots) | naive `e83ee1d..e8c4ab7` (TWO dots) |
|---|---|---|
| BOOT GATE (`app/src-tauri/**`, `app/src/**`, either manifest) | **0 — NOT OWED** | 5 — fires |
| GRAPH REGEN (`*.ts/*.tsx/*.js/*.jsx` outside docs/) | **1 — FIRES** | 14 — fires |
| DOCS GATE (a `docs/` path a code suite reads) | **10 — FIRES**, four suites | 32 — fires |

**THIS IS A FLIP, AND IT IS THE COMPLEMENT OF T-081's MERGE.** There the
naive and prescribed derivations agreed because main's advance was
entirely `docs/`; here main advanced 35 paths of which **13 are code**
(five `app/src/**`, eight `app/test/**`), so the naive range hands this
docs+tools lane five `app/src` files it never opened and manufactures a
BOOT CHECK — a window opening on the human's machine for a merge that
touches no shell. **BOOT GATE was NOT run, and that is the derivation
being obeyed rather than a gate being skipped.** GRAPH REGEN's single
matching path is `tools/e2e/tests/docs-input-gate.spec.ts`; `.mjs` is
genuinely absent from the trigger, read off the bullet rather than
remembered, so the three `.mjs` files that are the substance of this
change do not match it.

**GRAPH REGEN — OWED, RUN, AND A PROVEN NO-OP.** `index --check --root
../..` from app/src-tauri exits **0** BEFORE the regen — *graph.json is
CURRENT … 585305 bytes, 119 files, 1018 symbols, 1539 edges*.
`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph --
--ignored` exits **0** and moves **ZERO paths** (`git status --porcelain`
empty), and `index --check` exits **0** again after. **The regen did NOT
need to run twice this time, and the reason is derivable rather than
lucky**: `.nputerignore` excludes `docs/` and `tools/`, so **NONE of the
fifteen paths is indexable** — a `grep` of the merge's own list for
`.ts/.tsx/.mts/.cts/.js/.jsx` outside `docs/` and `tools/` returns
nothing. This is the third worked example of the trigger being
deliberately wider than the walk (T-054, T-058, now T-084), and the
checkpoint's own edits are all `docs/**`, which is unindexed too.

**THE THREE-FIXTURE RULE DOES NOT FIRE.** Derived, not assumed: the
branch adds no indexed file (zero indexable paths above), so
`fileComponent.size` cannot move; `git diff 7f2f873..e8c4ab7 --
docs/architecture/components/` is a 0-file diff, so T-024-s5's parser pin
holds; and `index --check` exiting 0 at the merge is the gate itself
saying no indexed file moved. Zero assertions move in any of the three.

**DOCS GATE — RUN, ON THIS MERGE'S OWN PATH LIST, AND IT IS THE FIRST
STANDING USE OF THE GATE THIS MERGE CREATES.** `node
tools/e2e/scripts/docs-gate.mjs $(git diff --name-only 7f2f873..e8c4ab7)`
exits **1** and owes **all four suites** — `cargo test from
app/src-tauri/`, `npm test from app/`, `npm test from tools/e2e/`, `npx
vitest run from lib/parser/`. All four were run and all four are green
(below). It reports **11 derived docs readers across 4 suites** and **0
frontmatter issues in the live tree**, and its census reproduces
BLOCKING 3's answer at MY ref: *117 docs-shaped sites in 22 files, 11 of
them in 9 files root-anchored; 24 files hold the repository root (11
derived, 0 unlinked, 13 with no docs site this scan can link)*.
Proportionality holds here too: `docs/rooms/first-user.md` owes **1**
command, `docs/CONVENTIONS.md` **2** (cargo + e2e, not the app suite), a
flat task card **3**. **All four exit codes reproduce at this ref** — 0
(a code-only path, and `--census`), 1 (a docs path with a reader), 2 (an
EMPTY path list, and an unknown flag), 3 (see the drill).

**AND THE CHECKPOINT COMMIT IS ITSELF SUBJECT TO IT**, which is a new
obligation this merge creates for its own next step: this commit's diff
is entirely `docs/**`, so the gate fires on it and the owed suites were
re-run AFTER the doc edits, not only after the merge.

## THE FINDING THAT LANDS ON THIS MERGE — `T-084-s8`'s premise is false

**`T-084-s8` says the escaping shape is "absent from the tree today", and
the second verdict declined to reject on exactly that premise ("Zero
instances … so the ledger's 24 and its residual 6 are CORRECT at this
ref"). THE TREE SAYS ONE.** At `app/src-tauri/tests/agent_runner.rs:1761`:

    let capture = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../docs/research/captures/real-planner-turn-2026-08-19.jsonl");

`the_tool_denied_fixture_is_a_transcription_not_a_construction` is a
plain `#[test]`, NOT `#[ignore]`d; it reads this repository's live
capture on every bare `cargo test` and compares five fields of it against
the fake agent's output. Its own doc comment says so: *"This adds a THIRD
live reader outside CONVENTIONS' four walks."* It holds no repository
root, its docs path opens with `..`, and it appears in NONE of the
derived readers, the census or the unlinked report.

**WHY THE PROBE MISSED IT IS THE SHARPER HALF, AND IT IS THE SAME SHAPE
TWICE ON ONE CARD.** The verdict searched for `resolve("../` and
`resolve('../` — the JavaScript spelling — while this tree writes the
Rust one. One section earlier that same verdict had confessed the
identical error about `perf.rs`: *"my sweep read `ctx.bindings` only"*, a
probe narrower than the claim it supported. Twice, in opposite
spellings.

**MEASURED, one-sided, at the merge commit, mutated text read back before
anything ran, substitution count 2:** mutating `tool_use_id` in that
capture leaves `docs-gate.mjs` owing exactly `npm test from tools/e2e/`
at exit 1; that suite runs **121/121, E2E_EXIT=0**; and `cargo test
--no-fail-fast` goes **351 passed / 1 failed / 3 ignored, exit 101**,
red by name. Restored by byte copy from `git show e8c4ab7:<path>`, proved
by an empty per-path `git diff` and sha256 back to `273a3d33…`, with
`cargo test` back to 352/0/3 at exit 0. **The restore was PER-PATH and
never `git checkout --`**, because the working tree carried this
checkpoint's own uncommitted edits (`T-072-s1`).

**AND A LIVE COMMENT IN THE MERGED TREE IS KNOWN FALSE, SAID HERE
PLAINLY BECAUSE THIS REPOSITORY HAS WATCHED THAT KIND OF SENTENCE GO
STALE THREE TIMES THIS WEEK.** `ROOT_ANCHOR_LEDGER`'s doc comment in
`tools/e2e/scripts/docs-scan.mjs` reads *"A file that holds this
repository's root is the only kind of file that CAN read this
repository's docs/."* That is a universal, the verifier falsified it with
two planted files, and the tree now falsifies it with a real one. **It
was NOT edited here** — `s8` carries both arms, the code arm is the one
that closes the silence, and discharging a finding is triage's call, not
this role's (which is this merge's own ratified ruling). `s8` keeps
`status: suggested` and gains a dated integrator section carrying the
live instance, the measurement and two re-derived figures: the
package-dir form in `app/test` is **21 hits across 9 files** at this ref,
not nine across five, and the escaping shape is **1**, not 0.

**`T-084-s7` IS LEFT AS RULED.** The root-anchor ledger lives in
`tools/e2e` while four of six entries argue about `app/src-tauri`, so a
lane fenced elsewhere can red it and be unable to fix it in fence. Option
1 refused (it puts a code input under `docs/`, which this gate would then
own recursively), option 2 refused (it breaks the PATHS-not-a-range
invariant that makes the gate trustworthy), option 3 taken for now at
24/6 — re-weigh if `s2` is ever fixed. Unchanged by this role.

## Suites, every number derived at this checkpoint, exits read unpiped

Each command's own `$?` was echoed immediately. **No exit code here was
taken through a pipe** — `${PIPESTATUS[0]}` is empty in zsh, and
`node … | xargs` would map an exit 1 to 123, which is why the DOCS GATE
was fed `$(cat <list>)` rather than piped.

- **parser: 263/263 across 12 files**, `PARSER_EXIT=0`; `npx tsc
  --noEmit` `PARSER_TSC_EXIT=0`; `npm run build` `PARSER_BUILD_EXIT=0`
  FIRST, because the app build dies at TS2307 without `lib/parser/dist`.
  Its smoke test parses this repo's live `docs/` tree and requires zero
  issues over eight new flat `docs/tasks/T-084-s*.md`.
- **app: 840/840 across 43 files**, `APP_TEST_EXIT=0`; `npm run build`
  `APP_BUILD_EXIT=0`, **265 modules transformed**, emitting
  `index-kNOKiTKD.js` **502.75 kB** and `index-CwYF5FQb.css` **43.95
  kB**. **Neither hash is this merge's doing**: the merge changes no
  `app/**` path at all, so `app/dist` is a function of `7f2f873` alone.
- **bare Rust workspace, `cargo test --no-fail-fast`: 352 passed / 0
  failed / 3 ignored**, `CARGO_TEST_EXIT=0`, summed programmatically from
  **fifteen** `test result:` lines. Not `--all-targets`, which skips
  doc-tests.
- **E2E: 121/121**, `E2E_EXIT=0`, one worker, zero retries, zero skips,
  on scratch port **14821**; `npm run typecheck`
  `E2E_TYPECHECK_EXIT=0`. **30 of the 121 are
  `docs-input-gate.spec.ts`**, the gate's enforcing copy.
- **token lint: `LINT_SELFTEST_EXIT=0`, `LINT_TOKENS_EXIT=0`** —
  `lint-tokens: clean (TOKEN 123 files under app/src, app/test,
  tools/e2e; CONTROL 590 tracked text files)`, selftest at 49 TOKEN + 4
  CONTROL samples, **71** walk-policy checks, 8 evidence-floor checks.
  This is also the repo's only NUL-byte gate (P5, over raw bytes) and it
  is green; the merge's fifteen paths were independently read as bytes
  and **0 carry a NUL**.
- **`cargo audit -n`** (no fetch) `CARGO_AUDIT_EXIT=0`: 472 locked
  crates, **0 vulnerabilities / 17 allowed warnings** — 16
  `unmaintained` + 1 `unsound`, counted by anchored line match, unmoved,
  which a 0-file `Cargo.lock` diff requires.
- **`index --check`** exit **0** before AND after the regen.
- **DOCS GATE** exit **1**, owing four suites — all four above.
- **BOOT GATE not owed** at 0 of 15 paths. Not run, and this sentence is
  the record of the derivation rather than the silence.
- **CONVENTIONS' two live readers, both exercised**: `workflow-parity`
  14/14 inside the 121, and
  `snapshot_version_matches_the_live_method_stamps` in
  `app/src-tauri/src/agent/kit.rs` ok inside the `cargo test` above.
  **There is a THIRD**, and the DOCS GATE is what makes it findable:
  `docs-input-gate.spec.ts` reads `docs/CONVENTIONS.md` through
  `conventionsText()`, derived by the CALL arm.

**CONTROL AND TOKEN CLOSE ARITHMETICALLY FROM THREE DIRECTIONS, EVERY
NUMBER AT ITS OWN REF, ALL DERIVED FROM `git ls-tree`** (tracked − files
under a `SKIP_DIRS` component − files with a `CONTROL_BINARY_EXTENSIONS`
suffix, both sets read out of `token-scan.mjs`; the SKIP set matches
nothing tracked and the binary set matches 18 at every ref below):

| ref | tracked | CONTROL | TOKEN |
|---|---|---|---|
| `e83ee1d` merge-base | 581 | **563** | 119 |
| `7f2f873` main-before | 597 | **579** | 120 |
| `c11bbd7` approved tip | 592 | **574** | 122 |
| `e8c4ab7` the merge | 608 | **590**, and the lint prints 590 | 123 |

Main added 16 files, the branch added 11 (eight findings plus three under
`tools/e2e`), neither deleted any: 563 + 16 = 579, 563 + 11 = 574,
579 + 11 = 574 + 16 = 563 + 27 = **590**. TOKEN: 119 + 1 + 3 = **123**.
**The brief's 574 reproduces exactly — at `c11bbd7`, and nowhere else**,
which is the whole point of naming the ref.

## The poison drill — three mutants at the MERGED commit, one-sided

**Correspondence established by hash before anything was mutated**:
`git show e8c4ab7:tools/e2e/scripts/docs-scan.mjs` and the working file
are both sha256 **`965354bcbcc7da2b067f7891f922cac235102184865f665d82d4d439920e97d8`**;
`docs-input-gate.spec.ts` likewise at `cb15478c…`. HEAD **is** the merge
commit, so the drilled artifact is the merged artifact by construction.
Every mutation moved the PRODUCER and never an assertion, every mutated
TEXT was read back with `git diff` before a suite ran, and every restore
was a byte copy from `git show e8c4ab7:<path>` proved twice (empty
per-path `git diff`, sha256 back).

- **M1 — the traced CALL arm disabled** (`callSites` returns empty), which
  is precisely the state the rejection was written against.
  **`M1_LANE_EXIT=1`, 4 failed / 26 passed**, and it reproduces the
  rejection's symptom exactly: `docs-gate.mjs docs/ROADMAP.md` drops
  `npx vitest run from lib/parser/` from its answer, and the census falls
  from 11 derived readers to 9.
- **M2 — the argument discriminator removed** (`evalBase(expr, where)
  !== root` short-circuited). **`M2_LANE_EXIT=1`, 6 failed / 24
  passed**, red at *the CALLEE is not a reader*, *a docs path off a root
  that is NOT the repo root is not a reader* and *the answer is
  PROPORTIONAL* — so the arm is pinned in BOTH directions, not merely
  against under-owing. `--census` itself exits **1** under M2.
- **M3 — the vocabulary declaration renamed** in
  `lib/parser/src/types.ts`. Gate exits **3**, *GATE COULD NOT RUN … a
  moved declaration is a gate that could not run, never an empty
  vocabulary that accepts anything* — the fourth exit code, demonstrated
  rather than quoted.
- **M4 is the `s8` measurement above** and is the one that did NOT
  behave: it reds a suite the gate does not name.

Working tree `git status --porcelain` was verified empty at every
plant/restore boundary except for this checkpoint's own two edits, which
is why every restore was per-path.

## Security sweep — zero movement, every figure re-derived

The merge's diff contains **no lockfile, no `Cargo.toml`, no
`package.json`, no `tauri.conf.json`, no capability file and no
`.entitlements`** — 0 paths matched any of them, and `git diff
7f2f873..e8c4ab7 -- '*Cargo.toml' '*package.json'` is **0 lines**. No
dependency added.

- `app/src-tauri/src/acl_pin.rs` is a **0-file diff across the merge**,
  sha256
  `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`.
  `EXPECTED_GRANTS`: declaration line **54**, closing `];` line **147**,
  entries 55–146 = **92**, with **ZERO** comment or blank — counted four
  independent ways over the symbol-anchored body (92 quote-bearing
  lines, 92 quoted strings, 92 UNIQUE quoted strings, 92 lines matching
  the strict entry shape). **Name the symbol and stop.**
- `ENV_ALLOWLIST` in `app/src-tauri/src/agent/runner.rs`: **16
  entries**, declaration at line **1000** — and `runner.rs` is a 0-file
  diff across this merge, so the number that moved last time is the LINE
  and not the set. Anchor on the symbol, never on a line number. The
  three-entry `ENV_ALLOWLIST_LINUX` is a separate symbol and is not in
  the count.
- **Exactly THREE `#[ignore]` ATTRIBUTES**, anchored on
  `^[[:space:]]*#\[ignore` with pathspec `'*.rs'` from the repo ROOT:
  `crates/nputer-index/tests/perf.rs:53`,
  `crates/nputer-index/tests/self_graph.rs:58`,
  `tests/agent_runner.rs:3767` — all three carrying `= "reason"`. The
  closed literal `#[ignore]` matches **8 lines in 5 files and every one
  is prose** (seven doc comments and one `//`), so the naive count is
  **disjoint** from the truth rather than merely inflated.
- **IPC is THIRTEEN at both ends**: 13 anchored `#[tauri::command]`
  attributes and 13 `generate_handler!` entries. **Two census traps, one
  at each end**: the unanchored literal `tauri::command` reads **14**
  (the fourteenth is a doc comment), and a naive comma-split of the
  handler block reads **15**, because two COMMENTS inside the macro
  contain commas. Strip comments, then count.
- No secret-shaped content: all **4473** added lines scanned for
  `sk-`/`AKIA`/PEM/bearer/`key|secret|password|token` assignment shapes
  — **0 hits**. **TWO new process surfaces, named rather than denied**:
  `execFileSync` in `docs-scan.mjs` (`git ls-files -z`, the same corpus
  derivation `token-scan.mjs` already does) and in
  `docs-input-gate.spec.ts` (`node tools/e2e/scripts/docs-gate.mjs …`).
  Both are argv arrays with no shell and no interpolated input; neither
  is an IPC command or a grant.

## What ACTUALLY reached the human's running app — AND THIS TIME NOTHING RESTARTED

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and with
nothing else, before and after.** No bind, no connect, no signal, on any
interface. Holder `node` pid **82549**, one socket, `TCP [::1]:1420
(LISTEN)`, identical at both ends.

1. **THEIR APP PROCESS IS UNCHANGED — pid 85379, vite 82549, and the
   whole supervisor chain (82342 → 82364 → 82504 → 82549) up since Aug 18
   03:45:46**, identical before and after. **This is the contrast T-081's
   checkpoint asked the next integrator to expect**: that merge wrote
   four `.rs` files into a tree a live `tauri dev` was watching and
   restarted the human's window. This merge touches **no `app/src-tauri/**`
   and no `app/src/**` path at all**, so the watcher had nothing to
   rebuild. The rule generalises cleanly: it is the BOOT GATE's own
   trigger set that predicts whether the human's window survives an
   integration.
2. **`app/src-tauri/target/debug/nputer` WAS relinked** by `cargo test`
   and by the regen, three times. A file on disk cannot reach a loaded
   process, so pid 85379 is unaffected; the next `tauri dev` rebuild
   overwrites it anyway. `T-083`'s correction to `cb3aa31` holding a
   fourth time: a shared target directory is written by any cargo
   invocation.
3. **The map pane sees the SAME graph.** `docs/architecture/graph.json`
   did not move — 119 files, 1018 symbols, 1539 edges, unchanged by both
   the merge and the regen.
4. **Docs-watcher snapshots.** T-084 now shows `done`, **eight** new
   `T-084-s*` cards appeared, and CONVENTIONS.md, ARCHITECTURE.md and
   STATE.md moved. Their suggestion column goes from seventy-three to
   **eighty-one**.
5. **`app/dist` was rewritten** by the pre-suite build. The dev server
   does not serve `dist` and no module in its graph imports it; the merge
   moved no bundle input, so the bytes are `7f2f873`'s.
6. **The lane writes into seven tracked files and restores them**
   (`T-084-s4`). `git status --porcelain` was empty immediately before
   and immediately after the first full lane run, and at the end of all
   five lane invocations the working tree carried this checkpoint's own
   edits and nothing else — so all seven round-tripped every time.

**No process from this integration survives.** Census by `ps -Ao
pid,ppid,command` at the end: zero `vitest`, zero `playwright` or
`chromium`, zero `cargo` or `rustc`, no stray `tauri dev` beyond the
human's own 82342/82364, no orphaned shell. Scratch port **14821** was
bind-probed free on all four stacks (`127.0.0.1`, `0.0.0.0`, `::1`, `::`)
before use — an IPv4-only probe of a v6 listener reports free, which is
why all four. **No `pkill` was used at any point.** The T-084 worktree is
removed. The two `nputer-T-060` `fake_agent` orphans (`52504`/`52505`,
ppid 1, started Aug 18 16:21:18) are unchanged before and after and
deliberately left alone — `T-043-s1`.

**THE SCRATCH DIRECTORY IS NOT PRIVATE, NINTH OBSERVATION.** Every file
this session wrote there was prefixed `T084-integ-`. Prefix or lose it.

## Findings and corrections from this integration

- **The dispatch brief's range figures were a commit stale** (14/14/49
  against 15/15/50) and its `s8` premise was inherited from a verdict
  that measured it with the wrong spelling. Both are the same failure —
  a figure quoted without its ref, and a probe narrower than its claim —
  and both were caught by re-deriving rather than reading. The brief said
  to trust the tree over it; the tree disagreed with it twice.
- **`docs-gate.mjs` must not be fed through `xargs` when you intend to
  read its exit code.** BSD `xargs` maps a utility exit of 1–125 to
  **123**, so the gate's four-code contract survives the pipe only by
  accident. CONVENTIONS' RUN IT clause describes an `xargs` invocation
  (for the empty-list trap `T-084-s6` closes); the SAFE spelling for a
  hand run is `node … $(cat <list>)` with `$?` read immediately.
- **ROADMAP was NOT ticked**, and the discriminator is unchanged: does it
  change what a USER can do or see? T-084 answers no — it is a gate, and
  no screen moves. `grep` for `T-084` in `docs/ROADMAP.md` returns
  nothing at all. **The milestone-4 stale-ids note still lists T-081,
  T-082 and T-083 and still omits T-084**, now a DONE card; this is the
  THIRD checkpoint to notice and leave it, on the same reasoning each
  time (T-084 landed on main at `073f136`, before any of these merges, so
  no merge makes that sentence newly false). Three passes is enough that
  the next triage should either fix the note or accept that
  *"Re-derive the maximum id before writing"* on the following line is
  the whole protection.
- **ARCHITECTURE MOVED, and it had to.** The layout bullet's closing
  sentence was *"docs/ stays the brain"*; it is now the brain AND a code
  input, read by eleven bodies across all four packages, and the repo
  carries a third standing gate. The same bullet described `tools/e2e/`
  as *"dev tooling … it drives the app from outside over HTTP, imports
  neither package"* — still true of the LANE, and no longer a complete
  description of the directory, which now also hosts a static analyser
  that reads all four packages as text. Both clauses were amended in
  place rather than rewritten, and `.nputerignore`'s deliberate silence
  about docs/ is recorded there so "we decided" cannot be read as "we
  forgot".
- **No new ADR.** Nothing non-obvious was decided by this role; the two
  judgement calls (leaving `s8`'s comment unedited, amending ARCHITECTURE)
  are recorded above.

## The board, derived from disk at both ends

Main-before (`7f2f873`): **176 flat task files, 63 done / 21 planned / 19
parked / 73 suggested**; 63 + 21 + 19 + 73 = 176. At this checkpoint:
**184 flat task files, 64 done / 20 planned / 19 parked / 81
suggested**; 64 + 20 + 19 + 81 = 184. The deltas are exactly T-084
planned → done (the branch's `verifying` never reached main) and the
eight new suggestion files. Ten files sit in `docs/tasks/rejected/` and
are counted separately, as always.

## Provenance

T-084 is **built by `claude-opus-5` (two executor passes, `@T-084` then
`@T-084-fix`) and verified by `claude-opus-5`**, `review: same-model` —
the same model on both sides, honestly stamped, and **the first verdict
was a REJECTION that the second overturned on evidence the second
executor produced against it**. The `built_by:` field names both passes.

**64 done cards — 49 read `same-model`, 9 `self-verified`, 5
`independent`, and T-056 is a done card whose `review:` is EMPTY**;
49 + 9 + 5 + 1 = 64, so every done card carries the field. T-084 moves
`same-model` from 48 to 49. Unchanged otherwise by this merge; no card's
history was re-stamped.

**AN ELEVENTH DATA POINT ON WHO STAMPS `done`.** T-084's verifier left
`status: verifying` for the integrator, and the integrator stamped it at
the checkpoint — **ten of the last eleven**, with T-058's executor the
only outlier. The question is closed on the evidence; only the
writing-down into `method/` is left, and `T-078-s3` records why a
docs-fenced card cannot do it.

## Health of the tree

At this checkpoint main contains T-084's merge `e8c4ab7` plus this
checkpoint. Parser, app, Rust, E2E, token lint, the token lint's own
selftest, `cargo audit`, the graph-currentness gate and the NEW docs gate
are all green; two of the three merge-time gates fired, both were RUN,
the third was derived as NOT OWED and that derivation is recorded rather
than the silence. Nothing is broken.

**ONE KNOWN-FALSE SENTENCE IS LIVE IN THE MERGED TREE, DELIBERATELY**:
`ROOT_ANCHOR_LEDGER`'s doc comment in `tools/e2e/scripts/docs-scan.mjs`.
It is carried by `T-084-s8` with both arms and the measurement above.

## In progress / broken right now

**NO SIBLING LANE IS LIVE.** `git worktree list` shows only the main
checkout; `task/T-084-docs-gate` is kept as a branch and its worktree is
removed.

## Next up

1. **`T-084-s8` is now the sharpest card on the board, and it has a
   measured consequence rather than a hypothetical one.** Arm 2 (resolve
   the literal before judging it) closes a silence that reds
   `cargo test` today; arm 1 is a one-clause comment fix that should
   happen regardless. It should be triaged ahead of the rest of the
   T-084 findings.
2. **Triage the EIGHTY-ONE undispositioned suggestions.** The backlog
   grew by 8 with this merge and has grown by 27 since T-081's
   checkpoint; **the fifth triage is now the single largest thing on this
   board and is badly overdue.** Treat `T-076-s4`, `T-069-s3` and
   `T-073-s4`/`s5` as ONE item; `T-080-s7` and `T-080-s8` are one item
   too; `T-084-s3` and `T-084-s8` are the same mechanism from two
   directions and should be weighed together.
3. **`T-084-s2` — the DOCS GATE is not a CI step**, because the lane's
   fence could not reach `.github/workflows/ci.yml`. Until it is, the
   gate is a written ritual plus one enforcing spec, exactly as GRAPH
   REGEN was before T-054, and `T-084-s7`'s ledger multiplier only bites
   a lane that runs the e2e suite. Taking `s2` is what makes `s7` need
   re-weighing.
4. **`T-083-s2` remains sharp**, sized S–M with a working ninety-line
   prototype: the range rule is the most-consulted paragraph in
   CONVENTIONS and the least defended. **This checkpoint adds two
   candidates to its fixture set** — the `xargs`/123 exit-code mapping,
   and a right-hand-endpoint drift that moved a published forecast by one
   path for the second merge running.
5. **The poison taxonomy renumbering pass is overdue by THREE
   ordinals.** T-078 shipped FIVE and SIX; `T-078-s13` proposes EIGHT,
   `T-080-s7` proposes NINE, `T-083-s3` proposes another, and SEVEN — the
   mutant no body kills — still has four independent sightings and no
   owner.
6. **`T-069-s2` remains the cheapest real improvement on the board**:
   one arm, one fixture, one body. **`T-069-s1` is one line** and
   improves five bodies at once.
7. **T-070** is dispatchable on the fence T-043 released (`app-agent`,
   `blocked_by: []`); **T-065** (`blocked_by: [T-057, T-058]`) remains
   unblocked and undispatched; **T-067** and **T-068** still wait behind
   it. Every fence is free as of this merge.
