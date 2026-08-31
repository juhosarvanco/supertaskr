---
id: T-192
title: The shell store takes a latch and then awaits an unbounded command — `runIndexRepo` and `runPicker` have the same never-answers shape T-184 bounded in the agent store, and a command that never answers kills their button for the session
feature: F-03
milestone: 4
priority: 3
size: S
status: verifying
suggested_by: "executor claude-opus-5@subagent @T-184, found by that card's own class sweep — the class is named there and this is the sweep's non-empty result"
touches: [app-shell]
blocked_by: []
builder:
review:
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

| | `index_repo` | the three picker commands |
|---|---|---|
| Rust body | `spawn_blocking(run_index).await`, **no timeout anywhere**; `IndexOptions` carries no time field | `begin_pick` -> dialog -> `spawn_blocking(apply_*_folder)` |
| answers on a held latch | n/a — it has no Rust latch | `Busy` |
| answers on a dismissed dialog | n/a | `Cancelled` |
| answers on a **DROPPED** callback | n/a | `Cancelled` — `rx.recv().await` yields `None` when the sender goes |
| answers on an unusable selection | n/a | `Error` |
| answers on a panicking task | `Error` via `unwrap_or_else` | `Error` via `unwrap_or_else` |
| bounded sub-step | **none** | the re-arm, by `REARM_TIMEOUT` = 10 s (`docs_watch.rs`) |
| the one segment with no bound | **the whole command** | the dialog standing open — a HUMAN deciding |

So the picker answers on every path it has except the one where a person
is being asked a question, and the index answers on none.

**AND A BOUND ON THE PICKER WOULD MANUFACTURE THE FAILURE THIS CARD
EXISTS TO CLOSE.** It would fire while the folder dialog is still on
screen, tell the user the app did not answer when it is waiting for
THEM, and release the webview latch while Rust still holds its own — so
the next press reaches `begin_pick`, gets `Busy`, and
`reducePickOutcome` maps `busy` to `prev` **by identity**: a button that
silently does nothing, which is exactly the `T-171`/`T-183` family. The
decision is recorded at `runPicker`'s own site per criterion 4, and
pinned by a body so that adding a bound has to come past a test.

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

Swept every `await invoke(` site in `app/src` (7 hits, so the search is
shown capable of answering non-empty before its zero is recorded):

- **In fence, 3 latch-guarded sites, all now accounted for**:
  `runHandshake`'s `docs_snapshot` (already bounded by
  `STARTUP_DEADLINE_MS`, pre-existing), `runIndexRepo` (bounded by this
  card), `runPicker` (deliberately unbounded, recorded by this card).
  **The class is CLOSED inside `app-shell`.**
- **Out of fence, `app-agent`: EMPTY.** `refreshGenesisTranscript`,
  `genesisKickoff` and `refreshGenesisStatus` each open with only
  `if (!isTauri) return …` and take **no latch at all**, so a
  never-answering one strands nothing. `cancelGenesis` is unbounded by
  `T-184`'s own recorded decision ("nothing latches behind cancel").
  **No new card routed from the sweep.**

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
- **Nothing else.** The class sweep outside this fence is empty (see
  above), so no sibling card is owed.

### Each acceptance criterion, against its evidence

| # | criterion | met | evidence |
|---|---|---|---|
| 1 | a never-answering command SHALL NOT leave its latch held, proved with the command CONSTRUCTED | **yes, for `index_repo`** | `ipc.parked` returns a promise that is neither resolved nor rejected — nothing calls its `resolve` unless a body reaches for `ipc.release`. Body *"AN INDEX THAT NEVER ANSWERS SETTLES ANYWAY, and the button comes back"*: latch asserted **true** before, **false** after; killed by M2 alone. |
| 1 | — the same criterion applied to `runPicker` | **antecedent is FALSE** | This is a reading of the criterion, not a waiver: *"WHERE a shell-store command can never answer"*. The picker's Rust commands answer on **every** path — `Busy`, `Cancelled` (dismissed **or** dropped callback), `Error`, `Error` on a panicking task, with the re-arm bounded by `REARM_TIMEOUT`. Their one unbounded segment is a dialog a human has not answered yet, which is not "can never answer". Table above; recorded at the site and pinned by a body. |
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
