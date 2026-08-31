---
id: T-196
title: "`follow_links(false)` is the index walk's fifth refusal, it is UNPINNED, and unlike the shadowed halves it is PINNABLE — the body named for it stays green when the walker is told to follow links"
feature: F-06
milestone: 4
priority: 5
size: S
status: verifying
blocked_by: []
touches: [crate-index]
suggested_by: verifier claude-opus-5@subagent @T-186, id allocated by the integrator
builder: claude-opus-5@subagent
review:
---

**FOUND BY `T-186`'S BLIND VERIFIER, MEASURED AT `9fe1ac3`, AND
RE-MEASURED BY THE `T-186` LANE AT `c18ebc2` BEFORE THIS CARD WAS
WRITTEN.** The id was allocated by the dispatching seat rather than minted
by either — see the closing note.

## The finding

`walk_root` in `app/src-tauri/crates/nputer-index/src/walk.rs` refuses a
symlink at five gates. `T-186` named all five at their sites and pinned
the four it was scoped to. **The fifth — `WalkBuilder::follow_links(false)`
— is pinned by nothing**, and `T-140-s9`'s routing sentence counts it as
one of the ways this walk refuses a link.

    .follow_links(false)

**MEASURED, one side only, `cargo test -p nputer-index --no-fail-fast`:
flipping it to `.follow_links(true)` leaves the whole crate suite GREEN —
252 passed / 0 failed over 12 targets, exit 0.** Nothing reds. That
includes `symlinks_are_never_followed_file_or_dir`, **whose name promises
exactly this refusal.**

## Why this is the same defect `T-186` fixed, one line above the ones it fixed

`T-186`'s subject was *a suite reporting coverage it does not have*: a
refusal whose removal is invisible, with a body NAMED for it. That is
precisely this line's situation. The difference is what makes this card
worth building rather than merely recording:

**THE SHADOWED HALVES COULD NOT BE PINNED. THIS ONE CAN.** `T-186`'s
`is_symlink()` half is undetectable *by construction* — under lstat a link
is never `is_file()`, so no fixture can separate the operands, and the
honest landing was to name it inert. **`follow_links` is not like that. A
fixture exists, and the verifier wrote one.**

## The fixture shape, carried across rather than re-derived

An **inside-pointing symlinked DIRECTORY** aimed at a subtree the walk
hard-skips — `node_modules` — so that:

- the entries it exposes are **real files**, not links, so gate B (the
  `is_symlink() || !meta.is_file()` classification) does not refuse them;
- they **canonicalize INSIDE the root**, so gates D and E (the
  `starts_with` prefix check and `relative_posix`) cannot rescue the case
  — this is the same "containment cannot save you" property that made
  `T-186`'s inside-pointing body the strongest one available there;
- and they are only reachable AT ALL by descending the link, which is the
  single thing `follow_links(false)` prevents.

**The body reds under the flip and passes at the tip.** The `node_modules`
aim is load-bearing: `filter_entry` hard-skips that name unconditionally,
so a walker that refuses to descend links can never see the files, and one
that follows links reaches them by a path whose components do not include
the skipped name.

**BEWARE THE TRAP NEXT DOOR** (`T-186`, recorded at its site): an
inside-pointing fixture whose target the walk *already collects* is
collapsed by `files.dedup_by(|a, b| a.rel == b.rel)` at the end of
`walk_root`, producing byte-identical output and a surviving mutant. Any
fixture for this card must expose a path the walk does **not** otherwise
emit. That is why the target is a hard-skipped subtree.

## Acceptance criteria

- A body SHALL red when `follow_links(false)` is flipped to `true` and
  pass at the tip, with the failing-body count RECORDED at crate scope.
- THE BODY SHALL assert the guard's STATE before exercising the walk
  (CONVENTIONS, LIFTING A SAFETY GUARD TO DISCRIMINATE), and the lifted
  arm SHALL be proven to terminate in a FIXTURE.
- A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL: the fixture SHALL be
  shown to be collectable when built the way the producer builds it, so
  the refusal is the link's and not the name's or the skip's.
- `symlinks_are_never_followed_file_or_dir` SHALL say at its site what it
  does and does not pin once this body exists — it currently carries a
  `T-186` note naming CONTAINMENT as its subject, and that note will need
  the fifth gate added to it.
- EVERY body added or changed SHALL be poisoned one side only, read back
  with `git -C <dir> diff`, restored, and the restoration proven by hash.
- **EVERY CRATE-SCOPE COUNT SHALL BE TAKEN WITH `--no-fail-fast`, AND THE
  NUMBER OF TARGETS THAT RAN SHALL BE PRINTED BESIDE IT.** Without it
  cargo stops at the first failing target and the count silently describes
  the lib target alone; this cost `T-186` a wrong correction to a right
  figure, caught only because the parts did not add up to the baseline.
- NO gate SHALL be deleted or weakened: `T-140-s9`'s ruling stands, and
  `follow_links(false)` is a real refusal whatever its coverage.
- Verification: headless, `cargo test`.

## Note on the id, because it is the reason this card exists as it does

The verifier **deliberately minted no id**, citing `T-186`'s own finding
that the card-id namespace has no construction available to a lane — main
lacks every live lane's ids, no lane may read its siblings' trees, and
`git merge-tree` reports no conflict for two cards sharing an `id:` under
different filenames. `T-186` collided twice on exactly this. The
dispatching seat allocated `T-196`, which is the remedy that finding
proposed, applied one card later.

## Read beside

`T-186` (the four predicates, the dedup trap, the gate key its site now
carries) and `T-140-s9` (the ruling, and the routing sentence that counts
`follow_links(false)` among this walk's refusals).

---

## Implementation notes (executor, lane `task/T-196-lane`)

**Every figure below carries the ref it was measured at.** Lane base
`e6a97d2`; body commit `106c096`; this commit is the tip.

### The premise, RE-DERIVED rather than inherited — and its figure has moved

`cargo test -p nputer-index --no-fail-fast` from `app/src-tauri/`,
**12 targets printed beside every count**.

| where | ref | result |
|---|---|---|
| lane baseline | `e6a97d2` | exit 0, **256 passed / 0 failed / 2 ignored, 12 targets** |
| drill bench, unmutated | `e6a97d2` | exit 0, 256/0, 12 targets — the bench reproduces the lane |
| **`.follow_links(false)` -> `.follow_links(true)`** | `e6a97d2` | **exit 0, 256/0, 12 targets. NOTHING REDS.** |

**The card quotes this premise as 252/0.** That was true at `T-186`'s refs
`9fe1ac3`/`c18ebc2`; `T-194` landed four bodies between those refs and this
lane's base, so the crate baseline is **256/0** here. **The figure moved and
the finding did not** — flipping gate A still reds nothing, including
`symlinks_are_never_followed_file_or_dir`, whose name promises exactly that
refusal.

### The body, and the kill proven ONE SIDE ONLY

`a_symlinked_directory_pointing_inside_the_root_is_never_descended`, added
to `walk.rs`'s `mod tests`. An inside-pointing symlinked DIRECTORY aimed at
the hard-skipped `node_modules` subtree — the shape the card carries — so
the entries behind it are real files gate B cannot refuse, canonicalize
INSIDE the root where gates D and E cannot rescue them, and are reachable
only by descending the link.

All arms at `106c096`, crate scope, `--no-fail-fast`, **12 targets every
arm**, bench baseline 257/0:

| arm | mutation, ONE SIDE ONLY | exit | passed/failed | failing bodies |
|---|---|---|---|---|
| `tip-baseline` | none | 0 | 257/0 | none |
| `a-follow-tip` | `.follow_links(false)` -> `true` (the CODE) | 101 | **256/1** | the new body, **ALONE** |
| `p-refusal` | the refusal assertion's EXPECTED side -> `vec!["T-196-poisoned.ts"]` | 101 | 256/1 | the new body, alone |
| `p-control` | the positive control's EXPECTED side -> `vec!["real.ts", "T-196-poisoned.ts"]` | 101 | 256/1 | the new body, alone |
| `c-canon-at-tip` | `path.canonicalize()` -> `path.to_path_buf()` (the CODE) | 0 | 257/0 | **none** |

**A count of ONE at crate scope IS the non-duplication** (CONVENTIONS,
poison shape SIX's answered form), and the catalogue's stricter scope is the
one taken: every target, not the lib target. `symlinks_are_never_followed_
file_or_dir` and `tests/containment.rs::outside_tree_symlinks_never_enter_
the_graph` both stay GREEN under the gate A mutant — their links point
OUTSIDE, so a walker that descends them meets gate D on the far side. **That
is why this fixture had to point INSIDE**, and it is the measured reason the
obvious fixture does not work.

The mutant's failure is the whole finding:

    assertion `left == right` failed
      left: ["node_modules/pkg/index.ts", "real.ts"]
     right: ["real.ts"]

A real vendored file reached ONLY by descending the link, wearing the
hard-skipped name because `rel` is derived from the CANONICAL path while
`filter_entry` reads the entry's own name — `vendor`, `pkg`, `index.ts`.
**The dedup trap the card warns about is avoided by construction**: that
`rel` is one no other arm of this suite emits, so `files.dedup_by` has
nothing to collapse it into.

### The lifted arm terminates in a FIXTURE — proven twice, not asserted

1. **In the body, before the walk runs.** The only link in the tree is
   asserted to canonicalize back INSIDE the tree, so a walker told to follow
   links can reach nothing but the `TempTree`. That is the "pointed at one,
   not merely started at one" half of CONVENTIONS' LIFTING A SAFETY GUARD TO
   DISCRIMINATE, and it is checked rather than reasoned.
2. **On the mutant arm's own output.** After the `--- suite ---` marker and
   excluding cargo's build banners, occurrences of `Projects/nputer` = **0**
   — and **the search was shown capable of failing first**: one line naming
   a repository path was planted into a copy of the corpus and the same
   pipeline returned **1** over 370 lines against 369 clean. A command
   quoted as proof is shown capable of failing (CONVENTIONS, and poison
   shape TEN, which cost `T-186` two false greens on this same file).

The body also asserts the guard's STATE before exercising anything: the
fixture IS a link and is not a dir under lstat; the entry behind it IS a
real file and is not itself a link. Together those are the argument that
only gate A can refuse it.

### The POSITIVE CONTROL, built the way the producer builds it

The link is removed and a REAL directory holding a REAL file of the same
content is written at the same name, in the same place, with `TempTree::
write` — the producer's own path. The walk then emits
`vendor/pkg/index.ts`. Without it, *"expected one path, got one path"* is
satisfied equally by a walk that refused `vendor` for its NAME, by one the
hard SKIP reached after all, and by one that found nothing there.

### THE SWEEP `T-194` ASKED FOR — the count IS wrong, and the number is now in the heading

The site's key read **"THE REFUSALS, IN SOURCE ORDER"** over five letters.
It is not the complete set. **ELEVEN constructs in `walk_root` can drop a
file; the letters name FIVE.** The heading now says so and the six
unlettered ones are named at the site: the ignore files, `filter_entry`'s
hard skip, three error arms (`result`, `symlink_metadata`, `canonicalize`)
and the `depth() == 0` skip — which is itself SHADOWED, the root being a
directory that gate B refuses one operand later.

**The one `T-208` sends a reader to is `path.canonicalize()`, and here it is
INERT — measured, at both refs.** `let canon = path.to_path_buf();` in its
place leaves the crate at 256/0 over 12 targets at `e6a97d2` and 257/0 over
12 at `106c096`, exit 0 both times. Structural, not lucky: `ignore` builds
every path by descending real directory entries from an already-canonical
root, so no `..` component exists to collapse and — gates A and B standing —
no unresolved link component reaches that line. **`T-208`'s opposite verdict
on the same call one module over is not in conflict and does not transfer**,
which is this family's whole lesson (`T-186`, `T-194`) applied to a CALL
rather than to a guard. **RECORDED, NOT ROUTED**: it is the `starts_with`
case (a provably behaviour-neutral line that stays and is named), not the
`T-208` case (unpinned with a fixture that exists). No card is owed.

### `symlinks_are_never_followed_file_or_dir` now says what it does and does not pin

Its note carries a three-row list: it PINS gates D and E (containment); it
does NOT pin gate B (T-186's measurement); and it does NOT pin gate A —
measured, 256/0 at `e6a97d2` under the flip — because its `linkdir` points
OUTSIDE, so containment stands in for the descent. Each row names the body
that pins the layer instead. The name is KEPT: three cards now cite it.

### Drills — one side only, read back, restored, proved by hash

Every arm ran in a **detached** scratch worktree at
`/Users/ujju/Projects/nputer-T-196-drill`, checked out at the named commit,
with `CARGO_TARGET_DIR=<drill>/target` (inside itself, under the one name
the graph walk already excludes). Each mutation was applied with a single
anchored `perl -CSD -0777` substitution and **read back with `git -C
... diff -U1` before the suite ran** — the count is not the proof, the text
is. Restored with `git restore --source=<ref> --staged --worktree --
<path>`, both sides named, and proved by **sha256** against
`git show <ref>:<path>`, with an empty `git status` as the companion and
never as the proof:

- base arms (`e6a97d2`): `c3478e5d898ab58ac9b5c4dae66d24c8c736f7e395e91969f676a1b2b8c4ef91`, both sides, every restore;
- tip arms (`106c096`): `cd088e9c1a5db9b36e379b0abf5af7e0eb891d93e34545c51a36a9e102ccbfcb`, both sides, every restore.

Five mutant arms plus two bench baselines; **7 for 7**, no arm left the tree
dirty. The work was COMMITTED before it was drilled, so no restore could
pass by throwing away work `HEAD` never saw.

### Flagged for the verifier

1. **`review:` is EMPTY on this card at dispatch.** This is a guard-class
   card — the builder of a cage is not its inspector — and `T-186`'s
   verifier flagged exactly this lapse on exactly this family, after which
   `T-208` was dispatched carrying `review: independent`. Not stamped here:
   the verifier fields are the verifier's. Flagged so the next dispatch
   sets it.
2. **The card's premise figure (252/0) is stale by construction**, corrected
   above. Nothing else in the card was contradicted by the repository.
3. **`e6a97d2` is this lane's base, not `2eb87f7`.** The dispatch brief
   named `2eb87f7`; `git merge-base --is-ancestor 2eb87f7 HEAD` is FALSE.
   `.nputer/lane-fence.json` records `e6a97d2` and is right.
4. Nothing outside the fence was touched: the whole diff is
   `app/src-tauri/crates/nputer-index/src/walk.rs` plus this card, and a
   lane writing to its own card is not a fence breach (lane-protocol rule
   5). **NO gate was deleted or weakened** — the diff removes no line of
   shipped code; it adds one test body and rewrites comments.
