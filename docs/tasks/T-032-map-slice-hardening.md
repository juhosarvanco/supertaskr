---
id: T-032
title: Map-slice hardening — resolver guard, derivation blemishes, loop third leg, key hygiene
feature: F-06
milestone: 4
priority: 16
size: M
status: planned
blocked_by: []
touches: [crate-index, app-map, app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-116-s1 (2026-09-13, pile 2 batch 2, the owner's approval of 2026-09-13). The sibling's file is removed in the same commit as this line; its obligation sits below tagged with its source, and its full text is kept under the absorbed heading.

Absorbs: T-009-s2, T-011-s4 (the glob.ts header half; the parse-time
warning lives in T-030), T-011-s5, T-011-s6, T-012-s2, T-012-s3,
T-012-s4, T-024-s6 (the map-badge half; the parser half lives in
T-030 and the board half in T-031). Triage 2026-08-16: seven verifier/executor-probed edges of
the milestone-2 pipeline (indexer → graph → derivation → layout →
emit loop), none a defect today, each a truthfulness or determinism
wart worth pinning while the context is fresh. app-shell touch is
index_cmd.rs + docs_watch.rs only — serialize with the shell-lane
queue at dispatch; crate-index touch serializes with T-010/T-014.

Also absorbs: T-034-s2, T-034-s7 (triage 2026-08-17). Their suggestion
files are removed in the same commit as this line. **T-034-s7 is an
AMENDMENT TO THIS CARD'S OWN layoutKey CRITERION, applied below rather
than added as a new one** — the criterion read as an instruction to
type a control byte, which is exactly how the byte got into
`map-layout.ts` the first time, and it was amended BEFORE this card
was dispatched precisely so a builder could not follow it into the
same trap.

## Acceptance criteria
- THE resolver SHALL treat any `<ascii-scheme>:` specifier except
  `node:` as unresolved(unsupported) — no more deterministic-but-junk
  package nodes for `file:`/`blob:`/`npm:`/`jsr:` — one guard in
  is_unsupported (or a package_ref reject) plus a unit row; the
  closed reason taxonomy unchanged (T-009-s2).
- THE derivation SHALL dedupe component records by id at derive entry
  (first wins, §4.1's spirit) so finding ids stay unique under
  duplicate-id input; declared self-edges (C-01 → C-01) SHALL be
  dropped rather than drawn as planned self-loops; the
  invisible-`file:`-dep-package invariant SHALL be pinned by test or
  recorded in derive.ts's header as a decision (T-011-s5).
- THE app suite SHALL gain a tripwire test walking app/src/** and
  asserting no import specifier matches /^node:/ and none of the five
  names node-builtins.d.ts declares — webview purity as a pinned
  test, not a convention (T-011-s6).
- THE loop-termination story SHALL gain its third leg: after the
  proven silent window, a real source change plus re-index produces
  EXACTLY one more emit whose graph.json content carries the change,
  then provable silence again — appended to
  reindex_emits_once_then_never_again or a sibling in index_cmd.rs
  (the T-012 verifier's reverted live probe, ~35 lines) (T-012-s2).
- THE IndexOutcome payload SHALL carry the collector's cap
  (`capBytes`) from the Rust constant, and MapView SHALL compare
  graph_bytes against it — the duplicated COLLECTOR_CAP_BYTES
  constant dies; the header hint cannot drift from the Rust truth
  (T-012-s3 option a).
- THE layoutKey SHALL join its component and edge lists with an
  unused divider (codepoint U+0003), **written in source as its
  six-character escape and NEVER as a literal control byte**, and
  deriveArchitecture SHALL strip/escape C0 control characters when
  deriving inferred pseudo-component ids; a unit probe SHALL pin
  layoutKey inequality for a crafted near-collision pair (T-012-s4,
  amended per T-034-s7).
  **Why the source form is a criterion and not a style note**: the
  escape and the literal denote the same string, so nothing goes red
  either way — but a literal makes `file(1)` classify the source as
  `data` and makes binary-skipping searchers (ripgrep and ugrep with
  `-I`, which is the mode every agent searches this tree in) miss the
  file entirely. T-012 shipped exactly that byte in this very
  function and it sat on main until T-034 removed it; the same trap
  bit three more times inside T-034 alone, each time compiling and
  testing green. The standing C0 check over `app/src/architecture/**`
  would catch a re-planted literal in `map-layout.ts` today — this
  clause is belt-and-braces for work landing outside that directory,
  and it becomes redundant if **T-058** (the check lifted into
  `lint:tokens`, whole-tree) lands first. Build any control character
  this task needs from a character code rather than typing it.
- THE map panel's task-row model chip SHALL be bounded: `modelWord`'s
  chip (app/src/architecture/MapPanel.tsx:426) is `shrink-0` with no
  max-width, so a long stamp pushes the row. It is the deliberate
  local twin of the board's ModelBadge and SHALL be bounded and
  pinned the same way T-031 bounds its sibling (T-024-s6).
- A BLOCKED CARD SHALL NEVER POINT AT NOTHING ON SCREEN. The tasks
  lens draws the board's population (everything except `suggested`
  and `parked`), so a task blocked by a PARKED or otherwise undrawn
  task renders as the dashed terracotta blocked ghost with **no edge
  and no node anywhere on the canvas** — the card says "blocked" and
  the picture says "by nothing". Exercised by T-034's own DOM
  fixture. Take option 1: the label becomes "blocked by T-0NN
  (parked)" when every unmet blocker is undrawn — one string, no
  layout change, and the panel already carries the full `blocked_by`
  list. The same shape covers a DANGLING blocker, which the parser at
  least flags as a `dangling-reference` issue; a parked blocker is
  not an issue at all, so nothing names it. On this repo the hole was
  EMPTY when filed — **and the 2026-08-17 triage added thirteen cards
  with real `blocked_by` edges, so re-derive rather than assuming it
  still is** (T-034-s2).
- THE glob.ts header SHALL name its two deliberate gitignore
  deviations (pure last-match-wins vs git's no-re-include-below-
  excluded-parent; single-segment leading-slash stripping ⇒
  unanchored) and the `a//b` empty-segment collapse — spec, not
  latent surprise (T-011-s4).
- WHEN the pane says how long ago THERE SHALL be ONE pure time formatter with each site stating its zero-sentinel policy at the call (the churn footer renders nothing for 0 as T-116 ruled; the panel says unknown); because MapView.tsx already imports map-visuals.ts, the shared formatter SHALL live in a pure location inside the fence that both can import without a cycle (moving `relativeTime` out of MapView.tsx is permitted; a reverse import is not), pinned by a body driving both call sites at 30 000 ms and at 0 with a control that reds on the two answers the tree gives today; the parent's own feature work stays intact. (absorbed from T-116-s1)

## Absorbed from T-116-s1 — The churn overlay now says "how long ago" in TWO vocabularies at once — relativeTime in the footer, churnAge in the panel, disagreeing at every interval under a minute (kept whole)

Title as filed: "The churn overlay now says "how long ago" in TWO vocabularies at once — relativeTime in the footer, churnAge in the panel, disagreeing at every interval under a minute"

Filed as: status parked, priority None, size None, touches None, wake None, suggested_by executor claude-opus-5 @T-116.

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

## Implementation notes

## Verdicts
