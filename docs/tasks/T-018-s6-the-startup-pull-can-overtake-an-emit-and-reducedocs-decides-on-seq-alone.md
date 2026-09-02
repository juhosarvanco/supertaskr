---
id: T-018-s6
title: The startup `docs_snapshot` pull can overtake a `docs-changed` emit and `reduceDocs` decides on `seq` alone, so the same older-read-wins overwrite T-018-s5 closed on the pick reply is still open on the emit path
feature: F-02
milestone: 4
size: S
priority: 3
status: verifying
suggested_by: executor claude-opus-5@subagent @T-018-s5
blocked_by: []
touches: [app/src/lib/watcher-store.ts, app/src/lib/docs-model.ts, app/test/watcher-store.test.ts, app/test/docs-model.test.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**Class parent: `T-018-s5`** (the ordinary pick's reply overwrote an emit
that overtook it) — same class, a different door, and this is the half
that card's fence could not reach. Filed as its SWEEP, not as a repeat:
T-018-s5 fenced `app/src/lib/watcher-store.ts` and its test alone, and
the decision this card is about lives one layer down in
`app/src/lib/docs-model.ts`.

## What the sweep found

T-018-s5 closed the overtake on the `"picked"` branch of
`reducePickOutcome` by asking `switchIsOvertaken`, which reads BOTH
stamps Rust sends: `seq` (drawn by `WatchState::next_seq` BEFORE the
collect, so it dates the START of a collection) and `generatedAtMs`
(stamped by `snapshot_from` from `now_ms()` AFTER the walk returns, so it
dates the reading itself). Every OTHER site that decides "is this payload
newer?" still reads `seq` alone:

- `reduceDocs` — `app/src/lib/watcher-store.ts`, `if (payload.seq <=
  prev.seq) return prev` — and its two remaining callers,
  `applyDocsPayload` (the `docs-changed` emit path) and
  `applyProjectStatus`'s `"open"` branch (the startup `docs_snapshot`
  pull).
- `applySnapshot` — `app/src/lib/docs-model.ts`, the same rule one layer
  down, which is where a fix would have to land to serve both.

**THE RESIDUAL IS NARROWER THAN T-018-s5's AND IT IS NOT EMPTY.** Two
`docs-changed` emits cannot overtake each other: `handle_fs_batch` draws
its seq, collects and sinks on ONE debouncer thread, so emits are
produced in order. But `docs_snapshot` runs on a command thread and takes
its seq from the same global counter (`project_status` ->
`build_snapshot(&root, state.next_seq())`), so the startup pull can draw
a seq AFTER an emit drew its own, finish its walk FIRST, and hand
`reduceDocs` a higher-seq older read that overwrites the emit's newer
tree — the T-018-s5 defect with the pick reply swapped for the pull. The
watcher-store comment at `commitPickOutcome` already reasons about this
race and concludes the seq guard settles it; that conclusion is the one
T-018-s5 measured to be false for the pick, and nothing about the pull
makes it truer.

## Why it was not built with T-018-s5

Out of that card's fence in two ways: `app/src/lib/docs-model.ts` is not
in its `touches`, and `reduceDocs`'s guard is the T-007 stale-drop
invariant that every emit, every startup pull and both switch branches
sit on — a change there is a wider blast radius than a size-S pick-branch
guard, and it deserves its own card and its own drills rather than
riding one.

## What a fix would have to answer

1. Whether the clock comparison belongs in `applySnapshot` (serving
   `reduceDocs` and therefore every caller at once) or stays at the
   call sites, given that `applySnapshot` is also the harness's entry
   point and a harness composes `generatedAtMs` freely.
2. What a payload with a `generatedAtMs` of 0 means — pre-T-042 fixtures
   and the dev harness both mint them — since an incoming 0 compares as
   older than everything and would be dropped by a naive `<`.
3. Whether the startup pull should simply stop competing: it exists to
   settle the subscribe-then-pull race, and a pull that ARRIVES stale is
   a different repair from a pull that is COMPARED correctly.

## What is deliberately NOT in this card

`reduceGenesisEvent` (`app/src/lib/agent-store.ts:378`) also returns
`prev` on `event.seq <= prev.seq`, and it is CORRECT as written: genesis
turn events carry no collection and no reading time, and one ordered
producer mints them, so `seq` is the only reading they have and the
"stamp dates the start of a collect" argument does not reach them. Named
here so the next sweep does not re-open it. The same goes for the
snapshot-less genesis arm's `Math.max(switched.seq, outcome.seq)`: no
collection produced it, so there is no content time to compare.

## TRIAGE, 2026-09-02 — promoted and dispatched, priority 3, at T-018-s5's merge (c8f69aa)

The architect seat. The same class T-018-s5 closed on the pick reply,
one emitter over: the startup `docs_snapshot` pull runs on a command
thread off the same counter and can overtake a `docs-changed` emit, and
`reduceDocs` decides on `seq` alone. Criteria: WHEN a pulled snapshot
carries a higher `seq` and an older content time than an emit already
applied for the same project THE reducer SHALL keep the emit, reusing
`switchIsOvertaken`'s decision rather than copying it; the sweep's other
seq-only readers (`applyDocsPayload`, `applyProjectStatus`'s open arm,
`applySnapshot` in docs-model.ts) SHALL each be ruled on the card —
guarded, or named correct with the reason; a positive control SHALL red
against the unguarded pull. Guard-class by consequence, `review:
independent`.

## Implementation notes

**2026-09-02, executor claude-opus-5@subagent, lane
`task/T-018-s6-startup-pull-overtake` at
`/Users/ujju/Projects/nputer-T-018-s6`, base
`838e74b87628f50595b029841caf37527b55b73d`, code commit `95bfb67`.**

### Understanding, confirmed before touching anything

`reduceDocs` admitted any payload whose `seq` exceeded the watermark,
and `seq` dates the START of a collection — `WatchState::next_seq` is
drawn before the collect while `snapshot_from` stamps
`generated_at_ms` after the walk returns. Two `docs-changed` emits
cannot disagree about that (one debouncer thread draws, collects and
sinks them in order), but `docs_snapshot` runs on a COMMAND thread off
the same global counter, so the pull can draw a seq AFTER an emit drew
its own, finish its walk FIRST, and hand `reduceDocs` a higher-seq
older read that overwrote the emit's newer tree and advanced the
watermark past it. The task was to make `reduceDocs` ask the same
question `switchIsOvertaken` asks by ROUTING BOTH THROUGH ONE
EXPRESSION rather than transcribing it, to rule each of the sweep's
other seq-only readers, and to pin it with a positive control built
from an explicitly non-monotone `generatedAtMs` pair, shown red against
the unguarded pull.

### What was written, and where

**`app/src/lib/watcher-store.ts`** —

- The rule is LIFTED out of `switchIsOvertaken` into a new
  module-private `readingIsOvertaken(prev, reading)`, placed in the
  pure-helpers block immediately above `reduceDocs`, carrying the whole
  of the doc comment that explains what "overtaken" means. Its body is
  T-018-s5's decision unchanged in shape, plus one new line:

      if (prev.projectDir !== reading.projectDir) return false;
      if (reading.seq <= prev.seq) return true;
      if (reading.generatedAtMs === null || reading.generatedAtMs === 0) return false;
      return reading.generatedAtMs < prev.generatedAtMs;

- `interface SwitchReading` is renamed `SnapshotReading` — it is no
  longer a switch's shape; a `DocsSnapshotPayload` IS one structurally,
  which is what lets an emit, the pull and a pick reply be asked the
  same question. It stays module-private.
- `switchIsOvertaken` keeps its name, its export and its signature and
  becomes the SWITCH'S ADAPTER: it reads the announced measurement off
  the outcome's two variants and returns `readingIsOvertaken(prev,
  reading)`. Nothing else about it moved.
- `reduceDocs` gains ONE line — `if (readingIsOvertaken(prev, payload))
  return prev;` — placed AFTER the existing `payload.seq <= prev.seq`
  line, which is unchanged and deliberately stays first. That order is
  load-bearing and the file says why: the seq line is the T-007
  stale-drop invariant and it must hold ACROSS projects, returning
  `prev` BY IDENTITY for a late delivery from the folder the user just
  left, which the predicate deliberately does not do for another folder
  (its first conjunct answers `false` there). Folding the two together
  would return the freshly-reset `base` instead of `prev`, and callers
  read that identity to skip a re-render and an echo.
- **NEW EXPORT SURFACE: ZERO.** `readingIsOvertaken` and
  `SnapshotReading` are both module-private; the only exported symbol
  that changed at all is `switchIsOvertaken`, whose signature is
  identical.
- The stale comment at `commitPickOutcome` — the one this card's body
  names — is CORRECTED IN PLACE rather than deleted. It concluded that
  a reordered pull is "dropped by `reduceDocs`'s SEQ guard"; the
  conclusion was right and the reason was false, for exactly the reason
  T-018-s5 measured one door over. The correction says so and names
  what drops it now.

**`app/test/watcher-store.test.ts`** — one new describe, *"T-018-s6: a
startup `docs_snapshot` pull that arrives AFTER an emit for the same
folder"*, with five bodies. It carries its OWN payload builder: the
file-wide `payload` helper stamps `generatedAtMs = 1_700_000_000_000 +
seq`, a MONOTONE function of the seq, so **the broken pair is
unrepresentable with it** — the two stamps have to be free to disagree,
and the fixture spells `EMIT_FINISHED = …_900` against `PULL_FINISHED
= …_500` to do it.

1. *KEEPS the emit's tree and does not advance the watermark past it* —
   the positive control: emit `seq 5 / gen …900 / 3 files` applied,
   then the pull `seq 6 / gen …500 / 2 files`. Asserts identity with
   `toBe`, `fileCount 3`, `seq 5`, and that the watermark still works
   in both directions afterwards.
2. *asks the SAME question the pick reply asks, of the same reading* —
   five corners, each asserting that `reduceDocs`'s identity return and
   `switchIsOvertaken`'s verdict are the SAME answer. This is the
   behavioural half of "reuse, not copy": a second spelling is free to
   drift, and this body is what notices (proved by drill M8).
3. *a genuinely newer pull still applies, and so does one that landed
   in the SAME millisecond* — the over-broad direction and the
   strict-`<` boundary.
4. *a pull with NO content time is decided on its seq* — the
   `generatedAtMs: 0` answer (question 2 below).
5. *a pull announcing a DIFFERENT folder is never an overtake* — the
   cross-project direction, plus a re-assertion that the T-007 stale
   drop still holds by identity across the switch.

**`app/test/docs-model.test.ts`** — one body,
*"applies a HIGHER-seq payload whose collection finished EARLIER — the
delivery race is not this layer's question"*, inside the existing
stale/duplicate describe, carrying the RULING on `applySnapshot` as a
comment so a later sweep meets the reason before it moves the guard
down.

**`docs/tasks/T-018-s7-…md`** — the routed suggestion (below).

### The ruling on every seq-only reader the sweep named

| reader | ruling |
|---|---|
| `reduceDocs` (`watcher-store.ts`) | **GUARDED.** This is the fix. |
| `applyDocsPayload` (`watcher-store.ts`) | **CORRECT AS WRITTEN — decision INHERITED.** It carries no ordering rule of its own: it calls `reduceDocs` and consumes the identity return (`if (next === shell.docs) return`, which precedes both the `setShell` and the `sendEcho`). Guarding `reduceDocs` guards it. |
| `applyProjectStatus`'s `"open"` arm (`watcher-store.ts`) | **CORRECT AS WRITTEN — decision INHERITED.** It calls `applyDocsPayload(status.snapshot)` and adds nothing. This IS the pull door this card is about, and it is closed by the line above rather than by a second guard here. |
| `applySnapshot` (`docs-model.ts`) | **CORRECT AS WRITTEN — NOT GUARDED, deliberately**, and pinned by its own body. It is the MODEL primitive (T-003): parse and fold. "Which producer read the tree last?" is a DELIVERY question and this layer has no producers. Three of its callers would be answered wrongly by a clock rule here: `reducePickOutcome`'s genesis branch calls it on the state `resetDocsForProjectSwitch` just wiped (`projectDir: ""`, `generatedAtMs: 0`), the dev harness and a dozen test files compose `generatedAtMs` freely because at this layer it has never been load-bearing, and `reduceDocs` would then ask the question twice — one per layer — which is the two-spellings failure the guard exists as ONE expression to avoid. |

**CHECKED AND RULED OUT OF CLASS** (so the next sweep does not re-open
them): `reduceGenesisEvent` (`agent-store.ts`) and the snapshot-less
genesis arm's `Math.max(switched.seq, outcome.seq)`, both already ruled
correct by T-018-s5 and unchanged here; and
`applyGenesisStatus` (`agent-store.ts`), found while sweeping
`docs_snapshot` references — it folds a genesis AGENT status, carries
no collection and no `generatedAtMs`, and already has its own T-184
flight guard, so it is not a seq-only docs reader at all.

### The card's three questions, answered

1. **Where the clock comparison belongs** — at `reduceDocs`, not
   `applySnapshot`; the table above is the reason in full.
2. **What a `generatedAtMs` of 0 means** — the same thing `null` means:
   NO COLLECTION PRODUCED THIS PAYLOAD, so it carries no reading time
   and the clock abstains, leaving the ordering stamp to decide.
   `snapshot_from` stamps `now_ms()`, which is never 0, and the project
   already reads a zero that way (`outcomeCarriesSnapshot`,
   `test/genesis-switch-truth.test.tsx`'s *"the `generatedAtMs: 0` tell
   is gone"*). Read naively by `<`, a zero compares as OLDER THAN
   EVERYTHING, so every harness and pre-T-042 payload would vanish
   behind any real reading already applied — the guard's own regression.
   Load-bearing and measured: drill M4.
3. **Whether the pull should stop competing** — NO, and this card does
   not make it. The pull exists to settle the subscribe-then-pull race
   and is held ONLY when an emit already delivered a LATER reading of
   the SAME folder, which is the one case where nothing is lost. Body 3
   is the assertion that it still applies otherwise.

### Commands, in the order run, each exit read UNPIPED from `$?`

| # | cwd | command | exit |
|---|---|---|---|
| 1 | `app/` | `npm ci` | 0 |
| 2 | `app/` | `npm run build` (BEFORE) | 0 |
| 3 | `app/` | `npm test` (BEFORE, @`838e74b`) | 0 — **50 files / 1135 bodies**; the fenced files 42 + 23 = 65 |
| 4 | `app/` | `npx vitest run test/watcher-store.test.ts test/docs-model.test.ts` (AFTER) | 0 — 47 + 24 = **71** |
| 5 | `app/` | `npm run build` (AFTER; `tsc` over `tsconfig.json` AND `tsconfig.test.json` — this lane's typecheck) | 0 |
| 6 | `app/` | `npm test` (AFTER, @`95bfb67`) | 0 — **50 files / 1141 bodies** |
| 7 | lane root | `git worktree add --detach <scratch>/drill-T-018-s6 95bfb67…` | 0 |
| 8 | drill `lib/parser/` | `npm ci`, `npm run build` | 0, 0 |
| 9 | drill `app/` | `npm ci`, `npm run build` | 0, 0 |
| 10 | drill `app/` | `npx vitest run test/watcher-store.test.ts test/docs-model.test.ts` (drill baseline) | 0 — 71/71 |
| 11 | drill | mutants M1–M8, below | as recorded |
| 12 | lane root | `git worktree remove --force <scratch>/drill-T-018-s6` | 0 |
| 13 | `tools/e2e/` | `npm ci` | 0 |
| 14 | lane root | `node tools/e2e/scripts/gate-run.mjs parser` | 0 — GREEN, **bodies=363, targets=1** |
| 15 | lane root | `node tools/e2e/scripts/gate-run.mjs app` | 0 — GREEN, **bodies=1141, targets=1** |
| 16 | lane root | `node tools/e2e/scripts/gate-run.mjs rust` | 0 — GREEN, **bodies=639, targets=18** |
| 17 | lane root | `NPUTER_E2E_PORT=15018 node tools/e2e/scripts/gate-run.mjs e2e` | 0 — GREEN, **bodies=575, targets=1** |
| 18 | — | `lsof -nP -iTCP:1420 -sTCP:LISTEN` | 1 — nothing listening |
| 19 | `tools/e2e/` | `NPUTER_BOOT_PORT=16018 npm run boot:check` | 0 |
| 20 | lane root | `git merge-tree --write-tree main HEAD` | 0 — no conflict |
| 21 | `app/src-tauri/` | `cargo run -q -p nputer-index -- index --check --root ../..` | **1 — STALE, by design; see gates** |
| 22 | `tools/e2e/` | `npm run capabilities:check` | 0 — **CURRENT (48201 bytes)**, unmoved |
| 23 | `tools/e2e/` | `node scripts/docs-gate.mjs` on the changed card paths | see gates |

All four gate-run verdicts carry
`ref=95bfb671ec6870fb10ea7ce8457f6a1ae3e6e4ee`. `boot:check` printed
both startup lines: `[nputer] project folder:
/Users/ujju/Projects/nputer-T-018-s6` and `[nputer] window "main"
created`.

### The drills — eight mutants, one side only, in a DETACHED worktree cut from `95bfb67`

Every mutation was applied by an exact-string mutator that REFUSES
unless its search text occurs exactly once, read back with `git diff`
before its run, and restored with `git restore --source=95bfb67…
--staged --worktree -- <path>` followed by a `shasum -a 256` of the
worktree file against `git show 95bfb67…:<path>`, with an empty PER-PATH
`git diff -- <path>` as the companion. The drill worktree carried its
own `node_modules` and its own `app/dist`, and was removed afterwards
(`git worktree list` re-read: the entry is gone).

| id | one-side mutation | site | bodies killed |
|---|---|---|---|
| M1 | `if (readingIsOvertaken(prev, payload)) return prev;` DELETED — **the unguarded pull** | source, `reduceDocs` | **2** — bodies 1 and 2 |
| M2 | the shared clock expression → `return false` | source, `readingIsOvertaken` | **3** — T-018-s5 bodies 1 and 2 (PICK path) **and** T-018-s6 body 1 (PULL path) |
| M3 | `if (prev.projectDir !== reading.projectDir) return false;` DELETED | source, `readingIsOvertaken` | 5 — T-064 ×2, T-018-s5 ×2, **T-018-s6 body 5** |
| M4 | the zero abstain narrowed to `=== null` only | source, `readingIsOvertaken` | 1 — **body 4**, exactly |
| M5 | **DATA mutant**: `PULL_FINISHED` moved to `1_700_000_001_000`, the fixture clock made monotone with seq | test data | 1 — **body 1** |
| M6 | the strict `<` on the clock → `<=` | source, `readingIsOvertaken` | 2 — T-018-s5 body 3 (PICK) **and** T-018-s6 body 3 (PULL) |
| M7 | the rule COPIED inline into `reduceDocs` instead of calling the predicate | source, `reduceDocs` | **0 — GREEN** |
| M8 | M7's copy **plus** M2's mutation of the now-unshared expression | source, both | 2 — T-018-s5 body 1 **and T-018-s6 body 2** |

**M1 IS THE CRITERION'S DEMONSTRATION AND IT WAS SEEN, NOT ASSERTED.**
Against the unguarded pull, body 1 fails with
`AssertionError: identity: nothing was rebuilt: expected { seq: 6, …(10) } to be { seq: 5, …(10) }`
— the base overwrote the emit's three-file tree with the pull's
two-file read and advanced the watermark to 6, which is the defect this
card names, measured.

**M2 IS THE COPY-VERSUS-REUSE PROOF, SETTLED THE WAY T-018-s5's
VERIFIER SETTLED IT.** ONE mutation to the ONE shared expression kills
bodies on the PICK path and the PULL path in the same run. A single
mutation cannot do that unless both paths route through that
expression. M3 (five kills across all THREE doors — genesis, pick,
pull) and M6 (two kills, one per path) corroborate independently, and
so does the graph: `index --check` reports two new `call` edges into one
symbol, `reduceDocs -> readingIsOvertaken` and `switchIsOvertaken ->
readingIsOvertaken`.

**M5 IS THE DATA MUTANT THIS PROPERTY NEEDS**, and the dispatch brief
predicted it would be the discriminating one. The property under test
is that the two stamps CAN disagree, and that lives in the FIXTURE's
numbers: with the clock made monotone in seq — exactly what the
file-wide helper does — the pull becomes genuinely newer, the guard
correctly declines to fire, and body 1 stops measuring an overtake. A
code-only drill would have mis-graded it by construction.

**M7 IS A DRILL THAT COULD NOT RED, AND M8 IS WHY THAT IS NOT THE END
OF IT.** A byte-equivalent copy of the rule is observationally
identical to a call, so no behavioural body can separate them — the
same finding T-018-s5 recorded, reproduced. **But M8 shows the copy is
caught the moment it DRIFTS**: with the rule copied and the (now
unshared) expression mutated, body 1 SURVIVES where M2 killed it — the
pull path no longer routes through the mutation — and **body 2, the
agreement body, REDS**, because the two paths have answered differently
about one reading. So criterion 2 is enforced structurally by the diff
AND behaviourally against drift, which is one more than T-018-s5 could
claim.

**KILL-SET CONTAINMENT, PER BODY** (verifier.md 2b — the sets are of
MUTANTS, and no two of them nest): body 1 `{M1, M2, M5}`, body 2 `{M1,
M8}`, body 3 `{M6}`, body 4 `{M4}`, body 5 `{M3}`, docs-model body
`{}`. Bodies 3, 4 and 5 are separated by construction (disjoint
singletons). Body 1 and body 2 share M1 and each holds a mutant the
other does not (M2/M5 against M8), so neither contains the other. Every
kill landed at the site the property lives — `readingIsOvertaken`,
`reduceDocs`, or the fixture — and each was read from vitest's own
failure list rather than from a mutator's report.

**THE docs-model BODY HAS AN EMPTY KILL SET AGAINST THIS SET, AND THAT
IS WHAT IT IS FOR.** It is a RULING made mechanical, not a guard: it
pins that `applySnapshot` still decides on `seq` alone, so it reds
against a FUTURE change that moves the clock rule down a layer, and no
mutant of the guard as built can touch it. Named here rather than
dressed up as a kill.

**TWO FULL-SUITE RUNS UNDER MUTATION REPORTED AN EXTRA FAILURE THAT WAS
NOT A KILL.** `shell-harness.test.ts > is not stale: the build is at
least as new as the store` compares `app/dist`'s mtime against the
store's, so mutating a source file after the build necessarily reds it
— the mechanical artifact CONVENTIONS' *"build, baseline, then
mutate"* clause exists for, not a body any guard's absence killed. The
per-file drill runs in the table above are free of it.

### Standing gates, derived on the MERGE FORECAST

`git merge-tree --write-tree main HEAD` → exit **0** (no conflict),
then `git diff --name-only main <tree>`. Derived against the tree this
lane's TIP will have — the three code paths plus the two card paths
this notes commit adds — so the answers do not move when it lands.
**The integration branch advanced during this lane**: it was
`838e74b` at dispatch and `fb55a9f` when the forecast was taken; the
forecast is against `fb55a9f` and merged clean.

- **GRAPH REGEN — FIRES.** The forecast diff touches `*.ts` outside
  `docs/`. `index --check` at `95bfb67` exits **1 / STALE**, and its
  delta is exactly this change and nothing else: `files +0 -0 ~3`
  (`watcher-store.ts` loc 1534→1611, symbols 57→58;
  `watcher-store.test.ts` loc 739→885; `docs-model.test.ts` loc
  324→371), `edges +5 -1`, committed 2503 symbols / 2391 edges → fresh
  2504 / 2395. The one removed edge is the `SwitchReading` →
  `SnapshotReading` rename; two of the five added are the shared-call
  edges named above. **Regeneration is the integrator's**, in the merge
  commit.
- **BOOT GATE — FIRES** (the diff touches `app/src/**`). Run in-lane:
  exit **0**, both `[nputer]` lines above.
- **DOCS GATE — FIRES.** The forecast diff touches two paths under
  `docs/tasks/`, which the parser's own suite and the e2e board bodies
  read. `gate-run parser` (363) and `gate-run e2e` (575) were both
  GREEN at `95bfb67`; the card writes came after, so `docs-gate.mjs`
  was run over them directly and the integrator re-derives.
- **METHOD EVAL GATE — NOT OWED.** The forecast diff touches no
  `method/**` path.
- **CAPABILITIES — NOT MOVED.** `capabilities:check` is CURRENT at
  48201 bytes: no e2e spec name changed, so the census is untouched.
- AUDIT GATE and THE BLESSED GATE declare no merge-diff trigger and are
  therefore not in this set.

### For the verifier

- The positive control's arming and the subject's are **not decided by
  one arrangement**: the guard is in `app/src/lib/watcher-store.ts` and
  the pair that exercises it is a fixture in the test file, and M5
  damages the fixture alone to prove that.
- **THE ONE PROPERTY ASSERTED BY INHERITANCE RATHER THAN DRIVEN**: a
  dropped pull emits no `model-updated`. It follows from the identity
  return plus `applyDocsPayload`'s `if (next === shell.docs) return`,
  which precedes both `setShell` and `sendEcho`; the bodies assert the
  identity with `toBe`, which is the exact condition that early return
  tests. Driving the echo itself needs a jsdom body mocking the Tauri
  boundary, which exists only in `app/test/startup-recovery.test.ts` —
  **outside this fence**. Routed as `T-018-s7` rather than reached for
  by converting a 47-body node-environment file to jsdom.
- **THE GUARD IS ON THE PULL PATH, NOT ON "STARTUP".** `docs_snapshot`
  has exactly one landing site (`runHandshake`), and every
  `DocsSnapshotPayload` that reaches the store passes through
  `applyDocsPayload` (the emit listener, the status pull, the dev
  harness) or `reducePickOutcome` — all four route through
  `readingIsOvertaken`. So the second door, `commitPickOutcome`
  re-running `startDocsWatcher()` after a pick when the prior attempt
  failed at `subscribe`, is covered by construction rather than by a
  condition that could miss it. That is also the site whose comment
  this card corrected.
- The `<` on the clock stays STRICT, for T-018-s5's reason and its
  measurement: `test/shell-harness.test.ts`'s *"keeps genesis when docs
  land under it"* stamps `generatedAtMs: 1` on every payload. M6 is the
  drill on that boundary.

### ADDENDUM, same day — the e2e battery re-run after the card writes, and the two reds it found

The DOCS GATE fires on this lane's two card paths, so the three suites
`docs-gate.mjs` names were re-run at the tip `ad8a5df`:
`gate-run parser` **0 — GREEN, bodies=363**, `gate-run app` **0 —
GREEN, bodies=1141**, `gate-run e2e` **1 — RED, bodies=575** (573
passed, 2 failed).

**BOTH REDS ARE ONE CAUSE AND IT IS NOT THIS LANE'S**, named and
measured rather than argued:

    tests/session-economics.spec.ts:179  the recommended seat is a function of the CARD…
    tests/session-economics.spec.ts:365  the advisory line is NOT a contract row…

Each fails on `expect(<brief.mjs exit>).toBe(0)` with one stderr:

    T-229-s6 holds a worktree on refs/heads/task/T-229-s6-eval-fixture-writable
    and no live card declares that id

`brief.mjs` joins a MACHINE-scoped list (the host's live worktrees) to a
CHECKOUT-scoped one (the cards in the tree it is run from). `T-229-s6`
is a SIBLING LANE cut after this one; its card is on `main` and is
absent from every checkout cut before it landed —
`git ls-tree -r --name-only 838e74b -- docs/tasks/ | grep -c T-229-s6`
is **0** at this lane's base and **0** at its tip, against **1** on
`main`. So the join fails for every older lane the moment a newer lane
is cut, which is the failure class `method/lane-protocol.md` rule 4
names in its own words and which the head of `main` (`e67cb44`) was
already repairing.

**MEASURED IN A PRISTINE BENCH, NOT INFERRED.** A detached worktree cut
at this lane's own base `838e74b`, carrying NONE of this lane's work,
was installed (`tools/e2e` `npm ci`, exit 0) and run:
`node tools/e2e/scripts/brief.mjs --task T-018-s6` exits **1** with the
byte-identical `T-229-s6` stderr. The bench's tracked-file status was
empty when it was removed (`git worktree remove --force`, exit 0; the
entry is gone from `git worktree list`). Corroborating: the only
in-tree change between the GREEN e2e run at `95bfb67` and the RED one
at `ad8a5df` is this card and `T-018-s7` —
`git diff --name-only 95bfb67 ad8a5df` returns exactly those two paths,
and neither is read for lane identity.

**THE MERGE FORECAST, RE-DERIVED AT THE TIP.** `main` advanced twice
during this lane (`838e74b` at dispatch, `fb55a9f`, then `fafb6a7`).
`git merge-tree --write-tree main HEAD` → exit **0**, no conflict;
`git diff --name-only main <tree>` returns exactly **5 paths** — the
three fenced code paths and the two cards. The gate set above is
derived on those five and does not move: GRAPH REGEN fires (3 `.ts`
outside `docs/`), BOOT GATE fires (`app/src/**`), DOCS GATE fires (2
`docs/` paths, `docs-gate.mjs` exit 1 naming both), METHOD EVAL GATE
not owed (0 `method/**` paths).

## VERDICT

**APPROVED** — 2026-09-02, verifier seat `claude-opus-5@subagent`
(V-T-018-s6), judging tip `35e7d2e9bc9438282ea5191b043c4a6f076dad3a`
(code commit `95bfb67`) against base
`838e74b87628f50595b029841caf37527b55b73d`, from the detached bench
`/Users/ujju/Projects/nputer-V-T-018-s6`. Ports 25018 / 26018; 1420
probed read-only and never bound.

### The blindness was CLOCK-SHAPED, and the seal is checkable

Phase 1 reached this seat before the work existed: at the moment this
pass began the lane's worktree stood at `838e74b`, the base, so there
was no diff to decline to read. The attack set and the ground truth
were WRITTEN AND HASHED before phase 2 opened, and the hashes are the
audit:

| file | sha256 |
| --- | --- |
| `attack-V-T-018-s6.md` | `305a6b8a71115b1a92d2f58b43dcac5187e341b22e89eaa5f668b570de8a075f` |
| `ground-V-T-018-s6.md` | `2d90235f6845360c097c3a33c35330c4d9de1fe841226846639252ed29f6833f` |
| `stamps-V-T-018-s6.txt` | `d9d8c5df1c404de9bd069658fd7ab7219b4ba720bdc02df9bac329193e9ab2f4` |

Sealed **2026-09-02T05:08:41Z**. The dispatching message for phase 2
carried the executor's own mutant numbers and suite figures — after the
line, and every one of them is re-measured below rather than relayed.
A discipline component remains and is disclosed: the lane's worktree
path and branch name were visible in `git worktree list` at phase-1
orientation, and were not followed.

### The defect, reproduced at the base and closed at the tip

Ground truth measured the runner's interleaving BEFORE the diff existed
— emit `seq 5 / generatedAtMs 1_700_000_000_900 / 3 files` already
applied, pull `seq 6 / 1_700_000_000_500 / 2 files`, same folder:

| | base `838e74b` | tip `35e7d2e` |
| --- | --- | --- |
| `reduceDocs` pure | `identity=false fileCount=2 seq=6` | `identity=true fileCount=3 seq=5` |
| through the SHIPPED store (jsdom, real `startDocsWatcher`, `listen` handler fired from inside the mocked `invoke("docs_snapshot")`) | `phase=open fileCount=2 seq=6`, **two** `model-updated` echoes (seqs 5 and 6) | `phase=open fileCount=3 seq=5`, **exactly one** echo (seq 5) |

The end-to-end half is the one that matters and it was run in this
bench, not argued: the pull's open arm still moves the screen, the
emit's tree survives, the watermark holds at 5, and the duplicate echo
is gone. The card's premise was independently checked against
`docs_watch.rs` (`project_status` -> `build_snapshot(&root,
state.next_seq())` at :974-990 draws the seq BEFORE the collect;
`snapshot_from` at :954-965 stamps `now_ms()` AFTER it) and is TRUE as
written. No assertion on this card measured false.

### The drills, re-run by this seat, kill sets read from `git diff`

Each mutant's landing was read from `git diff`, never from the report of
the edit. Run over `test/watcher-store.test.ts test/docs-model.test.ts`
(71 bodies at the tip).

| mutant | landing | kill set |
| --- | --- | --- |
| **M1** the ONE clock expression -> `return false` | `readingIsOvertaken`, `- return reading.generatedAtMs < prev.generatedAtMs;` | **3** — T-018-s5 *predicate*, T-018-s5 *KEEPS*, **T-018-s6 *KEEPS*** |
| **M2** the seq half -> `if (false)` | same function, one line up | **4** — T-064 *predicate*, T-064 *snapshot-less*, T-018-s5 *predicate*, **T-018-s6 *agreement*** |
| **M3** the pull guard REMOVED, the pick's left armed | `- if (readingIsOvertaken(prev, payload)) return prev;` | **2** — T-018-s6 *KEEPS* (`expected { seq: 6 } to be { seq: 5 }`), T-018-s6 *agreement* (`expected false to be true`) |
| **M4** DATA mutant, `PULL_FINISHED` -> `1_700_000_001_500` (monotone pair), source untouched | fixture only | **1** — T-018-s6 *KEEPS*, exactly |
| **M5** the zero abstain narrowed to `=== null` | `readingIsOvertaken` | **1 in the fenced files** — T-018-s6 *no content time*; whole-suite run confirms nothing else depends on it |

**M1 IS THE COPY/REUSE DETECTOR AND IT ANSWERS REUSE.** One mutation of
one expression kills PICK bodies and a PULL body in the same run. Had
the pull carried its own spelling, the pull body would have survived it.
The graph agrees independently: `index --check` names the new edges
`reduceDocs -> readingIsOvertaken (call)` and `switchIsOvertaken ->
SnapshotReading (type_ref)` and no second comparison symbol anywhere.

**KILL-SET CONTAINMENT HOLDS, NEITHER WAY** (verifier.md 2b): M1 kills
the two *KEEPS* bodies M2 does not; M2 kills the two T-064 bodies and
the *agreement* body M1 does not. So the two new load-bearing bodies are
not restatements of the T-007 seq guard — *KEEPS* dies to the clock and
survives the seq, *agreement* dies to the seq and survives the clock.
That the *agreement* body survives M1 is correct rather than weak: its
job is to catch DRIFT between two spellings, and a mutation of the one
shared expression moves both sides together.

**M3 IS THE ARMING-DIFFERS DEMONSTRATION, AND THE ARRANGEMENT REALLY
DOES DIFFER** — the pick path stays guarded while the pull path is
returned to the base's condition, so one act does not decide both sides.
Both controls red there, with the exact expected/actual the defect
produces. **M4 is the data mutant the rule demands where the property
lives in a fixture**: the pair's DISAGREEMENT is the property, and a
control built from the file-wide `payload` helper (`generatedAtMs =
1_700_000_000_000 + seq`, monotone) could not have expressed it at all.

**THE CONTROL THIS SEAT PROPOSED, AND THE DEMONSTRATION IT OWED.** The
body asked for in phase 1 — assert `prev.fileCount === 3` first (shape
TEN), then identity, `fileCount 3`, `seq 5` — was run against the
UNGUARDED base and SEEN to fail before it was ever asked for. Sixteen
further independent bodies with this seat's own fixtures were written
and run at the tip and all pass: fresh open from `emptyState`, a
genuinely newer pull, the same-millisecond boundary, the zero clock, the
cross-project direction with no ghost and with the T-007 stale drop
still holding by identity afterwards, two ordered emits, `applySnapshot`
still seq-only, and the genesis arm's reset base.

### The four seq-only readers, checked rather than accepted

`applySnapshot`'s ruling of CORRECT AS WRITTEN was verified by
enumerating its callers on the tip rather than by reading the claim:
`reduceDocs` (now guarded) and `reducePickOutcome`'s genesis arm (guarded
by `switchIsOvertaken`, and applying onto `resetDocsForProjectSwitch`'s
state whose `generatedAtMs` is 0, so a clock rule there would be a no-op
anyway). The reason holds. `applyDocsPayload` and `applyProjectStatus`'s
open arm add no ordering rule and inherit — confirmed end to end by the
echo measurement above, which drives the real `applyProjectStatus ->
applyDocsPayload -> reduceDocs` chain. The seq line stays FIRST in
`reduceDocs`, which is what keeps the T-007 stale drop working ACROSS
projects where the predicate deliberately answers `false`.

### Suites and gates, measured in this bench

| gate | base `838e74b` | tip `35e7d2e` |
| --- | --- | --- |
| `npm test` from `app/` | 50 files / **1135** | 50 files / **1141** (+6: 5 + 1) |
| the two fenced files | 42 + 23 = **65** | 47 + 24 = **71** |
| `npx vitest run` from `lib/parser/` | — | **363 passed**, `tsc --noEmit` exit 0 |
| `npm run build` from `app/` | 0 | **0** |
| `npm test` from `tools/e2e/` (port 25018) | — | **572 passed / 3 failed** — see attribution |
| `npm run typecheck` from `tools/e2e/` | — | **0** |
| BOOT GATE, `NPUTER_BOOT_PORT=26018` | 0 | **0**, both `[nputer]` lines |
| `capabilities:check` | 0, CURRENT 48201 | **0, CURRENT 48201** |
| `lint:tokens` | 0, clean | **0, clean** (CONTROL 1149 -> 1150, the new card) |
| `index --check --root ../..` | 0, CURRENT | **1, STALE — expected** |

**THE STALE GRAPH IS NOT A DEFECT AND WAS PRE-COMMITTED AS SUCH IN PHASE
1.** GRAPH REGEN is the integrator's at the merge (CONVENTIONS:984-991);
the second line reads real counts rather than `committed: MISSING`, so
it is not the `--root` false red, and the movement is exactly this
change: `files +0 -0 ~3` naming the three fenced paths, `edges +5 -1`,
`symbols 2503 -> 2504`.

**THE THREE E2E REDS ARE NOT THIS LANE'S, ATTRIBUTED BY NAME AT THE BASE
RATHER THAN BY COUNT** (docs/STATE.md's `guard-surface-behind` hazard).
The same three bodies — `lane-lock.spec.ts:899`,
`session-economics.spec.ts:179`, `session-economics.spec.ts:365` — were
re-run in this bench AT `838e74b`, where this diff does not exist, and
failed identically, for two causes that name other lanes and this
machine: *"STALE [guard-surface-behind] the judged checkout … is at
838e74b…, which does NOT contain 7129d90… — 15 commit(s) behind main"*,
and *"T-229-s6 holds a worktree on
refs/heads/task/T-229-s6-eval-fixture-writable and no live card declares
that id"*. This diff touches no file under `tools/e2e/` or `method/`.
**The relayed figure was 573/2 and this bench measured 572/3, and the
discrepancy is itself the reason the rule says NAMES:** the third body
reds as a function of how far the running checkout is behind `main`, and
`main` moved during this pass (`fd103b0` as relayed, `fb2a944` as the
sweep read it). A count is a moving target here; the names are not.

### Security sweep (verifier.md 3)

No new input path — the payload shape is unchanged. **New export surface
zero**, verified: no `export` line added or removed in `app/src`;
`readingIsOvertaken` and `SnapshotReading` are module-private. No
`Date.now`, `performance`, `window`, `localStorage`, `fetch`,
`innerHTML`, `eval`, `require`, `process.env` or dynamic `import` in the
added lines — the reducers stay pure, so the guard compares the payload's
own stamp against the held one and never a wall clock. No dependency,
lockfile or config change; `git diff --name-only` returns exactly the
three fenced code paths and the two cards, and `docs-model.ts` is
untouched by design. Hostile clocks probed: `NaN` applies (`NaN < x` is
false — honest abstention), `Infinity` applies, a NEGATIVE clock drops.
Nothing wedges, nothing allocates unboundedly. No finding.

### Findings — recorded, none blocking

1. **A measured behaviour delta on the PICK path that the card does not
   say out loud.** An exhaustive base-vs-tip corner sweep (run in this
   bench by importing the base copy of the store beside the tip's) found
   three differences. Two are the fix and its stated consequences. The
   third: `switchIsOvertaken(prev, { kind: "picked", snapshot })` with
   `generatedAtMs: 0` answered **true** at the base and answers **false**
   at the tip, because the zero abstain is now shared. It is unreachable
   in production — a `picked` reply always carries a `build_snapshot`
   whose `generated_at_ms` is `now_ms()`, never 0 — it is consistent with
   this project's own reading of a zero (`outcomeCarriesSnapshot`,
   `genesis-switch-truth.test.tsx`), and it makes the two paths agree,
   which is this card's goal. It is nonetheless a change on a path
   outside the card's criteria, and the card presents the abstain purely
   as the pull's question 2. Disclosure, not a defect; the *agreement*
   body's five corners do not include the zero case, which is where a
   future drift here would go unnoticed.
2. **A negative `generatedAtMs` is treated as older than everything and
   dropped.** Unreachable from Rust (`u64`), harness-reachable. Consistent
   with the rule as written; noted so a later sweep does not read it as
   an oversight.
3. `docs-gate.mjs` FIRES on the two card paths (exit 1, "2 path(s) under
   docs/ are code inputs") and names three owed suites — app, tools/e2e,
   lib/parser. All three were run above, which satisfies it.

None of these meets any of the ten rejection criteria sealed in phase 1,
and every one of those ten was tested rather than waived.

### The gates this verdict's OWN commit could move

This verdict is a write under `docs/`, so it re-enters the docs gate's
owed set on the same path. Re-run AT THIS SEAT'S OWN TIP after the
commit: the card-frontmatter half, `lib/parser`'s live-docs smoke test,
and the board-reading suites. Figures above carry the ref they were
measured at.

**RE-RUN AT THIS SEAT'S OWN TIP, and one red that was this seat's own.**
`docs-gate.mjs` on this card: *every live task card's frontmatter parses,
with a legal status* and *governing-document budgets hold* — the verdict
did not break the board. `npx vitest run` from `lib/parser/`: **363
passed** (its smoke test parses this repository's live `docs/`, so it is
the body a malformed verdict would red). The four card-reading e2e specs
the gate names — `landing-gate`, `push-checks`, `shell-frame`,
`window-contract` — **46 passed**, exit 0. `npm test` from `app/` first
answered **1 failed / 1140**, and the failure was MINE rather than the
lane's or the verdict's: `shell-harness.test.ts`'s *"is not stale: the
build is at least as new as the store"* compares `dist/` against
`src/lib/watcher-store.ts` by mtime, and this seat's own mutation drills
had restored that file after the last build. It is a guard doing exactly
its job. `npm run build` then `npm test`: **50 files / 1141 passed**,
exit 0, at verdict tip. Recorded rather than quietly rebuilt away,
because a figure without its cause is the next reader's hour.
