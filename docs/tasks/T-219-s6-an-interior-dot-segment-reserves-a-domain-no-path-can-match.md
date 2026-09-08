---
id: T-219-s6
title: An INTERIOR dot segment reserves a domain nothing can match, and the refusal T-219-s4 built deliberately stops at the FIRST segment — the same silence, one position over
feature: F-06
milestone: 4
size: S
priority: 4
status: done
suggested_by: executor claude-opus-5@subagent @T-219-s4
blocked_by: []
touches: [lib-parser]
builder: claude-opus-5@subagent
verifier: claude-fable-5-1@subagent
built_by: claude-opus-5@subagent
verified_by: claude-fable-5-1@subagent
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

### THE MERGE FORECAST IS GREEN, AND THE RED BASE IS ALREADY DISCHARGED ON MAIN

Derived after the notes above were written, at `main` `b825e879` and this
lane's tip `9a0a747`. `main` moved past this lane's base while it built,
and one of the commits it gained is **`ab00399`** — the architect seat's
own repair of `T-274`'s fence to `docs/research/`. So the three red
bodies attributed above are a BASE artefact and nothing else.

`git merge-tree --write-tree main HEAD` exits **0** (a tree, not a
conflict) over **7** paths; wrapped in a throwaway `git commit-tree`
(`e782388`, no ref points at it) and checked out detached,
`npx vitest run` from `lib/parser/` exits **0** with **388 passed of
388**. `T-219-s8` records the discharge with `closed_by: ab00399` and
keeps `status: suggested`, which is the FOURTH QUESTION's ruled shape.

### THE FOUR LEGS, THROUGH THE BLESSED RUNNER, AT `9a0a747`

| leg | exit | bodies | verdict |
|---|---|---|---|
| `gate-run.mjs parser` | 1 | 388 | RED — the 3 base bodies only; 385 passed. GREEN on the merge forecast, above |
| `gate-run.mjs app` | 0 | 1163 | GREEN |
| `gate-run.mjs rust` | 0 | 639 (targets 18) | GREEN |
| `gate-run.mjs e2e` | 0 | 690 | GREEN |

The e2e leg ran ONCE, at the tip, on `SUPERTASKR_E2E_PORT=15219`; `lsof
-nP -iTCP:15219 -sTCP:LISTEN` was empty before it and after it. The DOCS
GATE was re-run on the RANGE RULE's own forecast path list and FIRES with
the same three suites, all three of which are in the table above.

### THE GATES, DERIVED ON THE MERGE FORECAST RATHER THAN ON THIS REF

7 forecast paths: 4 `.ts` under `lib/parser/`, 3 cards under
`docs/tasks/`.

- **GRAPH REGEN — FIRES** (4 of 7 paths). The integrator regenerates with
  the checkpoint; a lane never re-pins the dogfood counts (`T-211`).
- **BOOT GATE — NOT OWED** (0 of 7).
- **DOCS GATE — FIRES** (3 of 7): `npm test from app/`,
  `npm test from tools/e2e/`, `npx vitest run from lib/parser/`.
- **METHOD EVAL GATE — NOT OWED** (0 of 7).

This derivation is stated against the tree this tip WILL have, so the
commit carrying these notes does not move it.

## VERDICT — APPROVED WITH ASSIGNED CORRECTIONS at `e74c12c`, 2026-09-09, blind verifier `claude-fable-5-1@subagent`

Bench `/Users/ujju/Projects/nputer-V-T-219-s6`, detached at the lane tip
`e74c12cc8f0c873b0d828d642f40f2910e25881e` (branch
`task/T-219-s6-interior-dot-segment`, base
`90038e95eb28f7341e58b3d430ec30f5685dffa3`), installed fresh (`npm ci`
in `lib/parser`, `app`, `tools/e2e`; the crate built in the bench).
Judged over `git diff 90038e9..e74c12c` — 7 files, +1116/−33: four `.ts`
under `lib/parser/` and three cards under `docs/tasks/`. **The fence is
`touches: [lib-parser]`, which C-06 expands to `lib/parser/**`**: every
code path is inside it; the three cards are this card's own file and two
`status: suggested` findings, which is the routing `method/roles/executor.md`
names for a finding and the only way anything reaches `docs/tasks`
(unfenceable by rule). Zero test names were deleted or renamed
(`fence.test.ts` 45→52, `lanes.test.ts` 27→31; `comm -23` of the base and
tip name lists is empty; no `.skip`, `.only`, `.todo`).

**THE SEALED INPUTS**, verified with `shasum -a 256` before either was
opened, and cited on lines of their own:

    attack set:    sha256:5246da71994523fb15d5e85f842673c48a7c0f135f5b9a795fd9a804026d1bf0 (attack-set-T-219-s6.md)
    ground truths: sha256:b7786acd5737e786a4cc35b25e83921e19ec4c2fb005f49f3d37af10471edb69 (ground-T-219-s6.md)

**THE FRAME I ACTUALLY HAD.** Phase 1 was a different spawn and returned
`tool calls made: 0` — tool-less BY INSTRUCTION, because this harness
cannot deny a spawn its tools (`docs/reference/07-verification.md`, the
frame disclosure); that is the honest weaker thing and it is written
here rather than rounded off. The ground truths were taken by the
dispatcher at the base, before the tip existed. My own phase-2 brief
carried executor-derived specifics above the line — that the commits
include suggestion cards, notes, a `verifying` stamp and "T-219-s8's
discharge", and the Errata's attribution of the red base — and I was
instructed to read the card IN THE BENCH whole, which at the tip carries
the executor's implementation notes; so I read those notes BEFORE the
diff, contrary to the role file's base-ref rule. The blindness that held
is phase 1's and the ground's, both sealed before any of that; every
figure below is my own measurement at a named ref, and the executor's
report (`report-T-219-s6.md`, sha256 `64106e8d…581e2ad`) was opened only
after the diff and read as claims.

### 1. The criteria, each measured against the tree

**The card is the spec, and it says RESOLVE.** The dispatch brief told the
executor to REFUSE an interior dot segment; the card's own "Why it was
NOT folded into `T-219-s4`" rules that out in as many words. The executor
followed the card. Judged against the card's text:

**(1) `normalizeFenceToken` SHALL resolve `.` (drop) and `..` (drop with
the segment before), leaving the ceiling only above the root, which
`DOT_DOMAIN` catches unchanged — MET.** Step 7 is a segment stack guarded
on its INPUT with `DOT_DOMAIN`; a `..` with nothing to cancel is kept.
Probed at `e74c12c` through `lib/parser/dist` (the probe and its full log
are `V-T-219-s6-probe.mjs` / `.log` under the scratch stem): `lib/./parser`,
`lib/x/../parser`, `lib/x/y/../../parser`, `lib/././parser`,
`lib//./parser`, `lib/x/../y/../parser`, `lib/*/../parser` → `lib/parser`;
`a/b/../../c` → `c`; `lib/../..`, `lib/parser/../../..`, `a/b/../../..` →
`..` and `a/../../b` → `../b`, every one `kind: 'unresolved'` with the
"climbs OUT of the repository" sentence; `lib/..`, `lib/./..`,
`lib/x/../..` → `''`, refused with the "normalises to nothing" sentence;
`.` → `.`, still the "repository ROOT under its other spelling" sentence.
No token reaches `sharedDomain` as `''`, `.` or a dot-segment domain
(falsifiers F1, F8 clear). Over the live board, 918 normalised tokens on
558 cards, 0 violate the invariant (no empty, dot, slash-led, `//` or
dot-segment domain).

**(2) The ceiling paragraph SHALL MOVE, not be deleted — MET, by diff
read (mutant M10 of the attack set is a read obligation, not a body).**
The `-` block in `expandFence`'s `DOT_DOMAIN` branch is matched by a `+`
block that says the arm closed and points at the new site; the new site
in `normalizeFenceToken`'s doc names BOTH the above-root case and the
refusal that catches it, as two sentences (a) and (b), and adds a third
ceiling (lexical resolution) the old one did not owe. The glob-ceiling
paragraph is untouched.

**(3) The trailing-slash and glob bodies are the shape to extend — MET.**
Three bodies in the same `describe`, same idiom; every base body kept.

**(4) The census SHALL keep its zero and gain the positive control that
the normalisation is what makes it zero — MET.** The `T-219-s2` census
body's interior arm now runs a two-armed control: arm one asserts the
predicate FINDS `lib/./parser` and `lib/x/../parser` in a planted card's
RAW tokens; arm two asserts the SAME tokens normalise to the literal
`['lib/parser', 'lib/parser']` and the predicate finds nothing. `synthetic()`
keeps its `touches` raw, so arm one is a real predicate check. The
identity-normaliser mutant (M9id) reds it — not a tautology (A3.3). My
own RAW census over the live board at `e74c12c`: 0 tokens carry an
interior dot segment before normalisation, so the zero has both causes
today and the control is what tells them apart, as the card asked.

**(5) TRIAGE 1: the empty clause middle SHALL name the holding card —
MET.** `rule()` gains a `silent` clause keyed on `verdict === 'unusable'
&& unusable.length === 0`, naming the lane via `laneName()`; probed:
"…none could be ruled out: T-002 (refs/heads/task/T-002-lane at /w/T-002)
declares no `touches:` at all, so that fence could not be compared…";
no `undefined`, `null` or `[object` in any reason the probe produced
(A5.2); the `': . A fence'` empty middle is asserted absent by name.

**(6) TRIAGE 2: a fence that arms nothing is not startable, said by name
— MET, in the RIGHT direction (A6.1).** The startable guard gains
`fence.paths.length > 0`; `buildLaneFence` (`tools/e2e/scripts/lane-fence.mjs`
line 49, "expands to no path at all") is UNTOUCHED by the diff and still
refuses; no `catch` was added (A6.2); the clause names the condition
distinctly from T-227's "declares no `touches:`" (A6.3). Collateral: the
three live cards whose only token is their own file (`T-108`, `T-159-s1`,
`T-160-s4`) are all `done`, and no planned card carries the shape at
`e74c12c` (A6.4) — nothing on the live board flips. **But the new clause
also fires where its own comment says it must not — §4.**

**Headless — MET.** Nothing in the added bodies reaches a daemon, a port,
`.supertaskr/` or the network; the parser suite ran with none of them.

### 2. The attack set, run

Every attack in the sealed set was run through the probe or the drill;
where the set's premise was wrong, the ground truth says so and it is
recorded here rather than silently dropped:

- **A1.1–A1.3, A1.6, A1.7, A1.9, A1.10** — as in §1; plus `docs/./tasks`,
  `lib/../docs/tasks`, `docs/tasks/../tasks`, `./docs/tasks` →
  `kind: 'rejected'`, "which no card may hold" (F2 clear);
  `compareFences` on `[lib/./parser]` vs `[lib/parser]` and vs
  `[lib-parser]` → `overlapping`, witness `lib/parser`; `[lib/..foo/parser]`
  vs `[lib-parser]` → `disjoint`; the own file spelled
  `docs/tasks/./T-900-fixture.md` or `docs/tasks/x/../T-900-fixture.md` is
  carved out (`paths: []`, `excluded: [the file]`). **The set's expectation
  for `docs/tasks/./T-x.md` ("identical class to bare `docs/tasks`") was
  wrong**: a FILE named inside the directory is fenceable by rule 5, and
  the tip answers `path`, `docs/tasks/T-x.md` — the base's own answer for
  the resolved spelling.
- **A1.4, A1.5** — `app.shell`, `lib-parser`, `.eslintrc`, `foo..bar`,
  `...`, `..foo`, `foo.`, `lib/.../parser`, `lib/..../x` all byte-identical
  through the normaliser (F3 clear).
- **A1.8** — **the set's premise was false and G1 shows it**: step 2
  (backslash → `/`) exists at the base, so `lib\..\parser` was never a
  slug; at both refs it is a path, now resolving to `parser`. No
  `decodeURIComponent`: `%2e%2e` and `..%2f` pass through untouched. So
  mutant M14 ("backslash handling added") has nothing to remove and is
  dropped with that reason.
- **A2.1–A2.3** — §1 (2) and (3).
- **A3.1** — the set demanded a census over RAW tokens; **the card
  demands the opposite** ("the positive control that the new
  normalisation is what makes it zero"), and the base body already
  censused normalised output. Judged to the card: met. Data mutant D1
  (§3) records the consequence honestly.
- **A3.2, A3.5** — no `.skip`/`.todo`/narrowed corpus; `git diff
  90038e9..e74c12c -- docs/tasks/` touches only this card and the two
  filed suggestions; no other card's `touches:` moved (F4 clear).
- **A4.1, A4.2** — headless; every claimed behaviour maps to a body a
  mutant reds (§3).
- **A5.1–A5.3, A6.1–A6.4** — §1 (5) and (6); the base bodies G9 names
  are present and unchanged at the tip.

### 3. THE DRILL — 14 code mutants and 2 data mutants, landings read from `git diff -U0`, run by me

Detached scratch worktree `<scratchpad>/V-T-219-s6-drill` at `e74c12c`
(never the bench, never the lane), its own `npm ci`; driver
`V-T-219-s6-driver.sh` refuses any other path, ref or a branch, aborts on
an empty landing, restores with `git restore --source=e74c12c --staged
--worktree` and proves it with `shasum -a 256` before == after
(`src/fence.ts` `c73d1f67…83cc4f73`, `src/lanes.ts` `a1e38d89…3a2bbda6`,
`test/lanes.test.ts` `35b1e386…b76639496`). Unmutated control in the
drill: **385 passed / 3 failed of 388, exit 1** — the three T-274 bodies
of §7 and nothing else; every count below includes those three. The
report is `V-T-219-s6-drill-report.txt` (+ `-2.txt`).

| mutant (the producer side) | red | new/changed bodies it reds | verdict |
|---|---|---|---|
| VM1 step 7 dropped (`return out` before it) | 11 | resolves-INTERIOR; ceiling-MOVED; DEFECT; `a/b/../c`; UNFENCEABLE-via-dot; RESOLVES-to-climb; the census; lanes INTERIOR-COLLIDES | KILLED |
| VM2 the `DOT_DOMAIN` input guard removed | 7 | ceiling-MOVED; RESOLVES-to-climb; the census; **and the base body "REFUSES a bare dot"** | KILLED |
| VM3 uncancelled `..` dropped | 5 | ceiling-MOVED; RESOLVES-to-climb | KILLED |
| VM9 `..` never pops (treated as `.`) — not in the executor's set | 9 | resolves-INTERIOR; ceiling-MOVED; `a/b/../c`; UNFENCEABLE-via-dot; RESOLVES-to-climb; the census | KILLED |
| VM7 the character, not the segment (`startsWith('.') && !== '..'`) | 6 | dot-in-a-NAME control; `a/b/../c`'s sibling control; **and the base body "climbs OUT … with the control that a sibling name does not"** | KILLED |
| VM15 star-strip moved AFTER dot-resolve — not in the executor's set | 3 | none | **SURVIVED** — the order is pinned by no body; only a name-glued star run (`lib/parser/.*`) separates the orders and none is pinned → `T-219-s9`, not a defect of this card (§9) |
| M3raw `expandFence`'s refusal tested on `raw` — not in the executor's set | 8 | RESOLVES-to-climb; and four base bodies (docs/tasks spellings, containment, climbs-OUT, bare-dot-unstartable) | KILLED |
| M4raw `unfenceableWithin(raw)` — not in the executor's set | 7 | UNFENCEABLE-via-dot; and three base bodies | KILLED |
| M9id identity normaliser (`return raw.trim()`) — not in the executor's set | 27 | the census control, the DEFECT body and 21 others | KILLED — the census control is not a tautology |
| VM4 `fence.paths.length > 0` dropped from the startable guard | 4 | ARMS-NOTHING | KILLED |
| VM5 the `silent` clause never fires | 5 | silent-lane-named; TWO-silent-PLURAL | KILLED |
| VM6 the reserves-nothing clause never fires | 4 | ARMS-NOTHING | KILLED |
| VM13 the `silent` clause names nothing (`laneName` → `''`) — not in the executor's set | 4 | silent-lane-named | KILLED |
| VM8 the carve-out-naming arm dropped | 4 | ARMS-NOTHING | KILLED |
| D1 DATA: a planted `planned` card `touches: [lib/./parser]` in `docs/tasks/` | 3 | none | survives BY THE CARD'S CONSTRUCTION — the live census runs over normalised tokens, as the card asks; the raw arm is the control |
| D2 DATA: a planted `planned` card whose only token is its own file | 3 | none | survives — no live-board body asks "armable", only "comparable" → `T-219-s10` (§9) |

**Kill-set containment (2b), read over this set.** The dot-in-a-NAME
control's kill set `{VM7}` is disjoint from every other body's — it is
load-bearing alone, and VM7 also reds a BASE sibling-name control, so the
property was worth two bodies. UNFENCEABLE-via-dot alone sees M4raw;
RESOLVES-to-climb alone sees M3raw; ARMS-NOTHING `{VM4, VM6, VM8}` is
disjoint from the silent bodies `{VM5, VM13}` / `{VM5}`; silent-lane-named
sees VM13 and the plural body does not. Where a kill set IS contained —
DEFECT ⊂ resolves-INTERIOR ⊂ census ⊂ ceiling-MOVED ⊂ RESOLVES-to-climb,
and lanes INTERIOR-COLLIDES = DEFECT's — the containment is the property
flowing through one function to three sites (unit, expansion, dispatch),
and the contained bodies carry what no `src/` mutant can reach: the
DEFECT body's first half runs MODEL THREE (the base's normaliser, a
test-side copy) and REQUIRES `disjoint` — the positive control shown
failing, derived rather than typed; the lanes body's second half is its
own refusal-rejecting control. I accept them as site-naming restatements
with controls, not as padding. **The executor's eight kill counts
reconcile with mine exactly** (11, 7, 5, 4, 5, 4, 6, 4).

### 4. THE ASSIGNED CORRECTION — one conjunct, one body, drilled

**C1. The sixth-cause clause fires for a fence that was never computed.**
`lib/parser/src/lanes.ts`, the clause guarded by
`fence.tokens.length > 0 && fence.paths.length === 0`, whose own comment
reads *"this card DID declare a fence, every token of it resolved, and
the expansion still reserves NOTHING"*. The code tests no such thing:
a card whose ONLY token is unresolvable also has `paths: []`, so it now
receives BOTH "T-001's `touches:` reserves no path at all, so there is
nothing to arm…" (whose stated remedy is *widen the fence*) AND "T-001's
own `touches:` carries X, which resolves to neither a slug nor a path"
(whose remedy is *fix the token*). Probed at `e74c12c` with
`touches: [lib/../../x]` and no lanes: both clauses in one sentence. Two
remedies for one defect is exactly the shape this module's own doctrine
forbids, and the live instance is `T-164-s1` (`bin`, oracle-less). Not a
criterion failure — the card asked for the readers to agree, and they do
— but a sentence the diff introduced that mis-describes its cause.

The correction, written and run in the scratch copy (`V-T-219-s6-mutants/
FIX-C1-unusable-term.pl`, `BODY-C1.pl`):

    lib/parser/src/lanes.ts
    -  if (fence.tokens.length > 0 && fence.paths.length === 0) {
    +  if (fence.tokens.length > 0 && fence.unusable.length === 0 && fence.paths.length === 0) {

    lib/parser/test/lanes.test.ts, inside describe('T-219-s6 triage — …'):
      it('V-T-219-s6: a card whose only token is UNRESOLVABLE gets the unresolved clause and NOT the reserves-nothing one', () => {
        const board = [ROADMAP, card('T-001', 'Subject', { milestone: 4, priority: 1, touches: ['nowhere-at-all'] })];
        const order = readDispatchOrder(parseProjectFromFiles(board), []);
        expect(order.unfenceable.map((r) => r.id)).toEqual(['T-001']);
        const reason = order.unfenceable[0]?.reason ?? '';
        expect(reason).toContain('resolves to neither a slug nor a path');
        expect(reason, 'the reserves-nothing clause spoke for a fence that was never computed').not.toContain('reserves no path at all');
      });

Demonstrated, in order: the body alone at `e74c12c` → **RED** (4 failed
of 389: the T-274 trio plus this body — the defect shown against the
implementation that has it); the fix applied → **GREEN** (386 passed / 3
failed of 389, nothing else moved); the fix plus VM6 → ARMS-NOTHING still
reds; the fix plus VM4 → ARMS-NOTHING still reds. So the correction keeps
every kill of §3 and pins the one it adds. The integrator applies both
hunks at the landing; the comment above the clause already states the
condition the code will then meet.

### 5. Security sweep — clean

No dependency, lockfile or package manifest moved (7 files, all `.ts` or
`.md`). No new input path beyond a card's own `touches:` string, which
already reaches these sentences; the new clause text interpolates
`fence.excluded` and `laneName()` exactly as the neighbouring clauses do.
No filesystem, network or process access added; step 7 is `split`/`push`/
`pop` over one string. No secrets.

### 6. The four suites, ONCE, through the blessed runner, at MY tip

Measured from the bench root with `node tools/e2e/scripts/gate-run.mjs
<leg>`, `SUPERTASKR_E2E_PORT=25219`, on the working tree that became the
commit carrying this verdict (the two suggestion cards and this section
in place; the only edit after the runs was the four count lines below):

| leg | command, from the bench root | exit | bodies | verdict |
|---|---|---|---|---|
| parser | `node tools/e2e/scripts/gate-run.mjs parser` | 1 | 388 — 385 passed / 3 failed | RED — exactly the three T-274 bodies of §7, by name; nothing else |
| app, run 1 | `node tools/e2e/scripts/gate-run.mjs app` BEFORE `npm run build` in `app/` | 1 | 1163 — 1149 passed / 14 failed | RED — 14 bodies in 6 files (`genesis-mount`, `interview-harness`, `map-t1-t2-dom`, `map-tasks-lens-dom`, `shell-harness`, `window-manifest`), every one a "the build is newer than…"/built-bundle body reading `app/dist`, which was ABSENT: my bench install ran `npm ci` without the build the executor's setup ran. A harness omission of MINE (CONVENTIONS' app-dist gotcha), not a fact about the tree |
| app, run 2 | `npm run build` in `app/` (exit 0), then `node tools/e2e/scripts/gate-run.mjs app` | 0 | 1163 | GREEN |
| rust | `node tools/e2e/scripts/gate-run.mjs rust` (`--no-fail-fast`, built in the bench) | 0 | 639 bodies / 18 targets | GREEN |
| e2e | `SUPERTASKR_E2E_PORT=25219 node tools/e2e/scripts/gate-run.mjs e2e` | 0 | 690 | GREEN — port 25219 free before and after (`lsof -nP -iTCP:25219 -sTCP:LISTEN` empty both times); 12 min wall |

Every verdict token above carries `ref=e74c12cc8f0c873b0d828d642f40f2910e25881e`,
the checked-out commit; the tree it measured is that commit plus this
section and the two cards, i.e. the verdict commit's own tree.

### 7. The red base, attributed and never charged to the lane

Three bodies in `fence.test.ts` red at the base and at the tip alike —
"every token on every live card resolves…", "ONE live card holds the
directory the parser refuses…", "T-219-s4: every ready card the DISPATCH
oracle sees has a COMPARABLE fence…" — each by `T-274 docs/tasks`, filed
at `cc5bf50` (an ancestor of the base `90038e9`) and repaired on `main` at
`ab00399` after this lane was cut (the ground file's Errata; the
executor's `T-219-s8`). **The tip's diff does not touch those bodies**:
`fence.test.ts`'s three hunks land at base lines 136, 918 and 1039 (tip
136, 1001, 1273–1317) and the three bodies sit at tip lines 1156, 1189 and
1321, outside every hunk; the one grep hit for their titles inside the
diff is a context line. The executor's "388/388 on the merge forecast" is
a claim I did not re-run; the integrator will read it at the landing.

### 8. The executor's other commits, judged

- `92d8bce`/`25b735b` — `T-219-s7` (a second `touches:` normalisation in
  `app/src/lib/board-model.ts`, out of fence) is correctly a suggestion
  and not an ASK: no criterion needs it. The renumbering after the
  parser gate caught the double suffix is the gate working.
- `e74c12c` — `T-219-s8` records `closed_by: ab00399` in its BODY and
  keeps `status: suggested`, which is CONVENTIONS' FOURTH QUESTION shape
  (line ~722); frontmatter untouched. Correct.
- `9a0a747` — `status: verifying` is the right stamp for the hand-off.
  The notes are accurate on every figure I re-derived; one claim in the
  REPORT is wrong and harmless: "`verifier:` left empty" — the field was
  set to `claude-opus-5@subagent` at the base by the dispatcher and the
  lane did not touch it.
- The notes' "least-confident point" (`DOT_DOMAIN` read inside the
  normaliser) is a real decision, pinned both ways (VM2 reds a base body
  too); I do not overturn it.

### 9. NOT failures — routed, never blocking (verifier.md step 6)

- **`T-219-s9`** — `normalizeFenceToken`'s two undeclared shapes step 7
  composes with (a star run glued to a NAME: `lib/parser/..*` → `lib`; an
  absolute token: `/../lib` → `lib`, where `..` cancelled the empty
  anchor against the doc's own "kept" sentence) and the unpinned
  step-5/step-7 order (VM15 survived). 0 live tokens carry either shape.
- **`T-219-s10`** — the live-board census asks COMPARABLE and never
  ARMABLE (D2: a planted planned own-file-only card moves no body).

### 10. Step 7 — the gates my OWN commit could move

My commit adds two cards under `docs/tasks/` and this section. The DOCS
GATE fires on that (three suites: `app`, `e2e`, `parser`), and §6 is
those suites over exactly this tree; `parseProject` over the live tree
reports 0 issues with both cards in place, and each parses as
`status: suggested` with the fences shown. GRAPH REGEN, BOOT GATE and
METHOD EVAL are not moved by prose under `docs/tasks/`. The parser leg is
re-run at the verdict commit itself and its figure is stamped there in
the final message.

**FOR THE INTEGRATOR AT THE MERGE:** apply C1 (both hunks, §4) at the
landing and cite this drill or re-run `VM4`/`VM6`; GRAPH REGEN fires (four
`.ts` under `lib/parser/`, which is not `.supertaskrignore`d — ask `index
--check` from `app/src-tauri/` and regen with the checkpoint, never
re-pin the dogfood counts); DOCS GATE fires (five cards under `docs/tasks/`
across the lane and this bench); BOOT GATE and METHOD EVAL do not; the
T-274 trio is already green on `main` at `ab00399`; `T-219-s7`, `-s8`,
`-s9`, `-s10` are TRIAGE's to promote or park.

## The verifier's model, corrected at the merge (the integrator, 2026-09-09)

The dispatch stamp assigned `verifier: claude-opus-5@subagent`; the phase-2
spawn ran on `claude-fable-5-1` (the harness's model for a spawn that
names none — read from the agent's own transcript, and the verdict header
says so). The parser's assignment census refuses a `verified_by:` that
differs from `verifier:`, so both keys now record the seat that verified.
The executor ran on `claude-opus-5` as stamped. T-169's mismatch line
applies: verified by a different model family than the builder's, an
outside one.
