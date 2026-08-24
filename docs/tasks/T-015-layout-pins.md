---
id: T-015
title: Layout pins (drag → layout.json)
feature: F-06
milestone: 4
priority: 8
size: S
status: building
blocked_by: [T-012]
touches: [app-map]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

## Acceptance criteria
- WHEN a node is dragged THE position SHALL persist to
  docs/architecture/layout.json (debounced single-file write — the
  map's only write path, per ADR-014) and survive re-index and app
  restart; unpinned nodes SHALL auto-lay-out around pins (layout
  rule 5: slot assignment skips pinned nodes; the computed slot
  stays ghosted).
- IF layout.json is malformed THEN THE map SHALL ignore it, surface
  the existing parse-error chip, and fall back to auto layout — no
  crash, no partial pinning.
- Pinned nodes SHALL show the faint pin hint from the design spec;
  un-pinning (affordance per design) SHALL remove the entry, and an
  empty layout.json SHALL be deleted rather than committed.

## Implementation notes

### NOTHING WAS BUILT, AND THE REASON IS MEASURED RATHER THAN ASSERTED

Executor `claude-opus-5 @T-015`, lane `task/T-015-layout-pins`, base
`d46f71f`, dispatched `touches: [app-map]` with three sibling lanes live
from the same base — T-123 `[app-shell, app-agent]`, T-110
`[app-dispatch]`, T-010 `[crate-index, docs/architecture/components/]`.

**All three acceptance criteria need an edit outside `[app-map]`, and so
does every test that could hold them.** `[app-map]` resolves — through
each component file's `touch_slugs:`, which ARCHITECTURE names as the
authority over its own signpost prose — to **C-12 only**, whose `paths:`
are exactly `app/src/architecture/**` and `app/src/lib/architecture/**`.
The buildable set inside that fence is EMPTY, so this lane routes and
builds nothing. `docs/architecture/layout.json` was never created, in
this worktree or anywhere else.

### THE WRITE PATH — the fence question the brief asked, answered three ways

ADR-014 sanctions `layout.json` as *"the map's only app-written file"*.
It does not say through which mechanism, and the repository leaves
exactly one:

1. **The webview cannot write, and this is enforced by the type system**
   — T-073's guard, still live, MEASURED at `d46f71f` in this worktree
   rather than cited. A four-line module under `app/src/architecture/`
   importing `writeFileSync` from `node:fs` fails `npm run build` at
   **exit 2**, `src/architecture/__fence_probe.ts(1,10): error TS2724:
   '"node:fs"' has no exported member named 'writeFileSync'`.
   **WITH ITS POSITIVE CONTROL, because "the write is refused" is
   satisfied equally by a tree where `node:fs` is absent entirely**: the
   same probe importing `readFileSync` builds at **exit 0** with zero
   `error TS` lines. The refusal is specific to the WRITE surface.
   Probe removed; `git status --porcelain` empty, tracked diff empty,
   `npm run build` back to **0**.
2. **No existing Tauri command writes into the project.** The census is
   **14** line-anchored `#[tauri::command]`, name-for-name the 14 in
   `generate_handler!`. Every production `fs::write` / `OpenOptions` in
   `app/src-tauri/src/` outside `#[cfg(test)]` is `agent/kit.rs`'s
   `write_atomic` and `agent/sessions.rs`'s transcript append — both
   `.nputer/` runtime files, which is ARCHITECTURE's pure-lens rule
   holding exactly as written. `bin/fake_agent.rs` is a test binary.
   The one command that DOES write under `docs/architecture/` is
   `index_repo` -> `index_cmd.rs` -> `nputer_index::write_graph`, and
   that is the INDEXER's write path, owned by C-07 (`crate-index`, held
   by T-010 tonight) and reserved to it by ADR-014's own wording.
3. **So the write needs a new Rust command**, whose registration line is
   in `app/src-tauri/src/lib.rs` = C-05 = `app-shell` — **held by T-123
   tonight**. `method/lane-protocol.md` rule 5 and `roles/executor.md`
   both forbid widening from inside the lane; the brief forbids it by
   name. NOT BUILT. Routed as **`T-015-s2`**, which carries the command's
   shape and the ADR-012 question it opens.

### THE READ PATH IS ALREADY BUILT, AND THAT IS THE CHEAPEST FINDING HERE

Nobody has to write a byte of delivery code. `is_collected_docs_path`
(`app/src-tauri/src/docs_watch.rs`) already returns true for `.json`
under `docs/architecture/`, subdirectories included — pinned by
`is_collected_docs_path_accepts_md_anywhere_and_json_only_under_architecture`,
whose own comment says *"T-015's layout.json rides free later"*. And
`applySnapshot` (`app/src/lib/docs-model.ts`) routes every delivered
path that is neither `GRAPH_FILE` nor an `isModelInput` into
**`DocsModelState.effective`** verbatim. So `layout.json`'s bytes reach
the frontend today, keyed by path, with no last-good fallback and no new
IPC — which is the right shape for a file ADR-014 says is regenerated
rather than repaired.

**And the map does not need `App.tsx` to reach it.**
`app/src/architecture/churn-source.ts` is the in-fence precedent: a
map-owned data source that calls `invoke("repo_churn")` itself and
publishes through `useSyncExternalStore`, never through a prop. A
`layout-source.ts` twin is entirely inside C-12. **The out-of-fence
residue is therefore SMALLER than the brief forecast — one Rust command
plus one `generate_handler!` line, and no `App.tsx` edit at all.**

### THE BLOCKER THE BRIEF DID NOT FORECAST: `[app-map]` CANNOT ADD A TEST

This is the finding that makes the lane unbuildable rather than merely
partial, and it is structural rather than incidental.

| collector | include | component | slug |
|---|---|---|---|
| `app/vitest.config.ts` | `test/**/*.test.{ts,tsx}` | C-05 (`app/test/**`, and the config itself) | `app-shell` |
| `tools/e2e/playwright.config.ts` | `testDir: "./tests"` | none — path-fenced `tools/e2e` | not `app-map` |
| lib/parser | its own package | C-06 | `lib-parser` |
| cargo | Rust only | C-05 / C-07 | `app-shell` / `crate-index` |

There is no fourth. `find` over the tree returns exactly these configs.
So **every test this repository can run lives outside `[app-map]`**, and
a card fenced `[app-map]` can add none — which is why T-012 declared
`[app-map, app-shell]` and named `app/test/**` in its own expected diff
surface, and why T-013 widened to the same pair and had its widening
ruled RIGHT. **`touches: [app-map]` on this card is a dispatch defect,
not a tight scope**, and it is routed as **`T-015-s1`** with the fence
the card actually needs.

The consequence for tonight is not a judgement call. The in-fence half
that *could* be typed — a `layout-file.ts` contract, rule 5's pin skip
and ghost slot in `map-layout.ts`, a `layout-source.ts`, the drag
handlers — would be code no suite collects, no drill can red, and no
criterion reaches, wired to a write that rejects at runtime. **A drag
that pins in-session and forgets on reload does not partially satisfy
criterion 1; it contradicts it in front of the user.** Shipping it under
a `touches:` line the diff already strains is the failure T-013's ruling
warns about from the other side.

### WHAT ELSE WAS MEASURED, FOR THE LANE THAT DOES BUILD THIS

- **Rule 5 has no seam yet, and `map-layout.ts`'s own header overstates
  what is there.** The header says *"the seam is the `pinned` input set
  that nothing populates yet"*; `layoutMap(components, edges, expanded)`
  takes no such parameter and `LayoutComponentInput` is `{id, kind}`.
  `assignRows`' comment is the accurate one (*"Rule 5's pin skip WOULD
  filter pinned ids out of slot assignment here"*). Left alone
  deliberately: correcting a comment would put a `*.ts` path outside
  `docs/` in this lane's diff, which fires GRAPH REGEN and the BOOT GATE
  on a four-lane night for no behaviour. It belongs to the lane that
  builds the seam.
- **The design gives the layout pin and the STATUS pin the same face,
  and the status one already ships.** `MapNode.tsx` renders
  `{component.pinned && <span ...>pin</span>}` for `status:` overridden
  in a component file (`derive.ts`: `const pinned = component.status !==
  "auto"`). The bundle's map-behavior screen gives the DRAG pin the
  identical treatment — mono `pin`, muted, top-right of the header row,
  *"the word 'pin', never a glyph"*. A node that is both would render
  **`pin pin`**. Routed as **`T-015-s3`**; it needs a ruling before the
  hint is built, not after.
- **The ghost is the discriminating signal and it is fully specified**:
  same fill, `1px dashed`, ~50% opacity, at the COMPUTED slot, and
  **drop-on-ghost unpins** — the card's *"un-pinning (affordance per
  design)"*. No new token is needed or reachable: `app/src/styles/**` is
  C-11, whose `touch_slugs` are `[app-shell, app-board]`, both fenced
  away tonight; the existing `border-map-edge-planned` /
  `border-map-declared-only-border` dashed families and
  `text-muted-foreground` cover it.
- **The drag needs the real-input lane, and no `[app-map]` fence reaches
  it.** CONVENTIONS' pointerdown gotcha exists because synthetic events
  cannot reproduce trusted-input ordering; a drag is the same hazard
  class, and `tools/e2e` is where this repo pins trusted input. Routed
  as **`T-015-s4`**.
- **Baseline at `d46f71f` in this worktree**: parser `npm ci` 0 +
  `npm run build` 0; app `npm install` 0, `npm run build` **0**,
  `npm test` **940/940 across 46 files, exit 0** — unmoved from T-090's
  checkpoint, as a zero-code diff requires.

### STATUS

`status:` is left at `building` and is NOT stamped `done` by this lane.
The diff is docs-only: these notes and four suggestion files. Whether
the card returns to `planned` with a corrected `touches:` is the
planner's call — `touches:` is not a field this role may edit.

## Verdicts
