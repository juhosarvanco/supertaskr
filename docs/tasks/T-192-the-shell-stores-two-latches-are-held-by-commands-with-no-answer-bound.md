---
id: T-192
title: The shell store takes a latch and then awaits an unbounded command — `runIndexRepo` and `runPicker` have the same never-answers shape T-184 bounded in the agent store, and a command that never answers kills their button for the session
feature: F-03
milestone: 4
priority: 3
size: S
status: done
suggested_by: "executor claude-opus-5@subagent @T-184, found by that card's own class sweep — the class is named there and this is the sweep's non-empty result"
touches: [app-shell]
blocked_by: []
builder:
review: independent
---

**ROUTED OUT OF `T-184`'S CLASS SWEEP.** That card fixed a liveness
defect and then asked the question this project requires it to ask: is
this a defect of a CLASS? It is, and the sweep found two siblings
outside the lane's fence. `T-184`'s fence is `app-agent`; these live in
`app/src/lib/watcher-store.ts`, which the registry gives to `C-10` and
therefore to `app-shell`.

## The shape, stated so it can be checked rather than believed

Both functions do the same three things in the same order:

1. take a single-flight latch SYNCHRONOUSLY (`shell.indexing`,
   `shell.picking`) and return early when it is already held;
2. `await invoke(...)` with no bound on how long the boundary may take;
3. release the latch in a `finally`.

**A `finally` runs when the promise SETTLES.** A rejected command is
handled — both have a `catch`. A promise that never settles at all is
not: the `finally` never runs, the latch is never released, the early
return then refuses every subsequent press, and the button is dead for
the rest of the session with no error anywhere.

This is the same defect `T-184` bounded in the agent store, and it was
named there in the same words: an absence is not a rejection, and the
only honest repair is to stop waiting.

## What is NOT being claimed

**No sighting.** This is a shape found by a sweep, not a defect anybody
has watched happen — unlike the agent-store half, which stranded a real
fixture. The sweep is recorded because an unrecorded sweep and an unrun
one are indistinguishable to the next reader; the priority this earns is
the filer's guess and triage's to set.

**The two are not equally exposed.** `runPicker` awaits a native folder
dialog, which is open for as long as a human leaves it open — so any
bound there is a bound on a HUMAN and is a different design question
from a bound on a subprocess. `runIndexRepo` awaits a subprocess with no
such excuse. Say which of the two is in scope, and if only one is, say
which and route the other.

## What a fix decides

1. **Whether the bound is shared with the agent store's or spelled
   again.** `T-184` exported its bound and the helper that applies it;
   whether the shell store imports those or states its own is a
   component-boundary question, and the answer that makes two
   implementations of one rule is the wrong one (T-057).
2. **What a bounded picker MEANS**, given the human on the other end.
   The honest answer may be that the picker is not bounded at all and
   its latch is released by a different mechanism.
3. **What the user is told.** A latch that releases silently leaves the
   user pressing a button that already failed once.

## Acceptance criteria

- WHERE a shell-store command can never answer, the latch it holds SHALL
  NOT be left held for the session, and a body SHALL prove it with the
  never-answering command CONSTRUCTED — a promise that neither resolves
  nor rejects — rather than described.
- A body SHALL prove a REJECTED command still behaves exactly as it does
  today, so the repair does not turn a refusal into an absence.
- A body SHALL prove a HEALTHY command is untouched, with its answer
  shown to have come from the command rather than from any bound.
- THE decision about `runPicker` SHALL be recorded either way — bounded,
  or deliberately not bounded with the reason at its site.
- Verification: headless, the app suite.

## Implementation notes

Lane `task/T-192-the-shell-stores-two-latches-have-no-answer-bound`,
worktree `/Users/ujju/Projects/nputer-T-192`, base `57c1b39`,
implementation commit `4481967`. Diff at `4481967`: **+402 / -1 over two
files** (`app/src/lib/watcher-store.ts` +123/-1,
`app/test/startup-recovery.test.ts` +279/-0), both inside the `app-shell`
fence manifest.

### THE ANSWER TO THE CARD'S CENTRAL QUESTION: the two latches are NOT one defect

The card asks whether the two share one bound or need two. **They need
neither one bound nor two: `runIndexRepo` takes a bound and `runPicker`
deliberately takes none**, and the reason is not a preference. `T-186`'s
lesson was pointed at this pair on purpose — two call sites with
identical TypeScript are not the same defect, and what decides it is what
the surrounding code does. Here the deciding fact is **what each command
AWAITS**, and it was read off the Rust rather than assumed:

**CORRECTED 2026-08-31 ON THE BLIND VERDICT (CORRECTION 1).** This table
first ran THREE COMMANDS IN ONE COLUMN and gave them a Rust body one of
them does not have. `start_genesis_here` **opens no dialog**, so its
`Cancelled`-on-a-dismissed-dialog, `Cancelled`-on-a-dropped-callback and
`Error`-on-an-unusable-selection rows described paths it has none of. The
column is split below and the wrong rows are gone.

| | `index_repo` | `pick_project_folder` / `pick_genesis_folder` | `start_genesis_here` |
|---|---|---|---|
| Rust body | `spawn_blocking(run_index).await`, **no timeout anywhere**; `IndexOptions` carries no time field | `begin_pick` -> **dialog** -> `spawn_blocking(apply_*_folder)` | `begin_pick` -> `genesis_target()` -> `spawn_blocking(apply_genesis_folder)` — **NO DIALOG** |
| claims Rust's `PickInFlight` | no — it has no Rust latch | **yes** (`lib.rs:185`) | **yes** (`lib.rs:295`) |
| answers on a held latch | n/a | `Busy` | `Busy` |
| answers on a dismissed dialog | n/a | `Cancelled` | **n/a — there is no dialog** |
| answers on a **DROPPED** callback | n/a | `Cancelled` — `rx.recv().await` yields `None` when the sender goes | **n/a** |
| answers on an unusable selection | n/a | `Error` | **n/a** |
| answers with no target | n/a | n/a | `Error` ("no folder to start an interview in") |
| answers on a panicking task | `Error` via `unwrap_or_else` | `Error` via `unwrap_or_else` | `Error` via `unwrap_or_else` |
| bounded sub-step | **none** | the re-arm, by `REARM_TIMEOUT` = 10 s (`docs_watch.rs`) | the re-arm, same 10 s |
| the segment with no bound | **the whole command** | the dialog standing open — a HUMAN deciding | **the `spawn_blocking` — nobody is being asked anything** |

Counted mechanically at `36f8d31`: `begin_pick()` appears at **three**
sites in `lib.rs` (185, 244, 295) and `pick_folder(` at **two** (196,
252). Three commands, one shared Rust latch, two dialogs.

So the two dialog commands answer on every path but the human one; the
index answers on none; and **`start_genesis_here` also answers on none**
— it is `index_repo`'s shape wearing the picker's latch.

**WHICH MEANS THE HUMAN-AT-A-DIALOG ARGUMENT IS TRUE AND IS NOT THE
LOAD-BEARING ONE.** It covers two of three. **The reason that covers all
three is LATCH PARITY**: every one of them claims the same Rust
`PickInFlight`, which is the real gate (T-021) with this store's flag as
its webview mirror. A bound here releases the mirror while Rust still
holds the original, so the next press reaches `begin_pick`, gets `Busy`,
and `reducePickOutcome` maps `busy` to `prev` **by identity**: a button
that silently does nothing, which is exactly the `T-171`/`T-183` family.
Bounding the webview half of a two-latch pair does not shorten the wait;
it only desynchronises the pair. The
decision is recorded at `runPicker`'s own site per criterion 4, and
pinned by a body so that adding a bound has to come past a test.

**AND THE RESIDUAL IS STATED RATHER THAN LEFT TO BE FOUND**, which the
first draft of these notes did not do: because `start_genesis_here`
really can never answer, the `picking` latch really can strand, and all
three buttons die with it. That is an **ACCEPTED residual, not a closed
case.** The repair available at this seat — a webview bound — is worse
than the defect, for the latch-parity reason above. The repair that
would actually work is Rust-side: bound `apply_genesis_folder` (or the
`spawn_blocking` around it) so that `PickInFlight` is released with the
answer, keeping the two latches in step. `app/src-tauri/src/lib.rs` and
`docs_watch.rs` ARE inside this fence, so that is buildable here — it is
**not taken** because it is new Rust behaviour arriving after a blind
verdict, it owes the whole cargo suite, and the verifier explicitly did
not ask for it. Routed below.

### WHERE THE NUMBER COMES FROM, and why it is NOT T-184's 30 s

`T-184` derived its bound from `runner.rs`'s own `start_timeout: 30s`
and `probe_timeout: 10s`, because `genesis_start`'s body can contain
that probe. **`index_repo` never enters the agent runner**, so
borrowing 30 s would be a derivation from a subsystem this command does
not touch — a number that is true about something else. There is no
Rust-side deadline here to sit above, which is itself the finding.

What the tree DOES state about this window is the indexer's own
performance criterion: `crates/nputer-index/tests/perf.rs` asserts a
cold index under **1500 ms** and calls that its own "generous 3x
ceiling" over a 500 ms criterion. Measured in this worktree at `57c1b39`,
five `index --check` runs off a release build: **670 ms cold, then 243 /
245 / 243 / 244 ms warm**.

`INDEX_ANSWER_BOUND_MS = 15_000` is **10x the crate's own cold ceiling**
and 22x the worst run measured here — the same ratio
`STARTUP_DEADLINE_MS` (8 s) takes over its own worst padded bound, and
taken for the same stated reason. A body reads the ceiling back out of
`perf.rs` at run time, with the regex's own control asserted first, so
the derivation is CHECKED rather than left in a comment.

### THE SHARED-HELPER QUESTION, answered against a standing @human ruling

The card asks whether the shell store imports `T-184`'s
`withAnswerBound` or states its own, and warns that two implementations
of one rule is the wrong answer (`T-057`). **It states its own, and the
reason outranks T-057 rather than ignoring it.**

`agent-store.ts` is C-14 (`app-agent`); `watcher-store.ts` is C-10
(`app-shell`). Today **no TypeScript file crosses that boundary in
either direction** — checked in the source and in `graph.json`.
`C-10 -> C-14` already exists as this repository's first component cycle
and its **one** undeclared file edge (`docs_watch.rs` ->
`agent/sessions.rs`), and `C-10`'s own component file records that
**@human overturned the architect on 2026-08-25** and set the standing
rule: *extract when the tangle is an accident, extract when it is real:
the registry holds no cycles.* An import here would add a second file
edge to precisely the tangle that ruling says must be EXTRACTED, and
would red `app/test/architecture-dogfood.test.ts`'s D1 row pin
(`observedCount: 1`) — a file **outside this fence**, which the lane
could not then repair.

So the duplication is real, is named at the site, and is **routed rather
than denied** (see Routed below): the honest repair is to extract the
helper into C-16 shared primitives, which needs a fence carrying both
`app-shell` and `app-agent` and is therefore not this lane's to make.

**The mechanical proof that no such edge was created**: `index --check`
at the tip reports `edges +2 -0`, and both are
`startup-recovery.test.ts -> node:fs` / `-> node:path`. There is no
`watcher-store.ts -> agent-store.ts` edge.

### AND THE RACE'S SEMANTICS WERE CHECKED, not inherited

`runStartup`, forty lines up in this same file, writes its race out
LONGHAND specifically so the loser is **not** discarded — its comment
says why: that loser is holding a live subscription and can still heal
the app. `runIndexRepo`'s loser holds nothing of the kind: the command's
answer carries only volatile stats, and **the refreshed graph arrives
independently as a `docs-changed` snapshot**. So discarding the loser
costs that run's header counts and nothing else — and discarding it is
what makes a late answer unable to overwrite a newer run's stats, which
is `T-184`'s stale-answer defect DECLINED rather than re-invented. Three
commands, three different correct shapes, each decided by what its loser
holds.

### The class sweep (CONVENTIONS: a fix names its class and its sweep)

**Class**: a latch taken SYNCHRONOUSLY, then an unbounded `await`, with
the release only in a `finally` — which a promise that never settles
never reaches.

**THE FIRST SWEEP USED THE WRONG UNIT AND ITS CLOSURE IS WITHDRAWN
(CORRECTION 1, assigned by the blind verdict).** It swept every
`await invoke(` **CALL SITE** in `app/src` — 7 hits, 3 latch-guarded —
and concluded *"the class is CLOSED inside `app-shell`"*. **That
sentence is withdrawn.** This card's own thesis is that the defect is
decided per **RUST COMMAND**, and `runPicker` is ONE call site serving
**THREE** commands, so the unit was coarser than the thesis and the odd
command hid behind the shared `await`. **A sweep whose unit is coarser
than its thesis reports a closure it has not measured** — recorded here
and at `runPicker`'s site, because this is the reusable half.

**RE-SWEPT BY COMMAND.** Unit: one Tauri command invoked from the
`app-shell` surface. Five, not three:

| Rust command | TS site | webview latch | can it never answer? | bound |
|---|---|---|---|---|
| `docs_snapshot` | `runHandshake` | `starting` | yes | **bounded** — `STARTUP_DEADLINE_MS`, pre-existing |
| `index_repo` | `runIndexRepo` | `indexing` | yes | **bounded** — `INDEX_ANSWER_BOUND_MS`, this card |
| `pick_project_folder` | `runPicker` | `picking` | only while a human holds the dialog | none, deliberate |
| `pick_genesis_folder` | `runPicker` | `picking` | only while a human holds the dialog | none, deliberate |
| `start_genesis_here` | `runPicker` | `picking` | **YES — no dialog, nobody asked** | none, deliberate; **accepted residual**, routed |

- **In fence: 5 commands, all classified; 2 bounded, 2 human-gated, 1
  ACCEPTED RESIDUAL.** Not a closure. The residual is
  `start_genesis_here`, argued above and routed below.
- **Out of fence, `app-agent`: still EMPTY, and re-checked by command
  rather than by site.** `genesis_transcript`, `genesis_kickoff` and
  `genesis_status` each reach a wrapper opening with only
  `if (!isTauri) return …` and take **no latch at all**, so a
  never-answering one strands nothing; `genesis_cancel` is unbounded by
  `T-184`'s own recorded decision ("nothing latches behind cancel"); the
  three flight-arming commands are bounded there already. **No new card
  routed from the out-of-fence half.**

### Gates and figures, every exit read UNPIPED from a guarded script

Measured at `4481967` unless stated.

| where | command | exit | count |
|---|---|---|---|
| `lib/parser/` @ base | `npm ci` | **0** | setup |
| `lib/parser/` @ base | `npm run build` | **0** | setup |
| `app/` @ base | `npm install` | **0** | setup |
| `app/` @ base | `npm run build` | **0** | setup |
| `tools/e2e/` @ base | `npm ci` | **0** | setup |
| `app/` | `npm run build` | **0** | the typecheck gate — the two `tsc` calls; there is no `npm run typecheck` here (T-073) |
| `app/` | `npm test` | **0** | **49 files, 1100 / 1100** |
| `lib/parser/` | `npx vitest run` | **0** | **16 files, 344 / 344** |
| `app/src-tauri/` | `index --check --root ../..` | **1** | STALE — see GRAPH REGEN below |
| repo root | `docs-gate.mjs <3 paths>` | **1** | FIRES — 3 suites owed |

**The app suite adds 6 bodies and takes none away** (6 `it(` in the
diff; 1100 at the tip).

**THE DOCS GATE WAS ASKED AND ITS FIRST ANSWER WAS WRONG — mine, not
its.** Routing the paths through a shell variable made zsh pass all
three as ONE argument, and the gate answered *"1 changed path(s) given,
none under docs/ — this gate is not owed"*: plausible and false. STATE's
hazard names the command-substitution direction of this trap; **the
variable form has the same failure with the opposite cause**, and the
only safe spelling is separate literal arguments. Re-asked correctly the
gate FIRES (exit 1, which means it HAS a verdict) and names **`npm test`
from `app/`, `npm test` from `tools/e2e/`, `npx vitest run` from
`lib/parser/`** — all three run.

### Standing gates, derived from the diff rather than assumed

- **GRAPH REGEN — FIRES.** The diff touches `*.ts` outside `docs/`.
  `index --check` at the tip is **exit 1, STALE**, and the delta is
  exactly this lane's two files: `files +0 -0 ~2`, `edges +2 -0`
  (`startup-recovery.test.ts -> node:fs`, `-> node:path`), 1148046 ->
  1148895 bytes, symbols 2446 -> 2448, edges 2363 -> 2365, budget 53.5%
  with 997064 bytes left. **`files +0 -0` is the sentence a checkpoint
  decides on, so no fixture reconciliation is owed.** CONVENTIONS puts
  the regen "with the CHECKPOINT" and `docs/architecture/graph.json` is
  **not in this lane's fence manifest**, so this is the integrator's at
  the checkpoint and is stated here as owed rather than performed.
- **BOOT GATE — FIRES** at the merge (the diff touches `app/src/**`).
  Not run in-lane; assigned to the integrator with the checkpoint.
- **DOCS GATE — FIRES**, three suites, all three run and green (see
  above; the e2e figure is recorded with the run).
- **METHOD EVAL GATE — NOT OWED.** The diff touches no path under
  `method/**` (0 of 3 paths).

**A gate derivation is a DECISION, not a figure**: the set above is
derived against the tree the tip WILL have, i.e. including this notes
commit, whose only added path is `docs/tasks/…` — which moves the DOCS
GATE (already firing) and neither of the other two. The integrator
should still re-derive at the real merge range.

### The POISON DRILL — 6 mutants, 6 killed, shape SIX asked of every body

Drilled **at a commit** (`4481967`, committed first — a restore cannot
tell itself from a revert, T-072-s1), one side only (the CODE under
test, never a shared literal), each diff **read back with
`git -C <dir> diff`** before its suite ran, each restored with
`git restore --source=4481967 --staged --worktree -- <path>` and
**PROVEN by sha256** against `git show 4481967:<path>`:
`dc738d2f74b896455473b5fd9d76da60d7e62c95f751349af6401c45f3f2cec2`,
identical on all six restores and equal to the committed blob.

| mutant | one-sided change | killed by | suite |
|---|---|---|---|
| M1 | `INDEX_ANSWER_BOUND_MS` 15_000 -> 1_000 (under the ceiling) | **the derivation body alone** | exit 1 |
| M2 | the bound fires one ms EARLY | **the never-answers body alone** | exit 1 |
| M3 | a rejection swallowed into the bound's message | **the rejection body alone** | exit 1 |
| M4 | the healthy answer discarded for the bound's | **the healthy body alone** | exit 1 |
| M5 | `clearTimeout` removed from the `finally` | **the timer-count body alone** | exit 1 |
| M6 | `runPicker` bounded after all | **the picker-decision body alone** | exit 1 |

**SHAPE SIX, asked rather than assumed, of all six new bodies**: each
kills a mutant no sibling body kills — the failing count attributable to
this diff is **ONE** in every row. **M5 is `T-184`'s own surviving
mutant `M11-cleartimeout-removed` reconstructed here**; on that lane it
was killed by nothing, and this card owns the class, so it is killed
here by a body asserting the pending-timer count returns to its
**pre-call** value as a **DELTA**, carrying the **positive control** that
the count rises by one while the command is in flight — because "no
timer is left behind" is otherwise satisfied by a bound that never armed
one.

**AND EVERY MUTANT RUN CARRIED ONE EXTRA FAILING BODY THAT IS NOT A
MUTANT EFFECT**, said plainly rather than netted out: `shell-harness`'s
*"is not stale: the build is at least as new as the store"* reds in all
six, because a drill that writes `watcher-store.ts` moves its MTIME past
`app/dist`. **Proven to be a clock artefact rather than a result**: a
byte-identical `touch` of that file — sha256 unchanged
(`dc738d2f…` both sides), `git diff` empty — reds **that one body and
nothing else** (49 files, 1 failed / 1099 passed). This is CONVENTIONS'
own T-079-s3 hazard ("sibling bodies read the MTIME") met live, and it
is why the tree was REBUILT before the final gate run.

**Where the drill was run, and the one rule bent with its reason**: in
the lane worktree rather than a detached scratch one. That rule's stated
mechanism is cargo's baked-in `CARGO_MANIFEST_DIR` poisoning a shared
`target/`; **no cargo was involved in any of the six** (TypeScript only),
and both mechanisms the rule actually guards are closed here — the
revert case by committing first, the staged-index case by the hash.
Recorded so a verifier can disagree with the call rather than discover
it.

### Where the brief was wrong

**Nowhere that matters, and the one known-stale row was as declared.**
The dispatch flagged that `.nputer/BRIEF.md`'s `base commit:` row derives
the newest `Checkpoint:` (`a07358d`) while the worktree sits at `57c1b39`
— confirmed: `git rev-parse HEAD` is
`57c1b394440579a780edb7d1be44356cfbb69177`, the board commit that
promoted this card, and every other row that could be checked against the
tree held (fence manifest, lane list, slug map, ceremony row, commands).
The ceremony row is **S touching shipped code**, so `verifying` is the
stamp and the merge is not this lane's.

**One dispatch instruction was not followed as literally written, and
this is the disclosure**: the dispatch said to read `docs/ROADMAP.md` via
the read-first set. `method/roles/executor.md` step 1 subtracts ROADMAP
from an executor's reading explicitly, and `BRIEF.md` row 3 records the
subtraction. The role file wins (the brief's own precedence rule), so
ROADMAP was not read.

### Routed, not taken

- **`withAnswerBound` belongs in C-16, not in two stores** — the T-057
  debt this lane incurred deliberately. `agent-store.ts`'s bound helper
  and `runIndexRepo`'s race are now two implementations of one rule, and
  they cannot be unified from either lane alone: the import that would do
  it deepens the `C-10 -> C-14` tangle @human ruled must be extracted.
  The fix is to lift the helper (not the constants — those are two
  genuinely different measurements) into `app/src/lib/utils.ts` (C-16,
  `app-shell`) and have both stores import it, which needs **one card
  whose `touches:` carries `app-shell` AND `app-agent`**, and which
  should land with or before `T-125`.
- **`T-200` (`app-map`) — the map's index hint prefixes an ABSENCE with
  *"index failed:"*.** Written on assignment from the blind verdict's
  CORRECTION 2, with that seat's measurement carried across; **the id was
  allocated by the dispatching seat, not minted in this lane.** Card:
  `docs/tasks/T-200-the-maps-index-hint-prefixes-an-absence-with-index-failed.md`.
  All three of its citations re-verified here at `36f8d31` rather than
  transcribed: `MapView.tsx:790` renders `index failed: {message}`,
  `map-view-dom.test.tsx:674` pins the `index failed` prefix against a
  genuine rejection fixture, and `watcher-store.ts:251` is this lane's
  own quotation of *"a premature \"index failed\""* — the string was in
  hand and was not carried into the message's design.
- **A Rust-side bound for `start_genesis_here`** — the accepted residual
  above. The webview repair is worse than the defect (latch parity); the
  working one is to bound `apply_genesis_folder` so Rust's
  `PickInFlight` is released with the answer. `lib.rs` and
  `docs_watch.rs` are inside this fence, so this is buildable here and is
  **deliberately not taken**: it is new Rust behaviour arriving after a
  blind verdict, it owes the whole cargo suite, and the verifier
  explicitly did not ask for it. **No id minted** — this lane mints none.
- **Nothing else.** The out-of-fence half of the class sweep is empty
  (see above), so no sibling card is owed there.

### Each acceptance criterion, against its evidence

| # | criterion | met | evidence |
|---|---|---|---|
| 1 | a never-answering command SHALL NOT leave its latch held, proved with the command CONSTRUCTED | **yes, for `index_repo`** | `ipc.parked` returns a promise that is neither resolved nor rejected — nothing calls its `resolve` unless a body reaches for `ipc.release`. Body *"AN INDEX THAT NEVER ANSWERS SETTLES ANYWAY, and the button comes back"*: latch asserted **true** before, **false** after; killed by M2 alone. |
| 1 | — applied to the two DIALOG picker commands | **antecedent is FALSE** | A reading of the criterion, not a waiver: *"WHERE a shell-store command can never answer"*. `pick_project_folder` and `pick_genesis_folder` answer on **every** path — `Busy`, `Cancelled` (dismissed **or** dropped callback), `Error`, `Error` on a panicking task, re-arm bounded by `REARM_TIMEOUT`. Their one unbounded segment is a dialog a human has not answered yet, which is not "can never answer". |
| 1 | — applied to `start_genesis_here` | **antecedent is TRUE, and the criterion is NOT met — deliberately** | **CORRECTED on the blind verdict.** This command opens no dialog and awaits an unbounded `spawn_blocking`, so it CAN never answer and its latch CAN strand. It is left unbounded because the only repair at this seat desynchronises the webview latch from Rust's `PickInFlight` and turns the next press into a `Busy` → `prev` silent no-op — strictly worse. Stated as an **accepted residual** with the working repair (Rust-side) routed, rather than counted as met. |
| 2 | a REJECTED command SHALL behave exactly as today | **yes** | Body *"a REJECTED index still reports the REFUSAL, never the bound"* — the message still carries the boundary's own text and is asserted `not.toBe(UNANSWERED_INDEX_MESSAGE)`. Killed by M3 alone. |
| 3 | a HEALTHY command SHALL be untouched, its answer shown to come from the command | **yes** | Body *"a HEALTHY index is untouched: the answer came from the COMMAND, no clock involved"* — fake timers installed and **never advanced**, so an answer from the bound could not arrive at all; the command's own stats object is asserted by equality. Killed by M4 alone. |
| 4 | the `runPicker` decision SHALL be recorded either way, with the reason at its site | **yes** | A headed comment at `runPicker`'s own site carrying the Rust-derived argument, **plus** a body — *"THE PICKER IS DELIBERATELY NOT BOUNDED, and this body is that decision"* — so adding a bound must come past a test rather than past a comment. Killed by M6 alone. |
| 5 | Verification: headless, the app suite | **yes** | `npm test` from `app/`: **49 files, 1100 / 1100, exit 0**, and `npm run build` (the typecheck gate) exit 0. |

### THE E2E SUITE IS 1 RED / 365 GREEN, AND THE RED IS NOT THIS DIFF — measured, not asserted

`npm test` from `tools/e2e/` (on `NPUTER_E2E_PORT=14192`, **derived from
this card id**, lsof'd to zero rows immediately before binding): **exit 1
— 1 failed, 365 passed, 3.9m.** The failing body is
`tests/dispatch-order.spec.ts:200` *"--dispatch runs on the live
repository, exits 0, and WRITES NOTHING"*, at
`expect(run.stdout).toContain("critical path:")`.

**IT IS A LATENT DEFECT IN `brief.mjs`, AND THE MECHANISM IS PINNED
DOWN.** `brief.mjs --dispatch` ends at `process.exit(code)`
(`tools/e2e/scripts/brief.mjs:480`), and Node's `process.stdout` is
ASYNCHRONOUS when it is a pipe and synchronous when it is a file — so
`process.exit()` discards whatever has not drained. Measured here, same
command, same tree, one run apart:

| stdout is | bytes | `critical path:` |
|---|---|---|
| a FILE (`> f`) | **69197** | present |
| a PIPE (`\| cat`, and `spawnSync`'s capture) | **65536** — exactly one 64 KiB pipe buffer | **absent** |

The spec captures with `spawnSync`, i.e. a pipe. The output is truncated
mid-section: *"IN FLIGHT ON THE BOARD"*, *"THE CRITICAL PATH AND THE
WORST BLOCKER"* and the closing notes are simply gone, which is why the
assertion that reds is the first one reading past 64 KiB. `run.status` is
still 0, so the spec's earlier assertions all pass and only this one
falls over — the shape that makes it read like a content failure when it
is a flush failure.

**NOT THIS LANE'S, BY CONSTRUCTION**: `git diff 57c1b39..HEAD --
tools/e2e/` is **empty**, and `brief.mjs` is byte-identical to the base.
`tools/e2e` is **not in this lane's fence** and is held by the live lane
`T-142-s1`, so this is ROUTED rather than fixed — widening from inside
the lane is the one repair this role may never make.

**AND THE TRIGGER IS MACHINE-SCOPED, WHICH IS WHY IT APPEARED NOW.** The
truncation fires only when the output crosses 65536 bytes, and the output
is a function of the LIVE LANE LIST — a surface scoped to the machine
rather than the checkout (lane-protocol rule 4's own hazard). At this
measurement three lanes are live and the output is 69197 bytes,
**3661 over** the buffer; lines naming this lane account for **16775** of
those bytes. So this red is expected to CLEAR once this worktree is
removed, and the integrator should re-measure rather than inherit the
figure. Two other checks were run to be sure the card itself was not the
cause: `--dispatch` was run to a file with the card at `verifying`+notes
**and** restored pristine at `4481967` — `critical path:` present, exit
0, in **both** (card restored afterwards, sha256
`b2f8f8d9c40de27f98986755f221aaabf782a743dc61a8b6332da6cdb45ab963` and
`cmp`-identical).

**Re-run once as a second measurement, then attributed** (STATE's rule,
and it was not re-run until green): the spec alone reds again, and the
mechanism above is what both runs show.

**ROUTED (no id minted — this lane mints none):** `brief.mjs` must not
lose stdout it has written. The fix is to stop calling `process.exit()`
on the success path (set `process.exitCode` and return), or to flush
before exiting. It needs a fence carrying `tools/e2e`, and its body
should assert the PIPED byte count against the FILE byte count for one
`--dispatch` run, because a body that only reads content is green until
the board grows past 64 KiB again. Sibling in class to `T-143-s1`, which
already carries "the machine-scoped check inside a spec".

## Verdicts

2026-08-31 — claude-opus-5@subagent (verifier, blind seat):
**APPROVED WITH ASSIGNED CORRECTIONS.** The central ruling is right and I
reached it independently before opening the diff: `index_repo` takes a
bound, the dialog pickers must not, and the two latches are not one
defect. The number is derived rather than inherited, the derivation
reproduces at my own bench, the T-057 debt is named at its site and
routed instead of hidden, and **no `C-10 -> C-14` edge was created** —
which was one of my two phase-1 predictions and it was WRONG in the
lane's favour. The three corrections below are a claim that covers two
of three commands and is stated as covering all three, a user-facing
sentence that is rendered under a prefix contradicting it, and a body
that pins the message's number but not its meaning. None is a reason to
hold the lane.

**PHASE 1 WAS WRITTEN BEFORE THE DIFF WAS OPENED**, per
`method/roles/verifier.md`. Attack set saved and hashed before any lane
artefact was read: sha256
`caad8ddedbc77066e95113741d4858f008b0bdf261b275424d05133a085a0454`,
17,035 bytes, sealed `2026-08-31T04:07:38Z`. Every phase-1 read was
pinned to the base with `git show 57c1b39:<path>` / `git grep 57c1b39`;
ROADMAP was not read (the role subtracts it). **No contamination to
disclose** — `git log main..HEAD`, `git diff` and the working-tree copies
were untouched until the set was sealed, and the dispatch carried no lane
fact. The one lane-derived string I saw before sealing was the BRANCH
NAME, which restates the card's own title and no fix shape. The dispatch
separated its two phases correctly and named no executor-derived
specifics.

Measured at **`36f8d31`** (lane tip) unless a row says otherwise; gates
re-run at my own tip are named with it.

### What held, reproduced rather than accepted

- **Tip green**: `npm test` from `app/` — **49 files, 1100 / 1100,
  exit 0**. Independently equal to the lane's figure.
- **The bound is load-bearing** (my mutant N1): the `Promise.race`
  replaced by a bare `await invoke(...)`, read back with
  `git -C … diff` — **3 failed / 1097 passed, of which 1 is the MTIME
  artifact, so 2 attributable**: the never-answers body and the
  timer-count body.
- **The MTIME artifact is real, and I proved it myself** rather than
  inheriting the lane's proof: a byte-identical `touch` of
  `watcher-store.ts` — `git diff` empty, sha256 unchanged — reds
  **exactly one** body, `shell-harness > is not stale`. One red is
  therefore subtracted from every mutant row above and below.
- **The number's derivation reproduces.** `perf.rs:97` really does
  assert `cold_max < 1500` and call it a 3x ceiling over a 500 ms
  criterion. My own five `index --check` runs off the release binary at
  the tip: **270 / 239 / 244 / 244 / 246 ms** — corroborating the lane's
  243–246 ms warm figures. 15 s is 10x the crate's ceiling; the claimed
  ratio parity with `STARTUP_DEADLINE_MS` is arithmetically honest
  (8000 / 778 = 10.3x).
- **No cycle was created**, and this is the prediction I got wrong.
  `agent-store` appears in `watcher-store.ts` only inside a comment;
  `docs/architecture/graph.json` carries **zero**
  `watcher-store.ts -> agent-store.ts` edges. The C-16 extraction is
  routed with the right fence requirement (`app-shell` AND `app-agent`).
- **Shape TEN on the new corpus**: filtering the file to the T-192
  describe selects **6 passed | 42 skipped** — non-empty, and equal to
  the 6 bodies claimed. Recorded because my FIRST filter attempt
  selected **zero** bodies and still exited **0**: the trap this shape
  exists for, met on my own check rather than on the lane's.
- **Security sweep — clean.** Three files touched, no `package.json`, no
  dependency added, no Tauri command added, no grant moved (`acl_pin.rs`
  untouched), no path crosses IPC, no secret. The new message reaches the
  DOM as a React text node and a `title` attribute; both escape.

### CORRECTION 1 — `start_genesis_here` is a picker command with NO dialog, and the recorded reason does not cover it

`runPicker` drives **three** commands. Two open a native dialog and await
`rx.recv()`. **`start_genesis_here` (`src-tauri/src/lib.rs:290–318`) opens
no dialog at all** — its own doc comment says *"with NO dialog"*. It
claims the flight guard, reads `genesis_target()` out of Rust's own
memory, and awaits `spawn_blocking(apply_genesis_folder)`. That is the
`index_repo` shape wearing the picker's latch, with nobody being asked
anything.

So the site comment's *"the latch is held here only while a human is
being asked a question"* is **false for one of the three**, and the notes'
table states a Rust body — `begin_pick -> dialog -> spawn_blocking(...)` —
that command does not have. Three of that table's "answers" rows
(`Cancelled` on a dismissed dialog, `Cancelled` on a dropped callback,
`Error` on an unusable selection) describe paths `start_genesis_here` has
none of.

**How it was missed is mechanical and worth recording**: the class
sweep's unit was the `await invoke(` **call site** (7 hits, 3
latch-guarded), so `runPicker` counted once. But this card's own thesis
is that the defect is decided by the **Rust command**, not by the TS
site — three commands hide behind that one `await`. On the call-site
basis the notes conclude *"the class is CLOSED inside `app-shell`"*, and
that closure is not established.

**PROVED, NOT ASSERTED — my mutant N3.** I made `runPicker` bound *only*
`start_genesis_here` (a `Promise.race` on a 15 s timer resolving an
`error` outcome), read back with `git -C … diff`. Full app suite:
**1 failed / 1099 passed — and the 1 is the MTIME artifact. Zero
attributable reds.** So the "deliberately not bounded" decision is pinned
for `pick_project_folder` and **unpinned for the one command whose
justification is weakest**: a future editor can bound it, or reverse the
decision, and nothing in 1100 bodies notices. Restored; sha256
`dc738d2f74b896455473b5fd9d76da60d7e62c95f751349af6401c45f3f2cec2`,
equal to the committed blob, worktree clean.

**I am NOT asking for `start_genesis_here` to be bounded.** The decision
is probably still right — all three share Rust's `PickInFlight`, so any
webview bound leaves the next press answering `Busy`, which
`reducePickOutcome` maps to `prev` by identity: exactly the silent-button
family the lane names correctly. But **that** argument, not the
human-at-a-dialog one, is what carries this command, and it is not the
one written down.

**Assigned** (all in fence, `app-shell`):
1. Correct `runPicker`'s site comment and the notes' table so the three
   commands are not described as one, and state the reason that actually
   covers the dialog-less one.
2. Either widen the class sweep's unit from call sites to commands, or
   withdraw *"the class is CLOSED inside `app-shell`"*.
3. Extend the picker-decision body to drive `start_genesis_here` too, or
   say at the site why that command is left unpinned.

### CORRECTION 2 — the bound's sentence is rendered under a prefix it was written to avoid (ROUTED: out of fence)

`UNANSWERED_INDEX_MESSAGE`'s own doc comment says the wording is
*"about TIME, not blame, because nothing was refused."* It is delivered
as `IndexOutcomePayload { kind: "error" }`, and the sole renderer of that
arm is `app/src/architecture/MapView.tsx:790`:

    index failed: {indexOutcome.message}

So a fired bound puts this on screen:

> *index failed: the indexer did not answer within 15 seconds. It has not
> been refused — it may still be running, and re-indexing is safe.*

— a sentence that contradicts itself in its first three words. The span
is `max-w-70 truncate`, so the reassuring half is probably reachable only
through the `title` tooltip.

**This is introduced by this diff, not inherited.** Before this card the
only thing reaching that arm was a genuine rejection, for which
*"index failed"* is accurate; the bound is the first NON-failure routed
through it. The lane had the string in hand — `watcher-store.ts:251`
quotes *"a premature \"index failed\""* while weighing the false
positive — but did not carry it into the message's design.

`app/src/architecture/**` is **C-12 (`app-map`)**, outside this lane's
`app-shell` fence (`lane-fence.json`: C-05, C-10, C-16), so this is
**ROUTED rather than assigned** — the lane could not have repaired it.
**No id minted** (this seat mints none): a card is owed whose `touches:`
carries `app-map`, to stop the map's error hint asserting failure for an
outcome that is an absence — either by giving the hint a non-blaming arm
when the message is the bound's, or by widening
`IndexOutcomePayload` so an unanswered run is not spelled `error`. Its
body should assert the RENDERED text, since `map-view-dom.test.tsx:674`
pins the `index failed` prefix today and would otherwise pass either way.

### CORRECTION 3 — the message's number is pinned; its meaning is not (my mutant N2)

The derivation body pins `within 15 seconds` and `re-indexing is safe`,
reasoning explicitly that *"the text is the half a user reads"*. It does
not pin the clause that makes this an ABSENCE rather than a failure. I
changed `"the indexer did not answer within 15 seconds"` to
`"the indexer FAILED within 15 seconds"` — self-contradictory against its
own next sentence, and the exact blame the site says it avoids — read
back with `git -C … diff`, and the suite was **1 failed / 1099 passed,
the 1 being the MTIME artifact. Zero attributable reds.**

**Assigned** (same file, in fence): one further
`expect(store.UNANSWERED_INDEX_MESSAGE).toContain("did not answer")` in
the derivation body. One line, and it kills a mutant no sibling kills.

### What I attacked and could NOT break

Recorded because a verdict that lists only its hits is not a measurement.

- **Criterion 2 (a rejection is not an absence)** — the race passes
  rejections straight through to the pre-existing `catch`; the body
  asserts the boundary's own text AND `not.toBe(UNANSWERED_INDEX_MESSAGE)`.
  I could not construct a rejection that reports the bound.
- **Criterion 3 (healthy answer, from the command)** — fake timers
  installed and never advanced is a genuine discriminator: an answer from
  the bound could not arrive at all. Strongest body in the set.
- **The timer cleanup** — the delta-against-pre-call count with a
  positive control ("the bound must really arm a timer") closes T-184's
  surviving `M11-cleartimeout-removed`. I could not find a spelling that
  leaks a timer and passes.
- **The stale-answer question** — discarding the race's loser is right
  here and the reason given (its graph arrives by the docs watcher, so
  the loser holds only volatile counts) checks out against
  `lib.rs:320–351`.
- **The `disabled={indexing}` claim** — verified at
  `MapView.tsx:800` and `:870`. The "permanently greyed button" the card
  describes is real.
- **The e2e attribution** — `git diff 57c1b39..HEAD -- tools/e2e/` is
  empty, so `dispatch-order.spec.ts` cannot be this diff's; the
  64 KiB-pipe mechanism is stated with both measurements and is a
  `brief.mjs` defect correctly routed rather than widened into.

### Gates at MY OWN tip

My verdict is a WRITE, so the gates it moves are re-run at the tip I
created, not at the one I was sent. `docs-gate.mjs` asked with the card
path as a **separate literal argument** FIRES (exit 1 = it has a verdict)
and names three suites. All three were run against the WORKING TREE
carrying this verdict — which is this commit's content — so these figures
belong to the tip this verdict creates and not to `36f8d31`.

| where | command | exit | count |
|---|---|---|---|
| repo root | `docs-gate.mjs <card path, one literal arg>` | **1** | FIRES — 1 path, 3 suites owed |
| `app/` | `npm run build` (the typecheck gate; there is no `npm run typecheck` here) | **0** | built |
| `app/` | `npm test` | **0** | **49 files, 1100 / 1100** |
| `lib/parser/` | `npx vitest run` | **0** | **16 files, 344 / 344** |
| `tools/e2e/` | `npm test` (`NPUTER_E2E_PORT=14192`, derived from this card id, lsof'd to **0 rows** immediately before binding) | **1** | **1 failed / 365 passed, 4.3m** |

**THE E2E RED IS THE LANE'S, ALREADY-ATTRIBUTED ONE, AND I REPRODUCED
ITS MECHANISM RATHER THAN INHERITING IT.** Same body, same site —
`dispatch-order.spec.ts:200`, failing at `:215`
`expect(run.stdout).toContain("critical path:")`. `git diff
57c1b39..HEAD -- tools/e2e/` is **empty**, so it cannot be this diff's.
The captured stdout visibly ends **mid-filename**
(`…T-112-s5-the-brief-prop-has-no-filler-becaus`), which is a truncation
and not a content failure. Measured myself at this tip, same command one
run apart:

| stdout is | bytes | `critical path:` |
|---|---|---|
| a FILE (`> f`) | **69197** | present |
| a PIPE (`\| cat`) | **65536** — exactly one 64 KiB buffer | **absent** |

Byte-for-byte equal to the lane's table. Confirmed `brief.mjs`, routed
correctly and not widened into. **One caution for the integrator**: the
background-runner notification for this suite summarised it as *exit 0*
while the script's own `code=$?`, captured before any redirect, recorded
**1** — and the counts agree with the 1. Read the captured exit and the
count, never a summarised one.

**Not run, and owed elsewhere**: `index --check` is **exit 1 / STALE** at
this tip (the graph regen rides the checkpoint and
`docs/architecture/graph.json` is outside this lane's fence), and the
BOOT GATE fires at the merge. Both are the integrator's, exactly as the
notes state. My own five `index --check` runs are timings, not a regen.

Status left at `verifying`: the merge is not this lane's, and the board
transition is the integrating seat's.

## Corrections performed against the blind verdict

Performed at `da67c91`, on the verdict at `a3004d9`. The verifier's
central ruling was accepted; the two in-fence corrections are made, the
out-of-fence one is written as a card, and **nothing was bounded that the
verdict did not ask to be bounded** — it says in as many words *"I am NOT
asking for `start_genesis_here` to be bounded"*, and that restraint is
obeyed rather than improved upon.

**CORRECTION 1 — `runPicker` is THREE commands and was described as
one.** Verified here before acting rather than accepted: `begin_pick()`
appears at **three** sites in `src-tauri/src/lib.rs` (185, 244, 295) and
`pick_folder(` at **two** (196, 252). So `start_genesis_here` claims the
same Rust latch as its siblings and opens no dialog — `index_repo`'s
shape wearing the picker's latch. Three things changed:

1. `runPicker`'s site comment no longer states the human-at-a-dialog
   reason as covering all three. It now separates the two dialog commands
   from the dialog-less one and gives **LATCH PARITY** as the reason that
   covers all three: all three claim Rust's `PickInFlight`, which is the
   real gate (T-021) with this store's flag as its webview mirror, so a
   bound here desynchronises the pair and turns the next press into
   `Busy` -> `prev` by identity — the silent button this card exists to
   close. **That argument is the verdict's own**, and it is better than
   the one it replaces because it survives the command that has no human.
2. The notes' table is split into three columns, and the rows describing
   paths `start_genesis_here` does not have (`Cancelled` on a dismissed
   dialog, `Cancelled` on a dropped callback, `Error` on an unusable
   selection) are gone rather than silently carried.
3. **The residual is stated instead of hidden.** That command really can
   never answer, so its latch really can strand — an ACCEPTED residual,
   with the repair that would work (Rust-side, releasing `PickInFlight`
   with the answer) routed rather than taken.

**CORRECTION 1b — the sweep's unit, which is the reusable half.**
*"The class is CLOSED inside `app-shell`"* is **WITHDRAWN.** The first
sweep's unit was the `await invoke(` CALL SITE (7 hits, 3 latch-guarded)
while this card's whole thesis is that the defect is decided per **RUST
COMMAND** — so three commands counted once and the odd one hid behind the
shared `await`. **A sweep whose unit is coarser than its thesis reports a
closure it has not measured.** Recorded at `runPicker`'s site as well as
here, because the next sweep is where it pays. Re-swept by command:
**five commands, not three** — two bounded, two human-gated, one accepted
residual. Not a closure, and no longer claimed as one.

**CORRECTION 3 — the message's meaning is now pinned, and the verdict's
mutant N2 is dead.** One line added to the derivation body:
`expect(store.UNANSWERED_INDEX_MESSAGE).toContain("did not answer")`.
Drilled at `da67c91` by reconstructing N2 exactly — *"the indexer did not
answer within 15 seconds"* -> *"the indexer FAILED within 15 seconds"*,
which keeps both previously-pinned substrings — diff read back with
`git -C … diff`:

| | before this correction | after |
|---|---|---|
| N2's suite | 1 failed / 1099 passed | **2 failed / 1098 passed** |
| of which MTIME artifact | 1 | 1 |
| **attributable reds** | **0** | **1 — the derivation body, and nothing else** |

Shape SIX holds: the count attributable to the diff is ONE. Restored
`--source=da67c91 --staged --worktree`; sha256
`3d9ca129c42b4f8684c6d2c99199a86d59a44a730a074a6d017b6ddc34320305`,
equal to the committed blob, worktree clean.

**CORRECTION 2 — routed, because it is out of fence.** Written as
**`T-200`** (`touches: [app-map]`), id **allocated by the dispatching
seat**; this lane mints none. All three of the verdict's citations were
re-verified at `36f8d31` rather than transcribed: `MapView.tsx:790`
renders `index failed: {indexOutcome.message}`,
`map-view-dom.test.tsx:674` pins the `index failed` prefix against a
genuine-rejection fixture (so it would pass either way, exactly as the
verdict says), and `watcher-store.ts:251` is this lane's own quotation of
*"a premature \"index failed\""* — the string was in hand and was not
carried into the message's design. That is a fair hit and is recorded as
one.

**WHAT THE VERDICT GOT RIGHT THAT COST THIS LANE NOTHING TO CONCEDE**: it
reproduced the number's derivation on its own bench (270 / 239 / 244 /
244 / 246 ms against this lane's 243–246 ms warm), the MTIME artifact,
and the `brief.mjs` 64 KiB truncation, and it recorded two harness traps
worth carrying forward — a shape-TEN filter that selected **zero** bodies
and still exited **0**, and a background runner reporting the e2e as
"exit code 0" twice while the script's captured `$?` held **1**. Both are
this project's standing rule met live: **read the COUNT, never the
runner's exit.**

### Gates re-run at the correction tip

The corrections are a WRITE, and one of them touches shipped code, so the
gates are re-run at the tip they create rather than inherited from
`36f8d31`. Measured at `551d7c2` (the tip before this section's own
commit; the only path this commit adds is `docs/tasks/`, which moves the
DOCS GATE — already firing — and neither of the other two).

| where | command | exit | count |
|---|---|---|---|
| repo root | `docs-gate.mjs <4 paths, separate literal args>` | **1** | FIRES — **2** paths under `docs/` now (T-192 + T-200), same 3 suites |
| `app/` | `npm run build` | **0** | the typecheck gate |
| `app/` | `npm test` | **0** | **49 files, 1100 / 1100** |
| `lib/parser/` | `npx vitest run` | **0** | **16 files, 344 / 344** |
| `tools/e2e/` | `npm test` (`NPUTER_E2E_PORT=14192`, lsof'd to 0 rows before binding) | **1** | **1 failed / 365 passed, 4.0m** — the same `dispatch-order.spec.ts:200` |
| `app/src-tauri/` | `index --check --root ../..` | **1** | STALE — unchanged in shape |

**The count is 1100, not 1101** — correction 3 adds an assertion to an
existing body rather than a new body, so the body count does not move
while the mutant it kills does. Read the mutant table, not the total.

**The e2e red is the same one, re-measured rather than re-asserted**:
`brief.mjs --dispatch` to a FILE is **68747 bytes with `critical path:`
present**, to a PIPE **65536 — exactly one buffer — with it absent**.
Same `process.exit()` mechanism, still byte-identical to base, still
routed. The byte figure moved 69197 -> 68747 between measurements because
the live board moved, which is the point: the trigger is machine-scoped.

**GRAPH REGEN unchanged and still the integrator's**: `files +0 -0 ~2`,
`edges +2 -0` (`node:fs`, `node:path` only), symbols 2446 -> 2448.
**Still no `watcher-store.ts -> agent-store.ts` edge** — the corrections
are comments and a string, so the C-10/C-14 boundary is untouched.

**AND THE VERDICT'S RUNNER TRAP HIT THIS SEAT TOO, on the very run that
closed these corrections.** The background runner reported the final e2e
as *"completed (exit code 0)"* while the guarded script's own captured
`$?` held **1** — the third sighting, after the verifier's two. It cost
nothing here only because the script captures `$?` unpiped and the count
was read from the log. **Read the COUNT and the captured exit; a runner's
summary is not a gate verdict.**
