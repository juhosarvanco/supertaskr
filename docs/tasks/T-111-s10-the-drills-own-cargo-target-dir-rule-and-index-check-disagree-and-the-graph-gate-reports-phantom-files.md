---
id: T-111-s10
title: The POISON DRILL bullet gets ONE edit for its four earned sentences — the target directory the walk can see, what restoring a fixture MEANS, a clock restored through a Date, and a restoration proof that passes on a failed restore
feature: F-06
milestone: 4
priority: 6
size: S
status: building
blocked_by: []
touches: [docs/CONVENTIONS.md]
suggested_by: executor claude-opus-5 @T-111
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-145-s3 (Amnesty triage 2026-08-29 (triage seat)) — a seventh sentence for the same bullet, and a fresh instance of a hazard the bullet already documents (T-013-s7 arm (c), which the paragraph credits with having bitten three agents — this is the fourth). What is NOT written is the RECOVERY: the bullet prescribes cargo clean -p plus a rebuild, and cargo clean is prohibited in this checkout, so the recovery that worked here is to touch every workspace .rs (mtime only) and rebuild. It also carries the trap worth naming — the first repair, touching the one source file the panic named, produced a SECOND red with nine failures, because each integration-test binary bakes its own copy.

Absorbs: T-092-s6 (Amnesty triage 2026-08-29 (triage seat)) — a sixth sentence for the same bullet and the cheapest of them all — six words, or a deletion. The shape-six paragraph transcribes 1 failed / 832 passed of 833 with no ref; the tree is 1013 across 47 files, the 833 is T-072's suite size, and nothing on the page says so. It is the class this file has already paid for twice: ADR-019's compaction deleted two transcribed denominators from this same file for exactly this. Stamp it or drop the fraction and keep the property, which is the only load-bearing half.

Absorbs: T-092-s5 (Amnesty triage 2026-08-29 (triage seat)) — a fifth sentence for the same bullet, and its cheapest arm costs almost nothing: the catalogue claims THE CATALOGUE IS CLOSED AT ELEVEN AND EVERY ORDINAL IS MINTED HERE and then says Cards CITE these numbers, while shapes ONE to FOUR have no entry anywhere — grep returns nothing at T-092's tip and at its base, so it is inherited, not introduced. Soften the claim to what is true (closed at eleven, FIVE through ELEVEN carry entries, ONE to FOUR are the matcher-moved-value-fixed family whose histories live in the cards) rather than writing 3.9 KB this seat does not have.

Absorbs: T-130-s1 (Amnesty triage 2026-08-29 (triage seat)) — asks by name to be taken in ONE edit with T-079-s3 rather than as a fourth pass over the same bullet, and carries the measurement that makes the rule writable: 50 of 50 fresh writes land on a sub-millisecond mtime, the Date form round-trips 0 of 50 and the seconds form 50 of 50. It also corrects T-079-s3's own ctime caveat downward, which is why the two must land together rather than in sequence.

Absorbs: T-079-s3 (Amnesty triage 2026-08-29 (triage seat)) — the same gap found by paying it at an integration: a body that planted into a tracked file wrote the original bytes back, sha256-identical and git diff clean, and still cost a red — because seven sibling bodies read the CLOCK. Items 2 and 3 are the CONVENTIONS sentences it routed, and they have sat at this seat since.

Absorbs: T-092-s4 (Amnesty triage 2026-08-29 (triage seat)) — the sharpest member of the restoration class and the one docs/STATE.md carries as a standing board hook. It shows the prescribed empty-diff proof passing on the WRONG FILE with the work already committed, which the bullet's own DRILL AT A COMMIT clause was written to prevent and does not — two mechanisms defeat one proof and committing first closes only one. Its remedy is a criterion here.

Absorbs: T-110-s4 (Amnesty triage 2026-08-29 (triage seat)) — the same collision measured first, in a different drill with a different directory name (.drilltarget rather than .fctarget) and a different phantom file (a tauri build-script __global-api-script.js carrying zero symbols and zero edges, so only the FILE count moved). It reached the same recommendation — arm (a) plus a sentence in the POISON DRILL bullet — and it adds the consequence this card's criteria keep: the two dogfood fixtures reported six moved assertions where five are real, including an unmapped bucket that the merge will not produce.

Integrator at the amnesty merge (2026-08-29, cc5389b): `blocked_by:
[T-092-s2]` LIFTED. The 280-byte headroom was true at the triage's base
(47979ee) and false at the merge ref — ADR-019 Addendum 3 (0d82a60,
between the two) re-landed docs/CONVENTIONS.md at 110,342 bytes and
re-derived warn to 137,928; headroom re-derived here is 27,586 bytes
(`wc -c docs/CONVENTIONS.md` against DOC_BUDGETS in
tools/e2e/scripts/docs-gate.mjs [the table's home since T-156 is
docs-scan.mjs]). The seat is no longer the constraint;
T-092-s2 is discharged in rejected/ with the full citation.

**PROMOTED at the amnesty triage, 2026-08-29, as the owner of its class.**
Two lanes, two seats, two different target-directory names, one defect:
the directory the POISON DRILL bullet tells you to create is INSIDE the
tree the graph walk indexes, and `.gitignore` excludes `target/` and
nothing else.

Absorbs: T-110-s4, T-079-s3, T-092-s4, T-130-s1 (see the corroboration
lines below).

**FOUR SEATS, FOUR SENTENCES, ONE PARAGRAPH — AND THAT IS THE POINT.**
`T-104-s5` derived the routing fact this card is built on: edits queued
at the `docs/CONVENTIONS.md` seat land in a small number of bullets, and
*take them together or the bullet gets patched three times and still does
not say it.* `T-130-s1` asks for exactly that in its own words. Three of
the four absorbed findings are the same gap seen from three angles —
**the bullet rules how a restoration is PROVED and never says what
restoring MEANS** — and the fourth is the walk collision this card was
filed for. `T-092-s4` is the sharpest of the three, because it shows one
of the two prescribed proofs passing on the wrong file with the work
already committed, which is the case the bullet's own newest clause was
written to close and does not.

Needle re-checked at this base: `docs/CONVENTIONS.md` still says
*"GIVE IT ITS OWN `CARGO_TARGET_DIR` INSIDE ITSELF"* with
`<scratch>/.drilltarget` as the worked example, and neither
`.gitignore` nor `.nputerignore` mentions `.drilltarget`, `.fctarget`, or
any other name arm (c) invites you to choose.

**WHY IT IS WORTH A CARD RATHER THAN A NOTE.** `files +0 -0` is the
sentence a checkpoint decides on — it is the whole argument for *"the
checkpoint owes NO fixture reconciliation"*. A phantom `+3` inverts that
sentence, and a session that has just followed arm (c) faithfully will
read it and reasonably conclude the merge owes a reconciliation it does
not. The cheap failure direction is over-reconciliation; **the expensive
one is equally available** — a real `+1` hidden among build artefacts a
reader has learned to discount. Both measurements are on this card, from
two different drills, and they agree.

## Acceptance criteria

- THE POISON DRILL bullet SHALL name a target directory the walk already
  excludes — arm (a), `<scratch>/target` — rather than leaving the name
  to the reader. The hazard arm (c) exists for is not sharing the
  PARENT's cache, never the directory's name, so the property is
  unchanged and the fix costs one word.
- THE bullet SHALL state the reason in the form the finding gives it:
  a drill's target directory must be invisible to the WALK as well as to
  the parent's cache, and only one of those two was written down.
- THE class fix (teaching the walk to skip any directory containing
  cargo's own `CACHEDIR.TAG`) SHALL be ROUTED as its own `[crate-index]`
  card rather than taken here — it is code, it is a different fence, and
  the doc edit must not wait on it. Arm (a) and arm (c) are not
  alternatives.
- THE empty-`git diff` restoration proof SHALL be demoted from an
  ALTERNATIVE to a companion. `git checkout <commit> -- <path>` writes
  the INDEX as well as the worktree, so a following bare
  `git checkout -- <path>` restores FROM THE MUTATION'S OWN SOURCE and
  the prescribed empty-diff proof reports success on the wrong file —
  measured, with the work committed, so the bullet's DRILL AT A COMMIT
  clause does not close it. The sha256-against-HEAD arm is the proof; the
  diff is a convenience, and `git diff` alone cannot see a staged index.
  The safe spelling SHALL be named beside the trap
  (`git restore --source=<commit> --staged --worktree -- <path>`).
- THE bullet SHALL say what restoring a fixture MEANS: a body that plants
  into a tracked file restores its BYTES **and** its CLOCK, and **a clock
  restored through a `Date` is lossy below the millisecond** —
  `utimesSync(target, stats.atime, stats.mtime)` writes back a rounded
  timestamp where `utimesSync(target, stats.atimeMs / 1000,
  stats.mtimeMs / 1000)` carries the fraction. Measured 50 of 50 both
  ways on APFS.
- THE self-healing property SHALL land with it, because it is what makes
  the rule necessary rather than nice: **the lossy restore leaves the
  file on a whole millisecond, so the next run rounds to a no-op and
  passes.** Red once, green forever after, in that checkout — re-running
  until green is the defect's own healing mechanism, not evidence.
- THE `ctime` caveat SHALL be written at the strength the evidence
  supports and no higher: seen once, and NOT reproduced in 24 further
  cycles across two checkouts, one of them a freshly cut worktree. It is
  an observation, not a mechanism, and the standing advice is unchanged —
  prove restoration by HASH, which is immune either way.
- THE lane SHALL re-derive the `docs/CONVENTIONS.md` edit queue at its
  own ref before writing (`T-104-s5` catalogues one, and that catalogue
  is itself a transcribed census two of whose named homes have since
  merged). Anything still owed at this seat may ride the same edit;
  nothing SHALL be taken from that card's list without re-deriving it.
- THE byte budget on `docs/CONVENTIONS.md` is a gate — the lane SHALL
  report `npm run lint:docs`'s answer rather than assume headroom.

## The record, kept verbatim

**TWO STANDING RULES IN THIS FILE COLLIDE, AND THE COLLISION PRODUCES A
CONFIDENT WRONG ANSWER FROM A GATE RATHER THAN AN ERROR.** Measured on
`T-111`'s fix pass at main `6a6bc87`. Fence is `docs/CONVENTIONS.md`,
outside `T-111`'s `[app-board, app-shell]`, so this is routed per
`roles/executor.md`.

## The two rules

**POISON DRILL** says, in capitals: *"DRILL IN A DETACHED SCRATCH WORKTREE
AT A NAMED COMMIT, AND GIVE IT ITS OWN `CARGO_TARGET_DIR` INSIDE ITSELF"*
— arm (c), taken at T-013's merge after the hazard *"bitten three
agents"*. The measurement it cites is that a drill rooted at
`<scratch>/.drilltarget` left the main checkout's `target/` byte-identical.

**GRAPH REGEN / `index --check`** walks the tree and excludes `target/`.
It does not exclude `.drilltarget`, `.fctarget`, or any other name arm (c)
invites you to choose — arm (c) names one, and the name is not the point
of the rule, so nothing makes the two agree.

## What it produced

The same merged tree, the same commit, the same command, twice — differing
only in whether `CARGO_TARGET_DIR` sat inside the worktree or beside it:

| `CARGO_TARGET_DIR` | committed | fresh index | verdict |
|---|---|---|---|
| `/private/tmp/t111r/.fctarget` (INSIDE, as arm (c) says) | 970961 B · 183 files · 1986 edges | 991761 B · **186 files** · 2034 edges | **`files +3 -0 ~2`** · `edges +51 -3` |
| `/private/tmp/t111rtgt` (BESIDE) | 970961 B · 183 files · 1986 edges | 989181 B · **183 files** · 2033 edges | **`files +0 -0 ~2`** · `edges +50 -3` |

The three phantom files:

    + .fctarget/debug/build/serde-96533ca132bdbf45/out/private.rs
    + .fctarget/debug/build/serde_core-3dd530b7d67e3910/out/private.rs
    + .fctarget/debug/build/serde_core-b5ed433853b4cd54/out/private.rs

plus a phantom package node `p:cargo:serde_core` and its import edge —
which is where the extra edge in `+51` comes from.

## Why this is worth a card and not a note

**`files +0 -0` IS THE SENTENCE A CHECKPOINT DECIDES ON.** It is the whole
argument for *"the checkpoint owes NO fixture reconciliation"*: zero files
join or leave the index, so `architecture-dogfood.test.ts`'s
`fileComponent.size` and `map-dogfood-render.test.tsx`'s header hint
cannot move. **A `+3` inverts that sentence** — and a session that has
just followed arm (c) faithfully, in the worktree arm (c) told it to
build, will read `files +3 -0 ~2` and reasonably conclude the merge owes a
reconciliation it does not owe. The failure direction is
over-reconciliation, which is cheap; **the opposite reading is not, and it
is equally available**: a real `+1` hidden among build artefacts a reader
has learned to discount.

**AND `docs/CONVENTIONS.md` ALREADY KNOWS THE SHAPE OF THIS BUG.** The
`--root` paragraph three bullets up exists because `index --check` gives a
FALSE RED that *"IS NOT DISTINGUISHABLE BY THE HEADLINE"* and tells the
reader to read the second line. This is the same gate answering
confidently and wrongly for a second reason, and the second line does not
disambiguate it either — a phantom `+` file is formatted exactly like a
real one.

## The repair, three options

- **(a) NAME THE DIRECTORY IN THE RULE.** Arm (c) says *its own
  `CARGO_TARGET_DIR` inside itself*; make it say **`<scratch>/target`**,
  which the walk already excludes. One word, no code, and the drill
  hazard arm (c) exists to close is closed identically — the hazard is
  *not sharing the parent's cache*, never the directory's name.
  **RECOMMENDED**, and it is the only option that costs nothing.
- **(b) PUT IT BESIDE THE WORKTREE.** `/private/tmp/t111rtgt` for a
  worktree at `/private/tmp/t111r`. Also correct, also outside the walk,
  and it survives `git clean` — but it leaves a directory nobody's
  worktree removal will collect.
- **(c) TEACH THE WALK.** Exclude any directory containing
  `CACHEDIR.TAG`, which cargo writes into every target dir it creates.
  The most general fix and the only one that helps a reader who chose a
  third name; it is `crate-index`'s code rather than a doc edit, so it is
  a different fence and a different card.

**(a) AND (c) ARE NOT ALTERNATIVES** — (a) fixes today's readers in one
word, (c) fixes the class. The doc edit should not wait on the code one.

## The one-line version for whoever writes it

*A drill's target directory must be invisible to the walk as well as to
the parent's cache, and only one of those two is currently written down.*

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
