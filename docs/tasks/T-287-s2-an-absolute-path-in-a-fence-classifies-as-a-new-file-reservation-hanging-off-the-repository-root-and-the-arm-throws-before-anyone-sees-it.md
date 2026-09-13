---
id: T-287-s2
title: "An ABSOLUTE path in a fence classifies as a NEW-FILE RESERVATION hanging off the repository root, and the preflight throws on the same token one arm earlier — two halves of one defect, and fixing either alone makes the other live"
feature: F-04
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "verifier claude-opus-5@subagent @T-287 (phase 2), measured at 6ff8201107ac57e42db94d974512febc6abeed00 and at the base 8cd11020e631f195952b4921c045a622b3df7809, 2026-09-09"
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`T-287` gave an untracked fence token a second reading: a NEW-FILE
RESERVATION, when its leaf carries an extension and its parent directory
is tracked. The parent test is written to be skipped for one legitimate
case — a file at the repository ROOT, which has no parent segment and
whose ancestor exists by construction — and the sentinel for that case is
the empty string:

    const cut = domain.lastIndexOf("/");
    const parent = cut === -1 ? "" : domain.slice(0, cut);
    …
    if (parent !== "" && !oracle.dirs.has(parent)) { …dead… }

An ABSOLUTE path at the filesystem root reaches the same sentinel by a
different route. `"/evil.ts"` has its only slash at index 0, so
`domain.slice(0, 0)` is `""` — not because there is no parent, but
because the parent IS the filesystem root. The parent check is skipped and
the answer is:

    newFileReservation("/evil.ts", oracle) -> { reserved: true, parent: "" }

rendered as `NEW-FILE RESERVATION: /evil.ts — absent at HEAD and hanging
off the repository root, which is tracked`, which is not true of it.
`T-287`'s own second criterion says a token whose nearest ancestor is
untracked stays DEAD, and the filesystem root is not a tracked ancestor of
this repository.

`fence.ts` does not save it. `normalizeFenceToken` splits on `/` and
rejoins, so a leading empty segment survives; `DOT_DOMAIN` catches `..`
and `.` but not a leading slash; and `looksLikePath` accepts the token
because it carries a slash. Longer absolute paths are saved only by
accident — the one below is dead because its parent is not a tracked
directory HERE, which is a fact about this checkout rather than a rule:

    /etc/passwd.txt

## Why it is filed rather than corrected, and why it still needs a card

**It is currently unreachable through the arm.** A card whose fence names
an absolute path never gets as far as the fence loop: `ignoredTokens`
shells out to `git check-ignore`, which exits 128 on a path outside the
repository, and the preflight THROWS.

    ignoredTokens(root, ["/evil.ts"])       -> throws, status 128
    ignoredTokens(root, ["lib/../../x.ts"])  -> throws, status 128
      Error: card-preflight: git check-ignore answered 128 in <root> …

Measured at the tip AND at `T-287`'s base, on code `T-287` does not touch.
So no card can be dispatched on an absolute path today, no manifest can
carry one, and nothing the write hook permits is widened by the
misclassification.

**THE THROW IS WIDER THAN THE MISCLASSIFICATION, AND THAT IS THE HALF
WORTH FIXING FIRST.** `git check-ignore --stdin` answers 128 on any token
it reads as outside the repository, which is TWO classes: an absolute
path, and one that CLIMBS. So a card whose prose merely MENTIONS a
climbing token — this file's own subject matter — takes the whole
preflight down with it, and the verdict that filed this card met exactly
that: its security-sweep paragraph named the climbing tokens `fence.ts`
refuses, and the arm answered 3 until they were written indented. That is
the trap in its purest form: **the class is unreachable as a FENCE and
fully reachable as PROSE**, and the second reading is the one a card
cannot avoid when the card is about the first.

**That is exactly what makes it a card and not a shrug.** The two halves
protect each other, and each is independently worth fixing:

- fix the throw — so a malformed token becomes a FINDING rather than a
  crash that stops the arm with a misleading reason — and the
  misclassification becomes live;
- fix the classification alone, and a card fencing an absolute path still
  dies with a git 128 and a sentence about build artefacts.

A preflight that throws on a card's fence bricks the arm's step 3 for that
card, and the message a seat reads blames the ignore arm for a problem in
the token. Both belong in one lane.

## The shape that would work

Give the repository root its own answer rather than sharing the empty
string with "no parent I could compute". The two states are different
questions and one value is answering both — which is the shape `T-219`
refused for the root's two spellings one module over, and the same
argument applies. A token that is not repository-relative is not a domain
this board can name, and `fence.ts` already has the sentence for that
class; the cheapest honest fix may be upstream, refusing an absolute path
where `DOT_DOMAIN` refuses a climbing one, so that `newFileReservation`
never has to hold an opinion about paths outside the tree.

Whichever end it is fixed at, both halves need a body, and the classifier
body should assert the ROOT case still reserves — that is the case the
sentinel exists for and it must not be lost to the fix.

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 2 — an absolute fence token classifies as a reservation off the root and the arm throws on it one arm earlier; each half hides the other. Not dispatched by this sitting.
