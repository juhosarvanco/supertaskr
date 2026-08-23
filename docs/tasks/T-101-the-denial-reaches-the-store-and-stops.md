---
id: T-101
title: The live denial reaches the store and stops — the fact exists, in order, on the right turn, bounded and stripped, and nothing renders it
feature: F-03
milestone: 4
priority: 57
size: M
status: verifying
blocked_by: []
touches: [app-interview]
builder:
verifier:
built_by: claude-opus-4.8 @T-101
verified_by:
review:
---

Absorbs: T-081-s1 (sixth triage, 2026-08-20). That file is removed in
this commit.

**T-081 shipped the fact and could not ship the notice.** Its second
criterion reads *"THE denial SHALL reach the frontend at the moment it
arrives, carrying the tool name and the CLI's own `message`"*, and it
does: `RunEvent::Denied` crosses the `genesis-turn` channel and
`reduceGenesisEvent` lands it on `GenesisTurn.denials` in arrival order.
**No component reads that field.** Verified at `4d2f03c`: `git grep -n
denials -- app/src` returns `app/src/lib/agent-store.ts` and
`app/src/genesis/interview-model.ts`, and the interview-model hits are
`error.denials` — the TERMINAL `toolDenied` error, a different datum on
a different path. No `.tsx` file mentions the live list at all.

**That is a FENCE fact, not an oversight.** T-081's `touches:` is
`[app-agent]`, which ARCHITECTURE defines as `app/src-tauri/src/agent/**`
plus `app/src/lib/agent-store.ts`. The chat a human would see a denial
in is **C-13** — `app/src/genesis/InterviewChat.tsx` and
`app/src/genesis/interview-turns.tsx`, area `app-interview`. A card
fenced to the runner and its store cannot build the notice, and building
it anyway would have been the scope creep the role forbids.

**The gap is visible in T-081's own @human line**, which asks *"whether
a live denial notice reads as information rather than alarm"*. Nothing
exists to judge.

**Where it goes, so the builder does not rediscover it.** `PlannerTurn`
in `interview-turns.tsx` already renders mid-stream furniture off the
same turn object — `planner.activity[planner.activity.length - 1]` is
the last tool label beside the pulse dot (verified at `4d2f03c`).
`denials` is the same kind of datum on the same object and wants the
same neighbourhood.

**Three things the store already knows, each of which breaks a naive
renderer.** All three are documented at `GenesisTurn.denials` and in
`GenesisDenial` itself:

- **A denial is not a failure.** The transcribed turn carried two and
  COMPLETED — the planner decomposed the refused command and carried on.
  The store's own comment says a non-empty list says nothing about how
  the turn ends; read `status` for the outcome. Rendering denials in the
  failure treatment would say the opposite of what the runner measured,
  and `FailureBlock` is the wrong component for exactly that reason.
- **The list can name one tool twice.** The real CLI refused `Bash`
  twice in one observed turn — a compound command whose sub-commands
  were not all covered, and a `cp` with a glob. The list is deliberately
  not deduped; `toolUseId` is what tells the entries apart.
- **`toolName` and `toolUseId` are `string | null` and `message` may be
  empty.** A renderer that assumes both fields are present prints
  "undefined" on the screen the card exists to make trustworthy.

## Acceptance criteria

- **A REFUSED TOOL SHALL BE VISIBLE IN THE TRANSCRIPT AT THE MOMENT IT
  ARRIVES**, on the turn it belongs to, without waiting for the turn to
  end. The store already delivers it live; this criterion is about the
  screen.
- **THE NOTICE SHALL NOT USE THE FAILURE TREATMENT.** A turn carrying
  denials that completes SHALL render as a completed turn — assert both
  the denial notice and the completed status in one body, because the
  measured real turn is exactly that case.
- **TWO DENIALS NAMING THE SAME TOOL SHALL BOTH APPEAR**, distinguished
  by `toolUseId` rather than deduped. A body SHALL drive the
  two-`Bash` case the runner measured.
- **A DENIAL WITH A NULL `toolName` OR AN EMPTY `message` SHALL RENDER
  SOMETHING A HUMAN CAN READ**, and the assertion SHALL be that the
  string "undefined" and the string "null" appear nowhere in the
  rendered subtree.
- IF the notice is placed beside the activity line THEN it SHALL survive
  the same re-render conditions that furniture does, and the body SHALL
  assert it after a subsequent delta rather than only at arrival — a
  notice that a later render drops is worse than none.
- **THE ORDER SHALL BE THE ORDER THE USER WAS TOLD**, matching the
  store's arrival order, and the body asserting it SHALL use a witness
  that is EMITTED rather than buffered (T-092's absorbed T-081-s5: the
  transport can hold a delta, so a delta cannot date anything).
- IF the denial notice and the terminal `toolDenied` error can both be
  on screen at once THEN the same refusal SHALL NOT read as two
  different events — T-081's criterion 4 (*the same denial shall not be
  reported twice*) is a rendering obligation as much as a runner one.

Verification: headless — `npm test` and `npm run build` from app/ with
counts and exits stated, and the tools/e2e lane if any body lands there
(note THE E2E LANE'S HONEST SCOPE: the genesis screen's actions are IPC,
so the lane can prove the notice RENDERS from a store state, never that
a real denial reached it). POISON DRILL on every new body, one side
only: delete the notice, drop one of the two same-tool entries, null the
`toolName` — each read back with `git diff` before the run and each
required RED; restores proved by sha256 at the drill's own commit. Then
T-092's shape-six check per body. **@human: yes, one look** — T-081's
own open question, unanswerable until now: does a live denial notice
read as information rather than alarm on a turn that then completes?

## Implementation notes

Built by `claude-opus-4.8` `@T-101`, branch `task/T-101-denial-visible`,
cut from **`a15b78e`** (main's tip at dispatch, a `Checkpoint:` commit).

**UNDERSTANDING, CONFIRMED BEFORE ANYTHING WAS TOUCHED.** T-081 made the
CLI's in-band `permission_denied` line a classified `RunEvent::Denied`
that crosses the `genesis-turn` channel and lands, in arrival order and
already joined on `tool_use_id` by the runner, on `GenesisTurn.denials`
as `GenesisDenial { toolName: string|null, toolUseId: string|null,
message: string }` — and stopped there, outside its `[app-agent]` fence.
No `.tsx` read the field; `interview-model.ts`'s `rehydrate` wrote
`denials: []` and the only `error.denials` readers are the TERMINAL
`toolDenied` variant on a different path. This card, fenced to
`[app-interview]` (C-13), builds the notice a human sees: live, on the
turn the denial belongs to, in stream order, in the quiet furniture
register — never the failure treatment, because the measured 2.1.226
turn carried two refusals and COMPLETED.

### What changed (three paths, all in fence)

- **`app/src/genesis/interview-turns.tsx`** — a new `DenialNotice`
  component and its mount inside `PlannerTurn`, BELOW the activity line
  and OUTSIDE the `running` guard, gated
  `planner.denials.length > 0 && planner.error?.kind !== "toolDenied"`.
  One row per denial (never per tool), keyed positionally (the list is
  append-only and never reordered), `toolUseId` carried as a
  `data-tool-use-id` attribute rather than as a key (it is CLI-supplied).
  The register is the existing `font-mono text-xs
  text-secondary-foreground` furniture — no new token, no new utility.
- **`app/src/genesis/interview-model.ts`** — `denialLine(denial)`, the
  pure sentence: `toolName ?? "a tool"`, a blank/empty `message` →
  "the CLI gave no reason", the CLI's own words bounded by the SAME
  `MAX_ERROR_CHARS` ceiling `failureDetail` applies (not a second number
  that can drift). Imports `GenesisDenial`.
- **`app/test/interview-chat-dom.test.tsx`** — five new bodies under one
  describe, plus the existing hostile-output sweep widened to the new
  string channel. The two capture entries are transcribed field-for-field
  from `docs/research/captures/real-planner-turn-2026-08-19.jsonl` lines
  17 and 19 (parsed, not eyeballed — the capture is pretty-printed, so a
  compact grep finds nothing).

**No Rust, no IPC, no store change, no grant, no manifest, no new token.**
The store already delivered `denials` live (T-081); this card is the
screen. `app/src/lib/agent-store.ts` is a 0-file diff.

### Every criterion, and the body that holds it

- **Not the failure treatment; completes AND carries denials in one
  body** — `THE MEASURED TURN`: two `Denied` then `completed`, asserts
  `data-status="completed"`, the answer text, `interview-failure` null,
  `interview-streaming` null, and the two rows survived the landing.
- **Two same-tool denials both appear, told apart by `toolUseId`** —
  same body: `toHaveLength(2)`, both contain "Bash", and
  `ids()` deep-equals the two distinct `toolu_…` literals in emit order.
  Both PRESENT and DISTINCT are required (M1 reds via length, M8 reds via
  the ids becoming `["Bash","Bash"]`).
- **Live at arrival, survives a later render** — `the refusal is on
  screen WHILE the turn runs`: asserts the row beside the pulse dot at
  arrival, then AFTER an `activity` emit (an EMITTED witness, not a
  buffered delta — T-092/T-081-s5), then after a `textDelta`. Presence is
  checked before text so an arrival-only-bug mutant reds crisply.
- **Null `toolName` / empty `message` read, and "undefined"/"null" appear
  nowhere** — `a refusal with no tool name or no message still reads`:
  three degenerate rows with a fully-populated POSITIVE CONTROL between
  them (so "a tool"/"the CLI gave no reason" are shown to be fallbacks),
  exact-string equality on each, and `.outerHTML` (text AND attributes)
  asserted to contain neither "undefined" nor "null".
- **Order is the order the user was told** — the `ids()` deep-equal is an
  ordered array, and the witness is `activity` (emitted), not a delta.
- **The same refusal not read as two events** — `a turn that DIES of a
  refusal states it ONCE`: on a `toolDenied` failure the live notice
  yields to the terminal block (one surface), and its positive control
  (turn 2, a `stall`) proves ONLY `toolDenied` suppresses — every other
  failure leaves the notice standing.

### The poison drill — eleven mutants, all at `5917e8e`, all one-sided

Every mutation one side only, the mutated TEXT read back with `git diff`
before the suite ran, every restoration proved by sha256 against
`git show 5917e8e:<path>` AND an empty `git diff`. Baseline **861/861**,
exit 0.

| # | mutant (one side) | reds |
|---|---|---|
| M1 | `DenialNotice` dedupes by `toolName` (Map by name) | **MEASURED TURN only** |
| M2 | notice gated on `running` (dropped when turn stops) | measured, degenerate, toolDenied, hostile |
| M3 | notice gated on `!running` (hidden while live) | **liveness only** |
| M4 | `` `${denial.toolName}` `` instead of `?? "a tool"` | **degenerate only** ("null" prints) |
| M5 | empty-message branch deleted | **degenerate only** |
| M6 | `toolDenied` suppression deleted | **toolDenied only** |
| M7 | suppression widened to any error (`error === null`) | toolDenied + hostile |
| M8 | `data-tool-use-id` sourced from `toolName` | measured, degenerate, liveness |
| M9 | row uses `dangerouslySetInnerHTML` | 4 no-innerHTML / hostile gates |
| M10 | strip `<>` from the message | **hostile only** |
| M11 | notice gated on `activity.length === 0` (arrival-only) | liveness + hostile |

**SHAPE SIX — the same-tool-twice body (M1).** The dedupe-by-`toolName`
mutant — the exact defect T-081's verifier rejected T-081's first build
over, one layer up — kills `THE MEASURED TURN` and **no neighbour**. It
is not a duplicate of the liveness body: M1 leaves the liveness body
green (that turn carries one denial, so a name dedupe changes nothing),
and M3 kills the liveness body while leaving MEASURED TURN green (it does
not assert mid-run liveness). The two are mutually independent.

**SHAPE SIX — survives-a-later-render (M11).** The arrival-only mutant
(show the notice only until the first `activity` marker) reds the
liveness body at its AFTER-activity assertion — the render the criterion
names — where a body asserting only at arrival would PASS, since at
arrival `activity.length === 0` and the notice still shows. M3 (hidden
while running) is the complementary direction. Neither is arithmetically
the other.

M10 was a SURVIVOR on the first pass: the hostile sweep's `toContain`
over the refusal row was satisfied by the tool-NAME half of
`refused: <name> — <words>` alone, so stripping `<>` from the message
left it green. Sharpened to COUNT both occurrences of the hostile string
(name half + words half); it now reds M10 and nothing else. Recorded
because it is a shape-five-adjacent miss (a `toContain` with no
cardinality floor) the drill caught and fixed in place.

### Gates — all derivations at main `11c82a1`, dot-counts stated

Main advanced under this lane (T-089 merged; T-013 approved). Merge-base
is still my cut **`a15b78e`** (an ancestor of `11c82a1`, exit 0). I am
the EXECUTOR, so the merge's diff is the `merge-tree` forecast:

    TREE=$(git merge-tree --write-tree 11c82a1 HEAD)   exit 0, tree 1fdd512…
    git diff --name-only 11c82a1 <TREE>                -> 3   PRESCRIBED
    git diff --name-only 11c82a1...HEAD  (THREE dots)  -> 3   collapses, matches
    git diff --name-only a15b78e..HEAD   (TWO, branch) -> 3
    git diff --name-only 11c82a1..HEAD   (TWO dots)    -> 24  FORBIDDEN — left-drift

The 24 is left-endpoint drift, not this lane: main advanced **21** paths
from the cut, the branch **3**, `comm -12` over the two sorted lists is
EMPTY, and 21 + 3 = 24 — the arithmetic that proves them disjoint. The
three paths are `interview-model.ts`, `interview-turns.tsx`,
`interview-chat-dom.test.tsx`.

**RE-DERIVED at `6834287`** — main advanced again while this lane was
built (T-013 has now MERGED), and the card+finding are committed, so the
forecast is **5 paths**: the three above plus this card and `T-101-s1`.
Three-dot `6834287...HEAD` agrees at 5; the forbidden two-dot
`6834287..HEAD` is **52** (main advanced 47, branch 5, `comm -12` EMPTY,
47 + 5 = 52 — disjoint). Merge-base is still `a15b78e`. The gate triggers
are unchanged: GRAPH REGEN on the 3 `.ts/.tsx`, BOOT GATE on the 2
`app/src/**`, DOCS GATE on the 2 `docs/tasks/`. Main keeps moving; the
verifier must re-derive at their own tip and state it.

- **GRAPH REGEN — FIRES on all 3** (`.ts/.tsx` outside `docs/`), and
  `index --check --root ../..` from `app/src-tauri` is a **REAL RED**
  (exit 1): both count lines present (committed *1023 symbols · 1550
  edges*; fresh *1027 · 1553*), `files +0 -0 ~3`, so not the `--root`
  false red. **+4 symbols / +3 edges (edges +6 −3)** — the new symbols
  are `denialLine` (interview-model.ts), `DenialNotice`
  (interview-turns.tsx) and two in the test file; every new edge's
  endpoints sit inside C-13 (and C-13→C-14 via `GenesisDenial`), so no
  component relation moves and the registry still stops at C-14. **No
  regenerated `graph.json` is committed** — it is the integrator's move
  at the checkpoint, and `docs/architecture/graph.json` is outside this
  fence.
- **BOOT GATE — FIRES on 2 of 3** (the two `app/src/**` paths; the
  `app/test/` file is a GRAPH REGEN trigger but NOT a boot trigger). Run
  from `tools/e2e`: `NPUTER_BOOT_PORT=14761 npm run boot:check` exits
  **0** with both lines — *[nputer] project folder:
  /Users/ujju/Projects/nputer-T-101* and *[nputer] window "main"
  created*. Port 14761 was read-only-probed free on all four stacks
  before use and is free after. **Port 1420 was read with `lsof -nP
  -iTCP:1420 -sTCP:LISTEN` only**, before and after — node pid 82549 on
  `[::1]:1420`, unchanged; no bind, connect or signal.
- **DOCS GATE — FIRES** on this card + the finding below (flat
  `docs/tasks/T-*.md`, read by the parser and the two app dogfood
  bodies). Invoked directly with the RANGE RULE's own path list, and the
  owed suites re-run — recorded with the suites below.

### Stylesheet did NOT move, and I meant it not to

The built CSS is byte-identical to baseline — `index-CwYF5FQb.css`,
43.95 kB, at `a15b78e` and at HEAD. Tailwind v4 auto-content scans
`app/test` too (no `@source` override), so a stray utility-shaped word in
the new component OR the new test would have minted CSS; none did. The JS
moved `index-DsNHI2Jr.js` → `index-jYo9A0Ak.js` (503.61 → 504.24 kB)
because both source files are bundle inputs.

### Suites, each `$?` read unpiped

- **app `npm test`: 861 / 861 across 43 files**, exit 0 — 857 at
  `a15b78e` plus this card's four net-new bodies (five added, and the
  existing hostile sweep re-counted, not added). `npm run build` exit 0
  (265 modules) precedes it.
- `npx tsc --noEmit` from app/ exit 0; `npx tsc -p tsconfig.test.json`
  exit 0.
- **parser `npx vitest run`: 263 / 263**, exit 0 (DOCS-GATE-owed; the
  card edit does not move the parser's live-tree smoke — the smoke reads
  the id set and this card's status is legal).
- **e2e `npm run typecheck` exit 0**; token lint selftest 0 and lint 0.
- **The E2E lane itself adds no body.** The notice is read-only text in
  the transcript scroll region with no trusted-input interaction, and the
  jsdom suite already drives it through the REAL store and REAL
  `genesis-turn` channel; the lane's honest scope (a store field a
  browser cannot have a real denial reach) is recorded on the card, so a
  lane body would prove only what the DOM suite already proves. No
  screen-control probe was run (headless verification only).

### The decision T-081-s3 asked this card to make

T-081-s3 ("A restart forgets what the planner was refused") is PARKED
with the unpark condition *"when T-081-s1's promoted card ships the
denial notice — decide the optional `TranscriptLine` field in the same
card"*. This card is that card, so: **the notice ships LIVE-ONLY, and the
persistence field is DEFERRED, not taken.** `rehydrate` still writes
`denials: []` and that is honest — the transcript banks no denial record.
Persisting one needs the RUNNER (`app-agent`) to bank an optional
`TranscriptLine.denials` and `rehydrate` (`app-interview`) to read it —
exactly the two-fence split that filed T-081-s3, and `[app-interview]` is
one half alone. T-081-s3's unpark condition is now met; it should move
parked → planned at triage as a two-fence card. Filed as `T-101-s1`'s
sibling context, not re-filed.

### Findings

- **`T-101-s1`** — the "same refusal not twice" obligation is
  STRUCTURALLY enforced by this rendering only on the `toolDenied` path;
  on the `exitNonZero`-with-denials path it inherits an UNPINNED
  runner-side narrowing (T-081-s10). Filed, not blocking.

### For the verifier

- The same-tool-twice body is the shape-six risk the brief named; M1
  isolates it and M3 proves it is not the liveness body's duplicate.
  Re-run `git merge-tree --write-tree 11c82a1 HEAD` — main will have
  moved again, so re-derive at your own tip and state it.
- `graph.json` is deliberately NOT regenerated here; `index --check`
  reds by design at the branch, green after the integrator's regen.
- The stylesheet-hash claim is falsifiable in one build: the CSS content
  hash must read `index-CwYF5FQb.css` unless you meant a token to move.
