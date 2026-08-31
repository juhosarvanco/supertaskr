# Checkpoint: T-140-s9 lands — the card's own premise was wrong, two seats found that independently, and one guard turns out to be undetectable by construction

Date: 2026-08-31. Seat: architect/integrator. Scope: T-140-s9 merge and
close; three assigned corrections, one of which this seat answered by
getting it wrong twice; the night's eleventh and last lane.

## The card's premise was an undercount, and both seats found it alone

The card said the collector's symlink refusal is guarded **three** times
and that neither symlink body can be poisoned by lifting fewer than
three, `relative_posix`'s `strip_prefix` being the third layer.

**Both the executor and the blind verifier read the base code and
reached the same correction independently.** There are **four** layers in
the walk, and a fifth drop for an outside-pointing link:

- `!meta.is_file()` — an **uncounted** line three below `is_symlink` —
  is what actually absorbs a lifted `is_symlink`, because `meta` comes
  from `symlink_metadata` under which a link is neither file nor dir. The
  card named the wrong absorber.
- `starts_with` and `relative_posix`'s `strip_prefix` are **one predicate
  mutually shadowing**, not two layers.
- and `is_collected_docs_path`'s `docs/` prefix drops an escaped path a
  fifth time.

**Of the four, exactly one — `relative_posix`'s `.ok()?` — is detectable
alone.** The verifier reached that without reading the executor's
correction, which is the strongest form this confirmation can take.

## The ruling: every layer stays, and the EVIDENCE is what changed

Not "defence in depth" and not "two are redundant". The measurement says
something else: **redundancy was never what made the evidence vacuous —
the missing bodies were.** Deleting a shadowed line buys zero
discrimination while costing a visible containment statement on an
ADR-010 boundary, so each layer is now named at its site for what it is,
`relative_posix` is documented as the load-bearing containment rather
than as formatting, and the false claim that one was *"belt to the
symlink-skip's suspenders"* is corrected — **that claim was the defect.**

The shipped walk is semantically identical to base: comments and tests
moved, the refusal did not.

## THE CORRECTION THIS SEAT GOT WRONG TWICE, AND THE DRILL CAUGHT BOTH

The verifier found the sweep had stopped one function short **inside its
own fence**: `is_plain_dir`'s `is_symlink` half is inert, and
`collect_docs_tree`'s docs-root guard can be deleted **entire** — branch,
`eprintln` and early return — with the suite green. It called that a
coverage hole.

**It is not a hole a body can close, and this seat proved it the
expensive way.**

- **Attempt one** used a `docs/` symlinked OUTSIDE the project. It passed
  under the deletion mutant: every entry canonicalizes out of the tree
  and containment rejects it, so the outcome is byte-identical either
  way.
- **Attempt two** pointed the link INSIDE the project, where containment
  cannot rescue it. **It passed too** — the entries canonicalize to
  `real-docs/…` and `is_collected_docs_path`'s own `docs/` prefix drops
  them.

**So the refusal is unobservable through that function's public outcome
by construction rather than by oversight**, and CONVENTIONS rules the
case directly: *"IF a body cannot be poisoned … THEN say so and name it,
because a body that cannot red is the finding."* The body that landed is
named for the OUTCOME the five layers hold JOINTLY, says explicitly that
it does not pin the guard, and **carries both failed attempts at its
site** so the next reader does not repeat them.

**The guard stays, for a reason no assertion can express**: it refuses
EARLY and LOUDLY, before a walk that would otherwise read a foreign tree
and discard it silently. Both are "collects nothing"; only one of them
says so.

## The other two corrections

**Shape SIX was never asked, and the verifier answered it**:
`the_prefix_check_and_relative_posix_are_one_predicate` kills no mutant
its sibling does not, because it asserts only `.is_some()` — every
Some-side mutant is invisible to it. Its subject is a std-library
equivalence **no first-party mutant can falsify**, so no count-1 mutant
exists and none can be constructed. Recorded as the finding rather than
as a gap; the body is kept for what it documents.

The diff figure is corrected to `+224/-6`.

**AND THE TITLE IS FALSE AND STAYS.** This card's title and filename
claim *"guarded three times"*; the body retracts it. Renaming would
strand three cards' references, so the retraction travels with the card
instead — the disposition this project already takes for a stale headline
whose body carries its own correction.

## Gates

- `index --check` — **CURRENT**, regenerated: **1,143,153 of 2,145,959
  (53.3%), 1,002,806 left**
- `cargo test` — **260 lib, exit 0** (256 at base, +3 the lane's and +1
  this seat's correction), lib suite 7.85s
- `npx vitest run` from lib/parser — **344**, `npm test` from app/ —
  **1077**, `npm test` from tools/e2e — **341**, all exit 0
- `lint:tokens` / `lint:docs` / `capabilities:check` — **0 / 0 / 0
  CURRENT**
- **BOOT GATE — OWED AND RUN, exit 0** on port 17601; 1420 read with
  `lsof` only: zero rows
- **HEALTH — 10 inside, 0 drifting, 0 BREACHED, 0 unread, 4 UNKEPT**

**A drill defect the lane caught in its own instrument**: its first
read-back ran `git diff -- <path>` from `app/src-tauri`, where git
resolves pathspecs against the CWD — so the check reported an empty diff
while `perl` really had mutated the file, and the restore would have
silently no-opped. It killed that arm, restored by hand with a hash
proof, and switched to `git -C`. That is the class this project's
restoration rules exist for, caught by a seat checking its own tools.

## Board

`T-140-s9` done, `review: independent`. **ELEVEN LANES LANDED
overnight**, no task branches remain.

## Owed after this record

- **Routed by this lane**: `crates/nputer-index/src/walk.rs`'s
  `walk_root` is the identical finding one crate over — same four
  checks, same shadowing, and one body whose link points outside so
  containment alone produces its green. Wants a card fenced on `C-07`.
- **Non-Unix is unverified**: one new body is `#[cfg(unix)]`, so on
  another platform the delta is +2 rather than +3. Darwin only here.
- **@human, untouched all night as asked**: the FORM question
  (reopened), the steering split, the three permission questions, and
  thirty seconds on the interview's new ending at a narrow width.
