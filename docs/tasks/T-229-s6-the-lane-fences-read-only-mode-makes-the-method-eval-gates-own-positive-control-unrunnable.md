---
id: T-229-s6
title: The lane fence's read-only mode makes the METHOD EVAL GATE's own positive control unrunnable in exactly the lanes that owe the gate
feature: F-06
milestone: 4
size: S
priority: 3
status: verifying
suggested_by: executor claude-opus-5@subagent @T-229-s4
blocked_by: []
touches: [tools/method-evals]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**Class parent: `T-155`** (the method gets an eval suite whose positive
control is RUN, never assumed). This card is about the control not being
runnable where it is owed.

**MEASURED, in the T-229-s4 lane at `a0d72d4719f56d2f8fecc14fd344c62b84f50a43`:**

    node tools/method-evals/run.mjs             -> exit 0   (6 model-free evals)
    node tools/method-evals/run.mjs --selftest  -> exit 3
      MF-01: COULD NOT RUN — EACCES: permission denied, open
      '<tmp>/nputer-method-eval-mf01-control-XXXXXX/project/method/roles/executor.md'

and, from a DETACHED worktree cut from that same commit, both exit **0**.
The tree is identical; only the file modes differ.

**THE CAUSE IS THE FENCE, NOT THE METHOD.** A dispatched lane enforces
its fence physically by MODE — at that ref, 654 tracked files in the
lane are `r--r--r--` and only the two fence paths are writable.
`tools/method-evals/lib/fixture-root.mjs` builds each eval's fixture with
`cpSync`, which PRESERVES mode, so the copied `method/roles/executor.md`
lands read-only in the temp project; MF-01's `--selftest` arm then tries
to write its degraded copy of that file and gets `EACCES`. Setting
`TMPDIR` into a writable scratch directory reproduces it byte for byte,
which rules out the temp directory as the cause.

**WHY IT MATTERS RATHER THAN BEING A CURIOSITY.** The METHOD EVAL GATE
fires *at any merge whose diff touches `method/**`* — so the sessions
that owe `--selftest` are precisely the sessions holding a lane whose
fence includes a `method/` path, and precisely those sessions cannot run
it. `--selftest` is what makes the gate a check rather than a ritual
(CONVENTIONS: THE POSITIVE CONTROL IS PART OF THE SUITE AND IS RUN,
NEVER ASSUMED), and exit 3 is honest about failing rather than silently
green — which is why this is a repair and not an incident. The lane that
found it worked around it by re-running in a detached worktree; that
workaround is a per-session discovery, not a rule anybody has written
down.

## Acceptance criteria
- WHEN `fixture-root.mjs` materialises a fixture project THE copy SHALL
  be writable regardless of the source tree's modes (e.g. `cpSync` with
  a mode reset, or a `chmodSync` walk after the copy).
- WHEN `run.mjs --selftest` runs inside a checkout whose tracked files
  are mode `444` THE suite SHALL exit 0 over all six model-free evals,
  with a positive control that still detects each planted degradation.
- IF the fixture cannot be made writable THEN the eval SHALL still
  report `COULD NOT RUN` with the reason, never a pass.

## TRIAGE, 2026-09-02 — promoted and dispatched, priority 3, at T-229-s4's merge (89c7e2b)

The architect seat. Every lane that touches method/ owes the METHOD
EVAL GATE and cannot run its positive control in-lane: the physical
fence sets tracked files read-only, `fixture-root.mjs`'s `cpSync`
preserves the mode into the eval fixture, and MF-01's degradation step
hits EACCES (T-229-s4 measured exit 3 in-lane, 0 in a detached worktree
at the same commit). Criteria: the fixture root SHALL be writable
regardless of the source tree's modes (copy without preserving mode, or
chmod the copy), a body SHALL red against a read-only source tree with
the change reverted, and `--selftest` SHALL exit 0 from inside a fenced
lane, shown in the notes from this lane's own checkout. Guard-class (the
eval gate is a guard), `review: independent`.

## FENCE WIDENED, 2026-09-02 — fast path A, by the dispatching seat

Amended on the integration branch while the lane was live: the blind
verifier measured at the base that no suite covers fixture-root.mjs,
that `fixture.head`/`fixture.restore()` have zero call sites, and that
the card's own criterion — a body that reds against a read-only source
with the change reverted — has no in-fence file to live in. The fence
is now the whole `tools/method-evals` tree (its zero-dependency property
unchanged: no package added), so the control can live beside the evals'
own selftest. Re-expanded against this commit; the lane's card copy
carries this line and section by the seat's own write.


## Implementation notes, 2026-09-02 — executor claude-opus-5@subagent

**THE IN-LANE MEASUREMENT, BEFORE ANYTHING WAS CHANGED**, from this
lane's own checkout `/Users/ujju/Projects/nputer-T-229-s6` at the
dispatch stamp `fafb6a76e54b9e919ac1b19b0e0a5a4543a7c0da`, with 653 of
1169 tracked files at `r--r--r--`:

    node tools/method-evals/run.mjs             -> exit 0  (6 model-free evals)
    node tools/method-evals/run.mjs --selftest  -> exit 3
      MF-01: COULD NOT RUN — EACCES: permission denied, open
      '<tmp>/nputer-method-eval-mf01-control-9T9ZVD/project/method/roles/executor.md'

Byte for byte the card's prediction, in the lane the card predicted it
for. **AND AFTER**, same checkout, at `69fc6ce`: both arms exit **0**,
seven model-free evals each.

### What was written and where

**`tools/method-evals/lib/fixture-root.mjs`** — `materialize` now walks
the copy and ADDS the owner-write bit before `git` or any eval touches
it (`makeWritable`, called after the last copy and before `git init`, so
it never sees `.git`).

**A `chmod` WALK AND NOT A COPY FLAG, because there is no flag.**
`cpSync`'s `mode` is `copyFile`'s flag word (`COPYFILE_EXCL`/`FICLONE`),
not the destination's permissions — `cpSync(src, dst, {mode: 0o644})`
throws. So the card's first alternative does not exist and its second is
the only one; that is the "say which and why" answered.

**AN ADDED BIT, NOT AN ASSIGNED MODE.** git records the executable bit
and nothing below it, so flattening to `0644` would make a fixture
disagree with its source about the one permission git can see. Entries
already carrying `u+w` are skipped, so on an ordinary checkout the walk
makes no `chmod` call at all. Symlinks are skipped — `chmodSync` follows
them, which would chmod a target possibly outside the fixture; there are
zero in the copy set today and the guard is there so that stays a fact
rather than a rediscovery.

**`LIVE_COPY_SET` and `CARD_FIXTURE_DIR` are exported** and the four
`cpSync` calls became one loop over one list, because the list now has a
second reader (below) and a second typed copy would go stale the day a
path is added — which is the failure this suite exists for.

**`tools/method-evals/evals/mf-07-fixture-root-writable.mjs`** — NEW,
and the reason the fence was widened. Nothing covered `fixture-root.mjs`
at all, so a repair whose only evidence is this lane's notes would red
nobody the day it was undone.

MF-07 **builds its own arming and inherits none** (`verifier.md` 2b:
where one arrangement decides both the subject's answer and the
control's, that is a defect). It writes a scratch replica of the source
set, `chmod 444`s it itself — never the fixture, which is the thing
under test, and never the checkout the suite happens to run in. The
replica is a whole little root, so the copy of the subject placed inside
it derives its own `repoRoot` from its own location and a REAL
`materialize` runs against a source the eval controls, with no test seam
added to the subject.

It **asserts every file, not one file**, and does not settle for the
mode bit: one real write per top-level group, because a mode is a claim
and a write is the measurement. Its degradation is **derived and keyed
to the mechanism, not to a helper's name** — every `chmod` line stripped
from a copy of the subject; if the repair is ever rebuilt on something
else the strip finds nothing and the eval says COULD NOT RUN and names
the re-aim, rather than passing.

### The acceptance criteria

1. **Writable regardless of the source's modes** — MET. Measured by
   MF-07 at `69fc6ce`: 49 fixture files writable out of a 50-file
   read-only replica, with real writes performed in all four groups
   (`method`, `docs`, `AGENTS.md`, `CLAUDE.md`).
2. **`--selftest` exits 0 inside a `444` checkout, over the model-free
   set, with the positive control still detecting each planted
   degradation** — MET, in this lane, shown above and again under
   `--verbose`: MF-01…MF-06 each still name their own degradation, and
   MF-07 joins them. `--set all --selftest` is 10-for-10, exit 0.
3. **A fixture that cannot be made writable reports COULD NOT RUN with
   the reason, never a pass** — MET and demonstrated live twice: the
   mutant run (exit 3, `EACCES … open <fixture>/method/roles/executor.md`)
   and a `materialize` that could not create its root at all (`TMPDIR`
   into a `555` directory: exit 3, `EACCES … mkdtemp`). The new walk
   throws into that same harness path with the failing PATH and reason
   named. **Its own throw branch was not reachable by any arrangement I
   could plant** — `chflags uchg` is not carried through `cpSync` for a
   file or for a directory (both tried, both exit 0), and a filesystem
   without POSIX modes hands the walk writable files, which is the
   correct outcome rather than a failure. Said rather than implied.

### Every command, in order, with its exit read from `$?` unpiped

    # baseline, in-lane, at fafb6a7
    node tools/method-evals/run.mjs                              0
    node tools/method-evals/run.mjs --selftest                   3   <- the defect
    # after the fixture-root change
    node tools/method-evals/run.mjs --selftest                   0
    node tools/method-evals/run.mjs                              0
    node tools/method-evals/run.mjs --set all --selftest         0   (10 evals)
    git commit (fixture-root.mjs)                                0   -> 26286e4
    # DRILL 0 — the read-only-source control, detached scratch worktree
    git worktree add --detach <scratch>/drill-T-229-s6 26286e4    0
    node tools/method-evals/run.mjs --selftest   (unplanted)      0
    git ls-files -z | xargs -0 chmod 444         (plant, 1169)    0
    node tools/method-evals/run.mjs --selftest   (fixed)          0
    node tools/method-evals/run.mjs              (fixed)          0
    git show fafb6a7:<subject> > <subject>       (mutant)         0
    node tools/method-evals/run.mjs --selftest   (mutant)         3   <- EACCES
    node tools/method-evals/run.mjs              (mutant)         0
    git restore --source=26286e4 --staged --worktree              0
    chflags uchg method/roles/executor.md; --selftest             0   (flag not carried)
    chmod 555 method/roles; --selftest                            0   (read-only DIR handled)
    chflags uchg method/roles; --selftest                         0   (flag not carried)
    TMPDIR=<555 dir> node …run.mjs --selftest                     3   <- COULD NOT RUN, mkdtemp
    git worktree remove --force                                   0
    # setup
    npm ci                          from app/                     0
    npm run build                   from app/                     0
    npm ci                          from tools/e2e/               0
    # battery at 26286e4
    node tools/e2e/scripts/gate-run.mjs parser                    0   bodies=363  GREEN
    node tools/e2e/scripts/gate-run.mjs app                       0   bodies=1135 GREEN
    node tools/e2e/scripts/gate-run.mjs rust                      0   bodies=639  GREEN
    NPUTER_E2E_PORT=15229 …gate-run.mjs e2e                       0   bodies=575  GREEN
    # the fence widening, read back on disk (never on the reply)
    cat .nputer/lane-fence.json ; grep '^touches:' <this card>     0
    # MF-07
    node --check evals/mf-07-fixture-root-writable.mjs            0
    node tools/method-evals/run.mjs --verbose                     0   (7 evals)
    node tools/method-evals/run.mjs --selftest --verbose          0   (7 evals)
    git commit (MF-07 + copy-set export + this card's amendment)  0   -> 69fc6ce
    # DRILLS 1-4, detached scratch worktree at 69fc6ce
    node tools/method-evals/run.mjs           (baseline)          0
    node tools/method-evals/run.mjs           (drill 1)           1   <- MF-07 by name
    node tools/method-evals/run.mjs --selftest (drill 2)          3
    node tools/method-evals/run.mjs           (drill 2)           1   <- MF-07 by name
    node tools/method-evals/run.mjs           (drill 3)           3   <- COULD NOT RUN
    node tools/method-evals/run.mjs --selftest (drill 4)          3   <- COULD NOT RUN
    node tools/method-evals/run.mjs / --selftest (restored)       0 / 0
    git worktree remove --force                                   0
    # THE METHOD EVAL GATE, both arms, at 69fc6ce
    node tools/method-evals/run.mjs                               0   7 model-free
    node tools/method-evals/run.mjs --selftest                    0   7, POSITIVE CONTROL
    node tools/method-evals/run.mjs --list                        0   11 evals
    # battery at 69fc6ce
    node tools/e2e/scripts/gate-run.mjs parser                    0   bodies=363  GREEN
    node tools/e2e/scripts/gate-run.mjs app                       0   bodies=1135 GREEN
    node tools/e2e/scripts/gate-run.mjs rust                      0   bodies=639  GREEN
    NPUTER_E2E_PORT=15229 …gate-run.mjs e2e                       1   bodies=575  RED (attributed below)
    # attribution bench, detached, AT THE BASE fafb6a7, none of my changes
    npx playwright test card-preflight checkout-currency lane-lock 1   4 failed / 78 passed
    git worktree remove --force                                   0
    # gates
    git merge-tree --write-tree main HEAD                         0   -> a31000e1
    cargo run -q -p nputer-index -- index --check --root ../..     0   graph.json CURRENT
    node tools/e2e/scripts/docs-gate.mjs <3 literal paths>         1   FIRES

### The drills — every one one side only, read back, restored by hash

**DRILL 0 — the card's own positive control, and the reason it is not
decided by this lane's own fence.** In a detached worktree at `26286e4`
I planted the read-only condition MYSELF (`chmod 444` over all **1169**
tracked files) rather than inheriting the hook's, so the control's
arming and the subject's are different acts. Mutant: the change
reverted, worktree side only, `git show fafb6a7:<subject> > <subject>`
— read back with `git diff --stat` as **1 insertion, 93 deletions** and
`makeWritable` absent (0 occurrences). **Before: exit 3, `MF-01: COULD
NOT RUN — EACCES … open <fixture>/method/roles/executor.md`. After
(fixed, same planted tree): exit 0.** The model-free set stayed **0**
under the mutant, which is the containment: only the arm that WRITES
dies, and it dies at the site the property lives. Restored
`--source=26286e4 --staged --worktree`, sha256
`3cfaa73716a8e1d9d70ccceb75e799dceec787372120eae9b23eb5c52711c703`
matching `git show 26286e4:<subject>`; the lane's own copy hashed the
same before and after.

**DRILL 1 — the subject, `makeWritable(dir);` deleted.** Read back with
`git diff -U0`: `-  makeWritable(dir);`. `run.mjs` exit **1**, `MF-07`
failing BY NAME, 49 of 49 fixture files unwritable and real writes
failing in all four groups; the other six evals passed. Restored, sha256
`ed9804d23cd12dd0ed46a6aa7dee335540f2abf0f22b387ca5c35f16704ffd15`.

**DRILL 2 — the PARTIAL repair, and it is the drill that earns MF-07 a
place beside MF-01.** `makeWritable(dir)` narrowed to
`makeWritable(path.join(dir, "method"))`. Read back with `git diff -U0`.
**MF-01's `--selftest` arm PASSES under this mutant** — it only ever
writes `method/roles/executor.md` — while **MF-07's check REDS, exit 1,
24 of 49 files unwritable.** Neither body's kill set contains the
other's, so they are not restatements; this is the mutant the card's
"regardless of the source tree's modes" is actually about. Restored,
same sha256 as drill 1.

**DRILL 3 — the assertion side: the eval's own arming disarmed**
(`chmodSync(file, 0o444)` -> `0o644`). MF-07 does **not** pass: exit 3,
*"the replica source did not lock: 50 file(s), 50 still writable — this
run measures nothing"*. A control that cannot be armed says so.
Restored, sha256
`da4e192c544227b521b3577bbddfb9e9c6816b1493359682bef23b0c7e830aec`.

**DRILL 4 — the re-aim guard** (`/chmod/i` -> `/chmodZZZ/i`, so the
degradation strips nothing). exit 3, COULD NOT RUN naming the re-aim,
never a pass. Restored, same sha256 as drill 3.

Both drill worktrees were detached, cut from this lane's own commits,
removed afterwards, and the lane read `git status` clean with both
subject hashes matching `HEAD` after every one.

**ONE HONEST ARTEFACT OF THE PLANT, recorded because it is a finding
about the DRILL and not about the fix**: a blanket `chmod 444` over
every tracked file also clears the executable bit, and git records that
bit — so the drill tree showed `bin/app-dev.mjs` and
`tools/method-evals/fixtures/runners/replay.mjs` modified. My plant was
therefore slightly WIDER than the real fence, which leaves the exec bit
alone. It was confined to the throwaway worktree, and it is the concrete
reason the repair ADDS a bit instead of assigning a mode.

### The battery, and the red, attributed

At `69fc6ce`, `gate-run` from the lane root: parser **363** GREEN,
app **1135** GREEN, rust **639** GREEN, e2e **575 bodies, exit 1, RED**
— 4 failed / 571 passed.

**THE FOUR ARE `guard-surface-behind` AND THEY NAME THEMSELVES.** Each
failure's own output carries the string: *"the judged checkout … is at
69fc6ce…, which does NOT contain `7129d90b4ead…` — the newest main
commit touching `.claude`. It is 8 commit(s) behind main."* That is
T-219-s3's merge, which landed after this lane was cut. By name:

    card-preflight.spec.ts:719  a discrepancy answers ONE and a preflight that could not run answers THREE
    checkout-currency.spec.ts:852  THE WIRING'S POSITIVE CONTROL: … says CURRENT for a current checkout
    checkout-currency.spec.ts:953  THE SWEEP AT ARM TIME: the arming step RUNS it …
    lane-lock.spec.ts:899  the DISPATCH STEP arms it — `brief.mjs --write-fence` is the one event …

**MEASURED AT THE BASE, WHICH IS THE PART THAT MAKES IT AN ATTRIBUTION
RATHER THAN A STORY**: a detached bench at `fafb6a7` — none of this
lane's changes present — running those three spec files gives **4 failed
/ 78 passed**, the same four titles. Four bodies is also the count
docs/STATE.md's own `guard-surface-behind` hazard predicts. Not this
lane's, and not repairable inside this fence.

### Standing gates, derived on the merge forecast

`git merge-tree --write-tree main HEAD` exited **0** (no conflict),
tree `a31000e1…`; `git diff --name-only main a31000e1…` at main
`f2a3ed05` gives **2** paths, both `tools/method-evals/**`, and this
card joins them as the third when the commit carrying these notes lands.

- **GRAPH REGEN — NOT OWED, and asked anyway.** The trigger names
  `*.ts/*.tsx/*.js/*.jsx` or `*.rs` outside `docs/`; `.mjs` is none of
  them. And `.nputerignore` excludes `tools/` from the walk, so a diff
  confined there cannot move the graph by construction. ASKED rather
  than predicted, per the bullet's own instruction:
  `cargo run -p nputer-index -- index --check --root ../..` exit **0**,
  *"graph.json is CURRENT … 1169022 bytes, 200 files, 2503 symbols,
  2391 edges"*.
- **BOOT GATE — NOT OWED.** No path under `app/src/**`,
  `app/src-tauri/**`, `app/package.json` or `app/src-tauri/Cargo.toml`.
- **DOCS GATE — FIRES**, on this card. `docs-gate.mjs` with three
  literal paths from the repository root: exit **1**, *"1 path(s) under
  docs/ are code inputs"*, owing `npm test` from `app/`, `npm test` from
  `tools/e2e/` and `npx vitest run` from `lib/parser/` — all three were
  run green at `69fc6ce` and are re-run over the tree carrying these
  notes. *"every live task card's frontmatter parses, with a legal
  status"*, 0 frontmatter issues.
- **METHOD EVAL GATE — NOT OWED by its trigger** (no `method/**` path in
  the forecast) **and run anyway, both arms, because this card is about
  it**: exit **0** / exit **0**, 7 model-free evals each.
- AUDIT GATE and THE BLESSED GATE declare no merge-diff trigger and are
  not in this set.

### The fence widening, as this lane read it

The grant arrived mid-lane. I proceeded on the two files and not on the
message: `.nputer/lane-fence.json` carries `"touchesLine": "touches:
[tools/method-evals]"` with `"paths": ["tools/method-evals"]` stamped at
`fd103b09…`, and this card's line 11 reads `touches: [tools/method-evals]`
— character for character the same line, which is what the write-time
guard compares. The physical layer agrees: everything under
`tools/method-evals` is `rw-` in this lane. I wrote neither half.

### Routed, not built

**`T-229-s9`** — `fixture-root.mjs`'s `head` and `restore()` have ZERO
call sites, re-derived at `82ffc26` rather than transcribed from the
dispatching seat's bench. `restore()` is a real guard (it re-reads `git
status` and throws by name) whose failure path has never executed. The
path is INSIDE this lane's widened fence, so this is not a fence
refusal: removing or wiring an exported contract is a different decision
from making the copy writable, and an executor does not expand its own
card. Filed with placement fields and a one-level suffix id; nothing
else was noticed and left unfiled.

**Nothing was routed for the e2e red** — `guard-surface-behind` is
already carded as T-238, which docs/STATE.md names as the card that
moves those four bodies to a fixture vantage. A second card for it would
be a duplicate.

### For the verifier

- The subject is `tools/method-evals/lib/fixture-root.mjs`; the body
  that holds it is `MF-07`. **DRILL 2 is the one to re-run** — a repair
  reaching only `method/` passes MF-01 and fails MF-07, which is the
  whole argument for the new body existing.
- MF-07 costs three replica builds per `--selftest` (one for `check`,
  two for `degrade`'s baseline-then-mutant), ~50 files each. Deliberate:
  `degrade` refuses to call a red a detection without a clean baseline
  first, the shape MF-01 already uses.
- **Zero dependencies intact**: `node:` builtins only, no manifest
  anywhere under `tools/method-evals` and no package added.
- The e2e red is `guard-surface-behind`, reproduced at the base; nothing
  in this fence can move it, and T-238 is the card that does.


## Fix pass, 2026-09-02 — executor claude-opus-5@subagent, on the REJECTION at `5ff00ab`

**THE FINDING, IN THE VERIFIER'S WORDS.** *"`evals/mf-07-fixture-root-writable.mjs`,
`replicaSource`, lines 113–115 … Line 114's `cpSync` is REDUNDANT — line
115 overwrites the content unconditionally, so the copy's only surviving
effect is its MODE. And `cpSync` preserves modes, which is the entire
subject of this card. In any checkout where
`tools/method-evals/lib/fixture-root.mjs` is `444`, the replica's copy of
the subject lands `444` and line 115's `writeFileSync` dies with
`EACCES`."* It is a **REGRESSION onto the standing gate**, not a residue:
at the base the plain `node tools/method-evals/run.mjs` — the run
docs/CONVENTIONS.md mandates at every `method/**` merge — exited **0**
under the fence and only `--selftest` reded; at `5ff00ab` **both** exit 3.

**THE ARRANGEMENT THAT HID IT FROM ME, named plainly, because it is this
card's own subject turned on the lane that built it.** The fence was
widened mid-lane to the whole `tools/method-evals` tree, so in THIS
checkout the subject module is writable and the bug cannot appear. Every
in-lane measurement I made — the before, the after, both gate arms, all
four drills — ran inside that one arrangement, and **one arrangement
decided both the subject's answer and the control's**. That is
`method/roles/verifier.md` step 2b's defect, reproduced *inside the eval
written to catch it*, by the seat that had just quoted the rule in
MF-07's own header. My drills varied the SUBJECT and never the FENCE, so
none of them could see it; the verifier's did, because it judged from a
bench whose fence was not mine. **The lesson is not "drill harder" — it
is that a lane cannot grade an arrangement it is standing in.**

**THE REPAIR**, exactly as the verifier measured it: drop the `cpSync`
and create the parent instead —
`mkdirSync(path.dirname(...), { recursive: true })`, with `mkdirSync`
added to the `node:fs` import. One line. The two lines now carry a
comment saying why they must never be folded back into a copy.

**MEASURED IN A SCRATCH CLONE OF THE TIP** (`git clone` of this lane,
detached, no `node_modules` anywhere — the zero-dependency property
holds), fenced by NUL-delimited walk so the two tracked paths carrying
spaces are not missed; under `method` + `docs/tasks` the fence leaves
**0** writable tracked files outside those two prefixes:

| ref | fence `method` + `docs/tasks` | full `444`, every tracked file |
|---|---|---|
| base `fafb6a7` | plain **0** · selftest **0** | plain **0** · selftest **3** |
| REJECTED `5ff00ab` | plain **3** · selftest **3** | plain **3** · selftest **3** |
| FIXED (this commit) | plain **0** · selftest **0** | plain **0** · selftest **0** |

The middle row is the verifier's finding reproduced by this seat before
the repair was written, and the bottom row is the repair. **And the
repair re-arms nothing**: with it applied under the full `444` fence,
deleting `makeWritable(dir)` still reds MF-07 BY NAME at exit 1.

**One correction to this card's own premise, found by the base row.**
The card says the sessions that cannot run the control are *"precisely
the sessions holding a lane whose fence includes a `method/` path"*. The
base row measures the opposite: a fence that INCLUDES `method` leaves
`method/roles/executor.md` writable, so MF-01's control passed there even
at the base (selftest **0**), and the original defect needs `method/`
read-only — a fence that EXCLUDES it, which is what this lane had at
dispatch. The phenomenon and the repair are unchanged; the sentence
naming which lanes is inverted, and it is recorded rather than corrected
in place because it is the card's premise and not this pass's to rewrite.

## VERDICT — 2026-09-02, claude-opus-5@subagent (verifier seat, `review: independent`)

**REJECTED at `5ff00ab6a2684edeed68f8a096eecda6e761e8f4`**, on ONE
reproducible failure — and it is this card's own acceptance criterion 2,
failing in exactly the lanes the card was cut for. The subject module is
right; the eval written to guard it reintroduces the defect.

Judged from `/Users/ujju/Projects/nputer-V-T-229-s6`, cut detached at the
lane's base `fafb6a7`. Every figure below was measured on that bench or
on a scratch clone of it, at the tip named.

### THE FAILURE

The card's criterion 2: *WHEN `run.mjs --selftest` runs inside a checkout
whose tracked files are mode `444` THE suite SHALL exit 0.* Measured:

| vantage | plain `run.mjs` | `--selftest` |
|---|---|---|
| base `fafb6a7`, writable | 0 (6 evals) | 0 |
| base `fafb6a7`, **all 1169 tracked files 444** | **0** | 3 — MF-01 EACCES |
| tip `5ff00ab`, writable | 0 (7 evals) | 0 |
| tip `5ff00ab`, **all 1171 tracked files 444** | **3** | **3** |

    method-evals: 1 eval(s) COULD NOT RUN — this run is not a claim about the method.
      MF-07: COULD NOT RUN — EACCES: permission denied, open
        '<tmp>/nputer-method-eval-mf07-WUqgra/source/tools/method-evals/lib/fixture-root.mjs'

**This is a REGRESSION, not a residue.** At the base the standing gate —
plain `node tools/method-evals/run.mjs`, the one docs/CONVENTIONS.md
mandates at every `method/**` merge — exited **0** under the fence; only
`--selftest` reded. At the tip the **plain gate run also exits 3**. The
change moves the breakage from the control onto the gate itself.

### THE CAUSE, one line

`evals/mf-07-fixture-root-writable.mjs`, `replicaSource`, lines 113–115:

    const live = readFileSync(path.join(repoRoot, SUBJECT), "utf8");
    cpSync(path.join(repoRoot, SUBJECT), path.join(root, SUBJECT_IN_REPLICA));   // <- line 114
    writeFileSync(path.join(root, SUBJECT_IN_REPLICA), mutate === undefined ? live : mutate(live));

Line 114's `cpSync` is **redundant** — line 115 overwrites the content
unconditionally, so the copy's only surviving effect is its MODE. And
`cpSync` preserves modes, which is the entire subject of this card. In
any checkout where `tools/method-evals/lib/fixture-root.mjs` is `444`,
the replica's copy of the subject lands `444` and line 115's
`writeFileSync` dies with `EACCES`. Measured directly at the tip:

    live subject mode: 444 · replica copy mode: 444 · writeFileSync: EACCES

**IT IS THE T-203 SHAPE, AND THAT IS WHY IN-LANE MEASUREMENT MISSED IT.**
The fence was widened to the whole `tools/method-evals` tree, so in THIS
lane the subject is writable and the bug is invisible. It is visible in
every lane whose fence does not include the suite — which is every lane
that owes the gate:

| fence | plain | `--selftest` |
|---|---|---|
| `tools/method-evals` + `docs/tasks` (**this lane**) | 0 | 0 |
| `method` + `docs/tasks` (**a lane that OWES the gate**) | **3** | **3** |

So the card's own sentence — *"the sessions that owe `--selftest` are
precisely the sessions holding a lane whose fence includes a `method/`
path, and precisely those sessions cannot run it"* — is **still true at
this tip**, and now for the plain run as well. One arrangement (the
widened fence) decided both the subject's answer and the control's.

### THE REPAIR, measured rather than suggested

Drop line 114 and create the parent instead — the copy was never needed:

    mkdirSync(path.dirname(path.join(root, SUBJECT_IN_REPLICA)), { recursive: true });
    writeFileSync(path.join(root, SUBJECT_IN_REPLICA), mutate === undefined ? live : mutate(live));

(with `mkdirSync` added to the `node:fs` import). Applied to the tip and
run under the full `444` fence: plain **0**, `--selftest` **0**. And the
control still CAN fail on top of the repair — deleting `makeWritable(dir)`
reds MF-07 by name, exit **1**. One line, and it re-arms nothing.

### WHAT PASSED, so the re-run knows what not to disturb

**`lib/fixture-root.mjs` is correct.** `makeWritable` was walked whole
from a fenced checkout: **49 files, 13 dirs, 0 not owner-writable, 0
symlinks, 0 group/other-writable**, `git status` in the fixture empty, all
**49 tree entries `100644`**, `restore()` clean. It covers all four former
copy calls (my base census: `method/` 25, `docs/architecture/` 16, the 7
live docs/adapters, the card fixture 1 = 49), runs before `git init` so
`.git` is never walked, adds `| 0o200` rather than assigning a mode, and
skips symlinks by `lstat`. That matches the house precedents
(`lane-lock.mjs:393`'s `& ~0o222`, `token-scan.spec.ts:114`'s `| 0o200`).

**MF-07 is a real control, and its kill set is not contained by MF-01's.**
Re-run rather than taken from the notes:

- delete `makeWritable(dir)` → MF-07 reds **by name**, **49 of 49**
  unwritable, with a real write failure; MF-01–MF-06 stay green.
- narrow `makeWritable` to `method/` only → MF-01's `--selftest` **passes**
  while MF-07 reds **24 of 49** (`AGENTS.md`, `CLAUDE.md`,
  `docs/ARCHITECTURE.md` …). Neither kill set contains the other, and the
  mutant lands at the site the property lives. The executor's figure of
  24 of 49 reproduces exactly.

The arming is the eval's own act, built in scratch and never the fixture
and never the checkout — the correct answer to verifier.md 2b, and the
reason the control is not degenerate. My phase-1 pre-committed
demonstration in its literal form (revert the whole subject to the base)
is a loud `COULD NOT RUN` on a missing export rather than a clean red, so
the re-aimed form above is the one that carries the proof; I report both.

**Zero dependencies intact** — no manifest hunk in the diff, `node:`
builtins only, and the whole suite runs green from a clone with no
`node_modules` anywhere. **Fence compliant** — the four changed paths sit
inside `touches: [tools/method-evals]` and the unfenceable `docs/tasks`,
matching the lane manifest at `fd103b0`. **Security sweep: nothing.** No
new input path, no endpoint, no secret; the only new capability is a
`chmod` that adds one owner bit to a `0700` temp tree, never widening
group or other, and the live checkout is provably untouched — after every
run above, **0 of 1171** tracked files had gained a write bit and `git
status` was empty. **Criterion 3 is met**, demonstrated by the bug
itself: the throw surfaced as `COULD NOT RUN` with the path and reason,
never as a pass.

### Phase 1 seal

Blindness on this pass was **CLOCK-SHAPED, not discipline-shaped**: phase
1 was dispatched before the work existed, so there was no diff to decline
to read. The attack set and the base ground truth were sealed before the
branch was fetched:

    2026-09-02T05:36:33Z UTC
    attack-V-T-229-s6.md  7bf4b9e4d835a5f6539f4a801c8fee851335b11e02dc2afd1717e69090bd11ea
    ground-V-T-229-s6.md  52d13a23e8b611bfe2287a916a39c4ebff4c0b727aee485b78b18a101c836caf
    stamps-V-T-229-s6.txt 38128999c19b162f55cb2dfa0d9958388776e36b3d199687d5030a21aebd0e1d

The finding above is attack **A5** ("a control armed by the checkout
rather than by itself") landing on the half of the eval nobody aimed it
at, and the four-copy census in **A1** is what let the second table be
read as a regression rather than a curiosity.

## RE-VERDICT — 2026-09-02, claude-opus-5@subagent (verifier seat, `review: independent`)

**APPROVED at `90e14bd34085482608076c080fb834cfcb4b945e`.** The rejection
above is repaired at its site, the repair is the one the rejection named,
and the control it protects still reds when disarmed. Re-measured on the
same bench, on fresh clones cut from it at the new tip.

### The fix is the fix

`evals/mf-07-fixture-root-writable.mjs` drops the redundant `cpSync` and
creates the parent instead, `mkdirSync` added to the `node:fs` import.
`cpSync` remains imported and used for `LIVE_COPY_SET`, so nothing went
dead. The twenty-line comment above the two lines names why folding them
back is the bug — which is the right place for it, because the next
reader's instinct will be to tidy them.

### The matrix, re-run rather than read

Every cell measured at `90e14bd` on a clone with no `node_modules`
anywhere. Fences applied by the lane-lock arithmetic (`mode & ~0o222` over
`git ls-files -z`, non-symlink regular files only).

| vantage | plain | `--selftest` |
|---|---|---|
| writable | **0** (7 evals) | **0** |
| fence `method` + `docs/tasks` | **0** | **0** |
| fence: **all 1171 tracked files 444** | **0** | **0** |

Both rows that were `3 · 3` at `5ff00ab` are now `0 · 0`. The executor's
reported matrix reproduces.

### The control is still armed — the probe that matters

A repair that quietly disarmed MF-07 would produce the same three green
rows. It does not:

| mutation | fence | result |
|---|---|---|
| `makeWritable(dir)` deleted | full 444 | MF-07 reds **by name**, **49 of 49** unwritable, real write failed, exit **1** |
| `makeWritable(dir)` deleted | `method` | MF-07 reds **by name**, **49 of 49**, exit **1** |
| `makeWritable` narrowed to `method/` | full 444 | MF-07 reds **24 of 49** while MF-01's `--selftest` **passes**, exit **1** |

MF-01–MF-06 stay green in all three. The kill sets are still not nested,
and the second row is the one the rejection bought: the control now fails
correctly in the lanes that could not run it at all before.

`materialize` re-walked whole from the full-444 clone: **49 files, 13
dirs, 0 not owner-writable, 0 symlinks, 0 group/other-writable**, fixture
`git status` empty, **49 tree entries, 0 non-`100644`**, `restore()`
clean. After all six runs the source was untouched — **0 of 1171** tracked
files gained a write bit under the full fence, **539 of 1171** writable
under the `method` fence exactly as armed, and no working tree dirtied
except by my own drill edits.

### Two disclosures checked rather than accepted

**The space-bearing paths are real.** Two tracked files carry spaces —
`docs/design/claudedesign_handoff/nputer app.dc.html` and `… tokens.dc.html`
— so a whitespace-splitting fence helper would leave exactly two files
writable, which is the executor's account of its own first proof. My
helpers read `git ls-files -z` and split on NUL from the first run, so the
phase-1 ground truth and the rejection matrix were never exposed to it.

**The card's premise really was inverted, and the correction is more
precise than the card.** Measured at the base `fafb6a7`:

| fence at the base | plain | `--selftest` |
|---|---|---|
| whole `method/` | 0 | **0** — the control PASSES |
| `method/roles/executor.md` | 0 | **0** |
| `method/lane-protocol.md` | 0 | **3** |
| all tracked files 444 | 0 | **3** |

So the defect needs `method/roles/executor.md` READ-ONLY — a fence that
EXCLUDES it — and a lane fencing the whole of `method/` never had the
problem. The card's sentence said the opposite. The gate is still owed by
those lanes and most of them still could not run the control (any lane
fencing one method file other than `executor.md`), so the phenomenon and
the repair are unchanged; only the sentence naming which lanes was wrong.
Recording it rather than rewriting the premise in place is the right call.
**This does not disturb the rejection above**: MF-07's subject is
`fixture-root.mjs`, which a `method` fence excludes, so the `3 · 3` row at
`5ff00ab` was measured correctly and for the right reason.

### Gates at MY tip, not at the one I was sent

Re-run after this commit, because appending prose under `docs/tasks/` is a
code input here: docs-gate FIRES and names three suites; parser **363**,
app **1135**, the four e2e card readers **46**, `index --check`
**CURRENT**. Figures re-derived at this tip rather than transcribed from
the notes; parser, app and the card readers match the lane's report.

Security sweep: nothing. The diff adds one `mkdirSync` of a temp path and
removes a copy; no input path, no endpoint, no secret, no dependency, and
the widest permission the suite now sets is one owner-write bit inside a
`0700` temp tree.
