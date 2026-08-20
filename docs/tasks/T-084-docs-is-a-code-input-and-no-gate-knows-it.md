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
verifier:
built_by: claude-opus-5 @T-084
verified_by:
review:
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

The figures are in the commit that carries these notes, because they can
only be measured once the work is committed; `e83ee1d` is main's tip and
also the merge-base, so on this lane the forbidden form and the
prescribed one COINCIDE — main has not advanced since the branch was
cut. **That is a fact about today, not a licence**: the moment main moves
the two diverge, and the executor who quotes this paragraph a day later
is quoting a range that has drifted.

- **GRAPH REGEN — FIRES, and the regen is a proven no-op.** The diff
  carries `.ts` and `.mjs` outside `docs/`, so the trigger matches. The
  gate was ASKED rather than predicted: `cargo run -p nputer-index --
  index --check --root ../..` from app/src-tauri exits **0**, *graph.json
  is CURRENT ... 576235 bytes, 118 files, 996 symbols, 1520 edges*.
  `tools/` is `.nputerignore`d, so this is T-054-s1's worked example a
  third time — the trigger is deliberately wider than the walk.
  **No regenerated graph is committed here**: CONVENTIONS puts the regen
  at the CHECKPOINT.
- **BOOT GATE — DOES NOT FIRE.** Zero paths in the diff match
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
  was asked.** `docs/CONVENTIONS.md` plus the card plus five findings.
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
