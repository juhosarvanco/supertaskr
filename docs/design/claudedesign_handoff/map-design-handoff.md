# nputer — architecture map: design handoff (input for Claude Design)

Prepared 2026-08-15. Companion to the T-006 design handoff; everything there
(§2 non-negotiables, §5 token schema, house voice) still applies. This
document adds **one pane**: the architecture map. Design comes back as token
values + component specs + mocks; the coding session applies them.

## 1. What you are designing

The **architecture map** is nputer's second hero surface after the board.
The board shows *what is being built*; the map shows *what the system is,
how far along each part is, and where the code has quietly drifted from the
plan*. Think "Google Maps of the codebase" — a stable map you zoom into, with
layers you toggle — but rendered in nputer's language: restraint, density,
calm.

Two layers, drawn together, are the entire idea:

- **Intent** — the components and dependencies the architect declared (one
  markdown file per component; boring files).
- **Reality** — the files, symbols and dependencies an indexer parsed from the
  actual code.

Where they agree the map is solid. Where the code has an edge the plan doesn't
know about, or files no component claims, the map lights it **amber = drift**.
Each component's **fill color is its build status**, derived from the tasks on
the board that touch it — the same six-status family — so the architecture
fills in teal as the board completes. Each component also carries the
**review-provenance mark** (the honesty trio): a component built only under
self-verified tasks must never look as trustworthy as one checked by
independent eyes.

**The screenshot that matters:** nputer's own repo at the component tier —
eight-ish nodes, a few teal, one amber pulsing, most gray, one drift edge
dashed amber, the panel open on one component. It should read as *a blueprint
coming to life*, and a mostly-gray map on day one should feel like promise,
not emptiness.

Audience, bar, voice: identical to the T-006 handoff. Terminal-native
builders; macOS-grade polish on web tech; dry, never cute.

## 2. Non-negotiables specific to the map

1. **One semantic system.** Component fills use the existing
   `--status-*` tokens exactly as cards do. No new "map status" palette.
2. **Drift amber ≠ building amber.** Drift/contradiction uses a new
   `--warning` token that must be distinguishable at a glance from
   `--status-building-bg` and `--status-verifying-bg`, in both schemes,
   including when a *building* node has a *drift* ring. This is the single
   most important color decision in this pass. (It will later also serve
   truth-maintenance amber across the app.)
3. **Provenance honesty carries over.** The trio marks (independent / same-
   model / self) appear on map nodes and must stay instantly distinct at map
   scale (smaller than on cards, still unmistakable).
4. **Spatial stability.** The layout is deterministic and nodes do not move
   when statuses change; do not design interactions that rely on animated
   re-layout. Expanding a component grows it in place.
5. **Motion is modest.** The existing pulse (verifying / merging) is the only
   ambient motion; hover/select feedback is instant; reduced-motion gets
   static equivalents. Expand/collapse may use one short transition or none.
6. **Tokens only; light and dark first-class; WCAG AA; bundleable fonts** —
   as before.

## 3. Structure & zoom tiers

Semantic zoom is discrete: three tiers, plus continuous pan/scale.

**T0 — components (default view).** Nodes = declared components (+ one
synthetic **unmapped** node when files exist that no component claims).
Edges = dependencies, each with a *relation*:

| relation | meaning | intent for drawing |
|---|---|---|
| confirmed | declared AND observed in code | solid, default weight |
| planned | declared, not yet realized in code | faint / dotted, quiet — this is *normal* early in a build, not an error |
| undeclared (drift) | observed in code, not declared | dashed, `--warning`; counted against the source node |

Optional lanes/grouping by `layer` (ui · model · io · …) if it helps
legibility; the layout engine is layered left→right by default.

**T1 — a component expanded.** The node becomes a container showing its
files grouped by directory, intra-component edges, and stub edges to the
still-collapsed neighbors. Siblings stay where they are.

**T2 — a file selected.** Symbols and their edges are shown **in the panel**,
not on the canvas (v1). Design the panel section, not a canvas treatment.

## 4. Component inventory (all states)

### 4.1 Component node (T0)

Anatomy: id (`C-03`, mono) · name · status fill (§2.1) · provenance mark
(done components only) · drift ring/flag when it has findings · small count
badge (files, or tasks in progress — pick one; keep the face calm) · expand
affordance (double-click / keyboard; a subtle corner glyph is enough).

States: planned · building · verifying (pulse) · rejected · done · merging
(pulse) · **pinned** (status manually overridden by the architect — a tiny
"pin" hint, not a color) · **declared-only** (globs match no files — outline
only, reads as "exists on paper") · **inferred** (pseudo-component the app
made from a top-level directory when nothing is declared — dashed, ghost-like,
kin of the suggested card) · hover · selected · focused (keyboard, `--ring`) ·
dimmed (when another node is hovered and this one is not a neighbor).

Drift ring composes with any status: e.g. `done` + drift, `building` + drift.
Both must read correctly.

### 4.2 Unmapped node

The synthetic bucket for files no component claims. Should feel provisional
and slightly wrong without alarming — it *is* a drift finding (D2). Shows a
file count. Uses `--map-unmapped-*` tokens; think ghost card at map scale.

### 4.3 Edges

Three relations (§3), directional (arrowhead or taper — choose one system),
weight may scale gently with observed count (cap it). Hover an edge → it
brightens and shows the count. Edge to/from unmapped is always drift.

### 4.4 Expanded component container (T1)

Container fill `--map-group-bg`, header row (id · name · status · collapse
control), inner file nodes: path leaf (mono), directory grouping labels, tiny
status inheritance (files don't have their own status; they inherit the
component's fill at low emphasis) — keep inner nodes visually lighter than T0
nodes so hierarchy is obvious.

### 4.5 Detail panel (reuses the T-005 drawer)

Sections, in order: header (id, name, status chip, provenance mark, drift
count) · responsibility (prose) · **drift findings** (each: finding id, one
plain sentence, the files behind it; this is the section that must feel
honest and calm — a list of facts, not warnings shouting) · dependencies
(declared vs observed, with relation and counts; two columns or a
two-tone list) · tasks touching this component (compact rows: id · title ·
status · model badge · review badge; clicking opens the card panel) ·
decision records (links) · files (grouped; click → symbol list, mono) ·
churn (small sparkline or a number; optional). Empty sections show a
placeholder line, never an error.

### 4.6 Pane chrome

Header: pane title, search field (components / files / symbols), overlay
segmented control (**status · provenance · drift · churn** — status is always
the base fill; the others add rings/marks/edge styling), legend (always
visible, compact, follows the active overlay), re-index affordance with a
last-indexed hint ("indexed at a1b2c3d · 2m ago"). Leave room for the future
time-machine scrubber (T-006 §3.4 stress test 4) — say where it would go.

### 4.7 Empty & degraded states

- No architecture declared: "no architecture declared" + what it looked for
  (`docs/architecture/components/`) + the reality graph shown as inferred
  pseudo-components (dashed) so the pane is never blank.
- Index not run: declared components only, all planned, one-line note + a
  button.
- Parse errors: existing parse-error chip; last valid map stays.
- Very large repo: a quiet "symbols truncated for N files" note.

## 5. Interaction notes (design the feedback, engineering owns the mechanics)

Hover → neighbors highlighted, rest dimmed (instant). Click / Enter → panel.
Double-click / expand key → T1. Esc → collapse / deselect. Drag → node pinned
(persisted); pinned nodes may show a faint pin glyph. Search → select +
center. Keyboard: nodes are focusable; arrows walk edges. Reduced motion: no
pulse, no transitions.

## 6. Tokens to deliver (names fixed; values for `:root` and `.dark`)

Reused unchanged: `--status-*-bg/-fg` ×6, `--border`, `--ring`, `--muted`,
`--muted-foreground`, `--card`, `--font-mono-stack`, `--pulse-*`.

New — name · purpose:

- `--warning` / `--warning-foreground` · drift & contradiction amber; must
  separate from building/verifying amber in both schemes.
- `--map-canvas` · canvas background (may equal `--background`).
- `--map-grid` · optional dot/grid pattern color; may be transparent.
- `--map-node-border`, `--map-node-border-selected`, `--map-node-shadow` ·
  node chrome at rest / selected; shadow may be "none".
- `--map-edge`, `--map-edge-muted`, `--map-edge-planned`, `--map-edge-drift`
  · edge relations and dim state (`--map-edge-drift` may alias `--warning`).
- `--map-unmapped-bg` / `--map-unmapped-fg` · unmapped node & inferred
  pseudo-components (ghost-like).
- `--map-group-bg` · expanded component container.
- If you tokenize the review trio (`--provenance-independent / -same /
  -self`), the map uses the same tokens; otherwise specify the marks so they
  survive at ~12–14 px.

## 7. What to deliver back

1. **Token values** for §6, light + dark, paste-ready CSS custom properties.
2. **The hero mock** — T0 map of nputer's own repo (≈8 components: board
   renderer, model/parser, file watcher, tauri shell, tokens/theme, detail
   panel, indexer, CLI — names indicative), 3 done (teal, one with an
   independent mark, one self-verified), 1 verifying (pulse), 1 building with
   a drift ring, rest planned; two confirmed edges, one planned edge, one
   drift edge to unmapped; panel open on the drifting component showing two
   findings. Light and dark.
3. **Node spec** — anatomy + every state in §4.1, drift ring composition,
   provenance marks at map scale.
4. **Edge spec** — the three relations + hover + arrow/taper system.
5. **T1 mock** — one component expanded in place.
6. **Panel spec** — sections in §4.5 with the drift-findings treatment.
7. **Pane chrome + legend + empty states** (§4.6–4.7), and where the future
   scrubber lives.
8. *(Directional)* the drift-amber vs building-amber proof: one strip showing
   `building`, `verifying`, `building + drift`, `done + drift`, side by side,
   both schemes.

## 8. Open design questions (yours to answer)

- Drift signal: ring, corner flag, or underline? It must compose with any
  fill and survive at small sizes.
- Directionality: arrowheads (explicit, busier) or tapered edges (calmer,
  learnable)?
- Lanes by `layer`: worth the structure, or does a free layered layout read
  better at 8–30 nodes?
- Where the "one moment of delight" from the T-006 §7 budget could live if
  it lives here (e.g. the exact moment a component turns teal) — only if it
  costs nothing in calm.
- Density: how does T0 hold up at 40 components on a 13" laptop?

## 9. Acceptance criteria this design feeds (draft, EARS)

- WHEN the map renders nputer's own repo THE result SHALL be screenshot-ready
  in light and dark using only tokens.
- THE building/verifying amber and the drift/warning amber SHALL be
  distinguishable at a glance in both schemes, including on the same node.
- THE three provenance marks SHALL remain distinct at map-node scale.
- IF a component or edge state has no designed treatment THEN the pass is not
  done.
