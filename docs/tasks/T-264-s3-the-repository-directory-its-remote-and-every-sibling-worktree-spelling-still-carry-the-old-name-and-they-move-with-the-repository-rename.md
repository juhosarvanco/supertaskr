---
id: T-264-s3
title: The repository directory, its remote and every sibling-worktree spelling still carry the old name — 97 occurrences that move WITH the repository rename and not before it
feature: F-01
milestone: 4
size: M
priority: 1
status: building
suggested_by: executor claude-opus-5@subagent, at T-264's lane, 2026-09-08 — enumerated as the `repository-directory` survivor class while landing the identifier rename
blocked_by: []
touches: [app/, lib/, tools/, .claude/, .github/, bin/, method/, docs/reference/, docs/design/, docs/business/, docs/guide/, README.md, CLAUDE.md, AGENTS.md, .gitignore, docs/CONVENTIONS.md, docs/NORTH_STAR.md, docs/STATE.md, docs/future.md, docs/architecture/components/C-07-nputer-index.md, docs/architecture/components/C-07-supertaskr-index.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## The finding

**Class parent: `T-264`.** ADR-022 decision 2 enumerates the identifiers
the rename lands, and the repository DIRECTORY is not among them;
decision 4 puts the remote, the npm names, the domains and the mark with
@human, and `T-266` is that checklist. So one class of survivor was
enumerated rather than renamed, and it is the largest:
`repository-directory`, **108 occurrences at the lane's tip** —
`tools/e2e/scripts/rename-scan.mjs`'s own table names it and
`only the four enumerated classes of the pre-rename identifier survive
in the code tree` holds the survivor set to that table.

**WHAT IS IN THE CLASS**, and why each is held rather than moved:

- `../nputer-app` — @human's live detached app checkout. It EXISTS under
  that name right now; renaming the spelling would make CONVENTIONS
  describe a directory nobody has, and `bin/app-dev.mjs` (out of
  T-264's fence, `T-264-s2`) would still default to the old one.
- `../nputer-T-NNN` and `../nputer-V-T-NNN` — the lane and bench
  worktree spellings CONVENTIONS publishes and `brief.mjs`,
  `dispatch-brief.mjs` and `app/src-tauri/src/dispatch/brief.rs` derive
  their answers from. Two of them are live on this machine as
  `nputer-T-264` and `nputer-V-T-264`.
- `/Users/ujju/Projects/nputer` and `github.com/juhosarvanco/nputer` —
  the repository root and its remote, both @human's under decision 4.

**THE ORDER IS THE POINT.** Every one of these is a sibling of, or a
route to, a directory named after the repository. Moving the spellings
first names siblings of a repository directory that does not exist;
moving the repository first makes each spelling a one-line follow.

PREFLIGHT RULING (2026-09-10): "first names siblings of a repository" and "repository first" are the ORDER of two moves (the directory before its spellings), not an ordinal count over this repository's history; the move happened on 2026-09-10 and the paragraph stands as the record of why it went first.

**Absorbs:** T-264-s2, T-265-s1, T-265-s3, T-269 (the rename sitting of 2026-09-10, ruling B of the backlog review: cards sharing a fence are ONE lane; each absorbed card's criteria are kept whole below).

**PRECONDITION MET (2026-09-10):** @human renamed the GitHub repository to juhosarvanco/supertaskr, the repository directory to supertaskr and the app checkout to supertaskr-app; the seat re-pointed the remote and repaired the worktree. T-266's precondition is this rename; its remaining items (the npm placeholder, the domain, the mark, the App Store name) are @human's and stay on T-266 — its one seat write (the spellings of the old remote in .github/, CONVENTIONS and the README) is performed HERE. The census at 10f3676 with the records excluded (docs/checkpoints, docs/rooms, docs/tasks, docs/decisions, docs/research): 318 occurrences in 55 files. Records are never rewritten; the identifier-rename keeper's enumerated survivor classes shrink to what a ruling still holds (criterion 2 here, T-265-s3's last criterion).

## Acceptance criteria

- WHEN the repository directory and its remote have been renamed
  (`T-266`) THE lane worktree spelling, the bench spelling and the app
  checkout's spelling in `docs/CONVENTIONS.md` SHALL be the new ones,
  and every derivation and fixture that reads them SHALL move in the
  same commit.
- WHEN the class is empty THE `repository-directory` entry SHALL be
  removed from `KEPT_CLASSES` in `tools/e2e/scripts/rename-scan.mjs`,
  and `every enumerated survivor class is occupied` SHALL stay green.
- IF the repository has not been renamed THEN this card SHALL NOT be
  dispatched — `blocked_by: [T-266]` is the whole of its ordering.

## Absorbed criteria (kept whole)

### T-264-s2 — The app-dev launcher carries a 34th `NPUTER_*` variable and `bin/` is outside T-264's fence — the env prefix is renamed everywhere a program reads it EXCEPT the one launcher a human runs by hand

- WHEN this lane lands THE variable `bin/app-dev.mjs` reads SHALL be
  `SUPERTASKR_APP_WORKTREE`, and a repo-wide
  `git grep -h -o -E 'NPUTER_[A-Z0-9_]+'` outside `docs/` SHALL return
  nothing.
- IF the launcher's default target still names the pre-rename repository
  directory THEN it SHALL be left alone and named in the notes — that
  path is `T-266`'s, and a launcher pointing at a directory nobody has
  created yet is worse than one pointing at the directory that exists.

### T-265-s1 — Three `repository-directory` spellings live in docs/reference/ and T-264-s3's touches do not reach them — the lane and bench worktree names in the dispatch and verification pages move with the repository rename

- WHEN the repository directory and its remote have been renamed
  (`T-266`) THE lane and bench worktree spellings in
  `docs/reference/05-dispatch.md` and `docs/reference/07-verification.md`
  SHALL be the new ones.
- WHEN those spellings move THE two site markers T-265 added — the
  paragraph in 05-dispatch.md naming ADR-022 decision 4 and T-264-s3, and
  the parenthetical in 07-verification.md — SHALL be removed, because a
  marker that explains a survivor outlives the survivor.
- WHEN this card lands THE reference SHALL agree with
  `docs/CONVENTIONS.md`'s lane bullet on the worktree spelling, checked
  by reading both at the same ref.
- IF `T-266` has not landed THEN this card SHALL NOT be dispatched: the
  order in T-264-s3 is the point, and moving the spellings first names
  siblings of a repository directory that does not exist.

### T-265-s3 — `rename-scan.mjs`'s corpus is app/, lib/, tools/, .claude/, .github/ and five root files — every tree T-265 renamed is outside it, so a leftover identifier, a mis-cased name or a homoglyph in method/, docs/guide/, docs/reference/ or docs/business/ reds nothing

- WHEN `scanCorpus` walks the tree THE roots SHALL include `method/` and
  the governing-document and prose trees T-265's `touches:` names, so
  that a survivor there is classified rather than unseen.
- WHEN a survivor in those trees is not one of the enumerated classes
  THE unclassified-survivor body SHALL red, naming the file and the line.
- WHEN the product name appears in prose or in an identifier anywhere in
  the corpus THE case SHALL be checked against ADR-022 decision 1 — a
  capital `S` inside a backtick code span or an identifier is a finding,
  as is a lowercase `s` opening a prose sentence (`T-265-s2` rules the
  second half).
- IF a name-shaped token carries a non-ASCII homoglyph THEN the scan
  SHALL red rather than pass it as an unrecognised word.
- The new classes SHALL each carry a mutant shown failing before the
  body is believed, planted where the arming is absent (verifier.md 2b).
- IF the enumerated survivor set must grow to keep the tree green THEN
  each addition SHALL name the ruling that holds it (ADR-022 decision 4,
  `T-264-s3`, `T-269`) rather than being added to silence a red.

### T-269 — The runtime template method/runtime/nputer.yaml renames to supertaskr.yaml WITH its three readers in one lane — the compile-time embed in kit.rs, the token scan's literal path, and the interview approval string — because a git mv alone fails the Rust build

- WHEN the lane lands THE file SHALL be `method/runtime/supertaskr.yaml`
  (`git mv`), its header comment SHALL carry the new name, and the three
  readers SHALL name it: kit.rs's `include_str!` path, its `rel:` string
  and the KIT_FILES expectation; token-scan.mjs's control-corpus entry;
  the interview approval string in interview-chat-dom.test.tsx — and
  `cargo build` from app/src-tauri/ SHALL succeed at every commit of the
  lane (a half-landed rename fails the build, which is why the four move
  together).
- WHEN a genesis runs (the interview e2e or the app suite's genesis
  bodies) THE kit copied into the project SHALL carry `supertaskr.yaml`
  under runtime/, and the project's own config file SHALL be
  `.supertaskr/supertaskr.yaml`.
- WHEN method/roles/planner.md and docs/reference/12-genesis.md name the
  runtime template THE prose SHALL say the new name (the two lines T-265
  parked with the file).
- The lint:tokens control corpus SHALL still include the file under its
  new name (the `CONTROL includes tracked text format` body), and the
  suites owed by the docs gate SHALL run green.

## Implementation notes

### 2026-09-10 — claude-opus-5@subagent (executor)

Lane worktree derived from CONVENTIONS' pre-rename lane bullet (the arm
still spelled it the old way at dispatch, which is one of the things this
lane moves — the NEXT lane gets the new path), branch
`task/T-264-s3-the-rename-remainder`, base
`130f4c4c661b214ee1ece920643c90e18a886bfc`, port 15264. Seven commits;
every figure below is measured at the seventh, `98121a65`, unless it
names another ref.

### The census, with the same command before and after

`git grep -io nputer` over the tree with the five record trees excluded
(checkpoints, rooms, tasks, decisions, research):

| | occurrences | files |
|---|---|---|
| base `130f4c4c` | **318** | 55 |
| tip `98121a65` | **46** | 10 |

**What survives, and the ruling that holds each.** Six groups; five are
the scan's own enumerated classes and the sixth is its self-exclusion.

1. `migration-refusal` — `.claude/hooks/lane-fence.mjs`, 3 lines. The
   one place the old runtime directory is the SUBJECT rather than a
   leftover. Unchanged by this lane.
2. `capture-transcription` — `app/src-tauri/src/bin/fake_agent.rs`, 3
   lines, transcribed byte for byte out of a 2026-08-19 capture.
   ADR-022 decision 3. Unchanged by this lane.
3. `verbatim-quotation` — NEW. `docs/NORTH_STAR.md` (2, @human's bar of
   2026-08-29), `docs/business/marketing.md` (2) and
   `docs/business/strategy-room.md` (1), all three the M3 positioning
   ruling of 2026-08-30. T-265's fourth criterion: rewriting a person's
   quoted words is falsification whatever an ADR says about a name.
   T-265 enumerated these five and this lane made the class mechanical.
4. `record-title` — NEW. `docs/reference/09-records.md` lines 92-93,
   ADR-001's title quoted AS a title by a sentence that says in as many
   words that records keep the pre-rename name.
5. `naming-history` — NEW. `method/README.md` line 6 (T-265's third
   criterion, the one sentence of etymology) and, held under THIS card,
   `docs/design/design-handoff.md` lines 22 and 369 — the wordmark note
   and its restatement in the open-questions list. The parenthetical
   there explains the OLD name and no other, so a spelling move would
   have made the sentence false rather than current; both sites already
   carry the quotation marks T-265 established as the marking, so
   neither needed a new marker.
6. NOT A CLASS — the scan's own two files, `rename-scan.mjs` (12) and
   `identifier-rename.spec.ts` (2), excluded BY NAME in
   `SCAN_EXCLUDED_FILES` because they spell every pattern. The
   exclusion is asserted rather than assumed by
   `every enumerated survivor class is occupied`.

**Two classes EMPTIED and left the table**, which is the second
criterion and its neighbour: `repository-directory` (criterion 2 — the
repository, its remote and every sibling worktree spelling moved here)
and `method-source` (emptied by T-269's yaml move; an XS in-fence
finding, performed rather than filed per T-283). The table therefore
moved ONCE, in the sixth commit, rather than three times — a table
rewritten at each emptying would have described the tree wrongly twice
on the way. Between the first commit and the sixth the keeper is red BY
CONSTRUCTION on `every enumerated survivor class is occupied`, and that
is disclosed rather than hidden: the table is the description of a
finished tree.

### The commits, and why each is one commit

1. `ad14175` — **T-269**, the four together: `git mv` of the runtime
   template to `method/runtime/supertaskr.yaml` with its header, plus
   kit.rs's `include_str!` path, its `rel:` string and the KIT_FILES
   expectation, token-scan.mjs's control-corpus entry and the interview
   approval string; plus planner.md step 1 and 12-genesis.md's kit
   listing, the two prose lines T-265 parked with the file. A `git mv`
   alone fails `cargo build`, which is the whole reason for one commit.
2. `f720ae2` — **criterion 1**, the lane bullet and, in the same commit,
   every derivation and fixture that reads it: brief.mjs,
   dispatch-brief.mjs, dispatch-order.mjs, gate-run.mjs, both
   lane-fence copies, the push guard's shell example, the Rust dispatch
   fixtures in brief.rs / join.rs / lanes.rs / lib.rs, four app store
   tests, the parser's fence tokens, nine e2e specs, docs/STATE.md and
   the reference's dispatch and verification pages — where T-265-s1's
   two site markers were also REMOVED, a marker that explains a survivor
   having outlived the survivor.
3. `142e32d` — **T-266's one seat write**. See "Where the brief was
   wrong" below: the three sites that criterion names carry no spelling
   of the old remote at this ref.
4. `dee715c` — **T-264-s2**: `SUPERTASKR_APP_WORKTREE`, and the default
   target moves too, because the directory it names was renamed on
   2026-09-10 and the card's second criterion held it back only while
   that directory did not exist.
5. `e772ce8` — the design bundle and docs/future.md, with the two
   prototypes `git mv`'d to the names five files under `app/src/`
   already cited (T-264 moved those citation strings and the files were
   never moved with them, so the app's own comments named files that did
   not exist until this commit).
6. `e432b793` — **T-265-s3**: the widened corpus, the rewritten class
   table, and the two new readings.
7. `98121a65` — the corpus-roots body de-tautologised. See the drill.

### The arm derives the new spelling, and a body says so

`the SWEEP: no derived row moves when only the dispatching checkout
moves, and the movers are named` (brief.spec.ts) takes
`laneSpellings(conventions()).worktreePattern`, substitutes the card id,
resolves it against the fixture's own main worktree and requires row 4's
emitted line to equal it — from the main worktree AND from a nested one.
Two sides sharing no constant: the producer derives its base from git,
the body derives it from the fixture's layout and the document read
independently. It is green at the tip, so the arm now derives the
supertaskr-shaped sibling from the renamed bullet, and it would have
red the moment the fixture's expectation moved without the document.

### The two new readings, and the drill that broke one of them

T-265-s3's third and fourth criteria: the scan now judges the NEW name
as well as the old, over the SAME corpus.

- `caseFindings` — ADR-022 decision 1's IDENTIFIER half: a capital-S
  `Supertaskr` inside a backtick code span, or glued into an identifier,
  is a finding. Tree-wide: 0. The PROSE half is `T-265-s2`'s and is
  filed as `T-264-s9`, with the reason: a tree-wide body for it would
  red today on README.md, CLAUDE.md and AGENTS.md, which is that card's
  finding rather than a defect this corpus owns, and that card's own
  fence cannot reach the keeper to arm the check.
- `homoglyphFindings` — a name-shaped token carrying a non-ASCII
  lookalike, found by FOLDING rather than by matching, because a token
  whose `a` is Cyrillic is not the name to `git grep`, not to
  `carriesLegacy`, and not to the case reading either. Tree-wide: 0.

**SEVEN MUTANTS, EACH PLANTED WHERE THE ARMING IS ABSENT, and one of
them found a defect in a body written for this card.** Each was planted
at the tip, the keeper run, the tree restored, and the restore proved by
sha256 (identical in every case).

| mutant | keeper | body that red |
|---|---|---|
| an UNQUOTED leftover in docs/NORTH_STAR.md | 1 failed / 8 passed | only the enumerated classes |
| an UNQUOTED leftover in docs/reference/09-records.md | 1 failed / 8 passed | only the enumerated classes |
| an UNQUOTED leftover in method/README.md | 1 failed / 8 passed | only the enumerated classes |
| `method/` dropped from SCAN_ROOTS (DATA) | **0 failed / 9 passed** | **NOTHING — see below** |
| a capital-S name in a code span in docs/guide/ | 1 failed / 8 passed | the capital-S body |
| a Cyrillic-a name token in docs/guide/ | 1 failed / 8 passed | the homoglyph body |
| the class table loses marketing.md (DATA) | 1 failed / 8 passed | only the enumerated classes |

The first three are what the three NEW classes are for: each class's
pattern is the QUOTED FRAGMENT, not the bare name, so a file that holds
a held survivor is not thereby exempt from the rename — an unquoted
leftover in the same file is still an unclassified survivor.

**The fourth mutant SURVIVED, and the body it should have red was one I
had just written.** `the corpus reaches every tree the criteria name`
iterated `SCAN_ROOTS` itself, so deleting a root deleted its own
assertion: nine of nine passed with `method/` no longer walked. That is
exactly the tautology `rename-scan.mjs`'s own header names for the class
table — an expectation learned from the thing it judges agrees with it
by construction — reproduced in the body written to defend it. Commit
`98121a65` names the twelve roots literally, from the criteria that ask
for them, and asserts both halves: the module's list still contains each,
and the walk still reaches each. Re-drilled after the fix: dropping
`method/` reds by name (`the criteria name the root \`method/\` and the
module's own list has dropped it`), and so does dropping `docs/design/`.

### The widening found a survivor no reading could see, and it needed an ask

The widened corpus's first run red on a FILE PATH rather than a line:
`docs/architecture/components/C-07-nputer-index.md`, a component file
whose every byte was renamed by T-264 (`name: supertaskr-index`, the
renamed crate in its `paths:`) and whose NAME was not. The old corpus
did not walk that tree; the census command does not see a filename; no
reading in this repository could have found it.

`docs/architecture/` was not in this card's `touches:`, so ASK 1 was
written at the moment it was found, parked, and the lane kept building.
It was GRANTED at the seat's fast path A: main amends the touches line
with BOTH spellings (the tracked one and the renamed one, a NEW-FILE
RESERVATION under T-287), the manifest was re-expanded, and the grant
was read back FROM DISK — the manifest's `touchesLine` and this card's
own line, both carrying both names — never from the reply. The `git mv`
is one commit and moves nothing else: `graph.json` does not contain the
filename (grep answers 0), ARCHITECTURE.md cites the component by id and
by its `name:` field, the id comes from frontmatter rather than from the
basename, and every other mention in the tree is a record.

### Gates

- **DOCS GATE — FIRES.** 18 paths under docs/ are code inputs; it names
  all four suites. Run and reported below.
- **BOOT GATE — FIRES** (app/src-tauri/** and app/test/**). Run at the
  tip with a scratch port: **exit 0**, both `[supertaskr]` lines —
  `project folder:` and `window "main" created`.
- **METHOD EVAL GATE — FIRES** (method/** in the diff).
  `node tools/method-evals/run.mjs` exit 0 over 10 model-free evals, and
  `--selftest` exit 0 over the same 10 as positive controls.
- **GRAPH REGEN — FIRES** and is the INTEGRATOR'S, by the bullet's own
  words ("commit docs/architecture/graph.json **with the CHECKPOINT**").
  `index --check` at the tip is **exit 1**, naming content changes in
  eleven indexed files — every one of them a file this lane re-spelled.
  Nothing here can or should regenerate it.
- **AUDIT GATE** declares no merge-diff trigger; no lock or manifest
  moved in this lane.

### Three things this lane leaves for the integrator, each measured

1. **`npm run capabilities`** — `capabilities:check` is **exit 1** at
   the tip (committed 74270 bytes, fresh generation 74548). Three bodies
   were added to the keeper and one was renamed: the first test counted
   a class set that two rulings have since shrunk, so it now reads
   `only the enumerated classes of the pre-rename identifier survive in
   the corpus`. STATE's own rule puts the regen in the merge commit.
2. **The graph regen**, above.
3. **THE METHOD VERSION BUMP IS OWED AND IS NOT TAKEN HERE.**
   CONVENTIONS' test 1, SHIPPED BYTES, is met: the KIT_FILES table's
   `rel` for the runtime template moved and planner.md's step 1 moved,
   and both are files the kit materializes into another project. This
   card's fence DOES reach all three stamps, so the objection that
   normally defers a bump does not apply; the dispatching brief ruled it
   out of the lane instead, and the reason holds — the bump's FOURTH
   obligation is `node tools/method-evals/run.mjs --bump`, which runs
   BOTH sets including the model-in-loop one, and a lane cannot buy that
   honestly. Whoever takes it moves three files in one commit: the
   stamp in this document's first gotcha, the `(v<version>` stamp in
   method/interview/plan-interview.md's Output heading, and
   `METHOD_SNAPSHOT_VERSION` in kit.rs — currently 0.1.16 in all three,
   and `snapshot_version_matches_the_live_method_stamps` reds by name if
   one moves alone.

### Two suggestions filed

- **`T-264-s8`** — the design bundle's two prototypes have a SPACE in
  the basename, and it is not cosmetic: handed the change's own path
  list through a caller that splits on whitespace, the docs gate
  received one name as two arguments and reported INJECTION SCAN COULD
  NOT RUN, twice. The same card carries a link in the token sheet to a
  `directions` file the bundle has never held — dangling before the
  rename and dangling after it, which is the correct outcome for a
  spelling pass and the reason it is filed rather than fixed here.
- **`T-264-s9`** — the case reading's prose half, above.

### Where the brief was wrong, and one place the card was

- **The remote spelling.** The brief and `T-266`'s own criterion put
  `juhosarvanco/nputer` in `.github/`, `docs/CONVENTIONS.md` and the
  README. At this ref there is not one occurrence in any of the three:
  the ONLY first-party spelling in the tree is a comment in
  `.claude/hooks/push-guard.mjs`, inside a dated CI-latency measurement
  that names the remote it was taken against. That is where T-266's one
  seat write landed, and it is a judgement rather than a copy: the
  measurement's load-bearing parts are its date, host, `gh` version and
  the fact that it was the real remote rather than a fixture, none of
  which the name carries, and the repository is the same repository. The
  guard's own CI read answers for the renamed repository — `gh run list`
  exit 0, three runs on main, the newest a success.
- **The card's `blocked_by`.** The third acceptance criterion says
  "`blocked_by: [T-266]` is the whole of its ordering" and the
  frontmatter field is `[]`. The precondition is met either way (the
  rename happened on 2026-09-10 and the card's own PRECONDITION MET
  paragraph records it), so nothing was blocked — but the criterion and
  the field disagree at this ref and a reader should not have to
  reconcile them.
- **The seat's port and scratch facts, the fence and the absorbed
  criteria were all correct**, and the one derivation the brief warned
  about — that the lane path still spells the old name — is exactly
  what commit `f720ae2` moves for the next lane.

## Verdicts
<!-- verifier appends: date, model@session, APPROVED / REJECTED + failures -->
