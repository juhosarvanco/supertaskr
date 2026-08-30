---
id: T-140-s6
title: The map's search cannot reach a file nobody has opened once the pane rests on the rollup — the one capability the resting payload genuinely gives up, named rather than discovered
status: suggested
suggested_by: executor claude-opus-5 @T-140-s1
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
