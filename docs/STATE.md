# State

Updated: 2026-08-16 by integrator (T-026 merge), claude-opus-5 @fresh

## Just completed
T-026 (genesis entry, M, app-shell) done and merged — built by
`claude-opus-5 @fresh`, verified by `claude-opus-5 @fresh`,
`review: same-model`, **APPROVED first-pass** with no rejection round.
**MILESTONE 3'S FIRST SLICE IS CLOSED**: T-023 (kit) → T-024 (lens) →
T-026 (entry) are all through the pipeline. Hand-driven genesis is now
a thing you can reach from a running app.

WHAT SHIPPED. The front door has **two affordances** — "Open a folder…"
and "Start an interview" — on EVERY empty state, with the `⌘O · ⌘N`
hint, and the accelerators are real: the verifier drove ⌘N and ⌘O as
keydowns on the REAL App (real store, IPC mocked only at the boundary)
and saw `invoke("pick_genesis_folder")` and
`invoke("pick_project_folder")` come out. The old "no docs/ found"
rejection state IS the design's **"No plan in &lt;folder&gt;" card**
now: heading path, body copy, a four-row checklist whose ○/✓ marks are
**MEASURED** (`PlanProbe` stats `docs/ROADMAP.md`, `docs/tasks/*.md`,
`docs/ARCHITECTURE.md`, `.git` and sends four booleans — no names, no
contents cross the boundary), a "Start an interview here" button, and
**Adopt deliberately ABSENT**, asserted absent case-insensitively in
two suites. Genesis opens through **two zero-argument commands**
(`pick_genesis_folder`, `start_genesis_here` — the ADR-012 pattern
command-for-command with `pick_project_folder`; the native dialog opens
Rust-side and no path crosses IPC in either direction), with the T-003
validation family intact at the root (canonicalize → plain-directory
gate at pick time AND again at arm time, which is what refuses a root
swapped for a symlink inside the validate→arm window). The new
`genesis` screen renders **full-bleed with no rail** — the rail
condition (`screen === "board"`) is byte-identical to the branch point,
so board|map is untouched for normal projects. T-018's sentinel lights
the pipeline **with no re-pick**, exercised against a REAL watcher
thread armed by this task's own genesis pick. A folder that already
holds a plan is never offered genesis — the routing is a CALL to
`open_as_project` split out of `apply_picked_folder`, so the
Picked/NoDocs/Error shapes are identical by construction rather than by
imitation. App suite +23 (11 DOM front-door, 6 end-to-end genesis, 6
store/checklist/reducer), 432 → 455; cargo +10, 129 → 139.

**THE FOLDED T-018-s4 CRITERION** (criterion 4) is the sharpest part.
An empty `docs/` is byte-for-byte the empty baseline, which is why
T-018 sided with suppression and left the front door claiming "no docs/
found" over a directory sitting right there. `ensure_docs_watch` now
returns whether it performed the (unarmed → armed) transition
(`#[must_use]`, true ONLY on that transition's success) and
`handle_fs_batch` emits on it even when the outcome equals the
baseline. The verifier ran an **8-step boundary sequence** against the
real `handle_fs_batch` seam with exact counts and no sleeps: re-arm
before docs/ exists → 0 · empty docs/ appears → exactly 1 · next batch
→ 0 · arm again while docs/ exists → 0 (routes to `rearm`, no double) ·
docs/ deleted → 0 · docs/ recreated empty → exactly 1 (second arming) ·
next batch → 0 · docs/ replaced by a symlink → 0 and not armed. No
sequence double-emits; the suppression invariant is untouched for every
other batch. The mutation drill is load-bearing: removing
`&& !just_armed` turns the test red at "the arm transition must emit
exactly once".

**ACL, stated plainly.** Two new app commands, **ZERO new grants**.
`gen/schemas/` is gitignored, so the verifier rebuilt **BOTH ENDS
independently** rather than reading the notes: a detached worktree at
the branch point with its own `CARGO_TARGET_DIR`, and HEAD after
`rm -rf gen/schemas && cargo clean -p nputer && cargo build` so the
schemas were genuinely regenerated with both commands registered. All
four schema artifacts hash identical across the pair
(`capabilities.json` `4fca70b5…6b07`, `acl-manifests.json`
`d3eace19…9699`, `desktop-schema.json` = `macOS-schema.json`
`2a16f62c…3b07`), and `EXPECTED_GRANTS` is **byte-identical, 7728
bytes, 129 grant lines**. T-021's alarm held while the IPC surface
grew, which is exactly what it was built for. The acl_pin roster gained
the two names inside the remote-origin denial loop — and the verifier
was precise about what that proves: adding a bogus
`totally_not_a_registered_command` to the same loop ALSO passes,
because the loop's mock app registers only `docs_snapshot`. So it
proves "the shipped authority denies this name from a remote origin
before dispatch", which is name-agnostic and is the real security
property. It is not proof of local registration, and the notes do not
claim it is.

**THE VERIFIER'S CORRECTION, kept.** The notes say of the genesis
switch "no snapshot exists to send". That is true for a docs-less
folder and **FALSE** for the other shape `apply_genesis_folder`
accepts — a folder whose `docs/` holds files but no plan (a lone
`docs/ARCHITECTURE.md`, a `docs/decisions/` tree), which the task's own
probe test declares genesis-eligible. There `arm_genesis` delegates to
`rearm`, nothing emits until the next fs event, and the genesis screen
reads **"docs/ · nothing written yet" over a non-empty docs/** — two
clicks after the card truthfully showed `✓ docs/ARCHITECTURE.md`.
Reproduced on both sides. It self-heals on the first write and breaks
no SHALL (criterion 2's antecedent is a folder WITHOUT docs/), so it is
not a criterion failure. Filed as **T-026-s4** with two candidate
fixes, and it is on the @human list below.

**INTEGRATOR CORRECTION — READ THIS BEFORE THE VISUAL SESSION.
T-024's pane is STILL NOT MOUNTED.** T-026 mounts the genesis
**SCREEN**; it does not mount the **LENS**. `GenesisScreen.tsx` is a
deliberate placeholder whose marked region
(`data-testid="genesis-pane-slot"`) renders one honest live line —
`docs/ · N files written` / `nothing written yet` — and nothing on main
imports `app/src/genesis/**`. I verified this three ways rather than
inferring it: `grep` finds no src-side import of the genesis directory;
the regenerated graph shows no C-05→C-13 file edge from
`GenesisScreen.tsx` (D1:C-05→C-13 still carries exactly its two T-024
test-suite edges); and the built bundle is missing GenesisPane's own
strings ("the project, so far", `genesis-artifact` — ABSENT, while
`genesis-screen` and `genesis-pane-slot` are PRESENT). **T-024's
boundary paragraph from the last checkpoint still stands: its code is
absent from the shipped JS, Rollup still drops it.** This is not a
T-026 defect — the two branches ran in parallel from a common base that
predates `app/src/genesis/`, the task file's own seam section says so
explicitly, and the verifier confirmed the zero-diff fence. But it does
mean the mount is a **one-import-plus-one-element** job that is
possible for the first time only now that both halves sit on main
together, and it is **NOBODY'S TASK YET** — T-027 fills the screen and
would do it in passing. Integrator observation for the next triage; I
did not patch it at the merge. Two consequences: **T-024's visual pass
is still BLOCKED** (corrected below), and **T-024-s1's served-bundle
probe still has no route to the pane** — the verifier's aside that the
E2E probe "discharges T-024-s1 now that T-026 has mounted the pane" is
imprecise on exactly this point.

SUITES ON MERGED MAIN, all four re-derived here first-hand, fresh
installs, ADR-011 order, and all four re-run green AFTER this
checkpoint's docs edits (the T-024 live-tree lesson applied to my own
commit): lib/parser `npm ci` + `npm test` **159/159 (10 files)**,
`npx tsc --noEmit` clean, `npm run build` clean · app `npm install` +
`npm run build` exit 0 + `npm test` **455/455 (24 files)** — 432 + 23,
the forecast landing exactly · app/src-tauri bare `cargo test` **139
passed + 2 ignored, three consecutive runs, identical counts** (the
T-021 determinism bar, applied because this touches concurrency-adjacent
code) · tools/e2e `npm ci` + `npx playwright test` **17/17 in 5.0s**,
headless, one worker, its OWN vite on 14520. Nothing ever bound or
contacted 1420; no server left running.

STANDING INTEGRATOR PRACTICE (T-009-s1, the ratified CONVENTIONS
interim regen rule; retires when T-014's `nputer index --check` becomes
the gate) — **ELEVENTH** exercise. It FIRED (the branch adds `.tsx`
outside docs/) and it moved real numbers: the graph goes **82 → 84
files, 513 → 539 symbols, 871 → 909 edges**, 333,934 bytes, sha256
`ca146f89f976453645f037b6016ab9eef896a6d0f22577cd6cc95a460dfc056d` —
byte-identical across three runs (golden regen → plain ignored
self-check → second golden regen), and the plain self-check PASSES, so
the committed graph is current. Still `languages: ["ts"]`, still ZERO
`tools/` paths, still zero `.rs` files indexed (Rust extraction is
T-010's). The ceaa949 ordering lesson held an eighth time: the fixture
edits landed BEFORE the final regen and they moved the graph (the two
suites' own hash/loc), so a regen-first ordering would have committed a
stale file.

THE REGEN DELTA, DERIVED HERE — and note where the branch's forecast
does not apply. The builder and verifier both measured against the
branch's own base, which PREDATES T-024's merge, so their absolute
numbers (78 → 80 files, 449 → 475 symbols, 790 → 828 edges, C-05→C-10
10 → 13) are stale on merged main. Their **deltas** reproduce exactly:
+2 files, +26 symbols, +38 edges, +3 on that one row. My own
measurement, from the enumerated added/removed edge sets with every new
file edge classified by component pair:
- files 82 → 84: adds `app/src/components/shell/GenesisScreen.tsx`
  (C-05's shell glob) and `app/test/genesis-entry.test.tsx` (the
  app/test umbrella); nothing removed. Content-changed, hash/loc only:
  App.tsx 311→428, watcher-store.ts 382→560, project-shell.test.tsx
  127→215, watcher-store.test.ts 242→375.
- 43 edges added, 5 removed. The five removals are watcher-store
  INTERNAL call/type_ref edges the picker refactor retired
  (`applyDocsPayload` now reaches `buildEcho` through `sendEcho`,
  `pickProjectFolder` through the shared `runPicker`, and
  `selectScreen`'s `noDocsMessage` is gone) — no cross-component edge
  was lost.
- mapping 82 → 84; **C-05 33 → 35**, every other component's count
  holds (C-06 21 / C-08 10 / C-09 3 / C-10 2 / C-12 11 / C-13 2). D2
  still empty, no unmapped node.
- **findings BYTE-UNCHANGED** — all five D1 rows and both remaining D3s
  hold exactly. **The T-024 umbrella surprise did NOT recur**, and I
  checked it rather than assuming: `genesis-entry.test.tsx` imports
  App.tsx (C-05), docs-model and watcher-store (C-10, an already
  confirmed pair) and three packages, and it does NOT reach into
  `app/src/genesis/` — so no new component pair appears and
  D1:C-05→C-13 keeps its two file edges.
- relation table: same 26 rows, same **13 confirmed / 5 undeclared / 8
  planned** tally. Exactly ONE observedCount moves — **C-05→C-10
  13 → 16**, the three new file edges being GenesisScreen.tsx →
  docs-model (the first shell-side src edge from this component),
  genesis-entry.test.tsx → docs-model, and genesis-entry.test.tsx →
  watcher-store. All three in the DECLARED direction.

FIXTURES RECONCILED, AND THE ONE DELIBERATELY NOT TOUCHED.
`app/test/architecture-dogfood.test.ts` (dated addendum enumerating
every delta above; test name and `toBe(82)` → 84; mapping `["C-05",33]`
→ 35; the relation row → 16) and
`app/test/map-dogfood-render.test.tsx` (index hint `committed graph ·
82 files` → 84) were reconciled — changed, never loosened; the moved
numbers are pinned by the same whole-array `toEqual` they were before.
**`lib/parser/test/smoke.test.ts` was deliberately left alone**: it
pins the component REGISTRY read from `docs/architecture/components/`,
never the graph, and T-026 declares NO new component. Touching it would
mirror the error that got T-024 rejected in the opposite direction —
that rejection was for MISSING a registry pin when a component WAS
declared; the discipline is the same either way, which is that the
inventory is per-artifact, not per-regen. (T-024-s5 exists to write
that inventory down.)

INTEGRATOR JUDGMENT CALLS, recorded. **ARCHITECTURE: three edits, all
truth-fixes, no new table row.** C-05's status cell said C-13's lens
"has code since T-024 but no mount until T-026" — now false in BOTH
directions, so it reads that T-026 landed the front door and the
full-bleed `genesis` screen while C-13's lens is still an unmounted
slot inside it. The "Code layout" bullet carried the same claim
(`app/src/genesis/**` "code-complete and unmounted until T-026") and
now says what is actually true: T-026 mounted the SCREEN, the lens is
still a slot, nothing on main imports the directory and Rollup still
drops it. The Interfaces "Genesis:" line gained the entry contract —
two zero-argument commands, dialog Rust-side, no path across IPC, and a
folder that already holds a plan routed to the ordinary open so no
overwrite path exists by construction. No new component row: C-05's
children (C-08…C-13) live in docs/architecture/components/ and the
slug-map line, and GenesisScreen.tsx is plain C-05 shell code, not a
new component. **ROADMAP: earned its first mid-milestone entry.**
Milestone 3's card already named the first slice T-023+T-024+T-026;
that slice is now COMPLETE, and the T-024 integrator explicitly parked
the note for this merge. It reads: FIRST SLICE COMPLETE 2026-08-16 —
T-023 → T-024 → T-026 all through the pipeline; the front door offers
an interview, a docs-less folder opens as a genesis project, and the
first `mkdir docs` lights the pipeline into the lens; hand-driven
genesis now renders live, with no agent in the loop yet; T-025, T-027,
T-028, T-029 remain. The milestone itself is NOT claimed.
**NO new ADR** (three-prong): T-026 implements ADR-017's already-settled
genesis architecture (planner writes, app is a lens) and ADR-012's IPC
pattern, extending it to two more zero-argument commands rather than
bending it — `EXPECTED_GRANTS` is byte-identical, which is the
mechanical proof; nothing here contradicts any ADR (ADR-011 untouched,
no new package, no lockfile movement); and the task's durable calls —
the two-command rationale with its security analysis, the plan-probe
predicate, the design table with its six disclosed deviations, the
T-024 seam contract, and `ArmGenesis`'s hard-requirement ordering — are
recorded in the task file's implementation notes and the verdict.

## In progress / broken right now
Nothing in flight. The t026 worktree is removed; its branch is KEPT
alongside t023/t024/t036. Main tree clean, all four suites green.

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
Green there CLOSES that evidence gap; red there is a real reconcile gap
macOS could never surface, and gets filed immediately. This run is also
the gate that closes T-001/T-003's Linux halves, and it now carries
T-026-s1 (the plan probe's exact-case match makes macOS and Linux
disagree about "already has a plan" — ruled safe, see below, but the
Linux lane is where the divergence becomes visible).

## Next up (1–4)
1. **@human — THE VISUAL SESSION IS OPEN.** This checkpoint is what you
   said you were waiting for. Consolidated, in one sitting:
   - **T-026's front door, light AND dark** (NEW, and the point of the
     session): the two-button row and the "No plan in &lt;folder&gt;"
     card against the design's `open a folder` screen — button
     sizes/inks, the checklist ○/✓ (the ✓ rides `--review-disc`, whose
     dark value #4ecf9e is a token-family derivation, not measured from
     a dark mockup), the card's 10px vs the design's 12px radius, and
     whether the footnote reads as a footnote.
   - **Is the bare genesis placeholder acceptable as an interim?** And
     is keeping the header chrome above it right? (T-027 fills it.)
   - **The real picker flows on the real screen** — the standing T-007
     checklist, extended and still @human because native dialogs are
     unreachable from a browser harness and tauri-driver has no macOS:
     "Start an interview" → native dialog → a docs-less folder lands on
     the genesis screen; ⌘N and ⌘O on the front door; "Start an
     interview here" on a folder the app just refused; a folder that
     already has a plan → the board, not genesis.
   - **s4's question**: point the app at a folder whose `docs/` holds
     files but no plan (a lone ARCHITECTURE.md) and say whether
     "docs/ · nothing written yet" over a non-empty docs/ is what you
     want to see in the interim.
   - **The at-a-glance amber judgment** (T-012 criterion 5's human
     half — drift stroke vs building/verifying fills, BOTH schemes,
     incl. composed building+drift; the dogfood hero renders it live
     and shows C-05 at `drift 3`).
   - **The launch-shot re-judgment** (T-006's pending screenshot
     predates the rail — light + dark now include it).
   - **The T-023 dry-run conversational quality judgment** (did the two
     "pushing back:" challenges actually challenge; the founder was
     builder-scripted in-session, so true cold-context evidence still
     arrives with T-029).
   - **A Linux run** — this is the "watch the first CI run" item above.
   - **T-024's pane, light + dark: STILL BLOCKED, correcting the
     expectation this session was scheduled on.** T-026 mounted the
     genesis SCREEN, not the LENS — nothing imports `app/src/genesis/`
     and the pane is still absent from the shipped JS (proof in "Just
     completed"). There is still no route to it in a running app. The
     mount is now a one-import-plus-one-element change and both halves
     finally sit on main together; it needs a ruling on WHO does it —
     T-027 in passing, or a small dedicated card ahead of it. Until
     then this item stays parked and the dark-mode questions it carries
     (built/forming/slot card contrast, the warm writing-row border,
     the five type sizes that moved 0.5–1px, the substituted footer
     right slot `stage ~4 · constraints`) go with it.
2. MILESTONE 3 (T-023…T-029, ADR-017) — **first slice T-023+T-024+T-026
   COMPLETE**. Human-ruled queue for the app-shell lane is now
   **T-025 → T-022**. **T-025 (agent runner, L, app-agent + app-shell)
   is UNBLOCKED**: its `blocked_by` is [T-021 ✓, T-023 ✓, T-026 ✓] and
   its full planning pass is already applied, so it is dispatch-ready.
   T-026 landed all three things T-025's §4/§10 named: the `genesis`
   screen state, the docs-less open path (`apply_genesis_folder` +
   `WatchCtl::ArmGenesis`), and the plan-eligibility predicate
   (`docs_watch::probe_plan` / `PlanProbe::has_plan`, `pub` and
   importable for its Rust-side re-check); `lib.rs` command
   registration is one list T-025 appends to, no structural change
   waiting. T-027 (L, planning pass at dispatch) dispatches when
   T-024 ✓ + T-025 + T-026 ✓ all merge — i.e. it waits only on T-025;
   T-028/T-029 behind it.
3. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16 night): app-shell lane
   queue was T-021 → T-026 → T-025 → T-022; T-021 and T-026 are now
   DONE, so **T-025 holds that lane**. Milestone 3 runs through T-029
   as blockers clear. Triage: APPLY granted — but tasks NEWLY created
   by triage do NOT dispatch without the human. Unchanged method rules:
   a second REJECTED on any task parks that lane for the human;
   @human judgments are never self-answered.
4. Suggestion backlog for the NEXT TRIAGE — **seventeen** to
   disposition, plus three parked in place; none dispatched. Carried
   over: T-021-s1 (the ACL pin's EXPECTED_GRANTS is macOS-derived; the
   first CI run FEEDS this) · T-021-s2 (genericize the AppHandle-taking
   commands over `R: Runtime` — T-026's two new commands join that
   list) · T-021-s3 (pin the panic-path latch release) · T-020-s3 (the
   boot check cannot run while the human's app holds 1420) · T-020-s5
   (the token lint's P1 pattern fires on dash-prefixed arbitrary
   VARIANTS and on regex literals) · T-020-s6 (the parity spec mirrors
   CONVENTIONS in a hard-coded array instead of parsing it) ·
   T-024-s1 (**still open, and its premise moved**: the served-bundle
   probe was to land "with T-026's mount", but the pane is still
   unmounted — see the correction above) · T-024-s3 (a render-phase ref
   write stamps the change log; wants an architect ruling) · T-024-s4
   (the north-star title is the pane's one unbounded text surface;
   belongs with T-031) · T-024-s5 (write down the registry-pin
   inventory so "declaring a component moves THREE fixtures" stops
   being folklore) · T-024-s6 (compound cross-model `built_by` stamps
   parse to a FALSE `policy: "resume"` and a ~50-char model badge with
   no truncate; belongs to T-030. It renders on T-024's card now —
   cosmetic, expected, and do NOT "fix" it by making the record less
   honest about who built what). **T-024-s2 is DISCHARGED** by T-024's
   own merge (C-13's D3 cleared at that regen) — the triage should
   resolve it, not schedule it. Parked in place: T-008-s1 (awaits
   F-04/F-05 layout decisions), T-018-s1 (awaits a Windows lane),
   T-003-s2 (already encoded).
   NEW FROM T-026, all seven filed by the builder (s1–s3) and verifier
   (s4–s7): **T-026-s1** (the plan probe's exact-case match makes macOS
   and Linux disagree about "already has a plan" — RULED by the
   verifier as safe: the probe's spelling AGREES with the parser
   (`files.ts:122`, `project.ts:188` both key on literal
   `docs/ROADMAP.md`), so on a case-sensitive box the two never
   disagree about what the app can see, and on macOS the probe
   OVER-detects and REFUSES genesis — the conservative direction. It is
   a cross-platform truthfulness divergence wanting a decision, not a
   no-overwrite failure; feeds T-020's Linux lane) · **T-026-s2**
   (⌘O/⌘N are front-door-local with macOS-shaped labels and no menu;
   the advertised ⌘O genuinely stops working once a board opens —
   decide who owns accelerators before T-027 wants keys) ·
   **T-026-s3** (genesis intent does not survive a restart, though the
   folder does — filed to stop T-022 and T-029 each inventing a
   persistence mechanism) · **T-026-s4** (the genesis screen is blind
   to an existing docs/ — the notes' correction above; on the @human
   list) · **T-026-s5** (deleting an EMPTY docs/ is silent, so the
   board outlives the docs/ it described — an edge criterion 4 itself
   opened, since before this task an empty docs/ produced no board to
   go stale) · **T-026-s6** (a genesis switch DOES send a
   `model-updated` echo with `generatedAtMs: 0`, contradicting two code
   comments that say it never fakes one — reproduced) · **T-026-s7**
   (the deferred served-bundle probes belong in T-020's E2E lane, which
   needs a small DEV-only shell harness first — the dev harness today
   exposes only `__nputerDocsHarness = { apply, getState }` and `apply`
   always lands on phase `"open"`, so NEITHER front-door state is
   reachable from a served bundle at all; a browser would not have
   sufficed, which is why the deferral was ruled acceptable rather than
   excused. **It was expected to discharge T-024-s1 in the same
   addition — it cannot yet**, because that probe needs the pane
   mounted and it is not).
   INTEGRATOR OBSERVATIONS for the same triage, both carried forward
   and both GREW: (a) **the unmounted lens** — the one-line mount is
   now possible and belongs to nobody; rule on it (see "Just
   completed"). (b) **sixteen** open suggestion files carry no `id:`
   field — nine at the last checkpoint plus all seven of T-026's
   (verified by grep at this merge, not assumed). The T-016 encoding
   requires an id at parking and the parser accepts the omission
   silently, which is why it keeps recurring. Worth a rule, not a
   fourth observation — same family as T-030's parser-strictness pass.

## Open questions
None.
