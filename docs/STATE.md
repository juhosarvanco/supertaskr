# State

Updated: 2026-08-17 by integrator (T-028 merged), claude-opus-5 @fresh

## Just completed

**T-028 — the decomposition crescendo.** Size M, **six** criteria (the
sixth folds T-027-s1), `touches: [app-interview, app-shell, tools/e2e/]`
— the card under-declares the third lane and the executor correctly left
the field alone, because fields lock at `status: building`. Built by
`claude-opus-5 @fresh`, verified by `claude-opus-5 @fresh`,
`review: same-model`, **APPROVED**. Merge **`634c405`**. **The largest
card since T-027**, and milestone 3's UI closer.

**THE LENS STOPS BEING A LENS.** The moment a task file under
`docs/tasks/` actually PARSES, the right half of T-027's split stops
being T-024's artifact lens and becomes **C-08's real board, mounted
read-only** — cards raining in on one motion-safe entrance transition as
each file lands, elapsed time running in the chat header. When the
highest turn has settled, nothing is in flight and a parseable board is
on disk, a completion panel renders with **one** CTA that lands the user
in the board pane on their new project, rail restored, no dispatch
affordance (F-04 stays fenced). So the whole arc is now continuous in one
window: **open a folder with no plan → be asked a question → answer it →
watch the answer become a file → watch the files become cards → press one
button and stand in the board of the project you just planned.**

**TWO REFUSALS ARE WHAT MAKE IT TRUSTWORTHY, and both are mechanical
rather than remembered.** The switch is on task RECORDS
(`crescendo.ts:81`, `:113`) — never on a turn's text — so seven
unparseable files read as zero cards and the view stays honestly
in-interview with the parse-chip family; planning theater is the named
failure mode and an empty board is never celebrated. And **the answer box
takes focus back** when a turn leaves flight, but only if it HELD focus
at submit, so seven questions can be answered without the pointer and
focus deliberately moved elsewhere is not stolen.

## THE ARCHITECT'S RULING A FUTURE READER WILL TRIP ON

**"T-023's COMPLETION SIGNAL" DOES NOT EXIST.** Criterion 2 cites it by
name. `method/roles/planner.md` and `method/interview/plan-interview.md`
are the whole of T-023's protocol and **neither defines a closing
marker**; the only literal marker the method has is `pushing back:`,
which the driver contract calls a rendering hint that nothing may depend
on. `git grep` for it returns exactly two hits and **both are this card's
own criterion**.

The executor derived completion from **typed state plus file evidence**
instead — highest-numbered turn settled as `completed` · nothing in
flight · a parseable board on disk — and said so in `crescendo.ts`'s
header. **That is MORE principled than the card asked for, not less.**
Depending on a model-emitted marker would mean believing what the model
SAID, which is exactly what ADR-017 and T-027's chip rule forbid. The
verifier proved both properties rather than accepting them: the reading
is **reversible** (answer again and the panel stands down — `ui.busy` is
set before any await, so it retracts on the keypress, ahead of IPC), and
it **never reads turn text** (a `GenesisTurn` Proxy that THROWS on
`text`, `activity` and `error` still returns `{complete:true,turns:1}`).
It is an approximation and the card says so: a planner that pauses
mid-decomposition with cards already written reads as complete.

## THE RECONCILE — the whole reason this was the second merge

**BOTH LANES MEASURED IT INDEPENDENTLY BEFORE I ARRIVED, so I inherited
a diagnosis rather than a surprise** — T-051's verifier predicted it
(T-051-s6), T-028's verifier reproduced it (T-028-s5). **I reproduced it
a third time on the merged tree before touching anything**, which is the
version that counts, because it is the only one measured against both
parents at once:

    ✘ window-contract.spec.ts:172 › the default window renders both halves…
    ✘ window-contract.spec.ts:308 › every screen is usable at the declared minimum (1024x700)
    ✘ window-contract.spec.ts:308 › every screen is usable at the declared default (1280x840)
      Expected: "40/40"   Received: "absent"      (at :206 and :318, :318 twice)
      3 failed · 2 passed

**TWO ASSERTION SITES, THREE EXECUTIONS** — `:318` sits in a
two-iteration loop. They red on a **testid string**, never on geometry:
the width arithmetic (`:190-200`), the breakpoint walk, the frame checks
and the whole minHeight test stayed green, and so did `:316`'s
`genesis-pane-slot` and `:317`'s `interview-input`. The cause is that
T-051's `genesis()` helper drove the FULL `streakFixture` — a **finished
plan**, which under T-028 renders the board, so `genesis-artifact` does
not exist.

**FIXED BY REPOINTING `genesis()` AT `streakMidInterview`**, the tree the
LENS is actually for. That spec's subject is the WINDOW and the lens is
the half whose width requirement raised it; the board half has its own
size questions and they are T-028-s2's.

**T-051-s8's TRAP WAS CHECKED, NOT ASSUMED — and it does not fire here.**
The swap takes the lens from **9 artifact rows to 7**, which at 1440×900
is the difference between 78px of margin and **exactly zero**. But
`window-contract.spec.ts` never measures 1440×900 and never asserts
`scrollHeight > clientHeight` on the region, so the zero-margin cell is
outside its range entirely. **`reach()`'s `"40/40"` was RE-DERIVED rather
than carried over**, with a throwaway probe run inline and deleted:

    fixture                 1024×700        1280×840        1440×900
    streakMidInterview (7)  reach 40/40     reach 40/40     reach 40/40
                            region 876/580  region 792/720  region 780/780
    streakFixture (9)       rows 0, absent  rows 0, absent  rows 0, absent

So `40/40` is correct for a seven-row tree **for a different reason than
it was correct for a nine-row one** — fewer rows means the last row is
MORE reachable, not less. And the region column is an **independent third
reproduction of T-051-s8's second table row** (876 / 792 / 780 at the
three widths), by a different session with a different probe. s8 should
be believed.

## THE MERGE ITSELF

**CLEAN, and proved so before the reconcile was added.** Merge
**`634c405`**, merge-base **`e41dd16`**, main-before **`a6eea36`**.
`git merge-tree --write-tree` was run FIRST and predicted
**`3b2a72ae`**; `git merge --no-ff --no-commit` produced a staged tree
that IS **`3b2a72ae00b89fb4b13b9c35c75bd9df6bfb03f9`, byte-equal** — so
the two parents' contents composed with nothing extra. **The reconcile
was then added on top of that proved-clean base and committed inside the
same merge commit**, deliberately: a semantic conflict is what a merge
commit is for, and the merge that lands should be the one that is green.
That is why the merge's diff carries **28** files where the branch
carried 27.

**BOTH SIDES ENUMERATED BEFORE MERGING, and the intersection is EMPTY.**
**27 branch files against 118 main-side**, `comm -12` returns **ZERO**.
Main's 118 since the base are three merges and a triage: **97 under
`docs/tasks/`**, 11 under `lib/parser/` (T-053), 3 under `app/test/`,
`app/src-tauri/tauri.conf.json` (T-051), `tools/e2e/tests/window-contract.spec.ts`
(T-051), `docs/architecture/graph.json` and the four `docs/*.md`. **So the
collision was never a FILE overlap** — git had nothing to resolve. It was
a behavioural overlap between a spec on one side and a renderer on the
other, which no merge tool can see, and that is the useful lesson: a
clean `comm -12` is evidence about text, not about meaning.

**THE `<main-before>` WRINKLE.** `a6eea36..HEAD` returns **28 files,
+3,318 / −68**. The naive `e41dd16..HEAD` returns **145 files, +9,244 /
−3,551** — a factor of **5.2×**, the second-widest recorded after T-051's
9×. It did NOT change which gates fire; it would have changed the
headline from "the interview grew its last act" to "something rewrote 97
task cards and a parser package".

## The graph regen

STANDING INTEGRATOR PRACTICE (T-009-s1), **TWENTY-NINTH** exercise, and
**the largest regen since T-027**. The top-of-file log in
`architecture-dogfood.test.ts` is unbroken from T-051's block.

**FIRED and emphatically not a no-op**: 19 `.ts/.tsx` files outside
`docs/`, of which **14 are indexed**. Order per `ceaa949` — regen to
MEASURE, then the fixture edits, then the FINAL regen. **Confirmed
necessary live AGAIN, nineteenth hold**: the sha moved from `eb551946`
(measuring) to `f7478293` (final) purely because the fixtures are
themselves indexed, and then to **`de73cf83`** after the eleventh-site
fix below forced a third round.

**THE MERGE ADDED FIVE `.ts/.tsx` FILES AND THE GRAPH GAINED FOUR.**
`tools/e2e/tests/crescendo.spec.ts` is under `.nputerignored` `tools/`.
**Derive the mapping move from the INDEXED added-file list, never from
the merge's diff** — third merge running.

**AND THE TOKEN LINT IS THE EXACT MIRROR IMAGE, derived here rather than
inherited**: it walks `app/src`, `app/test` AND `tools/e2e`, so that same
spec counts for the lint (109 → **114**, +5) and not for the graph (110 →
**114**, +4). Two walk policies, two different answers about the same
file, and neither is the other's proxy.

**The graph:** **110 → 114 files**, **860 → 916 symbols**, **1328 → 1408
edges** (import **+28**, call **+26**, type_ref **+26**), 502,350 →
**532,485 bytes**. Languages still `["ts"]`. Final sha256
**`de73cf83ddb19fdb7f9ebdecbde06cfb867a660380cbca6df17a8dbbbe092eef`**.
**DETERMINISM PROVED TWICE** — two consecutive regens byte-identical
(`cmp` exit 0) after the final regen and again after the third.
Plain non-golden self-check with `NPUTER_UPDATE_GOLDEN` confirmed
**UNSET at the shell**: `self_graph_is_current … ok`, exit 0. Cross-checked
with the SECOND instrument: `nputer-index index --check --root <repo>` →
`graph.json is CURRENT (532485 bytes, 114 files, 916 symbols, 1408
edges)`, exit 0. **Two independent instruments, both green.**

**Operational note, RE-CONFIRMED first-hand a THIRD time**: run from
`app/src-tauri/`, `index --check` WITHOUT `--root` exits **1**.
Reproduced deliberately beside the green run, three-for-three. **That is
a false red, not a stale graph.**

**CORRECTED 2026-08-17 by T-054's executor — and the correction is the
part that matters.** Three checkpoints in a row (mine included) recorded
that this failure "reports the graph MISSING", which reads as *you can
tell it apart at a glance*. **You cannot.** It prints the **STALE
headline, byte-identical to a real red**; `committed: MISSING` appears
only on the SECOND line. So a tired integrator who greps the headline,
or reads the first line of a long transcript, cannot distinguish a
missing `--root` from a genuinely stale graph — and the two want opposite
responses. Always read the second line. The measured transcript is in
T-054's notes, and `docs/CONVENTIONS.md` now says the measured thing
rather than the remembered one.

**THE COMPONENT PICTURE MOVED A LOT, and unlike the last two merges that
was the POINT.** T-051's and T-053's regens both added edges whose heads
were PACKAGES, and an edge whose head is a package can create no
component pair — so the relation table, the drift rings and every
observedCount held. **Here the new edges reach real component heads.**
Mapping 110 → 114 with **two** per-component moves (C-05 51 → 53,
C-13 6 → 8). The relation table goes **30 → 32 rows**, tally 13/8/9 →
**13/10/9**, with **six** observedCounts climbing (C-05→C-10 27→31,
C-05→C-13 10→13, C-05→C-14 3→5, C-13→C-05 2→3, C-13→C-10 4→6,
C-13→C-14 4→5) and **four** D1 `fileEdges` lists growing. **Both new rows
leave C-13** — `C-13→C-06` (the pane reaching the PARSER, which is what
makes the switch a parse result rather than a filename match) and
`C-13→C-08` (the pane mounting the real Board). Both UNDECLARED and left
for the architect on the standing reasoning.

### THE FORECAST WAS **INCOMPLETE** — the first miss in three merges, and it is recorded rather than quietly fixed

Ten sites were derived from the indexed added-file list and the registry
globs BEFORE anything ran, by reproducing `liveModel()` against the fresh
graph: the `it()` name and `fileComponent.size`, C-05's row, C-13's row,
the findings array and the relation table in
`architecture-dogfood.test.ts`; the edge count, the undeclared tally and
the index hint in `map-dogfood-render.test.tsx`. **All ten were right.
There was an ELEVENTH and I missed it**: `map-dogfood-render.test.tsx:124`,
**C-13's DRIFT COUNT, `drift 2` → `drift 4`**.

**Why it was missed is the part worth keeping.** A drift count moves when
the NUMBER of a component's D1 findings moves — not when their file-edge
lists grow. T-051 and T-053 both added only package-headed edges, so no
finding was created and every drift count held at both merges; the last
two checkpoints could therefore write "every drift ring is byte-identical"
truthfully. **That made a coincidence of two merges feel like a
property**, and I swept the counts table and the findings array without
sweeping the RINGS. C-05 does stay at 4 here — its grown findings grew
their lists, not their number — which is exactly the distinction that
hid it.

It cost one red and one extra regen round, not a wrong number in the
tree. **The rule that would have caught it, and that the next integrator
should use: sweep every assertion DERIVED FROM `findings`, not every
assertion that mentions a count.** The trap this checkpoint DID catch is
the older one — the edge count and the undeclared tally at `:174`/`:177`
are two assertions in ONE body, and C-13's row is the FOURTH in its body,
below two other moving numbers.

**T-024's three-fixtures rule does NOT fire, VERIFIED rather than
assumed** — `git diff a6eea36..HEAD -- docs/architecture/components/` is a
**0-file diff** and the parser never reads the graph, so
`lib/parser/test/smoke.test.ts` is deliberately untouched.

## The gates — BOTH FIRED, and both ran

**"The merge's diff" is `<main-before>..HEAD`** (`docs/CONVENTIONS.md`,
`98f931e`). Used deliberately; see the 5.2× wrinkle above.

**BOOT GATE (T-046): FIRED, RAN, GREEN.** Trigger set from
`a6eea36..HEAD`: **`app/src/**` = 10 files · `app/src-tauri/**` = 0 ·
`app/package.json` = not present · `app/src-tauri/Cargo.toml` = not
present.** The frontend class, and the first genesis merge since T-027 to
touch this much of it. Scratch port **16430**, bind-probed free
immediately before use. Output verbatim:

    [boot-check] port 16430 free — spawning `npm run tauri dev -- --config {"build":{"devUrl":"http://localhost:16430","beforeDevCommand":"npm run dev -- --port 16430 --strictPort"}}` in /Users/ujju/Projects/nputer/app
    [boot-check] NPUTER_BOOT_PORT=16430 — threading --config {"build":{"devUrl":"http://localhost:16430","beforeDevCommand":"npm run dev -- --port 16430 --strictPort"}}
    [boot-check] overall timeout 1200000 ms, no-output watchdog 300000 ms
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] stopping the tauri dev process tree (SIGTERM, then SIGKILL after 10s)
    [boot-check] process tree stopped (exit=null signal=SIGTERM)
    BOOT_EXIT=0

**GRAPH REGEN: FIRED, ran, green.** Trigger from `a6eea36..HEAD` = **19
`.ts/.tsx` files outside `docs/`**, of which **14 are indexed**.

**T-061's hazard did NOT recur**: after the boot check, ports 16420,
16430, 16431 and 16432 were all empty and `pgrep -fl 'tauri dev'` found
exactly one tree — pids **81703/81705/81720**, the architect's, i.e. the
human's app and **not a stray of this merge**.

**CI STILL HAS NEVER GATED GRAPH CURRENCY.** `ci.yml:127` is bare
`cargo test`, which skips `#[ignore]`d tests, and `self_graph_is_current`
is `#[ignore]`d. **Twenty-nine regens have been held up by a written
ritual and conscientious integrators, nothing else** — and this is the
merge that shows what the ritual is worth, because a stale graph here
would have been four missing files, two missing relation rows and six
wrong counts, all of them invisible to CI. T-054 closes it and is still
undispatched.

## WHAT THIS MERGE DID TO THE HUMAN'S RUNNING APP

**IT HOT-RELOADED UNDER THEM, and that is expected, unavoidable and
recorded.** The app ran out of the MAIN checkout throughout — `node` pid
81894 on `[::1]:1420`, the architect's `npm run tauri dev` from ~05:30,
pids 81703/81705/81720. **Unlike T-051, this merge is a 10-file diff
under `app/src/**`**, so vite recompiled and the human's window changed
its contents mid-session. There is no way to land T-028 without that;
the honest thing is to say so rather than to imply the app was untouched.

**1420 was never bound, connected to or signalled.** The only interaction
at any point was read-only `lsof`, run at session start, before the boot
gate, after the boot gate, after the e2e lane and at the end — **one
listener, healthy, every time**. The boot gate took **16430**, the e2e
lane **16420**, the fresh-install worktree's lane **16440**, all three
bind-probed free first and all three empty afterwards.

**THE PARSER `dist/` WAS A MEASURED NO-OP, so the one INVISIBLE hazard
did not fire.** `app/node_modules/@nputer/parser` is a **symlink** to
`../../../lib/parser` whose `exports` point at `dist/`, so ADR-011's
required `npm run build` in `lib/parser` can rewrite what the RUNNING app
parses with, without a single file under `app/` being touched — T-052's
instance 5, which is what happened at T-053's merge. **Here it did not.**
T-028 touches **zero** `lib/parser` files (`git diff a6eea36..HEAD --
lib/parser` is EMPTY), so the required build was a genuine no-op: dist
**48 files before and 48 after**, and — heeding the trap the last
checkpoint recorded — compared **per-file** rather than by rollup:
**ZERO files differ**. (The rollup under a fixed package-relative
convention is `fb2ffbfb` on both sides, matching the last integrator's
figure for that same convention.) So the human's app is running new
frontend code against a byte-identical parser.

**THE WINDOW IS STILL 800×600 AND STILL NEEDS A RELAUNCH.**
`tauri.conf.json` is read by `tauri dev` at LAUNCH, so T-051's 1280×840
has still not reached the human's live window and this merge does not
change that. **They now have T-028's code and T-051's manifest, and can
see neither the split at its proper size nor the crescendo's board half
laid out as designed, until they relaunch.** The architect will handle
the relaunch; no agent restarted it.

**WHAT WAS NOT DONE, and why.** **No `npm ci` or `npm install` was run
anywhere in `/Users/ujju/Projects/nputer`.** All five suites ran against
the EXISTING `node_modules`. A fresh install in this checkout removes
`node_modules` under the human's live vite and kills the app — T-052's
mechanism B. The fresh-install proof was relocated to a throwaway
`git worktree`, the route now walked three times.

## SUITES ON MERGED MAIN

ADR-011 order, all re-run first-hand, **every expectation DERIVED from
the merged parents** rather than inherited from either side, **never
piped through `tail`**, exit codes read from `$?`. The branch reported
its numbers against a two-merges-stale main, so every one was re-derived:

- **lib/parser** `npm run build` exit 0 + `npx tsc --noEmit` exit 0 +
  `npx vitest run` → **225/225 (11 files)**, exit 0. **DERIVED: main's
  225 in 11 + the merge's ZERO parser files = 225 in 11.** (The branch
  reported 197/10 against a much older main.) The smoke test re-parses
  the whole live tree at **0 issues**, with the merge's six new
  `docs/tasks/` files in it.
- **app** `npx tsc --noEmit` exit 0, `npm run build` exit 0, `npx vitest
  run` → **768/768 (41 files)**, exit 0. **DERIVED BEFORE THE RUN: main's
  724/39 + 27 (`crescendo.test.ts`) + 12 (`crescendo-dom.test.tsx`) + 1
  (`genesis-mount`, 10→11 bodies) + 4 (`interview-chat-dom`, 34→38) + 0
  (`shell-frame`, 4→4 — its third `min-h-0` chain went inside an existing
  body) = 768 / 41**, and it landed exactly. Bundle moves, correctly for
  a 10-file frontend diff: `index-Ch0Gpkv4.js` 484.43 kB /
  `index-DSR1ACex.css` 43.30 kB → **`index-ByWKsUIt.js` 488.81 kB /
  `index-DVAVecvn.css` 43.79 kB**.
- **app/src-tauri** bare `cargo test` → **299 passed + 3 ignored, 0
  failed**, exit 0, **zero compiler warnings**, summed across **13 test
  binaries + 2 doc-test targets** (108/0/0/32/123/0/7/13/3/7/0/2/4/0/0 —
  byte-identical breakdown to main's). **DERIVED: main's 299 + the
  merge's ZERO Rust = 299.** The 3 ignored are unchanged.
- **tools/e2e** `npm run typecheck` exit 0 + `NPUTER_E2E_PORT=16420 npm
  test` → **70 passed in 13.3 s**, headless chromium, one worker,
  retries 0, **no skips, no retries, no flakes**. **DERIVED TWO WAYS and
  they agree**: main's 65 + the merge's 5 (`crescendo.spec.ts`) = 70;
  and structurally, **68 lines matching `test(` across the specs, minus
  ONE false positive** (`workflow-parity.spec.ts:442` is
  `i.match.test(s.run)`, a RegExp method call) = 67 declarations, **plus
  3 for the three two-iteration loops** that each wrap one `test(`
  (`keyboard-activation:34`, `panel-real-keys:40`,
  `window-contract:318`) = **70 EXECUTIONS**. Counting openers would have
  forecast 67; counting the naive grep would have forecast 68.
- **`npm run lint:tokens`** → `clean (114 files scanned under app/src,
  app/test, tools/e2e)`, exit 0, **ZERO allowlist**. **DERIVED: main's
  109 + 5** — `crescendo.ts`, `BoardCrescendo.tsx`, `crescendo.test.ts`,
  `crescendo-dom.test.tsx` and `crescendo.spec.ts`; `index.css` and
  `tokens.css` are outside `WALK_EXTENSIONS`, which is where the raw
  values legally live. `-- --selftest` → **49 samples green, 14
  walk-policy checks green**.

**`EXPECTED_GRANTS` BYTE-UNCHANGED, PROVEN THREE WAYS.** Extracted from
**base `e41dd16`, main-before `a6eea36` and HEAD**: **6135 bytes, 92
grant lines, sha256
`721174b12a00b382cad6e9edb853ae1723f4dd1351e3bfa4380020a0d2e7f0c7`** at
all three, `cmp` exit 0 both ways. The whole `acl_pin.rs` is identical
too — git blob **`53aa795b`** and sha256 **`8d24cbad…`** at all three
refs — and its pins re-run green inside the 299.

## INTEGRATOR JUDGMENT CALLS, recorded

- **ROADMAP: EDITED, and this is the entry the milestone has been
  building toward.** The discriminator ("does the task add a USER
  CAPABILITY") is met head-on: before this merge there was no path from a
  genesis session into the project board at all. The entry says what the
  user can now walk end to end in one window, states both refusals (the
  switch is on parsed RECORDS; completion is derived from state and
  files, never from what the model said), and **says plainly what is
  still not true** — T-029 remains, the transcript does not survive a
  remount, and **not one planner turn has ever been observed against a
  real model**. **The milestone is NOT claimed.**
- **ARCHITECTURE: EDITED, and for the right reason — a component changed
  what it IS.** Checked against the standing correction first: the
  Components table stops at C-07, so C-13 has no row and the change goes
  in the code-layout paragraph that already tracks it. **C-13 was a
  bespoke LENS over the docs tree; it is now a HOST that chooses its own
  renderer and mounts C-08's board.** That is a change of kind, not of
  degree, and it shows up structurally as two brand-new outgoing
  dependencies (C-13→C-08, C-13→C-06) taking the pane from two drift
  directions to four. C-05's row gained a clause too, because the
  completion CTA is the FIRST genesis→project handoff this shell has ever
  had. Contrast with T-053, which was correctly NOT roadmapped.
- **THE RECONCILE WENT IN THE MERGE COMMIT, deliberately.** The
  alternative — a clean merge followed by a separate fixing commit —
  would have left one commit on main whose tree is red. The byte-equal
  tree proof was taken from the STAGED index before the reconcile was
  added, so both properties are on the record: the parents composed
  cleanly, AND the commit that landed is green.
- **THE REGISTRY: NOT EDITED**, and nothing asked it to be — T-028
  declares no component. The two new undeclared component edges are
  deliberately left as live drift for the architect.
- **NO NEW ADR (three-prong).** (a) T-028's one genuinely new decision —
  what "complete" means with no method-defined marker — is RULED and
  recorded on the card, in `crescendo.ts`'s header and in ROADMAP, and it
  is an application of ADR-017's existing rule rather than a new shape.
  (b) Prong two verified MECHANICALLY: the merge is **zero Rust**, **zero
  IPC** (the command set is still exactly nine, asserted from both ends —
  six `invoke<T>` literals plus three through `runPicker`, against
  `invoke_handler!`'s nine), **zero new grants** (proven above), **zero
  new dependencies** and **zero lockfile lines** — `app/src-tauri/**`,
  `capabilities/**`, `gen/**`, `Cargo.toml`, `Cargo.lock`,
  `app/package.json`, `lib/**`, `method/**` and all four lockfiles are
  0-file diffs, and `app/src/components/board/**` is a 0-file diff too,
  which is what makes "the board was composed, not copied" a measurement.
  ADR-011 holds. ADR-003 holds — **no model call was made**. ADR-014/015
  hold and were EXERCISED. **ADR-016 holds cleanly for the second merge
  running and needed nothing from the integrator** — `built_by`,
  `verified_by`, `review: same-model` and the whole `## Verdicts` entry
  were on the branch at `a419773` before I arrived, and **nothing was
  transcribed**. ADR-017 holds and was re-proved: no `writeTextFile`,
  `writeFile` or `mkdir` anywhere under `app/src` — see T-028-s6 for the
  guard that is now gone. The register ends at **ADR-017**.
  (c) Prong three: the durable calls live in the card's criteria→evidence
  map and its committed verdict.
- **THE TASK FILE'S STAMPS WERE COMPLETE except the one that is mine.**
  **Only `status: building → done` was written at the checkpoint** — and
  `built` was never written, because it is not one of TASK-FORMAT's
  eight. Parser-validated after: **0 issues**, `T-028 status: done`.
- **`touches:` RECORDED AS `[app-interview, app-shell, tools/e2e/]`**
  here, against the card's two-lane field. The field was correctly left
  as dispatched (fields lock at `status: building`, TASK-FORMAT
  § Lifecycle); T-027's card carries all three for the same three lanes.
  This is a process note, not a builder error.
- **THE CONTROL-BYTE HABIT WAS RUN AND IS CLEAN.** `file(1)` over every
  file this merge and checkpoint wrote: all text, **none classified
  `data`**; a C0 scan excluding tab and newline returns **0 bytes across
  all 33**. The habit is now **eleven-for-eleven**.
- **THE SHARED-INDEX HAZARD did not recur.** `git diff --cached --stat`
  was read before **both** commits and the staged set was exactly this
  session's each time (28 at the merge, verified identical to the
  branch's 27 plus the reconcile). Scratch files were namespaced
  `int-t028-`; the one probe spec written into the repo was deleted and
  its absence verified. House shape held: **merge → checkpoint, two
  commits.**

## In progress / broken right now

**THREE LANES ARE LIVE** (architect, 2026-08-17 evening). Worktrees are
open — if this session dies, these are the first thing to look at:

    ../nputer-T-029   task/T-029-resume-fallback   307319b  REJECTED, fix in flight
    ../nputer-T-054   task/T-054-retire-graph-rule 2fc3475
    ../nputer-T-063   task/T-063-startup-says-so   2fc3475

**T-029 WAS REJECTED AND A FRESH EXECUTOR IS CLOSING IT** — the method's
rule, exercised for the fifth time. Nine of its TEN criterion bullets
hold (the card has ten, not the eight an architect brief claimed). The
blocking finding is **T-029-s6**: `auth_status` is a MONOTONE LATCH, so
a 401 the CLI retried and RECOVERED from survives to the classifier, and
a turn that then dies of anything else reports as `AuthFailed`. Because
`failureAction` returns `retry: false` for that variant, the screen
**removes the Try again button** — the one action that would have
worked — and prints `claude login` at a user whose login is fine. A real
tool denial behind a stale 401 is shadowed too, so **this task's own new
`ToolDenied` classification loses to the bug.** One-line close, verified
by the verifier: drop the `is_some()` guard in the `Result` arm.
**T-029-s7** is the same defect once more in the same closure —
`permission_denials` treated as CAUSE when merely PRESENT — and only its
CONSERVATIVE arm is being taken, because the wider guard depends on the
`terminal_reason` set that T-029-s5 records as still unverified.

**AN ARCHITECT RULING, because my dispatch template has been overriding
the method all week.** `method/roles/executor.md:18` says an executor
sets **`status: verifying`** on handoff (or `done` for size S). Every
dispatch I have written this week said `building`, and every executor
obeyed me over the method — T-054's caught the contradiction and
declined to resolve it silently, which is the right instinct.

**The method is right and I was wrong.** `building` means someone is
actively building it, which is FALSE the moment the executor stops; a
card awaiting a verifier is `verifying`. And the consequence is not
cosmetic: **`verifying` is one of TASK-FORMAT's eight statuses and has
never once been used in this project**, so the board has never been able
to show the state it spends most of its pipeline time in. The dogfood
has a status it cannot demonstrate.

Applied from the next dispatch onward. Cards already stamped `building`
are left alone — integrators flip them to `done` regardless, and
re-stamping in flight would churn three live branches for no gain.

**THE OVERNIGHT GRANTS (human, 2026-08-17, before sleeping).** Recorded
here because a successor session must not re-ask:
- **Four lanes approved**: **T-054**, **T-063**, **T-060**, **T-062**.
- **Triage-born cards may dispatch from the ranked queue WITHOUT further
  approval.** Every card still goes executor → adversarial verifier →
  integrator; a second rejection on the same card PARKS that lane with
  the record intact.
- **Three parallel lanes**, matching the load that held last night
  (~10 on 10 cores).
- **QUEUE, and the reason each waits**: **T-060** after T-029 (both
  `[app-agent]`, both own `runner.rs`), **T-062** after T-063 (both
  declare `app-shell`). The method forbids parallelizing overlapping
  `touches` and this is the live application of it.

**THE HUMAN'S APP IS RUNNING ON 1420** (node pid 82549), relaunched
DETACHED this time — an earlier launch died when its background task was
torn down, taking the app with it. Every agent is briefed to probe it
read-only and never bind, connect to or signal it. **The integrator who
takes the next merge inherits T-052's hazard live**: main's
`node_modules` sits under a running vite, so a fresh install there kills
the app (mechanism B). Run installs in a scratch worktree at the merged
commit, or refuse loudly.

**T-029 IS THE NEXT CARD AND IT IS NOW UNBLOCKED.** It shares
`app/src/genesis/` with T-028 and reuses T-028's completion detection,
which is why it was deliberately held until T-028 landed rather than
merged against. Its three folds are already applied to its card
(T-027-s2, T-039-s3, T-047-s3) and its auth trace is written up (below).
**Its `AuthFailed` criterion should LEAD that task rather than trail it**
— on this machine the interview's first turn always fails and the failure
is a dead end.

**T-054 is written and still NOT dispatched.** It is the card that makes
CI gate graph currency, and this merge is the strongest argument for it
yet: 29 regens, none of them gated by anything but a written ritual, and
this one moved four files, two relation rows and six counts.

**THE THIRD TRIAGE IS APPLIED AND STANDS.** It opened at **66 files** and
closed at **16, every one PARKED with a dated trigger to unpark**:

    66 open  →  37 promoted · 12 folded · 16 parked · 1 rejected
                 1 removed as already-absorbed

**T-051's NINE remain undispositioned** and are the next triage's, with
one discharged: **s6 (T-028 will red the new window spec) is DISCHARGED
by this merge** — it fired exactly as written and the reconcile above is
its answer. s7 and s8 are still the class that does the most damage
unread, because both are CORRECTIONS to claims already written down.

**T-028 FILES SIX**, none dispositioned:

- **T-028-s1** — the elapsed clock has no durable origin; an app restart
  re-bases it to zero, a remount does not.
- **T-028-s2** — the detail panel opens over the whole window rather than
  inside the right half. Inherited from composing the real board;
  changing it means editing a board file.
- **T-028-s3** — a hand-driven genesis never reaches the completion
  state (there is no turn to settle), which is worth reading against
  ADR-006.
- **T-028-s4** — no gate catches a motion utility used without
  `motion-safe:`. The bare rule IS in the shipped sheet because Tailwind
  emits one per `@utility`; nothing uses it, and the general closer is a
  fifth pattern in `lint-tokens.mjs`, which is T-038/T-045's file.
- **T-028-s5** — the merge hazard, now measured from THREE sides
  (T-051's verifier predicted, T-028's verifier reproduced on the branch,
  this merge reproduced on the merged tree). **Discharged by the
  reconcile above.**
- **T-028-s6 — AND THIS ONE DESERVES MORE THAN A LINE.** `app/tsconfig.json`
  includes **both `src` and `test`**, so the ambient node declarations in
  `app/test/node-builtins.d.ts` — which T-028 extended from **30 to 47
  lines**, adding `mkdirSync`, `writeFileSync`, `rmSync` and
  `mkdtempSync` for its temp-project fixtures — **now reach production
  code**. Measured, not argued: a probe under `app/src` that imports and
  calls both write functions passes `tsc --noEmit` at exit 0 on this
  branch, and fails **TS2305/TS2724** with only that `.d.ts` reverted.
  **Nothing does it today and T-028 adds no write** — the sweep at
  `crescendo-dom.test.tsx:515` re-proves that. But **ADR-017's free
  typecheck-level guard against the app writing to disk is GONE**: until
  tonight, a `writeFileSync` under `app/src` would not have compiled, and
  that was a wall nobody had to maintain. What replaces it is a runtime
  sweep that walks **`app/src/genesis/` only**, so a write added anywhere
  else under `app/src` is now caught by nothing at all. Not a blocker,
  and the closers are cheap (split the tsconfig, or widen the sweep to
  `app/src/**` — the verifier already ran the wider sweep by hand and it
  is clean today). **It is the highest-value item in this set** because
  it is a silently removed guard rather than a visible defect.

**THE CONTROL-BYTE HAZARD stands at THIRTEEN reproductions across five
sessions**, one of them inside the card describing the mechanism. The
habit is now **eleven-for-eleven** and it found nothing this merge. Still
no gate; T-058 owns it.

## Next up (1–4)

1. **DISPATCH ORDER. T-029 IS THE NEXT CARD and nothing blocks it.**
   - **T-029 (resume + hand-driven fallback)** closes milestone 3's task
     list. Read the auth trace under @human below BEFORE dispatching: the
     `AuthFailed` criterion is the one with a live user-visible dead end
     behind it, and it should lead.
   - **T-054** is the other pre-condition of a quiet week — it closes a
     gate that has never existed, and this merge is its best evidence.
     **T-063** is still the only item in the whole backlog with a real
     user report attached.
   - **Milestone-4-adjacent**: **T-055** in lib-parser (lane free);
     T-057, T-058, T-059 (`blocked_by: [T-033]`, and it DISSOLVES if that
     ruling moves `arch` to the Node CLI); **T-062 is UNBLOCKED**; and
     T-065. **Read T-062 and T-065 together** — T-062 changes the shell's
     scroll model and will move exactly the numbers T-065's corrected
     criterion 4 names. **And read both against T-028-s5's table above**,
     which is now a third independent measurement of the lens region.
   - **Launch-prep**: **T-060** — STATE has recorded NO STANDING SECURITY
     GATE since T-025-s6 closed at T-039, and it is still the sharpest
     open set: a probe arm that executes a relative path the cache gate
     refuses, a `$SHELL` that picks which program runs, and a suite where
     nothing structurally stops a test spawning the real CLI. Then
     **T-061** (a demonstrated orphaned listener — **it did not recur at
     this merge**, measured above) and **T-064**.
   - **Still un-homed, and NOT one of the 66**: the
     **Tailwind/`app/src-tauri` finding** from T-014's merge — a Rust
     identifier is in the shipped CSS and no gate can see the directory.
     It has no suggestion file and never did. **T-058 is its natural
     neighbour**; fold it there or file it, but do not let a fourth
     triage lose it.
   - **Carried from the last merge and still un-homed**: a rolled-up
     `find … | xargs shasum` hashes PATHS as well as bytes, so any
     standing "did I disturb it" check on the
     `app/node_modules/@nputer/parser` symlink must fix the convention or
     compare per-file. This merge compared per-file and had no trouble.
     T-052's neighbourhood.
2. **@human — THE MORNING'S AGENDA. The app IS running; the architect
   relaunched it at ~05:30 out of main**, and this merge left it running
   — but **it hot-reloaded under you**, because T-028 rewrites ten files
   under `app/src/`. **YOUR WINDOW IS STILL 800×600.** The manifest is
   read at launch, so **relaunch to see T-051's 1280×840** — and you want
   it, because T-028's board half is the thing that most needs the width.
   You pick up everything at once: T-042's genesis truthfulness, T-014's
   23 CSS bytes, T-027's entire screen, and now **the crescendo**.
   **READ THIS BEFORE OPENING A GENESIS FOLDER.** The interview
   auto-starts on arrival, and on this machine the CLI login is revoked,
   so the first turn fails. **Run `claude login` first.**

   **CORRECTED 2026-08-17 by the architect — the version this paragraph
   carried was WRONG, and it was mine.** I traced the failure and wrote
   that the screen "says exactly 'the planner exited with code 1', shows
   no detail at all" and that "nothing points at the login". T-029's
   executor refused to build on it and re-derived instead. **Three of my
   five steps do not survive reproduction**, and one command settles it:
   `an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail`
   (`app/src-tauri/tests/agent_runner.rs:533`) asserts
   `stderr_tail.contains("401")` and **passes on main**. The test's own
   name says what I got wrong.

   The error: I reasoned from "stderr is empty" — which is true, and is
   what T-029's card measured — to "`stderr_tail` is empty", which is
   false. **`stderr_ring` is not a stderr ring.** It has THREE writers
   (`runner.rs:1088` stderr, `:1194` the `result` line's text when
   `is_error`, `:1204` the `api_retry` diagnostic), and the comment at
   `:1192` states the reason outright: *"the CLI's own explanation, which
   may be the ONLY one there is (stderr can be empty)."* T-025 wired the
   in-band lines in deliberately and named a test after it.

   **What the screen ACTUALLY shows**, measured on `bdecad8`:
   "the planner exited with code 1", above the CLI's own words as an
   escaped one-line blob — `api_retry: authentication_failed 401` /
   `Failed to authenticate. API Error: 401 OAuth access token has been
   revoked.` (`sanitize_for_log` escapes the newline). So the login IS
   named, in the CLI's vocabulary rather than in an instruction.

   **The criterion survives and its own wording was the accurate one all
   along** — "a TYPED outcome rather than a relayed blob". A relayed blob
   is exactly what this is. And **the real defect is the Try again
   button**, which fails deterministically forever; that is what T-029
   removed. Filed as **T-029-s1**.

   The lesson, since this is the second time tonight a confident trace
   was wrong: **a trace written by reading code is evidence to reproduce,
   exactly like a number in a card body.** Mine was relayed to the human
   as fact and written into this file. The executor's refusal to build on
   it is the behaviour to keep.
   To reach the interview at all a folder needs NO `docs/ROADMAP.md` and
   NO `docs/tasks/*.md` (`PlanProbe::has_plan`, `docs_watch.rs:414` — an
   `ARCHITECTURE.md` alone is still genesis-eligible). There is no
   `genesis-demo` folder anywhere on disk; `mkdir` one.
   - **THE MILESTONE CLOSER, and it is the biggest ask on this list:**
     **a real, timed, end-to-end genesis on a toy idea** (T-028's own
     criterion 2, target ≤30 min), judged live, with **light and dark
     completion screenshots**. This is the one that turns everything
     above from mechanism into evidence, and it needs `claude login`
     first.
   - **FIVE NEW JUDGMENTS FROM T-028**, all headless-invisible:
     1. **The completion panel in LIGHT AND DARK.** It has **no design
        source at all** — the bundle's thirteen screens contain no
        genesis completion state — so it is built from the `status-done`
        family and the review-mark disc. This is the SECOND place the
        design had to be extended rather than followed, after T-027's
        challenge treatment, and the same caveat applies: your eye is the
        only authority.
     2. **The board at 640–800px.** Columns have a 320px floor (T-006),
        so on the right half the genesis board scrolls SIDEWAYS from
        three columns up. Correct by construction; the question is
        whether it is USEFUL, which is T-034-s1's question one screen
        over.
     3. **The rain at fifty cards.** 260ms each, all starting together
        when a decomposition lands in one snapshot. Delight or flash is
        an eye's call; the token is one line (`--card-rain-duration`).
     4. **"the board, so far"** as the right half's overline, against the
        lens's "the project, so far" — judge whether the handover reads.
     5. **Does the completion panel belong ABOVE the board or below it?**
        It sits above, so the CTA is what the eye lands on; the
        alternative makes the cards the reward and the CTA the
        afterthought.
   - **THE T-027 VISUAL JUDGMENTS, still FIVE:**
     1. **The one-question-at-a-time feel** — is the current question big
        enough to be the only thing on the left?
     2. **The challenge treatment in LIGHT AND DARK.** The two new tokens
        have **no dark source in the design bundle at all**.
     3. **The eight disclosed deviations**, especially the **line-height
        gap**: design 1.55/1.6/1.5 against the tokens' 1.43/1.45/1.41.
     4. **The 640/lens balance at 1280 and 1440** — now the DEFAULT
        rather than a size you have to drag to.
     5. **T-051-s3 REMAINS YOURS**: the default height is **840**, and
        whether it should be **867** depends on the ~28px macOS title
        bar — the one number nobody could measure headlessly.
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
     1440×3818 canvas in a ~600 px pane.
   - **The model badges should be SHORT** (T-030-s1); **the header's
     density** (T-049's item); **T-024's pane light AND dark**;
     **T-026's front door light AND dark** (read **T-048-s4 BEFORE
     T-048-s3** — s3's conclusion is wrong); the real picker flows; the
     `tauri dev` quit-the-app orphan check.
   - **The T-047-s6 stray, a decision not a look.**
     `~/.claude/projects/-private-var-folders-…-t047va-count-97806-…/` —
     outside the repo, deliberately not deleted. **Delete or keep.**
3. **MILESTONE 3 (F-03) — STILL NOT CLAIMED, and T-028 is the closest it
   has come.** T-023 → T-024 → T-026 → T-037 → T-025 → T-039 → T-041 →
   T-042 → T-048 → T-049 → T-050 → T-027 → T-051 → **T-028** are through
   the pipeline. **Only T-029 remains on the task list** — and the
   milestone still cannot be claimed for a reason that has nothing to do
   with the task list: **not one planner turn has ever been observed
   against a real model.** Everything above is proven against a fake CLI
   fixture and a scripted lane. It is a real conversation with a real
   event channel, a real file-evidence join and now a real board handoff;
   whether it is a GOOD interview is unknown. T-029 is worth more than
   its position suggests: the user's half of the transcript does not
   survive a remount or an app restart — `refreshGenesisStatus` rebuilds
   phase/turn/session but never `turns` — so a mid-interview reload shows
   an empty chat over a LIVE session. **MILESTONE 4** carries T-010,
   T-013, T-015 and T-053. **T-010 is still the interesting one** — it
   makes `languages: ["ts"]` false, indexes the 44 `.rs` files, turns the
   four unclaimed ones into live unmapped-territory findings, and gives
   `arch drift` something new to say.
4. **OVERNIGHT DISPATCH GRANTS and the BACKLOG.** Grant 1 (**milestone 3
   to completion**) has one card left in it: **T-029**. Grant 2 closed at
   T-034; grant 3 (third triage applied) stands, and **tasks NEWLY
   created by triage still do NOT dispatch without the human.** Unchanged
   method rules: a second REJECTED parks a lane for the human; @human
   judgments are never self-answered; no screen control beyond the ruled
   boot check; **port 1420 is the human's, and it is OCCUPIED.**
   **LANE AVAILABILITY — EVERY LANE IS FREE.** T-028 released
   `app-interview` and its half of `app-shell`, and no worktree is open.
   `app-shell` FREE (**T-029** wants it, then the standing queue's next
   named item **T-022**, M, milestone 4, `blocked_by: []`, which
   T-034-s3 made bigger); `app-interview` FREE (**T-029**);
   `lib-parser` FREE (**T-055**, **T-031**, **T-032** — and **T-032
   carries T-034-s7**, a criterion that reads as an instruction to type a
   control byte and **should be amended BEFORE it is built**);
   `crate-index` free (**T-010**, **T-013**, **T-015**); `app-agent`
   free (**T-043**); `app-map` free (T-013, T-015, T-032's map-badge
   half); `app-board` free.
   **THE SIXTEEN PARKED are unmoved**: the nine standing (T-003-s2,
   T-008-s1, T-018-s1, T-021-s1, T-025-s2 @human, T-025-s3, T-025-s4,
   T-026-s1, T-038-s1) plus seven new — T-014-s5, T-030-s1 (@human),
   T-034-s1 (@human), T-034-s4 (@human), T-045-s3, T-046-s3, T-047-s2.
   **The test that moves them**: *what merged recently that makes this
   item's "not live yet" clause false?* **T-028 is a live worked example
   for the next triage**: any parked item whose premise was "the genesis
   right half is a lens" or "there is no way out of the interview" has
   just expired.

## Health of the tree

The T-028 worktree is removed and its branch KEPT — **40 task branches
merged now**. Main tree clean; every suite green; the token lint green
over 114 files at zero allowlist; the committed graph current and proved
so **twice, by two independent instruments**, and **deterministic across
two consecutive regens**. The parser re-parses the whole live tree at
**0 issues**, with this merge's six new `docs/tasks/` files in it.

**THE BOARD, as MAIN sees it**: **100 task files**, tally **41 done / 24
planned / 16 parked / 19 suggested / 0 building**, plus **9 in
`rejected/`**. 6 features, 11 components. **94 → 100 is T-028's six
suggestions**; **40 → 41 done and 25 → 24 planned is T-028 itself.** No
worktree is open, so the board on main shows nothing in flight and
nothing IS in flight — the first time both have been true in some days.

**THE FRESH-INSTALL PROOF, RELOCATED — the shape T-052 wants, walked a
third time.** Run in a throwaway `git worktree` at the merge commit with
the checkpoint's uncommitted diff applied, so `npm ci` never went near
the `node_modules` under the human's live vite. The worktree was verified
to carry the EXACT tree this commit lands — sha256 on `graph.json`, both
dogfood fixtures, `ROADMAP.md`, `ARCHITECTURE.md`, the card,
`crescendo.ts` and the reconciled `window-contract.spec.ts`, all MATCH —
before anything ran. Both columns agree exactly:

    package        in MAIN (existing node_modules)   in the scratch worktree (npm ci)
    lib/parser     225/225, 11 files                 225/225, 11 files    (55 pkgs, 0 vulns)
    app            768/768, 41 files                 768/768, 41 files    (499 pkgs, 0 vulns)
    app/src-tauri  299 passed / 3 ignored            299 passed / 3 ignored  (COLD build, own target)
    tools/e2e      70 passed in 13.3s                70 passed in 13.7s   (8 pkgs, 0 vulns)
    lint:tokens    clean, 114 files                  clean, 114 files
    selftest       49 + 14 green                     49 + 14 green

**Every exit code 0 on both sides, and the app bundle hashes MATCH**
(`index-ByWKsUIt.js` 488.81 kB / `index-DVAVecvn.css` 43.79 kB) — an
existing `node_modules` and a lockfile-exact `npm ci` produce the same
bundle from the same tree, which is also an independent check that the
merge's frontend is reproducible. `STATE.md` itself was written after the
worktree ran and is the ONLY file not in it: it is inert to every suite
except the parser's live-tree walk, which was re-run in main afterwards,
unpiped, exit 0.

**PORTS: 1420 IS OCCUPIED AND THAT IS DELIBERATE.** The architect
relaunched the app out of the MAIN checkout at ~05:30 (node pid 81894,
one listener). **Every agent has been briefed to probe it read-only and
never bind, connect to or signal it**, and every lane, verifier and
integrator has honoured it — T-028's build took 14733/14528, its
verification 14901/14902/14903/14921, this merge's lane 16420, boot gate
16430 and fresh-install lane 16440. No OTHER listener is bound; no stray
`tauri dev`, `vite` or boot-check process survives beyond the human's own
app. **T-052's problem stays live for whoever takes T-029**: main's
`node_modules` is under a running vite, so a fresh install there kills
the app (mechanism B). Run installs in a scratch worktree — **that route
is now walked three times and documented** — or refuse loudly. A skipped
gate is news, never silence.

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. **T-028's security posture was verified rather than
argued**: zero Rust, zero new IPC call sites (the nine-command set
derived independently from both ends and intersected), zero new grants
(`EXPECTED_GRANTS` byte-identical at three refs), zero new dependencies,
zero lockfile lines, no `innerHTML`/`dangerouslySetInnerHTML`, no shell
string, no `child_process`, no `new Function`. **The one thing that DID
weaken is T-028-s6** — a typecheck-level guard against the app writing to
disk, removed as a side effect of extending an ambient `.d.ts` that
`tsconfig.json` shares between `src` and `test`. Nothing exploits it and
nothing writes today; it is a guard gone, not a hole opened. The sharpest
open set is otherwise unchanged and still app-agent's: **T-047-s5**,
**T-047-s6**, **T-047-s4**, **T-047-s1**; beside them **T-046-s1** and
**T-041-s4**. **T-060 is the card that would close most of it and it is
undispatched.**

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020).
T-028 adds **zero CI steps** (`.github/` is a 0-file diff) but its lane
grows by five specs, so the workflow's shape is unchanged while its lane
grows to 70. The cautions for a Linux runner are unchanged and one is
sharper again: T-027's, T-051's and now T-028's lane specs measure
**geometry and animation** against a real bundle and real CSS, and font
metrics, scrollbar widths and animation timing are not identical across
platforms — **read T-051-s8 and T-051-s9 first if a lens or window
assertion reds**, and note that `crescendo.spec.ts:81` asserts a computed
`animation-name`, `0.26s` and a fill-mode, which is the first
animation-timing assertion in the lane. Otherwise unchanged: the ubuntu
apt/webkit2gtk set; the three `uses:` SHA pins; the `e2e types` step
(still never executed on any runner); T-034's `map-tasks-lens-dom.test.tsx`
and T-051's `window-manifest.test.ts` both reading the BUILT stylesheet,
so **build-then-test ORDER is load-bearing**; T-014's nputer-index watch
timings measured on FSEvents; `cargo audit`; the xvfb boot check; and the
THREE T-018 SENTINEL live tests.

## Open questions

- **What does the pipeline owe a task whose VERIFIER vanishes
  mid-flight?** **Carried forward, and the practice has now held TWICE
  running.** T-051's verifier committed its verdict and all four stamps
  before it ended; **T-028's did the same at `a419773`**, so this
  integrator verified ADR-016's marks and transcribed NOTHING. T-053
  remains the only counter-example, where the marks existed nowhere until
  the checkpoint wrote them from hearsay. **Two-for-two is a habit, not
  an enforcement** — nothing in TASK-FORMAT requires the stamps to be the
  verifier's last act, and the question stays open only because nothing
  is written down. **The cheap fix is one clause in TASK-FORMAT**; the
  architect's call (ADR-004).
- **Does the BOOT GATE rule retire, and when?** Carried forward.
  T-051 was the strongest argument yet for KEEPING it and also the merge
  that showed its limit (T-051-s7: the gate would pass a kebab-cased
  `min-width` too, because that spells an accepted serde alias). **T-028
  adds a different data point: the gate fired on a 10-file frontend diff
  and proved nothing the vitest and lane suites had not already proved**,
  because a frontend regression that stops the app launching is a class
  the bundle build already catches. The gate's value is concentrated in
  the manifest and Rust classes; on `app/src/**` alone it is cheap
  insurance rather than unique evidence. Both halves belong in the
  retirement argument. Left for triage.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** Still LIVE and unchanged in substance:
  `method/roles/executor.md` still says only "run the test commands from
  CONVENTIONS.md until green", while four rules now share the
  trigger → command → record → IF-it-cannot-run → why shape. A method
  version bump, not an ADR.
- **When does the C0/searchability rule become a gate?** Unchanged in
  substance and still at **THIRTEEN reproductions across five sessions**.
  The habit is **eleven-for-eleven**. Still no gate. T-058 owns it. **This
  merge sharpens the adjacent "which walk sees this file" question into
  a measurement rather than an observation**: the graph's walk
  (`.nputerignore`, `tools/` excluded) and the token lint's walk
  (`app/src`, `app/test`, `tools/e2e`) disagreed about the SAME five new
  files — the graph took four, the lint took five — and both numbers were
  derived independently and both landed. Neither walk is wrong; but the
  repo now has three answers to "which walk sees this file" and no
  document states them side by side.
- **Does the shared main working tree need a rule?** Carried forward with
  a **THIRTEENTH face, and it is the opposite of the last one.** T-051
  was the first merge that disturbed the running app NOT AT ALL and could
  prove it. **T-028 unavoidably DID disturb it** — ten files under
  `app/src/`, so vite recompiled and the human's window changed contents
  mid-session — and the honest record says so rather than reaching for a
  reassuring measurement. **That is the shape the rule wants**: "say what
  you disturbed, AND say how you measured it" has to be able to return
  BOTH "nothing, and here is the per-file proof" and "the whole frontend,
  because there was no other way to land the card". T-051 supplied the
  first; this merge supplies the second. What was measured here is the
  INVISIBLE half — the parser `dist/` no-op (T-052's instance 5), proved
  per-file — because that is the one a reader cannot infer from the diff.
  Method/process, so the architect's (ADR-004).
- **When does spawn hygiene become an ADR?** Unchanged: when T-047-s5
  lands.
- **Does a verifier's remedy belong in an acceptance criterion?**
  Carried forward, **TWELFTH data point**, and T-028's is a new
  statement again: the verifier found that a criterion **cited a
  mechanism that does not exist** ("T-023's completion signal") and
  approved anyway, because the executor had derived something stricter in
  its place. *The criterion named a thing that was never built; the work
  is right because the builder refused to pretend it had been* is a fifth
  statement beside the four this question already tracks.
- **Should a card's own numbers be treated as a claim to verify rather
  than a brief to implement?** **T-028 is the NINTH instance in nine
  merges, and it widens the question from numbers to CITATIONS.** The
  card cites a completion signal that no method document defines; its
  `touches:` under-declares a lane it necessarily edits; its suite
  figures (197/10 parser, 762/40 app, 112 lint) were all true against a
  stale main and all wrong against the merged one. **Every criterion
  still HELD.** Both limbs still want writing down, and a third is now
  earned: *a numeric claim is evidence to reproduce; an enumerated list
  of what will move is a floor rather than a ceiling;* **and a citation
  to another task's artefact is a claim about the repo, not a
  definition** — `git grep` it before building on it. Method version
  bump, the architect's call (ADR-004).
- **Is a forecast that has to be COMPLETE a reasonable standing bar?**
  **NEW, and it is asked because this merge broke a two-merge streak.**
  Ten of eleven fixture sites were derived before anything ran; the
  eleventh (C-13's drift ring) was missed because the two previous
  merges made "drift counts do not move at a regen" look like a property
  when it was a consequence of both having added only package-headed
  edges. The forecast discipline is clearly worth keeping — it caught
  the four-assertions-in-one-body trap again — but "complete" is being
  scored against a fixture whose shape the integrator learns from the
  last two checkpoints, which is exactly how a coincidence becomes
  folklore. **The cheap fix is mechanical rather than cultural**: derive
  the fixture's expected values by running the derivation and DIFFING
  against the committed fixture, instead of enumerating sites by reading.
  This merge did that for the counts, the findings and the relation
  table — and every one of those was right. It did not do it for the
  rendered map, and that is the one that broke. The architect's, and
  probably a paragraph in CONVENTIONS rather than an ADR.
- **When a task retires a test, who owns the property it was reaching
  for?** Carried forward from T-045, unchanged — though T-028's split of
  the 1440×900 lens assertion into "bounded at every size" plus "scrolls
  where content genuinely exceeds it" is the best worked example the
  question has: the retired half had zero discriminating power at that
  cell, and the replacement is provably falsifiable one cell over.
- **What does the pipeline owe a task whose builder vanishes
  mid-flight?** Carried forward from T-050, unanswered.
