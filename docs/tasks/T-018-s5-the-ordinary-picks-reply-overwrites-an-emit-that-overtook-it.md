---
id: T-018-s5
title: The ordinary pick's reply OVERWRITES an emit that overtook it — `genesisSwitchIsOvertaken` guards the genesis branch and the `picked` branch has no guard at all
feature: F-02
milestone: 4
priority: 2
size: S
status: done
blocked_by: []
touches: [app/src/lib/watcher-store.ts, app/test/watcher-store.test.ts]
suggested_by: executor claude-opus-5@subagent @T-018-s2
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
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

## VERDICT

**APPROVED** — 2026-09-02, verifier `claude-opus-5@subagent`, seat
`V-T-018-s5`, bench `/Users/ujju/Projects/nputer-V-T-018-s5`.
**Tip judged: `943731dfb53fb3ebc4e1500a0bc63c23942497f7`** (code commit
`668d7f2`), base `43e0fe8`. Every figure below was measured in this bench;
figures carrying a ref were measured at that ref and nowhere else.

### Blindness: CLOCK-SHAPED, and phase 1 was sealed by hash before the diff existed

Phase 1 reached this seat before the lane's work existed
(`method/roles/orchestrator.md` 5c, the preferred shape). The attack set
and the ground truth were written from the card at `43e0fe8` and sealed
at **2026-09-02T03:48:37Z**:

    attack-V-T-018-s5.md  8bdaae0945e79be590895c2fc4ccbf11ce8bb84256111e78e2b6b6bbd96bbea8
    ground-V-T-018-s5.md  fd1c37c1787699c18d2663c18de0fd82ad0902f541d41e877cddee4f2b57ac29
    stamps-V-T-018-s5.txt 48749ef929d49d12aa5648590fd082fef60292f1b2973206df72434c207ddb10

Corroboration rather than assertion: a `git worktree list` run for bench
hygiene at seal time showed `/Users/ujju/Projects/nputer-T-018-s5` still
sitting at `43e0fe8`. No branch was fetched and no lane file opened
before the seal.

**DISCLOSED, because the rule requires it rather than because it cost
anything:** the PHASE 2 message carried the executor's own summary —
the predicate's shape, the mutant numbering, suite counts. It arrived
**after** the seal, so it could not shape the attack set; and every claim
in it was re-measured here rather than taken as read. Where the two
disagree, this verdict reports what this bench measured.

### The finding phase 1 pre-committed, and what the lane did with it

The sealed ground truth recorded that **this card is satisfiable
word-by-word by a change that does nothing**: the TRIAGE `WHEN` clause
and criterion 1's closing phrase name the interleaving `reduceDocs`
already handles, because `same projectDir && snapshot.seq <= prev.seq` is
a **strict subset** of `reduceDocs`'s own first line (`:383`). Measured at
`43e0fe8` before any diff existed:

| Probe at `43e0fe8` | Result |
|---|---|
| emit `seq 5`/3 files/`gen 2000`, then reply `seq 6`/1 file/`gen 1000` | `seq 6`, `fileCount 1`, identity lost — **the defect** |
| emit `seq 6`, then reply `seq 5` | `seq 6`, `fileCount 3`, identity kept — **already safe** |
| `genesisSwitchIsOvertaken` asked about the broken pair | **`false`** — the old predicate does not fire on it |

The lane reached the same reading independently, took the non-vacuous
door, and **left the erroneous `WHEN` clause standing with a dated
correction beside it naming the architect seat's error** rather than
editing it away. Two blind seats converging on the same defect in the
card is the strongest evidence in this pass that neither was reading the
other.

### The attack set, run

- **Vacuous guard — DEFEATED.** The new clause
  `reading.generatedAtMs !== null && reading.generatedAtMs < prev.generatedAtMs`
  is the non-vacuous half. Replacing it with `return false` reds both new
  bodies and **no genesis body**, so it is load-bearing and it does not
  reach the genesis path under existing fixtures.
- **Criterion 3's demonstration — RUN BY THIS SEAT, not read.** Reverting
  only the `"picked"` call site to the unguarded
  `reduceDocs(prev.docs, outcome.snapshot)` (mutant landing read from
  `git diff`, `1 3`) reds body 2:
  `AssertionError: identity: nothing was rebuilt: expected { seq: 6, …(10) } to be { seq: 5, …(10) }`
  — byte-for-byte the overwrite the phase-1 ground truth measured at the
  base. `1 failed | 41 passed`.
- **Copy versus reuse — SETTLED MECHANICALLY, which no behavioural body
  can do.** Mutating the ONE shared expression (`reading.seq <= prev.seq`
  → `<`) kills a genesis body **and** a picked body in the same run
  (`2 failed | 40 passed`). One mutation cannot kill bodies on both
  branches unless both route through that expression. Corroborated
  independently by the graph: `index --check` reports exactly one added
  call edge, `reducePickOutcome -> switchIsOvertaken`, and one removed.
  `grep` finds one site spelling the rule. The lane's own M7 (the rule
  copied inline, GREEN) is disclosed correctly as a drill that could not
  red; criterion 2 is structural and the diff is what enforces it.
- **The DATA mutant — the property lives in the fixture, so the mutant
  is a data mutant** (2b, `T-221`). Making the body's clock monotone with
  `seq` (`REPLY_FINISHED` moved above `EMIT_FINISHED`) reds **both** new
  bodies. The fixture's independent clock is load-bearing; the file-wide
  `payload` helper (`generatedAtMs = base + seq`) could not have
  expressed this pair at all, and the lane's `read()` helper says so in
  its own comment.
- **Kill-set containment, from THIS seat's mutants.** Predicate body dies
  to {shared-expression, data, clock-clause}; body 2 dies to
  {call-site, data, clock-clause}. The shared-expression mutant kills only
  the first and the call-site mutant only the second, so **neither set
  contains the other** — both load-bearing, neither a restatement. Every
  kill landed at the predicate or the `"picked"` branch: the site the
  property lives.
- **Over-broad guard — CLEAR.** A genuinely later reply (`seq 6`,
  `gen 3000` over `gen 2000`) still applies: `fileCount 1`, `seq 6`.
- **Cross-project stranding — CLEAR, and this was the worst degenerate
  fix available.** A `generatedAtMs`-only rule without the `projectDir`
  conjunct would keep the OLD project's model behind a newly opened one.
  Driven here with `prev.gen 9999` against `reply.gen 1` for a different
  folder: switches correctly to `/projects/other`, `fileCount 1`,
  `seq 6`, no ghost.
- **Watermark — CLEAR.** After the guard fires, `seq` stays at the emit's
  5, and the reply's 6 was never burned: a following emit at `seq 6`
  lands with its 7 files. The `Math.max` idiom that is right on the
  genesis snapshot-less branch was correctly NOT copied here.
- **Echo duplication — CLEAR.** The branch returns `prev.docs` by
  identity, so `commitPickOutcome`'s `next.docs !== before.docs` is false
  and no second `model-updated` is emitted for a model the emit already
  echoed. The body asserts identity with `toBe`, not `toEqual`.
- **Genesis regression — CLEAR.** The five T-064 bodies are green,
  **unedited except for the rename**; no expected value moved. The
  snapshot-less path is bit-identical to the pre-fix answer, because
  `generatedAtMs: null` short-circuits the new clause — driven directly:
  a snapshot-less switch at `seq 6` against `prev.gen 9000` still answers
  `false`.
- **Fence — CLEAR.** `git diff --name-status 43e0fe8..943731d` names
  exactly the two `touches` paths, this card, and one `status: suggested`
  filing. `docs/CAPABILITIES.md` untouched, correctly: an app-side vitest
  body moves no e2e spec name.
- **Security sweep — CLEAR.** No dependency or lockfile change, no
  `as any` / `as unknown` / `@ts-ignore` / non-null assertion added, no
  secret, no URL, no new IPC or input path. One new export
  (`switchIsOvertaken`); `SwitchReading` stays module-private. The
  signature is a narrow `Extract` of the two variants, so `cancelled` and
  `busy` remain uncallable.

### Gates, at the tip judged (`943731d`)

| Gate | Result |
|---|---|
| `npm run build` from `app/` | **0** — both tsc programs (`tsconfig.json` + `tsconfig.test.json`, the T-073 write-surface gate) |
| `npm test` from `app/` | **0 — 50 files, 1135 tests, 0 failed** (baseline at `43e0fe8` was 50 / 1131; +4 is this card's four bodies) |
| `docs-gate.mjs` on the four changed paths | **1 — FIRES**, correctly: two cards are code inputs. *"every live task card's frontmatter parses, with a legal status."* |
| `index --check --root ../..` from `app/src-tauri/` | **1 — STALE, and REAL** (both counts and a `~` file diff printed, not the `committed: MISSING` false-red shape) |

**THE STALE GRAPH IS THE INTEGRATOR'S, NOT A LANE DEFECT**, and it is
stale by *exactly* the rename plus the new type — `files +0 -0 ~2`,
`symbols 2501 -> 2502`, `edges +5 -4`, every added edge naming
`switchIsOvertaken` and every removed one `genesisSwitchIsOvertaken`.
CONVENTIONS' GRAPH REGEN rule puts regeneration in the merge commit, the
same owner as the capabilities census. **Nothing else moved**, which is
what makes it safe to hand on.

### Findings that are NOT failures (step 6 — never blocking)

1. **Two stale cross-language citations.** `app/src-tauri/src/docs_watch.rs`
   still names the frontend predicate by its dead name at **`:2635`** and
   **`:4357`** — the second inside the doc comment of
   `the_watch_is_armed_before_the_switch_commits_so_an_emit_can_overtake_the_reply`,
   the very body that pins this design. Outside this card's `touches`, so
   the lane could not have fixed it; the lane's own sweep scoped its grep
   to `app/src app/test` and so did not see it. Comment-only, moves no
   gate. Deliberately NOT minted as a card for two comment lines — the
   integrator is already writing in the merge commit and can fold it in
   or file it.
2. **The strict `<` on the clock is a narrowing, not a closure**, and the
   lane states this rather than leaving it to be found: two collections
   finishing inside one millisecond are unordered, so `seq` decides and
   the reply applies. That is the safe direction (apply rather than
   drop), it is what keeps a fixture stamping one constant clock from
   reading as an overtake, and it is pinned by its own body. The
   wall-clock backwards-step residual is disclosed in the same comment.
3. **`T-018-s6` is the right filing and the sweep that produced it is
   sound.** The mirror hole — the emit path and the startup
   `docs_snapshot` pull still deciding on `seq` alone in `reduceDocs`,
   `applyDocsPayload`, `applyProjectStatus` and `applySnapshot` — is real,
   is out of this fence, and would have needed `docs-model.ts`. The sweep
   also names `reduceGenesisEvent` (`agent-store.ts:378`) as correct as
   written so the next sweep does not re-open it. Its frontmatter parses
   with a legal `status: suggested` and a one-level suffix id.

### Why APPROVED

The card asked for three things. **One predicate serving both branches**
— delivered as a genuine reuse, proved by a single mutation killing
bodies on both branches, not by reading the source. **Never move the
watermark backwards or past a newer emit** — driven and measured, in both
directions. **A body driving a real overtaking pair, shown red against
the unguarded branch** — the pair is the runner's own interleaving with
the two Rust stamps free to disagree, and this seat reproduced the red
itself rather than accepting the record of it.

The fix also survives the attack the card did not ask about and that a
narrower reading would have failed: it is not vacuous, and the reason it
is not is that it keys on `generatedAtMs` — the stamp that dates a
reading's content — instead of transcribing a `seq` rule that
`reduceDocs` already enforces.
