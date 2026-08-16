# State

Updated: 2026-08-16 by integrator (T-037 merge), claude-opus-5 @fresh

## Just completed
T-037 (mount the lens, S, app-shell) done and merged — built by
`claude-opus-5 @fresh`, S-tier (executor + tests, no verifier session),
`review: self-verified`. **MILESTONE 3'S FIRST SLICE NOW DELIVERS ITS
PROMISE.** T-023 (kit) → T-024 (lens) → T-026 (entry) → T-037 (mount)
are all through the pipeline. Hand-driven genesis renders live: open a
docs-less folder, hand-drive the method in a terminal, and watch the
plan materialize in the pane as each file lands.

**THE MOUNT IS TWO LINES; THE REST IS PROOF.** `import { GenesisPane }
from "@/genesis/GenesisPane"` and `<GenesisPane docs={docs} />` inside
the slot T-026 marked. The props T-026 shaped for exactly this
(`{ projectDir, docs: DocsModelState }`) were handed straight through —
nothing plumbed, added or fetched, no new IPC, no polling, no new
dependency, both lockfiles zero-diff. **Zero-byte diff under
`app/src/genesis/**`**: T-024's fence held without a fight.

**THE BUNDLE GREP, RUN ON BOTH SIDES WITH THE SAME COMMAND** — and
re-run independently here at the merge, not read from the notes. The
pane's own strings (`the project, so far`, `genesis-artifact`,
`genesis-north-star`, `genesis-backbone`, `grows as you answer`) go
**0 → present**; the retired placeholder line `nothing written yet`
goes **present → 0**; the screen's own strings stay present. Bundle
**429.66 kB (`index-BP8uDHFW.js`) → 442.05 kB (`index-DvrlAOQE.js`)**,
the +12.4 kB being the pane and its derivation module reaching the
shipped JS for the first time. I found the pre-merge 429,655-byte asset
still sitting in `app/dist/` and confirmed the before-half against it
first-hand before rebuilding. **All three of T-026's original
measurements are now closed on their own terms**: there IS a src-side
import of `app/src/genesis/`, the regenerated graph DOES carry the
C-05→C-13 file edge from `GenesisScreen.tsx`, and the built bundle DOES
contain GenesisPane's own strings. (`genesis-pane` alone is a useless
probe — it is a substring of `genesis-pane-slot`, which T-026 already
shipped; every probe used is the pane's own testid suffix or its own
copy.)

**THE GUARD.** Mounting the lens puts C-13 on the shell's critical
path, and T-024's degradation criteria covered malformed DOCS, not a
broken COMPONENT. `GenesisPaneBoundary` (React's own boundary contract,
~45 lines, no library, nothing reusable invented for one call site)
keeps a throwing pane from taking the shell down. Two design points,
both pinned:
- **It does NOT latch.** `resetKey` is `docs.seq`, so the next snapshot
  the watcher delivers gets one fresh attempt — a single torn file
  cannot brick an interview for the session, and a pane that keeps
  throwing keeps showing the fallback.
- **It WRAPS the pane rather than keying it**, so ordinary renders
  leave the pane mounted and its change log — T-024's writing-pulse
  window — intact.

Proven at TWO levels, and the first uses the REAL pane with no module
mocking at all: *screen level*, a `DocsModelState` whose `effective` map
is a **throwing Proxy**, which `observeDocsChange` touches first thing,
so the genuine `GenesisPane` throws during render — the screen, heading,
project path and slot all survive, the fallback renders, and a further
snapshot renders the real pane again (recovery asserted). *Shell level*,
the REAL App with real store, real docs-model and real parser, driven
front door → `genesis`: `<main data-screen="genesis">` still mounted,
`<h1>nputer</h1>` still there, `data-seq` advanced to 21 (the store kept
running underneath), only the pane's subtree replaced. The fallback copy
deliberately refuses to imply data loss, because there is none — the
screen only reads (ADR-017) — and deliberately avoids the string "the
project, so far" so it can never satisfy this task's own bundle grep.

**13 new tests, ALL canary-proven to execute** (`expect("PROBE").toBe(
"EXECUTED")` injected as the first statement of every one of the 13
`it()` bodies, run — 13 failed — then reverted, both files byte-identical
after). **Five mutation drills**, each planted, run and reverted:
unmounting the pane turns 15 of 19 tests red (and `tsc` catches it first
via TS6133); unmounting + rebuilding reds the bundle test by name and
shrinks the bundle back to 429.29 kB; **the stale-build guard caught a
genuine false pass** — with a stale `dist/`, the *contents* test still
passed while the *staleness* test went red; neutering the fallback reds
criterion 5 at both levels while the healthy path stays green; removing
the boundary entirely lets the throw escape uncaught.

**NEW HOUSE FACT, and I reproduced it deliberately rather than taking
it on faith: `npm test` in app/ NOW REQUIRES A PRIOR `npm run build`.**
The bundle test **fails loudly — it never skips** — when `dist/` is
missing or older than the mount. Running `npm test` against the
pre-merge `dist/` at this merge gave **466 passed / 2 failed**, with the
message naming the fix verbatim (`dist/ predates
src/components/shell/GenesisScreen.tsx — rebuild (npm run build) before
trusting the bundle grep`). A probe that quietly passes on an absent
build is worse than no probe. This is already the documented order
(CONVENTIONS § Build & test lists build then test) and already CI's
order (`app build` at ci.yml:115-116 precedes `app suite` at :118-119),
so nothing changed except that violating it is now caught. Assertions
are made on `includes()` booleans, never on the 442 KB haystack, so a
failure prints one line instead of the bundle.

**THE ONE EXISTING TEST FILE THAT MOVED, declared loudly.**
`app/test/genesis-entry.test.tsx`, +20/−5, three assertions — it could
not not move: steps 4/5/6 asserted the text of the placeholder line that
criterion 4 orders replaced. Those queries now read the PANE's own
header, plus an added non-null assertion on the pane and three added
assertions that written files reach the pane's artifact list as
non-`expected` rows. **Changed, never loosened**: every replacement
asserts strictly more than what it replaced, because it can only pass if
the pane itself rendered inside the real App. Steps 1–3 byte-untouched.
No `.skip`/`.only`/`.todo` anywhere in the branch.

SUITES ON MERGED MAIN, all four re-derived here first-hand, fresh
installs, ADR-011 order, and all four re-run green AFTER this
checkpoint's docs and fixture edits (the T-024 live-tree lesson applied
to my own commit): lib/parser `npm ci` + `npm test` **159/159 (10
files)**, `npx tsc --noEmit` clean, `npm run build` clean · app `npm
install` + `npx tsc --noEmit` clean + `npm run build` exit 0 + `npm
test` **468/468 (26 files)** — 455 + 13, the forecast landing exactly ·
app/src-tauri bare `cargo test` **139 passed + 2 ignored** (the branch
touches no Rust — zero-byte diff under `app/src-tauri/` — and it was run
anyway, because that is the lesson T-024 paid for) · tools/e2e `npm ci`
+ `npx playwright test` **17/17 in 4.9s**, headless, one worker, its OWN
vite on 14520. Nothing ever bound or contacted 1420; no server left
running.

STANDING INTEGRATOR PRACTICE (T-009-s1, the ratified CONVENTIONS interim
regen rule; retires when T-014's `nputer index --check` becomes the
gate) — **TWELFTH** exercise, and the first where the delta was the
POINT rather than a side effect. It FIRED and it moved the graph to
**86 files, 565 symbols, 941 edges** (from 84 / 539 / 909 — **32 edges
added, ZERO removed**), 346,740 bytes, sha256
`fc76b37961f613cb7ad6a17b24768f120c6ff5ddfcefd068f30a8104d42c563e` —
**byte-identical across three runs** (golden regen → second golden regen
→ plain ignored self-check), and the plain self-check PASSES, so the
committed graph is current. Still `languages: ["ts"]`, still ZERO
`tools/` paths, still zero `.rs` files indexed (Rust extraction is
T-010's).

**THE EDGE THIS MERGE EXISTS FOR is in the graph**:
`f:app/src/components/shell/GenesisScreen.tsx --import[GenesisPane]-->
f:app/src/genesis/GenesisPane.tsx`. The rest of the delta, re-derived
here from the raw added/removed edge sets and from an independent re-run
of the derivation engine — **the branch's forecast was confirmed in
every particular, which is unusual and worth recording**:
- files 84 → 86: adds `app/test/genesis-mount.test.tsx` and
  `app/test/genesis-pane-boundary.test.tsx`; nothing removed.
  Content-changed (hash/loc/symbols only): `GenesisScreen.tsx` (73 → 141
  loc, gaining a second symbol — the `GenesisPaneBoundary` class),
  `genesis-entry.test.tsx` (220 → 235), `node-builtins.d.ts` (28 → 30).
- mapping 84 → 86; **C-05 35 → 37** (both new suites under the app/test
  umbrella). Every other count holds — C-06 21, C-08 10, C-09 3, C-10 2,
  C-12 11, and **C-13 STAYS 2**: the lens gained a consumer, not a file.
  D2 stays empty, no unmapped node, `derived.issues` stays `[]`.
- findings: **no finding added or removed** — five D1 rows and the same
  three D3s. `D1:C-05→C-13`'s fileEdges goes 2 → 4, gaining
  GenesisScreen.tsx→GenesisPane.tsx (sorted first) and
  genesis-pane-boundary.test.tsx→GenesisPane.tsx (sorted third).
- relation table: same 26 rows, same **13 confirmed / 5 undeclared / 8
  planned** tally. **Exactly two observedCounts move** — C-05→C-10
  **16 → 19** and C-05→C-13 **2 → 4**.
- The ceaa949 ordering lesson, NINTH hold, and **measured this time
  rather than asserted**: regenerating before the fixture edits landed
  gave sha `413ddaec…`; regenerating after them gives `fc76b379…`. A
  regen-first ordering would have committed a stale graph.

FIXTURES RECONCILED, AND THE ONE DELIBERATELY NOT TOUCHED. Five
assertions in `app/test/architecture-dogfood.test.ts` (the test name;
`toBe(84)` → 86; mapping `["C-05",35]` → 37; D1:C-05→C-13's two new
fileEdges; the two relation rows) plus a dated addendum enumerating
every delta above, and one in `app/test/map-dogfood-render.test.tsx`
(index hint `84 files` → 86). Changed, never loosened — every moved
number is still pinned by the same whole-array `toEqual`.
**`lib/parser/test/smoke.test.ts` was deliberately left alone** and is
byte-untouched: it pins the component REGISTRY read from
docs/architecture/components/, and T-037 declares no component.

**MY C-05→C-13 DECLARATION JUDGMENT: it STAYS UNDECLARED, and I
recorded why in the fixture itself so the next reader does not have to
ask.** The finding changed character at this merge — before it, two of
C-05's own test suites reaching a child component (arguably umbrella
noise); now it carries a genuine SOURCE dependency of the shell on the
lens, the same shape as the DECLARED C-05→C-08 and C-05→C-12. Declaring
it (a `depends_on` C-13 in `docs/architecture/components/C-05-app.md`)
would drain the D1 honestly and move the tally to 14/4/8. I did not take
it, for three reasons: (a) **role boundary** — the dogfood fixture's own
maintenance contract names two different actors, the integrator who
regenerates the graph and the ARCHITECT who changes the registry, and a
`depends_on` edit changes DERIVED OUTPUT (a finding drains, the tally
moves), which is a ruling rather than a merge-time truth-fix; (b) **the
composition is explicitly provisional and on the @human list right
now** — the pane sits full-width inside T-026's card frame only until
T-027 builds the split view around it; (c) **draining a finding at the
same merge that first made it meaningful destroys the signal before any
architect reads it**. Filed for triage below, not taken.
**One correction of record while I am here**, because the belief is
already circulating: such an edit would **NOT** move
`lib/parser/test/smoke.test.ts`. I checked rather than assumed — that
suite pins the component ID LIST, C-06's shape, and a
referential-integrity loop C-13 already satisfies. **THREE fixtures move
when a COMPONENT is declared** (the T-024 lesson); a `depends_on` edit
moves the dogfood fixture only. That belongs in T-024-s5's inventory.

INTEGRATOR JUDGMENT CALLS, recorded. **ARCHITECTURE: three edits, all
truth-fixes, no new table row.** C-05's status cell and the "Code
layout" bullet both said the lens was an unmounted slot that nothing
imports and Rollup drops — **both false as of this merge**, and both now
say what is real (the screen renders the pane behind an error boundary;
the pane is in the shipped bundle; the graph carries the C-05→C-13
source edge, still undeclared and deliberately so). The Interfaces
"Genesis:" line gained the rendering half: the screen hands its live
`DocsModelState` straight to the pane, so the lens updates on C-10's
existing watcher path with no new IPC and no polling, behind a
non-latching boundary. No new component row — `GenesisScreen.tsx` is
plain C-05 shell code. **ROADMAP: the first-slice line was deliberately
written to await this merge and has been rewritten.** It no longer says
the promise is undelivered; it says the slice is COMPLETE, that
hand-driven genesis renders live with no agent in the loop yet, and
spells out what a user can do end to end. The honest remainder is kept:
T-025, T-027, T-028, T-029. **NO new ADR** (three-prong): T-037
implements ADR-017's already-settled genesis architecture (planner
writes, app is a lens) using the seam ADR-012's IPC pattern already
established — it adds no IPC at all, so there is nothing to charter;
nothing here contradicts any ADR (ADR-011 untouched, no new package, no
lockfile movement, zero Rust diff so `EXPECTED_GRANTS` cannot have
moved); and the task's durable calls — the boundary's non-latching
`resetKey = docs.seq` shape, the wrap-don't-key choice that preserves
the change log, the fallback copy's refusal to imply data loss, and the
build-before-test consequence — are recorded in the task file's
implementation notes.

## In progress / broken right now
**T-025** (agent runner, L, app-agent + app-shell) and **T-038** (token
lint precision, S, tools/e2e) are both **BUILDING** in their own
worktrees. The t037 worktree is removed; its branch is KEPT alongside
t023/t024/t026/t036. Main tree clean, all four suites green.

**KNOWN RED, OWNED — this is the one thing currently broken on main.**
`npm run lint:tokens` (from tools/e2e) **exits 1 on untouched main**. A
regex literal at `app/src/genesis/genesis-derive.ts:231`
(`/<!--[\s\S]*?(?:-->|$)/g`, T-024's `stripHtmlComments`) trips pattern
P1, whose `-\[[^\]]` matches the `--[` inside it. This is **the exact
false-positive class T-020's verifier predicted**, arrived. The tool
itself is fine — `--selftest` is green on 17 samples — the pattern is
what is wrong. It is **not** a T-037 defect: the lint's output is
byte-identical on main and on the branch. **Why it is sharper than an
annoyance**: the lint is CI's step 1, gating *before* every install
step, so the standing "watch the first CI run" item would abort before
collecting **any** of the Linux evidence it exists to gather. **T-038 is
in flight to fix it by PRECISION — never by removing a pattern, never by
an allowlist.** I ran it here for information only and did not treat it
as a merge blocker; it is outside this merge's fence and fixing it here
would have hidden the finding rather than recorded it.

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020), now
gated behind T-038 above. At the repo's first push (`git remote -v` is
still empty), confirm in order: the ubuntu apt/webkit2gtk set installs;
the three `uses:` SHA pins resolve; playwright-on-Linux runs the lane;
`cargo audit` behaves as it does locally; the xvfb `tauri dev` boot
prints both `[nputer]` startup lines. AND (T-018-s3 fold) the THREE
T-018 SENTINEL LIVE TESTS inside the ubuntu `cargo test` step —
replaced-wholesale and deleted-recreated docs/. They discriminate only
where inotify watches INODES; macOS FSEvents watches paths and was
accidentally resilient, which is why T-018's replace-half evidence is
mechanism-only today. Green there CLOSES that evidence gap; red there is
a real reconcile gap macOS could never surface, and gets filed
immediately. This run is also the gate that closes T-001/T-003's Linux
halves, and it carries T-026-s1 (the plan probe's exact-case match makes
macOS and Linux disagree about "already has a plan" — ruled safe, but
the Linux lane is where the divergence becomes visible) and T-021-s1
(the ACL pin is macOS-derived).

## Next up (1–4)
1. **@human — THE VISUAL SESSION IS OPEN, AND NOW FULLY UNBLOCKED.**
   Every item below is reachable in a running app for the first time.
   **The route to the pane**: "Start an interview" on a docs-less
   folder, or "Start an interview here" on a folder the app just
   refused. Session agenda, in one sitting:
   - **T-024's pane, light AND dark — the item this session was
     scheduled on, and it is finally live.** The standing questions come
     with it: built/forming/slot card contrast in dark, the warm
     writing-row border, the five type sizes that moved 0.5–1px, and
     the substituted footer right slot (`stage ~4 · constraints`).
   - **Two NEW framing questions that exist only because of the mount**,
     both about COMPOSITION rather than the pane itself. (a) T-024 drew
     the pane as the **RIGHT HALF of a split view**; T-027 builds the
     left half, so until then it sits **full-width inside T-026's card
     frame**. Does its `bg-sidebar` ground read right framed by a
     `bg-card` bordered box — a sidebar tone inside a card, which the
     design never draws? And does the **five-across backbone grid** still
     hold at full width when it was drawn for a half-width pane?
     (b) The slot is `min-h-0 flex-1` so the pane's own `overflow-y-auto`
     region scrolls — but the shell's column is **`min-h-screen`, not
     `h-screen`**, so at very short window heights the page may grow
     before the pane's own scroll region engages. Worth one look at a
     short window with the complete tree loaded.
   - **T-026's front door, light AND dark**: the two-button row and the
     "No plan in &lt;folder&gt;" card against the design's `open a
     folder` screen — button sizes/inks, the checklist ○/✓ (the ✓ rides
     `--review-disc`, whose dark value #4ecf9e is a token-family
     derivation, not measured from a dark mockup), the card's 10px vs
     the design's 12px radius, and whether the footnote reads as a
     footnote.
   - **The at-a-glance amber judgment** (T-012 criterion 5's human half
     — drift stroke vs building/verifying fills, BOTH schemes, incl.
     composed building+drift; the dogfood hero renders it live).
   - **The launch-shot re-judgment** (T-006's pending screenshot
     predates the rail — light + dark now include it).
   - **The T-023 dry-run conversational quality judgment** (did the two
     "pushing back:" challenges actually challenge; the founder was
     builder-scripted in-session, so true cold-context evidence still
     arrives with T-029).
   - **T-026-s4's question, and note the answer CHANGED SHAPE.** Point
     the app at a folder whose `docs/` holds files but no plan (a lone
     ARCHITECTURE.md). It no longer reads "docs/ · nothing written yet"
     — that line is gone from the bundle. It now renders **through the
     lens**, as the pane's own `docs/ · 0 files written` scaffold with
     `expected` placeholder rows and north star `forming…`. Judge
     whether THAT reads right over a non-empty docs/.
   - **The bare-placeholder question is MOOT** — the pane renders. It
     can come off the list.
   - **The real picker flows on the real screen** — the standing T-007
     checklist, still @human because native dialogs are unreachable from
     a browser harness and tauri-driver has no macOS: "Start an
     interview" → native dialog → a docs-less folder lands on the
     genesis screen; ⌘N and ⌘O on the front door; "Start an interview
     here" on a folder the app just refused; a folder that already has a
     plan → the board, not genesis.
   - **A Linux run** — the "watch the first CI run" item above, which
     **T-038 must land first** or it aborts at the token lint.
2. MILESTONE 3 (T-023…T-029, ADR-017) — **first slice
   T-023+T-024+T-026+T-037 COMPLETE, promise delivered**. T-025 (agent
   runner, L) is BUILDING and holds the app-shell lane; the human-ruled
   queue after it is T-022. **T-027** (L, split view — the conversation
   half, and the left half of the composition the @human items above ask
   about) dispatches when T-025 merges; T-028/T-029 behind it. The
   milestone itself is NOT claimed.
3. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16 night): app-shell lane
   queue was T-021 → T-026 → T-025 → T-022; T-021 and T-026 are DONE and
   **T-025 holds that lane**. Milestone 3 runs through T-029 as blockers
   clear. Triage: APPLY granted — but tasks NEWLY created by triage do
   NOT dispatch without the human. Unchanged method rules: a second
   REJECTED on any task parks that lane for the human; @human judgments
   are never self-answered.
4. Suggestion backlog for the NEXT TRIAGE — **23 suggestion files on
   disk**; none dispatched. Of those, **T-037-s1 is already ABSORBED**
   (T-038's frontmatter carries `Absorbs: T-020-s5, T-037-s1`),
   **T-024-s2 is DISCHARGED** (C-13's D3 cleared at T-024's own merge —
   resolve it, do not schedule it), and **three are parked in place**
   (T-008-s1 awaits F-04/F-05 layout decisions, T-018-s1 awaits a
   Windows lane, T-003-s2 is already encoded). That leaves **eighteen**
   genuinely awaiting disposition: T-020-s3 · T-020-s6 · T-021-s1 ·
   T-021-s2 · T-021-s3 · T-024-s1 · T-024-s3 · T-024-s4 · T-024-s5 ·
   T-024-s6 · T-026-s1 · T-026-s2 · T-026-s3 · T-026-s4 · T-026-s5 ·
   T-026-s6 · T-026-s7 · T-036-s1.
   **CHANGED BY THIS MERGE**: **T-024-s1 and T-026-s7 are UNBLOCKED but
   NOT discharged.** Both wanted served-bundle probes; T-024-s1's needed
   the pane mounted and now has a route to it, and T-026-s7's premise
   that the dev harness cannot reach either front-door state is
   unchanged. They still want the E2E lane's small DEV-only shell
   harness — the blocker they named is gone, the work is not done. Also
   **T-024-s5 gained a concrete entry**: a `depends_on` edit moves ONE
   fixture, a component DECLARATION moves THREE (verified at this merge,
   see the judgment above) — that distinction is exactly the folklore
   that suggestion exists to write down.
   INTEGRATOR OBSERVATIONS for the same triage:
   (a) **RULE ON C-05→C-13.** The one-line mount is done, so the
   observation "the unmounted lens belongs to nobody" is CLOSED. What
   replaces it is a real architecture question: the shell now imports
   the lens as source, and the registry does not say so. Declare it or
   ratify the drift — my reasoning for leaving it is above, but it wants
   an architect, not another integrator.
   (b) **The T-037-s1 file should be REMOVED to complete the T-016
   encoding.** T-038's dispatch already declared the absorption and
   removed T-020-s5's file in that same commit; it could not remove
   T-037-s1's, which existed only on the t037 branch until this merge.
   I left the file in place rather than delete unilaterally — it is one
   `git rm` and a line in the next commit that touches docs/tasks/.
   (c) **SIXTEEN open suggestion files still carry no `id:` field**
   (verified by grep at this merge, not assumed — the count held because
   T-037-s1 correctly carries one). The T-016 encoding requires an id at
   parking and the parser accepts the omission silently, which is why it
   keeps recurring. Worth a rule, same family as T-030's
   parser-strictness pass.

## Open questions
None.
