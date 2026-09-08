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
