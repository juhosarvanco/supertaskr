---
id: T-031
title: Board completeness pass — containment sweep, verdict parity, card-level issues
feature: F-02
milestone: 4
priority: 15
size: M
status: verifying
blocked_by: []
touches: [app-board, app-interview]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-017-s1, T-017-s2, T-017-s3, T-019-s1, T-024-s4, T-024-s6
(the board-badge half; the parser half lives in T-030 and the map-badge
half in T-032). Triage 2026-08-16:
all four live in the same files (TaskDetailPanel, GhostCard,
verdicts.ts, the board-model join) and share the hostile-fields
fixture discipline; T-017-s1/s2 explicitly compose as one commit.
Launch-prep: the board is the launch screenshot surface, and the
splitter fix stops a once-rejected face reading `rejected ×2`.

## Acceptance criteria
- THE remaining file-derived text surfaces SHALL contain pathological
  unbroken runs with the T-017 treatment: GhostCard's provenance line
  (`suggested · <suggested_by>`), TaskDetailPanel's h2 title and
  ref/id line, and the panel chips/stamps printing raw frontmatter
  (blocker ids, touches slugs, built_by/verified_by, file-path
  footer) — break-words on wrapping text, a board-truth-style class
  pin per surface, and a hostile-fields fixture (the T-004-s1 repro
  generalized: 10k-char unbroken suggested_by, blocker id, stamp)
  asserted headlessly at DOM level (T-017-s1).
- THE VerdictBlock text container SHALL gain the notes body's
  overflow containment (`overflow-x-auto`, matching NotesDisclosure)
  plus a class pin, so an unbroken run in a REJECTED repro scrolls in
  place instead of widening the panel (T-017-s2).
- THE verdict splitter SHALL anchor at column 0 (test the RAW line,
  not line.trim()) so indented verbatim quotes of earlier headers
  fold into their parent entry and rejected ×N stops counting quoted
  headers; both quote forms (blockquote `>` and indented) SHALL be
  pinned in detail-presentation.test.ts (T-017-s3).
- THE board SHALL surface soft issues on the affected card: a pure
  lens joins model.issues to cards by their `file` field; the card
  face wears a small issue mark and the detail panel lists the
  messages verbatim; the header aggregate count is unchanged
  (T-019-s1).
- THE genesis pane's north-star title SHALL carry the T-017 treatment
  (`break-words` on the title, `min-w-0` on its flex ancestor, no
  truncate/line-clamp) with a class pin and the same hostile fixture:
  it is the pane's one unbounded text surface — every other one is
  bounded (chips clip at 44 chars, artifact rows and backbone names
  `truncate`) — and `firstSentence(vision)` returns the whole
  collapsed blob when no `.!?` is found, so a mid-write NORTH_STAR.md
  is the realistic way to hit it (T-024-s4).
- THE board's model badge SHALL be bounded: ModelBadge
  (app/src/components/board/badges/ModelBadge.tsx) carries no
  `truncate` and no `max-w` today, so a stamp whose model half is not
  a single clean token widens the card. Defense in depth BEHIND
  T-030's parser fix, which is the load-bearing half; pinned with a
  live compound stamp as the fixture (T-024-s6).
- Zero new tokens; tokens-only styling; both schemes; hostile field
  content renders as text nodes only. Visual judgment stays @human.

## Implementation notes

Executor `claude-opus-5 @T-031`, 2026-08-25, branch
`task/T-031-board-completeness`, base `765362e`.

**SIX OF SEVEN CRITERIA BUILT; THE VERDICT SPLITTER IS NOT BUILT AND IS
ROUTED.** Criterion 3 asks for a change to `verdictEntries` in
`app/src/lib/verdicts.ts`. That path is listed verbatim in
`docs/architecture/components/C-05-app.md`'s `paths:`, and C-05 carries
`touch_slugs: [app-shell]` — so it is outside this card's
`[app-board, app-interview]` fence, and `app-shell` was held by a live
lane (T-123) at dispatch. ARCHITECTURE's own paragraph under the slug
table settles which reading wins: the prose line is *"A SIGNPOST AND NOT
THE MAP"* and the AUTHORITY is each component file's `touch_slugs:`;
read that way `app-board` is C-08/C-09/C-11 and none of the three claims
`verdicts.ts`. The card inherited *"Touches app-board only"* from
`T-017-s3`, which was simply wrong about the slug — its two siblings say
the same sentence and happen to be right, because their surfaces really
are under `app/src/components/board/**`. **`T-031-s1`** carries the
criterion with the fence it needs and the reason a board-side wrapper
was refused rather than built: it would leave a splitter known to be
wrong live in the tree and put half of one rule in a second module,
which is the exact thing `verdicts.ts` exists as its own module to
prevent.

**CRITERION 1 — the sweep, eight surfaces, one treatment.** `min-w-0
break-words` on GhostCard's provenance line, the panel's `h2`, the
panel's id/ref line, both blocker-id chips, the touches slugs, both
provenance stamps and the file-path footer, plus the panel's
`suggested_by` row, because the criterion's own fixture names a 10k-char
`suggested_by` and that is where it lands when a ghost is opened. Three
things are worth the verifier's attention:

- **The id/ref line lost `shrink-0`, deliberately.** It prints an id for
  a real card and the FILE PATH for an id-less suggestion (`refLabel`),
  so it is unbounded text; a flex item that refuses to shrink cannot be
  contained by any break utility, because its flex basis stays its
  content width. Ordinary ids are far too short for the shrink to reach
  them. This is the one place the sweep changes ordinary layout.
- **A resolved blocker chip cannot carry a hostile run by
  construction**, measured rather than assumed: resolution requires a
  declared task, and the parser's identity gate refuses any `id` not
  shaped like `T-016`/`T-016-s2` (an id of 10 000 `H` comes back as
  `invalid-field` with the record withheld). So the fixture's unbounded
  run lands on the UNRESOLVED chip, and the resolved one takes the same
  treatment unconditionally as defense in depth against the day that
  grammar moves. The fixture note in `board-truth.test.tsx` says so.
- **Three same-class surfaces were found and NOT swept**, because the
  criterion enumerates its list explicitly and a diff that quietly does
  more than the card says is as hard to review as one that does less:
  the acceptance-criterion rows (`min-w-0` with no `break-words` — the
  same half-treatment T-017 found on the title spans) and `NeutralChip`,
  one of whose three values is the free-form `feature` field. Filed as
  **`T-031-s3`**.

**CRITERION 2 — scroll, not break.** `VerdictBlock`'s text container
takes `NotesDisclosure`'s `overflow-x-auto` and deliberately NOT
`break-words`: a verdict is a verbatim quotation, often preformatted,
and re-flowing it would change what the reader sees, which is the one
thing a verbatim surface may not do (T-005). The pin asserts the absence
of `break-words` for that reason.

**CRITERION 4 — one lens, two consumers, joined on `file`.**
`issuesByFile` lives in `board-model.ts` and is the ONLY join between
`model.issues` and a card; `selectTaskDetail` imports it rather than
filtering again, so the face's mark and the panel's list can never
disagree (T-057's rule, applied to a second derivation the way
`verdicts.ts` applies it to the first). It reads the FIELD structurally
(`"file" in issue`), so a kind added tomorrow that carries `file` joins
the day it lands. Choices a verifier should weigh:

- **Cross-file kinds are skipped, and that is the criterion's own
  wording** (*"by their `file` field"*). `duplicate-id`, `aliased-id`,
  `dependency-cycle` and `ambiguous-mapping` carry `files` and say
  something about a RELATION between records, not about either record's
  own file; they already have surfaces (`aliasedWith` on the column,
  T-097; the header strip, T-077), and two of the four routinely name
  `docs/ROADMAP.md`, which draws no card. The other reading and its two
  costs are filed as **`T-031-s2`**.
- **The mark rides the ID ROW, not the meta row.** The meta row is
  conditional (`hasMeta`) and sheds the model badge past 40 cards, and
  the below-slice variant has no meta row at all — a disclosure that
  disappears when the board gets busy is not a disclosure.
- **`text-warning` is the sanctioned consumer**: tokens.css states that
  warning is a STROKE and never a fill, so the mark is ink on the card's
  own status paper rather than a second fill competing with it. The
  panel's rows use the `--warning-chip-*` tints, which that same comment
  names as the warning family's one fill surface. Both schemes carry all
  three tokens. **Zero new tokens.**
- **The `issues` section renders only when non-empty**, unlike every
  other section, which shows `(empty)`. That is right for a section a
  reader came looking for and wrong for a defect notice, which would
  otherwise say "(empty)" on every clean card in the project and stop
  being read inside a week.
- **Shapes differ by neighbourhood, on purpose**: `BoardCard.issues` is
  ABSENT rather than `[]` on a clean card (the `aliasedWith` /
  `rejectedCount` discipline in that file), while `TaskDetail.issues` is
  always `[]` (matching `blockedBy` and `touches` in that interface).
- **`App.tsx` is untouched**, so the header aggregate is unchanged by
  construction; it is pinned anyway, at both layers.

**CRITERION 6 — the bound is three utilities and all three are
load-bearing.** `min-w-0 max-w-24 truncate`. `truncate` alone cannot
shrink a flex item whose automatic minimum is its content, and
`max-w-24` alone loses to that same minimum (min beats max in the
cascade). This is defense in depth BEHIND T-030's parser fix, which is
working: the live compound stamp now yields `opus`, not the
50-character badge T-024-s6 measured. What is left is everything the
split is mechanical about — T-030-s1's `+` wart, a stamp with no `@` at
all, a single long token — and this chip had no bound of any kind.
Clipping a CHIP is not the board hiding truth: the full raw stamp rides
`title=` and the panel's provenance row prints `builtBy.raw` verbatim,
both pinned in the same body.

**Suites, at tip `fe7ffc6` unless noted, every exit read from `$?`
unpiped:** app `npm run build` **0**, `npm test` **958/958 exit 0** (940
at the base + 18 new bodies); lib/parser `npx vitest run` **263/263 exit
0**, unmoved; tools/e2e `npm test` **143/143 exit 0** on scratch port
15000 (run at `d72d551`, and `app/src` is a 0-path diff between there
and the tip — only `app/test/**` moved), `npm run typecheck` **0**,
`npm run lint:tokens -- --selftest` **0**, `npm run lint:tokens` **0**
(TOKEN 131 / CONTROL 611, printed, never pinned).

**BOOT GATE fired and was run**: `NPUTER_BOOT_PORT=15001 npm run
boot:check` exit **0**, both lines — `[nputer] project folder:
/Users/ujju/Projects/nputer-T-031` and `[nputer] window "main"
created`. **GRAPH REGEN fires and the gate was ASKED rather than
predicted**: `index --check --root ../..` exits **1**, STALE, and it is
a real red rather than the `--root` false one (it prints both counts and
a file diff, not `committed: MISSING`). Against the committed graph this
lane inherited — **648863 bytes · 126 files · 1126 symbols · 1712
edges** — a fresh index is **652661 · 126 · 1137 · 1718**: **+11
symbols, +8 edges and −2, no file added or removed**. Every new edge
lands on a pair that already existed (C-09→C-08, C-05→C-08, and
intra-file), so **no component relation moves**; re-derive at the merge,
because main's own graph advanced with T-096's checkpoint after this
lane was cut. The regen is the integrator's at the checkpoint.

**Compiled-CSS probe, the T-017 discipline** (unmapped utilities are
silently dead, so a class contract alone would not be evidence). Read
out of `dist/assets/index-*.css` after `npm run build`: `break-words`,
`overflow-x-auto`, `min-w-0`, `truncate`, `whitespace-pre-wrap` and
`max-w-24 -> calc(var(--spacing-unit) * 24)` all present, and the three
colour utilities resolve to tokens (`text-warning -> var(--warning)`,
`bg-warning-chip -> var(--warning-chip-bg)`,
`border-warning-chip-border -> var(--warning-chip-border)`). No
arbitrary value anywhere; `app/src/styles/tokens.css` is a 0-file diff.

**THE POISON DRILL — 35 mutants, all 35 RED, all restored.** Arm (c): a
detached scratch worktree named `drill-T-031` (session-scoped, not the
shared literal `drill` — `T-088-s3`), at a NAMED commit, `node_modules`
and `lib/parser/dist` symlinked in and `npm run build` run inside it
first. No `CARGO_TARGET_DIR` hazard: no Rust body is drilled. Every
mutation ONE SIDE ONLY and always the PRODUCER; a driver that refuses
any path outside the drill and requires a match count of exactly 1; the
mutated TEXT read back with `git diff --unified=0` BEFORE each suite
ran. Baseline **109/109 exit 0** over the four touched files.
Restoration proved per path by sha256 against the drill's own commit
after every mutant (35 MATCH, 0 MISMATCH) and by an empty tracked diff
at the end; symlinks UNLINKED rather than deleted with all three targets
verified present, worktree removed and pruned.

**AND THE DRILL'S KILL-SET ANALYSIS COST THIS LANE THREE BODIES, WHICH
IS THE POINT OF ASKING THE SECOND QUESTION.** CONVENTIONS says the drill
proves a body RUNS and that its value MATTERS, never that it is not a
DUPLICATE, and that shape six has no mechanical remedy — the drill has
to ASK. Asking mechanically (which mutants does each body kill, and is
that set a subset of another body's?) found three:

1. A *"the notes body it copies still carries the same containment"* pin
   redded under exactly one mutant, and the pre-existing T-005-s2
   disclosure body asserts that same class on that same element and
   redded on the same mutant and on nothing else. Deleted; a comment
   names the pin that holds the other end.
2. The two `select-task-detail` bodies had **identical** kill sets — the
   same three mutants, neither killing anything alone. Merged.
3. *"the join adds a surface and never a filter"* was a strict subset of
   the DOM body beside it. Merged, arithmetic kept.

After that, **13 of 18 new bodies kill a mutant no other body kills**,
and the four remaining subsets are declared rather than hidden: each
asserts at a DIFFERENT LAYER from its superset (a pure selector's Map
keys, message order and KEY ABSENCE — none of which a DOM body can
express — against the rendered face), and the subset relation is an
artifact of the DOM body catching a selector-level mutant incidentally.
Two mutants exist only to discriminate: `M31` widens `issuesByFile` to
read `files` as well (killing only *"reads the FIELD, not the kind"*)
and `M35` applies `break-words` CONDITIONALLY to long titles — the
tempting bad fix — killing only *"an ordinary terminated vision wears
the same containment"*.

**Negative assertions carry positive controls in the same body**, per
the standing rule: every containment pin asserts the whole hostile run
really is in the DOM before asserting that no clamping utility is
present, so a fixture that never rendered cannot pass; the clean-card
"no mark" assertion sits beside two flagged cards in the same render;
the genesis "bounded surfaces stay bounded" body is the discriminating
half of the north-star exception.

**@HUMAN — three looks this card deposits.** The card says visual
judgment stays @human, and jsdom does no layout, so these are named
rather than looked at:

1. **The soft-issue mark's colour against six status fills.** It is
   `text-warning` ink sitting between the id and the title on the card's
   own status paper. Amber ink on the amber `building`/`verifying` pair
   may read as noise, and on the teal `done`/`merging` pair it will be
   the loudest thing on the card. Both schemes.
2. **Where the `issues` section sits in the panel.** It is FIRST in the
   body, above acceptance criteria, on the argument that a defect notice
   the reader has to scroll to is not a notice. That is a taste call.
3. **The badge clip at `max-w-24`.** 6rem of 11px mono is roughly ten
   characters; `opus`, `fable` and `codex` are comfortable, a long
   single-token model name will ellipsize. Whether the cap is right is a
   look, not a measurement.

**Findings routed rather than fixed:** `T-031-s1` (the splitter's
fence), `T-031-s2` (join on `file` vs `files`), `T-031-s3` (two more
surfaces in the same class), `T-031-s4` (C-05 claims `app/test/**` for
`app-shell` while thirteen lanes fenced without `app-shell` have edited
it — derived at `765362e` by walking every merge on main).

## Verdicts

2026-08-25 — `claude-opus-5 @T-031-verify` (independent verifier):
**APPROVED.** Six of seven criteria are met and I did not take that on a
class list — every criterion here is a claim about LAYOUT, so I measured
CONTAINERS in real Chromium at 1280×720 with a positive control on every
negative assertion. Criterion 3 is NOT built; the fence reason is
correct, I re-derived it from the registry rather than reading it, and it
is routed as a real file. Verified in a detached scratch worktree
`drill-T-031-verify` at `75afa0a`; the lane's own worktree was never
built in or tested in.

**THE BLINDNESS WAS TAKEN BY THE REF.** The spec was read at the BASE
`765362e` (`git show 765362e:docs/tasks/…`), and the whole attack below —
fixture, measurements, ablations and all seventeen mutants — was formed
AND RUN before the lane's implementation notes or test files were opened.

**SUITES, at the tip `75afa0a`, every exit off its own `$?` on an
unpiped command.** app `npm run build` **0** then `npm test`
**958/958 across 46 files, exit 0**; lib/parser `npx vitest run`
**263/263 across 12, exit 0** and `npx tsc --noEmit` **0**; tools/e2e
`npm test` **143/143, exit 0** on scratch port 15060, `npm run typecheck`
**0**, `npm run lint:tokens -- --selftest` **0**, `npm run lint:tokens`
**0**; `cargo test` **0**; `NPUTER_BOOT_PORT=15061 npm run boot:check`
**0**, both `[nputer]` lines.

**THE MEASUREMENT, NOT THE CLASS.** jsdom does no layout, so the lane's
own pins can only hold a class contract — which the notes say honestly.
I drove a hostile docs tree through `__nputerDocsHarness` into the real
bundle and read `scrollWidth`/`clientWidth`/`getBoundingClientRect`:

| criterion | measured | positive control |
|---|---|---|
| 1 board | hostile column **377px == clean column 377px**, column overflow **0**, page 1280 == viewport | 10k title and 10k `suggested_by` both whole in the DOM |
| 1 panel | panel `scrollWidth − clientWidth` = **0** with a 10k title, 10k blocker id, 10k touches slug and two 10k stamps live | each surface's `textContent.length` asserted first |
| 1 ref line | id-less ghost, **916-char** file path in `detail-ref` and in the footer, panel overflow **0** | length pinned to the path's own length |
| 2 verdicts | verdict body `scrollWidth` **74 398 > clientWidth**, `overflow-x: auto`, panel overflow **0** — it SCROLLS IN PLACE | the 10k REJECTED repro is in the DOM |
| 5 genesis | north-star card overflow **0**, page 1280 | `firstSentence` returned the whole **10 000**-char blob |
| 6 badge | badge **96px** (`max-w-24`), badge `scrollWidth > clientWidth` (clipping), hostile card **377px == clean card 377px** | full raw stamp on `title=` |

**AND THE ADJACENT FEATURE THE SWEEP COULD HAVE BROKEN DID NOT BREAK.**
`detail-ref` deliberately lost `shrink-0`. With a 10k title beside it, an
ordinary `T-902` still lays out in **one** client rect — it does not wrap
mid-id. The notes' claim that ordinary ids are too short for the shrink
to reach them is measured, not asserted.

**CRITERION 4 — I ATTACKED THE JOIN AND IT HELD.** Two files differing
ONLY in the case of their slug (`T-906-alpha.md`, `T-906-ALPHA.md`), both
declaring `id: T-906`: the DIRTY one wears `data-issue-count="3"`, the
CLEAN case twin wears **no mark at all**. A `./`-prefixed path draws
**zero** cards, so there is no join asymmetry to exploit. One issue gives
`data-issue-count="1"` with `aria-label="1 parser issue on this file"`;
a clean card has no mark and its panel grows **no** issues section.
**THE AGGREGATE DID NOT MOVE**: the header still counts the whole model,
strictly more than the sum of the per-card marks, because the cross-file
kinds the lens correctly skips are still in it.

**SECURITY SWEEP — ALL CLEAR, BOTH WAYS.** Source: **zero**
`dangerouslySetInnerHTML`, `innerHTML`, `insertAdjacentHTML`, `eval`,
`__html`, `href=` or `src=` in the added lines; zero secrets; **zero**
dependency additions (no manifest in the diff). Runtime: an
`<img src=x onerror=…>`, an attribute-breakout string
(`" onmouseover="…`) and a `javascript:` URL driven through `title`,
`blocked_by`, `touches`, `built_by`, `verified_by`, `suggested_by` and a
verdict body all reached the DOM as **text nodes only** — 0 `<img>`,
0 elements carrying an injected attribute, 0 `javascript:` hrefs, no
handler fired — with the literal `<img src=x` visible as text as the
positive control. `ModelBadge` has exactly **one** consumer, so its new
bound cannot reach another surface.

**TOKENS — ZERO NEW, BOTH SCHEMES, MEASURED IN THE BROWSER.**
`app/src/styles/tokens.css` is a **0-file diff** and no added line
carries an arbitrary value. Every utility resolves in the compiled sheet:
`break-words -> break-word`, `min-w-0 -> 0px`, `max-w-24 -> 96px`,
`truncate -> ellipsis`, `overflow-x-auto -> auto`,
`whitespace-pre-wrap -> pre-wrap`, `shrink-0 -> 0`, `font-bold -> 700`,
`px-3.75 -> 15px`, `py-2.5 -> 10px`, `gap-1.5 -> 6px`, and the three
colour utilities to real colours. **The probe carries its own negative
control** — `max-w-999999` resolves to `none`, so it can tell a live
utility from a dead one. Both schemes, off the rendered mark's own
computed style: light `--warning rgb(179,96,10)`, dark `rgb(240,166,60)`;
chip bg `rgb(253,244,232)` / `rgb(28,22,8)`; chip border
`rgb(230,196,154)` / `rgb(90,67,24)`.

**THE POISON DRILL — SEVENTEEN MUTANTS OF MY OWN, SEVENTEEN REDS, ZERO
SURVIVORS.** Derived from the CRITERIA with the lane's test files
unopened. One side only, always the PRODUCER, never a shared literal.
Driver `t031-verify-drill.sh` (per-lane named, `T-088-s3`) REFUSES any
path outside the drill, REFUSES a test file without `--allow-test` and
requires a substitution count of exactly 1 — all three refusals were
exercised as self-checks. The mutated TEXT was read back with
`git diff --unified=0` BEFORE every suite run. Baseline **958/958,
exit 0**.

**ONE CONTAMINANT WAS FOUND AND REMOVED RATHER THAN LIVED WITH**: three
`is not stale: the build is at least as new as …` bodies compare source
mtimes against `app/dist`, and `git checkout` bumps an mtime, so after
the first restore they redden on every subsequent mutant regardless of
the mutation. Touching `app/dist` before each run returns the ambient to
**958/958, exit 0**, and every count below is against that control.

| # | mutation (producer only) | reds | the body it kills |
|---|---|---|---|
| M1 | GhostCard provenance loses `break-words` | 1 | the ghost's provenance line wraps a 10k-char `suggested_by`, whole |
| M2 | panel `h2` loses `break-words` | 1 | the panel's h2 title and its id/ref line both wrap |
| M3 | touches `li` loses `break-words` | 1 | both blocker chips, the touches slugs, the stamps and the file footer wrap |
| M4 | `Stamp`'s `dd` loses `break-words` | 1 | (the same body as M3) |
| M5 | `detail-ref` loses `min-w-0` | 1 | (the same body as M2) |
| M6 | `detail-ref` reverted to the pre-lane `shrink-0` | 1 | (the same body as M2) |
| M7 | `VerdictBlock` loses `overflow-x-auto` | 1 | the REJECTED repro's text container scrolls in place instead of widening the panel |
| M8a | `spreadIssues` returns `{}` always | **4** | both face bodies, the aggregate body, the lens body |
| M8b | `selectTaskDetail`'s `issues` becomes `[]` | **2** | both panel-list bodies |
| M9 | the lens widened to join `files` as well | 1 | reads the FIELD, not the kind |
| M10 | north-star title loses `break-words` | **2** | both north-star bodies |
| M11 | north-star card loses `min-w-0` | 1 | the unterminated 10k vision body |
| M12 | `ModelBadge` loses `max-w-24` | 1 | the model badge is bounded (T-024-s6) |
| M13 | `ModelBadge` loses `truncate` | 1 | (the same body) |
| M14 | `ModelBadge` loses `min-w-0` | 1 | (the same body) |
| M16 | `data-issue-count` off by one | 1 | the flagged card wears a mark carrying its own messages |
| M17 | the panel's issues section never renders | 1 | the panel lists the parser's own sentences VERBATIM |

**SHAPE SIX, ASKED RATHER THAN ASSUMED, and the answer is good in the
direction that matters**: M8a reds the face and aggregate bodies and NOT
the panel bodies, M8b reds the panel bodies and NOT the face bodies, and
M9 reds only the field-vs-kind body — so each of criterion 4's three
halves has its own killer and none is a duplicate of another.
Restoration proved THREE ways: per-path `sha256` against the drill's own
commit after every mutant (**17 MATCH, 0 MISMATCH**), an empty tracked
`git diff` at the end, and a clean re-run at **958/958, exit 0**. All
eight touched source files sha256-MATCH `75afa0a`.

**CRITERION 3 IS NOT BUILT, IT IS LIVE-BROKEN, AND THE FENCE RULING IS
CORRECT.**

`app/src/lib/verdicts.ts` and `app/test/detail-presentation.test.ts` are
both **0-file diffs**. I did not take the routing on the notes' word.

**THE DEFECT IS REAL AND I MEASURED IT.** A card whose `## Verdicts`
carries ONE column-0 rejection plus two verbatim quotes of earlier
headers renders `data-rejected-count="2"` and splits into **2** panel
entries, both tinted `rejected`. **Only ONE of the two quote forms the
criterion names is actually broken**: `VERDICT_DATE.test(line.trim())`
means an INDENTED quote starts a new entry, while a blockquote `>` quote
already folds correctly, because `>` survives `.trim()` and fails
`^\d{4}-\d{2}-\d{2}`. The criterion asks for both to be PINNED; one of
the two needs only the pin.

**THE FENCE, RE-DERIVED FROM THE REGISTRY AT MY OWN REF.**
`docs/architecture/components/C-05-app.md` lists `app/src/lib/verdicts.ts`
in `paths:` and carries `touch_slugs: [app-shell]`. This card's fence is
`[app-board, app-interview]`, which resolves to C-08/C-09/C-11 and C-13 —
**none of which claims `verdicts.ts`**. STATE records `app-shell` as held
by the live lane T-123 at dispatch, so widening was not available either.
The routing is correct, and `T-031-s1` is a REAL file with legal
frontmatter and `suggested_by:` set — the docs gate parses all four.
This is the disposition main already has two precedents for (T-010's
verdict; T-101's checkpoint).

**AND THE FIX IS UNPINNED IN BOTH DIRECTIONS, WHICH THE NEXT LANE SHOULD
KNOW.** I applied the one-token fix (`line.trim()` -> `line`) in the
drill: the app suite stays at **958/958, exit 0**. Nothing in the tree
pins the current broken behaviour, and nothing would catch the fix — so
`T-031-s1`'s lane owes the pins as much as the token.

**THE LANE'S OWN app/test/** EDITS ARE NOT A FENCE BREACH**, derived
rather than accepted: criterion 1 of this very card commissions "a
board-truth-style class pin per surface", and `board-truth.test.tsx`
lives in `app/test/`. Walking the 20 most recent merges that touched
`app/test/**`, six were fenced without `app-shell` — T-097 `[app-board]`
(this card's exact fence shape), T-070, T-072, T-081, T-056 and T-029.
`T-031-s4` carries the registry disagreement, correctly.

**ONE CLAIM IN THE SHIPPED SOURCE IS REFUTED BY MEASUREMENT.**

`ModelBadge.tsx`'s header says *"All three parts are load-bearing
together … `max-w-24` alone loses to that same automatic minimum (min
beats max in the cascade)"*, and the notes repeat it. **Measured, that is
false for `min-w-0`.** Ablating one class at a time on a live compound
stamp:

| ablation | badge | card `scrollWidth` / `clientWidth` | column |
|---|---|---|---|
| as shipped | 96px | 375 / 375 | 377px |
| `truncate` removed | 96px | **3346** / 375 | 377px |
| `max-w-24` removed | **304px** | 375 / 375 | 377px |
| `min-w-0` removed | 96px | 375 / 375 | 377px |
| all three removed | 3314px | **3374** / 375 | 377px |

`truncate` and `max-w-24` are each load-bearing; removing `min-w-0`
alone changes **nothing at any level**. The mechanism is the opposite of
the one stated: per CSS Flexbox §4.5 a flex item's automatic minimum size
is clamped by its specified `max-width`, so `max-w-24` already defeats
`min-width: auto` and `min-w-0` is redundant on this element. The same
ablation over the panel shows `min-w-0` load-bearing on the `h2`, the ref
line and the `Stamp` `dd` (which sit in ROW flex contexts) and inert on
the touches slug, the blocker chip, the file footer and the genesis
north-star card (COLUMN flex, where the inline axis is not constrained).
`min-w-0` on the genesis ancestor is card-mandated by criterion 5, so it
stays regardless.

**THIS IS NOT A FAILURE AND DOES NOT BLOCK.** The criterion is that the
badge SHALL be bounded, and it is — 96px, clipping, card unmoved, raw
stamp preserved on `title=`. What is wrong is a justification, and the
pin cannot tell the three classes apart (M12/M13/M14 all red the same
single body). Filed as **`T-031-s5`** with the table and the
discriminating remedy.

**FIGURE CORRECTED.** The notes report the token lint at *"TOKEN 131 /
CONTROL 611"*. At the tip it is **TOKEN 131 / CONTROL 615**: CONTROL
derives from `git ls-files`, the base `765362e` holds 629 tracked files
and the lane 633, so the reading was taken while the four suggestion
files were still untracked — the T-010-s10 hazard, one gate over. The
lint is clean either way and the card itself calls the figure printed and
never pinned.

**GATES, DERIVED AT MY OWN REF.** `merge-tree --write-tree d64c673
75afa0a` exits **0** -> tree `3f0faa7b…`; `git diff --name-only d64c673
3f0faa7b…` is **16 paths**. GRAPH REGEN: **11 of 16 FIRE** (7 `app/src`
+ 4 `app/test`). BOOT GATE: **7 of 16 FIRE** — run, exit 0. DOCS GATE:
**5 of 16 FIRE**, exit 1, THREE suites owed (app, tools/e2e, lib/parser),
all three green above; 12 derived readers across 4 suites, **0
frontmatter issues**. **The lane's graph delta is HONEST and carries no
T-010 contamination**, because I asked it at the LANE TIP rather than
against a moving main: committed `648863 bytes · 126 files · 1126 symbols
· 1712 edges` -> fresh `652661 · 126 · 1137 · 1718`, `files +0 −0 ~11`,
`edges +8 −2` — and the eleven named files are exactly this lane's
eleven, nothing else. The regen is the integrator's at the checkpoint,
against endpoints T-096's checkpoint and T-010's merge have both moved.

**@HUMAN — the three looks the notes name are correct and I add none.**
The mark's amber ink against six status fills in both schemes; the
`issues` section sitting first in the panel body; the `max-w-24` clip at
roughly ten mono characters. All three are taste or perception, not
measurement, and this pass deliberately looked at no screen.

**PROCESS.** 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` only,
before and after — holder `node` pid 82549, one socket `TCP [::1]:1420
(LISTEN)`, identical. Scratch ports 15060/15061/15062 were `lsof`-read
first (zero rows), bind-confirmed free on `127.0.0.1`, `0.0.0.0`, `::1`
and `::`, and all three are free again. No `pkill`. No screen control, no
model call, no CLI spawn. `CARGO_TARGET_DIR` was set inside the
scratchpad, so the human's shared `target/` was never written. The
untracked `z` was left alone.
