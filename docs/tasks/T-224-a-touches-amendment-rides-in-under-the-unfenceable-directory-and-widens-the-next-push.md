---
id: T-224
title: A `touches:` AMENDMENT RIDES IN UNDER THE UNFENCEABLE DIRECTORY — the landing gate admits every write to docs/tasks, so a lane can widen its own or a sibling's fence for the next push
feature: F-06
milestone: 4
priority: 2
size: M
status: verifying
blocked_by: [T-212]
touches: [.claude, tools/e2e]
suggested_by: "T-212's independent verifier, driving the gate's own `judgePaths` against a card file that is not the lane's own — the gate admits it, correctly per rule 5, and the consequence is not disclosed anywhere"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by:
review: independent
---

**BOTH ARMS ADMIT IT, AND EACH IS INDIVIDUALLY RIGHT.** `judgePaths`
admits every changed path under `UNFENCEABLE_PATHS` — `docs/tasks` —
because rule 5 rules that directory unfenceable: the dispatch stamp and
the closing stamp are written there for every card, so a lane holding it
would collide with every other lane. `T-212` therefore admits a lane's
writes to its own card, which is what makes implementation notes
performable at all.

Driven against the gate's own function at `f093b7a`, with fence
`[tools/e2e]`:

    INSIDE  (admitted): tools/e2e/x.ts
                        docs/tasks/T-901-<the lane's own card>.md
                        docs/tasks/T-900-another-card.md
                        docs/tasks/T-212-<a third card>.md
    OUTSIDE (refused):  tools/e2e-old/x.ts, docs/ARCHITECTURE.md,
                        .claude/hooks/x.mjs

## THE CONSEQUENCE, WHICH IS THE CARD

`T-212` proves — in two separate bodies — that a card edited INSIDE the
lane does not widen THAT push, because the fence is read from the
integration branch. True, and not the whole account. The amendment
itself is an admitted path, so it PUSHES, it MERGES, and it lands on
main. From the next push onward the gate reads the widened `touches:`
as the card of record.

`T-211`'s fast path A is exactly this act — "a card amendment COMMITTED
ON MAIN plus `--write-fence`" — and `T-212`'s own `ROUTE` text says it
"is triage's to take, never this hook's." Nothing stops a lane taking
it unilaterally, one merge later. The same route reaches a SIBLING's
card, so lane A can widen lane B's fence.

## What this card is NOT

Not a demand that the gate refuse writes to `docs/tasks`. That would
refuse every lane's status stamp and every set of implementation notes,
and it is the collision rule 5 says a fence-versus-fence comparison
cannot discover, ever. The directory stays unfenceable.

## What to build

**AMENDED 2026-09-08 AT DISPATCH, BEFORE THE DIFF EXISTS (orchestrator 5c;
measured by the blind phase 1's attack A1.1 and the dispatcher's ground
truth GT-9 at dfe35a5): the comparison in the first bullet is NOT
"base against tip". T-264's real fast-path-A grant (ebc51bc on main)
left the lane's copy of the card carrying the widened line, committed
BY THE LANE at 873d6d0, with no merge of main into the lane — so at the
lane's merge-base the line is OLD and at its tip NEW, and a base-vs-tip
rule would refuse a grant triage made. THE RULE IS: for every card file
in the range, compare the `touches:` line AT THE RANGE'S TIP against the
line ON THE INTEGRATION REF the fence itself is read from (the same ref,
resolved once, as it stood before the push; the merge's first parent for
a merge on an integration push). A tip line that EQUALS main's is a
delivered grant or no change: ALLOWED. A tip line that DIFFERS from
main's is an amendment riding in: REFUSED, naming the card, main's line
and the tip's line, whether the card is the lane's own or a sibling's.
A card ABSENT on the integration ref (filed in the range) is ALLOWED and
DISCLOSED: its fence governs a future push this gate does not judge; a
card id present on main under another path is resolved by id, not path,
so delete-and-re-add and rename do not evade the comparison. The
positive control and the disclosure bullets stand as written; the spec
SHALL carry a body that replays T-264's exact shape and is ALLOWED, and a
body where the tip line differs from main's and is REFUSED.**

- **Judge the `touches:` LINE, not the file.** For every card file in
  the range, read `frontmatterLineOf(text, "touches")` at the range's
  base and at its tip and compare the two strings. The file may change
  freely; a card whose `touches:` line MOVED is a fence amendment and
  is refused with the before/after named, whether it is the lane's own
  card or another's. `frontmatterLineOf` is already the one scanner and
  is already imported by this gate.
- **The refusal names the route it is not**: fast path A, on main, by
  triage.
- **A positive control in the same body**: a lane that edits its own
  card's STATUS and appends notes — the ordinary, universal case — is
  ALLOWED in the same fixture that refuses the `touches:` move. A guard
  that refuses every card write is indistinguishable from one that
  works, and this is the arm where that mistake would be invisible
  because the refusal looks principled.
- **Disclose it either way** in `landing-gate.mjs`'s "what this gate
  cannot see" list and in `T-212`'s section of the same name, which
  today names only `T-210`'s vector.

## Read beside

`T-212` (the gate and its two in-lane-widening bodies), `T-211` (fast
path A, the sanctioned route), `method/lane-protocol.md` rule 5 (why
`docs/tasks` is unfenceable, and the disclosure obligation), `T-219`
(the other open hole in what a fence may contain), `T-209` (why
`alwaysWritable` has a different polarity one call site over).

## Implementation notes

Executor `claude-opus-5@subagent`, lane `task/T-224-amendment-under-unfenceable`,
worktree `/Users/ujju/Projects/nputer-T-224`, base `dfe35a5` (the dispatch
stamp on main; the brief's row 4 named the newest checkpoint `0b7cecd`
instead — the lane on disk wins, and the correction is in the report).

### What was built

**`touchesAmendments` in `.claude/hooks/landing-gate.mjs`**, driven from
both landing moments. For every path in the judged range matching the
gate's own `CARD_FILE_RE`, `cardTouchesAt` reads
`frontmatterLineOf(text, "touches")` at the range's BASE and at its TIP —
one `git show` each, with an `ls-tree` asked ONLY when the `show` failed,
so a card the range ADDED (absent at base) and one it DELETED (absent at
tip) are answered `absent` rather than read as an empty line. A card
whose line MOVED is a fence amendment and the push is REFUSED, its own
card or a sibling's alike. The file may otherwise change freely: the
status stamp, the implementation notes, a suggestion filed beside it, a
whole new card. `docs/tasks` stays UNFENCEABLE and `judgePaths` is
untouched.

**The refusal names the before, the after, what the integration branch
itself says, and the route it is NOT** — `AMENDMENT_ROUTE`: fast path A,
on main, by triage. The lane arm answers `landing-gate-touches-amended`;
the merge arm collects `amendments` and answers
`landing-gate-merge-touches-amended`, appending them under a containment
refusal when a push carries both kinds. Both are `block` verdicts, so
neither needs a row in `push-guard.mjs`'s `ANNOUNCED_ALLOW_CODES`; a card
whose endpoints could not be READ is a cannot-compare on the existing
announced code, never a refusal and never a silent allow.

**THE ONE DECISION WORTH ATTACKING — THE EXONERATION.** A move is
exonerated when the TIP's line is character for character the line the
same card carries on the integration branch (the lane arm reads that at
`rev`, the merge arm at the FIRST PARENT). **The dispatch brief's claim
that a fast-path-A grant "never appears in a lane's own range" is true of
two deliveries and false of the third, which is the one the repository
prescribes**: `method/lane-protocol.md`'s fast path A says the amendment
goes onto the integration branch AND *"into the lane's working copy of
the card"*, so an unsynced lane commits, inside its own
merge-base-to-tip range, a line its base does not carry. Without the
exoneration this gate would refuse the one widening route its own `ROUTE`
text prescribes — the `T-223` trap one paragraph up in the same header.
The exoneration opens nothing: the fence in force is read from that same
copy, so a line the lane merely re-states there widens the fence by
exactly zero, and the only way to make the two agree in a lane's favour
is limit 6's `update-ref`, which is not new here and is disclosed. A move
this gate could not exonerate because it could not READ that copy is
REFUSED, and the refusal prints what it found.

**THE ORDER: the arm is asked AFTER the containment arm**, and that is
the second decision worth attacking. `landing-gate.spec.ts`'s *"a lane
editing its OWN card's `touches:` does not widen this gate either"* and
*"the merge's fence is read from its FIRST parent"* both drive a range
that is out-of-fence AND amended, and their kill power IS the containment
refusal. Placed ahead of them, an amendment refusal answers those pushes
for a different reason and quietly retires two bodies that measure where
the fence is read from. Cost disclosed as limit 5(c) and routed as
`T-224-s1`.

### The disclosures

`landing-gate.mjs`'s **limit 5** now states the coverage and FIVE things
the arm cannot see — (a) a card the range ADDS, (b) a card it DELETES
(which can DENY a sibling but never widen, since that lane then meets
`landing-gate-no-card`), (c) the ordering above, (d) a lane whose own
card could not be expanded from the integration branch reaches the
cannot-compare before this arm is asked, (e) limit 6 reaches the
exoneration through the same movable local ref — plus the fact that the
comparison is BYTES, so a reflow is a move, because that is what the
write-time guard compares. Two new header sections argue the arm, the
exoneration and the ordering. `T-212`'s *"what this gate cannot see"*
section takes a dated 2026-09-08 line, appended (that card is a record):
the amendment is closed, and the five residuals are cited to the module
rather than copied.

### The drill (T-224's own, verifier.md 2b's rules)

Detached scratch worktree `/Users/ujju/Projects/nputer-drill-T-224`, cut
at `ce1512c` — never the lane — with `node_modules`/`dist` symlinked from
the lane so the mutants ran against the same toolchain. Driver:
`drill-T-224.sh` in this lane's scratchpad; every landing read from
`git diff -U0`, every restoration by
`git restore --source=ce1512c --staged --worktree` and proved by sha256
against the pristine hash
`093970bd7992dc97c467a6bc5a76594f13eea3f92ce4a129ab6b02a58ff51707`.
BASELINE first: 42 passed, exit 0. Worktree removed after the drill,
clean (`git status --porcelain` empty but for the symlinks, which were
removed first).

| mutant | one-side change | exit | bodies RED |
|---|---|---|---|
| the comparison DELETED | `if (before.line === after.line)` → `if (true)` | 1 | **4**: the positive control's refusal arm, the SIBLING body, THE THIRD DELIVERY's control, the MERGE MOMENT amendment body — 38 passed |
| the comparison INVERTED | `===` → `!==` | 1 | the SAME 4 — 38 passed |
| the refusal fires for EVERY range | `amended.moved.length > 0` → `>= 0`, lane arm | 1 | **12**, including `T-212`'s own positive control and this card's ALLOW arm — 30 passed |
| NARROWED to the lane's own card | `range.paths` → `range.paths.filter((p) => p === card.file)` | 1 | **1**: the SIBLING body alone — 41 passed |

**Kill-set containment.** Mutants 1, 2 and 4 are contained to bodies
`T-224` added: the deletion and the inversion kill exactly the four
refusal-owning bodies and nothing that pre-dates this card, and the
narrowing kills exactly one — the sibling body, which is the only body
that owns *"another lane's card"*. Mutant 3 is deliberately broad and its
breadth is the finding: an unconditional refusal is the *"guard that
refuses every card write"* mistake, and 12 bodies across three cards see
it, `T-212`'s positive control first.

**THE POSITIVE CONTROL IS DEMONSTRATED FAILING, NOT ASSERTED.** The
allowed half of *"THE POSITIVE CONTROL: a `touches:` move is refused, and
the ordinary card write in the same lane is allowed"* — the status stamp,
the implementation notes and a suggestion card filed beside it — REDS
under mutant 3, an implementation lacking the property. The refusal half
REDS under mutants 1 and 2. Both halves of the pair are shown capable of
failing, which is what makes the green pair evidence.

**The inversion's kill set is identical to the deletion's, and that is
worth naming rather than smoothing over.** The inverted operator refuses
a card whose line did NOT move while the integration branch's copy
disagrees — the half-delivered-widening state — and no body reaches it,
because in every fixture where main's card differs the LANE never wrote
the card, so the card is not in the range's paths at all and the arm
never examines it. `landing-gate.spec.ts`'s *"THE DISCLOSED LIMIT,
MEASURED: a lane moves local `main`"* is the body that comes closest and
it survives for exactly that reason.

### Commands, in the order run, every exit read from `$?` unpiped

Setup (a fresh worktree has nothing installed): `npm ci` **0** and
`npm run build` **0** from `lib/parser/`; `npm ci` **0** from
`tools/e2e/`; `npm ci` **0** and `npm run build` **0** from `app/`.

| command | cwd | exit | count |
|---|---|---|---|
| `node tools/e2e/scripts/docs-gate.mjs <4 literal paths>` | lane root | 1 | FIRES — 2 docs paths, owing `npm test` from app/, `npm test` from tools/e2e/, `npx vitest run` from lib/parser/ |
| `npx playwright test tests/landing-gate.spec.ts` | tools/e2e | 0 | 42 passed (36 before this card) |
| `npm run typecheck` | tools/e2e | 0 | — |
| `npm run lint:tokens -- --selftest` | tools/e2e | 0 | 65 TOKEN + 4 CONTROL samples, 90 walk-policy, 9 evidence-floor |
| `npm run lint:tokens` | tools/e2e | 0 | TOKEN 177 files, CONTROL 1272 tracked text files |
| `npm run lint:docs` | tools/e2e | 0 | whole-tree half, 0 findings |
| `npm run capabilities:check` | tools/e2e | **1** | STALE — committed 58883 bytes, fresh 59460 |
| the four-mutant drill | drill worktree | see the table | baseline 42 passed exit 0 |
| `node tools/e2e/scripts/gate-run.mjs parser` | lane root | 0 | `bodies=377 verdict=GREEN ref=ce1512c` |
| `node tools/e2e/scripts/gate-run.mjs app` | lane root | 0 | `bodies=1163 verdict=GREEN ref=ce1512c` |
| `node tools/e2e/scripts/gate-run.mjs e2e` | lane root | 0 | `bodies=696 verdict=GREEN ref=ce1512c` (`SUPERTASKR_E2E_PORT=15224`) |
| `git merge-tree --write-tree 98d3ef5 HEAD` | lane root | 0 | a tree, not a conflict — forecast 3 paths |

**THE CENSUS IS STALE AND THE REGENERATION IS THE INTEGRATOR'S.** Six
bodies were added, so `npm run capabilities:check` exits **1** naming
`npm run capabilities`; `docs/CAPABILITIES.md` is outside this lane's
fence (`T-210`), so the regeneration lands in the MERGE commit, before
the checkpoint.

**The three heavy suites were measured at `ce1512c`, one commit before
this one.** The delta to the tip is `docs/tasks/*.md` bodies only — this
card's notes and three suggestion cards — which moves no gate's ANSWER:
the DOCS GATE already fires and GRAPH REGEN already fires on the `.ts`
path, while BOOT GATE and the METHOD EVAL GATE stay not-owed because no
`app/**`, no manifest and no `method/**` path is added. The frontmatter
half was re-run at the true tip; the integrator re-derives at the merge.

### Gates, derived from the merge forecast (`98d3ef5` → 3 paths, +4 card paths at the tip)

- **GRAPH REGEN — FIRES by trigger** (`tools/e2e/tests/landing-gate.spec.ts`
  is a `.ts` outside docs/) **and cannot move the graph by construction**:
  `.supertaskrignore` excludes `docs/`, `tools/` and `/.claude/`, which is
  every path in this diff — `T-054-s1`'s measured case, verbatim. The
  regen and the by-hand `index --check` are the INTEGRATOR's at the
  checkpoint by that bullet's own words, and `docs/architecture/graph.json`
  is outside this fence in any case. Not run here; said rather than
  guessed.
- **BOOT GATE — NOT OWED**: no `app/src-tauri/**`, no `app/src/**`,
  neither manifest.
- **DOCS GATE — FIRES**: `docs-gate.mjs` on the diff's docs paths named
  the three suites above; all three ran GREEN through the blessed runner.
- **METHOD EVAL GATE — NOT OWED**: no `method/**` path. `T-224-s3` routes
  the method-text clause this card's finding earns, because `method/` is
  `T-265`'s while both lanes are live.

### For the verifier

- The exoneration is **the least-confident point** and the one to attack.
  It is a third read the card's own build step does not mention, and it
  turns "the line moved" into "the line moved AND does not match the
  integration branch". If the ruling is that the gate should refuse the
  lane-side half of fast path A and force a sync instead, the change is
  one condition and the bodies that measure it are named — but read
  `method/lane-protocol.md`'s fast path A first, because that file
  prescribes the write this exonerates.
- The second-least-confident point is the ORDERING, disclosed as limit
  5(c) and routed as `T-224-s1`.
- Nothing in this diff is out of fence: `.claude/` and `tools/e2e` are
  the card's `touches:`, and `docs/tasks/` is unfenceable. No ask was
  routed; nothing was parked.

### Findings routed

- `T-224-s1` — both findings, one refusal (limit 5(c)).
- `T-224-s2` — a card a lane ADDS carries a `touches:` nobody triaged
  (limit 5(a)).
- `T-224-s3` — fast path A's lane-side write is now exonerated by name,
  and neither method file says so. **Out of fence** (`method/`), which is
  why it is a card and not an edit.

### Addendum — the seventh body, and the branch it closes

Written after the notes above, because reading the diff back found a
BRANCH OF THIS ARM WITH NO BODY, and on this board it is the common case
rather than a corner. A component SLUG cannot be expanded inside the
hook's dependency budget (`T-220`), so a slug-fenced lane's out-of-domain
paths reach the announced cannot-compare instead of a verdict. This arm
is asked THERE too — after the containment arm, never instead of it — so
that `T-224`'s fix is not inert for every lane whose fence names a
component. Nothing in the suite measured that until now: a change making
the arm skip an unresolvable fence reddened NOTHING.

`landing-gate.spec.ts` gains *"a fence this gate cannot RESOLVE does not
excuse an amendment — the arm is asked there too"*, a pair inside one
fixture: the same unjudged path with NO amendment is ALLOWED and
announced (so the refusal below cannot be the path's), and the same fence
plus the amendment is REFUSED.

**The drill, second pass**, same detached scratch worktree recut at the
commit above, same `git diff -U0` landings and sha256 restoration proof:

| mutant | one-side change | exit | bodies RED |
|---|---|---|---|
| the arm SKIPPED where the fence is unresolvable | `range.paths` → `read.fence.unusable.length > 0 ? [] : range.paths` | 1 | **1**: the new body alone — 42 passed |
| the comparison DELETED, against the widened body set | `if (before.line === after.line)` → `if (true)` | 1 | **5**: the four above plus the new body — 38 passed |

BASELINE first, in the recut worktree: 43 passed, exit 0. Both
restorations PROVED against the same pristine sha256
`093970bd…f51707` the first pass used, which is also the measurement
that the first pass restored the file exactly: two independent drills,
two commits apart, hashing the same bytes.

Body count 42 → 43; `npm run typecheck` from tools/e2e **0**;
`npx playwright test tests/landing-gate.spec.ts` **0**, 43 passed. The
suite figures in the table above were measured at the previous commit
and re-run at this one; the re-runs are in the executor's report.
