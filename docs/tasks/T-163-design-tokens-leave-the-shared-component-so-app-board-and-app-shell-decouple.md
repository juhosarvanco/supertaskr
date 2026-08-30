---
id: T-163
title: Design tokens leave the shared component — app-board and app-shell expand disjoint, and T-112's collision surface drops from nineteen cards to one
feature: F-04
milestone: 4
priority: 2
size: S
status: done
blocked_by: []
touches: [docs/architecture, app/test]
suggested_by: "@human ruling (2026-08-30, rulings sitting): split C-11 first, over dispatching T-112 as-is"
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
verified_by: nputer-4e@integration-seat
review:
---

**FILED AT @HUMAN'S RULING (2026-08-30), planned at filing.** The
architecture ruling is made; this card executes it.

## The measurement (T-112's planning prep, 2026-08-30, at 558d660)

The slug map shares C-11 between `app-board` (C-08, C-09, C-11, C-17,
C-18) and `app-shell` (C-05, C-10, C-11, C-16) — derive it fresh:
`brief.mjs --state`, THE SLUG MAP section. Because both slugs expand
through C-11, every app-shell card's fence overlaps every app-board
card's: nineteen planned cards flip with T-112 through that one
component, against ONE direct sharer (T-031-s1). The ledger prints the
consequence on every run: "app-board and app-shell both expand through
C-11 — these rows are not independent."

## Acceptance criteria

- THE design-tokens component (C-11) SHALL stop appearing in BOTH
  `app-board`'s and `app-shell`'s expansions. The seat chooses the
  spelling — its own never-fenced slug, or no slug at all — and states
  in one sentence at the definition site why a tokens change still has
  a legal route into a lane (a bare-path fence remains legal).
- WHEN the split lands, `brief.mjs --state`'s not-independent row for
  this pair SHALL disappear — DERIVED, not deleted: the sentence and
  its spec pin (brief.spec.ts, "the slugs that are not independent are
  DERIVED") both compute from the component files, and the pin SHALL
  stay green through the change without a tools/e2e edit. IF the pin
  reds, the fence is wrong, not the pin — stop and say so.
- THE architecture dogfood pins (app/test/architecture-dogfood.test.ts,
  app/test/map-dogfood-render.test.tsx) SHALL be re-derived where they
  count slugs or read `touch_slugs`; `depends_on` edges do not change
  and their pins SHALL NOT be touched.
- WHEN the split lands THE lane SHALL re-derive T-112's flip pairs and
  stamp the correction on T-112's card, dated — its PLANNING PREP note
  becomes stale at HEAD the moment this merges, and leaving it is the
  exact claim class T-160's preflight exists to refuse.
- THE graph SHALL be asked, never predicted, after every write
  (`cargo run -p nputer-index -- index --check --root ../..` from
  app/src-tauri/), and the DOCS GATE runs what it owes on this diff.

## Why S and why now

The change is a few `touch_slugs:` edits plus derived pins re-run; the
value is every future board/shell dispatch, not just T-112 — the two
biggest UI seats stop holding each other's fences through a stylesheet.

## Implementation notes

Executed 2026-08-30 in lane `task/T-163-c11-split`, worktree
`/Users/ujju/Projects/nputer-T-163`, cut from checkpoint `25850bd`.
Every figure below carries the command that produced it or the ref it
was stamped at.

### The spelling, and why the other one was declined

`docs/architecture/components/C-11-design-tokens.md` now reads
`touch_slugs: []` — the EMPTY list, not a never-fenced slug of its own.
The one sentence the criterion asks for sits on the field itself
(*"T-163: no slug, so a tokens change enters a lane by its own bare
PATH"*) and the argument sits in the body immediately below the prose
paragraph. **Why not the dedicated slug**: a slug that exists is a slug
a card may declare and every expander will expand, so "never-fenced"
would have been a promise kept by nobody and enforced by nothing — an
ABSENT slug cannot be named at all, which makes the property structural
rather than conventional. `C-01` already carries the empty list, so the
shape is not new to this registry, and the trailing YAML comment is a
form both frontmatter readers already strip (` #` — `strip_comment` in
app/src-tauri/crates/nputer-index/src/arch/registry.rs, and
`stripInlineComment` in tools/e2e/scripts/dispatch-brief.mjs), which is
why the sentence could go at the definition site at all.

### Criterion 1 — the row is DERIVED away, and the PIN REDS

`node scripts/brief.mjs --state` from tools/e2e/, exit 0 both sides:

| | the line it prints |
|---|---|
| before (`25850bd`) | `app-board and app-shell both expand through C-11 — these rows are not independent` |
| after (`89af57a`) | `no component is claimed by two slugs today` |

Both lines are emitted by the SAME branch in `stateReport`
(tools/e2e/scripts/dispatch-brief.mjs) off `slugsSharingComponents`, so
the row was derived away and not deleted — the replacement sentence is
the derivation's own empty-case answer. The slug map itself now prints
`app-board -> C-08, C-09, C-17, C-18` and `app-shell -> C-05, C-10,
C-16`.

**AND THE PIN REDS. THIS IS THE CASE THE CRITERION TOLD THE LANE TO STOP
AND RECORD, AND IT IS RECORDED HERE RATHER THAN REPAIRED, BECAUSE
tools/e2e IS OUTSIDE THIS FENCE.** Measured with
`NPUTER_E2E_PORT=14733 npx playwright test tests/brief.spec.ts` from
tools/e2e/ at `89af57a`: **3 failed / 27 passed**.

**THE DIAGNOSIS IS NOT "THE FENCE IS WRONG" AND THE MEASUREMENT SAYS SO
IN THE PIN'S OWN OUTPUT.** The criterion's `IF the pin reds THEN the
fence is wrong` assumes some C-11 spelling keeps the pin green. No
spelling does, and the reason is arithmetic rather than a judgement
call: **C-11 was the ONLY component in this registry carrying more than
one slug** (derive: `git grep -h '^touch_slugs:'
docs/architecture/components/` — every other line holds exactly one slug
or, for C-01, none). The pin's positive control asserts that such a
component EXISTS. The ruling's whole content is that it stops existing.
So the ruling and that control cannot both hold, whichever spelling
carries the ruling.

**AND THE DERIVING HALF OF THE PIN IS GREEN**, which is the part worth
saying: the two-sided join it exists to protect — `slugsSharingComponents`
against the spec's own independent re-walk of the component files —
agrees exactly, at `[]` on both sides. What failed is the guard that the
agreement is not two empty lists agreeing. The pin is doing precisely
what it was built to do; its subject has been ruled out of existence.

The three reds, each with the assertion that produced it:

1. `the LEDGER SAYS WHAT IT IS ANSWERING, and the slugs that are not
   independent are DERIVED` — `expect(wanted.length, "no component is
   shared, so the join proves nothing here").toBeGreaterThan(0)`,
   Expected `> 0`, Received `0`. **Unreachable from this fence.**
2. `FENCE DISJOINTNESS IS COMPUTED AS SETS THROUGH THE MAP, not as a
   string compare` — `expect(slugB, "no two slugs share a component
   here, so this body has lost its subject …").toBeDefined()`, Received
   `undefined`. The SAME class: it hunts the live registry for two slugs
   sharing a component, and there are none. **Unreachable from this
   fence, and it is not named anywhere on this card** — the card
   anticipated one pin and there are two.
3. `THE SLUG MAP COMES FROM THE FIELD, and the prose block is compared
   rather than trusted` — `the architecture doc's block and app-board's
   component files disagree — the FIELD is authoritative (executor.md
   row 5), so the block is the side to repair`, Received `["C-08",
   "C-09", "C-11", "C-17", "C-18"]` against Expected without `C-11`.
   **This one is a REPAIR, not a lost subject — and the file to repair
   is OUTSIDE THIS FENCE too.**

### The fence cannot reach docs/ARCHITECTURE.md, and that is a defect in the card

`docs/ARCHITECTURE.md` carries a second copy of the slug map (its
derived block, plus the sentence *"Two slugs are claimed by more than
one component (`app-shell`, `app-board`)"*), and that block is
deliberately COMPARED against the fields by `brief.spec.ts` on every
lane run — the file says so itself. **A card that moves `touch_slugs:`
therefore always owes an edit to `docs/ARCHITECTURE.md`, and this card's
`touches: [docs/architecture, app/test]` does not reach it**: the fence
domain is the DIRECTORY `docs/architecture/`, and `docs/ARCHITECTURE.md`
is a file beside it. Asked rather than assumed — `decide` in
`.claude/hooks/lane-fence.mjs`, whose `within(rel, domain)` is
`rel === domain || rel.startsWith(domain + "/")`:

    docs/ARCHITECTURE.md                              -> block  (outside-the-fence)
    docs/architecture/components/C-11-design-tokens.md -> allow  (inside-the-fence)
    app/test/architecture-dogfood.test.ts              -> allow  (inside-the-fence)
    docs/tasks/T-112-a-card-hands-you-its-brief.md     -> allow  (always-writable)

The two names differ only in case and in one suffix, which is exactly
the shape a fence author reads past. Nothing was written there.

### A FOURTH AND FIFTH RED, IN A THIRD PACKAGE, THAT NO CRITERION NAMED

`npx vitest run` from lib/parser/ at `cec6cde`: **2 failed / 313
passed, exit 1**, both in `test/fence.test.ts` and both the same
lost-subject class — *"C-11 carries two slugs, so app-board and
app-shell share its paths"* (`doubleClaimed` Received `[]`) and *"PIN
TWO (a): two live planned cards whose slugs differ and whose paths meet
at C-11"* (T-112 against T-114, `Received 'disjoint'` where
`'overlapping'` was expected — which is the ruling working, not the
comparator failing). `lib/parser` is outside this fence; asked of the
hook, `lib/parser/test/fence.test.ts` answers
`block / outside-the-fence`. Filed as `T-163-s3`. The parser's SMOKE
test over the live docs/ tree is green, so nothing here is a parse
problem.

**AND THAT MAKES A STANDING GOTCHA WRONG BY OMISSION.** CONVENTIONS'
**DECLARING A COMPONENT** bullet says such a change moves THREE
live-registry fixtures. **Moving a `touch_slugs:` FIELD is a different
edit and moves a different set** — measured here, on a diff that moved
exactly one field: all three fixtures that bullet names were GREEN and
needed nothing, while four other places moved —
`lib/parser/test/fence.test.ts`, `app/test/select-board.test.ts`,
`tools/e2e/tests/brief.spec.ts` and `docs/ARCHITECTURE.md`, in three
packages plus a governing doc. **No card fence in this repo's
vocabulary reaches all four.** That belongs beside the existing gotcha;
this fence reaches neither `docs/CONVENTIONS.md` nor three of the four
files, so it is routed on `T-163-s3` rather than written here.

### Criterion 2 — re-derived, and the card named the wrong two files

**`app/test/architecture-dogfood.test.ts` and
`app/test/map-dogfood-render.test.tsx` needed NO re-derivation.**
Measured, not assumed: with the C-11 change in the tree and no app/test
edit yet, `npm test` from app/ came back **3 failed / 1012 passed**, and
all three failures were in a third file. Neither dogfood file counts
slugs nor reads `touch_slugs` for C-11; the only `touch_slugs` mention
in either is a comment about C-10 and C-05, untouched here.
`depends_on` pins were not touched, as the criterion requires.

**The file that actually moved is `app/test/select-board.test.ts`**,
describe *"a fence is compared over EXPANDED components, never slug
strings (T-111-s1)"* — three bodies driving themselves from the LIVE
registry through `app-board` against `app-shell`, which is precisely the
pair this ruling makes disjoint. It is inside the fence, so it was
re-derived rather than routed. Nothing was loosened: the inverted live
fact is asserted in both directions with a positive control that both
slugs still expand to real components, and the MECHANISM the two clash
bodies existed for — *two different slug strings that reserve one
component overlap* — moved onto a synthetic registry that still carries
the shape, with the live pair asserted as the empty result it has now
become. `npx vitest run test/select-board.test.ts`: **83 passed**.

### Criterion 3 — T-112's flip pairs, re-derived

Stamped on `docs/tasks/T-112-a-card-hands-you-its-brief.md` as
`CORRECTION 2026-08-30 … at 71ce2422089c`, both sides derived at ONE
ref by sweeping every flat card at `status: planned` through
`fenceOverlaps` in tools/e2e/scripts/dispatch-brief.mjs — the same
comparator row 5 uses. 325 flat cards, 67 planned. **27 before, 2
after**; of the two survivors, `T-031-s1` is the direct `app-board`
sharer the note already predicted and `T-163` is this lane, which stops
existing at the merge — so the standing answer is ONE. The 25 that left
all left through `both reserve app/src/assets/**`. The before-figure
disagrees with the note's `~19` and the correction records the
disagreement rather than reconciling it: different ref, different sweep.

### Criterion 4 — the graph, asked after every write

- after the C-11 write (`89af57a`): `index --check` exit **0**,
  `graph.json is CURRENT` (1022964 bytes, 189 files, 2160 symbols,
  2114 edges).
- after the app/test write (`71ce2422089c`): exit **1**, `graph.json is
  STALE`, second line `~ app/test/select-board.test.ts (content, loc
  1853 -> 1924)` — a REAL red, not the `committed: MISSING` false one.

**NOT REGENERATED IN THIS LANE, DELIBERATELY.** CONVENTIONS' GRAPH REGEN
bullet puts the regen with the CHECKPOINT and in the integrator's hand,
for the reason it states — the checkpoint edits indexed fixture files,
so a graph regenerated earlier is stale again — and two other lanes were
live at this ref, one of them (`T-025-s5`, `app/src-tauri/tests`) with a
diff that moves the graph too. Two lanes each committing `graph.json`
is a conflict the convention exists to avoid. The regen is OWED at the
checkpoint: `NPUTER_UPDATE_GOLDEN=1 cargo test -p nputer-index --test
self_graph -- --ignored`.

### One derived consequence nothing pins, measured rather than predicted

C-11's rolled-up task membership goes **79 -> 0** (it used to absorb
every card touching `app-board` or `app-shell`, most of which never
touched a stylesheet). Its DERIVED STATUS does not move: **`planned`
before and `planned` after**, `pinned: false` both sides — measured with
a throwaway vitest probe in this lane against
`deriveArchitecture`/`parseProjectFromFiles`, run at `89af57a` and
deleted before the commit. So there is no status regression to route;
the membership change is the ruling working as intended.

### The gates, every exit read from `$?` on an UNPIPED command

Run from a script file rather than pasted, per the persisted-cwd rule.
First measured at `cec6cde` and **re-run WHOLE at `e85d55d`**, the tip
this table describes, because three suggestion cards and a status stamp
landed between the two and the board is a code input: identical exits
and identical counts both times, on a fresh port
(`NPUTER_E2E_PORT=14753`, read to zero rows first). `npm run
capabilities:check` from tools/e2e/ also answers CURRENT at exit 0 — no
spec file was added or renamed, so the census owes nothing.

| gate | cwd | exit |
|---|---|---|
| `npx vitest run` (parser suite) | lib/parser/ | **1** — 2 failed / 313 passed, both `test/fence.test.ts`, `T-163-s3` |
| `npx tsc --noEmit` | lib/parser/ | 0 |
| `npm run build` | app/ | 0 |
| `npm test` (app suite) | app/ | 0 — **1015 passed / 47 files** |
| `npm run lint:tokens` | tools/e2e/ | 0 |
| `npm run lint:docs` (DOCS GATE, named form) | tools/e2e/ | 0 |
| `docs-gate.mjs <diff paths>` (DOCS GATE, diff half) | repo root | **1** — FIRES, and it is the honest answer |
| `cargo test` | app/src-tauri/ | 0 |
| `NPUTER_E2E_PORT=14741 npm test` (e2e lane) | tools/e2e/ | **1** — 5 failed / 315 passed |
| `index --check --root ../..` | app/src-tauri/ | **1** — STALE, regen owed at the checkpoint |

The port was read to ZERO ROWS with
`lsof -nP -iTCP:14741 -sTCP:LISTEN` immediately before binding, and
1420 was read once, with the one permitted command, and never probed.

**THE DOCS GATE FIRES AND OWES FOUR SUITES**, all four of which were
run: `cargo test from app/src-tauri/`, `npm test from app/`, `npm test
from tools/e2e/`, `npx vitest run from lib/parser/`. It also reports
every live card's frontmatter parsing with a legal status, and the
governing-document budgets holding. **The RANGE RULE's executor form
returns exit 1 for merge-tree** — `CONFLICT (content)` in exactly one
file, this card, on the `status:` line: main carries the dispatch stamp
`building` (`8e6b18b`, which post-dates the checkpoint this lane was cut
from) and the lane carries its own stamp. That is the conflict EVERY
lane produces by construction and the integrator resolves by taking the
lane's; `builder:`/`built_by:` were set to match main so nothing else in
the frontmatter conflicts. The path list was taken from the tree
merge-tree wrote anyway, and the gate ran on it.

**THE E2E LANE's FIVE, AND TWO OF THEM ARE NOT NEW.**
`session-economics.spec.ts` bodies *"the recommended seat is a function
of the CARD …"* and *"the advisory line is NOT a contract row …"* both
assert `exit 0` from `brief.mjs --task T-157`, whose honest answer here
is FOUND. Its list has THREE items and only two are this lane's:

    fences are not disjoint: T-162 tools/e2e against T-157 tools/e2e
      — the same entry (lane-protocol rule five).
    the slug map's two copies disagree — app-board: field says
      C-08, C-09, C-17, C-18 and the prose block says … C-11 …
    the slug map's two copies disagree — app-shell: field says
      C-05, C-10, C-16 and the prose block says … C-11 …

The first names neither a slug nor C-11 — it is two cards' `touches:`
lines, neither of which this diff touches — so it stands at the base
too, and one item alone fails `toBe(0)`. **These two bodies were
therefore red before this lane and are `T-143-s1`'s already-filed
subject, in as many words: *"Two session-economics bodies red for every
lane that holds tools/e2e, because they assert exit 0 from a command
whose honest answer is FOUND."* This lane neither caused nor cleared
them.** The other two items ARE this lane's, and `T-163-s1`'s repair
clears both — which makes that card worth three of the five e2e reds
rather than one.

### Why this card is stamped `verifying` and not `done`

The ceremony table's row for this card (size S, diff outside shipped
code — `docs/**` and `tools/e2e` are both on the NOT-SHIPPED side of
CONVENTIONS' SHIPPED PARTITION, and this fence names neither a registry
slug nor a `method/` path) gives it no verifier, and `executor.md` step
6 would then have this lane stamp `done`. **It is stamped `verifying`
instead, deliberately, and this paragraph is the reason a reader is owed
rather than a silent deviation.** Criterion 1's second half is UNMET —
the pin reds, three bodies in tools/e2e are red at this branch tip, and
one of them is a straightforward repair in a file this fence cannot
reach. A board reading `done` beside a red gate is the exact claim class
T-160's preflight exists to refuse, and this lane will not write it.
What closes the card is a ruling plus a diff in two places outside this
fence; the suggestion cards below carry both, and the executor did not
merge, push or touch any branch but its own.
