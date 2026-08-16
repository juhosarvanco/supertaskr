# State

Updated: 2026-08-16 by integrator (T-024 merge), claude-opus-5 @fresh

## Just completed
T-024 (genesis lens, M, app-interview) done and merged — the project's
FIRST cross-model build (`claude-fable-5 @fresh` from dispatch through
`ad2716f`, then `claude-opus-5 @fresh` ×2: the completion session and,
after a REJECTED verdict, a fresh executor's fix pass), verified by
`claude-opus-5 @fresh` — `review: same-model` relative to the
completing builder, with the fable-built half receiving cross-model
review. Component **C-13 (genesis pane)** now has code. Milestone 3's
first slice is one card from complete.

WHAT THE LENS IS: `app/src/genesis/genesis-derive.ts` — a pure,
deterministic, I/O-free function from the watcher's existing docs
state to a genesis model: per-artifact status (expected from T-023's
banking map / written / writing / `[?]` assumption count), an
approximate stage (highest banking-map stage whose artifacts exist,
approximation recorded as designed), a north-star card (title sentence
+ person/success/non-goal chips, absent-tolerant) and backbone entries
(built vs forming, from the parsed ROADMAP). Time enters ONLY as the
`nowMs` argument, so the 5-second "writing" window is testable with
zero wall-clock flake. `app/src/genesis/GenesisPane.tsx` renders the
design's right pane from that model and nothing else — "the project,
so far" header with the live `docs/ · N files written` count,
north-star card, backbone grid (dark built cards, dashed forming
placeholders), artifact rows with written ✓ / writing pulse, an
assumption badge where `[?]` markers live, and the banking map's
"next" line. It is DRIVER-AGNOSTIC by construction: it renders
whatever lands in docs/, whether written by T-025's spawned planner or
by a human hand-driving the method in a terminal. App suite +34
(24 derivation + 10 DOM), 398 → 432.

THE REJECTION, TOLD STRAIGHT — it is the useful part. Declaring a
component moves **THREE** registry pins, not two. The first pass
reconciled `app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` and missed
`lib/parser/test/smoke.test.ts:40` — T-008's live-tree registry pin,
one directory away, in a different npm package — leaving that
package's required suite RED at HEAD (1 failed | 158 passed). It was
caught only because the verifier ran a suite the implementation notes
had declared "untouched (zero files changed)". That claim was TRUE as
a diff claim, which is exactly why nobody ran it: the fixture parses
the LIVE docs/ tree, so a docs-only commit reddens a suite whose own
files never moved. **Diff scope is not test scope; a suite not run is
a suite not known.** The fix was `'C-13'` appended to a whole-array
`toEqual` — `git diff --numstat` on that file reads `13 0`, thirteen
insertions and ZERO deletions, which is byte-level proof that nothing
was loosened. Re-verified APPROVED.

WHAT VERIFICATION PROVED (attacked, not accepted):
- **All 34 new tests actually execute** — `expect("PROBE").toBe("EXECUTED")`
  injected as the first statement of every one of the 34 `it()` bodies
  → 34 failed (34), then reverted. Run in BOTH verification passes.
  This is the direct answer to the earlier vacuous-suite incident: the
  suite's existence is no longer taken on a file count.
- **The banking-map coupling is real.** `BANKING_MAP` is a verbatim
  transcription of the 9-row normative table in
  `method/interview/plan-interview.md § Output`, and the suite re-reads
  that method file. Mutating stage 4's "Banks into" cell to
  `§ Hard limits` turns the suite RED naming the exact cell; reverted →
  24/24. The CONVENTIONS "transcribed table" gotcha, mechanised.
- **All 82 CSS utilities used by the pane emit** into the built
  stylesheet (`dist/assets/index-D9PU4sJh.css`, selector-boundary
  match, not substring) — zero arbitrary values, zero default-palette
  utilities. A class that did not exist would otherwise fail silently.
- **Hostile fixtures produce no injected markup.** The verifier wrote
  its own 5 probes: script tags INSIDE filenames, a 10,000-character
  unbroken run, BOM/NUL/ANSI/RTL/zero-width bytes, `"[?]"×5000`, and a
  torn-file storm with EVERY file malformed. Nothing threw, every row
  still rendered, and the DOM carried no `script`/`img`/`iframe`/
  `style` element and **zero `on*` attributes** anywhere — the literal
  bytes present only as text. The no-innerHTML gate is standing, not a
  one-time grep: planting `el.innerHTML = "x"` reddens it by filename.
- **Reduced motion by mechanism, not by class name**: the built sheet
  carries `.motion-safe\:animate-status-pulse` ONLY inside
  `@media(prefers-reduced-motion:no-preference)`, with no bare rule
  anywhere.
- **T-023-s2 discharged.** The dry-run fixture is the real scratch
  tree harvested byte-faithfully at its single commit `b18a33c`, not a
  reconstruction from T-023's notes (which the T-023 verifier had
  found only partly verbatim). Inventory 12 files, 343 `.md` lines
  reconciled (315 under docs/ + 28 in the two root adapters), and the
  two files T-023 certified byte-exact re-diffed identical. The
  `Absorbs:` line lands on T-024 and the suggestion file is removed in
  this checkpoint, per the T-016 encoding.

BOUNDARY, STATED PLAINLY SO IT DOES NOT DECAY: the pane is **not
mounted anywhere**. Its code is absent from the shipped JS today —
nothing imports it, so Rollup drops it; its utilities reach the
stylesheet only because Tailwind v4 scans source, not the bundle. Real
bundle evidence today = tsc type-checks it and its classes are not
silently dead. Everything else is jsdom. T-026 mounts it, and the
served-bundle probe the Verification line asks for lands with the
mount (T-024-s1).

SUITES ON MERGED MAIN, all four re-derived here first-hand, fresh
installs, and all four re-run green AFTER this checkpoint's docs edits
(the live-tree lesson applied to my own commit): lib/parser `npm ci` +
`npm test` **159/159 (10 files)**, `npx tsc --noEmit` clean, `npm run
build` clean · app `npm install` + `npm run build` exit 0 + `npm test`
**432/432 (23 files)** · app/src-tauri bare `cargo test` **129 passed
+ 2 ignored** (summed across all binaries and doc-tests — `tail`
truncates the totals) · tools/e2e `npm ci` + `npx playwright test`
**16/16 in 5.1s**, headless, one worker, its OWN vite on 14520.
Nothing ever bound or contacted 1420; no server left running.

STANDING INTEGRATOR PRACTICE (T-009-s1, now the ratified CONVENTIONS
interim regen rule; retires when T-014's `nputer index --check`
becomes the gate) — NINTH exercise, and the first since ratification.
It FIRED (the branch adds `.ts/.tsx` outside docs/) and it MATTERED:
the graph moves **78 → 82 files, 449 → 513 symbols, 790 → 871 edges**,
319,886 bytes, sha256
`966d73b6c75757b29e4fcfa828e75eaeca54c7371821406cacff5edbfd18ab72` —
byte-identical across three runs (golden regen → plain ignored
self-check → second golden regen), and the plain self-check passes, so
the committed graph is current. Still `languages: ["ts"]` and still
ZERO `tools/` paths. The ceaa949 ordering lesson held again: the
fixture edits landed BEFORE the final regen, and they moved the graph
(the two suites' own hash/loc), so a regen-first ordering would have
committed a stale file.

THE REGEN DELTA, AND WHERE THE PRE-MERGE FORECAST WAS WRONG. The
re-verifier derived an expected delta; I re-derived the whole thing
independently from the raw graph (glob file→component mapping,
cross-component import edges, declared-vs-observed classification) and
it matched the engine on all 26 rows. Confirmed as forecast:
**`D3:C-13` CLEARS** (C-13 gains 2 indexed files), **`C-13→C-10` flips
planned → confirmed** (observedCount 2 — both genesis sources import
docs-model), **`C-13→C-11` stays planned** (no TS import can confirm a
stylesheet edge, the state `C-12→C-11` already carries), and C-13
leaves the drift set (7 → 6 nodes; declared-only back to the three
non-code components C-01/C-07/C-11). CORRECTED, twice, and both
corrections come from the same blind spot — the forecast reasoned only
over `app/src/genesis/` and forgot the `app/test/**` umbrella:
1. **A FIFTH undeclared edge appeared** — `D1:C-05→C-13`,
   observedCount 2 (the two new suites import the pane and the
   module). The forecast said the undeclared tally would stay 4; it is
   **5**, the relation tally moves 12/4/7 → **13 confirmed / 5
   undeclared / 8 planned**, and C-05 now carries THREE drift
   findings. Structurally identical to the existing D1:C-05→C-06 and
   D1:C-05→C-09 — C-05's suites consume child components C-05 does not
   declare. It is honest drift, and it is exactly the kind of thing
   T-033 (zero-drift registry pass) exists to rule on.
2. **`C-05→C-10` grew 10 → 13** — both new suites import docs-model
   and the DOM suite also drives watcher-store.
Mapping is now C-05 33 / C-06 21 / C-08 10 / C-09 3 / C-10 2 / C-12 11
/ **C-13 2** = 82, D2 still empty, no unmapped node.

FIXTURES RECONCILED, AND THE ONE DELIBERATELY NOT TOUCHED.
`architecture-dogfood.test.ts` (dated addendum enumerating every
delta) and `map-dogfood-render.test.tsx` (25 → 26 edges, undeclared
4 → 5, C-05 face `drift 2` → `drift 3`, panel `3 drift findings`,
index hint 78 → 82 files) were reconciled — changed, never loosened,
and each edit ADDS assertions rather than relaxing them (the new D1
row is pinned by whole-array `toEqual`; the panel gains the third
drift sentence; C-13 gains a positive no-drift-ring assertion).
`lib/parser/test/smoke.test.ts` was **deliberately left alone**: it
pins the component REGISTRY read from `docs/architecture/components/`
and never reads the graph. Reconciling it at a regen would be the
mirror image of the error that got this task rejected — the third pin
is a REGISTRY pin, not a graph pin.

INTEGRATOR JUDGMENT CALLS, recorded. **ARCHITECTURE: no new table row,
two truth-fixes.** The components table is deliberately the seven
TOP-LEVEL components; C-08…C-13 are C-05's children, declared in
docs/architecture/components/ and named by the slug-map line under the
table. C-12 is the direct precedent — it has had code since
T-011/T-012 and never gained a row. What DID become false is finer:
the "Code layout" bullet enumerated the app's areas as "app-shell,
app-board, app-map", which is now incomplete, so it gains
app-interview / `app/src/genesis/**` = C-13, "code-complete and
unmounted until T-026"; and C-05's status cell said interview was
"pending F-03", which now understates — it reads that C-13's lens has
code since T-024 but no mount until T-026. **ROADMAP: untouched,
verified line by line.** Milestone 3's card already names the first
slice T-023+T-024+T-026 and its task range; the file's own convention
is that only WHOLE-milestone completion earns a `Progress:` line
(milestones 1 and 2 have one; mid-milestone progress has never been
tracked there — the T-017/T-020/T-021 precedent). Nothing in the file
is made false by this merge. The first-slice note, if it is wanted at
all, belongs at T-026's merge. **NO new ADR** (three-prong): C-13
implements ADR-017's already-approved architecture (spawned planner
writes, app stays a lens) and adds no cross-component question;
nothing here contradicts any ADR; and the pane's own calls — the
banking-map transcription, the injected clock, the design-token table
with its four disclosed deviations, the zero-arbitrary-values fence —
are durably recorded in the task file's implementation notes and in
C-13's component intent file. **T-023-s2 absorbed** (Absorbs line +
`git rm` of the suggestion file, T-016 encoding).

T-036 (CI token least privilege, S, .github/ + tools/e2e/) done and
merged in the same breath — S-TIER, so executor + tests and the
ORCHESTRATOR merged it directly (T-016 precedent; `review:
self-verified` is the honest floor, stamped rather than left empty —
T-011-s3's lesson). ci.yml now declares `permissions: contents: read`
at workflow scope, so GITHUB_TOKEN's scope is a fact in this repo
instead of a checkbox in a web UI. Taken NOW deliberately: the
workflow is dormant, so this was an edit against a file nobody has
run; after the first push it would be an edit against a live
credential. The parity spec pins it three ways and the executor
proved the third assertion is independent by planting a job-level
`packages: write` BESIDE a redundant `contents: read` — assertions 1
and 2 both pass there and only the document walker catches it, naming
`jobs.linux.permissions grants packages: write`. Five mutation shapes
in all (top-level widening, job-level extra scope, job-level write,
step-level id-token, `write-all` shorthand), each failing exactly one
test with the other 16 green. Suites on merged main: parser 159/159 +
tsc, app 432/432, cargo 129 + 2 ignored, E2E lane 16 → **17**. Graph
practice, TENTH exercise: fires by the letter (`.ts` under tools/) and
is a proven no-op — sha256 966d73b6… identical before and after,
`git status docs/architecture/` empty, because `.nputerignore`'s
`tools/` line holds (the T-020 verifier's negative control showed
deleting that line makes self_graph FAIL, so the exclusion is
load-bearing). Absorbs T-020-s4; T-036-s1 filed (the assertions read
ONLY ci.yml, so a second workflow file would silently inherit the
repo default again — and its author would never see the rule, which
lives as a comment in the file they are not editing).

## In progress / broken right now
- T-026 (genesis entry, M, app-shell) in ../nputer-t026 — **VERIFIED
  APPROVED** (`f5047df`), awaiting integration; its card on main still
  reads `building` until the integrator stamps it. This is the card
  that mounts T-024's pane and COMPLETES MILESTONE 3'S FIRST SLICE.
The t024 and t036 worktrees are removed; their branches are KEPT.
Nothing broken. Main tree clean.

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020). At
the repo's first push (`git remote -v` is still empty), confirm in
order: the ubuntu apt/webkit2gtk set installs; the three `uses:` SHA
pins resolve; playwright-on-Linux runs the lane; `cargo audit` behaves
as it does locally; the xvfb `tauri dev` boot prints both `[nputer]`
startup lines. AND (T-018-s3 fold) the THREE T-018 SENTINEL LIVE TESTS
inside the ubuntu `cargo test` step — replaced-wholesale and
deleted-recreated docs/. They discriminate only where inotify watches
INODES; macOS FSEvents watches paths and was accidentally resilient,
which is why T-018's replace-half evidence is mechanism-only today.
Green there CLOSES that evidence gap; red there is a real reconcile
gap macOS could never surface, and gets filed immediately. This run is
also the gate that closes T-001/T-003's Linux halves.

## Next up (1–4)
1. @human, consolidated: the at-a-glance amber judgment (T-012
   criterion 5's human half — drift stroke vs building/verifying
   fills, BOTH schemes, incl. composed building+drift; the dogfood
   hero renders it live, and it now shows C-05 at `drift 3`) · the
   launch-shot re-judgment (T-006's pending screenshot predates the
   rail — light + dark now include it) · the standing real-input
   checklist, SHRUNK by T-020: blocker-link click and real-key
   Esc/Enter/Space are automated in the lane; PICKER FLOWS remain
   @human (native dialogs are unreachable from a browser harness and
   tauri-driver has no macOS) · a Linux run — this is the "watch the
   first CI run" item above · the T-023 dry-run conversational quality
   judgment (did the two "pushing back:" challenges actually
   challenge; the founder was builder-scripted in-session, so true
   cold-context evidence arrives with T-026/T-029) · **T-024's visual
   pass, still BLOCKED**: the pane against the design's `interview`
   screen in light AND dark (no dark mockup exists — every dark value
   is derived by token family; look hardest at built/forming/slot card
   contrast and the warm writing-row border), the five type sizes that
   moved 0.5–1px read at real size (especially the 19px → 20px
   north-star hero), and the substituted footer right slot
   (`stage ~4 · constraints` in place of the design's `~9 min
   elapsed`) — a product decision as much as a visual one. There is no
   route to the pane in a running app until T-026 mounts it, and the
   human has scheduled the whole visual session for after T-026
   merges.
2. MILESTONE 3 (T-023…T-029, ADR-017), first slice T-023+T-024+T-026 —
   hand-driven genesis rendered live: T-023 DONE, T-024 DONE, T-026 in
   VERIFICATION. One card from complete. Human-ruled queue for the
   app-shell lane: T-026 → T-025 → T-022. **T-025 (agent runner, L)
   unblocks the moment T-026 merges** — its `blocked_by` is
   [T-021 ✓, T-023 ✓, T-026] and its planning pass is already applied.
   T-027 is L (planning pass at dispatch) and dispatches when
   T-024 ✓ + T-025 + T-026 all merge; T-028/T-029 behind it.
3. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16 night): app-shell lane
   queue T-021 → T-026 → T-025 → T-022; T-021 and T-020 are DONE, so
   T-026 holds that lane. Milestone 3 runs through T-029 as blockers
   clear. Triage: APPLY granted — but tasks NEWLY created by triage do
   NOT dispatch without the human. Unchanged method rules: a second
   REJECTED on any task parks that lane for the human (T-024 came
   within one verdict of parking app-interview, and the fresh-executor
   fix pass is what avoided it); @human judgments are never
   self-answered.
4. Suggestion backlog for the NEXT TRIAGE — twelve to disposition
   (six carried + six new from T-024), plus three parked in place;
   none dispatched. Carried over: T-021-s1 (the ACL pin's EXPECTED_GRANTS
   is macOS-derived; the first CI run FEEDS this) · T-021-s2
   (genericize the AppHandle-taking commands over `R: Runtime`) ·
   T-021-s3 (pin the panic-path latch release) · T-020-s3 (the boot
   check cannot run while the human's app holds 1420) · T-020-s5 (the
   token lint's P1 pattern fires on dash-prefixed arbitrary VARIANTS
   and on regex literals — the next `npx shadcn add dialog` reds the
   lint on unmodified upstream code) · T-020-s6 (the parity spec
   mirrors CONVENTIONS in a hard-coded array instead of parsing it).
   Parked in place: T-008-s1 (awaits F-04/F-05 layout decisions),
   T-018-s1 (awaits a Windows lane), T-003-s2 (already encoded).
   NEW FROM T-024 — **T-024-s1** (the served-bundle probe lands with
   T-026's mount; the pane has no route today) · **T-024-s2**
   (C-13's D3 clears at the graph regen) — **already DISCHARGED by
   this merge; the next triage should resolve it, not schedule it**,
   and note for the record that its written "reverse delta" was
   incomplete in the same way the rejection was: it predicted the two
   C-13 rows and missed both umbrella deltas (D1:C-05→C-13 and
   C-05→C-10 10→13) · **T-024-s3** (a render-phase ref write stamps
   the change log — identity-guarded, but the concurrent-render blast
   radius wants an architect ruling, not a fix) · **T-024-s4** (the
   north-star title is the pane's one unbounded text surface: a
   10,000-char single text node reproduced; chips clip at 44 and rows
   `truncate`, but the title has no `break-words`/`min-w-0` — it
   departs from T-017's established answer, so it belongs with T-031)
   · **T-024-s5** (write down the registry-pin inventory so
   "declaring a component moves THREE fixtures" stops being folklore —
   this is the rejection's own lesson, and it is cheap) · **T-024-s6**
   (compound cross-model `built_by` stamps parse to a FALSE
   `policy: "resume"` — both sessions were `@fresh` — and to a
   ~50-character model badge in a chip with no `truncate` and no
   `max-w`; `modelField` rejects only an empty model or session, so
   the live-tree gate passes on a stamp that parses to nonsense. It
   belongs to T-019's parser/model-hygiene lane, i.e. T-030. **It
   starts rendering on T-024's own card the moment this checkpoint
   lands** — board and map both switch from `builder` to `built_by` at
   done/merging. Cosmetic, expected, NOT a blocker; do not "fix" the
   stamp by making the record less honest about who built what.)
   Integrator observation carried forward for the same triage, and it
   GREW rather than shrank: **nine** open suggestion files carry no
   `id:` field — T-021-s1/s2/s3 and all six of T-024's (verified by
   grep at this merge, not assumed; T-023-s2 was a tenth and leaves
   here). The T-016 encoding requires an id at parking, and the parser
   accepts the omission silently today, which is why it keeps
   recurring. Worth a rule, not another observation — it is the same
   family as T-030's parser-strictness pass.

## Open questions
None.
