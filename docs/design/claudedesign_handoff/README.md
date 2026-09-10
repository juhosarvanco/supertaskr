# Handoff: Supertaskr architecture map

## Overview

The **architecture map** is Supertaskr's second hero surface after the story-map board. The board shows *what is being built*; the map shows *what the system is, how far along each part is, and where the code has drifted from the plan*.

Two layers are drawn together on one canvas:

- **Intent** — components and dependencies the architect declared (one markdown file per component, in `docs/architecture/components/`).
- **Reality** — files, symbols and dependencies an indexer parsed from the actual code.

Where they agree the map is solid. Where the code has an edge the plan doesn't know about, or files no component claims, the map lights it **amber = drift**.

Two rules carry the whole design. Implement them literally:

1. **Status is a fill, drift is a stroke.** A component's fill is its build status, derived from the board tasks that touch it — the same six-status palette as cards, no new "map status" colours. Drift never takes a fill; it is always a dashed ring on the node or a dashed edge on the graph. This is what keeps *building amber* and *drift amber* apart even on the same node.
2. **Nothing moves except on re-index.** Layout is computed once per index. Hover, search, selection, overlays and expansion change ink only — never position.

This handoff covers T0 (component tier), T1 (one component expanded), the detail panel, all four overlays, empty/degraded states, and the layout algorithm.

## About the design files

The files in this bundle are **design references authored in HTML** — prototypes showing intended look and behaviour, not production code to copy. The task is to **recreate these designs in Supertaskr's real environment** (Tauri + web front end, per the component inventory) using its established patterns, its token file, and its existing card/board components. Where the map reuses a board or card element, reuse the real component rather than porting markup from these prototypes.

`supertaskr app.dc.html` opens directly in a browser (it needs `support.js` beside it) and renders every screen; the tab bar across the top switches screens.

## Fidelity

**High fidelity.** Colours, type, spacing, radii and states are final and exact. Recreate pixel-for-pixel using the codebase's existing libraries. Every value in this README is measured from the prototype; where a value is a token, use the token, not the hex.

Two things are deliberately *not* specified and are the implementer's call: the graph rendering technology (SVG vs canvas — SVG is assumed and is fine to ~200 nodes), and the indexer's data format.

## Screens / views

Open `supertaskr app.dc.html` and use the tab bar. Tabs: `board` · `board · dark` · `map` · `map · dark` · `map spec` · `map behavior` · `map · tasks` · `card detail` · `card states` · `interview` · `rooms` · `sessions` · `open a folder`.

---

### 1. `map` — T0 architecture map (hero, light)

**Purpose.** The default map view. Read the shape of the system, its build progress, and its drift, in one screen.

**Window frame.** 1440px wide, 12px radius, `#fff` on `#dcdcdc` border. Title bar 10px/14px padding, `#f7f7f7`, bottom border `#ececec`, three 11px traffic lights (`#e5675a` `#e3b341` `#57ab5a`), then mono 11px `#737373` label.

**Layout.** Horizontal flex: 72px nav rail · flexible pane · 480px detail panel.

- **Nav rail** — 72px, `#fafafa`, right border `#ececec`, 16px vertical padding, 6px gap. Items are 56px wide, 8px vertical padding, 9px radius, icon (16px) over mono 9.5px label. Active item: `#ededed` background, `#171717` icon and label. Inactive: `#a3a3a3` 1.5px icon outline, `#737373` label. Order: board · map · rooms · sess · (spacer) · `v0.1`.
- **Pane header** — 14px/20px/13px padding, bottom border `#ededed`. Left group (14px gap): wordmark `map` in Geist Mono 19px/700, letter-spacing −0.045em; lens segmented control; search field. Right group (12px gap): overlay segmented control; mono 10.5px `indexed at a1b2c3d · 2m ago`; `Re-index` button (13px/500, `#fff`, `#e2e2e2` border, `0 1px 2px rgba(0,0,0,0.05)`, 6px/12px padding, 9px radius).
  - **Lens control** — `#f0f0ef` track, 3px padding, 9px radius. Active pill: `#171717` fill, `#fafafa` text, 5px/11px padding, 6px radius, mono 11px. Options: `architecture` (active) · `tasks`.
  - **Overlay control** — same track. Active pill here is `#fff` with `#e2e2e0` border and `#171717` text (a lighter selection than the lens, because it modifies rather than navigates). Options: `status` (active) · `provenance` · `drift` · `churn`.
  - **Search field** — 230px, `#fafafa`, `#e5e5e5` border, 9px radius, 6px/11px padding, 9px circle glyph, mono 11px placeholder `components · files · symbols` in `#a3a3a3`.
- **Canvas** — fills remaining width. Background `--map-canvas` `#fbfbfa` with a 1px dot grid: `radial-gradient(circle, #e6e6e4 1px, transparent 1px)` at `24px 24px`. Padding 22px/24px/18px. Graph area is 840×440.
- **Legend strip** — under the canvas, 14px top margin, 12px top padding, `#ededed` top border, 20px gaps: swatch + 12px label for `confirmed` · `planned` · `drift` · `unmapped` · `declared-only`, then right-aligned mono 10px `time-machine scrubber lands here`.

**Graph geometry (T0).** Node 192×66, 10px radius, 8px/11px padding, three lines with 2px gaps. Columns at x = 0, 216, 432, 648 (24px gutters). Rows are 150px slots; the hero uses y = 40, 190, 250, 340.

Node contents, top to bottom:
1. Row: id in Geist Mono 10.5px, colour = status `-fg`; right side is the drift count (mono 9.5px/700, `--warning`) or the provenance mark (12px) or, when both, drift count then mark with 6px gap.
2. Name — Geist 13px/600, letter-spacing −0.01em, colour = status `-fg` darkened variant (see token table).
3. Meta — Geist Mono 9.5px: `layer · N files` plus the live status word when not planned.

The eight components and one synthetic node in the hero:

| id | name | col,row | status | fill / border | marks |
|---|---|---|---|---|---|
| C-03 | File watcher | 0, 40 | done | `#d5f0e4` / `#bfe7d6` | self (half disc) |
| C-06 | Tokens + theme | 0, 190 | planned | `#f5f5f5` / `#e8e8e8` | — |
| C-02 | Model + parser | 216, 40 | done | `#d5f0e4` / `#bfe7d6` | independent (disc + ✓) |
| C-05 | Indexer | 216, 190 | building + drift, **selected** | `#fdeecb` / 1.5px `#171717` + dashed `#b3600a` ring | `drift 2` |
| C-08 | CLI | 216, 340 | declared-only | transparent / 1px dashed `#cfcfcd` | — |
| C-01 | Board renderer | 432, 40 | done + drift | `#d5f0e4` / `#bfe7d6` + dashed ring | `drift 1`, independent |
| — | unmapped | 432, 250 | synthetic | `#fafaf9` / 1px dashed `#d4d4d2` | `D-2` |
| C-04 | Detail panel | 648, 40 | verifying | `#fce6d2` / `#f3d0ae` | pulsing 5px dot |
| C-07 | Tauri shell | 648, 190 | planned | `#f5f5f5` / `#e8e8e8` | — |

**Drift ring.** `outline: 1.5px dashed var(--warning); outline-offset: 3px`. Outline, not border, so it composes with any fill and never changes the node's box.

**Selected node.** Border 1.5px `--map-node-border-selected`, padding reduced 0.5px to keep the box identical, shadow `0 2px 6px rgba(0,0,0,0.09)`.

**Edges.** SVG overlay at the canvas origin, `pointer-events: none` on the layer (hit-testing is on invisible fat paths in the real implementation — 10px stroke, transparent). Orthogonal elbows: 12px stub out of the source's right edge, vertical in the gutter, 12px stub into the target's left edge. Arrowheads are 6.5px `viewBox 0 0 8 8` triangles, `refX 7`, `orient auto`.

| relation | stroke | width | dash | marker fill |
|---|---|---|---|---|
| confirmed | `--map-edge` `#c2c2c0` | 1.5 | — | `#b8b8b6` |
| planned | `--map-edge-planned` `#d4d4d2` | 1.25 | `1 4`, round cap | `#cfcfcd` |
| drift | `--warning` `#b3600a` | 1.5 | `5 4` | `#b3600a` |

Hero edge list (source → target, path data as authored):

```
confirmed  C-03→C-02   M192 73 H216
confirmed  C-05→C-01   M408 223 H420 V73 H432
confirmed  C-02→C-01   M408 73 H432
confirmed  C-01→C-04   M624 73 H648
confirmed  C-01→C-07   M624 73 H636 V223 H648
planned    C-06→C-05   M192 223 H216
drift      C-05→unmapped   M408 223 H420 V283 H432
drift      C-01→C-05   M528 106 V148 H312 V190      (back edge, counted against C-01)
```

Edge weight scales with observed import count from 1.5px to 2.5px, capped.

**Detail panel (480px).** White, left border `#e5e5e5`, shadow `-24px 0 48px -30px rgba(0,0,0,0.2)`. Header 18px/22px/14px padding, bottom border `#ededed`: id (mono 12px `#737373`) + name (19px/600, −0.02em); a chip row with the status chip (11.5px/500, status bg + border + fg, 3px/9px, 6px radius), the layer chip (mono 10.5px, `#d4d4d4` border), and the drift chip (mono 10.5px/600, `#b3600a` on `#fdf4e8` with `#e6c49a` border); and an `esc` affordance on the right.

Body 16px/22px/18px padding, 18px section gaps. Section labels are mono 10px, letter-spacing 0.12em, uppercase, `#737373`. Sections in order:

1. **responsibility** — 13.5px prose, line-height 1.6, `#404040`.
2. **drift findings** — one block per finding, 2px `#e6c49a` left rule, 12px left padding: finding id (mono 10.5px `--warning`, `flex:none; white-space:nowrap`) + one plain sentence (13.5px `#262626`), then the evidence line (mono 11px `#737373`). Facts, not warnings — no icons, no red.
3. **dependencies** — two-column grid inside a 9px-radius `#ededed` border: `declared` | `observed` headers on `#fafafa`, then one row per dependency. Observed-only rows show the left cell as `—` and the right cell in `--warning`.
4. **tasks touching this component** — compact rows, `#ededed` border, 8px radius, 7px/10px padding: task id (mono 11px) · title (13px, flex 1) · status chip · model badge. Clicking opens the card panel (T-005).
5. **decisions** — mono 12px links.
6. **churn · 30d** — mono 12px `41 commits · 6 files`.

Empty sections render a placeholder line, never an error.

---

### 2. `map · dark` — the same view, dark scheme

Identical geometry. Values swap to the `.dark` block in the token sheet. Two shifts are deliberate and must survive:

- **Drift amber lifts** to `#f0a63c` so a 1.5px dashed stroke still carries on near-black.
- **Selection inverts to bone** (`#ededed`) — the one place node chrome outranks the fill.

Window `#0a0a0a` / `#1f1f1f`; rail `#0f0f0f`; canvas `#0c0c0c` with `#1c1c1c` dots; edges `#3f3f3f` confirmed, `#333` planned; panel `#0a0a0a` with `#1f1f1f` rules.

---

### 3. `map spec` — node, edge, T1 and empty states

A specification sheet, not a shipping screen. It is the source of truth for:

- **Node anatomy** at T0 with line-by-line rules.
- **Sixteen node states**, each drawn: planned · building · verifying (pulse) · rejected · done · merging (pulse) · pinned · declared-only · inferred · hover · selected · focused · dimmed · done + drift · building + drift · unmapped.
  - hover: border darkens one step (`#bfe7d6` → `#a9dcc6`), shadow `0 2px 6px rgba(0,0,0,0.1)`.
  - focused: `box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--ring)`.
  - dimmed: `opacity: 0.32` on the node — never a colour swap, so a dimmed teal stays teal.
  - pinned: the word `pin` in mono 9.5px `#737373`. Never a glyph, never a colour.
  - inferred: dashed border, muted ink, id shown as `~` — kin of the suggested card on the board.
- **The amber proof** — `building` / `verifying` / `building + drift` / `done + drift` side by side in both schemes. Status amber is a low-chroma fill (~0.03); drift amber is a high-chroma stroke (~0.13). Different chroma, different role, never swapped.
- **Provenance at map scale (12px)** — independent = solid disc + ✓; same-model = solid disc; self = half disc. **Note the deviation, which is confirmed and intended:** cards collapse independent and same-model into one full disc; the map splits them into three because a component summarises many tasks. Build all three. A component's mark is its *weakest* task — one self-verified task anywhere makes the component read half.
- **Edge relations** — the three strokes plus hover (ink `#525252`, 2.25px, count appears).
- **T1 expanded container** — `--map-group-bg` `#f7f7f6`, `#e2e2e0` border, 12px radius, 12px padding. Header row: id · name · status chip · `collapse`, 10px bottom padding over a `#e8e8e6` rule. Body groups files by directory under mono 10px uppercase labels; file nodes are 8px radius, `#fdf7e9` on `#f0e6d2` — the component fill at ~25% — with mono 11.5px path leaves. Files never carry their own status. A file with a finding takes the same dashed ring at `outline-offset: 2px`.
- **Empty & degraded** — no architecture declared (with the path it looked in, plus inferred pseudo-components so the pane is never blank); index not run; parse errors (reuse the board's chip, keep the last valid map); large repo truncation note.
- **Open questions, answered** — drift signal, direction system, lanes, the delight moment, density, scrubber placement. Read this section before implementing; each answer names the constraint that produced it.

---

### 4. `map behavior` — overlays, interaction, T2, layout

- **Overlay: provenance.** Fills hold. The mark grows 12px → 14px and *every* component gets one; components with no verified task take a hairline dashed ring (`1.5px dashed #c4c4c2`), which makes unverified work visible rather than merely absent. Edges drop to `--map-edge-muted`. Legend swaps to the four marks. Hovering a mark shows `4 of 6 tasks independently checked`.
- **Overlay: drift.** The only overlay that dims. Clean components fall to `opacity: 0.4`, their edges to `--map-edge-muted`; components with findings keep full strength and swap the drift chip for a bare numeral. Drift edges thicken to 1.75px. The unmapped node promotes: border goes warning-dashed and it shows its finding id. Footer reads `3 findings across 2 components · 1 unclaimed directory`. Clicking a numeral opens the panel at the drift section.
- **Overlay: churn.** A 3px bar along the node's bottom inner edge, width = 30-day commits as a share of the busiest component, plus the raw number where the mark sits. `--muted-foreground` grey; the single hottest component goes one step darker (`#404040`). **Never amber** — churn is not a judgement. Declared-only components show `—`, not a zero bar.
- **Hover / neighbourhood.** Neighbours (one hop, both directions) keep full opacity; everything else drops to 32%. The hovered node takes hover border + `0 3px 10px rgba(0,0,0,0.13)`. Its edges lift to ink at 2.25px and print their observed count at the elbow in mono 9.5px on a canvas-coloured chip; drift edges lift in `--warning` instead, keeping the relation readable. **Instant — no transition.** Keyboard focus does the same plus the ring.
- **Search (⌘F).** One list, three kinds, kind named on the right: components, files, symbols. Unmapped files are tagged in `--warning`. ⏎ selects and centres — the node never moves, the viewport does. No match empties the list; it does not dim the map.
- **Pinned.** Drag to pin. The computed slot stays behind as a dashed 50% ghost so you can see what you overrode; dropping on the ghost unpins. Pins persist.
- **T2 — file selected.** Symbols live in the panel, never on the canvas. Header: file path (mono 12.5px) + a `claimed twice` note in `--warning` when relevant. Rows: visibility in a 34px left gutter (`pub` / `—` / `use`), symbol name (mono 12px), kind + reference count right-aligned (mono 10.5px `#737373`). Imports come last with the component they resolve to. Rows are not clickable in v1.
- **Layout algorithm.** Seven rules, in the screen. The load-bearing ones:
  1. Column = longest path from any root along **declared edges only**. Observed-only (drift) edges never move a node.
  2. Cycles break at the edge whose target has the lowest component id; mark it and keep drawing.
  3. Row order within a column = component id ascending. **Not** crossing-minimised — a crossing minimiser reshuffles rows whenever a component is added, and stability beats tidiness here.
  4. Rows are 150px slots; a new component appends to the bottom of its column and nothing above moves. Ids are assigned once, never reused.
  5. Pins win and are skipped by slot assignment; the computed slot stays ghosted.
  6. Edges route as elbows (12px stub · mid-gutter vertical · 12px stub). Same-column edges bow below the row band. No curves.
  7. Re-index recomputes columns; a column change moves a node, and that is worth seeing. Everything else is frozen between indexes.

---

### 5. `map · tasks` — the second lens (already built)

The same pane, dependency-of-tasks instead of architecture: 18 board tasks in dependency waves, critical path in `#c96a4f`, blocked/ready distinction on grey cards, a summary strip (critical path · worst blocker · ready now). It shares the pane chrome and the lens control. Not part of the architecture-map brief, but it ships in the same pane and its lens switch must work in both directions.

## Interactions & behaviour

| trigger | result |
|---|---|
| hover node | neighbourhood highlight, dim the rest to 32%, edge counts appear — instant, no easing |
| click / ⏎ | select; open the detail panel; node takes the ink border |
| double-click / → | expand to T1 in place; siblings do not move |
| esc | collapse T1, else deselect and close the panel |
| drag node | pin at drop position; computed slot ghosts behind |
| drop on ghost | unpin |
| ⌘F | search; ⏎ selects and centres the viewport on the node |
| arrows | walk edges from the focused node; same visuals as hover plus `--ring` |
| overlay segment | swap the added layer; status fill always stays |
| `Re-index` | recompute reality; columns may change, and only then do nodes move |
| scroll / pinch | pan and scale the canvas — scale only, never re-layout |

**Motion budget.** The existing card pulse (verifying, merging) is the only ambient motion: `supertaskrPulse 2.4s ease-in-out infinite`, opacity 1 → 0.45 → 1, on a 5px dot. Expand/collapse may use one short transition (≤160ms) or none. One delight moment, and only one: **the turn to teal** — when a component completes, its fill wipes in from the left edge over 400ms, once, on the transition only. `prefers-reduced-motion` kills the pulse and the wipe and swaps colours directly.

**States to build.** Loading (index running): existing parse-error-style chip in the header, map stays interactive on last valid data. Error (parse failure): board's `2 parse errors · last valid state` chip; the map ages rather than blanking. Empty: the three degraded states in `map spec`.

## State management

Client state the pane needs:

- `selectedComponentId: string | null` — drives the panel.
- `expandedComponentIds: Set<string>` — T1 containers.
- `selectedFilePath: string | null` — drives the T2 panel section.
- `hoveredComponentId: string | null` and derived `neighbourIds: Set<string>`.
- `overlay: 'status' | 'provenance' | 'drift' | 'churn'` — persisted per project.
- `lens: 'architecture' | 'tasks'` — persisted per project.
- `pins: Record<componentId, {x, y}>` — persisted per project.
- `viewport: {x, y, scale}` — persisted per project.
- `search: {query, results, open}` — ephemeral.

Data the pane reads: declared components (parsed markdown), the observed graph (indexer output, with `lastIndexedCommit` and `lastIndexedAt`), drift findings (computed by diffing the two), board tasks joined to components, decision records, and 30-day churn per component. Layout is derived from declared components + declared edges + pins only — never from hover, overlay or selection state.

## Design tokens

Full paste-ready values, light and dark, are in **section 06 of `supertaskr tokens.dc.html`**. New in this pass:

```css
:root {
  --warning:                   #b3600a;   /* drift, contradiction. STROKE ONLY. */
  --warning-foreground:        #fff8ee;
  --map-canvas:                #fbfbfa;
  --map-grid:                  #e6e6e4;   /* 1px dots, 24px pitch */
  --map-node-border:           #e2e2e0;
  --map-node-border-selected:  #171717;
  --map-node-shadow:           0 1px 2px rgba(0,0,0,0.05);
  --map-edge:                  #c2c2c0;
  --map-edge-muted:            #e5e5e3;
  --map-edge-planned:          #d4d4d2;
  --map-edge-drift:            var(--warning);
  --map-unmapped-bg:           #fafaf9;
  --map-unmapped-fg:           #737373;
  --map-group-bg:              #f7f7f6;
  --provenance-independent:    #1f7a58;
  --provenance-same:           #1f7a58;
  --provenance-self:           #1f7a58;
}
.dark {
  --warning:                   #f0a63c;
  --warning-foreground:        #2a1a06;
  --map-canvas:                #0c0c0c;
  --map-grid:                  #1c1c1c;
  --map-node-border:           #262626;
  --map-node-border-selected:  #ededed;
  --map-node-shadow:           none;
  --map-edge:                  #3f3f3f;
  --map-edge-muted:            #232323;
  --map-edge-planned:          #333333;
  --map-edge-drift:            var(--warning);
  --map-unmapped-bg:           #101010;
  --map-unmapped-fg:           #949494;
  --map-group-bg:              #121212;
  --provenance-independent:    #4ecf9e;
  --provenance-same:           #4ecf9e;
  --provenance-self:           #4ecf9e;
}
```

Reused unchanged from the existing sheet: the six `--status-*-bg` / `-fg` pairs, `--border`, `--ring`, `--muted`, `--muted-foreground`, `--card`, `--font-mono-stack`, `--pulse-*`.

Status fills used on map nodes (light / dark):

| status | bg | fg (id, meta) | title | border |
|---|---|---|---|---|
| planned | `#f5f5f5` / `#141414` | `#737373` / `#949494` | `#171717` / `#d4d4d4` | `#e8e8e8` / `#262626` |
| building | `#fdeecb` / `#2a2008` | `#7d5c12` / `#e2b855` | `#6b4d09` / `#f0cd7e` | `#f3ddab` / `#4a3a12` |
| verifying | `#fce6d2` / `#2c1a0c` | `#84501c` / `#e8a468` | `#6e3f12` / `#f2bd8c` | `#f3d0ae` / `#503018` |
| rejected | `#fbe1da` / `#2c1210` | `#93331d` / `#f08d76` | `#7d2c19` / `#f5a897` | `#f2c7bd` / `#5a221c` |
| done | `#d5f0e4` / `#0d2a21` | `#2f7256` / `#79dcb4` | `#14503c` / `#a8ecd0` | `#bfe7d6` / `#1c4a3a` |
| merging | `#d9edf7` / `#0c2430` | `#26647e` / `#6fc6e4` | `#134559` / `#96d8ee` | `#bedeee` / `#1a475c` |

Meta-line ink on filled nodes is one step lighter than the id: `#3f8065` (done), `#8a6a1f` (building), `#8a6440` (verifying), `#8a8a8a` (planned).

**Type.** Geist for UI and prose; Geist Mono for the wordmark, ids, paths, counts, and all section labels. Both bundled locally — no remote font loads. Scale used on the map: 19px/700 wordmark · 13px/600 node names · 13.5px panel prose · 12.5px labels · 11px chips · 10.5px section labels (0.12em, uppercase) · 9.5px node meta.

**Spacing.** 24px canvas gutter, 24px column gutter, 150px row slot, 12px edge stubs, 8px/11px node padding, 18px panel section gaps.

**Radii.** 12px window and panel cards · 10px T0 nodes · 9px chrome pills and search · 8px small rows and mini nodes · 6px chips.

**Shadows.** Node rest `0 1px 2px rgba(0,0,0,0.05)` (none in dark) · node hover `0 2px 6px rgba(0,0,0,0.1)` · node selected `0 2px 6px rgba(0,0,0,0.09)` · hovered-with-neighbourhood `0 3px 10px rgba(0,0,0,0.13)` · panel `-24px 0 48px -30px rgba(0,0,0,0.2)` · search popover `0 8px 24px -14px rgba(0,0,0,0.3)`.

## Assets

None. No images, no icon font, no external SVG. Every glyph in the map is a CSS shape (discs, half-discs via a 90° linear-gradient, dashed outlines) or a text character. Fonts are Geist and Geist Mono, bundled in-binary, SIL OFL 1.1.

## Files

| file | what it is |
|---|---|
| `supertaskr app.dc.html` | All screens. Tabs: `map`, `map · dark`, `map spec`, `map behavior`, `map · tasks`, plus the existing board/card/interview/rooms/sessions screens for context. Open in a browser with `support.js` beside it. |
| `supertaskr tokens.dc.html` | The token sheet. Section 06 is the map; sections 01–05 are the existing language it builds on. |
| `support.js` | Runtime the two HTML files need in order to open. Not part of the design. |
| `map-design-handoff.md` | The original written brief this design answers, including the acceptance criteria in §9. |

## Acceptance criteria (from the brief)

- Rendering Supertaskr's own repo is screenshot-ready in light and dark using only tokens.
- Building/verifying amber and drift/warning amber are distinguishable at a glance in both schemes, including on the same node.
- The three provenance marks stay distinct at map-node scale.
- Every component and edge state has a designed treatment.
