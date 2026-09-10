---
id: T-264-s3
title: The repository directory, its remote and every sibling-worktree spelling still carry the old name — 97 occurrences that move WITH the repository rename and not before it
feature: F-01
milestone: 4
size: M
priority: 1
status: verifying
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

### 2026-09-10 — claude-opus-5@subagent (verifier, phase 2) — APPROVED WITH ASSIGNED CORRECTIONS

Tip judged `56f422e2f6dc8b62d4d479f41732e3aee0c3398a`; base
`130f4c4c661b214ee1ece920643c90e18a886bfc`. Bench: a detached sibling
worktree at the tip, its own dependencies installed with `npm ci` and its
own port 25264.

attack set: sha256:e2e683390584d614c7eeaa05fdb519dfa79222bb12252170bfafacdf7d9130dc (attack-set-T-264-s3.md)
ground truths: sha256:47e8c9d495e85e5abf91eb585f80ecee50ce216195e70315ab3e510ff28d9ef6 (ground-T-264-s3.md)
ground addendum: sha256:b582b26acfb59d735b661f7d7c84374ead7c9abadb531de9ac1aaa2a0dff446e (ground-T-264-s3-addendum.md)

**THE FRAME I ACTUALLY HAD, said plainly.** Phase 1 was a separate
tool-less spawn at the base; its set and both ground files are hashed
above and I re-verified all three before opening anything. Four
departures to disclose. First, **this brief carries no context pack** —
`method/roles/verifier.md` step 0 calls that a dispatch fault; I read
`docs/CONVENTIONS.md` at the base and at the tip by the bullets I needed
(the lane bullet, the DOCS GATE, the boot and eval gates, the stamp
gotcha) rather than end to end. Second, **the brief's duties paragraph
names the executor's report inline** — its census figures, its survivor
counts, its class names, its suite counts, its mutant tally and the two
cards it filed — so I held those claims before my findings were written;
every one below is re-measured by me and I say where my number differs.
Third, **I leaked commit SUBJECTS to myself** by taking the per-commit
walk with `--format='%H %s'` instead of `%H`, before opening the notes;
the subjects named the commits' contents. Fourth, phase 1's own note
that 97, 108 and 318 do not reconcile is right, and my figures are below.

## The fence, checked before anything was read for correctness

`git diff --stat` over the range is 53 paths. Every one is inside the
fence as the card's `touches:` line stands at the tip, including the two
`docs/architecture/components/C-07-*` names the fast-path-A widening
added during the lane. The four record trees are **byte-identical**:

    docs/checkpoints  f15e5bb85a05b8888c2e47af46f79941a594286a  IDENTICAL
    docs/rooms        b65861fb98c8e1e9bb23f7d1e1613cd386f8eb89  IDENTICAL
    docs/decisions    6ce15d7e8da698916260032d9b228797dcb14fa1  IDENTICAL
    docs/research     b5b20fd6bbde7097e6cbeb5cf7e02f39ab1448a8  IDENTICAL

`docs/tasks` carries exactly three entries: `M` this card, `A` T-264-s8,
`A` T-264-s9. No other card's bytes moved. The old spelling is still
carried by the record trees in five files' worth of remote spellings and
by six record FILENAMES, all untouched. No binary in the diff
(`--numstat` names none), no lockfile, no mode-bit change
(`bin/app-dev.mjs` is still 100755, every hook still 100644), no
dependency added. Nothing spelled `/Users` was introduced: the count of
lines carrying a home path is 13 at the base and 13 at the tip, and a
per-file diff shows the only movement is one file's own rename.

## The census, with the seat's own pathspec, measured at both ends

`git grep -io nputer` with the five record trees excluded:

| | occurrences | lines | files |
|---|---|---|---|
| base `130f4c4c` | **318** | 283 | 55 |
| tip `56f422e2` | **46** | 30 | 10 |

**THE THREE NUMBERS, RECONCILED WITH MY OWN FIGURES.** 318 is every
occurrence over the record-excluded living tree at the base, and it is
what I measure. The card's title says 97 and its finding says 108; those
are the `repository-directory` class alone at earlier refs, and at THIS
base that class is **126 occurrences on 113 lines** inside the base
scan's own (narrower) corpus, which is neither. The title's figure is
stale rather than wrong-in-kind, and it is frontmatter the card carried
in at dispatch — recorded, not charged to the lane.

**THE SURVIVORS, EVERY ONE, ATTRIBUTED.** 30 lines in 10 files. Sixteen
of them are inside the scan's corpus and each is classified; the other
fourteen are the scan's own two implementation files, excluded BY NAME.
I ran the classifier myself rather than reading the table:

    migration-refusal      3  .claude/hooks/lane-fence.mjs 323, 344, 358
    capture-transcription  3  app/src-tauri/src/bin/fake_agent.rs 1385, 1414, 1422
    verbatim-quotation     5  docs/NORTH_STAR.md 84, 85; docs/business/marketing.md 57, 138;
                              docs/business/strategy-room.md 40
    naming-history         3  docs/design/design-handoff.md 22, 369; method/README.md 6
    record-title           2  docs/reference/09-records.md 92, 93
    (self-excluded)       14  tools/e2e/scripts/rename-scan.mjs 12; identifier-rename.spec.ts 2

Unclassified: **zero**. Every class occupied: **yes**, all five. I read
each of the five ruled sites in its own file: the bar in NORTH_STAR is
marked "Quoted verbatim" and dated; the M3 lines are @human's quoted
ruling of 2026-08-30; 09-records says in as many words that records keep
the pre-rename name; method/README's sentence is the etymology. Each
ruling is real and each reaches its site.

**THE SUBSTRING TRAP: NO SPILL.** Base against tip over the same
pathspec — `computer` 2/2, `input` 874/874, `output` 382/382,
`reputation` 0/0, all IDENTICAL. Over the whole tree including records,
`input` and `output` move by 2 and 1, and a per-file diff localises every
one of them to this card and to T-264-s8 — prose the lane wrote, not a
regex spill.

**HOMOGLYPHS: ZERO, measured independently of the lane's own reading.** I
folded every name-shaped token in all 1440 tracked text files of the tip
— records included, the scan's own two files included — and nothing folds
to either spelling. The lane's corpus reading agrees at 0.

**CASE: ZERO findings** over the corpus. `SuperTaskr` exists at the tip in
exactly one place, T-265's own card, quoting the mutant that produced it;
that is a record and outside every corpus by ruling.

**FILENAMES (C1's answer).** At the base seven tracked names carried the
old spelling; at the tip six do, and all six are records. The four living
ones all moved as RENAMES, not add-plus-delete: `C-07-supertaskr-index.md`
R100, `supertaskr app.dc.html` R099, `supertaskr tokens.dc.html` R098,
`method/runtime/supertaskr.yaml` R090. `git log --follow` on the template
reaches `18846899` and `1e757b6c`, both older than this lane, so history
followed the move. **The SPACE in the two prototype basenames was NOT
removed, which is correct — that is a different rename — and the lane
filed it.** I reproduced its cost myself: the docs gate invoked exactly as
`docs/CONVENTIONS.md` spells it, over this lane's own changed paths,
printed `INJECTION SCAN COULD NOT RUN` twice for a path truncated at the
space. T-264-s8 is a real card.

## The per-commit build, walked in a shared clone under scratch

T-269's criterion is `cargo build` green at EVERY commit, so I walked all
nine in a `git clone --shared`, never in a worktree of the host:

    ad141755  cargo build  exit 0
    f720ae2c  cargo build  exit 0
    142e32d3  cargo build  exit 0
    dee715c4  cargo build  exit 0
    e772ce87  cargo build  exit 0
    e432b793  cargo build  exit 0
    98121a65  cargo build  exit 0
    ece2ca61  cargo build  exit 0
    56f422e2  cargo build  exit 0

Nine for nine. I also walked the KEEPER at every commit with the module
rather than the suite, because the notes disclose a red window and a
disclosure is a claim: `every enumerated survivor class is occupied` is
RED from `ad141755` through `e772ce87` — `method-source` empties at
`ad141755` and `repository-directory` at `142e32d3` — and GREEN from
`e432b793` on. The disclosure is accurate and the window is exactly as
stated. **And the OTHER keeper never reds: unclassified survivors are
zero at every one of the nine commits and at the base.**

## The suites, run whole at my own bench at the tip judged

    parser  exit 0  bodies 389   GREEN  ref 56f422e2
    app     exit 0  bodies 1171  GREEN  ref 56f422e2
    rust    exit 0  bodies 655   GREEN  ref 56f422e2  targets 18
    e2e     exit 0  bodies 844   GREEN  ref 56f422e2  (the FULL leg)

`identifier-rename.spec.ts` alone: **9 passed**, exit 0. All six base body
names survive at the tip; one was RENAMED (`only the four enumerated
classes … in the code tree` became `only the enumerated classes … in the
corpus`) and three were added. Nothing in the living tree pins the old
body name; `docs/CAPABILITIES.md` still carries it and is the
integrator's regen.

Gates, each run by me at the tip: **docs gate census exit 0**, 0 findings;
**lint:tokens exit 0**, clean over 1440 CONTROL files; **method eval gate
exit 0** over 10 model-free evals; **boot gate exit 0** on scratch port
25265, both `[supertaskr]` lines observed. The two STALE readings are the
integrator's and are expected: `capabilities:check` exit 1 (74270
committed against 74548 fresh) and `index --check` exit 1 naming eleven
indexed files, every one of them a file this lane re-spelled.

## The criteria, one at a time

**T-264-s3 criterion 1 — MET, and the derivation is a PARSE rather than a
restatement.** `dispatch-brief.mjs` reads the lane bullet by LABEL
(`backticked("worktree")` for the lane, `BENCH_LABEL` for the bench) and
THROWS when the label is missing; `brief.rs` reads the same document by
`l.label == "worktree"`. Run for a synthetic card the arm emits
`supertaskr-T-777` and `supertaskr-V-T-777`, both derived. I proved the
parse with a data mutant rather than by reading: spelling the bullet
`supertaskr2` makes the JS derivation FOLLOW it, and reds the Rust body
`row_fours_worktree_spelling_is_read_by_its_label_and_a_planted_sibling_path_does_not_move_it`
with `left: "supertaskr2-T-900"` against `right: "supertaskr-T-900"`.
Reverting the bullet to the pre-rename spelling reds **14 bodies** across
`brief.spec.ts` and the keeper — two independent guards, not one.

**Criterion 2 — MET, and the removal is not decorative.** Re-adding
`repository-directory` to the table reds `every enumerated survivor class
is occupied` by name — the message it prints names the class
`repository-directory` and says it is named by the table and hit by
nothing. The negative arming holds too: with the class
re-added AND one matching occurrence planted, the body goes GREEN again —
so it reads the table rather than a hardcoded list.

**Criterion 3 — the field and the criterion disagree, and the executor
says so first.** Frontmatter is `blocked_by: []`; the criterion says
`blocked_by: [T-266]` is the whole of its ordering. The precondition is
met either way and nothing was mis-ordered. Recorded, not charged.

**T-264-s2 — MET, and the conditional's premise is false, honestly.**
`git grep -h -o -E 'NPUTER_[A-Z0-9_]+'` outside `docs/` returns nothing at
the tip; the launcher reads `process.env[ENV_VAR]` exactly once, so there
is no dual read. The held-back default moved to the app checkout as it now
exists, which is the correct reading of a conditional whose premise
stopped being true on 2026-09-10, and it is named in the notes. The one
thing nobody guards is a shell that still exports the pre-rename name: it
is answered by the default, silently. Filed as **T-264-s10**, not charged.

**T-265-s1 — MET, and the markers were REMOVED rather than rewritten.**
The paragraph in `docs/reference/05-dispatch.md` naming ADR-022 decision 4
and this card is gone; the parenthetical in `07-verification.md` is gone.
Read at one ref, the three strings agree: CONVENTIONS publishes
`supertaskr-T-NNN`, `supertaskr-V-T-NNN` and the app checkout;
05-dispatch spells the first two; 07-verification spells the bench.

**T-265-s3 — MET, and widened whole rather than partially.** The roots
went from five to twelve — `bin/`, `method/` and all five prose trees —
and the governing documents were added one by one because `docs/` is
mostly records. My own mutants: a survivor planted in `method/` reds
`only the enumerated classes …` naming **file and line**
(`method/roles/planner.md:130: <the line>`), which is what the criterion
asks for and not merely a count; a Cyrillic-a token reds the homoglyph
body naming `docs/future.md:83`; a capital-S name in a code span reds the
case body naming `docs/reference/12-genesis.md:164`. The three NEW classes
each name a ruling in the table itself. **The corpus reads PATHS as well
as lines**, which phase 1 predicted would survive: renaming a prototype
back reds the keeper on the path alone. I re-drilled the lane's own
disclosed fix and it holds — dropping `method/` from the roots reds by
name, and so does dropping `docs/design/`, one body each.

**T-269 — MET, with the `rel:` string guarded by a body and not only by
the compiler.** The template moved by `git mv` with history; kit.rs's
`include_str!`, its `rel:` string and the KIT_FILES expectation all name
the new path; token-scan's control entry and the interview approval string
moved; planner.md and 12-genesis.md say the new name. Phase 1's sharpest
worry here was the `rel:` string, which compiles clean when wrong: I
reverted it alone and **two** bodies red —
`every_compiled_entry_matches_its_method_file_byte_for_byte` ("unreadable:
No such file or directory") and
`the_snapshot_carries_the_driver_contracts_kickoff_set` ("runtime/
supertaskr.yaml must ride the kit"). And I did not take the genesis on
trust: I materialized the kit for real out of the built library into a
scratch directory. It produced `.supertaskr/genesis/kit/runtime/
supertaskr.yaml`, the template's own header reads `.supertaskr/
supertaskr.yaml`, the manifest stamps method version 0.1.16, and the
produced tree carries **zero** occurrences of the old spelling in any byte
or any filename.

## Security sweep

No record rewritten; no history dropped by a move; no hash, URL or base64
run rewritten (the only URL-shaped change is the remote spelling, and the
lane's judgement to move it inside a dated CI-latency comment is sound —
I MEASURED the behaviour underneath it: `gh run list --branch main` from
this bench answers for the renamed repository at exit 0 with five
completed successful runs, and the guard's argv passes no explicit
repository, so it follows the remote rather than a literal). No fixture's
expectation moved without its producer: the interview approval string and
the fake agent's transcription already disagreed at the base, the
transcription is untouched and still matches its capture, and nothing
compares the two. No binary, no mode bit, no credential, no new home path,
no dependency. The two-argument split on the space-bearing paths is real,
is pre-existing, and is filed rather than hidden.

## The mutants and controls, every one run by me

    M1  survivor planted in method/            RED   1 failed / 8 passed, names file and line
    M2  Cyrillic-a homoglyph in a prose tree   RED   1 failed / 8 passed, names file and line
    M3  capital-S name in a code span          RED   1 failed / 8 passed, names file and line
    M4  lowercase name opening a sentence      SURVIVED — expected; the prose half is T-265-s2's
    M5  repository-directory re-added          RED   1 failed / 8 passed, names the class
    M6  the runtime template's CONTROL row     SURVIVED — CORRECTION 1 below
    M7  kit.rs `rel:` reverted alone           RED   2 bodies, both naming the path
    M8  lane bullet back to the old spelling   RED   14 bodies across two independent guards
    M10 a prototype renamed back               RED   1 failed / 8 passed, on the PATH
    re-drill: method/ dropped from the roots   RED   1 failed / 8 passed, names the root
    re-drill: docs/design/ dropped             RED   1 failed / 8 passed, names the root

    C-alpha the new spelling planted in a record   nothing red — the record trees are outside
                                                   every corpus by construction, arming absent
    C-beta  the lane's and bench's own directory   no such string anywhere in the tree
    C-gamma the old spelling in a lockfile         CLASSIFIED and red; the scan does not crash
            the old spelling appended to a .png    excluded by extension; the scan does not crash
    C-delta class re-added PLUS one occurrence     GREEN again — the body reads the table

Every landing above was read from `git diff`, never from the mutator's
own report, and the tree was proved clean after each.

## The corrections

**CORRECTION 1 — the CONTROL check T-269's own criterion names can delete
itself, and does.** The criterion says the lint:tokens control corpus
SHALL still include the file under its new name, naming the `CONTROL
includes tracked text format` body as the guard. That body is a ROW in a
literal list inside `tools/e2e/scripts/token-scan.mjs`, and the row is
both the expectation and the only record that the expectation was wanted.
Measured: with the row removed, `npm run lint:tokens` prints
`lint-tokens: clean` at **exit 0** over the same 1440 files and
`token-scan.spec.ts` is **10 passed**. Nothing notices. This is the same
tautology `rename-scan.mjs`'s own header argues against for the class
table, and the same one this lane re-cut `the corpus reaches every tree
the criteria name` for at `98121a65` — reproduced one module over, in the
guard the absorbed card leans on. The body I commit derives the path the
check must name from kit.rs's compile-time embed instead of from the list
being judged. Its general form is out of this fence and is filed as
**T-264-s12**.

```mutant
correction: the CONTROL check for the kit's runtime template is derived from the tree, not restated by the list that checks it
file: tools/e2e/scripts/token-scan.mjs
spec: tools/e2e/tests/token-scan.spec.ts
body: the CONTROL corpus check for the kit's runtime template is named from the tree, not from the list that checks it
message: the tracked-text-format list names no CONTROL check for the runtime template
--- old
      "method/runtime/supertaskr.yaml",
--- new
      "method/README.md",
```

Both readings taken by my own hand on this bench, at the tip judged.
**GREEN** against the implementation carrying the property: 11 passed,
exit 0, the new body among them. **RED** against the implementation
lacking it: 1 failed / 10 passed, exit 1, and the failing body is the new
one alone, printing `the tracked-text-format list names no CONTROL check
for the runtime template method/runtime/supertaskr.yaml the kit embeds`.
One body in the kill set, landing at the site the property lives. The
anchor matches its file exactly once and the replacement text appears
nowhere in it.

**CORRECTION 2 — a section that calls itself VERBATIM stopped being
verbatim, and this is a WORDING correction that owes no mutant block.**
`docs/design/design-handoff.md` heading 8 reads "Acceptance criteria this
design feeds (T-006, verbatim)", and its three bullets are a byte-for-byte
transcription of `docs/tasks/T-006-design-language.md`'s three acceptance
criteria. The lane re-spelled two of them. T-006 is a record and keeps the
pre-rename name by ADR-022 decision 3, so at the tip the document asserts
a verbatim quotation that its own named source does not contain — the
exact failure this lane created the `verbatim-quotation` class for, one
document over and applied to a card's words instead of a person's. The
remedy is two words either way and the choice is the integrator's: restore
the two quoted lines to the spelling T-006 carries, or drop "verbatim"
from the heading and say what the section is instead. I state in as many
words, per step 5b, that this correction pins no property and therefore
carries no block: the property is a prose quotation's fidelity to a
record, nothing in this repository reads that section, and a body written
for it would be RED at the tip rather than green with a mutant to drill —
which is not the shape the merge reads.

**Not a correction, recorded.** `naming-history` holds
`docs/design/design-handoff.md` line 369, which carries the quoted name
with no etymology beside it, unlike line 22 and unlike method/README's
sentence; the notes declare it as a restatement of the wordmark note, and
that reading is defensible, so it stands. `docs/reference/12-genesis.md`
line 25 lost its column alignment inside a code fence when the name grew;
cosmetic. The card's title still says 97.

## Step 7 — the gates my own writes moved, run at my own tip

Appending a verdict and filing three cards is a commit, and the docs gate
FIRES on four paths under `docs/` — it named the app, parser and e2e
suites, and all three are green at the tip my verdict commit and my
correction commit created, `22718fbbe32e5e881ac3ba815178d5c2019af901`:

    parser  exit 0  bodies 389  GREEN  ref 22718fbb
    app     exit 0  bodies 1171 GREEN  ref 22718fbb
    e2e     exit 0  bodies 845  GREEN  ref 22718fbb  (844 plus the correction's body)

**And the gate caught me, which is why this step exists.** The card's
preflight was exit 0 before I wrote and exit 1 after: my own prose said a
class emptied "at the first commit", and the preflight reads that as an
ordinal census claim over this repository's whole history — the same
class the card's own PREFLIGHT RULING paragraph above was written for.
Reworded to name the two commits by hash instead; the preflight is exit 0
again. The three cards I filed are `status: suggested` and their preflight
is exit 3, which is what a suggested card gets — a card the schedule does
not draw has no dispatch ruling. That is not a property of these cards: I
ran the same command against `T-264-s4` and `T-264-s5`, untouched by this
lane and suggested since before it, and both answer exit 3 too.

## Verdict

**APPROVED WITH ASSIGNED CORRECTIONS.** Two corrections, one block — the
shortfall is Correction 2 and it is explained above rather than left to be
inferred. The fence held and the record trees are byte-identical; the
census fell from 318 occurrences in 55 files to 46 in 10, every one of the
sixteen corpus survivors attributed to a class whose ruling I read at its
own site and none unclassified; `cargo build` is green at all nine
commits; all four suites are green at the tip judged; nine of my ten
mutants landed as predicted or better, with the two survivors being the
one the card itself routes to another card and the one this verdict
corrects; and the four controls each behaved where the arming was absent.
The three claims this lane hands the integrator — the capabilities regen,
the graph regen and the method bump — I re-measured and they are all three
still the integrator's, with the stamp unmoved at 0.1.16 in all three
places.

Findings that are not failures are filed as **T-264-s10** (the launcher's
silent fallback for a shell still exporting the pre-rename variable),
**T-264-s11** (the occupancy body grades class ids while the table is
rows — measured: two rows of `method-source` matched nothing at the base
while the id read occupied) and **T-264-s12** (the general form of
Correction 1). None of them blocks this card.

