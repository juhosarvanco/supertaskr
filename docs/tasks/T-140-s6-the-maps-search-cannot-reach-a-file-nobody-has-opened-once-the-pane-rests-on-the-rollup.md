---
id: T-140-s6
title: The map's search cannot reach a file nobody has opened once the pane rests on the rollup — the one capability the resting payload genuinely gives up, named rather than discovered
feature: F-06
milestone: 4
priority: 18
size: M
status: planned
blocked_by: []
touches: [app-map, app-shell, crate-index]
suggested_by: executor claude-opus-5 @T-140-s1
builder:
verifier:
built_by:
verified_by:
review:
---

**The honest residual of `T-140-s1`, disclosed by the lane that created
it.** The card's shape is a trade: the resting payload stops growing with
the file count, and the price is a request when somebody drills in. That
price is right for everything a user OPENS. It is wrong for one thing —
**search**, which is how a user finds what to open in the first place.

## The mechanism

`map-search.ts`'s `searchMap` matches the query against component ids and
names AND against `derived.components[].files` — every indexed path. In
the graph-derived mode those arrays are the whole file list, so ⌘F reaches
any file in the project. In the ROLLUP mode they are empty until that
component has been pulled, and `MapView` pulls a component only when the
user selects or expands it. So at rest, in the shipped app, **file search
finds only the files of components the user has already opened**, and
finds them silently — the result list is simply shorter, with nothing on
screen saying why.

Component search is unaffected: ids, names and layers all ride the
registry, which the docs watcher already delivers and which is flat.

## Why `T-140-s1` did not solve it, and what it refused

Two shapes were available and both are somebody's decision rather than a
lane's:

1. **Pull every component's file list at mount.** That restores search
   exactly and throws the whole card away — the resting payload becomes
   the file list again, one request later. Refused on sight.
2. **Give the channel a SEARCH command** — a query in, matching paths out,
   bounded — so the file index stays Rust-side where it already is and
   only the matches travel. This is the shape that fits: it is the same
   request/answer discipline as `arch_detail`, it is flat in project size
   (the answer is bounded by what a result list can show), and the Rust
   side already holds the mapping (`ArchModel::file_component`). It is a
   THIRD command and a new refusal surface, which is a card of its own —
   this one.

## What this card would do

1. Add the search half of the channel: a bounded query answered with
   matching paths and their owning component ids, with the same
   containment argument `arch_detail` carries (the query is a filter over
   a document the process already holds, never a path it opens) and the
   same clip-and-say-the-total honesty.
2. Make the pane's search say what it searched. **A shorter list with no
   explanation is exactly the defect `T-140` fixed on the other side of
   this pane** — an absence rendered as an answer. Whatever ships, the
   search must be able to say "components only" or "N of M files" rather
   than quietly returning less.
3. Keep the graph-derived path's behaviour byte-identical: in the browser
   bundle and the dev harness there is no channel, `searchMap` reads real
   file lists, and `map-search.test.ts` must not move.

## Fence

`touches: [app-map, app-shell, crate-index]` — the same three
`T-140-s1` held, for the same reason: the answer is computed in the crate,
served over the shell's IPC surface, and rendered by the pane. Adding a
command moves `app/test/crescendo-dom.test.tsx`'s two census bodies and
`app/src-tauri/src/acl_pin.rs`'s remote-denial roster, and moves NO
webview grant (ADR-012 — an app command is not a grant).

## Triage — standing sitting #3, 2026-08-30 (architect seat)

**PROMOTED F-06 p18, size M**, at `@ 51fa31c0964c`. This is the one card
of the `T-140-s1` family that names a capability the SHIPPED app lost
today, so it is promoted rather than parked; it sits below the sitting's
instrument cards because a user can still find a component and open it,
which is the path the pane leads with.

**THE MECHANISM IS RE-DERIVED AT THIS BASE AND IT HOLDS — the card is
right about the cause and wrong about the file.** The search lives in
`app/src/architecture/map-search.ts`; the card's prose puts it under
`app/src/lib/architecture/`, which is `rollup.ts`'s directory. Corrected
here rather than ruled, because a lane opening the named path finds
nothing there. And the reason the arrays are empty at rest is stronger
than "unpulled": the rollup's per-component `files` field is **a number,
not a list** — its own doc says *"A COUNT — the list is the pull's, and
that is the whole point of the shape."* So there is no file list to
search at rest by CONSTRUCTION, not by timing, and no amount of waiting
produces one.

**SIZE RAISED S -> M**, because the card's own three steps are a new IPC
command, a new refusal surface, a pane change and a spoken-honesty
requirement, and the two census bodies plus the ACL roster move with any
added command. `T-140-s1` is the precedent for what that costs.

**SHAPE 1 STAYS REFUSED and the refusal is now cheap to check:** pulling
every component's file list at mount restores search by making the
resting payload the file list again, which is `T-140-s1` undone. Nothing
in this promotion reopens it.

## Acceptance criteria

- THE crate SHALL answer a bounded file-search query with the matching
  paths and their owning component ids, computed from the document the
  process already holds and never by opening a path the query names —
  the same containment argument `arch_detail` carries.
- WHERE the answer is clipped, THE response SHALL carry the total it was
  clipped from, and the pane SHALL say so — the clip-and-say-the-total
  discipline, not a shorter list.
- THE pane's search SHALL state what it searched. WHERE file search is
  unavailable or partial, IT SHALL say which, in words a user can act on
  — **an absence rendered as an answer is the defect `T-140` fixed on
  the other side of this pane**, and a shorter result list with no
  explanation is that same defect.
- THE graph-derived path SHALL behave identically to today: in the
  browser bundle and the dev harness there is no channel, `searchMap`
  reads real file lists, and the pane's own search suite SHALL NOT move.
- THE command SHALL be argument-narrow — ADR-012's "narrowness lives in
  the command's own signature" — and SHALL refuse a query it cannot
  bound rather than answering it.
- THE IPC census SHALL be corrected at BOTH ends and never widened, and
  the webview grant roster SHALL be a 0-file diff: an app command is not
  a grant.
- Verification: headless — crate tests for the search answer and its
  refusals, one app-side DOM test for the spoken state, and the
  graph-derived path proven unmoved.

**PREFLIGHT AT PROMOTION.** `node scripts/brief.mjs --task T-140-s6
--preflight`, run from the e2e package at `@ 51fa31c0964c`: **exit 0**,
the card ruled `startable` — all three slugs held by no lane at this
base.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
