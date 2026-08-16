# State

Updated: 2026-08-16 by integrator (T-049 merge), claude-opus-5 @fresh

## Just completed
T-049 (a way in from anywhere — the accelerators leave the front door,
and genesis gets a door, S, app-shell, F-03) done and merged — built by
`claude-opus-5 @fresh`, verified by `claude-opus-5 @fresh`,
`review: same-model`, **APPROVED first pass**. **@human reported this
one themselves** — "command + o and command + n are not working in
nputer" — and it is now closed.

**WHAT SHIPPED, three edits and one new module.**

    app/src/components/shell/accelerators.ts        (NEW, 129 lines)
      matchAccelerator(chord) -> "openFolder" | "startInterview" | null
      useAccelerators(table)  -> ONE window keydown listener

    app/src/App.tsx
      useAccelerators({...}) mounted at the ROOT (line 268)
      the EmptyState useEffect DELETED
      the board header: [Open folder…] [Start an interview]

The defect was never the keys. `useEffect`'s
`window.addEventListener("keydown", …)` lived INSIDE `EmptyState`, so
it registered when the front door mounted and unregistered when it
left; with a project open the board renders instead and the chords
reached nothing. T-026 pinned that scoping DELIBERATELY, because its
criterion said the affordances appear "on EVERY empty state". Built to
spec; the spec was narrower than the app needs. The second half was
sharper and had no shortcut at all: **there was no way to start an
interview from an open project** — reaching genesis meant Open folder…
→ a folder with no `docs/` → the no-plan card → "Start an interview
here", four steps to the thing milestone 3 is named after, the first of
which was a picker whose own shortcut did not work from where you were.

**THE TWO MEASUREMENTS THAT MAKE IT TRUSTWORTHY.** Both were built from
scratch by the verifier, not re-read off the notes.

**(a) THE DOUBLE-LISTENER MEASUREMENT — why the suite counts CLAIMS and
not INVOKES.** With two registrations, one ⌘O yields **`preventDefault`
×2 but `invoke("pick_project_folder")` ×1**. The mechanism is
`runPicker`'s first two lines: `if (!isTauri || shell.picking) return;`
then a SYNCHRONOUS `setShell({ picking: true })` *before* the `await
invoke(...)` — so the second listener, firing in the same dispatch,
finds the latch already closed and the duplicate never reaches IPC.
**A naive "invoked once" test would have passed over two racing
listeners.** That is the whole reason `accelerators.test.tsx`'s
`chord()` helper returns a `preventDefault` COUNT and every accelerator
assertion in the file requires exactly 1. Confirmed downstream: a second
`useAccelerators` in `App` reds **11 of 12** tests, first failure `⌘O is
claimed by exactly one handler: expected 2 to be 1`.

**(b) SIX DEFEAT ATTEMPTS, FOUR CAUGHT — and the two instruments proved
INDEPENDENT rather than two readings of one.** Each was a real second
handler injected into `App`:

| attack | caught by |
|---|---|
| raw `window` keydown, preventDefault + command | both — 11 red |
| the same on `document` | both — 11 red |
| `window` listener that runs the command but never `preventDefault`s | **the ENUMERATION alone** — 2 red |
| `document.body` listener (outside the enumeration's scope) WITH preventDefault | **the per-chord CLAIM COUNT alone** — 11 red |

The third and fourth rows are the point: each instrument catches what
the other cannot, in opposite directions, so they are genuinely
independent. Two survived and both are narrow: a `window.onkeydown`
PROPERTY handler (invisible to the enumeration by construction; in jsdom
it never fires at all, so the miss cannot even be demonstrated) and a
`document.body` listener that runs a command WITHOUT claiming the chord
(seen by neither). **Neither is reachable from anything in the tree** —
every keydown listener in `app/src` goes through `addEventListener` on
`window` or `document` (`accelerators.ts`, `panel-dismissal.ts`,
`MapView.tsx`'s ⌘F) — and both are filed rather than papered over.

**THE HONEST CORRECTION THE VERIFIER MADE TO THE NOTES, and it must be
carried.** The replaced T-026 test — `"stops listening once the front
door is gone"` → `"owns no window listener of its own"` — was
**CORRECTLY retired**: a component that never listens cannot stop
listening, so left as written it would have been **green forever**,
which is the silent-green outcome nobody wants. **But the notes
overstate the case as "could not have been kept meaningfully."** It
could: re-pointed at `project-shell.test.tsx`'s own new
`FrontDoorWithAccelerators` wrapper, it would mount the PRODUCTION hook,
unmount it, press ⌘O and assert nothing fires — pinning the HOOK's
unmount cleanup rather than the component's. Measured: deleting
`return () => window.removeEventListener(...)` from `accelerators.ts`
leaves the app suite at **503/503 green**. That property is now pinned
nowhere. Filed as **T-049-s3** with three siblings — four advertised
mechanism properties, each deletable with the suite green:

1. the unmount cleanup (above);
2. **"an absent entry is left completely alone"** — move
   `preventDefault()` ABOVE the `if (run === undefined) return;` →
   green. Unobservable today because `App` always supplies both
   entries; the moment T-027 hands a screen a PARTIAL table it is the
   difference between declining a chord and silently swallowing a key;
3. **the table is re-read every render** — delete the `latest.current =
   table` refresh → green. The card's whole argument that T-027's
   absorption is "a change of ARGUMENT, not of mechanism" rests on it;
4. **"added once, removed once"** — change the effect's deps from `[]`
   to `[table]` → green. Still exactly one listener at any instant, so
   the enumeration cannot see it.

None is a T-049 defect (every criterion is about observable behaviour
and every one is met and drilled). They are the seam between "the
accelerators work" and "the accelerator MODULE is safe for T-027 to
extend", and T-049 is the task that created the module. (1) and (2) are
the two that would bite.

**THE LISTENER'S HOME WAS CHOSEN BY MEASUREMENT, NOT BY TASTE — and the
verifier found the measurement UNDERSTATED.** At
`app/src/lib/accelerators.ts` the regen produces a `D2:unmapped`
finding naming the file (that directory's files are claimed one by one
by three different components, so a new one is claimed by nobody) and
moves **SEVEN** fixture assertions — findings 8→9, relation table 28→29
rows, drift flags 6→7, the map's component count 11→12 (**the unmapped
bucket `architecture-dogfood.test.ts` asserts cannot exist**), the map's
edge table, plus the two file counts. At
`app/src/components/shell/accelerators.ts` it is **THREE**, the ordinary
regen shape, and costs no architecture edit — that path is already
C-05's declared territory (`C-05-app.md:14`). The precedent is exact:
`app/src/components/board/panel-dismissal.ts` is the same shape, a
listener-wiring module living beside the components it serves.

**T-049-s4 — TWO REAL LIMITS, INHERITED AND KEPT DELIBERATELY.**
`matchAccelerator` decides on `event.key.toLowerCase()`, and `event.key`
is the CHARACTER the layout produces, not the physical key: **measured,
⌘+`щ` and ⌘+`т` reach nothing** where ⌘O and ⌘N would, so the chords are
silently dead on every non-Latin layout (Russian, Greek, Hebrew, Arabic,
Thai) and on Latin remaps that move the letters — with the front door
still advertising `⌘O · ⌘N` and nothing on screen to explain it. Second:
an `isComposing` keydown is still claimed. **Both are T-026's semantics
kept byte for byte, on purpose** (a chord fix and a semantics change in
one task is how you lose the ability to bisect either), not T-049
regressions — but they are real, and the table is the moment to decide
because T-027 is about to add rows to it.

**THE DEFECT REPRODUCED MECHANICALLY, which is the evidence @human's
report is actually closed.** With T-026's scoping restored (the
`useEffect` back inside `EmptyState`, the root registration deleted,
`tsc` clean), test 1 — the front door — stays **GREEN** while tests 2
(board), 3 (map) and 4 (genesis) go **RED** with `⌘O is claimed by
exactly one handler: expected +0 to be 1`. That is the bug report as a
test transcript: right keys, listener absent, invisible from the one
screen the old suite could see. The lane spec reds too, first on `the
app claims ⌘O before any screen exists`.

**THE REST OF THE EVIDENCE, in one pass.** C1: the chords fire from the
front door, the board, the map (including from the focused, CONTROLLED
`map-search` input, whose value survives) and the interview, ⌘ and Ctrl
for both commands, each reaching the right command BY NAME through the
real store — and the ⌘N pressed ON THE BOARD lands the app on the
interview screen. C2: both header labels, correct order
(`compareDocumentPosition`), each wired to its own command, both
`disabled` while a dialog is in flight, both absent from the interview
screen and the front door, and their `className` byte-identical to the
Toggle theme sibling's. C3: with the mocked `invoke` PARKED, **20 rapid
mixed chords plus a five-event synchronous burst** leave `invoke` called
exactly ONCE and `getShellState()` unchanged BY IDENTITY at every step;
release with `cancelled` clears the latch; the typed-`busy` case leaves
six shell fields unchanged by identity; and a chord fired while the
HEADER BUTTON's dialog is up opens no second dialog either — **one
latch, three doors**. C4: `git diff` on `genesis-entry.test.tsx`,
`front-door.spec.ts` and `no-plan-card.spec.ts` is **0 bytes**, and the
`EmptyState` function body diffed across both revisions after deleting
only the removed `useEffect` is **identical, zero remaining lines**. C6:
**26 chords** fired at the real app; exactly one is claimed beyond the
four the app declares — ⌘⌃O, and that BY DESIGN (Command OR Control, no
Alt, no Shift). Mutants: swapping the two commands reds 13, dropping
`preventDefault` reds 11, dropping the header button's
`disabled={shell.picking}` reds 4, accepting Shift reds 2. **Remount
drill**: four full screen cycles with the live keydown path list read at
16 points — `[1,2,1,1] × 4`, the 2 being the MAP's own ⌘F while it is
mounted. Nothing accumulates.

**NO NEW CSS, and the strong form of the claim holds on TODAY's tree.**
This merge's app build emits `index-RXeeD2qB.css` at **41.30 kB — the
same content-hashed asset name main@6356246 builds**, so T-049 adds not
one CSS rule on top of T-048's. The JS moved and only the JS:
`index-qfeIgiPJ.js` **442.54 kB** (main's was `index-DV-d_LjB.js`
442.12), which is the new module plus the header buttons.

**SUITES ON MERGED MAIN**, all four re-derived here first-hand, fresh
installs, ADR-011 order:
- lib/parser `npm ci` + `npm run build` + `npx vitest run`
  **159/159 (10 files)**, `npx tsc --noEmit` clean. Re-run AFTER the
  ROADMAP edit below (that suite parses the live tree) — still 159/159.
- app `npm install`, `npx tsc --noEmit` clean, `npm run build` exit 0
  (**253 modules**), `npx vitest run` **507/507 (30 files)** — exactly
  the number the verifier measured on the composed tree, and +12 over
  main's 495 (the 12 new `accelerators.test.tsx` tests). Re-run again
  after the fixture edits and the final regen: **507/507**.
- app/src-tauri bare `cargo test` **217 passed + 3 ignored, 0 failed**,
  exit 0, **zero warnings**, summed across **11 test binaries**
  (105 / 0 / 0 / 32+1 / 68 / 3 / 7 / 0+1 / 2+1 / 0 / 0) — **NOT piped
  through `tail`** (the standing trap). Unmoved, as a branch with zero
  Rust must be.
- tools/e2e `npm ci` + `npx playwright test` **36/36 in 8.0s**,
  headless, one worker, retries 0, no skips — +2 over main's 34, the new
  `accelerators.spec.ts`. `npm run typecheck` clean ·
  `npm run lint:tokens` **clean, 38 files** · `--selftest` **43 samples
  green**.

**THE BOOT GATE FIRED AND WAS RUN HERE — and it was STILL UNRUN BY
ANYONE on this branch, which is the point.** The dispatch forbade the
executor from running it (1420 is the human's), the verifier did not run
it either, and both said so LOUDLY rather than silently — which is
exactly what the CONVENTIONS bullet asks for. **The FOURTH exercise of
the gate, the third on its `app/src/**` limb.** Scratch port **14521**,
never 1420:

    [boot-check] port 14521 free — spawning `npm run tauri dev -- --config {…}` in /Users/ujju/Projects/nputer/app
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] process tree stopped (exit=null signal=SIGTERM)
    BOOT_EXIT=0

**Exit 0, both `[nputer]` startup lines, ONE run.** The exit code was
captured **from `$?` on an unpiped command** redirecting to a file — not
from `$PIPESTATUS`, which zsh does not define and which cost the T-041
integrator its first run. After it: `lsof -nP -iTCP:14521` **empty**
(the scratch port released), 14520 empty, `pgrep -fl tauri-boot-check`
empty, `pgrep -fl fake_agent` empty. The full `ps` sweep compared by
**pid SET, not by eye**: everything that appeared was a Spotlight
`mdworker_shared` worker, everything that vanished was the baseline
command's own pipeline plus the previous mdworker cohort. **Zero
boot-check pids survived.**

**1420 was never bound, contacted or signalled.** The human's vite still
holds `[::1]:1420` on **the same pid 90127, the same fd 28u, the same
device 0xc074e387883bd776** as at T-041's, T-047's and T-048's merges.
Their app is still **pid 8392, started 18:46:05, parented to the same
unchanged `tauri dev`** — confirmed alive both before and after the boot
run, which shared `target/debug/` with it and disturbed nothing.

**THE SHARED-WORKING-TREE SIDE EFFECT, second HMR instance and the one
with the sharpest edge.** This merge wrote no `.rs`, so nothing
restarted; it wrote two files under `app/src/` that the human's vite
watches, so the change reached their live window by **HMR**. What makes
this instance different from T-048's: the change is to **what the
keyboard does**. ⌘O and ⌘N will have started working under the human's
fingers, mid-session, with no signal from here — which is the fix they
asked for arriving unannounced rather than a screen re-laying-out.
Recorded as a fourth data point on the open question below.

STANDING INTEGRATOR PRACTICE (T-009-s1, the ratified CONVENTIONS interim
regen rule; retires when T-014's `nputer index --check` becomes the
gate) — **NINETEENTH** exercise, and it FIRED and MOVED the graph.
- **Trigger present**: the diff carries `*.ts/*.tsx` outside docs/. The
  plain ignored self-check was **RED before the regen** (exit 101,
  `NPUTER_UPDATE_GOLDEN` confirmed unset), which is the rule earning its
  place rather than being assumed.
- **Delta, enumerated from the raw graph rather than read off a
  summary**: files **90 → 92** (adds
  `app/src/components/shell/accelerators.ts` and
  `app/test/accelerators.test.tsx`; **nothing removed**;
  `tools/e2e/tests/accelerators.spec.ts` invisible — `.nputerignore`
  carries `tools/`), content-changed **hash/loc only** on
  `app/src/App.tsx` (loc 461→487) and `app/test/project-shell.test.tsx`
  (215→297). Stats symbols **616 → 642**, edges **1013 → 1038**.
- **FOUR assertions moved, not the three forecast — AND THIS TIME THE
  RULE CAUGHT IT BEFORE ANY TEST RAN.** T-041 hit this trap, T-048 hit
  it again, and T-048's integrator wrote it into
  `architecture-dogfood.test.ts` as a rule. **Used as a rule here**: the
  added-file list was checked against the registry FIRST — both new
  files match C-05 globs (`app/src/components/shell/**` and
  `app/test/**`), and the registry was swept to confirm **C-05 is their
  only claimant** — therefore `["C-05", 40] → 42`, derived before a
  single test was run and invisible in every red (it sits behind the
  file count in the same `it()` body). The other three are the branch's
  and all correct: file count `toBe(90)` → **92** (and the test NAME),
  relation row `["C-05","C-10","confirmed", 21] → 23` (the two new
  imports `accelerators.test.tsx` makes of `docs-model` and
  `watcher-store`, both C-10, on an already-CONFIRMED edge), and
  `map-dogfood-render.test.tsx` `· 90 files` → `· 92 files`. **Three
  merges in a row where three was forecast and four moved.** No new
  finding, no unmapped bucket, no drift-flag movement, `derived.issues`
  still `[]`.
- **`lib/parser/test/smoke.test.ts` did NOT move**, verified rather than
  assumed: `git diff aab62f0..HEAD -- lib/parser/` is **0 bytes** and the
  suite re-ran **159/159**. T-049 declares no component and changes no
  registry file, so the T-024 three-fixtures rule does not fire in its
  registry form.
- **Order per ceaa949, TWELFTH hold.** Fixture edits went in BEFORE the
  final regen (both fixtures are themselves indexed). Then regenerated
  **twice** for byte-identity: sha256
  `815412dedcd3fe6ecebce793e76c5f8119aaa91d2274c9c9137e2407795c0e73`,
  **385,451 bytes**, identical both runs (`cmp` clean). Then the
  **plain (non-golden) ignored self-check** with `NPUTER_UPDATE_GOLDEN`
  confirmed UNSET: `self_graph_is_current ... ok`. Then the app suite
  re-run after the fixture edits: **507/507**.

**No model call was made anywhere in this merge.** The env-gated
`#[ignore]` smoke was NOT run (one of the 3 ignored). No screen control,
no screenshots, no OS input injection, nothing read off the screen. The
boot run opened and closed its own window, which is the @human ruling of
2026-08-16 that T-046 rests on and this merge does not extend.

**THE MERGE WAS CLEAN AND THE ONE OVERLAP WAS PROVED HARMLESS, not
assumed.** Merge commit **`f4b38c8`**, merge-base **`aab62f0`**, ten
files. Both changed-file sets were enumerated and `comm -12` is exactly
**ONE file — `app/src/App.tsx`**, which T-048 also edited. The hunks
were re-derived in BASE coordinates rather than trusted from the flag:

| side | base-side hunks |
|---|---|
| main (T-048) | insert after :7 (the `cn` import) · insert after :275 (32 lines) · change :291 (the column className) |
| T-049 | insert after :6 (the `useAccelerators` import) · change :121–123 · **delete :141–155** (the `EmptyState` effect) · insert after :265 · insert after :319 · change :321–328 (the header group) |

The nearest non-import pair is main's :291 against T-049's :319 —
**28 lines clear**, far outside git's three-line context. The imports
land one line apart at two distinct anchors and both survive.
`git merge-tree --write-tree` was run FIRST and answered a single tree
with zero conflict markers; the verifier's own tree
`10c805c9…` reproduced exactly at the build head `3921426`, while the
branch TIP (which carries the verdict prose and s3/s4) gives
`1b703026…` — different bytes, same zero conflicts. The merged
`App.tsx` was then sha256-compared against that predicted tree and is
**identical**. Both changes are live in it: `useAccelerators` at :268,
`boundedFrame` at :313, the header pair at :385. `../nputer-t049` was
never entered.

INTEGRATOR JUDGMENT CALLS, recorded.
- **ARCHITECTURE: EDITED, one clause, and the test that decided it.**
  T-048's integrator declined the same document on the grounds that "a
  layout fix adds no capability and moves no interface". **T-049 adds a
  capability**: genesis is reachable from an open project, which was
  structurally impossible before, and the app's keyboard surface moved
  from a component to the root. C-05's status cell is precisely the
  running record of that kind of fact — it already narrates "T-026
  landed the genesis front door", "T-025 registered C-14's four genesis
  commands … although nothing in the UI calls it yet" — so the clause
  was added there and nowhere else. What was checked and deliberately
  NOT changed: the Genesis interfaces bullet says entry is "two
  zero-argument Tauri commands", and that is still exactly true — T-049
  adds a new CALLER of one of them, not a new command (`git diff` shows
  **zero** new `invoke(`/`listen(`/`emit(` call sites in `app/src`). The
  Code-layout bullet needed nothing either: `accelerators.ts` sits under
  `app/src/components/shell/**`, already described as C-05's, and
  carries no cross-component edge worth naming.
- **ROADMAP: EDITED, and this is the first time since T-039 that the
  test came out the other way.** T-041, T-047 and T-048 all declined it
  with the same argument — milestone 3's Progress line enumerates **what
  a user can do**, and none of them added a user capability. T-049 does:
  the advertised chords now work from every screen, and starting an
  interview from an open project is one step rather than four. Six lines
  were added to the Progress narrative saying so. The honest remainder
  (T-027, T-028, T-029, plus one observed real turn) is untouched and
  **milestone 3 is still NOT claimed**.
- **CONVENTIONS: NOT edited.** The BOOT GATE bullet was exercised a
  fourth time and needed nothing; its "the executor runs it too" limb
  was correctly OVERRIDDEN by a dispatch fencing 1420, and both branch
  roles said so loudly, which is the bullet's own instruction. The
  token-lint bullet governs token-bearing utilities; this branch adds no
  utility class at all and `lint:tokens` ran **clean over 38 files**.
  Zero new tokens, zero arbitrary values, zero new dependencies.
- **NO NEW ADR (three-prong).** (a) An ADR charters a DECISION between
  live alternatives. The placement question was settled by MEASUREMENT
  inside one component's territory, which is a file-placement call and
  not a charter. The question that IS chartering material — **should the
  accelerator table be screen-SCOPED** — is **T-027's**, folded there
  from T-026-s2 at the second triage, and T-049-s2 already supplies the
  one-line criterion reconciliation it needs. Inventing the screen
  dimension now would be building T-027's design without its planning
  pass. (b) **Prong two, verified as an EMPTY SET rather than by eye**:
  `git diff --name-only aab62f0..HEAD` restricted to `method/`,
  `capabilities/`, `lib/parser/`, `app/src-tauri/` and every
  `Cargo.toml`/`Cargo.lock`/`package.json`/`package-lock.json` returns
  **0 files**. So ADR-012 held (no native surface moved, zero grants
  touched, `acl_pin.rs` zero-diff, the 92-grant set unmoved and still
  green under `cargo test`), ADR-011 held (zero new crates, zero new npm
  deps, no lockfile line), ADR-003 held (no model call anywhere),
  ADR-017 held (no write path changed — the app is still a lens), and
  ADR-014/015 held (the graph was regenerated because the rule fired,
  proved deterministic across two runs, and proved current by the
  indexer's own plain self-check). **No new IPC variant**: the six wire
  enums are unchanged and this branch touches no Rust at all. (c) Prong
  three: the durable calls live in the task file's criteria→evidence
  map, its eight proof obligations, and the verifier's independent
  re-derivations.

## Overnight grants — SECOND autonomous run (human, 2026-08-17 night)
Given via question card while awake, before sleeping. Standing until
revoked:
1. **MILESTONE 3 TO COMPLETION.** Review + apply T-027's planning pass,
   dispatch its build, then T-028 and T-029 as they unblock —
   INCLUDING sequencing T-042 first if the planning pass concludes it
   must land before T-027 (its criterion 4 decides where the docs
   change log lives, and T-027 is the second consumer).
2. **THREE MILESTONE-4 LANES IN PARALLEL**, all disjoint from T-027's
   app-interview + app-shell: **T-030** (parser strictness, lib-parser),
   **T-045** (the gates cover the rules, tools/e2e), **T-034** (map
   tasks lens, app-map).
3. **THIRD TRIAGE APPLIED** — read-only analyst drafts, architect
   reviews and applies. Docs-only, reversible, one diff to read.
   Tasks NEWLY CREATED by triage still do NOT dispatch without the
   human.
UNCHANGED by this grant: a second REJECTED on any task parks that lane
for the human; @human judgments are never self-answered; no screen
control beyond the ruled boot check; port 1420 is the human's.

## In progress / broken right now
**NOTHING IS `building`.** The parser reports zero.

- **T-050 (the startup latch) DISPATCHES NEXT**, and it is @human's
  second report of the session: they hit a dead-end **"waiting for the
  first docs snapshot…"** screen with no escape. The diagnosis, checked
  at the source here rather than relayed: `startDocsWatcher`
  (`app/src/lib/watcher-store.ts:529`) sets its `started` latch at
  **:530–531 — `if (started) return; started = true;` BEFORE its two
  awaits** — and nothing ever resets it, so one failed attempt is
  permanent; the call site is **`void startDocsWatcher()`
  (`App.tsx:255`) with no `.catch`**, so any rejection is silent; and
  the `loading` screen (`App.tsx:398`) carries no picker and no
  affordance at all.
- **THE ACCIDENT WORTH RECORDING: T-049 PARTIALLY MITIGATES IT.** The
  accelerator hook is mounted at the App ROOT (`App.tsx:268`),
  unconditionally, above the screen switch — so **⌘O now fires from the
  `loading` screen too**, turning a dead end into something escapable.
  That is a side effect, not the fix. **T-050 owns the real fix and
  touches the SAME TWO FILES** (`watcher-store.ts`, `App.tsx`), which is
  exactly why it was serialized behind this merge.

**THE SHARED-INDEX HAZARD, and it did not recur.** `git diff --cached
--stat` was checked before **both** commits and the staged set was
exactly this session's each time. The house shape here is clean:
**merge → checkpoint**, two commits.

The t049 worktree is removed and its branch KEPT — **30 task branches
merged now**, `t001-app-shell` through `t049-way-in` (counted with
`git branch --merged main`), and **no live task branch at all** for the
first time in a while. Main tree clean; all four suites green; the token
lint green; the committed graph current and proved so by the plain
self-check rather than by assumption. The parser re-parses the whole
live tree at **0 issues**: **80 tasks**, tally **31 done / 18 planned /
9 parked / 22 suggested / 0 building**, 6 features, 11 components.
(Tasks rise by four — T-049's four suggestion files — not a board that
grew work.)

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. The sharpest open set is still app-agent's, untouched by
this merge: **T-047-s5** (two doors, one standard, only one guarded —
~5 lines), **T-047-s6** (nothing structurally stops a test resolving
the real CLI — the one that has already fired), **T-047-s4** (`$SHELL`
picks the program, and a comment in the code is now false), and
**T-047-s1** (the cache that saves zero spawns). Beside them the
process-hygiene pair stands: **T-046-s1** (the unsignalled process
group, on the human's own port) and **T-041-s4** (the one env-var path
that would package a DEV harness).

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020). At
the repo's first push (`git remote -v` is still empty), confirm in
order: the ubuntu apt/webkit2gtk set installs; the three `uses:` SHA
pins resolve; playwright-on-Linux runs the lane — **now 36 tests**,
whose most platform-sensitive are the ones measuring REAL CSS in
Chromium-on-Linux (**if anything goes red there, look at the font and
colour assertions in `front-door.spec.ts` and `genesis-screen.spec.ts`
first**), plus T-048's three-viewport sweep, which asserts EXACT pixel
equality between `document.scrollHeight` and the viewport at 800x600,
1024x768 and 1280x720 — a Linux scrollbar-gutter or default-font
difference shows up there before anywhere else and should be read as a
platform difference to file, not a regression, unless the pane's region
also stops scrolling. **T-049 adds a NEW kind of Linux exposure to
watch**: `accelerators.spec.ts` presses `Meta+o` / `Meta+n` in real
Chromium and asserts `defaultPrevented`. On Linux the Meta key is not
the platform accelerator and the app deliberately accepts Control too,
so if that spec reds there, read it as a key-mapping difference to file
before touching the matcher — and note it would be the first evidence
about T-049-s4's territory that anyone has. Then: `cargo audit` behaves
as it does locally; and **the xvfb `tauri dev` boot prints both
`[nputer]` startup lines** — the FIRST exercise of the boot check on
Linux, and the only place T-046's override's Linux behaviour will ever
be observed (CI deliberately sets no `NPUTER_BOOT_PORT`, so the override
path stays Linux-unverified by design). AND (T-018-s3 fold) the THREE
T-018 SENTINEL LIVE TESTS inside the ubuntu `cargo test` step —
replaced-wholesale and deleted-recreated docs/. They discriminate only
where inotify watches INODES; macOS FSEvents watches paths and was
accidentally resilient, which is why T-018's replace-half evidence is
mechanism-only today. Green there CLOSES that gap; red there is a real
reconcile gap macOS could never surface, and gets filed immediately.
This run also closes T-001/T-003's Linux halves, and carries T-026-s1
(the plan probe's exact-case match) and T-021-s1 (the ACL pin is
macOS-derived). The ubuntu `cargo test` step also runs the
`agent_runner` integration tests — **32 + 1 ignored** — which spawn real
child processes and send real signals; T-047's newest plant files,
refuse paths and assert on executable bits, so a Linux permissions or
`/bin/sh` difference would show up there first. Watch it, and watch for
the unnamed `agent_runner` flake there too.

## Next up (1–4)
1. **@human — THE VISUAL SESSION IS STILL OPEN, and the thing you
   reported now works.** The app is RUNNING on 1420 as this checkpoint
   lands, **on the same pid 8392 as before** — this merge wrote no Rust,
   so nothing restarted; the two changed frontend files reached the
   window by **HMR**, which this time means **the keyboard changed under
   your fingers**.
   - **FIRST, because it is your own report: press ⌘O and ⌘N on the
     board, on the map, and on the interview screen.** All three should
     open the two native dialogs now, and a second chord while a dialog
     is already up should do **nothing at all**. Also try the board
     header's new **"Start an interview"** — one step to genesis from an
     open project instead of four.
   - **NEW — THE HEADER'S DENSITY, T-049's own @human item, and it is
     three separate calls.** The board header's right-hand group is now
     literally `Open folder… | Start an interview | Toggle theme` —
     **three buttons where there were two**, all three with
     byte-identical classes (the quiet outline, `px-3.5 py-1.75
     text-sm`), sitting opposite the wordmark and the full project path.
     1. **Three equal outline buttons read as one undifferentiated
        group.** The front door gives its primary the ink pill; the
        header gives nothing emphasis — so "Start an interview", **the
        capability milestone 3 is named after, looks exactly like
        "Toggle theme"**. Separator? Emphasis? Or is quiet right?
     2. **The header pair carries no `⌘O · ⌘N` hint** while the front
        door does — so chords that now work EVERYWHERE are advertised in
        exactly one place. Left off deliberately (the buttons are the
        discovery; the hint would add a third element to a row that just
        gained one), and it is the obvious counter-argument.
     3. **Neither group wraps or truncates** — no `flex-wrap`, no
        `min-w-0`/`truncate` on the project path — so at a narrow window
        that row has nowhere to go. **Worth looking at beside T-048's
        freshly bounded frame**, since that is the other thing that just
        changed about how this app behaves at small sizes.
     (Also: the header says `Open folder…` and the front door says
     `Open a folder…`. Not unified — same verb, two registers.)
   - **NEW — the frame at 800x600, T-048's item, still open.** The pane
     scrolls inside a fixed header and heading, and the artifact list
     gets 286px of the 858px it wants at the size the app actually
     opens. The measurement says the frame holds; **whether it holds
     ENOUGH list to be useful is an eye judgment only you can make** —
     and if it does not, the question becomes whether the interview
     heading block wants to be smaller, which is a design call.
   - **THE COMPOSITION QUESTION, still the ONLY framing item left and
     still T-027's.** T-024 drew the pane as the **RIGHT HALF of a split
     view**; until T-027 it sits **full-width inside T-026's card
     frame**. Does its `bg-sidebar` ground read right framed by a
     `bg-card` bordered box, and does the **five-across backbone grid**
     hold at full width when it was drawn for a half-width pane?
     **This is the question T-027's planning pass waits on** (item 2).
   - **T-024's pane, light AND dark**: built/forming/slot card contrast
     in dark, the warm writing-row border, the five type sizes that
     moved 0.5–1px, the substituted footer right slot
     (`stage ~4 · constraints`).
   - **T-026's front door, light AND dark**: the two-button row and the
     "No plan in &lt;folder&gt;" card against the design's `open a
     folder` screen — button sizes/inks, the checklist ○/✓ (the ✓ rides
     `--review-disc`, whose dark value #4ecf9e is a token-family
     derivation, not measured from a dark mockup), the card's 10px vs
     the design's 12px radius, and whether the footnote reads as a
     footnote. **Read T-048-s4 before T-048-s3** — s3 says the "Start an
     interview here" button falls below the fold at 800x600 and **that
     conclusion is wrong**; the button and the footnote both measure
     clear of the fold, and what spills is padding and 15px of painted
     card edge. A fit blemish to fold into this pass, not a hidden
     action to chase.
   - **The at-a-glance amber judgment** (T-012 criterion 5's human
     half — drift stroke vs building/verifying fills, BOTH schemes,
     incl. composed building+drift; the dogfood hero renders it live).
     C-05's drift count reads **4**.
   - **The launch-shot re-judgment** (T-006's pending screenshot
     predates the rail — light + dark now include it).
   - **The T-023 dry-run conversational quality judgment** (did the two
     "pushing back:" challenges actually challenge; true cold-context
     evidence still arrives with T-029).
   - **T-026-s4's question**: point the app at a folder whose `docs/`
     holds files but no plan (a lone ARCHITECTURE.md). It renders
     **through the lens** now, as the pane's own `docs/ · 0 files
     written` scaffold with `expected` placeholder rows and north star
     `forming…`. Judge whether THAT reads right over a non-empty docs/.
   - **The real picker flows on the real screen** — the standing T-007
     checklist, still @human because native dialogs are unreachable from
     a browser harness and tauri-driver has no macOS. **T-049 closed the
     accelerator half of this and the lane cannot see the rest**: what
     remains is the native half — "Start an interview" → native dialog →
     a docs-less folder lands on the genesis screen; "Start an interview
     here" on a folder the app just refused; a folder that already has a
     plan → the board, not genesis. (T-049-s1 records why the served
     bundle can prove a chord was CLAIMED but never that it was OBEYED,
     and why the header's two buttons are invisible to the lane
     entirely — both are behind `isTauriRuntime()`.)
   - **The `tauri dev` quit-the-app orphan check** (from T-025). Start a
     `hang`-scenario genesis in a scratch project, quit the app, confirm
     no orphan — **and watch for T-025-s7's ~5 s main-thread hang on
     quit**, which is expected, harmless, and worth confirming is only
     ~5 s.
   - **The T-047-s6 stray, a decision not a look.**
     `~/.claude/projects/-private-var-folders-…-t047va-count-97806-…-project/`
     (one .jsonl, 17,128 bytes, zero-token synthetic records). Outside
     the repo and deliberately not deleted. **Delete it or keep it — the
     call is yours.**
   - **ONE REAL OBSERVED PLANNER TURN, on an authenticated machine** —
     still the biggest unobserved thing in the project. This machine's
     `claude` OAuth token is revoked, so no model call has ever gone
     through the runner. Two questions ride on it: does the kickoff land
     a real planner in stage 0, and is the six-pattern Bash allowlist
     sufficient for a real stage-0 scaffold (which is what T-025-s4
     needs before it can narrow `Bash(cp:*)` / `Bash(mkdir:*)` safely).
     **T-025-s2 carries the exact command.**
   - **A Linux run** — the "watch the first CI run" item above.
   - **A PRIORITY CALL, not a screen action.** The next triage has
     **three** process/spawn-hygiene items to rank against each other:
     T-046-s1, T-047-s6 (the only one that has already fired), and
     T-047-s5 (~5 lines). T-048 added a second kind: **s2** (the map
     canvas clips — silent graph loss the day anything bounds it) versus
     s1 (two scroll models, T-027's) versus s5 (the floor, one line).
     **T-049 adds a third kind — a REACH question**: s4 says the chords
     are dead on every non-Latin layout while the UI still advertises
     them, and s3 says the module T-027 is about to extend has four
     advertised properties none of which is pinned. **s2 is still the
     one that can bite without warning; s4 is the one that is already
     biting someone we cannot see.**
2. MILESTONE 3 (T-023…T-029 + T-039 + T-041 + T-047 + T-048 + T-049,
   ADR-017). **T-041's served-bundle gate is DOWN, T-048 made the screen
   fit the window, and T-049 made the way in work** — three things
   between the human and a verdict, all cleared. **What still holds the
   milestone is the human, in this order:**
   (a) **T-027's planning pass waits on the human's split-view verdict**
   (item 1) — it builds the LEFT half of a composition whose whole
   design question is what the open visual session is judging.
   `blocked_by` [T-024 ✓, T-025 ✓, T-026 ✓] has been satisfied since
   T-025 merged. **T-027 also inherits T-047-s3** (a read boundary on
   `model` at the first site that renders it), **T-048-s1** (the two
   scroll models, which only a composition decision can collapse), and
   now **T-049-s2** — its accelerator criterion literally says "(their
   unmount-scoping test stays green)" and T-049 made that false on
   purpose, so the criterion needs a one-line rewording before it
   dispatches, plus **T-049-s3** (the four unpinned mechanism properties
   it is about to lean on).
   (b) **T-029 is UNGATED but not unblocked** — its `blocked_by` is
   still `[T-027]`, and T-028's is too.
   The milestone is NOT claimed: the first slice delivers hand-driven
   genesis, the runner exists and is hardened at four boundaries, but no
   agent loop has ever run against a real model.
3. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16 night): the app-shell
   lane queue was T-021 → T-026 → T-025 → T-022; T-021, T-026 and T-025
   are all DONE, so the standing grant's next named item is **T-022**
   (M, milestone 4, `blocked_by: []`), with T-027 ahead of it in
   milestone order but held for the visual verdict. **app-agent is
   FREE** — T-047 merged — which unblocks **T-043**'s "serialize behind
   T-039 on app-agent" condition outright; **app-shell is now FREE too**,
   and **T-050 is the named next dispatch on it** (see above). Triage:
   APPLY granted — but tasks NEWLY created by triage (T-041…T-049) do
   NOT dispatch without the human; T-041, T-046, T-047, T-048 and T-049
   each got that nod explicitly, and **T-050 will need the same nod**.
   Unchanged method rules: a second REJECTED on any task parks that lane
   for the human; @human judgments are never self-answered.
4. SUGGESTION BACKLOG — **31 open files: 9 parked + 22 suggested.**
   **T-049 contributes four**, and they do not rank together.
   **Untriaged (22)**: the four T-049 cards — **s4** (`event.key` makes
   the chords silently dead on every non-Latin layout while the front
   door still advertises `⌘O · ⌘N`; measured, inherited from T-026, and
   the table is the moment to decide because T-027 adds rows to it),
   **s3** (the hook's four advertised mechanism properties are each
   deletable with 503/503 green — the unmount cleanup, "an absent entry
   is left alone", the per-render table refresh, and "added once"; the
   first is what the retired T-026 test was reaching for and the fix is
   two lines in a file that already has the wrapper), **s2** (T-027's
   accelerator criterion names a test T-049 retired — one-line
   reconciliation, cheapest thing on this list), **s1** (the lane sees a
   browser, not the app: it can prove a chord was CLAIMED, never that it
   was OBEYED, and both header buttons are invisible to it; matters more
   for T-027 than here) — plus the five T-048 cards (**s2** the map
   canvas clips instead of scrolling, **s4** the s3 CORRECTION — read it
   BEFORE s3, **s1** two scroll models, **s3** the no-plan card
   overflows at 800x600, **s5** the bounded frame's floor) — plus the
   six T-047 cards (**s5** the probed path skips the gate, **s6**
   nothing structurally stops a test resolving the real CLI, **s4**
   `$SHELL` picks the program, **s1** retire the cache, **s2** the flag
   table is a version snapshot, **s3** the model has no read boundary,
   home T-027) — plus **T-041-s2** (the wire shape is pinned in Rust and
   mirrored by hand in TS with nothing comparing them), **T-041-s4**
   (`NODE_ENV`, not `--mode`, flips the DEV gate), **T-046-s1** (the
   unsignalled process group), **T-046-s4** (the overlay's blind spot),
   **T-046-s2** (`checkJs` — its worked example is wrong and the
   correction is IN the file), **T-046-s3** (nothing gates the packaged
   build — read with s4 and T-041-s4: all three are "a gate proves the
   configuration it was handed, not the one that ships"), and
   **T-039-s3** (give the session-id refusal its own typed outcome; home
   is T-029).
   **The nine parked, unchanged**, all blocked on something only the
   world can provide: T-003-s2 (a real project near the ~25 MB knee),
   T-008-s1 (F-04/F-05 layout), T-018-s1 (a Windows lane), T-021-s1 and
   T-026-s1 (both await the first Linux run), T-025-s2 (@human, one
   command on an authenticated machine), T-025-s4 (gated by s2),
   T-025-s3 (nputer.yaml is F-04 era; its count fix rides T-043),
   T-038-s1 (no responsive call site yet — T-048 is the first task to
   measure the app at six viewport sizes, so s1's claim is weaker than
   it was).
   Five triage-born tasks stand ready and un-dispatched: T-042 (genesis
   switch truthfulness), **T-043** (kill path — its serialization
   condition is SATISFIED and app-agent is free; T-047-s4 nominates it
   as a home), T-044 (shell pins cover their surface), T-045 (the gates
   cover the rules).
   Milestone-4 queue after F-03: T-010, T-013, T-014, T-015, T-030…
   T-035, T-044, T-045, plus T-022.

## Open questions
- **Does the BOOT GATE rule retire, and when?** Carried forward
  unchanged. T-009-s1's sibling rule names its retirement (T-014's
  `nputer index --check`); BOOT GATE names none in CONVENTIONS, and
  `.github/workflows/ci.yml` already invokes the boot check on ubuntu
  while dormant. Does it retire at the repo's first push, or only when a
  macOS gate exists too? Left for a triage. **FOUR exercises in now**
  (`app/src/**` at T-041, T-048 and here, `app/src-tauri/**` at T-047),
  and it has needed no amendment any time. **T-049 exercised a limb of
  it nobody had tested**: its "THE EXECUTOR RUNS IT TOO" clause was
  overridden by a dispatch that fenced 1420, and both the executor and
  the verifier declared the gate UNRUN in as many words rather than
  going quiet. The bullet's "a skipped gate is news, never silence"
  handled that correctly with no amendment — worth noting when the
  retirement question is actually taken.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** Unchanged: there are TWO gates with the shape trigger →
  command → record, one of which binds the executor, and
  `method/roles/executor.md` still says only "run the test commands from
  CONVENTIONS.md until green". Ask ONCE when a THIRD lands, or when the
  executor rule proves noisy. A method version bump, not an ADR.
- **Does the shared main working tree need a rule?** Carried forward and
  **now with a fourth data point**. The first was the git INDEX (T-046's
  merge lost its house shape to a shared index; the fix that works is
  social — "the pen is yours" — plus `git diff --cached --stat` before
  every commit, done twice here). The second was the WORKING TREE via
  Rust: an app-agent merge REBUILDS and RESTARTS the app the human is
  reviewing. The third (T-048) was the same tree via **HMR** — no
  restart, same pid, but the screen under review changed without a
  signal. The fourth is today's, and it sharpens the HMR face rather
  than repeating it: **the merge changed what the KEYBOARD does**, so
  the human's ⌘O started working mid-session with no signal from here.
  A screen that re-lays-out is noticeable; an input that starts
  responding is not. All four faces are recorded and none is written
  down anywhere but here. Method/process, so the architect's (ADR-004).
- **When does spawn hygiene become an ADR?** Unchanged from T-047's
  ruling: three C-14-local rules exist and a charter was argued against,
  because T-047-s5 proves the cached and probed doors hold DIFFERENT
  standards today. **The moment to write it is when s5 lands** — that is
  when there is a single rule to charter — which is a nearer, sharper
  trigger than "a second component spawns agents at F-04".
- **Does a verifier's remedy belong in an acceptance criterion?**
  Carried forward from T-048, unanswered and still worth taking while
  the example is fresh. T-041's verifier filed a fix in s1's note 1; the
  architect promoted it into T-048's criterion 3 as a prescription; **it
  was wrong, and the task nearly required its own bug.** Only the "or a
  demonstrably better equivalent" escape hatch saved it. Two candidate
  rules, both cheap: a criterion that names a specific remedy SHALL
  carry that hatch, or a remedy inherited from a suggestion SHALL be
  written as a hypothesis to test rather than a shape to build. The
  architect's call (ADR-004). **T-049 supplies a second data point from
  the other end**: its criterion 5 named a MECHANISM ("a single
  app-scoped listener… a test SHALL assert exactly one keydown listener
  path handles the chords") rather than a remedy, and the builder had to
  invent three instruments to satisfy it — which caught four of six
  attacks and produced the double-listener measurement above. Naming the
  property to prove worked; naming the fix to build did not.
- **NEW: when a task retires a test, who owns the property it was
  reaching for?** T-049 is the case. T-026's `"stops listening once the
  front door is gone"` was retired CORRECTLY — it would have been
  vacuously green forever — but the property underneath it (the
  listener's teardown) was real, survived the refactor in a new form,
  and is now pinned nowhere; deleting the hook's cleanup leaves 503/503
  green. Nothing in the method asks a builder who retires a test to say
  where its property WENT, and no criterion failed here. The verifier
  caught it by attacking the code rather than by reading the rules,
  which is luck of the same-model draw. Candidate rule, one line in
  TASK-FORMAT: a task that deletes or replaces an existing test SHALL
  name, for each assertion dropped, either its new home or its
  suggestion id. Method version bump, the architect's call.
