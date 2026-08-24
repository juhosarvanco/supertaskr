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
