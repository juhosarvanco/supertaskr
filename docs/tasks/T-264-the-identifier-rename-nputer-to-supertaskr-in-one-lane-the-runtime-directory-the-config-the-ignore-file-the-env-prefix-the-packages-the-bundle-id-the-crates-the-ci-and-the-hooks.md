---
id: T-264
title: The identifier rename, nputer → supertaskr, in ONE lane — the runtime directory, the config, the ignore file, the env prefix, the packages, the bundle id, the crates, the CI workflow and the hooks, with the fixtures and pins that name them; records untouched
feature: F-01
milestone: 4
size: L
priority: 4
status: verifying
suggested_by: "@human's ruling of 2026-09-08 (ADR-022, docs/rooms/naming.md); measured at the form sitting of 2026-09-03"
blocked_by: []
touches: [app/, lib/, tools/, .claude/, .github/, README.md, CLAUDE.md, AGENTS.md, .nputerignore, .supertaskrignore, .gitignore, docs/CONVENTIONS.md, docs/ARCHITECTURE.md, docs/architecture/]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

ADR-022 names the product Supertaskr and fixes the identifier
spellings. This card lands every identifier a program reads in one
lane, because the identifiers cross the areas the form sitting measured
(app 119 files, lib 11, tools 54, .claude 4, .github 1, files carrying the old name at 0b7cecd; a
hook reads `.nputer/lane-fence.json` that brief.mjs writes that the app
reads), and a tree renamed by area is broken between the lanes. Size L:
@human approves the dispatch. No other lane runs beside it, by the
fence.

## Why this card exists

The rename is cheapest now: before T-244 packages `npx nputer`, before
any outside user holds a `.nputer/` directory, before the skills
(T-241, T-242) carry the old name into two vendors' skill directories.
The form sitting measured 318 card files and 2,529 lines carrying the
word in docs/tasks alone — those are RECORDS and stay (ADR-022 decision
3); this card moves what programs read and what CONVENTIONS spells.

## Acceptance criteria

- WHEN the lane lands THE runtime directory SHALL be `.supertaskr/`,
  the config `supertaskr.yaml`, the ignore file `.supertaskrignore`, the
  env prefix `SUPERTASKR_*` (every `NPUTER_*` variable renamed, the
  e2e port and boot port included), the packages `supertaskr`,
  `@supertaskr/parser`, `@supertaskr/e2e`, the app's product name and
  bundle identifier `dev.supertaskr.app`, the crates `supertaskr`,
  `supertaskr_lib`, `supertaskr-index`, and the CI workflow's names —
  each derived from ADR-022's list, and a case-insensitive search for the old name over app/,
  lib/, tools/, .claude/, .github/ and the root files SHALL return
  ONLY the lines this card's own notes enumerate as deliberate (a
  record quoted in a comment, a migration note).
- WHEN a fresh clone is built in CONVENTIONS' order THE four suites
  SHALL be green through the blessed runner, the graph SHALL read
  CURRENT after its regeneration (crate names move indexed symbols; the
  six dogfood pins move with them), and `npm run capabilities` SHALL
  regenerate a census whose sentences carry the new name where a test
  name did.
- WHEN a lane, a bench or the human's app checkout exists with an old
  `.nputer/` directory THE tooling SHALL refuse with a message naming
  the rename (never read the old directory silently), and the
  dispatch arm SHALL write the new one.
- IF a record under docs/checkpoints/, docs/decisions/ (before 022),
  docs/tasks/ bodies or docs/rooms/ histories carries the old name THEN it
  SHALL be left as it is — a body pins that these paths did not change
  in the lane's diff.
- WHEN CONVENTIONS spells a command or a path THE spelling SHALL be the
  new one, and the workflow-parity spec SHALL hold CI to it.
- The lane SHALL be cut from a checkpoint commit with no other lane
  live, and its verifier SHALL run the dispatch arm end to end on a
  scratch repository under the new names as its positive control.

## Implementation notes

**THE UNDERSTANDING, CONFIRMED BEFORE ANYTHING WAS TOUCHED.** This lane
lands ADR-022 decision 2's identifier list — the runtime directory, the
config, the ignore file, the `SUPERTASKR_*` environment prefix, the npm
packages and every import specifier, the app's product name and bundle
identifier, the three crates, the CI workflow's names and the hooks' own
text — inside one fence, in one lane, with no other lane beside it;
records under docs/checkpoints/, docs/decisions/ before 022, docs/tasks/
bodies, docs/rooms/ histories and docs/research/captures/ are NOT
rewritten (decision 3), the committed graph is REGENERATED rather than
edited, and docs/CAPABILITIES.md is reported STALE for the integrator
rather than regenerated here.

### What moved, per class, with the figure's ref

Diff against the lane's base `fe2a2aa73084`, measured at the tip
`873d6d07`: **289 files, +2974 / -2209, of which 111 are renames.**

- **The crates.** `supertaskr` (the root package and `default-run`),
  `supertaskr_lib`, `supertaskr-index`; the crate DIRECTORY moved with
  `git mv` to `app/src-tauri/crates/supertaskr-index/`, and its binary
  source to `src/bin/supertaskr-index.rs`. Every `-p nputer-index`
  spelling in CONVENTIONS, ci.yml, the hooks and the scripts followed.
  `Cargo.lock` is CARGO's regeneration (`cargo build`, exit 0), never a
  hand edit: the two renamed packages re-sort into place, **29
  insertions / 29 deletions**, no package arriving or leaving.
- **The ignore file.** `git mv .nputerignore .supertaskrignore`, the
  walk's `add_custom_ignore_filename` constant, the fixture
  `_nputerignore` → `_supertaskrignore` and the three Rust test names
  that spell it.
- **The JS packages.** `supertaskr` (app/package.json),
  `@supertaskr/parser`, `@supertaskr/e2e`, the `file:../lib/parser`
  dependency's name, and every `@nputer/parser` import specifier in app/
  and tools/. The three `package-lock.json` files were edited **in their
  NAME FIELDS ONLY** and then proved by `npm ci` in all three packages,
  exit 0 each.
- **The environment prefix.** **33 distinct `NPUTER_*` names** became
  `SUPERTASKR_*`, derived at the base with
  `git grep -h -o -E 'NPUTER_[A-Z0-9_]+' -- app lib tools .claude .github
  docs/CONVENTIONS.md | sort -u | wc -l` → 33. The REPO-WIDE census is
  **37**; the four not moved are `NPUTER_AGENT_`, `NPUTER_AGENT_ARGS`
  and `NPUTER_AGENT_SCENARIO` (records only) and `NPUTER_APP_WORKTREE`
  in `bin/app-dev.mjs`, which no fence this lane held could reach —
  routed as `T-264-s2`.
- **The runtime directory, the config, the CLI and the bundle.**
  `.supertaskr/`, `supertaskr.yaml`, `npx supertaskr`, `productName` and
  the window title `supertaskr`, bundle identifier `dev.supertaskr.app`.
- **The governing documents.** docs/CONVENTIONS.md, docs/ARCHITECTURE.md,
  README.md, and CLAUDE.md/AGENTS.md kept byte-identical to each other
  (`cmp` clean). Seven component files under docs/architecture/components/.
- **The committed graph.** Regenerated with
  `SUPERTASKR_UPDATE_GOLDEN=1 cargo test -p supertaskr-index --test
  self_graph -- --ignored` (exit 0). `index --check` answers **CURRENT —
  1191343 bytes, 201 files, 2542 symbols, 2441 edges**, budget 55.5%,
  954616 bytes left. **The six dogfood pins in app/test did NOT move**,
  and the reason is that the graph's SCALE did not: the crate rename
  changed 111 file paths and 17 file hashes and left the file, symbol and
  edge totals where they were. `npm test` from app/ is green at 1163
  bodies, which is the pins' own answer.

### The fence was WIDENED mid-lane, by the dispatcher, and both halves arrived

The lane began with `touches: [app/, lib/, tools/, .claude/, .github/,
README.md, CLAUDE.md, AGENTS.md, docs/CONVENTIONS.md,
docs/ARCHITECTURE.md, docs/architecture/]`, which does not reach the root
`.nputerignore` — so the ignore file, and with it the index crate's
DIRECTORY, were held and routed. At **2026-09-08T15:44:45Z** the card's
`touches:` line and `.supertaskr/lane-fence.json`'s `touchesLine` both
gained `.nputerignore`, `.supertaskrignore` and `.gitignore`,
**character for character**, written from the integration checkout at
`ebc51bc`. This lane wrote NEITHER half and proceeded on its own read of
the two files (method/roles/executor.md step 3), which is the only thing
that makes a grant one. The routed card `T-264-s1` was withdrawn
unfiled, because the grant made it unnecessary.

**WHAT THE HELD HALF COST, MEASURED, because it is the reason the two
files are one edit.** With the crate directory moved and the ignore file
held, `cargo run -p supertaskr-index -- index --check --root ../..`
answered **STALE at 252 files / 1254109 bytes / languages [js, rust, ts]**
against the committed **201 / 1188363 / [rust, ts]** — 51
deliberately-broken indexer fixture inputs admitted to the map, because
the ignore file excludes that fixture tree BY PATH. The directory move
was reverted, the crate renamed in place, and only after the grant landed
were the two moved together.

### The four deliberate survivors, enumerated — criterion 1's own list

A case-insensitive search over app/, lib/, tools/, .claude/, .github/ and
the tracked root files returns **123 occurrences at the tip**, and every
one belongs to a class in `KEPT_CLASSES` in
`tools/e2e/scripts/rename-scan.mjs`. The classes are LITERAL patterns in
that file — never derived from the corpus they judge — and
`only the four enumerated classes of the pre-rename identifier survive in
the code tree` is the body that holds the set to them:

- **`repository-directory` (108)** — the repository directory `nputer`,
  its remote `github.com/juhosarvanco/nputer`, and every sibling
  worktree named after it: `../nputer-app` (@human's live app checkout),
  `../nputer-T-NNN`, `../nputer-V-T-NNN` and their interpolated fixture
  spellings. ADR-022 decision 4 makes the repository rename @human's and
  `T-266` is the checklist; `brief.mjs` DERIVES its lane paths from
  CONVENTIONS' published spelling, so moving them here would name
  siblings of a directory nobody has. Routed as `T-264-s3`,
  `blocked_by: [T-266]`.
- **`method-source` (9)** — `runtime/nputer.yaml` in `KIT_FILES`
  (`include_str!` of a file under `method/`, which is T-265's), the
  `BANKING_MAP` stage-0 cell in `app/src/genesis/genesis-derive.ts`, and
  the needle in `kit.rs`'s
  `the_shipped_plan_interview_still_carries_the_normative_banking_map`.
  All three are VERBATIM quotations of `method/` files. **Both of the
  last two were renamed by the first pass and both RED BY NAME** —
  `every cell of the 9-row table matches plan-interview.md verbatim`
  (app suite) and the kit body (cargo, exit 101) — which is the tree
  saying that a copy may not move ahead of its source.
- **`capture-transcription` (3)** — the fake agent's denial fixture,
  transcribed byte for byte from
  `docs/research/captures/real-planner-turn-2026-08-19.jsonl`. Renaming
  it reddened `the_tool_denied_fixture_is_a_transcription_not_a_construction`
  against the capture it claims to quote.
- **`migration-refusal` (3)** — `LEGACY_RUNTIME_DIR` and its account in
  `.claude/hooks/lane-fence.mjs`, the one place the old name is the
  SUBJECT rather than a leftover.

**One survivor sits outside that search and is named here rather than
left to be found**: `docs/architecture/components/C-07-nputer-index.md`
keeps its FILENAME. Its `id:`, `name:` and `paths:` all carry the new
name; the parser keys on the frontmatter and never on the filename, and
four RECORDS cite the path by name — renaming it would dangle four
citations that ADR-022 decision 3 forbids repairing.

### Criterion 3 — the migration refusal

`legacyRuntimeDirProblem(root)` in `.claude/hooks/lane-fence.mjs` detects
a pre-rename `.nputer/` directory and returns a problem naming ADR-022,
the old directory, the new one and the two commands that re-arm a
checkout. It is called from `readManifest`'s absent-manifest branch and
from `readToken`'s ENOENT branch — the two sentences that would otherwise
have hidden a migration behind *"no fence manifest"* and *"nothing has
been measured in this checkout"*. **Nothing reads the old directory**:
the bodies assert the absence of `manifest` and `token` in the result.
The directory name now has ONE home (`RUNTIME_DIR` moved down to
`lane-fence.mjs`; `gate-token.mjs` re-exports it) because the detector
has to sit below both readers. The check is `statSync(...).isDirectory()`
rather than `existsSync`, so an ordinary FILE at the old path is not
refused for a migration it never had — its own body, with M5 as the
mutant.

### The poison drill — six mutants, six kills, restored by sha256

Run in a DETACHED SCRATCH WORKTREE at `873d6d07`
(`/private/tmp/drill-T-264`, removed afterwards), never in the lane; one
side per mutant, every landing read back with `git diff` before the run.
Baseline: 6 bodies, exit 0.

| mutant | side | landing | failing bodies |
|---|---|---|---|
| M1 | the CORPUS | `// target/debug/nputer` appended to `app/src/main.tsx` | 1 — the survivor body |
| M2 | the CLASSIFIER | `repository-directory`'s pattern widened to a catch-all `/nputer/i` | 1 — caught by the body's POSITIVE CONTROL, which is the only thing that can see a classifier that says yes to everything |
| M3 | the RECORDS | the old name stripped from `docs/checkpoints/2026-08-27-T-092.md` | 1 — the records body's floor |
| M4 | the DETECTOR | `legacyRuntimeDirProblem` returns `null` unconditionally | 3 — the whole migration family, which share that function as their subject |
| M5 | the DETECTOR | `existsSync`-shaped test in place of `.isDirectory()` | 1 — the FILE-at-the-old-path body alone |
| M6 | the CLASS TABLE | a `phantom` class nobody hits added to `KEPT_CLASSES` | 1 — the occupancy body |

Restoration proved by sha256 against the commit, worktree side equal to
commit side on every one: `app/src/main.tsx`
`60ac020ca32ccb437bc81350bcc3be0e59eaddb83d722ab56376d6e18763ef00`;
`tools/e2e/scripts/rename-scan.mjs`
`44c4674fc20cb1b274383a9750a0c15e3ffa4b2860cda1b9c018e4b8710bb871`;
`.claude/hooks/lane-fence.mjs`
`a7768da81c518e83a3e6b797c46158d58e53dd162c96efb5d762af1f78e610ac`;
`docs/checkpoints/2026-08-27-T-092.md`
`79ee1d83ee1aaddf8237a6dfc68c2444bbe1aaa6980abb27573379e9a44ea474`.

**THE TAUTOLOGY WAS RE-ANCHORED RATHER THAN LEFT.** The survivor body's
expected side could have been derived from the same scan it judges; it is
not. The classes are literals in `rename-scan.mjs`, the positive control
feeds the classifier a line the table does not cover and requires `null`,
and the file-scoped classes are proved SCOPED — the same text that is
deliberate inside the migration refusal is a defect in
`push-guard.mjs`. The records body's floors are literals measured at
`fe2a2aa` and its query is shown able to answer `[]` before its numbers
are believed.

### Every command, in the order run, with its exit and its count

Read from `$?` unpiped. Setup, at the base: `npm ci` + `npm run build`
from lib/parser/ **0**; `npm ci` from app/ **0**; `npm ci` from tools/e2e/
**0**. After the rename, all three reinstalled from the renamed
lockfiles: parser **0**, app **0**, e2e **0**.

| command | exit | count |
|---|---|---|
| `cargo build` from app/src-tauri/ | 0 | Cargo.lock regenerated, 29/29 |
| `SUPERTASKR_UPDATE_GOLDEN=1 cargo test -p supertaskr-index --test self_graph -- --ignored` | 0 | 1 passed |
| `cargo run -p supertaskr-index -- index --check --root ../..` | 0 | CURRENT, 1191343 bytes / 201 files / 2542 symbols / 2441 edges |
| `npm run build` from app/ | 0 | tsc + tsc -p tsconfig.test.json + vite build |
| `node tools/e2e/scripts/gate-run.mjs parser` | 0 | **377 bodies**, GREEN |
| `node tools/e2e/scripts/gate-run.mjs app` | 0 | **1163 bodies**, GREEN |
| `node tools/e2e/scripts/gate-run.mjs rust` | 0 | **639 bodies**, 18 targets, GREEN |
| `SUPERTASKR_E2E_PORT=15264 node tools/e2e/scripts/gate-run.mjs e2e` | 0 | **690 bodies**, GREEN, ref `873d6d07` |
| `npm run lint:tokens -- --selftest` from tools/e2e/ | 0 | 65 TOKEN + 4 CONTROL samples, 90 walk-policy, 9 evidence-floor |
| `npm run lint:tokens` from tools/e2e/ | 0 | TOKEN 177 files, CONTROL 1262 tracked text files |
| `npm run typecheck` from tools/e2e/ | 0 | — |
| `npm run lint:docs` from tools/e2e/ | 0 | whole-tree half, 0 findings |
| `npm run capabilities:check` from tools/e2e/ | **1** | **STALE** — committed 58326 bytes, fresh 58883 |
| `cargo audit` from app/src-tauri/ | 0 | 0 vulnerabilities, 7 allowed warnings |
| `SUPERTASKR_BOOT_PORT=14521 npm run boot:check` from tools/e2e/ | 0 | both `[supertaskr]` lines |
| `node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only main "$TREE")` | 1 | FIRES, 13 paths, four suites — all four run green |

**THREE REDS WERE MINE AND WERE FIXED**, each named because a rename's
failures are its only real evidence: `every cell of the 9-row table
matches plan-interview.md verbatim` and
`the_tool_denied_fixture_is_a_transcription_not_a_construction` and
`the_shipped_plan_interview_still_carries_the_normative_banking_map`
(the three verbatim-quotation survivors above), and
`THE ARM LEAVES EXACTLY WHAT THE EIGHT HAND STEPS LEAVE, file for file`,
where the fixture's `nputer-${FIXTURE_CARD_ID}` had been renamed while
the arm still derives that path from CONVENTIONS' published, and
deliberately unrenamed, `../nputer-T-NNN` — eleven interpolated lane
names in six files were reverted with it.

**TWO REDS WERE THE LANE'S OWN STATE AND ARE NOT DEFECTS**, both
observed on the FIRST e2e run and gone on the second, at the same tip:
`one runtime-built control byte reds all seven first-party roots at exact
byte offsets` (it requires a diff-clean tree and the rename was
uncommitted) and the four `shell-frame` bodies, whose live-docs snapshot
counted one parse failure more than it asked for — that failure was
**my own suggestion card `T-264-s2`, whose title opened with a
backtick**, the exact hazard `docs/CONVENTIONS.md`'s DOCS GATE bullet
records at `9c64cd8`. It was retitled. **And the instrument that should
have caught it did not**: `npm run lint:docs` answered exit 0 and *"every
live task card's frontmatter parses"* over the same tree, because
`liveTaskCards()` reads `git ls-files` and the card was still UNTRACKED.
That is a real gap in the gate a lane runs BEFORE it commits, and it is
routed below.

### The census, reported and NOT regenerated

`npm run capabilities:check` exits **1 — STALE**, committed 58326 bytes
against a fresh 58883. It is outside this lane's fence and
`docs/CAPABILITIES.md` is the integrator's to regenerate IN THE MERGE
COMMIT (docs/CONVENTIONS.md's `npm run capabilities` bullet). What moved:
six new sentences from `tools/e2e/tests/identifier-rename.spec.ts`, and
three existing sentences whose names carry the renamed identifiers —
`.supertaskrignore still excludes docs/ …` and the two
`SUPERTASKR_BOOT_PORT=1420 …` bodies, whose names interpolate the
constant.

### What was routed, and what is left for T-265

- `T-264-s2` — `bin/app-dev.mjs`'s 34th `NPUTER_*` variable; `bin/` is
  outside even the widened fence.
- `T-264-s3` — the `repository-directory` class, blocked on `T-266`.
- `T-264-s4` — whether `productName` and the window title are PROSE and
  take ADR-022's capital S. They landed as the lowercase identifier,
  which changes the case of nothing; the ruling is T-265's.
- `T-264-s5` — the docs gate's frontmatter half judges the TRACKED
  corpus, so a malformed card reds `lib/parser`'s live-tree smoke while
  `npm run lint:docs` answers clean.
- **For T-265**: `method/runtime/nputer.yaml` and
  `method/interview/plan-interview.md`'s stage-0 cell are the two
  `method-source` survivors, and moving either without the other's
  reader reds a body by name — `kit.rs`'s needle and `BANKING_MAP`
  respectively. Both carry the reason at the site.

### For the verifier

The card's sixth criterion asks the verifier to run the dispatch arm end
to end on a scratch repository under the new names as its positive
control. `tools/e2e/tests/brief.spec.ts`'s
`THE ARM LEAVES EXACTLY WHAT THE EIGHT HAND STEPS LEAVE, file for file`
is that arm run against a fixture repository, and it is green at the tip
— but it is a body this lane FIXED, so a bench should drive
`brief.mjs --dispatch-lane` by hand as well.
