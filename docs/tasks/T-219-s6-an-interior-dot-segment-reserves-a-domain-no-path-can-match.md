---
id: T-219-s6
title: An INTERIOR dot segment reserves a domain nothing can match, and the refusal T-219-s4 built deliberately stops at the FIRST segment — the same silence, one position over
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: executor claude-opus-5@subagent @T-219-s4
blocked_by: []
touches: [lib-parser]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-219-s4`** (which absorbed `T-219-s2`), and this is
its DECLARED CEILING rather than a gap it missed. That card refused the
token whose FIRST SEGMENT is `.` or `..` — the repository root under its
other spelling, and the domains that climb out of the repository — and
said in the code, at the site, that an INTERIOR dot segment is left for
this card.

## The residual, in one line

`normalizeFenceToken` collapses repeated separators, strips leading
`./` runs and a trailing star run. It does not resolve a dot segment
anywhere else. So:

    touches: [lib/./parser]   -> normalised `lib/./parser`
    touches: [lib/x/../parser] -> normalised `lib/x/../parser`

Both carry a `/`, so `expandFence` classifies them `path` and reserves
the domain verbatim. `sharedDomain` compares normalised
repository-relative domains, none of which contains a `.` segment, so
neither domain can ever meet one: the fence permits nothing, collides
with nothing, and raises no issue — which is precisely the sentence
`T-219-s2` was filed about, one position over in the string.

## Why it was NOT folded into `T-219-s4`

- **The remedy differs, and that is the whole argument.** `.` and `..`
  at the head of a token name a domain that is not repository-relative
  at all, so REFUSING is the honest answer. `lib/./parser` names a real
  directory spelled badly, so the honest answer is to NORMALISE it —
  `lib/./parser` and `lib/parser` are one path, exactly as `tools/e2e/`
  and `tools/e2e` are one path and `normalizeFenceToken` already says
  so. Refusing it would refuse a fence that reserves real ground.
- Changing `normalizeFenceToken` moves a function whose ceiling is
  DECLARED and whose spellings are pinned by bodies in two suites; that
  is a dispatch, not a rider on a guard.

## Measured at `24bfec8e10b3`

Over the live board, oracle-less and with the dispatch oracle alike:
**0 live `touches:` tokens carry an interior dot segment**, and
`lib/parser/test/fence.test.ts`'s `T-219-s2` census body already
asserts that zero with its own planted control beside it — so this card
reds the day one is written and costs nothing until then. Derive the
figure again; never quote this one.

## What to build

- `normalizeFenceToken` SHALL resolve a `.` segment (drop it) and a
  `..` segment (drop it with the segment before it), leaving the
  declared ceiling only where resolution would climb ABOVE the
  repository root — which `T-219-s4`'s `DOT_DOMAIN` refusal then
  catches, unchanged.
- The existing bodies for the trailing-slash and glob spellings are the
  shape to extend; the ceiling paragraph in that function's doc SHALL
  move rather than be deleted.
- The census body named above SHALL keep its zero and gain the
  positive control that the new normalisation is what makes it zero —
  a planted `lib/./parser` resolving to `lib/parser`.
- Verification: headless.

## Read beside

`T-219-s4` (its `DOT_DOMAIN` branch and the ceiling paragraph beside
it), `T-219-s2` as absorbed there, `normalizeFenceToken`'s own declared
ceiling.
