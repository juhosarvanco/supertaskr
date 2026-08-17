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
verifier: claude-opus-5
built_by: claude-opus-5 @fresh
verified_by: claude-opus-5 @fresh
review: same-model
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

2026-08-17 — claude-opus-5 @fresh, verifier — same-model review:
**APPROVED** — all six criteria met and re-derived first-hand from
`2a9d124`. Merge base with main is `e41dd16`, so the diff under review is
`e41dd16..2a9d124` = **25 files, +2,887 / −62** (`git diff --shortstat`);
the range quoted in dispatch (`6e898ad..2a9d124`) excludes the first of
the four commits and understates it at 15 files. **Main has since moved
to `bd88b87` (T-051 merged), which makes T-028 the branch merging second
— see the merge hazard below; it is the one thing this card's integrator
must act on.** Nothing below was taken from the notes.

**Port discipline.** 1420 was observed with read-only `lsof` four times
(node pid **81894**, `[::1]:1420 (LISTEN)`, still listening at the end)
and was never bound, connected to or signalled. My own ports, each
bind-probed free first and each `lsof`-empty afterwards: lane **14901**,
lane mutations **14902 / 14903**, boot gate **14921**. No `tauri dev` or
boot-check strays. **No model call was possible:**
`git diff e41dd16..2a9d124 -- app/src-tauri/**` is empty (zero files), so
the task adds no Rust; the only webview→CLI path is `invoke`, mocked at
the module boundary in the vitest fixtures and short-circuited on
`!isTauri` in the served bundle. Every scripted decomposition wrote into
`mkdtempSync(tmpdir(), …)`; this repo's own `docs/tasks/` was never
written by a test.

**SUITES, all run first-hand, never piped through `tail`, every figure
reproducing the notes exactly:**

| suite | result | exit |
|---|---|---|
| `app` `npx vitest run` | **762 passed (762), 40 files** | 0 |
| `app` `npx tsc --noEmit` | clean | 0 |
| `app` `npm run build` | 263 modules, `index-DVAVecvn.css` 43.79 kB | 0 |
| `lib/parser` `npx vitest run` | **197 passed (197), 10 files** | 0 |
| `lib/parser` `npx tsc --noEmit` | clean | 0 |
| `app/src-tauri` `cargo test` | **299 passed + 3 ignored, 0 failed**, 15 binaries, zero warnings | 0 |
| `tools/e2e` `NPUTER_E2E_PORT=14901 npm test` | **65 passed**, 1 worker, retries 0, no skips | 0 |
| `tools/e2e` `npm run typecheck` | clean | 0 |
| `lint:tokens` | `clean (112 files scanned under app/src, app/test, tools/e2e)` | 0 |
| `lint:tokens -- --selftest` | 49 samples green, 14 walk-policy green | 0 |

**BOOT GATE (T-046): FIRED, RAN, GREEN.** The diff touches `app/src/**`.
Scratch port **14921**, probed free first, verbatim:

    [boot-check] port 14921 free — spawning `npm run tauri dev -- --config {…}`
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer-T-028
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] process tree stopped (exit=null signal=SIGTERM)
    BOOT_EXIT=0

**CRITERION BY CRITERION.**

**1 — the lens becomes the real board as files land: MET.** The switch is
`parsedTasks > 0` (`crescendo.ts:91`), i.e. task files the PARSER
established records from, never a turn's text. `git diff --numstat
e41dd16..2a9d124 -- app/src/components/board/` is **empty — zero files,
zero bytes**, verified with `--numstat` and not from the summary; so are
`app/src-tauri/`, `capabilities/`, `lib/`, and every manifest and
lockfile. **No behaviour is duplicated into `BoardCrescendo.tsx`:** it is
140 lines of which the board is one JSX element, `<Board model={docs.model} />`
at `:135` — no column logic, no card, no panel, no ghost, no parked row.
The only new chrome is the overline/count header and the completion
panel, and the mark on the panel is `BankedMark` *exported* from
`interview-turns.tsx` rather than re-drawn. In the lane the mounted board
is the real one: three `task-card`s carrying `data-task-id`
`["T-001","T-002","T-003"]` read off the files.

**2 — completion state, elapsed, one CTA: MET.** The derived signal
(highest turn settled `completed` · nothing in flight · parseable board)
is reversible and is **not** a latch, confirmed both pure and live:
`completionOf(docs,[T1 completed],true)` → `turnInFlight`;
`[T1 completed, T2 running]` → `lastTurnUnsettled`; `[T1, T2 completed]`
→ `{complete:true,turns:2}` — it comes back, so it is not one-shot. The
live path retracts **synchronously**: `interviewBusy = ui.busy || isTurnInFlight(genesis)`
and `sendAnswer` sets `ui.busy` before any await, so the panel stands
down on the keypress, ahead of IPC. **It never reads model output**,
proven rather than read: `completionOf` fed a `GenesisTurn` Proxy that
THROWS on `text`, `activity` and `error` returns `{complete:true,turns:1}`
unharmed. The handoff crosses no boundary — `openBoardFromGenesis` is a
pure `ShellState → ShellState` phase move guarded on `phase !== "genesis"`
and `docs.projectDir === ""`, and after the lane's real click
`shell.docs.projectDir` is unchanged and `genesisDir` is null.

**3 — elapsed indicator, zero new IPC, zero telemetry: MET, re-derived
independently.** The nine-command set derived twice by me: from `app/src`
call sites — six `invoke<T>("…")` literals (`docs_snapshot`,
`genesis_cancel`, `genesis_send_turn`, `genesis_start`, `genesis_status`,
`index_repo`) plus three through `runPicker(command)` at
`watcher-store.ts:836/847/857` (`pick_project_folder`,
`pick_genesis_folder`, `start_genesis_here`) — and from
`invoke_handler!` at `lib.rs:391-403`, which lists the identical nine.
Union = 9, intersection = 9. `agent-store.ts` is a **0-byte diff**, so
the crescendo reaches the runner through C-14's existing exports. The
clock is a module-local number with no channel out; my own sweep of
`app/src` (not just `app/src/genesis/`) for `fetch(`, `XMLHttpRequest`,
`WebSocket`, `sendBeacon`, `localStorage`, `sessionStorage`, `indexedDB`,
`EventSource`, `writeTextFile`, `writeFile`, `mkdir` returns nothing. The
timer's move from the design's lens footer to the chat header is
**correct and disclosed** (notes finding 3): T-028 replaces the lens at
decomposition, so the footer slot would take the elapsed time off screen
at the moment being timed. The restart re-base rule is recorded on
`startGenesisClock` and filed as **T-028-s1**.

**4 — planning theater refused: MET, and this is the one I attacked
hardest.** Seven independent shapes, each through the real parser on real
bytes: zero task files → `noBoard`; seven files, none parsing →
`taskFiles 7 / parsedTasks 0 / failing 7 / showBoard false / allFailing
true`, completion `noBoard`; one good beside three torn → board with **1**
card and an honest header (`1 card · 4 task files · 3 not parsing`);
`docs/tasks/README.md`, `docs/tasks/notes.txt` and
`docs/tasks/archive/T-999-old.md` → `taskFiles 0`, no board (the
predicate is flat + `T-*.md`); a failed or cancelled tail →
`lastTurnUnsettled`. Through the real screen: `data-half="lens"`, no
board, no panel, zero cards, chip reading `3 parse errors`, and the torn
files still ROWS on the lens. **A board that tears AFTER completion
renders** keeps its cards by the last-good contract and the header says
`3 cards · 3 task files · 3 not parsing` — honest, and consistent with
the rest of the app rather than a hole. **A folder that already has a
plan can never reach this screen at all:** `apply_genesis_folder` refuses
genesis when `probe.has_plan()` (`roadmap || tasks`) and opens it as a
project, so "celebrate a plan the interview did not write" is closed at
the Rust gate. **The executor's residual worry reproduces exactly** —
one settled turn plus one card on disk reads `{complete:true,turns:1}` —
and I judge it **ACCEPTABLE**: task files land only at decomposition, the
window opens only after that turn settles, the reading retracts the
instant the user answers again, and the alternative (waiting for a
model-emitted closing marker) is the thing ADR-017 forbids. It is
disclosed in `crescendo.ts`'s header and in the notes.

**5 — reduced motion: MET.** One `motion-safe:` variant and no second
mechanism; the only ungated occurrence of `board-rain` anywhere under
`app/src` is the `@utility board-rain {` declaration itself. In a real
browser: `animation-name: card-rain`, `0.26s`, iteration `1`, fill-mode
`none`; under `emulateMedia({reducedMotion:"reduce"})` the name becomes
`none` **and the three cards are still there**. **s4 is outside this
card's fence and correctly so:** the bare `.board-rain [data-testid=task-card]{…}`
rule IS in the shipped sheet (`app/dist/assets/index-DVAVecvn.css`),
because Tailwind emits a bare rule for every `@utility` — the same is
true of `animate-status-pulse`. Nothing in this card USES it, and the
general closer is a fifth pattern in `tools/e2e/scripts/lint-tokens.mjs`,
which is T-038/T-045's file and another task's gate.

**6 — the answer box keeps the keyboard: MET, and the tripwire
DISCRIMINATES.** I deleted the entire refocus effect from
`InterviewChat.tsx` and re-ran the lane:

    ✘ 6 [chromium] › tests/interview.spec.ts:486:1 › Enter is input-local…
      Error: expect(locator).toBeFocused() failed
      Expected: focused
      Received: inactive
        > 517 |   await expect(page.getByTestId("interview-input")).toBeFocused();

RED, at exactly the inverted line, with the compensating `.click()` gone.
The jsdom halves are not vacuous either: deleting the anti-theft clause
reds `focus moved elsewhere DURING the turn is not stolen back`, and
recording the flag unconditionally (`heldFocusAtSubmit.current = true`)
reds `a send from the BANK BUTTON leaves the focus on the button`. The
guard is genuine — focus deliberately moved away is not stolen back.

**THE ERROR-BOUNDARY DEFECT — I drove T-037's Proxy myself, four ways,
all survived.** Lens phase → hostile: screen, chat and honest fallback
all present. Board phase → hostile: same, and the board half stands down.
The full transition in one mount (lens → hostile → board → hostile →
recovered board) survives every step and retries on the next honest
snapshot. And a tree that poisons **`model` rather than `effective`** —
past `showsBoard`'s catch, so the throw happens *inside* `BoardCrescendo`
— is caught by the boundary with the screen still standing. Mutating
`showsBoard(docs)` back to the unguarded `boardReadiness(docs).showBoard`
reds both `genesis-mount.test.tsx` boundary bodies. The defect was real
and the fix is real.

**T-027-s5: the split assertion is a GENUINE STRENGTHENING.** I measured
the lens region myself in the real browser with `streakMidInterview`:
1024×768 → `scrollHeight 876 / clientHeight 648` (margin **228**);
1280×720 → `792 / 600` (margin **192**); 1440×900 → **`780 / 780`,
margin 0**. The executor's "780 against 780" is exact. The old line
asserted `scrollHeight > clientHeight` at all three cells; at 1440×900 it
fails against CORRECT code, so it had zero discriminating power there —
it was measuring the fixture's height. The new set adds
`overflowY === "auto"` and `clientHeight < viewport.height` at **all**
three cells (the old line asserted neither) and retains
`scrollHeight > clientHeight` at the two where content genuinely
overflows with 192–228px of margin. The retained half is provably
falsifiable rather than tautological: the same expression on the same
locator evaluates **false** one cell over. Coverage strictly increases;
the only thing dropped is a cell where the assertion could not
distinguish working from broken. Not a way of making a failing test pass.

**MY OWN POISON SWEEP — 18 bodies, all RED, all restored and sha-verified
against `git show HEAD:`.** Namespaced, run inline rather than from a
script (the shared scratchpad clobber hazard was avoided by never writing
one). Source mutations only, never a test. Every one reddened a
criterion-relevant body: `showBoard` on files instead of records (reds
criterion 4 in unit AND DOM); `allFailing` constant; each of
`completionOf`'s four conditions removed separately; highest-turn →
`turns[0]`; `showsBoard` losing its catch (reds both boundary bodies);
`<1 min` → `~0 min`; the gate dropped from `motion-safe:board-rain` (reds
the jsdom sweep AND, in a real browser, `animation-name` staying
`card-rain` under `reduce`); a second button on the panel (reds the F-04
fence); each elapsed slot removed; the screen calling the unguarded
derivation; `genesisDir` left set by the handoff; the clock's idempotence
removed; the rain token moved to 400ms; the entrance utility painting
nothing. `git status --porcelain` empty after every restore, per-file
sha256 equal to `git show HEAD:` in all 18 cases.

**SECURITY SWEEP: CLEAN.** No new dependency — **no manifest or lockfile
appears in the diff at all** (`package.json`, `package-lock.json`,
`Cargo.toml`, `Cargo.lock`: 0 files). No `innerHTML`,
`dangerouslySetInnerHTML`, `outerHTML` or `insertAdjacentHTML` anywhere
in `app/src` or `tools/e2e`. No shell string, no `child_process`, no
`new Function`. No API key, token or bypass-permissions flag (the only
"token" hits are the design-token vocabulary). `EXPECTED_GRANTS` is
**byte-unchanged, proven by sha256**: `app/src-tauri/src/acl_pin.rs` is
`8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e` at
both `e41dd16` and `2a9d124`; `app/src-tauri/**` and `capabilities/**`
are 0-file diffs and the 92-grant pin re-runs green inside the 299.
**ADR-017 holds: the app still only renders what lands** — no
`writeTextFile`, `writeFile` or `mkdir` anywhere under `app/src`.
`file(1)` over all 25 changed files classifies none as `data` (all
`UTF-8 text`); `git grep` was used wherever a result mattered.

**TWO NEW SUGGESTIONS, filed at s5 and s6.**

**T-028-s5 — THE MERGE HAZARD, REPRODUCED, AND THIS CARD'S INTEGRATOR
OWNS IT.** T-051 merged first (`bd88b87`), and its new
`tools/e2e/tests/window-contract.spec.ts` will go red when T-028 lands.
Its `genesis()` helper at `:104` applies the FULL `streakFixture` at
`:112`; under T-028 three parsed tasks means the right half is
`BoardCrescendo` and `genesis-artifact` does not exist. I simulated the
merge inside this worktree (T-028's code + T-051's manifest + T-051's
spec, port 14903): **3 of 5 specs fail — `:206` and `:318`×2 —
`Expected: "40/40" / Received: "absent"`**; the breakpoint and minHeight
specs are unaffected. The reconcile is one line, repointing `genesis()`
at the `streakMidInterview` this task adds, with `reach()`'s `"40/40"`
re-derived for a seven-row tree. T-051's own verifier predicted this as
**T-051-s6**; s5 is the measurement and the fix.

**T-028-s6 — the ambient node surface now lets `app/src` write files and
still typecheck.** `app/tsconfig.json` includes both `src` and `test`, so
`app/test/node-builtins.d.ts`'s declarations reach production code. T-028
extends it 30 → 47 lines with `mkdirSync`/`writeFileSync`/`rmSync`/
`mkdtempSync`. Measured: a probe at `app/src/verify-t028-probe.ts` that
imports and calls both write functions passes `tsc --noEmit` at exit 0 on
this branch, and fails with TS2305/TS2724 with only that `.d.ts` reverted.
Nothing does this today and T-028 introduces no write, but ADR-017's
free typecheck-level guard is gone and the sink sweep that would replace
it walks `app/src/genesis/` only. Not a blocker; the closers are cheap.

**Two non-defects confirmed as the dispatch said.** `status: building` is
correct — `built` is not one of TASK-FORMAT's eight statuses. And
`touches:` under-declaring `tools/e2e/` is the correct reading of the
lifecycle lock (fields freeze at `status: building`); it is flagged in
the notes, and the integrator should record `[app-interview, app-shell,
tools/e2e/]` as T-027's card does. Noted against the process, not the
builder.

**Not verified, and correctly listed as @human:** the timed end-to-end
genesis on a toy idea (criterion 2's ≤30 min), the light/dark completion
screenshots, and the five smaller judgment calls in the notes. Headless
only, per the standing rule; the boot check is not screen control.
