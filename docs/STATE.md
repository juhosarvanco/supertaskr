# State

Updated: 2026-08-16 by integrator (T-041 merge), claude-opus-5 @fresh

## Just completed
T-041 (shell harness — the served bundle can reach every front-door
state, M, app-shell + tools/e2e) done and merged — built by
`claude-opus-5 @fresh`, verified by `claude-opus-5 @fresh`,
`review: same-model`, **APPROVED first pass**. It absorbs T-024-s1 and
T-026-s7, and it is **the hard gate T-027, T-028 and T-029 were each
writing cheques against**: all three name a served-bundle probe in
their Verification lines, and until today none of them could have
written one. The reason was structural, not lazy —
`window.__nputerDocsHarness` exposed only `{ apply, getState }`, and
`apply` is `applyDocsPayload`, which in a browser always lands on phase
`open`. `noProject`, `noDocs`+probe, `rejectedPick` and `genesis` come
only from `applyProjectStatus`/`reducePickOutcome`, both behind the
Tauri branch. **Four of the five phases were simply unreachable from a
served bundle.** They are all reachable now.

**WHAT SHIPPED.** A DEV-only `window.__nputerShellHarness`
(`applyProjectStatus` / `applyPickOutcome` / `getShell`) installed
inside **exactly the same `!isTauri && import.meta.env.DEV` block** that
already fences the docs harness — not a copy of the gate, the same
gate, the same statement sequence, in `watcher-store.ts`. Plus:

- **`commitPickOutcome` EXTRACTED from `runPicker`** — `runPicker` minus
  the `invoke`. The harness therefore drives SHIPPED code rather than a
  parallel implementation, and a parallel implementation would now have
  to be written on purpose, because the only spelling in the file is the
  shared one. The verifier checked behaviour preservation line by line:
  `const before = shell` is still read after `invoke` resolves,
  `if (next !== before) {…}` became `if (next === before) return; …`
  (the same branch inverted), the assignment → listener loop → echo
  condition keep their order and their text, the call sits inside the
  SAME `try` so a throw still lands in the same `catch` and still sets
  `rejectedPick`, `finally` still clears `picking`, and
  **`reducePickOutcome` still returns `prev` BY IDENTITY** for
  `cancelled`/`busy` — `applyPickOutcome({kind:"cancelled"})` leaves
  `getShellState()` `toBe(before)` and notifies nobody.
- **Three lane specs against the real bundle and the real sheet** —
  `front-door.spec.ts` (3), `no-plan-card.spec.ts` (4),
  `genesis-screen.spec.ts` (3). Colours are resolved by a probe element
  from the served stylesheet, never hard-coded hex; the ○/✓ marks are
  derived from the probe the spec itself sent, row by row.
- **THE PROBE T-024 COULD NOT WRITE.** The genesis spec drives the
  bundle to phase `genesis` and asserts T-024's PANE strings **inside
  `genesis-pane-slot`** — `genesis-file-count` = `docs/ · 9 files
  written`, the north-star title byte-for-byte, three `genesis-chip`s by
  `data-kind`, five `genesis-feature` cells, nine `genesis-artifact`
  rows in banking-map order, comment-aware assumption badges
  (`4 [?]`/`2 [?]`), `stage ~8 · decomposition`, `data-stage="8"` —
  never the screen's own strings. The fixture is **T-024's real tree
  read from disk** (`app/test/fixtures/genesis/streak/docs`), and the
  verifier proved that rather than reading it: perturbing ONE byte of
  the real NORTH_STAR.md (`terminal.` → `TERMINAL.`) reds the pane
  assertion with the perturbed string visible in the rendered text, and
  adding a tenth file throws the fixture's own loud "reconcile rather
  than loosen".
- **`getShell` reports the PHASE, and the phase genuinely
  discriminates.** `data-screen="empty"` is shared by THREE different
  shell states; the verifier built the confusable cases and required
  red — `noDocs`→`noProject` and `open`+rejectedPick→`noDocs`, both with
  byte-identical `data-screen`, both RED. A selector-only probe cannot
  tell a rejected pick over an open project from a launch that resolved
  nothing; `getShell` can.

**THE TWO RESULTS THAT MAKE THIS TRUSTWORTHY, and they are measurements
rather than greps.**

- **THE HARNESS COSTS 17 BYTES IN PRODUCTION — and the 17 bytes are the
  refactor, not the harness.** Not "we grepped and found nothing": the
  verifier built THREE trees. Pristine main → `index-DvrlAOQE.js`,
  **442,052 B**. Main plus ONLY the `runPicker`/`commitPickOutcome`
  split, with the harness, the type, the snapshot function and the test
  file all absent → `index-vTAlOtQD.js`, **442,069 B**, sha256
  `3132ec98549553481f9422b8e0f999621b80406850732d8dfa64ba0d9c6d63fb`.
  T-041's HEAD → **the same name, the same 442,069 bytes, the same
  sha256.** So the harness contributes ZERO bytes, and the object
  provably never CONSTRUCTS — proven by grepping for `failureCount`, a
  field that exists only inside `shellHarnessSnapshot` (0 hits), against
  seven in-bundle controls that all hit (`"no project open —"`,
  `model-updated`, `"No plan in"`, `"the project, so far"`,
  `docs-changed`, `docs_snapshot`, `genesis-pane-slot`). The controls
  are the point: the store and the pane ARE in that bundle. **The test
  surface is not "small in the bundle"; it is not in the bundle.**
  *Re-derived at this merge*: `npm run build` on merged main emits
  `index-vTAlOtQD.js`, **442,069 bytes**, sha256 `3132ec98…` — the same
  asset, third independent measurement.
- **ONE REAL GATE-DEFEAT PATH EXISTS AND IS FILED.**
  `npx vite build --mode development` does **NOT** flip DEV — the asset
  comes out sha-identical to the production one, because Vite's CLI
  forces `NODE_ENV=production` for builds. But
  **`NODE_ENV=development npm run build` DOES** flip it (696,302 B, all
  four harness markers present) — and `tauri.conf.json`'s
  `beforeBuildCommand` is `npm run build`, so an inherited env var could
  package the harness. Two things keep it from being a hole: the runtime
  `__TAURI_INTERNALS__` half still fences it (the verifier read the
  emitted code — the install is still inside `if(NS=!0,!Wo){…}`), and
  the branch's own bundle test reds on the next `npm test`. Filed as
  **T-041-s4** with the table.

**THE @human ITEM THIS TASK MEASURED, AND WHERE IT NOW STANDS.** The
genesis screen overflows at **every ordinary window size**, not just
short ones: at **800×600 — the app's OWN configured window — by 572px**;
1024×768 by 373; 1280×720 by 390; 1920×1080 **still by 30**. It stops
overflowing only at a 1110px viewport, and the pane's own scroll region
measures **796/796 at every height**, i.e. it never engages at ANY size,
because the column is content-sized rather than bounded. The verifier
also **FALSIFIED the fix that was filed with the measurement**: flipping
the two `min-h-screen` to `h-screen` alone leaves the page scrolling
1110 against 720. The missing link is **`min-h-0` on
GenesisScreen.tsx:37**; with all three edits the page stops scrolling
(720/720) and the pane's region engages (796/406). That correction is
**T-048**, human-approved mid-review "because the screen is unusable at
the size the app actually opens", and BUILDING now. **The composition
question — full-width vs the right half of a split view — is untouched
by all of this. It remains T-027's and it remains @human.**

**A COORDINATION DEBT, and this merge SHRANK it.** T-041's lane spec
(`tools/e2e/tests/genesis-screen.spec.ts`, the block at ~196-228)
currently **PINS the overflow as a tripwire**, asserting the broken
numbers on purpose: `pageScroll > viewport` and `scrollHeight ===
clientHeight`, with a comment that says outright it is "a tripwire on
today's truth, not an endorsement of it". T-048's **criterion 5** owes
the replacement — assert the FIXED behaviour and rewrite the comment to
name T-048 rather than the open question. **A tripwire silently passing
on the old numbers is the one outcome nobody wants.** The good news:
T-041 merged FIRST, so that spec is **on main now**, and T-048's builder
can edit it directly in its own branch. The "drafted-for-integrator
hunk" workaround that was expected when T-048 was dispatched (the file
did not exist at its branch point) **is no longer needed** — but the
obligation is unchanged and it must not be forgotten.

**THE ENCODING DEBT IS CLOSED, and it is worth saying why it arose.**
T-048 was dispatched (`0378cb9`) carrying `Absorbs: T-041-s1,
T-041-s3` while both suggestion files were still on the unmerged
`t041-shell-harness` branch, so the absorbing commit could not delete
them — the ratified rule (method/tasks/TASK-FORMAT.md v0.1.4, T-016) is
"Absorbs: line PLUS the suggestion file removed in the same commit", and
the second half was undeliverable at the time. **This checkpoint deletes
both** (`docs/tasks/T-041-s1-genesis-column-is-unbounded.md`,
`docs/tasks/T-041-s3-h-screen-alone-does-not-bound-the-column.md`), so
the board no longer shows a promoted suggestion as open. **The general
shape, for whoever writes the rule: when a triage absorbs a suggestion
that lives on an unmerged branch, the deletion falls to that branch's
integrator, and nothing in the encoding says so.** T-041-s2 and
T-041-s4 stay — nothing absorbs them.
*Note the three surviving references to `T-041-s1` in
`genesis-screen.spec.ts`'s tripwire comment were deliberately left
alone.* They are not dangling: an absorbed id lives on inside the
absorbing task, which is exactly what `Absorbs:` means. And that block
is T-048's criterion-5 territory — an integrator rewriting a spec's
assertions mid-flight, for a task already dispatched to rewrite them,
would be the wrong hand on the pen.

**T-041-s2, carried forward because the harness raises its stakes.**
The picker/status wire shape is **pinned in Rust**
(`genesis_and_no_docs_wire_shapes_are_pinned`, docs_watch.rs:2641,
asserting the serialized JSON literally) and **mirrored by hand in TS**,
with **nothing comparing the two**. tools/e2e now mirrors the mirror:
three specs assert shell coverage against payloads a TS file invented.
T-041 neither creates nor widens the gap — it adds no IPC and changes no
wire shape — but it is worth closing **before** T-027/T-028/T-029 write
more specs on that surface.

**SUITES ON MERGED MAIN**, all four re-derived here first-hand, fresh
installs, ADR-011 order:
- lib/parser `npm ci` + `npm test` **159/159 (10 files)**, `npx tsc
  --noEmit` clean, `npm run build` clean. **Re-run after the docs edits
  and after the graph regen — still 159/159**, which is the positive
  proof that `lib/parser/test/smoke.test.ts` did NOT move (see the regen
  section).
- app `npm install`, `npx tsc --noEmit` clean, `npm run build` exit 0
  (**252 modules**, `index-vTAlOtQD.js` **442.07 kB** /
  `index-BheOMAjN.css` 41.24 kB), `npm test` **491/491 (28 files)** =
  483 + the 8 new — exactly the forecast. Re-run after the fixture
  reconciliation: **491/491 again**.
- app/src-tauri bare `cargo test` **208 passed + 3 ignored, 0 failed**,
  exit 0, summed across **11 test binaries** (100 / 0 / 0 / 28+1 / 68 /
  3 / 7 / 0+1 / 2+1 / 0 / 0) — unmoved, as it must be for a branch with
  zero Rust. **NOT piped through `tail`** (the standing trap: T-046's
  verifier fell into it and T-020's notes record it). The unnamed
  `agent_runner` flake did not appear.
- tools/e2e `npm ci` + `npx playwright test` **33/33 in 8.0s**,
  headless, one worker, retries 0, no skips. **Derived rather than
  trusted**: 23 at the branch point after T-046, plus exactly 10 new,
  counted off the run's own listing (front-door 3, genesis-screen 3,
  no-plan-card 4). `npm run typecheck` clean · `npm run lint:tokens`
  **clean, 37 files** · `--selftest` **43 samples green**.

**THE BOOT GATE FIRED, AND THIS IS THE FIRST MERGE IT GOVERNS.** T-046
landed the CONVENTIONS bullet one merge ago and — as that checkpoint
recorded — did not fire on itself. This diff touches `app/src/**`
(`watcher-store.ts`), so the trigger is met. Run on scratch port
**14521**, never 1420:

    [boot-check] port 14521 free — spawning `npm run tauri dev -- --config {…}` in /Users/ujju/Projects/nputer/app
    [boot-check] NPUTER_BOOT_PORT=14521 — threading --config {…}
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] process tree stopped (exit=null signal=SIGTERM)
    BOOT_EXIT=0

**Exit 0, both `[nputer]` startup lines, and NO STRAYS.** It was run
TWICE — the first run's exit code was lost to a `$PIPESTATUS` that zsh
does not define (zsh spells it `$pipestatus`), and **a gate whose exit
code was not actually captured has not been recorded**, so it was re-run
rather than inferred from the success text. Both runs identical. After
each: `lsof -nP -iTCP:14521` empty (the scratch port released),
`lsof` on 14520 empty, `pgrep -fl tauri-boot-check` empty, and a full
`ps` showed the ONLY surviving tauri/vite/`target/debug/nputer`/esbuild
processes were **the same pids that existed before** — 89936/89938/89953
the human's `tauri dev` chain, 90127 its vite, 90128 its esbuild, 1753
its app binary — every one with an unchanged start time. **T-046-s1 did
not bite on this path**, which is consistent with s1 (it names the
SIGKILL-mid-boot path, not the orderly exit).

**1420 was never bound, contacted or signalled.** The human's vite still
holds `[::1]:1420` on **the same pid 90127, the same fd 28u, the same
device 0xc074e387883bd776** as before the merge began. The lane bound
14520 only; the boot check bound 14521 only.

**The one honest side effect T-046's checkpoint predicted, observed
again**: the boot check's `--no-default-features` build **relinked
`target/debug/nputer`** (39,626,680 → 39,597,432 bytes, mtime 18:24:52 →
18:25:54). The RUNNING app was unaffected — pid 1753 kept its 14:04:31
start time, because a replaced file does not disturb a process holding
the old inode. Same target-dir sharing `cargo test` already does. Not
new, not filed.

**THE MERGE WAS CLEAN, AND THE ANTICIPATED COLLISION DID NOT EXIST.**
Merge commit **`9e70ea9`**, merge-base `2961599`, twelve files.
`tools/e2e/tsconfig.json` was flagged in advance as the one real
collision risk — T-046 edited it (added `allowJs`) — and it is **not on
T-041's side at all**. The two changed-file sets were enumerated and
`comm -12` is **EMPTY**: T-041 carries `app/src/lib/watcher-store.ts`,
`app/test/shell-harness.test.ts`, five files under `tools/e2e/`
(`fixtures/shell.ts`, `tests/shell-harness.ts` and the three specs) and
five under `docs/tasks/`; main since the base carries
`docs/CONVENTIONS.md`, `docs/STATE.md`, six task files and four under
`tools/e2e/` (`scripts/boot-port.mjs`, `scripts/tauri-boot-check.mjs`,
`tests/boot-check-guard.spec.ts`, `tsconfig.json`). **Both lanes land
under `tools/e2e/` and still share nothing** — T-046 owns `scripts/`,
`tsconfig.json` and `boot-check-guard.spec.ts`; T-041 owns `fixtures/`
and four new files under `tests/`. `git merge-tree --write-tree` was run
first and produced zero conflict markers. Neither ../nputer-t047 nor
../nputer-t048 was entered.

**A BRANCH-POINT DIVERGENCE THE NEXT INTEGRATOR MUST KNOW ABOUT, found
while checking the pre-conditions.** Main's T-046 checkpoint is
**`37cb0ed`**. The `t048-frame-holds` branch — and its worktree — sit on
**`cf5a650`**, which is **NOT an ancestor of main**: it is a SIBLING,
same parent `0378cb9`, same tree except **two lines of docs/STATE.md**
(cf5a650 gives T-047's worktree hash as `242697f`; 37cb0ed says it is
moving to `28efd7f`). Both were committed at 18:20:59 and one was
evidently remade. Consequences, stated plainly so nobody rediscovers
them at merge time:
- `git merge-base main t048-frame-holds` is **`0378cb9`**, not the
  checkpoint. So at T-048's merge **both sides will have rewritten
  docs/STATE.md** relative to that base, and **a docs/STATE.md conflict
  is expected**. The correct resolution is **take main's side whole** —
  the t048 side is a stale near-duplicate of a checkpoint main has since
  superseded twice.
- T-048's branch therefore does NOT yet contain this merge or T-046's
  checkpoint STATE. Its builder should merge or rebase-forward
  deliberately (**never rebase per house rule — merge main into the
  branch, or branch afresh**) before touching
  `tools/e2e/tests/genesis-screen.spec.ts`, which only exists on main as
  of `9e70ea9`.
- `t047-runner-trust` is unaffected: its merge-base is the ordinary
  `2961599`, and its file set (`app/src-tauri/src/agent/**`,
  `tests/agent_runner.rs`) shares nothing with this merge — re-checked
  here rather than inherited.

STANDING INTEGRATOR PRACTICE (T-009-s1, the ratified CONVENTIONS interim
regen rule; retires when T-014's `nputer index --check` becomes the
gate) — **SIXTEENTH** exercise, and unlike the last two it **MOVED THE
GRAPH**. The rule fires on a merged diff touching
`*.ts/*.tsx/*.js/*.jsx` outside docs/, and this diff carries **seven**
such files. Order per ceaa949, held for the tenth time: **fixture edits
BEFORE the final regen.**
- Deltas, each re-derived here by full added/removed enumeration against
  `git show HEAD:docs/architecture/graph.json`, and **every one matches
  the verifier's forecast**: files **88 → 89**, symbols **595 → 602**,
  edges **990 → 1003**. One file added
  (`app/test/shell-harness.test.ts`), **none removed**;
  `app/src/lib/watcher-store.ts` content-changed 560 → 659 loc and
  37 → 40 symbols.
- **Fifteen edges added and TWO REMOVED — the first removals this
  fixture has ever recorded.** Not churn: it is the refactor as
  topology. `runPicker`→`reducePickOutcome` and `runPicker`→`sendEcho`
  are gone, replaced by `runPicker`→`commitPickOutcome` plus that new
  symbol's own three call edges. The same +17 production bytes, seen
  from the other side.
- **`tools/` is invisible, checked rather than assumed**:
  `.nputerignore:8` is `tools/`, and the regenerated file list contains
  **zero** paths under it. A merge that lands ten new lane tests moves
  the map by exactly one file.
- **FOUR fixture assertions moved, not three — and the discrepancy is
  structural, so it is recorded rather than smoothed over.** The
  verifier forecast three (`toBe(88)`→89, `["C-05","C-10","confirmed",
  19]`→20, and `committed graph · 88 files`→89) and **all three are
  right**. The fourth is `["C-05", 38]` → **39** in the same it() body
  as the file count — vitest stops at the first failing `expect`, so a
  forecast read off a failure list under-counts every assertion sitting
  behind another one. The it() TITLE moved too ("all 88 files map" →
  "all 89 files map"), per the precedent of every prior regen. Two
  files: `app/test/architecture-dogfood.test.ts` and
  `app/test/map-dogfood-render.test.tsx`, each with a dated
  reconciliation comment enumerating the deltas.
- **Relation table: same 28 rows, same 13 confirmed / 6 undeclared / 9
  planned tally, EXACTLY ONE observedCount moving** — C-05→C-10 19→20.
  **Findings: nothing added, removed or renumbered** — five D1 rows and
  three D3s, byte-identical, because the new suite's only
  cross-component import is watcher-store and C-05→C-10 is already
  CONFIRMED, so it deepens an honest edge instead of raising a finding.
- **`lib/parser/test/smoke.test.ts` did NOT move**, as forecast — no
  component is declared, so the T-024-s5 three-fixture rule does not
  fire in its registry form. Verified positively: lib/parser re-run
  **159/159** against the regenerated tree.
- **Determinism**: the final regen was run **twice** and the committed
  file is byte-identical both times — sha256
  `05ebc2c772ffa3aaabc23aefa0feae60f2c4652ab9e64ac1c64de0044f5e478a`,
  **368,496 bytes**, 89 files / 602 symbols / 1003 edges. The **plain
  (non-golden) ignored self-check** was then run separately and is the
  positive proof rather than an absence: `self_graph_is_current ... ok`
  on the merged tree.
- **The ceaa949 ordering lesson, measured again rather than asserted**:
  regenerating BEFORE the fixture edits gave sha
  `83ba6f02588c2481900a3101489542d00a639f4ab44b5758b8cd0ebee68e7e05`;
  regenerating after them gives `05ebc2c7…`. A regen-first ordering
  would have committed a stale graph.

**No model call was made anywhere in this merge.** No screen control, no
screenshots, no OS input injection, nothing read off the screen. The two
boot runs opened and closed their own window, which is the @human ruling
of 2026-08-16 that T-046 rests on and this merge does not extend.

INTEGRATOR JUDGMENT CALLS, recorded.
- **ARCHITECTURE: EDITED — one new Interfaces bullet, "Test surfaces
  (DEV, browser-only)".** Ruled the section genuinely incomplete rather
  than merely terse. A reader of ARCHITECTURE.md today learns the app's
  boundary is the docs watcher plus two zero-argument entry commands
  plus four genesis commands over one event channel, and would
  reasonably conclude that is the whole exposed surface. **It is not**:
  in a browser DEV build there is a `window` surface that reaches the
  shell's real reducers and can drive it to any phase. Before T-041 the
  omission was defensible — the docs harness only fed snapshots and
  always landed on `open`. T-041 changes the CHARACTER of the thing from
  "feed the lens some data" to "drive the shell", and a surface a reader
  cannot learn about from the architecture document is a surface that
  gets rediscovered as a surprise. The bullet names both harnesses, the
  single shared gate, **why the code lives in `watcher-store.ts` rather
  than a test-only module** (a separate module could only reach the
  module-private reducers through NEW PRODUCTION EXPORTS, which exist
  whether or not a test imports them — the fenced window property is the
  SMALLER surface), the three-build byte measurement, and the one known
  lever with its filed id. Everything else in the file stayed true: the
  T-010 note that FOUR `.rs` files are claimed by no component is still
  exactly right and still exactly four, and the `tools/e2e/` description
  ("dev tooling under no component … .nputerignored out of the map")
  is unchanged and was just re-proved by the regen.
- **ROADMAP: NOT edited, and the T-039 disanalogy is the reason.**
  T-041 is unusual among gate tasks in being IN milestone 3 and IN F-03,
  so the T-046 precedent ("ROADMAP mentions T-020, T-036, T-038 and
  T-040 exactly nowhere") does not settle it by itself. The deciding
  question is what milestone 3's Progress line is FOR: it enumerates
  what a user can do. **T-041 adds no user capability** — the same
  bundle, minus 17 bytes of nothing. T-039 WAS named there, but for a
  reason that does not transfer: ROADMAP itself had said the remainder
  was "held by security debt", so retiring that hold changed a sentence
  already in the file. **T-041's hold was never stated in ROADMAP**, it
  was stated in T-027/T-028/T-029's Verification lines, and that is
  where its retirement belongs. The honest remainder (T-027, T-028,
  T-029, plus one observed real turn) is untouched and the milestone is
  still NOT claimed.
- **CONVENTIONS: NOT edited.** The BOOT GATE bullet was exercised for
  the first time exactly as written — trigger, command with the scratch
  port, record — and it needed nothing. The one friction encountered was
  mine, not the bullet's (see the `$PIPESTATUS` note above), and the
  right home for it is this checkpoint. The T-046 checkpoint's open
  question about whether BOOT GATE retires is **still open and still
  belongs to a triage**; an integrator who has now run the gate once is
  not thereby entitled to charter its lifetime.
- **NO NEW ADR (three-prong).** The candidate is real and was raised
  deliberately: *the shipping app's source may carry a DEV-only,
  browser-only test surface, fenced by a build-time AND runtime gate, in
  preference to widening the production export surface.* **Ruled
  CONVENTIONS-and-ARCHITECTURE-level, for three reasons.**
  (a) **T-041 does not establish the pattern; it re-uses one.**
  `__nputerDocsHarness` has lived behind that exact gate for many
  merges, and ADR-011 already refers in passing to "the dev harness" as
  an established fact of how the E2E lane reaches the app. The builder's
  own note is "not a copy of the gate: the same gate". A charter written
  at the SECOND instance of an existing pattern is a charter written
  late and for the wrong occasion.
  (b) **The ADR series' territory is what nputer IS or how it is
  shaped** — files-are-the-brain, shell-out-to-CLIs, app-first, native
  surfaces Rust-side, graph-as-committed-files, spawned-planner-lens.
  Where a test surface lives inside one module is an implementation call
  with a recorded rationale. It changes nothing a user, a component or
  another lane can rely on.
  (c) **The whole risk was closed by MEASUREMENT, and a decision whose
  risk is measured does not need a charter to hold it — it needs the
  measurement recorded where a reader will meet it.** That is now
  ARCHITECTURE's job, done above. The one residual lever is already a
  filed suggestion with a named remedy, i.e. backlog, not charter.
  **Prong two, verified as an empty set rather than by eye**:
  `git diff --name-only 2961599..HEAD` restricted to `method/`,
  `lib/parser/`, `app/src-tauri/`, `capabilities/`, `tauri.conf.json`
  and every `Cargo.toml`/`Cargo.lock`/`package.json`/`package-lock.json`
  returns **nothing**. So ADR-012 held (no native surface moved, zero
  grants touched, `acl_pin.rs` zero-diff), ADR-010 held (no webview
  grant), ADR-011 held (zero new crates, zero new npm deps, no lockfile
  line), ADR-003 held (no model call anywhere), ADR-014/015 held and
  were exercised (the graph was regenerated by the Rust indexer and
  committed; derivation stayed TS). The app/src export surface grew by
  **exactly one line and it is an `interface`**, erased at build; zero
  exports were removed or changed; zero new `invoke(`/`listen(`/`emit(`
  call sites. Prong three: the durable calls live in the task file's
  criteria→evidence map, its six proof obligations, and its four honest
  limits.

## In progress / broken right now
**TWO TASKS ARE `building`.**
- **T-047** (what the runner trusts from disk, app-agent), worktree
  ../nputer-t047 at **`28efd7f`** — **VERIFIED APPROVED and awaiting
  integration**. Merge-base `2961599`, disjoint from this merge
  (`app/src-tauri/src/agent/**` + `tests/agent_runner.rs`), so it should
  merge without reconciliation. Note it will be the SECOND merge the
  BOOT GATE governs — its diff touches `app/src-tauri/**`.
- **T-048** (the frame holds — the genesis page stops growing and the
  pane starts scrolling, S, app-shell, F-03), **BUILDING**, worktree
  ../nputer-t048. It absorbs T-041-s1 and T-041-s3 (both suggestion
  files now deleted — see the encoding-debt note above) and carries the
  corrected three-edit fix: two `min-h-screen` → `h-screen` **plus
  `min-h-0` on GenesisScreen.tsx:37**, which is the link the original
  one-line remedy was missing. **Read the branch-point divergence note
  above before merging it** — its base is `0378cb9`, a docs/STATE.md
  conflict is expected, and its criterion 5 must edit a spec that only
  reached main at `9e70ea9`.

**Do not enter ../nputer-t047 or ../nputer-t048.**

**THE SHARED-INDEX HAZARD, and it did not recur.** The T-046 merge
recorded that `git add` in the shared main working tree publishes staged
work to every other actor's next `git commit` — the architect's dispatch
commit swept that integrator's staged checkpoint edits, giving main the
shape merge → someone else's dispatch → checkpoint. This session was
told the pen was its own, and **`git diff --cached --stat` was checked
before every commit** to confirm the staged set was exactly its own.
The house shape here is clean: **merge → checkpoint**, two commits.
The lesson stands and still wants a rule: an integrator should stage and
commit in one breath, or the architect should dispatch from an index it
owns.

The t041 worktree is removed and its branch KEPT — **27 task branches
merged now**, `t001-app-shell` through `t046-boot-gate` plus
`t041-shell-harness` (counted with `git branch --merged main`), plus the
two live ones. Main tree clean; all four suites green; the token lint
green; the committed graph current and proved so by the plain self-check
rather than by assumption. The parser re-parses the whole live tree at
**0 issues**: **64 tasks**, tally **28 done / 18 planned / 9 parked / 7
suggested / 2 building** (T-047, T-048), 6 features, 11 components. (The
task count DROPS by two and `suggested` by two against the last
checkpoint — that is the two absorbed suggestion files being deleted,
not a board that lost anything.)

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. The sharpest open items are process-hygiene rather than
boundary crossings: **T-046-s1** (the unsignalled process group, on the
human's own port, and the boot check now runs at every qualifying merge
— it just ran twice here) and **T-041-s4** (the one env-var path that
would package a DEV harness, kept inert by the runtime half).

LAUNCH ITEM, carried forward and now slightly larger — **watch the
first CI run** (T-020). At the repo's first push (`git remote -v` is
still empty), confirm in order: the ubuntu apt/webkit2gtk set installs;
the three `uses:` SHA pins resolve; playwright-on-Linux runs the lane —
**now 33 tests, not 23**, and the ten new ones are the most
platform-sensitive additions the lane has ever taken, because they
measure REAL CSS (computed colours resolved from the served sheet,
bounding-box layout, Geist Mono) in Chromium-on-Linux rather than
Chromium-on-macOS. **If anything in that lane goes red on Linux, look at
the font and colour assertions in `front-door.spec.ts` and
`genesis-screen.spec.ts` first.** Then: `cargo audit` behaves as it does
locally; and **the xvfb `tauri dev` boot prints both `[nputer]` startup
lines** — the FIRST exercise of the boot check on Linux, and the only
place the T-046 override's Linux behaviour will ever be observed (CI
deliberately sets no `NPUTER_BOOT_PORT`: on a fresh runner 1420 is free,
so the default path is correct there and the OVERRIDE path stays
Linux-unverified, exactly as T-046's honest-limits section says).
AND (T-018-s3 fold) the THREE T-018 SENTINEL LIVE TESTS inside the
ubuntu `cargo test` step — replaced-wholesale and deleted-recreated
docs/. They discriminate only where inotify watches INODES; macOS
FSEvents watches paths and was accidentally resilient, which is why
T-018's replace-half evidence is mechanism-only today. Green there
CLOSES that evidence gap; red there is a real reconcile gap macOS could
never surface, and gets filed immediately. This run also closes
T-001/T-003's Linux halves, and it carries T-026-s1 (the plan probe's
exact-case match makes macOS and Linux disagree about "already has a
plan") and T-021-s1 (the ACL pin is macOS-derived). Since T-025 the
ubuntu `cargo test` step also runs the `agent_runner` integration tests,
which spawn real child processes and send real signals — 28 of them —
the first time this repo exercises process control on Linux. Watch it,
and watch for the unnamed `agent_runner` flake there too.

## Next up (1–4)
1. **@human — THE VISUAL SESSION IS STILL OPEN.** The app is RUNNING on
   1420 as this checkpoint lands (same pid 90127 since 13:21), and
   T-041 ships **no UI and no CSS** — the shipped bundle's entire delta
   is a 17-byte function extraction — so every item below stands as the
   T-046 checkpoint left it. **The route to the pane**: "Start an
   interview" on a docs-less folder, or "Start an interview here" on a
   folder the app just refused.
   - **T-024's pane, light AND dark**: built/forming/slot card contrast
     in dark, the warm writing-row border, the five type sizes that
     moved 0.5–1px, the substituted footer right slot
     (`stage ~4 · constraints`).
   - **THE COMPOSITION QUESTION, which is now the ONLY framing item
     left here.** T-024 drew the pane as the **RIGHT HALF of a split
     view**; until T-027 it sits **full-width inside T-026's card
     frame**. Does its `bg-sidebar` ground read right framed by a
     `bg-card` bordered box, and does the **five-across backbone grid**
     hold at full width when it was drawn for a half-width pane?
     **This is the question T-027's planning pass waits on** (item 2).
     *The scroll/overflow half of this item is GONE from the @human
     list*: T-041 measured it, its verifier falsified the proposed fix,
     and it is now T-048, BUILDING. How the frame FEELS once it holds is
     still an eye judgment — look again after T-048 lands.
   - **T-026's front door, light AND dark**: the two-button row and the
     "No plan in &lt;folder&gt;" card against the design's `open a
     folder` screen — button sizes/inks, the checklist ○/✓ (the ✓ rides
     `--review-disc`, whose dark value #4ecf9e is a token-family
     derivation, not measured from a dark mockup), the card's 10px vs
     the design's 12px radius, and whether the footnote reads as a
     footnote. **Note the lane now pins the machine-checkable half of
     both screens** (labels, the `⌘O · ⌘N` hint, one-row layout, the
     ink pill resolving `--primary`, the outline border resolving
     `--input`, the ○/✓ glyphs resolving `--muted-foreground` and
     `--review-disc`, in BOTH schemes) — so what is left for the eye is
     genuinely taste, not spelling.
   - **The at-a-glance amber judgment** (T-012 criterion 5's human
     half — drift stroke vs building/verifying fills, BOTH schemes,
     incl. composed building+drift; the dogfood hero renders it live).
     C-05's drift count reads **4**.
   - **The launch-shot re-judgment** (T-006's pending screenshot
     predates the rail — light + dark now include it).
   - **The T-023 dry-run conversational quality judgment** (did the two
     "pushing back:" challenges actually challenge; the founder was
     builder-scripted in-session, so true cold-context evidence still
     arrives with T-029).
   - **T-026-s4's question**: point the app at a folder whose `docs/`
     holds files but no plan (a lone ARCHITECTURE.md). It renders
     **through the lens** now, as the pane's own `docs/ · 0 files
     written` scaffold with `expected` placeholder rows and north star
     `forming…`. Judge whether THAT reads right over a non-empty docs/.
   - **The real picker flows on the real screen** — the standing T-007
     checklist, still @human because native dialogs are unreachable from
     a browser harness and tauri-driver has no macOS. **T-041 narrowed
     this deliberately rather than accidentally**: the harness delivers
     the picker's OUTCOME, which is where the shell's behaviour starts,
     and does NOT simulate the dialog. So what remains for the human is
     exactly the native half: "Start an interview" → native dialog → a
     docs-less folder lands on the genesis screen; ⌘N and ⌘O on the
     front door; "Start an interview here" on a folder the app just
     refused; a folder that already has a plan → the board, not genesis.
   - **The `tauri dev` quit-the-app orphan check** (from T-025). Start a
     `hang`-scenario genesis in a scratch project, quit the app, confirm
     no orphan — **and watch for T-025-s7's ~5 s main-thread hang on
     quit**, which is expected, harmless, and worth confirming is only
     ~5 s.
   - **ONE REAL OBSERVED PLANNER TURN, on an authenticated machine** —
     still the biggest unobserved thing in the project. This machine's
     `claude` OAuth token is revoked, so no model call has ever gone
     through the runner. Two questions ride on it: does the kickoff land
     a real planner in stage 0, and is the six-pattern Bash allowlist
     sufficient for a real stage-0 scaffold (which is what T-025-s4
     needs before it can narrow `Bash(cp:*)` / `Bash(mkdir:*)` safely).
     **T-025-s2 carries the exact command.**
   - **A Linux run** — the "watch the first CI run" item above.
   - **A PRIORITY CALL, not a screen action — T-046-s1.** The orphan it
     names sits on **1420** on the default path, and the gate now runs
     at every qualifying merge (twice in this one). The next triage
     should weigh it against T-039-s1's `PATH`-cache item.
2. MILESTONE 3 (T-023…T-029 + T-039 + T-041, ADR-017). **T-041's gate is
   now DOWN**: T-027, T-028 and T-029 can each write the served-bundle
   probe their Verification line promises, against a harness that
   reaches all five phases and a lane that already demonstrates the
   pattern in three specs. **What still holds the milestone is the
   human, in this order:**
   (a) **T-027's planning pass waits on the human's split-view verdict**
   (item 1) — it builds the LEFT half of a composition whose whole
   design question is what the open visual session is judging.
   `blocked_by` [T-024 ✓, T-025 ✓, T-026 ✓] has been satisfied since
   T-025 merged.
   (b) **T-029 is UNGATED but not unblocked** — its `blocked_by` is
   still `[T-027]`, and T-028's is too.
   (c) **T-048 is ahead of T-027 in the app-shell lane** and is the
   thing that makes the screen usable at the size the app opens.
   The milestone itself is NOT claimed: the first slice delivers
   hand-driven genesis, the runner exists and is hardened, but no agent
   loop has ever run against a real model.
3. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16 night): the app-shell
   lane queue was T-021 → T-026 → T-025 → T-022; T-021, T-026 and T-025
   are all DONE, so the standing grant's next named item is **T-022**
   (M, milestone 4, `blocked_by: []`), with T-027 ahead of it in
   milestone order but held for the visual verdict. **app-shell is
   OCCUPIED by T-048; app-agent is occupied by T-047 until it merges**
   — and T-047 is verified and ready, so app-agent frees up as soon as
   an integrator takes it. Triage: APPLY granted — but tasks NEWLY
   created by triage (T-041…T-048) do NOT dispatch without the human;
   T-041, T-046, T-047 and T-048 each got that nod explicitly (T-048's
   came mid-review, from the screen itself). Unchanged method rules: a
   second REJECTED on any task parks that lane for the human; @human
   judgments are never self-answered.
4. SUGGESTION BACKLOG — **13 open files: 9 parked + 4 suggested.**
   The T-046 four are the newest untriaged set; **T-041-s2 and T-041-s4
   join them**; T-039-s3 is the one older untriaged card left. T-041-s1
   and T-041-s3 are GONE — absorbed by T-048 and deleted at this merge
   (see the encoding-debt note above).
   **Untriaged (7)**: T-041-s2 (the wire shape is pinned in Rust and
   mirrored by hand in TS with nothing comparing them — **rank it
   against the fact that three new lane specs now assert against those
   hand-written payloads, and T-027/T-028/T-029 will add more**),
   T-041-s4 (`NODE_ENV`, not `--mode`, is what flips the DEV gate — the
   one path that would package a harness, kept inert by the runtime
   half), T-046-s1 (the unsignalled process group — reproduced, and the
   only one whose blast radius is the human's own port), T-046-s4 (the
   overlay's blind spot — the only one that weakens a gate the pipeline
   now depends on), T-046-s2 (`checkJs` — note the file's worked example
   is wrong and the verifier's correction is IN the file), T-046-s3
   (nothing gates the packaged build — read together with s4 and with
   T-041-s4: all three are the same shape, "a gate proves the
   configuration it was handed, not the one that ships"), and T-039-s3
   (give the session-id refusal its own typed outcome; its home is
   T-029, still no disposition).
   **The nine parked, unchanged**, all blocked on something only the
   world can provide: T-003-s2 (a real project near the ~25 MB knee),
   T-008-s1 (F-04/F-05 layout), T-018-s1 (a Windows lane), T-021-s1 and
   T-026-s1 (both await the first Linux run — already on the launch
   item), T-025-s2 (@human, one command on an authenticated machine),
   T-025-s4 (gated by s2), T-025-s3 (nputer.yaml is F-04 era; its count
   fix rides T-043), T-038-s1 (no responsive call site yet).
   Five triage-born tasks stand ready and un-dispatched: T-042 (genesis
   switch truthfulness), T-043 (kill path: honest grace and honest
   scope — its "serialize behind T-039 on app-agent" condition is
   satisfied, but app-agent is occupied by T-047 until that merges),
   T-044 (shell pins cover their surface), T-045 (the gates cover the
   rules). Milestone-4 queue after F-03: T-010, T-013, T-014, T-015,
   T-030…T-035, T-044, T-045, plus T-022.

## Open questions
- **Does the BOOT GATE rule retire, and when?** Carried forward
  unchanged from T-046's checkpoint. T-009-s1's sibling rule names its
  retirement (T-014's `nputer index --check`); BOOT GATE names none in
  CONVENTIONS, and `.github/workflows/ci.yml` already invokes the boot
  check on ubuntu while dormant. Does it retire at the repo's first
  push, or only when a macOS gate exists too? Deliberately left for a
  triage rather than settled by an integrator edit — including by this
  integrator, who has now run it and is therefore the most tempted.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** T-046's checkpoint recorded the obligation: there are now TWO
  gates with the shape trigger → command → record, one of which binds
  the executor, and `method/roles/executor.md` still says only "run the
  test commands from CONVENTIONS.md until green". Ask ONCE when a THIRD
  lands, or when the executor rule proves noisy. A method version bump,
  not an ADR.
- **NEW: does the shared main working tree need a rule?** The T-046
  merge lost its house shape to a shared git index, and the fix that
  worked here was purely social ("the pen is yours") plus a
  `git diff --cached --stat` check before every commit. That is a
  practice nobody has written down, in a repo whose whole thesis is that
  practices get written down. Method/process, so the architect's (ADR-004).
