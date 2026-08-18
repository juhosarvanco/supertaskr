# State

Updated: 2026-08-18 by integrator (T-054 merged), claude-opus-5 @fresh

## Just completed

**T-054 — retire the interim graph rule; make `index --check` the gate
CI actually runs.** F-06, milestone 4, size M, **six** acceptance
criteria plus **five** absorbed cards' worth of obligations (T-014-s3,
T-014-s8, T-045-s1, T-045-s4, T-049-s1). `touches: [docs, method,
tools/e2e, ci]`. Built by `claude-opus-5 @T-054`, **APPROVED** by
`claude-opus-5 @T-054-verify`, `review: same-model`, no rejection.
Merge **`f58fc2b`**. **3 commits, 8 files, +1,236 / −54** — and the
IMPLEMENTATION is **one commit, `f7e60c7`, touching exactly three
files**: `docs/CONVENTIONS.md`, `tools/e2e/tests/workflow-parity.spec.ts`
and `.github/workflows/ci.yml`.

**IT CLOSES A GATE THAT HAS NEVER EXISTED.** `ci.yml` ran bare
`cargo test`, which SKIPS `#[ignore]`d tests, and `self_graph_is_current`
— the only byte-comparison against the committed
`docs/architecture/graph.json` — is `#[ignore]`d on purpose so local
`cargo test` stays hermetic to unrelated TypeScript edits. **I re-proved
both halves first-hand at this merge**: bare `cargo test` printed
`self_graph_is_current ... ignored`, and `git grep nputer-index` over
`.github/` at `6404a43` matched **zero files**; at HEAD it matches
`ci.yml` **three times**. So a stale graph passed CI green, because the
dogfood fixtures assert against the COMMITTED graph and a stale graph
agrees perfectly with fixtures that match it. **Thirty regens were held
up by a written ritual and conscientious integrators, nothing else.**

**AND THE RETIREMENT HAPPENS IN THE SAME COMMIT AS THE REPLACEMENT.**
T-009-s1's INTERIM rule carried its own retirement condition — "retires
when T-014's `nputer index --check` becomes the gate" — and `f7e60c7`
satisfies it and consumes it in one commit, so there is no state in this
branch's history where the ritual is gone and the step absent. The
verifier proved that per-commit; I re-read the diff rather than the
claim.

**THREE NEW CONVENTIONS BULLETS, and one of them was pure oral
tradition.** **DISPATCH FROM THE LAST CHECKPOINT** (never from a merge
commit — a merge carries a graph the checkpoint has not regenerated yet,
so a lane cut from one inherits a red through no fault of its own).
**POISON DRILL** — mutate every new or changed assertion, require the
RED, restore, PROVE the restoration by sha256, RECORD the count; until
this commit the words "poison", "mutation" and "vacuous" appeared
**nowhere** in `docs/CONVENTIONS.md` or `method/roles/`. **THE E2E
LANE'S HONEST SCOPE** — `tools/e2e` covers what a BROWSER can reach, so
a green lane is never coverage of an IPC path.

**AND TWO OF THE FOUR CI DIVERGENCES ARE GONE (T-045-s1).**
`docs/CONVENTIONS.md` said "except the **FOUR** deliberate divergences";
it now says "except the **TWO**", and both survivors are genuine
environment differences (`npm ci` for lockfile-exact installs, and
`playwright install --with-deps` for a fresh runner's Linux libs). The
two that died were CI spelling a documented command a second way: the
token lint is now `npm run lint:tokens -- --selftest` then
`npm run lint:tokens` from `tools/e2e`, and the boot check is
`xvfb-run -a npm run boot:check` from `tools/e2e`. **The `--` is
load-bearing** — `npm run lint:tokens --selftest` is a WRONG COMMAND AT
EXIT 0, measured by the verifier on npm 11.12.1.

## THE MERGE ITSELF

**CLEAN, and predicted before it was performed.** Merge **`f58fc2b`**,
merge-base **`2fc3475`**, main-before **`6404a43`**.
`git merge-tree --write-tree 6404a43 7093652` was run FIRST and predicted
**`69cb3c31`** with no conflict output, exit 0; `git merge --no-ff
--no-commit` produced a staged tree that IS
**`69cb3c31f354149fae2aba47f4fd1eac66b085f4`, byte-equal**, and the merge
commit still carries that tree after its message was amended to the house
shape. `--no-ff`, never a rebase. No reconcile was needed.

**BOTH SIDES ENUMERATED BEFORE MERGING; THE INTERSECTION IS EMPTY, AND
HERE IT IS EMPTY BY DISJOINT TERRITORY RATHER THAN BY LUCK.** **8 branch
files against 36 main-side files**, `comm -12` returns **ZERO**. Main
moved by **20 commits** since the base — all of T-029's lane plus the
architect's STATE commits — and it touched `tools/e2e/tests/` twice
(`resume-fallback.spec.ts`, `shell-harness.ts`) while the branch touched
`tools/e2e/tests/workflow-parity.spec.ts`. **Same directory, different
files**: the one place the two sides could have collided, they did not.

**THE DISPATCH BRIEF'S COMMIT COUNT WAS RIGHT THIS TIME, AND I CHECKED
IT ANYWAY.** The brief said "ONE commit touching exactly three files" of
the IMPLEMENTATION and that is exact; the BRANCH is **three** commits
(`f7e60c7` implementation · `5991375` notes + card + s1 · `7093652`
verdict + s2/s3/s4). The verifier's own range note says "2 commits, 5
files, +760 / −51" and that was TRUE when it was written, one commit
before its own verdict landed. **A range quoted in a verdict describes
the tree the verdict was written against, not the tree you are merging.**

**THE `<main-before>` WRINKLE IS BACK TO MATTERING, one merge after it
did not.** `6404a43..HEAD` = **8 files, +1,236 / −54**. The naive
`2fc3475..HEAD` = **44 files, +8,230 / −1,227** — **5.5× by file count
and 6.7× by insertions**. T-029's merge measured 1.03× and its checkpoint
said plainly that a merge where the rule costs nothing is not evidence
that it never does. **One merge later it costs 36 files.**

## The gates — NEITHER FIRED, and a gate that does not fire is news too

**"The merge's diff" is `<main-before>..HEAD`** (`docs/CONVENTIONS.md`,
`98f931e`). Both triggers below were computed against `6404a43..HEAD`,
never against the merge-base range — which here would have dragged in
T-029's twelve `app/src*` files and fired the boot gate on work that
merged yesterday.

**BOOT GATE (T-046): DOES NOT FIRE, and the trigger was COMPUTED rather
than assumed.** All four classes measured separately against
`6404a43..HEAD`: **`app/src/**` = 0 · `app/src-tauri/**` = 0 ·
`app/package.json` = not present · `app/src-tauri/Cargo.toml` = not
present.** The combined grep exits **1 with no output**. Not skipped —
**unmet**. T-054 touches no `app/` file at all, which was the brief's
claim and is now the measurement.

**No boot transcript appears in this checkpoint, and that is deliberate.**
The previous integrator's correction stands and is worth repeating,
because four checkpoints got it wrong: **`BOOT_EXIT=0` is NOT printed by
`tauri-boot-check.mjs`** — `git grep BOOT_EXIT` finds it under `docs/`
only. It is the integrator's own `echo $?`. A gate that did not run has
no transcript, invented or otherwise.

**GRAPH REGEN: the trigger AS WRITTEN fires, the graph is PROVABLY
unchanged, and I proved it rather than skipping on the rule's wording.**
The trigger is "`*.ts/*.tsx/*.js/*.jsx` outside `docs/`"; the merge
carries exactly one such file, `tools/e2e/tests/workflow-parity.spec.ts`
— so **1 file matches the rule and 0 are INDEXED**, because
`.nputerignore` excludes `docs/`, `tools/` AND
`app/src-tauri/crates/nputer-index/tests/fixtures/`. That over-firing is
**T-054-s1**, filed by this card's own executor. **The honest move is to
measure, not to reason from the exclusion list**, and both instruments
agree:

    PRE-MERGE   cargo run -p nputer-index -- index --check --root ../..
                graph.json is CURRENT ... (554130 bytes, 115 files, 953 symbols, 1468 edges)   EXIT=0
    POST-MERGE  same command, same working directory
                graph.json is CURRENT ... (554130 bytes, 115 files, 953 symbols, 1468 edges)   EXIT=0

sha256 **`5bc40c72c6ec2de65ff5c320f7198baaf4ec85ea70c0ff01a567f07d1e6c8d53`**
— byte-identical to T-029's final regen, `git diff` on `graph.json`
empty, `git status` empty after every `--check` run including the failing
one. **Second instrument, non-golden, `NPUTER_UPDATE_GOLDEN` confirmed
UNSET at the shell** (`env | grep -c` = 0): `cargo test -p nputer-index
--test self_graph -- --ignored` → `self_graph_is_current ... ok`, exit 0.
**Two independent instruments, both green, and no regen was needed or
performed.**

**THE `--root` FALSE RED, PROVOKED ON PURPOSE — FIFTH REPRODUCTION.**
Run without `--root` from `app/src-tauri/`, `index --check` exits **1**:

    [nputer-index] graph.json is STALE - the committed graph does not match a fresh index of this tree
    [nputer-index]   committed:   MISSING at docs/architecture/graph.json

**The HEADLINE says STALE, byte-identical to a real red. `MISSING`
appears only on the SECOND line.** The correction the architect landed at
`145b2b4` is exactly right and this file preserves it; the older wording
("reports the committed graph MISSING") is the one T-054's verifier
flagged, and it flagged the BRANCH's copy, which predates the fix.
**Always read the second line.**

## THE POISON DRILL, RUN UNDER ITS OWN NEW RULE — and T-054-s3 has a THIRD mode

**T-054 is the first card in this project integrated under the POISON
DRILL bullet it itself installs**, which addresses the integrator by
name. The verifier's sweep was 18/18; I did not re-run all eighteen. I
ran **three** drills against the merged tree, aimed squarely at
**T-054-s3**, and the third one is new.

| drill | mutation | subs | intended text? | one-sided? | result |
|---|---|---|---|---|---|
| **A** | `is an INDENTED BULLET` → `…BULLETXX`, GLOBALLY | 3, all correct | yes, `grep`-verified | **NO** | **14 passed — GREEN** |
| **B** | the same, PRODUCER ONLY (`:162`) | 1, correct | yes, verified | yes | **14 passed — GREEN** |
| **C** | `…BULLET` → `…BULLLET`, producer only (`:162`) | 1, correct | yes, verified | yes | **RED 12 and 13, at `:713` and `:739`; 14 stays green** |

**A reproduces T-054-s3 exactly**: the count was RIGHT (3) and the
mutated text was what I intended, and the suite still went green, because
the producer and both assertions share the literal. "Count your
substitutions" cannot catch this, and neither can "confirm the mutated
TEXT" — **I did both and still got a false green.**

**B IS THE NEW ONE, AND IT DEFEATS THE FIX AS PROPOSED.** T-054-s3's
remedy is "mutate the code under test OR the assertion, never a literal
they share, and confirm the mutated TEXT is what you intended". Drill B
satisfies **both** clauses — one-sided, one substitution, text verified —
and **still passes**, because the assertion is `toContain("is an INDENTED
BULLET")` and `"is an INDENTED BULLETXX"` still CONTAINS the needle.
**Appending to a substring needle cannot red a `toContain`.** The missing
clause is a third one: **the mutation must break the ASSERTED RELATION,
not merely change the text** — for `toContain`, that means editing INSIDE
the needle, which is what C does. C also discriminates correctly (12 and
13 red on the indented-bullet needle; 14, the fence test, stays green),
reproducing the verifier's R2 result from the other direction.

**RESTORATION PROVED, NOT ASSERTED**, after every drill:
`git show HEAD:tools/e2e/tests/workflow-parity.spec.ts | shasum -a 256`
= **`100257c931657c32119d1dc1b2d19d4322f55bf1b382a02c941f6428933a40fa`**
= the working file, with `git status --porcelain` and `git diff --stat`
both empty and the spec green at **14 passed** afterwards. **Every drill
ran inline; no scratch script was written**, because the session
scratchpad is shared and a sibling had one clobbered mid-run.

## SUITES ON MERGED MAIN

ADR-011 order, all re-run first-hand, **every expectation DERIVED from
the merged parents BEFORE the run**, **never piped through `tail`**,
exit codes read from `$?`.

- **lib/parser** `npm run build` exit 0 + `npx tsc --noEmit` exit 0 +
  `npx vitest run` → **225/225 (11 files)**, exit 0. **DERIVED: main's
  225 in 11 + the merge's ZERO `lib/parser` files = 225 in 11.** The
  smoke test re-parses the whole live tree at **0 issues**, re-run again
  after this checkpoint's own edits.
- **app** `npx tsc --noEmit` exit 0, `npm run build` exit 0, `npx vitest
  run` → **795/795 (42 files)**, exit 0. **DERIVED: main's 795/42 + the
  merge's ZERO `app/` files = 795/42**, and there was nothing to add.
  The bundle is the strongest form of that claim: `index-Bf-QNmtC.js`
  **497.86 kB** / `index-CryMc_lw.css` **43.90 kB** — the SAME
  content-hashed names T-029's executor, re-verifier and integrator each
  measured, a **fourth** reproduction, and here a proof of IDENTITY
  rather than of determinism.
- **app/src-tauri** bare `cargo test` → **313 passed + 3 ignored, 0
  failed**, exit 0, zero warning lines, summed across **13 test binaries
  + 2 doc-test targets** (**108/0/0/46/123/0/7/13/3/7/0/2/4/0/0**) —
  **slot-for-slot identical to T-029's breakdown**, which is exactly what
  a 0-file Rust diff must produce. No forced recompile was run and none
  was needed: the merge changes no `.rs` file, so a warning cannot have
  moved. **Exactly THREE `#[ignore]` attributes repo-wide**
  (`perf.rs:53`, `self_graph.rs:58`, `agent_runner.rs:1802`), the same
  three as before. **NO MODEL WAS CALLED.**
- **tools/e2e** `npm run typecheck` exit 0 + `NPUTER_E2E_PORT=17420 npm
  test` → **77 passed in 14.2 s**, headless chromium, one worker,
  retries 0, **no skips, no retries, no flakes**. **DERIVED TWO WAYS and
  they agree**: main's 74 + `workflow-parity.spec.ts`'s declaration delta
  (11 → 14) = **77**; and structurally, **77 raw `test(` occurrences
  across the specs, minus THREE false positives** = **74 declarations**,
  of which **71 sit at column 0 and 3 sit INSIDE two-iteration loops**
  (`keyboard-activation:34`, `panel-real-keys:40`, `window-contract:318`)
  = 71 + 3×2 = **77 EXECUTIONS**. The run's own numbering confirms all
  three doubles (#28/#29, #39/#40, #53/#54). **Re-run a second time at
  77** (port 17422) after this checkpoint's `docs/CONVENTIONS.md` edit,
  which is the check that edit needed.
- **`npm run lint:tokens`** → `clean (116 files scanned under app/src,
  app/test, tools/e2e)`, exit 0, **ZERO allowlist**. **DERIVED: main's
  116 + 0** — the merge adds no file under any of the three walked roots;
  `workflow-parity.spec.ts` was already there and a modification cannot
  move a file count. `-- --selftest` → **49 samples green, 14 walk-policy
  checks green**.

**THE E2E COUNTING RECIPE IN THIS FILE WAS WRONG AND IS NOW FIXED.** The
previous version said "**minus ONE** false `test(` positive". There are
now **THREE**, all in `workflow-parity.spec.ts`: the pre-existing
`i.match.test(s.run)` (now at **`:559`**, not `:442` — it moved when the
spec grew) and T-054's two new `/regex/.test(line)` calls inside
`structuralProblems` (**`:160`**, **`:169`**). **The old recipe applied
to this tree lands on 79, not 77.** The verifier caught this and asked
the integrator to carry it; carried.

**`EXPECTED_GRANTS` BYTE-UNCHANGED.** `acl_pin.rs` is a **0-file diff**
and its **whole-file sha256 is
`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e` at
`6404a43`, at `7093652` AND at the merge** — with **92 grant lines**
counted off the declaration at `acl_pin.rs:54`. **No byte count is
quoted**; the whole-file hash is the only form that cannot drift.
`ENV_ALLOWLIST` sha256
**`cf80f850b96a6f03661c2f0871a54b5199ab82eeefb39da29e76c13ef1e7245e`**,
**16 entries, 423 bytes**, unchanged.

**THE CARD'S OWN RECORD IS INTACT TO THE BYTE, RE-CHECKED AFTER MY
STAMP.** `## Verdicts` is **313 lines, sha256 `69fcd4f8b9a450cc…`** and
`## Acceptance criteria` is **132 lines, sha256 `6b5463d590de1c10…`** —
both **identical at the branch tip `7093652` and on merged main after
`status: building → done` was written**. No criterion moved on the branch
and none moved at the merge.

## `.github/` READ ADVERSARIALLY

**One step ADDED, two steps REWRITTEN, one `working-directory:` added,
and nothing else.** The new step is
`cargo run -p nputer-index -- index --check --root ../..` with
`working-directory: app/src-tauri`. **`permissions: contents: read` at
workflow level is byte-unchanged** (`:40-41` before and after, and the
comment above it forbidding a widening is untouched). **All four `uses:`
are still pinned by full 40-hex commit SHA and are the same four SHAs**:
`checkout@3d3c42e5…` (v7.0.1), `setup-node@82076278…` (v7.0.0),
`cache@55cc8345…` (v6.1.0) twice — verified by length AND by
`^[0-9a-f]{40}$`, not by eye. The diff adds **no** secret, token,
permission or network line; the new step runs a workspace-local crate
through the existing lockfile and fetches nothing. `.github/` contains
exactly one file. The lane PINS the new step by name, so it cannot be
quietly dropped.

## T-054-s4 — THE GATE THIS CARD ADDS CANNOT RUN YET, AND I TOOK ITS CLOSER

**Say this plainly, because "CI checks this" has been load-bearing in a
lot of reasoning this week and THIS REPO HAS NEVER ONCE RUN CI.**
`git remote` returns **zero remotes** — I ran it at session start — and
`docs/CONVENTIONS.md` itself says the workflow is "dormant until the
repo's first GitHub push". So between `f7e60c7` and that push, the
hand-run byte-comparison is retired while the CI step **cannot execute**,
and the new GRAPH REGEN bullet's "the property is held by a gate instead
of by a written ritual" was true in the **future tense only**.

**The verifier was right that this is not a rejection** — what retired is
the confirming re-run, not the regen; a failed regen reds `cargo test` on
its own; `index --check` is documented one section above as the
GRAPH-CURRENCY GATE; and the lane pins the step so it cannot be dropped
before the push. **The property is enforced by less than the bullet
claimed but by more than nothing.**

**I TOOK the one-line closer, and this is the integrator judgment call to
argue with if you disagree.** `docs/CONVENTIONS.md`'s GRAPH REGEN bullet
now carries: *UNTIL THE FIRST PUSH THAT GATE IS WRITTEN BUT DORMANT
(T-054-s4, closed here) … Until a runner exists, RUN IT YOURSELF at the
checkpoint — `cargo run -p nputer-index -- index --check --root ../..`
from app/src-tauri — and record the verdict there.* **Why take it rather
than file it**: the bullet as merged makes a false claim to the exact
person it addresses, and a rule that tells an integrator a gate holds a
property when no gate can run is the class of thing this project calls a
defect. **Why it was safe**: GRAPH REGEN lives under `## Gotchas`
(`:224`), and the parity spec derives ONLY from `## Build & test`
(`:3-119`), so the edit cannot move the derived step list — and the full
lane was re-run at **77 passed** afterwards to prove it, plus the parser
over the live tree at 0 issues. **T-054-s4's file stays `status:
suggested`**, per the standing convention that suggestions are
dispositioned at triage and not by the integrator; this checkpoint is the
record that its remedy is applied.

**And it is applied to this very merge**: the verdict recorded above —
CURRENT, 554130 bytes, exit 0, both instruments — IS what the new clause
asks for.

## WHAT THIS MERGE DID TO THE HUMAN'S RUNNING APP

**NOTHING TO THEIR CODE, AND THIS IS THE FIRST MERGE IN A WHILE WHERE
THAT IS LITERALLY TRUE.** `git diff --name-only 6404a43..HEAD -- app/`
is a **0-file diff**. No file under `app/src/` changed, so vite had
nothing to recompile; no file under `app/src-tauri/` changed, so there is
no new Rust sitting unloaded on disk beyond what T-029 already left
there. The app ran out of the MAIN checkout throughout — `node` pid
**82549** on `[::1]:1420`, under `npm run tauri dev` pid 82342 / tauri
node pid 82364 — **the same three pids at session start, after the merge,
after every suite and at the end.**

**ONE CHANNEL DID REACH THEM, AND IT IS THE DOCS WATCHER, NOT VITE.** If
they have this repo open as a project, `docs_watch` collects every `.md`
under `docs/`, so this merge's `docs/CONVENTIONS.md` and its five
`docs/tasks/` files — and this checkpoint's `docs/STATE.md` — arrive in
their window as a docs SNAPSHOT. That is a data update to a live board,
not a code reload, and it happens at every checkpoint by construction.
**It is worth naming because "the app was untouched" has been said
loosely**: the bundle was untouched; the content the app renders was not.

**1420 was never bound, connected to or signalled.** The only interaction
at any point was read-only `lsof`, run at session start, after the merge,
before the e2e lane, after the e2e lane, after the drills and at the end
— **one listener, healthy, every time**. Scratch ports: the e2e lane took
**17420**, the poison drills **17421**, the confirming re-run **17422**;
all three `lsof`-empty afterwards, and no stray `tauri dev`, `vite` or
boot-check process survives beyond the human's own app.

**THE PARSER `dist/` WAS A MEASURED NO-OP for the third merge running.**
`app/node_modules/@nputer/parser` is a **symlink** to
`../../../lib/parser` whose `exports` point at `dist/`, so ADR-011's
required `npm run build` in `lib/parser` can rewrite what the RUNNING app
parses with, without a single file under `app/` being touched (T-052's
instance 5). **Here it did not.** `git diff 6404a43..HEAD -- lib/parser`
is EMPTY, so the required build was a genuine no-op: dist **48 files
before and 48 after**, compared **per-file** rather than by rollup —
**ZERO files differ** — and the symlink itself is intact.

**THE WINDOW IS STILL 800×600 AND STILL NEEDS A RELAUNCH.** Unchanged by
this merge and still true: T-051's 1280×840 and T-029's four new Rust
commands are on disk and not in their process.

**WHAT WAS NOT DONE, and why.** **No `npm ci` or `npm install` was run
anywhere in `/Users/ujju/Projects/nputer`.** All five suites ran against
the EXISTING `node_modules`. A fresh install in this checkout removes
`node_modules` under the human's live vite and kills the app — T-052's
mechanism B, which has happened. **AND NO SCRATCH-WORKTREE FRESH-INSTALL
PROOF WAS TAKEN THIS MERGE, DELIBERATELY.** The four previous walks of
that route all covered merges that changed installed code; this merge's
diff is **zero `package.json`, zero lockfile lines, zero `app/`, zero
`lib/`** — four measured 0-file diffs — so a fresh install could only
reproduce numbers that are already reproduced, at the cost of a 2.3 GB
cold cargo build. **This is a note, not a silence**: the route is
documented four times over and the next merge that moves installed code
should walk it again. **T-063 is that merge.**

## INTEGRATOR JUDGMENT CALLS, recorded

- **ROADMAP: NOT EDITED.** The discriminator ("does the task add a USER
  CAPABILITY") is **not met** — T-054 changes the METHOD, and no user can
  do anything today they could not do yesterday. Precedent agrees:
  T-053, the last non-capability card, left ROADMAP alone. **But I read
  one sentence adversarially before deciding.** The F-06 backbone bullet
  says the binary's drift signal *"now reaches the command line and CI,
  not only the map pane"* — written at T-014, when `nputer-index`
  appeared **zero** times under `.github/`. **T-054 makes half of that
  clause a wiring fact for the first time**; the other half,
  `arch drift --fail-on`, **is still unwired by design** (CONVENTIONS
  now says so explicitly: the registry carries live undeclared edges on
  purpose). I left the sentence alone because it reads as a capability
  claim and is defensible as one, **but a triage that wants it exact
  should split it.**
- **ARCHITECTURE: NOT EDITED, and for a reason rather than by default.**
  No component changed what it IS. C-07's row already documents
  `index --check` as a gate that "writes nothing; exits non-zero on a
  stale graph and prints WHAT moved" — T-054 changes **who calls it**,
  not what it is. The code-layout paragraph already says
  `.github/workflows/` is "the one CI job (T-020), **a thin invoker of
  the CONVENTIONS commands**, dormant until the repo's first push" —
  which is the sentence T-054 makes MORE true (two divergences closed)
  and which **already carries the dormancy T-054-s4 names.** Nothing to
  repair.
- **THE REGISTRY: NOT EDITED.** T-054 declares no component, adds no
  file to the index, and moves no edge.
- **NO NEW ADR (three-prong).** (a) T-054's decisions — a CI step, three
  CONVENTIONS bullets, a retirement — are all CONVENTIONS-level pipeline
  rules, the class this file's open questions already ask whether
  `method/` should NAME; none is a new architectural shape. (b) Prong two
  verified MECHANICALLY: **zero new dependencies and zero lockfile
  lines** — `package.json`, `package-lock.json`, `Cargo.toml`,
  `Cargo.lock`, `capabilities/**`, `gen/**`, `tauri.conf.json`,
  `method/**` and `lib/**` are **all 0-file diffs**. ADR-011 holds
  (parser built before app). ADR-003 holds — **no model call was made**.
  ADR-016 holds for the fourth merge running and needed nothing from the
  integrator: `built_by`, `verified_by`, `review: same-model` and the
  verdict were all on the branch before I arrived, and **nothing was
  transcribed** — I hashed the sections instead. The register ends at
  **ADR-017**. (c) Prong three: the durable calls live in the card's
  criteria→evidence map and its committed verdict.
- **THE TASK FILE'S STAMPS WERE COMPLETE except the one that is mine.**
  Only **`status: building → done`** was written. **`status: building` on
  the branch was CORRECT and not a defect**: the architect's ruling at
  `9d30d0e` (executors stamp `verifying`) explicitly exempts cards
  already in flight, and T-054 was dispatched before it. Parser-validated
  after: **0 issues**, `T-054 status: done`.
- **`touches:` LEFT ALONE**, and it was already right —
  `[docs, method, tools/e2e, ci]`. Fields lock at `status: building`
  (TASK-FORMAT § Lifecycle). **No file in this merge belongs to any
  component**, which is unusual and correct: `.github/`, `docs/` and
  `tools/e2e/` are all outside the registry's territory by design, and
  `tools/` is `.nputerignore`d out of the map.
- **THE CONTROL-BYTE HABIT WAS RUN AND IS CLEAN, in its corrected form.**
  `file --mime` over all **nine** files this merge and this checkpoint
  wrote — every one `charset=utf-8` — and a C0 sweep excluding tab,
  newline and CR returns **0 bytes across all nine**. **The old written
  form, *"none classified `data`"*, is unsound and stays retired**, and
  this merge gives it a SECOND counter-example: `file(1)` labels
  `graph.json` as `JSON data` on every merge that regenerates it, and it
  labels **`workflow-parity.spec.ts` as `text/x-java`** — a TypeScript
  spec, misidentified. **The type label is unreliable in both
  directions; the CHARSET is the field that answers the question.** Say
  `file --mime` and read the charset. The habit is now
  **thirteen-for-thirteen** and it found nothing here.
- **THE SHARED-INDEX HAZARD did not recur.** `git diff --cached --stat`
  was read before **both** commits and the staged set was exactly this
  session's each time (8 at the merge, byte-matching the branch's own
  `2fc3475..7093652` shortstat). **Two sibling worktrees were live
  throughout — `../nputer-T-063` and `../nputer-T-060` — and NEITHER was
  touched**; the only writes outside `docs/` were the three poison
  mutations, each restored and each proved restored by sha256. House
  shape held: **merge → checkpoint, two commits.**
- **`cargo audit` NOT RUN, and the reason is stated rather than
  implied.** It is the one network-touching command and it fetches the
  RUSTSEC DB per run. `Cargo.lock` is a 0-file diff, so the 2026-08-16
  baseline — 0 vulnerabilities / 17 informational over 472 locked crates
  — cannot have moved. **This is the merge that makes CI's own audit step
  matter more, and CI still cannot run it.**

## In progress / broken right now

**TWO LANES ARE LIVE, AND ONE OF THEM IS READY TO MERGE RIGHT NOW.**
Worktrees are open — if this session dies, these are the first thing to
look at:

    ../nputer-T-063   task/T-063-startup-says-so   143a5ce  APPROVED, awaiting integration
    ../nputer-T-060   task/T-060-resolver          00b27f0  BUILDING

**T-063 IS APPROVED AND IS THE NEXT MERGE.** Tip **`143a5ce`** ("T-063
VERIFIED: APPROVED — nine criteria re-derived, the green poison
re-proved, the log line measured on a real app"), **14 files** off its
base, **seven** suggestions filed (s1…s7), `touches: [app-shell]`,
`review: same-model`, `status: building` on the branch (correct — the
`verifying` ruling exempts in-flight cards). **It advanced twice while
this merge ran** (`3e2318c → 6e79db9 → 143a5ce`) and was not touched.
**Three things for its integrator, all measured here.** It changes
`app/test/startup-recovery.test.ts` and `app/test/startup-screen.test.tsx`,
which ARE indexed — **so GRAPH REGEN fires for real, with a regen, and it
is the first merge under T-054's new rule, which says commit the graph
WITH THE CHECKPOINT.** It changes `app/src/App.tsx` and
`app/src-tauri/src/lib.rs`, so **the BOOT GATE fires on both classes.**
And it is the first merge since T-029 to move installed code, so **the
scratch-worktree fresh-install proof is owed again.**

**T-060 IS BUILDING, and its lane is the eighth worked example of the
rule T-054 just wrote down.** The worktree is cut at **`6404a43`** —
which is `Checkpoint: T-029 done`, **the newest `Checkpoint:` commit on
main, not the merge above it**. DISPATCH FROM THE LAST CHECKPOINT,
honoured before the bullet existed. **It advanced while this merge ran**:
it had no commits when I started and carries **`00b27f0`** by the time I
finished ("retire the resolved-binary cache, gate the probe, name-check
`$SHELL`", **2 files** — `app/src-tauri/src/agent/runner.rs` and
`app/src-tauri/src/lib.rs`). Its card is still `status: planned` on both
sides, so the executor has not stamped yet. **Its base is now one merge
behind**; that is normal and its integrator derives `<main-before>` at
merge time. **It touches `app/src-tauri/**`, so its merge fires the BOOT
GATE and — being all-Rust so far — NOT the graph regen.**

**THE T-054 WORKTREE IS REMOVED and its branch KEPT.**

**THE ARCHITECT'S `verifying` RULING STANDS** (`9d30d0e`).
`method/roles/executor.md:18` says an executor sets **`status:
verifying`** on handoff (or `done` for size S); every dispatch written
this week said `building`, and every executor obeyed the dispatch over
the method. **The method is right.** `building` means someone is actively
building it, which is FALSE the moment the executor stops. Applied from
the next dispatch onward; **cards already stamped `building` are left
alone** — T-054 was one of them and T-063 is another. **`verifying` is
still one of TASK-FORMAT's eight statuses that has NEVER been used**, and
the board's `0 building / 0 verifying` on main while two lanes are live
is the same gap restated.

**THE OVERNIGHT GRANTS (human, 2026-08-17, before sleeping).** Recorded
here because a successor session must not re-ask:
- **Four lanes approved**: **T-054**, **T-063**, **T-060**, **T-062**.
  **T-054 is now DONE**, so three remain.
- **Triage-born cards may dispatch from the ranked queue WITHOUT further
  approval.** Every card still goes executor → adversarial verifier →
  integrator; a second rejection on the same card PARKS that lane with
  the record intact.
- **Three parallel lanes**, matching the load that held (~10 on 10
  cores). **T-054's lane just freed**, so with T-063 awaiting integration
  and T-060 building, **one lane is free right now**.
- **QUEUE, and the reason each waits**: **T-062** waits on **T-063**
  (both declare `app-shell`), and T-063 is APPROVED, so **T-062 unblocks
  the moment T-063 merges**. **T-060 is running** and holds `app-agent`.
  The method forbids parallelizing overlapping `touches` and this is the
  live application of it.

**THE HUMAN'S APP IS RUNNING ON 1420** (node pid **82549**, under
`npm run tauri dev` pid 82342), relaunched DETACHED — an earlier launch
died when its background task was torn down, taking the app with it.
Every agent is briefed to probe it read-only and never bind, connect to
or signal it. **The integrator who takes T-063 inherits T-052's hazard
live**: main's `node_modules` sits under a running vite, so a fresh
install there kills the app (mechanism B). Run installs in a scratch
worktree at the merged commit — **that route is walked four times and
documented** — or refuse loudly. **T-063 changes `app/src/` and
`app/src-tauri/`, so unlike T-054 it WILL hot-reload under them.**

**T-054 FILES FOUR, and one has its remedy applied by this checkpoint**:

- **T-054-s1** — the GRAPH REGEN trigger says "outside `docs/`" but the
  indexer also ignores `tools/` and the nputer-index fixtures, so a diff
  confined to `tools/**` matches the rule and cannot move the graph by
  construction. **This merge is its first live instance** and the honest
  answer was to measure the graph rather than to skip on the wording.
- **T-054-s2** — the `·` trap is **LOUD**, not silent, for a command the
  spec already claims: with the draft's `·` legend the exposed list drops
  19 → 16 and the lane REDS, naming all three lost commands by key. It is
  silent only for a doc-side addition the spec does not claim. **The rule
  the notes derive is right and lives nowhere the next editor will
  read** — not in CONVENTIONS, not in `commandBullets`' docstring. That
  is the part worth fixing.
- **T-054-s3** — **the POISON DRILL bullet does not say a mutation must
  be ONE-SIDED**, and it bit the verifier on its first drill. **This
  checkpoint sharpens it with a THIRD mode, measured above**:
  one-sidedness is necessary and NOT sufficient, because appending to a
  `toContain` needle leaves the needle a substring. **The clause needs
  all three limbs**: mutate one side only, confirm the mutated text, and
  **break the asserted RELATION.**
- **T-054-s4 — REMEDY APPLIED** (see its own section above). The finding
  stays filed at `status: suggested` for triage, because the underlying
  fact — **CI has never run and there is no remote** — is not closed by a
  doc clause.

**T-029's NINE, T-028's SIX and T-051's NINE remain undispositioned** and
are the next triage's, unchanged by this merge. Of T-029's, **s8** (the
declined diagnosis relays nothing — one `push`, no unverified vocabulary)
is still the one to fix first and **T-060 should pick it up**, and **s5**
still cannot close without an authenticated machine. Of T-028's, **s6**
is still the highest-value item in that set: `app/tsconfig.json` shares
an ambient `.d.ts` between `src` and `test`, so ADR-017's free
typecheck-level guard against the app writing to disk is GONE. Of
T-051's, **s7 and s8** are still the class that does the most damage
unread, because both are CORRECTIONS to claims already written down.

**THE CONTROL-BYTE HAZARD stands at THIRTEEN reproductions across five
sessions.** The habit is **thirteen-for-thirteen** and it found nothing
this merge. Still no gate; T-058 owns it.

## Next up (1–4)

1. **DISPATCH ORDER.**
   - **MERGE T-063. It is APPROVED and waiting**, and it is the only item
     in the whole backlog with a real user report attached. Its
     integrator gets the first REAL exercise of T-054's new rules: a
     graph regen committed **with the checkpoint**, a boot gate that
     fires on both classes, and a local `index --check` recorded at the
     checkpoint because CI still cannot run one.
   - **T-062 unblocks the moment T-063 merges** (both `app-shell`).
   - **T-060 is running** and holds `app-agent`. It should also pick up
     **T-029-s8**, a one-`push` close in the same file.
   - **ONE LANE IS FREE.** **T-055** in lib-parser is the natural taker;
     beside it T-057, T-058, T-059 (`blocked_by: [T-033]`, and it
     DISSOLVES if that ruling moves `arch` to the Node CLI), and T-065.
     **Read T-062 and T-065 together** — T-062 changes the shell's scroll
     model and will move exactly the numbers T-065's corrected criterion
     4 names.
   - **Then T-061** (a demonstrated orphaned listener — it did not recur
     at this merge either; no boot check ran and no stray survived the
     e2e lane) and **T-064**.
   - **T-010 is more interesting than its position suggests** — it makes
     `languages: ["ts"]` false, indexes the 44 `.rs` files and turns the
     four unclaimed ones into live unmapped-territory findings. **T-054
     sharpens the case**: the graph-currency gate is now a CI step, and
     it gates a graph that cannot see a single line of Rust.
   - **Still un-homed, and NOT one of the 66**: the
     **Tailwind/`app/src-tauri` finding** from T-014's merge — a Rust
     identifier in the shipped CSS, invisible to every gate because no
     walk sees that directory. **T-058 is its natural neighbour**; fold
     it there or file it, but do not let a fourth triage lose it.
   - **Carried and still un-homed**: a rolled-up `find … | xargs shasum`
     hashes PATHS as well as bytes, so any standing "did I disturb it"
     check on the `app/node_modules/@nputer/parser` symlink must fix the
     convention or compare per-file. **Three merges running have compared
     per-file and had no trouble.** T-052's neighbourhood.
   - **NEW, and small: T-054-s2's rule has no home.** The `·` truncation
     rule lives only in one card's implementation notes. It belongs in
     `commandBullets`' docstring or in CONVENTIONS beside the parity
     bullet, and the next editor of either will not find it.
2. **@human — THE MORNING'S AGENDA. The app IS running and this merge
   left it running, untouched.** T-054 changes **zero** files under
   `app/`, so unlike yesterday nothing hot-reloaded under you and no new
   Rust landed on disk. **YOUR WINDOW IS STILL 800×600 AND STILL RUNNING
   YESTERDAY'S RUST.** `tauri dev` does not hot-swap the binary, so
   T-029's four new commands are on disk and not in your process.
   **Relaunch** — you want it for T-051's 1280×840 anyway, and without it
   none of T-029's resume, fresh-session or hand-driven affordances can
   fire. You pick up everything at once: T-042's genesis truthfulness,
   T-014's 23 CSS bytes, T-027's entire screen, T-028's crescendo, and
   the interview that survives being closed.

   **READ THIS BEFORE OPENING A GENESIS FOLDER.** The interview
   auto-starts on arrival, and on this machine the CLI login is revoked,
   so the first turn fails. **Run `claude login` first.**

   **THE CORRECTED AUTH TRACE (architect, 2026-08-17, correcting
   itself).** An earlier version said the screen "says exactly 'the
   planner exited with code 1', shows no detail at all" and that "nothing
   points at the login". **Three of those five steps do not survive
   reproduction**, and one command settles it:
   `an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail`
   (`app/src-tauri/tests/agent_runner.rs`) asserts
   `stderr_tail.contains("401")` and passes on main. The error was
   reasoning from "stderr is empty" — true — to "`stderr_tail` is empty",
   which is false. **`stderr_ring` is not a stderr ring**: it has THREE
   writers, and T-025 wired the in-band lines into it deliberately. What
   the screen ACTUALLY showed on `bdecad8` was "the planner exited with
   code 1" over the CLI's own words as an escaped one-line blob. **The
   criterion's own wording — "a TYPED outcome rather than a relayed blob"
   — was the accurate one all along**, and **T-029 has now closed it**.
   The lesson stands and is worth more than the fix: **a trace written by
   reading code is evidence to reproduce, exactly like a number in a card
   body.**

   To reach the interview at all a folder needs NO `docs/ROADMAP.md` and
   NO `docs/tasks/*.md` (`PlanProbe::has_plan`, `docs_watch.rs:414` — an
   `ARCHITECTURE.md` alone is still genesis-eligible). There is no
   `genesis-demo` folder anywhere on disk; `mkdir` one.
   - **THE MILESTONE CLOSER, AND IT IS STILL THE ONLY THING LEFT:**
     **a real, timed, end-to-end genesis on a toy idea** (T-028's
     criterion 2, target ≤30 min), judged live, with **light and dark
     completion screenshots**. It needs `claude login` first. **It is
     yours and nothing else can substitute for it.**
   - **T-029's FOUR JUDGMENTS**, all headless-invisible: the hand-driven
     block in LIGHT AND DARK (a copyable kickoff in a code-ish block —
     does it read as an invitation or as an error state? it has no design
     source); the resume offer (does it read as "pick up where you left
     off" or as a dialog in the way?); the auth failure now that it has
     an action (`claude login` plus the hand-driven route — a real option
     or a consolation prize?); and the rehydrated transcript (does the
     conversation look like the one you left, or like a log?).
   - **T-028's FIVE and T-027's SIX are unchanged** and still yours: the
     completion panel in light and dark (no design source at all); the
     board at 640–800px; the rain at fifty cards; "the board, so far" as
     the overline; whether the completion panel belongs above or below
     the board; the one-question-at-a-time feel; the challenge treatment
     in both schemes; the eight disclosed deviations, especially the
     line-height gap; the 640/lens balance at 1280 and 1440;
     **T-051-s3 (840 vs 867, the ~28px macOS title bar)**; and whether
     the header reads as the design's "nputer — new project".
   - **ONE REAL OBSERVED PLANNER TURN** — still the biggest unobserved
     thing in the project and the ONLY thing between milestone 3 and an
     honest claim. **T-025-s2 carries the exact command.**
   - **The at-a-glance amber judgment**; **the launch shot**; **T-023's
     dry-run transcript quality**; **a Linux run**.
   - **T-050-s2 still matters most of the older set**: escaping the
     failure screen with "Open a folder…" rather than "Try again" reaches
     a board with real content that is **silently dead**.
   - **The six T-034 judgments**, of which **WAVE 0 IS A WALL
     (T-034-s1)** is the big one: 32 of 50 cards in one wave, a
     1440×3818 canvas in a ~600 px pane.
   - **The model badges should be SHORT** (T-030-s1); **the header's
     density** (T-049's item); **T-024's pane light AND dark**;
     **T-026's front door light AND dark** (read **T-048-s4 BEFORE
     T-048-s3** — s3's conclusion is wrong); the real picker flows; the
     `tauri dev` quit-the-app orphan check.
   - **The T-047-s6 stray, a decision not a look.**
     `~/.claude/projects/-private-var-folders-…-t047va-count-97806-…/` —
     outside the repo, deliberately not deleted. **Delete or keep.**
   - **NEW, and a decision only you can make: THE REPO HAS NO REMOTE.**
     `git remote` returns nothing, so `.github/workflows/ci.yml` has
     never executed a single step in this project's life. T-054 just
     added the graph-currency gate to it, and T-020's "watch the first CI
     run" has been on this list for weeks. **Every "CI checks this"
     sentence in these docs is a promissory note until you push.**
3. **MILESTONE 3 (F-03) — THE TASK LIST IS DONE AND THE MILESTONE IS
   STILL NOT CLAIMED.** T-023 → T-024 → T-026 → T-037 → T-025 → T-039 →
   T-041 → T-042 → T-048 → T-049 → T-050 → T-027 → T-051 → T-028 →
   **T-029** are all through the pipeline. **Nothing remains on the
   ROADMAP's list** — though note **T-063 declares `milestone: 3`** and
   is a triage-born card that never joined that list, so "milestone 3 has
   no work in flight" is false as a fact about the board even while it is
   true about the list. And the milestone still cannot be claimed, for a
   reason that has nothing to do with either: **not one planner turn has
   ever been observed against a real model.** This machine's `claude`
   OAuth token is revoked, so no model call has ever gone through the
   runner. **Every stream this app has ever seen is a scripted fixture
   landing in milliseconds** — so the one thing an interview actually is,
   a conversation that takes time with a model that can misunderstand
   you, has never been exercised at all. What EXISTS is a real
   conversation surface with a real event channel, a real file-evidence
   join, a real board handoff and real recovery from being closed;
   whether it is a GOOD interview is unknown. **The evidence it waits on
   is a real, timed, end-to-end genesis run. It is @human's and it is on
   the list above.** Do not claim the milestone before it exists.
   **MILESTONE 4** carries T-010, T-013, T-015, T-053 and now **T-054 as
   its first card through the pipeline this session**. **T-010 is still
   the interesting one** — it makes `languages: ["ts"]` false, indexes
   the 44 `.rs` files, and turns the four unclaimed ones into live
   unmapped-territory findings.
4. **OVERNIGHT DISPATCH GRANTS and the BACKLOG.** Grant 1 (**milestone 3
   to completion**) is **EXHAUSTED — T-029 was its last card.** Grant 2
   closed at T-034; grant 3 (third triage applied) stands, and **tasks
   NEWLY created by triage still do NOT dispatch without the human.**
   Unchanged method rules: a second REJECTED parks a lane for the human;
   @human judgments are never self-answered; no screen control beyond the
   ruled boot check; **port 1420 is the human's, and it is OCCUPIED.**
   **THE THIRD TRIAGE IS APPLIED AND STANDS.** It opened at **66 files**
   and closed at **16, every one PARKED with a dated trigger to unpark**:

       66 open  →  37 promoted · 12 folded · 16 parked · 1 rejected
                    1 removed as already-absorbed

   **THE SIXTEEN PARKED are unmoved**: the nine standing (T-003-s2,
   T-008-s1, T-018-s1, T-021-s1, T-025-s2 @human, T-025-s3, T-025-s4,
   T-026-s1, T-038-s1) plus seven new — T-014-s5, T-030-s1 (@human),
   T-034-s1 (@human), T-034-s4 (@human), T-045-s3, T-046-s3, T-047-s2.
   **The test that moves them**: *what merged recently that makes this
   item's "not live yet" clause false?* **T-054 is a worked example for
   the next triage**: any parked item whose premise was "nothing gates
   graph currency", "the poison drill is unwritten" or "CI spells the
   commands its own way" has just expired — **and any item premised on
   "CI will catch it" has just been shown to be premised on nothing.**
   **LANE AVAILABILITY.** `crate-index` **FREED by T-054** (**T-010**,
   **T-013**, **T-015** behind it). `app-agent` HELD by T-060 (T-043
   behind it); `app-shell` HELD by T-063 (**T-062** queued behind it, and
   the standing queue's next named item there is **T-022** — M, milestone
   4, `blocked_by: []`, which T-034-s3 made bigger); `app-interview`
   FREE; `lib-parser` FREE (**T-055**, **T-031**, **T-032** — and
   **T-032 carries T-034-s7**, a criterion that reads as an instruction
   to type a control byte and **should be amended BEFORE it is built**);
   `app-map` free (T-013, T-015, T-032's map-badge half); `app-board`
   free.

## Health of the tree

The T-054 worktree is removed and its branch KEPT. Main tree clean; every
suite green; the token lint green over 116 files at zero allowlist; **the
committed graph current and proved so TWICE by two independent
instruments, before AND after the merge, at a byte-identical sha** — and
this is the first checkpoint where that verdict is recorded because a
CONVENTIONS bullet now asks for it. The parser re-parses the whole live
tree at **0 issues**, including this checkpoint's own edits and the
merge's five new `docs/tasks/` files.

**THE BOARD, as MAIN sees it**: **113 task files**, tally **43 done / 22
planned / 16 parked / 32 suggested / 0 building / 0 verifying**, plus
**9 in `rejected/`**. 6 features, 11 components. **109 → 113 is T-054's
four suggestions**; **42 → 43 done and 23 → 22 planned is T-054 itself.**
**Two worktrees ARE open** (T-063 APPROVED, T-060 building), so the board
on main showing nothing in flight is a LIMIT of the board, not a fact
about the work — the gap the `verifying` ruling names.

**A COUNT THIS FILE HAS BEEN CARRYING IS CORRECTED.** It said "41 task
branches merged". Measured: **43 merge commits matching `^Merge T-`**,
covering **42 DISTINCT task ids** — **T-014 was merged twice**. And
neither figure reconciles with the 43 `status: done` cards: **T-040 is
`done` with no merge commit of its own.** Three plausible numbers, one
command each; **quote the measure, not the number.**

**PORTS: 1420 IS OCCUPIED AND THAT IS DELIBERATE.** The architect's app
runs out of the MAIN checkout (node pid 82549, one listener). **Every
agent has been briefed to probe it read-only and never bind, connect to
or signal it**, and every lane, verifier and integrator has honoured it —
T-029's five lanes on 15420…15490, its merge's 17420/17430/17440,
T-054's verification on **17540**, and this merge's **17420** (lane),
**17421** (poison drills) and **17422** (the confirming re-run).
**Fourteen distinct scratch ports across six sessions and not one of them
1420.** No OTHER listener is bound; no stray `tauri dev`, `vite` or
boot-check process survives beyond the human's own app. **T-052's problem
stays live for whoever takes T-063.**

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. **T-054's security posture was verified rather than
argued**: zero new dependencies, zero lockfile lines, zero grant movement
(`acl_pin.rs` a 0-file diff with a whole-file sha identical at three
refs, 92 grants), `ENV_ALLOWLIST` byte-identical, `capabilities/`,
`gen/`, `tauri.conf.json` and `adapter.rs` all 0-file diffs, and the one
file that DID change in a privileged position — `.github/workflows/ci.yml`
— read adversarially above: `permissions: contents: read` unchanged, four
`uses:` still 40-hex pinned to the same SHAs, no secret or network line
added, one workspace-local crate invoked through the existing lockfile.
The sharpest open set is otherwise unchanged and still app-agent's:
**T-047-s5**, **T-047-s6**, **T-047-s4**, **T-047-s1**; beside them
**T-046-s1**, **T-041-s4** and **T-029-s5**, which cannot close without
an authenticated machine. **T-060 is the card that would close most of it
and it is now RUNNING.**

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020), and it
matters more today than it did yesterday. **T-054 adds ONE step**
(`cargo run -p nputer-index -- index --check --root ../..`, from
`app/src-tauri`) and REWRITES two (`Token lint` ×2 → `npm run
lint:tokens`, and `xvfb tauri boot` → `xvfb-run -a npm run boot:check`
with `working-directory: tools/e2e`). **All three are unproven on a real
runner**, and the boot step now has an `npm` layer between `xvfb-run` and
`node` — the verifier measured exit-code fidelity through it (a refusal
returns 3 either way, identically, probing and spawning nothing) and read
repo-root resolution from source (`import.meta.url`, never
`process.cwd()`), which is as far as a headless machine can go. The rest
of the cautions are unchanged: T-027's, T-051's and T-028's lane specs
measure **geometry and animation** against a real bundle and real CSS,
and font metrics, scrollbar widths and animation timing are not identical
across platforms — **read T-051-s8 and T-051-s9 first if a lens or window
assertion reds**; the ubuntu apt/webkit2gtk set; the four `uses:` SHA
pins; the `e2e types` step (still never executed on any runner); T-034's
`map-tasks-lens-dom.test.tsx` and T-051's `window-manifest.test.ts` both
reading the BUILT stylesheet, so **build-then-test ORDER is
load-bearing**; T-014's nputer-index watch timings measured on FSEvents;
`cargo audit`; the xvfb boot check; and the THREE T-018 SENTINEL live
tests.

## Open questions

- **NEW, and the sharpest one this merge raises — WHAT IS A RULE WORTH
  THAT NAMES A GATE NOBODY CAN RUN?** T-054 is a good card and it is
  APPROVED on its merits, but its central sentence — "the property is
  held by a gate instead of by a written ritual" — was **false on the day
  it merged**, because there is no remote and CI has never executed. I
  patched the sentence; I did not patch the condition. **The general form
  is the question**: this repo's documents are full of "CI runs this",
  and every one of them is a promissory note. **Should a rule that
  delegates a property to CI be required to state, in the rule, what
  holds the property until CI runs?** One clause per rule, and it would
  have caught this before a verifier had to.
- **NEW — is one-sidedness the right formulation of the poison rule?**
  Measured here: **no, not alone.** Drill B was one-sided,
  single-substitution and text-verified — and green, because `toContain`
  matches a substring and the mutation appended to the needle. **The
  property that actually discriminates is "the mutation must break the
  ASSERTED RELATION"**, which is harder to state and impossible to
  automate. T-054-s3 should carry all three limbs. **This is the second
  night running that the poison practice found a defect in the poison
  practice.**
- **What does the pipeline owe a task whose VERIFIER vanishes
  mid-flight?** **Carried forward, and the practice has now held FOUR
  times running.** T-051's, T-028's and T-029's verifiers all committed
  their verdicts and stamps before ending; **T-054's did the same**
  (`7093652` carries verdict, stamps and three findings in one commit),
  so this integrator verified ADR-016's marks by HASH and transcribed
  NOTHING. T-053 remains the only counter-example. **Four-for-four is a
  habit, not an enforcement** — nothing in TASK-FORMAT requires the
  stamps to be the verifier's last act. **The cheap fix is one clause in
  TASK-FORMAT**; the architect's call (ADR-004).
- **What does the pipeline owe the RECORD of a rejection?** Carried
  forward from T-029 unchanged: should a re-verification be REQUIRED to
  hash the prior verdict? T-054 had no rejection, so it adds no data on
  the rejection half — but it shows the cheap version generalises.
  **Hashing `## Verdicts` and `## Acceptance criteria` across the branch
  tip and the post-stamp merge cost one command each and proved the
  record intact through an integrator's own edit.**
- **Does the BOOT GATE rule retire, and when?** Carried forward. T-054
  adds the cheapest possible data point: it is the **first merge in a
  while where the trigger is genuinely unmet**, and computing the four
  classes took one command and produced a real answer. **A gate whose
  non-firing is this cheap to establish carries a low standing cost**,
  which weakens the retirement case slightly. Left for triage.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** **Live, and T-054 makes it louder rather than answering it.**
  `method/roles/executor.md` still says only "run the test commands from
  CONVENTIONS.md until green", while **SEVEN** rules now share the
  trigger → command → record → IF-it-cannot-run → why shape (GRAPH REGEN,
  BOOT GATE, POISON DRILL, DISPATCH FROM THE LAST CHECKPOINT, THE E2E
  LANE'S HONEST SCOPE, the audit gate policy, the CI parity rule).
  **T-054 added three of them and `method/**` is a 0-file diff.** A
  method version bump, not an ADR.
- **When does the C0/searchability rule become a gate?** Unchanged in
  substance, still **THIRTEEN reproductions across five sessions**, habit
  **thirteen-for-thirteen**. Still no gate; T-058 owns it. **The "which
  walk sees this file" question got a cleaner answer this merge**: of the
  merge's eight files, the graph's walk saw **0**, the token lint saw
  **1** (a modification, so its count did not move), and the parser's
  live-tree walk saw the **five** `docs/tasks/` files. **Three walks,
  three different answers about the same eight files, and no document
  states them side by side.**
- **Does the shared main working tree need a rule?** Carried forward with
  a **FIFTEENTH face, and it is the mirror of T-029's.** T-029 disturbed
  the app half way (frontend hot-reloaded, Rust did not) and said so.
  **T-054 disturbs the CODE not at all — 0 files under `app/` — and yet
  it is not "no disturbance": every `.md` it writes under `docs/` lands
  in their window through the docs watcher.** So the answer shape needs a
  fourth entry: *nothing you are running changed; what you are LOOKING at
  did.* Method/process, so the architect's (ADR-004).
- **When does spawn hygiene become an ADR?** Unchanged: when T-047-s5
  lands.
- **Does a verifier's remedy belong in an acceptance criterion?**
  Carried forward, **FOURTEENTH data point, and T-054's is instructive in
  a NEW direction.** T-054's verifier wrote three findings, each with a
  one-line remedy, and **one of those remedies (s3's) turns out to be
  incomplete** — measured above, by running it. **A remedy in a finding
  is still worth far more than a bare complaint**, but this is the first
  instance where the remedy itself needed verifying. *A remedy is a
  claim, like any other.*
- **Should a card's own numbers be treated as a claim to verify rather
  than a brief to implement?** **T-054 is the ELEVENTH instance in eleven
  merges and the first where the card was right about everything and the
  surrounding PAPERWORK was the thing to check.** The dispatch brief's
  "ONE commit, three files" was exact for the implementation and would
  have been wrong for the branch; the verifier's own range was correct
  when written and stale by one commit at merge time; this file's e2e
  recipe was a merge out of date. **The rule generalises past cards:
  every number arrives attached to the tree it was measured on.**
- **Is a forecast that has to be COMPLETE a reasonable standing bar?**
  Carried forward from T-029, unchanged in substance — T-054 needed no
  fixture forecast, because it moved no indexed file. **The narrower
  question stands and is now overdue: should the dogfood probe be a
  committed tool rather than a throwaway `it()` that each integrator
  re-invents and then deletes?** Five merges have written and deleted
  some version of it. Probably a paragraph in CONVENTIONS plus a small
  script; the architect's. **T-063 is the next merge that will need it.**
- **When a task retires a test, who owns the property it was reaching
  for?** Carried forward from T-045 — **and T-054 is the first card to
  answer it in practice.** It retired a RITUAL rather than a test, named
  the successor in the same commit, and satisfied the retirement
  condition the retired rule itself carried. **That is the shape the
  question was reaching for**, and it is worth writing down before it is
  forgotten: *retire in the same commit as the replacement, and make the
  retired rule's own stated condition the thing you satisfy.* **The
  caveat is T-054-s4**: doing it correctly still left a window in which
  the successor could not run.
- **What does the pipeline owe a task whose builder vanishes
  mid-flight?** Carried forward from T-050, unanswered.
