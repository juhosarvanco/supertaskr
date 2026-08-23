---
id: T-013-s1
title: A git subprocess cannot be fenced to app-map — every route to churn's data crosses app-shell, and T-012 already knew it
status: suggested
suggested_by: executor claude-opus-5 @T-013
---

T-013's card was dispatched with `touches: [app-map]`. Its third
criterion requires churn to derive from **shelling out to git**. Nothing
under `app-map` can do that, and the fence has no route that avoids
`app-shell`.

**THE SLUG MAPPING IS WHAT DECIDES IT, not a judgement call.**
`docs/ARCHITECTURE.md` maps `app-map` to **C-12**, whose declared
`paths` are exactly `app/src/architecture/**` and
`app/src/lib/architecture/**`. A subprocess needs a Tauri command;
registering one edits `app/src-tauri/src/lib.rs`, which is **C-05's**
declared path, whose slug is `app-shell`. The webview cannot spawn
anything — the app ships no `@types/node` on purpose (ADR-017, T-073) —
so there is no in-fence alternative.

**BOTH ROUTES WERE COSTED, and the cheaper one was taken.**

| route | app-shell files it needs | why not |
|---|---|---|
| ride `index_repo` (extend `IndexOutcome`) | `app/src/lib/watcher-store.ts` (C-10, `app-shell`) for the TS mirror | churn would be unavailable until the user pressed Re-index, and selecting an overlay would then have to rewrite a committed file |
| a new zero-argument command | `app/src-tauri/src/lib.rs` (C-05) — three lines | taken |

The new-command route is also the SMALLER collision: `watcher-store.ts`
is a file the live `T-064` lane is editing right now, and `lib.rs` is
not. The map pane owns its own `churn-source.ts` invoke for the same
reason C-13 owns `interview-source.ts`, which is what keeps the store
out of it.

**THE PRECEDENT IS THIS CARD'S OWN PARENT.** `T-012` — the card T-013 is
`blocked_by` — added exactly one Tauri command (`index_repo`) and
declared `touches: [app-map, app-shell]` for it. T-013 was decomposed
from the same plan, with the same need, and got one slug.

**WHAT THE EXECUTOR DID, and why it is not the whole answer.** The card's
`touches` is widened to `[app-map, app-shell]` in this branch, because a
`touches` line that omits a tree the diff opens is a lie the board and
the map's own status rollup both consume. But the widening breaks the
DISPATCH's premise: T-013 was dispatched as disjoint from `T-064`
(`[app-shell]`), and it is not. Measured at the time of writing, the
overlap is a SLUG overlap and not a FILE overlap — `git diff
--name-only` over both branches shares zero paths, T-064 touching
`docs_watch.rs` / `App.tsx` / `watcher-store.ts` and this lane touching
`lib.rs` — so the merge is clean today by luck rather than by fence.

**THE ASK IS FOR THE PLANNER, not for a future executor.** Either (a)
`touches` for a card that must reach a native surface is written at
decomposition time, with the F-06 remainder (`T-015`, `T-032`) re-read
for the same defect; or (b) `app-shell` is split so that "registering a
command" is not the same fence as "the watcher and the front door",
which is the finer-grained `component:` field the map plan's §0.0 item 4
already reserves for exactly this.
