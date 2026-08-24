---
id: T-015-s2
title: layout.json's write needs a Rust command, and it would be the first Tauri command in this app to take a webview-supplied argument
status: suggested
suggested_by: executor claude-opus-5 @T-015
---

T-015's first criterion — *"WHEN a node is dragged THE position SHALL
persist to docs/architecture/layout.json (debounced single-file write —
the map's only write path, per ADR-014)"* — cannot be built inside
`[app-map]`. This is the mechanism it needs, and the decision it forces.

## Why there is no in-fence route, measured rather than argued

1. **The webview cannot write.** Measured at `d46f71f`: a module under
   `app/src/architecture/` importing `writeFileSync` from `node:fs`
   fails `npm run build` at **exit 2** with
   `error TS2724: '"node:fs"' has no exported member named
   'writeFileSync'` — T-073's guard, ADR-017's free half. The POSITIVE
   CONTROL matters and was run: the same probe importing `readFileSync`
   builds at **exit 0**, so the refusal is specific to the write surface
   rather than to `node:fs` being absent.
2. **No existing command writes into the project.** Fourteen
   `#[tauri::command]`, fourteen in `generate_handler!`. Every
   production `fs::write` outside `#[cfg(test)]` targets `.nputer/`
   (`agent/kit.rs`'s `write_atomic`, `agent/sessions.rs`'s transcript
   append) — ARCHITECTURE's pure-lens rule holding exactly as written.
3. **`index_repo` is not a reusable route.** It does write under
   `docs/architecture/`, through `index_cmd.rs` ->
   `nputer_index::write_graph`, but ADR-014 reserves `graph.json` to the
   indexer (*"written only by the indexer"*) and the crate is C-07 =
   `crate-index`.
4. **A webview `fs` grant is refused by decision, not merely by fence.**
   ADR-012 keeps the grant set empty; `acl_pin.rs` fails with a
   `+`/`-` diff if the 92-grant `core:default` set moves.

So: a new Rust command, registered in `app/src-tauri/src/lib.rs`
(C-05 = `app-shell`).

## The good news: the read half and the delivery half already exist

Nothing needs building for `layout.json` to REACH the app.

- `is_collected_docs_path` (`app/src-tauri/src/docs_watch.rs`) already
  admits `.json` under `docs/architecture/`, subdirectories included —
  pinned by
  `is_collected_docs_path_accepts_md_anywhere_and_json_only_under_architecture`,
  whose comment says *"T-015's layout.json rides free later"*.
- `applySnapshot` (`app/src/lib/docs-model.ts`) puts every delivered path
  that is neither `GRAPH_FILE` nor an `isModelInput` straight into
  **`DocsModelState.effective`**, keyed by path. `layout.json` lands
  there today.

**And `App.tsx` does not have to be touched at all.**
`app/src/architecture/churn-source.ts` is the in-fence precedent: the map
owns a data source that calls `invoke("repo_churn")` itself and publishes
through `useSyncExternalStore`, with no prop threading. A
`layout-source.ts` twin sits entirely inside C-12. **The out-of-fence
residue is therefore ONE Rust file plus ONE `generate_handler!` line.**

## The decision this forces, which should not be made by reflex

Every one of the fourteen commands is **ZERO-ARGUMENT** by design.
ARCHITECTURE states it as a property, twice, and ADR-012's phrasing is
*"narrowness lives in the command's own signature"* — no path, no
session id and no flag crosses the boundary in either direction; the
project root comes from `WatchState`.

**A pin write cannot be zero-argument**: the positions originate in the
webview. `write_layout(pins)` would be the first command in this app to
accept webview-supplied data, which is an architectural first and
deserves a recorded ruling rather than a quiet precedent. Options, in the
order they seem worth arguing:

1. **Accept a narrow, validated payload.** The argument is a map of
   component id -> `{x, y}`. Rust validates: ids match `C-\d{2,}`, the
   count is capped, coordinates are finite and clamped to a sane range,
   and — the strong form — every id must exist in the committed registry,
   which Rust can already read (`registry.rs` in `nputer-index`, the
   reader T-014 built for `arch`). **The path is still never supplied by
   the webview**: it is derived as `<project_dir>/docs/architecture/
   layout.json` from `WatchState`, exactly as `index_cmd.rs` derives the
   graph path. That keeps ADR-012's actual guarantee (the webview cannot
   name a target) while relaxing only the zero-argument habit.
2. **Keep it zero-argument via an event.** The webview emits a
   `layout-changed` event and Rust reads the payload off the event.
   This is cosmetic — the data still crosses — and `startup-failed`
   (T-063) is the precedent for an outbound event, not an inbound one.
   Recorded because it will be proposed; it should probably be refused.

Whichever is chosen, the write itself should reuse `agent/kit.rs`'s
`write_atomic` — temp file plus rename, symlink at the destination
REPLACED rather than written through, which its own comment already
calls *"the T-012 `write_graph` discipline"*. Do not write a third
atomic-write implementation.

## The deletion half, which is a criterion and is easy to miss

*"an empty layout.json SHALL be deleted rather than committed"* is part
of the same command, not a separate chore: when the pin set empties, the
command must `remove_file` rather than write `{}`. ADR-014's own wording
— layout pins are *"absent by default"* — makes absence the resting
state, so a committed `{}` would be a lie about whether anyone has ever
pinned anything. The deletion must survive the same containment rules as
the write (canonicalize first, refuse anything outside the project dir).

## Debounce

The card says *"debounced single-file write"*. That belongs on the
FRONTEND side, in the map's own source module, where the drag stream is
— not in Rust, which should stay a dumb, validating, atomic writer.
`churn-source.ts`'s in-flight guard is the shape to copy.
