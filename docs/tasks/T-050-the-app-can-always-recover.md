---
id: T-050
title: The app can always recover — the startup latch, the swallowed error, the dead end
feature: F-02
milestone: 3
priority: 6
size: S
status: building
blocked_by: []
touches: [app-shell]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Reported by @human on 2026-08-16 with a screenshot, mid-review: the
app open on "waiting for the first docs snapshot…", nothing else on
screen but "Toggle theme". Their words: "it opens often like this.
often also with nputer repo."

**Three layers, each independently a defect.**

1. **The latch is set before the awaits and never resets.**
   `startDocsWatcher` (app/src/lib/watcher-store.ts) opens
   `if (started) return; started = true;` and only THEN awaits
   `listen("docs-changed", …)` and `invoke("docs_snapshot")`. A
   rejection from either leaves the latch set with `phase` still
   `"loading"`, and every later call returns at the guard. `started`
   is declared once, checked once, set once — there is no reset
   anywhere. One transient IPC failure strands the app permanently.

2. **The rejection is swallowed.** The call site is
   `void startDocsWatcher()` (App.tsx) with no `.catch`, so a failure
   becomes an unhandled rejection: nothing logs, nothing renders, and
   the user is given no reason.

3. **The `loading` screen is a dead end.** "Open folder…" is gated on
   `screen.screen === "board"`, `EmptyState` is not mounted, so there
   is no picker and (before T-049) no accelerator. The only control
   on that screen is the theme toggle.

**What is NOT claimed.** The mechanism above is proven by reading the
code; which trigger stranded the human's instance is NOT. Their log
was healthy — the backend emitted through seq 22 (131 files, 76
tasks) and the frontend echoed every one, the last at 19:45:29 — and
no filesystem event followed, so the log cannot say whether the
webview reloaded and stranded itself afterwards. The Rust
`ProjectStatus` enum and the TS `ProjectStatusPayload` union were
checked and match exactly (NoProject / NoDocs / Open), so a
fall-through on an unhandled kind is ruled OUT. Do not write a
diagnosis the evidence does not support.

**T-049 already mitigates layer 3 by accident**: its `useAccelerators`
hook mounts at the App root, so ⌘O now fires from the `loading`
screen. That is an escape, not a fix, and it does not clear the latch.

Serialized behind T-049's merge deliberately — both touch
`watcher-store.ts` and `App.tsx`.

## Acceptance criteria
- THE startup latch SHALL be set only on SUCCESS, so a failed attempt
  can be retried: a rejecting `listen` or `invoke` SHALL leave the
  module in a state where calling `startDocsWatcher` again genuinely
  re-attempts. Guard against the concurrent case too (a second call
  arriving while the first is still in flight SHALL NOT start a second
  subscription) — the current code's one virtue is that it is
  StrictMode-safe, and that SHALL survive.
- THE failure SHALL be surfaced rather than swallowed: the rejection
  is caught, recorded in shell state, and rendered — the user learns
  that startup failed and what failed, not merely that nothing
  happened. The existing `sanitize_for_log` discipline applies to
  anything echoed to stdout; nothing from an error message may reach
  the DOM as markup.
- THE `loading` screen SHALL carry a real escape: at minimum a retry
  affordance that re-runs startup, and the same "Open folder…" /
  "Start an interview" route the header offers elsewhere — so no
  reachable screen leaves the user with only the theme toggle. WHEN
  startup has failed THE screen SHALL say so rather than continuing
  to claim it is waiting.
- THE suite SHALL pin the case nothing covers today: a rejecting
  `listen` and a rejecting `invoke`, each proven to leave the app
  RECOVERABLE — a subsequent retry succeeds and reaches the board.
  A test SHALL also pin that the happy path still latches exactly
  once (no double subscription under StrictMode's double-effect).
- THE existing startup behaviour SHALL be otherwise unchanged: the
  subscribe-then-pull order stays (the seq guard settles the race),
  no new IPC, no new grant, no new dependency, and every current
  watcher-store and shell test stays green by name.

Verification: headless — vitest driving the store with a rejecting
IPC boundary, plus the tools/e2e lane through T-041's shell harness
for the rendered failure state. @human: whether the failure copy
reads right, and whether retry belongs on that screen or in the
header.

## Implementation notes

Built across TWO sessions of claude-opus-5 @fresh, branch `t050-recover`
(worktree ../nputer-t050), branch point main@`b623f6a` (the dispatch
commit). The first session built and committed the whole fix as
`e50fc1e` and then stalled twice at this very section, leaving no notes
and no transcript. The second session re-derived every claim below
FIRST-HAND against the committed tree — nothing here is transcribed
from the predecessor; where a measurement is quoted it was re-run in
session two and pasted verbatim.

**Eleven files.** New: `app/test/startup-recovery.test.ts`,
`app/test/startup-screen.test.tsx`,
`tools/e2e/tests/startup-recovery.spec.ts`. Modified:
`app/src/lib/watcher-store.ts`, `app/src/App.tsx`,
`app/test/watcher-store.test.ts`, `app/test/shell-harness.test.ts`,
`tools/e2e/fixtures/shell.ts`, `tools/e2e/tests/shell-harness.ts`. Plus
this card and two suggestions (T-050-s1, T-050-s2).

### The latch — what shape it is, and why that shape

The crux of criterion 1 is that its two halves pull against each other.
The old code was StrictMode-safe BECAUSE its latch was synchronous
(`if (started) return; started = true;` above both awaits), and it was
unretryable for exactly the same reason. Moving a boolean below the
awaits trades a permanent-strand bug for a double-subscription bug.

**What was chosen: the latch holds the in-flight PROMISE**
(`watcher-store.ts:508`, `let startup: Promise<void> | null = null`),
not a boolean and not a tri-state enum.

```ts
export function startDocsWatcher(): Promise<void> {
  const inFlight = startup;
  if (inFlight !== null) return inFlight;
  let finish!: () => void;
  const attempt = new Promise<void>((resolve) => { finish = resolve; });
  startup = attempt;                            // LATCHED FIRST
  void runStartup()
    .catch(() => { if (startup === attempt) startup = null; })  // by IDENTITY
    .finally(finish);
  return attempt;
}
```

Both properties come from one line each, and they are independent:

- **SINGLE-FLIGHT** comes from `startup = attempt` being executed in the
  same synchronous turn as the call, and — after the defect below —
  BEFORE the attempt itself runs. React's double-invoked effect calls
  twice in one turn; the second call reads a non-null latch and gets THE
  SAME promise. That is the old code's virtue, kept by the same
  mechanism (synchronous assignment) rather than by luck.
- **RETRYABLE** comes from the `.catch` releasing the latch. The old
  `started` was set once and reset nowhere in the file (verified:
  `git show b623f6a:app/src/lib/watcher-store.ts` has exactly three
  mentions of `started`, at :417, :530, :531 — declare, check, set).

Two details that are load-bearing rather than decorative:

1. **Release by IDENTITY** (`if (startup === attempt)`). Without it, a
   slow attempt that rejects AFTER a newer attempt has latched would
   unlatch the newer one and a third call would open a second
   subscription.
2. **`recordStartupFailure` releases the latch itself, before it
   notifies** (`watcher-store.ts:625-634`). So the invariant is "a
   recorded failure ALWAYS means the latch is open" — the retry the
   screen offers is never a no-op. A subscriber woken by that notify
   may call `startDocsWatcher` synchronously and start a fresh attempt
   inside that window; detail 1 is what makes that safe.

### A DEFECT found in session two, and fixed — criterion 1's concurrent clause

**The committed `e50fc1e` did not fully satisfy criterion 1, and this is
the one substantive change session two made to production code.**

`runStartup`'s first act is a synchronous
`setShell({ starting: true, startupFailure: null })` (watcher-store.ts:658),
and `setShell` NOTIFIES every subscriber synchronously. The committed
code took the latch from `runStartup(...)`'s return value:

```ts
const attempt: Promise<void> = runStartup().catch(…);   // notify happens HERE
startup = attempt;                                       // latch closes only HERE
```

So there is a window — the whole synchronous prologue of the attempt —
in which the attempt is running and the latch is still `null`. A
subscriber woken by that notify which calls `startDocsWatcher` back
reads `null`, starts a SECOND `runStartup`, and opens a second
subscription; worse, the outer `startup = attempt` then clobbers the
inner attempt's latch, so the store tracks one of the two. Criterion 1
says "a second call arriving while the first is still in flight SHALL
NOT start a second subscription", and this is exactly such a call.

Measured, by counting `listen` calls, before and after:

```
=== C. synchronous re-entrancy from a store subscriber ===
  BEFORE (e50fc1e)  re-entrant call made: true
                    listenCalls = 2   <-- DOUBLE SUBSCRIPTION
  AFTER             re-entrant call made: true
                    listenCalls = 1   <-- single-flight held
```

The fix does NOT change the shape of the latch — it is still the
in-flight promise — only the moment it closes: `attempt` becomes a
placeholder latched BEFORE the work starts, with the work chained onto
it in the same synchronous turn (`.finally(finish)` settles it either
way). Every other property is unchanged, including the synchronous
`starting: true` the tests assert on.

Pinned by a new test, `startup-recovery.test.ts` → "a RE-ENTRANT call,
from inside the store's own notify, starts no second subscription".
Poison-checked: reverting `watcher-store.ts` to the committed version
reds it with `one subscription, not two: expected 2 to be 1`, and the
restore was verified byte-identical by sha256
(`b52e7ff…fce1f`).

**Honest reachability.** This is not reproducible in the shipped app
today: the only `subscribeShell` listener is React's
`useSyncExternalStore`, which schedules a render rather than running an
effect synchronously inside the notify. It is a latent hazard, not a
second cause of @human's screenshot — nothing here revises the card's
"what is NOT claimed". It is worth fixing anyway because the invariant
is cheap to hold and because the asymmetry was already visible in the
code: `recordStartupFailure` deliberately releases the latch BEFORE its
notify and guards by identity, reasoning about a subscriber that calls
back synchronously — the predecessor closed exactly this window on the
failure path and left it open on the success path.

Why a promise rather than a `"idle" | "starting" | "started"` enum (the
other honest shape): a concurrent caller can AWAIT the attempt already
running instead of returning immediately having done nothing. Both the
retry affordance and the tests want that — `expect(b).toBe(a)` in
startup-recovery.test.ts is only expressible because the latch IS the
promise.

`startDocsWatcher` also stopped being `async` and **never rejects by
contract**. That is what makes the call site's unchanged
`void startDocsWatcher()` (App.tsx:548) safe rather than merely silent:
there is no rejection left to swallow, because the callee — the only
place that knows WHICH await broke — records it as shell state instead.

### Obligation 1 — the strand, measured against the UNFIXED code

Not transcribed: `app/src/lib/watcher-store.ts` was checked out of
`b623f6a` into a scratch module and driven directly (the scratch module
and its drill were deleted; the tree is clean). Verbatim, one run:

```
=== UNFIXED (b623f6a) · listen rejects ===
call#1 REJECTED(Error: listen: the event channel refused)
  after call#1 -> {"phase":"loading","listenCalls":1,"invokeCalls":0,"screen":"loading","startupFailure":"<field does not exist>"}
call#2 (boundary healed) resolved
  after call#2 -> {"phase":"loading","listenCalls":1,"invokeCalls":0,"screen":"loading","startupFailure":"<field does not exist>"}
call#3 resolved
  after call#3 -> {"phase":"loading","listenCalls":1,"invokeCalls":0,"screen":"loading","startupFailure":"<field does not exist>"}

=== UNFIXED (b623f6a) · invoke rejects ===
call#1 REJECTED(Error: docs_snapshot: the command was refused)
  after call#1 -> {"phase":"loading","listenCalls":1,"invokeCalls":1,"screen":"loading","startupFailure":"<field does not exist>"}
call#2 (boundary healed) resolved
  after call#2 -> {"phase":"loading","listenCalls":1,"invokeCalls":1,"screen":"loading","startupFailure":"<field does not exist>"}
```

Read it precisely. `call#2` **resolves** on the unfixed code — it does
not throw, it does not retry, it returns at `if (started) return;`
having touched the boundary zero times. `listenCalls` never leaves 1
even though the boundary had HEALED before the call. That is the
permanent strand from a transient failure, and the screen stays
`loading` — the screenshot @human sent. (`<field does not exist>` is
literal for the unfixed store: `startupFailure` and `starting` appear
zero times in `b623f6a:app/src/lib/watcher-store.ts`.)

Same drill, same inputs, against HEAD:

```
=== HEAD (e50fc1e) · listen rejects, SAME inputs ===
call#1 resolved
  after call#1 -> {"phase":"loading","listenCalls":1,"invokeCalls":0,"screen":"startupFailed","startupFailure":{"step":"subscribe","message":"Error: listen: the event channel refused","attempt":1}}
call#2 (boundary healed) resolved
  after call#2 -> {"phase":"open","listenCalls":2,"invokeCalls":1,"screen":"board"}

=== HEAD (e50fc1e) · invoke rejects, SAME inputs ===
call#1 resolved
  after call#1 -> {"phase":"loading","listenCalls":1,"invokeCalls":1,"screen":"startupFailed","startupFailure":{"step":"snapshot","message":"Error: docs_snapshot: the command was refused","attempt":1}}
call#2 (boundary healed) resolved
  after call#2 -> {"phase":"open","listenCalls":2,"invokeCalls":2,"screen":"board"}
```

`listenCalls` goes 1 -> 2: the retry genuinely re-subscribed. The phase
reaches `open` and the screen reaches `board` — recovered, from both
failures, with the same call that used to do nothing. (`startupFailure`
is `null` after recovery in both cases; the drill's `??` printed the
same placeholder for null, so it is stated here rather than shown.)

### Obligation 2 — StrictMode safety, kept, by COUNTING `listen` calls

Not by reading outcomes: a second subscription applying the same
snapshot is dropped by `reduceDocs`'s seq guard and is invisible from
the outside. Three probes, verbatim:

```
=== A. real <StrictMode> around the real App ===
  listenCalls=1  invokeCalls=1
  CONTROL: a bare mount-effect under <StrictMode> ran 2 times

=== B. three calls while the FIRST is still in flight ===
  listenCalls while parked = 1
  same promise handed back?  b===a: true   c===a: true
  starting = true
  after settle: listenCalls=1 invokeCalls=1 phase=noProject

=== C. synchronous re-entrancy from a store subscriber ===
  re-entrant call made: true
  listenCalls = 1
  after settle: listenCalls=1 invokeCalls=1
```

Probe A is the real thing, not a simulation of it: the real `App`
rendered inside a real `<StrictMode>`, with only the IPC boundary
mocked. The CONTROL line is what makes it an assertion rather than a
tautology — a bare mount-effect in the same environment runs **2**
times, so React really is double-invoking here, and the App still
subscribed once. Probe B parks `listen` unresolved so the attempt is
genuinely mid-flight, and shows the latch handing back the identical
promise object. Probe C is the defect above, after its fix.

### Obligation 3 — the failure is VISIBLE, and hostile text stays text

Driven through the real `App` and the real store, with a hostile payload
written independently of the one the committed suite uses (a script, an
`svg onload`, an `iframe src=javascript:`, raw entities, an unbalanced
`</p`, NUL + BEL + ESC, and a 10 000-character run):

```
=== O3. the rendered failure state ===
  main[data-screen] = startupFailed
  section[data-startup] = failed
  startup-message textContent = "nputer could not start — the watcher subscription was refused, so no file change can reach the board."
  failure heading = "startup failed at subscribe · attempt 1"

=== O3. hostile message -> TEXT NODES ONLY ===
  detail childNodes nodeTypes = [3]  (3 = TEXT_NODE)
  detail element descendants = 0
  script elements in tree = 0
  svg elements    = 0 (non-icon)
  iframe elements = 0
  img elements    = 0
  globalThis.__pwn3d = undefined
  textContent length = 10137, String(Error) length = 10137  -> equal: true
  contains raw "<script>" as TEXT: true
  contains the 10k run:            true
  control bytes preserved (NUL,BEL,ESC): true
  innerHTML starts: "Error: &lt;script&gt;globalThis.__pwn3d=1&lt;/script&gt;&lt;"
```

The last line is the one that settles it: the DOM's own serializer
gives the angle brackets back ESCAPED, so they were never parsed as
markup. Nothing executed (`__pwn3d` is `undefined`), the element has
zero element descendants, and the length equality shows the whole
rejection is on screen — nothing silently truncated, which would be the
renderer lying about what failed. The `sanitize_for_log` discipline is
respected on the other side too: the console line is
`console.error("[nputer] startup failed at", step, reason)` — the reason
is an ARGUMENT, never interpolated, and there is no stdout path from
here (no `emit` on this route).

### Obligation 4 — the escape works, and T-049 does not regress

```
=== O4. the escape ===
  buttons on screen = ["Toggle theme","Try again","Open a folder…","Start an interview"]
  ⌘O from startupFailed: preventDefault×1, invoked ["pick_project_folder"]
  ⌘N from startupFailed: preventDefault×1, invoked ["pick_genesis_folder"]
  click startup-open-folder -> invoked ["pick_project_folder"]
  click startup-start-interview -> invoked ["pick_genesis_folder"]
  screen after two cancelled picks = startupFailed
  RETRY: listenCalls 1 -> 2 (re-subscribed: true)
  screen after retry = board
  startup screen gone = true
  model counts = "1 tasks · 0 features · 1 issues · seq 1 · updated …"
  a watcher push after retry -> data-seq = 2
```

Four things, each measured rather than assumed:

- **T-049 does not regress.** ⌘O and ⌘N fire from the `startupFailed`
  screen, each claimed by exactly ONE handler (`preventDefault×1` —
  T-049's own instrument, so two racing listeners would show as 2).
- **The picker route is reachable** from the failed screen by button as
  well as by chord, and a cancelled pick leaves you on the screen that
  still offers the escape rather than somewhere worse.
- **Retry reaches the board**, and `listenCalls 1 -> 2` is the proof it
  genuinely re-subscribed rather than replaying state.
- **The pipeline is LIVE after the retry**, not a photograph: a
  `docs-changed` push lands and `data-seq` moves to 2. (This is exactly
  what does NOT hold on the picker route after a failed `subscribe` —
  see T-050-s2, assessed below.)

### Obligation 5 — recoverability pinned, happy path latches once

Both are pinned by the committed suite and reproduced above:
`startup-recovery.test.ts` holds the rejecting-`listen` and
rejecting-`invoke` narratives (each proven recoverable by a retry that
reaches the board, and by a successful pick), and "the happy path
latches exactly once" makes seven further calls — sequential and
concurrent, long after success — and asserts `listenCalls` stays 1 and
`invokeCalls` stays 1. Probe A above is the same claim through the real
`<StrictMode>`.

### Obligation 6 — the pre-existing tests were STRENGTHENED, not weakened

The diff touches two files that already existed. Both were inspected by
diffing their test-name lists between `b623f6a` and HEAD, not by
reading the patch alone.

**`app/test/watcher-store.test.ts` — 28 tests, names IDENTICAL, zero
added, zero removed.** The only change is two defaults added to the
local `shell()` fixture helper (`starting: false`,
`startupFailure: null`), which is forced: `ShellState` gained two
required fields. No expectation changed, and the defaults appear on
BOTH sides of every comparison, so nothing became vacuous — if a pure
reducer ever touched these fields, the existing `toEqual`s would catch
it.

**`app/test/shell-harness.test.ts` — 8 tests, ONE renamed.** The rename
is honest and is the only name change in the diff:

```
- it("exposes exactly applyProjectStatus / applyPickOutcome / getShell", …
+ it("exposes exactly applyProjectStatus / applyPickOutcome / applyStartupFailure / getShell", …
```

The name states the key set and the key set grew by one door, so the
name had to move with it. The assertion keeps its shape — an EXACT
sorted key array, so a fifth door still reds — and gains a second one
the old form never had (every value must be a `function`).

Not taken on trust. Both halves poison-checked against production code:

| poison in `watcher-store.ts` | result |
|---|---|
| add a fifth harness door `applyBogusFifthDoor` | RED — `expected [ 'applyBogusFifthDoor', …(4) ] to deeply equal [ 'applyPickOutcome', …(3) ]` |
| keep the keys, make one door the string `"not-a-function"` | RED — `every door is callable — a key that is not a function is not a door` |

The second is the interesting one: it passes the old assertion and
fails the new one, so the change is a strict strengthening. (The
build-freshness gate in the same file also fired on its own during this
work, refusing a `dist/` older than the store — worth recording as a
guard that is alive rather than decorative.) `watcher-store.ts` was
restored byte-identically afterwards (sha256 `b52e7ff…fce1f`).

### Obligation 7 — every new test body EXECUTES

Not "the file runs" — every individual body. Each `it`/`test` in the
three new files had `throw new Error("POISONED_… #N")` injected as its
first statement, mechanically, and the suites were run:

| file | bodies | poisoned | went RED |
|---|---|---|---|
| `app/test/startup-recovery.test.ts` | 17 | 17 | 17 |
| `app/test/startup-screen.test.tsx` | 11 | 11 | 11 |
| `tools/e2e/tests/startup-recovery.spec.ts` | 4 | 4 | 4 |

`Tests 28 failed (28)` for the vitest pair and `4 failed` for the
Playwright spec, with all 32 distinct markers observed in the output.
A skipped, unreachable or vacuous body would have stayed green; none
did. All three restored and verified by sha256:

```
app/test/startup-recovery.test.ts: OK
app/test/startup-screen.test.tsx: OK
tools/e2e/tests/startup-recovery.spec.ts: OK
```

One thing worth flagging for the verifier, because it looks alarming
and is not: `app/test/startup-screen.test.tsx` shows in
`git diff --stat` as `Bin 0 -> 13002 bytes`. It is ordinary UTF-8 text
(`perl` reports valid UTF-8, and the file reads normally); git calls it
binary because the file deliberately contains 2 NUL bytes plus BEL and
ESC — the control characters in its hostile-message fixture, at lines
73 and 237. That is the test doing its job, not a corrupt file.

### Obligation 8 — suites, all at the final tree state

| suite | baseline | result |
|---|---|---|
| app (vitest), after `npm run build` | 507 | **535 / 535**, 32 files |
| app `tsc --noEmit` | — | clean (exit 0) |
| tools/e2e (Playwright, chromium) | 36 | **40 / 40** |
| tools/e2e `tsc --noEmit` | — | clean (exit 0) |
| lib/parser | 159 | **159 / 159**, 10 files |
| cargo (app/src-tauri) | 217 + 3 ignored | **217 passed, 0 failed, 3 ignored** |
| `lint:tokens` | — | clean, 38 files scanned under app/src |

The app delta is **+28**: 17 in `startup-recovery.test.ts` (16 from the
build session plus the re-entrancy regression this session added) and 11
in `startup-screen.test.tsx`. 535 − 28 = 507, the stated baseline,
exactly. The e2e delta is **+4**, all in `startup-recovery.spec.ts`.
Cargo's 217 is the sum across nine binaries (105 + 32 + 68 + 3 + 7 + 2),
with the 3 ignored being the perf harness, the byte-compare self-graph
test and one agent-runner case — the usual shape.

Port discipline: the lane ran on its own **14520**. Nothing in this
session bound or contacted 1420, and `tools/e2e/preflight.ts`
`resolveLanePort` throws on 1420 by construction. The boot-check script
was NOT run. No real model calls, no new dependency.

### Obligation 9 — the fence held

`git diff --stat b623f6a..HEAD`, twelve files, and every fenced path at
zero:

```
  app/src-tauri:        0 changed
  lib/parser:           0 changed
  method:               0 changed
  tools/e2e/scripts:    0 changed
  docs/architecture:    0 changed
  capabilities:         0 changed
  manifests/lockfiles:  0 changed
```

(the manifest check covers every `package.json`, `package-lock.json`,
`Cargo.toml`, `Cargo.lock`, `tsconfig*.json`, `vite.config.ts` and
`vitest.config.ts` in the tree.)

**Expected graph delta, NOT applied.** `docs/architecture/graph.json`
was deliberately not regenerated. `app/src/App.tsx` and
`app/src/lib/watcher-store.ts` both changed, so a regen will move C-05
(app-shell) and C-10 (the watcher store) — symbol counts and the
`StartupScreen` / `startupStepPhrase` additions in C-05, the
`StartupStep` / `StartupFailure` / `runStartup` / `recordStartupFailure`
additions in C-10. No new file was added under `app/src`, so no new
territory needs claiming and no `D2:unmapped` finding is expected — the
ordinary refresh shape, not a structural one.

### The predecessor's two suggestions — assessed first-hand

Both were filed by the build session, whose reasoning is gone. I drove
the real code to check them rather than trusting the prose.

**T-050-s1 (a hanging startup is not a rejection) — REAL, correctly
scoped, one mechanism detail wrong.** Measured, with `listen` returning
a promise that never settles:

```
  screen = loading   data-startup = waiting
  message = "waiting for the first docs snapshot…"
  buttons = ["Toggle theme","trying… [DISABLED]","Open a folder…","Start an interview"]
  after clicking "Try again": listenCalls 1 -> 1
  "Open a folder…" during the hang -> ["pick_project_folder"]
  ⌘O during the hang -> ["pick_project_folder"]
```

The conclusion is right and matters: T-050 answers a startup that
REJECTS, not one that hangs, and a hang is indistinguishable from a slow
start. The correction is to its stated mechanism — s1 says pressing
"Try again" "calls `startDocsWatcher()`, which returns the promise that
is already hanging", implying a silent no-op. In fact the button is
`disabled={starting}` and reads **"trying…"**, so the user cannot press
it at all (`listenCalls 1 -> 1` above is a click that never reached a
handler). That is arguably better than s1 claims — the affordance is
visibly unavailable rather than deceptively inert — but the sentence
should be corrected if the suggestion is picked up. Its two "get this
right" caveats (a raced-out attempt is still running and may register an
untracked subscription; N is a guess) are both real, and its cheap
intermediate (say how long it has been waiting) is sound. Correctly
scoped OUT of T-050: no criterion mentions a timeout, and adding one
under this card's fence would be a guess about N.

**T-050-s2 (a board reached after a failed subscribe is not live) —
REAL, correctly scoped, and the sharper of the two.** Measured:

```
  after failed subscribe: step=subscribe  screen=startupFailed
  a docs-changed handler was registered? false
  after a successful pick: phase=open screen=board seq=5 tasks=1
  startupFailure STILL set on the board? {"step":"subscribe","message":"Error: listen: refused","attempt":1}
  listenCalls total = 1  (a pick does NOT re-subscribe)
```

Exactly as filed. The user escapes an honest error screen onto a board
with real content (seq 5, one task) whose pipeline is dead — no
`docs-changed` handler was ever registered and the pick does not
re-subscribe. That is a worse failure mode than the one escaped,
because it looks fine. Two details confirmed in its favour:
`startupFailure` survives onto the board, so its remedy 1's condition
(`startupFailure?.step === "subscribe"`) is exactly expressible where it
proposes; and remedy 3's premise is accurate — `await listen(…)`'s
resolved unlisten function is discarded by this store. Contrast with the
RETRY route, which is genuinely live (obligation 4: `data-seq` moves to
2 after a retry). Correctly scoped out: no T-050 criterion asks for it,
and every escape T-050 promises does arrive somewhere. The asymmetry it
names is also already pinned as a FACT by
`startup-recovery.test.ts` → "records the snapshot step, and the
subscription that DID succeed is not lost".

### What the task did not name

- **A hang is a third failure mode** and the card's three layers do not
  cover it. This does not revise the card's "what is NOT claimed" — it
  widens it: @human's screenshot is equally consistent with a hang, and
  T-050 would not have helped a hung instance beyond giving it three
  buttons. T-050-s1 is the right home for that.
- **`starting` is not a phase.** `startupFailed` is a SCREEN with no
  phase of its own — it rides `loading` in the shipped app and `browser`
  in a served bundle, which is why `selectScreen` gates it on exactly
  those two and why the e2e spec asserts on the harness snapshot rather
  than on a selector alone.
- **The failure never reaches stdout.** Every other boundary error in
  this store echoes through `emit`; this one goes only to the webview
  console. That is defensible (there is no `model-updated` to ride) but
  it means a stranded launch leaves no trace in the log @human sends —
  which is precisely why the card could not say what stranded theirs.

## Verdicts
