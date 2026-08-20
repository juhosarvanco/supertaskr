---
id: T-077
title: A cross-file issue can be read, not just counted
feature: F-02
milestone: 4
priority: 36
size: S
status: done
blocked_by: []
touches: [app-shell]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @T-077
verified_by:
review: self-verified
---

Absorbs: T-053-s1 (fourth triage, 2026-08-19). The suggestion file is
removed in the same commit as this card. Filed against `lib-parser`'s
output but fixed in the app: T-053's fence was the parser and its
criterion 6 said to STOP rather than edit an app file, and the shape is
an app decision anyway.

THE COUNT IS RIGHT AND THE LIST IS EMPTY. Measured through the app's own
`applySnapshot` over T-053's fixture, run with vite-node and no app file
touched: `model.issues.length` — the number `App.tsx` renders in the
status line — is **2**, while `failures.length` — the list the parse
error details strip iterates — is **0**. `failingIssues` in
`docs-model.ts` only marks a file failed when a record was WITHHELD by
the identity gate or the roadmap produced zero features. An `aliased-id`
is neither: every record parses, so the file is healthy and only the SET
is wrong. The human sees the counter tick from `0 issues` to `2 issues`
with nothing anywhere on screen saying what they are — **the board's
least actionable state**, because a count that cannot be expanded reads
as a bug in the app rather than a fact about the docs.

PRE-EXISTING AND WIDER THAN T-053. Every cross-file issue kind has
always been count-only: the component `aliased-id`, `ambiguous-mapping`,
`dependency-cycle`, and every `dangling-reference` from project
validation. T-053 only made it reachable by a plausible input — an
interview-written backbone, where a language model spells the same
number two ways — which is why it is worth filing now rather than when
somebody hits it.

## Acceptance criteria
- `model.issues` that are NOT already represented in `failures` SHALL
  render as their own rows in the same details strip, keyed by kind plus
  ids, so the count and the list can never disagree about how many
  problems the docs have. One component, no new store state.
- EACH ROW SHALL NAME THE FILES AND THE SPACE. The issue already carries
  `files`, and since T-053 the alias carries `space`; **T-076 extends
  `space` to `duplicate-id`**, so this card SHALL read the field where
  it exists and degrade cleanly where it does not, rather than
  hard-coding either shape.
- WHETHER a cross-file issue row is CLICKABLE to the files it names
  SHALL be ruled, not assumed. The data is there; the interaction is a
  product call and SHALL be recorded either way.
- A PIN SHALL MAKE THE FAILURE MODE IMPOSSIBLE TO REINTRODUCE: a
  snapshot whose ONLY problem is cross-file SHALL produce a NON-EMPTY
  expandable strip, so a count that cannot be expanded reds. A pin that
  only asserts the count would pass today with the hole open.
- THE STRIP'S EXISTING BEHAVIOUR FOR WITHHELD RECORDS AND ROADMAP
  FAILURES SHALL BE UNCHANGED, and the containment discipline the strip
  already has SHALL extend to the new rows — a cross-file message names
  ids that came off disk, so it is file-derived text like everything
  else in that strip.

Verification: headless app Vitest at DOM level, driving the real
reducers with a fixture carrying only cross-file issues.

## Implementation notes

Built by `claude-opus-5 @T-077` on `task/T-077-cross-file-rows`, cut from
main's tip `2cf59da` (a `Checkpoint:` commit, per DISPATCH FROM THE LAST
CHECKPOINT). Size S, so no verifier and no separate integrator: the
adversarial pass below is the executor's own. **Not merged** — branch and
worktree are left for the integrator.

### The premise reproduces, and the shape of it is wider than the title

Measured at `2cf59da` through the app's own `applySnapshot` over T-053's
fixture: `failures.length` **0**, `model.issues.length` **2**. The strip
did not merely render empty — its condition was
`failures.length > 0 || skipped.length > 0`, so the `<ul>` **did not
exist**, and `App.tsx` printed `2 issues` over nothing at all.

**Criterion 1 is broader than the card's title, deliberately and by its
own words** — "`model.issues` that are NOT already represented in
`failures`". That set is not just the four cross-file kinds: it also
holds every `dangling-reference`, every `id-mismatch`, every
`filename-id-missing`, and every SOFT issue on a record that still
parsed. Narrowing to "cross-file" would have required classifying kinds,
which is exactly the shape hard-coding criterion 2 forbids — and a
structural spelling of "cross-file" (`files.length > 1`) would have
**excluded the card's own headline case**, since the feature `aliased-id`
names `docs/ROADMAP.md` twice by contract. So the criterion was
implemented as written.

### What landed — one component, one pure derivation, no store state

`app/src/lib/docs-model.ts` gains four exported pure functions and one
interface, beside `skipReasonPhrase`, which is the strip's existing
helper and the precedent for putting details-strip vocabulary here:

- `issueFiles(issue)` — the distinct files an issue names.
- `issueIds(issue)` — the ids it names, for keying.
- `issueSpace(issue)` — the id space, or `undefined`.
- `modelIssueRows(issues, failures)` — the rows the count owes.
- `ModelIssueRow` — `{ key, kind, space?, files, message }`.

`app/src/App.tsx` gains ONE component, `ModelIssueRows`, defined beside
`ParseErrorBadge` and `SkippedFilesBadge` (the file's own idiom for shell
chrome), and one derivation at render:
`const issueRows = modelIssueRows(model.issues, failures)`. The strip's
condition gains `|| issueRows.length > 0`. Nothing else moved.

**REPRESENTED IS A STATEMENT ABOUT FILES, NOT ABOUT SENTENCES**, because
that is what a failure row is. An issue is dropped when it names at least
one file and EVERY file it names already has a failure row. A file that
never parsed is therefore reported once, not twice — its issues ride
`model.issues` as well, because `effective` carries the failing content
when there is no last good — while a cross-file issue straddling a broken
file and a healthy one still gets its row. Deliberately not a message
comparison: prose is never the discriminator in this union.

The row reads `kind`, `space` where present, and the files, and carries
`data-issue-kind` and `data-issue-space` so a consumer never has to read
the prose either.

### Criterion 2 — how `space`'s two shapes are handled

**By reading the FIELD, never by switching on the kind.** `issueSpace`
is `typeof (issue as {space?: unknown}).space === "string" ? … :
undefined`, and `issueFiles`/`issueIds` do the same for
`files`/`file` and `ids`/`id`. The set of kinds carrying `space` has
already moved twice (T-053 gave it to `aliased-id`, T-076 to
`duplicate-id`) and `dangling-reference`, `dependency-cycle` and
`ambiguous-mapping` still carry none — so a kind list would be wrong the
next time the parser grows a member, and wrong in the SILENT direction: a
real space rendered as nothing.

**Where the field is absent the row says nothing about space rather than
inferring one.** `dependency-cycle` is task-shaped today and
`ambiguous-mapping` is component-shaped today, and inferring either is
the prose-reading T-053 ruled out. The degradation is asserted as an
ABSENCE — `hasAttribute("data-issue-space")` is `false`, not `""` — and
the mutant that switches on kind instead (M7 below) reds exactly that
body and nothing else.

### Criterion 3 — THE RULING: a cross-file row is NOT clickable, and why

**Ruled, not omitted.** The reasoning is in the code beside the component
and repeated here.

1. **There is no capability to click INTO.** The app's IPC surface is
   THIRTEEN commands (13 `#[tauri::command]`, 13 in `generate_handler!`)
   and not one of them opens, reveals or resolves a path. Opening a file
   is a NATIVE surface, and ADR-012 puts native surfaces behind an
   app-defined Rust command with the webview grant set staying exactly
   `core:default` — and specifically with *"sensitive values like picked
   paths never transit the webview"*. A clickable row pushes a docs path
   FROM the webview INTO a native opener: the exact direction ADR-012
   refuses by default. Building it means a new command or a new grant,
   both of which are an ADR-level decision and neither of which fits a
   size-S `app-shell` fence.
2. **The in-app alternative is not total, and a partial affordance is
   worse than none.** Two of the four cross-file kinds routinely name
   `docs/ROADMAP.md`, which the board draws no card for; component files
   live on the MAP pane, not the board; and the issue names PATHS while
   the board is keyed on ids. A row that navigates for some kinds and
   silently does nothing for others teaches the human that the strip is
   broken.
3. **The strip's established idiom is inert diagnostic text.** The
   failure rows and the skip rows beside these are plain `<li>`s, and
   criterion 5 pins that idiom for the new rows.

**What is NOT ruled here** is the product question one level up — *should
the app be able to reveal a docs file at all?* That is @human's and the
architect's, it is bigger than this card, and it is filed as `T-077-s4`
rather than decided silently in either direction.

### Criterion 5 — containment, and the one existing behaviour that moved

The rows are plain React text children in the same `<li>` with the same
`className` inside the same `<ul>`; no markup sink, no attribute
injection. Pinned with a fixture whose task FILENAME is
`docs/tasks/T-01-<img src=x onerror=boom>.md` — a legal task path, since
the filename is free-form beyond `T-` — asserting the row contains no
`<img>` element and names the path verbatim.

**ONE EXISTING TEST FIXTURE WAS CORRECTED, AND NO EXISTING ASSERTION WAS
WEAKENED.** `app/test/watcher-truth.test.tsx`'s `BASE_FILES` was meant to
be "a clean board" and was not: its backbone bullet was a NUMBERED line,
which `- F-NN:` does not match, so the roadmap parsed ZERO features (and
reported nothing — an empty backbone is a legal state); and its task was
`status: building` with no placement fields, so it parsed into a record
carrying FOUR `missing-field` issues. That board read `0 features · 4
issues` throughout the file while "recovery clears the chip and the
strip" asserted an EMPTY strip — true only because a counted issue had
nowhere to appear, which is this card's own defect sitting inside the
repo's own fixture. The bullet is now the documented shape and the task
carries its placement; **all five assertions in that file are
byte-unchanged** and 5/5 pass. Poisoning the fixture back (M6) reds
exactly that one body, so the correction is load-bearing rather than
cosmetic.

### Criterion 4 — the pin, its mutant, and the count-only comparison

`app/test/cross-file-rows.test.tsx`, 7 bodies, DOM level through the real
store via the dev harness, with the shipped parser owning every message —
no hand-built issue objects anywhere in the file.

**THE MUTANT (M1), one-sided, production only:** revert the strip's
condition to the pre-T-077
`{(failures.length > 0 || skipped.length > 0) && (` and leave everything
else in place. The mutated text was read back with `git diff` before any
suite ran.

**THE COMPARISON THE CRITERION ASKS FOR, run in that same poisoned
tree:**

| pin | fixture | exit |
|---|---|---|
| count-only (`model-counts` contains `2 issues`) | T-053's aliasing pair | **0 — SURVIVES** |
| this card's (`parse-error-details` renders, 2 rows) | the same fixture | **1 — REDS** |

The count-only pin was written as a scratch body in the drill tree and
deleted; the failure message from the real pin is *"the details strip
renders on a cross-file-only snapshot: expected null not to be null"* —
the strip does not exist under M1, which is precisely what a count-only
assertion cannot see.

**AND M1 REDS EXACTLY ONE BODY.** The criterion-2 and criterion-5
fixtures each carry a broken file of their own so the strip renders from
`failures` regardless; only the criterion-4 body stands on a snapshot
where `failures` and `skipped` are both empty. So reopening the hole reds
the body that names it and nothing else — poison shape SIX answered by
construction rather than by assertion.

### The poison drill — nine mutants, at commits, every mutation read back

Correspondence established by hash BEFORE anything was mutated: for all
four touched files, `shasum -a 256 <file>` equals
`git show <commit>:<file> | shasum -a 256`. Drilled at `ee30c09` (rounds
1–6) and re-run whole at `131e7a8`/`29c43fc` after the drill's own
findings changed the suite. **DRILLED AT A COMMIT** (`T-072-s1`) — every
restoration proof compares against a commit that contains the work.
Mutated in `../nputer-T-077`, which no `tauri dev` watches, so nothing
was hot-pushed into the human's window.

| # | mutant | side | exit | bodies red |
|---|---|---|---|---|
| M1 | strip condition back to pre-T-077 | App.tsx | 1 | **1** — the criterion-4 body ONLY |
| M2 | the `continue` that drops represented issues, deleted | docs-model.ts | 1 | 4 |
| M3 | `issueSpace` always returns `undefined` | docs-model.ts | 1 | 2 |
| M4 | `issueFiles` names only the FIRST file | docs-model.ts | 1 | 2 |
| M5 | the row rendered with `dangerouslySetInnerHTML` | App.tsx | 1 | 2 (mine + the standing no-innerHTML gate) |
| M6 | `BASE_FILES`' backbone bullet reverted to the numbered form | watcher-truth.test.tsx | 1 | **1** — the T-018 recovery body |
| M7 | `issueSpace` switched on KIND instead of reading the field | docs-model.ts | 1 | **1** — the criterion-2 body ONLY |
| M8 | `files.every(...)` → `files.some(...)` | docs-model.ts | **0 — SURVIVED** | **0** |
| M9 | the failed-path set filtered to task files | docs-model.ts | 1 | **1** — the roadmap body ONLY |

Every restoration proved twice: empty `git diff -- <path>` AND sha256
against `git show <drill commit>:<path>`. Working tree `git status
--porcelain` empty at the end of every round.

**THE DRILL FOUND THREE THINGS IN MY OWN WORK, and all three are fixed
rather than filed.**

1. **Two assertions were satisfiable without the property.** The task
   `aliased-id` MESSAGE already quotes both paths, so `toContain` over
   the whole row stayed GREEN with the row's own file list deleted — the
   vacuous-green shape wearing the drill's costume. The bodies now assert
   the segment BEFORE the em-dash separator by exact equality, which is
   this component's own contribution and nothing else's. M4 reds only
   after that change.
2. **POISON SHAPE SIX, IN MY OWN FILE.** The roadmap body asserted "a
   roadmap failure adds no issue row" while running AFTER a body that had
   already banked a good roadmap — the watcher store is a module
   singleton whose last-good map is keyed by PATH, and `docs/ROADMAP.md`
   is the one path every body writes. `effective` therefore rendered the
   LAST GOOD parse, `model.issues` was EMPTY, and the body killed no
   mutant the task-file body beside it did not: under M2 three siblings
   red and it stayed green. It now runs FIRST, where the roadmap has
   never parsed, and **the ordering is asserted rather than assumed** —
   the failure row must not read "showing last valid state", which is
   exactly what it says if the body is ever moved down. M9 now reds it
   and nothing else.
3. **POISON SHAPE SEVEN — a mutant no body killed — FOUND AND CLOSED
   RATHER THAN FILED.** M8 swapped `every` for `some` and left the whole
   suite at **839/839, exit 0**. The two are not equivalent and the
   difference is REACHABLE: a file that fails AFTER banking a good parse
   sits in `failures` while its last-good RECORD is still in the model,
   so a `duplicate-id` can name it beside a perfectly healthy file, and
   `some` would swallow that report entirely. One body now drives exactly
   that snapshot pair (bank two clean tasks, then break one and let the
   other claim its id); re-running M8 against it reds that body alone.

### Suites, every number derived at this ref, every exit read unpiped

Baseline re-derived first, in this worktree at `2cf59da`, because a
figure copied from a brief is a figure about a different tree. **A FRESH
WORKTREE HAS NO `node_modules` EITHER** — the fresh-clone ORDER was run
in full (lib/parser `npm ci` + `npm run build`, then app `npm ci`, then
tools/e2e `npm ci`), and only then `npm run build` before any suite.

- **app at `2cf59da`: 833/833 across 42 files**, `APP_TEST_BASE_EXIT=0`,
  after `APP_BUILD_BASE_EXIT=0`. The brief's figure reproduces exactly.
- **app at this tip: 840/840 across 43 files**, `APP_TEST_EXIT=0`. +7 is
  the seven new bodies; the 42 → 43 file count is the new test file.
- **`npm run build` `APP_BUILD_EXIT=0`, 265 modules transformed.** JS
  `index-CCC211k4.js` 501.62 kB → `index-kNOKiTKD.js` 502.75 kB. **The
  CSS is BYTE-IDENTICAL to main's** — `cmp` exit 0 against the baseline
  build, same content hash `index-CwYF5FQb.css` at 43.95 kB — which is
  the honest form of "zero new tokens", and it was NOT true of the first
  draft (below).
- **parser: 263/263 across 12 files**, `PARSER_EXIT=0`; `npx tsc
  --noEmit` `PARSER_TSC_EXIT=0`. Its smoke test parses this repo's live
  `docs/` tree and requires ZERO issues, which is what makes this card's
  own five new suggestion files a dogfood check rather than paperwork.
- **token lint: `LINT_TOKENS_EXIT=0`** — *clean (TOKEN 120 files under
  app/src, app/test, tools/e2e; CONTROL 574 tracked text files)* — and
  **`LINT_SELFTEST_EXIT=0`**, 49 TOKEN + 4 CONTROL samples, 71
  walk-policy checks, 8 evidence-floor checks.
- **CONTROL and TOKEN re-derived from `git ls-tree` at BOTH refs**, using
  `SKIP_DIRS` and `CONTROL_BINARY_EXTENSIONS` read out of
  `token-scan.mjs` (18 binary-suffix matches at both):
  `2cf59da` tracked **591** → CONTROL **573**, TOKEN **119**; this tip
  tracked 592 → CONTROL 574, TOKEN 120. **The brief's 573/119 reproduce.**
- **`cargo build -p nputer-index` `CARGO_INDEX_BUILD_EXIT=0`.** The
  Rust workspace suite was NOT run: this branch is a 0-path diff under
  `app/src-tauri/**`, `cargo test` is unmoved by construction, and the
  boot gate below already builds and RUNS the binary.

### THE TOKEN LINT CAUGHT A REAL DEFECT IN THIS CARD'S FIRST COMMIT

Worth recording because the near-miss is instructive and because the
gate's own message names the symptom exactly.

The list-key separator landed as a **raw 0x00 byte** in
`app/src/lib/docs-model.ts`, twice, rather than as an escape. `file(1)`
called the file **`data`**; `grep` reported **NO MATCH** for
`modelIssueRows` and `ordinal` in a file that contained both — a false
refutation, not a miss; and `npm run lint:tokens` exited **1** with
*"byte 9203: U+0000 [P5: literal control character (invisible to
binary-skipping searchers)]"*. Fixed, and the read-back is a **byte
census** (`[i for i,c in enumerate(bytes) if c < 0x20 and c not in
(9,10)]` → `[]` on all four touched files) rather than a substitution
count — the T-078 lesson applied one level down: a count can be right
while the BYTES are wrong. Filed as `T-077-s3`, because a grep miss over
a file carrying a control byte is evidence of nothing and CONVENTIONS'
citation bullet does not say so.

**AND THE SAME COMMIT SHIPPED 583 BYTES OF DEAD CSS.** The local
identifier `ordinal` became the Tailwind default utility `.ordinal` plus
the whole `font-variant-numeric` `--tw-*` family: the stylesheet went
43.95 kB → 44.53 kB with no styling change. Attributed by three builds
and a selector-set difference (one rule added, none removed), then
bisected file by file. **This is `T-072-s5`'s leak arriving from
`app/src` rather than `app/test`, which makes it that finding's own
option 3 measured** — see `T-077-s2`. Renamed; the stylesheet is
byte-identical to main's now.

### THE TWO MERGE GATES — BOTH FIRE, BOTH RUN, DERIVATIONS STATED

Main had NOT moved while this lane ran: `git rev-parse main` is
`2cf59da`, which is also `git merge-base main HEAD`. **That is the
degenerate case in which the forbidden form is indistinguishable from
the prescribed one**, so all four spellings agree at **4 paths** and
none of them is evidence for the others:

    git merge-tree --write-tree 2cf59da HEAD   -> tree fdeca7ef…, exit 0   THE PRESCRIBED FORM
    git diff --name-only 2cf59da <TREE>        (no dots)   -> 4
    git diff --name-only main...HEAD           (THREE dots) -> 4
    git diff --name-only main..HEAD            (TWO dots)   -> 4   THE FORBIDDEN PRE-MERGE FORM
    git diff --name-only $(git merge-base main HEAD)..HEAD (TWO) -> 4

The four paths: `app/src/App.tsx`, `app/src/lib/docs-model.ts`,
`app/test/cross-file-rows.test.tsx`, `app/test/watcher-truth.test.tsx` —
plus this card and five `T-077-s*.md` under `docs/`, which match neither
trigger.

| gate | trigger | paths | verdict |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` outside `docs/` | **4 of 4** | **FIRES** |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **2** (`App.tsx`, `docs-model.ts`) | **FIRES** |

**BOOT GATE — RUN, `BOOT_CHECK_EXIT=0`**, from `tools/e2e` (not `app/`),
`NPUTER_BOOT_PORT=19851 npm run boot:check`. Both `[nputer]` lines
detected: *`[nputer] project folder: /Users/ujju/Projects/nputer-T-077`*
and *`[nputer] window "main" created`*; the process tree stopped itself
(`exit=null signal=SIGTERM`). Port 19851 bind-probed FREE on all four
stacks (`127.0.0.1`, `0.0.0.0`, `::1`, `::`) before use — an IPv4-only
probe of a v6 listener reports free, which is why all four — and chosen
away from the lane's 14520 default and from STATE's 19841/19843.

**GRAPH REGEN — OWED, ASKED, AND DELIBERATELY NOT COMMITTED.** The regen
belongs to the checkpoint (CONVENTIONS), so no regenerated `graph.json`
is on this branch. `cargo run -p nputer-index -- index --check --root
../..` from `app/src-tauri` exits **1**, and it is a **REAL red, not the
`--root` false red** — it prints both count lines plus the file diff,
where a false red prints `committed: MISSING`:

    committed:   576271 bytes · 118 files · 996 symbols · 1520 edges
    fresh index: 585305 bytes · 119 files · 1018 symbols · 1539 edges
    files  +1  -0  ~3        edges  +20  -1

(The committed figures match the brief's `2cf59da` graph exactly.)

**THE INTEGRATOR OWES MORE THAN A REGEN HERE, AND THIS IS THE HEADLINE
FOR WHOEVER MERGES IT.** Unlike the last several app merges, this branch
**ADDS an indexed file** — `app/test/cross-file-rows.test.tsx`, and
`C-05`'s `paths:` claims `app/test/**`, so it maps. `files +1` therefore
moves BOTH app dogfood fixtures, which a pure `~`-only regen would not:

- `app/test/architecture-dogfood.test.ts` — `expect(derived
  .fileComponent.size).toBe(118)` → **119**, its enclosing test NAME
  *"all 118 files map — zero unclaimed territory after the §2
  amendments"*, and C-05's row in the mapping table beneath it.
- `app/test/map-dogfood-render.test.tsx` — the pinned index hint
  *"committed graph · 118 files"* → **119**.
- `lib/parser/test/smoke.test.ts` HOLDS: the component REGISTRY did not
  change (`git diff … -- docs/architecture/components/` is a 0-file
  diff), which is T-024-s5's own carve-out.

The twenty new edges are all intra-C-05 or to packages already in the
graph (`react`, `react-dom`, `vitest`), so no cross-component relation
and no `observedCount` should move; the one removed edge is the
`App.tsx → docs-model.ts` import re-emitted with three symbols instead
of one.

### What actually reached the human's running app: NOTHING

**Port 1420 was read with `lsof -nP -iTCP:1420 -sTCP:LISTEN` and with
nothing else**, before and after. No bind, no connect, no signal, on any
interface. The holder is `node` pid **82549**, one socket, `TCP
[::1]:1420 (LISTEN)`, identical at both ends — the IPv6-only listener
CONVENTIONS records. The app process **85379** (ppid 82364, started
2026-08-20 00:20:43) is alive and unchanged: every write, every build,
every mutation and the boot check all happened in `../nputer-T-077`,
which no `tauri dev` watches, and the boot check ran on its own scratch
port against its own vite. `npm ci` was never run in the main checkout.
No `pkill` at any point; the `nputer-T-060` orphans (52504/52505) were
left alone.

### Corrections and things this card noticed but did not do

- **THE BRIEF IS RIGHT ON EVERY FIGURE I COULD CHECK.** `2cf59da` is
  main's tip and IS a `Checkpoint:` commit; CONTROL **573** and TOKEN
  **119** re-derive from `git ls-tree` at that ref; app **833/833 over
  42 files** reproduces; the graph's committed **576271 B / 118 files /
  996 symbols / 1520 edges** is exactly what `index --check` prints. The
  session's own `gitStatus` snapshot was the stale artefact — it showed
  `e83ee1d` as the tip, which is eleven commits back — and the tree
  settled it.
- **One clause of the brief could not be satisfied as written**: *"expect
  819/831 until `npm run build` runs once"* presumes an installed
  worktree. A fresh `git worktree add` has no `node_modules` anywhere, so
  the fresh-clone ORDER runs first and `npm run build` is the fourth
  command, not the first. Nothing was wrong with the advice — the
  precondition was.
- **`docs/STATE.md` at `2cf59da` describes T-081 under "Just completed"
  while its own header line reads "(T-074 and T-072 merged and
  checkpointed)"**, and the two `Checkpoint:` commits since T-081's have
  not rewritten the body. Left alone: STATE is the architect's file and
  this is an `app-shell` fence.
- Five findings filed: `T-077-s1` … `T-077-s5`. None of them expanded
  this card's scope.

## Verdicts
