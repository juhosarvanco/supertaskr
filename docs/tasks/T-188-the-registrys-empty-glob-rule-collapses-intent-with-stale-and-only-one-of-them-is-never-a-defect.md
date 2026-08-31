---
id: T-188
title: The registry's empty-glob rule collapses INTENT with STALE and only one of them is "never a defect" — a glob that once matched and no longer does is a lie the census cannot see, measured at nine merges
feature: F-06
milestone: 4
priority: 4
size: S
status: planned
blocked_by: []
touches: [app-board, docs/architecture/components]
suggested_by: "architect/integrator seat, 2026-08-31 — found by checking whether an existing ruling covered a suspected gap; it covered half of it"
builder:
review:
---

**THE EXISTING RULING IS CORRECT AND IS NOT BEING RE-LITIGATED.**
`T-088`'s criterion, pinned by name at
`app/test/architecture-dogfood.test.ts:1152`, says a component whose
declared paths match no file on disk is **INTENT, not a defect** — *"the
intent layer exists to carry components that are not built yet; C-07 has
done so since T-009."* That is right, and this card keeps it.

**It answers one of two cases, and the rule's wording — "never a
defect" — is what closes the door on the other.**

## The two cases, and only one is intent

- **INTENT**: a glob for a component **not yet built**. Forward-looking,
  legitimate, and the reason the intent layer exists. `C-07` has been
  this since `T-009`.
- **STALE**: a glob that **once matched and no longer does**. Backward-
  looking, and a false claim about what a component owns.

Both present identically to the census — zero files — and the rule
currently blesses both.

## The stale case is not hypothetical; this repository measured it

The evidence sits in the same file, at
`app/test/architecture-dogfood.test.ts:1174`:

> `T-126` deleted the shim at `0fa83da`; the glob **outlived the file by
> nine merges**, matching nothing while claiming a path that no longer
> existed. Removing it is the cleanup **@human ordered** when the triage
> surfaced it, and it moves **NO file count** — a glob matching nothing
> contributes nothing, **which is exactly why nine merges did not notice.**

So: nine merges of blindness, ended by a human eye at a triage rather
than by an instrument, and the closing clause states the mechanism
outright.

## Why the census cannot see it, in this project's own words

`T-142` names the shape exactly — *"a census that names a field the data
does not have returns zero, and zero is indistinguishable from a clean
result."* This is that finding arriving at the component registry. A
stale glob subtracts nothing from `fileComponent.size`, adds no row to
the per-component tally, leaves `derived.issues` and `unmappedFiles`
empty and holds `mode` at `"full"`. **Every instrument reports health.**

## The two cases ARE mechanically distinguishable, which is what makes this cheap

A stale glob has a property an intent glob does not: **it used to
match.** That is a question git can answer — whether any commit reachable
from `HEAD` contains a path the glob matches. An intent glob for an
unbuilt component has never matched anything and never will until its
component is built.

The check is therefore not "is this glob empty" (already ruled, correctly,
as not-a-defect) but **"was this glob ever non-empty"**, and only the
second is evidence of a lie.

## Precedent for the shape of the fix

This repository already builds non-vacuity guards deliberately —
`tools/e2e/tests/brief.spec.ts:475` (*"and the detector is not vacuous"*),
its uniqueness floor at line 833, and `docs/CAPABILITIES.md`'s *"every
workflow file is enumerated — the glob is not vacuous."* The idiom exists;
it has simply never been pointed at the registry.

## What a fix decides

1. **Where the check lives.** The dogfood census is the natural home and
   is also the file that would have to carry a git call, which it does
   not do today. A `tools/e2e` script that the census consumes is the
   alternative. **Decide on whether the census may read history at all** —
   that is the real question and it is an architecture one.
2. **What a stale glob DOES.** Red is defensible; so is a reported
   finding in the existing `issues` channel. **Red risks punishing a
   legitimate rename mid-lane**, so a finding is likelier right — but
   argue it, do not assume it.
3. **How far back to look.** "Ever matched" over all history is one
   answer and is expensive; "matched at the merge-base" is cheaper and
   catches the nine-merge case. Say which and why.

## Acceptance criteria

- THE distinction between an INTENT glob and a STALE glob SHALL be
  derived from evidence, never from a hand-maintained allowlist of which
  components are "not built yet".
- `T-088`'s ruling SHALL be preserved in terms: an empty glob for an
  unbuilt component SHALL NOT be reported.
- A body SHALL construct BOTH cases — a glob that never matched and a
  glob whose file was deleted — and prove the instrument separates them.
  **A body that reports both, or neither, is vacuous and is the exact
  failure this card is about.**
- THE C-15 shim instance SHALL be used as the historical fixture if it is
  reachable, because a check that cannot catch the one measured instance
  is not worth landing.
- Verification: headless.

## Read beside

`T-088` (the ruling this card preserves), `T-142` (a census returning
zero is indistinguishable from a clean result — the same shape), and
`T-167-s8` (a rule a careful hand breaks is a trigger's job; here the
careful hand was @human's, at a triage, nine merges late).

## THE HISTORICAL FIXTURE IS REACHABLE — verified, so the card's conditional is now definite

The criterion above says the C-15 shim instance shall be the fixture *"if
it is reachable"*. **It is**, checked at this seat rather than left for
the lane to discover:

- `0fa83da` is a reachable commit object.
- Its diff deletes `app/src-tauri/tests/dispatch_lanes.rs` — **36 lines**.
- `git cat-file -e 0fa83da^:app/src-tauri/tests/dispatch_lanes.rs`
  succeeds, so the file's content is intact at the parent.

So the one measured instance of a stale glob can be reconstructed exactly:
the declared glob at the time, the file it matched, the commit that
removed the file, and the nine merges over which the census stayed
silent. **A check that cannot red against this fixture is not worth
landing**, and the lane can now hold itself to that without first
investigating whether it can.

**The `if` is struck: the fixture SHALL be used.**
