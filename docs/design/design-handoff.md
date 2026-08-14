# nputer — design handoff (input for T-006, design language pass)

Prepared 2026-08-14 by the architect session for an external design pass
(Claude Design). Everything the UI needs is inventoried here; the design
comes back as **token values + component specs**, and T-006 applies it.

## 1. What you are designing

nputer is a local-first desktop app (Tauri 2: real window, macOS/Linux/
Windows) for running software projects built by AI agents. It renders a
project's plain-markdown files as a living **story map board**: feature
columns, task cards that change color as agent sessions build, verify,
and merge them, and — later — the planning interview, debate rooms, and
session registry. The product's identity: **beautiful app, boring
files**. The app is a pure lens over markdown in a git repo; if nputer
vanishes, the project lives on.

Audience: technical builders who live in terminals and have an AI
coding CLI installed. The design bar (decided, ADR-007/008):
**macOS-grade polish on web tech** — restraint over decoration,
data-dense but calm, credible to someone who judges tools by their
sharpness. House voice: lowercase wordmark "nputer" (computer minus
"co"; sibling of "Omputer"), dry wit welcome, never cute.

**The one screenshot that matters:** the board rendering nputer's own
repo — feature columns F-01…F-05, seven task cards, teal filling in
top-down. That image is the launch post (T-006 acceptance criterion:
"screenshot-ready"). Design for that moment first.

## 2. Non-negotiables (constraints the design must fit)

1. **Everything lands as design tokens.** The app's CSS mechanism is
   frozen: every color/spacing/type value resolves to a CSS custom
   property in one file (`tokens.css`); Tailwind defaults are disabled
   and re-derived from tokens; arbitrary one-off values are banned and
   do not compile. Deliver **values for the token schema in §5**
   (+ optionally new tokens: name, purpose, both schemes). No raw CSS,
   no per-element styling that bypasses tokens.
2. **Light AND dark are both first-class.** Same token names, two value
   sets. The app class-toggles `.dark`.
3. **Provenance honesty is a design principle, not a decoration.** A
   task verified by an independent model, by the same model in a fresh
   session, and by the builder itself must be **visually distinct at a
   glance** — "a green check from the author's own session is never
   visually identical to independent eyes." Weakest guarantee should
   read subtly warier, without shouting.
4. **Status colors are a deliberate palette** — six statuses (§4.2), a
   family with intent, not component-kit defaults. Progress on the
   board reads as color filling columns top-down; "done below
   not-done" should feel subtly wrong (it signals plan disorder).
5. **Motion is modest.** One pulse animation exists (opacity
   oscillation on "verifying"/"merging"); `prefers-reduced-motion` gets
   a static fallback (already mechanized). Nothing else moves unless
   it earns it.
6. **Fonts must be bundleable locally.** The app ships with a strict
   CSP and loads nothing remote — no Google Fonts links, no CDN. Pick
   families available for local bundling (open license) or system
   stacks. (A Geist dependency was deliberately removed to leave this
   choice to the design pass.)
7. **Contrast:** every `-fg` on its `-bg` pair should hold WCAG AA
   (≥4.5:1 body, ≥3:1 large/badge text), both schemes.

## 3. Screen inventory

### 3.1 Built today (design these fully)

**App shell** — Tauri window titled `nputer` (800×600 default,
resizable; macOS traffic lights). Header bar: project folder path,
counts line ("16 tasks · 5 features"), theme toggle button, and a
**parse-error chip** ("N parse errors" + tooltip + "(showing last
valid state)" strip) that appears when a file on disk is broken —
non-blocking, calm, honest.

**Story map board** (home view, the launch screenshot):
- **Feature columns** in roadmap order; dark header with F-ID + name.
- **Task cards** under each column, priority order (1 = top); cards
  keep their slot when done (color fills in, nothing moves).
- **Milestone slice line** across the columns — everything above ships
  in milestone 1; labeled once ("milestone 1"), leftmost.
- **Ghost cards** (suggested tasks): dashed, minimal face, column
  bottom — ideas that are not yet commitments.
- **Parked row** per column: collapsed "N parked".
- **Unmapped column** (conditional, last): cards whose feature is
  unknown + suggestions with no feature — visible, never dropped.
- **Empty states**: a feature with zero tasks (real today: F-01)
  renders header + empty column; an empty model renders a minimal
  "no features found" line.

### 3.2 Milestone 1, next tasks (design now, built next)

**Card detail panel** (T-005) — opens on card click: acceptance
criteria (EARS lines, monospace-friendly), blocked_by (linked cards),
touches, **verdict history verbatim** (dated entries, APPROVED /
REJECTED with long technical text), built_by / verified_by / review
stamps. Sections may be empty — placeholder, not error. Live-updates
while open.

**Open-a-folder flow** (T-007) — folder picker; friendly empty state
when a folder has no `docs/` ("what it looked for", no crash, no
blank); default state = the app opened on its own repo.

### 3.3 Future panes (set the direction; don't pixel-perfect)

- **In-app interview** (the demo moment, highest design stakes later):
  split view — planner chat left (one question at a time, streaming),
  the board **materializing live** on the right as answers land.
- **Architecture map**: rendered component graph, nodes colored by
  build status (progress heatmap); click → component details, linked
  decisions, tasks.
- **Rooms**: file-backed threads rendered as chat — role/model/session
  attribution per turn, @mentions, "@human pauses the thread" state,
  resolved rooms collapse to a **Resolution card** (question /
  decision / why); the pane doubles as a browsable decision log.
- **Sessions**: registry list — model, tasks built, turn count,
  **sediment warning** past a turn threshold, kill switch (killing is
  safe by design — the UI should make that feel true).
- **Dispatch controls** (on expanded cards, later): builder/verifier
  selectors (model → fresh | registered sessions with history),
  dispatch button, locked-while-building state.
- Secondary views: pipeline kanban filter; dependency graph with
  critical path.

### 3.4 Planned features beyond the panes — stress-test the language, don't design the screens

These exist in the roadmap/parked plans (docs/future.md, ADR-008, the
market steal list). Deliver NO mocks for them — but the token system
and component language you deliver should not break when they arrive:

- **Welcome / "New project" entry** (the app's actual front door:
  welcome → board or → interview; plus an "adopt existing repo"
  archaeology variant driven by `[?]` uncertainty markers).
- **Drag as the write path**: cards will become draggable (reorder =
  priority write; dragging below the slice line = scope-cutting made
  physical; locked while building). Cards should look grabbable
  without being noisy.
- **Verdict + diff review surface**: reading a rejection with its
  repro, and reviewing a diff, deserve the same design quality as the
  board ("review is the product surface").
- **Cost telemetry on cards** (v0.2): a cost figure next to the model
  badge, milestone budget burn on the board, estimated cost before
  dispatch — the card face must absorb one more number gracefully.
- **Pocket cockpit** (v0.2): a mobile digest (pending approvals,
  escalations, rejections; approve/reject from the phone). The
  language must degrade to narrow viewports without redesign.
- **Calibration scorecards** (v0.2): per-model track record shown in
  builder/verifier selectors.
- **Time machine** (v0.3): a replay scrubber across board /
  architecture / rooms states — chrome should leave it somewhere to
  live.
- **Handoff score** (v0.3): one project-health score with drill-down
  (criteria without tests, stale docs …).
- **Dry run** (v0.3): milestone simulation — critical path, cost
  forecast. **N-version** (v0.3): side-by-side comparison of 2–3
  parallel builds of the same task.
- **Truth maintenance** (horizon): contradicted premises light every
  downstream decision **amber** — the palette needs a warning
  semantic that is NOT the same amber as "building/verifying".
- **Explainer** (horizon): an "explain this to me" affordance
  recurring on every verdict, resolution, and ADR — a small atom that
  needs a consistent, unobtrusive home on dense surfaces.
- Synthetic-user reports arriving as suggestion ghosts; a seed
  library at project creation; a generated proof-of-process dossier
  (document styling, not app chrome).

Concrete stress tests to apply before delivering: (1) card face +
cost number + calibration hint — still calm? (2) warning-amber vs
building-amber — distinguishable at a glance in both schemes?
(3) board at 375px width — does the language survive? (4) one more
persistent chrome element (scrubber) — where would it go?

## 4. Component inventory (all states)

### 4.1 Task card anatomy
id (e.g. `T-004` — mono works well) · title · size chip `S`/`M`/`L` ·
model badge (short model name: "fable", "codex", "gemini"…; shown when
a builder is assigned or after completion) · review badge (§4.3, done
cards only) · status coloring per §4.2. Hover/focus states; keyboard
focusable (detail panel opens on click/Enter).

### 4.2 Status system (6 + 2 render modes)
| status | current placeholder | motion |
|---|---|---|
| planned | neutral gray | — |
| building | amber | — |
| verifying | amber | pulse |
| rejected | red | — |
| done | teal | — |
| merging | teal | pulse |

`verifying`/`building` and `merging`/`done` currently share values and
are distinguished only by pulse — **diverge them** so each of the six
reads at a glance. Plus two render modes that are not colors:
suggested = dashed ghost; parked = collapsed row.

### 4.3 Review badge (the honesty trio)
Three structurally different marks (currently circled checks): filled =
independent review · half-filled = same-model review · outline +
warning tint = self-verified. Design freedom on the marks; the
requirement is **instant, unmistakable distinction** and a trust
gradient (independent reads most solid).

### 4.4 Chrome & primitives
Buttons (shadcn base — must not look like stock shadcn when done),
tooltip, chip/badge shapes, links, scrollbars in long columns, the
parse-error chip (uses `--destructive`), theme toggle, panel/drawer
for T-005, dividers (`--border`), focus ring (`--ring`).

## 5. Token schema (deliver values for exactly these)

Format: CSS custom properties, oklch preferred, one set for `:root`
(light), one for `.dark`. Current placeholders are shadcn-neutral —
replace freely; names are fixed.

**Core color** (shadcn-derived, all in use):
`--background --foreground --card --card-foreground --popover
--popover-foreground --primary --primary-foreground --secondary
--secondary-foreground --muted --muted-foreground --accent
--accent-foreground --destructive --border --input --ring
--chart-1…5 --sidebar --sidebar-foreground --sidebar-primary
--sidebar-primary-foreground --sidebar-accent
--sidebar-accent-foreground --sidebar-border --sidebar-ring
--static-white --static-black`
(chart/sidebar sets are for the future panes — keep them coherent with
the family even if provisional.)

**Status** (bg+fg pairs, both schemes):
`--status-planned-bg/-fg --status-building-bg/-fg
--status-verifying-bg/-fg --status-rejected-bg/-fg
--status-done-bg/-fg --status-merging-bg/-fg`

**Type**: `--font-sans-stack --font-mono-stack` (real family choice is
YOURS — see constraint §2.6; mono matters: ids, criteria, file paths) ·
weights `--weight-normal/-medium/-semibold/-bold` · scale
`--text-xs/sm/base/lg/xl/2xl/3xl` (each `-size` + `-line`; extend scale
upward only if a screen needs it, as new tokens).

**Geometry**: `--spacing-unit` (base unit behind every spacing/size
utility; 0.25rem today) · `--radius`.

**Motion**: `--pulse-duration --pulse-opacity-dip`.

**New tokens** are welcome (e.g. shadows/elevation, column header
treatment, ghost-card border style): name + purpose + both schemes.

## 6. What to deliver back

1. **The token sheet** — every token in §5, light + dark, paste-ready
   in the CSS custom-property format above.
2. **Type decision** — families + weights + bundling/license note.
3. **Status palette** — the six, diverged, with one line of intent per
   color.
4. **Board mock** — the launch screenshot composition: nputer's own
   repo (F-01…F-05 columns; F-02 holding T-001…T-007 with T-001–003
   teal/done, T-004 amber, rest gray; ghosts + parked present).
5. **Card + badge spec** — card anatomy at rest/hover/focus; the
   review-badge trio; ghost + parked treatments.
6. **Detail panel + empty states** — T-005 panel layout; T-007 empty
   state; parse-error chip treatment.
7. *(Directional, optional)* interview split view, rooms, sessions —
   one mock each to prove the language scales.
8. *(Optional)* app icon direction — the dock/taskbar face of
   "beautiful app, boring files".

## 7. Open design questions (yours to answer)

- Typeface identity: system-stack neutrality vs a bundled family with
  personality (mono-forward?). The wordmark is lowercase "nputer".
- How dark is the dark header of feature columns — and does light mode
  keep dark headers (current design of record says yes)?
- Density: how compact can cards get before the board stops feeling
  calm? (Real boards will hold 30–60 cards.)
- The pulse: keep opacity oscillation, or propose a calmer "alive"
  treatment (border shimmer, dot)? Reduced-motion fallback must exist.
- Personality budget: where does the one moment of delight live
  (theme toggle? done-state? the slice line?) — pick one, not five.

## 8. Acceptance criteria this design feeds (T-006, verbatim)

- THE app SHALL apply a coherent nputer visual identity — typography
  scale, color system (incl. the five status colors as a deliberate
  palette), spacing, dark/light — defined once in the design tokens
  file and used exclusively (no ad-hoc styles).
- WHEN the board renders the nputer repo itself THE result SHALL be
  screenshot-ready: the launch-post image is this screen.
- IF a shadcn default remains visibly unstyled THEN the pass is not
  done (acceptance is a deliberate look, not a component kit's look).
