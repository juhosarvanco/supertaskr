---
id: T-116-s1
title: The churn overlay now says "how long ago" in TWO vocabularies at once — relativeTime in the footer, churnAge in the panel, disagreeing at every interval under a minute
status: parked
suggested_by: executor claude-opus-5 @T-116
---

Measured at `f59f57e`, T-116's lane tip, while building the age render
that criterion 1 asked for.

**T-116's criterion 1 says "One spelling of 'how old is this number', not
a second (T-057)" and the card is right — but the pane already had two,
and this card put them side by side in the same overlay.**

`app/src/architecture/MapView.tsx` exports `relativeTime(thenMs, nowMs)`
and T-116 renders the churn footer's age through it, as instructed.
`app/src/architecture/map-visuals.ts` exports `churnAge(lastCommitMs,
nowMs)`, and `app/src/architecture/MapPanel.tsx`'s `map-panel-churn`
paragraph renders `last ${churnAge(...)}`. Both answer "how long ago";
neither calls the other. `churnAge`'s own doc comment says it is the
"Same shape as the header's indexed-at hint, deliberately", which is the
claim, not the code.

**THEY DISAGREE, AND THE DISAGREEMENT IS NOW ON ONE SCREEN.** Two
differences, both derived from the two function bodies rather than
guessed:

| input | `relativeTime` | `churnAge` |
|---|---|---|
| 30 000 ms ago | `just now` | `0m ago` |
| 0 (the unknown sentinel) | `just now` | `unknown` |

Before T-116 that cost nothing, because the footer rendered no age at
all — the whole defect T-116 exists to fix. Now the churn overlay can
show `measured just now` in the footer while the component panel one
click away shows `last 0m ago` about a timestamp of the same age, and a
reader has no way to know the two lines are computed by different
functions.

**THE ZERO CASE IS THE SHARPER HALF**, because the two modules take
OPPOSITE positions on the same sentinel. `churn-source.ts` substitutes
`0` for a `measuredAtMs` it cannot read, and T-116's criterion rules that
`0` renders NOTHING — "a wrong timestamp is worse than none".
`churnAge` renders the word `unknown` for the same sentinel, and
`relativeTime` would render `just now`, which is the wrong-timestamp
answer that criterion forbids. Three modules, three answers, one
sentinel.

**Suggested — options, not a pick:**

- (a) **`churnAge` becomes a caller of `relativeTime`** rather than a
  parallel implementation, keeping only its `<= 0 -> "unknown"` guard,
  which is the part that is genuinely about churn and not about clocks.
  Smallest change; makes the sub-minute vocabulary agree.
- (b) **One function with an explicit unknown arm** —
  `relativeTime(thenMs, nowMs, { unknown })` — so all three sites state
  their zero policy at the call rather than in three bodies. This is the
  option that also lets T-116's "render nothing" and the panel's
  "unknown" be read side by side as two deliberate choices.
- (c) **Leave them and say why in prose.** Recorded for completeness and
  not recommended: the pane already carried that prose (`churnAge`'s
  "same shape … deliberately"), and it was wrong at both intervals above.

**WHY T-116 DID NOT FIX IT.** `map-visuals.ts` and `MapPanel.tsx` are
both inside `[app-map]` and were therefore inside T-116's fence — but
both are in the eight-path set T-033 owns on
`task/T-033-zero-drift-registry`, which was `status: verifying` and then
APPROVED (`c259f87`) while T-116 built, and which merges FIRST. Writing
either would have been a real collision on an approved diff. Filed
rather than fixed for that reason, and the fix is a few lines whenever
`app-map` is next free.

Amnesty triage 2026-08-29 (triage seat): PARKED — the needle is live and the collision is on one screen: relativeTime says "just now" where churnAge says "0m ago", and the two take OPPOSITE positions on the same zero sentinel that T-116's own criterion rules must render nothing. Three modules, three answers, one sentinel — T-057's shape, in the pane whose card exists to have one spelling of "how old is this number". The blocker at filing (T-033 held the eight-path set) is gone: app-map is free. RESURFACES: the next app-map dispatch — arm (a), making churnAge a caller of relativeTime and keeping only its <= 0 -> unknown guard, is a few lines in files that lane holds anyway (T-032, T-059, T-067 and T-115 all carry the slug).
