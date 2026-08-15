---
id: T-012
title: Map view T0 + detail panel + pane switcher
feature: F-06
milestone: 2
priority: 5
size: L
status: verifying
blocked_by: [T-011]
touches: [app-map, app-shell]
builder: claude-fable-5
verifier: claude-fable-5
built_by: claude-fable-5@t012
verified_by: "claude-fable-5 @fresh"
review: same-model
---

Size L: planning pass COMPLETE (below; architect-approved 2026-08-15).

## Acceptance criteria
- WHEN the map pane opens on this repo THE app SHALL render every
  declared component as a map node — status fill from the existing
  --status-* tokens, ADR-016 two-mark provenance on done components,
  drift ring when findings exist — and edges styled by relation
  {confirmed solid, planned faint, undeclared dashed --warning},
  laid out deterministically by the design bundle's seven layout
  rules ("map behavior" screen) implemented as a pure in-repo module
  with zero new dependencies (same graph → same picture; append-only
  row stability), with legend and search over components + files
  (symbol search arrives with T-013's T2 panel).
- THE pane header SHALL carry the design's overlay segmented control
  with status (base, default), provenance, and drift modes functional
  per the design bundle's map-behavior screen — status fill always the
  base; drift rings, drift edges, and drift counts rendered in every
  mode (drift is core rendering, never overlay-gated) — and the legend
  SHALL follow the active mode. The churn segment is absent until
  T-013 supplies its git data; the lens control (architecture · tasks)
  is absent until a tasks-lens task exists.
- THE shell SHALL gain a pane switcher (board | map) — app-shell
  territory, declared here in touches; board behavior unchanged.
- WHEN a node is clicked or keyboard-activated THE detail panel
  (T-005 primitive, pointerdown dismissal inherited) SHALL show the
  §6.3 contents; empty sections render placeholders, never errors.
- THE warning amber SHALL be distinguishable at a glance from
  building/verifying amber in BOTH schemes, including composed on one
  node (building + drift ring) — screenshot check, light and dark.
- IF prefers-reduced-motion is set THEN pulse and transitions SHALL
  be disabled (static equivalents).
- IF a node or edge state has no designed treatment THEN the task is
  not done (design handoff §9).
- Tokens-only styling (no arbitrary values); new --map-* / --warning
  tokens land in tokens.css as values from the design pass, mechanism
  unchanged.

## Implementation plan (size-L planning pass — planner session claude-fable-5, 2026-08-15)

Drafted read-only by the planning session; the architect reviews this section, inserts it into docs/tasks/T-012-map-view.md, applies the criteria/registry amendments in §1–§2, and commits — nothing below is in effect until that commit.

Planning pass, not a debate room: no contested architectural fork remains (intent+reality, committed graph, Rust-index/TS-derivation, and two-mark provenance are ADR-013/014/015/016; milestone 2 = the vertical slice per rooms/map-sequencing.md; `index_repo` ships here per T-009 plan §9). Spec of record: map-technical-plan §6 **as revised by §0.0**, map-design-handoff.md, and above both **the design bundle** (docs/design/claudedesign_handoff/ — README measured spec + the `map` / `map · dark` / `map spec` / `map behavior` screens of "nputer app.dc.html", values extracted from source text, T-006 protocol). Where bundle and older prose disagree, the bundle wins; its two carrying rules bind everything below: **status is a fill, drift is a stroke** and **nothing moves except on re-index**. Repo facts cited were verified against the working tree on 2026-08-15. T-011's CRITERIA are the model contract consumed here; its in-flight code was deliberately not read — the executor binds to the merged names.

**Frontmatter changes made by this pass: none.** `touches: [app-map, app-shell]` is already true and sufficient (App.tsx, watcher-store/docs-model, index.css/tokens.css, lib.rs, docs_watch.rs, Cargo.toml are app-shell; everything under app/src/architecture/ is app-map). `blocked_by: [T-011]` stands — merge first. T-017 (building) also holds app-shell and edits App.tsx, so the touches guardrail — not blocked_by — serializes dispatch behind its merge; file-disjoint parallelism is NOT available (App.tsx collides).

### 1. Two criteria conflicts — proposed amendments (exact text)

**(a) elkjs is out; the bundle's seven-rule layout is in.** The criterion predates the design bundle, which ships a complete deterministic layout algorithm whose rule 3 *explicitly rejects crossing minimization* — the core of ELK's layered algorithm — because "stability beats tidiness". Forcing ELK to obey rules 1–7 means fixing every position, i.e. not using ELK; the rules themselves are ~150 lines of pure TS. Zero new dependencies also keeps the verifier surface at T-009's standard (dropping rayon there, same logic; elkjs would be the largest npm addition in the repo's history for negative value). Replace criterion 1 with:

> - WHEN the map pane opens on this repo THE app SHALL render every
>   declared component as a map node — status fill from the existing
>   --status-* tokens, ADR-016 two-mark provenance on done components,
>   drift ring when findings exist — and edges styled by relation
>   {confirmed solid, planned faint, undeclared dashed --warning},
>   laid out deterministically by the design bundle's seven layout
>   rules ("map behavior" screen) implemented as a pure in-repo module
>   with zero new dependencies (same graph → same picture; append-only
>   row stability), with legend and search over components + files
>   (symbol search arrives with T-013's T2 panel).

Consequential one-line surgeries (same commit): T-013 criterion 1's parenthetical "(ELK interactive hints; spatial stability per plan §6.4)" → "(the T1 rule of T-012's seven-rule layout: the container grows down within its own column and pushes only that column; siblings do not move)"; T-015 criterion 1's "(ELK FIXED constraints)" → "(layout rule 5: slot assignment skips pinned nodes; the computed slot stays ghosted)".

**(b) Overlay partition between T-012 and T-013.** In the bundle's DEFAULT view, drift rings/dashed edges/drift counts and the done-components' provenance marks are **always visible** — they are core rendering, not overlay-gated layers; the overlay control adds *emphasis modes*. The honest cut is data-based, not effort-based: provenance and drift modes are pure ink over T-011's model; churn is the only overlay requiring new data (git shell-out — T-013's by charter, ADR-013/§0.0-6). A disabled churn segment has no designed treatment ("IF a state has no designed treatment THEN not done"), so the segment is **absent**, not disabled, until T-013. Replace T-012's "…and overlay toggles per design handoff §4.6" clause with a standalone criterion:

> - THE pane header SHALL carry the design's overlay segmented control
>   with status (base, default), provenance, and drift modes functional
>   per the design bundle's map-behavior screen — status fill always the
>   base; drift rings, drift edges, and drift counts rendered in every
>   mode (drift is core rendering, never overlay-gated) — and the legend
>   SHALL follow the active mode. The churn segment is absent until
>   T-013 supplies its git data; the lens control (architecture · tasks)
>   is absent until a tasks-lens task exists.

And replace T-013's overlay criterion with:

> - THE churn overlay SHALL join the overlay control T-012 ships
>   (status · provenance · drift), rendered per the design's
>   map-behavior screen (3px bottom bar, width = share of the busiest
>   component, raw count at the mark slot, hottest one step darker,
>   declared-only shows —, never amber), with the legend following;
>   churn derives from shelling out to git (ADR-013/§0.0-6) and IF the
>   project is not a git repo THEN the churn overlay SHALL be disabled,
>   not broken.

T-012's remaining criteria stand unchanged. The tokens criterion is already half-met: T-006 landed the §06 `--warning`/`--map-*` values INERT; T-012 adds the remaining measured values (§6 below) and turns the mappings live — mechanism contract intact.

### 2. Intent-registry amendments — the map must not ship born-drifted

The committed registry (T-008 dogfood) declares C-12's paths as `app/src/architecture/**` — map code goes **there**, not components/map/ (a components/map/ dir is claimed by no component and would render the map's own files as D2 unmapped in the hero — self-inflicted drift in the screenshot). Same logic for imports: edges the map code genuinely creates must be declared, or the hero ships pre-drifted D1s. Exact edits, applied by the executor in-branch (this plan is the architect's pen; deviation requires consultation):

- `C-12-map-pane.md`: `depends_on: [C-05, C-06, C-07, C-09, C-10, C-11]` — adds C-05 (imports of ui/button + lib/utils) and C-09 (the panel primitive; C-09's own prose already promises "the map's panel reuses this drawer primitive").
- `C-05-app.md`: `depends_on: [C-01, C-08, C-10, C-11, C-12]` (App mounts the map pane) and `paths` gains `app/src/components/shell/**` (the rail's home).

The resulting C-05↔C-12 cycle is *true* (mount ↔ shared-primitive imports); layout rule 2 breaks it drift-neutrally at the lowest-id target. The structural fix (a shared-ui component) is exactly open suggestion T-008-s2 — not this task. Because declared edges change derived findings, the executor updates T-011's dogfood-findings fixture in the same change, listing every expectation delta in implementation notes (changed, never silently loosened).

### 3. Pane switcher + shell wiring (app-shell)

**Ship the real rail, populated with only what exists.** T-006's scope notes explicitly deferred the nav rail to T-012, and the design's map pane header (wordmark · search · overlay control · indexed-at · Re-index) reserves no room for pane navigation — a header toggle would be new, undesigned chrome. The two prompt options converge: a 72px rail built to the measured spec (sidebar token family; 56px items, icon over mono label; active item `--sidebar-accent` — light renders #f0f0f0 vs the mock's #ededed, one step, disclosed T-006-style family reconciliation; `v0.1` mono tag at the bottom) with exactly **board · map** items. rooms/sess ghosts are dead chrome for unbuilt features — their tasks add their items. New `app/src/components/shell/PaneRail.tsx`; real `<button>`s, tab-focusable, `aria-current`; no keyboard accelerators (undesigned — recorded silence).

The **global header stays byte-compatible** (wordmark, project path, parse chip, Open folder, theme toggle — T-006/T-007 pinned testids and copy survive); layout becomes `flex-row: rail | (header + pane)`. The rail renders only when a project is open (`screen === "board"` today; front door/loading/browser stay full-bleed). Pane state = `useState<"board" | "map">` in App.tsx, `data-pane` attribute for probes; board pane byte-identical behavior (criterion 2), map pane mounts/unmounts (layout is deterministic, remount is free).

**Lens/overlay/viewport persistence: session-ephemeral in T-012.** The design says "persisted per project", but that is app-preference state — precisely T-022's charter ("one store, one precedence order"; pure-lens: preference, never project truth). A private half-store here would collide with it. Defaults each launch: pane board, overlay status, viewport identity. The dispatch note flags the seam so T-022 (or a follow-up suggestion) absorbs map view-state persistence.

### 4. Delivery plumbing (Rust + store)

**Collector** (docs_watch.rs `collect_docs_files`): the extension gate widens to — `.md` anywhere under docs/ (unchanged) **or** `.json` whose canonical project-relative path starts with `docs/architecture/` (§0.0-2; subdirectories included, so T-015's layout.json rides free later). The predicate runs on the post-canonicalize relative path — containment first, classification second. `MAX_FILE_BYTES`/`MAX_FILES`/symlink rules unchanged; an oversized graph.json is skipped exactly like an oversized .md (existing silent-skip behavior — skip *visibility* remains T-003-s3 territory), and the map then honestly renders T-011's graph-absent degraded state. Snapshot payload grows by the graph (~140,785 bytes today) per push — acceptable at docs-tree scale, measured number recorded in notes.

**Frontend routing**: docs-model gains `GRAPH_FILE = "docs/architecture/graph.json"` and passes its raw content through on `DocsModelState` (reference-stable when bytes are unchanged, so derivation memos hit). Component files join the model-input filter + `failingIssues` (via `parseComponentFile`'s identity gate) so they get the full last-good + parse-chip machinery — **if T-011's merge has not already done this** (its live-update criterion needs it but its `touches: [app-map]` fence may have kept it out of C-10 files; the executor reconciles against the merged diff — the target state above is binding, the path there is whatever remains). graph.json deliberately gets **no last-good fallback**: ADR-014 forbids hand-editing, so a corrupt graph is an abnormal state whose designed recovery is regeneration — parse failure in T-011's `parseGraph` degrades to the index-not-run family and the Re-index button heals it. The parse chip stays a .md concern.

**`index_repo()`** — zero-argument `#[tauri::command]`, async, `spawn_blocking` (T-007 pattern), logic in a new `app/src-tauri/src/index_cmd.rs` seam (`run_index(state, cache_dir) -> IndexOutcome`) so cargo tests drive it without a Tauri runtime. Flow: project dir from `WatchState` (None → `NoProject`); `has_plain_docs_dir` gate (else `NoDocs` — the app never *creates* docs/); refuse a symlinked `docs/architecture` dir (T-003 rule family; a graph.json that is itself a symlink is *replaced* by write_graph's atomic rename — the link is never followed, recorded); `nputer_index::index(IndexOptions { root, cache_dir, ..Default })` then `write_graph(&graph, root.join(GRAPH_REL_PATH))`. `cache_dir` = `app.path().app_cache_dir().join("index-cache")`, None-tolerant (crate degrades to full parse). Typed outcome, camelCase serde like `PickOutcome`:

```rust
pub enum IndexOutcome {
    NoProject,
    NoDocs { project_dir: String },
    Indexed { changed: bool, files: usize, symbols: usize, edges: usize,
              truncated: bool, graph_bytes: usize, duration_ms: u64, indexed_at_ms: u64 },
    Error { message: String },   // IndexError::Display; never a panic
}
```

Volatile stats live HERE, never in the committed file (ADR-014). **Cargo.toml** gains `nputer-index = { path = "crates/nputer-index" }` — the app's first dependency edge on the crate, exactly as T-009's plan reserved; Cargo.lock diff is the dependency-edge line only, **zero new external packages**. **Capabilities and CSP: zero diff** — app-defined commands are un-gated under bare `core:default` (ADR-012, T-007's empirical fact); the command takes nothing and returns counts and timestamps only.

**Loop termination — do not break T-009's brake.** Three independent brakes exist: byte-deterministic output, `write_graph`'s read-compare-skip (returns `false`, no fs event at all), and the collector's content-equality emit suppression. Re-index on an unchanged tree therefore produces *no write, no snapshot, no re-render*; on a changed tree exactly one write → one debounced batch → one snapshot carrying the new graph.json → one re-derivation. Pinned by a live cargo integration test (T-007's `live_state` pattern): armed watcher, run `run_index` twice — at most one emit, then provably none. Concurrency: frontend single-flight (`indexing` flag, the `picking` pattern); a raced double-run is benign by determinism + atomic writes (T-009's concurrent-writers note); a Rust-side single-flight remains T-007-s3's family, not built here.

**Re-index affordance + hint** (pane header right group, measured spec): the Re-index button is the existing outline Button variant (the mock's values match it exactly). The hint renders from **the IndexOutcome held in React state — never the file**: after an in-session index, `indexed <relative time> · N files`; before one, `committed graph · N files` from the loaded graph's content. The mock's `a1b2c3d` sha is deliberately dropped — the committed payload is volatile-free by ADR-014, and reintroducing HEAD reads is T-014's report territory (recorded deviation). While indexing: a calm muted chip in the pane header (the parse-chip *form*, per the bundle's loading state), button disabled; `Error` renders as a chip line that clears on the next success.

### 5. Canvas architecture (app-map — app/src/architecture/)

**Files**: `MapView.tsx` (pane: header, canvas, legend, state orchestration) · `MapNode.tsx` · `MapEdge.tsx` (visible layer + invisible 10px hit strokes) · `MapPanel.tsx` · `map-layout.ts` (pure) · `map-visuals.ts` (pure state→class) · `map-search.ts` (pure). **Construction: HTML node layer over an SVG edge layer inside ONE transformed wrapper** — the mock's own build; pan/zoom is `transform: translate+scale` on the wrapper, **scale only, never re-layout** (wheel pans, pinch/ctrl-wheel zooms, clamp 0.25–3, documented silence). Edge layer `pointer-events: none`; hit paths `pointer-events: stroke`.

**Layout module — the seven rules verbatim, as pure functions over (declared components, declared edges) only** (the bundle: layout never reads hover/overlay/selection): 1 column = longest path from any root along declared edges only (observed/drift edges never move a node); 2 cycles break at the edge whose target has the lowest component id, drift-neutral, keep drawing; 3 rows within a column by id ascending — no crossing minimization; 4 rows are 150px slots, new components append to the bottom, nothing above moves, ids never reused; 5 pins win and are skipped by slot assignment — **present but inert until T-015** (no pins exist in T-012); 6 elbows: 12px stub out, mid-gutter vertical, 12px stub in; same-column edges bow below the row band; no curves; 7 re-index recomputes columns — only a column change moves a node. Geometry constants: node 192×66 r10 pad 8/11, column pitch 216 (24 gutter), slot 150, canvas pad 22/24/18. **Rule 8 (plan extension, settled here)**: the synthetic unmapped node has only observed edges; rule 1's declared-only restriction protects *real* components from accidental imports, but unmapped's own placement disturbs nobody — column = max(column of its edge partners) + 1, bottom-append row; no partners → column 0. It may move on re-index (rule 7's spirit); the bundle's "declared components + declared edges only" line is silent on the node it doesn't declare — recorded. The hero mock's hand-laid coordinates are illustrative; the rules are normative (the mock says so itself), and our dogfood registry is C-01…C-12, not the hero's indicative eight. Layout output also precomputes per-edge label anchors (mid-vertical) and per-node one-hop neighborhood Sets; it recomputes only when the component set, declared edge set, or unmapped partner set changes — status flips repaint, never move.

**Edges**: three relations at measured strokes/dashes (confirmed `--map-edge` 1.5 solid; planned `--map-edge-planned` 1.25 dash 1 4 round; drift `--warning` 1.5 dash 5 4), arrowheads 6.5px refX 7 with their own measured marker fills, weight scaling 1.5→2.5px capped by observed count. **Hover/neighborhood** (instant, zero transition): non-neighbors drop to opacity .32 (class, never a color swap), hovered node takes the strong border (`--status-*-border-strong` — the measured one-step-darker already tokenized) + strong shadow; its edges lift to `--map-edge-hover` at 2.25px and print counts on canvas-colored chips at the elbow anchor; drift edges lift in `--warning`. Keyboard focus = identical + focus ring. **Keyboard**: roving tabindex; arrows walk — ↑/↓ previous/next slot in the column, →/← first outgoing/incoming edge partner by id ascending (settled silence; the bundle's `→ = expand` collision belongs to T-013, which owns expansion — flagged there).

**Selection/panel**: click/Enter/Space selects (ink/bone `--map-node-border-selected` 1.5px, padding −0.5px so the box is identical, selected shadow) and opens `MapPanel` — the T-005 primitive *pattern* (fixed right aside, 480px = `w-120`, focus-in/focus-restore, `attachPanelDismissal` **reused verbatim** — panel-dismissal.ts is C-09/app-board and off-limits; the CONVENTIONS pointerdown gotcha binds). Map nodes carry `data-card-trigger` (the primitive's re-target exemption, so pressing another node switches instead of closing); map pane chrome (overlay control, search, Re-index) carries T-017's `data-panel-exempt`, adapting to its merged mechanism (smallest-choice latitude recorded — T-017 merges before dispatch). Esc layering: search popover handles Escape element-level with stopPropagation (closes itself first); otherwise the primitive's Esc closes panel + clears selection (one state). Panel sections per §6.3/measured spec, every empty section a placeholder, never an error: header (id · name · status chip · layer chip · drift chip · esc affordance) · responsibility · drift findings (finding id + one plain sentence + evidence line, 2px `--warning-chip-border` left rule — facts, not warnings) · dependencies as the declared|observed two-column grid (observed-only rows: left —, right in `--warning`) · tasks touching (id · title · status chip · model badge rows; rows are `data-card-trigger` buttons whose click re-targets to the **real TaskDetailPanel** — panel state is `{kind:"component"|"task"}`) · decisions (mono text, non-clickable — no in-app decisions surface exists; silence) · files grouped by directory (from T-011's mapping; clicking is T-013's T2) · churn placeholder line ("churn arrives with T-013"). Unmapped/inferred/pinned variants use the same panel with applicable sections; a status-pinned component (frontmatter override — C-01 is live dogfood for this) shows the `pin` word on the node face (right-slot order when composed: drift count · provenance mark · pin, 6px gaps — silence, recorded) and the "status pinned" note in the panel.

**The turn to teal** — the design's one delight moment, shipped: a one-shot 400ms left-edge fill wipe when a component's derived status transitions to done between models (previous-status map in MapView state; overlay span scaleX 0→1; first render exempt; `motion-safe` gated). The only transition in the pane.

**Empty/degraded** (rendering T-011's degraded models): no components → "no architecture declared" naming `docs/architecture/components/` + the inferred pseudo-components (dashed, id `~`); the mock's "Declare from what's here"/"Read the format" buttons are **out** — write paths are F-04's, pure-lens holds (recorded deviation). No graph → T-011's declared-only model as delivered + "index not run" line + the Run-index button. Component parse errors → existing chip, last-good map (docs-model machinery). `stats.truncated_symbols` → the quiet footer note. A graph over the collector cap is indistinguishable from absent at the collector (accepted; T-003-s3 territory) — but `IndexOutcome.graph_bytes` lets the header chip say so after a manual re-index (cheap honesty, included).

### 6. Sixteen states + tokens (values extracted from the bundle source; T-006 sanction chain)

All sixteen node states map to classes in `map-visuals.ts`: six status fills (existing bg/fg/title/border tokens) · hover (border-strong + `--shadow-map-hover`) · selected (above) · focused (`--shadow-map-focus`) · dimmed (opacity .32) · pinned (`pin` word, `--muted-foreground`) · declared-only (transparent fill, 1px dashed `--map-declared-only-border`) · inferred (dashed, muted, `~`) · unmapped (`--map-unmapped-*`, border reuses `--map-edge-planned` — value-exact in both schemes, provisional family; recorded reconciliation) · done+drift and building+drift compositions. **Drift ring = `outline: 1.5px dashed var(--warning); outline-offset: 3px`** — outline composes with any fill and never changes the box. **Pulse only on the 5px dot** via the existing `--animate-status-pulse` (its 2.4s/0.45 values already equal the design's nputerPulse — zero new motion tokens). Line 3 = `layer · N files` + live status word when not planned.

New measured tokens in tokens.css (annotated with sources; sanction = T-006's tokens-only ruling — the arbitrary-value ban makes tokenizing measured inks the only legal render): `--status-*-meta` ×6 (measured light/dark: planned #8a8a8a/#6e6e6e, building #8a6a1f/#b08f42, verifying #8a6440/#a8794f, done #3f8065/#5fae8c; rejected/merging derived by the stated one-step rule — hero shows neither; flagged to the screenshot pass) · `--map-declared-only-border` #cfcfcd/#333333 · `--map-edge-hover` #525252/dark derived #d4d4d4 (behavior screen is light-only) · `--map-arrowhead` #b8b8b6/#3a3a3a · `--map-arrowhead-planned` #cfcfcd/#4a4a4a (drift marker = `--warning`) · `--warning-chip-bg` #fdf4e8/dark derived · `--warning-chip-border` #e6c49a/#5a4318 (dark measured from the finding rule) · `--provenance-unverified` #c4c4c2/dark derived · shadows `--shadow-map-hover` 0 2px 6px rgba(0,0,0,0.1) · `--shadow-map-selected` 0 2px 6px rgba(0,0,0,0.09) · `--shadow-map-hover-strong` 0 3px 10px rgba(0,0,0,0.13) · `--shadow-map-panel` -24px 0 48px -30px rgba(0,0,0,0.2) · `--shadow-map-popover` 0 8px 24px -14px rgba(0,0,0,0.3) (all `none` in dark, the scheme's standing rule) · `--shadow-map-focus: 0 0 0 2px var(--background), 0 0 0 4px var(--ring)` (mock's #fff inner → `--background` so dark works; reconciliation). **Map micro-type tokens** `--text-map-id` 10.5px, `--text-map-meta` 9.5px, `--text-map-name` 13px (+lines): the fixed 192×66/150-slot geometry is load-bearing for the layout rules, so the board's map-to-scale reconciliation does not apply to node internals; panel and chrome text DOES map to the existing scale by role (prose 13.5→base, section labels→xs + tracking-overline, pane wordmark 19→2xl — disclosed).

Mechanism additions (index.css only; values stay in tokens.css; ban intact): `@theme` color/shadow/text mappings for the new families **and the §06 set T-006 landed inert goes live** (bg-map-canvas, text-warning-as-stroke consumers etc. — landing mappings is this task's charter); `@utility map-canvas-grid` (the 24px radial-gradient dot grid — gradients aren't expressible as color utilities); `@utility map-drift-ring` (the outline composite); `@keyframes map-teal-wipe` + its `--animate-*` entry. Grep gate stays: zero `-[` arbitrary values.

### 7. ADR-016 on the map

Exactly two marks — solid disc + ✓ (independent OR same-model) and half disc (self) — superseding the bundle's three-mark split (ADR-016 names this surface: "T-012 applies the same to map nodes"). Component mark = **weakest** done task from T-011's provenance rollup; no done tasks → no mark in the base view. Implementation: reuse T-006's ReviewBadge if it sizes to 12px via className; else a purpose-built 12px twin inside architecture/ (board files are slug-fenced; ~20 lines, T-004 purpose-built precedent — executor's call, recorded either way). **Provenance overlay**: marks grow 12→14px, every node carries mark-or-ring — the hairline dashed `--provenance-unverified` ring makes unverified work visible; legend collapses to **checked / self / unverified** per ADR-016 + the human's decision; edges drop to `--map-edge-muted`. The three-way distinction stays in TEXT: the mark's hover label carries it ("checked — independent, different model" / "checked — same model, fresh session" / "self-verified — builder signed off on itself", plus the "N of M tasks independently checked" overlay line), and the panel provenance sentence follows T-006's pattern.

### 8. Tests + verification protocol

- **Pure layout** (node-env vitest): determinism (same input twice → deep-equal), column-assignment table (chains, diamonds, multi-root), cycle break at lowest-id target (incl. multi-cycle), row order + **append-only stability probes** (add a component → every prior position identical — the registry-growth attack answered in-suite), slot arithmetic, elbow geometry incl. same-column bow + 12px stubs, label anchors, neighborhood sets, rule-8 unmapped cases, observed-edges-never-move-real-nodes.
- **Visual-state units**: map-visuals class table for all sixteen states + compositions + reduced-motion forms.
- **Graph hostility at integration level** (T-011 owns parseGraph's unit surface): garbage JSON, wrong schema, `__proto__` file ids, huge-under-cap payloads → degraded model, no crash; store passthrough reference-stability (unchanged bytes → same reference).
- **DOM** (jsdom pragma per T-007 precedent + served-bundle probes per the T-003/T-004/T-006 harness): the sixteen states as rendered; drift ring composing on building AND done; pulse present only on the dot node; panel sections + placeholders + unmapped/pinned variants; task-row → TaskDetailPanel re-target under the CONVENTIONS **trusted event order** (pointerdown-then-flush-then-click, the panel-dismissal suite's pattern reused); switcher board↔map with the board suite untouched; search select+center transform math; hostile content (component name `<img onerror>`, RTL overrides, 10k chars) → React text nodes only, zero injected elements, `grep` gate for innerHTML/dangerouslySetInnerHTML across the diff.
- **Rust (cargo)**: collector accept/reject table (docs/architecture/*.json in — including subdirs; docs/foo.json out; oversized skipped; symlinked skipped); index_cmd seam (NoProject/NoDocs/Indexed/Error; write lands; symlinked docs/architecture refused); the **loop-termination integration test** (live watcher: index twice → at most one emit, then zero).
- **Served bundle + real tree**: harness fixture carrying a graph.json entry renders the map; the live docs/ tree renders the dogfood hero (C-01 pinned+done, C-07 declared-only — zero TS files match its globs — plus whatever findings T-011's merged fixture pins); computed styles both schemes prove the fills and the `--warning` stroke resolve to distinct values; the only animation rules in built CSS sit under motion-safe gating.
- **Suites** (ADR-011 order): lib/parser untouched at its then-current count; app suite +≈45–60; cargo +≈10–14; committed graph.json regenerated at merge (T-009-s1 standing practice — this branch adds TS files).
- **@human** (T-001/T-006 visual precedent, stated): the drift-amber-vs-building-amber **at-a-glance** judgment, both schemes, including composed building+drift — machines pin value distinctness, the glance is the human's; plus re-judgment of the launch shot now that the rail exists (T-006's pending screenshot predates it).

### 9. Out-of-scope fence (do not build)

T1/T2 expansion, churn overlay + its git surface, symbol search (T-013) · pins, dragging, ghost slots, layout.json (T-015 — rule 5 ships inert) · **the tasks lens and the lens control** (unbriefed bonus scope — the executor files suggestion `T-012-s1-map-tasks-lens` at dispatch referencing the bundle's "map · tasks" screen; a suggestion, never scope) · rail items beyond board|map · edge-click panel (the bundle's interaction table omits it — undesigned) · the scrubber (the legend keeps the verbatim "time-machine scrubber lands here" placeholder note only) · watching code paths / auto-index-on-change (T-014's --watch; the map ages until Re-index) · lens/overlay/viewport persistence (T-022 seam) · any npm dependency (elkjs is dead by amendment (a)) · edits to board components, panel-dismissal.ts, or lib/parser (slug fences).

### 10. Dispatch note

Dispatch with explicit @human word (size L) **after T-011 merges** (blocked_by) **and T-017 clears app-shell** (touches guardrail; App.tsx collides — do not file-disjoint it). **Executor reads**: this section top to bottom; T-011's merged code + notes FIRST (bind the derived-model/parseGraph names — this plan states contracts, not its identifiers); the bundle README + the four map screens' source text; map-technical-plan §6/§0.0; ADR-010/012/013/014/015/016; CONVENTIONS (the pointerdown gotcha binds MapPanel); T-009 plan §7 (write_graph contract) + §4 (cache_dir).

**Expected diff surface, exhaustively**: `app/src/architecture/**` (new map files beside T-011's) · `app/src/components/shell/PaneRail.tsx` (new) · `app/src/App.tsx` · `app/src/lib/docs-model.ts` + `app/src/lib/watcher-store.ts` (graph passthrough, component-file inputs if T-011 left them, `indexing` flag) · `app/src/index.css` + `app/src/styles/tokens.css` · `app/src-tauri/src/lib.rs` (command registration) + `app/src-tauri/src/docs_watch.rs` (collector) + `app/src-tauri/src/index_cmd.rs` (new) · `app/src-tauri/Cargo.toml` + `Cargo.lock` (path-dep edge only) · `docs/architecture/components/C-05-app.md` + `C-12-map-pane.md` (§2 amendments) · T-011's dogfood fixture expectations · `app/test/**` (new suites) · `docs/architecture/graph.json` (regenerated at merge) · this task file. **Zero diff**: capabilities/, tauri.conf.json, package.json + both npm lockfiles, lib/parser/**, app/src/components/board/**, app/src/components/ui/**, crates/nputer-index/**.

**Verifier's likely attack surface, flagged now**: (1) layout stability under registry growth + byte-determinism of layout output; (2) loop termination live — re-index spam on an unchanged tree yields zero snapshots (stdout suppression lines are the evidence trail); (3) ACL zero-diff — regenerated gen/schemas/capabilities.json + a runtime probe per the T-007-s2 protocol (`index_repo` reachable with zero grants; dialog/fs/opener still denied; `strings` proves nothing — CONVENTIONS gotcha); (4) panel-reuse regressions against T-005's pinned behaviors (trusted-order press semantics, Esc layering with the search popover, exemption attributes against T-017's merged mechanism); (5) hostile graph/component content in the rendered DOM — text nodes only, no innerHTML, ADR-009 Map discipline in every new file-keyed collection; (6) the `--warning`-is-a-stroke ban — never a node/edge fill, `bg-warning` stays unconsumed on nodes (the panel's chip uses the separate `--warning-chip-*` tints); (7) IPC payload growth honesty (graph rides every snapshot — measured bytes in notes); (8) the §2 registry amendments vs T-011's dogfood fixture — expectation deltas enumerated, not loosened.

**Genuine silences, left open deliberately**: arrow-key direction mapping is chosen, not designed (and the bundle's `→`-expand collision is T-013's to reconcile) · rule 8 (unmapped placement) is a plan extension over a silent-contradictory bundle line · search ranking/cap and popover dismissal details · dark values for behavior-screen-only elements (unverified ring, edge hover ink, drift-chip bg) and rejected/merging meta inks are derived, flagged to the screenshot pass · decisions render non-clickable (no in-app surface) · zoom clamp 0.25–3 · pinned-mark slot order when composed · rooms/sessions rail items wait for their features.

## Implementation notes

Executor claude-fable-5 @t012, 2026-08-15. Seven checkpoint commits on
t012-map-view (infra-stall discipline), each independently green. The
plan §1–§10 was followed as the binding spec; every deviation below is
named. Committed graph.json deliberately NOT regenerated (integrator's,
at merge — T-009-s1): the ignored self-check is RED on this branch
(nine new TS files), run and stated below.

### What was built, per plan section

- **§2 registry amendments (commit 1, FIRST, fixture in the same
  commit).** C-12: `depends_on: [C-05, C-06, C-07, C-09, C-10, C-11]`
  (plan-exact) + `paths` gains `app/src/lib/architecture/**`. C-05:
  `depends_on: [C-01, C-08, C-10, C-11, C-12]` (plan-exact) + `paths`
  gains `app/src/components/shell/**` (plan-exact) and
  `app/src/lib/verdicts.ts`. The two path additions beyond §2's literal
  bullets are the T-011-s1 decision, resolved as OPTION (a) — claim the
  engine in place — from the convergence of: the dispatch directive
  ("the D2 pins for app/src/lib/architecture/ and verdicts.ts should
  DRAIN per the plan's amendment"), STATE.md ("that decision plus a
  verdicts.ts claim drains the D2 group"), the dogfood fixture's own
  header ("T-012's dispatch carries the registry amendment decision
  (T-011-s1) that should drain D2 back to empty" — only claiming files
  where the committed graph records them drains anything at this
  commit), and T-011-s1's option (a) ("one line, kills the D2"; option
  (b)'s code move appears nowhere in plan §10's diff surface and could
  never drain verdicts.ts). Not treated as a §2 deviation requiring a
  room: every binding document points at the same edit; option (b)
  would make the dispatch directive unsatisfiable.
- **§3 pane switcher.** `app/src/components/shell/PaneRail.tsx` — 72px
  sidebar-family rail, exactly board · map, CSS-shape icons at the
  measured 1.5px stroke (named `icon-stroke` utility), `v0.1` tag,
  aria-current, no accelerators. App.tsx: `flex-row: rail | (header +
  pane)`; rail only when `screen === "board"`; global header
  byte-compatible (all T-006/T-007 testids and copy intact — pinned by
  the switcher suite asserting identical header buttons across panes);
  pane state `useState<"board" | "map">` + `data-pane`; board content
  byte-identical, gated on pane. View state session-ephemeral (T-022
  seam, flagged).
- **§4 delivery plumbing.** Collector: `is_collected_docs_path` — `.md`
  anywhere under docs/ + `.json` under `docs/architecture/` (subdirs
  included), evaluated on the POST-canonicalize relative path
  (containment first, classification second; the loop reordered so the
  predicate runs after the canonical-prefix check). Oversized/symlinked
  json skip exactly like md. `index_cmd.rs` seam: `run_index(state,
  cache_dir) → IndexOutcome` exactly as planned (volatile stats in the
  outcome only — ADR-014); `has_plain_docs_dir` gate; symlinked
  docs/architecture refused with `Error` (a symlinked graph.json needs
  no check: write_graph's rename replaces the link unfollowed —
  verified against T-009's emit.rs). `index_repo` command:
  zero-argument, `app_cache_dir()/index-cache` (None-tolerant),
  spawn_blocking; registered alongside the two existing commands.
  Cargo.toml/lock: the nputer-index path-dep line only, zero new
  external packages. Frontend: docs-model `GRAPH_FILE` raw passthrough
  (value-stable; NO last-good by design — corrupt bytes degrade to the
  index-not-run family downstream, Re-index heals); component files
  join the model-input filter + failingIssues via parseComponentFile's
  identity gate (T-011's merge had NOT wired this — reconciled as the
  plan instructed); watcher-store `indexing` single-flight +
  `indexOutcome` session state + `runIndexRepo()`.
- **§4 loop termination.** Pinned live in
  `index_cmd::tests::reindex_emits_once_then_never_again`: armed
  watcher (picker-rendezvous), first index → `Indexed{changed:true}` +
  EXACTLY one emit carrying docs/architecture/graph.json, then a
  6×debounce silent window; second index → `changed:false` + provably
  no emit. All three brakes observed end to end.
- **§5 canvas.** `app/src/architecture/`: MapView, MapNode, MapEdge,
  MapPanel, MapProvenanceMark, map-layout, map-visuals, map-search.
  HTML nodes over an SVG edge layer in ONE transformed wrapper; wheel
  pans, ctrl/pinch-wheel zooms around the cursor (clamp 0.25–3, scale
  only). Layout: the seven rules verbatim as pure functions — iterative
  SCC cycle-breaking at the lowest-id target (drift-neutral, still
  drawn), longest-path columns over declared edges only, id-ascending
  150px slots (append-only pinned by the registry-growth attack test),
  rule-5 pin seam present-inert, orthogonal elbows reproducing the
  hero's exact paths (straight same-row, 12px stubs, the C-01→C-05
  back-edge shape byte-equal: `M528 106 V148 H312 V190`), rule 8
  (unmapped = max partner column + 1, bottom-append), `layoutKey`
  structural identity — status flips are unrepresentable in layout
  inputs, so they cannot move a node; MapView recomputes layout only on
  key change. Edges: measured strokes/dashes/weights (1.5→2.5 capped,
  0.125/import step — recorded), five arrowhead markers, 10px
  transparent hit paths (`pointer-events: stroke`), hover lift
  ink/warning at 2.25 with elbow count chips (canvas-bg,
  secondary-foreground ink — value-exact to the mock's #404040 in
  light). Hover/focus neighborhood: instant class swaps, non-neighbors
  opacity .32, edges of non-neighbors muted. Keyboard: roving tabindex;
  ↑/↓ slot walk, →/← first outgoing/incoming partner by id
  (settled silence; the bundle's `→ = expand` collision left to T-013).
  Selection: `map-node-selected` compound utility (1.5px ink/bone
  border + the measured half-pixel padding compensation — box
  identical); panel state `{kind:"component"|"task"}`; task rows
  re-target to the REAL TaskDetailPanel; `attachPanelDismissal` reused
  VERBATIM (never edited); map nodes carry `data-card-trigger`; pane
  chrome + legend carry `data-panel-exempt` (T-017's merged attribute
  mechanism, unchanged). Esc layering: search popover self-closes with
  stopPropagation; the primitive's Esc closes panel + clears selection.
  The turn to teal: previous-status map in MapView, overlay span of the
  OLD fill anchored right wiping scaleX 1→0 (visually: teal wipes in
  from the left edge), 400ms once, `scale-x-0` base class so reduced
  motion swaps colors with zero JS branches; first render exempt. The
  pane's only transition.
- **§6 sixteen states + tokens.** All sixteen in `map-visuals.ts` as a
  pure table (38 unit tests + 25 DOM tests). tokens.css gains the
  measured families (annotated): six `--status-*-meta`,
  `--map-declared-only-{border,fg,title}`, `--map-edge-hover`,
  `--map-arrowhead{,-planned}`, `--map-legend-planned`,
  `--warning-chip-{bg,border}` (dark bg #1c1608 MEASURED from the
  map·dark panel — the plan expected a derivation), 
  `--provenance-unverified`, six map shadows (none in dark except the
  focus composite), map micro-type (10.5/9.5/13), wipe duration.
  index.css: @theme mappings for the new families + the inert §06 set
  landed LIVE, `map-canvas-grid`, `map-drift-ring`, `map-node-selected`,
  `icon-stroke` utilities, `map-teal-wipe` keyframes. Grep gate: zero
  arbitrary values in the diff; `bg-warning` unminted in built CSS.
- **§7 ADR-016.** Purpose-built `MapProvenanceMark` (12/14px) instead
  of reusing ReviewBadge — the badge lives in C-08's `board/badges/`,
  and §2 deliberately declares only C-05 + C-09 as the map's imports;
  importing it would ship a born-drifted C-12→C-08 D1 in the hero (the
  executor's-call the plan reserved, decided on the dependency ledger;
  ReviewBadge itself is untouched). Same `--review-*` tokens
  (value-identical to the bundle's `--provenance-*`), two marks +
  unverified dashed ring; three-way distinction in hover TEXT +
  the overlay's "N of M tasks independently checked" line + the panel
  provenance sentence. Legend collapses to checked / self / unverified.
  A `modelWord` twin for task-row badges exists for the same fence
  reason (~12 lines, board-model is C-08's).
- **§8 tests.** 119 new app tests (26 layout + 39 visuals + 7 search +
  10 store/hostility + 25 map DOM + 4 switcher + 8 dogfood-render;
  above the plan's ~45–60 estimate — the DOM surface wanted more
  pinning, none of it filler), +9 cargo (4 collector + 5 index_cmd
  incl. the live loop-termination integration test). Dogfood fixture
  reconciled (deltas below). Built-CSS probes + served-bundle probe on
  a free OS-assigned port (50308 this run), released after.

### Registry-amendment findings deltas (changed, never loosened — each
### verified by running the derivation before writing the fixture)

Against the SAME committed 59-file graph, pre → post amendment:
- D2:unmapped [engine trio + verdicts.ts] → GONE (drained by the
  claims); unmapped node and its four edges leave the model.
- D3:C-12 → GONE (the engine trio are now C-12's files). D3 remains:
  C-01, C-07, C-11.
- D1:C-08→C-05 fileEdges 3→4 (+ board-model.ts→verdicts.ts, now a
  C-08→C-05 edge because verdicts.ts is C-05's).
- D1:C-09→C-05 fileEdges 1→2 (+ TaskDetailPanel.tsx→verdicts.ts).
- D1:C-05→C-06 (5) and D1:C-05→C-09 (3) unchanged — the four D1s are
  the hero's launch data, deliberately undrained.
- Relation table 24→23 rows (9 confirmed / 4 undeclared / 10 planned;
  was 7/8/9): −4 unmapped rows; +C-05→C-12 CONFIRMED 6 (the four
  architecture tests' six file edges, now declared); +C-12→C-05 planned
  0 and +C-12→C-09 planned 0 (newly declared, unobserved until this
  branch's code is indexed at merge); C-12→C-06 planned 0 → CONFIRMED 1
  (derive.ts→@nputer/parser now counts as C-12's).
- Mapping counts: C-05 21→22 (verdicts.ts), +C-12 3 (engine trio);
  59 total unchanged. driftSources [8]→[6]; declaredOnly loses C-12.
- The C-05↔C-12 and C-08↔C-09 declared cycles break drift-neutrally at
  the lowest-id targets (C-12→C-05, C-09→C-08 cut for columns, still
  drawn) — layout-verified in the hero render.

### Smallest reasonable choices at genuine silences (the record)

- **Status-word placement reconciliation**: the criterion prose says
  "meta + live status word when not planned", but the hero puts
  verifying's word beside the pulse dot top-right and shows NO word on
  done. Read as: the live word = the four in-flight statuses;
  building/rejected on the meta line, verifying/merging beside their
  dot (hero-exact). Composed right-slot order extends the plan's rule:
  drift count · dot+word · provenance mark · pin.
- **Pin beats declared-only**: C-01 is live-dogfood BOTH pinned-done
  and D3-declared-only; plan §8 names the hero "C-01 pinned+done, C-07
  declared-only" as distinct states, so a pinned component renders its
  status fill (the architect's word) while the D3 ring keeps the
  no-files tension visible. Unpinned declared-only stays outline-only.
- **Dark arrowhead pair bundle-true**: the plan's §6 lists
  `--map-arrowhead` dark #3a3a3a / planned #4a4a4a; the map·dark source
  markers are confirmed #4a4a4a / planned #3a3a3a (confirmed the more
  visible on near-black, coherent with light). The bundle wins
  (transcription correction, per the plan's own spec-of-record order).
- **Legend planned swatch**: measured #b0b0ae/#4a4a4a as
  `--map-legend-planned` (the strip's dotted swatch is deliberately
  darker than the edge stroke); legend swatches are inline SVG lines.
- **Placeholders (D5 targets) share the declared-only treatment**
  (exists-on-paper family); the derived rejected/merging meta inks and
  dark unverified-ring/edge-hover values are derived one-steps, flagged
  to the screenshot pass as the plan states.
- **No-graph mode fills planned** (the mock's "declared components
  only, every edge planned") — the outline-only treatment belongs to
  full-mode `declaredOnly`.
- **Edge-count ink** reuses `--secondary-foreground` (value-exact to
  the mock's #404040 in light); **rail inactive inks** ride
  `--muted-foreground` (label mock-exact light; icon one step from
  #a3a3a3) and the active bg is `--sidebar-accent` (one step,
  plan-disclosed); mock 9px pills map to the 10px radius step (the
  Button precedent the plan blessed); 19px wordmark/panel-name → 2xl,
  panel prose 13.5 → base, section labels 10 → xs (plan-disclosed
  role mapping); node micro-type exact (10.5/9.5/13 tokens).
- **Search**: substring match, components before files, cap 20
  (`SEARCH_CAP`), no regex (hostile queries inert); popover dismissal =
  blur/Escape-with-stopPropagation/result-mousedown; ⌘F/Ctrl-F focuses
  the field while the map is mounted (bundle-named, fence-free).
- **Unmapped face**: base view shows `—` id + the grouped finding rule
  (`D2`) at the drift slot (the mock's D-2 hyphen ids are indicative;
  ours are the real rule ids); drift overlay promotes to warning border
  + file count (mock-exact).
- **Panel finding scope**: node ring/count = source-attributed findings
  (T-011's driftSources semantics exactly: D1/D5 by source, D3 by
  subject, D2 on the bucket; D4 never rings); the PANEL additionally
  explains D4 to both claimants (explainability without contradicting
  T-011's deliberate no-ring stance).
- **`observed` relation** (inferred degraded mode only) renders as the
  confirmed stroke — reality-only is not drift.
- **Same-column edges** bow beside the column at stub distance
  (right-side orthogonal elbow, clear of every node box; none exist in
  the dogfood — geometry unit-tested).
- **Zoom** is cursor-anchored ctrl/pinch-wheel (macOS trackpad pinch
  arrives as ctrl+wheel); plain wheel pans.
- **Wipe mechanics**: the overlay carries the PREVIOUS fill anchored
  right, animating scaleX 1→0 over 400ms (visually identical to teal
  wiping in from the left) with a `scale-x-0` base class — under
  reduced motion the animation strips and the base hides the overlay,
  so the static color swap needs no JS branch.
- **Tailwind scanner hygiene** (discovered, worth the verifier's note):
  Tailwind v4's automatic source detection scans test files, so a
  literal utility-shaped string in a TEST (a `[class*="…"]` selector, a
  banned-class guard string) MINTS that utility into the built CSS. Two
  such candidates were assembled at runtime instead; the built-CSS
  probes now prove all motion motion-safe-gated and `bg-warning`
  unminted.

### Per-criterion verification (command → result)

1. **Map renders every declared component, styled per relation, seven-
   rule layout, zero deps** — `npx vitest run test/map-dogfood-render`
   → 8/8: nine nodes full-mode, 23 edges (4 undeclared dashed-warning),
   C-12 rendering its LIVE rollup on its own map (churn-proof against
   this very task's status flips — the fixture contract), C-05 panel on
   its two real D1s;
   `test/map-layout` → 26/26 (determinism deep-equal, longest-path
   table, lowest-id cycle cuts incl. nested SCC rounds, append-only
   registry-growth attack, hero-exact elbow paths, rule 8,
   observed-never-moves); package.json diff EMPTY (zero new deps);
   legend + search over components/files live (symbol search absent).
2. **Overlay control: status/provenance/drift functional; drift never
   overlay-gated; legend follows; churn + lens absent** —
   `test/map-view-dom` overlays block → provenance: mark-or-ring on
   every declared node, edges muted, rings survive; drift: clean 40%,
   bare numerals, bucket promotion, footer; visuals unit "drift renders
   in EVERY overlay"; the control renders exactly three segments (DOM
   assert), no lens control anywhere.
3. **Shell pane switcher, board unchanged** — `test/map-shell-dom` →
   4/4 through the REAL store via the browser harness: rail only when a
   project is open, board|map only, header buttons byte-identical
   across panes, board suite untouched (board-truth 21/21 e.a. — full
   suite 375/375).
4. **Click/keyboard-activated panel with §6.3 contents, placeholders
   never errors** — map-view-dom panel block: sections + placeholders,
   unmapped/pinned variants, trusted-order task-row re-target to the
   real TaskDetailPanel, node-press switching, chrome exemption, Esc
   layering; MapNode is a real `<button>` (Enter/Space native).
5. **Amber vs amber at a glance, both schemes, composed** — machine
   half: built-CSS probe proves `--warning` ≠ `--status-building-bg` /
   `--status-verifying-bg` in BOTH scheme blocks (#b3600a/#f0a63c vs
   #fdeecb/#2a2008, #fce6d2/#2c1a0c); ring composes on building AND
   done (DOM + unit). THE GLANCE IS @human (below).
6. **prefers-reduced-motion static equivalents** — built-CSS probe:
   every motion-starting `animation:` declaration sits inside
   `@media (prefers-reduced-motion: no-preference)` (the only two are
   status-pulse and map-teal-wipe); the wipe's `scale-x-0` base makes
   the reduced path a pure color swap; pulse dot count == 2, dots only.
7. **No undesigned states** — the sixteen-state table is exhaustive
   over DerivedComponentKind × status × flags (visuals unit table);
   placeholder/pin-vs-declared-only reconciliations recorded above;
   every edge relation (incl. degraded `observed`) has a treatment.
8. **Tokens-only; new tokens as design-pass values, mechanism
   unchanged** — grep gate zero `-[` arbitrary values in the diff;
   all values in tokens.css annotated with sources; mechanism only in
   index.css; `bg-warning` unminted (probe); §06 inert set now live.

Suites (ADR-011 order): lib/parser `npx vitest run` 132/132 + `tsc
--noEmit` clean + `npm run build` clean (lib/parser zero-diff);
app `npm ci` + `npm run build` clean + `npm test` **375/375** (256
baseline + 119); bare `cargo test` **109 passed** (100 baseline + 9) +
2 ignored (perf release-only, self-graph byte-compare). Ignored
self-check `cargo test --release -p nputer-index --test self_graph --
--ignored` → **FAILED as expected and required** on this branch (nine
new TS files; regen is the integrator's at merge, T-009-s1).

**Measured payload (plan §4 honesty)**: graph.json 197,398 raw bytes →
**220,465 bytes** as the serialized `{path, content}` snapshot entry
(JSON escaping) riding EVERY docs push. Acceptable at docs-tree scale;
the loop-termination brakes mean an unchanged tree ships nothing.

**ACL/CSP zero-diff**: `git diff main...HEAD` on capabilities/,
tauri.conf.json, both npm lockfiles, lib/parser/**, board/**, ui/**,
crates/** → EMPTY. Regenerated (gitignored) gen/schemas/
capabilities.json carries exactly `core:default`. The runtime ACL
probe (index_repo reachable with zero grants; plugins still denied)
is the verifier's, per plan §10 flag 3 — `strings` proves nothing
(CONVENTIONS gotcha).

### Flags for the verifier

- The §10 attack surface as planned; additionally: (a) the Tailwind
  test-scanner hygiene note above — grep the diff for utility-shaped
  literals in tests if you extend the suites; (b) layout memoization is
  render-time keyed on `layoutKey` (a ref cache, not useMemo) — the
  probe is "same key ⇒ positions deep-equal", pinned in unit tests;
  (c) MapPanel is 480px (`w-120`) while the board's task panel stays
  600px (`w-150`) — both by their specs; (d) the edge-hover count chip
  shows only on lifted edges with observedCount > 0.
- jsdom cannot execute the CSS: state-class assertions are class-name
  level; the computed-style truth lives in the built-CSS probes.
- The loop-termination test waits real debounce windows (~3s total);
  under extreme CI load the 6×debounce negative window is the flake
  surface (extend before doubting the brakes — the suppression stdout
  lines are the evidence trail).

### @human (left open, as the plan directs)

- **The at-a-glance amber judgment** (criterion 5's human half): the
  drift-amber stroke vs building/verifying-amber fills, BOTH schemes,
  including composed building+drift on one node — machines pinned
  value distinctness; the glance is yours. The dogfood hero renders it
  live (C-05 building+ring pre-merge… post-merge C-12 building+clean;
  C-01/C-11 done/building+ring).
- **The launch-shot re-judgment** (T-006's pending screenshot predates
  the rail): the light+dark launch screenshots now include the 72px
  rail — re-judge composition.

### Suggestions filed

- T-012-s1-map-tasks-lens (at dispatch, per plan §9): the bundle's
  "map · tasks" screen as a promotable second lens.

## Verdicts

2026-08-15 — claude-fable-5 @fresh (verifier, same-model as builder): APPROVED

Suites reproduced fresh, ADR-011 order: lib/parser `npm ci` +
`npx vitest run` **132/132** + `tsc --noEmit` clean + build clean
(lib/parser zero-byte diff); app `npm ci` + `npm run build` clean +
`npm test` **375/375**; bare `cargo test` **109 passed + 2 ignored**
(29+68+3+7 across suites; perf + self-graph ignored). The ignored
self-check `cargo test --release -p nputer-index --test self_graph --
--ignored` is **RED with exactly the required assertion** ("committed
docs/architecture/graph.json is stale — regenerate deliberately…") —
nine new TS files on the branch; the regen is the integrator's at merge
(T-009-s1) and nothing else fails. Re-run green after every probe of
mine was reverted.

**Layout, attacked with my own adversarial suite** (14 probes, all
held, then deleted): determinism twice AND under shuffled input order
(same graph, same picture, same layoutKey); a 40-deep chain (cols
0–39); a diamond whose longer arm pushes the join (longest-path
verified); a 3-cycle cut ONLY at the edge into the SCC's lowest id; an
overlapping-2-cycles SCC that needs two cut rounds (C-02→C-01 then
C-03→C-02, all four edges still drawn, `cycleBroken` marked); two
disjoint cycles cut independently; registry growth 12→45 components
with every prior position deep-equal (append-only holds structurally:
id-ascending rows + bottom-append); observed `declared:false` edges
added everywhere moved no real node; rule 8 (partner-max+1, no-partner
col 0, bottom-append below a higher-sorting real id); hostile inputs
(unknown endpoints skipped, `__proto__`/`constructor` ids inert, self
and duplicate edges no-crash); and the hero elbow claim reproduced
byte-equal from the geometry constants — `M192 73 H216`,
`M408 223 H420 V73 H432`, `M624 73 H636 V223 H648`, and the back edge
`M528 106 V148 H312 V190` — plus the same-column bow
(`M192 73 H204 V223 H192` shape) the dogfood never exercises.

**Registry amendments + fixture, audited by re-derivation**: the §2
edits are plan-exact plus the two path claims
(`app/src/lib/architecture/**`, `app/src/lib/verdicts.ts`) whose
authority chain I verified in the repo record — STATE.md's dispatch
note ("that decision plus a verdicts.ts claim drains the D2 group") and
the fixture's own header; option (b) appears nowhere in plan §10's
surface and could never drain verdicts.ts. Every enumerated delta
CONFIRMED against the committed 59-file graph with my own edge counts:
C-05→C-12 confirmed **6** = exactly the six `f:` test→engine import
edges (derive.test ×2, dogfood ×2, glob.test, graph.test); C-12→C-06
confirmed **1** = derive.ts → `p:@nputer/parser` (package path
lib/parser); D1:C-08→C-05 3→4 = board-model.ts→verdicts.ts (real
import, line 8); D1:C-09→C-05 1→2 = TaskDetailPanel.tsx→verdicts.ts
(real import, line 10); D2 and D3:C-12 drained; relation table 23 rows
= 9/4/10; D1:C-05→C-06 (5) and C-05→C-09 (3) untouched. The fixture
diff is line-by-line enumerable — changed, never loosened.

**Sixteen states + fidelity, my own DOM probes** (16, all held, then
deleted): building+drift and done+drift compose with the fill class
intact and the ring as `map-drift-ring`; the built CSS proves the ring
is `outline: 1.5px dashed var(--warning); outline-offset: 3px` — a
stroke that cannot move the box, and the DOM box is byte-identical
(192×66) ringed or not; pinned beats declared-only (C-08 fixture:
status fill + `pin` word + D3 ring all at once — C-01 is the live
dogfood twin, `status: done` pinned in its file); pulse rides exactly
one element and it is the 5px dot, never a node; dimming is
`opacity-32` with fill classes untouched; selection is the compound
border with the box unchanged and **inverts to bone in dark**
(`--map-node-border-selected` #171717/#ededed in built CSS); the
provenance twin renders 12px base / 14px overlay, two marks + the
unverified dashed ring only in the overlay, with the three-way
distinction in hover TEXT (independent / same-model / self-verified
phrases + the "N of M tasks independently checked" line); drift is
never overlay-gated (ring survives all three modes; drift mode dims
clean nodes to opacity-40, bares the numeral, prints the footer);
legend follows the overlay (status swatches → checked/self/unverified →
drift footer); the teal wipe is first-render exempt, keyed per
transition, carries the OLD fill, and sits under
`motion-safe:animate-map-teal-wipe` with the `scale-x-0` base; degraded
trio all render (no-graph → index-not-run + Run index; unreadable graph
→ the regeneration line; no-components → `~` inferred pseudo-components,
never blank); panel placeholders in every empty section (and a
paper-only component correctly earns its honest D3 as a fact, not an
error); the task row re-targets to the REAL TaskDetailPanel under the
trusted event order (pointerdown decides, click activates), node→node
press switches, chrome and legend are `data-panel-exempt`, search
Escape self-closes without costing the panel, bare-canvas pointerdown
closes and clears selection in one state; exactly three overlay
segments (status · provenance · drift), no churn, no lens control;
roving tabindex keeps exactly one node tabbable.

**THE ARROWHEAD RULING** (my own extraction from the bundle source):
`nputer app.dc.html` defines `mapArrowD` fill **#4a4a4a** (confirmed,
dark) and `mapArrowPlannedD` fill **#3a3a3a** (planned, dark) — the
plan §6 pair IS transposed against the source, and the executor's
bundle-wins correction is RIGHT. tokens.css carries the bundle-true
values in both schemes (light #b8b8b6/#cfcfcd verified too), and the
planned marker's smaller 6px width (vs 6.5) is also bundle-true
(`markerWidth="6"` in source, matched in MapEdgeMarkers). Every other
claimed-measured value I spot-checked exists verbatim in the bundle
source, including the dark `--warning-chip-bg` #1c1608 the plan
expected to be derived.

**Security sweep** (mandatory pass, all clean):
- ACL: capabilities/ zero-diff; gen/schemas/capabilities.json DELETED
  AND REGENERATED by my own build = exactly
  `{default: {…, local: true, windows: ["main"], permissions:
  ["core:default"]}}`, no `remote` key. My own runtime probe per the
  T-007-s2 protocol (temporary MockRuntime test, since reverted):
  shipped authority reconstructed through
  `Resolved::resolve(acl-manifests.json, capabilities/default.json)`,
  installed via `runtime_authority_mut`, real dialog plugin registered,
  real InvokeRequests — **`index_repo` reachable with zero grants**
  (stub marker returned), `docs_snapshot` positive control reachable,
  eleven plugin commands (dialog open/save/message/ask/confirm, fs
  read/write/read_dir/remove, opener open_url/open_path) ALL denied,
  and from `https://evil.example.com` even the app's own commands are
  rejected (local-only capability). Authority-level cross-check: no
  dialog/fs/opener command resolves while `plugin:event|listen` does.
  `strings` was not consulted (proves nothing — CONVENTIONS).
- CSP zero-diff (tauri.conf.json untouched). Cargo.lock delta is the
  single `nputer-index` path-dep line — zero new external packages.
  `index_repo` takes zero webview arguments by construction.
- Collector: containment-first verified in code (predicate runs on the
  post-canonicalize relative path) and in the suite (symlinked .json
  never followed, oversized skipped like .md, docs/foo.json and
  `docs/architecture.json` prefix-trick excluded).
- Hostile rendered content: my probes injected `<script>`,
  `<img onerror>`, an RTL override, a 10k-char name, and a hostile file
  path — text nodes only, zero injected elements, `window` unpolluted;
  `__proto__` graph ids inert end to end (ADR-009: every file-keyed
  collection in the new code is a Map; the only `Record`s are keyed by
  the closed six-status union). Diff-wide grep: zero `innerHTML` /
  `dangerouslySetInnerHTML` / `eval`; zero `-[` arbitrary values.
- `--warning` is a stroke: `bg-warning` is UNMINTED in the built CSS
  (the only bg match is the sanctioned `.bg-warning-chip` tint); the
  two motion-starting animations (status-pulse, map-teal-wipe) are the
  only ones and both sit inside
  `@media(prefers-reduced-motion:no-preference)`.
- Pure-lens: the map writes nothing; the one write path is
  `index_repo`'s ADR-014 graph write in Rust, exactly as chartered;
  no layout.json anywhere (T-015's).

**Loop termination, live**: the pinned
`reindex_emits_once_then_never_again` reproduced fresh (armed watcher →
one emit carrying graph.json → 6×debounce silence → `changed:false` →
provable silence), and MY OWN third-leg variant (temporary, since
reverted) — touch `src/a.ts`, re-index → `changed:true` + **exactly one
more emit** whose graph differs and carries the new symbol, then
silence again. All three brakes observed end to end. **Payload
reproduced to the byte**: 197,398 raw → **220,465** serialized
`{path, content}` snapshot bytes. Judgment: the graph now dominates the
docs snapshot (~10× the markdown) but rides only on real changes, the
brakes guarantee an idle tree ships nothing, and the 1 MiB collector
cap bounds growth with a designed degraded state plus the header's
"over the snapshot cap" honesty — acceptable at this scale, honestly
measured (the frontend's duplicated cap constant is T-012-s3).

**Boundary**: `git diff main...HEAD` (8 commits f8046fa→eaf81c6,
merge-base 7ca2ec1) = the §10 expected-surface list exactly, plus the
plan-sanctioned T-012-s1 suggestion file; ZERO diff on capabilities/,
tauri.conf.json, package.json + both npm lockfiles, lib/parser/**,
board/**, ui/**, crates/nputer-index/**; committed graph.json untouched
on the branch (the integrator's regen at merge, correctly left).

**@human — carried forward, not attempted** (the two visual judgments
this verdict cannot close):
1. **The at-a-glance amber judgment** (criterion 5's human half): drift
   stroke vs building/verifying fills, BOTH schemes, including composed
   building+drift on one node. Machines pinned value distinctness
   (#b3600a vs #fdeecb/#fce6d2 light; #f0a63c vs #2a2008/#2c1a0c dark);
   the glance is yours. The dogfood hero renders it live.
2. **The launch-shot re-judgment** (T-006's pending screenshot predates
   the rail): light + dark launch screenshots now include the 72px
   rail — re-judge composition.

Suggestions filed (non-failures): T-012-s2 (pin the touch-then-reindex
third leg), T-012-s3 (single-source the collector cap constant),
T-012-s4 (layoutKey separator hygiene for hostile inferred ids). All
verifier probes reverted; tree clean; no processes or ports left
behind; port 1420 never touched.
