---
id: T-236-s1
title: The Rust brief's row 4 reads the integration branch as the FIRST backticked name in the LANE PROTOCOL bullet, and at every ref since T-089 that name has been `method/lane-protocol.md`, not `main`
feature: F-06
milestone: 4
size: S
priority: 3
status: verifying
suggested_by: executor claude-fable-5-1@subagent @T-236
blocked_by: []
touches: [app/src-tauri/src/dispatch/brief.rs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**FOUND WHILE PINNING, NOT WHILE CUTTING — the T-236 compaction did not
move it and could not have fixed it.** `row_lane` in
app/src-tauri/src/dispatch/brief.rs derives this project's lane
spellings from docs/CONVENTIONS.md: `bullet_containing(&conventions,
"integration branch \`")` selects the whole column-zero THE LANE
PROTOCOL bullet (`top_level_bullets` folds every whitespace-led
continuation line and every `  - ` sub-bullet into it), and then takes
`backticked(&spellings).into_iter().next()` as the integration branch.
The first backticked name in that bullet is the opener's
`method/lane-protocol.md`, not the sub-bullet's `main`. Measured
mechanically on 2026-09-02 by replicating the splitter in node against
the document at T-236's base `3170247` and at its tip `d01b24f`: both
answer `"method/lane-protocol.md"` (the `task/`, `../` and `git
worktree add` picks are correct at both, because they search by
prefix rather than position). The value feeds `find_base`'s
`git log --first-parent --format='%H %s' {integration} | grep -m1 …`
line, so the command the Rust brief prints for the dispatcher names a
file path where a ref belongs. No cargo body asserts the integration
branch — the fixture test at brief.rs asserts only that the create
line contains `git worktree add` and the task id — which is why it
has stayed green; the JS assembler (`laneSpellings` in
tools/e2e/scripts/dispatch-brief.mjs) reads the same bullet by LABEL
with a lookbehind guard and gets `main`, so the two implementations of
one rule disagree, which is T-057's class. The fix is in C-15's fence:
read the integration branch by its label (`integration branch \``)
the way the JS side does, and add the positive control the JS side
already has — a body that asserts `main` from the live document and
reds when the label moves.

## TRIAGE, 2026-09-02 — PROMOTED

The one card of the wave's sixteen where a printed command is wrong
today: the Rust brief's `find_base` names a file path where a ref
belongs, two implementations of one rule disagree (T-057), and no cargo
body asserts the value. Read by label as `laneSpellings` does, and add
the body. T-233 is the sibling row; one lane may take both if fences
allow.

## DISPATCH, 2026-09-02 — the stamp

**Audit (orchestrator 5b)**: `row_lane` in app/src-tauri/src/dispatch/brief.rs
at 37ac590 finds the bullet containing "integration branch `" and takes
the first backticked name — the claim's mechanism holds; re-measure what
that name is after T-236's compaction at your ref. Fence: brief.rs alone
(C-15). The boot gate is owed by the app/src-tauri path. Ceremony: S
touching shipped code, review independent — executor, then verifier;
this lane does NOT hold the integration checkout and does not merge.

## Implementation notes

**THE CLAIM HELD AT THIS LANE'S BASE, RE-MEASURED RATHER THAN INHERITED.**
Before any diff, at `80ab11ca99c4dd5064e865404b85bd389034d71c`, row 4's
`integration branch` line came back as `method/lane-protocol.md` — read
off the real `assemble` through the real `DiskFiles`, as the first
failure of the new body rather than by replicating the splitter anywhere.

### What was built

- **`backticked_after_label(bullet, label)`** — the one backticked name a
  LABEL introduces in a folded bullet, carrying the JS reader's lookbehind
  (a label immediately preceded by a letter and a space is the TAIL of a
  longer one, so a bare `branch` read can never answer with the
  integration branch's name) and its `found.length !== 1` refusal, as
  `Err(count)`.
- **`row_lane` spends it for the integration branch**, so the pick is by
  LABEL and no longer by position. **The refusal is the other half and it
  is the half with teeth**: the old pick ended in `unwrap_or_default()`
  and the row's emptiness guard checks branch, worktree and create and
  never integration, so an unreadable spelling produced an EMPTY name and
  the printed pipeline said nothing about it — `cut` is last, so
  `git log --first-parent --format='%H %s' | grep -m1 ' Checkpoint:' |
  cut -d' ' -f1` prints nothing at exit 0 and a dispatcher reads an empty
  base rather than an error. An unreadable spelling now takes row 4 down
  by name. `Ok` is non-empty by construction — the reader only pushes a
  run when its closing backtick is strictly past its opener — so there is
  no dead emptiness check to add.
- **Two bodies**, both in `app/src-tauri/src/dispatch/brief.rs`:
  `the_integration_branch_is_read_by_its_label_and_a_planted_first_backtick_does_not_move_it`
  and
  `an_integration_branch_the_bullet_does_not_spell_exactly_once_is_a_refusal_never_a_default`.

### The positive control, and why the live arm could not be it alone

The first body's live arm asserts `main` off the real document. That arm
alone would have stopped discriminating the day the lane bullet's opener
moved — and it does not discriminate at all against a positional read
that happens to land right. So the body plants a document whose lane
bullet opens with a PATH and asserts BOTH halves: that the POSITIONAL
reading answers the planted path, and that the row still answers the ref.
**The drill measured that this is not decoration** — mutant three below
is a positional read that passes the live arm and dies on the plant.

### Drills — four mutants, each restored and proved

Run in a detached worktree at `/private/tmp/nd-T-236-s1`, cut at the
commit under test, with `CARGO_TARGET_DIR` at `/private/tmp/nd-T-236-s1/target`;
every mutation was read back with `git diff` before its run, and the
worktree is removed. Baseline there before mutating: `cargo test -p nputer
--lib --no-fail-fast` green over 269 bodies at `bd9fc50`.

| # | site | mutation | result |
|---|---|---|---|
| 1 | `row_lane` | the label read reverted to `backticked(..).next()` | exit 101, exactly ONE failing body — this card's first |
| 2 | the first body's own plant | the planted path inserted where it is no longer FIRST | exit 101, one body: the control's own half red |
| 3 | `row_lane` | `.nth(2)` — a positional read that answers `main` on the live document | exit 101, one body: killed by the PLANT, not by the live arm |
| 4 | `backticked_after_label` | ambiguity DEFAULTS to the first match instead of refusing | exit 101, one body: this card's second |

Restoration was `git restore --source=<commit> --staged --worktree` each
time, proved by sha256 against `git show <commit>:<path>` with an empty
per-path `git diff` as companion: `facf8077b14789717e2597d2f18ce942763bb8aeeb0ce4827e98d96bc8951ad9`
after mutants 1, 2 and 3 at `bd9fc50`, and
`582707f98d8d6fe5de7e6a180583132a43d164d29ebb33775c8488ce98bd40d9`
after mutant 4 at `4d32627`.

**CONTAINMENT WAS ONE IN ALL FOUR** — no other body kills any of them, so
neither new body duplicates existing coverage (the shape-six asking).

**ONE ARM CANNOT BE POISONED AND IS NAMED RATHER THAN COUNTED.** The
second body's *label GONE* arm is over-determined: with the label
removed, `bullet_containing` refuses before the label reader is reached,
and even a `bullet_containing` that defaulted would meet the row's own
`branch/worktree/create` emptiness guard. No single-site mutation flips
it. It is kept because the property a reader of the brief cares about is
*"row 4 refuses"*, stated at the level the brief is read at.

### For the verifier

- The sweep for this fix's class — *a spelling read by POSITION where the
  document names it by LABEL* — is `git grep -n backticked -- '*.rs'`:
  five call sites in `row_lane` and two elsewhere. Of the seven, one was
  this defect. The other positional `.next()` reads are label-anchored
  already (`read_additions` slices from the label first) or read a
  middle-dot SEGMENT, whose opening backtick is the document's own
  published rule. **The sweep is recorded even though it found one**, and
  what it did surface is routed as `T-236-s5` rather than folded in here:
  row 4's other three picks are read by SHAPE and its checkpoint marker
  still DEFAULTS.
- `docs/CONVENTIONS.md` spells `integration branch \`` exactly once in the
  whole document at `4d32627`, which is what makes the exactly-one refusal
  a passing property today rather than a latent red.
- Nothing in `tools/e2e/scripts/dispatch-brief.mjs` was edited; it was read
  as the reference implementation, as the card asks.

### Gates, at this lane's tip

- **GRAPH REGEN fires** — the diff carries a `.rs` path outside `docs/`.
  Asked rather than predicted: `cargo run -p nputer-index -- index --check
  --root ../..` from `app/src-tauri/` exits 1 and reports a REAL stale
  (`files +0 -0 ~1`, naming `app/src-tauri/src/dispatch/brief.rs`, with
  both byte/file/symbol/edge columns printed), not the missing-graph false
  red. **The regeneration is the INTEGRATOR'S, in the checkpoint**, and
  this lane's fence cannot reach `docs/architecture/graph.json` in any
  case.
- **BOOT GATE was owed and was run** — `NPUTER_BOOT_PORT=16236 npm run
  boot:check` from `tools/e2e/`, exit 0, both `[nputer]` lines observed
  (`project folder: /Users/ujju/Projects/nputer-T-236-s1` and
  `window "main" created`).
- **No test name under `tools/e2e/tests/` moved**, so no capabilities
  regeneration is owed by this lane.

### Noticed, not done

- `T-236-s5` — row 4's remaining spellings by SHAPE, and the defaulting
  checkpoint marker. In this fence; a scope call, not a fence one.
- `T-236-s6` — `app/src-tauri/src/arch_cmd.rs` carries an unused `Path`
  import, so every cargo run of the crate prints a warning. Outside this
  fence; present at the base and untouched by this diff.

## Verdicts

VERDICT (2026-09-02, verifier claude-opus-5@subagent, bench
`../nputer-V-T-236-s1`): **APPROVED** at
`8508b88277e72c47bdcba8ae926637d6471878da`.

**BLINDNESS WAS CLOCK-SHAPED, NOT DISCIPLINE-SHAPED**, and the
difference is stated because a later reader cannot tell them apart and
only one is a guarantee (verifier.md). Phase 1 was dispatched before the
work existed, so there was no diff to decline to read. The attack set
and the ground truth were written and hashed BEFORE this branch was
fetched — `attack-V-T-236-s1.md`
`45ab8503ab2b3fcd363f3ca5cca88e232c1c15705c8308e27c77bf1cb6a534dc`,
`ground-V-T-236-s1.md`
`1fae1e55409124b1b742f1261342b354e39300e938fb63cc5b5cb2df3b54e61b`,
stamped `2026-09-02T01:08:07Z`. **The phase-2 dispatch DID relay
executor-derived specifics** (mutant numbers, suite figures) — the shape
verifier.md says breaks phase 1 above the line; here it arrived after
the stamp, so the contamination is nil, and every relayed figure below
is re-measured rather than repeated.

**THE CARD'S CENTRAL CLAIM WAS TRUE, MEASURED IN PHASE 1 RATHER THAN
REPLICATED.** At the base `80ab11c`, `assemble` over the real
`DiskFiles` printed `integration branch :: method/lane-protocol.md` and
`find_base :: git log --first-parent --format='%H %s'
method/lane-protocol.md | grep -m1 ' Checkpoint:' | cut -d' ' -f1`.
**And the failure is worse than "names a file path": it is SILENT.** Run
at the base, that pipeline prints NOTHING and exits **0** — git resolves
the existing file as a pathspec, lists 9 first-parent commits (all of
them `Merge …`, none `Checkpoint:`), `grep` exits 1 and `cut` is last —
so a dispatcher reads an EMPTY base and `git worktree add … <base>` cuts
from HEAD. The correct ref answers `4a9c68c`. A path that does not exist
exits 128, so the defect was invisible in exactly the checkout where the
brief is used.

### What the attack set found

- **THE REVERT PROBE, PRE-COMMITTED IN PHASE 1, PASSES.** Restoring
  `row_lane`'s pick to `backticked(..).next().unwrap_or_default()` and
  leaving the new bodies untouched: `cargo test -p nputer --lib
  --no-fail-fast` → exit 101, **both** new bodies red. **My own
  pre-committed prediction — that the control would be degenerate in
  the B1 way, `main` asserted against an arrangement the old code also
  satisfies — was WRONG, and it is recorded as wrong.** The plant is
  load-bearing.
- **CONTAINMENT, MEASURED AT THE TIP — and this is the one place the
  handoff needs correcting.** The notes' four mutants were run at
  `bd9fc50` and `4d32627`; mutants 1–3 predate the second body, so
  "containment was one in all four" is a statement about two
  intermediate commits, not about `8508b88`. At the tip: `.next()`
  kills BOTH bodies; `.nth(2)` kills BOTH; ambiguity-defaults kills the
  refusal body ALONE. That left the plant body possibly contained, so I
  built the discriminator the handoff lacked — **arity-aware BY LABEL,
  value BY POSITION** (`Ok(backticked(bullet).nth(2))` behind the
  one-match gate): exit 101, the plant body ALONE. **Neither kill set
  contains the other; both bodies are load-bearing.** The handoff's
  conclusion is right; its measurement did not reach it. Per
  verifier.md 2b the COUNT was never the invariant, so this is a
  correction, not a finding.
- **DATA MUTANTS ON THE LIVE DOCUMENT**, because a derivation guard is
  mis-graded by code mutants by construction. Planting
  `` `docs/verifier-planted-first.md` `` first in the real
  `docs/CONVENTIONS.md` lane bullet — landing read from `git diff
  --unified=0`, not from the mutator — leaves the lib suite **GREEN,
  270 passed**: the read follows the LABEL on disk, not only through an
  in-memory overlay. Moving the label (`integration branch` →
  `trunk branch`) reds 15 bodies including both new ones.
- **THE `find_base` FIX IS DERIVED, NOT A STRING.** No `"main"` literal
  exists anywhere in the non-test half of the file, and the new body
  couples the two lines by construction
  (`base.text.contains(&format!("%s' {} |", integration.text))`) rather
  than asserting the constant — the assertion a hardcode would survive.
- **THE DIVERGENCE I EXPECTED TO SURVIVE IS CLOSED.** `laneSpellings`
  throws on `found.length !== 1`; every read in `row_lane` used to end
  `unwrap_or_default()`. The new reader returns `Err(count)` and takes
  row 4 down by name. **And the emptiness hole is closed by
  construction rather than by a guard**: `Ok` is non-empty because the
  reader pushes only when the closing backtick is strictly past its
  opener — probed, `` integration branch `` `` → `Err(0)`.
- **THE `GONE` ARM'S OVER-DETERMINATION IS REAL AND CORRECTLY
  DISCLOSED.** Verified independently: after that replace the needle
  count in the whole document is **0**, so `bullet_containing` refuses
  before the label reader is reached. Named rather than counted, which
  is the right disposition.
- **THE NEW BYTE-INDEX READER IS TOTAL.** Fifteen adversarial bullets
  through a scratch probe — multibyte (`é`, `—`, `→`, `ü`), unbalanced,
  empty and trailing backticks, empty string, adjacent repeats — no
  panic, no hang, every answer sane.
- **SECURITY SWEEP CLEAN.** Zero dependency or lockfile churn (the
  `regex` crate was the tempting and wrong reach — Rust's `regex`
  supports no lookbehind at all). No subprocess added;
  `no_subprocess_in_this_file` intact. Every `expect`/`panic!` in the
  diff is inside test bodies. No secrets. `acl_pin.rs` a 0-file diff.
  The read's source is still `docs/CONVENTIONS.md` and no new input
  path crosses a trust boundary.
- **FENCE HELD.** Exactly four paths: `brief.rs` and three cards. No
  edit to `docs/CONVENTIONS.md` (fixing the test by moving the
  document) and none to `dispatch-brief.mjs`.

### Gates, all re-derived in this bench at `8508b88`

`cargo test` exit 0 — **630 passed, 0 failed, 4 ignored** (the relayed
`634` counts the ignored as passes; base `80ab11c` read 628, so the diff
adds exactly its two bodies) · `lib/parser` `npx vitest run` 349 passed,
`tsc --noEmit` exit 0 · `app` `npm run build` exit 0 then `npm test`
1131 passed · `tools/e2e` `NPUTER_E2E_PORT=25236 npm test` **548
passed**, `typecheck` / `lint:tokens` / `lint:docs` /
`capabilities:check` all exit 0, the last CURRENT — so no census is
owed, as the notes say. `docs-gate.mjs` on the four changed paths, run
FROM THE REPOSITORY ROOT (from `tools/e2e/` it exits **2**, called
wrong, which is not a clean gate): FIRES, exit 1, naming exactly the
three suites above, and reporting every live card's frontmatter parses
with a legal status. `git merge-tree --write-tree` against main
`8d21442` exits 0 over the same four paths.

`index --check` exits **1**, a TRUE stale — second line prints both
count rows and `files +0 -0 ~1` naming
`app/src-tauri/src/dispatch/brief.rs` (loc 3004 → 3233, symbols 83 →
85), not the `committed: MISSING` false red. **The regeneration is the
INTEGRATOR'S** (GRAPH REGEN) and is unreachable from this fence; at the
base the same command exits 0. `cargo fmt --check` exits 1 at the tip
AND at the base over the same 48 files, `brief.rs` among them at both —
pre-existing, not this diff's, and not a command CONVENTIONS lists.

### Filed, not blocking

`T-236-s7` — **the lookbehind guard is unpinned**: neutering
`tail_of_longer_label` to `false` leaves the whole lib suite green (270
passed, exit 0), the one mutant of mine that survived. I probed the
guard directly and it is CORRECT — `` the integration branch `x` `` →
`Err(0)`, and label `branch` over
`` integration branch `main`; branch `task/T-NNN` `` → `Ok("task/T-NNN")`,
exact parity with the JS lookbehind down to `é` and `—` not counting as
letters — so this is a coverage gap in new code, never a defect, and it
is a suggestion rather than a verdict item.
