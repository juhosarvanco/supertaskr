---
id: T-140-s9
title: The collector's symlink refusal is guarded three times and neither symlink test can be poisoned by lifting fewer than three — both bodies survive the removal of the guard they are named after
feature: F-06
milestone: 4
priority: 25
size: S
status: verifying
suggested_by: executor claude-opus-5@subagent @T-140-s4
blocked_by: []
touches: [app/src-tauri/src/docs_watch.rs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review:
---

**FOUND BY A POISON DRILL THAT WOULD NOT RED**, in `T-140-s4`'s detached
drill worktree at `656511f`, `CARGO_TARGET_DIR=<scratch>/target`.

`collect_docs_tree`'s walk refuses a symlink THREE times, and the three
are independent:

1. `if meta.file_type().is_symlink() { continue; }` — the named guard,
   carrying the comment *"never follow links out of the tree"*.
2. `if !canon.starts_with(&canon_project) { continue; }` — the
   "belt to the symlink-skip's suspenders" canonical prefix check, whose
   own comment says it is the second layer.
3. `relative_posix(&canon, &canon_project)` returning `None` — which is
   `path.strip_prefix(base).ok()?`, i.e. **the same containment
   predicate as (2), expressed a second time**, one line further down,
   in a helper whose stated job is formatting.

**THE MEASUREMENT.** Two bodies name this property:
`docs_watch::tests::symlinks_are_never_followed` and
`symlinked_docs_file_in_a_subdirectory_is_never_followed` (T-140-s4
re-aimed the latter from `.json` to `.md`).

- Lift guard **1** alone (`&& false`): `cargo test -p nputer` is
  **251 passed / 0 failed**. Both bodies GREEN.
- Lift guards **1 and 2**: **251 passed / 0 failed**. Both bodies still
  GREEN — killed by (3).
- Poison the expected value of the second body instead (one side only):
  **1 failed**, that body by name. So the bodies are NOT vacuous; they
  run, and their values matter.

**WHY THIS IS WORTH A CARD AND NOT A SHRUG.** Defence in depth is good
and nothing here is broken. What is wrong is the EVIDENCE: two tests are
named for a guard that neither can detect the loss of, so the suite
reports coverage of layer 1 that it does not have. Delete the
`is_symlink` branch tomorrow and every gate in this repository stays
green — on a path that ADR-010 treats as a security boundary, where the
`.md`/`.json` distinction was the only thing the drill did change.

**AND THE DUPLICATION IN (2)/(3) IS THE CHEAPER HALF OF THE FINDING.**
`starts_with` followed by `strip_prefix` is one predicate written twice
in adjacent statements. That is not depth, it is a copy: the two cannot
disagree, so the second buys nothing and hides the fact that (1) is
unprotected by any test.

**WHAT A LANE WOULD DO** (proposed, not ruled): give each layer a body
that can only be killed by that layer — the shape is a unit test on the
predicate rather than on the walk — or, if the layers are deliberately
redundant, say so at the site and record that the walk-level bodies test
CONTAINMENT and not symlink-following, which is a true sentence and a
different name than the ones they carry.

**NOT CAUSED BY `T-140-s4`.** The same three layers, and the same
un-poisonable pair, exist at `5073db6` before that card. It re-aimed one
of the two bodies and drilled it, which is how the property was seen.

## TRIAGE (2026-08-31, standing triage sitting #5 — called by a BAND) — PROMOTED F-06, priority 18 -> 25, as filed

A genuine vacuity finding and the strongest kind: **the executor's own
drill produced it and it disclosed the survivors rather than reporting a
clean sheet.** Lifting the `is_symlink` guard leaves both symlink bodies
passing; lifting the canonical-prefix check as well STILL leaves them
passing, because `relative_posix`'s own `strip_prefix` is a third
containment layer. Neither test can detect the loss of the guard it is
named after.

That is the same class `T-177`'s verifier found in the parser hours
later — a property that is correct, load-bearing, and pinned by nothing
that could notice its removal. Two independent sightings in one night
argue the class is worth a standing look, and the two cards should be
read together by whoever takes either.

Priority moved off a collision (18 was taken); no value judgement.

## Implementation notes (2026-08-31, executor claude-opus-5@subagent)

Lane `/Users/ujju/Projects/nputer-T-140-s9`, branch
`task/T-140-s9-t140s9-symlink-guard`, base `155993f`. One commit,
`8c5550d`, one file, **+223/-6** — `app/src-tauri/src/docs_watch.rs`, the
whole fence. Ceremony row: **S touching shipped code**, so a verifier is
owed; nothing merged, nothing pushed, the lane worktree left standing.

### THE RULING: every layer stays, and the EVIDENCE is what changed

The card's open question was whether three guards are defence in depth or
two are redundant. Measured, the answer is neither of the offered shapes:

**Two of them cannot be detected by any test that could ever be written,
and that is a fact about the code's shape rather than about the tests.**

- `is_symlink` is shadowed by the `!meta.is_file()` classification three
  lines below it. Both read `symlink_metadata`, under which a link is
  neither `is_file()` nor `is_dir()` — so a lifted `is_symlink` drops the
  entry at `!meta.is_file()` instead. Same outcome, nothing observable
  moved.
- `starts_with` is shadowed by `relative_posix`'s own `strip_prefix` on
  the next statement. `strip_prefix` succeeds exactly when `starts_with`
  holds, both over whole components, so the two cannot disagree about any
  path and no fixture can distinguish them.

Deleting either was rejected, and the reason is the point: **a provably
behaviour-neutral line cannot make any test sharper by leaving.** The
discrimination a deletion would buy is exactly zero — the shadow, not the
shadowed line, is what every fixture actually meets — while the cost is
real: these are guards on an ADR-010 boundary, and the containment
argument belongs in sight at the site where it is made rather than
resident in a helper whose stated job is formatting. Redundancy was never
what made the evidence vacuous. **The missing bodies were.** So:

1. Each layer is NAMED at its site for what it is. The
   "belt to the symlink-skip's suspenders" comment is corrected to
   "one predicate written twice" — that false claim of depth is the
   actual defect, because it is what made a reader (and `T-140-s4`'s
   drill) expect a test could tell the two apart.
2. `relative_posix` is documented as the containment layer that is
   actually load-bearing, not as formatting.
3. Three bodies pin everything that CAN be pinned (below).
4. The two `*_never_followed` bodies keep their names — three cards
   outside this fence cite them (`T-003`, `T-140-s4`, this one) and a
   rename would strand those references — but each now carries, in the
   body, what it actually asserts: the OUTCOME, not the layer.

### THE PER-GUARD LIFT LEDGER — every row RUN, not reasoned

Detached scratch worktree `/private/tmp/nd-T-140-s9` at `ddefda4`,
`CARGO_TARGET_DIR=/private/tmp/nd-T-140-s9/target`. `ddefda4` and the
final `8c5550d` differ by one comment block and nothing else. Each arm:
mutate, **read the mutation back with `git diff`** (the arm prints its own
mutated-line count and refuses a silent zero), run `cargo test -p nputer`
UNPIPED into its own log, restore, prove by sha256.

| arm | lifted | exit | result | red BY NAME |
|---|---|---|---|---|
| A1 | `is_symlink` | 0 | 259/0 | **nothing** — shadowed |
| A2 | `!meta.is_file()` | 0 | 259/0 | **nothing** — shadowed |
| A3 | both link checks | 101 | 258/1 | `a_symlink_to_a_file_inside_docs_is_refused_by_the_link_checks_alone` |
| A4 | `starts_with` | 0 | 259/0 | **nothing** — shadowed |
| A5 | `relative_posix`'s `ok()?` | 101 | 257/2 | `relative_posix_is_the_containment_predicate_the_walk_relies_on`, `the_prefix_check_and_relative_posix_are_one_predicate` |
| A6 | A3 + `starts_with` | 101 | 258/1 | the inside-pointing body only |
| A7 | all four | 101 | 256/3 | the three new bodies — **both `*_never_followed` bodies still GREEN** |
| A8 | all four + the `docs/` prefix | 101 | 252/7 | the three new, plus `symlinks_are_never_followed`, `symlinked_docs_file_in_a_subdirectory_is_never_followed`, `symlinks_stay_silent_in_the_skip_report`, `picked_root_containment_skips_internal_symlinks` |

**A7 IS A CORRECTION TO THIS CARD AND TO THE BRIEF.** The walk carries
FOUR containment checks, not three — and an OUTSIDE-pointing link is
refused FIVE deep. Lifting all four still leaves both `*_never_followed`
bodies green, because an escaped path formats to something that is not
under `docs/` and `is_collected_docs_path` drops it: classification
catching what containment was asked about. No subset-of-three lift could
ever have reddened those two, so the card's *"killed by (3)"* attribution
is false — `relative_posix` is never even reached for a symlink while
either link check stands. A5 is where that layer's absence shows.

**A8, the lifted arm, TERMINATED IN A FIXTURE** (CONVENTIONS, LIFTING A
SAFETY GUARD TO DISCRIMINATE — pointed at one, not merely started at
one). The leaked path in the failure output is
`//private/var/folders/8h/…/T/nputer-t003-pick-contain-outside-48513-1788134137956/secret.md`
— a `TempTree` under the system temp dir, never a real file, and it
appears only in the arm that lifts all five. The new inside-pointing body
also asserts the guard's lstat STATE (`is_symlink` true, `is_file` false,
`is_dir` false) BEFORE it exercises the walk, which is the same rule's
other half and the fact the whole shadowing argument rests on.

### THE POISON DRILL — assertion side, one side only

| arm | poisoned | exit | red BY NAME |
|---|---|---|---|
| P1 | expected path list of the inside-pointing body | 101 | that body, alone |
| P2 | the exact rel string of the predicate body | 101 | that body, alone |
| P3 | one side of the equivalence comparison | 101 | that body, alone |

Each new body is therefore non-vacuous by its own value, and each dies
alone. **11 arms, 11 restorations, all proven:**
`shasum -a 256` of the working file `== 9bcf07cabdb0edc2dfc41b5a637fed97cd806581d24df5771df8a04ed2e446c0`,
the `ddefda4` blob of `git show ddefda4:app/src-tauri/src/docs_watch.rs`,
after every single arm. Committed first, so a restore cannot pass itself
off as a revert.

**The scratch worktree was removed and the lane proven unpolluted by it**
(T-013's hazard: binaries bake `CARGO_MANIFEST_DIR` at compile time). It
carried its own `CARGO_TARGET_DIR` at `<scratch>/target` throughout — 2.3
GB, never shared with the lane, and under the one name `.gitignore`
excludes so no graph walk could see it — so `git worktree remove` plus
`rm -rf` needed no `cargo clean` afterwards, which is forbidden here
anyway with two sibling lanes live. Proven rather than asserted: `cargo
test` from `app/src-tauri/` immediately after the removal is **exit 0,
18 of 18 suites ok, 0 failed, lib 259/0 in 4.18s.** The LANE worktree
stands, as the ceremony row requires — a verifier is owed and a worktree
deleted before the verdict destroys the only reproducible copy of what
was measured.

**One drill defect, caught by the drill's own read-back gate rather than
by luck.** The first script ran `git diff -- <repo-relative path>` from
`app/src-tauri`, where git resolves a pathspec against the CWD — so the
read-back showed an empty diff and the restore would have silently
no-opped, while `perl` (absolute path) had mutated the file for real. The
arm printed `mutated lines: 0` and I killed it. Fixed with `git -C`, the
scratch restored by hand and proven by sha256 before the re-run. This is
CONVENTIONS' *an edit script's success is a GATE* landing exactly as
written.

### THE THREE NEW BODIES

- `a_symlink_to_a_file_inside_docs_is_refused_by_the_link_checks_alone`
  — the fixture neither existing body can be: the link points INSIDE the
  tree, so both containment layers pass it and only the link
  classification can refuse it. That takes the shadow from five layers to
  two, which is the strongest body that can exist here. Its positive
  control is BUILT the way the producer builds it — the link removed and
  a real `.md` written at the same name, in the same place — so the
  refusal is the link's and not the name's, the depth's or the cap's.
- `relative_posix_is_the_containment_predicate_the_walk_relies_on` — the
  unit body the card proposed, on the predicate rather than the walk. Its
  positive control asserts the exact relative string rather than
  `is_some`, and it carries the `/tmp/proj-evil` case a byte-prefix check
  would get wrong, which is the reason both layers are spelled with path
  primitives.
- `the_prefix_check_and_relative_posix_are_one_predicate` — the shadowing
  claim as a CHECK rather than a comment, over a table asserted to
  contain both answers. It cannot detect `starts_with`'s removal (nothing
  can) but it detects the falsification of the REASON that removal is
  invisible: the edit that would silently promote a line documented as
  restatement into the only containment left.

### GATES — every exit read UNPIPED

- **`cargo test`** from `app/src-tauri/` at `8c5550d`: **exit 0**. 18
  suite result lines, 0 FAILED. Lib **259 passed / 0 failed** in 4.23s;
  `agent_runner` 87 passed / 0 failed / 1 ignored. The cache cliff did
  not fire: the lib suite's own time is 4.23s against the green band of
  under 9.5s, measured with two sibling lanes live.
- **The base was measured, so the delta is not arithmetic**: the same
  suite at `155993f` in the scratch worktree is **256 passed / 0 failed**
  in 4.64s, exit 0. 256 + 3 = 259, and the three are named above.
- **GRAPH REGEN fires** (a `.rs` outside `docs/`), so it was ASKED and
  NOT acted on — `graph.json` is outside this fence.
  `cargo run -p nputer-index -- index --check --root ../..` from
  `app/src-tauri/`: **exit 1, STALE**, and the staleness is exactly this
  card's one file: `files +0 -0 ~1`,
  `~ app/src-tauri/src/docs_watch.rs (content, loc 4167 -> 4385)`,
  1141994 → 1141995 bytes, 199 files / 2432 symbols / 2351 edges
  unchanged. Budget 1141995 of 2145959 (53.2%), 1003964 left. **The
  integrator regenerates and commits it at the checkpoint; this lane did
  not.**
- **BOOT GATE fires** (`app/src-tauri/**`): **exit 0** on the port
  DERIVED from the card id — `T-140-s9` → 20000 + 140×10 + 9 = **21409**,
  never defaulted. `lsof -nP -iTCP:21409 -sTCP:LISTEN` gave zero rows
  immediately before binding, and both startup lines arrived:
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-140-s9` and
  `[nputer] window "main" created`. **1420 was read with `lsof` and
  nothing else, at every check: nothing listening.**
- **DOCS GATE fires, and I first wrote here that it did not.** These
  notes change this card's own frontmatter (`status`, `built_by`) under
  `docs/tasks/`, which `lib/parser`'s own suites and three app suites
  READ — the gate's census names them. Derived from the diff rather than
  from the assumption: `npm run lint:docs` from `tools/e2e/` is **exit
  0** — *every live task card's frontmatter parses, with a legal status*,
  governing-document budgets hold (4 gated, 0 awaiting compaction), 166
  docs-shaped sites in 33 files. The census-currency gate beside it,
  `npm run capabilities:check`, is **exit 0, CURRENT (27138 bytes)** — no
  e2e spec name moved, so `docs/CAPABILITIES.md` needed no regeneration.
- METHOD EVAL GATE: not owed — nothing under `method/`.

### THE CLASS AND THE SWEEP

**The class**: a refusal whose removal is shadowed by a later check
computing the same outcome, with a test NAMED for the shadowed half — so
the suite reports coverage it does not have.

Searched with `git grep` over `*.rs`, and the search was **shown capable
of both hitting and missing before its result was written down**: the
same pattern against a planted line matched 1, and a one-token variant
(`starts_with(&canonzzz`) matched 0, grep exit 1.

- `starts_with(&?canon…)` beside a `relative_posix`: **2 hits** — this
  card's file, and `app/src-tauri/crates/nputer-index/src/walk.rs:89`.
- Every `is_symlink()` site: **14 hits**. Of these,
  `app/src-tauri/src/arch_cmd.rs:113,126`,
  `app/src-tauri/src/index_cmd.rs:66` and
  `app/src-tauri/src/agent/skills.rs:157,198` return DISTINCT typed
  outcomes or messages, so their removal IS observable — not the class.
  `crates/nputer-index/src/arch/registry.rs:119,133` and
  `crates/nputer-index/src/resolve/mod.rs:49` fold both halves into one
  expression, so the halves shadow each other but no separate layer
  claims depth and no body is named for the half — same shape, no false
  coverage. `crates/nputer-index/tests/perf.rs:31` is a test-fixture
  copier, not shipped behaviour.
- **One true sibling, and it is outside this fence** (routed below).

### ROUTED

**`nputer-index`'s walker is the same finding, one crate over.**
`app/src-tauri/crates/nputer-index/src/walk.rs::walk_root` refuses a link
four ways — `WalkBuilder::follow_links(false)`, then
`is_symlink() || !meta.is_file()` (the halves shadowing each other inside
ONE expression), then `starts_with(canon_root)`, then its own
`relative_posix` — and its single body,
`symlinks_are_never_followed_file_or_dir`, plants its link OUTSIDE the
root, so containment alone produces its green exactly as it does here.
It wants a card with fence
`app/src-tauri/crates/nputer-index/src/walk.rs` and the shape this lane
just proved: an INSIDE-pointing fixture plus a unit body on the
predicate. C-07, not C-05 — it could not be built here.

**Pre-existing, outside the fence, reported not touched**: `cargo test`
warns `unused import: Path` at `app/src-tauri/src/arch_cmd.rs:2`. Present
at `155993f`; that file was last written by `T-140-s1`.

### WHERE THE BRIEF WAS WRONG

1. **ROW 4's worktree path is inside the repository** —
   `/Users/ujju/Projects/nputer/.claude/worktrees/nputer-T-140-s9`, which
   `lane-protocol.md` rule three forbids. The real lane is the sibling
   `/Users/ujju/Projects/nputer-T-140-s9`, which the brief's own ROW 5
   states correctly. Already owned by `T-179`; reported, not moved.
2. **ROW 4's `base commit:` names `6e128c8`**, but this lane is cut at
   `155993f` — the value ROW 4's own `integration tip right now` line
   carries, and the tip named for all three live lanes in ROW 5. The
   repository wins: the base is `155993f`, and it measured green
   (256/0) before anything was touched.
3. **"Guarded three times" is an undercount.** Four containment checks in
   the walk; five drops for an outside-pointing link. Measured at A7/A8.
4. **The card's attribution of the surviving arm to `relative_posix` is
   wrong.** A1 shows `is_symlink`'s lift is absorbed by `!meta.is_file()`
   — `relative_posix` is not reached for a link at all while either link
   check stands.
5. **"Lifting any single guard reds something by name" is not achievable
   for two of the four**, and the drill is the proof rather than an
   excuse. The card's own carve-out — *a layer that provably cannot be
   detected even in principle should be named as such* — is the arm
   taken, and A1/A2/A4 are what earn it.

## Verdicts

2026-08-31 — claude-opus-5@subagent (verifier, blind seat):
**APPROVED WITH ASSIGNED CORRECTIONS.** The ruling is right, the
behaviour is provably unmoved, and the lift ledger REPRODUCES — I re-ran
all eight arms in my own bench without reading the ledger's numbers into
my attack set, and every row matched exit for exit, count for count and
name for name. The three corrections below are a sweep that stopped one
function short, a shape-SIX ask that was never put, and a wrong figure.
None of them is a reason to hold the lane.

Phase 1 was kept: attack set (**19 attacks, 10 named mutants**) written
from the card at `155993f`, `CONVENTIONS.md`, `roles/verifier.md` and
`docs_watch.rs` AT BASE, before the diff, the commits or the notes were
opened. It predicted the `!meta.is_file()` shadow independently, which
is the premise this card turns on — so the executor's correction of its
own card is confirmed by a seat that did not read the correction first.
**The dispatching brief did NOT leak executor-derived specifics**; it
named the card's claims and told me to verify rather than inherit them.

### WHAT I MEASURED MYSELF (bench `<scratch>/vb-T-140-s9`, detached, `CARGO_TARGET_DIR=<bench>/target`)

- **BASE `155993f`**: `cargo test -p nputer` **exit 0, lib 256 passed /
  0 failed** in 4.07s; `agent_runner` 87/0/1 ignored. Taken before the
  lane was opened, so the delta is measured and not arithmetic.
- **LANE `d9bfb15`**: `cargo test` **exit 0, 18 suite result lines, 0
  failed**; lib **259 passed / 0 failed** in 4.44s. 256 + 3 = 259, and
  all three new bodies appear in the run by name.
- **BOOT GATE: exit 0**, on **31409** — derived `30000 + 140x10 + 9`,
  deliberately not the lane's 21409. `lsof -nP -iTCP:31409
  -sTCP:LISTEN` zero rows before and after. Both lines observed:
  `[nputer] project folder: /Users/ujju/Projects/nputer-T-140-s9` and
  `[nputer] window "main" created`. **1420 read with `lsof -nP
  -iTCP:1420 -sTCP:LISTEN` and nothing else, before and after: zero
  rows.**
- **GRAPH REGEN: ASKED, not acted on.** `cargo run -p nputer-index --
  index --check --root ../..` → **exit 1, STALE**, and every figure the
  notes quote reproduces exactly: `files +0 -0 ~1`, `~
  app/src-tauri/src/docs_watch.rs (content, loc 4167 -> 4385)`, 1141994
  -> 1141995 bytes, 199 files / 2432 symbols / 2351 edges, budget 53.2%,
  1003964 left. `graph.json` untouched and uncommitted, as the fence
  requires.
- **The shipped walk is semantically IDENTICAL to base.** Comments
  stripped, the `collect_docs_tree` region at `155993f` and at `d9bfb15`
  differ in nothing but one trailing `// escaped the project` on an
  existing `continue;`. This changed the EVIDENCE and not the refusal,
  so the security-adjacent behaviour owes no further drill.
- **Fence respected**: the diff is two files, `docs_watch.rs` and this
  card. No `graph.json`, no lockfile, no stray target dir.
- **`ddefda4` checks out.** It exists, its blob of `docs_watch.rs`
  hashes to `9bcf07ca…` — the exact restoration hash the notes claim —
  and `git diff ddefda4 8c5550d` on that file is the one comment block
  and nothing else. The ledger measured at `ddefda4` therefore describes
  the shipped code.
- **The A8 lifted arm terminated in FIXTURES**, verified independently
  rather than taken: every path in my own all-five-lifted failure output
  is a `TempTree` under `$TMPDIR`
  (`nputer-t003-{pick-contain,subdir-symlink,symlink}-outside-…/secret.md`),
  plus `/tmp/other/secret.md`, which is a string literal in a unit body
  and never touched on disk. Nothing reached a real file.
- **The class sweep's counts reproduce**: 14 `is_symlink()` sites, and 2
  for `starts_with\(&?canon` — the second needs the notes' regex, since
  `walk.rs:89` has no `&`. The routed `walk.rs` finding is accurate:
  `symlinks_are_never_followed_file_or_dir` plants OUTSIDE the root, so
  containment produces its green exactly as here.

### MY LIFT LEDGER — 13 arms, run blind of the lane's, all restored and proven

One side only; each mutation read back with `git -C <bench> diff` before
the run and refused on a silent zero; each restored with `git restore
--source=d9bfb15 --staged --worktree` and **proven by `shasum -a 256` ==
`65b57e6eb7b9bdae3a0127391b7f6a99f421497ede7565bb856f9aee7c9cdfc8`, the
committed blob — 13 for 13.**

| mine | lifted | exit | result | red BY NAME | lane's row |
|---|---|---|---|---|---|
| D1 | `is_symlink` | 0 | 259/0 | nothing | A1 ✓ |
| D2 | `!meta.is_file()` | 0 | 259/0 | nothing | A2 ✓ |
| D3 | both link checks | 101 | 258/1 | the inside-pointing body | A3 ✓ |
| D4 | `starts_with` | 0 | 259/0 | nothing | A4 ✓ |
| D5 | `relative_posix`'s `.ok()?` | 101 | 257/2 | the predicate body + the one-predicate body | A5 ✓ |
| D6 | the first three | 101 | 258/1 | the inside-pointing body | A6 ✓ |
| D7 | all four | 101 | 256/3 | the three new; **both `*_never_followed` GREEN** | A7 ✓ |
| D8 | all four + `docs/` prefix | 101 | 252/7 | the three new + the four walk-level symlink bodies | A8 ✓ |
| **D9** | `is_symlink` half of **line 779** | **0** | **259/0** | **nothing** | not run |
| **D10** | `is_symlink` half of **`is_plain_dir`** | **0** | **259/0** | **nothing** | not run |
| **D11** | `parts.join("/")` -> `join("!")` | 101 | 221/38 | 38 bodies | not run |
| **D12** | **line 779's guard ENTIRELY** (`if false {`) | **0** | **259/0** | **nothing** | not run |
| **D13** | `is_plain_dir` entirely (`Ok(_) => true`) | 101 | 256/3 | `picking_a_root_whose_docs_is_a_symlink_is_refused`, `a_genesis_root_swapped_for_a_symlink_is_refused_at_arm_time`, `a_failed_genesis_pick_leaves_the_open_project_untouched` | not run |

D1–D8 confirm the card's premise was an undercount and its *"killed by
(3)"* attribution false, exactly as the notes say. D9–D13 are mine and
are the first correction.

### CORRECTION 1 — THE SWEEP STOPPED ONE FUNCTION SHORT, INSIDE ITS OWN FENCE

*"One true sibling, and it is outside this fence"* is **false**. There
are three, and two are in `docs_watch.rs` itself — both listed among the
sweep's own 14 hits and neither classified. This is CONVENTIONS' A FIX
NAMES ITS CLASS AND ITS SWEEP landing precisely as written: T-078 *"left
an identical sibling a few lines away, both inside the subsection that
announces the sweep."*

- **`is_plain_dir`, line 490** — `!meta.file_type().is_symlink() &&
  meta.is_dir()` over `fs::symlink_metadata`. The `is_symlink` half is
  **inert for the same lstat reason as the walk's layer 1**: a link is
  not `is_dir()` either. MEASURED (D10): rewriting the arm to `Ok(meta)
  => meta.is_dir(),` leaves **259 passed / 0 failed, exit 0**. Yet
  `picking_a_root_whose_docs_is_a_symlink_is_refused` and
  `a_genesis_root_swapped_for_a_symlink_is_refused_at_arm_time` are
  NAMED for that refusal, and D13 shows they red only when the whole
  predicate goes. **A body named for the symlink half, pinning
  `is_dir()`** — this card's finding, one function away, and the
  function whose own doc comment calls itself *"the T-003 rule family's
  one primitive."*
- **`collect_docs_tree`'s docs_root guard, line 779** — `if
  docs_meta.file_type().is_symlink() || !docs_meta.is_dir()`. The
  `is_symlink` half is shadowed by `!is_dir()` **inside the same
  expression** (D9: 259/0), which is the shape the sweep correctly
  identified in `registry.rs`/`resolve/mod.rs` and did not look for
  here. **And the whole guard is unpinned** (D12): replacing it with `if
  false {` — deleting the refusal AND its `eprintln!("[nputer] watch: …
  is not a plain directory - refusing to read it")`, the collector's
  only loud refusal — leaves **259 passed / 0 failed, exit 0**. Every
  body that plants a symlinked `docs/` is refused earlier by
  `is_plain_dir` and never reaches this line. Containment still stops a
  leak, so this is a COVERAGE hole and not a vulnerability — but it is a
  whole refusal, not a shadowed half, unpinned on the ADR-010 boundary
  inside this fence.

TO DO: name both sites the way the walk's four are now named — one
comment each saying which half is inert and why — add D9/D10/D12 to the
ledger, and correct the sweep sentence to "three, two of them inside
this fence." If pinning line 779 wants a new body, route it and say so
rather than widening this fence.

### CORRECTION 2 — SHAPE SIX WAS NEVER ASKED, AND THE LANE'S OWN A5 ROW IS THE EVIDENCE

The catalogue is explicit that an assertion poison does NOT answer six
(*"it is not vacuous in the poison sense, which is exactly why the
discipline passed it"*), so P1–P3 do not discharge it. The ask is: name
a mutant of the code under test the body kills, run the WHOLE suite,
require the failing count to be **ONE**. Put, it answers:

- `a_symlink_to_a_file_inside_docs_is_refused_by_the_link_checks_alone`
  — D3, **count 1. Clean.** Record it as the shape-SIX pass it is.
- `relative_posix_is_the_containment_predicate_the_walk_relies_on` — D5
  count **2**; my second candidate D11 (`join("/")` -> `join("!")`)
  count **38**. No count-1 mutant found.
- `the_prefix_check_and_relative_posix_are_one_predicate` — killed by D5
  (count 2, alongside the body above) and **not** by D11, because it
  asserts only `.is_some()` and every Some-side mutant is invisible to
  it. **Every mutant it kills, the body above also kills. That is shape
  SIX by the catalogue's definition.** Its subject is a std-library
  equivalence, which no first-party mutant can falsify — so the honest
  sentence is that no unique mutant exists, which the catalogue calls
  the finding rather than a failure.

TO DO: record the ask and its three answers in the notes with the counts
above. Do NOT delete the one-predicate body on my account — it documents
the shadowing argument as a check and that has value — but do not leave
it standing as if the drill had cleared it.

### CORRECTION 3 — THE DIFF FIGURE IS WRONG

The notes open with *"one file, +223/-6"*. `git diff --numstat
155993f..8c5550d -- app/src-tauri/src/docs_watch.rs` gives **224 6**.
Read **+224/-6**. Same class as this branch's own `f21b1bf` three
commits back.

### OBSERVATIONS, NOT CORRECTIONS

- **The card's TITLE and FILENAME still say "guarded three times … no
  test can poison fewer than three"**, which this lane has now measured
  false at A7/A8 and I have reproduced. The body retracts it; the title
  does not. Renaming strands three cards' references and a filename is
  the orchestrator's to move — flagged for the integrator, not assigned.
- The ledger row `!meta.is_file() alone -> … (shadowed)` is loose: that
  line is shadowed **for symlinks only**, and is the sole refusal for
  sockets, fifos and devices — which the lane's own site comment says
  correctly. One word in the row would settle it.

### SECURITY SWEEP — CLEAN

No new input path, endpoint, secret, key, unsafe default or dependency.
Every line added to shipped code is a comment; all three new bodies are
inside `#[cfg(test)] mod tests`; the refusal's behaviour is proven
byte-identical to base. Nothing to report.

### INTERMITTENTS — NONE FIRED, SO NOTHING TO ATTRIBUTE

`a_hostile_session_id…` (T-086-s1) and `startup_arm_watches_the_initial_root`
(T-088-s4) passed in every green run. Lib-suite time 4.07s at base,
4.44s at the tip, 4.09–4.98s across the drill arms — the whole pass sat
under the 9.5s green band with two sibling lanes live, so the cache
cliff never came near. The single 18.77s arm is D11, whose 38 deliberate
failures are the cost.

### BENCH HYGIENE

Bench `<scratch>/vb-T-140-s9`, detached, `CARGO_TARGET_DIR` at
`<bench>/target` throughout — never shared with the lane or the
integration checkout, and removed after this verdict with the bench
proved clean (`git status --short` empty at every arm's end). Nothing
merged, nothing pushed, no worktree but my own bench removed.
The lane worktree stands.
