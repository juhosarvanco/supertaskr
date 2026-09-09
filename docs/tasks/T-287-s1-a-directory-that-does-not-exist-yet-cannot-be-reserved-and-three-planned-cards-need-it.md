---
id: T-287-s1
title: "A DIRECTORY that does not exist yet still refuses as a DEAD FENCE ENTRY, and so does an extension-less file — the NEW-FILE reservation reads a file extension, so three planned cards that create a directory are still forced to fence something that exists"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-287, measured over the whole board at 8cd11020e631, 2026-09-09"
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding, measured at `8cd11020e631f195952b4921c045a622b3df7809`

`T-287` gave a fence token naming a file that does not exist yet a home:
a NEW-FILE RESERVATION, when the token carries a file extension and its
parent directory is tracked. Its second acceptance criterion keeps two
shapes DEAD by name, and both are shapes live cards are in.

**A DIRECTORY token with nothing under it.** Three planned cards carry
one at this ref, and each of them is a card whose work CREATES that
directory:

    T-290  docs/conventions/     the CONVENTIONS split, blocked on T-287
    T-275  app/src/rooms/        the rooms lens
    T-261  .claude/agents        the per-role tool surfaces

Each is refused today, and `T-290` was named by `T-287`'s own dispatch as
a card this work would unblock. It does not: the reservation reads a file
extension, `conventions` has none, and the entry stays dead. `T-261` and
`T-275` each hold a directory token BESIDE a spec-file token that `T-287`
now accepts, so both cards refuse on one entry while the other passes.

**A file with no extension.** The same test rejects a root dotfile: a
card that would create `.supertaskrignore` names a leaf whose only dot is
at position zero, which no reading calls an extension. Two done cards
(`T-020`, `T-264`) carry the retired `.nputerignore` in exactly that
shape, so the class is not hypothetical, only currently harmless.

**And the deeper variant, where the PARENT is untracked too.**
`T-216-s7` reserves `app/src-tauri/crates/nputer-index/tests/perf.rs`
under a `tests` directory that holds no tracked file. `T-287`'s rule
refuses it on purpose — a path whose parent is untracked is a claim about
a tree the checkout cannot see — but the card is a real card that really
does create both, and today it has no fence it can write.

## Why this is worth a card rather than a shrug

The whole point of the reservation is that a card adding one file should
not have to fence the directory around it and lock out every lane that
touches a sibling. A card that adds a whole DIRECTORY is the same problem
one level up, and it is the case the largest planned cards are in:
`T-290` is size L and rewrites the document every other card cites.

It is a genuine ruling and not an obvious extension, which is why
`T-287`'s criteria excluded it: a directory token that reserves nothing
is exactly the typo shape `T-127-s1` paid a lane for, and unlike a file
token there is no extension to tell a directory a card will create from a
directory a card misremembered. Whatever discriminator is chosen has to
be argued, not inherited.

## The shape that would work, and the one that would not

The shape that would NOT work: accepting any untracked directory token
whose parent is tracked. `docs/architecture/decisions` is that shape, and
it is the fixture the DEAD entry body has used since `T-160`. It would
make the dead class unreachable for anything under a real directory.

Two shapes that might: a token the card's own acceptance criteria also
name as a creation target — the preflight already computes that set and
calls it `creation target`, so a directory reserved by the fence AND
named by the criteria is a claim the card makes twice; or an explicit
spelling, so that reserving a tree nothing sits under is a thing a card
says on purpose rather than a thing a typo achieves by accident.

Whichever is chosen, the same discipline `T-287` kept applies: one
derivation, in `newFileReservation`, shared by every reader that judges a
fence, and a body seen red on a board that lacks the arrangement.
