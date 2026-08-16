# State

Updated: 2026-08-17 by integrator (T-050 merge), claude-opus-5 @fresh

## Just completed
T-050 (the app can always recover — the startup latch, the swallowed
error, the dead end, S, app-shell, F-02) done and merged. **@human hit
this one themselves and sent a screenshot**: the app open on "waiting
for the first docs snapshot…" with nothing else on screen but "Toggle
theme". Their words: "it opens often like this. often also with nputer
repo." **That screen can no longer strand them.** Built by
`claude-opus-5 @fresh` ×2 (see the two-session story below), verified by
`claude-opus-5 @fresh`, `review: same-model`, **APPROVED**.

**WHAT SHIPPED — three layers, each independently a defect, each
answered.** Two files changed, three test files added.

    app/src/lib/watcher-store.ts
      let started = false          ->  let startup: Promise<void> | null
      + startupAttempts, StartupStep, StartupFailure
      + recordStartupFailure()  — the ONE place a rejection becomes state
      + runStartup()            — the attempt, extracted
      + applyStartupFailure     — a FOURTH dev-harness door
    app/src/App.tsx
      + StartupScreen / startupStepPhrase
      + ScreenModel gains { screen: "startupFailed"; failure }

1. **THE LATCH.** It is a `Promise<void> | null` **latched BEFORE the
   work begins** — a placeholder assigned synchronously, with the work
   chained onto it in the same turn — and released by a `.catch` that
   clears it **only if it is still the same promise**, so a late
   rejection cannot unlatch a newer attempt. `recordStartupFailure`
   opens the latch itself, before it notifies, so the invariant is "a
   recorded failure ALWAYS means the latch is open" and the retry the
   screen offers is never a no-op. A promise rather than an
   `idle|starting|started` enum, deliberately: a concurrent caller can
   AWAIT the attempt already running instead of returning immediately
   having done nothing.
2. **THE FAILURE IS SURFACED.** Caught, recorded in shell state
   (`{ step, message, attempt }`, step = `subscribe | snapshot`) and
   rendered as a TEXT NODE. `startDocsWatcher` stopped being `async` and
   **never rejects by contract** — which is what makes `App.tsx`'s
   unchanged `void startDocsWatcher()` safe rather than merely silent.
3. **THE SCREEN CARRIES A REAL ESCAPE.** The one-line
   `<p>waiting for the first docs snapshot…</p>` became `StartupScreen`,
   serving both waiting and failed: `Try again` (disabled while
   starting, reading "trying…"), `Open a folder…`, `Start an interview`,
   and the `⌘O · ⌘N` hint. The header's own pair stays board-only —
   T-049's gate was NOT widened, so this escape belongs to the screen.

**THE TWO-SESSION STORY, TOLD STRAIGHT, BECAUSE IT IS THE POINT.** The
first executor built and committed the whole fix at `e50fc1e`, then
**stalled TWICE at the identical step** — writing the implementation
notes — and its transcript was lost. A continuation session inherited a
finished branch and no reasoning. It **re-derived every proof obligation
first-hand** rather than transcribing claims nobody could check: it
checked the `b623f6a` and `e50fc1e` stores out into throwaway modules
and drove them side by side. And it **found that the committed fix did
not fully satisfy criterion 1.**

`runStartup`'s first act is a synchronous
`setShell({ starting: true, startupFailure: null })`, and `setShell`
NOTIFIES every subscriber synchronously. The committed code took the
latch from `runStartup(...)`'s **return value**:

    const attempt = runStartup().catch(…);   // the notify happens HERE
    startup = attempt;                       // the latch closes only HERE

— so the entire synchronous prologue of the attempt ran with the latch
still `null`. A subscriber woken there could call `startDocsWatcher`
back, read `null`, and open a **second subscription**; worse, the outer
assignment then clobbered the inner attempt's latch. Criterion 1 says a
second call arriving while the first is in flight SHALL NOT start a
second subscription, and this is exactly such a call. **Twenty-three
insertions fixed it. The latch SHAPE was right all along — only the
moment it closes moved.** Poison-checked: reverting the store reds the
new test with `one subscription, not two: expected 2 to be 1`.

**THE VERIFIER RE-DERIVED BOTH HALVES FROM SCRATCH** — `listenCalls = 2`
before, `1` after — and then attacked the new shape **five more ways**:
a `.then` on the returned promise; a `.then` after a failure (1→2, i.e.
it genuinely re-attempts, and two calls in that handler join ONE
attempt); a bare `queueMicrotask`; **four synchronous calls in one tick
with `listen` parked** (`b===a c===a d===a`, the probe that shows the
latch really is the in-flight promise rather than a flag); and a
subscriber calling back on EVERY notify. **All held at one
subscription.** It attacked the late-rejection release twice and proved
B survives A's late rejection (delete the identity guard and a third
call opens a second subscription — load-bearing, not decorative). Then
it drove both properties TOGETHER, which is the trade a naive fix loses:
**5 concurrent calls into a refusing boundary = 1 attempt, then 2, then
3 on heal, frozen at 3 across ten further calls**, attempt counter
honest at `[1,2,3]`.

**WHAT WAS RULED, RECORDED HONESTLY.** The re-entrancy defect is **NOT
reachable through the shipped App**: the only `subscribeShell` listener
is React's `useSyncExternalStore`, which schedules a render rather than
running inside the notify. **Both the continuation and the verifier say
so, and NEITHER claims it explains @human's screenshot.** The card's
"what is NOT claimed" boundary stands unrevised — which trigger stranded
their instance is still unknown. It was fixed anyway because the
invariant is cheap to hold and the asymmetry was already visible in the
code: the predecessor closed exactly this window on the FAILURE path and
left it open on the SUCCESS path.

**THE REST OF THE EVIDENCE.** The strand re-derived against the unfixed
store: `call#2` **resolves** having touched the boundary zero times even
after it healed, `listenCalls` frozen at 1, screen still `loading` —
that is the screenshot as a transcript. At HEAD, same inputs:
`listenCalls 1 → 2`, phase `open`, screen `board`. StrictMode with a
CONTROL (a bare mount-effect in the same environment runs **2** times;
the App still subscribes once). Hostile payload written independently of
the committed one — script, `svg onload`, `iframe src=javascript:`, raw
entities, NUL + BEL + ESC, a 10 000-character run: **one TEXT node, zero
element descendants, `__pwn3d` undefined, `innerHTML` hands the angle
brackets back ESCAPED, and textContent length == String(Error) length**
(nothing truncated — a renderer that hides part of what failed is
lying). The escape: four buttons not one, ⌘O/⌘N each with
`preventDefault×1` (T-049's own instrument, so two racing listeners
would read 2), retry reaching a board that is **LIVE** (`data-seq` moves
1→2 on a watcher push). Test integrity: **32/32 bodies poison-proven to
execute**, and the two pre-existing files STRENGTHENED — 28 identical
names in `watcher-store.test.ts`, one honest rename in
`shell-harness.test.ts` whose new "every door is callable" clause reds a
poison the old form accepted (confirmed BY LINE NUMBER: the failure lands
at :138, below the exact-key-set assertion at :128).

**THE FINDINGS, RANKED — and the ranking is the verifier's, not mine.**

- **T-050-s2 is THE URGENT ONE, and the verifier says fix it AHEAD of
  s1.** After a refused subscribe, a successful pick yields
  `phase=open screen=board seq=5 tasks=1` with **no `docs-changed`
  handler registered at all** — a board with real content whose pipeline
  is dead. The user escapes an honest error screen onto something that
  **looks fine and can never move again**, by the exact route criterion
  3 advertises. Note the verifier's own correction: its first run
  reported a handler registered; that was its mock recording before the
  promise settled. Corrected to register only on resolve — what Tauri
  does — it reports **none**, as filed. `startupFailure` survives onto
  the board, so s2's remedy 1 condition is expressible exactly where it
  says.
- **T-050-s3 (NEW, and the most consequential for DIAGNOSIS).** The
  startup failure **never reaches stdout** — the route ends at
  `console.error`, and in a WKWebView that does not reach the Tauri
  process's log. Every other boundary error in this store echoes through
  `emit`; this one does not. **That is exactly why @human's log was
  healthy while their screen was stranded, and why a real investigation
  was impossible today.** Criterion 2's `sanitize_for_log` clause is
  therefore satisfied VACUOUSLY.
- **T-050-s1: conclusion right, one mechanism sentence wrong.** It says
  pressing "Try again" returns the promise that is already hanging,
  implying a silent no-op. Measured: the button is `disabled={starting}`
  and reads **"trying…"**, so it cannot be pressed at all. The
  user-visible outcome is BETTER than s1 claims — visibly unavailable,
  not deceptively inert. **Correct that sentence when it is picked up.**
  A **hang** remains a real third failure mode that T-050 does not
  detect (`starting` stays true forever and the copy goes on saying
  "waiting…", which is true and useless) — but it is no longer a dead
  end, because the screen now has three working exits. Homed in s1; a
  third card would be noise.

**THE THING NOBODY MEASURED UNTIL THE VERIFIER LOOKED.** Retryability
made subscription **STACKING** possible, which the unfixed code could
not do: `listen` resolves to an unlisten function this store DISCARDS,
so after a **snapshot** failure each retry adds a live handler — three
failed attempts then one success gives **`listen calls = 4, unlisten =
0, LIVE handlers = 4`**, and one watcher event then re-parses the
snapshot four times. State stays correct (the store notifies once; the
seq guard absorbs the duplicates), the subscribe-failure path does NOT
leak (`listenCalls=3, LIVE=1` — a refused `listen` registers nothing),
and criterion 1's clause is about calls arriving **in flight** while
these attempts are fully settled — **so not a violation, but a real
number.** Already homed in s2's remedy 3 and s1's caveat 1; recorded
here so whoever picks up that remedy has the measurement.

**SUITES ON MERGED MAIN**, all four re-derived here first-hand, fresh
installs, ADR-011 order:
- lib/parser `npm ci` + `npm run build` + `npx vitest run`
  **159/159 (10 files)**, `npx tsc --noEmit` clean. Re-run AFTER the
  fixture edits and the final regen — still **159/159**, and
  `git diff b623f6a..HEAD -- lib/parser/` is **0 bytes**, so
  `smoke.test.ts` is confirmed unmoved rather than assumed so.
- app `npm install`, `npx tsc --noEmit` clean, `npm run build` exit 0
  (**253 modules**), `npx vitest run` **535/535 (32 files)** — exactly
  the number both branch roles measured, and **+28** over main's 507
  (17 in `startup-recovery.test.ts`, 11 in `startup-screen.test.tsx`).
  Re-run again after the fixture edits and the final regen: **535/535**.
- app/src-tauri bare `cargo test` **217 passed + 3 ignored, 0 failed**,
  exit 0, **zero warnings**, summed across **11 test binaries**
  (105 / 0 / 0 / 32+1 / 68 / 3 / 7 / 0+1 / 2+1 / 0 / 0) — **NOT piped
  through `tail`** (the standing trap). Unmoved, as a branch with zero
  Rust must be.
- tools/e2e `npm ci` + `npx playwright test` **40/40 in 8.9s**,
  headless, one worker, retries 0, no skips — **+4** over main's 36, all
  in `startup-recovery.spec.ts`. `npm run typecheck` clean ·
  `npm run lint:tokens` **clean, 38 files**.

**NO NEW CSS, and the strong form of the claim holds again.** This
merge's app build emits `index-RXeeD2qB.css` at **41.30 kB — the same
content-hashed asset name T-049's merge built**, so a task that adds a
whole new screen adds not one CSS rule: `StartupScreen` is built
entirely from tokens and utilities that already existed. The JS moved
and only the JS: `index-DYl_93aj.js` **445.14 kB** (T-049's was
`index-qfeIgiPJ.js` 442.54).

**THE BOOT GATE FIRED AND WAS RUN HERE — and it was STILL UNRUN BY
ANYONE on this branch.** The executor did not run it (its notes say so:
"The boot-check script was NOT run"), the verifier did not either and
said so in its verdict ("the merge owes it") — which is the CONVENTIONS
bullet's "a skipped gate is news, never silence" working as designed.
**The FIFTH exercise of the gate, the fourth on its `app/src/**` limb.**
Scratch port **14521**, never 1420:

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
integrator its first run. (It bit again here, harmlessly: a
`${PIPESTATUS[0]}` on the self-check came back EMPTY and the command was
simply re-run unpiped. The trap is real; the discipline caught it.)
After the run: `lsof -nP -iTCP:14521` **empty** (the scratch port
released), 14520 empty, `pgrep -fl tauri-boot-check` empty,
`pgrep -fl fake_agent` empty, nothing with 14521 in its argv. The full
`ps` sweep compared by **pid SET, not by eye**: everything that appeared
was a Spotlight `mdworker_shared` worker, two macOS system XPC services
and this session's own `ps` pipeline; everything that vanished was the
previous mdworker cohort plus **a sibling worktree's own `npm run build`
under `/Users/ujju/Projects/nputer-t034/`**, which ran and finished on
its own and was neither started nor disturbed by this merge. **Zero
boot-check pids survived.**

**1420 was never bound, contacted or signalled.** It was OBSERVED with
`lsof` only. **Note a change worth carrying: the human's vite is now pid
64249, not the 90127 that held `[::1]:1420` unchanged from T-041's merge
through T-049's — their app has been restarted since.** Their app is
`target/debug/nputer` **pid 64276**, parented to `tauri dev` pid 64073,
confirmed alive both before and after the boot run, which shared
`target/debug/` with it and disturbed nothing.

**THE SHARED-WORKING-TREE SIDE EFFECT, fifth instance, and this one has
the best edge yet.** This merge wrote no `.rs`, so nothing restarted; it
wrote two files under `app/src/` that the human's vite watches, so the
change reached their live window by **HMR**. What makes this instance
different: **the thing that changed is the screen they photographed.**
If their window was sitting on the dead end when this landed, HMR
replaced it under them with a screen carrying three ways out — the fix
arriving, unannounced, on the exact surface they filed the report about.
Recorded as a fifth data point on the open question below.

STANDING INTEGRATOR PRACTICE (T-009-s1, the ratified CONVENTIONS interim
regen rule; retires when T-014's `nputer index --check` becomes the
gate) — **TWENTIETH** exercise, and it FIRED and MOVED the graph.
- **Trigger present**: the diff carries `*.ts/*.tsx` outside docs/. The
  plain ignored self-check was **RED before the regen** (exit 101,
  `NPUTER_UPDATE_GOLDEN` confirmed unset), which is the rule earning its
  place rather than being assumed.
- **Delta, enumerated from the raw graph** and cross-checked by an
  **independent re-derivation written against the registry globs**
  rather than run through the app's own `derive.ts`: files **92 → 94**
  (adds `app/test/startup-recovery.test.ts` and
  `app/test/startup-screen.test.tsx`; **nothing removed**;
  `tools/e2e/tests/startup-recovery.spec.ts` invisible — `.nputerignore`
  carries `tools/`). Content-changed: `App.tsx` (loc 487→623, symbols
  6→8), `watcher-store.ts` (659→841, symbols 40→45), plus hash/loc on
  `shell-harness.test.ts` and `watcher-store.test.ts`. Stats symbols
  **642 → 667**, edges **1038 → 1063** — 29 added and **FOUR REMOVED**,
  which is not churn but the refactor as topology: `startDocsWatcher`
  no longer does the work, so its two calls (`applyDocsPayload`,
  `applyProjectStatus`) and two type_refs went with the extracted
  `runStartup`. **The latch became a wrapper and the graph says so.**
- **FOUR assertions moved, and the fourth was DERIVED, not discovered.**
  `["C-05", 42] → 44` came from the ADDED-FILE LIST before a single test
  ran: both new files match `app/test/**`, and the registry was swept to
  confirm C-05 is that glob's ONLY claimant. It sits behind the file
  count in the same `it()` body and appears in no red, ever. **That is
  four merges running where three was forecast and four moved, and the
  second running where the rule was USED rather than relearned.** The
  other three: file count `toBe(92)` → **94** (and the test NAME),
  relation row `["C-05","C-10","confirmed", 23] → 24`, and
  `map-dogfood-render.test.tsx` `· 92 files` → `· 94 files`.
- **ONE THING WORTH KNOWING ABOUT THAT EDGE**, checked rather than
  assumed: `startup-recovery.test.ts` reaches the store through a
  **DYNAMIC `await import("../src/lib/watcher-store")`** (it must, to
  re-import a fresh module per case), and **the indexer resolves it to
  the same file edge a static import would**. Had it not, the merge
  would have presented as "no assertion moved" and read as an ordinary
  no-op regen. No new component PAIR appears, so no finding is added,
  removed or renumbered — six D1 rows and three D3s byte-identical,
  tally still 13 confirmed / 6 undeclared / 9 planned, D2 empty, the
  unmapped node still gone, no file ambiguous, `derived.issues` still
  `[]`.
- **`lib/parser/test/smoke.test.ts` did NOT move**, verified rather than
  assumed: `git diff b623f6a..HEAD -- lib/parser/` is **0 bytes** and the
  suite re-ran **159/159**. T-050 declares no component and changes no
  registry file, so the T-024 three-fixtures rule does not fire in its
  registry form.
- **Order per ceaa949, THIRTEENTH hold.** Fixture edits went in BEFORE
  the final regen (both fixtures are themselves indexed — and the final
  graph proves it, carrying their own new loc: dogfood 857→920, map
  fixture 215→224). Then regenerated **twice** for byte-identity: sha256
  `a6ede920c34beb867c6e856fbcdf9099a458de766d22e6fa066220b68236933e`,
  **396,620 bytes**, identical both runs (`cmp` clean). Then the
  **plain (non-golden) ignored self-check** with `NPUTER_UPDATE_GOLDEN`
  confirmed UNSET: `self_graph_is_current ... ok`, **exit 0**. Then the
  app suite re-run after the fixture edits: **535/535**.

**No model call was made anywhere in this merge.** The env-gated
`#[ignore]` smoke was NOT run (one of the 3 ignored). No screen control,
no screenshots, no OS input injection, nothing read off the screen. The
boot run opened and closed its own window, which is the @human ruling of
2026-08-16 that T-046 rests on and this merge does not extend.

**THE MERGE WAS CLEAN AND THE OVERLAP WAS PROVED EMPTY, not assumed.**
Merge commit **`5927adc`**, merge-base **`b623f6a`**, thirteen files.
Both changed-file sets were enumerated and `comm -12` is **EXACTLY
ZERO FILES** — main had taken only three docs-only commits since the
dispatch (`fa84ebc` the composition verdict, `2905cfb` the overnight
grants, `6ed97cf` three dispatch stamps), touching `docs/STATE.md` and
four task cards, none of them T-050's. `git merge-tree --write-tree` was
run FIRST and answered a single tree with zero conflict markers; the
merged tree hash reproduced that prediction **exactly**
(`b5d569f5503312908d48a67bb1a107fa408748bb`). **Three sibling executors
are live in their own worktrees** (T-030 on `lib/parser/`, T-045 on
`tools/e2e/`, T-034 on `app/src/architecture/`) and none has merged, so
none could contend. `../nputer-t050` was never entered.

INTEGRATOR JUDGMENT CALLS, recorded.
- **ARCHITECTURE: EDITED, two clauses, and one of them was a FACTUAL
  STALENESS rather than a judgment.** (a) The **Test surfaces** bullet
  enumerates `__nputerShellHarness`'s key set BY NAME —
  `applyProjectStatus / applyPickOutcome / getShell` — and T-050 added a
  fourth door, `applyStartupFailure`. That bullet was simply wrong the
  moment this merged; it now names four and says precisely what the new
  one reaches: **not a fifth phase but the `startupFailed` SCREEN**,
  which has no phase of its own (it rides `loading` in the shipped app
  and `browser` in a served bundle). It also records WHY the door exists
  — a browser awaits neither boundary call and so cannot fail a real
  startup, which is the exact hole T-041's harness exists to close, and
  the door is `recordStartupFailure` ITSELF, so the lane renders shipped
  state rather than an imitation. **The lesson: a document that
  enumerates a key set has committed to maintaining it.** (b) C-05's
  status cell — the running record of app-shell facts, where T-026,
  T-025 and T-049 each left a clause — gains one for the recoverable
  startup handshake. What was checked and deliberately NOT changed: the
  Genesis bullet's "entry is two zero-argument Tauri commands" (T-050
  adds no command — **`git diff` shows ZERO added and ZERO removed
  `invoke(`/`listen(`/`emit(` call sites in `app/src`**), the pure-lens
  bullet (no write path moved), and Code-layout (both new files are
  tests under `app/test/**`, already C-05's declared territory).
- **ROADMAP: EDITED, and the test comes out the same way it did for
  T-049 and for the same reason.** Milestone 3's Progress line
  enumerates **what a user can do**; T-041, T-047 and T-048 were all
  declined on that test because they added no user capability. T-050
  does: a user facing a failed startup can now read which step broke,
  retry onto a live board, or leave by the front door's own two routes,
  where before there was one muted line and a theme toggle. Ten lines
  added. The honest remainder (T-027, T-028, T-029, plus one observed
  real turn) is untouched and **milestone 3 is still NOT claimed**.
- **CONVENTIONS: NOT edited.** The BOOT GATE bullet was exercised a
  fifth time and needed nothing; its "the executor runs it too" limb was
  again correctly OVERRIDDEN by a dispatch fencing 1420, and BOTH branch
  roles declared the gate unrun in as many words — the second consecutive
  clean exercise of that limb. The token-lint bullet governs
  token-bearing utilities: `StartupScreen` is a whole new screen built
  from utilities and tokens that already existed, and `lint:tokens` ran
  **clean over 38 files** with zero new tokens, zero arbitrary values,
  zero new dependencies.
- **NO NEW ADR (three-prong).** (a) An ADR charters a DECISION between
  live alternatives. The latch's shape — promise vs enum vs boolean —
  was settled by MEASUREMENT inside ONE module of C-10's store, and the
  broader pattern it follows (**a rejected boundary call becomes shell
  state via `String(reason)` and is rendered, never thrown**) is not new:
  `runPicker` and `runIndexRepo` already do exactly that, which is why
  the notes call it "the store's existing idiom". T-050 CONFORMS to a
  standing pattern rather than establishing one, and no cross-component
  contract moved. (b) **Prong two, verified as an EMPTY SET rather than
  by eye**: the full changed-file list (branch + this checkpoint)
  restricted to `method/`, `capabilities/`, `lib/parser/`,
  `app/src-tauri/` and every `Cargo.toml`/`Cargo.lock`/`package.json`/
  `package-lock.json`/`tsconfig*.json`/`vite.config.ts`/
  `vitest.config.ts`/`tauri.conf.json`/`.nputerignore` returns **0
  files**. So ADR-012 held (no native surface moved, zero grants
  touched, `acl_pin.rs` zero-diff, the 92-grant set unmoved and still
  green under `cargo test`), ADR-011 held (zero new crates, zero new npm
  deps, no lockfile line), ADR-003 held (no model call anywhere),
  ADR-017 held (no write path changed — the app is still a lens), and
  ADR-014/015 held (the graph was regenerated because the rule fired,
  proved deterministic across two runs, and proved current by the
  indexer's own plain self-check). **No new IPC variant**: the six wire
  enums are unchanged and this branch touches no Rust at all. (c) Prong
  three: the durable calls live in the task file's criteria→evidence
  map, its nine proof obligations, and the verifier's independent
  re-derivations — all of which now say, in the record, that the code
  they describe was wrong and how.

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
   tasks lens, app-map). **All three are BUILDING now** — see below.
3. **THIRD TRIAGE APPLIED** — read-only analyst drafts, architect
   reviews and applies. Docs-only, reversible, one diff to read.
   Tasks NEWLY CREATED by triage still do NOT dispatch without the
   human.
UNCHANGED by this grant: a second REJECTED on any task parks that lane
for the human; @human judgments are never self-answered; no screen
control beyond the ruled boot check; port 1420 is the human's.

## In progress / broken right now
**THREE TASKS ARE `building`**, all under grant 2, all in their own
worktrees, all disjoint from each other and from this merge (the parser
re-parse confirms the count):
- **T-030** — parser strictness, `lib-parser`, worktree
  `../nputer-t030`. Has committed work on its branch.
- **T-045** — the gates cover the rules, `tools/e2e`, worktree
  `../nputer-t045`. Still at the dispatch commit.
- **T-034** — map tasks lens, `app-map`, worktree `../nputer-t034`.
  Still at the dispatch commit. (Its `npm run build` was observed
  running and finishing during this merge's boot-gate window — noted
  only to record that nothing here started or disturbed it.)

**T-027's planning pass is drafting read-only** and is still held on
@human's split-view verdict (see Next up 1).

**ONE MORE LANE APPEARED WHILE THIS MERGE WAS RUNNING, and it is NOT
yet building.** A worktree `../nputer-t014` on branch
`t014-index-binary` was created partway through this session, branched
off this merge's own commit `5927adc`. As of this checkpoint it has
**zero commits of its own** and **T-014's card still reads `planned`**
on main and in that worktree alike — which is why the tally above says
three building and not four. Recorded so the next session does not read
the worktree as an undocumented in-flight build; whoever owns it still
owes the dispatch stamp. T-014 is the `nputer index --check` binary,
which matters here for one specific reason: **it is the named retirement
trigger for the T-009-s1 interim regen rule this checkpoint just
exercised for the twentieth time.**

**THE SHARED-INDEX HAZARD, and it did not recur.** `git diff --cached
--stat` was checked before **both** commits and the staged set was
exactly this session's each time. The house shape here is clean:
**merge → checkpoint**, two commits.

The t050 worktree is removed and its branch KEPT — **31 task branches
merged now**, `t001-app-shell` through `t050-recover` (`git branch
--merged main` lists 33; two of those, `t034-tasks-lens` and
`t045-gates`, are live worktrees still sitting at main's own tip with no
commits of their own, so they are not merges). Main tree clean; all four
suites green; the token lint green; the committed graph current and
proved so by the plain self-check rather than by assumption. The parser
re-parses the whole live tree at **0 issues**: **84 tasks**, tally
**32 done / 15 planned / 9 parked / 25 suggested / 3 building**, 6
features, 11 components. (Tasks rise by four since T-049's checkpoint —
T-050's own card plus its three suggestion files.)

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
pins resolve; playwright-on-Linux runs the lane — **now 40 tests**,
whose most platform-sensitive are the ones measuring REAL CSS in
Chromium-on-Linux (**if anything goes red there, look at the font and
colour assertions in `front-door.spec.ts` and `genesis-screen.spec.ts`
first**), plus T-048's three-viewport sweep, which asserts EXACT pixel
equality between `document.scrollHeight` and the viewport at 800x600,
1024x768 and 1280x720 — a Linux scrollbar-gutter or default-font
difference shows up there before anywhere else and should be read as a
platform difference to file, not a regression, unless the pane's region
also stops scrolling. **T-049's Linux exposure to watch**:
`accelerators.spec.ts` presses `Meta+o` / `Meta+n` in real Chromium and
asserts `defaultPrevented`; on Linux the Meta key is not the platform
accelerator and the app deliberately accepts Control too, so if that
spec reds there, read it as a key-mapping difference to file before
touching the matcher — and note it would be the first evidence about
T-049-s4's territory that anyone has. **T-050 adds a MILD one**:
`startup-recovery.spec.ts` includes a case that reads the failure card's
computed colours from the real sheet in BOTH schemes, so it joins the
CSS-sensitive group above; its other three drive the shell harness and
are platform-neutral. Then: `cargo audit` behaves as it does locally;
and **the xvfb `tauri dev` boot prints both `[nputer]` startup lines** —
the FIRST exercise of the boot check on Linux, and the only place
T-046's override's Linux behaviour will ever be observed (CI
deliberately sets no `NPUTER_BOOT_PORT`, so the override path stays
Linux-unverified by design). AND (T-018-s3 fold) the THREE T-018
SENTINEL LIVE TESTS inside the ubuntu `cargo test` step —
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
1. **@human — THE VISUAL SESSION IS STILL OPEN, and the second thing you
   reported is now fixed.** The app is RUNNING on 1420 as this
   checkpoint lands — **note it is on a NEW pid since the last
   checkpoint (vite 64249, app 64276), so you have restarted it at some
   point.** This merge wrote no Rust, so nothing restarted here; the two
   changed frontend files reached the window by **HMR**, which this time
   means **the screen you photographed changed under you.**
   - **FIRST, because it is your own report: the dead end is gone.**
     There is no reliable way to make a real startup fail on demand, so
     the honest ask is smaller than usual — **if you ever see "waiting
     for the first docs snapshot…" again, tell us what the screen looks
     like now.** It should carry `Try again`, `Open a folder…`,
     `Start an interview` and a `⌘O · ⌘N` hint, and if startup actually
     FAILED it should say which step broke and quote the reason instead
     of claiming it is still waiting. **The two judgment calls T-050
     explicitly leaves you** (they are in the card's Verification line):
     **does the failure copy read right**, and **does retry belong on
     that screen or in the header?**
   - **AND A WARNING THAT MATTERS MORE THAN THE COPY — T-050-s2.** If
     you land on the failure screen and escape it with **"Open a
     folder…" rather than "Try again"**, you reach a board that has real
     content and is **silently dead**: no `docs-changed` handler was
     ever registered and picking does not re-subscribe, so nothing you
     edit will ever appear. **Use "Try again" — that route is proven
     live.** This is the highest-ranked open finding on the task and the
     verifier says fix it first.
   - **THE HEADER'S DENSITY, T-049's item, still open** — the board
     header's right group is `Open folder… | Start an interview |
     Toggle theme`, three equal outline buttons where the front door
     gives its primary an ink pill, so **"Start an interview", the
     capability milestone 3 is named after, looks exactly like "Toggle
     theme"**. Separator? Emphasis? Or is quiet right? Two more: the
     header pair carries **no `⌘O · ⌘N` hint** while the front door does
     (and now the startup screen does too — so the chords are advertised
     in two places out of three); and **neither group wraps or
     truncates**, so at a narrow window that row has nowhere to go.
     (Also: the header says `Open folder…`, the front door and now the
     startup screen say `Open a folder…`. Same verb, two registers.)
   - **NEW — the startup screen's own composition.** It is the first
     screen in the app to put **four controls in one wrapping row** with
     a hint riding beside them, and it reuses the front door's verbs
     without reusing its layout. Worth an eye beside T-049's header
     item, because they are the same question asked in two places: how
     much emphasis does a primary action get?
   - **NEW — the frame at 800x600, T-048's item, still open.** The pane
     scrolls inside a fixed header and heading, and the artifact list
     gets 286px of the 858px it wants at the size the app actually
     opens. The measurement says the frame holds; **whether it holds
     ENOUGH list to be useful is an eye judgment only you can make.**
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
     card edge.
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
     a browser harness and tauri-driver has no macOS. What remains is
     the native half — "Start an interview" → native dialog → a
     docs-less folder lands on the genesis screen; "Start an interview
     here" on a folder the app just refused; a folder that already has a
     plan → the board, not genesis. (T-049-s1 records why the served
     bundle can prove a chord was CLAIMED but never that it was OBEYED.)
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
   - **A PRIORITY CALL, not a screen action.** The next triage now has
     **four** kinds to rank. Process/spawn hygiene: T-046-s1, T-047-s6
     (the only one that has already fired), T-047-s5 (~5 lines).
     Layout/scroll: T-048-s2 (the map canvas clips — silent graph loss
     the day anything bounds it), s1 (two scroll models, T-027's), s5
     (the floor, one line). Reach: T-049-s4 (chords dead on every
     non-Latin layout while the UI advertises them) and s3 (four
     advertised mechanism properties, none pinned). **And now
     OBSERVABILITY, which is new and arguably outranks all of them:
     T-050-s3 says a stranded startup writes nothing to the log, which
     is the reason today's investigation could not name a cause.** Rank
     it against T-050-s2 (the silently-dead board), which is the one
     that can bite a user without warning.
2. MILESTONE 3 (T-023…T-029 + T-039 + T-041 + T-047 + T-048 + T-049 +
   T-050, ADR-017). **T-041's served-bundle gate is DOWN, T-048 made the
   screen fit the window, T-049 made the way in work, and T-050 made the
   way OUT work** — four things between the human and a verdict, all
   cleared. **What still holds the milestone is the human, in this
   order:**
   (a) **T-027's planning pass waits on the human's split-view verdict**
   (item 1) — it builds the LEFT half of a composition whose whole
   design question is what the open visual session is judging.
   `blocked_by` [T-024 ✓, T-025 ✓, T-026 ✓] has been satisfied since
   T-025 merged. **T-027 also inherits T-047-s3** (a read boundary on
   `model` at the first site that renders it), **T-048-s1** (the two
   scroll models, which only a composition decision can collapse), and
   **T-049-s2** — its accelerator criterion literally says "(their
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
   T-039 on app-agent" condition outright; **app-shell is FREE again
   now that T-050 has merged.** Triage: APPLY granted — but tasks NEWLY
   created by triage (T-041…T-050) do NOT dispatch without the human;
   T-041, T-046, T-047, T-048, T-049 and T-050 each got that nod
   explicitly. Unchanged method rules: a second REJECTED on any task
   parks that lane for the human; @human judgments are never
   self-answered.
4. SUGGESTION BACKLOG — **34 open files: 9 parked + 25 suggested.**
   **T-050 contributes three, and they do not rank together — the
   verifier ranked them explicitly, which is unusual and should be
   honoured.**
   **Untriaged (25)**: the three T-050 cards — **s2** (FIX FIRST: a
   board reached after a failed subscribe is not live — real content, no
   `docs-changed` handler, and picking does not re-subscribe; worse than
   the state it escaped because it looks fine), **s3** (a startup
   failure never reaches the log — the reason this investigation ran out
   of evidence; the most consequential for future diagnosis), **s1** (a
   hanging startup is not a rejection — conclusion right, **one
   mechanism sentence wrong and the correction is recorded above**; also
   the home for the hang-as-third-failure-mode and for the subscription
   STACKING measurement) — plus the four T-049 cards (**s4** `event.key`
   makes the chords silently dead on every non-Latin layout, **s3** the
   hook's four advertised mechanism properties are each deletable with
   the suite green, **s2** T-027's accelerator criterion names a test
   T-049 retired — one-line reconciliation, cheapest thing on this list,
   **s1** the lane sees a browser, not the app) — plus the five T-048
   cards (**s2** the map canvas clips instead of scrolling, **s4** the
   s3 CORRECTION — read it BEFORE s3, **s1** two scroll models, **s3**
   the no-plan card overflows at 800x600, **s5** the bounded frame's
   floor) — plus the six T-047 cards (**s5** the probed path skips the
   gate, **s6** nothing structurally stops a test resolving the real
   CLI, **s4** `$SHELL` picks the program, **s1** retire the cache,
   **s2** the flag table is a version snapshot, **s3** the model has no
   read boundary, home T-027) — plus **T-041-s2** (the wire shape is
   pinned in Rust and mirrored by hand in TS with nothing comparing
   them), **T-041-s4** (`NODE_ENV`, not `--mode`, flips the DEV gate),
   **T-046-s1** (the unsignalled process group), **T-046-s4** (the
   overlay's blind spot), **T-046-s2** (`checkJs` — its worked example
   is wrong and the correction is IN the file), **T-046-s3** (nothing
   gates the packaged build — read with s4 and T-041-s4: all three are
   "a gate proves the configuration it was handed, not the one that
   ships"), and **T-039-s3** (give the session-id refusal its own typed
   outcome; home is T-029).
   **The nine parked, unchanged**, all blocked on something only the
   world can provide: T-003-s2 (a real project near the ~25 MB knee),
   T-008-s1 (F-04/F-05 layout), T-018-s1 (a Windows lane), T-021-s1 and
   T-026-s1 (both await the first Linux run), T-025-s2 (@human, one
   command on an authenticated machine), T-025-s4 (gated by s2),
   T-025-s3 (nputer.yaml is F-04 era; its count fix rides T-043),
   T-038-s1 (no responsive call site yet — T-048 is the first task to
   measure the app at six viewport sizes, so s1's claim is weaker than
   it was).
   Triage-born tasks standing ready and un-dispatched: **T-042** (genesis
   switch truthfulness), **T-043** (kill path — its serialization
   condition is SATISFIED and app-agent is free; T-047-s4 nominates it
   as a home), **T-044** (shell pins cover their surface). T-045 left
   this list — it is building now.
   Milestone-4 queue after F-03: T-010, T-013, T-014, T-015, T-031…
   T-033, T-035, T-044, plus T-022. (T-030 and T-034 are building.)

## Open questions
- **Does the BOOT GATE rule retire, and when?** Carried forward
  unchanged. T-009-s1's sibling rule names its retirement (T-014's
  `nputer index --check`); BOOT GATE names none in CONVENTIONS, and
  `.github/workflows/ci.yml` already invokes the boot check on ubuntu
  while dormant. Does it retire at the repo's first push, or only when a
  macOS gate exists too? Left for a triage. **FIVE exercises in now**
  (`app/src/**` at T-041, T-048, T-049 and here, `app/src-tauri/**` at
  T-047), and it has needed no amendment any time. Its "THE EXECUTOR
  RUNS IT TOO" clause has now been overridden by a 1420-fencing dispatch
  **twice running**, and both times every branch role declared the gate
  UNRUN in as many words rather than going quiet — the bullet's "a
  skipped gate is news, never silence" is handling that correctly with
  no amendment. Worth noting when the retirement question is taken.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** Unchanged: there are TWO gates with the shape trigger →
  command → record, one of which binds the executor, and
  `method/roles/executor.md` still says only "run the test commands from
  CONVENTIONS.md until green". Ask ONCE when a THIRD lands, or when the
  executor rule proves noisy. A method version bump, not an ADR.
- **Does the shared main working tree need a rule?** Carried forward and
  **now with a fifth data point, which is the sharpest of the five**.
  The first was the git INDEX (T-046's merge lost its house shape to a
  shared index; the fix that works is social — "the pen is yours" — plus
  `git diff --cached --stat` before every commit, done twice here). The
  second was the WORKING TREE via Rust: an app-agent merge REBUILDS and
  RESTARTS the app the human is reviewing. The third (T-048) was the
  same tree via **HMR** — no restart, same pid, but the screen under
  review changed without a signal. The fourth (T-049) sharpened that:
  the merge changed what the KEYBOARD does, so ⌘O started working
  mid-session with no signal. **The fifth is today's: the merge replaced
  the exact screen the human had photographed and filed a report about.**
  If their window was sitting on that dead end, the fix arrived under
  their eyes with no announcement — and the report and the fix would
  have looked simultaneous. All five faces are recorded and none is
  written down anywhere but here. Method/process, so the architect's
  (ADR-004).
- **When does spawn hygiene become an ADR?** Unchanged from T-047's
  ruling: three C-14-local rules exist and a charter was argued against,
  because T-047-s5 proves the cached and probed doors hold DIFFERENT
  standards today. **The moment to write it is when s5 lands** — that is
  when there is a single rule to charter — which is a nearer, sharper
  trigger than "a second component spawns agents at F-04".
- **Does a verifier's remedy belong in an acceptance criterion?**
  Carried forward, unanswered, and now with a THIRD data point. T-041's
  verifier filed a fix in s1's note 1; the architect promoted it into
  T-048's criterion 3 as a prescription; **it was wrong, and the task
  nearly required its own bug.** T-049 supplied the counter-example from
  the other end: its criterion 5 named a MECHANISM to prove rather than
  a remedy to build, and the builder had to invent three instruments to
  satisfy it. **T-050 is the third and it lands with T-049**: criterion 1
  names PROPERTIES ("set only on success… guard against the concurrent
  case too… StrictMode-safety SHALL survive") and prescribes no shape at
  all — and that is precisely why the continuation session could find
  that the committed code satisfied two of the three and fix it. A
  criterion naming a shape would have been met by the defective code.
  Two candidate rules, both cheap: a criterion that names a specific
  remedy SHALL carry an "or a demonstrably better equivalent" hatch, or
  a remedy inherited from a suggestion SHALL be written as a hypothesis
  to test rather than a shape to build. The architect's call (ADR-004).
- **When a task retires a test, who owns the property it was reaching
  for?** Carried forward from T-049, unanswered. T-026's "stops
  listening once the front door is gone" was retired CORRECTLY — it
  would have been vacuously green forever — but the property underneath
  it survived the refactor in a new form and is now pinned nowhere.
  Candidate rule, one line in TASK-FORMAT: a task that deletes or
  replaces an existing test SHALL name, for each assertion dropped,
  either its new home or its suggestion id. Method version bump, the
  architect's call. **T-050 is a clean contrast worth noting beside it**:
  it renamed one test rather than retiring it, and the rename was forced
  by the name stating a key set that grew — the assertion was
  STRENGTHENED in the same edit, and the strengthening was proved by
  line number. That is what the good case looks like.
- **NEW: what does the pipeline owe a task whose builder vanishes
  mid-flight?** T-050 is the first case and it came out WELL, but by
  virtue rather than by rule. The first session committed working code
  and lost its transcript; the continuation could have transcribed the
  diff into plausible notes and nobody would have known. Instead it
  re-derived every obligation first-hand and **reported that the code it
  inherited did not meet criterion 1** — which is how the defect was
  found at all. Nothing in `method/` asks for that. The candidate rule
  is narrow: a session that inherits committed work it did not write
  SHALL say so in the notes and SHALL mark which measurements it re-ran
  versus inherited. T-050's front matter did exactly this voluntarily
  (`built_by: "claude-opus-5 @fresh ×2 (build session, then a
  continuation that re-derived the evidence first-hand)"`), and the
  verifier called it out as the opposite of the failure mode the
  protocol exists to catch. Worth writing down before the next
  continuation is less scrupulous. Method version bump, the architect's
  call (ADR-004).
