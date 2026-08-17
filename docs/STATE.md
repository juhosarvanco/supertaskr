# State

Updated: 2026-08-17 by integrator (T-051 merged), claude-opus-5 @fresh

## Just completed

**T-051 — a window the split fits in.** Size S, five criteria,
`app-shell`. Built by `claude-opus-5 @fresh`, verified by
`claude-opus-5 @fresh`, `review: same-model`, **APPROVED first pass**.
13 files, +1,502 / −8. Merge **`bd88b87`**.

**FOUR NUMBERS IN A MANIFEST, AND THEY DECIDE WHETHER ANYONE EVER SEES
T-027.** The whole shipped change is `app/src-tauri/tauri.conf.json`'s
window block — **4 insertions, 2 deletions**, `800×600` with no floor
becoming **`width 1280, height 840, minWidth 1024, minHeight 700`**.
Everything else in the merge is the coverage that holds it
(`app/test/window-manifest.test.ts`,
`tools/e2e/tests/window-contract.spec.ts`), the card, and nine
suggestions. T-027's split renders the lens only at or above **1024 CSS
px** and centres the chat alone below it, so **at the size the app
actually launched a new user saw the chat and nothing else** — the
composition ruled on the same evening was unreachable without first
dragging the window wider, and nobody widens a window before forming an
opinion. This closes @human's T-027 visual judgment #5.

**1280 IS NOT A ROUND NUMBER CHOSEN FOR TASTE.** The chat column is
640px with its 1px rule INSIDE it (border-box), so the lens is
`width − 640` — measured, not read off: the verifier's breakpoint walk
found the lens ABSENT at 1022/1023, **384** at 1024, **385** at 1025,
**640** at 1280, **800** at 1440. So **1280 is the unique width at
which the two halves are equal**, and the floor where the lens still
clears the 639px T-027's plan calls the design's geometry is **1279 —
not 1280**, because the card's arithmetic double-counted the rule
(640 + 1 + 639). 1280 ships regardless and is right; the card's
justification for it was off by one.

**THE FLOOR CLEARS EVERY SCREEN, WITH 8px — NOT THE CARD'S 37px.**
Natural content heights at the minimum, re-derived: genesis **302**,
front door **475**, no-plan card **663** (threshold exact — 663/662 at
662, 663/663 at 663), and the repo map **692**. 700 clears all four.
**T-051-s5 is the correction that matters**: the shipped guard at
`window-manifest.test.ts` measures the map through the LANE fixture, a
**one-node** map with a natural height of **320**, so its `map ≤ 600`
assertion is not a measurement of the map the criterion-3 table renders.
Real headroom at the floor is **8px**. The shipped 700 is still correct
— but the margin is thin, and the next thing that makes a screen taller
eats it.

## The evidence that makes it trustworthy

**THE VERIFIER RE-DERIVED RATHER THAN TRUSTED, and it committed its own
verdict** — `8a1cdbb`, on top of the executor's `f60b3e8`. It walked the
breakpoint pixel by pixel rather than reading `lg` off Tailwind, measured
all five screens at 800×600 / 1024×700 / 1280×840 and reproduced the
criterion-3 table **cell for cell**, attacked 1024 and had it hold, and
extracted `EXPECTED_GRANTS` from base and HEAD to prove the change
touched no grant. **ADR-016's two-mark set already existed on the branch**
and nothing was transcribed at this merge — the opposite of T-053's, and
the open question below is updated accordingly.

**THREE OF ITS NINE SUGGESTIONS ARE CORRECTIONS TO THINGS THE CARD OR
THE NOTES ASSERT, and they are carried here so they do not become
folklore.**

- **T-051-s7 — THE CARD'S STATED REASON IS FALSE.** The notes and
  `window-manifest.test.ts:9-17` both claim `WindowConfig` is
  `deny_unknown_fields`, so a kebab-cased key is "a HARD config parse
  failure and the app does not launch at all". **It is not.**
  `min-width` and `min-height` are **accepted serde ALIASES**: a
  kebab-case typo parses cleanly to `min_width=Some(1024.0)` and the app
  launches. The test still reds on such a key — it pins the key SET with
  a whole-object `toEqual`, so the guard genuinely works — but **it works
  for a different reason than the one written above it**, and the boot
  gate would NOT have caught the case the comment says it exists for.
  Fix the comment before someone relies on the claim.
- **T-051-s5** — the minHeight guard measures a one-node map (above).
- **T-051-s8 — T-027-s5's MECHANISM IS FALSIFIED AND ITS CONCLUSION
  VINDICATED.** Three sessions measured the genesis pane's scroll region
  at 1440×900 and got three answers. The lever is the fixture's
  **ARTIFACT ROW COUNT**, not the project dir path length: `streakFixture`
  (9 rows) → **858/780**, 78px of margin, strict `>` passes;
  T-028's `streakMidInterview` (7 rows) → **780/780**, zero margin,
  strict `>` fails. Both dirs were measured against both fixtures at all
  three viewports and **every cell is identical** — one extra character
  in the path moves nothing. Artifact rows are 40px on a 47px pitch, so
  two rows out of the lens is 78px out of the content, which is the whole
  margin. T-027-s5's conclusion — an assertion with no headroom at the
  widest lens is unsafe — is right and has now come true.

**THE ONE NUMBER NOBODY COULD MEASURE IS @human's.** Whether the default
height should be 840 or 867 turns on the **~28px macOS title bar**, which
is not measurable headlessly — the lane measures the webview viewport, not
the window chrome. Filed as **T-051-s3** and it is a judgment, not a bug.

## THE MERGE ITSELF

**CLEAN, and the clean case has a proof the conflicted one cannot.**
Merge **`bd88b87`**, merge-base **`e41dd16`**, main before at
**`dca3731`**. `git merge-tree --write-tree` was run FIRST and predicted
tree **`86cf72e5`**; the merged tree **IS
`86cf72e509ed9287feb30a727f33343d8f5e738b`, byte-equal** — so the merge
introduced nothing beyond the two parents' contents.

**BOTH SIDES ENUMERATED BEFORE MERGING, and main had moved TWICE under
this branch.** **13 branch files against 104 main-side**, and
**`comm -12` returns ZERO — the intersection is EMPTY.** Main's 104 are
the third triage plus two whole merges: **87 under `docs/tasks/`**, 11
under `lib/parser/` (T-053), 2 under `app/test/` (T-053's dogfood
fixtures), `docs/architecture/graph.json`, and `docs/STATE.md`,
`docs/CONVENTIONS.md`, `docs/ARCHITECTURE.md`. The branch's 13 are the
manifest, two new test files and ten `docs/tasks/` files. **`dca3731..HEAD`
is exactly those 13 and nothing else**; `git diff --check` clean.

**THE `<main-before>` WRINKLE AT ITS WIDEST YET.** The naive
`<merge-base>..HEAD` derivation returns **117 files** against the correct
rule's **13** — a factor of **NINE**, and the widest divergence any merge
has recorded. The base `e41dd16` is stale by two whole merges (T-053 and
the third triage), so a checkpoint deriving from it would have claimed a
four-key manifest change rewrote 83 task cards, a parser package and the
backlog. **It did not change WHICH gates fire this time** — both
derivations fire both gates — but it changed the headline by 9×, which is
exactly the failure mode the CONVENTIONS bullet names.

## The graph regen

STANDING INTEGRATOR PRACTICE (T-009-s1), **TWENTY-EIGHTH** exercise.
The top-of-file log in `architecture-dogfood.test.ts` is unbroken from
T-053's block.

**FIRED and NOT a no-op**: 2 `.ts` files outside `docs/`. Order per
`ceaa949` — regen to MEASURE, then the fixture edits, then the FINAL
regen, because the fixtures are themselves indexed files. **Confirmed
necessary live AGAIN, eighteenth hold**: the sha moved from `93a6c85c`
(measuring) to `130a9b07` (final) purely because of the fixture edits.

**THE BRANCH ADDED TWO `.ts` FILES AND THE GRAPH GAINED ONE.**
`tools/e2e/tests/window-contract.spec.ts` is under `.nputerignored`
`tools/`, so the lane is not territory — the same reason T-041's five
tools/e2e files landed nowhere. **Derive the mapping move from the
INDEXED added-file list, never from the merge's diff**, or the row
over-counts by one.

**The graph:** **109 → 110 files**, **857 → 860 symbols**, **1325 →
1328 edges** (import **+3**, call **+0**, type_ref **+0**), 500,788 →
**502,350 bytes**. Languages still `["ts"]`. Final sha256
**`130a9b0733732288f8d0ddf8a314895adde38b1c110fc807c595f22df506a886`**.
**DETERMINISM PROVED**: two consecutive regens byte-identical (`cmp`
exit 0). Plain non-golden self-check with `NPUTER_UPDATE_GOLDEN`
confirmed **UNSET at the shell**: `self_graph_is_current … ok`, exit 0.
Cross-checked with the SECOND instrument: `nputer-index index --check
--root <repo>` → `graph.json is CURRENT (502350 bytes, 110 files, 860
symbols, 1328 edges)`, exit 0. **Two independent instruments, both
green.**

**Operational note, RE-CONFIRMED first-hand rather than inherited**: run
from `app/src-tauri/`, `index --check` WITHOUT `--root` reports
`committed: MISSING at docs/architecture/graph.json` and exits **1**. It
was reproduced deliberately here beside the green run. **That is a false
red, not a stale graph.** The note is now two-for-two and should be
believed.

**NOTHING BUT C-05 MOVED, and that was DERIVED rather than hoped.** One
new file node, C-05's: `app/test/window-manifest.test.ts` (loc 176, 3
symbols — `MANIFEST`, `WindowBlock`, `windowBlock`). All **three** new
edges are file→**PACKAGE** — `node:fs`, `node:path`, `p:vitest` — and
**an edge whose head is a package can create no component PAIR at all**,
so findings, all six D1 `fileEdges` lists, the 30-row relation table with
its 13/8/9 tally, every observedCount, every drift ring and C-12's
`files` array are **byte-identical**. No symbol count moves outside the
new file. Mapping **109 → 110** with **C-05 50 → 51** the only
per-component move.

**THREE ASSERTIONS MOVED PLUS ONE `it()` NAME, AND THE FORECAST WAS
COMPLETE — the SECOND complete forecast running.** Derived from the
INDEXED added-file list and the registry glob BEFORE anything was run:
the size check and the `["C-05", 50] → 51` row in
`architecture-dogfood.test.ts`, the `it()` name that carries the count in
its own title, and the index hint `109 → 110` in
`map-dogfood-render.test.tsx`. **The C-05 row is the SECOND assertion in
the same `it()` body as the size check**, so a red hides it — the trap
that cost T-048 and T-049 a row each and T-027 its tenth assertion. It
was caught by derivation, and **both dogfood fixtures went green on the
first run**, which is what makes "complete" a measurement rather than a
hope. The registry glob was swept again: `C-05-app.md:9` is the single
match for `app/test/**` in `docs/architecture/components/`.

**T-024's three-fixtures rule does NOT fire, VERIFIED rather than
assumed** — T-051 declares no component and edits no registry file, so
`lib/parser/test/smoke.test.ts` is deliberately untouched.

## The gates — BOTH FIRED, and both ran

**"The merge's diff" is `<main-before>..HEAD`** (`docs/CONVENTIONS.md`,
`98f931e`). Used deliberately here, and see the 9× wrinkle above.

**BOOT GATE (T-046): FIRED, RAN, GREEN — and this is the merge it exists
for.** Trigger set from `dca3731..HEAD`: **`app/src-tauri/**` = 1 file
(`tauri.conf.json`) · `app/src/**` = 0 · `app/package.json` = not
present · `app/src-tauri/Cargo.toml` = not present.** One of four
classes, and it is the manifest class. **T-051 is the first task in the
project's history to edit the window block**, and a malformed block is
precisely T-040's failure — a one-line manifest regression that every
`cargo test`, `cargo build` and full suite is perfectly happy with.
Scratch port **16410**, bind-probed free immediately before use. Output
verbatim:

    [boot-check] port 16410 free — spawning `npm run tauri dev -- --config {"build":{"devUrl":"http://localhost:16410","beforeDevCommand":"npm run dev -- --port 16410 --strictPort"}}` in /Users/ujju/Projects/nputer/app
    [boot-check] NPUTER_BOOT_PORT=16410 — threading --config {"build":{"devUrl":"http://localhost:16410","beforeDevCommand":"npm run dev -- --port 16410 --strictPort"}}
    [boot-check] overall timeout 1200000 ms, no-output watchdog 300000 ms
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] stopping the tauri dev process tree (SIGTERM, then SIGKILL after 10s)
    [boot-check] process tree stopped (exit=null signal=SIGTERM)
    BOOT_EXIT=0

**The window with the new block opens.** Note what the gate does NOT
prove, given T-051-s7: a kebab-cased `min-width` would ALSO have booted
green, because it is an accepted alias. The gate proves the block parses
and a window is created; the KEY SET is held by the vitest pin, not by
this.

**GRAPH REGEN: FIRED, ran, green.** Trigger from `dca3731..HEAD` = **2
`.ts` files outside `docs/`**, of which **one is indexed**.

**T-061's hazard did NOT recur**: after the boot check, ports 16410,
16411 and 16412 were all empty and `pgrep -fl 'tauri dev'` found exactly
one tree — pids **81703/81705/81720**, the architect's, i.e. the human's
app and **not a stray of this merge**.

**CI STILL HAS NEVER GATED GRAPH CURRENCY.** `ci.yml:127` is bare
`cargo test`, which skips `#[ignore]`d tests, and `self_graph_is_current`
is `#[ignore]`d — a stale graph passes CI green, because the dogfood
fixtures assert against the COMMITTED graph and a stale graph plus
fixtures matching it agree perfectly. **Twenty-eight regens have been
held up by a written ritual and conscientious integrators, nothing
else.** T-054 closes it and is still undispatched.

## WHAT THIS MERGE DID TO THE HUMAN'S RUNNING APP

**RECORDED DELIBERATELY, because the practice of saying so is being
ratified rather than left to conscience.** The app ran out of the MAIN
checkout throughout this merge — `node` pid 81894 on `[::1]:1420`, the
architect's `npm run tauri dev` from ~05:30, pids 81703/81705/81720.

**1420 was never bound, connected to or signalled.** The only
interaction at any point was read-only `lsof`, run at session start,
before the boot gate, after the boot gate, after the e2e lane and at the
end — **one listener, healthy, every time**. The boot gate took
**16410**, the e2e lane **16411**, the fresh-install worktree's lane
**16412**, all three bind-probed free first and all three empty
afterwards.

**IT WAS NOT DISTURBED AT ALL, and that is a measured claim rather than
an absence of evidence.** `app/node_modules/@nputer/parser` is a
**symlink** to `../../../lib/parser` whose `exports` point at `dist/`,
so ADR-011's required `npm run build` in `lib/parser` CAN rewrite what
the RUNNING app parses with without a single file under `app/` being
touched — that is **T-052's instance 5**, and it is what happened at
T-053's merge (dist 44 → 48 files, sha moved). **Here it did not.**
T-051 touches **zero** `lib/parser` files (`git diff dca3731..HEAD --
lib/parser` is EMPTY), so the required build was a genuine **no-op**:
dist **48 files before and 48 after**, rolled-up sha256 **`8b2512ad…`
before and `8b2512ad…` after — byte-identical**. Independently
confirmed: a per-file `shasum` comparison against the throwaway
`npm ci` worktree at the merged commit differs on **ZERO files**.

**A MEASUREMENT TRAP CAUGHT ITSELF HERE, and it is recorded because it
nearly became a false finding in this very document.** A "rolled-up
sha256" of `find … | xargs shasum` hashes the PATHS as well as the
bytes, so the SAME dist yields three different rollups under three path
conventions — **`8b2512ad`** repo-root-relative (`lib/parser/dist/…`),
**`ac0a1bea`** absolute (`/Users/…/lib/parser/dist/…`), **`fb2ffbfb`**
package-relative (`dist/…`). Comparing a before taken one way against an
after taken another shows a "change" that is purely the prefix. This
session did exactly that mid-run and briefly concluded the dist had
drifted. **Compare rollups under a FIXED convention, or compare
per-file** — the per-file diff is what settled it. Cheap lesson, and the
next integrator measuring this symlink should not have to re-learn it.

**The app ships the same bytes regardless**: `npm run build` in `app/`
reproduces main's recorded bundle **exactly** —
`index-Ch0Gpkv4.js` (484.43 kB) and `index-DSR1ACex.css` (43.30 kB) —
and the fresh `npm ci` worktree produces those same two hashes from a
lockfile-exact install.

**WHAT WAS NOT DONE, and why.** **No `npm ci` or `npm install` was run
anywhere in `/Users/ujju/Projects/nputer`.** All five suites ran against
the EXISTING `node_modules`. A fresh install in this checkout removes
`node_modules` under the human's live vite and kills the app — T-052's
mechanism B, and it has already happened once. The fresh-install proof
was relocated to a throwaway `git worktree`, per the shape the last
checkpoint prescribed; both sets of numbers are under "Health of the
tree".

**T-051 REBUILT NOTHING THE APP SERVES.** The change is four manifest
keys; `app/src/**` is a **0-file diff**, so the vite dev server on 1420
is serving byte-identical frontend source before and after. The window
block is read by `tauri dev` at LAUNCH, so **the human's already-running
app still has its old 800×600 window** — they get 1280×840 on their next
relaunch, not before. Worth knowing before they wonder why the split
still is not there.

## SUITES ON MERGED MAIN

ADR-011 order, all re-run first-hand, **every expectation DERIVED from
the merged parents** rather than inherited from either side, **never
piped through `tail`**, exit codes read from `$?`. The branch reported
its numbers against a two-merges-stale main, so every one was re-derived:

- **lib/parser** `npm run build` exit 0 + `npx tsc --noEmit` exit 0 +
  `npx vitest run` → **225/225 (11 files)**, exit 0. **DERIVED: main's
  225 in 11 files + the branch's ZERO parser files = 225 in 11.** The
  smoke test re-parses the whole live tree at **0 issues**, with the
  merge's ten new `docs/tasks/` files in it.
- **app** `npx tsc --noEmit` exit 0, `npm run build` exit 0, `npx vitest
  run` → **724/724 (39 files)**, exit 0. **DERIVED: main's 718/38 + the
  branch's 6 new tests in 1 new file = 724/39** — and the 6 were counted
  off `window-manifest.test.ts`'s `it()` openers before the suite ran
  (3 in "the window the app opens", 3 in "the floor clears T-027's split
  breakpoint"), then confirmed by vitest's own per-file line. Bundle
  **byte-identical to main's** (hashes above), which is the correct
  result for a zero-frontend-source change and a real cross-check.
- **app/src-tauri** bare `cargo test` → **299 passed + 3 ignored, 0
  failed**, exit 0, **zero compiler warnings**, summed across **13 test
  binaries + 2 doc-test targets** (108/0/0/32/123/0/7/13/3/7/0/2/4/0/0).
  **DERIVED: main's 299 + the branch's ZERO Rust = 299.** The 3 ignored
  are unchanged: the real-CLI smoke, the perf harness, and
  `self_graph_is_current`.
- **tools/e2e** `npm run typecheck` exit 0 + `NPUTER_E2E_PORT=16411 npm
  test` → **65 passed in 12.0 s**, headless chromium, one worker,
  retries 0, **no skips, no retries, no flakes**. **DERIVED: main's 60 +
  the branch's 5 = 65** — and the 5 were counted structurally before the
  run, which mattered: the spec declares only **four** `test(` calls, and
  the fourth is inside a two-iteration `for` loop over
  `[the declared minimum, the declared default]`. Counting `test(`
  openers would have forecast 64.
- **`npm run lint:tokens`** → `clean (109 files scanned under app/src,
  app/test, tools/e2e)`, exit 0, **ZERO allowlist**. **DERIVED: main's
  107 + 2**, and this is the derivation that is the mirror image of the
  graph's: **BOTH** new files are under a walk root here
  (`app/test/**` and `tools/e2e/**`), where only ONE is indexed. The two
  walk policies genuinely differ and neither is the other's proxy.
  `-- --selftest` → **49 samples green, 14 walk-policy checks green**.

**`EXPECTED_GRANTS` BYTE-UNCHANGED, PROVEN THREE WAYS.** Extracted from
**base `e41dd16`, main-before `dca3731` and HEAD**: **6135 bytes, 92
grant lines, sha256
`721174b12a00b382cad6e9edb853ae1723f4dd1351e3bfa4380020a0d2e7f0c7`** at
all three, `cmp` exit 0 both ways. The whole `acl_pin.rs` is identical
too — git blob **`53aa795b`** and sha256 **`8d24cbad…`** at all three
refs — and its pins re-run green inside the 299.

## INTEGRATOR JUDGMENT CALLS, recorded

- **ROADMAP: EDITED, and it was not close.** The established
  discriminator ("does the task add a USER CAPABILITY") is met head-on
  and this is the cleanest instance in some time: before this merge the
  flagship screen's composition **could not be seen at the size the app
  opened**. The Milestone 3 entry says what a user can do that they could
  not this morning — launch and see the interview and the plan side by
  side, without touching the window — and it carries the two corrections
  (the 1279 floor, the 8px of real headroom) plus the ~28px title-bar
  question that is still @human's. Note the contrast with the last
  merge: T-053 was deliberately NOT roadmapped because its issues fire on
  no real tree; T-051 changes what every user sees on launch, today.
- **ARCHITECTURE: EDITED, one row — C-05's.** Checked before editing per
  the standing correction: C-05 **does** have a row and the table stops
  at C-07. The discriminator holds because §"Task `touches:` slugs map
  here" assigns `window` to C-05 explicitly (`app-shell` = C-05
  shell/window/watcher), and because the row's own T-027 clause describes
  the sub-1024 "chat alone" branch — a state that is **now outside the
  window's legal range rather than its default**. This is also the FIRST
  window minimum the shell has ever declared, which is a structural
  constraint and not merely a value. The clause is short and says the
  change is four manifest keys with no grant, no Rust and no frontend
  edit.
- **T-065 WAS CORRECTED, and I am naming it because it is the kind of
  edit an integrator should have to justify.** T-065's criterion 4
  carries T-027-s5's stated lever verbatim — *"the verifier's own probe,
  differing only by a project dir one character longer, measured the lens
  region at 780 / 780"* — and **T-051-s8, landing in this very merge,
  falsifies it by measurement**. The line I drew: **I correct
  FORWARD-LOOKING INSTRUCTIONS; I do not rewrite the historical record of
  findings.** T-065 is a `planned` card that no lane holds and no
  worktree is open on, and its criterion would send a builder to measure
  the wrong lever — that is exactly how folklore forms. So the criterion
  now names the mechanism (artifact row count, with the 858/780 and
  780/780 rows), keeps T-027-s5's CONCLUSION, which is vindicated, and
  flags the three older per-viewport figures as re-measure-don't-trust.
  **T-051-s2 was deliberately NOT touched** even though s8 says it "needs
  the same correction" — it is the verifier's own filed finding, s8
  corrects it by id in the same directory in the same merge, and the
  triage will read them together. **The scope and priority of T-065
  remain the architect's; only a false factual claim was changed.**
- **THE REGISTRY: NOT EDITED**, and nothing asked it to be — T-051
  declares no component.
- **NO NEW ADR (three-prong).** (a) T-051's decisions are numeric and
  are RULED and recorded on the card with the arithmetic, and a window
  size is a value inside an existing shape rather than a new one.
  (b) Prong two verified MECHANICALLY: the merge is **zero Rust**, **zero
  app/src**, **zero IPC**, **zero new grants** (proven above), **zero new
  dependencies** and **zero lockfile lines** — `app/src-tauri/src`,
  `capabilities/**`, `gen/**`, `app/src/**`, `Cargo.toml`, `Cargo.lock`,
  `app/package.json`, `lib/**`, `method/**` and all four lockfiles are
  0-file diffs. The ONE manifest line class it does touch is the window
  block, which is what fired the boot gate. ADR-011 holds (the family is
  untouched). ADR-003 holds — **no model call was made**. ADR-014/ADR-015
  hold and were EXERCISED (committed, deterministic, proved current by
  two instruments). **ADR-016 holds cleanly and for the first time in two
  merges needed nothing from the integrator** — both marks were on the
  branch before I arrived. The register ends at **ADR-017**.
  (c) Prong three: the durable calls live in the card's criteria→evidence
  map and its committed verdict.
- **THE TASK FILE'S STAMPS WERE COMPLETE except the one that is mine.**
  The verifier had already written `verifier`, `verified_by`,
  `review: same-model` and the whole `## Verdicts` entry. **Only
  `status: building → done` was written at the checkpoint** — and
  `built` was never written, because it is not one of TASK-FORMAT's
  eight, which is the trap T-053 hit. Parser-validated before and after:
  **0 issues both times**.
- **THE CONTROL-BYTE HABIT WAS RUN AND IS CLEAN.** `file(1)` over every
  file this merge wrote: all text, **none classified `data`**; a C0 scan
  excluding tab and newline returns **0 bytes** in all seven. The habit
  is now **ten-for-ten**.
- **THE SHARED-INDEX HAZARD did not recur.** `git diff --cached --stat`
  was checked before **both** commits and the staged set was exactly this
  session's each time. Another agent was live in T-028's worktree
  throughout. House shape held: **merge → checkpoint**, two commits.

## In progress / broken right now

**ONE LANE IS LIVE, AND IT IS READY TO MERGE.** A worktree is open — if
this session dies, it is the first thing to look at:

    ../nputer-T-028   task/T-028-crescendo   from e41dd16   VERIFIED APPROVED — READY TO MERGE

- **T-028 — milestone 3's closer** (lens→board handoff, timed
  completion, the rain), carrying T-027-s1's refocus fix as a sixth
  criterion. **IT MOVED WHILE THIS MERGE WAS RUNNING and the last
  checkpoint's description of it is now out of date**: its branch reached
  **`a419773` "T-028 verified: APPROVED — six criteria re-derived,
  tripwire proven to discriminate, T-051 merge hazard reproduced"**, so
  it is past verification, not in it. Its worktree is **CLEAN** —
  `git status --porcelain` empty — where the last checkpoint recorded an
  uncommitted `watcher-store.ts`. Its card still reads `status: building`,
  which is the correct hand-off state for an integrator to stamp.
  **T-028's own verifier independently reproduced the T-051 collision**,
  which is worth more than either lane saying it alone.
- **T-051's worktree is removed and its branch KEPT.**

### THE T-028 HANDOFF — a diagnosis, not a red suite

**T-051-s6 called this before either lane merged, and T-051 merged
first, so THE RECONCILE IS T-028's INTEGRATOR'S.** Nothing in the window
spec was pre-emptively changed to accommodate a branch that had not yet
been verified. It is a **fixture reconciliation, not a defect**, and the
next integrator should arrive expecting it:

**The mechanism.** T-028 makes `GenesisScreen.tsx` choose its right half
— `const half = showsBoard(docs) ? "board" : "lens"` at
`GenesisScreen.tsx:77` — and when the tree looks board-ready it renders
`BoardCrescendo`, which emits **`genesis-board`**, inside the same
`data-testid="genesis-pane-slot"` (`GenesisScreen.tsx:134`).
`showsBoard` is `crescendo.ts:113`, a total function that degrades to the
LENS on an unreadable tree.

**What reds, by file and line.** `tools/e2e/tests/window-contract.spec.ts`
— its `genesis()` helper at **:104-114** drives the FULL
`streakFixture(11, "/e2e/streak")`, the tree with `docs/tasks/` in it, and
that is the tree T-028's own fixture note says "no longer renders the lens
at all". Every assertion below therefore names a testid that
`BoardCrescendo` does not render:

    :206   expect(await reach(page, '[data-testid="genesis-artifact"]')).toBe("40/40")
             — in test "the default window renders both halves of T-027's split"
    :318   expect(await reach(page, '[data-testid="genesis-artifact"]'), "genesis: last row").toBe("40/40")
             — in the parameterized test at :308, which runs TWICE
             (the declared minimum 1024x700, and the declared default 1280x840)

**So two assertion SITES, THREE test executions.** They red on a
**string mismatch about which testid rendered**, not on anything about
the window: the width arithmetic at :190-200, the frame checks and the
minWidth/minHeight tests do not depend on the lens's contents and should
stay green. `:316`'s `genesis-pane-slot` and `:317`'s `interview-input`
also stay green — the slot is what T-028 fills differently, not what it
removes.

**The fix is a fixture choice, and T-028 has already made it once.**
Either drive `genesis()` with a tree `showsBoard` reads as NOT
board-ready (T-028's own `streakMidInterview` is exactly that
subtraction), or assert the slot's occupant conditionally. **Read
T-051-s8 before picking**: `streakMidInterview` has 7 artifact rows
against `streakFixture`'s 9, and at 1440×900 that is the difference
between 78px of margin and **zero** — so swapping the fixture to fix
these three executions can red a DIFFERENT assertion elsewhere. That
interaction is the whole reason s8 was filed.

**T-029 is deliberately NOT dispatched**: it shares `app/src/genesis/`
with T-028 and reuses T-028's completion detection, so it wants T-028
landed first, not merged against.

**T-054 is written and still NOT dispatched.** It is the card that makes
CI gate graph currency, and the gate it closes has never existed. It is
the strongest pre-condition of a quiet week on this list.

**THE THIRD TRIAGE IS APPLIED AND STANDS.** It opened at **66 files**
and closed at **16, every one PARKED with a dated trigger to unpark**:

    66 open  →  37 promoted · 12 folded · 16 parked · 1 rejected
                 1 removed as already-absorbed

**T-051 FILES NINE — the largest single set in the project's history**,
and none is dispositioned; they are the next triage's. s1 (the split
comment still carries the falsified arithmetic) · s2 (the lens-region
figures do not reproduce — **read with s8, which corrects its framing**)
· s3 (**@human**: the default is 27px short of the design's canvas, the
title-bar question) · s4 (T-048-s5's mechanism half is unabsorbed and its
floor moved) · s5 (the height guard measures a one-node map) · s6 (T-028
will red the new window spec — **being discharged by the handoff above**)
· s7 (kebab `min-width` is an accepted alias, so the card's stated reason
is false) · s8 (the lens-region lever is row count, not path length) ·
s9 (the floor sits exactly on the breakpoint). **s7 and s8 are
CORRECTIONS to claims already written down**, which is the class that
does the most damage if it survives to triage unread.

**THIRTEEN CARDS WERE CREATED at the triage**, every one a CLUSTER
rather than a card per finding: **T-053** (DONE) and **T-054** are the
architect's; the analyst authored eleven — **T-055** one answer to what
content is · **T-056** the transcript stops re-rendering itself ·
**T-057** assertions that cannot fail · **T-058** the tree stays
searchable · **T-059** the two joins cannot quietly disagree · **T-060**
the resolver trusts nothing it did not just prove · **T-061** the boot
gate cleans up · **T-062** the frame holds everywhere · **T-063** a
startup that fails says so · **T-064** the switch tells one story ·
**T-065** one wire, one shape (**criterion 4 corrected at this merge —
see the judgment calls**). **None is dispatched.** Grant 3 covers
applying the triage, not dispatching what it creates.

**THE CONTROL-BYTE HAZARD stands at THIRTEEN reproductions across five
sessions**, one of them inside the card describing the mechanism. The
habit is now **ten-for-ten** and it found nothing this merge. Still no
gate; T-058 owns it, and its `docs/**` coverage gap is named on the card.

## Next up (1–4)

1. **DISPATCH ORDER. T-028 IS THE NEXT MERGE and it is ready now.**
   - **T-028 wants an integrator, and the handoff diagnosis above is
     written for them.** Whoever takes it inherits three test executions
     that red on a testid string, with the fix and its interaction with
     s8 already worked out. It is the last card before T-029 and it
     closes milestone 3's UI half.
   - **Before T-029 goes out**: its three folds are already applied to
     its card (T-027-s2, T-039-s3, T-047-s3). **T-054** is the other
     pre-condition of a quiet week — it closes a gate that has never
     existed. **T-063** is the only item in the whole backlog with a real
     user report attached, and the report could not describe itself.
   - **Milestone-4-adjacent**: **T-055** in lib-parser (lane free);
     T-057, T-058, T-059 (`blocked_by: [T-033]`, and it DISSOLVES if that
     ruling moves `arch` to the Node CLI), **T-062 is now UNBLOCKED —
     `blocked_by: [T-051]` and T-051 is done** — and T-065.
     **Read T-062 and T-065 together**: T-062 changes the shell's scroll
     model and will move exactly the numbers T-065's corrected criterion
     4 now names.
   - **Launch-prep**: **T-060** — STATE has recorded NO STANDING SECURITY
     GATE since T-025-s6 closed at T-039, and this is the sharpest open
     set: a probe arm that executes a relative path the cache gate
     refuses, a `$SHELL` that picks which program runs, and a suite where
     nothing structurally stops a test spawning the real CLI, which
     already happened once. Then **T-061** (a demonstrated orphaned
     listener, one forgotten env var from 1420 — **it did not recur at
     this merge**, measured above) and **T-064**.
   - **Still un-homed, and NOT one of the 66**: the
     **Tailwind/`app/src-tauri` finding** from T-014's merge — a Rust
     identifier is in the shipped CSS and no gate can see the directory.
     It has no suggestion file and never did. **T-058 is its natural
     neighbour** (both are "the walk policy IS the gate"), so fold it
     there or file it, but do not let a fourth triage lose it.
   - **NEW, small, and it wants a home**: a rolled-up
     `find … | xargs shasum` hashes PATHS as well as bytes, so the same
     tree yields different rollups from different working directories.
     This session briefly mis-read the parser `dist/` as drifted because
     of it (corrected above). Any standing "did I disturb it" check on
     the `app/node_modules/@nputer/parser` symlink should specify the
     convention or compare per-file. T-052's neighbourhood.
2. **@human — THE MORNING'S AGENDA. The app IS running; the architect
   relaunched it at ~05:30 out of main**, and this merge left it running.
   **YOUR RUNNING APP STILL HAS THE OLD 800×600 WINDOW** — the manifest
   is read at launch, so **relaunch to see T-051**. You pick up
   everything at once: T-042's genesis truthfulness, T-014's 23 CSS
   bytes, and **T-027's entire screen, now at a size that fits it**.
   **READ THIS BEFORE OPENING A GENESIS FOLDER.** The interview
   auto-starts on arrival, and on this machine the CLI login is revoked
   — so the first turn fails, and the failure is a DEAD END rather than
   a diagnosis. Traced end to end and recorded in T-029's notes: the CLI
   exits 1, which types as `ExitNonZero`; this failure carries NOTHING
   on stderr; `failureDetail` returns null on an empty detail and
   `FailureBlock` renders the detail span only when non-null. **So the
   screen says exactly "the planner exited with code 1", shows no detail
   at all, and offers a Try again button that will fail identically
   forever.** Nothing points at the login. **Run `claude login` first.**
   The 401 IS already parsed (`runner.rs:896-902` emits a Diagnostic
   carrying it) and routed to a channel the failure block never reads —
   **the gap is delivery, not detection**, which is why T-029's
   `AuthFailed` criterion should lead that task rather than trail it.
   To reach the interview at all a folder needs NO `docs/ROADMAP.md` and
   NO `docs/tasks/*.md` (`PlanProbe::has_plan`, `docs_watch.rs:414` — an
   `ARCHITECTURE.md` alone is still genesis-eligible). There is no
   `genesis-demo` folder anywhere on disk; `mkdir` one.
   - **THE T-027 VISUAL JUDGMENTS, now FIVE — T-051 answered the sixth**:
     1. **The one-question-at-a-time feel** — is the current question big
        enough to be the only thing on the left?
     2. **The challenge treatment in LIGHT AND DARK.** The two new tokens
        have **no dark source in the design bundle at all** and are
        family-derived — the one place the design had to be extended
        rather than followed, so the one place your eye is the only
        authority.
     3. **The eight disclosed deviations**, especially the **line-height
        gap**: design 1.55/1.6/1.5 against the tokens' 1.43/1.45/1.41,
        read at real size. The tokens won pending your call.
     4. **The 640/lens balance at 1280 and 1440** — and this is now the
        DEFAULT rather than a size you have to drag to. At 1280 the halves
        are exactly equal (640/640).
     5. **ANSWERED BY T-051**: the lens now renders at the app's own
        window. What REMAINS yours is **T-051-s3**: the default height is
        **840**, and whether it should be **867** depends on the ~28px
        macOS title bar — the one number nobody could measure headlessly.
        Look at the window on a real screen and rule.
     6. **Does the header's "nputer + project path" read as the design's
        "nputer — new project"?**
   - **ONE REAL OBSERVED PLANNER TURN, on an authenticated machine** —
     still the biggest unobserved thing in the project, and the ONLY
     thing standing between milestone 3 and an honest claim. This
     machine's `claude` OAuth token is revoked, so no model call has ever
     gone through the runner. **T-025-s2 carries the exact command.**
   - **The at-a-glance amber judgment**; **the launch shot**; **T-023's
     dry-run transcript quality**; **a Linux run** (the "watch the first
     CI run" item).
   - **T-050-s2 still matters most of the older set**: escaping the
     failure screen with "Open a folder…" rather than "Try again" reaches
     a board with real content that is **silently dead**. Use "Try
     again".
   - **The six T-034 judgments**, of which **WAVE 0 IS A WALL
     (T-034-s1)** is the big one: 32 of 50 cards in one wave, a
     1440×3818 canvas in a ~600 px pane. The question is whether the lens
     is USEFUL there, not whether it is correct — correct it demonstrably
     is.
   - **The model badges should be SHORT** (T-030-s1): T-020's and
     T-024's cards should read `opus`; T-001's verified-by badge should
     read `+`, and **the judgment that is yours is that `+` is honest but
     ugly**.
   - **The header's density** (T-049's item); **T-024's pane light AND
     dark**; **T-026's front door light AND dark** (read **T-048-s4
     BEFORE T-048-s3** — s3's conclusion is wrong); the real picker
     flows; the `tauri dev` quit-the-app orphan check (T-025-s7's ~5 s
     hang is expected and harmless).
   - **The T-047-s6 stray, a decision not a look.**
     `~/.claude/projects/-private-var-folders-…-t047va-count-97806-…/` —
     outside the repo, deliberately not deleted. **Delete or keep.**
3. **MILESTONE 3 (F-03) — NOT CLAIMED, and T-051 moved it in a way worth
   naming.** T-023 → T-024 → T-026 → T-037 → T-025 → T-039 → T-041 →
   T-042 → T-048 → T-049 → T-050 → T-027 → **T-051** are through the
   pipeline. **T-028 is VERIFIED and awaiting merge; T-029 remains.**
   T-051 did not add a feature — it made an existing one VISIBLE, which
   is the difference between shipping the split and shipping a split
   nobody sees. T-029 is worth more than its position suggests: the
   user's half of the transcript does not survive a remount or an app
   restart — `refreshGenesisStatus` rebuilds phase/turn/session but never
   `turns` — so a mid-interview reload shows an empty chat over a LIVE
   session. And beyond both: **one observed real turn**, which is the
   evidence the milestone's claim will rest on and which has never
   happened. **MILESTONE 4** carries T-010, T-013, T-015 and T-053.
   **T-010 is still the interesting one** — it makes `languages: ["ts"]`
   false, indexes the 44 `.rs` files, turns the four unclaimed ones into
   live unmapped-territory findings, and gives `arch drift` something new
   to say.
4. **OVERNIGHT DISPATCH GRANTS and the BACKLOG.** Grant 1 (**milestone 3
   to completion**) is what T-028 and T-029 execute; grant 2 closed at
   T-034; grant 3 (third triage applied) stands, and **tasks NEWLY
   created by triage still do NOT dispatch without the human.** Unchanged
   method rules: a second REJECTED parks a lane for the human; @human
   judgments are never self-answered; no screen control beyond the ruled
   boot check; **port 1420 is the human's, and it is OCCUPIED.**
   **LANE AVAILABILITY.** `app-shell` is **HELD BY T-028 ALONE** now —
   T-051 released its half. `lib-parser` FREE (**T-055**, **T-031**,
   **T-032** — and **T-032 carries T-034-s7**, a criterion that reads as
   an instruction to type a control byte and **should be amended BEFORE
   it is built**); `crate-index` free (**T-010**, **T-013**, **T-015**);
   `app-agent` free (**T-043**); `app-map` free (T-013, T-015, T-032's
   map-badge half). `app-interview` is held by T-028. The standing
   app-shell queue's next named item is **T-022** (M, milestone 4,
   `blocked_by: []`), which T-034-s3 made bigger.
   **THE SIXTEEN PARKED are unmoved**, each re-checked at the third
   triage against the tree: the nine standing (T-003-s2, T-008-s1,
   T-018-s1, T-021-s1, T-025-s2 @human, T-025-s3, T-025-s4, T-026-s1,
   T-038-s1) plus seven new — T-014-s5, T-030-s1 (@human), T-034-s1
   (@human), T-034-s4 (@human), T-045-s3, T-046-s3, T-047-s2.
   **The test that moves them**: *what merged recently that makes this
   item's "not live yet" clause false?* **T-051 is a live worked example
   for the next triage**: it makes the app open at 1280×840, so any
   parked item whose premise was "nobody sees this at the default size"
   has just expired.

## Health of the tree

The T-051 worktree is removed and its branch KEPT — **39 task branches
merged now**. Main tree clean; every suite green; the token lint green
over 109 files at zero allowlist; the committed graph current and proved
so **twice, by two independent instruments**. The parser re-parses the
whole live tree at **0 issues**, with this merge's ten new `docs/tasks/`
files in it.

**THE BOARD, as MAIN sees it**: **94 task files**, tally **40 done / 25
planned / 16 parked / 13 suggested / 0 building**, plus **9 in
`rejected/`**. 6 features, 11 components. **85 → 94 is T-051's nine
suggestions**; **39 → 40 done and 26 → 25 planned is T-051 itself.**
T-028 is live in a worktree and flips to `building` only on its own
branch, so the board on main honestly shows nothing in flight while one
lane is.

**THE FRESH-INSTALL PROOF, RELOCATED — the shape T-052 wants, walked a
second time.** Run in a throwaway `git worktree` at the merge commit
with the checkpoint's uncommitted diff applied, so `npm ci` never went
near the `node_modules` under the human's live vite. The worktree was
verified to carry the EXACT tree this commit lands — sha256 on
`graph.json`, both dogfood fixtures, `ROADMAP.md` and `ARCHITECTURE.md`,
all MATCH — before anything ran. Both columns agree exactly:

    package        in MAIN (existing node_modules)   in the scratch worktree (npm ci)
    lib/parser     225/225, 11 files                 225/225, 11 files    (55 pkgs, 0 vulns)
    app            724/724, 39 files                 724/724, 39 files    (499 pkgs, 0 vulns)
    app/src-tauri  299 passed / 3 ignored            299 passed / 3 ignored  (COLD build, own 2.2G target)
    tools/e2e      65 passed in 12.0s                65 passed in 12.5s   (8 pkgs, 0 vulns)
    lint:tokens    clean, 109 files                  clean, 109 files
    selftest       49 + 14 green                     49 + 14 green

**Every exit code 0 on both sides, and the app bundle hashes MATCH**
(`index-Ch0Gpkv4.js` 484.43 kB / `index-DSR1ACex.css` 43.30 kB) — an
existing `node_modules` and a lockfile-exact `npm ci` produce the same
bundle from the same tree. `STATE.md` itself was written after the
worktree ran and is the ONLY file not in it: it is inert to every suite
except the parser's live-tree walk, which was **re-run in main
afterwards, unpiped, exit 0, 225/225** with this file in place.

**PORTS: 1420 IS OCCUPIED AND THAT IS DELIBERATE.** The architect
relaunched the app out of the MAIN checkout at ~05:30 (node pid 81894,
one listener). **Every agent has been briefed to probe it read-only and
never bind, connect to or signal it**, and every lane and verifier has
honoured it — T-051's boot gate took 15131 during verification, this
merge's 16410, its e2e lane 16411 and its fresh-install lane 16412. No
OTHER listener is bound; no stray `tauri dev`, `vite` or boot-check
process survives beyond the human's own app. **The integrator who takes
T-028 inherits T-052's problem live**: main's `node_modules` is under a
running vite, so a fresh install there kills the app (mechanism B).
Run installs in a scratch worktree — **that route is now walked twice
and documented** — or refuse loudly. A skipped gate is news, never
silence.

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. **T-051's security posture is easy to state and was
verified rather than argued**: zero Rust, zero IPC call sites, zero new
grants (`EXPECTED_GRANTS` byte-identical at three refs, proven above),
zero new dependencies, zero lockfile lines, and a 0-file diff under
`app/src/`. What it changes is four integers in a manifest the app reads
at launch; the widest thing a wrong value can do is open a window of the
wrong size. The sharpest open set is unchanged and still app-agent's:
**T-047-s5**, **T-047-s6**, **T-047-s4**, **T-047-s1**; beside them
**T-046-s1** and **T-041-s4**. **T-060 is the card that would close most
of it and it is undispatched.**

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020).
T-051 adds **zero CI steps** (`.github/` is a 0-file diff) but it DOES
add a lane spec, so the workflow's shape is unchanged while its lane
grows by five tests. The cautions for a Linux runner are unchanged and
one is now sharper: T-027's and T-051's lane specs measure **geometry**
against a real bundle and real CSS, and font metrics and scrollbar widths
are not identical across platforms — **read T-051-s8 and T-051-s9 first
if a lens or window assertion reds**, because s9 records that the floor
sits exactly on the breakpoint and s8 records that the lens region's
margin can be zero. Otherwise unchanged: the ubuntu apt/webkit2gtk set;
the three `uses:` SHA pins; the `e2e types` step (still never executed on
any runner); T-034's `map-tasks-lens-dom.test.tsx` reading the BUILT
stylesheet, so **build-then-test ORDER is load-bearing** — and
`window-manifest.test.ts` now reads it too, with its own explicit
"rebuild before trusting this probe" guard; T-014's nputer-index watch
timings measured on FSEvents; `cargo audit`; the xvfb boot check; and the
THREE T-018 SENTINEL live tests.

## Open questions

- **What does the pipeline owe a task whose VERIFIER vanishes
  mid-flight?** **ANSWERED IN PRACTICE THIS MERGE, and the contrast is
  the useful part.** T-053's verifier approved and left without
  committing, so ADR-016's two-mark set existed nowhere until the
  checkpoint wrote it and the integrator transcribed hearsay. **T-051's
  verifier committed its verdict and all four stamps to the card
  (`8a1cdbb`) before it ended**, so this integrator verified the marks
  and transcribed NOTHING. Same house, same role, two behaviours, one
  merge apart — which is exactly the evidence that the stamps being the
  verifier's LAST act is a convention nothing currently enforces. **The
  cheap fix is one clause in TASK-FORMAT**; the architect's call
  (ADR-004). The question stays open only because nothing is written
  down, not because the answer is unclear.
- **Does the BOOT GATE rule retire, and when?** Carried forward.
  **T-051 is the strongest argument yet for KEEPING it, and also the
  merge that showed its limit.** It is the first task ever to edit the
  window block — the exact manifest class T-040 regressed — so the gate
  fired on the change it was written for and proved the app launches.
  But **T-051-s7 shows the gate would have passed a kebab-cased
  `min-width` too**, because that spells an accepted serde alias rather
  than an unknown field. So the gate's real guarantee is narrower than
  its reputation: *the manifest parses and a window is created*, not
  *the manifest says what you meant*. Both halves belong in the
  retirement argument. Left for triage.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** Still LIVE and unchanged in substance:
  `method/roles/executor.md` still says only "run the test commands from
  CONVENTIONS.md until green", while four rules now share the
  trigger → command → record → IF-it-cannot-run → why shape. A method
  version bump, not an ADR.
- **When does the C0/searchability rule become a gate?** Unchanged in
  substance and still at **THIRTEEN reproductions across five sessions**,
  one of them inside the card describing the mechanism. The habit is
  **ten-for-ten**. Still no gate. T-058 owns it; the adjacent
  Tailwind/`app/src-tauri` finding argues the same way — *the walk policy
  IS the gate*. **This merge adds a second face of the same idea**: the
  graph's walk (`.nputerignore`, `tools/` excluded) and the token lint's
  walk (`app/src`, `app/test`, `tools/e2e`) disagree about the SAME two
  new files — one indexes one of them, the other lints both. Neither is
  wrong; but "which walk sees this file" is now a question with three
  different answers in one repo, and no document states them side by
  side.
- **Does the shared main working tree need a rule?** Carried forward
  with a **TWELFTH face: the first merge that disturbed the running app
  NOT AT ALL, and could prove it.** The T-052 procedure was exercised
  correctly again (no install in main; fresh-install proof relocated to a
  throwaway worktree), and this time the parser build that caused
  instance 5 at T-053's merge was a **measured no-op** — T-051 edits no
  parser source, dist byte-identical before and after, zero per-file
  differences against a fresh `npm ci`. **That matters for the rule's
  shape**: "say what you disturbed" has to be answerable with NOTHING as
  a real answer, backed by a measurement, or it degrades into ritual
  throat-clearing. It also nearly went wrong here — the first measurement
  said "drifted" and was an artefact of comparing rollups across working
  directories (above). **So the rule wants two clauses, not one: say what
  you disturbed, AND say how you measured it.** Method/process, so the
  architect's (ADR-004).
- **When does spawn hygiene become an ADR?** Unchanged: when T-047-s5
  lands.
- **Does a verifier's remedy belong in an acceptance criterion?**
  Carried forward, **ELEVENTH data point**, and T-051's is the sharpest
  yet: the verifier found that the card's stated REASON for a passing
  test is false (s7) while the test itself is correct. It neither
  rejected nor amended — it approved and filed the correction. *The
  criteria were met; the justification written beside them was wrong* is
  a fourth statement beside the three this question already tracks, and
  it is the one most likely to become folklore, because a green test
  looks like evidence for whatever comment sits above it.
- **Should a card's own numbers be treated as a claim to verify rather
  than a brief to implement?** **T-051 is the EIGHTH instance in eight
  merges and it is the most emphatic**: the card's width arithmetic
  double-counted the 1px rule (real floor **1279**, not 1280), its
  minHeight guard measures a one-node map so its "37px to spare" is
  really **8px**, and its stated parse-failure reason is false outright.
  **Every criterion still HELD** — the shipped values are right — but
  three of the numbers justifying them were wrong, which is the pattern
  in its purest form. **And the FORECAST WAS COMPLETE for the second
  merge running**, derived before anything ran, including the
  second-assertion-in-the-same-body trap. Both limbs still want writing
  down: *a numeric claim is evidence to reproduce, AND an enumerated list
  of what will move is a floor rather than a ceiling.* Method version
  bump, the architect's call (ADR-004).
- **When a task retires a test, who owns the property it was reaching
  for?** Carried forward from T-045, unchanged.
- **What does the pipeline owe a task whose builder vanishes
  mid-flight?** Carried forward from T-050, unanswered.
