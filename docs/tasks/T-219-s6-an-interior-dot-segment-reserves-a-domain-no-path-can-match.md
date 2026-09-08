---
id: T-219-s6
title: An INTERIOR dot segment reserves a domain nothing can match, and the refusal T-219-s4 built deliberately stops at the FIRST segment — the same silence, one position over
feature: F-06
milestone: 4
size: S
priority: 4
status: verifying
suggested_by: executor claude-opus-5@subagent @T-219-s4
blocked_by: []
touches: [lib-parser]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review:
---

**Class parent: `T-219-s4`** (which absorbed `T-219-s2`), and this is
its DECLARED CEILING rather than a gap it missed. That card refused the
token whose FIRST SEGMENT is `.` or `..` — the repository root under its
other spelling, and the domains that climb out of the repository — and
said in the code, at the site, that an INTERIOR dot segment is left for
this card.

## The residual, in one line

`normalizeFenceToken` collapses repeated separators, strips leading
`./` runs and a trailing star run. It does not resolve a dot segment
anywhere else. So:

    touches: [lib/./parser]   -> normalised `lib/./parser`
    touches: [lib/x/../parser] -> normalised `lib/x/../parser`

Both carry a `/`, so `expandFence` classifies them `path` and reserves
the domain verbatim. `sharedDomain` compares normalised
repository-relative domains, none of which contains a `.` segment, so
neither domain can ever meet one: the fence permits nothing, collides
with nothing, and raises no issue — which is precisely the sentence
`T-219-s2` was filed about, one position over in the string.

## Why it was NOT folded into `T-219-s4`

- **The remedy differs, and that is the whole argument.** `.` and `..`
  at the head of a token name a domain that is not repository-relative
  at all, so REFUSING is the honest answer. `lib/./parser` names a real
  directory spelled badly, so the honest answer is to NORMALISE it —
  `lib/./parser` and `lib/parser` are one path, exactly as `tools/e2e/`
  and `tools/e2e` are one path and `normalizeFenceToken` already says
  so. Refusing it would refuse a fence that reserves real ground.
- Changing `normalizeFenceToken` moves a function whose ceiling is
  DECLARED and whose spellings are pinned by bodies in two suites; that
  is a dispatch, not a rider on a guard.

## Measured at `24bfec8e10b3`

Over the live board, oracle-less and with the dispatch oracle alike:
**0 live `touches:` tokens carry an interior dot segment**, and
`lib/parser/test/fence.test.ts`'s `T-219-s2` census body already
asserts that zero with its own planted control beside it — so this card
reds the day one is written and costs nothing until then. Derive the
figure again; never quote this one.

## What to build

- `normalizeFenceToken` SHALL resolve a `.` segment (drop it) and a
  `..` segment (drop it with the segment before it), leaving the
  declared ceiling only where resolution would climb ABOVE the
  repository root — which `T-219-s4`'s `DOT_DOMAIN` refusal then
  catches, unchanged.
- The existing bodies for the trailing-slash and glob spellings are the
  shape to extend; the ceiling paragraph in that function's doc SHALL
  move rather than be deleted.
- The census body named above SHALL keep its zero and gain the
  positive control that the new normalisation is what makes it zero —
  a planted `lib/./parser` resolving to `lib/parser`.
- Verification: headless.

## Read beside

`T-219-s4` (its `DOT_DOMAIN` branch and the ceiling paragraph beside
it), `T-219-s2` as absorbed there, `normalizeFenceToken`'s own declared
ceiling.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 4, at the T-219-s4 merge

The architect seat. The interior-dot residue, plus two pre-existing
instances V-T-219-s4 observed at both refs and did not file, recorded
here so one lib-parser lane closes the class:

- A subject whose fence fully resolves, held by a lane whose card
  declares no `touches:`, reaches `unfenceable` with an EMPTY clause
  middle — "…none could be ruled out: . A fence that cannot be
  COMPUTED…" — the exact string T-219's body guards against, from the
  other side. The clause SHALL name the holding card or say why it cannot.
- A card whose only token is its own file is `startable` at both refs
  with `paths: []` while `buildLaneFence` refuses to arm it. The two
  readers SHALL agree: a fence that arms nothing is not startable, said
  by name.

## Implementation notes

Executor `claude-opus-5@subagent`, lane
`task/T-219-s6-interior-dot-segment` at
`/Users/ujju/Projects/nputer-T-219-s6`, cut at `90038e9`.

### The brief said REFUSE and the card says RESOLVE; the card won

The dispatch prose instructed *"an interior `.` or `..` segment in a
`touches:` token must be REFUSED as unresolved the way the first segment
already is"*. This card's own "Why it was NOT folded into `T-219-s4`"
rules that out in as many words — `lib/./parser` names a real directory
spelled badly, so refusing it would refuse a fence that reserves real
ground. A brief is evidence, never authority (`method/roles/executor.md`),
so the built remedy is NORMALISATION and the disagreement is recorded
here as well as in the report.

### What moved

- **`lib/parser/src/fence.ts`, `normalizeFenceToken` — STEP 7.** A `.`
  segment is dropped; a `..` segment is dropped WITH the segment before
  it; a `..` with nothing to cancel is KEPT, so the climb stays visible.
  `lib/./parser` and `lib/x/../parser` now normalise to `lib/parser`.
- **The step is guarded on its own INPUT with `DOT_DOMAIN`**, which is
  what keeps `T-219-s4`'s refusal reachable UNCHANGED: `.`, `..` and
  `../…` come out spelled as they went in, so the bare dot still takes
  the "repository ROOT under its other spelling" sentence rather than
  silently moving to the empty-token one. A token that RESOLVES to a
  climb (`lib/../../x` → `../x`) reaches the same refusal by the same
  constant; one that resolves exactly onto the root (`lib/..` → `''`)
  takes the empty-token sentence written for it.
- **The ceiling paragraph MOVED rather than being deleted.** The
  interior-dot ceiling was declared in `expandFence`'s `DOT_DOMAIN`
  branch; it now lives in `normalizeFenceToken`'s doc, where the
  resolution is, restated as two sentences (the head is not this
  function's to resolve; a surviving climb is left to the same refusal)
  plus a THIRD ceiling this card owes and the old one did not: **the
  resolution is LEXICAL**, because this module reads no filesystem. The
  `expandFence` comment is rewritten to record that the interior arm is
  closed and that two shapes now reach that branch, and `DOT_DOMAIN`'s
  own doc records that it is asked in two positions and why that is one
  rule and not two.
- **`lib/parser/src/lanes.ts`, TRIAGE item 2** — `rule()`'s `startable`
  guard gains `fence.paths.length > 0`. A card whose only token is its
  own file has `tokens.length > 0`, an empty `unusable` and `paths: []`,
  so every earlier term passed and the card was cleared to start while
  `buildLaneFence` refused to arm it. The dead
  `paths.length === 0 ? 'it reserves nothing' : …` arm of the sentence
  goes with it, and a new clause names the cause and the carved-out
  domains.
- **`lib/parser/src/lanes.ts`, TRIAGE item 1** — a new clause for a hold
  whose verdict is `unusable` while NEITHER side contributed a raw
  token, which is the holding card declaring no `touches:`. That hold
  matched no clause, so the reason arrived as *"…none could be ruled
  out: . A fence that cannot be COMPUTED…"*. The clause NAMES the
  holding card and says the remedy is on it. It is keyed on the verdict
  as well as on the empty token list, so an `overlapping` own-lane hold
  cannot be mis-described as a silent one.
- The clause-cause ordinals are now declared to be minted in the order
  the causes were FOUND and never in the order the clauses are emitted,
  so the two new ones can sit beside their near twins.

### Bodies added (8 new, 1 changed) — all typed literals

`lib/parser/test/fence.test.ts`
- `T-219-s6: resolves an INTERIOR dot segment, so one directory keeps one spelling`
- `T-219-s6: a dot inside a NAME is not a dot SEGMENT — the control that this is not a rule about the character`
- `T-219-s6: the ceiling MOVED — the head is left to T-219-s4, and a climb that survives resolution reaches it too`
- `THE DEFECT, DEMONSTRATED AGAINST THE IMPLEMENTATION THAT LACKED THE PROPERTY`
- ``and `a/b/../c` reserves `a/c`, with the sibling that only LOOKS like it as the control``
- `AND THE UNFENCEABLE DIRECTORY CANNOT BE REACHED BY SPELLING IT WITH A DOT SEGMENT`
- `a token that RESOLVES to a climb is refused by T-219-s4, and one that resolves to the ROOT by the branch written for it`
- CHANGED: the `T-219-s2` census body keeps its interior zero and gains
  the two-armed control this card asked for — arm one shows the census
  predicate FINDING an interior dot segment in a planted card's RAW
  tokens, arm two shows the same tokens NORMALISED to `lib/parser` with
  the predicate finding nothing. The zero is now the RESOLUTION rather
  than "nobody has written one", and the two zeroes are told apart.

`lib/parser/test/lanes.test.ts`
- `T-219-s6 — an INTERIOR dot segment resolves, so the card is startable on the real directory and COLLIDES with a lane holding it`
- `a fence that ARMS NOTHING is not startable, and the sentence says which domains were carved out`
- ``a lane whose CARD declares no `touches:` is named in the sentence, instead of leaving an empty middle``
- `and with TWO silent lanes the clause is PLURAL, and it does not speak for a lane whose card is MISSING`

**A CONSEQUENCE THE CARD DID NOT ASK FOR AND IS WORTH THE MOST**: before
step 7 a token spelled `docs/./tasks` normalised to itself, met neither
`docs/tasks` nor anything else through `sharedDomain`, and was ACCEPTED
as a `path`. So `UNFENCEABLE_PATHS`' only entry had a spelling that
walked past the guard *and* reserved nothing — both failures at once. It
is refused by name now, with the one-way narrowing preserved as its
control.

### The positive control, demonstrated FAILING

`MODEL THREE` in `fence.test.ts` is `normalizeFenceToken`'s body at
`90038e9` — steps 1 to 6, no step 7 — kept in the test file beside the
two "before" models already there and never in `src/`. The body
`THE DEFECT, DEMONSTRATED AGAINST THE IMPLEMENTATION THAT LACKED THE
PROPERTY` runs it FIRST, builds the `Fence` the old module built from the
domain it yields, and requires `compareFences` to answer **`disjoint`**
against a fence expanding `lib-parser` — the card's sentence, measured,
before the fixed side is asserted `overlapping` with `lib/parser` as its
witness.

### The poison drill — 8 mutants, 8 killed, 8 restorations sha256-proved

Detached scratch worktree `/Users/ujju/Projects/nputer-D-T-219-s6` at
`9ffe0c1`, its own `node_modules`, never the lane; driver
`driver-T-219-s6.sh` / `driver2-T-219-s6.sh`, which REFUSE to run outside
that path, off that commit, or on a branch. Every landing read back from
`git diff -U0` before the suite ran; every restore
`git restore --source=9ffe0c1 --staged --worktree` with `shasum -a 256`
before and after. Drill baseline 385 passed / 3 failed (the three
pre-existing, below).

| mutant | one side, the PRODUCER | bodies red | new bodies killed |
|---|---|---|---|
| M1 | step 7 dropped entirely | 11 | 7 (and the changed census body) |
| M2 | the `DOT_DOMAIN` guard on step 7's INPUT removed | 7 | the ceiling body, the climb body, the census body |
| M3 | an uncancelled `..` DROPPED instead of kept | 5 | the ceiling body, the climb body |
| M4 | `fence.paths.length > 0` dropped from the `startable` guard | 4 | the arms-nothing body |
| M5 | the `silent` clause never fires | 5 | both silent-lane bodies |
| M6 | the reserves-nothing clause never fires | 4 | the arms-nothing body |
| M7 | the CHARACTER, not the SEGMENT (`segment.startsWith('.')`) | 6 | the dot-in-a-NAME control |
| M8 | the clause keeps its guard, loses the arm that NAMES the carve-outs | 4 | the arms-nothing body |

Every mutant's count includes the three pre-existing failures. Every new
and changed body is killed by at least one mutant; `M7` exists because
the dot-in-a-NAME control was unkilled by M1–M6, and `M8` because the
carve-out naming was covered only by its enclosing guard.

`shasum -a 256` before == after on every one:
`src/fence.ts` `c73d1f679d1a5be27e3fe8a3ba7d3eb097cc37104152dbccd66d08b783cc4f73`,
`src/lanes.ts` `a1e38d895698b61c516a267d4f88dc860d548ecea7dd89b9d5c65c553a2bbda6`.
The drill tree's `git status --porcelain` was EMPTY after the last
restore, and the worktree was removed after the drill (it is not the
lane's).

### THE BASE WAS RED BEFORE THIS LANE TOUCHED ANYTHING — routed, not fixed

`npx vitest run` from `lib/parser/` fails **3** bodies at the lane's base
`90038e9`, and the same 3 with byte-identical assertion text at every ref
in this lane. All three are `T-274 docs/tasks`: that card fences the one
directory no card may hold. Attributed at `90038e9`:
`git merge-base --is-ancestor cc5bf50 90038e9` exits **0**,
`git merge-base --is-ancestor cc5bf50 0b7cecd9` (the newest
`Checkpoint:`) exits **1** — so the lane was cut from a commit later than
the checkpoint whose gates were not all green, which is the case
`DISPATCH FROM THE LAST CHECKPOINT` says holds by practice and not by
property. Routed as **`T-219-s8`**, not repaired here: narrowing another
card's `touches:` rewrites its own declaration, and the obvious narrowing
is refused by this card's own second triage item.

### Findings routed

- **`T-219-s7`** (`app-board`, OUT of fence) — `normaliseTouchToken` in
  `app/src/lib/board-model.ts` is a SECOND `touches:` normalisation, the
  gap `docs/ARCHITECTURE.md` and `T-137` already name. Measured over
  seven pairs: **2 of 7 diverged before this card, 6 of 7 after**. The
  class is pre-existing; this card added four shapes to it and says so.
- **`T-219-s8`** (`docs/tasks/T-274-….md`) — the red base above.

### The sweep (A FIX NAMES ITS CLASS AND ITS SWEEP)

The class is *a second implementation of "which path does this token
name"*. Swept with `git grep` over `app`, `tools`, `lib`, `.claude` for
`startsWith('./')` and the backslash rule at `90038e9`. **Four
implementations found, and the sweep is recorded even where it is
clean**: `lib/parser/src/fence.ts` (this card's), `MODEL THREE` in the
test file (the control, deliberately a copy),
`app/src/lib/board-model.ts` (routed as `T-219-s7`), and
`app/src/lib/architecture/glob.ts` + `lib/parser/src/component.ts`, which
normalise gitignore-style PATTERNS rather than fence tokens and answer a
different question — left alone, named here so the next reader does not
re-derive it. `.claude/hooks/lane-fence.mjs`'s `within()` is NOT one: it
compares two already-normalised domains and its own header says so, and
its `rel` comes from `path.relative`, which resolves dot segments itself
— so the guard and the parser still agree.

### Commands, in the order run, every exit read from `$?` unpiped

Setup at `90038e9`: `npm ci` (lib/parser) **0** · `npm run build`
(lib/parser) **0** · `npm ci` (app) **0** · `npm run build` (app) **0** ·
`npm ci` (tools/e2e) **0**.

| command | cwd | exit | count |
|---|---|---|---|
| `npx vitest run` (BASELINE at `90038e9`) | lib/parser | 1 | 374 passed / 3 failed of 377 |
| `npx tsc --noEmit` | lib/parser | 0 | — |
| `npx vitest run` | lib/parser | 1 | 385 passed / 3 failed of 388 |
| `docs-gate.mjs <3 card paths>` | lane root | 1 | FIRES — 3 suites owed (app, tools/e2e, lib/parser) |
| the poison drill, 8 mutants | scratch worktree | see the table | 8 killed, 8 restored |
| `npm run lint:tokens -- --selftest` | tools/e2e | 0 | 65 TOKEN + 4 CONTROL samples, 90 walk-policy, 9 evidence-floor |
| `npm run lint:tokens` | tools/e2e | 0 | TOKEN 177 files, CONTROL 1282 tracked text files |
| `npm run typecheck` | tools/e2e | 0 | — |
| `npm run lint:docs` | tools/e2e | 0 | the WHOLE-TREE half; it judges no diff |
| `npm run capabilities:check` | tools/e2e | 0 | CURRENT (58883 bytes) — no e2e test name moved |
| `gate-run.mjs parser` at `92d8bce` | lane root | 1 | bodies=388, RED — **4** failed, the 3 above plus the smoke body |

**THE FOURTH FAILURE WAS MINE AND THE GATE FOUND IT.** The two
suggestions were first filed as `T-219-s6-s1` / `T-219-s6-s2`; a DOUBLE
suffix is not a task id, so the parser raised two `invalid-field` issues
on `id` and redded `smoke — the real docs/ tree parses cleanly > finds
zero issues in the live tree`. Renumbered `T-219-s7` / `T-219-s8` at
`25b735b`, after deriving the free ids from `git grep '^id: T-219-s'`
rather than guessing; `parseProject` over the live tree then reports **0**
issues. The battery below is the re-run.

### The four legs at the lane tip, and the standing gates

Recorded in the lane's report file with the tip they were measured at.
Derived against this lane's own merge forecast rather than against a ref
one commit behind it:

- **GRAPH REGEN — FIRES.** The diff touches `*.ts` outside `docs/`
  (`lib/parser/src/{fence,lanes}.ts` and their two test files). `tools/`
  and `docs/` are `.supertaskrignore`d and `lib/parser` is not, so this
  one is not the wider-than-the-walk case: **ASK THE GATE** —
  `index --check` from `app/src-tauri/` — at the merge, and regen with
  the checkpoint. A lane never re-pins the dogfood counts (`T-211`).
- **BOOT GATE — NOT OWED.** No path under `app/src-tauri/**`,
  `app/src/**`, `app/package.json` or `app/src-tauri/Cargo.toml` is in
  the diff.
- **DOCS GATE — FIRES.** Three paths under `docs/tasks/` (this card and
  the two suggestions). `docs-gate.mjs` names `npm test from app/`,
  `npm test from tools/e2e/` and `npx vitest run from lib/parser/`.
- **METHOD EVAL GATE — NOT OWED.** No path under `method/`.

### The least-confident point

**Whether `DOT_DOMAIN` belongs in `normalizeFenceToken` at all.** The
guard on step 7's input is what makes the card's *"`T-219-s4`'s refusal,
unchanged"* literally true, and the alternative — resolve everything and
let `.` fall to the empty-token branch — is one line shorter and loses a
refusal sentence two suites assert by name. I chose the guard and pinned
BOTH refusals so the choice is visible rather than implied. The residual
cost is that `normalizeFenceToken` now reads a constant whose name is
about the EXPANSION's refusal; the doc says why in two places and `M2`
kills the mutant that removes it, but a reviewer who thinks the coupling
is the wrong shape is arguing with a real decision and not with an
oversight.
