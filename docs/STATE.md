# State

Updated: 2026-08-18 by integrator (T-063 merged), claude-opus-5 @fresh

## Just completed

**T-063 — a startup that fails says so: on screen, in the log, and to
the next attempt.** F-02, milestone 3, size M, nine acceptance criteria,
absorbing **four** suggestions (T-050-s1, T-050-s2, T-050-s3, T-041-s4).
`touches: [app-shell]`. Built by `claude-opus-5 @fresh`, **APPROVED** by
`claude-opus-5 @fresh`, `review: same-model`, no rejection. Merge
**`827511e`**. Branch **5 commits, 14 files, +1,888 / −48**.

**IT IS THE ONLY CARD IN THIS BACKLOG WITH A REAL USER BUG REPORT
ATTACHED, AND THE REPORT IS THE INTERESTING PART.** On 2026-08-16
@human hit the "waiting for the first docs snapshot…" dead end, sent a
screenshot **and their log — and the log was healthy through seq 22**,
because the thing that broke had no way to write to it.
`recordStartupFailure` ended at a webview `console.error`, and a
WKWebView console never reaches this process's stdout. **The one failure
a user actually reports was the one failure the log could not
describe.** It now reaches the log through a new event, and a deadline
distinguishes a HANG from a REJECTION.

**AND THE HONEST LIMIT, SAID PLAINLY, BECAUSE THE VERIFIER SAID IT
FIRST: THE FIRST 8 SECONDS ARE UNCHANGED.** Until `STARTUP_DEADLINE_MS`
fires, the user sees exactly the sentence from the 2026-08-16
screenshot. That is INSIDE the fence — the "say how long it has been
waiting" intermediate was owed only if N could not be defended, and it
was — but it is the part of the bug report the deadline does not answer.
What changed is that the wait now ENDS.

**WHAT THE MERGE ACTUALLY CARRIES**, four things in one seam:
- a `startup-failed` event crossing webview→process, written to
  **stderr** by `lib.rs` through a pure `startup_failed_line`;
- the **unlisten handle held**, so a failed `subscribe` can no longer
  leave a board that looks fine and has silently stopped tracking files
  — T-050's worse failure mode, a photograph of a project;
- the **webview re-armed after a pick**;
- a **deadline**, so nothing-rejects-at-all is still an answer.

## THE MERGE ITSELF

**PREDICTED BEFORE IT WAS PERFORMED, AND THE INTERSECTION IS NOT
EMPTY.** Merge **`827511e`**, merge-base **`2fc3475`**, main-before
**`381a569`**. `git merge-tree --write-tree 381a569 143a5ce` was run
FIRST and predicted **`d154c71e`** with no conflict output, exit 0; the
staged tree from `git merge --no-ff --no-commit` IS
**`d154c71e9ae4eae4bc070a5f96c66fcb6f3aacfe`, byte-equal**, and the
merge commit still carries that tree after its message was amended to
the house shape. `--no-ff`, never a rebase.

**BOTH SIDES ENUMERATED BEFORE MERGING, AND `comm -12` RETURNS ONE FILE
RATHER THAN ZERO.** **14 branch files against 44 main-side files**;
the intersection is **`app/src-tauri/src/lib.rs`**. Main moved by **25
commits** since the base (T-054's lane plus the architect's STATE
commits). **This is the first merge in several where the two sides
edited the same file**, and it is worth recording HOW it stayed clean
rather than that it did:

    BRANCH hunks in lib.rs:  @@ -80,0  +81,33   (the event const + line builder)
                             @@ -382,0 +416,19   (the listener, inside pub fn run())
                             @@ -445,0 +498,129  (mod tests)
    MAIN   hunks in lib.rs:  @@ -324,0 +325,40   (genesis_cancel neighbourhood)
                             @@ -402   +442,5    (generate_handler!, +4 commands)

**Both sides edit `pub fn run()` and they do not collide, because they
edit different OLD lines** (382 vs 402). `git merge --no-ff` printed
`Auto-merging app/src-tauri/src/lib.rs` and no reconcile was needed —
but "auto-merged" is not the same as "correct", so the thing at risk was
checked directly.

**`generate_handler!` VERIFIED BYTE-IDENTICAL ON BOTH SIDES, WHICH IS
THE CLAIM THAT MATTERED.** The branch's copy is **byte-identical to the
MERGE-BASE** (13 lines, sha `d7445d4fe979b003`) — the branch adds **no
IPC command at all**. Main-before had grown it to **17 lines, sha
`4e062a2e898297c9`** (T-029's four genesis commands). The MERGED file
carries **`4e062a2e898297c9`, byte-identical to main-before** — so all
four of main's commands survived and the branch contributed none.
**AN EVENT IS NOT A COMMAND**: the branch's addition is
`app.listen(STARTUP_FAILED_EVENT, …)`, which needs no `generate_handler!`
entry and no grant.

**THE `<main-before>` WRINKLE COSTS REAL FILES AGAIN.** `381a569..HEAD`
= **14 files, +1,888 / −48**. The naive `2fc3475..HEAD` = **57 files,
+10,114 / −1,345** — **4.07× by file count and 5.36× by insertions**,
and it would have dragged T-054's `.github/` and `docs/CONVENTIONS.md`
work into this merge's gates.

## The gates — BOTH FIRED, and the graph regen fired for REAL

**"The merge's diff" is `<main-before>..HEAD`** (`docs/CONVENTIONS.md`).
Both triggers were COMPUTED against `381a569..HEAD`, never against the
merge-base range.

**BOOT GATE (T-046): FIRES, on TWO of the four classes.** All four
measured separately: **`app/src/**` = 2 · `app/src-tauri/**` = 1 ·
`app/package.json` = 0 · `app/src-tauri/Cargo.toml` = 0.**

    [boot-check] port 17631 free — spawning `npm run tauri dev -- --config …` in /Users/ujju/Projects/nputer/app
    [boot-check] NPUTER_BOOT_PORT=17631 — threading --config …
    [boot-check] overall timeout 1200000 ms, no-output watchdog 300000 ms
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] stopping the tauri dev process tree (SIGTERM, then SIGKILL after 10s)
    [boot-check] process tree stopped (exit=null signal=SIGTERM)

**THE ABOVE IS THE SCRIPT'S VERBATIM OUTPUT AND IT CONTAINS NO EXIT
CODE.** The gate's exit status was **0**, and that figure is **the
integrator's own `echo ${pipestatus[1]}`, printed separately and
labelled as such.** The standing correction holds and is now checked
from the repo ROOT rather than from a subdirectory: **`git grep
BOOT_EXIT` matches 8 files, ALL under `docs/`** — two lines of this file
and six task cards. It appears in **no script**. (A caution for the next
integrator: `git grep` run from `tools/e2e` searches only that subtree
and returns nothing, which reads exactly like a contradiction of this
paragraph. It is not one. Run it from the root.)

**GRAPH REGEN: FIRES FOR REAL, WITH A REGEN — the first time under
T-054's new rule.** The trigger is `*.ts/*.tsx/*.js/*.jsx` outside
`docs/`; the merge carries **five**, and unlike T-054's single file
**all five are INDEXED** (none is under `docs/`, `tools/` or the
nputer-index fixtures):

    app/src/App.tsx · app/src/lib/watcher-store.ts
    app/test/shell-harness.test.ts · app/test/startup-recovery.test.ts
    app/test/startup-screen.test.tsx

**THE `ceaa949` ORDER WAS FOLLOWED: regen to MEASURE → fixture edits →
FINAL regen**, and the graph is committed **with this checkpoint**, per
the bullet.

    graph.json  5bc40c72c6ec2de6…   as inherited from T-054
                28b31c9f4df23e6d…   regen #1, to MEASURE
                4294fc091fe2be1c…   FINAL regen, after the fixture edit

**DETERMINISM PROVED RATHER THAN ASSUMED**: the final regen was run a
SECOND time and `cmp` reports the two outputs **byte-identical**, at
sha **`4294fc091fe2be1c0c72de51bf8ed85d1190c7e0df4db80f67a8a04c5772d95f`**.

**THE `index --check` VERDICT, RECORDED HERE BECAUSE T-054's CLAUSE ASKS
FOR IT** — and it is the second checkpoint to carry one:

    cargo run -p nputer-index -- index --check --root ../..   (from app/src-tauri)
    [nputer-index] graph.json is CURRENT - ../../docs/architecture/graph.json matches a
                   fresh index (558630 bytes, 115 files, 964 symbols, 1477 edges)
    EXIT=0

**Second instrument, non-golden, `NPUTER_UPDATE_GOLDEN` confirmed UNSET
at the shell** (`env | grep -c` = 0): `cargo test -p nputer-index --test
self_graph -- --ignored` → `ok`, exit 0. **Two independent instruments,
both green.** `git status` carried only the two intended files after
every check.

**The graph moved by**: 554130 → 558630 bytes, files **115 → 115**
(unchanged), symbols **953 → 964**, edges **1468 → 1477**. Five files
`~`, zero `+`, zero `-`.

**THE `--root` FALSE RED, PROVOKED ON PURPOSE — SIXTH REPRODUCTION, and
this time the exit code was measured UNPIPED.** Run without `--root`
from `app/src-tauri/`:

    [nputer-index] graph.json is STALE - the committed graph does not match a fresh index of this tree
    [nputer-index]   committed:   MISSING at docs/architecture/graph.json

**exit 1** — and note that piping this command into `head` returns
`head`'s status, not the gate's, which is how a false red can look like
a pass. **The headline says STALE, byte-identical to a real red;
`MISSING` appears only on the SECOND line.** This merge also produced a
REAL red for contrast, and its second line prints counts plus a
`~`-prefixed file list. **Always read the second line.**

## THE FIXTURE FORECAST WAS COMPLETE — one assertion, one number

**The probe mechanism T-029's integrator used was repeated and it worked
again.** A throwaway `describe("PROBE")` block was appended to
`app/test/architecture-dogfood.test.ts`, run ONCE against the fresh
graph to dump `fileComponent`, `findings`, `edges`, `drift` and scale,
and then removed. **THE REMOVAL IS PROVED BY sha256, not asserted**:
the file is back to
**`4feb00d8694553ba9af5bac23b1451cf1eda92c748aac5ee95e51bcf39b88f13`**,
its pre-probe value, with `git diff` on it EMPTY at that moment.

**WHAT THE PROBE SAID, AND EVERY ONE OF THESE IS A THING THAT DID NOT
MOVE**: `fileComponent.size` **115**, `unmappedFiles` **[]**, `issues`
**[]**, per-component counts **C-05 54 · C-06 23 · C-08 10 · C-09 3 ·
C-10 2 · C-12 14 · C-13 8 · C-14 1**, findings **ten D1 + three D3**,
edge-table length **32**, drift flags unchanged.

**EXACTLY ONE ASSERTION MOVES**, and it was found by diffing the
fixture's expected table against the live one MECHANICALLY rather than
by eye:

    ["C-05", "C-10", "confirmed", 32]  →  33

**AND THE CAUSE IS THE NICEST DETAIL IN THIS MERGE.** The one new
file-level edge in the whole graph is
`app/test/startup-screen.test.tsx → app/src/lib/watcher-store.ts`
(`app/test/**` is C-05's, `watcher-store.ts` is C-10's). That test file
reaches the store TWICE — a type import of `StartupFailure` and
`const { STARTUP_DEADLINE_MS } = await import(…)` — and the indexer
folds both into ONE file edge, so the count moves by one and not by two.
**The dynamic arm is the CONSTANT PIN the executor added to close the
green poison.** The guard against a test that cannot pin its own
constant is the very import that moves this number.

**The `it()` NAME does not move** — 13 confirmed / 10 undeclared / 9
planned all still hold, counted off the probe. **The T-024 three-fixtures
rule does NOT fire**: `git diff 381a569..HEAD -- docs/architecture/components/`
is a **0-file diff**, so `lib/parser/test/smoke.test.ts` is correctly
untouched. `map-dogfood-render.test.tsx` needed **nothing**: its scale
hint asserts `committed graph · 115 files` and the file count did not
move; its `map-edge` length is 32 and the edge TABLE did not move.

**So the forecast was COMPLETE, and the mechanism five merges have been
bitten by — a second assertion inside an already-moving `it()` body —
did not fire here.** That is a measurement, not a habit: it did not fire
because the moving `it()`'s other assertions are the relation table's own
rows, and the probe enumerated every one of them before the edit.

## SUITES ON MERGED MAIN

ADR-011 order, all re-run first-hand, **every expectation DERIVED from
the MERGED PARENTS before the run** — never by adding the branch's own
older numbers — **never piped through `tail`**, exit codes read from
`$?`.

- **lib/parser** `npm run build` exit 0 + `npx tsc --noEmit` exit 0 +
  `npx vitest run` → **225/225 (11 files)**, exit 0. **DERIVED: main's
  225 in 11 + the merge's ZERO `lib/parser` files = 225 in 11.**
- **app** `npx tsc --noEmit` exit 0, `npm run build` exit 0, `npx vitest
  run` → **821/821 (42 files)**, exit 0. **DERIVED: main's 795 in 42, +
  the merge's declaration delta counted per file — `shell-harness.test.ts`
  8→8 (**+0**), `startup-recovery.test.ts` 17→39 (**+22**),
  `startup-screen.test.tsx` 11→15 (**+4**) = 795 + 26 = 821.** The FILE
  count stays 42 because the merge adds **no new test file**: all seven
  ADDED files are `docs/tasks/*.md`. Checked before trusting the
  arithmetic: **no `.each` and no loop-wrapped `it()`** in any of the
  three, so declarations and executions are the same number here.
  **The branch's own 794/41 was measured against an older main and was
  correctly NOT added to anything.**
- **app/src-tauri** bare `cargo test` → **318 passed + 3 ignored, 0
  failed**, exit 0, **zero warning lines**, summed across **13 test
  binaries + 2 doc-test targets** (**113/0/0/46/123/0/7/13/3/7/0/2/4/0/0**).
  **DERIVED: main's 313 + the 5 new `#[test]` fns in `lib.rs` (2 → 7) =
  318** — and the per-target breakdown proves the derivation slot by
  slot: it is **identical to T-054's in all fifteen positions except the
  first**, which goes 108 → 113. **Exactly THREE `#[ignore]` attributes
  repo-wide** (`perf.rs:53`, `self_graph.rs:58`, `agent_runner.rs:1802`),
  the same three. **NO MODEL WAS CALLED.**
- **tools/e2e** `npm run typecheck` exit 0 + `NPUTER_E2E_PORT=17630 npm
  test` → **77 passed in 14.0 s**, headless chromium, one worker,
  retries 0, no skips, no flakes. **DERIVED TWO WAYS and they agree**:
  main's 77 + the merge's **ZERO** `tools/e2e` files = 77; and
  structurally, **77 raw `test(` occurrences minus THREE false
  positives** (`workflow-parity.spec.ts:160`, `:169`, `:559`) = **74
  declarations**, of which **71 sit at column 0** and **3 sit inside
  two-iteration loops** (`keyboard-activation:34`, `panel-real-keys:40`,
  `window-contract:318`) = 71 + 3×2 = **77 EXECUTIONS**. The corrected
  recipe this file carries is right on the merged tree; it was applied,
  not assumed.
- **`npm run lint:tokens`** → `clean (116 files scanned under app/src,
  app/test, tools/e2e)`, exit 0, **ZERO allowlist**. **DERIVED: main's
  116 + 0** — the merge adds no FILE under any of the three walked roots
  (its six code files are all modifications). `-- --selftest` → **49
  samples green, 14 walk-policy checks green**.

**THE BUNDLE.** `index-DN-TbnBr.js` **498.72 kB** (was `index-Bf-QNmtC.js`
497.86 kB at T-054 — the hash moved because `App.tsx` and
`watcher-store.ts` moved) and `index-CryMc_lw.css` **43.90 kB**, whose
content hash is **byte-identical to T-054's and T-029's**. That is the
right shape for this merge: it changes behaviour and touches no token,
no class and no stylesheet. **T-063-s1 is the filed finding that a
bundle figure quoted elsewhere is stale; this line is the current
measurement.**

**`EXPECTED_GRANTS` BYTE-UNCHANGED.** `acl_pin.rs` is a **0-file diff**
and its whole-file sha256 is
**`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e` at
`381a569`, at `143a5ce` AND at the merge**, with **92 grant lines**
counted off the declaration at `acl_pin.rs:54`. **No byte count is
quoted.** `ENV_ALLOWLIST` sha256 **`cf80f850b96a6f03…`**, **16 entries,
423 bytes**, and `agent/runner.rs`'s WHOLE-FILE sha is
**`a043f954c4e53dc6…` identical at `381a569` and at HEAD**, which is the
stronger and less breakable form of the same claim. **A caution earned
the hard way this session**: `awk '/const ENV_ALLOWLIST/,/\];/'`
RE-TRIGGERS on `ENV_ALLOWLIST_LINUX` and returns 17 entries at a
different sha. Anchor the range (`/^pub const ENV_ALLOWLIST: /`) or hash
the whole file.

**THE CARD'S OWN RECORD IS INTACT TO THE BYTE, RE-CHECKED AFTER MY
STAMP.** `## Verdicts` is **158 lines, sha256 `42edec16378057c7…`** and
`## Acceptance criteria` is **74 lines, sha256 `2f29ab7bdd0f70aa…`** —
both proved **byte-identical at the branch tip `143a5ce` and on merged
main after `status: building → done` was written**, by `cmp` rather than
by re-reading. **Nothing was transcribed**; the verdict and both ADR-016
stamps were on the branch before I arrived.

## THE POISON DRILL, RUN WITH ALL THREE LIMBS

T-054's checkpoint established that **one-sidedness is necessary and NOT
sufficient** — a mutation must break the ASSERTED RELATION. I ran three
drills against the merged tree, aimed at the constant pin, because that
pin is what closes this card's green poison. **The three limbs
reproduce on a DIFFERENT assertion type, which is the new data.**

| drill | mutation | subs | one-sided? | breaks the relation? | result |
|---|---|---|---|---|---|
| **A** | `8_000` → `9_000` in `watcher-store.ts` **and** in the pin `toBe(8_000)` | 2, both correct | **NO** | n/a | **39 passed — GREEN** |
| **B** | bound `toBeGreaterThan(778 * 2)` → `toBeGreaterThan(1)`, assertion side only | 1, correct | **yes** | **NO** — 8000 > 1 still holds | **39 passed — GREEN** |
| **C** | `8_000` → `8_001` in `watcher-store.ts`, producer only | 1, correct | **yes** | **YES** | **RED, exactly 1 of 39** |

**A is the green poison itself**: a constant that moves together with
its own assertion is not pinned by it. **B is the new instance of
T-054's third limb, and its MECHANISM is different** — T-054's case was
appending to a `toContain` needle, which stays a substring; here it is
**loosening an inequality bound**, which stays true. Same lesson,
independent shape: *the property that discriminates is not "one-sided",
it is "breaks the asserted relation".* **C red the single test
`N is the MEASURED figure, not whatever a later edit leaves behind` and
left the other 38 green** — including every deadline test, all of which
advance the fake clock BY the constant. **That is the verifier's claim —
the pin is the ONLY guard — re-proved first-hand rather than repeated.**

**RESTORATION PROVED, NOT ASSERTED**, after every drill:
`watcher-store.ts` back to
**`f1936907ec9a6dfb…`** and `startup-recovery.test.ts` to
**`67a001721bf31e6e…`**, with `git status --porcelain` showing only this
session's two intended files. **Every drill ran inline; no scratch
script was written**, because the session scratchpad is shared and a
sibling had one clobbered mid-run.

## THE FRESH-INSTALL PROOF THIS MERGE OWED — TAKEN

**T-054's integrator deliberately skipped this route** (four measured
0-file diffs across `package.json`, lockfiles, `app/` and `lib/`) and
**named T-063 as the merge that owes it again.** It is paid. The same
four measures on THIS merge:

    package.json      0 files  ·  *package-lock.json  0 files
    app/              6 files  ·  lib/                0 files

**`app/` moved, so the proof was owed and was taken** — in a scratch
worktree at
`…/scratchpad/fresh-T-063`, checked out at the merged commit `827511e`
with this checkpoint's graph and fixture copied in, so the tree matched
what main will carry. **`node_modules` verifiably absent in BOTH
packages before starting.** ADR-011 order:

- `lib/parser`: `npm ci` exit 0, **0 vulnerabilities**, `npm run build`
  exit 0, `npx vitest run` → **225/225 (11 files)**.
- `app`: `npm ci` exit 0, **0 vulnerabilities**, `npx tsc --noEmit` exit
  0, `npm run build` exit 0, `npx vitest run` → **821/821 (42 files)**.

**AND THE BUNDLE CAME OUT BYTE-FOR-BYTE THE SAME NAMES**:
`index-DN-TbnBr.js` **498.72 kB** and `index-CryMc_lw.css` **43.90 kB**,
identical to the main checkout's — **a proof of IDENTITY between a
warm-`node_modules` build and a cold lockfile-exact one**, which is
exactly the property T-052's hazard makes hard to check. The
`@nputer/parser` symlink resolved to `../../../lib/parser` in the fresh
tree too, so ADR-011's ordering constraint is structural and not an
artifact of the main checkout.

**SCOPE, STATED RATHER THAN IMPLIED**: the fresh install covers the
**npm half**. A cold `cargo` build was NOT taken. `Cargo.toml` and
`Cargo.lock` are both **0-file diffs**, so no Rust dependency moved, and
the merge's Rust source was compiled from scratch in the main checkout
anyway (318 tests, zero warnings). **The worktree was removed and the
branch KEPT.**

## WHAT THIS MERGE DID TO THE HUMAN'S RUNNING APP

**THIS ONE REACHED THEM, AND IT REACHED THEM HALFWAY — the exact shape
T-029's integrator identified.** `git diff --name-only 381a569..HEAD --
app/` is **6 files**, and they split across the two halves:

- **`app/src/**` — 2 files (`App.tsx`, `lib/watcher-store.ts`) — DID
  reach them.** Vite hot-reloads the frontend out of the MAIN checkout,
  so their window is now running **T-063's new frontend**: the deadline
  timer, the held unlisten handle, the re-arm after a pick, and the
  `emit("startup-failed", …)` call.
- **`app/src-tauri/**` — 1 file (`lib.rs`) — DID NOT.** **`tauri dev`
  does not hot-swap the Rust binary.** The `app.listen("startup-failed",
  …)` half is on disk and **not in their process.**

**SO THE HUMAN'S APP IS, RIGHT NOW, IN THE ONE STATE THIS CARD IS ABOUT
AND CANNOT DETECT: the frontend EMITS a `startup-failed` event that the
running backend has no listener for.** Tauri drops an unlistened event
silently, so the emit resolves and nothing is written to the log. **The
log-writing half of T-063 is inert in their window until they
relaunch** — and, pointedly, this is exactly the class of silent gap
T-063-s2 warns about from the other direction. The deadline, the held
handle and the re-arm ARE live for them, because those are frontend-only.

**Do not read this as damage.** Nothing broke; a strictly better
frontend is running against yesterday's backend. **It is a reason to
relaunch**, and they already had three.

**THE DOCS WATCHER REACHED THEM TOO**, as it does at every checkpoint:
`docs_watch` collects every `.md` under `docs/`, so this merge's eight
`docs/tasks/` files and this checkpoint's `STATE.md`, `ROADMAP.md` and
`ARCHITECTURE.md` arrive in their window as a docs SNAPSHOT. Data update
to a live board, not a code reload.

**1420 was never bound, connected to or signalled.** The only
interaction at any point was read-only `lsof`, run at session start,
after the merge, before the e2e lane, after the boot gate and at the end
— **one listener, healthy, every time**: node pid **82549** on
`[::1]:1420`, under `npm run tauri dev` pid 82342 / tauri node pid
82364. **The same three pids at session start and at the end.** Scratch
ports: **17630** (e2e lane) and **17631** (boot gate), both **bind-probed
free before use** and both `lsof`-empty afterwards. **Sixteen distinct
scratch ports across seven sessions and not one of them 1420.** T-061's
orphaned listener **did not recur**: the only other listeners on this
machine are ollama, postgres, rapportd and ControlCenter, none of them
ours.

**NO `npm ci` OR `npm install` WAS RUN ANYWHERE IN
`/Users/ujju/Projects/nputer`.** All five suites ran against the
EXISTING `node_modules`. A fresh install in this checkout removes
`node_modules` under the human's live vite and kills the app — T-052's
mechanism B, which has happened. The fresh-install proof above ran in a
scratch worktree, which is the documented route, now walked a fifth time.

**THE PARSER `dist/` WAS A MEASURED NO-OP for the fourth merge running.**
`app/node_modules/@nputer/parser` is a symlink to `../../../lib/parser`
whose `exports` point at `dist/`, so ADR-011's required `npm run build`
in `lib/parser` can rewrite what the RUNNING app parses with (T-052's
instance 5). **Here it did not**: `git diff 381a569..HEAD -- lib/parser`
is EMPTY, so the required build was a genuine no-op.

**THE WINDOW IS STILL 800×600 AND STILL NEEDS A RELAUNCH.** Unchanged by
this merge: T-051's 1280×840, T-029's four new Rust commands and now
T-063's stderr listener are all on disk and not in their process.

## INTEGRATOR JUDGMENT CALLS, recorded

- **ROADMAP: EDITED, and this is the discriminator working rather than
  being waived.** The test is "does the task add a USER CAPABILITY", and
  T-063 meets it in the most literal way available: it is the only card
  in the backlog with a user's own bug report attached, and what a user
  can do now that they could not is **hand over a log that contains the
  failure**, plus **get an answer when nothing rejects at all**. A new
  paragraph sits directly after T-050's, whose story it continues — and
  it carries **the honest limit in the same paragraph**, because a
  ROADMAP entry that claims the dead end is gone would be false for the
  first 8 seconds.
- **ARCHITECTURE: EDITED, because a component changed what it DOES.**
  C-05's row gains T-063's clause: the shell now has a **second
  webview→process event and its first OUTBOUND FAILURE channel**.
  **This was checked rather than assumed** — `model-updated` already ran
  that direction since T-042, so T-063 is the SECOND such event and not
  the first, and the row says so. The architectural half is the STREAM
  CHOICE: `model-updated` → stdout, `startup-failed` → stderr, so a
  healthy round trip and a failure are separable in one log without
  parsing. The row also records what did NOT change — `generate_handler!`
  byte-identical at thirteen commands, `acl_pin.rs` a 0-file diff at 92
  grants — because "no new IPC and no new grant" is the load-bearing
  claim for ADR-012. **The Components TABLE still stops at C-07** and
  was not extended.
- **THE REGISTRY: NOT EDITED.** T-063 declares no component, adds no file
  to the index, and moves no component edge — the one new edge is a
  FILE edge on the already-confirmed C-05→C-10 pair.
- **NO NEW ADR (three-prong).** (a) T-063's decisions are
  implementation-level within an existing component: an event name, a
  stream choice, a timeout constant, a held handle. (b) Prong two
  verified MECHANICALLY: **zero new dependencies and zero lockfile
  lines** — `package.json`, `package-lock.json`, `Cargo.toml`,
  `Cargo.lock`, `capabilities/**`, `gen/**`, `tauri.conf.json`,
  `acl_pin.rs`, `agent/runner.rs`, `method/**` and `lib/**` are **all
  0-file diffs**. ADR-011 holds (parser built before app, twice — once
  in main and once cold). ADR-003 holds — **no model call was made**.
  ADR-012 holds and was verified at the handler rather than argued.
  ADR-016 holds for the fifth merge running: stamps and verdict were on
  the branch and were checked by HASH. The register ends at **ADR-017**.
  (c) Prong three: the durable calls live in the card's criteria→evidence
  map and its committed verdict.
- **THE TASK FILE'S STAMPS WERE COMPLETE except the one that is mine.**
  Only **`status: building → done`** was written. **`status: building` on
  the branch was CORRECT and not a defect**: the architect's ruling at
  `9d30d0e` (executors stamp `verifying`) explicitly exempts cards
  already in flight, and T-063 was dispatched before it. Parser-validated
  after: **0 issues**, `T-063 status: done`.
- **`touches:` LEFT ALONE**, and it was already right — `[app-shell]`.
  Fields lock at `status: building` (TASK-FORMAT § Lifecycle). Every code
  file in this merge belongs to C-05 or C-10, both of which `app-shell`
  covers.
- **THE SEVEN SUGGESTIONS STAY `status: suggested`**, per the standing
  convention that suggestions are dispositioned at triage and not by the
  integrator. Their content is carried below.
- **THE CONTROL-BYTE HABIT WAS RUN AND IS CLEAN, in its corrected form.**
  `file --mime` over every file this merge and this checkpoint wrote —
  every one **`charset=us-ascii` or `charset=utf-8`** — and a C0 sweep
  excluding tab, newline and CR returns **0 bytes across all of them**.
  **The type LABEL is unreliable in BOTH directions and stays retired as
  a test**: `file(1)` calls `graph.json` "JSON data" and
  `workflow-parity.spec.ts` "text/x-java". **Say `file --mime` and read
  the CHARSET.** The habit is now **fourteen-for-fourteen** and it found
  nothing here.
- **THE SHARED-INDEX HAZARD did not recur.** `git diff --cached --stat`
  was read before **both** commits and the staged set was exactly this
  session's each time — **14 files at the merge, byte-matching the
  branch's own `2fc3475..143a5ce` shortstat of 14 / +1,888 / −48.** **Two
  sibling worktrees were live throughout — `../nputer-T-060` and
  `../nputer-T-063` — and NEITHER was touched.** House shape held:
  **merge → checkpoint, two commits.**
- **`cargo audit` NOT RUN, and the reason is stated rather than
  implied.** It is the one network-touching command and it fetches the
  RUSTSEC DB per run. `Cargo.lock` is a 0-file diff, so the 2026-08-16
  baseline — 0 vulnerabilities / 17 informational over 472 locked crates
  — cannot have moved. `npm ci` in the fresh worktree DID report **0
  vulnerabilities** on both packages, which is the npm-side equivalent
  and is new data this merge.

## In progress / broken right now

**ONE LANE IS LIVE, ONE JUST FREED, AND ONE JUST UNBLOCKED.**

    ../nputer-T-060   task/T-060-resolver   9c40da7   VERIFYING — needs a verifier NOW

**T-060 HANDED OFF WHILE THIS MERGE RAN, and it is the first card in
this project to reach a verifier under the `9d30d0e` ruling.** It
advanced **five commits** during this session
(`00b27f0 → 9b72650 → 3c69b9a → 96fbb3a → 9c40da7`), and the last one is
`T-060: docs true, status verifying, two findings filed`. Its worktree
is cut at **`6404a43`** (`Checkpoint: T-029 done`) — DISPATCH FROM THE
LAST CHECKPOINT, honoured before the bullet existed. **Its card reads
`status: verifying` on the branch and `status: planned` on main**, which
is correct and is exactly the board gap named below. It now touches
**7 files** — `app/src-tauri/src/agent/runner.rs`,
`app/src-tauri/src/lib.rs`, `app/src-tauri/tests/agent_runner.rs`,
`docs/ARCHITECTURE.md`, its own card and **two findings (T-060-s1,
T-060-s2)**. `built_by: claude-opus-5 @fresh`, `verified_by:` **empty**.
**THE NEXT DISPATCH THIS PROJECT OWES IS A VERIFIER FOR T-060**, not a
new builder.

**A CONCRETE HAZARD FOR T-060's INTEGRATOR, MEASURED HERE.** Its base is
now **TWO merges behind** (T-054's and this one), and **it edits
`app/src-tauri/src/lib.rs`, which T-063 just grew by 181 lines** — a new
const and line builder near the top (`+81`), a listener inside
`pub fn run()` (`+416`), and a 129-line `mod tests` block at the bottom.
**T-063 and T-060 are the second and third merges running to touch that
file**, and this merge's own clean auto-merge was luck of line numbers,
not a property. Enumerate both sides and run `merge-tree` FIRST; the
`mod tests` block at the file's end is the most likely collision site if
T-060 also appends tests there. **Its merge fires the BOOT GATE
(`app/src-tauri/**`) and — being all-Rust — NOT the graph regen.**

**T-062 IS UNBLOCKED AS OF THIS MERGE.** It declares
`touches: [app-shell, app-map]` and was queued behind T-063 on the
`app-shell` overlap; `app-shell` is **FREE** now. It is `status: planned`
and approved for dispatch (see the grants below). **Read T-062 and T-065
together** — T-062 changes the shell's scroll model and will move exactly
the numbers T-065's corrected criterion 4 names.

**THE T-063 WORKTREE IS REMOVED and its branch KEPT.**

**THE ARCHITECT'S `verifying` RULING STANDS** (`9d30d0e`).
`method/roles/executor.md:18` says an executor sets **`status:
verifying`** on handoff (or `done` for size S); every dispatch written
this week said `building`, and every executor obeyed the dispatch over
the method. **The method is right.** `building` means someone is actively
building it, which is FALSE the moment the executor stops. Applied from
the next dispatch onward; **cards already stamped `building` are left
alone** — T-054 was one and T-063 was the last.

**AND A CLAIM THIS FILE HAS CARRIED FOR SEVERAL CHECKPOINTS IS FALSE
AND IS WITHDRAWN HERE.** It said **"`verifying` is still one of
TASK-FORMAT's eight statuses that has NEVER been used."** **It has been
used FIFTEEN times.** Measured with one command
(`git log --all -S'status: verifying' -- 'docs/tasks/*.md'`):

    2026-08-14 → 2026-08-16   T-001 T-002 T-003 T-004 T-005 T-006 T-007
                              T-008 T-009 T-011 T-012 T-017 T-018 T-019
                              T-023          — fifteen cards, routinely
    2026-08-16 → 2026-08-18   nothing        — every dispatch said `building`
    2026-08-18   T-060 @ 9c40da7             — the FIRST since T-023

So the status was never unused; **it fell out of use for two days**,
because the dispatches said `building` and the executors obeyed the
dispatch over the method. That is a much more interesting fact than the
one this file was repeating, and it makes the `9d30d0e` ruling a
RESTORATION rather than an introduction. **T-060 is its first
application.** The board on main still shows **0 building / 0
verifying** while T-060's lane sits at `verifying` on its own branch —
the same gap, correctly restated: a status only becomes visible to the
board when the branch merges.

**T-054's DORMANT-CI NOTE STANDS, UNCHANGED AND STILL LOAD-BEARING.**
`git remote` returns **zero remotes** — re-run at this session's start —
and `.github/workflows/ci.yml` has never executed a single step in this
project's life. **Every "CI checks this" sentence in these docs is a
promissory note until the first push.** The CONVENTIONS clause that says
so also tells the integrator to run `index --check` by hand at the
checkpoint and record the verdict; **this checkpoint does, above, and it
is the second one to do it.**

**THE OVERNIGHT GRANTS (human, 2026-08-17, before sleeping).** Recorded
here because a successor session must not re-ask:
- **Four lanes approved**: **T-054**, **T-063**, **T-060**, **T-062**.
  **T-054 and T-063 are now DONE**, so **two remain**.
- **Triage-born cards may dispatch from the ranked queue WITHOUT further
  approval.** Every card still goes executor → adversarial verifier →
  integrator; a second rejection on the same card PARKS that lane with
  the record intact.
- **Three parallel lanes**, matching the load that held (~10 on 10
  cores). **T-063's lane just freed and T-060 stopped BUILDING**, so two
  lanes are free for new work — but T-060's lane is not free, it is
  awaiting a VERIFIER.
- **QUEUE, and the reason each waits**: **T-062** waited on **T-063**
  (both declare `app-shell`) and is **UNBLOCKED as of this merge**.
  **T-060 is at `verifying`** and still holds `app-agent` — a lane is
  held until its branch MERGES, not until its executor stops. The method
  forbids parallelizing overlapping `touches` and this is the live
  application of it.

**T-063 FILES SEVEN, and three of them are worth reading before the next
triage:**

- **T-063-s2 — THE SHARPEST ONE, and the verifier raised its priority by
  REPRODUCING it.** The startup event name is **two independent string
  literals with no join**: `app/src-tauri/src/lib.rs:86`
  (`const STARTUP_FAILED_EVENT: &str = "startup-failed"`) and
  `app/src/lib/watcher-store.ts:209` (`const STARTUP_FAILED_EVENT =
  "startup-failed"`). **I re-confirmed both sites at the merged tree.**
  Renaming the Rust side leaves cargo 318/318, the app suite 821/821 and
  the boot gate all green, **silently reopening exactly the defect this
  card closes.** Correctly out of fence — but **it should not stay filed
  quietly**, and this merge supplies an unplanned live demonstration of
  the failure mode: see the running-app section, where the human's
  process currently has an emitter with no listener and no way to notice.
- **T-063-s6 — two quoted figures do not reproduce, and I re-derived
  both.** The capped log line is **870 characters / 872 bytes**, not 887:
  the prefix `[nputer] startup-failed: recv_at_ms=<13 digits> payload=`
  is **58** characters, `MAX_ECHO_LOG_CHARS` is **800**
  (`docs_watch.rs:60`), and the marker `…(truncated)` is **12 characters
  / 14 bytes** (the ellipsis is 3 bytes). 58 + 800 + 12 = **870 chars**;
  58 + 800 + 14 = **872 bytes**. It is content-independent once the cap
  fires, **so 887 cannot be produced by this code at all.** And
  `app/test/startup-screen.test.tsx:12` says "10 of these 23 tests" where
  the file has **15** declarations and the poison reds 9. **Every
  QUALITATIVE claim in that card reproduced exactly** — the arithmetic is
  the part that drifted.
- **T-063-s7 — a test stays GREEN when the re-subscribe is deleted**
  while its four siblings red, because "no second payload" and "a payload
  dropped by identity" have the same outcome by construction. **Shipped
  behaviour is correct**; one line closes it.
- s1 (a dev-flip bundle figure is stale — see the measured bundle above),
  s3 (the subscribe copy overclaims after a refused retry), s4 (a value
  import silently debases the startup-screen suite), s5 (the deadline
  arms a real timer inside a parked test).

**T-054's FOUR, T-029's NINE, T-028's SIX and T-051's NINE remain
undispositioned** and are the next triage's, unchanged by this merge. Of
T-054's, **s3** is the one this checkpoint just added data to (see the
drill table). Of T-029's, **s8** (the declined diagnosis relays nothing)
is still the one to fix first and **T-060 did NOT pick it up** — its
seven files do not include it, so s8 is still open and still homeless.
**s5**
still cannot close without an authenticated machine. Of T-028's, **s6**
is still the highest-value item in that set: `app/tsconfig.json` shares
an ambient `.d.ts` between `src` and `test`, so ADR-017's free
typecheck-level guard against the app writing to disk is GONE. Of
T-051's, **s7 and s8** are still the class that does the most damage
unread, because both are CORRECTIONS to claims already written down.

**THE CONTROL-BYTE HAZARD stands at FOURTEEN reproductions across six
sessions.** Habit **fourteen-for-fourteen**; it found nothing this merge.
Still no gate; T-058 owns it.

## Next up (1–4)

1. **DISPATCH ORDER.**
   - **T-062 IS THE NEXT MERGE-READY DISPATCH.** It unblocked the moment
     T-063 merged (both declare `app-shell`), it is already approved by
     the overnight grant, and it is `status: planned`. **Read T-062 and
     T-065 together** before dispatching either.
   - **T-060 NEEDS A VERIFIER, and that is the most time-critical item
     on this list.** It handed off at `9c40da7` with `status: verifying`,
     `verified_by:` empty and two findings of its own already filed. It
     did NOT pick up **T-029-s8**, so that remains open. **Its
     integrator must read the lib.rs hazard above.**
   - **TWO LANES ARE FREE.** **T-055** in lib-parser is the natural
     taker; beside it T-057, T-058, T-059 (`blocked_by: [T-033]`, and it
     DISSOLVES if that ruling moves `arch` to the Node CLI), and T-065.
   - **T-063-s2 SHOULD BE PROMOTED AT THE NEXT TRIAGE, NOT LEFT TO
     AGE.** It is a two-literal join in two files, it silently reopens
     the defect this card just closed, and **this merge produced a live
     instance of the failure class in the human's own process.** It is
     the cheapest high-value item on the board right now.
   - **Then T-061** (a demonstrated orphaned listener — it did not recur
     at this merge either; the boot gate ran and no stray survived) and
     **T-064**.
   - **T-010 is more interesting than its position suggests** — it makes
     `languages: ["ts"]` false, indexes the 44 `.rs` files and turns the
     four unclaimed ones into live unmapped-territory findings. **T-063
     sharpens the case a second way**: this merge added 181 lines of Rust
     including a whole new logging path, and **the committed graph moved
     by not one node or edge on account of it** — every one of the five
     `~` files was TypeScript. The map cannot see the half of this card
     that runs in the backend.
   - **Still un-homed, and NOT one of the 66**: the
     **Tailwind/`app/src-tauri` finding** from T-014's merge — a Rust
     identifier in the shipped CSS, invisible to every gate because no
     walk sees that directory. **T-058 is its natural neighbour.**
   - **Carried and still un-homed**: a rolled-up `find … | xargs shasum`
     hashes PATHS as well as bytes, so any standing "did I disturb it"
     check on the `app/node_modules/@nputer/parser` symlink must fix the
     convention or compare per-file. **Four merges running have compared
     per-file and had no trouble.** T-052's neighbourhood.
   - **T-054-s2's rule still has no home.** The `·` truncation rule lives
     only in one card's implementation notes. It belongs in
     `commandBullets`' docstring or in CONVENTIONS beside the parity
     bullet, and the next editor of either will not find it.
2. **@human — THE MORNING'S AGENDA. The app IS running and this merge
   left it running — but this time it CHANGED under you, halfway.**
   T-063 touches two files under `app/src/`, which vite hot-reloaded, and
   one under `app/src-tauri/`, which it did not. **YOUR WINDOW IS RUNNING
   T-063's FRONTEND AGAINST YESTERDAY'S BACKEND**, so the deadline and
   the held handle are live for you and **the log-writing half is not**.
   **YOUR WINDOW IS ALSO STILL 800×600 AND STILL RUNNING YESTERDAY'S
   RUST** more generally. **Relaunch** — you want it for T-051's 1280×840
   anyway, and without it neither T-029's four commands nor T-063's
   stderr listener can fire. You pick up everything at once: T-042's
   genesis truthfulness, T-014's 23 CSS bytes, T-027's entire screen,
   T-028's crescendo, the interview that survives being closed, and a
   startup failure that finally writes itself down.

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
   - **NEW, and cheap now that the log tells the truth: PROVOKE A
     STARTUP FAILURE ON PURPOSE AFTER YOU RELAUNCH**, and read the log
     line. It is the one T-063 criterion no headless run can judge —
     whether `[nputer] startup-failed: recv_at_ms=… payload={…}` on
     stderr is actually the thing you would want to paste into a bug
     report. **And judge the first 8 seconds while you are there**: the
     card leaves them unchanged on purpose, and you are the only one who
     can say whether a silent 8-second wait before an honest failure is
     the right trade.
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
   - **T-050-s2 is CLOSED by this merge** — escaping the failure screen
     with "Open a folder…" reached a board with real content that was
     silently dead, and the held unlisten handle is the fix. **It is
     worth a look anyway**: pick a folder from the failure screen and
     confirm the board actually tracks a subsequent file change.
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
   - **THE REPO HAS NO REMOTE, and it is still a decision only you can
     make.** `git remote` returns nothing, so `.github/workflows/ci.yml`
     has never executed a single step. T-054 added the graph-currency
     gate to it, and T-020's "watch the first CI run" has been on this
     list for weeks. **Every "CI checks this" sentence in these docs is a
     promissory note until you push.**
3. **MILESTONE 3 (F-03) — THE TASK LIST IS DONE AND THE MILESTONE IS
   STILL NOT CLAIMED.** T-023 → T-024 → T-026 → T-037 → T-025 → T-039 →
   T-041 → T-042 → T-048 → T-049 → T-050 → T-027 → T-051 → T-028 →
   T-029 are all through the pipeline, and **T-063 declares
   `milestone: 3`** — a triage-born card that never joined that list, so
   "milestone 3 has no work in flight" was false as a fact about the
   board even while it was true about the list. **It is now true of
   both.** And the milestone still cannot be claimed, for a reason that
   has nothing to do with either: **not one planner turn has ever been
   observed against a real model.** This machine's `claude` OAuth token
   is revoked, so no model call has ever gone through the runner. **Every
   stream this app has ever seen is a scripted fixture landing in
   milliseconds** — so the one thing an interview actually is, a
   conversation that takes time with a model that can misunderstand you,
   has never been exercised at all. What EXISTS is a real conversation
   surface with a real event channel, a real file-evidence join, a real
   board handoff, real recovery from being closed, and now a startup that
   reports its own failures; whether it is a GOOD interview is unknown.
   **The evidence it waits on is a real, timed, end-to-end genesis run.
   It is @human's and it is on the list above.** Do not claim the
   milestone before it exists. **MILESTONE 4** carries T-010, T-013,
   T-015, T-053 and T-054. **T-010 is still the interesting one**, and
   T-063 just sharpened its case (see the dispatch list).
4. **OVERNIGHT DISPATCH GRANTS and the BACKLOG.** Grant 1 (**milestone 3
   to completion**) is **EXHAUSTED — T-029 was its last card**, and
   T-063 rode the named-lane grant instead. Grant 2 closed at T-034;
   grant 3 (third triage applied) stands, and **tasks NEWLY created by
   triage still do NOT dispatch without the human.** Unchanged method
   rules: a second REJECTED parks a lane for the human; @human judgments
   are never self-answered; no screen control beyond the ruled boot
   check; **port 1420 is the human's, and it is OCCUPIED.**
   **THE THIRD TRIAGE IS APPLIED AND STANDS.** It opened at **66 files**
   and closed at **16, every one PARKED with a dated trigger to unpark**:

       66 open  →  37 promoted · 12 folded · 16 parked · 1 rejected
                    1 removed as already-absorbed

   **THE SIXTEEN PARKED are unmoved**: the nine standing (T-003-s2,
   T-008-s1, T-018-s1, T-021-s1, T-025-s2 @human, T-025-s3, T-025-s4,
   T-026-s1, T-038-s1) plus seven new — T-014-s5, T-030-s1 (@human),
   T-034-s1 (@human), T-034-s4 (@human), T-045-s3, T-046-s3, T-047-s2.
   **The test that moves them**: *what merged recently that makes this
   item's "not live yet" clause false?* **T-063 is a worked example for
   the next triage**: any parked item premised on "the startup failure
   never reaches a log", "a failed subscribe strands the board silently"
   or "a hang is indistinguishable from a rejection" has just expired.
   **LANE AVAILABILITY.** `app-shell` **FREED by T-063** (**T-062**
   queued and now unblocked, and the standing queue's next named item
   there is **T-022** — M, milestone 4, `blocked_by: []`, which T-034-s3
   made bigger). `crate-index` FREE (**T-010**, **T-013**, **T-015**).
   `app-agent` HELD by T-060 at `verifying` (T-043 behind it);
   `app-interview` FREE;
   `lib-parser` FREE (**T-055**, **T-031**, **T-032** — and **T-032
   carries T-034-s7**, a criterion that reads as an instruction to type a
   control byte and **should be amended BEFORE it is built**); `app-map`
   free (T-013, T-015, T-032's map-badge half); `app-board` free.

## Health of the tree

The T-063 worktree is removed and its branch KEPT. Main tree clean;
every suite green; the token lint green over 116 files at zero
allowlist; **the committed graph REGENERATED, proved deterministic by
`cmp` across two consecutive regens, and proved current by two
independent instruments after the fixture edit.** The parser re-parses
the whole live tree at **0 issues**, including this checkpoint's own
edits and the merge's eight new `docs/tasks/` files.

**THE BOARD, as MAIN sees it**: **120 task files**, tally **44 done / 21
planned / 16 parked / 39 suggested / 0 building / 0 verifying**, plus
**9 in `rejected/`**. 6 features, 11 components. **113 → 120 is T-063's
seven suggestions**; **43 → 44 done and 22 → 21 planned is T-063
itself.** **One worktree IS open** (T-060, at `verifying`), so the board on main
showing nothing in flight is a LIMIT of the board, not a fact about the
work — the gap the `verifying` ruling names.

**THE THREE-NUMBER COUNT, RE-MEASURED AT THIS MERGE AND STILL THREE
NUMBERS.** The old "41 task branches merged" was wrong and stayed wrong
in three different ways. Measured now, one command each:

    44   merge commits matching ^Merge T-
    43   DISTINCT task ids among them   (T-014 was merged twice)
    44   cards at status: done          (T-040 is done with NO merge commit)

**Quote the measure, not a single figure.** All three moved by exactly
one at this merge, which is the first time they have moved in step.

**PORTS: 1420 IS OCCUPIED AND THAT IS DELIBERATE.** The architect's app
runs out of the MAIN checkout (node pid 82549, one listener). **Every
agent has been briefed to probe it read-only and never bind, connect to
or signal it**, and every lane, verifier and integrator has honoured it —
T-029's five lanes on 15420…15490, its merge's 17420/17430/17440,
T-054's verification on 17540, T-054's merge on 17420/17421/17422, and
this merge's **17630** (e2e lane) and **17631** (boot gate), **both
bind-probed free before use.** **Sixteen distinct scratch ports across
seven sessions and not one of them 1420.** No OTHER listener of ours is
bound; no stray `tauri dev`, `vite` or boot-check process survives beyond
the human's own three pids. **T-052's problem stays live for whoever
takes T-062 — it touches `app-shell` and will move installed code
again.**

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. **T-063's security posture was verified rather than
argued**: zero new dependencies, zero lockfile lines, **zero IPC surface
movement** (`generate_handler!` byte-identical at thirteen commands),
zero grant movement (`acl_pin.rs` a 0-file diff, whole-file sha
identical at three refs, 92 grants), `ENV_ALLOWLIST` byte-identical and
`agent/runner.rs` whole-file identical, `capabilities/`, `gen/`,
`tauri.conf.json` and `adapter.rs` all 0-file diffs, and **the one new
data path — a webview event reaching a process `eprintln!` — reviewed as
a sink**: `startup_failed_line` escapes control bytes (proved by a test
asserting `!line.chars().any(char::is_control)` over the WHOLE line
rather than over three characters someone thought of) and caps at 800
characters with an explicit marker, so a hostile 10 000-character
rejection message from the IPC boundary cannot repaint or flood a
terminal. **This is a new attack surface and it was built with the sink
in mind**; `.github/` is a 0-file diff this merge. The sharpest open set
is otherwise unchanged and still app-agent's: **T-047-s5**, **T-047-s6**,
**T-047-s4**, **T-047-s1**; beside them **T-046-s1**, **T-041-s4** and
**T-029-s5**, which cannot close without an authenticated machine.
**T-060 is the card that would close most of it and it is now AWAITING
VERIFICATION.**

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020).
T-054's three unproven steps are unchanged and still unproven on a real
runner (`index --check`, the token lint, the xvfb boot check). **T-063
adds nothing to CI** — `.github/` is a 0-file diff — but it adds 26 app
tests and 5 Rust tests to what that lane will run. The rest of the
cautions are unchanged: T-027's, T-051's and T-028's lane specs measure
**geometry and animation** against a real bundle and real CSS, and font
metrics, scrollbar widths and animation timing are not identical across
platforms — **read T-051-s8 and T-051-s9 first if a lens or window
assertion reds**; the ubuntu apt/webkit2gtk set; the four `uses:` SHA
pins; the `e2e types` step (still never executed on any runner); T-034's
`map-tasks-lens-dom.test.tsx` and T-051's `window-manifest.test.ts` both
reading the BUILT stylesheet, so **build-then-test ORDER is
load-bearing**; T-014's nputer-index watch timings measured on FSEvents;
`cargo audit`; the xvfb boot check; and the THREE T-018 SENTINEL live
tests. **NEW for this merge**: `startup-recovery.test.ts` drives FAKE
TIMERS around an 8-second deadline. It is clock-independent by
construction, but T-063-s5 records that one parked test arms a REAL
timer — **that is the one to watch if the app suite ever goes flaky on a
slow runner.**

## Open questions

- **NEW, and the sharpest one this merge raises — WHAT GATE CATCHES A
  CONTRACT SPELLED TWICE?** T-063-s2 is a two-literal event name with no
  join, and **nothing in this repo can see it**: cargo is green, the app
  suite is green, the boot gate is green, the token lint does not look at
  string values, and the graph records an import edge rather than a
  string identity. **This merge produced a live instance by accident**
  (the human's process now runs an emitter whose listener is not loaded),
  which is the same failure with a different cause and equally
  undetectable. The general form: **a contract that crosses a language
  boundary as a bare literal has no owner.** A generated constant, a
  shared JSON, or a test that reads both files and compares — any of the
  three closes it, and the question is which one this project wants.
- **NEW — is a REGEN-then-EDIT-then-REGEN ordering worth writing down as
  a numbered procedure?** It was followed here from `ceaa949`'s
  precedent and it worked, but it is oral tradition plus one commit
  reference. The three steps have a reason each (measure before you
  edit, edit the fixtures the measurement names, regen because the
  fixture file is itself indexed) and **an integrator who does them in
  the wrong order commits a graph that is stale by one file.** It is two
  sentences in the GRAPH REGEN bullet.
- **Is one-sidedness the right formulation of the poison rule?**
  **Answered again, from a new direction.** T-054 measured a `toContain`
  needle staying a substring; **this merge measured a LOOSENED INEQUALITY
  staying true.** Two different assertion families, same conclusion:
  one-sidedness is necessary and not sufficient, and the property that
  discriminates is **"the mutation must break the ASSERTED RELATION"**.
  **T-054-s3 should carry all three limbs**, and it now has two
  independent worked examples to cite. **This is the third night running
  that the poison practice found something the poison practice did not
  say.**
- **NEW — should a checkpoint be required to say WHICH HALF of a merge
  reached a running app?** This merge is the cleanest case yet: two
  frontend files hot-reloaded into the human's window and one Rust file
  did not, leaving a **live emitter with no listener** in their process.
  T-029 had the same shape and said so; T-054 had neither half and said
  so. **Three merges, three different answers, and the question is
  whether that paragraph is a courtesy or an obligation.** Method, so
  the architect's (ADR-004).
- **WHAT IS A RULE WORTH THAT NAMES A GATE NOBODY CAN RUN?** Carried
  forward from T-054, **unchanged and unanswered**. There is still no
  remote and CI has still never executed. This checkpoint pays the
  clause's price the way the clause asks — by running `index --check`
  itself and recording the verdict — which is evidence the interim
  mechanism works, not evidence the question is closed.
- **What does the pipeline owe a task whose VERIFIER vanishes
  mid-flight?** **Carried forward, and the practice has now held FIVE
  times running.** T-063's verifier committed verdict, stamps and two
  findings in `143a5ce` before ending, so this integrator verified
  ADR-016's marks by HASH and transcribed NOTHING. T-053 remains the only
  counter-example. **Five-for-five is a habit, not an enforcement** —
  nothing in TASK-FORMAT requires the stamps to be the verifier's last
  act. **The cheap fix is one clause in TASK-FORMAT**; the architect's.
- **What does the pipeline owe the RECORD of a rejection?** Carried
  forward unchanged. T-063 had no rejection, so it adds no data on the
  rejection half — but the cheap version generalised again: hashing
  `## Verdicts` and `## Acceptance criteria` across the branch tip and
  the post-stamp merge cost one command each and proved the record
  intact through an integrator's own edit.
- **Does the BOOT GATE rule retire, and when?** Carried forward. **T-063
  is the argument AGAINST retirement**, and it is the strongest data
  point in a while: the gate fired on a merge that changes both halves of
  the app, and it caught the app booting cleanly with a brand-new
  process-side event listener registered in `run()`. A compile is not a
  boot; this merge added code to the startup path itself.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** **Live, unchanged, and now with a NINTH member if the
  regen-ordering question above is answered yes.** `method/roles/
  executor.md` still says only "run the test commands from CONVENTIONS.md
  until green", while seven rules already share the trigger → command →
  record → IF-it-cannot-run → why shape. **A method version bump, not an
  ADR.**
- **When does the C0/searchability rule become a gate?** Unchanged in
  substance, now **FOURTEEN reproductions across six sessions**, habit
  fourteen-for-fourteen. Still no gate; T-058 owns it. **The "which walk
  sees this file" answer for this merge**: of the merge's 14 files, the
  graph's walk saw **5**, the token lint saw **5** (all modifications, so
  its count did not move), and the parser's live-tree walk saw the
  **eight** `docs/tasks/` files. **Three walks, three different answers
  about the same 14 files, and no document states them side by side.**
- **Does the shared main working tree need a rule?** Carried forward with
  a **SIXTEENTH face, and it is the sharpest one yet.** T-029 disturbed
  the app half way and said so; T-054 disturbed the code not at all and
  the docs anyway. **T-063 disturbs it half way IN A WAY THAT MATTERS TO
  ITS OWN FEATURE**: the half that reached them emits an event, and the
  half that did not is the listener. So the answer shape needs a fifth
  entry: *the halves that split are not always independent, and a
  half-merge can leave a feature in a state neither side ships.*
  Method/process, so the architect's (ADR-004).
- **When does spawn hygiene become an ADR?** Unchanged: when T-047-s5
  lands.
- **Does a verifier's remedy belong in an acceptance criterion?**
  Carried forward, **FIFTEENTH data point.** T-063's verifier filed two
  findings with remedies (s6, s7), and **s7's remedy is one line and
  precisely correct** — the opposite of T-054's case, where a remedy
  itself needed verifying. *A remedy is a claim, like any other* — and
  this time the claim held.
- **Should a card's own numbers be treated as a claim to verify rather
  than a brief to implement?** **T-063 is the TWELFTH instance and the
  first where the card is qualitatively right and ARITHMETICALLY wrong
  in two places** — 887 for a line that is 870 characters, and "23 tests"
  in a file with 15 (T-063-s6, both re-derived at this merge). **Every
  qualitative claim reproduced exactly.** The generalisation is
  sharpening: **prose survives a rewrite; numbers do not, and numbers are
  what later readers quote.**
- **Is a forecast that has to be COMPLETE a reasonable standing bar?**
  **T-063 says yes, and it is the best evidence so far.** The forecast
  WAS complete — one assertion, one number — and it was complete because
  the probe enumerated `fileComponent`, `findings`, `edges` and drift
  before a single fixture byte was edited, rather than because the drift
  rings happened not to move. **The narrower question is now overdue and
  this merge is the sixth to hit it: should the dogfood probe be a
  COMMITTED tool rather than a throwaway `it()` each integrator
  re-invents and deletes?** Six merges have written and deleted some
  version of it; this one wrote it, ran it, removed it and proved the
  removal by sha256, which is three steps of ceremony around a debug
  print. Probably a paragraph in CONVENTIONS plus a small script; the
  architect's.
- **When a task retires a test, who owns the property it was reaching
  for?** Carried forward from T-045, answered in practice by T-054 and
  untouched here.
- **What does the pipeline owe a task whose builder vanishes
  mid-flight?** Carried forward from T-050, unanswered.
