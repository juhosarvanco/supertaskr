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
