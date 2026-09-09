---
id: T-153-s3
title: A drill worktree's own CARGO_TARGET_DIR is INSIDE the graph walk, because the ignore rules key on the name "target" and the convention tells you to pick a different one
feature: F-06
milestone: 4
priority: 11
size: S
status: done
blocked_by: []
touches: [crate-index]
suggested_by: executor claude-opus-5 @T-153-s2
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: "claude-opus-5@subagent (blind two-phase, 1 pass)"
review: same-model
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

### 2026-09-09 — claude-opus-5@subagent — APPROVED WITH ASSIGNED CORRECTIONS

    tip:        a007884b2a0ea77f0ba454e7e6efbecef5c7fc81
    base:       bcc833fbe16842d1ff21840b2e4d50e8522e0919
    bench:      /Users/ujju/Projects/nputer-V-T-153-s3, detached, clean
    attack set: sha256:e4a56805f7496a1f4ff1b7d3c9f0d6765bd5f731d1be6e856825ee7ce73a7872 (attack-set-T-153-s3.md)
    ground:     sha256:519774e2ab91e4e08934ee236c292a085382c1e54aaebfefc900caf10dc8559d (ground-T-153-s3.md)

Both digests were verified with `shasum -a 256` before either file was
opened. **The work is correct, aimed where the property lives, and
fenced.** Two corrections are assigned, one of them a producer change:
the diff introduces a way to HANG the walk that did not exist at the
base, and one property the drill leaves unpinned. Both are named below
with the body that pins them, and both were written, run and seen to
FAIL by this seat before being assigned.

#### The frame I actually had

**Two spawns.** Phase 1 wrote the attack set with no tools — by
INSTRUCTION, because this harness cannot deny a spawn its tools; the
attack set reports `tool calls made: 0` in its own last line and this
verdict repeats it rather than rounding it off (docs/reference/
07-verification.md, "The frame disclosure"). I am a fresh spawn holding
the tools and the tree.

**My brief carried no executor-derived specifics** — no mutant numbers,
no path counts, no suite figures. It named the diff's file list in
prose (`walk.rs, tests/containment.rs, the card, T-111-s11 discharged,
T-153-s17 and T-153-s18 filed`) and that list was INCOMPLETE — it omits
`tests/perf.rs`, which the diff also carries — so what it gave me was
strictly less than `git diff --stat` and led nothing. It also carried
the dispatcher's Errata correcting GT-4, which is ground truth taken at
the base, not executor material.

**One leak, disclosed:** the executor's Implementation notes are part of
the diff (they are a change to this card), so reading `git diff
bcc833f..a007884` in full — which the brief directs, and which is the
only way to read the cards filed — put the executor's own account in
front of me. I had already read `walk.rs`, `containment.rs` and
`perf.rs` and formed the attack plan before opening the `docs/tasks`
hunk, and every figure below is my own measurement at a named ref. The
executor's numbers were treated as claims to re-derive; where mine agree
with its, that is a match and it is said so.

#### Which criteria I judged against, and why

**The executor's reading is RIGHT, and I checked it rather than
accepting it.** Read whole at the base (`git show bcc833f:docs/tasks/
T-153-s3-…md`), THIS CARD HAS NO `## Acceptance criteria` SECTION — its
body runs preamble, *Measured at b5e3e4e*, *THIS IS THE SECOND
SIGHTING*, *Why this is a defect*, *Arms*, and stops. What it offers
instead is three Arms.

`T-111-s11` carries five exact, code-only acceptance criteria for this
class fix under the IDENTICAL fence, `touches: [crate-index]`. The two
cards are one work item written twice from two directions: this card's
own opening says *"`T-153-s3` IS that card"* about `T-111-s10`'s routing
criterion, and `T-111-s11` says it was routed into existence by that
same criterion. **So I judged the work against `T-111-s11`'s five
criteria as the operative spec, and against this card's Arms as a
secondary check on whether the lane's disagreement with its own card is
defensible.** It is:

- **Arm (a)** — a widened `*target*` ignore pattern — keys on the NAME
  again, which is exactly what `T-111-s11`'s second criterion refuses as
  a fix. Refusing it IN WRITING rather than skipping it is the right
  move and the notes do.
- **Arm (b)** — the doc fix — is already landed and out of fence.
  Verified at the base, not taken on trust: `git show
  bcc833f:docs/CONVENTIONS.md` line 1754 already reads *"Skipping any
  directory carrying cargo's `CACHEDIR.TAG` is the CLASS fix and
  `crate-index`'s code"*, and the bullet already sends a drill to
  `<scratch>/target`. `docs/CONVENTIONS.md` is untouched by this diff,
  which is correct twice over.
- **Arm (c)** — a regen-time refusal — the card itself says it is worth
  it only if (a) proves insufficient. The walk fix makes the graph
  correct at the source, so (c) is not owed.

#### The criteria, one by one, against the tree

1. **"THE walk SHALL skip any directory containing a `CACHEDIR.TAG`
   file whose first line is cargo's own tag signature, rather than
   matching on the directory's NAME."** **MET.** `carries_cachedir_tag`
   (`src/walk.rs`) opens `<dir>/CACHEDIR.TAG`, reads a BOUNDED 44 bytes
   (`CACHEDIR_TAG_SIGNATURE.len() + 1`), takes the first line to the
   `\n`, trims one `\r`, and requires equality with the 43-byte
   signature. Driven end to end through the real binary over hand-built
   trees, not only through the suite:

       .vtarget/ tagged, sources under debug/build/*/out/  -> FILES: ['real.ts']
       build-out/ with a DECOY signature                   -> FILES: ['build-out/kept.ts', 'real.ts']
       a CRLF tag                                          -> FILES: ['real.ts']

   The only `"target"` string literal anywhere in `src/` is inside a
   test assertion asserting the fixture stem is NOT `target`
   (`src/walk.rs:577`). `git grep -iE 'drilltarget|t153s2|CARGO_TARGET_DIR|\*target\*' -- src/`
   returns no production hit. **This is the class fix and not an
   instance fix.**

2. **"THE exclusion SHALL be derived from the tag FILE and not from a
   widened ignore list."** **MET.** `git diff bcc833f..a007884 --
   .gitignore .supertaskrignore` is EMPTY, and the
   `add_custom_ignore_filename(".supertaskrignore")` call survives
   unchanged. The tag rule is additive: deleting the ignore-file
   mechanism (mutant VM5) reds four bodies, so the old mechanism was not
   quietly replaced by the new one. The "any tool that writes the same
   tag" half is real — a body drives the same 43 bytes under a
   NON-cargo comment body and the skip fires identically, which I
   re-confirmed live.

3. **"THE change SHALL carry a positive control: a fixture directory
   that DOES carry the tag is excluded and an otherwise identical one
   that does NOT is still walked."** **MET, and the control is armed
   where the arming differs.** Every new body's control is the SAME
   tree with only the tag file removed, and the untagged expectation is
   a hand-typed literal naming every artefact that comes back. I did
   not take that on inspection — see the DATA mutants VM10/VM11 below,
   where the same planted tag decides the golden differently under two
   implementations.

4. **"THE lane SHALL re-derive the graph at its own ref and record
   `index --check`'s answer before and after."** **MET by the lane, and
   re-measured here.** From `app/src-tauri` in the bench,
   `cargo run -q -p supertaskr-index -- index --check --root ../..`:

       graph.json is STALE - the committed graph does not match a fresh index
         committed:   1191343 bytes · 201 files · 2542 symbols · 2441 edges
         fresh index: 1192562 bytes · 201 files · 2546 symbols · 2441 edges
         files  +0  -0  ~3
         | ~ .../src/walk.rs          (content, loc 865 -> 1173, symbols 4 -> 6)
         | ~ .../tests/containment.rs (content, loc 86 -> 179, symbols 5 -> 7)
         | ~ .../tests/perf.rs        (content, loc 99 -> 119)
         budget: 1192562 of 2145959 bytes (55.6%) - 953397 left
       exit 1

   **STALE at the tip is the OWED state, and `files +0 -0` is the
   sentence that matters.** The three `~` entries are this lane's own
   three edited source files and nothing else; the file count is 201 at
   the base and 201 fresh at the tip, so the walk change added no
   phantom and dropped no real file. My dispatch brief expected CURRENT
   here; that expectation was wrong in a way that costs nothing — any
   edit to a walked source file makes the committed graph stale until a
   regen, and regen is the integrator's at the checkpoint because
   `docs/architecture/graph.json` is outside the `crate-index` fence.

5. **"THE doc half SHALL NOT be re-taken here."** **MET.**
   `docs/CONVENTIONS.md` is untouched.

#### The fence, and the graph

`git diff --name-only bcc833f..a007884` is seven paths: three inside
`app/src-tauri/crates/supertaskr-index/` (the `crate-index` registry
slug) and four in `docs/tasks/`, which is always writable. Nothing else.

- `git diff bcc833f..a007884 -- docs/architecture/graph.json app/test`
  is **EMPTY**.
- The graph BLOB is byte-identical at both refs:
  `git rev-parse {bcc833f,a007884}:docs/architecture/graph.json` both
  give `a4dbf9a1d87720371c9a61fed769cb876b5af887`, and the working file
  hashes `sha256:9953f446615f1dfd794df91c625c0d4b8c70aaddd3559684aa143dc8e309261e`
  — the same digest GT-4 recorded at the base.
- **A-12 lands on branch (a)**, which the dispatcher's Errata named as
  the expectation: no in-lane regen, no touched dogfood pin, no widened
  budget. The budget logic is untouched (no numeric constant, percentage
  or comparison in the staleness path is in the diff) and the reported
  headroom moved only by this lane's own added source lines, 55.5% to
  55.6%.
- **The diff touches NO parser file.** The three `fence.test.ts`
  live-board bodies that red at this base by `T-274`'s fence token are
  the seat's debris, fixed on main at `ab00399`; they are attributed
  there and are not charged to this lane.

#### The attack set, run

Every attack from the sealed set, with what it cost and what it found.
A-16's timing control was live and is reported; nothing was dropped as
unreachable except where said.

| # | attack | outcome |
|---|---|---|
| A-1 | the decoy tag — skip on the NAME alone | **CLEAN.** A `CACHEDIR.TAG` reading `Signature: 0000…` leaves `build-out/kept.ts` indexed, live and in a body. The predicate opens and compares bytes. |
| A-2 | signature matched by `contains`, not anchored at offset 0 | **CLEAN in the producer, UNPINNED in the drill.** The read is bounded at 44 bytes so a 2 GB tag costs nothing, and a first line that merely STARTS with the signature is refused. But the anchoring is not pinned — see mutant VM2 and **CORRECTION 2**. |
| A-3 | the dot-prefix fake | **CLEAN.** `hidden(false)` is untouched; there is no `starts_with('.')` anywhere in the diff. The fixtures deliberately use dot-prefixed stems AND the controls prove the refusal is the tag's, not the dot's. |
| A-4 | root-level vs nested; the root itself tagged | **CLEAN.** No depth guard exists. A tagged immediate child IS skipped (mutant VM4 proves a `depth >= 2` guard reds two bodies), a tagged directory two levels down is skipped, and a tag on the walk ROOT leaves the walk intact — measured live: root tagged -> `FILES: ['real.ts']`. |
| A-5 | the symlinked target directory | **CLEAN, with a control.** A symlink to a tagged directory inside the tree contributes nothing; one pointing outside is refused; **and the control** — the same symlink shape at an UNTAGGED outside directory — is refused too, so that refusal is the LINK checks' and not the tag's, exactly as the site comment claims. |
| A-6 | one mechanism replacing two | **CLEAN.** Ignore files untouched; VM5 (deleting `add_custom_ignore_filename`) reds `live_repo_walk_respects_the_dogfood_supertaskrignore`, `mixed_matches_golden`, `gitignore_and_supertaskrignore_both_apply_without_a_git_repo` and `supertaskrignore_wins_over_a_gitignore_negation`. Two mechanisms, both pinned. |
| A-7 | an instance fix in class-fix clothing | **CLEAN.** No env read, no glob, no hard-coded drill name in production code (greps above). |
| A-8 | the tautological fixture | **CLEAN.** Every expectation is a hand-written literal `vec![…]`; the tag fixtures are typed literals, never derived from `CACHEDIR_TAG_SIGNATURE`. Mutants VM3/VM4/VM8 red the literal-list bodies. |
| A-9 | the vacuous fixture | **NOT APPLICABLE, and better than the attack asked.** The new bodies build their trees at RUNTIME under `TempTree`, so there is no committed fixture to be gitignored into vacuity and no fresh-clone question to ask. I planted into the COMMITTED fixture tree separately (VM10/VM11) to get the same assurance from the other side. |
| A-10 | fixture-name collision with a real drill | **CLEAN.** The stems are `.t153s3-target` / `.t153s3-inner-target`, inert and lane-derived. |
| A-11 | the skip that skips only the tag FILE | **CLEAN.** Mutant VM3 spells exactly that and reds three bodies; the assertions name source-shaped files INSIDE the tagged directory and their absence. |
| A-12 | "never inflates the graph" satisfied by regenerating it | **CLEAN — branch (a).** See *The fence, and the graph* above. |
| A-13 | "never reds `index --check`" by widening the budget | **CLEAN.** No staleness constant or comparison in the diff; budget 55.6% at the tip against GT-4's 55.5% at the base, the delta being this lane's own source lines. |
| A-14 | entry-point drift | **CLEAN, and the mutant is UNBUILDABLE.** There is exactly ONE tree traversal in the crate. `index` -> `index()` -> `walk_root`; `index --check` -> `check::check` -> `index()`; `index --watch` -> `watch::watch` -> `index()` (`src/watch.rs:111`); `arch`, `arch drift`, `arch blast` read the COMMITTED graph and never walk; `arch cycles` reads the registry only. The other `read_dir` call sites are the component-registry reader and two test helpers. **So mutant M13 has no second traversal to leave unfixed and is dropped with that reason.** The watcher's *event triage* is a separate, pre-existing matter — filed as `T-153-s19`, not charged here. |
| A-15 | fail-open on an unreadable or malformed tag | **SPLIT: the direction is right, the FIFO is a defect.** A tag that is a DIRECTORY, and a tag that is EMPTY, both leave the subtree INDEXED (measured live). But a tag that is a FIFO **HANGS THE WALK** — see **CORRECTION 1**. |
| A-16 | cost per entry vs per directory | **CLEAN, measured A/B.** The probe sits inside the `is_dir` branch, so it is one `open` attempt per DIRECTORY. Base binary built at `bcc833f` and tip binary at `a007884`, five interleaved warm `index --check` runs each over the bench tree (151 directories, 1301 files, excluding `.git`, `node_modules`, `target`): base median **1139 ms**, tip median **1132 ms**, per-run deltas `-63.9, +7.0, -12.6, +64.2, -10.1` ms — noise in both directions, no systematic cost. |
| A-17 | an escape hatch defaulting off | **CLEAN.** `git diff … | grep -E '^\+.*(env::var|std::env|SUPERTASKR_[A-Z_]+)'` returns nothing. There is no hatch. Mutant M14 is dropped for want of a subject. |
| A-18 | CONVENTIONS' drill bullet | **NO FINDING OWED.** The bullet at the base already names this fix as the class remedy and already sends drills to `<scratch>/target`; `T-111-s10` landed it. Out of fence and already done. |

#### The drill — my own mutants, producer side, landings read from `git diff`

Detached scratch worktree at `a007884` (`<scratch>/V-T-153-s3-drill`),
`CARGO_TARGET_DIR` at `<scratch>/V-T-153-s3-drill/target`. Crate scope,
`--no-fail-fast`, 12 targets every arm. **Baseline 268 passed / 0 failed
/ 2 ignored, exit 0** — which matches the executor's figure, measured
independently. Every arm restored with `git restore --source=a007884
--staged --worktree` and PROVED by sha256 against `git show a007884:` —
expected side asserted non-empty at 63,606 bytes before any comparison
was written down.

| arm | mutation (producer) | exit | pass/fail | verdict |
|---|---|---|---|---|
| VM1 | the comparison always true — key on the tag's PRESENCE | 101 | 267/1 | **KILLED** — `a_cachedir_tag_whose_first_line_is_not_the_signature_never_skips`, ALONE |
| VM2 | `contains` over the bounded head instead of the first line | 0 | 268/0 | **SURVIVED** — CORRECTION 2 |
| VM3 | filter the tag FILE only, still descend | 101 | 265/3 | **KILLED** — both walk bodies + the containment body |
| VM4 | a `depth >= 2` guard (the nested case only) | 101 | 265/3 | **KILLED** — the same three |
| VM5 | delete `add_custom_ignore_filename(".supertaskrignore")` | 101 | 264/4 | **KILLED** — the four ignore-file bodies |
| VM6 | drop the `is_dir` gate | 0 | 268/0 | **SURVIVED, inert** — see below |
| VM7 | open `cachedir.tag` instead of `CACHEDIR.TAG` | 0 | 268/0 | **SURVIVED — the MACHINE's doing, not the drill's.** Measured: this checkout is on case-insensitive APFS, where `cachedir.tag` opens `CACHEDIR.TAG`. On a case-sensitive filesystem this arm reds the three skip bodies. Recorded, not charged. |
| VM8 | post-filter the skip on `/debug/build/` | 101 | 265/3 | **KILLED** — the same three |
| VM9 | fail CLOSED on a read error (`Err(_) => return true`) | 0 | 268/0 | **SURVIVED** — folded into CORRECTION 1's body |
| VMR | extend the skip to the walk ROOT | 101 | 267/1 | **KILLED** — `a_tag_on_the_walk_root_itself_does_not_empty_the_walk`, ALONE |
| VM10 | **DATA**: a DECOY tag planted in `tests/fixtures/rust-workspace/app/src/` | 0 | 268/0 | **GREEN, and that is the claim** — the NAME alone does not hide committed fixture sources |
| VM11 | **DATA**: a VALID cargo tag planted at the same path | 101 | 266/2 | **KILLED** — `rust_workspace_matches_golden` and `rust_workspace_carries_every_shape_the_criteria_name` |
| VM10×VM1 | **the separation control**: the SAME decoy plant against VM1's presence-only producer | 101 | 265/3 | **REDS the golden.** |

**Where the property lives in data, the mutant is a data mutant**
(`T-221`), and this is where that rule paid. `VM10` and `VM11` are one
plant with two contents, dropped into a COMMITTED fixture whose
expectation is a byte-compared `expected-graph.json` — a literal nobody
regenerates by walking. VM11 shows the skip reaches real committed
inputs and removes exactly the right files; VM10 shows the correct
producer is not fooled by the name. **And `VM10×VM1` is the arming
difference the method demands**: the identical plant that is GREEN
against the shipped implementation REDS the golden against one that keys
on presence, so VM10's green is a property of the producer and not of
the fixture. This is the check `T-210` did not get.

**Kill-set containment.** Neither of the two walk-level bodies contains
the other: `a_cachedir_tag_whose_first_line_is_not_the_signature_never_skips`
dies to VM1 where the any-name body lives, and the any-name body dies to
the executor's A5 (depth-1-only) where the near-miss body lives. The
root-limit body is killed by VMR ALONE. All three are load-bearing.

**The containment body IS a restatement, and the executor said so
first.** `a_cargo_target_directory_under_a_chosen_name_never_enters_the_graph`
died in every arm that also killed the walk bodies (VM3, VM4, VM8) and
in none that did not — its kill set is strictly contained, exactly as the
notes disclose under *"FOR THE VERIFIER, NAMED RATHER THAN LEFT TO BE
FOUND"*. I confirm the measurement and accept the argument: it drives
`index()` end to end and asserts no artefact name reaches
`stable_json`'s payload, which is a claim about the process boundary
that the walk-level body does not make. **A disclosed restatement kept
for a stated reason is not a finding; an undisclosed one is.** No
correction is assigned for it.

**VM6, and a comment I could not pin.** Dropping the `is_dir` gate
changes no outcome: a symlinked tagged directory is excluded either way
(by the tag if the probe follows the link, by gates A/B if it does not),
so the site comment's claim that *"this skip never reads through a
link"* is TRUE but structurally unobservable from a body. I am NOT
filing a card asking someone to pin an unobservable, and I am NOT
assigning a correction. It is recorded here so the next reader does not
spend the hour I did.

#### CORRECTION 1 (producer + body) — a blocking `CACHEDIR.TAG` hangs the walk

**This is the one finding that is a defect rather than a gap, and it is
new at this diff.**

    $ mkfifo <tree>/fifodir/CACHEDIR.TAG
    $ supertaskr-index index --root <tree>
    # still running after 25s; killed. No error, no timeout, no exit.

`carries_cachedir_tag` calls `std::fs::File::open` on a path WITHOUT
first asking what that path is. `open` on a FIFO with no writer blocks
forever, so `index`, `index --check` and `index --watch` all stop dead —
**a gate that hangs rather than a gate that answers wrongly.**

**It is new, and that is measured, not assumed.** The same tree with a
FIFO named `pipe.ts` — an ALLOWLISTED name the walk already meets —
terminates in 1s, exit 0, indexing the one real file: every other
refusal in `walk_root` decides on `file_type()` BEFORE touching
contents, which is why gate B merely drops it. And `git show
bcc833f:…/walk.rs | grep -E 'File::open|fs::read'` returns NOTHING: this
probe is the only construct in the walk that opens a path, and it is the
only one that opens a name without a type check.

**Severity, stated honestly:** low likelihood, bad failure mode. Git
cannot check a FIFO in, so this needs a local special file — but the
POISON DRILL convention has seats building inside their own worktrees,
which is how this whole card started.

**The fix, and it is small:**

```rust
let tag = dir.join("CACHEDIR.TAG");
// `metadata` stats rather than opens, so it cannot block, and it
// follows a symlink (a link to a real tag is still a tag). Anything
// that is not a regular file answers "untagged" — the direction every
// other arm here already takes.
if !std::fs::metadata(&tag).is_ok_and(|m| m.is_file()) {
    return false;
}
let Ok(mut file) = std::fs::File::open(&tag) else {
    return false;
};
```

**The body that pins it —
`a_cachedir_tag_that_is_not_a_readable_regular_file_never_hides_a_directory`**
— has two arms in one tree: a DIRECTORY named `CACHEDIR.TAG` (the
subtree stays indexed) and a FIFO named `CACHEDIR.TAG` walked on a
thread behind a bounded `recv_timeout`, so an unguarded producer FAILS
rather than hanging the suite.

**A CONTROL I PROPOSE IS MINE TO CHECK, AND I CHECKED IT** (verifier.md
2b). All three runs are mine, in the drill worktree, restored and
sha256-proved afterwards:

- **the body alone, against the producer as it stands:** 269 passed /
  **1 failed**, exit 101 — `panicked … the walk did not finish in 20s -
  a blocking CACHEDIR.TAG hung it: Timeout`. **Seen to fail, at the
  site, for the stated reason.**
- **the body + the guard:** **270 passed / 0 failed, exit 0.**
- **the body + the guard, with the guard then weakened to
  `metadata(&tag).is_ok()` and `Err(_) => return true`:** 269/1, the new
  body reding **ALONE**. It kills, and it kills only what it aims at.

The whole correction is saved as a patch at
`<scratch>/V-T-153-s3-assigned-corrections.patch` (5,658 bytes),
containing this and CORRECTION 2.

#### CORRECTION 2 (body) — the signature's OFFSET is unpinned

VM2 replaced the first-line comparison with a substring search over the
same bounded head and **the entire crate suite stayed green**. The
shipped producer is CORRECT — measured live, a tag whose first line is
empty and whose signature sits on line 2 leaves the directory INDEXED —
but nothing would notice if a later reader "simplified" it, and the
failure direction is silent subtree loss.

**The body:
`a_cachedir_tag_whose_signature_is_not_at_offset_zero_never_skips`** —
a tag reading `"\nSignature: 8a477f…bc55\n"` leaves `offset/emitted.ts`
walked, with the control the way the producer builds it (the same bytes
without the leading newline DO refuse).

**Checked by me:** it PASSES at the tip (it is in the 269/270 above),
and re-running VM2 on top of it reds **that body ALONE**, 269/1. A kill
count of one, aimed at the property.

#### The security sweep

- **New input path.** The walk now opens one file per directory it
  descends. The read is BOUNDED at 44 bytes into a stack array; nothing
  content-derived sizes an allocation, and the comparison is a byte
  equality — no parse, no format string, no injection surface. The
  filename is a constant joined onto the entry's own path; no caller
  input reaches it, so there is no traversal.
- **Symlinked tag.** `File::open` follows a `CACHEDIR.TAG` symlink, so a
  planted link can cause 44 bytes of an out-of-tree file to be READ. No
  content escapes: the function returns `bool`, nothing reaches the
  graph, and the only observable is whether those bytes equal the
  public cachedir signature. Judged acceptable and named rather than
  left implicit. CORRECTION 1's `metadata` (which follows links)
  preserves this deliberately, since cargo writes a real file and a link
  to one is still a tag.
- **Denial of service.** The FIFO hang above — the sweep's one real
  finding, assigned as CORRECTION 1.
- **Dependencies.** NONE added. `Cargo.toml` is not in the diff; `ignore`
  stays pinned at `=0.4.33`, which is what makes the root-limit body's
  premise checkable at all.
- **Secrets, keys, authz, endpoints.** None in the diff; the crate adds
  no endpoint and no query. The only literal introduced is the PUBLIC
  cachedir-spec signature.
- **Unsafe defaults.** The error direction is fail-OPEN (index the
  directory), which is the direction that keeps a file rather than
  losing one silently. Correct, and documented at the site.

#### The defect reproduced, and the fix seen to close it

One tree, one plant, two binaries. A base worktree at `bcc833f`, a base
binary built from it, and the tip binary from `a007884` — the ONLY thing
that differs between runs 3 and 4 is which binary walked:

    1. base binary, base worktree, unplanted
       CURRENT, exit 0 — 1191343 bytes · 201 files · 2542 symbols · 2441 edges, 55.5%
       (GT-4 re-derived independently at my own ref, digit for digit)

    2. plant .vdemo-target/ — a conforming CACHEDIR.TAG plus
       debug/build/serde_core-1a2b3c/out/private.rs and
       debug/build/tauri-9f8e7d/out/__global-api-script.js

    3. BASE binary, PLANTED tree            <- THE DEFECT
       STALE, exit 1 — 203 files, files +2 -0 ~0
       header | ~ languages [rust, ts] -> [js, rust, ts]

    4. TIP binary, THE SAME PLANTED TREE    <- THE FIX
       CURRENT, exit 0 — 201 files, byte-identical to run 1

**The header line is the part worth keeping.** Two generated files did
not merely add themselves to the graph — one of them moved the
repository's declared LANGUAGE SET, which is a claim about what this
codebase IS, made on the strength of a build artefact in a scratch
directory. That is the silent half this card was filed about, and it is
gone at the tip.

This also independently reproduces the executor's own before/after
figures (`files +2 -0` at the base), which I had treated as a claim.

#### Two of the executor's own claims, checked rather than taken

- **The routed sweep is real.** `tools/e2e/scripts/token-scan.mjs:204`
  and `tools/e2e/scripts/docs-scan.mjs:262` both export a `SKIP_DIRS`
  set containing the literal `"target"`. `T-153-s17` describes them
  accurately and both fences are real paths.
- **The rustfmt note is accurate.** `cargo fmt -p supertaskr-index --
  --check` exits 1 at BOTH refs with the SAME 186 hunks; grepping the
  tip's own fmt diff for `carries_cachedir_tag`,
  `CACHEDIR_TAG_SIGNATURE`, `CARGO_CACHEDIR_TAG` and `t153s3` returns
  nothing, so the lane added no new complaint. There is no
  `rustfmt.toml` and no CI step runs it. A standing state of the tree,
  correctly recorded rather than routed.

#### Suites at MY OWN tip

Run ONCE each from the bench root through the blessed runner
(`node tools/e2e/scripts/gate-run.mjs <leg>`, `SUPERTASKR_E2E_PORT=25153`),
over the working tree carrying THIS verdict and `T-153-s19` — so the
prose was measured, not just the code. `npm ci` in `lib/parser`, `app`
and `tools/e2e`, `npm run build` in `lib/parser` then `app`, all exit 0.

| leg | exit | bodies | targets | verdict |
|---|---|---|---|---|
| parser | 1 | 377 | 1 | **RED — 3 bodies, ALL attributed to the base** |
| app | 0 | 1163 | 1 | GREEN |
| rust | 0 | 643 | 18 | GREEN |
| e2e | 0 | 690 | 1 | GREEN |

**The parser red is the base's, and it is named down to the token.** The
three failures are all in `lib/parser/test/fence.test.ts`, all under *the
live board, censused through the expansion*, and all three assert-diffs
differ by the SAME single element: `"T-274 docs/tasks"`. That is `T-274`'s
fence token — the seat's debris at this base, fixed on main at
`ab00399`. `grep -nE 'T-153-s19|watch\.rs|T-153-s3'` over the failing
output returns NOTHING, so neither the diff nor my own writes are in it,
and the diff touches no parser file at all
(`git diff --name-only bcc833f..a007884 -- lib/parser` is empty).
**In-fence would be a defect; this is the base's, and it is not charged
to the lane.**

**`T-153-s18`'s intermittent did not reproduce for me.** The e2e leg's
690 bodies include `brief-flush.spec.ts`'s MARGIN GUARD and it passed,
which is consistent with that card's own diagnosis — it reds when a
sibling lane moves the board under its three reads, and four sibling
worktrees were live during this pass. That the card exists is the right
outcome; a green run is not evidence against it.

**The crate-scope figure, separately:** `cargo test -p supertaskr-index
--no-fail-fast` at `a007884` is **268 passed / 0 failed / 2 ignored over
12 targets, exit 0** — measured in my own drill worktree as the drill's
baseline, and matching the executor's number independently.

#### The gates MY OWN commit could move, re-run at the tip it created

**Prose is a code input here, and this verdict is prose.** The docs gate
run over my own changed paths (`node tools/e2e/scripts/docs-gate.mjs
$(git diff --name-only a007884 HEAD)`) FIRES, exit 1, and names the
three suites two edited cards owe: `npm test from app/`, `npm test from
tools/e2e/`, `npx vitest run from lib/parser/`. Its whole-tree half
(`npm run lint:docs`) exits 0 and reports *every live task card's
frontmatter parses, with a legal status* — which covers `T-153-s19` and
the `verified_by` / `review` stamp on this card — with the injection
scan finding 0 hits in the paths scanned.

All four legs above already ran over a tree carrying this verdict and
`T-153-s19`, because they were written BEFORE the suites were run. The
two later edits — this suites section, and the frontmatter stamp — were
covered by re-running the two board-reading legs AT THIS VERDICT'S OWN
COMMIT, the tip this file creates. **The ref is named as `HEAD` rather
than as a hex string on purpose**: a sha written into the very commit it
names cannot be right, and this figure's ref is *the commit carrying
this paragraph*. Run there, three times across the pass, unchanged every
time:

    parser  exit 1  377 bodies  1 target   — the SAME three T-274 bodies, no drift
    app     exit 0  1163 bodies 1 target   — GREEN, identical count

The counts did not move, so no figure in this verdict is stale at the
tip it was written into. The `tools/e2e` leg was not re-run for a
prose-only delta; its 690 bodies were measured over a tree already
carrying both new cards, and the two board readers that parse
frontmatter both agree at the final tip.

#### What the integrator must do at the merge

1. **Apply both corrections**, or route them — CORRECTION 1 is a
   producer change and is held to lane standards with its own mutant
   drilled (the two runs above are that drill, and the patch carries the
   body). CORRECTION 2 is a body only.
2. **REGENERATE THE GRAPH.** `index --check` is STALE at this tip by
   `files +0 -0 ~3` — the lane's own three edited sources. That is owed
   and correct, and the regen belongs at the checkpoint because
   `docs/architecture/graph.json` is outside this fence. **The regen owes
   the dogfood suite**: the app/test pins that hold the committed
   graph's scale must be run with it. Applying the corrections first
   changes `walk.rs` again, so regenerate AFTER them, not before.
3. **`T-111-s11` must not be dispatched.** Its criteria are what this
   lane built, its body now carries the criterion-by-criterion account
   and a `closed_by:` line, and its `status:` is deliberately unmoved —
   that disposition is triage's, not a lane's.
4. **Do not charge this lane for the parser reds at this base.** Three
   `fence.test.ts` live-board bodies red at `bcc833f` from `T-274`'s
   fence token; fixed on main at `ab00399`. The diff touches no parser
   file.
5. **Three cards land with this lane and one with this verdict** —
   `T-153-s17` and `T-153-s18` (executor), `T-153-s19` (this seat, the
   watcher's event triage), all `status: suggested` and all triage's to
   dispose of.
