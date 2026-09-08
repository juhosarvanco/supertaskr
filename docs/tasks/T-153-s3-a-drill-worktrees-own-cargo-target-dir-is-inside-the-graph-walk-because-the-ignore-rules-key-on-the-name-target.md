---
id: T-153-s3
title: A drill worktree's own CARGO_TARGET_DIR is INSIDE the graph walk, because the ignore rules key on the name "target" and the convention tells you to pick a different one
feature: F-06
milestone: 4
priority: 11
size: S
status: verifying
blocked_by: []
touches: [crate-index]
suggested_by: executor claude-opus-5 @T-153-s2
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review:
---

**PROMOTED at the first standing triage, 2026-08-30. THIS CARD ALREADY HAD A SLOT WRITTEN FOR IT AND NEITHER DOCUMENT KNEW.**

`T-111-s10` (planned, `touches: [docs/CONVENTIONS.md]`) carries a
criterion that routes exactly this work and names no card:
*"THE class fix (teaching the walk to skip any directory containing
cargo's own `CACHEDIR.TAG`) SHALL be ROUTED as its own `[crate-index]`
card rather than taken here — it is code, it is a different fence, and
the doc edit must not wait on it. Arm (a) and arm (c) are not
alternatives."* **T-153-s3 IS that card.** Promoting it with the
`[crate-index]` fence T-111-s10 specifies is what makes the routing real
instead of a sentence hoping someone connects it.

Re-derived at this ref — **documented, not fixed**, which is the trap:
`.nputerignore` lists only `docs/`, the index fixtures dir and `tools/`;
`.gitignore:4` has the sole entry `target/`; `grep -rn 'CACHEDIR'` over
`crates/nputer-index/src/` returns nothing and `walk.rs:55` still only
calls `add_custom_ignore_filename(".nputerignore")`. `docs/CONVENTIONS.md`
still instructs a drill to **"GIVE IT ITS OWN `CARGO_TARGET_DIR` INSIDE
ITSELF"** with `<scratch>/.drilltarget` as the worked example. So the
convention still tells a seat to build the very directory the walk will
index, and the only thing that changed is that `docs/STATE.md` now warns
about it as a standing hazard. **A hazard note is not a fix, and the
distance between them is this card.**

**DISPATCH ORDER NOTE:** T-111-s10's own criterion says the doc edit must
NOT wait on this, and that lane is live right now
(`task/T-111-s10-poison-drill-bullet`). The fences are disjoint —
`crate-index` here, `docs/CONVENTIONS.md` there — so this may run
concurrently, which is precisely what that criterion arranged for.

**CONVENTIONS' POISON DRILL bullet says to drill in a detached scratch
worktree and give it its OWN `CARGO_TARGET_DIR` INSIDE ITSELF, and
`T-092` says to derive the whole stem from the lane id — one stem, every
artefact, no exceptions.** Obeying both produces a build directory named
something like `.t153s2-target` at the worktree root. **Nothing ignores
it.** `.nputerignore` names `docs/`, the indexer's fixture tree and
`tools/`, and the only thing keeping a normal build directory out of the
graph is the NAME `target`, which the drill's derived stem deliberately
is not.

## Measured, at `b5e3e4e` in a detached drill worktree

A graph regen run inside that worktree —
`NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test self_graph --
--ignored`, exit 0 — produced a graph of **201 files**, where the lane's
own `index --check` at the same commit reports **189**. The **12** extra
are cargo build-script outputs the walk found because they are `.rs` and
`.js` and nobody excluded them:

    .t153s2-target/debug/build/nputer-…/out/__global-api-script.js
    .t153s2-target/debug/build/serde_core-…/out/private.rs
    .t153s2-target/debug/build/web_atoms-…/out/named_entities.rs
    … 9 more, all under .t153s2-target/debug/build/*/out/

`index --check` then answered **CURRENT at 1,029,909 bytes, 99.0% of the
budget with 10,091 left** — a green verdict over a tree that contains
twelve files existing nowhere but one session's scratch directory. The
clean fresh index at the same commit is **1,021,184 bytes / 189 files /
2,156 symbols / 2,111 edges**, 98.2% with 18,816 left. **The
contamination ate 8,725 bytes of a budget this repository is already
within 2% of** (`T-151` is the card about that margin).

Nothing was committed: the drill's `docs/architecture/graph.json` was
restored and sha256-proved against `b5e3e4e` before anything else ran.
It was caught only because the file count looked wrong beside a number
read minutes earlier — not by any gate.

## THIS IS THE SECOND SIGHTING IN ONE DAY, BY A DIFFERENT SEAT

**T-154's verifier hit it first and routed it**, hours before this lane
did — read it there rather than trusting this card's account of it:
`docs/tasks/T-154-the-fence-becomes-a-property-at-the-moment-of-the-write.md`,
the paragraph headed *"A HAZARD I CREATED AND ANYONE REPEATING THIS PASS
WILL CREATE"*, plus its routed item 5. Same mechanism, same **twelve**
cargo build artifacts, target directory at `/tmp/v154/.cargotarget`. Its
own sentence is the diagnosis this lane independently reached: *"Two
written rules collide here and neither names the other"*.

**IT IS FILED HERE BECAUSE A VERDICT'S ROUTED ITEM IS NOT A CARD** and
the board cannot see one — which is the same reason the suggestion-triage
convention makes filing, not mentioning, the move that discharges a
finding.

**AND THE TWO SIGHTINGS SAW OPPOSITE HALVES, WHICH IS WHAT RAISES THIS
ABOVE A REPEAT.** T-154's seat saw a FALSE STALE — the gate refusing over
artifacts, loud, exit 1, and it cost that session a run. This lane ran the
REGEN first, so the artifacts went INTO the committed graph and
`index --check` then answered **CURRENT at exit 0** over a tree containing
twelve files that exist in one scratch directory and nowhere else. **The
loud half costs a run; the silent half is the one that commits**, and no
gate stands between it and a checkpoint.

## Why this is a defect and not a session's mistake

The three rules that produce it are each right on their own, and they are
in three different files:

- POISON DRILL says the target directory goes INSIDE the drill worktree.
- `T-092`'s clause says every artefact carries the lane-derived stem, so
  it must NOT be called `target`.
- The graph walk excludes build output by NAME, via `.gitignore`'s
  `target/`, and `.nputerignore` never mentions build output at all.

So the convention instructs a session into the one directory name the
walk does not skip. **And the failure is silent in the direction that
matters**: the regen SUCCEEDS, `index --check` says CURRENT, and the
poison is only visible as a file count nobody has a reason to read.

## Arms

- **(a)** `.nputerignore` gains the build-output shape rather than a
  name — the pattern that catches any `*target*` build directory, or
  better, `**/build/*/out/` under any of them. Cheapest, and it fixes
  every future stem at once.
- **(b)** POISON DRILL names the collision where the target directory is
  chosen, and prescribes a stem that IS ignored (e.g.
  `target-t153s2/`, if the ignore pattern is widened to match) — a doc
  fix that depends on (a) to be true.
- **(c)** The regen refuses to write a graph containing a path under a
  cargo build directory, which is the only arm that cannot be forgotten.
  Most expensive; worth it only if (a) proves insufficient.

**(a) plus (b) is the pair.** Whoever takes it should derive the file
count and the byte figures at their own ref — every number above is a
function of a tree and is stamped at `b5e3e4e`.

## Implementation notes

**Built as arm (c)'s cheaper sibling rather than as (a) or (b), and the
card's own Arms list is where this lane disagrees with its card** — said
plainly because the criteria that were actually built are on a DIFFERENT
card. `T-111-s11` (`status: planned`, `touches: [crate-index]` — the
identical fence) carries exact, code-only acceptance criteria for the
class fix, and `T-111-s10`'s third criterion had already ordered that
card into existence. This card carries no `## Acceptance criteria`
section at all; its Arms are (a) a widened ignore pattern, (b) a doc fix
depending on (a), and (c) a regen-time refusal. **Neither (a) nor (b) was
taken, and both are now moot**: `T-111-s10` landed (a) as the POISON
DRILL bullet's `<scratch>/target`, and that bullet at this lane's base
already reads *"Skipping any directory carrying cargo's `CACHEDIR.TAG` is
the CLASS fix and `crate-index`'s code"* — the doc half is DONE and is
outside this fence besides. What was built is `T-111-s11`'s criteria
exactly. **Arm (a) is refused in writing rather than skipped**: a
`*target*` ignore pattern keys on the NAME again, which is the property
`T-111-s11`'s second criterion rules out, and it would have to be widened
once more for the next chosen stem.

### What landed

`app/src-tauri/crates/supertaskr-index/src/walk.rs`:

- `CACHEDIR_TAG_SIGNATURE` — the 43 bytes of the cache-directory spec
  (<https://bford.info/cachedir/>), which is the whole first line cargo
  writes. Deliberately not cargo-specific: the criterion asks for an
  exclusion that holds for any tool writing the same tag.
- `carries_cachedir_tag(dir)` — one bounded `open` + read per directory,
  requiring the FIRST LINE (to the `\n`, `\r` trimmed) to equal that
  signature. Every I/O error answers "untagged", the direction that keeps
  a file: the walk's three error arms already have no word for *"I could
  not tell"* and this adds no fourth way to lose a file to an unreadable
  byte.
- the CACHE-DIRECTORY SKIP in `filter_entry`, beside the
  `.git`/`node_modules` hard skip. Directory-only, so no per-file cost —
  and with `follow_links(false)` a SYMLINK to a tagged directory is not a
  directory here, so this skip never reads through a link.
- the site's mechanism ledger, which the heading asks a reader to recount
  from source: ELEVEN mechanisms / THIRTEEN sites become TWELVE /
  FOURTEEN, both on the builder side, and the unlettered construct list
  gains its seventh entry. The new refusal is deliberately NOT lettered —
  the lettered set is A–E and the name-keyed hard skip it sits beside is
  unlettered too; re-lettering would strand three cards' citations.

`app/src-tauri/crates/supertaskr-index/tests/perf.rs`: the sweep landing
where it stood (below).

### The bodies, and what each one pins

Fixture tags are TYPED LITERALS, never derived from the constant under
test — *a test parametrised by the constant it checks cannot pin that
constant*. Arm A4 of the drill is what proves that held.

- `a_cargo_target_directory_is_skipped_under_any_name_by_its_cachedir_tag`
  (walk.rs) — a build directory under a chosen stem AND a second one
  nested two levels down, both pruned whole; control removes only the two
  tag files and expects all three artefacts back.
- `a_cachedir_tag_whose_first_line_is_not_the_signature_never_skips`
  (walk.rs) — three arms in one tree: a near-miss signature is WALKED,
  the real signature under a non-cargo comment body is SKIPPED, cargo's
  own bytes are SKIPPED.
- `a_tag_on_the_walk_root_itself_does_not_empty_the_walk` (walk.rs) —
  the LIMIT, and it exists because the first draft of the site comment
  asserted the opposite. **MEASURED: `ignore` 0.4.33 does not offer
  `filter_entry` the root entry**, so no depth guard is written and none
  is needed; the body is what would notice a version bump changing that.
- `a_cargo_target_directory_under_a_chosen_name_never_enters_the_graph`
  (tests/containment.rs) — the same property through `index()` end to
  end, with the three artefact shapes both sightings measured, plus a
  payload assertion that no artefact name reaches `stable_json`.

**FOR THE VERIFIER, NAMED RATHER THAN LEFT TO BE FOUND**: that last body
kills no mutant the walk-level one does not (drill arms A1 and A4 red
them together, never apart). By the letter that is poison shape SIX, and
no count-1 mutant for it exists — which the catalogue says IS the
finding, so here it is. It is kept anyway as a deliberate unit/integration
PAIR over one property, the shape `tests/cli.rs`'s own module doc already
declares for this crate (*"The in-process unit tests in `src/cli.rs`
cover the same paths for speed; this suite is what proves the process
boundary agrees with them"*). Delete it and the graph-level claim rests
on inspection.

### The drill — five arms, crate scope, `--no-fail-fast`, 12 targets every arm

Detached scratch worktree at `c2f4d55`, `CARGO_TARGET_DIR` at
`<scratch>/target` — **the name this card is about, taken because
`T-111-s10` landed arm (a) and because this lane's own fix now covers it
either way**. One side mutated per arm, always the PRODUCER; the mutation
read back with `git -C … diff -U0` before the suite ran; restored with
`git restore --source=c2f4d55 --staged --worktree`; the restoration
proved by sha256 against `git show c2f4d55:` — `RESTORE_PROVED=yes` on
all five, with the companion empty per-path diff beside it and never
instead of it. Baseline 268 passed / 0 failed over 12 targets, exit 0.

| arm | mutation (producer side) | exit | pass/fail | failing bodies |
|---|---|---|---|---|
| A1 | the skip decides nothing (`return false` → `return true`) | 101 | 265/3 | the two walk bodies + the containment body |
| A2 | key on the tag file's PRESENCE, not its signature | 101 | 267/1 | the near-miss body, ALONE |
| A3 | extend the skip to the walk ROOT | 101 | 267/1 | the root-limit body, ALONE |
| A4 | DATA mutant: one hex digit of `CACHEDIR_TAG_SIGNATURE` | 101 | 265/3 | the same three as A1 |
| A5 | narrow "any directory" to depth 1 only | 101 | 267/1 | the any-name body, ALONE |

A5 was derived from the CRITERIA with the test file closed (poison shape
SEVEN's procedure) — the criterion says ANY directory, the pins only
reached depth 1, and the nested fixture was added because of it. A4 is
the DATA mutant the property's data half needs; it is asymmetric only
because the fixtures type the literal. **`git_and_node_modules_are_hard_
skipped_even_when_not_ignored` stayed GREEN under A1**, which is how the
mutation is known to have hit the cache-dir `return false` and not the
hard skip's.

**AND THE DRILL'S OWN PROOF WAS SHOWN CAPABLE OF FAILING** (poison shape
TEN, and the proof clause): a byte appended to the restored file made the
sha comparison print `RESTORE_PROVED=NO`, and the expected side was
asserted non-empty at 63,606 bytes before any zero was written down.

### `index --check` before and after, against ONE planted directory

`T-111-s11`'s fourth criterion, answered with a single instrument: the
same untracked `.t153s3demo-target/` — a conforming `CACHEDIR.TAG` plus
`debug/build/serde_core-1a2b3c/out/private.rs` and a `.js` — planted in
the scratch worktree, with the checkout moved under it.

- **base `bcc833f`, unplanted**: `CURRENT`, exit 0, 1,191,343 bytes ·
  201 files · 2,542 symbols · 2,441 edges.
- **base `bcc833f`, planted**: `STALE`, exit 1, **`files +2 -0 ~0`**
  naming both artefacts, 203 files, and the header's language set moved
  `[rust, ts] -> [js, rust, ts]` on the strength of one generated file.
  The defect, reproduced at this lane's own base.
- **tip `c2f4d55`, the SAME plant still on disk**: `STALE`, exit 1,
  **`files +0 -0 ~2`**, 201 files, and the only two movements are this
  lane's own edited `.rs` files (symbols 2,542 → 2,546). No artefact, no
  header move.

**THE GRAPH IS STALE AT THIS TIP AND THAT IS OWED, NOT A DEFECT**:
`docs/architecture/graph.json` is outside `crate-index`'s fence, and
GRAPH REGEN belongs to the integrator at the checkpoint with the dogfood
pins. `files +0 -0` is the sentence that says the walk change dropped
nothing from this repository's own graph.

### The class and its sweep

CLASS: a walk that excludes build output by the NAME `target`. SWEEP:
`git grep -n '"target"' -- '*.rs' '*.ts' '*.tsx' '*.mjs' '*.js'` from the
repo root, shown capable of finding first (the same query over
`"node_modules"` returns hits). Three members, two dispositions:

- **FIXED WHERE IT STOOD, in fence** — `copy_repo_to` in
  `tests/perf.rs` skipped `.git|node_modules|target|dist` by name, so a
  drill's target dir under its lane stem was COPIED, gigabytes of it,
  and then timed over. It now also skips a directory holding a
  `CACHEDIR.TAG`. **The test there is PRESENCE, weaker than the walk's
  signature test, on purpose and documented at the site**: dropping a
  directory the walk should have kept loses repository content, while
  copying one a perf harness could have kept costs nothing.
- **ROUTED, out of fence** — `SKIP_DIRS` in
  `tools/e2e/scripts/token-scan.mjs` and in
  `tools/e2e/scripts/docs-scan.mjs` carry the same name list. Filed as
  `T-153-s17` (`status: suggested`, `touches: [tools/e2e]`). `tools/e2e`
  was `T-224`'s live fence besides.
- **NO CHANGE OWED, and saying so is part of the sweep** — `.gitignore`'s
  `target/`. Keying an ignore LIST on a name is what `T-111-s11`'s second
  criterion refuses as a FIX; it is not a defect in the list.

**AND THE SWEEP'S FIRST RUN WAS ITSELF THE BUG IT LOOKS FOR.** It was
piped through `grep -v node_modules` and silently lost `perf.rs` — the
one member inside this lane's own fence — because that line names both
directories. The unfiltered re-run is the one above. A miss is not a
refutation.

### Two things a reader should not have to rediscover

- **`T-111-s11` is discharged and must not be dispatched.** Its criteria
  are what this lane built; its own body now carries the
  criterion-by-criterion account and a `closed_by:` line. Its `status:`
  is deliberately unmoved — that disposition is triage's.
- **The crate is not rustfmt-clean at this base** and was not made so:
  `cargo fmt -p supertaskr-index -- --check` exits 1 over 29 files at
  `bcc833f`, there is no `rustfmt.toml`, and no gate or CI step runs it.
  Every line this lane added IS rustfmt-clean — verified by grepping the
  check's own diff for the new identifiers and finding none — but running
  the formatter would have produced a 186-hunk diff across the fence for
  no gate. Recorded rather than routed: it is a standing state of the
  tree, not this lane's finding.

## Verdicts
