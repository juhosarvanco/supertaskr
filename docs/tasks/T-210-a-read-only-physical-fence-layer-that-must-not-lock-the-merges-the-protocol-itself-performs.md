---
id: T-210
title: A read-only physical fence layer catches the bash hole a PreToolUse hook provably cannot — and as first proposed it EACCES-fails the checkpoint sync the same design depends on
feature: F-06
milestone: 4
priority: 3
size: M
status: verifying
blocked_by: [T-212]
touches: [tools/e2e, method/lane-protocol.md]
suggested_by: "peer session nputer-10's enforcement stack (relayed 2026-08-31, approved in direction by @human); the self-violation found by this seat's flag and then sharpened by nputer-10 into the event list below"
builder:
review: independent
---

**THE HOLE IS REAL AND ALREADY PROVEN UNPARSEABLE.** A PreToolUse hook
sees a Bash command as a string. `T-025-s4` established that deciding
what an arbitrary shell command will write is not a parsing problem this
project will win. So a lane can write outside its fence through bash, a
script, or a build tool, and the hook cannot know.

**A read-only tracked file answers mechanically what no parser can.**
`chmod` the out-of-fence tracked files in a lane worktree and a stray
write fails with `EACCES` — from the filesystem, needing no intent
analysis, covering every writer equally.

## AND AS FIRST PROPOSED IT BREAKS THE PROTOCOL THAT PROPOSED IT

This seat flagged the layer against git generally: checkout, merge and
stash all write tracked files, so a lane switching base could take an
`EACCES` from the guard rather than from a real breach — **a guard that
reds honest work.**

`nputer-10` then found the sharp instance, which is not a general worry
but a **self-violation**:

**The checkpoint sync (fast path B) IS a git merge writing tracked files,
and the files it most needs to write are EXACTLY the ones chmod locked.**
B's landed changes are by definition outside A's pre-widening fence —
that is what makes the sync necessary. So the physical layer would
`EACCES`-fail the very fast path the enforcement stack is built to
enable.

**Layer (a), the landing gate, carries correctness alone in the
meantime**, which is why the stack ordered it first and why this card is
`blocked_by: [T-212]` rather than racing it. (At filing this pointed at
`T-203`, which was to be amended to carry the gate; the gate is `T-212`
now, split out so the token gate stays dispatch-ready — the blocker
points at the thing itself.)

## The event list — what re-chmods, and when

The self-violation is what gives this card a spec instead of a wish:

1. **APPLY at `--write-fence`**, from the manifest just written.
2. **RE-APPLY after any fence widening.** The re-expand already rewrites
   the manifest — same moment, one event, no second trigger to forget.
3. **DROP ENTIRELY around a checkpoint sync**, and re-apply from the
   POST-widening manifest once the merge commit exists. Not a narrowing,
   not an exception list — the layer is off for the duration of a merge
   the protocol itself performs.
4. **CLEANUP IS WORKTREE REMOVAL.** Nothing needs sweeping at abandonment
   if removal is the event. `git worktree remove --force` does not care
   about mode bits; **a plain `remove` of a dirty tree might**, and that
   is a control this card owes, not an assumption it may make.

## What this layer does NOT cover, stated so it is not oversold

**A lane writing ANOTHER lane's worktree never appears in its own diff**,
so the landing gate cannot see it. That is the vector this layer covers
and the gate does not. Conversely the gate covers what this layer cannot:
content that lands through a path where mode bits were legitimately
dropped. **The layers cover each other's blind spots, and neither is
sufficient alone** — say so in the artifact, because a guard trusted
further than it measures is this project's most repeated defect.

## Acceptance criteria

- OUT-OF-FENCE tracked files in a lane worktree SHALL be read-only after
  `--write-fence`, and in-fence files SHALL remain writable.
- **A POSITIVE CONTROL SHALL prove an in-fence write still SUCCEEDS.** A
  layer that locks everything is indistinguishable from one that works.
- A BASH write outside the fence SHALL fail with `EACCES` — the case the
  hook provably cannot decide, and the reason this layer exists.
- **THE CHECKPOINT SYNC SHALL SUCCEED with the layer active**, proved by
  a body that arms the layer, performs a sync writing a previously
  out-of-fence file, and asserts the merge commit exists. Without this
  body the card ships the defect it was filed to fix.
- WORKTREE REMOVAL SHALL leave no read-only residue, with a control for
  the dirty-tree `remove` case named above.
- THE artifact SHALL state which vector each layer covers and which it
  does not.
- **This card is GUARD-CLASS**: `review: independent`, set at filing.
- Verification: headless.

## Read beside

`T-212` (the landing gate, which carries correctness until this lands and
which this card is blocked on), `T-203` (the token gate on the same
hook), `T-209` (the dispatch guard, same manifest), `T-199` (the UX
layer — the real-time refusal), `T-025-s4` (which established the bash
string as unparseable), and `method/lane-protocol.md:182`.

## A note on provenance

The enforcement stack came from peer session `nputer-10` with @human
driving the fast paths and the can-a-breach-be-made-impossible framing.
**The self-violation was found by flagging the proposal rather than
accepting it**, and then sharpened by the proposing seat into the event
list above. Recorded because a design that survives its own author's
attack is worth more than one that arrives approved.

## Implementation notes (executor, 2026-09-01)

Built in `/Users/ujju/Projects/nputer-T-210` on `task/T-210-lane`.
**Base DERIVED, not transcribed**: `git merge-base main HEAD` =
`aa7068761d7d4d40209eefb6f25cb410b11ed660`, which agrees with the
manifest's own `ref` and with `main`'s tip — main did not move while this
lane ran. Fence as expanded at dispatch: `method/lane-protocol.md` and
`tools/e2e`; `alwaysWritable` `docs/tasks`; `excluded` empty.

### What was built

- **`tools/e2e/scripts/lane-lock.mjs`** — the layer. `laneLockPlan` and
  `fenceAllows` (pure), `applyLaneLock`, `releaseLaneLock`,
  `laneLockStatus`, `readLedger`, plus a CLI
  (`--apply | --release | --status`, `--worktree <absolute>`). It
  re-spells nothing: containment is the hook's own exported `within`, the
  tracked corpus is `docs-scan.mjs`'s `trackedFiles`, the runtime
  directory is `gate-token.mjs`'s `armRuntimeDir`, and the exit codes are
  `dispatch-brief.mjs`'s `EXIT`.
- **`tools/e2e/scripts/brief.mjs`** — `--write-fence` arms the layer from
  the manifest it just wrote, prints the read-only/writable counts as
  STAMPED values, and prints the release command a sync will need. **One
  event covers two**: a widening IS this command run again (`T-211` fast
  path A), and the arm re-baselines rather than adding, so there is no
  second trigger to forget.
- **`method/lane-protocol.md`** — the artifact. Rule 5 gains the physical
  layer, the files-only rule with all three reasons, the coverage
  complement, and four measured limits; fast path B gains the drop/re-arm
  and the measurement below; the tripwire's holes paragraph is narrowed
  from "outside the write refusal" to "narrowed, not closed".
- **`tools/e2e/tests/lane-lock.spec.ts`** — **12** bodies
  (`grep -c '^test(' tools/e2e/tests/lane-lock.spec.ts`).

### THE MEASUREMENT THAT MOVED THE CARD

The card predicted the checkpoint sync would take an `EACCES` from this
layer. **Driven at git 2.50.1 (Apple Git-155) on macOS/APFS, it does
not.** Three merges onto a `chmod a-w` tracked file:

    fast-forward        exit 0, file rewritten, mode 444 -> 644
    non-fast-forward    exit 0, file rewritten, mode 444 -> 644
    conflicting         exit 1 (the conflict), markers written, 444 -> 644

An untouched locked file kept its 444 every time. git neither consults
nor honours the mode bit: it unlinks and recreates, and the new file
arrives at the umask default.

**So the self-violation is real and WORSE than predicted, in the
direction that costs.** An `EACCES` is loud and stops the sync; what
actually happens is that a sync **SILENTLY DISARMS** the layer on exactly
the files it most needed to hold — the out-of-fence ones the merge just
brought in — with no error, no output and nothing in `git status`. The
event list still holds, but **which half is load-bearing moves**: under
the prediction it is the DROP, under the measurement it is the RE-ARM.
`--status` exists because a guard a routine act removes must be askable,
and one body pins the platform fact, so a future git that starts
honouring the bit reds and says which half changed.

### The three reconciliations the dispatch demanded

1. **T-203's TOKEN MINT IS SAFE BY CONSTRUCTION, NOT BY EXCEPTION.**
   `.nputer/` is ignored by its own `.gitignore`, so no path under it is
   in `git ls-files` and none is ever a lock candidate; and **no
   DIRECTORY is ever locked**, so the runtime directory can still be
   created at the worktree root. A body mints a token through a shell
   under an armed layer, and the real-tree run below does it again. Had
   either half failed, nobody could mint a token and the push guard would
   refuse every push in the repository.
2. **`docs/tasks` STAYS WRITABLE IN EVERY STATE.** `fenceAllows` consults
   `alwaysWritable` FIRST and unconditionally, mirroring the hook's own
   lane arm. A body writes the lane's own card and files a fresh
   suggestion beside it, both through a shell, under the armed layer.
3. **T-228 IS NOT REPEATED PHYSICALLY, AND "HARDER OR EASIER" IS
   NEITHER — FOR A STRUCTURAL REASON.** This layer has no stamp term at
   all: its writable set is a function of the manifest alone, so no
   reordering inside `decide()` moves it. What it does contribute is that
   during T-228's window the two layers deliberately DISAGREE, and the
   disagreement favours the protocol's own bookkeeping — the hook refuses
   a write to `docs/tasks`, the filesystem permits it. **Stated plainly
   because it is uncomfortable: the workaround for T-228's window is now
   to file the finding through a shell, which is precisely the vector
   this card exists to close everywhere else.** It is safe because a
   write under `docs/tasks` can never be a fence breach by construction —
   T-228's own argument — and it is disclosed rather than left to be
   found. **The body that proves it probes the newly granted path and not
   the card**, deliberately, so it does not red the day T-228 lands.

### Poison drill ledger — kill-set CONTAINMENT, not the count

Drilled AT A COMMIT (`e7c277a`), one side mutated per run, each landing
read back from `git diff` rather than from the mutator's report, each
restore through `git restore --source=e7c277a --staged --worktree` and
**proven by sha256 against the commit — 8 of 8 matched.** The baseline
was asserted green first: a kill set measured against a red suite is not
evidence.

| # | site mutated | scope | kills |
|---|---|---|---|
| M1 | `fenceAllows` drops the `alwaysWritable` arm | spec | 5 |
| M2 | `fenceAllows` drops the `paths` arm | spec | 7 |
| M3 | the chmod stops clearing the write bits | **full suite** | **10 — every one in `lane-lock.spec.ts`; 481 passed elsewhere** |
| M4 | the re-baseline is skipped | spec | **1** — the widening body, exactly |
| M5 | `laneAt` stops requiring a lane branch | spec | **1** — the arms-lanes-only body, exactly |
| M6 | containment becomes prefix matching | spec | **1** — the pure-plan body, exactly |
| M7 | `releaseLaneLock` stops restoring modes | spec | 3 |
| M8 | `brief.mjs` stops arming the layer (THE WIRING ONLY) | **full suite** | **1 of 491 — the dispatch-step body; 490 passed** |

**EVERY ONE OF THE 12 BODIES IS KILLED BY AT LEAST ONE MUTANT**, so no
body is vacuous. Three containment facts carry more than the counts do.
**M3 ran the FULL suite and killed nothing outside this card's own
spec**, so the layer is new behaviour that perturbs no existing body.
**M8 severed only the WIRING and killed exactly one body of 491**, which
is what separates a body aimed at the dispatch step from one aimed at the
library. And **M4, M5 and M6 each kill exactly one body** — the aiming
property, where something dying elsewhere would have proved nothing.

### The real-tree dogfood — and the incident that came with it

Run against this lane's own worktree at `e7c277a`, arm to release:

    tracked files                     1119
    read-only (outside the fence)      576
    left writable (in fence + tasks)   543
    git status under the lock         CLEAN — mode bits are invisible to git
    stray `> docs/STATE.md`           permission denied, exit 1, sha unchanged
    in-fence `>> tools/e2e/…`         exit 0, landed, restored
    `> docs/tasks/.probe`             exit 0   (the unfenceable directory)
    `> .nputer/…`                     exit 0   (T-203's mint path)
    `npm ci` in lib/parser (OUT)      exit 0, lockfile sha untouched
    `--status`                        ARMED, 576 of 576, no drift, exit 0
    `--release`                       restored 576, exit 0
    after release                     0 non-writable tracked, status CLEAN

**`npm ci` IN AN OUT-OF-FENCE PACKAGE SURVIVES**, which is the
operational question a fresh worktree asks first: `npm ci` writes
`node_modules` (ignored) and does not rewrite the lockfile. The residual
is `npm install`, which MAY rewrite a tracked lockfile — under this layer
that fails, and correctly so, since it is an out-of-fence write the
landing gate would refuse anyway. Use `npm ci`, or `--release` first.

**THE FIRST ATTEMPT AT THIS DOGFOOD WROTE OUTSIDE ITS OWN FENCE, AND IT
IS RECORDED HERE BECAUSE IT IS THIS CARD'S OWN THESIS AT THIS SEAT'S
EXPENSE.** The harness held the command in a shell variable — `LOCK="node
…"`, then `$LOCK --apply` — and **zsh does not word-split an unquoted
parameter**, so that was one command name, not two words: exit 127, the
layer never armed. The script then attempted the stray write anyway, and
`> docs/STATE.md` — a path outside this lane's fence — **succeeded**. The
PreToolUse hook could not see it, because a redirect inside a script is
exactly the vector `T-025-s4` proved unparseable. Restored immediately
with `git restore --source=HEAD --staged --worktree -- docs/STATE.md`,
proven three ways: working file, the recorded before-sha and the HEAD
blob all `4e187345…`; `git status` clean. **Both defects were in the
harness, not the layer**, and both are now closed in it: the command is
INLINED (a construction cannot be mis-split), and **the arm is a GATE** —
nothing destructive runs until the lock is proven to have taken effect on
disk. An unarmed guard and a working one look identical to a script that
never asks, which is the same rule this card's own bodies keep.

### Gates, each exit read from its own output, unpiped

Run from within this worktree after the fresh-clone ORDER
(`lib/parser` `npm ci` + `npm run build`, then `app`, then `tools/e2e`):

| gate | exit |
|---|---|
| `lib/parser` `npx vitest run` | **0** |
| `lib/parser` `npx tsc --noEmit` | **0** |
| `app` `npm run build` | **0** |
| `app` `npm test` | **0** |
| `tools/e2e` `npm run typecheck` | **0** |
| `tools/e2e` `npm run lint:tokens -- --selftest` | **0** |
| `tools/e2e` `npm run lint:docs` | **0** |
| `tools/e2e` `npm test` (`NPUTER_E2E_PORT=15210`) | **0** |
| `app/src-tauri` `cargo test` | **0** |
| `app/src-tauri` graph `index --check --root ../..` | **0** — CURRENT, asked rather than predicted |
| `tools/e2e` `npm run capabilities:check` | **1** — see below, and it is not this lane's to fix |
| `docs-gate.mjs`, repo root, 5 separate literal paths | **1 = FIRES** — a verdict (`docs-gate:` lines), not a stack trace |

The DOCS GATE was asked **against the tree this tip will have** — the
card's own path included — so its answer does not move when this notes
commit lands. It fires because `docs/tasks/…` is a code input, and names
three suites: `npm test` from `app/`, `npm test` from `tools/e2e/`, and
`npx vitest run` from `lib/parser/`. All three are green above.

### What the integrator owes

**`npm run capabilities:check` exits 1 and this lane cannot fix it.**
Committed `docs/CAPABILITIES.md` is 39,425 bytes; a fresh generation is
40,562. `docs/CAPABILITIES.md` is outside this fence — asked
mechanically, not asserted: `decide()` answers `block
outside-the-fence` for it against `touches: [tools/e2e,
method/lane-protocol.md]`. Every regeneration in
`git log -- docs/CAPABILITIES.md` has landed in a merge, a checkpoint or
a standalone integrator commit, never a lane's own. **Run
`npm run capabilities` from `tools/e2e/` in the merge commit.** This is
the third instance of the class `T-218` already owns, and it is recorded
as a corroboration on that card rather than filed again.

### Routed

- **`T-218`** — corroborated with this lane's instance, dated.
- **`T-210-s1`** — the residual this card's own measurement opened: the
  layer decays at every git write and nothing on the push path asks.
  Filed as a suggestion under this card's id, never a freshly minted
  number, which is the defect `T-217` records.
