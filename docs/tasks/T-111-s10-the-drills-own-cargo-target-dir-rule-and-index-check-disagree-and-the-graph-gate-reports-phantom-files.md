---
id: T-111-s10
title: The POISON DRILL bullet gets ONE edit for its four earned sentences — the target directory the walk can see, what restoring a fixture MEANS, a clock restored through a Date, and a restoration proof that passes on a failed restore
feature: F-06
milestone: 4
priority: 6
size: S
status: done
blocked_by: []
touches: [docs/CONVENTIONS.md]
suggested_by: executor claude-opus-5 @T-111
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
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

**CONFIRMATION OF UNDERSTANDING, written before anything was touched.**
One card, one fence (`docs/CONVENTIONS.md`), one bullet: the POISON
DRILL bullet gains eight seats' earned sentences in a single coherent
edit rather than in four passes — arm (c)'s target directory named
`<scratch>/target` because the graph walk excludes only `target/`
(T-111-s10 + T-110-s4 + T-153-s3); the `cargo clean`-prohibited recovery
and its nine-failure trap (T-145-s3); the empty-`git diff` proof demoted
from ALTERNATIVE to companion, with the staged-index mechanism and the
`git restore` safe spelling (T-092-s4); what restoring a fixture MEANS —
bytes and clock, the seconds form over the `Date` form, the self-healing
property, and the `ctime` caveat at the strength of its evidence
(T-079-s3 + T-130-s1) — carrying the libuv-version rider (T-153-s7 half
one, from T-153-s5's verdict correction 1); the shape-catalogue
softening (T-092-s5); and the unstamped denominator dropped (T-092-s6).
The CACHEDIR.TAG class fix is ROUTED, never taken. **The card and the
standing docs did not conflict anywhere**, and no criterion needed a
path the fence does not hold.

### THE BYTE COST, and every figure here is at its own ref

| | `39f2302` (base) | `e967701` (the edit) | delta |
|---|---|---|---|
| `docs/CONVENTIONS.md` | 126 280 B | 132 382 B | **+6 102** |
| the POISON DRILL bullet | 18 453 B | 24 555 B | **+6 102** |
| headroom to `DOC_BUDGETS` warn (137 928) | 11 648 | **5 546** | −6 102 |

Every byte the document gained is inside the bullet: nothing else in the
file moved. `npm run lint:docs` exit **0** and its own line reads
*"governing-document budgets hold — 4 gated, 0 awaiting their compaction
landing"*, which is the criterion's answer rather than an assumption.

### EACH ABSORBED FINDING — landed, or parked back with its reason

- **T-111-s10 (own) + T-110-s4 — the walk-visible target dir. LANDED.**
  Arm (c)'s heading now reads *"AT `<scratch>/target`, NOT AT A NAME YOU
  CHOSE"*, and a new paragraph carries the reason (`.gitignore` excludes
  `target/` and nothing else), the two measurements (`files +3 -0 ~2`
  inside under a chosen name against `files +0 -0 ~2` beside, with the
  three build-script `out/private.rs` files and the phantom
  `p:cargo:serde_core` node named), the second lane's corroboration, and
  why `files +0 -0` is the sentence a checkpoint decides on in BOTH
  directions. **Needle re-derived at this base rather than trusted**:
  `.gitignore` at `39f2302` is exactly `.DS_Store`, `node_modules/`,
  `dist/`, `target/`, and `.nputerignore` adds only `docs/`, the
  indexer's own fixtures and `tools/` — neither mentions `.drilltarget`,
  `.fctarget` or any other name.
- **CACHEDIR.TAG class fix — ROUTED, not taken**, as
  `docs/tasks/T-111-s11-…md`, `touches: [crate-index]`,
  `status: suggested`. Code never rides a doc lane; the bullet now names
  the class fix in one clause and says the doc does not wait on it.
- **T-092-s4 — the vacuous restoration proof. LANDED**, and it took the
  falsified sentence with it. The bullet used to say *"Committing first
  makes both proofs correct by construction, which beats adding a
  third"*; that is false and T-092-s4 is why, so it now reads
  *"Committing first closes THAT mechanism by construction; it does not
  close the staged-index one above, which is why the hash is the
  proof."* The empty diff is stated as a COMPANION, the index-writing
  mechanism is spelled out, and `git restore --source=<commit> --staged
  --worktree -- <path>` is named beside the trap.
- **T-079-s3 items 2–3 + T-130-s1 — what restoring MEANS. LANDED**, all
  three halves: bytes AND clock with the `git diff --quiet`
  cached-stat-info reason; the seconds form against the `Date` form with
  the 50/50 · 0/50 · 50/50 measurement; the self-healing property with
  *"re-running until green is the defect's own healing mechanism, not
  evidence"* in the bullet's own voice; and the `ctime` caveat written at
  seen-once-and-not-reproduced-in-24-cycles, explicitly an observation
  and not a mechanism.
- **T-153-s7 half one — the libuv-version scoping. LANDED as the rider.**
  The T-130-s1 measurement is now stamped `(APFS, libuv v1.52.0)` and a
  following paragraph carries T-153-s5's verdict correction 1: the axis
  is the libuv VERSION, not the platform — v1.51.0's
  `uv__fs_to_timespec` truncates to a whole microsecond under one `#if`
  naming `__APPLE__` and `__linux__` together, v1.52.0 deletes the hack,
  24 uv-1.51.0 samples reach 1016 ns in both signs against uv-1.52.0's
  170 ns — and the rule the reader needs: **a clock restore round-trips
  at MICROSECOND precision, and an assertion demanding more is measuring
  the measuring host.** The criteria admit it: criterion 7 orders a
  caveat written at the strength of its evidence and no higher, and
  shipping *"round-trips 50 of 50"* unscoped is the same defect one
  sentence earlier.
- **T-153-s7 half two — the poison shape. PROCEDURE LANDED, ORDINAL NOT
  MINTED.** The `utimesSync` fixed point rides criterion 6's sentence,
  because it IS the self-healing property seen from the drill's side, and
  the durable half is one clause: *"before poisoning an assertion over
  PERSISTENT state, put that state back to a condition the suite did not
  create."* Whether that is a TWELFTH shape or a second face of TEN is
  deliberately NOT decided here — T-153-s7 says its own seat should not
  decide it, the catalogue is closed at eleven, and minting a wrong
  ordinal is the defect the catalogue exists to prevent. T-153-s7 stays
  `suggested` with that question live and both its halves' text landed.
- **T-092-s5 — the shape-catalogue softening. LANDED.** Verified at this
  base first: `SHAPE ONE`–`SHAPE FOUR` return nothing anywhere under
  `docs/`, so the claim was inherited rather than introduced. The
  catalogue now says entries live here for FIVE through ELEVEN, names
  ONE–FOUR as the *matcher moved, value fixed* family whose histories
  live in the cards, and keeps the load-bearing half: *"every ordinal is
  minted here"* governs NEW numbers.
- **T-092-s6 — the transcribed denominator. DROPPED, which is the arm the
  card called cheapest.** *"1 failed / 832 passed of 833"* is now *"a
  failing-body count of exactly one, naming that body and nothing else"*,
  with a half-sentence saying the total was T-072's and unstamped so the
  next reader does not helpfully restore it. **The drop was the right
  arm and this lane can prove it**: the app suite at `e967701` is
  **1015 passed across 47 files**, so the 833 was wrong by 182 and the
  card's own re-derivation (1013) was already stale by 2.
- **T-145-s3 — the cache-recovery trap. LANDED.** The `cargo clean -p`
  sentence now carries what to do where `cargo clean` is prohibited
  (`touch` every workspace `.rs`, mtime only, and rebuild) and the trap
  that costs the second red (touching only the file the panic named:
  nine failures, because each integration-test binary bakes its own
  copy). The *"bitten three agents"* tally is now four, with the
  instances named rather than only the count.
- **T-104-s5's queue — RE-DERIVED at this ref, and one member PARKED
  BACK.** The live queue at `39f2302` is sixteen cards holding
  `docs/CONVENTIONS.md` (T-087, T-094, T-105, T-117, T-121, T-128,
  T-131, T-132-s2, T-142, T-145-s2, T-147, T-153-s7, T-153-s8,
  T-153-s11, T-153-s15, T-160-s1); T-104-s5 itself is `parked` and its
  own note names two survivors. `T-091-s3`'s trigger clause is the one
  still owed at this seat, and it is **parked back rather than taken**:
  it belongs to the RANGE RULE bullet, not this bullet family, and that
  bullet is `rawBullet`-parsed with spec-kept figures — a second bullet
  in this edit buys risk the card did not ask for. T-104-s5's resurface
  hook stands for the next `docs/CONVENTIONS.md` dispatch.

### THE SWEEP — A FIX NAMES ITS CLASS

Class: **a live instruction naming a drill target directory the graph
walk does not exclude.** Search at `39f2302`, from the repo root:
`git grep -n 'drilltarget\|fctarget\|CACHEDIR'` and
`git grep -n 'CARGO_TARGET_DIR' -- method/ docs/ tools/ .github/`.
**Two live instruction sites, both in `docs/CONVENTIONS.md`**: arm (c)
itself (fixed here) and line 903's forecast paragraph, which says *"with
its own `CARGO_TARGET_DIR` (POISON DRILL below says why)"* and names no
directory, so it inherits the fix. `method/` carries none. Every other
hit is a RECORD of a past measurement — `T-010`, `T-033`, `T-110`,
`docs/rooms/t110-second-rejection.md` — not an instruction, and outside
this fence. **The sweep is shown capable of failing**: the same pattern
returns the pre-fix arm (c) at `git show 39f2302:docs/CONVENTIONS.md`.
`docs/STATE.md`'s standing-hazard line still warns that a non-`target`
target dir is inside the walk; it is outside this fence, it is now
redundant rather than wrong, and STATE is replaced at every checkpoint —
**flagged for the integrator rather than carded.**

### THE DRILL — three mutants, ONE SIDE ONLY, and two false kills

The bullet's own trigger does NOT fire on this diff (no test body is
added or changed), so this drill is discretionary: it exists to show the
green suites above are evidence rather than a document nobody reads.
Committed FIRST at `e967701`, then drilled in a DETACHED scratch
worktree at that commit, `/Users/ujju/Projects/t111s10drill` — a SHORT
root, one stem (`t111s10drill`) spent on the worktree and every artefact,
`git status --porcelain` empty at every step. Each mutation was applied
by exact-string replacement REFUSING any count but 1 and read back with
`git diff` before its run. **Every restore used the NEW spelling this
edit lands** — `git restore --source=e967701 --staged --worktree --
docs/CONVENTIONS.md` — and was proved sha256-identical against HEAD at
`f5189fb91c9c9c09cc0fe557ee9c14711ef55d55901eb27aae0442321578a2eb`,
three times.

| mutant | one side | observed |
|---|---|---|
| **M1** `- POISON DRILL (` -> `- POISON RITUAL (` | the document | **KILLED** — `brief.mjs` ROW 9 loses `POISON DRILL`, gains `POISON RITUAL`. The document is genuinely read. |
| **M2b** `- THE RANGE RULE: WHICH TWO COMMITS` -> `- THE RANGE GUIDE: …` | the document | **KILLED** — `rawBullet` throws *"has 0 bullets containing \"THE RANGE RULE:\", expected exactly one"*. The opener guard the brief warned about is live. |
| **M3b** two spaces -> `- ` at column zero INSIDE this bullet | the document | **SURVIVED** `lint:docs` (exit 0) and `brief.mjs` ROW 9 (15 named bullets before and after). Routed as `T-111-s12`. |

**BOTH FALSE KILLS ARE RECORDED BECAUSE THE CONTROL IS WHAT CAUGHT
THEM.** M2's first form called `rangeRuleBullet()` with no argument, so
it threw `undefined.split` under the mutant AND under the clean tree; and
an attempt to detect M3 through `conventionsBullet(md, "POISON DRILL")`
throws at EVERY ref, because that phrase sits in three bullets — **3 at
`39f2302` and 3 at `e967701`, so my edit moved it by zero.** Two greens
built out of two failures, inside a drill of the very file that
catalogues that as SHAPE TEN. Neither reached a conclusion only because
the positive control was re-run on the restored tree each time.

**AND ONE THING THE DRILL COULD NOT SEE, said rather than left to be
found:** none of the ~6.1 KB this edit adds is pinned by any assertion
in any suite, so no mutant of the NEW prose can red. That is the
bullet's own *"IF a body cannot be poisoned, say so and name it"* clause
applied to a document: the suites prove the file is READ and that its
openers and budgets hold, not that any sentence in it is true.

### THE IRONY BUDGET, since the brief asked for it

The drill obeyed the NEW text and there was no disagreement to resolve,
because the drill worktree was cut at `e967701` — the commit that
carries the new text. The restoration used `git restore --staged
--worktree` (new) rather than a bare `git checkout --` (the trap the new
text names), and proved by hash (both texts agree). The one place the
old text would have led differently is M2b's restore: under the old
"or an empty `git diff -- <path>`" alternative, a bare
`git checkout -- docs/CONVENTIONS.md` after an index-writing restore
would have reported clean on the wrong file. It was not used.

### COMMANDS, in the order run, each read from `$?` unpiped

| command | cwd | exit | count |
|---|---|---|---|
| `npm ci` then `npm run build` | lib/parser | 0 | — |
| `npm ci` | tools/e2e | 0 | — |
| `npm install` then `npm run build` | app | 0 | — |
| `npm run typecheck` | tools/e2e | 0 | — |
| `npm run lint:docs` | tools/e2e | 0 | budgets hold, 4 gated |
| `npx vitest run` | lib/parser | 0 | **314 passed**, 15 files |
| `npm test` | app | 0 | **1015 passed**, 47 files |
| `cargo test` | app/src-tauri | 0 | **525 passed, 0 failed, 4 ignored**, 18 binaries |
| `NPUTER_E2E_PORT=14111 npm test` | tools/e2e | 0 | **313 passed**, 3.0m |
| `npm run lint:tokens` | tools/e2e | 0 | TOKEN 155 files; CONTROL 899 tracked text files |
| `cargo run -q -p nputer-index -- index --check --root ../..` | app/src-tauri | 0 | CURRENT — 1 022 964 B, 189 files, 2160 symbols, 2114 edges |
| `node tools/method-evals/run.mjs` | repo root | 0 | 6 model-free evals |
| `node tools/e2e/scripts/docs-gate.mjs $(…)` | repo root | **1** | FIRES — four suites owed |

Every figure above is at `e967701` unless it names another ref. Ports
were DERIVED from the lane, not defaulted (`14111` for the lane's suite,
`14112` reserved for the drill's), each `lsof`-read at **zero rows**
immediately before use; port **1420** was read holding `node 19746` —
the human's app — and never touched, `lsof -nP -iTCP:1420 -sTCP:LISTEN`
being the only command spent on it (read 2026-08-30 on Mac.lan).

### STANDING GATES, derived from the FORECAST tree rather than my ref

Derived by the RANGE RULE's **executor pair** —
`TREE=$(git merge-tree --write-tree 39f2302 HEAD)` (exit 0) then
`git diff --name-only 39f2302 "$TREE"` — extended with the two paths this
notes commit adds, so the answer does not move when it lands. **Four
paths, all under `docs/`**: `docs/CONVENTIONS.md`, this card, and the two
routed cards.

- **GRAPH REGEN — NOT OWED.** Trigger is `*.ts/*.tsx/*.js/*.jsx` or
  `*.rs` OUTSIDE `docs/`; 0 of 4 paths match. `index --check` was run
  anyway and reads CURRENT.
- **BOOT GATE — NOT OWED.** Trigger is `app/src-tauri/**`, `app/src/**`
  or either manifest; 0 of 4 paths match.
- **DOCS GATE — FIRES** (exit 1), on all four paths. Owed and RUN:
  `cargo test` from app/src-tauri/, `npm test` from app/, `npm test`
  from tools/e2e/, `npx vitest run` from lib/parser/ — all four green
  above, all four re-run at the final tree.
- **METHOD EVAL GATE — NOT OWED.** Trigger is `method/**`; 0 of 4 paths
  match. The model-free set was run anyway (exit 0, 6 evals).
- **AUDIT GATE** declares no merge-diff trigger, so it is not one of
  these.

### WHERE THE BRIEF WAS WRONG

1. **The T-153-s5 mechanism is not at the path the brief gave.** The
   brief cites `docs/checkpoints/2026-08-29-T-153-s5.md`; no such file
   exists at `39f2302`. The mechanism is on the CARD,
   `docs/tasks/T-153-s5-…md`, under *"THE MECHANISM"* and the verdict's
   correction 1, and that is what was read.
2. **The ceremony row and the stamp.** The table's row for an S card
   whose diff is outside shipped code gives NO verifier and makes the
   executor its own integrator; the rule of thumb beside it is *"docs,
   method and tooling self-integrate"*, and this diff is four `docs/`
   paths. The brief nonetheless instructs `verifying` and does not
   instruct a merge. **The brief is obeyed** — the table hands the row
   assignment to the dispatcher in as many words (*"State which it is
   when you dispatch"*), so this is discretion exercised rather than a
   contradiction, and a verifier over an eight-seat edit to a
   machine-read document is the cheaper error. `status: verifying`, no
   merge, worktree kept for the verdict (lane-protocol rule 6).
3. **Everything else in the brief held**, including the `~11.6K` warn
   headroom (11 648 exactly), the 313-body base suite, the `ugrep` shim,
   and the live sibling triage worktree at
   `/Users/ujju/Projects/nputer-triage2` on `triage/standing-2026-08-30`
   — disjoint from this fence, and the machine load it warned about did
   not produce a single flake.

### SUGGESTIONS FILED

- **`T-111-s11`** `[crate-index]` — teach the walk to skip a directory
  carrying cargo's own `CACHEDIR.TAG`. The class fix criterion 3 orders
  routed; arm (a) landed here, arm (c) is code.
- **`T-111-s12`** `[tools/e2e]` — a column-zero `- ` inside a bullet
  splits it silently unless some reader happens to pass that bullet's
  phrase to `conventionsBullet`; M3b above is the measurement, and the
  card is explicit about what was NOT established.

## Verdicts
