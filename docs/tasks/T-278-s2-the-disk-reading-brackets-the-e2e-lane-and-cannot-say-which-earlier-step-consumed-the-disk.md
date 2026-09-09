---
id: T-278-s2
title: "The job now reads the runner's disk around the e2e lane and still cannot say which step consumed it — a red floor names the lane, never the apt install, the cargo target or the browser download that filled the disk"
feature: F-04
milestone: 4
size: S
priority: 2
status: verifying
suggested_by: "executor claude-opus-5@subagent @T-278, 2026-09-09, at 6fe5a23"
blocked_by: []
touches: [.github/workflows/ci.yml, tools/e2e/tests/workflow-parity.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
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
