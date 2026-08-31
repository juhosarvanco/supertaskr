---
id: T-196
title: "`follow_links(false)` is the index walk's fifth refusal, it is UNPINNED, and unlike the shadowed halves it is PINNABLE — the body named for it stays green when the walker is told to follow links"
feature: F-06
milestone: 4
priority: 5
size: S
status: building
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
