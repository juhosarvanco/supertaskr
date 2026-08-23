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
built_by: claude-opus-4.8 @T-101 (rebuilt after rejection by claude-opus-5 @T-101-rebuild, 2026-08-24)
verified_by: claude-opus-5 @T-101-verify
review: same-model
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

---

### THE REBUILD after the 2026-08-23 rejection — a SECOND EXECUTOR, appended not rewritten

Rebuilt by `claude-opus-5` `@T-101-rebuild`, same branch
`task/T-101-denial-visible`, continued from the verdict tip **`0e6889b`**
(nothing was started over). The session crosses midnight — the drill and
the branch gates were run late on **2026-08-23 EEST**, the DOCS GATE and
the suites below on **2026-08-24** — so where a live-environment reading
carries a clock time it carries its date too. Everything above this line is the FIRST
executor's account and the verifier's verdict, left byte-unchanged. Every
figure below is re-derived at my own refs and every one that moved is
named.

**What the verdict confirmed sound I did not touch**: the notice's
register, `denialLine`'s shared `MAX_ERROR_CHARS`, the transcribed
capture entries, the M1/M3 complement, M10's sharpened hostile count and
its disclosed limit, M11's after-activity red, the byte-identical
stylesheet. **What I changed is the SUPPRESSION RULE, the KEY, and one
finding's premise.**

#### BLOCKING 2 — suppression is now PER DENIAL, and the key is what the failure block rendered

The gate was `planner.denials.length > 0 && planner.error?.kind !==
"toolDenied"`, which drops the WHOLE notice. `TurnError::ToolDenied`
carries `denials: Vec<String>` built by `denial_names`, which is
`filter_map(|d| d.tool_name.clone())` — so a denial the CLI wrote without
a readable tool name never reaches `error.denials`, and the gate then put
it on NO surface at all. The runner announces that entry deliberately;
its own comment at the partition reads *"a repeat is a nuisance, a
silence is the defect this card exists to fix"*, and the gate recreated
the silence one layer up. The verifier's probe P5 reproduces at my ref.

`visibleDenials(denials, error)` in `interview-model.ts` is the fix: pure,
per denial, and keyed on `error.denials` — a TYPED field naming exactly
what `FailureBlock` restates (twice: `failureAction`'s hint through
`listOf`, and `failureDetail` through `join(", ")`). A denial whose name
is in that array defers to the block; **every other denial stands**,
including every nameless one and including one the in-band channel
announced that the cumulative `result` line never listed. The mount
becomes `denials.length > 0 && <DenialNotice …>` over the filtered list —
the notice can lose a ROW and can never lose the NOTICE.

`denialToolName` gives the printed name and the suppression key ONE
owner, so "the same refusal" is one string rather than two computations
that could disagree — and that is also T-101-s2's first half closed
(below).

**The new body drives both directions and they are different mutants.**
Arm 1: `toolDenied`, `denials: ["Bash"]`, store holds a `Bash` and a
nameless one — one row survives, it is the nameless one, and the notice
does not repeat "Bash". Arm 2: `toolDenied`, `denials: ["Write"]`, store
holds a NAMED `Bash` — the row survives, because the key is what the
block RENDERED and not whether the denial happens to be nameless. A rule
keyed on namelessness passes arm 1 and loses arm 2 (mutant N7, red).

#### BLOCKING 1 — the mechanism was backwards, the fix is runner-side, and I did NOT widen the fence

Confirmed at `0e6889b` by reading `run_turn`'s `StreamLine::Result` arm:
one `unannounced` vector, iterated twice — `for denial in &unannounced {
emitter.denied(…) }`, then `denial_names(unannounced.iter().copied())`
into the `permission_denials:` ring note. **The narrowing selects the
DOUBLE-REPORTED set, not the safe one**, and T-081's comment on that very
line (*"a name already delivered as its own event does not need repeating
in the tail"*) is right about the intent and wrong about the set. The
verifier's P7 is real; before this card nothing rendered `denials`, so
**this card built the second surface**.

**THE FENCE ARGUMENT, MADE RATHER THAN ASSUMED.** My `touches:` is
`[app-interview]` = C-13 = `app/src/genesis/**`. The fix lives in
`app/src-tauri/src/agent/runner.rs` = `app-agent` = C-14. `app-agent` is
FREE at this moment (`git worktree list`: only `nputer-T-085`, fenced
`[tools/e2e]`, and this lane), so a widening would have been disjoint and
buildable. **I did not take it, and the reason is not timidity.**

1. **The only correct fix is runner-side and it is a DELETION**, not a
   rendering change: drop the ring note for the set the loop above
   already emits. Every render-side substitute is worse, and each is a
   rule the tree already writes down — matching the tail's text puts a
   copy of a `runner.rs` `format!` string in `interview-model.ts` (T-057,
   and `FailureBlock`'s own header says in as many words that it parses
   no error text); the tail is a bounded RING, so a chatty CLI can evict
   the note's first half and a prefix-keyed renderer un-suppresses at
   random; and keying on "the message is empty" is the runner's partition
   re-implemented as a proxy. So there is no honest in-fence fix to
   choose between.
2. **This is NOT T-013's situation, and the difference is the test.**
   T-013's widenings were ruled correct because its CRITERION was
   unbuildable inside its fence — a subprocess needs a Tauri command,
   registering one edits `lib.rs`. Here criterion 7's literal antecedent
   (*"the denial notice and the terminal `toolDenied` error"*) is FULLY
   buildable in fence and is built above. The `exitNonZero` path is a
   defect in a NEIGHBOURING surface, and `executor.md` is unambiguous
   about that case: *"A criterion that cannot be built inside the fence is
   NOT built. Record it, route it as a suggestion naming the fence it
   needs, and build the rest. Widening the fence from inside the lane is
   the one repair this role may never make."*
3. **The cost of routing is one triage cycle and the cost of widening is
   a precedent.** STATE's own "Next up" reads T-013's double widening as a
   DISPATCH error the method has no in-flight channel for. Taking the
   same liberty for a four-line deletion that no criterion requires would
   make the exception the rule.

**So: the in-fence half is done and the rest is routed.** In fence I made
the suppression rule a named function whose doc comment NAMES the
`exitNonZero` gap and why no key exists there, so the next reader meets
it rather than rediscovers it. Out of fence, `T-101-s1` is **rewritten,
not amended** — new title, new filename, `suggested_by` moved to the
verifier who found the mechanism — carrying the reproduction, the
deletion, the `app-agent` fence, the pin the same commit should add, and
the three reasons a render-side key is wrong. **The card ships a known
double report on the `exitNonZero` path and says so here rather than in a
footnote.**

#### BLOCKING 3 — probe P6 is a fixture now, and V7 and V8 both red

New body *"two refusals identical in NAME and MESSAGE are still two, told
apart by toolUseId alone"*: one canned `decision_reason` sentence, two
`Bash` denials, ids `toolu_a` / `toolu_b`. It asserts two rows, that the
two rendered strings are EQUAL (the body's own premise — see the drill's
disclosure), and `ids()` deep-equal in order.

    V7  dedupe by `message`                 861/861 exit 0  ->  862/863 exit 1
    V8  dedupe by `toolName` AND `message`  861/861 exit 0  ->  862/863 exit 1

Both now red, and **each reds this body ALONE** — which is what makes the
body a pin rather than a restatement of M1's.

#### T-101-s2 and T-101-s3

- **`T-101-s2` first half CLOSED in fence** (`denialToolName` trims and
  maps empty to `null`), pinned by a fourth degenerate row spelled
  `toolName: "   "` rather than `""` on purpose: `""` is falsy and reds a
  `??`-shaped mutant, `"   "` reds a trim-less one as well, so whitespace
  strictly dominates. The **message half stays open** and the file is
  narrowed to it — widening the blank-MESSAGE test past `.trim()` is a
  decision about what "the CLI gave no reason" means, and the identical
  `.trim()` test sits on `failureDetail` one function up, so the honest
  close is one rule for both. Renamed to match what remains.
- **`T-101-s3` left filed, cross-referenced to `T-090`** as the brief
  asked. T-090 (`status: planned`, `touches: [tools/e2e, .github/,
  docs/CONVENTIONS.md]`) already owns the gate's four-code contract and
  its one spelling; this finding's fence is a SUBSET of T-090's, so
  absorbing it needs no widening. It is the THIRD leak of one contract —
  `T-084-s6` the empty list, T-090 the `xargs` collapse, this the
  unresolvable non-empty list.

#### The poison drill — TEN mutants at `4ef95af`, in a DETACHED worktree, all one-sided

Per CONVENTIONS: detached scratch worktree at a named commit, never in
place. `node_modules` and `lib/parser/dist` were SYMLINKED in (the parser
is byte-untouched by this lane, so its dist is the same artefact) and
`npm run build` run there first, because a fresh worktree has no
`app/dist` and six files read the shipped bundle. **The drill reproduced
the lane's bundle byte-for-byte** — `index-CwYF5FQb.css` and
`index-DlNTlSlJ.js` — an independent confirmation of the build. No
`CARGO_TARGET_DIR` hazard applies: no Rust is drilled here.

Applied by a Python driver with `encoding='utf-8'` and a
match-count-of-exactly-1 guard, so the em dash never crossed a shell
string; every mutation read back with `git diff --unified=0` BEFORE its
suite ran. Baseline in the drill **863/863, exit 0**, identical to the
lane.

| # | mutant (producer side only) | exit | tests | reds |
|---|---|---|---|---|
| M1 | `DenialNotice` dedupes by `toolName` | 1 | 861/863 | MEASURED TURN **+ IDENTICAL PAIR** |
| M3 | notice gated on `!running` | 1 | 862/863 | liveness **only** |
| V7 | dedupes by `message` | 1 | 862/863 | **identical pair only** |
| V8 | dedupes by `toolName` AND `message` | 1 | 862/863 | **identical pair only** |
| N1 | the REJECTED gate restored (whole notice on `toolDenied`) | 1 | 862/863 | **per-denial body only** |
| N2 | no suppression at all | 1 | 861/863 | states-it-ONCE + per-denial |
| N4 | suppression widened to ANY error | 1 | 860/863 | states-it-ONCE + per-denial + hostile |
| N7 | keep only NAMELESS denials on `toolDenied` | 1 | 862/863 | **per-denial body only** (arm 2) |
| N3 | `denialToolName` returns `denial.toolName` raw | 1 | 862/863 | **degenerate only** |
| N6 | `denialLine`'s `refused:` becomes `denied:` | 1 | 861/863 | degenerate + identical pair |

**M1's ROW IS CORRECTED, not re-litigated.** The first build recorded M1
as reding *"MEASURED TURN only"* and the verifier reproduced that. At
this tree it reds TWO bodies, because the new identical-pair body also
refuses a name dedupe. **The M1/M3 complement still holds** — M3 reds the
liveness body alone and M1 does not touch it — and the new body is not
M1's duplicate, which V7/V8 prove by reding it and nothing else.

**SHAPE SIX, asked of each new body rather than assumed.** The
identical-pair body is killed ALONE by V7 and by V8, which no other body
kills. The per-denial body is killed ALONE by N1 and by N7, which no
other body kills. The fourth degenerate row earns its place by N3, which
reds nothing at all without it (the pre-existing rows are `null`, `Bash`
and `WebFetch`, none affected by dropping the trim).

**ONE ASSERTION THAT CANNOT BE POISONED, DISCLOSED.** In the
identical-pair body, `expect(rows[1].textContent).toBe(rows[0].textContent)`
is a FIXTURE TRIPWIRE, not a producer pin: any one-sided mutation of
`denialLine` moves both sides together, and the exact-string assertion
one line above reds first in any case. It guards the body's own premise —
that the two messages really are identical — and it is recorded here
because a body that cannot red is the finding.

**THE CRAFT NOTE THE VERDICT RAISED IS CLOSED.** The `toolDenied` body's
positive control asserted `?.textContent` straight into `toContain`, so
the widened-suppression mutant redded as `TypeError: the given
combination of arguments (undefined and string) is invalid`. Presence
before text now: N4 reds it as `AssertionError: a stall says nothing
about refusals: expected null not to be null` at
`interview-chat-dom.test.tsx:1007`.

**Restoration proved THREE ways after every mutant and again at the end**:
`git checkout --`, then sha256 against `git show 4ef95af:<path>`, then an
empty per-path `git diff`. Pristine
`interview-turns.tsx`
`28c6c5f802aa0c16474fd46529092f0447b7423ecd554fcd2ad13e4d1526d699`,
`interview-model.ts`
`fc2e2d434b9edb73636ea2a29782f52c80a36b4fdc923109c3e7b7ac8267850e`. The
drill worktree's symlinks were UNLINKED (never deleted), `app/dist`
removed, the worktree removed and pruned, and the lane's own installs
verified intact.

#### Gates — re-derived at main `1aa7137`, dot-counts on every command

Main advanced TWICE more under this lane (T-013 `6834287` and T-097
`7e82667`, both merged and checkpointed). Merge-base is still my cut
`a15b78e` (`git merge-base --is-ancestor a15b78e 1aa7137` exits **0**). I
am the EXECUTOR, so the prescribed form is the `merge-tree` forecast, and
its exit code was read from `$?` rather than swallowed:

    TREE=$(git merge-tree --write-tree 1aa7137 HEAD)   exit 0, tree 4522c1ee…
    git diff --name-only 1aa7137 <TREE>                -> 7   PRESCRIBED
    git diff --name-only 1aa7137...HEAD  (THREE dots)  -> 7   collapses, agrees
    git diff --name-only a15b78e..HEAD   (TWO, branch) -> 7
    git diff --name-only 1aa7137..HEAD   (TWO dots)    -> 68  FORBIDDEN — left-drift
    git diff --name-only a15b78e..1aa7137 (main's advance) -> 61

**68 IS PURE LEFT-ENDPOINT DRIFT and the arithmetic proves it**: main
advanced **61** paths from the cut, the branch **7**, `comm -12` over the
two sorted lists is **EMPTY**, and 61 + 7 = 68. The seven are the three
code paths, this card, and the three findings (two of them RENAMED, which
is why the count does not grow: at `1aa7137` neither name exists, so the
merge adds only the new ones).

`grep -n "at any merge whose diff" docs/CONVENTIONS.md` returns exactly
**3** (this worktree's copy: lines 566, 631, 660 — the same three bullets
main numbers 592/717/746, since the lane is cut before those edits).
**ALL THREE FIRE.**

| gate | trigger | on these 7 |
|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` outside `docs/` | **3 — FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **2 — FIRES** |
| DOCS GATE | a `docs/` path a code suite reads | **4 — FIRES** |

- **GRAPH REGEN — a REAL red at the branch, and the forecast is MEASURED
  AT THE MERGE TREE rather than reasoned from a delta.** At the branch,
  `index --check --root ../..` from `app/src-tauri` exits **1**: committed
  *588891 bytes · 119 files · 1023 symbols · 1550 edges*, fresh *592271 ·
  119 · 1029 · 1559*, `files +0 -0 ~3`, `edges +12 -3` — both count lines
  present, so not the `--root` false red. **THE BRIEF IS RIGHT THAT MY
  PREDECESSOR'S ABSOLUTES ARE STALE, AND SO ARE THE BRANCH'S.** I built
  the merge's tree as a throwaway commit (`git commit-tree`, no ref
  moved), checked it out detached with its OWN `CARGO_TARGET_DIR` inside
  it, and ran the gate there: committed **645482 bytes · 126 files · 1120
  symbols · 1703 edges** — main's, exactly the brief's figure — against
  fresh **648862 · 126 · 1126 · 1712**, the SAME `files +0 -0 ~3` and
  `edges +12 -3`. **So the delta is +6 symbols / +9 edges at BOTH refs and
  only the endpoints moved** (1023→1029 at the branch, 1120→1126 at the
  merge), which is T-013's checkpoint lesson reproduced: check a forecast
  by its endpoints, never by its deltas. The first build's *+4 symbols /
  +3 edges* is superseded — this rebuild adds `denialToolName` and
  `visibleDenials`. Every new edge's endpoints are inside C-13 and C-14
  (`GenesisDenial`, `TurnErrorPayload`), so **no component relation moves
  and the registry still stops at C-14**. No `graph.json` is committed:
  the regen is the integrator's at the checkpoint. The forecast worktree
  and its 343 MiB target were removed and pruned.
- **BOOT GATE — exit 0**, both lines verbatim: `[nputer] project folder:
  /Users/ujju/Projects/nputer-T-101` and `[nputer] window "main"
  created`. Scratch port **14766**, bind-probed FREE on `127.0.0.1`,
  `0.0.0.0`, `::1` and `::` immediately before use and free again after.
- **DOCS GATE — invoked DIRECTLY from the repo root with the RANGE RULE's
  own four ROOT-RELATIVE paths**, never through `xargs` and never with a
  `../../` spelling (which is `T-101-s3`, and the reason that finding
  exists). Result and owed suites below.

#### Suites, every `$?` read unpiped, at `4ef95af` unless stated

- **app `npm test`: 863 / 863 across 43 files, exit 0.** Derived, not
  copied: `interview-chat-dom.test.tsx` holds **39** `it(` bodies at
  `a15b78e`, **43** at the rejected tip `0e9c045`, **45** now — so 857 +
  4 + 2 = 863, and the arithmetic closes at every ref. (The first build's
  prose says *"five new bodies"* where its own arithmetic and the file
  both say **four**; the fifth was the hostile sweep, which was WIDENED,
  not added.)
- `npm run build` from app/ exit **0**, 265 modules.
- **The stylesheet did not move and I checked it the way the verifier
  did**: `index-CwYF5FQb.css`, 43.95 kB, unchanged from the base and from
  the rejected tip, and reproduced independently by the drill worktree's
  own build. The JS moved and had to — `index-jYo9A0Ak.js` →
  **`index-DlNTlSlJ.js`**, 504.44 kB — because both source files are
  bundle inputs.
| command | where | result | exit |
|---|---|---|---|
| `npm run build` | lib/parser | dist emitted | **0** |
| `npx vitest run` | lib/parser | **263 / 263** over 12 | **0** |
| `npx tsc --noEmit` | lib/parser | — | **0** |
| `npm run build` | app | 265 modules, css **43.95 kB** unmoved | **0** |
| `npm test` | app | **863 / 863** over 43 | **0** |
| `npx tsc --noEmit` | app | the app program | **0** |
| `npx tsc -p tsconfig.test.json` | app | the TEST program — a green `tsc` alone is not a green build (T-073) | **0** |
| `npm run lint:tokens -- --selftest` | tools/e2e | 49 TOKEN + 4 CONTROL samples, 71 walk-policy, 8 evidence-floor | **0** |
| `npm run lint:tokens` | tools/e2e | clean, **TOKEN 124 / CONTROL 584** | **0** |
| `npm run typecheck` | tools/e2e | — | **0** |
| `npm test` (`NPUTER_E2E_PORT=14767`) | tools/e2e | **129 / 129**, 33.8 s | **0** |
| `node tools/e2e/scripts/docs-gate.mjs <4 paths>` | repo ROOT | **FIRES**, 3 suites owed | **1** |
| `NPUTER_BOOT_PORT=14766 npm run boot:check` | tools/e2e | both `[nputer]` lines | **0** |
| `cargo run -p nputer-index -- index --check --root ../..` | app/src-tauri | **REAL** red, by design | **1** |

**CONTROL closes from both directions and TOKEN does not move.** The
verdict measured **TOKEN 124 / CONTROL 582** at `0e9c045`; the verdict
COMMIT `0e6889b` then added `T-101-s2` and `T-101-s3` as tracked files,
so 582 + 2 = **584**, which is what the lint prints here. TOKEN is
unchanged because this rebuild adds no `.ts`/`.tsx`/`.mjs` file under
app/src, app/test or tools/e2e — it edits three that already existed.

**No cargo suite is owed**: this diff has no Rust and does not touch
`docs/CONVENTIONS.md`, which is why the DOCS GATE names three suites and
not four.

**AND THEY WERE RE-RUN AFTER THIS SECTION WAS WRITTEN, which is
T-081-s9's whole point.** Writing the table above is itself an edit to a
flat `docs/tasks/T-*.md`, so the gate is owed again: invoked directly on
this card's own path it FIRES at exit **1** and names the same three
suites, and the run that validates the sentence you are reading is the
LAST of them, on scratch port **14769**: **parser 263/263 exit 0 · app
863/863 exit 0 · e2e 129/129 exit 0**. Each suite ran independently after
every doc write of this rebuild, and every run was identical — the
figures never moved, so no reader has to decide which run a number came
from.

**Port hygiene.** FOUR scratch ports — **14766** (boot gate) and
**14767**, **14768**, **14769** (a fresh one per e2e run, since lanes
collided on the default earlier this week) — each bind-probed FREE on
`127.0.0.1`, `0.0.0.0`, `::1` and `::` immediately before use and free
again after; none is the default 14520 and none is 1420.

**A BIND PROBE RUN IMMEDIATELY AFTER THE E2E LANE CAN FALSE-RED, and it
did once here — recorded because the "free again after" ritual is only
worth running if its failures mean something.** The probe on 14768 taken
in the same command as the lane's own exit reported BUSY; seconds later
the identical probe reported all four stacks FREE. The cause is
TIME_WAIT, not a survivor: `lsof -nP -iTCP:14768` returned **no rows at
all** at the moment of the refusal — no LISTEN, no process — while
`netstat -an` showed a wall of `127.0.0.1.<ephemeral> -> 127.0.0.1.14768
TIME_WAIT` peers from the browser's own connections, and a plain `bind()`
without `SO_REUSEADDR` refuses against those. **So the authority on
whether a port was left held is `lsof … -sTCP:LISTEN`, and a bind probe
is the CONFIRMING half, never the deciding one.** Final state: zero
listeners on all four scratch ports; no `vite`, `playwright` or `tauri`
process of this lane survives. The only long-lived strangers are the two
`nputer-T-060` `fake_agent` orphans (52504/52505, ppid 1, five days old)
— not mine, T-043-s1, left alone — and the human's own
`npm run tauri dev` chain. **Port 1420 was READ ONLY** with `lsof -nP -iTCP:1420
-sTCP:LISTEN`, before and after every stage — holder `node` pid **82549**,
one socket `TCP [::1]:1420 (LISTEN)`, unchanged at 23:54, 23:56 and 00:02
EEST. No bind, no connect, no signal, no `pkill`. **No real model call**:
`docs/research/captures/real-planner-turn-2026-08-19.jsonl` was never
opened for writing and is byte-identical to `HEAD` (sha256
`273a3d33593a53614101489b9cd3e9574010beae3830a60f43a8e65f74da47ac`, empty
`git diff`). No screen-control probe was run — headless verification
only.

#### Where the brief and the verdict were wrong

- **The brief's regen forecast framing was right and its absolutes were
  the stale half, as it said.** Nothing in it was wrong on that count; I
  re-derived at three refs and recorded all three.
- **The brief says the graph is "1120 symbols / 1703 edges"** — true of
  MAIN's committed graph, confirmed by reading it inside the merge tree.
  It is NOT the number this worktree's `index --check` prints (1023/1550),
  because the lane is cut at `a15b78e`. Both are stated above so neither
  reads as the other's correction.
- **The verdict's `T-101-s1` diagnosis reproduces exactly** and its two
  cited line numbers still resolve at `0e6889b`; I cite the SYMBOL
  (`run_turn`'s `StreamLine::Result` arm, `denial_names`) per CONVENTIONS
  rather than the line, because the next merge into `runner.rs` will move
  them.
- **The verdict's step 2 offered two ways to fix BLOCKING 2** — scope the
  suppression, or stop `FailureBlock` owning the denial list. I took the
  first. The second would have moved a rule out of the failure block that
  T-029 deliberately put there, and would have left a `toolDenied` turn's
  cause of death unnamed in the block that names causes of death.
- **`git worktree list` shows a fourth entry** — another lane's detached
  scratch worktree in the shared scratchpad. It is not mine and I left it
  alone (CONVENTIONS' own note that the scratch directory, and therefore
  the worktree list, is shared).

#### For the verifier of the rebuild

- **The three blocking findings are closed in two different ways and the
  difference is the point.** BLOCKING 2 and BLOCKING 3 are closed IN CODE
  with mutants that isolate them (N1/N7 and V7/V8, each reding one body
  alone). BLOCKING 1 is closed as a CORRECTED FINDING and an argued fence
  refusal, not as code — the card still double-reports on the
  `exitNonZero` path, and the argument for routing rather than widening is
  written out above so it can be ruled on rather than inferred.
- **The suppression rule is pure and in one place.** If you want to
  falsify it without a DOM, `visibleDenials` takes `(denials, error)` and
  returns a subsequence; the interesting inputs are a nameless denial with
  `toolDenied`, a named one the array does not name, and any non
  `toolDenied` error.
- **Re-derive the range at YOUR tip.** Main moved twice under this lane
  already (`11c82a1` → `6834287` → `1aa7137`) and the forbidden two-dot
  count went 24 → 52 → **68** across those refs while the branch's own
  figure went 3 → 5 → **7**. The merge-tree forecast is the only form
  whose left endpoint is yours.
- **The graph forecast is measured at the MERGE TREE, not extrapolated.**
  1120 → 1126 symbols, 1703 → 1712 edges, `files +0 -0 ~3`. If your ref
  differs, the DELTA (+6 / +9) is the part that should survive; the
  endpoints are not.
- **T-081-s3's decision is unchanged** by the rebuild: the notice ships
  LIVE-ONLY, `rehydrate` still writes `denials: []`, and persisting a
  denial record still needs both fences.

## Verdicts

### 2026-08-23 — REJECTED (claude-opus-5 @T-101-verify, review: same-model)

**Three blocking findings, and all three are about the LAST criterion —
"the same refusal shall not read as two different events." The notice
itself is good work.** Before the findings, what reproduces exactly at my
own refs: the register really is the quiet furniture and never
`FailureBlock`; `denialLine` is pure and shares `MAX_ERROR_CHARS` with
`failureDetail` rather than minting a second number; the two capture
entries are faithful; the M1/M3 complement is genuine and I re-measured
it; M10's sharpening is real and I falsified the alternative; the
stylesheet is byte-identical from a base-source build; every suite,
count and gate reproduces. **This is a rejection about the SUPPRESSION
GATE and one unpinned criterion clause, not about the notice.**

**DISCLOSURE — the implementation-notes leak path (`T-089-s2`).** The
notes are inline in this card, so a single `cat` exposes them. I read
**lines 1–110 only** (spec + criteria, stopping at `## Implementation
notes`), wrote my own mutant list to a scratch file BEFORE reading
further, ran the entire drill below from that list, and read the notes
only afterwards. The pre-notes list is what produced V7/V8 and P5/P7 —
the three blocking findings — none of which appear in the executor's
eleven-row matrix. I am the fourth verifier this session to declare this
path.

**Ranges re-derived at my own tip, dot-counts on every command.** Main
`6834287`; lane tip `0e9c045`; merge-base `a15b78e` (unchanged).
Pre-merge, so the `merge-tree` form:

    TREE=$(git merge-tree --write-tree 6834287 HEAD)  exit 0, tree 016fba5…
    git diff --name-only 6834287 <TREE>               -> 5   PRESCRIBED
    git diff --name-only 6834287...HEAD  (THREE dots) -> 5   agrees
    git diff --name-only 6834287..HEAD   (TWO dots)   -> 52  FORBIDDEN, left-drift

Triggers confirmed at that list: GRAPH REGEN on the 3 `.ts/.tsx`, BOOT
GATE on the 2 `app/src/**`, DOCS GATE on the 2 `docs/tasks/`.

---

#### BLOCKING 1 — the `exitNonZero` path double-reports TODAY, and `T-101-s1` has the mechanism backwards

`T-101-s1` says the two surfaces are disjoint because T-081 "narrowed
[the tail] to the UNANNOUNCED subset — so an announced denial appears in
the live notice ONLY, and a result-only denial in the tail ONLY", and
that a double report would need T-081-s10's narrowing to be *reverted*.
**The narrowing does not select the safe set. It selects the
double-reported one.** In `runner.rs`, one `result` line drives both of
these over the SAME `unannounced` vector, ~40 lines apart:

    for denial in &unannounced { emitter.denied(req.turn, …) }   // ~2046
    let unreported = denial_names(unannounced.iter().copied());  // ~2089
    …ring.push(format!("permission_denials: {}", unreported.join(", ")))

So every result-only denial that has a `tool_name` becomes a live
`Denied` event **and** puts its name in the stderr ring — which is
exactly what `ExitNonZero.stderrTail` carries and `failureDetail`
renders. Before this card that was harmless: nothing rendered
`denials`, so the tail was the only surface. **This card builds the
second surface.** Reproduced (probe P7, real store, real `genesis-turn`
channel):

    emit: denied{toolName:"Bash", toolUseId:"toolu_resultonly", message:""}
          failed{exitNonZero, code:1, stderrTail:"permission_denials: Bash"}

    live notice:    [refused: Bash — the CLI gave no reason]
    failure block:  [the planner exited with code 1  permission_denials: Bash …]
    "Bash" occurrences on the turn: 2

Expected one surface, got two. `T-101-s1` should be rewritten: the
`exitNonZero` path is not "inherited and honest", it is **broken now**,
and the trigger is not a hypothetical revert.

#### BLOCKING 2 — the `toolDenied` gate over-suppresses: a refusal reported ZERO times

The gate is `planner.error?.kind !== "toolDenied"`, which drops the
WHOLE notice. Criterion 7 licenses hiding **the same refusal**; it does
not license hiding a *different* one. `TurnError::ToolDenied` carries
`denials: Vec<String>` built by `denial_names`, which is
`filter_map(|d| d.tool_name.clone())` (`runner.rs:1661`) — it **drops
every entry with no `tool_name`**, a shape the runner's own fixture
models (`ResultDenial { tool_name: None, tool_use_id: Some("toolu_nameless") }`,
`runner.rs:2774`). One mixed `result` line with `is_error: true`
produces both halves at once. Reproduced (probe P5):

    store denials: [{toolName:"Bash",toolUseId:"toolu_named"},
                    {toolName:null, toolUseId:"toolu_nameless"}]
    error:         {kind:"toolDenied", denials:["Bash"]}

    live notice present: false
    whole turn text:     "…the planner was refused a tool it needed
                          The planner asked for Bash and nputer's allowlist
                          does not carry it… Bash …"

Two refusals in the store, **one** on screen. The nameless refusal is
announced by the runner specifically so it will not be silent — its own
comment reads *"a repeat is a nuisance, a silence is the defect this
card exists to fix"* — and this gate converts it into the silence, one
layer up. That is criterion 5's *"a notice that a later render drops is
worse than none"* in its literal form. Note also that all denial
MESSAGES are lost on this path, since `FailureBlock` renders names only.

#### BLOCKING 3 — the criterion's own key is unpinned: two dedupe mutants survive the whole suite

Criterion 3 reads *"distinguished by `toolUseId` rather than deduped."*
The suite pins "not deduped **by name**" (M1) and nothing else. From my
pre-notes list, one side only, text read back with `git diff`, restored
and sha256-proved:

| mutant (mine) | result |
|---|---|
| V7 — `DenialNotice` dedupes by `message` | **SURVIVES · 861/861 · exit 0** |
| V8 — dedupes by `toolName` only when `message` also matches | **SURVIVES · 861/861 · exit 0** |
| V9 — dedupes by `toolUseId` | reds degenerate only (861→860) |

Both survive because every fixture in the file gives its denials
distinct messages, so a message-keyed dedupe never fires. The shape is
reachable, not theoretical: `classify_line`'s `decision_reason`
fallback yields a **canned** sentence, so two glob refusals in one turn
arrive with identical `toolName` AND identical `message`, differing only
in `toolUseId`. The renderer handles it correctly today — probe P6 gives
2 rows, ids `["toolu_a","toolu_b"]` — but **nothing stops the next
editor from deduping it away**, which is the defect T-081's verifier
rejected T-081's first build over. P6 is the missing fixture; it is a
few lines in the existing describe.

---

### What I verified and found SOUND

**The M1/M3 complement is real — re-measured, not taken on trust.** Each
reds exactly one body and the two singletons are disjoint, so neither
body is the other's shape-six duplicate:

| mutant | exit | tests | reds |
|---|---|---|---|
| M1 dedupe by `toolName` | 1 | 860/861 | `THE MEASURED TURN` **only** |
| M3 notice gated on `!running` | 1 | 860/861 | liveness body **only** |
| M6 suppression deleted | 1 | 860/861 | toolDenied body only |
| M7 suppression widened to any error | 1 | 859/861 | toolDenied + hostile |
| M11 gated on `activity.length === 0` | 1 | 859/861 | liveness + hostile |
| V18 order reversed (mine) | 1 | 859/861 | measured + degenerate |
| V19 keep only the last denial (mine) | 1 | 859/861 | measured + degenerate |

All five re-runs match the executor's matrix row-for-row.

**M6/M7 are NOT "disjoint sets" — they are disjoint ASSERTIONS inside
one body**, which is the stronger and truer claim. M6 reds the negative
(*"the same refusal is not also a second, quieter event"*, turn 1); M7
reds the positive control (the stalled turn 2). The executor's own table
says this correctly; the dispatch brief's "disjoint sets" is a garbling.

**M11 reds at the AFTER-activity assertion, as claimed** —
`interview-chat-dom.test.tsx:812`, *"the furniture moved and the refusal
did not: expected null not to be null"*. The arrival assertion above it
passes (at arrival `activity.length === 0`), so an arrival-only body
would indeed have shipped the mutant. The presence-before-text ordering
does produce the crisp message it advertises.

**M10's sharpening is real, not relabelled.** The decisive pair, mangling
ONE half (strip `<>` from the message, tool name untouched):

| | assertion | result |
|---|---|---|
| G1 | the shipped `.toBe(2)` count | **RED**, hostile sweep only, 860/861 |
| G2 | downgraded to the old `toContain` | **GREEN, 861/861, exit 0** |

That reproduces the executor's claimed measurement independently.
`HOSTILE` contains the probe string exactly once, so the count of 2
genuinely requires both halves. **Its limit, stated honestly:** the count
pins *how many* hostile strings, not *which half carries them*. My T1
(halves transposed), T2 (tool half duplicated) and T3 (message half
duplicated) all leave the hostile sweep GREEN and are caught only by the
degenerate body's exact-string equality (T1 861→860, T2 861→857, T3
861→859). The split is defensible — the exact-string body owns "which
half is which" — but the hostile sweep alone does not prove it.

**The degenerate-row attempts, all four.** `toolUseId: null` becomes
`data-tool-use-id=""`, so the `.outerHTML` assertion is genuinely
attribute-aware and passes. Slip-through attempts: a whitespace-only
message is caught (`.trim()`); a `toolName` of `""` or `"   "` is NOT
(`??` only catches null/undefined) and renders `refused:  — m2`, but is
**unreachable** — `denial_field` trims and `filter(|s| !s.is_empty())`
to `None` at the Rust boundary, so the producer cannot emit it (filed
`T-101-s2`); a message of only U+200B survives `.trim()` and renders a
blank reason, same unreachability class. A `toolUseId` of the literal
string `"null"` DOES break `not.toContain("null")` — but that assertion
is the CARD's own wording, and the same brittleness applies to any CLI
message containing the word "null". Card-level residual, not a build
defect.

**Stylesheet, falsified the way the notes invite.** Built at HEAD:
`index-CwYF5FQb.css`, 43 950 bytes, sha256 `71ed851e…b200bb`. Checked
the three files out at `a15b78e`, rebuilt: **same name, same sha256**.
Byte-identical confirmed, not merely same-named. `gap-1.25`,
`whitespace-pre-wrap`, `break-words` and `text-secondary-foreground` all
pre-exist at base, so neither the component nor its test minted a rule.

**One craft note, non-blocking.** The presence-before-text lesson landed
in the liveness body (`5917e8e`) but not in the toolDenied body's
positive control: M7 reds there as `TypeError: the given combination of
arguments (undefined and string) is invalid` (line 934,
`?.textContent` into `toContain`) rather than as a diagnostic assertion.
It reds, which is what the drill requires — but it reds badly.

**A weak survivor, disclosed.** V16 (notice gated on
`activity.length < 2`) survives 861/861: the liveness body emits exactly
one activity label, so its survives-re-render proof is one delta deep.
M11 covers the realistic freeze-at-first-render bug; I record V16 as a
depth limit, not a finding.

### Suites, gates and exits — every `$?` read unpiped

| command | where | result | exit |
|---|---|---|---|
| `npm run build` | lib/parser | dist emitted | **0** |
| `npm run build` | app | 265 modules, css 43.95 kB | **0** |
| `npm test` | app | **861 / 861** over 43 files | **0** |
| `npx vitest run` | lib/parser | **263 / 263** over 12 | **0** |
| `npm test` (`NPUTER_E2E_PORT=14547`) | tools/e2e | **129 / 129**, 38.1 s | **0** |
| `npm run lint:tokens` | tools/e2e | TOKEN **124** / CONTROL **582** | **0** |
| `node tools/e2e/scripts/docs-gate.mjs <2 paths>` | repo root | **FIRES**, 3 suites owed | **1** |
| `NPUTER_BOOT_PORT=14548 npm run boot:check` | tools/e2e | both `[nputer]` lines | **0** |
| `cargo run -p nputer-index -- index --check --root ../..` | app/src-tauri | **REAL** red | **1** |

No cargo suite is owed — this diff has no Rust. The graph red is real,
not the `--root` false red: both count lines print, `committed: 1023
symbols · 1550 edges` against `fresh: 1027 · 1553`, `files +0 -0 ~3`.
**+4 symbols / +3 edges (+6 −3)**, matching the notes. No `graph.json`
committed; the regen is the integrator's.

BOOT GATE lines, verbatim: `[nputer] project folder:
/Users/ujju/Projects/nputer-T-101` and `[nputer] window "main" created`.
**Port 1420 was READ ONLY** (`lsof -nP -iTCP:1420 -sTCP:LISTEN`), before
and after every stage: `node` pid **82549** on `[::1]:1420`, unchanged.
No bind, no connect, no signal. The boot check ran on **14548**,
bind-probed free before use (14520 was free too, but a sibling took the
default earlier today). No real model call was made and the capture was
never opened for writing.

**Drill hygiene.** 16 mutants, each one side only, each mutated text read
back with `git diff --unified=0` before its suite ran, and applied by a
Python driver with `encoding='utf-8'` and a match-count-of-exactly-1
guard — the em dash and ellipsis never passed through a shell string
(T-054/T-078's encoding lesson). Restoration proved three ways after
every run and again at the end: empty `git diff`, sha256 against the
recorded pristine triple, and sha256 against `git show 0e9c045:<path>`.
All three agree.

### @human — the one look, and what would count as alarm

**It is answerable now, and it takes one turn.** Drive the interview
until the planner is refused a tool — or, without a real refusal, open
the `THE MEASURED TURN` case: a turn carrying two `Bash` refusals that
then **completes**. What to look at, in the transcript, on the turn
itself, directly under the pulse-dot activity line: two mono rows
reading `refused: Bash — This Bash command contains multiple
operations…` and `refused: Bash — Glob patterns are not allowed…`, in
`text-secondary-foreground`, with the turn's answer text above and the
turn's status reading **completed**.

**It reads as INFORMATION if:** the rows sit in the same visual register
as the streaming line and the truncation note — same mono, same size,
same muted ink; the eye reaches the planner's actual answer first; and
after the turn lands the rows read as history rather than as something
outstanding.

**It reads as ALARM if any of these:** the rows pull colour that the
rejected/failure surface owns (the red or warning chips) or carry an
icon or border the failure block also uses; they sit ABOVE the answer or
otherwise win the turn's visual priority; a completed turn still looks
unresolved because the refusal rows are the last and loudest thing on
it; or the two same-tool rows read as one error repeated rather than two
separate refusals. **Any one of those is a NO** and should come back as
a `[app-interview]` card about the register, not about the plumbing.

Worth knowing before the look: on the two failure paths this verdict
rejects, what you would see is either the refusal twice (BLOCKING 1) or
not at all (BLOCKING 2) — so judge the register on a turn that
**completes**, which is the case the card is really about and the one
the capture recorded.

### To clear this

1. **BLOCKING 1** — decide where the `exitNonZero` double report is
   fixed. Render-side name-matching against the tail is the wrong answer
   (the block explicitly parses no error text, and T-057 forbids a
   second owner of a runner rule), so this most likely routes to
   `app-agent`: now that a renderer exists, the ring note for the
   `unannounced` set is redundant with the live events emitted from the
   same vector. Rewrite `T-101-s1` either way — its premise is inverted.
2. **BLOCKING 2** — scope the suppression to the refusals the terminal
   block actually restates, or stop `FailureBlock` from owning the
   denial list on `toolDenied` and let the notice keep it. Add a body
   for a `toolDenied` turn carrying a denial `error.denials` does not
   name, asserting it appears exactly once.
3. **BLOCKING 3** — add probe P6 as a fixture: two denials identical in
   `toolName` and `message`, differing only in `toolUseId`; assert two
   rows and two distinct ids. Confirm V7 and V8 then red.

Findings 1 and 2 are one criterion seen from both sides — the gate is
wrong in one direction and absent in the other — and I would expect them
to close together.

Filed alongside, non-blocking: `T-101-s2` (`denialLine`'s `??` lets a
blank `toolName` through; unreachable today because the Rust boundary
normalizes it) and `T-101-s3` (`docs-gate.mjs` answers a non-empty but
non-root-relative path list "not owed" at exit 0 — `T-084-s6`'s shape,
one level over; I hit it myself on my first invocation).

### 2026-08-24 — APPROVED (claude-opus-5 @T-101-verify, review: same-model, second verdict)

**All three blocking findings are cleared, my two survivors are dead, and
the one defect that ships is named in three places with its fix, its
fence and its pin.** I re-ran every claim rather than reading the table:
ten of my own mutants against the new rule, both pass-1 survivors, the
carried-forward set, and my P5/P7 probes. **Every row of the rebuild's
drill table reproduces at my refs, and so do the pristine hashes.** One
correction is recorded below and it is not a rejection.

**Boundary, again.** I read to line 110 and stopped; the criteria block
is **byte-identical** to my first pass (`diff` of lines 69–110 across
`0e9c045..a86703d`: no output), so my pass-1 reading of them stands
unrevised. I derived the pass-2 mutant set from those criteria and the
DIFF, wrote it to scratch, ran it, and read `## Implementation notes`
only afterwards. N-J and the citation finding below both came out of that
list. My first verdict is byte-unchanged — `sha256` of everything from
`## Verdicts` down at `0e6889b` and at `a86703d` is
`44f8e7de…824f7e25` at both.

**Ranges re-derived at my own tip.** Main moved twice more while I worked
(`1aa7137` → `d673039`/`7e82667` → **`2ea1d27`**, T-097 and T-085 both
merged). Pre-merge, so the `merge-tree` form:

    TREE=$(git merge-tree --write-tree 2ea1d27 HEAD)   exit 0
    git diff --name-only 2ea1d27 <TREE>                -> 7   PRESCRIBED
    git diff --name-only 2ea1d27...HEAD  (THREE dots)  -> 7   agrees
    git diff --name-only 2ea1d27..HEAD   (TWO dots)    -> 75  FORBIDDEN

---

### THE RULING — shipping the named `exitNonZero` defect is CORRECT, and the distinction offered is real

**I rule for the executor, and the distinction is worth stating cleanly
because it will be cited.** The line is not "was the fence free" — it was
free, and that is not the test. The line is:

> **Widen when the fence makes THIS CARD'S OWN CRITERION unbuildable.
> Route when the fence makes a NEIGHBOURING DEFECT unfixable.**

T-013's two widenings were ruled right on the first branch: its criterion
needed a subprocess, a subprocess needs a Tauri command, and registering
one edits `lib.rs` — the criterion could not exist inside the fence.
Here criterion 7's literal antecedent is *"the denial notice and the
terminal `toolDenied` error"*, and that is **fully built in fence and now
pinned by two mutants no other body kills**. Nothing this card was asked
for is missing. The `exitNonZero` double report is a defect on a
neighbouring surface that this card's renderer made *visible* — which
obliges disclosure and routing, not annexation of another component.

**I checked the three refusals rather than accepting them**, because the
ruling collapses if any in-fence fix were honest:

1. **Text-matching the tail** would copy a `runner.rs` `format!` string
   into `interview-model.ts` — T-057's rule, and `FailureBlock`'s own
   header says it at line 332 (*"NOTHING HERE PARSES THE ERROR TEXT"*).
   Real.
2. **The ring is genuinely bounded** — `MAX_STDERR_RING = 64 * 1024`,
   `Ring::new(MAX_STDERR_RING)` at `runner.rs:1779`. A prefix-keyed
   renderer really can un-suppress at random on a chatty CLI. Real.
3. **The empty-`message` proxy is genuinely ambiguous**: the unannounced
   replay emits `String::new()`, but an in-band `permission_denied` line
   can also arrive with no message — `runner.rs`'s own fixture
   `StreamLine::Denial { tool_name: None, tool_use_id: None, message:
   String::new() }` is exactly that. Real.

So there was no honest in-fence fix to decline, and the correct fix is a
**deletion in another component that no criterion of this card requires**.
Widening to perform it would have dragged a Rust behaviour change and a
cargo gate into a card whose `touches:` is `[app-interview]` and which
correctly owes no cargo.

**And this is not the same defect I rejected.** I rejected because the
card **denied the defect existed** — `T-101-s1` asserted the two surfaces
were disjoint and that a double report needed a revert. My own "To clear
this" said the render-side key was the wrong answer and that it *"most
likely routes to `app-agent`"*. That is precisely what was done. Shipping
a defect you have reproduced, mechanised, routed with its fix and named
in the code is a different act from shipping one you have argued away.

**THE LIMIT, so the precedent is not over-read.** Routing instead of
widening is right only when all three hold, as they do here: (a) no
criterion of the card is left unbuilt; (b) every in-fence alternative is
forbidden by a rule already written down, not merely unattractive; and
(c) the gap is disclosed **in the code** and in a routed finding carrying
the mechanism, the fix, the fence and the pin. Absent any one of those,
routing is evasion.

---

### CORRECTION — the `executor.md` quotation does not exist

The fence argument's third ground quotes `method/roles/executor.md` as
*"unambiguous about that case"*:

> *"A criterion that cannot be built inside the fence is NOT built.
> Record it, route it as a suggestion naming the fence it needs, and
> build the rest. Widening the fence from inside the lane is the one
> repair this role may never make."*

**`method/roles/executor.md` is nineteen lines long and contains neither
"fence" nor "widen".** Measured:

    grep -in "widen|fence" method/roles/executor.md   -> exit 1, no output
    wc -l method/roles/executor.md                    -> 19
    git grep -l "may never make"                      -> this card, and nothing else

The sentence exists nowhere in the tree except in the paragraph quoting
it. **The conclusion survives, because the substance is written down
twice — but neither says this.** In the lane, `executor.md` step 5 carries
it in different words: *"anything you noticed but didn't do — file it as
a status: suggested task … suggestions never expand your scope."* On
main, `method/lane-protocol.md` rule 5 carries it almost verbatim:
*"…record it, route it, and build the part that fits. A fence is not
widened from inside the lane it fences."*

**Why this is a correction and not a second rejection**, weighed rather
than waved through. `method/lane-protocol.md` **did not exist in this
lane** — it landed with T-089's merge, after the cut at `a15b78e`
(`git cat-file -e a15b78e:method/lane-protocol.md` fails; at `main` it
succeeds). The executor could not read the file carrying the verbatim
rule, reached for the one it had, and put quotation marks around a
paraphrase. The defect is quotation integrity, not an invented rule: the
argument rests on real, written authority in both trees, and the ruling
above is unchanged by it.

**It still has to be fixed, because this is the failure mode this project
has already spent cards on.** CONVENTIONS' own negative-control bullet
records a rule that went unwritten *"while everyone believes it exists"*
with *"a grep of both … zero hits three triages later"*, and T-105 is a
whole card for the sweep. A card is a code input and later sessions cite
cards. Filed as **`T-101-s4`**: re-cite to `lane-protocol.md` rule 5,
which will exist in the tree the moment this branch merges. **Had the
conclusion depended on the invented wording rather than merely being
mis-attributed, this would have been a rejection.**

---

### BLOCKING 2 — cleared, and the two arms genuinely discriminate

`visibleDenials(denials, error)` keyed on `error.denials` is the right
key: it is the typed array `FailureBlock` actually restates, so
suppression tracks what is on screen rather than what kind of error it
was. My P5 re-run against the fix, same emit as the rejection:

    notice present: true     rows: 1
    notice text:    [refused: a tool — the CLI gave no reason]
    notice does not repeat "Bash"; the failure block still names it

**The arms are independent, proven by WHICH LINE reds** — this is the
check I was asked to make and it passes:

| my mutant | reds at | which arm |
|---|---|---|
| N-A the rejected whole-notice gate | `:1057` | arm 1 |
| N-C also drop the nameless | `:1057` | arm 1 |
| **N-D keep ONLY the nameless** | **`:1090`** | **arm 2** |

Different lines, different assertions. A rule keyed on namelessness
passes arm 1 and dies on arm 2 — arm 2 is not arm 1 restated. Five more
of mine red as they must: N-B no suppression (861/863), N-E keyed on
`restated.length` (862/863), N-F membership inverted (861/863), N-G
widened to any error (860/863), N-H/N-I on `denialToolName` (862/863
each, degenerate body — the `"   "` row earns its place exactly as
claimed: the trim-less mutant N-I reds, which `""` would not have
caught).

### BLOCKING 3 — cleared, and the new body is not a duplicate

Both pass-1 survivors are dead, each redding the identical-pair body
**alone**:

| | pass 1 | pass 2 |
|---|---|---|
| V7 dedupe by `message` | 861/861 exit 0 | **862/863 exit 1** |
| V8 dedupe by `toolName` AND `message` | 861/861 exit 0 | **862/863 exit 1** |

**The M1 correction is right and the complement still holds.** M1 now
reds MEASURED TURN **and** the identical-pair body (861/863) — the first
build's "MEASURED TURN only" is stale, as stated. M3 still reds the
liveness body alone (862/863) and M1 still does not touch it, so the
complement is intact; and because V7/V8 red the pair body and nothing
else, the pair body kills mutants no neighbour kills. Not shape six.

### The disclosed unpoisonable assertion — disclosure IS sufficient

`expect(rows[1].textContent).toBe(rows[0].textContent)` cannot be redded
by any producer mutant, and I confirmed the mechanism rather than
assuming it (probe P8): `denialLine` receives only the denial object and
prints name and message, so the two rows move together under every
one-sided mutation, and the ids that differ are never printed. It is a
fixture tripwire.

That is the honest treatment and it meets the rule, which requires
naming — *"a body that cannot red is the finding"* — and the body does
not lean on it: `toHaveLength(2)` and `ids()` each red under V7, V8 and
M1. T-085's precedent applies as offered. **Sufficient.**

### The merge-forecast technique — SOUND, and I reproduced it

I ran it myself rather than judging it on description: built the tree,
wrapped it in a throwaway `commit-tree` with both parents, checked it out
detached with its own `CARGO_TARGET_DIR`, and ran the gate there.

    committed:   645482 bytes · 126 files · 1120 symbols · 1703 edges
    fresh index: 648862 bytes · 126 files · 1126 symbols · 1712 edges
    files +0 -0 ~3        edges +12 -3        exit 1

**Identical to the executor's figures**, at a DIFFERENT main
(`2ea1d27`, two merges later than theirs). And at the lane ref the same
gate reads committed 1023/1550 against fresh 1029/1559 — **delta +6/+9 at
both refs, absolutes 100 apart.** That is the claim, measured twice
independently, and it supersedes the first build's +4/+3 correctly (the
rebuild adds `denialToolName` and `visibleDenials`: +2 symbols on +4).

The hygiene holds too: **73 refs before and 73 after**, the throwaway
commit contained by no branch, the worktree removed and the scratch
target dir deleted. It moves nothing and it measures instead of
extrapolating. **Endorsed — it is better than an absolute forecast,
because the delta is the invariant and the endpoints are not.**

### The bind-probe finding — CONFIRMED, and stronger than filed

Reproduced from first principles on port 14899: opened a listener with
`SO_REUSEADDR`, closed the SERVER side first to leave `TIME_WAIT` on the
local port, then measured.

    lsof -nP -iTCP:14899 -sTCP:LISTEN  -> exit 1, 0 rows
    lsof -nP -iTCP:14899               -> exit 1, 0 rows
    netstat -an -p tcp                 -> 2 TIME_WAIT rows on 14899
    bind() without SO_REUSEADDR        -> REFUSED, EADDRINUSE   ("busy")
    bind() with    SO_REUSEADDR        -> OK                    ("free")

So the bind probe calls the port BUSY while a real listener binds it
fine, because node and vite set `SO_REUSEADDR` by default on POSIX. The
conclusion — **`lsof … -sTCP:LISTEN` is the authority and the bind probe
is only the confirming half** — is correct and every lane using the bind
probe as primary should invert that order.

**One sharpening the finding does not have.** The *unfiltered* `lsof` is
equally blind: it returned zero rows too. So the discrepancy is not the
`-sTCP:LISTEN` filter hiding a state — `TIME_WAIT` sockets have no owning
process, so `lsof` cannot see them at all, and `netstat`/`ss` is the only
tool that can. Dropping the filter to "be safer" buys nothing.

### Everything else re-measured

- **Stylesheet still byte-identical.** `index-CwYF5FQb.css`, 43 950
  bytes, sha256 `71ed851e…b200bb` at this ref — the same hash I computed
  from a base-source build in the first verdict. The rebuild minted no
  utility either. JS moved to `index-DlNTlSlJ.js` (504.44 kB).
- **`T-101-s2`'s split is honest.** The first half really is closed in
  code (N-H and N-I both red), and the message half really is a different
  decision — the identical `.trim()` sits on `failureDetail` one function
  up, so one rule for both is the right close.
- **CONTROL 582 → 584 is mine**, not the fix: my own verdict commit added
  `s2` and `s3`. The rebuild's file churn nets zero. Confirmed.
- **"Five bodies" → four** is right: 857 + 4 + 2 = **863**, and 863/863 is
  what I measure.
- **The craft note is closed.** N-G now reds as
  `AssertionError: a stall says nothing about refusals: expected null not
  to be null` at `:1007`, not as a `TypeError`.

### One survivor of my own, disclosed and filed

**N-J survives at 863/863, exit 0**: point `visibleDenials` at
`denial.toolName` while `denialLine` keeps printing `denialToolName(…)`
— the exact two-owner split that function's doc comment exists to
prevent. No fixture has a name needing normalisation that also appears in
`error.denials`, so the suite cannot see the split. It is unobservable in
production for the same reason the `??` hole was (`denial_field` trims on
the Rust side, and `denial_names` clones an already-trimmed name), and it
is not a criterion violation — with one owner the spelling is identical
by construction. But the executor closed the `??` hole on the principle
that *"nothing on this side recorded the dependency"*, and the keying
half of that same property is recorded only in prose. Filed as
**`T-101-s5`**, non-blocking.

### Suites, gates and exits — every `$?` read unpiped

| command | where | result | exit |
|---|---|---|---|
| `npm run build` | lib/parser | dist emitted | **0** |
| `npm run build` | app | css 43.95 kB, sha `71ed851e…` | **0** |
| `npm test` | app | **863 / 863** over 43 files | **0** |
| `npx tsc --noEmit` · `tsc -p tsconfig.test.json` | app | both clean | **0** / **0** |
| `npx vitest run` | lib/parser | **263 / 263** over 12 | **0** |
| `npm test` (`NPUTER_E2E_PORT=14561`) | tools/e2e | **129 / 129**, 34.2 s | **0** |
| `npm run typecheck` | tools/e2e | clean | **0** |
| `npm run lint:tokens` | tools/e2e | TOKEN **124** / CONTROL **584** | **0** |
| `node tools/e2e/scripts/docs-gate.mjs <4 paths>` | repo root | **FIRES**, 3 suites owed | **1** |
| `NPUTER_BOOT_PORT=14562 npm run boot:check` | tools/e2e | both `[nputer]` lines | **0** |
| `index --check --root ../..` | app/src-tauri | **REAL** red, 1023→1029 / 1550→1559 | **1** |
| same, on the merge forecast | detached, own target dir | **REAL** red, 1120→1126 / 1703→1712 | **1** |

No cargo suite owed — still no Rust in this diff. Graph red is real at
both refs (count lines present, `files +0 -0 ~3`), no `graph.json`
committed. Boot lines verbatim: `[nputer] project folder:
/Users/ujju/Projects/nputer-T-101` and `[nputer] window "main" created`.

**Drill hygiene.** 19 mutants this pass, each one side only, each read
back with `git diff --unified=0` before its suite, applied by a Python
driver with `encoding='utf-8'` and a match-count-of-exactly-1 guard.
Restoration proved three ways after every run and at the end: empty
`git diff`, sha256 against the recorded pristine triple, and agreement
with the rebuild's own published hashes (`interview-turns.tsx`
`28c6c5f8…1526d699` — identical). **Port 1420 read with `lsof -nP
-iTCP:1420 -sTCP:LISTEN` only**, before and after every stage: `node`
pid **82549** on `[::1]:1420`, unchanged all session. No real model call;
the capture is untouched at `273a3d33…`.

### @human — the one look still stands, and it is now safe to take

My first verdict's guidance is unchanged and I will not restate it in
full: judge the register on a turn that **completes** carrying two `Bash`
refusals, and it reads as ALARM if the rows borrow the failure surface's
colour, outrank the answer, or make a completed turn look unresolved.

**What the rebuild changed for you:** on a turn that dies of a refusal
you will now see the failure block naming the tool AND — if the CLI
refused something it could not name — one quiet row beside it. That is
correct and is the fix; it is not the double report. The genuine double
report is on the `exitNonZero` path only (one tool name in the notice and
again inside the error blob) and it is `T-101-s1`'s to close, so do not
read it as a verdict on the register.
