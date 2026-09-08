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

**WAIVER (2026-09-08, the architect seat — the seat that dispatched this card, which this line names as the rule requires): the second rejection at 40b22e4 is a DISTINCT, newly-found defect (a regression the first rework introduced: the `seen` dedupe with path-first resolution), not the first defect surviving a rebuild, with a remedy inside the fence named by the verifier. Waived once; a third pass follows; a third rejection is terminal. The escalation is docs/rooms/t224-second-rejection.md.**

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
that a fast-path-A grant "never appears in a lane's own range" holds for
a lane CUT after the amendment and for a lane that MERGES main down, and
fails for the delivery the repository itself prescribes**:
`method/lane-protocol.md`'s fast path A says the amendment
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

### Rework — 2026-09-08, a FRESH executor, closing the REJECTED verdict's one finding

Lane `task/T-224-amendment-under-unfenceable` at `dde56da` (the verdict
commit, which the lane now carries). Fresh session, not the author — the
lifecycle's rule. **ONE finding was assigned and one is closed**; nothing
else in the diff was touched.

**THE FINDING, RE-DERIVED HERE BEFORE ANYTHING WAS CHANGED.**
`touchesAmendments` asked `cardTouchesAt(root, rev, rel)` with the SAME
`rel` at the base, the tip and the record, so a card whose PATH moved
inside the range answered `absent` at both endpoints and hit both
`continue`s. A card's slug carries its title, so an ordinary retitle is a
rename — and `rangePaths` passes `--no-renames` (right for the containment
arm, which judges paths), which leaves the two names unrelated. The
amended contract's own sentence, carried on this card at lines 78–79,
rules it: *"a card id present on main under another path is resolved by
id, not path, so delete-and-re-add and rename do not evade the
comparison."* `CARD_FILE_RE` captured the id at `:414` and the capture was
never read. **The card, the verdict and the code agreed; nothing had to be
recorded as a contradiction.**

**WHAT CHANGED — `.claude/hooks/landing-gate.mjs`, three functions and the
header.**

- **`cardPathsById(root, rev, git)`, new and exported.** One
  `git ls-tree --name-only -z <rev> -- docs/tasks/` per revision, filtered
  by `CARD_FILE_RE` ITSELF, into `Map<id, string[]>`. The filter is what
  keeps two properties exact rather than hoped for: `T-224` does not match
  `T-224-s1` (the pattern's optional `-s\d+` is greedy, so the capture
  takes the suffix when the name carries one), and `docs/tasks/rejected/**`
  is not a card path at all (the capture's `[^/]*` cannot cross a slash),
  so a card FILED AWAY there still reads as a deletion — limit 5(b) —
  rather than resolving to a blob nothing fences. **The listing is NOT
  recursive**, for that same reason: below `docs/tasks/` there is no path
  this pattern can match. A LIST per id, never one path, because two files
  carrying one id is a state to report, not to pick a winner in.
- **`cardTouchesOf(root, rev, id, file, index, git)`, new and exported.**
  The PATH first — `cardTouchesAt` unchanged — and the ID only where that
  answered `absent`. So the ordinary push spends **not one extra process**,
  measured below. Four answers: a line WITH THE PATH IT WAS READ AT,
  `absent` (no file at this revision carries this id), and `problem`, which
  now also covers two files carrying one id and an `ls-tree` that failed —
  both announced on the existing cannot-compare code, never a silent allow.
- **`touchesAmendments` is keyed on the ID, and the dedupe is not
  cosmetic.** With `--no-renames` a renamed card enters `paths` TWICE, as a
  deletion of the old name and an addition of the new one; keyed on the
  path, one amendment would be reported twice and the second report would
  name the endpoints in the opposite order, which reads like two findings
  about two cards. `index` memoises the listing PER REVISION inside one
  call, so a range renaming twenty cards asks git once per ref.
- **`amendmentReport` names a path only where it DIFFERS from the one on
  the first line** — the old name is where the BEFORE line lives and is
  what `git show <base>:<path>` needs — and says `RESOLVED BY ITS ID <id>,
  not by its path` when it does. Where nothing was renamed the annotation
  is absent entirely, so every pre-existing assertion in the spec reads
  exactly as before.
- **Limit 5's residue (a) is CORRECTED, not softened.** It read *"it
  fences no live lane, since a lane's card exists before its branch
  does"*, and the verdict is right that this is false for a rename, where
  the id is preserved and the lane is live. The justification is retracted
  in place and the residue is restated as **a genuinely new id and nothing
  wider**; (b) now says a card filed under `docs/tasks/rejected/` reads as
  a deletion; a SIXTH residue (f) is added for the cannot-compare the id
  resolution can answer. The count in that sentence moves FIVE → SIX. A new
  header section, *"AND THE CARD IS FOUND BY ITS ID, WHICH IS WHAT A SLUG
  CANNOT DO"*, argues the whole thing. `T-212`'s dated 2026-09-08 line —
  this lane's OWN addition, not a pre-existing record line — takes the same
  correction in one clause.

**WHAT DID NOT CHANGE**, each re-measured rather than assumed: the
comparison is still raw BYTES; the record is still `rev` for the lane arm
and the FIRST PARENT per merge for the merge arm; the arm still sits
BETWEEN the containment block and the cannot-compare allow (the seventh
body still owns that and still reds alone under `SKIP_UNRESOLVABLE`'s
shape); `judgePaths` is untouched and `docs/tasks` stays UNFENCEABLE; both
call sites in `push-guard.mjs` are unchanged; the exoneration is untouched.

**THE GIT SPAWN COUNT, MEASURED WITH A COUNTING `git` INJECTED THROUGH THE
FUNCTION'S OWN LAST PARAMETER** (`spawns-T-224.mjs`, a throwaway repo of
40 cards, each range padded to 500 non-card paths as the verdict's A1.15
did), at `bd60cba`:

| range | spawns | which |
|---|---|---|
| 1 card, body changed, LINE UNMOVED | **2** | `show`, `show` — identical to the pre-rework figure |
| 1 card, line MOVED | **3** | + the record read |
| 1 card RENAMED and widened | **6** | + `ls-tree -- <file>` (pre-existing), + ONE `ls-tree docs/tasks/`, + the second `show` |
| **20** cards renamed and widened | **101** | 5 per card + **ONE** listing for the whole range |

The listing is O(1) per REVISION, not per card, which is the property the
rework owed.

**BODIES — five added, covering the six cases the rework was asked for;
43 → 48.** Every refusal is PAIRED with an allow inside ONE fixture,
because a guard that refused every RENAME would be indistinguishable from
one that resolves ids and would refuse the ordinary retitle.

| body | line | covers |
|---|---|---|
| *"A RENAMED card does not evade the comparison: rename-and-widen is refused, the pure rename lands"* | 1332 | rename+widen of the lane's OWN card at the LANE moment (both paths, both lines, `RESOLVED BY ITS ID`) **and** the pure rename ALLOWED |
| *"a lane RENAMING and widening a SIBLING's card is refused too, not only its own"* | 1382 | the sibling form |
| *"THE MERGE MOMENT: a merge whose lane RENAMED and widened a card is refused, then the retitle alone lands"* | 1403 | rename+widen at the MERGE moment, paired |
| *"DELETE-AND-RE-ADD under a new slug is refused, while a genuinely NEW id is the disclosed residue"* | 1443 | delete-and-re-add REFUSED **and** a genuinely new id ALLOWED (limit 5(a), measured rather than asserted) |
| *"`T-NNN` and `T-NNN-sN` are two ids: a suggestion card is never resolved against its parent"* | 1481 | the suffix distinction, and the dedupe (`1 card(s)`) |

Every expectation is a TYPED LITERAL — `"touches: [tools/e2e, app/, .claude/]"`,
`"RESOLVED BY ITS ID T-902-s1"`, `"1 card(s)"` — never a second call to the
function under test. The first body asserts its own PRECONDITION from
`git diff --no-renames`, so a fixture that stopped reproducing a rename
would red rather than pass vacuously.

### The rework's drill (verifier.md 2b; CONVENTIONS' POISON DRILL)

**A DETACHED SCRATCH WORKTREE, NEVER THE LANE**: a sibling directory
`/Users/ujju/Projects/nputer-D-T-224` (stem derived from the lane id),
`git worktree add --quiet --detach` at `bd60cba`, `node_modules`/`dist`
symlinked from the lane so the mutants ran against the same toolchain —
and the app's really was present, which is the harness failure the verdict
reported discarding. **BASELINE FIRST: 48 passed, exit 0** — the count read,
not only the exit. Driver `drill-T-224.sh` in this lane's scratchpad; every
landing read back from `git diff -U0` BEFORE the suite ran (one mutation
was rejected by that read and re-planted — see D below); every restoration
by `git restore --source=bd60cba --staged --worktree` and proved by sha256
against the pristine hook
`2edf98f91f1a5b3a2206ebd0e78ebdf0600101e455cb4bfce13861f308f8e1b5`
(the pre-rework file was `093970bd…f51707`, the hash the first two drills
used). Every restoration matched. Worktree removed, symlinks first; the
lane's own hook hashed identical afterwards.

| # | mutant | one-side change | exit | bodies RED |
|---|---|---|---|---|
| A | **THE VERIFIER'S EXACT EVASION** — resolution by path only | `listed.byId.get(id) ?? []` → `[]` | 1 | **5** — 1332, 1382, 1403, 1443, 1481 (43 passed) |
| B | statuses A/R skipped, base side | `+ if (before.file !== rel) continue;` | 1 | **2** — 1382, 1443 (46 passed) |
| B2 | statuses A/R skipped, BOTH ends | `+ if (before.file !== rel \|\| after.file !== rel) continue;` | 1 | **5** — the same five (43 passed) |
| C | the id DEDUPE removed | `if (seen.has(id))` → `if (false)` | 1 | **1** — 1481 alone (47 passed) |
| D2 | the index CONFUSES a suffix with its parent | `named[1]` → `named[1].split("-s")[0]` | 1 | **1** — 1481 alone (47 passed) |
| E | the comparison DELETED (the verdict's `ALLOWALL`) | `if (before.line === after.line)` → `if (true)` | 1 | **10** — the verdict's five (1031, 1083, 1149, 1235, 1269) **plus** all five new (38 passed) |
| F | the resolved path never NAMED in the refusal | `at === undefined \|\| at === m.file` → `true` | 1 | **5** — the same five (43 passed) |
| G | `REFUSEALL`, lane arm (the verdict's M10) | `amended.moved.length > 0` → `>= 0` | 1 | **16**, incl. the ALLOW halves of 1332, 1443, 1481 (32 passed) |
| H | `REFUSEALL`, MERGE arm | the same, on the second site | 1 | **4** — 939, 1269, 1403, 1816 (44 passed) |

**A MUTATION THAT DID NOT LAND WAS CAUGHT BY READING IT BACK, AND IS
REPORTED RATHER THAN SILENTLY REPLACED.** The first form of D wrote
`/-s\\d+$/` into the file — a regex matching a literal backslash — so the
suite came back **48 passed, exit 0**: a green indistinguishable from a
vacuous assertion, exactly `T-078`'s shape. The `git diff -U0` landing is
where it was seen. D2 is the re-plant, escape-free.

**Kill-set containment, judged over BODIES and stated against the previous
verdict's table.** The verdict's `ALLOWALL` killed {1031, 1083, 1149, 1235,
1269}; mine kills that set **plus** {1332, 1382, 1403, 1443, 1481} — a
strict superset, so no pre-existing body lost a kill to this rework.
Within the new five: A/B2/F kill all five; B kills {1382, 1443} and NOT
{1332, 1403, 1481}, and the reason is worth naming rather than smoothing —
B skips only when the NEW slug sorts before the old one in the diff, which
is a property of the two titles, so B is half of the evasion and two bodies
own that half. C and D2 have **identical kill sets, {1481}**, and I state
it rather than smooth it: 1481 is the sole owner of both properties. They
are separated at ASSERTION level inside it, which is the arming the rule
asks for — C reds line 1523 (*"more than one card was reported as moved"*)
and D2 reds line 1517 (the `RESOLVED BY ITS ID T-902-s1` literal). No
mutant in this set is killed by no body; the five new bodies are killed by
at least one mutant each, and 1382's kill set {A, B, B2, E, F} is contained
in nobody's.

**THE POSITIVE CONTROLS ARE DEMONSTRATED FAILING IN BOTH DIRECTIONS, AT
ASSERTION LEVEL** — not asserted, shown:

- 1332: `E` reds its REFUSE half (*"a RENAMED card carried its widened
  fence past the lane moment"*); `G` reds its ALLOW half (*"a PURE rename
  was refused"*).
- 1443: `E` reds *"delete-and-re-add laundered a `touches:` amendment"*;
  `G` reds *"a genuinely new card id was refused"*.
- 1481: `E` reds *"the suggestion's widening rode in behind its parent's
  deletion"*; `G` reds *"a deletion and a retitle were refused"*.
- 1403: `E` reds *"a merge carrying a renamed-and-widened card landed on
  main"*; `H` — `REFUSEALL` on the MERGE arm, planted for exactly this —
  reds *"a merge carrying a pure retitle was refused"*.
- 1382 has **no allow arm by construction** and I say so: it is a
  refusal-only body of the same shape as the pre-existing sibling body at
  1083. Its allow-side control is the pure-rename half of 1332 and 1403,
  and both of those are demonstrated failing above.

### Dogfood — the reworked arm over two live ranges (`dogfood-T-224.mjs`, read-only)

Record = the integration ref `main` (`98d3ef5`). Nothing written anywhere;
T-265's range was read from this lane's own object store, its worktree
untouched.

    ── T-224 (THIS lane)   dfe35a5..bd60cba   8 paths, 6 card ids
         T-212, T-224, T-224-s1, T-224-s2, T-224-s3, T-224-s4
       RESULT: ALLOWED — no card's `touches:` line differs from main's copy

    ── T-265 (the live sibling lane, READ-ONLY)  15619b4..3589e0f
       45 paths, 3 card ids: T-265, T-265-s1, T-265-s2
       RESULT: ALLOWED — no card's `touches:` line differs from main's copy

Both were ALLOWED before the rework and are ALLOWED after it, which is the
statement the rework owed: **id resolution did not turn either live range
into a refusal.**

### The rework's commands, in the order run, every exit read from `$?` unpiped

| command | cwd | exit | count |
|---|---|---|---|
| `node --check .claude/hooks/landing-gate.mjs` | lane root | **0** | — |
| `npm run typecheck` | tools/e2e | **2** then **0** | the first run named 10 `noUncheckedIndexedAccess` errors on the new captures; fixed with this module's own `/** @type {string} */` idiom |
| `npx playwright test tests/landing-gate.spec.ts` | tools/e2e | **0** | **48 passed** (43 at `dde56da`, re-derived: `grep -cE '^test\("'`) |
| `docs-gate.mjs <2 literal card paths>` | lane root | **1** | FIRES — 2 docs paths, owing `npm test` from app/, `npm test` from tools/e2e/, `npx vitest run` from lib/parser/; injection scan 0 hits in 0 of 2 |
| `npm run lint:tokens -- --selftest` | tools/e2e | **0** | 65 TOKEN + 4 CONTROL samples, 90 walk-policy, 9 evidence-floor |
| `npm run lint:tokens` | tools/e2e | **0** | TOKEN 177 files, CONTROL 1276 tracked text files |
| `npm run lint:docs` | tools/e2e | **0** | whole-tree half, 0 findings |
| `npm run capabilities:check` | tools/e2e | **1** | **STALE, EXPECTED** — committed 58883 bytes, fresh 60034; five bodies added |
| the nine-mutant drill | `../nputer-D-T-224`, detached | see the table | baseline **48 passed**, exit 0 |
| `gate-run.mjs parser` | lane root | **0** | **377** bodies, GREEN, ref `bd60cba` |
| `gate-run.mjs app` | lane root | **0** | **1163** bodies, GREEN, ref `bd60cba` |
| `gate-run.mjs rust` | lane root | **0** | **639** bodies, 18 targets, GREEN, ref `bd60cba` |
| `gate-run.mjs e2e` (`SUPERTASKR_E2E_PORT=15224`) | lane root | **0** | **702** bodies, GREEN, ref `bd60cba` |
| `cargo run -q -p supertaskr-index -- index --check --root ../..` | app/src-tauri | **0** | **CURRENT** — 201 files, 2542 symbols, 2441 edges |
| `git merge-tree --write-tree main HEAD` | lane root | **0** | a TREE, not a conflict — forecast **8** paths |

**THE CENSUS IS STALE AND THE REGENERATION IS THE INTEGRATOR'S**, as
before: five more spec names, `docs/CAPABILITIES.md` is outside this
lane's fence (`T-210`), so `npm run capabilities` lands in the MERGE
commit. Reported, not regenerated.

### Gates, derived from the merge forecast (8 paths at `f4fe3bf`)

- **DOCS GATE — FIRES**: 6 `docs/tasks/*.md` paths in the forecast; run on
  the two this rework writes, it named app/, tools/e2e/ and lib/parser/,
  and all three ran GREEN through the blessed runner at `bd60cba`.
- **GRAPH REGEN — FIRES by trigger** (`tools/e2e/tests/landing-gate.spec.ts`
  is a `.ts` outside `docs/`) **and moves nothing**: asked rather than
  argued this time — `index --check` answers **CURRENT** at the tip.
- **BOOT GATE — NOT OWED**: no `app/src-tauri/**`, no `app/src/**`,
  neither manifest, in the forecast's 8 paths.
- **METHOD EVAL GATE — NOT OWED**: no `method/**` path. `T-224-s3` still
  routes the method-text clause; `method/` is `T-265`'s while that lane
  is live.

The heavy legs were measured at `bd60cba`; the tip adds `docs/tasks/*.md`
prose only, which moves no gate's ANSWER — the docs gate already fires and
the graph regen already fires on the `.ts` path. The integrator re-derives
at the merge.

### For the verifier, on the rework only

- **The least-confident point is the AMBIGUITY answer.** Two files
  carrying one id at one revision returns `problem`, which reaches the
  announced cannot-compare — an ALLOW. It is consistent with every other
  `problem` in this module and it is disclosed as residue (f), but it is a
  state a hostile lane could manufacture by committing two cards with one
  id, and the honest reading is that it costs one refusal. Refusing there
  instead is one condition, and no body would have to move.
- **The second is the `docs/tasks/rejected/` reading.** A card filed away
  into that directory is a DELETE to this arm rather than a rename,
  because `CARD_FILE_RE` cannot cross a slash. That is the pre-rework
  behaviour preserved deliberately and stated in (b); it is not measured
  by a body of its own.
- Nothing in this rework is out of fence: `.claude/` and `tools/e2e` are
  the card's `touches:`, and `docs/tasks/` is unfenceable. No ask was
  routed; nothing was parked; no new finding was filed.

### Third pass — 2026-09-09, a FRESH executor, closing the re-verification's two corrections

Lane `task/T-224-amendment-under-unfenceable` at `40b22e4` (the second
verdict commit, which the lane carried). Fresh session, neither author. The
architect's WAIVER of the second-rejection stop is on this card's "What to
build" and in `docs/rooms/t224-second-rejection.md` on main (`90bdd42`);
**a third rejection is terminal**, so this pass closes exactly the two
corrections and the three bodies, and nothing else.

**THE DEFECT, RE-DERIVED HERE BEFORE ANYTHING WAS CHANGED** (`repro-T-224.mjs`
in this lane's scratchpad, three throwaway repos driving `touchesAmendments`
directly, at `40b22e4`):

    decoy + widen   paths=3   ALLOWED — nothing moved      <- the hole
    widen only      paths=2   REFUSED (amendment)          <- the control that worked
    decoy only      paths=2   ALLOWED — nothing moved      <- a duplicate id, silently

At `40b22e4`, `touchesAmendments` skipped an id already `seen` while
`cardTouchesOf` resolved the PATH first and the id only on `absent` — the
verdict cites those two sites at `:954` and `:860–864` of that file. Composed, the two endpoints of ONE id straddle TWO FILES: at
the base the decoy is absent so the index resolves the id to the real card
(old line), at the tip the direct `git show` short-circuits the index and
returns the decoy's copy of that same line, `before.line === after.line`
holds, `continue` runs, and `seen` then blocks the real card entirely. **The
card, both verdicts and the code agreed; nothing had to be recorded as a
contradiction.**

#### What changed — `.claude/hooks/landing-gate.mjs`

- **`cardTouchesOf` asks the per-revision INDEX FIRST, at every endpoint**
  (correction 1). The three-line path-first short-circuit is gone; the diff's
  own path is read only where the index maps the id to exactly that one file
  there, which is the ordinary case and is the same single `git show` as
  before. When the index maps the id to two files it answers `problem` and
  carries the list on a new `duplicate` field, so **the resolver decides that
  a state is ambiguous and the CALLER decides what it MEANS** — one site for
  each question rather than the same test in two places.
- **`touchesAmendments` resolves BOTH endpoints before it trusts either, and
  answers the ambiguity itself** (correction 2). `pathsOf` reads the same
  memoised listing, so the decision costs no process. A tip path present at
  NEITHER the range's base NOR the fence of record is one the RANGE ARRIVED
  AT: `duplicated`, and the push is REFUSED naming every file and marking the
  arriving one. A duplicate present at both ends is the board's own and stays
  the announced cannot-compare. The `absent` short-circuits moved BELOW the
  ambiguity arm on purpose — a range filing two cards under one brand-new id
  is the same ambiguity, and skipping it on `absent` would hand it back.
- **THE `arrived` TEST TAKES THE BASE *OR* THE RECORD, AND THE RECORD HALF
  IS LOAD-BEARING.** An UNSYNCED lane whose tip carries a file the integration
  branch already has invented nothing; a base-only rule would refuse it,
  which is the fast-path-A mistake in a second costume. Mutant L measures
  it (body 1675's arm four).
- **`duplicateReport` and `DUPLICATE_ID_ROUTE`, new and exported**, beside
  `amendmentReport`/`AMENDMENT_ROUTE` and for the same reason: two arms
  describing one state two ways is two accounts of one finding. The refusal
  marks WHICH file arrived, because that is the whole verdict — "this board
  has two files with one id" is a notice, "this range put one there" is not.
- **Two new BLOCK codes**, `landing-gate-card-id-duplicated` (lane) and
  `landing-gate-merge-card-id-duplicated` (merge). A block needs no row in
  `push-guard.mjs`'s `ANNOUNCED_ALLOW_CODES` — the runner prints a block's
  reason whatever that list holds — and nothing in the tree enumerates this
  gate's block codes (`git grep` over `.mjs`/`.ts`: the only consumer of any
  landing-gate code is `landing-gate-cannot-compare`, which is unchanged).
  The merge arm's outside-the-fence refusal appends duplicates the way it
  already appends amendments, so a push carrying both kinds reports both.
- **Limit 5's residue (f) is RESTATED, not softened**, and the count stays
  SIX: (f) is now the duplicate the board ALREADY carried, with the duplicate
  the range ARRIVES at named as refused rather than announced. Two header
  paragraphs argue it — the decoy account under *"AND A SECOND FILE CARRYING
  THE ID CANNOT STAND IN FOR THE CARD"*, and the cost, corrected below.
  `T-212`'s dated line — this lane's OWN addition, still a pure addition
  against `dfe35a5` (0 `-` lines, measured) — takes the same correction in
  place.

**`T-224-s4` ASKS FOR THE NEXT LETTER AND IT IS `(g)`.** That card's build
instruction reads *"a sixth entry under limit 5 — `(f)`"*; `(f)` was spent by
the rework and is now spent differently again, and (a)–(f) are all live. Read
as `(g)` when it is picked up — the same word the second verdict left for the
integrator, repeated here because s4's own text still says `(f)`.

**WHAT DID NOT CHANGE**, each re-measured rather than assumed: the comparison
is raw BYTES; the record is `rev` for the lane arm and the FIRST PARENT per
merge for the merge arm; the arm still sits BETWEEN the containment block and
the cannot-compare allow (the seventh body still owns that); id resolution
still handles rename, delete-and-re-add and the `T-NNN` vs `T-NNN-sN`
distinction; `judgePaths` is untouched and `docs/tasks` stays UNFENCEABLE;
`push-guard.mjs` is byte-identical to `dfe35a5`; the exoneration is untouched.

#### The spawn budget — MEASURED, and it went UP for the ordinary push

`spawns-T-224.mjs`, a counting `git` injected through the function's own last
parameter, a throwaway repo of 40 cards, each range padded to 500 non-card
paths as the verdicts' A1.15 did, at `aab21bc`:

| range | spawns | which |
|---|---|---|
| a range with NO card path | **0** | nothing is asked at all |
| 1 card, body changed, LINE UNMOVED | **4** | 2 `ls-tree docs/tasks/` + 2 `show` |
| 1 card, line MOVED | **5** | + the record read |
| 1 card RENAMED and widened | **5** | (it was **6** before this pass) |
| **20** cards renamed and widened | **62** | **2** listings for the whole range + 60 `show` (it was **101**) |

**THE ORDINARY PUSH COSTS TWO PROCESSES MORE THAN IT DID, AND THE HEADER'S
CLAIM THAT IT COSTS NONE IS RETRACTED IN PLACE.** That claim was true only of
the `absent`-gated fast path, which is the defect: knowing an id is unique at
a revision requires listing that revision, and there is no cheaper question.
What IS preserved is the property the rework owed — **one listing per
REVISION, never one per card** — and a renaming push is now cheaper than
before, because the per-path `ls-tree` the old `absent` branch paid is gone.
`T-224-s5` (unpinned cost) is unaffected: it still asks for bodies, and its
figures move to the table above.

#### The drill (verifier.md 2b; CONVENTIONS' POISON DRILL)

**A DETACHED SCRATCH WORKTREE, NEVER THE LANE**: sibling
`/Users/ujju/Projects/nputer-D3-T-224` (stem derived from the lane id),
`git worktree add --quiet --detach`, moved with `checkout --quiet --detach`
to `aab21bc` when the last spec arm landed and RE-BASELINED there — every
figure in the table below is at `aab21bc`. `node_modules`/`dist`
symlinked from the lane so the mutants ran against the same toolchain — the
app's included, the harness failure the first verdict reported discarding.
**BASELINE FIRST: 51 passed, exit 0** — the count read, not only the exit.
Every mutation applied through `mutate-T-224.mjs`, which REFUSES unless the
FROM string occurs exactly once, so a mutation that did not land is a failure
rather than a green (`T-078`'s shape, which bit the previous pass). Every
landing read back from `git diff -U0` BEFORE the suite ran; every restoration
by `git restore --source=aab21bc --staged --worktree` and proved by sha256
against the pristine hook
`5b8522c66a60a44de9d8ac2069a567d1b8e0512a957f494e8ba3361b0d0cea35`
(the pre-third-pass file was `2edf98f9…e1b5`, which the REWORK's drill used
and which this pass verified against `git show 40b22e4:…` before touching
anything; the two drills before that used `093970bd…f51707`). **Every restoration matched**; the worktree was removed, symlinks
first, and the lane's own hook hashed identical afterwards.

| # | mutant | one-side change | exit | bodies RED |
|---|---|---|---|---|
| A | **THE REGRESSION ITSELF** — the path-first short-circuit put back | the 3 lines re-inserted at the head of `cardTouchesOf` | 1 | **3** — 1561, 1635, 1675 (48 passed) |
| B | the dedupe by PATH (the verdict's `DEDUPE_BY_PATH`) | `seen.has(id)/add(id)` → `seen.has(rel)/add(rel)` | 1 | **2** — 1481, 1561 (49 passed) |
| C | **ambiguity → ALLOW** (the fail-open the verdict named) | `if (arrived.length > 0) {` → `if (false) {` | 1 | **3** — 1561, 1635, 1675 (48 passed) |
| D | EVERY duplicate refused, the inherited one included | `atTip.at.filter((p) => !known.has(p))` → `atTip.at` | 1 | **1** — 1675 alone (50 passed) |
| E | `REFUSEALL` on the lane's DUPLICATE arm | `amended.duplicated.length > 0` → `>= 0` | 1 | **19**, incl. the ALLOW halves of 568, 1031, 1105, 1561 (32 passed) |
| F | `REFUSEALL` on the lane's AMENDMENT arm (the verdict's M10) | `amended.moved.length > 0` → `>= 0` | 1 | **17** (34 passed) |
| G | the ARRIVED marker never printed | `d.arrived.includes(p) ? … : ""` → `false ? … : ""` | 1 | **3** — 1561, 1635, 1675 (48 passed) |
| H | the MERGE arm's duplicate refusal disabled | `if (amended.duplicated.length > 0) {` → `if (false) {` | 1 | **1** — 1635 alone (50 passed) |
| H2 | `REFUSEALL` on the MERGE duplicate arm | the same site → `>= 0` | 1 | **5** — 939, 1269, 1403, 1635, 2048 (46 passed) |
| I | the comparison DELETED (both earlier tables' `ALLOWALL`) | `if (before.line === after.line)` → `if (true)` | 1 | **11** (40 passed) |
| J | **the verdict's SURVIVOR** `AMBIGUITY_PICKS_FIRST` | `if (paths.length > 1) {` → `if (false) {` | 1 | **3** — 1561, 1635, 1675 (48 passed) |
| K | the verdict's `NO_ID_LOOKUP` | `listed.byId.get(id) ?? []` → `[]` | 1 | **13** (38 passed) |
| L | the `arrived` test forgets the RECORD | `new Set([...atBase.at, ...atRecord.at])` → `new Set([...atBase.at])` | 1 | **1** — 1675 alone (50 passed) |

**THE VERDICT'S ONE DELIBERATE SURVIVOR IS NOW KILLED, WHICH IS THE POINT OF
MUTANT J.** The re-verification reported `AMBIGUITY_PICKS_FIRST` surviving all
48 bodies — *"residue (f) … is asserted and measured by nothing"*. It reds
three bodies here, because picking `paths[0]` silently is now a behaviour the
suite owns rather than a branch nobody drives.

**Kill-set containment, judged over BODIES and stated against BOTH earlier
tables.** The three new bodies' kill sets are 1561 `{A,B,C,E,F,G,I,J,K}`,
1635 `{A,C,G,H,H2,J,K}`, 1675 `{A,C,D,G,J,K,L}`. **No two of them contain
each other**: D and L kill 1675 and neither 1561 nor 1635; H and H2 kill 1635
and not 1561 or 1675; B, E, F and I kill 1561 and neither of the others.
Against the SECOND verdict's table, mutant I is the same mutation as its
`ALLOWALL` and its kill set is a **strict superset** — the rework's ten
{1031, 1083, 1149, 1235, 1269, 1332, 1382, 1403, 1443, 1481} **plus** 1561 —
so no pre-existing body lost a kill to this pass; against the FIRST verdict's
table its five are contained in that ten. `NO_ID_LOOKUP` (K) likewise grows
from the verdict's five to thirteen, because the index is now the only
resolver.
**AND ONE BODY IS NOT ISOLATED BY ANY MUTANT I BUILT, WHICH I STATE RATHER
THAN SMOOTH** (shape SIX's asking): H isolates 1635 and D and L each isolate
1675 at a failing-body count of ONE, and **nothing isolates 1561** — every
mutant aimed at the lane arm's duplicate refusal reds 1675's first two arms
as well, since both drive that same call site. What separates them is
measured rather than argued: B reds 1561 and not 1675, D and L red 1675 and
not 1561. What 1561 owns alone is the SIBLING widening suppressed behind a
decoy — the verdict's own construction — and the ordinary-two-card ALLOW.

**THE POSITIVE CONTROLS ARE DEMONSTRATED FAILING, NOT ASSERTED**, at
assertion level and in both directions:

- 1561's ALLOW half (*"an ordinary range changing TWO cards was refused"*)
  reds under `E` and `F`, the two refuse-all mutants; its REFUSE half reds
  under `A`, `C`, `G`, `J` and `K`.
- 1635's ALLOW half (*"a merge carrying ordinary card writes was refused"*)
  reds under `H2`; its REFUSE half (*"a merge carrying a same-id decoy landed
  on main"*) reds under `A`, `C`, `G`, `H`, `J`, `K`.
- 1675's ALLOW halves — arm three (*"an inherited duplicate refused the
  push"*) and arm four (*"a lane was charged with the record's own
  duplicate"*) — red under `D` and `L` respectively; its REFUSE halves red
  under `A`, `C`, `G`, `J`, `K`.

#### The three bodies, and what each covers — 48 → 51

| body | line | covers |
|---|---|---|
| *"A SAME-ID DECOY CANNOT STAND IN FOR THE REAL CARD: the widening behind one is refused, and the ordinary two-card range still lands"* | 1561 | the verdict's construction (b), the SIBLING form, at the LANE moment — with its own PRECONDITION asserted (the decoy really does sort first in the range's paths); the same widening with NO decoy still REFUSED as an amendment (the control that already worked); an ordinary range changing TWO cards' bodies ALLOWED (so the fix is not "refuse any range touching two cards") |
| *"THE MERGE MOMENT: a merge whose lane planted a same-id file is refused, then the same merge without it lands"* | 1635 | the same at the MERGE moment, records read from the FIRST parent, paired with the clean merge |
| *"a duplicate card id the range ARRIVES AT is refused; one it INHERITS is the announced cannot-compare"* | 1675 | the duplicate ALONE refused (correction 2, no line moving anywhere); **PUSH 2 of the verdict's three-push construction refused** — the board made ambiguous by a road that is not this gate, then the decoy swapped for one sorting EARLIER; the INHERITED duplicate ALLOWED and ANNOUNCED (limit 5(f), measured); and the RECORD half — an unsynced lane writing a file main already carries is not charged |

Every expectation is a TYPED LITERAL — `"ARRIVED IN THIS RANGE"`,
`"1 card id(s)"`, `"the ambiguity is the BOARD's"`, `"touches: [method/]"` —
never a second call to the function under test. All three drive a REAL
`git push` through the command `.claude/settings.json` wires
(`pushThroughGuard`) and assert the REMOTE REF, not an exit code, which is
what the verdict's proposed body (i) demonstrated red at `4a9f278`.

#### Dogfood — the reworked arm over two live ranges (`dogfood-T-224.mjs`, read-only)

Record = the integration ref `main`, read at `cc5bf50` (a LIVE fact: main
moved three times while this pass ran — `90bdd42`, `15684b4`, `cc5bf50`).
Nothing was written anywhere; T-265's range was read from this lane's own
object store and its worktree was never touched.

    ── T-224 (THIS lane)   dfe35a5..HEAD   9 paths, 7 card ids
         T-212, T-224, T-224-s1, T-224-s2, T-224-s3, T-224-s4, T-224-s5
       RESULT: ALLOWED — no card's `touches:` line differs from main's copy

    ── T-265 (the live sibling lane, READ-ONLY)  15619b4..3589e0f
         45 paths, 3 card ids: T-265, T-265-s1, T-265-s2
       RESULT: ALLOWED — no card's `touches:` line differs from main's copy

Both were ALLOWED before this pass and are ALLOWED after it, which is the
statement it owed: **neither correction turned a live range into a refusal.**

#### Commands, in the order run, every exit read from `$?` unpiped

| command | cwd | exit | count |
|---|---|---|---|
| `node --check .claude/hooks/landing-gate.mjs` | lane root | **0** | — |
| `repro-T-224.mjs` (the defect, at `40b22e4`) | lane root | **0** | **2 of 3** fixtures ALLOWED — the widening behind the decoy, and the duplicate id nobody judged |
| `npm run typecheck` | tools/e2e | **0** | — |
| `npx playwright test tests/landing-gate.spec.ts tests/push-checks.spec.ts` | tools/e2e | **0** | **62 passed** = **51** + **11** (48 + 11 at `40b22e4`; re-derived with `grep -cE '^test\("'`) |
| `spawns-T-224.mjs` | lane root | **0** | the table above |
| the thirteen-mutant drill | `../nputer-D3-T-224`, detached | see the table | baseline **51 passed**, exit 0 |
| `dogfood-T-224.mjs` | lane root | **0** | both ranges ALLOWED |
| `docs-gate.mjs <2 literal card paths>` | lane root | **1** | FIRES — 2 docs paths, owing `npm test` from app/, `npm test` from tools/e2e/, `npx vitest run` from lib/parser/; **injection scan 0 hits in 0 of 2**; 0 frontmatter issue(s) in the live tree; governing-document budgets hold |
| `npm run lint:tokens -- --selftest` | tools/e2e | **0** | 65 TOKEN + 4 CONTROL samples, 90 walk-policy, 9 evidence-floor |
| `npm run lint:tokens` | tools/e2e | **0** | TOKEN 177 files, CONTROL **1277** tracked text files |
| `npm run lint:docs` | tools/e2e | **0** | whole-tree half, 0 findings — *"I was not asked"*, never *"nothing owed"* |
| `npm run capabilities:check` | tools/e2e | **1** | **STALE, EXPECTED** — committed 58883 bytes, fresh 60381; three bodies added. **REPORTED, NOT REGENERATED**: `docs/CAPABILITIES.md` is outside this fence (`T-210`), so `npm run capabilities` is the INTEGRATOR's, in the merge commit |
| `cargo run -q -p supertaskr-index -- index --check --root ../..` | app/src-tauri | **0** | **CURRENT** — 1191343 bytes, 201 files, 2542 symbols, 2441 edges |
| `git merge-tree --write-tree <main> HEAD` | lane root | **1** at `aab21bc`, **0** at `d0b7910` | see the gates below |
| `gate-run.mjs parser` | lane root | **0** | **377** bodies, 1 target, GREEN, ref `d0b7910` |
| `gate-run.mjs app` | lane root | **0** | **1163** bodies, 1 target, GREEN, ref `d0b7910` |
| `gate-run.mjs rust` | lane root | **0** | **639** bodies, 18 targets, GREEN, ref `d0b7910` |
| `gate-run.mjs e2e` (`SUPERTASKR_E2E_PORT=15224`) | lane root | **0** | **705** bodies, 1 target, GREEN, ref `d0b7910` |

#### The gates, derived from the merge forecast (9 paths)

`git merge-tree --write-tree <main> HEAD` at the notes commit `d0b7910`,
with `main` read at `cc5bf50`: **exit 0, a TREE**, and the forecast is **9**
paths — `.claude/hooks/landing-gate.mjs`, `tools/e2e/tests/landing-gate.spec.ts`
and 7 `docs/tasks/*.md`.

**THE FORECAST CONFLICTED UNTIL THE ARCHITECT'S WAIVER WAS COMMITTED IN THIS
LANE, AND ONLY THE EXIT CODE CAUGHT IT.** At `aab21bc` — the code commit,
with the waiver paragraph sitting UNCOMMITTED in this lane's working copy
exactly as the seat delivered it — `merge-tree --write-tree` exits **1** and
prints CONFLICT on this card, because main gained that paragraph at `90bdd42`
inside *"What to build"* while the lane's own copy moved in the same file.
Read through a command substitution that swallows the status, it hands back
an empty forecast — and an empty forecast says all four gates are NOT OWED,
which is the exact failure CONVENTIONS' RANGE RULE names. Committing the
delivered line makes it exit 0.

- **DOCS GATE — FIRES**: 7 `docs/tasks/*.md` paths in the forecast. Run on
  the two this pass writes, it named app/, tools/e2e/ and lib/parser/, and
  all three ran GREEN through the blessed runner at `d0b7910`.
- **GRAPH REGEN — FIRES by trigger** (`tools/e2e/tests/landing-gate.spec.ts`
  is a `.ts` outside `docs/`) **and moves nothing**: asked rather than argued
  — `index --check` answers **CURRENT** at the tip. The regen and the by-hand
  check are the INTEGRATOR's at the checkpoint, and
  `docs/architecture/graph.json` is outside this fence in any case.
- **BOOT GATE — NOT OWED**: no `app/src-tauri/**`, no `app/src/**`, neither
  manifest, among the forecast's 9 paths.
- **METHOD EVAL GATE — NOT OWED**: no `method/**` path. `T-224-s3` still
  routes the method-text clause; `method/` is `T-265`'s while that lane is
  live.

**THE HEAVY LEGS AND EVERY FIGURE ABOVE ARE MEASURED AT `d0b7910`, AND THE
COMMIT CARRYING THIS BLOCK ADDS `docs/tasks` PROSE PLUS A COMMENT-ONLY EDIT
TO `landing-gate.mjs`** — limit 5(f), tightened to say *"none of which this
range arrived at"* rather than *"when the range was cut"*, which is the
condition the code actually tests. **PROVED MECHANICALLY RATHER THAN
ASSERTED**: `git diff d0b7910 -- .claude/hooks/landing-gate.mjs` has **0**
changed lines that do not begin with ` *`, so no mutant's kill set and no
suite's answer can depend on it, and the docs gate already fires on 7 card
paths while the graph regen already fires on the `.ts`. The landing-gate and
push-checks specs were RE-RUN at that tree and the integrator re-derives at
the merge.

#### For the verifier, on the third pass only

- **The least-confident point is the RULE FOR "WHO ARRIVED".** The verdict's
  own formula was `index(base).byId[id].length <= 1 && index(tip)…length > 1`;
  I widened it to *a tip path present at NEITHER the base NOR the record*, and
  the widening is not cosmetic — the verdict's own correction 3(iii) asks for
  **push 2** of the three-push construction to be refused, and push 2 swaps
  one decoy for another on a board that is ALREADY ambiguous at the base, so
  the narrow formula does not fire there. Both halves are measured: mutant D
  (refuse every duplicate) and mutant L (forget the record) each red body 1675
  alone, from opposite sides.
- **The second is that the INHERITED duplicate is still an ALLOW.** A board
  carrying two files for one id stops this arm judging that id, and a widening
  can ride it — announced, never silent. No lane reaches that state through
  this gate any more (arm one of 1675 refuses it), so what remains is a
  duplicate arriving by the route `T-224-s4` names: a direct non-merge commit
  on the integration branch, which this gate never asks. That is limit 5(f)
  and it is stated rather than closed.
- **The third is the SPAWN BUDGET**, which went from 2 to 4 processes for the
  ordinary push. It is the price of the correction and I say so in the header
  rather than leaving the old claim standing; `T-224-s5` still asks for the
  bodies that would pin it.
- Nothing in this pass is out of fence: `.claude/` and `tools/e2e` are the
  card's `touches:` (the manifest re-read at `dfe35a5`:
  `touches: [.claude, tools/e2e]`, `alwaysWritable: ["docs/tasks"]`), and
  `docs/tasks/` is unfenceable. No ask was routed; nothing was parked; no new
  finding was filed and no suggestion card was written.

## Verdicts

2026-09-08 — `claude-opus-5@subagent (phase 2)` (verifier, BLIND
TWO-PHASE, `review: independent`)

VERDICT: REJECTED

attack set: sha256:a07bde3b4f8e391e2a180477438c738224d16ea19b5b0216079fc6666e5d3496 (attack-set-T-224.md)
ground truths: sha256:aae9491f1447ca547dd1396e4d87177efaed30d5b65b4d7e0b1f19953dce6977 (ground-T-224.md)

base `dfe35a5` · tip `7cebf35` · amended-contract ref `6f1622e` ·
bench `../nputer-V-T-224`, detached, `SUPERTASKR_E2E_PORT=25224`.

**THE FRAME I ACTUALLY HAD.** Phase 2, a fresh spawn WITH tools. Both
digests verified with `shasum -a 256` before either file was opened; both
matched. The reading order was kept: `method/roles/verifier.md` in full,
then the card at `dfe35a5`, then the AMENDED card on main at `6f1622e`,
then the sealed attack set with its dispatcher annotations, then the
ground truths, then STATE/ARCHITECTURE/CONVENTIONS at the tip, and only
then `git diff dfe35a5..7cebf35`. The commit list was taken with
`git rev-list` (hashes only); no `git log` with subjects was run on the
lane range, and the bench was moved with `checkout --quiet --detach`.
The executor's Implementation notes were opened only AFTER my own attack
driver had run, and every claim in them was re-derived here.
**Phase 1's no-tool property is a self-report, not a guarantee** — this
harness cannot deny a subagent tools; the set states `tool calls made: 0`
and I record that as its claim, not as something I can check. My brief's
duties section named executor-derived specifics (43 bodies, a six-mutant
table, "a SEVENTH body"), so **phase 1 was above the line for those
figures and I say so rather than pretend otherwise**; I re-derived each
independently before comparing.

**THE GROUND TRUTHS ARE PARTLY SPOILED, AND I RE-TOOK THEM AT THE BASE.**
`ground-T-224.md`'s GT-4, GT-7, GT-8 and GT-10 were captured through a
shell escape that ate `:t` (`dfe35a5ools/e2e/...`, `dfe35a5ib/parser/...`),
so those four carry `fatal: ambiguous argument` instead of measurements —
GT-10 reports **1** card in `docs/tasks` where there are **594**, and
GT-2's function body came back empty. I re-derived all five AT `dfe35a5`,
before opening the diff, and they are used below in that form. GT-9,
GT-1, GT-3, GT-5, GT-6, GT-11, GT-12 and GT-13 were intact and are used
as sealed.

---

### THE FAILURE: A RENAMED CARD CARRIES ITS WIDENED FENCE STRAIGHT PAST BOTH LANDING MOMENTS

**The amended contract requires id-resolution in the words that dispatch
added, and the implementation resolves by PATH alone.** `6f1622e`'s
"What to build", carried verbatim on the lane's own copy at the tip
(lines 78–79):

> a card id present on main under another path is resolved by id, not
> path, so delete-and-re-add and rename do not evade the comparison.

`touchesAmendments` (`landing-gate.mjs:771`) iterates `paths` and asks
`cardTouchesAt(root, rev, rel)` with the SAME `rel` at the base, the tip
and the record. On a rename the two sides are different strings, so the
new path is `absent` at the base and the old path is `absent` at the tip,
and both hit a `continue`:

    if ("absent" in before) continue;      // landing-gate.mjs:780
    ...
    if ("absent" in after) continue;       // landing-gate.mjs:783

`CARD_FILE_RE` captures the id in group 1 (`:414`) and the capture is
never read. `rangePaths` passes `--no-renames` deliberately (`:695`),
which is right for the containment arm and is what leaves this arm
looking at two unrelated paths.

**Reproduction — the lane's own card** (`rename-hole-V-T-224.mjs`, a
throwaway git repo, driving the two exported verdict functions):

    PUSH 1, LANE MOMENT : allow / landing-gate-inside-the-fence
    PUSH 1, MERGE MOMENT: allow / landing-gate-merges-inside-the-fence
    THE FENCE OF RECORD ON MAIN AFTER PUSH 1:
      touches: [tools/e2e, app/, .claude/]        (it was [tools/e2e])
    PUSH 2 (the next push the amendment licensed):
      allow / landing-gate-inside-the-fence — app/anything.ts and
      .claude/hooks/anything.mjs, two paths the original fence never
      permitted

One commit renames `docs/tasks/T-920-a-narrow-card.md` to
`…-a-retitled-card.md` — an ordinary retitle, since a card's slug carries
its title — and widens `touches:` in the same act. This is exactly the
sequence the card's own opening describes: *"it PUSHES, it MERGES, and it
lands on main. From the next push onward the gate reads the widened
`touches:` as the card of record."*

**And the sibling form, which is the sharper one**
(`sibrename-V-T-224.mjs`): lane A renames lane B's card and widens B's
fence from `[app/]` to `[app/, .claude/, lib/, tools/]` —

    LANE MOMENT : allow / landing-gate-inside-the-fence
    MERGE MOMENT: allow / landing-gate-merges-inside-the-fence

That is **falsifier 2 of the sealed set** — *"a sibling-card amendment
admitted (incl. via rename …)"* — and it is the card's own headline
consequence: *"lane A can widen lane B's fence."*

**Three things make this REJECTED rather than a routed finding.** It is a
named requirement of the contract as amended at dispatch, not an
unstated corner. No body among the 43 measures it — the suite is green
while the hole is live, which is the exact condition `T-212`'s section
calls *"a guard trusted further than it measures"*. And it is
undisclosed: limit 5's residues (a)–(e) do not name it, and (a)'s stated
justification — *"it fences no live lane, since a lane's card exists
before its branch does"* — is **false for a rename**, where the id is
preserved and the lane is live. `T-224-s2` routes only the genuinely-new
card, so nothing in the tree carries this.

**THE CORRECTION, NAMED PRECISELY.** In `touchesAmendments`, where
`cardTouchesAt` answers `absent` at the base (or at the record), resolve
the card by the id `CARD_FILE_RE` already captures — one
`git ls-tree -r --name-only <rev> docs/tasks` per range at most, gated on
an `absent` answer so the ordinary path costs nothing extra — and compare
against that blob. Then: a rename with the line preserved is ALLOWED, a
rename that moves the line is REFUSED naming both paths, and
delete-and-re-add of an existing id is REFUSED (it is already refused
when the path is unchanged; my A1.8b measured that). Two bodies are owed:
rename-plus-widen REFUSED naming both paths, and pure-rename ALLOWED —
the pair, in one fixture, so the second cannot be a guard that refuses
every rename. Limit 5 and `T-212`'s section then need the residue
restated, since (a) is currently wrong about the live-lane case.

---

### THE ATTACK SET, ANSWERED

Driven by `attacks-V-T-224.mjs` — my own fixtures, not the lane's — over
the two exported verdict functions. 16 of 18 expectations met.

| attack | result | evidence |
|---|---|---|
| **A1.1** T-264's real shape (GT-9): unsynced lane, grant in its working copy, main's line EQUAL | **ALLOWED** ✓ | `allow/landing-gate-inside-the-fence`. Falsifier 1 not tripped. |
| **A1.1b** lane CUT after the grant | **ALLOWED** ✓ | `allow/landing-gate-inside-the-fence` |
| **A1.2** THE CENTRAL ATTACK — two-merge push, widening inside merge 1 | **REFUSED, merge 1 NAMED** ✓ | `block/landing-gate-merge-touches-amended`; the record is `first` (`M^1`) per merge (`:1858`), never the pushed tip. The laundering does not work. |
| **A1.3** per-merge base | ✓ | `range` is `merge-base(first, second)..second`; parents from `rev-list --parents -n 1` (`:1868`) |
| **A1.4** reorder-only, quoted-entry, trailing-comma | **REFUSED** (raw bytes) ✓ | three fixtures, each `block/landing-gate-touches-amended` |
| **A1.5** whitespace-only | **REFUSED**, and DOCUMENTED ✓ | limit 5: *"AND THE COMPARISON IS BYTES, SO A REFLOW IS A MOVE"*, argued from fast path A's own "character for character" |
| **A1.6** a SIBLING's card, both moments | **REFUSED at both**, naming T-906 ✓ | `landing-gate-touches-amended` / `landing-gate-merge-touches-amended` |
| **A1.7** RENAME | **ALLOWED — THE FAILURE ABOVE** ✗ | see above |
| **A1.8** a card the range ADDS with a wide fence | ALLOWED, disclosed (a), routed `T-224-s2` ✓ | by design |
| **A1.8b** delete-then-re-add at the SAME path | **REFUSED** ✓ | `block/landing-gate-touches-amended` — absence does not launder when the path is stable |
| **A1.9** a card the range DELETES | ALLOWED, disclosed (b) ✓ | reachable damage is a denial, per (b)'s argument, which I checked: `landing-gate-no-card` refuses that lane's next push whole |
| **A1.10** both call sites | ✓ | `push-guard.mjs:3086` lane, `:3094` merge — exactly two, unchanged from `dfe35a5` |
| **A1.11** a NON-MERGE commit straight onto the integration branch | ALLOWED, `landing-gate-no-new-merges` — **correct by design, undisclosed** | `AMENDMENT_ROUTE` prescribes exactly this as the sanctioned route. Filed as `T-224-s4`, not a failure. |
| **A1.12a** widen-then-revert in one range | ALLOWED ✓ | two file states, never the patch |
| **A1.12b** widening via a NESTED merge inside the lane | **REFUSED** ✓ | `block/landing-gate-touches-amended` |
| **A1.13** body-quoted `touches:` in a fenced block | not fooled ✓ | scanner returned `touches: [tools/e2e]`; `frontmatterLineOf` returns `undefined` at the closing `---` (`lane-fence.mjs:997`), bounded on purpose |
| **A1.14** exit contract | ✓ | The set predicted "exit 2 / exit 3"; the real contract (re-derived, GT-7 spoiled) is `push-guard-hook.mjs`: **exit 2, reason on stderr** for a block, **exit 0 announced** for cannot-compare. There is no exit 3 here. No catch-and-allow: an UNREADABLE record still REPORTS the move, with `record: "UNREADABLE — …"` — measured. |
| **A1.15** cost | ✓ | **2 git spawns** for a range of 501 changed paths containing 1 card. O(changed cards), enumerated from the range's diff, no directory listing. |
| **A1.16** block-sequence frontmatter | **REFUSED, never silently allowed** ✓ | both endpoints read `touches:` bare, so the arm sees no move — but the push is refused upstream by `landing-gate-no-fence`. Never a silent allow. |
| **A2.1/A2.2** the refusal's text | ✓ | asserts card path, the BEFORE line and the AFTER line untruncated (spec `:1042–1044`); `AMENDMENT_ROUTE` carries all three of "fast path A", "on main", "by triage" and addresses the seat that owes the grant, not the pusher |
| **A2.4** stale naming | ✓ | no `.nputer/` in any added string |
| **A3.1–A3.4** the positive control | ✓ | armed both ways, below; the sibling BODY-edit control is inside the same fixture as the sibling refusal |
| **A4.1** the record | ✓ / disclosed | `T-212`'s section is a **pure dated addition, zero `-` lines**. The hook's limit 5 DOES carry `-` lines: the old entry asserted the hole was OPEN and `T-224` owned it, which the diff makes false. A statement that has become untrue is corrected, not erased — items 1,2,3,4,6,7 are untouched. I record the literal check as failed and judge it not a rewrite. |
| **A4.2** an honest disclosure | ✓ except (a) | every added sentence maps to a body or an explicit residue — but (a)'s justification is wrong for a rename, which is part of the rejection |
| **A4.3/A4.4** both places, with a reader | ✓ | both files under the exact heading; the disclosure bodies red under the mutants below |
| **the SEVENTH body** — is an unresolvable fence a hole? | **A REFUSAL, not a hole** ✓ | the arm sits BETWEEN the containment block and the cannot-compare allow (`:1641` before `:1673`), so a fence with an unresolvable token is still asked. Mutant `SKIP_UNRESOLVABLE` confirms exactly one body owns it. |

### The falsifiers

1. **a legitimate fast-path-A grant refused** — **NO.** All three
   deliveries allowed (A1.1, A1.1b, and the dogfood below).
2. **a sibling-card amendment admitted** — **YES, via rename.** The
   rejection.
3. **a positive control that cannot fail** — **NO.** Armed both ways at
   assertion level, below.
4. **a record rewritten** — **NO** for `T-212` (zero `-` lines,
   `git diff dfe35a5..7cebf35 -- docs/tasks/T-212-*.md` is a pure dated
   addition, verified against GT-3's verbatim text); qualified for the
   hook, disclosed in A4.1 above.
5. **fail-open** — **NO.** Unreadable record → the move is still
   reported; unresolvable fence → still asked; malformed/block
   frontmatter → refused upstream, never silently allowed.
6. **a tautological expectation** — **NO.** The spec asserts literal
   strings (`"touches: [tools/e2e]"`), not a second call to
   `frontmatterLineOf`.

### The drill — my own detached scratch worktree `../V-T-224-mutants`

Its own `npm ci`/build for `lib/parser`, `app` and `tools/e2e`. Every
landing read from `git diff -U0`; every restoration proved by sha256
against the pristine `093970bd7992dc97c467a6bc5a76594f13eea3f92ce4a129ab6b02a58ff51707`
— **which independently matches the hash the executor's notes cite.**
Baseline in that worktree: **43 passed, exit 0.**

**A FIRST DRILL RUN WAS DISCARDED AND IS REPORTED.** My initial worktree
had no `app/node_modules`, so `playwright.config.ts`'s
`assertLanePreconditions` threw and every mutant "failed" at exit 1 with
**zero bodies run** — a harness failure wearing a kill, the mirror of
CONVENTIONS' "an exit 0 over zero bodies". Caught by reading the count
rather than the code; the table below is the re-run after installing
`app/`.

| mutant | one-side change | exit | bodies RED |
|---|---|---|---|
| `ALLOWALL` | `if (before.line === after.line)` → `if (true)` | 1 | **5** — 1031, 1083, 1149, 1235, 1269 (38 passed) |
| `INVERT` | `===` → `!==` | 1 | the SAME 5 (38 passed) |
| `REFUSEALL` (M10) | `amended.moved.length > 0` → `>= 0`, lane arm | 1 | **13**, incl. `T-212`'s own positive control (30 passed) |
| `NARROW_OWN_CARD` (M6) | `range.paths` → filtered to `card.file` | 1 | **1** — the SIBLING body alone (42 passed) |
| `SKIP_UNRESOLVABLE` | `range.paths` → `[]` when the fence is unusable | 1 | **1** — the seventh body alone (42 passed) |
| `MERGE_RECORD_AT_PUSHED_TIP` (M1) | merge arm `first` → `"HEAD"` | 1 | **1** — THE MERGE MOMENT (42 passed) |
| `EXONERATION_DELETED` | the third-read condition → `if (false)` | 1 | **1** — THE THIRD DELIVERY (42 passed) |
| `ABSENT_AS_MOVE` (M9's mirror) | `if ("absent" in before) continue;` → `if (false) continue;` | 1 | **2** — 1031 and 1213 (41 passed) |

**Kill-set containment, judged over BODIES.** 1083 {ALLOWALL, INVERT,
NARROW} and 1031 {ALLOWALL, INVERT, REFUSEALL, ABSENT_AS_MOVE}: neither
contains the other. 1269 and 1031: neither contains the other
(MERGE_RECORD vs REFUSEALL). 1235 and 1149: neither contains the other
(SKIP_UNRESOLVABLE vs EXONERATION_DELETED). 1213 {REFUSEALL,
ABSENT_AS_MOVE} and 1149: neither contains the other — **and I planted
`ABSENT_AS_MOVE` for exactly that reason**, because against my first
seven mutants 1213's kill set WAS contained in 1149's and it would have
been wrong to call it a restatement on the strength of my own aim.
**One containment stands and I state it rather than smooth it:** 1105
(the fast-path-A grant, cut and merged-down) kills only `REFUSEALL` among
my eight, so its kill set is contained in 1149's; separating it needs a
mutant aimed at the merge-base endpoint, which I did not build. That is a
limit of my drill, not a finding against the body.
`ALLOWALL` and `INVERT` have identical kill sets — the executor's notes
name this and explain it correctly (the inverted operator's distinctive
state, a card whose line did not move while main's copy disagrees, is
reached by no fixture because the lane never writes the card there).

**THE POSITIVE CONTROL IS DEMONSTRATED FAILING IN BOTH DIRECTIONS, AT
ASSERTION LEVEL** — the arming the rule demands, shown where it differs:

- `REFUSEALL` (refuse every changed card) reds body 1031 at **line 1071**,
  the ALLOW half: *"an ordinary write to a lane's own card was refused"*.
  The refusal half (line 1041) still passes. **M10 reds the control and
  NOT the subject.**
- `ALLOWALL` reds the SAME body at **line 1041**, the REFUSE half:
  *"a `touches:` amendment landed"*. The allow half still passes.
  **The allow-all mutant reds the subject and NOT the control.**

### The suites — every exit from `$?` unpiped, at the tip `7cebf35`

| command | cwd | exit | count |
|---|---|---|---|
| `npx playwright test tests/landing-gate.spec.ts` | tools/e2e | **0** | **43 passed** (36 at `dfe35a5`, re-derived: `grep -cE '^test\("'`) |
| `gate-run.mjs parser` | bench root | **0** | **377** bodies, GREEN, ref `7cebf35` |
| `gate-run.mjs app` | bench root | **0** | **1163** bodies, GREEN |
| `gate-run.mjs rust` | bench root | **0** | **639** bodies, 18 targets, GREEN |
| `gate-run.mjs e2e` (`SUPERTASKR_E2E_PORT=25224`) | bench root | **0** | **697** bodies, GREEN |
| `npm run lint:tokens -- --selftest` | tools/e2e | **0** | 65 TOKEN + 4 CONTROL, 90 walk-policy, 9 evidence-floor |
| `npm run lint:tokens` | tools/e2e | **0** | TOKEN 177 files, CONTROL 1275 tracked text files |
| `npm run lint:docs` | tools/e2e | **0** | whole-tree half, 0 findings |
| `npm run typecheck` | tools/e2e | **0** | — |
| `npm run capabilities:check` | tools/e2e | **1** | **STALE, EXPECTED** — committed 58883, fresh 59555; seven bodies added. **The integrator regenerates at the merge** (`npm run capabilities`, in the merge commit). |
| `index --check --root ../..` | app/src-tauri | **0** | **CURRENT** — 201 files, 2542 symbols, 2441 edges. Every changed path (`.claude/hooks/*.mjs`, `docs/tasks/*.md`, `tools/e2e/tests/*.ts`) is outside what the indexer reads; confirmed rather than assumed. |

The records guard in `identifier-rename.spec.ts` is **GREEN**, inside the
697-body e2e leg — no renames in this lane.

### Dogfood — the new arm over two live ranges

Read-only, driving `touchesAmendments` with the integration ref `main`
(`98d3ef5`) as the record.

    ── T-224 (THIS lane)   dfe35a5..7cebf35   7 paths, 5 cards
         T-212's card, T-224's card, T-224-s1, -s2, -s3
       RESULT: ALLOWED — no card's `touches:` line differs from main's copy

    ── T-265 (the live sibling lane, read-only)  15619b4..3589e0f
       45 paths, 3 cards: T-265, T-265-s1, T-265-s2
       RESULT: ALLOWED — no card's `touches:` line differs from main's copy

T-224's own card was amended on main at `6f1622e` and the same line was
delivered to the lane's copy; T-265's was amended at `5e1b305` and
likewise. **Both are exonerated by the third read, which is the arm's
central claim, dogfooded on the two ranges that actually exist.** A
refusal of either would have been falsifier 1; neither refuses.

### Security sweep

No dependency added (no `package.json`, lockfile or `Cargo.toml` in the
diff). No new import, no `fetch`, no new process spawn. No secret, key or
token. No `continue-on-error`, no `--no-verify`, no widened allow: the
two added `return allow(...)` sites are the announced cannot-compare
arms, and the amendment check runs BEFORE them, which I verified by
mutation (`SKIP_UNRESOLVABLE` reds a body). No new input path and no
endpoint. `AMENDMENT_ROUTE` is a constant string, interpolated with a
card path and two frontmatter lines that git already vouches for.

### Architecture and adjacent features

The arm adds no interface: two exported functions and a constant beside
the existing ones, the same `{verdict, code, reason}` shape, the same two
call sites in `push-guard.mjs`, unchanged. `frontmatterLineOf` is reused
rather than re-implemented — `lane-fence.spec.ts` still drives the three
callers over every live card, green in the e2e leg. `docs/tasks` remains
unfenceable: `judgePaths` is untouched, and my A1.8/A1.9 fixtures confirm
ordinary card writes still land.

### Assigned corrections

1. **Resolve a card by its id when the path is absent** (the failure
   above), with the two bodies named there, and correct limit 5(a)'s
   justification plus `T-212`'s section, both of which currently imply a
   coverage the arm does not have.

Everything else in this diff stands. The arm is well-aimed, the
exoneration is right and is the thing the executor correctly named as its
least-confident point, and the ordering argument against pre-empting
`T-212`'s two bodies is sound. **The rejection is one branch of one
function, and the contract already told it what to do.**

### Filed, not blocking

- `T-224-s4` — a non-merge commit on the integration branch is never
  asked the `touches:` question (attack A1.11); the allow is correct, the
  silence is not.

### This verdict's own tip — step 7

**Prose is a code input here, so the two writes this verdict makes are
re-gated rather than assumed harmless.** Measured with this verdict and
`T-224-s4` present in the tree, i.e. AT THE VERDICT COMMIT and not at
`7cebf35`:

| gate | cwd | exit | count |
|---|---|---|---|
| `docs-gate.mjs <my 2 literal paths>` | bench root | **1** | FIRES correctly — 2 docs paths, owing the three suites below. *"every live task card's frontmatter parses, with a legal status"*, so `T-224-s4` is a legal card and the board still reads. |
| `npx vitest run` | lib/parser | **0** | **377 passed**, 16 files |
| `npm test` | app | **0** | **1163 passed**, 51 files |
| `npm test` (`SUPERTASKR_E2E_PORT=25224`) | tools/e2e | **0** | **697 passed** |

The docs gate's injection scan flagged one phrase of **my own** prose in
both files (`J3`, "…as the sanctioned…"); it is ADVISORY and moves no
exit, but I reworded both rather than leave a false positive for the next
reader, and re-ran the scan to **0 hits in 0 of 2 paths**.

`npm run capabilities:check` stays at **1/STALE** and is NOT mine to fix:
the staleness is the lane's seven new spec names, and the census is
regenerated by the integrator in the merge commit. `index --check`
remains **CURRENT** — a prose commit moves no code-derived graph.

---

2026-09-08 — `claude-opus-5@subagent (phase 2, re-verification after REJECTED dde56da)`
(verifier, BLIND TWO-PHASE, `review: independent`)

VERDICT: REJECTED

attack set: sha256:a07bde3b4f8e391e2a180477438c738224d16ea19b5b0216079fc6666e5d3496 (attack-set-T-224.md)
ground truths: sha256:aae9491f1447ca547dd1396e4d87177efaed30d5b65b4d7e0b1f19953dce6977 (ground-T-224.md)

previous verdict `dde56da` (REJECTED) · tip `4a9f278` · base `dfe35a5` ·
amended-contract ref `6f1622e` · bench `../nputer-V-T-224`, detached ·
`SUPERTASKR_E2E_PORT=25224` · integration ref `main` at `329adfe`.

**THE FRAME I ACTUALLY HAD.** Phase 2, a FRESH spawn WITH tools — the
re-entry shape orchestrator 5d prescribes for a rejection. Both digests
verified with `shasum -a 256` BEFORE either file was opened; both matched.
The reading order was kept: `method/roles/verifier.md` in full, the card at
`dfe35a5`, the AMENDED card on main at `6f1622e`, the sealed attack set with
its dispatcher annotations, the ground truths, the previous verdict as
committed at `dde56da`, STATE/ARCHITECTURE/CONVENTIONS at the tip, and ONLY
THEN the diff. The commit list was taken with `git rev-list dde56da..4a9f278`
(`4a9f278`, `bd60cba` — hashes only, no subjects); the bench was moved with
`checkout --quiet --detach`. The card's `### Rework` notes were opened only
AFTER my own attack driver had run, and every claim in them was re-derived
here. **Phase 1's no-tool property is a self-report, not a guarantee** — this
harness cannot deny a subagent tools; the set states `tool calls made: 0` and
I record that as its claim, not as something I can check. **My brief's duties
section named executor-derived specifics** (43→48, "five new bodies", the
pristine hash, "the executor names C and D2 as sharing {1481}"), so phase 1
was above the line for those figures and I say so rather than pretend
otherwise; each was re-derived independently before comparison, and the
brief's own hypothesis about one of them turned out FALSE (below).

**THE SPOILED GROUND TRUTHS, RE-TAKEN AT THE BASE.** GT-4, GT-7, GT-8 and
GT-10 carry `fatal: ambiguous argument` where a zsh `:t` modifier ate the
path (`dfe35a5ools/e2e/...`). I re-derived all four at `dfe35a5` before
opening the diff — **and the same modifier bit my first attempt**, which is
worth recording as the mechanism rather than the accident: `$R:tools/...`
must be written `${R}:tools/...`. Re-derived: GT-4 = **36** bodies in
`landing-gate.spec.ts` (`grep -cE '^test\("'`; a 37th `test("Bash")` hit is a
regex inside the settings body, not a body); GT-10 = **550** entries directly
under `docs/tasks/` and **594** recursively, the difference being
`docs/tasks/rejected/`; GT-7 = the exit contract is `push-guard-hook.mjs`:
**block → reason on stderr, `process.exit(2)`**; an announced allow → stderr
at **exit 0**; there is no exit 3. GT-8 = `UNFENCEABLE_PATHS` is
`Object.freeze(['docs/tasks'])` at `lib/parser/src/fence.ts:66`, EXACT
equality on the normalised token. GT-1/2/3/5/6/9/11/12/13 were intact and are
used as sealed.

---

### THE FAILURE: A SECOND FILE CARRYING THE SAME CARD ID SUPPRESSES THE REAL CARD'S WIDENING — SILENTLY, AT BOTH LANDING MOMENTS

**This is a REGRESSION the rework introduced. `dde56da` — the commit this
verdict's predecessor rejected — REFUSES the very push `4a9f278` allows.**

`touchesAmendments` now keys its loop on the card id and skips an id it has
already seen (`landing-gate.mjs:954–955`), while `cardTouchesOf` resolves
**the path first and the id only where the path answered `absent`**
(`:860–864`). Those two decisions compose into a hole neither has alone: the
pair of endpoints a card is judged on can straddle **two different files**,
and the first path in the range carrying an id decides the answer for the id.

    for (const rel of paths) {
      const named = CARD_FILE_RE.exec(rel);      // :951
      if (named === null) continue;
      const id = named[1];
      if (seen.has(id)) continue;                // :954  ← the real card is skipped
      seen.add(id);
      const before = cardTouchesOf(root, base, id, rel, index, git);
      ...
      if (before.line === after.line) continue;  // :962  ← two DIFFERENT files compared equal

Plant one extra file under `docs/tasks/` that carries the target card's id,
sorts before the card in the range's path list, and repeats the card's
CURRENT `touches:` line. At the base that path is absent, so the id index
resolves it to the real card and yields the OLD line. At the tip that path is
present, so the direct `git show` short-circuits the index and yields the
DECOY's line — the same string. `before.line === after.line`, `continue`, and
`seen` now holds the id, so the real card's own path is never examined at all.
The widening is not announced, not a cannot-compare, not `unjudged`: it is an
ordinary `landing-gate-inside-the-fence` allow.

**REPRODUCTION** — `attacks2-V-T-224.mjs`, my own fixtures in a throwaway git
repo, driving the two exported verdict functions. Fence `[tools/e2e]`; the
decoy is a path under `docs/tasks`, which rule 5 makes unfenceable, so the
containment arm has nothing to say about it.

    (a) THE LANE'S OWN CARD — widen in place + plant `T-901--decoy.md`
        paths: ["docs/tasks/T-901--decoy.md",
                "docs/tasks/T-901-a-fixture-card.md", "tools/e2e/w.txt"]
        LANE MOMENT   ALLOW  landing-gate-inside-the-fence
        MERGE MOMENT  ALLOW  landing-gate-merges-inside-the-fence
        the card's line on main after the merge:
            touches: [tools/e2e, app/, .claude/]     (it was [tools/e2e])

    (b) A SIBLING'S CARD — lane T-901 widens T-900's fence
        LANE MOMENT   ALLOW  landing-gate-inside-the-fence
        MERGE MOMENT  ALLOW  landing-gate-merges-inside-the-fence
        T-900's line on main after the merge:
            touches: [method/, .claude/, lib/, tools/]   (it was [method/])

    (c) THE CONTROL, same fixture builder, the ONLY difference being the
        decoy: the same widening with no decoy
        LANE MOMENT   BLOCK  landing-gate-touches-amended

(b) is **falsifier 2 of the sealed set** — *"a sibling-card amendment
admitted"* — and it is the card's own headline consequence, *"lane A can
widen lane B's fence."* (c) is the arming: the arrangement that decides the
subject is ABSENT there and the arm refuses, so the allow in (a)/(b) is the
decoy's doing and not a fixture that never reached the verdict.

**THE REGRESSION, MEASURED.** The same driver against the gate as it stood at
`dde56da` (file sha256 `093970bd7992dc97c467a6bc5a76594f13eea3f92ce4a129ab6b02a58ff51707`,
which independently matches the hash the previous verdict cites), restored
afterwards and re-verified against the pristine
`2edf98f91f1a5b3a2206ebd0e78ebdf0600101e455cb4bfce13861f308f8e1b5`:

    (a) LANE MOMENT   BLOCK  landing-gate-touches-amended
        MERGE MOMENT  BLOCK  landing-gate-merge-touches-amended
    (b) LANE MOMENT   BLOCK  landing-gate-touches-amended

At `dde56da` the loop was keyed on the path with no dedupe, so the decoy hit
`absent` at the base and was skipped and the real card was still judged. **The
`seen` set added by this rework is what closes that door**, and body 1481 —
which asserts `"1 card(s)"` — is what asked for it.

**AND THE WIDENING CAN BE MADE THE UNAMBIGUOUS CARD OF RECORD**
(`cleanup-V-T-224.mjs`), which is what settles this at REJECTED rather than a
routed residue. The obvious objection is that the decoy leaves two files
under one id on main, so `cardAt` answers `problem` and the victim's next
push is refused whole — a DENIAL, the argument limit 5(b) already makes. It
does not hold: three pushes, three merges, **every one of them allowed**, end
with one file and a widened fence.

    push 1: widen T-900 in place + plant a decoy sorting first, OLD line
       LANE ALLOW landing-gate-inside-the-fence · MERGE ALLOW landing-gate-merges-inside-the-fence
       main: T-900--decoy.md, T-900-another-card.md
    push 2: swap that decoy for one sorting EARLIER carrying the WIDE line
       LANE ALLOW landing-gate-cannot-compare · MERGE ALLOW landing-gate-cannot-compare
       (the ambiguity residue (f) — the fail-open shape, ridden deliberately)
       main: T-900---decoy2.md, T-900-another-card.md
    push 3: delete the last decoy — before and after now agree, nothing judged
       LANE ALLOW landing-gate-inside-the-fence · MERGE ALLOW landing-gate-merges-inside-the-fence
       main: T-900-another-card.md — ALONE

    FINAL: cardAt(main, ['T-900']) = {"id":"T-900","file":"docs/tasks/T-900-another-card.md"}
           touches: [method/, .claude/, lib/, tools/, app/]   (it began as [method/])

**AND THE PUSH REALLY HAPPENS — DRIVEN THROUGH THE REAL HOOK, NOT THE
EXPORTED FUNCTION.** A control I propose is mine to check, so I wrote
proposed body (i) below into a COPY of the spec in my scratch worktree, using
the spec's own `fixture`/`writeCard`/`pushThroughGuard` helpers — which mint
the gate token and run `.claude/settings.json`'s actual `PreToolUse` command
over a real `git push` — and ran it against `4a9f278`:

    1) PROPOSED: a same-id file that does not move cannot suppress the real
       card's widening
       Error: a same-id decoy suppressed the real card's widening
         > expect(refusal.refused, ...).toBe(true)
    1 failed, 1 passed          exit 1

The **passing** one is the control, proposed body (ii): *"an ordinary range
changing TWO cards' bodies still lands"* — so the body that reds is not a
guard that refuses any range touching two card paths, and the failure is the
decoy's. The spec copy was restored (`git status` clean on that path). **The
push was not refused at the hook, which is the whole claim.**

**AND THE DECOY TRIPS NOTHING ELSE**, which is the condition my brief set
for REJECTED-level. I planted a real one — a copy of `T-224`'s own
frontmatter as `docs/tasks/T-224--decoy.md`, same id, same `touches:` line,
sorting first — into a live checkout and asked the gates that read the board:

    node tools/e2e/scripts/push-checks.mjs --root <worktree>
      push-checks: clean            exit 0
    landing-gate.spec.ts, the three LIVE-BOARD bodies (464, 480, 497)
      3 passed                      exit 0

`runChecks` is `danglingBlockers + placementGaps + staleState` and carries no
duplicate-id rule; body 464 compares each card's FILENAME id against its
FRONTMATTER id and a decoy declaring the same id agrees with itself. So the
four-suite battery stays green, the push token mints, and nothing between the
lane and `main` objects. (The decoy was removed; the worktree's only residue
is an `npm install`-touched `app/package-lock.json` in my throwaway worktree.)

**Four things make this REJECTED and not a routed finding.** It is a
REGRESSION — the predecessor commit refuses what this one allows. It defeats
the amended contract in the same words the closed finding did: *"a card id
present on main under another path is resolved by id, not path"* — here the
id resolves to one file at the base and a different file at the tip and
nothing notices. **The suite is GREEN while the hole is live** — baseline 48
passed, exit 0, in my own worktree — which is precisely *"a guard trusted
further than it measures."* And it is undisclosed: limit 5's residues (a)–(f)
name a genuinely new id, a deletion, an already-refused range, an unexpandable
fence, limit 6, and the cannot-compare — none of them is this. The header
newly asserts the opposite in bold: *"EVERY ENDPOINT IS RESOLVED BY THE
CARD'S ID, NOT BY ITS PATH."* It is not; the id only selects a file where the
path failed.

**THE CORRECTION, NAMED PRECISELY.**

1. **Resolve BOTH endpoints of an id from the per-revision index, not from
   the path the diff named.** The diff's path may serve as a fast path only
   where the index at that revision maps the id to exactly that one path;
   otherwise the index is authoritative at both ends. Then a same-id file
   cannot stand in for the real card at either endpoint, and the existing
   `seen` dedupe keeps its one job.
2. **A duplicate id CREATED BY THE JUDGED RANGE must not be a cannot-compare
   ALLOW.** It is mechanically decidable — `index(base).byId[id].length <= 1
   && index(tip).byId[id].length > 1` — and it is the lane's own act inside
   the range being judged, so refusing it is not the "a gate that cannot
   verify does not answer safe" case but the ordinary one. Push 2 above rides
   the current allow; residue (f) should then say a duplicate a lane ARRIVES
   at is announced while a duplicate a lane MAKES is refused.
3. **Three bodies are owed, paired inside one fixture as the five new ones
   already are:** (i) a same-id file added by the range, sorting first,
   carrying the unmoved line, while the real card's line moves — REFUSED at
   BOTH moments, the lane's own card and a sibling's; (ii) the same range
   with the decoy's line ALSO moved, so the fix cannot be "refuse any range
   whose id maps to two paths at the tip" while the ordinary two-cards-changed
   range stays ALLOWED; (iii) a duplicate id created by the range — refused,
   not announced. And limit 5 owes the residue restated once more, since the
   header's "every endpoint is resolved by the card's id" is currently
   stronger than the code. **(i) and (ii) are not proposed on trust: both
   were written and RUN against `4a9f278` above — (i) reds through the real
   hook, (ii) passes — which is the demonstration verifier.md 2b requires of
   a control the verifier proposes. (iii) is proposed unrun and I say so.**

---

### THE REST OF THE PREVIOUS VERDICT — WHAT CARRIES, RE-MEASURED AT THIS TIP

The gate file changed, so everything the diff could move was re-run rather
than carried on the predecessor's word.

| item | result at `4a9f278` | evidence |
|---|---|---|
| **A1.1** T-264's real fast-path-A shape (GT-9): unsynced lane, grant in its working copy, main's line EQUAL | **ALLOWED** ✓ | `allow/landing-gate-inside-the-fence`. Falsifier 1 not tripped. |
| **A1.2** the laundering — two merges in ONE push, widening inside merge 1 | **REFUSED, merge 1 NAMED** ✓ | `block/landing-gate-merge-touches-amended`; merge 1 `fec6711` named, the pushed tip NOT named. The record is `M^1` per merge, never the pushed tip. |
| raw-byte comparison | ✓ | no split/sort/parse on the compared values; the reorder, quoted-entry and trailing-comma payloads all refuse |
| **the seventh body** (an unresolvable fence is still ASKED) | ✓ | the arm still sits between the containment block and the cannot-compare allow; the ordering code is untouched by the rework diff |
| **A1.10** both call sites | ✓ | `push-guard.mjs:3086` lane, `:3094` merge — exactly two, and `git diff dfe35a5..4a9f278 -- .claude/hooks/push-guard.mjs` is EMPTY |
| **exit contract** | ✓ | `push-guard-hook.mjs:76–78` block → stderr + `exit(2)`; announced allow → stderr at `exit(0)`. No catch-and-allow; the two `problem` paths reach the announced allow, not a swallow. **The X1 failure is worse than a fail-open cannot-compare: it is an ordinary, unannounced allow.** |
| **the record** (falsifier 4) | ✓ | `git diff dfe35a5..4a9f278 -- 'docs/tasks/T-212-*.md' \| grep -cE '^-[^-]'` = **0** — the whole lane's effect on `T-212` is a pure addition. The six `-` lines in the rework diff are inside the paragraph THIS LANE added at `dde56da`, corrected in place. |
| **spawn count** | ✓ **re-counted with a git injected through the function's own last parameter** | ORDINARY push (1 card, line unmoved): **2** spawns, `show <base>:<card>` + `show HEAD:<card>` — identical to the pre-rework figure, so the id path costs the ordinary push nothing. Renaming push, **2 cards renamed**: **9** spawns and exactly **ONE** `ls-tree --name-only -z HEAD -- docs/tasks/` for the whole range. The memoisation is real and is per revision, not per card. |
| **rename ordering — the brief's open question** | ✓ **BOTH orderings refuse** | I built the case the rework's mutant B does not reach: renaming to a slug that sorts BEFORE the old name (`T-901-AAA-earlier-slug.md`) as well as after (`T-901-zzz-later-slug.md`). Both → `block/landing-gate-touches-amended`, both naming both paths and `RESOLVED BY ITS ID T-901`. The executor's account of B — that it is half of the evasion, keyed on which title sorts first — is correct and does not describe a gap in the arm. |
| **the closed finding** | ✓ closed | rename+widen own card REFUSED at both moments; sibling rename+widen REFUSED at both; PURE rename ALLOWED; delete-and-re-add wider REFUSED; a genuinely new id ALLOWED; `T-902` vs `T-902-s1` not confused, exactly one card reported. All re-derived in my own fixtures, not the lane's. |
| **the dogfood** | ✓ both ALLOW | below |
| **census** | STALE, expected | below |

**THE BRIEF'S OWN HYPOTHESIS, TESTED AND FALSE.** I was pointed at "the id map
built from `git ls-tree -r` (recursive — rejected/ leaks in)". It does not.
`CARD_FILE_RE`'s `[^/]*` cannot cross a slash, so no path below
`docs/tasks/` can match however deep the listing goes. Mutant
`RECURSIVE_LS_TREE` came back **48 passed, exit 0** — a deliberate survivor,
and the executor's stated reason for not recursing (cost, not correctness) is
the true one. What IS load-bearing and undocumented is the **trailing slash**:
`git ls-tree --name-only <rev> -- docs/tasks` lists the TREE ENTRY, not its
contents. Mutant `NO_TRAILING_SLASH` reds all five new bodies.

**THE ID MAP CANNOT BE POISONED BY A CRAFTED FILENAME**, measured against
`CARD_FILE_RE` directly: `docs/tasks/T-999-about-T-901-widening.md` → id
`T-999` (the capture is anchored at the start, so an id embedded in a slug
claims nothing); `docs/tasks/rejected/T-901-x.md` → no match;
`docs/tasks/T-901-s1-…` → `T-901-s1`, never `T-901`. A card renamed to a bare
`docs/tasks/T-901.md` matches nothing and so is invisible to this arm — but
it is equally invisible to `cardAt`, so that lane's next push is refused
whole; that is limit 5(b)'s DENIAL argument and it holds.

### The falsifiers

1. **a legitimate fast-path-A grant refused** — **NO.** The T-264 replay and
   both dogfood ranges are allowed.
2. **a sibling-card amendment admitted** — **YES.** The rejection above,
   silently and at both landing moments.
3. **a positive control that cannot fail** — **NO** for the five new bodies:
   I read all five and each pairs a refusal with an allow inside ONE fixture,
   and mutants `NO_ID_LOOKUP` / `ONLY_SUFFIX_IDS_INDEXED` red their refusal
   halves here. **I did NOT re-run the rework's `E`/`G`/`H` assertion-level
   arming table and I say so rather than carry it**; what I demonstrate myself
   is my own control (c), which refuses where the decoy is absent, and my
   proposed body (i), which reds through the real hook while its control (ii)
   passes.
4. **a record rewritten** — **NO.** Zero `-` lines against `dfe35a5` in
   `T-212`'s card.
5. **fail-open** — **PARTLY.** The announced cannot-compare on ambiguity is
   the fail-open shape, and push 2 of my construction rides it deliberately;
   it is folded into correction 2 rather than filed separately.
6. **a tautological expectation** — **NO.** Every new expectation is a typed
   literal; body 1332 asserts its own rename precondition from
   `git diff --no-renames`, so a fixture that stopped reproducing a rename
   would red rather than pass vacuously.

### The drill — my own detached scratch worktree `../V2-T-224-mutants`

`git worktree add --quiet --detach 4a9f278`, its OWN `npm ci` for
`lib/parser` (+ build), `npm install` for `app/`, `npm ci` for `tools/e2e`
(the executor had removed `nputer-D-T-224`; the previous verdict's harness
failure was a missing `app/node_modules`, so it was installed and the
baseline read before any mutant). **BASELINE: 48 passed, exit 0** — the count
read, not only the exit. Every landing read back from `git diff -U0` BEFORE
the suite ran; every restoration proved by sha256 against the pristine
`2edf98f91f1a5b3a2206ebd0e78ebdf0600101e455cb4bfce13861f308f8e1b5`, which I
verified against `git show 4a9f278:.claude/hooks/landing-gate.mjs | shasum -a 256`.
Every restoration matched.

| mutant | one-side change | exit | bodies RED |
|---|---|---|---|
| `NO_ID_LOOKUP` (the verifier's exact evasion) | `listed.byId.get(id) ?? []` → `[]` | 1 | **5** — 1332, 1382, 1403, 1443, 1481 (43 passed) |
| `NO_TRAILING_SLASH` (mine, not the executor's) | `-- docs/tasks/` → `-- docs/tasks` | 1 | the SAME 5 (43 passed) |
| `RECURSIVE_LS_TREE` (mine) | `ls-tree` → `ls-tree -r` | **0** | **NONE — SURVIVES**, correctly |
| `DEDUPE_BY_PATH` (mine) | `seen.has(id)/add(id)` → `seen.has(rel)/add(rel)` | 1 | **1** — 1481 alone (47 passed) |
| `SEEN_REMOVED` | `if (seen.has(id)) continue; seen.add(id);` → `if (false) continue;` | 1 | **1** — 1481 alone (47 passed) |
| `AMBIGUITY_PICKS_FIRST` (mine) | `if (paths.length > 1) {` → `if (false) {` | **0** | **NONE — SURVIVES** |
| `ONLY_SUFFIX_IDS_INDEXED` (mine, planted to break a containment) | `+ if (!id.includes("-s")) continue;` in the index | 1 | **4** — 1332, 1382, 1403, 1443, and NOT 1481 (44 passed) |

**KILL-SET CONTAINMENT, judged over BODIES and against BOTH tables.** The
rework's own table states C and D2 share `{1481}`; my `DEDUPE_BY_PATH` and
`SEEN_REMOVED` reproduce that independently, and it is honest — 1481 is the
sole owner of both properties, separated inside it at ASSERTION level. **The
containment the rework left standing is the one I resolved.** Over the
rework's seven mutants 1332's kill set `{A, B2, E, F, G}` is contained in
1481's `{A, B2, C, D2, E, F, G}`, which would have made 1332 a restatement;
`ONLY_SUFFIX_IDS_INDEXED` kills 1332 and NOT 1481, and `DEDUPE_BY_PATH` kills
1481 and NOT 1332, so **neither contains the other and both are
load-bearing.** I planted that mutant for exactly that reason rather than
report a containment I had not tried to break.

**AND ONE SURVIVOR IS A FINDING'S NEIGHBOUR, NOT A CURIOSITY.**
`AMBIGUITY_PICKS_FIRST` silently picks `paths[0]` where two files carry one
id, and **no body among the 48 notices** — so residue (f), which this rework
newly wrote into limit 5, is asserted and measured by nothing. That branch is
the one push 2 of my construction rides. It belongs to correction 2.

### The suites — every exit from `$?` unpiped, at the tip `4a9f278`

| command | cwd | exit | count |
|---|---|---|---|
| `npx playwright test tests/landing-gate.spec.ts` | `../V2-T-224-mutants/tools/e2e` | **0** | **48 passed** (43 at `dde56da`, 36 at `dfe35a5`; re-derived with `grep -cE '^test\("'`) |
| `npx playwright test -g "PROPOSED"` (my two proposed bodies, appended to a COPY of the spec, then restored) | `../V2-T-224-mutants/tools/e2e` | **1** | **1 failed, 1 passed** — the DEMONSTRATION: (i) reds through the real hook, (ii) the control passes |
| `npx playwright test tests/push-checks.spec.ts` | `../V2-T-224-mutants/tools/e2e` | **0** | **11 passed** — named by the brief because the gate file changed; the live board still passes every cheap check |
| `gate-run.mjs parser` | bench root | **0** | **377** bodies, 1 target, GREEN, ref `4a9f278` |
| `gate-run.mjs app` | bench root | **0** | **1163** bodies, 1 target, GREEN, ref `4a9f278` |
| `gate-run.mjs rust` | bench root | **0** | **639** bodies, 18 targets, GREEN, ref `4a9f278` |
| `gate-run.mjs e2e` (`SUPERTASKR_E2E_PORT=25224`) | bench root | **0** | **702** bodies, 1 target, GREEN, ref `4a9f278` |
| `npm run lint:tokens -- --selftest` | tools/e2e | **0** | 65 TOKEN + 4 CONTROL samples, 90 walk-policy, 9 evidence-floor |
| `npm run lint:tokens` | tools/e2e | **0** | TOKEN 177 files, CONTROL 1276 tracked text files |
| `npm run lint:docs` | tools/e2e | **0** | whole-tree half, 0 findings |
| `npm run typecheck` | tools/e2e | **0** | — |
| `npm run capabilities:check` | tools/e2e | **1** | **STALE, EXPECTED** — committed 58883 bytes, fresh 60034; five bodies added. **THE INTEGRATOR REGENERATES** (`npm run capabilities` from tools/e2e, in the merge commit). |
| `cargo run -q -p supertaskr-index -- index --check --root ../..` | app/src-tauri | **0** | **CURRENT** — 201 files, 2542 symbols, 2441 edges, 1191343 bytes |

### Dogfood — the reworked arm over two live ranges, read-only

`dogfood-V-T-224.mjs`, driving `touchesAmendments` with the integration ref
`main` (`329adfe`) as the record. Nothing written; T-265's range was read
from the bench's own object store and its worktree was not touched.

    ── T-224 (THIS lane)   dfe35a5..4a9f278
         merge-base dfe35a5, 8 paths, 6 card ids:
         T-212, T-224, T-224-s1, T-224-s2, T-224-s3, T-224-s4
       RESULT: ALLOWED — no card's `touches:` line differs from main's copy

    ── T-265 (the live sibling lane, READ-ONLY)  15619b4..3589e0f
         merge-base 15619b4, 45 paths, 3 card ids: T-265, T-265-s1, T-265-s2
       RESULT: ALLOWED — no card's `touches:` line differs from main's copy

Both ALLOW, which is what the rework owed: id resolution turned neither live
range into a refusal. Note the record moved — the previous verdict measured
against `main` at `98d3ef5`, this one at `329adfe`.

### Security sweep

No dependency added (no `package.json`, lockfile or `Cargo.toml` in the
rework diff). No new import, no `fetch`, no `child_process`, no `eval`. No
secret, key or token. No `--no-verify`, no `continue-on-error`. **No new
`allow(` site** — `git diff dde56da..4a9f278 -- .claude/hooks/landing-gate.mjs
| grep '^+.*return allow('` is empty; the two `problem` paths land on the
cannot-compare arms that already existed. The one new git invocation is an
argv ARRAY (`["ls-tree", "--name-only", "-z", rev, "--", "docs/tasks/"]`), no
shell, and `rev` is a revision this gate resolved itself — no injection
point. The id map is not poisonable by a crafted filename (measured above).
No new input path, no endpoint, no authz surface. **The one security-shaped
finding in this diff is the failure above**, and it is filed as the
rejection rather than here.

### Architecture and adjacent features

No interface added: two exported functions and a widened `TouchesMove`
typedef beside the existing ones, the same `{verdict, code, reason}` shape,
`push-guard.mjs` byte-identical to `dfe35a5`. `judgePaths` untouched and
`docs/tasks` still unfenceable. `amendmentReport` annotates a path only where
it differs from the first line, so every pre-existing assertion reads as
before — confirmed by the 43 unchanged bodies staying green.

### A NOTE FOR THE INTEGRATOR, NOT A FINDING

`T-224-s5`'s sibling `T-224-s4` asks for *"a sixth entry under limit 5 —
`(f)`"* for the direct non-merge commit. This rework has now spent `(f)` on
the id resolution's cannot-compare, so `s4`'s build instruction reads for
`(g)` when it is picked up. Worth one word at triage.

### Filed, not blocking

- `T-224-s5` — `cardPathsById`'s COST is measured in prose and pinned by no
  body; mutant `RECURSIVE_LS_TREE` survived the whole suite and the ordinary
  push's two-spawn figure lives only in the card's notes.

### This verdict's own tip — step 7

**PROSE IS A CODE INPUT HERE, so the two writes this verdict makes are
re-gated rather than assumed harmless.** Measured with this verdict and
`T-224-s5` present in the tree — i.e. over the exact content of the verdict
commit, not over `4a9f278`.

| gate | cwd | exit | count |
|---|---|---|---|
| `docs-gate.mjs <my 2 literal paths>` | bench root | **1** | **FIRES correctly** — 2 docs paths under `docs/`, owing the three suites below; **0 frontmatter issue(s) in the live tree**; *"every live task card's frontmatter parses, with a legal status"*, so `T-224-s5` is a legal card and the board still reads; governing-document budgets hold |
| `npx vitest run` | lib/parser | **0** | **377 passed**, 16 files |
| `npm test` | app | **0** | **1163 passed**, 51 files |
| `npm test` (`SUPERTASKR_E2E_PORT=25224`) | tools/e2e | **0** | **702 passed** |

The docs gate's injection scan reports **0 hits in 0 of 2 paths scanned
against 7 patterns** — no rewording was needed, unlike the predecessor's run.

`npm run capabilities:check` stays at **1 / STALE** (58883 committed, 60034
fresh) and is NOT mine to fix: the staleness is the lane's five new spec
names and the census is regenerated by the integrator in the merge commit.
`index --check` remains **CURRENT** at 201 files / 2542 symbols / 2441 edges
— a prose commit moves no code-derived graph, and I asked rather than assumed.

**A FIGURE WITHOUT ITS REF IS WRONG AS SOON AS ANYBODY WRITES AGAIN**, so:
every count in the tables above is at `4a9f278` except this section's, which
is at the verdict commit's own tree; the drill's counts are in
`../V2-T-224-mutants` at `4a9f278`; the dogfood's record is `main` at
`329adfe`.

**HOUSEKEEPING.** My scratch worktree `../V2-T-224-mutants` is detached, is
not a lane, and holds one incidental modification (`app/package-lock.json`,
touched by the `npm install` CONVENTIONS' fresh-clone order prescribes for
`app/`); nothing was written to `/Users/ujju/Projects/nputer`, to the lane
`../nputer-T-224`, or to anything of `T-265`'s. This bench stays detached: no
branch was created or moved.



2026-09-09 — `claude-opus-5@subagent (phase 2, third verification after REJECTED dde56da and 40b22e4)`
(verifier, BLIND TWO-PHASE, `review: independent`)

VERDICT: APPROVED WITH ASSIGNED CORRECTIONS

attack set: sha256:a07bde3b4f8e391e2a180477438c738224d16ea19b5b0216079fc6666e5d3496 (attack-set-T-224.md)
ground truths: sha256:aae9491f1447ca547dd1396e4d87177efaed30d5b65b4d7e0b1f19953dce6977 (ground-T-224.md)

previous verdicts `dde56da` (REJECTED) and `40b22e4` (REJECTED) · tip
`63b9c3d` · base `dfe35a5` · amended-contract ref `6f1622e` · bench
`../nputer-V-T-224`, detached · `SUPERTASKR_E2E_PORT=25224` · integration ref
`main` read at `b825e87`.

**THE FRAME I ACTUALLY HAD.** Phase 2, a FRESH spawn WITH tools. Both digests
verified with `shasum -a 256` BEFORE either file was opened; both matched. The
reading order was kept: `method/roles/verifier.md` in full, the card at
`dfe35a5`, the AMENDED card on main at `6f1622e`, the sealed attack set with
its dispatcher annotations, the ground truths, the two previous verdicts as
committed at `dde56da` and `40b22e4`, STATE/ARCHITECTURE/CONVENTIONS at the
tip, and ONLY THEN the diff. The commit list was taken with
`git rev-list 40b22e4..63b9c3d` (`63b9c3d`, `d0b7910`, `aab21bc` — hashes
only, no subjects); the bench was moved with `checkout --quiet --detach`. The
card's `### Third pass` notes were opened only AFTER my own attack driver,
my own thirteen-mutant drill, my own cost measurement and my own dogfood had
all run, and every claim in them was re-derived here.
**Phase 1's no-tool property is a self-report, not a guarantee** — this
harness cannot deny a subagent tools; the set states `tool calls made: 0` and
I record that as its claim, not as something I can check. **My brief's duties
section named executor-derived specifics** — "48→51", "three bodies at spec
lines ~1561/1635/1675", the pristine hash `5b8522c6…cea35`, "the executor
RETRACTED '2 spawns ordinary' — it is now 4", "a renaming push 5, twenty
renames 62", "62 claimed", the two new block-code names — so **phase 1 was
above the line for those figures and I say so rather than pretend
otherwise**; each was re-derived independently before any comparison, and two
of them came out differently (below).

**THE DELTA RULE (T-272) — WHAT I RE-JUDGED AND WHAT CARRIES.**
*Re-judged by my own re-derivation and my own mutants at the site*: the
closed finding at both landing moments; A1.1, A1.2 and A1.3 (the resolver and
the record both sit in the changed functions); A1.4 and A1.5 (the raw-byte
comparison is inside the changed loop); A1.6, A1.7, A1.8, A1.8b, A1.9 (the
index changed); A1.11, A1.12a, A1.12b, A1.16 (reached through the changed
verdict arms); A1.14 (two NEW block codes); A1.15 (the spawn count, which
MOVED); falsifier 4 over both records; the dogfood over five live ranges; the
security sweep over the third-pass diff.
*Carried by blob hash, unchanged across the WHOLE lane `dfe35a5..63b9c3d`,
never re-run*: `.claude/hooks/push-guard.mjs` `41c8eeabce9b38b3bcb15001caa4d3b86a57c05d`
(A1.10 — exactly two call sites, and the lane arm's block reaches
`process.exit(2)` through code this lane never touched);
`.claude/hooks/push-guard-hook.mjs` `d1c6bab44d9f2c32e1935349ab06092bff8bc397`
(the exit contract: block → reason on stderr + `exit(2)`, announced allow →
stderr at `exit(0)`, and there is no exit 3 — GT-7 re-derived);
`.claude/hooks/lane-fence.mjs` `d61025ad570303a9c29c87cb904919b079de1288`
(A1.13 — `frontmatterLineOf`'s bounding at the closing `---`);
`.claude/settings.json` `50c9d941184b1360532310924040804921d0d4ab` (the
wiring the three new bodies push through); `lib/parser/src/fence.ts`
`3bd2091b27f5ac3e463fd6193910a401bedd5dab` (GT-8 — `UNFENCEABLE_PATHS`).
*Carried by the previous verdicts, cited rather than repeated*: A2.1–A2.4
and A3.1–A3.4 for the AMENDMENT arm, A4.1–A4.3, the seventh body's ordering
and the exoneration — `dde56da` and `40b22e4`, over hook regions the
third-pass diff does not reach.

**THE SPOILED GROUND TRUTHS, RE-TAKEN AT THE BASE — AND THE SAME MODIFIER BIT
ME TWICE.** GT-4, GT-7, GT-8 and GT-10 carry `fatal: ambiguous argument`
where a zsh `:t` modifier ate the path (`dfe35a5ools/e2e/...`). Re-derived at
`dfe35a5` before the diff was opened: **GT-4 = 36** bodies in
`landing-gate.spec.ts` (`grep -cE '^test\("'`); **GT-7** = block → stderr +
`process.exit(2)`, announced allow → stderr at `exit(0)`, no exit 3;
**GT-8** = `UNFENCEABLE_PATHS` is `Object.freeze(['docs/tasks'])` at
`lib/parser/src/fence.ts:66`; **GT-10 = 550** entries directly under
`docs/tasks/` and **594** recursively. GT-1/2/3/5/6/9/11/12/13 were intact and
are used as sealed. **The modifier bit my own shell twice while I worked**
(`$c:tools/...` must be `${c}:tools/...`), which I record as the mechanism
rather than the accident: it is the same failure the sealed file carries.

---

### THE CLOSED FINDING IS CLOSED, RE-DERIVED IN MY OWN FIXTURES

`attacks3-V-T-224.mjs` — my own throwaway repos, driving the two exported
verdict functions, with `refs/remotes/origin/main` pinned at the board so the
MERGE arm has a question to answer. **39 of 39 expectations met.**

| my fixture | LANE moment | MERGE moment |
|---|---|---|
| X1 the decoy on a **SIBLING's** card (widen `T-900`, plant `T-900--decoy.md` repeating the OLD line, decoy sorts FIRST — precondition asserted) | `block/landing-gate-card-id-duplicated` | `block/landing-gate-merge-card-id-duplicated` |
| X1 the same on the lane's **OWN** card | `block/…card-id-duplicated` | `block/…merge-card-id-duplicated` |
| X1b the widening **ALONE**, no decoy | `block/landing-gate-touches-amended`, naming both lines and "fast path A" | — |
| X1c the **ORDINARY two-card range** (two bodies changed, no line moved) | `allow/landing-gate-inside-the-fence` | — |
| X1d the **DUPLICATE ALONE**, nothing widened anywhere | `block/…card-id-duplicated` | — |
| X1e an **INHERITED** duplicate, board made ambiguous by another road | `allow/landing-gate-cannot-compare`, saying *"the ambiguity is the BOARD's"* | — |
| X1e **PUSH 2 of the second verdict's three-push construction** (swap the decoy for one sorting earlier, widen behind it) | `block/…card-id-duplicated` | — |
| X1f **THE RECORD HALF**: an UNSYNCED lane writing the file `main` already carries, its own merge-base lacking it (precondition asserted) | `allow/landing-gate-cannot-compare` | — |

Both endpoints now resolve through the per-revision index — I read the
function rather than the notes: `cardTouchesOf` opens on `index(rev)`, the
three-line `git show <rev>:<the path the diff named>` short-circuit is gone,
and the only blob it will read for an id is `paths[0]`, which IS the diff's
path in the ordinary case. `paths.length > 1` answers `problem` with the list
on a new `duplicate` field, and the caller decides what that MEANS.

**THE WIDENING OF THE VERDICT'S LITERAL FORMULA IS LOAD-BEARING AND IT IS
CORRECT.** The second verdict asked for `index(base)…length <= 1 &&
index(tip)…length > 1`; the executor implemented *a tip path present at
NEITHER the base NOR the record*. I judged the record half on its own, both
ways. It is **not cosmetic**: X1e's push 2 swaps one decoy for another on a
board already ambiguous at the base, where the narrow formula does not fire
at all — and it refuses. And it is **not too weak**: the only way a tip path
reaches `atRecord` is for it to be on the integration branch already, which
no lane reaches through this gate (X1d refuses the act that would put it
there), so the exoneration cannot be manufactured. X1f is the case it buys —
an unsynced lane mirroring `main`'s own file is not charged, which is the
fast-path-A mistake in a second costume. My mutant `RECORD_HALF_REMOVED`
(`new Set([...atBase.at, ...atRecord.at])` → `new Set([...atBase.at])`) reds
body **1675 alone**, and `REFUSE_EVERY_DUPLICATE` (`atTip.at.filter(…)` →
`atTip.at`) reds body **1675 alone** from the opposite side. Both halves are
measured.

---

### THE FINDING — ASSIGNED, NOT BLOCKING: AN INHERITED AMBIGUITY ON ONE ID DISCARDS A REFUSAL ALREADY FOUND FOR ANOTHER

Limit 5(f) as this pass rewrites it, and the loop's own comment, both say the
arm *"stops judging **that id**"*:

> …while the board is ambiguous about which file IS a card this arm stops
> judging that id.

**It stops judging the whole RANGE.** `touchesAmendments` returns
`{ problem }` from inside the loop for an inherited ambiguity, and that return
discards the `moved` and `duplicated` lists it has already built — so a fence
widening the arm HAS ALREADY DETECTED on another card is thrown away, and both
verdict arms answer `landing-gate-cannot-compare`, an announced ALLOW.

**MEASURED, in my own fixtures** (`x3-discard-V-T-224.mjs`; the board is made
ambiguous about `T-990` by a road that is not this gate, before the lane is
cut, so the ambiguity is INHERITED at both the base and the record):

    (a) widen T-900 + write the BODY of one ambiguous file
        allow/landing-gate-cannot-compare — T-900 not named at all
    (b) plant a decoy for T-900, widen it, + the same body write
        allow/landing-gate-cannot-compare — the decoy not named at all
    (c) THE CONTROL, same builder, the ambiguous card left ALONE
        block/landing-gate-card-id-duplicated

(c) is the arming: the arrangement that decides (a) and (b) is ABSENT there
and the arm refuses, so the allow is the inherited ambiguity's doing.

**AND IT IS DEMONSTRATED THROUGH THE REAL HOOK, BECAUSE A CONTROL I PROPOSE
IS MINE TO CHECK** (verifier.md 2b). I wrote the two bodies below into a COPY
of the spec in my scratch worktree, using the spec's own
`fixture`/`writeCard`/`commit`/`pushThroughGuard` helpers — which mint the
gate token and run `.claude/settings.json`'s actual `PreToolUse` command over
a real `git push` — and ran them against `63b9c3d`:

    PROPOSED (V): an ambiguity the range INHERITED on one id does not
                  discard the refusal found for another          FAILED
    PROPOSED (V) CONTROL: the same widening, with the ambiguous card
                  left alone, is refused                         passed
    1 failed, 1 passed   exit 1

The spec copy was restored (`git status` clean on that path). **The push was
not refused at the hook, which is the whole claim.**

**WHY THIS IS AN ASSIGNED CORRECTION AND NOT A THIRD REJECTION.** I weighed
it against the standard the two previous rejections set, and it is materially
weaker on every axis. It is **not lane-reachable through this gate**: the
precondition is a card id carried by two files at the range's base AND on the
fence of record, and arm one of body 1675 (and my X1d) refuse the act that
would create one — what remains is `T-224-s4`'s disclosed route, a direct
non-merge commit on the integration branch, or limit 6, which is strictly
stronger and already disclosed. It **does not exist on the live board**: I
counted card ids by `CARD_FILE_RE` at `main` (`b825e87`), at `63b9c3d` and at
`dfe35a5` — **557 / 554 / 549 ids, 0 duplicated at all three**. The answer is
an **ANNOUNCED** allow with its reason on stderr, not a silent one. And it is
a consequence of executing the correction the previous verdict ASSIGNED —
*"the index is authoritative at both ends"* necessarily surfaces the
ambiguity at both ends, where `40b22e4`'s path-first read returned a line and
never asked. Rejecting the faithful execution of an assigned correction, over
a precondition no lane can reach, would be unjust and terminal.

**THE CORRECTION, NAMED PRECISELY.** Either half closes it, and the first is
better:

1. **Keep the refusals and name the unjudged ids beside them.** Collect the
   inherited-ambiguity ids into a third list instead of returning
   `{ problem }` from inside the loop, return `{ moved, duplicated, unjudged }`,
   and let both verdict arms refuse on `moved`/`duplicated` while ANNOUNCING
   the ids they could not judge. The arm already has the shape — the merge arm
   keeps an `unjudged` array one level up for exactly this.
2. **Or make the words match the code**: limit 5(f) and the loop's comment
   say the arm stops judging **the whole range**, not "that id", and say that
   a refusal already found is discarded with it.

One body is owed either way, and **it is written and run above rather than
proposed on trust**: `PROPOSED (V)` reds through the wired hook at `63b9c3d`
while its control passes.

---

### THE ATTACK SET, RE-JUDGED WHERE THE DIFF COULD MOVE IT

| attack | result at `63b9c3d` | evidence |
|---|---|---|
| **A1.1** T-264's real fast-path-A shape (GT-9): unsynced lane, the grant committed by the lane, `main`'s line EQUAL | **ALLOWED** ✓ | `allow/landing-gate-inside-the-fence`. Falsifier 1 not tripped. |
| **A1.2** THE LAUNDERING — two merges in ONE push, the widening inside merge 1 | **REFUSED, merge 1 NAMED** ✓ | `block/landing-gate-merge-touches-amended`; merge 1's sha printed, the **pushed tip not named**. The record is `M^1` per merge. |
| **A1.3** the per-merge base | ✓ | the same fixture: merge 2's own range does not re-charge merge 1's card, and each merge is judged over `merge-base(first, second)..second` |
| **A1.4** raw-byte comparison — reorder-only, quoted entry, trailing comma | **REFUSED** (3 fixtures) ✓ | `block/landing-gate-touches-amended` each; no split/sort/parse on the compared values |
| **A1.5** whitespace-only re-spacing | **REFUSED**, and the header documents the decision | `[method/, app/]` → `[method/,  app/]` refuses; *"AND THE COMPARISON IS BYTES, SO A REFLOW IS A MOVE"* |
| **A1.6** a SIBLING's card, both moments | **REFUSED at both**, naming `T-900` ✓ | lane + merge |
| **A1.7** RENAME, **both orderings** | **REFUSED**, naming BOTH paths ✓ | a later-sorting slug and an earlier-sorting one; the PURE rename with the line preserved is **ALLOWED** |
| **A1.8** a genuinely NEW card id with a wide fence | ALLOWED, residue (a), routed `T-224-s2` ✓ | by design |
| **A1.8b** delete-then-re-add wider under a NEW name | **REFUSED** ✓ | `block/landing-gate-touches-amended` |
| **A1.9** a card the range DELETES | ALLOWED, residue (b) ✓ | the DENIAL argument holds: that lane's next push is refused whole |
| **A1.10** both call sites | ✓ **carried by blob hash** | `push-guard.mjs` `41c8eea…` is byte-identical to `dfe35a5` |
| **A1.11** a NON-MERGE commit straight onto the integration branch | ALLOWED, `landing-gate-no-new-merges` — correct by design, disclosed, `T-224-s4` filed | re-run: unchanged |
| **A1.12a** widen-then-revert in one range | **ALLOWED** ✓ | two file states, never the patch |
| **A1.12b** widening via a NESTED merge inside the lane | **REFUSED** ✓ | `block/landing-gate-touches-amended` |
| **A1.13** a body-quoted `touches:` in the notes | ✓ **carried by blob hash** | `lane-fence.mjs` `d61025a…` unchanged; `frontmatterLineOf` still bounded at the closing `---` |
| **A1.14** the exit contract, and the TWO NEW BLOCK CODES | ✓ | `push-guard-hook.mjs` (unchanged blob) writes the reason to stderr and `process.exit(2)` for ANY block, so both new codes exit 2; nothing in the tree enumerates this gate's block codes (I grepped: the only cross-file consumer is `landing-gate-cannot-compare`); and the three new bodies assert the REMOTE REF after a real push through the wired command, not an exit code |
| **A1.15** THE COST — **the figure MOVED and the executor retracts it in the header** | ✓ acceptable | measured with a `git` injected through the function's own last parameter: **0** spawns for a range with no card path; **4** for the ordinary push (2 `ls-tree docs/tasks/` + 2 `show`); **4** for one pure rename; **42** for twenty pure renames (**2** listings + 40 `show`); rename-and-widen is **6/63** with a distinct record ref and **5/62** where the record string equals the base — which is where the card's table's 5 and 62 come from, and the card does not say so. The criterion the sealed set set is *"two blob reads per card per range is fine; per directory listing is not"*: the listing is per REVISION (2, or 3 when a line moved), never per card. **PASSES.** |
| **A1.16** block-sequence frontmatter | **REFUSED upstream**, never a silent allow ✓ | `block/landing-gate-no-fence` |
| **A2.1/A2.2** the AMENDMENT refusal's text | ✓ | "fast path A", the BEFORE line and the AFTER line, untruncated — asserted in my X1b and by the body at 1561 |
| **the new DUPLICATE_ID_ROUTE** | ✓ | names what the refusal is NOT (the fence question, the amendment question), gives the lane a remedy inside its own range (*"give the new card an id of its own"*), and says the inherited case is announced rather than refused. No `.nputer/` in any added string. |
| **A3.1–A3.4** the positive controls | ✓ **armed in BOTH directions, by me** | below |
| **A4.1** the record | ✓ | falsifier 4, below |
| **A4.2/A4.3/A4.4** the disclosure | ✓ **except the scope of (f)** — the finding above | both files under the exact heading; mutants `NO_ARRIVED_MARKER` and the three new bodies red when the account is removed |

### The falsifiers

1. **a legitimate fast-path-A grant refused** — **NO.** A1.1 allows, and all
   five live ranges allow (dogfood below).
2. **a sibling-card amendment admitted** — **NO.** The decoy form is refused
   at both moments, on the lane's own card and a sibling's; rename,
   delete-and-re-add, nested merge and the second merge of one push all
   refuse.
3. **a positive control that cannot fail** — **NO.** Armed both ways at
   assertion level by my own mutants, below.
4. **a record rewritten** — **NO.** `git diff dfe35a5..63b9c3d --
   'docs/tasks/T-212-*.md' | grep -cE '^-[^-]'` = **0**: the whole lane's
   effect on `T-212` is a pure addition, and the seven `-` lines in the
   third-pass diff are inside the paragraph THIS LANE added. In the hook's
   "cannot see" list I compared each numbered item byte for byte between
   `dfe35a5` and `63b9c3d`: items **1, 2, 3, 4, 6 and 7 are IDENTICAL**; only
   item 5 — the entry that asserted the hole was OPEN and this card owned it,
   which the diff makes false — changed. The card's own frontmatter moves only
   `status: building → verifying` and `built_by:`.
5. **fail-open** — **PARTLY**, and it is the finding above: an inherited
   ambiguity discards refusals already found. Announced, never silent.
6. **a tautological expectation** — **NO.** Every new expectation is a typed
   literal (`"ARRIVED IN THIS RANGE"`, `"1 card id(s)"`, `"the ambiguity is
   the BOARD's"`, `"touches: [method/]"`), and body 1561 asserts its own
   decoy-sorts-first PRECONDITION from `git diff --no-renames`, so a fixture
   that stopped reproducing the ordering would red rather than pass vacuously.

### The drill — my own detached scratch worktree `../V3-T-224-mutants`

`git worktree add --quiet --detach 63b9c3d`, its OWN `npm ci` + build for
`lib/parser`, `npm install` for `app/`, `npm ci` for `tools/e2e` — CONVENTIONS'
fresh-clone order, so the missing-`app/node_modules` harness failure the first
verdict reported cannot recur. **BASELINE FIRST: 51 passed, exit 0** — the
count read, not only the exit. Every mutation REFUSED unless its FROM string
occurs exactly once; every landing read back from `git diff -U0` BEFORE the
suite ran; every restoration by `git restore --source=63b9c3d --staged
--worktree` and proved by sha256 against the pristine
`aa12c5aa7a78ddcd879b96605b5978c0b6e945153be70595235afaf4dbbcffea`, which I
verified against `git show 63b9c3d:.claude/hooks/landing-gate.mjs | shasum -a 256`.
**Every restoration matched.**

**THE PRISTINE HASH THE CARD CITES IS NOT THE TIP'S, AND I CHECKED WHY RATHER
THAN ASSUMING.** `5b8522c66a60a44de9d8ac2069a567d1b8e0512a957f494e8ba3361b0d0cea35`
is the hook at `aab21bc` and `d0b7910` — correct for the drill that ran there
— and the tip's is `aa12c5aa…`. The delta is `63b9c3d`'s limit-5(f) edit, and
it is **comment-only, proved mechanically**: `git diff d0b7910 63b9c3d --
.claude/hooks/landing-gate.mjs` has **7** changed lines and **0** that do not
begin with ` *`. `node --check` at the tip: exit 0. So no kill set in the
executor's table can depend on it, and mine were taken at the tip regardless.

| mutant | one-side change | exit | bodies RED |
|---|---|---|---|
| `PATH_FIRST_RESTORED` — **the regression itself** | the 3-line `git show` short-circuit re-inserted at the head of `cardTouchesOf` | 1 | **3** — 1561, 1635, 1675 (48 passed) |
| `AMBIGUITY_ALLOW` | `if (arrived.length > 0) {` → `if (false) {` | 1 | **3** — 1561, 1635, 1675 |
| `AMBIGUITY_PICKS_FIRST` — **the second verdict's SURVIVOR** | `if (paths.length > 1) {` → `if (false) {` | 1 | **3** — 1561, 1635, 1675 |
| `DEDUPE_BY_PATH` | `seen.has(id)/add(id)` → `seen.has(rel)/add(rel)` | 1 | **2** — 1481, 1561 |
| `RECORD_HALF_REMOVED` (mine) | `new Set([...atBase.at, ...atRecord.at])` → `new Set([...atBase.at])` | 1 | **1** — 1675 alone |
| `REFUSE_EVERY_DUPLICATE` (mine) | `atTip.at.filter((p) => !known.has(p))` → `atTip.at` | 1 | **1** — 1675 alone |
| `RECORD_INDEX_AT_TIP` (mine) | `pathsOf(record, id)` → `pathsOf(tip, id)` | 1 | **3** — 1561, 1635, 1675 |
| `LANE_DUPLICATE_BLOCK_REMOVED` (mine) | the lane arm's `if (amended.duplicated.length > 0)` → `if (false)` | 1 | **2** — 1561, 1675 |
| `MERGE_DUPLICATE_BLOCK_REMOVED` | the merge arm's, likewise | 1 | **1** — 1635 alone |
| `REFUSEALL_DUPLICATE` (mine) | the lane arm's `> 0` → `>= 0` | 1 | **19**, incl. 1561's ALLOW half (32 passed) |
| `REFUSEALL_MERGE_DUPLICATE` (mine) | the merge arm's `> 0` → `>= 0` | 1 | **5** — 939, 1269, 1403, 1635, 2048 |
| `NO_ARRIVED_MARKER` | the `<- ARRIVED IN THIS RANGE` annotation dropped | 1 | **3** — 1561, 1635, 1675 |
| `ID_DROPS_SUFFIX` (mine, a DATA mutant on the id grammar) | `(T-\d+(?:-s\d+)?)` → `(T-\d+)(?:-s\d+)?` | 1 | **3** — 464, 1031, 1481 |
| `ABSENT_SHORT_CIRCUIT_RESTORED` (mine) | `if ("absent" in before) continue;` moved back ABOVE the ambiguity arm | **0** | **NONE — SURVIVES** |

**THE SURVIVOR IS A CLAIM THE CODE MAKES AND NOTHING MEASURES.** The loop's
new comment says *"a range that FILES two cards under one brand-new id is the
same ambiguity, and skipping it on `absent` would hand it back"* — true, and
unpinned. The same mutant flips a real verdict: two files under one brand-new
id go from `block/landing-gate-card-id-duplicated` to
`allow/landing-gate-inside-the-fence`, and all 51 bodies stay green. The
consequence is a DENIAL rather than a widening — `cardAt` can no longer say
which file is that card — so it is filed as `T-224-s6` and does not block.

**KILL-SET CONTAINMENT, judged over BODIES and against ALL THREE earlier
tables.** Over my fourteen landed mutants: 1561 `{PFR, AA, APF, DBP, RIAT,
LDBR, RAD, NAM}`, 1635 `{PFR, AA, APF, RIAT, MDBR, RAMD, NAM}`, 1675 `{PFR,
AA, APF, RHR, RED, RIAT, LDBR, NAM}`, 1481 `{DBP, IDS}`. **No two contain
each other**: `DEDUPE_BY_PATH` and `LANE_DUPLICATE_BLOCK_REMOVED` kill 1561
and not 1635; `MERGE_DUPLICATE_BLOCK_REMOVED` and `REFUSEALL_MERGE_DUPLICATE`
kill 1635 and neither other; `RECORD_HALF_REMOVED` and `REFUSE_EVERY_DUPLICATE`
kill 1675 and neither other. **One containment my own first set left standing
I broke rather than reported**: 1481's kill set was `{DBP}` alone, contained
in 1561's, so I planted `ID_DROPS_SUFFIX` — a mutant on the id GRAMMAR, where
the property lives in data — and it kills 1481 and **not** 1561. Against the
executor's table, my `PATH_FIRST_RESTORED`/`AMBIGUITY_ALLOW`/`DEDUPE_BY_PATH`/
`AMBIGUITY_PICKS_FIRST`/`NO_ARRIVED_MARKER`/`MERGE_DUPLICATE_BLOCK_REMOVED`/
`RECORD_HALF_REMOVED` reproduce its A, C, B, J, G, H and L **independently and
identically**. Against the second verdict's table, its one deliberate survivor
`AMBIGUITY_PICKS_FIRST` — *"residue (f) is asserted and measured by
nothing"* — now reds three bodies, which I confirm rather than take on the
card's word.

**THE POSITIVE CONTROLS ARE DEMONSTRATED FAILING, BY ME, IN BOTH
DIRECTIONS** — the arming shown where it differs:

- **1561** — REFUSE half reds under `PATH_FIRST_RESTORED`, `AMBIGUITY_ALLOW`,
  `AMBIGUITY_PICKS_FIRST`, `RECORD_INDEX_AT_TIP`, `LANE_DUPLICATE_BLOCK_REMOVED`
  and `NO_ARRIVED_MARKER`; its **ALLOW half** (*"an ordinary range changing
  TWO cards was refused"*) reds under `REFUSEALL_DUPLICATE`.
- **1635** — REFUSE half reds under `MERGE_DUPLICATE_BLOCK_REMOVED` and the
  shared five; its **ALLOW half** (*"a merge carrying ordinary card writes was
  refused"*) reds under `REFUSEALL_MERGE_DUPLICATE`.
- **1675** — REFUSE halves red under the shared five; its **ALLOW halves** red
  under `REFUSE_EVERY_DUPLICATE` (arm three, the inherited duplicate) and
  `RECORD_HALF_REMOVED` (arm four, the record's own file) — one each, from
  opposite sides.

### Dogfood — FIVE live ranges, read-only

`dogfood3-V-T-224.mjs`, driving `touchesAmendments` with the integration ref
`main` (`b825e87`) as the record, out of the bench's shared object store.
Nothing was written and no lane worktree was touched.

    ── T-224 (THIS lane)  dfe35a5..63b9c3d   9 paths, 7 card files   ALLOWED
    ── T-265              15619b4..3589e0f  45 paths, 3 card files   ALLOWED
    ── T-219-s6           90038e9..25b735b   6 paths, 2 card files   ALLOWED
    ── T-153-s3           bcc833f..dd0bcff   6 paths, 3 card files   ALLOWED
    ── T-205-s1           6dd44a6..4de3675  10 paths, 0 card files   ALLOWED

**AND ONE READING I TOOK EARLIER IS WORTH THE RECORD, BECAUSE IT IS EVIDENCE
FOR THE FIX RATHER THAN AGAINST IT.** At `T-219-s6`'s earlier tip `92d8bce` —
a transient state of a lane that is live beside this bench — that range
carried `docs/tasks/T-219-s6-s1-….md` and `…-s6-s2-….md`, whose names
`CARD_FILE_RE` reads as the id `T-219-s6` (and `lib/parser`'s
`validate.ts` reads them the same way, while `task.ts`'s
`^T-\d+(?:-s\d+)?$` rejects the ids they declare). This tip answered
`DUPLICATED T-219-s6` — a refusal, correctly in kind, with the remedy *"give
the new card an id of its own"*. **The tip under the SECOND verdict answered
`AMENDMENT T-219-s6 touches: [lib-parser] -> touches: [app/src/lib/board-model.ts]`
— a fence move that never happened**, because the path-first read handed it a
sub-card's line as if it were the parent's. That lane has since renamed both
to `T-219-s7`/`T-219-s8` and its range now allows. Neither the transient nor
the repair is `T-224`'s, and it is `T-219-s6`'s seat to know.

### Security sweep — the third-pass diff

No dependency added (no `package.json`, lockfile or `Cargo.toml` in the
diff — 0 such paths). **No new import, no `fetch`, no `child_process`, no
`spawn`, no `eval`, no `new RegExp`, no `process.env` read.** No secret, key
or token. No `--no-verify`, no `continue-on-error`. **No new `return allow(`
site** — `git diff 40b22e4..63b9c3d -- .claude/hooks/landing-gate.mjs | grep
-cE '^\+.*return allow\('` = **0**. **No new git invocation at all**:
`pathsOf` reads the SAME memoised listing `cardTouchesOf` reads, which I
confirmed by counting spawns rather than reading the comment. The new strings
interpolate only a card id, paths git itself listed, and a revision this gate
resolved — all to stderr, never to a shell. No new input path, no endpoint, no
authz surface. The id map is not poisonable by a crafted filename: the capture
is anchored, `[^/]*` cannot cross a slash, and the listing is non-recursive.

### Architecture and adjacent features

No interface moves. Two new exports (`duplicateReport`, `DUPLICATE_ID_ROUTE`)
and one new typedef (`DuplicateId`) sit beside `amendmentReport`/
`AMENDMENT_ROUTE`, in the same `{verdict, code, reason}` shape;
`push-guard.mjs` and `.claude/settings.json` are byte-identical to `dfe35a5`,
so the two call sites `docs/ARCHITECTURE.md`'s interface rules govern are
untouched. `judgePaths` is untouched and `docs/tasks` stays UNFENCEABLE —
`lib/parser/src/fence.ts` is byte-identical too. The 48 pre-existing bodies
stay green at the tip, which is the adjacent-feature check: the seventh body's
ordering, the exoneration and `T-212`'s two in-lane-widening bodies all still
pass. Every path this lane wrote is inside `touches: [.claude, tools/e2e]` or
under the unfenceable directory.

### Assigned corrections

1. **An inherited ambiguity on one id must not discard a refusal already
   found for another** — the finding above, with the body that is already
   written and already red (`PROPOSED (V)`), and limit 5(f) plus the loop's
   comment corrected to say what the code does either way.

Everything else in this diff stands. Both corrections the second verdict
assigned are delivered: the index answers at BOTH endpoints, and the duplicate
a range arrives at is a verdict rather than a shrug. The widening of the
`arrived` rule is the executor's own and it is right.

### Filed, not blocking

- `T-224-s6` — `touchesAmendments`' `absent` short-circuit sits BELOW the
  ambiguity arm on purpose, and no body among the 51 says so; mutant
  `ABSENT_SHORT_CIRCUIT_RESTORED` survives all 51 while flipping a real
  verdict.

### For the integrator

- **THE CENSUS IS STALE AND IT IS THE INTEGRATOR'S**: three body names were
  added, `docs/CAPABILITIES.md` is outside this fence (`T-210`), and
  `npm run capabilities` from `tools/e2e/` belongs in the merge commit.
- **`T-224-s4` STILL ASKS FOR `(f)` AND THE NEXT FREE LETTER IS `(g)`.** Both
  earlier verdicts and this lane's own notes say so; (a)–(f) are all live at
  this tip. One word at triage.
- `T-224-s5`'s two spawn figures (2 ordinary, 9 renaming) were taken at
  `4a9f278` and are stale at this tip — 4 and 4/6. The card's ASK is
  unaffected; its numbers move to `T-224`'s own table.

### This verdict's own tip — step 7, OWED

**PROSE IS A CODE INPUT HERE**, so the writes this verdict makes — this entry
and `T-224-s6` — create a tip nobody has tested, and the gates are re-run at
THAT tip rather than at `63b9c3d`. Under **SUITE-ONCE (T-262)** the four-leg
battery is run ONCE, at this verdict commit, and never separately at the
executor's tip: `docs-gate.mjs` on my two literal paths, then
`gate-run.mjs parser|app|rust|e2e`, `npm run lint:tokens -- --selftest` and
bare, `npm run lint:docs`, `npm run typecheck`, `npm run capabilities:check`
(expected STALE — the integrator regenerates) and `index --check` from
`app/src-tauri/`. **A FIGURE WITHOUT ITS REF IS WRONG AS SOON AS ANYBODY
WRITES AGAIN**, so: every count in the tables above is at `63b9c3d` except the
drill's, which are in `../V3-T-224-mutants` at `63b9c3d`, and the dogfood's,
whose record is `main` at `b825e87` and whose lane tips are pinned in the
block itself; the step-7 figures are at this commit's own tree and are
reported with it.

**HOUSEKEEPING.** My scratch worktree `../V3-T-224-mutants` is detached, is
not a lane, and holds one incidental modification (`app/package-lock.json`,
touched by the `npm install` CONVENTIONS' fresh-clone order prescribes for
`app/`); the spec copy I appended two proposed bodies to was restored and
`git status` is clean on that path. Nothing was written to
`/Users/ujju/Projects/nputer`, to the lane `../nputer-T-224`, or to anything
belonging to `T-265`, `T-219-s6`, `T-153-s3` or `T-205-s1`. This bench stays
detached: no branch was created or moved.
