---
id: T-200
title: The map's index hint prefixes an ABSENCE with "index failed:", so T-192's bound puts a sentence on screen that contradicts itself in its first three words
feature: F-06
milestone: 4
priority: 4
size: S
status: verifying
suggested_by: "executor claude-opus-5@subagent @T-192, carrying its blind verifier's CORRECTION 2 — that seat measured the rendering and ruled it out of T-192's fence; the id was allocated by the dispatching seat, not minted in-lane"
touches: [app-map]
blocked_by: []
builder: claude-opus-5@subagent
review:
---

**ROUTED OUT OF `T-192`'S BLIND VERDICT, WHICH COULD NOT ASSIGN IT.**
`T-192` bounded `index_repo` so a command that never answers stops
holding the `indexing` latch. Its verifier found that the bound's answer
is RENDERED under a prefix the answer was written to avoid, and ruled it
outside that lane's `app-shell` fence rather than assignable to it.

## The mechanism, measured rather than described

`T-192`'s `UNANSWERED_INDEX_MESSAGE` carries a doc comment stating the
wording is *"about TIME, not blame, because nothing was refused"* — it
follows `startupStepPhrase`'s deadline arm, which exists for exactly that
reason (T-063).

The bound delivers it as `IndexOutcomePayload { kind: "error" }`, because
`error` is the only arm of that union a bound can answer with. The sole
renderer of that arm is `app/src/architecture/MapView.tsx:790`:

    index failed: {indexOutcome.message}

so a fired bound puts this on screen:

> *index failed: the indexer did not answer within 15 seconds. It has not
> been refused — it may still be running, and re-indexing is safe.*

A sentence that contradicts itself in its first three words. The span is
`max-w-70 truncate`, so the half that retracts the blame is probably
reachable only through the `title` tooltip.

## What is NOT being claimed

**It is not inherited, and it is not `T-192`'s to have fixed.** Before
that card the only outcome reaching this arm was a genuine rejection, for
which *"index failed"* is accurate; the bound is the first NON-failure
routed through it. So `T-192` introduced the wrong rendering while being
unable to repair it: `app/src/architecture/**` is **C-12 (`app-map`)**
and that lane's fence is `app-shell` (C-05, C-10, C-16). It routed rather
than widened, which is correct.

**No sighting.** Like its parent, this is a shape measured in the source
and the render path, not something a user has reported.

## What a fix decides

1. **Whether the repair is at the RENDERER or in the TYPE.** Either give
   the hint a non-blaming arm when the message is the bound's, or widen
   `IndexOutcomePayload` so an unanswered run is not spelled `error` at
   all. The second is cleaner and crosses a component boundary
   (`watcher-store.ts` is `app-shell`), so a card taking it needs both
   slugs — say which shape is chosen and why.
2. **Whether the truncated span is part of the defect.** A retraction the
   user can only reach by hovering is close to no retraction.
3. **What the other consumers of `kind: "error"` should show.** A genuine
   refusal should still read as a failure; only the absence should not.

## Acceptance criteria

- WHERE the index outcome is an ABSENCE rather than a refusal, the map's
  hint SHALL NOT assert that the index failed, and a body SHALL prove it
  against the RENDERED text.
- A body SHALL prove a genuine REJECTION still reads as a failure, so the
  repair does not flatten the two cases into one.
- THE body SHALL assert the rendered string rather than the payload,
  because `app/test/map-view-dom.test.tsx:674` pins the `index failed`
  prefix today and would otherwise pass either way — the verifier named
  this specifically.
- Verification: headless, the app suite.

## Implementation notes

**Built at `7cd5823`** (branch `task/T-200-lane`, base `e6a97d2`). Every
figure below carries the ref it was measured at.

### The shape chosen — decision 1, at the RENDERER

`indexErrorText` in `app/src/architecture/MapView.tsx` takes the `error`
arm's `message` and answers one of two sentences. **Widening
`IndexOutcomePayload` — the card's second option, and the cleaner one —
was NOT taken**: it edits `app/src/lib/watcher-store.ts`, which the
registry gives to **C-10 (`app-shell`)**, and this lane's fence is
`app-map` (C-12). Building it here would be widening the fence from
inside the lane, which is the one repair this role may never make. It is
routed below rather than silently dropped.

**The discriminator is IDENTITY against `UNANSWERED_INDEX_MESSAGE`, never
a substring.** The bound's message is the one `runIndexRepo` writes, so
the pane compares against the exported constant itself: a reword moves
both sides in a single edit, and no refusal can sniff its way into the
calm arm. That import is a VALUE import where line 7 previously carried
`import type` — and it adds no component edge. `index --check` at
`7cd5823` shows the file edge `MapView.tsx -> watcher-store.ts` was
ALREADY observed for the type-only import and merely gains a symbol:

    - f:…/MapView.tsx -> f:…/watcher-store.ts (import) symbols=[IndexOutcomePayload]
    + f:…/MapView.tsx -> f:…/watcher-store.ts (import) symbols=[IndexOutcomePayload,UNANSWERED_INDEX_MESSAGE]

`app/src/architecture/rollup-source.ts` and `churn-source.ts` already
import values from that module and `MapView` already imports
`rollup-source`, so nothing new is pulled into the module graph at
runtime either. C-12's `depends_on` declares C-10 and `arch` reports
`C-12 -> C-10 confirmed` with `drift=-` on C-12.

`indexErrorText` is deliberately **not exported**, unlike `indexHint`
beside it: the criterion asks for the RENDERED text, and a function with
no import surface is what keeps the bodies in the DOM rather than one
layer away from the place the sentence is wrong.

### Decision 2 — the truncated span IS part of the defect, for the absence only

The span is `max-w-70 truncate` (≈36 monospace characters at `text-xs`),
so a 130-character sentence is cut around its fortieth and the half that
RETRACTS the blame was reachable only by hovering. **The absence arm
therefore drops the message from the visible text on purpose** and
renders `no answer yet · re-index is safe` (31 characters — complete and
true where the span cuts it); the whole sentence stays in the `title`,
which a body asserts. **A REFUSAL keeps its message inline and is
untouched**, because there the message IS the information and truncating
it costs detail rather than meaning. The refusal arm's own truncation is
pre-existing, unchanged here, and named below as a suggestion rather than
taken.

### Decision 3 — the other consumers of `kind: "error"`, measured

There are none. At `7cd5823`, `command grep -rn 'kind === "error"'
app/src` returns exactly two hits: `MapView.tsx:835` (this branch) and a
COMMENT in `watcher-store.ts:267`. `App.tsx:830` forwards
`shell.indexOutcome` and reads nothing out of it, and `indexHint`'s own
arms never mention failure. So the renderer-level repair is COMPLETE
rather than partial — and that is the measurement that makes decision 1's
answer cheap: the option that crosses the fence buys type-safety, not
coverage.

### The bodies, and why a literal alone would not have done

Four bodies in `app/test/map-view-dom.test.tsx`, under
*"the index hint tells an ABSENCE from a REFUSAL"*. **Every assertion is
on the RENDERED text and none on the payload** — the two payloads are
identical in shape (same `kind`, one `message` field), so a payload-level
body passes whichever sentence reaches the screen, which is how the
defect survived T-192's suite. The absence fixture is CONSTRUCTED the way
the producer builds it (`{ kind: "error", message: UNANSWERED_INDEX_MESSAGE }`,
the constant imported, not a look-alike literal).

The load-bearing body is *"THE TWO STATES DO NOT RENDER THE SAME
SENTENCE"*: it renders both into the same root and requires them to
differ. Pinning either literal alone passes a repair that flattens them,
which is what the card warned about.

**The body this card replaced** — *"an error outcome renders as a chip
line"*, `toContain("index failed")` against a refusal fixture — survives
as an exact-equality positive control, strictly stronger than what it
asserted.

### The drill — three mutants, one side only, restored with sha256

Mutated `indexErrorText` only; the bodies were never touched. Pristine
copy taken first, restored after each, `sha256` identical every time and
`diff` against the pristine exit **0**. Suite:
`npx vitest run test/map-view-dom.test.tsx` from `app/` (29 bodies).

| mutant | what it does | bodies red | which |
|---|---|---|---|
| M1 | the absence arm removed — **the defect exactly as T-192 left it** | **2** | the ABSENCE body, and TWO STATES |
| M2 | both states render the calm sentence | **3** | the REFUSAL control, TWO STATES, and SOUNDS-like |
| M3 | the discriminator becomes `message.includes("did not answer")` | **1** | SOUNDS-like, **alone** |

Every new body is killed by at least one mutant, so none is decorative;
M3 kills exactly one, which is what makes the near-miss body load-bearing
rather than a restatement. `pristine-sha256 =
9ac5a1e74f6a128956bd073927dfbc0d427c272a8d504abb38125100e9074906`,
identical at each restore and at the end.

### Commands, each exit read from `$?` unpiped, in the order run

| # | command (cwd) | exit |
|---|---|---|
| 1 | `npm ci` (lib/parser) | 0 |
| 2 | `npm run build` (lib/parser) | 0 |
| 3 | `npm install` (app) | 0 |
| 4 | `npm ci` (tools/e2e) | 0 |
| 5 | `npm run build` (app) — the fast gate | **0** |
| 6 | `npm test` (app) | **0** — 50 files, **1108 / 1108** |
| 7 | `npx vitest run test/map-view-dom.test.tsx` (app) ×3, the drill | 1, 1, 1 — by design |
| 8 | `node tools/e2e/scripts/docs-gate.mjs …` (repo root) | see gates |
| 9 | `cargo run -p nputer-index -- index --check --root ../..` (app/src-tauri) | **1 — STALE, and OWED** |
| 10 | `NPUTER_BOOT_PORT=14200 npm run boot:check` (tools/e2e) | **0 — booted** |

### Standing gates, derived from the merge forecast

The RANGE RULE's executor form at `7cd5823`:
`TREE=$(git merge-tree --write-tree 2eb87f7 HEAD)` (exit 0) then
`git diff --name-only 2eb87f7 "$TREE"` — **2 paths**,
`app/src/architecture/MapView.tsx` and `app/test/map-view-dom.test.tsx`.
The notes commit adds `docs/tasks/T-200-*.md`, so the set the INTEGRATOR
will derive is **3 paths**; both readings are given.

- **GRAPH REGEN — FIRES** (`*.tsx` outside docs/). `index --check` exit
  **1**, a REAL red and not the `--root` false red: it prints both counts
  and a file diff. `1152374 -> 1153078` bytes, `2453 -> 2454` symbols,
  `2375 -> 2377` edges, `~2` files — exactly this diff's two files. The
  regen and `docs/architecture/graph.json` belong to the CHECKPOINT
  commit and that path is outside this fence, so it is **owed to the
  integrator, named here rather than taken**.
- **BOOT GATE — FIRES** (`app/src/**`). Run by this seat on the same
  trigger, `NPUTER_BOOT_PORT=14200` (derived from the card id, `lsof`
  to **zero rows** immediately before binding; 1420 was never probed).
  Exit **0**, both startup lines observed:
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-200` and
  `[nputer] window "main" created`. The tree was stopped by SIGTERM;
  14200 reads **zero rows** afterwards and `ps -eo pid,lstart,command |
  awk '$NF=="target/debug/nputer"'` returns **0** processes (anchored, so
  `nputer-index` cannot be miscounted as a relaunch).
- **DOCS GATE — not owed at `7cd5823`, OWED at the tip.** At `7cd5823`
  the gate answered exit **0**: *"2 changed path(s) given, none under
  docs/ — this gate is not owed."* The notes commit puts
  `docs/tasks/T-200-*.md` in the diff, so it fires at the tip; the
  reading at the tip is in the report. **The integrator must re-derive
  at the merge** — its pair is not this one.
- **METHOD EVAL GATE — NOT OWED**: no path under `method/**` in either
  reading.

### Routed, not built — and NO id is minted

Four lanes were live at dispatch; minting an id in-lane would race them,
and this project's practice (T-192's own notes) is that a lane mints
none. Each is stated with the exact paths and slugs a card would need.

1. **Widen `IndexOutcomePayload` so an absence is never spelled `error`.**
   Paths: `app/src/lib/watcher-store.ts` (the type, `runIndexRepo`'s
   bound, `UNANSWERED_INDEX_MESSAGE`) and `app/src/architecture/MapView.tsx`
   (the branch this card added). Slugs: **`app-shell` + `app-map`**. What
   it buys is the type system refusing the confusion instead of a runtime
   comparison catching it; what it costs is a card that cannot be
   dispatched beside either lane. Today's discriminator degrades safely —
   an unrecognised message reads as a failure, which is the conservative
   direction — so this is an improvement, not a residual defect.
2. **The refusal arm's own truncation.** `max-w-70 truncate` cuts a long
   refusal message too (*"docs/architecture is a symlink"* fits; a
   stringified rejection often does not), and the only way to read the
   rest is the tooltip. Unlike the absence, the visible head is at least
   TRUE there, so this is a legibility card and not a correctness one.
   Path: `app/src/architecture/MapView.tsx`, slug `app-map`. Deliberately
   not taken here — it is a layout decision this card was not asked to
   make, and changing the refusal arm would have muddied the one thing
   the bodies are meant to prove.

### For the verifier

- The bodies to attack first are the four new ones; the drill table above
  says which mutant each is supposed to answer, and M3's single kill is
  the claim most worth re-running.
- The absence's visible string is pinned by its LITERAL on purpose
  (T-063: a body parametrised by the constant it checks cannot pin that
  constant), so a reword must come past a test. The ≈36-character span
  budget is a CALCULATION (`max-w-70` = 17.5rem, minus `px-2.5`, over
  `text-xs` at a 0.6em monospace advance), not a measurement — **jsdom
  applies no layout**, so nothing headless can confirm the 31-character
  line actually fits. That is the one claim here that a browser or an eye
  would settle and this seat could not.
- `app/test/startup-recovery.test.ts` pins `UNANSWERED_INDEX_MESSAGE`'s
  own wording (`"did not answer"`, `"within 15 seconds"`,
  `"re-indexing is safe"`) and is OUTSIDE this fence — untouched, and
  still green in the 1108.

### The DOCS GATE at the tip, and the two reds that were MINE and not this diff's

The notes commit put `docs/tasks/T-200-*.md` in the merge's diff, so the
gate fired where it had not at `7cd5823`. **Read AFTER committing,
because a gate read before a commit does not catch what the commit
creates.** At `453e42a`: `merge-tree` exit **0**, **3 paths**, gate exit
**1** — *"FIRES — 1 path(s) under docs/ are code inputs"* — owing three
commands, run in this order:

| owed suite | exit | count |
|---|---|---|
| `npx vitest run` from `lib/parser/` | **0** | 16 files, **344 / 344** |
| `npm test` from `tools/e2e/` | **0** | **404 passed**, 5.3m, on `NPUTER_E2E_PORT=14200` (derived from the card id; `lsof` read **zero rows** immediately before it bound) |
| `npm test` from `app/` | **1**, then **0** after a rebuild | 50 files, **1108 / 1108** |

**T-192's STANDING E2E RED IS GONE.** That card measured 1 failed / 365
passed and pinned the cause in `brief.mjs` (`process.exit` discarding an
undrained 64 KiB pipe). At `453e42a` the lane is 404 / 404 at exit 0, so
whatever fixed it landed between — reported because a lane that inherits
a green where its predecessor recorded a red should say so rather than
let the improvement look like its own.

**THE APP SUITE'S TWO REDS ARE THE DRILL'S FOOTPRINT — ATTRIBUTED, NOT
RE-RUN UNTIL GREEN.** `map-t1-t2-dom.test.tsx` and
`map-tasks-lens-dom.test.tsx` each carry a BUILD-FRESHNESS probe —
*"the build is newer than the sources it is evidence about"* — and both
failed with `dist/ predates src/architecture/MapView.tsx`. The cause is
mechanical and is this seat's: `npm run build` ran BEFORE the mutation
drill, and the drill's final `cp` of the pristine copy back over
`MapView.tsx` moved that file's mtime past `dist/`. The boot check does
not repair it — `tauri dev` runs vite in DEV and never writes `app/dist`.
The source was byte-identical at the green run and the red one (the
`sha256` in the drill ledger above is the proof). `npm run build` then
`npm test` from `app/` at the final tree: **0** and **0**, 50 files,
**1108 / 1108**.

This is the standing hazard *"`npm run build` from `app/` is a gate, not
a step"* arriving from its other side — here the SUITE reported what the
stale BUILD had caused, and reading only the suite would have sent a
verifier hunting a defect in the map's CSS.

Four more commands, none of them merge-diff gates but all of them CI
steps, run only after the e2e lane had restored its seven control bytes:
`npm run lint:tokens -- --selftest` **0** · `npm run lint:tokens` **0**
(*clean*, TOKEN 166 files, CONTROL 1064 tracked text files) ·
`npm run capabilities:check` **0** (*CURRENT*, 33163 bytes — this diff
moves no `tools/e2e/tests/` name, so the census could not move) ·
`npm run typecheck` from tools/e2e **0**.

### CORRECTION to the span budget above — the tokens, not a guess

The notes say *"≈36 monospace characters"*. **Derived from the tokens
rather than estimated**, at `453e42a`, it is about **39**:
`--spacing-unit: 0.25rem` (`app/src/styles/tokens.css:382`), so
`max-w-70` is 17.5rem = 280px; `px-2.5` takes 10px a side, leaving 260px;
`--text-xs-size: 0.6875rem` = **11px**, not the 12px the first estimate
assumed (`tokens.css:359`); `--font-mono-stack` leads with Geist Mono
(`tokens.css:352`), whose advance is the usual 0.6em = 6.6px. 260 / 6.6 ≈
**39**, so the 31-character line sits ~8 characters inside the cap rather
than ~5. **IT IS STILL A CALCULATION AND NOT A MEASUREMENT** — jsdom
applies no layout, so nothing headless in this lane can confirm the line
is uncut in a real webview. That is the one claim here an eye would
settle and this seat could not, and it is the reason the whole sentence
stays in the `title` regardless.
