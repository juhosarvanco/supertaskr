---
id: T-278-s2
title: "The job now reads the runner's disk around the e2e lane and still cannot say which step consumed it — a red floor names the lane, never the apt install, the cargo target or the browser download that filled the disk"
feature: F-04
milestone: 4
size: S
priority: 2
status: done
suggested_by: "executor claude-opus-5@subagent @T-278, 2026-09-09, at 6fe5a23"
blocked_by: []
touches: [.github/workflows/ci.yml, tools/e2e/tests/workflow-parity.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review:
---

T-278's pair of steps answers "was there room for the lane" and "what
did the lane spend". Neither answers the question the four ENOSPC runs
actually raise, which is what filled a runner that starts the job with
room: between the checkout and the lane the job installs six apt
packages (268 MB by its own log), restores a cargo cache and builds a
target, installs three node trees, builds the app bundle and downloads
Chromium with its deps (79.5 MB by its own log). When the floor fires,
the seat learns the lane could not run and nothing about which of those
grew. A reading at job start — or a `df` delta emitted after each
heavy step — would attribute it. Held back from T-278 deliberately: its
criteria name two steps, and a third is a different claim.

Class parent: T-278. Disposition hint: park behind T-278-s1 — decide it
with the first real headroom figure in hand, since a runner with 20 GiB
free needs no attribution and one with 3 GiB needs it badly.

## Corroboration (the architect seat, 2026-09-09T09:10Z)

Run 34332162937 on c8d49b3 is this card's claim, observed: the floor fired at 184 MiB free (the three runs before it read 4.3 GiB at the same step; the diff between them is docs-only; the cargo and playwright caches hit the same keys at the same sizes in both; the one differing input is the runner image — 20260831.293.1 against the green runs' 20260907.300.1), and the log cannot attribute the 4.2 GiB to any of steps 3–25 because nothing reads the disk between them. T-278-s1's second reading carries the figures.

## Amendment (the architect seat, 2026-09-09T09:33Z, after the second consecutive red at the floor)

Run 34334103318 on cc41ff3 fired the floor again at 188,156 KiB free on image 20260831.293.1 — the same image and the same figure as run 34332162937 — so the condition is not one runner's bad day: main is red on CI on every push until the job either gets the newer image back or makes its own room. Attribution alone (the criteria above) leaves main red. These criteria are added, under @human's ruling of 2026-09-09 that cards sharing a fence are one lane (T-284), so the remedy and the attribution land together:

- WHEN the job reaches the e2e lane on an image that arrives below the floor THE job SHALL have freed the runner's disk BEFORE the floor is read — by removing preinstalled toolchains this workflow never invokes (the candidates, each measured with `du -sh` in the step's own log before removal: the .NET SDKs, the Android SDK, the Haskell toolchain, CodeQL bundles, Swift, and the docker images the image ships) — and the step SHALL print `df` before and after with the bytes it freed, so the reading in the log is the remedy's own measurement.
- WHEN the free-disk step runs THE step SHALL be idempotent and SHALL NOT remove anything under the checkout, the caches this workflow restores, `~/.cargo`, `~/.npm`, `~/.cache/ms-playwright`, or the toolchains the job invokes (node, rust, cargo-audit, the Tauri prerequisites); a candidate that is absent on the image SHALL be skipped with one line, never an error.
- WHEN the free-disk step and the floor step are read together THE floor SHALL remain the floor (2 GiB until T-278-s1 re-derives it), the free-disk step SHALL sit before it, and the workflow-parity spec SHALL pin the order and the protected paths, seen red on a ci.yml that lacks the step and on one that lists a protected path among the candidates.
- WHEN the first run after this lane's merge completes THE seat SHALL read the freed bytes and the free-at-floor reading from its log and append them to T-278-s1 as the fourth reading, on either image.

## Implementation notes (executor claude-opus-5@subagent, 2026-09-09)

Two arrangements landed in `.github/workflows/ci.yml`, and one section
in `tools/e2e/tests/workflow-parity.spec.ts` keeps both. The workflow
went from 24 steps to 40; nothing that was there was rewritten.

### 1. The ledger — the attribution the card's original body asked for

Eleven identical readings, one after every step that can consume the
runner's disk, plus one at job start that prints `ImageVersion` beside
the figure. **The reading carries no label of its own**: the STEP NAME
is the label, which is how `gh` and the log group it already, and a
reading that re-states its own site is a second place for that site's
name to go stale. What attributes is the INTERVAL between two
consecutive readings.

Which steps owe one is DERIVED, never listed — a step whose `run`
matches `apt-get install|npm ci|cargo test|cargo install|playwright
install`, or whose `uses:` is `actions/cache` or `actions/setup-node`.
Ten such steps at this ref. A heavy step added tomorrow without a
reading reds `diskLedgerProblems`; it is not a list anyone has to
maintain.

### 2. The free-disk step — the amendment's remedy

Immediately before the floor, which stays 2 GiB and stays where it was.
It removes the six candidate groups the amendment names, each measured
with `du -sh` in the step's own log before removal, `df -h /` before and
after, and the freed KiB printed between them.

**Both lists live in the step's `env:`, written once** —
`E2E_DISK_CANDIDATES` and `E2E_DISK_PROTECTED` — so the parity spec
derives the policy from the same bytes the shell runs. The protected set
is `${{ github.workspace }}`, `~/.cargo`, `~/.rustup`, `~/.npm`,
`~/.cache/ms-playwright`, `/opt/hostedtoolcache/node` and `/usr/lib`.

**The step refuses an overlap at RUN TIME as well as in the spec**, and
that is not belt-and-braces for its own sake: this spec's red arrives
from the e2e lane, which runs AFTER this step, so a bad edit would have
deleted `~/.cargo` on the very run that reports it. The spec's job is to
red the COMMIT; the script's job is to make the harm impossible. It also
refuses a candidate naming fewer than two path segments, which is the
one-character-from-the-root class.

**It never exits non-zero.** Freeing disk is not a gate — the floor
immediately after it is, and what the floor reads is the disk this step
leaves.

### The candidate list is the IMAGE'S, and the manifest is named

Read from `actions/runner-images` at the tag the two red runs report:
`gh api repos/actions/runner-images/contents/images/ubuntu/Ubuntu2404-Readme.md?ref=ubuntu24%2F20260831.293`,
which prints `Image Version: 20260831.293.1` — the version in run
34332162937's and run 34334103318's own `Set up job` group. It carries
eleven .NET SDKs, the Android SDK with two NDKs, GHC 9.14.1 + GHCup,
CodeQL Action Bundle 2.26.4, Swift 6.3.3, five JDKs and PowerShell
7.6.5. Every step of ci.yml was read before the list was chosen: this
job invokes apt, node, npm, cargo, cargo-audit, playwright and xvfb, and
nothing else — no dotnet, no java, no ghc, no swiftc, no container.
`/usr/lib/jvm` and PowerShell were deliberately left (T-278-s7).

### What NO seat could measure here, said plainly

**The freed bytes.** They are a property of the runner and no local run
produces them. The step's own `df` pair is the instrument; the first run
after this merges is the reading, and it is the amendment's last
criterion — T-278-s1's fourth reading, on either image. The same holds
for the step's wall cost (T-278-s7).

### The demonstration the amendment asked for

Each of the five new bodies was SEEN RED against a real
`.github/workflows/ci.yml` carrying the mutation, not only against an
in-memory fixture. Three mutants, run one at a time, restored from a
pristine copy and verified by sha256 (`02292f3f4fbafcf3…155de3f7`,
MATCH after each of the three):

| Mutant | Bodies red |
|---|---|
| the free-disk step deleted | `the runner's disk is freed before the floor…`, `FIXTURE: six one-edit mutants…`, `THE EXECUTING ARM…` (3 failed / 24 passed) |
| `/usr/lib/jvm` added to the candidates | `the runner's disk is freed before the floor…`, `FIXTURE: six one-edit mutants…` (2 failed / 25 passed) |
| a ledger reading deleted | `every step that can consume the runner's disk…`, `FIXTURE: four one-edit mutants of the ledger…` (2 failed / 25 passed) |

Every new body appears at least once. The in-memory fixtures carry ten
more one-edit mutants (four for the ledger, six for the free-disk step),
each asserted to red on EXACTLY ONE property.

### For the verifier

- `capabilities:check` is **STALE by design and not repaired here**:
  committed 65,947 bytes against a fresh generation of 66,685. Adding
  five e2e bodies necessarily stales the census, and T-201 ruled that
  regeneration is the INTEGRATOR's at the merge commit — the lane
  reports the reading rather than reaching outside its fence.
- The executing arm overrides BOTH env keys with sandbox paths and stubs
  `sudo` and `docker` on PATH, so no line of it can reach
  `/usr/share/dotnet` or a docker daemon. **The real candidate list is
  never executed anywhere**; it is the static derivation's to police.
- `diskGuardProblems` is untouched. The floor's name, its `env:`, its
  position immediately before the lane and the `always()` on the after
  reading all still derive exactly as T-278 left them.

### Noticed, not done

T-278-s6 (the step's placement is the LATEST the criterion allows, and
every install and build in the job still runs on the disk the image
arrived with), T-278-s7 (two large candidates left on the table, and the
step's unconditional wall cost), T-278-s8 (the free step measures `/`
while the floor judges `.` and `/tmp`, and nothing asserts they are one
filesystem — measured as one in run 34334103318, unasserted anywhere).

### Correction, at the lane's own second graded run

The first graded `gate-run e2e` at 297a1a9 came back **RED, 4 of 769**,
and every one of the four was `shell-frame.spec.ts` reporting
`parse-error-details` — *Expected: 60, Received: 61*. The cause was this
lane's own T-278-s8, filed with `size: XS` against a parser vocabulary
of `S | M | L`. One card that would not parse, four bodies red three
layers from it, and `npm run lint:docs` exit 0 in between — because the
docs gate checks a card's `status:` and nothing else. Fixed here (`XS`
to `S`); the gap is filed as **T-286**, which is the same class the DOCS
GATE bullet already carries two instances of and now has a third.

**Correction (the integrator, 2026-09-09, assigned by the verifier as C4):** the line above says the workflow "went from 24 steps to 40"; the base 2e9233d has 28 steps, not 24, and the lane added twelve (eleven ledger readings and the free-disk step). Derived with `node -e 'const{readFileSync}=require("fs");const{parse}=require("yaml");console.log(parse(readFileSync(".github/workflows/ci.yml","utf8")).jobs.linux.steps.length)'`: 28 at 2e9233d, 40 at b1c0a0c. The figure above stands as written; this line is the record.

## Verdicts

### 2026-09-09 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent (verifier, phase 2)

Tip judged `b1c0a0c03529fe86fd1dcf3d9061b848fbc7fcb4`, base `2e9233dc48e172401ddd0137688b0fa8dea07a58`, on the detached bench `../nputer-V-T-278-s2`. The lane worktree was never written to and nothing was pushed.

**The sealed frame, cited by hash** (all three verified with `shasum -a 256` before anything else was opened; all three MATCHED):

- `sha256:445e0e535be3eccfe83e531efd14afedea5e9773f8c5f14245a5884bc89e2ca6` — phase 1's attack set, written tool-less by instruction at the base
- `sha256:94a49fa97d97291775301843be6c572b7984e5b8784564be45e04be0ab4a9b70` — the ground truths at the base
- `sha256:725a397082217391d267b936efeeb3077bc277c313fe0127c7153e858560cbe7` — phase 1's §1 items 1 to 13

**WHICH FRAME I ACTUALLY HAD** (verifier.md step 0 requires this said plainly):

- Phase 1 and phase 2 are separate spawns. Phase 1 kept its blindness by instruction, not by a harness that can deny tools (T-261).
- **This brief carries NO CONTEXT PACK.** verifier.md calls that a dispatch fault and says the document is then read whole. I did not read `docs/CONVENTIONS.md` end to end: I read it by the bullets the brief named — DOCS GATE, THE BLESSED GATE-RUNNER, the CI bullet, the PORT and SCRATCH rules — plus the CI bullet's neighbours. My CONVENTIONS read was bullet-scoped, and I say so rather than claim the read the no-pack case calls for.
- **The brief leaked executor-derived specifics into my duties section** — it names the report's own figures (24 steps to 40, 22 bodies to 27, e2e 769 / parser 389 / app 1171, five bodies seen red, the census stale by five). It flagged each as a claim to re-measure and I re-measured every one, but verifier.md is explicit that a brief naming executor-derived specifics has already broken phase 1 above the line, so I record it rather than pretend I did not read it. My attack set was written at the base, before any of it.
- The brief described this tip as the `status: verifying` stamp with a one-status-line diff. It is not: `b1c0a0c` is a substantive commit (3 files, +91) that files T-286 and corrects this lane's own T-278-s8 from an illegal `size: XS`; the status stamp sits inside it. Named because a frame difference is not a finding but is not nothing either.
- The brief says main has been red at the floor on three runs since 08:59Z; the hashed ground truth records **two** (34332162937, 34334103318). I judged on the hashed record, and the diff cites exactly those two.

**THE ENVIRONMENT, SAID PLAINLY.** The freed bytes cannot be measured on this Mac. Every script-level control below ran in a sandbox with `sudo`, `rm`, `du`, `df` and `docker` stubbed on PATH, following the existing floor keeper's own stubbing technique. **NO REMOVAL WAS EXECUTED ANYWHERE** outside a scratch directory I created for the purpose; the one probe that used a real `rm` operated only on paths beneath that directory. **I did not measure the freed bytes and neither did this lane.** The first CI run after the merge is the seat's reading, and it is T-278-s1's fourth.

---

#### What holds

**The fence is clean.** `git diff --name-only 2e9233d..b1c0a0c` is exactly `.github/workflows/ci.yml`, `tools/e2e/tests/workflow-parity.spec.ts`, this card, and four new cards under `docs/tasks/`. No file of T-271, T-279, T-281 or T-282 is touched; `f.txt` and `g.txt` do not appear. The method stamp stays **0.1.12** at both live sites (`docs/CONVENTIONS.md:528`, `app/src-tauri/src/agent/kit.rs:37`), and `method/`, `app/src-tauri/` and `docs/CONVENTIONS.md` are untouched by the range.

**Nothing that was there was rewritten.** `ci.yml` is `180 insertions, 0 deletions`. The floor step's derivation comment, its name, its `E2E_DISK_FLOOR_GIB: "2"` and its error title all survive byte for byte.

**A1 MET.** The step exists, immediately before the floor; `du -sh` runs per surviving candidate before removal; the block opens and closes with `df -h /`; the freed figure is arithmetic over `df -Pk` column 4, and the sign is right (available after minus available before).

**A2 MET.** Every candidate is absolute and quoted at the `rm` site; `sudo rm -rf "$candidate"` sits inside a `for` whose word can never be empty and is reached only when the refusal is empty and `[ -e ]` is true; the script contains no `exit`. The `~` hazard the attack set names is handled correctly — `guarded=${guarded/#\~/$HOME}` expands the protected entries, so `~/.cargo` is compared as a real path and not as a directory literally named `~`.

**A3 MET, and I reproduced both required reds myself** rather than taking them on the diff's word, as data mutants on a real `ci.yml` in a `git clone --shared` under my scratch (never the lane's tree):

| the required red | what died |
|---|---|
| a `ci.yml` lacking the step (M1) | `the runner's disk is freed before the floor reads it…` (:1637), its FIXTURE (:1646), `THE EXECUTING ARM…` (:1745) |
| a `ci.yml` listing a protected path among the candidates (M4, `~/.cargo`) | `the runner's disk is freed before the floor reads it…` (:1637), its FIXTURE (:1646) |

**Both deaths are at the site the property lives.** I checked for the failure mode first: this spec carries **no whole-file snapshot, byte-count or hash body over `ci.yml`**, so no data mutant kills a body for free and the kill sets are real rather than an illusion.

**A4 correctly NOT claimed.** Nothing in the diff asserts a measured freed-byte figure. I swept the added lines for one and found none; the only run ids anywhere in the diff are 34332162937 and 34334103318, both corroborated by the hashed ground truth, and the step's own comment says the freed figure "is a property of the runner, and no local run produces it."

**The original prose — attribution — MET on BOTH arms.** The prose offered a job-start reading *or* a per-heavy-step delta; the lane shipped both. Eleven readings, identical at every site, the step name as the label, the first printing `ImageVersion`. And the ledger is **derived, not listed**: `diskLedgerProblems` classifies which steps owe a reading from the steps' own text, with a zero-census guard on *both* sides so an empty classification reds instead of making every check below vacuous — the T-211 shape, defended.

**THE PLACEMENT QUESTION, which my attack set pre-committed to before seeing a line.** I ruled in advance that "SHALL sit before it" is a floor on placement and not a ceiling; that I would not reject for late placement alone; and that I *would* reject if late placement shipped with a claim that it makes main green. The step sits at index 35, immediately before the floor at 36 — the late placement. No claim of a green main is made anywhere in the diff, and **the lane filed T-278-s6 naming exactly this limitation** and the ledger as the instrument that decides it. The condition I set for a rejection is not met, and the suggested card I would have filed already exists.

**The security sweep, all twelve items of my §5 — CLEAN on the shipped diff.** No candidate reaches the checkout, a home or a cache; no `rm -rf` on a variable that can be empty; **no `${{ }}` anywhere inside the step's `run:`** (the one expression sits in `env:`, the sanctioned form — and injecting one into `run:` reds four bodies); the candidate list is **inlined in `ci.yml`, never read from a file in the checkout**, so the immediate-reject shape is absent; docker is guarded by `command -v`, carries `|| echo`, and is scoped to `image prune -af` on a job the ground truth confirms declares no container, service or docker step; the hostedtoolcache **root** is not a candidate and `/opt/hostedtoolcache/node` is protected and derived-checked; `/usr/lib/jvm` is deliberately left alone with its reason stated, which is more conservative than the evidence required. `sudo` without `-n` is noted and is cosmetic on a hosted runner.

**The cache race is derived rather than trusted.** `freeDiskProblems` walks every `actions/cache` step's own `path:` and requires the protected set to cover it, plus `setup-node`'s `cache: npm` implying `~/.npm`. `app/src-tauri/target` canonicalises under `<workspace>` and is covered.

**Controls, each shown failing with its arming absent before I trusted it passing:**

- **C1** — the protected-paths body is not vacuous: with the step deleted the derivation returns early and reds on absence rather than passing over a step that is not there.
- **C2** — the order body is not one-sided: with the floor deleted it reds naming the floor's absence.
- **C6** — the T-278 floor keeper still passes at the tip and still bites: rewording the error title reds `:990`; moving the floor from 2 to 1 reds `:990` and `:1055`.
- **C7** — `-Pk` is independently pinned: parsing the after-figure from `df -h` kills only `THE EXECUTING ARM` (:1745) while dropping the freed line kills three bodies, so the kill sets differ. Worth knowing that `-Pk` is pinned by the executing body alone and by no static check.
- **C8 — VOID, and I report that rather than invent a band.** The ground truth shows `DOC_BUDGETS` bands four documents and `grep -c 'ci.yml' docs-scan.mjs` is 0. `ci.yml` is not banded, so the brief's byte-budget concern does not apply to this diff.
- **MY OWN CONTROL FAILED FIRST AND I RECORD IT RATHER THAN SMOOTH IT.** My sandbox probe passed the protected list as `prot="${3:-$PROT}"`, so handing it an *empty* list substituted the default instead — one arrangement deciding both the subject's answer and the control's, the exact defect verifier.md 2b names. Corrected to `${3-$PROT}` and re-run: with the arming **absent** the same candidates print `STUB-RM WOULD REMOVE: -rf /home/runner/work` and `-rf /home/runner`; with the lane's list present both are `REFUSED`. Only then is the run-time guard shown to be load-bearing.
- **Idempotence, demonstrated with a real `rm` confined to my sandbox root**: first run removes, second run prints `absent on this image, skipped` for all three candidates and exits 0.

**The suites at my own tip**, through the blessed runner from the bench root, `SUPERTASKR_E2E_PORT=25278`, all at ref `b1c0a0c`:

```
gate-verdict suite=parser exit=0 bodies=389  targets=1  verdict=GREEN reason=ok
gate-verdict suite=app    exit=0 bodies=1171 targets=1  verdict=GREEN reason=ok
gate-verdict suite=rust   exit=0 bodies=654  targets=18 verdict=GREEN reason=ok
gate-verdict suite=e2e    exit=0 bodies=769  targets=1  verdict=GREEN reason=ok
```

`workflow-parity.spec.ts` run alone first: **27 passed, exit 0**. The census reads STALE (committed 65,947 bytes against a fresh 66,685) — expected, and the integrator's at the merge under T-201, not a finding against this lane.

---

#### Corrections assigned

Four. Three are one-line-class additions to `freeDiskProblems` in `tools/e2e/tests/workflow-parity.spec.ts`; the fourth is a false figure in this card. **Every proposed body below I ran myself against the lane's own `ci.yml` (it is CLEAN — none of them reds the shipped file) and against a `ci.yml` that lacks the property (each reds).** They are given verbatim so the integrator can lift them.

**CORRECTION 1 — a candidate written as the runner's LITERAL path overlaps nothing in the derivation.** `canonical()` folds `${{ github.workspace }}` to `<workspace>` and `~/…` to `<home>/…`, which is exactly what makes the two lists comparable — and exactly why `/home/runner/work` and `/home/runner` pass the static check. I measured both: **the spec answers 27 passed on each**, while the step's own shell refuses both at run time. So the runner is protected and the COMMIT gate is not, which inverts the two-layer design the step's own comment argues for. Add to `freeDiskProblems`, beside the existing candidate loop, with `const RUNNER_HOME = "/home/runner";` declared next to `WORKSPACE_EXPR`:

```ts
  // THE LITERAL SPELLING OF A TREE THE PROTECTED SET NAMES SYMBOLICALLY.
  // `canonical` folds `~` and `${{ github.workspace }}` to <home> and
  // <workspace>, which is what makes the two lists comparable — and it is
  // why a candidate written as the runner's OWN literal path overlaps
  // nothing above. Measured: `/home/runner/work` and `/home/runner` both
  // derive clean here while the step's shell refuses both at run time,
  // so without this the commit gate is the unprotected layer.
  for (const c of candidates) {
    if (c === RUNNER_HOME || c.startsWith(`${RUNNER_HOME}/`)) {
      problems.push(
        `\`${c}\` is a removal candidate under the runner's own home. The protected ` +
          "set spells that tree symbolically — `~` and `${{ github.workspace }}`, which " +
          "this derivation folds to <home> and <workspace> — so a candidate written as " +
          "the runner's LITERAL path overlaps nothing above while reaching the checkout " +
          "and every cache the job restores. The step's shell refuses it at run time; " +
          "this is the commit-time half of the same refusal.",
      );
    }
  }
```

**CORRECTION 2 — a glob candidate is expanded before any guard sees it, and this is the one finding with real blast radius.** `for candidate in $E2E_DISK_CANDIDATES` is an UNQUOTED expansion, so the shell globs first and the loop body then judges the expansions one at a time. I measured `/usr/*` in the sandbox: `/usr/lib` is `REFUSED` and **`/usr/share` is removed** — on a real runner the same list reaches `/usr/bin`. And the spec does not see it: adding `/usr/*` to the candidates answers **27 passed**. Neither layer refuses the class. Add to `freeDiskProblems`:

```ts
  // A GLOB IS NOT A PATH. The step loops an UNQUOTED
  // `$E2E_DISK_CANDIDATES`, so the shell expands a pattern BEFORE any
  // guard in the loop body runs: `/usr/*` arrives as /usr/bin, /usr/lib,
  // /usr/share … each judged on its own, and every sibling the protected
  // set does not happen to name is removed. Measured in a sandbox with a
  // stubbed `rm`: `/usr/*` refuses /usr/lib and removes /usr/share.
  for (const c of candidates) {
    if (/[*?[\]]/.test(c)) {
      problems.push(
        `\`${c}\` carries a glob character. The step loops an UNQUOTED ` +
          "`$E2E_DISK_CANDIDATES`, so the shell expands the pattern BEFORE any guard " +
          "in the loop body runs: `/usr/*` arrives as /usr/bin, /usr/lib, /usr/share … " +
          "each judged on its own, and every sibling the protected set does not happen " +
          "to name is removed. A candidate is a path, written out.",
      );
    }
  }
```

**CORRECTION 3 — the free-disk step can be switched off by a key and the derivation never reads it.** `if: false` on the step answers **27 passed**: the step is found by name, the candidates still derive clean, and no work happens. This is the same shape `diskGuardProblems` already refuses next door on the after-reading's `always()` — the file looks complete and the measurement is gone. Add to `freeDiskProblems`, after `const free = steps[found]!;`:

```ts
  if (free.if !== undefined) {
    problems.push(
      `\`${String(free.name)}\` carries \`if: ${String(free.if)}\`. The step that makes ` +
        "the room the floor reads has no condition to be under, and a guard that a key " +
        "can switch off is the shape `diskGuardProblems` already refuses on the " +
        "after-reading's `always()`: the file still looks complete and the work is gone.",
    );
  }
```

**CORRECTION 4 — a false figure in this card's implementation notes.** The notes say the workflow "went from 24 steps to 40". The base has **28** steps, not 24; the lane added twelve (eleven ledger readings and the free-disk step). Derive, at either ref:

    node -e 'const{readFileSync}=require("fs");const{parse}=require("yaml");
      console.log(parse(readFileSync(".github/workflows/ci.yml","utf8")).jobs.linux.steps.length)'

giving **28 at `2e9233d`** and **40 at `b1c0a0c`**. Replace "went from 24 steps to 40" with "went from 28 steps to 40". While there: the new spec comment at `diskLedgerProblems` says 4.2 GiB "went unattributed across twenty-two steps"; the base floor sits at index 24, so twenty-three steps stand between the checkout and it. That one is rhetorical rather than asserted and the integrator may leave it; the 24 is a figure a later reader would take as derived.

**Not a correction, recorded for the integrator:** this card's `built_by:` is empty at `status: verifying`. No gate asks for it and I do not block on it; the convention on `done` cards fills it.

---

#### What I could not fault, and what I checked that survived

Twenty-seven data mutants were applied to a real `ci.yml`, each landing confirmed from `git diff --numstat` before any red or green was believed. Twenty-two died. Five survived: the four above (M4e, M4f, M21/M21b, M14) and one more —

**`continue-on-error: true` on the FLOOR step answers 27 passed, and it defangs the floor entirely.** I checked whether this lane introduced it: applied to the **base** `ci.yml` against the **base** spec it answers **22 passed**. It is **inherited from T-278 and is not this lane's to carry**, so it is filed as T-278-s9 rather than assigned here.

The count I judged on is kill-set containment, never the total: M8 (freed line dropped) and M9 (`-Pk` to `-h`) have different kill sets, so neither is a restatement of the other; M1 and M4 die on different messages within the same derivation; M23 and M24 separate the ledger's coverage property from its uniformity property; and each of the lane's own ten in-memory mutants asserts `toHaveLength(1)`, which I confirmed is a real constraint by watching M16 (a step inserted between the free-disk step and the floor) red on the adjacency check while `the workflow runs nothing beyond the derived commands` reds beside it.

The order assertion is **adjacency** (`found !== floorIndex - 1`), which is tighter than the criterion's "SHALL sit before it". The lane argues why in place — the disk the floor judges must be the disk this step left — and M16 shows the tightness is deliberate rather than accidental. I record it as a strength, not a defect.

---

#### Cards filed

`T-278-s9` and `T-278-s10`, both `status: suggested`, both with `suggested_by` and `touches`. Neither is a failure and neither withholds this approval.

Signed **claude-opus-5@subagent (verifier, phase 2)**, 2026-09-09.

#### Step 7 — the gates my own commits could move

The verdict and the two cards are prose, and prose is a code input here. My
commits touch only `docs/tasks/`, so `rust` cannot move and the other three
can. Measured at my own tip `e9eed1d`, after the verdict commit `a24bdd4`:

- `docs-gate.mjs` on the three paths I wrote — exit **1, FIRES** (suites
  owed, the normal answer for a card write). **Every live task card's
  frontmatter parses, with a legal status**; governing-document budgets
  hold, 4 gated, 0 awaiting a landing; injection scan 0 hits in 3 paths
  against 7 patterns, advisory.
- `gate-run.mjs parser` — `exit=0 bodies=389 ref=e9eed1d verdict=GREEN`.
- `gate-run.mjs app` — `exit=0 bodies=1171 ref=e9eed1d verdict=GREEN`.
- The e2e bodies the docs gate itself names as readers of `docs/tasks/` —
  `cli`, `landing-gate`, `push-checks`, `shell-frame`, `window-contract` —
  **108 passed, exit 0**. `shell-frame` is where this lane's own illegal
  `size:` surfaced as "Expected 60, Received 61", so it is the one that had
  to be asked after two cards arrived.

Both counts are unchanged from the reading at `b1c0a0c`, which is the
answer I wanted and not one I assumed: two new cards moved no body count.
The full `e2e` leg was measured at `b1c0a0c` (769, GREEN) and not re-run at
`e9eed1d`; what I ran instead is the reader set the gate names, and I say
which rather than imply the whole suite.
