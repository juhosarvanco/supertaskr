---
id: T-236-s5
title: Row 4's other three lane spellings are read by SHAPE and its checkpoint marker DEFAULTS — the parity T-236-s1 bought for the integration branch, applied to the rest of the row
feature: F-06
milestone: 4
priority: 3
size: S
status: done
blocked_by: []
touches: [app/src-tauri/src/dispatch/brief.rs, app/src-tauri/src/arch_cmd.rs]
suggested_by: executor claude-opus-5@subagent @T-236-s1
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

**CLASS PARENT: T-236-s1**, whose fix this is the residual of. **DISPOSITION
HINT: promote and fold into the next lane that opens `row_lane`** — it is
one function, the reading is already written beside it, and the card that
established the rule is the natural precedent to cite.

**FOUND WHILE BUILDING T-236-s1, NOT FIXED THERE.** That card's fix
sentence names the integration branch and nothing else, and its own body
rules the other three picks *"correct at both"* refs — so this is a scope
call rather than a fence one: the path is inside T-236-s1's fence, and
widening the change would have been a different card built under this
one's ceremony.

## Two properties, one function

`row_lane` in `app/src-tauri/src/dispatch/brief.rs` now reads the
integration branch by its LABEL, with the same refusal `laneSpellings` in
`tools/e2e/scripts/dispatch-brief.mjs` carries. The rest of the row does
not.

- **THE OTHER THREE ARE READ BY SHAPE.** `branch` is whichever backticked
  run `starts_with("task/")`, `worktree` whichever `contains("../")`, and
  `create` whichever `starts_with("git worktree add")`. A shape filter is
  not positional and survives a reordering — which is exactly why it read
  correctly through the defect T-236-s1 fixed — but it answers with the
  FIRST run that happens to match, so a bullet that grows a second
  `task/`-prefixed or `../`-carrying name answers with whichever comes
  first and says nothing. The JS reader keys all three on the words
  BEFORE the backtick (`branch`, `worktree`, `Created with`) and throws
  when the label does not introduce exactly one name.
- **AND THE CHECKPOINT MARKER DEFAULTS.** The marker spent in the
  `find_base` command is taken from the DISPATCH bullet by a shape test
  (ends with a colon, opens upper-case) and ends in
  `.unwrap_or_else(|| "Checkpoint:".to_string())`. That is the failure
  T-236-s1's own commit message describes one line up: a defaulted
  spelling is SILENT, because the printed pipeline ends in `cut`, so the
  dispatcher gets a plausible command built from this module's memory
  rather than from the document. The remedy is the one already in the
  file — refuse, naming the row and the source, the way the label read
  now does.

## Why it is a suggestion rather than a criterion

T-236-s1's card states the other picks are correct at its base and at its
tip, and it is right: this is a latent divergence rather than a live
defect, so nothing is printed wrongly today. What it costs is the
guarantee — T-057's class is two implementations of one rule, and half a
parity is still two rules.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3

The architect seat, at the stamp of T-236-s1's merge (6caac6a). One
function, three picks still read by shape and one marker still
defaulting, with the label reader and the refusal already written
beside them; the two residuals below ride the same lane. Criteria: WHEN
row 4 reads the branch, worktree and create spellings THE reader SHALL
key on each label the way the integration read now does, and SHALL
refuse by name on zero or two matches; WHEN the checkpoint marker is
absent THE row SHALL refuse rather than default; a positive control per
spelling SHALL plant a document whose lane bullet opens with a path and
show the positional reading answer the plant. Guard-class, `review:
independent`. Blocked by nothing; the fence is free once T-236-s1's
worktree is gone, which it is.

## Absorbs: T-236-s7 (2026-09-02)

The verifier's own mutant: neutering `tail_of_longer_label` to `false`
leaves the whole cargo suite green, so the lookbehind guard the JS
reader carries is unpinned in Rust. One body: a bullet where a longer
label ends in the word `branch` — the JS side's own case — SHALL be
refused by the bare-label read, and the mutant SHALL red it.

## Absorbs: T-236-s6 (2026-09-02)

`app/src-tauri/src/arch_cmd.rs` opens with an unused `Path` import, so
every cargo build of the app crate prints a warning that is not news.
One word on one line, outside T-236-s1's fence and inside this one; the
lane removes it and shows a clean `cargo build` in its notes.

## Implementation notes (2026-09-02, executor claude-opus-5@subagent)

Lane `/Users/ujju/Projects/nputer-T-236-s5`, branch
`task/T-236-s5-row-four-reads-by-label`, cut at
`69a8477cc9c6a5aba2422cb49b812fe7e8bfbfd9` — **which is the base, and the
brief's row 4 said `4a9c68cc9c13426593e464440fddc8c851e2dea7`**. The
worktree's own HEAD is the truth (T-233's known defect); every figure
below is stamped at the ref it was measured at.

### The base, re-measured before any diff

- `cargo test` from `app/src-tauri/`: exit **0**, **630 passed / 0 failed
  / 4 ignored** at `69a8477`.
- `cargo build` from `app/src-tauri/`: exit **0**, **one** warning —
  `unused import: Path` at `src/arch_cmd.rs:2:17`.
- **T-236-s7's CLAIM, RE-MEASURED RATHER THAN INHERITED.** In a detached
  drill worktree at `69a8477`, `tail_of_longer_label` neutered to `false`
  left the WHOLE cargo suite green: exit **0**, **630 passed / 0 failed /
  4 ignored** — the same numbers as the unmutated baseline in that same
  tree. The lookbehind had no keeper at all.

### What was written

**`row_lane` in `app/src-tauri/src/dispatch/brief.rs`.** The three
remaining spellings now read through `backticked_after_label`, keyed on
the labels `laneSpellings` uses — `branch`, `worktree` and **`Created
with`**, which is the label the document publishes; `create \`` occurs
ZERO times in that bullet, so a read keyed on the word *create* would
refuse at the live tree. Each refuses by name on zero matches and on two,
carrying the count into the message. The `branch.is_empty() || ...` guard
went with them, and its absence is the point rather than an omission:
`backticked_after_label` pushes a run only when the closing backtick is
strictly past the opener, so every `Ok` is non-empty BY CONSTRUCTION —
the same reading T-236-s1 recorded for the integration branch.

**The checkpoint marker keeps its SHAPE test and loses its default.** It
ended `.unwrap_or_else(|| "Checkpoint:".to_string())`. Why it is not
label-read, measured rather than preferred: the dispatch bullet introduces
the marker MID-SENTENCE and twice — *"from the newest `Checkpoint:`"* and
*"which the newest `Checkpoint:` always is"* — so every candidate label is
itself the tail of a longer one (`the newest` → 0 matches, `newest` → 0),
and a label read takes row 4 down against the document this project
publishes today. **And the arity rule is on DISTINCT spellings, not on
occurrences**: the bullet names one marker twice, so two spellings that
AGREE are one spelling said twice while two that DISAGREE are the
ambiguity `laneSpellings` refuses. Refusal on zero, and on two different
markers.

**`app/src-tauri/src/arch_cmd.rs` (absorbing T-236-s6).** `Path` is NOT
dead — `TempTree::root` at the tests module borrows it — so deleting the
name outright would red the test build. The import moves INTO
`#[cfg(test)] mod tests`, which leaves both builds right: `cargo build`
exit **0** with **zero** warnings, `cargo test` exit **0** over 635
bodies, both at `f371281`.

### Five bodies, all in `brief.rs`

- `row_fours_branch_spelling_is_read_by_its_label_and_a_planted_task_branch_does_not_move_it`
- `row_fours_worktree_spelling_is_read_by_its_label_and_a_planted_sibling_path_does_not_move_it`
- `row_fours_create_command_is_read_by_its_label_and_a_planted_worktree_add_does_not_move_it`
- `a_longer_label_ending_in_the_word_branch_is_not_what_the_bare_label_read_answers`
- `a_dispatch_bullet_that_names_no_checkpoint_marker_is_a_refusal_never_a_default`

**THE PLANTS ARE SHOWN TO FOOL THE READING THEY REPLACE, WHICH IS WHAT
EARNS THEM.** T-236-s1's own plant — a path at the bullet's opener —
satisfies none of the three shape filters here, so a control copied from
it would pass against the unfixed code. Each of the three bodies plants a
decoy AT THE OPENER that matches its own spelling's filter, and asserts
BOTH halves: the POSITIONAL reading answers the decoy (it is first) AND
the SHAPE reading answers the decoy (it matches), then the row answers the
document and no row-4 line carries the decoy anywhere.

**One decoy was corrected by its own drill.** The create decoy first read
`git worktree add --detach ../nputer-a-planted-tree main`, copying the
document's own second such command — and `../` makes it a WORKTREE shape
match too, so reverting the worktree read alone killed TWO bodies. A
control that fails for another spelling's reason is not this spelling's
control; the decoy now carries an absolute path and each mutant kills one
body.

### Drills — nine mutants at the tip, one side only, each restored

Detached worktree `/private/tmp/nd-T-236-s5` with `CARGO_TARGET_DIR` at
`/private/tmp/nd-T-236-s5/target`, checked out at
`f371281e9caef6e9fb5fd007e840a8ede5de643d` — **the commit that carries
every line of the diff**; the only later commit in this lane is this one,
whose whole diff is `docs/tasks/`, which no cargo body reads. Baseline
there before mutating: exit **0**, **635 passed / 0 failed / 4 ignored**.
Every mutation was read back with `git diff` before its run, and a
substitution that changed no file aborts the driver rather than reporting
a kill.

| # | site | mutation | exit | failing bodies |
|---|---|---|---|---|
| M1 | `row_lane` | branch read reverted to `find(starts_with("task/")).unwrap_or_default()` | 101 | **1** — the branch body |
| M2 | `row_lane` | worktree read reverted to `find(contains("../"))` | 101 | **1** — the worktree body |
| M3 | `row_lane` | create read reverted to `find(starts_with("git worktree add"))` | 101 | **1** — the create body |
| M4 | `tail_of_longer_label` | neutered to `false` — T-236-s7's own mutant | 101 | **20**, the lookbehind body among them |
| M5 | `tail_of_longer_label` | narrowed to the literal `ends_with("integration ")` | 101 | **1** — the lookbehind body |
| M6 | `row_lane` | the marker's `unwrap_or_else(\|\| "Checkpoint:")` default restored | 101 | **1** — the marker body |
| M7 | `row_lane` | the marker refuses on zero only, never on disagreement | 101 | **1** — the marker body |
| D1 | `docs/CONVENTIONS.md` | the bare `branch` label renamed to `lane branch` on disk | 101 | **20** |
| D2 | `docs/CONVENTIONS.md` | the published worktree value changed to `../lane-T-NNN` on disk | 101 | **2** |

**CONTAINMENT IS ONE FOR EVERY BODY, MEASURED AT THE TIP.** M1, M2, M3,
M5, M6 and M7 each kill exactly one body and no other body kills them, so
no new body duplicates existing coverage (the shape-six asking). M4 is
reported for what T-236-s7 asked and NOT as a containment measurement: the
mutant that was silent at the base now reds 20 bodies, because once
`branch` is label-read the guard is load-bearing for the live document
too — M5 is the discriminator that isolates the body, and it exists
because M4 cannot.

**THE TWO DATA MUTANTS ARE OWED BECAUSE THE PROPERTY LIVES IN DATA**
(verifier.md 2b). D1 moves the LABEL on disk and takes row 4 down —
the read follows `docs/CONVENTIONS.md`, not an in-memory overlay and not a
constant. D2 moves the published VALUE and reds exactly the two bodies
that assert the worktree spelling, the pre-existing
`row_four_carries_the_command_that_finds_the_base_and_not_a_resolved_hash`
among them — the answer is DERIVED. Both were run over the FULL suite
(`cargo test --no-fail-fast`), and D1's twenty are all in this module: no
suite outside it moved.

Restoration after every mutant was `git restore --source=<commit>
--staged --worktree -- <path>`, proved by sha256 against `git show
<commit>:<path>`, with an empty per-path `git diff` as the companion:

- `app/src-tauri/src/dispatch/brief.rs` at `69a8477` —
  `582707f98d8d6fe5de7e6a180583132a43d164d29ebb33775c8488ce98bd40d9`
- `app/src-tauri/src/dispatch/brief.rs` at `f371281` —
  `d1ec2230554bf674361ae3a80b5f1ae56f7ced122fef7ad04e021ef883c0c88b`
- `docs/CONVENTIONS.md` at `f371281` —
  `c84bea596f2b8935503785c224358cc4515b7622736434e4a1ec31c82f3eb92b`

### The class, and its sweep

The class is **a document spelling read by POSITION or by SHAPE where the
document names it by a LABEL**. `git grep -n backticked -- '*.rs'` from
the repository root at `f371281` returns every call site; three are in the
non-test half and each is accounted for:

- `read_additions` and `read_subtractions` — both slice the line AFTER
  their own literal label (`ADDITION TO THAT SET IS `, `do NOT read `) and
  read the first run of the REMAINDER, so they are label-anchored by
  construction, the same rule spelled by slicing. **They carry no arity
  refusal**, deliberately: each collects a LIST across lines rather than
  resolving one spelling, so *"exactly one"* is not the property.
- `package_commands` — reads the first backticked run of a middle-dot
  SEGMENT, and only of a segment that OPENS with a backtick (the loop
  breaks otherwise). The opening backtick is the anchor, and it is the
  document's own published rule, stated in the CI bullet.
- `row_lane`'s checkpoint marker — the one remaining SHAPE read, argued
  above and now refusing rather than defaulting.

A second sweep for positional picks (`.next()`, `.nth(`, `.first()`) over
the non-test half surfaces only frontmatter delimiter reads, the
lookbehind's own character walk, and a directory-listing filename search
in `lane_touches` — none of them a document spelling. **The sweep is
recorded even though it found things**, and it found nothing further of
the class.

### Suites and gates

Four-suite battery through the blessed runner from the lane root at
`f371281`, reading the COUNT and not only the code: `parser` exit **0**,
349 bodies · `app` exit **0**, 1131 bodies · `rust` exit **0**, 639
(**635 passed + 4 ignored**; the runner counts ignored) · `e2e`
`NPUTER_E2E_PORT=15236` exit **0**, 548 bodies. All four GREEN. **The
closing battery is re-run at this commit and reported in the handoff** —
this section cannot state a figure measured after itself.

- **GRAPH REGEN fires** — the merge forecast carries two `.rs` paths
  outside `docs/`. ASKED rather than predicted: `cargo run -p
  nputer-index -- index --check --root ../..` from `app/src-tauri/` exits
  **1**, a TRUE stale — both count rows printed and `files +0 -0 ~2`
  naming `app/src-tauri/src/arch_cmd.rs` (loc 443 → 447) and
  `app/src-tauri/src/dispatch/brief.rs` (loc 3233 → 3572), plus
  `edges +1 -1` for the moved `Path` import — not the
  `committed: MISSING` false red. **The regeneration is the INTEGRATOR'S
  at the checkpoint**, and this fence cannot reach
  `docs/architecture/graph.json`.
- **BOOT GATE was owed and was run** — `NPUTER_BOOT_PORT=16236 npm run
  boot:check` from `tools/e2e/`, exit **0**, both `[nputer]` lines:
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-236-s5` and
  `[nputer] window "main" created`.
- **DOCS GATE fires on this commit** — `docs-gate.mjs` run from the
  repository root over the forecast's paths plus this card exits **1**,
  owing `npm test from app/`, `npm test from tools/e2e/` and
  `npx vitest run from lib/parser/` for the card alone, and reporting
  every live card's frontmatter parses with a legal status.
- **METHOD EVAL GATE is not owed** — no `method/**` path in the forecast.
- **No test name under `tools/e2e/tests/` moved**, so this lane owes no
  capabilities regeneration.

The forecast itself, at `f371281` against main
`d272558331a826ae6a82a4ff91d6d82ea6f6fe1c`: `git merge-tree --write-tree`
exit **0**, tree `b831bd667a91fc44f2d1c782d838a007ed902198`, **2** paths —
this commit adds a third, `docs/tasks/` alone.

### Where the brief was wrong

- **Row 4's base commit.** The brief said
  `4a9c68cc9c13426593e464440fddc8c851e2dea7`; this worktree was cut at
  `69a8477cc9c6a5aba2422cb49b812fe7e8bfbfd9`, which is the base every
  figure above is stamped against. The brief itself flags row 4 as
  T-233's known defect.
- **"picked positionally".** The dispatch message describes the three
  spellings as picked positionally. They were picked by SHAPE — a `find`
  with a prefix or substring predicate, which the card states correctly.
  It matters for the controls: a decoy that only comes FIRST does not
  move a shape read, so each plant has to match the filter as well.
- **The `create` label.** Nothing in the brief named it; the document
  spells it `Created with`, and `create \`` occurs zero times.
- **Row 5's lane list is a live fact and it moved.** The brief listed five
  lanes read at 02:05Z; `main` had advanced from `69a8477` to `d272558`
  by the time this lane derived its forecast.
- Everything else in the brief held.

### Noticed, not done

Nothing routed. Both absorbed suggestions (T-236-s6, T-236-s7) are built
here; nothing outside this fence was found wanting.

## VERDICT

VERDICT (2026-09-02, verifier claude-opus-5@subagent, bench
`../nputer-V-T-236-s5`): **APPROVED** at
`b0d84ebb88621e9944d12db197b4112803e6f020` (code commit `f371281`).

**BLINDNESS WAS CLOCK-SHAPED, NOT DISCIPLINE-SHAPED**, and the difference
is stated because a later reader cannot tell them apart and only one is a
guarantee (verifier.md). Phase 1 was dispatched before the work existed,
so there was no diff to decline to read. The attack set and the ground
truth were written and hashed BEFORE this branch was fetched —
`attack-V-T-236-s5.md`
`9fc49d407604f7b014b5879926069a8a7160f0598e700e94ea8e5e13a5a3f7a9`,
`ground-V-T-236-s5.md`
`ff3e563e094a70beaaf840ea9c27a79d587cfc5be0ec1f6880397f9cd658c9e4`,
stamped `2026-09-02T02:22:45Z` in
`stamps-V-T-236-s5.txt`
`0a6bc60c1d18e3971b930ba4c81f235bc2f001cde2dadbc6af215a8578eb125e`.
**The phase-2 dispatch DID relay executor-derived specifics** — mutant
counts, the nine-mutant summary, four suite figures, the `index --check`
reading, the boot-gate port. That is the shape verifier.md says breaks
phase 1 above the line; here it arrived after the stamp, so the
contamination is nil, and **every relayed figure below is re-measured in
this bench rather than repeated**.

### The card's own claims, measured at the BASE before the diff existed

Both Absorbs sections were true, and neither was taken on trust:

- **T-236-s7.** At `69a8477`, `tail_of_longer_label` neutered to `false`
  left `cargo test` at **exit 0, 630 passed / 0 failed / 4 ignored** —
  totals identical to the unmutated baseline, zero `failures:` blocks.
  Restored with sha256 `582707f9…` equal to the pre-mutant hash. The
  reason is structural: the guard's only call site was reached only from
  the `integration branch` read, whose one live occurrence is preceded by
  `"- "`, so the guard never fired on the real document.
- **T-236-s6.** At the base, `cargo build` from `app/src-tauri` printed
  exactly one warning, `unused import: Path` at `src/arch_cmd.rs:2:17`.
  **And the one-word fix was a trap**: `Path` is used at
  `src/arch_cmd.rs:225` inside the `#[cfg(test)]` module opening at 202,
  so deleting it from line 2 alone breaks the test build. The diff moves
  the import into the test module, which is the correct shape.

### What the attack set found, and where it was WRONG

- **THE REVERT PROBE, PRE-COMMITTED IN PHASE 1, PASSES — one body per
  read.** At the tip, restoring each base read while leaving the new
  bodies untouched (`cargo test -p nputer --lib --no-fail-fast`, exit 101
  each): the `task/` shape read kills the BRANCH body alone; the `../`
  shape read kills the WORKTREE body alone; the `git worktree add` shape
  read kills the CREATE body alone; the marker's
  `unwrap_or_else(|| "Checkpoint:")` default kills the MARKER body alone.
  All four at once: **4 failed, 271 passed**, exactly those four bodies.
- **MY PRE-COMMITTED DEGENERATE-CONTROL PREDICTION WAS WRONG, AND IT IS
  RECORDED AS WRONG.** I predicted in phase 1 that a lane copying
  T-236-s1's plant (`docs/planted-first-backtick.md`) would produce a
  control that cannot fail, because that string satisfies none of the
  three shape filters. **The hazard is real — measured on the live
  document, that decoy moves none of the three shape reads** — but this
  lane did not take it. Each decoy matches its own filter and only its
  own: `task/T-000-a-planted-branch` moves the branch read alone,
  `../nputer-a-planted-worktree` the worktree read alone,
  `git worktree add --detach /tmp/…` the create read alone. That
  disjointness is what makes the three revert mutants kill one body each,
  and **the executor's disclosed self-correction — the create decoy once
  carried `../` and made the worktree revert kill two — is the reason it
  holds.** The plants are load-bearing.
- **MY PRE-COMMITTED MARKER-ARITY PREDICTION WAS RIGHT ABOUT THE HAZARD
  AND THE FIX AVOIDS IT.** Measured at the base: the folded DISPATCH
  bullet carries three backticked runs, of which **two** pass the marker's
  shape test and both are the identical string `Checkpoint:`. So an arity
  rule counting OCCURRENCES refuses at the document this project
  publishes. I ran that mutant at the tip — deleting the `distinct`
  dedupe — and it reds **19 bodies**, row 4 down across the suite. The
  DISTINCT-spellings rule is what keeps the live document readable, and it
  is not a preference: it is the only rule that admits agreeing repeats.
  The same measurement kills the other half of my prediction: a marker
  read keyed on a LABEL also refuses at the live document, because
  `newest \`` occurs twice and both are tails of *"the newest"* under the
  lookbehind. **Keeping the marker a SHAPE test is correct, and the
  comment in the diff gives that reason rather than asserting it.**
- **THE `create` LABEL IS THE ONE THE DOCUMENT USES.** `create \`` occurs
  **0** times in the folded lane bullet and `Created with \`` occurs
  **1**; the diff keys on `Created with`, the JS reader's own label. A fix
  keyed on `create` would have refused at every ref.
- **THE BARE `branch` READ DOES NOT ANSWER `main`.** `branch \`` occurs
  **twice** — at offset 389 as the tail of *"integration branch"* (value
  `main`) and at 404 (value `task/T-NNN-<slug>`). The lookbehind is what
  separates them, and it is now load-bearing on the live document rather
  than latent.
- **NO NEW LITERAL.** Every string left in `row_lane` is a label, a
  refusal noun, an anchor needle or the command template. `"task/"`,
  `"../"`, `"git worktree add"` and `"Checkpoint:"` survive only in
  comments and inside the test bodies, where the pre-T-236-s5 shape
  filters are written down deliberately because they no longer exist in
  the module under test.
- **THE `is_empty` GUARD'S REMOVAL IS SOUND, NOT AN OMISSION.**
  `backticked_after_label` pushes a run only when `close > open`, so every
  `Ok` is non-empty by construction. I attacked it with a mutant that
  makes `spell` fall back to the first backticked run on `Err`: it kills
  `an_integration_branch_the_bullet_does_not_spell_exactly_once_is_a_refusal_never_a_default`
  — the pre-existing T-236-s1 body — which is the keeper of the shared
  refusal path all four labels now travel.

### The drill, re-run at the tip and never read from a report

Ten mutants of my own, each landing confirmed by `git diff` and each
restored to sha256 `d1ec2230554bf674361ae3a80b5f1ae56f7ced122fef7ad04e021ef883c0c88b`.
**Kill sets are per BODY** (the mutants that kill it), which is what
containment is about:

| body | killed by |
|---|---|
| branch plant | branch-revert, all-four, guard-false, guard-callsite, marker-occurrences |
| worktree plant | worktree-revert, all-four, guard-false, guard-callsite, marker-occurrences |
| create plant | create-revert, all-four, guard-false, guard-callsite, marker-occurrences |
| marker | marker-default, all-four, guard-false, guard-callsite, marker-occurrences, disagreement-never-refuses |
| lookbehind (T-236-s7) | guard-false, guard-callsite, **tail-fallback** |
| integration (T-236-s1, pre-existing) | guard-false, guard-callsite, **spell-falls-back**, marker-occurrences |

**NEITHER CONTAINS THE OTHER, FOR EVERY PAIR — but the last row of that
took a mutant the drill did not have.** Over the eight mutants I started
with, the lookbehind body's kill set `{guard-false, guard-callsite}` was a
strict SUBSET of every other body's, which would have graded it a
restatement. My own `guard-callsite` mutant (deleting
`!tail_of_longer_label(bullet, at) &&`) is not a discriminator: it kills
the same 20 bodies `guard-false` does. **So I built the one that isolates
it** — the guard falling back to its tail matches when it excluded
everything, a lenient-defect shape: exit 101, **the lookbehind body
ALONE**. With it, no kill set contains another and every body is
load-bearing.
**AND THE NOTES' OWN M5 IS HONEST**: I re-ran it —
`tail_of_longer_label` narrowed to `bullet[..at].ends_with("integration ")`
— exit 101, the lookbehind body alone. The drill table's discriminator
claim holds; mine is an independent second one. Per verifier.md 2b the
COUNT was never the invariant, so M4's twenty is a property of a
well-aimed mutant and not a defect.

**AND SOMETHING DIED AT THE SITE THE PROPERTY LIVES.** Three of the
mutants are DATA-shaped by construction — the plants are edits to the
real `docs/CONVENTIONS.md` text, and the property under test is a
derivation from that document, which a code-only drill mis-grades.

### Security sweep

No new dependency and no manifest in the diff (`*.toml`, `*.json`,
`*.lock`: none). No new subprocess — `no_subprocess_in_this_file` passes
at the tip. No new byte indexing: `backticked_after_label` is unchanged,
and the test helper's one slice takes its index from `str::find`, a char
boundary. The dedupe loop is bounded by one bullet's backtick count
(three, live). No secret, no new input path: the only reader is a
repository-local document already read, and the diff NARROWS what an
unreadable one can do — a defaulted marker used to travel into a printed
pipeline that ends in `cut` and exits 0 on no match. I considered whether
a document-derived marker or ref can inject into that printed command and
ruled it out as a finding: both moving parts have been document-derived
since T-236-s1, the assembler executes nothing, and the surface is
narrowed rather than widened here.

### Gates, every figure with the ref it was measured at

All at `b0d84eb` unless stated, in this bench, ports 25236 / 26236, 1420
untouched.

- `cargo test` from app/src-tauri: exit 0, **635 passed / 0 failed / 4
  ignored** (base `69a8477`: 630/0/4 — five new bodies, no body lost).
- `cargo build`: exit 0, **zero warnings** (base: one). T-236-s6 closed.
- `npx vitest run` from lib/parser: exit 0, **349 passed**, 16 files.
  `npx tsc --noEmit`: exit 0.
- `npm run build` from app/: exit 0. `npm test` from app/: exit 0,
  **1131 passed**, 50 files.
- `npm test` from tools/e2e, run in five batches because two other e2e
  runs held this machine: **544 passed, 4 failed of 548**.
- `npm run typecheck`, `lint:tokens`, `lint:tokens -- --selftest`,
  `capabilities:check` (CURRENT, 45968 bytes — no regeneration owed),
  `lint:docs` census: all exit 0.
- The docs gate's DIFF half, run from the repository root over this
  lane's three paths: FIRES, naming app/, tools/e2e/ and lib/parser —
  all three run above.
- `boot:check` on `NPUTER_BOOT_PORT=26236`: exit 0, both startup lines.
- `git merge-tree --write-tree <origin/main> b0d84eb`: exit 0 against
  `7203db8`, three paths. Main moved twice during this pass
  (`42520e3` → `610bb4e` → `7203db8`), which is why the ref is named.
- `index --check --root ../..` from app/src-tauri: **exit 1, STALE, and
  it is a REAL red read from its second line** — `committed 1168002` vs
  `fresh 1167986`, `files ~2` naming exactly this lane's two files, and
  `edges +1 -1` for the moved `Path` import. Per CONVENTIONS' GRAPH REGEN
  rule the regeneration is the integrator's at the checkpoint and never
  the lane's. **Not a defect of this diff.**

### The four e2e reds are this bench's, not this diff's

`card-preflight.spec.ts:684`, `checkout-currency.spec.ts:852` and `:953`,
and `lane-lock.spec.ts:899` fail at the tip. **All four reproduce
identically at the BASE `69a8477` in this same bench, with the diff
absent** — I re-ran them there rather than reasoning about them. The cause
is printed in the failure: the checkout-currency guard reports *the
checkout this session was started in* as
`STALE [guard-surface-behind]`, because this verifier bench is detached
25–27 commits behind main and does not contain the newest main commit
touching `.claude`. The sweep names every checkout on this machine the
same way, the lane's own worktree included. A bench cut at a lane's base
cannot satisfy a body that requires its own checkout to be current, so
this is a property of the seat verifier.md itself prescribes
(orchestrator 5c, "cut the verifier's bench with the lane"), not of the
work. **The integrator should read these four at a current checkout
before the merge rather than take my attribution on trust.**

### Observation, not a failure, and not blocked on

The refusal messages now carry a per-spelling noun (`lane branch`, `lane
worktree`, `lane create command`) and the count. The refusal PATH is
pinned — the spell-falls-back mutant reds the T-236-s1 body — and the
criterion's "naming the row and the source" is asserted as
`r.number == 4 && r.path == CONVENTIONS`. The nouns themselves are
unpinned prose: swapping two of them reds nothing. Cosmetic, inside the
class parent's own territory, and named here rather than filed.

**Both criteria are met and both are drilled. APPROVED.**
