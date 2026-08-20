---
id: T-084
title: A docs-only change fires neither standing gate and can still red a suite — `docs/` is a code input and the triggers exclude it by construction
feature: F-06
milestone: 4
priority: 42
size: M
status: verifying
blocked_by: []
touches: [docs/CONVENTIONS.md, tools/e2e]
builder:
verifier: claude-opus-5
built_by: claude-opus-5 @T-084
verified_by: claude-opus-5 @T-084-verify
review: same-model
---

**Both standing gate triggers exclude `docs/` deliberately, and both
are right to. The gap is that nothing else covers it, so a class of
change exists that is gated by nothing and can break a suite.**

- **GRAPH REGEN** fires on `.ts/.tsx/.js/.jsx` **outside `docs/`**.
- **BOOT GATE** fires on `app/src/**`, `app/src-tauri/**` or either
  manifest.

A commit touching only `docs/tasks/*.md` matches neither. The integrator
correctly reports "docs-only, neither fires" and moves on. **But
`docs/` IS an input to the app suite**, measured:
`app/test/architecture-dogfood.test.ts:1020` does
`readdirSync(join(ROOT, "docs/tasks"))` and reads **every** card off the
real tree; `map-dogfood-render.test.tsx` does the same. These are
dogfood tests by design — the app is proved against the repository it
lives in — so this is not a mistake to undo.

## Two observed instances, neither predicted by the card that hit it

1. **2026-08-18 — a title beginning with a backtick.** A YAML reserved
   indicator made two cards unparseable. Nothing errored: the board
   simply got shorter, and it surfaced three layers away as
   `Expected "60" / Received "62"` in four scroll-containment bodies.
2. **2026-08-19 — `status: closed`.** T-081's verifier filed
   `T-081-s7` with a status outside the parser's eight-name vocabulary
   (`suggested | planned | building | verifying | rejected | merging |
   done | parked`) — the only such value in the tree. `npm test` went
   **830/831, exit 1** on a commit whose entire diff was one markdown
   file. It was discovered by the NEXT executor, not by the verifier
   who wrote it, because a verdict measures the suites at the commit
   under review and then commits without re-measuring (`T-081-s9`).

**Both were found by accident, three layers from the cause, by someone
who was not looking for them.** That is the argument for this card: the
failure mode is not that the suite goes red, it is that the red arrives
detached from the edit and gets attributed to whatever lane is nearest.

## Acceptance criteria

- THE gate trigger set SHALL gain a rule covering the case, and the
  rule SHALL be derived from **what the suites actually read**, not
  from a suffix list. A trigger that says "any `docs/**`" over-fires on
  every checkpoint and will be ignored within a week; a trigger that
  names `docs/tasks/**` and `docs/architecture/**` is narrow and
  derivable. **The card SHALL state which it chose and why**, and SHALL
  enumerate the real-tree readers rather than assuming the two named
  here are all of them.
- **THE ENUMERATION SHALL BE MECHANICAL, NOT A LIST IN PROSE.** A
  hand-written list of dogfood readers is the defect T-058 and T-080
  spent two cards on. Derive the set from the tree — a reader is any
  body that resolves a path under `docs/` against the repository root
  rather than a fixture directory — and pin the derivation so a new
  dogfood reader added later is covered without anyone remembering.
- IF the rule fires THEN the remedy SHALL be stated as a command, not
  as "run the suites" — the integrator needs to know *which* suite
  answers this, and the answer today is `npm test` from `app/`, not the
  parser suite and not e2e.
- **A CARD WITH AN ILLEGAL `status:` SHALL FAIL LOUDLY AND NAME THE
  FILE.** Today it surfaces as a count mismatch in a dogfood body,
  which names neither the card nor the field. The parser already emits
  typed issues with near-miss hints for `blocked_by`; the same
  treatment SHALL apply to `status:`, and a pin SHALL drive a card with
  `status: closed` specifically, since that is the value that occurred.
- **THE PARSER'S VOCABULARY QUESTION SHALL BE ANSWERED, NOT DODGED.**
  `closed` was written by a verifier who wanted to record that a
  finding had been resolved elsewhere. The archive's existing moves are
  `Absorbs:` plus removal, `status: parked` with a trigger, or `git mv`
  to `rejected/`. Either `closed` is a real ninth status with a defined
  meaning, or the method SHALL say which existing move covers "resolved
  by other work" — and T-083's integrator has already ruled that
  disposition belongs to triage, which is evidence for the second arm.
  Do not add a status merely to make one file parse.
- IF a docs-only commit would red a suite THEN the trigger SHALL catch
  it **before** the merge, and a pin SHALL prove this by planting a
  card with an illegal status and requiring the trigger to fire on a
  diff containing no code file at all.
- THE existing `.nputerignore` behaviour SHALL be left alone and the
  card SHALL state why: the indexer ignoring `docs/` is correct and
  unrelated — `index --check` is not the gate that missed this.

Verification: headless — `npm test` from app/ with a planted illegal
card, `npx vitest run` from lib/parser for the typed issue and its
message, and the trigger derivation run against a synthetic docs-only
diff. Every new assertion poisoned and shown RED before restoration,
restorations proved by hash. **The mechanical enumeration SHALL be
poisoned by adding a dogfood reader and showing the derivation grows.**
@human: whether the new trigger's wording reads as narrow enough to be
obeyed.

## Implementation notes

Built by `claude-opus-5 @T-084`, worktree `../nputer-T-084`, branch
`task/T-084-docs-gate`, cut from main's tip `e83ee1d`.

**UNDERSTANDING, CONFIRMED BEFORE ANYTHING WAS TOUCHED.** `docs/` is an
input to this repository's code suites and both standing gate triggers
exclude it by construction, so a commit whose whole diff is markdown
under `docs/` fires neither GRAPH REGEN nor BOOT GATE and can still turn
a suite red — twice already, and both times the red was found three
layers from the cause by somebody who was not looking for it. My job was
to add a third standing gate whose reader set is DERIVED FROM THE TREE
rather than listed, to state its remedy as commands rather than as "run
the suites", to make an illegal `status:` fail loudly naming the file,
and to ANSWER the vocabulary question rather than add a ninth status to
make one file parse — all inside the fence
`[docs/CONVENTIONS.md, tools/e2e]`, leaving `.nputerignore` alone and
saying why.

### What landed

- **`tools/e2e/scripts/docs-scan.mjs`** — the derivation. Zero
  dependencies, no I/O at import, the contract `token-scan.mjs` keeps so
  this can move to CI's first step later without a rewrite.
- **`tools/e2e/scripts/docs-gate.mjs`** — the hand-run gate. Takes
  PATHS, never a range: a second opinion about which two commits "the
  diff" means is the failure THE RANGE RULE exists to prevent. Exit 0
  nothing owed, 1 the gate has a verdict, 2 called wrong, 3 could not
  run — the house contract.
- **`tools/e2e/tests/docs-input-gate.spec.ts`** — 23 bodies, no browser,
  inside `npm test` from tools/e2e which IS a CI step.
- **`docs/CONVENTIONS.md`** — the DOCS GATE bullet in Gotchas beside its
  two siblings, and the disposition ruling in the suggestion-triage
  bullet.
- **`tools/e2e/scripts/token-scan.mjs`** — `regexCanStart` and
  `regexEnd` gain `export`, and nothing else moves. See the poison drill:
  a second copy of that lexer is what a comment strip needs, and one
  implementation cannot disagree with itself.
- **`tools/e2e/tsconfig.json`** — `scripts/docs-scan.mjs` joins the
  `include` list beside `token-scan.mjs`.

### THE MECHANICAL DERIVATION, and why each half is load-bearing

A DOCS READER is a tracked source file containing a **DOCS SITE**: a
path-forming call whose **first literal segment is `docs`** AND whose
**base expression EVALUATES TO THE REPOSITORY ROOT**. Both halves, and
the tree is what proves neither is sufficient alone.

At `e83ee1d` the corpus holds **117 docs-shaped sites in 22 files**, and
exactly **twelve of them, in nine files, survive both halves**. A
hand-written list would not have been merely stale — it would have been
one twelfth of the truth, and the wrong twelfth.

- **`docs`-FIRST** keeps `tools/e2e/fixtures/shell.ts` out: it joins the
  REPO ROOT with a path ENDING in `docs`
  (`app/test/fixtures/genesis/streak/docs`), and its first segment is
  `app`, so it reads a fixture tree.
- **ROOT-EVALUATION** keeps `lib/parser/test/files.test.ts` out: its base
  is `fixture(name)`, computed from `import.meta.url`, so every
  "mentions import.meta.url" heuristic calls it a reader. It resolves to
  `lib/parser/test/fixtures/<name>`. **That is the card's own
  discriminator — "against the repository root rather than a fixture
  directory" — made executable instead of eyeballed.** It also keeps
  `lib/parser/src/project.ts` and `app/src-tauri/src/docs_watch.rs` out,
  correctly: both join `docs` onto a caller-supplied root, which is a
  USER's project, not this one.

`evalBase` is a small calculus over the six root-forming shapes the tree
uses (`ROOT_FORMS`), with a fixpoint over in-file bindings, one hop
through a relative import (`repoRoot` from `../preflight`) and one hop
through a Rust crate's own modules (`common::repo_root()` in
`nputer-index`'s `tests/common/mod.rs`).

**A file that does BOTH and cannot be linked is REPORTED, not dropped.**
`unlinkedFiles()` returns any file that has a root-anchored binding and a
docs site where no site's base resolved to the root; the spec asserts it
empty. Silence is the outcome this whole card is about.

### THE ENUMERATION — NINE READERS, FOUR SUITES

| reader | suite | prefixes |
|---|---|---|
| `app/src-tauri/crates/nputer-index/tests/arch.rs` | `cargo test` | docs/architecture/components |
| `app/src-tauri/src/agent/kit.rs` | `cargo test` | docs/CONVENTIONS.md |
| `app/test/architecture-dogfood.test.ts` | `npm test` from app/ | docs/tasks, docs/architecture/components |
| `app/test/map-dogfood-render.test.tsx` | `npm test` from app/ | docs/tasks, docs/architecture/components |
| `lib/parser/test/rejected-exclusion.test.ts` | `npx vitest run` | docs/tasks/rejected |
| `lib/parser/test/task.test.ts` | `npx vitest run` | docs/tasks |
| `tools/e2e/tests/shell-frame.spec.ts` | `npm test` from tools/e2e/ | docs |
| `tools/e2e/tests/window-contract.spec.ts` | `npm test` from tools/e2e/ | docs |
| `tools/e2e/tests/workflow-parity.spec.ts` | `npm test` from tools/e2e/ | docs/CONVENTIONS.md |

### WHICH TRIGGER I CHOSE, AND WHY IT IS NEITHER OF THE TWO OFFERED

The card offers "any `docs/**`" (over-fires, ignored in a week) against
"`docs/tasks/**` and `docs/architecture/**`" (narrow and derivable) and
asks which. **The tree refuses both.** The narrow pair would miss
`docs/CONVENTIONS.md`, which the cargo suite reads on EVERY run and
`workflow-parity.spec.ts` parses; and the wide one is, as stated, a
trigger nobody obeys.

**What I built instead: the trigger is per-path and derived, and the
ANSWER is what is narrow.** On this tree every path under `docs/` does
reach a reader — `shell-frame.spec.ts` and `window-contract.spec.ts`
each walk the whole of it, graph and all — so narrowing the TRIGGER
would be a lie about the tree. The over-fire trap is escaped from the
other side:

- `docs/rooms/2026-08-20-x.md` owes **one** command.
- `docs/CONVENTIONS.md` owes **two**, and not the app suite.
- a flat `docs/tasks/T-*.md` owes **three**.

Each answer names the READER FILES that read that path, so the
integrator is told which body will move rather than handed a battery.
`docs-gate.mjs` prints it in about a second.

### THE VOCABULARY QUESTION, ANSWERED

**`closed` is not a ninth status, and "resolved by other work" is not a
fourth triage move. It is a DISPOSITION, and disposition belongs to
triage.** A finding whose work was resolved elsewhere KEEPS
`status: suggested` and records the discharge in its own body — a
`closed_by:` line naming the commit is the shape `T-081-s7` now uses —
and triage then promotes (`Absorbs:` plus removal), parks or rejects it.
Promotion is what "resolved by other work" already means once the
resolving task can name it.

The reasoning, in the order it actually decided the question:

1. **The archive already covers it.** `T-081-s7` was closed on arrival by
   main moving under it, and the fix its own second executor applied was
   exactly this: `suggested` plus `closed_by:` plus a body note. The
   move existed before the question was asked.
2. **T-083's integrator ruled it and T-081's applied it** — *"discharging
   a finding is not the integrator's call to record as promoted, parked
   or rejected"* — and `T-081-s9` was left at `suggested` for that
   reason at the merge that deferred this remedy here.
3. **A status is a METHOD change, not a parse fix.** The vocabulary is
   ratified in `method/tasks/TASK-FORMAT.md` and lives in exactly one
   place in code, `lib/parser/src/types.ts`. Adding one honestly is a
   version bump whose third file is Rust (T-078-s3) — so this card's
   fence could not have added a status even had the answer gone the
   other way, which is the fence encoding the rule rather than a
   coincidence.
4. **`closed` is not a typo for anything.** Its near-miss set against the
   eight is EMPTY at edit distance 2, so a spelling hint would say
   nothing. What the writer needs is the move, so the gate prints the
   ruling instead — at the point of failure, which is where it will be
   read.

The ruling lives in ONE enforced place (`DISPOSITION_RULING` in
`docs-scan.mjs`, pinned by the spec) and one prose place (CONVENTIONS'
suggestion-triage bullet, which already enumerates the three moves).
`method/tasks/TASK-FORMAT.md` should carry it too and is out of fence —
`T-084-s5`.

**The gate does not restate the vocabulary.** `taskStatuses()` READS
`TASK_STATUSES` out of `lib/parser/src/types.ts` and throws if the
declaration has moved, so this tree has exactly one status vocabulary and
a ninth added there is honoured with no edit here (T-057, and the reason
T-081's integrator deferred this remedy to a single owner).

### THE POISON DRILL — eight mutants, one-sided, every mutated TEXT read back

Every mutation moved the PRODUCER, never an assertion; every substitution
count was asserted (`assert n==1`, and one attempt that reported **0**
was caught by that assert before it could pass as a green); every mutated
text was read back out of the file before the suite ran; and every
restoration is proved by sha256 against the pre-mutation hash.

| # | mutation | result |
|---|---|---|
| **M1** | **ADD A READER** — two new tracked files, `app/test/t084-poison-reader.ts` (root by `dirname(fileURLToPath(...))` + `resolve(here,"..","..")`) and `app/src-tauri/src/t084_poison_reader.rs` (root by `CARGO_MANIFEST_DIR` + two `.parent()`), neither spelling used by any existing reader | **the derivation grew 9 -> 11 with no list edited**, classified `npm test from app/` reading docs/rooms and `cargo test from app/src-tauri/` reading docs/ROADMAP.md; `docs/rooms/x.md` went from one command to two; **22 passed / 1 failed**, RED: *the answer is PROPORTIONAL* |
| **M2** | `docs`-first anchor relaxed to `[a-z]+` in `JS_SITE` | **19 / 4**, RED includes *a repo-root join whose first segment is not `docs` is not a reader* |
| **M3** | `evalBase(site.base, ctx) !== root` guard removed in `docsReaders` | **21 / 2**, RED includes *a docs path off a root that is NOT the repo root is not a reader* |
| **M4** | `taskStatuses()` returns the eight plus `closed` | **20 / 3**, RED includes *`status: closed` fails loudly...* and *the status vocabulary is READ from the parser* |
| **M5** | one backticked command removed from CONVENTIONS' DOCS GATE bullet | **22 / 1**, RED: *the DOCS GATE bullet names exactly the commands the derivation produces* |
| **M6** | **a planted file with a root anchor and an UNEVALUABLE base** (`join(somewhereElse(), "docs", "tasks")`) | **THE ASSERTION WAS VACUOUS AND THE DRILL FOUND IT — see below** |
| **M7** | `covers()` returns true | **21 / 2**, RED includes *the answer is PROPORTIONAL* and *a path names the readers that read it* |
| **M8** | `isTaskCardPath` widened to match nested paths | **22 / 1**, RED: *a legal card reports nothing, and a path the parser does not collect is not judged* |

**M6 IS THE ONE WORTH READING.** *"Nothing forms a repo-root docs path
that the derivation could not link"* is the tripwire that turns a silent
miss into a loud one — the single assertion this card's argument rests
on. Planting exactly the shape it exists to catch left it **GREEN**. The
cause was not in the tripwire: `JS_SITE`'s base group must exclude
parentheses to stay anchored, so `join(someCall(), "docs", ...)` was not
a SITE at all, and a tripwire is only as wide as the patterns it reads.
**A tripwire that cannot see the thing it reports is indistinguishable
from a tree with nothing to report.** Fixed by adding a zero-argument
call alternative to the base group (Rust's method form always had one,
which is how `common::repo_root().join(...)` was found in the first
place); re-run, `unlinkedFiles()` named the planted file and the body
went RED at **22 / 1**. Two samples were added for the shape, and the
residual — a base that is a call WITH arguments — is named in the
scanner's own "WHAT IT CANNOT SEE" rather than claimed closed.

A second defect the drill found, before the samples existed: **this
scanner reported ZERO sites in itself.** Its own site patterns are regex
literals carrying a quote and a backtick, and a comment strip that does
not lex regex literals opens a fake template at that backtick and
swallows the rest of the file. The failure direction is HIDING readers.
Fixed by sharing `token-scan.mjs`'s `regexEnd` rather than writing a
second lexer, with a sample pinning it. A third, same session: counting
block-comment DEPTH (for Rust's nested comments) blanked this module
whole, because a JSDoc paragraph quoting `app/src/**` opens a level it
never closes. First-close-wins, with the reason in the code.

`SITE_SAMPLES` carries **20 selftest rows** — positives for every
spelling the tree uses, negatives for every near-miss, an evidence floor
for positives/negatives/Rust so deleting a sample cannot delete its own
failure (poison shape FIVE).

### GATE DERIVATIONS FOR THIS LANE, every dot count stated

Main tip at dispatch is `e83ee1d`; the last `Checkpoint:` is `825932c`
and the single commit between them is **docs-only** — `git diff
--name-only 825932c e83ee1d` is one path, `docs/design/cross-harness-plan.md`
— **verified rather than taken from the brief**, which is what
DISPATCH FROM THE LAST CHECKPOINT asks a reader to check.

    git merge-tree --write-tree e83ee1d HEAD    -> tree <T>, exit read from $?
    git diff --name-only e83ee1d <T>                     THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only e83ee1d...HEAD   (THREE dots)   cmp against the forecast
    git diff --name-only e83ee1d..HEAD    (TWO dots)     THE FORBIDDEN PRE-MERGE FORM

Measured at the implementation commit **`c8f6213`**, every dot count
stated:

    git merge-tree --write-tree e83ee1d c8f6213  -> tree cfe2e646…, MERGE_TREE_EXIT=0
    git diff --name-only e83ee1d <TREE>                      -> 12   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only e83ee1d...c8f6213  (THREE dots)     -> 12   cmp against the forecast: exit 0
    git diff --name-only e83ee1d..c8f6213   (TWO dots)       -> 12   the forbidden form, and today it agrees
    git merge-base e83ee1d c8f6213                           -> e83ee1d

**ALL THREE COINCIDE, AND THAT IS A FACT ABOUT TODAY RATHER THAN A
LICENCE.** `e83ee1d` is main's tip AND the merge-base, because main has
not advanced since this branch was cut; the two-dot form is
`<merge-base>..HEAD` here by an accident of timing, which is exactly the
range CONVENTIONS bans by name. **The moment main moves, the three
diverge** — and two sibling lanes (T-072, T-074) are live and will move
it. The integrator re-derives at the merge and does not quote this
block; that is the last two checkpoints' lesson applied to the one
endpoint this lane can be wrong about.

**AND MAIN MOVED BEFORE THIS PARAGRAPH WAS AN HOUR OLD, SO THE
PREDICTION IS NOW A MEASUREMENT.** Between the commit above and the
final process census, main advanced from `e83ee1d` to **`2cf59da`** —
T-074 and T-072 both merged and checkpointed, **23 paths**. Re-derived
against the new tip, with the branch tip HELD FIXED at `93b5a44`:

    git merge-tree --write-tree 2cf59da 93b5a44  -> tree adf43362…, MERGE_TREE_EXIT=0
    git diff --name-only 2cf59da <TREE>                      -> 12   UNMOVED
    git diff --name-only 2cf59da...93b5a44  (THREE dots)     -> 12   cmp against the forecast: exit 0
    git diff --name-only 2cf59da..93b5a44   (TWO dots)       -> 35   THE FORBIDDEN FORM, 12 -> 35
    git merge-base 2cf59da 93b5a44                           -> e83ee1d  (unmoved: this branch did not move)

**THE FORBIDDEN FORM WENT 12 TO 35 AND THE CORRECT ANSWER NEVER MOVED**,
with the LEFT-hand endpoint the only thing that changed — the exact
half T-081's checkpoint could not show, because there the branch tip
moved instead. 12 + 23 = 35, and that arithmetic is the check: `comm
-12` over main's 23 paths and this lane's 12 is **EMPTY**, so the two
sets are disjoint and `merge-tree` exits 0 rather than reporting a
conflict. **A lane fenced to one tree, cut from a checkpoint whose main
then advanced in another, is the ORDINARY case** — CONVENTIONS says so
and this lane is the next data point.

Two consequences the integrator inherits rather than this lane: main's
advance carries T-074's graph regen, so `index --check` must be
re-asked at the merge against the NEW committed graph; and main's ten
new `T-07*-s*` cards all read `status: suggested`, so the DOCS GATE's
live-card half stays clean across the merge — checked by grep against
main, since this branch may not merge to find out.

**THE RIGHT-HAND ENDPOINT IS NAMED TOO, and it terminates.** The block
above is measured at `93b5a44`, and writing it moved the tip to
`7edf94e`. Re-derived there: `git merge-tree --write-tree 2cf59da
7edf94e` exits 0 at tree `36e0915a…`, the prescribed form returns the
SAME TWELVE PATHS (`cmp` against the earlier list, exit 0), three dots
returns twelve and two dots returns thirty-five. **The path set cannot
move**, because every notes commit touches
`docs/tasks/T-084-docs-is-a-code-input-and-no-gate-knows-it.md`, which
is already one of the twelve — which is why naming the pair ends the
regress instead of chasing it.

`merge-tree`'s exit was read from `$?` and not swallowed by the command
substitution: a substitution that eats a CONFLICT hands back an empty
forecast wearing the costume of a clean gate.

**Suffix census of the twelve:** 7 md, 3 mjs, 1 ts, 1 json — one path
per file, no renames, no deletions.

- **GRAPH REGEN — FIRES AT EXACTLY ONE PATH, and the regen is a proven
  no-op.** Derived over the twelve: `.ts/.tsx/.js/.jsx` matches **1**
  path and it is outside `docs/` —
  `tools/e2e/tests/docs-input-gate.spec.ts`. **The two new `.mjs` scripts
  do NOT match this trigger**, which is worth stating because they are
  the substance of the change: that suffix list has never carried
  `.mjs`, so a lane shipping only scripts would not fire it at all. The
  gate was ASKED rather than predicted: `cargo run -p nputer-index --
  index --check --root ../..` from app/src-tauri exits **0**, *graph.json
  is CURRENT ... 576235 bytes, 118 files, 996 symbols, 1520 edges*.
  `tools/` is `.nputerignore`d, so this is T-054-s1's worked example a
  third time — the trigger is deliberately wider than the walk.
  **No regenerated graph is committed here**: CONVENTIONS puts the regen
  at the CHECKPOINT.
- **BOOT GATE — DOES NOT FIRE, 0 of 12.** Zero paths in the diff match
  `app/src-tauri/**`, `app/src/**`, `app/package.json` or
  `app/src-tauri/Cargo.toml`. The executor's own obligation (T-046
  criterion 6) is on the same trigger, so the boot check is not owed and
  was not run. **Nothing bound, connected to or signalled port 1420**;
  it was read once with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and with
  nothing else, before and after: holder `node` pid **82549**, one
  socket, `TCP [::1]:1420 (LISTEN)`, unchanged. The human's app pid
  **85379** and vite **82549** are untouched — this lane opened no
  window, ran no `tauri dev`, and built Rust only into the WORKTREE's own
  `app/src-tauri/target`, never the directory their dev server watches.
  The lane's own vite ran on scratch port **14561**, bind-probed free on
  all four stacks (`127.0.0.1`, `0.0.0.0`, `::1`, `::`) before use.
- **DOCS GATE — FIRES, on its own diff, and this is the first thing it
  was asked.** **7 of the 12 paths are under `docs/`** —
  `docs/CONVENTIONS.md`, this card and five findings.
  `node tools/e2e/scripts/docs-gate.mjs <the docs paths>` exits **1** and
  owes `cargo test from app/src-tauri/`, `npm test from app/`,
  `npx vitest run from lib/parser/` and `npm test from tools/e2e/`. All
  four were run after the docs files were in the tree.

### Suites, every exit code read from its own `$?`, never through a pipe

- **app: 831/831 across 42 files, `APP_TEST_EXIT=0`.** `npm run build`
  `APP_BUILD_EXIT=0`, emitting `index-3bNJ6pCB.js` **501.54 kB** and
  `index-CwYF5FQb.css` **43.95 kB** — **both content hashes identical to
  the checkpoint's**, which is the honest form of "no app source moved".
  **A NOTE FOR THE NEXT LANE THAT WORKTREES**: a fresh worktree has no
  `app/dist`, and twelve bodies across four files assert against the
  SHIPPED BUNDLE. They fail 819/831 until `npm run build` has run once.
  That is an environment artifact, not a regression, and it cost a
  confusing minute.
- **parser: 263/263 across 12 files, `PARSER_EXIT=0`**; `npx tsc
  --noEmit` `PARSER_TSC_EXIT=0`. Its smoke test parses the live `docs/`
  tree with five new findings and this card in it and requires zero
  issues.
- **cargo, bare `cargo test --no-fail-fast` (never `--all-targets`,
  which skips doc-tests): 352 passed / 0 failed / 3 ignored**,
  `CARGO_TEST_EXIT=0`, summed programmatically from **fifteen** `test
  result:` lines. Unmoved. `snapshot_version_matches_the_live_method_stamps`
  is green against the EDITED `docs/CONVENTIONS.md`, which is this
  card's own gate proving itself: a CONVENTIONS edit owes `cargo test`,
  and the reason is a body no suffix rule would ever have found.
- **E2E lane: 114/114, `E2E_EXIT=0`**, one worker, zero retries, zero
  skips, scratch port 14561 — **91 before plus this card's 23**.
  `npm run typecheck` `E2E_TYPECHECK_EXIT=0`.
- **token lint: `LINT_SELFTEST_EXIT=0`, `LINT_TOKENS_EXIT=0`** —
  `lint-tokens: clean (TOKEN 122 files under app/src, app/test,
  tools/e2e; CONTROL 571 tracked text files)`, selftest at 49 TOKEN + 4
  CONTROL samples, 71 walk-policy checks, 8 evidence-floor checks.
  **TOKEN 119 -> 122** (+3, the three new files under tools/e2e) and
  **CONTROL 563 -> 571** (+8: those three plus the five finding files),
  both derived at this ref rather than quoted. Measured at 566 before
  the findings were written and re-derived after, which is the same
  right-hand-endpoint drift T-081's checkpoint recorded — a count with
  no ref goes stale from either end.
  **THE LINT CAUGHT THIS CARD'S OWN SPEC**: the transcription pin quotes
  the parser's frontmatter regex, which contains `---[`, and `-[` is
  P1's shape. Split across a concatenation so the literal never appears.
- **`index --check`** exit **0**; see the gate section.

### What the CARD and the BRIEF got wrong, measured against the tree

Stated plainly, because both are still being quoted.

1. **"the two named here" is TWO of NINE, and the card's own criterion
   ("SHALL enumerate the real-tree readers rather than assuming the two
   named here are all of them") is what found the other seven.**
2. **"the answer today is `npm test` from `app/`, not the parser suite
   and not e2e" is FALSE THREE WAYS.** The parser suite reads the live
   tree in `smoke.test.ts`, `task.test.ts` and `rejected-exclusion.test.ts`;
   the lane reads ALL of `docs/` in two specs; the cargo suite reads
   `docs/CONVENTIONS.md` on every run and the component registry in
   `arch.rs`. **And the card's own FIRST INCIDENT was caught by e2e** —
   `9c64cd8`'s message says so in as many words: *"The E2E lane caught it
   three steps from the cause — shell-frame's data-failure-count went 60
   -> 62"*.
3. **"Today it surfaces as a count mismatch in a dogfood body, which
   names neither the card nor the field" is true of INCIDENT ONE and
   false of INCIDENT TWO.** The parser already emits a typed
   `invalid-field` issue naming the file, the field, the eight-name
   vocabulary and the offending value, and `T-081-s9` quotes that exact
   diagnostic. What was missing was never the message — it was that
   nothing gives a docs-only edit a reason to RUN the suite that prints
   it. So the near-miss half of that criterion is a nicety and the
   loudness half was already there; I built the RUNNING half, which is
   the one that was actually absent, and the gate's own message carries
   the file, the field, the vocabulary, a near-miss for a genuine typo
   and the disposition ruling for `closed`.
4. **Both incidents are dated 2026-08-18 and 2026-08-19 in the card; both
   commits are 2026-08-19.** `9c64cd8` is *2026-08-19 15:35:21* and
   `fede266` is the same evening. Minor, and it matters only because the
   card presents them as separate days.
5. **CONVENTIONS' own CI bullet claims the workflow-parity derivation is
   "silent in exactly ONE case, a command the DOC gains that the spec
   does not yet claim". That is false at `e83ee1d`** — `deriveExpectedSteps`
   pushes a problem for exactly that case. It is why the gate is not an
   npm script; `T-084-s2` carries it.
6. **The brief was RIGHT about the lane** (`e83ee1d` is main's tip; the
   commits after `825932c` are docs-only — verified), **right about the
   figures** (CONTROL 563, TOKEN 119, app 831/831, cargo 352/0/3 over 15
   lines, parser 263/263, graph 576235/118/996/1520 — every one
   re-derived here and every one correct), and **right that the
   vocabulary answer is the second arm**.

### Deliberately not done

- **`.nputerignore` is untouched.** `docs/` is excluded there because the
  graph is CODE-derived; `index --check` is not the gate that missed
  this and indexing docs/ would have caught neither incident. The
  exclusion is asserted in the spec so "we decided" cannot be read as
  "we forgot".
- **No status added, no `method/` edit, no `.github/` edit, no npm
  script.** Three of those are fence; the fourth is `T-084-s2`.
- **No graph regen committed** — that is the checkpoint's.
- **The parser's `status:` near-miss hint was NOT added to
  `lib/parser/**`**, which is outside `touches:`. The gate carries the
  hint instead, at the point a finding is WRITTEN, which is where
  `T-080-s6` and `T-081-s9` both asked for it.

Findings filed: **`T-084-s1`** (a docs path behind an imported constant
is invisible to the site scan — `graph.json`), **`T-084-s2`** (the gate
is not a CI step because the fence could not reach ci.yml, plus the
false sentence in CONVENTIONS' CI bullet), **`T-084-s3`**
(`smoke.test.ts` is a live-docs reader with no docs literal and the
parser suite rides on two siblings), **`T-084-s4`** (running the lane
writes into the live `docs/` tree and restores it), **`T-084-s5`**
(`method/tasks/TASK-FORMAT.md` should carry the disposition ruling).

**For the verifier, the four sharpest places to attack.** (1) The
derivation's completeness: `T-084-s1` and `T-084-s3` are two known
shapes it cannot see, both argued as bounded — check the argument, not
the claim. (2) `unlinkedFiles()` is the tripwire the whole design leans
on and it was VACUOUS on first contact; it is only as wide as
`JS_SITE`/`RS_SITE`. (3) The DOCS GATE bullet's command list is pinned
in both directions but its PREFIXES are prose — a reader whose prefixes
change moves nothing in the doc. (4) `stripComments` is a lexer, and
three of this card's bugs were in it.

## Verdicts

### 2026-08-20 — REJECTED (claude-opus-5 @T-084-verify, review: same-model)

**Three blocking findings, all reproducible, and the first of them is
this card's own failure mode arriving through the gate built to remove
it.** A one-line docs-only edit to `docs/ROADMAP.md` makes
`docs-gate.mjs` fire and owe **exactly one** command; that command
(`npm test` from tools/e2e) runs **114/114 at exit 0**, and
`npx vitest run` from lib/parser goes **262/263 at exit 1** in a suite
the gate never named. An integrator who obeys the gate merges a red
tree. Everything else on this card is strong — the derivation is real,
both halves of the discriminator are load-bearing and pinned, the
vocabulary read is genuine, all four suites are green, and the poison
drill is the most honest one in this archive — so this is a narrow
rejection about the derivation's REACH, not a rebuild.

**Range derived, every dot count stated.** Main at `2cf59da`, branch tip
`1eba34f`, `git merge-base 2cf59da 1eba34f` = **`e83ee1d`** (the cut
point, unmoved).

    git merge-tree --write-tree 2cf59da 1eba34f  -> tree cc30f65c…, exit 0
    git diff --name-only 2cf59da <TREE>                    -> 12   PRESCRIBED
    git diff --name-only 2cf59da...1eba34f  (THREE dots)   -> 12   cmp vs two-dot-from-base: exit 0
    git diff --name-only e83ee1d..1eba34f   (TWO dots)     -> 12   base-relative, agrees
    git diff --name-only 2cf59da..1eba34f   (TWO dots)     -> 35   THE FORBIDDEN FORM

12 → 35 on the forbidden form, re-derived rather than inherited; the
merged tree against main is the same twelve paths, so the fences are
disjoint. **GRAPH REGEN fires at exactly 1 of 12** —
`tools/e2e/tests/docs-input-gate.spec.ts`; the trigger as written is
`*.ts/*.tsx/*.js/*.jsx` outside docs/ and **`.mjs` is not in it**, read
off the bullet rather than remembered, so the three `.mjs` files that
are the substance of this change do not match. `cargo run -p
nputer-index -- index --check --root ../..` exits **0** —
*576235 bytes, 118 files, 996 symbols, 1520 edges*, every figure equal
to the notes'. **BOOT GATE: 0 of 12, not owed.** Nothing bound,
connected to or signalled 1420; read once with `lsof -nP -iTCP:1420
-sTCP:LISTEN` and nothing else — holder `node` pid **82549**, one
socket, `TCP [::1]:1420 (LISTEN)`; the human's app pid **85379** and
vite **82549** unchanged at the end. The lane ran on scratch port
**14721**, bind-probed free first.

---

### BLOCKING 1 — the gate's ANSWER is silent about a suite that reds, on two of the five prefixes it emits

The criteria are explicit about what a reader is. AC1: the rule *"SHALL
be derived from **what the suites actually read**"*. AC2: *"a reader is
any body that resolves a path under `docs/` against the repository root
rather than a fixture directory"*. The implementation narrows that to a
body that **spells a `docs`-first literal in its own file**, and the two
are not the same set on this tree.

`lib/parser/test/smoke.test.ts` calls `parseProject(repoRoot)` — the
repository root, not a fixture — and `lib/parser/src/project.ts`
resolves three paths off it: `docs/tasks`, `docs/ROADMAP.md` and
`docs/architecture/components`. The derivation attributes only
`docs/tasks` and `docs/tasks/rejected` to the parser suite. **Two of the
three prefixes that suite actually reads are missing from the gate's
answer today** — not after a future refactor.

MUTANT ONE, mine, derived from AC1/AC2 and not from the pins. One-sided:
the producer moved, the assertion did not; text read back before any
suite ran; restored by byte copy and proved by sha256 + `git status`.

    perl -pi -e 's/App shell \+ board/App shell and board/ if $. == 5' docs/ROADMAP.md
    # read back: "- F-02: App shell and board — Tauri app, read-only story map rendered"
    # git diff --stat: docs/ROADMAP.md | 2 +- , 1 file changed

    node tools/e2e/scripts/docs-gate.mjs docs/ROADMAP.md      -> EXIT 1
      docs-gate: FIRES — 1 path(s) under docs/ are code inputs. Run:
        npm test from tools/e2e/
        docs/ROADMAP.md <- shell-frame.spec.ts, window-contract.spec.ts

    npm test        from tools/e2e/   -> 114 passed,  E2E_EXIT=0     GREEN
    npx vitest run  from lib/parser/  -> 262/263,     PARSER_EXIT=1  RED

    FAIL test/smoke.test.ts > parses the backbone features in order
    AssertionError: expected 'App shell and board' to be 'App shell + board'

Expected, per AC1 and AC3 (*"the integrator needs to know WHICH suite
answers this"*): `npx vitest run from lib/parser/` in the answer.
Actual: absent, and the only suite named is green.

MUTANT TWO, the same defect on a second prefix, so it is not a ROADMAP
quirk:

    perl -pi -e 's/^name: lib-parser$/name: lib-parser-renamed/' \
      docs/architecture/components/C-06-lib-parser.md          # read back OK

    docs-gate.mjs docs/architecture/components/C-06-lib-parser.md -> EXIT 1
      owes: cargo test from app/src-tauri/ · npm test from app/ · npm test from tools/e2e/

    npx vitest run from lib/parser/ -> 262/263, PARSER_EXIT=1
    FAIL test/smoke.test.ts > parses the dogfood component registry (T-008)
    AssertionError: expected { id: 'C-06', …} to match object { name: 'lib-parser', …}

Both restored: `docs/ROADMAP.md` back to
`0752482f5e8d790418941521f726939a03c922210ba3b584383854966c06b109`,
`C-06` byte-restored, `git status --porcelain` empty, parser back to
263/263.

**`T-084-s3` names the shape and understates the consequence.** It says
the parser suite *"is in the gate's answer today only because two
sibling bodies carry literals"* and warns that *"delete or refactor
those two and the parser suite silently leaves the answer"*. That reads
as a future risk. Measured, it is a present one: the two siblings carry
`docs/tasks` and `docs/tasks/rejected` **only**, so for a ROADMAP-only
or components-only diff the parser suite is already absent. The
boundedness argument the notes ask a verifier to check ("check the
argument, not the claim") does not hold.

**And the admissions are a sample, not a complete account.** Sweeping
every corpus file for a root anchor turns up live-docs readers neither
`s1` nor `s3` names:

- `app/src-tauri/crates/nputer-index/src/arch/registry.rs` —
  `reads_this_repos_live_registry_and_finds_the_known_shape` does
  `read_registry(&crate::testutil::repo_root())`, reading
  `docs/architecture/components` off the live tree and asserting its
  shape. Root-anchored, zero sites (its `docs` literal is a bare
  `const REGISTRY_REL_DIR`, never a `.join("docs…")`), so it is neither
  derived nor reported.
- `app/src-tauri/crates/nputer-index/tests/self_graph.rs` — indexes the
  live repo off `common::repo_root()`; `self_graph_is_current` reads
  `docs/architecture/graph.json`.
- `tools/e2e/scripts/token-scan.mjs` / `lint-tokens.mjs` — the CONTROL
  corpus is every tracked text file, `docs/` included, so CI's first
  step reads all of docs/ and no site says so.

None of these change which SUITE is owed today, which is why they are
evidence rather than a fourth finding — but they are the same blind spot
as BLOCKING 1, and the scanner's *"WHAT IT CANNOT SEE"* section does not
mention the class at all.

**The remedy is small and `T-084-s3` already writes it**: one hop of call
analysis — `f(<repo-root expression>)` where `f` is imported from a
first-party module that forms a `docs`-first path off its own parameter
is a docs site. That is exactly `parseProject(repoRoot)`. Failing that,
the honest minimum is for the gate to stop presenting its command list
as complete: CONVENTIONS says **"Ask the gate; do not predict"**, and on
this tree that instruction is wrong for two of five prefixes.

---

### BLOCKING 2 — `unlinkedFiles()` is still vacuous one step out, and the residual it names is not the one that bites

M6 in the notes is the sharpest work on this card and its fix is REAL: I
reproduced both sides.

    // planted, app/test/m7a-local-anchor.test.ts
    const REPO = join(HERE, "..", "..");        // local root anchor
    function fixtureRoot() { return REPO; }
    const dir = join(fixtureRoot(), "docs/tasks");
    -> unlinkedFiles() reports it.  The zero-arg-call alternative works.

But the tripwire's two arms follow different rules. A SITE's base is
resolved through `ctx.resolveImport` (one hop into a relative module —
that is how `shell-frame.spec.ts` resolves `repoRoot` from
`../preflight`). The ANCHOR scan reads `ctx.bindings` only — local
`const/let/var` and Rust `fn`. **An imported root is invisible to the
anchor scan**, and importing `repoRoot` from `../preflight` is the
dominant idiom in the very package the tripwire lives in: three of the
nine derived readers get their root that way.

    // planted, tools/e2e/tests/m7b-imported-anchor.spec.ts
    import { repoRoot } from "../preflight";     // imported root anchor
    function fixtureRoot() { return repoRoot; }
    const dir = join(fixtureRoot(), "docs/tasks");

    docsSites  -> the site IS seen (corpus 117 -> 119 sites over the pair)
    unlinkedFiles() -> ["app/test/m7a-local-anchor.test.ts"]   ONLY

    // and the same with a member-expression base, m7d-member-base.spec.ts
    const cfg = { root: repoRoot };
    const dir = join(cfg.root, "docs/tasks");
    unlinkedFiles() -> ["app/test/m7a-local-anchor.test.ts"]   ONLY

Expected: reported — the file forms a `docs`-first path, computes the
repository root, and the scanner cannot link it, which is the tripwire's
own stated trigger. Actual: silent. The scanner's *"WHAT IT CANNOT SEE"*
names one residual — *"a base that is a call WITH ARGUMENTS"* — and
claims *"nothing in the tree writes one, because a root gets bound
before it gets joined"*. That is true and beside the point: the shape
that escapes is a root that gets bound **in another file**, which this
tree writes constantly. Confirmed separately that
`join(path.resolve(REPO), "docs/tasks")` produces no site and no report
either, so both residuals are silent, not one.

A tripwire that catches one new shape and misses the next is the same
defect the drill found. The fix is one line in `unlinkedFiles` — fold
`ctx.resolveImport`-reachable names into the anchor test, exactly as the
site path already does — plus a sample for the shape.

---

### BLOCKING 3 — `docs/CONVENTIONS.md` ships a measured figure that is wrong

The DOCS GATE bullet: *"at `e83ee1d` the tree holds **117 docs-shaped
sites in 22 files** and exactly **twelve of them, in nine files, are
root-anchored**."* The notes repeat it and build the argument on it
(*"one twelfth of the truth, and the wrong twelfth"*).

Re-derived twice, at a scratch worktree checked out at `e83ee1d` and at
the branch tip, and once by hand off the tree:

    docs-shaped sites: 117 in 22 files       AGREES
    ROOT-ANCHORED:      11 in  9 files       the doc says twelve

    arch.rs:192  kit.rs:448  architecture-dogfood:1020,1023
    map-dogfood:31,36  rejected-exclusion:42  task:257
    shell-frame:65  window-contract:98  workflow-parity:75      = 11

The notes' own reader table lists eleven prefix rows too. Nothing in the
lane pins the number, which is why it is green and wrong; the file count
(nine) is right. `docs/CONVENTIONS.md` is the house spec and this is the
sentence that carries the derivation's evidence — a figure with a ref
that does not reproduce at that ref is the class this archive keeps
filing cards about.

---

### What re-derived cleanly — the rebuild is narrow

- **Both halves of the discriminator are load-bearing and pinned.**
  Relaxing `docs`-first to `(?:docs|app)` in `JS_SITE` → **21/2**, RED at
  *a repo-root join whose first segment is not `docs` is not a reader*
  and at the sample set. Disabling the `evalBase(...) !== root` guard →
  **21/2**, RED at *a docs path off a root that is NOT the repo root is
  not a reader* and at *the answer is PROPORTIONAL*. Both counterexamples
  verified in the tree: `tools/e2e/fixtures/shell.ts` joins `repoRoot`
  with `app/test/fixtures/genesis/streak/docs`;
  `lib/parser/test/files.test.ts` carries six sites, none anchored.
- **The enumeration is mechanical and it grows.** Planting a new
  `lib/parser/test/*.test.ts` that does `join(repoRoot,'docs/ROADMAP.md')`
  took the derivation **9 → 10 readers with nothing edited**, and the
  gate's answer for `docs/ROADMAP.md` correctly gained
  `npx vitest run from lib/parser/` — which is also the cleanest proof
  that BLOCKING 1 is a reach problem and not a design problem.
- **The vocabulary read is REAL, not a copied constant.** Appending
  `'closed'` to `TASK_STATUSES` in `lib/parser/src/types.ts` made
  `taskStatuses()` return nine with no gate edit and redded **3** lane
  bodies. Renaming the declaration to `TASK_STATUS_NAMES` made the gate
  exit **3** with *"a moved declaration is a gate that could not run,
  never an empty vocabulary that accepts anything"* — the whole point,
  held.
- **The disposition ruling is right and is written where a reader meets
  it.** `closed` as a ninth status fails all four of the notes' tests
  independently: `T-081-s7` already carries `status: suggested` plus a
  `closed_by:` line, TASK-FORMAT.md's three moves are unchanged, the
  vocabulary is method-ratified so a ninth name is a version bump whose
  third file is Rust, and `nearMisses("closed", …)` is genuinely empty at
  distance 2 while `nearMisses("plannd", …)` returns `planned` — a
  negative with a working positive control. The ruling reaches the
  writer at the point of failure, quoted in the gate's own message.
- **The illegal-card criterion is met end to end.** A planted live
  `docs/tasks/T-995-s1-…md` with `status: closed`: gate **exit 1** naming
  file, field, the eight-name vocabulary, the value and the ruling; the
  lane RED by name at *every live task card parses*; `npm test` from
  app/ **830/831 exit 1** — the second incident reproduced to the
  digit; `npx vitest run` from lib/parser **262/263 exit 1**. Removed;
  tree clean.
- **Exit-code contract holds all four ways**: code-only diff 0, docs diff
  with a reader 1, `--range` 2, moved declaration 3.
- **`token-scan.mjs`: nothing else moved.** `--numstat` is 10/4 and every
  moved line is inside the two doc comments or the two signatures that
  gained `export`. The token lint is unaffected: **TOKEN 119 → 122**
  (+3 files under tools/e2e) and **CONTROL 563 → 571** (+8: those three
  plus five findings), both closed arithmetically by running
  `lint-tokens.mjs` at `e83ee1d` and at the tip — exit **0** at both.
- **Suites at the tip, every code read from its own `$?`:** app
  **831/831** `APP_TEST_EXIT=0` (after `npm run build`, itself preceded
  by `npm run build` from lib/parser — a fresh worktree has neither
  `lib/parser/dist` nor `app/dist`, and without the parser's dist the app
  build dies at TS2307 before the bundle-asserting bodies are reached);
  parser **263/263** `PARSER_EXIT=0`, `tsc --noEmit` 0; cargo
  `--no-fail-fast` **352 passed / 0 failed / 3 ignored** over fifteen
  `test result:` lines, `CARGO_TEST_EXIT=0`; lane **114/114**
  `E2E_EXIT=0`, all **23** new bodies present and green;
  `tsc --noEmit` from tools/e2e 0; `lint-tokens` 0; `index --check` 0.
- **`T-084-s4` is accurate and its hazard is real.** `token-scan.spec.ts`
  really does append a byte to seven tracked files including
  `docs/NORTH_STAR.md`, `AGENTS.md` and `.github/workflows/ci.yml`, and
  really does prove restoration by sha256 per file plus `git diff
  --quiet`. I hashed all seven before the first lane run and re-checked
  after three: byte-identical every time. The residual is that the
  restore lives in a `finally` — a killed run (timeout, interrupt) leaves
  seven tracked files carrying a trailing NUL, and in the MAIN checkout
  two of them are files the human's watcher is armed over. Worth the
  one-line caveat `s4` asks for.
- **`T-084-s2` is correct, and it is a live spec that is wrong.**
  CONVENTIONS' CI bullet claims the derivation *"is silent in exactly ONE
  case, a command the DOC gains that the spec does not yet claim"*.
  `deriveExpectedSteps` pushes a problem for exactly that case
  (`for (const key of doc.keys()) … "which this spec has no entry for"`),
  and `workflow-parity.spec.ts`'s own reword fixture asserts that
  message. Not silent; correctly filed out of fence rather than fixed.

### The trigger's third way: BETTER, not merely different

The card offered "any `docs/**`" against "`docs/tasks/**` +
`docs/architecture/**`" and the executor took neither. Both premises
check out. The narrow pair really would miss `docs/CONVENTIONS.md`:
`app/src-tauri/src/agent/kit.rs:448` reads it on every `cargo test` and
`workflow-parity.spec.ts:75` parses it. And "every path under `docs/`
reaches a reader" is not an excuse — `shell-frame.spec.ts:65` and
`window-contract.spec.ts:98` each `walk(path.join(repoRoot, "docs"))`
recursively, so narrowing the trigger would be a lie about the tree.
Splitting a wide trigger from a narrow, per-path, derived ANSWER is a
strictly better answer than either option offered, and it satisfies AC3
in a way "run the suites" cannot. **The one thing that undermines it is
BLOCKING 1**: a proportional answer is only as good as its completeness,
and *"Ask the gate; do not predict"* is an instruction to trust it.

### Corrections to the dispatch brief

- The brief inherits **"exactly 12 in 9 files survive both halves"**. The
  tree says **11**; see BLOCKING 3. Everything else in the brief
  re-derived correctly: 12/12/`cmp` 0/35, GRAPH REGEN 1 of 12 with
  `.mjs` genuinely absent from the trigger, BOOT GATE 0 of 12, TOKEN
  119→122, CONTROL 563→571, the two exported symbols and nothing else in
  `token-scan.mjs`, and `T-084-s2`'s claim about the CI bullet.
- The brief's five card errors are all real. #1 two of nine in one of
  four suites; #2 false three ways, and `9c64cd8`'s message says *"The
  E2E lane caught it three steps from the cause"* outright; #3 the parser
  already emits a typed `invalid-field` naming file, field, vocabulary
  and value — I saw it under the planted card — so what was missing was
  a reason to RUN it; #4 `9c64cd8` is 2026-08-19 15:35:21 and `fede266`
  2026-08-19 23:35:23, one day; #5 ruled on above.

### To clear this

1. Extend the derivation one hop through a first-party call so
   `parseProject(repoRoot)` is a site — `T-084-s3` already specifies it —
   or, at minimum, make the gate say out loud which prefixes it cannot
   attribute, so its answer stops reading as exhaustive.
2. Make the anchor arm of `unlinkedFiles` follow imports the way the
   site arm already does, with a sample for the shape.
3. Correct twelve to eleven in `docs/CONVENTIONS.md` and in the notes,
   and consider pinning the count so the next figure cannot go stale
   silently.

Re-verification needs mutants 1 and 2 above run against the fix, plus
the four suites.
