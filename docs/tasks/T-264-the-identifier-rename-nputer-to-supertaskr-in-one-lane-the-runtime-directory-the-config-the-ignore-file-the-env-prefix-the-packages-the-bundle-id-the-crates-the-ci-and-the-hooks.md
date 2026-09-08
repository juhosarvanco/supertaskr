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

## Verdicts

### 2026-09-08 — claude-opus-5@subagent (phase 2)

VERDICT: APPROVED WITH ASSIGNED CORRECTIONS

attack set: sha256:6551265776fb9f0e9b0b24f74e6bcd484e220e4df5e645c5dabcbdb18cc9701d (attack-set-T-264.md)
ground truths: sha256:678d9f2e88932662acacdeb2efffbf68c5a0c481c92067959cd012725cdb06fb (ground-T-264.md)
base: fe2a2aa73084a36e625705d1d739bdd679c41143
tip: 69b86b1a0de10f27fd1eb9e522c0f7de2e69ecb9 (6 commits, read by `git rev-list`, never by subject)
fence ref: main at ebc51bc (2026-09-08T18:44+03:00), `touches:` at fourteen expanded paths — the widened line, read from main and never written
bench: /Users/ujju/Projects/nputer-V-T-264, detached at the tip

**THE FRAME I ACTUALLY HAD, disclosed because a later reader cannot tell
otherwise.** Two spawns. Phase 1 wrote the attack set at the base ref
and reports zero tool calls; **this harness cannot deny a subagent
tools, so phase 1's no-tool property was kept by INSTRUCTION and
SELF-REPORT, not by the spawn** — the same disclosure every verdict this
wave carries, until T-261 makes phase 1 a defined agent type. I am a
fresh spawn with tools and read, in order: the card at `fe2a2aa`; the
attack set (digest verified before opening); the ground truths (digest
verified); ADR-022 at `fe2a2aa`; STATE, ARCHITECTURE and CONVENTIONS at
the tip; **and only then the diff**. My brief's duties section named the
executor's own suite figures (parser 377, app 1163, rust 639, e2e 690)
and a mutant count, **which is executor-derived material above the line
— I say so rather than pretending otherwise**, and every one of those
figures is re-derived below from my own unpiped `$?`. The executor's
Implementation notes were opened AFTER the diff, to enumerate claims.

**THE DISPATCHER'S SCOPE RULING IS APPLIED**: identifier spellings left
under `method/` are not F2 for this lane, because `method/` is outside
its fence. They are recorded below as findings routed to `T-265`.

---

## 1. THE FOUR SUITES AND THE OWED GATES, at the tip, from the bench root

Every exit read from `$?` unpiped; every count beside it. Legs through
the blessed runner (`node tools/e2e/scripts/gate-run.mjs <leg>`), with
`SUPERTASKR_E2E_PORT=25264` — the renamed variable, at the bench port
CONVENTIONS' rule fixes for card 264.

| command | exit | count | baseline (G16, battery46 at f9ec5eb) |
|---|---|---|---|
| `gate-run.mjs parser` | **0** | 377 bodies, 1 target, GREEN | 377 — equal |
| `gate-run.mjs app` | **0** | 1163 bodies, 1 target, GREEN | 1163 — equal |
| `gate-run.mjs rust` | **0** | 639 bodies, 18 targets, GREEN | ok/ok |
| `gate-run.mjs e2e` | **0** | 690 bodies, 1 target, GREEN | 684 — **+6, and the six are named** |
| `npm run lint:tokens -- --selftest` | **0** | 65 TOKEN + 4 CONTROL samples, 90 walk-policy, 9 evidence-floor | — |
| `npm run lint:tokens` | **0** | TOKEN 177 files, CONTROL 1268 tracked text files | — |
| `npm run lint:docs` | **0** | whole-tree half, 0 findings, 4 governing budgets hold | — |
| `npm run typecheck` | **0** | — | — |
| `npm run capabilities:check` | **1** | **STALE** — committed 58326 bytes, fresh 58883 | expected; see correction 1 |
| `cargo audit` (app/src-tauri) | **0** | 0 vulnerabilities, 7 allowed warnings | unchanged; the diff adds no dependency |
| `cargo run -p supertaskr-index -- index --check --root ../..` | **0** | **CURRENT** — 1191343 bytes, 201 files, 2542 symbols, 2441 edges | scale identical to G14's 201 files / 2441 edges |

The `+6` is exactly `tools/e2e/tests/identifier-rename.spec.ts`. I
compared the whole e2e test-name set: base names normalised through
`s/nputer/supertaskr/gi` against the tip's, `comm -23` returns **no
deleted body** (the two apparent deletions are `UNRESOLVABLE_TOKEN_RE.test(...)`
assertion lines my grep caught, whose old spelling is a deliberate
survivor), and `comm -13` returns exactly the six new sentences. No
`.skip`, `.only`, `.todo`, `test.fixme` or new `#[ignore]` is added
anywhere in the diff; rust reports 1 ignored across 18 targets, the
pre-existing real-CLI and golden-regen bodies. Runner configs move by
rename only: `gate-run.mjs` 6 lines, `playwright.config.ts` 2,
`app/vite.config.ts` 2 — every one a spelling.

**A2.2, the skip-as-green control, run rather than assumed**: pointed at
a nonexistent config the harness exits **1** (`does not exist`); given a
spec pattern matching nothing it exits **1** (`No tests found`). Missing
is not skip here.

---

## 2. THE ATTACK SET, A1.1 – A6.4

### AC-1 — the identifiers, and the enumeration

**A1.1 the self-serving allowlist — ANSWERED, and the enumeration is
better than the criterion asked.** It is not prose: it is
`KEPT_CLASSES` in `tools/e2e/scripts/rename-scan.mjs`, LITERAL frozen
patterns, held to by `only the four enumerated classes of the pre-rename
identifier survive in the code tree`. I re-took the census myself over
AC-1's own areas at the tip — `git grep -in nputer 69b86b1 -- app lib
tools .claude .github` plus the five tracked root files — and got **140
lines / 171 occurrences, every one lowercase** (G2's 126 `NPUTER` and 2
`Nputer` are gone). Subtracting the scan's two self-excluded
implementation files leaves **15 non-`repository-directory` survivors**,
and I classified each by hand against the table rather than by running
the tool:

- `.claude/hooks/lane-fence.mjs` ×3 → `migration-refusal`
- `app/src-tauri/src/agent/kit.rs` ×5 → `method-source` (4 are
  `runtime/nputer.yaml`, incl. a compile-time `include_str!`; 1 is the
  banking-map needle)
- `app/src-tauri/src/bin/fake_agent.rs` ×3 → `capture-transcription`
- `app/src/genesis/genesis-derive.ts` ×2 → `method-source`
- `app/test/interview-chat-dom.test.tsx:773` → `method-source`
- `tools/e2e/scripts/token-scan.mjs:1235` → `method-source`

**No unenumerated line.** And the three that ARE program-resolved paths
(`include_str!` of `method/runtime/nputer.yaml`, `token-scan`'s literal
path to the same file, and `LEGACY_RUNTIME_DIR`) resolve to things that
exist and are correct: the first two point at a file `method/` still
carries by the scope ruling, and the third is the subject of the
refusal.

**A1.2 deletion masquerading as rename — ANSWERED.** `git diff
--name-status -M50%`: **111 R, 173 M, 6 A, ZERO D.** `.nputerignore →
.supertaskrignore` is `R085`, and `diff <(sed s/nputer/supertaskr/g
old) new` is **byte-identical modulo the word**, 18 lines both sides.
Functional proof that the file is read BY THAT NAME: appending
`app/src/architecture/` to `.supertaskrignore` turns `index --check`
**STALE (exit 1)** — mutant M11.

**A1.3 the dynamic shim — ANSWERED, none.** Over the 3326 added lines:
no `atob`, no `Buffer.from(...,'base64')`, no `String::from_utf8`, no
`"N" +` concatenation, no `format!` assembling the old name near env or
path resolution. Black-box: with `.nputer/` planted and only the old
variables reachable, the readers refuse rather than fall back (§3).

**A1.4 the lockfiles — ANSWERED**, see F5.

**A1.5 the write/read seam — ANSWERED.** `git grep '\.nputer/lane-fence\.json'`
over app, lib, tools, .claude, .github and the root files returns
**nothing**. `MANIFEST_REL_PATH` has ONE home
(`` `${RUNTIME_DIR}/lane-fence.json` `` in `lane-fence.mjs`), `RUNTIME_DIR`
one definition, `gate-token.mjs` re-exports rather than restating.
End-to-end proof is the AC-6 control in §4.

**A1.6 a compatibility shim — ANSWERED, none.** `git ls-files -s | awk
'$1==120000'` → **0 symlinks**. No alias branch, no fallback read of the
old spelling anywhere but the refusal. Package names at the tip:
`supertaskr`, `@supertaskr/parser`, `@supertaskr/e2e`; no `bin` key on
any of the three; the only `@`-scoped dependency is
`@supertaskr/parser`.

**A1.7 `[lib] name` retained — ANSWERED, no.** `[package] name =
"supertaskr"`, `default-run = "supertaskr"`, `[lib] name =
"supertaskr_lib"`, `members = ["crates/supertaskr-index"]`,
`default-members = [".", "crates/supertaskr-index"]`, the path dep
`supertaskr-index = { path = "crates/supertaskr-index" }`, and the index
crate's `[package]`/`[[bin]]` name plus `path = "src/bin/supertaskr-index.rs"`.
`cargo build --locked` in a FRESH CLONE: **exit 0**. Mutant M6 (`[lib]
name` back to `nputer_lib`) fails compilation at **exit 101**.

**A1.8 the bundle id changed in one place — ANSWERED, no.**
`tauri.conf.json` carries `productName: supertaskr`, `identifier:
dev.supertaskr.app`, window `title: supertaskr`; the one capability file
carries `"identifier": "default"` and named the bundle id at neither ref
(G8: 0). No plist or entitlements file exists. No hard-coded
`target/release/<binary>` path in `.github/`. **The bundle id has no
body of its own — its guard is the corpus scan**, and I proved that
guard live: M5a (`dev.nputer.app`) and M5b (a capability identifier
carrying the old name) each red the survivor body. The orphaned
app-support directory a bundle-id change leaves behind is a finding, not
a rejection, and `T-264-s4` already holds the adjacent ruling.

**A1.9 the search area excludes the misses — ANSWERED under the scope
ruling**, findings in §6.

**A1.10 `.gitignore` and settings allow-rules — ANSWERED.** `.gitignore`
is **untouched by the diff, correctly**: it named neither runtime
directory at either ref, because the runtime directory is made
un-committable by the self-ignoring `.gitignore` its own writers drop
inside it. I verified that round trip live: after the arm ran on a
scratch clone, `.supertaskr/.gitignore` carries `RUNTIME_DIR_IGNORE`
verbatim and `git status --porcelain` in that lane is **EMPTY**. No
`.claude/settings*.json` rule names either directory, at either ref, so
none was dropped.

**A1.11 case variants — ANSWERED.** Base casings (G2): 126 `NPUTER`, 2
`Nputer`, 1271 `nputer`. Tip over the same areas: **171 `nputer`, 0
`NPUTER`, 0 `Nputer`.** Every uppercase and mixed-case bucket is
accounted for; `git grep -o 'NPUTER_[A-Z0-9_]*'` over app, lib, tools,
.claude, .github and CONVENTIONS returns **nothing**, and repo-wide only
`bin/app-dev.mjs`'s `NPUTER_APP_WORKTREE` (outside the fence, routed as
`T-264-s2`).

**A1.12 workspace consumers — ANSWERED.** `git grep '@nputer/'` over the
code tree: **none**. Fresh clone, `npm ci` in all three packages: exit 0
each.

### AC-2 — fresh clone, graph, census

**A2.1 green by subtraction — ANSWERED, no.** Counts, name sets, skip
markers and runner configs, all above.

**A2.2 skip-as-green — ANSWERED**, control above.

**A2.3 a "fresh clone" that isn't — ANSWERED by doing it.**
`git clone --no-hardlinks` from the bench into a scratch directory,
detached at the tip, `HOME` a fresh empty temp directory, minimal `PATH`,
no copied caches. CONVENTIONS' order literally: `lib/parser` `npm ci`
**0** + `npm run build` **0**; `app/` `npm ci` **0** + `npm run build`
**0**; `tools/e2e` `npm ci` **0**; `cargo build --locked` **0**.
*(Disclosure: the first `cargo` attempt exited 1 under a fully isolated
`HOME` because rustup could not resolve a toolchain — a property of my
sandbox, not of the diff. I restored `RUSTUP_HOME`/`CARGO_HOME` and
re-ran; the source tree stayed the fresh clone.)* `Cargo.lock` is
**unchanged by the build**.

**A2.4 the graph reads CURRENT without being regenerated — ANSWERED, no,
and this is the strongest single result.** In the fresh clone I DELETED
`docs/architecture/graph.json`, scrubbed the index caches, and
regenerated from scratch with `SUPERTASKR_UPDATE_GOLDEN=1 cargo test -p
supertaskr-index --test self_graph -- --ignored` (**exit 0**), then:

    git diff --exit-code -- docs/architecture/graph.json   →  exit 0

**The committed graph is a true regeneration, byte for byte.** Scale is
not collapsed: 201 files / 2542 symbols / 2441 edges, against G14's
base 201 / 2441 edges. Zero old-name symbols.

**A2.5 the six dogfood pins hand-edited — ANSWERED, no.** The executor's
claim is that the pins did not move because the graph's SCALE did not.
I tested the converse with two DATA mutants on `graph.json` in a scratch
worktree: swapping **one** `supertaskr-index` occurrence back reds
`index --check` (**exit 1, STALE**) **and 4 of 18 dogfood bodies**;
dropping 20% of the file nodes reds `index --check` and **5 of 10**. The
pins are computed from the graph and cannot be satisfied by a hand edit.

**A2.6 the census regenerated but stale or hand-edited — ANSWERED**, see
correction 1: it is STALE by design and I have the exact delta.

**A2.7 audit pins keyed by crate name — ANSWERED.** G12 shows no
`audit.toml`/`deny.toml` with crate-keyed entries; `cargo audit` exits
**0** over a lockfile whose only change is the two workspace packages.

### AC-3 — the migration refusal

**A3.1 refusal in one entry point only — ANSWERED, no.**
`legacyRuntimeDirProblem(root)` sits below BOTH readers and is called
from `readManifest`'s absent-manifest branch and `readToken`'s ENOENT
branch — the two sentences that would otherwise hide a migration behind
*"no fence manifest"* and *"nothing has been measured"*. Both verified
live in §4.

**A3.2 warn-and-continue — ANSWERED, no.** The `PreToolUse` fence hook
exits **2** on a checkout carrying `.nputer/`, and the refusal names the
old directory, the new one, ADR-022 and the two commands that re-arm.
The old directory's bytes never reach the caller: `'manifest' in result`
and `'token' in result` are both **false**.

**A3.3 cwd-relative existence check only — ANSWERED, all three arms.**
Repo root: refuses. `cwd` two levels down (`app/src`): **refuses, exit
2** — the hook resolves the worktree root, not the working directory.
A `HOME`-shaped directory carrying `.nputer/`: the detector answers with
the problem.

**A3.4 the message doesn't name the rename — ANSWERED, it does**, both
spellings plus the migration instruction, quoted in §4.

**A3.5 the arm writes the directory but not a governing manifest —
ANSWERED**, §4.

**A3.6 false refusal at the boundaries — ANSWERED, and the boundaries
are deliberate.** An ordinary FILE at `.nputer` is NOT refused
(`statSync(...).isDirectory()`, with its own body and the executor's M5
behind it). **BOTH directories present**: the new manifest is read and
no migration is reported — which is right, because a checkout armed
under the new name with an inert leftover is migrated, and refusing it
would block a correct tree. Recorded as a noted boundary, not a defect.

### AC-4 — records untouched

**A4.1 touch-and-revert — ANSWERED, no.** `git log --name-only
fe2a2aa..69b86b1 -- docs/checkpoints docs/decisions docs/tasks
docs/rooms` returns **two commits and five paths**: T-264's own card
(twice) and the four `T-264-s*` suggestions. No checkpoint, decision or
room file appears in ANY commit of the range.

**A4.2 the pin's scope exempts the damage — ANSWERED, and this is my one
substantive finding**, filed as `T-264-s6`. See §6.

**A4.3 records renamed rather than rewritten — ANSWERED, no.** No `R`
entry anywhere under `docs/`; per-tree file counts unchanged
(checkpoints 81, decisions 22, rooms 12; tasks 586 → 590, the four new
suggestions).

**A4.4 ADR-022 or an older decision edited — ANSWERED, no.** Blob
manifest for `docs/decisions` is identical, all 22 entries.

**A4.5 the old-name census under docs/ shifts — ANSWERED**, subsumed by
the blob comparison, which is stricter.

### AC-5 — CONVENTIONS and the parity spec

**A5.1 parity against a stored copy — ANSWERED, no**, and the two halves
are independently load-bearing. `tools/e2e/tests/workflow-parity.spec.ts`
(65 KB; G17's *"0 lines"* is a ground-truth script artefact — the file
exists and reads CONVENTIONS and the workflow at run time). Kill sets:

- **M9** (one command spelling changed in CONVENTIONS, workflow
  untouched) → `{648, 679, 904, 928}`
- **M10** (the same step changed in the workflow, CONVENTIONS untouched)
  → `{663, 679}`

**Neither contains the other** (M9 has 648/904/928; M10 has 663), so
both directions are held. Verifier.md 2b's containment test, not the
count.

**A5.2 parity covers commands but not env names — ANSWERED.**
`grep -i nputer docs/CONVENTIONS.md` returns **10 lines and every one is
the `repository-directory` class** (`../nputer-T-NNN`, `../nputer-app`,
`/Users/ujju/Projects/nputer`) — the checkout spellings this machine
actually has, which T-266 moves and which it would be FALSE to move
here. `NPUTER_*` in CONVENTIONS: **zero**. `SUPERTASKR_*`: four, and I
checked each is read by code — `SUPERTASKR_BOOT_PORT` (boot-port.mjs),
`SUPERTASKR_CANCEL_CI` (push-guard.mjs), `SUPERTASKR_E2E_PORT`
(playwright.config.ts, preflight.ts), `SUPERTASKR_UPDATE_GOLDEN` (the
three index-crate test files). The workflow sets `SUPERTASKR_UPDATE_GOLDEN`
and no `NPUTER_*`. **Behavioural**: I ran the whole e2e leg at
`SUPERTASKR_E2E_PORT=25264` and every mutant run at 25266, and the
server bound the given port each time — the variable is live under its
new name, and the arm's own ledger derives `SUPERTASKR_E2E_PORT=15022`
from CONVENTIONS for the lane it cut.

**A5.3 CONVENTIONS spells a command that does not exist — ANSWERED, no.**
Every `npm run <x>` it spells resolves to a script in one of the three
package.json files.

**A5.4 CI green by omission — ANSWERED, no.** `.github/workflows/ci.yml`:
**291 lines and 24 named steps at BOTH refs**; the whole diff is 4
lines, all spelling. No `continue-on-error`, no `if: false`, no
`|| true` anywhere in the file (the single match is a comment saying
*never* continue-on-error). Cache keys moved with nothing dropped.

### AC-6 — the cut, and the control

**A6.3 not cut from a checkpoint / another lane live — ANSWERED.**
`git rev-list fe2a2aa..69b86b1` is **6 commits, no merge**. G20 records
one lane at dispatch, and `git worktree list --porcelain` during this
pass shows exactly one `refs/heads/task/` entry
(`task/T-264-identifier-rename`); every other checkout is detached.

**A6.1, A6.2, A6.4 — the control, run both ways, in §4.**

---

## 3. THE FALSIFIERS

| | verdict | evidence |
|---|---|---|
| **F1** a record rewritten | **NO** | Blob manifests from `git ls-tree -r 69b86b1` against the sealed `blobs-*-T-264.txt`: checkpoints 81/81 **identical**, decisions 22/22 **identical**, rooms 12/12 **identical**; tasks differs only in T-264's own card's blob and four added suggestions. Plus the touch-and-revert log above. |
| **F2** a program-read path left on the old name | **NO** (within the fence and the scope ruling) | The 15 survivors classified by hand in A1.1; the three program-resolved ones resolve correctly. `method/` and `bin/` are outside the fence — routed, §6. |
| **F3** a silent read of the old runtime directory, incl. fail-open | **NO** | `'manifest' in result` / `'token' in result` both false under a planted `.nputer/`; and with the manifest DELETED the hook exits **2** rather than allowing. |
| **F4** green by subtraction | **NO** | Counts equal or up, name sets compared, no skip markers, no runner narrowing. |
| **F5** lockfiles hand-edited or bulk-regenerated | **NO** | Extracted `(path, version, integrity)` triples from all three npm lockfiles and diffed against the sealed `lock-baseline-*-T-264.txt`: `lib/parser` **identical (106/106)**, `tools/e2e` **identical (9/9)**, `app` differs in **exactly one entry** — the `file:` workspace link key `node_modules/@nputer/parser → node_modules/@supertaskr/parser`, which carries no integrity. **Every resolved version and every integrity hash is unchanged.** `Cargo.lock`: 29/29, and the whole diff is the two workspace packages re-sorting; no third-party package arrives or leaves. Proved by `npm ci` ×3 and `cargo build --locked` in the fresh clone. |
| **F6** a compatibility shim | **NO** | Zero symlinks, no alias, no fallback, no old spelling in any package or crate name. |
| **F7** a tautological body | **NO** | The migration bodies import both constants, so a constant swap could have been invisible — M1 proves it is not: the POSITIVE CONTROL (`the ordinary refusal must NOT name the old directory`) reds. M6 (the classifier widened to `/nputer/i`) is caught by the survivor body's own control. M6b (a phantom class) by the occupancy body. |
| **F8** the graph or the pins faked | **NO** | Delete-and-regenerate in a fresh clone → `git diff --exit-code` **0**; the pins red under two data mutants. |
| **F9** secrets or unsafe defaults | **NO** | §5. |

---

## 4. AC-6's POSITIVE CONTROL — MINE, RUN BOTH WAYS

Both arrangements are **fresh `git clone --no-hardlinks`** checkouts into
scratch directories, detached at the tip, with a temp `HOME` and no
copied caches. **A6.2: `ls -a` on both, before anything ran, showed
NEITHER runtime directory.**

### (i) The clone SEEDED with a pre-rename `.nputer/` — the tooling must refuse BY NAME

Seeded `.nputer/{gate-verdict.json,lane-fence.json,holder.json}`.

    $ printf '{"tool_name":"Write","tool_input":{"file_path":".../app/x.ts"},"cwd":"<root>"}' \
        | node .claude/hooks/lane-fence-hook.mjs
    LANE FENCE: no fence manifest at .supertaskr/lane-fence.json: <root> still carries the
    pre-rename `.nputer/` runtime directory, which ADR-022 renamed to `.supertaskr/` (T-264).
    Nothing reads the old one. Re-arm this checkout — `brief.mjs --write-fence` rewrites a
    lane's manifest and `gate-run.mjs` re-mints a verdict token — then remove `.nputer/`.
    EXIT=2

    (same command with cwd two levels down, in app/src)                       EXIT=2

    readManifest(root) -> {"problem":"no fence manifest at .supertaskr/lane-fence.json: … `.nputer/` … `.supertaskr/` (T-264) …"}
    readToken(root)    -> {"problem":"no verdict token at .supertaskr/gate-verdict.json: … `.nputer/` … `.supertaskr/` (T-264) …"}
    read the old manifest? false   read the old token? false

**AND THE CONTROL IS A CONTROL BECAUSE THE ARMING DIFFERS**, which is the
thing verifier.md 2b says to show rather than assert: on a detached
scratch checkout the hook DECLINES (`not-judged-detached`, exit 0), and
only once the clone is on a lane branch does the refusal arm run. The
same clone, with `.nputer/` removed, gives the ordinary refusal that
names neither spelling — which is exactly what the spec's own positive
control asserts and what makes the migration arm mean anything.

### (ii) The CLEAN clone — the dispatch arm end to end, then the hook's deny

    $ node tools/e2e/scripts/brief.mjs --dispatch-lane T-022 --slug front-door \
        --executor claude-opus-5@bench --verifier claude-opus-5@bench --scratch <tmp>
    ARM EXIT=0
    step 1 stamp: exit 0      step 5 manifest: exit 0 — read <lane>/.supertaskr/lane-fence.json
    step 2 cut: exit 0        step 6 bench: exit 0
    step 3 preflight: exit 0  step 7 brief: exit 0
    step 4 fence: exit 0      step 8 port: exit 0 — lsof -nP -iTCP:15022 -sTCP:LISTEN

The manifest it wrote is **governing**, not decorative: version 1,
`taskId: T-022`, `branch`, `worktree`, `card`, `touchesLine`, **44
expanded paths**, `excluded: []`, `alwaysWritable: ["docs/tasks"]`, one
token. Beside it, `.supertaskr/.gitignore` carrying `RUNTIME_DIR_IGNORE`
verbatim, and `git status --porcelain` in the lane **empty**. Then,
through the hook, in that lane:

    method/roles/planner.md   (out of fence)      EXIT=2, naming the fence and the refused path
    app/src/x.ts              (out of fence)      EXIT=2
    app/src/App.tsx           (IN fence)          EXIT=0
    docs/tasks/T-999-x.md     (always writable)   EXIT=0
    app/src/App.tsx, manifest REMOVED             EXIT=2  — refuses, never fails open

*(An earlier attempt on `T-015` refused at step 3 with `STALE PATH … no
such tracked path exists at HEAD` — a property of that card, not of the
rename, and the arm removed the worktree it had cut. Recorded because a
refusal I did not report would look like one I did not get.)*

**A6.4 the arm's own commit identity — a disclosure, not a finding.**
Run with `env -i`, `GIT_CONFIG_GLOBAL=/dev/null` and no configured
`user.name`/`user.email`, the arm's step-1 stamp still committed, as
`ujju <ujju@Mac.lan>` — git's own auto-detection. The arm neither sets
an identity nor fails loudly when none is configured. That is the
already-open `T-239-s4` and the hazard STATE names (*"the runner has no
git identity"*); it is untouched by this lane and I file nothing new.

---

## 5. THE SECURITY SWEEP — the whole diff

290 files, +3326 / −2210, 111 renames. Over every added line: **no**
credential shape (`AKIA`, `PRIVATE KEY`, `ghp_`, `github_pat_`, `xox*-`,
`sk-`, bearer), **no** `password`/`secret`/`token`/`api_key` assignment.
`NPUTER_TEST_SECRET` → `SUPERTASKR_TEST_SECRET` is a test CANARY name,
not a secret. **No new dependency** in any `package.json` or
`Cargo.toml` — every changed line there is a name or a description.
**No** widened allow-rule: `.claude/settings.json` and
`settings.local.json` are untouched by the diff. **No**
`continue-on-error`, `if: false` or `|| true` added, and none exists.
**No** shim keeping the old spelling alive and **no** dynamic assembly
of it. The only new `child_process` use is `execFileSync("git",
["ls-files","-z"])` in `rename-scan.mjs` and its spec — a fixed argv,
no shell, no interpolation. The one new network line is a `user-agent`
string moving from `nputer-landing-gate` to `supertaskr-landing-gate`.
**Nothing at REJECTED level.**

Against ARCHITECTURE and CONVENTIONS (step 4): the C-06 → C-05 seam
still resolves through `file:../lib/parser`, the C-07 crate keeps its
path-dependency shape, `CLAUDE.md` and `AGENTS.md` are still
byte-identical (`cmp` clean), and the four governing-document budgets
hold. No adjacent feature is quietly broken: the four legs are green.

---

## 6. THE POISON DRILL — every mutant, its landing, its kill set

Planted in a **detached scratch worktree** at the tip
(`…/scratchpad/work-V-T-264/mut`, its own `node_modules` and its own
`target/`), **never** in the bench's working tree and **never** in the
lane. Every landing read back from `git diff -U0`, never from the
mutator. Every restoration verified by `shasum -a 256` against
`git show 69b86b1:<path>`; **every one matched.**

| mutant | side | landing | kill set |
|---|---|---|---|
| **M1** | CODE | `RUNTIME_DIR = ".supertaskr"` → `".nputer"` | **4** — identifier-rename's two migration bodies (via their positive control) + lane-fence.spec `:750`, `:810` |
| **M2** | CODE | `legacyRuntimeDirProblem` returns `null` unconditionally | **3** — the whole migration family |
| **M3a** | CODE | `BOOT_PORT_ENV = "SUPERTASKR_BOOT_PORT"` → `"NPUTER_BOOT_PORT"` | **1** — the survivor body |
| **M4** | CODE | `MANIFEST_REL_PATH` → `".nputer/lane-fence.json"` | **3** — a migration body + lane-fence.spec `:750`, `:810` |
| **M5a** | DATA | `identifier` → `dev.nputer.app` | **1** — the survivor body |
| **M5b** | DATA | capability `identifier` → `nputer-default` | **1** — the survivor body |
| **M6** | CLASSIFIER | `repository-directory` widened to `/nputer/i` | **1** — the survivor body's POSITIVE CONTROL |
| **M6b** | CLASS TABLE | a `phantom` class nobody hits | **1** — the occupancy body |
| **M6c** | CODE | `[lib] name` → `nputer_lib` | `cargo build --locked` **exit 101** |
| **M1c** | CORPUS | `// target/debug/nputer` appended to `app/src/main.tsx` | **1** — the survivor body |
| **M7a** | DATA | ONE `supertaskr-index` in `graph.json` → old | `index --check` **exit 1 STALE** + **4** dogfood bodies |
| **M7b** | DATA | 20% of `graph.json`'s file nodes dropped | `index --check` **exit 1** + **5** dogfood bodies |
| **M8b** | DATA | the old name stripped from a checkpoint record | **1** — the records floor |
| **M8a** | DATA | one line APPENDED to that checkpoint | **SURVIVED** — exit 0, 6 passed |
| **M8c** | DATA | one line APPENDED to a non-T-264 card | **SURVIVED** — exit 0, 6 passed |
| **M9** | DOC | one CONVENTIONS command spelling | **4** — `{648, 679, 904, 928}` |
| **M10** | CI | the same step in `ci.yml`, CONVENTIONS untouched | **2** — `{663, 679}` |
| **M11** | DATA | `.supertaskrignore` gains `app/src/architecture/` | `index --check` **exit 1 STALE** |
| **M13** | DATA | `lib/parser/package-lock.json` name → `@nputer/parser` | `npm ci` **exit 0 (!)**; killed by the survivor body |
| **M14** | CODE | the indexer's `--root` default → a nonexistent path | `cargo test --test cli` **exit 0 (!)**; bare `index` **exit 3**, refusing loudly |

**Three things this drill establishes that a count would not.**

**One — the site the property lives.** For a rename, that site is the
CORPUS, and the mutants that matter are data mutants aimed at it. M5a,
M5b, M3a, M1c and M13 each move exactly one byte-string of product data
and each is caught by the same body — which is the correct shape here,
not a weakness: one scan is the guard for every identifier class at
once, and the classifier that scan trusts is itself guarded by M6.

**Two — no tautology.** M1 was the one at risk: both sides of the
migration bodies import the constants, so swapping the constant could
have kept every assertion true. It does not, because the body's first
act is a positive control on the arrangement WITHOUT the old directory.
**M8a and M8c are the two that survive**, and they are the finding
below rather than a defect: the landing they probe is clean, proved
independently by blob manifest.

**Three — two facts worth carrying forward.** `npm ci` does **not**
reject a lockfile whose `name` disagrees with `package.json` (M13
exit 0), so A1.4's assumption that the installer would catch it is
FALSE — the scan is what catches it. And the indexer's `--root` default
is exercised by no body (M14), though the tool refuses correctly when
run.

---

## 7. FINDINGS ROUTED, AND WHAT I FILED

**Routed to `T-265` under the dispatcher's scope ruling — NOT F2 for
this lane.** `method/` still spells the identifiers at the tip, on 11
files / 22 lines, unchanged from `fe2a2aa`. The identifier-class
occurrences, enumerated so `T-265` need not re-derive them:

- `method/runtime/nputer.yaml` — the FILE NAME, and `include_str!`'d by
  `app/src-tauri/src/agent/kit.rs` and read by literal path from
  `tools/e2e/scripts/token-scan.mjs:1235`. **These three move together
  or two bodies red by name** — `the_shipped_plan_interview_still_carries_the_normative_banking_map`
  and the token-scan walk.
- `method/README.md:52-53` (`.nputer/`, `nputer.yaml`)
- `method/roles/planner.md:20,21,22,92` (`.nputer/` line, the
  `.nputer/nputer.yaml` seed, `runtime/nputer.yaml`, a runtime cache path)
- `method/runtime/sessions-schema.md:1,3,34` and
  `transcript-schema.md:1,3,5` (`.nputer/`, `nputer.yaml`)
- `method/tasks/TASK-FORMAT.md:22` (`nputer.yaml default`)
- `method/interview/plan-interview.md:37` — the stage-0 banking cell,
  whose verbatim copy is `app/src/genesis/genesis-derive.ts`'s
  `BANKING_MAP`. **Moving either alone reds `every cell of the 9-row
  table matches plan-interview.md verbatim`.**
- `method/adapters/{CLAUDE,AGENTS}.md`, `method/docs-protocol.md`,
  `method/interview/archaeology.md` — one line each.

**Also outside this lane's fence, for whoever owns the prose pass**:
`docs/STATE.md` (4 identifier lines, incl. `.nputer/holder.json`,
`NPUTER_CANCEL_CI`, `nputer-index`), `docs/VERSIONS.md` (3),
`docs/CAPABILITIES.md` (3, which the census regen fixes),
`docs/ROADMAP.md` (1), `docs/NORTH_STAR.md` (1). And
`bin/app-dev.mjs`, already routed by the executor as `T-264-s2`.

**Filed as `status: suggested`, never folded into the verdict:**

- **`T-264-s6`** — the records guard is a CONTENT floor, not a path pin;
  M8a and M8c survive it, and AC-4 asked for a body pinning that the
  record paths did not change.
- **`T-264-s7`** — the indexer's `--root` default is pinned by no body;
  M14 passes `cargo test --test cli` at exit 0 over 16 bodies.

The executor's own four (`T-264-s2` … `T-264-s5`) are on the board, well
formed; none opens its title with a backtick or a symbol, and
`npm run lint:docs` and the parser suite are green over all six.

---

## 8. THE ASSIGNED CORRECTIONS — the integrator's, at the merge

**CORRECTION 1 — regenerate the census IN THE MERGE COMMIT.**
`npm run capabilities:check` from `tools/e2e/` exits **1 — STALE**,
committed **58326** bytes against a fresh **58883**. This is correct for
the lane (`docs/CAPABILITIES.md` is outside its fence) and is
CONVENTIONS' own rule. I ran `npm run capabilities` in a scratch clone
and the delta is EXACTLY, and only:

- the header: `684 behaviours — 682 extracted + 2 named-not-extracted —
  across 37 spec files` → `690 behaviours — 688 extracted + 2 — across
  38 spec files`
- three renamed sentences: `NPUTER_BOOT_PORT=1420 is refused by the
  resolver …` and `the real script refuses NPUTER_BOOT_PORT=1420 with
  exit 3, probing nothing` → `SUPERTASKR_BOOT_PORT`; and
  `.nputerignore still excludes docs/ …` → `.supertaskrignore …`
- one new section, `## identifier-rename`, with its six sentences

Nothing else moves. If the regenerated file differs from that, something
changed between this verdict and the merge.

**CORRECTION 2 — re-arm the INTEGRATION CHECKOUT's own runtime directory
under the new name, after the merge.** `/Users/ujju/Projects/nputer`
still holds a pre-rename `.nputer/` with its holder record and verdict
token. I have direct evidence rather than an inference: during this pass
its installed push-guard fired on a command of mine and printed *"It
writes `.nputer/gate-verdict.json`"*. **The moment this merge lands,
that checkout's own tooling will refuse by name** — which is the
criterion working, not a defect — and every arm that reads a manifest or
a token will say so until:

    node tools/e2e/scripts/brief.mjs --take-seat        # writes .supertaskr/holder.json
    node tools/e2e/scripts/gate-run.mjs --all           # mints .supertaskr/gate-verdict.json

are run from it, after which `.nputer/` is removed. Run the battery LAST,
as STATE requires, or the fresh token is stale on arrival. The same
applies to `../nputer-app` and to any bench or lane a session still
holds.

**CORRECTION 3 — move the lane branch to THIS verdict commit before
merging** (room 17, STATE's hazard list). This verdict and the two cards
are commits the lane's tip does not have.

---

## 9. WHAT I MEASURED AT MY OWN TIP — verifier.md step 7

Steps 5 and 6 are writes: this verdict and two suggestion cards. Prose is
a code input here, so I re-ran the gates my own commits can move, at the
commit I created rather than the one I was sent. Their exits are in the
report accompanying this verdict. **Every figure in §1 is stamped at
`69b86b1`**, the commit under review, and is stale at my own tip by
exactly the three files I wrote — none of which any suite counts as a
body.

