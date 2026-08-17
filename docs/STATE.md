# State

Updated: 2026-08-17 by integrator (T-027 merge), claude-opus-5 @fresh

## Just completed

**T-027 — the interview split view.** Milestone 3's flagship and the
largest card this project has run: size L, nine criteria, a planning
pass in ten sections, `app-interview` + `app-shell` + `tools/e2e`.
Built by `claude-opus-5 @fresh`, verified by `claude-opus-5 @fresh`,
`review: same-model`, **APPROVED first pass**. 26 files, +5,515 / −103.
Merge **`dc3ef5b`**.

**THE SCREEN STOPPED BEING A LENS AND BECAME A CONVERSATION.** That is
the whole of it, and it is worth saying in the terms a user would use.
Until tonight genesis meant: open a folder with no plan, then go to a
terminal, hand-drive the method, and watch the plan materialize in the
pane. Now the app asks you a question. A **640px planner chat** sits to
the left of T-024's lens, driven by T-025's `genesis-turn` channel, and
the interview **starts itself on arrival** (@human's ruling; an explicit
affordance stays as backup). One question is prominent with the history
quieter above it. You answer in a box that takes **⏎ to send, ⇧⏎ for a
newline**, and disables itself while a turn is in flight — single-flight
on the store's own `isTurnInFlight` flag, not a second boolean. A planner
turn opening with T-023's `pushing back:` prefix renders in the challenge
treatment, and that prefix is **inert by construction**: the same script
with and without the marker deep-equals except for the treatment.
Screen-scoped accelerators join T-049's ONE window listener rather than a
second one, with **⌘. to cancel**.

**NO SECOND REDUCER, AND THAT IS A DESIGN DECISION RATHER THAN AN
ECONOMY.** `reduceGenesisEvent` already coalesces deltas into `turn.text`
and replaces the buffer with the canonical `result` on `completed`. The
chat renders `turn.text` as the store gives it. There is exactly one fold
of that channel in the app, and `app/src/lib/agent-store.ts` is a
**0-byte diff** — C-14 was a fence, not a suggestion.

**THE BANKED CHIPS ARE THE PART TO REMEMBER.** A `banked → <artifact>`
chip appears when the planner writes a file — derived by diffing the docs
snapshot C-10's watcher delivers across turn boundaries, **never by
reading what the model said**. `bankedSince`'s signature admits no event
stream at all, so the property is enforced by the TYPE and not by
discipline. It is the difference between a transcript and a record: the
chat is a view of the DISK, not of the dialogue.

## The evidence that makes it trustworthy

**THE `textDelta`-AFTER-`completed` QUESTION IS ANSWERED, AND THE ANSWER
IS "UNREACHABLE BY CONSTRUCTION" RATHER THAN "HANDLED".** The verifier
attacked it instead of re-reading the claim: every exit from the read
loop enumerated — **cancel (:1109), Oversize (:1222), EOF (:1224),
StartTimeout (:1237), Stall (:1241)** — and every one falls through to the
unconditional flush at **`runner.rs:1246`**. No `return`, no `?`, no early
exit between loop entry and :1246; between :1246 and `completed` at
**:1320** there is only the cancel re-read, terminate/reap and pure error
classification. **One thread, one atomic** (`Emitter::next`, `fetch_add`
on a single `AtomicU64` per Agent), and `spawn_turn`'s single emitter
clone is serialized by `begin_turn`'s compare-exchange latch. So the
runner cannot stamp a delta above a completion for the same turn. **And
the counterfactual test genuinely discriminates** — `interview-model.test.ts:209`
feeds a seq-3 delta after a seq-2 completion and asserts the canonical
tail, exercising an append branch the reachable tests never reach. No
suggestion against C-14 is owed. This is the cleanest "nothing is owed"
in the project's history, because it is a proof rather than an absence of
counterexample.

**24 CHIP-ATTRIBUTION PROBES, all green, driven through the REAL chat.**
`completed.text` naming three real docs paths with the disk unchanged →
**zero chips**. `activity` labels naming docs paths → **zero**. A
deletion → no chip. A file changed in two turns → one chip per turn;
changed twice inside one turn → one chip. A snapshot arriving before
`started` **primes rather than chips**. Pre-existing docs do not chip on
turn 1. **A human writing a file mid-interview produces an IDENTICAL
chip** — which is not a leak but ADR-006's hand-driven mode rendering
correctly, and it is the proof that no causation was inferred: the chip
means *this file changed*, never *the model did it*. Hostile chip paths
(`docs/__proto__.md`, `docs/constructor.md`, a path containing an `img`
tag) render as text: zero `img` elements, zero prototype pollution, zero
`on*` attributes anywhere in the tree.

**THE GEOMETRY TABLE AT SIX VIEWPORTS**, the verifier's own probe:

    800x600  | chat 640 @ x80  | lens ABSENT
    1023x768 | chat 640 @ x192 | lens ABSENT
    1024x768 | chat 640 @ x0   | lens 384
    1025x768 | chat 640 @ x0   | lens 385
    1280x720 | chat 640 @ x0   | lens 640
    1440x900 | chat 640 @ x0   | lens 800

Page height equals the viewport at every one, the column is bounded at
every one, **the split appears at exactly ≥1024** and the chat centres
when alone. **T-048's four screens re-run unchanged** at 800x600 and
1280x720 — nothing regressed; the one overflow (no-plan card at 800x600,
663/600) is T-048-s4's, pre-existing and already filed.

**133 TEST BODIES POISONED, 133 RED**, across all eight new-or-changed
vitest files (16+10+3+34+9+46+4+11). Not one body is vacuous. All eight
restored **sha256-identical**. (The notes said 132; the count is 133 —
off by one, conclusion unchanged and slightly stronger.)

## What was found rather than claimed

**THREE DEFECTS THE TESTS FOUND AND THE DESIGN FIXED** — these are the
reason to trust the suite, because each was found by a test rather than
by review:

1. **`stageOf` called the lens's derivation OUTSIDE T-037's error
   boundary.** One torn file on disk would have taken the whole interview
   down — not degraded the lens, taken the SCREEN down. Now it catches,
   and its pin drives a Proxy that throws on every read.
2. **`startInterviewSource` rejected at the root** when `listen` was
   refused. Now it catches and logs loudly; the residual (a refused
   subscription is invisible ON SCREEN) was **filed as T-027-s2 rather
   than half-fixed**, because the honest close wants a field on C-14 and
   C-14 is fenced.
3. **`bankedSince` refused the interview's FIRST snapshot.** Its guard now
   asks whether the baseline knew a project at all, using `docs-model.ts`'s
   own sentinel; both halves pinned.

**THREE PLAN NUMBERS THAT DID NOT REPRODUCE**, all three confirmed by the
verifier and no fourth found. (1) The plan's "26-chord sweep asserting a
whole set" **did not exist** — at the branch point there were eleven
hand-listed `chordOf(...)` cases and no whole-set equality. The builder
built the real thing: **47 keys × 2 modifiers**, collected into an object
and compared with one `toEqual`, so an unlisted letter can no longer be
claimed silently. (2) **The lens is W−640, not W−641** — the rule sits
inside the 640 under box-border. (3) A stale line citation. The standing
rule earns its keep again: *a numeric claim in a card body is evidence to
reproduce, not a brief to implement.*

**THE SIXTH VACUOUS ASSERTION OF THE NIGHT, AND THE FIRST IN A NEW TEST
RATHER THAN A RECONCILED ONE.** `interview-model.test.ts:468`'s marquee
`expect(byHuman).toEqual(byPlanner)` compares `f(x)` with `f(x)` for
byte-identical arguments — deletable with the suite green. Criterion 3
survives on its other assertions and on the DOM suite's real-chat tests,
so this was **not** a rejection. Filed as **T-027-s4**, together with the
`bank()` helper being a hand-copy of the chat's effect that has **already
drifted** by the project-switch clause. Also **T-027-s5**: the 1440×900
lens-scroll assertion has **zero pixels of margin** under its
`toBeGreaterThan` and will flake on any content change.

**THE DEV GATE.** `NODE_ENV=development npm run build` **does** flip the
build half — all three harness names land in the bundle. That is
**T-041-s4's known, already-filed lever and not a T-027 regression**. The
**runtime `__TAURI_INTERNALS__` guard survives it**, verified inside that
very bundle at the minified install site. The restored production build
is byte-identical.

**T-027-s1 SHOULD BE TRIAGED HIGH — flagged here deliberately.** *The
answer box loses focus after every send.* Filing it was correct (it is out
of no fence, it is honest, and it is pinned in the lane by a real
`not.toBeFocused()` tripwire at `interview.spec.ts:481`). But the
verifier's judgment, which this merge endorses: **it is the first thing
the human will feel on this screen, within ten seconds.** You type, you
press ⏎, and then you have to click back into the box to keep talking —
in a screen whose entire premise is a conversation.

## THE MERGE ITSELF

**IT WAS CLEAN — the first clean merge since T-014's conflict, and the
clean case has a proof the conflicted one could not have.** Merge
**`dc3ef5b`**, merge-base **`e92056a`** (a CHECKPOINT — the
dispatch-from-checkpoint rule in practice, which is why this branch
inherited a CURRENT graph and no inherited red), main before at
**`8120e0d`**.

Both sides enumerated before merging: **26 branch files against 41
main-side**, and **`comm -12` returns ZERO**. Main took T-014
(`bdada11` + `d77a33e`) and the T-052 card in that window and touched
**nothing** T-027 touched — in particular it never stamped T-027's card,
which is exactly where T-014's conflict lived. `git merge-tree
--write-tree` was run FIRST and predicted tree **`0087e43a`**; the merged
tree **IS `0087e43a`, byte-equal**. That equality is only available on a
clean merge (at T-014 the prediction was the CONFLICTED tree and
correctly did not match), so it is worth using while it is: the merge
introduced nothing beyond the two parents' contents. `8120e0d..HEAD` is
**exactly the branch's 26 files** and nothing else; `git diff --check`
clean.

**BOOT GATE (T-046): FIRED, RAN, GREEN.** Trigger computed from
**`8120e0d..HEAD`** — the `<main-before>..HEAD` rule, used deliberately —
returning **9** files, every one under `app/src/**` and every one this
branch's. The naive merge-base derivation (`e92056a..HEAD`) returns
**36**, the extra **27** being T-014's crate work already on main and
already boot-gated at its own merge. Nothing hinged on it again — both
derivations fire — but the naive one would have made a frontend-only
merge look like it rewrote the indexer crate. **Six integrators have now
hit this; the fix is still one clause in both CONVENTIONS bullets naming
which diff.** Scratch port **14611** (probed free; 1420 avoided, and every
port earlier sessions used tonight avoided):

    [boot-check] port 14611 free — spawning `npm run tauri dev -- --config {…}`
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] process tree stopped (exit=null signal=SIGTERM)
    BOOT_EXIT=0

**Exit 0 taken from `$?` unpiped, both `[nputer]` lines.** Afterwards:
`lsof` on 14611 empty, on 14610 empty, on 1420 empty; `pgrep` for
`tauri-boot-check`, `tauri dev` and `vite` all empty.

**SUITES ON MERGED MAIN**, all re-run first-hand, fresh installs in all
three packages, ADR-011 order, every expectation DERIVED rather than
inherited from either side:

- **lib/parser** `npm ci` (0 vulnerabilities) + `npm run build` + `npx
  tsc --noEmit` + `npx vitest run` → **197/197 (10 files)**. Unmoved, as a
  branch with a 0-byte parser diff must be.
- **app** `npm install` (499 packages, 0 vulnerabilities), `npx tsc
  --noEmit` clean, `npm run build` exit 0, `npx vitest run` → **718/718
  (38 files)**. **DERIVED: main's 625/35 + the branch's 93 tests / 3 files
  = 718/38**, and it landed exactly. Bundle `index-GxM6iwW9.js`
  (483,426 B) — the verifier's restored production hash, reproduced —
  and `index-DSR1ACex.css` at 43,304 B.
- **app/src-tauri** bare `cargo test` → **299 passed + 3 ignored, 0
  failed**, exit 0, **zero compiler warnings**, summed across **15 test
  binaries** (108/0/0/32+1/123/0/7/13/3/7/0+1/2+1/4/0/0), **NOT piped
  through `tail`**. **DERIVED: main's 299 + the branch's ZERO Rust = 299.**
  Note the branch-point figure was 220 — that is pre-T-014 and is not
  main's; deriving from the merged parents rather than trusting either
  side is what made this land first try.
- **tools/e2e** `npm ci` (0 vulnerabilities) + `npm run typecheck` clean +
  `NPUTER_E2E_PORT=14610 npm test` → **60 passed in 10.1 s**, headless,
  one worker, retries 0, **no skips, no retries, no flakes**. 54 on main
  + T-027's 6 = 60.
- **`npm run lint:tokens`** → `clean (107 files scanned under app/src,
  app/test, tools/e2e)`, exit 0, **ZERO allowlist**. **99 → 107 is +8,
  not +9** — derived rather than counted off the merge's file list, which
  is the trap here: T-027 touches 10 files under those roots but
  `tools/e2e/tests/shell-harness.ts` is **modified, not added** (it is
  T-041's, extended into a third copy of the wire mirror), and
  `index.css` / `tokens.css` are outside `WALK_EXTENSIONS`
  (`.ts|.tsx|.mjs`). So the corpus grows by the four `app/src/genesis/**`
  modules, the three `app/test/**` suites and `interview.spec.ts`.
  `-- --selftest` → **49 samples green, 14 walk-policy checks green**.

## The graph regen — and the trap count went UP

STANDING INTEGRATOR PRACTICE (T-009-s1), **TWENTY-SIXTH** exercise, and
this is the largest regen the project has run.

**FIRED and NOT a no-op**: 18 code files outside `docs/`. Order per
`ceaa949` — regen to MEASURE, then the fixture edits, then the FINAL
regen, because the fixtures are themselves indexed files and editing them
after the regen makes the graph stale again (confirmed live here: the
sha moved between the measuring regen and the final one).

**The graph:** **100 → 107 files**, **757 → 853 symbols**, **1170 → 1315
edges** (import +32, call +58, type_ref +55). Languages still `["ts"]`.
Final sha256 **`5b36510e7165fd7805e99a16998191c46d7f94dcf2c6dc2ea3c88625b7934e0c`**,
**497,426 bytes**. **DETERMINISM PROVED**: two consecutive regens are
byte-identical (`cmp` clean). Plain non-golden self-check with
`NPUTER_UPDATE_GOLDEN` confirmed UNSET at the shell: **`self_graph_is_current
… ok`, exit 0**. Cross-checked with the SECOND instrument T-014 shipped:
`nputer-index index --check` → `graph.json is CURRENT (497426 bytes, 107
files, 853 symbols, 1315 edges)`, exit 0. **Two independent instruments,
both green.**

Derived: relation table **28 → 30**, findings **9 → 11** (eight D1 +
three D3), drift **6 → 7** with **C-13 joining**, `unmappedFiles` `[]`
and `derived.issues` `[]` unmoved. Per-component: **C-05 47 → 50**,
**C-13 2 → 6**; every other component unmoved.

**TEN ASSERTIONS MOVED, NOT NINE — the forecast was one short, and the
missing one is exactly the kind it warned about.** The dispatch and the
verdict both enumerated **9 `expect()` + 4 `it()` names**, including the
three invisible-to-a-count traps. All four `it()` names and all nine
`expect()`s reproduced, including:

- **the two GROWN `fileEdges` lists** — `D1:C-05->C-13` 4 → **10** (two of
  the six additions are SOURCE edges: `App.tsx` → `interview-source.ts`
  and `GenesisScreen.tsx` → `InterviewChat.tsx`) and `D1:C-05->C-14`
  1 → **3**;
- **the assertion that INVERTS** — `map-dogfood-render.test.tsx`'s
  `expect(node("C-13").className).not.toContain("map-drift-ring")` becomes
  `.toContain(...)`, because C-13 is a D1 **source** for the first time;
- **the unforecast `C-13→C-05` row** — both new chat components import
  `components/ui/button.tsx`, the first genesis-side use of a shared UI
  primitive.

**THE TENTH, which nobody forecast**, is `map-dogfood-render.test.tsx`'s
`[data-relation="undeclared"]` count, **6 → 8**. It hides in the SAME
`it()` body as the 28 → 30 row count, one line below it — so vitest never
reaches it while the first is red, and a reader checking the enumerated
list would have believed the body was done. **Same shape as the two grown
lists, one level deeper: a second assertion inside an already-moving
body.** Derived here from the added-file list and the registry globs
before anything was run, which is the rule working.

`lib/parser/test/smoke.test.ts` **deliberately not touched** — T-027
declares no component and changes no registry file, so T-024's
three-fixtures rule does not fire. Confirmed by re-running the parser
after the regen: **197/197**.

## In progress / broken right now

**NOTHING IS BUILDING.** No lane is active, no worktree is open, the tree
is settled. Next is **the third triage over a settled tree** — 66 open
suggestion files (**9 parked + 57 suggested**).

**T-030-s3 IS STILL THE CORRECTNESS-OF-RECORD ITEM AND ITS DEADLINE HAS
PASSED**, now three merges older. `blocked_by` edges can silently
RE-POINT when an unpadded sibling id appears, and T-034 shipped the
waves, the critical path and the worst blocker — all computed from
`blocked_by`. A silently re-pointing edge is a wrong picture in a pane
the human is about to look at. Unchanged by this merge, and it has now
outlived two triages.

## INTEGRATOR JUDGMENT CALLS, recorded

- **ROADMAP: EDITED, and the milestone-3 progress block got a REAL
  rewrite rather than another appended paragraph.** The established
  discriminator ("does the task add a USER CAPABILITY") is not close here
  — T-027 changes what the app IS. The rewrite says what a user can do
  end to end now, in a user's words, and it says the three things that
  are still not true, plainly and in the same breath: **T-028 and T-029
  remain**; **the transcript does not survive a remount**; and **not one
  planner turn has ever been observed against a real model** because this
  machine's CLI token is revoked. The stale clause in T-025's paragraph
  ("Nothing in the UI calls the runner (T-027 owns that)… the pane is
  currently full-width where it was drawn as the right half") was
  corrected rather than left to contradict the paragraph below it.
  **The milestone is explicitly NOT claimed.**
- **THE F-03 BACKBONE LINE: NOT EDITED, deliberately.** F-06's line took
  "Since T-034" and "Since T-014" clauses because those tasks changed what
  the FEATURE is. T-027 changed nothing about what F-03 is — the line
  already reads "planning interview as split view (planner chat + board
  materializing live)", which was aspirational this morning and is
  descriptive now. A backbone line that comes true does not need editing;
  the milestone's Progress block is where "it came true" belongs.
- **ARCHITECTURE: EDITED IN FOUR PLACES, and the dispatch's premise for
  one of them was WRONG — checked before editing, per the standing
  correction.** The dispatch asked for "C-13's row/status". **There is no
  C-13 row.** The Components table stops at **C-07**; C-08 through C-14
  have never had rows, which is the same fact the standing correction
  records about C-10. So the edits went where the content actually lives:
  (1) **C-05's row**, whose tail literally read "T-027 still owes the
  split view's left half" — now describing the split, the root-level turn
  subscription, the scoped accelerator entry and the no-second-reducer
  rule; status stays **building** (the board/map/shell work continues).
  (2) **The Genesis Interfaces bullet**, whose "What is NOT yet true: no
  UI calls any of it (T-027)" is now false — replaced with what the call
  looks like, the single-fold property, and the chip rule stated as a
  contract ("a chip is evidence a FILE changed and can never be evidence
  a model said so"), plus what is still not true. (3) **The Code layout
  bullet**, which described C-05→C-13 as the one undeclared genesis edge —
  T-027 makes C-13 a drift SOURCE for the first time, in two new
  directions, and the architect should meet that where component
  territory is described. (4) **The Test surfaces bullet**, which said
  "Two harnesses" and is now three; its own stated rationale is that these
  are named there rather than discovered in the source, so leaving it at
  two would have defeated the bullet.
- **THE REGISTRY: NOT EDITED.** `C-13-genesis-pane.md` does not declare
  C-14 or C-05, and after this merge both are real, observed and
  undeclared. **That is the architect's territory** (ADR-004), editing a
  registry file is the one thing that fires T-024's three-fixtures rule,
  and **draining a finding at the merge that created it destroys the
  signal**. Flagged, not absorbed.
- **NO NEW ADR (three-prong).** (a) T-027's decisions were RULED and
  landed in the right instruments already: the composition (640 chat +
  lens) and the auto-start are **@human rulings recorded in the card**;
  the chip rule is not a new decision but **ADR-017 applied to the
  transcript** — "the spawned planner is the writer; the app renders what
  lands" is exactly why a chip may only come from a file — and it now
  appears in ARCHITECTURE's Interfaces where a reader will meet it.
  Writing ADR-018 would restate ADR-017 in narrower words. (b) **Prong
  two verified MECHANICALLY, not asserted.** ADR-012/ADR-010 hold, and
  the proof is stronger than "no new grants": the app/src IPC call-site
  delta is **ZERO** — `#[tauri::command]` and `invoke_handler` delta zero,
  `app/src-tauri/**` a 0-file diff, `capabilities/**` a 0-file diff, and
  `agent-store.ts` a **0-byte diff**, so the first UI consumer of the
  runner reaches it entirely through C-14's EXISTING exports and three of
  the four new modules import only TYPES. `acl_pin.rs` re-pins the
  92-grant set green inside the 299. ADR-017 holds: no `writeTextFile` /
  `writeFile` / `mkdir` anywhere in the added app code — the app still
  only renders what lands. ADR-009 holds: **zero** `innerHTML` or
  `dangerouslySetInnerHTML` across `app/src/genesis/**`. ADR-011 holds:
  the family restricted to `method/`, `capabilities/` and every
  manifest/lockfile/tsconfig/vite/vitest/tauri.conf/`.nputerignore`
  returns **ZERO** files. ADR-003 holds — **no model call was made
  anywhere**, and it was not possible to make one: zero Rust, and
  `invoke` is mocked at the module boundary in every vitest fixture.
  ADR-014/ADR-015 hold and were EXERCISED (committed, deterministic,
  proved current by two instruments). ADR-016 holds — the done card
  carries its full two-mark set. ADR-006 was exercised in an unexpected
  direction: the hand-written-file chip is it, rendering correctly.
  ADR-018 still does not exist; the register ends at **ADR-017**.
  (c) Prong three: the durable calls live in the card's §§1–10 plan, its
  criteria→evidence map, the fourteen proof obligations, the three
  defect write-ups and the verdict.
- **THE TASK FILE'S STAMPS WERE COMPLETE** on the branch — all five
  correct — so `status: building → done` is the ONLY line changed.
  **Parser-validated before and after: 0 issues both times**, and the
  re-parse reads all five stamps back correctly.
- **THE CONTROL-BYTE HABIT WAS RUN AND IS CLEAN.** `file(1)` over every
  file this merge wrote: all text, **none classified `data`**. Nothing
  requiring escape construction was written this merge, so no script was
  needed — but note the branch hit the **TWELFTH reproduction** of the
  hazard and one of tonight's put raw bytes into STATE.md ITSELF, so the
  habit stays. The branch's own fixture was generated by a script that
  builds escapes from `chr(92)` and verifies its own output.
- **THE SHARED-INDEX HAZARD did not recur.** `git diff --cached --stat`
  was checked before **both** commits and the staged set was exactly this
  session's each time. House shape held: **merge → checkpoint**, two
  commits.

## 1420 — still down, and this merge did not touch it

**A FIFTH INDEPENDENT SIGHTING.** 1420 was probed with `lsof` at session
start, immediately before the app's `npm install`, immediately before the
boot gate, and after everything: **no listener at any point.** It was
never bound, contacted or signalled. `pgrep` for `tauri dev` and `vite`
returns nothing anywhere on the machine.

**T-052's warning was heeded rather than assumed away.** T-052 (filed
tonight) records that fresh installs in this shared checkout remove
`node_modules` under a running dev server and are the likeliest cause of
the human's app dying. **The probe was re-run immediately before the
`rm -rf app/node_modules`** and came back empty, so there was nothing to
protect; had a listener appeared, the install would have gone elsewhere.
**The cause of the original death is still not established and is still
not guessed at.**

## Next up (1–4)

1. **THE THIRD TRIAGE, over a settled tree.** Nothing is building; this
   is the whole of the next session's work. **66 open files: 9 parked +
   57 suggested.** Six items should enter it already ranked, because they
   have been measured rather than supposed:
   - **T-027-s1 — the answer box loses focus after every send.** Ranked
     first on the verifier's judgment and this merge's: it is small, it is
     pinned by a real tripwire, and it is the first thing the human will
     feel on the flagship screen.
   - **T-030-s3** — still the correctness-of-record item, deadline passed,
     now three merges old.
   - **T-014-s8 — the interim regen rule's retirement, as ONE designed
     commit** touching CONVENTIONS + `workflow-parity.spec.ts` (+ `ci.yml`
     if `index --check` becomes a step). The `index --check` disposition
     is an architect ruling, not a mechanical edit. **The rule was
     exercised for the twenty-sixth time tonight.**
   - **"Dispatch lanes from the CHECKPOINT, not the merge"** (T-014-s3) —
     one line, six-for-six evidence, and **T-027 is the seventh worked
     example**: cut from `e92056a`, it carried a current graph and
     inherited no red.
   - **The `<main-before>..HEAD` clause** in both gate bullets — **six**
     integrators have now hit it.
   - **The Tailwind/`app/src-tauri` finding** from T-014's merge — a Rust
     identifier is in the shipped CSS and no gate can see the directory.
   - **T-027-s4/s5** (the tautology + the zero-margin assertion) and
     **T-027-s2/s3** join the untriaged pile.
2. **@human — THE MORNING'S AGENDA. The app is not running; 1420 is
   free.** When you restart it you pick up everything at once: T-042's
   genesis truthfulness, T-014's 23 CSS bytes, and **T-027's entire
   screen**.
   - **THE SIX T-027 VISUAL JUDGMENTS, none self-answerable, and they are
     the point of this milestone**:
     1. **The one-question-at-a-time feel** — is the current question big
        enough to be the only thing on the left?
     2. **The challenge treatment in LIGHT AND DARK.** The two new tokens
        have **no dark source in the design bundle at all** and are
        family-derived — this is the one place the design had to be
        extended rather than followed, so it is the one place your eye is
        the only authority.
     3. **The eight disclosed deviations**, especially the **line-height
        gap**: design 1.55/1.6/1.5 against the tokens' 1.43/1.45/1.41,
        read at real size. The tokens won pending your call.
     4. **The 640/lens balance at 1280 and 1440.**
     5. **THE LENS DOES NOT RENDER AT THE APP'S OWN 800×600 WINDOW.** The
        split needs ≥1024 and the app's configured window is smaller than
        that, so the shipped default shows the chat alone. Whether the
        default window should move sits beside **T-051's raise-the-window
        card** and T-048-s5's missing `minHeight`.
     6. **Does the header's "nputer + project path" read as the design's
        "nputer — new project"?**
   - **ONE REAL OBSERVED PLANNER TURN, on an authenticated machine** —
     still the biggest unobserved thing in the project, and now the ONLY
     thing standing between milestone 3 and an honest claim. This
     machine's `claude` OAuth token is revoked, so no model call has ever
     gone through the runner. **T-025-s2 carries the exact command.**
   - **The at-a-glance amber judgment**; **the launch shot**; **T-023's
     dry-run transcript quality** (worth re-reading now that a real chat
     renders it); **a Linux run** (the "watch the first CI run" item).
   - **T-050-s2 still matters most of the older set**: escaping the
     failure screen with "Open a folder…" rather than "Try again" reaches
     a board with real content that is **silently dead**. Use "Try again".
   - **The six T-034 judgments**, of which **WAVE 0 IS A WALL (T-034-s1)**
     is the big one: 32 of 50 cards in one wave, a 1440×3818 canvas in a
     ~600 px pane. The question is whether the lens is USEFUL there, not
     whether it is correct — correct it demonstrably is.
   - **The model badges should be SHORT** (T-030-s1): T-020's and T-024's
     cards should read `opus`; T-001's verified-by badge should read `+`,
     and **the judgment that is yours is that `+` is honest but ugly**.
   - **The header's density** (T-049's item); **T-024's pane light AND
     dark**; **T-026's front door light AND dark** (read **T-048-s4
     BEFORE T-048-s3** — s3's conclusion is wrong); the real picker flows;
     the `tauri dev` quit-the-app orphan check (T-025-s7's ~5 s hang is
     expected and harmless).
   - **The T-047-s6 stray, a decision not a look.**
     `~/.claude/projects/-private-var-folders-…-t047va-count-97806-…/` —
     outside the repo, deliberately not deleted. **Delete or keep.**
3. **MILESTONE 3 (F-03) — NOT CLAIMED, and the remainder is now small
   enough to name exactly.** T-023 → T-024 → T-026 → T-037 → T-025 →
   T-039 → T-041 → T-042 → T-048 → T-049 → T-050 → **T-027** are through
   the pipeline. **T-028 (the decomposition crescendo) and T-029 (resume
   + hand-driven fallback)** remain, both previously `blocked_by:
   [T-027]` and both now unblocked. **T-029 is worth more than its
   position suggests**: the user's half of the transcript does not
   survive a remount or an app restart — `refreshGenesisStatus` rebuilds
   phase/turn/session but never `turns` — so a mid-interview reload shows
   an empty chat over a LIVE session. And beyond both: **one observed
   real turn**, which is the evidence the milestone's claim will rest on
   and which has never happened.
   **MILESTONE 4** carries T-010, T-013, T-015 (T-014 landed at the last
   merge). **T-010 is the interesting one** — it makes `languages: ["ts"]`
   false, indexes the 44 `.rs` files, turns the four unclaimed ones into
   live unmapped-territory findings, and gives `arch drift` something new
   to say.
4. **OVERNIGHT DISPATCH GRANTS and the BACKLOG.** Grant 1 (**milestone 3
   to completion**) is what T-028 and T-029 would execute; grant 2 closed
   at T-034; grant 3 (third triage applied) stands, and **tasks NEWLY
   created by triage still do NOT dispatch without the human.** Unchanged
   method rules: a second REJECTED parks a lane for the human; @human
   judgments are never self-answered; no screen control beyond the ruled
   boot check; **port 1420 is the human's even while nothing holds it.**
   **LANE AVAILABILITY — everything is free.** `app-interview`,
   `app-shell` and `tools/e2e` released by this merge, which unblocks
   **T-028** and **T-029**; `crate-index` free (**T-010**, **T-013**,
   **T-015**); `app-agent` free (**T-043**); `lib-parser` free
   (**T-031**, **T-032** — and **T-032 carries T-034-s7**, a criterion
   that reads as an instruction to type a control byte and **should be
   amended BEFORE it is built**); `app-map` free (T-013, T-015, T-032's
   map-badge half). The standing app-shell queue's next named item is
   **T-022** (M, milestone 4, `blocked_by: []`), which T-034-s3 made
   bigger.
   **T-027 contributes FIVE suggestions** — **s1** (the focus loss, rank
   it high), **s2** (a refused turn subscription is invisible on screen —
   introduced by T-027, honestly named as T-050's shape, half-fixing
   would have been worse), **s3** (render volume under a streaming turn
   is unthrottled and unmeasured, with the exact measurement to take),
   **s4** (VERIFIER-FILED: the sharpest chip test asserts a tautology,
   plus `bank()` being a drifted hand-copy), **s5** (VERIFIER-FILED: the
   1440×900 lens-scroll assertion has zero pixels of margin and will
   flake).
   **The nine parked, unchanged**: T-003-s2, T-008-s1, T-018-s1,
   T-021-s1, T-026-s1, T-025-s2 (@human), T-025-s4, T-025-s3, T-038-s1.
   Triage-born tasks standing ready and un-dispatched: **T-043**,
   **T-044**, **T-051**.

## Health of the tree

The t027 worktree is removed and its branch KEPT — **37 task branches
merged now**. Main tree clean; every suite green; the token lint green
over 107 files at zero allowlist; the committed graph current and proved
so **twice, by two independent instruments**. The parser re-parses the
whole live tree at **0 issues**: **118 tasks**, tally **38 done / 14
planned / 9 parked / 57 suggested / 0 building**, 6 features, 11
components. No listener is bound on any port; no `tauri dev`, `vite` or
boot-check process survives.

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. **T-027's security posture is unusually easy to state and
was verified rather than argued**: it adds **zero Rust**, **zero new IPC
call sites**, **zero new grants**, **zero new dependencies** and **zero
manifest lines**, and `agent-store.ts` — the module that owns every
`invoke` and `listen` on this path — is a **0-byte diff**. What it DOES
add to the surface is a renderer for **untrusted model output**, and that
was attacked directly: hostile content (script-shaped text, RTL
overrides, 10k-char turns, prototype-polluting and tag-shaped file paths)
renders as **text nodes only**, with a no-innerHTML grep gate across the
pane and an attribute sweep finding **zero `on*` names**. The sharpest
open set is otherwise unchanged and still app-agent's: **T-047-s5**,
**T-047-s6**, **T-047-s4**, **T-047-s1**; beside them **T-046-s1** and
**T-041-s4** (whose lever this merge re-confirmed and re-bounded).

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020). T-027
adds **six lane specs** (54 → 60) and **zero CI steps** (`.github/` is a
0-file diff), so the workflow is unchanged in shape. Two cautions for a
Linux runner: T-027's lane specs measure **geometry** against a real
bundle and real CSS, and font metrics and scrollbar widths are not
identical across platforms — **read T-027-s5 first if a lens-scroll
assertion reds**, because that assertion is already known to have zero
pixels of margin. Otherwise unchanged: the ubuntu apt/webkit2gtk set; the
three `uses:` SHA pins; the `e2e types` step (still never executed on any
runner); T-034's `map-tasks-lens-dom.test.tsx` reading the BUILT
stylesheet, so **build-then-test ORDER is load-bearing**; T-014's
nputer-index watch timings measured on FSEvents; `cargo audit`; the xvfb
boot check; and the THREE T-018 SENTINEL live tests.

## Open questions

- **Does the BOOT GATE rule retire, and when?** Carried forward. **TEN
  exercises in, and this is the fourth consecutive merge where the gate
  FIRED and RAN.** T-027 is the mildest case in a while — a frontend-only
  diff with no manifest movement — which is itself informative: the gate
  is cheap enough that firing on a merge that could not plausibly break
  the launch costs about ninety seconds. The `<main-before>..HEAD`
  wrinkle is now measured at FOUR consecutive merges (here: 9 correct
  against 36 naive, the widest ratio yet). **Six integrators have hit
  it.** Left for triage.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** Still LIVE and unchanged in substance:
  `method/roles/executor.md` still says only "run the test commands from
  CONVENTIONS.md until green", while four rules now share the
  trigger → command → record → IF-it-cannot-run → why shape. A method
  version bump, not an ADR.
- **When does the C0/searchability rule become a gate?** Unchanged in
  substance and **now at TWELVE reproductions across five sessions**, one
  of them tonight putting raw bytes into STATE.md itself. The habit is
  seven-for-seven. Still no gate. The adjacent Tailwind/`app/src-tauri`
  finding argues the same way — *the walk policy IS the gate* — and that
  is T-034-s5's territory. The architect's call (ADR-004).
- **Does the shared main working tree need a rule?** Carried forward with
  a **TENTH face, and this one is the first with a WRITTEN PROCEDURE
  attached.** T-052 was filed tonight naming the fresh-install /
  live-dev-server collision; this merge is the first to act on it — probe
  1420 immediately before the `rm -rf`, and relocate rather than kill if
  a listener has appeared. It cost one `lsof`. **The procedure worked
  because nothing was running**, so it is not yet tested against the case
  it exists for. Method/process, so the architect's (ADR-004).
- **When does spawn hygiene become an ADR?** Unchanged: when T-047-s5
  lands.
- **Does a verifier's remedy belong in an acceptance criterion?** Carried
  forward, **NINTH data point**, and T-027's is the cleanest "no" yet: the
  verifier found a **vacuous assertion in a NEW test** (`interview-model.test.ts:468`),
  ruled that criterion 3 survives on its other assertions, and filed
  T-027-s4 rather than rejecting or amending. *The criterion was met; a
  test inside it is weaker than it looks* is a different statement from
  *the criterion is wrong*, and keeping them separate is what let an
  APPROVED verdict carry an honest defect list. The architect's call.
- **Should a card's own numbers be treated as a claim to verify rather
  than a brief to implement?** **T-027 is the SIXTH instance in six
  merges and the most emphatic**: THREE plan numbers failed to reproduce
  (a "26-chord sweep" that never existed, W−641 for W−640, a stale line
  citation), the builder built the real sweep rather than the described
  one, and the verifier confirmed all three and found no fourth. **And
  the forecast that WAS carefully derived still came up one assertion
  short** (the tenth, above) — so the rule needs its second limb stated
  as loudly as its first: a numeric claim is evidence to reproduce, AND
  an enumerated list of what will move is a floor rather than a ceiling.
  **Derive from the added-file list and the globs; check lists and
  inversions, not just counts; and re-read the whole `it()` body, because
  a red assertion hides every assertion below it.** Method version bump,
  the architect's call (ADR-004).
- **When a task retires a test, who owns the property it was reaching
  for?** Carried forward from T-045, unchanged.
- **What does the pipeline owe a task whose builder vanishes
  mid-flight?** Carried forward from T-050, unanswered.
