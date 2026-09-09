---
id: T-278
title: "The CI runner ran out of disk at the e2e lane (run 34300080330 on a6355bb): the arm's fence write and the docs harness both died of ENOSPC, seven bodies red for a reason the tree does not carry — the workflow owes a disk-space read before the lane and a card that names this red by its class"
feature: F-04
milestone: 4
size: S
priority: 10
status: verifying
suggested_by: "the architect seat, 2026-09-09, at the push of a6355bb (CI run 34300080330, FAILED; re-run requested)"
blocked_by: []
touches: [.github/workflows/ci.yml, tools/e2e/tests/workflow-parity.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by:
review: independent
---

## What happened

CI run 34300080330 on a6355bb (2026-09-09T01:39Z, ubuntu-24.04) FAILED in
the e2e lane with seven red bodies out of 706. The first, brief.spec.ts's
"THE ARM LEAVES EXACTLY WHAT THE EIGHT HAND STEPS LEAVE, file for file",
died at the arm's step 4 with the runner's own reason on stderr:

    the dispatch stopped at step 4 (fence) — expand the fence into the lane
    as its manifest. It ran: node .../brief.mjs --task T-901 --write-fence …
    ENOSPC: no space left on device, write

The other six — three shell-frame and three window-contract bodies —
reported "window.__supertaskrDocsHarness never appeared", the same words
T-267 filed for the harness's 15 s wait; on this run they share the cause
above (a dev server on a full disk). The same tree passed the whole
battery locally an hour earlier (battery52: 389/1163/645/706, all GREEN)
and the failed job was re-run rather than the tree changed.

## Why it is a card

The rule in docs/reference/10-gates.md: a platform-only red becomes a card
citing the run id. T-267 named the harness wait; ENOSPC is a different
class — the runner's disk, filled by three package installs, a cargo build
and a vite bundle in one job — and it reds the arm's own body first, which
reads as a landing-gate defect to anyone who does not open the log.

## Acceptance criteria

- WHEN the workflow reaches the e2e lane THE job SHALL print the runner's
  free disk (`df -h .`) as its own step, so a red of this class carries its
  reason in the step that precedes it, not only inside one body's stderr.
- WHEN free disk is below a stated floor THE job SHALL fail that step with
  the floor named, before any suite runs — a red that says "disk" and not
  "the arm could not write a manifest".
- THE workflow-parity spec SHALL pin the new step the way it pins every
  other step (a command changed in one place reds).
- The record of run 34300080330 and its re-run SHALL be in the next
  checkpoint's CI section, attributed to this class.

## Measured at the third red (run 34304932475 on 5775ac0, the seat, 2026-09-09 ~03:25Z)

The first `No space left on device` lands INSIDE the e2e lane, after
roughly five hundred bodies have passed (the log's line 3875, the arm's
bench cut `.git/worktrees/nputer-V-T-901/refs`), not before it: the
runner's caches restore fine (npm ~54 MB, cargo + target ~1.5 GB) and
the cargo suite, the app build and the lints all complete. So the disk
fills DURING the lane — the suspect is the e2e fixtures' own footprint
under /tmp (the ritual fixtures clone the repository with its history
and add worktrees per body; the landing-gate and lane-fence fixtures
each make a repository with a bare remote), not the caches. Three runs
in a row (a6355bb twice, 5775ac0 once) red the same seven bodies; the
last green runner is 683cd60 at 01:14Z with the same 706 bodies, so the
footprint sits at the runner's edge and any growth tips it.

Two more criteria this measurement adds:
- THE job SHALL print `df -h /tmp` before and after the e2e lane, and
  the lane's Playwright config SHALL remove each fixture's temp
  directory at the body's end (or the spec's), so the footprint is
  bounded by the largest single fixture, never by the sum.
- WHERE a fixture clones the repository, THE clone SHALL be
  `--depth 1 --no-tags` (or a `git worktree` of the runner's own
  checkout) unless the body needs history, and the body SHALL say so.

## Implementation notes (executor claude-opus-5@subagent, 2026-09-09, base `e9ce055`)

### What was built, in two files

`.github/workflows/ci.yml` gains two steps around the e2e lane and
nothing else. The first — **`runner disk before the e2e lane (floor 2
GiB)`** — prints `df -h .`, `df -h /tmp` and both `df -i` readings and
REFUSES when either filesystem is under the floor, naming the floor and
the shortfall in a `::error` annotation. The second — **`runner disk
after the e2e lane`** — carries `if: always()` and prints the same
readings plus the twenty largest entries left in `/tmp`.

`tools/e2e/tests/workflow-parity.spec.ts` gains `diskGuardProblems`, a
`problems: string[]` derivation in the idiom `deriveExpectedSteps` and
`stepPackageProblems` already use; one live body that asserts it empty
against the real workflow; one fixture body that drills six one-edit
mutants through it; and one `INFRASTRUCTURE_STEPS` entry so the "nothing
beyond the derived commands" body accounts for the pair. No CONVENTIONS
edit is owed: the derivation checks the doc's CI bullet for CI_SEQUENCE
and LOCAL_ONLY entries only, and infrastructure steps (`apt`, `rustc
--version`) have never been written there.

**The floor is never transcribed into the spec.** ci.yml declares it once
in the step's `env:` and repeats it in the step's NAME; the spec reads
the env and requires the name to state the same figure. Raising the floor
stays a one-line edit to ci.yml, and raising it in one of the two places
reds. `gh` reports the step that failed by NAME and `push-guard.mjs`
looks that name up, which is why the name is the half that must not go
stale.

### Where the card was wrong, and the corrected attribution

The card's *"Measured at the third red"* section says the first ENOSPC
lands **"after roughly five hundred bodies have passed (the log's line
3875)"**. 3875 is a LOG LINE NUMBER, and the line it names sits inside
the failure-detail block Playwright prints at the END of the run — its
timestamp, 03:21:01, IS that run's summary timestamp. Re-derived from all
three run logs, fetched with `gh run view <id> --log`:

| run | head | first red body | at | the runner's own words |
|---|---|---|---|---|
| 34300080330 | `a6355bb` | ordinal **64** of 706 | 02:20:56Z | `fatal: cannot create directory at '.claude/hooks': No space left on device` |
| 34304932475 | `5775ac0` | ordinal **64** of 706 | 03:03:46Z | `.git/worktrees/nputer-V-T-901/refs: No space left on device` |
| 34306871214 | `6c46872` | ordinal **64** of 706 | 03:33:29Z | `ENOSPC: no space left on device, write` |

In all three it is the same body — `brief.spec.ts:3272`, *"THE ARM LEAVES
EXACTLY WHAT THE EIGHT HAND STEPS LEAVE, file for file"* — and in run
34306871214 the lane's first body ran at 03:32:13Z, so the first ENOSPC
lands **about ninety seconds into an 18.8-minute lane**, not after five
hundred bodies. Each run reports `7 failed / 699 passed`.

Two consequences the corrected reading forces:

1. **The lane is not what fills the disk.** Ninety seconds in it has
   spent at most its own peak — 223 MiB, measured below. The disk was
   already at its edge when the lane started, which is exactly what a
   pre-lane floor can say and no body inside the lane can.
2. **The disk is at an EDGE, not full.** Bodies 65-69 — the ritual
   stopping at steps 1, 2, 3 and 4 — pass in the second after body 64
   reds. The arm's own fixture teardown hands the space straight back.

### The other six red bodies are a different class, and the card folds them in without a check

The card says the three shell-frame and three window-contract bodies
*"share the cause above (a dev server on a full disk)"*. The logs refute
a dead dev server: in run 34306871214, body **651** (session-economics,
browser) and bodies **655-657** (shell-frame, browser) pass on either
side of the red 652-654, and **673-674** pass immediately before the red
675-677. A server that had died would have taken all of them. In run
34304932475 one of the six reports `expect(locator).toHaveAttribute(expected)
failed`, which is not the harness sentence at all.

**T-267 already owns that class** (*"the docs harness wait is a fixed
fifteen seconds, so six shell-frame bodies red on a loaded runner"*), so
per `method/tasks/TASK-FORMAT.md` this is a CORROBORATION and not a
sibling card: three dated runs and the refutation above are appended to
T-267 rather than filed beside it.

### The measurement, and it is LOCAL

Sampled every 5 s through two full `gate-run e2e` runs on this lane's own
checkout — **macOS 26.6.2, arm64, node v22.22.0, 742 bodies** — by
snapshotting the names in `os.tmpdir()` before the run and `du`-ing, at
each sample, exactly the entries that were not in the snapshot.

| reading | run 1 | run 2 (the graded one) |
|---|---|---|
| peak new-temp footprint | **228,420 KiB** | **224,684 KiB** |
| footprint at the end | 1,728 KiB | 1,156 KiB |
| entries left behind | 164, 1,744 KiB, largest 152 KiB | **25, 1,000 KiB, largest 144 KiB** |
| suite wall time | 12.5 min | 11.8 min |

(Run 1's larger residue is this session's own parity and drill runs
sharing the temp directory, not the lane's.) The workspace side is small
too: `tools/e2e/test-results` peaked at 4.5 MiB mid-run, and the whole
worktree including three `node_modules` trees is 371 MiB.

**So the two criteria the card's measurement section adds are already
true, and neither needed a file outside this fence — no ask was raised.**

- *"the lane's Playwright config SHALL remove each fixture's temp
  directory at the body's end … so the footprint is bounded by the
  largest single fixture, never by the sum"* — **it already is.** The
  sampled series is a sawtooth that returns to a few hundred KiB between
  specs, and the residue after a whole 742-body lane is 1,000 KiB of
  nothing bigger than 144 KiB. `tools/e2e/tests/git-fixture.ts`'s
  `removeGitFixture` plus the per-spec teardowns are what does it.
- *"WHERE a fixture clones the repository, THE clone SHALL be `--depth 1
  --no-tags`"* — **no fixture clones the repository.** The suite has
  exactly three `git clone` call sites (`brief.spec.ts:2296` and `:2306`,
  `session-economics.spec.ts:202`, `checkout-currency.spec.ts:289`) and
  every one clones a SCRATCH fixture built by `git archive HEAD` + `git
  init` + one or two commits — no history to shallow, no tags to skip —
  and a clone from a local path hardlinks its objects anyway. The ritual
  fixture the ENOSPC body builds uses `git archive`, never a clone
  (`brief.spec.ts:3137`). The premise is false at this ref.

### Why the floor is 2 GiB, derived rather than chosen

The runner redded about ninety seconds in, having spent at most 223 MiB,
with nothing left. Its free space BEFORE the lane was therefore at most
~223 MiB — an order of magnitude under 2 GiB. So a 2 GiB floor **fires
on all four of the red runs**, while asking for roughly nine times what
the lane was measured to need. What it is NOT is a reading of the
runner's own disk: that figure has never been printed by this job. The
first run after this lands prints it, and the floor should then be
re-derived from a real headroom figure (**T-278-s1**).

**And the pressure has risen since the last red.** Those runs were
706 bodies; this ref is 742, because T-244 landed `cli.spec.ts` (1,183
lines) after `6c46872`. The card's own sentence — *"the footprint sits at
the runner's edge and any growth tips it"* — has had thirty-six bodies of
growth applied to it since it was written.

### The drills

Drilled at `6fe5a23`, one side only, every mutation read back from `git
diff` before the run, every restoration by `git restore
--source=6fe5a23 --staged --worktree` and proved by sha256.

| # | site | mutation | bodies red |
|---|---|---|---|
| D1 | ci.yml | the before-step deleted | the live keeper + the fixture's control |
| D2 | ci.yml | `E2E_DISK_FLOOR_GIB: "2"` → `"8"`, name untouched | same two, naming both sides |
| D3 | ci.yml | `if: always()` dropped | same two |
| D4 | ci.yml | `exit 1` → `true` | same two |
| D5 | the spec | the `exit 1` check disabled in `diskFloorProblems` | **the fixture body ALONE** |

Twenty of the file's twenty-two bodies stayed green under every one:
the kill set is contained to the two this card adds. **A site mutant
reds BOTH of them by construction and that is disclosed rather than
worked around** — the fixture body opens with the live keeper's own
assertion as its control, which is what makes each of its six mutants
one edit from a green baseline. D5 is the separation that exists: it
kills the fixture and the live keeper survives it.

The workflow's shell was drilled too, outside the suite, since no spec
executes it: extracted from the YAML and run under `bash -e` from
`tools/e2e`, it exits **0** at `E2E_DISK_FLOOR_GIB=2` and **1** at
`999999`, printing the `::error` line with the shortfall — the positive
control a refusal owes.

### What this card does not close

- **Acceptance criterion 4** (the run record in the next checkpoint's CI
  section) is the integrator's: `docs/checkpoints/` is outside this
  lane's fence. The table above is the material for it.
- **The census is stale by this lane's own hand.** Two test bodies were
  added, so `docs/CAPABILITIES.md` needs `npm run capabilities` **in the
  merge commit** — CONVENTIONS' capabilities bullet makes that the
  integrator's, at the merge. `npm run capabilities:check` reds until
  then, by design.

## Verdicts

### 2026-09-09 — claude-opus-5@subagent (verifier, phase 2)

VERDICT: **APPROVED WITH ASSIGNED CORRECTIONS**

attack set: sha256:fd1fd8ba6cf3a4a286156d6be974b5fcda9aa993a271814c7a59750a70321c8c (attack-set-T-278.md)
ground truths: sha256:b2db76202753d54111ddda51d45cbae718b7925900ef34a0d27db63dae9c0491 (ground-T-278.md)
ground addendum: sha256:96785975ff4aa0362caeac24c049bfc813d53a6e09b17e82d4b08d8cedbaac7a (ground-T-278-addendum.md)
base: e9ce05520420145a714b85d3d85d23d2380be10a
tip judged: 4327affbdcc476f5c4261b4333885c7b02d51abe (2 commits, read by `git rev-list`)
bench: /Users/ujju/Projects/nputer-V-T-278, detached at the tip; e2e port 25278

**THE FRAME I ACTUALLY HAD.** Two spawns. Phase 1 wrote its set at the base and
reports zero tool calls; **this harness cannot deny a subagent tools, so that
property was kept by INSTRUCTION and SELF-REPORT, not by the spawn.** I am a fresh
spawn with tools. All three digests were verified before any of the three files was
opened. Read order: the three sealed files; method/roles/verifier.md; STATE,
ARCHITECTURE and CONVENTIONS at the bench; the card at `e9ce055`; then the diff —
ci.yml, then the spec, then the cards. **My brief named the tip, the base, the
fence, the port and the CI result on the base only; no executor-derived figure
leaked into it.** One separation this construction cannot keep and I say so rather
than imply I kept it: **the lane's own card is INSIDE its fence, so the card's diff
IS the Implementation notes** — every mechanism finding below was derived from
ci.yml and the spec before I reached the card's hunk, but "notes after findings"
cannot be a property of a card-in-fence lane. The executor's report at
`report-T-278.md` was opened only after my findings file was written.

---

## 1. THE SUITES, at the tip, through the blessed runner from the bench root

Bench installs first (`npm ci` in lib/parser, app, tools/e2e; `npm run build` in
lib/parser and app), all exit 0. Then the whole four-suite battery, once, at
`4327aff`, counts read beside the exits:

| suite | command | bodies | exit | verdict |
|---|---|---|---|---|
| parser | `node tools/e2e/scripts/gate-run.mjs parser` | **389** | 0 | GREEN |
| app | `node tools/e2e/scripts/gate-run.mjs app` | **1171** | 0 | GREEN |
| rust | `node tools/e2e/scripts/gate-run.mjs rust` | **651** (18 targets) | 0 | GREEN |
| e2e | `SUPERTASKR_E2E_PORT=25278 … gate-run.mjs e2e` | **742** | 0 | GREEN |
| parity alone | `npx playwright test tests/workflow-parity.spec.ts` | **22** | 0 | GREEN |

The owed gates at the same tip, each read from an unpiped `$?`: `npm run typecheck`
**0**, `npm run lint:tokens -- --selftest` **0**, `npm run lint:tokens` **0**,
`npm run lint:docs` **0** (whole-tree half, 0 findings),
`cargo run -p supertaskr-index -- index --check --root ../..` **0** — *graph.json is
CURRENT … 201 files, 2560 symbols, 2453 edges*. `npm run capabilities:check` **1**,
STALE, committed 63301 bytes against a fresh 63548 — **expected and not a rejection
ground**: two bodies were added and CONVENTIONS' capabilities bullet makes the
regeneration the integrator's, in the merge commit.

**The rust suite was run here because the four-leg battery is what this seat owes.**
The executor's report declines it citing T-271 "scoped suites"; T-271 is
`status: planned`, and its own title reserves the full four legs for the verifier
and the integrator. The leg is discharged: 651 bodies, exit 0.

**Census:** 713 `test(` bodies in 39 spec files at the tip against 711/39 at the
base; workflow-parity 20 → 22. Zero `.only` / `.skip` / `.fixme` / `describe.skip`
anywhere under tools/e2e/tests. No spec deleted or renamed. **The eight-hand-steps
body (brief.spec.ts:3272) — the one CI redded — passed here**, so STATE's
bench-older-than-main ref-skew hazard did not fire and nothing needed attributing.

---

## 2. THE FENCE, AND THE ONE JUDGEMENT CALL

Seven paths moved: ci.yml, workflow-parity.spec.ts, this card, three new
`T-278-s*` cards, and **T-267**.

**The T-267 write is an APPEND, and it is inside the lane's real write fence.**
Measured: T-267 is 62 lines at `e9ce055` and 86 at the tip; `diff` of the base file
against `head -62` of the tip is IDENTICAL; the hunk is `@@ -60,3 +60,27 @@`, +24/-0,
and what it adds is a dated `## Corroboration (2026-09-09 …)` section at the tail —
the same shape as the `## Classification (2026-09-08)` section already there.
Frontmatter untouched; T-267 is `status: planned` with no live lane. **And it is not
a widening**: `lib/parser/src/fence.ts` freezes `UNFENCEABLE_PATHS` to
`['docs/tasks']`, the directory no card may fence because the protocol writes to it
on every card. The lane did not touch its own `touches:` line — it is byte-identical
to the base. No checkpoint, ADR, room or other card's verdict is touched anywhere in
the diff. **No record was rewritten.**

---

## 3. EACH CRITERION, ATTACKED LITERALLY

Step indices below are from the parsed workflow at the tip: 28 steps, ONE job
(`linux` — `loadWorkflow()` asserts `Object.keys(jobs)` equals `["linux"]`, so the
"wrong job" attack is structurally impossible). Floor **24**, `e2e lane` **25**,
after-reading **26**, `xvfb tauri boot` **27**.

**C1 — print the free disk as its own step: MET.** `runner disk before the e2e lane
(floor 2 GiB)` is its own named step at index 24, immediately before the lane. It
prints `df -h .` AND `df -h /tmp` — the attack that the workspace and the fixtures'
tree might be different filesystems is answered by reading both — plus `df -i` on
each, because an exhausted inode table returns ENOSPC too. No redirection, no
`continue-on-error`, no `if:`.

**C2 — refuse below a stated floor: MET, and the floor CAN FIRE.** I extracted the
step's `run` VERBATIM through the YAML parser and ran it under `bash -e` from
tools/e2e with a stub `df` on PATH (a DATA mutant — the property lives in df's
output, not in code):

| `df -Pk` available | exit | what it printed |
|---|---|---|
| real `df`, THIS MAC (a LOCAL figure, never the runner's) | **0** | `free at .: 432590800 KiB against a floor of 2097152 KiB (2 GiB)` |
| 900M (921600 KiB) | **1** | `::error title=runner disk below the e2e floor::. has 900 MiB free and the e2e lane's floor is 2 GiB` |
| 500K (500 KiB) | **1** | same annotation |
| 4.0G (4194304 KiB) | **0** | — |
| 12G (12582912 KiB) | **0** | — |
| 2097152 KiB (exactly the floor) | **0** | `-lt`, so floor-exact passes |
| 2097151 KiB | **1** | — |
| `df` itself BROKEN (stub exits 1) | **1** | the bare `df -h .` on line 1 aborts under `set -e` BEFORE the comparison — **the guard fails CLOSED** |

Units are right (`df -Pk` KiB against a KiB floor), the floor is written ONCE in
`env: E2E_DISK_FLOOR_GIB` and the spec requires the step's NAME to state the same
figure. The spec's `/^[1-9][0-9]*$/` on that value is also doing security work:
`$(( E2E_DISK_FLOOR_GIB * 1024 * 1024 ))` evaluates the variable's VALUE as an
arithmetic expression, and that pin is what keeps the surface closed.

**Where C2 is NOT met in letter — and this is CORRECTION 4.** "before any suite
runs" is false at index 24: the parser suite (9), the app suite (14), the cargo
suite (15), the graph gate, the audit, the docs gate, the census gate and the
250 MB browser download all precede it. The card's own later measurement section
re-asks for a reading "before and after the e2e lane", which is what landed and
what the diff argues in place. I judge the placement RIGHT and the disclosure
missing.

**C2's purpose attack — would the floor have caught the four reds — settled as far
as it can be, and the ground file is wrong about the one thing that could have
settled it.** The ground addendum says each failed log carries two `Filesystem`
header lines "a df printed by an action". It does not.
`grep -c -E '(^|[^a-z])df '` and `grep -c -E 'Avail|Mounted on|1K-blocks|Use%'` are
both **0** in all three logs; the two hits were TEST NAMES containing the word
filesystem. **No run has ever printed the runner's free disk**, so the question is
not answerable by measurement and the lane's route — an inequality — is the only one
there is. I re-derived its inputs from the logs myself: the first red body is
ordinal **64 of 706** in every run, at 02:20:56 / 03:03:46 / 03:33:29 against lane
starts of 02:19:30 / 03:02:14 / 03:31:59, i.e. **86–92 seconds into an 18.7–18.8
minute lane**, and each log carries exactly ONE ENOSPC line. Two things I measured
that the lane did not, and both support it: **no `FIXTURE TEARDOWN`, `ENOTEMPTY` or
"could not remove" line appears in any of the four failed logs**, so the fixtures'
teardowns SUCCEEDED on the runner and its spend is bounded the way the Mac's is;
and `git archive HEAD` at this tip is 26,173,440 bytes over 1,363 files, which
puts one ritual fixture (tar + extracted tree + a one-commit repository) in the
80–110 MiB neighbourhood and makes a 223 MiB peak across the two fixtures body 64
builds concurrently the right order of magnitude. **T-278-s1 names the gap
correctly and is the honest disposition.**

**C3 — the spec pins the new step the way it pins every other step: MET.** The pin
is a PARSED-STEP derivation, not a string grep, and it is exactly how the file's
other non-CONVENTIONS steps (apt, `rustc --version`) are pinned: an
`INFRASTRUCTURE_STEPS` entry plus a dedicated body. Fifteen producer mutants, every
landing read from `git diff`, every restoration proved by sha256 against the
committed blob (all RESTORED-OK):

| # | one-line landing in ci.yml | parity exit | what redded |
|---|---|---|---|
| CTL-1 | the BASE `ci.yml` under the TIP spec (0/-92) | **1** | **both new bodies** — they are NOT green at base |
| CTL-2 | reworded an UNRELATED step's name | **0** | nothing — 22 passed, so it is not a whole-file snapshot |
| M1 | `df -h .` → `df -h /mnt` | 1 | both new bodies **+ "runs nothing beyond the derived commands"** |
| M2a | `E2E_DISK_FLOOR_GIB: "2"` → `"0"` | 1 | both, *"can never fire"* |
| M2b | floor raised in the NAME only | 1 | both, naming both sides |
| M3 | the floor step moved to the job head | 1 | both, *"measures a different moment"* |
| M5 | the whole step commented out | 1 | both — a string pin would have survived this |
| M6 | `if: always()` → `if: success()` | 1 | both, *"the red run it exists for skips it"* |
| M12 | both steps deleted | 1 | both, *"NO step in the file carries that name"* |
| MORDER | the after-reading moved to the job tail | 1 | both **+ the xvfb "LAST step" body** |
| MTMP | `df -h /tmp` dropped from the after-step | 1 | both |
| MWD | before-step `working-directory` → `app` | 1 | both |
| **M4** | `if [ … -lt … ] && false; then` | **0** | **NOTHING — SURVIVES** |
| **MCOE** | `continue-on-error: true` on the floor step | **0** | **SURVIVES** |
| **MSHELL** | `shell: python` on the floor step | **0** | **SURVIVES** |
| **MREDIR** | `df -h . > /dev/null`, `df -h /tmp > /dev/null` | **0** | **SURVIVES** |

CTL-1 kills the vacuity attack outright and CTL-2 kills the over-broad-snapshot
attack. The four survivors are the subject of CORRECTION 2 and of `T-278-s5`.

**C4 — the run record in the next checkpoint: correctly deferred, and the
attribution is right.** `docs/checkpoints/` is outside the fence, so the discharge
is the table on this card, and I re-derived every cell of it: the three run ids
resolve (`gh run list`), their heads are `a6355bb` / `5775ac0` / `6c46872`, each
reports `7 failed / 699 passed`, the first red body is ordinal 64 in each, and the
three quoted runner sentences are the three logs' actual ENOSPC lines. **A fourth
attempt exists and the table omits it:** run 34300080330 is `attempt: 2`, and I
fetched attempt 1 — 4147 lines, one ENOSPC, at the arm's step 4 (fence),
`7 failed / 699 passed (19.4m)`. So "four consecutive runs" is TRUE as attempts.

**C5 — `df -h /tmp` on both sides, and the fixtures bounded by the largest: first
half MET and pinned (MTMP reds), second half ALREADY TRUE and I re-derived it
independently of the executor's sampling.** Every `ritualFixture(...)` in
brief.spec.ts is paired with a `removeGitFixture(...)` in the SAME body —
3280/3281 → 3414/3415, 3473 → 3524, 3881 → 3923, 3933 → 3952 — and each pair is a
`try { … } finally { … }`, so **the removal runs when the body THROWS**, which
answers the "cleanup only on success" attack. 39 `removeGitFixture` call sites over
15 files. The runner's own silence (no teardown finding in four logs) is the second
witness.

**C6 — shallow clones: NO SITE, and the card's premise is false at this ref.** The
card says *"the ritual fixtures clone the repository with its history"*. They do
not: `ritualFixture` (brief.spec.ts:3137, the archive at :3148) is
`git archive HEAD` + `tar -x` + `git init` + one commit. I re-grepped the clone
census myself — **four** `execFileSync` `git clone` sites (brief.spec.ts:2296 and
:2306, checkout-currency.spec.ts:289, session-economics.spec.ts:202) — and read each
source: every one is a scratch tree built the same `git archive` way with one or two
commits. Nothing to shallow, no tags to skip. The measurement is right; the count is
CORRECTION 3.

---

## 4. THE SECURITY SWEEP — everything that moved

No new `uses:`, no dependency, no secret, no token, no network call, no new input
path. `permissions: {contents: read}` is unchanged, top-level and per-job. Every
expansion in the floor shell is quoted (`"$where"`, `"$free_kib"`, `"$floor_kib"`);
there is no `rm` in the diff at all; the one arithmetic surface is closed by the
spec's positive-integer pin (above). The after-step's
`du -sk /tmp/* 2>/dev/null | sort -n | tail -20 || true` has no unguarded glob and
prints only fixture basenames into the job log — noted, not a finding. The spec's
new code reads no file `loadWorkflow` did not already read and writes nothing.
**Nothing at REJECTED level.**

---

## 5. KILL-SET CONTAINMENT, MEASURED RATHER THAN ASSERTED

Over PRODUCER mutants the two new bodies are inseparable: every ci.yml landing above
that reds one reds the other, because the fixture body opens with the live keeper's
own assertion as its control. The separation exists only on the spec side, and I
reproduced it rather than taking the executor's word: landing
`if (false && !/\bexit 1\b/.test(run)) {` inside `diskFloorProblems` reds the FIXTURE
body **alone** (1 failed, 21 passed). So the live keeper's kill set is CONTAINED in
the fixture's. **I do not call that a defect**: it is the file's own standing idiom
(seven keeper bodies and thirteen `FIXTURE:` bodies before this diff), the keeper is
the body whose NAME becomes the sentence in docs/CAPABILITIES.md, and the executor
disclosed the containment instead of engineering around it. It is the reason
CORRECTION 2 is about that NAME.

---

## 6. THE ASSIGNED CORRECTIONS

**CORRECTION 1 — the "step 4 (fence)" attribution is false, in two committed
comments.** Both `.github/workflows/ci.yml` (the T-278 block above the floor step)
and `tools/e2e/tests/workflow-parity.spec.ts` (the section comment above
`LANE_STEP`) say the first red body was *"reporting the arm's step 4 (fence) exiting
3"* in every one of the runs. Re-derived from the four attempt logs with
`grep -o 'the dispatch stopped at step [0-9]* ([a-z]*)'`:

| attempt | the arm's step it stopped at |
|---|---|
| 34300080330 attempt 1 | step 4 (fence) |
| 34300080330 attempt 2 | **step 6 (bench)** — `fatal: cannot create directory at '.claude/hooks'` |
| 34304932475 | **step 6 (bench)** — `.git/worktrees/nputer-V-T-901/refs` |
| 34306871214 | step 4 (fence) — `ENOSPC: no space left on device, write` |

Two of four are step 6. The card's own table is correct; only the two comments
generalise. Fix: name both steps, or drop the step number and say the arm stopped
inside its ritual. (The commit message carries the same sentence and is a record —
it is not rewritten.)

**CORRECTION 2 — the live keeper's NAME claims a property it does not derive, and
that name becomes a line in docs/CAPABILITIES.md.** The body is called *"the
runner's disk is read on both sides of the e2e lane, behind a floor that can
fire"*. What `diskGuardProblems` derives about firing is `/\bexit 1\b/.test(run)` —
the presence of a token. Demonstrated against an implementation that lacks the
property: the one-line landing
`if [ "$free_kib" -lt "$floor_kib" ] && false; then` leaves **all 22 parity bodies
green (exit 0)** while the same step's shell, extracted through the YAML parser and
run at a 900 MiB stub `df`, **exits 0** — the floor cannot fire and the census
sentence still ships. CLAUDE.md sends every session to that census first. Discharge,
either: (a) narrow the body's name to what it derives — the step exists, is placed
against the lane, reads both filesystems, states its floor once and carries an
`exit 1`; or (b) give the body the executing arm, which is a dozen lines: pull the
step's `run` out of the parsed workflow, write a stub `df` into an `mkdtemp` dir,
and assert `bash` exits 0 one value above the floor and 1 one value below.
**I ran arm (b) both ways before proposing it** — 4.0G and 12G exit 0, 900M and 500K
exit 1, boundary 2097152/2097151 exit 0/1, and against the `&& false` implementation
it exits 0 at 900M, so the arm reds exactly where the property is absent.

**CORRECTION 3 — the clone census says three and lists four.** The Implementation
notes read *"exactly three `git clone` call sites"* and then enumerate
`brief.spec.ts:2296` and `:2306`, `session-economics.spec.ts:202`,
`checkout-currency.spec.ts:289`. That is four, and four is what a grep at this tip
finds. The conclusion is unaffected and correct; the figure is not.

**CORRECTION 4 — record the reading taken of criterion 2's "before any suite
runs".** The floor is at step index 24; the parser (9), app (14) and cargo (15)
suites precede it. The card's later measurement section re-asks for a reading
"before and after the e2e lane" and that is what landed, correctly — but a reader of
the criteria list is left to discover the divergence. One sentence in the
Implementation notes saying which of the card's two askings was built, and why the
job head would measure the wrong moment (mutant M3's own message), closes it.

**None of the four is a defect in what the guard DOES.** Two are prose, one is a
figure, and CORRECTION 2 is a body name.

---

## 7. FINDINGS THAT ARE NOT CORRECTIONS

- **The ground file's df claim is a false positive** (§3). Recorded for the seat:
  the runner's free disk has never been printed, and no verdict on this card could
  have settled the floor's sizing by measurement.
- **Four one-edit survivors** (M4, MCOE, MSHELL, MREDIR) — filed as `T-278-s5`
  rather than argued here, because the criterion asked the spec to pin the new step
  the way it pins the others, and the apt step survives the same mutation class.
- **The pair cannot name a fill that happens DURING the lane** — filed as
  `T-278-s4`. The measurement says that is not the case that happened.
- **The executor's report says "two test bodies were added and one renamed".** The
  spec's diff is +309/-0, so no existing test name moved. The census is stale by two
  ADDED bodies only.
- **T-271 was cited as authority for a scoped suite set and is `status: planned`**
  (§1). Discharged here.

---

## 8. WHAT I MEASURED AT MY OWN TIP — verifier.md step 7

Steps 5 and 6 are writes: this verdict and two suggestion cards, all prose. Prose is
a code input here, so the gates my own commits can move were re-run at the commit I
CREATED, not at the one I was sent, and their exits are recorded in the report
accompanying this verdict. **Every figure in §1 is stamped at `4327aff`** and is
stale at my own tip by exactly the three files I wrote — none of which any suite
counts as a body.
