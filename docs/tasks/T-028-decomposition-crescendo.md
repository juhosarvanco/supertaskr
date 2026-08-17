---
id: T-028
title: Decomposition crescendo — cards rain in, timed completion, board handoff
feature: F-03
milestone: 3
priority: 6
size: M
status: building
blocked_by: [T-027]
touches: [app-interview, app-shell]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review:
---

The interview's last act: when the planner reaches decomposition
(Q7 banked; task files start landing), the right pane graduates from
the genesis lens to the real board materializing — "cards rain into
the board" — then hands off to the board pane. The board already
renders live task files for free (watcher); this task is the
transition, the completion state, and the local timer (criterion 2 is
TIMED; display-only, no telemetry — NORTH_STAR non-goal).

Absorbs: T-027-s1 (architect, 2026-08-17). The answer box loses focus
after every send, so answering twice in a row needs the mouse — on a
screen whose whole premise is a seven-question conversation. Its
suggestion file names its home as "T-027's own lane
(`app/src/genesis/`)", which is this task's lane, and the fix is three
lines plus a guard. Folded rather than given a lane of its own; the
suggestion file is removed in the same commit as this line.

## Acceptance criteria
- WHEN task files begin landing under docs/tasks/ during genesis THE
  right pane SHALL switch to the real board renderer (existing board
  components read-only; board files untouched — composition only)
  with cards appearing live as files land; the rain treatment is one
  entrance transition within the established motion budget,
  motion-safe gated.
- WHEN the interview completes (T-023's completion signal: planner's
  closing turn + a parseable board present) THE view SHALL render
  the completion state — board ready, elapsed time shown from the
  local genesis clock ("~N min", ephemeral, restart re-base rule
  recorded in notes) — with one CTA landing in the board pane on the
  new project (rail restored); no dispatch affordance (F-04 fence).
- WHILE genesis is in progress THE elapsed indicator SHALL render
  (the design's "~9 min elapsed" slot) without any network or
  persistence beyond .nputer/ (asserted: zero new IPC, zero
  telemetry).
- IF the planner ends without a parseable board (no tasks, or all
  parse-failing) THEN the completion state SHALL NOT render — the
  view stays in-interview showing the honest artifacts state and the
  existing parse-chip family (planning theater is the named failure
  mode; an empty board must never be celebrated).
- IF prefers-reduced-motion is set THEN cards appear without the
  entrance transition.
- WHEN a turn the user sent from the answer box leaves flight THE
  focus SHALL return to that box, so a keyboard-driven user can answer
  seven questions without ever reaching for the pointer. IF focus had
  been moved elsewhere while the turn was in flight THEN it SHALL NOT
  be stolen back — the box refocuses only when it HELD focus at submit
  time, recorded at submit rather than inferred on landing. The box
  stays `disabled` in flight (T-027's criterion 4 is unchanged; the
  blur is the HTML spec's, and the defect is that nothing gave focus
  back). `tools/e2e/tests/interview.spec.ts`'s tripwire, which today
  asserts `not.toBeFocused()` after a real ⏎ send and then has to
  `.click()` the box before typing again, SHALL be INVERTED and the
  re-click deleted — a spec that still needs the click has not fixed
  this. (T-027-s1, option 1 of three; options 2 and 3 change what "in
  flight" LOOKS like and are @human's, so they are not taken here.)

Verification: headless — jsdom + served-bundle probe: scripted
fake-CLI decomposition writing real task files into a temp project,
asserting lens→board switch, live card appearance, completion
gating, no-board failure path. @human, listed explicitly: THE
MILESTONE CLOSER — a real, timed, end-to-end genesis on a toy idea
(target ≤30 min, criterion 2), judged live; light+dark completion
screenshots.

## Implementation notes

### Confirmation of the task (CLAUDE.md, before anything was touched)

T-028 is the interview's last act, and it is composition rather than new
capability: when task files start landing under `docs/tasks/` during a
genesis run the right half of T-027's split stops being T-024's lens and
becomes the REAL board — the existing `Board` components mounted
read-only, with one motion-safe entrance transition so cards visibly rain
in as files land; when the planner's last turn has landed, no turn is in
flight and a PARSEABLE board is on disk, the right half renders a
completion state carrying the local, display-only elapsed time and ONE
CTA that lands the user in the board pane on the new project with the
rail restored (no dispatch affordance — F-04 is fenced); while genesis
runs, an elapsed indicator renders with zero new IPC and zero telemetry,
asserted mechanically rather than claimed; a planner that ends with no
tasks, or with every task file failing to parse, gets NO completion state
at all — the view stays in-interview on the honest artifacts state and
the existing parse-chip family, because planning theater is the named
failure mode; reduced motion drops the entrance transition; and the
folded T-027-s1 defect is fixed at its root — the answer box records
whether it HELD focus at submit time and takes focus back on the falling
edge of in-flight, never stealing it from somewhere the user moved it,
with `interview.spec.ts`'s `not.toBeFocused()` tripwire INVERTED and its
compensating re-click deleted. Board files stay byte-untouched, the
webview grant set stays at 92, no new dependency is added, and no model
call happens anywhere.

### What the card claimed and disk did not — read this first

**1. THERE IS NO "T-023 COMPLETION SIGNAL".** Criterion 2 cites
"T-023's completion signal: planner's closing turn + a parseable board
present". `method/roles/planner.md` and `method/interview/plan-interview.md`
are the whole of T-023's protocol and **neither defines a closing
marker**. The only literal marker the method has is `pushing back:`,
which the driver contract explicitly calls a rendering hint that nothing
may depend on. `git grep -i -e "completion signal" -e "closing turn"
docs/` returns exactly two hits — **both of them this card's own
criterion**.

So the signal is DERIVED from typed state and file evidence rather than
read out of prose, and `crescendo.ts`'s header says so where the next
reader will meet it: the highest-numbered turn has SETTLED as
`completed`, nothing is in flight, and a parseable board is on disk.
Three consequences, all deliberate: it is an **approximation** (a planner
that pauses mid-decomposition with cards already written reads as
complete); it is **reversible** (answer again and it stands down, because
a turn is in flight); and it **never reads what the model said**, which
keeps criterion 3's fence and ADR-017's rule intact.

**2. THE DESIGN DRAWS NO COMPLETION SCREEN.** The bundle's thirteen
screens are Board · Board dark · Card detail · **Interview** · Rooms ·
Sessions · Open a folder · Card states · Map tasks · Map architecture ·
Map architecture dark · Map spec · Map behavior. There is no genesis
completion state anywhere in it, so the panel is built from the
established `status-done` family and the review-mark disc rather than
from a mockup. Disclosed for the screenshot pass — this is the second
place (after T-027's challenge treatment) where the design had to be
extended rather than followed.

**3. THE `~9 min elapsed` SLOT MOVED, and it had to.** The design puts it
in the LENS's footer-right; T-024 substituted `stage ~N · <step>` there
for a stated reason. T-028 replaces the lens with the board at
decomposition, so a footer slot would take the elapsed time off screen at
exactly the moment the run is being timed. It lives in the chat header
instead — the one piece of chrome that survives the whole genesis — and
is repeated in the completion panel. Same words, same tilde.

**4. THE CARD'S `touches:` UNDER-DECLARES BY ONE LANE.** It reads
`[app-interview, app-shell]`; the work necessarily touched
**`tools/e2e/`** as well, because the card's own Verification line asks
for a served-bundle probe and because T-027's tripwire — which criterion
6 orders INVERTED — lives there. The field was **left as dispatched**
(fields lock at `status: building`, TASK-FORMAT § Lifecycle) rather than
edited in place; flagged here instead. T-027's card carries
`[app-interview, app-shell, tools/e2e/]` for the same three lanes.

### Criteria → evidence

**Criterion 1 — the lens becomes the real board as task files land.**
- The decision: `app/src/genesis/crescendo.ts:81` (`boardReadiness`),
  `:113` (`showsBoard`). The switch is `parsedTasks > 0` — task files
  that PARSED — never a turn's text, so a human hand-driving the method
  gets the identical crescendo (ADR-006).
- The composition: `app/src/components/shell/GenesisScreen.tsx:77`
  (`const half = showsBoard(docs) ? "board" : "lens"`), `:145` (the
  boundary now wraps either renderer).
- The board, mounted read-only: `app/src/genesis/BoardCrescendo.tsx:135`
  (`<Board model={docs.model} />`). **`git diff` over
  `app/src/components/board/` is EMPTY** — zero files, zero bytes.
- Cards appearing live: `app/test/crescendo-dom.test.tsx:246` (the first
  card lands, `data-half` flips to `board`), `:275` (1 → 2 → 3 as files
  land), and in the lane `tools/e2e/tests/crescendo.spec.ts:44`.
- The rain: `app/src/index.css:310` (the `board-rain` utility), `:260`
  (the `--animate-card-rain` keyframe), `app/src/styles/tokens.css:410`
  (`--card-rain-duration: 260ms`, `--card-rain-rise: 8px`). Painted, from
  the SERVED sheet: `tools/e2e/tests/crescendo.spec.ts:81` —
  `animation-name: card-rain`, `0.26s`, one iteration, fill-mode `none`.

**Criterion 2 — the completion state, the elapsed time, the one CTA.**
- The signal: `app/src/genesis/crescendo.ts:160` (`completionOf`), pinned
  in `app/test/crescendo.test.ts:206-263` (all four blockers, complete,
  the highest-turn rule, the not-a-latch rule).
- The panel: `app/src/genesis/BoardCrescendo.tsx:97`. Elapsed: `:120`.
  The CTA: `:115`.
- The handoff: `app/src/lib/watcher-store.ts:434`
  (`openBoardFromGenesis`, pure) and `:916` (`openGenesisBoard`, the live
  half), wired at `app/src/App.tsx:602`.
- End to end with a REAL CLICK: `app/test/crescendo-dom.test.tsx:361`
  (screen → `board`, rail present, three cards, and the whole invoke set
  asserted) and `tools/e2e/tests/crescendo.spec.ts:114`.
- **No dispatch affordance (F-04):** `app/test/crescendo-dom.test.tsx:328`
  counts the panel's buttons (exactly 1, and it is `genesis-open-board`)
  and greps its text for `dispatch` / `run task` / `assign`.

**Criterion 3 — the elapsed indicator, zero new IPC, zero telemetry.**
- The clock: `app/src/genesis/interview-source.ts:342-397`. Display-only
  and local by CONSTRUCTION — a number in a module with no channel out;
  `elapsedLabel` (`crescendo.ts:224`) is its only consumer.
- Rendered while genesis runs: `app/src/genesis/InterviewChat.tsx:282`
  (the header slot), asserted at `app/test/crescendo-dom.test.tsx:237`
  and in the lane at `crescendo.spec.ts:114`.
- **Zero new IPC, counted:** `app/test/crescendo-dom.test.tsx:479` walks
  every `.ts/.tsx` under `app/src` and asserts the exact set of
  `invoke<T>("…")` command names; `:494` parses `invoke_handler!` out of
  `app/src-tauri/src/lib.rs` and asserts the exact **nine**. Poison M40
  (a tenth frontend command) reds 7 bodies; M41 (a tenth Rust command)
  reds 2. `app/src-tauri/**` and `capabilities/**` are **0-file diffs**;
  `agent-store.ts` is a **0-byte diff**, so the crescendo reaches the
  runner entirely through C-14's existing exports.
- **Zero telemetry, counted:** `:515` sweeps every file in
  `app/src/genesis/` for `fetch(`, `XMLHttpRequest`, `WebSocket`,
  `sendBeacon`, `localStorage`, `sessionStorage`, `indexedDB`,
  `EventSource`, `writeTextFile`, `writeFile`, `mkdir`. Poison M42 reds
  it. Nothing beyond `.nputer/` is written because **nothing is written
  at all** (ADR-017 holds).

**Criterion 4 — planning theater, refused.**
- `boardReadiness` counts task RECORDS, not files
  (`crescendo.ts:81-101`), so seven unparseable files read as zero cards
  and `showBoard` is false.
- `app/test/crescendo.test.ts:133` (all-failing), `:143` (one good beside
  one torn), `:153` (a torn file that once parsed keeps its card — the
  last-good contract), `:237` (completion refused with
  `blocker: "noBoard"`).
- Through the real screen, on real torn files in a temp project:
  `app/test/crescendo-dom.test.tsx:395` — lens, parse chip reading
  `2 parse errors`, zero cards, no completion panel, and the torn files
  still ROWS on the lens. In the lane: `crescendo.spec.ts:165`.

**Criterion 5 — reduced motion.**
- One `motion-safe:` variant and no second mechanism:
  `BoardCrescendo.tsx:134`. The ungated form is used **nowhere** under
  `app/src`, swept character by character at
  `app/test/crescendo-dom.test.tsx:289`.
- The real browser withdrawing it: `tools/e2e/tests/crescendo.spec.ts:81`
  — `page.emulateMedia({ reducedMotion: "reduce" })` moves
  `animation-name` from `card-rain` to `none`, **and the three cards are
  still there**. Poison E2 reds it.

**Criterion 6 — the answer box keeps the keyboard (folds T-027-s1).**
- `app/src/genesis/InterviewChat.tsx:214` (the flag, recorded AT SUBMIT),
  `:243` (the refocus effect with the anti-theft clause).
- Four DOM bodies from `app/test/interview-chat-dom.test.tsx:825`: focus
  returns; focus moved away is NOT stolen back; a send from the Bank
  button leaves focus on the button; an empty send arms nothing.
- **The tripwire is INVERTED and the re-click DELETED:**
  `tools/e2e/tests/interview.spec.ts:517` now reads `toBeFocused()`, and
  everything below it types with the keyboard alone — so a regression
  cannot hide behind a spec that quietly clicks first. Poison E5 reds it.

### What the tests found that review did not

**A REAL DEFECT IN THE FIRST DRAFT, found by T-037's own hostile Proxy.**
`GenesisScreen` calls the renderer decision from its RENDER BODY, which
is **outside** T-037's error boundary — so a docs tree torn badly enough
to throw on `effective` would have taken the whole React tree down and
left the user a blank window with their interview in it. That is exactly
the failure the boundary exists to prevent, reintroduced one level up,
and it is the same shape as the `stageOf` defect T-027 found. Fixed by
`showsBoard` (catches, degrades to the lens, whose own boundary then
renders the honest fallback) and pinned twice:
`app/test/genesis-mount.test.tsx:401` (through the screen, with task
files, so the board route is the one that would have died) and
`app/test/crescendo.test.ts:184` (the unguarded call still throws; the
guarded one does not).

**JSDOM IMPLEMENTS NEITHER HALF OF THE FOCUS RULE — measured, and it is
the difference between criterion 6's tests and vacuous ones.** jsdom does
NOT blur a focused element when it is disabled (a probe left
`document.activeElement` on the textarea after `disabled = true`),
`document.body.focus()` is a no-op, and `blur()` on an already-disabled
element is refused because it is no longer a focusable area. A naive
jsdom focus test therefore **passes against the broken code**. The
browser's end state (`activeElement === document.body`) is reached
deliberately — focus a throwaway node, remove it — in
`dropFocusToBody`, and the real thing is proved in a real browser by the
inverted lane tripwire.

**T-027-s5 CAME TRUE DURING THIS BUILD, exactly as filed.** The 1440×900
lens-scroll assertion had zero pixels of margin under its
`toBeGreaterThan`; T-028's reconcile (the lens now renders a tree three
artifact rows shorter) tipped it to **780 against 780**. Reconciled
rather than nudged: the assertion was conflating "the frame holds" with
"this fixture is tall", so it is split —
`tools/e2e/tests/interview.spec.ts:385` asserts the region is BOUNDED at
every size and SCROLLS wherever the content genuinely exceeds it. s5's
file is left in place for triage; this records that its prediction was
correct.

### Reconciles forced by the switch — changed, never loosened

The streak fixture is a FINISHED plan (three task files), so every
existing test that used it to exercise the LENS now renders the BOARD.
Each was repointed at the tree the lens is actually for, with its numbers
re-derived (9 files → 6, 9 artifact rows → 7 with the banking map's
`docs/tasks/T-*.md` placeholder back, stage ~8 → ~7):

- `app/test/genesis-mount.test.tsx` — a `midInterview()` helper that
  subtracts `docs/tasks/` and **fails loudly** if the fixture stops
  carrying exactly three of them.
- `tools/e2e/fixtures/shell.ts` — a `streakMidInterview` sibling with the
  same guard, taken by `genesis-screen.spec.ts` (3 uses) and by
  `interview.spec.ts`'s two lens-subject specs.
- `app/test/shell-frame.test.tsx` — T-048's `min-h-0` chain walk grew a
  **THIRD chain** for the board half (`div.flex → genesis-board →
  genesis-pane-slot → genesis-split → genesis-screen`), with the card
  asserted inside the region so the walk is over a rendered tree.

### The poison sweep — 51 bodies, 51 RED, all restored from git

**43 source mutations (M01–M43) applied one at a time**, each to the
THING UNDER TEST and never to a test, each restored with
`git show HEAD:<path>` (authoritative — never from a scratch copy), plus
**6 lane mutations (E1–E6)**. Every new or changed body reddens under at
least one of them:

    vitest, new/changed bodies:   45 / 45 red
      test/crescendo.test.ts         27
      test/crescendo-dom.test.tsx    12
      test/interview-chat-dom.tsx     4  (criterion 6)
      test/genesis-mount.test.tsx     1  (the boundary defect)
      test/shell-frame.test.tsx       1  (the third chain)
    lane, new/changed specs:       6 / 6 red

**Zero vacuous bodies.** (Of those five files' 92 total bodies, 58
redden; the remainder are T-027/T-037/T-048 bodies this task did not
touch and whose mutations were not in the matrix.) Restoration verified
INDEPENDENTLY of the sweep: `git status --porcelain` empty,
`git diff HEAD` empty, and per-file sha256 equality against
`git show HEAD:` for all eight poisoned sources — including
`app/src-tauri/src/lib.rs` and `agent-store.ts`, which two mutations
touched and both of which are 0-byte diffs in the shipped branch.

### Suites, run first-hand, no piping through tail

- **lib/parser** `npx vitest run` → **197/197 (10 files)**; `npx tsc
  --noEmit` clean. 0-byte parser diff, as a task that declares no
  component must have.
- **app** `npx tsc --noEmit` clean · `npm run build` exit 0 ·
  `npx vitest run` → **762/762 (40 files)**. **DERIVED: main's 718/38 +
  27 (crescendo) + 12 (crescendo-dom) + 4 (focus) + 1 (boundary) = 762 /
  40**, and it landed exactly.
- **app/src-tauri** bare `cargo test` → **299 passed + 3 ignored, 0
  failed**, exit 0 read from `$?`, **zero warnings**, 15 binaries
  (108/0/0/32/123/0/7/13/3/7/0/2/4/0/0). **DERIVED: main's 299 + this
  task's ZERO Rust = 299.**
- **tools/e2e** `npm run typecheck` clean · `NPUTER_E2E_PORT=14528
  npm test` → **65 passed**, headless, one worker, retries 0, no skips.
  **DERIVED: main's 60 + 5 = 65.**
- **`npm run lint:tokens`** → `clean (112 files scanned)`, exit 0, zero
  allowlist. **DERIVED: 107 + 5 = 112** — `crescendo.ts`,
  `BoardCrescendo.tsx`, `crescendo.test.ts`, `crescendo-dom.test.tsx`,
  `crescendo.spec.ts`. `index.css` and `tokens.css` are outside
  `WALK_EXTENSIONS`, which is where the raw values legally live.
  `-- --selftest` → 49 samples green, 14 walk-policy checks green.
- **BOOT GATE (T-046): FIRED, RAN, GREEN.** The diff touches
  `app/src/**`. Scratch port **14733**, bind-probed free first:

      [boot-check] port 14733 free — spawning `npm run tauri dev -- --config {…}`
      [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer-T-028
      [boot-check] detected startup line 1/2: [nputer] project folder:
      [boot-check] app: [nputer] window "main" created
      [boot-check] detected startup line 2/2: [nputer] window "main" created
      [boot-check] process tree stopped (exit=null signal=SIGTERM)
      BOOT_EXIT=0

  Afterwards `lsof` on 14733 / 14734 / 14528 all empty. **1420 WAS LIVE
  THE WHOLE SESSION** — the human's app (pid 81705, cwd
  `/Users/ujju/Projects/nputer/app`, started 05:38, still listening at
  the end) was probed read-only four times and was never bound,
  contacted or signalled. Every install went into this worktree's own
  `node_modules`, so T-052's fresh-install hazard never applied.

### What was deliberately NOT done

- **No dispatch affordance** (F-04 fenced) — asserted mechanically rather
  than remembered.
- **No board file changed.** `app/src/components/board/**` is a 0-file
  diff. The entrance transition is a CSS descendant rule keyed on the
  card's existing `data-testid` precisely so it did not have to be.
- **No new component declared** — composition only, so T-024's
  three-fixtures rule does not fire and `lib/parser/test/smoke.test.ts`
  is untouched.
- **`docs/architecture/graph.json` NOT regenerated** — the integrator's
  ritual, and doing it on a branch guarantees a conflict.
- **`GenesisPane.tsx`, `genesis-derive.ts`, `agent-store.ts`,
  `interview-model.ts`, `app/src-tauri/**`, `capabilities/**` — all
  0-byte diffs.** The lens, the derivation and the runner store were
  never in this task's way.
- **No new dependency**, no manifest line, no grant. `EXPECTED_GRANTS` is
  byte-unchanged and `acl_pin.rs` re-pins the 92-grant `core:default`
  set green inside the 299.
- **No `status: built`** — that is not one of TASK-FORMAT's eight
  statuses; the card stays `building` for the integrator.
- **The elapsed clock has no durable origin.** It measures from when THIS
  app session first put the interview on screen for this project, so an
  app restart RE-BASES it to zero while a remount does not. A durable
  origin would need a timestamp under `.nputer/` (which this task is
  fenced out of writing) or a first-event stamp on `genesis_status`
  (which is C-14's). Filed as **T-028-s1**.
- **The detail panel opens over the interview.** Clicking a card on the
  genesis board opens T-005's `fixed inset-y-0 right-0` drawer across the
  whole window rather than inside the right half. That is the real
  board's own behaviour, inherited by composing it, and changing it would
  mean editing a board file. Filed as **T-028-s2**.

### @human — visual judgment, listed and never performed (headless only)

The card already lists the big one (a real, timed, end-to-end genesis on
a toy idea, judged live). Five smaller ones this build produced:

1. **The completion panel in LIGHT AND DARK.** It has no design source at
   all (see finding 2 above) and is built from the `status-done` family;
   the same caveat T-027's challenge treatment carries applies here, one
   screen later.
2. **The board at 640–800px.** Columns have a 320px floor (T-006), so on
   the right half the genesis board scrolls SIDEWAYS from three columns
   up. Correct by construction, and the same question T-034-s1 asks of
   the map's wave 0: is it USEFUL there?
3. **The rain at fifty cards.** 260ms per card, all starting together
   when a decomposition lands in one snapshot. Whether that reads as
   delight or as a flash is an eye's call; the token is one line
   (`--card-rain-duration`).
4. **"the board, so far"** as the right half's overline, against the
   lens's "the project, so far". Deliberately parallel; judge whether the
   handover reads.
5. **Does the completion panel belong ABOVE the board or below it?** It
   sits above, so the CTA is what the eye lands on. The alternative
   (board first, panel as a footer) makes the cards the reward and the
   CTA the afterthought.

## Verdicts
