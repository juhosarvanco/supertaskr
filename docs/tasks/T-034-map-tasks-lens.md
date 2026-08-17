---
id: T-034
title: Map tasks lens — dependency waves, critical path, the pane's second lens
feature: F-06
milestone: 4
priority: 18
size: M
status: building
blocked_by: []
touches: [app-map]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review:
---

Absorbs: T-012-s1. Triage 2026-08-16: the design bundle's fully-drawn
second screen ("map · tasks" in
docs/design/claudedesign_handoff/"nputer app.dc.html"), fenced out of
T-012 by its own plan ("the lens control … is absent until a
tasks-lens task exists" — this is that task). blocked_by edges are
already parsed; no new data source. Serialize app-map with
T-013/T-015/T-032 at dispatch.

## Acceptance criteria
- THE map pane header SHALL gain the lens segmented control
  (architecture · tasks) per the design, working in both directions;
  lens view-state is session-ephemeral until T-022 (the T-012
  overlay-state precedent).
- WHEN the tasks lens is active THE pane SHALL render board tasks in
  dependency waves from blocked_by edges: critical path in the
  design's terracotta family (values extracted from source per the
  T-006 protocol), blocked/ready distinction on grey cards, and the
  summary strip (critical path · worst blocker · ready now) —
  tokens-only, both schemes.
- THE architecture lens SHALL be unchanged while the control sits on
  architecture — the existing map suites pass untouched.
- IF the task graph contains a cycle THEN the wave layout SHALL
  degrade defined-ly (cycle members render in one wave; the existing
  issue surfacing names it — T-030's parser-side cycle issue is the
  net), never hang or crash.
- Hostile titles render as text nodes only; the no-innerHTML grep
  gate extends to the lens files.

## Implementation notes

Executor `claude-opus-5 @fresh`, 2026-08-17, branch `t034-tasks-lens`
off main@`6ed97cf`. Four checkpoint commits, each independently green.
`docs/architecture/graph.json` deliberately NOT regenerated (integrator's
at merge, T-009-s1) — the expected delta is enumerated in full below.

### What shipped

    app/src/architecture/task-waves.ts    NEW  838 lines  PURE
      layerWaves() · cycleMembersOf() · criticalPath() ·
      transitiveHolds() · readSchedule() · layoutWaves() ·
      selectTaskWaves() · the strip's three text functions ·
      taskCardVisual() — the whole model, no React, no IO.
    app/src/architecture/TasksLens.tsx    NEW  466 lines  VIEW
      summary strip · wave canvas (pan/zoom) · cards · edges · legend.
    app/src/architecture/map-lens.ts      NEW   17 lines
      the two-lens vocabulary and why it stays session-ephemeral.
    app/src/architecture/MapView.tsx      +70/-3
      the lens control; architecture chrome made lens-conditional;
      ⌘F claimed only where a search field exists.
    app/src/architecture/map-layout.ts    +1/-1
      one source-encoding byte, behaviour-identical (below).
    app/test/map-task-waves.test.ts       NEW  50 tests
    app/test/map-tasks-lens-dom.test.tsx  NEW  29 tests

Zero new tokens · zero new dependencies · zero arbitrary values · zero
diff outside `app/src/architecture/**` and `app/test/**`.

### Criteria → evidence

**C1 — the lens segmented control (architecture · tasks), both
directions, session-ephemeral until T-022.** `map-lens-control` renders
two segments in the header's left group, `aria-pressed` on each,
architecture first and active by default. Six DOM tests: the two
segments and their order; the round trip architecture→tasks→architecture
with the wordmark following (`map` ⇄ `map · tasks`) and the two canvases
swapping; the subtitle counted from the live model; a fresh MOUNT back
on `architecture` (that is the session-ephemeral proof — no store, no
localStorage, nothing outside `useState`); the control living inside the
header's `data-panel-exempt` region so using it cannot cost an open
panel; and ⌘F (below). `map-lens.ts` records the T-012 precedent and the
T-022 seam in prose; **T-034-s3** files the one-line criterion addition
T-022 needs.

**C2 — waves from `blocked_by`, terracotta critical path, blocked/ready,
the summary strip, tokens-only, both schemes.** 50 pure tests + 12 DOM
tests. Waves: chains, a diamond joining on the LONG arm, multi-root,
id-ascending rows (numeric-aware: T-9 before T-10), dedup + self-edge
drop, undrawn blockers not moving a wave, hostile ids inert,
determinism under shuffled input, append-only stability, a 500-deep
chain. Critical path: the three-rung ladder below, its divergence from
the most-blocking reading, and the marked edges. Schedule: ready ·
waits-on-X (+N) · blocked, over done / in-flight / planned / parked /
rejected / dangling / self blockers. Strip: all three cells, plus the
"nothing to say" forms. In the DOM: card positions on the 300px pitch,
the four wave labels, terracotta stroke + `task-arrow-critical` on the
chain and only there, `bg-map-unmapped` + dashed terracotta on blocked
vs `bg-status-planned` on ready, the ADR-016 mark on done cards, the
three cells' exact strings, the four legend entries. **Both schemes come
free and that is the whole point of obligation 1**: every ink is a
`--status-*` / `--map-*` / core token that already carries a measured
dark value, so the dark rendering is the token file's, not a second
hand-written palette. Cards open the REAL `TaskDetailPanel` under the
CONVENTIONS trusted order (pointerdown, then click), which is the
design's own caption ("Click T-004 to open the same detail panel the
board opens").

**C3 — the architecture lens unchanged while the control sits on it.**
Two independent measurements, below (obligation 3). The existing map
suites pass BY NAME and untouched: `map-layout` 26/26, `map-visuals`
39/39, `map-search` 7/7, `map-view-dom` 25/25, `map-shell-dom` 4/4,
`map-dogfood-render` 8/8 — `git diff` on all six files is **0 bytes**.

**C4 — a cycle degrades defined-ly, never hangs, never crashes.** Kahn
peeling; when it stalls, every remaining task in an SCC of size ≥ 2 is
released as ONE wave and peeling continues, so cycle members share a
wave and tasks downstream of a cycle keep their own. Terminates because
a stall guarantees an SCC of size ≥ 2, so each pass removes ≥ 2 tasks; a
belt-and-braces "release everything remaining" arm covers the impossible
case. Tarjan is ITERATIVE (map-layout's own shape) so no input depth
recurses. Tested: 2-cycle, 3-cycle behind a root with a tail, two
disjoint tangles, self-block, a 40-ring, a 60-ring rendered in the DOM
with a wall-clock bound. Cycle edges are still DRAWN (dashed, flagged
`data-tangled`) — never dropped — and the legend adds a line naming the
cycle. T-030's parser-side cycle issue remains the net that gives it a
NAME; this is the pane refusing to lie about the order.

**C5 — hostile titles as text nodes; the grep gate extends to the lens
files.** Below (obligation 4) — and the gate turned out to need a second
gate under it, which is checkpoint 4's story:

### The finding that made the grep gate real (checkpoint 4)

Sweeping my own diff with `file(1)` — a habit, not a required step —
turned up `app/src/architecture/task-waves.ts: **data**`. It carried
**two literal NUL bytes** in the two template literals that key the
critical-path edge set, where `map-layout.ts`'s separator idiom wants
the six-character escape. It compiled, bundled, typechecked, and passed
586 tests. But `file(1)` calls such a source *data* and **`grep(1)`
treats it as BINARY** — which means the no-innerHTML gate I had just
written, `lint:tokens`, and every CI grep **silently stop seeing that
file**. A gate that cannot read its subject is not a gate, and this is
the exact failure mode that a green suite cannot tell you about.

Mechanism, worth recording because it will recur: writing a backslash-u escape into
a tool-authored source file can land the CHARACTER rather than the
six-character ESCAPE. It happened three times in this task — twice in
`task-waves.ts`, once more in the test file while writing the gate
itself — and each time everything stayed green.

The sweep then found a **pre-existing instance on main**:
`map-layout.ts`'s `layoutKey` writes its third separator as a literal
`U+0003` beside two correct escapes (T-012 shipped it; `git show main`
confirms it is not mine). Fixed here, one byte, in-lane: the escape and
the literal denote the same string, so `layoutKey`'s output is
unchanged, `map-layout` stays 26/26, and the cross-revision
architecture-DOM identity below was **re-measured after the change** and
still reports exactly 472 bytes.

Standing gate added: `map-tasks-lens-dom.test.tsx` walks every file
under `app/src/architecture/` and fails on any literal C0 control
character (tab, LF and CR excepted), reporting codepoint and offset.
Proven by re-planting a NUL. The hostile-content fixture now builds its
own C0 characters with `String.fromCharCode(7, 1, 27)` so the VALUE
still carries them while the SOURCE stays text. Every `.ts`/`.tsx` under
`app/src`, `app/test`, `lib/parser/src` and `tools/e2e` now reads as
text to `file(1)`; **T-034-s5** proposes lifting the check to
`lint:tokens`, where it covers the whole tree instead of one pane.

### The critical path: which definition, and why

**Chosen: the LONGEST chain of tasks linked by `blocked_by` (the CPM
sense), with a three-rung tie-break ladder.**

1. most tasks in the chain — the definition itself;
2. among equal lengths, the chain with the most NOT-DONE tasks — of two
   chains the same depth, the one with more work left is the one
   actually holding the release, which is the question the design's own
   caption asks ("what is holding the release");
3. among those, the lexicographically smallest id sequence —
   determinism, the pane's carrying rule (same graph → same picture).

**Why not the most-blocking definition.** The strip has THREE cells and
the middle one is *worst blocker*, which IS the most-blocking
measurement. Defining the left cell the same way would make it a
restatement of its neighbour; the pane would then answer one question
twice and the "how deep is this" question not at all. Second, "critical
path" is a term of art from scheduling: the longest chain of dependent
activities, the one no amount of parallelism shortens. Using the phrase
for anything else misleads every reader who knows it.

**They genuinely differ, and the suite proves it.** `map-task-waves`
builds a graph where `T-100` blocks four leaves (most-blocking would
name it, and `transitiveHolds` measures exactly that: 4) while a
four-deep chain `T-001 → T-002 → T-003 → T-004` exists elsewhere; the
critical path returns the chain, and the assertion sits beside the
holds measurement so the two readings are visible in one test body.

**Why the mock's own chain was not treated as normative.** The design
draws `T-002 → T-008 → T-012` red, and that is NOT the longest path in
its own picture (`T-001 → T-010 → T-014 → T-015`, `T-002 → T-004 →
T-005 → T-006` and `T-002 → T-008 → T-009 → T-013` are all longer). The
mock's data is indicative rather than normative — it draws **15 cards
while its own subtitle says 18** — the same status the README already
gives the architecture hero's hand-laid coordinates. So the definition
was chosen on merit and the mock's FORM (chain · one-line gloss) kept.

**Worst blocker** is the neighbouring cell and it is the transitive
count, not the direct one: the not-done task with the largest set of
tasks it transitively gates. "Holds N" reads as "is holding N tasks up",
and a task blocking one task that blocks fifty is not a "holds 1"
problem. Ladder: most holds → **NOT in flight before in flight** (at
equal weight the worse blocker is the one nobody is on, because nothing
is moving it — the design's own example is a stuck `rejected ×2` task) →
earlier wave → lower id. The second rung was ADDED because the DOM test
caught the implementation naming a `building` task over an idle one; it
now has its own unit test in both directions.

**Ready now** = a not-yet-started (`planned`) task whose every blocker is
done. In-flight and finished tasks are excluded: they are not "ready to
start", they have started. That reproduces the mock's own count (its
four `ready` greys, not its building/verifying cards).

### Design-value extraction (T-006 protocol; every deviation disclosed)

Source: `docs/design/claudedesign_handoff/"nputer app.dc.html"`, the
`isDeps` screen (`map · tasks`), plus its dark sibling for the lens
control, plus README §5 and the pane-header spec. Read from the HTML
source text, never from a rendered screenshot.

| element | design value | shipped as | exact? |
|---|---|---|---|
| lens track | `#f0f0ef`, 3px pad, 9px radius, 6px gap | `bg-secondary p-0.75 rounded-lg gap-1.5` | pad/radius/gap EXACT; ink one step (`--secondary` #f5f5f5 light / **#171717 dark EXACT**) — the sibling overlay control in the same header already uses this track and README says both share it |
| lens active pill | `#171717` bg / `#fafafa` ink, 5/11px pad, 6px radius, mono 11px | `bg-primary text-primary-foreground px-2.75 py-1.25 rounded-chip font-mono text-xs` | pad/radius/size EXACT; **dark EXACT** (#ededed / #0a0a0a); light bg one step (#111111 vs #171717), light ink EXACT |
| lens inactive ink | `#525252` light / `#a3a3a3` dark | `text-secondary-foreground` | one step both ways; chosen for parity with the overlay control's inactive segments, which the design gives the SAME ink — two sibling controls in one header must not diverge |
| strip cell pad | 13px / 24px, 4px gap | `py-3.25 px-6 gap-1` | EXACT |
| strip label | mono 10px, 0.12em, uppercase, `#737373` | `font-mono text-map-id tracking-overline uppercase text-muted-foreground` | tracking/ink EXACT; 10 → 10.5px (`--text-map-id`, nearest step; the architecture legend's own label precedent) |
| strip value | 13.5px, `#262626` | `text-base text-foreground` | 13.5 → 14px (nearest; T-012's ratified "panel prose 13.5 → base"); ink one step (#171717) |
| worst-blocker ink | `#7d2c19` | `text-status-rejected-title` | **EXACT** (light #7d2c19) |
| cell widths | 300px · 230px | `w-75` · `w-57.5` | EXACT |
| divider / rules | 1px `#ededed` | `w-px bg-hairline` · `border-hairline` | one step (#e5e5e5); the pane's existing rule token |
| wave label | mono 10px, 0.12em, uppercase, `#a3a3a3`, top 12 | `text-map-id tracking-overline uppercase text-map-declared-only-foreground`, `top: 12` | ink **EXACT** light (#a3a3a3); size 10 → 10.5 as above; deliberately lighter than the strip label, preserving the design's hierarchy |
| card box | 240×58, r10, pad 9/11, gap 3 | `w-60`(inline) `h-14.5`(inline) `rounded-lg px-2.75 py-2.25 gap-0.75` | EXACT (radius = `--radius` 10px) |
| card id | mono 11.5px | `font-mono text-xs` | 11.5 → 11px (nearest step; 12.5 is twice as far) |
| status word | 11px sans | `text-xs` | **EXACT** |
| schedule word | mono 10px | `font-mono text-map-meta` | 10 → 9.5px. A TIE with 10.5 on absolute error; broken toward 9.5 because it preserves the design's 1.5px step between the id (11.5) and the word (10) exactly |
| card title | 13px, 600, −0.01em | `text-map-name font-semibold tracking-title` | **EXACT** on all three |
| done fill/ink | `#d5f0e4`/`#bfe7d6`/`#2f7256`/`#14503c` | `bg-status-done border-status-done-border text-status-done-foreground text-status-done-title` | **EXACT** ×4 |
| building | `#fdeecb`/`#f3ddab`/`#7d5c12`/`#6b4d09` | the `status-building` family | **EXACT** ×4 |
| verifying | `#fce6d2`/`#f3d0ae`/`#84501c`/`#6e3f12`, dot `#b5651d` 5px | the `status-verifying` family + `bg-chart-4 h-1.25 w-1.25` | **EXACT** ×5 |
| merging | `#d9edf7`/`#bedeee`/`#26647e`/`#134559`, dot `#2e7691` | the `status-merging` family + `bg-chart-2` | **EXACT** ×5 |
| ready/planned | `#f5f5f5`/`#e8e8e8`/`#171717` title | `bg-status-planned border-status-planned-border text-status-planned-title` | **EXACT** ×3; id `#5f5f5f` → `text-status-planned-foreground` (#525252, nearest) |
| blocked ground | `#fafafa` | `bg-map-unmapped` (#fafaf9) | one step (Δ1); chosen over `--sidebar` (#fafafa, EXACT) because this is the map's own GHOST fill — the treatment inferred/unmapped nodes already wear — and `--sidebar` is the rail's ground |
| blocked title/word | `#525252` / `#93331d` | `text-status-planned-foreground` / `text-status-rejected-foreground` | **EXACT** both |
| `waits on X` ink | `#737373` | `text-muted-foreground` | **EXACT** light |
| card elevation | `0 1px 2px rgba(0,0,0,0.05)` | `shadow-map-node` | **EXACT** (and `none` in dark, the scheme's standing rule) |
| ordinary edge | `#d4d4d4` 1.25px, arrow `#c2c2c2` | `var(--map-edge-planned)` 1.25, marker `var(--map-edge)` | Δ2 and Δ2; the pane's own edge family, so dark comes from the token file |
| **critical path** | `#c96a4f` 2px + hot arrow; blocked border `#d4694b`; worst-blocker border 2px `#d4694b` | `var(--status-rejected-meta)` (#9d4430 light / #bb6c5b dark) at 2px / dashed 1px / solid 2px | NEAREST TOKEN STEP, disclosed in full below |
| review mark | 14px disc `#1f7a58` + `#fff` ✓; half disc | `--review-disc` / `--review-mark` at 14px | **EXACT** both, and it is ADR-016's two-mark set |
| legend | 22px gap, 12.5px `#525252` text, 24×2 and 24×1.25 bars, 14px r4 swatches, mono 11px right note | `gap-5.5`, `text-sm text-secondary-foreground`, `<rect>` at 2/1.25, `size-3.5 rounded-sm`, `font-mono text-xs` | gaps/sizes/bars **EXACT**; text ink one step (#404040), matching the architecture legend beside it |
| header subtitle | 13px `#737373` | `text-sm text-muted-foreground` | ink EXACT; 13 → 12.5px (nearest) |
| wordmark on tasks | mono 22px, 700, −0.045em | `font-mono text-2xl font-bold tracking-wordmark` | weight/tracking EXACT; 22 → 20px (`--text-2xl`, nearest) — and it is the SAME class the architecture wordmark already carries, so only the string differs |

**THE ONE DEVIATION WORTH ARGUING ABOUT — the terracotta.** The design
uses two terracottas: `#c96a4f` for the critical-path stroke and legend,
`#d4694b` for the blocked ghost's dashed border and the worst blocker's
2px solid one. Neither is a token, and the task forbids new ones. Every
candidate, by RGB distance:

| token | light value | Δ to #c96a4f | Δ to #d4694b |
|---|---|---|---|
| **`--status-rejected-meta`** | **#9d4430** | **66** | **72** |
| `--chart-5` / `--destructive` | #b3391f | 72 | 74 |
| `--status-rejected-fg` | #93331d | 92 | 97 |
| `--status-rejected-border-strong` | #e8b3a4 | 116 | 118 |

`--status-rejected-meta` is the nearest step to BOTH, so the two design
terracottas collapse into one token and the chain reads as one thing.
It is also the right semantics: the design deliberately picks a warmer,
softer terracotta than the rejected red, and this token IS "the softened
rejected ink". `--destructive` would have said *danger*; the critical
path is not danger, it is the chain that holds the release. Dark comes
free at **#bb6c5b**, a genuine terracotta on near-black, from the token
file rather than from a derivation invented here.

**Non-value deviations, disclosed.**
1. **The control has ONE home across both lenses** (the header's left
   group, the order README's pane-header spec writes down). The design's
   tasks screen parks it on the far right instead; a segmented control
   that jumps 900px across the header the instant you use it is a defect
   rather than a design. Filed as **T-034-s4** because it is a judgment
   a builder should not make silently.
2. **Search, the overlay control, the indexed-at hint and Re-index are
   ARCHITECTURE chrome and are ABSENT on the tasks lens** — search runs
   over components and files, the overlay modes are the architecture
   model's layers, and Re-index regenerates `graph.json`, which the tasks
   lens never reads. The design's tasks screen draws none of them either,
   so this follows the source; absent, never disabled (T-012's own
   "a disabled segment has no designed treatment" rule).
3. **The row pitch is the mock's MEDIAN, not one of its nine gaps.** The
   mock's intra-wave gaps are 100·110·120·120·120·140·140·140·160 —
   hand-laid, like the architecture hero's coordinates. 120px is their
   median and the modal value.
4. **`rejected ×N` only on `status: rejected` cards**, matching
   `TaskCard.tsx:213` exactly, so the board face and the lens face can
   never disagree. The worst-blocker LINE uses the count whenever it is
   non-zero, which is where the mock shows it.
5. **Parked and suggested tasks are not drawn** — the same cut the board
   makes between real cards and ghosts/parked rows. They still resolve
   as BLOCKERS, so a task behind a parked one reads `blocked`. The
   explainability hole this leaves is filed as **T-034-s2**.

### Proof obligations

**1 · The extraction table above, and the utilities EMIT.** Not asserted
by eye: `map-tasks-lens-dom.test.tsx` reads the BUILT stylesheet from
`app/dist/assets/` and requires a rule for each of **33** utilities the
lens uses, plus the `motion-safe:animate-status-pulse` gate. An unmapped
utility is silently dead here (index.css disables Tailwind's default
scales), so "it compiles" proves nothing about whether the lens is
painted. Two hardening details: the class names are **assembled at
runtime**, never written as literals, because Tailwind v4's source
detection scans test files and a literal would MINT the very utility it
claims to observe (T-012's recorded scanner-hygiene trap); and a
staleness guard fails loudly if `dist/` predates the lens sources. The
guard is not theoretical — **it fired twice during this build**, once
after a source edit and once after the MapView swap in obligation 3.
`lint:tokens` clean over **41 files** (38 on main + the 3 new), selftest
**43 samples green**.

**2 · Wave computation, hand-derived, with a cycle, a diamond and a
parked blocker.** 50 pure tests in `map-task-waves.test.ts`, every
expectation derived from the fixture beside it in a comment before the
assertion. Named: the **diamond** joins on the LONG arm (`T-005@3`, not
`@1`); the **2-cycle** shares wave 0 with both edges still drawn and
flagged; the **3-cycle behind a root with a tail** puts the SCC at wave
1 and the tail at wave 2; two disjoint tangles; a self-block that
neither stalls nor loops; a 40-ring that terminates with every task in
one wave and an EMPTY critical path rather than a hang; a 500-deep
chain; and the **parked blocker** in three places — `layerWaves` (the
undrawn blocker does not move a wave), `readSchedule` (parked → blocked,
and in-flight + parked → blocked, not waits), and `selectTaskWaves` over
real parsed files (the parked task is absent from `layout.nodes` while
its dependent reads `blocked`). Hostile ids (`__proto__`, `constructor`,
`toString`) resolve against nothing, per ADR-009's Map discipline.

**3 · The architecture lens byte-unchanged, measured twice.**
(a) **Cross-revision.** A throwaway probe (deleted) rendered `MapView`
from `main` and from this branch in the same jsdom, on the same fixture,
and dumped six regions. `main`'s `MapView.tsx` is byte-identical to my
branch point — `git diff 6ed97cf..main -- app/src/architecture/` is
**empty** — so the comparison is exact:

    IDENTICAL  map-canvas          5276 bytes
    IDENTICAL  map-legend          1545
    IDENTICAL  map-overlay-control  660
    IDENTICAL  map-search           177
    IDENTICAL  map-reindex          654
    IDENTICAL  map-degraded           8  (absent both sides)
    DIFFERS    map-view            9066 -> 9538

and the whole 472-byte difference is the control itself: **branch
`map-view` with the `map-lens-control` element removed is byte-identical
to main's**. Re-run at the final branch head after the ⌘F change: same
472 bytes, same identity. The `MapView.tsx` swap was reverted and
sha256-verified (`710a390c…`).
(b) **In-suite, standing.** A test captures the five regions' outerHTML,
round-trips architecture→tasks→architecture, and requires byte-identity;
a second removes the control from the header and asserts what remains
carries no trace of T-034; a third asserts the architecture-only chrome
is absent on tasks; a fourth drives the overlay control after a round
trip. The indexed-at hint is deliberately excluded from (b) — it reads
`Date.now()`.
(c) The six existing map test files are **0 bytes changed** and green by
name (see suites).

**4 · Hostile content, and the gate proven by planting.** A title
carrying `<script>alert(1)</script>`, `<img src=x onerror=alert(2)>`, a
bidi override (`U+202E`/`U+202C`) and a 10,000-character run renders with
**zero `<script>` and zero `<img>` anywhere in the pane**, the bytes
visible as text, the card's element count under 12, and the same bytes
in `aria-label` as an attribute rather than parsed markup. A hostile ID
is tested too: `<img src=x>` and `__proto__` as `blocked_by` entries
leave the card `blocked` and draw only the one real edge. The
no-innerHTML gate scans **every file under `app/src/architecture/`** for
`innerHTML|dangerouslySetInnerHTML|insertAdjacentHTML|document.write`,
and — because a gate that silently stops covering its subject is no gate
— asserts by NAME that `TasksLens.tsx`, `task-waves.ts`, `map-lens.ts`
and `MapView.tsx` are in the scanned set. **Planted and proven**: a
`d.innerHTML = card.title` in `TasksLens.tsx` reds it naming that file;
with that reverted, a `// dangerouslySetInnerHTML` comment in
`task-waves.ts` reds it naming that file. Both reverted, `git status`
empty. **And a second gate under it** — the C0-control check above,
without which the first one can be blinded one byte at a time; also
planted and proven (`U+0000 at offset 25269`, named with codepoint and
offset), also reverted.

**5 · Every new test executes.** Mechanical, not sampled: a script
inserted `expect("POISON").toBe("never")` as the FIRST statement of
every `it()` body in both new files — 50 + 27 at the time, matching the
reported counts exactly, and every `it(` in both files matches the
one-line form the script rewrites, so none was missed. Result: **77
failed / 0 passed**. Reverted from byte copies; `git diff` and `git
status` on `app/test/` both **empty**, sha256
`1c991adc…` / `3ee4ec92…`. The two tests added AFTERWARDS — ⌘F
(checkpoint 3) and the C0-control gate (checkpoint 4) — were each
mutation-proved on their own instead, which is the same guarantee: the
guard was deleted / the byte re-planted, the test went red naming the
right thing, and the revert was byte-verified. Final count **79**.
**Beyond the obligation, a six-mutant sweep** confirmed the tests pin
BEHAVIOUR and not just execution — each mutant applied to the real
source, each reverted and byte-checked:

| mutant | red |
|---|---|
| drop the critical path's remaining-work tie-break rung | 2 |
| a cycle stall releases everything instead of the SCC | 4 |
| collapse `waits` into `blocked` | 4 |
| critical edges lose the terracotta | 2 |
| the `tasks` segment becomes inert | 19 |
| parked blockers become invisible to the schedule | 7 |
| ⌘F guard deleted | 1 |
| a literal NUL re-planted in `task-waves.ts` | 1 |

**6 · Suites** (ADR-011 order, all first-hand in this worktree):
- **lib/parser** `npm ci` + `npm run build` + `npx vitest run`
  **159/159 (10 files)**, `npx tsc --noEmit` clean. Zero diff under
  `lib/parser/` — and the T-024-s5 three-fixture rule does NOT fire:
  this branch declares no component and edits no registry file, so
  `smoke.test.ts` is unmoved (verified, not assumed).
- **app** `npm install`, `npx tsc --noEmit` clean, `npm run build`
  exit 0, `npx vitest run` **586/586 (32 files)** = the 507 baseline
  **+79** (50 `map-task-waves` + 29 `map-tasks-lens-dom`). Baseline
  reproduced at 507/507 on the untouched branch point first.
- **app/src-tauri** bare `cargo test` **217 passed + 3 ignored, 0
  failed**, exit 0, **zero warnings**, summed across **11 test
  binaries** (105/0/0/32+1/68/3/7/0+1/2+1/0/0) — read from
  `test result:` lines, not through `tail`. Unmoved, as a branch with
  zero Rust must be.
- **tools/e2e** `npm ci` + `npx playwright test` **36/36 in 10.4s**,
  headless, one worker, retries 0, no skips. `npm run typecheck` clean ·
  `npm run lint:tokens` **clean, 41 files** · `--selftest` **43 green**.
  Run on scratch port **14534**, not the lane's default 14520, because
  T-045 owns `tools/e2e` tonight and a sibling lane may hold it.
- **BOOT GATE — RUN, and green.** The diff touches `app/src/**`, so
  CONVENTIONS' trigger fires and the executor limb binds. Scratch port
  **14535**, never 1420:

      [boot-check] port 14535 free — spawning `npm run tauri dev -- --config {…}`
      [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer-t034
      [boot-check] detected startup line 1/2: [nputer] project folder:
      [boot-check] app: [nputer] window "main" created
      [boot-check] detected startup line 2/2: [nputer] window "main" created
      [boot-check] process tree stopped (exit=null signal=SIGTERM)
      BOOT_EXIT=0

  After it: `lsof` on 14535 **empty**, `pgrep -fl tauri-boot-check`
  **empty**. **1420 was never bound, contacted or signalled** — the
  human's vite still holds `[::1]:1420` on the same pid before and
  after. (Noted for the integrator: that pid is **64249**, not the
  90127 STATE.md records, so the human has restarted their app at some
  point tonight. Nothing here touched it.)

**7 · Fence proof.** `git diff --stat $(git merge-base main HEAD)..HEAD`
— note the merge-base, because **main has moved past the branch point**
(T-050 et al. landed tonight):

    app/src/architecture/MapView.tsx      |  70 +-
    app/src/architecture/TasksLens.tsx    | 466 +++
    app/src/architecture/map-layout.ts    |   2 +-
    app/src/architecture/map-lens.ts      |  17 +
    app/src/architecture/task-waves.ts    | 838 +++++
    app/test/map-task-waves.test.ts       | 743 +++++
    app/test/map-tasks-lens-dom.test.tsx  | 724 +++++
    7 files changed, 2856 insertions(+), 4 deletions(-)

`map-layout.ts` is the one-line source-encoding correction described
above — behaviour-identical, in-lane (`app/src/architecture/**`), and
disclosed rather than folded in quietly.

Zero files changed under `lib/parser/`, `app/src-tauri/`, `tools/e2e/`,
`app/src/App.tsx`, `app/src/components/`, `app/src/lib/`,
`app/src/genesis/`, `app/src/styles/`, `app/src/index.css`,
`docs/architecture/`, `method/`, `capabilities/`, `app/package.json`,
both npm lockfiles and `Cargo.lock`. `../nputer-t030`, `../nputer-t045`
and every t027 worktree were never entered. (The docs commit that
follows adds only this file and four `T-034-sN` suggestions.)

### Expected graph delta (NOT regenerated here — integrator's at merge)

Against **today's main**, whose committed graph is 94 files / 667
symbols / 1063 edges (the branch point's was 92/642/1038):

- **files 94 → 99**, nothing removed. Three land in **C-12**
  (`app/src/architecture/**`) and two in **C-05** (`app/test/**`); the
  registry was swept and each glob has exactly ONE claimant, so the
  mapping deltas are derivable before any test runs (the rule T-048's
  integrator wrote into the fixture, used here as a rule).
- **content-changed, hash/loc only**: `app/src/architecture/MapView.tsx`.
- **19 new import edges**, enumerated (type-only imports DO create edges
  here — verified against the committed graph's existing
  `MapPanel.tsx → task-detail.ts`): task-waves → `p:@nputer/parser`,
  `lib/verdicts.ts` (2) · TasksLens → `p:react`, `p:@nputer/parser`,
  `lib/utils.ts`, `lib/task-detail.ts`, `architecture/task-waves.ts` (5)
  · map-lens → none (0) · MapView gains `./TasksLens`, `./map-lens` (2)
  · map-task-waves.test → `p:vitest`, `p:@nputer/parser`,
  `../src/architecture/task-waves` (3) · map-tasks-lens-dom.test →
  `p:node:fs`, `p:node:path`, `p:react`, `p:react-dom`, `p:vitest`,
  `p:@nputer/parser`, `../src/architecture/MapView` (7). So **edges
  1063 → 1082**; symbols move by whatever the two new modules export
  (measure at regen, do not forecast).
- **EIGHT fixture assertions move — forecast them all, the house has
  been bitten three merges running by forecasting three and moving
  four.** In `app/test/architecture-dogfood.test.ts`: (1) the file-count
  `toBe(94)` → **99** AND the `it()` NAME that quotes it; (2)
  `["C-05", 44]` → **46**; (3) `["C-12", 11]` → **14**; (4)
  `["C-05", "C-06", "undeclared", 8]` → **10**; (5)
  `["C-05", "C-12", "confirmed", 20]` → **22**; (6)
  `["C-12", "C-05", "confirmed", 4]` → **7**; (7)
  `["C-12", "C-06", "confirmed", 4]` → **6**. In
  `app/test/map-dogfood-render.test.tsx`: (8) `"committed graph · 94
  files"` → `· 99 files`.
- **NO new finding, no unmapped bucket, no drift-flag movement.** Every
  edge above rides an ALREADY-DECLARED component pair (C-12 declares
  C-05 and C-06; C-05 declares C-12) except `C-05 → C-06`, which is an
  EXISTING undeclared D1 whose count grows 8 → 10 — a bigger number on
  a finding the board already shows, not a new one. `derived.issues`
  stays `[]`; `map-dogfood-render`'s node count (11) and edge count (28)
  are about component-level relations and none of those PAIRS is new,
  so both are unmoved.
- **`lib/parser/test/smoke.test.ts` does NOT move** — no component
  declared, no registry file touched, zero diff under `lib/parser/`.

### @human — what to judge when you wake (headless cannot)

The pane is live in the running app only after this merges; until then
the judgments are against the design bundle's `map · tasks` screen.

1. **The terracotta, both schemes.** `--status-rejected-meta` is
   #9d4430 light / #bb6c5b dark against the design's #c96a4f/#d4694b.
   Machines pinned "nearest token step"; whether the critical chain
   reads as *the spine of the picture* rather than as *an error* is the
   glance, and it is yours. Look at it beside a `rejected` CARD, which
   wears the same family's fill.
2. **The blocked ghost against the ready grey.** #fafaf9 dashed-
   terracotta vs #f5f5f5 solid-grey in LIGHT is a small delta; in DARK
   it is #101010 vs #141414, smaller still. Does "blocked" read as a
   different KIND of card at arm's length, or just a slightly different
   grey?
3. **Wave 0 is a wall on this repo** — 32 of 50 cards, a 1440×3818
   canvas. See **T-034-s1** for the three options. This is the biggest
   open question about whether the lens is USEFUL here, as opposed to
   correct.
4. **Where the lens control belongs** — **T-034-s4**. The bundle draws
   it in two different places on its two screens; I picked one and the
   reasoning is written down. Your call.
5. **The lens control beside the overlay control.** Both are segmented
   controls in one header, three feet apart, with deliberately different
   selection weights (the lens's ink pill NAVIGATES, the overlay's
   outlined pill MODIFIES — README §pane-header states the distinction).
   Does that read, or do two segmented controls in one row read as one
   confused thing?
6. **The header on the tasks lens.** `map · tasks` + subtitle + control,
   and nothing on the right at all. Empty, or calm?

### Suggestions filed

- **T-034-s1** — wave 0 is a wall on this repo (32 of 50 cards, a
  1440×3818 canvas); reads with T-048-s2, whose two-class fix covers
  both lenses.
- **T-034-s2** — a blocked card can point at nothing on screen: parked
  and suggested blockers are invisible. Empty on today's tree; a trap.
- **T-034-s3** — T-022 absorbs `lens` alongside `overlay` and the two
  viewports; the seam now has four members and the two viewports are
  separate on purpose.
- **T-034-s4** — the two design screens put the lens control in two
  places; T-034 picked one, and it is an @human call.
- **T-034-s5** — a control byte in a source file blinds every grep gate
  in the repo; T-034's check covers one pane, `lint:tokens` is where it
  belongs.

## Verdicts

2026-08-17 — claude-opus-5 @fresh, verifier — same-model review:
**APPROVED.** All five criteria re-derived independently in this
worktree against merge-base `6ed97cf` (main has since moved to
`59558de`; every comparison below uses the merge-base, and main's own
`app/src/architecture/` is byte-identical to it, so the cross-revision
measurement is exact). Four corrections are recorded below — all in the
NOTES, none in a criterion, and one of them (the graph forecast) must be
read by the integrator **before** the merge regen.

**Suites, first-hand in this worktree.** app `npm install` + `npm run
build` (exit 0) + `npx vitest run` **586/586, 32 files**, `npx tsc
--noEmit` clean — the 507 baseline + 79. All six existing map suites
green BY NAME at exactly the claimed counts (`map-layout` 26,
`map-visuals` 39, `map-search` 7, `map-view-dom` 25, `map-shell-dom` 4,
`map-dogfood-render` 8) with 0 bytes changed. parser `npm ci` + `npm run
build` + `npx vitest run` **159/159, 10 files**, tsc clean. cargo
**217 passed + 3 ignored, 0 failed, 0 warnings**, summed from 11
`test result:` lines (105/0/0/32+1/68/3/7/0+1/2+1/0/0). e2e lane
**36/36 in 7.6s** on scratch port **14561** (mine, chosen free, released
after — `lsof` empty). `lint:tokens` **clean over 41 files**, selftest
**43 green**. Boot check NOT re-run: the builder's is green and the diff
is unchanged since. **Port 1420 never bound, contacted or signalled** —
still the human's node pid 64249, before and after.

**Fence — clean.** `git diff --name-only 6ed97cf..HEAD` over
`lib/parser/`, `app/src-tauri/`, `tools/e2e/`, `App.tsx`, `components/`,
`lib/`, `genesis/`, `styles/`, `index.css`, `docs/architecture/`,
`method/`, `capabilities/` and every lockfile returns **empty**. 13
files, 7 code, all under `app/src/architecture/**` and `app/test/**`.
No sibling worktree entered. Every probe reverted and sha-verified;
tree clean at commit.

**C1 — the lens control.** Verified in the DOM: two segments, order
`["architecture","tasks"]`, `aria-pressed` true/false, round trip both
directions, fresh mount back on `architecture` (no store, no
localStorage). The control element is **exactly 472 bytes** (measured
below).

**C2 — waves, terracotta, strip, tokens-only.** The live tree
re-derived from `docs/tasks/` independently: **50 cards drawn**, per-wave
**0:32 · 1:7 · 2:3 · 3:6 · 4:2**, canvas **1440 × 3818**, critical path
**`T-018 → T-026 → T-025 → T-027 → T-028 · 2 of 5 still to land`**,
worst blocker **`T-027 … planned, holds 2`**, ready **`13 tasks, no
unmet deps`**, blocked **`T-028, T-029`** — every number the notes claim,
reproduced. Terracotta arithmetic recomputed: `--status-rejected-meta`
(#9d4430) IS the nearest token step to BOTH design values (65.89 to
#c96a4f, 71.58 to #d4694b) — **conclusion upheld**. Emission: all **70**
utilities harvested from `TasksLens.tsx` have a rule in the built CSS,
so nothing is silently unpainted; class names are assembled at runtime,
so the T-012 scanner trap is genuinely avoided. The **staleness guard is
not theoretical** — it fired on THIS verifier too, unprompted: the
cross-revision probe below restored `MapView.tsx` after the build, and
the guard refused the whole emission probe until it was rebuilt. That is
a third independent firing on top of the builder's two.

**C3 — the architecture lens byte-unchanged. Re-derived from scratch**
and this is the strongest evidence in the task. Rendering `MapView` from
the merge-base and from this branch in the same jsdom on the same
fixture: `map-canvas`, `map-legend`, `map-overlay-control`, `map-search`,
`map-reindex` and `map-degraded` are **byte-for-byte IDENTICAL**;
`map-view` differs by **exactly 472 bytes**; and excising the
`map-lens-control` element from the branch's `map-view` yields a string
**byte-identical to the merge-base's** (`stripped == main: True`). The
`map-layout.ts` swap was restored and sha-verified.

**C4 — cycles degrade defined-ly.** Twelve hand-derived fixtures of my
own, all green: the **diamond joins on the LONG arm** (`T-005` at wave
3, not 1); the **2-cycle** shares wave 0 with both edges drawn and
`tangled`; the **3-cycle behind a root with a tail** puts the SCC at
wave 1 and the tail at 2; **two disjoint tangles** both release (into
one wave — defined, worth knowing); **self-block** drops the self edge
and neither stalls nor loops; the **40-ring** terminates in **1ms** in
one wave with an **empty** critical path; the **500-deep chain** lays out
waves 0–499 in 10ms with no stack overflow; a **parked blocker** moves no
wave and draws no edge. Perf note, not a defect: `criticalPath` is
roughly quadratic in task count (200→36ms, 400→141ms, 800→536ms; a
synthetic 1800-task/53k-edge graph takes 2.7s). At this repo's scale
(50 tasks) it is sub-millisecond, and "never hang" holds.

**C5 — hostile content.** Attacked with **my own** payloads, not the
builder's: `<script>`, `<svg/onload>`, `<iframe>`, `<img onerror>`,
attribute-breakout, `<style>`, RTL/bidi overrides, a 10,000-char run,
`String.fromCharCode(7,1,27,0)`, a DOM-breakout string forging
`data-testid="map-canvas"`, and template-injection — through titles,
ids and `blocked_by` entries. Result: **no global written**, **zero**
injected `<script>/<img>/<iframe>/<style>/<object>/<embed>`, the forged
canvas **not created** (0 `map-canvas`, exactly 1 `map-tasks-canvas`),
bytes present as TEXT, 10k title rendered at full length, 108 elements
total, no prototype pollution. The no-innerHTML gate covers
`app/src/architecture/**` and asserts the four lens files **by name** —
and it fires: a planted `d.innerHTML` reds it naming the file.

**Execution sweep — stronger than the obligation.** All `it(` in both
new files match the one-line form the poison script rewrites (50 and
29, no exceptions), so none can be missed. Poisoning **all 79** (not the
builder's 77) gives **79 failed / 0 passed**. Reverted byte-exact; the
builder's recorded sha `1c991adc…` reproduced.

---

### Correction 1 — the control-byte finding is REAL; its blast radius as written is WRONG

Both instances re-derived. `task-waves.ts` carried **two literal NULs**
(offsets 25374 / 25507, in the two template literals keying the
critical-path edge set) through checkpoints 1–3; `map-layout.ts` carries
a literal **U+0003 at offset 14274 on main RIGHT NOW**, which makes
`file(1)` call that source **data** on the mainline today. A third
instance (U+0007/U+0001) sat in the test file, as disclosed. All fixed at
`832edd6`. Behaviour-identity proven, not asserted: both source forms
evaluate to codepoints **[67, 3, 69]**. Repo sweep of my own: **446
tracked files, 0 C0 controls in text** — the cleanliness claim holds.

**But the invisibility claim is refuted for two of the three mechanisms
it names.** Planting a raw-HTML sink AND a literal NUL into the same
file: the **no-innerHTML gate caught it**; **`lint:tokens` caught** two
planted arbitrary values in the same NUL-carrying file; and
**`.github/workflows/ci.yml` contains zero greps**. There is **not one
shell-`grep`-based gate in this repository** — every gate reads through
Node `readFileSync(…, "utf8")`, where a NUL is inert. Real
`/usr/bin/grep` still matches (exit 0) and `grep -q`/`-l` gates still
fire; only the LINE TEXT is suppressed.

The hazard is real but it is aimed at the wrong target: what goes
**totally** blind is a **binary-skipping searcher** — `ugrep`/`rg` with
`-I`, which is the mode **Claude Code's own Grep tool runs in** — which
returns *no match at all, exit 1*. In a method where agents audit the
repo by searching it, one byte can make a file unfindable to every
future session with every gate and suite green. Filed as **T-034-s6**,
which also records that this verifier **reproduced the mechanism three
more times while writing that very file** (six instances in one task).
The standing C0 gate is correct, fires with codepoint and offset, and
should be kept exactly as it is.

### Correction 2 — the graph forecast: one value wrong, one assertion missing. INTEGRATOR, READ THIS

Regenerated the graph myself and restored it byte-exact
(`815412de…` verified). The **19 new import edges are exactly as
enumerated** — all 19 confirmed one by one. Files **+5**, no removals.
But:

- **`["C-12", "C-05", "confirmed", 4]` → `6`, NOT `7`.**
- **A NINTH assertion moves and is not in the enumeration:
  `["C-12", "C-09", "confirmed", 4]` → `5`.**

One root cause for both: **`app/src/lib/task-detail.ts` belongs to
C-09**, not C-05 (`C-09-detail-panel.md` declares it explicitly). The
forecast routed all three new `C-12 → app/src/lib/**` edges to C-05;
two go there (`lib/utils.ts`, `lib/verdicts.ts`) and **one goes to
C-09**. Ironically the notes cite `MapPanel.tsx → task-detail.ts` as the
precedent proving type-only imports create edges — the right file, the
wrong component. This is the fourth merge running bitten by an
incomplete enumeration, exactly as the notes warned.

Also: **`derived.findings`' `D1:C-05->C-06` `fileEdges` LIST grows 8 → 10
entries** (the two new test files), in a *different* `it()` body from
the relation-table count — a tenth moving assertion if counted
separately. And **"edges 1063 → 1082" conflates import edges with the
graph's total `edges` stat**: import is +19, but `call` is +29 and
`type_ref` is +41, so the total moves by **+89**. Main's committed
baseline is also **94 files / 670 symbols / 1069 edges**, not the
667/1063 recorded.

Corrected merge-time forecast, against main@`59558de`: files 94 → **99**;
`["C-05", 44]` → **46**; `["C-12", 11]` → **14**;
`["C-05","C-06","undeclared",8]` → **10**;
`["C-05","C-12","confirmed",20]` → **22**;
`["C-12","C-05","confirmed",4]` → **6**;
`["C-12","C-06","confirmed",4]` → **6**;
`["C-12","C-09","confirmed",4]` → **5**; the `D1:C-05->C-06` fileEdges
list gains 2 rows; the `it()` name and `"committed graph · 94 files"` →
**99**. `derived.issues` stays `[]`, `unmappedFiles` `[]`, 28 relation
rows, no new findings — those claims hold.

### Correction 3 — the utility count is 34, not 33

The `UTILITIES` array has **35 entries / 34 distinct** (`px-2.75` is
listed twice). All 34 emit. Cosmetic.

### Correction 4 — two terracotta distances are rounded up, and the margin is thinner than stated

Recomputed: `--chart-5`/`--destructive` to #d4694b is **73.00**, not 74;
`--status-rejected-fg` is **96.21**, not 97. The conclusion is unchanged
— but the margin on #d4694b is only **1.42 units** (71.58 vs 73.00),
effectively a tie. What actually decides that half is the SEMANTIC
argument the notes make (`--destructive` would say *danger*; the
critical path is not danger), not the arithmetic. Worth saying plainly
because the table reads like a clear win.

---

**Rulings requested by dispatch.**

- **The critical-path definition: UPHELD, and the reasoning is
  correct.** CPM-longest-chain is the right reading and the argument
  against most-blocking is sound: *worst blocker* is the strip's
  neighbouring cell and `transitiveHolds` IS that measurement, so
  defining both the same way would make the pane answer one question
  twice and "how deep is this" never. "Critical path" is also a term of
  art and using it for anything else misleads. Verified they genuinely
  differ on a hand-built fixture: `T-100` holds 4 while a 4-chain wins
  the path, both readings asserted side by side. Tie-break rung 2
  (more not-done wins at equal length) verified in both directions.
- **The mock is indicative, not normative: CONFIRMED by count.** The
  `map · tasks` screen draws **15 distinct task cards** (T-001…T-015)
  against its own subtitle **"18 tasks, ordered by dependency instead of
  story"**. Treating its drawn red chain as non-normative is justified.
- **T-032's U+0003 criterion: does NOT strictly need amending** — it
  constrains the divider's VALUE, and the escape produces that value.
  But it READS as an instruction to type the character, which is how the
  literal got there the first time. Filed as **T-034-s7**.

**The five suggestions, ruled.** **s1 VALID and the urgent one** —
re-derived exactly: 32 of 50 cards in wave 0, a 1440×3818 canvas in a
~600px pane. This is the open question about whether the lens is
*useful* here as opposed to correct, and it is the human's call; reads
with T-048-s2. **s2 VALID, latent** — verified the tree today has **no**
drawn task with an undrawn blocker (9 parked, 27 suggested), so the hole
is real but currently unexercised; a trap, correctly filed. **s3 VALID**
— straightforward, `lens` is the fourth member of the T-022 seam. **s4
VALID and correctly escalated** — the bundle really does place the
control in two different homes; one-home-for-both is the defensible
call and the reasoning is written down. **s5 VALID conclusion, premise
needs s6's correction** — lifting the check to `lint:tokens` is right,
but because the tree must stay SEARCHABLE, not because the gates are
blind (they are not; s5's own bullet already concedes lint-tokens
survives, contradicting its lede).

**@human — six visual judgments carry forward intact** (the terracotta
in both schemes beside a `rejected` card; blocked ghost vs ready grey at
arm's length; **wave 0 as a wall — s1**; where the lens control belongs
— s4; the lens control beside the overlay control; and the tasks-lens
header with nothing on the right). Headless cannot answer any of them.
