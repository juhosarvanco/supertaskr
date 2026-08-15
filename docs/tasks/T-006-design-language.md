---
id: T-006
title: Design language pass
feature: F-02
milestone: 1
priority: 6
size: M
status: done
blocked_by: [T-004]
touches: [app-shell, app-board]
builder: claude-fable-5
verifier: claude-fable-5
built_by: "claude-fable-5 @fresh"
verified_by: "claude-fable-5 @fresh"
review: same-model
---

## Acceptance criteria
- THE app SHALL apply a coherent nputer visual identity — typography
  scale, color system (incl. the five status colors as a deliberate
  palette), spacing, dark/light — defined once in the design tokens
  file and used exclusively (no ad-hoc styles).
- WHEN the board renders the nputer repo itself THE result SHALL be
  screenshot-ready: the launch-post image is this screen.
- IF a shadcn default remains visibly unstyled THEN the pass is not
  done (acceptance is a deliberate look, not a component kit's look).

## Implementation notes

Built by executor claude-fable-5, 2026-08-15, worktree
nputer-t006 / branch t006-design-language. Spec: docs/design/
claudedesign_handoff/ ("nputer tokens.dc.html" §01–§04 + §06, "nputer
app.dc.html" tabs board / board·dark / card detail / card states /
open a folder, README type/spacing/radii/shadow tables). Values were
extracted from the HTML files' source text (the CSS sits in plain
text inside them), not from a rendered page.

**What was built**

- tokens.css: full VALUE replacement — sheet §03 core + six diverged
  status pairs (building yellow · verifying orange · done teal ·
  merging cyan), §04 additions (status borders, --column-header-*,
  --hairline, --ghost-border, --shadow-card/-pop, --review-disc/
  -mark, --radius-chip), the scheme-independent type/geometry/motion
  block (Geist stacks, 7-step scale, tracking roles, pulse 2.4s/0.45),
  and §06 (--warning + map set) landed INERT — values present, no
  utility mapped, `bg-warning` proven dead. The violet --drift-bg/-fg
  pair is deliberately absent (superseded by §06 --warning, architect
  directive). Beyond the sheet's named list, the measured card/panel
  inks are tokenized too: --status-*-title (id/title hierarchy),
  --status-*-border-strong (chip outline = hover edge, one step past
  -border), --shadow-card-hover, --verdict-{rejected,approved}-{bg,
  ink,meta}, --tracking-* roles. Sanction chain: the card-states tab
  mandates "token values only; the card never carries a one-off", and
  criterion 1 names tokens.css the single home for every value —
  tokenizing the measured inks is the only way to render them under
  the arbitrary-value ban. Verifier should eyeball the naming.
- index.css (mechanism, minimal): fonts.css import; NEW namespaces
  disabled to extend enforcement (--shadow-*, --inset-shadow-*,
  --drop-shadow-*, --text-shadow-*, --tracking-* → initial) and
  re-derived from tokens; color mappings for the new token families;
  --radius-chip. The T-001 contract survives: a stock utility with no
  token behind it produces no CSS (probed: bg-red-500, shadow-md,
  tracking-widest all dead in the served dev bundle AND dist).
- Fonts: Geist + Geist Mono VENDORED as the two variable woff2 files
  (wght 100–900, ~70 KB each) from the `geist` npm package v1.7.2,
  with OFL-LICENSE.txt beside them (app/src/assets/fonts/); @font-face
  in src/styles/fonts.css declares the sheet's exact family names.
  Zero new npm dependencies — vendoring beat fontsource because the
  fontsource packages register different family names ('Geist Sans')
  and would have added two deps for the same bytes. Vite fingerprints
  the woff2 into dist/assets → all font requests same-origin; the
  strict CSP needs no font-src loosening (default-src 'self' covers
  it). This reverses T-001's deliberate Geist removal, as planned.
- Board surfaces: header wordmark (Geist Mono 700, −0.045em) + project
  path; meta row with a derived `milestone 1 · N of M done` counter
  (done only, real tasks only); parse-error chip in the terracotta
  status-rejected family with the `· last valid state` suffix when any
  failure shows last-good; columns share width with a 320px floor
  (board scrolls sideways below it — density rule); inverted
  --column-header pill over a --hairline rule; slice line = label +
  hairline ("milestone 1 ships above", leftmost only); cards per the
  card-states anatomy (id mono/fg · title 600/−0.01em/-title ink ·
  size/model chips on -border-strong · status word for in-flight
  statuses · two-mark review badge right, done only) with all
  specified interaction states: hover (border one step darker, 1px
  lift, shadow-card-hover, grip dots — dots overlay the padding
  gutter instead of the mockup's content shift, which read as hover
  jitter), pressed (fill one step down = -border value, shadow off),
  focus-visible (2px --ring outline, offset 2, keyboard only).
  Verifying/merging pulse moved off the card onto the spec's 5px dot
  (bg --chart-4 / --chart-2 — measured to the chart ramp exactly in
  both schemes); motion-safe as before. Ghosts: dashed --ghost-border,
  no fill, title + uppercase provenance line (suggestedBy threaded
  through BoardCard). Parked: quiet planned-fill row with chevron.
  Below-slice planned cards render the mockup's muted mini variant
  (sidebar fill, id+title+`milestone N · size` meta); a live status
  below the slice keeps its status fill — "status is a fill" outranks
  position.
- Detail panel (card-detail tab): 600px, shadow-pop (the sheet §04
  assigns the drawer --shadow-pop; the mockup's one-off side shadow
  lost to the sheet), header = id + 20px/−0.02em title + chip row
  (status chip in the status family; size/feature/priority neutral
  chips — feature+priority newly threaded through selectTaskDetail),
  esc affordance chip; overline section labels (0.12em uppercase);
  acceptance criteria split into per-criterion rows (pure
  criterionLines()) marked ✓ only when the task passed its verdict
  gate (done/merging) — there is no per-criterion verification record,
  so the mark is task-level honest; blocker chips in the target's
  status colors with ✓ on done/merging targets; verdict history as
  tinted VERBATIM blocks (pure verdictEntries() splits date-headed
  entries, tint from the verdict word in the header paragraph only,
  full text quoted — neutral block for unheaded text, so nothing
  errors); stamps section restyled as provenance rows where the
  review row shows the two-mark badge PLUS the three-way sentence
  (ADR-016: distinction lives in text). Dark panel verdict tints are
  derived values (the mockup draws the panel light-only) — flagged
  for the verifier.
- Empty state (open-a-folder tab): front-door layout — hero wordmark,
  the docs/ pitch prose, no-plan card carrying the existing message +
  primary "Open a project folder…" / outline "keep current project".
  No recents list and no interview button: no data source / F-03
  (T-006-s2). All T-007 testids and copy pinned by tests survive.
- Vendored Button rewritten: ink-pill default, quiet outline
  (surface + --input border + shadow-card, dark = secondary fill),
  ghost/secondary/destructive/link all re-derived from tokens; shared
  2px outline focus; no transitions (motion budget = the pulses). No
  stock shadcn styling remains anywhere (button.tsx is the only
  shadcn component in the tree).
- ADR-016 ReviewBadge: TWO marks — solid disc + check (--review-disc/
  --review-mark) for independent AND same-model, half disc for
  self-verified; data-mark="checked"|"self"; three-way text kept in
  the hover label and panel sentence. Tests: the T-004-era three-way
  loop in select-board.test.ts STAYS (it pins model DATA passthrough,
  which ADR-016 keeps three-way); the new test/review-badge.test.tsx
  pins the two-mark contract (independent ≡ same-model mark SVG,
  self ≠ checked, three distinct labels, provenance tokens not status
  tokens). test/detail-presentation.test.ts pins criterionLines/
  verdictEntries.

**Deliberate reconciliations** (mockup ↔ sheet conflicts — sheet won):
type sizes map to the sheet's 7-step scale by ROLE (the mockups use
off-scale sizes like 22px board wordmark, 38px hero, 9.5–10.5px
metas; the scale's own comments assign wordmark→3xl 26px, overlines→
xs 11px, etc.). Radii: only 10px/6px exist as tokens; the mockups'
12px welcome-card radius renders at 10px. Neutral chip borders reuse
--ghost-border (#d4d4d4/#333 — value-identical in the mockups).
Below-slice mini-card border uses --accent (light-exact; dark one
step off the measured #1f1f1f). Ink #525252-ish quiet-strong text
maps to the nearest semantic token per role. NOT built (out of
scope): nav rail (T-012), map pane, interview/rooms/sessions, drag,
dispatch footer + LOCKED styling (no session-holding data exists),
ghost hover Promote (architect write path — F-04), `rejected ×N`
count (T-006-s3), recents (T-006-s2).

**Verification** (all headless — no screen control, no input
injection, no permission prompts; probe servers on free ports
14206/14209, the human's 1420 instance never touched and verified
alive after):

- Suites, ADR-011 order: lib/parser `npx vitest run` → **77/78** +
  `npx tsc --noEmit` clean + `npm run build` clean. The ONE failure
  ("parses the five backbone features in order", expects 5 features,
  live ROADMAP now has 6) is PRE-EXISTING on main from the F-06
  promotion (c1cec7b) — this diff touches app/ only; filed
  T-006-s1. The tree-health case ("finds zero issues in the live
  tree") is green, including with the three new suggestion files.
  app `npm run build` exit 0 (tsc + vite; fonts fingerprint into
  dist/assets) · `npm test` **94/94** (84 prior + 10 new).
  src-tauri `cargo test` **20/20** (untouched; src-tauri diff empty,
  CSP/capabilities untouched).
- Token discipline: strict grep over touched sources → zero
  arbitrary-value utilities; index.css carries zero color literals;
  compiler probe (tailwindcss compile().build) → every new utility
  emits var()-backed CSS; stock bg-red-500 / shadow-md /
  tracking-widest produce NO CSS (probed at compile time AND as
  computed styles in both served bundles).
- Computed-style probes, headless Chrome (--headless=new + CDP, no
  extra deps) against the DEV-SERVED bundle with a fixture board via
  the T-003 harness: **47/47** — all six status fills light AND dark
  (merging cyan ≠ done teal proven), border/title/chip-border ladders,
  column-header inversion, wordmark face/weight/tracking, ghost/
  parked/slice/mini-card treatments, two-mark badge (independent ≡
  same-model SVG, self half-disc, disc resolves --review-disc in both
  schemes), pulse dot (animation-name/duration from tokens, card
  itself static), parse-error chip + last-valid suffix, panel at
  600px with chip row / per-criterion marks / tinted verbatim verdict
  blocks / blocker ✓ chips / three-way provenance sentence, scheme
  flip on .dark toggle (shadows die in dark), fonts loaded via
  document.fonts.check with ZERO cross-origin requests.
- BUILT bundle (dist/ served statically): **21/21** — browser-screen
  fallback boots, tokens resolve, both schemes flip, §06 values inert
  (present on :root, no utilities), enforcement holds, both woff2
  fetched same-origin, zero cross-origin requests. dist/index.html
  carries no CSP — correct per the Tauri v2 serve-time gotcha, not
  "fixed".
- Real-repo render (the launch-screenshot surface): the live docs/
  tree (35 files) pushed through the harness → **9/9** — board
  screen, zero parse failures, six backbone columns + unmapped, 15
  cards + 19 ghosts, T-006's own card building-amber with the fable
  chip, two-mark badges on done cards, derived counter reads
  "milestone 1 · 6 of 7 done", zero page errors.
- The screenshot-ready judgment itself is @human's (visual-
  confirmation precedent, T-001/T-007): run the app, both schemes,
  and judge the launch shot. Headless coverage above is the floor,
  not the verdict.

**Dependencies**: zero added or changed (package.json untouched).
Fonts are vendored static assets, not deps.

**Suggestions filed**: T-006-s1 (parser smoke backbone stale — the
pre-existing failure), T-006-s2 (front-door recents store),
T-006-s3 (rejected ×N count on cards).

## Verdicts

2026-08-15 — claude-fable-5 @fresh (verifier, same-model as builder):
APPROVED — on everything mechanically checkable; the screenshot-ready
criterion (criterion 2) passes to @human per the visual-confirmation
precedent (T-001/T-007): run the app on this repo, both schemes, and
judge the launch shot. Headless floor below; all probes my own, fresh
installs, no executor artifacts reused.

Suites (ADR-011 order, node_modules + dist wiped first): lib/parser
`npm ci` + `npm run build` clean, `npx tsc --noEmit` clean,
`npx vitest run` 77/78 — the ONE failure is "parses the five backbone
features in order" (expects 5, live ROADMAP has 6), pre-existing and
out-of-diff: this branch touches zero lib/ paths and main fixed that
exact expectation post-branch (67cccd7). The tree-health case ("finds
zero issues in the live tree") is green, including with all four
suggestion files. app `npm run build` exit 0 · `npm test` 94/94
(select-board / select-task-detail / project-shell / watcher / docs-
model / panel-dismissal byte-untouched; +10 new tests). src-tauri
`cargo test` 20/20 with a verified zero src-tauri diff (CSP and
capabilities untouched).

Token fidelity, mechanical: every token in the sheet's §03 + §06
blocks extracted from the HTML source and diffed against tokens.css —
179/179 exact in BOTH schemes (the only textual deltas are spaces
inside rgba(), CSS-identical). Violet --drift-bg/--drift-fg absent in
both schemes, absent from the built CSS custom-property set (probed
empty on :root in dist), and never defined anywhere in app/src —
the architect's supersession holds. §06 --warning + map set present
on :root and INERT: bg-warning / text-warning / border-warning /
bg-map-canvas produce no CSS at compile time and no computed style in
either served bundle. RULING on the extra tokenized inks: sanctioned
extension, not creep — all 24 (six -title pairs, six -border-strong
pairs, -shadow-card-hover, six verdict tints, five tracking roles)
are measured values I re-checked against the mockup source lines
(light title inks #14503c/#6b4d09/#6e3f12/#7d2c19/#134559 + planned
#171717, strong borders #a9dcc6/#e3c98d/#e6bd93/#e8b3a4/#a7d2e5/
#d4d4d4, hover shadow 0 3px 10px -4px rgba(0,0,0,0.18), dark set
likewise), the card-states tab's "token values only" rule makes
tokenizing them the only legal way to render those surfaces, and the
naming follows the sheet's own additive pattern. Two nits, non-
blocking: --verdict-*-meta is defined+mapped but consumed by no
component (inert-by-accident, unlike §06's inert-by-charter), and the
dark verdict tints are derived (disclosed; probed readable in dark).

Mechanism: enforcement SURVIVES the extension. My own compiler probe
(tailwindcss compile().build over the real index.css): 23 stock/dead
candidates emit no CSS (bg-red-500, text-zinc-400, shadow-md/lg/2xl,
tracking-widest/tight, drop-/text-/inset-shadow, bg-warning family,
bg-drift family) and 25 token-backed utilities all emit var()-backed
CSS. Same result as computed styles in the SERVED dev bundle and the
BUILT dist bundle. index.css carries zero color literals; grep over
app/src finds zero arbitrary-value utilities (the diff also removed
button.tsx's pre-existing rounded-[min(...)] ones). One truth stated
plainly: an arbitrary value, if someone WROTE one, does compile —
p-[13px] emits padding:13px — that is Tailwind v4 semantics, is
exactly what the CONVENTIONS gotcha records, pre-dates this task, and
is the lint T-001-s2 proposes; the executor's claims were correctly
scoped to stock utilities and never said otherwise.

ADR-016: ReviewBadge renders exactly two marks — probed in the live
DOM that independent and same-model produce byte-identical SVG
innerHTML and self-verified differs (half disc); data-mark
checked|self; colors resolve --review-disc/--review-mark in both
schemes (#1f7a58/#4ecf9e probed). Three-way stays first-class in DATA
(select-board.test.ts's three-mode passthrough loop untouched; review:
only on done cards still pinned) and in TEXT (three distinct hover
labels probed + the panel provenance sentence "independent — different
model" / "same-model — fresh session" / "self-verified — builder
session" probed). Test delta is strengthening only: the new
review-badge test pins mark identity, mark difference, label
three-way, and provenance-token sourcing; nothing prior was dropped
or loosened.

Surfaces, headless computed-style (Chrome --headless=new + CDP over
Node's built-in WebSocket, zero new deps, fixture via the T-003
harness; probe servers on 14315/14316/14390 — the human's 1420
instance verified alive-and-untouched before AND after, same pid):
DEV 124 + follow-up 16 assertions green net of three probe-side
artifacts (two stale CSSOM needles — Tailwind v4 emits translate/
opacity:1 — and my fixture initially omitting the id that parked
tasks require). All six status fills exact and distinct in light AND
dark, merging ≠ done proven both schemes (#d9edf7≠#d5f0e4,
#0c2430≠#0d2a21); scheme flip probed BOTH directions; column-header
inversion exact (#111/#fafafa/#a3a3a3 ↔ #ededed/#0a0a0a/#666);
wordmark Geist Mono 700/26px/−1.17px; card anatomy exact (id fg,
title -title ink, chip -border-strong, radius 10/6, rest shadow);
hover/pressed/focus-visible/grip rules present in the served CSSOM
(border→strong, translate −1px, shadow-card-hover, active fill =
-border + shadow off, 2px --ring outline offset 2); pulse on the 5px
dot only (2.4s token, --chart-4/--chart-2 exact both schemes, card
static); ghost dashed/fill-less with uppercase 0.09em provenance;
parked quiet row; slice "milestone 1 ships above" + hairline;
below-slice mini (sidebar fill, accent border, "milestone 2 · L");
panel 600px + shadow-pop, chip row (status chip + L/F-xx/priority on
ghost-border), esc chip, 0.12em overlines, per-criterion marks
task-level honest, blocker chips status-tinted with ✓ on done,
verdict blocks tinted with VERBATIM bodies — proven byte-equal
against hostile content (<script>, onerror, markdown) rendered as
text, zero live script nodes; parse-error chip terracotta with the
"· last valid state" suffix and last-good cards still rendered.
Fonts: document.fonts.check true for Geist + Geist Mono at 400/700 in
dev AND dist, both woff2 fetched same-origin, ZERO cross-origin
requests asserted on the CDP network log in both bundles. DIST: 21
further assertions green (browser-screen fallback, tokens on :root,
§06 inert, both flips, enforcement, no CSP tag in dist/index.html —
correct per the Tauri v2 serve-time gotcha). Real-repo render: the
live docs/ tree (70 files) through the harness — zero parse failures,
six backbone columns, T-006's own card in VERIFYING orange with M +
fable chips (this task's status — truer than the notes' building-
amber claim, which was written before handoff), counter "milestone 1
· 6 of 7 done", two-mark badges on all done cards, zero page errors.

Security/deps: zero new npm/cargo dependencies — no manifest or
lockfile appears in the diff at all. Vendored fonts verified to the
byte: both woff2 SHA-256-identical to the files inside the published
geist@1.7.2 tarball (a369fcf5… / fba8f577…), real WOFF2 magic,
OFL-LICENSE.txt byte-identical to the package's LICENSE.txt, and
nothing else rode into assets/. The diff's only http URL is inside
the license text. Pure-lens holds (presentation + pure derivations;
no write paths). Boundary exact: every changed path is app/src/**,
app/test/**, or docs/tasks/T-006-* — zero lib/parser, zero src-tauri,
zero map/interview/rooms/nav-rail code.

Attack findings, none blocking: (1) verdictEntries tests REJECTED
before APPROVED in the first paragraph, so a single-paragraph
APPROVED entry that mentions "REJECTED" tints — and labels — as
rejected; reproduced against the dev bundle, but a scan of every
verdicts section in the live tree found zero occurrences today, the
verbatim text stays correct, and the shipped test suite already pins
the quoted-in-body case → filed T-006-s4 (first-match-wins) rather
than blocking on a latent edge outside the acceptance criteria.
(2) Trailing unheaded verdict text folds into the previous entry —
correct behavior for multi-paragraph verdicts (T-005's real entries
depend on it); leading unheaded text gets the neutral block, probed.
Criterion 3 (no visibly unstyled shadcn default): button.tsx is the
only shadcn component in the tree and is fully re-derived from
tokens (ink pill default, quiet outline, token-backed secondary/
ghost/destructive/link, shared focus ring, transitions removed);
probed default/outline against the mockup treatments. Criterion 1
(tokens-only identity) verified end to end as above. Criterion 2 is
@human's: this verdict does not close it.

Cleanup: probe servers and headless Chrome stopped, ports
14315/14316/14390 released, 1420 untouched (pid 19955 alive after),
worktree clean save this verdict + T-006-s4, all probe scripts in the
session scratchpad outside the repo.
