---
id: T-186
title: The index walk carries the identical four shadowed checks one crate over, calls them "belt-and-suspenders" in the same false words, and its one symlink body points OUTSIDE so containment alone produces the green
feature: F-06
milestone: 4
priority: 5
size: S
status: verifying
blocked_by: []
touches: [crate-index]
suggested_by: "architect/integrator seat, ROUTED BY T-140-s9's merge (2026-08-31) and re-measured at this seat before filing rather than transcribed from the route"
builder:
built_by: claude-opus-5@subagent
review:
---

**ROUTED OUT OF `T-140-s9`, AND RE-MEASURED BEFORE FILING.** That lane
corrected `app/src-tauri/src/docs_watch.rs` and routed its sibling
sight-unseen. This seat opened `walk.rs` and confirmed every element
rather than carrying the claim across; what follows is read off the file,
not off the route.

## The same four checks, in the same order, with the same shadowing

`walk_root` in `app/src-tauri/crates/nputer-index/src/walk.rs`:

    let Ok(meta) = std::fs::symlink_metadata(path) else { continue };
    if meta.file_type().is_symlink() || !meta.is_file() { continue; }
    …
    let Ok(canon) = path.canonicalize() else { continue };
    if !canon.starts_with(canon_root) { continue; }

and `relative_posix`'s `strip_prefix(base).ok()?` twelve lines above.

**`!meta.is_file()` already absorbs a lifted `is_symlink`**, for the
reason `T-140-s9` established one crate over: `meta` comes from
`symlink_metadata`, under which a link is neither file nor dir. So the
`is_symlink` half of that disjunction is **inert** — exactly the
one-predicate-written-twice shape, arriving a second time.

`starts_with` and `relative_posix`'s `strip_prefix` are likewise **one
predicate mutually shadowing**, not two independent layers.

## AND THE COMMENT MAKES THE SAME FALSE CLAIM, IN THE SAME WORDS

    // Belt-and-suspenders beyond follow_links(false): our own
    // symlink_metadata check — a symlink (file or dir) is skipped
    // outright.

`T-140-s9` ruled that this exact claim — one line described as *"belt to
the symlink-skip's suspenders"* — **was itself the defect**, because it
tells the next reader that two independent layers exist where one
predicate is doing all the work. The claim is wrong here for the same
reason and should be corrected the same way: **name each layer at its
site for what it actually is.**

## The body that cannot see any of it, measured

`symlinks_are_never_followed_file_or_dir` (`walk.rs:213`) builds its
links pointing at a **second, outside** `TempTree`:

    let outside = TempTree::new("walk-symlink-outside");
    symlink(outside.root().join("secret.ts"), t.root().join("link.ts"))
    symlink(outside.root(), t.root().join("linkdir"))

Every entry it creates canonicalizes **out of the root**, so
`canon.starts_with(canon_root)` drops all of them on its own. **The
containment check alone produces this body's green**, and the
`is_symlink` half it is named for is never exercised.

This is the identical instrument defect `T-140-s9` met: a symlink body
whose link points outside is a containment test wearing a symlink test's
name.

## WHAT THIS CARD MUST NOT ASSUME, and it is the whole risk

`T-140-s9` spent two attempts proving its docs-root guard was
**undetectable by construction** — an outside link is rescued by
containment, an inside link is dropped by the collector's own path
prefix. **Do not assume the same verdict here.** This crate is different
in one way that may matter: `walk_root` filters on **extension and
language** after the symlink check, so an inside-pointing link to an
allowlisted file may reach a different set of predicates than
`docs_watch`'s did.

**Measure it; do not reason from the sibling.** If a body CAN be written
that reds on a lifted `is_symlink` and passes with it, write it. If it
cannot, `docs/CONVENTIONS.md` rules the case directly — *"IF a body
cannot be poisoned … THEN say so and name it, because a body that cannot
red is the finding"* — and the outcome is a named body carrying its
failed attempts at its site, exactly as `T-140-s9` landed.

## Acceptance criteria

- EACH of the four checks SHALL be named at its site for what it
  independently contributes, and any that contributes nothing unique
  SHALL say so rather than being described as a further layer.
- THE "belt-and-suspenders" comment SHALL be corrected or removed; it
  asserts an independence that does not exist.
- A body SHALL exercise the symlink refusal with a link that
  containment CANNOT rescue, or the card SHALL record — with the
  attempts shown — that no such body exists and why.
- EVERY body added or changed SHALL be poisoned by a one-side-only
  mutant read back with `git -C <dir> diff`, restored, and the
  restoration proven by hash.
- NO layer SHALL be deleted merely for being shadowed: `T-140-s9` ruled
  that deleting a shadowed line on an ADR-010 boundary buys zero
  discrimination and costs a visible containment statement. **The
  evidence is what changes, not the refusal.**
- Verification: headless, `cargo test`.

## Read beside

`T-140-s9` (the same finding, corrected, with both failed poison
attempts recorded at their site — read it FIRST, it will save this lane a
day), and `app/src-tauri/src/docs_watch.rs` as it stands after that merge.

## Implementation notes (2026-08-31, executor claude-opus-5@subagent)

Lane `/Users/ujju/Projects/nputer-T-186`, branch
`task/T-186-the-index-walk-carries-the-same-shadowed-checks`, base
`c3fc1a1`. One file of shipped code, `walk.rs`, the whole fence. Ceremony
row: **S touching shipped code**, so a verifier is owed — nothing merged,
nothing pushed, the lane worktree left standing.

### THE ANSWER TO THE CARD'S OPEN QUESTION IS *NO*, AND THAT IS THE FINDING

The card forbade assuming `T-140-s9`'s "undetectable by construction"
verdict and named the reason: this walk filters on extension and language
between the link check and containment. **Measured, that difference is
real and it goes the card's way.** One crate over, BOTH halves of the link
classification are undetectable and the honest landing was a body that
cannot red. Here:

- `is_symlink()` alone is still undetectable, and provably so — `meta`
  comes from `symlink_metadata`, under which a link is never `is_file()`,
  so the right-hand operand always fires. No fixture can separate them.
- **`!meta.is_file()` IS separately detectable here**, which its sibling
  was not. Layer 2 filters on the entry's own NAME rather than on a
  resolved path, so a DIRECTORY called `<name>.ts` clears every later
  predicate — allowlisted extension, requested language, canonicalizes to
  itself, formats to a relative path — and would be emitted to the parser
  as a source file. That is a body, and it reds on that lift alone.

**Had this lane reasoned from the sibling in either direction it would
have been wrong.** "It was impossible there" would have cost the walk a
body it turns out to support.

### THE RULING: every layer stays, and the EVIDENCE is what changed

No line was deleted. `T-140-s9`'s reasoning holds unchanged and was not
re-litigated: a provably behaviour-neutral line buys exactly zero
discrimination by leaving, while costing a visible containment statement
on an ADR-010 boundary. So each of the four layers is now NAMED at its
site for what it independently contributes, the `starts_with` is named as
restatement rather than left to read as depth, `relative_posix`'s doc
comment says it is a containment predicate rather than a formatter, and
the *"belt-and-suspenders beyond `follow_links(false)`"* claim — the same
false claim of independence, in the same words, that `T-140-s9` ruled was
itself the defect — is gone.

**The shipped walk is semantically identical to base.** Every line added
outside `#[cfg(test)] mod tests` is a comment; the refusal did not move.

### THE FAILED ATTEMPT, RECORDED AT ITS SITE AS THE CARD REQUIRES

The obvious inside-pointing fixture — aim the link at an allowlisted
inside file, `alias.ts` -> `real.ts` — **cannot detect the lift, and this
lane ran it rather than reasoning about it.** A lifted layer 1 pushes
`real.ts` a second time and `files.dedup_by(|a, b| a.rel == b.rel)` at the
end of the walk collapses the duplicate: byte-identical output, mutant
survives, body useless. Under that fixture the inside body stays GREEN
while its sibling body reds. The landed fixture therefore aims at a file
the walk does NOT otherwise collect (`notes.md`), which is also the truer
statement: with layer 1 lifted the walk emits `notes.md` tagged
`Lang::Ts`, because layer 2 read the LINK's name and layer 3 read the
TARGET's path. **This is the trap this crate adds and `docs_watch` has
no equivalent of**; it is recorded in the body so the next reader does not
repeat it.

### POISON SHAPE SIX — ASKED FOR ALL THREE NEW BODIES, AND ALL THREE PASS

The catalogue's form, not the assertion poison: name a mutant of the code
under test the body kills, run the whole suite, require the failing count
to be ONE.

- the directory body — the `!meta.is_file()` lift. **Count 1.**
- the predicate body — the `relative_posix` `.ok()?` lift. **Count 1.**
- the inside-symlink body — no single-half lift reaches it, so this lane
  constructed one instead: replace the whole classification with a
  directory-only skip (`if meta.is_dir()`), under which symlinks pass and
  directories are still refused. **Count 1.** Without that arm the body's
  smallest killer is the both-halves lift, which the directory body also
  kills — i.e. it would have been shape SIX by the catalogue's definition,
  and the arm is what earns it out of that rather than an argument.

**No fourth body was written for the `starts_with`/`strip_prefix`
equivalence, deliberately.** `docs_watch`'s
`the_prefix_check_and_relative_posix_are_one_predicate` already pins that
std-library property, and bare `cargo test` runs both workspace crates —
so the equivalence IS pinned on the merge path. A second copy in this
crate would kill no mutant the first does not, which is the shape the
catalogue tells us to decline rather than add. The site comment cites the
existing body by name instead.

### THE CLASS AND THE SWEEP — AND THE SWEEP DOES NOT COME BACK CLEAN

**The class**: a refusal whose removal is shadowed by a later check
computing the same outcome, with a test NAMED for the shadowed half — so
the suite reports coverage it does not have.

The search was **shown capable of both hitting and missing before its
result was written down**: the containment pattern against a planted line
matched (exit 0), and a one-token variant matched nothing (exit 1).

Inside this fence, `is_symlink()` appears in shipped code at three sites
beyond `walk_root`. `tests/perf.rs` is a fixture copier, not shipped
behaviour. The other two are **the class, and they are not fixed here**:

- `arch/registry.rs::read_registry` — `is_symlink() || !meta.is_dir()`,
  and `a_registry_directory_that_is_a_symlink_is_refused_not_followed`
  is named for the half. **MEASURED: lifting that half leaves the whole
  crate suite green, exit 0.**
- `resolve/mod.rs::read_contained` — `is_symlink() || !meta.is_file()`,
  with `symlinked_tsconfig_is_never_read` named for the half.
  **MEASURED: lifting that half leaves the whole crate suite green,
  exit 0.**

**THIS CORRECTS A SENTENCE IN `T-140-s9`'S LANDED SWEEP.** That record
classified both sites as *"same shape, no false coverage"* on the ground
that *"no body is named for the half"*. At this ref that clause is false
for both, and the two arms above are the evidence. The shadowing halves of
its classification were right; the coverage half was not.

Both are inside this fence but outside this card's acceptance criteria,
which are scoped to `walk_root`'s four checks. **Routed rather than
widened** — see below. This is `T-140-s9`'s verifier's own correction
arriving one crate over, and it is recorded rather than quietly absorbed.

### ROUTED, NOT BUILT

**`T-190`** — the two sites above. Fence `crate-index`, the same as this
card. Filed with both measurements on it, so the next lane starts from
evidence rather than from a claim, and carrying this lane's own warning:
**measure whether the surviving half is separately pinnable rather than
inheriting a verdict**, because that is exactly what this card would have
got wrong.

**AND THE CARD ID IS A MACHINE-SCOPED SURFACE WITH NO KEEPER, WHICH THIS
LANE HIT.** This suggestion was first filed as `T-189`, derived correctly
as one past the highest id in the tree at dispatch. **`T-189` then landed
on main from another lane while this one worked** — a different card
entirely — so the merge would have carried TWO live cards with `id:
T-189`, and `git merge-tree` reports NO conflict because the two files
have different names. It was caught by re-deriving the id against main's
tip before the final commit rather than against the base, and the card is
now `T-190`.

This is `lane-protocol.md` rule four's closing paragraph exactly: a
surface scoped by the BOARD rather than by the checkout, where every
written rule stays satisfied while two lanes collide, and the collision
probability rises with parallelism while nothing warns. A construction
beats a check here, and the id namespace has no construction — so the
check is: **derive a new card's id against the integration tip at the
moment you commit it, never against your base.** Worth a rule if it
happens again; recorded rather than routed, because one sighting is an
observation.

### WHERE THE BRIEF WAS WRONG

1. **ROW 4's `base commit:` names `d41e7373`, and this lane is cut at
   `c3fc1a1`** — one board commit later, the commit that promoted this
   card. The dispatch named this defect up front and filed it as `T-187`;
   the repository wins, the base is `c3fc1a1`, and it measured green
   before anything was touched. Every other row was checked against the
   tree and is current.
2. **The report the brief asks for and the blindness it asks me to
   protect are in tension, and the role file settles it.** The dispatch
   said to include no mutant volumes or figures that would contaminate a
   blind attack set; `roles/executor.md`'s report spec REQUIRES every
   drill, every figure and every exit code. The role file wins
   (`roles/executor.md`, "A BRIEF MAY NOT CONTRADICT THE ROLE FILE IT
   CITES"). The blindness is protected instead by the ruling that already
   covers it: **the verifier reads this card at the BASE ref**, without
   these notes. What that does NOT protect is a report pasted into the
   verifier's dispatch — so this is said plainly here, per that same
   file's instruction that a brief which cannot separate the two SAYS SO.
