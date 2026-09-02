---
id: T-018-s5
title: The ordinary pick's reply OVERWRITES an emit that overtook it — `genesisSwitchIsOvertaken` guards the genesis branch and the `picked` branch has no guard at all
feature: F-02
milestone: 4
priority: 2
size: S
status: verifying
blocked_by: []
touches: [app/src/lib/watcher-store.ts, app/test/watcher-store.test.ts]
suggested_by: executor claude-opus-5@subagent @T-018-s2
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
review: independent
---

`reducePickOutcome`'s `"genesis"` branch asks
`genesisSwitchIsOvertaken(prev.docs, outcome)` before it applies the
switch, because an emit for the new root can reach the webview ahead of
the invoke reply and that emit is the LATER reading. Its `"picked"`
branch — the ordinary pick, the one the front door's folder picker
actually runs — asks nothing: it calls
`reduceDocs(prev.docs, outcome.snapshot)` unconditionally, and
`reduceDocs` applies any payload whose `seq` exceeds the watermark. So
an overtaking emit at a LOWER seq carrying NEWER bytes is applied first,
and the reply's own snapshot at a HIGHER seq carrying OLDER bytes then
overwrites it and advances the watermark past it. The newer tree is not
merely re-ordered; it is discarded until the next fs event under that
folder.

**WHY THIS WAS INVISIBLE, AND WHAT MADE IT VISIBLE.** The overtake is
DESIGNED on both paths and this repository already says so twice: on the
Rust side by
`the_watch_is_armed_before_the_switch_commits_so_an_emit_can_overtake_the_reply`,
and on the frontend by the existence of `genesisSwitchIsOvertaken`. What
hid the ordinary path was
`docs_watch::tests::picker_rearms_the_watcher_onto_the_new_root`, whose
`from_b.seq > picked.seq` asserted flat that a post-re-arm emit never
outranks-downward — i.e. that the overtake cannot happen here. It CAN,
and ubuntu-24.04 demonstrated it three times on docs-only diffs (CI runs
`33304351040` and `33566291111`, plus a sighting on `2e4b76f`; read them
with `--attempt 1`, each run having been re-run green). The Rust body's
own transcript is the reproduction: `docs-changed: seq=5` printed AFTER
`project folder picked: <B>`, carrying bytes written after the pick
returned. T-018-s2 narrowed that assertion to what the watcher actually
promises and left the overtake legal — which is what exposes this branch
rather than papering over it.

**THE MECHANISM, IN THE TWO PLACES IT LIVES.** `WatchState::next_seq`
draws before the collect on every path, so a stamp dates the START of a
collection and never its content; and `open_as_project` arms the new
root (the `Rearm` rendezvous) BEFORE it commits and stamps, exactly as
`apply_genesis_folder` does. Those two facts together are what make an
overtake possible, and they are identical on the two branches — so a
guard on only one of them is an asymmetry with no argument behind it.

## Acceptance criteria

1. WHEN a `picked` outcome's snapshot is not newer than the model the
   store already holds for that same `projectDir`, THE STORE SHALL keep
   the model it has and SHALL NOT move the watermark backwards — the
   shape `genesisSwitchIsOvertaken` already implements, applied to the
   `"picked"` branch.
2. THE FIX SHALL be one predicate serving both branches, or SHALL state
   in the file why the two cases differ; two spellings of one rule is
   the T-057 failure this project names by number.
3. THE BODY THAT PINS IT SHALL be shown RED against a store lacking the
   guard, with that demonstration recorded (`method/roles/verifier.md`
   step 2b), and SHALL drive the reducer with a real overtaking pair —
   a lower-seq snapshot applied first, then the reply's higher-seq
   older one — rather than asserting on a hand-built state.

**OUT OF T-018-s2's FENCE, WHICH IS WHY THIS IS A CARD AND NOT A
COMMIT.** That lane's fence was the watcher's one Rust file alone; the
defect and its test both live in the frontend store this card fences.
(Reworded at dispatch: the preflight read the other lane's fence path,
spelled here as a path, as a criterion path this fence does not cover.)

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 2

The architect seat, at the stamp of T-018-s2's merge (ba764b2). A
product defect on the front door's own path, verified in the file by
the T-018-s2 verifier independently of the lane that filed it
(watcher-store.ts :550/:606 guard the genesis branch; :586 guards
nothing). Criteria: WHEN a `picked` reply carries a snapshot whose `seq`
is lower than an emit already applied for the same root THE reducer
SHALL keep the emit and SHALL NOT move the watermark backwards or
overwrite newer bytes with older; a positive control SHALL replay the
runner's own interleaving (emit seq 5 before reply seq ≥6 carrying the
older read) and red under the unguarded branch; the genesis guard SHALL
be reused, not copied. Guard-class by consequence (data loss on the
front door): `review: independent`.

### CORRECTION to the TRIAGE criteria, 2026-09-02 — the architect seat's own, relayed at dispatch and confirmed in the tree

**THE `WHEN` CLAUSE ABOVE NAMES THE ALREADY-SAFE PAIR AND IS LEFT
STANDING SO BOTH READINGS ARE VISIBLE.** *"a `picked` reply carries a
snapshot whose `seq` is lower than an emit already applied"* describes an
interleaving `reduceDocs` ALREADY handles: its first line is `if
(payload.seq <= prev.seq) return prev`, so a lower-seq reply is dropped
by identity at the base and no body built on that order can red. The
error is the dispatching (architect) seat's, disclosed by that seat
mid-lane and recorded here rather than edited away.

**WHAT THE CARD ASKS FOR IS ITS BODY AND ITS POSITIVE-CONTROL CLAUSE**,
which are right and which this lane built to: the reply's **HIGHER**-seq
**OLDER** snapshot (criterion 3 — *"a lower-seq snapshot applied first,
then the reply's higher-seq older one"*). That is also why *"reuse the
genesis guard"* cannot mean transcribing it: `same projectDir &&
snapshot.seq <= prev.seq` is a STRICT SUBSET of `reduceDocs`'s own first
line, so applied verbatim to the `"picked"` branch it is dead code and a
card satisfied word-by-word by that change does nothing. Reuse means
reusing the guard's DECISION — same project, and the announced reading is
not LATER than the one applied — keyed on the reading's own content time,
`generatedAtMs`, which is the stamp `seq` is not.

## Implementation notes

**2026-09-02, executor claude-opus-5@subagent, lane
`task/T-018-s5-picked-reply-overtake-guard` at
`/Users/ujju/Projects/nputer-T-018-s5`, base
`43e0fe8bddefc80d029b39d7007ca34ef8e3903a`.**

### Understanding, confirmed before touching anything

`reducePickOutcome`'s `"genesis"` branch asked
`genesisSwitchIsOvertaken` before applying a switch and its `"picked"`
branch asked nothing, handing the reply straight to `reduceDocs`, which
applies any payload whose `seq` exceeds the watermark. Because
`WatchState::next_seq` draws BEFORE the collect on every path while
`snapshot_from` stamps `generated_at_ms` AFTER the walk returns, an emit
can carry a LOWER seq with NEWER bytes while the pick's reply carries a
HIGHER seq with an OLDER read — so the reply overwrote the emit that
overtook it and advanced the watermark past it. The task was to build one
predicate serving both branches, keyed on the reading rather than the
ordering stamp alone, and to pin it with a body driven through the real
reducers by a genuine overtaking pair, shown RED against the unguarded
branch.

### What was written, and where

**`app/src/lib/watcher-store.ts`** —

- `genesisSwitchIsOvertaken` is renamed **`switchIsOvertaken`** and now
  takes `Extract<PickOutcomePayload, { kind: "picked" } | { kind:
  "genesis" }>`. It reads the announced measurement into one internal
  `SwitchReading` shape (`projectDir`, `seq`, `generatedAtMs | null`) —
  the ONLY thing that differs between the branches, because a `picked`
  reply always carries a snapshot and a genesis switch onto a folder with
  no `docs/` yet carries none — and then decides in one place:

      if (prev.projectDir !== reading.projectDir) return false;
      if (reading.seq <= prev.seq) return true;
      return reading.generatedAtMs !== null &&
             reading.generatedAtMs < prev.generatedAtMs;

  Criterion 2 is met by construction: one exported predicate, one call
  site per branch, no second spelling. The old name is gone rather than
  kept as a wrapper.
- The `"picked"` branch now reads
  `docs: switchIsOvertaken(prev.docs, outcome) ? prev.docs :
  reduceDocs(prev.docs, outcome.snapshot)`. The phase still moves to
  `open` and the notices still clear — this is a switch and the screen is
  what the switch is for; only the model is held. The identity return
  also suppresses the duplicate `model-updated` echo, because
  `commitPickOutcome` echoes on `next.docs !== before.docs` and the emit
  already echoed the model it produced.
- The `"genesis"` branch calls the same predicate; its behaviour is
  unchanged for every reading whose clock agrees with its seq, and is
  strengthened along its own stated principle ("THE LATER READING WINS")
  for one that does not.
- **THE `<` ON THE CLOCK IS STRICT** and the reason is written in the
  file: two collections finishing inside one millisecond are not ordered
  by their clock, so the seq stamp decides and the reading applies. A
  non-strict `<=` reds `test/shell-harness.test.ts`'s *"keeps genesis
  when docs land under it"*, whose fixture stamps `generatedAtMs: 1` on
  every payload — measured, not predicted.
- The wall-clock residual is stated in the file rather than left to be
  found: a backwards clock step can make a genuinely newer reading look
  older and hold a pick's tree back until the next fs event under that
  folder — the same window the unguarded branch left open on EVERY
  overtake, entered far more rarely and bounded by the same recovery.

**`app/test/watcher-store.test.ts`** — the four references to the old
name renamed, and one new describe, `T-018-s5: an ordinary pick whose
reply arrives AFTER an emit for the same folder`, with four bodies. It
carries its OWN payload builder: the file-wide `payload` helper sets
`generatedAtMs = 1_700_000_000_000 + seq`, a monotone function of seq, so
**the broken pair is unrepresentable with it** — the two stamps have to
be free to disagree, and the fixture spells `EMIT_FINISHED
= …_900` against `REPLY_FINISHED = …_500` to do it.

1. *the PREDICATE reads a `picked` reply's OWN snapshot, both conjuncts*
   — five corners: higher-seq-older-read (true), lower seq (true), equal
   seq (true), genuinely newer (false), different folder (false).
2. *KEEPS the overtaking emit's tree and does not advance the watermark
   past it* — the positive control, driven through `reduceDocs` and
   `reducePickOutcome`: emit `seq 5 / gen …900 / 3 files` applied first,
   then the reply `seq 6 / gen …500 / 2 files`. Asserts identity,
   `fileCount 3`, `seq 5`, `phase open`, and that the watermark still
   works in both directions afterwards.
3. *a re-pick of the OPEN folder whose read landed in the SAME
   millisecond still applies* — the strict-`<` boundary.
4. *a pick onto a DIFFERENT folder is never an overtake, however old its
   read* — the cross-project direction, where a guard that dropped the
   `projectDir` conjunct would strand the user on the old project.

**`docs/tasks/T-018-s6-…md`** — the sweep's routed suggestion (below).

### Commands, in the order run, each exit read unpiped from `$?`

| # | cwd | command | exit |
|---|---|---|---|
| 1 | `app/` | `npm ci` | 0 |
| 2 | `app/` | `npm run build` | 0 |
| 3 | `tools/e2e/` | `npm ci` | 0 |
| 4 | `app/` | `npm test` (BEFORE, @`43e0fe8`) | 0 — **50 files / 1131 bodies**, `test/watcher-store.test.ts` 38 |
| 5 | `app/` | `npx vitest run test/watcher-store.test.ts` | 0 — 42 |
| 6 | `app/` | `npm run build` (AFTER; runs `tsc` over src AND `tsconfig.test.json`, which is this lane's typecheck) | 0 |
| 7 | `app/` | `npm test` (AFTER, @`668d7f2`) | 0 — **50 files / 1135 bodies** |
| 8 | lane root | `git worktree add --detach <scratch>/drill-T-018-s5 668d7f2…` | 0 |
| 9 | drill `lib/parser/` | `npm ci`, `npm run build` | 0, 0 |
| 10 | drill `app/` | `npm ci`, `npm run build` | 0, 0 |
| 11 | drill `app/` | `npx vitest run test/watcher-store.test.ts` (drill baseline) | 0 — 42/42 |
| 12 | drill | mutants M1–M7, below | as recorded |
| 13 | lane root | `git worktree remove --force <scratch>/drill-T-018-s5` | 0 |
| 14 | lane root | `node tools/e2e/scripts/gate-run.mjs parser` | 0 — GREEN, **bodies=349, targets=1** |
| 15 | lane root | `node tools/e2e/scripts/gate-run.mjs app` | 0 — GREEN, **bodies=1135, targets=1** |
| 16 | lane root | `node tools/e2e/scripts/gate-run.mjs rust` | 0 — GREEN, **bodies=639, targets=18** |
| 17 | lane root | `NPUTER_E2E_PORT=15018 node tools/e2e/scripts/gate-run.mjs e2e` | 0 — GREEN, **bodies=574, targets=1** (8.1m) |
| 18 | `tools/e2e/` | `NPUTER_BOOT_PORT=16018 npm run boot:check` | 0 |
| 19 | lane root | `git merge-tree --write-tree main HEAD` | 0 |
| 20 | `app/src-tauri/` | `cargo run -q -p nputer-index -- index --check --root ../..` | **1 — STALE, by design; see gates** |

All four gate-run verdicts carry `ref=668d7f2e6a334e5ef4dde12960e64c5d892d3394`.

`boot:check` printed both startup lines:
`[nputer] project folder: /Users/ujju/Projects/nputer-T-018-s5` and
`[nputer] window "main" created`.

### The drills — seven mutants, one side only, in a DETACHED worktree cut from `668d7f2`

Every mutation was read back with `git diff` before its run; every
restore was `git restore --source=668d7f2… --staged --worktree -- <path>`
followed by a `shasum -a 256` of the worktree file against `git show
668d7f2…:<path>`, with an empty PER-PATH `git diff -- <path>` as the
companion. The drill worktree carried its own `node_modules` and its own
`app/dist`, and was removed afterwards (`git worktree list` re-read: the
entry is gone).

| id | one-side mutation | site | bodies killed |
|---|---|---|---|
| M1 | the guard stripped: `docs: reduceDocs(prev.docs, outcome.snapshot)` | source, `"picked"` branch | **1** — body 2 |
| M2 | `if (prev.projectDir !== reading.projectDir) return false;` deleted | source, predicate | 4 — body 1, body 4, and T-064's *both halves* and *DIFFERENT folder* |
| M3 | the clock comparison → `return false` (**the genesis guard copied verbatim**) | source, predicate | 2 — body 1, body 2 |
| M4 | the clock comparison → `return true` | source, predicate | 4 — body 1, body 3, and T-064's *both halves* and *re-picking the OPEN folder* |
| M5 | the `"picked"` ternary inverted | source, `"picked"` branch | 4 — bodies 2, 3, 4, and T-026's *criterion 5* |
| M6 | **DATA mutant**: `REPLY_FINISHED` moved to `1_700_000_001_000`, i.e. the fixture clock made monotone with seq | test data | 2 — body 1, body 2 |
| M7 | the rule COPIED inline into the `"picked"` branch instead of calling the predicate | source, `"picked"` branch | **0 — GREEN** |

**M1 IS CRITERION 3's DEMONSTRATION AND IT WAS SEEN, NOT ASSERTED.**
Against the unguarded branch body 2 fails with
`AssertionError: identity: nothing was rebuilt: expected { seq: 6, …(10) }
to be { seq: 5, …(10) }` — the base overwrote the emit's three-file tree
with the reply's two-file read and advanced the watermark to 6, which is
the defect this card names, measured.

**KILL-SET CONTAINMENT, PER BODY** (verifier.md 2b — the sets are of
MUTANTS, and no two of them nest): body 1 `{M2, M3, M4, M6}`, body 2
`{M1, M3, M5, M6}`, body 3 `{M4, M5}`, body 4 `{M2, M5}`. Each pair is
separated by at least one mutant in each direction, so no body is a
restatement of another. Every kill landed at the site the property lives
— the predicate or the `"picked"` branch — and each was read from
vitest's own failure list rather than from a mutator's report.

**M6 IS THE DATA MUTANT THIS PROPERTY NEEDS.** The property under test is
that the two stamps can disagree, and that lives in the FIXTURE's
numbers, not in the code: with the clock made monotone in seq — which is
exactly what the file-wide helper does — the reply becomes genuinely
newer, the guard correctly declines to fire, and bodies 1 and 2 stop
measuring an overtake. A code-only drill would have mis-graded that by
construction.

**M7 IS REPORTED AS A DRILL THAT COULD NOT RED, WHICH IS THE FINDING.**
Criterion 2's *one predicate, not two spellings* is a STRUCTURAL property
of the source, and a byte-equivalent copy of the rule is observationally
identical to a call — so no behavioural body can separate them, and none
was invented to pretend otherwise. The suite ran 42/42 GREEN against the
copy. What DOES enforce criterion 2 is the diff itself, which the
verifier reads: one exported `switchIsOvertaken` and two call sites.
`grep -rn genesisSwitchIsOvertaken app/src app/test` returns exactly ONE
line — `watcher-store.ts:550`, inside the new predicate's own doc comment,
recording what the guard used to be called and why it grew. No
declaration, no call site, no import carries the old name.

**ONE FAILURE IN THE M1 FULL-SUITE RUN WAS NOT A KILL AND IS NAMED AS
SUCH.** `npx vitest run` under M1 reported `2 failed | 1133 passed`; the
second was `shell-harness.test.ts > is not stale: the build is at least
as new as the store`, which compares `app/dist`'s mtime against the
store's. Mutating a source file after the build necessarily reds it — the
mechanical artifact CONVENTIONS' *"build, baseline, then mutate"* clause
exists for, not a body the guard's absence killed. Per-file drills (the
table above) ran `test/watcher-store.test.ts` alone and are free of it.

### The sweep — every other reducer branch that applies a payload by `seq` alone

Class: **an ordering stamp drawn BEFORE a collection is read as a date
for its content.** Sites found (`grep -rn "seq <= \|seq < \|seq > \|Math.max(.*seq" app/src/lib/*.ts`):

- `reduceDocs` — `watcher-store.ts:383`, `if (payload.seq <= prev.seq)
  return prev` — and its two remaining callers, `applyDocsPayload`
  (`:1007`, the `docs-changed` emit path) and `applyProjectStatus`'s
  `"open"` branch (`:1049`, the startup `docs_snapshot` pull). **STILL
  DECIDES ON `seq` ALONE.** Two emits cannot overtake each other (one
  debouncer thread draws, collects and sinks in order), but the startup
  pull runs on a command thread and takes its seq from the same global
  counter, so it can draw later, finish first, and overwrite an emit's
  newer tree. Same class, different door.
- `applySnapshot` — `docs-model.ts:370`, the same rule one layer down,
  and the place a fix serving every caller would have to land.
- **NOT BUILT HERE, AND WHY**: `app/src/lib/docs-model.ts` is outside
  this card's `touches`, and `reduceDocs`'s guard is the T-007
  stale-drop invariant every emit, every startup pull and both switch
  branches sit on — a wider blast radius than a size-S pick-branch guard.
  Routed as **`T-018-s6`** (`status: suggested`, `suggested_by: executor
  claude-opus-5@subagent @T-018-s5`), which names the fence it needs and
  the three questions a fix must answer.
- `reduceGenesisEvent` — `agent-store.ts:378`, `event.seq <= prev.seq`.
  **CORRECT AS WRITTEN and named so the next sweep does not re-open it**:
  genesis turn events carry no collection and no reading time, and one
  ordered producer mints them, so `seq` is the only reading they have.
- The snapshot-less genesis arm — `watcher-store.ts:715`,
  `Math.max(switched.seq, outcome.seq)`. **CORRECT AS WRITTEN**: no
  collection produced it, so there is no content time to compare, and the
  `Math.max` is the T-064 repair that keeps the watermark from walking
  back.

### Standing gates, derived on the MERGE FORECAST

`git merge-tree --write-tree main HEAD` → exit 0 (no conflict), then
`git diff --name-only main <tree>`. Derived at the lane tip so the
answers do not move when this notes commit lands.

- **GRAPH REGEN — FIRES.** The forecast diff touches `*.ts` outside
  `docs/`. `index --check` at `668d7f2` exits **1 / STALE** and its
  delta is exactly this change and nothing else: `files +0 -0 ~2`
  (`app/src/lib/watcher-store.ts` loc 1452→1534, symbols 56→57;
  `app/test/watcher-store.test.ts` loc 605→739), `edges +5 -4`, all nine
  naming the rename `genesisSwitchIsOvertaken` → `switchIsOvertaken` plus
  the new `SwitchReading` type_ref. Committed 2501 symbols / 2388 edges →
  fresh 2502 / 2389. **Regeneration is the integrator's**, in the merge
  commit.
- **BOOT GATE — FIRES** (the diff touches `app/src/**`). Run in-lane:
  exit **0**, both `[nputer]` lines above.
- **DOCS GATE — FIRES.** The forecast diff touches `docs/tasks/`, which
  the parser's own suite and the e2e board bodies read. Both were run
  after every card write in this lane: `gate-run parser` 349 GREEN and
  `gate-run e2e` 574 GREEN (measured at `668d7f2`; the card writes came
  after, so the integrator re-derives).
- **METHOD EVAL GATE — NOT OWED.** The forecast diff touches no
  `method/**` path.
- AUDIT GATE and THE BLESSED GATE declare no merge-diff trigger and are
  therefore not in this set.

### For the verifier

- The positive control's arming and the subject's are **not decided by
  one arrangement**: the guard lives in `app/src/lib/watcher-store.ts`
  and the pair that exercises it is a fixture in the test file, and M6
  damages the fixture alone to prove that.
- `test/shell-harness.test.ts`'s *"keeps genesis when docs land under
  it"* is the body that decides the strict-`<`; it is worth re-reading
  against any proposal to loosen it.
- The e2e bodies the dispatch brief expected to be red in a lane cut
  before a guard merged (`card-preflight`, `checkout-currency` ×2,
  `lane-lock`) were **all green here** — see "where the brief was wrong"
  in the report.
