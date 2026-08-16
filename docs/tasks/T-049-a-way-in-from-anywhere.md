---
id: T-049
title: A way in from anywhere — the accelerators leave the front door, and genesis gets a door
feature: F-03
milestone: 3
priority: 6
size: S
status: done
blocked_by: []
touches: [app-shell]
builder: claude-opus-5
verifier: claude-opus-5
built_by: "claude-opus-5 @fresh"
verified_by: "claude-opus-5 @fresh"
review: same-model
---

Found by @human on 2026-08-16 during the visual review session, trying
to use the shortcuts the front door advertises: "command + o and
command + n are not working in nputer."

**They are the right keys and nothing is broken — the listener simply
is not there.** `useEffect`'s `window.addEventListener("keydown", …)`
lives INSIDE the `EmptyState` component (app/src/App.tsx:143), so it
registers when the front door mounts and unregisters when it leaves.
With a project open the board renders instead, `EmptyState` never
mounts, and ⌘O/⌘N reach nothing. T-026's tests pin exactly this — the
unmount-scoping is asserted deliberately — because its criterion says
the affordances appear "on EVERY empty state". Built to spec; the
spec was narrower than the app needs.

**The sharper half: there is NO way to start an interview from an
open project.** Not a shortcut, not a button. The board's header
carries "Open folder…" (App.tsx:325) and nothing else, so reaching
genesis today is: Open folder… → choose a folder with no docs/ → land
on the "No plan in <folder>" card → "Start an interview here". Four
steps to reach the thing milestone 3 is named after, and the first
step is a picker whose own shortcut does not work from where you are.

Related and deliberately NOT duplicated: T-026-s2 asked for one
screen-scoped accelerator table instead of per-component `window`
listeners, and the second triage folded it into T-027 — the right home
for the ROUTING question, since T-027 is the second screen that wants
keys. This task is the narrow usability fix that cannot wait for an L
card blocked on a human verdict; it must leave T-027's fold intact and
should make that fold EASIER, not redundant.

## Acceptance criteria
- THE ⌘O and ⌘N accelerators SHALL fire from any screen the app can
  show — board, map, genesis, and every empty state — rather than
  only while `EmptyState` is mounted; the Ctrl equivalents keep
  working as today.
- THE board SHALL offer a "Start an interview" affordance beside the
  existing "Open folder…" button, so genesis is reachable in one step
  from an open project rather than four, and so the capability is
  discoverable without knowing a chord. Design source: the front
  door's own two-button pairing (docs/design/claudedesign_handoff/
  "nputer app.dc.html", the `open a folder` screen) — same verbs, same
  order, adapted to the header's existing button idiom; tokens-only,
  no new tokens, both schemes.
- WHEN an accelerator fires while a picker is already in flight THE
  app SHALL do nothing rather than stack a second native dialog —
  T-021's single-flight guard already returns a typed `busy`, and this
  SHALL be respected rather than re-implemented.
- THE existing front-door behaviour SHALL be unchanged: the two
  buttons, the `⌘O · ⌘N` hint, the "No plan in <folder>" card and its
  "Start an interview here" all render and behave as they do today,
  pinned by T-026's existing suites.
- THE registration SHALL be a single app-scoped listener, not a second
  `window` listener racing the first — T-026's `EmptyState` listener
  is REPLACED, not supplemented. A test SHALL assert exactly one
  keydown listener path handles the chords, so T-027's later
  accelerator table has one thing to absorb rather than two.
- IF a text input or textarea has focus THEN the accelerators SHALL
  still work (⌘O/⌘N are not text-editing keys) but SHALL NOT fire on
  a chord the platform reserves — no new preventDefault beyond the two
  chords already claimed.

Verification: headless — vitest DOM asserting the chords fire from
board, map and genesis screens as well as the front door, that the
listener is single, and that a busy picker is respected; plus the
tools/e2e lane driving a real trusted ⌘O through the shell harness
T-041 just landed (the first task able to do this). @human: whether
the header's two-button pairing reads right at the board's density —
the front door has room to breathe and the header does not.

## Implementation notes

Executor claude-opus-5 @fresh, 2026-08-16, branch `t049-way-in`
(worktree ../nputer-t049). Branch point: main@aab62f0 (the dispatch
commit). Baselines measured there before any edit and reproduced at the
end: lib/parser **159/159**, app **491/491** (28 files, after
`npm run build`), cargo **217 passed + 3 ignored**, tools/e2e **33/33**,
`lint:tokens` clean at 37 files.

**Five files.** New: `app/src/components/shell/accelerators.ts`,
`app/test/accelerators.test.tsx`, `tools/e2e/tests/accelerators.spec.ts`.
Modified: `app/src/App.tsx`, `app/test/project-shell.test.tsx`. Plus this
card and two suggestions. ZERO diff under `app/src-tauri/`,
`lib/parser/`, `method/`, `docs/architecture/`, `capabilities/`, every
lockfile and every manifest — and, per the lane fence, zero diff to
`app/src/components/shell/GenesisScreen.tsx`,
`tools/e2e/tests/genesis-screen.spec.ts` and every `min-h-screen` /
`h-screen` / `min-h-0` class in the tree (obligation 8).

### What was built

**One listener, one table** (`app/src/components/shell/accelerators.ts`,
new, 129 lines):

- `matchAccelerator(chord) -> "openFolder" | "startInterview" | null` —
  PURE, and T-026's semantics byte for byte: Command OR Control, never
  with Alt or Shift, only `o`/`n`, case-insensitive. It makes "which
  chords does this app claim?" a question with ONE answer in ONE place,
  which is what makes criterion 6 checkable rather than habitual.
  Deliberately makes no judgment about the event's TARGET, so the chords
  keep working while a text input has focus.
- `useAccelerators(table)` — THE registration. One `window` keydown
  listener, added once and removed once, reading the table through a ref
  so a caller that rebuilds its table every render (which `App` does) does
  not churn the listener. An accelerator absent from the table is left
  completely alone — no `preventDefault`, nothing swallowed.
- `App` mounts it once, at the root, wired to the store's own
  `pickProjectFolder` / `pickGenesisFolder`. `EmptyState`'s `useEffect`
  is GONE, not duplicated: the component now registers nothing.

**The header's second way in** (`App.tsx`, the `data-panel-exempt`
control group): `Open folder…` then `Start an interview`, both
`variant="outline"` at the default size, both `disabled={shell.picking}`,
inside the existing `screen.screen === "board" && isTauriRuntime()` gate.
Same verbs as the front door, same order, in the header's own idiom. It
calls `pickGenesisFolder()` — the same command ⌘N reaches and the same
one the front door's "Start an interview" has called since T-026, so
genesis from an open project is one step instead of four (Open folder… →
a folder with no docs/ → the "No plan in &lt;folder&gt;" card → Start an
interview here, the first step of which is a picker).

### Where the listener lives, and why (the dispatch asked)

`app/src/components/shell/accelerators.ts` — beside the shell's
components, not in `App.tsx` and not in `app/src/lib/`.

- **Not in `App.tsx`.** T-027 must absorb this into a screen-scoped
  table. A table that already lives in its own module, with a pure
  matcher beside it, is a thing to EXTEND; an effect inline in a 454-line
  root component is a thing to extract first. The hook re-reads its table
  on every render, so `useAccelerators(tableFor(screen))` is a change of
  ARGUMENT, not of mechanism — T-027 adds rows and a screen dimension and
  touches no listener code.
- **Not in `app/src/lib/`, and this was MEASURED rather than reasoned.**
  I first put it at `app/src/lib/accelerators.ts` and regenerated the
  graph: `app/src/lib/`'s files are claimed one by one by three different
  components (`watcher-store.ts` + `docs-model.ts` are C-10's,
  `agent-store.ts` is C-14's, `utils.ts` + `verdicts.ts` are C-05's), so
  the new file was claimed by NOBODY. The regen produced a
  `D2:unmapped` finding naming it, an unmapped bucket on the map, an
  extra relation row and a moved drift flag — i.e. **four** dogfood
  assertions moving in the wrong direction, including
  `architecture-dogfood.test.ts`'s "zero unclaimed territory". Moving the
  file to `app/src/components/shell/` (already C-05's declared
  territory, `docs/architecture/components/C-05-app.md:14`) reduced the
  regen delta to the ordinary three-assertion shape and cost no
  architecture edit. The precedent is exact:
  `app/src/components/board/panel-dismissal.ts` is the same shape — a
  listener-wiring module living beside the components it serves.
- **Not in the store.** `watcher-store.ts` is C-10's IPC glue and imports
  no React; a hook there would drag React into a module that non-React
  tests import directly, and would file the app's keys under the docs
  watcher.

### Criteria → evidence map

**C1 — the chords fire from every screen, Ctrl equivalents intact.**
`accelerators.ts:108-129` (the one registration) + `App.tsx:257-270`
(mounted at the root). Evidence, all against the REAL App and the REAL
store with only the IPC boundary mocked
(`app/test/accelerators.test.tsx`, one ordered narrative):
test 1 the front door, test 2 the board, test 3 the map pane, test 4 the
genesis screen — each firing ⌘O → `invoke("pick_project_folder")`, ⌘N →
`invoke("pick_genesis_folder")`, then both again with Ctrl. Test 4's
transition is itself the proof of the point: the ⌘N is pressed ON THE
BOARD and lands the app on the interview screen. Lane half:
`tools/e2e/tests/accelerators.spec.ts` (obligation 5).

**C2 — a "Start an interview" affordance beside "Open folder…".**
`App.tsx:326-356`. Tests: `accelerators.test.tsx`, describe "the header
offers both ways in from an open project" — the labels; the ORDER
(`compareDocumentPosition`, open first); each button wired to its own
command (clicked, `invoke` asserted by name); both disabled while a
dialog is in flight; and both absent from the interview screen and the
front door, so the pairing is the board header's and nothing leaked. No
new token, no new CSS: the built stylesheet is byte-identical to main's
(`index-BheOMAjN.css`, 41.24 kB, same content hash — obligation 7).

**C3 — a chord fired while a picker is in flight stacks no second
dialog.** No new guard: the accelerator calls the same
`pickProjectFolder`/`pickGenesisFolder` the buttons call, and `runPicker`
already returns early on `shell.picking` while T-021's Rust latch answers
a typed `busy` to anyone who gets past it. Driven through the store, not
asserted in prose (`accelerators.test.tsx`, describe "a picker already in
flight"): the mocked `invoke` PARKS (the native dialog standing open),
⌘O is fired, `getShellState().picking` is `true`, then three more chords
(⌘O, ⌘N, Ctrl+O) — `invoke` is still called exactly ONCE and the shell
object is unchanged BY IDENTITY (`toBe`). Releasing with `cancelled`
clears the latch and the next chord works. A second test fires a chord
whose command answers T-021's typed `{kind:"busy"}` and asserts the
reducer's identity return, so the accelerator inherits that decision
rather than re-deciding it.

**C4 — the front door's own behaviour unchanged.** `EmptyState`'s render
tree is untouched (the diff removes an effect and edits a doc comment;
no JSX changed). T-026's suites: `app/test/genesis-entry.test.tsx`
**6/6 green, unedited, zero-byte diff** — it drives the whole front-door
flow through the real App, including both buttons, the `⌘O · ⌘N` hint,
the "No plan in &lt;folder&gt;" card and "Start an interview here".
`app/test/project-shell.test.tsx` 11/11 green with TWO tests changed —
declared loudly under obligation 3, because one of them pinned the
unmount-scoping this task removes. The lane's `front-door.spec.ts` and
`no-plan-card.spec.ts` are untouched and green.

**C5 — a single app-scoped listener, T-026's REPLACED not supplemented.**
The old `useEffect` is deleted (see the diff). Two independent tests, in
`accelerators.test.tsx`:
- *Per screen, on every chord*: the `chord()` helper dispatches from the
  app's own root element (so the event propagates element → document →
  window, exactly as a real keypress does) and returns how many times
  `preventDefault` was called on that ONE event. Every accelerator
  assertion in the file requires **1**. A second handler anywhere on
  either target makes it 2.
- *By enumeration*: the file patches `addEventListener`/
  `removeEventListener` on window AND document BEFORE the App mounts,
  keeps a live list of keydown paths across every screen the narrative
  visits, then calls each live handler individually with a ⌘O and counts
  how many reach `pick_project_folder`. Requires exactly **1**, for ⌘O,
  ⌘N and Ctrl+O. Plus: the front door is remounted and the live-path
  count must not move.
- *Why not the obvious test*: counting `invoke` calls after one press
  does NOT discriminate, and I measured it rather than guessing. With a
  deliberate second listener installed, one dispatched ⌘O produces
  **preventDefault ×2 and `invoke("pick_project_folder")` ×1** — the
  store's own single-flight latch swallows the duplicate. A naive
  "invoked once" test would have passed over two racing listeners. That
  is the whole reason the two forms above exist.
- Component half, in T-026's own file: `EmptyState` registers ZERO window
  keydown listeners (counted by wrapping `addEventListener` around its
  mount) and a chord pressed while it is mounted reaches none of its
  props.

**C6 — focused inputs still get the chords; no new preventDefault.**
`matchAccelerator` never looks at `event.target`; `useAccelerators` calls
`preventDefault` only for a chord that matched AND has an entry in the
table. Tests: `accelerators.test.tsx` test 3 focuses the map's real
`map-search` input, dispatches ⌘O FROM it and asserts the command fires
and the claim count is 1, then asserts ⌘A and a bare `o` are claimed
**0** times from that same input; the pure table (last describe) pins
⌘/Ctrl+O/N in both cases and `null` for bare `o`, ⌘P, ⌘F (the map's own
key), ⇧⌘O, ⌥⌘O and Escape. Lane half: the trusted ⌘P and ⇧⌘O come back
`defaultPrevented: false` on every screen, and real typing into the map's
search field is unaffected (`toHaveValue("C-05")` after the chord).

### THE TWO T-026 TESTS THAT CHANGED — declared loudly (obligation 3)

Both are in `app/test/project-shell.test.tsx`. Everything else in that
file, and every other T-026 test in the repo, is untouched.

**(a) `"the advertised accelerators actually work (⌘O opens, ⌘N
interviews)"` — kept by name, same presses, byte-identical assertions.**
Only its mount changed:

```
-    const h = mount();
+    // T-049: the table is the app's, not this component's — mounted here
+    // exactly as App mounts it. The assertions below are unchanged.
+    const h = mountWithAccelerators();
```

`mountWithAccelerators` renders `<EmptyState/>` under a two-line wrapper
that calls the PRODUCTION `useAccelerators` with the same two actions
`App` gives it. Why at least as strong: the assertions it makes are about
chord SEMANTICS (⌘O, ⌘N, Ctrl+O positive; bare `o`, ⌘P, ⇧⌘N negative),
and they now run against the shipped matcher instead of a copy of it
inside the component. The half that this file could never prove —
"⌘O/⌘N reach the right COMMAND" — moved up to `accelerators.test.tsx`,
where it runs against the real App and the real store on four screens
instead of against `vi.fn()` props on one.

**(b) `"stops listening once the front door is gone"` — REPLACED by
`"owns no window listener of its own (the app's table is the only one)"`.**
This is the test the dispatch warned about, and it had to go:

```
-  it("stops listening once the front door is gone", () => {
-    const h = mount();
-    act(() => root.render(<div />));
-    press("o");
-    expect(h.onPick).not.toHaveBeenCalled();
-  });
+  it("owns no window listener of its own (the app's table is the only one)", () => {
+    let h: ReturnType<typeof mount> | null = null;
+    const registered = keydownRegistrations(() => { h = mount(); });
+    expect(registered, "EmptyState must add no keydown listener").toBe(0);
+    press("o");
+    press("n");
+    expect(h!.onPick).not.toHaveBeenCalled();
+    expect(h!.onStartInterview).not.toHaveBeenCalled();
+  });
```

The old test asserted the unmount-scoping DELIBERATELY, and the
unmount-scoping is the defect @human hit. Left in place it would still
have passed — **vacuously**, because a component that never listens
cannot stop listening, which is precisely the silent-green outcome
nobody wants. The replacement is strictly stronger on the property that
survives: it asserts the mechanical form of criterion 5 (this component
adds NOTHING to the app's one listener, counted at registration time, so
it cannot supplement it) plus the same fact stated positively (a chord
pressed while it IS mounted reaches none of its props). The behaviour the
old test was reaching for — the chords still working when the front door
is gone — is asserted where it now lives: `accelerators.test.tsx` tests
2, 3 and 4, on the board, the map and the interview, against the real
store. Both halves were poison-drilled (below), so neither is inert.

### The eight proof obligations

**1. The chords fire from every screen.** `app/test/accelerators.test.tsx`,
12 tests, all green — front door, board, map (and from a focused text
input), genesis; ⌘ and Ctrl for both commands on each; each reaching the
right command by name through the real store. See C1.

**2. Exactly one listener.** Three independent instruments (per-screen
`preventDefault` count, live-path enumeration, and the component-level
registration count in T-026's file) — see C5, including the measurement
showing why the obvious instrument does not discriminate. DRILLED: a
second `useAccelerators` call added to `App` reds **11 of 12** tests in
the file, the first failure being `⌘O is claimed by exactly one handler:
expected 2 to be 1`, and the enumeration test alone reds with
`expected 2 to be 1`. Reverted, sha256-verified.

**3. T-026's suites green by name.** `genesis-entry.test.tsx` 6/6,
zero-byte diff. `project-shell.test.tsx` 11/11 with the two changes
declared above (diffs shown, strength argued). `watcher-store.test.ts`
untouched and green. Lane: `front-door.spec.ts` 3/3 and
`no-plan-card.spec.ts` 4/4, untouched.

**4. The busy path, driven through the store.** See C3 — a parked
`invoke`, four chords, one dialog, `getShellState()` unchanged by
identity, latch released on cancel, plus the typed-`busy` case.

**5. A real trusted chord in the lane.**
`tools/e2e/tests/accelerators.spec.ts`, 2 tests, driving T-041's
`__nputerShellHarness` to `noProject` / `open` / `genesis` and firing
REAL `page.keyboard.press("Meta+o")` etc. against the served bundle. What
it observes is stated plainly in the spec header and is not overclaimed:
outside Tauri `runPicker` returns before `invoke`, so a browser cannot
follow a chord to a command — what it CAN follow is the claim, via a
witness listener that reads `defaultPrevented`. The discriminating
controls are in the same helper (⌘P, ⇧⌘O and a bare `o` must come back
`false` on every screen), and one ordering fact makes the evidence
sharper than it looks: the witness is armed after page load, so it can
only see `true` for a handler registered BEFORE any screen mounted. The
spec asserts the claim already holds on the bare `browser` screen, before
a single project state is applied.
**DRILLED against the unfixed code**: restoring T-026's `EmptyState`
listener and deleting the root registration reds this spec (and reds
`accelerators.test.tsx` tests 2/3/4 while test 1, the front door, stays
GREEN — which is @human's bug report reproduced exactly). Reverted,
sha256-verified.

**6. Every new test executes.** Poison injection
(`expect("PROBE").toBe("EXECUTED")` as the first statement of every new
or changed body), run, reverted from pre-injection copies and confirmed
by sha256: `accelerators.test.tsx` 12 → **12 failed**,
`accelerators.spec.ts` 2 → **2 failed**, the two changed bodies in
`project-shell.test.tsx` → **2 failed** (the other 9 in that file stayed
green, so the injection was surgical). Run twice — once before and once
after the module moved from `app/src/lib/` to
`app/src/components/shell/` — because the second move rewrote an import
line in both test files. Final sha256:
`accelerators.test.tsx` `56f5f1e0d84630a4e3ea97bbe84bf90a08c0ad24c8e69eeebc5dd695b5481735`,
`accelerators.spec.ts` `3c6e1b299ebc9dbbb146d9c1477ce0c589d9b58eafb61f7060d82acc0626a328`,
`project-shell.test.tsx` `8b8dc94be35464e13ec0350105cfe8ba757d38addfad30f38955bf1df1c2a048`,
`App.tsx` `53ee963db98bb48902d0fb64b8cc3788a24a556ffdb8919d07a09ac5480fa948`,
`accelerators.ts` `54fcb5d791bbb6a532dc7319931d16bc45e84d2081524aff88d27571f9f5f5d2`.

**7. Suites** (macOS 15/Darwin 25.6, node v22.22.0, ADR-011 order, fresh
installs in this worktree):
- lib/parser: `npm ci` + `npx vitest run` **159 passed (10 files)**,
  `npx tsc --noEmit` clean. Re-run AFTER the two suggestion files landed
  in the live `docs/tasks/` tree (that suite parses the live tree) —
  still **159/159**.
- app: `npm install`, `npx tsc --noEmit` clean, `npm run build` exit 0
  (**253 modules**, `index-BumOZNae.js` **442.49 kB** /
  `index-BheOMAjN.css` **41.24 kB — the same CSS asset name and size as
  T-041's and T-047's builds**, i.e. this branch emits not one new CSS
  rule), `npx vitest run` **503 passed (29 files)** = the 491 baseline +
  12 new. No pre-existing test deleted or loosened.
- app/src-tauri: bare `cargo test` **217 passed + 3 ignored, 0 failed**,
  exit 0, **zero warnings**, 11 test binaries — the baseline exactly, as
  it must be for a branch with zero Rust. The exit code was captured from
  `$?` on an UNPIPED command writing to a file (the standing `$PIPESTATUS`
  trap; my first run went through `tail` and its exit code proved
  nothing, so it was re-run properly rather than reported).
- tools/e2e: `npm ci` + `npx playwright test` **35 passed (7.6s)**,
  headless, one worker, retries 0, no skips = 33 + 2 new;
  `npm run typecheck` clean; `npm run lint:tokens` **clean, 38 files**
  (37 + the new module); `--selftest` **43 samples green**.
- **AND ON THE COMPOSED TREE, because main moved.** T-048 merged as
  `0f55cc6` mid-session, so I merged main into a scratch branch off this
  commit and ran the suites there before deleting it: the merge is
  textually CLEAN (`git merge-tree --write-tree HEAD main` → one tree,
  `820d29fa1875eba3a327555e66f33ea1d399ec31`, zero conflict markers; the
  two `App.tsx` import lines merged without a conflict), and the
  composition is behaviourally clean too — app **507 passed (30 files)**
  after a rebuild, lane **36 passed**, `tsc` clean. So T-048's bounded
  frame and T-049's accelerators compose; the integrator's merge should
  need nothing but the graph regen. (The one failure before the rebuild
  was `genesis-mount`'s staleness guard doing its job over a `dist/`
  older than the merged source — worth knowing, since the same will
  happen at the merge.) The scratch branch was deleted and this worktree
  is back on `t049-way-in` with its own build.

**8. Fence, proven rather than asserted — and against the MERGE-BASE,
not against `main`, because main moved under me** (T-048 merged as
`0f55cc6` while this branch was being built; `git merge-base main HEAD`
is still `aab62f0`). All three checks below are `git diff aab62f0`:
- `--stat` is `app/src/App.tsx` + `app/test/project-shell.test.tsx` +
  this card, plus five untracked files (the module, the two test files,
  the two suggestions).
- `git diff aab62f0 -- app/src/components/shell/GenesisScreen.tsx
  tools/e2e/tests/genesis-screen.spec.ts app/src-tauri lib/parser method
  docs/architecture app/package.json '**/package-lock.json'
  '**/Cargo.lock' '**/Cargo.toml' capabilities | wc -c` = **0**.
- `git diff aab62f0 -- app/src | grep -E
  '^[+-].*(min-h-screen|h-screen|min-h-0)'` returns **nothing** — no
  layout class was touched in either direction, which is what makes
  T-048's three edits land on lines this branch never saw.
Zero new `invoke(`/`listen(`/`emit(` call sites in `app/src`; no new
dependency; no new IPC, no new grant, no Rust. ../nputer-t048 was never
entered.

**THE T-048 RECONCILIATION, checked rather than hoped.** T-048 is now on
main and it edits `App.tsx` too (an import, a ~32-line block inside
`App()` after the pane state, and the shell column's class at :321).
This branch's `App.tsx` edits are an import, a block inside `App()`
BEFORE the pane state, and the header's button group — disjoint hunks,
proved rather than assumed: `git merge-tree --write-tree HEAD main`
answers a single tree (`820d29fa…`) with zero conflict markers, and the
scratch merge described under obligation 7 ran the composed suites green
(app 507, lane 36). Even the import list merged cleanly, where both
branches add a line.

### For the integrator: the graph regen delta, MEASURED

The interim T-009-s1 rule FIRES (the diff carries `*.ts/*.tsx` outside
`docs/`). **Baseline note, because main moved**: the numbers below are
against the graph committed at `aab62f0`, which is byte-identical to the
one committed on main today (`git diff aab62f0..main --
docs/architecture/graph.json | wc -c` = 0) — so T-048's merge did NOT
regenerate it, and T-048 adds `app/test/shell-frame.test.tsx`. If that
merge's regen lands first the baseline becomes 90 and this branch's +2
applies on top (→ 92); if both land unregenerated, one regen at the
T-049 merge covers all three files. I regenerated in-branch to measure,
then restored
`docs/architecture/graph.json` to the committed bytes — sha256
`05ebc2c772ffa3aaabc23aefa0feae60f2c4652ab9e64ac1c64de0044f5e478a`,
`git status` clean for that file, and the ignored `self_graph_is_current`
is RED on-branch exactly as T-026's and T-018's branches left it.

- files **89 → 91**: adds `app/src/components/shell/accelerators.ts` and
  `app/test/accelerators.test.tsx`; nothing removed.
  `tools/e2e/tests/accelerators.spec.ts` is invisible (`.nputerignore`
  carries `tools/`), as T-041 forecast for its own lane files.
- content-changed (hash/loc only): `app/src/App.tsx`,
  `app/test/project-shell.test.tsx`.
- stats: symbols **602 → 628**, edges **1003 → 1028**.
- EXACTLY THREE assertions move, in two files — the same shape as the
  T-041 and T-026 merges, and I checked each by running the suite against
  the regenerated graph:
  1. `app/test/architecture-dogfood.test.ts` file count `toBe(89)` →
     `91` (and its test NAME says 89).
  2. `app/test/architecture-dogfood.test.ts:651`
     `["C-05", "C-10", "confirmed", 20]` → **22** — verified by editing
     that one row and re-running the relation-table test green. The two
     new edges are `accelerators.test.tsx` importing `docs-model` and
     `watcher-store`, both C-10 files, in the DECLARED direction.
  3. `app/test/map-dogfood-render.test.tsx` `committed graph · 89 files`
     → `· 91 files`.
- No new finding, no unmapped bucket, no drift-flag movement, no change
  to the map's node or edge COUNT tests — because the new module lives in
  claimed territory (see "Where the listener lives"). `lib/parser`'s
  registry pin does not move: no component was declared.

### Deliberate silences and honest limits

- **THE BOOT GATE WAS NOT RUN, and that is news rather than silence.**
  CONVENTIONS' BOOT GATE bullet triggers on `app/src/**` and says the
  executor runs it too; this dispatch instructed in as many words "Do not
  run the boot-check script", with 1420 fenced because @human is using
  the app live. So it is UNRUN, deliberately, on an `app/src/**` diff —
  the integrator owes it at merge (`NPUTER_BOOT_PORT=<free scratch port>
  npm run boot:check`). What the branch does carry instead: `npm run
  build` exit 0, `tsc` clean, and 35 lane tests driving the real served
  bundle in a real browser.
- **The lane proves the chord was CLAIMED, not that it was OBEYED**, and
  the header pair is invisible to it (both header buttons are behind
  `isTauriRuntime()`). Both are recorded honestly in the spec header and
  filed as **T-049-s1** rather than papered over.
- **No native menu, no ⌘-vs-Ctrl label change** — T-026-s2 parked both
  with T-022 and this task leaves them there. The rendered hint is still
  the design's `⌘O · ⌘N` over a handler that accepts either modifier.
- **The accelerators are still app-wide, not screen-scoped.** That is
  T-027's charter (it is the second screen that wants keys) and inventing
  the screen dimension now would be building its design without its
  planning pass. What T-049 leaves it is one listener whose table is
  re-read every render — see T-049-s2 for the one-line criterion
  reconciliation it needs.
- **Nothing bound or contacted port 1420.** The lane bound 14520 only and
  released it; the human's vite still holds `[::1]:1420` on the same pid
  90127 / fd 28u / device `0xc074e387883bd776` recorded at T-047's merge.
  No boot check, no screen control, no screenshots, no OS input injection
  (Playwright's trusted input goes into its own headless browser), no
  model call, no new dependency.

### @human — the one judgment this task owes

**The header's density.** The board header's right-hand control group now
reads `[docs truncation note?] [skipped chip?] [parse-error chip?] [Open
folder…] [Start an interview] [Toggle theme]` — three buttons where there
were two, and on a narrow window that group sits beside the wordmark and
the project path. The front door has room to breathe and the header does
not. Specifically worth your eye:

1. Do two outline buttons plus Toggle theme read as one control group, or
   does it want a separator, or should "Start an interview" carry the ink
   pill emphasis the front door gives its primary? I kept both outline
   because the criterion says "adapted to the header's existing button
   idiom", and every header control today is the quiet outline.
2. Should the header pair carry the `⌘O · ⌘N` hint the front door
   carries? I left it off deliberately — the buttons are the discovery
   the criterion asks for, and the hint would add a third element to a
   row that just gained one — but it is the obvious counter-argument.
3. Verb wording: the header says `Open folder…` (T-026's), the front door
   says `Open a folder…`. I did not unify them; the criterion says "same
   verbs" and these are the same verb in two registers.
4. And the thing you actually reported: press ⌘O and ⌘N on the board, on
   the map, and on the interview screen. They should open the two native
   dialogs from all three now, and do nothing at all if a dialog is
   already up.

### Suggestions filed

- `T-049-s1-the-lane-sees-a-browser-not-the-app.md` — the served bundle
  can prove a chord was claimed but never that it was obeyed, and the
  header's two ways in do not render there at all; three candidate
  remedies, and it matters more for T-027 than for this task.
- `T-049-s2-t027-criterion-names-a-retired-test.md` — T-027's accelerator
  criterion says "their unmount-scoping test stays green", which this
  task deliberately made false; one-line reconciliation suggested for its
  planning pass, plus the two facts it should not have to rediscover.

## Verdicts

2026-08-16 — claude-opus-5 @fresh (verifier, same-model as builder):
**APPROVED** — all six criteria met and re-derived from the branch at
`3921426` (merge-base `aab62f0` confirmed, 8 files). Nothing was taken
from the notes: every number below is my own measurement, and where the
notes made a claim I could falsify I tried to. Port 1420 was never
bound or contacted (the human's vite still holds `[::1]:1420`, pid
90127, fd 28u — observed, not touched); the lane bound 14520 only; the
boot check was not run (the merge owes it, per the dispatch);
`../nputer-t048` was never entered and is now gone from the worktree
list.

**THE DOUBLE-LISTENER MEASUREMENT — re-derived, and it is exactly
right.** This is the claim the whole test design rests on, so I built
it from scratch: a throwaway probe that mounts the real `App`,
dispatches ONE ⌘O from the app's root element, and reports the
`preventDefault` count and the `invoke` count side by side. One
registration → `preventDefault=1, invoke(pick_project_folder)=1`. A
SECOND `useAccelerators` added to `App` →
**`preventDefault=2, invoke(pick_project_folder)=1`**. The mechanism is
`runPicker`'s first two lines: `if (!isTauri || shell.picking) return;`
then a SYNCHRONOUS `setShell({ picking: true })` before the `await
invoke(...)`, so the second listener — firing in the same dispatch —
finds the latch already closed and the duplicate never reaches IPC. A
naive "invoked once" test would have passed over two racing listeners.
Confirmed downstream: with the second registration in place
`accelerators.test.tsx` reds **11 of 12**, first failure `⌘O is claimed
by exactly one handler: expected 2 to be 1`; the enumeration test run
alone reds with `expected 2 to be 1`. Both numbers are the notes'.

**DEFEAT ATTEMPTS against "exactly one listener" — six shapes, four
caught.** Each was a real second handler injected into `App` and run
against the shipped suite: (V1) raw `window` keydown, preventDefault +
command → **caught**, 11 red; (V2) same on `document` → **caught**, 11
red; (V3) `window` listener that runs the command but never
`preventDefault`s → **caught by the ENUMERATION only**, 2 red, which is
the proof the two instruments are genuinely independent rather than two
readings of one; (V4) listener on `document.body` — outside the
enumeration's window/document scope — with preventDefault →
**caught by the per-chord claim count**, 11 red, the complementary
direction. Two survived and both are narrow: (V5) a `window.onkeydown`
PROPERTY handler is invisible to the enumeration by construction, and
in jsdom it never fires at all, so the miss cannot even be
demonstrated; (V6) a `document.body` listener that runs the command
WITHOUT claiming the chord is seen by neither instrument. Neither is
reachable from anything in the tree — every keydown listener in
`app/src` uses `addEventListener` on `window` or `document`
(`accelerators.ts`, `panel-dismissal.ts`, `MapView.tsx`'s ⌘F) — and
both are recorded in **T-049-s3** rather than papered over. Criterion 5
asks for a test asserting exactly one keydown path handles the chords;
three instruments do, and four of six attacks die on them.

**Remount / leak drill.** Four full screen cycles (board → map →
genesis → empty → board, driven by real chords) with the live keydown
path list read at 16 points: `[1,2,1,1] × 4` — one path everywhere,
two only while the MAP is mounted (its own ⌘F handler), back to one
when it leaves. Nothing accumulates. After all that churn, exactly ONE
live path reaches each of ⌘O, ⌘N, Ctrl+O and Ctrl+N.

**C1 — the chords fire from every screen.** Re-derived independently
against the real App and the real store: front door, board, map pane
(including from the focused, CONTROLLED `map-search` input, whose value
survives the chord unchanged), and the interview — ⌘O →
`pick_project_folder`, ⌘N → `pick_genesis_folder`, both again with
Ctrl, each with a claim count of exactly 1. The ⌘N pressed ON THE BOARD
lands the app on the interview screen: the thing @human could not do,
done in one keypress.

**THE DEFECT REPRODUCED, mechanically.** I restored T-026's scoping
(the `useEffect` back inside `EmptyState`, the root registration
deleted, `tsc` clean) and ran the new suites against it. Vitest: test 1
— the front door — stays **GREEN**, while tests 2 (board), 3 (map) and
4 (genesis) go **RED** with `⌘O is claimed by exactly one handler:
expected +0 to be 1`. That is @human's bug report as a test transcript:
right keys, listener absent, and invisible from the one screen the old
test suite could see. The lane spec reds too, first on
`the app claims ⌘O before any screen exists` — the ordering fact its
header explains, holding.

**C2 — the header's second way in.** Both labels, correct order
(`compareDocumentPosition`), each wired to its OWN command by name,
both `disabled` while a dialog is in flight, both absent from the
interview screen. I closed the one half the suite names but does not
walk: on the FRONT DOOR both header buttons are `null` while the front
door's own pair and the `⌘O · ⌘N` hint are intact, and on the MAP PANE
the pair correctly stays (the map is a pane of the board screen, not a
screen). The two new buttons' `className` is byte-identical to each
other's and to the Toggle theme sibling's — the header's existing quiet
outline, not a new look. Mutants: wrong command on the new button → 2
red; dropping its `disabled={shell.picking}` → 4 red; disturbing the
pair's order/presence → 9 red across two files.

**THE CSS BYTE-IDENTITY — re-derived, and the stronger version holds.**
I exported the merge-base app tree to scratch, built it with the same
toolchain, and compared: branch `index-BheOMAjN.css` sha256
`c8d9f6d9fc6f70ed65dc740f0507b6cd5ce4901625c6292d1e88db9df2b38342`,
merge-base `index-BheOMAjN.css` the SAME sha256, `cmp` identical. Not
one new CSS rule. One correction to the notes, which is staleness and
not error: main has moved twice since this branch was cut, and today's
main (`6356246`, T-048 merged and checkpointed) builds
`index-RXeeD2qB.css` at 41.30 kB — so "byte-identical to main's" is no
longer true as written, while the claim that matters is. I checked the
stronger form instead: the COMPOSED tree (this branch + main) builds
`index-RXeeD2qB.css` with sha256
`a1fa12d094e4fe1b731ba5080fe39383fbd6541c939b1121f84002c53c4def2a` —
byte-identical to current main's own build. T-049 adds no CSS on top of
T-048 either.

**C3 — the busy path, hammered.** Verified it is DRIVEN through the
store rather than asserted: with the mocked `invoke` PARKED (native
dialog standing open), one ⌘O opens it, then **20 rapid mixed chords**
(⌘O, ⌘N, Ctrl+O, Ctrl+N in rotation) plus a **five-event SYNCHRONOUS
burst** in a single flush — `invoke` still called exactly **once**, and
`getShellState()` unchanged **by identity** (`toBe`) at every step,
screen unmoved. Release with `cancelled` → latch clears, next chord
works, one invoke. The typed-`busy` case separately: six chords whose
command answers `{kind:"busy"}` leave `rejectedPick`, `docs`, `phase`,
`resolvedDir`, `genesisDir` and `indexOutcome` each unchanged BY
IDENTITY (whole-object identity cannot hold there, and correctly does
not: `runPicker`'s `finally` re-boxes for `picking: false` — the notes'
field-identity assertion is the right one). And the cross-affordance
case the suite does not cover: a chord fired while the HEADER BUTTON's
dialog is up opens no second dialog either. One latch, three doors.

**C4 — the front door untouched, proven not asserted.**
`git diff aab62f0..HEAD -- app/test/genesis-entry.test.tsx` = **0
bytes**; the lane's `front-door.spec.ts` + `no-plan-card.spec.ts` = **0
bytes**. For the JSX I did better than reading it: I extracted the
`EmptyState` function body from both revisions and diffed them after
deleting ONLY the removed `useEffect` — **identical, zero remaining
lines**. Not one character of the render tree moved.

**C5 / THE REPLACED T-026 TEST — RULED: the replacement is stronger on
the property that survives, the retirement was correct, and the notes'
one overstatement is "could not have been kept meaningfully".** The
vacuity argument is right and I confirmed it: `EmptyState` now
registers nothing, so `"stops listening once the front door is gone"`
would assert that a component which never listened has stopped, and
would be green forever. Keeping it as written was not an option. The
replacement is strictly stronger on criterion 5's mechanical form — it
counts registrations at mount time (zero) instead of inferring them
from behaviour after unmount — and the behaviour the old test was
guarding moved up to `accelerators.test.tsx` tests 2/3/4, where it runs
against the real store on three screens instead of `vi.fn()` props on
one. **But there WAS a meaningful form to keep**, and it is one the
file was already equipped for: re-point the old test at
`project-shell.test.tsx`'s own new `FrontDoorWithAccelerators` wrapper
— mount the PRODUCTION hook, unmount it, press ⌘O, assert nothing fires
— which asserts the hook's unmount cleanup rather than the component's.
Measured: deleting `return () => window.removeEventListener(...)` from
`accelerators.ts` leaves the app suite at **503/503 green**. That
property is now pinned nowhere. Not a criterion failure (no criterion
asks for it, and `App` never unmounts in production), but it is the one
thing the retirement dropped on the floor, so it is filed as
**T-049-s3** with three siblings. The other changed test —
`"the advertised accelerators actually work"` — I diffed line by line:
same name, same six presses, byte-identical assertions, only the mount
line changed, and it now runs against the shipped matcher instead of a
copy of it. Its wrapper is two lines and calls the production hook.

**C6 — what the app claims, and only that.** 26 chords fired at the
real app from the front door: ⌘⇧N, ⌘⇧O, ⌥⌘O, ⌥⌘N, ⌃⇧N, ⌘P, ⌘F, ⌘A,
⌘S, ⌘W, ⌘Q, ⌘Z, bare `o`, bare `n`, Escape, Enter, Tab, `Dead`,
`Unidentified`, `Process`, `ø`, `ó`, Cyrillic `щ`, Cyrillic `т`, ⌘
alone, ⌘⌃O. **Exactly one** is claimed beyond the four the app
declares: ⌘⌃O, and that BY DESIGN (Command OR Control, no Alt, no
Shift). Zero new `preventDefault`. From the focused map search field:
⌘O and ⌘N fire, the field's value is untouched, ⌘A and a bare `o` are
claimed 0 times, and ⌘F is claimed by the MAP (claim count 1, `invoke`
0) — the app's one accelerator owner and the app's other one do not
collide. Mutants confirm the boundary is load-bearing: accepting Shift
→ 2 red; accepting bare `o`/`n` → 3 red; dropping `preventDefault` →
11 red; swapping the two commands → 13 red. Two honest limits found and
filed as **T-049-s4**: `event.key` means the chords are silently dead
on non-Latin layouts (⌘+`щ` reaches nothing where ⌘O would), and an
`isComposing` keydown is still claimed. Both are T-026's semantics kept
deliberately byte for byte, not T-049 regressions.

**Execution sweep.** Poison-injected (`expect("PROBE").toBe("EXECUTED")`
as the first statement of every body), run, reverted, sha256-verified:
`accelerators.test.tsx` 12 bodies → **12 failed**, restored to
`56f5f1e0…`; `accelerators.spec.ts` 2 bodies → **2 failed**, restored
to `3c6e1b29…`; the two CHANGED bodies in `project-shell.test.tsx` →
**2 failed | 9 passed**, surgical, restored to `8b8dc94b…`. All five of
the notes' sha256 values matched the branch bytes before I started.

**Suites, my actuals** (macOS/Darwin 25.6, node v22.22.0, this
worktree): lib/parser `npx vitest run` **159 passed (10 files)**, `tsc`
clean · app `tsc` clean, `npm run build` exit 0 (**253 modules**,
`index-BumOZNae.js` 442.49 kB / `index-BheOMAjN.css` 41.24 kB),
`npx vitest run` **503 passed (29 files)** · app/src-tauri `cargo test`
**217 passed + 3 ignored, 0 failed**, exit 0, **zero warnings**, 11
test binaries · tools/e2e `npx playwright test` **35 passed**,
`npm run typecheck` clean, `npm run lint:tokens` **clean, 38 files**.
Every number the notes report, reproduced.

**THE COMPOSED MERGE, re-derived against TODAY's main.** Main moved
again mid-review: it is now `6356246` (the T-048 checkpoint, which
REGENERATED the graph to 90 files and moved the dogfood pins to match),
not the `0f55cc6` the notes measured. `git merge-tree --write-tree HEAD
main` answers one tree (`10c805c9…`) with zero conflict lines. I merged
main into a scratch branch off `3921426` and ran the composition: `tsc`
clean, `npm run build` exit 0, app **507 passed (30 files)**, lane
**36 passed**, lane `typecheck` clean, `lint:tokens` clean at 38 files.
The scratch branch is deleted, the worktree is back on `t049-way-in`
with its own build, and `git worktree list` shows only main and this
one. The notes' composed numbers hold on a newer main than they were
measured against.

**Fence, proven.** `git diff aab62f0..HEAD --name-only` is exactly 8
files: `App.tsx`, `components/shell/accelerators.ts`,
`test/accelerators.test.tsx`, `test/project-shell.test.tsx`,
`tools/e2e/tests/accelerators.spec.ts`, this card, s1, s2.
`git diff aab62f0..HEAD -- app/src/components/shell/GenesisScreen.tsx
tools/e2e/tests/genesis-screen.spec.ts app/src-tauri lib/parser method
docs/architecture capabilities app/package.json '**/package-lock.json'
'**/Cargo.lock' '**/Cargo.toml' | wc -c` = **0**; zero manifests or
lockfiles in the name list at all. `min-h-screen` / `h-screen` /
`min-h-0`: three matches in the whole diff, all three PROSE inside this
card describing the fence check — **zero** under `app`, `tools`, `lib`
in either direction, so T-048's three edits land on lines this branch
never saw (and they did: the composed merge is textually clean). Zero
new `invoke(` / `listen(` / `emit(` call sites in `app/src`; no new
dependency; no Rust.

**THE GRAPH DELTA, regenerated myself and restored.** Against the
graph committed on this branch: files **89 → 91**, symbols
**602 → 628**, edges **1003 → 1028**; adds
`app/src/components/shell/accelerators.ts` and
`app/test/accelerators.test.tsx`, nothing removed, the lane spec
invisible (`.nputerignore` carries `tools/`). Exactly **three**
assertions move, in two files — `architecture-dogfood.test.ts`'s file
count `89 → 91`, its relation row `["C-05","C-10","confirmed", 20 → 22]`,
and `map-dogfood-render.test.tsx`'s `committed graph · 89 → 91 files`.
No new finding, no unmapped bucket, no drift-flag movement. **Against
TODAY's main**, which the integrator will actually face: **90 → 92**
files, symbols 616 → 642, edges 1013 → 1038, and the same three
assertions — file count `90 → 92`, relation row
`["C-05","C-10","confirmed", 21 → 23]`, map hint `· 90 → · 92 files`.
`docs/architecture/graph.json` restored to `05ebc2c7…` after each regen.

**THE `app/src/lib/` MEASUREMENT — verified, and the notes UNDERSTATE
it.** I moved the module to `app/src/lib/accelerators.ts`, rewrote the
three import lines, regenerated and ran the dogfood suites: the new
finding `{"rule":"D2","id":"D2:unmapped"}` appears, naming
`app/src/lib/accelerators.ts` — and **seven** assertions move rather
than the notes' four: the findings list (9 vs 8), the relation table
(29 rows vs 28), the drift flags (7 vs 6), the map's component count
(12 vs 11 — the unmapped bucket the dogfood asserts does not exist),
the map's edge table (29 vs 28), plus the two file counts. In
`components/shell/` it is three, and they are the ordinary regen shape.
The placement reasoning is correct and it was worth measuring. Reverted;
sha256 of all five source files and the graph confirmed against the
pre-probe baseline.

**Suggestions ruled.** T-049-s1 is VALID and accurate on both halves —
`runPicker`'s `if (!isTauri || shell.picking) return;` really does make
an accelerator's action unobservable in a browser, and
`{screen.screen === "board" && isTauriRuntime() && …}` really does hide
BOTH header buttons from the lane, so the one screen T-049's affordance
is visible on is the one screen the served bundle cannot show; keep it
suggested, it matters more for T-027 than here. T-049-s2 is VALID and
its premise is literal — T-027's criterion at line 81 of its card reads
"(their unmount-scoping test stays green)", which this task made false
on purpose; the suggested one-line rewording is right. Two new ones
filed: **T-049-s3** (the hook's four advertised mechanism properties —
unmount cleanup, "an absent entry is left alone", the per-render table
refresh, and "added once" — each deletable with 503/503 still green;
the first is what the retired T-026 test was reaching for) and
**T-049-s4** (`event.key` kills the chords on non-Latin layouts; an
`isComposing` keydown is still claimed).

**FOR @HUMAN — the header's density, sharpened.** The board header's
right-hand group is now literally
`<div class="flex items-center gap-2.25" data-panel-exempt>` carrying
`Open folder… | Start an interview | Toggle theme` — **three buttons
where there were two**, all three with byte-identical classes (the
quiet outline, `px-3.5 py-1.75 text-sm`), sitting opposite the wordmark
and the full project path under `justify-between gap-4`. Three specific
things to judge, all cheap to change: (1) three equal outline buttons
read as one undifferentiated group — the front door gives its primary
the ink pill and the header gives nothing emphasis, so "Start an
interview", the capability milestone 3 is named after, looks exactly
like "Toggle theme"; (2) the header pair carries NO `⌘O · ⌘N` hint
while the front door does, so the chords that now work everywhere are
advertised in only one place; (3) neither the control group nor the
left group wraps or truncates (no `flex-wrap`, no `min-w-0`/`truncate`
on the project path), so at a narrow window this row has nowhere to go
— worth a look next to T-048's freshly bounded frame. Also worth your
fingers, since it is what you reported: ⌘O and ⌘N on the board, on the
map, and on the interview screen; and a second chord while a dialog is
already up, which should do nothing at all.

Probes reverted, every file sha256-verified against its pre-probe
bytes; the two throwaway test files deleted; the graph restored; no
scratch branch, no stray process, no port left bound. Handoff: the
branch touches `.ts/.tsx` outside `docs/`, so the T-009-s1 regen is
owed at merge (numbers above), and the BOOT GATE is owed too and is
still UNRUN by anyone — `NPUTER_BOOT_PORT=<free scratch port> npm run
boot:check` from `tools/e2e/`.
