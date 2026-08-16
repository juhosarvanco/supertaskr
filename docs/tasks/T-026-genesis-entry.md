---
id: T-026
title: Shell genesis entry — Start an interview, docs-less folders, front door affordances
feature: F-03
milestone: 3
priority: 3
size: M
status: building
blocked_by: [T-018]
touches: [app-shell]
builder: claude-opus-5
verifier: claude-opus-5
built_by: "claude-opus-5 @fresh"
verified_by: "claude-opus-5 @fresh"
review: same-model
---

blocked_by T-018 is technical: opening a docs-less folder relies on
its root sentinel (docs/ appears → watcher re-arms) so the agent's
first `mkdir docs` lights the pipeline. Design source: the `open a
folder` screen ("Start an interview" beside "Open a folder…", ⌘N ·
⌘O; the "No plan in <folder>" card with "Start an interview here" —
the Adopt button is deliberately ABSENT in v1, fenced to
archaeology). Serialize with T-025 on app-shell at dispatch.
Absorbs: T-018-s4 (triage 2026-08-16) — the docs-appeared staleness
fix lands here: same screen, same sentinel, same cargo flow.

## Acceptance criteria
- THE front door SHALL render the design's two-button affordance
  ("Open a folder…", "Start an interview", ⌘O/⌘N) and the existing
  no-docs rejection state SHALL become the design's "No plan in
  <folder>" card offering "Start an interview here" — checklist of
  looked-for paths preserved, Adopt absent.
- WHEN a folder without docs/ is picked for genesis THE shell SHALL
  open it as a genesis project via a zero-argument picker command
  variant (ADR-012 pattern; validation: existing directory, not a
  symlink target swap — T-003 rule family) with the watcher armed on
  the root sentinel, and a new screen state `genesis` SHALL render
  full-bleed (no rail — the rail remains board|map for open
  projects; T-027 fills the screen, this task mounts a placeholder
  that already hosts T-024's lens when docs exist).
- WHEN docs/ later appears under the genesis project THE existing
  pipeline SHALL light up with no re-pick (T-018's sentinel,
  exercised end-to-end in a cargo test from this task's flow).
- WHEN docs/ appears EMPTY under the open project THE watcher SHALL
  emit exactly once on the (unarmed → armed) transition even though
  the tree equals the empty baseline, so the front door replaces the
  stale "no docs/ found" claim with the empty board (the invitation
  rendered live); the suppression invariant holds for every other
  batch (T-018-s4).
- IF the picked folder already contains a plan (docs/ROADMAP.md or
  any docs/tasks/*.md) THEN genesis SHALL NOT be offered for it —
  the flow routes to opening it as a normal project (no overwrite
  path exists in the app by construction).
- IF the picker is cancelled or validation fails THEN the previously
  open project SHALL be untouched (PickOutcome discipline), pinned
  in tests.

Verification: headless — cargo picker/sentinel-flow tests, vitest
shell-routing tests, served-bundle probe of the two front-door
states; T-007/T-022-adjacent behaviors untouched (T-022 is milestone
4 — recents rows unchanged here). @human: front-door visual judgment,
light + dark.

## Implementation notes

Executor claude-opus-5 @fresh, 2026-08-16, branch `t026-genesis-entry`
(worktree ../nputer-t026). Branch point: main@3c16182 (the dispatch
commit); measured baselines there match the dispatch numbers exactly —
lib/parser 159/159 (untouched, zero-byte diff), app 398/398, src-tauri
bare `cargo test` 129 passed + 2 ignored, `gen/schemas/capabilities.json`
sha256 `4fca70b5…6b07`.

All app-shell: `docs_watch.rs`, `lib.rs`, `acl_pin.rs` (roster line),
`App.tsx`, `watcher-store.ts`, the new `components/shell/GenesisScreen.tsx`,
and three test files. ZERO diff to lib/parser, method/, board/map
components, `app/src/genesis/**` (T-024's worktree owns it), tokens.css,
index.css, capabilities/, tauri.conf.json, and both lockfiles.

### What was built

**The plan probe — one predicate, three consumers** (`PlanProbe`,
`probe_plan`, `PlanProbe::has_plan`, docs_watch.rs:344-425). A stat
sweep of the four paths the front door looks for: `docs/ROADMAP.md`,
any `docs/tasks/*.md`, `docs/ARCHITECTURE.md`, `.git` (file or dir —
worktrees count, as in T-007's walk-up). `has_plan() = roadmap || tasks`
is criterion 5's predicate literally; it also feeds the card's ○/✓ marks
so they are MEASURED, and it is the reusable seam T-025 §4 asks for
("re-check of T-026's plan-absence predicate — reuse/extract T-026's
landed fn"). Booleans only cross the boundary: no names, no contents, so
a symlinked `docs/tasks` pointing somewhere hostile can only flip
`tasks` true, which makes the app MORE conservative about offering
genesis and discloses nothing. `is_plain_dir` was extracted as the T-003
rule family's one primitive and `has_plain_docs_dir` re-expressed
through it (behavior identical; the genesis path needs the same question
asked of the ROOT).

**Two zero-argument app commands** (lib.rs:142-231 —
`pick_genesis_folder` at 156, `start_genesis_here` at 204; the ADR-012
pattern command-for-command with `pick_project_folder`):
- `pick_genesis_folder()` — "Start an interview" / ⌘N. Claims the T-021
  `PickInFlight` guard BEFORE the native dialog opens, opens the dialog
  Rust-side, and hands the choice to `apply_genesis_folder`. No path
  crosses the IPC boundary in either direction.
- `start_genesis_here()` — the card's "Start an interview here", with no
  dialog and still no argument. The target is `WatchState::genesis_target()`:
  the user's own last dialog choice that was refused for having no docs/
  (`last_rejected`, set only inside the pick path with a canonicalized
  path), falling back to the open project — which is what makes the
  FIRST-LAUNCH case work (the launch-resolved repo with no plan). A
  webview invoking this out of turn can therefore only re-open a folder
  the USER already chose, and the plan check still governs; that
  analysis is the security half of the "why two commands" answer.

**`apply_genesis_folder`** (docs_watch.rs:735-841) mirrors
`apply_picked_folder`'s order exactly: canonicalize → require a plain
directory (T-003 rule family at the root) → **if the folder already
holds a plan, route to the ordinary open** → rendezvous `ArmGenesis` →
commit → seq. Criterion 5's "routes to opening it as a normal project"
is a CALL, not a re-implementation: `open_as_project` was split out of
`apply_picked_folder` so both entry points share one body, which is why
a planned folder picked for genesis answers with the identical
`Picked`/`NoDocs`/`Error` shapes. There is no overwrite path in the app
to guard, by construction — the app writes nothing under docs/ (ADR-017).

**`WatchCtl::ArmGenesis` + `arm_genesis`** (docs_watch.rs:1218-1281;
the control-loop arm sits beside `Rearm`'s). A genesis root usually has nothing to watch recursively, so T-018's root
sentinel becomes the load-bearing watch, and unlike T-018's best-effort
arm this one is a HARD requirement: if the sentinel cannot arm, the pick
fails rather than sitting there unable to notice `mkdir docs`. Ordering
follows T-007's rule (arm the new before dropping the old), and because
`arm_sentinel` drops the old scope on its own failure, the previous
project's sentinel is RE-ARMED before returning Err — "the previously
open project is untouched" had to be literal. A genesis-eligible folder
that already has a plain `docs/` (empty docs/, or docs/ with no plan)
delegates straight to `rearm`, so nothing is special-cased twice.

**The T-018-s4 fold** (criterion 4). `ensure_docs_watch` now returns
whether it performed the (unarmed → armed) transition — `#[must_use]`,
true ONLY on that transition's success — and `handle_fs_batch` emits on
it even when the collected outcome equals the baseline. An empty `docs/`
is byte-for-byte the empty baseline, which is why T-018 sided with
suppression and left the front door claiming "no docs/ found" over a
directory sitting right there. The flag is true at most once per arming
(the next batch finds the watch armed), so the suppression invariant is
untouched for every other batch — asserted with exact counts, not
timing.

**Frontend.** `PickOutcome` gains `genesis { projectDir, seq, probe }`
(no snapshot exists to send, so `seq` carries the switch's ordering
stamp and every in-flight emit from the previous project drops as stale
— the T-007 invariant kept without a snapshot). `reducePickOutcome`
(watcher-store.ts:291-335) is one PURE reducer shared by all three
picker commands, which makes criterion 6 mechanical: cancelled and busy
return `prev` BY IDENTITY. `ShellPhase` gains `"genesis"`;
`applyDocsPayload` keeps that phase instead of forcing `"open"`, so the
pipeline lighting up updates the model UNDER the interview instead of
yanking the screen to a board. `selectScreen` gains `{screen:"genesis"}`
and a `FrontDoorNotice` (`noPlan` with the probe, or a plain `message`),
and the rail condition is untouched (`screen === "board"`), which is
what makes the genesis screen full-bleed.

### Criteria → evidence map

**C1 — front door + the "No plan in <folder>" card.**
app/src/App.tsx:91-246 (`ChecklistRow` 91, `EmptyState` 124),
watcher-store.ts:194-282 (`planChecklist` 204, `FrontDoorNotice` 223,
`ScreenModel` 229, `selectScreen` 238). Both ways in render on EVERY empty state with the
`⌘O · ⌘N` hint; the accelerators actually work (window keydown, mounted
with the screen). The no-docs rejection state IS the design card now:
heading `No plan in <path>`, the design's body copy, the four-row
checklist with measured ○/✓, and "Start an interview here". Adopt is
absent and asserted absent (case-insensitive substring). Tests:
`app/test/project-shell.test.tsx` (11 DOM tests — buttons, accelerators
incl. the negative chords and the unmount, checklist rows and marks, the
absent-.git ○, the no-Adopt assertion, keep-current, the plain message
card) and `app/test/watcher-store.test.ts` (`planChecklist` +
`selectScreen` tables).

**C2 — genesis via a zero-argument picker variant; screen state
`genesis`, full-bleed.** lib.rs:142-231 (both commands, zero arguments),
docs_watch.rs:735-841 (validation: canonicalize + `is_plain_dir`, with
`arm_genesis`'s own re-check for the validate→arm window),
docs_watch.rs:1218-1281 (sentinel arming), App.tsx:363-368 (the screen,
mounted outside the rail's condition at App.tsx:290),
`components/shell/GenesisScreen.tsx`. Tests: cargo
`genesis_pick_opens_a_docsless_folder_and_arms_the_root_sentinel`,
`a_genesis_root_swapped_for_a_symlink_is_refused_at_arm_time`,
`a_genesis_folder_that_already_has_an_empty_docs_dir_arms_the_docs_watch`,
`start_genesis_here_targets_the_folder_the_front_door_named`,
`genesis_and_no_docs_wire_shapes_are_pinned`; vitest
`app/test/genesis-entry.test.tsx` step 4 (real App: the screen flips,
names the folder, and `pane-rail` is absent).

**C3 — docs/ appears later, pipeline lights up, no re-pick.** cargo
`docs_appearing_under_a_genesis_project_lights_the_pipeline_with_no_repick`
— a REAL watcher thread armed by this task's own genesis pick, a real
write of `docs/NORTH_STAR.md`, the emit asserted (project dir included),
then a second in-place edit to prove the re-armed watch is live. DOM
half: `genesis-entry.test.tsx` step 5 — the snapshot updates the model
while the screen stays `genesis`.

**C4 — an EMPTY docs/ emits exactly once (T-018-s4).** docs_watch.rs
`ensure_docs_watch` (returns the transition) + `handle_fs_batch`
(`outcome == target.last && !just_armed`, docs_watch.rs:1056+1067;
`ensure_docs_watch` 969-1053). Test:
`an_empty_docs_dir_emits_exactly_once_on_the_unarmed_to_armed_transition`
— driven through T-018's `handle_fs_batch` seam so the counts are EXACT
with no sleeps: batch before docs/ exists → nothing; `create_dir` (empty)
→ exactly one emit with zero files; five more batches → nothing (the
invariant holds); a real file → emits; another batch → nothing again.
Frontend half: `genesis-entry.test.tsx` step 2 — a zero-file snapshot
flips the front door's stale claim to the empty board (`data-screen`
board, `data-task-count` 0, rail present).

**C5 — a folder with a plan is never offered genesis.** `has_plan` gate
in `apply_genesis_folder` → `open_as_project`. Test:
`genesis_pick_of_a_folder_that_already_has_a_plan_opens_it_as_a_project`
(both halves of the predicate: a lone `docs/ROADMAP.md` and a lone
`docs/tasks/T-500-x.md` each answer `Picked` with that file in the
snapshot and the project committed), plus
`plan_probe_measures_each_looked_for_path_and_gates_on_roadmap_or_tasks`
(empty docs/ and a lone ARCHITECTURE.md are NOT plans; a `.txt` in
docs/tasks/ is not a task file), plus the vitest
`reducePickOutcome` case landing on the board.

**C6 — cancel / failed validation leaves the previous project
untouched.** `reducePickOutcome` returns `prev` by identity for
`cancelled` and `busy` (vitest, asserted with `toBe`), the rejection
cases only add a notice with `next.docs === prev.docs`; Rust-side
`a_failed_genesis_pick_leaves_the_open_project_untouched` (vanished
path and a FILE both answer `Error` with `project_dir()` unchanged, and
the open project's watch still emits afterwards), and
`a_genesis_root_swapped_for_a_symlink_is_refused_at_arm_time` (the arm
gate keeps the previous docs watch and root). DOM: `genesis-entry`
steps 3 and 6.

### Mutation drills (do the tests detect the regressions?)

Each planted, run, reverted; suites green after each revert.
1. Removed `&& !just_armed` from the suppression check →
   `an_empty_docs_dir_emits_exactly_once…` FAILED at the transition
   assertion ("the arm transition must emit exactly once"). The T-018-s4
   fix is load-bearing, not decoration.
2. `PlanProbe::has_plan` forced to `false` →
   `genesis_pick_of_a_folder_that_already_has_a_plan…` FAILED with
   `expected the normal open for docs/ROADMAP.md, got Genesis { … probe:
   PlanProbe { roadmap: true, … } }` — the routing, not just the probe,
   is what the test binds.
3. Removed `arm_genesis`'s `is_plain_dir` gate →
   `a_genesis_root_swapped_for_a_symlink_is_refused_at_arm_time` FAILED
   ("a symlinked root must be refused"). The T-003 rule family at the
   root is genuinely enforced at arm time, not only at pick time.
4. Frontend: `applyDocsPayload` forced back to `phase: "open"` →
   `genesis-entry` steps 5 and 6 FAILED (`expected 'board' to be
   'genesis'`) — the interview screen would be yanked away by its own
   pipeline.

### ACL / capability evidence (T-007-s2 protocol; `strings` proves nothing)

Two new APP commands, ZERO new grants. `EXPECTED_GRANTS` untouched
(the 92-grant `core:default` set is byte-identical in acl_pin.rs);
capabilities/ and tauri.conf.json are zero-byte diffs; the acl_pin
roster gained exactly `pick_genesis_folder` and `start_genesis_here` in
the remote-origin denial loop (acl_pin.rs:536-537, inside the remote-denial loop at 528-552), so both are proven
DENIED from `https://evil.example.com` on every `cargo test` through the
shipped authority. Regeneration proof, run as the protocol demands and
not asserted from memory: `gen/schemas/capabilities.json` sha256 was
captured at the branch point BEFORE any edit
(`4fca70b5437f720b9a72c727c0663349aa9e8b31917dcc0a870012de02406b07`)
and re-hashed after `cargo build` with both commands registered —
IDENTICAL, and `diff` against the saved copy is empty;
`gen/schemas/acl-manifests.json` likewise
(`d3eace193b1e453756736eaf27bb156df62c7a41b2fe101403ee92ef93e69699`).
All five acl_pin tests pass on every run, so the pin re-resolved the
shipped artifacts through tauri's own resolver after the change. Neither
new command is invoked from a LOCAL origin in any test — reaching
`pick_genesis_folder`'s handler would ask the dialog plugin for a native
dialog (headless rule); `start_genesis_here` is the same Wry-monomorphic
`AppHandle` class T-021-s2 covers, and its remote denial is probed where
rejection provably precedes dispatch.

### The T-024 seam (kept trivial, and describable without either of us editing the other's files)

`app/src/components/shell/GenesisScreen.tsx` (app-shell, mine) is the
whole seam. App.tsx mounts exactly one element for the genesis screen —
`<GenesisScreen projectDir={shell.genesisDir ?? ""} docs={shell.docs} />`
— and the component's two props are everything the pane needs:
`projectDir` (the genesis root) and `docs` (the live `DocsModelState`
the watcher feeds, which is exactly what T-024's `genesis-derive.ts`
consumes). Inside is one marked region
(`data-testid="genesis-pane-slot"`, with the seam note above it) that
today renders an honest live line — `docs/ · N files written` /
`nothing written yet` — and tomorrow holds T-024's lens with one import
plus one element. T-024 touches only `app/src/genesis/**`; I touched
none of it (`git diff main --stat -- app/src/genesis` is empty). No new
IPC exists for T-027 to wire either: the genesis screen renders from
watcher state that already flows.

T-025's named needs from this task (its §4/§10 dispatch note), all
landed: the `genesis` screen state (frontend `ShellPhase` +
`ScreenModel`), the docs-less open path (`apply_genesis_folder` +
`WatchCtl::ArmGenesis`), and the plan-eligibility predicate
(`docs_watch::probe_plan` / `PlanProbe::has_plan`, `pub` and importable
for its Rust-side re-check). lib.rs command registration is one list
that T-025 appends to — no structural change waiting for it.

### Design extraction (T-006 protocol: nearest token step, deviations disclosed)

Source: `docs/design/claudedesign_handoff/"nputer app.dc.html"`, the
`Open a folder` screen (read from the HTML directly; values are the
inline styles). Zero tokens added to tokens.css, zero arbitrary values.

| element | design | shipped | step |
|---|---|---|---|
| primary button | 14px/500, #fafafa on #111, pad 11/20, radius 10 | `Button size="lg"` → text-base 14px, px-5 20px, py-2.75 11px, rounded-lg 10px, bg-primary #111 / text-primary-foreground #fafafa | EXACT |
| secondary button | 14px/500, #171717 on #fff, border #e2e2e2, shadow 0 1px 2px | `Button variant="outline" size="lg"` → border-input #e2e2e2, bg-background, shadow-card | EXACT |
| button row gap | 10px | `gap-2.5` | EXACT |
| accelerator hint | mono 11px #737373, margin-left 4px | `font-mono text-xs` (11px) `text-muted-foreground` (#737373) `ml-1` (4px) | EXACT |
| card | bg #fff, border #e5e5e5, radius 12, pad 24/26, gap 16, shadow 0 1px 2px | `rounded-lg border-border bg-card p-6 gap-4 shadow-card` | radius 10 vs 12 (nearest step); horizontal pad 24 vs 26 |
| card title | 17px/600, ls −0.015em | `text-xl` (17px) `font-semibold` `tracking-heading` (−0.02em) | size EXACT; ls nearest step |
| title path | mono 15px | `font-mono text-lg` (14.5px) | nearest step |
| card body | 13.5px/1.6 #525252 | `text-sm` (12.5px) `text-secondary-foreground` (#404040) | nearest step (same pair the T-007 message used) |
| checklist | mono 12px #525252, col gap 6, row gap 9 | `font-mono text-sm` (12.5px), `gap-1.5` (6px), `gap-2.25` (9px) | nearest step |
| ○ mark | #737373 | `text-muted-foreground` | EXACT |
| ✓ mark | #1f7a58 | `text-review-disc` (#1f7a58 light / #4ecf9e dark) | EXACT in light; dark by token family, flagged to the screenshot pass |
| found row ink | #262626 | `text-foreground` (#171717) | nearest token |
| card button | 13.5px/500, pad 9/16, radius 9 | `Button` default size (12.5px, px-3.5, py-1.75, rounded-lg) | nearest step — the same size every other card button in the app uses |
| card footnote | 12.5px/1.6 #737373 | `text-sm text-muted-foreground` | EXACT type |
| hero wordmark + pitch | mono 38px −0.05em; 16px #525252 | unchanged from T-006's landed EmptyState (`text-3xl tracking-wordmark`, `text-base`) | pre-existing T-006 reconciliation, not re-opened here |

Deliberate deviations, each with its reason:
1. **"Adopt existing code" is ABSENT** — the task's v1 fence
   (archaeology). Its explainer footnote goes with it, and the footnote
   SLOT carries T-007's convention hint instead, so the redesign lost
   none of what the old state said (`docs/decisions/` is still named on
   this screen; asserted in both suites).
2. **The eyebrow "if the folder has no plan" is not rendered** — it
   labels the design sheet's side-by-side explainer, not the card; in
   the app the card appears exactly when that condition holds, so the
   label would be narrating.
3. **The recents rows are not built** — T-022's charter, and the
   dispatch says recents are unchanged here.
4. **Checklist path casing follows the criterion and the parser
   (`docs/ROADMAP.md`), not the design's lowercase `docs/roadmap.md`.**
   The mark is what the app measured; the label is what it looked for,
   so they must agree. Filed as T-026-s1 (case-sensitive filesystems
   make the two spellings disagree about "already has a plan").
5. **The `.git` row's clause renders only when found** — the design
   draws only the ✓ case ("it is a repo, so the plan can live here").
   An unfound `.git` gets a bare ○ row rather than an invented negative
   sentence; a mark the app has not measured never renders (its own
   DOM test).
6. **The genesis screen has no design source in this task** — T-027
   fills it. The placeholder is built from the existing token
   vocabulary only and says plainly that it is waiting.

### Verification (macOS 15/Darwin 25.6, node 22.22.0, rustc 1.95.0; ADR-011 order, from a fresh worktree)

- lib/parser: `npm ci` + `npm run build` (the app's prerequisite);
  ZERO-byte diff vs main (`git diff main -- lib/parser | wc -c` = 0), so
  "untouched" is literal.
- app/src-tauri: bare `cargo test` → **139 passed + 2 ignored, three
  consecutive runs, identical counts** (baseline 129+2; +10 in
  docs_watch). `cargo build` exit 0.
- app: `npx tsc --noEmit` clean; `npm run build` (tsc + vite) exit 0;
  `npm test` → **421 passed** (baseline 398; +23: 11 DOM front-door, 6
  end-to-end genesis, 6 store/checklist/reducer — the file counts are 22
  test files, one new).
- Token lint over my diff: zero hits for `p-[13px]`-style arbitrary
  values, `[color:x]`, `bg-(--x)`, `text-(--x)`, stock palette classes
  (`text-red-500` family) and raw hex. Verified in the BUILT CSS too —
  every utility I used compiles (`text-review-disc`, `gap-2.25`,
  `gap-1.5`, `py-2.75`, `px-5`, `ml-1`, `tracking-overline`,
  `max-w-120`), and `grep -oE '\.[a-z-]+-\[[^]]+\]'` over
  `dist/assets/index-*.css` returns nothing at all.
- Hygiene sweep over the added lines: zero
  `dangerouslySetInnerHTML`/`innerHTML`/`eval`/`localStorage`/`fetch`/
  `WebSocket`, zero `unsafe`, zero process spawns or shell strings. All
  probe results render as React text nodes (booleans, in fact); the only
  file-derived string on the new screens is the project path the user
  chose.
- No servers started, no ports bound or contacted — **port 1420 was
  never touched** (the human's live app is on it). No screen control, no
  screenshots, no real model calls, headless throughout.
- `cargo test -p nputer-index --test self_graph self_graph_is_current
  -- --ignored` → **FAILED, expected** (see below).

### For the integrator: the graph regen delta, measured

The interim T-009-s1 rule triggers (this diff touches `*.ts/*.tsx`
outside docs/). I regenerated in-branch to MEASURE the delta, then
restored `docs/architecture/graph.json` to the committed bytes (working
tree clean; the ignored check is red on-branch exactly as forecast, as
T-018's branch left it). What the regen does:

- files **78 → 80**: adds `app/src/components/shell/GenesisScreen.tsx`
  and `app/test/genesis-entry.test.tsx`; nothing removed.
- content-changed, hash/loc only: `app/src/App.tsx`,
  `app/src/lib/watcher-store.ts`, `app/test/project-shell.test.tsx`,
  `app/test/watcher-store.test.ts`.
- stats: symbols 449 → 475, edges 790 → 828. Languages still `["ts"]`;
  zero `.rs` files indexed (Rust extraction is still T-010's, so
  docs_watch.rs and acl_pin.rs stay invisible to the map).
- TWO dogfood assertions move and must be edited in the same commit as
  the regen (the ceaa949 fixture-edits-before-the-final-regen ordering):
  `app/test/architecture-dogfood.test.ts:175` `toBe(78)` → `80` (and its
  test name/comment at :91-96, :174), and the relation table at :267 —
  the `["C-05","C-10","confirmed",N]` row moves **10 → 13** observations
  (C-05's shell files gaining edges into C-10). `map-dogfood-render.test.tsx:167`
  asserts the string `committed graph · 78 files` → `80`. No other row,
  finding, or drift flag moves; every other dogfood assertion passes
  against the regenerated graph untouched.

### Flags for the verifier

- **The two-command question.** Criterion 2 asks for "a zero-argument
  picker command variant" (singular); I shipped two commands because
  criterion 1's card must OFFER "Start an interview here", and offering
  a button that re-opens the dialog for a folder the user just chose is
  not an offer. `start_genesis_here` takes no argument either — the
  target is Rust's own memory of the user's dialog choice. If you think
  the second command is surface creep, the fallback is one command with
  a webview-supplied path, which ADR-012 forbids outright.
- **`ProjectStatus::NoDocs` and `PickOutcome::NoDocs` gained a `probe`
  field** (wire-additive; three pre-existing cargo match arms were
  extended to bind it and now assert it, no behavior edited). The
  alternative — a static checklist — would have rendered a ✓ next to
  `.git` that nothing measured.
- **`selectScreen`'s empty variant changed shape** (`message` →
  `notice`), because criterion 1 replaces that state's content; three
  existing selectScreen assertions and the four EmptyState DOM tests
  were rewritten to the new shape with their intent preserved
  (`noDocsMessage` is retired — its two halves are now the card's
  heading path and its footnote hint, both asserted).
- **Attack surface worth probing:** a genesis pick raced against a
  normal pick (the shared `PickInFlight` latch is the answer — both
  commands claim it before doing anything); `start_genesis_here` invoked
  with no candidate and no project (typed Error, latch released — the
  guard drops on the early return); a folder whose `docs/tasks` is a
  symlink to a tree with tasks (probe says `tasks: true`, so genesis is
  refused and the ordinary open then applies T-003's own rules); a root
  deleted between the pick's `is_plain_dir` and `arm_genesis`'s (the
  arm-time gate refuses, nothing committed).
- **Not covered by a test, stated rather than hidden:** the
  sentinel-restore path in `arm_genesis` (if `arm_sentinel` fails, the
  previous project's sentinel is re-armed before the Err). I found no
  deterministic way to make notify's `watch()` fail on an existing plain
  directory, so the restore is defensive code reviewed by reading, not
  by execution. The `Cancelled` arm of both commands is likewise
  structural: the command returns before `apply_genesis_folder` is ever
  called and the guard drops — the frontend half IS tested
  (`reducePickOutcome` returns `prev` by identity).
- **Deliberately NOT done: the served-bundle probe** named in the task's
  Verification line. It needs a browser, and this session is headless by
  standing rule (no screen control, no browser automation) with port
  1420 owned by the human's live app. The substitute is stronger than a
  smoke check and is what the T-007 verifier used: `app/test/genesis-entry.test.tsx`
  drives the REAL App, the REAL store, the real docs-model and parser
  with only the IPC boundary mocked, through the whole flow (front door
  → empty board → rejected pick → genesis screen → docs landing →
  cancel). `npm run build` proves the same code bundles. The front-door
  visual judgment (light + dark) remains the @human item below.

### @human (listed, never performed here)

1. **Front-door visual judgment, light AND dark** — the two-button row
   and the "No plan in <folder>" card against the design's `open a
   folder` screen: button sizes/inks, the checklist's ○/✓ (the ✓ rides
   `--review-disc`, whose dark value #4ecf9e is a token-family
   derivation, not measured from a dark mockup), the card's 10px vs
   12px radius, and whether the footnote reads as a footnote.
2. **The genesis screen is deliberately bare** — confirm the placeholder
   is acceptable as an interim (T-027 fills it), and that leaving the
   header chrome above it is right.
3. **The real picker flows on the real screen** (the standing T-007
   checklist, extended): "Start an interview" → native dialog →
   choosing a docs-less folder lands on the genesis screen; ⌘N and ⌘O
   on the front door; "Start an interview here" on a folder the app just
   refused; choosing a folder that already has a plan → the board, not
   genesis.

### Suggestions filed

- `T-026-s1-plan-probe-path-casing.md` — the probe's exact-case match
  makes macOS and Linux disagree about "already has a plan"; decide the
  rule (feeds T-020's Linux lane).
- `T-026-s2-accelerator-ownership.md` — ⌘O/⌘N are front-door-local with
  macOS-shaped labels and no menu; decide who owns accelerators before
  T-027 wants keys.
- `T-026-s3-genesis-mode-is-session-only.md` — genesis intent does not
  survive a restart (the folder does); keep T-022 and T-029 from each
  inventing a persistence mechanism.

## Verdicts

2026-08-16 — claude-opus-5 @fresh, verifier — same-model review (the
builder was claude-opus-5 too; noted so the record is not read as an
independent-model check): **APPROVED**, with one CORRECTION to the notes
recorded below and four suggestions filed (s4–s7). Every EARS criterion
was re-derived from the branch, not read from the notes; the numbers
below are mine.

**Suites (macOS 15/Darwin 25.6, node 22.22.0, ADR-011 order, from the
branch worktree).** lib/parser `npm test` **159/159** and
`git diff main -- lib/parser | wc -c` = **0** (untouched is literal);
app `npx tsc --noEmit` clean, `npm run build` exit 0,
`npm test` **421 passed / 22 files**; src-tauri bare `cargo test`
**139 passed + 2 ignored, three consecutive runs, identical counts**;
`cargo build` exit 0. Every number in the notes reproduces.

**ACL zero-diff, re-derived independently (not read from the notes).**
`gen/schemas/` is gitignored, so I built BOTH ends myself: a detached
worktree at the branch point (3c16182) with its own `CARGO_TARGET_DIR`,
and then HEAD after `rm -rf gen/schemas && cargo clean -p nputer &&
cargo build` so the schemas were genuinely regenerated with both new
commands registered. sha256, identical across the pair:
`capabilities.json` `4fca70b5…6b07`, `acl-manifests.json` `d3eace19…9699`,
`desktop-schema.json` = `macOS-schema.json` `2a16f62c…3b07`.
`EXPECTED_GRANTS` byte-compared across revs: **identical, 7728 bytes,
129 grant lines** — the diff touches acl_pin.rs only at the roster
(536–537) and one comment. capabilities/, tauri.conf.json, Cargo.toml,
Cargo.lock, both package-locks: zero-diff. All five T-021 pin tests pass
by name on every run, unweakened.
*Precision note on what the roster proves*: I added a bogus
`totally_not_a_registered_command` to the same denial loop and the test
still passed — the loop's mock app registers only `docs_snapshot`, so it
proves "the shipped authority denies this name from a remote origin
before dispatch", which is name-agnostic. That is the real security
property and the notes claim exactly that (no overclaim); it is not, and
does not say it is, proof that the two commands are registered locally.

**C1 (front door + card).** Both affordances render on EVERY empty state
with the `⌘O · ⌘N` hint; the card is the design's "No plan in
&lt;folder&gt;" with heading path, body copy, the four-row checklist and
"Start an interview here". Adopt is ASSERTED absent (case-insensitive)
in two files. The DOM tests query rendered DOM, not component internals.
The accelerators are wired, and I proved it end-to-end rather than in
halves: a `⌘N` / `⌘O` keydown on the REAL App (real store, IPC mocked
at the boundary) produced `invoke("pick_genesis_folder")` and
`invoke("pick_project_folder")` — the labels are not decoration. The ○/✓
marks are measured: `planChecklist` reads the Rust `PlanProbe`, and I
re-derived the probe against the filesystem (below).

**C2 (zero-argument picker + genesis screen).** Both commands are
`async fn (app: tauri::AppHandle) -> PickOutcome` — no webview-supplied
path in either direction (ADR-012), and the handler roster is exactly
five commands, two of them new. Validation attacked four ways: a
symlinked root is refused at ARM time (and mutation-drilled: deleting
`arm_genesis`'s `is_plain_dir` gate turns
`a_genesis_root_swapped_for_a_symlink_is_refused_at_arm_time` red with
"a symlinked root must be refused"); a path that vanishes between
validate and arm answers `Error` with `project_dir()` unchanged; a FILE
where a directory is expected answers `Error`; a path that becomes a
symlink after validation is caught by that same arm-time gate, which is
why the gate is load-bearing rather than defensive. The genesis screen
renders full-bleed on the real App with `pane-rail` absent, and the rail
condition (`screen === "board"`) is byte-identical to the branch point,
so board|map is untouched for normal projects.

**C3 (docs/ appears → pipeline lights, no re-pick).** Re-derived that
the cargo test is driven from THIS task's flow and not a synthetic arm:
`docs_appearing_under_a_genesis_project_lights_the_pipeline_with_no_repick`
runs `apply_genesis_pick` against a REAL watcher thread from
`live_state`, writes a real `docs/NORTH_STAR.md`, asserts the emit
(project_dir included), then proves the re-armed watch stays live with a
second in-place edit. My own probe on a genesis-armed root saw the same
thing independently.

**C4 (exact counts — highest scrutiny).** The test drives T-018's real
`handle_fs_batch` seam with exact counts and no sleeps. Mutation drill
re-derived: removing `&& !just_armed` makes
`an_empty_docs_dir_emits_exactly_once_on_the_unarmed_to_armed_transition`
fail at "the arm transition must emit exactly once: Timeout". I then
attacked the boundary with my own sequence (probes reverted):

    re-arm genesis before docs/ exists   -> 0 emits
    empty docs/ appears                  -> exactly 1
    next batch                           -> 0
    arm_genesis again while docs/ exists -> 0 (routes to rearm, no double)
    docs/ deleted (was empty)            -> 0   <-- see s5
    docs/ recreated empty                -> exactly 1 (second arming)
    next batch                           -> 0
    docs/ replaced by a symlink          -> 0, and not armed

No sequence I could build double-emits on a second arm transition, and
an empty→empty re-arm is silent. The one gap runs the other way — a
deletion of an EMPTY docs/ is silent, so the board outlives the docs/ it
described. Criterion 4 opened that edge (before this task an empty docs/
produced no board to go stale); filed as **T-026-s5**, not a criterion
failure.

**C5 (a planned folder is never offered genesis).** `has_plan =
roadmap || tasks` gates `apply_genesis_folder`, and the routing is a
CALL to `open_as_project` (split out of `apply_picked_folder`), so the
Picked/NoDocs/Error shapes are identical by construction rather than by
imitation. Mutation drill re-derived: forcing `has_plan()` to false
turns `genesis_pick_of_a_folder_that_already_has_a_plan…` red with the
real `Genesis { … }` value. Edges attacked on this box: a docs/ holding
only `rejected/` → not a plan (correct); `docs/rejected/T-999-x.md` →
not a plan; `docs/tasks/README.txt` alone → not a plan; a DIRECTORY
named `notes.md` inside docs/tasks/ → counted as a plan (over-refuses
genesis — the safe direction); a symlinked `docs/` containing a real
ROADMAP → `NoDocs`, never genesis, nothing committed.

**s1's no-overwrite question, ruled.** s1 is REAL but it cannot produce
the dangerous answer. The probe's exact spelling AGREES with the parser
(`lib/parser/src/files.ts:122` and `project.ts:188` both key on the
literal `docs/ROADMAP.md`), so on a case-sensitive filesystem a
`docs/roadmap.md` is not a plan to the probe and not a plan to the
parser either — the two never disagree about what the app can see. On
this case-insensitive box I measured the opposite direction: lowercase
`docs/roadmap.md` probes `roadmap: true` and `docs/Tasks/T-1.md` probes
`tasks: true`, i.e. macOS OVER-detects and REFUSES genesis. So the
platform where a later `docs/ROADMAP.md` write would collide is exactly
the platform where the probe already blocks genesis; and ADR-017 leaves
the app writing nothing under docs/ regardless. s1 is a cross-platform
truthfulness divergence in the conservative direction, correctly filed
and correctly aimed at T-020's Linux lane — not a no-overwrite failure.

**C6 (cancel/failure leaves the previous project untouched).**
`reducePickOutcome` returns `prev` BY IDENTITY for `cancelled` and
`busy` (asserted with `toBe`), and the rejection cases keep
`next.docs === prev.docs`. Rust side: both failure shapes leave
`project_dir()` unchanged AND the previous project's watch still
emitting afterwards; the symlink arm gate keeps both the old docs handle
and the old root.

**Single-flight.** All three picker commands claim the same
`begin_pick()` CAS latch BEFORE any dialog opens, so genesis and a
normal pick cannot race and cannot stack native dialogs; I confirmed the
latch is exclusive and releases on drop. `start_genesis_here`'s
no-candidate early return drops the guard before returning, so a failed
"here" does not wedge the picker.

**Test-execution sweep** (this project has been bitten twice). Canary
injection, then revert: `panic!("VERIFIER-CANARY")` into all **10** new
cargo tests → all 10 red; `throw new Error("VERIFIER-CANARY")` into
every `it()` of the three touched frontend files (6 + 11 + 28 = **45**)
→ **45 failed (45)**. Nothing is inert. The executor's fourth drill
reproduces too: forcing `applyDocsPayload` back to `phase: "open"` turns
`genesis-entry` steps 5 and 6 red with "expected 'board' to be
'genesis'".

**Fence, proven.** `git diff 3c16182..HEAD` is 13 files. Zero-diff
verified for lib/, method/, app/src/genesis/ (T-024's territory — the
seam is a slot, not an edit), board/ and architecture/ components,
index.css, styles/tokens.css, capabilities/, tauri.conf.json,
Cargo.toml, Cargo.lock and both package-locks.

**Tokens-only.** Zero hits over the added frontend lines for arbitrary
values, `[prop:value]`, `bg-(--x)`/`text-(--x)`, stock-palette utilities
and raw hex; the built stylesheet contains no arbitrary-value class at
all, and every utility the diff introduces emits a real token-backed
rule (`.gap-2\.25{gap:calc(var(--spacing-unit) * 2.25)}`,
`.text-review-disc{color:var(--review-disc)}`,
`.py-2\.75`, `.max-w-120`, `tracking-overline`).

**Security sweep.** Diff confined to app-shell + docs; two new commands,
both zero-argument, no other IPC added (three `invoke` call sites total,
one of them the shared `runPicker`); no new dependency and no lockfile
movement; no `unsafe`, no `Command::`/`std::process`, no shell strings;
no `innerHTML`/`dangerouslySetInnerHTML`/`eval`/`fetch`/`WebSocket`/
`localStorage`; the only file-derived strings crossing the boundary are
the canonical path the user chose and four booleans. Hostile folder
names (`--force-delete`, `..dotdot`, an ANSI-escape name, a DEL
character, 255 chars) all validate, commit, and stay contained; they
render as React text nodes. Nothing bound or contacted port 1420 at any
point. The genesis screen is unreachable for a folder with a plan (C5,
drilled). One pre-existing pattern carried forward, not introduced:
`println!` of `canon.display()` is unsanitized, exactly as
`apply_picked_folder` has done since T-007 — `sanitize_for_log` is
applied only to the echo payload. Not a T-026 regression.

**CORRECTION to the notes.** The Frontend paragraph states of the
genesis switch: "no snapshot exists to send". That is true for a
docs-less folder and FALSE for the other shape `apply_genesis_folder`
accepts — a folder with a plain `docs/` that holds no plan (a lone
`docs/ARCHITECTURE.md`, a `docs/decisions/` tree), which the task's own
probe test declares genesis-eligible. For that shape `arm_genesis`
delegates to `rearm`, nothing emits until the next fs event, and the
genesis screen renders "docs/ · nothing written yet" over a docs/ that
is not empty — two clicks after the card truthfully showed
`✓ docs/ARCHITECTURE.md`. Reproduced on both sides (Rust: `Genesis` and
zero emits in a 1.2s window, then 2 files on the first real edit;
frontend: `data-genesis-files="0"`). It self-heals on the first write
and lives outside every criterion's antecedent — criterion 2's WHEN is
"a folder without docs/" — so it does not fail a SHALL, but it is the
T-018-s4 shape one screen over and it also blunts the T-024 seam this
task documents. Filed as **T-026-s4** with two candidate fixes.

**Suggestions assessed.** s1 real, correctly encoded, ruled above — keep
as a decision, not a hot-patch. s2 real and honest (the ⌘O advertised on
the front door genuinely stops working once a board opens; the ⌘ label
over a Ctrl-accepting handler is a small standing lie) — right scope,
correctly non-blocking. s3 real and well-aimed: it exists to stop T-022
and T-029 each inventing a persistence mechanism, and its "a genesis
project that only exists in RAM cannot lie about a stale session" is
sound. New: **s4** (genesis screen blind to an existing docs/),
**s5** (empty-docs deletion is silent), **s6** (a genesis switch DOES
send a `model-updated` echo with `generatedAtMs: 0`, contradicting two
code comments that say it never fakes one — reproduced), **s7** (the
served-bundle probes belong in T-020's lane).

**The served-bundle probe — RULED: acceptable, honestly-recorded
deferral.** The stated reason (headless standing rule; 1420 owned by the
human's live app) holds, and `genesis-entry.test.tsx` is a real
substitute — it drives the real App, real store, real docs-model and
parser with only the IPC boundary mocked. It was in fact
over-determined: the dev harness exposes only
`__nputerDocsHarness = { apply, getState }`, and `apply` always lands on
phase `"open"`, so **neither front-door state is reachable from a served
bundle at all** — a browser would not have sufficed. T-020's lane
(merged after this branch point: `tools/e2e`, Playwright, own vite on
14520, config that throws on 1420) is the obvious home, and it
discharges T-024-s1 in the same addition now that T-026 has mounted the
pane — but it needs a small DEV-only shell harness first. Proposed in
**T-026-s7**; deliberately not built here.

**Graph forecast confirmed for the integrator** (regenerated with
`NPUTER_UPDATE_GOLDEN=1`, then restored to the committed bytes; tree
clean). files **78 → 80** — adds `app/src/components/shell/GenesisScreen.tsx`
and `app/test/genesis-entry.test.tsx`, nothing removed; content-changed:
App.tsx, watcher-store.ts, project-shell.test.tsx, watcher-store.test.ts;
stats symbols **449 → 475**, edges **790 → 828**; languages still
`["ts"]`, zero `.rs` files indexed. EXACTLY three assertions move, as
forecast: `architecture-dogfood.test.ts:175` `toBe(78)` → `80`, the
relation row `["C-05","C-10","confirmed",10]` → `13` at :267, and
`map-dogfood-render.test.tsx:167` `committed graph · 78 files` → `80`.
Every other dogfood assertion passes against the regenerated graph
untouched. The ignored `self_graph_is_current` is red on-branch exactly
as the notes forecast.

Notes' file:line references spot-checked and accurate (docs_watch.rs
344/735/969/1056/1067/1218, lib.rs 156/204, App.tsx 91/124/290,
watcher-store.ts 194/204/223/229/238/291, acl_pin.rs 528/536/537).

**@human (listed, never performed here — headless session):**
1. Front-door visual judgment, light AND dark, against the design's
   `open a folder` screen: button sizes/inks, the checklist ○/✓ (the ✓
   rides `--review-disc`, whose dark value is a token-family derivation,
   not measured from a dark mockup), the card's 10px vs 12px radius, and
   whether the footnote reads as a footnote.
2. Whether the deliberately bare genesis placeholder is acceptable as an
   interim, and whether keeping the header chrome above it is right.
3. The real picker flows on the real screen: "Start an interview" →
   native dialog → a docs-less folder lands on the genesis screen; ⌘N
   and ⌘O on the front door; "Start an interview here" on a folder the
   app just refused; a folder that already has a plan → the board.
4. New, from s4: point the app at a folder whose `docs/` holds files but
   no plan (a lone ARCHITECTURE.md) and confirm the "nothing written
   yet" line is what you want to see there in the interim.

All probes reverted; working tree clean apart from this verdict and the
four new suggestion files.
