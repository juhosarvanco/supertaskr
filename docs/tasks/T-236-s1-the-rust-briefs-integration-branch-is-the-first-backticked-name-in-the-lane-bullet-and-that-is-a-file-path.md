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
